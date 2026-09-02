import { useCallback, useEffect, useRef, useState } from 'react'
import MStatusDot, { MStatus } from './MStatusDot'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface MToast {
  id: number
  message: string
  type: ToastType
  /** duration <= 0: no auto-dismiss, the pill closes on tap instead. */
  sticky: boolean
  removing: boolean
}

let toastId = 0
const EXIT_MS = 220

// Roughly what one line of the pill holds on a 375px phone. Longer messages
// (the geolocation permission hint runs ~150 characters) render as a wrapping
// card instead, or the actionable half disappears behind the ellipsis.
const PILL_CHARS = 42

// info stays the plain act-pill; the other types get a status dot.
const TYPE_DOT: Partial<Record<ToastType, MStatus>> = {
  success: 'confirmed',
  error: 'danger',
  warning: 'pending',
}

/**
 * Mobile toast presenter. Takes over the global `window.__addToast` bridge
 * (fed by useToast / store/notify) while the mobile shell is mounted, so every
 * existing toast call renders above the bottom nav, as the design's act-pill or,
 * for a message too long for one line, as a wrapping card.
 * The desktop ToastContainer handler is restored on unmount.
 */
export default function MToastHost() {
  const [toasts, setToasts] = useState<MToast[]>([])
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)))
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, EXIT_MS)
    timersRef.current.push(t)
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type, sticky: duration <= 0, removing: false }])

      if (duration > 0) {
        const t = setTimeout(() => dismissToast(id), duration)
        timersRef.current.push(t)
      }

      return id
    },
    [dismissToast],
  )

  useEffect(() => {
    const previous = window.__addToast
    window.__addToast = addToast
    return () => {
      window.__addToast = previous
    }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-h,84px)+16px)] z-[90] flex flex-col-reverse items-center gap-2 px-6">
      {toasts.map((toast) => {
        const dot = TYPE_DOT[toast.type]
        const wraps = toast.message.length > PILL_CHARS
        return (
          <div
            key={toast.id}
            role={toast.sticky ? 'button' : undefined}
            tabIndex={toast.sticky ? 0 : undefined}
            onClick={toast.sticky ? () => dismissToast(toast.id) : undefined}
            onKeyDown={toast.sticky ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismissToast(toast.id) } } : undefined}
            className={`flex max-w-full gap-2 bg-m-act px-4 py-2 text-[0.75rem] font-semibold text-m-actfg shadow-[0_10px_30px_-8px_rgba(0,0,0,.5)] ${
              wraps ? 'items-start rounded-2xl' : 'items-center rounded-full'
            } ${toast.sticky ? 'pointer-events-auto cursor-pointer' : ''} ${toast.removing ? 'm-toast-out' : 'm-toast-in'}`}
          >
            {dot && <MStatusDot status={dot} size={6} className={wraps ? 'mt-[0.45rem]' : ''} />}
            {/* No display utility next to line-clamp: Tailwind emits it later and kills the clamp. */}
            <span className={`min-w-0 ${wraps ? 'line-clamp-4 leading-[1.45]' : 'truncate'}`}>{toast.message}</span>
          </div>
        )
      })}
    </div>
  )
}
