import {
  journeyCreateRequestSchema,
  journeyAddTripRequestSchema,
  journeyReorderEntriesRequestSchema,
  journeyContributorRequestSchema,
  journeyProviderPhotosRequestSchema,
  journeyShareLinkRequestSchema,
  journeyUpdateRequestSchema,
  journeyPreferencesRequestSchema,
  journeyLinkPhotoRequestSchema,
  journeyEntriesRangeSchema,
  journeyEntryProsConsSchema,
  journeyEntryTypeSchema,
  journeyEntryVisibilitySchema,
  journeyCreateToolSchema,
  journeyUpdateToolSchema,
  journeyTrackSchema,
} from './journey.schema';

import { describe, it, expect } from 'vitest';

/**
 * These schemas describe the journey bodies rather than tighten them, and the
 * cases below are what makes that checkable: every shape the handler still
 * rejects itself has to PARSE here, or the global pipe would answer first with
 * a different error body than the one the e2e cases pin.
 *
 * This inverts the assertions the file carried while the schemas were strict.
 * That was the point of the change.
 */
describe('journeyCreateRequestSchema', () => {
  it('accepts the well-formed body', () => {
    expect(journeyCreateRequestSchema.safeParse({ title: 'Trip of a lifetime' }).success).toBe(true);
    expect(journeyCreateRequestSchema.safeParse({ title: 'X', trip_ids: [1, '2'] }).success).toBe(true);
  });

  it('leaves the missing/blank/non-string title to the handler', () => {
    // The handler answers 'Title is required' for all three.
    expect(journeyCreateRequestSchema.safeParse({ subtitle: 'no title' }).success).toBe(true);
    expect(journeyCreateRequestSchema.safeParse({ title: '   ' }).success).toBe(true);
    expect(journeyCreateRequestSchema.safeParse({ title: 42 }).success).toBe(true);
  });

  it('leaves a non-array trip_ids to the handler, which reads it as none', () => {
    expect(journeyCreateRequestSchema.safeParse({ title: 'X', trip_ids: 'nope' }).success).toBe(true);
  });
});

describe('journeyAddTripRequestSchema', () => {
  it('accepts an id and leaves the missing one to the handler', () => {
    expect(journeyAddTripRequestSchema.safeParse({ trip_id: 5 }).success).toBe(true);
    expect(journeyAddTripRequestSchema.safeParse({ trip_id: '5' }).success).toBe(true);
    // The handler answers 'trip_id required'.
    expect(journeyAddTripRequestSchema.safeParse({}).success).toBe(true);
  });
});

describe('journeyReorderEntriesRequestSchema', () => {
  it('accepts a list, and an empty one, which the handler short-circuits', () => {
    expect(journeyReorderEntriesRequestSchema.safeParse({ orderedIds: [3, '1'] }).success).toBe(true);
    expect(journeyReorderEntriesRequestSchema.safeParse({ orderedIds: [] }).success).toBe(true);
    expect(journeyReorderEntriesRequestSchema.safeParse({}).success).toBe(true);
  });
});

describe('journeyContributorRequestSchema', () => {
  it('accepts the roles and leaves an unknown one to the handler', () => {
    expect(journeyContributorRequestSchema.safeParse({ user_id: 3, role: 'editor' }).success).toBe(true);
    expect(journeyContributorRequestSchema.safeParse({ user_id: 3 }).success).toBe(true);
    // Never validated: the handler casts it.
    expect(journeyContributorRequestSchema.safeParse({ user_id: 3, role: 'admin' }).success).toBe(true);
    // The handler answers 'user_id required'.
    expect(journeyContributorRequestSchema.safeParse({}).success).toBe(true);
  });
});

describe('journeyProviderPhotosRequestSchema', () => {
  it('accepts single and batch, and leaves the incomplete pair to the handler', () => {
    expect(journeyProviderPhotosRequestSchema.safeParse({ provider: 'immich', asset_id: 'a1' }).success).toBe(true);
    expect(
      journeyProviderPhotosRequestSchema.safeParse({ provider: 'immich', asset_ids: ['a1', 2], media_types: ['video'] })
        .success,
    ).toBe(true);
    // The handler answers 'provider and asset_id required'.
    expect(journeyProviderPhotosRequestSchema.safeParse({ asset_id: 'a1' }).success).toBe(true);
    expect(journeyProviderPhotosRequestSchema.safeParse({}).success).toBe(true);
  });
});

describe('journeyShareLinkRequestSchema', () => {
  it('accepts the flags in whatever shape the client sends them', () => {
    expect(journeyShareLinkRequestSchema.safeParse({ share_timeline: true, share_gallery: false }).success).toBe(true);
    expect(journeyShareLinkRequestSchema.safeParse({}).success).toBe(true);
    // The controller coerces with !!; a string flag has always worked.
    expect(journeyShareLinkRequestSchema.safeParse({ share_map: 'true' }).success).toBe(true);
  });

  it('takes the plan and recordings flags as booleans only, being new (JRN-04)', () => {
    expect(journeyShareLinkRequestSchema.safeParse({ share_plan: true, share_recordings: false }).success).toBe(true);
    expect(journeyShareLinkRequestSchema.safeParse({ share_plan: 'true' }).success).toBe(false);
    expect(journeyShareLinkRequestSchema.safeParse({ share_recordings: 1 }).success).toBe(false);
  });
});

