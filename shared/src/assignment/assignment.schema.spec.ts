import {
  assignmentCreateRequestSchema,
  assignmentMoveRequestSchema,
  assignmentParticipantsRequestSchema,
  assignmentTransportRequestSchema,
} from './assignment.schema';

import { describe, it, expect } from 'vitest';

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
