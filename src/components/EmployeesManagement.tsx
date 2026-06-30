'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, X, CheckCircle } from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  phone: string
  position: string
  employee_id: string
  avatar: string
  faceImageRegistered?: string
}

interface EmployeesManagementProps {
  initialEmployees: Employee[]
}

export default function EmployeesManagement({ initialEmployees }: EmployeesManagementProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Filter employees based on search term when Cari is clicked or search state is filtered
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset forms
  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setPhone('')
    setPosition('')
    setEmployeeId('')
    setError('')
  }

  // Handle open create modal
  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  // Handle open edit modal
  const openEditModal = (emp: Employee) => {
    resetForm()
    setSelectedEmployee(emp)
    setName(emp.name)
    setEmail(emp.email)
    setPhone(emp.phone)
    setPosition(emp.position)
    setEmployeeId(emp.employee_id)
    setShowEditModal(true)
  }

  // Handle open delete modal
  const openDeleteModal = (emp: Employee) => {
    setSelectedEmployee(emp)
    setShowDeleteModal(true)
  }

  // Trigger alert timeout
  const triggerSuccessAlert = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 4000)
  }

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, position, employee_id: employeeId }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setEmployees([data.employee, ...employees])
        setShowCreateModal(false)
        triggerSuccessAlert('Karyawan berhasil ditambahkan.')
        startTransition(() => {
          router.refresh()
        })
      } else {
        setError(data.message || 'Terjadi kesalahan.')
      }
    } catch (err) {
      setError('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, position, employee_id: employeeId }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setEmployees(employees.map(emp => emp.id === selectedEmployee.id ? data.employee : emp))
        setShowEditModal(false)
        triggerSuccessAlert('Data karyawan berhasil diperbarui.')
        startTransition(() => {
          router.refresh()
        })
      } else {
        setError(data.message || 'Terjadi kesalahan.')
      }
    } catch (err) {
      setError('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedEmployee) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setEmployees(employees.filter(emp => emp.id !== selectedEmployee.id))
        setShowDeleteModal(false)
        triggerSuccessAlert('Karyawan berhasil dihapus.')
        startTransition(() => {
          router.refresh()
        })
      } else {
        setError(data.message || 'Terjadi kesalahan.')
      }
    } catch (err) {
      setError('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchTerm(search)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold text-emerald-800">{success}</span>
        </div>
      )}

      {/* Header section (title + button side-by-side) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daftar Karyawan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Kelola data karyawan perusahaan</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      {/* Table Card container */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        {/* Search filter bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Cari nama, email, atau NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
          >
            Cari
          </button>
        </form>

        {/* Table representation */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-450 uppercase font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Nip</th>
                <th className="px-6 py-4">Jabatan</th>
                <th className="px-6 py-4">Telepon</th>
                <th className="px-6 py-4">Wajah Regis</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors text-slate-700">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img 
                            src={emp.avatar} 
                            alt={emp.name} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {emp.name.substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 leading-none">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-semibold">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700">{emp.employee_id || '-'}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700">{emp.position || '-'}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700">{emp.phone || '-'}</td>
                    <td className="px-6 py-3.5">
                      {emp.faceImageRegistered ? (
                        <img 
                          src={emp.faceImageRegistered} 
                          alt="Face registration proof"
                          onClick={() => setLightboxImage(emp.faceImageRegistered || null)}
                          className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:scale-110 border border-slate-200 shadow-sm transition-all"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">Belum terdaftar</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(emp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">Tidak ada data karyawan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="text-[10px] text-slate-400 font-bold">Halaman {currentPage} dari {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl p-6 sm:p-8 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-slate-50 pb-3">Tambah Karyawan</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                  placeholder="Nama Lengkap"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">NIP</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                    placeholder="NIP"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Jabatan</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                    placeholder="Jabatan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                  placeholder="Telepon"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl p-6 sm:p-8 relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-slate-50 pb-3">Edit Karyawan</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                    placeholder="Kosongkan jika tidak diubah"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">NIP</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Jabatan</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Telepon</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 sm:p-8 relative">
            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-slate-50 pb-2">Hapus Karyawan</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun karyawan <strong className="text-slate-800">{selectedEmployee.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold">
                {error}
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX OVERLAY */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute right-6 top-6 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={lightboxImage} 
              alt="Registered face details" 
              className="w-full h-auto aspect-square object-cover rounded-xl border border-slate-100"
            />
            <p className="text-center text-xs font-bold text-slate-700 mt-3">Foto Registrasi Awal Wajah Karyawan</p>
          </div>
        </div>
      )}
    </div>
  )
}
