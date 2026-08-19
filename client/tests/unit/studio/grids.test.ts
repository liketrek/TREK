import { describe, it, expect } from 'vitest'
import type { BookPageSetup } from '@trek/shared'
import { GRIDS, defaultGridBox, gridElements } from '../../../src/components/Studio/grids'
import { bookPageSetupSchema } from '@trek/shared'

/**
 * Photo grids (#1973).
 *
 * The rules worth pinning are geometric: a grid must tile the box it is given
 * without gaps or overlaps, and the block it produces must occupy exactly that
 * box — a grid asked to fill the safe area that overhangs it by one gutter is
 * a grid that has to be dragged before it is any use.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

const box = { x: 0, y: 0, w: 100, h: 100 }

describe('the grid catalogue', () => {
  it('gives every grid a unique id', () => {
    const ids = GRIDS.map(g => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every grid at least one cell', () => {
    for (const grid of GRIDS) expect(grid.cells.length, grid.id).toBeGreaterThan(0)
  })

  it('keeps every cell inside the unit block', () => {
    for (const grid of GRIDS) {
      for (const cell of grid.cells) {
        expect(cell.x, grid.id).toBeGreaterThanOrEqual(0)
        expect(cell.y, grid.id).toBeGreaterThanOrEqual(0)
        expect(cell.x + cell.w, grid.id).toBeLessThanOrEqual(1.0001)
        expect(cell.y + cell.h, grid.id).toBeLessThanOrEqual(1.0001)
        expect(cell.w, grid.id).toBeGreaterThan(0)
        expect(cell.h, grid.id).toBeGreaterThan(0)
      }
    }
  })

  /*
   * Tiling grids cover the block exactly. The staggered and band arrangements
   * deliberately do not — they are compositions with air around them — so they
   * are checked for "no overlap" only, further down.
   */
  it('tiles the block completely, for the grids that are meant to', () => {
    const tiling = GRIDS.filter(g => !/stagger|band|filmstrip/.test(g.id))
    for (const grid of tiling) {
      const area = grid.cells.reduce((sum, c) => sum + c.w * c.h, 0)
      expect(area, grid.id).toBeCloseTo(1, 5)
    }
  })

  it('never overlaps two cells', () => {
    for (const grid of GRIDS) {
      for (let i = 0; i < grid.cells.length; i++) {
        for (let j = i + 1; j < grid.cells.length; j++) {
          const a = grid.cells[i]
          const b = grid.cells[j]
          const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
          const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
          const overlaps = overlapX > 0.0001 && overlapY > 0.0001
          expect(overlaps, `${grid.id}: cell ${i} and ${j}`).toBe(false)
        }
      }
    }
  })
})

describe('gridElements', () => {
  it('makes one empty photo frame per cell', () => {
    const els = gridElements(GRIDS.find(g => g.id === 'grid-4')!, box, 0)
    expect(els).toHaveLength(4)
    for (const el of els) {
      expect(el.kind).toBe('photo')
      expect(el.kind === 'photo' && el.photoId).toBeNull()
    }
  })

  it('gives every frame its own id', () => {
    const els = gridElements(GRIDS.find(g => g.id === 'grid-9')!, box, 0)
    expect(new Set(els.map(e => e.id)).size).toBe(els.length)
  })

  it('fills the box exactly when there is no gutter', () => {
    const els = gridElements(GRIDS.find(g => g.id === 'grid-4')!, box, 0)
    const left = Math.min(...els.map(e => e.frame.x))
    const top = Math.min(...els.map(e => e.frame.y))
    const right = Math.max(...els.map(e => e.frame.x + e.frame.w))
    const bottom = Math.max(...els.map(e => e.frame.y + e.frame.h))
    expect(left).toBeCloseTo(0, 6)
    expect(top).toBeCloseTo(0, 6)
    expect(right).toBeCloseTo(100, 6)
    expect(bottom).toBeCloseTo(100, 6)
  })

  /*
   * The gutter comes out of the cells, not out of the block. Added between them
   * instead, a four-across grid would be three gutters wider than the box it
   * was told to fill, and would hang off the safe area it was aligned to.
   */
  it('keeps the block inside its box once a gutter is applied', () => {
    const els = gridElements(GRIDS.find(g => g.id === 'grid-6')!, box, 4)
    for (const el of els) {
      expect(el.frame.x).toBeGreaterThanOrEqual(-0.001)
      expect(el.frame.y).toBeGreaterThanOrEqual(-0.001)
      expect(el.frame.x + el.frame.w).toBeLessThanOrEqual(100.001)
      expect(el.frame.y + el.frame.h).toBeLessThanOrEqual(100.001)
    }
  })

  it('leaves the block edges flush and only splits the interior gaps', () => {
    const gutter = 6
    const els = gridElements(GRIDS.find(g => g.id === 'two-across')!, box, gutter)
    const [a, b] = [...els].sort((x, y) => x.frame.x - y.frame.x)
    // Outer edges untouched...
    expect(a.frame.x).toBeCloseTo(0, 6)
    expect(b.frame.x + b.frame.w).toBeCloseTo(100, 6)
    // ...and exactly one gutter between them.
    expect(b.frame.x - (a.frame.x + a.frame.w)).toBeCloseTo(gutter, 6)
  })

  it('offsets the whole block when the box does not start at the origin', () => {
    const els = gridElements(GRIDS.find(g => g.id === 'single')!, { x: 20, y: 30, w: 50, h: 40 }, 0)
    expect(els[0].frame).toMatchObject({ x: 20, y: 30, w: 50, h: 40 })
  })

  it('never produces a frame too small to see, even from a tiny box', () => {
    const els = gridElements(GRIDS.find(g => g.id === 'grid-12')!, { x: 0, y: 0, w: 8, h: 8 }, 6)
    for (const el of els) {
      expect(el.frame.w).toBeGreaterThanOrEqual(2)
      expect(el.frame.h).toBeGreaterThanOrEqual(2)
    }
  })

  it('carries the corner radius onto every frame', () => {
    const els = gridElements(GRIDS.find(g => g.id === 'grid-4')!, box, 3, 5)
    for (const el of els) expect(el.kind === 'photo' && el.radius).toBe(5)
  })

  it('produces frames for every grid in the catalogue without a bad number', () => {
    for (const grid of GRIDS) {
      for (const el of gridElements(grid, box, 3)) {
        for (const v of [el.frame.x, el.frame.y, el.frame.w, el.frame.h]) {
          expect(Number.isFinite(v), grid.id).toBe(true)
        }
      }
    }
  })
})

describe('defaultGridBox', () => {
  it('spans both pages of a spread', () => {
    const b = defaultGridBox(page, false)
    expect(b.x + b.w).toBeCloseTo(page.pageWidth * 2 - b.x, 6)
    expect(b.w).toBeGreaterThan(page.pageWidth)
  })

  it('stays on one page for a cover', () => {
    const b = defaultGridBox(page, true)
    expect(b.x + b.w).toBeLessThanOrEqual(page.pageWidth)
  })

  it('keeps clear of the safe area rather than landing on it', () => {
    const b = defaultGridBox(page, true)
    expect(b.x).toBeGreaterThanOrEqual(page.safe)
    expect(b.y).toBeGreaterThanOrEqual(page.safe)
  })

  it('is symmetric, so a grid dropped into it looks centred', () => {
    const b = defaultGridBox(page, false)
    expect(b.x).toBeCloseTo(page.pageWidth * 2 - (b.x + b.w), 6)
    expect(b.y).toBeCloseTo(page.pageHeight - (b.y + b.h), 6)
  })
})
