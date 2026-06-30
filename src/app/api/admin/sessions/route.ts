import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getJakartaTimeString, getJakartaDateString } from '@/lib/date-utils'
import { recordLog } from '@/lib/logger'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { type, qr_duration_minutes } = await request.json()

    if (!type || !qr_duration_minutes) {
      return NextResponse.json(
        { success: false, message: 'Tipe sesi dan durasi wajib diisi.' },
        { status: 400 }
      )
    }

    const duration = Number(qr_duration_minutes)
    if (isNaN(duration) || duration < 1 || duration > 60) {
      return NextResponse.json(
        { success: false, message: 'Durasi harus angka antara 1 sampai 60 menit.' },
        { status: 400 }
      )
    }

    const todayStr = getJakartaDateString()
    const today = new Date(todayStr)
    const currentTimeStr = getJakartaTimeString().substring(0, 5) // "HH:MM"

    // Prevent check-out generation before the configured office_check_out_time
    if (type === 'check_out') {
      const checkoutSetting = await prisma.setting.findUnique({
        where: { key: 'office_check_out_time' },
      })
      const checkoutLimitStr = checkoutSetting?.value || '17:00'

      if (currentTimeStr < checkoutLimitStr) {
        return NextResponse.json(
          { success: false, message: `Sesi absen pulang tidak dapat dibuat sebelum pukul ${checkoutLimitStr}.` },
          { status: 400 }
        )
      }
    }

    // Get current admin user ID
    // Note: middleware guarantees user is present and is admin
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(/auth_token=([^;]+)/)
    let adminId = 1 // fallback
    if (match) {
      const token = match[1]
      const jwt = require('jsonwebtoken')
      const decoded = jwt.decode(token) as { userId: number }
      if (decoded && decoded.userId) adminId = decoded.userId
    }

    const qrToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + duration * 60000)

    const session = await prisma.attendanceSession.create({
      data: {
        created_by: adminId,
        session_date: today,
        type,
        qr_token: qrToken,
        qr_expires_at: expiresAt,
        qr_duration_minutes: duration,
        status: 'active',
      },
    })

    const typeLabel = type === 'check_in' ? 'Absen Masuk' : 'Absen Pulang'
    await recordLog('Buat Sesi Absensi', `Berhasil membuat sesi absensi baru tipe: ${typeLabel} (durasi: ${duration} menit).`)

    return NextResponse.json({
      success: true,
      message: 'Sesi absensi berhasil dibuat.',
      session,
    })
  } catch (error: any) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
