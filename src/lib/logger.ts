import prisma from './prisma'
import { headers } from 'next/headers'

/**
 * Record an activity log in the database.
 * Auto-detects IP address and User-Agent from request headers.
 */
export async function recordLog(
  activity: string, 
  description: string, 
  userId?: number | null
): Promise<void> {
  try {
    const headersList = await headers()
    
    // Get IP address
    const forwardedFor = headersList.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'
    
    // Get User Agent
    const userAgent = headersList.get('user-agent') || 'Unknown'
    
    // Determine active user
    let finalUserId: number | null = null
    if (userId !== undefined) {
      finalUserId = userId
    } else {
      // Try to read user from cookie dynamically in server actions/routes
      const cookieHeader = headersList.get('cookie') || ''
      const match = cookieHeader.match(/auth_token=([^;]+)/)
      if (match) {
        const token = match[1]
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345'
        const jwt = require('jsonwebtoken')
        try {
          const payload = jwt.verify(token, JWT_SECRET) as { userId: number }
          finalUserId = payload.userId
        } catch {}
      }
    }

    await prisma.activityLog.create({
      data: {
        user_id: finalUserId,
        activity,
        description,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to write activity log:', error)
  }
}
