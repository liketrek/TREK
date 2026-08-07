import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ReservationMapboxOverlay,
  RESERVATION_SOURCE_ID,
  RESERVATION_LINE_LAYER_ID,
  TRANSIT_CASING_LAYER_ID,
  type ReservationOverlayOptions,
} from './reservationsMapbox'
import type { Reservation, ReservationEndpoint } from '../../types'

// A minimal mapbox-gl stand-in: a persistent source that records the last
// setData, and project() spreading points far enough apart to pass the
// per-type pixel-distance visibility filter.
function fakeMap() {
  const source = { setData: vi.fn() }
  return {
    _source: source,
    getSource: () => source,
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getLayer: () => undefined,
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getZoom: () => 12,
    project: ([lng, lat]: [number, number]) => ({ x: lng * 1000, y: lat * 1000 }),
  }
}

const FakeMarker = vi.fn(function () {
  const marker = {
    setLngLat: () => marker,
    addTo: () => marker,
    remove: vi.fn(),
    getElement: () => document.createElement('div'),
  }
  return marker
}) as unknown as new () => unknown

function carBooking(): Reservation {
  return {
    id: 1, type: 'car', status: 'confirmed',
    endpoints: [
      { role: 'from', sequence: 0, name: 'A', code: null, lat: 48.0, lng: 2.0, timezone: null, local_time: null, local_date: null },
      { role: 'to', sequence: 1, name: 'B', code: null, lat: 48.2, lng: 2.3, timezone: null, local_time: null, local_date: null },
    ],
  } as unknown as Reservation
}

// A transit journey whose from/to stations project close together (under the 200px
// declutter threshold) but which carries real per-leg MOTIS geometry. The encoded
// polyline decodes to [[48,2],[48.02,2.01],[48.05,2]] at precision 6.
function transitBooking(withGeometry: boolean): Reservation {
  return {
    id: 2, type: 'transit', status: 'confirmed',
    endpoints: [
      { role: 'from', sequence: 0, name: 'Stop A', code: null, lat: 48.0, lng: 2.0, timezone: null, local_time: null, local_date: null },
      { role: 'to', sequence: 1, name: 'Stop B', code: null, lat: 48.05, lng: 2.0, timezone: null, local_time: null, local_date: null },
    ],
    metadata: withGeometry
      ? { transit: { legs: [{ geometry: '__upzA_gayB_af@_pR_ry@~oR', mode: 'BUS', line_color: '#7c3aed' }] } }
      : { transit: { legs: [{ mode: 'BUS' }] } },
  } as unknown as Reservation
}

const opts = { showConnections: true, showStats: false, showEndpointLabels: false }

function lastFeatureCoords(map: ReturnType<typeof fakeMap>) {
  const calls = map._source.setData.mock.calls
  const data = calls[calls.length - 1]?.[0] as { features: { geometry: { coordinates: [number, number][] } }[] }
  return data.features[0].geometry.coordinates
}

describe('ReservationMapboxOverlay road routes (#1425)', () => {
  it('draws the real road geometry when a road route is supplied', () => {
    const map = fakeMap()
    const overlay = new ReservationMapboxOverlay(map as never, opts, FakeMarker as never)
    const road: [number, number][] = [[48.0, 2.0], [48.1, 2.15], [48.2, 2.3]]
    overlay.update([carBooking()], opts, new Map([[1, road]]))
    // GeoJSON is [lng, lat]; the routed 3-point line, not the straight 2-point arc.
    expect(lastFeatureCoords(map)).toEqual([[2.0, 48.0], [2.15, 48.1], [2.3, 48.2]])
  })

  it('falls back to the straight arc when no road route is supplied', () => {
    const map = fakeMap()
    const overlay = new ReservationMapboxOverlay(map as never, opts, FakeMarker as never)
    overlay.update([carBooking()], opts)
    expect(lastFeatureCoords(map)).toEqual([[2.0, 48.0], [2.3, 48.2]])
  })

  it('sets no line features while connections are hidden', () => {
    const map = fakeMap()
    const overlay = new ReservationMapboxOverlay(map as never, opts, FakeMarker as never)
    overlay.update([carBooking()], { ...opts, showConnections: false }, new Map([[1, [[48, 2], [48.2, 2.3]]]]))
    const calls = map._source.setData.mock.calls
    const data = calls[calls.length - 1]?.[0] as { features: unknown[] }
    expect(data.features).toHaveLength(0)
  })
})

