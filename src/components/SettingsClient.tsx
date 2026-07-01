'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, MapPin } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface SettingsClientProps {
  settings: Record<string, string>
}

export default function SettingsClient({ settings }: SettingsClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [officeName, setOfficeName] = useState(settings.office_name || 'ERKA')
  const [checkInTime, setCheckInTime] = useState(settings.office_check_in_time || '08:00')
  const [checkOutTime, setCheckOutTime] = useState(settings.office_check_out_time || '17:00')
  const [tolerance, setTolerance] = useState(settings.office_late_tolerance_minutes || '15')
  const [latitude, setLatitude] = useState(settings.office_latitude || '-6.200000')
  const [longitude, setLongitude] = useState(settings.office_longitude || '106.816666')
  const [maxDistance, setMaxDistance] = useState(settings.office_max_distance_meters || '50')
  const [locationActive, setLocationActive] = useState(settings.office_location_active !== 'false')
  const [detectingLocation, setDetectingLocation] = useState(false)

  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleResetDb = async () => {
    const confirmReset = window.confirm(
      'APAKAH ANDA YAKIN?\n\nTindakan ini akan MENGHAPUS SEMUA DATA absensi, log aktivitas, sesi QR, dan menyetel ulang daftar karyawan ke data awal (seed).\n\nSemua foto bukti verifikasi wajah juga akan terhapus. Tindakan ini tidak dapat dibatalkan!'
    )
    if (!confirmReset) return

    setResetLoading(true)

    try {
      const res = await fetch('/api/admin/reset-db', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Database berhasil di-reset dan di-seed kembali ke data awal.')
        router.refresh()
      } else {
        toast.error(data.message || 'Gagal mereset database.')
      }
    } catch (err) {
      toast.error('Koneksi server gagal saat mereset database.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolokasi tidak didukung oleh browser Anda.')
      return
    }

    setDetectingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
        toast.success('Lokasi GPS berhasil dideteksi!')
        setDetectingLocation(false)
      },
      (err) => {
        console.error('Error getting location:', err)
        let errorMsg = 'Gagal mendeteksi lokasi GPS.'
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Izin akses lokasi GPS ditolak oleh browser.'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'Informasi lokasi tidak tersedia.'
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'Waktu permintaan lokasi habis.'
        }
        toast.error(errorMsg)
        setDetectingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          office_latitude: latitude,
          office_longitude: longitude,
          office_max_distance_meters: maxDistance,
          office_location_active: String(locationActive),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Pengaturan berhasil disimpan.')
        router.refresh()
      } else {
        toast.error(data.message || 'Gagal menyimpan pengaturan.')
      }
    } catch (err) {
      toast.error('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">

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

        {/* Lokasi & Radius Kantor (Geofencing) */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Lokasi & Radius Kantor (Geofencing)</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={locationActive}
                onChange={(e) => setLocationActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-650">{locationActive ? 'Aktif' : 'Nonaktif'}</span>
            </label>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="latitude" className="block text-xs font-bold text-slate-500 mb-1.5">
                  Latitude Kantor {locationActive && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  id="latitude"
                  required={locationActive}
                  disabled={!locationActive}
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 ${!locationActive ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100' : ''}`}
                  placeholder="-6.200000"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="longitude" className="block text-xs font-bold text-slate-500 mb-1.5">
                  Longitude Kantor {locationActive && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  id="longitude"
                  required={locationActive}
                  disabled={!locationActive}
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 ${!locationActive ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100' : ''}`}
                  placeholder="106.816666"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={detectingLocation || !locationActive}
                onClick={handleDetectLocation}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold transition-all border border-slate-150"
              >
                <MapPin className={`w-4 h-4 text-blue-600 ${detectingLocation ? 'animate-bounce' : ''}`} />
                {detectingLocation ? 'Mendeteksi GPS...' : 'Gunakan Lokasi Saya Saat Ini'}
              </button>
            </div>

            <div>
              <label htmlFor="max_distance" className="block text-xs font-bold text-slate-500 mb-1.5">
                Radius Maksimal Absensi (meter) {locationActive && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  id="max_distance"
                  required={locationActive}
                  disabled={!locationActive}
                  min="5"
                  max="5000"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  className={`w-32 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 ${!locationActive ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100' : ''}`}
                />
                <span className="text-sm text-slate-500 font-semibold">meter</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                Karyawan wajib berada dalam jarak radius ini untuk melakukan absensi. Rekomendasi: minimal <strong>50 meter</strong> untuk mengantisipasi ketidakakuratan GPS pada handphone.
              </p>
            </div>
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
