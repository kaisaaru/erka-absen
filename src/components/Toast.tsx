'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const toast = {
    success: (msg: string, dur?: number) => addToast(msg, 'success', dur),
    error: (msg: string, dur?: number) => addToast(msg, 'error', dur),
    info: (msg: string, dur?: number) => addToast(msg, 'info', dur),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container positioned in top right */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  const bgClass =
    toast.type === 'success'
      ? 'bg-white/85 dark:bg-slate-900/85 border border-emerald-100 dark:border-emerald-950 text-slate-800 dark:text-slate-100 shadow-[0_10px_30px_rgba(16,185,129,0.08)]'
      : toast.type === 'error'
      ? 'bg-white/85 dark:bg-slate-900/85 border border-red-100 dark:border-red-950 text-slate-800 dark:text-slate-100 shadow-[0_10px_30px_rgba(239,68,68,0.08)]'
      : 'bg-white/85 dark:bg-slate-900/85 border border-blue-100 dark:border-blue-950 text-slate-800 dark:text-slate-100 shadow-[0_10px_30px_rgba(59,130,246,0.08)]'

  const Icon =
    toast.type === 'success'
      ? CheckCircle
      : toast.type === 'error'
      ? AlertCircle
      : Info

  const iconColor =
    toast.type === 'success'
      ? 'text-emerald-500'
      : toast.type === 'error'
      ? 'text-red-500'
      : 'text-blue-500'

  return (
    <div
      className={`pointer-events-auto p-4 pb-5 rounded-2xl border backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-toast-slide-in relative overflow-hidden ${bgClass}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-200">{toast.message}</div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg p-0.5 transition-colors shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Timer Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100/50 dark:bg-slate-800/30 overflow-hidden">
        <div
          className="h-full w-full animate-toast-progress"
          style={{
            animationDuration: `${toast.duration || 4000}ms`,
            backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6'
          }}
        />
      </div>
    </div>
  )
}
