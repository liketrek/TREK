import { describe, it, expect } from 'vitest'
import { buildTripMapSvg } from './tripMapSvg'
import type { TripOverviewDay } from '../Map/tripRouteGeometry'

const day = (over: Partial<TripOverviewDay> = {}): TripOverviewDay => ({
  dayId: 1, dayNumber: 1, date: null, title: null, color: { line: '#0a84ff', casing: '#0a5cc2' },
  lines: [[[48.86, 2.35], [48.88, 2.40]]],
  segments: [], distance: 0, duration: 0, modes: [], ...over,
})

const opts = { width: 720, height: 420, formatDistance: (km: number) => `${km} km` }

describe('buildTripMapSvg', () => {
  it('FE-PDF-MAPSVG-001: draws nothing when there is no route to draw', () => {
    expect(buildTripMapSvg([], opts)).toBeNull()
    // A single point is not a line.
    expect(buildTripMapSvg([day({ lines: [[[48.86, 2.35]]] })], opts)).toBeNull()
  })

  it('FE-PDF-MAPSVG-002: gives each day its own colour over a white casing', () => {
    const svg = buildTripMapSvg([
      day({ color: { line: '#0a84ff', casing: '#0a5cc2' } }),
      day({ dayId: 2, dayNumber: 2, color: { line: '#ff9f0a', casing: '#c2740a' }, lines: [[[45.76, 4.83], [45.78, 4.85]]] }),
    ], opts) as string

    expect(svg).toContain('stroke="#0a84ff"')
    expect(svg).toContain('stroke="#ff9f0a"')
    // Each core sits on its own darkened casing, not a shared white one.
    expect(svg).toContain('stroke="#0a5cc2"')
    expect(svg).toContain('stroke="#c2740a"')
  })

  it('FE-PDF-MAPSVG-003: refuses a colour that is not a plain hex triple', () => {
    const svg = buildTripMapSvg([day({ color: { line: 'red"/><script>x</script>', casing: '#0a5cc2' } })], opts) as string

    expect(svg).not.toContain('<script')
    expect(svg).toContain('stroke="#0a84ff"')
  })

  it('FE-PDF-MAPSVG-004: puts the countries the trip crosses under the route', () => {
    const svg = buildTripMapSvg([day({ lines: [[[48.86, 2.35], [52.52, 13.40]]] })], opts) as string

    // Paris → Berlin: land is drawn, and it is drawn before the route.
    expect(svg).toContain('<path d=')
    expect(svg.indexOf('<path d=')).toBeLessThan(svg.indexOf('<polyline'))
  })

  it('FE-PDF-MAPSVG-005: marks where each run starts and ends', () => {
    const svg = buildTripMapSvg([day()], opts) as string
    expect(svg.match(/<circle /g)?.length).toBe(2)
  })

  it('FE-PDF-MAPSVG-006: carries a scale bar in the reader\'s own unit', () => {
    const svg = buildTripMapSvg([day({ lines: [[[48.86, 2.35], [52.52, 13.40]]] })], {
      ...opts, formatDistance: km => `${km} leagues`,
    }) as string

    expect(svg).toContain(' leagues</text>')
  })

  it('FE-PDF-MAPSVG-007: a day inside one city still draws as a route, not a dot', () => {
    // Two stops 400m apart: fitting tightly would magnify GPS noise into a continent,
    // so the view has a floor.
    const svg = buildTripMapSvg([day({ lines: [[[48.8600, 2.3500], [48.8620, 2.3540]]] })], opts) as string

    expect(svg).toContain('<polyline')
    const points = /<polyline points="([^"]+)"/.exec(svg)?.[1].split(' ') ?? []
    const xs = points.map(p => Number(p.split(',')[0]))
    // The two stops sit apart but well inside the frame, not pinned to its edges.
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(1)
    expect(Math.min(...xs)).toBeGreaterThan(0)
    expect(Math.max(...xs)).toBeLessThan(opts.width)
  })

  it('FE-PDF-MAPSVG-008: fills the frame it is given', () => {
    const svg = buildTripMapSvg([day()], opts) as string
    expect(svg).toContain('viewBox="0 0 720 420"')
    expect(svg).toContain('width="720"')
  })
})
