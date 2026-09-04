/**
 * Pure road-trip arithmetic — no React, no network, no store. Everything here is a
 * function of the stops, the routed legs and the day's rules, so it can be unit tested
 * on its own and reused by the map, the rail and (later) the MCP tool.
 */

/**
 * The stop kinds that interrupt a drive rather than end it.
 *
 * Every kind the corridor search can find, and the list is meant to stay that way: what
 * you pick off "along the route" is by definition something you come across on the way,
 * so it belongs inside the leg it was found on rather than among the places the trip is
 * for. They are drawn on the dashed line with their own icon, carry no number, and are
 * left out of every stop count — four places with a charger, a rest stop and a bakery
 * between them is a four-stop day.
 *
 * Extended together with the corridor's own categories (`RoadtripCorridorPanel`) and the
 * enum in `@trek/shared`; a kind in one list and not the others is a stop that looks like
 * a destination on one screen and a pause on the next.
 */
export const SERVICE_STOP_TYPES = ['fuel', 'charging', 'rest_area', 'campsite', 'restaurant', 'sights'] as const

/**
 * What each kind of pause is coloured, on the rail, in the corridor list and on the map.
 *
 * Read as road signage rather than as a palette: a pump is petrol orange, a charger is
 * the yellow of electricity, a rest area takes the blue every parking sign in Europe is
 * printed in, a campsite is green. The last two are the colours the general place search
 * already gives food and sights, so a restaurant found along the route looks like the
 * restaurants found anywhere else.
 *
 * Deliberately literal and shared rather than tokenised: these mean the same thing in
 * both themes the way a motorway sign does, and one definition is what stops the rail,
 * the search result and the map pin from drifting into three different reds.
 */
export const SERVICE_COLORS: Record<string, string> = {
  fuel: '#E8590C',
  charging: '#CA8A04',
  rest_area: '#3B82F6',
  campsite: '#16A34A',
  restaurant: '#EF4444',
  sights: '#EC4899',
}

/** The colour for a kind, or the neutral one for a kind nobody has a colour for yet. */
export function serviceColor(stopType: string | null | undefined): string {
  return SERVICE_COLORS[stopType ?? ''] ?? '#64748B'
}

/** Whether a stop breaks the drive. The rail's shape and every count turn on this. */
export function isServiceStopType(stopType: string | null | undefined): boolean {
  return !!stopType && (SERVICE_STOP_TYPES as readonly string[]).includes(stopType)
}

/** Seconds → "2 h 10 min" / "45 min", matching the wording of the map's route connectors. */
export function formatDurationShort(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const h = Math.floor(safe / 3600)
  const m = Math.round((safe % 3600) / 60)
  // 59.6 min must not print as "60 min"; carry it.
  if (m === 60) return `${h + 1} h`
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
  return `${m} min`
}

