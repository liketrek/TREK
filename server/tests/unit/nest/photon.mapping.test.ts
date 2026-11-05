/**
 * PHOTON-MAP-001..029: Photon's answers read into the shape Nominatim gives,
 * the rows of the suggestion list, the lead the list opens on, and the
 * language Photon is asked in.
 */
import {
  asLead,
  editDistance,
  nameLike,
  pickLead,
  rankFeatures,
  asNominatimHit,
  asNominatimReverse,
  asSuggestion,
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
  it('PHOTON-MAP-005: names the place, then house number and street as Nominatim does, quarter, town, region, postcode and country', () => {
    expect(photonDisplayName(feature({ housenumber: '1' }).properties)).toBe(
      'Brandenburger Tor, 1, Pariser Platz, Mitte, Berlin, 10117, Deutschland',
    );
  });

  it('PHOTON-MAP-013: writes an address without a name the way Nominatim writes a house', () => {
    const house = feature({ name: undefined, housenumber: '77', street: 'Unter den Linden', postcode: undefined });
    expect(photonDisplayName(house.properties)).toBe('77, Unter den Linden, Mitte, Berlin, Deutschland');
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
      display_name: 'Brandenburger Tor, 1, Pariser Platz, Mitte, Berlin, 10117, Deutschland',
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

describe('asSuggestion', () => {
  it('PHOTON-MAP-014: titles the row by its name, with where it is below, in the id form the details lookup reads', () => {
    expect(asSuggestion(feature())).toEqual({
      placeId: 'way:518071791',
      mainText: 'Brandenburger Tor',
      secondaryText: 'Pariser Platz, Mitte, Berlin, Deutschland',
      source: 'openstreetmap',
      lat: 52.5163,
      lng: 13.3777,
    });
  });

  it('PHOTON-MAP-015: keeps a name that holds a comma whole, and titles a house without one by its number', () => {
    const bar = asSuggestion(feature({ name: 'Bar, Café Einstein' }));
    expect(bar?.mainText).toBe('Bar, Café Einstein');
    expect(bar?.secondaryText).toBe('Pariser Platz, Mitte, Berlin, Deutschland');

    const house = asSuggestion(
      feature({ name: undefined, housenumber: '77', street: 'Unter den Linden', postcode: undefined }),
    );
    expect(house?.mainText).toBe('77');
    expect(house?.secondaryText).toBe('Unter den Linden, Mitte, Berlin, Deutschland');
  });

  it('PHOTON-MAP-016: has no row for a hit without an id or anything to call it', () => {
    expect(asSuggestion(feature({ osm_id: undefined }))).toBeNull();
    const bare = photonAnswerSchema.parse({
      features: [{ geometry: { coordinates: [13.4, 52.5] }, properties: { osm_type: 'N', osm_id: 1 } }],
    });
    expect(asSuggestion(bare.features[0])).toBeNull();
  });
});

describe('asSuggestion, the line below the name', () => {
  it('PHOTON-MAP-017: leaves out postcode and county, and names the region only where there is no town', () => {
    const village = asSuggestion(
      feature({
        osm_key: 'place',
        osm_value: 'village',
        name: 'Berlin',
        street: undefined,
        postcode: '457130',
        district: undefined,
        city: undefined,
        county: 'Троицкий муниципальный округ',
        state: 'Chelyabinsk Oblast',
        country: 'Russia',
      }),
    );
    expect(village?.secondaryText).toBe('Chelyabinsk Oblast, Russia');
    expect(asSuggestion(feature({ county: 'Berlin', postcode: '10117' }))?.secondaryText).toBe(
      'Pariser Platz, Mitte, Berlin, Deutschland',
    );
  });
});

describe('asLead', () => {
  const city = (properties: Record<string, unknown> = {}) =>
    feature({
      osm_type: 'R',
      osm_id: 62422,
      osm_key: 'place',
      osm_value: 'city',
      type: 'city',
      name: 'Berlin',
      street: undefined,
      postcode: undefined,
      district: undefined,
      city: undefined,
      extent: [13.088345, 52.6755087, 13.7611609, 52.3382448],
      ...properties,
    });

  it('PHOTON-MAP-018: reads a town as a lead from nearby, with its extent', () => {
    expect(asLead(city())).toEqual({
      placeId: 'relation:62422',
      name: 'Berlin',
      reach: 'nearby',
      kind: 'city',
      lat: 52.5163,
      lng: 13.3777,
      extent: [13.088345, 52.6755087, 13.7611609, 52.3382448],
    });
  });

  it('PHOTON-MAP-019: reads a country or a region as a lead from everywhere, extent or none', () => {
    expect(asLead(city({ osm_value: 'country', type: 'country', name: 'Mauritania' }))?.reach).toBe('everywhere');
    // Tokyo is a province Photon files on its town layer.
    expect(asLead(city({ osm_value: 'province', name: 'Tokyo' }))?.reach).toBe('everywhere');
    expect(asLead(city({ extent: undefined }))?.extent).toBeNull();
  });

  it('PHOTON-MAP-020: has no lead for a sight, a street or a quarter', () => {
    expect(asLead(feature())).toBeNull();
    expect(asLead(city({ osm_key: 'highway', osm_value: 'primary', type: 'street' }))).toBeNull();
    expect(asLead(city({ osm_value: 'suburb', type: 'district' }))).toBeNull();
  });
});

describe('rankFeatures', () => {
  it('PHOTON-MAP-021: puts a place with a Wikidata link before its unlinked namesakes, Photon order otherwise', () => {
    const art = feature({
      osm_id: 1,
      osm_key: 'tourism',
      osm_value: 'artwork',
      extra: undefined,
      name: 'Neuschwanstein',
    });
    const castle = feature({ osm_id: 2, osm_key: 'tourism', osm_value: 'attraction', name: 'Schloss Neuschwanstein' });
    const street = feature({
      osm_id: 3,
      osm_key: 'highway',
      osm_value: 'residential',
      extra: undefined,
      name: 'Neuschwansteinstraße',
    });
    const shop = feature({
      osm_id: 4,
      osm_key: 'shop',
      osm_value: 'gift',
      extra: undefined,
      name: 'Neuschwanstein Souvenirs',
    });
    expect(rankFeatures([art, street, castle, shop]).map((f) => f.properties.osm_id)).toEqual([2, 1, 3, 4]);
    expect(rankFeatures([castle, art]).map((f) => f.properties.osm_id)).toEqual([2, 1]);
  });
});

describe('pickLead', () => {
  const town = (properties: Record<string, unknown>) =>
    feature({
      osm_key: 'place',
      osm_value: 'city',
      type: 'city',
      street: undefined,
      district: undefined,
      city: undefined,
      ...properties,
    });

  it('PHOTON-MAP-022: a country or region first leads under any name, so an exonym keeps it', () => {
    const lead = pickLead(
      [town({ osm_type: 'R', osm_id: 192763, osm_value: 'country', type: 'country', name: 'Mauritania' })],
      'Mauretanien',
    );
    expect(lead).toMatchObject({ placeId: 'relation:192763', reach: 'everywhere' });
  });

  it('PHOTON-MAP-023: anything else leads only when called what was typed, or a typo of it', () => {
    const centrum = town({
      osm_type: 'R',
      osm_id: 1,
      osm_key: 'boundary',
      osm_value: 'administrative',
      type: 'county',
      name: 'Centrum',
    });
    const paramaribo = town({ osm_type: 'N', osm_id: 2, name: 'Paramaribo' });
    expect(pickLead([centrum, paramaribo], 'Paramraibo')).toMatchObject({ placeId: 'node:2' });
    expect(pickLead([centrum], 'Paramraibo')).toBeNull();
  });

  it('PHOTON-MAP-024: no lead for an airport code, nor for a municipality with nothing to say where the traveller is', () => {
    expect(pickLead([town({ name: 'FRA' })], 'FRA')).toBeNull();
    const municipality = town({ osm_value: 'municipality', name: 'Sagrada Família' });
    expect(pickLead([municipality], 'Sagrada Familia')).toBeNull();
    expect(pickLead([municipality], 'Sagrada Familia', { lat: 52.5, lng: 13.4 })).not.toBeNull();
  });
});

describe('pickLead, namesakes', () => {
  const place = (properties: Record<string, unknown>) =>
    feature({ osm_key: 'place', street: undefined, district: undefined, city: undefined, ...properties });

  it('PHOTON-MAP-027: a namesake ranked higher that may not lead leaves the list without a lead', () => {
    const london = place({ osm_type: 'R', osm_id: 1, osm_value: 'town', type: 'district', name: 'Greenwich' });
    const connecticut = place({ osm_type: 'R', osm_id: 2, osm_value: 'town', type: 'city', name: 'Greenwich' });
    expect(pickLead([london, connecticut], 'Greenwich')).toBeNull();
    expect(pickLead([connecticut, london], 'Greenwich')).toMatchObject({ placeId: 'relation:2' });
  });

  it('PHOTON-MAP-029: a street of the name ranked higher does not block, and an island leads', () => {
    const street = place({
      osm_type: 'W',
      osm_id: 4,
      osm_key: 'highway',
      osm_value: 'primary',
      type: 'street',
      name: 'Spitzbergen',
    });
    const island = place({ osm_type: 'R', osm_id: 5, osm_value: 'island', type: 'other', name: 'Spitzbergen' });
    expect(pickLead([street, island], 'Spitzbergen')).toMatchObject({ placeId: 'relation:5', kind: 'island' });
  });

  it('PHOTON-MAP-028: a town filed as an administrative boundary leads as a town', () => {
    const merida = place({
      osm_type: 'R',
      osm_id: 3,
      osm_key: 'boundary',
      osm_value: 'administrative',
      type: 'city',
      name: 'Mérida',
    });
    expect(pickLead([merida], 'Mérida')).toMatchObject({ placeId: 'relation:3', kind: 'city' });
  });
});

describe('nameLike and editDistance', () => {
  it('PHOTON-MAP-025: counts a swap of neighbours as one edit', () => {
    expect(editDistance('paramraibo', 'paramaribo')).toBe(1);
    expect(editDistance('tokio', 'tokyo')).toBe(1);
    expect(editDistance('ab', 'ba')).toBe(1);
    expect(editDistance('berlin', 'berlin')).toBe(0);
  });

  it('PHOTON-MAP-026: takes the same name, its start, a word of it or a near typo, and nothing shorter than three letters', () => {
    expect(nameLike('Berl', 'Berlin')).toBe(true);
    expect(nameLike('Tor', 'Brandenburger Tor')).toBe(true);
    expect(nameLike('Tokio', 'Tokyo')).toBe(true);
    expect(nameLike('Mailand', 'Milan')).toBe(false);
    expect(nameLike('Be', 'Berlin')).toBe(false);
  });
});
