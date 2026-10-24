import { layoutAroundLocks } from './book-layout-locks';
import {
  MAX_SPREAD_ELEMENTS,
  bookShapeElementSchema,
  bookSpreadSchema,
  type BookElement,
  type BookSpread,
} from './book.schema';

import { describe, expect, it } from 'vitest';

/** A page laid out again around its locked elements, for the layout operation and the Studio alike. */

const shape = (id: string, over: Record<string, unknown> = {}) =>
  bookShapeElementSchema.parse({ id, kind: 'shape', frame: { x: 0, y: 0, w: 10, h: 10 }, ...over }) as BookElement;

const page = (elements: BookElement[], over: Record<string, unknown> = {}): BookSpread =>
  bookSpreadSchema.parse({ id: 'sp', role: 'inner', elements, ...over });

/** A layout that throws away what it is given and lays `n` new shapes. */
const fresh =
  (n: number) =>
  (free: BookSpread): BookSpread => ({
    ...free,
    groups: undefined,
    elements: Array.from({ length: n }, (_, i) => shape(`new-${i}`)),
  });

describe('a layout around locked elements', () => {
  it('BKLOCK-001: lays out only what is free, and puts each locked element back at its place in the paint order', () => {
    const seen: string[][] = [];
    const out = layoutAroundLocks(
      page([shape('back', { locked: true }), shape('a'), shape('front', { locked: true }), shape('b')]),
      (free) => {
        seen.push(free.elements.map((e) => e.id));
        return fresh(3)(free);
      },
    );
    expect(seen).toEqual([['a', 'b']]);
    expect(out?.elements.map((e) => e.id)).toEqual(['back', 'new-0', 'front', 'new-1', 'new-2']);
  });

  it('BKLOCK-002: keeps the name of a locked group the layout wrote away', () => {
    const out = layoutAroundLocks(
      page([shape('m1', { locked: true, group: 'g' }), shape('m2', { locked: true, group: 'g' }), shape('a')], {
        groups: [{ id: 'g', name: 'Stamp' }],
      }),
      fresh(1),
    );
    expect(out?.groups).toEqual([{ id: 'g', name: 'Stamp' }]);
    expect(out?.elements.map((e) => e.id)).toEqual(['m1', 'm2', 'new-0']);
  });

  it('BKLOCK-003: answers null when the layout lays nothing, or would overfill the page with the locked ones', () => {
    const locked = page([shape('l', { locked: true }), shape('a')]);
    expect(layoutAroundLocks(locked, () => null)).toBeNull();
    expect(layoutAroundLocks(locked, fresh(MAX_SPREAD_ELEMENTS))).toBeNull();
    expect(layoutAroundLocks(locked, fresh(MAX_SPREAD_ELEMENTS - 1))?.elements).toHaveLength(MAX_SPREAD_ELEMENTS);
  });
});
