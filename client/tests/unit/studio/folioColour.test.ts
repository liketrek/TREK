import { describe, it, expect } from 'vitest'
import type { BookElement, BookSpread } from '@trek/shared'
import { brightness, folioInk } from '../../../src/components/Studio/folioColour'

/**
 * Choosing a folio colour (#1973).
 *
 * One fixed colour is wrong on half the pages of any real book: the warm grey
 * that reads on paper vanishes into a full-bleed night photograph, and white
 * vanishes the moment the page is white. So the renderer asks what is under the
 * number. What follows is that question, and the order it has to be asked in.
 */

const DARK = '#3f3a33'
const LIGHT = '#ffffff'

const shape = (over: Partial<BookElement> = {}): BookElement => ({
  id: 's', kind: 'shape', frame: { x: 0, y: 0, w: 100, h: 100 },
  rotation: 0, opacity: 1, locked: false,
  shape: 'rect', fill: '#000000', gradient: 'none',
  stroke: null, strokeWidth: 0, strokeStyle: 'solid', radius: 0,
  ...over,
} as BookElement)

const photo = (over: Partial<BookElement> = {}): BookElement => ({
  id: 'p', kind: 'photo', frame: { x: 0, y: 0, w: 100, h: 100 },
  rotation: 0, opacity: 1, locked: false,
  photoId: 1, fit: 'cover', focalX: 0.5, focalY: 0.5,
  radius: 0, filter: 'none', mask: null, frameStyle: 'none',
  ...over,
} as BookElement)

const text = (over: Partial<BookElement> = {}): BookElement => ({
  id: 't', kind: 'text', frame: { x: 0, y: 0, w: 100, h: 100 },
  rotation: 0, opacity: 1, locked: false,
  text: 'x', font: 'sans', size: 12, color: '#000000',
  align: 'left', lineHeight: 1.3, letterSpacing: 0, weight: 400, italic: false,
  ...over,
} as unknown as BookElement)

const spread = (elements: BookElement[], background: string | null = '#ffffff'): BookSpread => ({
  id: 's1', role: 'inner', background, elements, parked: [], entryId: null,
})

describe('brightness', () => {
  it('reads the ends of the range', () => {
    expect(brightness('#000000')).toBe(0)
    expect(brightness('#ffffff')).toBe(1)
  })

  it('weights green the way an eye does', () => {
    expect(brightness('#00ff00')).toBeGreaterThan(brightness('#ff0000'))
    expect(brightness('#ff0000')).toBeGreaterThan(brightness('#0000ff'))
  })

  it('takes a three-digit hex', () => {
    expect(brightness('#fff')).toBe(1)
  })
})

describe('an empty page', () => {
  it('takes dark ink on white paper', () => {
    expect(folioInk(spread([]), 50, 50).color).toBe(DARK)
  })

  it('takes light ink on a dark page', () => {
    expect(folioInk(spread([], '#101014'), 50, 50).color).toBe(LIGHT)
  })

  it('treats a page with no colour set as paper', () => {
    expect(folioInk(spread([], null), 50, 50).color).toBe(DARK)
  })
})

describe('under a shape', () => {
  it('takes light ink over a dark fill', () => {
    expect(folioInk(spread([shape({ fill: '#111111' })]), 50, 50).color).toBe(LIGHT)
  })

  it('takes dark ink over a pale fill, even on a dark page', () => {
    const s = spread([shape({ fill: '#f5f0e8' })], '#101014')
    expect(folioInk(s, 50, 50).color).toBe(DARK)
  })

  /* The array is paint order, so the last one drawn is the one you see. */
  it('asks the topmost element, not the first', () => {
    const s = spread([
      shape({ id: 'under', fill: '#ffffff' }),
      shape({ id: 'over', fill: '#000000' }),
    ])
    expect(folioInk(s, 50, 50).color).toBe(LIGHT)
  })

  it('ignores a shape the number does not sit on', () => {
    const s = spread([shape({ fill: '#000000', frame: { x: 0, y: 0, w: 20, h: 20 } })])
    expect(folioInk(s, 80, 80).color).toBe(DARK)
  })

  /* A nearly transparent panel does not decide what is underneath it. */
  it('looks past something barely there', () => {
    const s = spread([shape({ fill: '#000000', opacity: 0.15 })])
    expect(folioInk(s, 50, 50).color).toBe(DARK)
  })

  it('looks past a shape with no fill at all', () => {
    const s = spread([shape({ fill: 'transparent' })], '#101014')
    expect(folioInk(s, 50, 50).color).toBe(LIGHT)
  })
})

describe('over a photograph', () => {
  /*
   * Unknowable without decoding it — and a printed photograph is dark far more
   * often than not. White with a hairline of shadow reads on all of them.
   */
  it('goes white, with a shadow to survive the pale ones', () => {
    const ink = folioInk(spread([photo()]), 50, 50)
    expect(ink.color).toBe(LIGHT)
    expect(ink.shadow).toBeTruthy()
  })

  it('adds no shadow anywhere else', () => {
    expect(folioInk(spread([]), 50, 50).shadow).toBeUndefined()
    expect(folioInk(spread([shape({ fill: '#111' })]), 50, 50).shadow).toBeUndefined()
  })
})

describe('type', () => {
  /* A paragraph draws letters on nothing; the page behind it is the background. */
  it('does not count as a background', () => {
    expect(folioInk(spread([text()], '#101014'), 50, 50).color).toBe(LIGHT)
  })
})
