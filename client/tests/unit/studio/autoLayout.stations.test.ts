import { describe, it, expect, vi } from 'vitest'

/*
 * These cases are about the layouts written in autoLayout.ts, which are what an
 * entry falls back on when no hand-drawn template suits it. With the real
 * templates in place they would be testing whichever spread somebody last drew
 * in Studio — so the set is empty here on purpose.
 */
vi.mock('../../../src/components/Studio/bookTemplates.data', () => ({ SPREAD_TEMPLATES: [] }))
import { bookDocumentSchema, bookPageSetupSchema, type BookSpread } from '@trek/shared'
import { buildBook, type AutoEntry, type AutoInput } from '../../../src/components/Studio/autoLayout'

/**
 * A journey with little in it (#1973).
 *
 * A journey built from a trip starts as one skeleton entry per stop: a date, a
 * place name, nothing else. Each of those used to take a spread of its own — a
 * numeral on the left, a heading on the right, and two-thirds of a metre of
 * empty paper. Ten stops made ten of them, and the book was a stack of blanks.
 *
 * They share a page now. What follows is that, and the two things it must not
 * break: the order the journey happened in, and the entries that do have
 * something on them.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210 })

const bare = (id: number, over: Partial<AutoEntry> = {}): AutoEntry => ({
  id, title: `Stop ${id}`, story: null, location: 'Berlin', date: '2026-07-07', photos: [], ...over,
})

const rich = (id: number): AutoEntry => ({
  id, title: `Day ${id}`, story: 'Something actually happened here.',
  location: 'Berlin', date: '2026-07-08', photos: [],
})

const document = (entries: AutoEntry[]) => buildBook({
  locale: 'en', title: 'T', subtitle: null, coverPhotoId: null,
  entries, page, stats: null, stationsLabel: 'Stations', dayLabel: 'DAY', summaryLabel: 'Trip summary', countriesLabel: 'Countries',
})

function build(entries: AutoEntry[]): BookSpread[] {
  return document(entries).spreads
}

/** The inner spreads, which is where entries land. */
const inner = (spreads: BookSpread[]) => spreads.filter(s => s.role === 'inner')

describe('entries with nothing on them', () => {
  it('share one page instead of taking one each', () => {
    const spreads = inner(build([bare(1), bare(2), bare(3), bare(4), bare(5)]))
    expect(spreads).toHaveLength(1)
  })

  it('all appear on it', () => {
    const spreads = inner(build([bare(1), bare(2), bare(3)]))
    const words = spreads[0].elements.map(e => (e as { text?: string }).text ?? '').join(' ')
    expect(words).toContain('Stop 1')
    expect(words).toContain('Stop 2')
    expect(words).toContain('Stop 3')
  })

  it('carries the heading it was given, translated by the caller', () => {
    const spreads = inner(build([bare(1)]))
    const words = spreads[0].elements.map(e => (e as { text?: string }).text ?? '').join(' ')
    expect(words).toContain('STATIONS')
  })

  /* Nothing to regenerate a list from, so it is not tied to a single entry. */
  it('belongs to no single entry', () => {
    expect(inner(build([bare(1), bare(2)]))[0].entryId).toBeNull()
  })

  it('runs onto a second page when there are more than fit', () => {
    const many = Array.from({ length: 30 }, (_, i) => bare(i + 1))
    expect(inner(build(many))).toHaveLength(2)
  })

  /*
   * And the list it runs onto is one the server will take (#2085).
   *
   * This fixture already built the document that could not be saved; it only
   * ever counted the spreads. The save route parses against the contract, not
   * against normalizeBookDocument, so that is what a layout has to satisfy.
   */
  it('produces a document the save route accepts, however long the run', () => {
    const many = Array.from({ length: 200 }, (_, i) => bare(i + 1))
    expect(bookDocumentSchema.safeParse(document(many)).success).toBe(true)
  })

  /*
   * The old behaviour, restated as the thing that must not come back: one
   * spread per stop, each of them nearly empty.
   */
  it('does not give ten stops ten spreads', () => {
    const spreads = inner(build(Array.from({ length: 10 }, (_, i) => bare(i + 1))))
    expect(spreads.length).toBeLessThan(10)
  })
})

