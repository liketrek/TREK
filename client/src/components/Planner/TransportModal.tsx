import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { Plane, Train, Car, Ship, Bus, Sailboat, CableCar, Bike, CarTaxiFront, Route, X, Trash2, ChevronUp, ChevronDown, CalendarDays, type LucideIcon } from 'lucide-react'
import ConfirmDialog from '../shared/ConfirmDialog'
import CustomSelect from '../shared/CustomSelect'
import { BookingCodeInput } from '../shared/BookingCode'
import CustomTimePicker from '../shared/CustomTimePicker'
import { Tooltip } from '../shared/Tooltip'
import AirportSelect, { type Airport } from './AirportSelect'
import LocationSelect, { type LocationPoint } from './LocationSelect'
import { toLocationPicks } from './locationPicks'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useTripStore } from '../../store/tripStore'
import { useAddonStore } from '../../store/addonStore'
import { formatDate, splitReservationDateTime, resolveDayId } from '../../utils/formatters'
import type { Day, Place, Accommodation, Reservation, ReservationEndpoint, TripFile, BudgetItem, AssignmentsMap } from '../../types'
import { parseReservationMetadata, orderedEndpoints, stripAirportCode, usesStationRoute } from '../../utils/flightLegs'
import { BookingCostsSection } from './BookingCostsSection'
import { BookingLinkAndFiles } from './BookingLinkAndFiles'
import { importedPriceEntry } from './importedPrice'
import { TravelerPicker } from './TravelerPicker'
import type { TripMember } from '../Budget/BudgetPanelMemberChips'
import type { BookingExpenseRequest } from './BookingCostsSection.types'
import type { BookingReviewDraft } from './parsedItemToDraft'
import TransitSearchPanel, { type PickedPlace } from './TransitSearchPanel'
import { BookingDialogHeader, StatusPill } from './bookings/BookingDialogShell'
import { DialogShell, DialogSection, DialogFooter, FooterSpacer, DialogButton, DeleteButton } from '../shared/DialogShell'
import { INPUT, TEXTAREA, READONLY_BOX, LABEL, GRID_2, GRID_3, PANEL, SEARCH_ON_PANEL, EditorField, Segmented, PillSelect, AddRowButton } from '../shared/dialogParts'
import { fs, Eyebrow, type StatusTone } from './bookings/bookingParts'
import { typeInfo } from './bookings/bookingsModel'
import { typeToCostCategory } from '@trek/shared'

const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'cable_car', 'transit', 'transport_other'] as const
type TransportType = typeof TRANSPORT_TYPES[number]

interface EndpointPick {
  airport?: Airport
  location?: LocationPoint
}

function endpointFromAirport(a: Airport, role: 'from' | 'to' | 'stop', sequence: number, date: string | null, time: string | null): Omit<ReservationEndpoint, 'id' | 'reservation_id'> {
  return {
    role, sequence,
    name: a.city ? `${a.city} (${a.iata})` : a.name,
    code: a.iata,
    lat: a.lat, lng: a.lng,
    timezone: a.tz,
    local_date: date,
    local_time: time,
  }
}

function endpointFromLocation(l: LocationPoint, role: 'from' | 'to' | 'stop', sequence: number, date: string | null, time: string | null): Omit<ReservationEndpoint, 'id' | 'reservation_id'> {
  return {
    role, sequence,
    name: l.name,
    code: null,
    lat: l.lat, lng: l.lng,
    timezone: null,
    local_date: date,
    local_time: time,
  }
}

function airportFromEndpoint(e: ReservationEndpoint | undefined): Airport | null {
  if (!e || !e.code) return null
  return {
    iata: e.code, icao: null,
    name: e.name, city: stripAirportCode(e.name),
    country: '',
    lat: e.lat, lng: e.lng,
    tz: e.timezone || '',
  }
}

function locationFromEndpoint(e: ReservationEndpoint | undefined): LocationPoint | null {
  if (!e) return null
  return { name: e.name, lat: e.lat, lng: e.lng, address: null }
}

// ── Multi-leg flight waypoints ─────────────────────────────────────────────
// A flight is an ordered list of airports. The origin has only a departure, the
// destination only an arrival, and each intermediate stop has both — plus the
// airline/flight number of the flight LEAVING it. N waypoints = N-1 legs. A
// single-leg flight is just two waypoints, so it persists exactly as before.
interface WaypointForm {
  airport: Airport | null
  arrDayId: string | number
  arrTime: string
  depDayId: string | number
  depTime: string
  airline: string
  flight_number: string
  seat: string
  // Booking reference of the leg leaving this waypoint: airlines often issue one
  // per flight rather than one per booking (#1943). Empty means the booking's own.
  confirmation_number: string
}
function emptyWaypoint(dayId: string | number = ''): WaypointForm {
  return { airport: null, arrDayId: dayId, arrTime: '', depDayId: dayId, depTime: '', airline: '', flight_number: '', seat: '', confirmation_number: '' }
}

// ── Multi-leg train stations ───────────────────────────────────────────────
// A train mirrors the flight route model, but its waypoints are STATIONS
// (location search, no timezone) and each leg carries a train number + platform
// instead of an airline + flight number. N stations = N-1 legs.
interface StationWaypointForm {
  location: LocationPoint | null
  arrDayId: string | number
  arrTime: string
  depDayId: string | number
  depTime: string
  train_number: string
  platform: string
  seat: string
  confirmation_number: string
}
// ── Car stops along the drive ──────────────────────────────────────────────
//
// A rental is one booking with one pick-up and one return, so — unlike a flight or a
// train — the stops in between are not legs of their own: they are places the drive
// passes through, each with an optional time the driver plans to be there. They persist
// as the same `role: 'stop'` endpoints every other transport type already uses.
interface CarStopForm {
  location: LocationPoint | null
  time: string
}

const emptyCarStop = (): CarStopForm => ({ location: null, time: '' })

function emptyStationWaypoint(dayId: string | number = ''): StationWaypointForm {
  return { location: null, arrDayId: dayId, arrTime: '', depDayId: dayId, depTime: '', train_number: '', platform: '', seat: '', confirmation_number: '' }
}

const TYPE_OPTIONS: { value: TransportType; labelKey: string; Icon: LucideIcon }[] = [
  { value: 'flight',          labelKey: 'reservations.type.flight',          Icon: Plane },
  { value: 'train',           labelKey: 'reservations.type.train',           Icon: Train },
  { value: 'bus',             labelKey: 'reservations.type.bus',             Icon: Bus },
  { value: 'car',             labelKey: 'reservations.type.car',             Icon: Car },
  { value: 'taxi',            labelKey: 'reservations.type.taxi',            Icon: CarTaxiFront },
  { value: 'bicycle',         labelKey: 'reservations.type.bicycle',         Icon: Bike },
  { value: 'cruise',          labelKey: 'reservations.type.cruise',          Icon: Ship },
  { value: 'ferry',           labelKey: 'reservations.type.ferry',           Icon: Sailboat },
  { value: 'cable_car',       labelKey: 'reservations.type.cable_car',       Icon: CableCar },
  { value: 'transport_other', labelKey: 'reservations.type.transport_other', Icon: Route },
]

