/**
 * FE-PDFIMAGES-001 to FE-PDFIMAGES-007: the place photos of the trip PDF are
 * baked in at thumbnail size (#1501). jsdom has neither createImageBitmap nor a
 * 2d canvas, so both are stubbed: the bitmap reports the size the test names, and
 * the canvas records what it was asked to draw.
 */
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../../tests/helpers/msw/server';
import { bakePdfCover, shrinkPdfImages, STRIP_PX } from './pdfImages';

const origin = window.location.origin;
const JPEG = 'data:image/jpeg;base64,c21hbGw=';

let bitmapSize = { width: 1200, height: 800 };
let drawn: { width: number; height: number }[] = [];
let drawCalls: unknown[][] = [];
let stops: [number, string][] = [];
let inFlight = 0;
let mostInFlight = 0;

/** A 2d context that records the size of the canvas each draw lands on; WebGL is not offered. */
function fakeContext(this: HTMLCanvasElement, type: string) {
  if (type !== '2d') return null;
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    drawImage: vi.fn((...args: unknown[]) => {
      drawCalls.push(args);
      drawn.push({ width: this.width, height: this.height });
    }),
    createLinearGradient: vi.fn(() => ({ addColorStop: (at: number, colour: string) => stops.push([at, colour]) })),
  };
}

function imageResponse(type = 'image/jpeg') {
  return new HttpResponse(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': type } });
}

beforeEach(() => {
  bitmapSize = { width: 1200, height: 800 };
  drawn = [];
  drawCalls = [];
  stops = [];
  inFlight = 0;
  mostInFlight = 0;
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ ...bitmapSize, close: vi.fn() }))
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    fakeContext as unknown as HTMLCanvasElement['getContext']
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(JPEG);
  server.use(
    http.get(`${origin}/uploads/places/:file`, async () => {
      inFlight++;
      mostInFlight = Math.max(mostInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return imageResponse();
    }),
    http.get(`${origin}/uploads/notes/:file`, () => imageResponse('text/plain')),
    http.get(`${origin}/uploads/missing.jpg`, () => new HttpResponse(null, { status: 404 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('shrinkPdfImages', () => {
  it('FE-PDFIMAGES-001: a same-origin photo comes back as a JPEG with its short side at 222 px', async () => {
    const url = `${origin}/uploads/places/a.jpg`;
    const shrunk = await shrinkPdfImages([url]);

    expect(shrunk.get(url)).toBe(JPEG);
    expect(drawn).toEqual([{ width: 333, height: 222 }]);
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/jpeg', expect.any(Number));
  });

  it('FE-PDFIMAGES-001b: a photo is decoded near thumbnail size, not in full', async () => {
    await shrinkPdfImages([`${origin}/uploads/places/a.jpg`]);

    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(Blob), { resizeHeight: 444, resizeQuality: 'medium' });
  });

  it('FE-PDFIMAGES-001c: the photo strip of a day asks for a larger copy, decoded at twice its size', async () => {
    const url = `${origin}/uploads/places/a.jpg`;
    await shrinkPdfImages([url], undefined, STRIP_PX);

    expect(drawn).toEqual([{ width: 720, height: 480 }]);
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(Blob), { resizeHeight: 960, resizeQuality: 'medium' });
  });

  it('FE-PDFIMAGES-002: a photo from another origin keeps its URL and is never fetched', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const shrunk = await shrinkPdfImages(['https://images.example.com/a.jpg']);

    expect(shrunk.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('FE-PDFIMAGES-003: a photo that is small already, missing or not an image keeps its URL', async () => {
    bitmapSize = { width: 120, height: 90 };
    const small = `${origin}/uploads/places/small.jpg`;
    const missing = `${origin}/uploads/missing.jpg`;
    const text = `${origin}/uploads/notes/readme.txt`;
    const shrunk = await shrinkPdfImages([small, missing, text]);

    expect(shrunk.size).toBe(0);
    expect(drawn).toEqual([]);
  });

  it('FE-PDFIMAGES-004: hundreds of photos are fetched a few at a time, each URL once', async () => {
    const urls = Array.from({ length: 40 }, (_, i) => `${origin}/uploads/places/${i}.jpg`);
    const shrunk = await shrinkPdfImages([...urls, ...urls]);

    expect(shrunk.size).toBe(40);
    expect(drawn).toHaveLength(40);
    expect(mostInFlight).toBeGreaterThan(1);
    expect(mostInFlight).toBeLessThanOrEqual(3);
  });

  it('FE-PDFIMAGES-005: an aborted export starts no photo at all', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const controller = new AbortController();
    controller.abort();
    const shrunk = await shrinkPdfImages([`${origin}/uploads/places/a.jpg`], controller.signal);

    expect(shrunk.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('FE-PDFIMAGES-006: without createImageBitmap nothing is fetched and every photo keeps its URL', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const shrunk = await shrinkPdfImages([`${origin}/uploads/places/a.jpg`]);

    expect(shrunk.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('FE-PDFIMAGES-007: a canvas that cannot encode a JPEG leaves the URL in place', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:,');
    const url = `${origin}/uploads/places/a.jpg`;
    const shrunk = await shrinkPdfImages([url]);

    expect(shrunk.has(url)).toBe(false);
  });
});

describe('bakePdfCover', () => {
  it('FE-PDFIMAGES-010: the photo is cropped to the page and the shade painted into one JPEG', async () => {
    bitmapSize = { width: 4000, height: 2252 };
    const url = `${origin}/uploads/places/cover.jpg`;
    const baked = await bakePdfCover(url, [
      [0, 0.35],
      [0.92, 0.82],
    ]);

    expect(baked).toBe(JPEG);
    // Decoded at the page's height, not in full.
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(Blob), { resizeHeight: 1754, resizeQuality: 'medium' });
    // A4 at 150 dpi, the landscape photo scaled to the page height and centred.
    expect(drawn).toEqual([{ width: 1240, height: 1754 }]);
    const [, x, y, width, height] = drawCalls[0] as number[];
    expect(height).toBeCloseTo(1754, 0);
    expect(width).toBeCloseTo((4000 * 1754) / 2252, 0);
    expect(x).toBeCloseTo((1240 - width) / 2, 3);
    expect(y).toBeCloseTo(0, 3);
    expect(stops).toEqual([
      [0, 'rgba(10, 10, 14, 0.35)'],
      [0.92, 'rgba(10, 10, 14, 0.82)'],
    ]);
  });

  it('FE-PDFIMAGES-011: a cover from another origin or one that cannot be read is left to print as before', async () => {
    expect(await bakePdfCover('https://elsewhere.example/cover.jpg', [[0, 0.5]])).toBeNull();
    expect(await bakePdfCover(`${origin}/uploads/missing.jpg`, [[0, 0.5]])).toBeNull();
    expect(drawn).toEqual([]);
  });
});
