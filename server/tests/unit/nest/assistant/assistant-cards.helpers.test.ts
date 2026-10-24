/**
 * The cards beside an answer, built from the tools' own answers: found places
 * from every search source (picked by name, masked, never a URL), the weather
 * of a lookup on its trip day, where a running step looks, and the mentions
 * of a message checked against the trip.
 */
import {
  activityOf,
  foundPlacesOf,
  mentionItems,
  weatherDayOf,
  weatherOf,
} from '../../../../src/nest/assistant/assistant-cards.helpers';
import { buildTripCard } from '../../../../src/nest/assistant/assistant-context';
import { foundPlaceArgs, writeToolOf } from '../../../../src/nest/assistant/assistant-tools.constants';
import { assistantActivitySchema, assistantPlacesSchema, assistantWeatherSchema } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const card = buildTripCard(
  1,
  7,
  {
    trip: { title: 'Kyoto', start_date: '2026-06-11', end_date: '2026-06-13' },
    days: [
      { id: 31, day_number: 1, date: '2026-06-11', title: 'Arrival' },
      { id: 32, day_number: 2, date: '2026-06-12' },
      { id: 33, day_number: 3, date: null, title: null },
    ],
    reservations: [{ id: 71, title: 'Gion Corner', day_id: 31 }],
  },
  {
    places: [
      { id: 12, name: 'Kinkaku-ji', lat: 35.0394, lng: 135.7292, google_place_id: 'ChIJkinkaku' },
      { id: 14, name: 'Nishiki Market', lat: 35.005, lng: 135.764, osm_id: 'way:77' },
    ],
  },
  null,
);

