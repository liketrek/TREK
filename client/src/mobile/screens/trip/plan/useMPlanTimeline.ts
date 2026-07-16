import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTripStore } from '../../../../store/tripStore'
import { useRouteCalculation } from '../../../../hooks/useRouteCalculation'
import { reservationsApi, weatherApi } from '../../../../api/client'
import { getDayBookendHotels } from '../../../../utils/dayOrder'
import { getDisplayTimeForDay, getMergedItems, getTransportForDay } from '../../../../utils/dayMerge'
import { dayGoogleMapsUrl, optimizeDayOrder } from '../lib/dayRoute'
import {
  buildPlanRows, breaksChronology, findUpNext, hotelChipsForDay, itemHasTime,
  type PlanRow, type TransportEntry,
} from './planTimelineModel'
import type { TripPlanner } from '../MTripShell'
import type { WeatherResult } from '@trek/shared'
import type { Assignment, Place } from '../../../../types'
import type { MergedItem } from '../../../../utils/dayMerge'

/**
 * State + actions behind the mobile plan timeline. Everything data-shaped comes
 * from the planner (same store the desktop page drives, so WS sync / offline /
 * undo stay intact); this hook only derives the day's rows and packages the
 * actions the pixel design exposes: reorder buttons (#1432 — no drag on touch),
 * remove/edit place, the add bars, optimize and the Google-Maps export.
 * Reads tripStore directly only for dayNotes, which the planner doesn't expose.
 */
