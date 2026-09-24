import { isServiceStopType, type ScheduleEntry, type ScheduleWarning } from './roadtripModel'
import { isCarrierMode, isStoredStop, type BookendPhase, type CarrierTerminal, type RoadtripDay, type RoadtripStop, type RouteSegment } from '@trek/shared/roadtrip'
import { readStay } from './stayReading'

/**
 * A road trip day, flattened into the rows a screen draws, with no React in sight.
 *
 * The rail builds its rows inline while it renders, which is fine for a panel that only
 * ever exists once. The phone draws the same chain in a second shell, and the two would
 * drift the first time a rule changed, and the duplication budget does not stretch to
 * the same forty lines of branching twice. So the branching lives here: what is a row,
 * in which order, and which of a stop's findings survives the two marks a 375px line can
 * carry.
 *
 * Deliberately free of React, translations and formatting. It answers "what is on this
 * line", never "how does it read", so it can be unit tested on its own and so the same
 * answer can be drawn twice in two different design languages.
 */

export type RoadtripRow =
  | { kind: 'spill'; fromDayNumber: number; departs: string | null; stops: StopRow[] }
  | StopRow
  | { kind: 'leg'; index: number; seg: RouteSegment | undefined; mode: string | null }
  /**
   * The drive in from where the day before ended, above the card's first stop, on a trip
   * with connected days. `from` is that last stop of the day before, which the card does
   * not draw, so the row names it.
   */
  | { kind: 'arriving'; seg: RouteSegment; from: RoadtripStop; mode: string | null }
  /**
   * A ride that leaves and lands on the day (#2428), as one row: the booking with both
   * its terminals inside it, in place of two stop rows and the leg between them. The
   * booking's minutes, no distance, and the road goes on from `arrival`.
   */
  | { kind: 'ride'; index: number; carrier: CarrierTerminal; seg: RouteSegment | undefined; departure: StopRow; arrival: StopRow }
  | { kind: 'dry'; legIndex: number; intoLegKm: number; sinceKm: number }
  | { kind: 'auto'; phase: 'end' | 'resume'; time: string | null }

export interface StopRow {
  kind: 'stop'
  stop: RoadtripStop
  /** Position in the day's numbering, or null for a service stop, a terminal and an automatic night. */
  number: number | null
  service: boolean
  entry: ScheduleEntry | undefined
  /** The clock this row shows on the right: when the traveller gets there. */
  time: string | null
  /** When they leave again: arrival plus the stay, or the time set to leave. Null without a schedule. */
  departure: string | null
  /** True when a person pinned that time, which is what the pin in front of it means. */
  pinned: boolean
  /** At most two marks fit a 375px row. This is the one warning that earned the second. */
  warning: ScheduleWarning | null
  /** How long the stop is stood at, which for one left at a set time is what that time leaves. */
  dwellMinutes: number | null
  offRoadMeters: number | null
  /** What the row says about the booked night it stands for, when it is one; see `bookendReading`. */
  bookend: BookendReading | null
}

/**
 * A booked night at the edge of a day, as a row reads it (`seatNightBookends`).
 *
 * Four ways of saying it. The morning of the day the stay is handed back is a check-out,
 * with the latest hour it may be; any other morning sets out from the stay. The evening
 * of the day the stay begins is a check-in, unless the stay's own stop is already on the
 * card before it, in which case the day comes back to it like any other evening.
 */
export interface BookendReading {
  phase: BookendPhase
  variant: 'checkOut' | 'from' | 'back' | 'checkIn'
  name: string
  /** The latest the room is handed back, on the check-out morning. A label, never a departure. */
  until: string | null
  /** From when the room is ready, on a check-in evening. A label, never an arrival. */
  from: string | null
  /** The booking a tap opens, or null for a stay entered without one. */
  reservationId: number | null
  accommodationId: number
  placeId: number
}

export function bookendReading(day: Pick<RoadtripDay, 'stops'>, index: number): BookendReading | null {
  const stop = day.stops[index]
  const bookend = stop?.bookend
  if (!stop || !bookend) return null
  const morning = bookend.phase === 'morning'
  const stayStopBefore = day.stops
    .slice(0, index)
    .some(s => isStoredStop(s) && s.lat === stop.lat && s.lng === stop.lng)
  const evening = bookend.checkingIn && !stayStopBefore ? 'checkIn' : 'back'
  return {
    phase: bookend.phase,
    variant: morning ? (bookend.checkingOut ? 'checkOut' : 'from') : evening,
    name: stop.name,
    until: morning && bookend.checkingOut ? bookend.checkOut : null,
    from: evening === 'checkIn' ? (bookend.checkIn ?? null) : null,
    reservationId: bookend.reservationId,
    accommodationId: bookend.accommodationId,
    placeId: stop.placeId,
  }
}