// A flight whose endpoints carry a malformed local_time (an imported booking
// missing the minutes) plus timezones, so computeDuration takes the parseInTz
// path. Pre-fix, Date.UTC → NaN and formatToParts threw mid-render (#1620).
function malformedTimeFlight(): Reservation {
  return {
    id: 3, type: 'flight', status: 'confirmed',
    reservation_time: '2024-01-15T22', reservation_end_time: '2024-01-16T08',
    endpoints: [
      { role: 'from', sequence: 0, name: 'JFK', code: 'JFK', lat: 40.6, lng: -73.8, timezone: 'America/New_York', local_date: '2024-01-15', local_time: '22' },
      { role: 'to', sequence: 1, name: 'LHR', code: 'LHR', lat: 51.5, lng: -0.5, timezone: 'Europe/London', local_date: '2024-01-16', local_time: '08' },
    ],
  } as unknown as Reservation
}

describe('ReservationMapboxOverlay malformed times (#1620)', () => {
  it('renders a flight with a malformed time instead of throwing on formatToParts', () => {
    const map = fakeMap()
    const overlay = new ReservationMapboxOverlay(map as never, opts, FakeMarker as never)
    expect(() => overlay.update([malformedTimeFlight()], opts)).not.toThrow()
  })
})

describe('ReservationMapboxOverlay transit routes (#1570)', () => {
  it('draws a transit journey with real geometry even when its stations project close together', () => {
    const map = fakeMap()
    const overlay = new ReservationMapboxOverlay(map as never, opts, FakeMarker as never)
    overlay.update([transitBooking(true)], opts)
    // Stations are ~50px apart — under the 200px declutter — yet the real per-leg
    // path (GeoJSON [lng, lat]) is drawn because it carries stored geometry.
    expect(lastFeatureCoords(map)).toEqual([[2, 48], [2.01, 48.02], [2, 48.05]])
  })

  it('still declutters a geometry-less transit whose stations project close together', () => {
    const map = fakeMap()
    const overlay = new ReservationMapboxOverlay(map as never, opts, FakeMarker as never)
    overlay.update([transitBooking(false)], opts)
    const calls = map._source.setData.mock.calls
    const data = calls[calls.length - 1]?.[0] as { features: unknown[] }
    expect(data.features).toHaveLength(0)
  })
})

// ── FE-COMP-RESGL-001 to FE-COMP-RESGL-023 ────────────────────────────────────
// The fake above always hands back a source, which makes the constructor skip
// setupLayer. This one starts empty like a real freshly-styled map, records its
// event handlers so the tests can fire them, and lets a test swap the projection
// mid-flight to simulate a zoom.

type Handler = () => void
type Projection = (c: [number, number]) => { x: number; y: number }

const spread: Projection = ([lng, lat]) => ({ x: lng * 1000, y: lat * 1000 })
const collapsed: Projection = () => ({ x: 0, y: 0 })

function freshMap(projection: Projection = spread) {
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>()
  const layers = new Map<string, unknown>()
  const handlers: Record<string, Handler[]> = {}
  return {
    projection,
    _sources: sources,
    _layers: layers,
    getSource: (id: string) => sources.get(id),
    addSource: vi.fn((id: string) => { sources.set(id, { setData: vi.fn() }) }),
    addLayer: vi.fn((layer: { id: string }) => { layers.set(layer.id, layer) }),
    getLayer: (id: string) => layers.get(id),
    removeLayer: vi.fn((id: string) => { layers.delete(id) }),
    // The real engine refuses to drop a source that a layer still points at, and
    // reports it by firing an error rather than throwing. Modelled as a throw here
    // so a missed layer fails the test instead of only dirtying a console.
    removeSource: vi.fn((id: string) => {
      for (const [layerId, layer] of layers) {
        if ((layer as { source?: string }).source === id) {
          throw new Error(`Source "${id}" cannot be removed while layer "${layerId}" is using it.`)
        }
      }
      sources.delete(id)
    }),
    on: vi.fn(function (this: void, event: string, fn: Handler) { (handlers[event] ||= []).push(fn) }),
    off: vi.fn((event: string, fn: Handler) => { handlers[event] = (handlers[event] || []).filter(h => h !== fn) }),
    getZoom: () => 12,
    project(this: { projection: Projection }, c: [number, number]) { return this.projection(c) },
    fire: (event: string) => { (handlers[event] || []).forEach(h => h()) },
    listeners: (event: string) => (handlers[event] || []).length,
  }
}

