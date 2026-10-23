import type { StoreApi } from 'zustand'
import type { TrekWsTripEventName } from '@trek/shared'
import type { TripStoreState } from '../tripStore'
import type { Assignment, AssignmentParticipant, Place, Day, DayNote, PackingItem, TodoItem, BudgetItem, BudgetItemMember, Reservation, Trip, TripFile, WebSocketEvent } from '../../types'
import { offlineDb } from '../../db/offlineDb'
import { useAuthStore } from '../authStore'
import { mergeAssignmentPlace } from './placesSlice'
import { withoutDay } from './daysSlice'
import { orderBudgetByCategories } from './budgetOrder'
import { keepDayPositions, withTransportPositions } from '../../utils/mergedOrder'

type SetState = StoreApi<TripStoreState>['setState']
type GetState = StoreApi<TripStoreState>['getState']

// ── Dexie write-through ───────────────────────────────────────────────────────

type DexieWriter = (payload: Record<string, unknown>, state: TripStoreState) => Promise<void>

// Shared writer bodies (one function referenced by every event that used to
// share a switch fallthrough group).
const putPlace: DexieWriter = async payload => {
  await offlineDb.places.put(payload.place as Place)
}
const writeAssignmentDay: DexieWriter = async (payload, state) => {
  const assignment = payload.assignment as Assignment
  await _writeDayToDb(assignment.day_id, state)
}
const writePayloadDay: DexieWriter = async (payload, state) => {
  await _writeDayToDb(payload.dayId as number, state)
}
const writeDayById: DexieWriter = async (payload, state) => {
  const day = payload.day as Day
  await _writeDayToDb(day.id, state)
}
/**
 * Cache a packing item — unless it is somebody else's private one (#1976).
 *
 * The server scopes these events to the people who may see the item, so in
 * ordinary running this never has anything to refuse. It refuses anyway, for
 * two reasons. A leak on the wire used to become permanent here: the write is a
 * put, the offline read hands back every cached row for the trip, and nothing
 * prunes, so one stray event put another member's item into this browser for
 * good. And a member whose access to a shared item is withdrawn should lose the
 * copy they already have, which is the same check.
 *
 * Deleting rather than skipping is the part that matters: skipping would leave
 * a row that arrived before this existed sitting there forever.
 */
const putPackingItem: DexieWriter = async payload => {
  const item = payload.item as PackingItem
  const me = useAuthStore.getState().user?.id
  const mine = !item?.is_private || item.owner_id == null || item.owner_id === me
    || (item.recipients || []).some(r => r.user_id === me)
  if (!mine) {
    await offlineDb.packingItems.delete(item.id)
    return
  }
  await offlineDb.packingItems.put(item)
}
const putTodoItem: DexieWriter = async payload => {
  await offlineDb.todoItems.put(payload.item as TodoItem)
}
const putBudgetItem: DexieWriter = async payload => {
  await offlineDb.budgetItems.put(payload.item as BudgetItem)
}
// Partial update — read the canonical item from the updated Zustand state.
const putCanonicalBudgetItem: DexieWriter = async (payload, state) => {
  const item = state.budgetItems.find(i => i.id === (payload.itemId as number))
  if (item) await offlineDb.budgetItems.put(item)
}
const putReservation: DexieWriter = async (payload, state) => {
  // The same empty ping the appliers above handle; without this the write
  // throws and only the swallowed catch keeps it quiet.
  if (!payload.reservation) return
  // The applied row, which kept its day slots when the payload had none.
  const id = (payload.reservation as Reservation).id
  await offlineDb.reservations.put(state.reservations.find(r => r.id === id) ?? payload.reservation as Reservation)
}
/** The moves of a `reservation:positions` event, the ones without a position left out. */
function positionsOf(payload: Record<string, unknown>): { id: number; day_plan_position: number }[] {
  if (!Array.isArray(payload.positions)) return []
  return (payload.positions as { id?: unknown; day_plan_position?: unknown }[])
    .filter((p): p is { id: number; day_plan_position: number } => typeof p?.id === 'number' && typeof p.day_plan_position === 'number')
}

const putTripFile: DexieWriter = async payload => {
  await offlineDb.tripFiles.put(payload.file as TripFile)
}

/** The key of the day whose plan holds the assignment, if this tab has it. */
function dayKeyOf(state: TripStoreState, assignmentId: number): string | undefined {
  return Object.keys(state.assignments).find(key => state.assignments[key].some(a => a.id === assignmentId))
}

