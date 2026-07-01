'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Search, X, ChevronDown, Calendar, Trash2 } from 'lucide-react'
import { formatReadableDate } from '@/lib/date-utils'
import { useToast } from '@/components/Toast'

interface AttendanceRecord {
  id: number
  userId: number
  employeeName: string
  employeeNip: string
  attendanceDate: string
  checkInTime: string
  checkOutTime: string
  status: string
  notes: string
  isLate: boolean
  faceImageIn: string
  faceImageOut: string
}

interface EmployeeOption {
  id: number
  name: string
}

interface AttendancesManagementProps {
  initialAttendances: AttendanceRecord[]
  employees: EmployeeOption[]
  dateFilter: string
  userIdFilter: string
  statusFilter: string
  currentPage: number
  totalPages: number
}

export default function AttendancesManagement({
  initialAttendances,
  employees,
  dateFilter,
  userIdFilter,
  statusFilter,
  currentPage,
  totalPages,
}: AttendancesManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Filter form states
  const [dateVal, setDateVal] = useState(dateFilter)
  const [userIdVal, setUserIdVal] = useState(userIdFilter)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [statusVal, setStatusVal] = useState(statusFilter)

  // Custom searchable employee dropdown states
  const [employeeOpen, setEmployeeOpen] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const activeEmployee = employees.find(e => String(e.id) === userIdVal)
  const [selectedEmployeeName, setSelectedEmployeeName] = useState(activeEmployee ? activeEmployee.name : 'Semua Karyawan')

  // Custom searchable status dropdown states
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusSearch, setStatusSearch] = useState('')
  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'hadir', label: 'Hadir' },
    { value: 'wfh', label: 'WFH' },
    { value: 'tugas_luar', label: 'Tugas Luar' },
    { value: 'izin', label: 'Izin' },
    { value: 'sakit', label: 'Sakit' },
    { value: 'alpha', label: 'Alpha' }
  ]
  const activeStatus = statusOptions.find(s => s.value === statusVal)
  const [selectedStatusLabel, setSelectedStatusLabel] = useState(activeStatus ? activeStatus.label : 'Semua Status')

  // Edit Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [editStatus, setEditStatus] = useState('hadir')
  const [editStatusLabel, setEditStatusLabel] = useState('Hadir')
  const [editNotes, setEditNotes] = useState('')
  
  const [loading, setLoading] = useState(false)

  // Delete Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<AttendanceRecord | null>(null)

  // Sync state when filters from page change
  useEffect(() => {
    setDateVal(dateFilter)
    setUserIdVal(userIdFilter)
    const emp = employees.find(e => String(e.id) === userIdFilter)
    setSelectedEmployeeName(emp ? emp.name : 'Semua Karyawan')

    setStatusVal(statusFilter)
    const st = statusOptions.find(s => s.value === statusFilter)
    setSelectedStatusLabel(st ? st.label : 'Semua Status')
  }, [dateFilter, userIdFilter, statusFilter])

  // Close custom dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.employee-dropdown-container')) {
        setEmployeeOpen(false)
      }
      if (!target.closest('.status-dropdown-container')) {
        setStatusOpen(false)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  // Filter employee options
  const filteredEmployeeOptions = [
    { id: 0, name: 'Semua Karyawan' },
    ...employees
  ].filter(emp => emp.name.toLowerCase().includes(employeeSearch.toLowerCase()))

  // Filter status options
  const filteredStatusOptions = statusOptions.filter(opt =>
    opt.label.toLowerCase().includes(statusSearch.toLowerCase())
  )

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const urlParams = new URLSearchParams()
      if (dateVal) urlParams.set('date', dateVal)
      if (userIdVal) urlParams.set('user_id', userIdVal)
      if (statusVal) urlParams.set('status', statusVal)
      urlParams.set('page', '1')
      router.push(`/admin/attendances?${urlParams.toString()}`)
    })
  }

  const handleResetFilter = () => {
    setDateVal('')
    setUserIdVal('')
    setSelectedEmployeeName('Semua Karyawan')
    setStatusVal('')
    setSelectedStatusLabel('Semua Status')
    
    startTransition(() => {
      router.push('/admin/attendances')
    })
  }

  const handlePageChange = (page: number) => {
    startTransition(() => {
      const urlParams = new URLSearchParams()
      if (dateFilter) urlParams.set('date', dateFilter)
      if (userIdFilter) urlParams.set('user_id', userIdFilter)
      if (statusFilter) urlParams.set('status', statusFilter)
      urlParams.set('page', String(page))
      router.push(`/admin/attendances?${urlParams.toString()}`)
    })
  }

  const triggerSuccessAlert = (msg: string) => {
    toast.success(msg)
  }

  // Open Edit Modal
  const openEditModal = (rec: AttendanceRecord) => {
    setSelectedRecord(rec)
    setEditStatus(rec.status)
    const opt = statusOptions.find(s => s.value === rec.status)
    setEditStatusLabel(opt ? opt.label : 'Hadir')
    setEditNotes(rec.notes)
    setShowEditModal(true)
  }

  // Submit Edit Status
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord) return
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/attendances/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, notes: editNotes }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setShowEditModal(false)
        triggerSuccessAlert('Status absensi berhasil diperbarui.')
        startTransition(() => {
          router.refresh()
        })
      } else {
        toast.error(data.message || 'Terjadi kesalahan.')
      }
    } catch (err) {
      toast.error('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  // Delete attendance handler
  const handleDeleteClick = (rec: AttendanceRecord) => {
    setDeleteRecord(rec)
    setShowDeleteModal(true)
  }

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deleteRecord) return
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/attendances/${deleteRecord.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setShowDeleteModal(false)
        setDeleteRecord(null)
        triggerSuccessAlert('Data absensi berhasil dihapus.')
        startTransition(() => {
          router.refresh()
        })
      } else {
        toast.error(data.message || 'Terjadi kesalahan.')
      }
    } catch (err) {
      toast.error('Koneksi server gagal.')
    } finally {
      setLoading(false)
    }
  }

  // Mappings
  const statusColors: Record<string, string> = {
    hadir: 'bg-emerald-100 text-emerald-700',
    wfh: 'bg-blue-100 text-blue-700',
    tugas_luar: 'bg-purple-100 text-purple-700',
    izin: 'bg-yellow-100 text-yellow-700',
    sakit: 'bg-orange-100 text-orange-700',
    alpha: 'bg-red-100 text-red-700',
  }

  const statusLabels: Record<string, string> = {
    hadir: 'Hadir',
    wfh: 'WFH',
    tugas_luar: 'Tugas Luar',
    izin: 'Izin',
    sakit: 'Sakit',
    alpha: 'Alpha',
  }

  return (
    <div className="space-y-6">

      {/* Filter Form (fixed relative stacking overlay index) */}
      <form onSubmit={handleApplyFilter} className="flex flex-wrap gap-3 items-center relative z-20">
        <div className="relative">
          <input
            type="date"
            value={dateVal}
            onChange={(e) => setDateVal(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 font-semibold"
          />
        </div>

        {/* Searchable Employee Dropdown */}
        <div className="relative w-56">
          <button
            type="button"
            onClick={() => {
              setEmployeeOpen(!employeeOpen)
              setStatusOpen(false)
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
          >
            <span className="truncate">{selectedEmployeeName}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
          </button>
          {employeeOpen && (
            <div className="absolute z-40 mt-1 w-full bg-white rounded-xl border border-gray-100 shadow-xl p-2 space-y-2">
              <input
                type="text"
                placeholder="Cari..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredEmployeeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setUserIdVal(opt.id === 0 ? '' : String(opt.id))
                      setSelectedEmployeeName(opt.name)
                      setEmployeeOpen(false)
                      setEmployeeSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition-colors ${
                      (opt.id === 0 && !userIdVal) || String(opt.id) === userIdVal
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Searchable Status Dropdown */}
        <div className="relative w-48">
          <button
            type="button"
            onClick={() => {
              setStatusOpen(!statusOpen)
              setEmployeeOpen(false)
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
          >
            <span className="truncate">{selectedStatusLabel}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
          </button>
          {statusOpen && (
            <div className="absolute z-40 mt-1 w-full bg-white rounded-xl border border-gray-100 shadow-xl p-2 space-y-2">
              <input
                type="text"
                placeholder="Cari..."
                value={statusSearch}
                onChange={(e) => setStatusSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredStatusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setStatusVal(opt.value)
                      setSelectedStatusLabel(opt.label)
                      setStatusOpen(false)
                      setStatusSearch('')
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 transition-colors ${
                      opt.value === statusVal
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
        >
          Filter
        </button>
        <button
          type="button"
          onClick={handleResetFilter}
          className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors shrink-0"
        >
          Reset
        </button>
      </form>

      {/* Table Card (overlay fix enables lists to float over table cleanly) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden z-10 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-400 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Karyawan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Masuk</th>
                <th className="px-6 py-4">Pulang</th>
                <th className="px-6 py-4">Foto Bukti</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {initialAttendances.length > 0 ? (
                initialAttendances.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {formatReadableDate(new Date(rec.attendanceDate))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                          {rec.employeeName.substring(0, 1)}
                        </div>
                        <span className="font-bold text-slate-800">{rec.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[rec.status]}`}>
                        {statusLabels[rec.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {rec.checkInTime || '-'}
                      {rec.isLate && (
                        <span className="block text-[9px] text-red-500 font-semibold leading-none mt-0.5">(Terlambat)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{rec.checkOutTime || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 items-center">
                        {rec.faceImageIn ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <img 
                              src={rec.faceImageIn} 
                              alt="Face in proof"
                              onClick={() => setLightboxImage(rec.faceImageIn)}
                              className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:scale-110 border border-slate-200 shadow-sm transition-all"
                            />
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Masuk</span>
                          </div>
                        ) : null}

                        {rec.faceImageOut ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <img 
                              src={rec.faceImageOut} 
                              alt="Face out proof"
                              onClick={() => setLightboxImage(rec.faceImageOut)}
                              className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:scale-110 border border-slate-200 shadow-sm transition-all"
                            />
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Pulang</span>
                          </div>
                        ) : null}

                        {/* Show Absen QR text badge if QR method was used (no face snap proof exists) */}
                        {((rec.checkInTime && !rec.faceImageIn) || (rec.checkOutTime && !rec.faceImageOut)) && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-150 shadow-sm">
                            Absen QR
                          </span>
                        )}

                        {!rec.faceImageIn && !rec.faceImageOut && !rec.checkInTime && !rec.checkOutTime && (
                          <span className="text-[10px] text-slate-400 font-medium italic">Tidak ada</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium text-xs max-w-[150px] truncate" title={rec.notes}>
                      {rec.notes || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Absensi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(rec)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                        title="Hapus Absensi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium italic">Tidak ada data absensi ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between gap-4">
            <button
              disabled={currentPage === 1 || isPending}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="text-xs text-slate-500 font-medium">Halaman {currentPage} dari {totalPages}</span>
            <button
              disabled={currentPage === totalPages || isPending}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* EDIT ATTENDANCE MODAL OVERLAY */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl p-6 sm:p-8 relative">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Absensi</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Karyawan</label>
                <p className="text-sm font-bold text-slate-800">{selectedRecord.employeeName}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal</label>
                <p className="text-sm font-semibold text-slate-600">{formatReadableDate(new Date(selectedRecord.attendanceDate))}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Status Kehadiran <span className="text-red-500">*</span></label>
                {/* Status custom select inside modal */}
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      setEditStatus(e.target.value)
                      const opt = statusOptions.find(o => o.value === e.target.value)
                      setEditStatusLabel(opt ? opt.label : 'Hadir')
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hadir">Hadir</option>
                    <option value="wfh">WFH</option>
                    <option value="tugas_luar">Tugas Luar</option>
                    <option value="izin">Izin</option>
                    <option value="sakit">Sakit</option>
                    <option value="alpha">Alpha</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="edit_notes" className="block text-xs font-bold text-slate-500 mb-1.5">Keterangan / Catatan</label>
                <textarea
                  id="edit_notes"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Tambahkan catatan keterangan..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>


              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ATTENDANCE MODAL OVERLAY */}
      {showDeleteModal && deleteRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl p-6 sm:p-8 relative">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Hapus Absensi</h3>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <p className="text-sm text-slate-500">
                Apakah Anda yakin ingin menghapus data absensi ini? Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Karyawan</span>
                  <span className="font-bold text-slate-800 text-sm">{deleteRecord.employeeName}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Tanggal</span>
                  <span className="font-semibold text-slate-700 text-sm">{formatReadableDate(new Date(deleteRecord.attendanceDate))}</span>
                </div>
              </div>


              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-lg shadow-red-100 hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Hapus Absensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX OVERLAY */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
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
              alt="Verification face preview" 
              className="w-full h-auto aspect-square object-cover rounded-xl border border-slate-100"
            />
            <p className="text-center text-xs font-bold text-slate-700 mt-3">Foto Bukti Verifikasi Wajah</p>
          </div>
        </div>
      )}
    </div>
  )
}