/**
 * Whether the automatic morning marker at `index` is the same point as the hotel the day
 * sets out from right after it. The hotel's row carries that morning, clock and all, and a
 * "continue journey" line above it would say the same thing twice.
 */
export function resumeFoldsIntoBookend(day: Pick<RoadtripDay, 'stops'>, index: number): boolean {
  const stop = day.stops[index]
  const next = day.stops[index + 1]
  return stop?.automaticNight?.phase === 'start'
    && next?.bookend?.phase === 'morning'
    && stop.lat === next.lat
    && stop.lng === next.lng
}

/**
 * Where the stop at `index` may be moved by one: not past a booked night at the day's
 * edge, which is no stored stop and holds its place. Past anything else, as before.
 */
export function movableWithin(day: Pick<RoadtripDay, 'stops'>, index: number): { up: boolean; down: boolean } {
  return {
    up: index > 0 && !day.stops[index - 1]?.bookend,
    down: index < day.stops.length - 1 && !day.stops[index + 1]?.bookend,
  }
}

/**
 * Which finding wins when a stop has several.
 *
 * The desktop stacks all of them, which is honest on a 420px rail and unreadable on a
 * phone. The order is by what changes the next decision soonest: being late moves every
 * arrival after it, and so does missing the time a stop was meant to be left at; running
 * dry strands the car; and an over-long leg is a planning remark you can act on tonight.
 */
const WARNING_RANK: Record<ScheduleWarning['code'], number> = {
  late: 0,
  missedLeave: 1,
  range: 2,
  leg: 3,
  overnight: 4,
}

export function pickWarning(warnings: readonly ScheduleWarning[]): ScheduleWarning | null {
  let best: ScheduleWarning | null = null
  for (const w of warnings) {
    if (!best || WARNING_RANK[w.code] < WARNING_RANK[best.code]) best = w
  }
  return best
}

/** The one day a phone screen shows, picked from what the routing round produced. */
export function stageOf(days: readonly RoadtripDay[], dayId: number | null): RoadtripDay | null {
  if (dayId == null) return null
  return days.find(d => d.dayId === dayId) ?? null
}

function stopRow(day: RoadtripDay, index: number, number: number | null): StopRow {
  // Only ever called for a real stop: an automatic night is the shell's own marker
  // for "the day ended here" and `roadtripRows` turns it into an 'auto' row instead.
  const stop = day.stops[index]
  const entry = day.schedule.entries[index]
  // Being late comes from the schedule and the drive's own findings from the limits: two
  // lists, and a row reading only the second never showed a stop reached late, or a ride
  // the drive gets to after it has left.
  const mine = [
    ...day.driveWarnings,
    ...day.schedule.warnings.filter(w => w.code === 'late' || w.code === 'missedLeave'),
  ].filter(w => w.index === index)
  return {
    kind: 'stop',
    stop,
    number,
    service: isServiceStopType(stop.stopType),
    entry,
    time: entry?.arrival ?? null,
    departure: entry?.departure ?? null,
    pinned: !!entry?.anchored,
    warning: pickWarning(mine),
    dwellMinutes: readStay(stop, entry).minutes,
    offRoadMeters: stop.offRoadMeters ?? null,
    bookend: bookendReading(day, index),
  }
}

/**
 * The rows of one day, in the order they are drawn.
 *
 * Two things here are easy to get wrong and both have a test:
 *
 * 1. Numbering counts destinations only. A petrol station between stop two and stop
 *    three does not make the next one four, and neither does the marker that ends the
 *    day. Numbering off the array index gets both wrong.
 * 2. `ownerDayId` is the day a stop is STORED on, which after a night drive is not the
 *    card it is drawn on. The rows follow the card, because that is what the traveller
 *    reads, and anything writing back has to use `ownerDayId` instead.
 */
