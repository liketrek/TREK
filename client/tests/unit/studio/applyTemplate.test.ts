import { describe, it, expect } from 'vitest'
import type { BookElement, JourneyStats } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { applyTemplate, templateFit, type TemplateEntry } from '../../../src/components/Studio/applyTemplate'
import type { SpreadTemplate } from '../../../src/components/Studio/bookTemplates.data'

/**
 * Laying an entry onto a template somebody drew (#1973).
 *
 * The contract between the person drawing a template and the code using it is
 * a division: what the entry can answer for gets filled, everything else is the
 * design and is copied as drawn. These cases are that division, and the sizing
 * that lets a template drawn on one trim size land on another.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210 })
const ctx = { page, locale: 'en', stats: null, dayLabel: 'DAY' }

/** Fractions of a page, the way the templates store them. */
const el = (over: Record<string, unknown>): BookElement => ({
  id: 't', rotation: 0, opacity: 1, locked: false,
  frame: { x: 0.1, y: 0.1, w: 0.5, h: 0.25 },
  ...over,
} as BookElement)

const template = (elements: BookElement[]): SpreadTemplate => ({
  id: 'ref', background: '#faf8f4', elements,
})

const entry = (over: Partial<TemplateEntry> = {}): TemplateEntry => ({
  id: 7, title: 'A day', story: 'What happened.', location: 'Berlin', date: '2026-07-08',
  photos: [], lat: 52.52, lng: 13.4, country: 'DE', dayNumber: 3, dayCount: 10,
  ...over,
})

const titleEl = el({ kind: 'text', text: 'TITLE', size: 0.1, binding: { source: 'entry.title' } })
const storyEl = el({ kind: 'text', text: 'Lorem', size: 0.05, binding: { source: 'entry.story' } })
const frameEl = el({ kind: 'photo', photoId: null, fit: 'cover', focalX: 0.5, focalY: 0.5, radius: 0, filter: 'none', mask: null, frameStyle: 'none' })
const panelEl = el({ kind: 'shape', shape: 'rect', fill: '#11224f', gradient: 'none', stroke: null, strokeWidth: 0, strokeStyle: 'solid', radius: 0 })

describe('sizing', () => {
  /* Drawn as fractions so a template built on a square lands on an A4 too. */
  it('multiplies the frame back up to the page it is laid on', () => {
    const spread = applyTemplate(template([panelEl]), entry(), ctx)
    expect(spread.elements[0].frame).toEqual({ x: 21, y: 21, w: 105, h: 52.5 })
  })

  it('scales to a different trim size without being redrawn', () => {
    const a4 = bookPageSetupSchema.parse({ preset: 'a4-landscape', pageWidth: 297, pageHeight: 210 })
    const spread = applyTemplate(template([panelEl]), entry(), { ...ctx, page: a4 })
    expect(spread.elements[0].frame.x).toBe(29.7)
    expect(spread.elements[0].frame.w).toBe(148.5)
  })

  it('takes type size off the page height, so it scales with the sheet', () => {
    const spread = applyTemplate(template([titleEl]), entry(), ctx)
    expect((spread.elements[0] as { size: number }).size).toBe(21)
  })
})

