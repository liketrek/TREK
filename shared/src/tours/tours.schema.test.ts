import { tourGpxImportFieldsSchema } from './tour-gpx-import.schema';
import {
  BIKE_PROFILES,
  HIKING_PREFERENCE_KEYS,
  hikingPreferencesOf,
  MAX_PADDLE_SPEED_KMH,
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  MAX_STATION_STAY_MINUTES,
  recommendedPaddleSpeedKmh,
  plannedTourDurationMinutesSchema,
  RUN_PROFILES,
  stationKeySchema,
  tourCopyRequestSchema,
  tourCreateRequestSchema,
  tourDescriptionSchema,
  tourListItemSchema,
  tourMaxHikingDifficultySchema,
  tourNameSchema,
  tourWebsiteSchema,
} from './tours.schema';

import { describe, expect, it } from 'vitest';

const baseRequest = {
  name: 'Ridge walk',
  route_geometry: [
    [48, 11, 600],
    [48.01, 11.02, 650],
  ],
  waypoints: [
    { lat: 48, lng: 11, role: 'start' as const, sequence: 0 },
    { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
  ],
};

describe('Tours maximum hiking difficulty', () => {
  it('defaults create requests to T2', () => {
    expect(tourCreateRequestSchema.parse(baseRequest).max_hiking_difficulty).toBe(2);
  });

  it('keeps a drawn tour from saving without one', () => {
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, max_hiking_difficulty: null })).toThrow();
  });

  it('lets a GPX-imported tour carry none', () => {
    const imported = {
      place_id: 1,
      tour_type: 'hike',
      distance: 4.2,
      elevation_gain: null,
      elevation_loss: null,
      duration: null,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 0.3,
      max_hiking_difficulty: null,
      name: 'Ridge walk',
      planned: false,
      caution: true,
      has_waypoints: false,
    };
    expect(tourListItemSchema.parse(imported).max_hiking_difficulty).toBeNull();
    expect(() => tourListItemSchema.parse({ ...imported, max_hiking_difficulty: 7 })).toThrow();
  });

  it('accepts only integer values from T1 through T6', () => {
    for (const value of [1, 2, 3, 4, 5, 6]) {
      expect(tourMaxHikingDifficultySchema.parse(value)).toBe(value);
    }
    for (const value of [0, -1, 7, 1.5, '2', null]) {
      expect(() => tourMaxHikingDifficultySchema.parse(value)).toThrow();
    }
  });
});

describe('Tour planned total duration', () => {
  it('allows an empty value and bounded whole minutes independently of route duration', () => {
    expect(plannedTourDurationMinutesSchema.parse(null)).toBeNull();
    expect(plannedTourDurationMinutesSchema.parse(0)).toBe(0);
    expect(plannedTourDurationMinutesSchema.parse(MAX_PLANNED_TOUR_DURATION_MINUTES)).toBe(
      MAX_PLANNED_TOUR_DURATION_MINUTES,
    );
    expect(
      tourCreateRequestSchema.parse({ ...baseRequest, duration_seconds: 1800, planned_duration_minutes: 95 }),
    ).toMatchObject({
      duration_seconds: 1800,
      planned_duration_minutes: 95,
    });
    expect(plannedTourDurationMinutesSchema.parse(0)).toBe(0);
    expect(tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: 35 })).toMatchObject({
      break_additional_minutes: 35,
    });
    expect(tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: 0 })).toMatchObject({
      break_additional_minutes: 0,
    });
    expect(tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: null })).toMatchObject({
      break_additional_minutes: null,
    });
  });

  it.each([-1, 1441, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid planned minutes %s', (value) => {
    expect(() => plannedTourDurationMinutesSchema.parse(value)).toThrow();
  });
  it('rejects automatic walking plus breaks beyond one day but accepts an explicit bounded override', () => {
    expect(() =>
      tourCreateRequestSchema.parse({
        ...baseRequest,
        duration_seconds: 1430 * 60,
        break_additional_minutes: 11,
      }),
    ).toThrow();
    expect(
      tourCreateRequestSchema.parse({
        ...baseRequest,
        duration_seconds: 1430 * 60,
        break_additional_minutes: 11,
        planned_duration_minutes: 1200,
      }),
    ).toMatchObject({ planned_duration_minutes: 1200 });
  });

  it.each([-1, 1.5, 1441, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid breaks %s', (value) => {
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: value })).toThrow();
  });
});

