import React from 'react'
import prisma from '@/lib/prisma'
import SettingsClient from '@/components/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settingsList = await prisma.setting.findMany()
  const settingsMap: Record<string, string> = Object.fromEntries(
    settingsList
      .filter(s => s.value !== null)
      .map(s => [s.key, s.value as string])
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan</h2>
        <p className="text-sm text-gray-500 mt-1">Konfigurasi umum sistem absensi ERKA</p>
      </div>

      <SettingsClient settings={settingsMap} />
    </div>
  )
}
