import React from 'react'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getJakartaDateString, checkIsLate, formatReadableDate } from '@/lib/date-utils'
import { CalendarCheck, Clock, QrCode, AlertTriangle, UserCheck } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EmployeeDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value || ''
  const userPayload = token ? verifyToken(token) : null
  const userId = userPayload?.userId

  if (!userId) return null

  // Fetch dbUser to check face enrollment status
  const dbUser = await prisma.user.findUnique({ where: { id: userId } })
  const needsFaceEnrollment = !dbUser?.face_descriptor

  const todayStr = getJakartaDateString()
  const today = new Date(todayStr)

  // Fetch settings
  const checkInTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_in_time' } })
  const checkOutTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_out_time' } })
  const toleranceSet = await prisma.setting.findUnique({ where: { key: 'office_late_tolerance_minutes' } })
  const officeCheckInStr = checkInTimeSet?.value || '08:00'
  const officeCheckOutStr = checkOutTimeSet?.value || '17:00'
  const toleranceMinutes = Number(toleranceSet?.value || '15')

  // Today's attendance
  const todayAttendance = await prisma.attendance.findFirst({
    where: { user_id: userId, attendance_date: today },
  })

  // Monthly attendance summary
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthlyAttendances = await prisma.attendance.findMany({
    where: {
      user_id: userId,
      attendance_date: { gte: firstOfMonth, lte: today },
    },
    orderBy: { attendance_date: 'desc' },
    take: 10,
  })

  const countHadir = monthlyAttendances.filter(a => a.status === 'hadir').length
  const countAlpha = monthlyAttendances.filter(a => a.status === 'alpha').length
  const countIzin = monthlyAttendances.filter(a => a.status === 'izin').length
  const countSakit = monthlyAttendances.filter(a => a.status === 'sakit').length

  // Active sessions
  const activeSessions = await prisma.attendanceSession.findMany({
    where: { session_date: today, status: 'active' },
    orderBy: { created_at: 'desc' },
  })

  const isLate = todayAttendance?.status === 'hadir' && checkIsLate(todayAttendance?.check_in_time, officeCheckInStr, toleranceMinutes)

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
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Selamat Datang, {userPayload?.name || 'Karyawan'}!</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Hari ini: {formatReadableDate(today)}</p>
        </div>
        
        {/* QR Link - Blocked if needs face enrollment or already checked out */}
        {activeSessions.length > 0 && !todayAttendance?.check_out_time ? (
          <Link
            href={needsFaceEnrollment ? "/employee/register-face" : "/employee/scan"}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all animate-pulse"
          >
            <QrCode className="w-4 h-4" />
            {todayAttendance?.check_in_time ? 'Absen Pulang — Scan Sekarang' : 'Absen Masuk — Scan Sekarang'}
          </Link>
        ) : todayAttendance?.check_out_time ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">
            <CalendarCheck className="w-4 h-4" />
            Absensi Selesai
          </div>
        ) : null}
      </div>

      {/* Face Enrollment Required Warning Callout */}
      {needsFaceEnrollment && (
        <div className="p-5 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-850">Pendaftaran Wajah Diperlukan</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                Anda belum mendaftarkan data wajah. Untuk mencegah kecurangan absensi, Anda wajib mendaftarkan data wajah sebelum melakukan pemindaian QR Code.
              </p>
            </div>
          </div>
          <Link
            href="/employee/register-face"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 self-start sm:self-center shadow-lg shadow-blue-100"
          >
            Daftarkan Wajah Sekarang
          </Link>
        </div>
      )}

      {/* Today's Status Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Status Absensi Hari Ini</h3>

        {todayAttendance ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
              <span className={`inline-flex mt-2 items-center px-3 py-1 rounded-full text-sm font-bold ${statusColors[todayAttendance.status]}`}>
                {statusLabels[todayAttendance.status]}
                {isLate && ' (Terlambat)'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Jam Masuk</p>
              <p className="text-2xl font-black text-slate-800 mt-2">{todayAttendance.check_in_time || '-'}</p>
              <p className="text-[10px] text-slate-400 font-medium">Jadwal: {officeCheckInStr}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Jam Pulang</p>
              <p className="text-2xl font-black text-slate-800 mt-2">{todayAttendance.check_out_time || '-'}</p>
              <p className="text-[10px] text-slate-400 font-medium">Jadwal: {officeCheckOutStr}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <AlertTriangle className="w-10 h-10 mb-2 text-amber-400" />
            <p className="text-sm font-semibold">Belum ada absensi hari ini.</p>
            <p className="text-xs mt-1">Pastikan Anda melakukan scan QR saat ada sesi aktif.</p>
          </div>
        )}
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Hadir', count: countHadir, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Izin', count: countIzin, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Sakit', count: countSakit, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Alpha', count: countAlpha, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border border-slate-100 shadow-sm p-5 ${item.bg}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label} (Bulan Ini)</p>
            <h3 className={`text-3xl font-black mt-2 ${item.color}`}>{item.count}</h3>
          </div>
        ))}
      </div>

      {/* Recent History Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Riwayat Absensi Terakhir</h3>
          <Link href="/employee/history" className="text-xs text-blue-600 hover:text-blue-700 font-bold">Lihat Semua</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-bold">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Jam Masuk</th>
                <th className="px-6 py-3">Jam Pulang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthlyAttendances.slice(0, 7).map((att) => {
                const late = att.status === 'hadir' && checkIsLate(att.check_in_time, officeCheckInStr, toleranceMinutes)
                return (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-800">{formatReadableDate(att.attendance_date)}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[att.status]}`}>
                        {statusLabels[att.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600 font-medium">
                      {att.check_in_time || '-'}
                      {late && <span className="block text-[9px] text-red-500 font-semibold">(Terlambat)</span>}
                    </td>
                    <td className="px-6 py-3 text-slate-600 font-medium">{att.check_out_time || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {monthlyAttendances.length === 0 && (
            <p className="px-6 py-8 text-center text-slate-400 font-medium italic text-sm">Belum ada riwayat absensi bulan ini.</p>
          )}
        </div>
      </div>
    </div>
  )
}
