import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
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

    // Auto-expire check
    let currentStatus = session.status
    if (session.status === 'active' && new Date() > new Date(session.qr_expires_at)) {
      await prisma.attendanceSession.update({
        where: { id: sessionId },
        data: { status: 'expired' },
      })
      currentStatus = 'expired'
    }

    // Fetch attendances scanned for this session
    const attendances = await prisma.attendance.findMany({
      where: { session_id: sessionId },
      include: {
        user: {
          select: {
            name: true,
            employee_id: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    })

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        status: currentStatus,
      },
      count: attendances.length,
      attendees: attendances.map((att) => ({
        id: att.id,
        name: att.user?.name || '-',
        employee_id: att.user?.employee_id || '-',
        time: session.type === 'check_in' ? att.check_in_time : att.check_out_time,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching attendees count:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
