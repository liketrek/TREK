// FE-JRN-LINES-001 to FE-JRN-LINES-005
import type { JourneyTrack } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { framePoint, journeyLines, journeyLngFrame } from './journeyMapLines';

type LatLng = [number, number];

const SAMOA: LatLng = [-13.83, -171.76];
const FIJI: LatLng = [-18.14, 178.44];
// The ship from the report, a step across the date line between two Dawarich points.
const SHIP: LatLng[] = [
  [-17.0891, -179.9995],
  [-17.0892, -179.9999],
  [-17.0894, 179.9998],
  [-17.0895, 179.9991],
];

const maxStep = (line: LatLng[]) =>
  line.reduce((max, p, i) => (i === 0 ? 0 : Math.max(max, Math.abs(p[1] - line[i - 1][1]))), 0);

function recorded(points: LatLng[]): JourneyTrack {
  return { place_id: -1, trip_id: 0, name: 'Ship', color: null, points, kind: 'dawarich_live', date: '2026-10-09' };
}

describe('journeyLines (#3080)', () => {
  it('FE-JRN-LINES-001: a GL map draws a recorded line across the antimeridian as a short hop, not round the world', () => {
    const lines = journeyLines(null, SHIP, false);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveLength(SHIP.length);
    expect(maxStep(lines[0])).toBeLessThan(0.01);
    expect(lines[0][0]).toEqual(SHIP[0]);
  });

  it('FE-JRN-LINES-002: Leaflet draws the line and its pins on one world copy, in the journey frame', () => {
    const frame = journeyLngFrame([{ lng: SAMOA[1] }, { lng: FIJI[1] }], [recorded(SHIP)]);
    expect(frame).not.toBeNull();
    const [line] = journeyLines(frame, SHIP, true);
    expect(maxStep(line)).toBeLessThan(0.01);
    const samoa = framePoint(frame, SAMOA[0], SAMOA[1])[1];
    const fiji = framePoint(frame, FIJI[0], FIJI[1])[1];
    // Fiji, the ship and Samoa sit within a few degrees of each other, on one copy.
    expect(Math.abs(samoa - fiji)).toBeCloseTo(9.8, 1);
    for (const [, lng] of line) {
      expect(lng).toBeGreaterThanOrEqual(Math.min(samoa, fiji));
      expect(lng).toBeLessThanOrEqual(Math.max(samoa, fiji));
    }
  });

  it('FE-JRN-LINES-003: the faint line between two entries across the date line takes the short way', () => {
    const [line] = journeyLines(null, [SAMOA, FIJI], false);
    expect(Math.abs(line[1][1] - line[0][1])).toBeCloseTo(9.8, 1);
  });

  it('FE-JRN-LINES-004: a journey off the antimeridian keeps no frame and its lines as they were', () => {
    const paris: LatLng = [48.85, 2.35];
    const berlin: LatLng = [52.52, 13.4];
    expect(journeyLngFrame([{ lng: paris[1] }, { lng: berlin[1] }], [])).toBeNull();
    expect(journeyLines(null, [paris, berlin], true)).toEqual([[paris, berlin]]);
    expect(framePoint(null, paris[0], paris[1])).toEqual(paris);
  });

  it('FE-JRN-LINES-005: without a frame Leaflet also gets the line shifted a world over, so the part past ±180 shows', () => {
    const lines = journeyLines(null, [FIJI, SAMOA], true);
    expect(lines).toHaveLength(2);
    expect(lines[0][1][1]).toBeGreaterThan(180);
    expect(lines[1][0][1]).toBeCloseTo(FIJI[1] - 360, 9);
    expect(lines[1][1][1]).toBeCloseTo(lines[0][1][1] - 360, 9);
  });
});
