import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'
import { recordLog } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email dan password harus diisi.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    const isMatch = await verifyPassword(password, user.password)

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah.' },
        { status: 401 }
      )
    }

    // Sign JWT
    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    })

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

    // Set HTTP-only Cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Record Activity Log
    await recordLog('Login', 'Berhasil masuk ke dalam sistem.', user.id)

    return response
  } catch (error: any) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
