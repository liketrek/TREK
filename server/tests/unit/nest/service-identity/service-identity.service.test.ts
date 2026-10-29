/**
 * ServiceIdentityService: what the admin card reads. A fresh allowance from
 * the issuer when it answers, the last one a liketrek answer stated when it
 * does not, nothing at all while the services are off.
 */
import { IssuerClient } from '../../../../src/nest/service-identity/issuer.client';
import { QuotaTracker } from '../../../../src/nest/service-identity/quota-tracker';
import { ServiceClock } from '../../../../src/nest/service-identity/service-clock';
import { ServiceIdentityService } from '../../../../src/nest/service-identity/service-identity.service';
import { parseServiceKey } from '../../../../src/nest/service-identity/service-key.format';
import { ServiceKeyService, type KeySnapshot } from '../../../../src/nest/service-identity/service-key.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { serviceKeyTokenFor } from '../../../helpers/service-keys';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TOKEN = serviceKeyTokenFor({ i: 'installation-a', iat: 1_793_000_000, exp: 1_800_776_000, q: 'hosted' });
const CONNECTED: KeySnapshot = { state: 'connected', key: parseServiceKey(TOKEN), source: 'registered', bearer: TOKEN };
const QUOTA = { tier: 'std', limit: 10_000, used: 250, remaining: 9_750, reset_at: 1_793_059_200, per_minute: 120 };

const keys = { snapshot: vi.fn(async (): Promise<KeySnapshot> => CONNECTED), regenerate: vi.fn(async () => undefined) };
const issuer = { quota: vi.fn() };

const testDb = createSnapshotTestDb();
let t: TestModule;
let identity: ServiceIdentityService;

beforeEach(async () => {
  vi.clearAllMocks();
  issuer.quota.mockResolvedValue({ body: QUOTA, serverMs: null });
  t = await createTestModule({
    db: testDb,
    imports: [],
    providers: [
      ServiceIdentityService,
      QuotaTracker,
      ServiceClock,
      { provide: ServiceKeyService, useValue: keys },
      { provide: IssuerClient, useValue: issuer },
    ],
  });
  identity = t.get(ServiceIdentityService);
});

afterEach(async () => {
  vi.useRealTimers();
  await t.close();
});

afterAll(() => testDb.close());

describe('ServiceIdentityService.status', () => {
  it('SISVC-001: a connected installation shows the allowance the issuer reports for its key', async () => {
    expect(await identity.status()).toEqual({
      state: 'connected',
      tier: 'std',
      keySource: 'registered',
      quota: { limit: 10_000, used: 250, remaining: 9_750, resetAt: new Date(1_793_059_200_000).toISOString() },
      lastSeenAt: null,
    });
    expect(issuer.quota).toHaveBeenCalledWith(TOKEN);
  });

  it('SISVC-002: asks the issuer once per 20 seconds, however often the card refreshes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await identity.status();
    await identity.status();
    expect(issuer.quota).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 21_000);
    await identity.status();
    expect(issuer.quota).toHaveBeenCalledTimes(2);
  });

  it('SISVC-003: falls back to the last stated allowance, then to the class in the key', async () => {
    issuer.quota.mockRejectedValue(new Error('fetch failed'));
    expect(await identity.status()).toMatchObject({ tier: 'hosted', quota: null });
    t.get(QuotaTracker).record({ tier: 'std', quota: { limit: 5, used: 1, remaining: 4, resetAt: 'x' } });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 21_000);
    expect(await identity.status()).toMatchObject({ tier: 'std', quota: { limit: 5 }, lastSeenAt: expect.any(String) });
  });

  it('SISVC-004: asks for the shared pool without a key, and asks nothing while off', async () => {
    keys.snapshot.mockResolvedValueOnce({ state: 'legacy', key: null, source: null, bearer: null });
    await identity.status();
    expect(issuer.quota).toHaveBeenCalledWith(null);

    keys.snapshot.mockResolvedValueOnce({ state: 'off', key: null, source: null, bearer: null });
    expect(await identity.status()).toEqual({
      state: 'off',
      tier: null,
      keySource: null,
      quota: null,
      lastSeenAt: null,
    });
    expect(issuer.quota).toHaveBeenCalledTimes(1);
  });

  it('SISVC-005: a new identity drops the cached allowance and answers the new status', async () => {
    await identity.status();
    keys.snapshot.mockResolvedValueOnce({ state: 'registering', key: null, source: null, bearer: null });
    const after = await identity.regenerate();
    expect(keys.regenerate).toHaveBeenCalledTimes(1);
    expect(after.state).toBe('registering');
    expect(issuer.quota).toHaveBeenLastCalledWith(null);
  });
});
