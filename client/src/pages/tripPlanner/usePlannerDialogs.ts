import { useCallback, useEffect, useRef, useState } from 'react'
import type { RoadtripStopType } from '@trek/shared'
import { airtrailApi } from '../../api/client'
import type { RoadtripStopDraft } from '../../components/Roadtrip/RoadtripStopPopup'
import { useAirtrailConnection } from '../../hooks/useAirtrailConnection'
import type { Place, Reservation } from '../../types'
import type { PlannerBase, PlannerSearchParams } from './plannerTypes'
import { changeTransitRouteWith, openTransportEditorWith } from './transportEditorOpeners'

interface PlannerDialogsOptions extends Pick<PlannerBase, 'tripId' | 'tripActions'> {
  searchParams: PlannerSearchParams[0]
  /** Passed down rather than read again: a second useSearchParams call is a second setter. */
  setSearchParams: PlannerSearchParams[1]
}

/**
 * The planner's URL intents and the dialogs they open: the place form, the service
 * stop form, the stop popup, the stay release question, the trip and member dialogs,
 * the booking, transport and transit editors, the two importers and the booking detail.
 *
 * Its effects run where useTripPlanner calls it, in the order they always had. That is
 * also why the ?tab= cleanup sits here although it belongs to the tabs: it runs after
 * the ?create=place intent and before the AirTrail sync.
 */
