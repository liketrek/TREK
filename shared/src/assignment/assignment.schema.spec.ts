import {
  assignmentCreateRequestSchema,
  assignmentMoveRequestSchema,
  assignmentParticipantsRequestSchema,
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
  it('requires new_day_id; order_index optional', () => {
    expect(assignmentMoveRequestSchema.safeParse({ new_day_id: 4 }).success).toBe(true);
    expect(assignmentMoveRequestSchema.safeParse({ new_day_id: 4, order_index: 0 }).success).toBe(true);
    expect(assignmentMoveRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('assignmentParticipantsRequestSchema', () => {
  it('requires a numeric user_ids array', () => {
    expect(assignmentParticipantsRequestSchema.safeParse({ user_ids: [1, 2] }).success).toBe(true);
    expect(assignmentParticipantsRequestSchema.safeParse({ user_ids: 'no' }).success).toBe(false);
  });
});
