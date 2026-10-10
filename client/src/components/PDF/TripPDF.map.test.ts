// FE-COMP-TRIPPDF-MAP-001 onward — the trip route map and its distance figure (#1736).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import type { RouteSegment } from '../../types'
import { useAddonStore } from '../../store/addonStore'

vi.mock('../Map/RouteCalculator', async (importActual) => {
  const actual = await importActual<typeof import('../Map/RouteCalculator')>()
  return { ...actual, calculateRouteWithLegs: vi.fn() }
})

// Real by default — one test below forces it to reject, to pin the logging contract.
vi.mock('../Map/tripRouteGeometry', async (importActual) => {
  const actual = await importActual<typeof import('../Map/tripRouteGeometry')>()
  return { ...actual, routeTrip: vi.fn(actual.routeTrip) }
})

// jsdom has no WebGL, so the real renderer always declines — mocked so both the
// basemap branch and the outline fallback can be exercised.
vi.mock('./tripMapImage', () => ({ renderTripMapImage: vi.fn(async () => null) }))

const { calculateRouteWithLegs } = await import('../Map/RouteCalculator')
const { renderTripMapImage } = await import('./tripMapImage')
const { routeTrip } = await import('../Map/tripRouteGeometry')
const { downloadTripPDF } = await import('./TripPDF')

const leg = (distance: number): RouteSegment => ({
  mid: [0, 0], from: [0, 0], to: [0, 0],
  distance, duration: 900,
  distanceText: '12 km', durationText: '15 min', walkingText: '2 h', drivingText: '15 min',
})

const place = (id: number, lat: number, lng: number) => ({ id, name: `P${id}`, lat, lng })
const assign = (id: number, dayId: number, order: number, lat: number, lng: number) =>
  ({ id, day_id: dayId, place_id: id, order_index: order, place: place(id, lat, lng) })

const args = {
  trip: { id: 1, title: 'My Trip', description: null, cover_image: null, currency: 'EUR' } as any,
  days: [
    { id: 1, day_number: 1, title: null, date: '2025-06-01' },
    { id: 2, day_number: 2, title: 'Coast road', date: '2025-06-02' },
  ] as any[],
  places: [],
  assignments: {
    '1': [assign(1, 1, 0, 48.86, 2.35), assign(2, 1, 1, 48.90, 2.42)],
    '2': [assign(3, 2, 0, 45.76, 4.83), assign(4, 2, 1, 45.80, 4.90)],
  } as any,
  categories: [],
  dayNotes: [],
  reservations: [],
  t: (key: string, params?: any) => (params?.n !== undefined ? `Day ${params.n}` : key),
  locale: 'en-US',
}

const srcdoc = () =>
  (document.querySelector('#pdf-preview-overlay iframe') as HTMLIFrameElement).srcdoc

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { origin: 'http://localhost:3000', pathname: '/', href: 'http://localhost:3000/', search: '' },
    writable: true,
  })
  server.use(
    http.get('/api/trips/:id/accommodations', () => HttpResponse.json({ accommodations: [] })),
    http.get('/api/pdf-sections/:tripId', () => HttpResponse.json({ sections: [] })),
  )
  vi.mocked(calculateRouteWithLegs).mockReset()
  vi.mocked(routeTrip).mockClear()
  vi.mocked(renderTripMapImage).mockClear()
  vi.mocked(calculateRouteWithLegs).mockResolvedValue({
    coordinates: [[48.86, 2.35], [48.88, 2.39], [48.90, 2.42]],
    distance: 12000, duration: 900,
    legs: [leg(12000)],
  })
})

afterEach(() => {
  document.getElementById('pdf-preview-overlay')?.remove()
  useAddonStore.setState({ addons: [] })
})

