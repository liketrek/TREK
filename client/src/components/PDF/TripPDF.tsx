// Trip PDF via browser print window
import { mapsApi, pluginsApi } from '../../api/client'
import { accommodationRepo } from '../../repo/accommodationRepo'
import type { Trip, Day, Place, Category, AssignmentsMap, Assignment, DayNote, DistanceUnit, BudgetItem, Accommodation } from '../../types'
import { isDayInAccommodationRange, getDayOrder } from '../../utils/dayOrder'
import { hidesOnMiddleDay, getTransportForDay, getMergedItems, getSpanPhase, getDisplayTimeForDay } from '../../utils/dayMerge'
import { pdfSwitchOn } from '../../utils/pdfSwitch'
import { openPdfPreview, LARGE_TEXT_KEY, PAGE_BREAK_KEY, TRANSPORT_NOTES_KEY, PHOTOS_KEY, OVERVIEW_KEY, COORDINATES_KEY, DETAILS_KEY } from './pdfPreview'
import { formatMoneySum, formatClockTime, splitReservationDateTime, type MoneyEntry } from '../../utils/formatters'
import { useSettingsStore } from '../../store/settingsStore'
import { useTripStore } from '../../store/tripStore'
import { tripAddonEnabledNow } from '../../store/tripAddonsStore'
import { projectDayItinerary } from '../Map/dayTourProjection'
import { dayRouteColor } from '../Map/tripRouteGeometry'
import { planCosts } from '../Planner/planCosts'
import { routeDistanceLabel } from '../Map/tripRouteLabels'
import { drawTripRoute, type TripPdfRouteOptions } from './tripPdfRoute'
import { fetchExchangeRates } from '../../hooks/useExchangeRates'
import { onlyMyPlan, planAssignments } from './pdfScope'
import { createPdfMarkdown } from './pdfMarkdown'
import { STRIP_PX, shrinkPdfImages } from './pdfImages'
import { absUrl, escHtml, hexColour, longDateRange, safeImg, shortDate } from './tripPdfHtml'
import { bookingIcon, bookingTint, glyph } from './tripPdfIcons'
import { bookingItem, bookingLinesHtml, dayHeader, noteItem, photoStrip, placeItem, staysBlock, type PdfBooking, type PdfDayContext } from './tripPdfDay'
import { coverHtml, glanceHtml, ledgerHtml, type CoverStat, type GlanceRow, type LedgerRow } from './tripPdfOverview'
import { tripPdfCss } from './tripPdfStyles'

/** A day's colour when the route gave it none: the same palette entry the map would use. */
const dayColourOf = (day: Day): string => hexColour(dayRouteColor(day).line, '#17171c')

// A place card's picture: direct > google photo > none. Both go through safeImg so
// the proxy path is resolved to an absolute URL the PDF can load.
function placeImage(place: { id: number; image_url?: string | null }, photoMap: Record<number, string>): string | null {
  return safeImg(place.image_url) || safeImg(photoMap[place.id])
}

// Pre-fetch place photos for all assigned places.
// Assignment places are a server-side projection that drops osm_id, so we recover
// the full place from the trip's places pool and key the photo off the same id the
// app UI uses (google_place_id || osm_id || coords) — otherwise OSM/coords-only
// places fell back to category icons in the PDF even though they show photos in-app.
async function fetchPlacePhotos(assignments: AssignmentsMap, places: Place[]) {
  const photoMap: Record<number, string> = {}
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
  /**
   * '12h' | '24h'. The document is a plain HTML string assembled outside React,
   * so the setting cannot be read with a hook in here — it comes over the same
   * way `locale` does (#2066).
   */
  timeFormat?: string
  /** 'metric' | 'imperial'. Same reasoning as `timeFormat` — read as a prop, not a hook. */
  distanceUnit?: string
  /**
   * The road trip setting "Show in Days too" (`roadtrip_service_stops_in_days`), read as a
   * prop for the same reason. Off, the day plan keeps petrol stations and rest areas to
   * the road trip view, and so does the print.
   */
  showServiceStops?: boolean
  /** The trip's expenses, which the cost figures add up with Costs on (#2551). Read from the trip store when left out. */
  budgetItems?: BudgetItem[]
  /** Whether the Costs addon is on for this trip. Read from the trip's addons when left out. */
  costsEnabled?: boolean
  /** Whether the Tours addon is on for this trip. Read from the trip's addons when left out. */
  toursEnabled?: boolean
  /** Prints only this member's plan (#2168): the stops and bookings that name them, and the ones that name nobody. */
  onlyUserId?: number
  /** The planner's road trip vias and tour stages, and the routing progress and stop (#2876). */
  route?: TripPdfRouteOptions
  /** Aborted once nobody waits for the document any more (its dialog was closed): it then never opens. */
  signal?: AbortSignal
}