describe('Tour informational website', () => {
  it('accepts and normalizes a credential-free HTTPS URL', () => {
    expect(tourWebsiteSchema.parse('  HTTPS://WWW.KOMOOT.COM/tour/42  ')).toBe('https://www.komoot.com/tour/42');
  });

  it.each([
    'http://komoot.com/tour/42',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'file:///tmp/route.gpx',
    'not a url',
    'https://user:password@komoot.com/tour/42',
    'https://user@komoot.com/tour/42',
  ])('rejects unsafe or malformed website %s', (value) => {
    expect(() => tourWebsiteSchema.parse(value)).toThrow();
  });

  it('carries description and website in a Tour create request without making them facet fields', () => {
    const parsed = tourCreateRequestSchema.parse({
      ...baseRequest,
      description: '  A quiet ridge walk  ',
      website: 'https://alltrails.com/trail/42',
    });
    expect(parsed).toMatchObject({
      description: 'A quiet ridge walk',
      website: 'https://alltrails.com/trail/42',
    });
    expect(parsed).not.toHaveProperty('source_url');
    expect(parsed).not.toHaveProperty('source_ref');
  });

  it.each([-1, 1.5, 1441, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid breaks %s', (value) => {
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, break_additional_minutes: value })).toThrow();
  });
});

