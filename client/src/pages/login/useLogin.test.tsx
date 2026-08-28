// FE-LOGIN-HOOK-001 to FE-LOGIN-HOOK-040
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '../../../tests/helpers/render';
import { MemoryRouter, type MemoryRouterProps } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores } from '../../../tests/helpers/store';
import { buildAppConfig } from '../../../tests/helpers/factories';
import { markSignedOut, clearSignedOut, wasSignedOut } from '../../utils/signedOut';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useAuthStore, type LoginResult } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { startAuthentication } from '@simplewebauthn/browser';
import { START_DESTINATION_ROUTE } from '../../utils/startDestination';
import { useLogin } from './useLogin';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@simplewebauthn/browser', () => ({ startAuthentication: vi.fn() }));

const CONFIG_CACHE_KEY = 'trek_app_config_cache';

type AuthActions = ReturnType<typeof useAuthStore.getState>;
type AuthOk = Awaited<ReturnType<AuthActions['completeMfaLogin']>>;

function authOk(user: Record<string, unknown> = {}): AuthOk {
  return {
    user: { id: 1, username: 'demo', email: 'demo@example.com', role: 'user', ...user },
    token: 'tok',
  } as unknown as AuthOk;
}

function makeAuthMocks() {
  return {
    login: vi.fn(async (_email: string, _password: string, _remember?: boolean): Promise<LoginResult> => authOk()),
    register: vi.fn(async (_username: string, _email: string, _password: string, _invite?: string) => authOk()),
    demoLogin: vi.fn(async () => authOk()),
    completeMfaLogin: vi.fn(async (_token: string, _code: string, _remember?: boolean) => authOk()),
    loadUser: vi.fn(async (_opts?: { silent?: boolean }) => {}),
  };
}

let auth: ReturnType<typeof makeAuthMocks>;

const realLocation = window.location;
const origLanguages = navigator.languages;

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { ...realLocation, pathname: '/login', href: 'http://localhost/login', search },
  });
}

function setLanguages(languages: string[]) {
  Object.defineProperty(navigator, 'languages', { configurable: true, value: languages });
}

function wrapperFor(entries: MemoryRouterProps['initialEntries'] = ['/login']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={entries}>
        <TranslationProvider>{children}</TranslationProvider>
      </MemoryRouter>
    );
  };
}

function renderLogin(entries?: MemoryRouterProps['initialEntries']) {
  return renderHook(() => useLogin(), { wrapper: wrapperFor(entries) });
}

function formEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>;
}

/** Wait for the app-config probe to settle so the hook is in its steady state. */
async function ready(result: { current: ReturnType<typeof useLogin> }) {
  await waitFor(() => expect(result.current.appConfig).not.toBeNull());
}

beforeEach(() => {
  resetAllStores();
  mockNavigate.mockClear();
  vi.mocked(startAuthentication).mockReset();
  setSearch('');
  auth = makeAuthMocks();
  useAuthStore.setState(auth);
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: realLocation });
  Object.defineProperty(navigator, 'languages', { configurable: true, value: origLanguages });
});

