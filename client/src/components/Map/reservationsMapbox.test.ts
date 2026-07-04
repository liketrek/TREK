import { describe, it, expect, vi } from 'vitest'
import { ReservationMapboxOverlay } from './reservationsMapbox'
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
