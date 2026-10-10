import { useCallback, useState } from 'react'
import type { RoadtripStopType } from '@trek/shared'
import { accommodationsApi } from '../../api/client'
import type { StayDraft } from '../../components/Roadtrip/RoadtripStayModal'
import { reanchorAfterInsert, reanchorAfterRemove, reanchorAfterReorder } from '../../components/Roadtrip/roadtripModel'
import type { RoadtripStop } from '../../components/Roadtrip/useRoadtripRoutes'
import type { useRouteCalculation } from '../../hooks/useRouteCalculation'
import { applyStayStops } from '../../store/stayStops'
import type { TripStoreState } from '../../store/tripStore'
import type { Accommodation } from '../../types'
import type { PlannerBase } from './plannerTypes'
import type { PlannerDialogs } from './usePlannerDialogs'
import type { RoadtripFeed } from './useRoadtripFeed'

interface RoadtripStopEditsOptions
  extends Pick<PlannerBase, 'tripId' | 'trip' | 'can' | 'tripActions' | 'toast' | 't'>,
  Pick<PlannerDialogs, 'stopDraft' | 'setStopDraft' | 'stayRelease' | 'setStayRelease'>,
  Pick<RoadtripFeed, 'roadtripVias' | 'viaLiesBefore' | 'roadtripStopsOf' | 'dailyTimesActive' | 'dayBoundaries'> {
  assignments: TripStoreState['assignments']
  tripAccommodations: Accommodation[]
  reservations: TripStoreState['reservations']
  /** Reloads the booked nights useTripPlanner holds. */
  loadAccommodations: () => void
  updateRouteForDay: ReturnType<typeof useRouteCalculation>['updateRouteForDay']
}

/**
 * Edits to one stop on the drive: saving the stop popup as a pause or as a night,
 * releasing a booked night, the kind, fill and stay of a stop, moving it within its day
 * or onto another one from the rail, ending the day at it, and the stay dialog.
 *
 * Nothing here runs an effect, so where useTripPlanner calls it changes nothing.
 */
