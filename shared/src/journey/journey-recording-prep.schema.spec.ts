import { journeyRecordingPrepSchema } from './journey-recording-prep.schema';
import { journeySchema, journeyUpdateRequestSchema } from './journey.schema';

import { describe, expect, it } from 'vitest';

const PREP = {
  enabled: true,
  connection: 'ready',
  lastAttemptAt: '2026-05-14T09:00:00.000Z',
  lastSuccessAt: '2026-05-14T08:00:00.000Z',
  lastError: 'unreachable',
};

describe('journeyRecordingPrepSchema', () => {
  it('JRNPREP-SCHEMA-001: a failed run beside the last success, and a person who never ran it', () => {
    expect(journeyRecordingPrepSchema.safeParse(PREP).success).toBe(true);
    expect(
      journeyRecordingPrepSchema.safeParse({
        ...PREP,
        enabled: false,
        connection: 'not_connected',
        lastAttemptAt: null,
        lastSuccessAt: null,
        lastError: null,
      }).success,
    ).toBe(true);
  });

  it('JRNPREP-SCHEMA-002: refuses a connection state it does not know and a missing time', () => {
    expect(journeyRecordingPrepSchema.safeParse({ ...PREP, connection: 'paused' }).success).toBe(false);
    const { lastSuccessAt: _dropped, ...withoutSuccess } = PREP;
    expect(journeyRecordingPrepSchema.safeParse(withoutSuccess).success).toBe(false);
  });

  it('JRNPREP-SCHEMA-003: the periods it reaches are optional, an open trip has no end', () => {
    const periods = [
      { start: '2026-05-10', end: '2026-05-14' },
      { start: '2026-06-01', end: null },
    ];
    expect(journeyRecordingPrepSchema.parse({ ...PREP, periods }).periods).toEqual(periods);
    expect(journeyRecordingPrepSchema.safeParse({ ...PREP, periods: [{ start: '2026-05-10' }] }).success).toBe(false);
  });
});

describe('the journey switch', () => {
  it('JRNPREP-SCHEMA-003: the update takes a boolean and keeps the rest of the body open', () => {
    expect(journeyUpdateRequestSchema.parse({ auto_prepare_recordings: true, title: 'Venice' })).toEqual({
      auto_prepare_recordings: true,
      title: 'Venice',
    });
    expect(journeyUpdateRequestSchema.safeParse({ auto_prepare_recordings: 1 }).success).toBe(false);
  });

  it('JRNPREP-SCHEMA-004: a journey row reads with and without the flag', () => {
    const row = {
      id: 1,
      user_id: 1,
      title: 'Venice',
      subtitle: null,
      cover_gradient: null,
      status: 'active',
      created_at: 0,
      updated_at: 0,
      cover_image: null,
      show_trip_tracks: 0,
      show_verdict: 1,
      show_mood: 1,
      show_weather: 1,
      status_override: null,
      photo_location: 0,
    };
    expect(journeySchema.safeParse(row).success).toBe(true);
    expect(journeySchema.safeParse({ ...row, auto_prepare_recordings: 1 }).success).toBe(true);
  });
});
