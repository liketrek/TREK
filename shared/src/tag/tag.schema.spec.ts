import { tagSchema, createTagRequestSchema, updateTagRequestSchema } from './tag.schema';

import { describe, it, expect } from 'vitest';

describe('tagSchema', () => {
  it('accepts a full tag', () => {
    expect(
      tagSchema.safeParse({
        id: 1,
        user_id: 5,
        name: 'Beach',
        color: '#10b981',
      }).success,
    ).toBe(true);
  });
});

describe('createTagRequestSchema', () => {
  it('requires a non-empty name; colour optional', () => {
    expect(createTagRequestSchema.safeParse({ name: 'Beach' }).success).toBe(true);
    expect(createTagRequestSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('updateTagRequestSchema', () => {
  it('allows every field to be omitted', () => {
    expect(updateTagRequestSchema.safeParse({}).success).toBe(true);
  });
});
