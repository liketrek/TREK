/**
 * scripts/lib/shared-border-simplify.mjs simplifies a country's region outlines for the
 * Atlas builder when the source has no simplified version of its own (Tailte Éireann's
 * counties, #2922). What matters is that two regions sharing a border keep the same
 * points on it, so no point between them falls into a sliver that belongs to neither.
 */
import { douglasPeucker, simplifySharedBorders } from '../../../scripts/lib/shared-border-simplify.mjs';

import { describe, expect, it } from 'vitest';

type Ring = number[][];
type Geometry = { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
type Feature = { type: 'Feature'; properties: Record<string, unknown>; geometry: Geometry | null };

const polygon = (name: string, ...rings: Ring[]): Feature => ({
  type: 'Feature',
  properties: { name },
  geometry: { type: 'Polygon', coordinates: rings },
});

// A border from about (1,0) up to about (1,1) that swings out and back, quantized like the builder's input.
const border: Ring = Array.from({ length: 41 }, (_, i) => [
  Math.round((1 + 0.05 * Math.sin(i * 0.7)) * 1000) / 1000,
  i / 40,
]);

/**
 * Two neighbours: west runs up the shared border, east runs down it from a different
 * start. Simplified each on its own, these two keep different points on the border
 * (SIMPLIFY-003 checks that the fixture really does that).
 */
function neighbours(): Feature[] {
  const west = [[0, 0], ...border, [0, 1], [0, 0]];
  const east = [[2, 0], [2, 1], ...border.slice().reverse(), [2, 0]];
  return [polygon('west', west), polygon('east', east)];
}

const outer = (f: Feature) => (f.geometry as { coordinates: Ring[] }).coordinates[0];
// The points of a ring on the shared border, its repeated closing point left out.
const onBorder = (ring: Ring) =>
  ring
    .slice(0, -1)
    .filter(([x]) => x > 0.5 && x < 1.5)
    .map((p) => p.join(','))
    .sort();

describe('douglasPeucker', () => {
  it('SIMPLIFY-001: keeps both ends and drops points within the tolerance', () => {
    expect(
      douglasPeucker(
        [
          [0, 0],
          [1, 0.001],
          [2, 0],
          [3, 1],
        ],
        0.01,
      ),
    ).toEqual([
      [0, 0],
      [2, 0],
      [3, 1],
    ]);
  });

  it('SIMPLIFY-002: leaves a line of two points or fewer as it is', () => {
    expect(
      douglasPeucker(
        [
          [0, 0],
          [1, 1],
        ],
        5,
      ),
    ).toEqual([
      [0, 0],
      [1, 1],
    ]);
  });
});

describe('simplifySharedBorders', () => {
  it('SIMPLIFY-003: two neighbours keep exactly the same points on the border they share', () => {
    const [west, east] = neighbours();
    // Each polygon simplified on its own drifts apart on the border: the bug this avoids.
    expect(onBorder(douglasPeucker(outer(west), 0.01))).not.toEqual(onBorder(douglasPeucker(outer(east), 0.01)));

    const [westOut, eastOut] = simplifySharedBorders([west, east], 0.01) as Feature[];
    expect(onBorder(outer(westOut))).toEqual(onBorder(outer(eastOut)));
    expect(onBorder(outer(westOut)).length).toBeLessThan(border.length);
    // Its two ends are where three outlines meet, and stay put.
    expect(onBorder(outer(westOut))).toEqual(expect.arrayContaining([border[0].join(','), border[40].join(',')]));
  });

  it('SIMPLIFY-004: the result does not depend on which neighbour comes first', () => {
    const [east, west] = simplifySharedBorders(neighbours().reverse(), 0.01) as Feature[];
    const [west2, east2] = simplifySharedBorders(neighbours(), 0.01) as Feature[];
    expect(outer(west)).toEqual(outer(west2));
    expect(outer(east)).toEqual(outer(east2));
  });

  it('SIMPLIFY-005: an enclave shared whole with the hole around it simplifies the same on both sides', () => {
    const circle = (reverse: boolean): Ring => {
      const pts = Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * 2 * Math.PI;
        return [Math.round((5 + Math.cos(a)) * 1000) / 1000, Math.round((5 + Math.sin(a)) * 1000) / 1000];
      });
      const ring = reverse ? pts.reverse() : pts;
      return [...ring, ring[0]];
    };
    const square: Ring = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    const [around, enclave] = simplifySharedBorders(
      [polygon('around', square, circle(true)), polygon('enclave', circle(false))],
      0.05,
    ) as Feature[];
    const hole = (around.geometry as { coordinates: Ring[] }).coordinates[1];
    const key = (ring: Ring) => ring.map((p) => p.join(',')).sort();
    expect(key(hole)).toEqual(key(outer(enclave)));
    expect(outer(enclave).length).toBeLessThan(41);
  });

  it('SIMPLIFY-006: a polygon too small to keep is dropped, and a feature with nothing left gets no geometry', () => {
    const speck: Ring = [
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
      [0, 0],
    ];
    const island = polygon('island', speck);
    const [out] = simplifySharedBorders([island], 0.01) as Feature[];
    expect(out.geometry).toBeNull();
    expect(out.properties).toEqual({ name: 'island' });
  });

  it('SIMPLIFY-007: a MultiPolygon keeps the parts that survive and becomes a Polygon when one is left', () => {
    const big: Ring = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0],
    ];
    const speck: Ring = [
      [9, 9],
      [9.001, 9],
      [9.001, 9.001],
      [9, 9],
    ];
    const [out] = simplifySharedBorders(
      [{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: [[big], [speck]] } }],
      0.01,
    ) as Feature[];
    expect(out.geometry).toEqual({ type: 'Polygon', coordinates: [big] });
  });
});
