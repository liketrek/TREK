import { describe, expect, it } from 'vitest'
import {
  destinationCount,
  firstStopOfPlace,
  legReroutable,
  pickWarning,
  roadtripRows,
  stageClocks,
  stageEnd,
  stageOf,
  upNextStop,
  type RoadtripRow,
  type StopRow,
} from './roadtripRowModel'
import type { ScheduleEntry, ScheduleWarning } from './roadtripModel'
import type { RoadtripDay, RoadtripStop, RouteSegment } from '@trek/shared/roadtrip'

// FE-RTROW-001 to FE-RTROW-039

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
    const rows = stopRows(
      roadtripRows(
        day([stop('A'), stop('B')], {
          driveWarnings: [
            { index: 0, code: 'overnight' },
            { index: 1, code: 'leg', overMinutes: 20 },
            { index: 1, code: 'late', minutes: 15 },
          ],
        }),
      ),
    )
    expect(rows[0].warning).toEqual({ index: 0, code: 'overnight' })
    expect(rows[1].warning).toEqual({ index: 1, code: 'late', minutes: 15 })
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