/**
 * A list in the order a `*:reordered` event names. A named row takes its index in
 * the event as `sort_order`, which is what the server stores (ids this tab does not
 * hold still count), and moves to the front in that order. Rows the event does not
 * name keep their `sort_order` and sit behind, since the server leaves them alone.
 */
function inEventOrder<T extends { id: number; sort_order: number }>(items: T[], orderedIds: unknown): T[] | null {
  if (!Array.isArray(orderedIds)) return null
  // A repeated id ends where the server's last write for it puts it.
  const position = new Map<number, number>()
  ;(orderedIds as number[]).forEach((id, index) => position.set(id, index))
  const at = (item: T): number => position.get(item.id) ?? 0
  const named = items
    .filter(item => position.has(item.id))
    .sort((a, b) => at(a) - at(b))
    .map(item => (item.sort_order === at(item) ? item : { ...item, sort_order: at(item) }))
  return [...named, ...items.filter(item => !position.has(item.id))]
}

/** A guest renamed: `member:updated` carries the id and the new name. */
function renamedMember(payload: Record<string, unknown>): { id: number; username: string } | null {
  const member = payload.member as { id?: unknown; username?: unknown } | undefined
  if (typeof member?.id !== 'number' || typeof member.username !== 'string') return null
  return { id: member.id, username: member.username }
}

type NamedPerson = { user_id: number; username: string }

/** Whether a list of people stored on a row names this person. */
function names(people: readonly NamedPerson[] | undefined, id: number): boolean {
  return (people ?? []).some(person => person.user_id === id)
}

/** `people` with this person's name changed, the same array when nothing changes. */
function withName<P extends NamedPerson>(people: P[] | undefined, id: number, username: string): P[] | undefined {
  if (!people?.some(person => person.user_id === id && person.username !== username)) return people
  return people.map(person => (person.user_id === id ? { ...person, username } : person))
}

/** `list` with `patch` applied, the same array when no row changes. */
function patchRows<T>(list: T[], patch: (row: T) => T): T[] {
  let changed = false
  const next = list.map(row => {
    const patched = patch(row)
    if (patched !== row) changed = true
    return patched
  })
  return changed ? next : list
}

/**
 * Per-event IndexedDB write-through, keyed by the shared WS event registry.
 * The key set is enumerable on purpose: the registry-parity test asserts every
 * registry event is either handled here/in STATE_APPLIERS, handled by a
 * dedicated listener elsewhere, or explicitly listed as ignored — a new server
 * event without a client decision fails that test instead of dropping silently.
 */
