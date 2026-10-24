/**
 * Reading a shared Google Maps directions link (MAPS-DIR-*).
 *
 * The links here are the real shapes, shortened: what the Share button produces on the
 * web, what the URL builder in Google's own docs produces, and what somebody gets when
 * they drop two pins and copy the address bar. The data blobs are trimmed to the parts
 * that matter, because the full ones run to four hundred characters of protobuf.
 */
import {
  directionsTravelMode,
  isDirectionsUrl,
  parseDirectionsUrl,
  MAX_DIR_WAYPOINTS,
} from '../../../../src/nest/place-import/directions-url.helpers';
import { GAIA_CELLARS, PORTO_ALIADOS, PORTO_CLERIGOS, PORTO_RIBEIRA } from '../../../fixtures/google-maps-walks';

import { describe, it, expect } from 'vitest';

describe('isDirectionsUrl', () => {
  it('MAPS-DIR-001: tells a route apart from a list and from a single place', () => {
    expect(isDirectionsUrl('https://www.google.com/maps/dir/Berlin/Dresden')).toBe(true);
    expect(isDirectionsUrl('https://www.google.com/maps/dir/?api=1&origin=A&destination=B')).toBe(true);
    expect(isDirectionsUrl('https://www.google.com/maps/place/Brandenburger+Tor/@52.5,13.3,17z')).toBe(false);
    expect(isDirectionsUrl('https://www.google.com/maps/placelists/list/abc123')).toBe(false);
    expect(isDirectionsUrl('not a url')).toBe(false);
  });
});

