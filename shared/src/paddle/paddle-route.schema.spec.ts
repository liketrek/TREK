import { MAX_PADDLE_ROUTE_LEGS, paddleRouteRequestSchema, paddleRouteResponseSchema } from './paddle-route.schema';

import { describe, expect, it } from 'vitest';

const A = { lat: 49.1, lng: 12.1 };
const B = { lat: 49.0, lng: 12.1 };

describe('paddle route contract (PAD-11)', () => {
  it('fills a request with a kayak, straight over the lakes and locks as the data says', () => {
    expect(paddleRouteRequestSchema.parse({ legs: [{ from: A, to: B }] })).toEqual({
      legs: [{ from: A, to: B }],
      boat: 'kayak',
      lake_style: 'direct',
      lock_policy: 'auto',
    });
  });

  it('refuses no legs, too many legs, a point off the globe and an unknown boat', () => {
    const many = Array.from({ length: MAX_PADDLE_ROUTE_LEGS + 1 }, () => ({ from: A, to: B }));
    expect(paddleRouteRequestSchema.safeParse({ legs: [] }).success).toBe(false);
    expect(paddleRouteRequestSchema.safeParse({ legs: many }).success).toBe(false);
    expect(paddleRouteRequestSchema.safeParse({ legs: [{ from: { lat: 91, lng: 0 }, to: B }] }).success).toBe(false);
    expect(paddleRouteRequestSchema.safeParse({ legs: [{ from: A, to: B }], boat: 'yacht' }).success).toBe(false);
  });

  it('answers each leg planned with its line and stretches, or failed with a code', () => {
    const answer = {
      graph_rev: 'r1',
      legs: [
        {
          status: 'ok',
          geometry: [
            [A.lat, A.lng],
            [B.lat, B.lng],
          ],
          segments: [{ kind: 'rapids', from: 0, to: 1, name: null, source: null, osm_ref: null, grade: 2 }],
          distance_m: 11100,
          snapped_m: { from: 4, to: 0 },
        },
        { status: 'failed', code: 'no_region', at: A },
      ],
    };
    expect(paddleRouteResponseSchema.parse(answer)).toEqual(answer);
    const badGrade = structuredClone(answer);
    badGrade.legs[0]!.segments![0]!.grade = 7;
    expect(paddleRouteResponseSchema.safeParse(badGrade).success).toBe(false);
    const oneVertex = structuredClone(answer);
    oneVertex.legs[0]!.geometry = [[A.lat, A.lng]];
    expect(paddleRouteResponseSchema.safeParse(oneVertex).success).toBe(false);
  });
});