describe('useLogin — app config probe', () => {
  it('FE-LOGIN-HOOK-001: exposes the fetched config and stays in login mode when users exist', async () => {
    const { result } = renderLogin();
    await ready(result);

    expect(result.current.appConfig?.has_users).toBe(true);
    expect(result.current.mode).toBe('login');
    expect(result.current.showRegisterOption).toBe(true);
    expect(result.current.oidcOnly).toBe(false);
  });

  it('FE-LOGIN-HOOK-002: switches to register on a fresh instance with no users', async () => {
    server.use(
      http.get('/api/auth/app-config', () => HttpResponse.json(buildAppConfig({ has_users: false }))),
    );
    const { result } = renderLogin();
    await ready(result);

    expect(result.current.mode).toBe('register');
  });

  it('FE-LOGIN-HOOK-003: caches the config so the next probe failure still has something to show', async () => {
    const { unmount } = renderLogin();
    await waitFor(() => expect(localStorage.getItem(CONFIG_CACHE_KEY)).not.toBeNull());
    unmount();

    server.use(http.get('/api/auth/app-config', () => HttpResponse.error()));
    const { result } = renderLogin();
    await ready(result);

    expect(result.current.appConfig?.password_login).toBe(true);
  });

  it('FE-LOGIN-HOOK-004: survives a storage quota error while caching the config', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderLogin();
    await ready(result);

    expect(result.current.appConfig?.has_users).toBe(true);
    setItem.mockRestore();
  });

  it('FE-LOGIN-HOOK-005: ignores a corrupt config cache', async () => {
    localStorage.setItem(CONFIG_CACHE_KEY, '{not json');
    server.use(http.get('/api/auth/app-config', () => HttpResponse.error()));
    const getItem = vi.spyOn(Storage.prototype, 'getItem');

    const { result } = renderLogin();
    await waitFor(() => expect(getItem).toHaveBeenCalledWith(CONFIG_CACHE_KEY));

    expect(result.current.appConfig).toBeNull();
    getItem.mockRestore();
  });

  it('FE-LOGIN-HOOK-006: leaves the config null when the probe fails and nothing is cached', async () => {
    server.use(http.get('/api/auth/app-config', () => HttpResponse.error()));
    const getItem = vi.spyOn(Storage.prototype, 'getItem');

    const { result } = renderLogin();
    await waitFor(() => expect(getItem).toHaveBeenCalledWith(CONFIG_CACHE_KEY));

    expect(result.current.appConfig).toBeNull();
    expect(result.current.oidcOnly).toBeFalsy();
    getItem.mockRestore();
  });

  it('FE-LOGIN-HOOK-007: sends the browser straight to the IdP when passwords are disabled', async () => {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json(buildAppConfig({ password_login: false, oidc_configured: true, oidc_login: true })),
      ),
    );

    const { result } = renderLogin();
    await ready(result);

    expect(result.current.oidcOnly).toBe(true);
    await waitFor(() => expect(window.location.href).toBe('/api/auth/oidc/login'));
  });

  it('FE-LOGIN-HOOK-008: does not bounce back to the IdP right after a logout', async () => {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json(buildAppConfig({ password_login: false, oidc_configured: true, oidc_login: true })),
      ),
    );

    const { result } = renderLogin([{ pathname: '/login', state: { noRedirect: true } }]);
    await ready(result);

    expect(result.current.noRedirect).toBe(true);
    expect(window.location.href).toBe('http://localhost/login');
  });

  it('FE-LOGIN-HOOK-009: never auto-redirects on a cached config', async () => {
    localStorage.setItem(
      CONFIG_CACHE_KEY,
      JSON.stringify(buildAppConfig({ password_login: false, oidc_configured: true, oidc_login: true })),
    );
    server.use(http.get('/api/auth/app-config', () => HttpResponse.error()));

    const { result } = renderLogin();
    await ready(result);

    expect(result.current.oidcOnly).toBe(true);
    expect(window.location.href).toBe('http://localhost/login');
  });
});

describe('useLogin — redirect target', () => {
  it('FE-LOGIN-HOOK-010: stashes a relative redirect for the round trip through the IdP', async () => {
    setSearch('?redirect=%2Foauth%2Fconsent%3Fclient_id%3Dfoo');
    const { result } = renderLogin();
    await ready(result);

    expect(sessionStorage.getItem('oidc_redirect')).toBe('/oauth/consent?client_id=foo');
  });

  it('FE-LOGIN-HOOK-011: rejects a protocol-relative redirect', async () => {
    setSearch('?redirect=//evil.example.com/steal');
    const { result } = renderLogin();
    await ready(result);

    expect(sessionStorage.getItem('oidc_redirect')).toBeNull();
  });

  it('FE-LOGIN-HOOK-012: rejects a backslash-escaped redirect', async () => {
    setSearch('?redirect=/\\evil.example.com');
    const { result } = renderLogin();
    await ready(result);

    expect(sessionStorage.getItem('oidc_redirect')).toBeNull();
  });

  it('FE-LOGIN-HOOK-013: rejects an absolute redirect', async () => {
    setSearch('?redirect=https%3A%2F%2Fevil.example.com');
    const { result } = renderLogin();
    await ready(result);

    expect(sessionStorage.getItem('oidc_redirect')).toBeNull();
  });

  it('FE-LOGIN-HOOK-056: without a redirect param it defers to the startup destination, not the dashboard', async () => {
    setSearch('');
    const { result } = renderLogin();
    await ready(result);

    // Nothing stashed: '/' is the resolver route, not a place worth returning to.
    expect(sessionStorage.getItem('oidc_redirect')).toBeNull();

    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      await result.current.handleDemoLogin();
    });
    act(() => { vi.advanceTimersByTime(2600); });
    expect(mockNavigate).toHaveBeenCalledWith(START_DESTINATION_ROUTE);
  });

  it('FE-LOGIN-HOOK-057: an explicit redirect still beats the startup destination', async () => {
    setSearch('?redirect=/trips/9%3Ftab%3Dfinanzplan');
    const { result } = renderLogin();
    await ready(result);

    expect(sessionStorage.getItem('oidc_redirect')).toBe('/trips/9?tab=finanzplan');
  });
});

