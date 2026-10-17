import { assignmentSchema } from '@trek/shared'
import { saveAssignmentEndDay } from '../api/assignmentEndDay'
import { assignmentsApi } from '../api/client'
import { offlineDb } from '../db/offlineDb'
import { cacheAssignment } from '../db/cacheAssignment'
import { generateUUID, mutationQueue, nextTempId } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import type { Assignment, AssignmentParticipant, Place } from '../types'

/** Start and End of one visit, as the time route stores them: null is no time. */
export interface AssignmentTimes {
  place_time: string | null
  end_time: string | null
}

/** The url of a visit's own routes, with `{id}` for one created offline that has no server id yet. */
function visitUrl(tripId: number | string, id: number, suffix: string): string {
  return `/trips/${tripId}/assignments/${id < 0 ? '{id}' : id}/${suffix}`
}

/** Ties a queued write to its visit, by the temporary id while the visit waits for its own. */
function visitTarget(id: number): { resource: 'assignments'; entityId: number; tempEntityId?: number } {
  return { resource: 'assignments', entityId: id, ...(id < 0 ? { tempEntityId: id } : {}) }
}

/** Lays fields over the cached visit, on whichever day of the trip holds it. */
async function cacheVisitFields(tripId: number, id: number, fields: Partial<Assignment>): Promise<void> {
  await offlineDb.days.where('trip_id').equals(tripId).modify(day => {
    if (!day.assignments?.some(a => a.id === id)) return
    day.assignments = day.assignments.map(a => (a.id === id ? { ...a, ...fields } : a))
  })
}

/** The day's visits in the order given; the ones not named keep their place behind them. */
function inOrder(items: Assignment[], orderedIds: number[]): Assignment[] {
  const rank = new Map(orderedIds.map((id, index) => [id, index]))
  return items
    .map(a => {
      const index = rank.get(a.id)
      return index === undefined ? a : { ...a, order_index: index }
    })
    .sort((a, b) => a.order_index - b.order_index)
}

/**
 * A new order of a day's visits joins the queue offline, and online too while a
 * visit in it has no server id yet: sent at once it would name a temporary id
 * the server does not know and overtake the create still waiting. The replay
 * sends the real ids the queue learned by then.
 */
async function queueReorder(tripId: number | string, dayId: number, orderedIds: number[]): Promise<void> {
  await mutationQueue.enqueue({
    id: generateUUID(), tripId: Number(tripId), method: 'PUT',
    url: `/trips/${tripId}/days/${dayId}/assignments/reorder`,
    body: { orderedIds },
  })
}

