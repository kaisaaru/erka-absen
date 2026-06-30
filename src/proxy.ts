import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromRequest } from './lib/auth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Exclude static assets, api/auth, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const user = getUserFromRequest(request)

  // API protection
  if (pathname.startsWith('/api/admin')) {
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
  }

  if (pathname.startsWith('/api/employee')) {
    if (!user || user.role !== 'employee') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
  }

  // Page protection
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith('/employee')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (user.role !== 'employee') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Login page redirection if already logged in
  if (pathname === '/login' || pathname === '/') {
    if (user) {
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/employee/dashboard', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
