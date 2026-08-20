import { describe, it, expect } from 'vitest'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { bookBadgeElementSchema, bookPageSetupSchema, normalizeBookDocument } from '@trek/shared'
import { render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'

/**
 * The picture on a mood or weather mark (#1973).
 *
 * These are the only marks whose drawing comes from the journal rather than from
 * the book, and the field that says which mood it is used to be capped at two
 * characters, from back when nothing but a country code went in it. A mark
 * reading "amazing" therefore failed the contract, which failed its spread,
 * which failed the document, and what the editor handed back was an empty book.
 * The first thing kept here is that a mood key survives a round trip with the
 * book still around it.
 *
 * The rest is the controls built on the widened field: whether the mark draws
 * its picture, whether it draws its words, and what colour the picture is. The
 * default reading is the one that matters most. Every book written before these
 * fields existed carries none of them, and every element the panels build is
 * cast rather than parsed, so the renderer has to read an absent flag as what it
 * always meant: draw it.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

const typeset = {
  font: 'sans' as const, color: '#1a1a1a', accent: '#c2410c', textScale: 1, weight: 700, stale: false,
}
const common = { rotation: 0, opacity: 1, locked: false, frame: { x: 10, y: 20, w: 90, h: 40 } }

/**
 * A badge built the way the panels build one: cast, not parsed, so nothing the
 * contract would default is filled in unless a test fills it. That is also what
 * a mark out of a book written before the icon fields existed looks like, which
 * is why the absent case below is worth a test at all.
 */
const badge = (over: Record<string, unknown>): BookElement => ({
  ...common, ...typeset, id: 'b1', kind: 'badge',
  variant: 'mood', text: '', sub: '', code: null, style: 'plain', ...over,
} as unknown as BookElement)

function draw(elements: BookElement[]) {
  const spread: BookSpread = {
    id: 's1', role: 'inner', background: null, elements, parked: [], entryId: null,
  }
  return render(<SpreadView spread={spread} page={page} />)
}

/** A document around a single mark, as it arrives from storage. */
function documentAround(el: Record<string, unknown>, title = 'Iceland') {
  return {
    version: 1,
    title,
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    spreads: [{
      id: 's1', role: 'inner', entryId: null, background: null, parked: [],
      elements: [
        { id: 'p1', kind: 'photo', frame: { x: 0, y: 0, w: 50, h: 50 }, photoId: 3 },
        el,
      ],
    }],
  }
}

describe('a mark made before the icon controls existed', () => {
  it('still draws its icon in the mood palette the journal uses', () => {
    const { container } = draw([badge({ variant: 'mood', code: 'amazing', text: 'Amazing' })])
    const icon = container.querySelector('svg')
    expect(icon).not.toBeNull()
    // The pink of "amazing" on the journey page, not the element's accent.
    expect(icon!.getAttribute('stroke')).toBe('#BE185D')
  })

  it('still draws its words and the line under them', () => {
    const { container } = draw([badge({
      variant: 'mood', code: 'amazing', text: 'Amazing', sub: 'Reykjavik',
    })])
    expect(container.textContent).toContain('Amazing')
    expect(container.textContent).toContain('Reykjavik')
  })

  /*
   * A parsed badge carries the default of `iconColor` whether or not anybody
   * chose it, so reading the colour on its own rather than the flag beside it
   * would repaint every mood mark in the field to a flat near-black.
   */
  it('ignores the icon colour while Automatic is still on', () => {
    const { container } = draw([badge({
      variant: 'mood', code: 'amazing', text: 'Amazing',
      autoIconColor: true, iconColor: '#111111',
    })])
    expect(container.querySelector('svg')!.getAttribute('stroke')).toBe('#BE185D')
  })
})

describe('choosing the icon colour', () => {
  /*
   * Asserted on the stroke because that is where it has to land: lucide takes
   * its colour as a prop and writes it onto the SVG, so `currentColor` from the
   * wrapper never reaches it, which is why the swatch used to look dead.
   */
  it('paints a mood icon that colour instead of the journal palette', () => {
    const { container } = draw([badge({
      variant: 'mood', code: 'amazing', text: 'Amazing',
      autoIconColor: false, iconColor: '#0EA5E9',
    })])
    expect(container.querySelector('svg')!.getAttribute('stroke')).toBe('#0EA5E9')
  })

  it('paints a weather icon that colour instead of the element accent', () => {
    const { container } = draw([badge({
      variant: 'weather', code: 'partly', text: 'Partly cloudy',
      autoIconColor: false, iconColor: '#0EA5E9',
    })])
    expect(container.querySelector('svg')!.getAttribute('stroke')).toBe('#0EA5E9')
  })

  it('leaves a weather icon on the accent when Automatic is left alone', () => {
    const { container } = draw([badge({ variant: 'weather', code: 'partly', text: 'Partly cloudy' })])
    expect(container.querySelector('svg')!.getAttribute('stroke')).toBe('#c2410c')
  })
})

describe('showing the picture and the words', () => {
  it('drops the icon and keeps the words when the icon is switched off', () => {
    const { container } = draw([badge({
      variant: 'mood', code: 'amazing', text: 'Amazing', sub: 'Reykjavik', showIcon: false,
    })])
    expect(container.querySelector('svg')).toBeNull()
    expect(container.textContent).toContain('Amazing')
    expect(container.textContent).toContain('Reykjavik')
  })

  it('drops the words and the line under them when the label is switched off', () => {
    const { container } = draw([badge({
      variant: 'mood', code: 'amazing', text: 'Amazing', sub: 'Reykjavik', showLabel: false,
    })])
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.textContent).not.toContain('Amazing')
    expect(container.textContent).not.toContain('Reykjavik')
  })

  /*
   * A mark with no words is a pictogram, and a pictogram should fill the box it
   * was given. The frame here is 90 by 40, so beside a label the icon is 0.46 of
   * the height and on its own it is 0.8 of the shorter side: 18.4mm against
   * 32mm. Left at the label size it would float in the middle of a frame that
   * was measured for words no longer on the page.
   */
  it('draws the icon larger once there are no words beside it', () => {
    const withLabel = draw([badge({ variant: 'mood', code: 'amazing', text: 'Amazing' })])
    expect(withLabel.container.querySelector('svg')!.style.width).toBe('18.4mm')

    const alone = draw([badge({ variant: 'mood', code: 'amazing', text: 'Amazing', showLabel: false })])
    const icon = alone.container.querySelector('svg')!
    expect(icon.style.width).toBe('32mm')
    expect(icon.style.height).toBe('32mm')
  })
})

