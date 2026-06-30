import React from 'react'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import QRDisplayContainer from '@/components/QRDisplayContainer'

export const dynamic = 'force-dynamic'

export default async function AdminQRPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  if (!id) {
    redirect('/admin/sessions')
  }

  const sessionId = Number(id)
  if (isNaN(sessionId)) {
    redirect('/admin/sessions')
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    redirect('/admin/sessions')
  }

  const plainSession = {
    id: session.id,
    type: session.type,
    qr_token: session.qr_token,
    qr_expires_at: session.qr_expires_at.toISOString(),
    qr_duration_minutes: session.qr_duration_minutes,
    status: session.status,
  }

  return <QRDisplayContainer initialSession={plainSession} />
}
