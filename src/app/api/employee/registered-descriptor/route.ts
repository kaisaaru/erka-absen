import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const userPayload = getUserFromRequest(request)
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: { face_descriptor: true }
    })

    if (!user || !user.face_descriptor) {
      return NextResponse.json(
        { success: false, message: 'Wajah belum terdaftar.', enrolled: false },
        { status: 404 }
      )
    }

    // Fetch office location settings
    const officeLatSet = await prisma.setting.findUnique({ where: { key: 'office_latitude' } })
    const officeLngSet = await prisma.setting.findUnique({ where: { key: 'office_longitude' } })
    const officeMaxDistSet = await prisma.setting.findUnique({ where: { key: 'office_max_distance_meters' } })
    const officeLocationActiveSet = await prisma.setting.findUnique({ where: { key: 'office_location_active' } })

    return NextResponse.json({
      success: true,
      enrolled: true,
      descriptor: user.face_descriptor,
      office_latitude: officeLatSet?.value || null,
      office_longitude: officeLngSet?.value || null,
      office_max_distance_meters: officeMaxDistSet?.value || null,
      office_location_active: officeLocationActiveSet?.value === 'false' ? false : true,
    })
  } catch (error: any) {
    console.error('Error fetching face descriptor:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
