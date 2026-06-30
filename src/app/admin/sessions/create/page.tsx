import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { ChevronLeft } from 'lucide-react'
import CreateSessionForm from '@/components/CreateSessionForm'
import { getJakartaDateString } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export default async function AdminCreateSessionPage() {
  const checkoutSetting = await prisma.setting.findUnique({
    where: { key: 'office_check_out_time' },
  })
  const checkoutLimitTime = checkoutSetting?.value || '17:00'

  const dateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Fetch active sessions today
  const todayStr = getJakartaDateString()
  const today = new Date(todayStr)
  const activeSessions = await prisma.attendanceSession.findMany({
    where: { session_date: today, status: 'active' },
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/admin/sessions"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Buat Sesi Absensi</h2>
        <p className="text-xs text-slate-400 mt-0.5 font-semibold">{dateFormatted}</p>
      </div>

      {/* Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <CreateSessionForm checkoutLimitTime={checkoutLimitTime} />
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Sesi Aktif Saat Ini */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50">Sesi Aktif Saat Ini</h3>
            {activeSessions.length > 0 ? (
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 block uppercase">
                        {session.type === 'check_in' ? 'Absen Masuk' : 'Absen Pulang'}
                      </span>
                      <span className="text-[8px] text-slate-400">
                        Sampai: {new Date(session.qr_expires_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                    <Link 
                      href={`/admin/sessions/qr?id=${session.id}`}
                      className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
                    >
                      Tampilkan QR
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-medium">Tidak ada sesi absensi yang aktif hari ini.</p>
            )}
          </div>

          {/* Petunjuk Penggunaan */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50">Petunjuk Penggunaan</h3>
            <ul className="space-y-3.5 list-disc pl-4 text-slate-500 text-[10px] font-semibold leading-relaxed">
              <li>Pilih tipe sesi absensi yang ingin dibuat (Absen Masuk atau Absen Pulang).</li>
              <li>Tentukan batas kadaluarsa QR Code. Secara default sistem menggunakan waktu 5 menit.</li>
              <li>Sistem hanya memperbolehkan satu sesi absen aktif pada satu waktu yang sama untuk hari ini.</li>
              <li>Setelah sesi dibuat, tampilkan QR Code pada layar monitor agar dapat di-scan oleh karyawan menggunakan HP masing-masing.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
