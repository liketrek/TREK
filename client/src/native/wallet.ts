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

/** What a tap on "Add to Apple Wallet" came to. */
export type ReservationWalletOutcome = 'added' | 'undated' | 'failed';

/**
 * A booking's pass, made by this server (GET .../reservations/:id/wallet-pass,
 * signed by the TREK services) and handed to Apple Wallet's sheet. `undated`:
 * the booking has no date yet, which Wallet needs to bring the pass up.
 */
export async function addReservationToWallet(
  tripId: number,
  reservationId: number,
  language: string
): Promise<ReservationWalletOutcome> {
  let response: Response;
  try {
    response = await fetch(
      `/api/trips/${tripId}/reservations/${reservationId}/wallet-pass?lang=${encodeURIComponent(language)}`,
      { credentials: 'include' }
    );
  } catch {
    return 'failed';
  }
  if (response.status === 422) return 'undated';
  if (!response.ok) return 'failed';
  return (await addToWallet(await response.blob())) ? 'added' : 'failed';
}
