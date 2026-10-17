import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface QueuedToast {
  id: number;
  message: string;
  type: ToastType;
  /** duration <= 0: no auto-dismiss. */
  duration: number;
  removing: boolean;
}

interface ToastQueueOptions {
  /** How long a dismissed toast keeps rendering for its exit animation. */
  exitMs: number;
  /** On unmount, hand `window.__addToast` back to whoever held it before (else it is deleted). */
  restorePrevious: boolean;
}

let toastIdCounter = 0;

/**
 * The toast queue behind the global `window.__addToast` bridge (fed by useToast and
 * store/notify): registers itself while mounted, auto-dismisses after `duration`,
 * keeps a dismissed toast around for `exitMs` so the view can animate it out.
 */
export function useToastQueue({ exitMs, restorePrevious }: ToastQueueOptions) {
  const [toasts, setToasts] = useState<QueuedToast[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const dismissToast = useCallback(
    (id: number) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
      const t = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, exitMs);
      timersRef.current.push(t);
    },
    [exitMs]
  );

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, message, type, duration, removing: false }]);

      if (duration > 0) {
        const t = setTimeout(() => dismissToast(id), duration);
        timersRef.current.push(t);
      }

      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    const previous = window.__addToast;
    window.__addToast = addToast;
    return () => {
      if (restorePrevious) window.__addToast = previous;
      else delete window.__addToast;
    };
  }, [addToast, restorePrevious]);

  return { toasts, dismissToast };
}
