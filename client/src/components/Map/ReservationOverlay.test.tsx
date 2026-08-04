// FE-COMP-RESOVERLAY-001 to FE-COMP-RESOVERLAY-024
import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '../../../tests/helpers/render'
import { act, fireEvent } from '@testing-library/react'
import { resetAllStores, seedStore } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import type { Reservation, ReservationEndpoint } from '../../types'

// The Leaflet map jsdom cannot provide: panes are a plain map, and the
// projection is a linear lat/lng → pixel scale so the tests can put endpoints a
// chosen number of pixels apart and drive the declutter thresholds exactly.
const leaflet = vi.hoisted(() => {
  const panes = new Map<string, HTMLElement>()
  const view = { zoom: 10, scale: 1000 }
  const point = (x: number, y: number) => ({
    x, y,
    distanceTo(other: { x: number; y: number }) { return Math.hypot(x - other.x, y - other.y) },
  })
  const events: Record<string, () => void> = {}
  const map = {
    getZoom: () => view.zoom,
    getPane: (name: string) => panes.get(name),
    createPane: (name: string) => {
      const el = document.createElement('div')
      panes.set(name, el)
      return el
    },
    latLngToContainerPoint: ([lat, lng]: [number, number]) => point(lng * view.scale, lat * view.scale),
  }
  return { panes, view, events, map }
})

vi.mock('react-leaflet', () => ({
  Marker: ({ children, position, icon, eventHandlers, pane, zIndexOffset }: any) => (
    <div
      data-testid="endpoint-marker"
      data-lat={position[0]}
      data-lng={position[1]}
      data-pane={pane ?? ''}
      data-zindex={zIndexOffset}
      data-icon-html={icon?.options?.html ?? ''}
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </div>
  ),
  Polyline: ({ positions, pathOptions }: any) => (
    <div
      data-testid="polyline"
      data-points={JSON.stringify(positions)}
      data-path-options={JSON.stringify(pathOptions ?? null)}
    />
  ),
  Tooltip: ({ children }: any) => <div data-testid="marker-tooltip">{children}</div>,
  useMap: () => leaflet.map,
  useMapEvents: (handlers: Record<string, () => void>) => {
    Object.assign(leaflet.events, handlers)
    return leaflet.map
  },
}))

vi.mock('leaflet', () => {
  const divIcon = vi.fn((options: Record<string, unknown>) => ({ options }))
  const marker = vi.fn(() => ({
    addTo: vi.fn(), remove: vi.fn(), setLatLng: vi.fn(), getElement: () => null,
  }))
  const point = vi.fn((x: number, y: number) => ({ x, y }))
  return { default: { divIcon, marker, point }, divIcon, marker, point }
})

import ReservationOverlay from './ReservationOverlay'

function endpoint(over: Partial<ReservationEndpoint> = {}): ReservationEndpoint {
  return {
    role: 'from', sequence: 0, name: 'A', code: null,
    lat: 48, lng: 16, timezone: null, local_time: null, local_date: null,
    ...over,
  } as unknown as ReservationEndpoint
}

// Endpoints 3500 px apart at the default scale — past every type's declutter and
// label threshold, so a booking is fully drawn unless a test says otherwise.
function booking(over: Partial<Reservation> = {}): Reservation {
  return {
    id: 1, type: 'flight', status: 'confirmed', title: null,
    endpoints: [
      endpoint({ role: 'from', sequence: 0, name: 'Vienna', code: 'VIE', lat: 48, lng: 16 }),
      endpoint({ role: 'to', sequence: 1, name: 'London', code: 'LHR', lat: 51.5, lng: 16 }),
    ],
    ...over,
  } as unknown as Reservation
}

const GEOMETRY = '__upzA_gayB_af@_pR_ry@~oR'

function transitBooking(legs: Record<string, unknown>[]): Reservation {
  return booking({
    id: 2,
    type: 'transit',
    endpoints: [
      endpoint({ role: 'from', sequence: 0, name: 'Stop A', lat: 48, lng: 16 }),
      endpoint({ role: 'to', sequence: 1, name: 'Stop B', lat: 48.02, lng: 16 }),
    ],
    metadata: { transit: { legs } },
  } as unknown as Partial<Reservation>)
}

function renderOverlay(props: Partial<React.ComponentProps<typeof ReservationOverlay>> = {}) {
  return render(
    <ReservationOverlay
      reservations={[booking()]}
      showConnections
      showStats={false}
      {...props}
    />,
  )
}

