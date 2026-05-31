// Bridge for surfacing user-facing toasts from non-component code (Zustand
// slices, store actions) where the `useToast` hook isn't available. Mirrors the
// global `window.__addToast` channel that ToastContainer registers and that
// SystemNoticeBanner already uses for the same reason.

type NotifyType = 'success' | 'error' | 'warning' | 'info'

/**
 * Show a toast from outside the React tree. No-ops gracefully if the
 * ToastContainer hasn't registered its handler yet (e.g. very early boot),
 * so callers never have to guard for it.
 */
export function notify(message: string, type: NotifyType = 'info', duration?: number): void {
  if (typeof window !== 'undefined' && typeof window.__addToast === 'function') {
    window.__addToast(message, type, duration)
  }
}
