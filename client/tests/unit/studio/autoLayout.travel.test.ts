import { describe, it, expect, vi } from 'vitest'

/*
 * These cases are about the layouts written in autoLayout.ts, which are what an
 * entry falls back on when no hand-drawn template suits it. With the real
 * templates in place they would be testing whichever spread somebody last drew
 * in Studio — so the set is empty here on purpose.
 */
vi.mock('../../../src/components/Studio/bookTemplates.data', () => ({ SPREAD_TEMPLATES: [] }))
import type { BookPageSetup, BookSpread, JourneyStats } from '@trek/shared'
import { buildBook, emptyBook, type AutoEntry, type AutoInput } from '../../../src/components/Studio/autoLayout'
import { bookPageSetupSchema } from '@trek/shared'

/**
 * The auto layout, once it knows what the journey adds up to (#1973).
 *
 * The rule these all circle: a page is added because there is something to put
 * on it. A summary spread over a journey with no coordinates, or a country page
 * for a trip that never left one country, is padding — and padding in a book
 * someone pays to have printed is worse than a shorter book.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

const entry = (over: Partial<AutoEntry> = {}): AutoEntry => ({
  id: 1, title: 'A day', story: 'Something happened.', location: 'Reykjavík',
  date: '2026-06-02', photos: [], ...over,
})

const stats = (over: Partial<JourneyStats> = {}): JourneyStats => ({
  journeyId: 6,
  distance: 1_189_000,
  days: 14,
  steps: 14,
  photos: 57,
  places: 21,
  furthest: 408_000,
  countries: [{ code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' }],
  points: [
    { lat: 64.14, lng: -21.94, label: 'Reykjavík', date: '2026-06-02', country: 'IS', tripId: null, photoId: null },
    { lat: 65.68, lng: -18.12, label: 'Akureyri', date: '2026-06-06', country: 'IS', tripId: null, photoId: null },
  ],
  trips: [],
  start: '2026-06-02',
  end: '2026-06-15',
  ...over,
})

function build(over: Partial<AutoInput> = {}) {
  return buildBook({
    locale: 'en',
    title: 'Iceland',
    subtitle: null,
    coverPhotoId: null,
    stationsLabel: 'Stations',
    dayLabel: 'DAY',
    summaryLabel: 'Trip summary',
    countriesLabel: 'Countries',
    entries: [entry()],
    page,
    stats: stats(),
    ...over,
  })
}

type ElementKind = BookSpread['elements'][number]['kind']

const kinds = (sp: BookSpread) => sp.elements.map(e => e.kind)
/** `Array.prototype.at` is ES2022; the client's lib target predates it. */
const last = <T,>(xs: T[]): T => xs[xs.length - 1]
const has = (doc: { spreads: BookSpread[] }, kind: ElementKind) =>
  doc.spreads.some(sp => kinds(sp).includes(kind))
const find = (doc: { spreads: BookSpread[] }, kind: ElementKind) =>
  doc.spreads.flatMap(sp => sp.elements).find(e => e.kind === kind)

describe('the summary spread', () => {
  it('is placed, with the route and the figures', () => {
    const doc = build()
    expect(has(doc, 'map')).toBe(true)
    expect(has(doc, 'stats')).toBe(true)
  })

  it('comes straight after the cover, before the entries', () => {
    const doc = build()
    expect(doc.spreads[0].role).toBe('cover')
    expect(kinds(doc.spreads[1])).toContain('map')
  })

  it('carries the journey figures rather than placeholders', () => {
    const el = find(build(), 'stats')!
    expect(el.kind === 'stats' && el.values.distance).toBe(1_189_000)
    expect(el.kind === 'stats' && el.values.days).toBe(14)
  })

  it('draws the route from the journey stops', () => {
    const el = find(build(), 'map')!
    expect(el.kind === 'map' && el.points).toHaveLength(2)
    expect(el.kind === 'map' && el.countries).toEqual(['IS'])
  })

  /*
   * The point of the whole feature: a figure that is zero is not a fact worth
   * a tile, it is a hole in the composition.
   */
  it('leaves out the figures the journey does not have', () => {
    const el = find(build({ stats: stats({ photos: 0, furthest: 0 }) }), 'stats')!
    expect(el.kind === 'stats' && el.metrics).not.toContain('photos')
    expect(el.kind === 'stats' && el.metrics).not.toContain('furthest')
    expect(el.kind === 'stats' && el.metrics).toContain('distance')
  })

  it('has no map when the journey has no route to draw', () => {
    const doc = build({ stats: stats({ points: [] }) })
    expect(has(doc, 'map')).toBe(false)
    // The figures are still worth a page.
    expect(has(doc, 'stats')).toBe(true)
  })

  it('is skipped entirely when there is nothing to summarise', () => {
    const doc = build({
      stats: stats({
        points: [], distance: 0, days: 0, steps: 0, photos: 0, places: 0, furthest: 0, countries: [],
      }),
    })
    // Cover, the one entry, back cover — no summary, no country page.
    expect(doc.spreads.map(sp => sp.role)).toEqual(['cover', 'inner', 'back'])
    expect(has(doc, 'map')).toBe(false)
    expect(has(doc, 'stats')).toBe(false)
  })

  it('is skipped when the figures could not be fetched at all', () => {
    const doc = build({ stats: null })
    expect(has(doc, 'map')).toBe(false)
    expect(has(doc, 'stats')).toBe(false)
    expect(has(doc, 'countries')).toBe(false)
    // And the book still builds: cover, the entry, back cover.
    expect(doc.spreads).toHaveLength(3)
  })
})

