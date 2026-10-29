/**
 * OSM-PHOTON-001..009: the OpenStreetMap search and reverse lookup ask Photon
 * first where the installation holds a key, answer in the shape Nominatim's
 * answers always had, and fall back to Nominatim whenever Photon gives none.
 * Lookups by id stay on Nominatim. The network is a stubbed global fetch
 * routed by host.
 */
import { deriveServices } from '../../../src/app-config/boot-derive';
import { OsmClient } from '../../../src/nest/maps/providers/osm.client';
import { PhotonClient } from '../../../src/nest/maps/providers/photon.client';
import { serviceIdentitySlot } from '../../../src/nest/service-identity/service-identity.interface';
import { FakeServiceIdentity, gateFeature, photonAnswer } from '../../helpers/photon';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const NOMINATIM_GATE = {
  osm_type: 'way',
  osm_id: '518071791',
  class: 'tourism',
  type: 'attraction',
  name: 'Brandenburger Tor',
  display_name: 'Brandenburger Tor, Pariser Platz, Mitte, Berlin, 10117, Deutschland',
  lat: '52.5163',
  lon: '13.3777',
  extratags: { wikidata: 'Q82425', wikipedia: 'de:Brandenburger Tor' },
};

const NOMINATIM_REVERSE = {
  display_name: 'Unter den Linden 77, Mitte, Berlin, Deutschland',
  name: '',
  address: { road: 'Unter den Linden', city: 'Berlin' },
};

let identity: FakeServiceIdentity;
let photonReply: () => Response;
let osm: OsmClient;
const hosts: string[] = [];

beforeEach(() => {
  identity = new FakeServiceIdentity();
  serviceIdentitySlot.install(identity);
  photonReply = () => photonAnswer([gateFeature()]);
  hosts.length = 0;
  vi.stubEnv('NOMINATIM_URL', '');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      hosts.push(url.hostname);
      if (url.hostname === 'photon.liketrek.com') return photonReply();
      const body = url.pathname.endsWith('/reverse') ? NOMINATIM_REVERSE : [NOMINATIM_GATE];
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    }),
  );
  osm = new OsmClient(new PhotonClient(deriveServices({})));
});

afterEach(() => {
  serviceIdentitySlot.release(identity);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('search', () => {
  it('OSM-PHOTON-001: answers from Photon in the record a Nominatim hit gives, and leaves Nominatim alone', async () => {
    const fromPhoton = await osm.searchNominatim('Brandenburger Tor', 'de');
    expect(hosts).toEqual(['photon.liketrek.com']);

    identity.bearer = null;
    const fromNominatim = await osm.searchNominatim('Brandenburger Tor', 'de');
    expect(hosts).toEqual(['photon.liketrek.com', 'nominatim.openstreetmap.org']);

    expect(fromPhoton).toEqual(fromNominatim);
    expect(fromPhoton[0]).toMatchObject({
      osm_id: 'way:518071791',
      name: 'Brandenburger Tor',
      lat: 52.5163,
      lng: 13.3777,
      category: 'attraction',
      source: 'openstreetmap',
      wikidata: 'Q82425',
    });
  });

  it('OSM-PHOTON-002: asks Nominatim when Photon fails, with the bias it would have had', async () => {
    photonReply = () => photonAnswer([], 503);
    const places = await osm.searchNominatim('Brandenburger Tor', 'de', 'interactive', { lat: 52.5, lng: 13.4 });
    expect(hosts).toEqual(['photon.liketrek.com', 'nominatim.openstreetmap.org']);
    expect(places[0]).toMatchObject({ osm_id: 'way:518071791' });
  });

  it('OSM-PHOTON-003: leaves out a Photon hit without an OpenStreetMap id', async () => {
    photonReply = () => photonAnswer([gateFeature({ osm_type: undefined }), gateFeature({ osm_id: 7, osm_type: 'N' })]);
    const places = await osm.searchNominatim('Brandenburger Tor');
    expect(places.map((p) => p.osm_id)).toEqual(['node:7']);
  });

  it('OSM-PHOTON-004: the suggestions of a keyless install come out of Photon too', async () => {
    const { suggestions } = await osm.autocompleteNominatim('Brandenb', 'de');
    expect(hosts).toEqual(['photon.liketrek.com']);
    expect(suggestions).toEqual([
      {
        placeId: 'way:518071791',
        mainText: 'Brandenburger Tor',
        secondaryText: 'Pariser Platz, Mitte, Berlin, 10117, Deutschland',
      },
    ]);
  });
});

describe('reverse', () => {
  it('OSM-PHOTON-005: names a point from Photon, the sight before its street', async () => {
    expect(await osm.reverse('52.5163', '13.3777', 'de')).toEqual({
      name: 'Brandenburger Tor',
      address: 'Brandenburger Tor, Pariser Platz, Mitte, Berlin, 10117, Deutschland',
    });
    expect(hosts).toEqual(['photon.liketrek.com']);
  });

  it('OSM-PHOTON-006: names the town for a locality', async () => {
    expect((await osm.reverse('52.5163', '13.3777', 'de', { locality: true })).name).toBe('Berlin');
  });

  it('OSM-PHOTON-007: asks Nominatim when Photon fails or finds nothing there', async () => {
    photonReply = () => photonAnswer([], 429);
    expect(await osm.reverse('52.5', '13.4', 'de')).toEqual({
      name: 'Unter den Linden',
      address: 'Unter den Linden 77, Mitte, Berlin, Deutschland',
    });
    photonReply = () => photonAnswer([]);
    expect((await osm.reverse('52.5', '13.4', 'de')).name).toBe('Unter den Linden');
    expect(hosts).toEqual([
      'photon.liketrek.com',
      'nominatim.openstreetmap.org',
      'photon.liketrek.com',
      'nominatim.openstreetmap.org',
    ]);
  });

  it('OSM-PHOTON-008: the raw answer for a pasted link comes from Photon, else from Nominatim', async () => {
    expect((await osm.reverseRaw(52.5163, 13.3777)).address?.tourism).toBe('Brandenburger Tor');
    photonReply = () => photonAnswer([], 500);
    expect(await osm.reverseRaw(52.5, 13.4)).toEqual(NOMINATIM_REVERSE);
  });
});

it('OSM-PHOTON-009: a lookup by id stays on Nominatim', async () => {
  await osm.lookupNominatim('way', '518071791', 'de');
  expect(hosts).toEqual(['nominatim.openstreetmap.org']);
});
