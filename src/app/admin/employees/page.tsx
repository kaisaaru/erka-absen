import React from 'react'
import prisma from '@/lib/prisma'
import EmployeesManagement from '@/components/EmployeesManagement'

export const dynamic = 'force-dynamic'

export default async function AdminEmployeesPage() {
  const employees = await prisma.user.findMany({
    where: { role: 'employee' },
    orderBy: { name: 'asc' },
  })

  // Format to plain objects for React client
  const plainEmployees = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    phone: emp.phone || '',
    position: emp.position || '',
    employee_id: emp.employee_id || '',
    avatar: emp.avatar || '',
    faceImageRegistered: emp.face_image_registered || '',
  }))

  return <EmployeesManagement initialEmployees={plainEmployees} />
}
