import { describe, it, expect } from 'vitest'
import {
  computeSchedule,
  formatClock,
  formatDurationShort,
  insertIndexForAlong,
  parseClock,
  splitIntoRuns,
  sumLegSeconds,
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

  it('leaves stops before the first pinned time blank rather than inventing one', () => {
    const { entries } = computeSchedule(
      [
        { anchor: null, dwellMinutes: 60 },
        { anchor: '10:00', dwellMinutes: 30 },
      ],
      [hours(1)],
    )
    expect(entries[0]).toMatchObject({ arrival: null, departure: null })
    expect(entries[1]).toMatchObject({ arrival: '10:00', anchored: true })
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