export const DEXIE_WRITERS: Partial<Record<TrekWsTripEventName, DexieWriter>> = {
  // ── Places ──────────────────────────────────────────────────────────────
  'place:created': putPlace,
  'place:updated': putPlace,
  'place:deleted': async payload => {
    await offlineDb.places.delete(payload.placeId as number)
  },

  // ── Assignments (embedded in Day rows) ──────────────────────────────────
  // Read the already-updated Day from the Zustand state and persist it.
  'assignment:created': writeAssignmentDay,
  'assignment:updated': writeAssignmentDay,
  'assignment:deleted': writePayloadDay,
  'assignment:moved': async (payload, state) => {
    const movedAssignment = payload.assignment as Assignment
    await Promise.all([
      _writeDayToDb(payload.oldDayId as number, state),
      _writeDayToDb(movedAssignment.day_id, state),
    ])
  },
  'assignment:reordered': writePayloadDay,
  'assignment:participants': async (payload, state) => {
    const dayKey = dayKeyOf(state, Number(payload.assignmentId))
    if (dayKey) await _writeDayToDb(Number(dayKey), state)
  },

  // ── Days ─────────────────────────────────────────────────────────────────
  'day:created': writeDayById,
  'day:updated': writeDayById,
  'day:deleted': async payload => {
    await offlineDb.days.delete(payload.dayId as number)
  },

  // ── Day notes (embedded in Day rows) ─────────────────────────────────────
  'dayNote:created': writePayloadDay,
  'dayNote:updated': writePayloadDay,
  'dayNote:deleted': writePayloadDay,

  // ── Packing ──────────────────────────────────────────────────────────────
  'packing:created': putPackingItem,
  'packing:updated': putPackingItem,
  'packing:deleted': async payload => {
    await offlineDb.packingItems.delete(payload.itemId as number)
  },
  // The rows this tab holds already passed the privacy check on their way in.
  'packing:reordered': async (_payload, state) => {
    await offlineDb.packingItems.bulkPut(state.packingItems)
  },

  // ── Todo ─────────────────────────────────────────────────────────────────
  'todo:created': putTodoItem,
  'todo:updated': putTodoItem,
  'todo:deleted': async payload => {
    await offlineDb.todoItems.delete(payload.itemId as number)
  },
  'todo:reordered': async (_payload, state) => {
    await offlineDb.todoItems.bulkPut(state.todoItems)
  },

  // ── Budget ───────────────────────────────────────────────────────────────
  'budget:created': putBudgetItem,
  'budget:updated': putBudgetItem,
  'budget:deleted': async payload => {
    await offlineDb.budgetItems.delete(payload.itemId as number)
  },
  'budget:members-updated': putCanonicalBudgetItem,
  'budget:member-paid-updated': putCanonicalBudgetItem,
  'budget:reordered': async (_payload, state) => {
    await offlineDb.budgetItems.bulkPut(state.budgetItems)
  },

  // ── Reservations ─────────────────────────────────────────────────────────
  'reservation:created': putReservation,
  'reservation:updated': putReservation,
  'reservation:deleted': async payload => {
    await offlineDb.reservations.delete(payload.reservationId as number)
  },
  'reservation:positions': async (payload, state) => {
    const ids = new Set(positionsOf(payload).map(p => p.id))
    await offlineDb.reservations.bulkPut(state.reservations.filter(r => ids.has(r.id)))
  },

  // ── Trip ─────────────────────────────────────────────────────────────────
  'trip:updated': async payload => {
    await offlineDb.trips.put(payload.trip as Trip)
  },
  // A deleted trip must not come back from the cache on the next offline start.
  'trip:deleted': async payload => {
    await offlineDb.trips.delete(Number(payload.id))
  },
  // Nor may a trip this user was taken off: the server no longer lets them read it.
  'member:removed': async (payload, state) => {
    const me = useAuthStore.getState().user?.id
    if (!state.trip || me == null || Number(payload.userId) !== me) return
    await offlineDb.trips.delete(state.trip.id)
  },
  // The rows the rename reached, read from the state the applier left.
  'member:updated': async (payload, state) => {
    const member = renamedMember(payload)
    if (!member) return
    const { id } = member
    const dayIds = Object.keys(state.assignments)
      .filter(key => state.assignments[key].some(a => names(a.participants, id)))
      .map(Number)
    await Promise.all([
      offlineDb.budgetItems.bulkPut(state.budgetItems.filter(i => names(i.members, id))),
      offlineDb.reservations.bulkPut(state.reservations.filter(r => names(r.travelers, id))),
      offlineDb.packingItems.bulkPut(state.packingItems.filter(i => names(i.recipients, id) || names(i.contributors, id))),
      ...dayIds.map(dayId => _writeDayToDb(dayId, state)),
    ])
  },

  // ── Files ─────────────────────────────────────────────────────────────────
  'file:created': putTripFile,
  'file:updated': putTripFile,
  'file:deleted': async payload => {
    await offlineDb.tripFiles.delete(payload.fileId as number)
  },
}

/**
 * Persist remote event to IndexedDB so the data is available offline.
 * Fire-and-forget: errors are swallowed to never block the Zustand update.
 * Called AFTER set() so `state` already reflects the update.
 */
function writeToDexie(
  type: string,
  payload: Record<string, unknown>,
  state: TripStoreState,
): void {
  ;void (async () => {
    try {
      await DEXIE_WRITERS[type as TrekWsTripEventName]?.(payload, state)
    } catch {
      // Dexie write failures are non-fatal — online state is source of truth
    }
  })()
}

/** Write a Day (with its current assignments + notes from Zustand) to Dexie. */
async function _writeDayToDb(dayId: number, state: TripStoreState): Promise<void> {
  const day = state.days.find(d => d.id === dayId)
  if (!day) return
  await offlineDb.days.put({
    ...day,
    assignments: state.assignments[String(dayId)] ?? [],
    notes_items: state.dayNotes[String(dayId)] ?? [],
  })
}

// ── Zustand event reducer ─────────────────────────────────────────────────────