type MarkerRecord = { el: HTMLElement; remove: ReturnType<typeof vi.fn>; lngLat: [number, number] | null }
let glMarkers: MarkerRecord[] = []

// Unlike FakeMarker above this keeps the element it was handed, so the tests can
// read the rendered badge and dispatch real clicks on it.
const TrackingMarker = vi.fn(function (options?: { element?: HTMLElement }) {
  const record: MarkerRecord = {
    el: options?.element ?? document.createElement('div'),
    remove: vi.fn(),
    lngLat: null,
  }
  glMarkers.push(record)
  const marker = {
    setLngLat: (lngLat: [number, number]) => { record.lngLat = lngLat; return marker },
    addTo: () => marker,
    remove: record.remove,
    getElement: () => record.el,
  }
  return marker
}) as unknown as new (options?: { element?: HTMLElement; anchor?: string }) => unknown

function endpoint(over: Partial<ReservationEndpoint> = {}): ReservationEndpoint {
  return {
    role: 'from', sequence: 0, name: 'A', code: null,
    lat: 48, lng: 2, timezone: null, local_time: null, local_date: null,
    ...over,
  } as unknown as ReservationEndpoint
}

function booking(over: Partial<Reservation> = {}): Reservation {
  return {
    id: 100, type: 'flight', status: 'confirmed',
    endpoints: [
      endpoint({ role: 'from', sequence: 0, name: 'Vienna', code: 'VIE', lat: 48, lng: 16 }),
      endpoint({ role: 'to', sequence: 1, name: 'London', code: 'LHR', lat: 51.5, lng: -0.5 }),
    ],
    ...over,
  } as unknown as Reservation
}

const labelled = { showConnections: true, showStats: false, showEndpointLabels: true }

function features(map: ReturnType<typeof freshMap>) {
  const src = map._sources.get(RESERVATION_SOURCE_ID)
  const calls = src?.setData.mock.calls ?? []
  const data = calls[calls.length - 1]?.[0] as {
    features: { properties: Record<string, unknown>; geometry: { coordinates: [number, number][] } }[]
  } | undefined
  return data?.features ?? []
}

function attach(map: ReturnType<typeof freshMap>, options: ReservationOverlayOptions = opts) {
  return new ReservationMapboxOverlay(map as never, options, TrackingMarker as never)
}

beforeEach(() => {
  glMarkers = []
  vi.clearAllMocks()
})

