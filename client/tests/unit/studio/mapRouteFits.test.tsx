import { describe, it, expect } from 'vitest'
import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { render } from '../../helpers/render'
import { SpreadView } from '../../../src/components/Studio/SpreadView'

/**
 * The route stays on the map, whatever shape the map is dragged to (#1973).
 *
 * Two fits used to disagree about what the map was of. The outlines and the
 * route were contained in the frame, fitted whole with air on the long side;
 * the imagery covered it, because a map with a strip of paper down one edge is
 * not a map. On a frame whose proportions did not match the route's those are
 * different windows, and the tiles won — so a map dragged narrow kept its
 * picture and lost the end of its line.
 *
 * These cases drag the same route into deliberately awkward shapes and check
 * every drawn point is still inside the box. They read the SVG rather than the
 * document, because this is the one thing about a map that only goes wrong at
 * draw time.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({ preset: 'square-210' })

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

/** A route that is far wider than it is tall: Lisbon to Kyiv. */
const WIDE = [
  { lat: 38.72, lng: -9.14, label: 'Lisboa' },
  { lat: 48.85, lng: 2.35, label: 'Paris' },
  { lat: 52.52, lng: 13.40, label: 'Berlin' },
  { lat: 50.45, lng: 30.52, label: 'Kyiv' },
]

/** And one far taller than it is wide: Tromso down to Palermo. */
const TALL = [
  { lat: 69.65, lng: 18.95, label: 'Tromso' },
  { lat: 59.33, lng: 18.07, label: 'Stockholm' },
  { lat: 47.37, lng: 8.54, label: 'Zurich' },
  { lat: 38.12, lng: 13.36, label: 'Palermo' },
]

function map(over: Record<string, unknown> = {}): BookElement {
  return {
    id: 'mp1', kind: 'map', rotation: 0, opacity: 1, locked: false,
    font: 'sans', color: '#1a1a1a', accent: '#c2410c', textScale: 1, weight: 400, stale: false,
    frame: { x: 0, y: 0, w: 120, h: 90 },
    style: 'minimal', source: 'vector', tileUrl: '', attribution: '', zoom: null, clip: 'rect',
    showLand: true, showRoute: true, showPins: true, showLabels: false,
    countries: [], points: WIDE, path: [],
    fitPadding: 0.18, fitToCountries: false, tripId: null,
    ...over,
  } as unknown as BookElement
}

function draw(el: BookElement) {
  const spread: BookSpread = {
    id: 's1', role: 'inner', background: null, elements: [el], parked: [], entryId: null,
  }
  return render(<SpreadView spread={spread} page={page} big />)
}

/** Every stop the map drew, in the element's own millimetres. */
function pins(container: HTMLElement): { x: number; y: number }[] {
  return Array.from(container.querySelectorAll('circle')).map(c => ({
    x: Number(c.getAttribute('cx')),
    y: Number(c.getAttribute('cy')),
  })).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
}

const shapes = [
  { name: 'a wide letterbox', w: 180, h: 40 },
  { name: 'a tall column', w: 40, h: 180 },
  { name: 'a small square', w: 30, h: 30 },
  { name: 'a full spread', w: 420, h: 297 },
]

describe('however the map is dragged', () => {
  for (const points of [WIDE, TALL]) {
    for (const shape of shapes) {
      it(`keeps every stop inside ${shape.name}`, () => {
        const el = map({ points, frame: { x: 0, y: 0, w: shape.w, h: shape.h } })
        const { container } = draw(el)
        const drawn = pins(container)
        expect(drawn).toHaveLength(points.length)
        for (const p of drawn) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThanOrEqual(shape.w)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeLessThanOrEqual(shape.h)
        }
      })
    }
  }

  /*
   * The case that was actually broken: with imagery the route is projected onto
   * the tile grid rather than onto the vector fit, and the tile grid covers.
   */
  it('keeps every stop inside a narrow map drawn from tiles', () => {
    const el = map({
      points: WIDE,
      source: 'tiles',
      tileUrl: OSM,
      frame: { x: 0, y: 0, w: 40, h: 170 },
    })
    const { container } = draw(el)
    const drawn = pins(container)
    expect(drawn).toHaveLength(WIDE.length)
    for (const p of drawn) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(40)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(170)
    }
  })

  it('still fills the frame with imagery rather than leaving paper down one side', () => {
    const el = map({
      points: WIDE,
      source: 'tiles',
      tileUrl: OSM,
      frame: { x: 0, y: 0, w: 180, h: 40 },
    })
    const { container } = draw(el)
    const tiles = Array.from(container.querySelectorAll('img'))
    expect(tiles.length).toBeGreaterThan(0)
    // The grid has to reach past both edges, which is what cover means.
    const rights = tiles.map(t => {
      const left = parseFloat(t.style.left)
      const width = parseFloat(t.style.width)
      return left + width
    })
    expect(Math.max(...rights)).toBeGreaterThanOrEqual(180)
    expect(Math.min(...tiles.map(t => parseFloat(t.style.left)))).toBeLessThanOrEqual(0)
  })
})
