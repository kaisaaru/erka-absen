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

    return NextResponse.json({
      success: true,
      enrolled: true,
      descriptor: user.face_descriptor
    })
  } catch (error: any) {
    console.error('Error fetching face descriptor:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