describe('foundPlacesOf', () => {
  it('ASTCRD-001: a Google result keeps only the fields a card shows, and its photo is asked for by its id', () => {
    const value = {
      places: [
        {
          google_place_id: 'ChIJginkaku',
          name: 'Ginkaku-ji',
          address: '2 Ginkakujicho, write to info@temple.example',
          lat: 35.027,
          lng: 135.7982,
          rating: 4.6,
          website: 'https://example.com',
          phone: '+81 75',
          email: 'a@b.example',
          types: ['tourist_attraction'],
          open_now: true,
          source: 'google',
        },
      ],
      source: 'google',
    };
    const found = foundPlacesOf('search_place', 'call_1', value, card, '2026-06-12');
    expect(found).toEqual({
      toolCallId: 'call_1',
      places: [
        {
          ref: 'call_1:0',
          name: 'Ginkaku-ji',
          address: '2 Ginkakujicho, write to [hidden]',
          lat: 35.027,
          lng: 135.7982,
          kind: 'sight',
          rating: 4.6,
          openNow: true,
          googlePlaceId: 'ChIJginkaku',
          osmId: null,
          photoKey: 'ChIJginkaku',
          inTripPlaceId: null,
        },
      ],
      more: 0,
    });
    expect(assistantPlacesSchema.safeParse(found).success).toBe(true);
  });

  it('ASTCRD-002: "open now" is only read while the trip runs', () => {
    const value = { places: [{ name: 'Cafe', lat: 35, lng: 135, open_now: false, types: ['cafe'] }] };
    expect(foundPlacesOf('search_place', 'c', value, card, '2026-06-11')?.places[0].openNow).toBe(false);
    expect(foundPlacesOf('search_place', 'c', value, card, '2026-10-21')?.places[0].openNow).toBeNull();
    const undated = buildTripCard(1, 7, { trip: { title: 'T' } }, null, null);
    expect(foundPlacesOf('search_place', 'c', value, undated, '2026-06-11')?.places[0].openNow).toBeNull();
  });

  it('ASTCRD-003: index, OpenStreetMap and POI results all become cards, a known one points at the trip place', () => {
    const nearby = {
      places: [
        { osm_id: 'gers:abc', name: 'Bakery Sato', lat: 35.01, lng: 135.76, category: 'bakery', distance_m: 40 },
        { osm_id: 'way:77', name: 'Nishiki Market', lat: 35.005, lng: 135.764, category: 'marketplace' },
        { google_place_id: 'ChIJkinkaku', name: 'Kinkaku-ji', lat: 35.0394, lng: 135.7292 },
      ],
    };
    const places = foundPlacesOf('search_nearby_places', 'n', nearby, card, '2026-01-01')?.places ?? [];
    expect(places.map((place) => [place.kind, place.photoKey, place.inTripPlaceId])).toEqual([
      ['drinks', 'coords:35.010000,135.760000', null],
      ['shopping', 'coords:35.005000,135.764000', 14],
      [null, 'ChIJkinkaku', 12],
    ]);
    const pois = {
      pois: [
        {
          osm_id: 'node:5',
          name: 'Ramen Ichi',
          lat: 35.0,
          lng: 135.7,
          category: 'restaurant',
          poi_type: 'amenity=restaurant',
          opening_hours: 'Mo-Su 11:00-22:00',
          website: 'https://ramen.example',
        },
      ],
      source: 'openstreetmap',
    };
    const poi = foundPlacesOf('search_pois', 'p', pois, card, '2026-06-12')?.places[0];
    expect(poi).toMatchObject({ name: 'Ramen Ichi', kind: 'food', osmId: 'node:5', openNow: null });
    expect(JSON.stringify(poi)).not.toMatch(/ramen\.example|opening/);
  });

  it('ASTCRD-008: the places along a saved tour show as cards; an unnamed tap is left out', () => {
    const along = {
      pois: [
        { id: 'node:7', name: 'Herzogstandhaus', lat: 47.6, lng: 11.3, category: 'shelter', kind: 'alpine_hut' },
        { id: 'node:8', name: '', lat: 47.61, lng: 11.3, category: 'drinking_water', kind: 'amenity=drinking_water' },
      ],
      truncated: false,
      partial: false,
      capped: false,
      unavailable: [],
    };
    const found = foundPlacesOf('search_tour_pois', 't', along, card, '2026-06-12');
    expect(found?.places.map((place) => place.name)).toEqual(['Herzogstandhaus']);
    expect(found?.places[0]).toMatchObject({ ref: 't:0', lat: 47.6, lng: 11.3, googlePlaceId: null });
    // The POI's own id is its OpenStreetMap element: a place already in the trip is named, not added twice.
    expect(found?.places[0]).toMatchObject({ osmId: 'node:7', inTripPlaceId: null });
    const known = { pois: [{ id: 'way:77', name: 'Nishiki', lat: 35.005, lng: 135.764, category: 'shop' }] };
    expect(foundPlacesOf('search_tour_pois', 'k', known, card, 'x')?.places[0]).toMatchObject({
      osmId: 'way:77',
      inTripPlaceId: 14,
    });
    // An id of another index is no OpenStreetMap id.
    const indexed = { pois: [{ id: 'trek:55', name: 'Hut', lat: 47.6, lng: 11.3, category: 'shelter' }] };
    expect(foundPlacesOf('search_tour_pois', 'i', indexed, card, 'x')?.places[0]?.osmId).toBeNull();
  });

  it('ASTCRD-004: at most twenty cards, the rest counted; places without a position or name are left out', () => {
    const many = Array.from({ length: 23 }, (_, i) => ({ name: `Place ${i}`, lat: 35 + i / 100, lng: 135 }));
    const found = foundPlacesOf('search_place', 'm', { places: [{ name: 'No position' }, ...many] }, card, 'x');
    expect(found?.places).toHaveLength(20);
    expect(found?.more).toBe(3);
    expect(found?.places[0]).toMatchObject({ ref: 'm:0', name: 'Place 0' });
    const odd = { places: [{ name: '', lat: 1, lng: 1 }, { name: 'Far', lat: 91, lng: 1 }, 'text', null] };
    expect(foundPlacesOf('search_place', 'o', odd, card, 'x')).toBeNull();
  });

  it('ASTCRD-005: a source id that is not one is dropped, and a name is cut to the card', () => {
    const value = {
      places: [
        {
          name: 'x'.repeat(300),
          lat: 1,
          lng: 2,
          google_place_id: 'https://evil.example/pic.png',
          osm_id: 'node:'.padEnd(60, '9'),
          rating: 9,
        },
      ],
    };
    const [place] = foundPlacesOf('search_place', 'z', value, card, 'x')?.places ?? [];
    expect(place).toMatchObject({ googlePlaceId: null, osmId: null, rating: null });
    expect(place.photoKey).toBe('coords:1.000000,2.000000');
    expect(place.name).toHaveLength(120);
    expect(place.name.endsWith('…')).toBe(true);
  });

  it('ASTCRD-006: any other tool, an answer without its list, or a call id too long has no cards', () => {
    const one = { places: [{ name: 'A', lat: 1, lng: 1 }] };
    expect(foundPlacesOf('list_places', 'c', one, card, 'x')).toBeNull();
    expect(foundPlacesOf('search_place', 'c', 'Place search failed.', card, 'x')).toBeNull();
    expect(foundPlacesOf('search_place', 'c'.repeat(65), one, card, 'x')).toBeNull();
  });
});

