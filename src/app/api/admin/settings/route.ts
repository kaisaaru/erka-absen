import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { recordLog } from '@/lib/logger'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { 
      office_name, 
      office_check_in_time, 
      office_check_out_time, 
      office_late_tolerance_minutes,
      office_latitude,
      office_longitude,
      office_max_distance_meters,
      office_location_active
    } = body

    const settingsToUpdate = [
      { key: 'office_name', value: office_name },
      { key: 'office_check_in_time', value: office_check_in_time },
      { key: 'office_check_out_time', value: office_check_out_time },
      { key: 'office_late_tolerance_minutes', value: office_late_tolerance_minutes !== undefined ? String(office_late_tolerance_minutes) : undefined },
      { key: 'office_latitude', value: office_latitude !== undefined ? String(office_latitude) : undefined },
      { key: 'office_longitude', value: office_longitude !== undefined ? String(office_longitude) : undefined },
      { key: 'office_max_distance_meters', value: office_max_distance_meters !== undefined ? String(office_max_distance_meters) : undefined },
      { key: 'office_location_active', value: office_location_active !== undefined ? String(office_location_active) : undefined },
    ]

    for (const setting of settingsToUpdate) {
      if (setting.value !== undefined) {
        await prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value },
        })
      }
    }

    await recordLog('Edit Pengaturan', 'Berhasil memperbarui pengaturan aplikasi.')

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil disimpan.',
    })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
