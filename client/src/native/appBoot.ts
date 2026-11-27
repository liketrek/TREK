import { StatusBar, Style } from '@capacitor/status-bar';
import { isNativeAndroid, isNativeApp } from './platform';

/**
 * The handover from the app's address screen to this server's UI.
 *
 * The app picks a server, restarts its view on it, and the page then needs a
 * moment for its scripts, the session check and the sign-in chunk. Each of
 * those used to paint its own surface (a blank page, a grey spinner, an empty
 * fallback), so the step from the warm address screen to the sign-in screen
 * flashed white several times. public/theme-boot.js marks <html> with
 * data-app-boot before the first paint, when the page runs inside the app and
 * nobody has signed in on this server from here yet (no appearance snapshot):
 * the page then starts on the address screen's own colour, the waiting states
 * show the address screen's spinner on it (AppBootScreen), and the sign-in
 * screen fades in on the same ground. The mark goes once someone is signed in,
 * and the UI's own appearance takes over.
 */
const ATTRIBUTE = 'data-app-boot';

export function isAppBoot(): boolean {
  return typeof document !== 'undefined' && document.documentElement.hasAttribute(ATTRIBUTE);
}

/** Set once the sign-in screen hands over, so the app rises in instead of cutting in. */
const HANDOVER = 'data-app-handover';
/** Set while the app rises in (native/nativeApp.css). */
const ENTER = 'data-app-enter';
/** The sign-in screen stepping back (appLogin.css .al-leaving). */
const LEAVE_MS = 420;
/** How long the handover waits for the settings before it goes anyway. */
const SETTINGS_WAIT_MS = 1500;
const ENTER_MS = 520;
/** The address screen's page colour (native-shell/shell.css --page), as public/theme-boot.js paints it. */
const PAGE_COLOUR = '#fffaf5';

const wait = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * Signed in from the app's sign-in screen: it steps back into the page colour
 * while the settings load (the start page depends on them), then `go` opens
 * the app, which rises in once its first screen is there (endAppBoot).
 */
export function handOverToApp(settings: Promise<unknown>, go: () => void): Promise<void> {
  const ready = Promise.race([settings, wait(SETTINGS_WAIT_MS)]).then(
    () => undefined,
    (err: unknown) => console.warn('Settings not ready for the handover:', err)
  );
  return Promise.all([ready, wait(LEAVE_MS)]).then(() => {
    document.documentElement.setAttribute(HANDOVER, '');
    go();
  });
}

/**
 * Back to the UI's own appearance, once a signed-in screen is up.
 * theme-boot.js painted the page itself, so this clears that too; after a
 * handover the app first rises in on the page colour.
 */
export function endAppBoot(): void {
  const root = document.documentElement;
  const handover = root.hasAttribute(HANDOVER);
  if (!isAppBoot() && !handover) return;
  root.removeAttribute(ATTRIBUTE);
  if (!handover) {
    root.style.removeProperty('background-color');
    return;
  }
  // The page colour stays under the app while it rises in, whatever scheme the
  // account brings, so nothing flashes between the two.
  root.removeAttribute(HANDOVER);
  root.style.backgroundColor = PAGE_COLOUR;
  root.setAttribute(ENTER, '');
  window.setTimeout(() => {
    root.removeAttribute(ENTER);
    root.style.removeProperty('background-color');
  }, ENTER_MS);
}

/**
 * Whether the page reaches under the status bar. iOS always lays it out there.
 * Android does once the system WebView is 140 or newer (Capacitor's SystemBars
 * hands the insets through from that version on); an older one sits between
 * the bars, on the window's plain colour (MainActivity), where light icons
 * would vanish. Shared with the address screen (native-shell/main.ts).
 */
export function pageUnderStatusBar(): boolean {
  if (!isNativeAndroid()) return true;
  const chrome = /Chrome\/(\d+)/.exec(navigator.userAgent);
  return !!chrome && Number(chrome[1]) >= ANDROID_WEBVIEW_UNDER_BARS;
}
const ANDROID_WEBVIEW_UNDER_BARS = 140;

/**
 * The sign-in screen has the landscape under the status bar, as the address
 * screen does, so the clock and icons turn light while it is up. The returned
 * function puts them back to the scheme's own (native/nativeApp.ts keeps them
 * following it from then on). Where the page stops below the bar, the icons
 * stay as they are, readable on the plain colour there.
 */
export function lightStatusBarIcons(): () => void {
  if (!isNativeApp() || !pageUnderStatusBar()) return () => undefined;
  void StatusBar.setStyle({ style: Style.Dark });
  return () => {
    const dark = document.documentElement.classList.contains('dark');
    void StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
  };
}
