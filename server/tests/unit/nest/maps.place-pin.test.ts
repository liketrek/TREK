/**
 * MAPS-2635-001..007: a pasted Google place link pins the place, not the camera.
 *
 * Moved out of maps.service.test.ts as they were. The other resolveGoogleMapsUrl
 * cases (coordinate extraction, short links, the SSRF guard, the ReDoS budgets)
 * stay there.
 */
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { noGoogleQuota } from '../../helpers/google-quota';
import { buildMapsService } from '../../helpers/maps-service';

import { describe, it, expect, vi, afterEach } from 'vitest';

// Short links and cid pages are followed hop by hop through the SSRF guard. Here
// every hop is let through to the stubbed fetch, which already answers with the
// resolved response.
vi.mock('../../../src/utils/ssrfGuard', () => {
  class SsrfBlockedError extends Error {}
  return {
    SsrfBlockedError,
    checkSsrf: vi.fn(async () => ({ allowed: true })),
    safeFetchFollow: vi.fn(async (url: string, init?: RequestInit) => globalThis.fetch(url, init)),
  };
});

// No key is configured: a Google link is resolved without one.
const noAppSettings = { getValue: async () => null } as unknown as AppSettingsRepository;
const noUsers = { getApiKeyColumn: async () => null } as unknown as UsersRepository;

const svc = buildMapsService(
  {} as PlacePhotoCacheService,
  noAppSettings,
  noUsers,
  {} as never,
  {} as never,
  noGoogleQuota,
);

// Nominatim stub used by resolveGoogleMapsUrl after coordinate extraction
const nominatimStub = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ display_name: 'Paris, France', name: null, address: {} }),
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// A Google place URL carries two points: @lat,lng is where the camera looks,
// !3d!4d is the place itself. Pinning the camera lands next to the place (#2635).
describe('resolveGoogleMapsUrl place pin before camera (#2635)', () => {
  // What https://maps.app.goo.gl/CdynKSHT16bufnAp9 redirects to.
  const EIFFEL_SHARE_TARGET =
    'https://www.google.com/maps/place/Tour+Eiffel/@48.8579431,2.292255,812m/data=!3m1!1e3!4m7!3m6!1s0x47e66e2964e34e2d:0x8ddca9ee380ef7e0!8m2!3d48.8583701!4d2.2944813!15sChFtYXBzIGVpZmZlbCB0b3dlcloTIhFtYXBzIGVpZmZlbCB0b3dlcpIBE2hpc3RvcmljYWxfbGFuZG1hcmuaAURDaTlEUVVsUlFVTnZaRU5vZEhsalJqbHZUMnR3VGxkWGRFaFBWM2gyVFd3NWVtTnVTalJNVlU1RVUxWm9ORTlWUlJBQuABAPoBBAgAEDg!16zL20vMDJqODE?entry=tts&g_ep=EgoyMDI2MTAwNy4wIPu8ASoASAFQAw%3D%3D&skid=20b521f5-0f45-4a02-8475-b2a1c2bdcb0b';

  const nominatimAt = (calls: string[]) =>
    vi.fn(async (u: string) => {
      calls.push(u);
      if (u.includes('goo.gl')) return { url: EIFFEL_SHARE_TARGET };
      return {
        ok: true,
        json: async () => ({ display_name: 'Avenue Gustave Eiffel, Paris', name: null, address: {} }),
      };
    });

  it('MAPS-2635-001: a place URL with both @ and !3d!4d resolves to the place, not the camera', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', nominatimAt(calls));
    const result = await svc.resolveGoogleMapsUrl(EIFFEL_SHARE_TARGET);
    expect(result.lat).toBe(48.8583701);
    expect(result.lng).toBe(2.2944813);
    expect(result.name).toBe('Tour Eiffel');
    expect(result.google_ftid).toBe('0x47e66e2964e34e2d:0x8ddca9ee380ef7e0');
    // The address is looked up at the place too.
    const reverse = calls.find((u) => u.includes('nominatim'));
    expect(reverse).toContain('lat=48.8583701');
    expect(reverse).toContain('lon=2.2944813');
  });

  it('MAPS-2635-002: the share short link resolves to the place pin', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', nominatimAt(calls));
    const result = await svc.resolveGoogleMapsUrl('https://maps.app.goo.gl/CdynKSHT16bufnAp9');
    expect(result.lat).toBe(48.8583701);
    expect(result.lng).toBe(2.2944813);
  });

  it('MAPS-2635-003: only !3d!4d still resolves', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const result = await svc.resolveGoogleMapsUrl(
      'https://www.google.com/maps/place/Tour+Eiffel/data=!4m7!3m6!8m2!3d48.8583701!4d2.2944813',
    );
    expect(result.lat).toBe(48.8583701);
    expect(result.lng).toBe(2.2944813);
  });

  it('MAPS-2635-004: only @ still resolves to the camera point', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const result = await svc.resolveGoogleMapsUrl('https://www.google.com/maps/@48.8579431,2.292255,812m');
    expect(result.lat).toBe(48.8579431);
    expect(result.lng).toBe(2.292255);
  });

  it('MAPS-2635-005: only ?q= still resolves', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const result = await svc.resolveGoogleMapsUrl('https://www.google.com/maps?q=48.8583701,2.2944813');
    expect(result.lat).toBe(48.8583701);
    expect(result.lng).toBe(2.2944813);
  });

  it('MAPS-2635-006: @ keeps its precedence over ?q= when no place pin is present', async () => {
    vi.stubGlobal('fetch', nominatimStub);
    const result = await svc.resolveGoogleMapsUrl('https://www.google.com/maps/@48.85,2.29,15z?q=40.6892,-74.0445');
    expect(result.lat).toBe(48.85);
    expect(result.lng).toBe(2.29);
  });

  it('MAPS-2635-007: a page body with both @ and !3d!4d resolves to the place', async () => {
    const fetchMock = vi.fn(async (u: string) => {
      if (u.includes('nominatim')) {
        return { ok: true, json: async () => ({ display_name: 'Paris', name: null, address: {} }) };
      }
      return {
        url: 'https://www.google.com/maps/place/Somewhere',
        text: async () => 'x/@48.8579431,2.292255,812m/y!3d48.8583701!4d2.2944813z',
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await svc.resolveGoogleMapsUrl('https://www.google.com/maps?cid=999');
    expect(result.lat).toBe(48.8583701);
    expect(result.lng).toBe(2.2944813);
  });
});