const markers = () => screen.queryAllByTestId('endpoint-marker')
const lines = () => screen.queryAllByTestId('polyline')
const styleOf = (el: HTMLElement) => JSON.parse(el.getAttribute('data-path-options') || 'null')
const labelOf = (el: HTMLElement) => {
  const html = el.getAttribute('data-icon-html') || ''
  return html.replace(/<[^>]*>/g, '').trim()
}

afterEach(() => {
  vi.clearAllMocks()
  leaflet.panes.clear()
  leaflet.view.scale = 1000
  resetAllStores()
})

describe('ReservationOverlay', () => {
  it('FE-COMP-RESOVERLAY-001: creates the endpoint pane above the overlay pane', () => {
    renderOverlay()
    const pane = leaflet.panes.get('reservation-endpoints')
    expect(pane).toBeDefined()
    expect(pane!.style.zIndex).toBe('650')
    expect(pane!.style.pointerEvents).toBe('auto')
  })

  it('FE-COMP-RESOVERLAY-002: renders nothing at all while connections are hidden', () => {
    renderOverlay({ showConnections: false })
    expect(lines()).toHaveLength(0)
    expect(markers()).toHaveLength(0)
  })

  it('FE-COMP-RESOVERLAY-003: draws a marker per waypoint in the endpoint pane', () => {
    renderOverlay()
    expect(markers()).toHaveLength(2)
    expect(markers()[0].getAttribute('data-pane')).toBe('reservation-endpoints')
    expect(markers()[0].getAttribute('data-zindex')).toBe('1000')
    expect(markers().map(m => m.getAttribute('data-lat'))).toEqual(['48', '51.5'])
  })

  it('FE-COMP-RESOVERLAY-004: a flight is drawn as a geodesic arc, not a two-point line', () => {
    renderOverlay()
    const points = JSON.parse(lines()[0].getAttribute('data-points') || '[]')
    expect(points.length).toBeGreaterThan(2)
    expect(points[0]).toEqual([48, 16])
    expect(points[points.length - 1]).toEqual([51.5, 16])
  })

  it('FE-COMP-RESOVERLAY-005: a train is drawn as the plain two-point line', () => {
    renderOverlay({ reservations: [booking({ type: 'train' })] })
    expect(JSON.parse(lines()[0].getAttribute('data-points') || '[]')).toEqual([[48, 16], [51.5, 16]])
  })

  it('FE-COMP-RESOVERLAY-006: a pending booking is dashed and dimmer than a confirmed one', () => {
    const { unmount } = renderOverlay({ reservations: [booking({ status: 'pending' })] })
    expect(styleOf(lines()[0])).toMatchObject({ opacity: 0.55, dashArray: '6, 6' })
    unmount()

    renderOverlay({ reservations: [booking({ id: 9 })] })
    const confirmed = styleOf(lines()[0])
    expect(confirmed.opacity).toBe(0.75)
    expect(confirmed.dashArray).toBeUndefined()
  })

  it('FE-COMP-RESOVERLAY-007: skips reservations that are not a transport type', () => {
    renderOverlay({ reservations: [booking({ type: 'hotel' as Reservation['type'] })] })
    expect(lines()).toHaveLength(0)
    expect(markers()).toHaveLength(0)
  })

  it('FE-COMP-RESOVERLAY-008: skips a booking with fewer than two waypoints', () => {
    renderOverlay({ reservations: [booking({ endpoints: [endpoint({ role: 'from', sequence: 0 })] })] })
    expect(lines()).toHaveLength(0)
  })

  it('FE-COMP-RESOVERLAY-009: orders waypoints by sequence and draws one leg per pair', () => {
    renderOverlay({
      reservations: [booking({
        type: 'train',
        endpoints: [
          endpoint({ role: 'to', sequence: 2, name: 'C', lat: 51.5, lng: 16 }),
          endpoint({ role: 'from', sequence: 0, name: 'A', lat: 48, lng: 16 }),
          endpoint({ role: 'stop', sequence: 1, name: 'B', lat: 50, lng: 16 }),
        ],
      })],
    })
    expect(lines()).toHaveLength(2)
    expect(JSON.parse(lines()[0].getAttribute('data-points') || '[]')).toEqual([[48, 16], [50, 16]])
    expect(JSON.parse(lines()[1].getAttribute('data-points') || '[]')).toEqual([[50, 16], [51.5, 16]])
    expect(markers()).toHaveLength(3)
  })

  it('FE-COMP-RESOVERLAY-010: hides a hop whose endpoints sit almost on top of each other', () => {
    renderOverlay({
      reservations: [booking({
        type: 'train',
        endpoints: [
          endpoint({ role: 'from', sequence: 0, lat: 48, lng: 16 }),
          endpoint({ role: 'to', sequence: 1, lat: 48.05, lng: 16 }), // 50 px, under the 200 px floor
        ],
      })],
    })
    expect(lines()).toHaveLength(0)
    expect(markers()).toHaveLength(0)
  })

  it('FE-COMP-RESOVERLAY-011: the same hop reappears once the map is zoomed in', () => {
    renderOverlay({
      reservations: [booking({
        type: 'train',
        endpoints: [
          endpoint({ role: 'from', sequence: 0, lat: 48, lng: 16 }),
          endpoint({ role: 'to', sequence: 1, lat: 48.05, lng: 16 }),
        ],
      })],
    })
    expect(lines()).toHaveLength(0)

    leaflet.view.scale = 20000 // 1000 px apart now
    leaflet.view.zoom = 14
    act(() => { leaflet.events.zoomend() })
    expect(lines()).toHaveLength(1)
  })

  it('FE-COMP-RESOVERLAY-012: each transport type gets its own declutter floor', () => {
    // 100 px apart: a flight survives (50 px floor), a cruise does not (150 px).
    const short = (type: string, id: number) => booking({
      id, type: type as Reservation['type'],
      endpoints: [
        endpoint({ role: 'from', sequence: 0, lat: 48, lng: 16 }),
        endpoint({ role: 'to', sequence: 1, lat: 48.1, lng: 16 }),
      ],
    })
    const { unmount } = renderOverlay({ reservations: [short('flight', 1)] })
    expect(lines().length).toBeGreaterThan(0)
    unmount()

    renderOverlay({ reservations: [short('cruise', 2)] })
    expect(lines()).toHaveLength(0)
  })

  it('FE-COMP-RESOVERLAY-013: clicking an endpoint reports its reservation id', () => {
    const onEndpointClick = vi.fn()
    renderOverlay({ reservations: [booking({ id: 42 })], onEndpointClick })
    fireEvent.click(markers()[1])
    expect(onEndpointClick).toHaveBeenCalledWith(42)
  })

  it('FE-COMP-RESOVERLAY-014: an endpoint without a click handler stays inert', () => {
    renderOverlay({ onEndpointClick: undefined })
    expect(() => fireEvent.click(markers()[0])).not.toThrow()
  })

  it('FE-COMP-RESOVERLAY-015: the tooltip shows the stop name and the booking title', () => {
    renderOverlay({ reservations: [booking({ title: 'OS 456' })] })
    const tooltips = screen.getAllByTestId('marker-tooltip')
    expect(tooltips[0].textContent).toContain('Vienna')
    expect(tooltips[0].textContent).toContain('OS 456')
  })

  it('FE-COMP-RESOVERLAY-016: endpoint badges carry no label until the setting is on', () => {
    renderOverlay()
    expect(labelOf(markers()[0])).toBe('')
  })

  it('FE-COMP-RESOVERLAY-017: with the setting on the badge shows the endpoint code', () => {
    seedStore(useSettingsStore, { settings: { map_booking_labels: true } })
    renderOverlay()
    expect(markers().map(labelOf)).toEqual(['VIE', 'LHR'])
  })

  it('FE-COMP-RESOVERLAY-018: a code-less stop falls back to its name without the parenthetical', () => {
    seedStore(useSettingsStore, { settings: { map_booking_labels: true } })
    renderOverlay({
      reservations: [booking({
        type: 'train',
        endpoints: [
          endpoint({ role: 'from', sequence: 0, name: 'Wien Hbf (Bahnsteig 3)', lat: 48, lng: 16 }),
          endpoint({ role: 'to', sequence: 1, name: 'München Hbf', lat: 51.5, lng: 16 }),
        ],
      })],
    })
    expect(markers().map(labelOf)).toEqual(['Wien Hbf', 'München Hbf'])
  })

  it('FE-COMP-RESOVERLAY-019: a short train hop draws its line but keeps its labels off', () => {
    seedStore(useSettingsStore, { settings: { map_booking_labels: true } })
    renderOverlay({
      reservations: [booking({
        type: 'train',
        endpoints: [
          endpoint({ role: 'from', sequence: 0, name: 'Wien', code: 'VIE', lat: 48, lng: 16 }),
          endpoint({ role: 'to', sequence: 1, name: 'Graz', code: 'GRZ', lat: 48.3, lng: 16 }),
        ],
      })],
    })
    // 300 px: over the 200 px line floor, under the 400 px label floor.
    expect(lines()).toHaveLength(1)
    expect(markers().map(labelOf)).toEqual(['', ''])
  })
})

