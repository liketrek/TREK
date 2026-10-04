import { describe, expect, it } from 'vitest'
import {
  arrivingReroutable,
  bookendReading,
  destinationCount,
  firstStopOfPlace,
  legReroutable,
  movableWithin,
  pickWarning,
  resumeFoldsIntoBookend,
  roadtripRows,
  stageClocks,
  stageEnd,
  stageOf,
  upNextStop,
  type RoadtripRow,
  type StopRow,
} from './roadtripRowModel'
import type { ScheduleEntry, ScheduleWarning } from './roadtripModel'
import type { BookendPhase, NightBookend, RoadtripDay, RoadtripStop, RouteSegment } from '@trek/shared/roadtrip'

// FE-RTROW-001 to FE-RTROW-067

function stop(name: string, over: Partial<RoadtripStop> = {}): RoadtripStop {
  return {
    assignmentId: name.length,
    ownerDayId: 7,
    ownerIndex: 0,
    placeId: 100,
    name,
    lat: 48.1,
    lng: 11.2,
    time: null,
    dwellMinutes: null,
    legMode: null,
    incomingLegMode: null,
    stopType: null,
    ...over,
  }
}

function entry(arrival: string | null, over: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return { arrival, departure: arrival, anchored: false, dayOffset: 0, ...over }
}

function seg(index: number): RouteSegment {
  return {
    mid: [48, 11],
    from: [48, 11],
    to: [49, 12],
    distance: 1000 * (index + 1),
    duration: 600,
    walkingText: '2 h',
    drivingText: '10 min',
    distanceText: `${index + 1} km`,
  }
}

function day(stops: RoadtripStop[], over: Partial<RoadtripDay> = {}): RoadtripDay {
  return {
    dayId: 7,
    dayNumber: 1,
    date: '2026-06-01',
    title: null,
    stops,
    legs: stops.slice(0, -1).map((_, i) => seg(i)),
    schedule: { entries: stops.map(() => entry(null)), warnings: [] },
    legVias: [],
    geometry: [],
    distance: 0,
    duration: 0,
    driveWarnings: [],
    dayWarning: null,
    ...over,
  }
}

const night = (phase: 'start' | 'end' = 'end') =>
  stop('Nacht', { automaticNight: { phase, fromDayNumber: 1 }, dwellMinutes: 480 })

const stopRows = (rows: RoadtripRow[]) => rows.filter((r): r is StopRow => r.kind === 'stop')

/** Ziel, Tankstelle, Ziel, automatische Nacht, Ziel. */
const mixedDay = () =>
  day([stop('Bremen'), stop('Aral', { stopType: 'fuel' }), stop('Kassel'), night(), stop('Fulda')])

describe('roadtripRows numbering', () => {
  it('FE-RTROW-001: only destinations take a number, a service stop and a night do not advance it', () => {
    // Nummerierung ueber den Array-Index machte aus Kassel die drei und aus Fulda die fuenf.
    const numbers = stopRows(roadtripRows(mixedDay())).map((r) => [r.stop.name, r.number])
    expect(numbers).toEqual([
      ['Bremen', 1],
      ['Aral', null],
      ['Kassel', 2],
      ['Fulda', 3],
    ])
  })

  it('FE-RTROW-002: the service stop is a stop row, the automatic night is not', () => {
    const rows = roadtripRows(mixedDay())
    expect(rows.map((r) => r.kind)).toEqual(['stop', 'leg', 'stop', 'leg', 'stop', 'leg', 'auto', 'leg', 'stop'])
    expect(stopRows(rows).map((r) => r.stop.name)).not.toContain('Nacht')
  })

  it('FE-RTROW-040: the placeholder leg into an automatic night is not a row at all', () => {
    // `dayWindow.stationary()` puts one of these between the last stop of a day and the
    // night that closes it: same coordinate at both ends, nothing measured. It is
    // bookkeeping, not a drive, and as a pill it read "No route" under a stop the
    // traveller had simply arrived at (and, before that was guarded, a bare " in ").
    const stops = [stop('Hamburg'), night()]
    const at: [number, number] = [53.54, 10.01]
    const stationary: RouteSegment = {
      mid: at, from: at, to: at, distance: 0, duration: 0,
      walkingText: '', drivingText: '', distanceText: '',
    }
    const rows = roadtripRows(day(stops, { legs: [stationary] }))

    expect(rows.map((r) => r.kind)).toEqual(['stop', 'auto'])
  })

  it('FE-RTROW-041: a night the traveller drove to keeps its leg', () => {
    // A boundary dragged down the road ends the day somewhere else, and that IS a drive.
    const stops = [stop('Hamburg'), night()]
    const rows = roadtripRows(day(stops, { legs: [seg(0)] }))

    expect(rows.map((r) => r.kind)).toEqual(['stop', 'leg', 'auto'])
  })

  it('FE-RTROW-042: a leg nothing has routed yet still gets its row, so it can say it is pending', () => {
    const stops = [stop('Hamburg'), stop('Bremen')]
    const rows = roadtripRows(day(stops, { legs: [undefined] }))

    expect(rows.map((r) => r.kind)).toEqual(['stop', 'leg', 'stop'])
  })

  it('FE-RTROW-003: the automatic night carries no dwell and takes its time from the schedule', () => {
    // Die Nacht traegt dwellMinutes 480, aber keine Zeile, die eine Aufenthaltsdauer zeigen koennte.
    const rows = roadtripRows(
      day([stop('Kassel'), night(), stop('Fulda')], {
        schedule: { entries: [entry('18:00'), entry('22:30'), entry('09:15')], warnings: [] },
      }),
    )
    expect(rows.find((r) => r.kind === 'auto')).toEqual({ kind: 'auto', phase: 'end', time: '22:30' })
    expect(JSON.stringify(rows)).not.toContain('480')
  })

  it('FE-RTROW-004: a night that starts a day resumes it, anything else ends it', () => {
    expect(roadtripRows(day([night('start'), stop('Fulda')])).find((r) => r.kind === 'auto')).toMatchObject({
      phase: 'resume',
    })
    expect(roadtripRows(day([night('end'), stop('Fulda')])).find((r) => r.kind === 'auto')).toMatchObject({
      phase: 'end',
    })
  })

  it('FE-RTROW-005: exactly one leg between two stops and none after the last', () => {
    const rows = roadtripRows(day([stop('A'), stop('B'), stop('C')]))
    expect(rows.filter((r) => r.kind === 'leg')).toEqual([
      { kind: 'leg', index: 0, seg: seg(0), mode: null },
      { kind: 'leg', index: 1, seg: seg(1), mode: null },
    ])
    expect(rows[rows.length - 1].kind).toBe('stop')
  })

  it('FE-RTROW-006: a leg is driven in the next stop incoming mode, else in this one own', () => {
    const rows = roadtripRows(
      day([
        stop('A', { legMode: 'car' }),
        stop('B', { incomingLegMode: 'ferry', legMode: 'train' }),
        stop('C'),
        stop('D'),
      ]),
    )
    const modes = rows.flatMap((r) => (r.kind === 'leg' ? [r.mode] : []))
    expect(modes).toEqual(['ferry', 'train', null])
  })
})

