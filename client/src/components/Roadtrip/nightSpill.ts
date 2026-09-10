import { computeSchedule, parseClock, type Schedule } from './roadtripModel'
import type { QuietDay, RoadtripDay, RoadtripStop } from './useRoadtripRoutes'
import type { RouteSegment } from '../../types'

/**
 * Which date each stop of a road trip is drawn on.
 *
 * A day plan stores a stop against a day, and that is the right model for planning: the
 * traveller put it there. But a road trip is read as a drive, and a drive that leaves at
 * 21:00 and arrives at 01:23 arrives TOMORROW. The rail used to say so with a band
 * between the two stops and then carry on listing the arrival under yesterday's date —
 * the one thing the band had just said was wrong.
 *
 * So a road trip lays its stops out by the day they are actually reached, and the drive
 * across midnight travels with them, which is what makes the kilometres count on the day
 * they are driven rather than on the day they were set off on.
 *
 * **Nothing is written.** The stop still belongs to the day it was planned on, the day
 * plan shows it there, and every stop carries `ownerDayId`/`ownerIndex` so a reorder, a
 * move, a stay edit or a refuel offer still names the day the server knows it by. Because
 * this is worked out again from the arrival times every time they change, shortening the
 * stay before a night drive brings the stop back on its own — there is no state to undo,
 * and no way for the arrangement and the times to disagree.
 */

/** A stretch of one card's chain that was driven onto it from an earlier day. */
export interface SpillMark {
  /** Where it starts in the card's `stops`. */
  at: number
  /** How many stops it covers. */
  count: number
  /** The day they are stored on, as the traveller numbers it. */
  fromDayNumber: number
  /** When the drive set off, read off that day's own schedule. */
  departure: string | null
  /** The drive across midnight itself, or undefined when that leg never routed. */
  leg: RouteSegment | undefined
  /**
   * The stop the night drive LEAVES from, still on the earlier card.
   *
   * Needed because that drive is drawn on this card while belonging, leg-wise, to the
   * stop before it: anything measured along this card's line that lands on the incoming
   * stretch has to be anchored to this stop, not to the first one drawn here. Putting a
   * via there and anchoring it to the wrong stop is what made a route double back.
   */
  fromStop: RoadtripStop | undefined
  /**
   * The road it covers, so the card it lands on can draw it and count it.
   *
   * Without this the night is a hole: the day it set off from ends before it and the day
   * it arrives on starts after it, so its kilometres belong to neither and the map draws
   * two runs with a gap between them.
   */
  line: [number, number][]
}

/** One date's worth of driving, before the legs and warnings are hung off it. */
export interface SpillChain {
  dayId: number
  dayNumber: number
  date: string | null
  title: string | null
  /** In driving order: anything inherited first, then the day's own. */
  stops: RoadtripStop[]
  /** Arrivals as each stop's OWN day worked them out, renumbered onto this chain. */
  schedule: Schedule
  /** The inherited stretches, in the order they appear. Empty on an ordinary day. */
  spills: SpillMark[]
}

/** A day as the plan holds it, before anything is routed onto it. */
type PlanDay = Pick<RoadtripDay, 'dayId' | 'dayNumber' | 'date' | 'title' | 'stops'>

/** What the caller can find out about the road between two stops. */
type LegLookup = (from: RoadtripStop, to: RoadtripStop) => { seg: RouteSegment; line: [number, number][] } | undefined

/** One stop on its way to a card, with the times its own day gave it. */
interface Placed {
  stop: RoadtripStop
  arrival: string | null
  departure: string | null
  /** Days past its own day's first stop. Renumbered against the card it lands on. */
  dayOffset: number
  /** Findings its own day filed against it, to be renumbered with it. */
  codes: ('late' | 'overnight' | 'leg' | 'range')[]
  lateMinutes: number | null
  /** Which day it came from, or null when it is the card's own. */
  fromDayNumber: number | null
  departedAt: string | null
  leg: RouteSegment | undefined
  line: [number, number][]
  from: RoadtripStop | undefined
}

/**
 * Lays a trip out by the date each stop is reached.
 *
 * Every day of the trip gets a chain, in trip order, including the ones that carry no
 * drive of their own — a day whose only content was driven onto it through the night is
 * still a day, and the alternative is a date that silently disappears. The caller drops
 * the chains that end up with fewer than two stops, exactly as it did before.
 */
