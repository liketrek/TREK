// FE-JOURNEY-MAPMARKS-001 to FE-JOURNEY-MAPMARKS-005
//
// JRN-04: the plan and stay marks both renderers draw, and how they join.
import type { JourneyMapPlace, JourneyMapStay } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  MARK_CLUSTER_PX,
  clusterPoints,
  glWorldPx,
  markHitSvg,
  mercatorWorldPx,
  planPinSvg,
  safeColor,
  type JourneyMapMark,
} from './journeyMapMarks';

const planMark = (key: string, lat: number): JourneyMapMark => ({
  kind: 'plan',
  key,
  lat,
  lng: 12,
  color: '#e11d48',
  place: { name: key } as JourneyMapPlace,
});
const stayMark = (key: string, lat: number): JourneyMapMark => ({
  kind: 'stay',
  key,
  lat,
  lng: 12,
  color: '#14b8a6',
  stay: { name: key } as JourneyMapStay,
});

describe('journey map marks', () => {
  it('FE-JOURNEY-MAPMARKS-001: joins only what would overlap on screen, anchored on the first', () => {
    const project = (lat: number, lng: number) => ({ x: lng, y: lat * 100 });
    const hits = clusterPoints([planMark('a', 1), stayMark('b', 1.05), planMark('c', 5)], project, MARK_CLUSTER_PX);
    expect(hits.map((h) => h.members.map((m) => m.key))).toEqual([['a', 'b'], ['c']]);
    expect(hits[0]).toMatchObject({ lat: 1, lng: 12 });
  });

  it('FE-JOURNEY-MAPMARKS-002: a lone plan is a hollow dashed pin, a lone stay a dot, several a disc with the count', () => {
    const plan = markHitSvg([planMark('a', 1)]);
    expect(plan).toMatchObject({ anchor: 'bottom', width: 22, height: 28 });
    expect(plan.html).toContain('stroke-dasharray');
    expect(markHitSvg([stayMark('b', 1)])).toMatchObject({ anchor: 'center', width: 14 });
    const several = markHitSvg([planMark('a', 1), stayMark('b', 1), planMark('c', 1)]);
    expect(several.anchor).toBe('center');
    expect(several.html).toContain('>3<');
  });

  it('FE-JOURNEY-MAPMARKS-003: only a hex colour reaches the markup', () => {
    expect(safeColor('#ABCDEF')).toBe('#ABCDEF');
    expect(safeColor('#abc')).toBe('#abc');
    expect(safeColor('"/><script>')).toBe('#64748b');
    expect(safeColor(null)).toBe('#64748b');
    expect(planPinSvg('red" onload="x')).not.toContain('onload');
  });

  it('FE-JOURNEY-MAPMARKS-004: world pixels are Web Mercator at the zoom, doubling per step and clamped at the poles', () => {
    expect(mercatorWorldPx(0, 0, 0, 512)).toEqual({ x: 256, y: 256 });
    expect(mercatorWorldPx(0, -180, 0, 512).x).toBe(0);
    const z5 = mercatorWorldPx(35.01, 135.68, 5, 512);
    const z6 = mercatorWorldPx(35.01, 135.68, 6, 512);
    expect(z6.x).toBeCloseTo(z5.x * 2, 6);
    expect(z6.y).toBeCloseTo(z5.y * 2, 6);
    expect(mercatorWorldPx(90, 0, 0, 512).y).toBeCloseTo(0, 3);
    expect(mercatorWorldPx(-90, 0, 0, 512).y).toBeCloseTo(512, 3);
  });

  it('FE-JOURNEY-MAPMARKS-005: groups on the GL world grid hold however the view is panned, and split on zoom (#2889)', () => {
    const marks = [planMark('a', 35.0), planMark('b', 35.0005), planMark('c', 35.001)];
    const keys = (hits: { members: JourneyMapMark[] }[]) => hits.map((h) => h.members.map((m) => m.key));

    // What a container point does: the same world position, less the pan.
    const onScreen = (pan: number) =>
      keys(
        clusterPoints(
          marks,
          (lat, lng) => {
            const world = mercatorWorldPx(lat, lng, 13, 512);
            return { x: world.x, y: world.y - pan };
          },
          MARK_CLUSTER_PX
        )
      );
    const screenGroupings = new Set(Array.from({ length: MARK_CLUSTER_PX }, (_, pan) => JSON.stringify(onScreen(pan))));
    expect(screenGroupings.size).toBeGreaterThan(1);

    const atZoom = (zoom: number) => keys(clusterPoints(marks, glWorldPx({ getZoom: () => zoom }), MARK_CLUSTER_PX));
    expect(atZoom(13)).toEqual([['a', 'b', 'c']]);
    expect(atZoom(18)).toEqual([['a'], ['b'], ['c']]);
  });
});
