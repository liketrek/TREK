import { describe, it, expect } from 'vitest'
import type { BookElement, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { exportSpread, importSpread, MAX_SPREAD_FILE_BYTES } from '../../../src/components/Studio/spreadFile'

/**
 * A spread leaving one book and arriving in another (#1973).
 *
 * Two things are being tested here, and the second matters more than the first:
 * that a design survives the round trip onto a different page size, and that a
 * file somebody else wrote cannot put anything into the document that the
 * person opening it did not ask for.
 */

const square = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210 })
const a4 = bookPageSetupSchema.parse({ preset: 'a4-landscape', pageWidth: 297, pageHeight: 210 })

const el = (over: Record<string, unknown>): BookElement => ({
  id: 'e1', rotation: 0, opacity: 1, locked: false,
  frame: { x: 21, y: 42, w: 105, h: 63 },
  ...over,
} as BookElement)

const spread = (elements: BookElement[], background: string | null = '#faf8f4'): BookSpread => ({
  id: 'sp1', role: 'inner', background, elements, parked: [], entryId: null,
})

describe('exportSpread', () => {
  it('measures everything as a fraction of the page it was drawn on', () => {
    const file = exportSpread(spread([el({ kind: 'shape', shape: 'rect', fill: '#112233' })]), square)
    expect(file.format).toBe('trek.studio.spread')
    expect(file.elements[0]).toMatchObject({
      frame: { x: 0.1, y: 0.2, w: 0.5, h: 0.3 },
    })
  })

  it('leaves the photographs behind', () => {
    const file = exportSpread(spread([el({ kind: 'photo', photoId: 41 })]), square)
    expect((file.elements[0] as { photoId: number | null }).photoId).toBeNull()
  })

  it('leaves the map source behind, because it can carry a token', () => {
    const file = exportSpread(spread([el({
      kind: 'map',
      tileUrl: 'https://api.mapbox.com/styles/v1/x/static/0,0,2/300x200?access_token=pk.SECRET',
      attribution: 'Mapbox',
    })]), square)
    expect(JSON.stringify(file)).not.toContain('SECRET')
  })

  it('does not carry the ids across, since they only mean anything at home', () => {
    const file = exportSpread(spread([el({ kind: 'shape', shape: 'rect' })]), square)
    expect(file.elements[0]).not.toHaveProperty('id')
  })
})

describe('importSpread', () => {
  it('lays a square design out on a landscape page', () => {
    const file = exportSpread(spread([el({ kind: 'shape', shape: 'rect', fill: '#112233' })]), square)
    const back = importSpread(file, a4)!
    expect(back).not.toBeNull()
    // A tenth of the way in, and half the width, on whatever page it lands on.
    expect(back.elements[0].frame.x).toBeCloseTo(29.7, 1)
    expect(back.elements[0].frame.w).toBeCloseTo(148.5, 1)
    expect(back.elements[0].frame.y).toBeCloseTo(42, 1)
  })

  it('keeps the design as it was drawn', () => {
    const file = exportSpread(spread([el({ kind: 'shape', shape: 'rect', fill: '#112233' })]), square)
    const back = importSpread(file, a4)!
    expect(back.background).toBe('#faf8f4')
    expect((back.elements[0] as { fill: string }).fill).toBe('#112233')
  })

  it('refuses a file that is not one of ours', () => {
    expect(importSpread({ hello: 'world' }, a4)).toBeNull()
    expect(importSpread(null, a4)).toBeNull()
    expect(importSpread({ format: 'trek.studio.spread' }, a4)).toBeNull()
  })

  it('drops an element the document contract will not have', () => {
    const back = importSpread({
      format: 'trek.studio.spread',
      version: 1,
      background: null,
      elements: [
        { kind: 'shape', shape: 'rect', fill: '#112233', frame: { x: 0.1, y: 0.1, w: 0.2, h: 0.2 } },
        { kind: 'not-a-thing', frame: { x: 0.1, y: 0.1, w: 0.2, h: 0.2 } },
      ],
    }, a4)!
    expect(back.elements).toHaveLength(1)
  })

  it('will not take a background that is not a colour', () => {
    const back = importSpread({
      format: 'trek.studio.spread',
      version: 1,
      background: 'url(https://example.invalid/pixel.png)',
      elements: [{ kind: 'shape', shape: 'rect', frame: { x: 0.1, y: 0.1, w: 0.2, h: 0.2 } }],
    }, a4)!
    expect(back.background).toBeNull()
  })

  it('blanks a map source the file tried to bring with it', () => {
    const back = importSpread({
      format: 'trek.studio.spread',
      version: 1,
      background: null,
      elements: [{
        kind: 'map',
        tileUrl: 'https://tracker.invalid/{z}/{x}/{y}.png',
        attribution: 'x',
        frame: { x: 0.1, y: 0.1, w: 0.4, h: 0.4 },
      }],
    }, a4)!
    expect((back.elements[0] as { tileUrl: string }).tileUrl).toBe('')
  })

  it('takes no more elements than a spread is allowed to hold', () => {
    const one = { kind: 'shape', shape: 'rect', frame: { x: 0.1, y: 0.1, w: 0.1, h: 0.1 } }
    const back = importSpread({
      format: 'trek.studio.spread',
      version: 1,
      background: null,
      elements: Array.from({ length: 400 }, () => one),
    }, a4)!
    expect(back.elements).toHaveLength(60)
  })

  it('gives every element an id of its own', () => {
    const one = { kind: 'shape', shape: 'rect', frame: { x: 0.1, y: 0.1, w: 0.1, h: 0.1 } }
    const back = importSpread({
      format: 'trek.studio.spread', version: 1, background: null, elements: [one, one, one],
    }, a4)!
    expect(new Set(back.elements.map(e => e.id)).size).toBe(3)
  })

  it('arrives as an inner spread, never as a cover', () => {
    const back = importSpread({
      format: 'trek.studio.spread', version: 1, background: null,
      elements: [{ kind: 'shape', shape: 'rect', frame: { x: 0.1, y: 0.1, w: 0.1, h: 0.1 }, role: 'cover' }],
    }, a4)!
    expect(back.role).toBe('inner')
  })
})

describe('the size limit', () => {
  it('is small enough to be a limit and large enough for any real spread', () => {
    // A full spread of 60 elements, as JSON, against the ceiling the file
    // picker enforces before it reads anything.
    const full = exportSpread(spread(Array.from({ length: 60 }, (_, i) =>
      el({ id: `e${i}`, kind: 'text', text: 'x'.repeat(200) }))), square)
    expect(JSON.stringify(full).length).toBeLessThan(MAX_SPREAD_FILE_BYTES)
    expect(MAX_SPREAD_FILE_BYTES).toBeLessThanOrEqual(2 * 1024 * 1024)
  })
})
