'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { QrCode, RefreshCw, XCircle, Users, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Session {
  id: number
  type: string
  qr_token: string
  qr_expires_at: string
  qr_duration_minutes: number
  status: string
}

interface Attendee {
  id: number
  name: string
  employee_id: string
  time: string | null
}

interface QRDisplayContainerProps {
  initialSession: Session
}

export default function QRDisplayContainer({ initialSession }: QRDisplayContainerProps) {
  const [session, setSession] = useState<Session>(initialSession)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [count, setCount] = useState(0)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate QR code data URL when token changes
  useEffect(() => {
    if (typeof window !== 'undefined' && session.qr_token) {
      const scanUrl = `${window.location.origin}/employee/scan?token=${session.qr_token}`
      QRCode.toDataURL(scanUrl, { width: 300, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err))
    }
  }, [session.qr_token])

  // Polling attendees and session status
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const fetchAttendees = async () => {
      try {
        const res = await fetch(`/api/admin/sessions/${session.id}/attendees`)
        const data = await res.json()
        if (res.ok && data.success) {
          setCount(data.count)
          setAttendees(data.attendees)
          setSession(data.session)
        }
      } catch (err) {
        console.error('Error polling attendees:', err)
      }
    }

    // Call initially
    fetchAttendees()

    // Start interval if active
    if (session.status === 'active') {
      intervalId = setInterval(fetchAttendees, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [session.id, session.status])

  // Regenerate QR Code
  const handleRegenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}/regenerate`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setSession(data.session)
      } else {
        setError(data.message || 'Gagal me-regenerate QR Code.')
      }
    } catch (err) {
      setError('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  // Close Session
  const handleClose = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}/close`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setSession(data.session)
      } else {
        setError(data.message || 'Gagal menutup sesi.')
      }
    } catch (err) {
      setError('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  const typeLabel = session.type === 'check_in' ? 'Absen Masuk' : 'Absen Pulang'
  const isExpired = session.status === 'expired'
  const isClosed = session.status === 'closed'
  const isActive = session.status === 'active'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/sessions"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Sesi
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: QR Code Display Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col items-center justify-between text-center min-h-[500px]">
          <div>
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
              Scan QR {typeLabel}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Scan menggunakan kamera HP Anda</p>
          </div>

          {/* QR Area */}
          <div className="relative my-6 flex flex-col items-center justify-center">
            {isActive && qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Scan Me" className="w-64 h-64 border-2 border-slate-100 rounded-xl" />
            ) : (
              <div className="w-64 h-64 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
                {isExpired ? (
                  <>
                    <XCircle className="w-12 h-12 text-amber-500 mb-2" />
                    <p className="text-sm font-bold text-slate-700">QR Code Kedaluwarsa</p>
                    <p className="text-[10px] text-slate-400 mt-1">Tekan Regenerate untuk membuat QR baru</p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-12 h-12 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-700">Sesi Telah Ditutup</p>
                    <p className="text-[10px] text-slate-400 mt-1">Terima kasih, absensi selesai.</p>
                  </>
                )}
              </div>
            )}

            {/* Manual Token Display (wrap enabled word-break) */}
            {isActive && (
              <div className="mt-4 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 max-w-xs">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Token Manual</span>
                <span className="block text-xs font-mono text-slate-600 font-semibold break-all mt-0.5">{session.qr_token}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full space-y-3">
            {error && (
              <p className="text-xs text-red-500 font-semibold">{error}</p>
            )}

            <div className="flex gap-3">
              {(isActive || isExpired) && (
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate QR
                </button>
              )}

              {isActive && (
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-all disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Tutup Sesi
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Attendees List Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Scanned Karyawan ({count})
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
              Real-time Polling
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] space-y-3 pr-1">
            {attendees.length > 0 ? (
              attendees.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {att.name.substring(0, 1)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{att.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">NIP: {att.employee_id || '-'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">{att.time || '-'} WIB</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 italic">
                <p className="text-xs font-medium">Belum ada karyawan yang melakukan scan pada sesi ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
