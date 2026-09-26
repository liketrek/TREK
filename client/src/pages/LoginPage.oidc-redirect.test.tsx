import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../tests/helpers/render';
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/helpers/msw/server';
import { resetAllStores } from '../../tests/helpers/store';
import { buildAppConfig } from '../../tests/helpers/factories';
import { START_DESTINATION_ROUTE } from '../utils/startDestination';
import LoginPage from './LoginPage';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('LoginPage — OIDC redirect preservation', () => {
  let savedLocation: Location;

  beforeEach(() => {
    resetAllStores();
    mockNavigate.mockClear();
    sessionStorage.clear();
    savedLocation = window.location;
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: savedLocation,
    });
  });

  function setSearch(search: string) {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, search },
    });
  }

  describe('FE-PAGE-LOGIN-022: redirect param stashed in sessionStorage on mount', () => {
    it('saves decoded redirect to sessionStorage when ?redirect= is present', async () => {
      setSearch('?redirect=%2Foauth%2Fconsent%3Fclient_id%3Dfoo');
      render(<LoginPage />);

      await waitFor(() => {
        expect(sessionStorage.getItem('oidc_redirect')).toBe('/oauth/consent?client_id=foo');
      });
    });

    it('does not write to sessionStorage when no redirect param is present', async () => {
      render(<LoginPage />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
      });

      expect(sessionStorage.getItem('oidc_redirect')).toBeNull();
    });
  });

  describe('FE-PAGE-LOGIN-023: OIDC code exchange navigates to sessionStorage redirect', () => {
    beforeEach(() => {
      server.use(
          http.get('/api/auth/oidc/exchange', () =>
              HttpResponse.json({ token: 'mock-oidc-token' })
          ),
      );
    });

    it('navigates to the saved sessionStorage redirect after successful OIDC exchange', async () => {
      sessionStorage.setItem('oidc_redirect', '/oauth/consent?client_id=foo&state=xyz');
      setSearch('?oidc_code=testcode123');
      render(<LoginPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
            '/oauth/consent?client_id=foo&state=xyz',
            { replace: true },
        );
      });

      expect(sessionStorage.getItem('oidc_redirect')).toBeNull();
    });

    it('falls back to the startup destination when no sessionStorage redirect is set', async () => {
      setSearch('?oidc_code=testcode123');
      render(<LoginPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(START_DESTINATION_ROUTE, { replace: true });
      });
    });
  });

  describe('FE-PAGE-LOGIN-024: OIDC error clears sessionStorage redirect', () => {
    it('removes oidc_redirect from sessionStorage on OIDC error', async () => {
      sessionStorage.setItem('oidc_redirect', '/oauth/consent?client_id=foo');
      setSearch('?oidc_error=token_failed');
      render(<LoginPage />);

      await waitFor(() => {
        expect(sessionStorage.getItem('oidc_redirect')).toBeNull();
      });
    });
  });
  describe('FE-PAGE-LOGIN-025: an OIDC-only instance shows where it is going and nothing to fill in (#1167)', () => {
    afterEach(() => { localStorage.removeItem('trek_app_config_cache'); });

    it('names the provider and draws neither a password field nor a sign-in button', async () => {
      setSearch('');
      server.use(
        http.get('/api/auth/app-config', () =>
          HttpResponse.json(buildAppConfig({ password_login: false, oidc_configured: true, oidc_login: true, oidc_display_name: 'Keycloak' })),
        ),
      );
      render(<LoginPage />);

      expect(await screen.findByText('Taking you to Keycloak…')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('your@email.com')).toBeNull();
      expect(screen.queryByText('Sign in with Keycloak')).toBeNull();
    });
  });

  describe('FE-PAGE-LOGIN-026: no password form while the sign-in is still unknown (#1167)', () => {
    afterEach(() => { localStorage.removeItem('trek_app_config_cache'); });

    it('shows a wait instead of the form until the config answers', async () => {
      localStorage.removeItem('trek_app_config_cache');
      let release!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      server.use(
        http.get('/api/auth/app-config', async () => {
          await gate;
          return HttpResponse.json(buildAppConfig());
        }),
      );
      render(<LoginPage />);

      expect(screen.queryByPlaceholderText('your@email.com')).toBeNull();
      expect(screen.getByRole('status', { name: 'Loading...' })).toBeInTheDocument();

      release();
      expect(await screen.findByPlaceholderText('your@email.com')).toBeInTheDocument();
    });
  });
});