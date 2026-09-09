import { describe, it, expect } from 'vitest'
import {
  computeSchedule,
  formatClock,
  formatDurationShort,
  insertIndexForAlong,
  deriveDriveWarnings,
  legIndexForAlong,
  refuelsRange,
  sectionAnchors,
  parseClock,
  splitIntoRuns,
  sumLegSeconds,
  refuelStopTypeFor,
} from './roadtripModel'

describe('formatDurationShort', () => {
  it('prints minutes below an hour', () => {
    expect(formatDurationShort(45 * 60)).toBe('45 min')
    expect(formatDurationShort(0)).toBe('0 min')
  })

  it('drops the zero minutes on a whole hour', () => {
    expect(formatDurationShort(3600)).toBe('1 h')
    expect(formatDurationShort(2 * 3600)).toBe('2 h')
  })

  it('prints hours and minutes together', () => {
    expect(formatDurationShort(2 * 3600 + 10 * 60)).toBe('2 h 10 min')
  })

  it('carries instead of printing sixty minutes', () => {
    // 1 h 59 min 40 s rounds the minutes to 60, which must become 2 h.
    expect(formatDurationShort(3600 + 59 * 60 + 40)).toBe('2 h')
  })

  it('treats nonsense as nothing rather than throwing', () => {
    expect(formatDurationShort(Number.NaN)).toBe('0 min')
    expect(formatDurationShort(-90)).toBe('0 min')
  })
})

describe('parseClock', () => {
  it('reads wall-clock times', () => {
    expect(parseClock('09:45')).toBe(9 * 60 + 45)
    expect(parseClock('9:05')).toBe(9 * 60 + 5)
    expect(parseClock('00:00')).toBe(0)
  })

  it('ignores anything trailing, as stored times sometimes carry seconds', () => {
    expect(parseClock('14:30:00')).toBe(14 * 60 + 30)
  })

  it('rejects what is not a time', () => {
    expect(parseClock(null)).toBeNull()
    expect(parseClock('')).toBeNull()
    expect(parseClock('later')).toBeNull()
    expect(parseClock('25:00')).toBeNull()
    expect(parseClock('12:75')).toBeNull()
  })
})

describe('formatClock', () => {
  it('pads both halves', () => {
    expect(formatClock(9 * 60 + 5)).toBe('09:05')
    expect(formatClock(0)).toBe('00:00')
  })

  it('wraps past midnight instead of printing a 25th hour', () => {
    expect(formatClock(25 * 60)).toBe('01:00')
    expect(formatClock(-30)).toBe('23:30')
  })
})

