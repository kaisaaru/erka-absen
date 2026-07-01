import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { formatReadableDate } from '@/lib/date-utils'
import { recordLog } from '@/lib/logger'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const attendanceId = Number(id)
    const { status, notes } = await request.json()

    const validStatuses = ['hadir', 'wfh', 'tugas_luar', 'izin', 'sakit', 'alpha']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status tidak valid.' },
        { status: 400 }
      )
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { user: true },
    })

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Data absensi tidak ditemukan.' },
        { status: 404 }
      )
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status,
        notes: notes || null,
      },
    })

    const statusLabels: Record<string, string> = {
      hadir: 'Hadir',
      wfh: 'WFH',
      tugas_luar: 'Tugas Luar',
      izin: 'Izin',
      sakit: 'Sakit',
      alpha: 'Alpha',
    }

    const employeeName = attendance.user?.name || '-'
    const dateFormatted = formatReadableDate(attendance.attendance_date)
    const newStatusLabel = statusLabels[status]
    
    await recordLog('Edit Absensi', `Berhasil mengubah status absensi karyawan: ${employeeName} pada tanggal ${dateFormatted} menjadi: ${newStatusLabel}.`)

    return NextResponse.json({
      success: true,
      message: 'Status absensi berhasil diperbarui.',
      attendance: updatedAttendance,
    })
  } catch (error: any) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const attendanceId = Number(id)

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { user: true },
    })

    if (!attendance) {
      return NextResponse.json(
        { success: false, message: 'Data absensi tidak ditemukan.' },
        { status: 404 }
      )
    }

    await prisma.attendance.delete({
      where: { id: attendanceId }
    })

    const employeeName = attendance.user?.name || '-'
    const dateFormatted = formatReadableDate(attendance.attendance_date)
    
    await recordLog('Hapus Absensi', `Berhasil menghapus data absensi karyawan: ${employeeName} pada tanggal ${dateFormatted}.`)

    return NextResponse.json({
      success: true,
      message: 'Data absensi berhasil dihapus.',
    })
  } catch (error: any) {
    console.error('Error deleting attendance:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
