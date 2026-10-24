import type { BookElement, BookSpread } from '@trek/shared';
import { bookShapeElementSchema } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { MIN_FRAME_MM, boxOf, mapFrame, marqueeHits, rectBetween, resizeBox } from './studioGestures';

const base = { x: 10, y: 10, w: 40, h: 20 };

describe('resizeBox', () => {
  it('moves the dragged edges and keeps the opposite ones', () => {
    expect(resizeBox(base, 'se', { dx: 10, dy: 5 }, false)).toEqual({ x: 10, y: 10, w: 50, h: 25 });
    expect(resizeBox(base, 'nw', { dx: 10, dy: 5 }, false)).toEqual({ x: 20, y: 15, w: 30, h: 15 });
    expect(resizeBox(base, 'e', { dx: 10, dy: 99 }, false)).toEqual({ x: 10, y: 10, w: 50, h: 20 });
    expect(resizeBox(base, 'n', { dx: 99, dy: -10 }, false)).toEqual({ x: 10, y: 0, w: 40, h: 30 });
  });

  it('never turns a box inside out, stopping at the minimum against the fixed edge', () => {
    expect(resizeBox(base, 'w', { dx: 100, dy: 0 }, false)).toEqual({
      x: 50 - MIN_FRAME_MM,
      y: 10,
      w: MIN_FRAME_MM,
      h: 20,
    });
    expect(resizeBox(base, 's', { dx: 0, dy: -100 }, false).h).toBe(MIN_FRAME_MM);
  });

  it('keeps the proportions with Shift, led by the larger move', () => {
    expect(resizeBox(base, 'se', { dx: 40, dy: 0 }, true)).toEqual({ x: 10, y: 10, w: 80, h: 40 });
    expect(resizeBox(base, 'se', { dx: 0, dy: 20 }, true)).toEqual({ x: 10, y: 10, w: 80, h: 40 });
    const nw = resizeBox(base, 'nw', { dx: -40, dy: 0 }, true);
    expect(nw).toEqual({ x: -30, y: -10, w: 80, h: 40 });
  });

  it('grows the other side about the middle on an edge handle with Shift', () => {
    expect(resizeBox(base, 'e', { dx: 40, dy: 0 }, true)).toEqual({ x: 10, y: 0, w: 80, h: 40 });
    expect(resizeBox(base, 's', { dx: 0, dy: 20 }, true)).toEqual({ x: -10, y: 10, w: 80, h: 40 });
  });

  it('holds the minimum on both sides when the proportions are kept', () => {
    const tiny = resizeBox(base, 'se', { dx: -100, dy: -100 }, true);
    expect(tiny.h).toBeGreaterThanOrEqual(MIN_FRAME_MM);
    expect(tiny.w / tiny.h).toBeCloseTo(2);
  });
});

describe('carrying frames along', () => {
  it('scales a frame inside a box with it', () => {
    const from = { x: 0, y: 0, w: 100, h: 50 };
    const to = { x: 10, y: 10, w: 200, h: 100 };
    expect(mapFrame({ x: 50, y: 25, w: 20, h: 10 }, from, to)).toEqual({ x: 110, y: 60, w: 40, h: 20 });
    expect(mapFrame(from, from, to)).toEqual(to);
  });

  it('measures the box around frames and the rectangle between two points', () => {
    expect(boxOf([base, { x: 0, y: 40, w: 5, h: 5 }])).toEqual({ x: 0, y: 10, w: 50, h: 35 });
    expect(rectBetween(30, 40, 10, 5)).toEqual({ x: 10, y: 5, w: 20, h: 35 });
  });
});

describe('marqueeHits', () => {
  const el = (id: string, x: number, y: number, w: number, h: number, over: Partial<BookElement> = {}) =>
    bookShapeElementSchema.parse({ id, kind: 'shape', frame: { x, y, w, h }, shape: 'rect', ...over }) as BookElement;
  const spread = {
    id: 'sp',
    role: 'inner',
    background: null,
    parked: [],
    entryId: null,
    elements: [
      el('bg', -3, -3, 426, 216),
      el('a', 10, 10, 20, 20),
      el('g1', 60, 10, 20, 20, { group: 'g' }),
      el('g2', 150, 150, 20, 20, { group: 'g' }),
      el('locked', 12, 12, 5, 5, { locked: true }),
      el('hidden', 12, 12, 5, 5, { hidden: true }),
    ],
  } as BookSpread;

  it('catches what it touches with its whole group, not a page-sized element around it', () => {
    expect(marqueeHits(spread, { x: 0, y: 0, w: 70, h: 40 })).toEqual(['a', 'g1', 'g2']);
  });

  it('leaves locked and hidden elements out, and a zero rectangle catches nothing', () => {
    expect(marqueeHits(spread, { x: 5, y: 5, w: 10, h: 10 })).toEqual(['a']);
    // Drawn wholly inside an element, it is the element's background case: nothing.
    expect(marqueeHits(spread, { x: 11, y: 11, w: 2, h: 2 })).toEqual([]);
    expect(marqueeHits(spread, { x: 11, y: 11, w: 0, h: 0 })).toEqual([]);
  });
});
