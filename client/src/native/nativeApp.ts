import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { isNativeApp, isNativeIos } from './platform'
import { keepOfflineShellFresh } from './offlineShell'
import { isEffectivelyOffline } from '../sync/networkMode'

/** Long enough that the warm-up never competes with the first screen's requests. */
const OFFLINE_SHELL_DELAY_MS = 15_000

/**
 * What the UI does differently when it runs inside the iOS or Android app.
 * Everything else is the same UI a browser gets from this server.
 */
export function startNativeApp(): void {
  if (!isNativeApp()) return

  followThemeInStatusBar()

  // Android's back gesture: through the app's own history first, and only
  // then out of the app, the way a browser tab would behave.
  void App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else void App.minimizeApp()
  })

  requestAnimationFrame(() => { void SplashScreen.hide() })

  if (isNativeIos()) {
    window.setTimeout(() => {
      if (isEffectivelyOffline()) return
      keepOfflineShellFresh().catch((err) => console.warn('[native] offline start page not refreshed', err))
    }, OFFLINE_SHELL_DELAY_MS)
  }
}

/**
 * Light icons on the dark scheme and dark icons on the light one. Observing
 * the class keeps applyAppearance() the only writer of <html>, and it catches
 * every way the scheme changes, including "follow the system".
 */
function followThemeInStatusBar(): void {
  const root = document.documentElement
  const apply = (): void => {
    void StatusBar.setStyle({ style: root.classList.contains('dark') ? Style.Dark : Style.Light })
  }
  apply()
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['class'] })
}
