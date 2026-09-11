// FE-COMP-TRIPPDF-MAP-001 onward — the trip route map and its distance figure (#1736).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../tests/helpers/msw/server'
import type { RouteSegment } from '../../types'

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
  vi.mocked(calculateRouteWithLegs).mockResolvedValue({
    coordinates: [[48.86, 2.35], [48.88, 2.39], [48.90, 2.42]],
    distance: 12000, duration: 900,
    legs: [leg(12000)],
  })
})

afterEach(() => {
  document.getElementById('pdf-preview-overlay')?.remove()
})

describe('trip route map in the PDF', () => {
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