describe('computeSchedule', () => {
  const hours = (h: number): number => h * 3600

  it('walks arrival and departure forward from the first pinned time', () => {
    // The example from discussion #1797: leave at 8:00, drive 1 h 45, stay 2 h, drive 1 h 10.
    const { entries } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 120 },
        { anchor: null, dwellMinutes: 45 },
      ],
      [hours(1.75), hours(1) + 10 * 60],
    )
    expect(entries[0]).toMatchObject({ arrival: '08:00', departure: '08:00', anchored: true })
    expect(entries[1]).toMatchObject({ arrival: '09:45', departure: '11:45', anchored: false })
    expect(entries[2]).toMatchObject({ arrival: '12:55', departure: '13:40', anchored: false })
  })

  it('works back from the first pinned time to say when to set off', () => {
    // The museum opens at ten and we want an hour at the stop before it, an hour of
    // driving in between: be there at eight. Answering that is the reason to pin a time
    // on the second stop at all.
    const { entries } = computeSchedule(
      [
        { anchor: null, dwellMinutes: 60 },
        { anchor: '10:00', dwellMinutes: 30 },
      ],
      [hours(1)],
    )
    expect(entries[0]).toMatchObject({ arrival: '08:00', departure: '09:00', anchored: false })
    expect(entries[1]).toMatchObject({ arrival: '10:00', anchored: true })
  })

  it('stops working back at a leg that never routed rather than inventing one', () => {
    const { entries } = computeSchedule(
      [
        { anchor: null, dwellMinutes: 60 },
        { anchor: null, dwellMinutes: 30 },
        { anchor: '10:00', dwellMinutes: 30 },
      ],
      [undefined, hours(1)],
    )
    expect(entries[0]).toMatchObject({ arrival: null, departure: null })
    // Leaves at 09:00 to arrive at 10:00, and its own half hour puts it there at 08:30.
    expect(entries[1]).toMatchObject({ arrival: '08:30', departure: '09:00' })
    expect(entries[2]).toMatchObject({ arrival: '10:00', anchored: true })
  })

  it('keeps the earliest stop on day zero when working back crosses midnight', () => {
    // Pinned at one in the morning with three hours of driving before it: the stop before
    // is the evening before. The chain shifts up a day rather than printing a day below
    // zero, so the boundary shows between the two stops instead of under the first one.
    const { entries, warnings } = computeSchedule(
      [
        { anchor: null, dwellMinutes: 0 },
        { anchor: '01:00', dwellMinutes: 0 },
      ],
      [hours(3)],
    )
    expect(entries[0]).toMatchObject({ arrival: '22:00', dayOffset: 0 })
    expect(entries[1]).toMatchObject({ arrival: '01:00', dayOffset: 1, anchored: true })
    expect(warnings).toContainEqual({ index: 1, code: 'overnight' })
  })

  it('restarts the cascade at a pinned stop instead of pushing it', () => {
    // The drive would arrive at 09:00, but the museum ticket says 11:00: everything
    // after it counts from 11:00, not from the drive.
    const { entries } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: '11:00', dwellMinutes: 60 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hours(1), hours(1)],
    )
    expect(entries[1].arrival).toBe('11:00')
    expect(entries[2].arrival).toBe('13:00')
  })

  it('ROADTRIP-MODEL-082: a night drive onto a pinned time after midnight is on time', () => {
    // Leave at 20:00, drive six hours, check in at 02:00. The anchor used to be
    // placed on the day the cascade had reached so far — and that only advances
    // once a computed arrival crosses midnight, which is read before this stop's
    // arrival is known. So the stop that does the crossing had its own pin put a
    // whole day early: the rail drew a warning-coloured "+24 h" on a plan that
    // was exactly on time, and dropped the overnight marker with it.
    const { entries, warnings } = computeSchedule(
      [
        { anchor: '20:00', dwellMinutes: 0 },
        { anchor: '02:00', dwellMinutes: 0 },
      ],
      [hours(6)],
    )

    expect(warnings.filter(w => w.code === 'late')).toEqual([])
    expect(entries[1]).toMatchObject({ arrival: '02:00', dayOffset: 1, anchored: true })
    // The day still turned over, so the rail keeps its carry badge.
    expect(warnings.some(w => w.code === 'overnight' && w.index === 1)).toBe(true)
  })

  it('ROADTRIP-MODEL-083: a ferry that really is missed is still reported late', () => {
    // The other half: picking the nearest occurrence must not swallow a genuine
    // delay. Leaving at 21:00 and driving five hours arrives at 02:00, half an
    // hour after the 01:30 ferry, and that is what it says.
    const { warnings } = computeSchedule(
      [
        { anchor: '21:00', dwellMinutes: 0 },
        { anchor: '01:30', dwellMinutes: 0 },
      ],
      [hours(5)],
    )
    expect(warnings.find(w => w.code === 'late')).toMatchObject({ index: 1, minutes: 30 })
  })

  it('ROADTRIP-MODEL-084: a pinned stop after an untimed leg keeps the day it is on', () => {
    // Nothing to be late against, but the day carried so far still applies —
    // otherwise the stop prints under a day-1 stop as though it happened first.
    const { entries } = computeSchedule(
      [
        { anchor: '20:00', dwellMinutes: 0 },
        { anchor: '02:00', dwellMinutes: 0 },
        { anchor: '09:00', dwellMinutes: 0 },
      ],
      [hours(6), undefined],
    )
    expect(entries[2]).toMatchObject({ arrival: '09:00', dayOffset: 1 })
  })

  it('reports a stop the drive cannot reach in time', () => {
    const { warnings } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: '09:00', dwellMinutes: 0 },
      ],
      [hours(3)],
    )
    expect(warnings).toEqual([{ index: 1, code: 'late', minutes: 120 }])
  })

  it('does not cry about a minute of rounding', () => {
    const { warnings } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 0 },
        { anchor: '09:00', dwellMinutes: 0 },
      ],
      [hours(1) + 30],
    )
    expect(warnings).toEqual([])
  })

  it('breaks the chain at a leg that never routed', () => {
    const { entries } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: 30 },
        { anchor: null, dwellMinutes: 30 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [undefined, hours(1)],
    )
    expect(entries[0].arrival).toBe('08:00')
    expect(entries[1].arrival).toBeNull()
    expect(entries[2].arrival).toBeNull()
  })

  it('flags the day rolling past midnight and keeps counting', () => {
    const { entries, warnings } = computeSchedule(
      [
        { anchor: '22:00', dwellMinutes: 0 },
        { anchor: null, dwellMinutes: 0 },
      ],
      [hours(4)],
    )
    expect(entries[1].arrival).toBe('02:00')
    expect(entries[1].dayOffset).toBe(1)
    expect(warnings).toEqual([{ index: 1, code: 'overnight' }])
  })

  it('handles an empty chain', () => {
    expect(computeSchedule([], [])).toEqual({ entries: [], warnings: [] })
  })

  it('treats a missing dwell as no time spent', () => {
    const { entries } = computeSchedule(
      [
        { anchor: '08:00', dwellMinutes: null },
        { anchor: null, dwellMinutes: null },
      ],
      [hours(1)],
    )
    expect(entries[0].departure).toBe('08:00')
    expect(entries[1].arrival).toBe('09:00')
  })
})

