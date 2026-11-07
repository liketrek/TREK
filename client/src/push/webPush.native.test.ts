import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pushApi } from '../api/push';
import {
  NativePushDenied,
  forgetNativePush,
  nativePushActive,
  nativePushEndpoint,
  registerNativePush,
} from '../native/push';
import {
  WebPushError,
  disableWebPush,
  enableWebPush,
  forgetPushDeviceOnLogout,
  getWebPushSupport,
  readWebPushDeviceState,
} from './webPush';

vi.mock('../native/push', () => {
  class NativePushDenied extends Error {}
  return {
    NativePushDenied,
    nativePushActive: vi.fn(),
    nativePushEndpoint: vi.fn(),
    registerNativePush: vi.fn(),
    forgetNativePush: vi.fn(),
  };
});
vi.mock('../api/push', () => ({ pushApi: { subscribe: vi.fn(), unsubscribe: vi.fn(), getPublicKey: vi.fn() } }));

const SUB = { endpoint: 'https://push.liketrek.com/v1/apns/production/abcd', keys: { p256dh: 'BPk', auth: 'aa' } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(nativePushActive).mockReturnValue(true);
  vi.mocked(nativePushEndpoint).mockReturnValue(null);
  vi.mocked(registerNativePush).mockResolvedValue(SUB);
  vi.mocked(pushApi.subscribe).mockResolvedValue(undefined as never);
  vi.mocked(pushApi.unsubscribe).mockResolvedValue(undefined as never);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(null, { status: 204 }))
  );
});

describe('web push inside the app', () => {
  it('counts as supported without a service worker, and reads on or off from the remembered endpoint', async () => {
    expect(getWebPushSupport()).toEqual({ supported: true, reason: null });
    expect(await readWebPushDeviceState()).toBe('off');
    vi.mocked(nativePushEndpoint).mockReturnValue(SUB.endpoint);
    expect(await readWebPushDeviceState()).toBe('on');
  });

  it('switches on with the app subscription, and rolls it back when the server refuses', async () => {
    await enableWebPush('server-key');
    expect(pushApi.subscribe).toHaveBeenCalledWith(SUB);

    vi.mocked(pushApi.subscribe).mockRejectedValueOnce(new Error('400'));
    await expect(enableWebPush('server-key')).rejects.toBeInstanceOf(WebPushError);
    expect(forgetNativePush).toHaveBeenCalled();
  });

  it('reads a refused permission as denied', async () => {
    vi.mocked(registerNativePush).mockRejectedValue(new NativePushDenied());
    await expect(enableWebPush('server-key')).rejects.toMatchObject({ code: 'denied' });
  });

  it('switches off and forgets the device at logout through the endpoint it remembers', async () => {
    vi.mocked(nativePushEndpoint).mockReturnValue(SUB.endpoint);
    await disableWebPush();
    expect(pushApi.unsubscribe).toHaveBeenCalledWith(SUB.endpoint);
    expect(forgetNativePush).toHaveBeenCalled();

    await forgetPushDeviceOnLogout(500);
    expect(fetch).toHaveBeenCalledWith(
      '/api/notifications/push/subscriptions',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
