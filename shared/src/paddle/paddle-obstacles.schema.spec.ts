import {
  paddleAccessOf,
  paddleFeatureSchema,
  paddleGeometrySchema,
  paddleObstaclesQuerySchema,
  paddleObstaclesResponseSchema,
} from './paddle-obstacles.schema';
import {
  paddleRegionBoundarySchema,
  paddleRegionCatalogQuerySchema,
  paddleRegionRequestSchema,
  paddleRegionSchema,
} from './paddle-regions.schema';

import { describe, expect, it } from 'vitest';

const weir = {
  ref: 'way/29256405',
  kind: 'weir',
  group_key: null,
  name: 'Wehr Lindenmühle',
  geometry: {
    type: 'LineString',
    coordinates: [
      [12.1301, 49.1231],
      [12.1315, 49.124],
    ],
  },
  tags: { waterway: 'weir' },
  tag_hash: 'abc',
  region_id: 'oberpfalz',
};

describe('paddle obstacle contracts (PAD-05A)', () => {
  it('a weir stays a line, never only a point', () => {
    expect(paddleFeatureSchema.parse(weir).geometry.type).toBe('LineString');
    expect(paddleGeometrySchema.safeParse({ type: 'LineString', coordinates: [[12, 49]] }).success).toBe(false);
    expect(
      paddleGeometrySchema.safeParse({
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [0, 0],
          ],
        ],
      }).success,
    ).toBe(false);
    expect(paddleGeometrySchema.safeParse({ type: 'Point', coordinates: [Number.NaN, 1] }).success).toBe(false);
  });

  it('refuses a kind TREK does not know', () => {
    expect(paddleFeatureSchema.safeParse({ ...weir, kind: 'castle' }).success).toBe(false);
  });

  it('the box query is four numbers', () => {
    expect(paddleObstaclesQuerySchema.safeParse({ bbox: '49.1,12.1,49.2,12.2' }).success).toBe(true);
    expect(paddleObstaclesQuerySchema.safeParse({ bbox: '-34,-71,-33.5,-70.5' }).success).toBe(true);
    expect(paddleObstaclesQuerySchema.safeParse({ bbox: '49.1,12.1,49.2' }).success).toBe(false);
    expect(paddleObstaclesQuerySchema.safeParse({ bbox: '49.1,12.1,49.2,abc' }).success).toBe(false);
  });

  it('an answer carries its coverage and whether it was cut', () => {
    const answer = { features: [weir], coverage: { state: 'partial', regions: [] }, truncated: false };
    expect(paddleObstaclesResponseSchema.safeParse(answer).success).toBe(true);
    expect(
      paddleObstaclesResponseSchema.safeParse({ ...answer, coverage: { state: 'free', regions: [] } }).success,
    ).toBe(false);
  });
});

describe('paddleAccessOf', () => {
  it('reads canoe before boat and boat before access', () => {
    expect(paddleAccessOf({ canoe: 'yes', boat: 'no', access: 'private' })).toMatchObject({
      value: 'yes',
      source: 'canoe',
    });
    expect(paddleAccessOf({ boat: 'no', access: 'yes' })).toMatchObject({
      value: 'no',
      source: 'boat',
      forbidden: true,
    });
    expect(paddleAccessOf({ access: 'private' })).toMatchObject({ value: 'private', source: 'access', private: true });
  });

  it('keeps a condition as written and never reads a missing value as permission', () => {
    expect(paddleAccessOf({ 'canoe:conditional': 'no @ (Nov-Mar)' })).toEqual({
      value: null,
      source: null,
      condition: 'no @ (Nov-Mar)',
      forbidden: false,
      private: false,
    });
    expect(paddleAccessOf({ 'boat:conditional': 'yes @ (sunrise-sunset)' }).condition).toBe('yes @ (sunrise-sunset)');
    expect(paddleAccessOf({})).toEqual({
      value: null,
      source: null,
      condition: null,
      forbidden: false,
      private: false,
    });
  });
});

describe('paddle region contracts (PAD-05A)', () => {
  it("takes Geofabrik's ids, nested ones included, and nothing that could name a path", () => {
    for (const id of ['oberpfalz', 'mecklenburg-vorpommern', 'us/texas']) {
      expect(paddleRegionRequestSchema.safeParse({ id }).success).toBe(true);
    }
    for (const id of ['', 'a', 'Oberpfalz', '../etc', 'us//texas', '/texas', 'us/', 'a b']) {
      expect(paddleRegionRequestSchema.safeParse({ id }).success).toBe(false);
    }
  });

  it('a catalogue query is two to eighty characters once trimmed', () => {
    expect(paddleRegionCatalogQuerySchema.parse({ q: '  ober ' }).q).toBe('ober');
    expect(paddleRegionCatalogQuerySchema.safeParse({ q: ' o ' }).success).toBe(false);
    expect(paddleRegionCatalogQuerySchema.safeParse({ q: 'x'.repeat(81) }).success).toBe(false);
  });

  it('a region carries its read, and the progress of one under way', () => {
    const region = {
      id: 'oberpfalz',
      name: 'Oberpfalz',
      status: 'importing',
      source_timestamp: null,
      imported_at: null,
      feature_count: 0,
      error: null,
      progress: { phase: 'download', fraction: 0.4 },
    };
    expect(paddleRegionSchema.safeParse(region).success).toBe(true);
    expect(paddleRegionSchema.safeParse({ ...region, progress: { phase: 'read', fraction: null } }).success).toBe(true);
    expect(paddleRegionSchema.safeParse({ ...region, progress: { phase: 'read', fraction: 2 } }).success).toBe(false);
    expect(paddleRegionSchema.safeParse({ ...region, status: 'done' }).success).toBe(false);
  });

  it('a boundary is a polygon or several', () => {
    const square = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ];
    expect(paddleRegionBoundarySchema.safeParse({ type: 'Polygon', coordinates: [square] }).success).toBe(true);
    expect(paddleRegionBoundarySchema.safeParse({ type: 'MultiPolygon', coordinates: [[square]] }).success).toBe(true);
    expect(paddleRegionBoundarySchema.safeParse({ type: 'Point', coordinates: [0, 0] }).success).toBe(false);
  });
});