describe('roadtripRows dry points and spills', () => {
  it('FE-RTROW-007: a dry point makes one row, directly after the leg it falls on', () => {
    const rows = roadtripRows(
      day([stop('A'), stop('B'), stop('C')], {
        dryPoints: [{ legIndex: 1, intoLegKm: 42, sinceKm: 610, drivenMeters: 42000, lat: 48, lng: 11 }],
      }),
    )
    expect(rows.map((r) => r.kind)).toEqual(['stop', 'leg', 'stop', 'leg', 'dry', 'stop'])
    expect(rows[4]).toEqual({ kind: 'dry', legIndex: 1, intoLegKm: 42, sinceKm: 610 })
  })

  it('FE-RTROW-008: a dry point past the last leg is not drawn', () => {
    // Nach dem letzten Stopp gibt es kein Bein, an dem die Warnung haengen koennte.
    const rows = roadtripRows(
      day([stop('A'), stop('B')], {
        dryPoints: [{ legIndex: 1, intoLegKm: 5, sinceKm: 600, drivenMeters: 5000, lat: 48, lng: 11 }],
      }),
    )
    expect(rows.some((r) => r.kind === 'dry')).toBe(false)
  })

  it('FE-RTROW-009: a spill sits before the stop it hangs on, with the day it came from', () => {
    const rows = roadtripRows(
      day([stop('A'), stop('B')], {
        spills: [
          { at: 1, count: 1, fromDayNumber: 3, departure: '23:40', leg: undefined, fromStop: undefined, line: [] },
        ],
      }),
    )
    expect(rows.map((r) => r.kind)).toEqual(['stop', 'leg', 'spill', 'stop'])
    expect(rows[2]).toEqual({ kind: 'spill', fromDayNumber: 3, departs: '23:40', stops: [] })
  })
})

describe('roadtripRows stop detail', () => {
  it('FE-RTROW-010: the clock and the pin come from the schedule entry', () => {
    const rows = stopRows(
      roadtripRows(
        day([stop('A'), stop('B'), stop('C')], {
          schedule: {
            entries: [entry('08:00'), entry('09:40', { departure: '10:10', anchored: true }), entry(null)],
            warnings: [],
          },
        }),
      ),
    )
    expect(rows.map((r) => [r.time, r.pinned])).toEqual([
      ['08:00', false],
      ['09:40', true],
      [null, false],
    ])
    expect(rows[1].entry?.departure).toBe('10:10')
  })

  it('FE-RTROW-011: a stop shows only its own findings, and only the strongest of them', () => {
    // Where each finding really comes from: being late from the schedule, the drive's
    // limits from `driveWarnings`.
    const rows = stopRows(
      roadtripRows(
        day([stop('A'), stop('B')], {
          driveWarnings: [
            { index: 0, code: 'overnight' },
            { index: 1, code: 'leg', overMinutes: 20 },
          ],
          schedule: { entries: [entry(null), entry(null)], warnings: [{ index: 1, code: 'late', minutes: 15 }] },
        }),
      ),
    )
    expect(rows[0].warning).toEqual({ index: 0, code: 'overnight' })
    expect(rows[1].warning).toEqual({ index: 1, code: 'late', minutes: 15 })
  })

  it('FE-RTROW-067: being late, or leaving after the time set, reaches the row from the schedule, a terminal\'s included', () => {
    const terminal = stop('HAM', {
      carrier: { reservationId: 78, type: 'flight', role: 'departure', title: 'LH 2078', code: 'HAM', at: '15:15' },
    })
    const rows = stopRows(
      roadtripRows(
        day([stop('A'), stop('B'), terminal], {
          schedule: {
            entries: [entry('09:00'), entry('10:00'), entry('14:15')],
            warnings: [
              { index: 1, code: 'missedLeave', minutes: 20 },
              { index: 2, code: 'late', minutes: 579 },
              // Only the lateness is read from the schedule, not the day it changes on.
              { index: 0, code: 'overnight' },
            ],
          },
        }),
      ),
    )
    expect(rows.map(r => r.warning)).toEqual([
      null,
      { index: 1, code: 'missedLeave', minutes: 20 },
      { index: 2, code: 'late', minutes: 579 },
    ])
  })

  it('FE-RTROW-012: dwell and the walk in from the road pass through, absent means null', () => {
    const rows = stopRows(roadtripRows(day([stop('A', { dwellMinutes: 90, offRoadMeters: 240 }), stop('B')])))
    expect([rows[0].dwellMinutes, rows[0].offRoadMeters]).toEqual([90, 240])
    expect([rows[1].dwellMinutes, rows[1].offRoadMeters]).toEqual([null, null])
  })
})

