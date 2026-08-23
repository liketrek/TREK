// FE-COMP-TRIPPDF-001 to FE-COMP-TRIPPDF-010
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { downloadTripPDF } from './TripPDF'
import { server } from '../../../tests/helpers/msw/server'
import { clearExchangeRateCache } from '../../hooks/useExchangeRates'
import { getMergedItems, getTransportForDay } from '../../utils/dayMerge'

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
    // Mixed-currency exports fetch FX rates; keep the suite hermetic.
    http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.json([])),
  )
  // The FX cache is module-level and would leak rates between tests in this file.
  clearExchangeRateCache()
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

  it('FE-COMP-TRIPPDF-005c: the gap under the day header lives in the repeated thead cell (#1531)', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    const srcdoc = iframe!.srcdoc
    // The thead is repeated on every overflow page, so the spacing below the header bar
    // must be declared on its cell...
    expect(srcdoc).toContain('.day-header > tr > td { padding-bottom: 12px; }')
    // ...and not as a block-start padding on .day-body, which the print engine only paints
    // on the first fragment of the (fragmented) body cell.
    expect(srcdoc).toContain('.day-body  { padding: 0 28px 6px; }')
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

  it('FE-COMP-TRIPPDF-013c: a flight that lands the same day shows both times (#1310)', async () => {
    const sameDay = { ...transportReservation, reservation_end_time: '2025-06-01T16:45:00' }
    await downloadTripPDF({ ...richArgs, reservations: [sameDay] })
    const iframe = getIframe()

    // Without the landing time the reader cannot tell what is left of the day.
    expect(iframe!.srcdoc).toContain('14:30 – 16:45')
  })

  it('FE-COMP-TRIPPDF-013d: a flight without a landing time still shows its departure', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()

    expect(iframe!.srcdoc).toContain('14:30')
    expect(iframe!.srcdoc).not.toContain('14:30 –')
  })

  it('FE-COMP-TRIPPDF-013e: an overnight flight keeps its arrival on the arrival day (#1310)', async () => {
    // Landing tomorrow: the departure day must not carry tomorrow's clock next
    // to today's departure — the arrival day shows it as its own time.
    const overnight = { ...transportReservation, day_id: 10, end_day_id: 11, reservation_end_time: '2025-06-02T06:15:00' }
    await downloadTripPDF({
      ...richArgs,
      days: [dayWithPlaces, { id: 11, day_number: 2, title: null, date: '2025-06-02' } as never],
      reservations: [overnight],
    })
    const iframe = getIframe()

    expect(iframe!.srcdoc).not.toContain('14:30 – 06:15')
    expect(iframe!.srcdoc).toContain('06:15')
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

  it('FE-COMP-TRIPPDF-023: a cover url cannot close url() and add a second declaration', async () => {
    // cover_image is a free string on the write path, and the style attribute is decoded
    // before the CSS is parsed, so the quote and the paren have to be encoded.
    const hostile = "http://host/a.jpg');background-image:url('http://elsewhere/leak.jpg"
    await downloadTripPDF({ ...richArgs, trip: { ...richArgs.trip, cover_image: hostile } as any })
    const iframe = getIframe()
    const style = /<div class="cover-bg" style="([^"]*)"/.exec(iframe!.srcdoc)![1]

    expect(style.split('url(')).toHaveLength(2)
    expect(style.match(/'/g)).toHaveLength(2)
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

  it('FE-COMP-TRIPPDF-016: renders place description and a currency-formatted price chip', async () => {
    await downloadTripPDF(richArgs)
    const iframe = getIframe()
    expect(iframe!.srcdoc).toContain('Ancient amphitheater')
    // richArgs trip has no explicit currency, place has no currency override —
    // formatMoney falls back to EUR, formatted via Intl (symbol, not literal "EUR" text).
    expect(iframe!.srcdoc).toContain('15,00')
    expect(iframe!.srcdoc).toContain('€')
  })

  it('FE-COMP-TRIPPDF-016b: formats price chip and totals in the trip currency, not EUR', async () => {
    const usdArgs = {
      ...richArgs,
      trip: { ...richArgs.trip, currency: 'USD' },
    }
    await downloadTripPDF(usdArgs)
    const iframe = getIframe()
    // Place price chip: place has no currency override, falls back to trip.currency (USD).
    expect(iframe!.srcdoc).toContain('$15.00')
    // No literal "EUR" text should leak into a USD trip's export.
    expect(iframe!.srcdoc).not.toContain('EUR')
    // Price chip icon must stay currency-neutral — not the euro-shaped glyph.
    expect(iframe!.srcdoc).not.toContain('M14 5c-3.87 0-7 3.13-7 7s3.13 7 7 7c2.17 0 4.1-.99 5.4-2.55')
  })

  it('FE-COMP-TRIPPDF-016c: a place with its own currency overrides the trip currency for its price chip', async () => {
    const mixedArgs = {
      ...richArgs,
      trip: { ...richArgs.trip, currency: 'EUR' },
      assignments: {
        '10': [{
          ...assignmentForDay,
          place: { ...placeWithDetails, currency: 'JPY', price: '1500' },
        }],
      } as any,
    }
    await downloadTripPDF(mixedArgs)
    const iframe = getIframe()
    // JPY is a zero-decimal currency (currencyDecimals) and uses its own symbol, not EUR.
    // Note: Intl renders JPY with the fullwidth yen sign (U+FFE5 "￥"), not U+00A5 "¥".
    expect(iframe!.srcdoc).toContain('￥1,500')
  })

  it('FE-COMP-TRIPPDF-016d: converts foreign-currency prices into the trip currency for day and cover totals (#1561)', async () => {
    server.use(http.get('https://api.frankfurter.dev/v2/rates', ({ request }) => {
      expect(new URL(request.url).searchParams.get('base')).toBe('NOK')
      return HttpResponse.json([{ quote: 'USD', rate: 0.1 }]) // 1 NOK = 0.1 USD
    }))
    const mixedArgs = {
      ...richArgs,
      trip: { ...richArgs.trip, currency: 'NOK' },
      assignments: {
        '10': [
          { ...assignmentForDay, place: { ...placeWithDetails, currency: 'USD', price: '273' } },
          { ...assignmentForDay, id: 201, place: { ...placeWithDetails, id: 101, name: 'Museum', currency: null, price: '2500' } },
        ],
      } as any,
    }
    await downloadTripPDF(mixedArgs)
    const srcdoc = getIframe()!.srcdoc.replace(/[\u00A0\u202F]/g, ' ')
    // 2500 NOK + 273 USD / 0.1 = 5230 NOK, marked approximate, in day header AND cover stat.
    expect(srcdoc).toContain('≈ 5 230,00 kr')
    expect((srcdoc.match(/≈ 5 230,00 kr/g) || []).length).toBeGreaterThanOrEqual(2)
  })

  it('FE-COMP-TRIPPDF-016e: falls back to per-currency breakdowns when the FX fetch fails (#1561)', async () => {
    server.use(http.get('https://api.frankfurter.dev/v2/rates', () => HttpResponse.error()))
    const mixedArgs = {
      ...richArgs,
      trip: { ...richArgs.trip, currency: 'NOK' },
      assignments: {
        '10': [
          { ...assignmentForDay, place: { ...placeWithDetails, currency: 'USD', price: '2730.27' } },
          { ...assignmentForDay, id: 201, place: { ...placeWithDetails, id: 101, name: 'Museum', currency: null, price: '2500' } },
        ],
      } as any,
    }
    // Export still resolves — a dead FX endpoint must never break the PDF.
    await expect(downloadTripPDF(mixedArgs)).resolves.not.toThrow()
    const srcdoc = getIframe()!.srcdoc.replace(/[\u00A0\u202F]/g, ' ')
    // Honest breakdown, base currency first; the USD amount is never NOK-labeled.
    expect(srcdoc).toContain('2 500,00 kr + $2,730.27')
    expect(srcdoc).not.toContain('≈')
    expect(srcdoc).not.toMatch(/5 ?230/)
  })

  it('FE-COMP-TRIPPDF-016f: an all-same-currency trip makes no FX request', async () => {
    let fxCalled = false
    server.use(http.get('https://api.frankfurter.dev/v2/rates', () => {
      fxCalled = true
      return HttpResponse.json([])
    }))
    await downloadTripPDF({ ...richArgs, trip: { ...richArgs.trip, currency: 'EUR' } })
    expect(fxCalled).toBe(false)
    // Totals render exactly as before for the single-currency case.
    const srcdoc = getIframe()!.srcdoc.replace(/[\u00A0\u202F]/g, ' ')
    expect(srcdoc).toContain('15,00 €')
    expect(srcdoc).not.toContain('≈')
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

// FE-W5PDF-001 to FE-W5PDF-030 — multi-day transport spans, the remaining
// reservation subtitles, accommodation phases and cover fallbacks.
describe('downloadTripPDF remaining branches', () => {
  const dA = { id: 10, day_number: 1, title: 'Day A', date: '2025-06-01' } as any
  const dB = { id: 11, day_number: 2, title: null, date: null } as any
  const dC = { id: 12, day_number: 3, title: 'Day C', date: '2025-06-03' } as any

  const spanArgs = (reservations: any[], overrides: Record<string, unknown> = {}) => ({
    ...minimalArgs,
    trip: { id: 10, title: 'Span Trip', description: null, cover_image: null } as any,
    days: [dA, dB, dC],
    reservations,
    ...overrides,
  })

  const srcdoc = () => getIframe()!.srcdoc

  it('FE-W5PDF-001: a multi-day cruise is labelled start / ongoing / end with the right times', async () => {
    await downloadTripPDF(spanArgs([{
      id: 500, title: 'Nordic Cruise', type: 'cruise', day_id: 10, end_day_id: 12,
      reservation_time: '2025-06-01T09:00', reservation_end_time: '2025-06-03T18:00',
    }]))
    const html = srcdoc()

    expect(html).toContain('reservations.span.start: Nordic Cruise')
    expect(html).toContain('reservations.span.ongoing: Nordic Cruise')
    expect(html).toContain('reservations.span.end: Nordic Cruise')
    expect(html).toContain('09:00')
    expect(html).toContain('18:00')
  })

  it('FE-W5PDF-002: a multi-day flight uses departure/arrival wording', async () => {
    await downloadTripPDF(spanArgs([{
      id: 501, title: 'Red Eye', type: 'flight', day_id: 10, end_day_id: 11,
      reservation_time: '2025-06-01T23:00', reservation_end_time: '2025-06-02T06:00',
      metadata: JSON.stringify({}),
    }]))
    const html = srcdoc()

    expect(html).toContain('reservations.span.departure: Red Eye')
    expect(html).toContain('reservations.span.arrival: Red Eye')
  })

  it('FE-W5PDF-003: a multi-day car hire is labelled pickup/return and skips the middle day', async () => {
    await downloadTripPDF(spanArgs([{
      id: 502, title: 'Rental', type: 'car', day_id: 10, end_day_id: 12,
      reservation_time: '2025-06-01T10:00', reservation_end_time: '2025-06-03T10:00',
    }]))
    const html = srcdoc()

    expect(html).toContain('reservations.span.pickup: Rental')
    expect(html).toContain('reservations.span.return: Rental')
    expect(html).not.toContain('reservations.span.active')
  })

  it('FE-W5PDF-029: a multi-day parking is labelled drop-off/pickup and skips the middle day (#1937)', async () => {
    await downloadTripPDF(spanArgs([{
      id: 506, title: 'Airport Parking', type: 'parking', day_id: 10, end_day_id: 12,
      reservation_time: '2025-06-01T05:30', reservation_end_time: '2025-06-03T19:00',
    }]))
    const html = srcdoc()

    expect(html).toContain('reservations.span.dropOff: Airport Parking')
    expect(html).toContain('reservations.span.pickup: Airport Parking')
    expect(html).not.toContain('reservations.span.ongoing')
    // Day B holds nothing else, so it prints the empty-day hint rather than the booking.
    expect(html).toContain('dayplan.emptyDay')
  })

  it('FE-W5PDF-004: hotels, day-less and unknown-day reservations are all skipped', async () => {
    await downloadTripPDF(spanArgs([
      { id: 503, title: 'Hotel Row', type: 'hotel', day_id: 10 },
      { id: 504, title: 'Floating', type: 'event', day_id: null },
      { id: 505, title: 'Ghost Span', type: 'train', day_id: 900, end_day_id: 901 },
    ]))
    const html = srcdoc()

    expect(html).not.toContain('Hotel Row')
    expect(html).not.toContain('Floating')
    expect(html).not.toContain('Ghost Span')
    expect(html).toContain('dayplan.emptyDay')
  })

  it('FE-W5PDF-005: a single-leg train renders its number, platform, seat and route', async () => {
    await downloadTripPDF(spanArgs([{
      id: 506, title: 'ICE 599', type: 'train', day_id: 10,
      reservation_time: '10:15',
      endpoints: [{ sequence: 1, code: 'BER' }, { sequence: 0, code: 'FRA' }],
      metadata: { train_number: 'ICE 599', platform: '7', seat: '21A' },
    }]))
    const html = srcdoc()

    expect(html).toContain('ICE 599 · Gl. 7 · Seat 21A · FRA → BER')
  })

  it('FE-W5PDF-006: a multi-leg train renders one line per leg', async () => {
    await downloadTripPDF(spanArgs([{
      id: 507, title: 'Alpine Run', type: 'train', day_id: 10,
      metadata: JSON.stringify({
        legs: [
          { train_number: 'IC 1', platform: '3', from: 'BER', to: 'MUC' },
          { train_number: 'EC 2', from: 'MUC', to: 'ZRH' },
        ],
      }),
    }]))
    const html = srcdoc()

    expect(html).toContain('IC 1 · Gl. 3 · BER → MUC')
    expect(html).toContain('EC 2 · MUC → ZRH')
  })

  it('FE-W5PDF-007: restaurant, event, tour and unknown types get their own subtitles', async () => {
    await downloadTripPDF(spanArgs([
      { id: 508, title: 'Dinner', type: 'restaurant', day_id: 10, metadata: { party_size: 4 } },
      { id: 509, title: 'Concert', type: 'event', day_id: 10, metadata: { venue: 'Arena' } },
      { id: 510, title: 'Walk', type: 'tour', day_id: 10, metadata: { operator: 'GuideCo' } },
      { id: 511, title: 'Mystery', type: 'submarine', day_id: 10, metadata: null, location: 'Docks' },
    ]))
    const html = srcdoc()

    expect(html).toContain('4 guests')
    expect(html).toContain('Arena')
    expect(html).toContain('GuideCo')
    expect(html).toContain('Mystery')
    expect(html).toContain('Docks')
  })

  it('FE-W5PDF-008: reservation positions come from day_positions, then the plan position, then the end', async () => {
    await downloadTripPDF(spanArgs([
      { id: 512, title: 'By Numeric Key', type: 'event', day_id: 10, day_positions: { 10: -5 } },
      { id: 513, title: 'By String Key', type: 'event', day_id: 10, day_positions: { '10': -4 } },
      { id: 514, title: 'By Plan Position', type: 'event', day_id: 10, day_plan_position: -3 },
      { id: 515, title: 'By Fallback', type: 'event', day_id: 10 },
    ]))
    const html = srcdoc()

    expect(html.indexOf('By Numeric Key')).toBeLessThan(html.indexOf('By String Key'))
    expect(html.indexOf('By String Key')).toBeLessThan(html.indexOf('By Plan Position'))
    expect(html.indexOf('By Plan Position')).toBeLessThan(html.indexOf('By Fallback'))
  })

  it('FE-W5PDF-009: a flight leg without a route still lists airline and number', async () => {
    await downloadTripPDF(spanArgs([{
      id: 516, title: 'Charter', type: 'flight', day_id: 10,
      metadata: JSON.stringify({
        legs: [
          { airline: 'AirX', flight_number: 'X1' },
          { airline: 'AirX', flight_number: 'X2', from: 'AAA', to: 'BBB' },
        ],
      }),
    }]))
    const html = srcdoc()

    expect(html).toContain('AirX · X1')
    expect(html).toContain('AirX · X2 · AAA → BBB')
  })

  it('FE-W5PDF-030: a stopover flight prints the booking code of each segment that has one (#1943)', async () => {
    await downloadTripPDF(spanArgs([{
      id: 518, title: 'Layover', type: 'flight', day_id: 10, confirmation_number: 'BOOK1',
      metadata: JSON.stringify({
        legs: [
          { airline: 'LH', flight_number: 'LH1', from: 'FRA', to: 'BER', confirmation_number: 'ABC123' },
          { airline: 'ANA', flight_number: 'NH2', from: 'BER', to: 'HND' },
        ],
      }),
    }]))
    const html = srcdoc()

    expect(html).toContain('LH · LH1 · FRA → BER · ABC123')
    // A segment without one keeps the line it had before, and the booking's own
    // reference still prints once for the whole card.
    expect(html).toContain('ANA · NH2 · BER → HND')
    expect(html).toContain('Code: BOOK1')
  })

  it('FE-W5PDF-010: a single-leg flight with waypoints joins the whole route', async () => {
    await downloadTripPDF(spanArgs([{
      id: 517, title: 'Long Haul', type: 'flight', day_id: 10,
      endpoints: [{ sequence: 0, code: 'FRA' }, { sequence: 1, name: 'Berlin' }, { sequence: 2, code: 'HND' }],
      metadata: { airline: 'LH', flight_number: 'LH7' },
    }]))

    expect(srcdoc()).toContain('LH · LH7 · FRA → Berlin → HND')
  })

  it('FE-W5PDF-011: an assignment without a place contributes nothing', async () => {
    await downloadTripPDF(spanArgs([], {
      assignments: { '10': [{ id: 1, day_id: 10, order_index: 0, place: null }] } as any,
    }))

    expect(srcdoc()).toContain('class="day-body"')
    expect(srcdoc()).not.toContain('class="place-card"')
  })

  it('FE-W5PDF-012: a bare place renders without badge, address, coordinates or chips', async () => {
    await downloadTripPDF(spanArgs([], {
      assignments: {
        '10': [{ id: 1, day_id: 10, order_index: 0, place: { id: 70, name: 'Bare Place', price: '0' } }],
      } as any,
    }))
    const html = srcdoc()

    expect(html).toContain('Bare Place')
    expect(html).not.toContain('class="cat-badge"')
    expect(html).not.toContain('<div class="chips">')
    expect(html).toContain('class="place-thumb-fallback"')
  })

  it('FE-W5PDF-013: coordinates are printed for a place that has no address', async () => {
    await downloadTripPDF(spanArgs([], {
      assignments: {
        '10': [{ id: 1, day_id: 10, order_index: 0, place: { id: 71, name: 'Pin Only', lat: 48.858093, lng: 2.294694 } }],
      } as any,
    }))

    expect(srcdoc()).toContain('48.85809, 2.29469')
  })

  it('FE-W5PDF-014: a note without a time renders only its text and falls back to the default icon', async () => {
    await downloadTripPDF(spanArgs([], {
      dayNotes: [{ id: 1, day_id: 10, text: 'Just a note', time: null, icon: 'NotAnIcon', sort_order: 0 }] as any,
    }))
    const html = srcdoc()

    expect(html).toContain('Just a note')
    expect(html).not.toContain('class="note-time"')
  })

  it('FE-W5PDF-015: check-in, middle and check-out days each get their own accommodation block', async () => {
    server.use(
      http.get('/api/trips/:id/accommodations', () =>
        HttpResponse.json({
          accommodations: [{
            id: 1, start_day_id: 10, end_day_id: 12, place_name: 'Hotel Nord', place_address: 'Main St',
            check_in: '15:00', check_out: '10:00', confirmation: 'CONF-9', notes: 'Late arrival',
          }],
        }),
      ),
    )
    await downloadTripPDF(spanArgs([]))
    const html = srcdoc()

    expect(html).toContain('reservations.meta.checkIn')
    expect(html).toContain('reservations.meta.linkAccommodation')
    expect(html).toContain('reservations.meta.checkOut')
    expect(html).toContain('Hotel Nord')
    expect(html).toContain('Main St')
    expect(html).toContain('Late arrival')
    expect(html).toContain('CONF-9')
    expect(html).toContain('class="day-accommodations single"')
  })

  it('FE-W5PDF-016: two accommodations on one day are ordered by their start day', async () => {
    server.use(
      http.get('/api/trips/:id/accommodations', () =>
        HttpResponse.json({
          accommodations: [
            { id: 2, start_day_id: 11, end_day_id: 12, place_name: 'Later Inn', place_address: null, check_in: null, check_out: null, confirmation: null },
            { id: 1, start_day_id: 10, end_day_id: 12, place_name: 'Earlier Inn', place_address: null, check_in: null, check_out: null, confirmation: null },
          ],
        }),
      ),
    )
    await downloadTripPDF(spanArgs([]))
    const html = srcdoc()

    expect(html.indexOf('Earlier Inn')).toBeLessThan(html.indexOf('Later Inn'))
    // the shared days list two hotels, so they lose the single-column class
    expect(html).toContain('class="day-accommodations "')
  })

  it('FE-W5PDF-017: a trip without dated days prints no date range and no day dates', async () => {
    await downloadTripPDF({
      ...minimalArgs,
      trip: { id: 1, title: 'Undated', description: null, cover_image: null } as any,
      days: [{ id: 1, day_number: 1, title: null, date: null }] as any[],
    })
    const html = srcdoc()

    expect(html).not.toContain('class="cover-dates"')
    expect(html).not.toContain('class="day-date"')
    expect(html).toContain('class="cover-circle-ph"')
  })

  it('FE-W5PDF-018: the print button asks the preview frame to print', async () => {
    await downloadTripPDF(minimalArgs)
    const iframe = getIframe()!
    const print = vi.fn()
    Object.defineProperty(iframe, 'contentWindow', { value: { print }, configurable: true })

    document.getElementById('pdf-print-btn')!.click()

    expect(print).toHaveBeenCalled()
  })

  it('FE-W5PDF-019: an external cover image is used verbatim, a non-image one is dropped', async () => {
    await downloadTripPDF({
      ...minimalArgs,
      trip: { id: 1, title: 'Cover Trip', description: null, cover_image: 'https://cdn.example.com/a.jpg' } as any,
    })
    expect(srcdoc()).toContain('https://cdn.example.com/a.jpg')

    getOverlay()?.remove()
    await downloadTripPDF({
      ...minimalArgs,
      trip: { id: 1, title: 'Cover Trip', description: null, cover_image: '/uploads/cover.svg' } as any,
    })
    expect(srcdoc()).not.toContain('/uploads/cover.svg')
    expect(srcdoc()).toContain('class="cover-circle-ph"')
  })

  it('FE-W5PDF-020: plugin sections render their paragraphs and tables', async () => {
    server.use(
      http.get('/api/pdf-sections/:tripId', () =>
        HttpResponse.json({
          sections: [
            { title: 'Packing', paragraphs: ['Bring a towel'], table: { headers: ['Item', 'Qty'], rows: [['Socks', '3']] } },
            { title: 'Bare', paragraphs: null, table: null },
          ],
        }),
      ),
    )
    await downloadTripPDF(minimalArgs)
    const html = srcdoc()

    expect(html).toContain('Packing')
    expect(html).toContain('Bring a towel')
    expect(html).toContain('<th>Item</th>')
    expect(html).toContain('<td>Socks</td>')
    expect(html).toContain('Bare')
  })
})

// FE-W5PDF-021 to FE-W5PDF-026 — the defaulting arms of the exporter.
describe('downloadTripPDF defaults', () => {
  type Args = Parameters<typeof downloadTripPDF>[0]
  const srcdoc = () => getIframe()!.srcdoc

  it('FE-W5PDF-021: a call without days, places, notes or a translator still produces a document', async () => {
    await downloadTripPDF({ trip: { id: 1 }, assignments: {}, locale: 'en-US' } as unknown as Args)
    const html = srcdoc()

    // no translator, no days, no places, no notes
    expect(html).toContain('pdf.travelPlan')
    expect(html).toContain('<div class="cover-title">My Trip</div>')
    expect(html).toContain('<div class="cover-stat-num">0</div>')
  })

  it('FE-W5PDF-022: an accommodations response without the key degrades to no hotels', async () => {
    server.use(
      http.get('/api/trips/:id/accommodations', () => HttpResponse.json({})),
      http.get('/api/pdf-sections/:tripId', () => HttpResponse.json({})),
    )
    await downloadTripPDF({ ...minimalArgs } as unknown as Args)

    expect(srcdoc()).not.toContain('day-accommodations-overview"')
    expect(srcdoc()).not.toContain('class="plugin-sections')
  })

  it('FE-W5PDF-023: items without an explicit order fall back to position zero', async () => {
    await downloadTripPDF({
      ...minimalArgs,
      days: [{ id: 1, day_number: 1, title: 'Only Day', date: '2025-06-01' }] as any[],
      assignments: { '1': [{ id: 1, day_id: 1, order_index: null, place: { id: 5, name: 'Unordered Place' } }] } as any,
      dayNotes: [{ id: 2, day_id: 1, text: 'Unordered Note', sort_order: null, icon: 'Info' }] as any,
    })
    const html = srcdoc()

    expect(html).toContain('Unordered Place')
    expect(html).toContain('Unordered Note')
  })

  it('FE-W5PDF-024: an empty metadata string and a missing title are handled', async () => {
    await downloadTripPDF({
      ...minimalArgs,
      trip: { id: 1, title: null, description: null, cover_image: null } as any,
      days: [{ id: 1, day_number: 1, title: null, date: '2025-06-01' }] as any[],
      reservations: [{ id: 1, title: null, type: 'restaurant', day_id: 1, metadata: '' }] as any[],
    })
    const html = srcdoc()

    expect(html).toContain('<title>pdf.travelPlan</title>')
    expect(html).toContain('note-card')
    expect(html).toContain('Day 1')
  })

  it('FE-W5PDF-025: an extensionless relative image url is resolved against the origin', async () => {
    await downloadTripPDF({
      ...minimalArgs,
      days: [{ id: 1, day_number: 1, title: 'Only Day', date: '2025-06-01' }] as any[],
      assignments: {
        '1': [{ id: 1, day_id: 1, order_index: 0, place: { id: 5, name: 'Proxy Photo', image_url: 'uploads/places/photo.jpg' } }],
      } as any,
    })

    // no leading slash: absUrl has to insert one
    expect(srcdoc()).toContain('http://localhost:3000/uploads/places/photo.jpg')
  })

  it('FE-W5PDF-026: the last day of a span without an end time prints no time', async () => {
    await downloadTripPDF({
      ...minimalArgs,
      days: [
        { id: 1, day_number: 1, title: 'Start Day', date: '2025-06-01' },
        { id: 2, day_number: 2, title: 'End Day', date: '2025-06-02' },
      ] as any[],
      reservations: [{ id: 1, title: 'Overnight Bus', type: 'bus', day_id: 1, end_day_id: 2, reservation_time: '22:00', reservation_end_time: null }] as any[],
    })
    const html = srcdoc()
    const endSection = html.slice(html.indexOf('End Day'))

    expect(html).toContain('reservations.span.start: Overnight Bus')
    expect(endSection).toContain('reservations.span.end: Overnight Bus')
    expect(endSection).not.toContain('22:00')
  })

  it('FE-W5PDF-027: an export without a locale still renders, with lang="en"', async () => {
    await downloadTripPDF({ ...minimalArgs, locale: '' })

    expect(srcdoc()).toContain('<html lang="en">')
  })

  it('FE-W5PDF-028: an export without assignments renders the days as empty', async () => {
    await downloadTripPDF({ ...minimalArgs, assignments: undefined as any })

    expect(srcdoc()).toContain('Day 1')
  })
})

// #1292 — every day started a new page, so a plan of short days printed one
// sheet per handful of lines. The flowing layout is opt-in and remembered.
describe('page breaks between days (#1292)', () => {
  const twoDays = {
    ...minimalArgs,
    days: [
      { id: 1, day_number: 1, title: 'First', date: '2025-06-01' },
      { id: 2, day_number: 2, title: 'Second', date: '2025-06-02' },
    ] as any[],
  }

  beforeEach(() => {
    localStorage.removeItem('trek_pdf_page_break_per_day')
  })

  const toggle = () =>
    document.querySelector<HTMLButtonElement>('#pdf-daybreak-toggle')
  const isOn = () => toggle()!.getAttribute('aria-checked') === 'true'

  it('FE-PDF-BREAK-001: days break onto their own page by default', async () => {
    await downloadTripPDF(twoDays)
    const html = getIframe()!.srcdoc

    expect(html).toContain('day-section day-break')
    expect(html).not.toContain('class="pdf-flow"')
    expect(isOn()).toBe(true)
  })

  it('FE-PDF-BREAK-001b: the control is the switch from the rest of the app, not a checkbox', async () => {
    await downloadTripPDF(twoDays)
    const el = toggle()!

    expect(el.tagName).toBe('BUTTON')
    expect(el.getAttribute('role')).toBe('switch')
    expect(el.style.background).toContain('--accent')
    expect(document.querySelector('#pdf-daybreak-toggle input')).toBeNull()
  })

  it('FE-PDF-BREAK-002: the remembered flowing layout comes back on the next export', async () => {
    localStorage.setItem('trek_pdf_page_break_per_day', '0')
    await downloadTripPDF(twoDays)
    const html = getIframe()!.srcdoc

    // The class stays on the day; the body is what decides whether it breaks.
    expect(html).toContain('day-section day-break')
    expect(html).toContain('<body class="pdf-flow">')
    expect(isOn()).toBe(false)
    // Off uses the neutral track, so the two states are told apart by more than the knob.
    expect(toggle()!.style.background).toContain('--border-primary')
  })

  it('FE-PDF-BREAK-003: the first day never carries a break of its own', async () => {
    await downloadTripPDF(twoDays)
    const html = getIframe()!.srcdoc

    expect(html.indexOf('<table class="day-section">')).toBeGreaterThan(-1)
    expect(html.match(/day-section day-break/g)).toHaveLength(1)
  })

  it('FE-PDF-BREAK-004: turning the breaks off is remembered and shown at once', async () => {
    await downloadTripPDF(twoDays)
    toggle()!.click()

    expect(isOn()).toBe(false)
    expect(localStorage.getItem('trek_pdf_page_break_per_day')).toBe('0')
    const body = getIframe()!.contentDocument?.body
    if (body) expect(body.classList.contains('pdf-flow')).toBe(true)
  })

  it('FE-PDF-BREAK-005: turning them back on is remembered too', async () => {
    localStorage.setItem('trek_pdf_page_break_per_day', '0')
    await downloadTripPDF(twoDays)
    toggle()!.click()

    expect(isOn()).toBe(true)
    expect(localStorage.getItem('trek_pdf_page_break_per_day')).toBe('1')
    const body = getIframe()!.contentDocument?.body
    if (body) expect(body.classList.contains('pdf-flow')).toBe(false)
  })

  it('FE-PDF-BREAK-006: a storage the browser blocks costs the preference, not the export', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })

    await downloadTripPDF(twoDays)
    const html = getIframe()!.srcdoc
    expect(html).toContain('day-section day-break')
    expect(html).not.toContain('class="pdf-flow"')

    expect(() => toggle()!.click()).not.toThrow()
  })

  // Verified against a real print engine: without this rule Chromium tore a stay
  // across the page edge, the check-in time on one sheet and the hotel name on
  // the next. Place and note cards already carried it.
  it('FE-PDF-BREAK-007: a stay may not be split by a page edge', async () => {
    await downloadTripPDF(twoDays)
    const html = getIframe()!.srcdoc
    const rule = html.slice(html.indexOf('.day-accommodation {'))
    expect(rule.slice(0, rule.indexOf('}'))).toContain('break-inside: avoid')
  })

  // Measured against Chromium: with the days flowing, a header bar could be left
  // at the foot of a sheet while its content moved on, and the repeat from #1471
  // then read as the same day printed twice. break-after on the thead and
  // break-before on the tbody are both ignored; holding the day together is what
  // works, and a day too long for one page still breaks and still repeats.
  it('FE-PDF-BREAK-008: a flowing day is held together so its header is never stranded', async () => {
    localStorage.setItem('trek_pdf_page_break_per_day', '0')
    await downloadTripPDF(twoDays)
    const html = getIframe()!.srcdoc

    expect(html).toContain('.pdf-flow .day-section { break-inside: avoid; page-break-inside: avoid; }')
    // Scoped: a day that starts its own page cannot strand a header.
    const at = html.indexOf('.day-section { break-inside: avoid')
    expect(html.slice(at - 10, at)).toContain('.pdf-flow ')
  })
})

/**
 * The order a day prints in (#1978).
 *
 * The export used to order a day by itself, on `day_plan_position` — one global
 * number per booking, auto-seeded from whichever day happened to render first.
 * On any other day of a span it therefore pointed at the wrong slot, and where
 * it was still null the export fell back to the order the API returned rows in.
 * That is why the same trip printed correctly some of the time and swapped two
 * bookings the rest of it, and why adding a place and removing it again "fixed"
 * it: the reseed happened to land on the day being looked at.
 *
 * It now goes through utils/dayMerge, the same functions the day plan uses, so
 * the two cannot disagree. These cases are written from the plan's rules rather
 * than from the old implementation's.
 */
describe('a printed day follows the plan (#1978)', () => {
  const d1 = { id: 21, day_number: 1, title: 'Day One', date: '2025-06-01' } as any
  const d2 = { id: 22, day_number: 2, title: 'Day Two', date: '2025-06-02' } as any
  const srcdoc = () => getIframe()!.srcdoc

  /** Where each needle first appears, so order can be asserted without parsing. */
  const positions = (html: string, needles: string[]) => needles.map(n => html.indexOf(n))

  it('orders the day by the clock, not by the order the API sent rows in', async () => {
    await downloadTripPDF({
      ...minimalArgs,
      trip: { id: 21, title: 'Order Trip', description: null, cover_image: null } as any,
      days: [d1],
      // As the API returns them: reservation_time ASC with nulls first.
      reservations: [
        { id: 1, title: 'Untimed Transfer', type: 'transfer', day_id: 21, reservation_time: null },
        { id: 2, title: 'Evening Train', type: 'train', day_id: 21, reservation_time: '2025-06-01T19:30' },
        { id: 3, title: 'Morning Flight', type: 'flight', day_id: 21, reservation_time: '2025-06-01T07:15' },
      ],
    })
    const [morning, evening] = positions(srcdoc(), ['Morning Flight', 'Evening Train'])
    expect(morning).toBeGreaterThan(-1)
    expect(evening).toBeGreaterThan(-1)
    expect(morning).toBeLessThan(evening)
  })

  /*
   * The reported shape: a booking on the last day of a span whose global
   * position was seeded from a busier earlier day, which sank it below
   * everything on the day it actually belongs to.
   */
  it('ignores a global position seeded from another day', async () => {
    await downloadTripPDF({
      ...minimalArgs,
      trip: { id: 22, title: 'Span Trip', description: null, cover_image: null } as any,
      days: [d1, d2],
      reservations: [
        {
          id: 4, title: 'Car Return', type: 'car', day_id: 21, end_day_id: 22,
          reservation_time: '2025-06-01T10:00', reservation_end_time: '2025-06-02T09:00',
          // Seeded from day one, where five places had already been placed.
          day_plan_position: 5,
        },
        { id: 5, title: 'Late Flight', type: 'flight', day_id: 22, reservation_time: '2025-06-02T18:00' },
      ],
    })
    const html = srcdoc()
    // On day two the 09:00 return comes before the 18:00 flight, whatever the
    // stale global position says.
    const [ret, flight] = positions(html, ['Car Return', 'Late Flight'])
    expect(ret).toBeGreaterThan(-1)
    expect(flight).toBeGreaterThan(-1)
    expect(ret).toBeLessThan(flight)
  })

  /*
   * The strongest form of the same claim: whatever the plan would show, the
   * print shows, in that order. Asserted against getMergedItems itself rather
   * than against a hand-written expectation, so the two cannot drift apart
   * again without this failing.
   */
  it('prints a mixed day in exactly the order the plan merges it', async () => {
    const reservations = [
      { id: 8, title: 'Untimed Transfer', type: 'transfer', day_id: 21, reservation_time: null },
      { id: 9, title: 'Evening Train', type: 'train', day_id: 21, reservation_time: '2025-06-01T19:30' },
      { id: 10, title: 'Morning Flight', type: 'flight', day_id: 21, reservation_time: '2025-06-01T07:15' },
    ]
    const dayAssignments = [
      { id: 100, day_id: 21, order_index: 0, place: { id: 1, name: 'Museum', place_time: '11:00' } },
      { id: 101, day_id: 21, order_index: 1, place: { id: 2, name: 'Market', place_time: '16:00' } },
    ]

    await downloadTripPDF({
      ...minimalArgs,
      trip: { id: 24, title: 'Mixed Trip', description: null, cover_image: null } as any,
      days: [d1],
      assignments: { '21': dayAssignments } as any,
      reservations,
    })
    const html = srcdoc()

    const expected = getMergedItems({
      dayAssignments,
      dayNotes: [],
      dayTransports: getTransportForDay({
        reservations, dayId: 21, dayAssignmentIds: dayAssignments.map(a => a.id), days: [d1],
      }),
      dayId: 21,
    }).map(item => (item.type === 'place' ? item.data.place.name : item.data.title))

    const seen = expected.map(name => html.indexOf(name))
    for (const at of seen) expect(at).toBeGreaterThan(-1)
    expect(seen).toEqual([...seen].sort((a, b) => a - b))
  })
})
