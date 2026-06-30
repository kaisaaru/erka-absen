import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { recordLog } from '@/lib/logger'

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

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: 'closed' },
    })

    const typeLabel = session.type === 'check_in' ? 'Absen Masuk' : 'Absen Pulang'
    await recordLog('Tutup Sesi Absensi', `Berhasil menutup sesi absensi: ${typeLabel}.`)

    return NextResponse.json({
      success: true,
      message: 'Sesi absensi berhasil ditutup.',
      session: updatedSession,
    })
  } catch (error: any) {
    console.error('Error closing session:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
