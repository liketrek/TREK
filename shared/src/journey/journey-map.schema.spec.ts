import { journeyMapLayersResponseSchema, journeyPublicMapLayersResponseSchema } from './journey-map.schema';

import { describe, expect, it } from 'vitest';

const place = {
  place_id: 4,
  trip_id: 2,
  trip_title: 'Venice',
  name: 'Piazza San Marco',
  lat: 45.434,
  lng: 12.3388,
  days: ['2026-05-14'],
  time: '10:00',
  category_color: '#e11d48',
  category_icon: 'landmark',
  entry_id: null,
};

describe('journeyMapLayersResponseSchema', () => {
  it('JRNMAP-SCHEMA-001: each source answers on its own, a failed one beside the others', () => {
    const parsed = journeyMapLayersResponseSchema.safeParse({
      places: { status: 'ok', items: [place] },
      routes: { status: 'unavailable' },
      stays: { status: 'ok', items: [] },
    });
    expect(parsed.success).toBe(true);
  });

  it('JRNMAP-SCHEMA-002: refuses a status it does not know and items on a source that has none', () => {
    expect(
      journeyMapLayersResponseSchema.safeParse({
        places: { status: 'partial', items: [] },
        routes: { status: 'ok', items: [] },
        stays: { status: 'ok', items: [] },
      }).success,
    ).toBe(false);
    expect(
      journeyMapLayersResponseSchema.safeParse({
        places: { status: 'ok', items: [{ ...place, lat: 'north' }] },
        routes: { status: 'ok', items: [] },
        stays: { status: 'ok', items: [] },
      }).success,
    ).toBe(false);
  });
});

describe('journeyPublicMapLayersResponseSchema', () => {
  it('JRNMAP-SCHEMA-003: the public answer carries the recorded days, a withheld source as such', () => {
    const parsed = journeyPublicMapLayersResponseSchema.safeParse({
      places: { status: 'withheld' },
      routes: { status: 'withheld' },
      stays: { status: 'ok', items: [] },
      recordings: {
        status: 'ok',
        items: [
          {
            date: '2026-05-14',
            pieces: [
              [
                [45.43, 12.33],
                [45.44, 12.34],
              ],
            ],
            distance_m: 1520,
          },
        ],
      },
    });
    expect(parsed.success).toBe(true);
    expect(
      journeyPublicMapLayersResponseSchema.safeParse({
        places: { status: 'withheld' },
        routes: { status: 'withheld' },
        stays: { status: 'withheld' },
      }).success,
    ).toBe(false);
  });
});
