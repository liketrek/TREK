import { describe, expect, it } from 'vitest';

import type { BookSpread, BookTextElement } from '@trek/shared';
import { bookTextElementSchema } from '@trek/shared';

import {
  caseStyle,
  curveAnchor,
  defaultBand,
  defaultOutline,
  defaultShadow,
  firstFillPhoto,
  hasTextEffects,
  isHollow,
  letterFill,
  lineAnchor,
  lineCentres,
  outlineStrokeMm,
  photoCover,
  ptToMm,
  svgId,
  withAlpha,
} from './textEffects';

const text = (over: Record<string, unknown> = {}): BookTextElement =>
  bookTextElementSchema.parse({
    id: 't1',
    kind: 'text',
    frame: { x: 0, y: 0, w: 100, h: 40 },
    text: 'Lisbon',
    size: 36,
    ...over,
  });

describe('which texts take the effect path', () => {
  it('leaves a plain text, and one set to the plain values, to the plain renderer', () => {
    expect(hasTextEffects(text())).toBe(false);
    expect(hasTextEffects(text({ transform: 'none', vAlign: 'top', outline: null, fit: 'shrink' }))).toBe(false);
  });

  it('takes every effect that draws', () => {
    for (const over of [
      { transform: 'upper' },
      { vAlign: 'middle' },
      { outline: { color: '#111111', width: 0.4 } },
      { shadow: { dx: 1, dy: 1, color: '#111111' } },
      { highlight: { color: '#111111' } },
      { curve: { type: 'arc' } },
      { fillPaint: { type: 'solid', color: '#111111', alpha: 0.5 } },
    ]) {
      expect(hasTextEffects(text(over)), JSON.stringify(over)).toBe(true);
    }
  });
});

describe('colours and strokes', () => {
  it('keeps an opaque colour its hex and spells a translucent one out', () => {
    expect(withAlpha('#ff8000')).toBe('#ff8000');
    expect(withAlpha('#ff8000', 0.5)).toBe('rgba(255, 128, 0, 0.5)');
    expect(withAlpha('#ff8000', -1)).toBe('rgba(255, 128, 0, 0)');
  });

  it('fills the letters with the colour, a solid fill, or nothing under a photo', () => {
    expect(letterFill(text({ color: '#222222' }))).toBe('#222222');
    expect(letterFill(text({ fillPaint: { type: 'solid', color: '#0f766e', alpha: 0.4 } }))).toBe(
      'rgba(15, 118, 110, 0.4)'
    );
    expect(letterFill(text({ fillPaint: { type: 'photo', photoId: 3 } }))).toBeNull();
  });

  it('strokes a solid letter twice the outline, a hollow one at it, and nothing without one', () => {
    const outline = { color: '#111111', width: 0.5 };
    expect(outlineStrokeMm(text({ outline }))).toBe(1);
    const hollow = text({ outline, fillPaint: { type: 'solid', color: '#111111', alpha: 0 } });
    expect(isHollow(hollow)).toBe(true);
    expect(outlineStrokeMm(hollow)).toBe(0.5);
    expect(outlineStrokeMm(text())).toBe(0);
  });

  it('cases the letters in CSS', () => {
    expect(caseStyle(text({ transform: 'upper' }))).toEqual({ textTransform: 'uppercase' });
    expect(caseStyle(text({ transform: 'lower' }))).toEqual({ textTransform: 'lowercase' });
    expect(caseStyle(text({ transform: 'smallcaps' }))).toEqual({ fontVariantCaps: 'small-caps' });
    expect(caseStyle(text())).toEqual({});
  });
});

describe('where a drawn text sits', () => {
  it('anchors a line by the alignment, across the frame and along a curve', () => {
    expect(lineAnchor('left', 100)).toEqual({ x: 0, anchor: 'start' });
    expect(lineAnchor('center', 100)).toEqual({ x: 50, anchor: 'middle' });
    expect(lineAnchor('right', 100)).toEqual({ x: 100, anchor: 'end' });
    expect(lineAnchor('justify', 100)).toEqual({ x: 0, anchor: 'start' });
    expect(curveAnchor('center')).toEqual({ offset: '50%', anchor: 'middle' });
    expect(curveAnchor('right')).toEqual({ offset: '100%', anchor: 'end' });
  });

  it('stacks the lines at the leading, at the top, middle or foot of the frame', () => {
    expect(lineCentres(2, 10, 1, 40, 'top')).toEqual([5, 15]);
    expect(lineCentres(2, 10, 1, 40, 'middle')).toEqual([15, 25]);
    expect(lineCentres(2, 10, 1, 40, 'bottom')).toEqual([25, 35]);
    expect(lineCentres(1, 10, 1.2, 40, undefined)).toEqual([6]);
  });

  it('covers the letters with the photo, zoomed about the focal point', () => {
    expect(photoCover(100, 40, { focalX: 0.5, focalY: 0.5, zoom: 1 })).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      preserveAspectRatio: 'xMidYMid slice',
    });
    const zoomed = photoCover(100, 40, { focalX: 0, focalY: 1, zoom: 2 });
    expect(zoomed).toEqual({ x: -0, y: -40, width: 200, height: 80, preserveAspectRatio: 'xMinYMax slice' });
  });

  it('makes an id fit for url(#…) out of React’s', () => {
    expect(svgId('tc-', ':r12:')).toBe('tc-r12');
    expect(ptToMm(72)).toBeCloseTo(25.4, 6);
  });
});

describe('an effect as it is switched on', () => {
  it('arrives in a colour that stands out from the letters, sized from them', () => {
    const dark = text({ color: '#1a1a1a', size: 72 });
    expect(defaultOutline(dark)).toEqual({ color: '#ffffff', width: 1.27 });
    expect(defaultShadow(dark)).toEqual({ dx: 2.03, dy: 2.03, color: '#ffffff', alpha: 1 });
    expect(defaultBand(dark)).toEqual({ color: '#ffffff', alpha: 1, padX: 6.35, padY: 1.52, radius: 0 });
    expect(defaultOutline(text({ color: '#ffffff', size: 4 })).width).toBe(0.1);
  });

  it('fills with a photo of the page first, then with the first of the journey', () => {
    const spread = {
      id: 'sp',
      role: 'inner',
      background: null,
      parked: [],
      entryId: null,
      elements: [{ kind: 'photo', photoId: 9 }],
    } as unknown as BookSpread;
    expect(firstFillPhoto(spread, [{ photoId: 2 }])).toBe(9);
    expect(firstFillPhoto(undefined, [{ photoId: 2 }])).toBe(2);
    expect(firstFillPhoto(undefined, [])).toBeNull();
  });
});
