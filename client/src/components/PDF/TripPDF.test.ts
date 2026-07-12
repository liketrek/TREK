// FE-COMP-TRIPPDF-001 to FE-COMP-TRIPPDF-010
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { downloadTripPDF } from './TripPDF'
import { server } from '../../../tests/helpers/msw/server'

// ── Helpers ───────────────────────────────────────────────────────────────────

const minimalArgs = {
  trip: { id: 1, title: 'My Trip', description: null, cover_image: null } as any,
  days: [{ id: 1, day_number: 1, title: null, date: '2025-06-01' }] as any[],
  places: [],
  assignments: {},
  categories: [],
  dayNotes: [],
  reservations: [],
  t: (key: string, params?: any) => {
    if (params?.n !== undefined) return `Day ${params.n}`
    return key
  },
  locale: 'en-US',
}

function getOverlay(): HTMLElement | null {
  return document.getElementById('pdf-preview-overlay')
}

function getIframe(): HTMLIFrameElement | null {
  return document.querySelector('#pdf-preview-overlay iframe')
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Stub window.location.origin
  Object.defineProperty(window, 'location', {
    value: { origin: 'http://localhost:3000', pathname: '/', href: 'http://localhost:3000/', search: '' },
    writable: true,
    configurable: true,
  })

  // Default MSW handlers for this test suite
  server.use(
    http.get('/api/trips/:id/accommodations', () =>
      HttpResponse.json({ accommodations: [] })
    ),
    http.get('/api/maps/place-photo/:placeId', () =>
      HttpResponse.json({ photoUrl: null })
    ),
    http.get('/api/pdf-sections/:tripId', () =>
      HttpResponse.json({ sections: [] })
    ),
  )
})

afterEach(() => {
  // Clean up any overlay left by the function under test
  document.getElementById('pdf-preview-overlay')?.remove()
  vi.restoreAllMocks()
})

// ── Shared rich fixtures ──────────────────────────────────────────────────────

const dayWithPlaces = { id: 10, day_number: 1, title: 'Rome Day', date: '2025-06-01' } as any
const placeWithDetails = {
  id: 100,
  name: 'Colosseum',
  description: 'Ancient amphitheater',
  address: 'Piazza del Colosseo, Rome',
  category_id: 5,
  price: '15',
  image_url: null,
  google_place_id: null,
  place_time: '10:00',
  notes: 'Book tickets in advance',
} as any
const assignmentForDay = { id: 200, day_id: 10, place_id: 100, order_index: 0, place: placeWithDetails }
const categoryForPlace = { id: 5, name: 'Landmark', icon: 'landmark', color: '#e11d48' } as any
const dayNote = { id: 300, day_id: 10, text: 'Remember sunscreen', time: '08:00', icon: 'Info', sort_order: 1 } as any
const transportReservation = {
  id: 400,
  title: 'Flight to Rome',
  type: 'flight',
  day_id: 10,
  reservation_time: '2025-06-01T14:30:00',
  confirmation_number: 'ABC123',
  metadata: JSON.stringify({ airline: 'Air Italia', flight_number: 'AI123', departure_airport: 'CDG', arrival_airport: 'FCO' }),
} as any

const multiLegFlight = {
  id: 401,
  title: 'Flight to Tokyo',
  type: 'flight',
  day_id: 10,
  reservation_time: '2025-06-01T08:00:00',
  confirmation_number: 'XYZ789',
  metadata: JSON.stringify({
    legs: [
      { from: 'FRA', to: 'BER', airline: 'Lufthansa', flight_number: 'LH1' },
      { from: 'BER', to: 'HND', airline: 'Lufthansa', flight_number: 'LH2' },
    ],
    departure_airport: 'FRA', arrival_airport: 'HND', airline: 'Lufthansa', flight_number: 'LH1',
  }),
} as any

