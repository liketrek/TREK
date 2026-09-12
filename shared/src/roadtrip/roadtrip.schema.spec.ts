import {
  roadtripViaSchema,
  roadtripViaCreateRequestSchema,
  roadtripViaUpdateRequestSchema,
  roadtripViaReanchorRequestSchema,
  roadtripViaBatchRequestSchema,
  roadtripDayTrackSchema,
  roadtripViaListResponseSchema,
} from './roadtrip.schema';

import { describe, it, expect } from 'vitest';

/**
 * The via contracts.
 *
 * Two things carry the feature and are worth pinning here rather than in a controller:
 * the anchor is a POSITION and never an id, so it has to be a non-negative integer and
 * nothing else; and the batch route's `track` has three states, not two, because absent
 * and null mean different things to a day.
 */

const via = { after_order_index: 0, lat: 53.55, lng: 9.99 };

describe('roadtripViaSchema', () => {
  it('takes a stored via, with created_at optional', () => {
    const row = { id: 1, day_id: 4, after_order_index: 2, sequence: 0, lat: 53.55, lng: 9.99 };
    expect(roadtripViaSchema.safeParse(row).success).toBe(true);
    expect(roadtripViaSchema.safeParse({ ...row, created_at: '2026-01-01T00:00:00.000Z' }).success).toBe(true);
  });

  it('refuses coordinates no routing engine would accept', () => {
    const row = { id: 1, day_id: 4, after_order_index: 0, sequence: 0, lat: 53.55, lng: 9.99 };
    expect(roadtripViaSchema.safeParse({ ...row, lat: 91 }).success).toBe(false);
    expect(roadtripViaSchema.safeParse({ ...row, lat: -91 }).success).toBe(false);
    expect(roadtripViaSchema.safeParse({ ...row, lng: 181 }).success).toBe(false);
    expect(roadtripViaSchema.safeParse({ ...row, lng: -181 }).success).toBe(false);
  });

  it('refuses an anchor that is not a whole position', () => {
    // It counts stops, so a fraction or a negative is not a leg of anything.
    const row = { id: 1, day_id: 4, sequence: 0, lat: 53.55, lng: 9.99 };
    expect(roadtripViaSchema.safeParse({ ...row, after_order_index: -1 }).success).toBe(false);
    expect(roadtripViaSchema.safeParse({ ...row, after_order_index: 1.5 }).success).toBe(false);
    expect(roadtripViaSchema.safeParse({ ...row, after_order_index: 0 }).success).toBe(true);
  });
});

describe('roadtripViaCreateRequestSchema', () => {
  it('needs an anchor and a point, and appends when no sequence is given', () => {
    expect(roadtripViaCreateRequestSchema.safeParse(via).success).toBe(true);
    expect(roadtripViaCreateRequestSchema.safeParse({ ...via, sequence: 3 }).success).toBe(true);
    expect(roadtripViaCreateRequestSchema.safeParse({ lat: 53.55, lng: 9.99 }).success).toBe(false);
    expect(roadtripViaCreateRequestSchema.safeParse({ ...via, sequence: -1 }).success).toBe(false);
  });
});

describe('roadtripViaUpdateRequestSchema', () => {
  it('is a point and nothing else, because moving one is the whole edit', () => {
    expect(roadtripViaUpdateRequestSchema.safeParse({ lat: 53.5, lng: 9.9 }).success).toBe(true);
    expect(roadtripViaUpdateRequestSchema.safeParse({ lat: 53.5 }).success).toBe(false);
    expect(roadtripViaUpdateRequestSchema.safeParse({ lat: 100, lng: 9.9 }).success).toBe(false);
  });
});

