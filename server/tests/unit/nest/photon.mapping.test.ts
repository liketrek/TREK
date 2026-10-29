/**
 * PHOTON-MAP-001..012: Photon's answers read into the shape Nominatim gives,
 * and the language Photon is asked in.
 */
import {
  asNominatimHit,
  asNominatimReverse,
  photonAnswerSchema,
  photonDisplayName,
  photonLang,
  type PhotonFeature,
} from '../../../src/nest/maps/providers/photon.mapping';
import { gateFeature } from '../../helpers/photon';

import { describe, expect, it } from 'vitest';

const feature = (properties: Record<string, unknown> = {}): PhotonFeature =>
  photonAnswerSchema.parse({ features: [gateFeature(properties)] }).features[0];

describe('photonLang', () => {
  it('PHOTON-MAP-001: asks in the languages the import holds names for', () => {
    expect(photonLang('de')).toBe('de');
    expect(photonLang('en')).toBe('en');
    expect(photonLang('ja')).toBe('ja');
  });

  it("PHOTON-MAP-002: reads TREK's own codes through toApiLang first", () => {
    expect(photonLang('br')).toBe('pt');
    expect(photonLang('gr')).toBe('el');
  });

  it('PHOTON-MAP-003: drops the region, whatever its case', () => {
    expect(photonLang('pt-BR')).toBe('pt');
    expect(photonLang('zh-TW')).toBe('zh');
    expect(photonLang('EN-gb')).toBe('en');
  });

  it('PHOTON-MAP-004: asks for the names on the spot in a language without names, and without one', () => {
    expect(photonLang('eo')).toBe('default');
    expect(photonLang('xx-YY')).toBe('default');
    expect(photonLang(undefined)).toBe('default');
    expect(photonLang('  ')).toBe('default');
  });
});

describe('photonDisplayName', () => {
  it('PHOTON-MAP-005: names the place, then the street, quarter, town, region, postcode and country', () => {
    expect(photonDisplayName(feature({ housenumber: '1' }).properties)).toBe(
      'Brandenburger Tor, Pariser Platz 1, Mitte, Berlin, 10117, Deutschland',
    );
  });

  it('PHOTON-MAP-006: leaves out what is missing and what repeats', () => {
    const city = feature({ name: 'Berlin', street: undefined, district: undefined, postcode: undefined, type: 'city' });
    expect(photonDisplayName(city.properties)).toBe('Berlin, Deutschland');
  });
});

describe('asNominatimHit', () => {
  it('PHOTON-MAP-007: spells the hit the way a Nominatim search row is spelt', () => {
    expect(asNominatimHit(feature())).toEqual({
      osm_type: 'way',
      osm_id: '518071791',
      class: 'tourism',
      type: 'attraction',
      name: 'Brandenburger Tor',
      display_name: 'Brandenburger Tor, Pariser Platz, Mitte, Berlin, 10117, Deutschland',
      lat: '52.5163',
      lon: '13.3777',
      extratags: { wikidata: 'Q82425', wikipedia: 'de:Brandenburger Tor' },
    });
  });

  it('PHOTON-MAP-008: names nodes and relations in full, and keeps only text tags', () => {
    expect(asNominatimHit(feature({ osm_type: 'N' }))?.osm_type).toBe('node');
    expect(asNominatimHit(feature({ osm_type: 'R' }))?.osm_type).toBe('relation');
    expect(asNominatimHit(feature({ extra: { wikidata: 'Q1', capacity: 12 } }))?.extratags).toEqual({ wikidata: 'Q1' });
    expect(asNominatimHit(feature({ extra: undefined }))?.extratags).toBeNull();
  });

  it('PHOTON-MAP-009: has nothing for a hit without an OpenStreetMap id', () => {
    expect(asNominatimHit(feature({ osm_type: undefined }))).toBeNull();
    expect(asNominatimHit(feature({ osm_type: 'X' }))).toBeNull();
    expect(asNominatimHit(feature({ osm_id: undefined }))).toBeNull();
  });
});

describe('asNominatimReverse', () => {
  it('PHOTON-MAP-010: fills the address fields Nominatim fills, the sight under its main tag', () => {
    expect(asNominatimReverse(feature({ housenumber: '1' }))).toEqual({
      display_name: 'Brandenburger Tor, Pariser Platz 1, Mitte, Berlin, 10117, Deutschland',
      name: 'Brandenburger Tor',
      address: {
        road: 'Pariser Platz',
        house_number: '1',
        postcode: '10117',
        suburb: 'Mitte',
        city: 'Berlin',
        state: 'Berlin',
        country: 'Deutschland',
        country_code: 'de',
        tourism: 'Brandenburger Tor',
      },
    });
  });

  it('PHOTON-MAP-011: makes a town its own city and files nothing more under its tag', () => {
    const town = feature({ name: 'Warnemünde', type: 'city', osm_key: 'place', city: undefined, street: undefined });
    const reverse = asNominatimReverse(town);
    expect(reverse.address?.city).toBe('Warnemünde');
    expect(reverse.address).not.toHaveProperty('place');
  });

  it('PHOTON-MAP-012: a feature with nothing to name has no display name', () => {
    const bare = photonAnswerSchema.parse({ features: [{ geometry: { coordinates: [0, 0] }, properties: {} }] });
    expect(asNominatimReverse(bare.features[0])).toEqual({ display_name: undefined, name: undefined, address: {} });
  });
});
