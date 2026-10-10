import { useCallback } from 'react'
import { reanchorAfterRemove, reanchorByStopOrder } from '../../components/Roadtrip/roadtripModel'
import type { useRouteCalculation } from '../../hooks/useRouteCalculation'
import type { useTourPlaceIds } from '../../hooks/useTourPlaceIds'
import { useTripStore, type TripStoreState } from '../../store/tripStore'
import type { Accommodation, Place } from '../../types'
import { timedSlot } from '../../utils/dayMerge'
import type { PlannerBase, PlannerHistory } from './plannerTypes'
import type { PlaceEdits } from './usePlaceEdits'
import type { RoadtripFeed } from './useRoadtripFeed'

interface DayPlanEditsOptions
  extends Pick<PlannerBase, 'tripId' | 'tripActions' | 'toast' | 't'>,
  Pick<RoadtripFeed, 'roadtripVias' | 'roadtripStopsOf' | 'viasAfterInsert'>,
  Pick<PlaceEdits, 'isTourPlace'>,
  Pick<ReturnType<typeof useTourPlaceIds>, 'reloadTourPlaceIds'>,
  Pick<PlannerHistory, 'pushUndo'> {
  selectedDayId: TripStoreState['selectedDayId']
  /** The day lists as stored, so a slot is counted among every stop of the day. */
  storedAssignments: TripStoreState['assignments']
  /** The places the planner lists, without the stops the day lists leave out. */
  places: Place[]
  tripAccommodations: Accommodation[]
  updateRouteForDay: ReturnType<typeof useRouteCalculation>['updateRouteForDay']
}

/**
 * Edits to the day plan, each with its undo where one makes sense: putting a place on
 * a day, moving a stop to another day, taking one off, reordering a day, renaming a
 * day and reordering the days. Every edit that shifts the stops of a drawn day carries
 * that day's vias along, so the drive keeps the road the traveller chose.
 *
 * Nothing here runs an effect, so where useTripPlanner calls it changes nothing.
 */
