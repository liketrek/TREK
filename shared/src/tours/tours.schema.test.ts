import {
  MAX_PADDLE_SPEED_KMH,
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  recommendedPaddleSpeedKmh,
  plannedTourDurationMinutesSchema,
  tourCreateRequestSchema,
  tourListItemSchema,
  tourMaxHikingDifficultySchema,
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
    expect(() => tourCreateRequestSchema.parse({ ...baseRequest, tour_type: 'bike' })).toThrow();
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