/**
 * Whether a leg is the model's placeholder for "the day ended where you were standing".
 *
 * `dayWindow.stationary()` puts one of these between the last stop of a day and the
 * automatic night that closes it: same coordinate at both ends, nothing measured, no
 * texts. It is bookkeeping, not a drive, and drawn as a pill it said either " in " (the
 * separator of `roadtrip.leg.driveText` with both slots empty) or, once that was guarded,
 * "No route" under a stop the traveller had simply arrived at.
 *
 * Matched on the shape rather than on the next stop being an automatic night, because
 * what makes it not a drive is that it goes nowhere. A night the traveller moved to a
 * point down the road HAS a leg, with a distance, and that one keeps its pill.
 */
function isStationary(seg: RouteSegment | undefined): boolean {
  return !!seg
    && seg.distance === 0
    && seg.from[0] === seg.to[0]
    && seg.from[1] === seg.to[1]
}

/**
 * A leg too short to be a drive: the hire desk beside the terminal, the car park beside
 * the gate. Under 150 m and two minutes it is a hop, and a pill reading "0 km in 0 min"
 * under it is noise where the eye wants the next stop. The line still joins the two,
 * and a note a plugin attached is still worth the row.
 */
export function isHop(seg: RouteSegment | undefined): boolean {
  return !!seg
    && Number.isFinite(seg.distance)
    && seg.distance < 150
    && seg.duration < 120
    && !seg.noteText
}

export function roadtripRows(day: RoadtripDay): RoadtripRow[] {
  const rows: RoadtripRow[] = []
  const spills = day.spills ?? []

  // The drive in from yesterday, where the desktop rail draws its band: above the first
  // stop, because that is where it happens. A hop is left out like any other, and so is
  // a ride: the terminal row it lands on already carries the booking, and a pill would
  // read "No route" under a flight that has no road.
  const arriving = day.arrivingLeg
  if (arriving && day.arrivingFrom && !isHop(arriving) && !isCarrierMode(arriving.mode)) {
    rows.push({
      kind: 'arriving',
      seg: arriving,
      from: day.arrivingFrom,
      mode: day.stops[0]?.incomingLegMode ?? day.arrivingFrom.legMode ?? null,
    })
  }

  let number = 0
  day.stops.forEach((stop, i) => {
    const spill = spills.find(s => s.at === i)
    if (spill) {
      rows.push({
        kind: 'spill',
        fromDayNumber: spill.fromDayNumber,
        departs: spill.departure,
        stops: [],
      })
    }

    const next = day.stops[i + 1]
    const prev = day.stops[i - 1]
    const sameRide = (other: RoadtripStop | undefined): boolean =>
      !!stop.carrier && other?.carrier?.reservationId === stop.carrier.reservationId
    // The arrival of a same-day ride is inside the ride row its departure made.
    if (stop.carrier?.role === 'arrival' && prev?.carrier?.role === 'departure' && sameRide(prev)) return

    const automatic = !!stop.automaticNight
    // The morning marker at the hotel the day sets out from is that hotel's row.
    if (resumeFoldsIntoBookend(day, i)) return
    if (automatic) {
      rows.push({
        kind: 'auto',
        phase: stop.automaticNight?.phase === 'start' ? 'resume' : 'end',
        time: day.schedule.entries[i]?.arrival ?? null,
      })
    } else if (stop.carrier?.role === 'departure' && next?.carrier?.role === 'arrival' && sameRide(next)) {
      rows.push({
        kind: 'ride',
        index: i,
        carrier: stop.carrier,
        seg: day.legs[i],
        departure: stopRow(day, i, null),
        arrival: stopRow(day, i + 1, null),
      })
      // The road out of the arrival belongs to this row too; the pass below only
      // looks at the index it is on.
      pushLeg(i + 1)
      return
    } else {
      // A terminal or a hire car's desk is where the drive stops or resumes, not a
      // place the trip is for: it carries no number, the way a service stop carries none.
      const unnumbered = isServiceStopType(stop.stopType) || !!stop.carrier
      if (!unnumbered) number += 1
      rows.push(stopRow(day, i, unnumbered ? null : number))
    }

    pushLeg(i)
  })

  // The leg AFTER stop `i`, plus the dry point that falls on it. Both belong between
  // two stops, so they are emitted with the stop before them rather than in a pass of
  // their own.
  function pushLeg(i: number): void {
    const stop = day.stops[i]!
    const seg = day.legs[i]
    if (i < day.stops.length - 1 && !isStationary(seg) && !isHop(seg)) {
      rows.push({ kind: 'leg', index: i, seg, mode: day.stops[i + 1]?.incomingLegMode ?? stop.legMode ?? null })
      const dry = (day.dryPoints ?? []).find(p => p.legIndex === i)
      if (dry) {
        rows.push({ kind: 'dry', legIndex: i, intoLegKm: dry.intoLegKm, sinceKm: dry.sinceKm })
      }
    }
  }

  return rows
}

