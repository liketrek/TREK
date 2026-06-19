import React, { useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
  removing: boolean
}

declare global {
  interface Window {
    __addToast?: (message: string, type?: ToastType, duration?: number) => number
  }
}

let toastIdCounter = 0

const ICON_COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#6366f1',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
    }
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { id, message, type, duration, removing: false }])

    if (duration > 0) {
      const t1 = setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t))
        const t2 = setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id))
        }, 400)
        timersRef.current.push(t2)
      }, duration)
      timersRef.current.push(t1)
    }

    return id
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t))
    const t = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 400)
    timersRef.current.push(t)
  }, [])

  useEffect(() => {
    window.__addToast = addToast
    return () => { delete window.__addToast }
  }, [addToast])

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} style={{ color: ICON_COLORS.success, flexShrink: 0 }} />,
    error: <XCircle size={18} style={{ color: ICON_COLORS.error, flexShrink: 0 }} />,
    warning: <AlertCircle size={18} style={{ color: ICON_COLORS.warning, flexShrink: 0 }} />,
    info: <Info size={18} style={{ color: ICON_COLORS.info, flexShrink: 0 }} />,
  }

  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(8px) scale(0.95); }
        }
        .nomad-toast {
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0.5px 0 rgba(255,255,255,0.5);
        }
        .nomad-toast span { color: rgba(0, 0, 0, 0.8) !important; }
        .dark .nomad-toast {
          background: rgba(30, 30, 40, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), inset 0 0.5px 0 rgba(255,255,255,0.08);
        }
        .dark .nomad-toast span { color: rgba(255, 255, 255, 0.9) !important; }
        .nomad-toast-close { color: rgba(0, 0, 0, 0.4); }
        .dark .nomad-toast-close { color: rgba(255, 255, 255, 0.4); }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        // Above modal overlays (which sit around z-index 10000 with a backdrop-filter
        // blur) so error toasts paint on top and stay legible instead of blurred behind.
        zIndex: 100000, display: 'flex', flexDirection: 'column-reverse', gap: 8,
        pointerEvents: 'none', maxWidth: 420, width: '100%', padding: '0 16px',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="nomad-toast"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              borderRadius: 14,
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              pointerEvents: 'auto',
              animation: toast.removing ? 'toast-out 0.35s ease forwards' : 'toast-in 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            {icons[toast.type] || icons.info}
            <span style={{
              flex: 1, fontSize: 13, fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.4,
              fontFamily: "var(--font-system)",
            }}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="nomad-toast-close"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', padding: 2,
                flexShrink: 0, borderRadius: 6, transition: 'opacity 0.15s',
                opacity: 0.35,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.35'}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

export const useToast = () => {
  const show = useCallback((message: string, type: ToastType, duration?: number) => {
    if (window.__addToast) {
      window.__addToast(message, type, duration)
    }
  }, [])

  return {
    success: (message: string, duration?: number) => show(message, 'success', duration),
    error: (message: string, duration?: number) => show(message, 'error', duration),
    warning: (message: string, duration?: number) => show(message, 'warning', duration),
    info: (message: string, duration?: number) => show(message, 'info', duration),
  }
}

export default useToast
