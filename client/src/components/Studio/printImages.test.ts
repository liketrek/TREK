/**
 * FE-STUDIO-PRINTIMG-001 to FE-STUDIO-PRINTIMG-004
 *
 * The print view hands a book's photographs their sources a few at a time, so
 * a large journey does not ask for every original at once (#3102).
 */
import { describe, expect, it } from 'vitest';

import { PRINT_SRC_ATTR } from './bookRender';
import { loadPrintImages } from './printImages';

/** A print document with `count` deferred photos. */
function printDoc(count: number): { doc: Document; imgs: HTMLImageElement[] } {
  const doc = document.implementation.createHTMLDocument('print');
  doc.body.innerHTML = Array.from(
    { length: count },
    (_, i) => `<img ${PRINT_SRC_ATTR}="/api/photos/${i}/original">`
  ).join('');
  return { doc, imgs: Array.from(doc.images) };
}

/**
 * Answers each source the loader sets, on the next tick, the way a browser fires
 * load or error. `fails` says how many times a source errors before it loads;
 * a source mapped to Infinity never answers. Tracks the most in flight at once.
 */
function answer(imgs: HTMLImageElement[], fails: Record<string, number> = {}) {
  const state = { inFlight: 0, maxInFlight: 0, requests: [] as string[] };
  for (const img of imgs) {
    Object.defineProperty(img, 'src', {
      configurable: true,
      get: () => img.getAttribute('src') ?? '',
      set: (src: string) => {
        img.setAttribute('src', src);
        state.requests.push(src);
        if (fails[src] === Infinity) return;
        state.inFlight++;
        state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
        setTimeout(() => {
          state.inFlight--;
          const left = fails[src] ?? 0;
          if (left > 0) {
            fails[src] = left - 1;
            img.dispatchEvent(new Event('error'));
          } else img.dispatchEvent(new Event('load'));
        }, 0);
      },
    });
  }
  return state;
}

describe('loadPrintImages', () => {
  it('FE-STUDIO-PRINTIMG-001: loads every deferred photo with no more than the limit in flight', async () => {
    const { doc, imgs } = printDoc(10);
    const state = answer(imgs);
    const progress: string[] = [];
    await loadPrintImages(doc, { concurrency: 3, onProgress: (done, total) => progress.push(`${done}/${total}`) });
    expect(state.maxInFlight).toBe(3);
    expect(imgs.every((img) => img.getAttribute('src')?.startsWith('/api/photos/'))).toBe(true);
    expect(imgs.some((img) => img.hasAttribute(PRINT_SRC_ATTR))).toBe(false);
    expect(progress[progress.length - 1]).toBe('10/10');
  });

  it('FE-STUDIO-PRINTIMG-002: asks once more for a photo that failed', async () => {
    const { doc, imgs } = printDoc(1);
    const state = answer(imgs, { '/api/photos/0/original': 1 });
    await loadPrintImages(doc);
    expect(state.requests).toEqual(['/api/photos/0/original', '/api/photos/0/original']);
    expect(imgs[0].getAttribute('src')).toBe('/api/photos/0/original');
  });

  it('FE-STUDIO-PRINTIMG-003: gives up on a photo that never answers, so the others and the button still finish', async () => {
    const { doc, imgs } = printDoc(2);
    answer(imgs, { '/api/photos/0/original': Infinity });
    const progress: number[] = [];
    await loadPrintImages(doc, { timeoutMs: 5, onProgress: (done) => progress.push(done) });
    expect(progress).toEqual([1, 2]);
    expect(imgs[1].getAttribute('src')).toBe('/api/photos/1/original');
  });

  it('FE-STUDIO-PRINTIMG-004: a book without photos is ready at once', async () => {
    const { doc } = printDoc(0);
    await expect(loadPrintImages(doc)).resolves.toBeUndefined();
  });
});
