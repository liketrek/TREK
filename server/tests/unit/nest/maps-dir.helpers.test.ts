/**
 * Reading a shared Google Maps directions link (MAPS-DIR-*).
 *
 * The links here are the real shapes, shortened: what the Share button produces on the
 * web, what the URL builder in Google's own docs produces, and what somebody gets when
 * they drop two pins and copy the address bar. The data blobs are trimmed to the parts
 * that matter, because the full ones run to four hundred characters of protobuf.
 */
import { describe, it, expect } from 'vitest';
import { isDirectionsUrl, parseDirectionsUrl, MAX_DIR_WAYPOINTS } from '../../../src/nest/places/maps-dir.helpers';

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
    const url = 'https://www.google.com/maps/dir/Berlin/Dresden/@51.5,13.5,8z/'
      + 'data=!4m14!4m13!1m5!1m1!1s0x0:0x0!2m2!1d13.404954!2d52.520008!1m5!1m1!1s0x0:0x0!2m2!1d13.737262!2d51.050409';
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
    const url = 'https://www.google.com/maps/dir/Berlin/Dresden/Prague/@51,13,7z/'
      + 'data=!4m8!1m5!1m1!1s0x0:0x0!2m2!1d13.404954!2d52.520008';
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
    const url = 'https://www.google.com/maps/dir/?api=1&origin=Berlin&destination=Prague'
      + '&waypoints=Dresden%7CLeipzig&travelmode=driving';
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
    expect(parseDirectionsUrl('https://www.google.de/maps/dir/Berlin/Dresden').map((s) => s.name))
      .toEqual(['Berlin', 'Dresden']);
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

  it('MAPS-DIR-022: a malformed escape is somebody else\'s bad link, not a throw', () => {
    expect(() => parseDirectionsUrl('https://www.google.com/maps/dir/%E0%A4%A/Dresden')).not.toThrow();
    expect(parseDirectionsUrl('https://www.google.com/maps/dir/%E0%A4%A/Dresden')).toHaveLength(2);
  });
});
