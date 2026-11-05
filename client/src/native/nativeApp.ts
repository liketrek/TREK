import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isEffectivelyOffline } from '../sync/networkMode';
import { keepOfflineShellFresh } from './offlineShell';
import { isNativeApp, isNativeIos } from './platform';
import { reportNativeFailure } from './reportFailure';
import { isUnimplemented } from './trekShell';

/** Long enough that the warm-up never competes with the first screen's requests. */
const OFFLINE_SHELL_DELAY_MS = 15_000;

/**
 * What the UI does differently when it runs inside the iOS or Android app.
 * Everything else is the same UI a browser gets from this server.
 */
export function startNativeApp(): void {
  if (!isNativeApp()) return;

  followThemeInStatusBar();

  // Android's back gesture: through the app's own history first, and only
  // then out of the app, the way a browser tab would behave.
  void App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else void App.minimizeApp();
  });

  requestAnimationFrame(() => {
    void SplashScreen.hide();
  });

  if (isNativeIos()) {
    // The "‹ › Done" strip above the keyboard is a web form's, not an app's.
    void Keyboard.setAccessoryBarVisible({ isVisible: false });
    window.setTimeout(() => {
      if (isEffectivelyOffline()) return;
      // Not refreshed this time is no harm: the next launch tries again. An app
      // older than the offline copy has no such method, which is no failure.
      keepOfflineShellFresh().catch((err: unknown) => {
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
