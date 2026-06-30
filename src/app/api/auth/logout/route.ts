import { NextResponse } from 'next/server'
import { recordLog } from '@/lib/logger'

export async function POST() {
  try {
    // Record Activity Log (will read current user from cookies in recordLog if not passed)
    await recordLog('Logout', 'Berhasil keluar dari sistem.')

    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil.',
    })

    // Clear Cookie
    response.cookies.set({
      name: 'auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    })

    return response
  } catch (error: any) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan internal server.' },
      { status: 500 }
    )
  }
}