describe('ReservationOverlay declutter floors and road routes', () => {
  // Same endpoints every time, only the north-south gap changes: at the mocked
  // scale one degree of latitude is 1000 px, so `dLat` *is* the pixel distance / 1000.
  const hop = (type: string, id: number, dLat: number) => booking({
    id, type: type as Reservation['type'],
    endpoints: [
      endpoint({ role: 'from', sequence: 0, name: 'Start', code: 'AAA', lat: 48, lng: 16 }),
      endpoint({ role: 'to', sequence: 1, name: 'End', code: 'BBB', lat: 48 + dLat, lng: 16 }),
    ],
  })

  it('FE-COMP-RESOVERLAY-030: a renderer without pane support still draws the overlay', () => {
    const realGetPane = leaflet.map.getPane
    leaflet.map.getPane = undefined
    try {
      renderOverlay()
      expect(leaflet.panes.size).toBe(0)
      expect(markers()).toHaveLength(2)
      expect(lines().length).toBeGreaterThan(0)
    } finally {
      leaflet.map.getPane = realGetPane
    }
  })

  it('FE-COMP-RESOVERLAY-031: a car hop has its own 80 px line floor', () => {
    const { unmount } = renderOverlay({ reservations: [hop('car', 1, 0.1)] })
    expect(lines()).toHaveLength(1)
    unmount()

    renderOverlay({ reservations: [hop('car', 2, 0.05)] })
    expect(lines()).toHaveLength(0)
  })

  it('FE-COMP-RESOVERLAY-032: a car keeps its endpoint labels off below 150 px', () => {
    seedStore(useSettingsStore, { settings: { map_booking_labels: true } })
    const { unmount } = renderOverlay({ reservations: [hop('car', 1, 0.1)] })
    expect(markers().map(labelOf)).toEqual(['', ''])
    unmount()

    renderOverlay({ reservations: [hop('car', 2, 0.2)] })
    expect(markers().map(labelOf)).toEqual(['AAA', 'BBB'])
  })

  it('FE-COMP-RESOVERLAY-033: a cruise draws from 150 px but only labels from 300 px', () => {
    seedStore(useSettingsStore, { settings: { map_booking_labels: true } })
    const { unmount } = renderOverlay({ reservations: [hop('cruise', 1, 0.2)] })
    expect(lines().length).toBeGreaterThan(0)
    expect(markers().map(labelOf)).toEqual(['', ''])
    unmount()

    renderOverlay({ reservations: [hop('cruise', 2, 0.4)] })
    expect(markers().map(labelOf)).toEqual(['AAA', 'BBB'])
  })

  it('FE-COMP-RESOVERLAY-034: a supplied road route replaces the straight arc', () => {
    const road: [number, number][] = [[48, 16], [49, 16.4], [51.5, 16]]
    renderOverlay({
      reservations: [hop('car', 7, 3.5)],
      roadRoutes: new Map([[7, road]]),
    })
    expect(lines()).toHaveLength(1)
    expect(JSON.parse(lines()[0].getAttribute('data-points') || '[]')).toEqual(road)
  })

  it('FE-COMP-RESOVERLAY-035: a one-point road route falls back to the straight arc', () => {
    renderOverlay({
      reservations: [hop('car', 7, 3.5)],
      roadRoutes: new Map([[7, [[48, 16]] as [number, number][]]]),
    })
    expect(JSON.parse(lines()[0].getAttribute('data-points') || '[]')).toEqual([[48, 16], [51.5, 16]])
  })

  it('FE-COMP-RESOVERLAY-036: a booking without an endpoints array is skipped', () => {
    renderOverlay({ reservations: [booking({ endpoints: undefined })] })
    expect(lines()).toHaveLength(0)
    expect(markers()).toHaveLength(0)
  })

  it('FE-COMP-RESOVERLAY-037: waypoints without a sequence keep their array order', () => {
    renderOverlay({
      reservations: [booking({
        type: 'train',
        endpoints: [
          endpoint({ role: 'from', sequence: undefined, name: 'A', lat: 48, lng: 16 }),
          endpoint({ role: 'stop', sequence: undefined, name: 'B', lat: 50, lng: 16 }),
          endpoint({ role: 'to', sequence: undefined, name: 'C', lat: 51.5, lng: 16 }),
        ],
      })],
    })
    expect(lines()).toHaveLength(2)
    expect(JSON.parse(lines()[0].getAttribute('data-points') || '[]')).toEqual([[48, 16], [50, 16]])
    expect(JSON.parse(lines()[1].getAttribute('data-points') || '[]')).toEqual([[50, 16], [51.5, 16]])
  })

  it('FE-COMP-RESOVERLAY-038: a leg whose stops share coordinates degrades to a straight segment', () => {
    renderOverlay({
      reservations: [booking({
        endpoints: [
          endpoint({ role: 'from', sequence: 0, name: 'Vienna', code: 'VIE', lat: 48, lng: 16 }),
          endpoint({ role: 'stop', sequence: 1, name: 'Vienna Gate', code: 'VIE', lat: 48, lng: 16 }),
          endpoint({ role: 'to', sequence: 2, name: 'London', code: 'LHR', lat: 51.5, lng: 16 }),
        ],
      })],
    })
    expect(lines()).toHaveLength(2)
    expect(JSON.parse(lines()[0].getAttribute('data-points') || '[]')).toHaveLength(2)
    expect(JSON.parse(lines()[1].getAttribute('data-points') || '[]').length).toBeGreaterThan(2)
  })

  it('FE-COMP-RESOVERLAY-039: a code-less stop between two coded ends falls back to its name', () => {
    seedStore(useSettingsStore, { settings: { map_booking_labels: true } })
    renderOverlay({
      reservations: [booking({
        type: 'train',
        endpoints: [
          endpoint({ role: 'from', sequence: 0, name: 'Wien', code: 'VIE', lat: 48, lng: 16 }),
          endpoint({ role: 'stop', sequence: 1, name: 'Zuerich HB (Gleis 5)', code: null, lat: 50, lng: 16 }),
          endpoint({ role: 'to', sequence: 2, name: 'London', code: 'LHR', lat: 51.5, lng: 16 }),
        ],
      })],
    })
    expect(markers().map(labelOf)).toEqual(['VIE', 'Zuerich HB', 'LHR'])
  })
})

