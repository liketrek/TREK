import {
  DEFAULT_SKI_ROUTE_OPTIONS,
  SKI_LIFT_CLASSES,
  skiOptionsForDiscipline,
  skiRouteOptionsSchema,
  skiUsesLifts,
} from '../tours/ski.schema';
import { tourCreateRequestSchema, tourListItemSchema } from '../tours/tours.schema';
import {
  MAX_SKI_ROUTE_LEGS,
  skiAreaIdSchema,
  skiAreaNearQuerySchema,
  skiNetworkResponseSchema,
  skiRouteRequestSchema,
  skiRouteResponseSchema,
} from './ski-route.schema';
import { winterIndexSchema, winterMetaSchema } from './winter-index.schema';

import { describe, expect, it } from 'vitest';

const A = { lat: 45.98, lng: 7.75 };
const B = { lat: 45.93, lng: 7.71 };
const SHA = 'a'.repeat(64);

/** A ski tour as the list carries it. */
const LISTED = {
  place_id: 4,
  tour_type: 'ski',
  distance: 8,
  elevation_gain: 100,
  elevation_loss: 900,
  duration: 3600,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: 1,
  max_hiking_difficulty: null,
  name: 'Valley run',
  planned: true,
  caution: false,
};

describe('piste router options (SKI-ROUTE)', () => {
  it('SKI-ROUTE-SCHEMA-001: an empty object is a complete answer, use_lifts left to the discipline', () => {
    expect(DEFAULT_SKI_ROUTE_OPTIONS).toEqual({
      max_difficulty: 'intermediate',
      allow_freeride: false,
      avoid_lifts: [],
      allow_lift_down: true,
      priority: 'fastest',
      pace: 'normal',
      groomed_only: false,
      lit_only: false,
      touring_uphill_on_pistes: false,
      avoid_inferred_links: false,
    });
    expect(skiUsesLifts('alpine', {})).toBe(true);
    expect(skiUsesLifts('snowboard', {})).toBe(true);
    expect(skiUsesLifts('touring', {})).toBe(false);
    expect(skiUsesLifts('cross_country', { use_lifts: true })).toBe(true);
    expect(skiUsesLifts('alpine', { use_lifts: false })).toBe(false);
  });

  it('SKI-ROUTE-SCHEMA-002: refuses unknown keys, unknown lift classes and difficulties off the scale', () => {
    expect(skiRouteOptionsSchema.safeParse({ colour: 'red' }).success).toBe(false);
    expect(skiRouteOptionsSchema.safeParse({ avoid_lifts: ['zipline'] }).success).toBe(false);
    expect(skiRouteOptionsSchema.safeParse({ max_difficulty: 'freeride' }).success).toBe(false);
    expect(skiRouteOptionsSchema.safeParse({ avoid_lifts: [...SKI_LIFT_CLASSES, 'drag'] }).success).toBe(false);
  });

  it('SKI-ROUTE-SCHEMA-003: keeps the options a discipline reads and puts the others back to their defaults', () => {
    const asked = {
      max_difficulty: 'expert' as const,
      avoid_lifts: ['drag' as const],
      groomed_only: true,
      lit_only: true,
      touring_uphill_on_pistes: true,
      use_lifts: true,
    };
    expect(skiOptionsForDiscipline('alpine', asked)).toEqual({
      ...DEFAULT_SKI_ROUTE_OPTIONS,
      max_difficulty: 'expert',
      avoid_lifts: ['drag'],
      use_lifts: true,
    });
    expect(skiOptionsForDiscipline('cross_country', asked)).toEqual({
      ...DEFAULT_SKI_ROUTE_OPTIONS,
      groomed_only: true,
      lit_only: true,
      use_lifts: true,
    });
    expect(skiOptionsForDiscipline('touring', asked)).toEqual({
      ...DEFAULT_SKI_ROUTE_OPTIONS,
      max_difficulty: 'expert',
      avoid_lifts: ['drag'],
      touring_uphill_on_pistes: true,
      use_lifts: true,
    });
    expect(skiOptionsForDiscipline('snowshoe', { priority: 'easiest' })).toEqual(DEFAULT_SKI_ROUTE_OPTIONS);
  });

  it('SKI-ROUTE-SCHEMA-004: a saved ski tour keeps its options, another type may not carry them', () => {
    const planned = {
      name: 'Valley run',
      tour_type: 'ski' as const,
      ski_discipline: 'alpine' as const,
      route_geometry: [
        [A.lat, A.lng, 2500],
        [B.lat, B.lng, 1600],
      ],
      waypoints: [
        { lat: A.lat, lng: A.lng, role: 'start', sequence: 0 },
        { lat: B.lat, lng: B.lng, role: 'end', sequence: 1 },
      ],
    };
    const saved = tourCreateRequestSchema.parse({
      ...planned,
      ski_options: { max_difficulty: 'advanced', lit_only: true },
      ski_route_build: '2026-11-02',
    });
    expect(saved.ski_options).toEqual({ ...DEFAULT_SKI_ROUTE_OPTIONS, max_difficulty: 'advanced', lit_only: true });
    expect(saved.ski_route_build).toBe('2026-11-02');
    expect(tourCreateRequestSchema.parse(planned).ski_options).toBeUndefined();
    expect(tourCreateRequestSchema.safeParse({ ...planned, ski_route_build: 'x y' }).success).toBe(false);
    const hike = { ...planned, tour_type: 'hike' as const, ski_discipline: null };
    expect(() => tourCreateRequestSchema.parse({ ...hike, ski_options: {} })).toThrow(/ski_options belongs/);
    expect(() => tourCreateRequestSchema.parse({ ...hike, ski_route_build: '2026-11-02' })).toThrow(
      /ski_route_build belongs/,
    );
  });

  it('SKI-ROUTE-SCHEMA-012: a saved ski tour names the legs the router planned, each a leg of its own, once', () => {
    const planned = {
      name: 'Valley run',
      tour_type: 'ski' as const,
      ski_discipline: 'alpine' as const,
      route_geometry: [
        [A.lat, A.lng, 2500],
        [B.lat, B.lng, 1600],
      ],
      waypoints: [
        { lat: A.lat, lng: A.lng, role: 'start', sequence: 0 },
        { lat: B.lat, lng: B.lng, role: 'via', sequence: 1 },
        { lat: A.lat, lng: A.lng, role: 'end', sequence: 2 },
      ],
    };
    expect(tourCreateRequestSchema.parse({ ...planned, ski_planned_legs: [1, 0] }).ski_planned_legs).toEqual([1, 0]);
    expect(tourCreateRequestSchema.parse({ ...planned, ski_planned_legs: [] }).ski_planned_legs).toEqual([]);
    for (const legs of [[2], [0, 0], [-1], [0.5]]) {
      expect(tourCreateRequestSchema.safeParse({ ...planned, ski_planned_legs: legs }).success).toBe(false);
    }
    const hike = { ...planned, tour_type: 'hike' as const, ski_discipline: null };
    expect(() => tourCreateRequestSchema.parse({ ...hike, ski_planned_legs: [0] })).toThrow(/ski_planned_legs belongs/);
    expect(tourListItemSchema.parse({ ...LISTED, ski_planned_legs: [0] }).ski_planned_legs).toEqual([0]);
  });

  it('SKI-ROUTE-SCHEMA-005: a listed tour may carry its options and build, or neither', () => {
    expect(tourListItemSchema.parse({ ...LISTED, ski_options: {}, ski_route_build: '2026-11-02' })).toMatchObject({
      ski_options: DEFAULT_SKI_ROUTE_OPTIONS,
      ski_route_build: '2026-11-02',
    });
    expect(tourListItemSchema.parse(LISTED).ski_options).toBeUndefined();
  });
});