describe('pickWarning', () => {
  it('FE-RTROW-013: late beats range beats leg beats overnight', () => {
    const all: ScheduleWarning[] = [
      { index: 0, code: 'overnight' },
      { index: 0, code: 'leg', overMinutes: 30 },
      { index: 0, code: 'range', sinceKm: 700 },
      { index: 0, code: 'late', minutes: 20 },
    ]
    expect(pickWarning(all)?.code).toBe('late')
    expect(pickWarning(all.slice(0, 3))?.code).toBe('range')
    expect(pickWarning(all.slice(0, 2))?.code).toBe('leg')
    expect(pickWarning(all.slice(0, 1))?.code).toBe('overnight')
  })

  it('FE-RTROW-028: the order the findings arrive in does not decide', () => {
    // Sonst haengt die Marke davon ab, in welcher Reihenfolge deriveDriveWarnings sie anhaengt.
    const all: ScheduleWarning[] = [
      { index: 0, code: 'late', minutes: 20 },
      { index: 0, code: 'range', sinceKm: 700 },
      { index: 0, code: 'overnight' },
    ]
    expect(pickWarning(all)?.code).toBe('late')
    expect(pickWarning([...all].reverse())?.code).toBe('late')
  })

  it('FE-RTROW-014: nothing to report is null, not a placeholder', () => {
    expect(pickWarning([])).toBeNull()
  })

  it('FE-RTROW-043: missing the time a stop is left at ranks right after being late for it', () => {
    const missed: ScheduleWarning = { index: 0, code: 'missedLeave', minutes: 30 }
    expect(pickWarning([{ index: 0, code: 'range', sinceKm: 700 }, missed])).toBe(missed)
    expect(pickWarning([missed, { index: 0, code: 'late', minutes: 5 }])?.code).toBe('late')
  })
})

describe('a stop left at a set time', () => {
  it('FE-RTROW-044: its row carries the stay the time makes, not the one the place has', () => {
    const d = day([stop('A'), stop('Bremen', { dwellMinutes: 30, leaveAt: '14:00' })], {
      schedule: { entries: [entry('09:00'), entry('10:00', { departure: '14:00' })], warnings: [] },
    })
    const [, bremen] = stopRows(roadtripRows(d))
    expect(bremen.dwellMinutes).toBe(240)
    expect(bremen.departure).toBe('14:00')
  })
})

describe('stageOf', () => {
  const days = [day([stop('A')], { dayId: 11, dayNumber: 1 }), day([stop('B')], { dayId: 22, dayNumber: 2 })]

  it('FE-RTROW-015: finds the day by its id, not by its position', () => {
    expect(stageOf(days, 22)?.dayNumber).toBe(2)
  })

  it('FE-RTROW-016: no selection and an id that is gone both give null', () => {
    expect(stageOf(days, null)).toBeNull()
    expect(stageOf(days, 999)).toBeNull()
    expect(stageOf([], 11)).toBeNull()
  })
})

describe('destinationCount', () => {
  it('FE-RTROW-017: agrees with the highest number the rows handed out', () => {
    const d = mixedDay()
    const highest = stopRows(roadtripRows(d)).reduce((max, r) => Math.max(max, r.number ?? 0), 0)
    expect(destinationCount(d)).toBe(3)
    expect(destinationCount(d)).toBe(highest)
  })

  it('FE-RTROW-018: a day of nothing but services and nights counts none', () => {
    expect(destinationCount(day([stop('Aral', { stopType: 'fuel' }), night()]))).toBe(0)
  })
})

const timedDay = (arrivals: (string | null)[], stops: RoadtripStop[]) =>
  day(stops, { schedule: { entries: arrivals.map((a) => entry(a)), warnings: [] } })

describe('upNextStop', () => {
  const threeStops = () =>
    timedDay(['09:00', '11:00', '13:00'], [stop('A'), stop('Aral', { stopType: 'fuel' }), stop('C')])

  it('FE-RTROW-019: says nothing on a day that is not today, and nothing without a day', () => {
    expect(upNextStop(threeStops(), 10 * 60, false)).toBeNull()
    expect(upNextStop(null, 10 * 60, true)).toBeNull()
  })

  it('FE-RTROW-020: passes over the petrol stop and names the next destination', () => {
    // Die Tankstelle um 11:00 liegt vor dem Ziel um 13:00 und ist trotzdem nie das naechste.
    const next = upNextStop(threeStops(), 10 * 60, true)
    expect(next?.row.stop.name).toBe('C')
    expect(next?.minutesUntil).toBe(180)
  })

  it('FE-RTROW-021: a stop without a readable time is passed over', () => {
    const d = timedDay([null, 'irgendwann', '13:00'], [stop('A'), stop('B'), stop('C')])
    expect(upNextStop(d, 8 * 60, true)?.row.stop.name).toBe('C')
  })

  it('FE-RTROW-022: a stop due this very minute is still ahead', () => {
    expect(upNextStop(threeStops(), 13 * 60, true)?.minutesUntil).toBe(0)
  })

  it('FE-RTROW-023: a stop whose time has just passed comes back as a delay', () => {
    // Es gibt keine Positionsquelle, also ist "der Plan sagte 13:00, es ist 13:20"
    // die staerkste ehrliche Aussage. Sie kommt als negatives minutesUntil.
    expect(upNextStop(threeStops(), 13 * 60 + 20, true)?.minutesUntil).toBe(-20)
  })

  it('FE-RTROW-024: an hour past the last stop the day is over and nothing is next', () => {
    expect(upNextStop(threeStops(), 14 * 60 + 1, true)).toBeNull()
  })

  it('FE-RTROW-025: a delay is only ever reported for the last stop, never a passed one', () => {
    // 09:00 ist lange vorbei, 13:00 auch, gemeldet wird der Verzug auf den letzten.
    const late = upNextStop(threeStops(), 13 * 60 + 30, true)
    expect(late?.row.stop.name).toBe('C')
    expect(late?.minutesUntil).toBe(-30)
  })

  it('FE-RTROW-026: another day, no day and a day without any clock name nothing', () => {
    expect(upNextStop(timedDay(['09:00'], [stop('A')]), 12 * 60, false)).toBeNull()
    expect(upNextStop(null, 12 * 60, true)).toBeNull()
    expect(upNextStop(timedDay([null], [stop('A')]), 12 * 60, true)).toBeNull()
    expect(upNextStop(timedDay(['nachmittags'], [stop('A')]), 12 * 60, true)).toBeNull()
  })

  it('FE-RTROW-027: a service stop is never the one named, even when it is next in line', () => {
    // Die Tankstelle um 10:00 laege vorne, genannt wird trotzdem das Ziel um 11:00.
    const d = timedDay(['09:00', '10:00', '11:00'], [stop('A'), stop('Aral', { stopType: 'fuel' }), stop('B')])
    expect(upNextStop(d, 9 * 60 + 30, true)?.row.stop.name).toBe('B')
  })
})