export function useDayPlanEdits(options: DayPlanEditsOptions) {
  const {
    tripId, tripActions, toast, t, selectedDayId, storedAssignments, places, tripAccommodations,
    isTourPlace, reloadTourPlaceIds, pushUndo, updateRouteForDay, roadtripVias, roadtripStopsOf, viasAfterInsert,
  } = options
  const handleAssignToDay = useCallback(async (placeId: number, dayId?: number, position?: number) => {
    const target = dayId || selectedDayId
    if (!target) { toast.error(t('trip.toast.selectDay')); return false }
    if (isTourPlace(placeId) && (storedAssignments[String(target)] ?? []).some(assignment => assignment.place_id === placeId)) return false
    const place = places.find(p => p.id === placeId)
    // A place with a start of its own is drawn by it, so it is stored there too, the
    // way a stop moved over from another day is. Without one it goes where it was put.
    const slot = timedSlot(storedAssignments[String(target)] ?? [], tripAccommodations, place?.place_time, position) ?? position
    const plan = viasAfterInsert(target, slot, place)
    let assignment: Awaited<ReturnType<typeof tripActions.assignPlaceToDay>>
    try {
      assignment = await tripActions.assignPlaceToDay(tripId, target, placeId, slot)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
      return false
    }
    if (isTourPlace(placeId)) await reloadTourPlaceIds()
    toast.success(t('trip.toast.assignedToDay'))
    if (assignment?.id) {
      const capturedAssignmentId = assignment.id
      const capturedTarget = target
      pushUndo(t('undo.assignPlace'), async () => {
        await tripActions.removeAssignment(tripId, capturedTarget, capturedAssignmentId)
        if (isTourPlace(placeId)) await reloadTourPlaceIds()
      }, [capturedTarget], [placeId])
    }
    if (plan) {
      try { await roadtripVias.reanchor(target, plan) }
      catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
    }
    updateRouteForDay(target)
    return true
  }, [selectedDayId, tripId, toast, updateRouteForDay, pushUndo, t, places, isTourPlace, reloadTourPlaceIds, storedAssignments, tripAccommodations, roadtripVias, viasAfterInsert])

  /**
   * Moves a stop from the day list onto another day, at a row of that day or at its
   * end without one.
   *
   * It can land in the middle of a day whose road has been drawn, on the row it was
   * dropped on or among the stops its start falls between. The vias of that day count
   * stops, so every one behind the new stop would shape the leg before the one it was
   * drawn on. They are moved the way a place added to the day moves them. Rejects when
   * a write fails, so the list can say so and leave its undo out.
   */
  const handleMoveToDay = useCallback(async (assignmentId: number, fromDayId: number, toDayId: number, position?: number) => {
    const place = (storedAssignments[String(fromDayId)] ?? []).find(a => a.id === assignmentId)?.place
    const plan = viasAfterInsert(toDayId, position, place)
    await tripActions.moveAssignment(tripId, assignmentId, fromDayId, toDayId, position)
    if (plan) await roadtripVias.reanchor(toDayId, plan)
  }, [tripId, tripActions, storedAssignments, roadtripVias, viasAfterInsert])

  const handleRemoveAssignment = useCallback(async (dayId: number, assignmentId: number) => {
    const state = useTripStore.getState()
    const capturedAssignment = (state.assignments[String(dayId)] || []).find(a => a.id === assignmentId)
    const capturedPlaceId = capturedAssignment?.place?.id
    const removedTour = capturedPlaceId != null && isTourPlace(capturedPlaceId)
    const capturedOrderIndex = capturedAssignment?.order_index ?? 0
    // Worked out before the delete, while the day still has the stop the vias
    // were measured against. `after_order_index` is a POSITION, so taking a stop
    // away moves the ground under every via that follows it: the anchors keep
    // their old numbers and the drive silently reverts to the road the traveller
    // steered it off, or bends a leg they never chose. This control is reachable
    // from the place inspector in both modes, and it was the one mutating path
    // that never corrected them.
    const stopsBefore = roadtripStopsOf(dayId)
    const removedAt = stopsBefore.findIndex(a => a.id === assignmentId)
    const plan = removedAt === -1
      ? null
      : reanchorAfterRemove(roadtripVias.byDay[dayId] ?? [], removedAt, stopsBefore.length)
    try {
      await tripActions.removeAssignment(tripId, dayId, assignmentId)
      if (removedTour) await reloadTourPlaceIds()
      if (plan) await roadtripVias.reanchor(dayId, plan)
      updateRouteForDay(dayId)
      if (capturedPlaceId != null) {
        const capturedDayId = dayId
        const capturedPos = capturedOrderIndex
        pushUndo(t('undo.removeAssignment'), async () => {
          await tripActions.assignPlaceToDay(tripId, capturedDayId, capturedPlaceId, capturedPos)
          if (removedTour) await reloadTourPlaceIds()
        }, [capturedDayId], [capturedPlaceId])
      }
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [tripId, toast, updateRouteForDay, pushUndo, t, roadtripVias, roadtripStopsOf, reloadTourPlaceIds, isTourPlace])

  const handleReorder = useCallback((dayId: number, orderedIds: number[]) => {
    const assignmentsBefore = useTripStore.getState().assignments[String(dayId)] || []
    const prevIds = assignmentsBefore
      .slice().sort((a, b) => a.order_index - b.order_index).map(a => a.id)
    const placeIdsBefore = [...new Set(assignmentsBefore.map(a => a.place?.id).filter((id): id is number => id != null))]
    // The rail counts anchors over routable stops only, so the plan is built in
    // that space. A drag here hands a whole new ordering rather than one move,
    // and any permutation is possible, so the anchors follow the stop they were
    // pinned behind instead of being shifted arithmetically. Without this the
    // day's detours stayed on their old numbers and the drive quietly took a
    // different road, persisted and visible to every collaborator.
    const visible = new Set(orderedIds)
    let nextVisible = 0
    const completeOrder = prevIds.map(id => visible.has(id) ? orderedIds[nextVisible++] : id)
    const stopIdsBefore = roadtripStopsOf(dayId).map(a => a.id)
    const stopIdsAfter = completeOrder.filter(id => stopIdsBefore.includes(id))
    const plan = reanchorByStopOrder(roadtripVias.byDay[dayId] ?? [], stopIdsBefore, stopIdsAfter)
    try {
      tripActions.reorderAssignments(tripId, dayId, completeOrder)
        .then(async () => {
          if (plan.vias.length || plan.remove.length) await roadtripVias.reanchor(dayId, plan)
          const capturedDayId = dayId
          const capturedPrevIds = prevIds
          pushUndo(t('undo.reorder'), async () => {
            await tripActions.reorderAssignments(tripId, capturedDayId, capturedPrevIds)
          }, [capturedDayId], placeIdsBefore)
        })
        .catch(err => toast.error(err instanceof Error ? err.message : t('trip.toast.reorderError')))
      updateRouteForDay(dayId)
    }
    catch { toast.error(t('trip.toast.reorderError')) }
  }, [tripId, toast, pushUndo, updateRouteForDay, t, roadtripVias, roadtripStopsOf])

  const handleUpdateDayTitle = useCallback(async (dayId, title) => {
    try { await tripActions.updateDayTitle(tripId, dayId, title) }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [tripId, toast])

  const handleReorderDays = useCallback((orderedIds: number[]) => {
    const prevIds = (useTripStore.getState().days || [])
      .slice().sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0)).map(d => d.id)
    tripActions.reorderDays(tripId, orderedIds)
      .then(() => {
        pushUndo(t('dayplan.reorderUndo'), async () => {
          // A day deleted since then drops out of the old order. When the list no
          // longer matches the days there are (one was added), the old order is
          // not one the server could take, so the undo steps aside.
          const live = new Set(useTripStore.getState().days.map(d => d.id))
          const restorable = prevIds.filter(id => live.has(id))
          if (restorable.length !== live.size) return
          await tripActions.reorderDays(tripId, restorable)
        })
      })
      .catch(err => toast.error(err instanceof Error ? err.message : t('dayplan.reorderError')))
  }, [tripId, toast, pushUndo])

  return {
    handleAssignToDay, handleMoveToDay, handleRemoveAssignment, handleReorder, handleUpdateDayTitle, handleReorderDays,
  }
}

export type DayPlanEdits = ReturnType<typeof useDayPlanEdits>
