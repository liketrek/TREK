import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { BookElement, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { SpreadView } from '../../../src/components/Studio/SpreadView'
import { tileView } from '../../../src/components/Studio/mapTiles'

/**
 * What a route map shows, and what shape it is (#1973).
 *
 * The complaint this answers, in the words it arrived in: a trip that stayed in
 * Berlin was drawn as the whole of Germany with two dots in the middle of it,
 * and the line between stops was a zig-zag across country rather than the road
 * anyone actually took. Both were decisions the element made for you.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210 })

const common = {
  frame: { x: 0, y: 0, w: 120, h: 100 },
  rotation: 0, opacity: 1, locked: false,
}
const typeset = { font: 'sans', color: '#111111', accent: '#111111', textScale: 1, weight: 700, stale: false }

const map = (over: Record<string, unknown> = {}): BookElement => ({
  ...common, ...typeset, id: 'm1', kind: 'map', style: 'minimal',
  source: 'vector', tileUrl: '', attribution: '', zoom: null,
  showLand: true, showRoute: true, showPins: true, showLabels: false,
  countries: ['DE'],
  // Two stops a few kilometres apart, both well inside one large country.
  points: [
    { lat: 52.52, lng: 13.40, label: 'Berlin' },
    { lat: 52.50, lng: 13.45, label: 'Kreuzberg' },
  ],
  path: [],
  fitPadding: 0.18,
  fitToCountries: false,
  clip: 'rect',
  ...over,
} as BookElement)

function draw(el: BookElement) {
  const spread: BookSpread = { id: 's', role: 'inner', background: null, elements: [el], parked: [], entryId: null }
  return render(<SpreadView spread={spread} page={page} />)
}

/** How far apart the two pins are drawn, in the SVG's own units. */
function pinSpread(container: HTMLElement): number {
  const circles = [...container.querySelectorAll('circle')]
  const xs = circles.map(c => Number(c.getAttribute('cx')))
  return Math.max(...xs) - Math.min(...xs)
}

describe('what the map is fitted to', () => {
  /*
   * The whole point. Fitted to the country, two stops five kilometres apart are
   * two dots a hair's breadth from each other; fitted to the stops they are the
   * width of the page, which is what a page about those two places wants.
   */
  it('fits the stops, not the country they are in', () => {
    const toStops = pinSpread(draw(map()).container)
    const toCountry = pinSpread(draw(map({ fitToCountries: true })).container)
    expect(toStops).toBeGreaterThan(toCountry * 10)
  })

  it('fits the country when asked, so the country page still works', () => {
    const { container } = draw(map({ fitToCountries: true }))
    // The outline fills the frame rather than sitting inside a box drawn round
    // two stops in the middle of it.
    expect(pinSpread(container)).toBeLessThan(20)
  })

  it('leaves more air around it the wider the padding', () => {
    const tight = pinSpread(draw(map({ fitPadding: 0.02 })).container)
    const wide = pinSpread(draw(map({ fitPadding: 1.5 })).container)
    expect(tight).toBeGreaterThan(wide)
  })

  /* A single stop is a place, not an extent: it needs a window, not a country. */
  it('gives one stop a window rather than dividing by zero', () => {
    const { container } = draw(map({ points: [{ lat: 52.52, lng: 13.4, label: 'Berlin' }] }))
    const circle = container.querySelector('circle')!
    expect(Number(circle.getAttribute('cx'))).toBeGreaterThan(0)
    expect(container.innerHTML).not.toContain('NaN')
  })

  it('falls back to the country when there is nothing else to fit', () => {
    const { container } = draw(map({ points: [], path: [] }))
    expect(container.innerHTML).not.toContain('NaN')
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0)
  })
})