describe('the badge contract', () => {
  it('defaults a mark that predates the icon fields to drawing both parts', () => {
    const parsed = bookBadgeElementSchema.parse({
      id: 'b1', kind: 'badge', frame: { x: 0, y: 0, w: 40, h: 20 },
      variant: 'mood', code: 'amazing',
    })
    expect(parsed.showIcon).toBe(true)
    expect(parsed.showLabel).toBe(true)
    expect(parsed.autoIconColor).toBe(true)
  })

  /*
   * The bug this all started from. A mood key is longer than a country code, the
   * field was capped at two characters, and the element failing the union took
   * its spread, its document and the whole book down with it.
   */
  it('keeps the book when a mark carries a mood key rather than a country code', () => {
    const doc = normalizeBookDocument(documentAround({
      id: 'b1', kind: 'badge', frame: { x: 10, y: 20, w: 90, h: 40 },
      variant: 'mood', code: 'amazing', text: 'Amazing',
    }))

    expect(doc.title).toBe('Iceland')
    expect(doc.spreads).toHaveLength(1)
    // Both elements, in order: the mark was not quietly salvaged away either.
    expect(doc.spreads[0].elements.map(e => e.kind)).toEqual(['photo', 'badge'])
    const mark = doc.spreads[0].elements[1]
    expect(mark.kind === 'badge' && mark.code).toBe('amazing')
  })

  it('carries all four icon fields through a round trip with the spread intact', () => {
    const doc = normalizeBookDocument(documentAround({
      id: 'b1', kind: 'badge', frame: { x: 10, y: 20, w: 90, h: 40 },
      variant: 'weather', code: 'partly', text: 'Partly cloudy',
      showIcon: true, showLabel: false, autoIconColor: false, iconColor: '#0EA5E9',
    }))

    expect(doc.spreads[0].elements).toHaveLength(2)
    const mark = doc.spreads[0].elements[1]
    expect(mark.kind).toBe('badge')
    expect(mark.kind === 'badge' && mark.showIcon).toBe(true)
    expect(mark.kind === 'badge' && mark.showLabel).toBe(false)
    expect(mark.kind === 'badge' && mark.autoIconColor).toBe(false)
    expect(mark.kind === 'badge' && mark.iconColor).toBe('#0EA5E9')
  })
})
