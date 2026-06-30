import React from 'react'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import EmployeeSidebar from '@/components/EmployeeSidebar'
import prisma from '@/lib/prisma'

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value || ''
  const userPayload = token ? verifyToken(token) : null
  const employeeName = userPayload?.name || 'Karyawan'

  // Office name for branding
  const officeNameSetting = await prisma.setting.findUnique({ where: { key: 'office_name' } })
  const officeName = officeNameSetting?.value || 'ERKA'

  const dbUser = userPayload ? await prisma.user.findUnique({ where: { id: userPayload.userId } }) : null
  const hasFaceDescriptor = !!dbUser?.face_descriptor

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <EmployeeSidebar officeName={officeName} hasFace={hasFaceDescriptor} />

      <div className="flex-1 lg:pl-64 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">Karyawan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs border border-emerald-200">
              {employeeName.substring(0, 1)}
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{employeeName}</span>
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
