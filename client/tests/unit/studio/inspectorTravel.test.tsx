import { describe, it, expect, beforeEach } from 'vitest'
import type { BookDocument, BookElement, JourneyStats } from '@trek/shared'
import {
  bookBadgeElementSchema, bookCountriesElementSchema, bookListElementSchema,
  bookMapElementSchema, bookPageSetupSchema, bookStatsElementSchema, journeyStatsSchema,
} from '@trek/shared'
import { fireEvent, render, screen, within } from '../../helpers/render'
import { StudioInspector } from '../../../src/components/Studio/StudioInspector'
import { useStudioStore } from '../../../src/store/studioStore'

/**
 * The inspector, on the five travel elements (#1973).
 *
 * The panel was rebuilt: same functions, new structure. Sections fold, booleans
 * are the app's switch instead of a chip, a set of several carries a tick, and
 * duplicate, lock and delete moved out of "Arrange" and into the panel head.
 * Nothing in the suite rendered the inspector at all, so a control that came
 * out of that rebuild wired to nothing would have been found in a printed book
 * rather than here.
 *
 * Two rules for what follows. The whole inspector is mounted rather than the
 * travel half on its own, because the tail every travel element shares, type,
 * colour, position, arrange, is drawn by the outer panel. And what is asserted
 * is the document the store holds, not the markup: the question is whether a
 * control still writes the field it used to write, whichever section it now
 * lives in.
 */

const page = bookPageSetupSchema.parse({
  preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5,
})

const frame = { x: 10, y: 10, w: 120, h: 90 }

/** A journey with figures no element below starts out agreeing with. */
const stats: JourneyStats = journeyStatsSchema.parse({
  journeyId: 1,
  distance: 1234, days: 5, steps: 7, photos: 12, places: 9, furthest: 400,
  countries: [{ code: 'IS', name: 'Iceland', places: 9, firstVisit: '2026-01-01' }],
  points: [
    { lat: 64.14, lng: -21.94, label: 'Reykjavik', date: '2026-01-01', country: 'IS' },
    { lat: 65.68, lng: -18.09, label: 'Akureyri', date: '2026-01-04', country: 'IS' },
  ],
  start: '2026-01-01', end: '2026-01-05',
})

const mapEl = (over: Record<string, unknown> = {}): BookElement => bookMapElementSchema.parse({
  id: 'm1', kind: 'map', frame, countries: ['IS'],
  points: [{ lat: 64.14, lng: -21.94, label: 'Reykjavik' }],
  ...over,
}) as BookElement

const statsEl = (over: Record<string, unknown> = {}): BookElement => bookStatsElementSchema.parse({
  id: 's1', kind: 'stats', frame, ...over,
}) as BookElement

const countriesEl = (over: Record<string, unknown> = {}): BookElement => bookCountriesElementSchema.parse({
  id: 'c1', kind: 'countries', frame, codes: ['IS', 'NO'], names: ['Iceland', 'Norway'], ...over,
}) as BookElement

const badgeEl = (over: Record<string, unknown> = {}): BookElement => bookBadgeElementSchema.parse({
  id: 'b1', kind: 'badge', frame, variant: 'flag', code: 'IS', text: 'ICELAND', ...over,
}) as BookElement

const listEl = (over: Record<string, unknown> = {}): BookElement => bookListElementSchema.parse({
  id: 'l1', kind: 'list', frame,
  items: [{ text: 'Warm all week', tone: 'pro' }, { text: 'Ferry was late', tone: 'con' }],
  proLabel: 'Pros', conLabel: 'Cons',
  ...over,
}) as BookElement

function show(el: BookElement, live: JourneyStats | null = null) {
  useStudioStore.getState().load({
    version: 1, title: 'T', page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements: [el], parked: [], entryId: null }],
  } as BookDocument)
  useStudioStore.getState().select([el.id])
  return render(
    <StudioInspector
      spreadIndex={0}
      page={page}
      stats={live}
      source={{ entries: [], photos: [], photoEntries: {} }}
      setPageNumbers={() => {}}
      t={k => k}
      locale="en"
    />,
  )
}

/** The element as the store holds it. Every assertion below reads this. */
function saved(): Record<string, unknown> {
  return useStudioStore.getState().doc!.spreads[0].elements[0] as unknown as Record<string, unknown>
}

/** One of a few. */
const pick = (name: string) => fireEvent.click(screen.getByRole('radio', { name }))
/** One of a set, which carries a tick. */
const tick = (name: string) => fireEvent.click(screen.getByRole('checkbox', { name }))
/** A switch, or any plain button: both answer to their accessible name. */
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

/** A section by its heading, since a label can repeat across sections. */
function section(container: HTMLElement, label: string): HTMLElement {
  const found = [...container.querySelectorAll<HTMLElement>('.st-section')]
    .find(s => s.querySelector('.st-section-label')?.textContent === label)
  if (!found) throw new Error(`no section headed ${label}`)
  return found
}

