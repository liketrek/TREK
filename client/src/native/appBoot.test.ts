// FE-NATIVE-APPBOOT-001 to FE-NATIVE-APPBOOT-006
import { StatusBar, Style } from '@capacitor/status-bar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { endAppBoot, handOverToApp, isAppBoot, lightStatusBarIcons, pageUnderStatusBar } from './appBoot';
import { isNativeAndroid, isNativeApp } from './platform';

vi.mock('./platform', () => ({ isNativeApp: vi.fn(), isNativeAndroid: vi.fn() }));
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setStyle: vi.fn(async () => {}) },
  Style: { Dark: 'DARK', Light: 'LIGHT' },
}));

const root = document.documentElement;
const realAgent = Object.getOwnPropertyDescriptor(window.navigator, 'userAgent');

function webViewVersion(major: number) {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    get: () => `Mozilla/5.0 (Linux; Android 16; wv) AppleWebKit/537.36 Chrome/${major}.0.0.0 Mobile Safari/537.36`,
  });
}

beforeEach(() => {
  vi.mocked(isNativeApp).mockReturnValue(true);
  vi.mocked(isNativeAndroid).mockReturnValue(false);
  vi.mocked(StatusBar.setStyle).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  for (const name of ['data-app-boot', 'data-app-handover', 'data-app-enter']) root.removeAttribute(name);
  root.style.removeProperty('background-color');
  root.classList.remove('dark');
  if (realAgent) Object.defineProperty(window.navigator, 'userAgent', realAgent);
});

describe('appBoot', () => {
  it('FE-NATIVE-APPBOOT-001: ends the handover colour once someone is signed in', () => {
    root.setAttribute('data-app-boot', '');
    root.style.backgroundColor = '#fffaf5';
    expect(isAppBoot()).toBe(true);

    endAppBoot();
    expect(isAppBoot()).toBe(false);
    expect(root.style.backgroundColor).toBe('');
  });

  it('FE-NATIVE-APPBOOT-002: leaves a page alone that never was in the handover', () => {
    root.style.backgroundColor = 'red';
    endAppBoot();
    expect(root.style.backgroundColor).toBe('red');
  });

  it('FE-NATIVE-APPBOOT-003: lets the app rise in after the sign-in screen stepped back', async () => {
    vi.useFakeTimers();
    const go = vi.fn();
    const done = handOverToApp(Promise.resolve(), go);

    await vi.advanceTimersByTimeAsync(400);
    expect(go).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    await done;
    expect(go).toHaveBeenCalledTimes(1);

    endAppBoot();
    expect(root.hasAttribute('data-app-enter')).toBe(true);
    expect(root.style.backgroundColor).not.toBe('');
    await vi.advanceTimersByTimeAsync(600);
    expect(root.hasAttribute('data-app-enter')).toBe(false);
    expect(root.style.backgroundColor).toBe('');
  });

  it('FE-NATIVE-APPBOOT-004: does not wait for settings that never come, nor stop on ones that fail', async () => {
    vi.useFakeTimers();
    const hanging = vi.fn();
    void handOverToApp(new Promise(() => {}), hanging);
    await vi.advanceTimersByTimeAsync(1600);
    expect(hanging).toHaveBeenCalled();

    const failing = vi.fn();
    void handOverToApp(Promise.reject(new Error('offline')), failing);
    await vi.advanceTimersByTimeAsync(500);
    expect(failing).toHaveBeenCalled();
  });

  it('FE-NATIVE-APPBOOT-005: knows where the page reaches under the status bar', () => {
    expect(pageUnderStatusBar()).toBe(true);
    vi.mocked(isNativeAndroid).mockReturnValue(true);
    webViewVersion(133);
    expect(pageUnderStatusBar()).toBe(false);
    webViewVersion(142);
    expect(pageUnderStatusBar()).toBe(true);
  });

  it('FE-NATIVE-APPBOOT-006: turns the status bar icons light over the landscape and back after', () => {
    root.classList.add('dark');
    const restore = lightStatusBarIcons();
    expect(StatusBar.setStyle).toHaveBeenLastCalledWith({ style: Style.Dark });
    root.classList.remove('dark');
    restore();
    expect(StatusBar.setStyle).toHaveBeenLastCalledWith({ style: Style.Light });

    vi.mocked(StatusBar.setStyle).mockClear();
    vi.mocked(isNativeAndroid).mockReturnValue(true);
    webViewVersion(133);
    lightStatusBarIcons()();
    expect(StatusBar.setStyle).not.toHaveBeenCalled();
  });
});
