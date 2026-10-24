import { BOOK_GRIDS, bookGridElements, defaultBookGridBox, findBookGrid, type BookGridDef } from './book-grids';
import { bookPageSetupSchema, type BookPageSetup } from './book.schema';

import { describe, expect, it } from 'vitest';

/**
 * Photo grids (#1973), moved with their code from the Studio
 * (client/tests/unit/studio/grids.test.ts).
 *
 * The rules worth pinning are geometric: a grid must tile the box it is given
 * without gaps or overlaps, and the block it produces must occupy exactly that
 * box: a grid asked to fill the safe area that overhangs it by one gutter is
 * a grid that has to be dragged before it is any use.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210',
  pageWidth: 210,
  pageHeight: 210,
  bleed: 3,
  safe: 5,
});

const box = { x: 0, y: 0, w: 100, h: 100 };
const grid = (id: string) => findBookGrid(id) as BookGridDef;

describe('the grid catalogue', () => {
  it('BOOKGRID-001: gives every grid a unique id', () => {
    const ids = BOOK_GRIDS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('BOOKGRID-002: gives every grid at least one cell', () => {
    for (const g of BOOK_GRIDS) expect(g.cells.length, g.id).toBeGreaterThan(0);
  });

  it('BOOKGRID-003: keeps every cell inside the unit block', () => {
    for (const g of BOOK_GRIDS) {
      for (const cell of g.cells) {
        expect(cell.x, g.id).toBeGreaterThanOrEqual(0);
        expect(cell.y, g.id).toBeGreaterThanOrEqual(0);
        expect(cell.x + cell.w, g.id).toBeLessThanOrEqual(1.0001);
        expect(cell.y + cell.h, g.id).toBeLessThanOrEqual(1.0001);
        expect(cell.w, g.id).toBeGreaterThan(0);
        expect(cell.h, g.id).toBeGreaterThan(0);
      }
    }
  });

  /*
   * Tiling grids cover the block exactly. The staggered and band arrangements
   * deliberately do not, they are compositions with air around them, so they
   * are checked for "no overlap" only, further down.
   */
  it('BOOKGRID-004: tiles the block completely, for the grids that are meant to', () => {
    const tiling = BOOK_GRIDS.filter((g) => !/stagger|band|filmstrip/.test(g.id));
    for (const g of tiling) {
      const area = g.cells.reduce((sum, c) => sum + c.w * c.h, 0);
      expect(area, g.id).toBeCloseTo(1, 5);
    }
  });

  it('BOOKGRID-005: never overlaps two cells', () => {
    for (const g of BOOK_GRIDS) {
      g.cells.forEach((a, i) => {
        g.cells.slice(i + 1).forEach((b, k) => {
          const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          const overlaps = overlapX > 0.0001 && overlapY > 0.0001;
          expect(overlaps, `${g.id}: cell ${i} and ${i + 1 + k}`).toBe(false);
        });
      });
    }
  });

  it('BOOKGRID-006: finds a grid by id, and nothing for an unknown id', () => {
    expect(findBookGrid('grid-9')?.cells).toHaveLength(9);
    expect(findBookGrid('nope')).toBeUndefined();
  });
});

