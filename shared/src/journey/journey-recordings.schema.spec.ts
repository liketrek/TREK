import {
  journeyRecordingDateSchema,
  journeyRecordingPreviewRequestSchema,
  journeyRecordingSaveRequestSchema,
  recordingStats,
} from './journey-recordings.schema';

import { describe, expect, it } from 'vitest';

const HASH = 'a'.repeat(64);

describe('journeyRecordingDateSchema', () => {
  it('JRNREC-SCHEMA-001: takes a calendar day and refuses one that does not exist or is spelt otherwise', () => {
    expect(journeyRecordingDateSchema.safeParse('2026-05-14').success).toBe(true);
    expect(journeyRecordingDateSchema.safeParse('2024-02-29').success).toBe(true);
    expect(journeyRecordingDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(journeyRecordingDateSchema.safeParse('2026-5-14').success).toBe(false);
    expect(journeyRecordingDateSchema.safeParse('2026-05-14T00:00:00Z').success).toBe(false);
  });
});

describe('journeyRecordingPreviewRequestSchema', () => {
  it('JRNREC-SCHEMA-002: an offset within the zones there are, the source zone optional', () => {
    expect(journeyRecordingPreviewRequestSchema.safeParse({ date: '2026-05-14', utcOffsetMinutes: 120 }).success).toBe(
      true,
    );
    expect(
      journeyRecordingPreviewRequestSchema.safeParse({
        date: '2026-05-14',
        utcOffsetMinutes: -720,
        useSourceOffset: true,
      }).success,
    ).toBe(true);
    expect(journeyRecordingPreviewRequestSchema.safeParse({ date: '2026-05-14', utcOffsetMinutes: 841 }).success).toBe(
      false,
    );
    expect(journeyRecordingPreviewRequestSchema.safeParse({ date: '2026-05-14', utcOffsetMinutes: 90.5 }).success).toBe(
      false,
    );
    expect(journeyRecordingPreviewRequestSchema.safeParse({ date: '2026-05-14' }).success).toBe(false);
  });
});

describe('journeyRecordingSaveRequestSchema', () => {
  it('JRNREC-SCHEMA-003: names the hash of the preview it confirms, replacing only when asked', () => {
    expect(journeyRecordingSaveRequestSchema.parse({ utcOffsetMinutes: 0, expectedHash: HASH })).toEqual({
      utcOffsetMinutes: 0,
      expectedHash: HASH,
    });
    expect(
      journeyRecordingSaveRequestSchema.safeParse({ utcOffsetMinutes: 0, expectedHash: HASH, replace: true }).success,
    ).toBe(true);
    expect(journeyRecordingSaveRequestSchema.safeParse({ utcOffsetMinutes: 0, expectedHash: 'abc' }).success).toBe(
      false,
    );
    expect(journeyRecordingSaveRequestSchema.safeParse({ utcOffsetMinutes: 0 }).success).toBe(false);
  });
});

describe('recordingStats', () => {
  it('JRNREC-SCHEMA-004: adds up the pieces, prefers the distance Dawarich measured and counts the gaps between them', () => {
    const stats = recordingStats([
      {
        points: [
          [45.434, 12.3388],
          [45.4345, 12.3392],
        ],
        mode: 'walking',
        startedAt: '2026-05-14T09:00:00+02:00',
        endedAt: '2026-05-14T09:20:00+02:00',
        distanceMeters: 1200,
      },
      // Starts a hair from where the walk ended: the recording joins up here.
      {
        points: [
          [45.43451, 12.33921],
          [45.44, 12.35],
        ],
        mode: 'boat',
        startedAt: '2026-05-14T09:30:00+02:00',
        endedAt: '2026-05-14T10:00:00+02:00',
        distanceMeters: null,
      },
      // Kilometres away from the boat's end: a stretch with no recording.
      {
        points: [
          [45.5, 12.4],
          [45.501, 12.401],
        ],
        mode: 'walking',
        startedAt: '2026-05-14T15:00:00+02:00',
        endedAt: '2026-05-14T15:10:00+02:00',
        distanceMeters: 150,
      },
    ]);

    expect(stats.segmentCount).toBe(3);
    expect(stats.pointCount).toBe(6);
    expect(stats.gapCount).toBe(1);
    expect(stats.modes).toEqual(['walking', 'boat']);
    expect(stats.firstAt).toBe('2026-05-14T09:00:00+02:00');
    expect(stats.lastAt).toBe('2026-05-14T15:10:00+02:00');
    // 1200 + the boat line's own length (about 1 km) + 150, and never the gap.
    expect(stats.distanceMeters).toBeGreaterThan(2350);
    expect(stats.distanceMeters).toBeLessThan(2450);
  });

  it('JRNREC-SCHEMA-005: an empty day covers nothing', () => {
    expect(recordingStats([])).toEqual({
      distanceMeters: 0,
      pointCount: 0,
      segmentCount: 0,
      gapCount: 0,
      modes: [],
      firstAt: null,
      lastAt: null,
    });
  });
});
