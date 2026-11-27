// FE-LOGIN-NATIVE-001 to FE-LOGIN-NATIVE-012: useLogin inside the iOS/Android app
import { startAuthentication } from '@simplewebauthn/browser';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAppConfig } from '../../../tests/helpers/factories';
import { locationAt, pageUrl } from '../../../tests/helpers/location';
import { server } from '../../../tests/helpers/msw/server';
import { act, renderHook, waitFor } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { BrowserSignInCancelled, resumeBrowserSignIn, signInThroughBrowser } from '../../native/browserSignIn';
import { toastHaptic } from '../../native/haptics';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { markSignedOut, wasSignedOut } from '../../utils/signedOut';
import { useLogin } from './useLogin';

// Stable across renders: useLogin's config effect depends on navigate.
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('@simplewebauthn/browser', () => ({ startAuthentication: vi.fn() }));
vi.mock('../../native/platform', () => ({ isNativeApp: () => true }));
vi.mock('../../native/haptics', () => ({ toastHaptic: vi.fn() }));
vi.mock('../../native/browserSignIn', async () => {
  const actual = await vi.importActual<typeof import('../../native/browserSignIn')>('../../native/browserSignIn');
  return { ...actual, signInThroughBrowser: vi.fn(), resumeBrowserSignIn: vi.fn() };
});

const realLocation = window.location;
const realLanguages = Object.getOwnPropertyDescriptor(window.navigator, 'languages');

function deviceLanguages(languages: string[]) {
  Object.defineProperty(window.navigator, 'languages', { configurable: true, get: () => languages });
}
const loadUser = vi.fn(async () => {});

function renderLogin() {
  return renderHook(() => useLogin(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/login']}>
        <TranslationProvider>{children}</TranslationProvider>
      </MemoryRouter>
    ),
  });
}

function clickEvent() {
  return { preventDefault: vi.fn() } as unknown as React.MouseEvent<HTMLAnchorElement>;
}

beforeEach(() => {
  resetAllStores();
  vi.mocked(signInThroughBrowser).mockReset();
  vi.mocked(resumeBrowserSignIn).mockReset().mockResolvedValue(false);
  vi.mocked(startAuthentication).mockReset();
  vi.mocked(toastHaptic).mockClear();
  loadUser.mockClear();
  useAuthStore.setState({ loadUser });
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: locationAt('/login'),
  });
});

afterEach(() => {
  vi.useRealTimers();
  if (realLanguages) Object.defineProperty(window.navigator, 'languages', realLanguages);
  else delete (window.navigator as { languages?: readonly string[] }).languages;
  localStorage.removeItem('app_language');
  document.documentElement.removeAttribute('data-app-handover');
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: realLocation });
});

describe('useLogin in the native app', () => {
  it('FE-LOGIN-NATIVE-001: remembers the login by default in the app', async () => {
    const { result } = renderLogin();
    await waitFor(() => expect(result.current.appConfig).not.toBeNull());
    expect(result.current.rememberMe).toBe(true);
  });

  it('FE-LOGIN-NATIVE-002: does not bounce an OIDC-only install to the IdP inside the WebView', async () => {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json(buildAppConfig({ password_login: false, oidc_configured: true, oidc_login: true }))
      )
    );
    const { result } = renderLogin();
    await waitFor(() => expect(result.current.appConfig).not.toBeNull());
    expect(window.location.href).toBe(pageUrl('/login'));
    expect(result.current.oidcOnly).toBe(true);
  });

  it('FE-LOGIN-NATIVE-003: routes the SSO link through the system browser and signs in', async () => {
    vi.mocked(signInThroughBrowser).mockResolvedValue();
    markSignedOut();
    const { result } = renderLogin();
    const event = clickEvent();

    await act(async () => {
      result.current.handleSsoClick(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(wasSignedOut()).toBe(false);
    expect(signInThroughBrowser).toHaveBeenCalledWith('oidc');
    await waitFor(() => expect(loadUser).toHaveBeenCalledWith({ silent: true }));
    await waitFor(() => expect(result.current.showTakeoff).toBe(true));
  });

  it('FE-LOGIN-NATIVE-004: sends the passkey button to the browser instead of WebAuthn', async () => {
    vi.mocked(signInThroughBrowser).mockResolvedValue();
    const { result } = renderLogin();

    await act(async () => {
      await result.current.handlePasskeyLogin();
    });

    expect(signInThroughBrowser).toHaveBeenCalledWith('passkey');
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-NATIVE-005: stays quiet when the user closes the browser', async () => {
    vi.mocked(signInThroughBrowser).mockRejectedValue(new BrowserSignInCancelled());
    const { result } = renderLogin();

    await act(async () => {
      await result.current.handlePasskeyLogin();
    });

    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-NATIVE-006: explains a failed hand-off', async () => {
    vi.mocked(signInThroughBrowser).mockRejectedValue(new Error('exchange failed'));
    const { result } = renderLogin();

    await act(async () => {
      await result.current.handlePasskeyLogin();
    });

    expect(result.current.error).toBe('Signing in did not work. Please try again.');
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-NATIVE-007: signs in with a browser return that reached an app Android started anew', async () => {
    vi.mocked(resumeBrowserSignIn).mockResolvedValue(true);
    const { result } = renderLogin();

    await waitFor(() => expect(loadUser).toHaveBeenCalledWith({ silent: true }));
    await waitFor(() => expect(result.current.showTakeoff).toBe(true));
    expect(signInThroughBrowser).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-NATIVE-008: explains a kept return that could not be redeemed, and stays on the page otherwise', async () => {
    vi.mocked(resumeBrowserSignIn).mockRejectedValue(new Error('exchange failed'));
    const { result } = renderLogin();

    await waitFor(() => expect(result.current.error).toBe('Signing in did not work. Please try again.'));
    expect(result.current.showTakeoff).toBe(false);
  });

  it('FE-LOGIN-NATIVE-009: speaks the device language when no language was chosen', async () => {
    deviceLanguages(['de-DE', 'en-US']);
    renderLogin();
    await waitFor(() => expect(useSettingsStore.getState().settings.language).toBe('de'));
  });

  it('FE-LOGIN-NATIVE-010: falls back to English on a device language TREK has no translation for', async () => {
    deviceLanguages(['pt-PT']);
    useSettingsStore.setState((state) => ({ settings: { ...state.settings, language: 'fr' } }));
    renderLogin();
    await waitFor(() => expect(useSettingsStore.getState().settings.language).toBe('en'));
  });

  it('FE-LOGIN-NATIVE-011: opens the app after signing in without the takeoff, with the success tap', async () => {
    vi.mocked(resumeBrowserSignIn).mockResolvedValue(true);
    mockNavigate.mockClear();
    const { result } = renderLogin();

    await waitFor(() => expect(result.current.showTakeoff).toBe(true));
    expect(toastHaptic).toHaveBeenCalledWith('success');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'), { timeout: 2500 });
    expect(document.documentElement.hasAttribute('data-app-handover')).toBe(true);
  });

  it('FE-LOGIN-NATIVE-012: keeps a language once picked on this page over the device language', async () => {
    localStorage.setItem('app_language', 'fr');
    useSettingsStore.setState((state) => ({ settings: { ...state.settings, language: 'fr' } }));
    deviceLanguages(['de-DE', 'en-US']);
    const { result } = renderLogin();
    await waitFor(() => expect(result.current.appConfig).not.toBeNull());
    expect(useSettingsStore.getState().settings.language).toBe('fr');
  });
});