describe('trip route map in the PDF', () => {
  it('prints a single Tour track without requesting an ordinary route through it', async () => {
    useAddonStore.setState({ addons: [{ id: 'tours', enabled: true }] as never })
    const geometry = JSON.stringify([[48.1, 11.1], [48.2, 11.2]])
    const assignment = { ...assign(7, 1, 0, 48.1, 11.1), tour_place_id: 7, tour_route_geometry: geometry }
    await downloadTripPDF({ ...args, days: [args.days[0]], assignments: { '1': [assignment] } })
    expect(calculateRouteWithLegs).not.toHaveBeenCalled()
    expect(srcdoc()).toContain('class="trip-map-svg"')
    expect(srcdoc()).toContain('stroke="#14805e"')
  })

  it('filters a participant-hidden Tour before the shared projection and PDF map', async () => {
    useAddonStore.setState({ addons: [{ id: 'tours', enabled: true }] as never })
    const geometry = JSON.stringify([[48.1, 11.1], [48.2, 11.2]])
    const hiddenTour = { ...assign(7, 1, 0, 48.1, 11.1), tour_place_id: 7,
      tour_route_geometry: geometry, participants: [{ user_id: 99, username: 'Other' }] }
    const visible = { ...assign(8, 1, 1, 48.3, 11.3), participants: [{ user_id: 42, username: 'Reader' }] }
    await downloadTripPDF({ ...args, days: [args.days[0]], onlyUserId: 42,
      assignments: { '1': [hiddenTour, visible] } })

    const input = vi.mocked(routeTrip).mock.calls[0][0]
    expect(input.assignments['1'].map(assignment => assignment.id)).toEqual([visible.id])
    expect(input.toursEnabled).toBe(true)
    expect(srcdoc()).not.toContain('stroke="#14805e"')
    expect(srcdoc()).not.toContain('class="trip-map"')
  })

  it('renders an excluded Tour once while its connector route bridges A to C', async () => {
    useAddonStore.setState({ addons: [{ id: 'tours', enabled: true }] as never })
    const a = assign(11, 1, 0, 48.1, 11.1)
    const geometry = JSON.stringify([[48.2, 11.2], [48.25, 11.25], [48.3, 11.3]])
    const excludedTour = { ...assign(12, 1, 1, 48.2, 11.2), tour_place_id: 12,
      tour_route_geometry: geometry, route_excluded: true }
    const c = assign(13, 1, 2, 48.4, 11.4)
    vi.mocked(calculateRouteWithLegs).mockResolvedValueOnce({
      coordinates: [[48.1, 11.1], [48.4, 11.4]], distance: 12000, duration: 900,
      legs: [leg(12000)],
    })
    await downloadTripPDF({ ...args, days: [args.days[0]], assignments: { '1': [a, excludedTour, c] } })

    expect(vi.mocked(calculateRouteWithLegs).mock.calls.map(([points]) =>
      points.map(point => [point.lat, point.lng])))
      .toEqual([[[48.1, 11.1], [48.4, 11.4]]])
    const routed = await vi.mocked(routeTrip).mock.results[0].value
    expect(routed.days[0].tourLines).toEqual([[[48.2, 11.2], [48.25, 11.25], [48.3, 11.3]]])
    const html = srcdoc()
    expect(html.match(/stroke="#14805e"/g)).toHaveLength(1)
    expect(vi.mocked(renderTripMapImage).mock.calls[0][0]).toMatchObject([
      { lines: [[[48.1, 11.1], [48.4, 11.4]]], tourLines: [[[48.2, 11.2], [48.25, 11.25], [48.3, 11.3]]] },
    ])
  })

  it('filters hidden service stops before routing or Tour projection', async () => {
    useAddonStore.setState({ addons: [{ id: 'tours', enabled: true }] as never })
    const a = assign(41, 1, 0, 48.1, 11.1)
    const service = { ...assign(42, 1, 1, 48.2, 11.2), place: { ...place(42, 48.2, 11.2), stop_type: 'fuel' } }
    const c = assign(43, 1, 2, 48.4, 11.4)
    await downloadTripPDF({ ...args, days: [args.days[0]], showServiceStops: false,
      assignments: { '1': [a, service, c] } })

    const input = vi.mocked(routeTrip).mock.calls[0][0]
    expect(input.assignments['1'].map(assignment => assignment.id)).toEqual([a.id, c.id])
    expect(vi.mocked(calculateRouteWithLegs).mock.calls.map(([points]) =>
      points.map(point => [point.lat, point.lng])))
      .toEqual([[[48.1, 11.1], [48.4, 11.4]]])
  })

  it('keeps the legacy Place anchor and does not emit Tour lines when Tours are off', async () => {
    const a = assign(21, 1, 0, 48.1, 11.1)
    const geometry = JSON.stringify([[48.2, 11.2], [48.3, 11.3]])
    const tourPlace = { ...assign(22, 1, 1, 48.25, 11.25), tour_place_id: 22, tour_route_geometry: geometry }
    const c = assign(23, 1, 2, 48.4, 11.4)
    await downloadTripPDF({ ...args, days: [args.days[0]], assignments: { '1': [a, tourPlace, c] } })

    expect(vi.mocked(routeTrip).mock.calls[0][0].toursEnabled).toBe(false)
    expect(vi.mocked(calculateRouteWithLegs).mock.calls.map(([points]) =>
      points.map(point => [point.lat, point.lng])))
      .toEqual([[[48.1, 11.1], [48.25, 11.25], [48.4, 11.4]]])
    expect(srcdoc()).not.toContain('stroke="#14805e"')
  })

  it('prints one localized warning for an invalid Tour and does not invent its outgoing endpoint', async () => {
    useAddonStore.setState({ addons: [{ id: 'tours', enabled: true }] as never })
    const a = assign(31, 1, 0, 48.1, 11.1)
    const invalidTour = { ...assign(32, 1, 1, 48.2, 11.2), tour_place_id: 32, tour_route_geometry: 'not valid geometry' }
    const c = assign(33, 1, 2, 48.4, 11.4)
    await expect(downloadTripPDF({ ...args, days: [args.days[0]], assignments: { '1': [a, invalidTour, c] } })).resolves.toBeUndefined()

    expect(vi.mocked(calculateRouteWithLegs).mock.calls.map(([points]) =>
      points.map(point => [point.lat, point.lng])))
      .toEqual([[[48.1, 11.1], [48.2, 11.2]]])
    expect(srcdoc().match(/tours\.dayRoute\.endpointUnknown/g)).toHaveLength(1)
    expect(srcdoc()).toContain('P32')
    expect(srcdoc()).not.toContain('stroke="#14805e"')
  })

  it('FE-COMP-TRIPPDF-MAP-001: puts the route map and its legend in the document', async () => {
    await downloadTripPDF(args)
    const html = srcdoc()

    expect(html).toContain('class="trip-map"')
    expect(html).toContain('<svg class="trip-map-svg"')
    expect(html).toContain('pdf.mapTitle')
    // Both days named in the legend, the titled one by its title.
    expect(html).toContain('Day 1')
    expect(html).toContain('Coast road')
  })

  it('FE-COMP-TRIPPDF-MAP-002: totals the trip distance on the cover and over the map', async () => {
    await downloadTripPDF(args)
    const html = srcdoc()

    // One routed chunk per day, 12 km each.
    expect(html).toContain('24 km')
    expect(html).toContain('pdf.distanceLabel')
  })

  it('FE-COMP-TRIPPDF-MAP-003: prints the reader\'s own unit', async () => {
    await downloadTripPDF({ ...args, distanceUnit: 'imperial' })
    expect(srcdoc()).toContain('14.9 mi')
  })

  it('FE-COMP-TRIPPDF-MAP-004: credits the boundary data it draws', async () => {
    await downloadTripPDF(args)
    expect(srcdoc()).toContain('pdf.mapCredit')
  })

  // A city trip often holds one stop a day and gets its whole route from the hotel
  // legs either side of it. That is a different path through the builder from a day
  // with two stops of its own, and it is the common shape (#1736).
  it('FE-COMP-TRIPPDF-MAP-004b: a day that only routes via its hotel still draws', async () => {
    // The envelope the endpoint actually answers with — a bare array here is what let
    // the missing hotel legs through unnoticed.
    server.use(http.get('/api/trips/:id/accommodations', () => HttpResponse.json({
      accommodations: [{
        id: 2, trip_id: 1, place_id: 5, start_day_id: 1, end_day_id: 2,
        check_in: null, check_in_end: null, check_out: null,
        place_name: 'Hotel', place_lat: 48.8714, place_lng: 2.3426,
      }],
    })))

    await downloadTripPDF({
      ...args,
      assignments: { '1': [assign(1, 1, 0, 48.8583, 2.2945)], '2': [assign(2, 2, 0, 48.8611, 2.3357)] } as any,
    })
    const html = srcdoc()

    expect(html).toContain('<svg class="trip-map-svg"')
    // Between the cover and the days, which is where it is meant to read.
    expect(html.indexOf('class="trip-map"')).toBeGreaterThan(html.indexOf('class="cover"'))
    expect(html.indexOf('class="trip-map"')).toBeLessThan(html.indexOf('class="day-section"'))
  })

  it('FE-COMP-TRIPPDF-MAP-011: prefers the real basemap when it renders', async () => {
    vi.mocked(renderTripMapImage).mockResolvedValueOnce(
      '<svg class="trip-map-svg"><image href="data:image/png;base64,AAA"/></svg>',
    )
    await downloadTripPDF(args)
    const html = srcdoc()

    expect(html).toContain('data:image/png;base64,AAA')
    // The outline map's sea rectangle is the tell that the fallback drew instead.
    expect(html).not.toContain('#eef3f7')
  })

  it('FE-COMP-TRIPPDF-MAP-012: falls back to the outline map when the basemap declines', async () => {
    vi.mocked(renderTripMapImage).mockResolvedValueOnce(null)
    await downloadTripPDF(args)
    const html = srcdoc()

    expect(html).toContain('<svg class="trip-map-svg"')
    expect(html).toContain('#eef3f7')
  })

  it('FE-COMP-TRIPPDF-MAP-005: a trip with no planned day prints without a map', async () => {
    await downloadTripPDF({ ...args, assignments: {} })
    const html = srcdoc()

    expect(html).not.toContain('class="trip-map"')
    expect(html).toContain('pdf.travelPlan')
  })

  it('FE-COMP-TRIPPDF-MAP-008: says why the map is missing when the route builder throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // A refused leg is caught per-leg and leaves a straight line; this is the other
    // kind — the builder itself failing on data it cannot read, which used to vanish
    // without trace and leave a PDF that looked like it simply had no route.
    vi.mocked(routeTrip).mockRejectedValueOnce(new Error('boom'))
    await downloadTripPDF(args)

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('[tripPdfMap] routing the trip failed'),
      expect.any(Error),
    )
    // The itinerary still prints — the map is an extra, not a precondition.
    expect(srcdoc()).toContain('pdf.travelPlan')
    expect(srcdoc()).not.toContain('class="trip-map"')
    warn.mockRestore()
  })

  it('FE-COMP-TRIPPDF-MAP-009: says so when the trip has stops but nothing that routes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // One lone stop on the day, and no accommodation to bookend it — no route exists.
    await downloadTripPDF({ ...args, assignments: { '1': [assign(1, 1, 0, 48.86, 2.35)] } as any })

    expect(srcdoc()).not.toContain('class="trip-map"')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[tripPdfMap] no map drawn: 0 of 2 day(s)'))
    warn.mockRestore()
  })

  it('FE-COMP-TRIPPDF-MAP-010: stays quiet for a trip nobody has planned yet', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await downloadTripPDF({ ...args, assignments: {} })

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[tripPdfMap]'))
    warn.mockRestore()
  })

  it('FE-COMP-TRIPPDF-MAP-006: a router that refuses still prints the map and the days', async () => {
    vi.mocked(calculateRouteWithLegs).mockRejectedValue(new Error('429'))
    await downloadTripPDF(args)
    const html = srcdoc()

    // Straight lines stand in for the roads...
    expect(html).toContain('<svg class="trip-map-svg"')
    // ...and a total nobody could compute is left off rather than printed as zero.
    expect(html).not.toContain('pdf.distanceLabel')
  })

})
