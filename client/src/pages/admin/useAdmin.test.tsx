// FE-ADMHOOK-001 to FE-ADMHOOK-049
import { http, HttpResponse } from 'msw';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { buildAdmin, buildUser } from '../../../tests/helpers/factories';
import { server } from '../../../tests/helpers/msw/server';
import { act, renderHook, waitFor } from '../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useAuthStore } from '../../store/authStore';

import { useAdmin } from './useAdmin';

const toastCalls: { type: string; message: string }[] = [];

vi.mock('../../components/shared/Toast', () => ({
  useToast: () => ({
    success: (m: string) => toastCalls.push({ type: 'success', message: m }),
    error: (m: string) => toastCalls.push({ type: 'error', message: m }),
    warning: (m: string) => toastCalls.push({ type: 'warning', message: m }),
    info: (m: string) => toastCalls.push({ type: 'info', message: m }),
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <TranslationProvider>{children}</TranslationProvider>
    </MemoryRouter>
  );
}

/** Mounts the hook and waits until the initial parallel loads have settled. */
async function mountAdmin(url = '/admin') {
  const at = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>
      <TranslationProvider>{children}</TranslationProvider>
    </MemoryRouter>
  );
  const view = renderHook(() => useAdmin(), { wrapper: url === '/admin' ? wrapper : at });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

const me = buildAdmin({ id: 1, username: 'admin', email: 'admin@example.com' });
const alice = buildUser({ id: 2, username: 'alice', email: 'alice@example.com' });

beforeEach(() => {
  resetAllStores();
  toastCalls.length = 0;
  seedStore(useAuthStore, { isAuthenticated: true, user: me });
  // The default handler hands out generated ids; the self-delete guard needs
  // the admin row to match the signed-in user.
  server.use(http.get('/api/admin/users', () => HttpResponse.json({ users: [me, alice] })));
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

describe('useAdmin', () => {
  it('FE-ADMHOOK-001: loads users, stats and invites on mount', async () => {
    const { result } = await mountAdmin();

    expect(result.current.users.map(u => u.username)).toEqual(['admin', 'alice']);
    expect(result.current.stats).toMatchObject({ totalUsers: 2, totalTrips: 5, totalPlaces: 42, totalFiles: 8 });
    expect(result.current.invites).toEqual([]);
    expect(result.current.activeTab).toBe('users');
  });

  it('FE-ADMHOOK-002: toasts when the initial load fails', async () => {
    server.use(http.get('/api/admin/users', () => HttpResponse.json({}, { status: 500 })));

    await mountAdmin();

    expect(toastCalls).toContainEqual({ type: 'error', message: 'Failed to load admin data' });
  });

  it('FE-ADMHOOK-003: survives failing invite endpoints with empty lists', async () => {
    server.use(
      http.get('/api/admin/invites', () => HttpResponse.json({}, { status: 500 })),
      http.get('/api/admin/invites/trips', () => HttpResponse.json({}, { status: 500 }))
    );

    const { result } = await mountAdmin();

    expect(result.current.invites).toEqual([]);
    expect(result.current.inviteTrips).toEqual([]);
    expect(toastCalls).toEqual([]);
  });

  it('FE-ADMHOOK-004: reads the auth toggles out of the app config', async () => {
    server.use(
      http.get('/api/auth/app-config', () =>
        HttpResponse.json({
          password_login: false,
          password_registration: false,
          oidc_login: false,
          oidc_registration: false,
          env_override_oidc_only: true,
          oidc_configured: true,
          require_mfa: 1,
          passkey_login: true,
          passkey_configured: true,
          allowed_file_types: 'jpg,png',
        })
      )
    );

    const { result } = await mountAdmin();

    await waitFor(() => expect(result.current.passwordLogin).toBe(false));
    expect(result.current.passwordRegistration).toBe(false);
    expect(result.current.oidcLogin).toBe(false);
    expect(result.current.oidcRegistration).toBe(false);
    expect(result.current.envOverrideOidcOnly).toBe(true);
    expect(result.current.oidcConfigured).toBe(true);
    expect(result.current.requireMfa).toBe(true);
    expect(result.current.passkeyLogin).toBe(true);
    expect(result.current.passkeyConfigured).toBe(true);
    expect(result.current.allowedFileTypes).toBe('jpg,png');
  });

  it('FE-ADMHOOK-005: falls back to allow_registration for both registration flags', async () => {
    server.use(http.get('/api/auth/app-config', () => HttpResponse.json({ allow_registration: false })));

    const { result } = await mountAdmin();

    await waitFor(() => expect(result.current.passwordRegistration).toBe(false));
    expect(result.current.oidcRegistration).toBe(false);
    expect(result.current.passwordLogin).toBe(true);
  });

  it('FE-ADMHOOK-006: a failing app-config keeps the defaults', async () => {
    server.use(http.get('/api/auth/app-config', () => HttpResponse.json({}, { status: 500 })));

    const { result } = await mountAdmin();

    expect(result.current.passwordLogin).toBe(true);
    expect(result.current.allowedFileTypes).toContain('jpg');
  });

  it('FE-ADMHOOK-007: loads the stored API keys', async () => {
    server.use(
      http.get('/api/auth/me/settings', () =>
        HttpResponse.json({
          settings: { maps_api_key: 'maps-k', openweather_api_key: 'weather-k', unsplash_api_key: 'unsplash-k' },
        })
      )
    );

    const { result } = await mountAdmin();

    await waitFor(() => expect(result.current.mapsKey).toBe('maps-k'));
    expect(result.current.weatherKey).toBe('weather-k');
    expect(result.current.unsplashKey).toBe('unsplash-k');
  });

  it('FE-ADMHOOK-008: a failing settings request leaves the keys empty', async () => {
    server.use(http.get('/api/auth/me/settings', () => HttpResponse.json({}, { status: 500 })));

    const { result } = await mountAdmin();

    expect(result.current.mapsKey).toBe('');
  });

  it('FE-ADMHOOK-009: ignores a version check that reports no update', async () => {
    const { result } = await mountAdmin();

    expect(result.current.updateInfo).toBeNull();
  });

  it('FE-ADMHOOK-045: keeps an available update', async () => {
    server.use(
      http.get('/api/admin/version-check', () =>
        HttpResponse.json({ update_available: true, latest: '9.9.9', current: '1.0.0' })
      )
    );

    const { result } = await mountAdmin();

    await waitFor(() => expect(result.current.updateInfo).toMatchObject({ latest: '9.9.9' }));
  });

  it('FE-ADMHOOK-010: loads the feature flags and app settings', async () => {
    server.use(
      http.get('/api/admin/bag-tracking', () => HttpResponse.json({ enabled: true })),
      http.get('/api/admin/places-photos', () => HttpResponse.json({ enabled: false })),
      http.get('/api/admin/places-autocomplete', () => HttpResponse.json({ enabled: false })),
      http.get('/api/admin/places-details', () => HttpResponse.json({ enabled: false })),
      http.get('/api/admin/collab-features', () =>
        HttpResponse.json({ chat: false, notes: true, polls: false, whatsnext: true })
      ),
      http.get('/api/auth/app-settings', () =>
        HttpResponse.json({ smtp_host: 'mail.test', webauthn_rp_id: 'trek.test', webauthn_origins: 'https://trek.test' })
      )
    );

    const { result } = await mountAdmin();

    await waitFor(() => expect(result.current.bagTrackingEnabled).toBe(true));
    expect(result.current.placesPhotosEnabled).toBe(false);
    expect(result.current.placesAutocompleteEnabled).toBe(false);
    expect(result.current.placesDetailsEnabled).toBe(false);
    expect(result.current.collabFeatures).toEqual({ chat: false, notes: true, polls: false, whatsnext: true });
    expect(result.current.smtpValues.smtp_host).toBe('mail.test');
    expect(result.current.webauthnRpId).toBe('trek.test');
    expect(result.current.webauthnOrigins).toBe('https://trek.test');
    expect(result.current.smtpLoaded).toBe(true);
  });

  it('FE-ADMHOOK-011: marks smtp as loaded even when app-settings fails', async () => {
    server.use(http.get('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));

    const { result } = await mountAdmin();

    await waitFor(() => expect(result.current.smtpLoaded).toBe(true));
    expect(result.current.smtpValues).toEqual({});
  });

  it('FE-ADMHOOK-012: handleToggleAuthSetting applies the value optimistically', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      })
    );
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleToggleAuthSetting('password_login', false, result.current.setPasswordLogin);
    });

    expect(body).toEqual({ password_login: false });
    expect(result.current.passwordLogin).toBe(false);
  });

  it('FE-ADMHOOK-013: handleToggleAuthSetting rolls back and toasts on failure', async () => {
    server.use(
      http.put('/api/auth/app-settings', () => HttpResponse.json({ error: 'locked' }, { status: 400 }))
    );
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleToggleAuthSetting('password_login', false, result.current.setPasswordLogin);
    });

    expect(result.current.passwordLogin).toBe(true);
    expect(toastCalls).toContainEqual({ type: 'error', message: 'locked' });
  });

  it('FE-ADMHOOK-014: handleToggleRequireMfa mirrors the value into the auth store', async () => {
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleToggleRequireMfa(true);
    });

    expect(result.current.requireMfa).toBe(true);
    expect(useAuthStore.getState().appRequireMfa).toBe(true);
    expect(toastCalls).toContainEqual({ type: 'success', message: 'Saved' });
  });

  it('FE-ADMHOOK-015: handleToggleRequireMfa reverts on failure', async () => {
    server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleToggleRequireMfa(true);
    });

    expect(result.current.requireMfa).toBe(false);
    expect(toastCalls.some(c => c.type === 'error')).toBe(true);
  });

  it('FE-ADMHOOK-016: handleSaveWebauthn trims and re-reads the app config', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/app-settings', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
      http.get('/api/auth/app-config', () => HttpResponse.json({ passkey_configured: true }))
    );
    const { result } = await mountAdmin();

    act(() => {
      result.current.setWebauthnRpId('  trek.test  ');
      result.current.setWebauthnOrigins('  https://trek.test  ');
    });
    await act(async () => {
      await result.current.handleSaveWebauthn();
    });

    expect(body).toEqual({ webauthn_rp_id: 'trek.test', webauthn_origins: 'https://trek.test' });
    expect(result.current.passkeyConfigured).toBe(true);
    expect(result.current.savingWebauthn).toBe(false);
  });

  it('FE-ADMHOOK-017: handleSaveWebauthn toasts and resets the flag on failure', async () => {
    server.use(http.put('/api/auth/app-settings', () => HttpResponse.json({}, { status: 500 })));
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleSaveWebauthn();
    });

    expect(toastCalls.some(c => c.type === 'error')).toBe(true);
    expect(result.current.savingWebauthn).toBe(false);
  });

  it('FE-ADMHOOK-018: toggleKey flips visibility per key', async () => {
    const { result } = await mountAdmin();

    act(() => result.current.toggleKey('maps'));
    expect(result.current.showKeys).toEqual({ maps: true });

    act(() => result.current.toggleKey('maps'));
    expect(result.current.showKeys).toEqual({ maps: false });
  });

  it('FE-ADMHOOK-019: handleSaveApiKeys sends all three keys and toasts', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/auth/me/api-keys', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      })
    );
    const { result } = await mountAdmin();

    act(() => {
      result.current.setMapsKey('m');
      result.current.setWeatherKey('w');
      result.current.setUnsplashKey('u');
    });
    await act(async () => {
      await result.current.handleSaveApiKeys();
    });

    expect(body).toMatchObject({ maps_api_key: 'm', openweather_api_key: 'w', unsplash_api_key: 'u' });
    expect(toastCalls).toContainEqual({ type: 'success', message: 'API keys saved' });
    expect(result.current.savingKeys).toBe(false);
  });

  it('FE-ADMHOOK-020: handleSaveApiKeys surfaces the thrown error message', async () => {
    server.use(http.put('/api/auth/me/api-keys', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleSaveApiKeys();
    });

    expect(toastCalls.some(c => c.type === 'error')).toBe(true);
    expect(result.current.savingKeys).toBe(false);
  });

  it('FE-ADMHOOK-021: handleValidateKeys stores the full validation result', async () => {
    server.use(
      http.put('/api/auth/me/api-keys', () => HttpResponse.json({ success: true })),
      http.get('/api/auth/validate-keys', () => HttpResponse.json({ maps: true, weather: false }))
    );
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleValidateKeys();
    });

    expect(result.current.validation).toEqual({ maps: true, weather: false });
    expect(result.current.validating).toEqual({});
  });

  it('FE-ADMHOOK-022: handleValidateKeys toasts and clears the flags on failure', async () => {
    server.use(http.get('/api/auth/validate-keys', () => HttpResponse.json({}, { status: 500 })));
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleValidateKeys();
    });

    expect(toastCalls).toContainEqual({ type: 'error', message: 'Error' });
    expect(result.current.validating).toEqual({});
  });

  it('FE-ADMHOOK-023: handleValidateKey stores only the requested key', async () => {
    server.use(
      http.put('/api/auth/me/api-keys', () => HttpResponse.json({ success: true })),
      http.get('/api/auth/validate-keys', () => HttpResponse.json({ maps: false, weather: true }))
    );
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleValidateKey('maps');
    });

    expect(result.current.validation).toEqual({ maps: false });
    expect(result.current.validating).toEqual({ maps: false });
  });

  it('FE-ADMHOOK-024: handleValidateKey toasts on failure', async () => {
    server.use(http.get('/api/auth/validate-keys', () => HttpResponse.json({}, { status: 500 })));
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleValidateKey('maps');
    });

    expect(toastCalls).toContainEqual({ type: 'error', message: 'Error' });
    expect(result.current.validating).toEqual({ maps: false });
  });

  it('FE-ADMHOOK-025: handleCreateUser rejects an incomplete form', async () => {
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleCreateUser();
    });

    expect(toastCalls).toContainEqual({
      type: 'error',
      message: 'Username, email and password are required',
    });
    expect(result.current.users).toHaveLength(2);
  });

  it('FE-ADMHOOK-026: handleCreateUser rejects a short password', async () => {
    const { result } = await mountAdmin();

    act(() => result.current.setCreateForm({ username: 'bob', email: 'b@e.com', password: 'short', role: 'user' }));
    await act(async () => {
      await result.current.handleCreateUser();
    });

    expect(toastCalls.some(c => c.type === 'error')).toBe(true);
    expect(result.current.users).toHaveLength(2);
  });

  it('FE-ADMHOOK-027: handleCreateUser prepends the new user and resets the form', async () => {
    const { result } = await mountAdmin();

    act(() =>
      result.current.setCreateForm({ username: 'bob', email: 'b@e.com', password: 'longenough1', role: 'admin' })
    );
    act(() => result.current.setShowCreateUser(true));
    await act(async () => {
      await result.current.handleCreateUser();
    });

    expect(result.current.users[0].username).toBe('bob');
    expect(result.current.showCreateUser).toBe(false);
    expect(result.current.createForm).toEqual({ username: '', email: '', password: '', role: 'user' });
    expect(toastCalls).toContainEqual({ type: 'success', message: 'User created' });
  });

  it('FE-ADMHOOK-028: handleCreateUser surfaces the server error', async () => {
    server.use(http.post('/api/admin/users', () => HttpResponse.json({ error: 'taken' }, { status: 409 })));
    const { result } = await mountAdmin();

    act(() =>
      result.current.setCreateForm({ username: 'bob', email: 'b@e.com', password: 'longenough1', role: 'user' })
    );
    await act(async () => {
      await result.current.handleCreateUser();
    });

    expect(toastCalls).toContainEqual({ type: 'error', message: 'taken' });
    expect(result.current.users).toHaveLength(2);
  });

  it('FE-ADMHOOK-029: handleCreateInvite prepends the invite and copies the link', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true, configurable: true });
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/admin/invites', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ invite: { id: 7, token: 'tok-7' } });
      })
    );
    const { result } = await mountAdmin();

    act(() => result.current.setInviteForm({ max_uses: 3, expires_in_days: '', trip_id: '' }));
    await act(async () => {
      await result.current.handleCreateInvite();
    });

    expect(body).toEqual({ max_uses: 3, trip_id: null });
    expect(result.current.invites[0]).toMatchObject({ token: 'tok-7' });
    expect(result.current.inviteForm).toEqual({ max_uses: 1, expires_in_days: 7, trip_id: '' });
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/register?invite=tok-7')));
  });

  it('FE-ADMHOOK-030: handleCreateInvite forwards an explicit trip binding', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => undefined) },
      writable: true,
      configurable: true,
    });
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/admin/invites', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ invite: { id: 8, token: 'tok-8' } });
      })
    );
    const { result } = await mountAdmin();

    act(() => result.current.setInviteForm({ max_uses: 1, expires_in_days: 14, trip_id: 42 }));
    await act(async () => {
      await result.current.handleCreateInvite();
    });

    expect(body).toEqual({ max_uses: 1, expires_in_days: 14, trip_id: 42 });
  });

  it('FE-ADMHOOK-031: handleCreateInvite toasts the server error', async () => {
    server.use(http.post('/api/admin/invites', () => HttpResponse.json({ error: 'no invites' }, { status: 400 })));
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleCreateInvite();
    });

    expect(toastCalls).toContainEqual({ type: 'error', message: 'no invites' });
  });

  it('FE-ADMHOOK-032: handleDeleteInvite removes it from the list', async () => {
    server.use(
      http.get('/api/admin/invites', () =>
        HttpResponse.json({ invites: [{ id: 5, token: 'a' }, { id: 6, token: 'b' }] })
      )
    );
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleDeleteInvite(5);
    });

    expect(result.current.invites.map(i => i.id)).toEqual([6]);
    expect(toastCalls).toContainEqual({ type: 'success', message: 'Invite link deleted' });
  });

  it('FE-ADMHOOK-033: a failing invite delete keeps the list intact', async () => {
    server.use(
      http.get('/api/admin/invites', () => HttpResponse.json({ invites: [{ id: 5, token: 'a' }] })),
      http.delete('/api/admin/invites/:id', () => HttpResponse.json({}, { status: 500 }))
    );
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleDeleteInvite(5);
    });

    expect(result.current.invites).toHaveLength(1);
    expect(toastCalls).toContainEqual({ type: 'error', message: 'Failed to delete invite link' });
  });

  it('FE-ADMHOOK-034: copyInviteLink writes a full registration URL', async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true, configurable: true });
    const { result } = await mountAdmin();

    act(() => result.current.copyInviteLink('tok-9'));

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/register?invite=tok-9`);
    await waitFor(() => expect(toastCalls).toContainEqual({ type: 'success', message: 'Invite link copied to clipboard' }));
  });

  it('FE-ADMHOOK-035: handleEditUser seeds the edit form from the user', async () => {
    const { result } = await mountAdmin();
    const row = result.current.users[1];

    act(() => result.current.handleEditUser(row));

    expect(result.current.editingUser).toBe(row);
    expect(result.current.editForm).toEqual({
      username: 'alice',
      email: 'alice@example.com',
      role: 'user',
      password: '',
    });
  });

  it('FE-ADMHOOK-036b: handleSaveUser does nothing without a user in the editor', async () => {
    let called = false;
    server.use(
      http.put('/api/admin/users/:id', () => {
        called = true;
        return HttpResponse.json({ user: buildUser({}) });
      })
    );
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleSaveUser();
    });

    expect(called).toBe(false);
    expect(toastCalls).toEqual([]);
  });

  it('FE-ADMHOOK-036: handleSaveUser sends the trimmed fields and replaces the row', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/admin/users/:id', async ({ params, request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ user: buildUser({ id: Number(params.id), username: 'alice2' }) });
      })
    );
    const { result } = await mountAdmin();

    act(() => result.current.handleEditUser(result.current.users[1]));
    act(() => result.current.setEditForm({ username: ' alice2 ', email: ' a2@e.com ', role: 'admin', password: '' }));
    await act(async () => {
      await result.current.handleSaveUser();
    });

    expect(body).toEqual({ username: 'alice2', email: 'a2@e.com', role: 'admin' });
    expect(result.current.users[1].username).toBe('alice2');
    expect(result.current.editingUser).toBeNull();
    expect(toastCalls).toContainEqual({ type: 'success', message: 'User updated' });
  });

  it('FE-ADMHOOK-037: handleSaveUser refuses a password shorter than eight characters', async () => {
    let called = false;
    server.use(
      http.put('/api/admin/users/:id', () => {
        called = true;
        return HttpResponse.json({ user: buildUser({}) });
      })
    );
    const { result } = await mountAdmin();

    act(() => result.current.handleEditUser(result.current.users[1]));
    act(() => result.current.setEditForm({ username: 'alice', email: 'a@e.com', role: 'user', password: 'short' }));
    await act(async () => {
      await result.current.handleSaveUser();
    });

    expect(called).toBe(false);
    expect(result.current.editingUser).not.toBeNull();
    expect(toastCalls.some(c => c.type === 'error')).toBe(true);
  });

  it('FE-ADMHOOK-038: handleSaveUser forwards a long enough password', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.put('/api/admin/users/:id', async ({ params, request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ user: buildUser({ id: Number(params.id) }) });
      })
    );
    const { result } = await mountAdmin();

    act(() => result.current.handleEditUser(result.current.users[1]));
    act(() =>
      result.current.setEditForm({ username: 'alice', email: 'a@e.com', role: 'user', password: ' longenough1 ' })
    );
    await act(async () => {
      await result.current.handleSaveUser();
    });

    expect(body).toMatchObject({ password: 'longenough1' });
  });

  it('FE-ADMHOOK-039: handleSaveUser surfaces the server error', async () => {
    server.use(http.put('/api/admin/users/:id', () => HttpResponse.json({ error: 'conflict' }, { status: 409 })));
    const { result } = await mountAdmin();

    act(() => result.current.handleEditUser(result.current.users[1]));
    await act(async () => {
      await result.current.handleSaveUser();
    });

    expect(toastCalls).toContainEqual({ type: 'error', message: 'conflict' });
    expect(result.current.editingUser).not.toBeNull();
  });

  it('FE-ADMHOOK-040: handleDeleteUser refuses to delete the signed-in admin', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleDeleteUser(result.current.users[0]);
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(toastCalls).toContainEqual({ type: 'error', message: 'Cannot delete your own account' });
    expect(result.current.users).toHaveLength(2);
  });

  it('FE-ADMHOOK-041: handleDeleteUser aborts when the confirm is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleDeleteUser(result.current.users[1]);
    });

    expect(result.current.users).toHaveLength(2);
    expect(toastCalls).toEqual([]);
  });

  it('FE-ADMHOOK-042: a confirmed delete removes the user from the list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let deletedId: string | undefined;
    server.use(
      http.delete('/api/admin/users/:id', ({ params }) => {
        deletedId = params.id as string;
        return HttpResponse.json({ success: true });
      })
    );
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleDeleteUser(result.current.users[1]);
    });

    expect(deletedId).toBe('2');
    expect(result.current.users.map(u => u.username)).toEqual(['admin']);
    expect(toastCalls).toContainEqual({ type: 'success', message: 'User deleted' });
  });

  it('FE-ADMHOOK-043: a failing delete surfaces the server error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    server.use(http.delete('/api/admin/users/:id', () => HttpResponse.json({ error: 'busy' }, { status: 500 })));
    const { result } = await mountAdmin();

    await act(async () => {
      await result.current.handleDeleteUser(result.current.users[1]);
    });

    expect(toastCalls).toContainEqual({ type: 'error', message: 'busy' });
    expect(result.current.users).toHaveLength(2);
  });

  it('FE-ADMHOOK-046: opens on the tab the URL asks for', async () => {
    const { result } = await mountAdmin('/admin?tab=audit');
    expect(result.current.activeTab).toBe('audit');
  });

  /*
   * A tab id with no panel behind it — a typo, or a link from an install that
   * has tabs this one does not — used to open the page on an empty content
   * area with nothing selected in the sidebar.
   */
  it('FE-ADMHOOK-047: falls back to users when the URL names a tab that does not exist', async () => {
    const { result } = await mountAdmin('/admin?tab=nonsense');
    expect(result.current.activeTab).toBe('users');
  });

  /*
   * The sidebar entries are built conditionally but the panels are not, so a
   * hosted install had its hidden panels one URL away.
   */
  it('FE-ADMHOOK-048: refuses a tab a managed install hides', async () => {
    seedStore(useAuthStore, { isAuthenticated: true, user: me, managed: true });
    const { result } = await mountAdmin('/admin?tab=backup');
    await waitFor(() => expect(result.current.activeTab).toBe('users'));
  });

  it('FE-ADMHOOK-049: keeps that same tab on an install that runs itself', async () => {
    const { result } = await mountAdmin('/admin?tab=backup');
    expect(result.current.activeTab).toBe('backup');
  });

  it('FE-ADMHOOK-044: mcpEnabled follows the addon store', async () => {
    const { result } = await mountAdmin();

    expect(result.current.mcpEnabled).toBe(false);
    expect(result.current.hour12).toBe(false);
    expect(result.current.currentUser?.username).toBe('admin');
  });
});
