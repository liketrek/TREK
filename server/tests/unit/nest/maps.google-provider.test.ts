/**
 * GooglePlacesProvider / GooglePlacesClient: the Google half of the keyed
 * places-provider seam, on its own. The search, details and photo flows are
 * covered through MapsService in maps.service.test.ts; this pins what the
 * provider adds as a unit: the interface's reverse answer, the counted
 * transport and the credential each request carries.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GooglePlacesClient } from '../../../src/nest/maps/providers/google-places.provider';
import type { GoogleQuotaService } from '../../../src/nest/google-quota/google-quota.service';

const quota = () => ({ exhausted: vi.fn(async () => false), record: vi.fn(async () => {}) });

function client(q = quota()) {
  return { q, client: new GooglePlacesClient(q as unknown as GoogleQuotaService) };
}

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.PLACES_API_BASE;
});

describe('GooglePlacesProvider', () => {
  it('GPROV-001: is never asked to reverse-geocode, and says so with the interface miss', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { client: c } = client();
    expect(await c.provider({ key: 'k', source: 'env', userId: 1 }).reverse()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('GPROV-002: a text search sends the credential it was built with and counts the call', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ok({ places: [{ id: 'ChIJ1', displayName: { text: 'Dom' } }] }));
    vi.stubGlobal('fetch', fetchMock);
    const { q, client: c } = client();
    const places = await c.provider({ key: 'secret', source: 'instance', userId: 7 }).searchText('dom', 'de', { lat: 50, lng: 7, radius: 900000 });
    expect(places).toEqual([expect.objectContaining({ google_place_id: 'ChIJ1', name: 'Dom', source: 'google' })]);
    expect(q.record).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://places.googleapis.com/v1/places:searchText');
    expect((init?.headers as Record<string, string>)['X-Goog-Api-Key']).toBe('secret');
    // Google caps the bias circle at 50 km and answers a wider one with a 400.
    expect(JSON.parse(String(init?.body)).locationBias.circle.radius).toBe(50000);
  });

  it('GPROV-003: PLACES_API_BASE moves the call to the operator gateway, path untouched', async () => {
    process.env.PLACES_API_BASE = 'https://gateway.example.test/places///';
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ok({ editorialSummary: { text: 'Hi' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { client: c } = client();
    expect(await c.fetchEditorialSummary('ChIJ1', 'k')).toBe('Hi');
    expect(fetchMock.mock.calls[0][0]).toBe('https://gateway.example.test/places/v1/places/ChIJ1?languageCode=en');
  });

  it('GPROV-004: a details error keeps Google message and status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'API key not valid' } }), { status: 403 })));
    const { client: c } = client();
    await expect(c.provider({ key: 'k', source: null, userId: 0 }).placeDetailsExpanded('ChIJ1')).rejects.toMatchObject({
      message: 'API key not valid',
      status: 403,
    });
  });
});
