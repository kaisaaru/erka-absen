'use client'

import { usePathname } from 'next/navigation'
import NextTopLoader from 'nextjs-toploader'

export default function RouteMiniload() {
  const pathname = usePathname()

  // Dynamic colors: Blue for Admin, Green for Employee, Default Blue
  const color = pathname.startsWith('/admin')
    ? '#2563eb'
    : pathname.startsWith('/employee')
    ? '#10b981'
    : '#2563eb'

  return (
    <NextTopLoader
      color={color}
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow={`0 0 10px ${color}, 0 0 5px ${color}`}
    />
  )
}
