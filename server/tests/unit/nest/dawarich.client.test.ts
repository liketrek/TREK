/**
 * DawarichClient — what it puts on the wire, and what it makes of what comes
 * back.
 *
 * The client is the only place TREK talks to a user's Dawarich instance, so
 * both halves of that contract are pinned here: the URL and headers it builds
 * (a pasted `/api` must not become `/api/api/v1`, and the API key must never
 * reach a query string, where every proxy log between here and there would keep
 * it), and the error code it hands back for each way a self-hosted instance can
 * disappoint — a wrong key, a Cloudflare 403, a reverse proxy answering with an
 * HTML login page.
 *
 * `safeFetch` and `readCappedJson` are mocked: the SSRF guard does a real DNS
 * lookup and the capped reader wants a real stream, and neither is what this
 * file is about. The readCappedJson stub still parses the bytes the response
 * hands it, so "Dawarich answered HTML" stays a genuine parse failure rather
 * than a mock returning `undefined` on command.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { safeFetchMock, readCappedJsonMock } = vi.hoisted(() => ({
  safeFetchMock: vi.fn(),
  readCappedJsonMock: vi.fn(),
}));
vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetch: safeFetchMock }));
vi.mock('../../../src/utils/cappedFetch', () => ({ readCappedJson: readCappedJsonMock }));

import {
  DawarichClient,
  DawarichError,
  isoUtc,
  unixSeconds,
  POINTS_PAGE_SIZE,
  TRACKS_PAGE_SIZE,
  VISITS_PAGE_SIZE,
  type DawarichCreds,
  type DawarichVisitRaw,
} from '../../../src/nest/integrations/dawarich.client';

const API_KEY = 'sk-dawarich-2f7c9';

const CREDS: DawarichCreds = {
  baseUrl: 'https://daw.example.org',
  apiKey: API_KEY,
  allowInsecureTls: false,
};

const FROM = new Date('2026-09-01T00:00:00.000Z');
const TO = new Date('2026-09-08T00:00:00.000Z');

/** The bits of a Response this client touches, plus the bytes the reader sees. */
interface Reply {
  ok: boolean;
  status: number;
  headers: Headers;
  text(): Promise<string>;
}

interface Recorded {
  url: string;
  init: RequestInit;
  options?: { rejectUnauthorized?: boolean };
}

let calls: Recorded[] = [];

function reply(opts: {
  status?: number;
  body?: unknown;
  /** Raw bytes, for the answers that are not JSON at all. */
  raw?: string;
  headers?: Record<string, string>;
}): Reply {
  const status = opts.status ?? 200;
  const raw = opts.raw ?? JSON.stringify(opts.body ?? {});
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(opts.headers ?? {}),
    text: async () => raw,
  };
}

/**
 * Queue the answers, in order. The last one repeats, which is what the
 * pagination cases want: twenty identical pages are one `reply`.
 */
function answerWith(...replies: Reply[]): void {
  const queue = [...replies];
  safeFetchMock.mockImplementation(
    async (url: string, init: RequestInit, options?: { rejectUnauthorized?: boolean }) => {
      calls.push({ url, init, options });
      const next = queue.length > 1 ? queue.shift() : queue[0];
      if (!next) throw new Error('the test queued no answer');
      return next as unknown as Response;
    },
  );
}

/** A transport-level failure: DNS, TLS, the abort timeout. */
function failTransport(message: string): void {
  safeFetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    throw new Error(message);
  });
}

/** The DawarichError a call rejects with, or a failure saying it did not. */
async function failure(run: () => Promise<unknown>): Promise<DawarichError> {
  try {
    await run();
  } catch (err: unknown) {
    if (err instanceof DawarichError) return err;
    throw err;
  }
  throw new Error('expected the call to reject with a DawarichError');
}

function requestedUrl(index = 0): URL {
  return new URL(calls[index].url);
}

function headerOf(index: number, name: string): string | undefined {
  const headers = calls[index].init.headers as Record<string, string> | undefined;
  return headers?.[name];
}

let client: DawarichClient;