/** Some sections start folded, so a control inside one has to be uncovered. */
function open(container: HTMLElement, label: string) {
  fireEvent.click(section(container, label).querySelector('.st-section-head')!)
}

/** The control side of one labelled line inside one section. */
function lineIn(container: HTMLElement, sectionLabel: string, lineLabel: string): HTMLElement {
  const row = [...section(container, sectionLabel).querySelectorAll<HTMLElement>('.st-line')]
    .find(l => l.querySelector('.st-line-label')?.textContent === lineLabel)
  if (!row) throw new Error(`no line labelled ${lineLabel} under ${sectionLabel}`)
  return row.querySelector<HTMLElement>('.st-line-body')!
}

beforeEach(() => {
  useStudioStore.getState().load({ version: 1, title: 'T', page, spreads: [] } as unknown as BookDocument)
})

describe('the route map', () => {
  it('takes the tiles and the credit from the source it is switched to', () => {
    show(mapEl())

    pick('journey.studio.mapSourceSatellite')

    expect(saved().source).toBe('tiles')
    expect(saved().tileUrl).toContain('tiles.maps.eox.at')
    // The credit travels with the source, or the page prints the wrong one —
    // and this one is CC BY, so printing it uncredited is a licence breach
    // rather than a discourtesy.
    expect(saved().attribution).toContain('EOX')
  })

  /*
   * The planner's own street tiles and Mapbox are no longer offered: one is a
   * street map that reads as a screenshot on paper and whose server asks people
   * not to bulk-fetch, the other needs written permission before anything is
   * printed. Removing an option must not remove a page, though.
   */
  it('still offers the source a map already uses, even one no longer recommended', () => {
    show(mapEl({
      source: 'tiles',
      tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
    }))

    const chip = screen.getByRole('radio', { name: 'journey.studio.mapSourceTiles' })
    expect(chip.getAttribute('aria-checked')).toBe('true')
  })

  it('does not offer it on a map that never used it', () => {
    show(mapEl())
    expect(screen.queryByRole('radio', { name: 'journey.studio.mapSourceTiles' })).toBeNull()
    expect(screen.queryByRole('radio', { name: 'journey.studio.mapSourceStatic' })).toBeNull()
  })

  it('writes the drawn style', () => {
    show(mapEl())

    pick('journey.studio.mapStyle.paper')

    expect(saved().style).toBe('paper')
  })

  it('fits the stops rather than the countries, and back again', () => {
    show(mapEl())
    expect(saved().fitToCountries).toBe(true)

    pick('journey.studio.mapFitStops')
    expect(saved().fitToCountries).toBe(false)

    pick('journey.studio.mapFitCountry')
    expect(saved().fitToCountries).toBe(true)
  })

  it('writes how much room is left around what is drawn', () => {
    show(mapEl())

    pick('journey.studio.mapPadWide')
    expect(saved().fitPadding).toBe(0.5)

    pick('journey.studio.mapPadTight')
    expect(saved().fitPadding).toBe(0.04)
  })

  it('cuts the picture to the coastline when the shape is switched', () => {
    show(mapEl())

    pick('journey.studio.mapClipCountry')

    expect(saved().clip).toBe('country')
  })

  /* A country-shaped hole with no country to cut against is a filled box. */
  it('refuses the country shape on a map that knows no countries', () => {
    show(mapEl({ countries: [] }))

    const chip = screen.getByRole('radio', { name: 'journey.studio.mapClipCountry' })
    expect(chip).toBeDisabled()

    fireEvent.click(chip)
    expect(saved().clip).toBe('rect')
  })

  it('writes a zoom from the folded group, and hands it back automatically', () => {
    const { container } = show(mapEl({ source: 'tiles', tileUrl: 'https://tile.example/{z}/{x}/{y}.png' }))
    open(container, 'journey.studio.mapZoom')

    pick('11')
    expect(saved().zoom).toBe(11)

    // Automatic is null rather than a number, which is what lets the element
    // choose one that fits the route.
    pick('journey.studio.mapZoomAuto')
    expect(saved().zoom).toBeNull()
  })

  it('draws each layer, or does not', () => {
    show(mapEl())

    press('journey.studio.showLand')
    expect(saved().showLand).toBe(false)

    press('journey.studio.showRoute')
    expect(saved().showRoute).toBe(false)

    press('journey.studio.showPins')
    expect(saved().showPins).toBe(false)

    press('journey.studio.showLabels')
    expect(saved().showLabels).toBe(true)
  })
})

