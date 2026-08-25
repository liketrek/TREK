// Trip PDF via browser print window
import { createElement } from 'react'
import { getCategoryIcon } from '../shared/categoryIcons'
import { FileText, Info, Clock, MapPin, Navigation, Train, Plane, Bus, Car, Ship, Sailboat, Bike, CarTaxiFront, Route, Coffee, Ticket, Star, Heart, Camera, Flag, Lightbulb, AlertTriangle, ShoppingBag, Bookmark, Hotel, LogIn, LogOut, KeyRound, BedDouble, Utensils, Users, ParkingSquare, LucideIcon } from 'lucide-react'
import { accommodationsApi, mapsApi, pluginsApi } from '../../api/client'
import type { Trip, Day, Place, Category, AssignmentsMap, DayNote } from '../../types'
import { isDayInAccommodationRange, getDayOrder } from '../../utils/dayOrder'
import { hidesOnMiddleDay, getTransportForDay, getMergedItems, getSpanPhase, getDisplayTimeForDay } from '../../utils/dayMerge'
import { safeHexColor } from '../../utils/safeColor'
import { renderIconMarkup } from '../../utils/iconMarkup'
import { formatMoney, formatMoneySum, splitReservationDateTime, type MoneyEntry } from '../../utils/formatters'
import { fetchExchangeRates } from '../../hooks/useExchangeRates'
import { getFlightLegs, getTrainLegs } from '../../utils/flightLegs'

/**
 * Every day starts a new page by default. On a trip of short days that prints
 * one sheet per handful of lines, so the preview offers the flowing layout the
 * in-app view already uses, and remembers which one was picked (#1292).
 */
const PAGE_BREAK_KEY = 'trek_pdf_page_break_per_day'

function pageBreakPerDay(): boolean {
  try {
    return localStorage.getItem(PAGE_BREAK_KEY) !== '0'
  } catch {
    return true
  }
}

function rememberPageBreakPerDay(on: boolean): void {
  try {
    localStorage.setItem(PAGE_BREAK_KEY, on ? '1' : '0')
  } catch {
    // A blocked localStorage costs the preference, not the export.
  }
}

/* The overlay is imperative DOM, so the switch from Settings/ToggleSwitch is
   rebuilt here rather than rendered — as static markup it would carry no
   behaviour. Same geometry and the same tokens, so it reads as the same control. */
const TOGGLE_TRACK = 'position:relative;width:44px;height:24px;min-width:44px;flex-shrink:0;border-radius:12px;border:none;padding:0;cursor:pointer;transition:background 0.2s;'
const TOGGLE_KNOB = 'position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:white;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);'
const trackColour = (on: boolean) => (on ? 'var(--accent, #111827)' : 'var(--border-primary, #d1d5db)')
const knobOffset = (on: boolean) => (on ? '22px' : '2px')

function renderLucideIcon(icon:LucideIcon, props = {}) {
  return renderIconMarkup(
    createElement(icon, props)
  );
}

const NOTE_ICON_MAP = { FileText, Info, Clock, MapPin, Navigation, Train, Plane, Bus, Car, Ship, Coffee, Ticket, Star, Heart, Camera, Flag, Lightbulb, AlertTriangle, ShoppingBag, Bookmark }
function noteIconSvg(iconId) {
  const Icon = NOTE_ICON_MAP[iconId] || FileText
  return renderLucideIcon(Icon, { size: 14, strokeWidth: 1.8, color: '#94a3b8' })
}

const RESERVATION_ICON_MAP = { flight: Plane, train: Train, bus: Bus, car: Car, taxi: CarTaxiFront, bicycle: Bike, cruise: Ship, ferry: Sailboat, transport_other: Route, restaurant: Utensils, event: Ticket, tour: Users, parking: ParkingSquare, other: FileText }
const RESERVATION_COLOR_MAP = { flight: '#3b82f6', train: '#06b6d4', bus: '#059669', car: '#6b7280', taxi: '#ca8a04', bicycle: '#84cc16', cruise: '#0ea5e9', ferry: '#0d9488', transport_other: '#6b7280', restaurant: '#ef4444', event: '#f59e0b', tour: '#10b981', parking: '#2563eb', other: '#6b7280' }
function reservationIconSvg(type) {
  const Icon = RESERVATION_ICON_MAP[type] || Ticket
  const color = RESERVATION_COLOR_MAP[type] || '#3b82f6'
  return renderLucideIcon(Icon, { size: 14, strokeWidth: 1.8, color })
}

const ACCOMMODATION_ICON_MAP = { accommodation: Hotel, checkin: LogIn, checkout: LogOut, location: MapPin, note: FileText, confirmation: KeyRound }
function accommodationIconSvg(type) {
  const Icon = ACCOMMODATION_ICON_MAP[type] || BedDouble
  return renderLucideIcon(Icon, { size: 14, strokeWidth: 1.8, color: '#03398f', className: 'accommodation-icon' })
}

// ── SVG inline icons (for chips) ─────────────────────────────────────────────
const svgPin   = `<svg width="11" height="11" viewBox="0 0 24 24" fill="#94a3b8" style="flex-shrink:0;margin-top:1px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>`
const svgClock = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`
const svgClock2= `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`
const svgCheck = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg>`
const svgMoney = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9 12h6" stroke-linecap="round"/></svg>`

