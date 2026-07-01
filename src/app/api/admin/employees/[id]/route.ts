import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { recordLog } from '@/lib/logger'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = Number(id)
    const { name, email, password, phone, position, employee_id, reset_face } = await request.json()

    // Handle Reset Face Registration
    if (reset_face) {
      const employee = await prisma.user.update({
        where: { id: userId },
        data: {
          face_descriptor: null,
          face_image_registered: null,
          avatar: null, // Clear avatar as it's generated from face register
        },
      })

      await recordLog('Reset Wajah Karyawan', `Berhasil me-reset registrasi wajah karyawan: ${employee.name} (${employee.email}).`, userId)

      return NextResponse.json({
        success: true,
        message: 'Registrasi wajah berhasil di-reset.',
        employee,
      })
    }

    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Nama dan email wajib diisi.' },
        { status: 400 }
      )
    }

    // Check unique email ignoring current user
    const emailExists = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
    })
    if (emailExists) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar.' },
        { status: 400 }
      )
    }

    // Check unique employee_id ignoring current user
    if (employee_id) {
      const empIdExists = await prisma.user.findFirst({
        where: {
          employee_id,
          id: { not: userId },
        },
      })
      if (empIdExists) {
        return NextResponse.json(
          { success: false, message: 'NIP sudah digunakan.' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      name,
      email,
      phone: phone || null,
      position: position || null,
      employee_id: employee_id || null,
    }

    if (password) {
      updateData.password = await hashPassword(password)
    }

    const employee = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    await recordLog('Edit Karyawan', `Berhasil mengubah data karyawan: ${employee.name} (${employee.email}).`)

    return NextResponse.json({
      success: true,
      message: 'Data karyawan berhasil diperbarui.',
      employee,
    })
  } catch (error: any) {
    console.error('Error updating employee:', error)
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
    const userId = Number(id)

    const employee = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Karyawan tidak ditemukan.' },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    await recordLog('Hapus Karyawan', `Berhasil menghapus karyawan: ${employee.name} (${employee.email}).`)

    return NextResponse.json({
      success: true,
      message: 'Karyawan berhasil dihapus.',
    })
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