/**
 * A day with `incoming` seated where the server put it, the rows around it renumbered
 * the way the local move reducer renumbers them. A booked night lands at the front of
 * its day and the rows behind it were moved up one there; appended with that index it
 * would sit tied with the old first row and be drawn second until the next reload. An
 * index past the end, or none at all, appends.
 */
function seatByOrder(day: Assignment[], incoming: Assignment): Assignment[] {
  const ordered = day.slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const at = Math.max(0, Math.min(incoming.order_index ?? ordered.length, ordered.length))
  ordered.splice(at, 0, incoming)
  return ordered.map((a, i) => (a.order_index === i ? a : { ...a, order_index: i }))
}

type StateApplier = (payload: Record<string, unknown>, state: TripStoreState) => Partial<TripStoreState>

/**
 * Per-event immutable state update (create/update/delete for the relevant
 * entity), keyed by the shared WS event registry. An event with no applier is
 * a no-op here — but only because the registry-parity test proves it is either
 * handled by a dedicated listener elsewhere or explicitly ignored.
 */
export const STATE_APPLIERS: Partial<Record<TrekWsTripEventName, StateApplier>> = {
  // Places
  'place:created': (payload, state) => {
    if (state.places.some(p => p.id === (payload.place as Place).id)) return {}
    return { places: [payload.place as Place, ...state.places] }
  },
  'place:updated': (payload, state) => ({
    places: state.places.map(p => p.id === (payload.place as Place).id ? payload.place as Place : p),
    assignments: Object.fromEntries(
      Object.entries(state.assignments).map(([dayId, items]) => [
        dayId,
        items.map(a => a.place?.id === (payload.place as Place).id ? mergeAssignmentPlace(a, payload.place as Place) : a)
      ])
    ),
  }),
  'place:deleted': (payload, state) => ({
    places: state.places.filter(p => p.id !== payload.placeId),
    assignments: Object.fromEntries(
      Object.entries(state.assignments).map(([dayId, items]) => [
        dayId,
        items.filter(a => a.place?.id !== payload.placeId)
      ])
    ),
  }),

  // Assignments
  'assignment:created': (payload, state) => {
    const incoming = payload.assignment as Assignment
    const dayKey = String(incoming.day_id)
    const existing = state.assignments[dayKey] || []
    const placeId = incoming.place?.id ?? incoming.place_id

    // Already have this exact assignment id → duplicate broadcast or the
    // echo of an already-committed assignment. No-op.
    if (existing.some(a => a.id === incoming.id)) return {}

    // Reconcile our own optimistic create: replace the temp (negative-id)
    // assignment of the same place on this day with the real one. Guarded on
    // a real placeId so an assignment with no place can never collapse onto
    // another place-less one (undefined === undefined).
    if (placeId != null) {
      const tempIdx = existing.findIndex(a => a.id < 0 && a.place?.id === placeId)
      if (tempIdx !== -1) {
        const next = existing.slice()
        next[tempIdx] = incoming
        return { assignments: { ...state.assignments, [dayKey]: next } }
      }
    }

    // Genuinely new — including a legitimate second assignment of a place
    // already on this day (no temp version to reconcile).
    return { assignments: { ...state.assignments, [dayKey]: seatByOrder(existing, incoming) } }
  },
  'assignment:updated': (payload, state) => {
    const dayKey = String((payload.assignment as Assignment).day_id)
    return {
      assignments: {
        ...state.assignments,
        [dayKey]: (state.assignments[dayKey] || []).map(a =>
          a.id === (payload.assignment as Assignment).id ? { ...a, ...(payload.assignment as Assignment) } : a
        ),
      }
    }
  },
  'assignment:deleted': (payload, state) => {
    const dayKey = String(payload.dayId)
    return {
      assignments: {
        ...state.assignments,
        [dayKey]: (state.assignments[dayKey] || []).filter(a => a.id !== payload.assignmentId),
      }
    }
  },
  'assignment:moved': (payload, state) => {
    const oldKey = String(payload.oldDayId)
    const newKey = String(payload.newDayId)
    const movedAssignment = payload.assignment as Assignment
    // The target day is read after the row has left it, so a night re-seated on its
    // own day (oldKey === newKey) is taken out first and put back where it now sits.
    const target = (state.assignments[newKey] || []).filter(a => a.id !== movedAssignment.id)
    return {
      assignments: {
        ...state.assignments,
        [oldKey]: (state.assignments[oldKey] || []).filter(a => a.id !== movedAssignment.id),
        [newKey]: seatByOrder(target, movedAssignment),
      }
    }
  },
  'assignment:reordered': (payload, state) => {
    // No ids means no order to apply — dropping through would wipe the day.
    if (!payload.orderedIds) return {}
    const dayKey = String(payload.dayId)
    const currentItems = state.assignments[dayKey] || []
    const orderedIds = payload.orderedIds as number[]
    const reordered = orderedIds.map((id, idx) => {
      const item = currentItems.find(a => a.id === id)
      return item ? { ...item, order_index: idx } : null
    }).filter((item): item is Assignment => item !== null)
    return {
      assignments: {
        ...state.assignments,
        [dayKey]: reordered,
      }
    }
  },
  // Who joins a visit, as the participant chips in the day plan and the place
  // inspector show it. The event names the assignment only, so find its day.
  'assignment:participants': (payload, state) => {
    const assignmentId = Number(payload.assignmentId)
    const dayKey = dayKeyOf(state, assignmentId)
    if (!dayKey || !Array.isArray(payload.participants)) return {}
    const participants = payload.participants as AssignmentParticipant[]
    return {
      assignments: {
        ...state.assignments,
        [dayKey]: state.assignments[dayKey].map(a => (a.id === assignmentId ? { ...a, participants } : a)),
      },
    }
  },

  // Days
  'day:created': (payload, state) => {
    if (state.days.some(d => d.id === (payload.day as Day).id)) return {}
    return { days: [...state.days, payload.day as Day] }
  },
  'day:updated': (payload, state) => ({
    days: state.days.map(d => d.id === (payload.day as Day).id ? payload.day as Day : d),
  }),
  // The same reducer the deleting tab ran optimistically: the later days move up
  // one place, the dates stay on their positions, a selection on the day clears.
  'day:deleted': (payload, state) => withoutDay(state, Number(payload.dayId)),
  'day:reordered': (payload, state) => {
    // Apply the new order instantly when we know all ids; the authoritative
    // dates + re-stamped booking times are pulled by the refresh below.
    const orderedIds = payload.orderedIds as number[] | undefined
    if (!orderedIds || orderedIds.length !== state.days.length) return {}
    const byId = new Map(state.days.map(d => [d.id, d]))
    if (!orderedIds.every(id => byId.has(id))) return {}
    return { days: orderedIds.map((id, i) => ({ ...byId.get(id)!, day_number: i + 1 })) }
  },

  // Day Notes
  'dayNote:created': (payload, state) => {
    const dayKey = String(payload.dayId)
    const existingNotes = (state.dayNotes[dayKey] || [])
    if (existingNotes.some(n => n.id === (payload.note as DayNote).id)) return {}
    return {
      dayNotes: {
        ...state.dayNotes,
        [dayKey]: [...existingNotes, payload.note as DayNote],
      }
    }
  },
  'dayNote:updated': (payload, state) => {
    const dayKey = String(payload.dayId)
    return {
      dayNotes: {
        ...state.dayNotes,
        [dayKey]: (state.dayNotes[dayKey] || []).map(n => n.id === (payload.note as DayNote).id ? payload.note as DayNote : n),
      }
    }
  },
  'dayNote:deleted': (payload, state) => {
    const dayKey = String(payload.dayId)
    return {
      dayNotes: {
        ...state.dayNotes,
        [dayKey]: (state.dayNotes[dayKey] || []).filter(n => n.id !== payload.noteId),
      }
    }
  },

  // Packing
  'packing:created': (payload, state) => {
    if (state.packingItems.some(i => i.id === (payload.item as PackingItem).id)) return {}
    return { packingItems: [...state.packingItems, payload.item as PackingItem] }
  },
  'packing:updated': (payload, state) => ({
    packingItems: state.packingItems.map(i => i.id === (payload.item as PackingItem).id ? payload.item as PackingItem : i),
  }),
  'packing:deleted': (payload, state) => ({
    packingItems: state.packingItems.filter(i => i.id !== payload.itemId),
  }),
  'packing:reordered': (payload, state) => {
    const packingItems = inEventOrder(state.packingItems, payload.orderedIds)
    return packingItems ? { packingItems } : {}
  },

  // Todo
  'todo:created': (payload, state) => {
    if (state.todoItems.some(i => i.id === (payload.item as TodoItem).id)) return {}
    return { todoItems: [...state.todoItems, payload.item as TodoItem] }
  },
  'todo:updated': (payload, state) => ({
    todoItems: state.todoItems.map(i => i.id === (payload.item as TodoItem).id ? payload.item as TodoItem : i),
  }),
  'todo:deleted': (payload, state) => ({
    todoItems: state.todoItems.filter(i => i.id !== payload.itemId),
  }),
  'todo:reordered': (payload, state) => {
    const todoItems = inEventOrder(state.todoItems, payload.orderedIds)
    return todoItems ? { todoItems } : {}
  },

  // Budget
  'budget:created': (payload, state) => {
    if (state.budgetItems.some(i => i.id === (payload.item as BudgetItem).id)) return {}
    return { budgetItems: [...state.budgetItems, payload.item as BudgetItem] }
  },
  'budget:updated': (payload, state) => ({
    budgetItems: state.budgetItems.map(i => i.id === (payload.item as BudgetItem).id ? payload.item as BudgetItem : i),
  }),
  'budget:deleted': (payload, state) => ({
    budgetItems: state.budgetItems.filter(i => i.id !== payload.itemId),
  }),
  'budget:members-updated': (payload, state) => ({
    budgetItems: state.budgetItems.map(i =>
      i.id === payload.itemId ? { ...i, members: payload.members as BudgetItemMember[], persons: payload.persons as number } : i
    ),
  }),
  'budget:member-paid-updated': (payload, state) => ({
    budgetItems: state.budgetItems.map(i =>
      i.id === payload.itemId
        // `paid` arrives over the wire as the raw value the server emits;
        // it's stored verbatim. The member type models it as a number, so
        // narrow without changing the value.
        ? { ...i, members: (i.members || []).map(m => m.user_id === payload.userId ? { ...m, paid: payload.paid as number } : m) }
        : i
    ),
  }),
  'budget:reordered': (payload, state) => {
    if (payload.orderedIds) {
      const orderedIds = payload.orderedIds as number[]
      const byId = new Map(state.budgetItems.map(i => [i.id, i]))
      const reordered = orderedIds
        .map(id => byId.get(id))
        .filter((i): i is BudgetItem => i !== undefined)
      const remaining = state.budgetItems.filter(i => !orderedIds.includes(i.id))
      // A partial orderedIds list leaves the untouched items behind, so index
      // the whole array — otherwise sort_order and array position disagree and
      // anything that re-sorts by sort_order undoes the reorder.
      return { budgetItems: [...reordered, ...remaining].map((item, idx) => ({ ...item, sort_order: idx })) }
    }
    if (payload.orderedCategories) {
      return { budgetItems: orderBudgetByCategories(state.budgetItems, payload.orderedCategories as string[]) }
    }
    return {}
  },

  /*
   * ── Reservations ────────────────────────────────────────────────────────
   *
   * These two events come in two shapes. Normally they carry the reservation.
   * The accommodation cascade sends them empty, as a "something changed, go
   * and look" ping, which the event contract allows for.
   *
   * Reading the id off the empty one is how a trip broke permanently (#1979):
   * with no reservations loaded yet, `.some()` never ran the callback, so the
   * cast slipped through and the applier returned `[undefined]`. From then on
   * every render that walked the list threw "Cannot read properties of
   * undefined (reading 'endpoints')" straight into the route error boundary,
   * and the trip stayed unreachable in that browser.
   */
  'reservation:created': (payload, state) => {
    const reservation = payload.reservation as Reservation | undefined
    if (!reservation) return {}
    if (state.reservations.some(r => r.id === reservation.id)) return {}
    return { reservations: [reservation, ...state.reservations] }
  },
  'reservation:updated': (payload, state) => {
    const reservation = payload.reservation as Reservation | undefined
    if (!reservation) return {}
    return { reservations: state.reservations.map(r => r.id === reservation.id ? keepDayPositions(reservation, r) : r) }
  },
  // A collaborator moved bookings on a day. Applied the way the mover's own list
  // wrote them, so their stops and bookings keep one order here too (#2631). REST
  // names the day `day_id`, the MCP tool `dayId`; without one the move is global.
  'reservation:positions': (payload, state) => {
    const positions = positionsOf(payload)
    if (positions.length === 0) return {}
    const dayId = (payload.day_id ?? payload.dayId) as number | null | undefined
    if (dayId != null) return { reservations: withTransportPositions(state.reservations, positions, dayId) }
    return {
      reservations: state.reservations.map(r => {
        const p = positions.find(x => x.id === r.id)
        return p ? { ...r, day_plan_position: p.day_plan_position } : r
      }),
    }
  },
  'reservation:travelers-updated': (payload, state) => ({
    reservations: state.reservations.map(r => r.id === (payload.reservationId as number)
      ? { ...r, travelers: payload.travelers as Reservation['travelers'] } : r),
  }),
  'reservation:deleted': (payload, state) => ({
    reservations: state.reservations.filter(r => r.id !== payload.reservationId),
  }),

  // Trip
  'trip:updated': payload => ({ trip: payload.trip as Trip }),
  // The open trip deleted elsewhere: the planner says so and leaves (tripGone).
  // The key is `id`, not the transport's `tripId`.
  'trip:deleted': (payload, state) => {
    const tripId = Number(payload.id)
    return state.trip?.id === tripId ? { tripGone: { tripId, reason: 'deleted' } } : {}
  },
  // Only the removal of this user means anything to the store: the planner then
  // leaves the trip. The roster itself is page-local (useTripRosterSync reads it
  // again on every member event). A removed guest stays on the rows that list it
  // until they are read again: a member taken off keeps those rows on the server,
  // and this store cannot tell a guest from a member.
  'member:removed': (payload, state) => {
    const me = useAuthStore.getState().user?.id
    if (!state.trip || me == null || Number(payload.userId) !== me) return {}
    return { tripGone: { tripId: state.trip.id, reason: 'removed' } }
  },
  // A guest renamed. The roster itself is read again by useTripRosterSync; the name
  // is also stored inside the rows that list people, so it changes there too.
  'member:updated': (payload, state) => {
    const member = renamedMember(payload)
    if (!member) return {}
    const { id, username } = member
    return {
      budgetItems: patchRows(state.budgetItems, item => {
        const members = withName(item.members, id, username)
        return members === item.members ? item : { ...item, members }
      }),
      reservations: patchRows(state.reservations, reservation => {
        const travelers = withName(reservation.travelers, id, username)
        return travelers === reservation.travelers ? reservation : { ...reservation, travelers }
      }),
      packingItems: patchRows(state.packingItems, item => {
        const recipients = withName(item.recipients, id, username)
        const contributors = withName(item.contributors, id, username)
        return recipients === item.recipients && contributors === item.contributors
          ? item
          : { ...item, recipients, contributors }
      }),
      assignments: Object.fromEntries(Object.entries(state.assignments).map(([dayKey, items]) => [
        dayKey,
        patchRows(items, assignment => {
          const participants = withName(assignment.participants, id, username)
          return participants === assignment.participants ? assignment : { ...assignment, participants }
        }),
      ])),
    }
  },

  // Files
  'file:created': (payload, state) => {
    if (state.files.some(f => f.id === (payload.file as TripFile).id)) return {}
    return { files: [payload.file as TripFile, ...state.files] }
  },
  'file:updated': (payload, state) => ({
    files: state.files.map(f => f.id === (payload.file as TripFile).id ? payload.file as TripFile : f),
  }),
  'file:deleted': (payload, state) => ({
    files: state.files.filter(f => f.id !== payload.fileId),
  }),

  // Memories / Photos
  'memories:updated': payload => {
    window.dispatchEvent(new CustomEvent('memories:updated', { detail: payload }))
    return {}
  },
}