export function usePlannerDialogs(options: PlannerDialogsOptions) {
  const { tripId, tripActions, searchParams, setSearchParams } = options
  const [showPlaceForm, setShowPlaceForm] = useState<boolean>(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [prefillCoords, setPrefillCoords] = useState<{ lat: number; lng: number; name?: string; address?: string; website?: string; phone?: string; osm_id?: string; stop_type?: RoadtripStopType | null; duration_minutes?: number; category?: string } | null>(null)
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null)
  // Day context of the open form. Set only by the day-scoped entry points (the
  // mobile day toolbar, a long-press on the mobile map); every other opener
  // clears it, so a place added from the pool still lands in the pool (#1998).
  const [placeFormDayId, setPlaceFormDayId] = useState<number | null>(null)
  /**
   * Where in the day the place being added belongs, when the caller knows.
   * Null means the old behaviour: the server appends it at the end.
   */
  const [placeFormPosition, setPlaceFormPosition] = useState<number | null>(null)
  // The position belongs to the form it was opened with and to nothing after it. The
  // day-scoped openers set the day, the form's close clears the coordinates, but the
  // position is written by one opener and read by every save, so a stop handed to the
  // form from the corridor popup once left the next add from any day landing at that
  // same index. Tied to the form being open, the only time it means anything.
  useEffect(() => {
    if (!showPlaceForm) setPlaceFormPosition(null)
  }, [showPlaceForm])
  /**
   * Whether the open place form is asking for a service stop on the drive.
   *
   * Only the road trip's "add manually" sets it, and everything that opens the form for
   * anything else clears it, so the ordinary add, the edit and the corridor hit are the
   * form they have always been.
   */
  const [serviceStopForm, setServiceStopForm] = useState(false)
  /**
   * The kind that form opens on, taken from what the corridor panel was looking for.
   *
   * Beside the flag rather than inside it, because it is written by the same click and
   * read by the same memo, and a second piece of state is cheaper to follow than a flag
   * that is sometimes a boolean and sometimes an object.
   */
  const [serviceStopKind, setServiceStopKind] = useState<RoadtripStopType | null>(null)
  /**
   * The corridor hit waiting to become a stop, while the small popup is open.
   *
   * The full place form is the wrong question for a petrol station: category, price,
   * photo, notes and files are all empty for one. So in road trip mode a hit opens this
   * instead, and the form stays one click away behind "more details".
   */
  const [stopDraft, setStopDraft] = useState<RoadtripStopDraft | null>(null)
  /**
   * A booked night the popup was asked to turn into a pause, waiting for a yes.
   *
   * The switch in the popup reads like a change of stop kind, but the night is a
   * booking row, and the server takes the reservation and the expense written against
   * it down with that row. It is the one write the popup can make that nothing brings
   * back, so it is the one that asks first. The name and the booking title are read
   * once, here, so the dialog does not have to know where either lives.
   */
  const [stayRelease, setStayRelease] = useState<{
    stop: { stopType: RoadtripStopType | null; dwellMinutes: number }
    name: string
    booking: string | null
  } | null>(null)
  const [reservationModalDayId, setReservationModalDayId] = useState<number | null>(null)

  // The bottom-nav "+" opens the new-place form via ?create=place.
  useEffect(() => {
    if (searchParams.get('create') === 'place') {
      setEditingPlace(null); setEditingAssignmentId(null); setPlaceFormDayId(null); setShowPlaceForm(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams])

  // ?tab= has done its job in the activeTab initializer in useTripPlanner, so drop it
  // and the URL stops claiming a tab the user may have since switched away from. The
  // session memory keeps the choice across a reload. It runs here, right after the
  // ?create=place intent, because that is the order the two effects have always had.
  useEffect(() => {
    if (searchParams.get('tab') === null) return
    setSearchParams(p => { p.delete('tab'); return p }, { replace: true })
  }, [searchParams])
  const [showTripForm, setShowTripForm] = useState<boolean>(false)
  const [showMembersModal, setShowMembersModal] = useState<boolean>(false)
  const [showReservationModal, setShowReservationModal] = useState<boolean>(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [showBookingImport, setShowBookingImport] = useState<boolean>(false)
  // Which tab opened the importer. Only ever a tie-breaker: see openImportItem.
  const [bookingImportKind, setBookingImportKind] = useState<'transports' | 'bookings'>('bookings')
  const [bookingImportAvailable, setBookingImportAvailable] = useState<boolean>(false)
  const { available: airTrailAvailable } = useAirtrailConnection()
  const [showAirTrailImport, setShowAirTrailImport] = useState<boolean>(false)
  // Pull this user's AirTrail edits as soon as they open the trip, so changes
  // made in AirTrail show up without waiting for the background poll.
  const airtrailSyncedRef = useRef<number | null>(null)
  useEffect(() => {
    if (!airTrailAvailable || !tripId || airtrailSyncedRef.current === tripId) return
    airtrailSyncedRef.current = tripId
    airtrailApi.sync()
      .then(r => { if (r && r.changed > 0) void tripActions.loadReservations(tripId) })
      .catch(() => {})
  }, [airTrailAvailable, tripId, tripActions])
  const [bookingForAssignmentId, setBookingForAssignmentId] = useState<number | null>(null)
  const [showTransportModal, setShowTransportModal] = useState<boolean>(false)
  const [editingTransport, setEditingTransport] = useState<Reservation | null>(null)
  const [transportModalDayId, setTransportModalDayId] = useState<number | null>(null)
  // Public transit (#1065): open the TransportModal in its Automated mode, seed
  // the search (change-route), and show the journey view for a saved entry.
  const [transportModalAutomated, setTransportModalAutomated] = useState<boolean>(false)
  const [transitPrefill, setTransitPrefill] = useState<{ from?: { name: string; lat: number; lng: number } | null; to?: { name: string; lat: number; lng: number } | null; time?: string | null } | null>(null)
  const [transitJourney, setTransitJourney] = useState<Reservation | null>(null)
  // The booking whose detail is open over the desktop plan: a day row, a rental pill,
  // the inspector's booking card, a map endpoint or the road-trip rail opened it.
  // Held by id, so the dialog shows the store's copy and goes away by itself once the
  // booking is deleted. `fromDayList` remembers that a row of the day list opened it,
  // whose editor also asks for day_edit.
  const [bookingDetailOpen, setBookingDetailOpen] = useState<{ id: number; fromDayList: boolean } | null>(null)

  // The full transport editor on a saved entry, and the transit search re-entered
  // seeded with a journey's route. The phone trip sheets open them with the same
  // helpers on the planner's setters.
  const openTransportEditor = useCallback((r: Reservation) => {
    openTransportEditorWith({ setEditingTransport, setTransportModalDayId, setTransportModalAutomated, setTransitPrefill, setTransitJourney, setShowTransportModal }, r)
  }, [])
  const changeTransitRoute = useCallback((r: Reservation) => {
    changeTransitRouteWith({ setEditingTransport, setTransportModalDayId, setTransportModalAutomated, setTransitPrefill, setTransitJourney, setShowTransportModal }, r)
  }, [])

  // The bottom-nav "+" is context-aware per tab: on the Bookings / Transports tabs
  // it opens the booking / transport modal via ?create=reservation|transport
  // (place is handled above, expense in CostsPanel). #1349
  useEffect(() => {
    const intent = searchParams.get('create')
    if (intent === 'reservation') {
      setEditingReservation(null); setBookingForAssignmentId(null); setShowReservationModal(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    } else if (intent === 'transport') {
      setEditingTransport(null); setTransportModalDayId(null); setShowTransportModal(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams])

  return {
    showPlaceForm, setShowPlaceForm, editingPlace, setEditingPlace, prefillCoords, setPrefillCoords,
    editingAssignmentId, setEditingAssignmentId, placeFormDayId, setPlaceFormDayId,
    placeFormPosition, setPlaceFormPosition, serviceStopForm, setServiceStopForm, serviceStopKind, setServiceStopKind,
    stopDraft, setStopDraft, stayRelease, setStayRelease, reservationModalDayId, setReservationModalDayId,
    showTripForm, setShowTripForm, showMembersModal, setShowMembersModal,
    showReservationModal, setShowReservationModal, editingReservation, setEditingReservation,
    showBookingImport, setShowBookingImport, bookingImportKind, setBookingImportKind,
    bookingImportAvailable, setBookingImportAvailable, airTrailAvailable, showAirTrailImport, setShowAirTrailImport,
    bookingForAssignmentId, setBookingForAssignmentId, showTransportModal, setShowTransportModal,
    editingTransport, setEditingTransport, transportModalDayId, setTransportModalDayId,
    transportModalAutomated, setTransportModalAutomated, transitPrefill, setTransitPrefill, transitJourney, setTransitJourney,
    bookingDetailOpen, setBookingDetailOpen, openTransportEditor, changeTransitRoute,
  }
}

export type PlannerDialogs = ReturnType<typeof usePlannerDialogs>
