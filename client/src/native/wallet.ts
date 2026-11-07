import { toBase64 } from './blobBase64';
import { hasNativeFeature } from './capabilities';
import { isNativeIos } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell } from './trekShell';

/** A file that is a single Apple Wallet pass, by its name (the MIME type is often missing). */
export function isWalletPassName(filename: string): boolean {
  return /\.pkpass$/i.test(filename.trim());
}

/** Whether this app can hand a pass to Apple Wallet itself (iOS, feature wallet). */
export function canAddToWallet(): boolean {
  return isNativeIos() && hasNativeFeature('wallet');
}

/**
 * Hands a booking's Wallet pass to Apple Wallet: the system sheet with the pass
 * and "Add", or the pass opened in Wallet when it is already there. True when
 * Wallet took it over (including the user closing the sheet); false when the app
 * cannot, so the caller falls back to the share sheet.
 */
export async function addToWallet(blob: Blob): Promise<boolean> {
  if (!canAddToWallet()) return false;
  try {
    await TrekShell.addToWallet({ data: await toBase64(blob) });
    return true;
  } catch (err) {
    // INVALID (not really a pass) and UNAVAILABLE fall back to the share sheet quietly.
    const code = (err as { code?: unknown })?.code;
    if (code !== 'INVALID' && code !== 'UNAVAILABLE') reportNativeFailure(err);
    return false;
  }
}