beforeEach(() => {
  calls = [];
  client = new DawarichClient();
  safeFetchMock.mockReset();
  readCappedJsonMock.mockReset();
  // The real reader, minus the stream: parse what arrived, answer undefined when
  // it is not JSON — the same verdict the capped reader reaches.
  readCappedJsonMock.mockImplementation(async (res: { text(): Promise<string> }) => {
    const text = await res.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return undefined;
    }
  });
  // Nothing here may reach a real instance: an unstubbed call throws rather
  // than silently resolving to undefined.
  safeFetchMock.mockImplementation(async () => {
    throw new Error('unstubbed safeFetch');
  });
});

describe('DawarichClient — URL building', () => {
  it('DAWARICH-CLIENT-001: appends /api/v1 to a bare origin', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe(CREDS);
    expect(requestedUrl().href).toBe('https://daw.example.org/api/v1/users/me');
  });

  it('DAWARICH-CLIENT-002: tolerates a trailing slash', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe({ ...CREDS, baseUrl: 'https://daw.example.org/' });
    expect(requestedUrl().href).toBe('https://daw.example.org/api/v1/users/me');
  });

  it('DAWARICH-CLIENT-003: tolerates a pasted /api instead of doubling it', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe({ ...CREDS, baseUrl: 'https://daw.example.org/api' });
    expect(requestedUrl().pathname).toBe('/api/v1/users/me');
  });

  it('DAWARICH-CLIENT-004: tolerates a pasted /api/v1, with or without the slash', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe({ ...CREDS, baseUrl: 'https://daw.example.org/api/v1' });
    await client.probe({ ...CREDS, baseUrl: 'https://daw.example.org/api/v1/' });
    expect(requestedUrl(0).href).toBe('https://daw.example.org/api/v1/users/me');
    expect(requestedUrl(1).href).toBe('https://daw.example.org/api/v1/users/me');
  });

  it('DAWARICH-CLIENT-005: keeps a reverse-proxy sub-path and trims pasted whitespace', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe({ ...CREDS, baseUrl: '  https://home.example.org/dawarich/  ' });
    expect(requestedUrl().href).toBe('https://home.example.org/dawarich/api/v1/users/me');
  });

  it('DAWARICH-CLIENT-006: keeps a non-default port', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe({ ...CREDS, baseUrl: 'http://192.168.178.9:3000/api' });
    expect(requestedUrl().href).toBe('http://192.168.178.9:3000/api/v1/users/me');
  });

  it('DAWARICH-CLIENT-007: an undefined query value is dropped, not sent as the word "undefined"', async () => {
    // Every method today builds its query out of String(), isoUtc() or
    // unixSeconds(), so none of them can hand the helper an undefined; the
    // helper's signature still accepts one, and the day a caller passes an
    // optional filter through, `?per_page=undefined` is a request Dawarich
    // would answer wrongly rather than reject. Reached through the private
    // `get` because that is the only place the decision is made.
    type PrivateGet = (
      creds: DawarichCreds,
      path: string,
      query: Record<string, string | undefined>,
    ) => Promise<{ data: unknown; headers: Headers }>;

    answerWith(reply({ body: { id: 1 } }));
    const get = (client as unknown as { get: PrivateGet }).get.bind(client);
    await get(CREDS, '/visits', { page: '2', per_page: undefined, order: 'asc' });

    const url = requestedUrl();
    expect(url.pathname).toBe('/api/v1/visits');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('order')).toBe('asc');
    expect(url.searchParams.has('per_page')).toBe(false);
    expect(url.search).not.toContain('undefined');
  });
});

