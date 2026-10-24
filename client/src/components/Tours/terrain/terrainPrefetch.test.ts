import { afterEach, describe, expect, it, vi } from 'vitest';
import { corridorTiles, prefetchTiles, TILE_TIMEOUT_MS, tileUrls } from './terrainPrefetch';

const OK = { ok: true } as Response;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('corridorTiles', () => {
  it('takes the ring around a point at each zoom: wide when coarse, tight when fine', () => {
    const tiles = corridorTiles([{ lat: 0, lng: 0 }]);
    const perZoom = (z: number) => tiles.filter(([zoom]) => zoom === z).length;
    expect(perZoom(9)).toBe(9);
    expect(perZoom(11)).toBe(25);
    expect(perZoom(15)).toBe(9);
    expect(tiles).toHaveLength(95);
    expect(tiles).toContainEqual([9, 256, 256]);
  });

  it('lists a tile two points share once', () => {
    expect(
      corridorTiles(
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 0.0001 },
        ],
        [9]
      )
    ).toHaveLength(9);
  });

  it('wraps round the antimeridian and stops at the poles', () => {
    const atDateLine = corridorTiles([{ lat: 0, lng: -180 }], [9]);
    expect(atDateLine).toContainEqual([9, 511, 256]);
    const nearPole = corridorTiles([{ lat: 85, lng: 0 }], [9]);
    expect(nearPole).toHaveLength(6);
    expect(nearPole.every(([, , y]) => y >= 0)).toBe(true);
  });

  it('takes one tile of ring for a zoom it has no ring for', () => {
    expect(corridorTiles([{ lat: 0, lng: 0 }], [5])).toHaveLength(9);
  });
});

describe('tileUrls', () => {
  const tiles: Array<[number, number, number]> = [
    [9, 10, 20],
    [12, 80, 160],
    [13, 160, 320],
    [13, 161, 321],
  ];

  it('fills each template and skips the zooms below its first', () => {
    expect(tileUrls([{ url: 'https://t/{z}/{x}/{y}.png', minzoom: 10, maxzoom: 22 }], tiles)).toEqual([
      'https://t/12/80/160.png',
      'https://t/13/160/320.png',
      'https://t/13/161/321.png',
    ]);
  });

  it("fetches a source's deepest tile past its last zoom, once", () => {
    expect(tileUrls([{ url: 'https://dem/{z}/{x}/{y}', minzoom: 0, maxzoom: 12 }], tiles)).toEqual([
      'https://dem/9/10/20',
      'https://dem/12/80/160',
    ]);
  });

  it('covers every template', () => {
    const urls = tileUrls(
      [
        { url: 'a/{z}/{x}/{y}', minzoom: 0, maxzoom: 22 },
        { url: 'b/{z}/{x}/{y}', minzoom: 0, maxzoom: 22 },
      ],
      [[9, 1, 2]]
    );
    expect(urls).toEqual(['a/9/1/2', 'b/9/1/2']);
  });
});

describe('prefetchTiles', () => {
  it('reports done at once when there is nothing to fetch', async () => {
    const fetchStub = vi.fn();
    vi.stubGlobal('fetch', fetchStub);
    const progress = vi.fn();
    await prefetchTiles([], new AbortController().signal, progress);
    expect(progress.mock.calls).toEqual([[1]]);
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('fetches every URL from the cache-first store and counts up to 1', async () => {
    const fetchStub = vi.fn(() => Promise.resolve(OK));
    vi.stubGlobal('fetch', fetchStub);
    const progress = vi.fn();
    const signal = new AbortController().signal;
    await prefetchTiles(['u1', 'u2', 'u3', 'u4'], signal, progress);
    expect(fetchStub).toHaveBeenCalledTimes(4);
    expect(fetchStub).toHaveBeenCalledWith('u1', expect.objectContaining({ mode: 'cors', cache: 'force-cache' }));
    expect(progress.mock.calls.map(([share]) => share)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('skips a tile that fails instead of stopping', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => (url === 'bad' ? Promise.reject(new Error('offline')) : Promise.resolve(OK)))
    );
    const progress = vi.fn();
    await prefetchTiles(['bad', 'good'], new AbortController().signal, progress);
    expect(progress).toHaveBeenLastCalledWith(1);
  });

  it('gives up on a tile that never answers, so the share still reaches 1', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (url: string, init: RequestInit) =>
            new Promise<Response>((resolve, reject) => {
              if (url === 'good') resolve(OK);
              else init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
            })
        )
      );
      const progress = vi.fn();
      const run = prefetchTiles(['hang', 'good'], new AbortController().signal, progress);
      await vi.advanceTimersByTimeAsync(TILE_TIMEOUT_MS + 1);
      await run;
      expect(progress).toHaveBeenLastCalledWith(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps at most eight requests in flight', async () => {
    const pending: Array<() => void> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            pending.push(() => resolve(OK));
          })
      )
    );
    const run = prefetchTiles(
      Array.from({ length: 12 }, (_, i) => `u${i}`),
      new AbortController().signal,
      () => {}
    );
    expect(pending).toHaveLength(8);
    pending.splice(0).forEach((resolve) => resolve());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(pending).toHaveLength(4);
    pending.splice(0).forEach((resolve) => resolve());
    await run;
    expect(fetch).toHaveBeenCalledTimes(12);
  });

  it('starts no request once aborted', async () => {
    const fetchStub = vi.fn(() => Promise.resolve(OK));
    vi.stubGlobal('fetch', fetchStub);
    const controller = new AbortController();
    controller.abort();
    const progress = vi.fn();
    await prefetchTiles(['u1', 'u2'], controller.signal, progress);
    expect(fetchStub).not.toHaveBeenCalled();
    expect(progress.mock.calls).toEqual([[0]]);
  });
});