describe('stageClocks', () => {
  it('FE-RTROW-029: starts at the first stop arrival and arrives at the last one, neither departure', () => {
    // The reported stage: a pin at 10:00 with an hour and a half there headed the card as
    // 11:30, a clock no row prints. The last stop leaves at 21:33, which is not an arrival either.
    const d = day([stop('Hamburg Speicherstadt', { dwellMinutes: 90, time: '10:00' }), stop('Sanssouci', { dwellMinutes: 120 })], {
      schedule: {
        entries: [entry('10:00', { departure: '11:30', anchored: true }), entry('19:33', { departure: '21:33' })],
        warnings: [],
      },
    })
    const clocks = stageClocks(roadtripRows(d))
    expect(clocks).toEqual({ start: '10:00', arrive: '19:33' })
    expect(Object.values(clocks)).not.toContain('11:30')
    expect(Object.values(clocks)).not.toContain('21:33')
  })

  it('FE-RTROW-030: a morning after an automatic night starts at the resume point, and a day end point arrives nowhere', () => {
    const d = day([night('start'), stop('Fulda'), stop('Kassel'), night('end')], {
      schedule: { entries: [entry('08:00'), entry('09:10', { departure: '10:00' }), entry('12:40'), entry('22:00')], warnings: [] },
    })
    expect(stageClocks(roadtripRows(d))).toEqual({ start: '08:00', arrive: '12:40' })
  })

  it('FE-RTROW-031: a spill band departure belongs to the day before and does not start this one', () => {
    const d = day([stop('A'), stop('B')], {
      spills: [{ at: 0, count: 1, fromDayNumber: 1, departure: '23:10', leg: undefined, fromStop: undefined, line: [] }],
      schedule: { entries: [entry('00:40'), entry('02:00')], warnings: [] },
    })
    expect(stageClocks(roadtripRows(d))).toEqual({ start: '00:40', arrive: '02:00' })
  })

  it('FE-RTROW-032: untimed stops are skipped at both ends, deliberately, and a day with no clock at all gives nulls', () => {
    // Skipping rather than dashing is a choice: a day whose first leg has no route yet still
    // has one clock worth heading the card with, even when start and arrival are that one.
    const partly = timedDay([null, '11:00', null], [stop('A'), stop('B'), stop('C')])
    expect(stageClocks(roadtripRows(partly))).toEqual({ start: '11:00', arrive: '11:00' })

    const untimed = timedDay([null, null], [stop('A'), stop('B')])
    expect(stageClocks(roadtripRows(untimed))).toEqual({ start: null, arrive: null })
    expect(stageClocks([])).toEqual({ start: null, arrive: null })

    // A petrol stop is a place you drive to, so its arrival counts like any other.
    const fuelFirst = timedDay(['07:50', '09:00'], [stop('Aral', { stopType: 'fuel' }), stop('B')])
    expect(stageClocks(roadtripRows(fuelFirst))).toEqual({ start: '07:50', arrive: '09:00' })
  })

  it('FE-RTROW-033: follows the row order rather than the clock, for a missed pin and for an unsplit card past midnight', () => {
    // A pin the drive cannot make keeps its own clock, so the last row can read earlier
    // than the one above it. The arrival is still that last row's clock, not the latest one.
    const missed = timedDay(
      ['11:00', '10:00'],
      [stop('Harbour', { dwellMinutes: 60, time: '11:00' }), stop('Ferry', { time: '10:00' })],
    )
    expect(stageClocks(roadtripRows(missed))).toEqual({ start: '11:00', arrive: '10:00' })

    // When a daily window cannot be kept, each stored day is timed on its own and never
    // split: an evening stay can then head a card that ends on a pin the next morning. The
    // figures still name the first and the last clock the chain prints.
    const unsplit = timedDay(['18:30', '10:00'], [stop('Hotel', { dwellMinutes: 900 }), stop('Museum')])
    expect(stageClocks(roadtripRows(unsplit))).toEqual({ start: '18:30', arrive: '10:00' })
  })
})

describe('stageEnd', () => {
  it('FE-RTROW-034: names the last stop the chain draws with its own arrival, not the automatic day end after it', () => {
    // The reported bar: Kyoto Station reached at 12:40 sat beside 22:00, where the window closed.
    const d = day([stop('Bremen'), stop('Aral', { stopType: 'fuel' }), stop('Kyoto Station'), night()], {
      schedule: { entries: [entry('09:00'), entry('10:30'), entry('12:40'), entry('22:00')], warnings: [] },
    })
    const end = stageEnd(roadtripRows(d))
    expect(end?.stop.name).toBe('Kyoto Station')
    expect(end?.time).toBe('12:40')

    // A service stop is still a stop the drive ends at, so it is the one named.
    const fuelLast = timedDay(['09:00', '11:00'], [stop('A'), stop('Aral', { stopType: 'fuel' })])
    expect(stageEnd(roadtripRows(fuelLast))?.stop.name).toBe('Aral')
  })

  it('FE-RTROW-035: a stage drawn with nothing but its night markers, and no rows at all, end nowhere', () => {
    expect(stageEnd(roadtripRows(day([night('start'), night('end')])))).toBeNull()
    expect(stageEnd([])).toBeNull()
  })
})

