import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345'

export interface JWTPayload {
  userId: number
  role: string
  email: string
  name: string
}

/**
 * Hash a password.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Create a JWT token.
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verify a JWT token.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Retrieve current user payload from request cookies.
 */
export function getUserFromRequest(req: NextRequest | Request): JWTPayload | null {
  try {
    let token = ''
    if (req instanceof NextRequest) {
      token = req.cookies.get('auth_token')?.value || ''
    } else {
      // Fetch from headers (standard Request)
      const cookieHeader = req.headers.get('cookie') || ''
      const match = cookieHeader.match(/auth_token=([^;]+)/)
      if (match) {
        token = match[1]
      }
    }

    if (!token) return null
    return verifyToken(token)
  } catch (error) {
    return null
  }
}
