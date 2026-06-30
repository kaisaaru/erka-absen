import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkIsLate } from '@/lib/date-utils'
import { recordLog } from '@/lib/logger'
import ExcelJS from 'exceljs'

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

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Laporan Absensi')

    // Title header
    sheet.mergeCells('A1:H1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = `LAPORAN ABSENSI KARYAWAN - ${officeName}`
    titleCell.font = { bold: true, size: 14 }
    titleCell.alignment = { horizontal: 'center' }

    sheet.mergeCells('A2:H2')
    const subtitleCell = sheet.getCell('A2')
    subtitleCell.value = `Periode: ${startDate} s/d ${endDate}`
    subtitleCell.font = { size: 11 }
    subtitleCell.alignment = { horizontal: 'center' }

    sheet.addRow([])

    // Column headers
    const headerRow = sheet.addRow([
      'No', 'Tanggal', 'Nama Karyawan', 'NIP', 'Jabatan', 'Status', 'Jam Masuk', 'Jam Pulang', 'Terlambat', 'Keterangan'
    ])
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } }
      cell.alignment = { horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    sheet.columns = [
      { key: 'no', width: 5 },
      { key: 'date', width: 14 },
      { key: 'name', width: 24 },
      { key: 'nip', width: 12 },
      { key: 'position', width: 18 },
      { key: 'status', width: 12 },
      { key: 'checkin', width: 12 },
      { key: 'checkout', width: 12 },
      { key: 'late', width: 10 },
      { key: 'notes', width: 24 },
    ]

    // Data rows
    attendances.forEach((att, idx) => {
      const isLate = att.status === 'hadir' && checkIsLate(att.check_in_time, officeCheckInStr, toleranceMinutes)
      const d = att.attendance_date
      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

      const dataRow = sheet.addRow([
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
      ])

      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Alternating row colors
      if (idx % 2 === 0) {
        dataRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } }
        })
      }
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    await recordLog('Unduh Laporan Excel', `Berhasil mengunduh laporan absensi Excel periode: ${startDate} s/d ${endDate}.`)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan_absensi_${startDate}_${endDate}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating Excel report:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat membuat laporan Excel.' },
      { status: 500 }
    )
  }
}