describe('parseDirectionsUrl', () => {
  it('MAPS-DIR-010: reads the stops out of the path, in driving order', () => {
    const stops = parseDirectionsUrl('https://www.google.com/maps/dir/Berlin/Dresden/Prague/@50.9,13.5,8z');
    expect(stops.map((s) => s.name)).toEqual(['Berlin', 'Dresden', 'Prague']);
    // Nothing invented: without a data blob there are no coordinates to be had, and the
    // caller geocodes rather than guessing.
    expect(stops.every((s) => s.lat === null)).toBe(true);
  });

  it('MAPS-DIR-011: takes the coordinates out of the data blob when there is one per stop', () => {
    const url =
      'https://www.google.com/maps/dir/Berlin/Dresden/@51.5,13.5,8z/' +
      'data=!4m14!4m13!1m5!1m1!1s0x0:0x0!2m2!1d13.404954!2d52.520008!1m5!1m1!1s0x0:0x0!2m2!1d13.737262!2d51.050409';
    // 1d is longitude and 2d is latitude, the reverse of a place link. Getting the two
    // the wrong way round is the failure this pins.
    expect(parseDirectionsUrl(url)).toEqual([
      { name: 'Berlin', lat: 52.520008, lng: 13.404954 },
      { name: 'Dresden', lat: 51.050409, lng: 13.737262 },
    ]);
  });

  it('MAPS-DIR-012: a blob that does not line up leaves every stop to the geocoder', () => {
    // Google drops the pair for "your location" and adds pairs of its own on a route
    // through several countries. Half a link read confidently is worse than one read as
    // names, so a mismatched count means names.
    const url =
      'https://www.google.com/maps/dir/Berlin/Dresden/Prague/@51,13,7z/' +
      'data=!4m8!1m5!1m1!1s0x0:0x0!2m2!1d13.404954!2d52.520008';
    const stops = parseDirectionsUrl(url);
    expect(stops).toHaveLength(3);
    expect(stops.every((s) => s.lat === null)).toBe(true);
  });

  it('MAPS-DIR-013: a stop written as coordinates needs no geocoder at all', () => {
    expect(parseDirectionsUrl('https://www.google.com/maps/dir/52.520008,13.404954/51.050409,13.737262')).toEqual([
      { name: null, lat: 52.520008, lng: 13.404954 },
      { name: null, lat: 51.050409, lng: 13.737262 },
    ]);
  });

  it('MAPS-DIR-014: escapes and plus signs come back as the name somebody typed', () => {
    const stops = parseDirectionsUrl('https://www.google.com/maps/dir/Frankfurt+am+Main/K%C3%B6ln+Hbf');
    expect(stops.map((s) => s.name)).toEqual(['Frankfurt am Main', 'Köln Hbf']);
  });

  it('MAPS-DIR-015: the documented api=1 form names its parts instead of ordering them', () => {
    const url =
      'https://www.google.com/maps/dir/?api=1&origin=Berlin&destination=Prague' +
      '&waypoints=Dresden%7CLeipzig&travelmode=driving';
    expect(parseDirectionsUrl(url).map((s) => s.name)).toEqual(['Berlin', 'Dresden', 'Leipzig', 'Prague']);
  });

  it('MAPS-DIR-016: api=1 coordinates are coordinates, however they were written', () => {
    const url = 'https://www.google.com/maps/dir/?api=1&origin=52.52,13.405&destination=Prague';
    expect(parseDirectionsUrl(url)).toEqual([
      { name: null, lat: 52.52, lng: 13.405 },
      { name: 'Prague', lat: null, lng: null },
    ]);
  });

  it('MAPS-DIR-017: a country domain is still Google Maps', () => {
    expect(parseDirectionsUrl('https://www.google.de/maps/dir/Berlin/Dresden').map((s) => s.name)).toEqual([
      'Berlin',
      'Dresden',
    ]);
  });

  it('MAPS-DIR-018: one stop is a place, not a route', () => {
    // The place search box already takes those, and answering with a one-place import
    // would be a worse version of what it does.
    expect(parseDirectionsUrl('https://www.google.com/maps/dir/Berlin')).toEqual([]);
    expect(parseDirectionsUrl('https://www.google.com/maps/dir/')).toEqual([]);
  });

  it('MAPS-DIR-019: what is not a route reads as nothing', () => {
    expect(parseDirectionsUrl('https://www.google.com/maps/place/Berlin/@52.5,13.4,12z')).toEqual([]);
    expect(parseDirectionsUrl('gibberish')).toEqual([]);
  });

  it('MAPS-DIR-020: a link with more stops than anybody drives is cut to the cap', () => {
    // The URL is user input, and every name past the cap costs a geocoding request.
    const many = Array.from({ length: 50 }, (_, i) => `Stop${i}`).join('/');
    expect(parseDirectionsUrl(`https://www.google.com/maps/dir/${many}`)).toHaveLength(MAX_DIR_WAYPOINTS);
  });

  it('MAPS-DIR-021: numbers that are not on Earth are read as a name, not a position', () => {
    const stops = parseDirectionsUrl('https://www.google.com/maps/dir/999.5,13.4/Dresden');
    expect(stops[0]).toEqual({ name: '999.5,13.4', lat: null, lng: null });
  });

  it("MAPS-DIR-022: a malformed escape is somebody else's bad link, not a throw", () => {
    expect(() => parseDirectionsUrl('https://www.google.com/maps/dir/%E0%A4%A/Dresden')).not.toThrow();
    expect(parseDirectionsUrl('https://www.google.com/maps/dir/%E0%A4%A/Dresden')).toHaveLength(2);
  });
});

