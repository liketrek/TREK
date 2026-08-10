/**
 * MAPS-157..170 — resolving a place's identity from a name and a coordinate.
 *
 * This is what gives a Google place its free half back: Google's payload has no
 * wiki tags, OpenStreetMap does. The two gates below are the whole safety
 * argument — a confident description of the wrong building is worse than none.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, run: () => undefined, all: () => [] }) },
}));

vi.mock('../../../src/config', () => ({ JWT_SECRET: 'test-secret', ENCRYPTION_KEY: '0'.repeat(64) }));

vi.mock('../../../src/utils/ssrfGuard', () => ({
  safeFetchFollow: vi.fn(),
  checkSsrf: vi.fn(async () => ({ allowed: true })),
  SsrfBlockedError: class extends Error {},
}));

import { db } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { toWikiLang, haversineMetres, namesOverlap } from '../../../src/nest/maps/maps.helpers';

const svcOf = () => new MapsService(new DatabaseService(db as never), {} as never);

// The Brandenburg Gate and the underground station named after it, 250m apart.
const GATE = { lat: 52.5163, lng: 13.3777 };
const hit = (over: Record<string, unknown> = {}) => ({
  osm_type: 'way',
  osm_id: '518071791',
  name: 'Brandenburger Tor',
  display_name: 'Brandenburger Tor, Pariser Platz, Berlin',
  lat: '52.5163',
  lon: '13.3777',
  importance: 0.72,
  extratags: { wikidata: 'Q82425', wikimedia_commons: 'Category:Brandenburg Gate' },
  ...over,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('toWikiLang', () => {
  it('MAPS-157: maps TREK\'s "br" to Portuguese, not Breton', () => {
    // br.wikipedia.org EXISTS and answers 200 — it is the Breton Wikipedia.
    // Passing the raw code through fails silently, in Breton.
    expect(toWikiLang('br')).toBe('pt');
  });

  it('MAPS-158: drops the region subtag, which no wiki subdomain has', () => {
    // pt-br.wikipedia.org does not resolve at all.
    expect(toWikiLang('pt-BR')).toBe('pt');
    expect(toWikiLang('zh-TW')).toBe('zh');
    expect(toWikiLang('en-US')).toBe('en');
  });

  it('MAPS-159: maps gr to el and falls back to English on nonsense', () => {
    expect(toWikiLang('gr')).toBe('el');
    expect(toWikiLang('')).toBe('en');
    expect(toWikiLang(undefined)).toBe('en');
    // Anything that is not shaped like a language code at all.
    expect(toWikiLang('deutsch')).toBe('en');
    expect(toWikiLang('12')).toBe('en');
  });
});

describe('namesOverlap', () => {
  it('MAPS-160: matches across languages on a shared substantial word', () => {
    expect(namesOverlap('Hamburg Airport', 'Flughafen Hamburg')).toBe(true);
  });

  it('MAPS-161: rejects two different places in the same area', () => {
    expect(namesOverlap('Hamburg Airport', 'Bahnhof Ohlsdorf')).toBe(false);
  });

  it('MAPS-162: ignores accents', () => {
    expect(namesOverlap('Café Zürich', 'Cafe Zurich')).toBe(true);
  });

  it('MAPS-162c: matches a name across an inflected ending', () => {
    // Live case: searching "Hamburg Airport" returns OSM's "Hamburger
    // Flughafen Helmut Schmidt". Insisting on exact words rejected the correct
    // answer over an "-er", and the airport came back with nothing at all.
    expect(namesOverlap('Hamburg Airport', 'Hamburger Flughafen Helmut Schmidt')).toBe(true);
    expect(namesOverlap('Berlin Hauptbahnhof', 'Berliner Hauptbahnhof')).toBe(true);
    // Still not a licence to match on a shared opening: the stem has to carry
    // weight and the endings have to be close.
    expect(namesOverlap('Bahn Museum', 'Bahnhofsvorplatz Kiosk')).toBe(false);
    expect(namesOverlap('Alt Museum', 'Altenpflegeheim Nord')).toBe(false);
  });

  it('MAPS-162b: will not match on a single short word', () => {
    // An article, and TREK speaks 23 languages — a stopword list for all of
    // them is its own problem, so weight decides instead.
    expect(namesOverlap('Der Kiosk', 'Der Bahnhof')).toBe(false);
    // Two short words together are evidence enough.
    expect(namesOverlap('Bar zum Tor', 'Cafe zum Tor')).toBe(true);
    // And one substantial word on its own is.
    expect(namesOverlap('Brandenburger Tor', 'Brandenburger Tor (U-Bahn)')).toBe(true);
  });
});

describe('haversineMetres', () => {
  it('MAPS-163: measures the gate to its underground station at roughly 250m', () => {
    const metres = haversineMetres(GATE.lat, GATE.lng, 52.5166047, 13.3809897);
    expect(metres).toBeGreaterThan(150);
    expect(metres).toBeLessThan(400);
  });

  it('MAPS-164: is zero for the same point', () => {
    expect(haversineMetres(GATE.lat, GATE.lng, GATE.lat, GATE.lng)).toBeCloseTo(0, 5);
  });
});

describe('resolveOsmIdentity', () => {
  it('MAPS-165: bounds the search to the area around the point', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);

    await svcOf().resolveOsmIdentity('Brandenburger Tor', GATE.lat, GATE.lng, { lang: 'de' });

    const url = decodeURIComponent(String(fetchMock.mock.calls[0][0]));
    // Without bounded+viewbox, Nominatim answers with the most famous place on
    // earth carrying this name rather than the one being looked at.
    expect(url).toContain('bounded=1');
    expect(url).toContain('viewbox=');
    expect(url).toContain('extratags=1');
  });

  it('MAPS-166: hands back the tags of the best local match', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [hit()] }));

    const out = await svcOf().resolveOsmIdentity('Brandenburger Tor', GATE.lat, GATE.lng);

    expect(out?.tags.wikidata).toBe('Q82425');
    expect(out?.osmUrl).toBe('https://www.openstreetmap.org/way/518071791');
  });

  it('MAPS-167: prefers the more important match over the merely closer one', async () => {
    // The gate and the station share a name and sit 250m apart. Distance alone
    // picks whichever the search coordinate happened to land on.
    const station = hit({
      osm_id: '3862767512',
      osm_type: 'node',
      lat: '52.5166047',
      lon: '13.3809897',
      importance: 0.41,
      extratags: { wikidata: 'Q477185' },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [station, hit()] }));

    const out = await svcOf().resolveOsmIdentity('Brandenburger Tor', 52.5166, 13.3809);

    expect(out?.tags.wikidata).toBe('Q82425');
  });

  it('MAPS-168: refuses a match too far from where we are looking', async () => {
    const faraway = hit({ lat: '48.8584', lon: '2.2945' }); // Paris
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [faraway] }));

    expect(await svcOf().resolveOsmIdentity('Brandenburger Tor', GATE.lat, GATE.lng)).toBeNull();
  });

  it('MAPS-169: refuses a match that shares no word with the name', async () => {
    // Right area, wrong building — this is the gate that stops the column
    // describing the neighbour.
    const neighbour = hit({ name: 'Hotel Adlon', display_name: 'Hotel Adlon, Berlin' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [neighbour] }));

    expect(await svcOf().resolveOsmIdentity('Brandenburger Tor', GATE.lat, GATE.lng)).toBeNull();
  });

  it('MAPS-170: survives an empty name, a bad response, a throw and a non-array body', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await svcOf().resolveOsmIdentity('', GATE.lat, GATE.lng)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => [] }));
    expect(await svcOf().resolveOsmIdentity('X Tor', GATE.lat, GATE.lng)).toBeNull();

    // Nominatim answers rate limiting in plain text, not JSON.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => 'Bandwidth limit exceeded' }));
    expect(await svcOf().resolveOsmIdentity('X Tor', GATE.lat, GATE.lng)).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect(await svcOf().resolveOsmIdentity('X Tor', GATE.lat, GATE.lng)).toBeNull();
  });
});

describe('fetchWikidataSitelinks', () => {
  it('MAPS-171: asks only for the sites it will use', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entities: { Q1097: { sitelinks: { dewiki: { title: 'Berlin Hauptbahnhof' } } } } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const out = await svcOf().fetchWikidataSitelinks('Q1097', ['dewikivoyage', 'dewiki', 'enwiki']);

    expect(decodeURIComponent(String(fetchMock.mock.calls[0][0]))).toContain('sitefilter=dewikivoyage|dewiki|enwiki');
    expect(out).toEqual({ dewiki: 'Berlin Hauptbahnhof' });
  });

  it('MAPS-172: refuses a non-Q id and an empty site list without calling out', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await svcOf().fetchWikidataSitelinks('nope', ['enwiki'])).toEqual({});
    expect(await svcOf().fetchWikidataSitelinks('Q1', [])).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('MAPS-173: yields an empty map on a bad response or a throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    expect(await svcOf().fetchWikidataSitelinks('Q1', ['enwiki'])).toEqual({});

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect(await svcOf().fetchWikidataSitelinks('Q1', ['enwiki'])).toEqual({});
  });
});