/** "09:45" → 585. Anything that is not a wall-clock time returns null. */
export function parseClock(value: string | null | undefined): number | null {
  if (!value) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** 585 → "09:45". Minutes past midnight beyond a day wrap around and report the carry. */
export function formatClock(minutes: number): string {
  const day = 24 * 60
  const wrapped = ((minutes % day) + day) % day
  const h = Math.floor(wrapped / 60)
  const m = Math.round(wrapped % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface ScheduleStop {
  /** Wall-clock time the user pinned on this stop, if any. */
  anchor: string | null
  /** Planned time spent here, in minutes. */
  dwellMinutes: number | null
}

export interface ScheduleWarning {
  /** Index of the stop the finding belongs to. */
  index: number
  code: 'late' | 'overnight'
  /** Minutes the computed arrival misses the anchor by (code 'late'). */
  minutes?: number
}

export interface ScheduleEntry {
  /** Computed arrival, or the anchor where the user pinned one. */
  arrival: string | null
  departure: string | null
  /** True when the time was pinned by the user rather than derived. */
  anchored: boolean
  /** Days past the first stop, so a chain running past midnight stays readable. */
  dayOffset: number
}

export interface Schedule {
  entries: ScheduleEntry[]
  warnings: ScheduleWarning[]
}

/**
 * Walks the chain forward: arrival = previous departure + driving time, departure =
 * arrival + time spent at the stop. A stop the user pinned a time on does not move —
 * it restarts the cascade from its own time, which is what makes a ferry, a museum
 * ticket or a hotel check-in usable as a fixed point (Furkot solves it the same way).
 *
 * `legSeconds[i]` is the drive from stop i to stop i+1; a leg that never routed is
 * `undefined` and breaks the chain rather than inventing a duration.
 */
/**
 * Where a stop's clock actually starts.
 *
 * A pinned time wins over whatever the drive before it worked out and restarts the
 * cascade from there. When it sits before the arrival the drive implies, the plan does
 * not fit: the caller is told by how much rather than the pinned time being moved.
 */
function resolveArrival(
  anchor: number | null,
  cursor: number | null,
  dayOffset: number,
): { arrival: number | null; lateBy: number | null } {
  if (anchor === null) return { arrival: cursor, lateBy: null }
  if (cursor === null) return { arrival: anchor, lateBy: null }
  const anchorToday = anchor + dayOffset * 24 * 60
  return {
    arrival: anchorToday,
    lateBy: cursor > anchorToday + 1 ? Math.round(cursor - anchorToday) : null,
  }
}

export function computeSchedule(stops: ScheduleStop[], legSeconds: (number | undefined)[]): Schedule {
  const entries: ScheduleEntry[] = []
  const warnings: ScheduleWarning[] = []
  // Minutes since the first stop's midnight, so a chain crossing midnight keeps counting.
  let cursor: number | null = null
  let dayOffset = 0

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]
    const anchor = parseClock(stop.anchor)
    const { arrival, lateBy } = resolveArrival(anchor, cursor, dayOffset)
    if (lateBy !== null) warnings.push({ index: i, code: 'late', minutes: lateBy })

    if (arrival === null) {
      entries.push({ arrival: null, departure: null, anchored: false, dayOffset: 0 })
      continue
    }

    const offset = Math.floor(arrival / (24 * 60))
    if (offset > dayOffset) {
      dayOffset = offset
      warnings.push({ index: i, code: 'overnight' })
    }

    const dwell = stop.dwellMinutes ?? 0
    const departure = arrival + dwell
    entries.push({
      arrival: formatClock(arrival),
      departure: formatClock(departure),
      anchored: anchor !== null,
      dayOffset: offset,
    })

    const leg = legSeconds[i]
    cursor = leg === undefined ? null : departure + Math.round(leg / 60)
  }

  return { entries, warnings }
}

/**
 * Splits a day's stops into the stretches that can be asked for in one routing request:
 * consecutive stops whose leg shares a travel mode.
 *
 * The router returns a leg for every consecutive pair of the waypoints it is handed, so
 * a day travelled one way is a single request rather than one per leg — the difference
 * between a road trip appearing at once and crawling in over ten seconds. A day that
 * mixes walking and driving splits at the change, because one request carries one mode.
 */
export function splitIntoRuns<T>(stops: T[], modeOfLeg: (from: T, to: T) => string): { stops: T[]; mode: string }[] {
  const runs: { stops: T[]; mode: string }[] = []
  let current: T[] = []
  let currentMode: string | null = null

  for (let i = 0; i < stops.length - 1; i++) {
    const mode = modeOfLeg(stops[i], stops[i + 1])
    if (currentMode === null) {
      current = [stops[i], stops[i + 1]]
      currentMode = mode
    } else if (mode === currentMode) {
      current.push(stops[i + 1])
    } else {
      runs.push({ stops: current, mode: currentMode })
      current = [stops[i], stops[i + 1]]
      currentMode = mode
    }
  }
  if (currentMode !== null && current.length > 1) runs.push({ stops: current, mode: currentMode })
  return runs
}

/** Total driving seconds of the legs that actually routed. */
export function sumLegSeconds(legSeconds: (number | undefined)[]): number {
  return legSeconds.reduce<number>((sum, s) => sum + (s ?? 0), 0)
}

/**
 * Where a place found along the drive belongs in the day's chain.
 *
 * Both numbers are distances travelled along the same routed line, so the comparison is
 * "which stops has the car already passed when it reaches this one". A petrol station
 * 120 km into the day goes after every stop nearer than that and before the rest,
 * which is what makes adding one a single click rather than a drag afterwards.
 *
 * Clamped to sit inside the day: a corridor is wider than the road, so a hit can project
 * slightly before the first stop or past the last, and neither "before where you set off"
 * nor "after where you arrive" is a place a fuel stop can go.
 */
/**
 * Which leg a point on the drive belongs to, given where each leg ends.
 *
 * Measured against the legs' own lengths rather than by projecting the stops as well: the
 * router's leg distances are exact by construction, while two stops close together
 * project onto each other's stretch and would put a charging halt on the wrong side of a
 * town. A point past the end lands in the last leg rather than nowhere, because that is
 * a rounding edge and not a missing leg.
 */
export function legIndexForAlong(legEndMeters: number[], alongMeters: number): number {
  if (!legEndMeters.length) return -1
  for (let i = 0; i < legEndMeters.length; i++) {
    if (alongMeters < legEndMeters[i]) return i
  }
  return legEndMeters.length - 1
}

export function insertIndexForAlong(stopsAlongKm: number[], hitAlongKm: number): number {
  if (stopsAlongKm.length < 2) return stopsAlongKm.length
  let i = 0
  while (i < stopsAlongKm.length && stopsAlongKm[i] <= hitAlongKm) i++
  return Math.min(Math.max(i, 1), stopsAlongKm.length - 1)
}

/* ── Via re-anchoring ────────────────────────────────────────────────────────
 *
 * A via records which stop it follows as a POSITION in the day's stop list, and that
 * position is resolved fresh every time the day is routed. So the moment the list
 * changes shape — a stop inserted, removed, reordered, pushed to another day — every
 * anchor at or past the change means a different leg than it did when it was written.
 * The visible symptom is the route quietly snapping back to the road the user had
 * steered it away from, with the via handle still sitting on the map where they left it.
 *
 * Nothing about that is repairable after the fact: once the stops have moved there is no
 * record of which leg a via was drawn for. So the correction has to be computed against
 * the list as it stands and applied with the same change.
 *
 * These are pure index arithmetic on purpose. The one judgement that needs geometry —
 * which half of a split leg a via belongs to — is asked of the caller, because only the
 * caller has the routed line to measure against.
 */

/**
 * A via, reduced to what re-anchoring needs to know about it.
 *
 * The coordinates are part of it because the one decision that is not pure arithmetic —
 * which half of a split leg a via belongs to — is answered by measuring where it sits on
 * the road, and the caller is handed the whole via to measure.
 */
export interface AnchoredVia {
  id: number
  after_order_index: number
  lat: number
  lng: number
}

/** Where one via ends up. */
export interface ReanchoredVia {
  id: number
  after_order_index: number
}

/**
 * The corrected anchoring, and the vias that no longer have a leg at all.
 *
 * `vias` holds only what actually moved: sending the unchanged ones would be a larger
 * write for no reason, and it keeps the diff readable when something goes wrong.
 */
export interface Reanchoring {
  vias: ReanchoredVia[]
  remove: number[]
}

const EMPTY_REANCHORING: Reanchoring = { vias: [], remove: [] }

/** Only what moved, so an operation that changes nothing costs no request. */
function collect(vias: AnchoredVia[], at: (index: number) => number | null): Reanchoring {
  const moved: ReanchoredVia[] = []
  const remove: number[] = []
  for (const via of vias) {
    const next = at(via.after_order_index)
    if (next === null) remove.push(via.id)
    else if (next !== via.after_order_index) moved.push({ id: via.id, after_order_index: next })
  }
  return { vias: moved, remove }
}

/**
 * A stop was inserted at `position`, so everything from there on sits one place later.
 *
 * The leg the new stop lands in is SPLIT in two, and its vias have to be told apart: one
 * before the new stop stays on the first half, one after it moves to the second. That is
 * the whole reason a petrol station added in the middle of a reshaped drive used to undo
 * the reshaping — the via went to the first half by accident of arithmetic, the second
 * half got none, and the router took its own road again for the rest of the leg.
 *
 * `liesBeforeInsert` is asked only about vias on the split leg, and only when there is
 * one: inserting at the very front or the very end splits nothing.
 */
export function reanchorAfterInsert(
  vias: AnchoredVia[],
  position: number,
  liesBeforeInsert: (via: AnchoredVia) => boolean,
): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING
  const split = position - 1
  const moved: ReanchoredVia[] = []
  for (const via of vias) {
    const i = via.after_order_index
    let next = i
    if (i === split) next = liesBeforeInsert(via) ? i : i + 1
    else if (i >= position) next = i + 1
    if (next !== i) moved.push({ id: via.id, after_order_index: next })
  }
  return { vias: moved, remove: [] }
}

