import { categorySchema, createCategoryRequestSchema, updateCategoryRequestSchema } from './category.schema';

import { describe, it, expect } from 'vitest';

describe('categorySchema', () => {
  it('accepts a full category', () => {
    expect(
      categorySchema.safeParse({
        id: 1,
        name: 'Food',
        color: '#fff',
        icon: '🍔',
      }).success,
    ).toBe(true);
  });
});

describe('createCategoryRequestSchema', () => {
  it('requires a non-empty name; colour and icon are optional', () => {
    expect(createCategoryRequestSchema.safeParse({ name: 'Food' }).success).toBe(true);
    expect(createCategoryRequestSchema.safeParse({ name: '' }).success).toBe(false);
    expect(createCategoryRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('updateCategoryRequestSchema', () => {
  it('allows every field to be omitted (the service COALESCEs)', () => {
    expect(updateCategoryRequestSchema.safeParse({}).success).toBe(true);
    expect(updateCategoryRequestSchema.safeParse({ color: '#000' }).success).toBe(true);
  });
});
