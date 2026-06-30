import React from 'react'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch office settings
  const officeNameSetting = await prisma.setting.findUnique({
    where: { key: 'office_name' },
  })
  const officeName = officeNameSetting?.value || 'ERKA'

  // Get current admin user details
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value || ''
  const userPayload = token ? verifyToken(token) : null
  const adminName = userPayload?.name || 'Administrator'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Component */}
      <AdminSidebar officeName={officeName} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm shadow-slate-100/40">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">Halo, {adminName}</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <button className="relative p-1 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800">{adminName}</p>
                <p className="text-[10px] text-slate-400 font-medium">Admin</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm border border-blue-700 shadow-sm">
                {adminName.substring(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
