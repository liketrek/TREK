/**
 * The winter layer of the TREK Places client (spec 7.2, 3.5): what it asks
 * (never a coordinate), its caps and timeouts, the ETag it holds, the answers
 * it refuses, and the operator's opt-out and the circuit breaker it shares
 * with the place search. fetch is stubbed; the service is not reached.
 */
import { TrekPlacesWinterService } from '../../../src/nest/maps/trek-places-winter.service';
import {
  resetTrekPlacesBreaker,
  trekPlacesWinterArea,
  trekPlacesWinterIndex,
  trekPlacesWinterMeta,
} from '../../../src/nest/maps/trek-places.client';

import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { env } = vi.hoisted(() => ({
  env: { maps: { trekPlacesUrl: 'https://places.example.net', trekPlacesEnabled: true } },
}));

vi.mock('../../../src/app-config', () => ({
  readEnv: () => env,
  getAppUrl: () => 'https://trip.example.org',
}));

interface Call {
  url: string;
  init: RequestInit & { headers: Record<string, string> };
}
let calls: Call[] = [];

/** One answer of the service: a status, a body as bytes (streamed or not) and its headers. */
function answer(status: number, body: Buffer | string = '', headers: Record<string, string> = {}, stream = true) {
  const bytes = typeof body === 'string' ? Buffer.from(body) : body;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    body: stream
      ? new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array(bytes));
            controller.close();
          },
        })
      : null,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as Response;
}

function stub(...answers: Response[]) {
  calls = [];
  const queue = [...answers];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: URL | string, init: Call['init']) => {
      calls.push({ url: String(url), init });
      const next = queue.shift();
      if (!next) throw new Error('no answer left');
      return next;
    }),
  );
}

const SHA = 'c'.repeat(64);
const META = {
  build: '2026-11-02',
  format: 1,
  areas: 1,
  indexSha: SHA,
  sourceTimestamp: '2026-11-01T00:00:00Z',
  attribution: { data: '© OpenStreetMap contributors, ODbL', terrain: 'Terrain: Mapzen Terrarium', note: 'x' },
};
const ROW = {
  id: 'w:100',
  name: 'Sonnenbahn',
  kind: 'resort',
  country: null,
  colourScheme: 'europe',
  bbox: [7.0, 45.999, 7.005, 46.0052],
  counts: { runsKm: 1.19, nordicKm: 0.53, lifts: 1, skitourKm: 0, hikeKm: 0 },
  bytes: 900,
  sha256: SHA,
};

beforeEach(() => {
  resetTrekPlacesBreaker();
  env.maps.trekPlacesEnabled = true;
  env.maps.trekPlacesUrl = 'https://places.example.net';
});
afterEach(() => vi.unstubAllGlobals());

describe('the winter meta', () => {
  it('PLACESWINTER-001: asks /v1/winter/meta without any parameter, and reads the build and checksum', async () => {
    stub(answer(200, JSON.stringify(META)));
    expect(await trekPlacesWinterMeta()).toMatchObject({ build: '2026-11-02', indexSha: SHA, format: 1 });
    const url = new URL(calls[0]?.url ?? '');
    expect(url.origin + url.pathname).toBe('https://places.example.net/v1/winter/meta');
    expect(url.search).toBe('');
    expect(calls[0]?.init.signal).toBeInstanceOf(AbortSignal);
    expect(calls[0]?.init.headers['X-TREK-Instance']).toMatch(/^trek-/);
    expect(calls[0]?.init.headers['If-None-Match']).toBeUndefined();
  });

  it('PLACESWINTER-002: refuses an answer off the contract, too large, or not JSON', async () => {
    stub(answer(200, JSON.stringify({ ...META, indexSha: 'short' })));
    await expect(trekPlacesWinterMeta()).rejects.toThrow();
    stub(answer(200, 'x'.repeat(70 * 1024)));
    await expect(trekPlacesWinterMeta()).rejects.toThrow('TREK Places API response too large');
    stub(answer(200, '<html>'));
    await expect(trekPlacesWinterMeta()).rejects.toThrow(SyntaxError);
    stub(answer(304, ''));
    await expect(trekPlacesWinterMeta()).rejects.toThrow('TREK Places API 304');
  });
});

