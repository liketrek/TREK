import {
  TOUR_POI_CATEGORIES,
  TOUR_POI_CATEGORIES_BY_TYPE,
  TOUR_POI_MAX_CATEGORIES,
  tourPoiSearchRequestSchema,
  tourPoiSearchResponseSchema,
  WALK_THEME_KEYS,
  WALK_THEMES,
} from './tour-poi-search.schema';

import { describe, expect, it } from 'vitest';

const line = [
  [47.4, 11.1],
  [47.41, 11.12],
];

describe('tour POI search contracts (PLN-02)', () => {
  it('offers each tour type categories of its own, every one a known category', () => {
    expect(TOUR_POI_CATEGORIES_BY_TYPE.hike).toContain('viewpoint');
    expect(TOUR_POI_CATEGORIES_BY_TYPE.kayak).toContain('slipway');
    expect(TOUR_POI_CATEGORIES_BY_TYPE.hike).not.toContain('slipway');
    expect(TOUR_POI_CATEGORIES_BY_TYPE.ski).toContain('shelter');
    expect(TOUR_POI_CATEGORIES_BY_TYPE.ski).not.toContain('slipway');
    for (const type of Object.values(TOUR_POI_CATEGORIES_BY_TYPE))
      for (const category of type) expect(TOUR_POI_CATEGORIES).toContain(category);
  });

  it('takes a line, a corridor and up to six categories, and nothing else', () => {
    const ok = { tour_type: 'hike', categories: ['viewpoint', 'food'], corridor_m: 500, line };
    expect(tourPoiSearchRequestSchema.safeParse(ok).success).toBe(true);
    expect(tourPoiSearchRequestSchema.safeParse({ ...ok, categories: [] }).success).toBe(false);
    expect(tourPoiSearchRequestSchema.safeParse({ ...ok, categories: ['fuel'] }).success).toBe(false);
    expect(tourPoiSearchRequestSchema.safeParse({ ...ok, corridor_m: 5000 }).success).toBe(false);
    expect(tourPoiSearchRequestSchema.safeParse({ ...ok, line: [[47, 11]] }).success).toBe(false);
    expect(
      tourPoiSearchRequestSchema.safeParse({
        ...ok,
        line: [
          [91, 11],
          [47, 11],
        ],
      }).success,
    ).toBe(false);
    expect(tourPoiSearchRequestSchema.safeParse({ ...ok, tour_type: 'food' }).success).toBe(false);
    expect(tourPoiSearchRequestSchema.safeParse({ ...ok, add: true }).success).toBe(false);
  });

  it('answers places with where they lie against the line, opening hours nullable', () => {
    const answer = tourPoiSearchResponseSchema.parse({
      pois: [
        {
          id: 'node:1',
          name: 'Spring',
          lat: 47.4,
          lng: 11.1,
          category: 'drinking_water',
          kind: 'amenity=drinking_water',
          source: 'openstreetmap',
          address: null,
          website: null,
          phone: null,
          opening_hours: null,
          distance_m: 40,
          along_m: 1200,
        },
      ],
      truncated: false,
      partial: true,
      capped: false,
      unavailable: [],
    });
    expect(answer.partial).toBe(true);
    expect(answer.pois[0]?.distance_m).toBe(40);
  });

  it('TOUR-HIGHLIGHT-005: marks a highlight with a flag that may be left off, and refuses one that is no flag', () => {
    const poi = {
      id: 'way:9',
      name: 'Piazza San Marco',
      lat: 45.434,
      lng: 12.338,
      category: 'sights',
      kind: 'place=square',
      source: 'openstreetmap',
      address: null,
      website: null,
      phone: null,
      opening_hours: null,
      distance_m: 12,
      along_m: 300,
    };
    const answer = { truncated: false, partial: false, capped: false, unavailable: [] };
    const parsed = tourPoiSearchResponseSchema.parse({ ...answer, pois: [{ ...poi, highlight: true }, poi] });
    expect(parsed.pois.map((found) => found.highlight)).toEqual([true, undefined]);
    const notAFlag = { ...answer, pois: [{ ...poi, highlight: 'yes' }] };
    expect(tourPoiSearchResponseSchema.safeParse(notAFlag).success).toBe(false);
  });

  it('names the kinds that could not be searched, each a known category, and always says so', () => {
    const answer = { pois: [], truncated: false, partial: false, capped: false };
    expect(tourPoiSearchResponseSchema.parse({ ...answer, unavailable: ['viewpoint'] }).unavailable).toEqual([
      'viewpoint',
    ]);
    expect(tourPoiSearchResponseSchema.safeParse({ ...answer, unavailable: ['fuel'] }).success).toBe(false);
    expect(tourPoiSearchResponseSchema.safeParse(answer).success).toBe(false);
  });
});