describe('roadtripViaReanchorRequestSchema', () => {
  it('carries the corrected anchors, and the vias whose leg stopped existing', () => {
    expect(roadtripViaReanchorRequestSchema.safeParse({ vias: [] }).success).toBe(true);
    expect(
      roadtripViaReanchorRequestSchema.safeParse({
        vias: [
          { id: 1, after_order_index: 0 },
          { id: 2, after_order_index: 3 },
        ],
        remove: [9],
      }).success,
    ).toBe(true);
  });

  it('refuses an id that could not be a row', () => {
    expect(roadtripViaReanchorRequestSchema.safeParse({ vias: [{ id: 0, after_order_index: 0 }] }).success).toBe(false);
    expect(roadtripViaReanchorRequestSchema.safeParse({ vias: [], remove: [0] }).success).toBe(false);
  });

  it('caps both lists, so one request cannot be made to rewrite a whole trip', () => {
    const many = Array.from({ length: 501 }, (_, i) => ({ id: i + 1, after_order_index: 0 }));
    expect(roadtripViaReanchorRequestSchema.safeParse({ vias: many }).success).toBe(false);
    expect(roadtripViaReanchorRequestSchema.safeParse({ vias: many.slice(0, 500) }).success).toBe(true);
  });
});

describe('roadtripViaBatchRequestSchema', () => {
  it('lays a chain, optionally clearing the legs it fills', () => {
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: [via] }).success).toBe(true);
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: [via], replace_legs: [0, 2] }).success).toBe(true);
  });

  it('names legs rather than taking a boolean for the day', () => {
    // A traveller who bent two legs by hand and then adopts a scenic road for a third
    // has not asked to lose the two.
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: [], replace_legs: true }).success).toBe(false);
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: [], replace_legs: [-1] }).success).toBe(false);
  });

  it('keeps the track in three states, because absent and null differ', () => {
    // Absent leaves whatever the day followed alone; null says it follows nothing any
    // more; an object records the road it now takes.
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: [via] }).success).toBe(true);
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: [via], track: null }).success).toBe(true);
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: [via], track: { place_id: 7 } }).success).toBe(true);
    expect(
      roadtripViaBatchRequestSchema.safeParse({
        vias: [via],
        track: { place_id: 7, stray_km: 1.4 },
      }).success,
    ).toBe(true);
    expect(
      roadtripViaBatchRequestSchema.safeParse({
        vias: [via],
        track: { place_id: 7, stray_km: null },
      }).success,
    ).toBe(true);
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: [via], track: { place_id: 0 } }).success).toBe(false);
    expect(
      roadtripViaBatchRequestSchema.safeParse({
        vias: [via],
        track: { place_id: 7, stray_km: -1 },
      }).success,
    ).toBe(false);
  });

  it('caps the chain at a hundred points', () => {
    const many = Array.from({ length: 101 }, () => via);
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: many }).success).toBe(false);
    expect(roadtripViaBatchRequestSchema.safeParse({ vias: many.slice(0, 100) }).success).toBe(true);
  });
});

describe('roadtripDayTrackSchema and the list response', () => {
  it('a day track names its line and how closely the drive followed it', () => {
    expect(roadtripDayTrackSchema.safeParse({ day_id: 4, place_id: 7, stray_km: 1.2 }).success).toBe(true);
    // Null is a real answer: the fit has not been measured.
    expect(roadtripDayTrackSchema.safeParse({ day_id: 4, place_id: 7, stray_km: null }).success).toBe(true);
    expect(roadtripDayTrackSchema.safeParse({ day_id: 4, place_id: 7 }).success).toBe(false);
  });

  it('the list answers with the vias and the tracks together, in one round trip', () => {
    const parsed = roadtripViaListResponseSchema.safeParse({
      vias: [{ id: 1, day_id: 4, after_order_index: 0, sequence: 0, lat: 53.55, lng: 9.99 }],
      tracks: [{ day_id: 4, place_id: 7, stray_km: 0.8 }],
    });
    expect(parsed.success).toBe(true);
    expect(roadtripViaListResponseSchema.safeParse({ vias: [] }).success).toBe(false);
  });
});
