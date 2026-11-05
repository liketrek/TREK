/**
 * The identity a request to a liketrek service carries, and what TREK takes
 * from the answer. The key goes to the allowlisted hosts over https and to
 * nothing else: not to a mirror of the index, not over plain http.
 */
import { servicesConfig } from '../../../../src/nest/app-config/tokens';
import { resetTrekPlacesBreaker, trekPlacesSearch } from '../../../../src/nest/maps/trek-places.client';
import { QuotaTracker } from '../../../../src/nest/service-identity/quota-tracker';
import { ServiceClock } from '../../../../src/nest/service-identity/service-clock';
import { serviceIdentitySlot } from '../../../../src/nest/service-identity/service-identity.interface';
import { ServiceKeyService } from '../../../../src/nest/service-identity/service-key.service';
import { ServiceRequestIdentity } from '../../../../src/nest/service-identity/service-request-identity';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const KEY = 'tk1.test.eyJpIjoiYSJ9.c2ln';
const PLACES = new URL('https://places.liketrek.com/v1/search?q=x');

const keys = {
  bearer: vi.fn((): string | null => KEY),
  noteAccepted: vi.fn(),
  noteInvalid: vi.fn(),
  noteRevoked: vi.fn(),
};

const testDb = createSnapshotTestDb();
let t: TestModule;
let identity: ServiceRequestIdentity;

beforeAll(async () => {
  t = await createTestModule({
    db: testDb,
    imports: [],
    providers: [
      ServiceRequestIdentity,
      QuotaTracker,
      ServiceClock,
      { provide: ServiceKeyService, useValue: keys },
      { provide: servicesConfig.KEY, useValue: { mode: 'auto', key: null, hosts: ['places.liketrek.com'] } },
    ],
  });
  identity = t.get(ServiceRequestIdentity);
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

beforeEach(() => vi.clearAllMocks());

describe('headersFor', () => {
  it('SIREQ-001: names TREK and its version on every request', () => {
    for (const url of [PLACES, new URL('https://mirror.example.org/v1/search')]) {
      expect(identity.headersFor(url)['User-Agent']).toMatch(/^TREK\/\S+ \(\+https:\/\/github\.com\/liketrek\/TREK\)$/);
    }
  });

  it('SIREQ-002: carries the key to an allowlisted host over https', () => {
    expect(identity.headersFor(PLACES).Authorization).toBe(`Bearer ${KEY}`);
  });

  it('SIREQ-003: never hands the key to another host or over plain http', () => {
    for (const url of ['https://mirror.example.org/v1/search', 'http://places.liketrek.com/v1/search']) {
      expect(identity.headersFor(new URL(url)).Authorization).toBeUndefined();
    }
    expect(keys.bearer).not.toHaveBeenCalled();
  });

  it('SIREQ-004: sends no Authorization while there is no key', () => {
    keys.bearer.mockReturnValueOnce(null);
    expect(identity.headersFor(PLACES)).not.toHaveProperty('Authorization');
  });
});

describe('observe', () => {
  const answer = (status: number, body = '{}', headers: Record<string, string> = {}) =>
    new Response(body, { status, headers });

  it('SIREQ-010: keeps the allowance the answer states and its server clock', () => {
    identity.observe(
      PLACES,
      answer(200, '{}', {
        Date: new Date(Date.now() + 120_000).toUTCString(),
        'X-TREK-Tier': 'std',
        'X-TREK-Quota-Limit': '10000',
        'X-TREK-Quota-Remaining': '9000',
        'X-TREK-Quota-Reset': '1793059200',
      }),
    );
    expect(t.get(QuotaTracker).latest('places.liketrek.com')).toMatchObject({
      tier: 'std',
      quota: { limit: 10_000, used: 1_000 },
    });
    expect(t.get(QuotaTracker).latest('valhalla.liketrek.com')).toBeNull();
    expect(t.get(ServiceClock).nowSeconds()).toBeGreaterThan(Math.floor(Date.now() / 1000) + 100);
    expect(keys.noteAccepted).toHaveBeenCalledTimes(1);
  });

  it('SIREQ-011: reports a 401 as a refused key', () => {
    identity.observe(PLACES, answer(401));
    expect(keys.noteInvalid).toHaveBeenCalledTimes(1);
  });

  it('SIREQ-012: reports a 403 as revoked only when the answer says so', async () => {
    identity.observe(PLACES, answer(403, '{"error":"not_a_trek_instance"}'));
    identity.observe(PLACES, answer(403, '{"error":"key_revoked"}'));
    await vi.waitFor(() => expect(keys.noteRevoked).toHaveBeenCalledTimes(1));
  });

  it('SIREQ-013: learns nothing from a host that is not allowlisted', () => {
    const before = t.get(QuotaTracker).newest();
    identity.observe(new URL('https://mirror.example.org/v1/search'), answer(401, '{}', { 'X-TREK-Tier': 'own' }));
    expect(keys.noteInvalid).not.toHaveBeenCalled();
    expect(t.get(QuotaTracker).newest()).toBe(before);
    expect(t.get(QuotaTracker).latest('mirror.example.org')).toBeNull();
  });
});

describe('through the Places client', () => {
  const sent: Array<{ url: string; headers: Record<string, string> }> = [];

  beforeEach(() => {
    sent.length = 0;
    resetTrekPlacesBreaker();
    serviceIdentitySlot.install(identity);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: URL, init: RequestInit) => {
        sent.push({ url: String(url), headers: init.headers as Record<string, string> });
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    serviceIdentitySlot.release(identity);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('SIREQ-020: the public index gets the key beside the instance token', async () => {
    vi.stubEnv('TREK_PLACES_URL', '');
    await trekPlacesSearch('harbour');
    expect(sent[0]?.headers).toMatchObject({ Authorization: `Bearer ${KEY}`, Accept: 'application/json' });
    expect(sent[0]?.headers['X-TREK-Instance']).toMatch(/^trek-/);
  });

  it('SIREQ-021: a mirror the operator runs never sees the key', async () => {
    vi.stubEnv('TREK_PLACES_URL', 'https://places.example.org');
    await trekPlacesSearch('harbour');
    expect(sent[0]?.url).toContain('places.example.org');
    expect(sent[0]?.headers).not.toHaveProperty('Authorization');
    expect(sent[0]?.headers['User-Agent']).toMatch(/^TREK\//);
  });
});
