import React from 'react'
import prisma from '@/lib/prisma'
import { formatReadableDate } from '@/lib/date-utils'
import { History, User2, Monitor } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const pageNo = Number(params.page || '1')
  const limit = 30
  const skip = (pageNo - 1) * limit

  const total = await prisma.activityLog.count()
  const logs = await prisma.activityLog.findMany({
    orderBy: { created_at: 'desc' },
    skip,
    take: limit,
    include: {
      user: {
        select: { name: true, role: true }
      }
    }
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Log Aktivitas</h2>
        <p className="text-sm text-gray-500 mt-1">Riwayat lengkap semua aktivitas yang dilakukan dalam sistem (read-only)</p>
      </div>

      {/* Summary Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
        <History className="w-4 h-4 text-blue-500" />
        Total {total} entri log aktivitas
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Aktivitas</th>
                <th className="px-6 py-4">Deskripsi</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      <p className="font-semibold">{formatReadableDate(log.created_at)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                      </p>
                    </td>
                    <td className="px-6 py-3.5">
                      {log.user ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                            {log.user.name.substring(0, 1)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{log.user.name}</p>
                            <p className="text-[9px] text-slate-400 capitalize mt-0.5">{log.user.role}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <User2 className="w-4 h-4" />
                          <span className="text-xs font-medium italic">Sistem</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold">
                        {log.activity}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 font-medium max-w-[300px]">
                      {log.description}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <Monitor className="w-3.5 h-3.5" />
                        {log.ip_address || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">Belum ada log aktivitas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between gap-4">
            <a
              href={`/admin/logs?page=${pageNo - 1}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors ${pageNo === 1 ? 'pointer-events-none opacity-40' : ''}`}
            >
              Sebelumnya
            </a>
            <span className="text-xs text-slate-500 font-medium">Halaman {pageNo} dari {totalPages}</span>
            <a
              href={`/admin/logs?page=${pageNo + 1}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors ${pageNo === totalPages ? 'pointer-events-none opacity-40' : ''}`}
            >
              Selanjutnya
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