describe('what gets filled', () => {
  it('puts the entry title where the template asked for one', () => {
    const spread = applyTemplate(template([titleEl]), entry(), ctx)
    expect((spread.elements[0] as { text: string }).text).toBe('A day')
  })

  it('puts the story in', () => {
    const spread = applyTemplate(template([storyEl]), entry(), ctx)
    expect((spread.elements[0] as { text: string }).text).toBe('What happened.')
  })

  it('takes the photographs in order', () => {
    const photos = [
      { photoId: 11, width: null, height: null },
      { photoId: 22, width: null, height: null },
    ]
    const spread = applyTemplate(template([frameEl, frameEl]), entry({ photos }), ctx)
    expect(spread.elements.map(e => (e as { photoId: number | null }).photoId)).toEqual([11, 22])
  })

  it('leaves a frame empty when the entry runs out of pictures', () => {
    const spread = applyTemplate(
      template([frameEl, frameEl]),
      entry({ photos: [{ photoId: 11, width: null, height: null }] }),
      ctx,
    )
    expect((spread.elements[1] as { photoId: number | null }).photoId).toBeNull()
  })

  it('fills the day chip from the stop', () => {
    const chip = el({ kind: 'badge', variant: 'day', text: 'DAY 1', sub: '', code: null, style: 'chip' })
    const spread = applyTemplate(template([chip]), entry(), ctx)
    expect((spread.elements[0] as { text: string }).text).toBe('DAY 3')
  })

  it('fills the coordinates', () => {
    const mark = el({ kind: 'badge', variant: 'coords', text: '', sub: '', code: null, style: 'plain' })
    const spread = applyTemplate(template([mark]), entry(), ctx)
    expect((spread.elements[0] as { text: string }).text).toContain('52°')
    expect((spread.elements[0] as { text: string }).text).toContain('13°')
  })

  /*
   * A mark the entry cannot answer keeps what it was drawn with. "DAY 1" on an
   * entry with no date reads as a placeholder, which is what it is.
   */
  it('leaves a mark alone when the entry has nothing to put in it', () => {
    const chip = el({ kind: 'badge', variant: 'day', text: 'DAY 1', sub: '', code: null, style: 'chip' })
    const spread = applyTemplate(template([chip]), entry({ dayNumber: null }), ctx)
    expect((spread.elements[0] as { text: string }).text).toBe('DAY 1')
  })

  /* Every other figure on the page follows the book language; so does this one. */
  it('sets the distance in the book language', () => {
    const mark = el({ kind: 'badge', variant: 'distance', text: '', sub: '', code: null, style: 'plain' })
    const travelled = { distance: 1_189_000, countries: [] } as unknown as JourneyStats
    const spread = applyTemplate(template([mark]), entry(), { ...ctx, locale: 'de', stats: travelled })
    expect((spread.elements[0] as { text: string }).text).toBe('1.189 km')
  })

  it('belongs to the entry it was filled from', () => {
    expect(applyTemplate(template([titleEl]), entry(), ctx).entryId).toBe(7)
  })

  it('keeps the paper colour the template was drawn on', () => {
    expect(applyTemplate(template([panelEl]), entry(), ctx).background).toBe('#faf8f4')
  })
})

describe('what is left alone', () => {
  /* The design is the design: a panel stays where it was put. */
  it('copies a decorative shape as drawn, colour and all', () => {
    const spread = applyTemplate(template([panelEl]), entry(), ctx)
    const shape = spread.elements[0] as { fill: string; kind: string }
    expect(shape.kind).toBe('shape')
    expect(shape.fill).toBe('#11224f')
  })

  it('gives every element a fresh id, so two spreads never share one', () => {
    const a = applyTemplate(template([panelEl]), entry(), ctx)
    const b = applyTemplate(template([panelEl]), entry(), ctx)
    expect(a.elements[0].id).not.toBe(b.elements[0].id)
    expect(a.id).not.toBe(b.id)
  })
})

describe('choosing a template', () => {
  /*
   * A template is one *for an entry* when it uses one. The distinction has to
   * come out of the drawing rather than a label: a summary spread of figures
   * and country outlines reads perfectly well on its own, and dropping a day's
   * photographs into it would be nonsense.
   */
  it('refuses one that uses nothing from the entry', () => {
    const summary = template([panelEl, el({ kind: 'text', text: 'SUMMARY', size: 0.1 })])
    expect(templateFit(summary, entry())).toBe(-1)
  })

  it('refuses one that wants a story from an entry with none', () => {
    expect(templateFit(template([storyEl]), entry({ story: null }))).toBe(-1)
  })

  /* Two empty frames on a page with one picture is a finished page with a hole. */
  it('refuses one with more frames than the entry can fill', () => {
    expect(templateFit(template([frameEl, frameEl, frameEl]), entry({ photos: [] }))).toBe(-1)
  })

  it('prefers the one whose frame count matches', () => {
    const photos = [
      { photoId: 1, width: null, height: null },
      { photoId: 2, width: null, height: null },
    ]
    const two = templateFit(template([frameEl, frameEl]), entry({ photos }))
    const one = templateFit(template([frameEl]), entry({ photos }))
    expect(two).toBeGreaterThan(one)
  })

  it('accepts more pictures than frames — the rest are parked', () => {
    const photos = Array.from({ length: 5 }, (_, i) => ({ photoId: i, width: null, height: null }))
    expect(templateFit(template([frameEl]), entry({ photos }))).toBeGreaterThanOrEqual(0)
  })
})