/**
 * Whether the leg leaving stop `index` can be offered other ways of driving it.
 *
 * The desktop rail's rule, kept here so the phone chain offers the button on exactly the
 * legs the rail does. A leg needs a route, because an unrouted one has nothing to weigh an
 * offer against. And neither of its ends may be an automatic night: that point is the
 * shell's own marker for where the daily window closed, a spot somewhere along the road
 * rather than a stop anyone chose. The router's offers from or to it would reshape a
 * stretch of a longer drive, and the via a choice writes is filed by the position of a
 * stored stop, which the marker is not. The rail draws the band out of that marker
 * without the control for the same reason.
 */
export function legReroutable(day: RoadtripDay, index: number): boolean {
  return index >= 0
    && index < day.stops.length - 1
    && !!day.legs[index]
    && !isHop(day.legs[index])
    && !day.stops[index].automaticNight
    && !day.stops[index + 1].automaticNight
    // A leg leaving a terminal is either the ride, which has no other way, or the road
    // out of an arrival, whose via would be filed at the terminal's index, which is the
    // index of the stop after it. The road INTO a departure terminal leaves a stored
    // stop and can be offered other ways like any other.
    && !day.stops[index].carrier
    // The drive from the hotel a day sets out from, or to the one it ends at, takes no
    // via: the morning's has no index to file one at, and the evening's index is the
    // road into tomorrow's, which a choice here would bend instead.
    && !day.stops[index].bookend
    && !day.stops[index + 1].bookend
}

/**
 * Whether the drive arriving at the head of a connected card can be offered other ways.
 *
 * The same rule as `legReroutable`, read for the one drive a card holds without a stop of
 * its own at its start: it leaves the last stop of the day before (`arrivingFrom`), and a
 * choice is filed behind that stop, on that day, where the map already files a point
 * dropped on this drive. It needs its road and the line it is drawn on, since that is
 * what the picker offers as the current way. A ride has no other way, a hop is nothing to
 * weigh, a terminal leaves nothing a via can be filed behind, and an automatic night at
 * either end is a marker on the road rather than a stop anybody chose.
 */
export function arrivingReroutable(day: RoadtripDay): boolean {
  const seg = day.arrivingLeg
  const from = day.arrivingFrom
  const to = day.stops[0]
  return !!seg && !!from && !!to && !!day.arrivingLine
    && !isCarrierMode(seg.mode)
    && !isHop(seg)
    && !from.carrier
    && !from.automaticNight
    && !to.automaticNight
    && !from.bookend
    && !to.bookend
}

/** Stops that carry a number, for a count that agrees with the numbering above. */
export function destinationCount(day: RoadtripDay): number {
  return day.stops.filter(s => !s.automaticNight && !s.carrier && !isServiceStopType(s.stopType)).length
}

/**
 * The rows with each ride opened up into its two terminals, in place. A ride row holds
 * them instead of two stop rows of their own, so a reader walking the rows for stops
 * has to look inside it, or a day that ends on a flight ends at the stop before it.
 */
function unfoldRides(rows: readonly RoadtripRow[]): RoadtripRow[] {
  return rows.flatMap(row => (row.kind === 'ride' ? [row.departure, row.arrival] : [row]))
}

/**
 * The two clocks a stage is headed with: when it starts, and when you reach its last place.
 *
 * Both are read off the clock the rows print on the right, which is an arrival all the way
 * down (the desktop rail keeps the same rule and spells a departure out in words where it
 * needs one). So each figure is one the chain below repeats, and the start is the first
 * stop's ARRIVAL rather than the moment you leave it. A first stop is a place you get to,
 * often at a time somebody pinned, and heading the card with its departure hid that
 * appointment behind its own stay: a stop pinned at 10:00 with an hour and a half there
 * read as leaving at 11:30, a clock no row shows.
 *
 * A resume point is a start, because the morning after an automatic night begins there. A
 * day end point is not an arrival: it marks where the window closed, not a place. A spill
 * band is passed over, because the departure it carries belongs to the day before.
 *
 * Stops without a clock are skipped at both ends instead of dashing the figure. That only
 * happens while a leg between them and the timed stops has no route yet, and a partly timed
 * day still has a first and a last clock worth reading, even when both are the same stop's.
 *
 * First and last mean row order, not the earliest and the latest clock, because the column
 * is not guaranteed to run forwards. A pin the drive cannot make keeps its own clock, so it
 * can read earlier than the stop above it. And when a daily window cannot be kept, each
 * stored day is timed on its own without being split, so a card can open on an evening stay
 * and end on a pin the next morning. The figures follow the rows in both cases, so they
 * never name a clock the chain does not.
 */
