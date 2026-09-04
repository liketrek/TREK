import { describe, it, expect } from 'vitest'
import {
  corridorTiles,
  distanceToSegmentKm,
  haversineKm,
  projectOntoRoute,
  simplifyLine,
  type LatLng,
} from './corridor'

const BERLIN: LatLng = { lat: 52.52, lng: 13.405 }
const DRESDEN: LatLng = { lat: 51.05, lng: 13.74 }
const PRAGUE: LatLng = { lat: 50.088, lng: 14.42 }

describe('haversineKm', () => {
  it('measures a known distance', () => {
    // Berlin → Dresden is about 165 km as the crow flies.
    expect(haversineKm(BERLIN, DRESDEN)).toBeGreaterThan(160)
    expect(haversineKm(BERLIN, DRESDEN)).toBeLessThan(170)
  })

  it('is zero for the same point', () => {
    expect(haversineKm(BERLIN, BERLIN)).toBe(0)
  })
})

describe('distanceToSegmentKm', () => {
  const a: LatLng = { lat: 52, lng: 13 }
  const b: LatLng = { lat: 52, lng: 14 }

  it('measures perpendicular distance to the line', () => {
    const p: LatLng = { lat: 52.09, lng: 13.5 }
    // 0.09° of latitude is about 10 km, whatever the longitude does.
    expect(distanceToSegmentKm(p, a, b)).toBeGreaterThan(9)
    expect(distanceToSegmentKm(p, a, b)).toBeLessThan(11)
  })

  it('measures to the end, not to the infinite line, for a point beyond it', () => {
    const beyond: LatLng = { lat: 52, lng: 16 }
    const d = distanceToSegmentKm(beyond, a, b)
    // Two degrees of longitude past the end at 52° north — roughly 137 km.
    expect(d).toBeGreaterThan(120)
    expect(d).toBeLessThan(150)
  })

  it('falls back to point distance for a zero-length segment', () => {
    expect(distanceToSegmentKm(DRESDEN, a, a)).toBeCloseTo(haversineKm(DRESDEN, a), 5)
  })
})

describe('projectOntoRoute', () => {
  const line = [BERLIN, DRESDEN, PRAGUE]

  it('reports how far off the route a point is', () => {
    const onRoute = projectOntoRoute({ lat: 51.8, lng: 13.5 }, line)
    expect(onRoute!.offRouteKm).toBeLessThan(15)
    const wayOff = projectOntoRoute({ lat: 53.55, lng: 10.0 }, line)
    expect(wayOff!.offRouteKm).toBeGreaterThan(150)
  })

  it('orders points by how far into the drive they come', () => {
    const early = projectOntoRoute({ lat: 52.3, lng: 13.45 }, line)!
    const late = projectOntoRoute({ lat: 50.4, lng: 14.2 }, line)!
    expect(early.alongKm).toBeLessThan(late.alongKm)
  })

  it('tells two points on the same long straight apart', () => {
    // The petrol stations along one motorway segment must not all report the same
    // position in the drive, which is what taking the segment midpoint produced.
    const straight = [{ lat: 52, lng: 13 }, { lat: 52, lng: 15 }]
    const early = projectOntoRoute({ lat: 52.01, lng: 13.3 }, straight)!
    const late = projectOntoRoute({ lat: 52.01, lng: 14.7 }, straight)!
    expect(late.alongKm - early.alongKm).toBeGreaterThan(80)
  })

  it('returns nothing for a line that is not one', () => {
    expect(projectOntoRoute(BERLIN, [])).toBeNull()
    expect(projectOntoRoute(BERLIN, [BERLIN])).toBeNull()
  })
})

describe('corridorTiles', () => {
  it('covers a short route with a single box', () => {
    const tiles = corridorTiles([BERLIN, { lat: 52.4, lng: 13.5 }], 5)
    expect(tiles).toHaveLength(1)
    expect(tiles[0].south).toBeLessThan(52.4)
    expect(tiles[0].north).toBeGreaterThan(52.52)
  })

  it('splits a long route into boxes the server will not clamp', () => {
    const tiles = corridorTiles([BERLIN, DRESDEN, PRAGUE], 10)
    expect(tiles.length).toBeGreaterThan(1)
    for (const t of tiles) {
      expect(t.north - t.south).toBeLessThanOrEqual(0.45)
      expect(t.east - t.west).toBeLessThanOrEqual(0.45)
    }
  })

  it('pads longitude more the further north it goes', () => {
    const south = corridorTiles([{ lat: 0, lng: 0 }], 10)[0]
    const north = corridorTiles([{ lat: 60, lng: 0 }], 10)[0]
    expect(north.east - north.west).toBeGreaterThan(south.east - south.west)
  })

  it('covers the middle of a long straight leg, not only its two ends', () => {
    // A motorway with no bend in it reduces to two points, 250 km apart. Tiling walks
    // point to point, so without splitting the step everything between them goes
    // unsearched while the search still reports itself complete.
    const straight = [{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }]
    const tiles = corridorTiles(straight, 10)

    expect(tiles.length).toBeGreaterThan(4)
    // A box somewhere over the middle of the drive, which is what was missing.
    const midLat = 53.03
    const midLng = 11.7
    expect(tiles.some(t => t.south <= midLat && t.north >= midLat && t.west <= midLng && t.east >= midLng)).toBe(true)
  })

  it('leaves no gap between consecutive boxes along a route', () => {
    const tiles = corridorTiles([{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }], 10)
    for (let i = 1; i < tiles.length; i++) {
      const a = tiles[i - 1]
      const b = tiles[i]
      // Overlapping or touching in both axes: a hole here is a stretch nobody looks at.
      expect(Math.min(a.north, b.north) - Math.max(a.south, b.south)).toBeGreaterThanOrEqual(0)
      expect(Math.min(a.east, b.east) - Math.max(a.west, b.west)).toBeGreaterThanOrEqual(0)
    }
  })

  it('has nothing to cover for an empty route', () => {
    expect(corridorTiles([], 10)).toEqual([])
  })
})

describe('simplifyLine', () => {
  it('keeps the ends and drops what sits on the line between them', () => {
    const straight = [
      { lat: 52, lng: 13 },
      { lat: 52, lng: 13.5 },
      { lat: 52, lng: 14 },
    ]
    expect(simplifyLine(straight, 1)).toEqual([straight[0], straight[2]])
  })

  it('keeps a point that actually bends the route', () => {
    const bent = [
      { lat: 52, lng: 13 },
      { lat: 52.5, lng: 13.5 },
      { lat: 52, lng: 14 },
    ]
    expect(simplifyLine(bent, 1)).toHaveLength(3)
  })

  it('leaves a two-point line alone', () => {
    expect(simplifyLine([BERLIN, DRESDEN], 5)).toEqual([BERLIN, DRESDEN])
  })
})
