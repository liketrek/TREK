import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import {
  getWebPushConfig,
  listWebPushDevices,
  registerWebPushCurrent,
  revokeWebPushDevice,
  sendWebPushToUser,
} from '../../../src/services/webPushService';
import { createUser, setNotificationChannels } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { testDb, dbMock, generateVapidMock, generateRequestMock, safeFetchMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return {
    testDb: db,
    generateVapidMock: vi.fn(() => ({ publicKey: 'BPUBLIC', privateKey: 'PRIVATE' })),
    generateRequestMock: vi.fn((sub: { endpoint: string }, payload: string) => ({
      endpoint: sub.endpoint,
      method: 'POST',
      headers: { Authorization: 'vapid token' },
      body: Buffer.from(payload),
    })),
    safeFetchMock: vi.fn(),
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      getPlaceWithTags: () => null,
      canAccessTrip: () => null,
      isOwner: () => false,
    },
  };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
  updateJwtSecret: () => {},
}));
vi.mock('web-push', () => ({
  default: {
    generateVAPIDKeys: generateVapidMock,
    generateRequestDetails: generateRequestMock,
    setVapidDetails: vi.fn(),
  },
}));
vi.mock('../../../src/utils/ssrfGuard', () => ({
  safeFetchFollow: safeFetchMock,
}));

const subscription = {
  endpoint: 'https://push.example.test/send/one',
  expirationTime: null,
  keys: { p256dh: 'BNcR5mVzY3JpcHRpb24ta2V5', auth: 'YXV0aC1zZWNyZXQ' },
};

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  process.env.APP_URL = 'https://trek.example.test';
  delete process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  delete process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  setNotificationChannels(testDb, 'webpush');
  generateVapidMock.mockClear();
  generateRequestMock.mockClear();
  safeFetchMock.mockReset();
  safeFetchMock.mockResolvedValue({ status: 201, body: null });
});

afterAll(() => {
  delete process.env.APP_URL;
  testDb.close();
});

describe('Web Push device lifecycle', () => {
  it('returns one durable, origin-bound public VAPID configuration', () => {
    expect(getWebPushConfig()).toEqual({
      enabled: true,
      available: true,
      publicKey: 'BPUBLIC',
      canonicalOrigin: 'https://trek.example.test',
      maxDevices: 10,
    });
    expect(getWebPushConfig()).toEqual({
      enabled: true,
      available: true,
      publicKey: 'BPUBLIC',
      canonicalOrigin: 'https://trek.example.test',
      maxDevices: 10,
    });
    expect(generateVapidMock).toHaveBeenCalledTimes(1);
  });

  it('keeps remote revocation dormant until an explicit enable reactivates the installation', () => {
    const { user } = createUser(testDb);
    const input = {
      intent: 'enable' as const,
      installationId: '728f0f50-d4a7-4e8b-aaf1-e4774df6bdfa',
      label: 'Safari on iPhone',
      subscription,
    };

    expect(registerWebPushCurrent(user.id, input).state).toBe('active');
    const [device] = listWebPushDevices(user.id);
    expect(device).toMatchObject({ label: 'Safari on iPhone', installationId: input.installationId });
    const stored = testDb
      .prepare('SELECT subscription_encrypted FROM web_push_subscriptions WHERE user_id = ?')
      .get(user.id) as { subscription_encrypted: string };
    expect(stored.subscription_encrypted).toMatch(/^enc:v1:/);
    expect(stored.subscription_encrypted).not.toContain(subscription.endpoint);

    expect(revokeWebPushDevice(user.id, device!.id)).toBe(true);
    expect(listWebPushDevices(user.id)).toEqual([]);
    expect(registerWebPushCurrent(user.id, { ...input, intent: 'reconcile' }).state).toBe('revoked');
    expect(listWebPushDevices(user.id)).toEqual([]);

    expect(registerWebPushCurrent(user.id, input).state).toBe('active');
    expect(listWebPushDevices(user.id)).toHaveLength(1);
  });

  it('bounds active fan-out at ten devices', () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < 10; i++) {
      registerWebPushCurrent(user.id, {
        intent: 'enable',
        installationId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        label: `Device ${i + 1}`,
        subscription: { ...subscription, endpoint: `https://push.example.test/send/${i}` },
      });
    }
    expect(listWebPushDevices(user.id)).toHaveLength(10);
    expect(() =>
      registerWebPushCurrent(user.id, {
        intent: 'enable',
        installationId: '00000000-0000-4000-8000-000000000010',
        label: 'Device 11',
        subscription: { ...subscription, endpoint: 'https://push.example.test/send/10' },
      }),
    ).toThrow(/at most 10/);
  });

  it('moves a browser endpoint to the account that explicitly enables it', () => {
    const { user: first } = createUser(testDb);
    const { user: second } = createUser(testDb);
    registerWebPushCurrent(first.id, {
      intent: 'enable',
      installationId: '11111111-1111-4111-8111-111111111111',
      label: 'Shared browser',
      subscription,
    });
    registerWebPushCurrent(second.id, {
      intent: 'enable',
      installationId: '11111111-1111-4111-8111-111111111111',
      label: 'Shared browser',
      subscription,
    });
    expect(listWebPushDevices(first.id)).toEqual([]);
    expect(listWebPushDevices(second.id)).toHaveLength(1);
  });

  it('hides subscriptions restored under a different canonical origin', () => {
    const { user } = createUser(testDb);
    registerWebPushCurrent(user.id, {
      intent: 'enable',
      installationId: '22222222-2222-4222-8222-222222222222',
      label: 'Travel laptop',
      subscription,
    });
    process.env.APP_URL = 'https://restored.example.test';
    expect(listWebPushDevices(user.id)).toEqual([]);
  });

  it('fails closed when only one environment VAPID key is configured', () => {
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY = 'PUBLIC_ONLY';
    expect(getWebPushConfig()).toMatchObject({
      enabled: true,
      available: false,
      maxDevices: 10,
      error: expect.stringContaining('must be configured together'),
    });
  });

  it('retires a permanently gone endpoint without failing the recipient fan-out', async () => {
    const { user } = createUser(testDb);
    registerWebPushCurrent(user.id, {
      intent: 'enable',
      installationId: '33333333-3333-4333-8333-333333333333',
      label: 'Chrome on Android',
      subscription,
    });
    safeFetchMock.mockResolvedValueOnce({ status: 410, body: null });

    await expect(
      sendWebPushToUser(user.id, {
        event: 'trip_invite',
        title: 'Trip invitation',
        body: 'Sam invited you to Tokyo.',
        navigateTarget: '/trips/42',
        unreadCount: 3,
      }),
    ).resolves.toEqual({ sent: 0, failed: 0, invalid: 1 });
    expect(safeFetchMock).toHaveBeenCalledWith(subscription.endpoint, expect.objectContaining({ method: 'POST' }), {
      maxRedirects: 0,
      bypassInternalIpAllowed: true,
    });
    expect(listWebPushDevices(user.id)).toEqual([]);
  });
});
