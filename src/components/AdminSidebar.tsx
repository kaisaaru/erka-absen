'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  QrCode, 
  Users, 
  CalendarRange, 
  BarChart3, 
  History, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface AdminSidebarProps {
  officeName: string
}

export default function AdminSidebar({ officeName }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        router.replace('/login')
        router.refresh()
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Karyawan', path: '/admin/employees', icon: Users },
    { name: 'Generate QR', path: '/admin/sessions', icon: QrCode },
    { name: 'Absensi', path: '/admin/attendances', icon: CalendarRange },
    { name: 'Laporan', path: '/admin/reports', icon: BarChart3 },
    { name: 'Log Aktivitas', path: '/admin/logs', icon: History },
    { name: 'Pengaturan', path: '/admin/settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile top nav bar */}
      <header className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-sm font-bold text-slate-800">{officeName}</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-1 text-slate-500 hover:text-slate-700"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      {/* Sidebar navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and close btn */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 shadow-md shadow-blue-200">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none truncate max-w-[140px]">{officeName}</h1>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Attendance</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.path)
            return (
              <Link 
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Logout button */}
        <div className="px-4 py-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
