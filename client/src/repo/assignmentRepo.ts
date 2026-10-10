import { assignmentSchema } from '@trek/shared'
import { saveAssignmentEndDay } from '../api/assignmentEndDay'
import { assignmentsApi } from '../api/client'
import { offlineDb } from '../db/offlineDb'
import { cacheAssignment } from '../db/cacheAssignment'
import { generateUUID, mutationQueue } from '../sync/mutationQueue'
import type { Assignment } from '../types'

/** Start and End of one visit, as the time route stores them: null is no time. */
export interface AssignmentTimes {
  place_time: string | null
  end_time: string | null
}

export const assignmentRepo = {
  /**
   * Empties a day (#2470). Offline the cached day loses its places right away and the
   * clear waits in the queue, where the server applies it to whatever the day holds on
   * replay, so a place added meanwhile by someone else goes with the rest.
   */
  async clearDay(tripId: number | string, dayId: number): Promise<void> {
    if (!(await mutationQueue.mustQueue('dayAssignments', dayId))) {
      await assignmentsApi.clearDay(tripId, dayId)
      await offlineDb.days.where('id').equals(dayId).modify(day => { day.assignments = [] })
      return
    }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: Number(tripId), method: 'DELETE',
        url: `/trips/${tripId}/days/${dayId}/assignments`,
        body: undefined, resource: 'dayAssignments', entityId: dayId,
      })
      await offlineDb.days.where('id').equals(dayId).modify(day => { day.assignments = [] })
    })
    mutationQueue.sendSoon()
  },

  async setEndDay(tripId: number | string, assignment: Assignment, endDay: boolean): Promise<Assignment> {
    if (!(await mutationQueue.mustQueue('assignments', assignment.id))) {
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
    mutationQueue.sendSoon()
    return updated
  },

  /** Takes a stop out of the day's route or puts it back (#2532), offline too. */
  async setRouteExcluded(tripId: number | string, assignment: Assignment, excluded: boolean): Promise<Assignment> {
    if (!(await mutationQueue.mustQueue('assignments', assignment.id))) {
      const saved = assignmentSchema.parse((await assignmentsApi.setRouteExcluded(tripId, assignment.id, excluded)).assignment)
      await cacheAssignment(saved)
      return saved
    }
    const updated = { ...assignment, route_excluded: excluded }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: Number(tripId), method: 'PUT',
        url: `/trips/${tripId}/assignments/${assignment.id}/route`,
        body: { excluded }, resource: 'assignments', entityId: assignment.id,
      })
      await cacheAssignment(updated)
    })
    mutationQueue.sendSoon()
    return updated
  },

  /**
   * A visit's own Start and End, the pair the time route takes.
   *
   * The route writes both columns every time, so a caller changing one of them hands the
   * other in as it stands; leaving it out would clear it.
   */
  async setTimes(tripId: number | string, assignment: Assignment, times: AssignmentTimes): Promise<Assignment> {
    if (!(await mutationQueue.mustQueue('assignments', assignment.id))) {
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
    mutationQueue.sendSoon()
    return updated
  },
  /**
   * The note a visit carries on its day (#2163). Saved through here rather than straight
   * to the API so the cached day holds the new note too: the tab never sees its own
   * `assignment:updated` echo, and a trip reopened offline reads its days from the cache.
   * A write of the same visit still waiting in the queue keeps this one behind it.
   */
  async setNotes(tripId: number | string, assignment: Assignment, notes: string | null): Promise<Assignment> {
    if (!(await mutationQueue.mustQueue('assignments', assignment.id))) {
      const saved = assignmentSchema.parse((await assignmentsApi.updateNotes(tripId, assignment.id, { notes })).assignment)
      await cacheAssignment(saved)
      return saved
    }
    const updated = { ...assignment, notes }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: Number(tripId), method: 'PUT',
        url: `/trips/${tripId}/assignments/${assignment.id}/notes`,
        body: { notes }, resource: 'assignments', entityId: assignment.id,
      })
      await cacheAssignment(updated)
    })
    mutationQueue.sendSoon()
    return updated
  },
}
