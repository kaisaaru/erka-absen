# ERKA Attendance — Next.js + Supabase

Sistem Absensi Karyawan Berbasis QR Code Dinamis dan Real-time, dibangun dengan menggunakan Next.js (App Router), Prisma ORM, dan database PostgreSQL (Supabase).

---

## 🚀 Fitur Utama

- **Authentication & Security**: Login dengan HTTP-Only Cookie JWT aman dan perlindungan rute halaman (Admin / Karyawan).
- **Dashboard Statistik (Admin)**: Visualisasi grafis kehadiran mingguan, sesi aktif hari ini, dan summary data kehadiran cepat (Hadir, WFH, Tugas Luar, Izin/Sakit, Alpha).
- **Generate QR & Token**: Pembuatan QR Code dinamis dengan durasi kadaluarsa yang dapat diatur serta token input manual.
- **Kelola Karyawan**: CRUD Karyawan (Create, Read, Update, Delete) yang menggunakan antarmuka modern (Modal overlay & Client-side Search).
- **Absensi & Status**: Pemantauan kehadiran real-time dan fitur edit status absensi karyawan (Hadir, WFH, Tugas Luar, Izin, Sakit, Alpha).
- **Laporan Komprehensif**: Fitur download laporan kehadiran dalam format Microsoft Excel (`.xlsx`) dan Adobe PDF (`.pdf`) dengan styling premium.
- **Log Aktivitas**: Read-only log telemetry aktivitas sistem secara otomatis untuk mencatat login, unduh laporan, perubahan absensi, dsb.
- **Karyawan Portal**: Dashboard pribadi karyawan untuk memantau kehadiran bulanan, scan QR absensi harian, dan melihat riwayat lengkap.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & React 19)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Exporting**: `exceljs` & `jspdf` / `jspdf-autotable`
- **Utility**: `bcryptjs` (Hashing), `jsonwebtoken` (Auth), `lucide-react` (Icons), `qrcode` (QR Generator)

---

## 📦 Panduan Instalasi & Setup

### 1. Kloning & Persiapan Dependensi
Masuk ke direktori projek dan install semua library pendukung:
```bash
npm install
```

### 2. Konfigurasi Environment File
Salin file `.env.example` menjadi `.env` di root direktori:
```bash
cp .env.example .env
```
Buka file `.env` baru tersebut, lalu sesuaikan isinya dengan string koneksi database Supabase Anda:
```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
JWT_SECRET="ganti-dengan-kunci-jwt-rahasia-dan-kuat-minimal-32-karakter"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Migrasi Database & Seeder
Gunakan perintah Prisma berikut untuk menyinkronkan skema tabel ke database Supabase dan mengisi data awal (1 admin + 5 karyawan + setting default):
```bash
npx prisma db push
npx prisma db seed
```

### 4. Menjalankan Server Lokal
Jalankan aplikasi dalam mode development:
```bash
npm run dev
```
Buka **http://localhost:3000** di web browser Anda.

---

## 🔑 Kredensial Default (Seeder)

Setelah berhasil melakukan seeding, Anda dapat masuk menggunakan akun default berikut:

- **Admin Account**:
  - Email: `admin@erka.com`
  - Password: `password`
- **Karyawan Account**:
  - Email: `andi@erka.com` (atau `budi@erka.com`, `citra@erka.com`, `dedi@erka.com`, `eka@erka.com`)
  - Password: `password`