function escHtml(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// The style attribute is decoded back into raw quotes before the CSS is parsed, so
// escHtml alone cannot stop a cover_image from closing the url() and appending its own
// declaration. Percent-encoding is transparent to the fetch.
function cssUrl(url) {
  return String(url).replace(/["'()\\\s]/g, c => '%' + c.codePointAt(0).toString(16).padStart(2, '0'))
}

function absUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  return window.location.origin + (url.startsWith('/') ? '' : '/') + url
}

function safeImg(url) {
  if (!url) return null
  if (url.startsWith('https://') || url.startsWith('http://')) return url
  // The in-app place-photo proxy always streams a JPEG but has no file extension
  // (it ends in …/bytes), so the extension check below would wrongly reject it —
  // which is why persisted place photos showed as category icons in the PDF.
  if (url.startsWith('/api/maps/place-photo/')) return absUrl(url)
  // gif is in the list because place-image-upload.ts accepts it; without it an
  // uploaded GIF hero silently fell back to the category icon in the PDF.
  return /\.(jpe?g|png|gif|webp|bmp|tiff?)(\?.*)?$/i.test(url) ? absUrl(url) : null
}

// Generate SVG string from Lucide icon name (for category thumbnails)
function categoryIconSvg(iconName, color = '#6366f1', size = 24) {
  const Icon = getCategoryIcon(iconName)
  return renderIconMarkup(
    createElement(Icon, { size, strokeWidth: 1.8, color: 'rgba(255,255,255,0.92)' })
  )
}

function shortDate(d, locale) {
  if (!d) return ''
  return new Date(d + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function longDateRange(days, locale) {
  const dd = [...days].filter(d => d.date).sort((a, b) => a.day_number - b.day_number)
  if (!dd.length) return null
  const f = new Date(dd[0].date + 'T00:00:00Z')
  const l = new Date(dd[dd.length - 1].date + 'T00:00:00Z')
  return `${f.toLocaleDateString(locale, { day: 'numeric', month: 'long', timeZone: 'UTC' })} – ${l.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`
}

// Day totals render in the trip's currency; foreign-currency place prices are
// converted via the pre-fetched rates, or listed per-currency when rates are
// unavailable (#1561).
function dayCost(assignments, dayId, locale, tripCurrency, rates) {
  const entries: MoneyEntry[] = (assignments[String(dayId)] || []).map(a => ({
    amount: Number.parseFloat(a.place?.price) || 0,
    currency: a.place?.currency || tripCurrency,
  }))
  return formatMoneySum(entries, tripCurrency, locale || 'en', rates)
}

// Pre-fetch place photos for all assigned places.
// Assignment places are a server-side projection that drops osm_id, so we recover
// the full place from the trip's places pool and key the photo off the same id the
// app UI uses (google_place_id || osm_id || coords) — otherwise OSM/coords-only
// places fell back to category icons in the PDF even though they show photos in-app.
async function fetchPlacePhotos(assignments: AssignmentsMap, places: Place[]) {
  const photoMap = {} // placeId → photoUrl
  // The assignment projection drops osm_id, so recover it from the full places pool.
  const osmById = new Map((places || []).map(p => [p.id, p.osm_id]))
  const allPlaces = Object.values(assignments).flatMap(a => a.map(x => x.place)).filter(Boolean)
  const unique = [...new Map(allPlaces.map(p => [p.id, p])).values()]

  const toFetch = unique
    .map(p => ({ p, osm_id: osmById.get(p.id) }))
    .filter(({ p, osm_id }) => !p.image_url && (p.google_place_id || osm_id || (p.lat != null && p.lng != null)))

  await Promise.allSettled(
    toFetch.map(async ({ p, osm_id }) => {
      // Same key the app UI uses: google_place_id || osm_id || coords.
      const photoId = p.google_place_id || osm_id || `coords:${p.lat}:${p.lng}`
      try {
        const data = await mapsApi.placePhoto(photoId, p.lat, p.lng, p.name)
        if (data.photoUrl) photoMap[p.id] = data.photoUrl
      } catch {}
    })
  )
  return photoMap
}

interface downloadTripPDFProps {
  trip: Trip
  days: Day[]
  places: Place[]
  assignments: AssignmentsMap
  categories: Category[]
  // Flattened across days: each note carries its own day_id (see downloadTripPDF callers).
  dayNotes: DayNote[]
  reservations?: any[]
  t: (key: string, params?: Record<string, string | number>) => string
  locale: string
}

// `assignments` is normalised here once — every read below (and fetchPlacePhotos)
// relies on it being an object.
export async function downloadTripPDF({ trip, days, places, assignments = {}, categories, dayNotes, reservations = [], t: _t, locale: _locale }: downloadTripPDFProps) {
  const breaksPerDay = pageBreakPerDay()
  const loc = _locale || undefined
  const tr = _t || (k => k)
  const sorted = [...(days || [])].sort((a, b) => a.day_number - b.day_number)
  const range = longDateRange(sorted, loc)
  const coverImg = safeImg(trip?.cover_image)
  //retrieve accommodations for the trip to display on the day sections and prefetch their photos if needed
  const accommodations = await accommodationsApi.list(trip.id);

  // Sections contributed by pdfSectionProvider plugins — server-normalized plain
  // text (counts + lengths capped), appended after the days. Fail-safe: an error
  // just means no extra sections, the core export is untouched.
  const pluginSections = await pluginsApi.pdfSections(trip.id).then(r => r.sections || []).catch(() => [])

  // Pre-fetch place photos (Google, OSM and coords-only places)
  const photoMap = await fetchPlacePhotos(assignments, places)

  const totalAssigned = new Set(
    Object.values(assignments).flatMap(a => a.map(x => x.place?.id)).filter(Boolean)
  ).size
  // The PDF is a trip-scoped, shareable document, so totals stay in the trip's
  // own currency. Rates are resolved ONCE before any HTML is built so the cover
  // stat and every day header agree; all-same-currency trips skip the FX fetch
  // entirely (offline export keeps working), and a failed fetch degrades to
  // per-currency breakdowns instead of mislabeled sums (#1561).
  const tripCur = (trip?.currency || 'EUR').toUpperCase()
  const allCostEntries: MoneyEntry[] = Object.values(assignments)
    .flatMap(a => a)
    .map(a => ({ amount: Number(a.place?.price) || 0, currency: a.place?.currency || tripCur }))
  const needsFx = allCostEntries.some(e => e.amount > 0 && e.currency.toUpperCase() !== tripCur)
  const fxRates = needsFx ? await fetchExchangeRates(tripCur) : null
  const totalCostLabel = formatMoneySum(allCostEntries, tripCur, loc || 'en', fxRates)

  /*
   * The span label is the only PDF-specific piece left here. Everything else
   * about how a day is ordered — which transports belong to it, what time each
   * one shows, where it sits among the places — comes from utils/dayMerge, the
   * same functions the day plan itself uses (#1978).
   *
   * There used to be a second implementation in this file. It ordered by
   * `day_plan_position`, which is one global number per booking, seeded from
   * whichever day happened to render first; on any other day of a span it
   * pointed at the wrong slot, and when it was still null the export fell back
   * to the order the API returned. That is why the PDF was right some of the
   * time and swapped two bookings the rest of it.
   */
  const pdfGetSpanLabel = (r: any, phase: string): string | null => {
    if (phase === 'single') return null
    if (r.type === 'flight') return tr(`reservations.span.${phase === 'start' ? 'departure' : phase === 'end' ? 'arrival' : 'inTransit'}`)
    if (r.type === 'car') return tr(`reservations.span.${phase === 'start' ? 'pickup' : phase === 'end' ? 'return' : 'active'}`)
    // Parking reuses span.pickup for its end day: you drop the car off and collect it
    // again later, so the rental car's wording carries over without a second key.
    if (r.type === 'parking') return tr(`reservations.span.${phase === 'start' ? 'dropOff' : phase === 'end' ? 'pickup' : 'ongoing'}`)
    return tr(`reservations.span.${phase === 'start' ? 'start' : phase === 'end' ? 'end' : 'ongoing'}`)
  }
  // Build day HTML
  const daysHtml = sorted.map((day, di) => {
    const assigned = (assignments[String(day.id)] || []).slice()
      .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
    const notes = (dayNotes || []).filter(n => n.day_id === day.id).slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const cost = dayCost(assignments, day.id, loc, tripCur, fxRates)

    // Assembled exactly the way DayPlanSidebar assembles it, so the page and the
    // print cannot disagree about what order a day is in.
    const dayTransports = getTransportForDay({
      reservations: reservations || [],
      dayId: day.id,
      dayAssignmentIds: assigned.map((a: any) => a.id),
      days: sorted,
    })

    // Hotels come out in the accommodations block, a rental car's middle days
    // appear only in the sidebar header, and a multi-day parking's middle days
    // nowhere at all.
    const merged = getMergedItems({
      dayAssignments: assigned,
      dayNotes: notes,
      dayTransports,
      dayId: day.id,
    }).filter(item => {
      if (item.type !== 'transport') return true
      const r: any = item.data
      if (r.type === 'car' && getSpanPhase(r, day.id) === 'middle') return false
      return !hidesOnMiddleDay(r, day.id)
    })

    let pi = 0
    const itemsHtml = merged.length === 0
      ? `<div class="empty-day">${escHtml(tr('dayplan.emptyDay'))}</div>`
      : merged.map(item => {
          if (item.type === 'transport') {
            const r = item.data
            const meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : (r.metadata || {})
            const icon = reservationIconSvg(r.type)
            const color = RESERVATION_COLOR_MAP[r.type] || '#3b82f6'
            let subtitle = ''
            // Flights render one subtitle line per leg (see below); everything else is a single line.
            let subtitleLines: string[] = []
            /*
             * A multi-leg booking arrives as one item per leg now, the way the
             * day plan shows it, because the shared merge expands legs so each
             * one can sit at its own time among the day's places. Previously
             * the export printed a single row with every leg as a subtitle
             * line, which put the second leg's departure next to the first
             * leg's clock.
             */
            if (r.__leg) {
              const l = r.__leg
              // The segment's own booking code, which the leg object does not
              // carry — read back from the booking by index. At the gate that is
              // the code the airline asks for (#1943), so losing it here would
              // have been a real regression for a stopover flight.
              const source = (r.type === 'train' ? getTrainLegs(r) : getFlightLegs(r))[l.index]
              subtitleLines = [[
                l.airline, l.flight_number, l.train_number,
                l.platform ? `Gl. ${l.platform}` : '',
                l.seat ? `Seat ${l.seat}` : '',
                (l.from || l.to) ? [l.from, l.to].filter(Boolean).join(' → ') : '',
                source?.confirmation_number,
              ].filter(Boolean).join(' · ')].filter(Boolean)
            }
            else if (r.type === 'flight') {
              const legs = getFlightLegs(r)
              if (legs.length > 1) {
                // Multi-leg: one line per leg so every flight number + segment route is
                // shown, with the segment's own booking code where it has one (#1943).
                // At the gate that is the number the airline asks for.
                subtitleLines = legs.map(l =>
                  [l.airline, l.flight_number,
                   (l.from || l.to) ? [l.from, l.to].filter(Boolean).join(' → ') : '',
                   l.confirmation_number]
                    .filter(Boolean).join(' · '))
                  .filter(Boolean)
              } else {
                // Single-leg: full route over all waypoints (FRA → BER → HND), falling back to the
                // flat metadata pair for legacy single-leg flights without endpoints.
                const stops = (r.endpoints || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)).map(e => e.code || e.name)
                const route = stops.length >= 2 ? stops.join(' → ') : (meta.departure_airport && meta.arrival_airport ? `${meta.departure_airport} → ${meta.arrival_airport}` : '')
                subtitle = [meta.airline, meta.flight_number, route].filter(Boolean).join(' · ')
              }
            }
            else if (r.type === 'train') {
              const legs = getTrainLegs(r)
              if (legs.length > 1) {
                // Multi-leg: one line per leg so every train number + segment route shows,
                // with the segment's own booking code where it has one (#1943).
                subtitleLines = legs.map(l =>
                  [l.train_number, l.platform ? `Gl. ${l.platform}` : '',
                   (l.from || l.to) ? [l.from, l.to].filter(Boolean).join(' → ') : '',
                   l.confirmation_number]
                    .filter(Boolean).join(' · '))
                  .filter(Boolean)
              } else {
                const stops = (r.endpoints || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)).map(e => e.code || e.name)
                const route = stops.length >= 2 ? stops.join(' → ') : ''
                subtitle = [meta.train_number, meta.platform ? `Gl. ${meta.platform}` : '', meta.seat ? `Seat ${meta.seat}` : '', route].filter(Boolean).join(' · ')
              }
            }
            else if (r.type === 'restaurant') subtitle = [meta.party_size ? `${meta.party_size} guests` : ''].filter(Boolean).join(' · ')
            else if (r.type === 'event') subtitle = [meta.venue].filter(Boolean).join(' · ')
            else if (r.type === 'tour') subtitle = [meta.operator].filter(Boolean).join(' · ')
            if (subtitleLines.length === 0 && subtitle) subtitleLines = [subtitle]
            const locationLine = r.location || meta.location || ''
            const phase = getSpanPhase(r, day.id)
            const spanLabel = pdfGetSpanLabel(r, phase)
            const displayTime = getDisplayTimeForDay(r, day.id)
            // Start and end, the way the day plan draws it (#1310). Without the
            // landing time a flight reads as an open-ended block and the reader
            // cannot tell how much of the day is left for anything else.
            //
            // Only on a transport that begins and ends on this day: across a
            // span the arrival belongs to the arrival day, which already shows
            // it as its own time, and repeating it here would put tomorrow's
            // clock next to today's departure.
            const startTime = splitReservationDateTime(displayTime).time ?? ''
            const endTime = phase === 'single' ? (splitReservationDateTime(r.reservation_end_time).time ?? '') : ''
            const time = [startTime, endTime].filter(Boolean).join(' – ')
            const titleHtml = `${spanLabel ? escHtml(spanLabel) + ': ' : ''}${escHtml(r.title)}`
            return `
              <div class="note-card" style="border-left: 3px solid ${color};">
                <div class="note-line" style="background: ${color};"></div>
                <span class="note-icon">${icon}</span>
                <div class="note-body">
                  <div class="note-text" style="font-weight: 600;">${titleHtml}${time ? ` <span style="color:#6b7280;font-weight:400;font-size:10px;">${time}</span>` : ''}</div>
                  ${subtitleLines.filter(Boolean).map(s => `<div class="note-time">${escHtml(s)}</div>`).join('')}
                  ${locationLine ? `<div class="note-time">${escHtml(locationLine)}</div>` : ''}
                  ${r.confirmation_number ? `<div class="note-time" style="font-size:9px;">Code: ${escHtml(r.confirmation_number)}</div>` : ''}
                </div>
              </div>`
          }

          if (item.type === 'note') {
            const note = item.data
            // A coloured note carries its colour into print the same way a
            // reservation does (#1629) — the rule and the spine, not a fill,
            // because a tint costs ink and reads as grey on a mono printer.
            const noteColor = note.color || ''
            return `
              <div class="note-card"${noteColor ? ` style="border-left: 3px solid ${noteColor};"` : ''}>
                <div class="note-line"${noteColor ? ` style="background: ${noteColor};"` : ''}></div>
                <span class="note-icon"${noteColor ? ` style="color: ${noteColor};"` : ''}>${noteIconSvg(note.icon)}</span>
                <div class="note-body">
                  <div class="note-text">${escHtml(note.text)}</div>
                  ${note.time ? `<div class="note-time">${escHtml(note.time)}</div>` : ''}
                </div>
              </div>`
          }

          pi++
          const place = item.data.place
          if (!place) return ''
          const cat = categories.find(c => c.id === place.category_id)
          const color = safeHexColor(cat?.color, '#6366f1')

          // Image: direct > google photo > fallback icon. Both go through safeImg
          // so the proxy path is resolved to an absolute URL the PDF can load.
          const directImg = safeImg(place.image_url)
          const googleImg = safeImg(photoMap[place.id])
          const img = directImg || googleImg

          const iconSvg = categoryIconSvg(cat?.icon, color, 24)
          const thumbHtml = img
            ? `<img class="place-thumb" src="${escHtml(img)}" />`
            : `<div class="place-thumb-fallback" style="background:${color}">
                 ${iconSvg}
               </div>`

          const chips = [
            place.place_time ? `<span class="chip">${svgClock}${escHtml(place.place_time)}</span>` : '',
            place.price && Number.parseFloat(place.price) > 0 ? `<span class="chip chip-green">${svgMoney}${formatMoney(Number(place.price), place.currency || trip.currency, loc)}</span>` : '',
          ].filter(Boolean).join('')

          return `
            <div class="place-card">
              <div class="place-bar" style="background:${color}"></div>
              ${thumbHtml}
              <div class="place-info">
                <div class="place-name-row">
                  <span class="place-num">${pi}</span>
                  <span class="place-name">${escHtml(place.name)}</span>
                  ${cat ? `<span class="cat-badge" style="background:${color}">${escHtml(cat.name)}</span>` : ''}
                </div>
                ${place.address ? `<div class="info-row">${svgPin}<span class="info-text">${escHtml(place.address)}</span></div>` : ''}
                ${(place.lat != null && place.lng != null) ? `<div class="info-row"><span class="info-spacer"></span><span class="info-text muted">${Number(place.lat).toFixed(5)}, ${Number(place.lng).toFixed(5)}</span></div>` : ''}
                ${place.description ? `<div class="info-row"><span class="info-spacer"></span><span class="info-text muted italic">${escHtml(place.description)}</span></div>` : ''}
                ${chips ? `<div class="chips">${chips}</div>` : ''}
                ${place.notes ? `<div class="info-row"><span class="info-spacer"></span><span class="info-text muted italic">${escHtml(place.notes)}</span></div>` : ''}
              </div>
            </div>`
      }).join('')

    const accommodationsForDay = (accommodations.accommodations || []).filter(a =>
      day ? isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days) : false
    ).sort((a, b) => {
      const startA = days.find(d => d.id === a.start_day_id)
      const startB = days.find(d => d.id === b.start_day_id)
      return (startA ? getDayOrder(startA, days) : 0) - (startB ? getDayOrder(startB, days) : 0)
    })

    const accommodationDetails = accommodationsForDay.map(item => {
      const isCheckIn = day.id === item.start_day_id
      const isCheckOut = day.id === item.end_day_id
      const actionLabel = isCheckIn ? tr('reservations.meta.checkIn')
        : isCheckOut ? tr('reservations.meta.checkOut')
        : tr('reservations.meta.linkAccommodation')
      const actionIcon = isCheckIn ? accommodationIconSvg('checkin')
        : isCheckOut ? accommodationIconSvg('checkout')
        : accommodationIconSvg('accommodation')
      const timeStr = isCheckIn ? (item.check_in || '')
        : isCheckOut ? (item.check_out || '')
        : ''

      return `
        <div class="day-accommodation">
          <div class="day-accommodation-title accommodation-center-icon">${actionIcon} ${escHtml(actionLabel)}</div>
          ${timeStr ? `<div class="accommodation-center-icon">${accommodationIconSvg('checkin')} <b>${escHtml(timeStr)}</b></div>` : ''}
          <div class="accommodation-center-icon">${accommodationIconSvg('accommodation')} ${escHtml(item.place_name)}</div>
          ${item.place_address ? `<div class="accommodation-center-icon">${accommodationIconSvg('location')} ${escHtml(item.place_address)}</div>` : ''}
          ${item.notes ? `<div class="accommodation-center-icon">${accommodationIconSvg('note')} ${escHtml(item.notes)}</div>` : ''}
          ${isCheckIn && item.confirmation ? `<div class="accommodation-center-icon">${accommodationIconSvg('confirmation')} ${escHtml(item.confirmation)}</div>` : ''}
        </div>`
    }).join('')

    const accommodationsHtml = accommodationsForDay.length > 0
      ? `<div class="day-accommodations-overview">
          <div class="day-accommodations ${accommodationsForDay.length === 1 ? 'single' : ''}">${accommodationDetails}</div>
        </div>`
      : ''

    // A real <table> so the browser repeats the <thead> day header at the top of
    // every page an overflowing day spills onto (#1471). CSS `table-header-group`
    // on a <div> is NOT repeated by Chromium's print engine — only real thead is.
    return `
      <table class="day-section${di > 0 ? ' day-break' : ''}">
        <thead class="day-header"><tr><td>
          <div class="day-header-bar">
            <span class="day-tag">${escHtml(tr('dayplan.dayN', { n: day.day_number })).toUpperCase()}</span>
            <span class="day-title">${escHtml(day.title || tr('dayplan.dayN', { n: day.day_number }))}</span>
            ${day.date ? `<span class="day-date">${shortDate(day.date, loc)}</span>` : ''}
            ${cost ? `<span class="day-cost">${cost}</span>` : ''}
          </div>
        </td></tr></thead>
        <tbody class="day-body-group"><tr><td>
          <div class="day-body">${accommodationsHtml}${itemsHtml}</div>
        </td></tr></tbody>
      </table>`
  }).join('')

  // Plugin sections after the days — every value is host-vetted plain text and
  // still escHtml'd here (same treatment as the core content above).
  const pluginSectionsHtml = pluginSections.length === 0 ? '' : `
    <div class="plugin-sections page-break">
      ${pluginSections.map(s => `
      <div class="plugin-section">
        <div class="plugin-section-title">${escHtml(s.title)}</div>
        ${(s.paragraphs || []).map(p => `<p class="plugin-section-text">${escHtml(p)}</p>`).join('')}
        ${s.table ? `
        <table class="plugin-section-table">
          <thead><tr>${s.table.headers.map(h => `<th>${escHtml(h)}</th>`).join('')}</tr></thead>
          <tbody>${s.table.rows.map(row => `<tr>${row.map(cell => `<td>${escHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>` : ''}
      </div>`).join('')}
    </div>`

  const html = `<!DOCTYPE html>
<html lang="${(loc || 'en').split('-')[0]}">
<head>
<meta charset="UTF-8">
<base href="${window.location.origin}/">
<title>${escHtml(trip?.title || tr('pdf.travelPlan'))}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Poppins', sans-serif; background: #fff; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  svg { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* Footer on every printed page */
  .pdf-footer {
    position: fixed;
    bottom: 20px;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    opacity: 0.3;
  }
  .pdf-footer span {
    font-size: 7px;
    color: #64748b;
    letter-spacing: 0.5px;
  }

  /* ── Cover ─────────────────────────────────────── */
  .cover {
    width: 100%; min-height: 100vh;
    background: #0f172a;
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 52px; position: relative; overflow: hidden;
  }
  .cover-bg {
    position: absolute; inset: 0;
    background-size: cover; background-position: center;
    opacity: 0.28;
  }
  .cover-dim { position: absolute; inset: 0; background: rgba(8,12,28,0.55); }
  .cover-brand {
    position: absolute; top: 36px; right: 52px;
    z-index: 2;
  }
  .cover-body { position: relative; z-index: 1; }
  .cover-circle {
    width: 100px; height: 100px; border-radius: 50%;
    overflow: hidden; border: 2.5px solid rgba(255,255,255,0.25);
    margin-bottom: 26px; flex-shrink: 0;
  }
  .cover-circle img { width: 100%; height: 100%; object-fit: cover; }
  .cover-circle-ph {
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(255,255,255,0.07);
    margin-bottom: 26px;
  }
  .cover-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 8px; }
  .cover-title { font-size: 42px; font-weight: 700; color: #fff; line-height: 1.1; margin-bottom: 8px; }
  .cover-desc  { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.6; margin-bottom: 18px; max-width: 420px; }
  .cover-dates { font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 30px; }
  .cover-line  { height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 24px; }
  .cover-stats { display: flex; gap: 36px; }
  .cover-stat-num { font-size: 28px; font-weight: 700; color: #fff; line-height: 1; }
  .cover-stat-lbl { font-size: 9px; font-weight: 500; color: rgba(255,255,255,0.4); letter-spacing: 1px; margin-top: 4px; text-transform: uppercase; }

  /* ── Day ───────────────────────────────────────── */
  /* .day-section is a real <table>; its <thead> day header repeats on overflow pages. */
  .page-break { page-break-before: always; }
  /* Days break by default; .pdf-flow on <body> is the toggle in the preview (#1292).
     Flowing days butt against each other without the page edge between them. */
  .day-break { page-break-before: always; }
  .pdf-flow .day-break { page-break-before: auto; }
  .pdf-flow .day-section + .day-section { margin-top: 18px; }
  /* Hold a flowing day together. Without this the header bar can be placed at the
     foot of a sheet while its content moves to the next one, which then repeats
     the header (#1471) and reads as the same day printed twice. A day too long
     for one page still breaks and still repeats its header — the engine only
     honours this where it can. Days that start a page of their own cannot strand
     a header, so it is scoped to the flowing layout.
     Measured, not assumed: break-after on the thead and break-before on the tbody
     are both ignored by Chromium here. */
  .pdf-flow .day-section { break-inside: avoid; page-break-inside: avoid; }
  .day-section { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .day-header-bar {
    background: #0f172a; padding: 11px 28px;
    display: flex; align-items: center; gap: 8px;
  }
  .day-tag { font-size: 8px; font-weight: 700; color: #fff; letter-spacing: 0.8px; background: rgba(255,255,255,0.12); border-radius: 4px; padding: 3px 8px; flex-shrink: 0; }
  .day-title { font-size: 13px; font-weight: 600; color: #fff; flex: 1; }
  .day-date  { font-size: 9px; color: rgba(255,255,255,0.45); }
  .day-cost  { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.65); }
  /* The gap under the header bar must sit inside the repeated <thead> cell: a block-start
     padding on .day-body is only painted on the box's first fragment, so overflow pages
     would render their first card flush against the bar (#1531). */
  .day-header > tr > td { padding-bottom: 12px; }
  .day-body  { padding: 0 28px 6px; }

  /* accommodation info */
  .day-accommodations-overview { font-size: 12px; }
  .day-accommodations { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; }
  .day-accommodations.single { justify-content: center; }
  .day-accommodation {
    flex: 1 1 45%; min-width: 200px; margin: 4px 0; padding: 10px;
    border: 2px solid #e2e8f0; border-radius: 12px;
    display: flex; flex-direction: column;
    /* Place and note cards have said this all along; without it a stay is torn
       in half by a page edge, its check-in time on one sheet and the hotel name
       on the next. Rare while every day started a page, common once they flow. */
    break-inside: avoid; page-break-inside: avoid;
  }
  .day-accommodation-title {
    font-size: 16px; font-weight: 600; text-align: center;
    margin-bottom: 4px; align-self: center;
  }
  .accommodation-center-icon { display: flex; align-items: center; gap: 4px; }


  /* ── Place card ────────────────────────────────── */
  .place-card {
    display: flex; align-items: stretch;
    border: 1px solid #e2e8f0; border-radius: 8px;
    margin-bottom: 8px; overflow: hidden;
    background: #fff; page-break-inside: avoid;
  }
  .place-bar { width: 4px; flex-shrink: 0; }
  .place-thumb {
    width: 52px; height: 52px; object-fit: cover;
    margin: 8px; border-radius: 6px; flex-shrink: 0;
  }
  .place-thumb-fallback {
    width: 52px; height: 52px; margin: 8px; border-radius: 8px;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  }
  .place-thumb-fallback svg { width: 24px; height: 24px; }
  .place-info { flex: 1; padding: 9px 10px 8px 0; min-width: 0; }

  .place-name-row { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; }
  .place-num {
    width: 16px; height: 16px; border-radius: 50%;
    background: #1e293b; color: #fff; font-size: 8px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .place-name { font-size: 11.5px; font-weight: 600; color: #1e293b; flex: 1; }
  .cat-badge { font-size: 7.5px; font-weight: 600; color: #fff; border-radius: 99px; padding: 2px 7px; flex-shrink: 0; white-space: nowrap; }

  .info-row { display: flex; align-items: flex-start; gap: 4px; margin-bottom: 2px; padding-left: 21px; }
  .info-row svg { flex-shrink: 0; margin-top: 1px; }
  .info-spacer { width: 13px; flex-shrink: 0; }
  .info-text { font-size: 9px; color: #64748b; line-height: 1.5; }
  .info-text.muted { color: #94a3b8; }
  .info-text.italic { font-style: italic; }

  .chips { display: flex; flex-wrap: wrap; gap: 4px; padding-left: 21px; margin-top: 4px; }
  .chip { display: inline-flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 600; background: #f1f5f9; color: #374151; border-radius: 99px; padding: 2px 7px; white-space: nowrap; }
  .chip svg { flex-shrink: 0; }
  .chip-green { background: #ecfdf5; color: #059669; }
  .chip-amber { background: #fffbeb; color: #d97706; }

  /* ── Note card ─────────────────────────────────── */
  .note-card {
    display: flex; align-items: center; gap: 8px;
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;
    padding: 8px 10px; margin-bottom: 7px; page-break-inside: avoid;
  }
  .note-line { width: 3px; border-radius: 99px; background: #94a3b8; align-self: stretch; flex-shrink: 0; }
  .note-icon { flex-shrink: 0; }
  .note-body { flex: 1; min-width: 0; }
  .note-text { font-size: 9.5px; color: #334155; line-height: 1.55; }
  .note-time { font-size: 8px; color: #94a3b8; margin-top: 2px; }

  .empty-day { font-size: 9.5px; color: #cbd5e1; font-style: italic; text-align: center; padding: 14px 0; }

  /* ── Plugin sections ───────────────────────────── */
  .plugin-sections { padding: 16px 28px 6px; }
  .plugin-section { margin-bottom: 16px; page-break-inside: avoid; }
  .plugin-section-title { font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  .plugin-section-text { font-size: 9.5px; color: #334155; line-height: 1.55; margin-bottom: 5px; }
  .plugin-section-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .plugin-section-table th { font-size: 8px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
  .plugin-section-table td { font-size: 9px; color: #334155; padding: 4px 8px; border-bottom: 1px solid #f1f5f9; }

  /* ── Print ─────────────────────────────────────── */
  @media print {
    body { margin: 0; }
    .cover { min-height: 100vh; page-break-after: always; }
    @page { margin: 0; }
  }
</style>
</head>
<body${breaksPerDay ? '' : ' class="pdf-flow"'}>

<!-- Footer on every page -->
<div class="pdf-footer">
  <span>made with</span>
  <img src="${absUrl('/logo-dark.svg')}" style="height:10px;opacity:0.6;" />
</div>

<!-- Cover -->
<div class="cover">
  ${coverImg ? `<div class="cover-bg" style="background-image:url('${escHtml(cssUrl(coverImg))}')"></div>` : ''}
  <div class="cover-dim"></div>
  <div class="cover-brand"><img src="${absUrl('/logo-light.svg')}" style="height:28px;opacity:0.5;" /></div>
  <div class="cover-body">
    ${coverImg
      ? `<div class="cover-circle"><img src="${escHtml(coverImg)}" /></div>`
      : `<div class="cover-circle-ph"></div>`}
    <div class="cover-label">${escHtml(tr('pdf.travelPlan'))}</div>
    <div class="cover-title">${escHtml(trip?.title || 'My Trip')}</div>
    ${trip?.description ? `<div class="cover-desc">${escHtml(trip.description)}</div>` : ''}
    ${range ? `<div class="cover-dates">${range}</div>` : ''}
    <div class="cover-line"></div>
    <div class="cover-stats">
      <div>
        <div class="cover-stat-num">${sorted.length}</div>
        <div class="cover-stat-lbl">${escHtml(tr('dashboard.days'))}</div>
      </div>
      <div>
        <div class="cover-stat-num">${places?.length || 0}</div>
        <div class="cover-stat-lbl">${escHtml(tr('dashboard.places'))}</div>
      </div>
      <div>
        <div class="cover-stat-num">${totalAssigned}</div>
        <div class="cover-stat-lbl">${escHtml(tr('pdf.planned'))}</div>
      </div>
      ${totalCostLabel ? `<div>
        <div class="cover-stat-num">${totalCostLabel}</div>
        <div class="cover-stat-lbl">${escHtml(tr('pdf.costLabel'))}</div>
      </div>` : ''}
    </div>
  </div>
</div>

<!-- Days -->
${daysHtml}
${pluginSectionsHtml}
</body></html>`

  // Open in modal with srcdoc iframe (no URL loading = no X-Frame-Options issue)
  const overlay = document.createElement('div')
  overlay.id = 'pdf-preview-overlay'
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:8px;'
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove() }

  const card = document.createElement('div')
  card.style.cssText = 'width:100%;max-width:1000px;height:95vh;background:var(--bg-card);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);'

  const header = document.createElement('div')
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--border-primary);flex-shrink:0;'
  header.innerHTML = `
    <span style="font-size:13px;font-weight:600;color:var(--text-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(trip?.title || tr('pdf.travelPlan'))}</span>
    <div style="display:flex;align-items:center;gap:8px">
      <label for="pdf-daybreak-toggle" style="font-size:12px;color:var(--text-muted);cursor:pointer;user-select:none">${escHtml(tr('pdf.pageBreakPerDay'))}</label>
      <button id="pdf-daybreak-toggle" type="button" role="switch" aria-checked="${breaksPerDay}" aria-label="${escHtml(tr('pdf.pageBreakPerDay'))}" style="${TOGGLE_TRACK} background:${trackColour(breaksPerDay)}">
        <span style="${TOGGLE_KNOB} left:${knobOffset(breaksPerDay)}"></span>
      </button>
      <button type="button" id="pdf-print-btn" style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;font-family:inherit">${tr('pdf.saveAsPdf')}</button>
      <button type="button" id="pdf-close-btn" style="background:none;border:none;cursor:pointer;color:var(--text-faint);display:flex;padding:4px;border-radius:6px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'flex:1;width:100%;border:none;'
  // No script runs inside the document (print is parent-initiated), so withhold
  // allow-scripts to keep the sandbox tight.
  iframe.sandbox = 'allow-same-origin allow-modals'
  iframe.srcdoc = html

  card.appendChild(header)
  card.appendChild(iframe)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  const closeBtn = header.querySelector<HTMLElement>('#pdf-close-btn')
  if (closeBtn) closeBtn.onclick = () => overlay.remove()
  const printBtn = header.querySelector<HTMLElement>('#pdf-print-btn')
  if (printBtn) printBtn.onclick = () => { iframe.contentWindow?.print() }

  // The two layouts differ by one class, so switching is instant in the preview
  // and there is no need to re-fetch photos or rebuild the document.
  const dayBreakSwitch = header.querySelector<HTMLButtonElement>('#pdf-daybreak-toggle')
  if (dayBreakSwitch) dayBreakSwitch.onclick = () => {
    const on = dayBreakSwitch.getAttribute('aria-checked') !== 'true'
    dayBreakSwitch.setAttribute('aria-checked', String(on))
    dayBreakSwitch.style.background = trackColour(on)
    const knob = dayBreakSwitch.firstElementChild as HTMLElement | null
    if (knob) knob.style.left = knobOffset(on)
    rememberPageBreakPerDay(on)
    iframe.contentDocument?.body.classList.toggle('pdf-flow', !on)
  }
}