/** How long events of one kind are collected before the store reads once. */
const STORE_REFRESH_SETTLE_MS = 250
const pendingRefreshes = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Runs `refresh` once for a burst of events of one kind: one assistant step can
 * apply up to fifty changes, every one of them its own event.
 */
function refreshOncePerBurst(kind: string, refresh: () => void): void {
  if (pendingRefreshes.has(kind)) return
  pendingRefreshes.set(kind, setTimeout(() => {
    pendingRefreshes.delete(kind)
    refresh()
  }, STORE_REFRESH_SETTLE_MS))
}

type StoreRefresh = (get: GetState) => void

/**
 * Events whose change the store reads back from the server instead of applying
 * it from the payload, keyed by the shared WS event registry like the appliers.
 */
export const STORE_REFRESHES: Partial<Record<TrekWsTripEventName, StoreRefresh>> = {
  // A template applied elsewhere sends its new rows as one bare list, without the
  // item events' privacy guarantees (a template applied to "my list" adds items
  // only their owner may see). Read the list again through the repo instead.
  'packing:template-applied': get => refreshOncePerBurst('packing', () => {
    const tripId = get().trip?.id
    if (tripId) void get().reloadPackingItems(tripId)
  }),
}

/**
 * The changes that add, move or take away a booked night: a stay written
 * elsewhere (the assistant, a fellow traveller, a plugin, a booking import), and
 * the deletes that can take a stay along with them.
 */
