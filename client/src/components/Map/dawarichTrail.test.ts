/**
 * dawarichTrail unit tests: FE-DAWARICH-TRAIL-001 to FE-DAWARICH-TRAIL-008, and
 * FE-DAWARICH-TRAIL-030 to FE-DAWARICH-TRAIL-032 for the days folded away.
 *
 * This module is the whole of what the two map renderers agree on about the
 * recorded route: Leaflet turns `trailSegments` into `<Polyline>` elements, the
 * GL map turns `trailGeoJson` into one source, and the pill reports
 * `trailDistanceKm`. Nothing here touches a map, so every decision it makes can
 * be pinned directly, and every one of them breaks silently, because a wrong
 * line still looks exactly like a line.
 *
 * Four claims are worth holding:
 *
 *  - **the day colour comes from the day's place in the whole track, never in
 *    the filtered list.** Picking a day on the timeline has to dim the rest of
 *    the trip while leaving the picked day the colour it already had; an index
 *    read off the filtered array would repaint every selection blue, and the
 *    map would quietly stop meaning "we were here on Tuesday".
 *  - **a segment that cannot be drawn is dropped, not drawn badly.** The pairs
 *    are narrowed at runtime rather than cast, so a ragged answer from someone
 *    else's Dawarich instance costs a point instead of putting a vertex at NaN
 *    and taking the rest of the overlay down with it.
 *  - **`[lat, lng]` becomes `[lng, lat]` exactly once.** This is the only
 *    coordinate flip in the overlay. A second flip, or none, drops the whole
 *    recording in the Gulf of Guinea, and nothing else in the repo watches
 *    that boundary.
 *  - **an unknown distance is not zero.** `null` means "Dawarich did not say",
 *    which the panel has to render as nothing rather than as "0 km travelled".
 */
import { describe, it, expect } from 'vitest'
import type { DawarichTrack, DawarichTrackDay, DawarichTrackSegment } from '@trek/shared'
import {
  DAWARICH_DAY_COLORS,
  DAWARICH_TRAIL_CASING,
  DAWARICH_TRAIL_COLOR,
  collapsedDayDates,
  dayColor,
  trailDistanceKm,
  trailGeoJson,
  trailSegments,
  type DawarichTrailSegment,
} from './dawarichTrail'

const seg = (over: Partial<DawarichTrackSegment> = {}): DawarichTrackSegment => ({
  points: over.points ?? [
    [52.52, 13.405],
    [52.51, 13.41],
  ],
  mode: over.mode === undefined ? 'walking' : over.mode,
  startedAt: over.startedAt ?? '2026-05-01T08:00:00Z',
  endedAt: over.endedAt ?? '2026-05-01T09:00:00Z',
  distanceMeters: over.distanceMeters === undefined ? 1200 : over.distanceMeters,
})

const track = (days: DawarichTrackDay[]): DawarichTrack => ({
  days,
  source: 'tracks',
  fetchedAt: '2026-05-03T10:00:00Z',
  pointCount: 42,
  truncated: false,
})

/** Three calendar days, so "the second day" has a colour that is not the first day's. */
const THREE_DAYS = track([
  { date: '2026-05-01', segments: [seg(), seg({ mode: 'car', distanceMeters: 40_000 })] },
  { date: '2026-05-02', segments: [seg({ mode: null, distanceMeters: null })] },
  { date: '2026-05-03', segments: [seg()] },
])

/**
 * The wire shapes a Dawarich instance can actually produce but the Zod tuple
 * type cannot express: a pair that lost its longitude, and a pair whose
 * latitude came back as text. The casts reproduce the bad answer rather than
 * pretending the schema makes it impossible, which is exactly the assumption
 * the runtime narrowing in `trailSegments` refuses to make.
 */
const RAGGED = [
  [52.52, 13.405],
  [52.51],
  [52.5, 13.4],
] as unknown as Array<[number, number]>

const UNDRAWABLE = [
  ['north', 13.405],
  [52.51, 13.41],
] as unknown as Array<[number, number]>

