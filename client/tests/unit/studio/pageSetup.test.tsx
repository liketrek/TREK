import { describe, it, expect } from 'vitest'
import type { BookPageSetup, BookSpread } from '@trek/shared'
import { bookPageSetupSchema, normalizeBookDocument } from '@trek/shared'
import { render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'
import { PAGE_MAX_MM, PAGE_MIN_MM, PAGE_PRESETS, clampPageSize } from '../../../src/components/Studio/pagePresets'
import { relayoutSpread, type AutoInput } from '../../../src/components/Studio/autoLayout'

/**
 * A free trim size, page numbers, and laying out again (#1973).
 */

type PageOver = Partial<Omit<BookPageSetup, 'pageNumbers'>> & {
  pageNumbers?: Partial<BookPageSetup['pageNumbers']>
}

const page = (over: PageOver = {}): BookPageSetup =>
  bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, ...over })

const spread = (over: Partial<BookSpread> = {}): BookSpread => ({
  id: 's1', role: 'inner', background: null, elements: [], parked: [], entryId: null, ...over,
})

describe('a custom trim size', () => {
  it('is offered as a preset of its own', () => {
    expect(PAGE_PRESETS.custom).toBeTruthy()
    expect(PAGE_PRESETS.custom.id).toBe('custom')
  })

  it('is what the document contract already allowed', () => {
    const parsed = page({ preset: 'custom', pageWidth: 240, pageHeight: 180 })
    expect(parsed.preset).toBe('custom')
    expect(parsed.pageWidth).toBe(240)
  })

  /*
   * The floor is a passport-sized book and the ceiling is what a large press
   * takes — past either, the editor is scaling to a smear rather than showing
   * a page.
   */
  it('holds a typed size inside what a press can print', () => {
    expect(clampPageSize(10)).toBe(PAGE_MIN_MM)
    expect(clampPageSize(9000)).toBe(PAGE_MAX_MM)
    expect(clampPageSize(240)).toBe(240)
  })

  it('rounds to a tenth of a millimetre, not to whatever was typed', () => {
    expect(clampPageSize(210.06)).toBe(210.1)
  })

  it('refuses nonsense rather than passing NaN into the document', () => {
    expect(clampPageSize(Number.NaN)).toBe(PAGE_MIN_MM)
  })
})

describe('page numbers', () => {
  it('are off until asked for', () => {
    expect(page().pageNumbers.show).toBe(false)
    const { container } = render(<SpreadView spread={spread()} page={page()} spreadIndex={1} />)
    expect(container.textContent).toBe('')
  })

  it('number both pages of a spread, left then right', () => {
    const { container } = render(
      <SpreadView spread={spread()} page={page({ pageNumbers: { show: true } })} spreadIndex={1} />,
    )
    expect(container.textContent).toBe('23')
  })

  /*
   * The first inner spread opens on `startAt`, and the cover is a separate
   * sheet — which is why the index has to be offset rather than used raw.
   */
  it('advance by two for each spread further into the book', () => {
    const p = page({ pageNumbers: { show: true } })
    const third = render(<SpreadView spread={spread()} page={p} spreadIndex={3} />)
    expect(third.container.textContent).toBe('67')
  })

  it('start where the book says, since a binder may or may not count the cover', () => {
    const p = page({ pageNumbers: { show: true, startAt: 1 } })
    const { container } = render(<SpreadView spread={spread()} page={p} spreadIndex={1} />)
    expect(container.textContent).toBe('12')
  })

  /* A folio on a cover is a mistake in every book ever bound. */
  it('never appear on the cover or the back cover', () => {
    const p = page({ pageNumbers: { show: true } })
    for (const role of ['cover', 'back'] as const) {
      const { container } = render(<SpreadView spread={spread({ role })} page={p} spreadIndex={0} />)
      expect(container.textContent, role).toBe('')
    }
  })

  it('sit against the cut edge on outer, and in the gutter on inner', () => {
    const outer = render(
      <SpreadView spread={spread()} page={page({ pageNumbers: { show: true, position: 'outer' } })} spreadIndex={1} />,
    )
    const inner = render(
      <SpreadView spread={spread()} page={page({ pageNumbers: { show: true, position: 'inner' } })} spreadIndex={1} />,
    )
    const leftOf = (c: HTMLElement) =>
      parseFloat(((c.firstElementChild!.children[0]) as HTMLElement).style.left)
    // Outer puts the left page's number at the margin; inner pushes it in.
    expect(leftOf(outer.container)).toBeLessThan(leftOf(inner.container))
  })

  it('survive a round trip through the document contract', () => {
    const doc = normalizeBookDocument({
      version: 1, title: 'T',
      page: { preset: 'custom', pageWidth: 240, pageHeight: 180, pageNumbers: { show: true, startAt: 5 } },
      spreads: [],
    })
    expect(doc.page.pageNumbers.show).toBe(true)
    expect(doc.page.pageNumbers.startAt).toBe(5)
    expect(doc.page.pageWidth).toBe(240)
  })

  it('default in for a document written before they existed', () => {
    const doc = normalizeBookDocument({
      version: 1, title: 'T',
      page: { preset: 'square-210', pageWidth: 210, pageHeight: 210 },
      spreads: [],
    })
    expect(doc.page.pageNumbers.show).toBe(false)
    expect(doc.page.pageNumbers.position).toBe('outer')
  })
})

describe('laying a spread out again', () => {
  const input: AutoInput = {
    locale: 'en', title: 'T', subtitle: null, coverPhotoId: null,
    entries: [{ id: 7, title: 'A day', story: 'Words.', location: 'Here', date: '2026-06-02', photos: [] }],
    page: page(), stats: null, stationsLabel: 'Stations', dayLabel: 'DAY', summaryLabel: 'Trip summary', countriesLabel: 'Countries',
  }

  it('rebuilds the spread from the entry it came from', () => {
    const next = relayoutSpread(spread({ entryId: 7, elements: [] }), input)
    expect(next).not.toBeNull()
    expect(next!.entryId).toBe(7)
    expect(next!.elements.length).toBeGreaterThan(0)
  })

  /*
   * Keeping the id is what makes it read as the same page rearranged: the rail
   * does not scroll and the selection does not jump to a different card.
   */
  it('keeps the spread id, so the rail does not jump', () => {
    const next = relayoutSpread(spread({ id: 'keep-me', entryId: 7 }), input)
    expect(next!.id).toBe('keep-me')
  })

  it('refuses a spread that did not come from an entry', () => {
    expect(relayoutSpread(spread({ entryId: null }), input)).toBeNull()
    expect(relayoutSpread(spread({ role: 'cover', entryId: 7 }), input)).toBeNull()
    expect(relayoutSpread(spread({ role: 'back', entryId: 7 }), input)).toBeNull()
  })

  it('refuses when the entry is gone from the journey', () => {
    expect(relayoutSpread(spread({ entryId: 999 }), input)).toBeNull()
  })
})