describe('ReservationMapboxOverlay lifecycle', () => {
  it('FE-COMP-RESGL-001: sets up the geojson source and both line layers on a fresh map', () => {
    const map = freshMap()
    attach(map)
    expect(map.addSource).toHaveBeenCalledWith(RESERVATION_SOURCE_ID, expect.objectContaining({ type: 'geojson' }))
    expect(map._layers.has(RESERVATION_LINE_LAYER_ID)).toBe(true)
    expect(map._layers.has(`${RESERVATION_LINE_LAYER_ID}-transit-casing`)).toBe(true)
  })

  it('FE-COMP-RESGL-002: a second overlay on the same map reuses the existing source', () => {
    const map = freshMap()
    attach(map)
    map.addSource.mockClear()
    map.addLayer.mockClear()
    attach(map)
    expect(map.addSource).not.toHaveBeenCalled()
    expect(map.addLayer).not.toHaveBeenCalled()
  })

  it('FE-COMP-RESGL-003: destroy unhooks every listener and removes the markers, layer and source', () => {
    const map = freshMap()
    const overlay = attach(map, { ...opts, onEndpointClick: vi.fn() })
    overlay.update([booking()], opts)
    expect(glMarkers).toHaveLength(2)

    overlay.destroy()
    expect(glMarkers.every(m => m.remove.mock.calls.length > 0)).toBe(true)
    expect(map.listeners('zoomend')).toBe(0)
    expect(map.listeners('moveend')).toBe(0)
    expect(map.removeLayer).toHaveBeenCalledWith(RESERVATION_LINE_LAYER_ID)
    expect(map.removeLayer).toHaveBeenCalledWith(TRANSIT_CASING_LAYER_ID)
    expect(map.removeSource).toHaveBeenCalledWith(RESERVATION_SOURCE_ID)
    // Nothing left behind: the casing layer used to survive teardown, which kept
    // the source alive with it and made every map unmount log an error.
    expect(map._layers.size).toBe(0)
    expect(map._sources.size).toBe(0)
  })

  it('FE-COMP-RESGL-004: destroy survives a map whose style is already gone', () => {
    const map = freshMap()
    const overlay = attach(map)
    map.removeLayer.mockImplementation(() => { throw new Error('style gone') })
    expect(() => overlay.destroy()).not.toThrow()
  })

  it('FE-COMP-RESGL-005: a camera move redraws — a hop that was decluttered appears once zoomed in', () => {
    const map = freshMap(collapsed)
    const overlay = attach(map)
    overlay.update([booking({ type: 'train' })], opts)
    expect(features(map)).toHaveLength(0)

    map.projection = spread
    map.fire('zoomend')
    expect(features(map)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-006: the redraw handler is inert once the overlay is destroyed', () => {
    const map = freshMap()
    const overlay = attach(map)
    const handlerFor = (event: string) =>
      map.on.mock.calls.find(c => c[0] === event)?.[1] as Handler
    const rerender = handlerFor('moveend')

    overlay.update([booking()], opts)
    const drawsBefore = map._sources.get(RESERVATION_SOURCE_ID)!.setData.mock.calls.length
    overlay.destroy()

    rerender()
    expect(map._sources.get(RESERVATION_SOURCE_ID)).toBeUndefined()
    expect(drawsBefore).toBeGreaterThan(0)
  })

  it('FE-COMP-RESGL-007: an update after the style dropped the source draws nothing', () => {
    const map = freshMap()
    const overlay = attach(map)
    map._sources.clear()
    overlay.update([booking()], opts)
    expect(glMarkers).toHaveLength(0)
  })

  it('FE-COMP-RESGL-008: a projection failure keeps the booking rather than hiding it', () => {
    const map = freshMap(() => { throw new Error('not projectable') })
    const overlay = attach(map)
    overlay.update([booking()], labelled)
    expect(features(map)).toHaveLength(1)
    // The label threshold cannot be measured either, so no labels are drawn.
    expect(glMarkers[0].el.textContent).toBe('')
  })
})

describe('ReservationMapboxOverlay item filtering', () => {
  it('FE-COMP-RESGL-009: ignores reservations that are not transport', () => {
    const map = freshMap()
    attach(map).update([booking({ type: 'hotel' as Reservation['type'] })], opts)
    expect(features(map)).toHaveLength(0)
    expect(glMarkers).toHaveLength(0)
  })

  it('FE-COMP-RESGL-010: ignores a booking with fewer than two waypoints', () => {
    const map = freshMap()
    attach(map).update([booking({ endpoints: [endpoint({ role: 'from', sequence: 0 })] })], opts)
    expect(features(map)).toHaveLength(0)
  })

  it('FE-COMP-RESGL-011: ignores endpoints that are neither from, to nor stop', () => {
    const map = freshMap()
    const res = booking({
      endpoints: [
        endpoint({ role: 'from', sequence: 0, lat: 48, lng: 16 }),
        endpoint({ role: 'via' as ReservationEndpoint['role'], sequence: 1, lat: 49, lng: 17 }),
      ],
    })
    attach(map).update([res], opts)
    expect(features(map)).toHaveLength(0)
  })

  it('FE-COMP-RESGL-012: orders waypoints by sequence and draws one arc per leg', () => {
    const map = freshMap()
    const res = booking({
      type: 'train',
      endpoints: [
        endpoint({ role: 'to', sequence: 2, name: 'C', lat: 51, lng: 16 }),
        endpoint({ role: 'from', sequence: 0, name: 'A', lat: 48, lng: 16 }),
        endpoint({ role: 'stop', sequence: 1, name: 'B', lat: 49.5, lng: 16 }),
      ],
    })
    attach(map).update([res], opts)
    const drawn = features(map)
    expect(drawn).toHaveLength(2)
    // GeoJSON is [lng, lat]; legs run A→B and B→C.
    expect(drawn[0].geometry.coordinates).toEqual([[16, 48], [16, 49.5]])
    expect(drawn[1].geometry.coordinates).toEqual([[16, 49.5], [16, 51]])
  })

  it('FE-COMP-RESGL-013: a booking without a status is drawn as pending', () => {
    const map = freshMap()
    attach(map).update([booking({ status: undefined })], opts)
    expect(features(map)[0].properties.status).toBe('pending')
  })
})

describe('ReservationMapboxOverlay endpoint markers', () => {
  it('FE-COMP-RESGL-014: places one marker per waypoint, titled with the stop name', () => {
    const map = freshMap()
    attach(map).update([booking()], opts)
    expect(glMarkers).toHaveLength(2)
    expect(glMarkers.map(m => m.lngLat)).toEqual([[16, 48], [-0.5, 51.5]])
    expect(glMarkers.map(m => m.el.title)).toEqual(['Vienna', 'London'])
  })

  it('FE-COMP-RESGL-015: no label is rendered while endpoint labels are off', () => {
    const map = freshMap()
    attach(map).update([booking()], opts)
    expect(glMarkers[0].el.textContent).toBe('')
  })

  it('FE-COMP-RESGL-016: labels show the endpoint code when there is one', () => {
    const map = freshMap()
    attach(map).update([booking()], labelled)
    expect(glMarkers.map(m => m.el.textContent)).toEqual(['VIE', 'LHR'])
  })

  it('FE-COMP-RESGL-017: a code-less stop falls back to its name with the parenthetical stripped', () => {
    const map = freshMap()
    const res = booking({
      type: 'train',
      endpoints: [
        endpoint({ role: 'from', sequence: 0, name: 'Wien Hbf (Bahnsteig 3)', lat: 48, lng: 16 }),
        endpoint({ role: 'to', sequence: 1, name: 'München Hbf', lat: 49, lng: 16 }),
      ],
    })
    attach(map).update([res], labelled)
    expect(glMarkers.map(m => m.el.textContent)).toEqual(['Wien Hbf', 'München Hbf'])
  })

  it('FE-COMP-RESGL-018: a short hop draws its line but not its labels', () => {
    const map = freshMap()
    // 300 px apart: past the 200 px line threshold, under the 400 px label one.
    const res = booking({
      type: 'train',
      endpoints: [
        endpoint({ role: 'from', sequence: 0, name: 'Wien', code: 'VIE', lat: 48, lng: 16 }),
        endpoint({ role: 'to', sequence: 1, name: 'Graz', code: 'GRZ', lat: 48.3, lng: 16 }),
      ],
    })
    attach(map).update([res], labelled)
    expect(features(map)).toHaveLength(1)
    expect(glMarkers.map(m => m.el.textContent)).toEqual(['', ''])
  })

  it('FE-COMP-RESGL-019: a redraw replaces the previous markers instead of stacking them', () => {
    const map = freshMap()
    const overlay = attach(map)
    overlay.update([booking()], opts)
    const first = [...glMarkers]

    overlay.update([booking()], opts)
    expect(first.every(m => m.remove.mock.calls.length > 0)).toBe(true)
    expect(glMarkers).toHaveLength(4)
  })

  it('FE-COMP-RESGL-020: hiding connections drops the markers and the lines', () => {
    const map = freshMap()
    const overlay = attach(map)
    overlay.update([booking()], opts)
    const shown = [...glMarkers]

    overlay.update([booking()], { ...opts, showConnections: false })
    expect(shown.every(m => m.remove.mock.calls.length > 0)).toBe(true)
    expect(features(map)).toHaveLength(0)
    expect(glMarkers).toHaveLength(2) // the removed ones; none were added
  })

  it('FE-COMP-RESGL-021: clicking an endpoint reports its reservation and does not reach the map', () => {
    const onEndpointClick = vi.fn()
    const clickable = { ...opts, onEndpointClick }
    const map = freshMap()
    attach(map, clickable).update([booking({ id: 77 })], clickable)

    const wrapper = document.createElement('div')
    const onMapClick = vi.fn()
    wrapper.addEventListener('click', onMapClick)
    wrapper.appendChild(glMarkers[0].el)
    glMarkers[0].el.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onEndpointClick).toHaveBeenCalledWith(77)
    expect(onMapClick).not.toHaveBeenCalled()
  })

  it('FE-COMP-RESGL-022: without a click handler the marker stays inert', () => {
    const map = freshMap()
    attach(map, { ...opts, onEndpointClick: undefined }).update([booking()], opts)
    expect(() => glMarkers[0].el.dispatchEvent(new MouseEvent('click', { bubbles: true }))).not.toThrow()
  })
})

