import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { formatReadableDate } from '@/lib/date-utils'
import { PlayCircle, Eye, Calendar, Clock, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminSessionsPage() {
  const sessions = await prisma.attendanceSession.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      creator: {
        select: { name: true }
      }
    }
  })

  const statusBadges: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-amber-100 text-amber-700',
    closed: 'bg-slate-100 text-slate-700',
  }

  const statusLabels: Record<string, string> = {
    active: 'Aktif',
    expired: 'Kedaluwarsa',
    closed: 'Ditutup',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sesi Absensi</h2>
          <p className="text-sm text-gray-500 mt-1">Mengelola sesi absensi harian dan QR Code</p>
        </div>
        <Link
          href="/admin/sessions/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-100 transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          Buat Sesi Absen
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Waktu Mulai</th>
                <th className="px-6 py-4">Batas Expired</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Dibuat Oleh</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sessions.length > 0 ? (
                sessions.map((session) => {
                  // Determine status (client-side render might differ but server-side checks expiration)
                  let status = session.status
                  if (status === 'active' && new Date() > new Date(session.qr_expires_at)) {
                    status = 'expired'
                  }
                  
                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatReadableDate(session.session_date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">
                          {session.type === 'check_in' ? 'Absen Masuk' : 'Absen Pulang'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {new Date(session.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(session.qr_expires_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        <span className="text-[10px] text-slate-400 font-sans">({session.qr_duration_minutes}m)</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBadges[status]}`}>
                          {statusLabels[status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{session.creator?.name || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/sessions/qr?id=${session.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                          title="Tampilkan QR"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Tampilkan QR
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium italic">Belum ada sesi absensi yang dibuat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