describe('splitIntoRuns', () => {
  const drive = (): string => 'driving'

  it('asks for a whole day travelled one way in a single run', () => {
    const runs = splitIntoRuns(['a', 'b', 'c', 'd'], drive)
    expect(runs).toEqual([{ stops: ['a', 'b', 'c', 'd'], mode: 'driving' }])
  })

  it('splits where the travel mode changes, and repeats the stop on both sides', () => {
    // Drive to b, walk to c, drive on to d: the walk is its own request, and b and c
    // each belong to two runs because they are the ends of neighbouring legs.
    const modes = ['driving', 'walking', 'driving']
    const runs = splitIntoRuns(['a', 'b', 'c', 'd'], (from) => modes[['a', 'b', 'c'].indexOf(from)])
    expect(runs).toEqual([
      { stops: ['a', 'b'], mode: 'driving' },
      { stops: ['b', 'c'], mode: 'walking' },
      { stops: ['c', 'd'], mode: 'driving' },
    ])
  })

  it('keeps consecutive legs of the same mode together across a change and back', () => {
    const modes = ['driving', 'driving', 'walking', 'walking']
    const runs = splitIntoRuns(['a', 'b', 'c', 'd', 'e'], (from) => modes[['a', 'b', 'c', 'd'].indexOf(from)])
    expect(runs).toEqual([
      { stops: ['a', 'b', 'c'], mode: 'driving' },
      { stops: ['c', 'd', 'e'], mode: 'walking' },
    ])
  })

  it('has nothing to ask for when there is no leg', () => {
    expect(splitIntoRuns([], drive)).toEqual([])
    expect(splitIntoRuns(['a'], drive)).toEqual([])
  })
})

describe('sumLegSeconds', () => {
  it('adds only the legs that routed', () => {
    expect(sumLegSeconds([600, undefined, 1200])).toBe(1800)
    expect(sumLegSeconds([])).toBe(0)
  })
})