describe('the winter index', () => {
  it('PLACESWINTER-010: sends the checksum it holds as the ETag, and reads nothing new on a 304', async () => {
    stub(answer(304, '', { etag: `"${SHA}"` }));
    expect(await trekPlacesWinterIndex(SHA)).toEqual({ status: 'not_modified' });
    expect(calls[0]?.init.headers['If-None-Match']).toBe(`"${SHA}"`);
  });

  it('PLACESWINTER-011: reads the index, checksums it as read, and drops a row that does not read', async () => {
    const json = JSON.stringify({ build: '2026-11-02', format: 1, areas: [ROW, { ...ROW, id: '../x' }] });
    stub(answer(200, json, { etag: '"abc"' }, false));
    const read = await trekPlacesWinterIndex(null);
    if (read.status !== 'ok') throw new Error('not read');
    expect(read.index.areas.map((row) => row.id)).toEqual(['w:100']);
    expect(read.dropped).toBe(1);
    expect(read.sha256).toBe(createHash('sha256').update(json).digest('hex'));
    expect(calls[0]?.init.headers['If-None-Match']).toBeUndefined();
    stub(answer(200, JSON.stringify({ build: '', format: 1, areas: [] })));
    await expect(trekPlacesWinterIndex(null)).rejects.toThrow();
  });

  it('PLACESWINTER-012: reads an unpacked index past 8 MB, and refuses a build a tour could not keep', async () => {
    const filler = Array.from({ length: 32_000 }, (_, i) => ({ ...ROW, id: `w:${i + 1}` }));
    const json = JSON.stringify({ build: '2026-11-02', format: 1, areas: filler });
    expect(Buffer.byteLength(json)).toBeGreaterThan(8 * 1024 * 1024);
    stub(answer(200, json));
    const read = await trekPlacesWinterIndex(null);
    if (read.status !== 'ok') throw new Error('not read');
    expect(read.index.areas).toHaveLength(32_000);
    stub(answer(200, JSON.stringify({ build: 'nightly build', format: 1, areas: [] })));
    await expect(trekPlacesWinterIndex(null)).rejects.toThrow();
  });
});

describe('an area graph', () => {
  it('PLACESWINTER-020: asks for the area by its id, the bytes as sent with their tag', async () => {
    const bytes = Buffer.from([0x1f, 0x8b, 8, 0, 1, 2, 3]);
    stub(answer(200, bytes, { etag: `W/"${SHA}"` }));
    expect(await trekPlacesWinterArea('w:100', null)).toEqual({ status: 'ok', bytes, etag: SHA });
    expect(new URL(calls[0]?.url ?? '').pathname).toBe('/v1/winter/area/w%3A100');
    expect(calls[0]?.init.headers.Accept).toBe('application/vnd.trek.sgraph');
    stub(answer(304, ''));
    expect(await trekPlacesWinterArea('r:5-1a', SHA)).toEqual({ status: 'not_modified' });
    stub(answer(200, bytes, {}));
    expect(await trekPlacesWinterArea('w:100', null)).toMatchObject({ etag: null });
  });

  it('PLACESWINTER-021: refuses an id that is not one before asking, and a 404 as a 404', async () => {
    stub();
    await expect(trekPlacesWinterArea('../../etc/passwd', null)).rejects.toThrow('Not a ski area id');
    expect(calls).toHaveLength(0);
    stub(answer(404, 'no such area'));
    await expect(trekPlacesWinterArea('w:9', null)).rejects.toMatchObject({ status: 404 });
  });
});

describe('the opt-out and the breaker', () => {
  it('PLACESWINTER-030: nothing leaves when TREK Places is off, and the provider says so', async () => {
    env.maps.trekPlacesEnabled = false;
    stub();
    await expect(trekPlacesWinterMeta()).rejects.toThrow('switched off');
    await expect(trekPlacesWinterIndex(null)).rejects.toThrow('switched off');
    expect(calls).toHaveLength(0);
    const winter = new TrekPlacesWinterService();
    expect(winter.enabled()).toBe(false);
    env.maps.trekPlacesEnabled = true;
    expect(winter.enabled()).toBe(true);
  });

  it('PLACESWINTER-031: four failures open the breaker for the winter layer too; a 404 does not count', async () => {
    stub(answer(404), answer(500), answer(500), answer(500), answer(500));
    await expect(trekPlacesWinterMeta()).rejects.toThrow('TREK Places API 404');
    await expect(trekPlacesWinterMeta()).rejects.toThrow('TREK Places API 500');
    await expect(trekPlacesWinterMeta()).rejects.toThrow('TREK Places API 500');
    await expect(trekPlacesWinterMeta()).rejects.toThrow('TREK Places API 500');
    await expect(trekPlacesWinterMeta()).rejects.toThrow('TREK Places API 500');
    await expect(trekPlacesWinterMeta()).rejects.toThrow('not retrying yet');
    expect(calls).toHaveLength(5);
    expect(new TrekPlacesWinterService().heldBack()).toBe(true);
    resetTrekPlacesBreaker();
    expect(new TrekPlacesWinterService().heldBack()).toBe(false);
  });

  it('PLACESWINTER-032: the provider hands each call to the client', async () => {
    const winter = new TrekPlacesWinterService();
    stub(answer(200, JSON.stringify(META)), answer(304, ''), answer(304, ''));
    expect((await winter.meta()).build).toBe('2026-11-02');
    expect(await winter.index(SHA)).toEqual({ status: 'not_modified' });
    expect(await winter.area('w:1', SHA)).toEqual({ status: 'not_modified' });
  });
});
