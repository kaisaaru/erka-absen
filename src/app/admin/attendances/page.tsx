import React from 'react'
import prisma from '@/lib/prisma'
import { checkIsLate } from '@/lib/date-utils'
import AttendancesManagement from '@/components/AttendancesManagement'

export const dynamic = 'force-dynamic'

export default async function AdminAttendancesPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string
    user_id?: string
    status?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const dateFilter = params.date || ''
  const userIdFilter = params.user_id || ''
  const statusFilter = params.status || ''
  const pageNo = Number(params.page || '1')
  const limit = 20
  const skip = (pageNo - 1) * limit

  // 1. Fetch system settings for late calculations
  const checkInTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_in_time' } })
  const toleranceSet = await prisma.setting.findUnique({ where: { key: 'office_late_tolerance_minutes' } })
  const officeCheckInStr = checkInTimeSet?.value || '08:00'
  const toleranceMinutes = Number(toleranceSet?.value || '15')

  // 2. Fetch list of employees for filters
  const employees = await prisma.user.findMany({
    where: { role: 'employee' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  })

  // 3. Build Prisma query where criteria
  const where: any = {}
  
  if (dateFilter) {
    where.attendance_date = new Date(dateFilter)
  }
  if (userIdFilter) {
    where.user_id = Number(userIdFilter)
  }
  if (statusFilter) {
    where.status = statusFilter
  }

  // 4. Fetch attendances count and data
  const total = await prisma.attendance.count({ where })
  const attendances = await prisma.attendance.findMany({
    where,
    orderBy: [
      { attendance_date: 'desc' },
      { created_at: 'desc' }
    ],
    include: {
      user: {
        select: {
          name: true,
          employee_id: true,
        }
      }
    },
    take: limit,
    skip,
  })

  const formattedAttendances = attendances.map((att) => {
    const isLateVal = att.status === 'hadir' && checkIsLate(att.check_in_time, officeCheckInStr, toleranceMinutes)
    
    return {
      id: att.id,
      userId: att.user_id,
      employeeName: att.user?.name || '-',
      employeeNip: att.user?.employee_id || '-',
      attendanceDate: att.attendance_date.toISOString().split('T')[0],
      checkInTime: att.check_in_time || '',
      checkOutTime: att.check_out_time || '',
      status: att.status,
      notes: att.notes || '',
      isLate: isLateVal,
      faceImageIn: att.face_image_in || '',
      faceImageOut: att.face_image_out || '',
    }
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Daftar Absensi</h2>
        <p className="text-sm text-gray-500 mt-1">Mengelola seluruh riwayat kehadiran karyawan</p>
      </div>

      <AttendancesManagement 
        initialAttendances={formattedAttendances} 
        employees={employees} 
        dateFilter={dateFilter}
        userIdFilter={userIdFilter}
        statusFilter={statusFilter}
        currentPage={pageNo}
        totalPages={totalPages}
      />
    </div>
  )
}
