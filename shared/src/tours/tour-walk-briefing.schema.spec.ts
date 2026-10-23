import { walkThemeSchema, WALK_THEME_KEYS, WALK_THEMES } from './tour-poi-search.schema';
import {
  CITY_WALK_BRIEFING_LIMITS,
  CITY_WALK_MAX_STATIONS,
  cityWalkBriefingRequestSchema,
  cityWalkCreateRequestSchema,
} from './tour-walk-briefing.schema';

import { describe, expect, it } from 'vitest';

const briefing = {
  start: { lat: 48.1, lng: 11.5 },
  start_time: '10:00',
  end_time: '13:00',
};

const spot = (index: number) => ({ name: `Stop ${index}`, lat: 48.1, lng: 11.5 });

describe('a city walk prepared from a briefing (CW-11)', () => {
  it('takes the four themes of a city walk, by their keys', () => {
    expect(walkThemeSchema.options).toEqual([...WALK_THEME_KEYS]);
    expect(Object.keys(WALK_THEMES)).toEqual([...WALK_THEME_KEYS]);
    expect(walkThemeSchema.safeParse('nightlife').success).toBe(false);
  });

  it('reads a start, a frame and nothing else as a briefing, and every part the traveller can add', () => {
    expect(cityWalkBriefingRequestSchema.safeParse(briefing).success).toBe(true);
    const full = {
      ...briefing,
      start: { name: 'Hotel', lat: 48.1, lng: 11.5 },
      end: { lat: 48.12, lng: 11.52 },
      day_id: 3,
      themes: ['culture', 'food'],
      wished: [{ ...spot(1), stay_minutes: 30, opening_hours: 'Mo-Su 09:00-18:00' }],
      trip_places: [{ place_id: 4, stay_minutes: null }],
      appointments: [{ ...spot(2), time: '11:30', stay_minutes: 60, place_id: 5 }],
      theme_places_max: 0,
      corridor_m: 500,
      lang: 'de',
      include_geometry: true,
    };
    expect(cityWalkBriefingRequestSchema.parse(full)).toEqual(full);
  });

  it('refuses a time that is no time of day, a field it does not know and more than its limits', () => {
    const refused = [
      { ...briefing, start_time: '9:00' },
      { ...briefing, end_time: '24:00' },
      { ...briefing, appointments: [{ ...spot(1), time: 'noon' }] },
      { ...briefing, start: { ...briefing.start, address: 'Main square' } },
      { ...briefing, route: [] },
      { ...briefing, themes: [] },
      { ...briefing, themes: ['culture', 'parks', 'food', 'mixed'] },
      { ...briefing, wished: Array.from({ length: CITY_WALK_BRIEFING_LIMITS.wished + 1 }, (_, i) => spot(i)) },
      {
        ...briefing,
        trip_places: Array.from({ length: CITY_WALK_BRIEFING_LIMITS.tripPlaces + 1 }, (_, i) => ({ place_id: i + 1 })),
      },
      {
        ...briefing,
        appointments: Array.from({ length: CITY_WALK_BRIEFING_LIMITS.appointments + 1 }, (_, i) => ({
          ...spot(i),
          time: '11:00',
        })),
      },
      { ...briefing, theme_places_max: CITY_WALK_BRIEFING_LIMITS.themePlaces + 1 },
      { ...briefing, corridor_m: 5000 },
      { ...briefing, include_geometry: 'yes' },
    ];
    expect(refused.map((body) => cityWalkBriefingRequestSchema.safeParse(body).success)).toEqual(
      refused.map(() => false),
    );
  });

  it('creates a walk with room for every station a proposal can hold', () => {
    const { wished, tripPlaces, appointments, themePlaces } = CITY_WALK_BRIEFING_LIMITS;
    // The start and the end besides.
    expect(wished + tripPlaces + appointments + themePlaces + 2).toBeLessThanOrEqual(CITY_WALK_MAX_STATIONS);
  });

  it('creates from two stations up, each with its own fields and no key, which the server gives', () => {
    const station = { lat: 48.1, lng: 11.5, name: 'Gate', stay_minutes: 15, importance: 'must', protected: true };
    expect(cityWalkCreateRequestSchema.safeParse({ name: ' Old town ', stations: [station, station] })).toMatchObject({
      success: true,
      data: { name: 'Old town' },
    });
    const refused = [
      { name: 'Old town', stations: [station] },
      { name: '', stations: [station, station] },
      { name: 'Old town', stations: [{ ...station, key: 'stop-gate' }, station] },
      { name: 'Old town', stations: [{ ...station, role: 'start' }, station] },
      { name: 'Old town', stations: Array.from({ length: CITY_WALK_MAX_STATIONS + 1 }, () => station) },
      { name: 'Old town', stations: [station, station], route_geometry: [] },
    ];
    expect(refused.map((body) => cityWalkCreateRequestSchema.safeParse(body).success)).toEqual(
      refused.map(() => false),
    );
  });
});
