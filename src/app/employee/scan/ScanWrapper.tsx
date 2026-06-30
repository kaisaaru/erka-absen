'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import client scan content to prevent server-side rendering errors with face-api
const EmployeeScanContent = dynamic(() => import('./ScanContent'), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-slate-400 font-medium">Memuat halaman scan...</div>
})

export default function ScanWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-medium">Memuat halaman scan...</div>}>
      <EmployeeScanContent />
    </Suspense>
  )
}
