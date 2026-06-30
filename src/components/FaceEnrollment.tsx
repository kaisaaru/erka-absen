'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import * as faceapi from 'face-api.js'

export default function FaceEnrollment() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [loading, setLoading] = useState(true)
  const [statusText, setStatusText] = useState('Memuat model pemindaian wajah...')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const hasEnrolledRef = useRef(false)

  // 1. Load models and verify enrollment status on mount
  useEffect(() => {
    async function init() {
      try {
        setStatusText('Memverifikasi status wajah...')
        const checkRes = await fetch('/api/employee/registered-descriptor')
        const checkData = await checkRes.json()

        if (checkRes.ok && checkData.enrolled) {
          setIsAlreadyEnrolled(true)
          setLoading(false)
          return
        }

        setStatusText('Memuat kecerdasan buatan wajah...')
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        
        setStatusText('Membuka kamera depan...')
        startCamera()
      } catch (err) {
        console.error('Failed to load face-api models:', err)
        setError('Gagal memuat sistem deteksi wajah. Hubungi admin.')
        setLoading(false)
      }
    }
    init()

    return () => {
      stopCamera()
    }
  }, [])

  // 2. Start Front Camera
  const startCamera = async () => {
    setError('')
    setLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setLoading(false)
      setStatusText('Posisikan wajah Anda di tengah lingkaran')
      setCapturing(true)
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Tidak dapat mengakses kamera depan. Pastikan izin kamera aktif.')
      setLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // 3. Face Detection loop
  useEffect(() => {
    let active = true
    let detectInterval: any

    if (capturing && !loading && !success && !hasEnrolledRef.current) {
      detectInterval = setInterval(async () => {
        if (!videoRef.current || !active || hasEnrolledRef.current) return

        try {
          const video = videoRef.current
          // Only detect if video metadata is loaded
          if (video.paused || video.ended || video.readyState < 2) return

          const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor()

          if (detection) {
            setProgress((prev) => {
              const next = prev + 25
              if (next >= 100 && !hasEnrolledRef.current) {
                hasEnrolledRef.current = true // LOCK immediately
                clearInterval(detectInterval)
                active = false
                handleEnroll(detection.descriptor)
                return 100
              }
              setStatusText(`Memindai: ${next}% (Tahan posisi wajah Anda...)`)
              return next
            })
          } else {
            setProgress(0)
            setStatusText('Wajah tidak terdeteksi. Silakan posisikan wajah Anda lebih dekat.')
          }
        } catch (err) {
          console.error('Error running face detection:', err)
        }
      }, 600)
    }

    return () => {
      active = false
      if (detectInterval) clearInterval(detectInterval)
    }
  }, [capturing, loading, success])

  // 4. Submit Face data to server
  const handleEnroll = async (descriptor: Float32Array) => {
    setLoading(true)
    setStatusText('Menyimpan data pendaftaran wajah...')

    // Capture snapshot WHILE camera is still streaming
    let avatarBase64 = ''
    if (videoRef.current) {
      const video = videoRef.current
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 160
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const size = Math.min(video.videoWidth, video.videoHeight)
          const sx = (video.videoWidth - size) / 2
          const sy = (video.videoHeight - size) / 2
          ctx.drawImage(video, sx, sy, size, size, 0, 0, 160, 160)
          avatarBase64 = canvas.toDataURL('image/jpeg', 0.8)
        }
      }
    }

    // NOW safe to stop camera
    stopCamera()

    try {
      const descriptorArray = Array.from(descriptor)
      const res = await fetch('/api/employee/register-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descriptor: JSON.stringify(descriptorArray),
          avatar: avatarBase64 || undefined,
          face_image_registered: avatarBase64 || undefined
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(true)
        setCapturing(false)
        setStatusText('Pendaftaran wajah selesai!')
        setTimeout(() => {
          router.push('/employee/dashboard')
          router.refresh()
        }, 3000)
      } else {
        setError(data.message || 'Gagal menyimpan pemindaian wajah.')
        setCapturing(false)
        hasEnrolledRef.current = false // allow retry
      }
    } catch (err) {
      setError('Koneksi server gagal saat menyimpan.')
      setCapturing(false)
      hasEnrolledRef.current = false // allow retry
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    hasEnrolledRef.current = false
    setProgress(0)
    setSuccess(false)
    setError('')
    startCamera()
  }

  if (isAlreadyEnrolled) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-55/20 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
          <CheckCircle className="w-9 h-9" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Pendaftaran Wajah Selesai</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Anda sudah berhasil mendaftarkan wajah Anda untuk verifikasi absensi.
          </p>
          <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
            Demi menjaga keamanan absensi, pendaftaran ulang secara mandiri dinonaktifkan. Silakan hubungi Administrator jika Anda memerlukan reset data wajah Anda.
          </p>
        </div>
        <button
          onClick={() => router.push('/employee/dashboard')}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
        >
          Kembali ke Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-6">
      {/* Circle Camera Container */}
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-blue-500 bg-slate-900 shadow-lg shadow-blue-100 flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-red-500">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center text-white p-6 text-center animate-fade-in">
            <CheckCircle className="w-16 h-16 mb-2 animate-bounce" />
            <p className="text-sm font-bold">Pendaftaran Sukses!</p>
            <p className="text-[10px] opacity-80 mt-1">Mengarahkan ke dashboard...</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${loading || error || success ? 'hidden' : ''}`}
        />
        
        {/* Scanning Scanner Line */}
        {capturing && !loading && !success && (
          <div className="absolute inset-x-0 h-1 bg-blue-500/70 shadow-md shadow-blue-400 animate-scanner-line top-0 z-10" />
        )}
      </div>

      {/* Status Indicators */}
      <div className="text-center w-full space-y-2">
        <h4 className="text-sm font-bold text-slate-800">{statusText}</h4>
        
        {capturing && !loading && !success && (
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3">
            <div 
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {!capturing && error && (
        <button
          onClick={handleRetry}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          Coba Lagi
        </button>
      )}
    </div>
  )
}
