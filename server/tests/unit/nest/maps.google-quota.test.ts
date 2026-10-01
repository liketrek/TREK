/**
 * MAPS-QUOTA-001..004 — the Google key reads as absent once the admin's daily
 * ceiling is reached (#1582), so search and details fall back the way a keyless
 * install does, and every call through the Places client is counted.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, run: () => undefined, all: () => [] }) },
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

import { db } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { GoogleTransitProvider } from '../../../src/nest/transit/google-transit.provider';
import type { GoogleQuotaService } from '../../../src/nest/google-quota/google-quota.service';

function quota(exhausted: boolean) {
  return { exhausted: vi.fn(() => exhausted), record: vi.fn() };
}

const svcWith = (q: ReturnType<typeof quota>) =>
  new MapsService(new DatabaseService(db as never), {} as never, q as unknown as GoogleQuotaService);

beforeEach(() => {
  process.env.PLACES_API_KEY = 'operator-key';
});

afterEach(() => {
  delete process.env.PLACES_API_KEY;
  vi.unstubAllGlobals();
});

describe('Google daily ceiling in MapsService', () => {
  it('MAPS-QUOTA-001: below the ceiling the key is spent as before', () => {
    const svc = svcWith(quota(false));
    expect(svc.getMapsKey(1)).toBe('operator-key');
    expect(svc.keyedProvider(1)).toMatchObject({ id: 'google', key: 'operator-key' });
  });

  it('MAPS-QUOTA-002: past the ceiling there is no key and no keyed Google provider', () => {
    const svc = svcWith(quota(true));
    expect(svc.getMapsKey(1)).toBeNull();
    expect(svc.keyedProvider(1)).toBeNull();
    // The settings view still learns that a key exists.
    expect(svc.resolveMapsKey(1).key).toBe('operator-key');
  });

  it('MAPS-QUOTA-003: every Places call is counted against the day', async () => {
    const q = quota(false);
    const svc = svcWith(q);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ editorialSummary: { text: 'Hi' } }), { status: 200 })));
    await svc.fetchEditorialSummary('ChIJ1', 'key');
    expect(q.record).toHaveBeenCalledTimes(1);
  });
});

describe('Google daily ceiling in the transit provider', () => {
  it('MAPS-QUOTA-004: past the ceiling the Google transit backend is inactive', () => {
    const stubDb = { get: () => ({ value: 'google' }) } as unknown as DatabaseService;
    expect(new GoogleTransitProvider(stubDb, quota(false) as unknown as GoogleQuotaService).isActive(1)).toBe(true);
    expect(new GoogleTransitProvider(stubDb, quota(true) as unknown as GoogleQuotaService).isActive(1)).toBe(false);
  });
});
