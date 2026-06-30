'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

// Import client scanner dynamically to prevent SSR errors
const FaceEnrollment = dynamic(() => import('@/components/FaceEnrollment'), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-slate-400 font-medium">Memuat sistem kamera wajah...</div>
})

export default function RegisterFacePage() {
  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Back to dashboard */}
      <div>
        <Link
          href="/employee/dashboard"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Daftarkan Wajah</h2>
        <p className="text-xs text-slate-500 mt-1">Daftarkan wajah Anda untuk digunakan sebagai verifikasi keamanan saat absensi.</p>
      </div>

      <FaceEnrollment />
    </div>
  )
}