describe('insertIndexForAlong', () => {
  // Hamburg 0, Lueneburg 50, Berlin 290 — the day's stops as distances driven.
  const stops = [0, 50, 290]

  it('puts a hit between the two stops it falls between', () => {
    expect(insertIndexForAlong(stops, 120)).toBe(2)
    expect(insertIndexForAlong(stops, 20)).toBe(1)
  })

  it('never lands before the stop the day starts from', () => {
    expect(insertIndexForAlong(stops, 0)).toBe(1)
    // A corridor is wider than the road, so a hit can project just behind the start.
    expect(insertIndexForAlong(stops, -3)).toBe(1)
  })

  it('never lands after the stop the day ends at', () => {
    expect(insertIndexForAlong(stops, 290)).toBe(2)
    expect(insertIndexForAlong(stops, 400)).toBe(2)
  })

  it('puts a hit exactly on a stop after it, not before', () => {
    expect(insertIndexForAlong(stops, 50)).toBe(2)
  })

  it('has nowhere to insert on a day that is not a drive', () => {
    expect(insertIndexForAlong([], 10)).toBe(0)
    expect(insertIndexForAlong([0], 10)).toBe(1)
  })
})

describe('legIndexForAlong', () => {
  // Against the legs' own lengths rather than by projecting the stops as well: leg
  // distances come from the router and are exact, while two stops close together project
  // onto each other's stretch and would put a charging halt the wrong side of a town.
  const legs = [10_000, 25_000, 40_000]

  it('FE-ROADTRIP-MODEL-050: a point inside a leg belongs to that leg', () => {
    expect(legIndexForAlong(legs, 0)).toBe(0)
    expect(legIndexForAlong(legs, 9_999)).toBe(0)
    expect(legIndexForAlong(legs, 10_000)).toBe(1)
    expect(legIndexForAlong(legs, 24_999)).toBe(1)
    expect(legIndexForAlong(legs, 25_000)).toBe(2)
  })

  it('FE-ROADTRIP-MODEL-051: a point past the end lands in the last leg, not nowhere', () => {
    // A rounding edge, not a missing leg: the projection and the router measure the same
    // line two different ways and disagree by metres at the very end.
    expect(legIndexForAlong(legs, 40_000)).toBe(2)
    expect(legIndexForAlong(legs, 99_999)).toBe(2)
  })

  it('FE-ROADTRIP-MODEL-052: a day with no routed leg has nowhere to put anything', () => {
    expect(legIndexForAlong([], 100)).toBe(-1)
  })
})

