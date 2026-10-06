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
