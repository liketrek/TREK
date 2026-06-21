import {
  assignmentCreateRequestSchema,
  assignmentMoveRequestSchema,
  assignmentParticipantsRequestSchema,
  assignmentTimeRequestSchema,
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

describe('assignmentTimeRequestSchema', () => {
  it('accepts duration only and rejects manual start/end times', () => {
    expect(assignmentTimeRequestSchema.safeParse({ place_time: '09:00', end_time: null }).success).toBe(false);
    expect(assignmentTimeRequestSchema.safeParse({ duration_minutes: 90 }).success).toBe(true);
    expect(assignmentTimeRequestSchema.safeParse({ duration_minutes: 90, margin_before_minutes: 0, margin_after_minutes: 15 }).success).toBe(true);
    expect(assignmentTimeRequestSchema.safeParse({ duration_minutes: 0 }).success).toBe(false);
    expect(assignmentTimeRequestSchema.safeParse({ margin_before_minutes: -1 }).success).toBe(false);
  });
});