describe('Tours fixed legs', () => {
  const leg = (from: [number, number], to: [number, number]) => ({
    kind: 'ferrata' as const,
    ref: 'way/1',
    name: 'Via A',
    geometry: [from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2] as [number, number], to],
  });

  it('accepts a fixed leg that runs from its waypoint to the next one', () => {
    const request = {
      ...baseRequest,
      waypoints: [
        { lat: 48, lng: 11, role: 'start' as const, sequence: 0, fixed_leg: leg([48, 11], [48.01, 11.02]) },
        { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
      ],
    };
    expect(tourCreateRequestSchema.parse(request).waypoints[0]?.fixed_leg).toMatchObject({
      kind: 'ferrata',
      ref: 'way/1',
    });
  });

  it('refuses a fixed leg that does not join its waypoints, or hangs off the last one', () => {
    const elsewhere = {
      ...baseRequest,
      waypoints: [
        { lat: 48, lng: 11, role: 'start' as const, sequence: 0, fixed_leg: leg([47, 10], [48.01, 11.02]) },
        { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
      ],
    };
    expect(() => tourCreateRequestSchema.parse(elsewhere)).toThrow(/fixed leg/);
    const dangling = {
      ...baseRequest,
      waypoints: [
        { lat: 48, lng: 11, role: 'start' as const, sequence: 0 },
        { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1, fixed_leg: leg([48.01, 11.02], [48.02, 11.03]) },
      ],
    };
    expect(() => tourCreateRequestSchema.parse(dangling)).toThrow(/fixed leg/);
  });
});

describe('Tours ferry legs (CW-12)', () => {
  const ferry = (crossings: Array<[number, number]>, minutes: number | null = 7) => ({
    kind: 'ferry' as const,
    geometry: [
      [48, 11],
      [48.004, 11.008],
      [48.006, 11.012],
      [48.01, 11.02],
    ] as [number, number][],
    crossings,
    minutes,
    walk_minutes: 2,
  });
  const withLeg = (leg: ReturnType<typeof ferry>, type: 'walk' | 'hike') => ({
    ...baseRequest,
    tour_type: type,
    ...(type === 'walk' ? { max_hiking_difficulty: null } : {}),
    waypoints: [
      { lat: 48, lng: 11, role: 'start' as const, sequence: 0, fixed_leg: leg },
      { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
    ],
  });

  it('takes a crossing by boat on a city walk, with where on its leg the boat runs and its minutes apart', () => {
    expect(tourCreateRequestSchema.parse(withLeg(ferry([[1, 2]]), 'walk')).waypoints[0]?.fixed_leg).toEqual(
      ferry([[1, 2]]),
    );
    expect(tourCreateRequestSchema.parse(withLeg(ferry([[1, 2]], null), 'walk')).waypoints[0]?.fixed_leg).toMatchObject(
      {
        minutes: null,
      },
    );
    // Two boats on one leg with a walk between them: each stretch is kept on its own.
    const twice = ferry([
      [0, 1],
      [2, 3],
    ]);
    expect(tourCreateRequestSchema.parse(withLeg(twice, 'walk')).waypoints[0]?.fixed_leg).toEqual(twice);
  });

  it('refuses a crossing on any other type, or one that does not run forwards between two points of its leg', () => {
    expect(() => tourCreateRequestSchema.parse(withLeg(ferry([[1, 2]]), 'hike'))).toThrow(
      /ferry leg belongs to a city walk/,
    );
    expect(() => tourCreateRequestSchema.parse(withLeg(ferry([[2, 1]]), 'walk'))).toThrow(/crossing runs between/);
    expect(() => tourCreateRequestSchema.parse(withLeg(ferry([[1, 4]]), 'walk'))).toThrow(/crossing runs between/);
    const overlapping = ferry([
      [0, 2],
      [1, 3],
    ]);
    expect(() => tourCreateRequestSchema.parse(withLeg(overlapping, 'walk'))).toThrow(/crossing runs between/);
    expect(() => tourCreateRequestSchema.parse(withLeg(ferry([]), 'walk'))).toThrow();
  });
});

describe('Tours free legs', () => {
  const free = (from: [number, number], to: [number, number]) => ({ kind: 'free' as const, geometry: [from, to] });

  it('takes a hand-drawn leg that runs from its waypoint to the next one, with no reference', () => {
    const request = {
      ...baseRequest,
      waypoints: [
        { lat: 48, lng: 11, role: 'start' as const, sequence: 0, fixed_leg: free([48, 11], [48.01, 11.02]) },
        { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
      ],
    };
    expect(tourCreateRequestSchema.parse(request).waypoints[0]?.fixed_leg).toEqual(free([48, 11], [48.01, 11.02]));
  });

  it('holds a free leg to the same ends as a via ferrata', () => {
    const request = {
      ...baseRequest,
      waypoints: [
        { lat: 48, lng: 11, role: 'start' as const, sequence: 0, fixed_leg: free([48.2, 11], [48.01, 11.02]) },
        { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
      ],
    };
    expect(() => tourCreateRequestSchema.parse(request)).toThrow(/fixed leg/);
  });

  it('refuses a leg of a kind it does not know', () => {
    const request = {
      ...baseRequest,
      waypoints: [
        {
          lat: 48,
          lng: 11,
          role: 'start' as const,
          sequence: 0,
          fixed_leg: {
            kind: 'ferry',
            geometry: [
              [48, 11],
              [48.01, 11.02],
            ],
          },
        },
        { lat: 48.01, lng: 11.02, role: 'end' as const, sequence: 1 },
      ],
    };
    expect(() => tourCreateRequestSchema.parse(request)).toThrow();
  });
});

describe('Tours paddle type', () => {
  const paddle = {
    ...baseRequest,
    tour_type: 'kayak' as const,
    boat_type: 'canoe' as const,
    water_context: 'river' as const,
  };

  it('saves a paddle tour with one boat, its water and no hiking limit', () => {
    const parsed = tourCreateRequestSchema.parse(paddle);
    expect(parsed).toMatchObject({
      tour_type: 'kayak',
      boat_type: 'canoe',
      water_context: 'river',
      max_hiking_difficulty: null,
    });
  });

  it('keeps the speed a paddler chose', () => {
    expect(tourCreateRequestSchema.parse({ ...paddle, paddle_speed_kmh: 5.5 }).paddle_speed_kmh).toBe(5.5);
    expect(() => tourCreateRequestSchema.parse({ ...paddle, paddle_speed_kmh: 0 })).toThrow();
    expect(() => tourCreateRequestSchema.parse({ ...paddle, paddle_speed_kmh: MAX_PADDLE_SPEED_KMH + 1 })).toThrow();
  });

  it('refuses a paddle tour without a boat or water, or with a hiking limit', () => {
    expect(() => tourCreateRequestSchema.parse({ ...paddle, boat_type: undefined })).toThrow(/boat type/);
    expect(() => tourCreateRequestSchema.parse({ ...paddle, water_context: null })).toThrow(/water context/);
    expect(() => tourCreateRequestSchema.parse({ ...paddle, max_hiking_difficulty: 2 })).toThrow(/hiking difficulty/);
  });

  it('refuses boat fields on a hike, and a type nobody can plan yet', () => {
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, boat_type: 'sup' })).toThrow(/paddle tour/);
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, paddle_speed_kmh: 4 })).toThrow(/paddle tour/);
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, tour_type: 'food' })).toThrow();
  });

  it('suggests 4 km/h for kayak, canoe and SUP, and nothing for any other boat', () => {
    expect(['kayak', 'canoe', 'sup'].map((boat) => recommendedPaddleSpeedKmh(boat as 'kayak'))).toEqual([4, 4, 4]);
    expect(recommendedPaddleSpeedKmh('other')).toBeNull();
    expect(recommendedPaddleSpeedKmh(null)).toBeNull();
  });

  it('reads a list item cached before the paddle fields existed', () => {
    const cached = {
      place_id: 1,
      tour_type: 'hike',
      distance: 1,
      elevation_gain: null,
      elevation_loss: null,
      duration: null,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: 2,
      name: 'Old',
      planned: false,
      caution: false,
    };
    expect(tourListItemSchema.parse(cached).boat_type).toBeUndefined();
  });
});

