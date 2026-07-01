import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getJakartaDateString, getJakartaTimeString, timeToMinutes } from '@/lib/date-utils'
import { CalendarCheck, Clock } from 'lucide-react'
import ScanWrapper from './ScanWrapper'

export const dynamic = 'force-dynamic'

export default async function EmployeeScanPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value || ''
  const userPayload = token ? verifyToken(token) : null
  const userId = userPayload?.userId

  let hasCompletedAttendance = false
  let isEarlyCheckOut = false
  let officeCheckOutTime = '17:00'

  if (userId) {
    const todayStr = getJakartaDateString()
    const today = new Date(todayStr)
    const todayAttendance = await prisma.attendance.findFirst({
      where: { user_id: userId, attendance_date: today },
    })

    if (todayAttendance) {
      if (todayAttendance.check_out_time) {
        hasCompletedAttendance = true
      } else {
        // Already checked in, check if before office check-out time
        const checkOutTimeSet = await prisma.setting.findUnique({ where: { key: 'office_check_out_time' } })
        officeCheckOutTime = checkOutTimeSet?.value || '17:00'

        const currentTimeStr = getJakartaTimeString()
        const currentShortTime = currentTimeStr.substring(0, 5)

        const currentMinutes = timeToMinutes(currentShortTime)
        const officeCheckOutMinutes = timeToMinutes(officeCheckOutTime)

        if (currentMinutes < officeCheckOutMinutes) {
          isEarlyCheckOut = true
        }
      }
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

  if (isEarlyCheckOut) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-250 shadow-sm animate-pulse">
          <Clock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Belum Saatnya Pulang</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Anda sudah melakukan absen masuk. Fitur scan absensi pulang baru akan terbuka pada pukul <strong className="text-slate-700">{officeCheckOutTime} WIB</strong>.
          </p>
        </div>
      </div>
    )
  }

  return <ScanWrapper />
}