export function stageClocks(rows: readonly RoadtripRow[]): { start: string | null; arrive: string | null } {
  let start: string | null = null
  let arrive: string | null = null
  for (const row of unfoldRides(rows)) {
    if (row.kind === 'stop' && row.time) {
      start ??= row.time
      arrive = row.time
    } else if (row.kind === 'auto' && row.phase === 'resume' && row.time) {
      start ??= row.time
    }
  }
  return { start, arrive }
}

/**
 * The stop a stage ends on: the last one the chain draws, a service stop or the arrival
 * terminal of a ride included.
 *
 * The map half names it in its bar and opens it on a tap, so the name, the clock beside it
 * and the sheet the tap brings up all come off this one row and cannot name three different
 * things. The clock used to be read off the schedule on its own, which found the automatic
 * day end whenever the window closed after the last stop: a station reached at 12:40 sat
 * beside 22:00, the moment the day ran out rather than anything that happens there.
 *
 * Null for a stage without a single stop, one drawn with nothing but its night markers.
 * There is nothing for a tap to open then, and the bar says so by not being a button.
 */
export function stageEnd(rows: readonly RoadtripRow[]): StopRow | null {
  const unfolded = unfoldRides(rows)
  for (let i = unfolded.length - 1; i >= 0; i--) {
    const row = unfolded[i]
    if (row.kind === 'stop') return row
  }
  return null
}

/**
 * The stop a place's pin stands for on the road trip map: its first visit in the days given.
 *
 * A pin is drawn once per place, while a place can be several stops, like the hotel a loop
 * day leaves in the morning and comes back to at night, or a town the drive passes on two
 * days. Over a stage the caller hands in that one card, so a pin opens the visit on the
 * stage being looked at, however many days before it stop at the same place. Over the
 * whole drive it hands in every routed day, and the first visit in day order is the one a
 * traveller reading the drive from its start reaches first.
 *
 * An automatic night can sit on a place's position, but nobody chose to stop there, so it
 * never answers. Neither does a booked night at a day's edge: it is the stay's place, and
 * no stop of the day, so the inspector answers for the hotel instead. Null when none of the days stops at the place, which is a pin the road
 * trip cannot explain and the caller hands to the plan's own place inspector instead.
 */
export function firstStopOfPlace(days: readonly RoadtripDay[], placeId: number): RoadtripStop | null {
  for (const day of days) {
    const stop = day.stops.find(s => isStoredStop(s) && s.placeId === placeId)
    if (stop) return stop
  }
  return null
}

/**
 * The next destination the plan still owes you, measured against the clock.
 *
 * Only for today: a countdown on a day in March is noise. `minutesUntil` goes
 * NEGATIVE once that stop's planned time has passed, and that negative number is
 * the only honest statement about running late this screen can make. There is no
 * position source, so the app cannot know whether the stop was reached; what it
 * can say is that the plan said 10:45 and it is now 11:21.
 *
 * Null once the last stop's time is past: a screen still saying "next" after the
 * driving is done is worse than one saying nothing.
 */
export function upNextStop(
  day: RoadtripDay | null,
  nowMinutes: number,
  isToday: boolean,
): { row: StopRow; minutesUntil: number } | null {
  if (!day || !isToday) return null
  const timed = unfoldRides(roadtripRows(day))
    .filter((r): r is StopRow => r.kind === 'stop' && !r.service)
    .map(row => ({ row, at: clockMinutes(row.time) }))
    .filter((x): x is { row: StopRow; at: number } => x.at != null)
  if (!timed.length) return null

  const ahead = timed.find(x => x.at >= nowMinutes)
  if (ahead) return { row: ahead.row, minutesUntil: ahead.at - nowMinutes }

  // Everything is past. The last one is only still "next" while the day has not
  // run out entirely, which we take as its planned time plus the hour after it.
  const last = timed[timed.length - 1]
  const overdue = nowMinutes - last.at
  return overdue <= 60 ? { row: last.row, minutesUntil: -overdue } : null
}

function clockMinutes(time: string | null): number | null {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}