describe('e-bike charging along a bike tour (BIK-07)', () => {
  const charger = {
    id: 'node:7',
    name: '',
    lat: 47.4,
    lng: 11.1,
    category: 'ebike_charging',
    kind: 'amenity=charging_station&bicycle=designated',
    source: 'openstreetmap',
    address: null,
    website: null,
    phone: null,
    opening_hours: null,
    distance_m: 80,
    along_m: 5200,
  };
  const answer = { truncated: false, partial: false, capped: false, unavailable: [] };

  it('is offered to a bike tour after its first three, and to no other tour', () => {
    expect(TOUR_POI_CATEGORIES_BY_TYPE.bike.slice(0, 3)).toEqual(['drinking_water', 'bike_repair', 'food']);
    expect(TOUR_POI_CATEGORIES_BY_TYPE.bike).toContain('ebike_charging');
    for (const [type, categories] of Object.entries(TOUR_POI_CATEGORIES_BY_TYPE))
      if (type !== 'bike') expect(categories).not.toContain('ebike_charging');
    const search = { tour_type: 'bike', categories: ['ebike_charging'], corridor_m: 1000, line };
    expect(tourPoiSearchRequestSchema.safeParse(search).success).toBe(true);
  });

  it('carries what the point states, and leaves the field off a place that is no charger', () => {
    const charging = {
      bicycle: 'designated',
      sockets: [{ type: 'schuko', count: 2, kw: null }],
      capacity: null,
      fee: false,
      access: null,
    };
    const parsed = tourPoiSearchResponseSchema.parse({ ...answer, pois: [{ ...charger, charging }, charger] });
    expect(parsed.pois[0]?.charging).toEqual(charging);
    expect(parsed.pois[1]).not.toHaveProperty('charging');
  });

  it('refuses a charger that does not say it is for bicycles', () => {
    const charging = { bicycle: 'no', sockets: [], capacity: null, fee: null, access: null };
    expect(tourPoiSearchResponseSchema.safeParse({ ...answer, pois: [{ ...charger, charging }] }).success).toBe(false);
  });
});

describe('city walk themes (CW-05)', () => {
  it('offers four themes, each a search a walk may ask for', () => {
    expect(WALK_THEME_KEYS).toEqual(['culture', 'parks', 'food', 'mixed']);
    for (const key of WALK_THEME_KEYS) {
      const categories = WALK_THEMES[key];
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.length).toBeLessThanOrEqual(TOUR_POI_MAX_CATEGORIES);
      for (const category of categories) expect(TOUR_POI_CATEGORIES_BY_TYPE.walk).toContain(category);
      const search = { tour_type: 'walk', categories: [...categories], corridor_m: 250, line };
      expect(tourPoiSearchRequestSchema.safeParse(search).success).toBe(true);
    }
  });

  it("keeps a walk's own kinds to a walk's list, and a hike's to a hike's", () => {
    for (const category of ['museum', 'park', 'cafe', 'restaurant', 'market'] as const) {
      expect(TOUR_POI_CATEGORIES_BY_TYPE.walk).toContain(category);
      expect(TOUR_POI_CATEGORIES_BY_TYPE.hike).not.toContain(category);
    }
    expect(TOUR_POI_CATEGORIES_BY_TYPE.walk).not.toContain('peak');
  });
});
