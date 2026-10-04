import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { isServiceStopType } from '../Roadtrip/roadtripModel'
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
interface DragDataPayload { placeId?: string; assignmentId?: string; noteId?: string; reservationId?: string; fromDayId?: string; phase?: 'single' | 'start' | 'middle' | 'end'; /** A corridor hit on its way onto the drive (#1797) — not a place yet. */ poiOsmId?: string }
declare global { interface Window { __dragData: DragDataPayload | null } }

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import { safeHttpUrl } from '../../utils/safeUrl'
import { ChevronDown, ChevronRight, ChevronUp, Compass, RotateCcw, ExternalLink, Pencil, GripVertical, Ticket, Plus, FileText, Trash2, Car, Lock, Hotel, Eraser, Route as RouteIcon, RouteOff, Bookmark, StickyNote, TramFront, Zap, MapPin, Globe } from 'lucide-react'
import { type PickedPlace } from './TransitSearchPanel'
import { buildTransitLeg, buildTransitNameIndex } from './transitLeg'
import { assignmentsApi, reservationsApi, daysApi } from '../../api/client'
import { calculateRouteWithLegs, optimizeRoute, generateGoogleMapsUrl, generateCoMapsUrl, type NamedWaypoint } from '../Map/RouteCalculator'
import GoogleMapsIcon from '../shared/GoogleMapsIcon'
import PlaceAvatar from '../shared/PlaceAvatar'
import ConfirmDialog from '../shared/ConfirmDialog'
import { useContextMenu, ContextMenu } from '../shared/ContextMenu'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import WeatherWidget from '../Weather/WeatherWidget'
import { useToast } from '../shared/Toast'
import { getCategoryIcon } from '../shared/categoryIcons'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useAddonStore } from '../../store/addonStore'
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore'
import { placeToSaveTarget } from '../Collections/saveTarget'
import { useTranslation } from '../../i18n'
import { routeModeIcon, useRouteModeOptions } from './routeModes'
import { Tooltip } from '../shared/Tooltip'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { BarButton, MoreButton, SoftPill, TimePill, tintOf } from './planParts'

/** The round white button a row carries on its right (a route on the map, a journey's legs). */
const ROW_ROUND = 'grid flex-none place-items-center rounded-full bg-surface-card shadow-sm transition-colors'
/** The white face every control of a day's route bar shares, so the row reads as one set. */
const ROUTE_TOOL = 'bg-surface-card shadow-sm ring-1 ring-edge-faint'
import { TypeTile } from './bookings/bookingParts'
import { typeInfo } from './bookings/bookingsModel'
import { isDayInAccommodationRange, getAccommodationAnchors, getDayBookendHotels, shouldDrawMorningLeg, shouldDrawEveningLeg, type CarrierEdge } from '../../utils/dayOrder'
import {
  TRANSPORT_TYPES, parseTimeToMinutes, getSpanPhase, hidesOnMiddleDay, getDisplayTimeForDay, getTransportRouteEndpoints,
  getTransportForDay as _getTransportForDay, getMergedItems as _getMergedItems, isCarrierTransport, hasCarrierEndpointOnDay,
  getAssignmentReservations, timedSlot, storedRideSlot,
  type MergedItem,
} from '../../utils/dayMerge'
import { withinDriveRange } from '@trek/shared/roadtrip'
import { formatDate, formatTime, formatMoneySum, splitReservationDateTime } from '../../utils/formatters'
import { dayHeadingParts } from '../../utils/dayLabel'
import { pendingStayIds } from '../../utils/pendingStays'
import { planCosts } from './planCosts'
import { useDayNotes } from '../../hooks/useDayNotes'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import { RES_ICONS, getNoteIcon } from './DayPlanSidebar.constants'
import { noteSurface } from './noteSurface'
import { findTodayDayId } from './today'
import { markdownLinkComponents } from '../shared/markdownLink'
import { RouteConnector, HotelRouteConnector } from './DayPlanSidebarRouteConnector'
import { resolveLegMode } from './legMode'
import { usePluginDaySchedule, usePluginDayTints, dayTintBackground, dayTinted, PluginDayScheduleRow, formatScheduleMinutes } from '../Plugins/PluginDaySchedule'
import { MobileAddPlaceButton } from './DayPlanSidebarMobileAddPlaceButton'
import { DayPlanSidebarToolbar } from './DayPlanSidebarToolbar'
import { DayPlanSidebarNoteModal } from './DayPlanSidebarNoteModal'
import { DayPlanSidebarTimeConfirmModal } from './DayPlanSidebarTimeConfirmModal'
import { DayPlanSidebarTransportDetailModal } from './DayPlanSidebarTransportDetailModal'
import { TransitTitle, TransitLegChips, TransitItineraryInline } from './transitDisplay'
import { DayPlanSidebarFooter } from './DayPlanSidebarFooter'
import type { DayAddControls } from '../../utils/dayAdd'
import type { DayDeleteQuestion } from '../../utils/dayImpactLines'
import type { Trip, Day, Place, Category, Assignment, Accommodation, Reservation, AssignmentsMap, RouteResult, RouteSegment, DayNote } from '../../types'

interface DayPlanSidebarProps {
  tripId: number
  trip: Trip
  days: Day[]
  places: Place[]
  categories: Category[]
  assignments: AssignmentsMap
  selectedDayId: number | null
  selectedPlaceId: number | null
  selectedAssignmentId: number | null
  onSelectDay: (dayId: number | null, skipFit?: boolean) => void
  onPlaceClick: (placeId: number | null, assignmentId?: number | null) => void
  onDayDetail: (day: Day | null) => void
  accommodations?: Accommodation[]
  onReorder: (dayId: number, orderedIds: number[]) => void
  onReorderDays?: (orderedIds: number[]) => void
  onAddDay?: (position?: number) => void
  /** The planner's add controls, for the second "Add with date" button on a trip with dates. */
  dayAdd?: DayAddControls
  /** Asks to delete a day from the reorder dialog; the planner owns the question. */
  onDeleteDay?: (dayId: number) => void
  /** The open delete question, which the reorder dialog asks in place of its list. */
  deleteDayQuestion?: DayDeleteQuestion | null
  /** Asks to take every place off a day (#2470); the planner owns the question. */
  onClearDay?: (dayId: number) => void
  /** Renaming lives in the day-detail panel (#1065); the sidebar only forwards the prop. */
  onUpdateDayTitle: (dayId: number, title: string) => void
  /** The day route is computed by the planner page itself; kept for the existing call sites. */
  onRouteCalculated: (route: RouteResult | null) => void
  onAssignToDay: (placeId: number, dayId: number, position?: number) => void
  /**
   * Moves a stop over from another day, at a row index of that day or at its end, and
   * keeps the vias drawn on that day on their legs. Without it the list moves the stop
   * in the store and leaves the vias as they are.
   */
  onMoveToDay?: (assignmentId: number, fromDayId: number, toDayId: number, position?: number) => Promise<void>
  onRemoveAssignment: (dayId: number, assignmentId: number) => void
  onEditPlace: (place: Place, assignmentId?: number) => void
  onDeletePlace: (placeId: number) => void
  reservations?: Reservation[]
  visibleConnectionIds?: number[]
  onToggleConnection?: (reservationId: number) => void
  allConnectionsShown?: boolean
  onToggleAllConnections?: () => void
  externalTransportDetail?: Reservation | null
  onExternalTransportDetailHandled?: () => void
  onAddReservation: (dayId: number) => void
  onNavigateToFiles?: () => void
  routeShown?: boolean
  routeProfile?: string
  onToggleRoute?: () => void
  onSetRouteProfile?: (profile: string) => void
  onAddPlace?: () => void
  onAddPlaceToDay?: (placeId: number, dayId: number) => void
  /** Open the place form already pointed at this day, to create a new place there. */
  onCreatePlaceForDay?: (dayId: number) => void
  onExpandedDaysChange?: (expandedDayIds: Set<number>) => void
  /** `dayIds`: the days the step acts on, so deleting one of them drops it. */
  pushUndo?: (label: string, undoFn: () => Promise<void> | void, dayIds?: number[]) => void
  canUndo?: boolean
  lastActionLabel?: string | null
  onUndo?: () => void
  onRouteRefresh?: () => void
  onAddTransport?: (dayId: number) => void
  /** Opens the day's details with the stay editor up, to add an accommodation from the day's "+". */
  onAddAccommodation?: (day: Day) => void
  /** Opens the public-transit route search for a day (#1065). */
  onPlanTransit?: (dayId: number) => void
  /**
   * Opens the public-transit search pre-filled for a single leg (#1281 follow-up):
   * the leg's origin and destination endpoints plus the origin's departure time,
   * so "public transport" becomes an option on any connector, not just the day header.
   */
  onPlanTransitLeg?: (leg: { dayId: number; from: PickedPlace; to: PickedPlace; time: string | null }) => void
  /** Opens the journey view for a saved transit entry (#1065). */
  onOpenTransit?: (reservation: Reservation) => void
  onEditTransport?: (reservation: Reservation) => void
  onEditReservation?: (reservation: Reservation) => void
  /**
   * Shows a booking's detail. Given, a booking row and a rental pill open that
   * detail for every booking, transit included, and its Edit leads on to the
   * editor; without it they open what they always opened.
   */
  onOpenBooking?: (reservation: Reservation) => void
  onAddBookingToAssignment?: (dayId: number, assignmentId: number) => void
  initialScrollTop?: number
  onScrollTopChange?: (top: number) => void
  /** Mobile: show the route tools footer (Route toggle / Optimize / travel profile) on expanded days, since selecting a day closes the sheet */
  showRouteToolsWhenExpanded?: boolean
  isMobile?: boolean
}

/**
 * Day-plan state + behaviour: expand/collapse, inline title edit, route legs +
 * optimisation, day notes, and the drag-and-drop reorder/move machinery across
 * days (places, transports, notes). Returns everything the timeline view renders
 * from, keeping DayPlanSidebar a thin shell over one large day list.
 */
// The day head's tones: hovered, open, and a drop landing on it. Mixed from the
// accent so they follow the user's scheme in both themes.
const DAY_HEAD_HOVER = 'color-mix(in srgb, var(--accent) 10%, transparent)'
const DAY_HEAD_SELECTED = 'color-mix(in srgb, var(--accent) 12%, transparent)'
const DAY_HEAD_DROP = 'color-mix(in srgb, var(--accent) 9%, transparent)'
// A stop pinned in place: a whisper of the danger tone on the row, a stronger one over its avatar.
const LOCKED_ROW = 'color-mix(in srgb, var(--danger) 7%, transparent)'
const LOCK_OVERLAY = 'color-mix(in srgb, var(--danger) 62%, transparent)'
const LOCK_OVERLAY_HOVER = 'color-mix(in srgb, var(--danger) 42%, transparent)'

