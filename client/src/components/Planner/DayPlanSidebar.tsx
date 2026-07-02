/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
interface DragDataPayload { placeId?: string; assignmentId?: string; noteId?: string; reservationId?: string; fromDayId?: string; phase?: 'single' | 'start' | 'middle' | 'end' }
declare global { interface Window { __dragData: DragDataPayload | null } }

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import { ChevronDown, ChevronRight, ChevronUp, Navigation, RotateCcw, ExternalLink, Clock, Pencil, GripVertical, Ticket, Plus, FileText, Trash2, Car, Lock, Hotel, Footprints, Route as RouteIcon, Bookmark, TramFront } from 'lucide-react'
import { assignmentsApi, reservationsApi } from '../../api/client'
import { calculateRoute, calculateRouteWithLegs, optimizeRoute, generateGoogleMapsUrl } from '../Map/RouteCalculator'
import PlaceAvatar from '../shared/PlaceAvatar'
import ConfirmDialog from '../shared/ConfirmDialog'
import { useContextMenu, ContextMenu } from '../shared/ContextMenu'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
import { isDayInAccommodationRange, getAccommodationAnchors, getDayBookendHotels } from '../../utils/dayOrder'
import {
  TRANSPORT_TYPES, parseTimeToMinutes, getSpanPhase, getDisplayTimeForDay, getTransportRouteEndpoints,
  getTransportForDay as _getTransportForDay, getMergedItems as _getMergedItems,
  type MergedItem,
} from '../../utils/dayMerge'
import { formatDate, formatTime, dayTotalCost, splitReservationDateTime } from '../../utils/formatters'
import { useDayNotes } from '../../hooks/useDayNotes'
import { RES_ICONS, getNoteIcon } from './DayPlanSidebar.constants'
import { RouteConnector, HotelRouteConnector } from './DayPlanSidebarRouteConnector'
import { MobileAddPlaceButton } from './DayPlanSidebarMobileAddPlaceButton'
import { DayPlanSidebarToolbar } from './DayPlanSidebarToolbar'
import { DayPlanSidebarNoteModal } from './DayPlanSidebarNoteModal'
import { DayPlanSidebarTimeConfirmModal } from './DayPlanSidebarTimeConfirmModal'
import { DayPlanSidebarTransportDetailModal } from './DayPlanSidebarTransportDetailModal'
import { DayPlanSidebarFooter } from './DayPlanSidebarFooter'
import type { Trip, Day, Place, Category, Assignment, Accommodation, Reservation, AssignmentsMap, RouteResult, RouteSegment, DayNote } from '../../types'
import { getGoogleMapsUrlForPlace } from './placeGoogleMaps'

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
  onDayDetail: (day: Day) => void
  accommodations?: Accommodation[]
  onReorder: (dayId: number, orderedIds: number[]) => void
  onReorderDays?: (orderedIds: number[]) => void
  onAddDay?: (position?: number) => void
  onUpdateDayTitle: (dayId: number, title: string) => void
  onRouteCalculated: (route: RouteResult | null) => void
  onAssignToDay: (placeId: number, dayId: number, position?: number) => void
  onRemoveAssignment: (dayId: number, assignmentId: number) => void
  onEditPlace: (place: Place, assignmentId?: number) => void
  onDeletePlace: (placeId: number) => void
  reservations?: Reservation[]
  visibleConnectionIds?: number[]
  onToggleConnection?: (reservationId: number) => void
  externalTransportDetail?: Reservation | null
  onExternalTransportDetailHandled?: () => void
  onAddReservation: (dayId: number) => void
  onNavigateToFiles?: () => void
  routeShown?: boolean
  routeProfile?: 'driving' | 'walking'
  onToggleRoute?: () => void
  onSetRouteProfile?: (profile: 'driving' | 'walking') => void
  onAddPlace?: () => void
  onAddPlaceToDay?: (placeId: number, dayId: number) => void
  onExpandedDaysChange?: (expandedDayIds: Set<number>) => void
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void
  canUndo?: boolean
  lastActionLabel?: string | null
  onUndo?: () => void
  onRouteRefresh?: () => void
  onAddTransport?: (dayId: number) => void
  /** Opens the public-transit route search for a day (#1065). */
  onPlanTransit?: (dayId: number) => void
  onEditTransport?: (reservation: Reservation) => void
  onEditReservation?: (reservation: Reservation) => void
  onAddBookingToAssignment?: (dayId: number, assignmentId: number) => void
  initialScrollTop?: number
  onScrollTopChange?: (top: number) => void
  /** Mobile: show the route tools footer (Route toggle / Optimize / travel profile) on expanded days, since selecting a day closes the sheet */
  showRouteToolsWhenExpanded?: boolean
}

/**
 * Day-plan state + behaviour: expand/collapse, inline title edit, route legs +
 * optimisation, day notes, and the drag-and-drop reorder/move machinery across
 * days (places, transports, notes). Returns everything the timeline view renders
 * from, keeping DayPlanSidebar a thin shell over one large day list.
 */