describe('dayColor', () => {
  it('FE-DAWARICH-TRAIL-001: cycles the six day hues and wraps instead of running off the end', () => {
    expect(DAWARICH_DAY_COLORS).toHaveLength(6)
    expect(dayColor(0)).toBe(DAWARICH_DAY_COLORS[0])
    expect(dayColor(5)).toBe(DAWARICH_DAY_COLORS[5])
    // A fortnight-long trip must not hand back undefined on day seven.
    expect(dayColor(6)).toBe(DAWARICH_DAY_COLORS[0])
    expect(dayColor(13)).toBe(DAWARICH_DAY_COLORS[1])
    // These two are what the Leaflet path options and the GL paint expressions
    // both read. Changing either is a review decision, not a drive-by diff.
    expect(DAWARICH_TRAIL_COLOR).toBe('#2563EB')
    expect(DAWARICH_TRAIL_CASING).toBe('#FFFFFF')
  })
})

describe('trailSegments', () => {
  it('FE-DAWARICH-TRAIL-002: has nothing to draw before a track has been fetched', () => {
    expect(trailSegments(null)).toEqual([])
    // The timeline passes its selected day even while the first fetch is out.
    expect(trailSegments(null, '2026-05-01')).toEqual([])
  })

  it('FE-DAWARICH-TRAIL-003: flattens every day into keyed segments carrying the day colour', () => {
    const out = trailSegments(THREE_DAYS)

    expect(out.map(s => s.id)).toEqual([
      '2026-05-01-0',
      '2026-05-01-1',
      '2026-05-02-0',
      '2026-05-03-0',
    ])
    expect(out.map(s => s.color)).toEqual([
      DAWARICH_DAY_COLORS[0],
      DAWARICH_DAY_COLORS[0],
      DAWARICH_DAY_COLORS[1],
      DAWARICH_DAY_COLORS[2],
    ])
    expect(out[1].mode).toBe('car')
    expect(out[1].distanceMeters).toBe(40_000)
    // An instance too old to classify the movement reports null, and null is
    // what reaches the renderer: no invented transport mode.
    expect(out[2].mode).toBeNull()
    expect(out[2].distanceMeters).toBeNull()
    expect(out[0].startedAt).toBe('2026-05-01T08:00:00Z')
    expect(out[0].endedAt).toBe('2026-05-01T09:00:00Z')
    expect(out[0].points).toEqual([
      [52.52, 13.405],
      [52.51, 13.41],
    ])
  })

  it('FE-DAWARICH-TRAIL-004: filtering to one day keeps that day its own colour', () => {
    const only = trailSegments(THREE_DAYS, '2026-05-03')

    expect(only.map(s => s.id)).toEqual(['2026-05-03-0'])
    // The regression this test exists for: an index taken from the filtered
    // array would be 0 here and repaint the third day in the first day's blue.
    expect(only[0].color).toBe(DAWARICH_DAY_COLORS[2])
    // An explicit null is the "no day picked" case the scrubber sends on reset.
    expect(trailSegments(THREE_DAYS, null)).toHaveLength(4)
    // A day with no recording is an empty overlay, not the whole trip.
    expect(trailSegments(THREE_DAYS, '2026-04-30')).toEqual([])
  })

  it('FE-DAWARICH-TRAIL-005: drops what cannot be drawn and keeps the rest of the day numbered', () => {
    const out = trailSegments(
      track([
        {
          date: '2026-05-01',
          segments: [
            // A single recorded fix is a dot, not a line: Leaflet would draw
            // nothing and the GL source would reject the LineString.
            seg({ points: [[52.52, 13.405]] }),
            // Two pairs, one of them without a usable latitude, so only one
            // point survives the narrowing and this segment goes with it.
            seg({ points: UNDRAWABLE }),
            seg({ points: RAGGED }),
          ],
        },
      ]),
    )

    expect(out).toHaveLength(1)
    // The id keeps the segment's index inside the day rather than its index in
    // the output: a renderer keys on it, and renumbering would remount every
    // surviving line as soon as an earlier segment went missing.
    expect(out[0].id).toBe('2026-05-01-2')
    expect(out[0].points).toEqual([
      [52.52, 13.405],
      [52.5, 13.4],
    ])
  })

  it('FE-DAWARICH-TRAIL-006: a day that recorded nothing contributes nothing', () => {
    expect(trailSegments(track([{ date: '2026-05-01', segments: [] }]))).toEqual([])
    expect(trailSegments(track([]))).toEqual([])
  })
})