export function useRoadtripStopEdits(options: RoadtripStopEditsOptions) {
  const {
    tripId, trip, can, tripActions, toast, t, assignments, tripAccommodations, reservations, loadAccommodations,
    updateRouteForDay, stopDraft, setStopDraft, stayRelease, setStayRelease,
    roadtripVias, viaLiesBefore, roadtripStopsOf, dailyTimesActive, dayBoundaries,
  } = options
  /**
   * Saves a corridor hit as a stop: the place itself, then its position in the day.
   *
   * `stop_type` is what makes it a fuel stop rather than a place that happens to sell
   * fuel: the road-trip kinds are their own dimension, deliberately not one of the
   * traveller's editable categories, so the palette and the meaning stay put.
   */
  const saveStopDraft = useCallback(async (
    { stopType, dwellMinutes }: { stopType: RoadtripStopType | null; dwellMinutes: number },
    { releaseStay = false }: { releaseStay?: boolean } = {},
  ) => {
    if (!stopDraft) return
    const { poi, dayId, position } = stopDraft
    const accommodationId = stopDraft.editing?.accommodationId
    // Turning a booked night into a pause deletes the booking, and with it the
    // reservation and the expense the server keeps against it. The popup stays open
    // behind the question, so a no leaves the traveller exactly where they were.
    if (accommodationId && !releaseStay) {
      const stay = tripAccommodations.find(s => s.id === accommodationId)
      const booking = reservations.find(r => r.accommodation_id != null && Number(r.accommodation_id) === accommodationId)?.title
        ?? stay?.reservation_title ?? null
      setStayRelease({ stop: { stopType, dwellMinutes }, name: poi.name, booking })
      return
    }
    try {
      if (stopDraft.editing) {
        await tripActions.updatePlace(tripId, stopDraft.editing.placeId, { stop_type: stopType, duration_minutes: dwellMinutes })
        if (accommodationId) {
          // The night is what was switched off, not the stop: it stays where it is
          // in the drive and becomes an ordinary pause.
          applyStayStops(await accommodationsApi.delete(tripId, accommodationId, { keepStop: true }))
          await loadAccommodations()
        }
        updateRouteForDay(dayId)
        setStopDraft(null)
        return
      }
      const place = await tripActions.addPlace(tripId, {
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        address: poi.address || null,
        website: poi.website || undefined,
        phone: poi.phone || undefined,
        osm_id: poi.osm_id,
        duration_minutes: dwellMinutes,
        stop_type: stopType,
      })
      if (place?.id) {
        // Worked out BEFORE the stop lands, against the day as it stands and the road as
        // it is currently driven: once the list has shifted there is no record of which
        // leg each via was drawn for.
        const plan = reanchorAfterInsert(
          roadtripVias.byDay[dayId] ?? [],
          position,
          viaLiesBefore(dayId, { lat: poi.lat, lng: poi.lng }),
        )
        await tripActions.assignPlaceToDay(tripId, dayId, place.id, position)
        // Awaited before the day re-routes: the routing effect reads the anchors against
        // the new stop list, so a correction landing after it would draw the wrong road
        // first and the right one a moment later.
        await roadtripVias.reanchor(dayId, plan)
        updateRouteForDay(dayId)
      }
      setStopDraft(null)
      toast.success(t('trip.toast.placeAdded'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [stopDraft, tripId, tripActions, updateRouteForDay, toast, t, roadtripVias, viaLiesBefore, loadAccommodations, tripAccommodations, reservations, setStayRelease, setStopDraft])

  /** The yes to the question above: the same save, this time allowed to drop the night. */
  const confirmStayRelease = useCallback(async () => {
    const pending = stayRelease
    setStayRelease(null)
    if (pending) await saveStopDraft(pending.stop, { releaseStay: true })
  }, [stayRelease, saveStopDraft, setStayRelease])

  const saveStopDraftAsNight = useCallback(async ({ endDayId, checkIn, checkOut }: {
    endDayId: number
    checkIn: string
    checkOut: string
  }) => {
    if (!stopDraft) return
    const { poi, dayId, position } = stopDraft
    try {
      if (stopDraft.editing) {
        const booking = { place_id: stopDraft.editing.placeId, start_day_id: dayId, end_day_id: endDayId, check_in: checkIn || null, check_out: checkOut || null }
        // The answer carries the day stop the booking moved or added. The socket
        // deliberately skips the session that sent the request, so without folding
        // it in the one person whose rail still shows the night at its old place in
        // the chain is the one who just moved its check-in.
        const written = stopDraft.editing.accommodationId
          ? await accommodationsApi.update(tripId, stopDraft.editing.accommodationId, booking)
          : await accommodationsApi.create(tripId, booking)
        applyStayStops(written)
        // A night seated by a new check-in renumbers its neighbours as well, and the
        // answer names only the night. The day is read back whole rather than guessed.
        if (written?.movedAssignment) await tripActions.refreshDays(tripId)
        await tripActions.updatePlace(tripId, stopDraft.editing.placeId, { stop_type: poi.category === 'campsite' ? 'campsite' : 'hotel' })
        await loadAccommodations()
        updateRouteForDay(dayId)
        setStopDraft(null)
        return
      }
      const place = await tripActions.addPlace(tripId, {
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        address: poi.address || null,
        website: poi.website || undefined,
        phone: poi.phone || undefined,
        osm_id: poi.osm_id,
        stop_type: poi.category === 'campsite' ? 'campsite' : 'hotel',
      })
      if (place?.id) {
        const plan = reanchorAfterInsert(
          roadtripVias.byDay[dayId] ?? [],
          position,
          viaLiesBefore(dayId, { lat: poi.lat, lng: poi.lng }),
        )
        await tripActions.assignPlaceToDay(tripId, dayId, place.id, position)
        await accommodationsApi.create(tripId, {
          place_id: place.id,
          start_day_id: dayId,
          end_day_id: endDayId,
          ...(checkIn ? { check_in: checkIn } : {}),
          ...(checkOut ? { check_out: checkOut } : {}),
        })
        await loadAccommodations()
        await roadtripVias.reanchor(dayId, plan)
        updateRouteForDay(dayId)
      }
      setStopDraft(null)
      toast.success(t('roadtrip.stay.nightAdded'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [stopDraft, tripId, tripActions, updateRouteForDay, toast, t, roadtripVias, viaLiesBefore, loadAccommodations, setStopDraft])

  /**
   * Turns a stop on the drive into a pause, or back into a destination.
   *
   * The only difference between the two is `stop_type`, which decides whether the stop
   * takes a number, counts in the day's total and appears in the printout. So this is one
   * field on one place, and the rail redraws itself off the store the moment it lands.
   */
  const setRoadtripStopKind = useCallback(async (placeId: number, kind: RoadtripStopType | null) => {
    if (!can('place_edit', trip)) return
    try {
      await tripActions.updatePlace(tripId, placeId, { stop_type: kind })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [tripId, tripActions, toast, t, can, trip])

  /**
   * How full THIS stop fills the tank, from the road trip rail.
   *
   * The same shape as the kind above and for the same reason: one field on one place,
   * with the rail redrawing off the store the moment it lands. Null hands the stop back
   * to whatever the traveller set as their own default, which is what every stop does
   * until somebody has an opinion about one.
   */
  const setRoadtripStopFill = useCallback(async (placeId: number, percent: number | null) => {
    if (!can('place_edit', trip)) return
    try {
      await tripActions.updatePlace(tripId, placeId, { fill_percent: percent })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [tripId, tripActions, toast, t, can, trip])

  /**
   * Moves a stop within its day, from the road trip rail.
   *
   * The rail reports only "this assignment, from here to there" and the full order is
   * rebuilt here, from the day's COMPLETE assignment list rather than from what the rail
   * shows. That matters: the rail hides stops without coordinates, and both
   * `reorderAssignments` and the WebSocket handler rebuild the day's array purely from the
   * ids they are given: anything left out would vanish from the store, for every session
   * watching the trip.
   *
   * Within one day only. Moving between days stays in the day plan, where empty and
   * one-stop days are visible and can be dropped onto; the rail leaves them out, so a day
   * would disappear from under the cursor mid-gesture.
   *
   * No confirmation prompt for a stop with a pinned time, unlike the day plan: the rail
   * recomputes the cascade immediately and marks a stop it can no longer reach in time.
   * Showing the consequence is better than asking about it in advance.
   */
  const reorderRoadtripStop = useCallback(async (dayId: number, assignmentId: number, toIndex: number) => {
    if (!can('day_edit', trip)) return
    const all = assignments[String(dayId)] ?? []
    const ordered = [...all].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    const fromIdx = ordered.findIndex(a => a.id === assignmentId)
    if (fromIdx === -1) return

    // `toIndex` counts stops as the rail lists them; map it onto the full list, which may
    // hold rows the rail never showed.
    const visible = ordered.filter(a => typeof a.place?.lat === 'number' && typeof a.place?.lng === 'number')
    const target = visible[Math.min(Math.max(toIndex, 0), visible.length - 1)]
    if (!target || target.id === assignmentId) return
    const toIdx = ordered.findIndex(a => a.id === target.id)
    if (toIdx === -1 || toIdx === fromIdx) return

    const next = [...ordered]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)

    // In the rail's own index space, which is the one the anchors are counted in. A stop
    // without coordinates never entered that space, so moving it changes nothing there.
    const fromVis = visible.findIndex(a => a.id === assignmentId)
    const plan = fromVis === -1
      ? null
      : reanchorAfterReorder(roadtripVias.byDay[dayId] ?? [], fromVis, toIndex, visible.length)

    try {
      await tripActions.reorderAssignments(tripId, dayId, next.map(a => a.id))
      if (plan) await roadtripVias.reanchor(dayId, plan)
      updateRouteForDay(dayId)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [assignments, tripId, tripActions, updateRouteForDay, toast, t, can, trip, roadtripVias])

  /**
   * The stop whose length is being set, or null while the dialog is closed.
   *
   * Held here rather than in the rail because the write goes through `tripActions`, and
   * the rail is a list: putting a dialog's state inside a row means it dies whenever the
   * list re-renders around it.
   */
  const [stayDraft, setStayDraft] = useState<StayDraft | null>(null)

  /**
   * Whether the day ends at this stop, from BOTH the things that can end it.
   *
   * A stop carries an `end_day` flag, and a day can also be closed by a manual boundary
   * filed against that stop (`to_assignment_id === null`). `setRoadtripEndDay` already
   * knows about both and clears whichever is set, so a surface reading only the flag shows
   * a day end as off, and the tap meant to switch it on deletes the boundary instead. The
   * question is asked here once rather than answered again per surface.
   */
  const roadtripEndsDayAt = useCallback(
    (stop: RoadtripStop): boolean =>
      !!stop.endDay
      || dayBoundaries.boundaries.some(b => b.to_assignment_id === null && b.from_assignment_id === stop.assignmentId),
    [dayBoundaries.boundaries],
  );

  /**
   * Returns whether the day end actually moved.
   *
   * It reports rather than throws, because it shows its own toast and a second one from the
   * caller would be the same news twice. A caller that flipped a switch optimistically has
   * to hear about a refusal all the same, or it sits there showing a state the trip never
   * reached: the phone sheet's catch was unreachable for exactly this reason.
   */
  const setRoadtripEndDay = useCallback(async (stop: RoadtripStop): Promise<boolean> => {
    if (!dailyTimesActive || !can('day_edit', trip)) return false
    try {
      const manual = dayBoundaries.boundaries.find(b => b.to_assignment_id === null && b.from_assignment_id === stop.assignmentId)
      if (manual) {
        await dayBoundaries.save(manual.day_number, null)
        if (!stop.endDay) return true
      }
      await tripActions.setAssignmentEndDay(tripId, stop.ownerDayId, stop.assignmentId, !stop.endDay)
      return true
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      return false
    }
  }, [dailyTimesActive, can, trip, tripActions, tripId, toast, t, dayBoundaries.boundaries, dayBoundaries.save])

  /**
   * How long the traveller stays at one stop.
   *
   * Writes `places.duration_minutes`, which the schedule has read since it was written
   * and which nothing in TREK has ever been able to set: the road trip is the only place
   * the value means anything, so it is the only place that edits it.
   *
   * Zero rather than null to clear: the update statement folds a null into "leave it
   * alone" (`COALESCE(?, duration_minutes)`), so a null could give a stop a stay but
   * never take one away. The rail reads zero and absent as the same thing.
   */
  const setRoadtripStay = useCallback(async (placeId: number, minutes: number) => {
    if (!can('place_edit', trip)) return
    try {
      await tripActions.updatePlace(tripId, placeId, { duration_minutes: minutes })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [tripId, tripActions, toast, t, can, trip])

  /**
   * Moves a stop onto another day, from the road trip rail.
   *
   * Split from `reorderRoadtripStop` because it is a different call with a different
   * failure mode: `moveAssignment` writes to two days, and the rail has to be able to
   * reach days it draws no drive for: a day with one stop or none is exactly what a
   * stop gets moved onto when a leg turns out to be too long for one day.
   *
   * The target index counts the stops the rail shows on that day; an empty day takes
   * position 0.
   */
  const moveRoadtripStopToDay = useCallback(async (
    fromDayId: number,
    assignmentId: number,
    toDayId: number,
    toIndex: number,
  ) => {
    if (!can('day_edit', trip)) return
    if (fromDayId === toDayId) return
    const target = (assignments[String(toDayId)] ?? [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    const visible = target.filter(a => typeof a.place?.lat === 'number' && typeof a.place?.lng === 'number')
    // Map the rail's own count onto the day's full list, which may hold rows it hides.
    const anchor = visible[Math.min(Math.max(toIndex, 0), Math.max(visible.length - 1, 0))]
    const at = anchor ? target.findIndex(a => a.id === anchor.id) : target.length

    // Both days shift at once, and each needs its own correction: the stop leaves a gap
    // on one side and opens one on the other. No geometry is measured for the arriving
    // day: its roads are about to be different anyway, so there is nothing stable to
    // measure a via against.
    const fromStops = roadtripStopsOf(fromDayId)
    const fromVis = fromStops.findIndex(a => a.id === assignmentId)
    const fromPlan = fromVis === -1
      ? null
      : reanchorAfterRemove(roadtripVias.byDay[fromDayId] ?? [], fromVis, fromStops.length)
    const toVis = Math.min(Math.max(toIndex, 0), visible.length)
    const toPlan = fromVis === -1
      ? null
      : reanchorAfterInsert(roadtripVias.byDay[toDayId] ?? [], toVis, () => true)

    try {
      await tripActions.moveAssignment(tripId, assignmentId, fromDayId, toDayId, at < 0 ? target.length : at)
      if (fromPlan) await roadtripVias.reanchor(fromDayId, fromPlan)
      if (toPlan) await roadtripVias.reanchor(toDayId, toPlan)
      updateRouteForDay(fromDayId)
      updateRouteForDay(toDayId)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [assignments, tripId, tripActions, updateRouteForDay, toast, t, can, trip, roadtripVias, roadtripStopsOf])

  /**
   * How long the drive stands here, for every stop alike.
   *
   * A booked night used to be sent to the booking form instead, because its duration was
   * read off the check-out and there was nothing here to set. The drive no longer reads
   * a check-out at all: a night is a stop that takes as long as it takes, and asking how
   * long is the same question at a hotel as at a viewpoint.
   */
  const editRoadtripStay = useCallback((draft: NonNullable<typeof stayDraft>) => {
    setStayDraft(draft)
  }, [])

  return {
    saveStopDraft, confirmStayRelease, saveStopDraftAsNight, setRoadtripStopKind, setRoadtripStopFill,
    reorderRoadtripStop, stayDraft, setStayDraft, roadtripEndsDayAt, setRoadtripEndDay, setRoadtripStay,
    moveRoadtripStopToDay, editRoadtripStay,
  }
}

export type RoadtripStopEdits = ReturnType<typeof useRoadtripStopEdits>
