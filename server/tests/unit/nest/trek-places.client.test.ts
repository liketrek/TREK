/**
 * The TREK Places client: what it sends, what it refuses, and how it maps an
 * answer onto the record shape the rest of TREK already reads.
 *
 * fetch is stubbed rather than hit: the point is the contract, and a unit test
 * that depends on a live service tells you about the service.
 */
import {
  DEFAULT_TREK_PLACES_URL,
  POI_CATEGORY_TO_TREK,
  indexRowTerm,
  toPlaceRecord,
  trekPlacesArea,
  trekPlacesBaseUrl,
  trekPlacesById,
  trekPlacesHighlights,
  trekPlacesMiss,
  trekPlacesNearby,
  trekPlacesRoutes,
  trekPlacesSearch,
  trekPlacesWays,
  resetTrekPlacesBreaker,
  serviceLang,
  type TrekPlace,
} from '../../../src/nest/maps/trek-places.client';
import { serviceIdentitySlot } from '../../../src/nest/service-identity/service-identity.interface';
import { oneByOne } from '../../helpers/one-by-one';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mutable, so the instance URL and the operator's own index can be set per test.
const { env } = vi.hoisted(() => ({
  env: {
    maps: { trekPlacesUrl: '', trekPlacesEnabled: true },
    app: { appUrl: 'https://trip.example.org', port: 3001 },
    http: { allowedOriginsRaw: '' },
  },
}));

// getAppUrl is the real resolution chain, reproduced here rather than stubbed
// to a constant: the instance token depends on the whole chain, and the case
// that matters is the one where APP_URL is unset — the shipped compose file
// leaves it commented out, so that is the default install, not an edge case.
vi.mock('../../../src/app-config', () => ({
  readEnv: () => env,
  getAppUrl: () => {
    const strip = (v: string) => v.replace(/\/+$/, '');
    if (env.app.appUrl) {
      try {
        new URL(env.app.appUrl);
        return strip(env.app.appUrl);
      } catch {
        /* fall through */
      }
    }
    const first = env.http.allowedOriginsRaw.split(',')[0]?.trim();
    if (first) {
      try {
        new URL(first);
        return strip(first);
      } catch {
        /* fall through */
      }
    }
    return `http://localhost:${env.app.port}`;
  },
}));

const PLACE: TrekPlace = {
  gers: 'abc-123',
  name: "L'Osteria",
  lat: 54.0879,
  lng: 12.1408,
  category: 'restaurant',
  categoryPath: 'eat_and_drink>restaurant',
  confidence: 1,
  address: { freeform: 'Steinstrasse 9', locality: 'Rostock', postcode: '18055', region: 'MV', country: 'DE' },
  contact: { website: 'https://losteria.net/', phone: '+49381', email: 'r@losteria.de', socials: null },
  brand: { name: "L'Osteria", wikidata: 'Q123' },
  source: 'overture',
  hours: null,
};

const BOX = { minLat: 54, minLng: 12, maxLat: 54.2, maxLng: 12.3 };

let calls: { url: string; init?: RequestInit }[] = [];

function stubFetch(body: unknown, status = 200) {
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: URL | string, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return {
        ok: status >= 200 && status < 300,
        status,
        body: null,
        text: async () => JSON.stringify(body),
      } as unknown as Response;
    }),
  );
}

const encoder = new TextEncoder();
let streamCancelled = false;

// The same stub with a real body stream, so the capped reader runs instead of
// res.text(). text() throws here to prove which arm was taken.
function stubStreamingFetch(chunks: (string | Uint8Array)[], status = 200) {
  calls = [];
  streamCancelled = false;
  const queue = chunks.map((c) => (typeof c === 'string' ? encoder.encode(c) : c));
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: URL | string, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return {
        ok: status >= 200 && status < 300,
        status,
        body: new ReadableStream<Uint8Array>({
          pull(controller) {
            const next = queue.shift();
            if (next) controller.enqueue(next);
            else controller.close();
          },
          cancel() {
            streamCancelled = true;
          },
        }),
        text: async () => {
          throw new Error('read the stream, not text()');
        },
      } as unknown as Response;
    }),
  );
}