describe('ReservationOverlay transit journeys (#1570)', () => {
  it('FE-COMP-RESOVERLAY-020: draws the stored rail alignment with a white casing under it', () => {
    renderOverlay({ reservations: [transitBooking([{ geometry: GEOMETRY, mode: 'BUS', line_color: '#7c3aed' }])] })
    expect(lines()).toHaveLength(2)
    expect(styleOf(lines()[0])).toMatchObject({ color: '#ffffff', weight: 6 })
    expect(styleOf(lines()[1])).toMatchObject({ color: '#7c3aed', weight: 3.5 })
    expect(JSON.parse(lines()[1].getAttribute('data-points') || '[]')).toEqual([[48, 2], [48.02, 2.01], [48.05, 2]])
  })

  it('FE-COMP-RESOVERLAY-021: a walking leg is dotted and gets no casing', () => {
    renderOverlay({ reservations: [transitBooking([{ geometry: GEOMETRY, mode: 'WALK' }])] })
    expect(lines()).toHaveLength(1)
    expect(styleOf(lines()[0])).toMatchObject({ color: '#64748b', dashArray: '1, 7' })
  })

  it('FE-COMP-RESOVERLAY-022: a leg without a line colour falls back to the transit blue', () => {
    renderOverlay({ reservations: [transitBooking([{ geometry: GEOMETRY, mode: 'BUS' }])] })
    expect(styleOf(lines()[1])).toMatchObject({ color: '#3b82f6' })
  })

  it('FE-COMP-RESOVERLAY-023: real geometry survives the endpoint declutter even zoomed right out', () => {
    // The two stations project ~20 px apart — far under the 200 px floor.
    renderOverlay({ reservations: [transitBooking([{ geometry: GEOMETRY, mode: 'BUS' }])] })
    expect(lines().length).toBeGreaterThan(0)
    expect(markers()).toHaveLength(2)
  })

  it('FE-COMP-RESOVERLAY-024: a transit journey without stored geometry is decluttered like any hop', () => {
    renderOverlay({ reservations: [transitBooking([{ mode: 'BUS' }])] })
    expect(lines()).toHaveLength(0)
  })
})

