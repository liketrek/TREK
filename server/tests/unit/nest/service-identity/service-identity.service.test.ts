/**
 * ServiceIdentityService: what the admin card reads. A fresh allowance from
 * each liketrek host when it answers, the last one that host stated when it
 * does not, nothing at all while the services are off; and which of the
 * three services this instance asks.
 */
import { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { servicesConfig } from '../../../../src/nest/app-config/tokens';
import { IssuerClient } from '../../../../src/nest/service-identity/issuer.client';
import { QuotaTracker } from '../../../../src/nest/service-identity/quota-tracker';
import { ServiceClock } from '../../../../src/nest/service-identity/service-clock';
import { ServiceIdentityService } from '../../../../src/nest/service-identity/service-identity.service';
import { parseServiceKey } from '../../../../src/nest/service-identity/service-key.format';
import { ServiceKeyService, type KeySnapshot } from '../../../../src/nest/service-identity/service-key.service';
import { SettingsService } from '../../../../src/nest/settings/settings.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { serviceKeyTokenFor } from '../../../helpers/service-keys';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TOKEN = serviceKeyTokenFor({ i: 'installation-a', iat: 1_793_000_000, exp: 1_800_776_000, q: 'hosted' });
const CONNECTED: KeySnapshot = { state: 'connected', key: parseServiceKey(TOKEN), source: 'registered', bearer: TOKEN };
const QUOTA = { tier: 'std', limit: 10_000, used: 250, remaining: 9_750, reset_at: 1_793_059_200, per_minute: 120 };

const keys = { snapshot: vi.fn(async (): Promise<KeySnapshot> => CONNECTED), regenerate: vi.fn(async () => undefined) };
const issuer = { quota: vi.fn() };
const config = {
  mode: 'auto' as const,
  key: null,
  hosts: ['places.liketrek.com'],
  photonUrl: 'https://photon.liketrek.com',
  valhallaUrl: 'https://valhalla.liketrek.com',
};
const ALL_HOSTS = ['places.liketrek.com', 'photon.liketrek.com', 'valhalla.liketrek.com'];
const defaults = vi.fn(async (): Promise<Record<string, unknown>> => ({}));
const nominatim = { own: false };
const env = { env: () => ({ integrations: { nominatimOwn: nominatim.own } }) };
const VIEW = { limit: 10_000, used: 250, remaining: 9_750, resetAt: new Date(1_793_059_200_000).toISOString() };

const testDb = createSnapshotTestDb();
let t: TestModule;
let identity: ServiceIdentityService;

beforeEach(async () => {
  vi.clearAllMocks();
  config.hosts = ['places.liketrek.com'];
  nominatim.own = false;
  defaults.mockResolvedValue({});
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
      { provide: servicesConfig.KEY, useValue: config },
      { provide: SettingsService, useValue: { getAdminUserDefaults: defaults } },
      { provide: RuntimeEnvService, useValue: env },
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
      services: [
        { service: 'places', inUse: true, quota: VIEW },
        { service: 'photon', inUse: false, quota: null },
        { service: 'valhalla', inUse: false, quota: null },
      ],
      lastSeenAt: null,
    });
    expect(issuer.quota).toHaveBeenCalledTimes(1);
    expect(issuer.quota).toHaveBeenCalledWith('https://places.liketrek.com', TOKEN);
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
    const unanswered = await identity.status();
    expect(unanswered.tier).toBe('hosted');
    expect(unanswered.services[0]).toEqual({ service: 'places', inUse: true, quota: null });
    t.get(QuotaTracker).record('places.liketrek.com', {
      tier: 'std',
      quota: { limit: 5, used: 1, remaining: 4, resetAt: 'x' },
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 21_000);
    const remembered = await identity.status();
    expect(remembered).toMatchObject({ tier: 'std', lastSeenAt: expect.any(String) });
    expect(remembered.services[0].quota).toMatchObject({ limit: 5 });
  });

  it('SISVC-004: asks for the shared pool without a key, and asks nothing while off', async () => {
    keys.snapshot.mockResolvedValueOnce({ state: 'legacy', key: null, source: null, bearer: null });
    await identity.status();
    expect(issuer.quota).toHaveBeenCalledWith('https://places.liketrek.com', null);

    keys.snapshot.mockResolvedValueOnce({ state: 'off', key: null, source: null, bearer: null });
    expect(await identity.status()).toEqual({
      state: 'off',
      tier: null,
      keySource: null,
      services: [],
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
    expect(issuer.quota).toHaveBeenLastCalledWith('https://places.liketrek.com', null);
  });

  it('SISVC-006: never shows the key to the issuer when TREK_SERVICES_HOSTS leaves it out', async () => {
    config.hosts = ['gate.example.org'];
    const status = await identity.status();
    expect(status).toMatchObject({ state: 'connected', tier: 'hosted' });
    expect(status.services.map(({ quota }) => quota)).toEqual([null, null, null]);
    expect(issuer.quota).not.toHaveBeenCalled();
  });

  it('SISVC-007: asks each listed host for its own allowance, once per 20 seconds each', async () => {
    config.hosts = ALL_HOSTS;
    const status = await identity.status();
    expect(status.services).toEqual([
      { service: 'places', inUse: true, quota: VIEW },
      { service: 'photon', inUse: true, quota: VIEW },
      { service: 'valhalla', inUse: true, quota: VIEW },
    ]);
    expect(issuer.quota.mock.calls.map(([origin]) => origin)).toEqual([
      'https://places.liketrek.com',
      'https://photon.liketrek.com',
      'https://valhalla.liketrek.com',
    ]);
    await identity.status();
    expect(issuer.quota).toHaveBeenCalledTimes(3);
  });

  it('SISVC-008: asks Photon and Valhalla nothing without a key, since only Places has a shared pool', async () => {
    config.hosts = ALL_HOSTS;
    keys.snapshot.mockResolvedValueOnce({ state: 'legacy', key: null, source: null, bearer: null });
    const status = await identity.status();
    expect(status.services.map(({ inUse }) => inUse)).toEqual([true, false, false]);
    expect(issuer.quota).toHaveBeenCalledTimes(1);
  });

  it('SISVC-009: Photon is not in use beside an own Nominatim, the TREK Valhalla not beside another routing choice', async () => {
    config.hosts = ALL_HOSTS;
    nominatim.own = true;
    defaults.mockResolvedValue({ valhalla_base_url: 'https://valhalla.example.org' });
    const status = await identity.status();
    expect(status.services.map(({ inUse }) => inUse)).toEqual([true, false, false]);

    defaults.mockResolvedValue({ routing_base_url: 'https://osrm.example.org', routing_valhalla_provider: 'trek' });
    expect((await identity.status()).services[2].inUse).toBe(true);
  });

  it('SISVC-010: shows the last allowance a host stated while it does not answer, each host its own', async () => {
    config.hosts = ALL_HOSTS;
    issuer.quota.mockRejectedValue(new Error('fetch failed'));
    const view = { limit: 7, used: 2, remaining: 5, resetAt: 'x' };
    t.get(QuotaTracker).record('valhalla.liketrek.com', { tier: 'std', quota: view });
    const status = await identity.status();
    expect(status.services.map(({ quota }) => quota)).toEqual([null, null, view]);
    expect(status.tier).toBe('hosted');
  });
});