describe('parseDirectionsUrl with stop blocks (CW-07)', () => {
  const blocks = (url: string) => parseDirectionsUrl(url, MAX_DIR_WAYPOINTS, 'stop-blocks');
  const placed = (url: string) => blocks(url).filter((stop) => stop.lat !== null).length;

  it('MAPS-DIR-030: a real walk places every stop from its own block, in order and with its name', () => {
    expect(blocks(PORTO_RIBEIRA)).toEqual([
      {
        name: 'Igreja de Santa Clara, Largo Primeiro de Dezembro, 4000-404 Porto, Portugal',
        lat: 41.1425899,
        lng: -8.6092477,
      },
      { name: 'Porto Cathedral, Terreiro da Sé, 4050-573 Porto, Portugal', lat: 41.1428531, lng: -8.6111165 },
      {
        name: 'Mosteiro Santo Agostinho da Serra do Pilar, Largo Aviz, 4430-329 Vila Nova de Gaia, Portugal',
        lat: 41.138298,
        lng: -8.6075262,
      },
      { name: 'Mirador de Porto y Duero', lat: 41.1391452, lng: -8.609616 },
      { name: 'Ribeira de Gaia', lat: 41.1382776, lng: -8.6117899 },
    ]);
    // Where every stop has one pair, both readings agree.
    expect(parseDirectionsUrl(PORTO_RIBEIRA)).toEqual(blocks(PORTO_RIBEIRA));
    expect(placed(GAIA_CELLARS)).toBe(4);
  });

  it('MAPS-DIR-031: a point the line was dragged through is not taken for the stop it follows', () => {
    const stops = blocks(PORTO_ALIADOS);
    expect(stops).toHaveLength(9);
    expect(stops.every((stop) => stop.lat !== null)).toBe(true);
    // Praça da Batalha's own position, not the dragged point (41.1461502, -8.6082184) in its block.
    expect(stops[7]).toEqual({
      name: 'Praça da Batalha, R. de Augusto Rosa, 4000-529 Porto, Portugal',
      lat: 41.1451574,
      lng: -8.6070394,
    });
    // The pair count has one pair too many there, so the road trip reading places nothing.
    expect(parseDirectionsUrl(PORTO_ALIADOS).every((stop) => stop.lat === null)).toBe(true);
  });

  it('MAPS-DIR-032: stops given as coordinates keep them, and the stops after them keep their own', () => {
    const stops = blocks(PORTO_CLERIGOS);
    expect(stops).toHaveLength(10);
    expect(stops.slice(5, 10)).toEqual([
      {
        name: 'Miradouro da Vitória, R. de São Bento da Vitória 11, 4050-265 Porto, Portugal',
        lat: 41.1430829,
        lng: -8.6158324,
      },
      { name: null, lat: 41.1442506, lng: -8.6138221 },
      { name: 'Mercado Ferreira Borges, R. da Bolsa 19, 4050-253 Porto, Portugal', lat: 41.1419501, lng: -8.615126 },
      {
        name: 'Palácio da Bolsa, R. de Ferreira Borges 11, 4050-253 Porto, Portugal',
        lat: 41.1413772,
        lng: -8.6156725,
      },
      { name: null, lat: 41.1403376, lng: -8.6145436 },
    ]);
    expect(placed(PORTO_CLERIGOS)).toBe(10);
    expect(parseDirectionsUrl(PORTO_CLERIGOS).filter((stop) => stop.lat !== null)).toHaveLength(2);
  });

  it('MAPS-DIR-033: a blob that does not pair up with the stops places none of them', () => {
    const route = 'https://www.google.com/maps/dir/Cathedral/Market/Park/';
    const block = (lng: number, lat: number) => `!1m5!1m1!1s0x0:0x0!2m2!1d${lng}!2d${lat}`;
    // Two blocks for three stops.
    expect(placed(`${route}data=!4m13!4m12${block(11.5, 48.1)}${block(11.51, 48.11)}`)).toBe(0);
    // A message that claims more than follows it, a token that is no field, a count that is no number.
    expect(placed(`${route}data=!4m30!4m29${block(11.5, 48.1)}${block(11.51, 48.11)}${block(11.52, 48.12)}`)).toBe(0);
    expect(placed(`${route}data=!4m19!4m18${block(11.5, 48.1)}${block(11.51, 48.11)}!zz${block(11.52, 48.12)}`)).toBe(
      0,
    );
    expect(placed(`${route}data=!4mX${block(11.5, 48.1)}${block(11.51, 48.11)}${block(11.52, 48.12)}`)).toBe(0);
    // No route message at all, and no blob.
    expect(placed(`${route}data=!3m1!1e3`)).toBe(0);
    expect(placed(route)).toBe(0);
  });

  it('MAPS-DIR-034: a stop whose block holds no position of its own, or one off the globe, stays without one', () => {
    const route = 'https://www.google.com/maps/dir/Cathedral/Market/Park/';
    const url = `${route}data=!4m14!4m13!1m0!1m5!1m1!1s0x0:0x0!2m2!1d11.51!2d48.11!1m5!1m1!1s0x0:0x0!2m2!1d11.5!2d99`;
    expect(blocks(url)).toEqual([
      { name: 'Cathedral', lat: null, lng: null },
      { name: 'Market', lat: 48.11, lng: 11.51 },
      { name: 'Park', lat: null, lng: null },
    ]);
  });
});