describe('deriveDriveWarnings', () => {
  // Worked through the way a traveller reads it: Hamburg, A1, HEM, Berlin. The badge on
  // a stop has to agree with the sum of the drive bands above it, or it looks made up.
  it('FE-ROADTRIP-MODEL-069: the figure on a stop is what the bands above it add up to', () => {
    const out = deriveDriveWarnings(
      [leg(20, 21.5), leg(62, 103.4), leg(155, 244.7)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 100 },
      0,
    )
    // 21.5 + 103.4 on arrival at HEM, and then it keeps counting, because nothing on this
    // trip fills up.
    expect(out.warnings).toEqual([
      { index: 2, code: 'range', sinceKm: 125 },
      { index: 3, code: 'range', sinceKm: 370 },
    ])
  })

  it('FE-ROADTRIP-MODEL-070: arriving at a petrol station is the plan, not a warning', () => {
    // Same trip, but HEM is marked as fuel. Reaching it with an empty tank is exactly
    // what it is there for, so nothing is flagged on it; the budget still starts over,
    // and the next stretch is measured from there.
    const out = deriveDriveWarnings(
      [leg(20, 21.5), leg(62, 103.4), leg(155, 244.7)],
      [false, false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 100 },
      0,
    )
    expect(out.warnings).toEqual([{ index: 3, code: 'range', sinceKm: 245 }])
    // 245 and not 370: HEM filled the tank, so Berlin counts from there.
  })

  const noLimits = { legMinutes: null, dayMinutes: null, rangeKm: null }
  const leg = (minutes: number, km: number) => ({ duration: minutes * 60, distance: km * 1000 })

  it('FE-ROADTRIP-MODEL-060: no limits set means nothing to report', () => {
    const out = deriveDriveWarnings([leg(600, 900)], [false, false], noLimits, 0)
    expect(out.warnings).toEqual([])
    expect(out.day).toBeNull()
  })

  it('FE-ROADTRIP-MODEL-061: a leg over the limit reports how far over, on the stop it arrives at', () => {
    // On arrival, not on departure. Both findings are running totals that only become
    // true when you get there, and anchored to the departure the number reads as the
    // length of the NEXT leg, which is a different figure and the one that looked wrong.
    const out = deriveDriveWarnings(
      [leg(100, 90), leg(240, 200)],
      [false, false, false],
      { ...noLimits, legMinutes: 180 },
      0,
    )
    expect(out.warnings).toEqual([{ index: 2, code: 'leg', overMinutes: 60 }])
  })

  it('FE-ROADTRIP-MODEL-062: the day figure is the sum of the legs, and only that', () => {
    const out = deriveDriveWarnings(
      [leg(200, 180), leg(200, 180)],
      [false, false, false],
      { ...noLimits, dayMinutes: 360 },
      0,
    )
    expect(out.day).toEqual({ code: 'dayDriving', minutes: 400, limitMinutes: 360 })
  })

  it('FE-ROADTRIP-MODEL-063: the figure keeps counting until something actually refuels', () => {
    // A warning is not a fill-up. Zeroing the budget at one made every figure after the
    // first wrong: the second stop would claim a fresh tank while the same one is still
    // in the car.
    const out = deriveDriveWarnings(
      [leg(60, 300), leg(60, 400), leg(60, 300), leg(60, 400)],
      [false, false, false, false, false],
      { ...noLimits, rangeKm: 600 },
      0,
    )
    expect(out.warnings).toEqual([
      { index: 2, code: 'range', sinceKm: 700 },
      { index: 3, code: 'range', sinceKm: 1000 },
      { index: 4, code: 'range', sinceKm: 1400 },
    ])
  })

  it('FE-ROADTRIP-MODEL-071: adding a fuel stop is what stops the run of warnings', () => {
    // The same drive with a charger at stop 2. Nothing is flagged there, because reaching
    // it on an empty tank is what it is for; everything after counts from zero again, so
    // the three-warning run above collapses to one.
    const out = deriveDriveWarnings(
      [leg(60, 300), leg(60, 400), leg(60, 300), leg(60, 400)],
      [false, false, true, false, false],
      { ...noLimits, rangeKm: 600 },
      0,
    )
    expect(out.warnings).toEqual([{ index: 4, code: 'range', sinceKm: 700 }])
  })

  it('FE-ROADTRIP-MODEL-064: filling up starts the budget over, resting does not', () => {
    const stops = [false, true, false]
    const out = deriveDriveWarnings(
      [leg(60, 500), leg(60, 500)],
      stops,
      { ...noLimits, rangeKm: 600 },
      0,
    )
    // The tank is filled at stop 1, so the second 500 km starts from zero and neither leg
    // trips the limit. Without the refuel it would be 1000 km on a 600 km range.
    expect(out.warnings).toEqual([])
  })

  it('FE-ROADTRIP-MODEL-065: only fuel and charging refuel', () => {
    expect(refuelsRange('fuel')).toBe(true)
    expect(refuelsRange('charging')).toBe(true)
    // A two-hour lunch fills no tank, and TREK does not know whether the restaurant has a
    // charger in its car park.
    expect(refuelsRange('restaurant')).toBe(false)
    expect(refuelsRange('rest_area')).toBe(false)
    expect(refuelsRange('campsite')).toBe(false)
    expect(refuelsRange(null)).toBe(false)
  })

  it('FE-ROADTRIP-MODEL-066: the budget carries into the next day, because a tank does not empty overnight', () => {
    const first = deriveDriveWarnings([leg(60, 400)], [false, false], { ...noLimits, rangeKm: 600 }, 0)
    expect(first.carryKm).toBe(400)

    const second = deriveDriveWarnings([leg(60, 300)], [false, false], { ...noLimits, rangeKm: 600 }, first.carryKm)
    expect(second.warnings).toEqual([{ index: 1, code: 'range', sinceKm: 700 }])
  })

  it('FE-ROADTRIP-MODEL-067: an unrouted leg gives the budget up rather than guessing', () => {
    const out = deriveDriveWarnings(
      [undefined, leg(60, 500)],
      [false, false, false],
      { ...noLimits, rangeKm: 100 },
      0,
    )
    expect(out.warnings).toEqual([])
    expect(out.carryKm).toBeNull()
  })

  it('FE-ROADTRIP-MODEL-068: filling up at the last stop of the day still counts', () => {
    const out = deriveDriveWarnings([leg(60, 400)], [false, true], { ...noLimits, rangeKm: 600 }, 0)
    expect(out.carryKm).toBe(0)
  })
})

