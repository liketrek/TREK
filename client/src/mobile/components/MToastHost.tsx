import MStatusDot, { MStatus } from './MStatusDot'
import { useToastQueue, type QueuedToast, type ToastType } from '../../components/shared/useToastQueue'

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

function MToastPill({ toast, onDismiss }: { toast: QueuedToast; onDismiss: (id: number) => void }) {
  const dot = TYPE_DOT[toast.type]
  const wraps = toast.message.length > PILL_CHARS
  // duration <= 0: no auto-dismiss, the pill closes on tap instead.
  const sticky = toast.duration <= 0
  return (
    <div
      role={sticky ? 'button' : undefined}
      tabIndex={sticky ? 0 : undefined}
      onClick={sticky ? () => onDismiss(toast.id) : undefined}
      onKeyDown={sticky ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDismiss(toast.id) } } : undefined}
      className={`flex max-w-full gap-2 bg-m-act px-4 py-2 text-[0.75rem] font-semibold text-m-actfg shadow-[0_10px_30px_-8px_rgba(0,0,0,.5)] ${
        wraps ? 'items-start rounded-2xl' : 'items-center rounded-full'
      } ${sticky ? 'pointer-events-auto cursor-pointer' : ''} ${toast.removing ? 'm-toast-out' : 'm-toast-in'}`}
    >
      {dot && <MStatusDot status={dot} size={6} className={wraps ? 'mt-[0.45rem]' : ''} />}
      {/* No display utility next to line-clamp: Tailwind emits it later and kills the clamp. */}
      <span className={`min-w-0 ${wraps ? 'line-clamp-4 leading-[1.45]' : 'truncate'}`}>{toast.message}</span>
    </div>
  )
}

/**
 * Mobile toast presenter. Takes over the global `window.__addToast` bridge
 * (fed by useToast / store/notify) while the mobile shell is mounted, so every
 * existing toast call renders above the bottom nav, as the design's act-pill or,
 * for a message too long for one line, as a wrapping card.
 * The desktop ToastContainer handler is restored on unmount.
 */
export default function MToastHost() {
  const { toasts, dismissToast } = useToastQueue({ exitMs: EXIT_MS, restorePrevious: true })

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-h,84px)+16px)] z-[90] flex flex-col-reverse items-center gap-2 px-6">
      {toasts.map((toast) => (
        <MToastPill key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