function useDayPlanSidebar(props: DayPlanSidebarProps) {
  const {
  tripId,
  trip, days, places, categories, assignments,
  selectedDayId, selectedPlaceId, selectedAssignmentId,
  onSelectDay, onPlaceClick, onDayDetail, accommodations = [],
  onReorder, onReorderDays, onAddDay, onUpdateDayTitle, onRouteCalculated,
  onAssignToDay, onRemoveAssignment, onEditPlace, onDeletePlace,
  reservations = [],
  visibleConnectionIds = [],
  onToggleConnection,
  externalTransportDetail,
  onExternalTransportDetailHandled,
  onAddReservation,
  onAddPlace,
  onAddPlaceToDay,
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
  onPlanTransit,
  onEditTransport,
  onEditReservation,
  onAddBookingToAssignment,
  initialScrollTop,
  onScrollTopChange,
  showRouteToolsWhenExpanded = false,
  } = props
  const toast = useToast()
  const { t, language, locale } = useTranslation()
  const ctxMenu = useContextMenu()
  const timeFormat = useSettingsStore(s => s.settings.time_format) || '24h'
  const tripActions = useRef(useTripStore.getState()).current
  const can = useCanDo()
  const canEditDays = can('day_edit', trip)

  const { noteUi, setNoteUi, noteInputRef, dayNotes, openAddNote: _openAddNote, openEditNote: _openEditNote, cancelNote, saveNote, deleteNote: _deleteNote, moveNote: _moveNote } = useDayNotes(tripId)

  const [expandedDays, setExpandedDays] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`day-expanded-${tripId}`)
      if (saved) return new Set<number>(JSON.parse(saved) as number[])
    } catch {}
    return new Set<number>(days.map(d => d.id))
  })
  useEffect(() => { onExpandedDaysChange?.(expandedDays) }, [expandedDays])
  const [editingDayId, setEditingDayId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [routeInfo, setRouteInfo] = useState(null)
  // Per-segment legs keyed by day id, then by the start place's assignment id (or the
  // transport's reservation id). Nested per day so several Route-toggled mobile days
  // can't collide in one flat map — assignment ids and reservation ids come from
  // independent sequences and would overwrite each other across days (#1374).
  const [routeLegs, setRouteLegs] = useState<Record<number, Record<number, RouteSegment>>>({})
  // Hotel bookend legs keyed by day id. Desktop keys only the selected day; mobile
  // keys every day whose Route toggle is on, so each shows its own bookends (#1374).
  const [hotelLegs, setHotelLegs] = useState<Record<number, { top?: { seg: RouteSegment; name: string }; bottom?: { seg: RouteSegment; name: string } }>>({})
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
  const [pdfHover, setPdfHover] = useState(false)
  const [icsHover, setIcsHover] = useState(false)
  const [hoveredAssignmentId, setHoveredAssignmentId] = useState<number | null>(null)
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
    // For drag & drop reorder
    fromType?: string; toType?: string; toId?: number; insertAfter?: boolean; toLegIndex?: number | null;
    // For arrow reorder
    reorderIds?: number[];
  } | null>(null)
  const inputRef = useRef(null)
  const dragDataRef = useRef(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
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
        fromDayId: parseInt(dragDataRef.current.fromDayId) || 0,
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
        try { sessionStorage.setItem(`day-expanded-${tripId}`, JSON.stringify([...n])) } catch {}
        return n
      })
    }
    prevDayCount.current = days.length
  }, [days.length, tripId])

  useEffect(() => {
    if (editingDayId && inputRef.current) inputRef.current.focus()
  }, [editingDayId])

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

  // Initialize missing transport positions outside of render to avoid setState-during-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { days.forEach(day => initTransportPositions(day.id)) }, [days, reservations])

  const toggleDay = (dayId, e) => {
    e.stopPropagation()
    setExpandedDays(prev => {
      const n = new Set(prev)
      n.has(dayId) ? n.delete(dayId) : n.add(dayId)
      try { sessionStorage.setItem(`day-expanded-${tripId}`, JSON.stringify([...n])) } catch {}
      return n
    })
  }

  // Get phase label for multi-day badge
  const getSpanLabel = (r: Reservation, phase: string): string | null => {
    if (phase === 'single') return null
    if (r.type === 'flight') return t(`reservations.span.${phase === 'start' ? 'departure' : phase === 'end' ? 'arrival' : 'inTransit'}`)
    if (r.type === 'car') return t(`reservations.span.${phase === 'start' ? 'pickup' : phase === 'end' ? 'return' : 'active'}`)
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

  const getDayAssignments = (dayId) =>
    (assignments[String(dayId)] || []).slice().sort((a, b) => a.order_index - b.order_index)

  // Compute initial day_plan_position for a transport based on time
  const computeTransportPosition = (r, da) => {
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
      day_plan_position: computeTransportPosition(r, da) + idx * 0.01,
    }))
    // Mark as initialized immediately to prevent re-entry
    for (const p of positions) initedTransportIds.current.add(p.id)
    // Update store so subscribers see the new positions
    useTripStore.setState(state => ({
      reservations: state.reservations.map(r => {
        const p = positions.find(x => x.id === r.id)
        if (!p) return r
        return { ...r, day_plan_position: p.day_plan_position }
      })
    }))
    // Persist to server (fire and forget)
    reservationsApi.updatePositions(tripId, positions).catch(() => {})
  }

  const getMergedItems = (dayId: number): MergedItem[] =>
    _getMergedItems({
      dayAssignments: getDayAssignments(dayId),
      dayNotes: (dayNotes[String(dayId)] || []).slice().sort((a, b) => a.sort_order - b.sort_order),
      dayTransports: getTransportForDay(dayId),
      dayId,
      getDisplayTime: getDisplayTimeForDay,
    })

  // Pre-compute merged items for all days so the render loop doesn't recompute on unrelated state changes (e.g. hover)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mergedItemsMap = useMemo(() => {
    const map: Record<number, ReturnType<typeof getMergedItems>> = {}
    days.forEach(day => { map[day.id] = getMergedItems(day.id) })
    return map
  // getMergedItems is redefined each render but captures assignments/dayNotes/reservations/days via closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, assignments, dayNotes, reservations, transportPosVersion])

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
      const runs: { id: number; lat: number; lng: number }[][] = []
      let cur: { id: number; lat: number; lng: number }[] = []
      // A run is only a real drive when it holds an actual place. Two back-to-back
      // transports (e.g. two flights on one day) would otherwise pair the first's
      // arrival with the second's departure into a phantom airport→airport leg — the
      // flight, not a drive — and surface it as a bogus connector distance (#1394).
      let curHasPlace = false
      for (const it of merged) {
        if (it.type === 'place' && it.data.place?.lat && it.data.place?.lng) {
          cur.push({ id: it.data.id, lat: it.data.place.lat, lng: it.data.place.lng })
          curHasPlace = true
        } else if (it.type === 'transport') {
          const r = it.data
          const { from, to } = getTransportRouteEndpoints(r, dayId)
          if (from || to) {
            // Located transport: route to its departure point, break the run (the
            // flight/train itself isn't driven), and let its arrival start the next.
            if (from) cur.push({ id: r.id, lat: from.lat, lng: from.lng })
            if (cur.length >= 2 && curHasPlace) runs.push(cur)
            cur = []
            curHasPlace = false
            if (to) cur.push({ id: r.id, lat: to.lat, lng: to.lng })
          } else if (cur.length > 0) {
            // No location: ignore for routing, but attribute the through-leg to the
            // booking so its distance/duration shows under it (purely cosmetic).
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
      // whether each is a place so we can skip a hotel↔transport leg that isn't real: on a day-1
      // arrival the check-in hotel never drove to the departure airport (#1321).
      const wayPts: { lat: number; lng: number; isPlace: boolean }[] = []
      for (const it of merged) {
        if (it.type === 'place' && it.data.place?.lat && it.data.place?.lng) {
          wayPts.push({ lat: it.data.place.lat, lng: it.data.place.lng, isPlace: true })
        } else if (it.type === 'transport') {
          const { from, to } = getTransportRouteEndpoints(it.data, dayId)
          if (from) wayPts.push({ lat: from.lat, lng: from.lng, isPlace: false })
          if (to) wayPts.push({ lat: to.lat, lng: to.lng, isPlace: false })
        }
      }
      const firstWay = wayPts[0]
      const lastWay = wayPts[wayPts.length - 1]
      const wantTop = !!(startHotel && firstWay && (firstWay.isPlace || bookends?.morningIsSleptHere))
      const wantBottom = !!(endHotel && lastWay && (lastWay.isPlace || bookends?.eveningIsOvernight))
      return { runs, startHotel, endHotel, firstWay, lastWay, wantTop, wantBottom }
    }

    const controller = new AbortController()
    legsAbortRef.current = controller
    ;(async () => {
      const legsByDay: Record<number, Record<number, RouteSegment>> = {}
      const hotelByDay: Record<number, { top?: { seg: RouteSegment; name: string }; bottom?: { seg: RouteSegment; name: string } }> = {}

      // One cached OSRM call per waypoint pair; shares RouteCalculator's cache.
      const legBetween = async (a: { lat: number; lng: number }, b: { lat: number; lng: number }): Promise<RouteSegment | undefined> => {
        try {
          const r = await calculateRouteWithLegs([a, b], { signal: controller.signal, profile: routeProfile })
          return r.legs[0]
        } catch { return undefined }
      }

      for (const dayId of routeDayIds) {
        const { runs, startHotel, endHotel, firstWay, lastWay, wantTop, wantBottom } = planDay(dayId)
        const dayLegs: Record<number, RouteSegment> = {}
        for (const run of runs) {
          try {
            const r = await calculateRouteWithLegs(run.map(p => ({ lat: p.lat, lng: p.lng })), { signal: controller.signal, profile: routeProfile })
            r.legs.forEach((leg, i) => { dayLegs[run[i].id] = leg })
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return
          }
        }
        if (Object.keys(dayLegs).length) legsByDay[dayId] = dayLegs
        const hotel: { top?: { seg: RouteSegment; name: string }; bottom?: { seg: RouteSegment; name: string } } = {}
        if (wantTop) {
          const seg = await legBetween({ lat: startHotel!.place_lat as number, lng: startHotel!.place_lng as number }, { lat: firstWay!.lat, lng: firstWay!.lng })
          if (seg) hotel.top = { seg, name: hotelName(startHotel!) }
        }
        if (wantBottom) {
          const seg = await legBetween({ lat: lastWay!.lat, lng: lastWay!.lng }, { lat: endHotel!.place_lat as number, lng: endHotel!.place_lng as number })
          if (seg) hotel.bottom = { seg, name: hotelName(endHotel!) }
        }
        if (controller.signal.aborted) return
        if (hotel.top || hotel.bottom) hotelByDay[dayId] = hotel
      }

      if (!controller.signal.aborted) { setRouteLegs(legsByDay); setHotelLegs(hotelByDay) }
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

  // Check if a proposed reorder of place IDs would break chronological order
  // of ALL timed items (places with time + transport bookings)
  const wouldBreakChronology = (dayId: number, newPlaceIds: number[]) => {
    const da = getDayAssignments(dayId)
    const transport = getTransportForDay(dayId)

    // Simulate the merged list with places in new order + transports at their positions
    // Places get sequential integer positions
    const simItems: { pos: number; minutes: number }[] = []
    newPlaceIds.forEach((id, idx) => {
      const a = da.find(x => x.id === id)
      const m = parseTimeToMinutes(a?.place?.place_time)
      if (m !== null) simItems.push({ pos: idx, minutes: m })
    })

    // Transports: compute where they'd go with the new place order
    for (const r of transport) {
      const rMin = parseTimeToMinutes(r.reservation_time)
      if (rMin === null) continue
      // Find the last place (in new order) with time <= transport time
      let afterIdx = -1
      newPlaceIds.forEach((id, idx) => {
        const a = da.find(x => x.id === id)
        const pm = parseTimeToMinutes(a?.place?.place_time)
        if (pm !== null && pm <= rMin) afterIdx = idx
      })
      const pos = afterIdx >= 0 ? afterIdx + 0.5 : newPlaceIds.length + 0.5
      simItems.push({ pos, minutes: rMin })
    }

    // Sort by position and check chronological order
    simItems.sort((a, b) => a.pos - b.pos)
    return !simItems.every((item, i) => i === 0 || item.minutes >= simItems[i - 1].minutes)
  }

  const openEditNote = (dayId: number, note: DayNote, e?: React.MouseEvent) => {
    e?.stopPropagation()
    _openEditNote(dayId, note)
  }

  // Deleting a note asks for confirmation first — the edit/delete icons sit close together and are
  // easy to mis-tap on touch devices, where an accidental delete was previously unrecoverable.
  const [pendingDeleteNote, setPendingDeleteNote] = useState<{ dayId: number; noteId: number } | null>(null)

  const deleteNote = async (dayId: number, noteId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    await _deleteNote(dayId, noteId)
  }

  // Unified reorder: assigns positions to ALL item types based on new visual order
  const applyMergedOrder = async (dayId: number, newOrder: { type: string; data: any }[]) => {
    // Capture previous place order for undo
    const prevAssignmentIds = getDayAssignments(dayId).map(a => a.id)

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
          useTripStore.setState(state => ({ reservations: state.reservations.map(x => (x.id === rid ? { ...x, metadata: newMeta } : x)) }))
          await tripActions.updateReservation(tripId, rid, { metadata: newMeta })
        }
        setTransportPosVersion(v => v + 1)
      }
      if (assignmentIds.length) await onReorder(dayId, assignmentIds)
      if (transportUpdates.length) {
        onRouteRefresh?.()
        await reservationsApi.updatePositions(tripId, transportUpdates, dayId)
      }
      for (const n of noteUpdates) {
        await tripActions.updateDayNote(tripId, dayId, n.id, { sort_order: n.sort_order })
      }
      if (prevAssignmentIds.length) {
        const capturedDayId = dayId
        const capturedPrevIds = prevAssignmentIds
        pushUndo?.(t('undo.reorder'), async () => {
          await tripActions.reorderAssignments(tripId, capturedDayId, capturedPrevIds)
        })
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
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
    const { dayId, fromId, reorderIds, fromType, toType, toId, insertAfter, toLegIndex } = saved
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

    // Build new merged order from either arrow reorderIds or drag & drop params
    const m = getMergedItems(dayId)

    if (reorderIds) {
      // Arrow reorder: rebuild merged list with places in the new order,
      // keeping transports and notes at their relative positions
      const newMerged: typeof m = []
      let rIdx = 0
      for (const item of m) {
        if (item.type === 'place') {
          // Replace with the place from reorderIds at this position
          const nextId = reorderIds[rIdx++]
          const replacement = m.find(i => i.type === 'place' && i.data.id === nextId)
          if (replacement) newMerged.push(replacement)
        } else {
          newMerged.push(item)
        }
      }
      await applyMergedOrder(dayId, newMerged)
      return
    }

    // Drag & drop reorder
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

  const startEditTitle = (day, e) => {
    e.stopPropagation()
    setEditTitle(day.title || '')
    setEditingDayId(day.id)
  }

  const saveTitle = async (dayId) => {
    setEditingDayId(null)
    await onUpdateDayTitle?.(dayId, editTitle.trim())
  }

  const handleCalculateRoute = async () => {
    if (!selectedDayId) return
    const da = getDayAssignments(selectedDayId)
    const waypoints = da.map(a => a.place).filter(p => p?.lat && p?.lng).map(p => ({ lat: p.lat, lng: p.lng }))
    if (waypoints.length < 2) { toast.error(t('dayplan.toast.needTwoPlaces')); return }
    setIsCalculating(true)
    try {
      const result = await calculateRoute(waypoints, 'walking')
      // Luftlinien zwischen Wegpunkten anzeigen
      const lineCoords = waypoints.map(p => [p.lat, p.lng] as [number, number])
      setRouteInfo({ distance: result.distanceText, duration: result.durationText })
      onRouteCalculated?.({ ...result, coordinates: lineCoords })
    } catch { toast.error(t('dayplan.toast.routeError')) }
    finally { setIsCalculating(false) }
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

  const handleOptimize = async (dayId: number | null = selectedDayId) => {
    if (!dayId) return
    const da = getDayAssignments(dayId)
    if (da.length < 3) return

    const prevIds = da.map(a => a.id)

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
      ? getAccommodationAnchors(day, days, accommodations)
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
    })
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
      onAssignToDay?.(parseInt(placeId), dayId)
    } else if (assignmentId && fromDayId !== dayId) {
      const srcAssignment = (useTripStore.getState().assignments[String(fromDayId)] || []).find(a => a.id === Number(assignmentId))
      const capturedFromDayId = fromDayId
      const capturedOrderIndex = srcAssignment?.order_index ?? 0
      tripActions.moveAssignment(tripId, Number(assignmentId), fromDayId, dayId)
        .then(() => {
          pushUndo?.(t('undo.moveDay'), async () => {
            await tripActions.moveAssignment(tripId, Number(assignmentId), dayId, capturedFromDayId, capturedOrderIndex)
          })
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

  const handleDropOnRow = (e, dayId, toIdx) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverDayId(null)
    const placeId = e.dataTransfer.getData('placeId')
    const fromAssignmentId = e.dataTransfer.getData('assignmentId')

    if (placeId) {
      onAssignToDay?.(parseInt(placeId), dayId)
    } else if (fromAssignmentId) {
      const da = getDayAssignments(dayId)
      const fromIdx = da.findIndex(a => String(a.id) === fromAssignmentId)
      if (fromIdx === -1 || fromIdx === toIdx) { setDraggingId(null); dragDataRef.current = null; return }
      const ids = da.map(a => a.id)
      const [removed] = ids.splice(fromIdx, 1)
      ids.splice(toIdx, 0, removed)
      onReorder(dayId, ids)
    }
    setDraggingId(null)
  }

  const totalCost = useMemo(() => days.reduce((s, d) => {
    const da = assignments[String(d.id)] || []
    return s + da.reduce((s2, a) => s2 + (Number(a.place?.price) || 0), 0)
  }, 0), [days, assignments])

  // Bester verfügbarer Standort für Wetter: zugewiesene Orte zuerst, dann beliebiger Reiseort
  const anyGeoAssignment = Object.values(assignments).flatMap(da => da).find(a => a.place?.lat && a.place?.lng)
  const anyGeoPlace = anyGeoAssignment || (places || []).find(p => p.lat && p.lng)

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
    onUpdateDayTitle,
    onRouteCalculated,
    onAssignToDay,
    onRemoveAssignment,
    onEditPlace,
    onDeletePlace,
    reservations,
    visibleConnectionIds,
    onToggleConnection,
    externalTransportDetail,
    onExternalTransportDetailHandled,
    onAddReservation,
    onAddPlace,
    onAddPlaceToDay,
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
    onPlanTransit,
    onEditTransport,
    onEditReservation,
    onAddBookingToAssignment,
    initialScrollTop,
    onScrollTopChange,
    showRouteToolsWhenExpanded,
    toast,
    t,
    language,
    locale,
    ctxMenu,
    timeFormat,
    tripActions,
    can,
    canEditDays,
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
    editingDayId,
    setEditingDayId,
    editTitle,
    setEditTitle,
    isCalculating,
    setIsCalculating,
    routeInfo,
    setRouteInfo,
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
    pdfHover,
    setPdfHover,
    icsHover,
    setIcsHover,
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
    inputRef,
    dragDataRef,
    scrollContainerRef,
    initedTransportIds,
    lastAutoScrolledIdRef,
    currency,
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
    mergedItemsMap,
    wouldBreakChronology,
    applyMergedOrder,
    handleMergedDrop,
    confirmTimeRemoval,
    startEditTitle,
    saveTitle,
    handleCalculateRoute,
    toggleLock,
    handleOptimize,
    handleDropOnDay,
    handleDropOnRow,
    totalCost,
    anyGeoAssignment,
    anyGeoPlace,
    expandedRouteDayIds,
    setExpandedRouteDayIds,
  }
}

const DayPlanSidebar = React.memo(function DayPlanSidebar(props: DayPlanSidebarProps) {
  const S = useDayPlanSidebar(props)
  // A stable key for the current selection. A multi-day place renders one row per
  // day (same place_id, different assignment ids); selecting it by place_id alone
  // (e.g. clicking an accommodation) marks every one of those rows selected, so a
  // per-assignment scroll-lock would let each day's row scroll the list in turn.
  // Keying the lock on the selection identity makes only the first row scroll (#1375).
  const selectionScrollKey = S.selectedAssignmentId != null ? `a${S.selectedAssignmentId}` : S.selectedPlaceId != null ? `p${S.selectedPlaceId}` : null
  // Needed by the route-tools visibility gate in the render below (#1330); the hook
  // keeps its own copy, so read it reactively here in the component scope too.
  const optimizeFromAccommodation = useSettingsStore(s => s.settings.optimize_from_accommodation)
  const collectionsEnabled = useAddonStore(s => s.isEnabled('collections'))
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
    onUpdateDayTitle,
    onRouteCalculated,
    onAssignToDay,
    onRemoveAssignment,
    onEditPlace,
    onDeletePlace,
    reservations,
    visibleConnectionIds,
    onToggleConnection,
    externalTransportDetail,
    onExternalTransportDetailHandled,
    onAddReservation,
    onAddPlace,
    onAddPlaceToDay,
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
    onPlanTransit,
    onEditTransport,
    onEditReservation,
    onAddBookingToAssignment,
    initialScrollTop,
    onScrollTopChange,
    showRouteToolsWhenExpanded,
    toast,
    t,
    language,
    locale,
    ctxMenu,
    timeFormat,
    tripActions,
    can,
    canEditDays,
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
    editingDayId,
    setEditingDayId,
    editTitle,
    setEditTitle,
    isCalculating,
    setIsCalculating,
    routeInfo,
    setRouteInfo,
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
    pdfHover,
    setPdfHover,
    icsHover,
    setIcsHover,
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
    inputRef,
    dragDataRef,
    scrollContainerRef,
    initedTransportIds,
    lastAutoScrolledIdRef,
    currency,
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
    mergedItemsMap,
    wouldBreakChronology,
    applyMergedOrder,
    handleMergedDrop,
    confirmTimeRemoval,
    startEditTitle,
    saveTitle,
    handleCalculateRoute,
    toggleLock,
    handleOptimize,
    handleDropOnDay,
    handleDropOnRow,
    totalCost,
    anyGeoAssignment,
    anyGeoPlace,
    expandedRouteDayIds,
    setExpandedRouteDayIds,
  } = S
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', fontFamily: "var(--font-system)" }}>
      {/* Toolbar */}
      <DayPlanSidebarToolbar
        tripId={tripId}
        trip={trip}
        days={days}
        places={places}
        categories={categories}
        assignments={assignments}
        reservations={reservations}
        dayNotes={dayNotes}
        t={t}
        locale={locale}
        toast={toast}
        pdfHover={pdfHover}
        setPdfHover={setPdfHover}
        icsHover={icsHover}
        setIcsHover={setIcsHover}
        expandedDays={expandedDays}
        setExpandedDays={setExpandedDays}
        onUndo={onUndo}
        canUndo={canUndo}
        undoHover={undoHover}
        setUndoHover={setUndoHover}
        lastActionLabel={lastActionLabel}
        canEditDays={canEditDays}
        onReorderDays={onReorderDays}
        onAddDay={onAddDay}
      />

      {/* Tagesliste */}
      <div className={`scroll-container${draggingId ? '' : ' trek-stagger'}`} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} ref={scrollContainerRef} onScroll={(e) => onScrollTopChange?.((e.currentTarget as HTMLElement).scrollTop)}>
        {days.map((day, index) => {
          const isSelected = selectedDayId === day.id
          const isExpanded = expandedDays.has(day.id)
          const da = getDayAssignments(day.id)
          const cost = dayTotalCost(day.id, assignments, currency)
          const formattedDate = formatDate(day.date, locale)
          const loc = da.find(a => a.place?.lat && a.place?.lng)
          // Route tools normally need 2+ stops, but a single located place is still
          // routable when accommodation optimization can bookend it with a hotel
          // (hotel → place → hotel, the same line the map draws) — otherwise the tools
          // vanish on such a day (#1330). Purely additive to the 2+ case.
          const routeBookends = optimizeFromAccommodation !== false ? getDayBookendHotels(day, days, accommodations) : null
          const hasRouteBookend = !!(
            (routeBookends?.morning?.place_lat != null && routeBookends?.morning?.place_lng != null) ||
            (routeBookends?.evening?.place_lat != null && routeBookends?.evening?.place_lng != null)
          )
          const routeToolsRoutable = da.length >= 2 || (loc != null && hasRouteBookend)
          // Is this day's inline route currently on? Mobile toggles it per day (its
          // own expandedRouteDayIds entry); desktop uses the global Route toggle on
          // the selected day (#1374).
          const routeActive = showRouteToolsWhenExpanded ? expandedRouteDayIds.has(day.id) : (routeShown && isSelected)
          const isDragTarget = dragOverDayId === day.id
          const merged = mergedItemsMap[day.id] || []
          const dayNoteUi = noteUi[day.id]
          const placeItems = merged.filter(i => i.type === 'place')

          return (
            <div key={day.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
              {/* Tages-Header — akzeptiert Drops aus der PlacesSidebar */}
              <div
                className="dp-day-header"
                data-selected={isSelected}
                onClick={() => { onSelectDay(day.id); if (onDayDetail) onDayDetail(day) }}
                onDragOver={e => { e.preventDefault(); if (dragOverDayId !== day.id) setDragOverDayId(day.id) }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOverDayId(null) }}
                onDrop={e => handleDropOnDay(e, day.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px 11px 16px',
                  cursor: 'pointer',
                  background: isDragTarget ? 'rgba(17,24,39,0.07)' : (isSelected ? 'var(--bg-selected)' : 'transparent'),
                  transition: 'background 0.12s',
                  userSelect: 'none',
                  outline: isDragTarget ? '2px dashed rgba(17,24,39,0.25)' : 'none',
                  outlineOffset: -2,
                  borderRadius: isDragTarget ? 8 : 0,
                  touchAction: 'manipulation',
                }}
                onMouseEnter={e => { if (!isSelected && !isDragTarget) e.currentTarget.style.background = 'var(--bg-tertiary)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isDragTarget ? 'rgba(17,24,39,0.07)' : 'transparent' }}
              >
                {/* Tages-Badge: Nummer oben, darunter (falls vorhanden) das Wetter des Tages */}
                {(() => {
                  // anyGeoPlace is an assignment (has .place) or a bare place — read coords from either.
                  const geoLat = anyGeoPlace ? ('place' in anyGeoPlace ? anyGeoPlace.place?.lat : anyGeoPlace.lat) : undefined
                  const geoLng = anyGeoPlace ? ('place' in anyGeoPlace ? anyGeoPlace.place?.lng : anyGeoPlace.lng) : undefined
                  const wLat = loc?.place?.lat ?? geoLat
                  const wLng = loc?.place?.lng ?? geoLng
                  const hasWeather = !!(day.date && anyGeoPlace && wLat != null && wLng != null)
                  return (
                    <div style={{
                      flexShrink: 0, alignSelf: 'flex-start',
                      width: hasWeather ? 34 : 26,
                      borderRadius: hasWeather ? 11 : '50%',
                      background: isSelected ? 'var(--accent)' : 'var(--bg-hover)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden',
                    }}>
                      <div style={{ width: '100%', height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700 }}>
                        {index + 1}
                      </div>
                      {hasWeather && (
                        <>
                          <div style={{ width: '64%', height: 1, background: 'currentColor', opacity: 0.25 }} />
                          <div style={{ padding: '3px 0 4px' }}>
                            <WeatherWidget lat={wLat} lng={wLng} date={day.date} stacked />
                          </div>
                        </>
                      )}
                    </div>
                  )
                })()}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingDayId === day.id ? (
                    <input
                      ref={inputRef}
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => saveTitle(day.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveTitle(day.id); if (e.key === 'Escape') setEditingDayId(null) }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        width: '100%', border: 'none', outline: 'none',
                        fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-primary)',
                        background: 'transparent', padding: 0, fontFamily: 'inherit',
                        borderBottom: '1.5px solid var(--text-primary)',
                      }}
                    />
                  ) : (<>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      <span style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0 }}>
                        {day.title || t('dayplan.dayN', { n: index + 1 })}
                      </span>
                      {formattedDate && (
                        <>
                          <span style={{ flexShrink: 0, width: 1, height: 11, background: 'var(--border-primary)' }} />
                          <span style={{ flexShrink: 0, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 400, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                            {formattedDate}
                          </span>
                        </>
                      )}
                    </div>
                    {(() => {
                      const hasAccs = accommodations.some(a => isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days))
                      const hasRentals = getActiveRentalsForDay(day.id).length > 0
                      if (!hasAccs && !hasRentals) return null
                      return <div style={{ height: 1, background: 'var(--border-faint)', margin: '5px 0 5px' }} />
                    })()}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap', minWidth: 0 }}>
                      {(() => {
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
                        if (dayAccs.length === 0) return null
                        return dayAccs.map(acc => {
                          const isCheckIn = acc.start_day_id === day.id
                          const isCheckOut = acc.end_day_id === day.id
                          const iconColor = isCheckOut && !isCheckIn ? '#ef4444' : isCheckIn ? '#22c55e' : 'var(--text-faint)'
                          return (
                            <span key={acc.id} onClick={e => { e.stopPropagation(); if ((acc as any).place_id) onPlaceClick((acc as any).place_id) }} className="bg-surface-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0, cursor: (acc as any).place_id ? 'pointer' : 'default', borderRadius: 7, padding: '2px 7px 2px 6px' }}>
                              <Hotel size={11} strokeWidth={1.8} style={{ color: iconColor, flexShrink: 0 }} />
                              <span className="text-content-muted" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(acc as any).place_name || (acc as any).reservation_title}</span>
                            </span>
                          )
                        })
                      })()}
                      {/* Active rental car badges */}
                      {(() => {
                        const activeRentals = getActiveRentalsForDay(day.id)
                        if (activeRentals.length === 0) return null
                        return activeRentals.map(r => (
                          <span key={`rental-${r.id}`} onClick={e => { e.stopPropagation(); setTransportDetail(r) }} className="bg-surface-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0, cursor: 'pointer', borderRadius: 7, padding: '2px 7px 2px 6px' }}>
                            <Car size={11} strokeWidth={1.8} className="text-content-faint" style={{ flexShrink: 0 }} />
                            <span className="text-content-muted" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                          </span>
                        ))
                      })()}
                    </div>
                  </>
                  )}
                  {cost && (
                    <div style={{ marginTop: 2 }}>
                      <span className="text-[#059669]" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>{cost}</span>
                    </div>
                  )}
                </div>

                {canEditDays ? (
                  (() => {
                    const cell = { padding: 7, cursor: 'pointer', display: 'grid', placeItems: 'center' } as const
                    const div = '1px solid var(--border-faint)'
                    return (
                      <div className="dp-day-actions" style={{ alignSelf: 'flex-start', flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', border: div, borderRadius: 9, overflow: 'hidden' }}>
                        {/* Public transit search (#1065) — replaced the rename pencil,
                            which moved next to the day name in the day detail view. */}
                        {onPlanTransit ? (
                          <button onClick={e => { e.stopPropagation(); onPlanTransit(day.id) }} title={t('transit.title')} aria-label={t('transit.title')} style={{ ...cell, border: 'none', borderRight: div, borderBottom: div }}>
                            <TramFront size={14} strokeWidth={1.8} />
                          </button>
                        ) : <div style={{ borderRight: div, borderBottom: div }} />}
                        {onAddTransport ? (
                          <button onClick={e => { e.stopPropagation(); onAddTransport(day.id) }} title={t('transport.addTransport')} style={{ ...cell, border: 'none', borderBottom: div }}>
                            <Plus size={14} strokeWidth={1.8} />
                          </button>
                        ) : <div style={{ borderBottom: div }} />}
                        <button onClick={e => openAddNote(day.id, e)} aria-label={t('dayplan.addNote')} style={{ ...cell, border: 'none', borderRight: div }}>
                          <FileText size={14} strokeWidth={1.8} />
                        </button>
                        <button onClick={e => toggleDay(day.id, e)} title={isExpanded ? t('common.collapse') : t('common.expand')} style={{ ...cell, border: 'none' }}>
                          {isExpanded ? <ChevronDown size={15} strokeWidth={1.8} /> : <ChevronRight size={15} strokeWidth={1.8} />}
                        </button>
                      </div>
                    )
                  })()
                ) : (
                  <button onClick={e => toggleDay(day.id, e)} className="text-content-faint" style={{ alignSelf: 'flex-start', flexShrink: 0, background: 'none', border: 'none', padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <ChevronDown size={16} strokeWidth={1.8} /> : <ChevronRight size={16} strokeWidth={1.8} />}
                  </button>
                )}
              </div>

              {/* Aufgeklappte Orte + Notizen */}
              {isExpanded && (
                <div
                  style={{ background: 'var(--bg-hover)', paddingTop: 6 }}
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
                        onAssignToDay?.(parseInt(placeId), day.id)
                      } else if (fromReservationId && fromDayId !== day.id) {
                        const r = reservations.find(x => x.id === Number(fromReservationId))
                        if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                      } else if (fromReservationId) {
                        handleMergedDrop(day.id, 'transport', Number(fromReservationId), 'transport', transportId, isAfter, toLegIndex)
                      } else if (assignmentId && fromDayId !== day.id) {
                        tripActions.moveAssignment(tripId, Number(assignmentId), fromDayId, day.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                      } else if (assignmentId) {
                        handleMergedDrop(day.id, 'place', Number(assignmentId), 'transport', transportId, isAfter, toLegIndex)
                      } else if (noteId && fromDayId !== day.id) {
                        tripActions.moveDayNote(tripId, fromDayId, day.id, Number(noteId)).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                      } else if (noteId) {
                        handleMergedDrop(day.id, 'note', Number(noteId), 'transport', transportId, isAfter, toLegIndex)
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
                      onAssignToDay?.(parseInt(placeId), day.id)
                      setDropTargetKey(null); window.__dragData = null; return
                    }
                    if (assignmentId && fromDayId !== day.id) {
                      tripActions.moveAssignment(tripId, Number(assignmentId), fromDayId, day.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
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
                      handleMergedDrop(day.id, 'place', Number(assignmentId), lastItem.type, lastItem.data.id, true)
                    else if (noteId && String(lastItem?.data?.id) !== noteId)
                      handleMergedDrop(day.id, 'note', Number(noteId), lastItem.type, lastItem.data.id, true)
                  }}
                >
                  {hotelLegs[day.id]?.top && (
                    <HotelRouteConnector seg={hotelLegs[day.id]!.top!.seg} name={hotelLegs[day.id]!.top!.name} profile={routeProfile} placement="top" />
                  )}
                  {merged.length === 0 && !dayNoteUi ? (
                    <div
                      onDragOver={e => { e.preventDefault(); if (dragOverDayId !== day.id) setDragOverDayId(day.id) }}
                      onDrop={e => handleDropOnDay(e, day.id)}
                      className={dragOverDayId === day.id ? 'bg-[rgba(17,24,39,0.05)]' : 'bg-transparent'}
                      style={{ padding: '16px', textAlign: 'center', borderRadius: 8,
                        border: dragOverDayId === day.id ? '2px dashed rgba(17,24,39,0.2)' : '2px dashed transparent',
                      }}
                    >
                      <span className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{t('dayplan.emptyDay')}</span>
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
                              // Store the new merged order for confirm action
                              setTimeConfirm({ dayId: day.id, fromId: assignment.id, time: timeStr, reorderIds: newOrder.filter(i => i.type === 'place').map(i => i.data.id) })
                              return
                            }
                          }
                          applyMergedOrder(day.id, newOrder)
                        }
                        const moveUp = (e) => { e.stopPropagation(); arrowMove('up') }
                        const moveDown = (e) => { e.stopPropagation(); arrowMove('down') }

                        return (
                          <React.Fragment key={`place-${assignment.id}`}>
                          <div
                            draggable={canEditDays}
                            onDragStart={e => {
                              if (!canEditDays) { e.preventDefault(); return }
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
                                const pos = placeItems.findIndex(i => i.data.id === assignment.id)
                                onAssignToDay?.(parseInt(placeId), day.id, pos >= 0 ? pos : undefined)
                                setDropTargetKey(null); window.__dragData = null
                              } else if (fromReservationId && fromDayId !== day.id) {
                                const r = reservations.find(x => x.id === Number(fromReservationId))
                                if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                                setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
                              } else if (fromReservationId) {
                                handleMergedDrop(day.id, 'transport', Number(fromReservationId), 'place', assignment.id)
                              } else if (fromAssignmentId && fromDayId !== day.id) {
                                const toIdx = getDayAssignments(day.id).findIndex(a => a.id === assignment.id)
                                tripActions.moveAssignment(tripId, Number(fromAssignmentId), fromDayId, day.id, toIdx).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                                setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
                              } else if (fromAssignmentId) {
                                handleMergedDrop(day.id, 'place', Number(fromAssignmentId), 'place', assignment.id)
                              } else if (noteId && fromDayId !== day.id) {
                                const tm = getMergedItems(day.id)
                                const toIdx = tm.findIndex(i => i.type === 'place' && i.data.id === assignment.id)
                                const so = toIdx <= 0 ? (tm[0]?.sortKey ?? 0) - 1 : (tm[toIdx - 1].sortKey + tm[toIdx].sortKey) / 2
                                tripActions.moveDayNote(tripId, fromDayId, day.id, Number(noteId), so).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                                setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
                              } else if (noteId) {
                                handleMergedDrop(day.id, 'note', Number(noteId), 'place', assignment.id)
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
                            onClick={() => { onPlaceClick(isPlaceSelected ? null : place.id, isPlaceSelected ? null : assignment.id); if (!isPlaceSelected) onSelectDay(day.id, true) }}
                            onContextMenu={e => {
                              const googleMapsUrl = getGoogleMapsUrlForPlace(place)
                              ctxMenu.open(e, [
                                canEditDays && onEditPlace && { label: t('common.edit'), icon: Pencil, onClick: () => onEditPlace(place, assignment.id) },
                                canEditDays && onRemoveAssignment && { label: t('planner.removeFromDay'), icon: Trash2, onClick: () => onRemoveAssignment(day.id, assignment.id) },
                                place.website && { label: t('inspector.website'), icon: ExternalLink, onClick: () => window.open(place.website, '_blank') },
                                googleMapsUrl && { label: t('inspector.google'), icon: Navigation, onClick: () => window.open(googleMapsUrl, '_blank') },
                                collectionsEnabled && { label: t('inspector.saveToCollection'), icon: Bookmark, onClick: () => useSaveToCollectionStore.getState().open(placeToSaveTarget(place)) },
                                { divider: true },
                                canEditDays && onDeletePlace && { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => onDeletePlace(place.id) },
                              ])
                            }}
                            onMouseEnter={e => {
                              if (!isPlaceSelected && !lockedIds.has(assignment.id))
                                e.currentTarget.style.background = 'var(--bg-hover)'
                              const grip = e.currentTarget.querySelector('.dp-grip') as HTMLElement | null
                              if (grip) grip.style.opacity = '1'
                              setHoveredAssignmentId(assignment.id)
                            }}
                            onMouseLeave={e => {
                              if (!isPlaceSelected && !lockedIds.has(assignment.id))
                                e.currentTarget.style.background = 'transparent'
                              const grip = e.currentTarget.querySelector('.dp-grip') as HTMLElement | null
                              if (grip) grip.style.opacity = '0.3'
                              setHoveredAssignmentId(null)
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '7px 8px 7px 10px',
                              cursor: 'pointer',
                              background: lockedIds.has(assignment.id)
                                ? 'rgba(220,38,38,0.08)'
                                : isPlaceSelected ? 'var(--bg-selected)' : 'transparent',
                              borderLeft: lockedIds.has(assignment.id)
                                ? '3px solid #dc2626'
                                : '3px solid transparent',
                              borderTop: showDropLine ? '2px solid var(--text-primary)' : undefined,
                              transition: 'background 0.15s, border-color 0.15s',
                              opacity: isDraggingThis ? 0.4 : 1,
                            }}
                          >
                            {canEditDays && <div className="dp-grip" style={{ flexShrink: 0, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', opacity: 0.3, transition: 'opacity 0.15s', cursor: 'grab' }}>
                              <GripVertical size={13} strokeWidth={1.8} />
                            </div>}
                            <div
                              onClick={e => { e.stopPropagation(); toggleLock(assignment.id) }}
                              onMouseEnter={e => { e.stopPropagation(); setLockHoverId(assignment.id) }}
                              onMouseLeave={() => setLockHoverId(null)}
                              style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                            >
                              <PlaceAvatar place={place} category={cat} size={28} />
                              {/* Hover/locked overlay */}
                              {(lockHoverId === assignment.id || lockedIds.has(assignment.id)) && (
                                <div style={{
                                  position: 'absolute', inset: 0, borderRadius: '50%',
                                  background: lockedIds.has(assignment.id) ? 'rgba(220,38,38,0.6)' : 'rgba(220,38,38,0.4)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'background 0.15s',
                                }}>
                                  <Lock size={14} strokeWidth={2.5} style={{ color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                                </div>
                              )}
                              {/* Custom tooltip */}
                              {lockHoverId === assignment.id && (
                                <div style={{
                                  position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
                                  marginLeft: 8, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 50,
                                  background: 'var(--bg-card, white)', color: 'var(--text-primary, #111827)',
                                  fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, padding: '5px 10px', borderRadius: 8,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid var(--border-faint, #e5e7eb)',
                                }}>
                                  {lockedIds.has(assignment.id)
                                    ? t('planner.clickToUnlock')
                                    : t('planner.keepPosition')}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                                {cat && (() => {
                                  const CatIcon = getCategoryIcon(cat.icon)
                                  return <span title={cat.name} style={{ display: 'inline-flex', flexShrink: 0 }}><CatIcon size={10} strokeWidth={2} color={cat.color || 'var(--text-muted)'} /></span>
                                })()}
                                <span style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                                  {place.name}
                                </span>
                                {place.place_time && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontWeight: 400, marginLeft: 6 }}>
                                    <Clock size={9} strokeWidth={2} />
                                    {formatTime(place.place_time, locale, timeFormat)}{place.end_time ? ` – ${formatTime(place.end_time, locale, timeFormat)}` : ''}
                                  </span>
                                )}
                              </div>
                              {(place.description || place.address || cat?.name) && (
                                <div className="collab-note-md" style={{ marginTop: 2, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, maxHeight: '1.2em' }}>
                                  <Markdown remarkPlugins={[remarkGfm]}>{place.description || place.address || cat?.name || ''}</Markdown>
                                </div>
                              )}
                              {(() => {
                                const res = reservations.find(r => r.assignment_id === assignment.id)
                                if (!res) return null
                                const confirmed = res.status === 'confirmed'
                                const hasEndpoints = onToggleConnection && (res.endpoints || []).length >= 2
                                const active = hasEndpoints ? visibleConnectionIds.includes(res.id) : false
                                return (
                                  <div style={{ marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <div className={confirmed ? 'bg-[rgba(22,163,74,0.1)] text-[#16a34a]' : 'bg-[rgba(217,119,6,0.1)] text-[#d97706]'} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 5, fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 600,
                                    }}>
                                      {(() => { const RI = RES_ICONS[res.type] || Ticket; return <RI size={8} /> })()}
                                      <span className="hidden sm:inline">{confirmed ? t('planner.resConfirmed') : t('planner.resPending')}</span>
                                      {(() => {
                                        const { time: st } = splitReservationDateTime(res.reservation_time)
                                        const { time: et } = splitReservationDateTime(res.reservation_end_time)
                                        if (!st && !et) return null
                                        return (
                                          <span style={{ fontWeight: 400 }}>
                                            {st ? formatTime(st, locale, timeFormat) : ''}
                                            {et ? ` – ${formatTime(et, locale, timeFormat)}` : ''}
                                          </span>
                                        )
                                      })()}
                                      {(() => {
                                        const meta = typeof res.metadata === 'string' ? JSON.parse(res.metadata || '{}') : (res.metadata || {})
                                        if (!meta) return null
                                        if (meta.airline && meta.flight_number) return <span style={{ fontWeight: 400 }}>{meta.airline} {meta.flight_number}</span>
                                        if (meta.flight_number) return <span style={{ fontWeight: 400 }}>{meta.flight_number}</span>
                                        if (meta.train_number) return <span style={{ fontWeight: 400 }}>{meta.train_number}</span>
                                        return null
                                      })()}
                                    </div>
                                    {hasEndpoints && (
                                      <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); onToggleConnection!(res.id) }}
                                        title={t(active ? 'map.hideConnections' : 'map.showConnections')}
                                        className={active ? 'bg-[#3b82f6] text-[#fff]' : 'bg-transparent text-content-faint'}
                                        style={{
                                          flexShrink: 0, appearance: 'none',
                                          width: 20, height: 20, borderRadius: 4,
                                          display: 'grid', placeItems: 'center', cursor: 'pointer',
                                          border: 'none',
                                          transition: 'color 120ms cubic-bezier(0.23,1,0.32,1), background 120ms cubic-bezier(0.23,1,0.32,1)',
                                        }}
                                        onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
                                        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-faint)' }}
                                      >
                                        <RouteIcon size={11} />
                                      </button>
                                    )}
                                    {canEditDays && (() => {
                                      const isTransport = TRANSPORT_TYPES.has(res.type)
                                      const handler = isTransport ? onEditTransport : onEditReservation
                                      if (!handler) return null
                                      return (
                                        <button
                                          type="button"
                                          onClick={e => { e.stopPropagation(); handler(res) }}
                                          title={t('common.edit')}
                                          className="bg-transparent text-content-faint"
                                          style={{
                                            flexShrink: 0, appearance: 'none',
                                            width: 20, height: 20, borderRadius: 4,
                                            display: 'grid', placeItems: 'center', cursor: 'pointer',
                                            border: 'none',
                                            transition: 'color 120ms cubic-bezier(0.23,1,0.32,1), background 120ms cubic-bezier(0.23,1,0.32,1)',
                                          }}
                                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
                                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)' }}
                                        >
                                          <Pencil size={11} />
                                        </button>
                                      )
                                    })()}
                                  </div>
                                )
                              })()}
                              {assignment.participants?.length > 0 && (
                                <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: -4 }}>
                                  {assignment.participants.slice(0, 5).map((p, pi) => (
                                    <div key={p.user_id} className="bg-surface-tertiary text-content-muted" style={{
                                      width: 16, height: 16, borderRadius: '50%', border: '1.5px solid var(--bg-card)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'calc(7px * var(--fs-scale-caption, 1))', fontWeight: 700,
                                      marginLeft: pi > 0 ? -4 : 0, flexShrink: 0,
                                      overflow: 'hidden',
                                    }}>
                                      {p.avatar ? <img src={avatarSrc(p.avatar)!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.username?.[0]?.toUpperCase()}
                                    </div>
                                  ))}
                                  {assignment.participants.length > 5 && (
                                    <span className="text-content-faint" style={{ fontSize: 'calc(8px * var(--fs-scale-caption, 1))', marginLeft: 2 }}>+{assignment.participants.length - 5}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {canEditDays && <div className="reorder-buttons" style={{ flexShrink: 0, display: 'flex', gap: 1, transition: 'opacity 0.15s' }}>
                              <button onClick={moveUp} disabled={idx === 0} className={idx === 0 ? 'text-[var(--border-primary)]' : 'text-content-faint'} style={{ background: 'none', border: 'none', padding: '1px 2px', cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', lineHeight: 1 }}>
                                <ChevronUp size={12} strokeWidth={2} />
                              </button>
                              <button onClick={moveDown} disabled={idx === merged.length - 1} className={idx === merged.length - 1 ? 'text-[var(--border-primary)]' : 'text-content-faint'} style={{ background: 'none', border: 'none', padding: '1px 2px', cursor: idx === merged.length - 1 ? 'default' : 'pointer', display: 'flex', lineHeight: 1 }}>
                                <ChevronDown size={12} strokeWidth={2} />
                              </button>
                            </div>}
                            {canEditDays && onAddBookingToAssignment && hoveredAssignmentId === assignment.id && (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  onAddBookingToAssignment(day.id, assignment.id)
                                }}
                                title={t('reservations.addBooking')}
                                style={{
                                  flexShrink: 0,
                                  background: 'none',
                                  border: '1px solid var(--border-primary)',
                                  borderRadius: 5,
                                  padding: '2px 6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  fontSize: 'calc(10px * var(--fs-scale-caption, 1))',
                                  fontWeight: 500,
                                  color: 'var(--text-muted)',
                                  fontFamily: 'inherit',
                                }}
                              >
                                <Plus size={11} strokeWidth={2} />
                              </button>
                            )}
                          </div>
                          {routeLegs[day.id]?.[assignment.id] && <RouteConnector seg={routeLegs[day.id]![assignment.id]} profile={routeProfile} />}
                          </React.Fragment>
                        )
                      }

                      // Transport booking (flight, train, bus, car, cruise)
                      if (item.type === 'transport') {
                        const res = item.data
                        const spanPhase = getSpanPhase(res, day.id)

                        // Car "active" (middle) days are shown in the day header, skip here
                        if (res.type === 'car' && spanPhase === 'middle') return null

                        const TransportIcon = RES_ICONS[res.type] || Ticket
                        const color = '#3b82f6'
                        const meta = typeof res.metadata === 'string' ? JSON.parse(res.metadata || '{}') : (res.metadata || {})

                        // Subtitle aus Metadaten zusammensetzen
                        let subtitle = ''
                        if (res.__leg) {
                          // One leg of a multi-leg flight — show this segment's own route.
                          const parts = [res.__leg.airline, res.__leg.flight_number].filter(Boolean)
                          if (res.__leg.from || res.__leg.to)
                            parts.push([res.__leg.from, res.__leg.to].filter(Boolean).join(' → '))
                          subtitle = parts.join(' · ')
                        } else if (res.type === 'flight') {
                          const parts = [meta.airline, meta.flight_number].filter(Boolean)
                          if (meta.departure_airport || meta.arrival_airport)
                            parts.push([meta.departure_airport, meta.arrival_airport].filter(Boolean).join(' → '))
                          subtitle = parts.join(' · ')
                        } else if (res.type === 'train') {
                          subtitle = [meta.train_number, meta.platform ? `Gl. ${meta.platform}` : '', meta.seat ? `Sitz ${meta.seat}` : ''].filter(Boolean).join(' · ')
                        }

                        // Multi-day span phase (single-leg / non-flight only — a
                        // multi-leg flight is shown as one row per leg, see below).
                        const spanLabel = res.__leg ? null : getSpanLabel(res, spanPhase)
                        const displayTime = getDisplayTimeForDay(res, day.id)
                        const legKey = res.__leg ? `leg${res.__leg.index}` : 'x'

                        return (
                          <React.Fragment key={`transport-${res.id}-${legKey}-${day.id}`}>
                          <div
                            onClick={() => {
                              if (!canEditDays) return
                              const target = reservations.find(x => x.id === res.id) ?? res
                              if (TRANSPORT_TYPES.has(res.type)) onEditTransport?.(target)
                              else onEditReservation?.(target)
                            }}
                            onDragOver={e => {
                              e.preventDefault(); e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              const inBottom = e.clientY > rect.top + rect.height / 2
                              const ls = res.__leg ? `-leg${res.__leg.index}` : ''
                              const key = inBottom ? `transport-after-${res.id}${ls}-${day.id}` : `transport-${res.id}${ls}-${day.id}`
                              if (dropTargetRef.current !== key) setDropTargetKey(key)
                            }}
                            draggable={canEditDays && spanPhase !== 'middle' && !res.__leg}
                            onDragStart={e => {
                              if (!canEditDays || spanPhase === 'middle' || res.__leg) { e.preventDefault(); return }
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
                                onAssignToDay?.(parseInt(placeId), day.id)
                              } else if (fromReservationId && fromDayId !== day.id) {
                                const r2 = reservations.find(x => x.id === Number(fromReservationId))
                                if (r2) { const update = computeMultiDayMove(r2, day.id, phase); tripActions.updateReservation(tripId, r2.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                              } else if (fromReservationId) {
                                handleMergedDrop(day.id, 'transport', Number(fromReservationId), 'transport', res.id, insertAfter, res.__leg?.index ?? null)
                              } else if (fromAssignmentId && fromDayId !== day.id) {
                                tripActions.moveAssignment(tripId, Number(fromAssignmentId), fromDayId, day.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                              } else if (fromAssignmentId) {
                                handleMergedDrop(day.id, 'place', Number(fromAssignmentId), 'transport', res.id, insertAfter, res.__leg?.index ?? null)
                              } else if (noteId && fromDayId !== day.id) {
                                tripActions.moveDayNote(tripId, fromDayId, day.id, Number(noteId)).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                              } else if (noteId) {
                                handleMergedDrop(day.id, 'note', Number(noteId), 'transport', res.id, insertAfter, res.__leg?.index ?? null)
                              }
                              setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; window.__dragData = null
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${color}12` }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${color}08` }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '7px 8px 7px 10px',
                              margin: '1px 8px',
                              borderRadius: 6,
                              border: `1px solid ${color}33`,
                              borderTop: showDropLine ? '2px solid var(--text-primary)' : undefined,
                              borderBottom: showDropLineAfter ? '2px solid var(--text-primary)' : undefined,
                              background: `${color}08`,
                              cursor: canEditDays && onEditTransport ? 'pointer' : 'default', userSelect: 'none',
                              transition: 'background 0.1s',
                              opacity: draggingId === res.id ? 0.4 : spanPhase === 'middle' ? 0.65 : 1,
                            }}
                          >
                            {canEditDays && spanPhase !== 'middle' && !res.__leg && (
                              <div className="dp-grip" style={{ flexShrink: 0, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', opacity: 0.3, transition: 'opacity 0.15s', cursor: 'grab' }}>
                                <GripVertical size={13} strokeWidth={1.8} />
                              </div>
                            )}
                            <div style={{
                              width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '50%', background: `${color}18`,
                            }}>
                              <TransportIcon size={14} strokeWidth={1.8} color={color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {spanLabel && (
                                  <span style={{
                                    fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700, padding: '1px 5px', borderRadius: 4, flexShrink: 0,
                                    background: `${color}20`, color: color, textTransform: 'uppercase', letterSpacing: '0.03em',
                                  }}>
                                    {spanLabel}
                                  </span>
                                )}
                                <span style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {res.title}
                                </span>
                                {(() => {
                                  const { time: dispTime } = splitReservationDateTime(displayTime)
                                  const { time: endTime } = splitReservationDateTime(res.reservation_end_time)
                                  if (!dispTime && !endTime) return null
                                  return (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0, fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', fontWeight: 400, marginLeft: 6 }}>
                                      <Clock size={9} strokeWidth={2} />
                                      {dispTime ? formatTime(dispTime, locale, timeFormat) : ''}
                                      {spanPhase === 'single' && endTime ? ` – ${formatTime(endTime, locale, timeFormat)}` : ''}
                                      {meta.departure_timezone && spanPhase === 'start' && ` ${meta.departure_timezone}`}
                                      {meta.arrival_timezone && spanPhase === 'end' && ` ${meta.arrival_timezone}`}
                                    </span>
                                  )
                                })()}
                              </div>
                              {subtitle && (
                                <div style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {subtitle}
                                </div>
                              )}
                            </div>
                            {onToggleConnection && (!res.__leg || res.__leg.index === 0) && (res.endpoints || []).length >= 2 && (() => {
                              const active = visibleConnectionIds.includes(res.id)
                              return (
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); onToggleConnection(res.id) }}
                                  title={t(active ? 'map.hideConnections' : 'map.showConnections')}
                                  style={{
                                    flexShrink: 0, appearance: 'none',
                                    width: 26, height: 26, borderRadius: 6,
                                    display: 'grid', placeItems: 'center', cursor: 'pointer',
                                    border: 'none',
                                    background: active ? color : 'transparent',
                                    color: active ? '#fff' : 'var(--text-faint)',
                                    transition: 'color 120ms cubic-bezier(0.23,1,0.32,1), background 120ms cubic-bezier(0.23,1,0.32,1)',
                                  }}
                                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
                                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-faint)' }}
                                >
                                  <RouteIcon size={13} />
                                </button>
                              )
                            })()}
                          </div>
                          {routeLegs[day.id]?.[res.id] && <RouteConnector seg={routeLegs[day.id]![res.id]} profile={routeProfile} />}
                          </React.Fragment>
                        )
                      }

                      // Notizkarte
                      const note = item.data
                      const NoteIcon = getNoteIcon(note.icon)
                      const noteIdx = idx
                      return (
                        <React.Fragment key={`note-${note.id}`}>
                        <div
                          draggable={canEditDays}
                          onDragStart={e => { if (!canEditDays) { e.preventDefault(); return } e.dataTransfer.setData('noteId', String(note.id)); e.dataTransfer.setData('fromDayId', String(day.id)); e.dataTransfer.effectAllowed = 'move'; dragDataRef.current = { noteId: String(note.id), fromDayId: String(day.id) }; setDraggingId(`note-${note.id}`) }}
                          onDragEnd={() => { setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null }}
                          onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (dropTargetKey !== `note-${note.id}`) setDropTargetKey(`note-${note.id}`) }}
                          onDrop={e => {
                            e.preventDefault(); e.stopPropagation()
                            const { placeId, noteId: fromNoteId, assignmentId: fromAssignmentId, reservationId: fromReservationId, fromDayId, phase } = getDragData(e)
                            if (placeId) {
                              // New place dropped onto a note: insert it among the
                              // assignments at the note's position (after the places
                              // above it), so it lands right where the note sits.
                              const tm = getMergedItems(day.id)
                              const noteIdx = tm.findIndex(i => i.type === 'note' && i.data.id === note.id)
                              const pos = tm.slice(0, noteIdx).filter(i => i.type === 'place').length
                              onAssignToDay?.(parseInt(placeId), day.id, pos)
                              setDropTargetKey(null); window.__dragData = null
                            } else if (fromReservationId && fromDayId !== day.id) {
                              const r = reservations.find(x => x.id === Number(fromReservationId))
                              if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                              setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null
                            } else if (fromReservationId) {
                              handleMergedDrop(day.id, 'transport', Number(fromReservationId), 'note', note.id)
                            } else if (fromNoteId && fromDayId !== day.id) {
                              const tm = getMergedItems(day.id)
                              const toIdx = tm.findIndex(i => i.type === 'note' && i.data.id === note.id)
                              const so = toIdx <= 0 ? (tm[0]?.sortKey ?? 0) - 1 : (tm[toIdx - 1].sortKey + tm[toIdx].sortKey) / 2
                              tripActions.moveDayNote(tripId, fromDayId, day.id, Number(fromNoteId), so).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                              setDraggingId(null); setDropTargetKey(null)
                            } else if (fromNoteId && fromNoteId !== String(note.id)) {
                              handleMergedDrop(day.id, 'note', Number(fromNoteId), 'note', note.id)
                            } else if (fromAssignmentId && fromDayId !== day.id) {
                              const tm = getMergedItems(day.id)
                              const noteIdx = tm.findIndex(i => i.type === 'note' && i.data.id === note.id)
                              const toIdx = tm.slice(0, noteIdx).filter(i => i.type === 'place').length
                              tripActions.moveAssignment(tripId, Number(fromAssignmentId), fromDayId, day.id, toIdx).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
                              setDraggingId(null); setDropTargetKey(null)
                            } else if (fromAssignmentId) {
                              handleMergedDrop(day.id, 'place', Number(fromAssignmentId), 'note', note.id)
                            }
                          }}
                          onContextMenu={canEditDays ? e => ctxMenu.open(e, [
                            { label: t('common.edit'), icon: Pencil, onClick: () => openEditNote(day.id, note) },
                            { divider: true },
                            { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => setPendingDeleteNote({ dayId: day.id, noteId: note.id }) },
                          ]) : undefined}
                          onMouseEnter={e => {
                            const grip = e.currentTarget.querySelector('.dp-grip') as HTMLElement | null
                            if (grip) grip.style.opacity = '1'
                            const editBtns = e.currentTarget.querySelector('.note-edit-buttons') as HTMLElement | null
                            if (editBtns) editBtns.style.opacity = '1'
                          }}
                          onMouseLeave={e => {
                            const grip = e.currentTarget.querySelector('.dp-grip') as HTMLElement | null
                            if (grip) grip.style.opacity = '0.3'
                            const editBtns = e.currentTarget.querySelector('.note-edit-buttons') as HTMLElement | null
                            if (editBtns) editBtns.style.opacity = '0'
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 8px 7px 2px',
                            margin: '1px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--border-faint)',
                            borderTop: showDropLine ? '2px solid var(--text-primary)' : undefined,
                            background: 'var(--bg-hover)',
                            opacity: draggingId === `note-${note.id}` ? 0.4 : 1,
                            transition: 'background 0.1s', cursor: 'grab', userSelect: 'none',
                          }}
                        >
                          {canEditDays && <div className="dp-grip" style={{ flexShrink: 0, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', opacity: 0.3, transition: 'opacity 0.15s', cursor: 'grab' }}>
                            <GripVertical size={13} strokeWidth={1.8} />
                          </div>}
                          <div style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--bg-hover)', overflow: 'hidden' }}>
                            <NoteIcon size={13} strokeWidth={1.8} color="var(--text-muted)" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                              {note.text}
                            </span>
                            {note.time && (
                              <div className="collab-note-md" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', fontWeight: 400, color: 'var(--text-faint)', lineHeight: '1.3', marginTop: 2, wordBreak: 'break-word' }}><Markdown remarkPlugins={[remarkGfm]}>{note.time}</Markdown></div>
                            )}
                          </div>
                          {canEditDays && <div className="note-edit-buttons" style={{ display: 'flex', gap: 1, flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}>
                            <button onClick={e => openEditNote(day.id, note, e)} className="text-content-faint" style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}><Pencil size={10} /></button>
                            <button onClick={e => { e.stopPropagation(); setPendingDeleteNote({ dayId: day.id, noteId: note.id }) }} className="text-content-faint" style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex' }}><Trash2 size={10} /></button>
                          </div>}
                          {canEditDays && <div className="reorder-buttons" style={{ flexShrink: 0, display: 'flex', gap: 1, transition: 'opacity 0.15s' }}>
                            <button onClick={e => { e.stopPropagation(); moveNote(day.id, note.id, 'up') }} disabled={noteIdx === 0} className={noteIdx === 0 ? 'text-[var(--border-primary)]' : 'text-content-faint'} style={{ background: 'none', border: 'none', padding: '1px 2px', cursor: noteIdx === 0 ? 'default' : 'pointer', display: 'flex', lineHeight: 1 }}><ChevronUp size={12} strokeWidth={2} /></button>
                            <button onClick={e => { e.stopPropagation(); moveNote(day.id, note.id, 'down') }} disabled={noteIdx === merged.length - 1} className={noteIdx === merged.length - 1 ? 'text-[var(--border-primary)]' : 'text-content-faint'} style={{ background: 'none', border: 'none', padding: '1px 2px', cursor: noteIdx === merged.length - 1 ? 'default' : 'pointer', display: 'flex', lineHeight: 1 }}><ChevronDown size={12} strokeWidth={2} /></button>
                          </div>}
                        </div>
                        </React.Fragment>
                      )
                    })
                  )}
                  {hotelLegs[day.id]?.bottom && (
                    <HotelRouteConnector seg={hotelLegs[day.id]!.bottom!.seg} name={hotelLegs[day.id]!.bottom!.name} profile={routeProfile} placement="bottom" />
                  )}
                  {/* Drop-Zone am Listenende — immer vorhanden als Drop-Target */}
                  <div
                    style={{ minHeight: 12, padding: '2px 8px' }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); if (dropTargetKey !== `end-${day.id}`) setDropTargetKey(`end-${day.id}`) }}
                    onDrop={e => {
                      e.preventDefault(); e.stopPropagation()
                      const { placeId, assignmentId, noteId, reservationId: fromReservationId, fromDayId, phase } = getDragData(e)
                      // Neuer Ort von der Orte-Liste
                      if (placeId) {
                        onAssignToDay?.(parseInt(placeId), day.id)
                        setDropTargetKey(null); window.__dragData = null; return
                      }
                      if (fromReservationId && fromDayId !== day.id) {
                        const r = reservations.find(x => x.id === Number(fromReservationId))
                        if (r) { const update = computeMultiDayMove(r, day.id, phase); tripActions.updateReservation(tripId, r.id, update).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError'))) }
                        setDraggingId(null); setDropTargetKey(null); dragDataRef.current = null; window.__dragData = null; return
                      }
                      if (!assignmentId && !noteId && !fromReservationId) { dragDataRef.current = null; window.__dragData = null; return }
                      if (assignmentId && fromDayId !== day.id) {
                        tripActions.moveAssignment(tripId, Number(assignmentId), fromDayId, day.id).catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('common.unknownError')))
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
                        handleMergedDrop(day.id, 'place', Number(assignmentId), lastItem.type, lastItem.data.id, true)
                      else if (noteId && String(lastItem?.data?.id) !== noteId)
                        handleMergedDrop(day.id, 'note', Number(noteId), lastItem.type, lastItem.data.id, true)
                      else if (fromReservationId && String(lastItem?.data?.id) !== fromReservationId)
                        handleMergedDrop(day.id, 'transport', Number(fromReservationId), lastItem.type, lastItem.data.id, true)
                      setDropTargetKey(null); dragDataRef.current = null; window.__dragData = null
                    }}
                  >
                    {dropTargetKey === `end-${day.id}` && (
                      <div style={{ height: 2, background: 'var(--text-primary)', borderRadius: 1 }} />
                    )}
                  </div>

                  {/* Routen-Werkzeuge (ausgewählter Tag, 2+ Orte — oder 1 Ort mit Hotel-Bookend, #1330) */}
                  {(isSelected || (showRouteToolsWhenExpanded && isExpanded)) && routeToolsRoutable && (
                    <div style={{ padding: '10px 16px 12px', borderTop: '1px solid var(--border-faint)', display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                        <button
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
                            } else if (isSelected) { onToggleRoute?.() }
                            // Desktop: the route is computed for the globally selected day,
                            // so tapping Route on another day first points the selection here.
                            else { onSelectDay(day.id, true); if (!routeShown) onToggleRoute?.() }
                          }}
                          className={routeActive ? 'bg-accent text-accent-text' : 'bg-transparent text-content-secondary'}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            padding: '6px 0', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, borderRadius: 8,
                            border: routeActive ? 'none' : '1px solid var(--border-faint)',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          <RouteIcon size={12} strokeWidth={2} />
                          {t('dayplan.route')}
                        </button>
                        {/* Open the day's stops as a route in Google Maps (planned order). #1255 */}
                        <button
                          onClick={() => {
                            // Bookend the Google Maps route with the day's accommodation the
                            // same way the drawn map route does (routeBookends is null when
                            // "optimize from accommodation" is off), so hotels aren't dropped
                            // from the exported route (#1372).
                            const stops = getDayAssignments(day.id).map(a => a.place).filter(p => p?.lat != null && p?.lng != null) as { lat: number; lng: number }[]
                            const morning = routeBookends?.morning?.place_lat != null && routeBookends?.morning?.place_lng != null
                              ? { lat: routeBookends.morning.place_lat, lng: routeBookends.morning.place_lng } : null
                            const evening = routeBookends?.evening?.place_lat != null && routeBookends?.evening?.place_lng != null
                              ? { lat: routeBookends.evening.place_lat, lng: routeBookends.evening.place_lng } : null
                            const url = generateGoogleMapsUrl([...(morning ? [morning] : []), ...stops, ...(evening ? [evening] : [])])
                            if (url) window.open(url, '_blank', 'noopener,noreferrer')
                          }}
                          aria-label={t('planner.openGoogleMaps')}
                          title={t('planner.openGoogleMaps')}
                          className="bg-transparent text-content-secondary"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-faint)',
                            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
                            <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                        </button>
                        <button onClick={() => handleOptimize(day.id)} className="bg-surface-hover text-content-secondary" style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          padding: '6px 0', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 500, borderRadius: 8, border: 'none',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                          <RotateCcw size={12} strokeWidth={2} />
                          {t('dayplan.optimize')}
                        </button>
                        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-faint)', flexShrink: 0 }}>
                          {(['driving', 'walking'] as const).map(p => {
                            const ModeIcon = p === 'driving' ? Car : Footprints
                            const active = routeProfile === p
                            return (
                              <button
                                key={p}
                                onClick={() => onSetRouteProfile?.(p)}
                                aria-label={p === 'driving' ? 'Driving' : 'Walking'}
                                className={active ? 'bg-accent text-accent-text' : 'bg-transparent text-content-secondary'}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  padding: '6px 10px', border: 'none', cursor: 'pointer',
                                }}
                              >
                                <ModeIcon size={13} strokeWidth={2} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      {isSelected && routeInfo && (
                        <div className="text-content-secondary bg-surface-hover" style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 'calc(12px * var(--fs-scale-body, 1))', borderRadius: 8, padding: '5px 10px' }}>
                          <span>{routeInfo.distance}</span>
                          <span className="text-content-faint">·</span>
                          <span>{routeInfo.duration}</span>
                        </div>
                      )}
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
        onConfirm={() => { if (pendingDeleteNote) deleteNote(pendingDeleteNote.dayId, pendingDeleteNote.noteId) }}
        title={t('dayplan.confirmDeleteNoteTitle')}
        message={t('dayplan.confirmDeleteNoteBody')}
      />

      {/* Transport-Detail-Modal */}
      <DayPlanSidebarTransportDetailModal
        transportDetail={transportDetail}
        setTransportDetail={setTransportDetail}
        onNavigateToFiles={onNavigateToFiles}
        t={t}
        locale={locale}
        timeFormat={timeFormat}
      />

      {/* Budget-Fußzeile */}
      <DayPlanSidebarFooter totalCost={totalCost} currency={currency} t={t} />
      <ContextMenu menu={ctxMenu.menu} onClose={ctxMenu.close} />
    </div>
  )
})

export default DayPlanSidebar