describe('firstStopOfPlace', () => {
  it('FE-RTROW-036: on one card, a place visited twice answers with its first visit and a night on it never does', () => {
    // A loop day: out of the hotel in the morning, back to it at night.
    const loop = day([
      stop('Nacht', { placeId: 300, assignmentId: 90, automaticNight: { phase: 'start', fromDayNumber: 1 } }),
      stop('Hotel', { placeId: 300, assignmentId: 1 }),
      stop('Museum', { placeId: 301, assignmentId: 2 }),
      stop('Hotel', { placeId: 300, assignmentId: 3 }),
    ])
    expect(firstStopOfPlace([loop], 300)?.assignmentId).toBe(1)
    expect(firstStopOfPlace([loop], 301)?.assignmentId).toBe(2)
  })

  it('FE-RTROW-037: across days it keeps day order, a card handed alone ignores the days before it, and no stop gives null', () => {
    const monday = day([stop('Town', { placeId: 301, assignmentId: 11 })], { dayId: 7 })
    const tuesday = day([stop('Town', { placeId: 301, assignmentId: 21 }), stop('Lake', { placeId: 302, assignmentId: 22 })], { dayId: 8 })
    expect(firstStopOfPlace([monday, tuesday], 301)?.assignmentId).toBe(11)
    expect(firstStopOfPlace([tuesday], 301)?.assignmentId).toBe(21)
    expect(firstStopOfPlace([monday, tuesday], 302)?.assignmentId).toBe(22)

    expect(firstStopOfPlace([monday, tuesday], 999)).toBeNull()
    expect(firstStopOfPlace([], 301)).toBeNull()
    // Only an automatic night sits on this position, which is not a stop anybody chose.
    expect(firstStopOfPlace([day([stop('Nacht', { placeId: 303, automaticNight: { phase: 'end', fromDayNumber: 1 } })])], 303)).toBeNull()
  })
})

describe('legReroutable', () => {
  it('FE-RTROW-038: a routed leg between two stops anybody chose can be offered other ways, a service stop included', () => {
    const d = day([stop('Bremen'), stop('Aral', { stopType: 'fuel' }), stop('Kassel')])
    expect(legReroutable(d, 0)).toBe(true)
    expect(legReroutable(d, 1)).toBe(true)
  })

  it('FE-RTROW-039: no leg into or out of an automatic night, none without a route, none past either end', () => {
    // Bremen, Kassel, automatic night, Fulda: the rail offers the first leg only.
    const withNight = day([stop('Bremen'), stop('Kassel'), night(), stop('Fulda')])
    expect(legReroutable(withNight, 0)).toBe(true)
    // Into the marker where the window closed, and out of it again the morning after.
    expect(legReroutable(withNight, 1)).toBe(false)
    expect(legReroutable(withNight, 2)).toBe(false)
    expect(legReroutable(day([night('start'), stop('Fulda')]), 0)).toBe(false)

    // A leg the router has not answered for yet has nothing to weigh an offer against.
    const unrouted = day([stop('A'), stop('B'), stop('C')], { legs: [seg(0)] })
    expect(legReroutable(unrouted, 0)).toBe(true)
    expect(legReroutable(unrouted, 1)).toBe(false)

    // The last stop has no leg after it, whatever the legs array happens to hold.
    const extra = day([stop('A'), stop('B')], { legs: [seg(0), seg(1)] })
    expect(legReroutable(extra, 1)).toBe(false)
    expect(legReroutable(extra, -1)).toBe(false)
  })
})

