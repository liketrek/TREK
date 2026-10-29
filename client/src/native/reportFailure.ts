/**
 * For the app's best-effort calls (a haptic tap, the offline start page, a
 * share sheet): the failure is not worth a toast, but it must not vanish
 * either. reportError() hands it to the page's error event, which
 * utils/globalErrorHandlers.ts logs like any other uncaught error.
 */
export function reportNativeFailure(err: unknown): void {
  if (typeof globalThis.reportError === 'function') globalThis.reportError(err);
}
