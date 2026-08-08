import {
  reservationCreateRequestSchema,
  reservationPositionsRequestSchema,
  accommodationCreateBodySchema,
  accommodationCreateRequestSchema,
} from './reservation.schema';

import { describe, it, expect } from 'vitest';

describe('reservationCreateRequestSchema', () => {
  it('requires a title and keeps the other booking fields open', () => {
    expect(
      reservationCreateRequestSchema.safeParse({
        title: 'Hotel',
        anything: 1,
        metadata: {},
      }).success,
    ).toBe(true);
    expect(reservationCreateRequestSchema.safeParse({ location: 'x' }).success).toBe(false);
  });
});

describe('reservationPositionsRequestSchema', () => {
  it('requires positions with an id; day_plan_position stays optional (legacy wire tolerance)', () => {
    expect(
      reservationPositionsRequestSchema.safeParse({
        positions: [{ id: 1, day_plan_position: 0 }],
        day_id: 3,
      }).success,
    ).toBe(true);
    // The legacy route accepted items without day_plan_position (binds NULL) —
    // RESV-006 pins this on the server side.
    expect(reservationPositionsRequestSchema.safeParse({ positions: [{ id: 1 }] }).success).toBe(true);
    expect(reservationPositionsRequestSchema.safeParse({ positions: [{}] }).success).toBe(false);
  });
});

describe('accommodationCreateRequestSchema', () => {
  it('requires place + start/end day; check-in/out optional', () => {
    expect(
      accommodationCreateRequestSchema.safeParse({
        place_id: 2,
        start_day_id: 10,
        end_day_id: 11,
      }).success,
    ).toBe(true);
    expect(accommodationCreateRequestSchema.safeParse({ place_id: 2 }).success).toBe(false);
  });

  it('body variant keeps missing refs schema-valid (bespoke controller 400)', () => {
    // The REST endpoint requires all three refs, but their absence is answered
    // by the controller's bespoke 400 body — the pipe must not pre-empt it.
    expect(accommodationCreateBodySchema.safeParse({ place_id: 2 }).success).toBe(true);
    expect(accommodationCreateBodySchema.safeParse({ check_in: 5 }).success).toBe(false);
  });
});