describe('useLogin — invite links', () => {
  it('FE-LOGIN-HOOK-014: opens registration for a valid invite', async () => {
    setSearch('?invite=abc123');
    server.use(http.get('/api/auth/invite/:token', () => HttpResponse.json({ valid: true })));

    const { result } = renderLogin();
    await waitFor(() => expect(result.current.mode).toBe('register'));

    expect(result.current.inviteToken).toBe('abc123');
    await waitFor(() => expect(result.current.showRegisterOption).toBe(true));
  });

  it('FE-LOGIN-HOOK-015: reports an invite link the server rejects', async () => {
    setSearch('?invite=expired');
    server.use(
      http.get('/api/auth/invite/:token', () => HttpResponse.json({ error: 'gone' }, { status: 410 })),
    );

    const { result } = renderLogin();
    await waitFor(() => expect(result.current.error).toBe('Invalid or expired invite link'));
  });
});

describe('useLogin — OIDC callback', () => {
  it('FE-LOGIN-HOOK-016: navigates to the stashed redirect after a successful code exchange', async () => {
    sessionStorage.setItem('oidc_redirect', '/oauth/consent?client_id=foo');
    setSearch('?oidc_code=code-1');
    server.use(http.get('/api/auth/oidc/exchange', () => HttpResponse.json({ token: 'tok' })));

    const { result } = renderLogin();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/oauth/consent?client_id=foo', { replace: true }),
    );
    expect(auth.loadUser).toHaveBeenCalled();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('FE-LOGIN-HOOK-055: exchanges the single-use code exactly once, even when the page re-renders', async () => {
    let exchanges = 0;
    setSearch('?oidc_code=code-once');
    server.use(
      http.get('/api/auth/oidc/exchange', () => {
        exchanges += 1;
        return HttpResponse.json({ token: 'tok' });
      }),
    );

    renderLogin();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(START_DESTINATION_ROUTE, { replace: true }));

    // Switching language rebuilds `t`, which the callback effect depends on.
    await act(async () => {
      useSettingsStore.getState().setLanguageLocal('de');
    });
    await waitFor(() => expect(useSettingsStore.getState().settings.language).toBe('de'));

    expect(exchanges).toBe(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('FE-LOGIN-HOOK-017: surfaces the error the exchange endpoint reports', async () => {
    setSearch('?oidc_code=code-2');
    server.use(http.get('/api/auth/oidc/exchange', () => HttpResponse.json({ error: 'State mismatch' })));

    const { result } = renderLogin();
    await waitFor(() => expect(result.current.error).toBe('State mismatch'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-HOOK-018: falls back to a generic message when the exchange returns nothing useful', async () => {
    setSearch('?oidc_code=code-3');
    server.use(http.get('/api/auth/oidc/exchange', () => HttpResponse.json({})));

    const { result } = renderLogin();
    await waitFor(() => expect(result.current.error).toBe('OIDC login failed'));
  });

  it('FE-LOGIN-HOOK-019: reports a generic failure when the exchange request itself fails', async () => {
    setSearch('?oidc_code=code-4');
    server.use(http.get('/api/auth/oidc/exchange', () => HttpResponse.error()));

    const { result } = renderLogin();
    await waitFor(() => expect(result.current.error).toBe('OIDC login failed'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('FE-LOGIN-HOOK-020: translates a known oidc_error code and clears the stashed redirect', async () => {
    sessionStorage.setItem('oidc_redirect', '/oauth/consent');
    setSearch('?oidc_error=registration_disabled');

    const { result } = renderLogin();
    await waitFor(() =>
      expect(result.current.error).toBe('Registration is disabled. Contact your administrator.'),
    );
    expect(sessionStorage.getItem('oidc_redirect')).toBeNull();
  });

  it('FE-LOGIN-HOOK-021: passes an unknown oidc_error through unchanged', async () => {
    setSearch('?oidc_error=some_new_provider_code');

    const { result } = renderLogin();
    await waitFor(() => expect(result.current.error).toBe('some_new_provider_code'));
  });
});

describe('useLogin — language detection', () => {
  it('FE-LOGIN-HOOK-022: adopts the browser language when nothing is stored', async () => {
    setLanguages(['de-DE', 'de']);
    const { result } = renderLogin();
    await ready(result);

    expect(useSettingsStore.getState().settings.language).toBe('de');
  });

  it('FE-LOGIN-HOOK-023: falls back to the server default when the browser language is unsupported', async () => {
    setLanguages(['xh-ZA']);
    server.use(http.get('/api/config', () => HttpResponse.json({ defaultLanguage: 'fr' })));

    const { result } = renderLogin();
    await waitFor(() => expect(useSettingsStore.getState().settings.language).toBe('fr'));
    await ready(result);
  });

  it('FE-LOGIN-HOOK-024: leaves the language alone when the server has no default either', async () => {
    setLanguages(['xh-ZA']);
    server.use(http.get('/api/config', () => HttpResponse.json({ defaultLanguage: '' })));

    const { result } = renderLogin();
    await ready(result);

    expect(useSettingsStore.getState().settings.language).toBe('en');
  });

  it('FE-LOGIN-HOOK-025: warns instead of failing when the default-language probe errors', async () => {
    setLanguages(['xh-ZA']);
    server.use(http.get('/api/config', () => HttpResponse.error()));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderLogin();
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Failed to fetch default language config:', expect.anything()),
    );
    await ready(result);

    warn.mockRestore();
  });

  it('FE-LOGIN-HOOK-026: skips detection entirely when the user already picked a language', async () => {
    localStorage.setItem('app_language', 'es');
    setLanguages(['de-DE']);

    const { result } = renderLogin();
    await ready(result);

    expect(useSettingsStore.getState().settings.language).toBe('en');
  });
});

describe('useLogin — language dropdown', () => {
  it('FE-LOGIN-HOOK-027: closes the dropdown on the next document click and stops listening once closed', async () => {
    const { result } = renderLogin();
    await ready(result);

    act(() => result.current.setLangDropdownOpen(true));
    expect(result.current.langDropdownOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(result.current.langDropdownOpen).toBe(false);

    // Listener is torn down — a second click cannot flip it back.
    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(result.current.langDropdownOpen).toBe(false);
  });
});

describe('useLogin — demo login', () => {
  it('FE-LOGIN-HOOK-028: takes off and navigates to the redirect target', async () => {
    setSearch('?redirect=/trips/7');
    const { result } = renderLogin();
    await ready(result);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      await result.current.handleDemoLogin();
    });

    expect(auth.demoLogin).toHaveBeenCalled();
    expect(result.current.showTakeoff).toBe(true);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/trips/7');
  });

  it('FE-LOGIN-HOOK-029: surfaces the demo failure message', async () => {
    useAuthStore.setState({
      demoLogin: vi.fn(async () => {
        throw new Error('Demo is disabled');
      }),
    });

    const { result } = renderLogin();
    await ready(result);

    await act(async () => {
      await result.current.handleDemoLogin();
    });

    expect(result.current.error).toBe('Demo is disabled');
    expect(result.current.showTakeoff).toBe(false);
  });

  it('FE-LOGIN-HOOK-030: falls back to a generic message when the rejection is not an Error', async () => {
    useAuthStore.setState({
      demoLogin: vi.fn(async () => {
        throw 'nope';
      }),
    });

    const { result } = renderLogin();
    await ready(result);

    await act(async () => {
      await result.current.handleDemoLogin();
    });

    expect(result.current.error).toBe('Demo login failed');
  });
});

describe('useLogin — passkey login', () => {
  beforeEach(() => {
    server.use(
      http.post('/api/auth/passkey/login/options', () => HttpResponse.json({ challenge: 'chal' })),
      http.post('/api/auth/passkey/login/verify', () => HttpResponse.json({ token: 'tok', user: {} })),
    );
  });

  it('FE-LOGIN-HOOK-031: verifies the assertion, reloads the user and takes off', async () => {
    vi.mocked(startAuthentication).mockResolvedValue({ id: 'cred-1' } as never);

    const { result } = renderLogin();
    await ready(result);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      await result.current.handlePasskeyLogin();
    });

    expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON: { challenge: 'chal' } });
    expect(auth.loadUser).toHaveBeenCalledWith({ silent: true });
    expect(result.current.showTakeoff).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(mockNavigate).toHaveBeenCalledWith(START_DESTINATION_ROUTE);
  });

  it.each(['NotAllowedError', 'AbortError'])(
    'FE-LOGIN-HOOK-032: stays quiet when the native prompt is dismissed (%s)',
    async (name) => {
      const err = Object.assign(new Error('dismissed'), { name });
      vi.mocked(startAuthentication).mockRejectedValue(err);

      const { result } = renderLogin();
      await ready(result);

      await act(async () => {
        await result.current.handlePasskeyLogin();
      });

      expect(result.current.error).toBe('');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.showTakeoff).toBe(false);
    },
  );

  it('FE-LOGIN-HOOK-033: reports a real passkey failure', async () => {
    vi.mocked(startAuthentication).mockRejectedValue(new Error('Authenticator rejected the request'));

    const { result } = renderLogin();
    await ready(result);

    await act(async () => {
      await result.current.handlePasskeyLogin();
    });

    expect(result.current.error).toBe('Authenticator rejected the request');
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-HOOK-034: falls back to the generic passkey message for an opaque failure', async () => {
    vi.mocked(startAuthentication).mockRejectedValue({ code: 17 });

    const { result } = renderLogin();
    await ready(result);

    await act(async () => {
      await result.current.handlePasskeyLogin();
    });

    expect(result.current.error).toBe('Passkey sign-in failed. Please try again.');
  });
});

describe('useLogin — register submit', () => {
  it('FE-LOGIN-HOOK-035: refuses an empty username', async () => {
    const { result } = renderLogin();
    await ready(result);

    act(() => result.current.setMode('register'));
    act(() => result.current.setUsername('   '));

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Username is required');
    expect(auth.register).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-HOOK-036: refuses a password below the minimum length', async () => {
    const { result } = renderLogin();
    await ready(result);

    act(() => result.current.setMode('register'));
    act(() => {
      result.current.setUsername('newuser');
      result.current.setPassword('short');
    });

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Password must be at least 8 characters');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-HOOK-037: registers with the invite token from the URL', async () => {
    setSearch('?invite=inv-42');
    server.use(http.get('/api/auth/invite/:token', () => HttpResponse.json({ valid: true })));

    const { result } = renderLogin();
    await waitFor(() => expect(result.current.inviteToken).toBe('inv-42'));

    act(() => {
      result.current.setUsername('newuser');
      result.current.setEmail('new@example.com');
      result.current.setPassword('password123');
    });

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(auth.register).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123', 'inv-42');
    expect(result.current.showTakeoff).toBe(true);
  });

  it('FE-LOGIN-HOOK-038: registers without an invite token when there is none', async () => {
    const { result } = renderLogin();
    await ready(result);

    act(() => result.current.setMode('register'));
    act(() => {
      result.current.setUsername('newuser');
      result.current.setEmail('new@example.com');
      result.current.setPassword('password123');
    });

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(auth.register).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123', undefined);
  });
});

describe('useLogin — password submit', () => {
  it('FE-LOGIN-HOOK-039: forwards the remember-me choice and takes off', async () => {
    const { result } = renderLogin();
    await ready(result);

    act(() => {
      result.current.setEmail('user@example.com');
      result.current.setPassword('password123');
      result.current.setRememberMe(true);
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(auth.login).toHaveBeenCalledWith('user@example.com', 'password123', true);
    expect(result.current.showTakeoff).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(mockNavigate).toHaveBeenCalledWith(START_DESTINATION_ROUTE);
  });

  it('FE-LOGIN-HOOK-040: stops on a dropped Secure cookie instead of dead-ending later', async () => {
    useAuthStore.setState({
      login: vi.fn(async () => ({ ...authOk(), insecureCookie: true }) as unknown as LoginResult),
    });

    const { result } = renderLogin();
    await ready(result);

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.insecureCookie).toBe(true);
    expect(result.current.showTakeoff).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-HOOK-041: moves to the MFA step when the server demands a second factor', async () => {
    useAuthStore.setState({
      login: vi.fn(async () => ({ mfa_required: true, mfa_token: 'mfa-tok' }) as unknown as LoginResult),
    });

    const { result } = renderLogin();
    await ready(result);

    act(() => result.current.setMfaCode('leftover'));
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.mfaStep).toBe(true);
    expect(result.current.mfaToken).toBe('mfa-tok');
    expect(result.current.mfaCode).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-HOOK-042: moves to the password-change step when the account is flagged', async () => {
    useAuthStore.setState({
      login: vi.fn(async () => authOk({ must_change_password: true }) as LoginResult),
    });

    const { result } = renderLogin();
    await ready(result);

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.passwordChangeStep).toBe(true);
    expect(result.current.showTakeoff).toBe(false);
  });

  it('FE-LOGIN-HOOK-043: surfaces the login error and stops the spinner', async () => {
    useAuthStore.setState({
      login: vi.fn(async () => {
        throw new Error('Invalid credentials');
      }),
    });

    const { result } = renderLogin();
    await ready(result);

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-HOOK-044: falls back to the generic login error for an opaque rejection', async () => {
    useAuthStore.setState({
      login: vi.fn(async () => {
        throw { status: 500 };
      }),
    });

    const { result } = renderLogin();
    await ready(result);

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Login failed. Please check your credentials.');
  });
});

describe('useLogin — MFA step', () => {
  async function reachMfaStep() {
    useAuthStore.setState({
      login: vi.fn(async () => ({ mfa_required: true, mfa_token: 'mfa-tok' }) as unknown as LoginResult),
    });
    const { result } = renderLogin();
    await ready(result);
    act(() => result.current.setPassword('password123'));
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });
    return result;
  }

  it('FE-LOGIN-HOOK-045: refuses a blank code', async () => {
    const result = await reachMfaStep();

    act(() => result.current.setMfaCode('   '));
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Enter the code from your authenticator app.');
    expect(auth.completeMfaLogin).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-HOOK-046: verifies the code and takes off', async () => {
    const result = await reachMfaStep();

    act(() => {
      result.current.setMfaCode('123456');
      result.current.setRememberMe(true);
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(auth.completeMfaLogin).toHaveBeenCalledWith('mfa-tok', '123456', true);
    expect(result.current.showTakeoff).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(mockNavigate).toHaveBeenCalledWith(START_DESTINATION_ROUTE);
  });

  it('FE-LOGIN-HOOK-047: hands over to the password-change step after MFA when the account is flagged', async () => {
    useAuthStore.setState({
      completeMfaLogin: vi.fn(async () => authOk({ must_change_password: true })),
    });
    const result = await reachMfaStep();

    act(() => result.current.setMfaCode('123456'));
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.passwordChangeStep).toBe(true);
    expect(result.current.showTakeoff).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useLogin — forced password change', () => {
  async function reachPasswordChange() {
    useAuthStore.setState({
      login: vi.fn(async () => authOk({ must_change_password: true }) as LoginResult),
    });
    const { result } = renderLogin();
    await ready(result);
    act(() => result.current.setPassword('old-password'));
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });
    return result;
  }

  it('FE-LOGIN-HOOK-048: requires a new password', async () => {
    const result = await reachPasswordChange();

    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Please enter current and new password');
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-LOGIN-HOOK-049: refuses a new password below the minimum length', async () => {
    const result = await reachPasswordChange();

    act(() => result.current.setNewPassword('short'));
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Password must be at least 8 characters');
  });

  it('FE-LOGIN-HOOK-050: refuses a mismatched confirmation', async () => {
    const result = await reachPasswordChange();

    act(() => {
      result.current.setNewPassword('newpassword123');
      result.current.setConfirmPassword('newpassword124');
    });
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Passwords do not match');
  });

  it('FE-LOGIN-HOOK-051: submits the saved login password as the current one, then takes off', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/me/password', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      }),
    );

    const result = await reachPasswordChange();

    act(() => {
      result.current.setNewPassword('newpassword123');
      result.current.setConfirmPassword('newpassword123');
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(body).toEqual({ current_password: 'old-password', new_password: 'newpassword123' });
    expect(auth.loadUser).toHaveBeenCalledWith({ silent: true });
    expect(result.current.showTakeoff).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2600);
    });
    expect(mockNavigate).toHaveBeenCalledWith(START_DESTINATION_ROUTE);
  });

  it('FE-LOGIN-HOOK-052: surfaces a rejected password change', async () => {
    server.use(
      http.put('/api/auth/me/password', () =>
        HttpResponse.json({ error: 'Current password is wrong' }, { status: 400 }),
      ),
    );

    const result = await reachPasswordChange();

    act(() => {
      result.current.setNewPassword('newpassword123');
      result.current.setConfirmPassword('newpassword123');
    });
    await act(async () => {
      await result.current.handleSubmit(formEvent());
    });

    expect(result.current.error).toBe('Current password is wrong');
    expect(result.current.showTakeoff).toBe(false);
  });
});

