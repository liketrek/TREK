import { placeCreateRequestSchema, placeBulkDeleteRequestSchema, placeImportListRequestSchema } from './place.schema';

import { describe, it, expect } from 'vitest';

describe('placeCreateRequestSchema', () => {
  it('requires a name and keeps the other place fields open', () => {
    expect(
      placeCreateRequestSchema.safeParse({
        name: 'Spot',
        lat: 1,
        lng: 2,
        anything: true,
      }).success,
    ).toBe(true);
    expect(placeCreateRequestSchema.safeParse({ lat: 1 }).success).toBe(false);
  });
});

describe('placeBulkDeleteRequestSchema', () => {
  it('requires a numeric ids array', () => {
    expect(placeBulkDeleteRequestSchema.safeParse({ ids: [1, 2] }).success).toBe(true);
    expect(placeBulkDeleteRequestSchema.safeParse({ ids: ['a'] }).success).toBe(false);
  });
});

describe('placeImportListRequestSchema', () => {
  it('requires a non-empty url', () => {
    expect(placeImportListRequestSchema.safeParse({ url: 'http://x' }).success).toBe(true);
    expect(placeImportListRequestSchema.safeParse({ url: '' }).success).toBe(false);
  });
});
