import {
  boxAround,
  corridorTiles,
  distanceToSegmentKm,
  haversineKm,
  pointAtMeters,
  projectOntoRoute,
  sliceAtMeters,
  simplifyLine,
  type LatLng,
} from './corridor';

import { describe, it, expect } from 'vitest';

const BERLIN: LatLng = { lat: 52.52, lng: 13.405 };
const DRESDEN: LatLng = { lat: 51.05, lng: 13.74 };
const PRAGUE: LatLng = { lat: 50.088, lng: 14.42 };

describe('haversineKm', () => {
  it('measures a known distance', () => {
    // Berlin → Dresden is about 165 km as the crow flies.
    expect(haversineKm(BERLIN, DRESDEN)).toBeGreaterThan(160);
    expect(haversineKm(BERLIN, DRESDEN)).toBeLessThan(170);
  });

  it('is zero for the same point', () => {
    expect(haversineKm(BERLIN, BERLIN)).toBe(0);
  });
});

describe('distanceToSegmentKm', () => {
  const a: LatLng = { lat: 52, lng: 13 };
  const b: LatLng = { lat: 52, lng: 14 };

  it('measures perpendicular distance to the line', () => {
    const p: LatLng = { lat: 52.09, lng: 13.5 };
    // 0.09° of latitude is about 10 km, whatever the longitude does.
    expect(distanceToSegmentKm(p, a, b)).toBeGreaterThan(9);
    expect(distanceToSegmentKm(p, a, b)).toBeLessThan(11);
  });

  it('measures to the end, not to the infinite line, for a point beyond it', () => {
    const beyond: LatLng = { lat: 52, lng: 16 };
    const d = distanceToSegmentKm(beyond, a, b);
    // Two degrees of longitude past the end at 52° north — roughly 137 km.
    expect(d).toBeGreaterThan(120);
    expect(d).toBeLessThan(150);
  });

  it('falls back to point distance for a zero-length segment', () => {
    expect(distanceToSegmentKm(DRESDEN, a, a)).toBeCloseTo(haversineKm(DRESDEN, a), 5);
  });
});

describe('projectOntoRoute', () => {
  const line = [BERLIN, DRESDEN, PRAGUE];

  it('reports how far off the route a point is', () => {
    const onRoute = projectOntoRoute({ lat: 51.8, lng: 13.5 }, line);
    expect(onRoute!.offRouteKm).toBeLessThan(15);
    const wayOff = projectOntoRoute({ lat: 53.55, lng: 10.0 }, line);
    expect(wayOff!.offRouteKm).toBeGreaterThan(150);
  });

  it('orders points by how far into the drive they come', () => {
    const early = projectOntoRoute({ lat: 52.3, lng: 13.45 }, line)!;
    const late = projectOntoRoute({ lat: 50.4, lng: 14.2 }, line)!;
    expect(early.alongKm).toBeLessThan(late.alongKm);
  });

  it('tells two points on the same long straight apart', () => {
    // The petrol stations along one motorway segment must not all report the same
    // position in the drive, which is what taking the segment midpoint produced.
    const straight = [
      { lat: 52, lng: 13 },
      { lat: 52, lng: 15 },
    ];
    const early = projectOntoRoute({ lat: 52.01, lng: 13.3 }, straight)!;
    const late = projectOntoRoute({ lat: 52.01, lng: 14.7 }, straight)!;
    expect(late.alongKm - early.alongKm).toBeGreaterThan(80);
  });

  it('returns nothing for a line that is not one', () => {
    expect(projectOntoRoute(BERLIN, [])).toBeNull();
    expect(projectOntoRoute(BERLIN, [BERLIN])).toBeNull();
  });
});

