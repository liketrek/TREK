// FE-LOGIN-NATIVE-001 to FE-LOGIN-NATIVE-008: useLogin inside the iOS/Android app
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '../../../tests/helpers/render';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores } from '../../../tests/helpers/store';
import { buildAppConfig } from '../../../tests/helpers/factories';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useAuthStore } from '../../store/authStore';
import { startAuthentication } from '@simplewebauthn/browser';
import { markSignedOut, wasSignedOut } from '../../utils/signedOut';
import { BrowserSignInCancelled, signInThroughBrowser } from '../../native/browserSignIn';
import { TrekShell } from '../../native/trekShell';
import { useLogin } from './useLogin';

// Stable across renders: useLogin's config effect depends on navigate.
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('@simplewebauthn/browser', () => ({ startAuthentication: vi.fn() }));
vi.mock('../../native/platform', () => ({ isNativeApp: () => true }));
vi.mock('../../native/browserSignIn', async () => {
  const actual = await vi.importActual<typeof import('../../native/browserSignIn')>('../../native/browserSignIn');
  return { ...actual, signInThroughBrowser: vi.fn() };
});
vi.mock('../../native/trekShell', () => ({ TrekShell: { resetServer: vi.fn() } }));

const realLocation = window.location;
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
  vi.mocked(startAuthentication).mockReset();
  vi.mocked(TrekShell.resetServer).mockReset();
  loadUser.mockClear();
  useAuthStore.setState({ loadUser });
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { ...realLocation, pathname: '/login', href: 'http://localhost/login', search: '' },
  });
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: realLocation });
});

describe('useLogin in the native app', () => {
  it('FE-LOGIN-NATIVE-001: reports that it runs in the app', async () => {
    const { result } = renderLogin();
    await waitFor(() => expect(result.current.appConfig).not.toBeNull());
    expect(result.current.nativeApp).toBe(true);
  });

  it('FE-LOGIN-NATIVE-002: does not bounce an OIDC-only install to the IdP inside the WebView', async () => {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json(buildAppConfig({ password_login: false, oidc_configured: true, oidc_login: true })),
      ),
    );
    const { result } = renderLogin();
    await waitFor(() => expect(result.current.appConfig).not.toBeNull());
    expect(window.location.href).toBe('http://localhost/login');
    expect(result.current.oidcOnly).toBe(true);
  });

  it('FE-LOGIN-NATIVE-003: routes the SSO link through the system browser and signs in', async () => {
    vi.mocked(signInThroughBrowser).mockResolvedValue();
    markSignedOut();
    const { result } = renderLogin();
    const event = clickEvent();

    await act(async () => { result.current.handleSsoClick(event); });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(wasSignedOut()).toBe(false);
    expect(signInThroughBrowser).toHaveBeenCalledWith('oidc');
    await waitFor(() => expect(loadUser).toHaveBeenCalledWith({ silent: true }));
    await waitFor(() => expect(result.current.showTakeoff).toBe(true));
  });

  it('FE-LOGIN-NATIVE-004: sends the passkey button to the browser instead of WebAuthn', async () => {
    vi.mocked(signInThroughBrowser).mockResolvedValue();
    const { result } = renderLogin();

    await act(async () => { await result.current.handlePasskeyLogin(); });

    expect(signInThroughBrowser).toHaveBeenCalledWith(undefined);
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-NATIVE-005: stays quiet when the user closes the browser', async () => {
    vi.mocked(signInThroughBrowser).mockRejectedValue(new BrowserSignInCancelled());
    const { result } = renderLogin();

    await act(async () => { await result.current.handlePasskeyLogin(); });

    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-NATIVE-006: explains a failed hand-off', async () => {
    vi.mocked(signInThroughBrowser).mockRejectedValue(new Error('exchange failed'));
    const { result } = renderLogin();

    await act(async () => { await result.current.handlePasskeyLogin(); });

    expect(result.current.error).toBe('Signing in did not work. Please try again.');
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-NATIVE-007: offers the way back to the address screen', () => {
    const { result } = renderLogin();
    act(() => { result.current.changeServer(); });
    expect(TrekShell.resetServer).toHaveBeenCalled();
  });
});