describe('hiking preferences (MF-08)', () => {
  const hike = {
    name: 'Ridge',
    route_geometry: [
      [47, 11, 600],
      [47.01, 11.01, 650],
    ],
    waypoints: [
      { lat: 47, lng: 11, role: 'start', sequence: 0 },
      { lat: 47.01, lng: 11.01, role: 'end', sequence: 1 },
    ],
  };

  it('keeps only the preferences switched on, and none as null', () => {
    expect(hikingPreferencesOf({ avoid_steps: true, avoid_climbs: false })).toEqual({ avoid_steps: true });
    expect(hikingPreferencesOf({ avoid_steps: false })).toBeNull();
    expect(hikingPreferencesOf(null)).toBeNull();
    const parsed = tourCreateRequestSchema.parse({
      ...hike,
      hiking_preferences: { avoid_climbs: true, avoid_ferries: false },
    });
    expect(hikingPreferencesOf(parsed.hiking_preferences)).toEqual({ avoid_climbs: true });
    expect(tourCreateRequestSchema.parse(hike).hiking_preferences).toBeUndefined();
  });

  it('RTE-01: offers exactly the three preferences, and refuses a key it does not know', () => {
    expect(HIKING_PREFERENCE_KEYS).toEqual(['avoid_climbs', 'avoid_steps', 'avoid_ferries']);
    const unknown = tourCreateRequestSchema.safeParse({ ...hike, hiking_preferences: { shortest: true } });
    expect(unknown.success).toBe(false);
  });

  it('refuses a preference it does not know, and any on a paddle tour', () => {
    expect(tourCreateRequestSchema.safeParse({ ...hike, hiking_preferences: { avoid_hills: true } }).success).toBe(
      false,
    );
    const paddle = { ...hike, tour_type: 'kayak', boat_type: 'kayak', water_context: 'lake' };
    expect(tourCreateRequestSchema.safeParse({ ...paddle, hiking_preferences: { avoid_steps: true } }).success).toBe(
      false,
    );
    expect(tourCreateRequestSchema.safeParse({ ...paddle, hiking_preferences: { avoid_steps: false } }).success).toBe(
      true,
    );
  });
});