describe('corridorTiles', () => {
  it('covers a short route with a single box', () => {
    const tiles = corridorTiles([BERLIN, { lat: 52.4, lng: 13.5 }], 5);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]!.south).toBeLessThan(52.4);
    expect(tiles[0]!.north).toBeGreaterThan(52.52);
  });

  it('splits a long route into boxes the server will not clamp', () => {
    const tiles = corridorTiles([BERLIN, DRESDEN, PRAGUE], 10);
    expect(tiles.length).toBeGreaterThan(1);
    for (const t of tiles) {
      expect(t.north - t.south).toBeLessThanOrEqual(0.45);
      expect(t.east - t.west).toBeLessThanOrEqual(0.45);
    }
  });

  it('pads longitude more the further north it goes', () => {
    const south = corridorTiles([{ lat: 0, lng: 0 }], 10)[0]!;
    const north = corridorTiles([{ lat: 60, lng: 0 }], 10)[0]!;
    expect(north.east - north.west).toBeGreaterThan(south.east - south.west);
  });

  it('covers the middle of a long straight leg, not only its two ends', () => {
    // A motorway with no bend in it reduces to two points, 250 km apart. Tiling walks
    // point to point, so without splitting the step everything between them goes
    // unsearched while the search still reports itself complete.
    const straight = [
      { lat: 53.55, lng: 9.99 },
      { lat: 52.52, lng: 13.4 },
    ];
    const tiles = corridorTiles(straight, 10);

    expect(tiles.length).toBeGreaterThan(4);
    // A box somewhere over the middle of the drive, which is what was missing.
    const midLat = 53.03;
    const midLng = 11.7;
    expect(tiles.some((t) => t.south <= midLat && t.north >= midLat && t.west <= midLng && t.east >= midLng)).toBe(
      true,
    );
  });

  it('leaves no gap between consecutive boxes along a route', () => {
    const tiles = corridorTiles(
      [
        { lat: 53.55, lng: 9.99 },
        { lat: 52.52, lng: 13.4 },
      ],
      10,
    );
    for (let i = 1; i < tiles.length; i++) {
      const a = tiles[i - 1]!;
      const b = tiles[i]!;
      // Overlapping or touching in both axes: a hole here is a stretch nobody looks at.
      expect(Math.min(a.north, b.north) - Math.max(a.south, b.south)).toBeGreaterThanOrEqual(0);
      expect(Math.min(a.east, b.east) - Math.max(a.west, b.west)).toBeGreaterThanOrEqual(0);
    }
  });

  it('has nothing to cover for an empty route', () => {
    expect(corridorTiles([], 10)).toEqual([]);
  });
});

describe('simplifyLine', () => {
  it('keeps the ends and drops what sits on the line between them', () => {
    const straight = [
      { lat: 52, lng: 13 },
      { lat: 52, lng: 13.5 },
      { lat: 52, lng: 14 },
    ];
    expect(simplifyLine(straight, 1)).toEqual([straight[0]!, straight[2]!]);
  });

  it('keeps a point that actually bends the route', () => {
    const bent = [
      { lat: 52, lng: 13 },
      { lat: 52.5, lng: 13.5 },
      { lat: 52, lng: 14 },
    ];
    expect(simplifyLine(bent, 1)).toHaveLength(3);
  });

  it('leaves a two-point line alone', () => {
    expect(simplifyLine([BERLIN, DRESDEN], 5)).toEqual([BERLIN, DRESDEN]);
  });
});

describe('pointAtMeters', () => {
  // A straight run due east along one parallel, so the arithmetic is checkable by hand:
  // at 52° north a degree of longitude is about 68.5 km.
  const WEST: LatLng = { lat: 52, lng: 13 };
  const EAST: LatLng = { lat: 52, lng: 14 };
  const LEG = haversineKm(WEST, EAST) * 1000;

  it('lands halfway along a single segment', () => {
    const mid = pointAtMeters([WEST, EAST], LEG / 2)!;
    expect(mid.lat).toBeCloseTo(52, 5);
    expect(mid.lng).toBeCloseTo(13.5, 3);
  });

  it('walks past the first segment into the second', () => {
    const line = [WEST, EAST, { lat: 52, lng: 15 }];
    const at = pointAtMeters(line, LEG * 1.5)!;
    // One and a half segments in, so halfway through the second.
    expect(at.lng).toBeGreaterThan(14);
    expect(at.lng).toBeLessThan(15);
  });

  it('returns the last point past the end rather than nothing', () => {
    // A tank that runs out after the day's final stop still ran out somewhere; the
    // caller decides what to do about that, so this must not answer null.
    expect(pointAtMeters([WEST, EAST], LEG * 10)).toEqual(EAST);
  });

  it('answers the first point for zero, and nothing for an empty line', () => {
    expect(pointAtMeters([WEST, EAST], 0)).toEqual(WEST);
    expect(pointAtMeters([WEST, EAST], -5)).toEqual(WEST);
    expect(pointAtMeters([], 100)).toBeNull();
    expect(pointAtMeters([WEST], 100)).toEqual(WEST);
  });

  it('survives a repeated vertex without dividing by zero', () => {
    // A route line concatenated from several runs does contain these.
    const at = pointAtMeters([WEST, WEST, EAST], LEG / 2)!;
    expect(at.lng).toBeCloseTo(13.5, 3);
  });
});

