'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface CreateSessionFormProps {
  checkoutLimitTime: string
}

export default function CreateSessionForm({ checkoutLimitTime }: CreateSessionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [type, setType] = useState('check_in')
  const [duration, setDuration] = useState('5')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, qr_duration_minutes: duration }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        router.push(`/admin/sessions/qr?id=${data.session.id}`)
        router.refresh()
      } else {
        toast.error(data.message || 'Gagal membuat sesi absensi.')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan koneksi server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Tipe Sesi */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2.5">
          Tipe Sesi <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
            type === 'check_in' 
              ? 'border-blue-600 bg-blue-50/10 text-blue-700 font-bold' 
              : 'border-slate-200 bg-white hover:border-slate-350 text-slate-500'
          }`}>
            <input 
              type="radio" 
              name="type" 
              value="check_in" 
              checked={type === 'check_in'}
              onChange={() => setType('check_in')}
              className="sr-only" 
            />
            <LogIn className="w-6 h-6 text-emerald-500 mb-2" />
            <span className="text-xs">Absen Masuk</span>
          </label>

          <label className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 cursor-pointer transition-all ${
            type === 'check_out' 
              ? 'border-blue-600 bg-blue-50/10 text-blue-700 font-bold' 
              : 'border-slate-200 bg-white hover:border-slate-350 text-slate-500'
          }`}>
            <input 
              type="radio" 
              name="type" 
              value="check_out" 
              checked={type === 'check_out'}
              onChange={() => setType('check_out')}
              className="sr-only" 
            />
            <LogOut className="w-6 h-6 text-orange-500 mb-2" />
            <span className="text-xs">Absen Pulang</span>
          </label>
        </div>
      </div>

      {/* Durasi */}
      <div>
        <label htmlFor="duration" className="block text-xs font-bold text-slate-700 mb-2.5">
          Durasi QR Code (menit) <span className="text-red-500">*</span>
        </label>
        <input
          id="duration"
          type="number"
          required
          min="1"
          max="60"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-250 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
        />
        <p className="text-[10px] text-slate-400 mt-2 font-semibold">QR Code akan kadaluarsa setelah durasi ini. Default: 5 menit.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-750 transition-all disabled:opacity-50"
      >
        {loading ? 'Membuat Sesi...' : 'Buat Sesi & Generate QR'}
      </button>
    </form>
  )
}
