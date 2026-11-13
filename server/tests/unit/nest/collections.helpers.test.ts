/**
 * The pure helpers of the collections domain: the link helpers, which read and
 * write the JSON TEXT column a list or a saved place keeps its links in, the
 * listing fields an update writes, the cursor of a page of places, and a saved
 * place as the list file carries it. COLLECTIONS-HELPERS-001 to 009.
 */
import type { CollectionPlaceRow } from '../../../src/db/repositories/Collections.repository';
import {
  decodePlacesCursor,
  encodePlacesCursor,
  filePlaceOf,
  listingWriteOf,
  parseLinks,
  serializeLinks,
} from '../../../src/nest/collections/collections.helpers';

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

describe('encodePlacesCursor / decodePlacesCursor', () => {
  it('COLLECTIONS-HELPERS-006: a cursor gives back the position it was made from', () => {
    const position = { sortOrder: 3, createdAt: '2026-05-01 10:00:00', id: 42 };
    const cursor = encodePlacesCursor(position);
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePlacesCursor(cursor)).toEqual(position);
    expect(decodePlacesCursor(encodePlacesCursor({ sortOrder: -1, createdAt: '', id: 1 }))).toEqual({
      sortOrder: -1,
      createdAt: '',
      id: 1,
    });
  });

  it('COLLECTIONS-HELPERS-007: anything else reads as no position', () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    expect(decodePlacesCursor('not-a-cursor')).toBeNull();
    expect(decodePlacesCursor('')).toBeNull();
    expect(decodePlacesCursor(encode({ id: 1 }))).toBeNull();
    expect(decodePlacesCursor(encode([0, '2026-05-01 10:00:00']))).toBeNull();
    expect(decodePlacesCursor(encode([0.5, '2026-05-01 10:00:00', 1]))).toBeNull();
    expect(decodePlacesCursor(encode([0, '2026-05-01 10:00:00', 0]))).toBeNull();
  });
});

describe('filePlaceOf', () => {
  const row: CollectionPlaceRow = {
    id: 9,
    collection_id: 4,
    owner_id: 1,
    saved_by: 1,
    name: 'Septime',
    description: 'Natural wine',
    lat: 48.853,
    lng: 2.381,
    address: '80 Rue de Charonne',
    category_id: 3,
    price: 45,
    currency: 'EUR',
    notes: 'Book ahead',
    image_url: 'https://images.example/septime.jpg',
    google_place_id: 'ChIJseptime',
    google_ftid: null,
    osm_id: 'node/42',
    website: 'https://septime-charonne.fr',
    phone: '+33 1 43 67 38 29',
    status: 'revisit',
    source_trip_id: 7,
    source_place_id: 70,
    links: JSON.stringify(links),
    sort_order: 0,
    created_at: '2026-05-01 10:00:00',
    updated_at: null,
    category_name: 'Restaurant',
    category_color: '#ff0000',
    category_icon: 'utensils',
  };

  it('COLLECTIONS-HELPERS-008: a saved place as the list file carries it: no ids, the category by name, the labels given', () => {
    expect(filePlaceOf(row, ['Dinner'])).toEqual({
      name: 'Septime',
      description: 'Natural wine',
      lat: 48.853,
      lng: 2.381,
      address: '80 Rue de Charonne',
      notes: 'Book ahead',
      price: 45,
      currency: 'EUR',
      website: 'https://septime-charonne.fr',
      phone: '+33 1 43 67 38 29',
      image_url: 'https://images.example/septime.jpg',
      google_place_id: 'ChIJseptime',
      google_ftid: null,
      osm_id: 'node/42',
      status: 'revisit',
      links,
      category: 'Restaurant',
      labels: ['Dinner'],
    });
  });

  it('COLLECTIONS-HELPERS-009: an upload of this server stays behind, it resolves nowhere else', () => {
    expect(filePlaceOf({ ...row, image_url: '/uploads/places/septime.jpg' }, []).image_url).toBeNull();
    expect(filePlaceOf({ ...row, image_url: null, links: null }, [])).toMatchObject({
      image_url: null,
      links: undefined,
    });
  });
});
