import {
  collectionDeleteManyRequestSchema,
  collectionItemsRequestSchema,
  collectionMembershipSchema,
  collectionPlaceUpdateRequestSchema,
  collectionReorderRequestSchema,
  collectionSavePlaceRequestSchema,
  collectionStatusSchema,
  isVisitedCollectionStatus,
} from './collection.schema';

import { describe, expect, it } from 'vitest';

describe('collectionStatusSchema', () => {
  // #2567: "want to revisit" is a status of its own, stored as it is.
  it('accepts revisit next to the first three', () => {
    for (const status of ['idea', 'want', 'visited', 'revisit'] as const) {
      expect(collectionStatusSchema.parse(status)).toBe(status);
    }
  });

  it('counts revisit as visited, and nothing before it', () => {
    expect(isVisitedCollectionStatus('visited')).toBe(true);
    expect(isVisitedCollectionStatus('revisit')).toBe(true);
    expect(isVisitedCollectionStatus('want')).toBe(false);
    expect(isVisitedCollectionStatus('idea')).toBe(false);
  });
});

describe('collectionPlaceUpdateRequestSchema', () => {
  // #2646: the fields saving takes, with the same checks, so a place is corrected in place.
  it('takes the provider ids, website, phone and price, and null clears each', () => {
    const set = {
      google_place_id: 'ChIJseptime',
      google_ftid: '0x47e6:0x1b2',
      osm_id: 'node/42',
      website: 'https://septime-charonne.fr',
      phone: '+33 1 43 67 38 29',
      price: 55,
      currency: 'EUR',
    };
    expect(collectionPlaceUpdateRequestSchema.parse(set)).toEqual(set);
    const cleared = Object.fromEntries(Object.keys(set).map((key) => [key, null]));
    expect(collectionPlaceUpdateRequestSchema.parse(cleared)).toEqual(cleared);
  });

  it('normalises a bare domain as website and refuses a script link, as saving does', () => {
    expect(collectionPlaceUpdateRequestSchema.parse({ website: 'septime-charonne.fr' }).website).toBe(
      'https://septime-charonne.fr',
    );
    expect(collectionPlaceUpdateRequestSchema.safeParse({ website: 'javascript:alert(1)' }).success).toBe(false);
  });

  it('leaves the new fields absent when an update does not name them', () => {
    const parsed = collectionPlaceUpdateRequestSchema.parse({ name: 'Septime' });
    for (const key of ['google_place_id', 'google_ftid', 'osm_id', 'website', 'phone', 'price', 'currency']) {
      expect(key in parsed, key).toBe(false);
    }
  });

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

describe('collectionItemsRequestSchema', () => {
  it('takes saved place and label ids, each optional, at most 50 places and 20 labels', () => {
    expect(collectionItemsRequestSchema.parse({})).toEqual({});
    const ids = (count: number) => Array.from({ length: count }, (_, i) => i + 1);
    const asked = { placeIds: [1, 2], labelIds: [3] };
    expect(collectionItemsRequestSchema.parse(asked)).toEqual(asked);
    expect(() => collectionItemsRequestSchema.parse({ placeIds: ids(51) })).toThrow();
    expect(() => collectionItemsRequestSchema.parse({ labelIds: ids(21) })).toThrow();
    expect(() => collectionItemsRequestSchema.parse({ placeIds: [0] })).toThrow();
  });
});

describe('collectionMembershipSchema', () => {
  it("reads a list's colour where the server sends it, and a list without one from an older server", () => {
    const list = { collection_id: 1, name: 'Paris', place_id: 2, status: 'want', can_edit: true };
    const coloured = collectionMembershipSchema.parse({ saved: true, lists: [{ ...list, color: '#e11d48' }] });
    expect(coloured.lists[0]?.color).toBe('#e11d48');
    expect(collectionMembershipSchema.parse({ saved: true, lists: [list] }).lists[0]?.color).toBeUndefined();
  });
});