/** The stays a day touches, in the order their nights began. */
function staysForDay(day: Day, days: Day[], stays: Accommodation[]): Accommodation[] {
  return stays
    .filter(a => isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days))
    .sort((a, b) => {
      const startA = days.find(d => d.id === a.start_day_id)
      const startB = days.find(d => d.id === b.start_day_id)
      return (startA ? getDayOrder(startA, days) : 0) - (startB ? getDayOrder(startB, days) : 0)
    })
}

// `assignments` is normalised here once, to the plan's own list; every read below
// (and fetchPlacePhotos) relies on it being an object.
export async function downloadTripPDF({ trip, days, places, assignments: allStored = {}, categories, dayNotes, reservations: allReservations = [], t: _t, locale: _locale, timeFormat: _timeFormat, distanceUnit: _distanceUnit, showServiceStops = true, budgetItems, costsEnabled, toursEnabled: toursOn, onlyUserId, route, signal }: downloadTripPDFProps) {
  const { assignments: stored, reservations } = onlyUserId != null
    ? onlyMyPlan(allStored, allReservations, onlyUserId)
    : { assignments: allStored, reservations: allReservations }
  const assignments = planAssignments(stored, showServiceStops)
  const switches = {
    breaksPerDay: pdfSwitchOn(PAGE_BREAK_KEY),
    showTransportNotes: pdfSwitchOn(TRANSPORT_NOTES_KEY),
    largeText: pdfSwitchOn(LARGE_TEXT_KEY, false),
    photos: pdfSwitchOn(PHOTOS_KEY),
    overview: pdfSwitchOn(OVERVIEW_KEY),
    coordinates: pdfSwitchOn(COORDINATES_KEY),
    details: pdfSwitchOn(DETAILS_KEY),
  }
  // Set while the days render: the switch only shows when there is a note to hide.
  const flags = { transportNote: false }
  const loc = _locale || undefined
  const tr = _t || ((k: string) => k)
  const markdown = createPdfMarkdown()
  // The store read is the fallback, not the source: a caller that forgets the
  // prop still prints the reader's own format instead of silently reverting.
  const is12h = (_timeFormat || useSettingsStore.getState().settings.time_format || '24h') === '12h'
  const fmtTime = (v?: string | null) => formatClockTime(v, is12h)
  const sorted = [...(days || [])].sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0))
  const range = longDateRange(sorted, loc)
  const coverImg = safeImg(trip?.cover_image)
  //retrieve accommodations for the trip to display on the day sections and prefetch their photos if needed
  const accommodations = await accommodationRepo.list(trip.id);
  // The endpoint answers `{ accommodations: [...] }`, not a bare array. Unwrapped once
  // here so every reader below gets the list itself — passing the envelope on is what
  // cost the route map its hotel legs, and silently (#1736).
  const accommodationList: Accommodation[] = Array.isArray(accommodations?.accommodations) ? accommodations.accommodations : []

  // Sections contributed by pdfSectionProvider plugins — server-normalized plain
  // text (counts + lengths capped), appended after the days. Fail-safe: an error
  // just means no extra sections, the core export is untouched.
  const pluginSections = await pluginsApi.pdfSections(trip.id).then(r => r.sections || []).catch(() => [])

  const unit: DistanceUnit = (_distanceUnit || useSettingsStore.getState().settings.distance_unit) === 'imperial'
    ? 'imperial' : 'metric'
  const toursEnabled = toursOn ?? tripAddonEnabledNow(trip.id, 'tours')
  const hasInvalidTour = toursEnabled && Object.values(assignments).some(list =>
    projectDayItinerary(list || [], true, places).some(item => item.kind === 'tour' && !item.valid))
  const { route: tripRoute, mapSvg: tripMapSvg } = await drawTripRoute({
    days: sorted,
    assignments,
    storedAssignments: allStored,
    reservations,
    accommodations: accommodationList,
    optimizeFromAccommodation: useSettingsStore.getState().settings.optimize_from_accommodation,
    toursEnabled,
    places,
  }, { tripId: trip.id, unit, options: route })
  // Legs left straight, refused or skipped, make every figure below a floor; each says so.
  const unroutedLegs = tripRoute?.unroutedLegs ?? 0
  const totalDistanceLabel = tripRoute && tripRoute.totalDistance > 0
    ? routeDistanceLabel(tripRoute.totalDistance, unroutedLegs, unit, tr)
    : null
  const routedDays = new Map((tripRoute?.days || []).map(d => [d.dayNumber, d]))
  // Each day named and coloured exactly as the legend on the planner map, so the two
  // read as the same picture. Days that routed to nothing are already out of `days`.
  const tripMapHtml = tripMapSvg && tripRoute ? `
<div class="trip-map">
  <div class="trip-map-head">
    <span class="trip-map-title">${escHtml(tr('pdf.mapTitle'))}</span>
    ${totalDistanceLabel ? `<span class="trip-map-total">${escHtml(tr('pdf.distanceLabel'))}: ${escHtml(totalDistanceLabel)}</span>` : ''}
  </div>
  ${unroutedLegs ? `<div class="trip-map-note">${escHtml(tr('map.overview.unrouted', { count: unroutedLegs }))}</div>` : ''}
  ${tripMapSvg}
  <div class="trip-map-legend">
    ${tripRoute.days.filter(d => d.lines.length).map(d => `<span class="trip-map-leg">
      <span class="trip-map-dot" style="background:${hexColour(d.color.line, '#0a84ff')}"></span>
      <span class="trip-map-leg-name">${escHtml(d.title || tr('dayplan.dayN', { n: d.dayNumber }))}</span>
      <span class="trip-map-leg-dist">${escHtml(routeDistanceLabel(d.distance, d.unroutedLegs ?? 0, unit, tr))}</span>
    </span>`).join('')}
  </div>
  <div class="trip-map-credit">${escHtml(tr('pdf.mapCredit'))}</div>
</div>` : ''

  // Pre-fetch place photos (Google, OSM and coords-only places)
  const photoMap = await fetchPlacePhotos(assignments, places)
  const photoUrls = Object.values(assignments).flatMap(list => list.flatMap(a => {
    const url = a.place && placeImage(a.place, photoMap)
    return url ? [url] : []
  }))
  // Each card's picture at its printed size, so the saved PDF does not carry every
  // photo at full resolution (#1501); the strip that opens a day gets a larger copy of
  // its first three. A picture missing here prints from its URL.
  const thumbs = await shrinkPdfImages(photoUrls, signal).catch(() => new Map<string, string>())

  const totalAssigned = new Set(
    Object.values(assignments).flatMap(a => a.map(x => x.place?.id)).filter(Boolean)
  ).size
  // The PDF is a trip-scoped, shareable document, so totals stay in the trip's
  // own currency. Rates are resolved ONCE before any HTML is built so the cover
  // stat and every day header agree; all-same-currency trips skip the FX fetch
  // entirely (offline export keeps working), and a failed fetch degrades to
  // per-currency breakdowns instead of mislabeled sums (#1561).
  const tripCur = (trip?.currency || 'EUR').toUpperCase()
  // The same figures the plan shows (#2551): the expenses with Costs on, each once,
  // else each planned place's own price once. An expense linked to a place finds its
  // day through every stop, the booked night's included.
  const withCosts = costsEnabled ?? tripAddonEnabledNow(trip.id, 'budget')
  const costs = planCosts({
    days: sorted,
    assignments: withCosts ? stored : assignments,
    reservations,
    budgetItems: budgetItems ?? useTripStore.getState().budgetItems,
    costsEnabled: withCosts,
    tripCurrency: tripCur,
  })
  const allCostEntries: MoneyEntry[] = costs.total
  const needsFx = allCostEntries.some(e => e.amount !== 0 && e.currency.toUpperCase() !== tripCur)
  const fxRates = needsFx ? await fetchExchangeRates(tripCur) : null
  const totalCostLabel = formatMoneySum(allCostEntries, tripCur, loc || 'en', fxRates)
  // Day totals render in the trip's currency; foreign amounts are converted via the
  // pre-fetched rates, or listed per-currency when rates are unavailable (#1561).
  const dayCost = (dayId: number) => formatMoneySum(costs.byDay.get(dayId) || [], tripCur, loc || 'en', fxRates)

  const ctx: PdfDayContext = {
    tr,
    fmtTime,
    locale: loc,
    tripCurrency: tripCur,
    categories,
    placesById: new Map((places || []).map(p => [p.id, p])),
    photoOf: place => {
      const url = placeImage(place, photoMap)
      return url ? thumbs.get(url) ?? url : null
    },
    markdown: text => markdown.row(text),
  }

  /*
   * Everything about how a day is ordered — which transports belong to it, what time
   * each one shows, where it sits among the places — comes from utils/dayMerge, the
   * same functions the day plan itself uses (#1978), so the page and the print cannot
   * disagree about what order a day is in.
   */
  const planOf = (day: Day) => {
    // What the plan lists (planAssignments): the stop a booked night wrote sat at the
    // head of its day, so the hotel printed above a morning flight (#2434).
    const assigned: Assignment[] = (assignments[String(day.id)] || [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    const notes = (dayNotes || []).filter(n => n.day_id === day.id).slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const dayTransports = getTransportForDay({
      reservations: reservations || [],
      dayId: day.id,
      dayAssignmentIds: assigned.map(a => a.id),
      days: sorted,
    })
    // Hotels come out in the stays block, a rental car's middle days appear only in
    // the sidebar header, and a multi-day parking's middle days nowhere at all.
    const merged = getMergedItems({ dayAssignments: assigned, dayNotes: notes, dayTransports, dayId: day.id })
      .filter(item => {
        if (item.type !== 'transport') return true
        const r = item.data
        if (r.type === 'car' && getSpanPhase(r, day.id) === 'middle') return false
        return !hidesOnMiddleDay(r, day.id)
      })
    return { assigned, merged }
  }
  const plans = new Map(sorted.map(day => [day.id, planOf(day)]))

  // The first three photographed stops of each day, larger, for the strip that opens it.
  const stripPhotos = new Map(sorted.map(day => {
    const seen = new Set<string>()
    const photos = (plans.get(day.id)?.assigned || []).flatMap(a => {
      const url = a.place && placeImage(a.place, photoMap)
      if (!url || seen.has(url)) return []
      seen.add(url)
      return [{ url, caption: a.place.name }]
    })
    return [day.id, photos.slice(0, 3)]
  }))
  const stripCopies = await shrinkPdfImages([...stripPhotos.values()].flat().map(p => p.url), signal, STRIP_PX)
    .catch(() => new Map<string, string>())

  const daysHtml = sorted.map((day, di) => {
    const { assigned, merged } = plans.get(day.id) || { assigned: [], merged: [] }
    let number = 0
    const itemsHtml = merged.length === 0
      ? `<div class="empty-day">${escHtml(tr('dayplan.emptyDay'))}</div>`
      : `<ol class="timeline">${merged.map(item => {
          if (item.type === 'transport') return bookingItem(item.data as PdfBooking, day, ctx, flags)
          if (item.type === 'note') return noteItem(item.data as DayNote)
          const a = item.data as Assignment
          if (!a.place) return ''
          number++
          return placeItem(a, number, day, ctx)
        }).join('')}</ol>`
    const routed = routedDays.get(day.day_number ?? -1)
    const header = dayHeader(day, {
      stops: assigned.filter(a => a.place).length,
      distance: routed && routed.distance > 0 ? routeDistanceLabel(routed.distance, routed.unroutedLegs ?? 0, unit, tr) : null,
      cost: dayCost(day.id) || null,
    }, ctx)
    const strip = photoStrip((stripPhotos.get(day.id) || []).map(p => ({ ...p, url: stripCopies.get(p.url) ?? p.url })))
    const intro = day.notes && day.notes.trim() ? `<div class="day-intro">${escHtml(day.notes.trim())}</div>` : ''
    const stays = staysBlock(staysForDay(day, days, accommodationList), day, ctx)

    // A real <table> so the browser repeats the <thead> day header at the top of
    // every page an overflowing day spills onto (#1471). CSS `table-header-group`
    // on a <div> is NOT repeated by Chromium's print engine — only real thead is.
    return `
      <table class="day-section${di > 0 ? ' day-break' : ' day-first'}" style="--day:${dayColourOf(day)}">
        <thead class="day-header"><tr><td>${header}</td></tr></thead>
        <tbody class="day-body-group"><tr><td>
          <div class="day-body">${strip}${intro}${stays}${itemsHtml}</div>
        </td></tr></tbody>
      </table>`
  }).join('')

  // The overview's day rows and booking list, in day order.
  const dayNumberOf = new Map(sorted.map(d => [d.id, d]))
  const glanceRows: GlanceRow[] = sorted.map(day => {
    const assigned = plans.get(day.id)?.assigned || []
    const nightStays = staysForDay(day, days, accommodationList).filter(a => a.end_day_id !== day.id)
    return {
      number: day.day_number ?? 0,
      colour: dayColourOf(day),
      date: day.date ? shortDate(day.date, loc) : '',
      title: day.title || tr('dayplan.dayN', { n: day.day_number ?? 0 }),
      stops: assigned.filter(a => a.place).length,
      stay: nightStays.map(a => a.place_name || a.reservation_title || '').filter(Boolean).join(', '),
      cost: dayCost(day.id) || null,
    }
  })
  const orderOf = (dayId: number | null | undefined) => {
    const d = dayId != null ? dayNumberOf.get(dayId) : undefined
    return d ? getDayOrder(d, sorted) : Number.MAX_SAFE_INTEGER
  }
  const ledgerRows: (LedgerRow & { order: number; minute: string })[] = [
    ...accommodationList.map(stay => {
      const from = dayNumberOf.get(stay.start_day_id)
      const to = dayNumberOf.get(stay.end_day_id)
      return {
        order: orderOf(stay.start_day_id),
        minute: '',
        icon: glyph('bed', 13),
        tint: '#17171c',
        title: stay.place_name || stay.reservation_title || '',
        sub: escHtml(stay.place_address || ''),
        when: [from?.date ? shortDate(from.date, loc) : '', to?.date ? shortDate(to.date, loc) : ''].filter(Boolean).join(' – '),
        code: stay.confirmation || null,
      }
    }),
    ...(reservations || [])
      .filter(r => r.type !== 'hotel' && r.day_id != null && dayNumberOf.has(r.day_id))
      .map((r: PdfBooking) => {
        const day = dayNumberOf.get(r.day_id ?? -1)
        const time = fmtTime(splitReservationDateTime(day ? getDisplayTimeForDay(r, day.id) : null).time)
        return {
          order: orderOf(r.day_id),
          minute: time,
          icon: bookingIcon(r.type, 13),
          tint: hexColour(bookingTint(r.type), '#6b6b75'),
          title: r.title || '',
          sub: bookingLinesHtml(r, tr),
          when: [day?.date ? shortDate(day.date, loc) : '', time].filter(Boolean).join('  '),
          code: r.confirmation_number || null,
        }
      }),
  ].sort((a, b) => a.order - b.order || a.minute.localeCompare(b.minute))

  const overviewHtml = `<section class="overview">
    ${hasInvalidTour ? `<p role="status" class="trip-map-note">${escHtml(tr('tours.dayRoute.endpointUnknown'))}</p>` : ''}
    ${tripMapHtml}
    ${glanceHtml(glanceRows, tr)}
    ${ledgerHtml(ledgerRows, tr)}
  </section>`

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

  const stats: CoverStat[] = [
    { value: String(sorted.length), label: tr('dashboard.days', { count: sorted.length }) },
    { value: String(places?.length || 0), label: tr('dashboard.places', { count: places?.length || 0 }) },
    { value: String(totalAssigned), label: tr('pdf.planned') },
    ...(totalDistanceLabel ? [{ value: totalDistanceLabel, label: tr('pdf.distanceLabel') }] : []),
    ...(totalCostLabel ? [{ value: totalCostLabel, label: tr('pdf.costLabel') }] : []),
  ]

  const html = `<!DOCTYPE html>
<html lang="${(loc || 'en').split('-')[0]}">
<head>
<meta charset="UTF-8">
<base href="${window.location.origin}/">
<title>${escHtml(trip?.title || tr('pdf.travelPlan'))}</title>
<style>${tripPdfCss()}</style>
</head>
<body${bodyClassAttr(switches)}>
<main class="doc">
${coverHtml({
  title: trip?.title || 'My Trip',
  description: trip?.description || null,
  range,
  image: coverImg,
  logo: absUrl('/logo-light.svg'),
  stats,
  route: (tripRoute?.days || []).filter(d => d.lines.length).map(d => ({ colour: hexColour(d.color.line, '#ffffff'), lines: d.lines })),
  ribbon: sorted.map(dayColourOf),
  ribbonEnds: sorted.length > 1 && sorted[0].date && sorted[sorted.length - 1].date
    ? [shortDate(sorted[0].date, loc), shortDate(sorted[sorted.length - 1].date, loc)]
    : null,
  tr,
})}
${overviewHtml}
${daysHtml}
${pluginSectionsHtml}
<div class="doc-end"><span>made with</span><img src="${absUrl('/logo-dark.svg')}" alt="TREK" /></div>
</main>
</body></html>`
  markdown.dispose()
  if (signal?.aborted) return

  openPdfPreview({
    html,
    title: trip?.title || tr('pdf.travelPlan'),
    tripId: trip?.id,
    tr,
    ...switches,
    hasTransportNotes: flags.transportNote,
  })
}

function bodyClassAttr(s: { breaksPerDay: boolean; showTransportNotes: boolean; largeText: boolean; photos: boolean; overview: boolean; coordinates: boolean; details: boolean }): string {
  const classes = [
    !s.breaksPerDay && 'pdf-flow',
    !s.showTransportNotes && 'pdf-no-transport-notes',
    s.largeText && 'pdf-large-text',
    !s.photos && 'pdf-no-photos',
    !s.overview && 'pdf-no-overview',
    !s.coordinates && 'pdf-no-coords',
    !s.details && 'pdf-no-details',
  ].filter(Boolean)
  return classes.length ? ` class="${classes.join(' ')}"` : ''
}