describe('useLogin — register visibility rules', () => {
  it('FE-LOGIN-HOOK-053: hides registration once setup is complete and passwords are closed', async () => {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json({ ...buildAppConfig({ password_registration: false }), setup_complete: true }),
      ),
    );

    const { result } = renderLogin();
    await ready(result);

    expect(result.current.showRegisterOption).toBe(false);
  });

  it('FE-LOGIN-HOOK-054: still offers registration on a half-finished setup with no users', async () => {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json({
          ...buildAppConfig({ has_users: false, password_registration: false }),
          setup_complete: false,
        }),
      ),
    );

    const { result } = renderLogin();
    await ready(result);

    expect(result.current.showRegisterOption).toBe(true);
  });
});

/*
 * OIDC-only: the two ways the login page used to sign a user back in against
 * their will. Both need `password_login: false`, because that is what arms the
 * automatic bounce to the provider at useLogin's config probe.
 */
describe('OIDC-only auto-redirect suppression', () => {
  function oidcOnly() {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json(buildAppConfig({ password_login: false, oidc_login: true, oidc_configured: true, has_users: true }))),
    );
  }

  // #2126. The exchange strips oidc_code from the URL before it navigates away,
  // so a re-run of the effect during that window used to read an empty search,
  // miss the guard that sat inside the oidc_code branch, and reach the bounce.
  it('FE-LOGIN-HOOK-200: an exchange in flight suppresses the bounce even after it stripped oidc_code', async () => {
    oidcOnly();
    let release: (v: unknown) => void = () => {};
    server.use(
      http.get('/api/auth/oidc/exchange', async () => {
        await new Promise(r => { release = r; });
        return HttpResponse.json({ token: 'tok' });
      }),
    );
    setSearch('?oidc_code=CODE-1');
    renderLogin();

    // The exchange has not answered yet. Strip the parameter the way its own
    // `.then` does, then re-run the effect the way the real page does: `t` is
    // one of the effect's dependencies and changes identity whenever the
    // language does, which happens on every non-English install (the login page
    // sets a transient language, and the locale chunk resolves asynchronously).
    setSearch('');
    await act(async () => {
      useSettingsStore.getState().setLanguageTransient('fr');
      await new Promise(r => setTimeout(r, 20));
    });

    expect(window.location.href).not.toContain('/api/auth/oidc/login');
    release(null);
  });

  // #2123. A deliberate sign-out loses its location state to ProtectedRoute's
  // stateless <Navigate replace>, and to any full document load, so the brake
  // has to live somewhere that survives both.
  it('FE-LOGIN-HOOK-201: a tab that just signed out does not bounce to the provider', async () => {
    oidcOnly();
    markSignedOut();
    const { result } = renderLogin();
    await ready(result);
    expect(window.location.href).not.toContain('/api/auth/oidc/login');
  });

  it('FE-LOGIN-HOOK-202: the marker is per tab, so a fresh tab still auto-SSOs', async () => {
    oidcOnly();
    clearSignedOut();
    const { result } = renderLogin();
    await ready(result);
    expect(window.location.href).toContain('/api/auth/oidc/login');
  });

  it('FE-LOGIN-HOOK-203: signing back in clears the marker, so the next visit auto-SSOs again', async () => {
    markSignedOut();
    expect(wasSignedOut()).toBe(true);
    clearSignedOut();
    expect(wasSignedOut()).toBe(false);
  });

  it('FE-LOGIN-HOOK-204: password installs are untouched by the marker', async () => {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json(buildAppConfig({ password_login: true, oidc_login: true, oidc_configured: true, has_users: true }))),
    );
    markSignedOut();
    const { result } = renderLogin();
    await ready(result);
    // Never redirected in the first place: the bounce requires password_login false.
    expect(window.location.href).not.toContain('/api/auth/oidc/login');
    expect(result.current.appConfig?.password_login).toBe(true);
  });
});