describe('piste router request and answer (SKI-ROUTE)', () => {
  it('SKI-ROUTE-SCHEMA-006: fills a request with no technique, default options and no alternatives', () => {
    expect(skiRouteRequestSchema.parse({ legs: [{ from: A, to: B }], discipline: 'alpine' })).toEqual({
      legs: [{ from: A, to: B, shaping_to: false }],
      discipline: 'alpine',
      technique: null,
      options: DEFAULT_SKI_ROUTE_OPTIONS,
      alternatives: 0,
    });
  });

  it('SKI-ROUTE-SCHEMA-007: refuses no legs, too many, a point off the globe, three alternatives', () => {
    const many = Array.from({ length: MAX_SKI_ROUTE_LEGS + 1 }, () => ({ from: A, to: B }));
    const base = { discipline: 'alpine' };
    expect(skiRouteRequestSchema.safeParse({ ...base, legs: [] }).success).toBe(false);
    expect(skiRouteRequestSchema.safeParse({ ...base, legs: many }).success).toBe(false);
    const offGlobe = [{ from: { lat: 91, lng: 0 }, to: B }];
    expect(skiRouteRequestSchema.safeParse({ ...base, legs: offGlobe }).success).toBe(false);
    const three = { ...base, legs: [{ from: A, to: B }], alternatives: 3 };
    expect(skiRouteRequestSchema.safeParse(three).success).toBe(false);
    expect(skiRouteRequestSchema.safeParse({ legs: [{ from: A, to: B }], discipline: 'sledge' }).success).toBe(false);
  });

  it('SKI-ROUTE-SCHEMA-008: answers a planned leg, heights possibly unknown, and a failed one with its fix', () => {
    const answer = {
      build: '2026-11-02',
      stale: false,
      area_names: ['Zermatt'],
      colour_scheme: 'europe',
      attribution: '© OpenStreetMap contributors, ODbL',
      legs: [
        {
          status: 'ok',
          geometry: [
            [A.lat, A.lng, 2500],
            [B.lat, B.lng, null],
          ],
          segments: [
            {
              kind: 'run',
              from: 0,
              to: 1,
              name: 'Rote Eins',
              ref: '1',
              difficulty: 'intermediate',
              lift_type: null,
              grooming: [],
              seconds: 300,
              wait_seconds: 0,
              length_m: 2500,
              flags: ['dir_from_dem'],
              osm_way: 12,
            },
          ],
          distance_m: 2500,
          climb_m: 0,
          descent_m: 900,
          seconds: { ski: 300, lift: 0, wait: 0, walk: 0 },
          snapped_m: { from: 3, to: 0 },
          area_ids: ['w:100'],
          why: [{ kind: 'flag', flag: 'dir_from_dem', count: 1 }],
          alternatives: [],
        },
        {
          status: 'failed',
          code: 'blocked_by_difficulty',
          at: null,
          hint: { raise_difficulty: 'advanced' },
          detail: { name: 'Schwarze Wand' },
        },
      ],
    };
    expect(skiRouteResponseSchema.parse(answer)).toEqual(answer);
    const badFlag = structuredClone(answer);
    (badFlag.legs[0] as { segments: Array<{ flags: string[] }> }).segments[0]!.flags = ['avalanche'];
    expect(skiRouteResponseSchema.safeParse(badFlag).success).toBe(false);
  });

  it('SKI-ROUTE-SCHEMA-009: area ids, the area-near query and the network answer', () => {
    expect(skiAreaIdSchema.safeParse('w:100').success).toBe(true);
    expect(skiAreaIdSchema.safeParse('r:42-1a2b').success).toBe(true);
    expect(skiAreaIdSchema.safeParse('../etc').success).toBe(false);
    expect(skiAreaNearQuerySchema.parse({ lat: '46.1', lng: '7.2' })).toEqual({ lat: 46.1, lng: 7.2 });
    expect(skiAreaNearQuerySchema.safeParse({ lat: '95', lng: '7' }).success).toBe(false);
    const network = {
      area_id: 'w:100',
      build: '2026-11-02',
      colour_scheme: 'europe',
      simplified_m: 5,
      features: [
        {
          kind: 'lift',
          difficulty: null,
          name: 'Sonnenbahn',
          lift_type: 'chair_detachable',
          oneway: true,
          line: '_p~iF~ps|U',
        },
      ],
    };
    expect(skiNetworkResponseSchema.parse(network)).toEqual(network);
  });
});

