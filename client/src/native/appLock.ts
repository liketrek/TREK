import { hasNativeFeature } from './capabilities';
import { isNativeApp } from './platform';
import { reportNativeFailure } from './reportFailure';
import { TrekShell } from './trekShell';

/**
 * The app lock: Face ID, Touch ID or the device passcode before TREK shows
 * anything, at launch and after a while in the background, with a blurred
 * cover in the app switcher meanwhile.
 *
 * The setting belongs to the device, not the account (another phone of the
 * same user may well not want it), so it lives in local storage, and the
 * native side keeps its own copy for the app-switcher cover, which has to be
 * up before the UI could run.
 */
const KEY = 'trek.appLock';
/** Back from the background after this long, the app asks again. */
export const RELOCK_AFTER_MS = 30_000;

export function appLockSupported(): boolean {
  return isNativeApp() && hasNativeFeature('biometricLock');
}

export function isAppLockEnabled(): boolean {
  if (!appLockSupported()) return false;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  try {
    if (enabled) window.localStorage.setItem(KEY, '1');
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage refused: the lock then stays off, which the toggle shows.
  }
  await TrekShell.setPrivacyCover({ enabled }).catch(reportNativeFailure);
}

export async function biometryAvailable(): Promise<{ available: boolean; type: string }> {
  if (!appLockSupported()) return { available: false, type: 'none' };
  try {
    return await TrekShell.biometryInfo();
  } catch (err) {
    reportNativeFailure(err);
    return { available: false, type: 'none' };
  }
}

/** Asks for Face ID, Touch ID or the passcode. True once unlocked. */
export async function unlockApp(reason: string): Promise<boolean> {
  try {
    await TrekShell.authenticateBiometric({ reason });
    return true;
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code !== 'CANCELLED' && code !== 'FAILED') reportNativeFailure(err);
    return false;
  }
}
