import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeTopOverlay } from '../mobile/overlayStack';
import { isEffectivelyOffline } from '../sync/networkMode';
import { checkAppUpdate } from './capabilities';
import { installNativeGeolocation } from './geolocation';
import { prepareKeyboardFields } from './keyboardFields';
import { scrollToTop, startNativeApp } from './nativeApp';
import { keepOfflineShellFresh } from './offlineShell';
import { isNativeApp, isNativeIos } from './platform';
import { trackTouchInput } from './touchInput';

vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(), minimizeApp: vi.fn() } }));
vi.mock('@capacitor/keyboard', () => ({
  Keyboard: { setAccessoryBarVisible: vi.fn(), addListener: vi.fn(async () => ({ remove: vi.fn() })) },
}));
vi.mock('@capacitor/splash-screen', () => ({ SplashScreen: { hide: vi.fn() } }));
vi.mock('@capacitor/status-bar', () => ({ StatusBar: { setStyle: vi.fn() }, Style: { Dark: 'DARK', Light: 'LIGHT' } }));
vi.mock('./platform', () => ({ isNativeApp: vi.fn(), isNativeIos: vi.fn() }));
vi.mock('./offlineShell', () => ({ keepOfflineShellFresh: vi.fn() }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn() }));
vi.mock('./capabilities', () => ({
  checkAppUpdate: vi.fn(async () => false),
  loadNativeCapabilities: vi.fn(async () => ({})),
}));
vi.mock('./geolocation', () => ({ installNativeGeolocation: vi.fn() }));
vi.mock('./sharedFiles', () => ({ startSharedFiles: vi.fn(async () => {}) }));
vi.mock('./push', () => ({ startNativePush: vi.fn(async () => {}), openPushTarget: vi.fn() }));
vi.mock('../mobile/overlayStack', () => ({ closeTopOverlay: vi.fn(() => false) }));
vi.mock('./touchInput', () => ({ trackTouchInput: vi.fn() }));
vi.mock('./quickActions', () => ({ startQuickActions: vi.fn() }));
vi.mock('./imageFade', () => ({ fadeInImages: vi.fn() }));
vi.mock('./keyboardFields', () => ({ prepareKeyboardFields: vi.fn() }));

