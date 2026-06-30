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

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token QR tidak valid.' },
        { status: 400 }
      )
    }

    // Find the session by token
    const session = await prisma.attendanceSession.findFirst({
      where: { qr_token: token },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Token tidak ditemukan. Pastikan QR Code benar.' },
        { status: 404 }
      )
    }

    // Check session is active
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

    const todayStr = getJakartaDateString()
    const today = new Date(todayStr)
    const currentTimeStr = getJakartaTimeString()

    // Fetch settings for late check
    const checkInTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_in_time' } })
    const toleranceSet = await prisma.setting.findUnique({ where: { key: 'office_late_tolerance_minutes' } })
    const officeCheckInStr = checkInTimeSet?.value || '08:00'
    const toleranceMinutes = Number(toleranceSet?.value || '15')

    const userId = userPayload.userId

    if (session.type === 'check_in') {
      // Check if already checked in today
      const existingCheckIn = await prisma.attendance.findFirst({
        where: {
          user_id: userId,
          attendance_date: today,
          check_in_time: { not: null },
        },
      })

      if (existingCheckIn) {
        return NextResponse.json(
          { success: false, message: 'Anda sudah melakukan absen masuk hari ini.' },
          { status: 400 }
        )
      }

      // Determine status
      const isLate = checkIsLate(currentTimeStr, officeCheckInStr, toleranceMinutes)
      const status = isLate ? 'hadir' : 'hadir' // Status tetap hadir, isLate hanya penanda waktu

      // Upsert attendance
      const attendance = await prisma.attendance.upsert({
        where: {
          user_id_session_id: {
            user_id: userId,
            session_id: session.id,
          }
        },
        update: {
          check_in_time: currentTimeStr.substring(0, 5),
          status,
          attendance_date: today,
        },
        create: {
          user_id: userId,
          session_id: session.id,
          attendance_date: today,
          check_in_time: currentTimeStr.substring(0, 5),
          status,
        },
      })

      const lateMessage = isLate ? ` (Anda terlambat ${Math.round(
        (new Date(`2000-01-01T${currentTimeStr.substring(0, 5)}`).getTime() - 
         new Date(`2000-01-01T${officeCheckInStr}`).getTime()) / 60000
      )} menit)` : ''

      await recordLog('Absen Masuk', `Berhasil melakukan absen masuk pukul ${currentTimeStr.substring(0, 5)} WIB.${lateMessage}`, userId)

      return NextResponse.json({
        success: true,
        type: 'check_in',
        message: `Absen masuk berhasil! Pukul ${currentTimeStr.substring(0, 5)} WIB.${lateMessage}`,
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
          check_out_time: currentTimeStr.substring(0, 5),
          session_id: session.id,
        },
      })

      await recordLog('Absen Pulang', `Berhasil melakukan absen pulang pukul ${currentTimeStr.substring(0, 5)} WIB.`, userId)

      return NextResponse.json({
        success: true,
        type: 'check_out',
        message: `Absen pulang berhasil! Pukul ${currentTimeStr.substring(0, 5)} WIB. Selamat beristirahat!`,
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
