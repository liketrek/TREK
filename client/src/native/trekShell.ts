import { registerPlugin } from '@capacitor/core'

/**
 * The app's own native plugin, implemented in
 * ios/App/App/TrekShellPlugin.swift and
 * android/app/src/main/java/com/liketrek/trek/TrekShellPlugin.java.
 *
 * The app is a frame around the UI the user's server delivers, so what the
 * web side needs from it is small: which server that is, a way to change it,
 * a system browser for the sign-ins a WebView cannot do, and on iOS the
 * offline copy of the start page that stands in for the missing service
 * worker.
 */
export interface TrekShellPlugin {
  getServer(): Promise<{ url: string | null }>
  /** Remembers the server and loads it. The current page is gone afterwards. */
  setServer(options: { url: string }): Promise<void>
  /** Forgets the server and returns to the address screen. */
  resetServer(): Promise<void>
  /** Loads the remembered server again, after it could not be reached. */
  reload(): Promise<void>
  /**
   * Opens `url` in the system browser and resolves with the URL it was sent
   * back to under `callbackScheme`. Rejects with code `CANCELLED` when the
   * user closes the browser.
   */
  authenticate(options: { url: string; callbackScheme: string }): Promise<{ url: string }>
  /** iOS: stores the server's start page for a cold start without network. */
  refreshOfflineCopy(): Promise<{ saved: boolean }>
  /** iOS: loads that copy under the server's origin. False when there is none. */
  openOfflineCopy(): Promise<{ opened: boolean }>
}

export const TrekShell = registerPlugin<TrekShellPlugin>('TrekShell')

export const APP_URL_SCHEME = 'com.liketrek.trek'
