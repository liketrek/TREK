/**
 * Pure road-trip arithmetic — no React, no network, no store. Everything here is a
 * function of the stops, the routed legs and the day's rules, so it can be unit tested
 * on its own and reused by the map, the rail and (later) the MCP tool.
 */

import type { RouteAvoidClass } from '../../types'

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
  /**
   * Index of the stop the finding belongs to.
   *
   * For the two leg codes this is the stop the leg ARRIVES AT, not the one it leaves.
   * Both findings are a running total that only becomes true on arrival: "125 km since
   * the last fill-up" is what the tank reads when you get there, and the figure has to
   * agree with the one anybody adds up off the drive bands above it. Anchored to the
   * departure it read as the distance of the leg leaving that stop, which is a different
   * number entirely and the one that made the badge look wrong.
   */
  index: number
  code: 'late' | 'overnight' | 'leg' | 'range'
  /** Minutes the computed arrival misses the anchor by (code 'late'). */
  minutes?: number
  /** Minutes this leg runs over the longest single drive allowed (code 'leg'). */
  overMinutes?: number
  /** Kilometres driven since the last fill-up when the range ran out (code 'range'). */
  sinceKm?: number
}

/**
 * The two kinds of stop that put fuel or charge back.
 *
 * Deliberately shorter than `SERVICE_STOP_TYPES`: a two-hour lunch fills no tank, and
 * TREK knows nothing about whether the restaurant has a charger in its car park. Reusing
 * the service list here would quietly reset the range budget at every rest area and hide
 * the one finding this feature exists to produce.
 */
export const REFUELLING_STOP_TYPES = ['fuel', 'charging'] as const

/**
 * What the traveller drives, which decides what actually fills the tank.
 *
 * Absent means both count, which is what TREK did before the setting existed and is the
 * right answer for somebody who never said. It is only wrong once a vehicle IS named:
 * a petrol station does not charge a battery, and a charger does not fill a tank.
 */
export type VehicleKind = 'combustion' | 'electric'

/** The stop kind that refills the named vehicle, for filtering a search. */
export function refuelStopTypeFor(vehicle: VehicleKind | null | undefined): readonly string[] {
  if (vehicle === 'combustion') return ['fuel']
  if (vehicle === 'electric') return ['charging']
  return REFUELLING_STOP_TYPES
}

/**
 * Whether stopping here starts the range budget over.
 *
 * With no vehicle named, either kind does — a plain reading of "I filled up". Once one is
 * named the other stops counting, because the alternative is arithmetic that is simply
 * wrong: an electric car pausing at a petrol station had its battery refilled on paper,
 * the warnings went quiet for the rest of the day, and the driver was told nothing.
 */
export function refuelsRange(stopType: string | null | undefined, vehicle?: VehicleKind | null): boolean {
  return refuelStopTypeFor(vehicle).includes(stopType ?? '')
}

/**
 * The three numbers a traveller can set. null means no limit, which is an explicit off
 * rather than a sentinel: zero is a legal thing to type and means the same as unset.
 */
export interface DriveLimits {
  /**
   * How full a fill-up actually goes, 1 to 100, or null for "all the way".
   *
   * Nobody charges an electric car to 100 % on the road: the last fifth takes as long as
   * the first four and the manual says not to. Treating every stop as a full tank
   * overstates the range after it by exactly that fifth, which is a whole leg on a long
   * day.
   */
  fillPercent?: number | null
  /** Longest single drive between two stops, in minutes. */
  legMinutes: number | null
  /** Longest total driving in one day, in minutes. */
  dayMinutes: number | null
  /** How far one tank or charge goes, in kilometres. */
  rangeKm: number | null
}

/**
 * A finding about the day as a whole.
 *
 * Its own shape rather than a ScheduleWarning with index -1: a sentinel index would be
 * read by every consumer that filters findings by stop, and one of them would eventually
 * draw the day's finding on the first stop.
 */
