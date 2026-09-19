import { assignmentSchema } from '@trek/shared'
import { saveAssignmentEndDay } from '../api/assignmentEndDay'
import { assignmentsApi } from '../api/client'
import { offlineDb } from '../db/offlineDb'
import { cacheAssignment } from '../db/cacheAssignment'
import { generateUUID, mutationQueue } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import type { Assignment } from '../types'

/** Start and End of one visit, as the time route stores them: null is no time. */
export interface AssignmentTimes {
  place_time: string | null
  end_time: string | null
}

export const assignmentRepo = {
  async setEndDay(tripId: number | string, assignment: Assignment, endDay: boolean): Promise<Assignment> {
    if (!isEffectivelyOffline()) {
      const saved = await saveAssignmentEndDay(tripId, assignment.id, { end_day: endDay })
      await cacheAssignment(saved)
      return saved
    }
    const updated = { ...assignment, end_day: endDay }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: Number(tripId), method: 'PUT',
        url: `/trips/${tripId}/assignments/${assignment.id}/end-day`,
        body: { end_day: endDay }, resource: 'assignments', entityId: assignment.id,
      })
      await cacheAssignment(updated)
    })
    return updated
  },

  /**
   * A visit's own Start and End, the pair the time route takes.
   *
   * The route writes both columns every time, so a caller changing one of them hands the
   * other in as it stands; leaving it out would clear it.
   */
  async setTimes(tripId: number | string, assignment: Assignment, times: AssignmentTimes): Promise<Assignment> {
    if (!isEffectivelyOffline()) {
      const saved = assignmentSchema.parse((await assignmentsApi.updateTime(tripId, assignment.id, times)).assignment)
      await cacheAssignment(saved)
      return saved
    }
    const updated = { ...assignment, assignment_time: times.place_time, assignment_end_time: times.end_time }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: Number(tripId), method: 'PUT',
        url: `/trips/${tripId}/assignments/${assignment.id}/time`,
        body: times, resource: 'assignments', entityId: assignment.id,
      })
      await cacheAssignment(updated)
    })
    return updated
  },
}