describe('trailGeoJson', () => {
  it('FE-DAWARICH-TRAIL-007: flips lat/lng once and carries the paint properties across', () => {
    const collection = trailGeoJson(trailSegments(THREE_DAYS, '2026-05-02'))

    expect(collection.type).toBe('FeatureCollection')
    expect(collection.features).toHaveLength(1)
    const [feature] = collection.features
    expect(feature.type).toBe('Feature')
    expect(feature.properties).toEqual({
      id: '2026-05-02-0',
      color: DAWARICH_DAY_COLORS[1],
      date: '2026-05-02',
      mode: null,
    })
    expect(feature.geometry.type).toBe('LineString')
    // TREK stores [lat, lng]; GeoJSON wants [lng, lat]. Berlin sits at 52 N
    // 13 E, so a missed flip lands the recording off the coast of Ghana.
    expect(feature.geometry.coordinates).toEqual([
      [13.405, 52.52],
      [13.41, 52.51],
    ])

    // Nothing recorded is an empty collection, which a GeoJSON source accepts,
    // not the null it would choke on.
    expect(trailGeoJson([])).toEqual({ type: 'FeatureCollection', features: [] })
  })
})

describe('trailDistanceKm', () => {
  it('FE-DAWARICH-TRAIL-008: sums the known metres into kilometres and says nothing when none are known', () => {
    const withDistances: DawarichTrailSegment[] = trailSegments(THREE_DAYS)

    // 1200 + 40000 + 1200 metres; the day Dawarich gave no distance for is
    // skipped rather than counted as a zero-kilometre leg.
    expect(trailDistanceKm(withDistances)).toBeCloseTo(42.4, 6)

    const unknownOnly = trailSegments(
      track([{ date: '2026-05-02', segments: [seg({ distanceMeters: null })] }]),
    )
    // null, not 0: "Dawarich did not say" and "you went nowhere" are different
    // sentences and the pill is allowed to render only one of them.
    expect(trailDistanceKm(unknownOnly)).toBeNull()
    expect(trailDistanceKm([])).toBeNull()
  })
})

describe('the days folded away in the day plan', () => {
  it('FE-DAWARICH-TRAIL-030: a collapsed day takes its route off the map and leaves the colours of the rest alone', () => {
    const all = trailSegments(THREE_DAYS)
    const visible = trailSegments(THREE_DAYS, null, new Set(['2026-05-02']))

    expect(visible.map(segment => segment.date)).toEqual(['2026-05-01', '2026-05-01', '2026-05-03'])
    // Folding day two must not shift day three onto day two's colour.
    expect(visible.find(segment => segment.date === '2026-05-03')?.color)
      .toBe(all.find(segment => segment.date === '2026-05-03')?.color)
  })

  it('FE-DAWARICH-TRAIL-031: a picked day that is also folded away draws nothing', () => {
    expect(trailSegments(THREE_DAYS, '2026-05-01', new Set(['2026-05-01']))).toEqual([])
    expect(trailSegments(THREE_DAYS, '2026-05-01', new Set(['2026-05-03']))).toHaveLength(2)
  })

  it('FE-DAWARICH-TRAIL-032: follows both folds the places follow, and nothing before the day plan has spoken', () => {
    const days = [
      { id: 1, date: '2026-05-03' },
      { id: 2, date: '2026-05-01' },
      { id: 3, date: null },
      { id: 4, date: '2026-05-02' },
    ]

    // Null is "the day plan has not reported yet": the places show, so the
    // route shows too.
    expect(collapsedDayDates(days, null)).toEqual([])

    // Sorted, deduplicated, and a day without a date matches no recording.
    expect(collapsedDayDates(days, new Set([4]))).toEqual(['2026-05-01', '2026-05-03'])

    // Road trip mode folds days in its own sidebar, on top of the day plan.
    expect(collapsedDayDates(days, null, new Set([4]))).toEqual(['2026-05-02'])
    expect(collapsedDayDates(days, new Set([1, 2, 3, 4]), new Set([1, 3]))).toEqual(['2026-05-03'])
  })
})
