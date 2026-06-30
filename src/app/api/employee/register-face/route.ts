import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { recordLog } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const userPayload = getUserFromRequest(request)
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      )
    }

    const { descriptor, avatar, face_image_registered } = await request.json()

    if (!descriptor) {
      return NextResponse.json(
        { success: false, message: 'Data deskriptor wajah wajib diisi.' },
        { status: 400 }
      )
    }

    // Check if user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Sesi Anda telah kedaluwarsa atau akun tidak ditemukan. Silakan log out lalu log in kembali.' },
        { status: 401 }
      )
    }

    if (user.face_descriptor) {
      return NextResponse.json(
        { success: false, message: 'Pendaftaran wajah hanya dapat dilakukan sekali. Silakan hubungi administrator jika ingin memperbarui wajah Anda.' },
        { status: 400 }
      )
    }

    // Update user's face descriptor
    const updatedData: any = {
      face_descriptor: descriptor,
    }

    if (avatar) {
      updatedData.avatar = avatar
    }

    if (face_image_registered) {
      updatedData.face_image_registered = face_image_registered
    }

    await prisma.user.update({
      where: { id: userPayload.userId },
      data: updatedData,
    })

    await recordLog('Registrasi Wajah', 'Berhasil mendaftarkan data pemindaian wajah.', userPayload.userId)

    return NextResponse.json({
      success: true,
      message: 'Pemindaian wajah berhasil disimpan.',
    })
  } catch (error: any) {
    console.error('Error saving face descriptor:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
