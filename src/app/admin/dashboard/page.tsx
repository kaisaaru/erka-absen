import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { getJakartaDateString, checkIsLate, formatReadableDate } from '@/lib/date-utils'
import { 
  Users, 
  Check, 
  Home, 
  Briefcase, 
  Heart, 
  Target, 
  QrCode, 
  UserPlus, 
  FileText,
  Plus
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const todayStr = getJakartaDateString()
  const today = new Date(todayStr)

  // 1. Fetch system settings for tolerance
  const checkInTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_in_time' } })
  const toleranceSet = await prisma.setting.findUnique({ where: { key: 'office_late_tolerance_minutes' } })
  const officeCheckInStr = checkInTimeSet?.value || '08:00'
  const toleranceMinutes = Number(toleranceSet?.value || '15')

  // 2. Fetch counts
  const totalEmployees = await prisma.user.count({ where: { role: 'employee' } })
  
  // Today's attendances
  const todayAttendances = await prisma.attendance.findMany({
    where: { attendance_date: today },
    include: { user: true },
  })

  const countHadir = todayAttendances.filter(a => a.status === 'hadir').length
  const countWFH = todayAttendances.filter(a => a.status === 'wfh').length
  const countTugasLuar = todayAttendances.filter(a => a.status === 'tugas_luar').length
  const countIzin = todayAttendances.filter(a => a.status === 'izin').length
  const countSakit = todayAttendances.filter(a => a.status === 'sakit').length
  const countIzinSakit = countIzin + countSakit

  // Alpha calculations
  // Any employee who doesn't have an attendance record today is considered Alpha
  const activeAttendeesIds = todayAttendances.map(a => a.user_id)
  const countAlpha = Math.max(0, totalEmployees - activeAttendeesIds.length)

  // Active Sessions today
  const activeSessions = await prisma.attendanceSession.findMany({
    where: { session_date: today, status: 'active' },
  })

  // 3. Weekly Attendance calculation (last 7 days)
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateString = d.toISOString().split('T')[0]
    
    // Day label in Indonesian
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' }) // e.g. "Rab", "Kam"
    last7Days.push({
      dateStr: dateString,
      dayLabel,
      dateObj: new Date(dateString)
    })
  }

  const start7DaysAgo = last7Days[0].dateObj
  const endToday = last7Days[6].dateObj

  const weeklyAttendances = await prisma.attendance.findMany({
    where: {
      attendance_date: {
        gte: start7DaysAgo,
        lte: endToday,
      }
    }
  })

  const chartData = last7Days.map(day => {
    const dayAtts = weeklyAttendances.filter(a => a.attendance_date.toISOString().split('T')[0] === day.dateStr)
    const hadir = dayAtts.filter(a => a.status === 'hadir' || a.status === 'tugas_luar').length
    const wfh = dayAtts.filter(a => a.status === 'wfh').length
    const izinSakit = dayAtts.filter(a => a.status === 'izin' || a.status === 'sakit').length
    const loggedAlpha = dayAtts.filter(a => a.status === 'alpha').length
    
    const totalLogged = hadir + wfh + izinSakit + loggedAlpha
    const unloggedAlpha = Math.max(0, totalEmployees - totalLogged)
    const alpha = loggedAlpha + unloggedAlpha

    return {
      dayLabel: day.dayLabel,
      hadir,
      wfh,
      alpha,
    }
  })

  // Recent 5 attendances for the bottom table
  const recentAttendances = await prisma.attendance.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
    include: { user: true },
  })

  const statusColors: Record<string, string> = {
    hadir: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    wfh: 'bg-blue-50 border-blue-200 text-blue-700',
    tugas_luar: 'bg-purple-50 border-purple-200 text-purple-700',
    izin: 'bg-amber-50 border-amber-200 text-amber-600',
    sakit: 'bg-orange-50 border-orange-200 text-orange-600',
    alpha: 'bg-red-50 border-red-200 text-red-700',
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
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-xs text-slate-500 mt-0.5">Ringkasan kehadiran kantor hari ini.</p>
      </div>

      {/* Grid Stats Row (6 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h4 className="text-2xl font-bold text-slate-850">{totalEmployees}</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Total Karyawan</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h4 className="text-2xl font-bold text-slate-850">{countHadir}</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Hadir Hari Ini</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Check className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h4 className="text-2xl font-bold text-slate-850">{countWFH}</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">WFH Hari Ini</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50/40 flex items-center justify-center text-blue-500 shrink-0">
            <Home className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h4 className="text-2xl font-bold text-slate-850">{countTugasLuar}</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Tugas Luar</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h4 className="text-2xl font-bold text-slate-850">{countIzinSakit}</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Izin / Sakit</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-650 shrink-0">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        {/* Card 6 */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <h4 className="text-2xl font-bold text-slate-850">{countAlpha}</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Alpha</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-red-650 shrink-0">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Weekly Attendance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Absensi Mingguan</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">7 hari terakhir</p>
          </div>

          {/* Bar Chart Area (HTML/CSS Based) */}
          <div className="mt-8 h-64 flex flex-col justify-between">
            {/* Chart Grid Lines & Columns */}
            <div className="flex-1 flex items-end justify-between px-4 pb-2 border-b border-slate-100 relative h-full">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-x-0 top-0 border-t border-slate-50 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/4 border-t border-slate-50 pointer-events-none" />
              <div className="absolute inset-x-0 top-2/4 border-t border-slate-50 pointer-events-none" />
              <div className="absolute inset-x-0 top-3/4 border-t border-slate-50 pointer-events-none" />

              {/* Columns container */}
              {chartData.map((data, index) => {
                const total = Math.max(1, totalEmployees)
                const alphaPct = (data.alpha / total) * 100
                const hadirPct = (data.hadir / total) * 100
                const wfhPct = (data.wfh / total) * 100

                return (
                  <div key={index} className="flex flex-col items-center gap-2 w-10 relative z-10 h-full justify-end">
                    {/* Stacked Bar */}
                    <div className="w-4 rounded-t-sm flex flex-col justify-end overflow-hidden h-full">
                      {data.wfh > 0 && (
                        <div 
                          className="bg-blue-400 transition-all duration-300"
                          style={{ height: `${wfhPct}%` }}
                          title={`WFH: ${data.wfh}`}
                        />
                      )}
                      {data.hadir > 0 && (
                        <div 
                          className="bg-blue-600 transition-all duration-300"
                          style={{ height: `${hadirPct}%` }}
                          title={`Hadir: ${data.hadir}`}
                        />
                      )}
                      {data.alpha > 0 && (
                        <div 
                          className="bg-red-500 transition-all duration-300"
                          style={{ height: `${alphaPct}%` }}
                          title={`Alpha: ${data.alpha}`}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between px-4 pt-2 text-[10px] text-slate-400 font-semibold">
              {chartData.map((data, index) => (
                <span key={index} className="w-10 text-center">{data.dayLabel}</span>
              ))}
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex items-center justify-center gap-5 mt-6 border-t border-slate-50 pt-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <span className="w-3 h-3 rounded-sm bg-red-500" />
              Alpha
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <span className="w-3 h-3 rounded-sm bg-blue-600" />
              Hadir
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
              <span className="w-3 h-3 rounded-sm bg-blue-400" />
              WFH
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Active Session */}
        <div className="space-y-6">
          {/* Card: Quick Action */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5">Quick Action</h3>
            <div className="space-y-3.5">
              <Link 
                href="/admin/sessions/create" 
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <QrCode className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none">Generate QR</h4>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">Tampilkan QR absensi</p>
                </div>
              </Link>

              <Link 
                href="/admin/employees" 
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none">Kelola Karyawan</h4>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">Tambah & atur akun</p>
                </div>
              </Link>

              <Link 
                href="/admin/reports" 
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none">Laporan</h4>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">Export PDF / Excel</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Card: Active Sessions */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sesi Aktif</h3>
              {activeSessions.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-700 block uppercase">
                          {session.type === 'check_in' ? 'Masuk' : 'Pulang'}
                        </span>
                        <span className="text-[8px] text-slate-400">
                          Sampai: {new Date(session.qr_expires_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                      <Link 
                        href={`/admin/sessions/qr?id=${session.id}`}
                        className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
                      >
                        Tampilkan
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Tidak ada sesi absensi yang aktif.</p>
              )}
            </div>

            <Link
              href="/admin/sessions/create"
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Sesi Absen Baru
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Attendances */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-800">Absensi Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-450 uppercase font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Nama</th>
                <th className="px-6 py-3.5">Tanggal</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Masuk</th>
                <th className="px-6 py-3.5">Pulang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentAttendances.length > 0 ? (
                recentAttendances.map((att) => {
                  const isLate = att.status === 'hadir' && checkIsLate(att.check_in_time, officeCheckInStr, toleranceMinutes)
                  const d = att.attendance_date
                  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                      <td className="px-6 py-4 font-bold text-slate-800">{att.user?.name}</td>
                      <td className="px-6 py-4 font-medium text-slate-450">{dateStr}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[att.status]}`}>
                          {statusLabels[att.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {att.check_in_time || '-'}
                        {isLate && (
                          <span className="block text-[8px] text-red-500 font-bold leading-none mt-0.5">(Terlambat)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{att.check_out_time || '-'}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium italic">Belum ada aktivitas absensi terbaru.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