describe('DawarichClient — authentication', () => {
  it('DAWARICH-CLIENT-010: sends the key as a Bearer token and asks for JSON', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe(CREDS);
    expect(headerOf(0, 'Authorization')).toBe(`Bearer ${API_KEY}`);
    expect(headerOf(0, 'Accept')).toBe('application/json');
    expect(calls[0].init.method).toBe('GET');
  });

  it('DAWARICH-CLIENT-011: never puts the key in the query string, on any endpoint', async () => {
    answerWith(reply({ body: [] }));
    await client.probe(CREDS);
    await client.listVisits(CREDS, FROM, TO);
    await client.listTracks(CREDS, FROM, TO);
    await client.listPoints(CREDS, FROM, TO);
    await client.listVisitedCities(CREDS, FROM, TO);
    await client.findVisitsNear(CREDS, 54.09, 12.14, 120, 5);

    expect(calls.length).toBeGreaterThanOrEqual(6);
    for (const call of calls) {
      const url = new URL(call.url);
      expect(url.searchParams.get('api_key')).toBeNull();
      expect(call.url).not.toContain(API_KEY);
      expect(url.search).not.toMatch(/key|token|auth/i);
    }
  });

  it('DAWARICH-CLIENT-012: maps allowInsecureTls onto rejectUnauthorized', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe(CREDS);
    await client.probe({ ...CREDS, allowInsecureTls: true });
    expect(calls[0].options).toEqual({ rejectUnauthorized: true });
    expect(calls[1].options).toEqual({ rejectUnauthorized: false });
  });

  it('DAWARICH-CLIENT-013: bounds the request with an abort signal', async () => {
    answerWith(reply({ body: { id: 1 } }));
    await client.probe(CREDS);
    expect(calls[0].init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('DawarichClient — time formats', () => {
  it('DAWARICH-CLIENT-020: isoUtc is UTC ISO-8601 without milliseconds', () => {
    expect(isoUtc(new Date('2026-09-01T10:00:30.123Z'))).toBe('2026-09-01T10:00:30Z');
    expect(isoUtc(new Date('2026-09-01T10:00:00.000Z'))).toBe('2026-09-01T10:00:00Z');
  });

  it('DAWARICH-CLIENT-021: unixSeconds is a bare digit string, floored', () => {
    const value = unixSeconds(new Date('2026-09-01T10:00:30.900Z'));
    expect(value).toMatch(/^\d+$/);
    expect(new Date(Number(value) * 1000).toISOString()).toBe('2026-09-01T10:00:30.000Z');
  });

  it('DAWARICH-CLIENT-022: visits and tracks get ISO bounds, points and cities unix seconds', async () => {
    answerWith(reply({ body: [] }));
    await client.listVisits(CREDS, FROM, TO);
    await client.listTracks(CREDS, FROM, TO);
    await client.listPoints(CREDS, FROM, TO);
    await client.listVisitedCities(CREDS, FROM, TO);

    expect(requestedUrl(0).searchParams.get('start_at')).toBe('2026-09-01T00:00:00Z');
    expect(requestedUrl(1).searchParams.get('end_at')).toBe('2026-09-08T00:00:00Z');
    expect(requestedUrl(2).searchParams.get('start_at')).toBe(unixSeconds(FROM));
    expect(requestedUrl(2).searchParams.get('start_at')).toMatch(/^\d+$/);
    expect(requestedUrl(3).searchParams.get('end_at')).toBe(unixSeconds(TO));
  });
});

describe('DawarichClient — error classification', () => {
  const cases: Array<{ id: string; status: number; code: string }> = [
    { id: 'DAWARICH-CLIENT-030', status: 401, code: 'unauthorized' },
    { id: 'DAWARICH-CLIENT-031', status: 403, code: 'forbidden' },
    { id: 'DAWARICH-CLIENT-032', status: 404, code: 'not_found' },
    { id: 'DAWARICH-CLIENT-033', status: 429, code: 'rate_limited' },
    { id: 'DAWARICH-CLIENT-034', status: 500, code: 'server_error' },
    { id: 'DAWARICH-CLIENT-035', status: 502, code: 'server_error' },
  ];

  for (const { id, status, code } of cases) {
    it(`${id}: HTTP ${status} is "${code}"`, async () => {
      answerWith(reply({ status, raw: 'nope' }));
      const err = await failure(() => client.probe(CREDS));
      expect(err.code).toBe(code);
      expect(err.status).toBe(status);
      expect(err.name).toBe('DawarichError');
      // The body of a failed answer is never parsed — it is as likely to be an
      // HTML error page as JSON.
      expect(readCappedJsonMock).not.toHaveBeenCalled();
    });
  }

  it('DAWARICH-CLIENT-036: a transport failure is "unreachable" and keeps the reason as detail', async () => {
    failTransport('getaddrinfo ENOTFOUND daw.example.org');
    const err = await failure(() => client.probe(CREDS));
    expect(err.code).toBe('unreachable');
    expect(err.status).toBeUndefined();
    expect(err.detail).toContain('ENOTFOUND');
  });

  it('DAWARICH-CLIENT-042: a rejection that is not an Error is still "unreachable", with no detail invented', async () => {
    // undici rejects with an Error, but the SSRF guard sits in front of it and
    // is free to reject with anything at all. Reaching for `.message` on
    // whatever arrived is how the catch block itself starts throwing. The
    // honest answer for a string is no detail rather than the string "undefined"
    // shown to the user under "why the connection failed".
    safeFetchMock.mockImplementation(() => Promise.reject('socket hang up'));
    const err = await failure(() => client.probe(CREDS));
    expect(err.code).toBe('unreachable');
    expect(err.detail).toBeUndefined();
  });

  it('DAWARICH-CLIENT-037: an HTML login page is "invalid_response", not a parse crash', async () => {
    answerWith(reply({ raw: '<!doctype html><title>Sign in</title>' }));
    const err = await failure(() => client.probe(CREDS));
    expect(err.code).toBe('invalid_response');
    expect(err.message).toMatch(/not JSON/i);
  });

  it('DAWARICH-CLIENT-038: a body over the size cap is "invalid_response"', async () => {
    answerWith(reply({ body: { huge: true } }));
    readCappedJsonMock.mockResolvedValue(undefined);
    const err = await failure(() => client.probe(CREDS));
    expect(err.code).toBe('invalid_response');
    // The cap is passed in, rather than the reader guessing one.
    expect(readCappedJsonMock.mock.calls[0][1]).toBe(8 * 1024 * 1024);
  });

  it('DAWARICH-CLIENT-039: a 2xx answer is not classified as an error', async () => {
    answerWith(reply({ status: 204, body: {} }));
    await expect(client.probe(CREDS)).resolves.toEqual({ version: null });
  });
});

describe('DawarichClient — probe', () => {
  it('DAWARICH-CLIENT-040: asks /users/me and reads X-Dawarich-Version', async () => {
    answerWith(reply({ body: { id: 7 }, headers: { 'X-Dawarich-Version': '1.14.4' } }));
    const probe = await client.probe(CREDS);
    expect(probe).toEqual({ version: '1.14.4' });
    // /health skips authentication upstream, so it would prove nothing.
    expect(requestedUrl().pathname).toBe('/api/v1/users/me');
    expect(requestedUrl().pathname).not.toContain('health');
    expect(requestedUrl().search).toBe('');
  });

  it('DAWARICH-CLIENT-041: an instance too old to send the banner probes as version null', async () => {
    answerWith(reply({ body: { id: 7 } }));
    await expect(client.probe(CREDS)).resolves.toEqual({ version: null });
  });
});

describe('DawarichClient — listVisits', () => {
  function visit(id: number): DawarichVisitRaw {
    return {
      id,
      area_id: null,
      started_at: '2026-09-02T08:00:00Z',
      ended_at: '2026-09-02T09:30:00Z',
      duration: 5400,
      name: `Stop ${id}`,
      status: 'confirmed',
      confidence: 0.9,
      confidence_band: 'high',
      place: { latitude: '54.0879', longitude: '12.1408', id: id * 10 },
    };
  }

  it('DAWARICH-CLIENT-050: sends the window, the page and the upstream page size', async () => {
    answerWith(reply({ body: [visit(1)] }));
    const out = await client.listVisits(CREDS, FROM, TO);

    const url = requestedUrl();
    expect(url.pathname).toBe('/api/v1/visits');
    expect(url.searchParams.get('start_at')).toBe('2026-09-01T00:00:00Z');
    expect(url.searchParams.get('end_at')).toBe('2026-09-08T00:00:00Z');
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('per_page')).toBe(String(VISITS_PAGE_SIZE));
    expect(out.visits).toHaveLength(1);
    expect(out.truncated).toBe(false);
  });

  it('DAWARICH-CLIENT-051: walks every page X-Total-Pages announces and concatenates them', async () => {
    answerWith(
      reply({ body: [visit(1)], headers: { 'X-Total-Pages': '3', 'X-Dawarich-Version': '1.14.4' } }),
      reply({ body: [visit(2)], headers: { 'X-Total-Pages': '3', 'X-Dawarich-Version': '9.9.9' } }),
      reply({ body: [visit(3)], headers: { 'X-Total-Pages': '3' } }),
    );
    const out = await client.listVisits(CREDS, FROM, TO);

    expect(calls).toHaveLength(3);
    expect(out.visits.map(v => v.id)).toEqual([1, 2, 3]);
    expect(out.truncated).toBe(false);
    // The first page's banner is the answer; a later page cannot overwrite it.
    expect(out.version).toBe('1.14.4');
    expect(calls.map(c => new URL(c.url).searchParams.get('page'))).toEqual(['1', '2', '3']);
  });

  it('DAWARICH-CLIENT-052: an absent X-Total-Pages means one page', async () => {
    answerWith(reply({ body: [visit(1)] }));
    const out = await client.listVisits(CREDS, FROM, TO);
    expect(calls).toHaveLength(1);
    expect(out.visits).toHaveLength(1);
    expect(out.version).toBeNull();
  });

  it('DAWARICH-CLIENT-053: stops at the page ceiling and says the result is truncated', async () => {
    answerWith(reply({ body: [visit(1)], headers: { 'X-Total-Pages': '25' } }));
    const out = await client.listVisits(CREDS, FROM, TO);

    expect(calls).toHaveLength(20);
    expect(out.visits).toHaveLength(20);
    expect(out.truncated).toBe(true);
    expect(new URL(calls[19].url).searchParams.get('page')).toBe('20');
  });

  it('DAWARICH-CLIENT-055: an X-Total-Pages that is not a number means one page, not twenty', async () => {
    // A reverse proxy that rewrites or truncates the header must not turn one
    // window into twenty identical requests against somebody's home server.
    answerWith(reply({ body: [visit(1)], headers: { 'X-Total-Pages': 'many' } }));
    const out = await client.listVisits(CREDS, FROM, TO);

    expect(calls).toHaveLength(1);
    expect(out.visits).toHaveLength(1);
    expect(out.truncated).toBe(false);
  });

  it('DAWARICH-CLIENT-054: a payload that is not a list is "invalid_response"', async () => {
    answerWith(reply({ body: { visits: [] } }));
    const err = await failure(() => client.listVisits(CREDS, FROM, TO));
    expect(err.code).toBe('invalid_response');
    expect(err.message).toMatch(/not a list/i);
  });
});

describe('DawarichClient — listTracks', () => {
  const feature = (id: number) => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: [[12.1, 54.0], [12.2, 54.1]] },
    properties: { id, start_at: '2026-09-02T08:00:00Z', end_at: '2026-09-02T09:00:00Z' },
  });

  it('DAWARICH-CLIENT-060: reads the GeoJSON features and asks for the smaller page size', async () => {
    answerWith(reply({ body: { type: 'FeatureCollection', features: [feature(1), feature(2)] } }));
    const out = await client.listTracks(CREDS, FROM, TO);

    const url = requestedUrl();
    expect(url.pathname).toBe('/api/v1/tracks');
    expect(url.searchParams.get('per_page')).toBe(String(TRACKS_PAGE_SIZE));
    expect(url.searchParams.get('start_at')).toBe('2026-09-01T00:00:00Z');
    expect(out.features.map(f => f.properties?.id)).toEqual([1, 2]);
    expect(out.truncated).toBe(false);
  });

  it('DAWARICH-CLIENT-061: an instance with no tracks yet answers empty rather than throwing', async () => {
    answerWith(reply({ body: { type: 'FeatureCollection' } }));
    await expect(client.listTracks(CREDS, FROM, TO)).resolves.toEqual({ features: [], truncated: false });

    calls = [];
    answerWith(reply({ body: { features: 'nope' } }));
    await expect(client.listTracks(CREDS, FROM, TO)).resolves.toEqual({ features: [], truncated: false });
  });

  it('DAWARICH-CLIENT-062: paginates over X-Total-Pages and truncates at the ceiling', async () => {
    answerWith(
      reply({ body: { features: [feature(1)] }, headers: { 'X-Total-Pages': '2' } }),
      reply({ body: { features: [feature(2)] }, headers: { 'X-Total-Pages': '2' } }),
    );
    const paged = await client.listTracks(CREDS, FROM, TO);
    expect(calls).toHaveLength(2);
    expect(paged.features).toHaveLength(2);
    expect(paged.truncated).toBe(false);

    calls = [];
    answerWith(reply({ body: { features: [feature(9)] }, headers: { 'X-Total-Pages': '99' } }));
    const capped = await client.listTracks(CREDS, FROM, TO);
    expect(calls).toHaveLength(20);
    expect(capped.truncated).toBe(true);
  });

  it('DAWARICH-CLIENT-063: an unreadable X-Total-Pages means one page', async () => {
    answerWith(reply({ body: { features: [feature(1)] }, headers: { 'X-Total-Pages': 'unknown' } }));
    const out = await client.listTracks(CREDS, FROM, TO);

    expect(calls).toHaveLength(1);
    expect(out).toEqual({ features: [feature(1)], truncated: false });
  });
});