beforeEach(() => {
  calls = [];
  // Process state, so it leaks between cases unless it is cleared.
  resetTrekPlacesBreaker();
  env.maps.trekPlacesUrl = '';
  env.maps.trekPlacesEnabled = true;
  env.app.appUrl = 'https://trip.example.org';
  env.app.port = 3001;
  env.http.allowedOriginsRaw = '';
  // Nothing in this file may reach the real service: a test that forgets to
  // stub gets a thrown request rather than a request.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('unstubbed fetch');
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('trekPlacesBaseUrl', () => {
  it('falls back to the public instance when nothing is configured', () => {
    expect(trekPlacesBaseUrl()).toBe(DEFAULT_TREK_PLACES_URL);
  });

  it('uses the operator own copy when one is configured', () => {
    env.maps.trekPlacesUrl = 'https://places.example.net';
    expect(trekPlacesBaseUrl()).toBe('https://places.example.net');
  });

  it('strips trailing slashes rather than doubling them into the path', () => {
    env.maps.trekPlacesUrl = 'https://places.example.net//';
    expect(trekPlacesBaseUrl()).toBe('https://places.example.net');
  });

  it('treats a blank setting as unconfigured', () => {
    env.maps.trekPlacesUrl = '   ';
    expect(trekPlacesBaseUrl()).toBe(DEFAULT_TREK_PLACES_URL);
  });

  it('sends the request to the configured host, not the public one', async () => {
    env.maps.trekPlacesUrl = 'https://places.example.net/';
    stubFetch({ query: 'x', results: [] });
    await trekPlacesSearch('x');
    const url = new URL(calls[0].url);
    expect(url.origin).toBe('https://places.example.net');
    expect(url.pathname).toBe('/v1/search');
  });
});

describe('trekPlacesSearch', () => {
  it('sends the query, the bias and a limit', async () => {
    stubFetch({ query: 'x', results: [PLACE] });
    const found = await trekPlacesSearch('losteria', { lat: 54.1, lng: 12.1, limit: 5 });
    expect(found).toHaveLength(1);
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe('/v1/search');
    expect(url.searchParams.get('q')).toBe('losteria');
    expect(url.searchParams.get('lat')).toBe('54.1');
    expect(url.searchParams.get('limit')).toBe('5');
  });

  it('identifies the instance without identifying a person', async () => {
    stubFetch({ query: 'x', results: [] });
    await trekPlacesSearch('x');
    const headers = calls[0].init?.headers as Record<string, string>;
    const token = headers['X-TREK-Instance'];
    // Stable, opaque, and derived from the instance URL rather than a user or
    // an install id: it exists so one caller cannot exhaust everyone's limit.
    expect(token).toMatch(/^trek-[a-z0-9]+$/);
    expect(token).not.toContain('example.org');
  });

  it('names one instance the same way twice, and another instance differently', async () => {
    const token = async () => {
      stubFetch({ query: 'x', results: [] });
      await trekPlacesSearch('x');
      return (calls[0].init?.headers as Record<string, string>)['X-TREK-Instance'];
    };
    const configured = await token();
    // Derived from the URL, not generated: a token that changed per call would
    // hand the same instance a fresh rate-limit budget on every request.
    expect(await token()).toBe(configured);
    env.app.appUrl = '';
    const unconfigured = await token();
    expect(unconfigured).toMatch(/^trek-[a-z0-9]+$/);
    // Two instances the far side must be able to tell apart for its rate limit.
    expect(unconfigured).not.toBe(configured);
  });

  it('tells two unconfigured instances apart, which is the default install', async () => {
    // APP_URL is commented out in the shipped compose file, so "unset" is the
    // ordinary case rather than the odd one. Reading it raw gave every such
    // install the same token, and a token every caller shares is not a caller:
    // one instance running a large import would rate-limit all the others,
    // who would fall back to Nominatim with nothing to point at.
    const token = async () => {
      stubFetch({ query: 'x', results: [] });
      await trekPlacesSearch('x');
      return (calls[0].init?.headers as Record<string, string>)['X-TREK-Instance'];
    };

    env.app.appUrl = '';
    env.http.allowedOriginsRaw = 'https://a.example.net';
    const viaOrigins = await token();

    env.http.allowedOriginsRaw = 'https://b.example.net';
    expect(await token()).not.toBe(viaOrigins);

    // And with nothing at all, the port still separates two instances on one host.
    env.http.allowedOriginsRaw = '';
    env.app.port = 3001;
    const onDefaultPort = await token();
    env.app.port = 8080;
    expect(await token()).not.toBe(onDefaultPort);
  });

  it('omits parameters that were not given rather than sending empties', async () => {
    stubFetch({ query: 'x', results: [] });
    await trekPlacesSearch('x');
    const url = new URL(calls[0].url);
    expect(url.searchParams.has('lat')).toBe(false);
    expect(url.searchParams.has('lng')).toBe(false);
  });

  it('throws on an error status so the caller can fall back', async () => {
    stubFetch({}, 503);
    await expect(trekPlacesSearch('x')).rejects.toThrow(/503/);
  });

  it('survives a malformed results field', async () => {
    stubFetch({ query: 'x', results: 'not an array' });
    await expect(trekPlacesSearch('x')).resolves.toEqual([]);
  });
});

describe('the reader language (#2592)', () => {
  it('sends TREK codes as the tags the service reads, and nothing it would refuse', () => {
    expect(serviceLang('de')).toBe('de');
    // Brazilian Portuguese and Greek have codes of their own in TREK.
    expect(serviceLang('br')).toBe('pt-BR');
    expect(serviceLang('gr')).toBe('el');
    // Passed as it is: the service maps a region onto the script OSM keys by.
    expect(serviceLang('zh-TW')).toBe('zh-TW');
    expect(serviceLang(undefined)).toBeUndefined();
    expect(serviceLang('  ')).toBeUndefined();
    expect(serviceLang('not a locale!')).toBeUndefined();
  });

  it('asks search, nearby and the place lookup in it', async () => {
    stubFetch({ query: 'x', results: [], place: PLACE });
    await trekPlacesSearch('x', { lang: 'br' });
    await trekPlacesNearby(54.1, 12.1, { lang: 'gr' });
    await trekPlacesById('abc-123', { lang: 'ja' });
    expect(calls.map((c) => new URL(c.url).searchParams.get('lang'))).toEqual(['pt-BR', 'el', 'ja']);
  });

  it('leaves the parameter off without a language, so the answer is the one it always was', async () => {
    stubFetch({ query: 'x', results: [], place: PLACE, count: 0 });
    await trekPlacesSearch('x');
    await trekPlacesNearby(54.1, 12.1);
    await trekPlacesById('abc-123');
    await trekPlacesSearch('x', { lang: 'not a locale!' });
    await trekPlacesArea(BOX);
    expect(calls.every((c) => !new URL(c.url).searchParams.has('lang'))).toBe(true);
  });

  it('keeps a layer row locality only when it is a name', async () => {
    const osm = (locality: unknown) => ({
      id: 'osm:node/1',
      osm_type: 'node',
      osm_id: 1,
      name: 'Kirby Cafe',
      local_name: 'カービィカフェ',
      lat: 35.71,
      lng: 139.81,
      category: null,
      source: 'openstreetmap',
      locality,
    });
    stubFetch({ query: 'x', results: [osm(' Sumida '), osm(''), osm(42), osm(null), { ...PLACE }] });

    const found = await trekPlacesSearch('x', { lang: 'en', sources: 'index,osm' });

    expect(found.map((h) => ('locality' in h ? h.locality : 'index row'))).toEqual([
      'Sumida',
      null,
      null,
      null,
      'index row',
    ]);
    // A row the service sent without the field, which is every row asked
    // without a language, is left without it.
    stubFetch({ query: 'x', results: [{ ...osm(null), locality: undefined }] });
    expect((await trekPlacesSearch('x'))[0]).not.toHaveProperty('locality');
  });
});

describe('reading the body', () => {
  // One buffer, handed out more than once: two of them are already over the cap.
  const BIG = new Uint8Array(600_000);

  it('assembles an answer that arrives in pieces', async () => {
    const payload = JSON.stringify({ query: 'x', results: [{ ...PLACE, name: 'Café Kröpeliner' }] });
    const bytes = encoder.encode(payload);
    // Cut between the two bytes of the é: decoding chunk by chunk would leave a
    // replacement character where the name is.
    const cut = bytes.indexOf(0xc3) + 1;
    stubStreamingFetch([bytes.slice(0, cut), bytes.slice(cut)]);
    const found = await trekPlacesSearch('cafe');
    expect(found[0].name).toBe('Café Kröpeliner');
  });

  it('refuses a body past the megabyte cap instead of buffering it', async () => {
    // The first chunk is under the cap, the second takes it over.
    stubStreamingFetch([BIG, BIG]);
    await expect(trekPlacesSearch('x')).rejects.toThrow('TREK Places API response too large');
  });

  it('drops the connection instead of draining the rest of an oversized body', async () => {
    // A third chunk nobody reads: the cap trips while the body is still running,
    // which is the case that has a connection left to drop. Cancelling a stream
    // that already ended is a no-op and would assert nothing.
    stubStreamingFetch([BIG, BIG, BIG]);
    await expect(trekPlacesSearch('x')).rejects.toThrow('TREK Places API response too large');
    expect(streamCancelled).toBe(true);
  });

  it('gives the area download a budget that follows the rows it asked for', async () => {
    // The search cap is a megabyte because a search answer is a few kB. The area
    // download is the one call that is neither: it asks for thousands of rows at
    // once for the offline cache, and a city-sized answer sits right on that
    // megabyte. Holding it to the search budget threw, the caller could only
    // report "index unavailable", and the trip went offline with nothing cached.
    // A real answer, just a big one: 1200 rows of a padded name puts the body
    // comfortably past the megabyte the search path would refuse.
    const pad = 'x'.repeat(1000);
    const rows = Array.from({ length: 1200 }, (_, i) => ({ ...PLACE, gers: `row-${i}`, name: pad }));
    const payload = JSON.stringify({ count: rows.length, truncated: false, results: rows });
    expect(payload.length).toBeGreaterThan(1_000_000);
    stubStreamingFetch([encoder.encode(payload)]);
    const area = await trekPlacesArea(BOX, 3000);
    expect(area.results).toHaveLength(1200);
    expect(streamCancelled).toBe(false);
  });

  it('still caps the area download, at the budget its own limit buys', async () => {
    // Not unbounded — a hostile or broken upstream must not be able to hand the
    // instance an endless body just because the path is the bulk one.
    stubStreamingFetch(Array.from({ length: 8 }, () => BIG));
    await expect(trekPlacesArea(BOX, 1)).rejects.toThrow('TREK Places API response too large');
    expect(streamCancelled).toBe(true);
  });
});

describe('the circuit breaker', () => {
  const BIG_BODY = new Uint8Array(600_000);

  // Every call site here sits in front of something a person is waiting for and
  // falls back to the old path when the index fails — but it pays the timeout
  // first, every time. On an instance that cannot reach the service at all,
  // that is 3.5 s per keystroke of autocomplete, and over a hundred seconds for
  // a ten-venue booking import.

  it('stops dialling out after a few consecutive failures', async () => {
    stubFetch({}, 503);
    for (let i = 0; i < 4; i++) {
      await expect(trekPlacesSearch('x')).rejects.toThrow();
    }
    const dialled = calls.length;

    // The next call must not reach the network at all.
    await expect(trekPlacesSearch('x')).rejects.toThrow('unreachable, not retrying yet');
    expect(calls.length).toBe(dialled);
  });

  it('tries again once the cooldown is over', async () => {
    vi.useFakeTimers();
    try {
      stubFetch({}, 503);
      for (let i = 0; i < 4; i++) await expect(trekPlacesSearch('x')).rejects.toThrow();
      const dialled = calls.length;
      await expect(trekPlacesSearch('x')).rejects.toThrow('unreachable');
      expect(calls.length).toBe(dialled);

      vi.advanceTimersByTime(60_000);
      stubFetch({ query: 'x', results: [PLACE] });
      await expect(trekPlacesSearch('x')).resolves.toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('an answer clears the count, so scattered failures never open it', async () => {
    for (let i = 0; i < 20; i++) {
      stubFetch({}, 503);
      await expect(trekPlacesSearch('x')).rejects.toThrow(/503/);
      stubFetch({ query: 'x', results: [] });
      await expect(trekPlacesSearch('x')).resolves.toEqual([]);
    }
    // Still dialling: the failures never ran consecutively.
    stubFetch({}, 503);
    await expect(trekPlacesSearch('x')).rejects.toThrow(/503/);
  });

  it('a 404 is an answer, not an outage', async () => {
    // "No such place" says the service is there and working. Counting it would
    // open the breaker for a caller who asked about places that do not exist.
    for (let i = 0; i < 10; i++) {
      stubFetch({}, 404);
      await expect(trekPlacesById('nope')).resolves.toBeNull();
    }
    stubFetch({ place: PLACE });
    await expect(trekPlacesById('abc-123')).resolves.toMatchObject({ gers: 'abc-123' });
  });

  it('an oversized body is an answer too', async () => {
    // The service replied, and replied too much. That is a bug upstream, not a
    // reason to stop asking — and the caller already falls back for this one.
    for (let i = 0; i < 10; i++) {
      stubStreamingFetch([BIG_BODY, BIG_BODY]);
      await expect(trekPlacesSearch('x')).rejects.toThrow('too large');
    }
    stubFetch({ query: 'x', results: [PLACE] });
    await expect(trekPlacesSearch('x')).resolves.toHaveLength(1);
  });

  it('a refused or revoked installation key is an answer, a 429 is not', async () => {
    // A 401 or 403 says the service is there and judged the key; the identity
    // falls back to the shared pool on its own. A 429 means the next request
    // costs the same and gets the same, like a server error.
    for (const status of [401, 403]) {
      for (let i = 0; i < 6; i++) {
        stubFetch({}, status);
        await expect(trekPlacesSearch('x')).rejects.toThrow(String(status));
      }
    }
    stubFetch({}, 429);
    for (let i = 0; i < 4; i++) await expect(trekPlacesSearch('x')).rejects.toThrow(/429/);
    await expect(trekPlacesSearch('x')).rejects.toThrow('unreachable, not retrying yet');
  });
});

describe('the installation identity', () => {
  it('takes the headers from the identity port on every request and shows it every answer', async () => {
    const seen: string[] = [];
    const port = {
      headersFor: vi.fn(() => ({ 'User-Agent': 'TREK/test', Authorization: 'Bearer installation-key' })),
      observe: vi.fn((url: URL) => {
        seen.push(url.pathname);
      }),
    };
    serviceIdentitySlot.install(port);
    try {
      stubFetch({ query: 'x', results: [] });
      await trekPlacesSearch('x');
      expect(calls[0].init?.headers).toMatchObject({
        Accept: 'application/json',
        'X-TREK-Instance': expect.stringMatching(/^trek-/),
        'User-Agent': 'TREK/test',
        Authorization: 'Bearer installation-key',
      });
      expect(port.headersFor).toHaveBeenCalledWith(expect.any(URL));
      expect(seen).toEqual(['/v1/search']);
    } finally {
      serviceIdentitySlot.release(port);
    }
  });

  it('asks once more through the shared pool when the key is refused, and shows the identity only the refusal', async () => {
    const port = {
      headersFor: vi.fn(() => ({ 'User-Agent': 'TREK/test', Authorization: 'Bearer installation-key' })),
      observe: vi.fn(),
    };
    serviceIdentitySlot.install(port);
    try {
      calls = [];
      let answered = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: URL | string, init?: RequestInit) => {
          calls.push({ url: String(url), init });
          answered += 1;
          const status = answered === 1 ? 401 : 200;
          return {
            ok: status === 200,
            status,
            body: null,
            text: async () => JSON.stringify({ query: 'x', results: [PLACE] }),
          } as unknown as Response;
        }),
      );
      await expect(trekPlacesSearch('x')).resolves.toHaveLength(1);
      expect(calls).toHaveLength(2);
      expect(calls[1].init?.headers).not.toHaveProperty('Authorization');
      expect(calls[1].init?.headers).toMatchObject({ 'User-Agent': 'TREK/test' });
      expect(port.observe).toHaveBeenCalledTimes(1);
      expect(port.observe.mock.calls[0][1]).toMatchObject({ status: 401 });
    } finally {
      serviceIdentitySlot.release(port);
    }
  });

  it('sends what it always sent while no identity is installed', async () => {
    stubFetch({ query: 'x', results: [] });
    await trekPlacesSearch('x');
    expect(Object.keys(calls[0].init?.headers ?? {}).sort()).toEqual(['Accept', 'X-TREK-Instance']);
  });
});

describe('getJson request shape', () => {
  it('carries an abort signal on every call, and aborts when the answer never comes', async () => {
    // The repo rule is that no outbound fetch runs without a timeout. Nothing
    // asserted the signal before, so removing it would not have failed a test.
    vi.useFakeTimers();
    try {
      calls = [];
      vi.stubGlobal(
        'fetch',
        vi.fn((url: URL | string, init?: RequestInit) => {
          calls.push({ url: String(url), init });
          // Answers only when the caller gives up.
          return new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }) as Promise<Response>;
        }),
      );

      const pending = trekPlacesSearch('never answered');
      const failed = expect(pending).rejects.toThrow('aborted');
      expect(calls[0].init?.signal).toBeInstanceOf(AbortSignal);
      expect(calls[0].init?.signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(3500);
      expect(calls[0].init?.signal?.aborted).toBe(true);
      await failed;
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets the area download run longer than a keystroke would', async () => {
    // The search timeout sits in front of a keystroke. The offline prefetch is a
    // background bulk download that nobody is watching, and 3.5 s is not enough
    // to move thousands of rows — it would abort mid-body and cache nothing.
    vi.useFakeTimers();
    try {
      calls = [];
      vi.stubGlobal(
        'fetch',
        vi.fn((url: URL | string, init?: RequestInit) => {
          calls.push({ url: String(url), init });
          return new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          }) as Promise<Response>;
        }),
      );

      const pending = trekPlacesArea(BOX, 3000);
      const failed = expect(pending).rejects.toThrow('aborted');
      await vi.advanceTimersByTimeAsync(3500);
      expect(calls[0].init?.signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(20_000);
      expect(calls[0].init?.signal?.aborted).toBe(true);
      await failed;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('trekPlacesById', () => {
  it('returns null for a place that does not exist instead of throwing', async () => {
    stubFetch({}, 404);
    await expect(trekPlacesById('nope')).resolves.toBeNull();
  });

  it('lets other failures through', async () => {
    stubFetch({}, 500);
    await expect(trekPlacesById('x')).rejects.toThrow();
  });

  it('escapes the id into the path', async () => {
    stubFetch({ place: PLACE });
    await trekPlacesById('a/b c');
    expect(calls[0].url).toContain('/v1/place/a%2Fb%20c');
  });
});

describe('the switch', () => {
  it('lets nothing leave once the operator turned the index off, a lookup by id included', async () => {
    // TREK_PLACES_ENABLED=false is a promise about egress. The service checks
    // it before each call it makes; this is the one place every request passes,
    // so a caller that did not is stopped here rather than at the firewall.
    env.maps.trekPlacesEnabled = false;
    stubFetch({ place: PLACE });

    await expect(trekPlacesById('abc-123')).rejects.toThrow('switched off');
    await expect(trekPlacesSearch('osteria')).rejects.toThrow('switched off');
    await expect(trekPlacesNearby(54, 12)).rejects.toThrow('switched off');
    await expect(trekPlacesArea(BOX)).rejects.toThrow('switched off');
    expect(calls).toEqual([]);
  });

  it('is not an outage: the refusal never opens the breaker', async () => {
    env.maps.trekPlacesEnabled = false;
    for (let i = 0; i < 6; i++) await trekPlacesById('abc-123').catch(() => null);

    env.maps.trekPlacesEnabled = true;
    stubFetch({ place: PLACE });
    await expect(trekPlacesById('abc-123')).resolves.toEqual(PLACE);
    expect(calls).toHaveLength(1);
  });
});

describe('trekPlacesNearby', () => {
  it('rounds the radius and passes the category list through', async () => {
    stubFetch({ results: [] });
    await trekPlacesNearby(54.1, 12.1, { radius: 812.7, category: 'cafe,coffee_shop' });
    const url = new URL(calls[0].url);
    expect(url.searchParams.get('radius')).toBe('813');
    expect(url.searchParams.get('category')).toBe('cafe,coffee_shop');
  });

  it('asks 1500m and 50 rows when the caller says nothing', async () => {
    stubFetch({ results: [] });
    await trekPlacesNearby(54.1, 12.1);
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe('/v1/nearby');
    expect(url.searchParams.get('radius')).toBe('1500');
    expect(url.searchParams.get('limit')).toBe('50');
    expect(url.searchParams.has('category')).toBe(false);
  });

  it('lets the caller ask for a smaller circle and fewer rows', async () => {
    stubFetch({ results: [] });
    await trekPlacesNearby(54.1, 12.1, { radius: 300, limit: 5 });
    const url = new URL(calls[0].url);
    expect(url.searchParams.get('radius')).toBe('300');
    expect(url.searchParams.get('limit')).toBe('5');
  });

  it('passes the distance the index measured through', async () => {
    stubFetch({ results: [{ ...PLACE, distanceMetres: 12 }] });
    const out = await trekPlacesNearby(54.1, 12.1);
    expect(out).toHaveLength(1);
    expect(out[0].distanceMetres).toBe(12);
  });

  it('survives a malformed results field', async () => {
    stubFetch({ results: { 0: PLACE } });
    await expect(trekPlacesNearby(54.1, 12.1)).resolves.toEqual([]);
  });
});

describe('trekPlacesHighlights', () => {
  const SQUARE = {
    osmType: 'way',
    osmId: 4_567,
    name: 'Piazza San Marco',
    lat: 45.4341,
    lng: 12.3388,
    category: 'sehenswuerdigkeit',
    osmTag: 'place=square',
    wikidata: 'Q190092',
    qrank: 912_345,
    distanceMetres: 42,
  };

  it('TREK-PLACES-HL-01: asks /v1/highlights around a point in the reader language and reads its rows', async () => {
    stubFetch({ highlights: [SQUARE], qrankRelease: '2026-10-01' });
    const out = await trekPlacesHighlights(45.434, 12.338, { radius: 812.6, limit: 12, lang: 'de' });
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe('/v1/highlights');
    expect(url.searchParams.get('lat')).toBe('45.434');
    expect(url.searchParams.get('lng')).toBe('12.338');
    expect(url.searchParams.get('radius')).toBe('813');
    expect(url.searchParams.get('limit')).toBe('12');
    expect(url.searchParams.get('lang')).toBe('de');
    expect(out).toEqual({ highlights: [SQUARE], qrankRelease: '2026-10-01' });
  });

  it('TREK-PLACES-HL-02: keeps every request inside the bounds the service takes, and asks nothing for no coordinate', async () => {
    stubFetch({ highlights: [] });
    await trekPlacesHighlights(45.4, 12.3);
    await trekPlacesHighlights(45.4, 12.3, { radius: 1, limit: 0 });
    await trekPlacesHighlights(45.4, 12.3, { radius: 90_000, limit: 500 });
    await trekPlacesHighlights(45.4, 12.3, { radius: Number.NaN, limit: Number.POSITIVE_INFINITY });
    const asked = calls.map((call) => new URL(call.url).searchParams);
    expect(asked.map((params) => [params.get('radius'), params.get('limit')])).toEqual([
      ['1000', '30'],
      ['10', '1'],
      ['20000', '100'],
      ['10', '1'],
    ]);
    expect(asked[0]?.has('lang')).toBe(false);
    await expect(trekPlacesHighlights(Number.NaN, 12.3)).resolves.toEqual({ highlights: [], qrankRelease: null });
    await expect(trekPlacesHighlights(91, 12.3)).resolves.toEqual({ highlights: [], qrankRelease: null });
    expect(calls).toHaveLength(4);
  });

  it('TREK-PLACES-HL-03: drops a row of another shape on its own, and reads an old layer without ranks as none', async () => {
    stubFetch({
      highlights: [SQUARE, { ...SQUARE, osmId: 5, wikidata: 'L12' }, { ...SQUARE, osmId: 6, qrank: -1 }, 'row'],
      qrankRelease: 20261001,
    });
    expect(await trekPlacesHighlights(45.4, 12.3)).toEqual({ highlights: [SQUARE], qrankRelease: null });
    stubFetch({ highlights: { 0: SQUARE } });
    expect(await trekPlacesHighlights(45.4, 12.3)).toEqual({ highlights: [], qrankRelease: null });
    stubFetch(null);
    expect(await trekPlacesHighlights(45.4, 12.3)).toEqual({ highlights: [], qrankRelease: null });
  });

  it('TREK-PLACES-HL-04: throws on an error status and when the index is switched off, so the caller goes on without', async () => {
    stubFetch({}, 503);
    await expect(trekPlacesHighlights(45.4, 12.3)).rejects.toThrow('TREK Places API 503');
    env.maps.trekPlacesEnabled = false;
    await expect(trekPlacesHighlights(45.4, 12.3)).rejects.toThrow('switched off');
    expect(calls).toHaveLength(1);
  });

  it('TREK-PLACES-HL-05: a service older than the endpoint answers 404, read as no highlights', async () => {
    stubFetch({}, 404);
    await expect(trekPlacesHighlights(45.4, 12.3)).resolves.toEqual({ highlights: [], qrankRelease: null });
  });
});

describe('trekPlacesArea', () => {
  it('sends the whole box and caps the rows at 2000', async () => {
    stubFetch({ count: 1, truncated: false, results: [PLACE] });
    await trekPlacesArea(BOX);
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe('/v1/bbox');
    expect(url.searchParams.get('minLat')).toBe('54');
    expect(url.searchParams.get('minLng')).toBe('12');
    expect(url.searchParams.get('maxLat')).toBe('54.2');
    expect(url.searchParams.get('maxLng')).toBe('12.3');
    expect(url.searchParams.get('limit')).toBe('2000');
  });

  it('sends the caller own cap when one is given', async () => {
    stubFetch({ count: 0, truncated: false, results: [] });
    await trekPlacesArea(BOX, 500);
    expect(new URL(calls[0].url).searchParams.get('limit')).toBe('500');
  });

  it('keeps an edge on the equator instead of dropping it', async () => {
    stubFetch({ count: 0, truncated: false, results: [] });
    await trekPlacesArea({ ...BOX, minLat: 0 });
    // 0 is a coordinate, not a missing value; dropping it would widen the box.
    expect(new URL(calls[0].url).searchParams.get('minLat')).toBe('0');
  });

  it('passes truncation through rather than smoothing it over', async () => {
    stubFetch({ count: 20000, truncated: true, results: [PLACE] });
    const area = await trekPlacesArea(BOX);
    // A client that believed it had the whole area would search offline and
    // quietly miss places.
    expect(area.truncated).toBe(true);
    expect(area.count).toBe(20000);
    expect(area.results).toHaveLength(1);
  });

  it('reads a count that arrived as a string, and a truthy truncated flag', async () => {
    stubFetch({ count: '17', truncated: 1, results: [] });
    const area = await trekPlacesArea(BOX);
    expect(area.count).toBe(17);
    expect(area.truncated).toBe(true);
  });

  it('turns a malformed answer into an empty one rather than passing it on', async () => {
    stubFetch({ count: 'lots', truncated: undefined, results: null });
    await expect(trekPlacesArea(BOX)).resolves.toEqual({ count: 0, truncated: false, results: [] });
  });

  it('throws on an error status so the sync can leave the area alone', async () => {
    stubFetch({}, 502);
    await expect(trekPlacesArea(BOX)).rejects.toThrow(/502/);
  });
});

describe('toPlaceRecord', () => {
  it('produces the same shape the other providers do', () => {
    const r = toPlaceRecord(PLACE);
    expect(r).toMatchObject({
      google_place_id: null,
      osm_id: 'gers:abc-123',
      name: "L'Osteria",
      address: 'Steinstrasse 9, 18055, Rostock',
      lat: 54.0879,
      website: 'https://losteria.net/',
      phone: '+49381',
      source: 'trek-places',
    });
  });

  it('files the chain under brand:wikidata, never under the place own identity', () => {
    // `wikidata` means "the article about this place". Putting the chain's item
    // there is how a branch ends up illustrated with the company logo and
    // described as the franchise operator, which is the whole reason
    // readWikiIdentity refuses to follow brand:* tags.
    const r = toPlaceRecord(PLACE);
    expect(r['brand:wikidata']).toBe('Q123');
    expect(r.wikidata).toBeUndefined();
    expect(r.brand).toBe("L'Osteria");
  });

  it('reports no rating rather than a made-up one', () => {
    // Ratings exist in no open dataset. Null says so; 0 would be a claim.
    expect(toPlaceRecord(PLACE).rating).toBeNull();
  });

  it('keeps a place on the null island rather than dropping its coordinate', () => {
    const r = toPlaceRecord({ ...PLACE, lat: 0, lng: 0 });
    expect(r.lat).toBe(0);
    expect(r.lng).toBe(0);
  });

  it('leaves the coordinate null when it is not a number', () => {
    const r = toPlaceRecord({ ...PLACE, lat: Number.NaN, lng: Number.NaN });
    expect(r.lat).toBeNull();
  });

  // #2483: Overture keeps a website the way the operator typed it.
  it('TREK-PLACES-2483-01: a website without a scheme gains https, one that is no website becomes null', () => {
    const withSite = (website: string | null) =>
      toPlaceRecord({ ...PLACE, contact: { ...PLACE.contact, website } }).website;
    expect(withSite('fr.wikipedia.org/wiki/Chapelle_Sainte-Barbe_du_Faouët')).toBe(
      'https://fr.wikipedia.org/wiki/Chapelle_Sainte-Barbe_du_Faouët',
    );
    expect(withSite('javascript:alert(1)')).toBeNull();
    expect(withSite(null)).toBeNull();
  });

  it('builds an address from whatever parts exist', () => {
    const r = toPlaceRecord({
      ...PLACE,
      address: { freeform: null, locality: 'Rostock', postcode: null, region: null, country: 'DE' },
    });
    expect(r.address).toBe('Rostock');
  });
});

describe('POI_CATEGORY_TO_TREK', () => {
  it('covers every pill the planner offers, and the kinds of the search along a tour it holds', () => {
    // The keys are the contract with the client's POI_CATEGORIES. A missing one
    // silently drops that pill back to Overpass, which is the slow path — and
    // for the four a drive needs that is the worst path of all, because the
    // corridor search asks for them sixteen boxes at a time. Museums and
    // galleries, park, market and peak are asked along a tour (PLN-02,
    // CW-05), each path checked against a live answer of the index.
    expect(Object.keys(POI_CATEGORY_TO_TREK).sort()).toEqual([
      'activity',
      'bar',
      'cafe',
      'campsite',
      'charging',
      'fuel',
      'hotel',
      'market',
      'museum',
      'museum_gallery',
      'nature',
      'park',
      'peak',
      'rest_area',
      'restaurant',
      'shopping',
      'sights',
      'supermarket',
    ]);
  });

  it('gives every pill at least one category to match on', () => {
    for (const [pill, terms] of Object.entries(POI_CATEGORY_TO_TREK)) {
      expect(terms.length, pill).toBeGreaterThan(0);
    }
  });

  it('names every category by its full path, so no bare word matches inside another (#2663)', () => {
    // A bare `park` is inside `parking`, `bar` inside `barber`, `market` inside
    // `marketing_agency`. Only the top-level `shopping` stands alone, and it is
    // a whole branch on purpose.
    for (const [pill, terms] of Object.entries(POI_CATEGORY_TO_TREK)) {
      for (const term of terms) {
        if (term === 'shopping' || term === 'lodging') continue;
        expect(term, pill).toContain('>');
      }
    }
  });
});

describe('indexRowTerm (#2663)', () => {
  const nature = POI_CATEGORY_TO_TREK.nature;

  it('takes a place whose path is the term or lies under it', () => {
    expect(indexRowTerm(nature, 'park', 'sports_and_recreation>park')).toBe('sports_and_recreation>park');
    expect(indexRowTerm(nature, 'national_park', 'sports_and_recreation>park>national_park')).toBe(
      'sports_and_recreation>park',
    );
  });

  it('leaves out a place whose path only contains the word', () => {
    expect(indexRowTerm(nature, 'parking', 'travel_and_transportation>parking')).toBeUndefined();
    expect(indexRowTerm(nature, 'beer_garden', 'food_and_drink>alcoholic_beverage_venue>beer_garden')).toBeUndefined();
    expect(
      indexRowTerm(
        nature,
        'furniture_store',
        'shopping>specialty_store>hardware_home_and_garden_store>furniture_store',
      ),
    ).toBeUndefined();
  });

  it('judges a place without a path by its leaf', () => {
    expect(indexRowTerm(nature, 'beach', null)).toBe('geographic_entities>land_feature>beach');
    expect(indexRowTerm(nature, 'beach_bar', null)).toBeUndefined();
    expect(indexRowTerm(nature, null, null)).toBeUndefined();
  });

  it('picks the most specific term when several fit', () => {
    const terms = [...POI_CATEGORY_TO_TREK.nature, ...POI_CATEGORY_TO_TREK.activity];
    expect(indexRowTerm(terms, 'water_park', 'sports_and_recreation>park>water_park')).toBe(
      'sports_and_recreation>park>water_park',
    );
  });
});

// TREK-PLACES-WAYS-01 to 06, TREK-PLACES-ROUTES-01 to 05, TREK-PLACES-MISS-01, TREK-PLACES-BREAKER-01 to 03

/** A fetch answering each call with the next of `answers`, the last one again once they run out. */
function stubFetchSequence(answers: { body: unknown; status?: number }[]) {
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: URL | string, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      const next = answers[Math.min(calls.length, answers.length) - 1];
      const status = next?.status ?? 200;
      return {
        ok: status >= 200 && status < 300,
        status,
        body: null,
        text: async () => JSON.stringify(next?.body),
      } as unknown as Response;
    }),
  );
}

const askedIds = (call: { url: string }) => new URL(call.url).searchParams.get('ids');

describe('trekPlacesWays', () => {
  it('TREK-PLACES-WAYS-01: asks /v1/ways for the ids and reads the ways in Overpass form', async () => {
    stubFetch({
      elements: [
        { type: 'way', id: 11, tags: { 'mtb:scale': '2', highway: 'path' } },
        { type: 'way', id: 12 },
      ],
      missing: [13],
      keys: ['highway', 'mtb:scale'],
    });
    const answer = await trekPlacesWays([11, 12, 13]);
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe('/v1/ways');
    expect(url.searchParams.get('ids')).toBe('11,12,13');
    expect((calls[0].init?.headers as Record<string, string>)['X-TREK-Instance']).toMatch(/^trek-/);
    expect(calls[0].init?.signal).toBeInstanceOf(AbortSignal);
    // A way without tags reads as one without tags, never as a malformed row.
    expect(answer).toEqual({
      complete: true,
      ways: [
        { type: 'way', id: 11, tags: { 'mtb:scale': '2', highway: 'path' } },
        { type: 'way', id: 12, tags: {} },
      ],
    });
  });

  it('TREK-PLACES-WAYS-02: asks in batches of 500, one after another, each id once, and nothing for no id', async () => {
    stubFetch({ elements: [] });
    const ids = Array.from({ length: 1200 }, (_, index) => index + 1);
    await trekPlacesWays([...ids, 1, 2, 0, -3, 1.5, Number.NaN]);
    expect(calls.map((call) => askedIds(call)?.split(',').length)).toEqual([500, 500, 200]);
    expect(askedIds(calls[0])?.startsWith('1,2,3,')).toBe(true);
    expect(askedIds(calls[2])?.endsWith(',1200')).toBe(true);
    calls = [];
    await expect(trekPlacesWays([])).resolves.toEqual({ complete: true, ways: [] });
    await expect(trekPlacesWays([0, -1])).resolves.toEqual({ complete: true, ways: [] });
    expect(calls).toHaveLength(0);
  });

  it('TREK-PLACES-WAYS-03: drops a row of another shape or for a way not asked, keeping the others', async () => {
    stubFetch({
      elements: [
        { type: 'way', id: 1, tags: { surface: 'gravel' } },
        { type: 'node', id: 2, tags: {} },
        { type: 'way', id: 3, tags: { surface: 4 } },
        { type: 'way', id: 99, tags: { surface: 'asphalt' } },
        'row',
      ],
    });
    expect((await trekPlacesWays([1, 2, 3])).ways).toEqual([{ type: 'way', id: 1, tags: { surface: 'gravel' } }]);
  });

  it('TREK-PLACES-WAYS-04: an answer without elements fails rather than reading as ways without tags', async () => {
    stubFetch({ ways: [] });
    await expect(trekPlacesWays([1])).rejects.toThrow('without elements');
    stubFetch(null);
    await expect(trekPlacesWays([1])).rejects.toThrow('without elements');
  });

  it('TREK-PLACES-WAYS-05: a later batch that fails stops there and names the ids still open', async () => {
    stubFetchSequence([
      { body: { elements: [{ type: 'way', id: 2, tags: { surface: 'gravel' } }] } },
      { body: { detail: 'busy' }, status: 503 },
      { body: { elements: [] } },
    ]);
    const ids = Array.from({ length: 1400 }, (_, index) => index + 1);
    const answer = await trekPlacesWays(ids);
    expect(calls).toHaveLength(2);
    if (answer.complete !== false) throw new Error('expected an answer that stopped part way');
    expect(answer.ways).toEqual([{ type: 'way', id: 2, tags: { surface: 'gravel' } }]);
    expect(answer.unanswered).toEqual(ids.slice(500));
    expect(trekPlacesMiss(answer.failure)).toBe('failed');
  });

  it('TREK-PLACES-WAYS-06: a first batch that fails fails the call and asks no further, and the off switch asks nothing', async () => {
    stubFetchSequence([{ body: {}, status: 503 }, { body: { elements: [] } }]);
    const ids = Array.from({ length: 1400 }, (_, index) => index + 1);
    const failure = await trekPlacesWays(ids).catch((err: unknown) => err);
    expect(trekPlacesMiss(failure)).toBe('failed');
    expect(calls).toHaveLength(1);
    stubFetch({}, 404);
    expect(trekPlacesMiss(await trekPlacesWays([1]).catch((err: unknown) => err))).toBe('not_built');
    env.maps.trekPlacesEnabled = false;
    calls = [];
    expect(trekPlacesMiss(await trekPlacesWays([1]).catch((err: unknown) => err))).toBe('off');
    expect(calls).toHaveLength(0);
  });
});

describe('trekPlacesRoutes', () => {
  const VIEW = { south: 47.1, west: 11.2, north: 47.2, east: 11.3 };
  const CAPS = { relations: 60, ways: 4000 };
  const RELATION = {
    type: 'relation',
    id: 7,
    tags: { route: 'horse', name: 'Reitweg' },
    members: [
      { type: 'way', ref: 1, role: '' },
      { type: 'node', ref: 5, role: 'guidepost' },
    ],
  };
  const WAY = {
    type: 'way',
    id: 1,
    tags: { horse: 'designated' },
    nodes: [10, 11],
    geometry: [
      { lat: 47.15, lon: 11.25 },
      { lat: 47.16, lon: 11.25 },
    ],
  };

  it('TREK-PLACES-ROUTES-01: asks /v1/routes for the box, the type and the caps, kept inside the service bounds', async () => {
    stubFetch({ elements: [RELATION, WAY], truncated: false });
    const routes = await trekPlacesRoutes(VIEW, 'horse', CAPS);
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe('/v1/routes');
    expect(url.searchParams.get('bbox')).toBe('47.1,11.2,47.2,11.3');
    expect(url.searchParams.get('type')).toBe('horse');
    expect(url.searchParams.get('limitRelations')).toBe('60');
    expect(url.searchParams.get('limitWays')).toBe('4000');
    expect(routes).toEqual({ elements: [RELATION, WAY], truncated: false });
    await trekPlacesRoutes(VIEW, 'horse', { relations: 999, ways: 0 });
    const clamped = new URL(calls[1].url).searchParams;
    expect([clamped.get('limitRelations'), clamped.get('limitWays')]).toEqual(['200', '1']);
  });

  it('TREK-PLACES-ROUTES-02: drops an element of another shape on its own, and fills the tags one left off', async () => {
    stubFetch({
      elements: [
        RELATION,
        { ...RELATION, id: 8, members: [{ type: 'area', ref: 1, role: '' }] },
        { ...WAY, id: 2, nodes: [10] },
        { ...WAY, id: 3, geometry: [{ lat: 95, lon: 11 }, WAY.geometry[1]] },
        { ...WAY, id: 4, tags: undefined },
        { type: 'node', id: 5 },
      ],
      truncated: true,
    });
    const routes = await trekPlacesRoutes(VIEW, 'horse', CAPS);
    expect(routes.elements.map((element) => element.id)).toEqual([7, 4]);
    expect(routes.elements[1]).toMatchObject({ id: 4, tags: {} });
    expect(routes.truncated).toBe(true);
  });

  it('TREK-PLACES-ROUTES-03: reads truncated only when the service says true', async () => {
    stubFetch({ elements: [], truncated: 'yes' });
    expect(await trekPlacesRoutes(VIEW, 'horse', CAPS)).toEqual({ elements: [], truncated: false });
    stubFetch({ elements: [] });
    expect((await trekPlacesRoutes(VIEW, 'horse', CAPS)).truncated).toBe(false);
  });

  it('TREK-PLACES-ROUTES-04: an answer without elements fails, and a type not built is a 404', async () => {
    stubFetch({ routes: [] });
    await expect(trekPlacesRoutes(VIEW, 'horse', CAPS)).rejects.toThrow('without elements');
    stubFetch({ detail: 'route type horse not built' }, 404);
    const failure = await trekPlacesRoutes(VIEW, 'horse', CAPS).catch((err: unknown) => err);
    expect(trekPlacesMiss(failure)).toBe('not_built');
  });

  it('TREK-PLACES-ROUTES-05: reads an answer past the search cap, since a view of routes carries their lines', async () => {
    const payload = JSON.stringify({ elements: [RELATION, WAY], truncated: false, pad: 'x'.repeat(1_500_000) });
    stubStreamingFetch([encoder.encode(payload)]);
    const routes = await trekPlacesRoutes(VIEW, 'horse', CAPS);
    expect(routes.elements).toHaveLength(2);
    expect(streamCancelled).toBe(false);
  });
});

describe('trekPlacesMiss', () => {
  it('TREK-PLACES-MISS-01: tells a missing layer, the off switch and any other failure apart', async () => {
    const notBuilt = Object.assign(new Error('TREK Places API 404'), { status: 404 });
    expect(trekPlacesMiss(notBuilt)).toBe('not_built');
    env.maps.trekPlacesEnabled = false;
    expect(trekPlacesMiss(await trekPlacesSearch('x').catch((err: unknown) => err))).toBe('off');
    expect(trekPlacesMiss(Object.assign(new Error('TREK Places API 500'), { status: 500 }))).toBe('failed');
    expect(trekPlacesMiss(new Error('aborted'))).toBe('failed');
    expect(trekPlacesMiss(null)).toBe('failed');
    expect(trekPlacesMiss('nope')).toBe('failed');
  });
});

describe('the layers breaker', () => {
  const VIEW = { south: 47.1, west: 11.2, north: 47.2, east: 11.3 };
  const CAPS = { relations: 60, ways: 4000 };

  it('TREK-PLACES-BREAKER-01: busy layer answers never stop place search', async () => {
    stubFetch({ detail: 'busy' }, 503);
    await oneByOne(Array.from({ length: 4 }), () =>
      expect(trekPlacesRoutes(VIEW, 'horse', CAPS)).rejects.toThrow(/503/),
    );
    stubFetch({ query: 'x', results: [PLACE] });
    await expect(trekPlacesSearch('x')).resolves.toHaveLength(1);
    expect(calls).toHaveLength(1);
  });

  it('TREK-PLACES-BREAKER-02: the layers stop dialling on their own after a few failures', async () => {
    stubFetch({ detail: 'busy' }, 503);
    await oneByOne(Array.from({ length: 4 }), () => expect(trekPlacesWays([1])).rejects.toThrow(/503/));
    const dialled = calls.length;
    await expect(trekPlacesRoutes(VIEW, 'horse', CAPS)).rejects.toThrow('unreachable, not retrying yet');
    await expect(trekPlacesWays([1])).rejects.toThrow('unreachable, not retrying yet');
    expect(calls).toHaveLength(dialled);
  });

  it('TREK-PLACES-BREAKER-03: a layer not built yet does not clear the count of search failures', async () => {
    stubFetch({}, 503);
    await oneByOne(Array.from({ length: 3 }), () => expect(trekPlacesSearch('x')).rejects.toThrow(/503/));
    stubFetch({ detail: 'not built' }, 404);
    await expect(trekPlacesWays([1])).rejects.toThrow(/404/);
    stubFetch({}, 503);
    await expect(trekPlacesSearch('x')).rejects.toThrow(/503/);
    calls = [];
    await expect(trekPlacesSearch('x')).rejects.toThrow('unreachable, not retrying yet');
    expect(calls).toHaveLength(0);
  });
});
