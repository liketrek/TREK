import { saveAssignmentEndDay } from '../api/assignmentEndDay'
import { offlineDb } from '../db/offlineDb'
import { cacheAssignment } from '../db/cacheAssignment'
import { generateUUID, mutationQueue } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import type { Assignment } from '../types'

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
}
