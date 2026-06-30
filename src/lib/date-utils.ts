/**
 * Parse time string (HH:MM:SS or HH:MM) into minutes since midnight.
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + (m || 0)
}

/**
 * Check if check-in time exceeds office schedule + late tolerance.
 */
export function checkIsLate(
  checkInTimeStr: string | null | undefined, 
  officeCheckInStr: string, 
  toleranceMinutes: number
): boolean {
  if (!checkInTimeStr) return false
  
  const checkInMinutes = timeToMinutes(checkInTimeStr)
  const limitMinutes = timeToMinutes(officeCheckInStr) + toleranceMinutes
  
  return checkInMinutes > limitMinutes
}

/**
 * Get current date string in WIB timezone (Asia/Jakarta) format YYYY-MM-DD.
 */
export function getJakartaDateString(date: Date = new Date()): string {
  // Asia/Jakarta is GMT+7
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  const jakartaDate = new Date(utc + (3600000 * 7))
  
  const yyyy = jakartaDate.getFullYear()
  const mm = String(jakartaDate.getMonth() + 1).padStart(2, '0')
  const dd = String(jakartaDate.getDate()).padStart(2, '0')
  
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Get current time string in WIB timezone (Asia/Jakarta) format HH:MM:SS.
 */
export function getJakartaTimeString(date: Date = new Date()): string {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  const jakartaDate = new Date(utc + (3600000 * 7))
  
  const hh = String(jakartaDate.getHours()).padStart(2, '0')
  const mm = String(jakartaDate.getMinutes()).padStart(2, '0')
  const ss = String(jakartaDate.getSeconds()).padStart(2, '0')
  
  return `${hh}:${mm}:${ss}`
}

/**
 * Format database date into indonesian readable date (d/m/Y).
 */
export function formatReadableDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