describe('sectionAnchors', () => {
  it('FE-ROADTRIP-MODEL-080: every stop, and the middle of every leg between them', () => {
    // The leg midpoints are the point of the feature: a break on a five-hour drive is
    // planned in the middle of the drive, not at either end of it.
    expect(sectionAnchors([0, 100, 250])).toEqual([
      { kind: 'stop', index: 0, alongKm: 0 },
      { kind: 'leg', index: 0, alongKm: 50 },
      { kind: 'stop', index: 1, alongKm: 100 },
      { kind: 'leg', index: 1, alongKm: 175 },
      { kind: 'stop', index: 2, alongKm: 250 },
    ])
  })

  it('FE-ROADTRIP-MODEL-081: a single stop has no leg to sit in the middle of', () => {
    expect(sectionAnchors([42])).toEqual([{ kind: 'stop', index: 0, alongKm: 42 }])
    expect(sectionAnchors([])).toEqual([])
  })
})

describe('deriveDriveWarnings — what counts as driving', () => {
  const drive = (minutes: number, km: number) =>
    ({ duration: minutes * 60, distance: km * 1000, mode: 'driving' })
  const onFoot = (minutes: number, km: number) =>
    ({ duration: minutes * 60, distance: km * 1000, mode: 'walking' })

  it('FE-ROADTRIP-MODEL-085: a walk to a viewpoint is not over the longest drive allowed', () => {
    // A day may legitimately mix modes — splitIntoRuns exists for exactly that —
    // and a two hour hike reported as a leg finding reads as a fault in a plan
    // that has none.
    const out = deriveDriveWarnings(
      [drive(60, 80), onFoot(120, 6)],
      [false, false, false],
      { legMinutes: 90, dayMinutes: null, rangeKm: null },
      0,
    )
    expect(out.warnings).toEqual([])
  })

  it('FE-ROADTRIP-MODEL-086: walked kilometres are not on the tank', () => {
    // Nor does walking fill it: the budget is left exactly as the drive left it.
    const out = deriveDriveWarnings(
      [drive(60, 80), onFoot(120, 60), drive(30, 30)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 100 },
      0,
    )
    // 80 then 110 — the 60 walked kilometres never entered the budget.
    expect(out.warnings).toEqual([{ index: 3, code: 'range', sinceKm: 110 }])
    expect(out.carryKm).toBe(110)
  })

  it('FE-ROADTRIP-MODEL-087: a walk does not count toward the driving time of the day', () => {
    const out = deriveDriveWarnings(
      [drive(60, 80), onFoot(180, 9)],
      [false, false, false],
      { legMinutes: null, dayMinutes: 90, rangeKm: null },
      0,
    )
    expect(out.day).toBeNull()
  })

  it('FE-ROADTRIP-MODEL-088: a leg with no mode is still a drive', () => {
    // Every leg was a drive before the field existed, so an absent mode counts.
    // Reading it the other way round would silently switch the warnings off.
    const out = deriveDriveWarnings(
      [{ duration: 120 * 60, distance: 200 * 1000 }],
      [false, false],
      { legMinutes: 90, dayMinutes: null, rangeKm: null },
      0,
    )
    expect(out.warnings).toEqual([{ index: 1, code: 'leg', overMinutes: 30 }])
  })
})