export function spillChains(plan: PlanDay[], quietDays: QuietDay[], legFor: LegLookup): SpillChain[] {
  const all: PlanDay[] = [...plan, ...quietDays.map(d => ({
    dayId: d.dayId, dayNumber: d.dayNumber, date: d.date, title: d.title, stops: d.stops,
  }))].sort((a, b) => a.dayNumber - b.dayNumber)
  const numbers = new Set(all.map(d => d.dayNumber))
  const landing = new Map<number, Placed[]>()
  for (const d of all) landing.set(d.dayNumber, [])

  for (const d of all) {
    // A day's own schedule, walked over its own stops: this is what says where midnight
    // falls, and it is the only reading of these times that is anchored to the times the
    // traveller actually pinned.
    const routed = d.stops.slice(0, -1).map((s, i) => legFor(s, d.stops[i + 1]))
    const legs = routed.map(l => l?.seg)
    const schedule = computeSchedule(
      d.stops.map(s => ({ anchor: s.time, dwellMinutes: s.dwellMinutes })),
      legs.map(l => l?.duration),
    )
    /**
     * Which day of this chain each stop is reached on, read off the clock itself.
     *
     * Not `dayOffset`. That is arithmetic on top of a pinned time resolved to the
     * occurrence NEAREST the drive reaching it — so a stop pinned at 23:00 after one
     * pinned at 07:00 resolves to 23:00 yesterday (nine hours late reads as nearer than
     * fifteen hours of waiting), the chain drops below midnight, and the schedule lifts
     * the whole day back up to keep it positive. The result is an early stop wearing a
     * higher offset than the one after it, and placing stops on those offsets tears the
     * drive into pieces that are visited out of order.
     *
     * A clock that goes backwards is the one signal none of that can fake. Arrivals only
     * ever move forward along a drive, so 23:00 followed by 03:12 is one thing and one
     * thing only: midnight happened in between. A stop with no arrival yet inherits the
     * day of the one before it rather than resetting the count.
     */
    let day = 0
    let previous: number | null = null
    d.stops.forEach((stop, i) => {
      const entry = schedule.entries[i]
      const clock = parseClock(entry?.arrival)
      if (clock !== null) {
        if (previous !== null && clock < previous) day += 1
        previous = clock
      }
      const offset = day
      const marks = schedule.warnings.filter(w => w.index === i)
      // A day the trip does not have is not a day to move onto. Those stops stay where
      // they are and keep the crossing marked the way the rail always marked it, because
      // the only other answer would be to invent a date nobody planned. The ratchet stays
      // where it was too, so the rest of the chain stays with them.
      const reachable = offset > 0 && numbers.has(d.dayNumber + offset)
      const target = reachable ? d.dayNumber + offset : d.dayNumber
      const moved = target !== d.dayNumber
      landing.get(target)?.push({
        stop,
        arrival: entry?.arrival ?? null,
        departure: entry?.departure ?? null,
        // Renumbered against the card it lands on: 01:23 is not "the next day" once it is
        // drawn under the next day's date. A stop that could not move keeps its offset,
        // which is what still makes the "+1" and the crossing band read correctly.
        dayOffset: moved ? 0 : offset,
        // The crossing itself is the spill block's own head wherever the stop moved, so
        // it would be said twice.
        codes: marks.map(w => w.code).filter(c => !(moved && c === 'overnight')),
        lateMinutes: marks.find(w => w.code === 'late')?.minutes ?? null,
        fromDayNumber: moved ? d.dayNumber : null,
        departedAt: moved ? schedule.entries[i - 1]?.departure ?? null : null,
        leg: moved ? legs[i - 1] : undefined,
        line: moved ? routed[i - 1]?.line ?? [] : [],
        from: moved ? d.stops[i - 1] : undefined,
      })
    })
  }

  const out: SpillChain[] = []
  for (const d of all) {
    const placed = landing.get(d.dayNumber) ?? []
    if (!placed.length) continue
    // Inherited stretches first, oldest day first, then the card's own stops: that is
    // the order they are driven in.
    placed.sort((a, b) => (a.fromDayNumber ?? Number.MAX_SAFE_INTEGER) - (b.fromDayNumber ?? Number.MAX_SAFE_INTEGER))
    const spills: SpillMark[] = []
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i]
      if (p.fromDayNumber === null) continue
      const last = spills[spills.length - 1]
      if (last && last.fromDayNumber === p.fromDayNumber && last.at + last.count === i) last.count += 1
      else spills.push({ at: i, count: 1, fromDayNumber: p.fromDayNumber, departure: p.departedAt, leg: p.leg, line: p.line, fromStop: p.from })
    }
    out.push({
      dayId: d.dayId,
      dayNumber: d.dayNumber,
      date: d.date,
      title: d.title,
      stops: placed.map(p => p.stop),
      schedule: {
        entries: placed.map(p => ({
          arrival: p.arrival,
          departure: p.departure,
          anchored: p.stop.time !== null && p.stop.time !== undefined,
          dayOffset: p.dayOffset,
        })),
        warnings: placed.flatMap((p, i) => p.codes.map(code => (
          code === 'late' ? { index: i, code, minutes: p.lateMinutes ?? 0 } : { index: i, code }
        ))),
      },
      spills,
    })
  }
  return out
}