function backButtonHandler(): (event: { canGoBack: boolean }) => void {
  const call = vi.mocked(App.addListener).mock.calls.find(([name]) => name === 'backButton');
  if (!call) throw new Error('no backButton listener');
  return call[1] as unknown as (event: { canGoBack: boolean }) => void;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(isNativeApp).mockReturnValue(true);
  vi.mocked(isNativeIos).mockReturnValue(false);
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
  vi.mocked(keepOfflineShellFresh).mockResolvedValue();
  document.documentElement.classList.remove('dark');
  document.documentElement.removeAttribute('data-native-app');
  document.documentElement.removeAttribute('data-native-ios');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('startNativeApp', () => {
  it('does nothing in a browser', () => {
    vi.mocked(isNativeApp).mockReturnValue(false);
    startNativeApp();
    expect(App.addListener).not.toHaveBeenCalled();
    expect(StatusBar.setStyle).not.toHaveBeenCalled();
    expect(document.documentElement.hasAttribute('data-native-app')).toBe(false);
    expect(trackTouchInput).not.toHaveBeenCalled();
    expect(prepareKeyboardFields).not.toHaveBeenCalled();
  });

  it('marks <html> so a long press selects no text in the app', () => {
    startNativeApp();
    expect(document.documentElement.hasAttribute('data-native-app')).toBe(true);
  });

  it('follows finger or pointer for hover, press and focus, and fits the keyboard to each field', () => {
    startNativeApp();
    expect(trackTouchInput).toHaveBeenCalledTimes(1);
    expect(prepareKeyboardFields).toHaveBeenCalledTimes(1);
  });

  it("Android's back gesture closes an open sheet before it leaves the page", () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    vi.mocked(closeTopOverlay).mockReturnValueOnce(true);
    startNativeApp();
    backButtonHandler()({ canGoBack: true });
    expect(back).not.toHaveBeenCalled();
    backButtonHandler()({ canGoBack: true });
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });

  it('puts the app location under navigator.geolocation once the binary has answered', async () => {
    vi.useRealTimers();
    startNativeApp();
    await vi.waitFor(() => expect(installNativeGeolocation).toHaveBeenCalled());
  });

  it('a status bar tap scrolls the list in the middle of the screen back to the top', () => {
    const list = document.createElement('div');
    list.style.overflowY = 'auto';
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 300 });
    list.scrollTo = vi.fn();
    document.body.appendChild(list);
    document.elementFromPoint = vi.fn(() => list);
    scrollToTop();
    expect(list.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    list.remove();
  });

  it('asks the binary what it can do and the server which binary it needs', () => {
    startNativeApp();
    expect(checkAppUpdate).toHaveBeenCalledWith(expect.any(Function));
  });

  it('hides the splash after the first frame', () => {
    startNativeApp();
    vi.runOnlyPendingTimers();
    expect(SplashScreen.hide).toHaveBeenCalled();
  });

  it('walks back through history before it leaves the app', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    startNativeApp();
    backButtonHandler()({ canGoBack: true });
    expect(back).toHaveBeenCalled();
    backButtonHandler()({ canGoBack: false });
    expect(App.minimizeApp).toHaveBeenCalled();
  });

  it('keeps the status bar icons readable when the scheme changes', async () => {
    startNativeApp();
    expect(StatusBar.setStyle).toHaveBeenLastCalledWith({ style: Style.Light });
    document.documentElement.classList.add('dark');
    await vi.waitFor(() => expect(StatusBar.setStyle).toHaveBeenLastCalledWith({ style: Style.Dark }));
  });

  it('hides the keyboard accessory bar on iOS only', () => {
    startNativeApp();
    expect(Keyboard.setAccessoryBarVisible).not.toHaveBeenCalled();
    vi.mocked(isNativeIos).mockReturnValue(true);
    startNativeApp();
    expect(Keyboard.setAccessoryBarVisible).toHaveBeenCalledWith({ isVisible: false });
  });

  it('refreshes the offline start on iOS once the first screen has settled', () => {
    vi.mocked(isNativeIos).mockReturnValue(true);
    startNativeApp();
    expect(keepOfflineShellFresh).not.toHaveBeenCalled();
    vi.advanceTimersByTime(15_000);
    expect(keepOfflineShellFresh).toHaveBeenCalled();
  });

  it('skips the refresh while offline, and never on Android', () => {
    vi.mocked(isNativeIos).mockReturnValue(true);
    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    startNativeApp();
    vi.advanceTimersByTime(15_000);
    expect(keepOfflineShellFresh).not.toHaveBeenCalled();

    vi.mocked(isNativeIos).mockReturnValue(false);
    vi.mocked(isEffectivelyOffline).mockReturnValue(false);
    startNativeApp();
    vi.advanceTimersByTime(15_000);
    expect(keepOfflineShellFresh).not.toHaveBeenCalled();
  });

  it('logs a failed refresh instead of throwing', async () => {
    vi.mocked(isNativeIos).mockReturnValue(true);
    vi.mocked(keepOfflineShellFresh).mockRejectedValue(new Error('down'));
    const report = vi.fn();
    vi.stubGlobal('reportError', report);
    startNativeApp();
    vi.advanceTimersByTime(15_000);
    await vi.waitFor(() => expect(report).toHaveBeenCalledWith(expect.any(Error)));
    vi.unstubAllGlobals();
  });

  it('stays quiet when the installed app is older than the offline copy', async () => {
    vi.mocked(isNativeIos).mockReturnValue(true);
    vi.mocked(keepOfflineShellFresh).mockRejectedValue(
      Object.assign(new Error('not implemented'), { code: 'UNIMPLEMENTED' })
    );
    const report = vi.fn();
    vi.stubGlobal('reportError', report);
    startNativeApp();
    vi.advanceTimersByTime(15_000);
    await vi.waitFor(() => expect(keepOfflineShellFresh).toHaveBeenCalled());
    // Let the rejection reach its handler.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(report).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