describe('deriveDriveWarnings — where the tank actually runs dry', () => {
  const drive = (minutes: number, km: number) =>
    ({ duration: minutes * 60, distance: km * 1000, mode: 'driving' })
  const ferry = (minutes: number, km: number) =>
    ({ duration: minutes * 60, distance: km * 1000, mode: 'ferry' })

  it('FE-ROADTRIP-MODEL-089: the dry point sits where the fuel ends, not where somebody notices', () => {
    // 300 km of range, two legs of 200. The warning lands on stop 2, which is 400 km in;
    // the tank was empty 100 km earlier, halfway through the second leg. Suggesting a
    // filling station at the warning would suggest one the car cannot reach.
    const out = deriveDriveWarnings(
      [drive(120, 200), drive(120, 200)],
      [false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      0,
    )
    expect(out.warnings).toEqual([{ index: 2, code: 'range', sinceKm: 400 }])
    expect(out.emptyAt).toEqual([
      { legIndex: 1, intoLegKm: 100, drivenMeters: 300000, sinceKm: 300 },
    ])
  })

  it('FE-ROADTRIP-MODEL-090: one dry point per tank, however many warnings the stretch produces', () => {
    // A long run with nothing on it warns at every stop on purpose, because a warning is
    // not a fill-up. One refuel offer per warning would stack three identical offers for
    // a single tank down one day.
    const out = deriveDriveWarnings(
      [drive(60, 400), drive(60, 400), drive(60, 400)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 600 },
      0,
    )
    expect(out.warnings).toHaveLength(2)
    expect(out.emptyAt).toHaveLength(1)
    expect(out.emptyAt[0]).toMatchObject({ legIndex: 1, drivenMeters: 600000 })
  })

  it('FE-ROADTRIP-MODEL-091: filling up starts a new tank, and the next one runs dry again', () => {
    const out = deriveDriveWarnings(
      [drive(60, 400), drive(60, 400), drive(60, 400)],
      [false, false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 600 },
      0,
    )
    // Empty once before the fuel stop, then once more after it.
    expect(out.emptyAt).toHaveLength(1)
    expect(out.emptyAt[0].drivenMeters).toBe(600000)
  })

  it('FE-ROADTRIP-MODEL-092: a ferry carries the car without burning a drop', () => {
    // The trap this field exists for. The budget skips a ferry, so the dry point must be
    // counted in DRIVING metres only; measuring along the day's drawn line instead would
    // overshoot by the whole crossing and put the marker out at sea.
    const out = deriveDriveWarnings(
      [drive(60, 200), ferry(120, 50), drive(60, 200)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      0,
    )
    expect(out.emptyAt).toEqual([
      { legIndex: 2, intoLegKm: 100, drivenMeters: 300000, sinceKm: 300 },
    ])
  })

  it('FE-ROADTRIP-MODEL-093: a tank carried over midnight runs dry earlier the next day', () => {
    const out = deriveDriveWarnings(
      [drive(60, 200), drive(60, 200)],
      [false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      250,
    )
    // Only 50 km left on arrival, so it empties a quarter into the first leg.
    expect(out.emptyAt).toEqual([
      { legIndex: 0, intoLegKm: 50, drivenMeters: 50000, sinceKm: 300 },
    ])
  })

  it('FE-ROADTRIP-MODEL-094: no range limit and no crossing produce no dry point at all', () => {
    const noLimit = deriveDriveWarnings(
      [drive(60, 900)],
      [false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: null },
      0,
    )
    expect(noLimit.emptyAt).toEqual([])

    const withinRange = deriveDriveWarnings(
      [drive(60, 100)],
      [false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      0,
    )
    expect(withinRange.emptyAt).toEqual([])
  })

  it('FE-ROADTRIP-MODEL-095: an unrouted leg gives the tank up rather than guessing where it ends', () => {
    // The budget goes null and stays null, so there is no honest dry point to offer.
    const out = deriveDriveWarnings(
      [drive(60, 200), undefined, drive(60, 400)],
      [false, false, false, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 300 },
      0,
    )
    expect(out.emptyAt).toEqual([])
    expect(out.carryKm).toBeNull()
  })
})

describe('refuelsRange — what fills which tank', () => {
  it('FE-ROADTRIP-MODEL-096: with no vehicle named, either kind fills up', () => {
    // What TREK did before the setting existed, and the right answer for somebody who
    // never opened the dialog. Anything else would quietly change their warnings.
    expect(refuelsRange('fuel')).toBe(true)
    expect(refuelsRange('charging')).toBe(true)
    expect(refuelsRange('fuel', null)).toBe(true)
    expect(refuelsRange('charging', null)).toBe(true)
  })

  it('FE-ROADTRIP-MODEL-097: a petrol station does not charge a battery', () => {
    // The bug this exists for: an electric car pausing at a petrol station had its
    // battery refilled on paper, the warnings went quiet for the rest of the day, and
    // the driver was told nothing.
    expect(refuelsRange('charging', 'electric')).toBe(true)
    expect(refuelsRange('fuel', 'electric')).toBe(false)
  })

  it('FE-ROADTRIP-MODEL-098: and a charger does not fill a tank', () => {
    expect(refuelsRange('fuel', 'combustion')).toBe(true)
    expect(refuelsRange('charging', 'combustion')).toBe(false)
  })

  it('FE-ROADTRIP-MODEL-099: nothing else refuels anything, whatever is driven', () => {
    for (const vehicle of [null, 'combustion', 'electric'] as const) {
      expect(refuelsRange('rest_area', vehicle)).toBe(false)
      expect(refuelsRange('restaurant', vehicle)).toBe(false)
      expect(refuelsRange(null, vehicle)).toBe(false)
    }
  })

  it('FE-ROADTRIP-MODEL-100: the search looks for what the vehicle actually takes', () => {
    expect(refuelStopTypeFor('combustion')).toEqual(['fuel'])
    expect(refuelStopTypeFor('electric')).toEqual(['charging'])
    expect(refuelStopTypeFor(null)).toEqual(['fuel', 'charging'])
  })
})

describe('deriveDriveWarnings — filling only part way', () => {
  const drive = (minutes: number, km: number) =>
    ({ duration: minutes * 60, distance: km * 1000, mode: 'driving' })

  it('FE-ROADTRIP-MODEL-101: a stop that fills to 80 % leaves a fifth already used', () => {
    // Nobody charges to 100 % on the road: the last fifth takes as long as the first
    // four. Counting a stop as a full tank overstates what comes after it by that fifth.
    const out = deriveDriveWarnings(
      [drive(60, 100), drive(60, 450)],
      [false, true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: 500, fillPercent: 80 },
      0,
    )
    // After the stop the budget restarts at 100 km rather than 0, so the tank is dry
    // 400 km into the second leg. Filled all the way it would have gone the whole 450.
    expect(out.emptyAt).toHaveLength(1)
    expect(out.emptyAt[0]).toMatchObject({ legIndex: 1, intoLegKm: 400 })
  })

  it('FE-ROADTRIP-MODEL-102: filling all the way is what absent, zero and 100 all mean', () => {
    const legs = [drive(60, 100), drive(60, 450)]
    const refuels = [false, true, false]
    const full = { legMinutes: null, dayMinutes: null, rangeKm: 500 }
    for (const fillPercent of [undefined, null, 0, 100]) {
      const out = deriveDriveWarnings(legs, refuels, { ...full, fillPercent }, 0)
      // A full tank after the stop covers the remaining 450 km without a finding.
      expect(out.emptyAt).toEqual([])
      expect(out.warnings).toEqual([])
    }
  })

  it('FE-ROADTRIP-MODEL-103: with no range set, the fill level changes nothing', () => {
    const out = deriveDriveWarnings(
      [drive(60, 900)],
      [true, false],
      { legMinutes: null, dayMinutes: null, rangeKm: null, fillPercent: 50 },
      0,
    )
    expect(out.warnings).toEqual([])
    expect(out.emptyAt).toEqual([])
  })
})