// computeDuration only feeds the stats badge, which this overlay no longer
// renders — but it still runs on every update, and a non-finite date once threw
// inside Intl.formatToParts and blanked the whole trip (#1620).
describe('ReservationOverlay duration math', () => {
  const timed = (from: Partial<ReservationEndpoint>, to: Partial<ReservationEndpoint>, res: Partial<Reservation> = {}) =>
    booking({
      endpoints: [
        endpoint({ role: 'from', sequence: 0, name: 'Vienna', code: 'VIE', lat: 48, lng: 16, ...from }),
        endpoint({ role: 'to', sequence: 1, name: 'London', code: 'LHR', lat: 51.5, lng: 16, ...to }),
      ],
      ...res,
    })

  it('FE-COMP-RESOVERLAY-025: renders a well-formed cross-timezone flight', () => {
    renderOverlay({ reservations: [timed(
      { timezone: 'Europe/Vienna', local_date: '2024-01-15', local_time: '09:20' },
      { timezone: 'Europe/London', local_date: '2024-01-15', local_time: '11:05' },
    )] })
    expect(lines().length).toBeGreaterThan(0)
  })

  it('FE-COMP-RESOVERLAY-026: renders a flight whose local arrival reads before its departure', () => {
    renderOverlay({ reservations: [timed(
      { timezone: 'Europe/Vienna', local_date: '2024-01-15', local_time: '22:30' },
      { timezone: 'America/New_York', local_date: '2024-01-15', local_time: '02:10' },
    )] })
    expect(lines().length).toBeGreaterThan(0)
  })

  it('FE-COMP-RESOVERLAY-027: renders a flight whose imported time is missing its minutes', () => {
    expect(() => renderOverlay({ reservations: [timed(
      { timezone: 'Europe/Vienna', local_date: '2024-01-15', local_time: '22' },
      { timezone: 'Europe/London', local_date: '2024-01-16', local_time: '08' },
    )] })).not.toThrow()
    expect(lines().length).toBeGreaterThan(0)
  })

  it('FE-COMP-RESOVERLAY-028: a time-only endpoint borrows the date from the other side', () => {
    renderOverlay({ reservations: [timed(
      { local_date: '2024-01-15', local_time: '09:20' }, {},
      { reservation_end_time: '17:30' } as Partial<Reservation>,
    )] })
    expect(lines().length).toBeGreaterThan(0)
  })

  it('FE-COMP-RESOVERLAY-029: two date-less times and an implausible gap both render', () => {
    const { unmount } = renderOverlay({ reservations: [timed({}, {}, {
      reservation_time: '09:20', reservation_end_time: '17:30',
    } as Partial<Reservation>)] })
    expect(lines().length).toBeGreaterThan(0)
    unmount()

    renderOverlay({ reservations: [timed({}, {}, {
      id: 5, reservation_time: '2024-01-15T09:20', reservation_end_time: '2024-01-19T17:30',
    } as Partial<Reservation>)] })
    expect(lines().length).toBeGreaterThan(0)
  })

  it('FE-COMP-RESOVERLAY-040: a date-less departure borrows the date from the arrival', () => {
    renderOverlay({ reservations: [timed(
      {}, { local_date: '2024-01-16', local_time: '08:00' },
      { reservation_time: '22:30' } as Partial<Reservation>,
    )] })
    expect(lines().length).toBeGreaterThan(0)
  })

  it('FE-COMP-RESOVERLAY-041: a hop shorter than an hour renders', () => {
    renderOverlay({ reservations: [timed({}, {}, {
      reservation_time: '2024-01-15T09:20', reservation_end_time: '2024-01-15T09:50',
    } as Partial<Reservation>)] })
    expect(lines().length).toBeGreaterThan(0)
  })

  it('FE-COMP-RESOVERLAY-042: a stored timestamp that carries no clock time renders', () => {
    renderOverlay({ reservations: [timed(
      { timezone: 'Europe/Vienna' }, { timezone: 'Europe/London' },
      { reservation_time: '2024-01-15T', reservation_end_time: '2024-01-15T18:00' } as Partial<Reservation>,
    )] })
    expect(lines().length).toBeGreaterThan(0)
  })
})
