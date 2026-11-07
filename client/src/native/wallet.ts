import { toBase64 } from './blobBase64';
import { hasNativeFeature } from './capabilities';
import { isNativeAndroid, isNativeIos } from './platform';
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

/** Whether this app can hand a booking to Google Wallet (Android, feature googleWallet). */
export function canAddToGoogleWallet(): boolean {
  return isNativeAndroid() && hasNativeFeature('googleWallet');
}

/** The wallet a booking's button adds to here, if any: Apple Wallet on iOS, Google Wallet on Android. */
export function bookingWallet(): 'apple' | 'google' | null {
  if (canAddToWallet()) return 'apple';
  if (canAddToGoogleWallet()) return 'google';
  return null;
}

/**
 * A booking as a Google Wallet pass: this server asks the TREK services for a
 * save link (GET .../reservations/:id/wallet-pass/google), and the app opens it,
 * where Google Wallet shows the pass with its own Save button. `undated`: the
 * booking has no date yet.
 */
export async function addReservationToGoogleWallet(
  tripId: number,
  reservationId: number,
  language: string
): Promise<ReservationWalletOutcome> {
  if (!canAddToGoogleWallet()) return 'failed';
  let response: Response;
  try {
    response = await fetch(
      `/api/trips/${tripId}/reservations/${reservationId}/wallet-pass/google?lang=${encodeURIComponent(language)}`,
      { credentials: 'include' }
    );
  } catch {
    return 'failed';
  }
  if (response.status === 422) return 'undated';
  if (!response.ok) return 'failed';
  try {
    const { saveUrl } = (await response.json()) as { saveUrl?: unknown };
    if (typeof saveUrl !== 'string') return 'failed';
    await TrekShell.addToGoogleWallet({ url: saveUrl });
    return 'added';
  } catch (err) {
    const code = (err as { code?: unknown })?.code;
    if (code !== 'INVALID' && code !== 'UNAVAILABLE') reportNativeFailure(err);
    return 'failed';
  }
}