describe('directionsTravelMode (CW-07)', () => {
  const dir = 'https://www.google.com/maps/dir/Cathedral/Market/@48.1,11.5,15z/';

  it('MAPS-DIR-040: reads on foot from the data blob and from the documented parameter', () => {
    expect(directionsTravelMode(`${dir}data=!4m2!4m1!3e2`)).toBe('walking');
    expect(directionsTravelMode(`${dir}data=%214m2%214m1%213e2`)).toBe('walking');
    expect(
      directionsTravelMode('https://www.google.com/maps/dir/?api=1&origin=A&destination=B&travelmode=walking'),
    ).toBe('walking');
    expect(
      directionsTravelMode('https://www.google.com/maps/dir/?api=1&origin=A&destination=B&travelmode=WALKING'),
    ).toBe('walking');
    for (const walk of [PORTO_RIBEIRA, PORTO_ALIADOS, PORTO_CLERIGOS, GAIA_CELLARS]) {
      expect(directionsTravelMode(walk)).toBe('walking');
    }
  });

  it('MAPS-DIR-041: tells a car, a bike and transit apart, and names any other mode as other', () => {
    expect(directionsTravelMode(`${dir}data=!3e0`)).toBe('driving');
    expect(directionsTravelMode(`${dir}data=!3e1`)).toBe('bicycling');
    expect(directionsTravelMode(`${dir}data=!3e3`)).toBe('transit');
    expect(directionsTravelMode(`${dir}data=!3e9`)).toBe('other');
    expect(directionsTravelMode('https://www.google.com/maps/dir/?api=1&destination=B&travelmode=driving')).toBe(
      'driving',
    );
    expect(directionsTravelMode('https://www.google.com/maps/dir/?api=1&destination=B&travelmode=bicycling')).toBe(
      'bicycling',
    );
    expect(directionsTravelMode('https://www.google.com/maps/dir/?api=1&destination=B&travelmode=transit')).toBe(
      'transit',
    );
    expect(directionsTravelMode('https://www.google.com/maps/dir/?api=1&destination=B&travelmode=two-wheeler')).toBe(
      'other',
    );
  });

  it('MAPS-DIR-042: a link that says nothing, or two different things, is unknown', () => {
    expect(directionsTravelMode(dir)).toBe('unknown');
    expect(directionsTravelMode(`${dir}data=!4m2!4m1!1m0`)).toBe('unknown');
    expect(directionsTravelMode(`${dir}data=!3e2?travelmode=driving`)).toBe('unknown');
    expect(directionsTravelMode(`${dir}data=!3e2!3e0`)).toBe('unknown');
    // The same mode said twice is still one mode.
    expect(directionsTravelMode(`${dir}data=!3e2?travelmode=walking`)).toBe('walking');
  });

  it('MAPS-DIR-043: !3e means the mode only in the data blob of a route', () => {
    expect(directionsTravelMode(`${dir}?pb=!3e2`)).toBe('unknown');
    expect(directionsTravelMode('https://www.google.com/maps/place/Cathedral/data=!3e2')).toBe('unknown');
    expect(directionsTravelMode('not a link')).toBe('unknown');
  });
});
