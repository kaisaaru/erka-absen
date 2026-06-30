import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkIsLate } from '@/lib/date-utils'
import { recordLog } from '@/lib/logger'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const userId = url.searchParams.get('user_id')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Parameter start_date dan end_date wajib diisi.' },
        { status: 400 }
      )
    }

    // Fetch settings
    const checkInTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_in_time' } })
    const toleranceSet = await prisma.setting.findUnique({ where: { key: 'office_late_tolerance_minutes' } })
    const officeNameSet = await prisma.setting.findUnique({ where: { key: 'office_name' } })
    const officeCheckInStr = checkInTimeSet?.value || '08:00'
    const toleranceMinutes = Number(toleranceSet?.value || '15')
    const officeName = officeNameSet?.value || 'ERKA'

    const where: any = {
      attendance_date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    }

    if (userId) {
      where.user_id = Number(userId)
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: [{ attendance_date: 'asc' }],
      include: {
        user: {
          select: { name: true, employee_id: true, position: true }
        }
      }
    })

    const statusLabels: Record<string, string> = {
      hadir: 'Hadir',
      wfh: 'WFH',
      tugas_luar: 'Tugas Luar',
      izin: 'Izin',
      sakit: 'Sakit',
      alpha: 'Alpha',
    }

    // Create PDF
    const doc = new jsPDF({ orientation: 'landscape' })

    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`LAPORAN ABSENSI KARYAWAN - ${officeName}`, doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periode: ${startDate} s/d ${endDate}`, doc.internal.pageSize.getWidth() / 2, 26, { align: 'center' })

    // Table
    const tableHead = [['No', 'Tanggal', 'Nama Karyawan', 'NIP', 'Jabatan', 'Status', 'Jam Masuk', 'Jam Pulang', 'Terlambat', 'Keterangan']]
    const tableBody = attendances.map((att, idx) => {
      const isLate = att.status === 'hadir' && checkIsLate(att.check_in_time, officeCheckInStr, toleranceMinutes)
      const d = att.attendance_date
      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

      return [
        idx + 1,
        dateStr,
        att.user?.name || '-',
        att.user?.employee_id || '-',
        att.user?.position || '-',
        statusLabels[att.status] || att.status,
        att.check_in_time || '-',
        att.check_out_time || '-',
        isLate ? 'Ya' : 'Tidak',
        att.notes || '-',
      ]
    })

    autoTable(doc, {
      startY: 32,
      head: tableHead,
      body: tableBody,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 22 },
        5: { halign: 'center', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 18 },
        7: { halign: 'center', cellWidth: 18 },
        8: { halign: 'center', cellWidth: 16 },
      },
    })

    // Footer
    const pageCount = (doc.internal as any).getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Halaman ${i} dari ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    }

    const buffer = Buffer.from(doc.output('arraybuffer'))

    await recordLog('Unduh Laporan PDF', `Berhasil mengunduh laporan absensi PDF periode: ${startDate} s/d ${endDate}.`)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan_absensi_${startDate}_${endDate}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat membuat laporan PDF.' },
      { status: 500 }
    )
  }
}
