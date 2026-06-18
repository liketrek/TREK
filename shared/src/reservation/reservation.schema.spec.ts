import {
  reservationCreateRequestSchema,
  reservationPositionsRequestSchema,
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
  it('requires positions with id + day_plan_position', () => {
    expect(
      reservationPositionsRequestSchema.safeParse({
        positions: [{ id: 1, day_plan_position: 0 }],
        day_id: 3,
      }).success,
    ).toBe(true);
    expect(reservationPositionsRequestSchema.safeParse({ positions: [{ id: 1 }] }).success).toBe(false);
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
});