describe('the winter layer of the Places host (SKI-ROUTE)', () => {
  it('SKI-ROUTE-SCHEMA-010: reads the meta and an index row as the host sends them', () => {
    const meta = {
      build: '2026-11-02',
      format: 1,
      areas: 1,
      indexSha: SHA,
      sourceTimestamp: null,
      attribution: { data: '© OpenStreetMap contributors, ODbL', terrain: 'Terrain: Mapzen Terrarium', url: 'x' },
    };
    expect(winterMetaSchema.parse(meta)).toMatchObject({ build: '2026-11-02', indexSha: SHA });
    expect(winterMetaSchema.safeParse({ ...meta, indexSha: 'abc' }).success).toBe(false);
    const row = {
      id: 'w:100',
      name: 'Sonnenbahn',
      kind: 'resort',
      country: null,
      colourScheme: 'europe',
      bbox: [7.0, 45.999, 7.005, 46.0052],
      counts: { runsKm: 1.19, nordicKm: 0.53, lifts: 1, skitourKm: 0, hikeKm: 0 },
      bytes: 900,
      sha256: SHA,
    };
    const index = { build: '2026-11-02', format: 1, areas: [row] };
    expect(winterIndexSchema.parse(index).areas[0]).toEqual(row);
    expect(winterIndexSchema.safeParse({ ...index, areas: [{ ...row, id: 'x' }] }).success).toBe(false);
  });

  it('SKI-ROUTE-SCHEMA-011: refuses a build name a ski tour could not be saved with', () => {
    const index = { build: '2026-11-02', format: 1, areas: [] };
    for (const build of ['nightly build', '2026+1', 'a:b']) {
      expect(winterIndexSchema.safeParse({ ...index, build }).success).toBe(false);
    }
    expect(winterIndexSchema.safeParse({ ...index, build: '2026-11-02_redo.2' }).success).toBe(true);
  });
});
