import { describe, expect, it } from 'vitest';

import {
  TREK_API_SOURCES,
  trekApiAddressFeatures,
  trekApiFacts,
  trekApiFields,
  trekApiRoutingFeatures,
} from './trekApiModel';

// FE-TREKAPIMODEL-001 to FE-TREKAPIMODEL-004

const t = (key: string) => `<${key}>`;

describe('trekApiModel', () => {
  it('FE-TREKAPIMODEL-001: lists the ten result fields in their order, translated', () => {
    expect(trekApiFields(t)).toEqual([
      '<places.formName>',
      '<collections.coordinates>',
      '<places.formCategory>',
      '<places.formAddress>',
      '<admin.trekApi.fieldPhone>',
      '<common.email>',
      '<places.formWebsite>',
      '<places.formDescription>',
      '<inspector.openingHours>',
      '<admin.trekApi.fieldStableId>',
    ]);
  });

  it('FE-TREKAPIMODEL-002: leads with the three services, then the terms, each with a glyph', () => {
    const facts = trekApiFacts(t);
    expect(facts.map((f) => f.text)).toEqual([
      '<admin.trekApi.factPlaces>',
      '<admin.trekApi.factAddresses>',
      '<admin.trekApi.factRouting>',
      '<admin.trekApi.factNoKey>',
      '<admin.trekApi.factOffline>',
      '<admin.trekApi.factPrivacy>',
    ]);
    for (const f of facts) expect(f.Icon).toBeTruthy();
  });

  it('FE-TREKAPIMODEL-003: names the data sources untranslated', () => {
    expect(TREK_API_SOURCES).toEqual([
      'Overture Maps Foundation',
      'OpenStreetMap',
      'Wikivoyage',
      'Wikimedia',
      'Mapzen Terrain Tiles',
    ]);
  });

  it('FE-TREKAPIMODEL-004: lists what the address search and the routing answer', () => {
    expect(trekApiAddressFeatures(t)).toEqual([
      '<admin.trekApi.addrStreets>',
      '<admin.trekApi.addrTowns>',
      '<admin.trekApi.addrReverse>',
      '<admin.trekApi.addrLanguages>',
    ]);
    expect(trekApiRoutingFeatures(t)).toEqual([
      '<admin.trekApi.routeCar>',
      '<admin.trekApi.routeBike>',
      '<admin.trekApi.routeFoot>',
      '<admin.trekApi.routeAvoid>',
      '<admin.trekApi.routeElevation>',
    ]);
  });
});
