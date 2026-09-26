// FE-STORE-AUTH-PUSH-001 to FE-STORE-AUTH-PUSH-005: where Web Push sits in the
// sign-in and sign-out sequences.
//
// Logout has to forget this device's push subscription while the session cookie
// still exists, because the DELETE that tells the server needs it and the next
// step clears it. Sign-in re-registers the subscription the device holds, in
// the background, so a slow push service can never hold a login up. The push
// module has its own spec; here it is a pair of spies, except in the one case
// that runs the real logout teardown against a session that already ran out.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../helpers/msw/server';
import { resetAllStores } from '../../helpers/store';
import { buildUser } from '../../helpers/factories';
import { useAuthStore } from '../../../src/store/authStore';

const push = vi.hoisted(() => ({
  forgetPushDeviceOnLogout: vi.fn(),
  resyncPushSubscription: vi.fn(),
}));
vi.mock('../../../src/push/webPush', () => push);

vi.mock('../../../src/sync/syncTriggers', () => ({
  registerSyncTriggers: vi.fn(),
  unregisterSyncTriggers: vi.fn(),
}));

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  push.forgetPushDeviceOnLogout.mockResolvedValue(undefined);
  push.resyncPushSubscription.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('authStore and Web Push', () => {
  it('FE-STORE-AUTH-PUSH-001: logout forgets the push device before the logout request clears the cookie', async () => {
    useAuthStore.setState({ user: buildUser(), isAuthenticated: true });
    const order: string[] = [];
    push.forgetPushDeviceOnLogout.mockImplementation(async () => {
      order.push('forget push device');
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      order.push(`fetch ${String(input)}`);
      return new Response(null, { status: 200 });
    });

    await useAuthStore.getState().logout();

    expect(fetchSpy).toHaveBeenCalled();
    expect(order).toEqual(['forget push device', 'fetch /api/auth/logout']);
  });

  it('FE-STORE-AUTH-PUSH-002: the logout request waits until the push step has finished', async () => {
    useAuthStore.setState({ user: buildUser(), isAuthenticated: true });
    let finishPush!: () => void;
    push.forgetPushDeviceOnLogout.mockReturnValue(new Promise<void>((resolve) => { finishPush = resolve; }));
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));

    const loggingOut = useAuthStore.getState().logout();
    await new Promise((r) => setTimeout(r, 10));
    expect(fetchSpy).not.toHaveBeenCalled();

    finishPush();
    await loggingOut;
    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({ method: 'POST' }));
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('FE-STORE-AUTH-PUSH-003: an expired session answers the push DELETE with 401, and logout still runs to the end', async () => {
    // The real teardown this time: its DELETE must be a plain fetch, because
    // apiClient would meet the 401 with its redirect to the login page.
    const real = await vi.importActual<typeof import('../../../src/push/webPush')>('../../../src/push/webPush');
    push.forgetPushDeviceOnLogout.mockImplementation(real.forgetPushDeviceOnLogout);
    const unsubscribe = vi.fn(async () => true);
    const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/this-device', unsubscribe };
    const registration = { pushManager: { getSubscription: vi.fn(async () => subscription) } };
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { getRegistration: vi.fn(async () => registration) },
    });
    vi.stubGlobal('PushManager', function PushManager() {});
    vi.stubGlobal('Notification', { permission: 'granted' });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      String(input) === '/api/notifications/push/subscriptions'
        ? Response.json({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, { status: 401 })
        : new Response(null, { status: 200 }),
    );
    useAuthStore.setState({ user: buildUser(), isAuthenticated: true });
    const before = window.location.href;

    try {
      await useAuthStore.getState().logout();
    } finally {
      delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker;
      vi.unstubAllGlobals();
    }

    expect(fetchSpy.mock.calls.map(([input]) => String(input))).toEqual([
      '/api/notifications/push/subscriptions',
      '/api/auth/logout',
    ]);
    expect(fetchSpy.mock.calls[0][1]).toMatchObject({ method: 'DELETE', credentials: 'include' });
    expect(unsubscribe).toHaveBeenCalled();
    expect(window.location.href).toBe(before);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('FE-STORE-AUTH-PUSH-004: a successful login re-registers this device in the background', async () => {
    const user = buildUser();
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ user, token: 'tok' })));
    // Never settles: the login must not be waiting on it.
    push.resyncPushSubscription.mockReturnValue(new Promise(() => {}));

    await useAuthStore.getState().login(user.email, 'password');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(push.resyncPushSubscription).toHaveBeenCalledTimes(1);
  });

  it('FE-STORE-AUTH-PUSH-005: a failed login does not touch push', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ error: 'Bad credentials' }, { status: 401 })));

    await expect(useAuthStore.getState().login('bad@example.com', 'wrong')).rejects.toThrow();

    expect(push.resyncPushSubscription).not.toHaveBeenCalled();
  });
});
