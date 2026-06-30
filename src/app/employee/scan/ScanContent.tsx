'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QrCode, CheckCircle, XCircle, RefreshCw, Keyboard } from 'lucide-react'

export default function EmployeeScanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlToken = searchParams.get('token') || ''

  const [token, setToken] = useState(urlToken)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    type?: string
    isLate?: boolean
  } | null>(null)
  const [manualInput, setManualInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (urlToken) {
      handleScan(urlToken)
    }
  }, [urlToken])

  const handleScan = async (scanToken?: string) => {
    const t = scanToken || token
    if (!t) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/employee/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      })

      const data = await res.json()

      setResult({
        success: data.success,
        message: data.message,
        type: data.type,
        isLate: data.isLate,
      })

      if (data.success) {
        setTimeout(() => {
          router.push('/employee/dashboard')
          router.refresh()
        }, 3000)
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Koneksi server gagal. Coba lagi.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan()
  }

  const handleReset = () => {
    setToken('')
    setResult(null)
    setManualInput(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Scan Absensi</h2>
        <p className="text-sm text-slate-500 mt-1">Pindai QR Code atau masukkan token manual</p>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`rounded-2xl border p-6 flex flex-col items-center gap-4 text-center ${
          result.success ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
        }`}>
          {result.success ? (
            <CheckCircle className="w-16 h-16 text-emerald-500" />
          ) : (
            <XCircle className="w-16 h-16 text-red-400" />
          )}
          <div>
            <h3 className={`text-base font-bold ${result.success ? 'text-emerald-800' : 'text-red-700'}`}>
              {result.success ? 'Absen Berhasil!' : 'Absen Gagal'}
            </h3>
            <p className={`text-sm mt-1 ${result.success ? 'text-emerald-700' : 'text-red-600'}`}>
              {result.message}
            </p>
            {result.success && (
              <p className="text-xs text-slate-400 mt-3 font-medium">Mengarahkan ke dashboard dalam 3 detik...</p>
            )}
          </div>

          {!result.success && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          )}
        </div>
      )}

      {/* Scan Prompt */}
      {!result && !loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-6">
          {!manualInput && !urlToken ? (
            <>
              <div className="w-24 h-24 rounded-2xl bg-blue-50 flex items-center justify-center">
                <QrCode className="w-14 h-14 text-blue-600" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-800">Arahkan kamera ke QR Code</h3>
                <p className="text-xs text-slate-400 mt-1.5 font-medium max-w-xs leading-relaxed">
                  Klik link QR Code yang ditampilkan admin, atau masukkan token secara manual di bawah.
                </p>
              </div>
              <button
                onClick={() => {
                  setManualInput(true)
                  setTimeout(() => inputRef.current?.focus(), 100)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <Keyboard className="w-4 h-4" />
                Input Token Manual
              </button>
            </>
          ) : (
            <form onSubmit={handleManualSubmit} className="w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Token Absensi</label>
                <input
                  ref={inputRef}
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste atau ketik token disini..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </div>
              <button
                type="submit"
                disabled={!token}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                Absen Sekarang
              </button>
            </form>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs font-semibold">Memverifikasi absensi...</p>
        </div>
      )}
    </div>
  )
}
