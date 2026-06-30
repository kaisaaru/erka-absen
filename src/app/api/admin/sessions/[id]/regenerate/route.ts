import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { recordLog } from '@/lib/logger'
import crypto from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = Number(id)

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Sesi absensi tidak ditemukan.' },
        { status: 404 }
      )
    }

    const qrToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + session.qr_duration_minutes * 60000)

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        qr_token: qrToken,
        qr_expires_at: expiresAt,
        status: 'active',
      },
    })

    const typeLabel = session.type === 'check_in' ? 'Absen Masuk' : 'Absen Pulang'
    await recordLog('Regenerate QR Code', `Berhasil me-regenerate QR code untuk sesi absensi: ${typeLabel}.`)

    return NextResponse.json({
      success: true,
      message: 'QR Code berhasil di-generate ulang.',
      session: updatedSession,
    })
  } catch (error: any) {
    console.error('Error regenerating QR:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