export const assignmentRepo = {
  /**
   * Puts a place on a day. Offline the visit lands on the cached day under a
   * temporary id at the end, and the create waits in the queue; a place created
   * offline is named by its real id once that one has synced.
   */
  async create(tripId: number | string, dayId: number, place: Place): Promise<Assignment> {
    if (!isEffectivelyOffline() && place.id > 0) {
      const { assignment } = await assignmentsApi.create(tripId, dayId, { place_id: place.id })
      const saved = { ...assignment, place: assignment.place || place } as Assignment
      await offlineDb.days.where('id').equals(dayId).modify(day => {
        day.assignments = [...(day.assignments ?? []).filter(a => a.id !== saved.id), saved]
      })
      return saved
    }
    const tempId = nextTempId()
    let visit = { id: tempId, day_id: dayId, place_id: place.id, order_index: 0, notes: null, place } as Assignment
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await offlineDb.days.where('id').equals(dayId).modify(day => {
        const items = day.assignments ?? []
        visit = { ...visit, order_index: items.reduce((max, a) => Math.max(max, a.order_index), -1) + 1 }
        day.assignments = [...items, visit]
      })
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: Number(tripId), method: 'POST',
        url: `/trips/${tripId}/days/${dayId}/assignments`,
        body: { place_id: place.id }, resource: 'assignments', tempId,
      })
    })
    mutationQueue.sendSoon()
    return visit
  },

  /** Takes a visit off its day, queued behind any older write to it. */
  async remove(tripId: number | string, dayId: number, id: number): Promise<void> {
    const dropCached = () => offlineDb.days.where('id').equals(dayId).modify(day => {
      day.assignments = (day.assignments ?? []).filter(a => a.id !== id)
    })
    if (!(await mutationQueue.mustQueue('assignments', id))) {
      await assignmentsApi.delete(tripId, dayId, id)
      await dropCached()
      return
    }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: Number(tripId), method: 'DELETE',
        url: `/trips/${tripId}/days/${dayId}/assignments/${id < 0 ? '{id}' : id}`,
        body: undefined, ...visitTarget(id),
      })
      await dropCached()
    })
    mutationQueue.sendSoon()
  },

  /** The order of a day's visits. */
  async reorder(tripId: number | string, dayId: number, orderedIds: number[]): Promise<void> {
    const cacheOrder = () => offlineDb.days.where('id').equals(dayId).modify(day => {
      day.assignments = inOrder(day.assignments ?? [], orderedIds)
    })
    if (!isEffectivelyOffline() && orderedIds.every(id => id > 0)) {
      await assignmentsApi.reorder(tripId, dayId, orderedIds)
      await cacheOrder()
      return
    }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await queueReorder(tripId, dayId, orderedIds)
      await cacheOrder()
    })
    mutationQueue.sendSoon()
  },

  /**
   * Moves a visit to another day at `orderIndex`, then puts that day in the
   * order given (the moved visit among them). Offline both wait in the queue,
   * in that order.
   */
  async move(tripId: number | string, assignment: Assignment, toDayId: number, orderIndex: number, orderedIds: number[]): Promise<void> {
    const cacheMove = async () => {
      await offlineDb.days.where('trip_id').equals(Number(tripId)).modify(day => {
        if (day.id === toDayId) return
        day.assignments = (day.assignments ?? []).filter(a => a.id !== assignment.id)
      })
      await offlineDb.days.where('id').equals(toDayId).modify(day => {
        const others = (day.assignments ?? []).filter(a => a.id !== assignment.id)
        day.assignments = inOrder([...others, { ...assignment, day_id: toDayId }], orderedIds)
      })
    }
    if (!(await mutationQueue.mustQueue('assignments', assignment.id)) && orderedIds.every(id => id > 0)) {
      await assignmentsApi.move(tripId, assignment.id, toDayId, orderIndex)
      if (orderedIds.length > 1) await assignmentsApi.reorder(tripId, toDayId, orderedIds)
      await cacheMove()
      return
    }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: Number(tripId), method: 'PUT',
        url: visitUrl(tripId, assignment.id, 'move'),
        body: { new_day_id: toDayId, order_index: orderIndex }, ...visitTarget(assignment.id),
      })
      if (orderedIds.length > 1) await queueReorder(tripId, toDayId, orderedIds)
      await cacheMove()
    })
    mutationQueue.sendSoon()
  },

  /**
   * Who joins a visit. Offline the names come from the cached members of the
   * trip, which is where the server takes them from too.
   */
  async setParticipants(tripId: number | string, id: number, userIds: number[]): Promise<AssignmentParticipant[]> {
    const tid = Number(tripId)
    if (!(await mutationQueue.mustQueue('assignments', id))) {
      const { participants } = (await assignmentsApi.setParticipants(tripId, id, userIds)) as { participants: AssignmentParticipant[] }
      await cacheVisitFields(tid, id, { participants })
      return participants
    }
    const members = await offlineDb.tripMembers.where('tripId').equals(tid).toArray()
    const participants: AssignmentParticipant[] = members
      .filter(m => userIds.includes(m.id))
      .map(m => ({ user_id: m.id, username: m.username, avatar: m.avatar ?? null }))
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: tid, method: 'PUT',
        url: visitUrl(tripId, id, 'participants'),
        body: { user_ids: userIds }, ...visitTarget(id),
      })
      await cacheVisitFields(tid, id, { participants })
    })
    mutationQueue.sendSoon()
    return participants
  },

  /** The travel mode of the leg leaving a visit, or with 'incoming' of the one entering it. */
  async setLegMode(tripId: number | string, id: number, mode: string | null, direction: 'outgoing' | 'incoming' = 'outgoing'): Promise<void> {
    const tid = Number(tripId)
    const fields: Partial<Assignment> = direction === 'incoming' ? { incoming_leg_transport_mode: mode } : { leg_transport_mode: mode }
    if (!(await mutationQueue.mustQueue('assignments', id))) {
      // The outgoing leg is sent without a direction, the shape the route has always had.
      await (direction === 'incoming'
        ? assignmentsApi.updateTransport(tripId, id, mode, direction)
        : assignmentsApi.updateTransport(tripId, id, mode))
      await cacheVisitFields(tid, id, fields)
      return
    }
    await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: tid, method: 'PUT',
        url: visitUrl(tripId, id, 'transport'),
        body: direction === 'incoming' ? { transport_mode: mode, direction } : { transport_mode: mode },
        ...visitTarget(id),
      })
      await cacheVisitFields(tid, id, fields)
    })
    mutationQueue.sendSoon()
  },

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
