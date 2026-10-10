import {
  assignmentCreateRequestSchema,
  assignmentEndDayRequestSchema,
  assignmentMoveRequestSchema,
  assignmentParticipantsRequestSchema,
  assignmentSchema,
  assignmentTransportRequestSchema,
} from './assignment.schema';

import { describe, it, expect } from 'vitest';

describe('assignment Tours read-model merge', () => {
  const ordinary = { id: 1, day_id: 2, place_id: 3, order_index: 0, place: { id: 3, name: 'Place' } };

  it('keeps ordinary and legacy track places non-Tours without a facet identity', () => {
    expect(assignmentSchema.parse(ordinary).tour_place_id).toBeUndefined();
    const legacy = assignmentSchema.parse({ ...ordinary, tour_place_id: null, tour_route_geometry: null });
    expect(legacy.tour_place_id).toBeNull();
    expect(legacy.tour_route_geometry).toBeNull();
  });

  it('preserves nullable Tour fields, exclusion and incoming/outgoing segment modes', () => {
    const fields = {
      tour_place_id: 3,
      tour_route_geometry: '[[48,11],[49,12]]',
      route_excluded: true,
      leg_transport_mode: 'walking',
      incoming_leg_transport_mode: 'cycling',
    };
    expect(assignmentSchema.parse({ ...ordinary, ...fields })).toMatchObject(fields);
    expect(assignmentSchema.parse({ ...ordinary, tour_place_id: null, tour_route_geometry: null })).toMatchObject({
      tour_place_id: null,
      tour_route_geometry: null,
    });
  });

  it('does not copy read-only joined Tours fields into create or move requests', () => {
    const joined = { tour_place_id: 3, tour_route_geometry: '[[48,11],[49,12]]' };
    expect(assignmentCreateRequestSchema.parse({ place_id: 3, ...joined })).toEqual({ place_id: 3 });
    expect(assignmentMoveRequestSchema.parse({ new_day_id: 2, ...joined })).toEqual({ new_day_id: 2 });
  });
});

it('requires a boolean for an explicit day end', () => {
  expect(assignmentEndDayRequestSchema.parse({ end_day: true })).toEqual({ end_day: true });
  expect(assignmentEndDayRequestSchema.parse({ end_day: false })).toEqual({ end_day: false });
  for (const end_day of [1, 'true', null, undefined]) {
    expect(assignmentEndDayRequestSchema.safeParse({ end_day }).success).toBe(false);
  }
});

describe('assignmentCreateRequestSchema', () => {
  it('requires a place_id; notes optional/nullable', () => {
    expect(assignmentCreateRequestSchema.safeParse({ place_id: 2 }).success).toBe(true);
    expect(assignmentCreateRequestSchema.safeParse({ place_id: '2', notes: null }).success).toBe(true);
    expect(assignmentCreateRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('assignmentMoveRequestSchema', () => {
  it('requires new_day_id; order_index optional/nullable', () => {
    expect(assignmentMoveRequestSchema.safeParse({ new_day_id: 4 }).success).toBe(true);
    expect(assignmentMoveRequestSchema.safeParse({ new_day_id: 4, order_index: 0 }).success).toBe(true);
    // The client api sends `order_index: null` when no insert position is given.
    expect(assignmentMoveRequestSchema.safeParse({ new_day_id: 4, order_index: null }).success).toBe(true);
    expect(assignmentMoveRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('assignmentTransportRequestSchema', () => {
  it('accepts a mode, an explicit null, and an absent key (legacy `?? null`)', () => {
    expect(assignmentTransportRequestSchema.safeParse({ transport_mode: 'cycling' }).success).toBe(true);
    expect(assignmentTransportRequestSchema.safeParse({ transport_mode: null }).success).toBe(true);
    expect(assignmentTransportRequestSchema.safeParse({}).success).toBe(true);
    expect(assignmentTransportRequestSchema.safeParse({ transport_mode: 5 }).success).toBe(false);
  });
});

describe('assignmentParticipantsRequestSchema', () => {
  it('requires a numeric user_ids array', () => {
    expect(assignmentParticipantsRequestSchema.safeParse({ user_ids: [1, 2] }).success).toBe(true);
    expect(assignmentParticipantsRequestSchema.safeParse({ user_ids: 'no' }).success).toBe(false);
  });
});