const defaultForm = {
  title: '',
  type: 'flight' as TransportType,
  status: 'pending' as 'pending' | 'confirmed',
  start_day_id: '' as string | number,
  end_day_id: '' as string | number,
  departure_time: '',
  arrival_time: '',
  confirmation_number: '',
  notes: '',
  url: '',
  meta_airline: '',
  meta_flight_number: '',
  meta_train_number: '',
  meta_platform: '',
  meta_seat: '',
}

interface TransportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Record<string, any> & { title: string }) => Promise<Reservation | undefined>
  reservation: Reservation | null
  days: Day[]
  selectedDayId: number | null
  files?: TripFile[]
  onFileUpload?: (fd: FormData) => Promise<unknown>
  onFileDelete?: (fileId: number) => Promise<void>
  /** Deletes the reservation being edited. Omit to hide the delete action (create mode, or no permission). */
  onDelete?: () => void | Promise<void>
  onOpenExpense?: (req: BookingExpenseRequest) => void
  // Pre-fill a brand-new transport booking from a parsed import item (review-
  // before-save); like `reservation` for the form but stays in create mode.
  prefill?: BookingReviewDraft | null
  /** Data for the Automated (public transit) mode's quick picks. */
  places?: Place[]
  /** Day→assignments map, used to scope the quick picks to the chosen day (#1460). */
  assignments?: AssignmentsMap
  accommodations?: Accommodation[]
  /** Open directly in the Automated public-transit mode (day-header tram button, "change route"). */
  initialAutomated?: boolean
  /** Transit search needs real dates to depart on, so the Automated mode is hidden on a dateless trip. */
  tripHasDates?: boolean
  /** Pre-seed the transit search — used by "change route" and by per-leg planning. */
  transitPrefill?: { from?: PickedPlace | null; to?: PickedPlace | null; time?: string | null } | null
  /** Trip members + guests, for the traveler picker (#1517). */
  tripMembers?: TripMember[]
}

