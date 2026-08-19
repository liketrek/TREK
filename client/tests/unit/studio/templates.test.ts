import { describe, it, expect } from 'vitest'
import type { BookPageSetup } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { COVER_TEMPLATES, TEMPLATES, applyTemplate } from '../../../src/components/Studio/templates'

/**
 * Layouts (#1973).
 *
 * The cover set exists because a cover is a different problem from a spread:
 * one page, type as the subject rather than as a caption. A spread layout
 * applied to it lands half its frames past the edge of the page, which is why
 * the two sets are kept apart rather than filtered out of one.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210,
})

describe('the layout catalogue', () => {
  it('gives every layout a unique id across both sets', () => {
    const ids = [...TEMPLATES, ...COVER_TEMPLATES].map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every layout at least one slot', () => {
    for (const tpl of [...TEMPLATES, ...COVER_TEMPLATES]) {
      expect(tpl.build(page).length, tpl.id).toBeGreaterThan(0)
    }
  })

  it('counts its photo slots honestly', () => {
    for (const tpl of [...TEMPLATES, ...COVER_TEMPLATES]) {
      const drawn = tpl.build(page).filter(s => s.kind === 'photo').length
      expect(drawn, tpl.id).toBe(tpl.photoSlots)
    }
  })

  it('gives every slot a frame with a positive size', () => {
    for (const tpl of [...TEMPLATES, ...COVER_TEMPLATES]) {
      for (const slot of tpl.build(page)) {
        expect(slot.frame.w, tpl.id).toBeGreaterThan(0)
        expect(slot.frame.h, tpl.id).toBeGreaterThan(0)
      }
    }
  })
})

describe('the cover set', () => {
  it('is marked as single-page throughout', () => {
    for (const tpl of COVER_TEMPLATES) {
      expect(tpl.role, tpl.id).toBe('single')
    }
  })

  /*
   * The rule that makes them a separate set: everything stays on one page.
   * A frame reaching past pageWidth would be half in the fold of a book that
   * has no fold there.
   */
  it('keeps every frame on the one page', () => {
    for (const tpl of COVER_TEMPLATES) {
      for (const slot of tpl.build(page)) {
        expect(slot.frame.x, `${tpl.id} x`).toBeGreaterThanOrEqual(-page.bleed - 0.01)
        expect(slot.frame.x + slot.frame.w, `${tpl.id} right`)
          .toBeLessThanOrEqual(page.pageWidth + page.bleed + 0.01)
        expect(slot.frame.y + slot.frame.h, `${tpl.id} bottom`)
          .toBeLessThanOrEqual(page.pageHeight + page.bleed + 0.01)
      }
    }
  })

  it('always has somewhere for the title', () => {
    for (const tpl of COVER_TEMPLATES) {
      expect(tpl.build(page).some(s => s.kind === 'heading'), tpl.id).toBe(true)
    }
  })

  it('includes one that needs no photograph at all', () => {
    expect(COVER_TEMPLATES.some(t => t.photoSlots === 0)).toBe(true)
  })
})

describe('the spread set', () => {
  it('is not marked single, so the panel keeps the two apart', () => {
    for (const tpl of TEMPLATES) {
      expect(tpl.role ?? 'inner', tpl.id).toBe('inner')
    }
  })

  it('stays within the spread', () => {
    for (const tpl of TEMPLATES) {
      for (const slot of tpl.build(page)) {
        expect(slot.frame.x + slot.frame.w, `${tpl.id} right`)
          .toBeLessThanOrEqual(page.pageWidth * 2 + page.bleed + 0.01)
      }
    }
  })

  it('offers a range of photo counts rather than five versions of one idea', () => {
    const counts = new Set(TEMPLATES.map(t => t.photoSlots))
    expect(counts.size).toBeGreaterThanOrEqual(6)
  })
})

describe('applying a cover layout', () => {
  const spread = {
    id: 'c1', role: 'cover' as const, background: null, parked: [], entryId: null,
    elements: [
      {
        id: 'p1', kind: 'photo' as const, frame: { x: 0, y: 0, w: 50, h: 50 },
        rotation: 0, opacity: 1, locked: false, photoId: 42, fit: 'cover' as const,
        focalX: 0.5, focalY: 0.5, radius: 0, filter: 'none' as const,
        mask: null, frameStyle: 'none' as const,
      },
      {
        id: 't1', kind: 'text' as const, frame: { x: 0, y: 60, w: 100, h: 20 },
        rotation: 0, opacity: 1, locked: false, text: 'Iceland', font: 'sans' as const,
        size: 30, weight: 700 as const, italic: false, align: 'left' as const,
        leading: 1.1, tracking: 0, color: '#111111', binding: null, overridden: false,
      },
    ],
  }

  it('pours the existing picture and title into the new arrangement', () => {
    const next = applyTemplate(spread, COVER_TEMPLATES[0], page)
    const photo = next.elements.find(e => e.kind === 'photo')
    const text = next.elements.find(e => e.kind === 'text')
    expect(photo?.kind === 'photo' && photo.photoId).toBe(42)
    expect(text?.kind === 'text' && text.text).toBe('Iceland')
  })

  /*
   * Trying the type-only cover must not cost the photograph — it comes back
   * the moment a layout with a frame is applied.
   */
  it('parks what a type-only cover has no room for', () => {
    const quiet = COVER_TEMPLATES.find(t => t.photoSlots === 0)!
    const next = applyTemplate(spread, quiet, page)
    expect(next.elements.some(e => e.kind === 'photo')).toBe(false)
    expect(next.parked.some(e => e.kind === 'photo' && e.photoId === 42)).toBe(true)
  })

  it('brings the parked picture back on a layout that has room', () => {
    const quiet = COVER_TEMPLATES.find(t => t.photoSlots === 0)!
    const parked = applyTemplate(spread, quiet, page)
    const back = applyTemplate(parked, COVER_TEMPLATES[0], page)
    const photo = back.elements.find(e => e.kind === 'photo')
    expect(photo?.kind === 'photo' && photo.photoId).toBe(42)
  })
})
