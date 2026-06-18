import {
  journeyCreateRequestSchema,
  journeyAddTripRequestSchema,
  journeyReorderEntriesRequestSchema,
  journeyContributorRequestSchema,
  journeyProviderPhotosRequestSchema,
  journeyShareLinkRequestSchema,
} from './journey.schema';

import { describe, it, expect } from 'vitest';

describe('journeyCreateRequestSchema', () => {
  it('requires a title; subtitle + trip_ids optional', () => {
    expect(journeyCreateRequestSchema.safeParse({ title: 'Trip of a lifetime' }).success).toBe(true);
    expect(journeyCreateRequestSchema.safeParse({ title: 'X', trip_ids: [1, '2'] }).success).toBe(true);
    expect(journeyCreateRequestSchema.safeParse({ subtitle: 'no title' }).success).toBe(false);
  });
});

describe('journeyAddTripRequestSchema', () => {
  it('requires a trip_id (string or number)', () => {
    expect(journeyAddTripRequestSchema.safeParse({ trip_id: 5 }).success).toBe(true);
    expect(journeyAddTripRequestSchema.safeParse({ trip_id: '5' }).success).toBe(true);
    expect(journeyAddTripRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('journeyReorderEntriesRequestSchema', () => {
  it('requires a non-empty orderedIds array', () => {
    expect(journeyReorderEntriesRequestSchema.safeParse({ orderedIds: [3, 1, 2] }).success).toBe(true);
    expect(journeyReorderEntriesRequestSchema.safeParse({ orderedIds: [] }).success).toBe(false);
  });
});

describe('journeyContributorRequestSchema', () => {
  it('requires user_id; role limited to editor/viewer', () => {
    expect(journeyContributorRequestSchema.safeParse({ user_id: 2 }).success).toBe(true);
    expect(journeyContributorRequestSchema.safeParse({ user_id: 2, role: 'editor' }).success).toBe(true);
    expect(journeyContributorRequestSchema.safeParse({ user_id: 2, role: 'admin' }).success).toBe(false);
  });
});

describe('journeyProviderPhotosRequestSchema', () => {
  it('requires a provider; accepts single asset_id or a batch', () => {
    expect(
      journeyProviderPhotosRequestSchema.safeParse({
        provider: 'immich',
        asset_id: 'a1',
      }).success,
    ).toBe(true);
    expect(
      journeyProviderPhotosRequestSchema.safeParse({
        provider: 'immich',
        asset_ids: ['a1', 'a2'],
      }).success,
    ).toBe(true);
    expect(journeyProviderPhotosRequestSchema.safeParse({ asset_id: 'a1' }).success).toBe(false);
  });
});

describe('journeyShareLinkRequestSchema', () => {
  it('accepts optional share toggles', () => {
    expect(
      journeyShareLinkRequestSchema.safeParse({
        share_timeline: true,
        share_gallery: false,
      }).success,
    ).toBe(true);
    expect(journeyShareLinkRequestSchema.safeParse({}).success).toBe(true);
  });
});
