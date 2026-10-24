import { useTripStore } from './tripStore'
import type { StayStopsResult } from '../repo/accommodationRepo'

export type { StayStopsResult }

/**
 * Fold the day stop a stay write reported back into the store.
 *
 * Booking a night also puts the place on its check-in day, because that stop is
 * what the road trip routes and the map draws. The server announces it over the
 * socket like any other assignment, and unlike the booking events it does not
 * skip the session that sent the request: the stop and the order it was seated
 * into arrive there together. The answer carries the stop as well, for a session
 * whose socket is down at that moment, and applying it a second time is harmless
 * because the store drops a stop it already holds. Goes through the same applier
 * the socket uses, so the write-through to IndexedDB happens either way.
 */
export function applyStayStops(result: StayStopsResult | null | undefined): void {
  if (!result) return
  const { handleRemoteEvent } = useTripStore.getState()
  for (const removed of result.removedAssignments ?? []) {
    handleRemoteEvent({ type: 'assignment:deleted', assignmentId: removed.id, dayId: removed.dayId })
  }
  if (result.assignment) handleRemoteEvent({ type: 'assignment:created', assignment: result.assignment })
  if (result.movedAssignment) {
    const { assignment, oldDayId } = result.movedAssignment
    handleRemoteEvent({ type: 'assignment:moved', assignment, oldDayId, newDayId: assignment.day_id })
  }
  for (const updated of result.updatedAssignments ?? []) {
    handleRemoteEvent({ type: 'assignment:updated', assignment: updated })
  }
}
