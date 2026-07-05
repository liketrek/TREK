import { collectionPlaceUpdateRequestSchema } from './collection.schema';

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
});
