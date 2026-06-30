import React from 'react'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkIsLate, formatReadableDate } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export default async function EmployeeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value || ''
  const userPayload = token ? verifyToken(token) : null
  const userId = userPayload?.userId

  if (!userId) return null

  const params = await searchParams
  const pageNo = Number(params.page || '1')
  const limit = 20
  const skip = (pageNo - 1) * limit

  // Settings for late detection
  const checkInTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_in_time' } })
  const toleranceSet = await prisma.setting.findUnique({ where: { key: 'office_late_tolerance_minutes' } })
  const officeCheckInStr = checkInTimeSet?.value || '08:00'
  const toleranceMinutes = Number(toleranceSet?.value || '15')

  const total = await prisma.attendance.count({ where: { user_id: userId } })
  const attendances = await prisma.attendance.findMany({
    where: { user_id: userId },
    orderBy: { attendance_date: 'desc' },
    take: limit,
    skip,
  })

  const totalPages = Math.ceil(total / limit)

  const statusColors: Record<string, string> = {
    hadir: 'bg-emerald-100 text-emerald-700',
    wfh: 'bg-blue-100 text-blue-700',
    tugas_luar: 'bg-purple-100 text-purple-700',
    izin: 'bg-yellow-100 text-yellow-700',
    sakit: 'bg-orange-100 text-orange-700',
    alpha: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    hadir: 'Hadir',
    wfh: 'WFH',
    tugas_luar: 'Tugas Luar',
    izin: 'Izin',
    sakit: 'Sakit',
    alpha: 'Alpha',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Riwayat Absensi</h2>
        <p className="text-sm text-slate-500 mt-1">Total {total} catatan kehadiran Anda</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Jam Masuk</th>
                <th className="px-6 py-4">Jam Pulang</th>
                <th className="px-6 py-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendances.length > 0 ? (
                attendances.map((att) => {
                  const isLate = att.status === 'hadir' && checkIsLate(att.check_in_time, officeCheckInStr, toleranceMinutes)
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{formatReadableDate(att.attendance_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[att.status]}`}>
                          {statusLabels[att.status]}
                          {isLate && ' (Terlambat)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{att.check_in_time || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{att.check_out_time || '-'}</td>
                      <td className="px-6 py-4 text-slate-400 font-medium text-xs">{att.notes || '-'}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">Belum ada riwayat absensi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between gap-4">
            <a
              href={`/employee/history?page=${pageNo - 1}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors ${pageNo === 1 ? 'pointer-events-none opacity-40' : ''}`}
            >
              Sebelumnya
            </a>
            <span className="text-xs text-slate-500 font-medium">Halaman {pageNo} dari {totalPages}</span>
            <a
              href={`/employee/history?page=${pageNo + 1}`}
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