describe('roadtripRows with a ride (#2428)', () => {
  const terminal = (name: string, role: 'departure' | 'arrival', at: string | null = '13:20') =>
    stop(name, {
      assignmentId: role === 'departure' ? -3000000014 : -3000000015,
      placeId: -7,
      carrier: { reservationId: 7, type: 'flight', role, title: 'LH 2020', code: role === 'departure' ? 'MUC' : 'HAM', at },
      legMode: role === 'departure' ? 'flight' : null,
      incomingLegMode: role === 'arrival' ? 'flight' : null,
    })
  const ride: RouteSegment = { ...seg(9), distance: 0, duration: 4200, mode: 'flight', distanceText: '', durationText: '1 h 10 min' }
  const flightDay = () =>
    day([stop('Bremen'), terminal('Munich Airport', 'departure'), terminal('Hamburg Airport', 'arrival', '14:30'), stop('Hotel')], {
      legs: [seg(0), ride, seg(2)],
    })

  it('FE-RTROW-045: a same-day ride is one row holding both terminals, unnumbered, and the numbering skips them', () => {
    const rows = roadtripRows(flightDay())
    expect(stopRows(rows).map(r => [r.stop.name, r.number])).toEqual([
      ['Bremen', 1],
      ['Hotel', 2],
    ])
    const rideRow = rows.find(r => r.kind === 'ride')
    expect(rideRow?.kind === 'ride' && [rideRow.departure.stop.name, rideRow.departure.number, rideRow.arrival.stop.name, rideRow.arrival.number])
      .toEqual(['Munich Airport', null, 'Hamburg Airport', null])
    expect(destinationCount(flightDay())).toBe(2)
  })

  it('FE-RTROW-046: the ride row stands where the departure stood and carries the booking; the road out of the arrival follows it as a leg', () => {
    const rows = roadtripRows(flightDay())
    expect(rows.map(r => r.kind)).toEqual(['stop', 'leg', 'ride', 'leg', 'stop'])
    const rideRow = rows[2]
    expect(rideRow.kind === 'ride' && rideRow.carrier.title).toBe('LH 2020')
    expect(rideRow.kind === 'ride' && rideRow.seg).toBe(ride)
    expect(rideRow.kind === 'ride' && rideRow.arrival.time).toBe(rideRow.kind === 'ride' ? rideRow.arrival.entry?.arrival ?? null : null)
    // The leg after the ride is the arrival's, at the arrival's index.
    expect(rows[3]).toMatchObject({ kind: 'leg', index: 2 })
  })

  it('FE-RTROW-049: a ride landing tomorrow leaves its departure as a lone stop row, and the arrival opens the next day as one', () => {
    const rows = roadtripRows(day([stop('Bremen'), terminal('Munich Airport', 'departure')], { legs: [seg(0)] }))
    expect(rows.map(r => r.kind)).toEqual(['stop', 'leg', 'stop'])
    const landing = roadtripRows(day([terminal('Hamburg Airport', 'arrival', '07:00'), stop('Hotel')], { legs: [seg(0)] }))
    expect(landing.map(r => r.kind)).toEqual(['stop', 'leg', 'stop'])
    expect(stopRows(landing).map(r => [r.stop.name, r.number])).toEqual([['Hamburg Airport', null], ['Hotel', 1]])
  })

  it('FE-RTROW-051: a hop, the desk beside the terminal, is no leg row and is offered no other ways', () => {
    const hop: RouteSegment = { ...seg(0), distance: 120, duration: 45, distanceText: '0 km', durationText: '0 min' }
    const d = day([stop('Sixt Airport'), stop('Hamburg Airport'), stop('Hotel')], { legs: [hop, seg(1)] })
    expect(roadtripRows(d).map(r => r.kind)).toEqual(['stop', 'stop', 'leg', 'stop'])
    expect(legReroutable(d, 0)).toBe(false)
    expect(legReroutable(d, 1)).toBe(true)
    // A note a plugin attached keeps the row, however short the hop.
    const noted = day([stop('A'), stop('B')], { legs: [{ ...hop, noteText: '10 min charge' }] })
    expect(roadtripRows(noted).map(r => r.kind)).toEqual(['stop', 'leg', 'stop'])
  })

  it('FE-RTROW-050: a hire car\'s desks are unnumbered stop rows the road runs through', () => {
    const desk = (name: string, role: 'pickup' | 'return') =>
      stop(name, {
        assignmentId: role === 'pickup' ? -3000000018 : -3000000019,
        placeId: -9,
        carrier: { reservationId: 9, type: 'car', role, title: 'Sixt', code: null, at: '09:00' },
      })
    const rows = roadtripRows(day([desk('Sixt Hbf', 'pickup'), stop('Bremen'), desk('Sixt Airport', 'return')], { legs: [seg(0), seg(1)] }))
    expect(rows.map(r => r.kind)).toEqual(['stop', 'leg', 'stop', 'leg', 'stop'])
    expect(stopRows(rows).map(r => [r.stop.name, r.number])).toEqual([['Sixt Hbf', null], ['Bremen', 1], ['Sixt Airport', null]])
    const d = day([desk('Sixt Hbf', 'pickup'), stop('Bremen'), desk('Sixt Airport', 'return')], { legs: [seg(0), seg(1)] })
    expect(legReroutable(d, 0)).toBe(false)
    expect(legReroutable(d, 1)).toBe(true)
  })

  it('FE-RTROW-047: the road into a departure terminal can be offered other ways, nothing leaving a terminal can', () => {
    const d = flightDay()
    expect(legReroutable(d, 0)).toBe(true)
    expect(legReroutable(d, 1)).toBe(false)
    expect(legReroutable(d, 2)).toBe(false)
  })

  it('FE-RTROW-048: a terminal never answers for a place, however its id reads', () => {
    expect(firstStopOfPlace([flightDay()], -7)).toBeNull()
    expect(firstStopOfPlace([flightDay()], 100)?.name).toBe('Bremen')
  })

  /** Bremen at 09:00, the airport at 12:20 for a 13:20 flight, landing at 14:30, nothing after. */
  const endsOnRide = () =>
    day([stop('Bremen'), terminal('Munich Airport', 'departure'), terminal('Hamburg Airport', 'arrival', '14:30')], {
      legs: [seg(0), ride],
      schedule: { entries: [entry('09:00'), entry('12:20', { departure: '13:20' }), entry('14:30')], warnings: [] },
    })
  /** The flight first, the hotel after it. */
  const opensOnRide = () =>
    day([terminal('Munich Airport', 'departure', '06:00'), terminal('Hamburg Airport', 'arrival', '07:10'), stop('Hotel')], {
      legs: [ride, seg(1)],
      schedule: { entries: [entry('05:00', { departure: '06:00' }), entry('07:10'), entry('09:00')], warnings: [] },
    })

  it('FE-RTROW-052: a day that ends on a ride arrives at the arrival terminal, one that opens on a ride starts at the departure', () => {
    // The head card printed the clock of the stop before the flight as where the day ends,
    // while the ride block right below it printed the landing.
    expect(stageClocks(roadtripRows(endsOnRide()))).toEqual({ start: '09:00', arrive: '14:30' })
    expect(stageClocks(roadtripRows(opensOnRide()))).toEqual({ start: '05:00', arrive: '09:00' })
  })

  it('FE-RTROW-053: a day that is nothing but a ride still has both clocks', () => {
    const rideOnly = day([terminal('Munich Airport', 'departure'), terminal('Hamburg Airport', 'arrival', '14:30')], {
      legs: [ride],
      schedule: { entries: [entry('12:20', { departure: '13:20' }), entry('14:30')], warnings: [] },
    })
    expect(stageClocks(roadtripRows(rideOnly))).toEqual({ start: '12:20', arrive: '14:30' })
  })

  it('FE-RTROW-054: up next names the departure terminal before its check-in, and the arrival after take-off', () => {
    // A lone terminal (a ride landing tomorrow) was already a candidate; the terminals
    // inside a same-day ride were not, so the countdown skipped the airport.
    expect(upNextStop(endsOnRide(), 10 * 60, true)?.row.stop.name).toBe('Munich Airport')
    expect(upNextStop(endsOnRide(), 10 * 60, true)?.minutesUntil).toBe(140)
    expect(upNextStop(endsOnRide(), 13 * 60 + 30, true)?.row.stop.name).toBe('Hamburg Airport')
    expect(upNextStop(endsOnRide(), 15 * 60 + 1, true)?.minutesUntil).toBe(-31)
  })

  it('FE-RTROW-055: a stage that ends on a ride ends at its arrival terminal', () => {
    const end = stageEnd(roadtripRows(endsOnRide()))
    expect(end?.stop.name).toBe('Hamburg Airport')
    expect(end?.time).toBe('14:30')
    expect(stageEnd(roadtripRows(opensOnRide()))?.stop.name).toBe('Hotel')
  })
})

