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
});

describe('packingSaveTemplateRequestSchema', () => {
  it('requires a name', () => {
    expect(packingSaveTemplateRequestSchema.safeParse({ name: 'Summer' }).success).toBe(true);
    expect(packingSaveTemplateRequestSchema.safeParse({ name: '' }).success).toBe(false);
  });
});