describe('bike tours (BIK-01 to BIK-04)', () => {
  const bike = { ...baseRequest, tour_type: 'bike' as const, bike_profile: 'gravel' as const };
  const ferrata = {
    kind: 'ferrata' as const,
    ref: 'way/1',
    name: null,
    geometry: [
      [48, 11],
      [48.01, 11.02],
    ],
  };

  it('saves a bike tour with its one profile and nothing of a hike or a paddle tour', () => {
    expect(BIKE_PROFILES).toEqual(['touring', 'road', 'gravel', 'mtb']);
    expect(tourCreateRequestSchema.parse(bike)).toMatchObject({
      tour_type: 'bike',
      bike_profile: 'gravel',
      max_hiking_difficulty: null,
    });
  });

  it('refuses a bike tour without a profile, with a hike or a paddler field, or over a via ferrata', () => {
    expect(() => tourCreateRequestSchema.parse({ ...bike, bike_profile: null })).toThrow(/bike profile/);
    expect(() => tourCreateRequestSchema.parse({ ...bike, bike_profile: 'ebike' })).toThrow();
    expect(() => tourCreateRequestSchema.parse({ ...bike, max_hiking_difficulty: 3 })).toThrow(/hiking difficulty/);
    expect(() => tourCreateRequestSchema.parse({ ...bike, hiking_preferences: { avoid_steps: true } })).toThrow(
      /hiking preferences/,
    );
    expect(() => tourCreateRequestSchema.parse({ ...bike, boat_type: 'sup' })).toThrow(/paddle tour/);
    const overFerrata = {
      ...bike,
      waypoints: [{ ...bike.waypoints[0], fixed_leg: ferrata }, bike.waypoints[1]],
    };
    expect(() => tourCreateRequestSchema.parse(overFerrata)).toThrow(/via ferrata/);
  });

  it('keeps a profile to a bike tour', () => {
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, bike_profile: 'road' })).toThrow(/bike tour/);
    const paddle = {
      ...baseRequest,
      tour_type: 'kayak',
      boat_type: 'kayak',
      water_context: 'lake',
      bike_profile: 'mtb',
    };
    expect(() => tourCreateRequestSchema.parse(paddle)).toThrow(/bike tour/);
  });

  it('imports a GPX file as a bike tour only with its profile, and a profile only for one', () => {
    expect(tourGpxImportFieldsSchema.parse({ tour_type: 'bike', bike_profile: 'road' })).toMatchObject({
      tour_type: 'bike',
      bike_profile: 'road',
    });
    expect(tourGpxImportFieldsSchema.safeParse({ tour_type: 'bike' }).success).toBe(false);
    expect(tourGpxImportFieldsSchema.safeParse({ bike_profile: 'road' }).success).toBe(false);
    expect(
      tourGpxImportFieldsSchema.safeParse({ tour_type: 'kayak', boat_type: 'sup', water_context: 'lake' }).success,
    ).toBe(true);
  });
});

