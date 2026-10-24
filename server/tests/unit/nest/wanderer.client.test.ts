/**
 * WandererClient: what it puts on the wire and what it makes of the answers.
 *
 * `safeFetch` and `readCappedJson` are mocked (the SSRF guard does a real DNS
 * lookup, the capped reader wants a real stream); the reader stub still parses
 * the bytes the reply carries, so a non-JSON answer stays a real parse failure.
 */
import {
  WandererClient,
  WandererError,
  bboxFilter,
  difficultyOf,
  instanceOrigin,
  isTrailId,
  type WandererCreds,
} from '../../../src/nest/wanderer/wanderer.client';
import { ResponseTooLargeError, SsrfBlockedError } from '../../../src/utils/ssrfGuard';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetchMock, readCappedJsonMock } = vi.hoisted(() => ({
  safeFetchMock: vi.fn(),
  readCappedJsonMock: vi.fn(),
}));
vi.mock('../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/utils/ssrfGuard')>()),
  safeFetch: safeFetchMock,
}));
vi.mock('../../../src/utils/cappedFetch', () => ({ readCappedJson: readCappedJsonMock }));

const CREDS: WandererCreds = {
  baseUrl: 'https://wanderer.example.org/api/v1/',
  token: 'wanderer_key_abc',
  allowInsecureTls: false,
};

interface Reply {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

function reply(body: unknown, status = 200): Reply {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => raw };
}

let calls: Array<{ url: string; init: RequestInit; options: { rejectUnauthorized?: boolean; maxBytes?: number } }> = [];

/** Answers by path, so the order of the calls a method makes does not matter. */
function answer(routes: Record<string, Reply | ((url: string) => Reply)>): void {
  safeFetchMock.mockImplementation(
    async (url: string, init: RequestInit, options: { rejectUnauthorized?: boolean }) => {
      calls.push({ url, init, options });
      const path = new URL(url).pathname;
      const route = routes[path];
      if (!route) throw new Error(`unexpected call to ${path}`);
      return (typeof route === 'function' ? route(url) : route) as unknown as Response;
    },
  );
}

const OWNER = {
  '/api/v1/api-token': reply({ items: [{ user: 'gixauk8ukjpqabm' }], totalItems: 1 }),
  '/api/v1/user/gixauk8ukjpqabm': reply({
    expand: {
      activitypub_actors_via_user: [
        { id: 'nspsn7zu7octact', is_local: true },
        { id: 'remote1', is_local: false },
      ],
    },
  }),
};

const HIT = {
  id: 'ukzj2hazx6dgzam',
  name: 'Partnachklamm',
  description: 'Gorge',
  location: 'Garmisch',
  distance: 19_700,
  duration: 18_000,
  elevation_gain: 929,
  elevation_loss: 929,
  difficulty: 1,
  public: true,
  author_name: 'maurice',
  domain: 'wanderer.example.org',
  polyline: '_p~iF~ps|U_ulLnnqC',
};

function searchBody(index: number): { q: string; options: { filter?: string[]; limit?: number; offset?: number } } {
  return JSON.parse(String(calls.filter((call) => call.url.endsWith('/search/trails'))[index].init.body));
}

async function failure(run: () => Promise<unknown>): Promise<WandererError> {
  try {
    await run();
  } catch (err) {
    if (err instanceof WandererError) return err;
    throw err;
  }
  throw new Error('expected a WandererError');
}

beforeEach(() => {
  calls = [];
  safeFetchMock.mockReset();
  readCappedJsonMock.mockReset().mockImplementation(async (response: Reply) => JSON.parse(await response.text()));
});

