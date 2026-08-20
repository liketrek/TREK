import { describe, it, expect, beforeEach } from 'vitest'
import type { BookDocument, BookPageSetup, BookTextElement } from '@trek/shared'
import { bookPageSetupSchema, normalizeBookDocument } from '@trek/shared'
import { fireEvent, render, screen } from '../../helpers/render'
import { StudioSidebar, type JourneySource } from '../../../src/components/Studio/StudioSidebar'
import { useStudioStore } from '../../../src/store/studioStore'

/**
 * The date and coordinate chips in Content > Entries (#1973).
 *
 * An entry knows two things nobody wants to re-type onto a page: which day it
 * was and where it happened. What these check is that both arrive still
 * attached to the entry, carrying the raw fact alongside the printed words,
 * because that pair is what lets a book re-read its own text when it opens
 * without rewriting a line that was only ever set in another language.
 *
 * The last test is the one that earns its place. Placing an element is half of
 * it; the document has to survive the contract afterwards. A mood mark once
 * failed the union over a two-character cap and took the whole book with it,
 * normalising to an empty document that the autosave then wrote down, so a new
 * binding field that quietly fails to parse is not a cosmetic problem.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

type Entry = JourneySource['entries'][number]

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 7,
  title: 'Kirkjufell',
  story: null,
  location: 'Grundarfjordur',
  date: '2026-06-04',
  lat: 64.9275,
  lng: -23.3072,
  mood: null,
  weather: null,
  pros: [],
  cons: [],
  ...over,
})

const sourceOf = (...entries: Entry[]): JourneySource => ({ entries, photos: [], photoEntries: {} })

/** One empty inner spread, parsed rather than cast, so the store holds a real document. */
const emptyBook = (): BookDocument => normalizeBookDocument({
  version: 1,
  title: 'Iceland',
  page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
  spreads: [{ id: 'sp1', role: 'inner', entryId: null, background: null, elements: [], parked: [] }],
})

beforeEach(() => {
  useStudioStore.getState().load(emptyBook())
})

/**
 * Render the sidebar and walk to the panel the chips live in.
 *
 * ContentPanel is private to the sidebar, so the way in is the way a person
 * takes: the rail, then the Entries tab. `t` is the identity function, which is
 * why every label below is a raw key.
 */
function openEntries(source: JourneySource) {
  const view = render(
    <StudioSidebar
      page={page}
      pxPerMm={96 / 25.4}
      bookView={false}
      source={source}
      stats={null}
      path={[]}
      t={(k: string) => k}
      locale="en-US"
    />,
  )
  fireEvent.click(screen.getByLabelText('journey.studio.content'))
  fireEvent.click(screen.getByRole('button', { name: /journey\.studio\.entries/ }))
  return view
}

/** The element the chip just dropped, narrowed so its binding can be read. */
function lastText(): BookTextElement {
  const els = useStudioStore.getState().doc!.spreads[0].elements
  const el = els[els.length - 1]
  if (!el || el.kind !== 'text') throw new Error(`expected a text element, found ${el?.kind ?? 'nothing'}`)
  return el
}

describe('which chips an entry offers', () => {
  it('offers no coordinates for an entry that never recorded a point', () => {
    openEntries(sourceOf(entry({ lat: null, lng: null })))

    expect(screen.queryByText('journey.studio.coordsMark')).toBeNull()
    // The place name is still on offer: a written location is not a point.
    expect(screen.getByText('journey.studio.addPlace')).toBeInTheDocument()
  })

  it('offers no coordinates when only one half of the point survived', () => {
    openEntries(sourceOf(entry({ lng: null })))

    expect(screen.queryByText('journey.studio.coordsMark')).toBeNull()
  })

  it('offers coordinates once the entry has both halves', () => {
    openEntries(sourceOf(entry()))

    expect(screen.getByText('journey.studio.coordsMark')).toBeInTheDocument()
  })

  it('offers no date for an undated entry', () => {
    openEntries(sourceOf(entry({ date: null })))

    expect(screen.queryByText('journey.studio.dateMark')).toBeNull()
  })
})

describe('the date chip', () => {
  it('prints the day spelled out, with its year', () => {
    openEntries(sourceOf(entry()))
    fireEvent.click(screen.getByText('journey.studio.dateMark'))

    // Not the sidebar's short weekday form: a book outlives the year it was
    // made in, so the year belongs on the page.
    expect(lastText().text).toBe('June 4, 2026')
  })

  it('stays attached to the entry it came from, and unedited', () => {
    openEntries(sourceOf(entry()))
    fireEvent.click(screen.getByText('journey.studio.dateMark'))
    const el = lastText()

    expect(el.binding).toMatchObject({ source: 'entry.date', entryId: 7 })
    expect(el.overridden).toBe(false)
  })

  /*
   * The words are a rendering of the date, so they cannot answer "has the
   * journal changed?" on their own. The ISO date rides along to answer it.
   */
  it('carries the entry ISO date as the fact behind the words', () => {
    openEntries(sourceOf(entry()))
    fireEvent.click(screen.getByText('journey.studio.dateMark'))

    expect(lastText().binding!.value).toBe('2026-06-04')
    // A date has one printed form, so it claims no coordinate format.
    expect(lastText().binding!.format).toBeUndefined()
  })
})

describe('the coordinates chip', () => {
  it('prints the point in degrees, minutes and seconds', () => {
    openEntries(sourceOf(entry()))
    fireEvent.click(screen.getByText('journey.studio.coordsMark'))

    expect(lastText().text).toBe(`64° 55' 39" N   23° 18' 26" W`)
    // A printed page says W, never a minus sign.
    expect(lastText().text).not.toContain('-')
  })

  it('binds to the entry location, marked as the coordinate reading of it', () => {
    openEntries(sourceOf(entry()))
    fireEvent.click(screen.getByText('journey.studio.coordsMark'))

    expect(lastText().binding).toMatchObject({
      source: 'entry.location',
      entryId: 7,
      format: 'dms',
      value: '64.9275,-23.3072',
    })
  })

  it('lands on a short line rather than across the whole column', () => {
    openEntries(sourceOf(entry()))
    fireEvent.click(screen.getByText('journey.studio.addPlace'))
    const placeWidth = lastText().frame.w

    fireEvent.click(screen.getByText('journey.studio.coordsMark'))

    expect(lastText().frame.w).toBeLessThan(placeWidth)
  })
})

describe('a spread holding both marks', () => {
  /*
   * Normalising is not a formality here: the client's load seam and both of the
   * server's paths run through it, and it used to answer a single unreadable
   * element with an empty book. Whatever the chips write has to come back out.
   */
  it('survives normalizeBookDocument with the spread and both bindings intact', () => {
    openEntries(sourceOf(entry()))
    fireEvent.click(screen.getByText('journey.studio.dateMark'))
    fireEvent.click(screen.getByText('journey.studio.coordsMark'))

    const doc = normalizeBookDocument(useStudioStore.getState().doc)

    expect(doc.title).toBe('Iceland')
    expect(doc.spreads).toHaveLength(1)
    expect(doc.spreads[0].elements).toHaveLength(2)

    const [date, coords] = doc.spreads[0].elements
    expect(date.kind === 'text' && date.text).toBe('June 4, 2026')
    expect(date.kind === 'text' && date.binding).toMatchObject({
      source: 'entry.date', entryId: 7, value: '2026-06-04',
    })
    expect(coords.kind === 'text' && coords.binding).toMatchObject({
      source: 'entry.location', entryId: 7, format: 'dms', value: '64.9275,-23.3072',
    })
  })
})
