/**
 * The outbound half of PAD-05A against a faked fetch: Geofabrik's list read
 * and cached, the extracts only from Geofabrik's host, redirects only within
 * it, the download counted against its cap and its file gone on failure.
 */
import {
  GEOFABRIK_HOST,
  GeofabrikClient,
  isExtractUrl,
  MAX_EXTRACT_BYTES,
} from '../../../../src/nest/paddle-obstacles/geofabrik.client';

import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const EXTRACT = `${GEOFABRIK_HOST}europe/germany/bayern/oberpfalz-latest.osm.pbf`;
const square = {
  type: 'Polygon',
  coordinates: [
    [
      [11.5, 48.9],
      [13, 48.9],
      [13, 50],
      [11.5, 50],
      [11.5, 48.9],
    ],
  ],
};
const index = {
  features: [
    {
      properties: {
        id: 'bayern',
        parent: 'germany',
        name: 'Bayern',
        urls: { pbf: `${GEOFABRIK_HOST}europe/germany/bayern-latest.osm.pbf` },
      },
      geometry: null,
    },
    { properties: { id: 'oberpfalz', parent: 'bayern', name: 'Oberpfalz', urls: { pbf: EXTRACT } }, geometry: square },
    {
      properties: { id: 'elsewhere', name: 'Elsewhere', urls: { pbf: 'https://evil.example/x-latest.osm.pbf' } },
      geometry: null,
    },
    {
      properties: { id: 'dated', name: 'Dated', urls: { pbf: `${GEOFABRIK_HOST}dated-230101.osm.pbf` } },
      geometry: null,
    },
    { properties: { id: 'nofile', name: 'No file', urls: {} }, geometry: null },
  ],
};

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();
let client: GeofabrikClient;
let dir: string;
let n = 0;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-geofabrik-'));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  client = new GeofabrikClient();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const redirect = (location: string) => new Response(null, { status: 302, headers: { location } });
const target = () => join(dir, `download-${n++}.osm.pbf`);
const exists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

describe('isExtractUrl', () => {
  it('GEOF-001: takes the latest extract on Geofabrik and nothing else', () => {
    expect(isExtractUrl(EXTRACT)).toBe(true);
    expect(isExtractUrl('https://evil.example/oberpfalz-latest.osm.pbf')).toBe(false);
    expect(isExtractUrl(`${GEOFABRIK_HOST}oberpfalz-230101.osm.pbf`)).toBe(false);
    expect(isExtractUrl('http://download.geofabrik.de/oberpfalz-latest.osm.pbf')).toBe(false);
  });
});

describe('GeofabrikClient.regions', () => {
  it('GEOF-002: reads the list with a deadline, keeping the regions with a latest extract on its host', async () => {
    fetchMock.mockResolvedValueOnce(json(index));

    const regions = await client.regions(1000);

    expect([...regions.keys()]).toEqual(['bayern', 'oberpfalz']);
    expect(regions.get('oberpfalz')).toEqual({
      id: 'oberpfalz',
      name: 'Oberpfalz',
      parent: 'bayern',
      pbfUrl: EXTRACT,
      boundary: square,
    });
    expect(regions.get('bayern')?.boundary).toBeNull();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`${GEOFABRIK_HOST}index-v1.json`);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.redirect).toBe('manual');
  });

  it('GEOF-003: keeps the list for a day, then asks again', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json(index)));
    await client.regions(0);
    await client.regions(23 * 60 * 60 * 1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await client.regions(25 * 60 * 60 * 1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('GEOF-004: refuses an answer that is not the list, or not a success', async () => {
    fetchMock.mockResolvedValueOnce(json({ type: 'FeatureCollection' }));
    await expect(client.regions()).rejects.toThrow('Geofabrik index is not the list of extracts');
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 200 }));
    await expect(client.regions()).rejects.toThrow('Geofabrik index is not the list of extracts');
    fetchMock.mockResolvedValueOnce(json({}, 503));
    await expect(client.regions()).rejects.toThrow('Geofabrik index 503');
  });

  it('GEOF-005: follows a redirect within Geofabrik, refuses one away from it or too many', async () => {
    fetchMock
      .mockResolvedValueOnce(redirect('https://mirror.geofabrik.de/index-v1.json'))
      .mockResolvedValueOnce(json(index));
    expect((await client.regions(0)).size).toBe(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://mirror.geofabrik.de/index-v1.json');

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(redirect('https://evil.example/index-v1.json'));
    await expect(new GeofabrikClient().regions()).rejects.toThrow('Geofabrik redirected away from its own servers');

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(redirect('http://download.geofabrik.de/index-v1.json'));
    await expect(new GeofabrikClient().regions()).rejects.toThrow('Geofabrik redirected away from its own servers');

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 301 }));
    await expect(new GeofabrikClient().regions()).rejects.toThrow('Geofabrik redirected away from its own servers');

    fetchMock.mockReset();
    fetchMock.mockImplementation(() => Promise.resolve(redirect('/again')));
    await expect(new GeofabrikClient().regions()).rejects.toThrow('Geofabrik redirected too often');
    // Three redirects are followed; the fourth is one too many.
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('GEOF-006: a timeout reaches the caller as an error', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    await expect(client.regions()).rejects.toThrow('timeout');
  });
});