describe('the line the map draws', () => {
  const berlinToHamburg: [number, number][] = [
    [52.52, 13.40], [52.8, 12.9], [53.2, 12.0], [53.55, 10.0],
  ]

  it('follows the travelled way when the trip knows it', () => {
    const { container } = draw(map({ path: [berlinToHamburg] }))
    const line = container.querySelector('polyline')!
    // Four points on the way, not two stops joined by a ruler.
    expect(line.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(4)
  })

  it('joins the stops when it does not', () => {
    const { container } = draw(map())
    const line = container.querySelector('polyline')!
    expect(line.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(2)
  })

  /*
   * Two tracks that do not join must stay two lines. Drawn as one, a trip with
   * a flight in the middle grows a road across the sea.
   */
  it('keeps separate tracks separate', () => {
    const { container } = draw(map({
      path: [berlinToHamburg, [[48.1, 11.6], [48.0, 11.0]] as [number, number][]],
    }))
    expect(container.querySelectorAll('polyline')).toHaveLength(2)
  })

  it('takes the travelled way into account when fitting', () => {
    const near = draw(map()).container.innerHTML
    const far = draw(map({ path: [berlinToHamburg] })).container.innerHTML
    expect(near).not.toEqual(far)
  })
})

describe('cutting the map to the land', () => {
  it('cuts the imagery to the outline rather than to a box', () => {
    const { container } = draw(map({
      source: 'tiles',
      tileUrl: 'https://tile.example/{z}/{x}/{y}.png',
      clip: 'country',
    }))
    expect(container.querySelectorAll('clipPath')).toHaveLength(1)
    expect(container.querySelectorAll('svg image').length).toBeGreaterThan(0)
    // Nothing outside the stencil: the tiles are not also drawn as plain images.
    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('draws a boxed map as a picture under the page, with no stencil', () => {
    const { container } = draw(map({
      source: 'tiles',
      tileUrl: 'https://tile.example/{z}/{x}/{y}.png',
      clip: 'rect',
    }))
    expect(container.querySelectorAll('clipPath')).toHaveLength(0)
    expect(container.querySelectorAll('img').length).toBeGreaterThan(0)
  })

  /* A country-shaped hole cut in a city-sized view is a coloured rectangle. */
  it('shows the whole country when cutting, whatever the fit said', () => {
    const cut = pinSpread(draw(map({
      source: 'tiles', tileUrl: 'https://tile.example/{z}/{x}/{y}.png',
      clip: 'country', fitToCountries: false,
    })).container)
    expect(cut).toBeLessThan(20)
  })

  it('has nothing to cut against without a country, and stays a rectangle', () => {
    const { container } = draw(map({
      source: 'tiles', tileUrl: 'https://tile.example/{z}/{x}/{y}.png',
      clip: 'country', countries: [],
    }))
    expect(container.querySelectorAll('clipPath')).toHaveLength(0)
  })
})

describe('the tile grid', () => {
  const frame = { w: 120, h: 100 }
  const template = 'https://{s}.tiles.example/{z}/{x}/{y}.png'
  const points = [{ lat: 52.52, lng: 13.40 }, { lat: 53.55, lng: 10.0 }]

  it('covers the frame on both axes, with no paper showing at the edges', () => {
    const view = tileView(points, frame, template, null)!
    const right = view.originX + (Math.max(...view.tiles.map(t => t.x)) + 1) * view.size
    const bottom = view.originY + (Math.max(...view.tiles.map(t => t.y)) + 1) * view.size
    expect(view.originX).toBeLessThanOrEqual(0.001)
    expect(view.originY).toBeLessThanOrEqual(0.001)
    expect(right).toBeGreaterThanOrEqual(frame.w - 0.001)
    expect(bottom).toBeGreaterThanOrEqual(frame.h - 0.001)
  })

  /*
   * `{s}` left in the URL is not a placeholder, it is a hostname that does not
   * resolve — the map draws as an empty frame with a route across it.
   */
  it('substitutes the shard letter', () => {
    const view = tileView(points, frame, template, null)!
    expect(view.tiles.every(t => !t.url.includes('{s}'))).toBe(true)
    expect(view.tiles[0].url).toMatch(/^https:\/\/[abc]\.tiles\.example\//)
  })

  it('gives the same tile the same host every time, so a reprint hits the cache', () => {
    const a = tileView(points, frame, template, null)!
    const b = tileView(points, frame, template, null)!
    expect(a.tiles.map(t => t.url)).toEqual(b.tiles.map(t => t.url))
  })

  it('covers the extent it is given rather than a second fit of its own', () => {
    const extent = { minLng: 5, maxLng: 15, minLat: 47, maxLat: 55 }
    const view = tileView(points, frame, template, null, extent)!
    const plain = tileView(points, frame, template, null)!
    expect(view.zoom).not.toBe(plain.zoom)
  })
})
