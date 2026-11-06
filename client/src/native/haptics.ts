import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';

const FEEDBACK: Record<string, NotificationType | undefined> = {
  success: NotificationType.Success,
  warning: NotificationType.Warning,
  error: NotificationType.Error,
};

/**
 * The short tap a native app gives when something saved, warned or failed.
 * Hung off the toasts because every save and delete already reports through
 * one; plain info toasts stay silent. Does nothing in a browser.
 */
export function toastHaptic(type: string): void {
  const feedback = FEEDBACK[type];
  if (!feedback || !isNativeApp()) return;
  Haptics.notification({ type: feedback }).catch(reportNativeFailure);
}

/**
 * The light detent a native pager or picker gives when it lands on a new page:
 * a swiped-to day, a sheet snapping to a stop. Does nothing in a browser.
 */
export function tickHaptic(): void {
  if (!isNativeApp()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(reportNativeFailure);
}

/**
 * The selection click a native switch, segmented control or picker gives when
 * its value changes. Does nothing in a browser.
 */
export function selectionHaptic(): void {
  if (!isNativeApp()) return;
  Haptics.selectionChanged().catch(reportNativeFailure);
}

/**
 * The firmer bump of a long press that opens a context menu, or of an item
 * picked up to drag. Does nothing in a browser.
 */
export function pressHaptic(): void {
  if (!isNativeApp()) return;
  Haptics.impact({ style: ImpactStyle.Medium }).catch(reportNativeFailure);
}
