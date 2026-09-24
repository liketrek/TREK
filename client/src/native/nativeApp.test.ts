import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { App } from '@capacitor/app'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { startNativeApp } from './nativeApp'
import { isNativeApp, isNativeIos } from './platform'
import { keepOfflineShellFresh } from './offlineShell'
import { isEffectivelyOffline } from '../sync/networkMode'

vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(), minimizeApp: vi.fn() } }))
vi.mock('@capacitor/keyboard', () => ({ Keyboard: { setAccessoryBarVisible: vi.fn() } }))
vi.mock('@capacitor/splash-screen', () => ({ SplashScreen: { hide: vi.fn() } }))
vi.mock('@capacitor/status-bar', () => ({ StatusBar: { setStyle: vi.fn() }, Style: { Dark: 'DARK', Light: 'LIGHT' } }))
vi.mock('./platform', () => ({ isNativeApp: vi.fn(), isNativeIos: vi.fn() }))
vi.mock('./offlineShell', () => ({ keepOfflineShellFresh: vi.fn() }))
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn() }))

function backButtonHandler(): (event: { canGoBack: boolean }) => void {
  const call = vi.mocked(App.addListener).mock.calls.find(([name]) => name === 'backButton')
  return call![1] as unknown as (event: { canGoBack: boolean }) => void
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  vi.mocked(isNativeApp).mockReturnValue(true)
  vi.mocked(isNativeIos).mockReturnValue(false)
  vi.mocked(isEffectivelyOffline).mockReturnValue(false)
  vi.mocked(keepOfflineShellFresh).mockResolvedValue()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('startNativeApp', () => {
  it('does nothing in a browser', () => {
    vi.mocked(isNativeApp).mockReturnValue(false)
    startNativeApp()
    expect(App.addListener).not.toHaveBeenCalled()
    expect(StatusBar.setStyle).not.toHaveBeenCalled()
  })

  it('hides the splash after the first frame', () => {
    startNativeApp()
    vi.runOnlyPendingTimers()
    expect(SplashScreen.hide).toHaveBeenCalled()
  })

  it('walks back through history before it leaves the app', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    startNativeApp()
    backButtonHandler()({ canGoBack: true })
    expect(back).toHaveBeenCalled()
    backButtonHandler()({ canGoBack: false })
    expect(App.minimizeApp).toHaveBeenCalled()
  })

  it('keeps the status bar icons readable when the scheme changes', async () => {
    startNativeApp()
    expect(StatusBar.setStyle).toHaveBeenLastCalledWith({ style: Style.Light })
    document.documentElement.classList.add('dark')
    await vi.waitFor(() => expect(StatusBar.setStyle).toHaveBeenLastCalledWith({ style: Style.Dark }))
  })

  it('hides the keyboard accessory bar on iOS only', () => {
    startNativeApp()
    expect(Keyboard.setAccessoryBarVisible).not.toHaveBeenCalled()
    vi.mocked(isNativeIos).mockReturnValue(true)
    startNativeApp()
    expect(Keyboard.setAccessoryBarVisible).toHaveBeenCalledWith({ isVisible: false })
  })

  it('refreshes the offline start on iOS once the first screen has settled', () => {
    vi.mocked(isNativeIos).mockReturnValue(true)
    startNativeApp()
    expect(keepOfflineShellFresh).not.toHaveBeenCalled()
    vi.advanceTimersByTime(15_000)
    expect(keepOfflineShellFresh).toHaveBeenCalled()
  })

  it('skips the refresh while offline, and never on Android', () => {
    vi.mocked(isNativeIos).mockReturnValue(true)
    vi.mocked(isEffectivelyOffline).mockReturnValue(true)
    startNativeApp()
    vi.advanceTimersByTime(15_000)
    expect(keepOfflineShellFresh).not.toHaveBeenCalled()

    vi.mocked(isNativeIos).mockReturnValue(false)
    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    startNativeApp()
    vi.advanceTimersByTime(15_000)
    expect(keepOfflineShellFresh).not.toHaveBeenCalled()
  })

  it('logs a failed refresh instead of throwing', async () => {
    vi.mocked(isNativeIos).mockReturnValue(true)
    vi.mocked(keepOfflineShellFresh).mockRejectedValue(new Error('down'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    startNativeApp()
    vi.advanceTimersByTime(15_000)
    await vi.waitFor(() => expect(warn).toHaveBeenCalled())
  })
})
