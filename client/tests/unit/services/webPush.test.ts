import { beforeEach, describe, expect, it, vi } from 'vitest';

const { webPushConfigMock, webPushCurrentMock } = vi.hoisted(() => ({
  webPushConfigMock: vi.fn(),
  webPushCurrentMock: vi.fn(),
}));

vi.mock('../../../src/api/client', () => ({
  notificationsApi: {
    webPushConfig: webPushConfigMock,
    webPushCurrent: webPushCurrentMock,
  },
}));

import { detectWebPushCapability, enableWebPush } from '../../../src/services/webPush';

const subscriptionJson = {
  endpoint: 'https://push.example.test/send/device',
  expirationTime: null,
  keys: { p256dh: 'BNcR5mVzY3JpcHRpb24ta2V5', auth: 'YXV0aC1zZWNyZXQ' },
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  webPushConfigMock.mockReset();
  webPushCurrentMock.mockReset();
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(window, 'PushManager', { configurable: true, value: class PushManager {} });
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') },
  });
});

describe('direct Web Push browser lifecycle', () => {
  it('enables the current browser only after permission and registers its stable installation', async () => {
    const subscribe = vi.fn().mockResolvedValue({ toJSON: () => subscriptionJson });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({ pushManager: { getSubscription: vi.fn().mockResolvedValue(null), subscribe } }),
      },
    });
    webPushConfigMock.mockResolvedValue({
      enabled: true,
      available: true,
      publicKey: 'BPUBLIC',
      canonicalOrigin: window.location.origin,
      maxDevices: 10,
    });
    webPushCurrentMock.mockResolvedValue({ state: 'active', device: { id: 1 } });

    await expect(enableWebPush()).resolves.toMatchObject({ state: 'active' });
    expect(window.Notification.requestPermission).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
    expect(webPushCurrentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'enable',
        installationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
        subscription: subscriptionJson,
      })
    );
  });

  it('explains that iOS Safari must install the PWA before enabling push', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)',
    });
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: false });
    expect(detectWebPushCapability()).toBe('ios-install-required');
  });
});
