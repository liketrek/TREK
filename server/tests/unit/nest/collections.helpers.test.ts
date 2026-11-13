/**
 * The pure helpers of the collections domain: the link helpers, which read and
 * write the JSON TEXT column a list or a saved place keeps its links in, and the
 * listing fields an update writes. COLLECTIONS-HELPERS-001 to 005.
 */
import { listingWriteOf, parseLinks, serializeLinks } from '../../../src/nest/collections/collections.helpers';

import { describe, expect, it } from 'vitest';

const links = [{ url: 'https://menu.example/', label: 'Menu' }];

describe('parseLinks', () => {
  it('COLLECTIONS-HELPERS-001: reads a stored array of links back', () => {
    expect(parseLinks(JSON.stringify(links))).toEqual(links);
  });

  it('COLLECTIONS-HELPERS-002: answers undefined for a missing, empty, unreadable or non-array value', () => {
    expect(parseLinks(null)).toBeUndefined();
    expect(parseLinks('')).toBeUndefined();
    expect(parseLinks('{not json')).toBeUndefined();
    expect(parseLinks(JSON.stringify(links[0]))).toBeUndefined();
  });
});

describe('serializeLinks', () => {
  it('COLLECTIONS-HELPERS-003: writes links as JSON and no links as null', () => {
    expect(serializeLinks(links)).toBe(JSON.stringify(links));
    expect(serializeLinks([])).toBeNull();
    expect(serializeLinks(undefined)).toBeNull();
  });
});

describe('listingWriteOf', () => {
  it('COLLECTIONS-HELPERS-004: writes each provider id, contact and price field the update names, null clearing it', () => {
    expect(
      listingWriteOf({
        google_place_id: 'ChIJseptime',
        google_ftid: null,
        osm_id: 'node/42',
        website: 'https://septime-charonne.fr',
        phone: null,
        price: 0,
        currency: 'EUR',
      }),
    ).toEqual({
      google_place_id: 'ChIJseptime',
      google_ftid: null,
      osm_id: 'node/42',
      website: 'https://septime-charonne.fr',
      phone: null,
      price: 0,
      currency: 'EUR',
    });
  });

  it('COLLECTIONS-HELPERS-005: leaves out what the update does not name, so the stored value stays', () => {
    expect(listingWriteOf({ name: 'Septime', notes: 'Book ahead' })).toEqual({});
    expect(listingWriteOf({ website: undefined, phone: '+33 1' })).toEqual({ phone: '+33 1' });
  });
});