const richArgs = {
  trip: { id: 10, title: 'Italy Trip', description: 'Summer adventure', cover_image: '/uploads/cover.jpg' } as any,
  days: [dayWithPlaces],
  places: [placeWithDetails],
  assignments: { '10': [assignmentForDay] } as any,
  categories: [categoryForPlace],
  dayNotes: [dayNote],
  reservations: [transportReservation],
  t: (key: string, params?: any) => {
    if (params?.n !== undefined) return `Day ${params.n}`
    return key
  },
  locale: 'en-US',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('downloadTripPDF', () => {
  it('FE-COMP-TRIPPDF-001: resolves without throwing', async () => {
    await expect(downloadTripPDF(minimalArgs)).resolves.not.toThrow()
  })

  it('FE-COMP-TRIPPDF-002: appends an overlay div to document.body', async () => {
    await downloadTripPDF(minimalArgs)
    expect(document.getElementById('pdf-preview-overlay')).not.toBeNull()
  })

  it('FE-COMP-TRIPPDF-003: overlay contains an iframe with srcdoc', async () => {
    await downloadTripPDF(minimalArgs)
    const iframe = getIframe()
    expect(iframe).not.toBeNull()
    expect(iframe!.srcdoc).toBeTruthy()
    expect(iframe!.srcdoc.length).toBeGreaterThan(0)
  })

  it('FE-COMP-TRIPPDF-004: HTML contains the trip title', async () => {
    await downloadTripPDF(minimalArgs)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('My Trip')
  })

  it('FE-COMP-TRIPPDF-005: HTML contains a day section for each day', async () => {
    const args = {
      ...minimalArgs,
      days: [{ id: 1, day_number: 1, title: 'Day One', date: '2025-06-01' }] as any[],
    }
    await downloadTripPDF(args)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('Day One')
  })

  it('FE-COMP-TRIPPDF-005b: day is a table with a thead header that repeats on overflow pages (#1471)', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    const srcdoc = iframe!.srcdoc
    // The day is a real <table> whose <thead> is repeated by the browser's print
    // engine on every page an overflowing day spills onto.
    expect(srcdoc).toContain('<table class="day-section')
    expect(srcdoc).toContain('<thead class="day-header">')
    expect(srcdoc).toContain('<tbody class="day-body-group">')
    // The dark bar (background/padding/flex) lives in an inner wrapper inside the thead.
    expect(srcdoc).toContain('class="day-header-bar"')
    // Day content still renders inside the new structure.
    expect(srcdoc).toContain('Rome Day')
    expect(srcdoc).toContain('Colosseum')
  })

  it('FE-COMP-TRIPPDF-006: escHtml prevents XSS in trip title', async () => {
    const args = {
      ...minimalArgs,
      trip: { id: 1, title: '<script>alert(1)</script>', description: null, cover_image: null } as any,
    }
    await downloadTripPDF(args)
    const iframe = getIframe()
    expect(iframe!.srcdoc).not.toContain('<script>alert(1)</script>')
    expect(iframe!.srcdoc).toContain('&lt;script&gt;')
  })

  it('FE-COMP-TRIPPDF-007: close button removes the overlay from the DOM', async () => {
    await downloadTripPDF(minimalArgs)
    const closeBtn = document.getElementById('pdf-close-btn') as HTMLButtonElement
    expect(closeBtn).not.toBeNull()
    closeBtn.click()
    expect(document.getElementById('pdf-preview-overlay')).toBeNull()
  })

  it('FE-COMP-TRIPPDF-008: clicking backdrop outside the card removes the overlay', async () => {
    await downloadTripPDF(minimalArgs)
    const overlay = getOverlay()!
    overlay.click()
    expect(document.getElementById('pdf-preview-overlay')).toBeNull()
  })

  it('FE-COMP-TRIPPDF-009: works with no days (empty itinerary)', async () => {
    const args = { ...minimalArgs, days: [] }
    await expect(downloadTripPDF(args)).resolves.not.toThrow()
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('<!DOCTYPE html>')
    // No day sections — should not contain day-section class
    expect(iframe!.srcdoc).not.toContain('class="day-section')
  })

  it('FE-COMP-TRIPPDF-010: calls accommodationsApi.list with the trip id', async () => {
    const { accommodationsApi } = await import('../../api/client')
    const spy = vi.spyOn(accommodationsApi, 'list')
    await downloadTripPDF(minimalArgs)
    expect(spy).toHaveBeenCalledWith(1)
  })

  it('FE-COMP-TRIPPDF-011: renders place cards with name, address and category badge', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('Colosseum')
    expect(iframe!.srcdoc).toContain('Piazza del Colosseo, Rome')
    expect(iframe!.srcdoc).toContain('Landmark')
  })

  it('FE-COMP-TRIPPDF-012: renders note cards in day body', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('Remember sunscreen')
  })

  it('FE-COMP-TRIPPDF-013: renders transport reservation cards', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('Flight to Rome')
    expect(iframe!.srcdoc).toContain('ABC123')
    // Single-leg flight keeps its full-route subtitle.
    expect(iframe!.srcdoc).toContain('Air Italia · AI123 · CDG → FCO')
  })

  it('FE-COMP-TRIPPDF-013b: renders every flight number for a multi-leg flight', async () => {
    await downloadTripPDF({ ...richArgs, reservations: [multiLegFlight] })
    const iframe = getIframe()
    // One subtitle line per leg, each with its own flight number and segment route.
    expect(iframe!.srcdoc).toContain('Lufthansa · LH1 · FRA → BER')
    expect(iframe!.srcdoc).toContain('Lufthansa · LH2 · BER → HND')
  })

  it('FE-COMP-TRIPPDF-014: renders cover image when trip has cover_image', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    // Cover image rendered as background-image on .cover-bg
    expect(iframe!.srcdoc).toContain('cover.jpg')
  })

  it('FE-COMP-TRIPPDF-015: renders accommodation section when accommodations exist', async () => {
    server.use(
      http.get('/api/trips/:id/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1,
            start_day_id: 10,
            end_day_id: 10,
            place_name: 'Hotel Roma',
            place_address: 'Via Roma 1',
            check_in: '15:00',
            check_out: '11:00',
            notes: 'Breakfast included',
            confirmation: 'CONF999',
          }],
        })
      ),
    )
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('Hotel Roma')
    expect(iframe!.srcdoc).toContain('CONF999')
  })

  it('FE-COMP-TRIPPDF-016: renders place description and price chip', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('Ancient amphitheater')
    // Price chip: 15 EUR
    expect(iframe!.srcdoc).toContain('15')
    expect(iframe!.srcdoc).toContain('EUR')
  })

  it('FE-COMP-TRIPPDF-017: renders trip description on cover', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('Summer adventure')
  })

  it('FE-COMP-TRIPPDF-018: renders place with direct image URL', async () => {
    const argsWithImg = {
      ...richArgs,
      assignments: {
        '10': [{
          ...assignmentForDay,
          place: { ...placeWithDetails, image_url: '/uploads/colosseum.jpg' },
        }],
      } as any,
    }
    await downloadTripPDF(argsWithImg)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('colosseum.jpg')
  })

  it('FE-COMP-TRIPPDF-018b: renders a persisted place-photo proxy image_url as an <img>, not the category icon (#1130)', async () => {
    const args = {
      ...richArgs,
      assignments: {
        '10': [{
          ...assignmentForDay,
          place: { ...placeWithDetails, image_url: '/api/maps/place-photo/ChIJabc/bytes' },
        }],
      } as any,
    }
    await downloadTripPDF(args)
    const iframe = getIframe()
    // The proxy path (no file extension) must still embed as an absolute <img>.
    expect(iframe!.srcdoc).toContain('http://localhost:3000/api/maps/place-photo/ChIJabc/bytes')
    expect(iframe!.srcdoc).toContain('class="place-thumb"')
  })

  it('FE-COMP-TRIPPDF-019: fetches google place photos for places with google_place_id', async () => {
    let photoCalled = false
    server.use(
      http.get('/api/maps/place-photo/:placeId', () => {
        photoCalled = true
        return HttpResponse.json({ photoUrl: 'https://example.com/photo.jpg' })
      }),
    )
    const argsWithGooglePlace = {
      ...richArgs,
      assignments: {
        '10': [{
          ...assignmentForDay,
          place: { ...placeWithDetails, image_url: null, google_place_id: 'ChIJrTLr-GyuEmsRBfy61i59si0' },
        }],
      } as any,
    }
    await downloadTripPDF(argsWithGooglePlace)
    expect(photoCalled).toBe(true)
  })

  it('FE-COMP-TRIPPDF-019b: fetches photos for OSM places via osm_id recovered from the places pool (#1130)', async () => {
    let fetchedId: string | null = null
    server.use(
      http.get('/api/maps/place-photo/:placeId', ({ params }) => {
        fetchedId = params.placeId as string
        return HttpResponse.json({ photoUrl: 'https://example.com/osm.jpg' })
      }),
    )
    // The assignment projection drops osm_id; the full place in `places` carries it.
    const osmPlace = { ...placeWithDetails, id: 101, image_url: null, google_place_id: null, osm_id: 'node/240109189', lat: 41.89, lng: 12.49 }
    const args = {
      ...richArgs,
      places: [osmPlace],
      assignments: {
        '10': [{ ...assignmentForDay, id: 201, place_id: 101, place: { ...placeWithDetails, id: 101, image_url: null, google_place_id: null } }],
      } as any,
    }
    await downloadTripPDF(args)
    // osm_id is used as the photo key (not the coords fallback), proving the pool lookup works.
    expect(fetchedId).toBe('node/240109189')
  })

  it('FE-COMP-TRIPPDF-020: renders empty day message when no items assigned', async () => {
    const args = {
      ...minimalArgs,
      days: [{ id: 99, day_number: 2, title: 'Free Day', date: '2025-06-02' }] as any[],
      assignments: {},
    }
    await downloadTripPDF(args)
    const iframe = getIframe()
    // The empty-day div should appear (contains the translation key for empty day)
    expect(iframe!.srcdoc).toContain('dayplan.emptyDay')
  })

  it('FE-COMP-TRIPPDF-021: appends plugin pdf sections after the days, escaped', async () => {
    server.use(
      http.get('/api/pdf-sections/:tripId', () =>
        HttpResponse.json({
          sections: [{
            pluginId: 'weather',
            title: 'Weather <b>Forecast</b>',
            paragraphs: ['Sunny all week'],
            table: { headers: ['Day', 'Temp'], rows: [['Mon', '24°C']] },
          }],
        })
      ),
    )
    await downloadTripPDF(richArgs)
    const srcdoc = getIframe()!.srcdoc
    expect(srcdoc).toContain('class="plugin-section"')
    // Plugin text is escHtml'd like the core content — no markup passes through.
    expect(srcdoc).not.toContain('<b>Forecast</b>')
    expect(srcdoc).toContain('Weather &lt;b&gt;Forecast&lt;/b&gt;')
    expect(srcdoc).toContain('Sunny all week')
    expect(srcdoc).toContain('24°C')
    // Sections come after the last day section.
    expect(srcdoc.indexOf('class="plugin-sections')).toBeGreaterThan(srcdoc.lastIndexOf('class="day-section'))
  })

  it('FE-COMP-TRIPPDF-022: renders no plugin block when the sections fetch fails (fail-safe)', async () => {
    server.use(http.get('/api/pdf-sections/:tripId', () => HttpResponse.error()))
    await expect(downloadTripPDF(minimalArgs)).resolves.not.toThrow()
    expect(getIframe()!.srcdoc).not.toContain('class="plugin-sections')
  })
})