describe('weatherDayOf and weatherOf', () => {
  it('ASTCRD-010: a forecast lands on its trip day, in °C, with the chance of rain', () => {
    const day = weatherDayOf(
      'get_weather',
      { lat: 35, lng: 135, date: '2026-06-12' },
      {
        weather: {
          temp: 22,
          temp_max: 26.4,
          temp_min: 18,
          main: 'Rain',
          description: 'rain',
          type: 'forecast',
          precipitation_probability_max: 72.6,
        },
      },
      card,
    );
    expect(day).toEqual({
      dayId: 32,
      date: '2026-06-12',
      main: 'Rain',
      tempMax: 26.4,
      tempMin: 18,
      rainPct: 73,
      kind: 'forecast',
    });
  });

  it('ASTCRD-011: current weather has only a temperature, an unknown type reads as a forecast', () => {
    const now = { weather: { temp: 19, main: 'Clear', description: 'clear', type: 'current' } };
    expect(weatherDayOf('get_weather', { date: '2026-07-01' }, now, card)).toMatchObject({
      dayId: null,
      tempMax: 19,
      tempMin: null,
      rainPct: null,
      kind: 'current',
    });
    const odd = { weather: { temp: 19, main: 'Clear', type: 'mystery', precipitation_probability_max: 140 } };
    const read = weatherDayOf('get_weather', { date: '2026-06-11' }, odd, card);
    expect(read).toMatchObject({ kind: 'forecast', rainPct: 100 });
  });

  it('ASTCRD-012: no forecast, no date, no temperature or another tool make no entry', () => {
    const fine = { weather: { temp: 19, main: 'Clear', type: 'forecast' } };
    const none = { weather: { error: 'no_forecast' } };
    expect(weatherDayOf('get_weather', { date: '2026-06-11' }, none, card)).toBeNull();
    expect(weatherDayOf('get_weather', { date: 'June 11' }, fine, card)).toBeNull();
    expect(weatherDayOf('get_weather', { date: '2026-06-11' }, { weather: { main: 'Clear' } }, card)).toBeNull();
    expect(weatherDayOf('get_weather', { date: '2026-06-11' }, { weather: { temp: 1 } }, card)).toBeNull();
    expect(weatherDayOf('get_detailed_weather', { date: '2026-06-11' }, fine, card)).toBeNull();
  });

  it('ASTCRD-013: an answer shows one entry per date, the last lookup winning, in date order', () => {
    const entry = (date: string, tempMax: number) => ({
      dayId: null,
      date,
      main: 'Clear',
      tempMax,
      tempMin: null,
      rainPct: null,
      kind: 'forecast' as const,
    });
    const weather = weatherOf([entry('2026-06-12', 20), entry('2026-06-11', 18), entry('2026-06-12', 21)]);
    expect(weather?.days.map((day) => [day.date, day.tempMax])).toEqual([
      ['2026-06-11', 18],
      ['2026-06-12', 21],
    ]);
    expect(assistantWeatherSchema.safeParse(weather).success).toBe(true);
    expect(weatherOf([])).toBeNull();
    const month = Array.from({ length: 20 }, (_, i) => entry(`2026-07-${String(i + 1).padStart(2, '0')}`, i));
    expect(weatherOf(month)?.days).toHaveLength(16);
  });
});

