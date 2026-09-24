import { Haptics, NotificationType } from '@capacitor/haptics'
import { isNativeApp } from './platform'

const FEEDBACK: Record<string, NotificationType | undefined> = {
  success: NotificationType.Success,
  warning: NotificationType.Warning,
  error: NotificationType.Error,
}

/**
 * The short tap a native app gives when something saved, warned or failed.
 * Hung off the toasts because every save and delete already reports through
 * one; plain info toasts stay silent. Does nothing in a browser.
 */
export function toastHaptic(type: string): void {
  const feedback = FEEDBACK[type]
  if (!feedback || !isNativeApp()) return
  Haptics.notification({ type: feedback }).catch((err) => console.debug('[haptics]', err))
}
