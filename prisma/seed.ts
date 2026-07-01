import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// Simple singleton style for the CLI seeder
const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean old settings/users if exist to make it fresh
  await prisma.activityLog.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.attendanceSession.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.user.deleteMany()

  // Hash default password
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash('password', salt)

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@erka.com',
      password: passwordHash,
      role: 'admin',
      phone: '081234567890',
      position: 'Admin',
      employee_id: 'ADM001',
    },
  })
  console.log(`Created admin: ${admin.email}`)

  // 2. Create Sample Employees
  const employees = [
    {
      name: 'Kasir',
      email: 'kasir@erka.com',
      password: passwordHash,
      role: 'employee',
      phone: '081234567891',
      position: 'Manager',
      employee_id: 'KSR001',
    },
  ]

  for (const emp of employees) {
    const user = await prisma.user.create({ data: emp })
    console.log(`Created employee: ${user.email}`)
  }

  // 3. Create Default Settings
  const settings = [
    { key: 'office_name', value: 'ERKA' },
    { key: 'office_check_in_time', value: '08:00' },
    { key: 'office_check_out_time', value: '17:00' },
    { key: 'office_late_tolerance_minutes', value: '15' },
  ]

  for (const set of settings) {
    const setting = await prisma.setting.create({ data: set })
    console.log(`Created setting: ${setting.key} = ${setting.value}`)
  }

  console.log('Database seeding completed successfully!')
  await pool.end()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