describe('activityOf', () => {
  it('ASTCRD-020: a nearby search looks around its point and is named by the trip place there', () => {
    const activity = activityOf('search_nearby_places', 'c1', { lat: 35.0395, lng: 135.7291, radius: 300 }, card);
    expect(activity).toEqual({
      toolCallId: 'c1',
      label: 'Kinkaku-ji',
      area: { type: 'point', lat: 35.0395, lng: 135.7291, radiusM: 300 },
    });
    expect(assistantActivitySchema.safeParse(activity).success).toBe(true);
    expect(activityOf('search_nearby_places', 'c1', { lat: 10, lng: 10 }, card)).toEqual({
      toolCallId: 'c1',
      label: null,
      area: { type: 'point', lat: 10, lng: 10, radiusM: 500 },
    });
  });

  it('ASTCRD-021: a place search names its query, and shows an area only when it is biased to one', () => {
    expect(activityOf('search_place', 'c', { query: '  ramen   near   station ' }, card)).toEqual({
      toolCallId: 'c',
      label: 'ramen near station',
      area: null,
    });
    const locationBias = { lat: 35, lng: 135, radius: 99_999 };
    const biased = activityOf('search_place', 'c', { query: 'x', locationBias }, card);
    expect(biased).toMatchObject({ area: { type: 'point', radiusM: 50_000 } });
    expect(activityOf('search_place', 'c', { query: 'q'.repeat(100) }, card)?.label).toHaveLength(80);
  });

  it('ASTCRD-022: a POI search shows its box, but not one wider than two degrees or turned around', () => {
    const bbox = { south: 35.0, west: 135.75, north: 35.02, east: 135.78 };
    expect(activityOf('search_pois', 'p', { category: 'cafe', bbox }, card)).toEqual({
      toolCallId: 'p',
      label: 'Nishiki Market',
      area: { type: 'bbox', ...bbox },
    });
    expect(activityOf('search_pois', 'p', { bbox: { south: 30, west: 130, north: 33, east: 131 } }, card)).toBeNull();
    const turned = { south: 35.02, west: 135, north: 35, east: 135.1 };
    expect(activityOf('search_pois', 'p', { bbox: turned }, card)).toBeNull();
    expect(activityOf('search_pois', 'p', { bbox: 'everywhere' }, card)).toBeNull();
  });

  it('ASTCRD-023: a weather lookup looks around its point; other tools and long call ids show nothing', () => {
    expect(activityOf('get_weather', 'w', { lat: 35.005, lng: 135.764, date: '2026-06-11' }, card)).toMatchObject({
      label: 'Nishiki Market',
      area: { type: 'point', radiusM: 5_000 },
    });
    expect(activityOf('get_weather', 'w', { lat: 'north' }, card)).toBeNull();
    expect(activityOf('list_places', 'l', {}, card)).toBeNull();
    expect(activityOf('search_place', 'x'.repeat(65), { query: 'a' }, card)).toBeNull();
  });

  it('ASTCRD-024: a hike being planned is named by its goal and shows the box round its points', () => {
    const waypoints = [
      { lat: 47.6, lng: 11.3, name: 'Car park' },
      { lat: 47.61, lng: 11.31, name: 'Summit' },
      { lat: 47.62, lng: 11.3 },
    ];
    const activity = activityOf('propose_hike', 'h', { waypoints, round_trip: true }, card);
    expect(assistantActivitySchema.safeParse(activity).success).toBe(true);
    expect(activity?.label).toBe('Summit');
    expect(activity?.area).toMatchObject({ type: 'bbox' });
    if (activity?.area?.type !== 'bbox') throw new Error('no box');
    const { south, west, north, east } = activity.area;
    [south, west, north, east].forEach((edge, index) =>
      expect(edge).toBeCloseTo([47.595, 11.295, 47.625, 11.315][index], 9),
    );
    // Points all on one line still make a box; a start alone names no goal.
    const line = [
      { lat: 47.6, lng: 11.3, name: 'Car park' },
      { lat: 47.6, lng: 11.31 },
    ];
    expect(activityOf('propose_hike', 'h', { waypoints: line }, card)).toMatchObject({
      label: null,
      area: { type: 'bbox' },
    });
    expect(activityOf('propose_hike', 'h', { waypoints: [{ lat: 'north', lng: 11 }, ...line] }, card)).toEqual({
      toolCallId: 'h',
      label: 'Car park',
      area: null,
    });
    expect(activityOf('propose_hike', 'h', {}, card)).toBeNull();
    const far = [line[0], { lat: 50, lng: 11.3, name: 'Far away' }];
    expect(activityOf('propose_hike', 'h', { waypoints: far }, card)).toEqual({
      toolCallId: 'h',
      label: 'Far away',
      area: null,
    });
  });
});