describe('city walks (CW-01 to CW-03, CW-10)', () => {
  const walk = { ...baseRequest, tour_type: 'walk' as const };
  const station = {
    key: '0b7e7c5a-5d43-4c79-9b52-2f7f0d0e2c11',
    name: 'Cathedral',
    stay_minutes: 30,
    importance: 'must' as const,
    protected: true,
    opening_hours: 'Mo-Su 09:00-18:00',
  };
  const withFirst = <T extends { waypoints: typeof baseRequest.waypoints }>(request: T, extra: object) => ({
    ...request,
    waypoints: [{ ...request.waypoints[0], ...extra }, request.waypoints[1]],
  });

  it('saves a walk with its stations, and no hiking limit', () => {
    const parsed = tourCreateRequestSchema.parse(withFirst(walk, station));
    expect(parsed).toMatchObject({ tour_type: 'walk', max_hiking_difficulty: null });
    expect(parsed.waypoints[0]).toMatchObject(station);
  });

  it("keeps a station's stay, importance and protection to a city walk", () => {
    for (const extra of [{ stay_minutes: 20 }, { importance: 'optional' }, { protected: true }]) {
      expect(() => tourCreateRequestSchema.parse(withFirst(baseRequest, extra))).toThrow(
        /stations belong to a city walk/,
      );
    }
    // A key, a name and opening hours are any point's, and protection switched off is no protection.
    const named = withFirst(baseRequest, { key: 'stop-a1', name: 'Hut', opening_hours: '24/7', protected: false });
    expect(tourCreateRequestSchema.safeParse(named).success).toBe(true);
  });

  it('refuses a walk over a via ferrata, with a hiking limit or with hiking preferences', () => {
    const ferrata = {
      kind: 'ferrata' as const,
      ref: 'way/1',
      name: null,
      geometry: [
        [48, 11],
        [48.01, 11.02],
      ],
    };
    expect(() => tourCreateRequestSchema.parse(withFirst(walk, { fixed_leg: ferrata }))).toThrow(
      /a city walk has no via ferrata/,
    );
    expect(() => tourCreateRequestSchema.parse({ ...walk, max_hiking_difficulty: 3 })).toThrow(
      /a city walk has no hiking difficulty/,
    );
    expect(() => tourCreateRequestSchema.parse({ ...walk, hiking_preferences: { avoid_steps: true } })).toThrow(
      /a city walk has no hiking preferences/,
    );
  });

  it('takes a station key of 6 to 64 letters, digits, dashes and underscores', () => {
    expect(stationKeySchema.safeParse('0b7e7c5a-5d43-4c79-9b52-2f7f0d0e2c11').success).toBe(true);
    expect(stationKeySchema.safeParse('stop_1').success).toBe(true);
    expect(stationKeySchema.safeParse('x'.repeat(64)).success).toBe(true);
    for (const key of ['stop1', 'x'.repeat(65), 'stop/1', 'stop 1', 'stöp-1']) {
      expect(stationKeySchema.safeParse(key).success).toBe(false);
    }
  });

  it('takes a stay from 0, a point passed through, to a whole day', () => {
    expect(MAX_STATION_STAY_MINUTES).toBe(1440);
    for (const stay_minutes of [0, 1440, null]) {
      expect(tourCreateRequestSchema.safeParse(withFirst(walk, { stay_minutes })).success).toBe(true);
    }
    for (const stay_minutes of [1441, -1, 12.5]) {
      expect(tourCreateRequestSchema.safeParse(withFirst(walk, { stay_minutes })).success).toBe(false);
    }
  });

  const listed = {
    place_id: 1,
    name: 'Old town',
    tour_type: 'walk',
    distance: null,
    elevation_gain: null,
    elevation_loss: null,
    duration: null,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: null,
    max_hiking_difficulty: null,
    planned: false,
    caution: false,
    has_waypoints: true,
    station_count: 3,
  };

  it("lists a walk's station count, and reads an item cached before it existed", () => {
    const item = tourListItemSchema.parse(listed);
    expect(item.station_count).toBe(3);
    const { station_count: _count, ...cached } = item;
    expect(tourListItemSchema.parse(cached).station_count).toBeUndefined();
    expect(tourListItemSchema.safeParse({ ...item, station_count: -1 }).success).toBe(false);
  });

  it('lists whether a walk still waits for its way, and reads a list cached before it was said (CW-11)', () => {
    expect(tourListItemSchema.parse({ ...listed, route_pending: true }).route_pending).toBe(true);
    expect(tourListItemSchema.parse(listed).route_pending).toBeUndefined();
    expect(tourListItemSchema.safeParse({ ...listed, route_pending: 1 }).success).toBe(false);
  });

  it('holds a create, an edit and a copy to one name and one description', () => {
    expect(tourNameSchema.parse('  Old town  ')).toBe('Old town');
    expect(['', '   ', 'x'.repeat(256)].map((name) => tourNameSchema.safeParse(name).success)).toEqual([
      false,
      false,
      false,
    ]);
    expect(tourCopyRequestSchema.safeParse({ name: 'x'.repeat(256) }).success).toBe(false);
    expect(tourDescriptionSchema.parse(null)).toBeNull();
    expect(tourDescriptionSchema.safeParse('x'.repeat(2001)).success).toBe(false);
  });
});

describe('a hike is summer only (HIK-01 withdrawn)', () => {
  it('keeps no winter label on a hike: the field is not part of the contract and is dropped', () => {
    const parsed = tourCreateRequestSchema.parse({ ...baseRequest, winter_activity: 'snowshoe' });
    expect(parsed).not.toHaveProperty('winter_activity');
    const listed = tourListItemSchema.parse({
      place_id: 1,
      tour_type: 'hike',
      distance: 8,
      elevation_gain: 400,
      elevation_loss: 400,
      duration: 180,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: 2,
      name: 'Snowy ridge',
      planned: false,
      caution: false,
      winter_activity: 'winter_hike',
    });
    expect(listed).not.toHaveProperty('winter_activity');
  });
});