describe('mixed with real entries', () => {
  it('leaves an entry with a story its own spread', () => {
    const spreads = inner(build([rich(1)]))
    expect(spreads).toHaveLength(1)
    expect(spreads[0].entryId).toBe(1)
  })

  /*
   * The order the journey happened in is the order the book is in. Gathering
   * every bare entry at the end would be tidier and wrong.
   */
  it('keeps the run where it happened, between the entries around it', () => {
    const spreads = inner(build([rich(1), bare(2), bare(3), rich(4)]))
    expect(spreads.map(s => s.entryId)).toEqual([1, null, 4])
  })

  it('starts a new list after each entry that interrupts one', () => {
    const spreads = inner(build([bare(1), rich(2), bare(3)]))
    expect(spreads.map(s => s.entryId)).toEqual([null, 2, null])
  })

  /* A photograph is substance too, even with nothing written. */
  it('treats an entry with a photo as one worth a spread', () => {
    const withPhoto: AutoEntry = { ...bare(1), photos: [{ photoId: 5, width: 4000, height: 3000 }] }
    expect(inner(build([withPhoto]))[0].entryId).toBe(1)
  })
})

describe('an entry with words but no pictures', () => {
  /*
   * An entry with no photographs is usually one whose photographs have not been
   * added yet. The page it deserves is the one it will look like once they are,
   * so the layout puts the frames in and leaves them empty — the renderer draws
   * them as outlines and a dropped photo fills one.
   */
  it('lays out the frames the pictures will go in', () => {
    const spread = inner(build([rich(1)]))[0]
    const frames = spread.elements.filter(e => e.kind === 'photo')
    expect(frames.length).toBeGreaterThan(0)
    expect(frames.every(f => (f as { photoId: number | null }).photoId === null)).toBe(true)
  })

  it('gives the frame most of a page rather than a token strip', () => {
    const spread = inner(build([rich(1)]))[0]
    const frame = spread.elements.find(e => e.kind === 'photo')!.frame
    // A page is 210 × 210. Anything much smaller is decoration, not somewhere
    // a photograph goes.
    expect(frame.w).toBeGreaterThan(150)
    expect(frame.h).toBeGreaterThan(150)
  })

  /*
   * The bug this replaced: everything sat in the middle of the left page and
   * the right one was empty, because the layout used half a page width where
   * it meant the far page. A spread has two pages and both get used.
   */
  it('uses both pages, picture on the left and words on the right', () => {
    const spread = inner(build([rich(1)]))[0]
    const frame = spread.elements.find(e => e.kind === 'photo')!.frame
    expect(frame.x).toBeLessThan(210)

    const words = spread.elements.filter(e => e.kind === 'text')
    expect(words.length).toBeGreaterThan(0)
    // Every line of type starts on the right-hand page.
    expect(words.every(w => w.frame.x >= 210)).toBe(true)
  })

  it('keeps everything inside the sheet', () => {
    const spread = inner(build([rich(1)]))[0]
    expect(spread.elements.every(e => e.frame.x + e.frame.w <= 420 && e.frame.y + e.frame.h <= 210)).toBe(true)
  })

  it('still writes the story', () => {
    const spread = inner(build([rich(1)]))[0]
    const words = spread.elements.map(e => (e as { text?: string }).text ?? '').join(' ')
    expect(words).toContain('Something actually happened here.')
  })
})

describe('a journey with nothing at all', () => {
  it('produces a book of a cover and a back, and no blank pages between', () => {
    const spreads = build([])
    expect(inner(spreads)).toHaveLength(0)
    expect(spreads.map(s => s.role)).toEqual(['cover', 'back'])
  })
})
