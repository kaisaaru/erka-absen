'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QrCode, CheckCircle, XCircle, RefreshCw, Keyboard, Camera, UserCheck, AlertCircle, ArrowLeft } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import * as faceapi from 'face-api.js'

type ScanStep = 'select_method' | 'scan_qr' | 'verify_face' | 'result'

export default function EmployeeScanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlToken = searchParams.get('token') || ''

  const [step, setStep] = useState<ScanStep>(urlToken ? 'verify_face' : 'select_method')
  const [token, setToken] = useState(urlToken)
  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [result, setResult] = useState<{
    success: boolean
    message: string
    type?: string
    isLate?: boolean
  } | null>(null)

  // QR Scan variables
  const [manualInput, setManualInput] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const qrScannerRef = useRef<Html5Qrcode | null>(null)

  // Face Scan variables
  const faceVideoRef = useRef<HTMLVideoElement>(null)
  const faceStreamRef = useRef<MediaStream | null>(null)
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false)
  const [registeredDescriptor, setRegisteredDescriptor] = useState<number[] | null>(null)
  const [faceProgress, setFaceProgress] = useState(0)
  const [faceError, setFaceError] = useState('')
  const hasSubmittedRef = useRef(false)

  // 1. Auto-init if token is present in URL
  useEffect(() => {
    if (urlToken) {
      setToken(urlToken)
      startFaceVerification(urlToken)
    }
  }, [urlToken])

  // 2. QR Code Camera Scanner
  useEffect(() => {
    if (step === 'scan_qr' && cameraActive && !urlToken) {
      const timer = setTimeout(() => {
        const scanner = new Html5Qrcode('qr-reader')
        qrScannerRef.current = scanner

        scanner.start(
          { facingMode: 'environment' },
          { 
            fps: 10, 
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7
              return { width: size, height: size }
            }
          },
          (decodedText) => {
            let finalToken = decodedText
            try {
              const url = new URL(decodedText)
              finalToken = url.searchParams.get('token') || decodedText
            } catch (e) {
              // use as-is
            }
            
            scanner.stop().then(() => {
              setCameraActive(false)
              startFaceVerification(finalToken)
            }).catch(err => console.error('Error stopping QR camera:', err))
          },
          () => {}
        ).catch(err => {
          console.error('QR Camera access failed:', err)
          setCameraError('Tidak dapat mengakses kamera belakang. Silakan gunakan input manual.')
          setCameraActive(false)
          setManualInput(true)
        })
      }, 300)

      return () => {
        clearTimeout(timer)
        if (qrScannerRef.current && qrScannerRef.current.isScanning) {
          qrScannerRef.current.stop().catch(err => console.error('QR Clean up error:', err))
        }
      }
    }
  }, [step, cameraActive, urlToken])

  // 3. Move to Face verification step
  const startFaceVerification = async (targetToken: string) => {
    setToken(targetToken)
    setStep('verify_face')
    setLoading(true)
    setStatusText('Memverifikasi data wajah terdaftar...')

    try {
      // Fetch user's registered descriptor
      const res = await fetch('/api/employee/registered-descriptor')
      const data = await res.json()

      if (!res.ok || !data.enrolled) {
        setFaceError('Wajah Anda belum terdaftar. Anda wajib mendaftarkan wajah di dashboard terlebih dahulu.')
        setLoading(false)
        return
      }

      setRegisteredDescriptor(JSON.parse(data.descriptor))

      // Load faceapi models if not loaded
      if (!faceModelsLoaded) {
        setStatusText('Memuat kecerdasan buatan wajah...')
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        setFaceModelsLoaded(true)
      }

      setStatusText('Membuka kamera depan...')
      // Start Front Camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 480 }
      })
      faceStreamRef.current = stream
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream
      }
      setLoading(false)
      setStatusText('Posisikan wajah Anda di tengah lingkaran')
    } catch (err) {
      console.error('Error starting face verification:', err)
      setFaceError('Gagal mengakses kamera depan atau memuat model wajah.')
      setLoading(false)
    }
  }

  // 4. Face Recognition Matching loop
  useEffect(() => {
    let active = true
    let detectInterval: any

    if (step === 'verify_face' && !loading && registeredDescriptor && faceModelsLoaded && !faceError) {
      detectInterval = setInterval(async () => {
        if (!faceVideoRef.current || !active) return

        try {
          const video = faceVideoRef.current
          if (video.paused || video.ended || video.readyState < 2) return

          const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor()

          if (detection) {
            // Compare descriptor using Euclidean distance
            const distance = faceapi.euclideanDistance(
              detection.descriptor,
              new Float32Array(registeredDescriptor)
            )

            // Threshold <= 0.5 is match (stricter than 0.6 to prevent false matches)
            if (distance <= 0.5) {
              setFaceProgress((prev) => {
                const next = prev + 25
                if (next >= 100) {
                  clearInterval(detectInterval)
                  active = false
                  handleFinalSubmit(detection.descriptor)
                  return 100
                }
                setStatusText(`Mencocokkan: ${next}% (Tahan posisi wajah Anda...)`)
                return next
              })
            } else {
              setFaceProgress(0)
              setStatusText('Wajah tidak cocok dengan data pendaftaran Anda.')
            }
          } else {
            setFaceProgress(0)
            setStatusText('Wajah tidak terdeteksi. Silakan arahkan kamera ke wajah Anda.')
          }
        } catch (err) {
          console.error('Error in face verification loop:', err)
        }
      }, 500)
    }

    return () => {
      active = false
      if (detectInterval) clearInterval(detectInterval)
    }
  }, [step, loading, registeredDescriptor, faceModelsLoaded, faceError])

  const stopFaceCamera = () => {
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach(track => track.stop())
      faceStreamRef.current = null
    }
  }

  // 5. Final Submit to Absensi API with Face Image proof
  const handleFinalSubmit = async (descriptor: Float32Array) => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true

    setLoading(true)
    setStatusText('Mengirim absensi...')

    // Capture small snapshot photo as proof FIRST before stopping camera!
    let faceImageBase64 = ''
    if (faceVideoRef.current) {
      const video = faceVideoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 320
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const size = Math.min(video.videoWidth, video.videoHeight)
        const sx = (video.videoWidth - size) / 2
        const sy = (video.videoHeight - size) / 2
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320)
        faceImageBase64 = canvas.toDataURL('image/jpeg', 0.8)
      }
    }

    // Now safe to stop camera
    stopFaceCamera()

    try {
      const res = await fetch('/api/employee/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token || undefined,
          face_image: faceImageBase64,
          face_descriptor: Array.from(descriptor), // send array of floats
          is_face_only: !token // if token is empty, it is face scan only
        }),
      })

      const data = await res.json()
      setStep('result')
      setResult({
        success: data.success,
        message: data.message,
        type: data.type,
        isLate: data.isLate,
      })

      if (data.success) {
        setTimeout(() => {
          router.push('/employee/dashboard')
          router.refresh()
        }, 3000)
      }
    } catch (err) {
      setStep('result')
      setResult({
        success: false,
        message: 'Koneksi server gagal saat mengirim data absensi.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    startFaceVerification(token)
  }

  const handleReset = () => {
    stopFaceCamera()
    hasSubmittedRef.current = false
    setToken('')
    setResult(null)
    setCameraError('')
    setFaceError('')
    setFaceProgress(0)
    setManualInput(false)
    setCameraActive(false)
    setStep(urlToken ? 'verify_face' : 'select_method')
  }

  const handleSelectQR = () => {
    setStep('scan_qr')
    setCameraActive(true)
    setManualInput(false)
  }

  const handleSelectFace = () => {
    startFaceVerification('')
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Scan Absensi</h2>
          <p className="text-sm text-slate-500 mt-1">Metode verifikasi kehadiran karyawan</p>
        </div>
        {step !== 'select_method' && step !== 'result' && !urlToken && (
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Kembali Pilih Metode"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* RESULT DISPLAY */}
      {step === 'result' && result && (
        <div className={`rounded-2xl border p-6 flex flex-col items-center gap-4 text-center ${
          result.success ? 'bg-emerald-55/30 border-emerald-100' : 'bg-red-55/30 border-red-100'
        }`}>
          {result.success ? (
            <CheckCircle className="w-16 h-16 text-emerald-500" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500" />
          )}
          <div>
            <h3 className={`text-base font-bold ${result.success ? 'text-emerald-800' : 'text-red-750'}`}>
              {result.success ? 'Absen Berhasil!' : 'Absen Gagal'}
            </h3>
            <p className={`text-sm mt-1.5 ${result.success ? 'text-emerald-700' : 'text-red-650'}`}>
              {result.message}
            </p>
            {result.success && (
              <p className="text-xs text-slate-400 mt-3 font-semibold">Mengarahkan ke dashboard dalam 3 detik...</p>
            )}
          </div>

          {!result.success && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-red-200 text-red-650 text-xs font-bold hover:bg-red-55/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          )}
        </div>
      )}

      {/* STEP 0: Select Method View */}
      {step === 'select_method' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 mb-4 text-center">Pilih Metode Absensi</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handleSelectQR}
              className="flex items-center gap-4 p-5 rounded-xl border border-slate-150 hover:bg-slate-50 hover:border-slate-300 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Scan QR Code</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Gunakan kamera belakang untuk scan QR Code</p>
              </div>
            </button>

            <button
              onClick={handleSelectFace}
              className="flex items-center gap-4 p-5 rounded-xl border border-slate-150 hover:bg-slate-50 hover:border-slate-300 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Scan Wajah Langsung</h4>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Langsung verifikasi wajah via kamera depan</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Face Verification View */}
      {step === 'verify_face' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-6">
          <div className="relative w-60 h-60 rounded-full overflow-hidden border-4 border-emerald-500 bg-slate-900 shadow-lg shadow-emerald-100/50 flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            )}
            
            {faceError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-red-500">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="text-xs font-semibold leading-relaxed">{faceError}</p>
              </div>
            )}

            <video
              ref={faceVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${loading || faceError ? 'hidden' : ''}`}
            />
            
            {!loading && !faceError && (
              <div className="absolute inset-x-0 h-1 bg-emerald-55/70 shadow-md shadow-emerald-400 animate-scanner-line top-0 z-10" />
            )}
          </div>

          <div className="text-center w-full space-y-2">
            <h4 className="text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              {statusText}
            </h4>
            
            {!loading && !faceError && (
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${faceProgress}%` }}
                />
              </div>
            )}
          </div>

          {(faceError || loading) && (
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-650 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5"
            >
              Batal & Kembali
            </button>
          )}
        </div>
      )}

      {/* STEP 1: Scan QR Code View */}
      {step === 'scan_qr' && !result && !loading && (
        <>
          {cameraActive && !urlToken ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center gap-6">
              <div className="w-full max-w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 relative">
                <div 
                  id="qr-reader" 
                  className="w-full overflow-hidden" 
                />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Kamera Scan QR Aktif
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed max-w-xs">
                  Arahkan kamera belakang ponsel Anda ke gambar QR Code yang ada di layar monitor kantor.
                </p>
              </div>

              <button
                onClick={() => {
                  setCameraActive(false)
                  setManualInput(true)
                  setTimeout(() => inputRef.current?.focus(), 100)
                }}
                className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-650 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5"
              >
                <Keyboard className="w-4 h-4" />
                Input Token Manual
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700 font-semibold leading-relaxed">
                  {cameraError}
                </div>
              )}

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Token Absensi</label>
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste atau ketik token disini..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 bg-slate-50/50"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!token}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  Verifikasi & Scan Wajah
                </button>
              </form>

              {!urlToken && (
                <button
                  onClick={() => {
                    setManualInput(false)
                    setCameraActive(true)
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-650 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  Kembali ke Kamera Scan QR
                </button>
              )}
            </div>
          )}
        </>
      )}

      {loading && step !== 'verify_face' && (
        <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs font-semibold">Memproses...</p>
        </div>
      )}

      {/* HTML5-QRCODE INLINE OVERRIDES */}
      <style dangerouslySetInnerHTML={{ __html: `
        #qr-reader {
          border: none !important;
        }
        #qr-reader__scan_region {
          background: transparent !important;
        }
        #qr-reader__scan_region video {
          object-fit: cover !important;
          border-radius: 0.75rem !important;
          width: 100% !important;
          height: auto !important;
        }
        #qr-reader img {
          display: none !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
      ` }} />
    </div>
  )
}