describe('DawarichClient — listPoints', () => {
  const point = (id: number) => ({ id, latitude: '54.0879', longitude: '12.1408', timestamp: 1788000000 + id });

  it('DAWARICH-CLIENT-070: asks for slim points in ascending order over a unix-second window', async () => {
    answerWith(reply({ body: [point(1)] }));
    const out = await client.listPoints(CREDS, FROM, TO);

    const url = requestedUrl();
    expect(url.pathname).toBe('/api/v1/points');
    expect(url.searchParams.get('slim')).toBe('true');
    expect(url.searchParams.get('order')).toBe('asc');
    expect(url.searchParams.get('per_page')).toBe(String(POINTS_PAGE_SIZE));
    expect(url.searchParams.get('start_at')).toBe(unixSeconds(FROM));
    expect(url.searchParams.get('end_at')).toBe(unixSeconds(TO));
    expect(out).toEqual({ points: [point(1)], truncated: false });
  });

  it('DAWARICH-CLIENT-071: paginates over X-Total-Pages and truncates at the ceiling', async () => {
    answerWith(
      reply({ body: [point(1)], headers: { 'X-Total-Pages': '2' } }),
      reply({ body: [point(2)], headers: { 'X-Total-Pages': '2' } }),
    );
    const paged = await client.listPoints(CREDS, FROM, TO);
    expect(calls).toHaveLength(2);
    expect(paged.points.map(p => p.id)).toEqual([1, 2]);
    expect(paged.truncated).toBe(false);

    calls = [];
    answerWith(reply({ body: [point(3)], headers: { 'X-Total-Pages': '40' } }));
    const capped = await client.listPoints(CREDS, FROM, TO);
    expect(calls).toHaveLength(20);
    expect(capped.points).toHaveLength(20);
    expect(capped.truncated).toBe(true);
  });

  it('DAWARICH-CLIENT-073: an unreadable X-Total-Pages means one page', async () => {
    answerWith(reply({ body: [point(1)], headers: { 'X-Total-Pages': 'lots' } }));
    const out = await client.listPoints(CREDS, FROM, TO);

    expect(calls).toHaveLength(1);
    expect(out).toEqual({ points: [point(1)], truncated: false });
  });

  it('DAWARICH-CLIENT-072: a payload that is not a list is "invalid_response"', async () => {
    answerWith(reply({ body: { points: [] } }));
    const err = await failure(() => client.listPoints(CREDS, FROM, TO));
    expect(err.code).toBe('invalid_response');
    expect(err.message).toMatch(/not a list/i);
  });
});

