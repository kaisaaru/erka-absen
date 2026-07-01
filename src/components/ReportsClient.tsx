'use client'

import React, { useState } from 'react'
import { FileSpreadsheet, FileText, Download } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface EmployeeOption { id: number; name: string }

export default function ReportsClient({ employees }: { employees: EmployeeOption[] }) {
  const { toast } = useToast()
  // Use Jakarta (WIB, UTC+7) date as default to match how attendance_date is stored
  const jakartaNow = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const today = jakartaNow.toISOString().split('T')[0]
  const firstOfMonth = today.substring(0, 8) + '01'

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null)

  const buildParams = () => {
    const p = new URLSearchParams()
    p.set('start_date', startDate)
    p.set('end_date', endDate)
    if (userId) p.set('user_id', userId)
    return p.toString()
  }

  const handleDownload = async (type: 'excel' | 'pdf') => {
    if (!startDate || !endDate) {
      toast.error('Tanggal awal dan akhir harus diisi.')
      return
    }
    if (startDate > endDate) {
      toast.error('Tanggal awal tidak boleh lebih besar dari tanggal akhir.')
      return
    }
    setLoading(type)

    const endpoint = type === 'excel'
      ? `/api/admin/reports/excel?${buildParams()}`
      : `/api/admin/reports/pdf?${buildParams()}`

    try {
      const res = await fetch(endpoint)

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.message || 'Gagal mengunduh laporan.')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const ext = type === 'excel' ? 'xlsx' : 'pdf'
      a.download = `laporan_absensi_${startDate}_${endDate}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`Laporan ${type === 'excel' ? 'Excel' : 'PDF'} berhasil diunduh.`)
    } catch (err) {
      toast.error('Terjadi kesalahan saat mengunduh laporan.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5">Filter Laporan</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Tanggal Selesai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1.5">Karyawan (Opsional)</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
          >
            <option value="">Semua Karyawan</option>
            {employees.map((emp) => (
              <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => handleDownload('excel')}
          disabled={!!loading}
          className="group flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="text-center">
            <h4 className="text-sm font-bold text-slate-800">Unduh Excel</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Format .xlsx untuk diedit di Microsoft Excel</p>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
            <Download className="w-3.5 h-3.5" />
            {loading === 'excel' ? 'Mengunduh...' : 'Unduh Sekarang'}
          </div>
        </button>

        <button
          onClick={() => handleDownload('pdf')}
          disabled={!!loading}
          className="group flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border-2 border-dashed border-red-200 hover:border-red-400 hover:bg-red-50/30 text-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-center">
            <h4 className="text-sm font-bold text-slate-800">Unduh PDF</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Format .pdf untuk cetak dan distribusi</p>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold">
            <Download className="w-3.5 h-3.5" />
            {loading === 'pdf' ? 'Mengunduh...' : 'Unduh Sekarang'}
          </div>
        </button>
      </div>
    </div>
  )
}