describe('the drive in from the day before (#2461)', () => {
  /** Where yesterday ended: stored on day 6, its third stop, and drawn on no stop of this card. */
  const yesterday = stop('Lüneburg', { ownerDayId: 6, ownerIndex: 2, legMode: null })
  const drive: RouteSegment = { ...seg(4), distance: 120_000, duration: 5_400 }
  /** A card joined to the one before it, with the drive and the line it is drawn on. */
  const joined = (over: Partial<RoadtripDay> = {}) => day([stop('Berlin', { incomingLegMode: 'driving' }), stop('Potsdam')], {
    arrivingLeg: drive,
    arrivingFrom: yesterday,
    arrivingLine: [[53.2, 10.4], [52.5, 13.4]],
    ...over,
  })

  it('FE-RTROW-056: heads the card with a row of its own that names where it leaves, and counts no stop for it', () => {
    const rows = roadtripRows(joined())
    expect(rows.map(r => r.kind)).toEqual(['arriving', 'stop', 'leg', 'stop'])
    expect(rows[0]).toMatchObject({ kind: 'arriving', seg: drive, from: { name: 'Lüneburg' }, mode: 'driving' })
    // Still two stops, numbered from one: the stop it leaves is not on this card.
    expect(stopRows(rows).map(r => r.number)).toEqual([1, 2])
    expect(destinationCount(joined())).toBe(2)
    expect(stageClocks(rows)).toEqual(stageClocks(roadtripRows(joined({ arrivingLeg: undefined }))))
    expect(stageEnd(rows)?.stop.name).toBe('Potsdam')
  })

  it('FE-RTROW-057: no row for a hop, a ride, or a drive whose start the card was not told', () => {
    const hop: RouteSegment = { ...seg(0), distance: 80, duration: 60 }
    const ride: RouteSegment = { ...seg(0), distance: 0, duration: 9 * 3600, mode: 'flight' }
    for (const over of [{ arrivingLeg: hop }, { arrivingLeg: ride }, { arrivingFrom: undefined }, { arrivingLeg: undefined }]) {
      expect(roadtripRows(joined(over)).map(r => r.kind)).toEqual(['stop', 'leg', 'stop'])
    }
  })

  it('FE-RTROW-058: other ways are offered on it exactly where a leg would be offered them', () => {
    expect(arrivingReroutable(joined())).toBe(true)
    // Nothing to offer against: no drive, no line, no stop it leaves or reaches.
    expect(arrivingReroutable(joined({ arrivingLeg: undefined }))).toBe(false)
    expect(arrivingReroutable(joined({ arrivingLine: undefined }))).toBe(false)
    expect(arrivingReroutable(joined({ arrivingFrom: undefined }))).toBe(false)
    expect(arrivingReroutable(joined({ stops: [] }))).toBe(false)
    // A ride has no other way, and a hop is nothing to weigh.
    expect(arrivingReroutable(joined({ arrivingLeg: { ...drive, mode: 'train' } }))).toBe(false)
    expect(arrivingReroutable(joined({ arrivingLeg: { ...drive, distance: 80, duration: 60 } }))).toBe(false)
    // A terminal leaves nothing a via can be filed behind.
    const terminal = stop('Hamburg Airport', { carrier: { reservationId: 7, type: 'flight', role: 'arrival', title: 'LH 2020', code: null, at: '07:00' } })
    expect(arrivingReroutable(joined({ arrivingFrom: terminal }))).toBe(false)
    // An automatic night at either end is a marker on the road, not a stop anybody chose.
    expect(arrivingReroutable(joined({ arrivingFrom: night() }))).toBe(false)
    expect(arrivingReroutable(joined({ stops: [night('start'), stop('Potsdam')] }))).toBe(false)
  })
})

