import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { closeTopOverlay } from '../mobile/overlayStack';
import { useSettingsStore } from '../store/settingsStore';
import { isEffectivelyOffline } from '../sync/networkMode';
import { checkAppUpdate, loadNativeCapabilities } from './capabilities';
import { installNativeGeolocation } from './geolocation';
import { fadeInImages } from './imageFade';
import { keepFieldInView } from './keepFieldInView';
import { prepareKeyboardFields } from './keyboardFields';
import { keepOfflineShellFresh } from './offlineShell';
import { isNativeApp, isNativeIos } from './platform';
import { openPushTarget, startNativePush } from './push';
import { startQuickActions } from './quickActions';
import { reportNativeFailure } from './reportFailure';
import { startSharedFiles } from './sharedFiles';
import { trackTouchInput } from './touchInput';
import { APP_URL_SCHEME, isUnimplemented } from './trekShell';

/** Long enough that the warm-up never competes with the first screen's requests. */
const OFFLINE_SHELL_DELAY_MS = 15_000;

/**
 * What the UI does differently when it runs inside the iOS or Android app.
 * Everything else is the same UI a browser gets from this server.
 */
export function startNativeApp(): void {
  if (!isNativeApp()) return;

  // Marks the app for index.css: no text selection or long-press callout on the
  // UI itself, as in any native app. Fields stay selectable there.
  document.documentElement.setAttribute('data-native-app', '');
  // iOS only: the page may bounce at its ends there (mobile.css).
  if (isNativeIos()) document.documentElement.setAttribute('data-native-ios', '');
  // No hover left behind by a tap, a press that shows, no focus ring after a tap.
  trackTouchInput();
  // The keyboard's return key, capitalisation and autocorrect fit the field.
  prepareKeyboardFields();
  // Pictures fade in once loaded instead of building up.
  fadeInImages();

  followThemeInStatusBar();

  // What this binary can do, and whether this server's UI needs a newer one.
  void checkAppUpdate(fetchServerFeatures);
  // The app's own location under navigator.geolocation, where the binary has it.
  void loadNativeCapabilities().then(() => installNativeGeolocation());
  // Booking documents shared to TREK, waiting for a trip to import into.
  void startSharedFiles();
  // Taps on TREK notifications open the place they point at.
  void loadNativeCapabilities().then(() => startNativePush());
  // A quick action on the app icon opens its page, also the one the app was launched with.
  void loadNativeCapabilities().then(() => startQuickActions());

  // A widget or Live Activity tap opens com.liketrek.trek://navigate/<path>.
  void App.addListener('appUrlOpen', ({ url }) => {
    const prefix = `${APP_URL_SCHEME}://navigate`;
    if (url.startsWith(prefix)) openPushTarget(url.slice(prefix.length) || '/');
  });
  // A tap that launched the app comes as the launch URL, not as appUrlOpen.
  void openLaunchLink();

  // A tap on the status bar scrolls the list under it back to the top, as in
  // every iOS app (the status-bar plugin fires statusTap on iOS).
  window.addEventListener('statusTap', scrollToTop);

  // Android's back gesture: through the app's own history first, and only
  // then out of the app, the way a browser tab would behave.
  void App.addListener('backButton', ({ canGoBack }) => {
    // An open sheet closes first, as on iOS's edge swipe.
    if (closeTopOverlay()) return;
    if (canGoBack) window.history.back();
    else void App.minimizeApp();
  });

  requestAnimationFrame(() => {
    void SplashScreen.hide();
  });

  if (isNativeIos()) {
    // The "‹ › Done" strip above the keyboard is a web form's, not an app's.
    void Keyboard.setAccessoryBarVisible({ isVisible: false });
    keepFieldInView(Keyboard);
    window.setTimeout(() => {
      if (isEffectivelyOffline()) return;
      // Not refreshed this time is no harm: the next launch tries again. An app
      // older than the offline copy has no such method, which is no failure.
      keepOfflineShellFresh(fetch, useSettingsStore.getState().settings.language).catch((err: unknown) => {
        if (!isUnimplemented(err)) reportNativeFailure(err);
      });
    }, OFFLINE_SHELL_DELAY_MS);
  }
}

/**
 * Light icons on the dark scheme and dark icons on the light one. Observing
 * the class keeps applyAppearance() the only writer of <html>, and it catches
 * every way the scheme changes, including "follow the system".
 */
function followThemeInStatusBar(): void {
  const root = document.documentElement;
  const apply = (): void => {
    void StatusBar.setStyle({ style: root.classList.contains('dark') ? Style.Dark : Style.Light });
  };
  apply();
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['class'] });
}

/** The server's feature flags, bounded so a slow server cannot hold anything up. */
async function fetchServerFeatures(): Promise<{ minNativeShellApi?: unknown }> {
  const res = await fetch('/api/health/features', { credentials: 'same-origin', signal: AbortSignal.timeout(8000) });
  if (!res.ok) return {};
  return (await res.json()) as { minNativeShellApi?: unknown };
}

/** The launch link this web view has already followed, so a reload does not follow it again. */
const LAUNCH_LINK_KEY = 'trek_launch_link_done';

/**
 * A widget or Live Activity tap that starts the app from closed hands it
 * com.liketrek.trek://navigate/<path> as the launch URL. appUrlOpen only fires
 * for a running app, so the path was lost and the app opened its start page
 * (a packing widget landed on the trip's plan, not its lists). Followed once
 * per launch; the trip planner takes a ?tab= on a trip it already shows.
 */
async function openLaunchLink(): Promise<void> {
  const prefix = `${APP_URL_SCHEME}://navigate`;
  try {
    const url = (await App.getLaunchUrl())?.url;
    if (!url || !url.startsWith(prefix)) return;
    if (sessionStorage.getItem(LAUNCH_LINK_KEY) === url) return;
    sessionStorage.setItem(LAUNCH_LINK_KEY, url);
    openPushTarget(url.slice(prefix.length) || '/');
  } catch {
    /* no launch URL here (an older app binary, or storage blocked): the start page stays */
  }
}

/** The scrolled list in the middle of the screen, else the page, back to its top. */
export function scrollToTop(): void {
  let el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2) as HTMLElement | null;
  while (el && el !== document.body) {
    const overflow = getComputedStyle(el).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && el.scrollTop > 0) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    el = el.parentElement;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