const STAY_REFRESH_EVENTS = new Set<string>([
  'accommodation:created',
  'accommodation:updated',
  'accommodation:deleted',
  'day:deleted',
  'place:deleted',
])

/**
 * Applies a remote WebSocket event to the local Zustand store, keeping state in sync across collaborators.
 * Each event type maps to an immutable state update (create/update/delete) for the relevant entity.
 * After the Zustand update, the change is also written through to IndexedDB for offline access.
 */
export function handleRemoteEvent(set: SetState, get: GetState, event: WebSocketEvent): void {
  const { type, ...payload } = event

  // Snapshot before set(): the trip:updated case below replaces state.trip, so a
  // date-change check made after it would compare the new trip against itself.
  const prevTrip = get().trip
  // Same reason, for the image check below — the applier overwrites the row.
  const prevPlaceImage =
    type === 'place:updated'
      ? get().places.find(p => p.id === (payload.place as Place | undefined)?.id)?.image_url
      : undefined

  set(state => STATE_APPLIERS[type as TrekWsTripEventName]?.(payload, state) ?? {})
  STORE_REFRESHES[type as TrekWsTripEventName]?.(get)

  // Accommodation cards read their thumbnail from a page-local copy of the
  // place, not from this store, so a new hero image would only appear there
  // after a reload. Narrow to an actual image change: every other place edit
  // (renaming, recategorising) must not trigger a refetch.
  if (type === 'place:updated') {
    const nextImage = (payload.place as Place | undefined)?.image_url
    if (nextImage !== prevPlaceImage) {
      window.dispatchEvent(new CustomEvent('accommodations:refresh'))
    }
  }

  /*
   * The accommodation cascade announces its reservation without sending it,
   * which the applier above correctly declines to invent an entity from. Left
   * at that, a hotel booked by one member would not appear for the others
   * until they reloaded, so honour the ping the way day:reordered does and
   * fetch the authoritative list.
   */
  if ((type === 'reservation:created' || type === 'reservation:updated') && !payload.reservation) {
    const tripId = get().trip?.id
    if (tripId) get().loadReservations(tripId)
  }

  // A stay booked, changed or cancelled elsewhere, a deleted day that cancels a
  // stay checking in or out on it, a deleted place that takes the stay booked at
  // it: the stays live in page-local state (useTripPlanner, useDayDetail) rather
  // than this store, so each of these asks them to read their stays again, and
  // useStaysRefresh folds a burst into one reload. This rides the planner's
  // existing accommodations:refresh event on purpose, the legacy window bus the
  // place image and trip date handlers here use as well. Retiring it means
  // moving the stays into a store slice, a change of its own.
  if (STAY_REFRESH_EVENTS.has(type)) window.dispatchEvent(new CustomEvent('accommodations:refresh'))

  // A reorder/insert re-pins dates and re-stamps booking times server-side, so
  // pull the authoritative days + reservations for collaborators.
  if (type === 'day:reordered') {
    const tripId = get().trip?.id
    if (tripId) {
      get().refreshDays(tripId)
      get().loadReservations(tripId)
    }
  }

  // A trip date-range change re-dates day rows and re-anchors bookings and
  // accommodations server-side (#1288), so pull the authoritative days +
  // reservations and tell the planner to reload accommodations (they live in
  // page-local state, not this store).
  if (type === 'trip:updated') {
    const updated = payload.trip as Trip
    if (prevTrip && updated.id === prevTrip.id
      && (updated.start_date !== prevTrip.start_date || updated.end_date !== prevTrip.end_date)) {
      get().refreshDays(updated.id)
      get().loadReservations(updated.id)
      window.dispatchEvent(new CustomEvent('accommodations:refresh'))
    }
  }

  // Write the change through to IndexedDB using the post-update state
  writeToDexie(type, payload as Record<string, unknown>, get())
}
