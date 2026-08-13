import {
  collectionDeleteManyRequestSchema,
  collectionPlaceUpdateRequestSchema,
  collectionReorderRequestSchema,
  collectionSavePlaceRequestSchema,
} from './collection.schema';

import { describe, expect, it } from 'vitest';

describe('collectionPlaceUpdateRequestSchema', () => {
  // Regression for #1437: an update that omits `status` must NOT inject a default
  // of 'idea', otherwise the server overwrites the stored status on every edit-save.
  it('does not inject a status when the field is absent', () => {
    const parsed = collectionPlaceUpdateRequestSchema.parse({ name: 'Trevi Fountain' });
    expect('status' in parsed).toBe(false);
    expect(parsed.status).toBeUndefined();
  });

  it('passes through an explicitly provided status', () => {
    expect(collectionPlaceUpdateRequestSchema.parse({ status: 'want' }).status).toBe('want');
    expect(collectionPlaceUpdateRequestSchema.parse({ status: 'visited' }).status).toBe('visited');
  });

  it('catches an invalid status back to idea rather than throwing', () => {
    expect(collectionPlaceUpdateRequestSchema.parse({ status: 'bogus' as never }).status).toBe('idea');
  });

  // #1870: the update contract knew no `address`, so the validation pipe stripped
  // it and the address of a saved place could never be corrected.
  it('passes an address through and accepts null to clear it', () => {
    expect(collectionPlaceUpdateRequestSchema.parse({ address: 'Via Nuova 1' }).address).toBe('Via Nuova 1');
    expect(collectionPlaceUpdateRequestSchema.parse({ address: null }).address).toBeNull();
  });

  it('leaves an absent address absent, so an unrelated edit keeps the stored one', () => {
    const parsed = collectionPlaceUpdateRequestSchema.parse({ name: 'Trevi Fountain' });
    expect('address' in parsed).toBe(false);
    expect(parsed.address).toBeUndefined();
  });

  // Save and update must cap the address the same way (neither does): a limit on
  // one side only would reject on edit what saving accepted.
  it('caps the address on neither the save nor the update side', () => {
    const long = 'x'.repeat(5000);
    expect(collectionPlaceUpdateRequestSchema.parse({ address: long }).address).toBe(long);
    expect(collectionSavePlaceRequestSchema.parse({ collection_id: 1, name: 'X', address: long }).address).toBe(long);
  });
});

// The two ratchet schemas replace hand-rolled "array of numbers" checks — they
// must stay exactly that permissive (empty arrays included, no int/positive).
describe('collectionReorderRequestSchema / collectionDeleteManyRequestSchema', () => {
  it('accepts any array of numbers, empty included', () => {
    expect(collectionReorderRequestSchema.parse({ orderedIds: [] }).orderedIds).toEqual([]);
    expect(collectionReorderRequestSchema.parse({ orderedIds: [3, 1, 2] }).orderedIds).toEqual([3, 1, 2]);
    expect(collectionDeleteManyRequestSchema.parse({ ids: [] }).ids).toEqual([]);
    expect(collectionDeleteManyRequestSchema.parse({ ids: [7] }).ids).toEqual([7]);
  });

  it('rejects non-arrays and non-numeric members', () => {
    expect(() => collectionReorderRequestSchema.parse({ orderedIds: 'nope' })).toThrow();
    expect(() => collectionReorderRequestSchema.parse({})).toThrow();
    expect(() => collectionDeleteManyRequestSchema.parse({ ids: ['a'] })).toThrow();
  });
});