export function TransportModal({ isOpen, onClose, onSave, reservation, days, selectedDayId, files = [], onFileUpload, onFileDelete, onDelete, onOpenExpense, prefill = null, places = [], assignments = {}, accommodations = [], initialAutomated = false, transitPrefill = null, tripHasDates = true, tripMembers = [] }: TransportModalProps) {
  const { t, locale } = useTranslation()
  const toast = useToast()
  // The trip's places, offered by every location field of the manual tab (#2468).
  const locationPicks = useMemo(() => toLocationPicks(places), [places])
  const isBudgetEnabled = useAddonStore(s => s.isEnabled('budget'))
  const budgetItems = useTripStore(s => s.budgetItems)
  const deleteBudgetItem = useTripStore(s => s.deleteBudgetItem)
  const setReservationTravelers = useTripStore(s => s.setReservationTravelers)
  const { id: tripId } = useParams<{ id: string }>()
  // Set right before submitting when the user clicked "create/edit expense", so
  // the post-save handler knows to open the Costs editor for the saved booking.
  const expenseIntentRef = useRef<{ editItem?: BudgetItem; create?: boolean } | null>(null)
  const [form, setForm] = useState({ ...defaultForm })
  // Trains and cruises share the station form: a row of stops, each with its own
  // arrival and departure (#1807).
  const stationRoute = usesStationRoute(form.type)
  // Manual vs Automated (public transit search) creation mode (#1065).
  const [automated, setAutomated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [fromPick, setFromPick] = useState<EndpointPick>({})
  const [toPick, setToPick] = useState<EndpointPick>({})
  // Flight route as an ordered list of airports (origin .. stops .. destination).
  const [waypoints, setWaypoints] = useState<WaypointForm[]>([emptyWaypoint(), emptyWaypoint()])
  // Train route as an ordered list of stations (origin .. stops .. destination).
  const [trainWaypoints, setTrainWaypoints] = useState<StationWaypointForm[]>([emptyStationWaypoint(), emptyStationWaypoint()])
  // A car keeps its pick-up and return as the frame of the rental and gains the stops
  // in between (#1797): one booking, one continuous drive, several places along it.
  const [carStops, setCarStops] = useState<CarStopForm[]>([])

  /** Swaps a stop with its neighbour. Purely local: `sequence` is derived on save. */
  const moveCarStop = (index: number, delta: number): void => {
    setCarStops(prev => {
      const to = index + delta
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[to]] = [next[to], next[index]]
      return next
    })
  }
  const [uploadingFile, setUploadingFile] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [linkedFileIds, setLinkedFileIds] = useState<number[]>([])
  // Travelers assigned to this booking (#1517) — seeded on open, persisted after save.
  const [travelerIds, setTravelerIds] = useState<Set<number>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setTravelerIds(new Set((reservation?.travelers || []).map(tv => tv.user_id)))
    // Edit uses the saved `reservation`; a review-import populates from `prefill`.
    // Either way the init reads the same fields — `reservation` still decides
    // edit-vs-create at submit time.
    const src = (reservation ?? prefill) as Reservation | null
    if (src) setAutomated(initialAutomated)
    // On a review-import, seed the booking's Files with the parsed source document.
    setPendingFiles(!reservation && prefill?._sourceFiles ? prefill._sourceFiles : [])
    if (src) {
      const meta = typeof src.metadata === 'string'
        ? JSON.parse(src.metadata || '{}')
        : (src.metadata || {})
      const eps = src.endpoints || []
      const from = eps.find(e => e.role === 'from')
      const to = eps.find(e => e.role === 'to')
      // 'transport_other', not 'flight': an import whose type could not be read has
      // to arrive as something the user corrects, and a wrong flight looks right
      // enough to be saved unnoticed (#2076).
      const type = (TRANSPORT_TYPES as readonly string[]).includes(src.type)
        ? src.type as TransportType
        : 'transport_other'
      setForm({
        title: src.title || '',
        type,
        status: src.status === 'confirmed' ? 'confirmed' : 'pending',
        // For an edit, keep the saved day; for an imported prefill (no day_id), resolve it
        // from the parsed pick-up/return date so the date isn't lost on save.
        start_day_id: src.day_id ?? resolveDayId(days, splitReservationDateTime(src.reservation_time).date),
        end_day_id: src.end_day_id ?? resolveDayId(days, splitReservationDateTime(src.reservation_end_time).date),
        departure_time: splitReservationDateTime(src.reservation_time).time ?? '',
        arrival_time: splitReservationDateTime(src.reservation_end_time).time ?? '',
        confirmation_number: src.confirmation_number || '',
        notes: src.notes || '',
        url: src.url || '',
        meta_airline: meta.airline || '',
        meta_flight_number: meta.flight_number || '',
        meta_train_number: meta.train_number || '',
        meta_platform: meta.platform || '',
        meta_seat: meta.seat || '',
      })
      // Only an import prefill carries a per-endpoint local_date without a day_id. On an
      // edit the saved day wins: local_date is denormalised and can lag behind after a
      // day drag, insertDay or a trip-date shift, so resolving from it would silently
      // move the booking to another day on a plain re-save.
      const endpointDayId = (ep?: { local_date?: string | null } | null) =>
        reservation ? '' : resolveDayId(days, ep?.local_date)

      if (type === 'flight') {
        const orderedEps = orderedEndpoints(src)
        const metaLegs: any[] = Array.isArray(meta.legs) ? meta.legs : []
        let wps: WaypointForm[]
        if (orderedEps.length >= 2) {
          wps = orderedEps.map((ep, i) => {
            const legInto = metaLegs[i - 1] // leg arriving INTO waypoint i
            const legOut = metaLegs[i] // leg departing FROM waypoint i
            const isFirst = i === 0
            const isLast = i === orderedEps.length - 1
            return {
              airport: airportFromEndpoint(ep),
              // An import prefill gives each endpoint its own local_date but no day_id, so
              // resolve the day from that date — otherwise the review's per-leg day
              // selectors render empty even though the time, read from the same
              // endpoint, is filled.
              arrDayId: legInto?.arr_day_id ?? (endpointDayId(ep) || (isLast ? (src.end_day_id ?? '') : '')),
              arrTime: legInto?.arr_time ?? (!isFirst ? (ep.local_time ?? '') : ''),
              depDayId: legOut?.dep_day_id ?? (endpointDayId(ep) || (isFirst ? (src.day_id ?? '') : '')),
              depTime: legOut?.dep_time ?? (!isLast ? (ep.local_time ?? '') : ''),
              airline: legOut?.airline ?? (isFirst ? (meta.airline ?? '') : ''),
              flight_number: legOut?.flight_number ?? (isFirst ? (meta.flight_number ?? '') : ''),
              seat: legOut?.seat ?? (isFirst ? (meta.seat ?? '') : ''),
              // No fallback to src.confirmation_number: that one belongs to the
              // whole booking and stays in the form's own field, otherwise a
              // plain re-save would copy it onto the first leg.
              confirmation_number: legOut?.confirmation_number ?? '',
            }
          })
        } else {
          // Legacy flight with no (or partial) endpoints — seed two waypoints.
          const dep = emptyWaypoint(endpointDayId(from) || (src.day_id ?? ''))
          dep.airport = airportFromEndpoint(from)
          dep.depTime = splitReservationDateTime(src.reservation_time).time ?? ''
          dep.airline = meta.airline ?? ''
          dep.flight_number = meta.flight_number ?? ''
          dep.seat = meta.seat ?? ''
          const arr = emptyWaypoint(endpointDayId(to) || (src.end_day_id ?? src.day_id ?? ''))
          arr.airport = airportFromEndpoint(to)
          arr.arrTime = splitReservationDateTime(src.reservation_end_time).time ?? ''
          wps = [dep, arr]
        }
        setWaypoints(wps)
      } else if (usesStationRoute(type)) {
        // Mirror the flight seeding with stations + per-leg train fields. A
        // current single-leg train (2 endpoints, no metadata.legs) round-trips
        // through the >=2 branch: the flat train_number/platform/seat land on
        // the first station, dep/arr day+time from src.day_id/end_day_id.
        const orderedEps = orderedEndpoints(src)
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
              // See the flight branch: resolve each station's day from its endpoint local_date
              // so an import prefill doesn't leave the per-leg day selectors empty.
              arrDayId: legInto?.arr_day_id ?? (endpointDayId(ep) || (isLast ? (src.end_day_id ?? '') : '')),
              arrTime: legInto?.arr_time ?? (!isFirst ? (ep.local_time ?? '') : ''),
              depDayId: legOut?.dep_day_id ?? (endpointDayId(ep) || (isFirst ? (src.day_id ?? '') : '')),
              depTime: legOut?.dep_time ?? (!isLast ? (ep.local_time ?? '') : ''),
              train_number: legOut?.train_number ?? (isFirst ? (meta.train_number ?? '') : ''),
              platform: legOut?.platform ?? (isFirst ? (meta.platform ?? '') : ''),
              seat: legOut?.seat ?? (isFirst ? (meta.seat ?? '') : ''),
              // See the flight branch: the booking's own reference stays out of the legs.
              confirmation_number: legOut?.confirmation_number ?? '',
            }
          })
        } else {
          const dep = emptyStationWaypoint(endpointDayId(from) || (src.day_id ?? ''))
          dep.location = locationFromEndpoint(from)
          dep.depTime = splitReservationDateTime(src.reservation_time).time ?? ''
          dep.train_number = meta.train_number ?? ''
          dep.platform = meta.platform ?? ''
          dep.seat = meta.seat ?? ''
          const arr = emptyStationWaypoint(endpointDayId(to) || (src.end_day_id ?? src.day_id ?? ''))
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
        // Stops persist for every type; only a car offers an editor for them, so only a
        // car reads them back into one. The others keep passing theirs through untouched.
        setCarStops(
          src.type === 'car'
            ? (src.endpoints ?? [])
                .filter(e => e.role === 'stop')
                .slice()
                .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                .map(e => ({ location: locationFromEndpoint(e), time: e.local_time ?? '' }))
            : [],
        )
      }
    } else {
      setForm({ ...defaultForm, start_day_id: selectedDayId ?? '', end_day_id: selectedDayId ?? '' })
      setAutomated(initialAutomated)
      setFromPick({})
      setToPick({})
      setWaypoints([emptyWaypoint(selectedDayId ?? ''), emptyWaypoint(selectedDayId ?? '')])
      setTrainWaypoints([emptyStationWaypoint(selectedDayId ?? ''), emptyStationWaypoint(selectedDayId ?? '')])
      setCarStops([])
    }
  }, [isOpen, reservation, prefill, selectedDayId, budgetItems])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleTraveler = (id: number) => setTravelerIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!form.title.trim()) return
    setIsSaving(true)
    try {
      const startDay = days.find(d => d.id === Number(form.start_day_id))
      const endDay = days.find(d => d.id === Number(form.end_day_id))

      const buildTime = (day: Day | undefined, time: string): string | null => {
        if (!time) return null
        return day?.date ? `${day.date}T${time}` : time
      }

      const dayDate = (id: string | number): string | null => days.find(d => d.id === Number(id))?.date ?? null
      // Flight route as an ordered list of airports (origin .. stops .. destination).
      const flightWps = form.type === 'flight' ? waypoints.filter(w => w.airport) : []
      const firstWp = flightWps[0]
      const lastWp = flightWps[flightWps.length - 1]
      // Train route: the first/last waypoint drive the span + flat metadata
      // (day/time/train number are entered independently of geocoding, exactly
      // like the old form fields, so a train with no map-picked station still
      // saves its day/time/train number). Only geocoded stations become map
      // endpoints + legs, mirroring the old "push only if the location is set".
      const trainWps = stationRoute ? trainWaypoints : []
      const firstTrainWp = trainWps[0]
      const lastTrainWp = trainWps[trainWps.length - 1]
      const trainStations = stationRoute ? trainWaypoints.filter(w => w.location) : []
      // Per-leg day-plan positions are owned by the day planner, not this form — keep
      // them when re-saving so editing a flight doesn't reset where its legs sit.
      const origLegs: any[] = reservation ? (parseReservationMetadata(reservation).legs || []) : []

      const metadata: Record<string, any> = {}
      if (form.type === 'flight') {
        // Top-level keys mirror the first/last leg so legacy readers keep working.
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
        // Per-leg detail only for true multi-leg flights — a single-leg flight
        // keeps the exact same (flat) metadata it had before this feature.
        if (flightWps.length > 2) {
          metadata.legs = flightWps.slice(0, -1).map((w, i) => {
            const next = flightWps[i + 1]
            return {
              from: w.airport!.iata,
              to: next.airport!.iata,
              ...(w.airline ? { airline: w.airline } : {}),
              ...(w.flight_number ? { flight_number: w.flight_number } : {}),
              ...(w.seat ? { seat: w.seat } : {}),
              ...(w.confirmation_number ? { confirmation_number: w.confirmation_number } : {}),
              dep_day_id: w.depDayId ? Number(w.depDayId) : null,
              dep_time: w.depTime || null,
              arr_day_id: next.arrDayId ? Number(next.arrDayId) : null,
              arr_time: next.arrTime || null,
              ...(origLegs[i]?.day_positions ? { day_positions: origLegs[i].day_positions } : {}),
            }
          })
        }
        if (firstWp?.seat) metadata.seat = firstWp.seat
      } else if (stationRoute) {
        // Flat keys mirror the first leg so legacy readers keep working; a
        // 2-station train emits exactly {train_number?,platform?,seat?} — the
        // same shape it saved before this feature.
        if (firstTrainWp?.train_number) metadata.train_number = firstTrainWp.train_number
        if (firstTrainWp?.platform) metadata.platform = firstTrainWp.platform
        if (firstTrainWp?.seat) metadata.seat = firstTrainWp.seat
        // Per-leg detail only for a true multi-leg train (>2 geocoded stations);
        // a simple train keeps the same flat metadata it saved before.
        if (trainStations.length > 2) {
          metadata.legs = trainStations.slice(0, -1).map((w, i) => {
            const next = trainStations[i + 1]
            return {
              from: w.location!.name,
              to: next.location!.name,
              ...(w.train_number ? { train_number: w.train_number } : {}),
              ...(w.platform ? { platform: w.platform } : {}),
              ...(w.seat ? { seat: w.seat } : {}),
              ...(w.confirmation_number ? { confirmation_number: w.confirmation_number } : {}),
              dep_day_id: w.depDayId ? Number(w.depDayId) : null,
              dep_time: w.depTime || null,
              arr_day_id: next.arrDayId ? Number(next.arrDayId) : null,
              arr_time: next.arrTime || null,
              ...(origLegs[i]?.day_positions ? { day_positions: origLegs[i].day_positions } : {}),
            }
          })
        }
      }

      // A transit itinerary (#1065) lives in metadata.transit + 'stop' endpoints,
      // neither of which this form shows or edits — so re-saving must not wipe
      // them. They're kept only while from/to are unchanged: picking a different
      // origin or destination invalidates the stored connection.
      const prevMeta = reservation ? parseReservationMetadata(reservation) : {}
      const prevEndpointsAll = reservation?.endpoints || []
      const prevFrom = prevEndpointsAll.find(ep => ep.role === 'from')
      const prevTo = prevEndpointsAll.find(ep => ep.role === 'to')
      const near = (a?: number | null, b?: number | null) => a != null && b != null && Math.abs(a - b) < 1e-6
      const keepTransit = !!(prevMeta.transit && form.type !== 'flight' &&
        prevFrom && prevTo && fromPick.location && toPick.location &&
        near(prevFrom.lat, fromPick.location.lat) && near(prevFrom.lng, fromPick.location.lng) &&
        near(prevTo.lat, toPick.location.lat) && near(prevTo.lng, toPick.location.lng))
      if (keepTransit) metadata.transit = prevMeta.transit
      // A joined AirTrail import (#1535) records every source flight id in
      // metadata.airtrail_ids so the picker doesn't offer those legs again —
      // an edit in this form must not drop that linkage.
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
      } else if (stationRoute) {
        trainStations.forEach((w, i) => {
          const isFirst = i === 0
          const isLast = i === trainStations.length - 1
          const role: 'from' | 'to' | 'stop' = isFirst ? 'from' : isLast ? 'to' : 'stop'
          const dId = isLast ? w.arrDayId : w.depDayId
          const time = isLast ? w.arrTime : w.depTime
          // The destination date falls back to the departure day (as the old flat
          // path did via `endDay ?? startDay`) when the arrival day is left blank.
          const date = dayDate(dId) ?? (isLast ? dayDate(firstTrainWp?.depDayId ?? '') : null)
          endpoints.push(endpointFromLocation(w.location!, role, i, date, time || null))
        })
      } else {
        if (fromPick.location) endpoints.push(endpointFromLocation(fromPick.location, 'from', 0, startDate, form.departure_time || null))
        // A car writes the stops the driver planned; every other type keeps passing the
        // itinerary's transfer stops through while the route is unchanged (#1065).
        const carEndpoints = form.type === 'car'
          ? carStops
              .filter(s => s.location)
              .map((s, i) => endpointFromLocation(s.location!, 'stop', i + 1, startDate, s.time || null))
          : []
        const stops = keepTransit && form.type !== 'car'
          ? prevEndpointsAll.filter(ep => ep.role === 'stop').slice().sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
          : []
        stops.forEach((s, i) => endpoints.push({
          role: 'stop', sequence: i + 1, name: s.name, code: s.code ?? null,
          lat: s.lat, lng: s.lng, timezone: s.timezone ?? null,
          local_date: s.local_date ?? null, local_time: s.local_time ?? null,
        }))
        carEndpoints.forEach(e => endpoints.push(e))
        const stopCount = stops.length + carEndpoints.length
        if (toPick.location) endpoints.push(endpointFromLocation(toPick.location, 'to', stopCount + 1, endDate, form.arrival_time || null))
      }

      // Flights and trains derive their span from the first/last waypoint; other
      // transports keep using the single departure/arrival form fields unchanged.
      const flightDepDay = firstWp && firstWp.depDayId ? Number(firstWp.depDayId) : null
      const flightArrDay = lastWp && lastWp.arrDayId ? Number(lastWp.arrDayId) : null
      const trainDepDay = firstTrainWp && firstTrainWp.depDayId ? Number(firstTrainWp.depDayId) : null
      const trainArrDay = lastTrainWp && lastTrainWp.arrDayId ? Number(lastTrainWp.arrDayId) : null
      const payload = {
        title: form.title,
        type: form.type,
        status: form.status,
        day_id: form.type === 'flight' ? flightDepDay : stationRoute ? trainDepDay : (form.start_day_id ? Number(form.start_day_id) : null),
        end_day_id: form.type === 'flight' ? flightArrDay : stationRoute ? trainArrDay : (form.end_day_id ? Number(form.end_day_id) : null),
        reservation_time: form.type === 'flight'
          ? buildTime(days.find(d => d.id === flightDepDay), firstWp?.depTime || '')
          : stationRoute
            ? buildTime(days.find(d => d.id === trainDepDay), firstTrainWp?.depTime || '')
            : buildTime(startDay, form.departure_time),
        reservation_end_time: form.type === 'flight'
          ? buildTime(days.find(d => d.id === flightArrDay), lastWp?.arrTime || '')
          : stationRoute
            // Fall back to the departure day so a same-day train (arrival day left
            // blank) still gets its date, matching the non-flight `endDay ?? startDay`.
            ? buildTime(days.find(d => d.id === trainArrDay) ?? days.find(d => d.id === trainDepDay), lastTrainWp?.arrTime || '')
            : buildTime(endDay ?? startDay, form.arrival_time),
        location: null,
        confirmation_number: form.confirmation_number || null,
        notes: form.notes || null,
        url: form.url || null,
        // An empty object, not null: null clears the column outright, and that
        // took the mirrored booking price with it on every edit of a type that
        // fills no metadata of its own — restaurant, event, tour, parking, other,
        // a hotel without check-in times (#2233). An object still clears what the
        // form dropped, and lets the server carry the price across.
        metadata,
        endpoints,
        needs_review: false,
      }
      // Imported booking → auto-create the linked cost from the parsed price (what the
      // old direct import did). Only on create (not edit) and only when there's a price.
      if (!reservation && prefill && isBudgetEnabled) {
        const entry = importedPriceEntry(prefill.metadata, form.type)
        if (entry) (payload as Record<string, unknown>).create_budget_entry = entry
      }
      const saved = await onSave(payload)
      // Persist the traveler assignment once we have the reservation id (create → save
      // result, edit → existing reservation), and only when it actually changed (#1517).
      const savedId = saved?.id ?? reservation?.id
      if (savedId && tripId) {
        const original = (reservation?.travelers || []).map(tv => tv.user_id)
        const nextIds = [...travelerIds]
        const changed = original.length !== nextIds.length || nextIds.some(id => !original.includes(id))
        if (changed) {
          try { await setReservationTravelers(tripId, savedId, nextIds) } catch { toast.error(t('common.unknownError')) }
        }
      }
      if (!reservation?.id && saved?.id && pendingFiles.length > 0 && onFileUpload) {
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('reservation_id', String(saved.id))
          fd.append('description', form.title)
          await onFileUpload(fd)
        }
      }
      // The user asked to create/edit the linked expense — open the Costs editor
      // for the now-saved booking. Gated on saved?.id so a failed save doesn't.
      const intent = expenseIntentRef.current
      expenseIntentRef.current = null
      if (intent && onOpenExpense && saved?.id) {
        if (intent.editItem) onOpenExpense({ editItem: intent.editItem })
        else onOpenExpense({ prefill: { reservationId: saved.id, name: form.title, category: typeToCostCategory(form.type) } })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateExpense = () => { expenseIntentRef.current = { create: true }; void handleSubmit() }
  const handleEditExpense = (item: BudgetItem) => { expenseIntentRef.current = { editItem: item }; void handleSubmit() }
  const handleRemoveExpense = async (item: BudgetItem) => {
    try { await deleteBudgetItem(Number(tripId), item.id) } catch { toast.error(t('common.unknownError')) }
  }

  // On an import review (not yet saved), preview the parsed price as the cost that will be
  // linked: the same entry the save sends, so the two cannot name different currencies.
  const importedEntry = !reservation && prefill ? importedPriceEntry(prefill.metadata, form.type) : null
  const pendingExpense = importedEntry ? { ...importedEntry, currency: importedEntry.currency ?? null } : null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (reservation?.id) {
      setUploadingFile(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('reservation_id', String(reservation.id))
        fd.append('description', reservation.title)
        await onFileUpload!(fd)
        toast.success(t('reservations.toast.fileUploaded'))
      } catch {
        toast.error(t('reservations.toast.uploadError'))
      } finally {
        setUploadingFile(false)
        e.target.value = ''
      }
    } else {
      setPendingFiles(prev => [...prev, file])
      e.target.value = ''
    }
  }

  const attachedFiles = reservation?.id
    ? files.filter(f =>
        f.reservation_id === reservation.id ||
        linkedFileIds.includes(f.id) ||
        (f.linked_reservation_ids && f.linked_reservation_ids.includes(reservation.id))
      )
    : []

  const dayOptions = [
    { value: '', label: '—' },
    ...days.map(d => {
      const dateBadge = d.date ? (formatDate(d.date, locale) ?? undefined) : undefined
      const dayBadge = d.title ? t('dayplan.dayN', { n: d.day_number }) : undefined
      return {
        value: d.id,
        label: d.title || t('dayplan.dayN', { n: d.day_number }),
        badge: dateBadge ?? dayBadge,
      }
    }),
  ]

  // The per-leg booking code is only offered where handleSubmit actually writes
  // metadata.legs: the SAME condition, over the waypoints that become endpoints,
  // not over the raw rows. Anywhere else the value would vanish on save (#1943).
  const writesFlightLegs = waypoints.filter(w => w.airport).length > 2
  const writesTrainLegs = trainWaypoints.filter(w => w.location).length > 2

  const titleId = 'transport-editor-title'
  // The head band takes the colour of the card the booking will sit on.
  const tone: StatusTone = automated || form.type === 'transit' ? 'transit' : form.status
  const isCar = form.type === 'car'
  const routeNames = (form.type === 'flight'
    ? waypoints.map(w => w.airport?.iata)
    : stationRoute
      ? trainWaypoints.map(w => w.location?.name)
      : [fromPick.location?.name, ...(isCar ? carStops.map(s => s.location?.name) : []), toPick.location?.name]
  ).filter(Boolean)
  const shownType = typeInfo(form.type)

  const dayField = (label: string, value: string | number, onChange: (value: string | number) => void) => (
    <EditorField label={label}>
      <CustomSelect value={value} onChange={onChange} placeholder={t('dayplan.dayN', { n: '?' })} options={dayOptions} size="sm" />
    </EditorField>
  )
  const timeField = (label: string, value: string, onChange: (value: string) => void) => (
    <EditorField label={label}>
      <CustomTimePicker value={value} onChange={onChange} />
    </EditorField>
  )
  const zoneField = (label: string, tz: string) => (
    <EditorField label={label}>
      <Tooltip label={tz}>
        <div className={READONLY_BOX}>{tz || ' '}</div>
      </Tooltip>
    </EditorField>
  )

  // Manual vs Automated creation (#1065), only while creating: a journey is
  // edited again through "change route" with the switch hidden. A trip without
  // dates has no day to depart on, so it gets the manual form alone. The switch
  // sits in the head band, which stays put while the body swaps modes.
  const modeSwitch = !reservation && tripHasDates && (
    <span className="ml-auto">
      <Segmented
        label={`${t('transport.modeManual')} / ${t('transport.modeAutomated')}`}
        value={automated ? 'automated' : 'manual'}
        onChange={mode => setAutomated(mode === 'automated')}
        options={[
          { value: 'manual', label: t('transport.modeManual') },
          { value: 'automated', label: t('transport.modeAutomated') },
        ]}
      />
    </span>
  )

  // Until there is a title, the line under it says the field is required:
  // Add stays greyed out without one, and a disabled button cannot say why.
  let headerSub: string | undefined
  if (automated) headerSub = t('transit.searchHint')
  else if (!form.title.trim()) headerSub = `${t('reservations.titleLabel')} *`
  else if (routeNames.length >= 2) headerSub = routeNames.join(' → ')

  const header = (
    <BookingDialogHeader
      tone={tone}
      type={automated ? 'transit' : form.type}
      labelId={titleId}
      onClose={onClose}
      eyebrow={automated ? undefined : reservation ? t('transport.modalTitle.edit') : t('transport.modalTitle.create')}
      title={automated ? t('transit.title') : undefined}
      titleInput={automated ? undefined : {
        value: form.title,
        onChange: value => set('title', value),
        label: t('reservations.titleLabel'),
        placeholder: t('reservations.titlePlaceholder'),
        required: true,
      }}
      sub={headerSub}
      subWraps={automated}
      pills={(
        <>
          {/* The search runs against one day; it heads the band next to the mode switch. */}
          {automated && (
            <PillSelect
              label={t('reservations.date')}
              value={String(form.start_day_id)}
              onChange={value => set('start_day_id', value === '' ? '' : Number(value))}
              options={dayOptions.map(o => ({ value: String(o.value), label: o.label, hint: 'badge' in o ? o.badge : undefined, icon: <CalendarDays size={13} strokeWidth={2.2} className="text-content-faint" /> }))}
            />
          )}
          {!automated && (
            <StatusPill status={form.status} onToggle={() => set('status', form.status === 'confirmed' ? 'pending' : 'confirmed')} />
          )}
          {!automated && (
            <PillSelect
              label={t('reservations.bookingType')}
              value={form.type}
              onChange={value => set('type', value)}
              options={TYPE_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey), icon: <o.Icon size={14} style={{ color: typeInfo(o.value).color }} /> }))}
              fallback={{ label: t(shownType.chipKey), icon: <shownType.Icon size={14} style={{ color: shownType.color }} /> }}
            />
          )}
          {modeSwitch}
        </>
      )}
    />
  )

  const footer = (
    <DialogFooter>
      {!automated && reservation?.id && onDelete && <DeleteButton onClick={() => setShowDeleteConfirm(true)} />}
      <FooterSpacer />
      <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      {!automated && (
        <DialogButton variant="primary" onClick={() => handleSubmit()} disabled={isSaving || !form.title.trim()}>
          {isSaving ? t('common.saving') : reservation ? t('common.update') : t('common.add')}
        </DialogButton>
      )}
    </DialogFooter>
  )

  const transitSearch = () => {
    const transitDay = days.find(d => d.id === Number(form.start_day_id))
    if (!transitDay) return <p className="m-0 text-content-faint" style={fs(13, 'body')}>{t('transit.pickDay')}</p>
    // Quick picks offer the chosen day's itinerary, not the whole trip (#1460).
    const dayPlaces = (assignments[String(transitDay.id)] || [])
      .slice().sort((a, b) => a.order_index - b.order_index)
      .map(a => places.find(p => p.id === a.place_id))
      .filter((p): p is Place => p != null)
    return (
      <TransitSearchPanel
        day={transitDay}
        days={days}
        places={dayPlaces}
        accommodations={accommodations}
        onAdd={(payload) => onSave(payload as Record<string, any> & { title: string })}
        initialFrom={transitPrefill?.from ?? null}
        initialTo={transitPrefill?.to ?? null}
        initialTime={transitPrefill?.time ?? null}
      />
    )
  }

  const roleLabel = (i: number, count: number) =>
    i === 0 ? t(form.type === 'cruise' ? 'reservations.cruise.embark' : 'reservations.meta.from')
      : i === count - 1 ? t(form.type === 'cruise' ? 'reservations.cruise.disembark' : 'reservations.meta.to')
        : t(form.type === 'cruise' ? 'reservations.cruise.port' : 'reservations.layover.stop')

  // Flight route: ordered airports (origin, stops, destination) on one rail.
  const flightRoute = () => (
    <DialogSection key="flight" label={t('reservations.layover.route')}>
      <ol>
        {waypoints.map((wp, i) => {
          const isFirst = i === 0
          const isLast = i === waypoints.length - 1
          const updateWp = (patch: Partial<WaypointForm>) => setWaypoints(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
          return (
            <RailStop key={i} first={isFirst} last={isLast}>
              <div className={PANEL}>
                <StopHead label={roleLabel(i, waypoints.length)} onRemove={!isFirst && !isLast ? () => setWaypoints(prev => prev.filter((_, j) => j !== i)) : undefined}>
                  <div className={SEARCH_ON_PANEL}>
                    <AirportSelect value={wp.airport} onChange={a => updateWp({ airport: a || null })} />
                  </div>
                </StopHead>
                {!isFirst && (
                  <div className={wp.airport ? GRID_3 : GRID_2}>
                    {dayField(t('reservations.arrivalDate'), wp.arrDayId, v => updateWp({ arrDayId: v }))}
                    {timeField(t('reservations.arrivalTime'), wp.arrTime, v => updateWp({ arrTime: v }))}
                    {wp.airport && zoneField(t('reservations.meta.arrivalTimezone'), wp.airport.tz)}
                  </div>
                )}
                {!isLast && (
                  <>
                    <div className={wp.airport ? GRID_3 : GRID_2}>
                      {dayField(t('reservations.departureDate'), wp.depDayId, v => updateWp({ depDayId: v }))}
                      {timeField(t('reservations.departureTime'), wp.depTime, v => updateWp({ depTime: v }))}
                      {wp.airport && zoneField(t('reservations.meta.departureTimezone'), wp.airport.tz)}
                    </div>
                    <div className={writesFlightLegs ? GRID_4 : GRID_3}>
                      <EditorField label={t('reservations.meta.airline')}>
                        <input type="text" value={wp.airline} onChange={e => updateWp({ airline: e.target.value })} placeholder="Lufthansa" className={INPUT} />
                      </EditorField>
                      <EditorField label={t('reservations.meta.flightNumber')}>
                        <input type="text" value={wp.flight_number} onChange={e => updateWp({ flight_number: e.target.value })} placeholder="LH 123" className={INPUT} />
                      </EditorField>
                      <EditorField label={t('reservations.meta.seat')}>
                        <input type="text" value={wp.seat} onChange={e => updateWp({ seat: e.target.value })} placeholder="12A" className={INPUT} />
                      </EditorField>
                      {writesFlightLegs && (
                        <EditorField label={t('reservations.confirmationCode')}>
                          <BookingCodeInput value={wp.confirmation_number} onChange={e => updateWp({ confirmation_number: e.target.value })}
                            placeholder={t('reservations.confirmationPlaceholder')} className={INPUT} />
                        </EditorField>
                      )}
                    </div>
                  </>
                )}
              </div>
              {!isLast && (
                <div className="py-2.5">
                  <AddRowButton onClick={() => setWaypoints(prev => [...prev.slice(0, i + 1), emptyWaypoint(prev[i]?.depDayId || ''), ...prev.slice(i + 1)])}>
                    {t('reservations.layover.addStop')}
                  </AddRowButton>
                </div>
              )}
            </RailStop>
          )
        })}
      </ol>
    </DialogSection>
  )

  // Train route: ordered stations on the same rail, per-leg train fields.
  const trainRoute = () => (
    <DialogSection key="train" label={t('reservations.layover.route')}>
      <ol>
        {trainWaypoints.map((wp, i) => {
          const isFirst = i === 0
          const isLast = i === trainWaypoints.length - 1
          const updateWp = (patch: Partial<StationWaypointForm>) => setTrainWaypoints(prev => prev.map((w, j) => (j === i ? { ...w, ...patch } : w)))
          return (
            <RailStop key={i} first={isFirst} last={isLast}>
              <div className={PANEL}>
                <StopHead label={roleLabel(i, trainWaypoints.length)} onRemove={!isFirst && !isLast ? () => setTrainWaypoints(prev => prev.filter((_, j) => j !== i)) : undefined}>
                  <div className={SEARCH_ON_PANEL}>
                    <LocationSelect value={wp.location} onChange={l => updateWp({ location: l || null })} places={locationPicks} />
                  </div>
                </StopHead>
                {!isFirst && (
                  <div className={GRID_2}>
                    {dayField(t('reservations.arrivalDate'), wp.arrDayId, v => updateWp({ arrDayId: v }))}
                    {timeField(t('reservations.arrivalTime'), wp.arrTime, v => updateWp({ arrTime: v }))}
                  </div>
                )}
                {!isLast && (
                  <>
                    <div className={GRID_2}>
                      {dayField(t('reservations.departureDate'), wp.depDayId, v => updateWp({ depDayId: v }))}
                      {timeField(t('reservations.departureTime'), wp.depTime, v => updateWp({ depTime: v }))}
                    </div>
                    {/* A cruise's ports carry only their times: number, platform and seat are a train's. */}
                    {form.type === 'train' && <div className={writesTrainLegs ? GRID_4 : GRID_3}>
                      <EditorField label={t('reservations.meta.trainNumber')}>
                        <input type="text" value={wp.train_number} onChange={e => updateWp({ train_number: e.target.value })} placeholder="ICE 123" className={INPUT} />
                      </EditorField>
                      <EditorField label={t('reservations.meta.platform')}>
                        <input type="text" value={wp.platform} onChange={e => updateWp({ platform: e.target.value })} placeholder="12" className={INPUT} />
                      </EditorField>
                      <EditorField label={t('reservations.meta.seat')}>
                        <input type="text" value={wp.seat} onChange={e => updateWp({ seat: e.target.value })} placeholder="42A" className={INPUT} />
                      </EditorField>
                      {writesTrainLegs && (
                        <EditorField label={t('reservations.confirmationCode')}>
                          <BookingCodeInput value={wp.confirmation_number} onChange={e => updateWp({ confirmation_number: e.target.value })}
                            placeholder={t('reservations.confirmationPlaceholder')} className={INPUT} />
                        </EditorField>
                      )}
                    </div>}
                  </>
                )}
              </div>
              {!isLast && (
                <div className="py-2.5">
                  <AddRowButton onClick={() => setTrainWaypoints(prev => [...prev.slice(0, i + 1), emptyStationWaypoint(prev[i]?.depDayId || ''), ...prev.slice(i + 1)])}>
                    {t(form.type === 'cruise' ? 'reservations.cruise.addPort' : 'reservations.layover.addStop')}
                  </AddRowButton>
                </div>
              )}
            </RailStop>
          )
        })}
      </ol>
    </DialogSection>
  )

  // Every other type: one From and one To, the day and time rows under them.
  const plainRoute = () => (
    <DialogSection key="plain" label={t('reservations.layover.route')}>
      <div className={PANEL}>
        <div className={GRID_2}>
          <EditorField label={t('reservations.meta.from')}>
            <div className={SEARCH_ON_PANEL}>
              <LocationSelect value={fromPick.location || null} onChange={l => setFromPick({ location: l || undefined })} places={locationPicks} />
            </div>
          </EditorField>
          <EditorField label={t('reservations.meta.to')}>
            <div className={SEARCH_ON_PANEL}>
              <LocationSelect value={toPick.location || null} onChange={l => setToPick({ location: l || undefined })} places={locationPicks} />
            </div>
          </EditorField>
        </div>

        {/* Stops along the drive, cars only (#1797). The rental frame above stays the
            pick-up and return; these are the places in between, in order. */}
        {isCar && (
          <div>
            <Eyebrow className="mb-[5px]">{t('roadtrip.stops.label')}</Eyebrow>
            <div className="flex flex-col gap-2">
              {carStops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* The order of the stops IS the route (sequence is the index at save
                      time), and the row has no room left to drag by, hence buttons. */}
                  {carStops.length > 1 && (
                    <div className="flex flex-none flex-col">
                      <IconAction label={t('dayplan.moveUp')} onClick={() => moveCarStop(i, -1)} disabled={i === 0} shape="h-[18px] w-6 rounded-md">
                        <ChevronUp size={13} />
                      </IconAction>
                      <IconAction label={t('dayplan.moveDown')} onClick={() => moveCarStop(i, 1)} disabled={i === carStops.length - 1} shape="h-[18px] w-6 rounded-md">
                        <ChevronDown size={13} />
                      </IconAction>
                    </div>
                  )}
                  <div className={`${SEARCH_ON_PANEL} flex-1`}>
                    <LocationSelect
                      value={stop.location}
                      onChange={l => setCarStops(prev => prev.map((s, j) => (j === i ? { ...s, location: l || null } : s)))}
                      places={locationPicks}
                    />
                  </div>
                  <div className="w-[110px] flex-none">
                    <CustomTimePicker
                      value={stop.time}
                      onChange={v => setCarStops(prev => prev.map((s, j) => (j === i ? { ...s, time: v } : s)))}
                    />
                  </div>
                  <IconAction label={t('roadtrip.stops.remove')} onClick={() => setCarStops(prev => prev.filter((_, j) => j !== i))} danger>
                    <X size={14} />
                  </IconAction>
                </div>
              ))}
              <AddRowButton onClick={() => setCarStops(prev => [...prev, emptyCarStop()])}>{t('reservations.layover.addStop')}</AddRowButton>
            </div>
          </div>
        )}

        <div className={GRID_2}>
          {dayField(isCar ? t('reservations.pickupDate') : t('reservations.date'), form.start_day_id, value => set('start_day_id', value))}
          {timeField(isCar ? t('reservations.pickupTime') : t('reservations.startTime'), form.departure_time, v => set('departure_time', v))}
        </div>
        <div className={GRID_2}>
          {dayField(isCar ? t('reservations.returnDate') : t('reservations.endDate'), form.end_day_id, value => set('end_day_id', value))}
          {timeField(isCar ? t('reservations.returnTime') : t('reservations.endTime'), form.arrival_time, v => set('arrival_time', v))}
        </div>
      </div>
    </DialogSection>
  )

  return (
    <DialogShell
      open={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      width="editor"
      align="top"
      blocked={showDeleteConfirm}
      // A stray click beside the editor asks before the typing is lost (#2253).
      discardGuard={{ form, waypoints, trainWaypoints, carStops, files: pendingFiles.length, travelers: [...travelerIds] }}
      onSubmit={automated ? undefined : handleSubmit}
      header={header}
      footer={footer}
    >
      {automated ? (
        /* Automated: public transit search (#1065) for the day picked in the head band. */
        transitSearch()
      ) : (
        <>
          {/* Travelers: trip members and guests on this booking (#1517) */}
          <DialogSection label={t('reservations.travelers.label')}>
            <TravelerPicker tripMembers={tripMembers} selectedIds={travelerIds} onToggle={toggleTraveler} />
          </DialogSection>

          {form.type === 'flight' ? flightRoute() : stationRoute ? trainRoute() : plainRoute()}

          <EditorField label={t('reservations.confirmationCode')}>
            <BookingCodeInput value={form.confirmation_number} onChange={e => set('confirmation_number', e.target.value)}
              placeholder={t('reservations.confirmationPlaceholder')} className={INPUT} />
          </EditorField>

          <EditorField label={t('reservations.notes')}>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder={t('reservations.notesPlaceholder')} className={TEXTAREA} />
          </EditorField>

          <BookingLinkAndFiles
            url={form.url}
            onUrlChange={value => set('url', value)}
            labelClass={LABEL}
            inputClass={INPUT}
            reservationId={reservation?.id}
            tripFiles={files}
            attachedFiles={attachedFiles}
            pendingFiles={pendingFiles}
            onRemovePending={index => setPendingFiles(prev => prev.filter((_, j) => j !== index))}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            canAttach={!!onFileUpload}
            uploading={uploadingFile}
            onLinked={fileId => setLinkedFileIds(prev => [...prev, fileId])}
            onDetached={fileId => setLinkedFileIds(prev => prev.filter(id => id !== fileId))}
          />

          {/* Costs: create or view the expenses linked to this booking */}
          {isBudgetEnabled && (
            <BookingCostsSection
              reservationId={reservation?.id ?? null}
              pendingExpense={pendingExpense}
              onCreate={handleCreateExpense}
              onEdit={handleEditExpense}
              onRemove={handleRemoveExpense}
              labelClassName={LABEL}
              customTooltips
            />
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('reservations.confirm.deleteTitle')}
        message={t('reservations.confirm.deleteBody', { name: reservation?.title ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={async () => {
          setShowDeleteConfirm(false)
          await onDelete?.()
          onClose()
        }}
      />
    </DialogShell>
  )
}

const GRID_4 = 'grid grid-cols-4 items-start gap-3 max-sm:grid-cols-1'

/** One stop on the route: a dot on the line from origin to destination, its fields beside it. */
function RailStop({ first, last, children }: { first: boolean; last: boolean; children: ReactNode }) {
  return (
    <li className="relative pl-7">
      {!first && <span aria-hidden="true" className="absolute left-[7px] top-0 h-6 w-0.5 bg-edge" />}
      {!last && <span aria-hidden="true" className="absolute bottom-0 left-[7px] top-6 w-0.5 bg-edge" />}
      <span
        aria-hidden="true"
        className={`absolute left-[3px] top-[19px] h-2.5 w-2.5 rounded-full border-2 bg-surface-card ${first || last ? 'border-content-muted' : 'border-content-faint'}`}
      />
      {children}
    </li>
  )
}

/** The role of a stop over its place field, and the remove action an intermediate stop has. */
function StopHead({ label, onRemove, children }: { label: string; onRemove?: () => void; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-[24px] items-center gap-2">
        <Eyebrow className="min-w-0 flex-1 truncate">{label}</Eyebrow>
        {onRemove && (
          <IconAction label={t('common.delete')} onClick={onRemove} danger>
            <Trash2 size={13} />
          </IconAction>
        )}
      </div>
      {children}
    </div>
  )
}

/** A small icon button inside a route, named by its tooltip. */
function IconAction({ label, onClick, disabled, danger = false, shape = 'h-6 w-6 rounded-full', children }: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  shape?: string
  children: ReactNode
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`grid flex-none place-items-center text-content-faint enabled:hover:bg-surface-hover disabled:cursor-default disabled:opacity-30 ${danger ? 'enabled:hover:text-danger' : 'enabled:hover:text-content'} ${shape}`}
      >
        {children}
      </button>
    </Tooltip>
  )
}
