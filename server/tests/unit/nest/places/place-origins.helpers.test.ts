/**
 * The origin rules: which fields a write changed, what a provider handed out
 * for a place according to the cached records, and which origin a changed
 * value is stored with for each kind of writer.
 */
import type { PlaceShareableRow } from '../../../../src/db/repositories/PlaceFieldOrigin.repository';
import {
  changedFields,
  needsProviders,
  originFor,
  providerIdsOf,
  providerValuesOf,
  sameValue,
  snapshotOf,
  type OriginWriter,
  type ProviderValue,
} from '../../../../src/nest/places/place-origins.helpers';
import type { PlaceFieldOrigins } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const ROW: PlaceShareableRow = {
  id: 7,
  name: 'Café Luna',
  lat: 54.08,
  lng: 12.13,
  address: 'Strandstraße 1, Rostock',
  osm_id: 'gers:ceba0e62-172b-4343-bb3b-78b915a18383',
  google_place_id: null,
  amap_poi_id: null,
  website: 'https://cafe-luna.de/',
  phone: '+49 381 1234',
  email: '',
  opening_hours: null,
  description: 'Coffee by the sea.',
  image_url: '/uploads/places/luna.jpg',
};

const client = (claims: PlaceFieldOrigins | undefined): OriginWriter => ({ kind: 'client', claims });

describe('snapshots and changes', () => {
  it('POH-001: reads the six shareable columns, an empty text as none', () => {
    expect(snapshotOf(ROW)).toEqual({
      website: 'https://cafe-luna.de/',
      phone: '+49 381 1234',
      email: null,
      opening_hours: null,
      description: 'Coffee by the sea.',
      image: '/uploads/places/luna.jpg',
    });
  });

  it('POH-002: a new place changed every field it holds; an update only what moved', () => {
    const after = snapshotOf(ROW);
    expect(changedFields(null, after)).toEqual(['website', 'phone', 'description', 'image']);
    expect(changedFields(after, { ...after, phone: '+49 381 9999', email: 'hi@cafe-luna.de' })).toEqual([
      'phone',
      'email',
    ]);
    expect(changedFields(after, { ...after, image: null })).toEqual(['image']);
    expect(changedFields(after, after)).toEqual([]);
  });

  it('POH-003: the provider ids are the ones the place carries', () => {
    expect(providerIdsOf(ROW)).toEqual(['gers:ceba0e62-172b-4343-bb3b-78b915a18383']);
    expect(providerIdsOf({ ...ROW, google_place_id: 'ChIJ1', amap_poi_id: ' ', osm_id: null })).toEqual(['ChIJ1']);
  });
});

describe('providerValuesOf', () => {
  it('POH-010: reads contact details from a details record, by the provider its id names', () => {
    const values = providerValuesOf([
      {
        place_id: 'ChIJ1',
        expanded: 0,
        payload_json: JSON.stringify({ website: 'https://a.example', phone: '+1 555', email: null }),
      },
      { place_id: 'node:5', expanded: 0, payload_json: JSON.stringify({ phone: '+49 1' }) },
      { place_id: 'amap:B1', expanded: 0, payload_json: JSON.stringify({ email: 'x@y.cn' }) },
      { place_id: 'gers:abc', expanded: 0, payload_json: JSON.stringify({ description: 'Index text' }) },
    ]);
    expect(values).toEqual([
      { field: 'website', value: 'https://a.example', origin: 'google' },
      { field: 'phone', value: '+1 555', origin: 'google' },
      { field: 'phone', value: '+49 1', origin: 'osm' },
      { field: 'email', value: 'x@y.cn', origin: 'amap' },
      { field: 'description', value: 'Index text', origin: 'trek' },
    ]);
  });

  it('POH-011: an enrichment record names the source of its description', () => {
    const values = providerValuesOf([
      {
        place_id: 'gers:abc',
        expanded: 2,
        payload_json: JSON.stringify({ description: { text: 'From the article', source: 'wikipedia' } }),
      },
      {
        place_id: 'gers:abc',
        expanded: 2,
        payload_json: JSON.stringify({ description: { text: 'From the site', source: 'website' } }),
      },
      {
        place_id: 'node:1',
        expanded: 2,
        payload_json: JSON.stringify({ description: { text: 'Something', source: 'mystery' } }),
      },
    ]);
    expect(values.map((value) => value.origin)).toEqual(['wikimedia', 'website', 'enrichment']);
  });

  it('POH-012: a broken record adds nothing', () => {
    expect(providerValuesOf([{ place_id: 'ChIJ1', expanded: 0, payload_json: '{not json' }])).toEqual([]);
    expect(providerValuesOf([{ place_id: 'ChIJ1', expanded: 0, payload_json: '[1,2]' }])).toEqual([]);
  });
});

describe('sameValue', () => {
  it('POH-020: compares values the way they are read', () => {
    expect(sameValue('website', 'cafe-luna.de', 'https://cafe-luna.de')).toBe(true);
    expect(sameValue('phone', '+49 (381) 12-34', '+493811234')).toBe(true);
    expect(sameValue('email', 'Info@Luna.de ', 'info@luna.de')).toBe(true);
    expect(sameValue('description', 'Coffee  by\nthe sea.', 'Coffee by the sea.')).toBe(true);
    expect(sameValue('phone', '+49 381 1', '+49 381 2')).toBe(false);
  });
});

describe('originFor', () => {
  const providers: ProviderValue[] = [{ field: 'website', value: 'https://cafe-luna.de/', origin: 'trek' }];

  it('POH-030: a deciding path gives its own origin to everything it changed', () => {
    expect(originFor('website', 'https://x.example', { kind: 'fixed', origin: 'agent' }, providers)).toBe('agent');
    expect(originFor('image', '/uploads/places/a.jpg', { kind: 'fixed', origin: 'user' }, [])).toBe('user');
  });

  it('POH-031: a client is believed for a provider and for what no provider handed out', () => {
    expect(originFor('phone', '+49 1', client({ phone: 'google' }), providers)).toBe('google');
    expect(originFor('website', 'https://other.example', client({ website: 'user' }), providers)).toBe('user');
  });

  it('POH-032: a value claimed as typed that a provider handed out is the provider', () => {
    expect(originFor('website', 'cafe-luna.de/', client({ website: 'user' }), providers)).toBe('trek');
  });

  it('POH-033: no claim is unknown, and so is a picture a client calls its own', () => {
    expect(originFor('website', 'https://x.example', client(undefined), providers)).toBe('unknown');
    expect(originFor('phone', '+49 1', client({ website: 'user' }), providers)).toBe('unknown');
    expect(originFor('image', '/uploads/places/a.jpg', client({ image: 'user' }), [])).toBe('unknown');
    expect(originFor('image', '/api/maps/place-photo/x', client({ image: 'enrichment' }), [])).toBe('enrichment');
  });

  it('POH-034: the cached records are read only for a client claiming a typed value', () => {
    expect(needsProviders(client({ website: 'user' }), ['website'])).toBe(true);
    expect(needsProviders(client({ website: 'user' }), ['phone'])).toBe(false);
    expect(needsProviders(client({ website: 'trek' }), ['website'])).toBe(false);
    expect(needsProviders({ kind: 'fixed', origin: 'agent' }, ['website'])).toBe(false);
  });
});
