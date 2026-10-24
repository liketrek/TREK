import type { JourneyDayStay, JourneyDayStays, JourneyRecordedDay, JourneyRecordingPreview } from '@trek/shared';

/** A walk across Venice on the 14th, the way the server answers it. */
export const WALK_SEGMENT = {
  points: [
    [45.434, 12.3388],
    [45.4364, 12.3218],
  ] as Array<[number, number]>,
  mode: 'walking',
  startedAt: '2026-05-14T09:00:00+02:00',
  endedAt: '2026-05-14T09:40:00+02:00',
  distanceMeters: 1500,
};

export function buildRecordedDay(over: Partial<JourneyRecordedDay> = {}): JourneyRecordedDay {
  return {
    id: 3,
    date: '2026-05-14',
    source: 'dawarich',
    sourceKind: 'tracks',
    utcOffsetMinutes: 120,
    window: { from: '2026-05-13T22:00:00.000Z', to: '2026-05-14T22:00:00.000Z' },
    segments: [WALK_SEGMENT],
    stats: {
      distanceMeters: 1500,
      pointCount: 2,
      segmentCount: 1,
      gapCount: 0,
      modes: ['walking'],
      firstAt: WALK_SEGMENT.startedAt,
      lastAt: WALK_SEGMENT.endedAt,
    },
    truncated: false,
    provisional: false,
    fetchedAt: '2026-05-15T07:00:00.000Z',
    contentHash: 'a'.repeat(64),
    importedBy: { id: 1, username: 'marta' },
    savedAt: '2026-05-15T07:00:01.000Z',
    ...over,
  };
}

export function buildRecordingPreview(over: Partial<JourneyRecordingPreview> = {}): JourneyRecordingPreview {
  const day = buildRecordedDay();
  return {
    journey: { id: 7, title: 'Venice' },
    date: day.date,
    utcOffsetMinutes: 120,
    offsetSource: 'source',
    sourceOffsetMinutes: 120,
    window: day.window,
    sourceKind: 'tracks',
    segments: day.segments,
    stats: day.stats,
    truncated: false,
    provisional: false,
    fetchedAt: day.fetchedAt,
    contentHash: 'a'.repeat(64),
    stored: null,
    sameAsStored: false,
    audience: 0,
    ...over,
  };
}

/** A stay of the 14th as the day review lists it, open unless a case says otherwise. */
export function buildDayStay(over: Partial<JourneyDayStay> = {}): JourneyDayStay {
  return {
    suggestionId: 11,
    name: 'Piazza San Marco',
    lat: 45.434,
    lng: 12.3388,
    startedAt: '2026-05-14T09:10:00+02:00',
    endedAt: '2026-05-14T10:05:00+02:00',
    durationMinutes: 55,
    sourceStatus: 'confirmed',
    confidenceBand: 'high',
    status: 'open',
    entry: null,
    ...over,
  };
}

/** The review of the 14th: two stays at San Marco, a parking stop and Rialto. */
export function buildDayStays(over: Partial<JourneyDayStays> = {}): JourneyDayStays {
  return {
    journey: { id: 7, title: 'Venice' },
    date: '2026-05-14',
    stays: [
      buildDayStay({
        suggestionId: 10,
        name: 'Parcheggio',
        startedAt: '2026-05-14T08:30:00+02:00',
        endedAt: '2026-05-14T08:40:00+02:00',
        durationMinutes: 10,
        sourceStatus: 'suggested',
        // Doubtful enough to ask about, not so doubtful that the review leaves it out.
        confidenceBand: 'medium',
      }),
      buildDayStay(),
      buildDayStay({
        suggestionId: 12,
        startedAt: '2026-05-14T10:20:00+02:00',
        endedAt: '2026-05-14T11:40:00+02:00',
        durationMinutes: 80,
        lat: 45.4341,
        lng: 12.3391,
      }),
      buildDayStay({
        suggestionId: 13,
        name: 'Rialto',
        startedAt: '2026-05-14T13:00:00+02:00',
        endedAt: '2026-05-14T13:30:00+02:00',
        durationMinutes: 30,
        lat: 45.438,
        lng: 12.3359,
      }),
    ],
    entries: [],
    fresh: true,
    error: null,
    syncedAt: null,
    truncated: false,
    audience: 0,
    ...over,
  };
}
