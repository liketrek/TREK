import { Share } from '@capacitor/share';
import { canShareText } from '../utils/fileShare';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';

/**
 * Handing a link to the system share sheet, the way a native app offers
 * "Share…" next to "Copy": Messages, Mail, AirDrop, WhatsApp. Inside the apps
 * through Capacitor's Share, in a browser through the Web Share API where it
 * exists. Where neither does, `canShareLink` is false and the caller shows
 * only the copy button.
 */
export function canShareLink(): boolean {
  return isNativeApp() || canShareText();
}

/** True when a target took the link, false when the sheet was closed or failed. */
export async function shareLink(url: string, title?: string): Promise<boolean> {
  try {
    if (isNativeApp()) {
      await Share.share({ url, title, dialogTitle: title });
      return true;
    }
    await navigator.share({ url, title });
    return true;
  } catch (err) {
    // Closing the sheet rejects too; only a real failure is worth a report.
    const name = (err as { name?: string; message?: string } | null)?.name ?? '';
    const message = (err as { message?: string } | null)?.message ?? '';
    if (name !== 'AbortError' && !/cancel/i.test(message)) reportNativeFailure(err);
    return false;
  }
}
