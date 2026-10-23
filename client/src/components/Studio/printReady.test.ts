/**
 * FE-STUDIO-PRINT-001 to FE-STUDIO-PRINT-004
 *
 * When the print view of a book may be printed: every picture in, the SVG
 * ones too wherever they sit (a map marker, a photo behind a clip path), and
 * a ceiling that gives a book of many photographs longer before the Save
 * button gives up waiting.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { printReadyCeilingMs, svgImagesToWait, whenReady } from './printReady';

const SVG = 'http://www.w3.org/2000/svg';
const XLINK = 'http://www.w3.org/1999/xlink';

/** A print document as the frame holds it, built from markup. */
function printDoc(markup: string): Document {
  const doc = document.implementation.createHTMLDocument('print');
  doc.body.innerHTML = markup;
  return doc;
}

/** An iframe whose document and window are the given ones, as the print view's frame is once it loaded. */
function frameOf(doc: Document, win: Partial<Window> = {}): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  Object.defineProperty(iframe, 'contentDocument', { value: doc, configurable: true });
  Object.defineProperty(iframe, 'contentWindow', { value: win, configurable: true });
  return iframe;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('the pictures to wait for', () => {
  it('FE-STUDIO-PRINT-001: finds an SVG image inside a clip path and in the defs, not only a marker photo', () => {
    const doc = printDoc(
      `<svg xmlns="${SVG}"><defs><clipPath id="c"><image href="/a.jpg"/></clipPath>` +
        `<image id="d" href="/b.jpg"/></defs><image href="/c.jpg"/></svg>`
    );
    expect(svgImagesToWait(doc).map((el) => el.getAttribute('href'))).toEqual(['/a.jpg', '/b.jpg', '/c.jpg']);
  });

  it('FE-STUDIO-PRINT-002: takes an xlink source, and leaves out an image that names none and would never load', () => {
    const doc = printDoc(`<svg xmlns="${SVG}"><image/></svg>`);
    const linked = doc.createElementNS(SVG, 'image');
    linked.setAttributeNS(XLINK, 'xlink:href', '/x.jpg');
    doc.querySelector('svg')?.appendChild(linked);
    expect(svgImagesToWait(doc)).toEqual([linked]);
  });
});

describe('the ceiling', () => {
  it('FE-STUDIO-PRINT-003: waits eight seconds for an ordinary book and fifteen for one of more than 40 photos', () => {
    expect(printReadyCeilingMs(0)).toBe(8000);
    expect(printReadyCeilingMs(40)).toBe(8000);
    expect(printReadyCeilingMs(41)).toBe(15000);
  });

  it('FE-STUDIO-PRINT-004: holds a large book past eight seconds while an image is still loading', async () => {
    vi.useFakeTimers();
    const many = Array.from({ length: 41 }, (_, i) => `<image href="/p${i}.jpg"/>`).join('');
    const doc = printDoc(`<svg xmlns="${SVG}">${many}</svg>`);
    let ready = false;
    // A window without its own timers: the wait falls back to the global one, which the fake timers drive.
    void whenReady(frameOf(doc)).then(() => {
      ready = true;
    });

    await vi.advanceTimersByTimeAsync(8100);
    expect(ready).toBe(false);
    await vi.advanceTimersByTimeAsync(7000);
    expect(ready).toBe(true);
  });
});