describe('GeofabrikClient.download', () => {
  it('GEOF-007: writes the extract to the target and tells the share received', async () => {
    const body = Buffer.alloc(3000, 7);
    fetchMock.mockResolvedValueOnce(new Response(body, { status: 200, headers: { 'content-length': '3000' } }));
    const progress: number[] = [];
    const path = target();

    await client.download(EXTRACT, path, { onProgress: (fraction) => progress.push(fraction) });

    expect(await readFile(path)).toEqual(body);
    expect(progress.at(-1)).toBe(1);
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('GEOF-008: refuses an address the list could not have named, without asking', async () => {
    await expect(client.download('https://evil.example/x-latest.osm.pbf', target())).rejects.toThrow(
      'Not a Geofabrik extract',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('GEOF-009: refuses an extract that says it is larger than allowed, before reading it', async () => {
    const response = new Response('x', { status: 200, headers: { 'content-length': String(MAX_EXTRACT_BYTES + 1) } });
    fetchMock.mockResolvedValueOnce(response);
    const path = target();
    await expect(client.download(EXTRACT, path)).rejects.toThrow('Extract larger than allowed');
    expect(await exists(path)).toBe(false);
  });

  it('GEOF-010: cuts an extract that streams past the cap and removes the file', async () => {
    fetchMock.mockResolvedValueOnce(new Response(Buffer.alloc(5000, 1), { status: 200 }));
    const path = target();
    await expect(client.download(EXTRACT, path, { maxBytes: 1000 })).rejects.toThrow('Extract larger than allowed');
    expect(await exists(path)).toBe(false);
  });

  it('GEOF-011: a failed answer or a call-off ends the download without a file', async () => {
    fetchMock.mockResolvedValueOnce(new Response('gone', { status: 404 }));
    const missing = target();
    await expect(client.download(EXTRACT, missing)).rejects.toThrow('Geofabrik download 404');
    expect(await exists(missing)).toBe(false);

    const abort = new AbortController();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(100));
      },
    });
    fetchMock.mockResolvedValueOnce(new Response(stream, { status: 200 }));
    const path = target();
    const download = client.download(EXTRACT, path, { signal: abort.signal });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    abort.abort();
    await expect(download).rejects.toThrow();
    expect(await exists(path)).toBe(false);
  });

  it('GEOF-012: follows a redirect to another Geofabrik server for the extract', async () => {
    fetchMock
      .mockResolvedValueOnce(redirect('https://mirror.geofabrik.de/europe/oberpfalz-latest.osm.pbf'))
      .mockResolvedValueOnce(new Response(Buffer.from('pbf'), { status: 200 }));
    const path = target();
    await client.download(EXTRACT, path);
    expect((await readFile(path)).toString()).toBe('pbf');
  });
});

describe('GeofabrikClient.sizeOf', () => {
  it('GEOF-013: asks with HEAD and a deadline, and answers the size Geofabrik announces', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200, headers: { 'content-length': '83886080' } }));
    expect(await client.sizeOf(EXTRACT)).toBe(83_886_080);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'HEAD', redirect: 'manual' });
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('GEOF-014: no size, a size that is no number, or a failed answer reads as unknown', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200, headers: { 'content-length': 'lots' } }))
      .mockResolvedValueOnce(new Response(null, { status: 404, headers: { 'content-length': '42' } }));
    expect(await client.sizeOf(EXTRACT)).toBeNull();
    expect(await client.sizeOf(EXTRACT)).toBeNull();
    expect(await client.sizeOf(EXTRACT)).toBeNull();
  });

  it('GEOF-015: a size that cannot be asked reads as unknown; an address the list could not name is refused unasked', async () => {
    fetchMock.mockRejectedValueOnce(new Error('socket hang up')).mockRejectedValueOnce('reset');
    expect(await client.sizeOf(EXTRACT)).toBeNull();
    expect(await client.sizeOf(EXTRACT)).toBeNull();
    fetchMock.mockClear();
    await expect(client.sizeOf('https://evil.example/x-latest.osm.pbf')).rejects.toThrow('Not a Geofabrik extract');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