describe('mentionItems', () => {
  it('ASTCRD-030: labels come from the trip, foreign ids and repeats fall out', () => {
    expect(
      mentionItems(
        card,
        [
          { kind: 'place', id: 12 },
          { kind: 'place', id: 12 },
          { kind: 'place', id: 999 },
          { kind: 'day', id: 31 },
          { kind: 'day', id: 33 },
          { kind: 'day', id: 98 },
          { kind: 'reservation', id: 71 },
          { kind: 'reservation', id: 72 },
        ],
        'en-GB',
      ),
    ).toEqual([
      { kind: 'place', id: 12, label: 'Kinkaku-ji' },
      { kind: 'day', id: 31, label: 'Thu 11 Jun, Arrival' },
      { kind: 'day', id: 33, label: '#3' },
      { kind: 'reservation', id: 71, label: 'Gion Corner' },
    ]);
  });
});

describe('found place arguments', () => {
  it('ASTCRD-040: a found place runs as the tool in its `via`, with only what that tool takes', () => {
    expect(writeToolOf('add_found_place', { via: 'assign_place_to_day' })).toBe('assign_place_to_day');
    expect(writeToolOf('add_found_place', { via: 'create_and_assign_place' })).toBe('create_and_assign_place');
    expect(writeToolOf('add_found_place', { via: 'delete_trip' })).toBe('add_found_place');
    expect(writeToolOf('create_place', { via: 'assign_place_to_day' })).toBe('create_place');
    // A proposal taken from an answer runs as the create its `via` names, and as nothing else.
    expect(writeToolOf('take_proposal', { via: 'create_hike' })).toBe('create_hike');
    expect(writeToolOf('take_proposal', { via: 'create_city_walk' })).toBe('create_city_walk');
    expect(writeToolOf('take_proposal', { via: 'create_and_assign_place' })).toBe('take_proposal');
    expect(writeToolOf('add_found_place', { via: 'create_hike' })).toBe('add_found_place');
    expect(foundPlaceArgs({ via: 'create_hike', name: 'Herzogstand', waypoints: [] })).toEqual({
      name: 'Herzogstand',
      waypoints: [],
    });
    expect(foundPlaceArgs({ via: 'assign_place_to_day', dayId: 3, placeId: 4, name: 'X' })).toEqual({
      dayId: 3,
      placeId: 4,
    });
    expect(foundPlaceArgs({ via: 'create_and_assign_place', dayId: 3, name: 'X', lat: 1, lng: 2 })).toEqual({
      dayId: 3,
      name: 'X',
      lat: 1,
      lng: 2,
    });
  });
});