describe('the free-form bodies keep their unknown keys', () => {
  it('does not strip what the services are handed whole', () => {
    // The whole reason these are loose objects: a strict object drops unknown
    // keys, and update/preferences/link are forwarded to the service as sent.
    expect(journeyUpdateRequestSchema.parse({ title: 'X', cover_photo_id: 9 })).toEqual({
      title: 'X',
      cover_photo_id: 9,
    });
    expect(journeyPreferencesRequestSchema.parse({ layout: 'grid', density: 2 })).toEqual({
      layout: 'grid',
      density: 2,
    });
    expect(journeyLinkPhotoRequestSchema.parse({ journey_photo_id: 4, extra: true })).toEqual({
      journey_photo_id: 4,
      extra: true,
    });
  });
});

describe('the entry enums and the range of a read', () => {
  it('JRNSCH-001: names the entry types and visibilities a row can hold, nothing else', () => {
    expect(journeyEntryTypeSchema.options).toEqual(['entry', 'checkin', 'skeleton']);
    expect(journeyEntryVisibilitySchema.options).toEqual(['private', 'shared', 'public']);
    expect(journeyEntryVisibilitySchema.safeParse('friends-only').success).toBe(false);
  });

  it('JRNSCH-002: a verdict sent half fills the other half with an empty list and refuses extra keys', () => {
    expect(journeyEntryProsConsSchema.parse({ pros: ['view'] })).toEqual({ pros: ['view'], cons: [] });
    expect(journeyEntryProsConsSchema.safeParse({ pros: [], cons: [], extra: 1 }).success).toBe(false);
  });

  it('JRNSCH-003: a range takes calendar days at either end, both optional', () => {
    expect(journeyEntriesRangeSchema.parse({})).toEqual({});
    expect(journeyEntriesRangeSchema.parse({ from: '2026-10-21', to: '2026-10-22' })).toEqual({
      from: '2026-10-21',
      to: '2026-10-22',
    });
    expect(journeyEntriesRangeSchema.safeParse({ from: '2026-02-30' }).success).toBe(false);
    expect(journeyEntriesRangeSchema.safeParse({ to: 'yesterday' }).success).toBe(false);
  });
});

describe('journeyTrackSchema', () => {
  const track = { place_id: -1, trip_id: 0, name: 'Day', color: null, points: [[48.1, 11.5]], kind: 'day_recording' };

  it('JRNSCH-004: a recorded line may name its calendar day, a GPX track leaves it out', () => {
    expect(journeyTrackSchema.parse({ ...track, date: '2026-10-29' }).date).toBe('2026-10-29');
    expect(journeyTrackSchema.parse({ ...track, kind: 'trip_gpx' }).date).toBeUndefined();
  });

  it('JRNSCH-005: refuses a day that is not a calendar day', () => {
    expect(journeyTrackSchema.safeParse({ ...track, date: '29. Oktober' }).success).toBe(false);
    expect(journeyTrackSchema.safeParse({ ...track, date: '2026-02-30' }).success).toBe(false);
  });
});

describe('the journey tool arguments', () => {
  it('JSCHEMA-TOOL-001: a new journey needs a title and refuses what the tool does not take', () => {
    expect(journeyCreateToolSchema.parse({ title: 'Japan', trip_ids: [5] })).toEqual({ title: 'Japan', trip_ids: [5] });
    expect(journeyCreateToolSchema.safeParse({ title: '' }).success).toBe(false);
    expect(journeyCreateToolSchema.safeParse({ title: 'x'.repeat(201) }).success).toBe(false);
    expect(journeyCreateToolSchema.safeParse({ title: 'Japan', cover: 'x' }).success).toBe(false);
  });

  it('JSCHEMA-TOOL-002: an update takes the trip tracks and the cover gradient, and null for the subtitle', () => {
    const update = { show_trip_tracks: true, cover_gradient: null, subtitle: null, status_override: null };
    expect(journeyUpdateToolSchema.parse(update)).toEqual(update);
    expect(journeyUpdateToolSchema.safeParse({ status: 'upcoming' }).success).toBe(false);
    expect(journeyUpdateToolSchema.safeParse({ status_override: 'active' }).success).toBe(false);
    expect(journeyUpdateToolSchema.safeParse({ title: null }).success).toBe(false);
    expect(journeyUpdateToolSchema.safeParse({ show_mood: 'yes' }).success).toBe(false);
    expect(journeyUpdateToolSchema.safeParse({ cover_gradient: 'x'.repeat(201) }).success).toBe(false);
  });
});
