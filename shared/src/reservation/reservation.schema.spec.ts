import {
  reservationCreateRequestSchema,
  reservationUpdateRequestSchema,
  reservationPositionsRequestSchema,
  accommodationCreateBodySchema,
  accommodationCreateRequestSchema,
  transportLegInputSchema,
  transportLegsInputSchema,
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

  it('rejects a booking url that executes instead of navigating, on create and update', () => {
    expect(reservationCreateRequestSchema.safeParse({ title: 'Hotel', url: 'javascript:alert(1)' }).success).toBe(false);
    expect(reservationCreateRequestSchema.safeParse({ title: 'Hotel', url: 'JavaScript:alert(1)' }).success).toBe(false);
    expect(reservationCreateRequestSchema.safeParse({ title: 'Hotel', url: ' \tjava\nscript:alert(1)' }).success).toBe(false);
    expect(reservationCreateRequestSchema.safeParse({ title: 'Hotel', url: 'data:text/html,<script>x</script>' }).success).toBe(false);
    expect(reservationUpdateRequestSchema.safeParse({ url: 'vbscript:msgbox' }).success).toBe(false);
  });

  it('keeps every link people actually paste valid (no stored row becomes unsavable)', () => {
    for (const url of ['https://hotel.example/booking', 'http://hotel.example', 'www.hotel.com', 'hotel.example/x?a=b', '']) {
      expect(reservationCreateRequestSchema.safeParse({ title: 'Hotel', url }).success).toBe(true);
      expect(reservationUpdateRequestSchema.safeParse({ url }).success).toBe(true);
    }
    expect(reservationUpdateRequestSchema.safeParse({ url: null }).success).toBe(true);
    expect(reservationUpdateRequestSchema.safeParse({ location: 'x' }).success).toBe(true);
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

describe('transportLegInputSchema', () => {
  it('accepts a flight leg exactly as the planner form writes it', () => {
    expect(
      transportLegInputSchema.safeParse({
        from: 'AMS',
        to: 'CDG',
        airline: 'KLM',
        flight_number: 'KL1233',
        seat: '14A',
        dep_day_id: 2029,
        dep_time: '09:00',
        // The form writes null, not undefined, for a waypoint day/time left blank.
        arr_day_id: null,
        arr_time: '10:00',
      }).success,
    ).toBe(true);
  });

  it('accepts a train leg and a leg that carries times only', () => {
    expect(
      transportLegInputSchema.safeParse({
        from: 'Basel SBB', to: 'Lugano', train_number: 'EC 57', platform: '8',
        dep_day_id: null, dep_time: '08:33', arr_day_id: null, arr_time: '11:20',
      }).success,
    ).toBe(true);
    // from/to may be omitted: a writer can fill them from the endpoint codes.
    expect(transportLegInputSchema.safeParse({ dep_time: '09:00', arr_time: '10:00' }).success).toBe(true);
    expect(transportLegInputSchema.safeParse({}).success).toBe(true);
  });

  it('rejects day ids that are not positive integers and blank labels', () => {
    expect(transportLegInputSchema.safeParse({ dep_day_id: 'x' }).success).toBe(false);
    expect(transportLegInputSchema.safeParse({ dep_day_id: 0 }).success).toBe(false);
    expect(transportLegInputSchema.safeParse({ arr_day_id: 2.5 }).success).toBe(false);
    expect(transportLegInputSchema.safeParse({ from: '' }).success).toBe(false);
    expect(transportLegInputSchema.safeParse({ dep_time: 42 }).success).toBe(false);
  });

  it('accepts a per-segment booking reference and its absence (#1943)', () => {
    expect(
      transportLegInputSchema.safeParse({ from: 'AMS', to: 'CDG', confirmation_number: 'ABC123' }).success,
    ).toBe(true);
    // null is what a form writes for a segment the user left blank.
    expect(transportLegInputSchema.safeParse({ confirmation_number: null }).success).toBe(true);
    // Same ceiling as the reservation-level reference on the MCP tools.
    expect(transportLegInputSchema.safeParse({ confirmation_number: 'A'.repeat(100) }).success).toBe(true);
    expect(transportLegInputSchema.safeParse({ confirmation_number: 'A'.repeat(101) }).success).toBe(false);
  });

  it('parses a whole leg list', () => {
    const parsed = transportLegsInputSchema.safeParse([
      { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00' },
      { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
    ]);
    expect(parsed.success).toBe(true);
    expect(transportLegsInputSchema.safeParse([{ dep_day_id: -1 }]).success).toBe(false);
  });
});