describe('bookGridElements', () => {
  it('BOOKGRID-007: makes one empty photo frame per cell', () => {
    const els = bookGridElements(grid('grid-4'), box, 0);
    expect(els).toHaveLength(4);
    for (const el of els) {
      expect(el.kind).toBe('photo');
      expect(el.kind === 'photo' && el.photoId).toBeNull();
    }
  });

  it('BOOKGRID-008: gives every frame its own id', () => {
    const els = bookGridElements(grid('grid-9'), box, 0);
    expect(new Set(els.map((e) => e.id)).size).toBe(els.length);
  });

  it('BOOKGRID-009: fills the box exactly when there is no gutter', () => {
    const els = bookGridElements(grid('grid-4'), box, 0);
    expect(Math.min(...els.map((e) => e.frame.x))).toBeCloseTo(0, 6);
    expect(Math.min(...els.map((e) => e.frame.y))).toBeCloseTo(0, 6);
    expect(Math.max(...els.map((e) => e.frame.x + e.frame.w))).toBeCloseTo(100, 6);
    expect(Math.max(...els.map((e) => e.frame.y + e.frame.h))).toBeCloseTo(100, 6);
  });

  /*
   * The gutter comes out of the cells, not out of the block. Added between them
   * instead, a four-across grid would be three gutters wider than the box it
   * was told to fill, and would hang off the safe area it was aligned to.
   */
  it('BOOKGRID-010: keeps the block inside its box once a gutter is applied', () => {
    for (const el of bookGridElements(grid('grid-6'), box, 4)) {
      expect(el.frame.x).toBeGreaterThanOrEqual(-0.001);
      expect(el.frame.y).toBeGreaterThanOrEqual(-0.001);
      expect(el.frame.x + el.frame.w).toBeLessThanOrEqual(100.001);
      expect(el.frame.y + el.frame.h).toBeLessThanOrEqual(100.001);
    }
  });

  it('BOOKGRID-011: leaves the block edges flush and only splits the interior gaps', () => {
    const gutter = 6;
    const [a, b] = [...bookGridElements(grid('two-across'), box, gutter)].sort((x, y) => x.frame.x - y.frame.x);
    if (!a || !b) throw new Error('two frames expected');
    // Outer edges untouched...
    expect(a.frame.x).toBeCloseTo(0, 6);
    expect(b.frame.x + b.frame.w).toBeCloseTo(100, 6);
    // ...and exactly one gutter between them.
    expect(b.frame.x - (a.frame.x + a.frame.w)).toBeCloseTo(gutter, 6);
  });

  it('BOOKGRID-012: offsets the whole block when the box does not start at the origin', () => {
    const els = bookGridElements(grid('single'), { x: 20, y: 30, w: 50, h: 40 }, 0);
    expect(els[0]?.frame).toMatchObject({ x: 20, y: 30, w: 50, h: 40 });
  });

  it('BOOKGRID-013: never produces a frame too small to see, even from a tiny box', () => {
    for (const el of bookGridElements(grid('grid-12'), { x: 0, y: 0, w: 8, h: 8 }, 6)) {
      expect(el.frame.w).toBeGreaterThanOrEqual(2);
      expect(el.frame.h).toBeGreaterThanOrEqual(2);
    }
  });

  it('BOOKGRID-014: carries the corner radius onto every frame', () => {
    for (const el of bookGridElements(grid('grid-4'), box, 3, 5)) expect(el.kind === 'photo' && el.radius).toBe(5);
  });

  it('BOOKGRID-015: produces frames for every grid in the catalogue without a bad number', () => {
    for (const g of BOOK_GRIDS) {
      for (const el of bookGridElements(g, box, 3)) {
        for (const v of [el.frame.x, el.frame.y, el.frame.w, el.frame.h]) {
          expect(Number.isFinite(v), g.id).toBe(true);
        }
      }
    }
  });
});

describe('defaultBookGridBox', () => {
  it('BOOKGRID-016: spans both pages of a spread', () => {
    const b = defaultBookGridBox(page, false);
    expect(b.x + b.w).toBeCloseTo(page.pageWidth * 2 - b.x, 6);
    expect(b.w).toBeGreaterThan(page.pageWidth);
  });

  it('BOOKGRID-017: stays on one page for a cover', () => {
    const b = defaultBookGridBox(page, true);
    expect(b.x + b.w).toBeLessThanOrEqual(page.pageWidth);
  });

  it('BOOKGRID-018: keeps clear of the safe area rather than landing on it', () => {
    const b = defaultBookGridBox(page, true);
    expect(b.x).toBeGreaterThanOrEqual(page.safe);
    expect(b.y).toBeGreaterThanOrEqual(page.safe);
  });

  it('BOOKGRID-019: is symmetric, so a grid dropped into it looks centred', () => {
    const b = defaultBookGridBox(page, false);
    expect(b.x).toBeCloseTo(page.pageWidth * 2 - (b.x + b.w), 6);
    expect(b.y).toBeCloseTo(page.pageHeight - (b.y + b.h), 6);
  });
});