export interface DayWarning {
  code: 'dayDriving'
  /** Driving time of the day in minutes, the same number the badge beside it shows. */
  minutes: number
  limitMinutes: number
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
const DAY_MINUTES = 24 * 60

function resolveArrival(
  anchor: number | null,
  cursor: number | null,
  dayOffset: number,
): { arrival: number | null; lateBy: number | null } {
  if (anchor === null) return { arrival: cursor, lateBy: null }
  // No drive has been timed yet, so there is nothing to be late against — but the
  // day carried so far still applies, or a pinned stop after an untimed leg
  // prints under a day-1 stop as though it happened first.
  if (cursor === null) return { arrival: anchor + dayOffset * DAY_MINUTES, lateBy: null }
  // The occurrence of that wall-clock time nearest the cursor, not the one on the
  // day the cascade has reached so far. `dayOffset` only advances once a computed
  // arrival crosses midnight, and it is read before this stop's arrival is known —
  // so when the stop that crosses midnight is the pinned one, its anchor was
  // placed a whole day early and the plan was reported as 24 hours late while
  // being exactly on time. Rounding also keeps the ordinary case: 08:00, a three
  // hour leg, a 09:00 pin still picks the same day and is two hours late.
  const k = Math.round((cursor - anchor) / DAY_MINUTES)
  const anchorAt = anchor + k * DAY_MINUTES
  return {
    arrival: anchorAt,
    lateBy: cursor > anchorAt + 1 ? Math.round(cursor - anchorAt) : null,
  }
}

export function computeSchedule(stops: ScheduleStop[], legSeconds: (number | undefined)[]): Schedule {
  const warnings: ScheduleWarning[] = []
  // Arrivals in minutes, so the chain can be walked twice before anything is formatted.
  const arrivals: (number | null)[] = new Array(stops.length).fill(null)
  const anchored: boolean[] = new Array(stops.length).fill(false)
  // Minutes since the first stop's midnight, so a chain crossing midnight keeps counting.
  let cursor: number | null = null
  let dayOffset = 0

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]
    const anchor = parseClock(stop.anchor)
    const { arrival, lateBy } = resolveArrival(anchor, cursor, dayOffset)
    if (lateBy !== null) warnings.push({ index: i, code: 'late', minutes: lateBy })

    if (arrival === null) continue

    const offset = Math.floor(arrival / DAY_MINUTES)
    if (offset > dayOffset) dayOffset = offset

    arrivals[i] = arrival
    anchored[i] = anchor !== null

