import { describe, it, expect, vi } from 'vitest'
import {
  RESERVATION_LINE_LAYER_ID,
  RESERVATION_SOURCE_ID,
  RESERVATION_TRANSIT_CASING_LAYER_ID,
  ReservationMapboxOverlay,
} from './reservationsMapbox'
import type { Reservation } from '../../types'

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

function dependencyAwareFakeMap() {
  const source = { setData: vi.fn() }
  let hasSource = true
  const layers = new Map([
    [RESERVATION_TRANSIT_CASING_LAYER_ID, { source: RESERVATION_SOURCE_ID }],
    [RESERVATION_LINE_LAYER_ID, { source: RESERVATION_SOURCE_ID }],
  ])
  const removals: string[] = []

  return {
    _hasSource: () => hasSource,
    _layers: layers,
    _removals: removals,
    getSource: (id: string) => id === RESERVATION_SOURCE_ID && hasSource ? source : undefined,
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getLayer: (id: string) => layers.get(id),
    removeLayer: vi.fn((id: string) => {
      layers.delete(id)
      removals.push(`layer:${id}`)
    }),
    removeSource: vi.fn((id: string) => {
      const dependentLayer = [...layers.entries()].find(([, layer]) => layer.source === id)
      if (dependentLayer) throw new Error(`Source "${id}" cannot be removed while layer "${dependentLayer[0]}" is using it.`)
      hasSource = false
      removals.push(`source:${id}`)
    }),
    on: vi.fn(),
    off: vi.fn(),
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

describe('ReservationMapboxOverlay cleanup', () => {
  it('removes every dependent layer before removing the reservation source', () => {
    const map = dependencyAwareFakeMap()
    const overlay = new ReservationMapboxOverlay(map as never, opts, FakeMarker as never)

    overlay.destroy()

    expect(map._layers.size).toBe(0)
    expect(map._hasSource()).toBe(false)
    expect(map._removals).toEqual([
      `layer:${RESERVATION_TRANSIT_CASING_LAYER_ID}`,
      `layer:${RESERVATION_LINE_LAYER_ID}`,
      `source:${RESERVATION_SOURCE_ID}`,
    ])
  })
})

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
