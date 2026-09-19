import { describe, expect, it } from 'vitest'
import { dayColor } from './dayColors'
import { stageMapData, stagePlaceIds, stagePoints } from './stageMap'
import type { AccessSpur, RoadtripDay, RoadtripRoutes, RoadtripStop } from '@trek/shared/roadtrip'

// FE-RTSTAGE-001 to FE-RTSTAGE-015

function stop(name: string, over: Partial<RoadtripStop> = {}): RoadtripStop {
  return {
    assignmentId: 1,
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

function day(stops: RoadtripStop[], over: Partial<RoadtripDay> = {}): RoadtripDay {
  return {
    dayId: 7,
    dayNumber: 2,
    date: '2026-06-02',
    title: null,
    stops,
    legs: [],
    schedule: { entries: [], warnings: [] },
    legVias: [],
    geometry: [],
    distance: 0,
    duration: 0,
    driveWarnings: [],
    dayWarning: null,
    ...over,
  }
}

const spur = (stopKey: string): AccessSpur => ({
  line: [
    [48, 11],
    [48.001, 11.001],
  ],
  meters: 120,
  stopKey,
})

/** Der Schluessel, den assemble baut: Position auf fuenf Stellen plus beide Fahrtarten. */
const keyFor = (s: RoadtripStop) =>
  `${s.lat.toFixed(5)},${s.lng.toFixed(5)},${s.legMode ?? ''},${s.incomingLegMode ?? ''}`

const LINES: [number, number][][] = [
  [
    [48, 11],
    [48.1, 11.1],
  ],
  [
    [48.1, 11.1],
    [48.2, 11.2],
  ],
  [
    [48.2, 11.2],
    [48.3, 11.3],
  ],
  [
    [48.3, 11.3],
    [48.4, 11.4],
  ],
]

function routes(over: Partial<RoadtripRoutes> = {}): RoadtripRoutes {
  return {
    days: [],
    quietDays: [],
    lines: LINES,
    lineDays: [1, 2, 2, 3],
    lineJoins: [false, false, false, false],
    accessLines: [],
    vias: [],
    segments: [],
    totalDistance: 0,
    totalDuration: 0,
    totalStops: 0,
    loading: false,
    ...over,
  }
}

describe('stageMapData without a stage', () => {
  it('FE-RTSTAGE-001: draws every line of the drive, none filtered away', () => {
    expect(stageMapData(routes(), null, true).lines).toEqual(LINES)
  })

  it('FE-RTSTAGE-002: gives each line the colour of the day it belongs to', () => {
    const colors = stageMapData(routes(), null, true).lineColors
    expect(colors).toEqual([dayColor(1), dayColor(2), dayColor(2), dayColor(3)])
    expect(colors).toHaveLength(LINES.length)
  })

  it('FE-RTSTAGE-003: keeps every spur and filters no markers', () => {
    // Ohne Auswahl gibt es nichts zu verstecken: leere placeIds heisst "kein Filter".
    const data = stageMapData(routes({ accessLines: [spur('a'), spur('b')] }), null, true)
    expect(data.accessLines).toHaveLength(2)
    expect(data.placeIds.size).toBe(0)
    expect(data.focusPoints).toEqual([])
  })

  it('FE-RTSTAGE-004: day colours off leaves the paint to the map', () => {
    expect(stageMapData(routes(), null, false).lineColors).toBeUndefined()
  })
})

describe('stageMapData with a stage', () => {
  const stage = day([stop('Kassel', { placeId: 11 }), stop('Fulda', { placeId: 22, lat: 50.55, lng: 9.68 })], {
    dayNumber: 2,
  })

  it('FE-RTSTAGE-005: keeps only the lines of that day', () => {
    expect(stageMapData(routes(), stage, true).lines).toEqual([LINES[1], LINES[2]])
  })

  it('FE-RTSTAGE-016: the drive into the next day is left off the stage', () => {
    // With "connect the days" on, that leg is drawn in the colour of the day it leaves, so
    // filtering by day number alone handed the stage a line running off it to a place the
    // day never visits. On a phone, where the stage IS the map, it was the longest thing
    // on screen and read as the day's own route.
    const withJoin = routes({ lineJoins: [false, false, true, false] })

    expect(stageMapData(withJoin, stage, true).lines).toEqual([LINES[1]])
  })

  it('FE-RTSTAGE-020: a day that is nothing but driving keeps its connection rather than going blank', () => {
    // Night to night, no stop of its own: the connection is the only line the day has, and
    // the line IS the day. Better a map that shows the drive than an empty one.
    const onlyJoin = routes({ lineDays: [1, 2, 3, 3], lineJoins: [false, true, false, false] })

    expect(stageMapData(onlyJoin, stage, true).lines).toEqual([LINES[1]])
  })

  it('FE-RTSTAGE-017: the colours still line up once a join has been dropped', () => {
    const data = stageMapData(routes({ lineJoins: [false, false, true, false] }), stage, true)

    expect(data.lineColors).toHaveLength(data.lines.length)
    expect(data.lineColors).toEqual([dayColor(2)])
  })

  it('FE-RTSTAGE-018: the all-days view keeps the joins, which is the view they are for', () => {
    // The setting draws the whole drive as one connected line; that is what it is for, and
    // on this map the connection has the other days beside it.
    expect(stageMapData(routes({ lineJoins: [false, false, true, false] }), null, true).lines).toEqual(LINES)
  })

  it('FE-RTSTAGE-019: routes from before the flag existed are drawn as they were', () => {
    // `lineJoins` arrives with this change, and a RoadtripRoutes read back from an older
    // cache has none. Without the marks nothing is known to be a join, so nothing is
    // dropped: the day is drawn the way it was drawn before.
    const legacy = { ...routes(), lineJoins: undefined } as unknown as Parameters<typeof stageMapData>[0]

    expect(stageMapData(legacy, stage, true).lines).toEqual([LINES[1], LINES[2]])
  })

  it('FE-RTSTAGE-006: the colours stay lined up with the lines that are left', () => {
    const data = stageMapData(routes(), stage, true)
    expect(data.lineColors).toHaveLength(data.lines.length)
    expect(data.lineColors).toEqual([dayColor(2), dayColor(2)])
  })

  it('FE-RTSTAGE-007: a day the routing round drew nothing for keeps no lines', () => {
    expect(stageMapData(routes(), day([stop('Kassel')], { dayNumber: 9 }), true).lines).toEqual([])
  })

  it('FE-RTSTAGE-008: day colours off leaves the paint to the map here too', () => {
    expect(stageMapData(routes(), stage, false).lineColors).toBeUndefined()
  })

  it('FE-RTSTAGE-009: the stage names its places and its fit points', () => {
    const data = stageMapData(routes(), stage, true)
    expect([...data.placeIds]).toEqual([11, 22])
    expect(data.focusPoints).toEqual([
      [48.1, 11.2],
      [50.55, 9.68],
    ])
  })

  it('FE-RTSTAGE-010: before the routing round has any line, the stage still gets places and fit', () => {
    // Sonst springt die Karte beim ersten Oeffnen ins Nichts, bis die Route da ist.
    const data = stageMapData(routes({ lines: [], lineDays: [] }), stage, true)
    expect(data.lines).toEqual([])
    expect(data.lineColors).toBeUndefined()
    expect(data.accessLines).toEqual([])
    expect(data.placeIds.size).toBe(2)
    expect(data.focusPoints).toHaveLength(2)
  })
})

describe('stageMapData access spurs', () => {
  const onStage = stop('Kassel', { lat: 51.31627, lng: 9.49797, legMode: 'car', incomingLegMode: null })
  const stage = day([onStage])

  it('FE-RTSTAGE-011: a spur comes along exactly when its stop does', () => {
    const mine = spur(keyFor(onStage))
    const elsewhere = spur(keyFor(stop('Bremen', { lat: 53.07, lng: 8.8 })))
    expect(stageMapData(routes({ accessLines: [mine, elsewhere] }), stage, true).accessLines).toEqual([mine])
  })

  it('FE-RTSTAGE-012: a stop with no mode on one side still finds its spur', () => {
    // Der letzte Stopp des Tages faehrt nirgends mehr hin, der erste kommt von nirgends her.
    const last = stop('Fulda', { lat: 50.55221, lng: 9.6752, legMode: null, incomingLegMode: 'car' })
    const spurs = [spur(keyFor(onStage)), spur(keyFor(last))]
    expect(stageMapData(routes({ accessLines: spurs }), day([onStage, last]), true).accessLines).toEqual(spurs)
  })

  it('FE-RTSTAGE-013: the key carries both leg modes, so the same spot in another mode is a different stop', () => {
    // Zwei Stopps auf demselben Parkplatz unterscheiden sich nur hier.
    const ferry = spur(`${onStage.lat.toFixed(5)},${onStage.lng.toFixed(5)},ferry,`)
    expect(stageMapData(routes({ accessLines: [ferry] }), stage, true).accessLines).toEqual([])
  })
})

describe('stagePlaceIds', () => {
  it('FE-RTSTAGE-014: leaves the automatic night out, it has no place behind it', () => {
    const stage = day([
      stop('Kassel', { placeId: 11 }),
      stop('Nacht', { placeId: 0, automaticNight: { phase: 'end', fromDayNumber: 1 } }),
      stop('Fulda', { placeId: 22 }),
    ])
    expect([...stagePlaceIds(stage)]).toEqual([11, 22])
  })
})

describe('stagePoints', () => {
  it('FE-RTSTAGE-015: keeps order and drops what cannot be put on a map', () => {
    const stage = day([
      stop('Kassel', { lat: 51.31, lng: 9.49 }),
      stop('Ohne', { lat: Number.NaN, lng: 9.5 }),
      stop('Auch ohne', { lat: 50.5, lng: Number.NaN }),
      stop('Fulda', { lat: 50.55, lng: 9.68 }),
    ])
    expect(stagePoints(stage)).toEqual([
      [51.31, 9.49],
      [50.55, 9.68],
    ])
  })
})
