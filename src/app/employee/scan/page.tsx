import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getJakartaDateString } from '@/lib/date-utils'
import { CalendarCheck } from 'lucide-react'
import ScanWrapper from './ScanWrapper'

export const dynamic = 'force-dynamic'

export default async function EmployeeScanPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value || ''
  const userPayload = token ? verifyToken(token) : null
  const userId = userPayload?.userId

  let hasCompletedAttendance = false

  if (userId) {
    const todayStr = getJakartaDateString()
    const today = new Date(todayStr)
    const todayAttendance = await prisma.attendance.findFirst({
      where: { user_id: userId, attendance_date: today },
    })
    if (todayAttendance?.check_out_time) {
      hasCompletedAttendance = true
    }
  }

  if (hasCompletedAttendance) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
          <CalendarCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Absensi Selesai</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Anda telah menyelesaikan absen masuk dan pulang untuk hari ini. Tidak perlu melakukan scan lagi. Selamat beristirahat!
          </p>
        </div>
      </div>
    )
  }

  return <ScanWrapper />
}
