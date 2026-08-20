import { describe, it, expect } from 'vitest'
import {
  attributionFor, projectOntoTiles, staticMapUrl, tileView, toMercatorUnit,
} from '../../../src/components/Studio/mapTiles'

/**
 * Real map imagery for the book (#1973).
 *
 * The vector map is the default and needs none of this. What is tested here is
 * the opt-in: that a tiled map lands the route on the road it followed, that it
 * cannot ask for a hundred tiles to fill a postcard, and that the credit the
 * licence requires is never invented and never dropped.
 */

const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const frame = { w: 150, h: 120 }

const iceland = [
  { lat: 64.1466, lng: -21.9426 },
  { lat: 65.6885, lng: -18.1262 },
]

describe('toMercatorUnit', () => {
  it('puts the origin at the top left and the antimeridian at the edges', () => {
    expect(toMercatorUnit(-180, 85.0511).x).toBeCloseTo(0, 5)
    expect(toMercatorUnit(180, -85.0511).x).toBeCloseTo(1, 5)
    expect(toMercatorUnit(0, 0)).toEqual({ x: 0.5, y: 0.5 })
  })

  it('clamps past the poles rather than returning infinity', () => {
    const north = toMercatorUnit(0, 89.9)
    expect(Number.isFinite(north.y)).toBe(true)
    expect(north.y).toBeGreaterThanOrEqual(0)
  })
})

describe('tileView', () => {
  it('is null without a template or without points', () => {
    expect(tileView(iceland, frame, '', null)).toBeNull()
    expect(tileView([], frame, OSM, null)).toBeNull()
  })

  it('covers the route with real tile urls', () => {
    const view = tileView(iceland, frame, OSM, null)!
    expect(view.tiles.length).toBeGreaterThan(0)
    for (const t of view.tiles) {
      expect(t.url).toMatch(/^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/)
    }
  })

  /*
   * The budget is 16×16. It was 8×8, which sounds thriftier and was not: every
   * zoom level quarters the ground a tile covers, so a page-sized map lands at
   * 7×9 and the step that makes it printable needs 13×17. A budget of 64, or
   * even 144, stops one level short of a page worth printing — see
   * mapPrintResolution.test.ts, which pins the dots per inch this buys.
   */
  it('never asks for more tiles than a printed map can use', () => {
    for (const z of [null, 19]) {
      const view = tileView(iceland, frame, OSM, z)!
      expect(view.tiles.length, `zoom ${z}`).toBeLessThanOrEqual(256)
    }
  })

  it('zooms in on a short route and out on a long one', () => {
    const city = tileView(
      [{ lat: 64.14, lng: -21.94 }, { lat: 64.15, lng: -21.90 }], frame, OSM, null,
    )!
    const world = tileView(
      [{ lat: 64.14, lng: -21.94 }, { lat: -33.86, lng: 151.2 }], frame, OSM, null,
    )!
    expect(city.zoom).toBeGreaterThan(world.zoom)
  })

  it('takes a fixed zoom when one is asked for', () => {
    expect(tileView(iceland, frame, OSM, 5)!.zoom).toBe(5)
  })

  it('gives a single stop a window rather than dividing by zero', () => {
    const view = tileView([{ lat: 64.14, lng: -21.94 }], frame, OSM, null)!
    expect(view.tiles.length).toBeGreaterThan(0)
    expect(Number.isFinite(view.size)).toBe(true)
    expect(view.size).toBeGreaterThan(0)
  })

  it('drops rows past the poles, where no tile exists', () => {
    const view = tileView(
      [{ lat: 85, lng: 0 }, { lat: 84.9, lng: 0.1 }], frame, OSM, 3,
    )!
    const scale = 2 ** view.zoom
    for (const t of view.tiles) {
      const absoluteY = view.tileY0 + t.y
      expect(absoluteY).toBeGreaterThanOrEqual(0)
      expect(absoluteY).toBeLessThan(scale)
    }
  })

  it('wraps longitude, so a route across the antimeridian keeps its tiles', () => {
    const view = tileView(
      [{ lat: 0, lng: 179 }, { lat: 0, lng: -179 }], frame, OSM, 3,
    )!
    for (const t of view.tiles) {
      const x = Number(/\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(t.url)![2])
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(2 ** view.zoom)
    }
  })
})

describe('projectOntoTiles', () => {
  /*
   * The reason the grid origin is exposed at all: the vector map fits itself to
   * country outlines, so a route placed by that fit sits next to the road
   * rather than on it — an error that only shows up once it is printed.
   */
  it('places the route inside the frame it was fitted to', () => {
    const view = tileView(iceland, frame, OSM, null)!
    for (const p of iceland) {
      const at = projectOntoTiles(view, p.lng, p.lat)
      expect(at.x).toBeGreaterThan(-1)
      expect(at.x).toBeLessThan(frame.w + 1)
      expect(at.y).toBeGreaterThan(-1)
      expect(at.y).toBeLessThan(frame.h + 1)
    }
  })

  it('keeps west of east and north above south', () => {
    const view = tileView(iceland, frame, OSM, null)!
    const west = projectOntoTiles(view, -21.94, 64.14)
    const east = projectOntoTiles(view, -18.12, 65.68)
    expect(west.x).toBeLessThan(east.x)
    expect(west.y).toBeGreaterThan(east.y)
  })
})

describe('attribution', () => {
  it('credits the source a template comes from', () => {
    expect(attributionFor(OSM)).toContain('OpenStreetMap')
    expect(attributionFor('https://api.mapbox.com/x/{z}/{x}/{y}')).toContain('Mapbox')
    expect(attributionFor('https://api.maptiler.com/x')).toContain('MapTiler')
  })

  it('credits OpenStreetMap for a self-hosted mirror of it', () => {
    expect(attributionFor('https://tiles.example.org/openstreetmap/{z}/{x}/{y}.png'))
      .toContain('OpenStreetMap')
  })

  /* A wrong credit is worse than none. */
  it('invents nothing for a source it does not recognise', () => {
    expect(attributionFor('https://tiles.internal/{z}/{x}/{y}.png')).toBe('')
  })
})

describe('staticMapUrl', () => {
  it('is null without a token, since the request would only 401', () => {
    expect(staticMapUrl({ points: iceland, style: '', token: '', width: 600, height: 400 })).toBeNull()
  })

  it('is null without points to frame', () => {
    expect(staticMapUrl({ points: [], style: '', token: 'tok', width: 600, height: 400 })).toBeNull()
  })

  it('asks for the route bounding box at twice the size, for print', () => {
    const url = staticMapUrl({ points: iceland, style: '', token: 'tok', width: 600, height: 400 })!
    expect(url).toContain('@2x')
    expect(url).toContain('-21.94260,64.14660,-18.12620,65.68850')
  })

  it('takes a mapbox:// style and passes the plain path', () => {
    const url = staticMapUrl({
      points: iceland, style: 'mapbox://styles/mapbox/outdoors-v12', token: 'tok',
      width: 600, height: 400,
    })!
    expect(url).toContain('/styles/v1/mapbox/outdoors-v12/static/')
    expect(url).not.toContain('mapbox://')
  })

  it('stays inside the size the API accepts', () => {
    const url = staticMapUrl({ points: iceland, style: '', token: 'tok', width: 9000, height: 9000 })!
    expect(url).toContain('1280x1280')
  })
})