    const leg = legSeconds[i]
    cursor = leg === undefined ? null : arrival + (stop.dwellMinutes ?? 0) + Math.round(leg / 60)
  }

  // Then backwards, for the stops the forward walk left blank because nobody had pinned
  // a time yet. Pinning a time on the second stop is the ordinary way to plan: the museum
  // opens at ten, so when do we have to leave? Working back from the first known arrival
  // answers it — departure = the next arrival minus the drive, arrival = that minus the
  // stay — and it stops at the first leg that never routed rather than inventing one.
  const firstKnown = arrivals.findIndex(a => a !== null)
  for (let i = firstKnown - 1; i >= 0; i--) {
    const leg = legSeconds[i]
    const next = arrivals[i + 1]
    if (leg === undefined || next === null) break
    arrivals[i] = next - Math.round(leg / 60) - (stops[i].dwellMinutes ?? 0)
  }

  // Working back can land before the anchor day's midnight, which would print as a
  // negative day. `dayOffset` counts days past the FIRST stop, so the whole chain shifts
  // up instead until the earliest stop sits on day zero again.
  const earliest = arrivals.reduce<number | null>((m, a) => (a === null ? m : m === null || a < m ? a : m), null)
  const shift = earliest === null || earliest >= 0 ? 0 : -Math.floor(earliest / DAY_MINUTES) * DAY_MINUTES

  const entries: ScheduleEntry[] = []
  let lastOffset = 0
  for (let i = 0; i < stops.length; i++) {
    const raw = arrivals[i]
    if (raw === null) {
      entries.push({ arrival: null, departure: null, anchored: false, dayOffset: 0 })
      continue
    }
    const arrival = raw + shift
    const offset = Math.floor(arrival / DAY_MINUTES)
    // Read off the finished chain rather than during the forward walk, so a midnight the
    // backward pass introduced is marked too.
    if (offset > lastOffset) warnings.push({ index: i, code: 'overnight' })
    lastOffset = offset
    entries.push({
      arrival: formatClock(arrival),
      departure: formatClock(arrival + (stops[i].dwellMinutes ?? 0)),
      anchored: anchored[i],
      dayOffset: offset,
    })
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
/**
 * Where a tank runs dry, in the day's own driving coordinates.
 *
 * A separate thing from the range WARNING, and the difference is the whole point. The
 * warning is filed against the stop the car arrives at, which is where somebody finds
 * out; this is where the fuel actually runs out, which can be most of a leg earlier and
 * is the only place worth suggesting a filling station.
 *
 * `drivenMeters` counts DRIVING legs only, so it is not an offset into the day's drawn
 * line: that line also carries ferry and walking runs. Converting it to a coordinate
 * means walking the driving legs, which `dryPointOn` does.
 */
export interface DryPoint {
  /** Index into the day's legs, i.e. the leg the car is on when the tank empties. */
  legIndex: number
  /** How far into that leg, in kilometres. */
  intoLegKm: number
  /** Metres of driving from the start of the day to that point. */
  drivenMeters: number
  /** The range limit that was crossed, which is what the traveller set. */
  sinceKm: number
}

/**
 * The findings about the driving itself: too long at the wheel, too long in one day, and
 * the tank running out before anywhere to fill it.
 *
 * Reads the legs and nothing else. The clock cascade is not available to lean on: with no
 * stop pinned to a time it produces no times at all, for any stop, so a limit expressed as
 * an hour of the day would simply never fire. All three limits are therefore durations and
 * kilometres, which exist as soon as a leg has routed.
 *
 * The range budget resets at a fuel or charging stop and NOWHERE ELSE. It carries across
 * midnight, because a tank does not empty overnight, and it keeps counting past a finding,
 * because a warning is not a fill-up. Zeroing it there made the second figure wrong and
 * every one after it: a day reading 245 km at one stop and 121 at the next claims the 121
 * is a fresh tank, when it is 366 on the same one. A run of warnings down a stretch with
 * no fuel on it is not noise; it is the answer, and it stops the moment a fuel or
 * charging stop is put in.
 *
 * An unrouted leg gives the budget up entirely rather than guessing, the same way the
 * schedule abandons its cursor: a distance we do not have cannot be added to one we do.
 */
export function deriveDriveWarnings(
  /**
   * `mode` decides whether a leg counts at all. A day may legitimately mix
   * modes — splitIntoRuns exists for exactly that — and a two hour walk to a
   * viewpoint is not two hours of driving, nor are its kilometres on the tank.
   * Counting them reported a hike as "over the longest drive allowed" and let a
   * ferry crossing trip a range warning. Anything that is not a driving profile
   * is skipped; an absent mode counts, because every leg was a drive before the
   * field existed.
   */
  legs: ({ duration?: number; distance?: number; mode?: string } | undefined)[],
  /** Whether the stop at each index refuels. One entry longer than `legs`. */
  refuelsAt: boolean[],
  limits: DriveLimits,
  /** Kilometres already on the tank when the day starts; null when that is unknown. */
  carryKm: number | null,
): { warnings: ScheduleWarning[]; day: DayWarning | null; carryKm: number | null; emptyAt: DryPoint[] } {
  const warnings: ScheduleWarning[] = []
  const emptyAt: DryPoint[] = []
  let budget = carryKm
  let totalSeconds = 0
  // Metres of DRIVING covered so far. Not the same as metres along the day's line: the
  // line carries every run, and a ferry or a walk in the middle of a day adds to it
  // without adding to this. Whatever converts a dry point back into a coordinate has to
  // walk the driving legs only, which is why this is counted here rather than derived.
  let drivenMeters = 0

  // What is left on the clock straight after a stop. A tank filled to 80 % has already
  // used a fifth of its range before the car moves, which is the honest way to say it in
  // a budget that counts upwards.
  const usedAfterFilling = limits.rangeKm && limits.fillPercent
    ? limits.rangeKm * (1 - limits.fillPercent / 100)
    : 0

  for (let i = 0; i < legs.length; i++) {
    if (refuelsAt[i]) budget = usedAfterFilling
    const leg = legs[i]
    // The stop this leg arrives at. Both findings are about what is true on arrival.
    const at = i + 1
    // Not a drive: neither its minutes nor its kilometres belong in findings
    // about the driving. The budget is left exactly as it was — walking to a
    // viewpoint and back does not use fuel, and it does not fill the tank
    // either.
    if (leg && leg.mode !== undefined && leg.mode !== 'driving') continue
    const seconds = leg?.duration
    if (typeof seconds === 'number') {
      totalSeconds += seconds
      if (limits.legMinutes && seconds / 60 > limits.legMinutes) {
        warnings.push({ index: at, code: 'leg', overMinutes: Math.round(seconds / 60 - limits.legMinutes) })
      }
    }
    const metres = leg?.distance
    if (typeof metres !== 'number') {
      budget = null
    } else if (budget !== null) {
      const before = budget
      budget += metres / 1000
      // Where the tank actually runs dry, as opposed to where somebody notices. The
      // warning below sits on the arriving stop, which can be a hundred kilometres past
      // the point the fuel ran out; a suggestion has to be offered at the point, or it
      // suggests filling up somewhere the car cannot reach.
      //
      // Once per tank, not once per warning. A long stretch with nothing on it produces
      // a run of warnings on purpose (see the note above), and one refuel offer per
      // warning would stack three identical offers down one day for a single fill-up.
      if (limits.rangeKm && before <= limits.rangeKm && budget > limits.rangeKm) {
        const intoLegKm = limits.rangeKm - before
        emptyAt.push({
          legIndex: i,
          intoLegKm,
          drivenMeters: drivenMeters + intoLegKm * 1000,
          sinceKm: Math.round(limits.rangeKm),
        })
      }
      // Not on a stop that fills up: arriving at a petrol station with an empty tank is
      // the plan working, not a problem, and a warning there would sit on the one stop
      // that answers it. No reset either — a warning is not a fill-up, and the figure has
      // to keep counting until a fuel or charging stop actually puts one in.
      if (limits.rangeKm && budget > limits.rangeKm && !refuelsAt[at]) {
        warnings.push({ index: at, code: 'range', sinceKm: Math.round(budget) })
      }
      drivenMeters += metres
    }
  }
  // The last stop of the day counts too: filling up on arrival is what makes the next
  // morning start with a full tank.
  if (refuelsAt[legs.length]) budget = usedAfterFilling

  const minutes = Math.round(totalSeconds / 60)
  const day = limits.dayMinutes && minutes > limits.dayMinutes
    ? { code: 'dayDriving' as const, minutes, limitMinutes: limits.dayMinutes }
    : null

  return { warnings, day, carryKm: budget, emptyAt }
}

export function legIndexForAlong(legEndMeters: number[], alongMeters: number): number {
  if (!legEndMeters.length) return -1
  for (let i = 0; i < legEndMeters.length; i++) {
    if (alongMeters < legEndMeters[i]) return i
  }
  return legEndMeters.length - 1
}

/**
 * The places on a day somebody would plan a break around.
 *
 * Every stop, and the middle of every leg between two of them. The leg midpoints are the
 * point of the whole thing: a break on a five-hour drive is planned in the middle of the
 * drive, not at either end of it, and offering only the stops would mean asking "what is
 * near Berlin" when the question is "what is near the halfway mark".
 */
export interface SectionAnchor {
  kind: 'stop' | 'leg'
  /** Index of the stop, or of the stop the leg leaves. */
  index: number
  alongKm: number
}

export function sectionAnchors(stopsAlongKm: number[]): SectionAnchor[] {
  const out: SectionAnchor[] = []
  for (let i = 0; i < stopsAlongKm.length; i++) {
    out.push({ kind: 'stop', index: i, alongKm: stopsAlongKm[i] })
    if (i + 1 < stopsAlongKm.length) {
      out.push({ kind: 'leg', index: i, alongKm: (stopsAlongKm[i] + stopsAlongKm[i + 1]) / 2 })
    }
  }
  return out
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
/**
 * Re-pin a day's vias after its stops were reordered wholesale.
 *
 * The single-move helpers above take a from/to pair, which is what the rail
 * hands them. The plan-mode drag hands a whole new ordering instead, and any
 * permutation is possible — so this maps by the stop each anchor refers to
 * rather than by arithmetic on the index. A via anchored after a stop stays
 * anchored after that same stop, wherever it ended up.
 *
 * Both lists are in the rail's index space, i.e. only stops that can be routed.
 * A via whose stop is gone, or which lands on the last stop and so has no leg
 * left to bend, is reported for removal.
 */
export function reanchorByStopOrder(
  vias: AnchoredVia[],
  previousIds: number[],
  nextIds: number[],
): Reanchoring {
  if (!vias.length) return EMPTY_REANCHORING
  const moved: ReanchoredVia[] = []
  const remove: number[] = []
  for (const via of vias) {
    const stopId = previousIds[via.after_order_index]
    const next = stopId === undefined ? -1 : nextIds.indexOf(stopId)
    // Gone, or now the last stop of the day: either way there is no leg for it.
    if (next === -1 || next >= nextIds.length - 1) {
      remove.push(via.id)
      continue
    }
    if (next !== via.after_order_index) moved.push({ id: via.id, after_order_index: next })
  }
  return { vias: moved, remove }
}

export function reanchorAfterReorder(
  vias: AnchoredVia[],
  from: number,
  to: number,
  stopCount: number,
): Reanchoring {
  if (!vias.length || from === to) return EMPTY_REANCHORING
  // A reorder is modelled as remove-then-insert, and the removal half refuses to
  // treat a two-stop day as still having a drive: below three stops it reports
  // every via for deletion, which is right when a stop really goes away and
  // catastrophic here. Nothing is removed by a reorder — swapping the only two
  // stops leaves leg 0 exactly where it was, merely driven the other way round —
  // so the anchors are already correct and there is nothing to re-pin.
  //
  // Two stops is the shape "follow this track" produces: it lays up to nine vias
  // on the single leg between one pair, and one drag in the rail deleted all of
  // them, with no prompt and no undo.
  if (stopCount <= 2) return EMPTY_REANCHORING
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

/**
 * The road classes a stored setting asks to leave out, validated.
 *
 * Parsed rather than trusted. A per-user setting has no server-side validation at all —
 * the write route stores any key with any value and says so — so an unknown word here
 * would travel straight into a costing option the router does not have. Unknown entries
 * are dropped, the order is fixed so two equal settings produce one cache key, and
 * anything that is not a non-empty list reads as "route normally".
 */
export function parseAvoid(raw: unknown): RouteAvoidClass[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  const asked = new Set(raw.split(',').map(part => part.trim().toLowerCase()))
  return AVOIDABLE.filter(cls => asked.has(cls))
}

/** Every class that can be avoided, in the order they are offered and stored. */
export const AVOIDABLE: readonly RouteAvoidClass[] = ['toll', 'motorway', 'ferry']

/** The setting value for a set of classes, in the fixed order. */
export function serializeAvoid(classes: readonly RouteAvoidClass[]): string {
  return AVOIDABLE.filter(cls => classes.includes(cls)).join(',')
}
