import {
  packingCreateItemRequestSchema,
  packingImportRequestSchema,
  packingCreateBagRequestSchema,
  packingSaveTemplateRequestSchema,
} from './packing.schema';

import { describe, it, expect } from 'vitest';

describe('packingCreateItemRequestSchema', () => {
  it('requires a non-empty name; category/checked optional', () => {
    expect(packingCreateItemRequestSchema.safeParse({ name: 'Socks' }).success).toBe(true);
    expect(
      packingCreateItemRequestSchema.safeParse({
        name: 'Socks',
        category: 'Clothes',
        checked: true,
      }).success,
    ).toBe(true);
    expect(packingCreateItemRequestSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('carries weight_grams, bag_id and quantity like the update schema (#2154)', () => {
    const parsed = packingCreateItemRequestSchema.safeParse({
      name: 'Tent',
      weight_grams: 300,
      bag_id: 19,
      quantity: 3,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual({ name: 'Tent', weight_grams: 300, bag_id: 19, quantity: 3 });
    // Nullable, mirroring the update contract.
    expect(packingCreateItemRequestSchema.safeParse({ name: 'Tent', weight_grams: null, bag_id: null }).success).toBe(
      true,
    );
    expect(packingCreateItemRequestSchema.safeParse({ name: 'Tent', bag_id: 'carry-on' }).success).toBe(false);
  });

  it('still strips unknown keys — camelCase was never part of the contract', () => {
    const parsed = packingCreateItemRequestSchema.safeParse({ name: 'Tent', weightGrams: 300, bagId: 19 });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual({ name: 'Tent' });
  });
});

describe('packingImportRequestSchema', () => {
  it('accepts an array of open item rows', () => {
    expect(
      packingImportRequestSchema.safeParse({
        items: [{ name: 'a' }, { name: 'b', anything: 1 }],
      }).success,
    ).toBe(true);
  });
});

describe('packingCreateBagRequestSchema', () => {
  it('requires a name', () => {
    expect(packingCreateBagRequestSchema.safeParse({ name: 'Carry-on' }).success).toBe(true);
    expect(packingCreateBagRequestSchema.safeParse({}).success).toBe(false);
  });

  it('carries weight_limit_grams like the update schema (#2154)', () => {
    const parsed = packingCreateBagRequestSchema.safeParse({ name: 'Backpack', weight_limit_grams: 8000 });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual({ name: 'Backpack', weight_limit_grams: 8000 });
    expect(packingCreateBagRequestSchema.safeParse({ name: 'Backpack', weight_limit_grams: null }).success).toBe(true);
    expect(packingCreateBagRequestSchema.safeParse({ name: 'Backpack', weight_limit_grams: 'heavy' }).success).toBe(
      false,
    );
  });
});

describe('packingSaveTemplateRequestSchema', () => {
  it('requires a name', () => {
    expect(packingSaveTemplateRequestSchema.safeParse({ name: 'Summer' }).success).toBe(true);
    expect(packingSaveTemplateRequestSchema.safeParse({ name: '' }).success).toBe(false);
  });
});
