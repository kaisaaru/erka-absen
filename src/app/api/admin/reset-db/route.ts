import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { recordLog } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request)
    if (!userPayload || userPayload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      )
    }

    // 1. Clean all data (respecting foreign keys by deleting logs & attendances first)
    await prisma.activityLog.deleteMany({})
    await prisma.attendance.deleteMany({})
    await prisma.attendanceSession.deleteMany({})
    await prisma.setting.deleteMany({})
    await prisma.user.deleteMany({})

    // 2. Hash default password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash('password', salt)

    // 3. Create Admin
    await prisma.user.create({
      data: {
        name: 'Administrator',
        email: 'admin@erka.com',
        password: passwordHash,
        role: 'admin',
        phone: '081234567890',
        position: 'Admin',
        employee_id: 'ADM001',
      },
    })

    // 4. Create Sample Employees
    const employees = [
      {
        name: 'Andi Pratama',
        email: 'andi@erka.com',
        password: passwordHash,
        role: 'employee',
        phone: '081234567891',
        position: 'Staff IT',
        employee_id: 'EMP001',
      },
      {
        name: 'Budi Santoso',
        email: 'budi@erka.com',
        password: passwordHash,
        role: 'employee',
        phone: '081234567892',
        position: 'Staff Keuangan',
        employee_id: 'EMP002',
      },
      {
        name: 'Citra Dewi',
        email: 'citra@erka.com',
        password: passwordHash,
        role: 'employee',
        phone: '081234567893',
        position: 'Staff Marketing',
        employee_id: 'EMP003',
      },
      {
        name: 'Dedi Kurniawan',
        email: 'dedi@erka.com',
        password: passwordHash,
        role: 'employee',
        phone: '081234567894',
        position: 'Staff Operasional',
        employee_id: 'EMP004',
      },
      {
        name: 'Eka Putri',
        email: 'eka@erka.com',
        password: passwordHash,
        role: 'employee',
        phone: '081234567895',
        position: 'Staff HRD',
        employee_id: 'EMP005',
      },
    ]

    for (const emp of employees) {
      await prisma.user.create({ data: emp })
    }

    // 5. Create Settings
    const settings = [
      { key: 'office_name', value: 'ERKA' },
      { key: 'office_check_in_time', value: '08:00' },
      { key: 'office_check_out_time', value: '17:00' },
      { key: 'office_late_tolerance_minutes', value: '15' },
      { key: 'office_latitude', value: '-6.200000' },
      { key: 'office_longitude', value: '106.816666' },
      { key: 'office_max_distance_meters', value: '50' },
      { key: 'office_location_active', value: 'true' },
    ]

    for (const set of settings) {
      await prisma.setting.create({ data: set })
    }

    // Write log for reset
    await recordLog('Reset Database', 'Berhasil melakukan reset skema database dan seeding ulang data awal.', userPayload.userId)

    return NextResponse.json({
      success: true,
      message: 'Database berhasil di-reset dan di-seed ulang!',
    })
  } catch (error: any) {
    console.error('Error resetting database:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal melakukan reset database.' },
      { status: 500 }
    )
  }
}
