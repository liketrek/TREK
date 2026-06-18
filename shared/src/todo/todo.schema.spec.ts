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
});

describe('todoUpdateItemRequestSchema', () => {
  it('allows every field to be omitted and accepts checked', () => {
    expect(todoUpdateItemRequestSchema.safeParse({}).success).toBe(true);
    expect(todoUpdateItemRequestSchema.safeParse({ checked: true }).success).toBe(true);
  });
});

describe('todoReorderRequestSchema', () => {
  it('requires an array of numeric ids', () => {
    expect(todoReorderRequestSchema.safeParse({ orderedIds: [1, 2, 3] }).success).toBe(true);
    expect(todoReorderRequestSchema.safeParse({ orderedIds: ['a'] }).success).toBe(false);
  });
});