describe('DawarichClient — listVisitedCities', () => {
  it('DAWARICH-CLIENT-080: unwraps the data envelope over a unix-second window', async () => {
    const countries = [{ country: 'Germany', cities: [{ city: 'Rostock', points: 42, timestamp: 1788000000 }] }];
    answerWith(reply({ body: { data: countries } }));
    const out = await client.listVisitedCities(CREDS, FROM, TO);

    expect(requestedUrl().pathname).toBe('/api/v1/countries/visited_cities');
    expect(requestedUrl().searchParams.get('start_at')).toBe(unixSeconds(FROM));
    expect(out).toEqual(countries);
  });

  it('DAWARICH-CLIENT-081: an envelope without a list answers empty', async () => {
    answerWith(reply({ body: {} }));
    await expect(client.listVisitedCities(CREDS, FROM, TO)).resolves.toEqual([]);

    calls = [];
    answerWith(reply({ body: { data: { Germany: [] } } }));
    await expect(client.listVisitedCities(CREDS, FROM, TO)).resolves.toEqual([]);
  });
});

describe('DawarichClient, visited cities over a year', () => {
  const YEAR_FROM = new Date('2025-09-14T20:00:00.000Z');
  const YEAR_TO = new Date('2026-09-14T20:00:00.000Z');

  it('DAWARICH-CLIENT-082: a year is asked for a month at a time, one request after another, and folded back', async () => {
    // Dawarich computes this endpoint over every point in the window. A year in
    // one request is what timed out on a tester's instance, so the client has to
    // split it, and has to do so without firing thirteen computations at once.
    let inFlight = 0;
    let mostAtOnce = 0;
    let served = 0;
    safeFetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      inFlight++;
      mostAtOnce = Math.max(mostAtOnce, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 0));
      inFlight--;
      served++;
      const body =
        served === 1
          ? { data: [{ country: 'Germany', cities: [{ city: 'Rostock', stayed_for: 90 }] }] }
          : served === 7
            ? { data: [{ country: 'Germany', cities: [{ city: 'Rostock', stayed_for: 30 }] }, { country: 'Poland', cities: [] }] }
            : { data: [] };
      return reply({ body }) as unknown as Response;
    });

    const out = await client.listVisitedCities(CREDS, YEAR_FROM, YEAR_TO);

    expect(calls).toHaveLength(13);
    expect(mostAtOnce).toBe(1);
    expect(requestedUrl(0).searchParams.get('start_at')).toBe(unixSeconds(YEAR_FROM));
    expect(requestedUrl(12).searchParams.get('end_at')).toBe(unixSeconds(YEAR_TO));
    for (let i = 1; i < calls.length; i++) {
      const previousEnd = Number(requestedUrl(i - 1).searchParams.get('end_at'));
      expect(Number(requestedUrl(i).searchParams.get('start_at'))).toBe(previousEnd + 1);
    }
    expect(out).toEqual([
      { country: 'Germany', cities: [{ city: 'Rostock', stayed_for: 120 }] },
      { country: 'Poland', cities: [] },
    ]);
  });

  it('DAWARICH-CLIENT-083: one month failing fails the whole year instead of passing off eleven as twelve', async () => {
    let served = 0;
    safeFetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      served++;
      if (served === 4) throw new Error('The operation was aborted due to timeout');
      return reply({ body: { data: [] } }) as unknown as Response;
    });

    const err = await failure(() => client.listVisitedCities(CREDS, YEAR_FROM, YEAR_TO));
    expect(err.code).toBe('unreachable');
    // Stops at the failure rather than spending the remaining nine on a result
    // that is already going to be refused.
    expect(calls).toHaveLength(4);
  });
});

