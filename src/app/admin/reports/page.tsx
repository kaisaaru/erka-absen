import React from 'react'
import prisma from '@/lib/prisma'
import ReportsClient from '@/components/ReportsClient'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const employees = await prisma.user.findMany({
    where: { role: 'employee' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Laporan Absensi</h2>
        <p className="text-sm text-gray-500 mt-1">Unduh laporan kehadiran karyawan dalam format Excel atau PDF</p>
      </div>

      <ReportsClient employees={employees} />
    </div>
  )
}
