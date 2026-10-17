import { isEffectivelyOffline } from '../sync/networkMode';

/**
 * For a write the offline queue cannot hold: data that is not kept on the
 * device (Collab, packing bags, road trip stops) or a change only the server
 * can make (an upload, an import, a member looked up). Offline it says so in
 * the user's language and answers true, so the caller stops before the request
 * fails with a bare network error.
 */
export function refusedOffline(toast: { error: (message: string) => unknown }, t: (key: string) => string): boolean {
  if (!isEffectivelyOffline()) return false;
  toast.error(t('common.needsConnection'));
  return true;
}

/**
 * The message for a write that failed: offline the hint that it needs a
 * connection, otherwise the caller's own. For the writes whose failure handling
 * (a modal that stays open, a list read again) should run as before.
 */
export function offlineOr(t: (key: string) => string, message: string): string {
  return isEffectivelyOffline() ? t('common.needsConnection') : message;
}