describe('boxAround', () => {
  it('reaches the asked radius on all four sides', () => {
    const box = boxAround(BERLIN, 10);
    // North and south are the easy ones: a degree of latitude is constant.
    expect(haversineKm(BERLIN, { lat: box.north, lng: BERLIN.lng })).toBeCloseTo(10, 0);
    expect(haversineKm(BERLIN, { lat: BERLIN.lat, lng: box.east })).toBeCloseTo(10, 0);
  });

  it('widens the longitude span the further north it sits', () => {
    // The same radius is more degrees of longitude in Tromsø than in Berlin.
    const berlin = boxAround(BERLIN, 10);
    const tromso = boxAround({ lat: 69.65, lng: 18.96 }, 10);
    expect(tromso.east - tromso.west).toBeGreaterThan(berlin.east - berlin.west);
  });
});

describe('sliceAtMeters', () => {
  // A degree of latitude is about 111 km, so this line is roughly 111 km long and every
  // figure below can be read off it without a calculator.
  const line: LatLng[] = [
    { lat: 52, lng: 13 },
    { lat: 53, lng: 13 },
  ];

  it('cuts a stretch out of the middle and interpolates both ends', () => {
    const out = sliceAtMeters(line, 30_000, 60_000);
    expect(out).toHaveLength(2);
    expect(haversineKm(out[0]!, out[1]!) * 1000).toBeGreaterThan(29_000);
    expect(haversineKm(out[0]!, out[1]!) * 1000).toBeLessThan(31_000);
  });

  it('two adjacent slices meet exactly, so the parts rebuild the whole', () => {
    // The reason this exists: a day's line is its legs end to end, and a night drive
    // takes its own leg to the next card. A gap at the join would draw as a break in
    // the road.
    const first = sliceAtMeters(line, 0, 40_000);
    const second = sliceAtMeters(line, 40_000, 80_000);
    const end = first[first.length - 1]!;
    expect(haversineKm(end, second[0]!)).toBeLessThan(0.001);
  });

  it('clamps to the line rather than running past its end', () => {
    const out = sliceAtMeters(line, 0, 999_000_000);
    expect(out[out.length - 1]!).toEqual(line[line.length - 1]!);
  });

  it('is empty for a zero-length or backwards range', () => {
    expect(sliceAtMeters(line, 50_000, 50_000)).toEqual([]);
    expect(sliceAtMeters(line, 60_000, 30_000)).toEqual([]);
  });

  it('is empty for a line that is not one', () => {
    expect(sliceAtMeters([], 0, 100)).toEqual([]);
    expect(sliceAtMeters([{ lat: 52, lng: 13 }], 0, 100)).toEqual([]);
  });

  it('survives a repeated vertex without producing NaN', () => {
    // A concatenated route line really does contain these, and dividing by a zero-length
    // segment is how a route full of NaN reaches the map.
    const doubled: LatLng[] = [
      { lat: 52, lng: 13 },
      { lat: 52, lng: 13 },
      { lat: 53, lng: 13 },
    ];
    const out = sliceAtMeters(doubled, 10_000, 20_000);
    expect(out.every((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))).toBe(true);
  });
});