describe('the figures', () => {
  it('adds a figure to the set', () => {
    show(statsEl())

    tick('journey.studio.metric.countries')

    expect(saved().metrics).toEqual(['distance', 'days', 'steps', 'photos', 'countries'])
  })

  it('takes one back out', () => {
    show(statsEl())

    tick('journey.studio.metric.days')

    expect(saved().metrics).toEqual(['distance', 'steps', 'photos'])
  })

  /* An empty panel is a blank rectangle nobody could get back out of. */
  it('keeps the last figure', () => {
    show(statsEl({ metrics: ['days'] }))

    tick('journey.studio.metric.days')

    expect(saved().metrics).toEqual(['days'])
  })

  it('writes the layout and the units', () => {
    show(statsEl())

    pick('journey.studio.layoutRow')
    expect(saved().layout).toBe('row')

    pick('mi')
    expect(saved().units).toBe('imperial')
  })

  it('writes the icons switch', () => {
    show(statsEl())

    press('journey.studio.showIcons')

    expect(saved().showIcons).toBe(false)
  })
})

describe('the countries', () => {
  it('writes the layout and the alignment', () => {
    show(countriesEl())

    pick('journey.studio.layoutColumn')
    expect(saved().layout).toBe('column')

    pick('journey.studio.align.right')
    expect(saved().align).toBe('right')
  })

  it('writes the three things it draws', () => {
    show(countriesEl())

    press('journey.studio.showOutline')
    expect(saved().showOutline).toBe(false)

    press('journey.studio.showFlag')
    expect(saved().showFlag).toBe(true)

    press('journey.studio.showName')
    expect(saved().showName).toBe(false)
  })

  it('keeps one name per code when a line is edited', () => {
    show(countriesEl())

    fireEvent.change(screen.getByLabelText('journey.studio.countryNames'), {
      target: { value: 'Island\nNoreg' },
    })

    expect(saved().names).toEqual(['Island', 'Noreg'])
  })

  /*
   * The reason the textarea does not simply store its own lines: a removed line
   * must not shift every name after it onto the wrong outline, and a line
   * nobody has a country for must not be printed at all.
   */
  it('ignores a line past the last country, and keeps a name whose line is gone', () => {
    show(countriesEl())
    const box = screen.getByLabelText('journey.studio.countryNames')

    fireEvent.change(box, { target: { value: 'Island\nNoreg\nSverige' } })
    expect(saved().names).toEqual(['Island', 'Noreg'])

    fireEvent.change(box, { target: { value: 'Island' } })
    expect(saved().names).toEqual(['Island', 'Noreg'])
  })
})

describe('the mark', () => {
  it('writes the words and the caption', () => {
    const { container } = show(badgeEl())

    fireEvent.change(
      within(lineIn(container, 'journey.studio.marks', 'journey.studio.text')).getByRole('textbox'),
      { target: { value: 'REYKJAVIK' } },
    )
    expect(saved().text).toBe('REYKJAVIK')

    fireEvent.change(
      within(lineIn(container, 'journey.studio.marks', 'journey.studio.styleCaption')).getByRole('textbox'),
      { target: { value: 'Day 1' } },
    )
    expect(saved().sub).toBe('Day 1')
  })

  it('writes the style, in the panel language rather than in the raw value', () => {
    show(badgeEl())

    pick('journey.studio.markStyle.chip')
    expect(saved().style).toBe('chip')

    pick('journey.studio.markStyle.stacked')
    expect(saved().style).toBe('stacked')

    // These four printed `plain`, `chip` and the rest in all twenty-three
    // languages before, straight out of the value.
    expect(screen.getByRole('radio', { name: 'journey.studio.markStyle.outline' })).toBeTruthy()
    expect(screen.queryByRole('radio', { name: 'outline' })).toBeNull()
  })

  it('writes the three combinations of picture and words', () => {
    show(badgeEl())

    pick('journey.studio.iconOnly')
    expect(saved().showIcon).toBe(true)
    expect(saved().showLabel).toBe(false)

    pick('journey.studio.labelOnly')
    expect(saved().showIcon).toBe(false)
    expect(saved().showLabel).toBe(true)

    pick('journey.studio.iconAndLabel')
    expect(saved().showIcon).toBe(true)
    expect(saved().showLabel).toBe(true)
  })

  /* A mark with neither its picture nor its words is a way to lose an element. */
  it('offers no way to switch both off', () => {
    const { container } = show(badgeEl())
    const shows = within(section(container, 'journey.studio.icon')).getAllByRole('radio')
    expect(shows).toHaveLength(3)

    for (const chip of shows) {
      fireEvent.click(chip)
      expect(saved().showIcon || saved().showLabel).toBe(true)
    }
  })

  it('writes the icon colour, and stops the icon choosing its own', () => {
    const { container } = show(badgeEl())

    fireEvent.click(
      within(lineIn(container, 'journey.studio.icon', 'journey.studio.colour'))
        .getByRole('button', { name: '#0f766e' }),
    )

    expect(saved().iconColor).toBe('#0f766e')
    expect(saved().autoIconColor).toBe(false)
  })

  it('hands the icon colour back with the automatic switch', () => {
    const { container } = show(badgeEl({ autoIconColor: false, iconColor: '#0f766e' }))

    fireEvent.click(
      within(section(container, 'journey.studio.icon'))
        .getByRole('button', { name: 'journey.studio.autoColour' }),
    )

    expect(saved().autoIconColor).toBe(true)
  })
})