describe('WandererClient', () => {
  const client = new WandererClient();

  it('RS-03: sends the token as a bearer header to the instance origin, never in the URL, with TLS checked', async () => {
    answer({ ...OWNER, '/api/v1/search/trails': reply({ hits: [], estimatedTotalHits: 4 }) });
    await expect(client.check(CREDS)).resolves.toEqual({ trailCount: 4 });

    for (const call of calls) {
      expect(call.url.startsWith('https://wanderer.example.org/api/v1/')).toBe(true);
      expect(call.url).not.toContain('wanderer_key_abc');
      expect((call.init.headers as Record<string, string>).Authorization).toBe('Bearer wanderer_key_abc');
      expect(call.options.rejectUnauthorized).toBe(true);
      expect(call.init.signal).toBeInstanceOf(AbortSignal);
    }
    // The count is of the owner's own trails only.
    expect(searchBody(0).options.filter).toEqual(["author IN ['nspsn7zu7octact']"]);
  });

  it('RS-03: a token wanderer reads as anonymous is refused, however 200 the answer', async () => {
    answer({ '/api/v1/api-token': reply({ items: [], totalItems: 0 }) });
    expect((await failure(() => client.check(CREDS))).code).toBe('unauthorized');
  });

  it('RS-03: an owner without a local author, or with an odd id, is an answer TREK does not trust', async () => {
    answer({
      ...OWNER,
      '/api/v1/user/gixauk8ukjpqabm': reply({
        expand: { activitypub_actors_via_user: [{ id: 'remote1', is_local: false }] },
      }),
    });
    expect((await failure(() => client.ownActors(CREDS))).code).toBe('invalid_response');

    answer({ '/api/v1/api-token': reply({ items: [{ user: 'Not-An-Id!' }] }) });
    expect((await failure(() => client.ownActors(CREDS))).code).toBe('invalid_response');
  });

  it('RS-04/MF-02: searches the owner trails, a page at a time, in the box when one is given', async () => {
    answer({ '/api/v1/search/trails': reply({ hits: [HIT], totalHits: 31 }) });
    const box = { south: 47, west: 11, north: 48, east: 12 };
    await expect(client.search(CREDS, { q: 'klamm', page: 2, bbox: box }, ['nspsn7zu7octact'])).resolves.toMatchObject({
      total: 31,
      hits: [HIT],
    });

    const body = searchBody(0);
    expect(body.q).toBe('klamm');
    expect(body.options).toMatchObject({ limit: 20, offset: 20 });
    expect(body.options.filter).toEqual(["author IN ['nspsn7zu7octact']", bboxFilter(box)]);
  });

  it('MF-02: a box over the antimeridian takes either side of it', () => {
    expect(bboxFilter({ south: -20, west: 170, north: -10, east: -170 })).toBe(
      'max_lat >= -20 AND min_lat <= -10 AND (max_lon >= 170 OR min_lon <= -170)',
    );
    expect(bboxFilter({ south: 47, west: 11, north: 48, east: 12 })).toBe(
      'max_lat >= 47 AND min_lat <= 48 AND max_lon >= 11 AND min_lon <= 12',
    );
  });

  it('RS-05: finds one of the owner trails by id, and never puts an odd id into a filter', async () => {
    answer({ '/api/v1/search/trails': reply({ hits: [HIT] }) });
    await expect(client.searchById(CREDS, 'ukzj2hazx6dgzam', ['nspsn7zu7octact'])).resolves.toEqual(HIT);
    expect(searchBody(0).options.filter).toEqual(["id = 'ukzj2hazx6dgzam'", "author IN ['nspsn7zu7octact']"]);

    await expect(client.searchById(CREDS, "x' OR 1=1", ['nspsn7zu7octact'])).resolves.toBeNull();
    expect(calls).toHaveLength(1);
  });

  it('RS-05: reads a trail record and its original GPX', async () => {
    answer({
      '/api/v1/trail/ukzj2hazx6dgzam': reply({
        id: 'ukzj2hazx6dgzam',
        name: 'Partnachklamm',
        gpx: 'track.gpx',
        author: 'nspsn7zu7octact',
      }),
      '/api/v1/files/trails/ukzj2hazx6dgzam/track.gpx': reply('<gpx></gpx>'),
    });
    const trail = await client.trail(CREDS, 'ukzj2hazx6dgzam');
    expect(trail.author).toBe('nspsn7zu7octact');
    await expect(client.gpx(CREDS, trail)).resolves.toBe('<gpx></gpx>');
    expect(calls[1].options.maxBytes).toBe(10 * 1024 * 1024);
  });

  it('RS-05: a trail without a file, or an id that is no record id, is not found', async () => {
    answer({});
    expect((await failure(() => client.trail(CREDS, '../etc'))).code).toBe('not_found');
    expect((await failure(() => client.gpx(CREDS, { id: 'abc', name: 'x', gpx: null }))).code).toBe('not_found');
    expect(calls).toHaveLength(0);
  });

  it('RS-03: tells each way an instance can fail apart', async () => {
    const statusOf = async (status: number, body = '') => {
      answer({ '/api/v1/trail/abc': reply(body, status) });
      return (await failure(() => client.trail(CREDS, 'abc'))).code;
    };
    expect(await statusOf(401)).toBe('unauthorized');
    expect(await statusOf(500, 'Failed to verify API token: Invalid or revoked API token')).toBe('unauthorized');
    expect(await statusOf(403)).toBe('forbidden');
    expect(await statusOf(404)).toBe('not_found');
    expect(await statusOf(502, 'Bad gateway')).toBe('server_error');

    answer({ '/api/v1/trail/abc': reply('<html>login</html>') });
    expect((await failure(() => client.trail(CREDS, 'abc'))).code).toBe('invalid_response');

    answer({ '/api/v1/trail/abc': reply({ unexpected: true }) });
    expect((await failure(() => client.trail(CREDS, 'abc'))).code).toBe('invalid_response');
  });

  it('RS-03: transport failures name the guard, the certificate, the size or the reach', async () => {
    const transport = async (error: unknown) => {
      safeFetchMock.mockRejectedValueOnce(error);
      return (await failure(() => client.trail(CREDS, 'abc'))).code;
    };
    expect(await transport(new SsrfBlockedError('private'))).toBe('blocked_address');
    expect(
      await transport(Object.assign(new Error('fetch failed'), { cause: { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' } })),
    ).toBe('tls');
    expect(await transport(new ResponseTooLargeError(1))).toBe('too_large');
    expect(await transport(new Error('ECONNREFUSED'))).toBe('unreachable');
  });

  it('RS-03: a body that breaks off while it is read is a reach failure, for JSON and for the GPX', async () => {
    answer({ '/api/v1/trail/abc': reply({ id: 'abc', name: 'x' }) });
    readCappedJsonMock.mockRejectedValueOnce(new Error('socket hang up'));
    expect((await failure(() => client.trail(CREDS, 'abc'))).code).toBe('unreachable');

    answer({
      '/api/v1/files/trails/abc/track.gpx': {
        ok: true,
        status: 200,
        text: async () => {
          throw new Error('socket hang up');
        },
      },
    });
    expect((await failure(() => client.gpx(CREDS, { id: 'abc', name: 'x', gpx: 'track.gpx' }))).code).toBe(
      'unreachable',
    );
  });

  it('RS-03: the test counts the owner trails from either total, and still connects when the count fails', async () => {
    const countWith = async (search: Reply) => {
      answer({ ...OWNER, '/api/v1/search/trails': search });
      return (await client.check(CREDS)).trailCount;
    };
    expect(await countWith(reply({ hits: [], estimatedTotalHits: 7 }))).toBe(7);
    expect(await countWith(reply({ hits: [], totalHits: 5 }))).toBe(5);
    expect(await countWith(reply({ hits: [] }))).toBeNull();
    expect(await countWith(reply('Bad gateway', 502))).toBeNull();
  });

  it('RS-03: a self-signed certificate is accepted only when the user allowed it', async () => {
    answer({ '/api/v1/trail/abc': reply({ id: 'abc', name: 'x' }) });
    await client.trail({ ...CREDS, allowInsecureTls: true }, 'abc');
    expect(calls[0].options.rejectUnauthorized).toBe(false);
  });
});

describe('wanderer client helpers', () => {
  it('reads the origin from whatever was pasted', () => {
    expect(instanceOrigin('https://w.example.org/')).toBe('https://w.example.org');
    expect(instanceOrigin(' https://w.example.org/api ')).toBe('https://w.example.org');
    expect(instanceOrigin('https://w.example.org/sub/api/v1')).toBe('https://w.example.org/sub');
  });

  it('knows a record id and the three difficulties', () => {
    expect(isTrailId('ukzj2hazx6dgzam')).toBe(true);
    expect(isTrailId('UPPER')).toBe(false);
    expect(isTrailId('')).toBe(false);
    expect([0, 1, 2, 3, null].map((value) => difficultyOf(value))).toEqual([
      'easy',
      'moderate',
      'difficult',
      null,
      null,
    ]);
  });
});