/**
 * A stop was taken out at `position`, so the legs either side of it become one.
 *
 * A via on either half keeps bending the same drive, so both end up on the merged leg —
 * dropping them would throw away a decision the user made about a road that still exists.
 * The exception is the ends: remove the first stop and the leg leaving it is gone, remove
 * the last and the leg into it is gone, and a via pinned to one of those has nowhere left
 * to sit. Those are reported for deletion rather than left pointing past the day.
 *
 * `stopCount` is the number of stops BEFORE the removal.
 */
export function reanchorAfterRemove(vias: AnchoredVia[], position: number, stopCount: number): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING
  // Two stops become one: the day has no drive left, so no via has a leg.
  if (stopCount <= 2) return { vias: [], remove: vias.map(v => v.id) }
  return collect(vias, i => {
    if (position === 0) return i === 0 ? null : i - 1
    if (position === stopCount - 1) return i === position - 1 ? null : i
    if (i === position) return position - 1
    return i > position ? i - 1 : i
  })
}

/**
 * A stop moved from `from` to `to` inside its own day.
 *
 * Composed from the two operations it actually is — taken out, put back — because that
 * is the only reading under which the answer stays consistent with the other two. No
 * geometry is asked for: a reorder changes which stops are neighbours, so the roads
 * themselves are about to be different and there is nothing meaningful to measure a via
 * against. Vias keep the earlier half of a split leg, which is the reading that leaves
 * them where they were relative to the stop they were drawn after.
 *
 * `stopCount` is the number of stops BEFORE the move. `to` is the index in the list as
 * it looks AFTER the stop has been taken out.
 */
