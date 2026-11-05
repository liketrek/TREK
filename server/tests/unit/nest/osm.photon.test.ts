/**
 * OSM-PHOTON-001..020: the OpenStreetMap search and reverse lookup are Photon's
 * where the installation holds a key, answer in the shape Nominatim's answers
 * always had, and leave Nominatim to installations without the TREK services.
 * A lookup by id is Overpass and Photon, Nominatim only where Overpass cannot
 * place the element. The network is a stubbed global fetch routed by host.
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
let overpassReply: () => Response;
let placesReply: (url: URL) => Response;
let osm: OsmClient;
const hosts: string[] = [];

beforeEach(() => {
  identity = new FakeServiceIdentity();
  serviceIdentitySlot.install(identity);
  photonReply = () => photonAnswer([gateFeature()]);
  overpassReply = () =>
    new Response(
      JSON.stringify({
        elements: [
          {
            type: 'way',
            id: 518071791,
            center: { lat: 52.5163, lon: 13.3777 },
            tags: { name: 'Brandenburger Tor', 'name:en': 'Brandenburg Gate', website: 'https://example.org' },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  // TREK's own details layer holds nothing unless a test says so.
  placesReply = () => new Response(JSON.stringify({ detail: 'no such element' }), { status: 404 });
  hosts.length = 0;
  vi.stubEnv('NOMINATIM_URL', '');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      hosts.push(url.hostname);
      if (url.hostname === 'photon.liketrek.com') return photonReply();
      if (url.hostname === 'overpass-api.de') return overpassReply();
      if (url.hostname === 'places.liketrek.com') return placesReply(url);
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

  it('OSM-PHOTON-002: a Photon that fails is an empty answer where Photon is the geocoder; Nominatim only without the services', async () => {
    photonReply = () => photonAnswer([], 503);
    expect(await osm.searchNominatim('Brandenburger Tor', 'de', 'interactive', { lat: 52.5, lng: 13.4 })).toEqual([]);
    expect(hosts).toEqual(['photon.liketrek.com']);

    hosts.length = 0;
    identity.bearer = null;
    const places = await osm.searchNominatim('Brandenburger Tor', 'de', 'interactive', { lat: 52.5, lng: 13.4 });
    expect(hosts).toEqual(['nominatim.openstreetmap.org']);
    expect(places[0]).toMatchObject({ osm_id: 'way:518071791' });
  });

  it('OSM-PHOTON-003: leaves out a Photon hit without an OpenStreetMap id', async () => {
    photonReply = () => photonAnswer([gateFeature({ osm_type: undefined }), gateFeature({ osm_id: 7, osm_type: 'N' })]);
    const places = await osm.searchNominatim('Brandenburger Tor');
    expect(places.map((p) => p.osm_id)).toEqual(['node:7']);
  });

  it('OSM-PHOTON-010: an empty answer from Photon is the answer; Nominatim is not asked beside it', async () => {
    photonReply = () => photonAnswer([]);
    expect(await osm.searchNominatim('Brandenburger Tor', 'de')).toEqual([]);
    photonReply = () => photonAnswer([gateFeature({ osm_type: undefined })]);
    expect(await osm.searchNominatim('Brandenburger Tor', 'de')).toEqual([]);
    expect(hosts).toEqual(['photon.liketrek.com', 'photon.liketrek.com']);
  });

  it('OSM-PHOTON-011: a bulk import on the background lane asks Photon too, for its search and its reverse lookup', async () => {
    expect((await osm.searchNominatim('Brandenburger Tor', 'de', 'background'))[0]).toMatchObject({
      osm_id: 'way:518071791',
    });
    await osm.reverse('52.5', '13.4', 'de', { lane: 'background' });
    expect(hosts).toEqual(['photon.liketrek.com', 'photon.liketrek.com']);
  });

  it('OSM-PHOTON-012: carries the wiki tags of a Photon hit into the record', async () => {
    photonReply = () =>
      photonAnswer([gateFeature({ extra: { wikidata: 'Q82425', wikimedia_commons: 'Category:Brandenburger Tor' } })]);
    const [place] = await osm.searchNominatim('Brandenburger Tor', 'de');
    expect(hosts).toEqual(['photon.liketrek.com']);
    expect(place).toMatchObject({ wikidata: 'Q82425', wikimedia_commons: 'Category:Brandenburger Tor' });
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

  it('OSM-PHOTON-013: the keystroke beside the index asks Photon alone, with the coordinates it found (#2877)', async () => {
    photonReply = () => photonAnswer([gateFeature(), gateFeature({ osm_id: undefined })]);
    const suggestions = await osm.autocompletePhoton('Brandenb', 'de', { lat: 52.5, lng: 13.4 });
    expect(hosts).toEqual(['photon.liketrek.com']);
    expect(suggestions).toEqual([
      {
        placeId: 'way:518071791',
        mainText: 'Brandenburger Tor',
        secondaryText: 'Pariser Platz, Mitte, Berlin, Deutschland',
        source: 'openstreetmap',
        lat: 52.5163,
        lng: 13.3777,
      },
    ]);
  });

  it("OSM-PHOTON-015: hands the suggestion list Photon's first hit as its lead where it names a town", async () => {
    const town = gateFeature({
      osm_type: 'R',
      osm_id: 62422,
      osm_key: 'place',
      osm_value: 'city',
      type: 'city',
      name: 'Berlin',
      extent: [13.088345, 52.6755087, 13.7611609, 52.3382448],
    });
    photonReply = () => photonAnswer([town, gateFeature()]);
    const answer = await osm.suggestPhoton('Berl', 'de');
    expect(answer?.rows.map((r) => r.placeId)).toEqual(['relation:62422', 'way:518071791']);
    expect(answer?.lead).toMatchObject({ placeId: 'relation:62422', reach: 'nearby' });

    // A sight with a Wikidata link leads too, when it is called what was typed.
    photonReply = () => photonAnswer([gateFeature(), town]);
    expect((await osm.suggestPhoton('Bran', 'de'))?.lead).toMatchObject({ placeId: 'way:518071791', kind: 'landmark' });
    expect((await osm.suggestPhoton('Pariser', 'de'))?.lead).toBeNull();
  });

  it('OSM-PHOTON-016: the search hands its records ranked and its lead, and null where Photon does not answer', async () => {
    const street = gateFeature({ osm_id: 1, osm_key: 'highway', osm_value: 'pedestrian', extra: undefined });
    photonReply = () => photonAnswer([street, gateFeature()]);
    const answer = await osm.searchPhoton('Brandenburger Tor', 'de');
    // The street of the same name steps back behind the sight with a Wikidata link.
    expect(answer?.records.map((r) => r.osm_id)).toEqual(['way:518071791', 'way:1']);
    expect(answer?.lead).toMatchObject({ placeId: 'way:518071791' });

    identity.bearer = null;
    expect(await osm.searchPhoton('Brandenburger Tor', 'de')).toBeNull();
  });

  it('OSM-PHOTON-020: an airport code in capitals is asked as the airport at its place, and leads with the aerodrome', async () => {
    const asked: URLSearchParams[] = [];
    const aerodrome = gateFeature({
      osm_type: 'W',
      osm_id: 12345,
      osm_key: 'aeroway',
      osm_value: 'aerodrome',
      name: 'John F. Kennedy International Airport',
    });
    (aerodrome.geometry as { coordinates: number[] }).coordinates = [-73.7781, 40.6413];
    photonReply = () => photonAnswer([aerodrome]);
    const fetchStub = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const inner = fetchStub.getMockImplementation() as (input: string | URL) => Promise<Response>;
    fetchStub.mockImplementation(async (input: string | URL) => {
      asked.push(new URL(String(input)).searchParams);
      return inner(input);
    });

    const answer = await osm.suggestPhoton('JFK', 'en');
    expect(asked[0].get('q')).toBe('John F. Kennedy International Airport');
    expect(asked[0].get('lat')).toBe('40.639447');
    expect(answer?.lead).toMatchObject({ placeId: 'way:12345', reach: 'everywhere', kind: 'airport' });

    // Lower case is a word being typed, not a code.
    await osm.suggestPhoton('jfk', 'en');
    expect(asked[1].get('q')).toBe('jfk');
  });

  it('OSM-PHOTON-014: answers null without Photon rather than asking Nominatim, whose policy rules out autocomplete', async () => {
    identity.bearer = null;
    expect(await osm.autocompletePhoton('Brandenb', 'de')).toBeNull();
    photonReply = () => photonAnswer([], 503);
    identity.bearer = 'tk1.kid.payload.signature';
    expect(await osm.autocompletePhoton('Brandenb', 'de')).toBeNull();
    expect(hosts).toEqual(['photon.liketrek.com']);
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

  it('OSM-PHOTON-007: asks again within 50 km when nothing is next to the point, and never Nominatim beside Photon', async () => {
    const asked: string[] = [];
    photonReply = () => photonAnswer([]);
    const fetchStub = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    const inner = fetchStub.getMockImplementation() as (input: string | URL) => Promise<Response>;
    fetchStub.mockImplementation(async (input: string | URL) => {
      asked.push(new URL(String(input)).searchParams.get('radius') ?? '');
      return inner(input);
    });
    expect(await osm.reverse('46.0', '104.0', 'de')).toEqual({ name: null, address: null });
    expect(asked).toEqual(['', '50']);
    photonReply = () => photonAnswer([], 429);
    expect(await osm.reverse('52.5', '13.4', 'de')).toEqual({ name: null, address: null });
    expect(hosts).not.toContain('nominatim.openstreetmap.org');
  });

  it('OSM-PHOTON-008: the raw answer for a pasted link comes from Photon; a miss is an empty answer, not Nominatim', async () => {
    expect((await osm.reverseRaw(52.5163, 13.3777)).address?.tourism).toBe('Brandenburger Tor');
    photonReply = () => photonAnswer([], 500);
    expect(await osm.reverseRaw(52.5, 13.4)).toEqual({});
    expect(hosts).not.toContain('nominatim.openstreetmap.org');
  });

  it("OSM-PHOTON-017: without the TREK services the reverse lookup is Nominatim's, as it always was", async () => {
    identity.bearer = null;
    expect((await osm.reverse('52.5', '13.4', 'de')).name).toBe('Unter den Linden');
    expect(hosts).toEqual(['nominatim.openstreetmap.org']);
  });
});

it('OSM-PHOTON-009: a lookup by id is Overpass for the tags and the place, Photon for the name and address', async () => {
  const details = await osm.elementDetails('way:518071791', 'en');
  expect(details).toMatchObject({
    name: 'Brandenburg Gate',
    address: 'Brandenburger Tor, Pariser Platz, Mitte, Berlin, 10117, Deutschland',
    lat: 52.5163,
    lng: 13.3777,
    osm_id: 'way:518071791',
    website: 'https://example.org',
  });
  // TREK's details layer is asked first; it does not hold this element here.
  expect(hosts).toEqual(['places.liketrek.com', 'overpass-api.de', 'photon.liketrek.com']);
});

it('OSM-PHOTON-022: an answer of the details layer outside its shape is no element, and Overpass is asked', async () => {
  const place = { name: 'Brandenburger Tor', lat: 52.5163, lng: 13.3777, tags: { level: 2 } };
  placesReply = () =>
    new Response(JSON.stringify({ place }), { status: 200, headers: { 'content-type': 'application/json' } });
  const details = await osm.elementDetails('way:518071791', 'en');
  expect(details).toMatchObject({ name: 'Brandenburg Gate', website: 'https://example.org' });
  expect(hosts).toEqual(['places.liketrek.com', 'overpass-api.de', 'photon.liketrek.com']);
});

it("OSM-PHOTON-021: an element in TREK's own details layer asks no Overpass, and carries the community values", async () => {
  placesReply = (url) => {
    expect(url.pathname).toBe('/v1/osm/way/518071791');
    return new Response(
      JSON.stringify({
        place: {
          name: 'Brandenburger Tor',
          lat: 52.5163,
          lng: 13.3777,
          tags: { website: 'https://example.org', opening_hours: '24/7' },
          contact: { phone: '+49 30 1234567' },
          community: { version: 2, fields: ['phone'] },
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };
  const details = await osm.elementDetails('way:518071791', 'en');
  expect(details).toMatchObject({
    website: 'https://example.org',
    opening_hours: expect.arrayContaining(['Monday: 00:00-24:00']),
    phone: '+49 30 1234567',
    community_version: 2,
    lat: 52.5163,
    lng: 13.3777,
  });
  expect(hosts).toEqual(['places.liketrek.com', 'photon.liketrek.com']);
});

it('OSM-PHOTON-018: Nominatim names the element only when Overpass cannot place it, or without the TREK services', async () => {
  overpassReply = () => new Response('busy', { status: 504 });
  await osm.elementDetails('way:518071791', 'de');
  expect(hosts.filter((h) => h === 'nominatim.openstreetmap.org')).toHaveLength(1);
  hosts.length = 0;
  identity.bearer = null;
  await osm.elementDetails('way:518071791', 'de');
  expect(hosts).toContain('nominatim.openstreetmap.org');
  expect(hosts).not.toContain('photon.liketrek.com');
});

it('OSM-PHOTON-019: the identity of a place comes from Photon inside the box, the sight before the station of its name', async () => {
  const station = gateFeature({
    osm_type: 'N',
    osm_id: 3862767512,
    osm_key: 'railway',
    osm_value: 'station',
    extra: { wikidata: 'Q477185' },
  });
  photonReply = () => photonAnswer([station, gateFeature()]);
  const identityAnswer = await osm.resolveOsmIdentity('Brandenburger Tor', 52.5163, 13.3777, { lang: 'de' });
  expect(identityAnswer).toMatchObject({
    osmUrl: 'https://www.openstreetmap.org/way/518071791',
    tags: { wikidata: 'Q82425' },
  });
  expect(hosts).toEqual(['photon.liketrek.com']);
});