describe('DawarichClient — findVisitsNear', () => {
  it('DAWARICH-CLIENT-090: pins the radius explicitly instead of letting Dawarich guess 500 m', async () => {
    const visits = [{ timestamp: 1788000000, distance_meters: 40, points_count: 12 }];
    answerWith(reply({ body: { locations: [{ visits }] } }));
    const out = await client.findVisitsNear(CREDS, 54.0879, 12.1408, 119.6, 5);

    const url = requestedUrl();
    expect(url.pathname).toBe('/api/v1/locations');
    expect(url.searchParams.get('lat')).toBe('54.0879');
    expect(url.searchParams.get('lon')).toBe('12.1408');
    expect(url.searchParams.get('radius_override')).toBe('120');
    expect(url.searchParams.get('limit')).toBe('5');
    expect(out).toEqual(visits);
  });

  it('DAWARICH-CLIENT-091: a coordinate the recordings never saw answers empty', async () => {
    answerWith(reply({ body: { locations: [] } }));
    await expect(client.findVisitsNear(CREDS, 0, 0, 100, 5)).resolves.toEqual([]);

    calls = [];
    answerWith(reply({ body: {} }));
    await expect(client.findVisitsNear(CREDS, 0, 0, 100, 5)).resolves.toEqual([]);

    calls = [];
    answerWith(reply({ body: { locations: [{}] } }));
    await expect(client.findVisitsNear(CREDS, 0, 0, 100, 5)).resolves.toEqual([]);
  });
});
