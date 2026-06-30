import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { recordLog } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { name, email, password, phone, position, employee_id } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nama, email, dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // Check unique email
    const emailExists = await prisma.user.findUnique({ where: { email } })
    if (emailExists) {
      return NextResponse.json(
        { success: false, message: 'Email sudah terdaftar.' },
        { status: 400 }
      )
    }

    // Check unique employee_id if provided
    if (employee_id) {
      const empIdExists = await prisma.user.findUnique({ where: { employee_id } })
      if (empIdExists) {
        return NextResponse.json(
          { success: false, message: 'NIP sudah digunakan.' },
          { status: 400 }
        )
      }
    }

    const passwordHash = await hashPassword(password)

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: 'employee',
        phone: phone || null,
        position: position || null,
        employee_id: employee_id || null,
      },
    })

    await recordLog('Tambah Karyawan', `Berhasil menambahkan karyawan baru: ${employee.name} (${employee.email}).`)

    return NextResponse.json({
      success: true,
      message: 'Karyawan berhasil ditambahkan.',
      employee,
    })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
