import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { parseOverpassEndpoints } from '../../../src/nest/maps/overpass.constants';
import { OverpassElementsClient, overpassAnswerSchema } from '../../../src/nest/overpass/overpass-elements.service';
import { Test } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const integrations = { overpassUrl: undefined as string | undefined, overpassTimeoutMs: 5000 };
let client: OverpassElementsClient;

beforeEach(async () => {
  integrations.overpassUrl = 'https://a.example/api/interpreter,https://b.example/api/interpreter';
  integrations.overpassTimeoutMs = 5000;
  const moduleRef = await Test.createTestingModule({
    providers: [OverpassElementsClient, { provide: RuntimeEnvService, useValue: { env: () => ({ integrations }) } }],
  }).compile();
  client = moduleRef.get(OverpassElementsClient);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('parseOverpassEndpoints', () => {
  it('reads a comma-separated list of http(s) endpoints', () => {
    expect(parseOverpassEndpoints(' https://a.example/i , http://b.local/i ')).toEqual([
      'https://a.example/i',
      'http://b.local/i',
    ]);
  });

  it('drops what is not an http(s) URL', () => {
    expect(parseOverpassEndpoints('ftp://x/i,not a url,https://ok.example/i')).toEqual(['https://ok.example/i']);
  });

  it('falls back to the public mirrors when nothing usable is configured', () => {
    for (const raw of [undefined, '', 'nope']) {
      const list = parseOverpassEndpoints(raw);
      expect(list.length).toBeGreaterThan(1);
      expect(list).toContain('https://overpass-api.de/api/interpreter');
    }
  });
});

describe('OverpassElementsClient.query', () => {
  it('POSTs the query with a user agent and a deadline, and answers the elements', async () => {
    const fetcher = vi.fn(async (_url: string, _init: RequestInit) => json({ elements: [{ type: 'way', id: 1 }] }));
    vi.stubGlobal('fetch', fetcher);
    integrations.overpassUrl = 'https://a.example/api/interpreter';
    const elements = await client.query('[out:json];way(1);out;', 'Ferratas');
    expect(elements).toEqual([{ type: 'way', id: 1 }]);
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe('https://a.example/api/interpreter');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(`data=${encodeURIComponent('[out:json];way(1);out;')}`);
    expect((init?.headers as Record<string, string>)['User-Agent']).toMatch(/^TREK Travel Planner/);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('takes the first mirror that answers well and cancels the others', async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (init.signal) signals.push(init.signal);
        if (url.startsWith('https://a.')) return json({ elements: [], remark: 'runtime error: timeout' });
        return json({ elements: [{ type: 'way', id: 2 }] });
      }),
    );
    expect(await client.query('q', 'Ferratas')).toEqual([{ type: 'way', id: 2 }]);
    expect(signals.every((s) => s.aborted)).toBe(true);
  });

  it('throws once every mirror failed: an HTTP error, a remark, a body that is not OSM', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (url.startsWith('https://a.') ? json({}, 504) : json({ elements: 'nope' }))),
    );
    await expect(client.query('q', 'Ferratas')).rejects.toThrow('Could not reach any Overpass endpoint');
  });

  it('throws when a mirror cannot be reached at all', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );
    await expect(client.query('q', 'Ferratas')).rejects.toThrow('Could not reach any Overpass endpoint');
  });

  it('refuses an answer larger than the cap', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('{"elements":[]}', { status: 200, headers: { 'content-length': String(9 * 1024 * 1024) } }),
      ),
    );
    await expect(client.query('q', 'Ferratas')).rejects.toThrow('Could not reach any Overpass endpoint');
  });
});

describe('overpassAnswerSchema', () => {
  it('accepts an element list with or without a remark', () => {
    expect(overpassAnswerSchema.safeParse({ elements: [] }).success).toBe(true);
    expect(overpassAnswerSchema.safeParse({ elements: [], remark: 'runtime error' }).success).toBe(true);
  });

  it('refuses a body without elements', () => {
    expect(overpassAnswerSchema.safeParse({ error: 'x' }).success).toBe(false);
    expect(overpassAnswerSchema.safeParse(undefined).success).toBe(false);
  });
});
