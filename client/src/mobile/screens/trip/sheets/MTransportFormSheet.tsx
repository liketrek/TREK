import { useEffect, useRef, useState } from 'react'
import { Bike, Bus, Car, CarTaxiFront, Plane, Plus, Route, Sailboat, Ship, Train, TrainFront, TramFront, Trash2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { useAddonStore } from '../../../../store/addonStore'
import { useTranslation } from '../../../../i18n'
import { formatDate, resolveDayId, splitReservationDateTime } from '../../../../utils/formatters'
import { orderedEndpoints, parseReservationMetadata } from '../../../../utils/flightLegs'
import { typeToCostCategory } from '@trek/shared'
import CustomSelect from '../../../../components/shared/CustomSelect'
import CustomTimePicker from '../../../../components/shared/CustomTimePicker'
import AirportSelect, { type Airport } from '../../../../components/Planner/AirportSelect'
import LocationSelect, { type LocationPoint } from '../../../../components/Planner/LocationSelect'
import TransitSearchPanel from '../../../../components/Planner/TransitSearchPanel'
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetFooter, FormSheetHeader } from './PlSheetChrome'
import PlFileAttach from './PlFileAttach'
import type { Day, Place, Reservation, ReservationEndpoint } from '../../../../types'
import type { BookingReviewDraft } from '../../../../components/Planner/parsedItemToDraft'
import type { BookingExpenseRequest } from '../../../../components/Planner/BookingCostsSection.types'
import type { TripPlanner } from '../MTripShell'

export interface MTransportFormSheetProps {
  planner: TripPlanner
  onOpenExpense: (req: BookingExpenseRequest) => void
}

const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transit', 'transport_other'] as const
type TransportType = typeof TRANSPORT_TYPES[number]

const TYPE_OPTIONS = [
  { value: 'flight', labelKey: 'reservations.type.flight', Icon: Plane },
  { value: 'train', labelKey: 'reservations.type.train', Icon: Train },
  { value: 'bus', labelKey: 'reservations.type.bus', Icon: Bus },
  { value: 'car', labelKey: 'reservations.type.car', Icon: Car },
  { value: 'taxi', labelKey: 'reservations.type.taxi', Icon: CarTaxiFront },
  { value: 'bicycle', labelKey: 'reservations.type.bicycle', Icon: Bike },
  { value: 'cruise', labelKey: 'reservations.type.cruise', Icon: Ship },
  { value: 'ferry', labelKey: 'reservations.type.ferry', Icon: Sailboat },
  { value: 'transport_other', labelKey: 'reservations.type.transport_other', Icon: Route },
]

interface EndpointPick {
  airport?: Airport
  location?: LocationPoint
}

// ── Endpoint / metadata helpers (ported 1:1 from the desktop TransportModal so
// the saved shape is byte-identical). ──────────────────────────────────────────
function endpointFromAirport(a: Airport, role: 'from' | 'to' | 'stop', sequence: number, date: string | null, time: string | null): Omit<ReservationEndpoint, 'id' | 'reservation_id'> {
  return { role, sequence, name: a.city ? `${a.city} (${a.iata})` : a.name, code: a.iata, lat: a.lat, lng: a.lng, timezone: a.tz, local_date: date, local_time: time }
}
function endpointFromLocation(l: LocationPoint, role: 'from' | 'to' | 'stop', sequence: number, date: string | null, time: string | null): Omit<ReservationEndpoint, 'id' | 'reservation_id'> {
  return { role, sequence, name: l.name, code: null, lat: l.lat, lng: l.lng, timezone: null, local_date: date, local_time: time }
}
function airportFromEndpoint(e: ReservationEndpoint | undefined): Airport | null {
  if (!e || !e.code) return null
  return { iata: e.code, icao: null, name: e.name, city: e.name.replace(/\s*\([A-Z]{3}\)\s*$/, ''), country: '', lat: e.lat, lng: e.lng, tz: e.timezone || '' }
}
function locationFromEndpoint(e: ReservationEndpoint | undefined): LocationPoint | null {
  if (!e) return null
  return { name: e.name, lat: e.lat, lng: e.lng, address: null }
}

// A flight is an ordered list of airports; N waypoints = N-1 legs. The origin
// only departs, the destination only arrives, each stop does both.
interface WaypointForm {
  airport: Airport | null
  arrDayId: string | number
  arrTime: string
  depDayId: string | number
  depTime: string
  airline: string
  flight_number: string
  seat: string
}
function emptyWaypoint(dayId: string | number = ''): WaypointForm {
  return { airport: null, arrDayId: dayId, arrTime: '', depDayId: dayId, depTime: '', airline: '', flight_number: '', seat: '' }
}

// A train mirrors the flight route model, but its waypoints are STATIONS
// (location search) and each leg carries a train number + platform.
interface StationWaypointForm {
  location: LocationPoint | null
  arrDayId: string | number
  arrTime: string
  depDayId: string | number
  depTime: string
  train_number: string
  platform: string
  seat: string
}
function emptyStationWaypoint(dayId: string | number = ''): StationWaypointForm {
  return { location: null, arrDayId: dayId, arrTime: '', depDayId: dayId, depTime: '', train_number: '', platform: '', seat: '' }
}

