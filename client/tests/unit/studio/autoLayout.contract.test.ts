import { describe, it, expect } from 'vitest'
import type { BookPageSetup, JourneyStats } from '@trek/shared'
import { bookDocumentSchema, bookPageSetupSchema } from '@trek/shared'
import { buildBook, emptyBook, type AutoEntry, type AutoInput } from '../../../src/components/Studio/autoLayout'

/**
 * The auto layout writes journey data straight into a book document, and the
 * save route parses that document against the contract before storing it — so
 * anything the layout produces that the contract will not take is a book that
 * cannot be saved at all, for the rest of the session (#2085).
 *
 * These cases feed it journeys past every cap the contract sets and assert the
 * one thing that matters: whatever comes out, the server would take it.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

const long = (n: number) => 'x'.repeat(n)

const entry = (over: Partial<AutoEntry> = {}): AutoEntry => ({
  id: 1, title: 'A day', story: 'Something happened.', location: 'Reykjavík',
  date: '2026-06-02', photos: [], ...over,
})

const stats = (over: Partial<JourneyStats> = {}): JourneyStats => ({
  journeyId: 6, distance: 1_189_000, days: 14, steps: 14, photos: 57, places: 21, furthest: 408_000,
  countries: [{ code: 'IS', name: 'Iceland', places: 14, firstVisit: '2026-06-02' }],
  points: [
    { lat: 64.14, lng: -21.94, label: 'Reykjavík', date: '2026-06-02', country: 'IS', tripId: null, photoId: null },
    { lat: 65.68, lng: -18.12, label: 'Akureyri', date: '2026-06-06', country: 'IS', tripId: null, photoId: null },
  ],
  trips: [], start: '2026-06-02', end: '2026-06-15',
  ...over,
})

const input = (over: Partial<AutoInput> = {}): AutoInput => ({
  locale: 'en', title: 'Iceland', subtitle: null, coverPhotoId: null,
  stationsLabel: 'Stations', dayLabel: 'DAY', summaryLabel: 'Trip summary', countriesLabel: 'Countries',
  entries: [entry()], page, stats: stats(), ...over,
})

/** The contract's own verdict, with the offending fields named when it refuses. */
const savable = (doc: unknown) => {
  const parsed = bookDocumentSchema.safeParse(doc)
  return parsed.success
    ? { ok: true as const }
    : { ok: false as const, at: parsed.error.issues.map(i => i.path.join('.')) }
}

describe('a laid-out book is a book the server will take', () => {
  it('when an entry runs longer than a text element may hold', () => {
    expect(savable(buildBook(input({ entries: [entry({ story: long(20_000) })] })))).toEqual({ ok: true })
  })

  it('when a stop carries a place name longer than a map label may print', () => {
    const points = [
      { lat: 64.14, lng: -21.94, label: long(300), date: '2026-06-02', country: 'IS', tripId: null, photoId: null },
      { lat: 65.68, lng: -18.12, label: 'Akureyri', date: '2026-06-06', country: 'IS', tripId: null, photoId: null },
    ]
    expect(savable(buildBook(input({ stats: stats({ points }) })))).toEqual({ ok: true })
  })

  it('when the journey visited more countries than a page may name', () => {
    const countries = Array.from({ length: 150 }, () => ({
      code: 'IS', name: long(150), places: 1, firstVisit: '2026-06-02',
    }))
    expect(savable(buildBook(input({ stats: stats({ countries }) })))).toEqual({ ok: true })
  })

  it('when the journey is called something longer than a title may be', () => {
    expect(savable(buildBook(input({ title: long(400) })))).toEqual({ ok: true })
    expect(savable(emptyBook(input({ title: long(400) })))).toEqual({ ok: true })
  })

  /*
   * The one that is not about a runaway string: a run of stops with nothing on
   * them becomes a two-column list, and the rows cost three elements each. At
   * thirteen rows a page that is eighty elements on a spread the contract caps
   * at sixty — an ordinary journey of dated stops, not a pathological one.
   */
  it('when a long run of bare stops becomes an itinerary list', () => {
    const bare = Array.from({ length: 60 }, (_, i) => entry({
      id: i + 1, title: 'Stop ' + i, story: '', location: 'Place ' + i, date: '2026-06-01',
    }))
    expect(savable(buildBook(input({ entries: bare })))).toEqual({ ok: true })
  })

  it('when a recorded track is longer than the map may draw', () => {
    const path = Array.from({ length: 60 }, () =>
      Array.from({ length: 2000 }, () => [64, -21] as [number, number]))
    expect(savable(buildBook(input({ path })))).toEqual({ ok: true })
  })
})
