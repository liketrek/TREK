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

import { MapsService } from '../../../src/nest/maps/maps.service';
import { GoogleTransitProvider } from '../../../src/nest/transit/google-transit.provider';
import type { GoogleQuotaService } from '../../../src/nest/google-quota/google-quota.service';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { PlaceDetailsCacheRepository } from '../../../src/db/repositories/PlaceDetailsCache.repository';
import type { PlacesRepository } from '../../../src/db/repositories/Places.repository';

function quota(exhausted: boolean) {
  return { exhausted: vi.fn(async () => exhausted), record: vi.fn(async () => {}) };
}

/** No instance or per-user key in the store, so the operator's env key is what resolves. */
const appSettingsStub = (settings: Record<string, string> = {}) =>
  ({ getValue: async (key: string) => settings[key] ?? null }) as unknown as AppSettingsRepository;
const usersStub = { getApiKeyColumn: async () => null } as unknown as UsersRepository;

const svcWith = (q: ReturnType<typeof quota>) =>
  new MapsService(
    {} as PlacePhotoCacheService,
    appSettingsStub(),
    usersStub,
    {} as PlaceDetailsCacheRepository,
    {} as PlacesRepository,
    q as unknown as GoogleQuotaService,
  );

beforeEach(() => {
  process.env.PLACES_API_KEY = 'operator-key';
});

afterEach(() => {
  delete process.env.PLACES_API_KEY;
  vi.unstubAllGlobals();
});

describe('Google daily ceiling in MapsService', () => {
  it('MAPS-QUOTA-001: below the ceiling the key is spent as before', async () => {
    const svc = svcWith(quota(false));
    expect(await svc.getMapsKey(1)).toBe('operator-key');
    expect(await svc.keyedProvider(1)).toMatchObject({ id: 'google', key: 'operator-key' });
  });

  it('MAPS-QUOTA-002: past the ceiling there is no key and no keyed Google provider', async () => {
    const svc = svcWith(quota(true));
    expect(await svc.getMapsKey(1)).toBeNull();
    expect(await svc.keyedProvider(1)).toBeNull();
    // The settings view still learns that a key exists.
    expect((await svc.resolveMapsKey(1)).key).toBe('operator-key');
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
  it('MAPS-QUOTA-004: past the ceiling the Google transit backend is inactive', async () => {
    const settings = appSettingsStub({ transit_provider: 'google' });
    expect(await new GoogleTransitProvider(settings, usersStub, quota(false) as unknown as GoogleQuotaService).isActive(1)).toBe(true);
    expect(await new GoogleTransitProvider(settings, usersStub, quota(true) as unknown as GoogleQuotaService).isActive(1)).toBe(false);
  });
});