describe('a booked night at the edge of the day', () => {
  const reading = (phase: BookendPhase, over: Partial<NightBookend> = {}): NightBookend => ({
    phase,
    accommodationId: 5,
    reservationId: 41,
    checkingOut: false,
    checkingIn: false,
    checkOut: null,
    ...over,
  })
  const hotel = (phase: BookendPhase, over: Partial<NightBookend> = {}, at: Partial<RoadtripStop> = {}) =>
    stop('Hotel Alpenblick', {
      assignmentId: phase === 'morning' ? -6_000_000_014 : -6_000_000_015,
      placeId: 900,
      lat: 45,
      lng: 7,
      stopType: 'hotel',
      dwellMinutes: 0,
      bookend: reading(phase, over),
      ...at,
    })
  /** From the hotel, two places, back to the hotel, each with a clock. */
  const loop = (over: Partial<RoadtripDay> = {}) => {
    const stops = [
      hotel('morning'),
      stop('Lookout', { placeId: 1 }),
      stop('Falls', { placeId: 2, ownerIndex: 1 }),
      hotel('evening', {}, { ownerIndex: 2 }),
    ]
    return day(stops, {
      schedule: { entries: [entry('08:40'), entry('09:30'), entry('11:00'), entry('12:10')], warnings: [] },
      ...over,
    })
  }

  it('FE-RTROW-059: reads as a check-out, a morning, an evening back or a check-in', () => {
    const out = day([hotel('morning', { checkingOut: true, checkOut: '10:00' }), stop('Zoo')])
    expect(bookendReading(out, 0)).toEqual({
      phase: 'morning',
      variant: 'checkOut',
      name: 'Hotel Alpenblick',
      until: '10:00',
      from: null,
      reservationId: 41,
      accommodationId: 5,
      placeId: 900,
    })
    expect(bookendReading(loop(), 0)).toMatchObject({ variant: 'from', until: null })
    expect(bookendReading(loop(), 3)).toMatchObject({ variant: 'back', phase: 'evening' })
    // The check-in day: back when the stay's own stop heads the card, a check-in without it.
    const stayed = day([stop('Hotel Alpenblick', { lat: 45, lng: 7, night: true }), stop('Lookout'), hotel('evening', { checkingIn: true })])
    expect(bookendReading(stayed, 2)?.variant).toBe('back')
    const transfer = day([hotel('morning', { checkingOut: true }), hotel('evening', { checkingIn: true }, { name: 'Wallinga', lat: 46 })])
    expect(bookendReading(transfer, 1)).toMatchObject({ variant: 'checkIn', name: 'Wallinga', from: null })
    // The hour the room is ready rides along on a check-in, as a label and nowhere else.
    const ready = day([hotel('morning', { checkingOut: true }), hotel('evening', { checkingIn: true, checkIn: '15:00' }, { name: 'Wallinga', lat: 46 })])
    expect(bookendReading(ready, 1)).toMatchObject({ variant: 'checkIn', from: '15:00' })
    expect(bookendReading(ready, 0)?.from).toBeNull()
    // Nothing to read on an ordinary stop, or past the end.
    expect(bookendReading(loop(), 1)).toBeNull()
    expect(bookendReading(loop(), 9)).toBeNull()
  })

  it('FE-RTROW-060: a row of its own, unnumbered, that counts as no destination', () => {
    const rows = roadtripRows(loop())
    expect(rows.map(r => r.kind)).toEqual(['stop', 'leg', 'stop', 'leg', 'stop', 'leg', 'stop'])
    const stops = stopRows(rows)
    expect(stops.map(r => r.number)).toEqual([null, 1, 2, null])
    expect(stops.map(r => r.bookend?.variant ?? null)).toEqual(['from', null, null, 'back'])
    expect(stops[0]!.service).toBe(true)
    expect(destinationCount(loop())).toBe(2)
  })

  it('FE-RTROW-061: offers no other ways from or to the hotel, on a leg or on the drive in', () => {
    expect([0, 1, 2].map(i => legReroutable(loop(), i))).toEqual([false, true, false])
    const joined = (from: RoadtripStop, first: RoadtripStop) => day([first, stop('Falls')], {
      arrivingLeg: { ...seg(3), distance: 120_000, duration: 5_400 },
      arrivingFrom: from,
      arrivingLine: [[45, 7], [48, 11]],
    })
    expect(arrivingReroutable(joined(stop('Town', { ownerDayId: 6 }), stop('Lookout')))).toBe(true)
    expect(arrivingReroutable(joined(hotel('evening'), stop('Lookout')))).toBe(false)
    expect(arrivingReroutable(joined(stop('Town', { ownerDayId: 6 }), hotel('morning')))).toBe(false)
  })

  it('FE-RTROW-062: the morning marker at the hotel the day sets out from is folded into its row', () => {
    const resume = night('start')
    const at = { ...resume, lat: 45, lng: 7 }
    const folded = day([at, hotel('morning'), stop('Lookout')], {
      schedule: { entries: [entry('08:00'), entry('08:00'), entry('09:00')], warnings: [] },
    })
    expect(resumeFoldsIntoBookend(folded, 0)).toBe(true)
    expect(roadtripRows(folded).map(r => r.kind)).toEqual(['stop', 'leg', 'stop'])
    expect(stageClocks(roadtripRows(folded)).start).toBe('08:00')
    // A marker somewhere else keeps its own row: the drive from there to the hotel is real.
    const apart = day([resume, hotel('morning'), stop('Lookout')])
    expect(resumeFoldsIntoBookend(apart, 0)).toBe(false)
    expect(roadtripRows(apart)[0]).toMatchObject({ kind: 'auto', phase: 'resume' })
    expect(resumeFoldsIntoBookend(folded, 1)).toBe(false)
  })

  it('FE-RTROW-063: the stage starts when the hotel is left and arrives when it is reached again', () => {
    const rows = roadtripRows(loop())
    expect(stageClocks(rows)).toEqual({ start: '08:40', arrive: '12:10' })
    expect(stageEnd(rows)?.bookend?.variant).toBe('back')
  })

  it('FE-RTROW-064: a pin at the hotel opens the stay’s own stop, never a bookend', () => {
    const own = stop('Hotel Alpenblick', { placeId: 900, assignmentId: 77, ownerDayId: 3 })
    expect(firstStopOfPlace([loop(), day([own])], 900)).toBe(own)
    expect(firstStopOfPlace([loop()], 900)).toBeNull()
  })

  it('FE-RTROW-065: a stop moves past anything but the hotel at the edge of its day', () => {
    expect(movableWithin(loop(), 1)).toEqual({ up: false, down: true })
    expect(movableWithin(loop(), 2)).toEqual({ up: true, down: false })
    const plain = day([stop('A'), stop('B'), stop('C')])
    expect([0, 1, 2].map(i => movableWithin(plain, i))).toEqual([
      { up: false, down: true },
      { up: true, down: true },
      { up: true, down: false },
    ])
  })

  it('FE-RTROW-066: up next is a place, not the hotel the day comes back to', () => {
    // 11:30 is past both places and before the hotel: the last place is still next.
    expect(upNextStop(loop(), 11 * 60 + 30, true)?.row.stop.name).toBe('Falls')
    expect(upNextStop(loop(), 8 * 60 + 45, true)?.row.stop.name).toBe('Lookout')
  })
})
