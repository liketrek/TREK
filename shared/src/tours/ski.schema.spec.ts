import {
  SKI_DISCIPLINES,
  SKI_TECHNIQUES,
  skiIssues,
  skiOptionsReadBy,
  tourSkiClassificationRequestSchema,
} from './ski.schema';
import { tourGpxImportFieldsSchema } from './tour-gpx-import.schema';
import {
  importableTourTypeSchema,
  plannableTourTypeSchema,
  tourCreateRequestSchema,
  tourListItemSchema,
} from './tours.schema';

import { describe, expect, it } from 'vitest';

describe('ski and winter tours (SKI-02)', () => {
  it('SKI-SCHEMA-001: knows six disciplines and three cross-country techniques, unknown among them on purpose', () => {
    expect(SKI_DISCIPLINES).toEqual(['alpine', 'snowboard', 'cross_country', 'touring', 'snowshoe', 'winter_hike']);
    expect(SKI_TECHNIQUES).toEqual(['classic', 'skating', 'unknown']);
  });

  it('SKI-SCHEMA-002: ski is a type the planner plans and a track can be imported as, never without its discipline', () => {
    expect(plannableTourTypeSchema.options).toContain('ski');
    expect([...importableTourTypeSchema.options].sort()).toEqual([...plannableTourTypeSchema.options].sort());
    const planned = {
      name: 'Valley run',
      tour_type: 'ski',
      route_geometry: [
        [47, 11, 1200],
        [47.01, 11.01, 1100],
      ],
      waypoints: [
        { lat: 47, lng: 11, role: 'start', sequence: 0 },
        { lat: 47.01, lng: 11.01, role: 'end', sequence: 1 },
      ],
    };
    expect(() => tourCreateRequestSchema.parse(planned)).toThrow(/a ski tour needs a discipline/);
    expect(tourCreateRequestSchema.parse({ ...planned, ski_discipline: 'snowshoe' })).toMatchObject({
      tour_type: 'ski',
      ski_discipline: 'snowshoe',
      max_hiking_difficulty: null,
    });
  });

  it('SKI-SCHEMA-003: a ski track names its discipline, a cross-country one its technique, and nothing else may', () => {
    expect(skiIssues(true, { ski_discipline: 'alpine' })).toEqual([]);
    expect(skiIssues(true, { ski_discipline: 'cross_country', ski_technique: 'unknown' })).toEqual([]);
    expect(skiIssues(true, {})).toEqual([{ path: ['ski_discipline'], message: 'a ski tour needs a discipline' }]);
    expect(skiIssues(true, { ski_discipline: 'cross_country' })[0]?.path).toEqual(['ski_technique']);
    expect(skiIssues(true, { ski_discipline: 'touring', ski_technique: 'skating' })[0]?.message).toMatch(
      /only a cross-country tour/,
    );
    expect(skiIssues(false, { ski_discipline: 'alpine', ski_technique: 'classic' }).map((i) => i.path)).toEqual([
      ['ski_discipline'],
      ['ski_technique'],
    ]);
    expect(skiIssues(false, { ski_discipline: null, ski_technique: null })).toEqual([]);
  });

  it('SKI-SCHEMA-004: imports a GPX file as ski only with its discipline, and ski fields only for ski', () => {
    expect(tourGpxImportFieldsSchema.parse({ tour_type: 'ski', ski_discipline: 'touring' })).toEqual({
      tour_type: 'ski',
      ski_discipline: 'touring',
    });
    expect(
      tourGpxImportFieldsSchema.parse({ tour_type: 'ski', ski_discipline: 'cross_country', ski_technique: 'skating' }),
    ).toMatchObject({ ski_technique: 'skating' });
    for (const fields of [
      { tour_type: 'ski' },
      { tour_type: 'ski', ski_discipline: 'cross_country' },
      { tour_type: 'ski', ski_discipline: 'alpine', ski_technique: 'classic' },
      { tour_type: 'ski', ski_discipline: 'slalom' },
      { tour_type: 'ski', ski_discipline: 'alpine', run_profile: 'running' },
      { tour_type: 'hike', ski_discipline: 'alpine' },
      { tour_type: 'run', run_profile: 'trail', ski_technique: 'classic' },
    ]) {
      expect(tourGpxImportFieldsSchema.safeParse(fields).success).toBe(false);
    }
  });

  it('SKI-SCHEMA-005: a classification names a discipline, a technique only for cross-country, and an optional revision', () => {
    expect(tourSkiClassificationRequestSchema.parse({ ski_discipline: 'snowboard', expected_revision: 3 })).toEqual({
      ski_discipline: 'snowboard',
      expected_revision: 3,
    });
    expect(
      tourSkiClassificationRequestSchema.parse({ ski_discipline: 'cross_country', ski_technique: 'classic' }),
    ).toMatchObject({ ski_technique: 'classic' });
    for (const body of [
      {},
      { ski_discipline: 'cross_country' },
      { ski_discipline: 'cross_country', ski_technique: null },
      { ski_discipline: 'alpine', ski_technique: 'skating' },
      { ski_discipline: 'alpine', expected_revision: 0 },
    ]) {
      expect(tourSkiClassificationRequestSchema.safeParse(body).success).toBe(false);
    }
  });

  it('SKI-SCHEMA-006: lists the discipline and technique, and reads a list cached before they existed', () => {
    const listed = {
      place_id: 4,
      tour_type: 'ski',
      distance: 12.4,
      elevation_gain: 980,
      elevation_loss: 990,
      duration: null,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: null,
      name: 'Up to the hut',
      planned: false,
      caution: false,
    };
    expect(tourListItemSchema.parse({ ...listed, ski_discipline: 'touring', ski_technique: null })).toMatchObject({
      ski_discipline: 'touring',
      ski_technique: null,
    });
    expect(tourListItemSchema.parse(listed).ski_discipline).toBeUndefined();
    expect(tourListItemSchema.safeParse({ ...listed, ski_discipline: 'freeride' }).success).toBe(false);
  });

  describe('a planned ski tour (SKI-02)', () => {
    const point = (lat: number, lng: number, role: 'start' | 'via' | 'end', sequence: number) => ({
      lat,
      lng,
      role,
      sequence,
    });
    const planned = {
      name: 'Hut to hut on snowshoes',
      tour_type: 'ski' as const,
      ski_discipline: 'touring' as const,
      route_geometry: [
        [47, 11, 1200],
        [47.01, 11.01, 1500],
      ],
      waypoints: [point(47, 11, 'start', 0), point(47.01, 11.01, 'end', 1)],
    };

    it('SKI-SCHEMA-007: saves every discipline, a cross-country tour only with its technique', () => {
      for (const discipline of SKI_DISCIPLINES.filter((value) => value !== 'cross_country')) {
        expect(tourCreateRequestSchema.safeParse({ ...planned, ski_discipline: discipline }).success).toBe(true);
      }
      expect(() => tourCreateRequestSchema.parse({ ...planned, ski_discipline: 'cross_country' })).toThrow(
        /a cross-country tour needs a technique/,
      );
      expect(
        tourCreateRequestSchema.parse({ ...planned, ski_discipline: 'cross_country', ski_technique: 'skating' }),
      ).toMatchObject({ ski_technique: 'skating' });
      expect(() => tourCreateRequestSchema.parse({ ...planned, ski_technique: 'classic' })).toThrow(
        /only a cross-country tour has a technique/,
      );
    });

    it('SKI-SCHEMA-008: takes the time the piste router worked out and nothing of another type, a free leg allowed', () => {
      expect(tourCreateRequestSchema.parse({ ...planned, duration_seconds: 3600 })).toMatchObject({
        duration_seconds: 3600,
      });
      expect(tourCreateRequestSchema.safeParse({ ...planned, duration_seconds: null }).success).toBe(true);
      expect(() => tourCreateRequestSchema.parse({ ...planned, max_hiking_difficulty: 3 })).toThrow(
        /a ski tour has no hiking difficulty/,
      );
      expect(() => tourCreateRequestSchema.parse({ ...planned, hiking_preferences: { avoid_steps: true } })).toThrow(
        /a ski tour has no hiking preferences/,
      );
      expect(() => tourCreateRequestSchema.parse({ ...planned, bike_profile: 'mtb' })).toThrow(/bike tour/);
      expect(() => tourCreateRequestSchema.parse({ ...planned, boat_type: 'sup' })).toThrow(/paddle tour/);
      const [start, end] = planned.waypoints;
      const line: Array<[number, number]> = [
        [47, 11],
        [47.01, 11.01],
      ];
      const withLeg = (fixed_leg: object) => ({ ...planned, waypoints: [{ ...start, fixed_leg }, end] });
      expect(tourCreateRequestSchema.safeParse(withLeg({ kind: 'free', geometry: line })).success).toBe(true);
      const ferrata = withLeg({ kind: 'ferrata', ref: 'way/1', name: null, geometry: line });
      expect(() => tourCreateRequestSchema.parse(ferrata)).toThrow(/a ski tour has no via ferrata/);
    });

    it('SKI-SCHEMA-009: keeps the ski fields off every other type', () => {
      const hike = { ...planned, tour_type: 'hike' as const, ski_discipline: 'winter_hike' as const };
      expect(() => tourCreateRequestSchema.parse(hike)).toThrow(/ski_discipline belongs to a ski tour/);
      const { ski_discipline: _discipline, ...walk } = planned;
      expect(() => tourCreateRequestSchema.parse({ ...walk, tour_type: 'walk', ski_technique: 'classic' })).toThrow(
        /ski_technique belongs to a ski tour/,
      );
    });
  });

  it('SKI-SCHEMA-010: names the options each discipline reads, the downhill ones for skis and boards alike', () => {
    expect(skiOptionsReadBy('alpine')).toEqual(skiOptionsReadBy('snowboard'));
    expect(skiOptionsReadBy('alpine')).toContain('pace');
    expect(skiOptionsReadBy('cross_country')).toEqual([
      'groomed_only',
      'lit_only',
      'use_lifts',
      'avoid_inferred_links',
    ]);
    expect(skiOptionsReadBy('touring')).toContain('touring_uphill_on_pistes');
    expect(skiOptionsReadBy('snowshoe')).not.toContain('max_difficulty');
  });
});
