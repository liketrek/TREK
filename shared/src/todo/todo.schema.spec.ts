import { todoCreateItemRequestSchema, todoUpdateItemRequestSchema, todoReorderRequestSchema } from './todo.schema';

import { describe, it, expect } from 'vitest';

describe('todoCreateItemRequestSchema', () => {
  it('requires a name; metadata optional with the service shapes', () => {
    expect(todoCreateItemRequestSchema.safeParse({ name: 'Book hotel' }).success).toBe(true);
    expect(
      todoCreateItemRequestSchema.safeParse({
        name: 'X',
        due_date: '2026-07-01',
        priority: 2,
        assigned_user_id: 3,
      }).success,
    ).toBe(true);
    expect(todoCreateItemRequestSchema.safeParse({ name: '' }).success).toBe(false);
    // priority is numeric (matches the service), not a string
    expect(todoCreateItemRequestSchema.safeParse({ name: 'X', priority: 'high' }).success).toBe(false);
  });

  it('accepts explicit null on the optional metadata fields (client clears with null)', () => {
    expect(
      todoCreateItemRequestSchema.safeParse({
        name: 'X',
        category: null,
        due_date: null,
        description: null,
        assigned_user_id: null,
      }).success,
    ).toBe(true);
  });
});

describe('todoUpdateItemRequestSchema', () => {
  it('allows every field to be omitted and accepts checked', () => {
    expect(todoUpdateItemRequestSchema.safeParse({}).success).toBe(true);
    expect(todoUpdateItemRequestSchema.safeParse({ checked: true }).success).toBe(true);
  });

  it('accepts checked as 0/1 (legacy numeric form) but rejects other numbers', () => {
    expect(todoUpdateItemRequestSchema.safeParse({ checked: 1 }).success).toBe(true);
    expect(todoUpdateItemRequestSchema.safeParse({ checked: 0 }).success).toBe(true);
    expect(todoUpdateItemRequestSchema.safeParse({ checked: 2 }).success).toBe(false);
  });

  it('accepts explicit null on the nullable fields (bodyKeys clear protocol)', () => {
    expect(
      todoUpdateItemRequestSchema.safeParse({
        category: null,
        due_date: null,
        description: null,
        assigned_user_id: null,
        priority: null,
      }).success,
    ).toBe(true);
    expect(todoUpdateItemRequestSchema.safeParse({ name: null }).success).toBe(false);
  });
});

describe('todoReorderRequestSchema', () => {
  it('requires an array of numeric ids', () => {
    expect(todoReorderRequestSchema.safeParse({ orderedIds: [1, 2, 3] }).success).toBe(true);
    expect(todoReorderRequestSchema.safeParse({ orderedIds: ['a'] }).success).toBe(false);
  });
});