export function useMPlanTimeline(planner: TripPlanner) {
  const {
    tripId, days, assignments, reservations, tripAccommodations, selectedDayId,
    t, language, settings, toast, tripActions, pushUndo, updateRouteForDay, routeProfile,
  } = planner

  const dayNotes = useTripStore(s => s.dayNotes)
  const day = days.find(d => d.id === selectedDayId)

  const dayAssignments = useMemo<Assignment[]>(() => {
    if (!day) return []
    return [...(assignments[String(day.id)] || [])].sort((a, b) => a.order_index - b.order_index)
  }, [assignments, day])

  const merged = useMemo<MergedItem[]>(() => {
    if (!day) return []
    const dayTransports = getTransportForDay({
      reservations,
      dayId: day.id,
      dayAssignmentIds: dayAssignments.map(a => a.id),
      days,
    })
    return getMergedItems({
      dayAssignments,
      dayNotes: dayNotes[String(day.id)] || [],
      dayTransports,
      dayId: day.id,
    })
  }, [day, dayAssignments, dayNotes, reservations, days])

  // Travel-time connectors (walk · distance · drive between consecutive places)
  // are shown permanently on the mobile timeline. The planner's route instance
  // only computes segments while the manual "show route" toggle is on (map), so
  // we run a dedicated, always-enabled calculation just for the connectors and
  // use only its segments — the polyline it produces is ignored here.
  const { routeSegments: connSegments } = useRouteCalculation(
    { assignments } as unknown as Parameters<typeof useRouteCalculation>[0],
    selectedDayId,
    true,
    routeProfile,
    tripAccommodations,
  )

  const rows = useMemo<PlanRow[]>(() => {
    if (!day) return []
    return buildPlanRows({ merged, reservations, routeSegments: connSegments, dayId: day.id })
  }, [day, merged, reservations, connSegments])

  const hotelChips = useMemo(
    () => (day ? hotelChipsForDay(day, days, tripAccommodations) : []),
    [day, days, tripAccommodations],
  )

  // ── Up next (go mode) — a real countdown, re-evaluated every half minute ──
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const upNext = useMemo(() => findUpNext(day, dayAssignments, now), [day, dayAssignments, now])

  // ── Weather chip — anchored to the day's first located stop, else its hotel ──
  const weatherCoords = useMemo<{ lat: number; lng: number } | null>(() => {
    const located = dayAssignments.find(a => a.place?.lat != null && a.place?.lng != null)
    if (located) return { lat: located.place!.lat!, lng: located.place!.lng! }
    const hotel = day ? getDayBookendHotels(day, days, tripAccommodations).morning : undefined
    if (hotel && hotel.place_lat != null && hotel.place_lng != null) {
      return { lat: hotel.place_lat, lng: hotel.place_lng }
    }
    return null
  }, [day, dayAssignments, days, tripAccommodations])

  const [weather, setWeather] = useState<WeatherResult | null>(null)
  useEffect(() => {
    if (!day?.date || !weatherCoords) { setWeather(null); return }
    let cancelled = false
    weatherApi.get(weatherCoords.lat, weatherCoords.lng, day.date.slice(0, 10))
      .then(data => { if (!cancelled) setWeather(data.error ? null : data) })
      .catch(() => { if (!cancelled) setWeather(null) })
    return () => { cancelled = true }
  }, [day?.date, weatherCoords])

  // ── Expanded auto-transit rows ──
  const [openTransitKeys, setOpenTransitKeys] = useState<Set<string>>(new Set())
  const toggleTransit = useCallback((key: string) => {
    setOpenTransitKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ── Reorder via buttons (#1432) — port of the desktop applyMergedOrder ──
  const applyMergedOrder = useCallback(async (dayId: number, newOrder: MergedItem[]) => {
    const prevAssignmentIds = dayAssignments.map(a => a.id)
    const assignmentIds: number[] = []
    const noteUpdates: { id: number; sort_order: number }[] = []
    const transportUpdates: { id: number; day_plan_position: number }[] = []
    const legPosUpdates: Record<number, Record<number, number>> = {}

    let placeCount = 0
    let i = 0
    while (i < newOrder.length) {
      if (newOrder[i].type === 'place') {
        assignmentIds.push((newOrder[i].data as Assignment).id)
        placeCount++
        i++
        continue
      }
      const group: MergedItem[] = []
      while (i < newOrder.length && newOrder[i].type !== 'place') { group.push(newOrder[i]); i++ }
      const base = placeCount > 0 ? placeCount - 1 : -1
      group.forEach((g, idx) => {
        const pos = base + (idx + 1) / (group.length + 1)
        if (g.type === 'note') noteUpdates.push({ id: g.data.id, sort_order: pos })
        else if (g.type === 'transport') {
          const res = g.data as TransportEntry
          if (res.__leg) (legPosUpdates[res.id] ??= {})[res.__leg.index] = pos
          else transportUpdates.push({ id: res.id, day_plan_position: pos })
        }
      })
    }

    try {
      // Optimistic transport positions first, so the recomputed merge is stable
      // before the reorder round-trips (same order of operations as the desktop).
      if (transportUpdates.length) {
        useTripStore.setState(state => ({
          reservations: state.reservations.map(r => {
            const tu = transportUpdates.find(u => u.id === r.id)
            if (!tu) return r
            return {
              ...r,
              day_plan_position: tu.day_plan_position,
              day_positions: { ...(r.day_positions || {}), [dayId]: tu.day_plan_position },
            }
          }),
        }))
      }
      // Per-leg positions of a multi-leg flight/train live in metadata.legs[i].
      for (const ridStr of Object.keys(legPosUpdates)) {
        const rid = Number(ridStr)
        const r = useTripStore.getState().reservations.find(x => x.id === rid)
        if (!r) continue
        let parsed: Record<string, unknown> = {}
        try { parsed = typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : ((r.metadata as never) || {}) } catch { parsed = {} }
        if (!Array.isArray(parsed.legs)) continue
        const legs = (parsed.legs as Record<string, unknown>[]).map((leg, li) => {
          const pos = legPosUpdates[rid][li]
          return pos == null ? leg : { ...leg, day_positions: { ...((leg.day_positions as object) || {}), [dayId]: pos } }
        })
        const newMeta = { ...parsed, legs }
        useTripStore.setState(state => ({
          reservations: state.reservations.map(x => (x.id === rid ? { ...x, metadata: newMeta as never } : x)),
        }))
        // Metadata must go out as an OBJECT — a JSON string double-encodes on the
        // server and wipes metadata.legs on read (same cast the desktop relies on).
        await tripActions.updateReservation(tripId, rid, { metadata: newMeta as unknown as string })
      }
      if (assignmentIds.length) await tripActions.reorderAssignments(tripId, dayId, assignmentIds)
      if (transportUpdates.length) await reservationsApi.updatePositions(tripId, transportUpdates, dayId)
      for (const n of noteUpdates) {
        await tripActions.updateDayNote(tripId, dayId, n.id, { sort_order: n.sort_order })
      }
      if (prevAssignmentIds.length) {
        pushUndo(t('undo.reorder'), async () => {
          await tripActions.reorderAssignments(tripId, dayId, prevAssignmentIds)
        })
      }
      updateRouteForDay(dayId)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('trip.toast.reorderError'))
    }
  }, [dayAssignments, tripActions, tripId, pushUndo, updateRouteForDay, toast, t])

  const moveRow = useCallback((item: MergedItem, direction: 'up' | 'down') => {
    if (!day) return
    const idx = merged.indexOf(item)
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || target < 0 || target >= merged.length) return
    const newOrder = [...merged]
    newOrder[idx] = merged[target]
    newOrder[target] = item
    // Same guard as the desktop arrow buttons: a TIMED item may not jump past
    // other timed items (untimed items move freely and keep their neighbours).
    if (itemHasTime(item, day.id) && breaksChronology(newOrder, day.id, getDisplayTimeForDay)) {
      toast.info(t('dayplan.cannotBreakChronology'))
      return
    }
    void applyMergedOrder(day.id, newOrder)
  }, [day, merged, applyMergedOrder, toast, t])

  // ── Place actions ──
  const removeAssignment = useCallback((assignment: Assignment) => {
    if (!day) return
    void planner.handleRemoveAssignment(day.id, assignment.id)
  }, [day, planner])

  const editAssignment = useCallback((assignment: Assignment) => {
    const full = planner.places.find(p => p.id === assignment.place_id)
    if (full) planner.openPlaceEditor(full, assignment.id)
  }, [planner])

  // ── Add bar ──
  const addPlace = useCallback(() => {
    planner.setEditingPlace(null)
    planner.setEditingAssignmentId(null)
    planner.setPrefillCoords(null)
    planner.setShowPlaceForm(true)
  }, [planner])

  const addBooking = useCallback(() => {
    planner.setEditingReservation(null)
    planner.setBookingForAssignmentId(null)
    planner.setShowReservationModal(true)
  }, [planner])

  const addTransport = useCallback(() => {
    planner.setEditingTransport(null)
    planner.setTransitPrefill(null)
    planner.setTransportModalAutomated(false)
    planner.setTransportModalDayId(day?.id ?? null)
    planner.setShowTransportModal(true)
  }, [planner, day])

  const editTransport = useCallback((res: TransportEntry) => {
    const target = reservations.find(x => x.id === res.id) ?? res
    if (planner.TRANSPORT_TYPES.has(res.type)) {
      planner.setEditingTransport(target)
      planner.setShowTransportModal(true)
    } else {
      planner.setEditingReservation(target)
      planner.setShowReservationModal(true)
    }
  }, [planner, reservations])

  /** Transit rows open the journey view (route, fields, delete) instead of the generic form. */
  const openTransitJourney = useCallback((res: TransportEntry) => {
    planner.setTransitJourney(reservations.find(x => x.id === res.id) ?? res)
  }, [planner, reservations])

  // ── Day-route actions (also reachable from the day sheet) ──
  const optimize = useCallback(async () => {
    if (!day) return
    const prevIds = dayAssignments.map(a => a.id)
    const result = optimizeDayOrder(
      day, days, dayAssignments, tripAccommodations, settings.optimize_from_accommodation !== false,
    )
    if (!result) { toast.info(t('dayplan.toast.needTwoPlaces')); return }
    try {
      await tripActions.reorderAssignments(tripId, day.id, result.order.map(a => a.id))
      pushUndo(t('undo.optimize'), async () => {
        await tripActions.reorderAssignments(tripId, day.id, prevIds)
      })
      updateRouteForDay(day.id)
      toast.success(result.usedHotel ? t('dayplan.toast.routeOptimizedFromHotel') : t('dayplan.toast.routeOptimized'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('trip.toast.reorderError'))
    }
  }, [day, dayAssignments, days, tripAccommodations, settings, tripActions, tripId, pushUndo, updateRouteForDay, toast, t])

  const exportGoogleMaps = useCallback(() => {
    if (!day) return
    // Bookend the exported route with the day's accommodation the same way the
    // drawn route does — only when the leg is real (#1372, #1465).
    const url = dayGoogleMapsUrl(
      day, days, dayAssignments, tripAccommodations, settings.optimize_from_accommodation !== false,
    )
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }, [day, dayAssignments, days, tripAccommodations, settings])

  const renameDay = useCallback((title: string) => {
    if (!day) return
    void planner.handleUpdateDayTitle(day.id, title.trim())
  }, [day, planner])

  /** Full pool entry for a timeline place (the avatar wants osm_id, which the assignment projection lacks). */
  const fullPlaceOf = useCallback((assignment: Assignment): Place | undefined =>
    planner.places.find(p => p.id === assignment.place_id), [planner.places])

  // Rounded display temperature in the user's unit (the API always answers in °C).
  const weatherTemp = weather
    ? Math.round(settings.temperature_unit === 'fahrenheit' ? weather.temp * 9 / 5 + 32 : weather.temp)
    : null

  return {
    day, rows, merged, hotelChips, weather, weatherTemp, upNext,
    language, timeFormat: settings.time_format,
    openTransitKeys, toggleTransit,
    moveRow, removeAssignment, editAssignment, editTransport, openTransitJourney,
    addPlace, addBooking, addTransport,
    optimize, exportGoogleMaps, renameDay, fullPlaceOf,
  }
}

export type MPlanTimelineController = ReturnType<typeof useMPlanTimeline>