describe('runs (RUN-01)', () => {
  const run = { ...baseRequest, tour_type: 'run' as const, run_profile: 'running' as const };
  const ferrata = {
    kind: 'ferrata' as const,
    ref: 'way/1',
    name: null,
    geometry: [
      [48, 11],
      [48.01, 11.02],
    ],
  };

  it('saves a run with its profile and pace, and nothing of a hike, a bike tour or a paddle tour', () => {
    expect(RUN_PROFILES).toEqual(['running', 'trail']);
    expect(tourCreateRequestSchema.parse({ ...run, run_pace_seconds_per_km: 360 })).toMatchObject({
      tour_type: 'run',
      run_profile: 'running',
      run_pace_seconds_per_km: 360,
      max_hiking_difficulty: null,
    });
    // Without a pace the run has no time: unknown, never a pace TREK made up.
    expect(tourCreateRequestSchema.parse(run).run_pace_seconds_per_km).toBeUndefined();
    expect(tourCreateRequestSchema.parse({ ...run, run_pace_seconds_per_km: null }).run_pace_seconds_per_km).toBeNull();
  });

  it('saves a trail run like any run, with its own profile and the same pace (RUN-02)', () => {
    expect(tourCreateRequestSchema.parse({ ...run, run_profile: 'trail', run_pace_seconds_per_km: 450 })).toMatchObject(
      {
        tour_type: 'run',
        run_profile: 'trail',
        run_pace_seconds_per_km: 450,
      },
    );
    expect(tourGpxImportFieldsSchema.parse({ tour_type: 'run', run_profile: 'trail' }).run_profile).toBe('trail');
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, run_profile: 'trail' })).toThrow(/belongs to a run/);
  });

  it('refuses a pace that is no whole number of seconds, not positive or out of bounds', () => {
    for (const pace of [0, -300, 119, 1201, 360.5, Number.NaN]) {
      expect(tourCreateRequestSchema.safeParse({ ...run, run_pace_seconds_per_km: pace }).success).toBe(false);
    }
    expect(tourCreateRequestSchema.safeParse({ ...run, run_pace_seconds_per_km: 120 }).success).toBe(true);
    expect(tourCreateRequestSchema.safeParse({ ...run, run_pace_seconds_per_km: 1200 }).success).toBe(true);
  });

  it('refuses a run without a profile, with a profile it does not know, or with fields of another type', () => {
    expect(() => tourCreateRequestSchema.parse({ ...run, run_profile: null })).toThrow(/a run needs a run profile/);
    expect(tourCreateRequestSchema.safeParse({ ...run, run_profile: 'sprint' }).success).toBe(false);
    expect(() => tourCreateRequestSchema.parse({ ...run, max_hiking_difficulty: 2 })).toThrow(/a run has no hiking/);
    expect(() => tourCreateRequestSchema.parse({ ...run, ski_discipline: 'alpine' })).toThrow(/belongs to a ski tour/);
    expect(() => tourCreateRequestSchema.parse({ ...run, bike_profile: 'road' })).toThrow(/bike tour/);
    expect(() => tourCreateRequestSchema.parse({ ...run, boat_type: 'sup' })).toThrow(/paddle tour/);
    const overFerrata = { ...run, waypoints: [{ ...run.waypoints[0], fixed_leg: ferrata }, run.waypoints[1]] };
    expect(() => tourCreateRequestSchema.parse(overFerrata)).toThrow(/a run has no via ferrata/);
  });

  it('keeps a profile and a pace to a run', () => {
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, run_profile: 'running' })).toThrow(/belongs to a run/);
    const bike = { ...baseRequest, tour_type: 'bike', bike_profile: 'road', run_pace_seconds_per_km: 300 };
    expect(() => tourCreateRequestSchema.parse(bike)).toThrow(/run_pace_seconds_per_km belongs to a run/);
  });

  it('imports a GPX file as a run only with its profile, and a run profile only for one', () => {
    expect(tourGpxImportFieldsSchema.parse({ tour_type: 'run', run_profile: 'running' })).toMatchObject({
      tour_type: 'run',
      run_profile: 'running',
    });
    expect(tourGpxImportFieldsSchema.safeParse({ tour_type: 'run' }).success).toBe(false);
    const bike = { tour_type: 'bike', bike_profile: 'road', run_profile: 'running' };
    expect(tourGpxImportFieldsSchema.safeParse(bike).success).toBe(false);
  });

  it('lists the profile and pace, and reads a list cached before they existed', () => {
    const listed = {
      place_id: 1,
      tour_type: 'run',
      distance: 8,
      elevation_gain: 40,
      elevation_loss: 40,
      duration: 48,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: null,
      name: 'River loop',
      planned: false,
      caution: false,
    };
    const planned = { ...listed, run_profile: 'running', run_pace_seconds_per_km: 360 };
    expect(tourListItemSchema.parse(planned)).toMatchObject({ run_profile: 'running', run_pace_seconds_per_km: 360 });
    expect(tourListItemSchema.parse(listed).run_profile).toBeUndefined();
  });
});