export function reanchorAfterReorder(
  vias: AnchoredVia[],
  from: number,
  to: number,
  stopCount: number,
): Reanchoring {
  if (!vias.length || from === to) return EMPTY_REANCHORING
  const afterRemove = reanchorAfterRemove(vias, from, stopCount)
  const dropped = new Set(afterRemove.remove)
  const movedTo = new Map(afterRemove.vias.map(v => [v.id, v.after_order_index] as const))
  // The list the insert acts on is the one the removal left behind, so each via is
  // carried through at whatever index it holds by then.
  const shifted: AnchoredVia[] = vias
    .filter(v => !dropped.has(v.id))
    .map(v => ({ ...v, after_order_index: movedTo.get(v.id) ?? v.after_order_index }))
  const afterInsert = reanchorAfterInsert(shifted, to, () => true)
  const finalIndex = new Map(afterInsert.vias.map(v => [v.id, v.after_order_index] as const))

  const result: ReanchoredVia[] = []
  for (const via of vias) {
    if (dropped.has(via.id)) continue
    const mid = movedTo.get(via.id) ?? via.after_order_index
    const end = finalIndex.get(via.id) ?? mid
    if (end !== via.after_order_index) result.push({ id: via.id, after_order_index: end })
  }
  return { vias: result, remove: afterRemove.remove }
}

/** Whether a re-anchoring has anything to write at all. */
export function isEmptyReanchoring(r: Reanchoring): boolean {
  return r.vias.length === 0 && r.remove.length === 0
}
