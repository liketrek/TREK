import {
  alignElements,
  arrangeElements,
  arrangeWithinGroup,
  boundsOfFrames,
  distributableCount,
  distributeElements,
} from './book-arrange';
import {
  bookPageSetupSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  type BookElement,
  type BookSpread,
} from './book.schema';

import { describe, expect, it } from 'vitest';

/**
 * Paint order, alignment and spacing, with groups moving as one. The page is
 * the default square book: 210 mm pages, the fold at 210, 5 mm safe margin.
 */

const pageSetup = bookPageSetupSchema.parse({});

const box = (id: string, x: number, y: number, w = 20, h = 20, over: Partial<BookElement> = {}) =>
  bookShapeElementSchema.parse({ id, kind: 'shape', frame: { x, y, w, h }, shape: 'rect', ...over }) as BookElement;

const spread = (elements: BookElement[]): BookSpread => bookSpreadSchema.parse({ id: 'sp', elements });
const ids = (sp: BookSpread) => sp.elements.map((e) => e.id);
const at = (sp: BookSpread, id: string) => sp.elements.find((e) => e.id === id)?.frame;
const pick = (sp: BookSpread, list: string[]) => sp.elements.filter((e) => list.includes(e.id));

describe('paint order', () => {
  const sp = spread([
    box('a', 0, 0),
    box('g1', 0, 0, 20, 20, { group: 'g' }),
    box('g2', 0, 0, 20, 20, { group: 'g' }),
    box('b', 0, 0),
  ]);

  it('BKARR-001: to front and to back keep the moved ones in their order, and a group together', () => {
    expect(ids(arrangeElements(sp, ['a'], 'front'))).toEqual(['g1', 'g2', 'b', 'a']);
    expect(ids(arrangeElements(sp, ['b'], 'back'))).toEqual(['b', 'a', 'g1', 'g2']);
    // One member moved to the front takes its group along.
    expect(ids(arrangeElements(sp, ['g1'], 'front'))).toEqual(['a', 'b', 'g1', 'g2']);
  });

  it('BKARR-002: forward and backward step one place', () => {
    // A step goes past a whole group, never into it.
    expect(ids(arrangeElements(sp, ['a'], 'forward'))).toEqual(['g1', 'g2', 'a', 'b']);
    expect(ids(arrangeElements(sp, ['g2'], 'backward'))).toEqual(['g1', 'g2', 'a', 'b']);
    expect(arrangeElements(sp, ['b'], 'front')).toBe(sp);
    expect(ids(arrangeElements(spread([box('a', 0, 0), box('b', 0, 0), box('c', 0, 0)]), ['a'], 'forward'))).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(ids(arrangeElements(spread([box('a', 0, 0), box('b', 0, 0), box('c', 0, 0)]), ['c'], 'backward'))).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('BKARR-003: inside a group, a member moves among the members only', () => {
    const grouped = spread([
      box('a', 0, 0),
      box('m1', 0, 0, 20, 20, { group: 'g' }),
      box('m2', 0, 0, 20, 20, { group: 'g' }),
      box('m3', 0, 0, 20, 20, { group: 'g' }),
      box('b', 0, 0),
    ]);
    expect(ids(arrangeWithinGroup(grouped, 'g', ['m1'], 'front'))).toEqual(['a', 'm2', 'm3', 'm1', 'b']);
    expect(ids(arrangeWithinGroup(grouped, 'g', ['m3'], 'back'))).toEqual(['a', 'm3', 'm1', 'm2', 'b']);
    expect(arrangeWithinGroup(grouped, 'g', ['m3'], 'front')).toBe(grouped);
    expect(arrangeWithinGroup(grouped, 'g', ['m3'], 'front').elements[3]?.group).toBe('g');
  });
});

describe('align and distribute', () => {
  it('BKARR-004: lines single elements up on the edge of their box', () => {
    const sp = spread([box('a', 10, 10), box('b', 40, 30)]);
    const left = alignElements(sp, pageSetup, sp.elements, 'left', 'selection');
    expect([at(left, 'a')?.x, at(left, 'b')?.x]).toEqual([10, 10]);
    const bottom = alignElements(sp, pageSetup, sp.elements, 'bottom', 'selection');
    expect([at(bottom, 'a')?.y, at(bottom, 'b')?.y]).toEqual([30, 30]);
    // The other axis is left exactly as it was.
    expect(at(left, 'b')?.y).toBe(30);
  });

  it('BKARR-005: moves a group as one box, and lines a group up inside itself when it is all that is picked', () => {
    const sp = spread([
      box('a', 100, 10),
      box('g1', 10, 50, 20, 20, { group: 'g' }),
      box('g2', 40, 60, 20, 20, { group: 'g' }),
    ]);
    const right = alignElements(sp, pageSetup, sp.elements, 'right', 'selection');
    // The group's box (10..60) goes to the right edge 120 as one: 60 to the right.
    expect([at(right, 'g1')?.x, at(right, 'g2')?.x, at(right, 'a')?.x]).toEqual([70, 100, 100]);
    const inside = alignElements(sp, pageSetup, pick(sp, ['g1', 'g2']), 'top', 'selection');
    expect([at(inside, 'g1')?.y, at(inside, 'g2')?.y]).toEqual([50, 50]);
  });

  it('BKARR-006: aligns against the page under an element, and its safe area', () => {
    const sp = spread([box('r', pageSetup.pageWidth + 90, 10)]);
    const centred = alignElements(sp, pageSetup, sp.elements, 'center', 'page');
    expect(at(centred, 'r')?.x).toBe(pageSetup.pageWidth + (pageSetup.pageWidth - 20) / 2);
    const safe = alignElements(sp, pageSetup, sp.elements, 'top', 'safe');
    expect(at(safe, 'r')?.y).toBe(pageSetup.safe);
    const middle = alignElements(sp, pageSetup, sp.elements, 'middle', 'page');
    expect(at(middle, 'r')?.y).toBe((pageSetup.pageHeight - 20) / 2);
  });

  it('BKARR-007: spaces units evenly, a group counted once, or by a fixed gap', () => {
    const sp = spread([
      box('a', 0, 0),
      box('g1', 30, 0, 10, 10, { group: 'g' }),
      box('g2', 45, 0, 10, 10, { group: 'g' }),
      box('c', 100, 0),
    ]);
    expect(distributableCount(sp, sp.elements)).toBe(3);
    const even = distributeElements(sp, sp.elements, 'horizontal');
    // Span 0..120, sizes 20 + 25 + 20, so two gaps of 27.5; the group moves as one.
    expect([at(even, 'g1')?.x, at(even, 'g2')?.x, at(even, 'c')?.x]).toEqual([47.5, 62.5, 100]);
    const fixed = distributeElements(sp, sp.elements, 'horizontal', 5);
    expect([at(fixed, 'g1')?.x, at(fixed, 'c')?.x]).toEqual([25, 55]);
    const down = distributeElements(
      spread([box('a', 0, 0), box('b', 0, 50), box('c', 0, 30)]),
      spread([box('a', 0, 0), box('b', 0, 50), box('c', 0, 30)]).elements,
      'vertical',
    );
    expect(at(down, 'c')?.y).toBe(25);
  });

  it('BKARR-008: leaves a page with fewer than three units as it is, and measures a box', () => {
    const sp = spread([box('a', 0, 0), box('b', 50, 0)]);
    expect(distributeElements(sp, sp.elements, 'horizontal')).toBe(sp);
    expect(
      boundsOfFrames([
        { x: 1, y: 2, w: 3, h: 4 },
        { x: 10, y: 0, w: 1, h: 1 },
      ]),
    ).toEqual({ x: 1, y: 0, w: 10, h: 6 });
  });
});
