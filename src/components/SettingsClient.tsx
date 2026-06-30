'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle, AlertCircle } from 'lucide-react'

interface SettingsClientProps {
  settings: Record<string, string>
}

export default function SettingsClient({ settings }: SettingsClientProps) {
  const router = useRouter()

  const [officeName, setOfficeName] = useState(settings.office_name || 'ERKA')
  const [checkInTime, setCheckInTime] = useState(settings.office_check_in_time || '08:00')
  const [checkOutTime, setCheckOutTime] = useState(settings.office_check_out_time || '17:00')
  const [tolerance, setTolerance] = useState(settings.office_late_tolerance_minutes || '15')

  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleResetDb = async () => {
    const confirmReset = window.confirm(
      'APAKAH ANDA YAKIN?\n\nTindakan ini akan MENGHAPUS SEMUA DATA absensi, log aktivitas, sesi QR, dan menyetel ulang daftar karyawan ke data awal (seed).\n\nSemua foto bukti verifikasi wajah juga akan terhapus. Tindakan ini tidak dapat dibatalkan!'
    )
    if (!confirmReset) return

    setResetLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/reset-db', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Database berhasil di-reset dan di-seed kembali ke data awal.')
        router.refresh()
        setTimeout(() => setSuccess(''), 6000)
      } else {
        setError(data.message || 'Gagal mereset database.')
      }
    } catch (err) {
      setError('Koneksi server gagal saat mereset database.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          office_name: officeName,
          office_check_in_time: checkInTime,
          office_check_out_time: checkOutTime,
          office_late_tolerance_minutes: tolerance,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess('Pengaturan berhasil disimpan.')
        router.refresh()
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setError(data.message || 'Gagal menyimpan pengaturan.')
      }
    } catch (err) {
      setError('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold text-emerald-700">{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-sm font-semibold text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-50">Informasi Kantor</h3>
          <div>
            <label htmlFor="office_name" className="block text-xs font-bold text-slate-500 mb-1.5">
              Nama Kantor / Instansi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="office_name"
              required
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
              placeholder="ERKA"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Nama ini akan muncul di sidebar, laporan PDF/Excel, dan judul halaman.</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-50">Jam Kerja</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="check_in_time" className="block text-xs font-bold text-slate-500 mb-1.5">
                Jam Masuk Kantor <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="check_in_time"
                required
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
              />
            </div>
            <div>
              <label htmlFor="check_out_time" className="block text-xs font-bold text-slate-500 mb-1.5">
                Jam Pulang Kantor <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="check_out_time"
                required
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-50">Keterlambatan</h3>
          <div>
            <label htmlFor="tolerance" className="block text-xs font-bold text-slate-500 mb-1.5">
              Toleransi Keterlambatan (menit) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                id="tolerance"
                required
                min="0"
                max="120"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className="w-32 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
              />
              <span className="text-sm text-slate-500 font-semibold">menit</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              Karyawan yang melakukan absen masuk lebih dari jam masuk + toleransi akan ditandai sebagai <strong>Terlambat</strong>.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-50">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-red-55/20 rounded-2xl border border-red-100 p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider mb-1">Danger Zone</h3>
          <p className="text-xs text-slate-500">Gunakan fitur ini untuk mereset dan memulihkan database ke kondisi awal.</p>
        </div>

        <div className="pt-2 border-t border-red-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="max-w-md">
            <h4 className="text-xs font-bold text-slate-800">Reset & Seed Ulang Database</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
              Semua data transaksi absensi akan dihapus total. Database disinkronkan kembali ke data awal (user admin: admin@erka.com, karyawan default: andi, budi, dll.).
            </p>
          </div>
          <button
            type="button"
            disabled={resetLoading}
            onClick={handleResetDb}
            className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shrink-0 self-start sm:self-center"
          >
            {resetLoading ? 'Proses Reset...' : 'Reset & Seed Database'}
          </button>
        </div>
      </div>
    </div>
  )
}
