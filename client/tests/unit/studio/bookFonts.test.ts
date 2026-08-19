import { describe, it, expect } from 'vitest'
import { BOOK_FONTS_IDS, bookTextElementSchema } from '@trek/shared'
import {
  BOOK_FONTS, BOOK_FONT_ORDER, fontStack, hasWeight, nearestWeight,
} from '../../../src/components/Studio/bookFonts'

/**
 * The book's typefaces (#1973).
 *
 * The rule the whole file exists for: a book is proofread on screen and printed
 * somewhere else, so every family has to be one both machines have. A stack
 * naming a system font — Georgia, which is on most desktops and on no Linux
 * container — means the renderer substitutes silently and the printed book is
 * set in a typeface nobody chose.
 */

describe('the registry', () => {
  it('has an entry for every family the contract allows', () => {
    for (const id of BOOK_FONTS_IDS) {
      expect(BOOK_FONTS[id], id).toBeTruthy()
    }
  })

  it('offers every family in the picker, in one order', () => {
    expect([...BOOK_FONT_ORDER].sort()).toEqual([...BOOK_FONTS_IDS].sort())
    expect(new Set(BOOK_FONT_ORDER).size).toBe(BOOK_FONT_ORDER.length)
  })

  /*
   * The one that matters. Every stack must end in a generic — a stack ending in
   * another named family is a stack that can silently land somewhere nobody
   * bundled.
   */
  it('ends every stack in a generic family', () => {
    for (const id of BOOK_FONTS_IDS) {
      const last = BOOK_FONTS[id].stack.split(',').pop()!.trim()
      expect(['sans-serif', 'serif', 'monospace'], `${id}: ${last}`).toContain(last)
    }
  })

  it('names a bundled family first in every stack', () => {
    // The first entry is the one that will actually be used, so it is the one
    // that has to be self-hosted.
    const bundled = ['Poppins', 'Inter', 'Lora', 'EB Garamond', 'Playfair Display', 'MuseoModerno', 'Bebas Neue']
    for (const id of BOOK_FONTS_IDS) {
      const first = BOOK_FONTS[id].stack.split(',')[0].replace(/"/g, '').trim()
      expect(bundled, `${id}: ${first}`).toContain(first)
    }
  })

  it('keeps the three original ids, so old documents still parse', () => {
    for (const id of ['sans', 'serif', 'display']) {
      expect(BOOK_FONTS_IDS).toContain(id)
    }
    expect(bookTextElementSchema.parse({
      id: 't', kind: 'text', frame: { x: 0, y: 0, w: 10, h: 10 }, font: 'serif',
    }).font).toBe('serif')
  })

  it('no longer sets the serif slot in a system font', () => {
    expect(BOOK_FONTS.serif.stack).toContain('Lora')
    expect(BOOK_FONTS.serif.stack.split(',')[0]).not.toContain('Georgia')
  })

  it('gives every family at least one weight', () => {
    for (const id of BOOK_FONTS_IDS) {
      expect(BOOK_FONTS[id].weights.length, id).toBeGreaterThan(0)
    }
  })
})

describe('fontStack', () => {
  it('resolves a known family', () => {
    expect(fontStack('garamond')).toContain('EB Garamond')
  })

  /*
   * A document naming a family that was later removed should render in
   * something bundled, not in whatever the machine defaults to.
   */
  it('falls back to a bundled family rather than to a generic', () => {
    expect(fontStack('a-family-that-was-removed')).toBe(BOOK_FONTS.sans.stack)
  })
})

describe('weights', () => {
  it('reports what a family actually ships', () => {
    expect(hasWeight('sans', 700)).toBe(true)
    expect(hasWeight('bebas', 700)).toBe(false)
    expect(hasWeight('bebas', 400)).toBe(true)
  })

  /*
   * A synthesised bold is a smeared regular in print, so picking a display face
   * that ships one weight has to move the weight rather than ask for one the
   * renderer will fake.
   */
  it('moves to the nearest weight a family really has', () => {
    expect(nearestWeight('bebas', 700)).toBe(400)
    expect(nearestWeight('sans', 700)).toBe(700)
  })

  it('leaves an unknown family alone rather than guessing', () => {
    expect(nearestWeight('unknown', 600)).toBe(600)
    expect(hasWeight('unknown', 600)).toBe(true)
  })
})