function useDayPlanSidebar(props: DayPlanSidebarProps) {
  const {
  tripId,
  trip, days, places, categories, assignments,
  selectedDayId, selectedPlaceId, selectedAssignmentId,
  onSelectDay, onPlaceClick, onDayDetail, accommodations = [],
  onReorder, onReorderDays, onAddDay, dayAdd, onDeleteDay, deleteDayQuestion,
  onAssignToDay, onMoveToDay, onRemoveAssignment, onEditPlace, onDeletePlace,
  reservations = [],
  visibleConnectionIds = [],
  onToggleConnection,
  allConnectionsShown = false,
  onToggleAllConnections,
  externalTransportDetail,
  onExternalTransportDetailHandled,
  onAddReservation,
  onAddPlace,
  onAddPlaceToDay,
  onCreatePlaceForDay,
  onNavigateToFiles,
  routeShown = false,
  routeProfile = 'driving',
  onToggleRoute,
  onSetRouteProfile,
  onExpandedDaysChange,
  pushUndo,
  canUndo = false,
  lastActionLabel = null,
  onUndo,
  onRouteRefresh,
  onAddTransport,
  onAddAccommodation,
  onPlanTransit,
  onPlanTransitLeg,
  onOpenTransit,
  onEditTransport,
  onEditReservation,
  onOpenBooking,
  onAddBookingToAssignment,
  initialScrollTop,
  onScrollTopChange,
  showRouteToolsWhenExpanded = false,
  isMobile = false,
  } = props
  // Below lg the plan and the places sit in separate tabs, so there is nothing
  // to drag between. A coarse pointer is no longer a reason of its own: tablets
  // reach the same drag through a long press (#1616).
  const dragDisabled = isMobile
  const toast = useToast()
  const { t, language, locale } = useTranslation()
  const ctxMenu = useContextMenu()
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const mirrorServiceStops = useRoadtripSettings(s => s.roadtrip_service_stops_in_days !== false)
  const tripActions = useRef(useTripStore.getState()).current
  const can = useCanDo()
  const canEditDays = can('day_edit', trip)
  // Editing or deleting the place itself is a place right; taking it off the
  // day stays a day right (#2446).
  const canEditPlaces = can('place_edit', trip)
  // The calendar subscription hands out a link that reads the trip without an
  // account, so it sits behind the same permission as the public share link.
  const canManageShare = can('share_manage', trip)

  const { noteUi, setNoteUi, noteInputRef, dayNotes, openAddNote: _openAddNote, openEditNote: _openEditNote, cancelNote, saveNote, deleteNote: _deleteNote, moveNote: _moveNote } = useDayNotes(tripId)

  const [expandedDays, setExpandedDays] = useState(() => {
    try {
      const saved = localStorage.getItem(`day-expanded-${tripId}`)
      if (saved) return new Set<number>(JSON.parse(saved) as number[])
    } catch {}
    return new Set<number>(days.map(d => d.id))
  })
  useEffect(() => { onExpandedDaysChange?.(expandedDays) }, [expandedDays])
  // Per-segment legs keyed by day id, then by the start place's assignment id (or the
  // transport's reservation id). Nested per day so several Route-toggled mobile days
  // can't collide in one flat map — assignment ids and reservation ids come from
  // independent sequences and would overwrite each other across days (#1374).
  const [routeLegs, setRouteLegs] = useState<Record<number, Record<number, RouteSegment>>>({})
  // Hotel bookend legs keyed by day id. Desktop keys only the selected day; mobile
  // keys every day whose Route toggle is on, so each shows its own bookends (#1374).
  const [hotelLegs, setHotelLegs] = useState<Record<number, { top?: { seg: RouteSegment; name: string; targetId?: number }; bottom?: { seg: RouteSegment; name: string; targetId?: number } }>>({})
  // Mobile only: days the user tapped "Route" on. Their leg distances show inline in
  // the expanded day, so seeing distances doesn't require selecting the day (which
  // closes the mobile sheet) — #1374.
  const [expandedRouteDayIds, setExpandedRouteDayIds] = useState<Set<number>>(new Set())
  const optimizeFromAccommodation = useSettingsStore(s => s.settings.optimize_from_accommodation)
  // Recompute the hotel/route legs when the user flips km↔mi so the connector
  // distances refresh instead of showing stale cached text (#1300).
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const legsAbortRef = useRef<AbortController | null>(null)
  const [draggingId, setDraggingId] = useState(null)
  const [lockedIds, setLockedIds] = useState(new Set())
  const [lockHoverId, setLockHoverId] = useState(null)
  const [undoHover, setUndoHover] = useState(false)
  const [hoveredAssignmentId, setHoveredAssignmentId] = useState<number | null>(null)
  // Transit rows fold their itinerary out inline (#1065).
  const [expandedTransitIds, setExpandedTransitIds] = useState<Set<number>>(new Set())
  const [dropTargetKey, _setDropTargetKey] = useState(null)
  const dropTargetRef = useRef(null)
  const setDropTargetKey = (key) => { dropTargetRef.current = key; _setDropTargetKey(key) }
  const [dragOverDayId, setDragOverDayId] = useState(null)
  const [transportDetail, setTransportDetail] = useState(null)
  const [transportPosVersion, setTransportPosVersion] = useState(0)

  useEffect(() => {
    if (externalTransportDetail) {
      setTransportDetail(externalTransportDetail)
      onExternalTransportDetailHandled?.()
    }
  }, [externalTransportDetail, onExternalTransportDetailHandled])
  const [timeConfirm, setTimeConfirm] = useState<{
    dayId: number; fromId: number; time: string;
    // Target slot of the pending move — drag & drop and the arrow buttons both
    // describe it as "put fromId before/after this merged row".
    fromType?: string; toType?: string; toId?: number; insertAfter?: boolean; toLegIndex?: number | null;
  } | null>(null)
  const dragDataRef = useRef(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const dayRefs = useRef<Map<number, HTMLElement>>(new Map())

  /** The day that is today, or null when the trip is not running right now. */
  const todayDayId = useMemo(() => findTodayDayId(days), [days])

  const scrollToDay = useCallback((dayId: number) => {
    const el = dayRefs.current.get(dayId)
    const container = scrollContainerRef.current
    if (!el || !container) return
    // Positioned against the container, not scrollIntoView: the sidebar sits in
    // a page that also scrolls, and scrollIntoView would drag the whole layout
    // around to satisfy a scroll inside one column.
    container.scrollTo({ top: el.offsetTop - container.offsetTop - 8, behavior: 'smooth' })
  }, [])

  const jumpToToday = useCallback(() => {
    if (todayDayId == null) return
    onSelectDay(todayDayId, true)
    setExpandedDays(prev => new Set(prev).add(todayDayId))
    // After the expand has rendered, or the target is measured at its old height.
    requestAnimationFrame(() => scrollToDay(todayDayId))
  }, [todayDayId, onSelectDay, scrollToDay])

  // On opening a trip that is running, land on today rather than on day 1 (#1567).
  // Once per mount, and only while nothing is selected yet: a deep link into a
  // specific day, or a day the user picked before switching tabs, must win.
  const autoJumpedRef = useRef(false)
  useEffect(() => {
    if (autoJumpedRef.current || todayDayId == null || selectedDayId != null || days.length === 0) return
    autoJumpedRef.current = true
    jumpToToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayDayId, days.length])
  useLayoutEffect(() => {
    if (scrollContainerRef.current && initialScrollTop) {
      scrollContainerRef.current.scrollTop = initialScrollTop
    }
  }, [])
  const initedTransportIds = useRef(new Set<number>()) // Speichert Drag-Daten als Backup (dataTransfer geht bei Re-Render verloren)
  // Remember which assignment we last auto-scrolled into view so we don't
  // keep yanking the user back whenever they scroll away while the same
  // place stays selected.
  const lastAutoScrolledIdRef = useRef<string | number | null>(null)
  useEffect(() => {
    // Reset the scroll-lock whenever selection moves, so the next selected
    // row triggers a fresh scroll-into-view on its ref.
    if (!selectedAssignmentId && !selectedPlaceId) {
      lastAutoScrolledIdRef.current = null
    }
  }, [selectedAssignmentId, selectedPlaceId])

  const currency = trip?.currency || 'EUR'
  // Cost totals render in the user's display currency (falling back to the
  // trip's), converting foreign-currency place prices via live FX rates —
  // same base resolution as BookingCostsSection / the Costs panel (#1561).
  const displayCurrency = useSettingsStore(s => s.settings.default_currency)
  const costBase = (displayCurrency || currency).toUpperCase()
  const { rates: fxRates } = useExchangeRates(costBase)

  // Drag-Daten aus dataTransfer, Ref oder window lesen (dataTransfer geht bei Re-Render verloren)
  const getDragData = (e) => {
    const dt = e?.dataTransfer
    // Interner Drag hat Vorrang (Ref wird nur bei assignmentId/noteId/reservationId gesetzt)
    if (dragDataRef.current) {
      return {
        placeId: '',
        assignmentId: dragDataRef.current.assignmentId || '',
        noteId: dragDataRef.current.noteId || '',
        reservationId: dragDataRef.current.reservationId || '',
        fromDayId: Number.parseInt(dragDataRef.current.fromDayId) || 0,
        phase: (dragDataRef.current.phase || 'single') as 'single' | 'start' | 'middle' | 'end',
      }
    }
    // Externer Drag (aus PlacesSidebar)
    const ext = window.__dragData || {}
    const placeId = dt?.getData('placeId') || ext.placeId || ''
    return { placeId, assignmentId: '', noteId: '', reservationId: '', fromDayId: 0, phase: 'single' as const }
  }

  // Only auto-expand genuinely new days (not on initial load from storage)
  const prevDayCount = React.useRef(days.length)
  useEffect(() => {
    if (days.length > prevDayCount.current) {
      // New days added — expand only those
      setExpandedDays(prev => {
        const n = new Set(prev)
        days.forEach(d => { if (!prev.has(d.id)) n.add(d.id) })
        try { localStorage.setItem(`day-expanded-${tripId}`, JSON.stringify([...n])) } catch {}
        return n
      })
    }
    prevDayCount.current = days.length
  }, [days.length, tripId])

  // Globaler Aufräum-Listener: wenn ein Drag endet ohne Drop, alles zurücksetzen
  useEffect(() => {
    const cleanup = () => {
      setDraggingId(null)
      setDropTargetKey(null)
      setDragOverDayId(null)
      dragDataRef.current = null
      window.__dragData = null
    }
    document.addEventListener('dragend', cleanup)
    return () => document.removeEventListener('dragend', cleanup)
  }, [])

  // A drag whose source row re-rendered away never sends its dragend to the
  // document, and the drop line then stayed on a row until the next reload. The
  // browser sends no mousemove during a drag, so the first plain mouse move or
  // press after one means it is over.
  useEffect(() => {
    if (!draggingId && !dropTargetKey && !dragOverDayId) return
    const settle = () => {
      setDraggingId(null)
      setDropTargetKey(null)
      setDragOverDayId(null)
      dragDataRef.current = null
      window.__dragData = null
    }
    document.addEventListener('mousemove', settle)
    document.addEventListener('pointerdown', settle, true)
    return () => {
      document.removeEventListener('mousemove', settle)
      document.removeEventListener('pointerdown', settle, true)
    }
  }, [draggingId, dropTargetKey, dragOverDayId])

  // Initialize missing transport positions outside of render to avoid setState-during-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { days.forEach(day => initTransportPositions(day.id)) }, [days, reservations])

  const toggleDay = (dayId, e) => {
    e.stopPropagation()
    setExpandedDays(prev => {
      const n = new Set(prev)
      n.has(dayId) ? n.delete(dayId) : n.add(dayId)
      try { localStorage.setItem(`day-expanded-${tripId}`, JSON.stringify([...n])) } catch {}
      return n
    })
  }

  // Get phase label for multi-day badge
  const getSpanLabel = (r: Reservation, phase: string): string | null => {
    if (phase === 'single') return null
    if (r.type === 'flight') return t(`reservations.span.${phase === 'start' ? 'departure' : phase === 'end' ? 'arrival' : 'inTransit'}`)
    if (r.type === 'car') return t(`reservations.span.${phase === 'start' ? 'pickup' : phase === 'end' ? 'return' : 'active'}`)
    // Parking reuses span.pickup for its end day on purpose: you drop the car off and
    // later pick it up again, so the rental car's wording fits without a second key.
    if (r.type === 'parking') return t(`reservations.span.${phase === 'start' ? 'dropOff' : phase === 'end' ? 'pickup' : 'ongoing'}`)
    return t(`reservations.span.${phase === 'start' ? 'start' : phase === 'end' ? 'end' : 'ongoing'}`)
  }

  const getDayOrder = (day: (typeof days)[number]) => (day as any).day_number ?? days.indexOf(day)

  const computeMultiDayMove = (r: Reservation, targetDayId: number, phase: 'single' | 'start' | 'middle' | 'end') => {
    const startId = r.day_id ?? targetDayId
    const endId = r.end_day_id ?? startId
    const order = (id: number) => { const d = days.find(x => x.id === id); return d ? getDayOrder(d) : 0 }
    if (phase === 'single' || startId === endId) return { day_id: targetDayId, end_day_id: targetDayId }
    if (phase === 'start') {
      if (order(targetDayId) > order(endId)) return { day_id: targetDayId, end_day_id: targetDayId }
      return { day_id: targetDayId, end_day_id: endId }
    }
    // phase === 'end'
    if (order(targetDayId) < order(startId)) return { day_id: targetDayId, end_day_id: targetDayId }
    return { day_id: startId, end_day_id: targetDayId }
  }

  const getTransportForDay = (dayId: number) =>
    _getTransportForDay({ reservations, dayId, dayAssignmentIds: (assignments[String(dayId)] || []).map(a => a.id), days })

  // Get car rentals that are in "active" (middle) phase for a day — shown in day header, not timeline
  const getActiveRentalsForDay = (dayId: number) => {
    return reservations.filter(r => {
      if (r.type !== 'car') return false
      const startDayId = r.day_id
      const endDayId = r.end_day_id
      if (!startDayId || !endDayId || endDayId === startDayId) return false
      const startDay = days.find(d => d.id === startDayId)
      const endDay = days.find(d => d.id === endDayId)
      const thisDay = days.find(d => d.id === dayId)
      if (!startDay || !endDay || !thisDay) return false
      return getDayOrder(thisDay) > getDayOrder(startDay) && getDayOrder(thisDay) < getDayOrder(endDay)
    })
  }

  // Two reasons a stop can be road-trip-only, and they are not the same reason.
  //
  // The switch is the traveller's: it keeps the petrol stations and rest areas they
  // added along the drive out of a day list they want to read as a plan.
  //
  // A stop a lodging booking put there is out whatever the switch says. The day
  // already carries that booking as its own overnight block in the header, so the
  // row would be the same hotel a second time. Road trip mode wants it, which is
  // why it is a stop at all: the drive has to end somewhere, and that somewhere is
  // where you sleep.
  const getDayAssignments = (dayId) =>
    (assignments[String(dayId)] || [])
      .filter(a => a.accommodation_id == null && (mirrorServiceStops || !isServiceStopType(a.place?.stop_type)))
      .slice().sort((a, b) => a.order_index - b.order_index)

  // Compute initial day_plan_position for a transport based on time
  const computeTransportPosition = (r, da, dayId) => {
    // A ride that lands today goes where it adds the least road between the same clocks,
    // by the rule the road trip seats it with. This slot is stored, so seated by the
    // clock alone a ferry between two untimed stops stayed at the end of the day, and the
    // drive went overland before the crossing (#2461). Worked out over every stored row of
    // the day rather than `da`: the drive stops at the hotel and the service stops the
    // list hides, and the slot is read against their order indexes too.
    const ride = storedRideSlot(r, assignments[String(dayId)] || [], accommodations, dayId)
    if (ride !== null) return ride
    const minutes = parseTimeToMinutes(r.reservation_time) ?? 0
    // Find the last place with time <= transport time
    let afterIdx = -1
    for (const a of da) {
      const pm = parseTimeToMinutes(a.place?.place_time)
      if (pm !== null && pm <= minutes) afterIdx = a.order_index
    }
    // Position: midpoint between afterIdx and afterIdx+1 (leaves room for other items)
    return afterIdx >= 0 ? afterIdx + 0.5 : da.length + 0.5
  }

  // Auto-initialize transport positions on first render if not set
  const initTransportPositions = (dayId) => {
    const da = getDayAssignments(dayId)
    const transport = getTransportForDay(dayId)
    const needsInit = transport.filter(r => r.day_plan_position == null && !initedTransportIds.current.has(r.id))
    if (needsInit.length === 0) return

    const sorted = [...needsInit].sort((a, b) =>
      (parseTimeToMinutes(a.reservation_time) ?? 0) - (parseTimeToMinutes(b.reservation_time) ?? 0)
    )
    const positions = sorted.map((r, idx) => ({
      id: r.id,
      day_plan_position: computeTransportPosition(r, da, dayId) + idx * 0.01,
    }))
    // Mark as initialized immediately to prevent re-entry
    for (const p of positions) initedTransportIds.current.add(p.id)
    const before = positions.map(p => ({
      id: p.id,
      day_plan_position: useTripStore.getState().reservations.find(r => r.id === p.id)?.day_plan_position ?? null,
    }))
    // Update store so subscribers see the new positions
    useTripStore.setState(state => ({
      reservations: state.reservations.map(r => {
        const p = positions.find(x => x.id === r.id)
        if (!p) return r
        return { ...r, day_plan_position: p.day_plan_position }
      })
    }))
    // Persist to server. No toast — this is a bootstrap write nobody asked for —
    // but the store has to go back to what the server still holds, otherwise the
    // day shows an order that only exists in this tab.
    // The ids stay marked as initialised: the effect reruns on every reservations
    // change, so clearing them here would retry the same failing write in a loop.
    reservationsApi.updatePositions(tripId, positions).catch(() => {
      useTripStore.setState(state => ({
        reservations: state.reservations.map(r => {
          const p = before.find(x => x.id === r.id)
          if (!p) return r
          return { ...r, day_plan_position: p.day_plan_position }
        })
      }))
    })
  }

  const getMergedItems = (dayId: number): MergedItem[] =>
    _getMergedItems({
      dayAssignments: getDayAssignments(dayId),
      dayNotes: (dayNotes[String(dayId)] || []).slice().sort((a, b) => a.sort_order - b.sort_order),
      dayTransports: getTransportForDay(dayId),
      dayId,
      getDisplayTime: getDisplayTimeForDay,
    })

  // The list is a filtered view of the day, and the store is not: assignPlaceToDay
  // and moveAssignment splice into the full day, hidden rows included, and persist
  // the result. A position counted over the rows on screen therefore lands one slot
  // early for every hidden row above the target. So a drop names the row it should
  // land ahead of, and what goes to the store is that row's slot in the full day,
  // in the order the list reads it. No row (an empty day, a note under the last
  // stop) means the end of the full day.
  const storedPositionBefore = (dayId: number, target: { id: number } | null | undefined): number => {
    const stored = (assignments[String(dayId)] || []).slice().sort((a, b) => a.order_index - b.order_index)
    const idx = target ? stored.findIndex(a => a.id === target.id) : -1
    return idx >= 0 ? idx : stored.length
  }

  // Moving a stop over from another day. One with a start is drawn by it wherever it
  // is stored, and the road trip drives the stored order, so it is stored where the
  // list will draw it rather than at the drop. One without a start makes the same call
  // it always has, dropped where it was dropped or at the end of the day.
  const moveToDay = (assignmentId: number, fromDayId: number, toDayId: number, dropAt?: number) => {
    const moving = (assignments[String(fromDayId)] || []).find(a => a.id === assignmentId)
    const slot = timedSlot(assignments[String(toDayId)] || [], accommodations, moving?.place?.place_time, dropAt) ?? dropAt
    if (onMoveToDay) return onMoveToDay(assignmentId, fromDayId, toDayId, slot)
    return slot === undefined
      ? tripActions.moveAssignment(tripId, assignmentId, fromDayId, toDayId)
      : tripActions.moveAssignment(tripId, assignmentId, fromDayId, toDayId, slot)
  }

  // The stop a drop on a note lands ahead of: the next place below the note.
  const placeBelowNote = (dayId: number, noteId: number): Assignment | undefined => {
    const tm = getMergedItems(dayId)
    const noteIdx = tm.findIndex(i => i.type === 'note' && i.data.id === noteId)
    return noteIdx < 0 ? undefined : tm.slice(noteIdx + 1).find(i => i.type === 'place')?.data
  }

  // Pre-compute merged items for all days so the render loop doesn't recompute on unrelated state changes (e.g. hover)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mergedItemsMap = useMemo(() => {
    const map: Record<number, ReturnType<typeof getMergedItems>> = {}
    days.forEach(day => { map[day.id] = getMergedItems(day.id) })
    return map
  // getMergedItems is redefined each render but captures assignments/dayNotes/reservations/days via closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, assignments, dayNotes, reservations, transportPosVersion, mirrorServiceStops])

  // Days whose inline route legs should be computed & shown. Desktop: the selected
  // day while the Route toggle is on. Mobile: each expanded day the user tapped
  // "Route" on — shown inline so seeing distances between places doesn't require
  // selecting the day, which would close the mobile sheet (#1374).
  const routeDayIds = useMemo<number[]>(() => (
    showRouteToolsWhenExpanded
      ? days.filter(d => expandedRouteDayIds.has(d.id) && expandedDays.has(d.id)).map(d => d.id)
      : (routeShown && selectedDayId ? [selectedDayId] : [])
  ), [showRouteToolsWhenExpanded, expandedRouteDayIds, expandedDays, days, routeShown, selectedDayId])
  const routeDayKey = routeDayIds.join(',')

  // Per-segment travel times shown as connectors between a day's located stops.
  // Groups located places into runs (split at transports), one cached OSRM call per
  // run keyed by the start place's assignment id, plus the hotel bookend legs. Shares
  // RouteCalculator's cache with the map. Runs for every day in routeDayIds — one
  // selected day on desktop, each Route-toggled day on mobile (#1374).
  useEffect(() => {
    if (legsAbortRef.current) legsAbortRef.current.abort()
    if (routeDayIds.length === 0) { setRouteLegs({}); setHotelLegs({}); return }

    const hotelName = (a: Accommodation) => (a as any).place_name || (a as any).reservation_title || ''

    // Pure per-day plan: the drive runs (each ≥2 waypoints) and which hotel bookend
    // legs to draw. Side-effect free, so the async loop below only does OSRM I/O.
    const planDay = (dayId: number) => {
      const merged = mergedItemsMap[dayId] || []
      // Each run point carries the ORIGIN assignment's per-segment travel mode
      // (#1281): the leg from this point to the next is routed with `mode` (null =
      // inherit the day default). Transport endpoints carry no mode → day default.
      const runs: { id: number; lat: number; lng: number; isPlace: boolean; leg_transport_mode?: string | null; incoming_leg_transport_mode?: string | null }[][] = []
      let cur: { id: number; lat: number; lng: number; isPlace: boolean; leg_transport_mode?: string | null; incoming_leg_transport_mode?: string | null }[] = []
      // A run is only a real drive when it holds an actual place. Two back-to-back
      // transports (e.g. two flights on one day) would otherwise pair the first's
      // arrival with the second's departure into a phantom airport→airport leg — the
      // flight, not a drive — and surface it as a bogus connector distance (#1394).
      let curHasPlace = false
      for (const it of merged) {
        // A stop out of the route (#2532) is passed by, like a note.
        if (it.type === 'place' && it.data.route_excluded) continue
        if (it.type === 'place' && it.data.place?.lat && it.data.place?.lng) {
          // Mirror of the guard below: the open run may hold nothing but a far-away
          // arrival endpoint, which is no more drivable in this direction (#2133).
          const prev = cur[cur.length - 1]
          if (prev && !prev.isPlace && !withinDriveRange(prev, { lat: it.data.place.lat, lng: it.data.place.lng })) {
            if (cur.length >= 2 && curHasPlace) runs.push(cur)
            cur = []
            curHasPlace = false
          }
          cur.push({ id: it.data.id, lat: it.data.place.lat, lng: it.data.place.lng, isPlace: true, leg_transport_mode: it.data.leg_transport_mode ?? null, incoming_leg_transport_mode: it.data.incoming_leg_transport_mode ?? null })
          curHasPlace = true
        } else if (it.type === 'transport') {
          const r = it.data
          const { from, to } = getTransportRouteEndpoints(r, dayId)
          if (from || to) {
            // Located transport: route to its departure point, break the run (the
            // flight/train itself isn't driven), and let its arrival start the next.
            // ...but only when you could have driven there from the stop before it. A
            // long-haul departure airport that sorted in after the day's local stops is
            // not the end of a drive, and pairing them produces a phantom connector with
            // an ocean-crossing distance (#2133).
            const prev = cur[cur.length - 1]
            if (from && (!prev || withinDriveRange(prev, from))) cur.push({ id: r.id, lat: from.lat, lng: from.lng, isPlace: false })
            if (cur.length >= 2 && curHasPlace) runs.push(cur)
            cur = []
            curHasPlace = false
            if (to) cur.push({ id: r.id, lat: to.lat, lng: to.lng, isPlace: false })
          } else if (cur.length > 0 && !(r.type === 'car' && getSpanPhase(r, dayId) === 'middle') && !hidesOnMiddleDay(r, dayId)) {
            // No location: ignore for routing, but attribute the through-leg to the
            // booking so its distance/duration shows under it (purely cosmetic).
            // Not for a car rental's middle days or a multi-day parking's though:
            // those rows aren't rendered in the timeline, so re-keying would drop
            // the leg entirely (#1504).
            cur[cur.length - 1] = { ...cur[cur.length - 1], id: r.id }
          }
        }
      }
      if (cur.length >= 2 && curHasPlace) runs.push(cur)

      // Hotel bookend legs: the drive from the day's accommodation to the first located
      // waypoint of the day (morning) and from the last one back to it (evening). Only when
      // the "optimize from accommodation" setting is on and the day has a hotel.
      const day = days.find(d => d.id === dayId)
      const bookends = day && optimizeFromAccommodation !== false
        ? getDayBookendHotels(day, days, accommodations)
        : null
      const startHotel = bookends?.morning
      const endHotel = bookends?.evening
      // Waypoints include transport endpoints (a car return, a taxi/train arrival), so the hotel
      // legs connect even when the day starts or ends with a booking rather than a place. Track
      // whether each is a place and its time so the bookend decision can drop a leg that isn't
      // real: a check-in hotel never drove to a departure airport (#1321), and a place timed before
      // check-in / after check-out means you weren't at the hotel then (#1465).
      // A carrier endpoint (flight/train/ferry/cruise/coach — not a hire car you keep
      // driving) also records WHICH end it is, so the hotel leg can be dropped when it
      // is one you flew out of or landed at rather than drove between (#2133).
      const wayPts: { lat: number; lng: number; isPlace: boolean; time: string | null; carrierEdge?: CarrierEdge; leg_transport_mode?: string | null; incoming_leg_transport_mode?: string | null; id?: number }[] = []
      for (const it of merged) {
        if (it.type === 'place' && it.data.place?.lat && it.data.place?.lng && !it.data.route_excluded) {
          wayPts.push({ lat: it.data.place.lat, lng: it.data.place.lng, isPlace: true, time: it.data.place?.place_time ?? null, leg_transport_mode: it.data.leg_transport_mode ?? null, incoming_leg_transport_mode: it.data.incoming_leg_transport_mode ?? null, id: it.data.id })
        } else if (it.type === 'transport') {
          const { from, to } = getTransportRouteEndpoints(it.data, dayId)
          const carrier = isCarrierTransport(it.data)
          if (from) wayPts.push({ lat: from.lat, lng: from.lng, isPlace: false, time: null, carrierEdge: carrier ? 'departure' : null })
          if (to) wayPts.push({ lat: to.lat, lng: to.lng, isPlace: false, time: null, carrierEdge: carrier ? 'arrival' : null })
        }
      }
      const firstWay = wayPts[0]
      const lastWay = wayPts[wayPts.length - 1]
      const reachable = (h: { place_lat?: number | null; place_lng?: number | null } | undefined, w: typeof firstWay) =>
        !h || !w || w.isPlace || h.place_lat == null || h.place_lng == null
        || withinDriveRange({ lat: h.place_lat, lng: h.place_lng }, w)
      // Same carrier evidence the map route uses (#2157): with a located carrier
      // endpoint on the day, the no-time default must not open a hotel leg.
      const dayHasCarrier = wayPts.some(w => w.carrierEdge != null)
      const wantTop = !!(startHotel && firstWay && bookends && day && shouldDrawMorningLeg(bookends, day, firstWay, dayHasCarrier)) && reachable(startHotel, firstWay)
      const wantBottom = !!(endHotel && lastWay && bookends && day && shouldDrawEveningLeg(bookends, day, lastWay, dayHasCarrier)) && reachable(endHotel, lastWay)
      return { runs, startHotel, endHotel, firstWay, lastWay, wantTop, wantBottom }
    }

    const controller = new AbortController()
    legsAbortRef.current = controller
    void (async () => {
      const legsByDay: Record<number, Record<number, RouteSegment>> = {}
      const hotelByDay: Record<number, { top?: { seg: RouteSegment; name: string; targetId?: number }; bottom?: { seg: RouteSegment; name: string; targetId?: number } }> = {}

      // One cached OSRM/plugin call per waypoint pair; shares RouteCalculator's cache.
      // tripId/dayId ride along for plugin route profiles (the server access-checks them).
      // Resolve a leg's mode (#1281): an explicit per-segment override wins, then
      // the day's saved default, then the live picker value. Sticky by design — the
      // day default never touches a leg that carries its own mode.
      const dayDefaultMode = (dayId: number): string =>
        days.find(d => d.id === dayId)?.default_transport_mode || routeProfile

      const legBetween = async (a: { lat: number; lng: number }, b: { lat: number; lng: number }, dayId: number, mode: string): Promise<RouteSegment | undefined> => {
        try {
          const r = await calculateRouteWithLegs([a, b], { signal: controller.signal, profile: mode, tripId, dayId })
          return r.legs[0] ? { ...r.legs[0], mode } : undefined
        } catch { return undefined }
      }

      // Collect every leg of every day first, then fetch them a few at a time.
      // Each result is stored under its own key, so nothing here depends on the
      // order they come back in — which is what lets them overlap at all.
      const tasks: (() => Promise<void>)[] = []

      for (const dayId of routeDayIds) {
        const { runs, startHotel, endHotel, firstWay, lastWay, wantTop, wantBottom } = planDay(dayId)
        const dfMode = dayDefaultMode(dayId)
        const dayLegs: Record<number, RouteSegment> = {}
        legsByDay[dayId] = dayLegs
        for (const run of runs) {
          // One routing call per LEG, each with its own resolved mode, so a day can
          // mix walking/driving/plugin legs. RouteCalculator's cache is keyed per
          // profile+coords, so per-leg calls stay cheap (a single-mode day reuses
          // the same entries) and each leg is tagged with the mode it was drawn in.
          for (let i = 0; i < run.length - 1; i++) {
            const from = run[i]
            const to = run[i + 1]
            const mode = resolveLegMode(from, to, dfMode)
            tasks.push(async () => {
              const seg = await legBetween({ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }, dayId, mode)
              if (seg) dayLegs[from.id] = seg
            })
          }
        }
        const hotel: { top?: { seg: RouteSegment; name: string; targetId?: number }; bottom?: { seg: RouteSegment; name: string; targetId?: number } } = {}
        hotelByDay[dayId] = hotel
        if (wantTop) {
          const mode = resolveLegMode({ isPlace: false }, firstWay!, dfMode)
          tasks.push(async () => {
            const seg = await legBetween({ lat: startHotel!.place_lat as number, lng: startHotel!.place_lng as number }, { lat: firstWay!.lat, lng: firstWay!.lng }, dayId, mode)
            if (seg) hotel.top = { seg, name: hotelName(startHotel!), targetId: firstWay!.isPlace ? firstWay!.id : undefined }
          })
        }
        if (wantBottom) {
          const mode = resolveLegMode(lastWay!, { isPlace: false }, dfMode)
          tasks.push(async () => {
            const seg = await legBetween({ lat: lastWay!.lat, lng: lastWay!.lng }, { lat: endHotel!.place_lat as number, lng: endHotel!.place_lng as number }, dayId, mode)
            if (seg) hotel.bottom = { seg, name: hotelName(endHotel!), targetId: lastWay!.isPlace ? lastWay!.id : undefined }
          })
        }
      }

      // Small pool on purpose: a week of days is dozens of legs and the routing
      // host is often a shared OSRM.
      let nextTask = 0
      const runTasks = async () => {
        while (nextTask < tasks.length && !controller.signal.aborted) await tasks[nextTask++]()
      }
      await Promise.all(Array.from({ length: Math.min(6, tasks.length) }, runTasks))

      if (controller.signal.aborted) return
      // Days that ended up without a single leg were never in the map before.
      for (const dayId of Object.keys(legsByDay).map(Number)) {
        if (!Object.keys(legsByDay[dayId]).length) delete legsByDay[dayId]
      }
      for (const dayId of Object.keys(hotelByDay).map(Number)) {
        if (!hotelByDay[dayId].top && !hotelByDay[dayId].bottom) delete hotelByDay[dayId]
      }
      setRouteLegs(legsByDay)
      setHotelLegs(hotelByDay)
    })()
    // routeDayIds is memoized from the same inputs as routeDayKey below, so keying the
    // effect on the string is equivalent while staying stable across unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeDayKey, routeProfile, mergedItemsMap, accommodations, days, optimizeFromAccommodation, distanceUnit])

  const openAddNote = (dayId, e) => {
    e?.stopPropagation()
    _openAddNote(dayId, getMergedItems, (id) => {
      if (!expandedDays.has(id)) setExpandedDays(prev => new Set([...prev, id]))
    })
  }

  const openEditNote = (dayId: number, note: DayNote) => _openEditNote(dayId, note)

  // Deleting a note asks for confirmation first — the edit/delete icons sit close together and are
  // easy to mis-tap on touch devices, where an accidental delete was previously unrecoverable.
  const [pendingDeleteNote, setPendingDeleteNote] = useState<{ dayId: number; noteId: number } | null>(null)

  const deleteNote = (dayId: number, noteId: number) => _deleteNote(dayId, noteId)

  // Unified reorder: assigns positions to ALL item types based on new visual order
  const applyMergedOrder = async (dayId: number, newOrder: { type: string; data: any }[]) => {
    // Capture previous place order for undo
    const prevAssignmentIds = (assignments[String(dayId)] || []).slice().sort((a, b) => a.order_index - b.order_index).map(a => a.id)
    // …and, per booking, the fields this call is about to overwrite, so a failed write
    // can put the visible order back instead of leaving a phantom one behind the error
    // toast. Restoring the whole array instead would also drop what a collaborator's
    // socket event applied while the requests were in flight.
    const pendingRollback: (Partial<Reservation> & { id: number })[] = []
    const dropRollback = (id: number) => {
      const i = pendingRollback.findIndex(p => p.id === id)
      if (i >= 0) pendingRollback.splice(i, 1)
    }
    const rollBackReservations = () => {
      if (!pendingRollback.length) return
      useTripStore.setState(state => ({
        reservations: state.reservations.map(r => {
          const p = pendingRollback.find(x => x.id === r.id)
          return p ? { ...r, ...p } : r
        })
      }))
      setTransportPosVersion(v => v + 1)
    }

    // Places get sequential integer positions (0, 1, 2, ...)
    // Non-place items between place N-1 and place N get fractional positions
    const assignmentIds: number[] = []
    const noteUpdates: { id: number; sort_order: number }[] = []
    const transportUpdates: { id: number; day_plan_position: number }[] = []
    // Multi-leg flight legs share a reservation id, so their positions can't live in
    // the single per-booking slot — collect them per leg, keyed reservationId → legIndex → pos.
    const legPosUpdates: Record<number, Record<number, number>> = {}

    let placeCount = 0
    let i = 0
    while (i < newOrder.length) {
      if (newOrder[i].type === 'place') {
        assignmentIds.push(newOrder[i].data.id)
        placeCount++
        i++
      } else {
        // Collect consecutive non-place items
        const group: { type: string; data: any }[] = []
        while (i < newOrder.length && newOrder[i].type !== 'place') {
          group.push(newOrder[i])
          i++
        }
        // Fractional positions between (placeCount-1) and placeCount
        const base = placeCount > 0 ? placeCount - 1 : -1
        group.forEach((g, idx) => {
          const pos = base + (idx + 1) / (group.length + 1)
          if (g.type === 'note') noteUpdates.push({ id: g.data.id, sort_order: pos })
          else if (g.type === 'transport') {
            if (g.data.__leg) ((legPosUpdates[g.data.id] ??= {})[g.data.__leg.index] = pos)
            else transportUpdates.push({ id: g.data.id, day_plan_position: pos })
          }
        })
      }
    }

    try {
      // Update transport positions in store FIRST so the useEffect triggered by
      // onReorder's optimistic assignment update reads the correct positions.
      if (transportUpdates.length) {
        for (const tu of transportUpdates) {
          const r = useTripStore.getState().reservations.find(x => x.id === tu.id)
          if (r) pendingRollback.push({ id: r.id, day_plan_position: r.day_plan_position, day_positions: r.day_positions })
        }
        useTripStore.setState(state => ({
          reservations: state.reservations.map(r => {
            const tu = transportUpdates.find(u => u.id === r.id)
            if (!tu) return r
            const day_positions = { ...(r.day_positions || {}), [dayId]: tu.day_plan_position }
            return { ...r, day_plan_position: tu.day_plan_position, day_positions }
          })
        }))
        setTransportPosVersion(v => v + 1)
      }
      // Per-leg positions of multi-leg flights live in metadata.legs[i].day_positions
      // (the single per-booking slot can't hold one position per leg).
      const legResIds = Object.keys(legPosUpdates)
      if (legResIds.length) {
        for (const ridStr of legResIds) {
          const rid = Number(ridStr)
          const r = useTripStore.getState().reservations.find(x => x.id === rid)
          if (!r) continue
          let parsed: any = {}
          try { parsed = typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : (r.metadata || {}) } catch { parsed = {} }
          if (!Array.isArray(parsed.legs)) continue
          const legs = parsed.legs.map((leg: any, i: number) => {
            const pos = legPosUpdates[rid][i]
            return pos == null ? leg : { ...leg, day_positions: { ...(leg.day_positions || {}), [dayId]: pos } }
          })
          // Send metadata as an OBJECT (like the form does) — passing a JSON string
          // here double-encodes it on the server, which wipes metadata.legs on read
          // and collapses the flight back to a single span.
          const newMeta = { ...parsed, legs }
          pendingRollback.push({ id: rid, metadata: r.metadata })
          useTripStore.setState(state => ({ reservations: state.reservations.map(x => (x.id === rid ? { ...x, metadata: newMeta } : x)) }))
          await tripActions.updateReservation(tripId, rid, { metadata: newMeta })
          // Stored, so a later step failing must not put the old legs back.
          dropRollback(rid)
        }
        setTransportPosVersion(v => v + 1)
      }
      if (assignmentIds.length) await onReorder(dayId, assignmentIds)
      if (transportUpdates.length) {
        onRouteRefresh?.()
        await reservationsApi.updatePositions(tripId, transportUpdates, dayId)
        for (const tu of transportUpdates) dropRollback(tu.id)
      }
      for (const n of noteUpdates) {
        await tripActions.updateDayNote(tripId, dayId, n.id, { sort_order: n.sort_order })
      }
      if (prevAssignmentIds.length) {
        const capturedDayId = dayId
        const capturedPrevIds = prevAssignmentIds
        pushUndo?.(t('undo.reorder'), async () => {
          await tripActions.reorderAssignments(tripId, capturedDayId, capturedPrevIds)
        }, [capturedDayId])
      }
    } catch (err: unknown) {
      rollBackReservations()
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }

  const handleMergedDrop = async (dayId, fromType, fromId, toType, toId, insertAfter = false, toLegIndex = null) => {
    const m = getMergedItems(dayId)
    // Multi-leg flights expose one item per leg sharing the same reservation id;
    // disambiguate the drop target by leg index so you can drop BETWEEN legs.
    const matchTo = (i: any) => i.type === toType && i.data.id === toId && (toLegIndex == null || i.data?.__leg?.index === toLegIndex)

    // Check if a timed place is being moved → would it break chronological order?
    if (fromType === 'place') {
      const fromItem = m.find(i => i.type === 'place' && i.data.id === fromId)
      const fromMinutes = parseTimeToMinutes(fromItem?.data?.place?.place_time)
      if (fromItem && fromMinutes !== null) {
        const fromIdx = m.findIndex(i => i.type === fromType && i.data.id === fromId)
        const toIdx = m.findIndex(matchTo)
        if (fromIdx !== -1 && toIdx !== -1) {
          const simulated = [...m]
          const [moved] = simulated.splice(fromIdx, 1)
          let insertIdx = simulated.findIndex(matchTo)
          if (insertIdx === -1) insertIdx = simulated.length
          if (insertAfter) insertIdx += 1
          simulated.splice(insertIdx, 0, moved)

          const timedInOrder = simulated
            .map(i => {
              if (i.type === 'transport') return parseTimeToMinutes(i.data?.reservation_time)
              if (i.type === 'place') return parseTimeToMinutes(i.data?.place?.place_time)
              return null
            })
            .filter(t => t !== null)
          const isChronological = timedInOrder.every((t, i) => i === 0 || t >= timedInOrder[i - 1])

          if (!isChronological) {
            const placeTime = fromItem.data.place.place_time
            const timeStr = placeTime.includes(':') ? placeTime.substring(0, 5) : placeTime
            setTimeConfirm({ dayId, fromType, fromId, toType, toId, insertAfter, toLegIndex, time: timeStr })
            setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
            return
          }
        }
      }
    }

    // Build new order: remove the dragged item, insert at target position
    const fromIdx = m.findIndex(i => i.type === fromType && i.data.id === fromId)
    const toIdx = m.findIndex(matchTo)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) {
      setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
      return
    }

    const newOrder = [...m]
    const [moved] = newOrder.splice(fromIdx, 1)
    let adjustedTo = newOrder.findIndex(matchTo)
    if (adjustedTo === -1) adjustedTo = newOrder.length
    if (insertAfter) adjustedTo += 1
    newOrder.splice(adjustedTo, 0, moved)

    await applyMergedOrder(dayId, newOrder)
    setDraggingId(null)
    setDropTargetKey(null)
    dragDataRef.current = null
  }

  const confirmTimeRemoval = async () => {
    if (!timeConfirm) return
    const saved = { ...timeConfirm }
    const { dayId, fromId, fromType, toType, toId, insertAfter, toLegIndex } = saved
    setTimeConfirm(null)

    // Remove time from assignment
    try {
      await assignmentsApi.updateTime(tripId, fromId, { place_time: null, end_time: null })
      const key = String(dayId)
      const currentAssignments = { ...assignments }
      if (currentAssignments[key]) {
        currentAssignments[key] = currentAssignments[key].map(a =>
          a.id === fromId ? { ...a, place: { ...a.place, place_time: null, end_time: null } } : a
        )
        tripActions.setAssignments(currentAssignments)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      return
    }

    // Re-apply the pending move against the current merged list
    const m = getMergedItems(dayId)

    if (fromType && toType) {
      const matchTo = (i: any) => i.type === toType && i.data.id === toId && (toLegIndex == null || i.data?.__leg?.index === toLegIndex)
      const fromIdx = m.findIndex(i => i.type === fromType && i.data.id === fromId)
      const toIdx = m.findIndex(matchTo)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return

      const newOrder = [...m]
      const [moved] = newOrder.splice(fromIdx, 1)
      let adjustedTo = newOrder.findIndex(matchTo)
      if (adjustedTo === -1) adjustedTo = newOrder.length
      if (insertAfter) adjustedTo += 1
      newOrder.splice(adjustedTo, 0, moved)

      await applyMergedOrder(dayId, newOrder)
    }
  }

  const moveNote = async (dayId, noteId, direction) => {
    await _moveNote(dayId, noteId, direction, getMergedItems)
  }

  const toggleLock = (assignmentId) => {
    const prevLocked = new Set(lockedIds)
    setLockedIds(prev => {
      const next = new Set(prev)
      if (next.has(assignmentId)) next.delete(assignmentId)
      else next.add(assignmentId)
      return next
    })
    pushUndo?.(t('undo.lock'), () => { setLockedIds(prevLocked) })
  }

  const handleOptimize = async (dayId: number) => {
    const da = getDayAssignments(dayId)
    if (da.length < 3) return

    const prevIds = (assignments[String(dayId)] || []).slice().sort((a, b) => a.order_index - b.order_index).map(a => a.id)

    // Separate fixed (stay at their index) and movable assignments. A place is
    // fixed if it's locked OR has a set time — timed places are anchored by their
    // time, so the optimizer must not reshuffle them.
    const locked = new Map() // index -> assignment
    const unlocked = []
    da.forEach((a, i) => {
      if (lockedIds.has(a.id) || a.place?.place_time) locked.set(i, a)
      else unlocked.push(a)
    })

    // Optimize only unlocked assignments (work on assignments, not places)
    const unlockedWithCoords = unlocked.filter(a => a.place?.lat && a.place?.lng)
    const unlockedNoCoords = unlocked.filter(a => !a.place?.lat || !a.place?.lng)
    // Anchor the route on the day's accommodation (when enabled): a loop out from and back to the
    // hotel, or — on a transfer day — a run from the hotel you leave to the one you arrive at.
    const day = days.find(d => d.id === dayId)
    const anchors = day && useSettingsStore.getState().settings.optimize_from_accommodation !== false
      ? getAccommodationAnchors(
          day, days, accommodations,
          unlockedWithCoords.map(a => ({ lat: a.place!.lat!, lng: a.place!.lng! })),
          (mergedItemsMap[dayId] || []).some(i => i.type === 'transport' && hasCarrierEndpointOnDay(i.data, dayId)),
        )
      : {}
    const optimizedAssignments = unlockedWithCoords.length >= 2
      ? optimizeRoute(unlockedWithCoords.map(a => ({ ...a.place, _assignmentId: a.id })), anchors).map(p => unlockedWithCoords.find(a => a.id === p._assignmentId)).filter(Boolean)
      : unlockedWithCoords
    const optimizedQueue = [...optimizedAssignments, ...unlockedNoCoords]

    // Merge: locked stay at their index, fill gaps with optimized
    const result = new Array(da.length)
    locked.forEach((a, i) => { result[i] = a })
    let qi = 0
    for (let i = 0; i < result.length; i++) {
      if (!result[i]) result[i] = optimizedQueue[qi++]
    }

    await onReorder(dayId, result.map(a => a.id))
    const usedHotel = !!(anchors.start || anchors.end)
    toast.success(usedHotel ? t('dayplan.toast.routeOptimizedFromHotel') : t('dayplan.toast.routeOptimized'))
    const capturedDayId = dayId
    pushUndo?.(t('undo.optimize'), async () => {
      await tripActions.reorderAssignments(tripId, capturedDayId, prevIds)
    }, [capturedDayId])
  }


  const handleDropOnDay = (e, dayId) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverDayId(null)
    const { placeId, assignmentId, noteId, reservationId: fromReservationId, fromDayId, phase } = getDragData(e)
    if (fromReservationId && fromDayId !== dayId) {
      const r = reservations.find(x => x.id === Number(fromReservationId))
      if (r) { const update = computeMultiDayMove(r, dayId, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
      setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; window.__dragData = null; return
    }
    if (placeId) {
      onAssignToDay?.(Number.parseInt(placeId), dayId)
    } else if (assignmentId && fromDayId !== dayId) {
      const srcAssignment = (useTripStore.getState().assignments[String(fromDayId)] || []).find(a => a.id === Number(assignmentId))
      const capturedFromDayId = fromDayId
      const capturedOrderIndex = srcAssignment?.order_index ?? 0
      moveToDay(Number(assignmentId), fromDayId, dayId)
        .then(() => {
          pushUndo?.(t('undo.moveDay'), async () => {
            await tripActions.moveAssignment(tripId, Number(assignmentId), dayId, capturedFromDayId, capturedOrderIndex)
          }, [Number(dayId), Number(capturedFromDayId)])
        })
        .catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
    } else if (noteId && fromDayId !== dayId) {
      tripActions.moveDayNote(tripId, fromDayId, dayId, Number(noteId)).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
    }
    setDraggingId(null)
    setDropTargetKey(null)
    dragDataRef.current = null
    window.__dragData = null
  }

  // Total Cost reads the expenses in Costs when it is on (#2551).
  const budgetItems = useTripStore(s => s.budgetItems)
  const costsEnabled = useAddonStore(s => s.isEnabled('budget'))
  const totalCostLabel = useMemo(() => {
    const costs = planCosts({ days, assignments, reservations, budgetItems, costsEnabled, tripCurrency: currency })
    return formatMoneySum(costs.total, costBase, locale, fxRates)
  }, [days, assignments, reservations, budgetItems, costsEnabled, currency, costBase, locale, fxRates])

  return {
    tripId,
    trip,
    days,
    places,
    categories,
    assignments,
    selectedDayId,
    selectedPlaceId,
    selectedAssignmentId,
    onSelectDay,
    onPlaceClick,
    onDayDetail,
    accommodations,
    onReorder,
    onReorderDays,
    onAddDay,
    dayAdd,
    onDeleteDay,
    deleteDayQuestion,
    onAssignToDay,
    onRemoveAssignment,
    onEditPlace,
    onDeletePlace,
    reservations,
    visibleConnectionIds,
    onToggleConnection,
    allConnectionsShown,
    onToggleAllConnections,
    externalTransportDetail,
    onExternalTransportDetailHandled,
    onAddReservation,
    onAddPlace,
    onAddPlaceToDay,
    onCreatePlaceForDay,
    onNavigateToFiles,
    routeShown,
    routeProfile,
    onToggleRoute,
    onSetRouteProfile,
    onExpandedDaysChange,
    pushUndo,
    canUndo,
    lastActionLabel,
    onUndo,
    onRouteRefresh,
    onAddTransport,
    onAddAccommodation,
    onPlanTransit,
    onPlanTransitLeg,
    onOpenTransit,
    onEditTransport,
    expandedTransitIds,
    setExpandedTransitIds,
    onEditReservation,
    onOpenBooking,
    onAddBookingToAssignment,
    initialScrollTop,
    onScrollTopChange,
    showRouteToolsWhenExpanded,
    isMobile,
    dragDisabled,
    toast,
    t,
    language,
    locale,
    ctxMenu,
    timeFormat,
    tripActions,
    can,
    canEditDays,
    canEditPlaces,
    canManageShare,
    noteUi,
    setNoteUi,
    noteInputRef,
    dayNotes,
    openAddNote,
    openEditNote,
    cancelNote,
    saveNote,
    deleteNote,
    pendingDeleteNote,
    setPendingDeleteNote,
    moveNote,
    expandedDays,
    setExpandedDays,
    routeLegs,
    setRouteLegs,
    hotelLegs,
    setHotelLegs,
    legsAbortRef,
    draggingId,
    setDraggingId,
    lockedIds,
    setLockedIds,
    lockHoverId,
    setLockHoverId,
    undoHover,
    setUndoHover,
    hoveredAssignmentId,
    setHoveredAssignmentId,
    dropTargetKey,
    _setDropTargetKey,
    dropTargetRef,
    setDropTargetKey,
    dragOverDayId,
    setDragOverDayId,
    transportDetail,
    setTransportDetail,
    transportPosVersion,
    setTransportPosVersion,
    timeConfirm,
    setTimeConfirm,
    dragDataRef,
    scrollContainerRef,
    dayRefs,
    initedTransportIds,
    lastAutoScrolledIdRef,
    getDragData,
    prevDayCount,
    toggleDay,
    getSpanLabel,
    getDayOrder,
    computeMultiDayMove,
    getTransportForDay,
    getActiveRentalsForDay,
    getDayAssignments,
    computeTransportPosition,
    initTransportPositions,
    getMergedItems,
    storedPositionBefore,
    placeBelowNote,
    moveToDay,
    mergedItemsMap,
    applyMergedOrder,
    handleMergedDrop,
    confirmTimeRemoval,
    toggleLock,
    handleOptimize,
    handleDropOnDay,
    totalCostLabel,
    expandedRouteDayIds,
    setExpandedRouteDayIds,
  }
}

/**
 * Below this the plan sidebar has no room for a word on the route button.
 *
 * The word goes early on purpose: it shares its row with two export buttons and
 * an optimise button, and a "Route" squeezed to four letters and an ellipsis is
 * worse than the icon that means the same thing. The icon keeps the accessible
 * name, so nothing is lost but the letters.
 */
const NARROW_PLAN_PX = 320

const DayPlanSidebar = React.memo(function DayPlanSidebar(props: DayPlanSidebarProps) {
  const S = useDayPlanSidebar(props)
  const onClearDay = props.onClearDay
  // The plan sidebar is resizable. Below this the route button's own word is the
  // first thing that stops fitting beside the two export buttons — the icon says
  // the same thing, and the accessible name still spells it out.
  //
  // A callback ref rather than `useRef`, so the measurement happens when the
  // element exists rather than on a mount that may render nothing yet.
  const [panel, setPanel] = useState<HTMLElement | null>(null)
  const [narrowPanel, setNarrowPanel] = useState(false)
  useEffect(() => {
    if (!panel || typeof ResizeObserver === 'undefined') return
    const measure = (): void => setNarrowPanel(panel.clientWidth < NARROW_PLAN_PX)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(panel)
    return () => ro.disconnect()
  }, [panel])
  // A stable key for the current selection. A multi-day place renders one row per
  // day (same place_id, different assignment ids); selecting it by place_id alone
  // (e.g. clicking an accommodation) marks every one of those rows selected, so a
  // per-assignment scroll-lock would let each day's row scroll the list in turn.
  // Keying the lock on the selection identity makes only the first row scroll (#1375).
  const selectionScrollKey = S.selectedAssignmentId != null ? `a${S.selectedAssignmentId}` : S.selectedPlaceId != null ? `p${S.selectedPlaceId}` : null
  // Needed by the route-tools visibility gate in the render below (#1330); the hook
  // keeps its own copy, so read it reactively here in the component scope too.
  const optimizeFromAccommodation = useSettingsStore(s => s.settings.optimize_from_accommodation)
  const dateFirst = useSettingsStore(s => s.settings.day_date_first === true)
  const collectionsEnabled = useAddonStore(s => s.isEnabled('collections'))
  // Plugin time contributions in the day plan (dayScheduleProvider hook).
  const daySchedule = usePluginDaySchedule(S.tripId)
  // Per-day colours from the dayTintProvider hook — e.g. which leg of the trip a
  // day belongs to. Empty unless a granted plugin provides them.
  const dayTints = usePluginDayTints(S.tripId)
  const routeProfileOptions = useRouteModeOptions()
  const {
    tripId,
    trip,
    days,
    places,
    categories,
    assignments,
    selectedDayId,
    selectedPlaceId,
    selectedAssignmentId,
    onSelectDay,
    onPlaceClick,
    onDayDetail,
    accommodations,
    onReorder,
    onReorderDays,
    onAddDay,
    dayAdd,
    onDeleteDay,
    deleteDayQuestion,
    onAssignToDay,
    onRemoveAssignment,
    onEditPlace,
    onDeletePlace,
    reservations,
    visibleConnectionIds,
    onToggleConnection,
    allConnectionsShown,
    onToggleAllConnections,
    externalTransportDetail,
    onExternalTransportDetailHandled,
    onAddReservation,
    onAddPlace,
    onAddPlaceToDay,
    onCreatePlaceForDay,
    onNavigateToFiles,
    routeShown,
    routeProfile,
    onToggleRoute,
    onSetRouteProfile,
    onExpandedDaysChange,
    pushUndo,
    canUndo,
    lastActionLabel,
    onUndo,
    onRouteRefresh,
    onAddTransport,
    onAddAccommodation,
    onPlanTransit,
    onPlanTransitLeg,
    onOpenTransit,
    onEditTransport,
    expandedTransitIds,
    setExpandedTransitIds,
    onEditReservation,
    onOpenBooking,
    onAddBookingToAssignment,
    initialScrollTop,
    onScrollTopChange,
    showRouteToolsWhenExpanded,
    isMobile,
    dragDisabled,
    toast,
    t,
    language,
    locale,
    ctxMenu,
    timeFormat,
    tripActions,
    can,
    canEditDays,
    canEditPlaces,
    canManageShare,
    noteUi,
    setNoteUi,
    noteInputRef,
    dayNotes,
    openAddNote,
    openEditNote,
    cancelNote,
    saveNote,
    deleteNote,
    pendingDeleteNote,
    setPendingDeleteNote,
    moveNote,
    expandedDays,
    setExpandedDays,
    routeLegs,
    setRouteLegs,
    hotelLegs,
    setHotelLegs,
    legsAbortRef,
    draggingId,
    setDraggingId,
    lockedIds,
    setLockedIds,
    lockHoverId,
    setLockHoverId,
    undoHover,
    setUndoHover,
    hoveredAssignmentId,
    setHoveredAssignmentId,
    dropTargetKey,
    _setDropTargetKey,
    dropTargetRef,
    setDropTargetKey,
    dragOverDayId,
    setDragOverDayId,
    transportDetail,
    setTransportDetail,
    transportPosVersion,
    setTransportPosVersion,
    timeConfirm,
    setTimeConfirm,
    dragDataRef,
    scrollContainerRef,
    dayRefs,
    initedTransportIds,
    lastAutoScrolledIdRef,
    getDragData,
    prevDayCount,
    toggleDay,
    getSpanLabel,
    getDayOrder,
    computeMultiDayMove,
    getTransportForDay,
    getActiveRentalsForDay,
    getDayAssignments,
    computeTransportPosition,
    initTransportPositions,
    getMergedItems,
    storedPositionBefore,
    placeBelowNote,
    moveToDay,
    mergedItemsMap,
    applyMergedOrder,
    handleMergedDrop,
    confirmTimeRemoval,
    toggleLock,
    handleOptimize,
    handleDropOnDay,
    totalCostLabel,
    expandedRouteDayIds,
    setExpandedRouteDayIds,
  } = S
  // Stays still waiting for their booking to be confirmed, for the day pills (#2281).
  const pendingStays = useMemo(() => pendingStayIds(reservations), [reservations])
  // Rows that can be dragged lead with a grip; the rest keep its room so every tile lines up.
  const gripsShown = canEditDays && !dragDisabled

  // ── Per-segment / per-day travel mode (#1281) ──────────────────────────────
  const modeIcon = routeModeIcon

  // Set the mode of the leg LEAVING this stop. Optimistic (the connector + map
  // recompute from the store), then persisted; null clears the override so the leg
  // falls back to the day default. The whole-day picker never writes here — that is
  // what keeps a chosen segment sticky against the Foot/Car button (#1281).
  const setLegMode = (assignmentId: number, dayId: number, mode: string | null) => {
    const key = String(dayId)
    if (assignments[key]) {
      tripActions.setAssignments({
        ...assignments,
        [key]: assignments[key].map(a => (a.id === assignmentId ? { ...a, leg_transport_mode: mode } : a)),
      })
    }
    assignmentsApi.updateTransport(tripId, assignmentId, mode).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      void tripActions.refreshDays(tripId)
    })
  }

  // The whole-day default (the Car/Foot picker). Persisted so it survives a reload,
  // and mirrored into routeProfile so the live map redraws at once. Legs that carry
  // their own mode are left untouched.
  const setDayDefaultMode = (dayId: number, mode: string) => {
    useTripStore.setState(state => ({ days: state.days.map(d => (d.id === dayId ? { ...d, default_transport_mode: mode } : d)) }))
    onSetRouteProfile?.(mode)
    daysApi.updateTransport(tripId, dayId, mode).catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      void tripActions.refreshDays(tripId)
    })
  }

  // Coordinates back to names for the transit search, over every located place,
  // hotel and booking endpoint on the trip (see transitLeg.ts).
  const transitNameIndex = useMemo(
    () => buildTransitNameIndex(assignments, accommodations, reservations),
    [assignments, accommodations, reservations],
  )

  // The extra connector-menu entry (#1281 follow-up): search public transit for this
  // leg instead of drawing a road route. Only when a handler is wired (day has dates).
  const transitLegMenuItem = (dayId: number, seg?: RouteSegment) => {
    if (!onPlanTransitLeg) return []
    const leg = buildTransitLeg(seg, dayId, transitNameIndex, assignments, reservations)
    if (!leg) return []
    return [{ label: t('transit.title'), icon: TramFront, onClick: () => onPlanTransitLeg({ dayId, from: leg.from, to: leg.to, time: leg.time }) }]
  }

  // Open the mode menu at the clicked connector: every route profile, the optional
  // "public transport" entry, plus a "use day default" entry that clears the override.
  const openLegModeMenu = (e: React.MouseEvent, assignmentId: number, dayId: number, seg?: RouteSegment) => {
    ctxMenu.open(e, [
      ...routeProfileOptions.map(o => ({ label: o.label, icon: modeIcon(o.key), onClick: () => setLegMode(assignmentId, dayId, o.key) })),
      ...transitLegMenuItem(dayId, seg),
      { divider: true },
      { label: t('dayplan.transportMode.useDefault'), icon: RotateCcw, onClick: () => setLegMode(assignmentId, dayId, null) },
    ])
  }

  // Set the mode of the leg ENTERING this stop (a booking arrival or the morning
  // hotel bookend). Optimistic, then persisted with direction:'incoming'.
  const setIncomingLegMode = (assignmentId: number, dayId: number, mode: string | null) => {
    const key = String(dayId)
    if (assignments[key]) {
      tripActions.setAssignments({
        ...assignments,
        [key]: assignments[key].map(a => (a.id === assignmentId ? { ...a, incoming_leg_transport_mode: mode } : a)),
      })
    }
    assignmentsApi.updateTransport(tripId, assignmentId, mode, 'incoming').catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      void tripActions.refreshDays(tripId)
    })
  }

  const openIncomingLegModeMenu = (e: React.MouseEvent, assignmentId: number, dayId: number, seg?: RouteSegment) => {
    ctxMenu.open(e, [
      ...routeProfileOptions.map(o => ({ label: o.label, icon: modeIcon(o.key), onClick: () => setIncomingLegMode(assignmentId, dayId, o.key) })),
      ...transitLegMenuItem(dayId, seg),
      { divider: true },
      { label: t('dayplan.transportMode.useDefault'), icon: RotateCcw, onClick: () => setIncomingLegMode(assignmentId, dayId, null) },
    ])
  }

  // Enter/Space on a route connector opens the same mode menu a click opens. A key
  // event carries no pointer position, so the menu is anchored to the connector.
  const openLegMenuByKey = (e: React.KeyboardEvent<HTMLDivElement>, open: (m: React.MouseEvent) => void) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const rect = e.currentTarget.getBoundingClientRect()
    open({
      clientX: rect.left,
      clientY: rect.bottom,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    } as unknown as React.MouseEvent)
  }

  return (
    // Sized as a flex child as well as by height: the desktop panel puts the Days / Road
    // trip switch above this, and at height 100% alone the list ran the switch's height
    // past the panel's clipped edge, so the last day could never be scrolled into view.
    // Where nothing sits above it (the mobile shell), the height still fills the panel.
    <div ref={setPanel} data-touch-drag={dragDisabled ? undefined : ''} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0%', minHeight: 0, height: '100%', position: 'relative', fontFamily: "var(--font-system)" }}>
      {/* Toolbar */}
      <DayPlanSidebarToolbar
        tripId={tripId}
        trip={trip}
        days={days}
        places={places}
        categories={categories}
        assignments={assignments}
        reservations={reservations}
        allConnectionsShown={allConnectionsShown}
        onToggleAllConnections={onToggleAllConnections}
        dayNotes={dayNotes}
        t={t}
        locale={locale}
        toast={toast}
        expandedDays={expandedDays}
        setExpandedDays={setExpandedDays}
        onUndo={onUndo}
        canUndo={canUndo}
        undoHover={undoHover}
        setUndoHover={setUndoHover}
        lastActionLabel={lastActionLabel}
        canEditDays={canEditDays}
        canManageShare={canManageShare}
        onReorderDays={onReorderDays}
        onAddDay={onAddDay}
        dayAdd={dayAdd}
        onDeleteDay={onDeleteDay}
        deleteDayQuestion={deleteDayQuestion}
      />

      {/* Tagesliste */}
      <div className={`scroll-container flex flex-col gap-2 p-2${draggingId ? '' : ' trek-stagger'}`} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} ref={scrollContainerRef} onScroll={(e) => onScrollTopChange?.((e.currentTarget as HTMLElement).scrollTop)}>
        {days.map((day, index) => {
          const isSelected = selectedDayId === day.id
          // Shared by the click and the key handler so the two can never drift
          // apart — pressing Enter on the row has to toggle, not just select.
          // Named for the selection, not the expand/collapse `toggleDay` above.
          const toggleDaySelection = () => {
            if (isSelected) { onSelectDay(null); if (onDayDetail) onDayDetail(null) }
            else { onSelectDay(day.id); if (onDayDetail) onDayDetail(day) }
          }
          const isExpanded = expandedDays.has(day.id)
          const da = getDayAssignments(day.id)
          const formattedDate = formatDate(day.date, locale)
          const heading = dayHeadingParts(day.title || t('dayplan.dayN', { n: index + 1 }), formattedDate, dateFirst)
          const loc = da.find(a => a.place?.lat && a.place?.lng)
          // Route tools normally need 2+ stops, but a single located place is still
          // routable when accommodation optimization can bookend it with a hotel
          // (hotel → place → hotel, the same line the map draws) — otherwise the tools
          // vanish on such a day (#1330). Purely additive to the 2+ case.
          // The weather anchor below must not depend on the optimize-from-accommodation
          // setting — where you wake up is a fact about the day, not a routing choice —
          // so the bookend lookup runs unconditionally (mirrors useMPlanTimeline) while
          // the route tools keep honoring the setting via routeBookends.
          const dayBookends = getDayBookendHotels(day, days, accommodations)
          const routeBookends = optimizeFromAccommodation !== false ? dayBookends : null
          const hasRouteBookend = !!(
            (routeBookends?.morning?.place_lat != null && routeBookends?.morning?.place_lng != null) ||
            (routeBookends?.evening?.place_lat != null && routeBookends?.evening?.place_lng != null)
          )
          // Transfer day with no stops at all: you check out of one hotel and into another, so
          // the map already draws a hotel → hotel leg (see the transfer branch in
          // useRouteCalculation) even with zero places. Mirror that exact gate here — two
          // distinct bookend hotels you actually slept in / sleep in tonight — so the route
          // tools appear when you click the day (#1297). A same-hotel rest day or a plain
          // arrival/departure day has morning === evening and stays excluded. With a flight
          // or train booked on it the map drops that leg (#2476): it keeps only the drives
          // to and from the booking's located stations, and a booking without any leaves
          // nothing to draw, so the tools stay away instead of sitting there dead.
          const transferMorning = routeBookends?.morning
          const transferEvening = routeBookends?.evening
          const dayCarriers = (mergedItemsMap[day.id] || []).filter(i => i.type === 'transport' && isCarrierTransport(i.data))
          const dayHasLocatedCarrier = dayCarriers.some(i => hasCarrierEndpointOnDay(i.data, day.id))
          const hasHotelTransfer = !!(
            routeBookends?.morningIsSleptHere && routeBookends?.eveningIsOvernight &&
            transferMorning?.place_lat != null && transferMorning?.place_lng != null &&
            transferEvening?.place_lat != null && transferEvening?.place_lng != null &&
            (transferMorning.place_lat !== transferEvening.place_lat || transferMorning.place_lng !== transferEvening.place_lng) &&
            (dayCarriers.length === 0 || dayHasLocatedCarrier)
          )
          const routeToolsRoutable = da.length >= 2 || (loc != null && hasRouteBookend) || hasHotelTransfer
          /**
           * The day's located stops in planned order, bookended by the accommodation
           * the same way the drawn map route is (routeBookends is null when "optimize
           * from accommodation" is off), so hotels aren't dropped from an exported
           * route (#1372) — but only when the leg is real: no hotel prepended before an
           * early check-in-day stop, none appended after a post-check-out stop (#1465).
           * Names ride along for the deep links that can label a pin with one.
           */
          const dayExportStops = (): NamedWaypoint[] => {
            const dayStops = getDayAssignments(day.id).filter(a => a.place?.lat != null && a.place?.lng != null)
            // A flight, train, ferry or coach on a day without stops is the move itself,
            // located or not: the hotels at either end are joined by it, not by a road
            // worth handing to a map app (#2476).
            if (dayStops.length === 0 && dayCarriers.length > 0) return []
            const stops = dayStops.map(a => ({ lat: a.place!.lat!, lng: a.place!.lng!, name: a.place!.name }))
            const first = dayStops[0] ? { isPlace: true, time: dayStops[0].place?.place_time ?? null, lat: dayStops[0].place!.lat!, lng: dayStops[0].place!.lng! } : undefined
            const lastAssignment = dayStops[dayStops.length - 1]
            const last = lastAssignment ? { isPlace: true, time: lastAssignment.place?.place_time ?? null, lat: lastAssignment.place!.lat!, lng: lastAssignment.place!.lng! } : undefined
            // Same carrier gate as the drawn route (#2157): the exported link must not
            // start at a hotel you only reach tonight or lead back to one you left.
            const drawMorning = !!routeBookends && shouldDrawMorningLeg(routeBookends, day, first, dayHasLocatedCarrier)
            const drawEvening = !!routeBookends && shouldDrawEveningLeg(routeBookends, day, last, dayHasLocatedCarrier)
            const morning = drawMorning && routeBookends?.morning?.place_lat != null && routeBookends?.morning?.place_lng != null
              ? { lat: routeBookends.morning.place_lat, lng: routeBookends.morning.place_lng, name: routeBookends.morning.place_name } : null
            const evening = drawEvening && routeBookends?.evening?.place_lat != null && routeBookends?.evening?.place_lng != null
              ? { lat: routeBookends.evening.place_lat, lng: routeBookends.evening.place_lng, name: routeBookends.evening.place_name } : null
            return [...(morning ? [morning] : []), ...stops, ...(evening ? [evening] : [])]
          }
          const showRouteTools = (isSelected || (showRouteToolsWhenExpanded && isExpanded)) && routeToolsRoutable
          // Built once, for the day the tools show on. With no stop to hand over the
          // hand-offs would open nothing, so they are left out; a single stop still
          // opens as a pin (#2476).
          const exportStops = showRouteTools ? dayExportStops() : []
          // Is this day's inline route currently on? Mobile toggles it per day (its
          // own expandedRouteDayIds entry); desktop uses the global Route toggle on
          // the selected day (#1374).
          const routeActive = showRouteToolsWhenExpanded ? expandedRouteDayIds.has(day.id) : (routeShown && isSelected)
          const isDragTarget = dragOverDayId === day.id
          const merged = mergedItemsMap[day.id] || []
          const dayNoteUi = noteUi[day.id]
          const placeItems = merged.filter(i => i.type === 'place')
          // A row hidden on a middle day still sits in `merged` (the route builder above
          // has to see it), so the empty-day hint counts what actually renders. Without
          // that, a day whose only entry is a spanning parking would show a blank gap.
          const visibleCount = merged.filter(i => !(i.type === 'transport' && hidesOnMiddleDay(i.data, day.id))).length
          const dayTint = dayTints[day.id]
          // Resolved once per day: the header owns a background that its hover
          // handlers reassign imperatively, so both the base and the hover value have
          // to be tint-aware or the first hover-out would wipe the colour.
          const headerTintBg = dayTintBackground(dayTint, 'header', '--day-tint-header') ?? NEUTRAL_TINT
          const headerTintHoverBg = dayTintBackground(dayTint, 'header', '--day-tint-header-hover') ?? DAY_HEAD_HOVER
          // Day-local anchor only (#2167): the day's first located stop, else the
          // hotel you wake up in. No trip-wide fallback — on a roadtrip that
          // silently showed another city's weather with nothing naming the place.
          const weatherHotel = loc == null ? dayBookends.morning : undefined
          const wLat = loc?.place?.lat ?? weatherHotel?.place_lat
          const wLng = loc?.place?.lng ?? weatherHotel?.place_lng
          const weatherName = loc?.place?.name ?? weatherHotel?.place_name ?? null
          const hasWeather = !!(day.date && wLat != null && wLng != null)
          const dayAccs = accommodations.filter(a => isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days))
            // Sort: check-out first, then ongoing stays, then check-in last
            .sort((a, b) => {
              const aIsOut = a.end_day_id === day.id && a.start_day_id !== day.id
              const bIsOut = b.end_day_id === day.id && b.start_day_id !== day.id
              const aIsIn = a.start_day_id === day.id
              const bIsIn = b.start_day_id === day.id
              if (aIsOut && !bIsOut) return -1
              if (!aIsOut && bIsOut) return 1
              if (aIsIn && !bIsIn) return 1
              if (!aIsIn && bIsIn) return -1
              return 0
            })
          const activeRentals = getActiveRentalsForDay(day.id)
          // Everything a day can be given, behind one "+" rather than a grid of four icons.
          const addItems = [
            onCreatePlaceForDay && { label: t('dayplan.addPlaceHere'), icon: MapPin, onClick: () => onCreatePlaceForDay(day.id) },
            onAddAccommodation && { label: t('day.addAccommodation'), icon: Hotel, onClick: () => onAddAccommodation(day) },
            onAddTransport && { label: t('transport.addTransport'), icon: Car, onClick: () => onAddTransport(day.id) },
            onPlanTransit && { label: t('transit.title'), icon: TramFront, onClick: () => onPlanTransit(day.id) },
            { label: t('dayplan.addNote'), icon: FileText, onClick: () => openAddNote(day.id, undefined) },
          ].filter(Boolean)
          // Right-click on the head: what can be added, and emptying the day (#2470).
          const dayMenuItems = [
            ...addItems,
            ...(onClearDay && da.length > 0 ? [
              { divider: true },
              { label: t('dayplan.clearDay'), icon: Eraser, danger: true, onClick: () => onClearDay(day.id) },
            ] : []),
          ]

          return (
            // One card per day, in the language of the booking cards: a head band
            // that names the day and states its facts as pills, the plan below it.
            // The card stays untinted — its three regions (badge, header, activity
            // list) paint themselves, so a plugin controls them separately.
            <div key={day.id} ref={el => { if (el) dayRefs.current.set(day.id, el); else dayRefs.current.delete(day.id) }}
              className={`flex-none overflow-hidden rounded-2xl border border-edge-faint bg-surface-card transition-shadow ${isSelected ? 'shadow-md' : ''}`}>
              {/* Tages-Header — akzeptiert Drops aus der PlacesSidebar */}
              <div
                className="dp-day-header"
                data-selected={isSelected}
                // Clicking the selected day again deselects it — same as the day panel's × (#2024).
                // Selecting the day has no other trigger, so the row carries the
                // button role itself. The badges inside it are buttons of their
                // own, hence the key handler only answers for the row — and it
                // toggles exactly like the click, rather than only selecting.
                role="button"
                // No press-scale on the wide row — it would shift the nested
                // buttons out from under the pointer mid-click (#2158).
                data-no-press
                tabIndex={0}
                onClick={() => toggleDaySelection()}
                onKeyDown={e => {
                  if (e.target !== e.currentTarget) return
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  e.preventDefault()
                  toggleDaySelection()
                }}
                onDragOver={e => { e.preventDefault(); if (dragOverDayId !== day.id) setDragOverDayId(day.id) }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOverDayId(null) }}
                onDrop={e => handleDropOnDay(e, day.id)}
                onContextMenu={canEditDays ? e => ctxMenu.open(e, dayMenuItems) : undefined}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 8px 10px 10px',
                  cursor: 'pointer',
                  background: isDragTarget ? DAY_HEAD_DROP : (isSelected ? DAY_HEAD_SELECTED : headerTintBg),
                  transition: 'background 0.12s',
                  userSelect: 'none',
                  outline: isDragTarget ? '2px dashed var(--text-faint)' : 'none',
                  outlineOffset: -3,
                  touchAction: 'manipulation',
                }}
                // A tinted header hovers to a deeper mix of its own tone rather than to
                // the neutral hover, so hovering reads as a state change on this day
                // instead of momentarily losing its colour. Selection keeps winning
                // outright, so a selected day is never ambiguous.
                onMouseEnter={e => { if (!isSelected && !isDragTarget) e.currentTarget.style.background = headerTintHoverBg }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isDragTarget ? DAY_HEAD_DROP : headerTintBg }}
              >
                {/* The day's number on a raised tile, its weather folded in under it so the
                    forecast takes no room of its own; the accent marks the open day. */}
                <div
                  className="flex flex-none flex-col items-center overflow-hidden rounded-[10px] font-geist font-bold tabular-nums shadow-sm"
                  style={{
                    width: hasWeather ? 36 : 32,
                    // Selection still wins. A tinted badge mixes the tone INTO the
                    // card colour so it stays the same tile, and takes
                    // --text-secondary: the number is small and bold, so 4.5:1 applies.
                    background: isSelected ? 'var(--accent)' : (dayTintBackground(dayTint, 'badge', '--day-tint-badge', 'var(--bg-card)') ?? 'var(--bg-card)'),
                    color: isSelected ? 'var(--accent-text)' : (dayTinted(dayTint, 'badge') ? 'var(--text-secondary)' : 'var(--text-muted)'),
                  }}
                >
                  <div className={`grid w-full place-items-center ${hasWeather ? 'h-6' : 'h-8'}`} style={{ ...fs(12), lineHeight: 1 }}>
                    {index + 1}
                  </div>
                  {hasWeather && (
                    <>
                      <div className="h-px w-[60%] flex-none bg-current opacity-25" />
                      {/* The same height and type as the number: two equal halves. */}
                      <div className="grid h-6 w-full place-items-center" style={{ ...fs(12), lineHeight: 1 }}>
                        <WeatherWidget lat={wLat ?? null} lng={wLng ?? null} date={day.date} stacked hideIcon locationName={weatherName} />
                      </div>
                    </>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-px">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="min-w-0 truncate font-bold text-content" style={fs(13.5, 'body')}>
                      {heading.primary}
                    </span>
                    {heading.secondary && (
                      <span className="flex-none whitespace-nowrap text-content-faint" style={fs(11)}>
                        {heading.secondary}
                      </span>
                    )}
                  </div>
                  {(dayAccs.length > 0 || activeRentals.length > 0 || dayTint?.label) && (
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1">
                      {dayAccs.map(acc => {
                        const isCheckIn = acc.start_day_id === day.id
                        const isCheckOut = acc.end_day_id === day.id
                        const accName = (acc as any).place_name || (acc as any).reservation_title
                        // The state is said in words as well as colour: check-in green,
                        // check-out red, a stay in between quiet.
                        const state = isCheckOut && !isCheckIn ? t('day.checkOut') : isCheckIn ? t('day.checkIn') : null
                        const iconTone = isCheckOut && !isCheckIn ? 'text-danger' : isCheckIn ? 'text-success' : 'text-content-faint'
                        // Not confirmed yet: a dashed ring says so at a glance, the tooltip in words (#2281).
                        const pending = pendingStays.has(acc.id)
                        const named = state ? `${state}: ${accName}` : accName
                        const tip = pending ? `${named} (${t('reservations.pending')})` : named
                        // The name opens the place, as before; a stay with a booking gets a
                        // second target in the same pill that opens the booking (#2363).
                        const stayBooking = onOpenBooking
                          ? reservations.find(r => r.accommodation_id != null && Number(r.accommodation_id) === acc.id)
                          : undefined
                        return (
                          <span key={acc.id} className={`inline-flex min-w-0 max-w-full items-stretch overflow-hidden rounded-full ${pending ? 'border border-dashed border-warning bg-warning-soft' : 'bg-surface-card shadow-sm'}`}>
                            <Tooltip label={tip}>
                              <button type="button" data-dp="day-pill" data-pending={pending || undefined}
                                onClick={e => { e.stopPropagation(); if ((acc as any).place_id) onPlaceClick((acc as any).place_id) }}
                                className={`inline-flex min-w-0 items-center gap-1 py-[2px] font-geist font-normal text-content-secondary hover:text-content ${stayBooking ? 'pl-2 pr-1.5' : 'px-2'}`}
                                style={{ ...fs(10.5), cursor: (acc as any).place_id ? 'pointer' : 'default' }}>
                                <Hotel size={11} strokeWidth={2} className={`flex-none ${iconTone}`} />
                                <span className="truncate">{accName}</span>
                              </button>
                            </Tooltip>
                            {stayBooking && (
                              <Tooltip label={t('day.openStayBooking')}>
                                <button type="button" data-dp="day-pill-booking" aria-label={t('day.openStayBooking')}
                                  onClick={e => { e.stopPropagation(); onOpenBooking!(stayBooking) }}
                                  className="flex flex-none items-center border-l border-edge-faint pl-1.5 pr-2 text-content-faint hover:text-content">
                                  <Ticket size={11} strokeWidth={2} />
                                </button>
                              </Tooltip>
                            )}
                          </span>
                        )
                      })}
                      {/* Active rental car badges */}
                      {activeRentals.map(r => (
                        <button type="button" data-dp="day-pill" key={`rental-${r.id}`} onClick={e => { e.stopPropagation(); if (onOpenBooking) onOpenBooking(r); else setTransportDetail(r) }}
                          className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full bg-surface-card px-2 py-[2px] font-geist font-normal text-content-secondary shadow-sm hover:text-content"
                          style={fs(10.5)}>
                          <Car size={11} strokeWidth={2} className="flex-none text-content-faint" />
                          <span className="truncate">{r.title}</span>
                        </button>
                      ))}
                      {/* A plugin's name for this day (which leg of the trip it belongs to). */}
                      {dayTint?.label && <SoftPill>{dayTint.label}</SoftPill>}
                    </div>
                  )}
                </div>

                <div className="flex flex-none items-center gap-1">
                  {canEditDays && (
                    <Tooltip label={t('planner.addToThisDay')} placement="top">
                      <button type="button"
                        onClick={e => { e.stopPropagation(); ctxMenu.open(e, addItems, true) }}
                        aria-label={t('planner.addToThisDay')} aria-haspopup="menu"
                        className="dp-day-tools grid h-7 w-7 place-items-center rounded-full bg-surface-card text-content-muted shadow-sm hover:text-content">
                        <Plus size={14} strokeWidth={2.2} />
                      </button>
                    </Tooltip>
                  )}
                  <button type="button" onClick={e => toggleDay(day.id, e)}
                    aria-label={isExpanded ? t('common.collapse') : t('common.expand')} aria-expanded={isExpanded}
                    className="grid h-7 w-7 place-items-center rounded-full text-content-muted hover:bg-surface-card hover:text-content">
                    {isExpanded ? <ChevronDown size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
                  </button>
                </div>
              </div>

              {/* Aufgeklappte Orte + Notizen */}
              {isExpanded && (
                <div
                  data-dp="day-body"
                  className="border-t border-edge-faint px-1.5 pb-1.5 pt-1.5"
                  // The activity list — the largest region and the one behind the
                  // densest text, so its tint is the faintest of the three.
                  style={{ background: dayTintBackground(dayTint, 'activity', '--day-tint-activity') ?? undefined }}
                  onDragOver={e => { e.preventDefault(); const cur = dropTargetRef.current; if (draggingId && (!cur || cur.startsWith('end-'))) setDropTargetKey(`end-${day.id}`) }}
                  onDrop={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    const { placeId, assignmentId, noteId, reservationId: fromReservationId, fromDayId, phase } = getDragData(e)
                    // Drop on transport card (detected via dropTargetRef for sync accuracy)
                    if (dropTargetRef.current?.startsWith('transport-')) {
                      const isAfter = dropTargetRef.current.startsWith('transport-after-')
                      const parts = dropTargetRef.current.replace('transport-after-', '').replace('transport-', '').split('-')
                      const transportId = Number(parts[0])
                      const legPart = parts.find(p => /^leg\d+$/.test(p))
                      const toLegIndex = legPart ? Number(legPart.slice(3)) : null

                      if (placeId) {
                        onAssignToDay?.(Number.parseInt(placeId), day.id)
                      } else if (fromReservationId && fromDayId !== day.id) {
                        const r = reservations.find(x => x.id === Number(fromReservationId))
                        if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                      } else if (fromReservationId) {
                        void handleMergedDrop(day.id, 'transport', Number(fromReservationId), 'transport', transportId, isAfter, toLegIndex)
                      } else if (assignmentId && fromDayId !== day.id) {
                        moveToDay(Number(assignmentId), fromDayId, day.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                      } else if (assignmentId) {
                        void handleMergedDrop(day.id, 'place', Number(assignmentId), 'transport', transportId, isAfter, toLegIndex)
                      } else if (noteId && fromDayId !== day.id) {
                        tripActions.moveDayNote(tripId, fromDayId, day.id, Number(noteId)).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                      } else if (noteId) {
                        void handleMergedDrop(day.id, 'note', Number(noteId), 'transport', transportId, isAfter, toLegIndex)
                      }
                      setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; window.__dragData = null
                      return
                    }

                    if (fromReservationId && fromDayId !== day.id) {
                      const r = reservations.find(x => x.id === Number(fromReservationId))
                      if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                      setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; return
                    }
                    if (!assignmentId && !noteId && !placeId) { dragDataRef.current = null; window.__dragData = null; return }
                    if (placeId) {
                      onAssignToDay?.(Number.parseInt(placeId), day.id)
                      setDropTargetKey(null); window.__dragData = null; return
                    }
                    if (assignmentId && fromDayId !== day.id) {
                      moveToDay(Number(assignmentId), fromDayId, day.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                      setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; return
                    }
                    if (noteId && fromDayId !== day.id) {
                      tripActions.moveDayNote(tripId, fromDayId, day.id, Number(noteId)).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                      setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; return
                    }
                    const m = getMergedItems(day.id)
                    if (m.length === 0) return
                    const lastItem = m[m.length - 1]
                    if (assignmentId && String(lastItem?.data?.id) !== assignmentId)
                      void handleMergedDrop(day.id, 'place', Number(assignmentId), lastItem.type, lastItem.data.id, true)
                    else if (noteId && String(lastItem?.data?.id) !== noteId)
                      void handleMergedDrop(day.id, 'note', Number(noteId), lastItem.type, lastItem.data.id, true)
                  }}
                >
                  {hotelLegs[day.id]?.top && (() => {
                    const targetId = hotelLegs[day.id]?.top?.targetId
                    const connector = <HotelRouteConnector seg={hotelLegs[day.id]!.top!.seg} name={hotelLegs[day.id]!.top!.name} profile={routeProfile} placement="top" />
                    return canEditDays && targetId != null ? (
                      <Tooltip label={t('dayplan.transportMode.change')} placement="top">
                        <div role="button" tabIndex={0}  onClick={e => openIncomingLegModeMenu(e, targetId, day.id, hotelLegs[day.id]!.top!.seg)} onKeyDown={e => openLegMenuByKey(e, m => openIncomingLegModeMenu(m, targetId, day.id, hotelLegs[day.id]!.top!.seg))} style={{ cursor: 'pointer' }} aria-label={t('dayplan.transportMode.change')}>
                          {connector}
                        </div>
                      </Tooltip>
                    ) : connector
                  })()}
                  {daySchedule.byPosition[day.id]?.start.map(si => <PluginDayScheduleRow key={`${si.pluginId}:${si.id}`} item={si} />)}
                  {visibleCount === 0 && !dayNoteUi ? (
                    <div
                      onDragOver={e => { e.preventDefault(); if (dragOverDayId !== day.id) setDragOverDayId(day.id) }}
                      onDrop={e => handleDropOnDay(e, day.id)}
                      style={{ padding: 4, textAlign: 'center', borderRadius: 12,
                        background: dragOverDayId === day.id ? DAY_HEAD_DROP : 'transparent',
                        outline: dragOverDayId === day.id ? '2px dashed var(--text-faint)' : 'none', outlineOffset: -2,
                      }}
                    >
                      {/* An empty day is where somebody wants to add something, so
                          the slot offers to do it instead of only stating the fact.
                          Without the handler (no edit rights) it stays the sentence. */}
                      {onCreatePlaceForDay ? (
                        // It is the one thing to do on an empty day, so it reads as an
                        // offer: the add row every list in the planner ends with.
                        <button type="button"
                          onClick={e => { e.stopPropagation(); onCreatePlaceForDay(day.id) }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-edge px-3 py-2.5 font-semibold text-content-muted hover:border-content-faint hover:text-content"
                          style={fs(12, 'body')}
                        >
                          <Plus size={13} strokeWidth={2.2} /> {t('dayplan.addPlaceHere')}
                        </button>
                      ) : (
                        <span className="block py-3 text-content-faint" style={fs(12, 'body')}>{t('dayplan.emptyDay')}</span>
                      )}
                    </div>
                  ) : (
                    merged.map((item, idx) => {
                      const legSuffix = item.data?.__leg ? `-leg${item.data.__leg.index}` : ''
                      const itemKey = item.type === 'transport' ? `transport-${item.data.id}${legSuffix}-${day.id}` : (item.type === 'place' ? `place-${item.data.id}` : `note-${item.data.id}`)
                      const showDropLine = (!!draggingId || !!dropTargetKey) && dropTargetKey === itemKey
                      const showDropLineAfter = item.type === 'transport' && (!!draggingId || !!dropTargetKey) && dropTargetKey === `transport-after-${item.data.id}${legSuffix}-${day.id}`

                      if (item.type === 'place') {
                        const assignment = item.data
                        const place = assignment.place
                        if (!place) return null
                        const cat = categories.find(c => c.id === place.category_id)
                        const isPlaceSelected = selectedAssignmentId ? assignment.id === selectedAssignmentId : place.id === selectedPlaceId
                        const isDraggingThis = draggingId === assignment.id
                        const placeIdx = placeItems.findIndex(i => i.data.id === assignment.id)

                        const arrowMove = (direction: 'up' | 'down') => {
                          const m = getMergedItems(day.id)
                          const myIdx = m.findIndex(i => i.type === 'place' && i.data.id === assignment.id)
                          if (myIdx === -1) return
                          const targetIdx = direction === 'up' ? myIdx - 1 : myIdx + 1
                          if (targetIdx < 0 || targetIdx >= m.length) return

                          // Build new order: swap this item with its neighbor in the merged list
                          const newOrder = [...m]
                          ;[newOrder[myIdx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[myIdx]]

                          // Check chronological order of all timed items in the new order
                          const placeTime = place.place_time
                          if (parseTimeToMinutes(placeTime) !== null) {
                            const timedInNewOrder = newOrder
                              .map(i => {
                                if (i.type === 'transport') return parseTimeToMinutes(i.data?.reservation_time)
                                if (i.type === 'place') return parseTimeToMinutes(i.data?.place?.place_time)
                                return null
                              })
                              .filter(t => t !== null)
                            const isChronological = timedInNewOrder.every((t, i) => i === 0 || t >= timedInNewOrder[i - 1])
                            if (!isChronological) {
                              const timeStr = placeTime.includes(':') ? placeTime.substring(0, 5) : placeTime
                              // Describe the swap by its neighbour so the confirm step can
                              // replay it against the merged list — a place-id projection
                              // would drop moves across a booking or note.
                              const neighbour = m[targetIdx]
                              setTimeConfirm({
                                dayId: day.id, fromId: assignment.id, time: timeStr,
                                fromType: 'place', toType: neighbour.type, toId: neighbour.data.id,
                                insertAfter: direction === 'down',
                                toLegIndex: neighbour.data?.__leg?.index ?? null,
                              })
                              return
                            }
                          }
                          void applyMergedOrder(day.id, newOrder)
                        }
                        const moveUp = (e) => { e.stopPropagation(); arrowMove('up') }
                        const moveDown = (e) => { e.stopPropagation(); arrowMove('down') }
                        const selectPlace = () => { onPlaceClick(isPlaceSelected ? null : place.id, isPlaceSelected ? null : assignment.id); if (!isPlaceSelected) onSelectDay(day.id, true) }
                        const isLocked = lockedIds.has(assignment.id)
                        // The actions a right-click offers; the row's "…" offers the same, so a
                        // mouse that never right-clicks and the keyboard reach them too.
                        const placeMenu = () => [
                          canEditPlaces && onEditPlace && { label: t('common.edit'), icon: Pencil, onClick: () => onEditPlace(place, assignment.id) },
                          canEditDays && onRemoveAssignment && { label: t('planner.removeFromDay'), icon: Trash2, onClick: () => onRemoveAssignment(day.id, assignment.id) },
                          canEditDays && place.lat != null && place.lng != null && {
                            label: assignment.route_excluded ? t('dayplan.includeInRoute') : t('dayplan.excludeFromRoute'),
                            icon: assignment.route_excluded ? RouteIcon : RouteOff,
                            onClick: () => { tripActions.setAssignmentRouteExcluded(tripId, day.id, assignment.id, !assignment.route_excluded).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) },
                          },
                          safeHttpUrl(place.website) && { label: t('inspector.website'), icon: ExternalLink, onClick: () => window.open(safeHttpUrl(place.website)!, '_blank', 'noopener,noreferrer') },
                          collectionsEnabled && { label: t('inspector.saveToCollection'), icon: Bookmark, onClick: () => useSaveToCollectionStore.getState().open(placeToSaveTarget(place)) },
                          { divider: true },
                          canEditPlaces && onDeletePlace && { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => onDeletePlace(place.id) },
                        ]

                        return (
                          <React.Fragment key={`place-${assignment.id}`}>
                          <div
                            className={`dp-row group ${!isPlaceSelected && !isLocked ? 'hover:bg-surface-hover' : ''}`}
                            // Picking the place out of the day has no other trigger, so
                            // the row is the control. Its grip, lock and arrows are
                            // buttons in their own right, hence the key handler only
                            // answers for the row itself. No press-scale — see the
                            // day header above (#2158).
                            role="button"
                            data-no-press
                            tabIndex={0}
                            draggable={canEditDays && !dragDisabled}
                            onDragStart={e => {
                              if (!canEditDays || dragDisabled) { e.preventDefault(); return }
                              e.dataTransfer.setData('assignmentId', String(assignment.id))
                              e.dataTransfer.setData('fromDayId', String(day.id))
                              e.dataTransfer.effectAllowed = 'move'
                              dragDataRef.current = { assignmentId: String(assignment.id), fromDayId: String(day.id) }
                              setDraggingId(assignment.id)
                            }}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverDayId(null); if (dropTargetKey !== `place-${assignment.id}`) setDropTargetKey(`place-${assignment.id}`) }}
                            onDrop={e => {
                              e.preventDefault(); e.stopPropagation()
                              const { placeId, assignmentId: fromAssignmentId, noteId, reservationId: fromReservationId, fromDayId, phase } = getDragData(e)
                              if (placeId) {
                                onAssignToDay?.(Number.parseInt(placeId), day.id, storedPositionBefore(day.id, assignment))
                                setDropTargetKey(null); window.__dragData = null
                              } else if (fromReservationId && fromDayId !== day.id) {
                                const r = reservations.find(x => x.id === Number(fromReservationId))
                                if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                                setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
                              } else if (fromReservationId) {
                                void handleMergedDrop(day.id, 'transport', Number(fromReservationId), 'place', assignment.id)
                              } else if (fromAssignmentId && fromDayId !== day.id) {
                                moveToDay(Number(fromAssignmentId), fromDayId, day.id, storedPositionBefore(day.id, assignment)).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                                setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
                              } else if (fromAssignmentId) {
                                void handleMergedDrop(day.id, 'place', Number(fromAssignmentId), 'place', assignment.id)
                              } else if (noteId && fromDayId !== day.id) {
                                const tm = getMergedItems(day.id)
                                const toIdx = tm.findIndex(i => i.type === 'place' && i.data.id === assignment.id)
                                const so = toIdx <= 0 ? (tm[0]?.sortKey ?? 0) - 1 : (tm[toIdx - 1].sortKey + tm[toIdx].sortKey) / 2
                                tripActions.moveDayNote(tripId, fromDayId, day.id, Number(noteId), so).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                                setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
                              } else if (noteId) {
                                void handleMergedDrop(day.id, 'note', Number(noteId), 'place', assignment.id)
                              }
                            }}
                            ref={el => {
                              // Auto-scroll the selected row into view — but only on
                              // the transition "just became selected". Once we've
                              // scrolled for this assignment id, we won't scroll
                              // again until selection actually moves somewhere else.
                              if (el && isPlaceSelected && selectionScrollKey != null && lastAutoScrolledIdRef.current !== selectionScrollKey) {
                                const rect = el.getBoundingClientRect()
                                const nearTop = rect.top < 80
                                const nearBottom = rect.bottom > window.innerHeight - 80
                                if (nearTop || nearBottom) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                }
                                lastAutoScrolledIdRef.current = selectionScrollKey
                              }
                            }}
                            onDragEnd={() => { setDraggingId(null); setDragOverDayId(null); setDropTargetKey(null); dragDataRef.current = null }}
                            onClick={selectPlace}
                            onKeyDown={e => {
                              if (e.target !== e.currentTarget) return
                              if (e.key !== 'Enter' && e.key !== ' ') return
                              e.preventDefault()
                              selectPlace()
                            }}
                            onContextMenu={e => ctxMenu.open(e, placeMenu())}
                            onMouseEnter={() => setHoveredAssignmentId(assignment.id)}
                            onMouseLeave={() => setHoveredAssignmentId(null)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: `6px 4px 6px ${gripsShown ? 2 : 8}px`,
                              borderRadius: 12,
                              cursor: 'pointer',
                              // A locked stop keeps a whisper of the danger tone; the lock on its avatar says why.
                              background: isLocked ? LOCKED_ROW : isPlaceSelected ? 'var(--bg-selected)' : undefined,
                              borderTop: showDropLine ? '2px solid var(--text-primary)' : undefined,
                              transition: 'background 0.15s',
                              opacity: isDraggingThis ? 0.4 : 1,
                            }}
                          >
                            {canEditDays && !dragDisabled && <div className="dp-grip flex flex-none cursor-grab items-center text-content-faint opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-40">
                              <GripVertical size={13} strokeWidth={1.8} />
                            </div>}
                            <Tooltip label={isLocked ? t('planner.clickToUnlock') : t('planner.keepPosition')} placement="right">
                              <button
                                type="button"
                                data-dp="lock"
                                aria-label={isLocked ? t('planner.clickToUnlock') : t('planner.keepPosition')}
                                onClick={e => { e.stopPropagation(); toggleLock(assignment.id) }}
                                onMouseEnter={e => { e.stopPropagation(); setLockHoverId(assignment.id) }}
                                onMouseLeave={() => setLockHoverId(null)}
                                className="relative flex flex-none rounded-full"
                              >
                                <PlaceAvatar place={place} category={cat} size={32} />
                                {/* Hover/locked overlay */}
                                {(lockHoverId === assignment.id || isLocked) && (
                                  <span className="absolute inset-0 grid place-items-center rounded-full transition-colors"
                                    style={{ background: isLocked ? LOCK_OVERLAY : LOCK_OVERLAY_HOVER }}>
                                    <Lock size={14} strokeWidth={2.5} className="text-accent-text" style={{ color: 'white' }} />
                                  </span>
                                )}
                              </button>
                            </Tooltip>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex min-w-0 items-center gap-1.5">
                                {cat && (() => {
                                  const CatIcon = getCategoryIcon(cat.icon)
                                  return (
                                    <Tooltip label={cat.name}>
                                      <span className="inline-flex flex-none"><CatIcon size={11} strokeWidth={2.2} color={cat.color || 'var(--text-muted)'} /></span>
                                    </Tooltip>
                                  )
                                })()}
                                <span className="min-w-0 truncate font-semibold text-content" style={{ ...fs(13, 'body'), lineHeight: 1.25 }}>
                                  {place.name}
                                </span>
                                {assignment.route_excluded && (
                                  // Kept on the day but passed by (#2532): said once, beside the name.
                                  <Tooltip label={t('dayplan.offRouteHint')}>
                                    <span className="inline-flex flex-none items-center gap-1 rounded-full bg-surface-secondary px-1.5 py-[1px] font-geist font-semibold text-content-muted" style={fs(9.5)}>
                                      <RouteOff size={10} strokeWidth={2.2} />
                                      {t('dayplan.offRoute')}
                                    </span>
                                  </Tooltip>
                                )}
                              </div>
                              {(place.place_time || place.description || place.address || cat?.name) && (
                                <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                                  {place.place_time && (
                                    <TimePill>
                                      {formatTime(place.place_time, locale, timeFormat)}{place.end_time ? ` – ${formatTime(place.end_time, locale, timeFormat)}` : ''}
                                    </TimePill>
                                  )}
                                  {(place.description || place.address || cat?.name) && (
                                    <div className="collab-note-md min-w-0 flex-1 text-content-faint" style={{ ...fs(10.5), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3, maxHeight: '1.3em' }}>
                                      <Markdown remarkPlugins={[remarkGfm]}>{place.description || place.address || cat?.name || ''}</Markdown>
                                    </div>
                                  )}
                                </div>
                              )}
                              {assignment.notes && (
                                // Day-specific note on this stop (#2163) — one muted
                                // caption line so the timeline shows the note exists
                                // without swallowing the row.
                                <Tooltip label={t('places.assignmentNotes')}>
                                  <div className="mt-0.5 flex min-w-0 items-center gap-1 text-content-muted" style={fs(10.5)}>
                                    <StickyNote size={10} strokeWidth={2} className="flex-none" />
                                    <span className="truncate">{assignment.notes}</span>
                                  </div>
                                </Tooltip>
                              )}
                              {(() => {
                                const linked = getAssignmentReservations(reservations, assignment.id)
                                if (linked.length === 0) return null
                                // A stop can carry more than one booking (a parking pass and the
                                // tickets for the same zoo), and every one of them is kept out of
                                // the timeline, so this row is where they have to appear (#2201).
                                return (
                                  <div className="mt-1 flex flex-col items-start gap-1">
                                    {linked.map(res => {
                                      const confirmed = res.status === 'confirmed'
                                      const hasEndpoints = onToggleConnection && (res.endpoints || []).length >= 2
                                      const active = hasEndpoints ? visibleConnectionIds.includes(res.id) : false
                                      // Status, time and carrier as their own pills in the status
                                      // tone, so the eye takes them one at a time.
                                      const RI = RES_ICONS[res.type] || Ticket
                                      const tone = confirmed ? 'success' : 'warning'
                                      const { time: st } = splitReservationDateTime(res.reservation_time)
                                      const { time: et } = splitReservationDateTime(res.reservation_end_time)
                                      const timeLabel = st || et
                                        ? `${st ? formatTime(st, locale, timeFormat) : ''}${et ? ` – ${formatTime(et, locale, timeFormat)}` : ''}`
                                        : ''
                                      let meta: any = {}
                                      try { meta = typeof res.metadata === 'string' ? JSON.parse(res.metadata || '{}') : (res.metadata || {}) } catch { meta = {} }
                                      const carrierLabel = meta
                                        ? (meta.airline && meta.flight_number ? `${meta.airline} ${meta.flight_number}` : meta.flight_number || meta.train_number || '')
                                        : ''
                                      const editHandler = canEditDays ? (TRANSPORT_TYPES.has(res.type) ? onEditTransport : onEditReservation) : undefined
                                      const openPinned = onOpenBooking ?? editHandler
                                      return (
                                        // No wrapping: the time belongs to the status it qualifies, so the
                                        // pills stay on one line even when the row gets narrow.
                                        <div key={res.id} className="flex max-w-full flex-nowrap items-center gap-1">
                                          {/* The colour carries the status; the word is in the tooltip and read out after the label.
                                              The pill opens the booking: its popup where there is one, else its editor. */}
                                          <Tooltip label={confirmed ? t('reservations.confirmed') : t('reservations.pending')} placement="top">
                                            {openPinned ? (
                                              <button type="button" data-dp="res-pill" onClick={e => { e.stopPropagation(); openPinned(res) }}
                                                className="inline-flex flex-none rounded-full hover:opacity-80">
                                                <SoftPill tone={tone} icon={<RI size={10} strokeWidth={2.2} />}>
                                                  <span className="hidden sm:inline">{t('places.formReservation')}</span>
                                                  <span className="sr-only">{confirmed ? t('reservations.confirmed') : t('reservations.pending')}</span>
                                                </SoftPill>
                                              </button>
                                            ) : (
                                              <span className="inline-flex flex-none">
                                                <SoftPill tone={tone} icon={<RI size={10} strokeWidth={2.2} />}>
                                                  <span className="hidden sm:inline">{t('places.formReservation')}</span>
                                                  <span className="sr-only">{confirmed ? t('reservations.confirmed') : t('reservations.pending')}</span>
                                                </SoftPill>
                                              </span>
                                            )}
                                          </Tooltip>
                                          {timeLabel && <SoftPill tone={tone}>{timeLabel}</SoftPill>}
                                          {carrierLabel && <SoftPill tone={tone}>{carrierLabel}</SoftPill>}
                                          {hasEndpoints && (
                                            <Tooltip label={t(active ? 'map.hideConnections' : 'map.showConnections')} placement="top">
                                              <button aria-label={t(active ? 'map.hideConnections' : 'map.showConnections')}
                                                aria-pressed={active}
                                                type="button"
                                                onClick={e => { e.stopPropagation(); onToggleConnection!(res.id) }}
                                                className={`${ROW_ROUND} h-5 w-5 ${active ? 'text-info' : 'text-content-muted hover:text-content'}`}
                                              >
                                                <RouteIcon size={11} strokeWidth={2.2} />
                                              </button>
                                            </Tooltip>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )
                              })()}
                              {assignment.participants?.length > 0 && (
                                <div className="mt-1 flex items-center">
                                  {assignment.participants.slice(0, 5).map((p, pi) => (
                                    <div key={p.user_id} className="grid h-4 w-4 flex-none place-items-center overflow-hidden rounded-full border-[1.5px] border-surface-card bg-surface-tertiary font-bold text-content-muted"
                                      style={{ ...fs(7), marginLeft: pi > 0 ? -4 : 0 }}>
                                      {p.avatar ? <img src={avatarSrc(p.avatar)!} alt={p.username ?? ''} className="h-full w-full object-cover" /> : p.username?.[0]?.toUpperCase()}
                                    </div>
                                  ))}
                                  {assignment.participants.length > 5 && (
                                    <span className="ml-0.5 text-content-faint" style={fs(8)}>+{assignment.participants.length - 5}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {/* The row's own controls, with room between them so each is its own target. */}
                            <div className="flex flex-none items-center gap-2.5 pl-1">
                            {canEditDays && <div className="reorder-buttons" style={{ flexShrink: 0, display: 'flex', gap: 1, transition: 'opacity 0.15s' }}>
                              <button type="button" onClick={moveUp} disabled={idx === 0} aria-label={t('dayplan.moveUp')} className="flex text-content-faint hover:text-content disabled:cursor-default disabled:text-edge">
                                <ChevronUp size={12} strokeWidth={2} />
                              </button>
                              <button type="button" onClick={moveDown} disabled={idx === merged.length - 1} aria-label={t('dayplan.moveDown')} className="flex text-content-faint hover:text-content disabled:cursor-default disabled:text-edge">
                                <ChevronDown size={12} strokeWidth={2} />
                              </button>
                            </div>}
                            {canEditDays && onAddBookingToAssignment && (hoveredAssignmentId === assignment.id || isPlaceSelected) && (
                              <Tooltip label={t('reservations.addBooking')} placement="top">
                                <button type="button" aria-label={t('reservations.addBooking')}
                                  onClick={e => {
                                    e.stopPropagation()
                                    onAddBookingToAssignment(day.id, assignment.id)
                                  }}
                                  className="grid h-6 w-6 flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm hover:text-content"
                                >
                                  <Ticket size={12} strokeWidth={2} />
                                </button>
                              </Tooltip>
                            )}
                            <MoreButton label={t('files.menu')} items={placeMenu()} size={24} />
                            </div>
                          </div>
                          {daySchedule.byAssignment[day.id]?.[assignment.id]?.map(si => <PluginDayScheduleRow key={`${si.pluginId}:${si.id}`} item={si} />)}
                          {routeLegs[day.id]?.[assignment.id] && (canEditDays ? (
                            <Tooltip label={t('dayplan.transportMode.change')} placement="top">
                              <div role="button" tabIndex={0}  onClick={e => openLegModeMenu(e, assignment.id, day.id, routeLegs[day.id]![assignment.id])} onKeyDown={e => openLegMenuByKey(e, m => openLegModeMenu(m, assignment.id, day.id, routeLegs[day.id]![assignment.id]))} style={{ cursor: 'pointer' }} aria-label={t('dayplan.transportMode.change')}>
                                <RouteConnector seg={routeLegs[day.id]![assignment.id]} profile={routeProfile} />
                              </div>
                            </Tooltip>
                          ) : (
                            <RouteConnector seg={routeLegs[day.id]![assignment.id]} profile={routeProfile} />
                          ))}
                          </React.Fragment>
                        )
                      }

                      // Transport booking (flight, train, bus, car, cruise)
                      if (item.type === 'transport') {
                        const res = item.data
                        const spanPhase = getSpanPhase(res, day.id)

                        // Car "active" (middle) days are shown in the day header, skip here
                        if (res.type === 'car' && spanPhase === 'middle') return null
                        // A multi-day parking says nothing on the days in between and gets
                        // no header badge either, only drop-off and pickup (#1937)
                        if (hidesOnMiddleDay(res, day.id)) return null

                        const color = typeInfo(res.type).color
                        let meta: any = {}
                        try { meta = typeof res.metadata === 'string' ? JSON.parse(res.metadata || '{}') : (res.metadata || {}) } catch { meta = {} }

                        // Subtitle aus Metadaten zusammensetzen
                        let subtitle = ''
                        if (res.__leg) {
                          // One leg of a multi-leg flight/train — show this segment's own detail.
                          const parts = res.type === 'train'
                            ? [res.__leg.train_number, res.__leg.platform ? `${t('reservations.meta.platform')} ${res.__leg.platform}` : '', res.__leg.seat ? `${t('reservations.meta.seat')} ${res.__leg.seat}` : ''].filter(Boolean)
                            : [res.__leg.airline, res.__leg.flight_number].filter(Boolean)
                          if (res.__leg.from || res.__leg.to)
                            parts.push([res.__leg.from, res.__leg.to].filter(Boolean).join(' → '))
                          subtitle = parts.join(', ')
                        } else if (res.type === 'flight') {
                          const parts = [meta.airline, meta.flight_number].filter(Boolean)
                          if (meta.departure_airport || meta.arrival_airport)
                            parts.push([meta.departure_airport, meta.arrival_airport].filter(Boolean).join(' → '))
                          subtitle = parts.join(', ')
                        } else if (res.type === 'train') {
                          subtitle = [meta.train_number, meta.platform ? `${t('reservations.meta.platform')} ${meta.platform}` : '', meta.seat ? `${t('reservations.meta.seat')} ${meta.seat}` : ''].filter(Boolean).join(', ')
                        }

                        // A transit journey (#1065) renders its itinerary inline —
                        // line badges in their colors instead of a plain subtitle,
                        // so the connection is recognisable at a glance.
                        const transitMeta = res.type === 'transit' && meta.transit && Array.isArray(meta.transit.legs) ? meta.transit : null

                        // Multi-day span phase (single-leg / non-flight only — a
                        // multi-leg flight is shown as one row per leg, see below).
                        const spanLabel = res.__leg ? null : getSpanLabel(res, spanPhase)
                        const displayTime = getDisplayTimeForDay(res, day.id)
                        const legKey = res.__leg ? `leg${res.__leg.index}` : 'x'

                        const openTransportRow = () => {
                          const target = reservations.find(x => x.id === res.id) ?? res
                          // With a detail to show, every booking opens it first.
                          if (onOpenBooking) { onOpenBooking(target); return }
                          // A transit journey opens its own journey view — the rich
                          // stop-by-stop breakdown with its booking fields, never the
                          // generic edit form (#1065).
                          if (transitMeta) {
                            if (onOpenTransit) onOpenTransit(target)
                            else setTransportDetail(target)
                            return
                          }
                          if (!canEditDays) return
                          if (TRANSPORT_TYPES.has(res.type)) onEditTransport?.(target)
                          else onEditReservation?.(target)
                        }

                        return (
                          <React.Fragment key={`transport-${res.id}-${legKey}-${day.id}`}>
                          <div
                            // Opening the booking has no other trigger, so the row is
                            // the control; the buttons inside it answer for themselves.
                            // No press-scale — see the day header above (#2158).
                            role="button"
                            data-no-press
                            tabIndex={0}
                            onClick={openTransportRow}
                            onKeyDown={e => {
                              if (e.target !== e.currentTarget) return
                              if (e.key !== 'Enter' && e.key !== ' ') return
                              e.preventDefault()
                              openTransportRow()
                            }}
                            onDragOver={e => {
                              e.preventDefault(); e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              const inBottom = e.clientY > rect.top + rect.height / 2
                              const ls = res.__leg ? `-leg${res.__leg.index}` : ''
                              const key = inBottom ? `transport-after-${res.id}${ls}-${day.id}` : `transport-${res.id}${ls}-${day.id}`
                              if (dropTargetRef.current !== key) setDropTargetKey(key)
                            }}
                            draggable={canEditDays && spanPhase !== 'middle' && !res.__leg && !dragDisabled}
                            onDragStart={e => {
                              if (!canEditDays || spanPhase === 'middle' || res.__leg || dragDisabled) { e.preventDefault(); return }
                              // setData is required for the drag to start reliably (Firefox) and
                              // matches how place/note items initiate their drag.
                              e.dataTransfer.setData('reservationId', String(res.id))
                              e.dataTransfer.setData('fromDayId', String(day.id))
                              e.dataTransfer.effectAllowed = 'move'
                              dragDataRef.current = { reservationId: String(res.id), fromDayId: String(day.id), phase: spanPhase }
                              setDraggingId(res.id)
                            }}
                            onDragEnd={() => { setDraggingId(null); setDragOverDayId(null); setDropTargetKey(null); dragDataRef.current = null }}
                            onDrop={e => {
                              e.preventDefault(); e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              const insertAfter = e.clientY > rect.top + rect.height / 2
                              const { placeId, assignmentId: fromAssignmentId, noteId, reservationId: fromReservationId, fromDayId, phase } = getDragData(e)
                              if (placeId) {
                                onAssignToDay?.(Number.parseInt(placeId), day.id)
                              } else if (fromReservationId && fromDayId !== day.id) {
                                const r2 = reservations.find(x => x.id === Number(fromReservationId))
                                if (r2) { const update = computeMultiDayMove(r2, day.id, phase); tripActions.updateReservation(tripId, r2.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                              } else if (fromReservationId) {
                                void handleMergedDrop(day.id, 'transport', Number(fromReservationId), 'transport', res.id, insertAfter, res.__leg?.index ?? null)
                              } else if (fromAssignmentId && fromDayId !== day.id) {
                                moveToDay(Number(fromAssignmentId), fromDayId, day.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                              } else if (fromAssignmentId) {
                                void handleMergedDrop(day.id, 'place', Number(fromAssignmentId), 'transport', res.id, insertAfter, res.__leg?.index ?? null)
                              } else if (noteId && fromDayId !== day.id) {
                                tripActions.moveDayNote(tripId, fromDayId, day.id, Number(noteId)).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                              } else if (noteId) {
                                void handleMergedDrop(day.id, 'note', Number(noteId), 'transport', res.id, insertAfter, res.__leg?.index ?? null)
                              }
                              setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; window.__dragData = null
                            }}
                            className="group"
                            data-dp="transport-row"
                            onMouseEnter={e => { e.currentTarget.style.background = tintOf(color, 12) }}
                            onMouseLeave={e => { e.currentTarget.style.background = tintOf(color, 7) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: `6px 4px 6px ${gripsShown ? 2 : 8}px`,
                              margin: '2px 0',
                              borderRadius: 12,
                              border: `1px solid ${tintOf(color, 24)}`,
                              borderTop: showDropLine ? '2px solid var(--text-primary)' : undefined,
                              borderBottom: showDropLineAfter ? '2px solid var(--text-primary)' : undefined,
                              background: tintOf(color, 7),
                              cursor: (onOpenBooking || transitMeta || (canEditDays && onEditTransport)) ? 'pointer' : 'default', userSelect: 'none',
                              transition: 'background 0.1s',
                              opacity: draggingId === res.id ? 0.4 : spanPhase === 'middle' ? 0.65 : 1,
                            }}
                          >
                            {gripsShown && (spanPhase !== 'middle' && !res.__leg ? (
                              <div className="dp-grip flex flex-none cursor-grab items-center text-content-faint opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-40">
                                <GripVertical size={13} strokeWidth={1.8} />
                              </div>
                            ) : (
                              // A row that cannot move keeps the grip's room, so its tile lines up with the rest.
                              <span aria-hidden="true" className="w-[13px] flex-none" />
                            ))}
                            <TypeTile type={res.type} size={32} raised />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="min-w-0 truncate font-semibold text-content" style={{ ...fs(13, 'body'), lineHeight: 1.25 }}>
                                  {transitMeta ? <TransitTitle title={res.title} iconSize={11} /> : res.title}
                                </span>
                              </div>
                              {(() => {
                                const { time: dispTime } = splitReservationDateTime(displayTime)
                                const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
                                // What the time pill actually says: a day in the middle of a
                                // span has no time of its own, and an empty pill is noise.
                                const timeText = [
                                  dispTime ? formatTime(dispTime, locale, timeFormat) : '',
                                  spanPhase === 'single' && endTime ? `– ${formatTime(endTime, locale, timeFormat)}` : '',
                                ].filter(Boolean).join(' ')
                                // The zone a leg's time is read in. Written out it took the width
                                // the route needs, so it is a globe that names it on hover.
                                const timeZone = (spanPhase === 'start' && meta.departure_timezone) || (spanPhase === 'end' && meta.arrival_timezone) || ''
                                if (!timeText && !timeZone && !spanLabel && !transitMeta && !subtitle) return null
                                return (
                                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                                    {/* Where in a multi-day span this day falls, said quietly beside its time. */}
                                    {spanLabel && <SoftPill caps>{spanLabel}</SoftPill>}
                                    {timeText && <TimePill>{timeText}</TimePill>}
                                    {timeZone && (
                                      <Tooltip label={timeZone} placement="top">
                                        <span role="img" aria-label={timeZone} data-dp="transport-timezone"
                                          className="grid h-[19px] w-[19px] flex-none place-items-center rounded-full bg-surface-card text-content-faint shadow-sm">
                                          <Globe size={10} strokeWidth={2.2} aria-hidden="true" />
                                        </span>
                                      </Tooltip>
                                    )}
                                    {transitMeta ? (
                                      <span className="flex min-w-0 items-center"><TransitLegChips legs={transitMeta.legs} size="sm" t={t} /></span>
                                    ) : subtitle && (
                                      <span className="min-w-0 truncate text-content-faint" style={fs(10.5)}>{subtitle}</span>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>
                            {transitMeta && (() => {
                              const expanded = expandedTransitIds.has(res.id)
                              return (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setExpandedTransitIds(prev => {
                                      const next = new Set(prev)
                                      if (next.has(res.id)) next.delete(res.id); else next.add(res.id)
                                      return next
                                    })
                                  }}
                                  aria-label={t(expanded ? 'common.collapse' : 'common.expand')}
                                  aria-expanded={expanded}
                                  className={`${ROW_ROUND} h-7 w-7 text-content-muted hover:text-content`}
                                >
                                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                              )
                            })()}
                            {!transitMeta && onToggleConnection && (!res.__leg || res.__leg.index === 0) && (res.endpoints || []).length >= 2 && (() => {
                              const active = visibleConnectionIds.includes(res.id)
                              return (
                                <Tooltip label={t(active ? 'map.hideConnections' : 'map.showConnections')} placement="top">
                                  <button aria-label={t(active ? 'map.hideConnections' : 'map.showConnections')}
                                    aria-pressed={active}
                                    type="button"
                                    onClick={e => { e.stopPropagation(); onToggleConnection(res.id) }}
                                    className={`${ROW_ROUND} h-7 w-7 ${active ? 'text-info' : 'text-content-muted hover:text-content'}`}
                                  >
                                    <RouteIcon size={13} strokeWidth={2.2} />
                                  </button>
                                </Tooltip>
                              )
                            })()}
                          </div>
                          {transitMeta && expandedTransitIds.has(res.id) && (
                            <div style={{ margin: '2px 0 4px', padding: '9px 10px 9px 12px', borderRadius: 12, border: `1px solid ${tintOf(color, 18)}`, background: tintOf(color, 4) }}>
                              <TransitItineraryInline legs={transitMeta.legs} t={t} />
                            </div>
                          )}
                          {daySchedule.byReservation[day.id]?.[res.id]?.map(si => <PluginDayScheduleRow key={`${si.pluginId}:${si.id}`} item={si} />)}
                          {routeLegs[day.id]?.[res.id] && (() => {
                            const nextPlaceId = merged.slice(idx + 1).find(i => i.type === 'place' && i.data.place?.lat && i.data.place?.lng)?.data.id
                            const connector = <RouteConnector seg={routeLegs[day.id]![res.id]} profile={routeProfile} />
                            return canEditDays && nextPlaceId != null ? (
                              <Tooltip label={t('dayplan.transportMode.change')} placement="top">
                                <div role="button" tabIndex={0}  onClick={e => openIncomingLegModeMenu(e, Number(nextPlaceId), day.id, routeLegs[day.id]![res.id])} onKeyDown={e => openLegMenuByKey(e, m => openIncomingLegModeMenu(m, Number(nextPlaceId), day.id, routeLegs[day.id]![res.id]))} style={{ cursor: 'pointer' }} aria-label={t('dayplan.transportMode.change')}>
                                  {connector}
                                </div>
                              </Tooltip>
                            ) : connector
                          })()}
                          </React.Fragment>
                        )
                      }

                      // Notizkarte
                      const note = item.data
                      const NoteIcon = getNoteIcon(note.icon)
                      const noteSkin = noteSurface(note.color)
                      const noteIdx = idx
                      return (
                        <React.Fragment key={`note-${note.id}`}>
                        <div
                          className="dp-row group"
                          data-dp="note-row"
                          draggable={canEditDays && !dragDisabled}
                          onDragStart={e => { if (!canEditDays || dragDisabled) { e.preventDefault(); return } e.dataTransfer.setData('noteId', String(note.id)); e.dataTransfer.setData('fromDayId', String(day.id)); e.dataTransfer.effectAllowed = 'move'; dragDataRef.current = { noteId: String(note.id), fromDayId: String(day.id) }; setDraggingId(`note-${note.id}`) }}
                          onDragEnd={() => { setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null }}
                          onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (dropTargetKey !== `note-${note.id}`) setDropTargetKey(`note-${note.id}`) }}
                          onDrop={e => {
                            e.preventDefault(); e.stopPropagation()
                            const { placeId, noteId: fromNoteId, assignmentId: fromAssignmentId, reservationId: fromReservationId, fromDayId, phase } = getDragData(e)
                            if (placeId) {
                              // New place dropped onto a note: insert it among the
                              // assignments at the note's position (ahead of the first
                              // place below it), so it lands right where the note sits.
                              onAssignToDay?.(Number.parseInt(placeId), day.id, storedPositionBefore(day.id, placeBelowNote(day.id, note.id)))
                              setDropTargetKey(null); window.__dragData = null
                            } else if (fromReservationId && fromDayId !== day.id) {
                              const r = reservations.find(x => x.id === Number(fromReservationId))
                              if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                              setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
                            } else if (fromReservationId) {
                              void handleMergedDrop(day.id, 'transport', Number(fromReservationId), 'note', note.id)
                            } else if (fromNoteId && fromDayId !== day.id) {
                              const tm = getMergedItems(day.id)
                              const toIdx = tm.findIndex(i => i.type === 'note' && i.data.id === note.id)
                              const so = toIdx <= 0 ? (tm[0]?.sortKey ?? 0) - 1 : (tm[toIdx - 1].sortKey + tm[toIdx].sortKey) / 2
                              tripActions.moveDayNote(tripId, fromDayId, day.id, Number(fromNoteId), so).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                              setDraggingId(null); setDropTargetKey(null)
                            } else if (fromNoteId && fromNoteId !== String(note.id)) {
                              void handleMergedDrop(day.id, 'note', Number(fromNoteId), 'note', note.id)
                            } else if (fromAssignmentId && fromDayId !== day.id) {
                              moveToDay(Number(fromAssignmentId), fromDayId, day.id, storedPositionBefore(day.id, placeBelowNote(day.id, note.id))).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                              setDraggingId(null); setDropTargetKey(null)
                            } else if (fromAssignmentId) {
                              void handleMergedDrop(day.id, 'place', Number(fromAssignmentId), 'note', note.id)
                            }
                          }}
                          onContextMenu={canEditDays ? e => ctxMenu.open(e, [
                            { label: t('common.edit'), icon: Pencil, onClick: () => openEditNote(day.id, note) },
                            { divider: true },
                            { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => setPendingDeleteNote({ dayId: day.id, noteId: note.id }) },
                          ]) : undefined}
                          {...(canEditDays ? {
                            role: 'button' as const,
                            // No press-scale: index.css shrinks every [role=button] on
                            // :active, which on a draggable row fights the drag (#2158).
                            'data-no-press': '',
                            tabIndex: 0,
                            // The row is the note's edit affordance — the same gesture the
                            // phone shell already uses (#2249). Links inside the rendered
                            // body and the reorder buttons keep their own click.
                            onClick: (e: React.MouseEvent) => {
                              if ((e.target as HTMLElement).closest('a, button')) return
                              openEditNote(day.id, note)
                            },
                            onKeyDown: (e: React.KeyboardEvent) => {
                              if (e.target !== e.currentTarget) return
                              if (e.key !== 'Enter' && e.key !== ' ') return
                              e.preventDefault()
                              openEditNote(day.id, note)
                            },
                          } : {})}
                          style={{
                            position: 'relative',
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: `7px 4px 7px ${gripsShown ? 2 : 8}px`,
                            margin: '2px 0',
                            borderRadius: 12,
                            border: `1px solid ${noteSkin.border}`,
                            borderTop: showDropLine ? '2px solid var(--text-primary)' : undefined,
                            background: noteSkin.background,
                            opacity: draggingId === `note-${note.id}` ? 0.4 : 1,
                            transition: 'background 0.1s', cursor: canEditDays ? 'pointer' : 'default', userSelect: 'none',
                          }}
                        >
                          {canEditDays && !dragDisabled && <div className="dp-grip flex flex-none cursor-grab items-center text-content-faint opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-40">
                            <GripVertical size={13} strokeWidth={1.8} />
                          </div>}
                          <div className="grid h-8 w-8 flex-none place-items-center overflow-hidden rounded-full" style={{ background: noteSkin.iconBackground }}>
                            <NoteIcon size={14} strokeWidth={1.9} color={noteSkin.iconColor} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span className="font-semibold text-content" style={{ ...fs(13, 'body'), wordBreak: 'break-word', lineHeight: 1.25 }}>
                              {note.text}
                            </span>
                            {note.time && (
                              <div className="collab-note-md mt-0.5 text-content-muted" style={{ ...fs(11), lineHeight: 1.4, wordBreak: 'break-word' }}>
                                {/* A link in a note goes to its own tab, and remarkBreaks
                                    keeps a single newline a line break — people write notes
                                    as lines, not as Markdown paragraphs. */}
                                <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownLinkComponents}>{note.time}</Markdown>
                              </div>
                            )}
                          </div>
                        {canEditDays && <div className="reorder-buttons" style={{ flexShrink: 0, display: 'flex', gap: 1, transition: 'opacity 0.15s' }}>
                          <button type="button" onClick={e => { e.stopPropagation(); void moveNote(day.id, note.id, 'up') }} disabled={noteIdx === 0} aria-label={t('dayplan.moveUp')} className="flex text-content-faint hover:text-content disabled:cursor-default disabled:text-edge"><ChevronUp size={12} strokeWidth={2} /></button>
                          <button type="button" onClick={e => { e.stopPropagation(); void moveNote(day.id, note.id, 'down') }} disabled={noteIdx === merged.length - 1} aria-label={t('dayplan.moveDown')} className="flex text-content-faint hover:text-content disabled:cursor-default disabled:text-edge"><ChevronDown size={12} strokeWidth={2} /></button>
                        </div>}
                        {canEditDays && (
                          <MoreButton label={t('files.menu')} size={24} items={[
                            { label: t('common.edit'), icon: Pencil, onClick: () => openEditNote(day.id, note) },
                            { divider: true },
                            { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => setPendingDeleteNote({ dayId: day.id, noteId: note.id }) },
                          ]} />
                        )}
                        </div>
                        </React.Fragment>
                      )
                    })
                  )}
                  {daySchedule.byPosition[day.id]?.end.map(si => <PluginDayScheduleRow key={`${si.pluginId}:${si.id}`} item={si} />)}
                  {hotelLegs[day.id]?.bottom && (() => {
                    const targetId = hotelLegs[day.id]?.bottom?.targetId
                    const connector = <HotelRouteConnector seg={hotelLegs[day.id]!.bottom!.seg} name={hotelLegs[day.id]!.bottom!.name} profile={routeProfile} placement="bottom" />
                    return canEditDays && targetId != null ? (
                      <Tooltip label={t('dayplan.transportMode.change')} placement="top">
                        <div role="button" tabIndex={0}  onClick={e => openLegModeMenu(e, targetId, day.id, hotelLegs[day.id]!.bottom!.seg)} onKeyDown={e => openLegMenuByKey(e, m => openLegModeMenu(m, targetId, day.id, hotelLegs[day.id]!.bottom!.seg))} style={{ cursor: 'pointer' }} aria-label={t('dayplan.transportMode.change')}>
                          {connector}
                        </div>
                      </Tooltip>
                    ) : connector
                  })()}
                  {/* Drop-Zone am Listenende — immer vorhanden als Drop-Target */}
                  <div
                    style={{ minHeight: 12, padding: '2px 8px' }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (dropTargetKey !== `end-${day.id}`) setDropTargetKey(`end-${day.id}`) }}
                    onDrop={e => {
                      e.preventDefault(); e.stopPropagation()
                      const { placeId, assignmentId, noteId, reservationId: fromReservationId, fromDayId, phase } = getDragData(e)
                      // Neuer Ort von der Orte-Liste
                      if (placeId) {
                        onAssignToDay?.(Number.parseInt(placeId), day.id)
                        setDropTargetKey(null); window.__dragData = null; return
                      }
                      if (fromReservationId && fromDayId !== day.id) {
                        const r = reservations.find(x => x.id === Number(fromReservationId))
                        if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                        setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; window.__dragData = null; return
                      }
                      if (!assignmentId && !noteId && !fromReservationId) { dragDataRef.current = null; window.__dragData = null; return }
                      if (assignmentId && fromDayId !== day.id) {
                        moveToDay(Number(assignmentId), fromDayId, day.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                        setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; return
                      }
                      if (noteId && fromDayId !== day.id) {
                        tripActions.moveDayNote(tripId, fromDayId, day.id, Number(noteId)).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                        setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; return
                      }
                      const m = getMergedItems(day.id)
                      if (m.length === 0) return
                      const lastItem = m[m.length - 1]
                      if (assignmentId && String(lastItem?.data?.id) !== assignmentId)
                        void handleMergedDrop(day.id, 'place', Number(assignmentId), lastItem.type, lastItem.data.id, true)
                      else if (noteId && String(lastItem?.data?.id) !== noteId)
                        void handleMergedDrop(day.id, 'note', Number(noteId), lastItem.type, lastItem.data.id, true)
                      else if (fromReservationId && String(lastItem?.data?.id) !== fromReservationId)
                        void handleMergedDrop(day.id, 'transport', Number(fromReservationId), lastItem.type, lastItem.data.id, true)
                      setDropTargetKey(null); dragDataRef.current = null; window.__dragData = null
                    }}
                  >
                    {dropTargetKey === `end-${day.id}` && (
                      <div style={{ height: 2, background: 'var(--text-primary)', borderRadius: 1 }} />
                    )}
                  </div>

                  {/* Routen-Werkzeuge (ausgewählter Tag, 2+ Orte — oder 1 Ort mit Hotel-Bookend #1330 — oder Hotel-zu-Hotel-Transfertag ohne Orte #1297) */}
                  {showRouteTools && (
                    <div data-dp="route-tools" className="mt-1 flex flex-col gap-2 border-t border-edge-faint px-1 pb-0.5 pt-2">
                      <div className="flex items-center gap-1">
                        <button type="button"
                          onClick={() => {
                            if (showRouteToolsWhenExpanded) {
                              // Mobile: toggle this day's inline leg distances in place.
                              // Selecting the day would close the sheet, so we don't — the
                              // distances between places appear right here instead (#1374).
                              setExpandedRouteDayIds(prev => {
                                const next = new Set(prev)
                                next.has(day.id) ? next.delete(day.id) : next.add(day.id)
                                return next
                              })
                            } else {
                              // Desktop: the tools only render for the selected day, so the
                              // toggle always applies to it.
                              onToggleRoute?.()
                            }
                          }}
                          aria-label={t('dayplan.route')}
                          aria-pressed={routeActive}
                          className={`inline-flex h-8 flex-none items-center gap-1.5 rounded-[10px] px-3 font-semibold transition-colors ${routeActive ? 'bg-accent text-accent-text' : `${ROUTE_TOOL} text-content-secondary hover:text-content`}`}
                          style={fs(12, 'body')}
                        >
                          <RouteIcon size={13} strokeWidth={2.2} />
                          {!narrowPanel && t('dayplan.route')}
                        </button>
                        {/* The day's travel mode as one segmented control. */}
                        <div className={`inline-flex h-8 flex-none items-center gap-0.5 rounded-[10px] p-[3px] ${ROUTE_TOOL}`}>
                          {routeProfileOptions.map(p => {
                            const ModeIcon = routeModeIcon(p.key)
                            const active = (day.default_transport_mode ?? routeProfile) === p.key
                            return (
                              <Tooltip key={p.key} label={p.label} placement="top">
                                <button type="button"
                                  onClick={() => setDayDefaultMode(day.id, p.key)}
                                  aria-label={p.label}
                                  aria-pressed={active}
                                  className={`grid h-[26px] w-8 place-items-center rounded-[7px] transition-colors ${active ? 'bg-surface-tertiary text-content' : 'text-content-muted hover:text-content'}`}
                                >
                                  <ModeIcon size={13} strokeWidth={2} />
                                </button>
                              </Tooltip>
                            )
                          })}
                        </div>
                        <span className="flex-1" />
                        {/* Icon-only (#1981): the label stays as the accessible name and the tooltip. */}
                        <BarButton label={t('dayplan.optimize')} onClick={() => handleOptimize(day.id)} placement="top" className={ROUTE_TOOL}>
                          <RotateCcw size={14} strokeWidth={2} />
                        </BarButton>
                        {/* Open the day's stops as a route in Google Maps (planned order). #1255 */}
                        {exportStops.length > 0 && (
                          <BarButton label={t('planner.openGoogleMaps')} placement="top" className={ROUTE_TOOL} onClick={() => {
                            const url = generateGoogleMapsUrl(exportStops)
                            if (url) window.open(url, '_blank', 'noopener,noreferrer')
                          }}>
                            <GoogleMapsIcon size={14} />
                          </BarButton>
                        )}
                        {/* The same day, handed to CoMaps for offline navigation (#1904). The
                            day's own travel mode rides along, so the route it builds walks
                            when the plan walks. */}
                        {exportStops.length > 0 && (
                          <BarButton label={t('planner.openCoMaps')} placement="top" className={ROUTE_TOOL} onClick={() => {
                            const url = generateCoMapsUrl(exportStops, day.default_transport_mode ?? routeProfile)
                            if (url) window.open(url, '_blank', 'noopener,noreferrer')
                          }}>
                            <Compass size={14} strokeWidth={2} />
                          </BarButton>
                        )}
                      </div>
                      {/* Time plugins contributed to this day (charging, buffers) — the
                          dayScheduleProvider minutes folded into the footer total. */}
                      {isSelected && daySchedule.minutesByDay[day.id] ? (
                        <div className="flex justify-center">
                          <SoftPill icon={<Zap size={11} strokeWidth={2} />}>+{formatScheduleMinutes(daySchedule.minutesByDay[day.id])}</SoftPill>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Mobile: Add Place from list */}
                  <MobileAddPlaceButton
                    dayId={day.id}
                    places={places}
                    assignments={assignments}
                    onAssign={onAssignToDay}
                    onAddNew={onAddPlace}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Notiz-Popup-Modal — über Portal gerendert, um den backdropFilter-Stapelkontext zu umgehen */}
      <DayPlanSidebarNoteModal
        noteUi={noteUi}
        setNoteUi={setNoteUi}
        noteInputRef={noteInputRef}
        cancelNote={cancelNote}
        saveNote={saveNote}
        onRequestDelete={(dayId, noteId) => setPendingDeleteNote({ dayId, noteId })}
        t={t}
      />

      {/* Confirm: remove time when reordering a timed place */}
      <DayPlanSidebarTimeConfirmModal
        timeConfirm={timeConfirm}
        setTimeConfirm={setTimeConfirm}
        confirmTimeRemoval={confirmTimeRemoval}
        t={t}
      />

      {/* Confirm: delete a day note — guards against accidental taps on touch devices */}
      <ConfirmDialog
        isOpen={!!pendingDeleteNote}
        onClose={() => setPendingDeleteNote(null)}
        onConfirm={() => {
          if (!pendingDeleteNote) return
          // Close the edit modal behind the confirm; leaving it open would go on
          // editing a note that no longer exists.
          cancelNote(pendingDeleteNote.dayId)
          void deleteNote(pendingDeleteNote.dayId, pendingDeleteNote.noteId)
        }}
        title={t('dayplan.confirmDeleteNoteTitle')}
        message={t('dayplan.confirmDeleteNoteBody')}
      />

      {/* Transport-Detail-Modal */}
      <DayPlanSidebarTransportDetailModal
        transportDetail={transportDetail}
        setTransportDetail={setTransportDetail}
        onNavigateToFiles={onNavigateToFiles}
        onEdit={canEditDays && onEditTransport ? (res) => { setTransportDetail(null); onEditTransport(res) } : undefined}
        t={t}
        locale={locale}
        timeFormat={timeFormat}
      />

      {/* Budget-Fußzeile */}
      <DayPlanSidebarFooter totalCostLabel={totalCostLabel} t={t} />
      <ContextMenu menu={ctxMenu.menu} onClose={ctxMenu.close} />
    </div>
  )
})

export default DayPlanSidebar
