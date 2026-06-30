import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { checkIsLate, getJakartaTimeString, getJakartaDateString } from '@/lib/date-utils'
import { recordLog } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request)
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      )
    }

    const { token, face_image, is_face_only } = await request.json()

    if (!token && !is_face_only) {
      return NextResponse.json(
        { success: false, message: 'Token QR atau metode verifikasi wajah diperlukan.' },
        { status: 400 }
      )
    }

    const todayStr = getJakartaDateString()
    const today = new Date(todayStr)
    const currentTimeStr = getJakartaTimeString()
    const currentShortTime = currentTimeStr.substring(0, 5)

    // Fetch settings for late check and type detection
    const checkInTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_in_time' } })
    const checkOutTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_out_time' } })
    const toleranceSet = await prisma.setting.findUnique({ where: { key: 'office_late_tolerance_minutes' } })

    const officeCheckInStr = checkInTimeSet?.value || '08:00'
    const officeCheckOutStr = checkOutTimeSet?.value || '17:00'
    const toleranceMinutes = Number(toleranceSet?.value || '15')

    const userId = userPayload.userId

    // Find the session by token or active session today
    let session = null
    if (token) {
      session = await prisma.attendanceSession.findFirst({
        where: { qr_token: token },
      })
      if (!session) {
        return NextResponse.json(
          { success: false, message: 'Token tidak ditemukan. Pastikan QR Code benar.' },
          { status: 404 }
        )
      }
      // If QR token is passed, session must be active
      if (session.status !== 'active') {
        return NextResponse.json(
          { success: false, message: 'Sesi absensi tidak aktif atau sudah ditutup.' },
          { status: 400 }
        )
      }
      // Check QR is not expired
      if (new Date() > new Date(session.qr_expires_at)) {
        await prisma.attendanceSession.update({
          where: { id: session.id },
          data: { status: 'expired' },
        })
        return NextResponse.json(
          { success: false, message: 'QR Code telah kedaluwarsa. Hubungi admin untuk QR baru.' },
          { status: 400 }
        )
      }
    } else if (is_face_only) {
      // Look for active session today
      session = await prisma.attendanceSession.findFirst({
        where: { session_date: today, status: 'active' },
        orderBy: { created_at: 'desc' },
      })
    }

    // Fetch user's existing attendance for today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        user_id: userId,
        attendance_date: today,
      },
    })

    // Determine type: check_in or check_out
    let attendanceType: 'check_in' | 'check_out' = 'check_in'
    if (existingAttendance) {
      if (existingAttendance.check_out_time) {
        return NextResponse.json(
          { success: false, message: 'Anda sudah melakukan absen masuk dan pulang hari ini.' },
          { status: 400 }
        )
      }
      // If checked in but not checked out, next scan is always check_out
      attendanceType = 'check_out'
    } else {
      // No attendance record today: first scan is check_in
      attendanceType = session ? (session.type as 'check_in' | 'check_out') : 'check_in'
    }

    if (attendanceType === 'check_in') {
      // Since existingAttendance is checked above, it is guaranteed null here
      // but let's double check if there's any session check-in rules if needed

      // Determine tardiness
      const isLate = checkIsLate(currentTimeStr, officeCheckInStr, toleranceMinutes)
      const status = 'hadir'

      // Save attendance
      const attendance = await prisma.attendance.create({
        data: {
          user_id: userId,
          session_id: session ? session.id : null,
          attendance_date: today,
          check_in_time: currentShortTime,
          status,
          face_image_in: face_image || null,
        },
      })

      const lateMessage = isLate ? ` (Anda terlambat ${Math.round(
        (new Date(`2000-01-01T${currentShortTime}`).getTime() - 
         new Date(`2000-01-01T${officeCheckInStr}`).getTime()) / 60000
      )} menit)` : ''

      await recordLog('Absen Masuk', `Berhasil melakukan absen masuk pukul ${currentShortTime} WIB.${lateMessage}`, userId)

      return NextResponse.json({
        success: true,
        type: 'check_in',
        message: 'Absen masuk berhasil, semangat bekerja!',
        attendance,
        isLate,
      })

    } else {
      // Check Out: find the existing check-in for today
      const existing = await prisma.attendance.findFirst({
        where: {
          user_id: userId,
          attendance_date: today,
        },
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, message: 'Anda belum melakukan absen masuk hari ini.' },
          { status: 400 }
        )
      }

      if (existing.check_out_time) {
        return NextResponse.json(
          { success: false, message: 'Anda sudah melakukan absen pulang hari ini.' },
          { status: 400 }
        )
      }

      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          check_out_time: currentShortTime,
          session_id: session ? session.id : existing.session_id,
          face_image_out: face_image || null,
        },
      })

      await recordLog('Absen Pulang', `Berhasil melakukan absen pulang pukul ${currentShortTime} WIB.`, userId)

      return NextResponse.json({
        success: true,
        type: 'check_out',
        message: 'Absen pulang berhasil, hati-hati di jalan!',
        attendance,
      })
    }
  } catch (error: any) {
    console.error('Error scanning attendance:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