describe('the country page', () => {
  const twoCountries = stats({
    countries: [
      { code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' },
      { code: 'NO', name: 'Norway', places: 3, firstVisit: '2026-06-16' },
    ],
  })

  it('is placed for a journey that crossed a border', () => {
    const el = find(build({ stats: twoCountries }), 'countries')!
    expect(el.kind === 'countries' && el.codes).toEqual(['IS', 'NO'])
  })

  /*
   * One country on a page of its own says nothing the cover did not already
   * say, and every page in a printed book costs money.
   */
  it('is skipped for a journey that stayed in one country', () => {
    expect(has(build(), 'countries')).toBe(false)
  })

  it('names the countries in the book language, not the API language', () => {
    const el = find(build({ stats: twoCountries, locale: 'de' }), 'countries')!
    expect(el.kind === 'countries' && el.names).toEqual(['Island', 'Norwegen'])
  })

  it('falls back to the API name when the locale has none', () => {
    const el = find(build({ stats: twoCountries, locale: 'en' }), 'countries')!
    expect(el.kind === 'countries' && el.names).toEqual(['Iceland', 'Norway'])
  })

  it('sits between the summary and the entries', () => {
    const doc = build({ stats: twoCountries })
    const order = doc.spreads.map(sp => kinds(sp).find(k => k === 'map' || k === 'countries') ?? sp.role)
    expect(order.slice(0, 3)).toEqual(['cover', 'map', 'countries'])
  })
})

describe('the back cover', () => {
  /*
   * It used to build its tally as `${places} Orte` — German, hardcoded, in a
   * book that follows the app's language everywhere else.
   */
  it('closes with a figures element rather than a built string', () => {
    const back = last(build().spreads)
    expect(back.role).toBe('back')
    expect(kinds(back)).toContain('stats')
    expect(back.elements.every(e => e.kind !== 'text' || !/Orte|Fotos/.test(e.text))).toBe(true)
  })

  it('sets that tally quietly, against the dark card', () => {
    const back = last(build().spreads)
    const el = back.elements.find(e => e.kind === 'stats')!
    expect(el.kind === 'stats' && el.showIcons).toBe(false)
    expect(el.opacity).toBeLessThan(1)
  })

  /*
   * places and steps are separate figures — a journal with entries but no
   * linked trip has steps and no places at all, and the tile printed "0".
   */
  it('leaves out the places tally when the journey has none', () => {
    const back = last(build({ stats: stats({ places: 0, steps: 4 }) }).spreads)
    const el = back.elements.find(e => e.kind === 'stats')!
    expect(el.kind === 'stats' && el.metrics).not.toContain('places')
  })

  it('still closes the book when there are no figures', () => {
    const back = last(build({ stats: null }).spreads)
    expect(back.role).toBe('back')
    expect(kinds(back)).toContain('text')
  })
})

describe('the entry spreads', () => {
  it('rules the heading with a short accent line', () => {
    const doc = build()
    const spread = doc.spreads.find(sp => sp.entryId === 1)!
    const rule = spread.elements.find(e => e.kind === 'shape' && e.frame.h < 1)
    expect(rule).toBeTruthy()
    expect(rule!.frame.w).toBeLessThan(20)
  })

  /*
   * The one spread with room to spare — the left page is otherwise blank, and
   * a date set as a numeral turns a gap in the book into a pause in it.
   */
  it('sets the date as a numeral on an entry with no photographs', () => {
    const doc = build()
    const spread = doc.spreads.find(sp => sp.entryId === 1)!
    const badge = spread.elements.find(e => e.kind === 'badge')
    expect(badge).toBeTruthy()
    expect(badge!.kind === 'badge' && badge.variant).toBe('date')
    expect(badge!.kind === 'badge' && badge.text).toBe('2')
    expect(badge!.kind === 'badge' && badge.sub).toBe('JUNE')
  })

  it('sets that numeral in the book language', () => {
    const doc = build({ locale: 'de' })
    const spread = doc.spreads.find(sp => sp.entryId === 1)!
    const badge = spread.elements.find(e => e.kind === 'badge')!
    expect(badge.kind === 'badge' && badge.sub).toBe('JUNI')
  })

  it('leaves out the numeral on an undated entry rather than printing a blank', () => {
    const doc = build({ entries: [entry({ date: null })] })
    const spread = doc.spreads.find(sp => sp.entryId === 1)!
    expect(spread.elements.some(e => e.kind === 'badge')).toBe(false)
  })

  /*
   * The marks came back on purpose. A page carrying a picture, a date numeral
   * and a day chip is what a printed travel book looks like; the same page with
   * only the picture is what a document looks like.
   */
  it('gives a photo entry the marks that make it a printed page', () => {
    const doc = build({
      entries: [entry({ photos: [{ photoId: 1, width: 4000, height: 3000, caption: null }] })],
    })
    const spread = doc.spreads.find(sp => sp.entryId === 1)!
    expect(spread.elements.some(e => e.kind === 'photo')).toBe(true)
    expect(spread.elements.some(e => e.kind === 'badge')).toBe(true)
  })
})

describe('the document as a whole', () => {
  it('stays within the schema cap on spreads', () => {
    const many = Array.from({ length: 200 }, (_, i) => entry({ id: i + 1 }))
    expect(build({ entries: many }).spreads.length).toBeLessThanOrEqual(150)
  })

  it('gives every spread and every element an id of its own', () => {
    const doc = build({ stats: stats({ countries: [
      { code: 'IS', name: 'Iceland', places: 4, firstVisit: '2026-06-02' },
      { code: 'NO', name: 'Norway', places: 2, firstVisit: '2026-06-16' },
    ] }) })
    const ids = doc.spreads.flatMap(sp => [sp.id, ...sp.elements.map(e => e.id)])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('opens on the cover and closes on the back cover', () => {
    const doc = build()
    expect(doc.spreads[0].role).toBe('cover')
    expect(last(doc.spreads).role).toBe('back')
    expect(doc.spreads.filter(sp => sp.role === 'cover')).toHaveLength(1)
    expect(doc.spreads.filter(sp => sp.role === 'back')).toHaveLength(1)
  })
})

/**
 * What a journey with no book opens on (#1973).
 *
 * The auto layout used to run on first open, which decided what the book was
 * before its author had said anything. It is now on the Auto layout menu and
 * this is what takes its place: a book with nothing on its pages, and both
 * covers present because the pages rail can only ever insert between them.
 */
describe('an empty book', () => {
  const input: AutoInput = {
    locale: 'en',
    title: 'Iceland',
    subtitle: null,
    coverPhotoId: null,
    stationsLabel: 'Stations',
    dayLabel: 'DAY',
    summaryLabel: 'Trip summary',
    countriesLabel: 'Countries',
    entries: [entry()],
    page,
    stats: stats(),
  }

  it('has a cover, a page and a back cover, and nothing on any of them', () => {
    const doc = emptyBook(input)
    expect(doc.spreads.map(s => s.role)).toEqual(['cover', 'inner', 'back'])
    expect(doc.spreads.every(s => s.elements.length === 0)).toBe(true)
    expect(doc.spreads.every(s => s.background === null)).toBe(true)
  })

  it('carries the journey title and the page setup it was given', () => {
    const doc = emptyBook(input)
    expect(doc.title).toBe('Iceland')
    expect(doc.page.pageWidth).toBe(page.pageWidth)
  })

  it('gives every spread its own id', () => {
    const ids = emptyBook(input).spreads.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  /*
   * The layout is still there, on the menu. This is the difference between
   * offering it and having already applied it.
   */
  it('is what the auto layout replaces when somebody asks for it', () => {
    expect(buildBook(input).spreads.length).toBeGreaterThan(emptyBook(input).spreads.length)
  })
})