// computeDuration feeds the stats badge, which the GL overlay no longer draws —
// but it still runs on every update, and a throw in there blanked whole trips
// once (#1620). These pin down that every time shape stays survivable and the
// connection keeps being drawn.
describe('ReservationMapboxOverlay duration math', () => {
  function timed(from: Partial<ReservationEndpoint>, to: Partial<ReservationEndpoint>, res: Partial<Reservation> = {}) {
    return booking({
      endpoints: [
        endpoint({ role: 'from', sequence: 0, name: 'Vienna', code: 'VIE', lat: 48, lng: 16, ...from }),
        endpoint({ role: 'to', sequence: 1, name: 'London', code: 'LHR', lat: 51.5, lng: -0.5, ...to }),
      ],
      ...res,
    })
  }

  it('FE-COMP-RESGL-023: a well-formed cross-timezone flight renders', () => {
    const map = freshMap()
    attach(map).update([timed(
      { timezone: 'Europe/Vienna', local_date: '2024-01-15', local_time: '09:20' },
      { timezone: 'Europe/London', local_date: '2024-01-15', local_time: '11:05' },
    )], opts)
    expect(features(map)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-024: an overnight flight whose arrival reads earlier than departure renders', () => {
    const map = freshMap()
    attach(map).update([timed(
      { timezone: 'Europe/Vienna', local_date: '2024-01-15', local_time: '22:30' },
      { timezone: 'America/New_York', local_date: '2024-01-15', local_time: '02:10' },
    )], opts)
    expect(features(map)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-025: a time-only endpoint borrows the date from the other side', () => {
    const map = freshMap()
    attach(map).update([timed(
      { local_date: '2024-01-15', local_time: '09:20' },
      {},
      { reservation_end_time: '17:30' } as Partial<Reservation>,
    )], opts)
    expect(features(map)).toHaveLength(1)

    const other = freshMap()
    attach(other).update([timed(
      {},
      { local_date: '2024-01-15', local_time: '17:30' },
      { reservation_time: '09:20' } as Partial<Reservation>,
    )], opts)
    expect(features(other)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-026: two date-less times render without a duration', () => {
    const map = freshMap()
    attach(map).update([timed({}, {}, {
      reservation_time: '09:20', reservation_end_time: '17:30',
    } as Partial<Reservation>)], opts)
    expect(features(map)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-027: a booking without time zones uses the plain reservation times', () => {
    const map = freshMap()
    attach(map).update([timed({}, {}, {
      reservation_time: '2024-01-15T09:20', reservation_end_time: '2024-01-15T17:30',
    } as Partial<Reservation>)], opts)
    expect(features(map)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-028: an implausibly long gap is rendered without a duration', () => {
    const map = freshMap()
    attach(map).update([timed({}, {}, {
      reservation_time: '2024-01-15T09:20', reservation_end_time: '2024-01-19T17:30',
    } as Partial<Reservation>)], opts)
    expect(features(map)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-029: a booking with no times at all still draws its connection', () => {
    const map = freshMap()
    attach(map).update([timed({}, {})], opts)
    expect(features(map)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-030: a hop shorter than an hour renders', () => {
    const map = freshMap()
    attach(map).update([timed({}, {}, {
      reservation_time: '2024-01-15T09:20', reservation_end_time: '2024-01-15T09:50',
    } as Partial<Reservation>)], opts)
    expect(features(map)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-031: a stored timestamp that carries no clock time renders', () => {
    const map = freshMap()
    attach(map).update([timed(
      { timezone: 'Europe/Vienna' },
      { timezone: 'Europe/London' },
      { reservation_time: '2024-01-15T', reservation_end_time: '2024-01-15T18:00' } as Partial<Reservation>,
    )], opts)
    expect(features(map)).toHaveLength(1)
  })
})

describe('ReservationMapboxOverlay declutter floors', () => {
  // At the fake projection one degree of latitude is 1000 px, so `dLat` is the
  // on-screen gap between the two endpoints divided by 1000.
  const hop = (id: number, type: string, dLat: number) => booking({
    id, type: type as Reservation['type'],
    endpoints: [
      endpoint({ role: 'from', sequence: 0, name: 'Genoa', code: 'GOA', lat: 48, lng: 16 }),
      endpoint({ role: 'to', sequence: 1, name: 'Palma', code: 'PMI', lat: 48 + dLat, lng: 16 }),
    ],
  })

  it('FE-COMP-RESGL-032: a cruise needs 150 px before it is drawn', () => {
    const near = freshMap()
    attach(near, labelled).update([hop(1, 'cruise', 0.1)], labelled)
    expect(features(near)).toHaveLength(0)

    const far = freshMap()
    attach(far, labelled).update([hop(2, 'cruise', 0.2)], labelled)
    expect(features(far)).toHaveLength(1)
  })

  it('FE-COMP-RESGL-033: a cruise keeps its endpoint labels off below 300 px', () => {
    const map = freshMap()
    attach(map, labelled).update([hop(1, 'cruise', 0.2)], labelled)
    expect(glMarkers.map(m => m.el.textContent)).toEqual(['', ''])

    glMarkers = []
    const wide = freshMap()
    attach(wide, labelled).update([hop(2, 'cruise', 0.4)], labelled)
    expect(glMarkers.map(m => m.el.textContent)).toEqual(['GOA', 'PMI'])
  })
})

describe('ReservationMapboxOverlay waypoint edge cases', () => {
  it('FE-COMP-RESGL-034: a booking without an endpoints array is skipped', () => {
    const map = freshMap()
    attach(map).update([booking({ endpoints: undefined })], opts)
    expect(features(map)).toHaveLength(0)
    expect(glMarkers).toHaveLength(0)
  })

  it('FE-COMP-RESGL-035: waypoints without a sequence keep their array order', () => {
    const map = freshMap()
    attach(map).update([booking({
      type: 'train',
      endpoints: [
        endpoint({ role: 'from', sequence: undefined, name: 'A', lat: 48, lng: 16 }),
        endpoint({ role: 'stop', sequence: undefined, name: 'B', lat: 49.5, lng: 16 }),
        endpoint({ role: 'to', sequence: undefined, name: 'C', lat: 51, lng: 16 }),
      ],
    })], opts)
    const drawn = features(map)
    expect(drawn).toHaveLength(2)
    expect(drawn[0].geometry.coordinates).toEqual([[16, 48], [16, 49.5]])
    expect(drawn[1].geometry.coordinates).toEqual([[16, 49.5], [16, 51]])
  })

  it('FE-COMP-RESGL-036: a leg whose stops share coordinates degrades to a straight segment', () => {
    const map = freshMap()
    attach(map).update([booking({
      endpoints: [
        endpoint({ role: 'from', sequence: 0, name: 'Vienna', code: 'VIE', lat: 48, lng: 16 }),
        endpoint({ role: 'stop', sequence: 1, name: 'Vienna Gate', code: 'VIE', lat: 48, lng: 16 }),
        endpoint({ role: 'to', sequence: 2, name: 'London', code: 'LHR', lat: 51.5, lng: 16 }),
      ],
    })], opts)
    const drawn = features(map)
    expect(drawn).toHaveLength(2)
    expect(drawn[0].geometry.coordinates).toHaveLength(2)
    expect(drawn[1].geometry.coordinates.length).toBeGreaterThan(2)
  })

  it('FE-COMP-RESGL-037: a code-less stop between two coded ends falls back to its name', () => {
    const map = freshMap()
    attach(map, labelled).update([booking({
      type: 'train',
      endpoints: [
        endpoint({ role: 'from', sequence: 0, name: 'Wien', code: 'VIE', lat: 48, lng: 16 }),
        endpoint({ role: 'stop', sequence: 1, name: 'Zuerich HB (Gleis 5)', code: null, lat: 50, lng: 16 }),
        endpoint({ role: 'to', sequence: 2, name: 'London', code: 'LHR', lat: 51.5, lng: 16 }),
      ],
    })], labelled)
    expect(glMarkers.map(m => m.el.textContent)).toEqual(['VIE', 'Zuerich HB', 'LHR'])
  })

  it('FE-COMP-RESGL-038: an endpoint without a name gets an empty marker title', () => {
    const map = freshMap()
    attach(map).update([booking({
      endpoints: [
        endpoint({ role: 'from', sequence: 0, name: '', lat: 48, lng: 16 }),
        endpoint({ role: 'to', sequence: 1, name: 'London', lat: 51.5, lng: 16 }),
      ],
    })], opts)
    expect(glMarkers.map(m => m.el.title)).toEqual(['', 'London'])
  })
})

describe('ReservationMapboxOverlay transit styling', () => {
  const GEOMETRY = '__upzA_gayB_af@_pR_ry@~oR'

  const transit = (legs: Record<string, unknown>[], over: Partial<Reservation> = {}) => booking({
    id: 200,
    type: 'transit' as Reservation['type'],
    endpoints: [
      endpoint({ role: 'from', sequence: 0, name: 'Stop A', lat: 48, lng: 2 }),
      endpoint({ role: 'to', sequence: 1, name: 'Stop B', lat: 48.05, lng: 2 }),
    ],
    metadata: { transit: { legs } },
    ...over,
  } as unknown as Partial<Reservation>)

  it('FE-COMP-RESGL-039: a walking leg is grey and flagged as a walk', () => {
    const map = freshMap()
    attach(map).update([transit([{ geometry: GEOMETRY, mode: 'WALK' }])], opts)
    expect(features(map)[0].properties).toMatchObject({ transitPath: true, walk: true, color: '#64748b' })
  })

  it('FE-COMP-RESGL-040: a leg without a line colour falls back to the transit violet', () => {
    const map = freshMap()
    attach(map).update([transit([{ geometry: GEOMETRY, mode: 'BUS' }])], opts)
    expect(features(map)[0].properties).toMatchObject({ walk: false, color: '#7c3aed' })
  })

  it('FE-COMP-RESGL-041: a transit journey without a status is drawn as pending', () => {
    const map = freshMap()
    attach(map).update([transit([{ geometry: GEOMETRY, mode: 'BUS' }], { status: undefined })], opts)
    expect(features(map)[0].properties.status).toBe('pending')
  })
})

describe('ReservationMapboxOverlay frame handler', () => {
  it('FE-COMP-RESGL-042: the overlay does not subscribe to paint frames — only camera events redraw it', () => {
    const map = freshMap()
    const overlay = attach(map)
    overlay.update([booking()], opts)
    const drawsBefore = map._sources.get(RESERVATION_SOURCE_ID)!.setData.mock.calls.length

    map.fire('render')

    expect(map.listeners('render')).toBe(0)
    expect(map._sources.get(RESERVATION_SOURCE_ID)!.setData.mock.calls).toHaveLength(drawsBefore)
    expect(glMarkers).toHaveLength(2)
    expect(glMarkers.every(m => m.remove.mock.calls.length === 0)).toBe(true)
  })
})
