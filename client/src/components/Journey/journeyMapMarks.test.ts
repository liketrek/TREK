// FE-JOURNEY-MAPMARKS-001 to FE-JOURNEY-MAPMARKS-003
//
// JRN-04: the plan and stay marks both renderers draw, and how they join.
import type { JourneyMapPlace, JourneyMapStay } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import {
  MARK_CLUSTER_PX,
  clusterPoints,
  markHitSvg,
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
});
