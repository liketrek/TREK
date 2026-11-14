/**
 * FE-PDFIMAGES-001 to FE-PDFIMAGES-007: the place photos of the trip PDF are
 * baked in at thumbnail size (#1501). jsdom has neither createImageBitmap nor a
 * 2d canvas, so both are stubbed: the bitmap reports the size the test names, and
 * the canvas records what it was asked to draw.
 */
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../../tests/helpers/msw/server';
import { shrinkPdfImages } from './pdfImages';

const origin = window.location.origin;
const JPEG = 'data:image/jpeg;base64,c21hbGw=';

let bitmapSize = { width: 1200, height: 800 };
let drawn: { width: number; height: number }[] = [];
let inFlight = 0;
let mostInFlight = 0;

/** A 2d context that records the size of the canvas each draw lands on; WebGL is not offered. */
function fakeContext(this: HTMLCanvasElement, type: string) {
  if (type !== '2d') return null;
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    drawImage: vi.fn(() => drawn.push({ width: this.width, height: this.height })),
  };
}

function imageResponse(type = 'image/jpeg') {
  return new HttpResponse(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': type } });
}

beforeEach(() => {
  bitmapSize = { width: 1200, height: 800 };
  drawn = [];
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
  it('FE-PDFIMAGES-001: a same-origin photo comes back as a JPEG with its short side at 156 px', async () => {
    const url = `${origin}/uploads/places/a.jpg`;
    const shrunk = await shrinkPdfImages([url]);

    expect(shrunk.get(url)).toBe(JPEG);
    expect(drawn).toEqual([{ width: 234, height: 156 }]);
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/jpeg', expect.any(Number));
  });

  it('FE-PDFIMAGES-001b: a photo is decoded near thumbnail size, not in full', async () => {
    await shrinkPdfImages([`${origin}/uploads/places/a.jpg`]);

    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(Blob), { resizeHeight: 312, resizeQuality: 'medium' });
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