const EMPTY = {
  title: '',
  type: 'flight' as TransportType,
  status: 'pending' as 'pending' | 'confirmed',
  start_day_id: '' as string | number,
  end_day_id: '' as string | number,
  departure_time: '',
  arrival_time: '',
  confirmation_number: '',
  notes: '',
}

/**
 * Add/edit transport sheet — the mobile counterpart of the desktop
 * TransportModal, driven by the planner's own editor flags (showTransportModal /
 * editingTransport / transportPrefill / transportModalAutomated) so every entry
 * point (transports tab, day header, timeline, "change route", import review)
 * opens it unchanged. The manual tab supports single- and multi-leg flights /
 * trains; the automated tab embeds the shared TransitSearchPanel. Saving reuses
 * planner.handleSaveTransport, whose payload shape is preserved byte-for-byte.
 */
export default function MTransportFormSheet({ planner, onOpenExpense }: MTransportFormSheetProps) {
  const {
    t, toast, tripId, trip, days, places, assignments, tripAccommodations,
    showTransportModal, setShowTransportModal,
    editingTransport, setEditingTransport,
    transportModalDayId, setTransportModalDayId,
    transportModalAutomated, setTransportModalAutomated,
    transportPrefill, transitPrefill, setTransitPrefill,
    importReviewActive, advanceImportReview,
    handleSaveTransport, handleDeleteReservation,
    canUploadFiles, tripActions,
  } = planner
  const { locale } = useTranslation()

  const isBudgetEnabled = useAddonStore(s => s.isEnabled('budget'))
  const tripHasDates = Boolean(trip?.start_date && trip?.end_date)

  const [form, setForm] = useState({ ...EMPTY })
  const [automated, setAutomated] = useState(false)
  const [fromPick, setFromPick] = useState<EndpointPick>({})
  const [toPick, setToPick] = useState<EndpointPick>({})
  const [waypoints, setWaypoints] = useState<WaypointForm[]>([emptyWaypoint(), emptyWaypoint()])
  const [trainWaypoints, setTrainWaypoints] = useState<StationWaypointForm[]>([emptyStationWaypoint(), emptyStationWaypoint()])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  // Ref (not state) so handleSubmit reads the intent set by the same click — a
  // state value would be stale in that render's closure and never open the editor.
  const expenseIntentRef = useRef(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  // Open-time snapshot so the sheet content survives the exit animation.
  const [snap, setSnap] = useState<{ res: Reservation | null; prefill: BookingReviewDraft | null }>({ res: null, prefill: null })

  useEffect(() => {
    if (!showTransportModal) return
    setSnap({ res: editingTransport, prefill: transportPrefill })
    setAutomated(transportModalAutomated)
    expenseIntentRef.current = false
    setDeleteArmed(false)
    // On a review-import, seed the booking's Files with the parsed source document.
    setPendingFiles(!editingTransport && transportPrefill?._sourceFiles ? transportPrefill._sourceFiles : [])

    // Edit uses the saved `editingTransport`; a review-import populates from the
    // prefill. Either way the init reads the same fields; the reservation still
    // decides edit-vs-create at submit time.
    const src = (editingTransport ?? transportPrefill) as Reservation | null
    if (src) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = typeof src.metadata === 'string' ? JSON.parse(src.metadata || '{}') : ((src.metadata as any) || {})
      const eps = src.endpoints || []
      const from = eps.find(e => e.role === 'from')
      const to = eps.find(e => e.role === 'to')
      const type = (TRANSPORT_TYPES as readonly string[]).includes(src.type) ? (src.type as TransportType) : 'flight'
      setForm({
        title: src.title || '',
        type,
        status: src.status === 'confirmed' ? 'confirmed' : 'pending',
        // For an edit, keep the saved day; for an imported prefill (no day_id),
        // resolve it from the parsed pick-up/return date so it isn't lost.
        start_day_id: src.day_id ?? resolveDayId(days, splitReservationDateTime(src.reservation_time).date),
        end_day_id: src.end_day_id ?? resolveDayId(days, splitReservationDateTime(src.reservation_end_time).date),
        departure_time: splitReservationDateTime(src.reservation_time).time ?? '',
        arrival_time: splitReservationDateTime(src.reservation_end_time).time ?? '',
        confirmation_number: src.confirmation_number || '',
        notes: src.notes || '',
      })
      if (type === 'flight') {
        const orderedEps = orderedEndpoints(src)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metaLegs: any[] = Array.isArray(meta.legs) ? meta.legs : []
        let wps: WaypointForm[]
        if (orderedEps.length >= 2) {
          wps = orderedEps.map((ep, i) => {
            const legInto = metaLegs[i - 1]
            const legOut = metaLegs[i]
            const isFirst = i === 0
            const isLast = i === orderedEps.length - 1
            return {
              airport: airportFromEndpoint(ep),
              arrDayId: legInto?.arr_day_id ?? (isLast ? (src.end_day_id ?? '') : ''),
              arrTime: legInto?.arr_time ?? (!isFirst ? (ep.local_time ?? '') : ''),
              depDayId: legOut?.dep_day_id ?? (isFirst ? (src.day_id ?? '') : ''),
              depTime: legOut?.dep_time ?? (!isLast ? (ep.local_time ?? '') : ''),
              airline: legOut?.airline ?? (isFirst ? (meta.airline ?? '') : ''),
              flight_number: legOut?.flight_number ?? (isFirst ? (meta.flight_number ?? '') : ''),
              seat: legOut?.seat ?? (isFirst ? (meta.seat ?? '') : ''),
            }
          })
        } else {
          const dep = emptyWaypoint(src.day_id ?? '')
          dep.airport = airportFromEndpoint(from)
          dep.depTime = splitReservationDateTime(src.reservation_time).time ?? ''
          dep.airline = meta.airline ?? ''
          dep.flight_number = meta.flight_number ?? ''
          dep.seat = meta.seat ?? ''
          const arr = emptyWaypoint(src.end_day_id ?? src.day_id ?? '')
          arr.airport = airportFromEndpoint(to)
          arr.arrTime = splitReservationDateTime(src.reservation_end_time).time ?? ''
          wps = [dep, arr]
        }
        setWaypoints(wps)
        setFromPick({})
        setToPick({})
      } else if (type === 'train') {
        const orderedEps = orderedEndpoints(src)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metaLegs: any[] = Array.isArray(meta.legs) ? meta.legs : []
        let wps: StationWaypointForm[]
        if (orderedEps.length >= 2) {
          wps = orderedEps.map((ep, i) => {
            const legInto = metaLegs[i - 1]
            const legOut = metaLegs[i]
            const isFirst = i === 0
            const isLast = i === orderedEps.length - 1
            return {
              location: locationFromEndpoint(ep),
              arrDayId: legInto?.arr_day_id ?? (isLast ? (src.end_day_id ?? '') : ''),
              arrTime: legInto?.arr_time ?? (!isFirst ? (ep.local_time ?? '') : ''),
              depDayId: legOut?.dep_day_id ?? (isFirst ? (src.day_id ?? '') : ''),
              depTime: legOut?.dep_time ?? (!isLast ? (ep.local_time ?? '') : ''),
              train_number: legOut?.train_number ?? (isFirst ? (meta.train_number ?? '') : ''),
              platform: legOut?.platform ?? (isFirst ? (meta.platform ?? '') : ''),
              seat: legOut?.seat ?? (isFirst ? (meta.seat ?? '') : ''),
            }
          })
        } else {
          const dep = emptyStationWaypoint(src.day_id ?? '')
          dep.location = locationFromEndpoint(from)
          dep.depTime = splitReservationDateTime(src.reservation_time).time ?? ''
          dep.train_number = meta.train_number ?? ''
          dep.platform = meta.platform ?? ''
          dep.seat = meta.seat ?? ''
          const arr = emptyStationWaypoint(src.end_day_id ?? src.day_id ?? '')
          arr.location = locationFromEndpoint(to)
          arr.arrTime = splitReservationDateTime(src.reservation_end_time).time ?? ''
          wps = [dep, arr]
        }
        setTrainWaypoints(wps)
        setFromPick({})
        setToPick({})
      } else {
        setFromPick({ location: locationFromEndpoint(from) || undefined })
        setToPick({ location: locationFromEndpoint(to) || undefined })
        setWaypoints([emptyWaypoint(), emptyWaypoint()])
        setTrainWaypoints([emptyStationWaypoint(), emptyStationWaypoint()])
      }
    } else {
      setForm({ ...EMPTY, start_day_id: transportModalDayId ?? '', end_day_id: transportModalDayId ?? '' })
      setFromPick({})
      setToPick({})
      setWaypoints([emptyWaypoint(transportModalDayId ?? ''), emptyWaypoint(transportModalDayId ?? '')])
      setTrainWaypoints([emptyStationWaypoint(transportModalDayId ?? ''), emptyStationWaypoint(transportModalDayId ?? '')])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTransportModal])

  const res = snap.res
  const prefill = snap.prefill
  const set = (field: keyof typeof EMPTY, value: string | number) => setForm(prev => ({ ...prev, [field]: value }))

  const showModeToggle = !res && tripHasDates

  const dayOptions = [
    { value: '', label: '—' },
    ...days.map(d => {
      const dateBadge = d.date ? (formatDate(d.date, locale) ?? undefined) : undefined
      const dayBadge = d.title ? t('dayplan.dayN', { n: d.day_number }) : undefined
      return { value: d.id, label: d.title || t('dayplan.dayN', { n: d.day_number }), badge: dateBadge ?? dayBadge }
    }),
  ]

  const handleClose = () => {
    if (importReviewActive) { advanceImportReview(); return }
    setShowTransportModal(false)
    setEditingTransport(null)
    setTransportModalDayId(null)
    setTransportModalAutomated(false)
    setTransitPrefill(null)
  }

  // The single save path shared by the manual submit and the automated panel —
  // handleSaveTransport closes the sheet on success; on an import review it also
  // advances to the next parsed item (mirrors the desktop MTripSheets wrapper).
  const saveTransport = async (data: Record<string, unknown> & { title: string }) => {
    const r = await handleSaveTransport(data as never)
    if (importReviewActive && r) advanceImportReview()
    return r
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || isSaving) return
    const withExpense = expenseIntentRef.current
    expenseIntentRef.current = false
    setIsSaving(true)
    try {
      const startDay = days.find(d => d.id === Number(form.start_day_id))
      const endDay = days.find(d => d.id === Number(form.end_day_id))

      const buildTime = (day: Day | undefined, time: string): string | null => {
        if (!time) return null
        return day?.date ? `${day.date}T${time}` : time
      }

      const dayDate = (id: string | number): string | null => days.find(d => d.id === Number(id))?.date ?? null
      const flightWps = form.type === 'flight' ? waypoints.filter(w => w.airport) : []
      const firstWp = flightWps[0]
      const lastWp = flightWps[flightWps.length - 1]
      const trainWps = form.type === 'train' ? trainWaypoints : []
      const firstTrainWp = trainWps[0]
      const lastTrainWp = trainWps[trainWps.length - 1]
      const trainStations = form.type === 'train' ? trainWaypoints.filter(w => w.location) : []
      // Per-leg day-plan positions are owned by the day planner — keep them on re-save.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const origLegs: any[] = res ? (parseReservationMetadata(res).legs || []) : []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata: Record<string, any> = {}
      if (form.type === 'flight') {
        if (firstWp?.airline) metadata.airline = firstWp.airline
        if (firstWp?.flight_number) metadata.flight_number = firstWp.flight_number
        if (firstWp?.airport) {
          metadata.departure_airport = firstWp.airport.iata
          metadata.departure_timezone = firstWp.airport.tz
        }
        if (lastWp?.airport) {
          metadata.arrival_airport = lastWp.airport.iata
          metadata.arrival_timezone = lastWp.airport.tz
        }
        if (flightWps.length > 2) {
          metadata.legs = flightWps.slice(0, -1).map((w, i) => {
            const next = flightWps[i + 1]
            return {
              from: w.airport!.iata,
              to: next.airport!.iata,
              ...(w.airline ? { airline: w.airline } : {}),
              ...(w.flight_number ? { flight_number: w.flight_number } : {}),
              ...(w.seat ? { seat: w.seat } : {}),
              dep_day_id: w.depDayId ? Number(w.depDayId) : null,
              dep_time: w.depTime || null,
              arr_day_id: next.arrDayId ? Number(next.arrDayId) : null,
              arr_time: next.arrTime || null,
              ...(origLegs[i]?.day_positions ? { day_positions: origLegs[i].day_positions } : {}),
            }
          })
        }
        if (firstWp?.seat) metadata.seat = firstWp.seat
      } else if (form.type === 'train') {
        if (firstTrainWp?.train_number) metadata.train_number = firstTrainWp.train_number
        if (firstTrainWp?.platform) metadata.platform = firstTrainWp.platform
        if (firstTrainWp?.seat) metadata.seat = firstTrainWp.seat
        if (trainStations.length > 2) {
          metadata.legs = trainStations.slice(0, -1).map((w, i) => {
            const next = trainStations[i + 1]
            return {
              from: w.location!.name,
              to: next.location!.name,
              ...(w.train_number ? { train_number: w.train_number } : {}),
              ...(w.platform ? { platform: w.platform } : {}),
              ...(w.seat ? { seat: w.seat } : {}),
              dep_day_id: w.depDayId ? Number(w.depDayId) : null,
              dep_time: w.depTime || null,
              arr_day_id: next.arrDayId ? Number(next.arrDayId) : null,
              arr_time: next.arrTime || null,
              ...(origLegs[i]?.day_positions ? { day_positions: origLegs[i].day_positions } : {}),
            }
          })
        }
      }

      // A transit itinerary lives in metadata.transit + 'stop' endpoints, which
      // this form neither shows nor edits — keep them while from/to are unchanged.
      const prevMeta = res ? parseReservationMetadata(res) : {}
      const prevEndpointsAll = res?.endpoints || []
      const prevFrom = prevEndpointsAll.find(ep => ep.role === 'from')
      const prevTo = prevEndpointsAll.find(ep => ep.role === 'to')
      const near = (a?: number | null, b?: number | null) => a != null && b != null && Math.abs(a - b) < 1e-6
      const keepTransit = !!(prevMeta.transit && form.type !== 'flight' &&
        prevFrom && prevTo && fromPick.location && toPick.location &&
        near(prevFrom.lat, fromPick.location.lat) && near(prevFrom.lng, fromPick.location.lng) &&
        near(prevTo.lat, toPick.location.lat) && near(prevTo.lng, toPick.location.lng))
      if (keepTransit) metadata.transit = prevMeta.transit
      // A joined AirTrail import records its source flight ids in metadata.airtrail_ids.
      if (Array.isArray(prevMeta.airtrail_ids)) metadata.airtrail_ids = prevMeta.airtrail_ids

      const startDate = startDay?.date ?? null
      const endDate = (endDay ?? startDay)?.date ?? null
      const endpoints: ReturnType<typeof endpointFromAirport>[] = []
      if (form.type === 'flight') {
        flightWps.forEach((w, i) => {
          const isFirst = i === 0
          const isLast = i === flightWps.length - 1
          const role: 'from' | 'to' | 'stop' = isFirst ? 'from' : isLast ? 'to' : 'stop'
          const dId = isLast ? w.arrDayId : w.depDayId
          const time = isLast ? w.arrTime : w.depTime
          endpoints.push(endpointFromAirport(w.airport!, role, i, dayDate(dId), time || null))
        })
      } else if (form.type === 'train') {
        trainStations.forEach((w, i) => {
          const isFirst = i === 0
          const isLast = i === trainStations.length - 1
          const role: 'from' | 'to' | 'stop' = isFirst ? 'from' : isLast ? 'to' : 'stop'
          const dId = isLast ? w.arrDayId : w.depDayId
          const time = isLast ? w.arrTime : w.depTime
          const date = dayDate(dId) ?? (isLast ? dayDate(firstTrainWp?.depDayId ?? '') : null)
          endpoints.push(endpointFromLocation(w.location!, role, i, date, time || null))
        })
      } else {
        if (fromPick.location) endpoints.push(endpointFromLocation(fromPick.location, 'from', 0, startDate, form.departure_time || null))
        const stops = keepTransit
          ? prevEndpointsAll.filter(ep => ep.role === 'stop').slice().sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
          : []
        stops.forEach((s, i) => endpoints.push({
          role: 'stop', sequence: i + 1, name: s.name, code: s.code ?? null,
          lat: s.lat, lng: s.lng, timezone: s.timezone ?? null,
          local_date: s.local_date ?? null, local_time: s.local_time ?? null,
        }))
        if (toPick.location) endpoints.push(endpointFromLocation(toPick.location, 'to', stops.length + 1, endDate, form.arrival_time || null))
      }

      const flightDepDay = firstWp && firstWp.depDayId ? Number(firstWp.depDayId) : null
      const flightArrDay = lastWp && lastWp.arrDayId ? Number(lastWp.arrDayId) : null
      const trainDepDay = firstTrainWp && firstTrainWp.depDayId ? Number(firstTrainWp.depDayId) : null
      const trainArrDay = lastTrainWp && lastTrainWp.arrDayId ? Number(lastTrainWp.arrDayId) : null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> & { title: string } = {
        title: form.title,
        type: form.type,
        status: form.status,
        day_id: form.type === 'flight' ? flightDepDay : form.type === 'train' ? trainDepDay : (form.start_day_id ? Number(form.start_day_id) : null),
        end_day_id: form.type === 'flight' ? flightArrDay : form.type === 'train' ? trainArrDay : (form.end_day_id ? Number(form.end_day_id) : null),
        reservation_time: form.type === 'flight'
          ? buildTime(days.find(d => d.id === flightDepDay), firstWp?.depTime || '')
          : form.type === 'train'
            ? buildTime(days.find(d => d.id === trainDepDay), firstTrainWp?.depTime || '')
            : buildTime(startDay, form.departure_time),
        reservation_end_time: form.type === 'flight'
          ? buildTime(days.find(d => d.id === flightArrDay), lastWp?.arrTime || '')
          : form.type === 'train'
            ? buildTime(days.find(d => d.id === trainArrDay) ?? days.find(d => d.id === trainDepDay), lastTrainWp?.arrTime || '')
            : buildTime(endDay ?? startDay, form.arrival_time),
        location: null,
        confirmation_number: form.confirmation_number || null,
        notes: form.notes || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
        endpoints,
        needs_review: false,
      }
      // Imported booking → auto-create the linked cost from the parsed price
      // (only on create and only when a price is present).
      if (!res && prefill && isBudgetEnabled) {
        const pmeta = prefill.metadata && typeof prefill.metadata === 'object' ? (prefill.metadata as Record<string, unknown>) : {}
        const price = Number(pmeta.price)
        if (Number.isFinite(price) && price > 0) {
          payload.create_budget_entry = { total_price: price, category: typeToCostCategory(form.type) }
        }
      }
      const saved = await saveTransport(payload)
      if (!res?.id && saved?.id && pendingFiles.length > 0 && canUploadFiles) {
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('reservation_id', String(saved.id))
          fd.append('description', form.title)
          await tripActions.addFile(tripId, fd)
        }
      }
      if (withExpense && saved?.id) {
        onOpenExpense({ prefill: { reservationId: saved.id, name: form.title, category: typeToCostCategory(form.type) } })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!res) return
    if (!deleteArmed) {
      setDeleteArmed(true)
      toast.warning(t('mobileTrip.tapAgainToDelete'))
      return
    }
    await handleDeleteReservation(res.id)
    handleClose()
  }

  const headerTitle = automated ? t('transit.title') : res ? t('transport.modalTitle.edit') : t('transport.modalTitle.create')

  return (
    <MSheet
      open={showTransportModal}
      onClose={handleClose}
      material="opaque"
      ariaLabel={headerTitle}
    >
      <FormSheetHeader
        icon={TrainFront}
        title={headerTitle}
        onClose={handleClose}
        closeLabel={t('common.close')}
      />

      {/* Manual vs Automated switch — creating only; editing a journey re-enters
          via "change route" with the switch hidden. Without trip dates there is
          nothing to plan a departure against, so Automated is not offered. */}
      {showModeToggle && (
        <div className="flex-none px-[18px] pb-2">
          <div className="flex rounded-full bg-[color:var(--m-ic)] p-[3px]">
            {([['manual', t('transport.modeManual')], ['automated', t('transport.modeAutomated')]] as const).map(([m, label]) => {
              const active = (m === 'automated') === automated
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAutomated(m === 'automated')}
                  className={`flex-1 rounded-full py-[7px] text-[0.71875rem] font-semibold ${
                    active ? 'bg-m-act text-m-actfg' : 'text-m-muted'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-[2px]">
        {automated ? (
          /* ── Automated: public transit search ── */
          <>
            <div className="mt-2 flex items-center gap-[10px] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[11px]">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] bg-[color:var(--m-ic)]">
                <TramFront size={17} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[0.8125rem] font-bold text-m-ink">{t('transit.title')}</div>
                <div className="truncate font-geist text-[0.65625rem] text-m-faint">{t('transit.searchHint')}</div>
              </div>
            </div>
            <div className="mt-3">
              <CustomSelect
                value={form.start_day_id}
                onChange={v => set('start_day_id', v)}
                placeholder={t('dayplan.dayN', { n: '?' })}
                options={dayOptions}
                size="sm"
              />
            </div>
            {(() => {
              const transitDay = days.find(d => d.id === Number(form.start_day_id))
              if (!transitDay) {
                return <div className="mt-3 font-geist text-[0.78125rem] text-m-faint">{t('transit.pickDay')}</div>
              }
              // Quick picks offer the chosen day's itinerary, not the whole trip.
              const dayPlaces = (assignments[String(transitDay.id)] || [])
                .slice().sort((a, b) => a.order_index - b.order_index)
                .map(a => places.find(p => p.id === a.place_id))
                .filter((p): p is Place => p != null)
              return (
                <div className="mt-4">
                  <TransitSearchPanel
                    day={transitDay}
                    days={days}
                    places={dayPlaces}
                    accommodations={tripAccommodations}
                    onAdd={(p) => saveTransport(p as Record<string, unknown> & { title: string })}
                    initialFrom={transitPrefill?.from ?? null}
                    initialTo={transitPrefill?.to ?? null}
                  />
                </div>
              )
            })()}
          </>
        ) : (
          /* ── Manual booking form ── */
          <>
            {/* BOOKING TYPE */}
            <Eyebrow className="mb-[6px] mt-2 uppercase">{t('reservations.bookingType')}</Eyebrow>
            <div className="flex flex-wrap gap-[6px]">
              {TYPE_OPTIONS.map(({ value, labelKey, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('type', value)}
                  aria-pressed={form.type === value}
                  className={`flex items-center gap-[5px] rounded-full px-[11px] py-[6px] text-[0.71875rem] font-semibold ${
                    form.type === value
                      ? 'bg-m-act text-m-actfg'
                      : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
                  }`}
                >
                  <Icon size={12} strokeWidth={2} />
                  {t(labelKey)}
                </button>
              ))}
            </div>

            {/* TITLE */}
            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.titleLabel')} *</Eyebrow>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={t('reservations.titlePlaceholder')}
              className={FIELD_CLS}
            />

            {/* ROUTE */}
            {form.type === 'flight' ? (
              <>
                <Eyebrow className="mb-[6px] mt-3 uppercase">{t('reservations.layover.route')}</Eyebrow>
                <div className="flex flex-col gap-[6px]">
                  {waypoints.map((wp, i) => {
                    const isFirst = i === 0
                    const isLast = i === waypoints.length - 1
                    const updateWp = (patch: Partial<WaypointForm>) => setWaypoints(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
                    const roleLabel = isFirst ? t('reservations.meta.from') : isLast ? t('reservations.meta.to') : t('reservations.layover.stop')
                    return (
                      <div key={i} className="flex flex-col gap-[6px]">
                        <div className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[11px]">
                          <div className="mb-[8px] flex items-center gap-2">
                            <span className="flex-none font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">{roleLabel}</span>
                            <div className="min-w-0 flex-1">
                              <AirportSelect value={wp.airport} onChange={a => updateWp({ airport: a || null })} />
                            </div>
                            {!isFirst && !isLast && (
                              <button type="button" onClick={() => setWaypoints(prev => prev.filter((_, j) => j !== i))} aria-label={t('common.delete')} className="flex-none text-m-faint">
                                <Trash2 size={14} strokeWidth={2} />
                              </button>
                            )}
                          </div>
                          {!isFirst && (
                            <div className="flex gap-2">
                              <div className="min-w-0 flex-1">
                                <Eyebrow className="mb-[5px] uppercase">{t('reservations.arrivalDate')}</Eyebrow>
                                <CustomSelect value={wp.arrDayId} onChange={v => updateWp({ arrDayId: v })} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <Eyebrow className="mb-[5px] uppercase">{t('reservations.arrivalTime')}</Eyebrow>
                                <CustomTimePicker value={wp.arrTime} onChange={v => updateWp({ arrTime: v })} />
                              </div>
                            </div>
                          )}
                          {!isLast && (
                            <>
                              <div className={`flex gap-2 ${!isFirst ? 'mt-2' : ''}`}>
                                <div className="min-w-0 flex-1">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.departureDate')}</Eyebrow>
                                  <CustomSelect value={wp.depDayId} onChange={v => updateWp({ depDayId: v })} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.departureTime')}</Eyebrow>
                                  <CustomTimePicker value={wp.depTime} onChange={v => updateWp({ depTime: v })} />
                                </div>
                              </div>
                              <div className="mt-2 flex gap-2">
                                <div className="min-w-0 flex-[1.2]">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.airline')}</Eyebrow>
                                  <input type="text" value={wp.airline} onChange={e => updateWp({ airline: e.target.value })} placeholder="Lufthansa" className={FIELD_CLS} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.flightNumber')}</Eyebrow>
                                  <input type="text" value={wp.flight_number} onChange={e => updateWp({ flight_number: e.target.value })} placeholder="LH 123" className={FIELD_CLS} />
                                </div>
                                <div className="min-w-0 flex-[0.7]">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.seat')}</Eyebrow>
                                  <input type="text" value={wp.seat} onChange={e => updateWp({ seat: e.target.value })} placeholder="12A" className={FIELD_CLS} />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {!isLast && (
                          <button
                            type="button"
                            onClick={() => setWaypoints(prev => [...prev.slice(0, i + 1), emptyWaypoint(prev[i]?.depDayId || ''), ...prev.slice(i + 1)])}
                            className="flex w-full items-center justify-center gap-[5px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-rowbr)] py-2 font-geist text-[0.6875rem] font-semibold text-m-muted"
                          >
                            <Plus size={12} strokeWidth={2.2} /> {t('reservations.layover.addStop')}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : form.type === 'train' ? (
              <>
                <Eyebrow className="mb-[6px] mt-3 uppercase">{t('reservations.layover.route')}</Eyebrow>
                <div className="flex flex-col gap-[6px]">
                  {trainWaypoints.map((wp, i) => {
                    const isFirst = i === 0
                    const isLast = i === trainWaypoints.length - 1
                    const updateWp = (patch: Partial<StationWaypointForm>) => setTrainWaypoints(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
                    const roleLabel = isFirst ? t('reservations.meta.from') : isLast ? t('reservations.meta.to') : t('reservations.layover.stop')
                    return (
                      <div key={i} className="flex flex-col gap-[6px]">
                        <div className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[11px]">
                          <div className="mb-[8px] flex items-center gap-2">
                            <span className="flex-none font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">{roleLabel}</span>
                            <div className="min-w-0 flex-1">
                              <LocationSelect value={wp.location} onChange={l => updateWp({ location: l || null })} />
                            </div>
                            {!isFirst && !isLast && (
                              <button type="button" onClick={() => setTrainWaypoints(prev => prev.filter((_, j) => j !== i))} aria-label={t('common.delete')} className="flex-none text-m-faint">
                                <Trash2 size={14} strokeWidth={2} />
                              </button>
                            )}
                          </div>
                          {!isFirst && (
                            <div className="flex gap-2">
                              <div className="min-w-0 flex-1">
                                <Eyebrow className="mb-[5px] uppercase">{t('reservations.arrivalDate')}</Eyebrow>
                                <CustomSelect value={wp.arrDayId} onChange={v => updateWp({ arrDayId: v })} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <Eyebrow className="mb-[5px] uppercase">{t('reservations.arrivalTime')}</Eyebrow>
                                <CustomTimePicker value={wp.arrTime} onChange={v => updateWp({ arrTime: v })} />
                              </div>
                            </div>
                          )}
                          {!isLast && (
                            <>
                              <div className={`flex gap-2 ${!isFirst ? 'mt-2' : ''}`}>
                                <div className="min-w-0 flex-1">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.departureDate')}</Eyebrow>
                                  <CustomSelect value={wp.depDayId} onChange={v => updateWp({ depDayId: v })} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.departureTime')}</Eyebrow>
                                  <CustomTimePicker value={wp.depTime} onChange={v => updateWp({ depTime: v })} />
                                </div>
                              </div>
                              <div className="mt-2 flex gap-2">
                                <div className="min-w-0 flex-[1.2]">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.trainNumber')}</Eyebrow>
                                  <input type="text" value={wp.train_number} onChange={e => updateWp({ train_number: e.target.value })} placeholder="ICE 123" className={FIELD_CLS} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.platform')}</Eyebrow>
                                  <input type="text" value={wp.platform} onChange={e => updateWp({ platform: e.target.value })} placeholder="12" className={FIELD_CLS} />
                                </div>
                                <div className="min-w-0 flex-[0.7]">
                                  <Eyebrow className="mb-[5px] uppercase">{t('reservations.meta.seat')}</Eyebrow>
                                  <input type="text" value={wp.seat} onChange={e => updateWp({ seat: e.target.value })} placeholder="42A" className={FIELD_CLS} />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {!isLast && (
                          <button
                            type="button"
                            onClick={() => setTrainWaypoints(prev => [...prev.slice(0, i + 1), emptyStationWaypoint(prev[i]?.depDayId || ''), ...prev.slice(i + 1)])}
                            className="flex w-full items-center justify-center gap-[5px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-rowbr)] py-2 font-geist text-[0.6875rem] font-semibold text-m-muted"
                          >
                            <Plus size={12} strokeWidth={2.2} /> {t('reservations.layover.addStop')}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                {/* From / To endpoints (non-flight / non-train) */}
                <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.meta.from')}</Eyebrow>
                <LocationSelect value={fromPick.location || null} onChange={l => setFromPick({ location: l || undefined })} />
                <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.meta.to')}</Eyebrow>
                <LocationSelect value={toPick.location || null} onChange={l => setToPick({ location: l || undefined })} />

                {/* Departure row */}
                <div className="mt-3 flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Eyebrow className="mb-[5px] uppercase">{form.type === 'car' ? t('reservations.pickupDate') : t('reservations.date')}</Eyebrow>
                    <CustomSelect value={form.start_day_id} onChange={v => set('start_day_id', v)} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Eyebrow className="mb-[5px] uppercase">{form.type === 'car' ? t('reservations.pickupTime') : t('reservations.startTime')}</Eyebrow>
                    <CustomTimePicker value={form.departure_time} onChange={v => set('departure_time', v)} />
                  </div>
                </div>

                {/* Arrival row */}
                <div className="mt-2 flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Eyebrow className="mb-[5px] uppercase">{form.type === 'car' ? t('reservations.returnDate') : t('reservations.endDate')}</Eyebrow>
                    <CustomSelect value={form.end_day_id} onChange={v => set('end_day_id', v)} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Eyebrow className="mb-[5px] uppercase">{form.type === 'car' ? t('reservations.returnTime') : t('reservations.endTime')}</Eyebrow>
                    <CustomTimePicker value={form.arrival_time} onChange={v => set('arrival_time', v)} />
                  </div>
                </div>
              </>
            )}

            {/* BOOKING CODE + STATUS */}
            <div className="mt-3 flex gap-2">
              <div className="min-w-0 flex-1">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.confirmationCode')}</Eyebrow>
                <input
                  type="text"
                  value={form.confirmation_number}
                  onChange={e => set('confirmation_number', e.target.value)}
                  placeholder={t('reservations.confirmationPlaceholder')}
                  className={FIELD_CLS}
                />
              </div>
              <div className="min-w-0 flex-1">
                <Eyebrow className="mb-[5px] uppercase">{t('reservations.status')}</Eyebrow>
                <div className="flex rounded-full bg-[color:var(--m-ic)] p-[3px]">
                  {(['pending', 'confirmed'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('status', s)}
                      className={`flex-1 rounded-full py-[7px] text-[0.71875rem] font-semibold ${
                        form.status === s ? 'bg-m-act text-m-actfg' : 'text-m-muted'
                      }`}
                    >
                      {t(`reservations.${s}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* NOTES */}
            <Eyebrow className="mb-[5px] mt-3 uppercase">{t('reservations.notes')}</Eyebrow>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder={t('reservations.notesPlaceholder')}
              className={FIELD_AREA_CLS}
            />

            {/* FILES */}
            {canUploadFiles && (
              <PlFileAttach
                planner={planner}
                files={pendingFiles}
                onAdd={files => setPendingFiles(prev => [...prev, ...files])}
                onRemove={idx => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                hideHint
              />
            )}

            {/* COSTS */}
            {isBudgetEnabled && (
              <>
                <Eyebrow className="mb-[6px] mt-3 uppercase">{t('reservations.costsLabel')}</Eyebrow>
                <button
                  type="button"
                  onClick={() => { expenseIntentRef.current = true; handleSubmit() }}
                  disabled={!form.title.trim() || isSaving}
                  className="flex w-full items-center justify-center gap-[6px] rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] py-[11px] text-[0.78125rem] font-semibold text-m-ink disabled:opacity-40"
                >
                  <Plus size={13} strokeWidth={2.2} />
                  {t('reservations.createExpense')}
                </button>
                <div className="mt-[5px] font-geist text-[0.625rem] text-m-faint">{t('reservations.createExpenseHint')}</div>
              </>
            )}
          </>
        )}
      </div>

      {automated ? (
        <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
          <button
            type="button"
            onClick={handleClose}
            className="ml-auto rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 py-[9px] text-[0.78125rem] font-semibold text-m-ink"
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <FormSheetFooter
          onDelete={res ? handleDelete : undefined}
          deleteLabel={t('common.delete')}
          deleteArmed={deleteArmed}
          onCancel={handleClose}
          cancelLabel={t('common.cancel')}
          onSubmit={handleSubmit}
          submitLabel={isSaving ? t('common.saving') : res ? t('common.update') : t('common.add')}
          submitDisabled={!form.title.trim() || isSaving}
        />
      )}
    </MSheet>
  )
}
