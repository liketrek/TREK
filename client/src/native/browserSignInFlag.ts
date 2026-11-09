/**
 * Marks the app's sign-in in the system browser while it runs. The page in front
 * of the handoff page (public/native-handoff.js) sets it, so that until the user
 * is handed back to the app no service worker is registered (public/registerSW.js)
 * and no new version reloads the page (utils/versionHandover.ts). A browser tab
 * still open on an older TREK keeps that version's worker alive, and a worker
 * registered or a reload in the middle of the sign-in would bring it back to
 * answer the next page with an app that has no handoff page.
 */
export const BROWSER_SIGN_IN_KEY = 'trek_native_signin';

/** As long as a sign-in in the browser may take; the mark counts for no longer. */
export const BROWSER_SIGN_IN_TTL_MS = 15 * 60 * 1000;

export function browserSignInRunning(now = Date.now()): boolean {
  try {
    const started = Number(localStorage.getItem(BROWSER_SIGN_IN_KEY));
    return Number.isFinite(started) && started > 0 && now - started >= 0 && now - started < BROWSER_SIGN_IN_TTL_MS;
  } catch {
    return false;
  }
}

/** The sign-in is handed back to the app: the browser goes back to normal. */
export function endBrowserSignIn(): void {
  try {
    localStorage.removeItem(BROWSER_SIGN_IN_KEY);
  } catch {
    /* site data blocked: the mark runs out by itself */
  }
}