describe('the pros and cons list', () => {
  it('writes the layout', () => {
    show(listEl())

    pick('journey.studio.layoutColumn')
    expect(saved().layout).toBe('stacked')

    pick('journey.studio.layoutGrid')
    expect(saved().layout).toBe('columns')
  })

  it('writes the marks switch', () => {
    show(listEl())

    press('journey.studio.showMarks')

    expect(saved().showMarks).toBe(false)
  })

  it('writes both headings', () => {
    show(listEl())

    fireEvent.change(screen.getByLabelText('journey.editor.pros'), { target: { value: 'Worth it' } })
    expect(saved().proLabel).toBe('Worth it')

    fireEvent.change(screen.getByLabelText('journey.editor.cons'), { target: { value: 'Less so' } })
    expect(saved().conLabel).toBe('Less so')
  })
})

describe('the tail all five share', () => {
  it('writes the family, and moves the weight to one that family really has', () => {
    const { container } = show(statsEl({ font: 'sans', weight: 700 }))
    open(container, 'journey.studio.typography')

    // Bebas ships one weight; a bold it does not have prints as a smeared
    // regular, so the request moves rather than being passed through.
    press('Bebas Neue')

    expect(saved().font).toBe('bebas')
    expect(saved().weight).toBe(400)
  })

  it('keeps a weight the new family does have', () => {
    const { container } = show(statsEl({ font: 'sans', weight: 500 }))
    open(container, 'journey.studio.typography')

    press('Lora')

    expect(saved().font).toBe('serif')
    expect(saved().weight).toBe(500)
  })

  it('writes the weight', () => {
    const { container } = show(countriesEl())
    open(container, 'journey.studio.typography')

    pick('500')

    expect(saved().weight).toBe(500)
  })

  it('writes the text scale', () => {
    const { container } = show(listEl())
    open(container, 'journey.studio.typography')

    pick('1.2×')

    expect(saved().textScale).toBe(1.2)
  })

  it('writes the accent and the ink, which are two different rows', () => {
    const { container } = show(statsEl())

    fireEvent.click(
      within(lineIn(container, 'journey.studio.colour', 'journey.studio.accent'))
        .getByRole('button', { name: '#c2410c' }),
    )
    expect(saved().accent).toBe('#c2410c')
    expect(saved().color).toBe('#1a1a1a')

    fireEvent.click(
      within(lineIn(container, 'journey.studio.colour', 'journey.studio.text'))
        .getByRole('button', { name: '#1e3a8a' }),
    )
    expect(saved().color).toBe('#1e3a8a')
    expect(saved().accent).toBe('#c2410c')
  })

  /* A chip's words answer to its fill, until somebody chooses otherwise. */
  it('takes a mark off automatic when its ink is picked, and the switch puts it back', () => {
    const { container } = show(badgeEl())

    fireEvent.click(
      within(lineIn(container, 'journey.studio.colour', 'journey.studio.text'))
        .getByRole('button', { name: '#ffffff' }),
    )
    expect(saved().color).toBe('#ffffff')
    expect(saved().autoColor).toBe(false)

    fireEvent.click(
      within(section(container, 'journey.studio.colour'))
        .getByRole('button', { name: 'journey.studio.autoColour' }),
    )
    expect(saved().autoColor).toBe(true)
  })
})

describe('an element the journey has moved past', () => {
  it('says so, and offers to bring it up to date', () => {
    show(statsEl(), stats)

    expect(screen.getByText('journey.studio.staleHint')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'journey.studio.refresh' })).toBeTruthy()
  })

  it('writes the journey figures as they stand now, and stops asking', () => {
    show(statsEl(), stats)

    press('journey.studio.refresh')

    expect(saved().values).toMatchObject({ distance: 1234, days: 5, steps: 7, photos: 12 })
    expect(saved().stale).toBe(false)
    expect(screen.queryByText('journey.studio.staleHint')).toBeNull()
  })

  /*
   * Compared rather than timestamped: a page showing distance and days does not
   * go stale because somebody fixed a typo in a caption.
   */
  it('says nothing while the figures it shows still match', () => {
    show(statsEl({ values: { distance: 1234, days: 5, steps: 7, photos: 12 } }), stats)

    expect(screen.queryByText('journey.studio.staleHint')).toBeNull()
  })
})