describe('horse tours (HOR-01)', () => {
  const line = [
    [48, 11],
    [48.005, 11.01],
    [48.01, 11.02],
  ];
  const section = {
    kind: 'horse_route' as const,
    ref: 'relation/42',
    name: 'Reitweg Isartal',
    geometry: line,
    signposted: 'with' as const,
    access: [{ value: 'designated' as const, length_m: 1200 }],
  };
  const drawn = { kind: 'free' as const, geometry: [line[0], line[2]] };
  const ride = (leg: object | null, extra: object = {}) => ({
    ...baseRequest,
    tour_type: 'horse' as const,
    waypoints: [{ ...baseRequest.waypoints[0], ...(leg ? { fixed_leg: leg } : {}) }, baseRequest.waypoints[1]],
    ...extra,
  });

  it('saves a ride of horse route sections and stretches drawn by hand, with no hiking limit', () => {
    expect(tourCreateRequestSchema.parse(ride(section))).toMatchObject({
      tour_type: 'horse',
      max_hiking_difficulty: null,
      waypoints: [{ fixed_leg: section }, {}],
    });
    expect(tourCreateRequestSchema.safeParse(ride(drawn)).success).toBe(true);
    expect(tourCreateRequestSchema.safeParse(ride({ ...section, signposted: null, access: undefined })).success).toBe(
      true,
    );
  });

  it('refuses a routed leg on a ride, a via ferrata, a hiking limit or a riding time worked out', () => {
    expect(() => tourCreateRequestSchema.parse(ride(null))).toThrow(/follows a horse route or is drawn by hand/);
    const ferrata = { kind: 'ferrata', ref: 'way/1', name: null, geometry: [line[0], line[2]] };
    expect(() => tourCreateRequestSchema.parse(ride(ferrata))).toThrow(/horse tour has no via ferrata/);
    expect(() => tourCreateRequestSchema.parse(ride(section, { max_hiking_difficulty: 2 }))).toThrow(
      /hiking difficulty/,
    );
    expect(() => tourCreateRequestSchema.parse(ride(section, { duration_seconds: 3600 }))).toThrow(/riding time/);
    expect(tourCreateRequestSchema.safeParse(ride(section, { planned_duration_minutes: 240 })).success).toBe(true);
  });

  it('keeps a horse route section to a horse tour, and to a relation of OpenStreetMap', () => {
    const hike = {
      ...baseRequest,
      waypoints: [{ ...baseRequest.waypoints[0], fixed_leg: section }, baseRequest.waypoints[1]],
    };
    expect(() => tourCreateRequestSchema.parse(hike)).toThrow(/belongs to a horse tour/);
    expect(tourCreateRequestSchema.safeParse(ride({ ...section, ref: 'way/42' })).success).toBe(false);
    expect(tourCreateRequestSchema.safeParse(ride({ ...section, signposted: 'forward' })).success).toBe(false);
  });

  it('imports a GPX file as a ride, with nothing of another type', () => {
    expect(tourGpxImportFieldsSchema.parse({ tour_type: 'horse' })).toEqual({ tour_type: 'horse' });
    expect(tourGpxImportFieldsSchema.safeParse({ tour_type: 'horse', bike_profile: 'road' }).success).toBe(false);
  });
});
