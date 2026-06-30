import { Suspense } from 'react'
import EmployeeScanContent from './ScanContent'

export default function EmployeeScanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-medium">Memuat halaman scan...</div>}>
      <EmployeeScanContent />
    </Suspense>
  )
}
