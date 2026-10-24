import { haversineMetres } from '../geo/haversine';
import type { PaddleFeature } from '../paddle/paddle-obstacles.schema';
import {
  BASIS_TOLERANCE_M,
  isCarriedAt,
  materialOf,
  paddleCheckLineOfPoints,
  paddleCheckLineOfTrack,
  pointAlong,
  PORTAGE_PROOF_SLACK_M,
  routeTokenOf,
  sameRouteToken,
  sameSourceToken,
  sourceTokenOf,
  type PaddleCheckLine,
} from './paddle-check-basis';
import { routeTokenSchema, sourceTokenSchema } from './paddle-check.schema';
import { paddleLayoutOfPoints, type PaddlePlanPoint } from './paddle-plan';
import type { TrackMarks } from './paddle-plan.schema';

import { describe, expect, it } from 'vitest';

/**
 * PAD-06: what a decision about an obstacle is bound to. The line of a planned
 * tour and of a recorded track with the portages and locks of their layout, a
 * point along it and whether the boat is carried there, the route token and its
 * tolerance, the material data of an obstacle and the source token.
 */

/** Metres north and east of 49.1°N 12.1°E, near enough for these distances. */
const M_PER_DEG_LAT = 111_195;
const M_PER_DEG_LNG = 111_195 * Math.cos((49.1 * Math.PI) / 180);
function at(north: number, east = 0): [number, number] {
  return [49.1 + north / M_PER_DEG_LAT, 12.1 + east / M_PER_DEG_LNG];
}

/** Metres between two [lat, lng] positions, measured as the module measures them. */
function gapM(a: readonly [number, number], b: readonly [number, number]): number {
  return haversineMetres(a[0], a[1], b[0], b[1]);
}

/** A river running due north for 2 km, `east` metres east of the origin. */
function river(east = 0): Array<[number, number]> {
  return [at(0, east), at(1000, east), at(2000, east)];
}

/** Marks that carry the boat from `fromM` to `toM` along a track and hold no lock. */
function carry(fromM: number, toM: number): TrackMarks {
  return { portages: [{ from_m: fromM, to_m: toM, extra_minutes: null }], locks: [] };
}

/** The line of a recorded track; every route handed in here has two usable points or more. */
function trackLine(route: ReadonlyArray<ReadonlyArray<unknown>>, marks: TrackMarks | null = null): PaddleCheckLine {
  const line = paddleCheckLineOfTrack(route, marks);
  if (!line) throw new Error('the route makes no line');
  return line;
}

/** A control point `north` metres up the river. */
function stop(north: number, extra: Omit<PaddlePlanPoint, 'lat' | 'lng'> = {}): PaddlePlanPoint {
  const [lat, lng] = at(north);
  return { lat, lng, ...extra };
}

/** The line of a planned tour; every tour handed in here makes one. */
function plannedLine(points: readonly PaddlePlanPoint[]): PaddleCheckLine {
  const line = paddleCheckLineOfPoints(points);
  if (!line) throw new Error('the tour makes no line');
  return line;
}

/** The metres along a line at its `index`-th point. */
function metreOf(line: PaddleCheckLine, index: number): number {
  const metre = line.alongM[index];
  if (metre === undefined) throw new Error(`the line has no point ${index}`);
  return metre;
}

/**
 * A planned tour up the river: a drawn leg with a bend point, a carried leg
 * with a lock at its take-out, then two straight legs past a second lock.
 */
const planned: PaddlePlanPoint[] = [
  stop(0, { fixed_leg: { kind: 'free', geometry: [at(0), at(500), at(1000)] } }),
  stop(1000, {
    fixed_leg: { kind: 'portage', geometry: [at(1000), at(1200)] },
    lock: { wait_minutes: 20, transit_minutes: 10 },
  }),
  stop(1200),
  stop(2000, { lock: { wait_minutes: null, transit_minutes: 5 } }),
  stop(3000),
];

/**
 * A hand-made line 200 m long on the equator whose longitude grows by 1e-5
 * degrees a metre from -0.001, so a sample's rounded longitude reads as its
 * metre less 100. The boat is carried from 50 m to 100 m.
 */
const ruler: PaddleCheckLine = {
  points: [
    [0, -0.001],
    [0, 0.001],
  ],
  alongM: [0, 200],
  totalM: 200,
  portages: [{ fromM: 50, toM: 100, index: 1 }],
  locks: [],
};

function feature(ref: string, extra: Partial<Omit<PaddleFeature, 'ref'>> = {}): PaddleFeature {
  const base: PaddleFeature = {
    ref,
    kind: 'weir',
    group_key: null,
    name: null,
    geometry: { type: 'Point', coordinates: [12.1, 49.1] },
    tags: { waterway: 'weir', canoe: 'portage' },
    tag_hash: ref,
    region_id: 'oberpfalz',
  };
  return { ...base, ...extra };
}

/** The weir of these examples with tags added or changed. */
function weirWith(tags: Record<string, string>): PaddleFeature {
  return feature('way/7', { tags: { waterway: 'weir', canoe: 'portage', ...tags } });
}

describe('paddleCheckLineOfPoints', () => {
  it('joins the legs, drawn or straight, keeping each joint once and measuring by haversine', () => {
    const line = plannedLine(planned);
    expect(line.points).toEqual([at(0), at(500), at(1000), at(1200), at(2000), at(3000)]);
    expect(line.alongM.map(Math.round)).toEqual([0, 500, 1000, 1200, 2000, 3000]);
    expect(line.alongM[1]).toBe(gapM(at(0), at(500)));
    expect(line.totalM).toBe(line.alongM[5]);
  });

  it('takes its portages and locks from the layout of the tour, in the metres of the line', () => {
    const line = plannedLine(planned);
    const layout = paddleLayoutOfPoints(planned);
    expect(line.totalM).toBeCloseTo(layout.totalM, 6);
    const carried = layout.stretches.filter((stretch) => stretch.kind === 'portage');
    expect(line.portages).toEqual(carried.map((s) => ({ fromM: s.fromM, toM: s.toM, index: s.startIndex })));
    expect(line.locks).toEqual(layout.locks.map(({ atM, index, bypassed }) => ({ atM, index, bypassed })));
    // The portage runs from the take-out to the re-entry of the line, the locks sit on their places.
    expect(line.portages).toEqual([
      { fromM: expect.closeTo(metreOf(line, 2), 6), toM: expect.closeTo(metreOf(line, 3), 6), index: 1 },
    ]);
    expect(line.locks).toEqual([
      { atM: expect.closeTo(metreOf(line, 2), 6), index: 1, bypassed: true },
      { atM: expect.closeTo(metreOf(line, 4), 6), index: 3, bypassed: false },
    ]);
  });

  it('makes no line of fewer than two places, or of legs that never leave the spot', () => {
    const empty = stop(0, { fixed_leg: { kind: 'free', geometry: [] } });
    expect(paddleCheckLineOfPoints([])).toBeNull();
    expect(paddleCheckLineOfPoints([stop(0)])).toBeNull();
    expect(paddleCheckLineOfPoints([stop(0), stop(0)])).toBeNull();
    expect(paddleCheckLineOfPoints([empty, stop(1000)])).toBeNull();
  });
});

describe('paddleCheckLineOfTrack', () => {
  it('reads the points as numbers, leaves out those that are not, and measures by haversine', () => {
    const [a, b, c] = [at(0), at(1000), at(2000)];
    const route = [
      [a[0], a[1], 350],
      ['north', 'east', 351],
      [String(b[0]), String(b[1]), '352'],
      [49.11],
      [Number.NaN, b[1]],
      [c[0], c[1], 353],
    ];
    const line = trackLine(route);
    expect(line.points).toEqual([a, b, c]);
    expect(line.alongM).toEqual([0, gapM(a, b), gapM(a, b) + gapM(b, c)]);
    expect(line.totalM).toBe(gapM(a, b) + gapM(b, c));
    expect(line.portages).toEqual([]);
    expect(line.locks).toEqual([]);
    expect(paddleCheckLineOfTrack(route, undefined)).toEqual(line);
  });

  it('lays the marks onto the track, clamped to its end, sorted, and dropped where nothing is left', () => {
    const line = trackLine(river(), {
      portages: [
        { from_m: 1500, to_m: 2500, extra_minutes: null },
        { from_m: 2600, to_m: 2800, extra_minutes: null },
        { from_m: 200, to_m: 400, extra_minutes: 5 },
      ],
      locks: [
        { at_m: 1800, wait_minutes: 10, transit_minutes: 5 },
        { at_m: 2500, wait_minutes: null, transit_minutes: null },
        { at_m: 1000, wait_minutes: null, transit_minutes: null },
      ],
    });
    expect(line.portages).toEqual([
      { fromM: 200, toM: 400, index: null },
      { fromM: 1500, toM: line.totalM, index: null },
    ]);
    expect(line.locks).toEqual([
      { atM: 1000, index: null, bypassed: false },
      { atM: 1800, index: null, bypassed: true },
    ]);
  });

  it('makes no line of a track with fewer than two usable points', () => {
    expect(paddleCheckLineOfTrack([], null)).toBeNull();
    expect(paddleCheckLineOfTrack([at(0), ['north', 'east'], [Number.NaN, 12.1]], null)).toBeNull();
  });
});

describe('pointAlong and isCarriedAt', () => {
  it('finds the point a distance along the line, between its points and clamped to its ends', () => {
    const line = trackLine(river());
    expect(pointAlong(line, -50)).toEqual(at(0));
    expect(pointAlong(line, 0)).toEqual(at(0));
    expect(gapM(pointAlong(line, 250), at(250))).toBeLessThan(0.01);
    expect(gapM(pointAlong(line, 1500), at(1500))).toBeLessThan(0.01);
    expect(gapM(pointAlong(line, line.totalM), at(2000))).toBeLessThan(0.01);
    expect(pointAlong(line, line.totalM + 50)).toEqual(at(2000));
  });

  it('answers 0, 0 for a line without points instead of failing', () => {
    expect(pointAlong({ points: [], alongM: [], totalM: 0, portages: [], locks: [] }, 10)).toEqual([0, 0]);
  });

  it('carries the boat along a portage, its ends included, and a slack past the ends only when asked', () => {
    const line = trackLine(river(), carry(1000, 1200));
    expect([999, 1000, 1200, 1201].map((m) => isCarriedAt(line, m))).toEqual([false, true, true, false]);
    const within = PORTAGE_PROOF_SLACK_M - 1;
    const beyond = PORTAGE_PROOF_SLACK_M + 1;
    expect(isCarriedAt(line, 1000 - within)).toBe(false);
    expect(isCarriedAt(line, 1000 - within, PORTAGE_PROOF_SLACK_M)).toBe(true);
    expect(isCarriedAt(line, 1200 + within, PORTAGE_PROOF_SLACK_M)).toBe(true);
    expect(isCarriedAt(line, 1000 - beyond, PORTAGE_PROOF_SLACK_M)).toBe(false);
    expect(isCarriedAt(line, 1200 + beyond, PORTAGE_PROOF_SLACK_M)).toBe(false);
    expect(isCarriedAt(trackLine(river()), 1100, PORTAGE_PROOF_SLACK_M)).toBe(false);
  });
});

describe('routeTokenOf and sameRouteToken', () => {
  it('writes nine samples 25 m apart around each passage, carried ones as p and those beyond an end as _', () => {
    expect(routeTokenOf(ruler, [25, 190], 'near')).toBe(
      'p1:n:_|_|_|0,-100,w|0,-75,w|0,-50,p|0,-25,p|0,0,p|0,25,w;0,-10,p|0,15,w|0,40,w|0,65,w|0,90,w|_|_|_|_',
    );
    // A sample on an end of the line is kept on it.
    expect(routeTokenOf(ruler, [100], 'on_route')).toBe(
      'p1:o:0,-100,w|0,-75,w|0,-50,p|0,-25,p|0,0,p|0,25,w|0,50,w|0,75,w|0,100,w',
    );
  });

  it('reads its own token back as the same route, and four passages at the longest coordinates fit the contract', () => {
    const line = trackLine([
      [-45.5, -179.5],
      [-45.48, -179.5],
    ]);
    const token = routeTokenOf(line, [300, 900, 1500, 2100], 'on_route');
    expect(routeTokenOf(line, [300, 900, 1500, 2100], 'on_route')).toBe(token);
    expect(sameRouteToken(token, token)).toBe(true);
    const visits = token.slice('p1:o:'.length).split(';');
    expect(visits.map((visit) => visit.split('|').length)).toEqual([9, 9, 9, 9]);
    expect(token).not.toContain('_');
    expect(routeTokenSchema.safeParse(token).success).toBe(true);
  });

  it('reads a route moved sideways within the tolerance as the same, and one moved farther as another', () => {
    const before = routeTokenOf(trackLine(river()), [1000], 'on_route');
    const nudged = routeTokenOf(trackLine(river(BASIS_TOLERANCE_M - 1)), [1000], 'on_route');
    const moved = routeTokenOf(trackLine(river(BASIS_TOLERANCE_M + 1)), [1000], 'on_route');
    expect(nudged).not.toBe(before);
    expect(sameRouteToken(before, nudged)).toBe(true);
    expect(sameRouteToken(nudged, before)).toBe(true);
    expect(sameRouteToken(before, moved)).toBe(false);
  });

  it('reads a sample paddled in one and carried in the other as another route, a portage away from it as none', () => {
    const paddled = routeTokenOf(trackLine(river()), [1000], 'on_route');
    const carried = routeTokenOf(trackLine(river(), carry(1050, 1300)), [1000], 'on_route');
    const away = routeTokenOf(trackLine(river(), carry(1500, 1700)), [1000], 'on_route');
    expect(sameRouteToken(paddled, carried)).toBe(false);
    expect(away).toBe(paddled);
  });

  it('reads a sample beyond the end in one and on the line in the other as another route', () => {
    const ending = trackLine(river());
    const longer = trackLine([...river(), at(2100)]);
    const before = routeTokenOf(ending, [1950], 'on_route');
    expect(before).toContain('_');
    expect(sameRouteToken(before, routeTokenOf(ending, [1950], 'on_route'))).toBe(true);
    expect(sameRouteToken(before, routeTokenOf(longer, [1950], 'on_route'))).toBe(false);
  });

  it('reads another relation, another number of passages or of samples as another route', () => {
    const line = trackLine(river());
    const token = routeTokenOf(line, [1000], 'on_route');
    expect(sameRouteToken(token, routeTokenOf(line, [1000], 'near'))).toBe(false);
    expect(sameRouteToken(token, routeTokenOf(line, [400, 1000], 'on_route'))).toBe(false);
    expect(sameRouteToken('p1:o:_|_', 'p1:o:_|_')).toBe(true);
    expect(sameRouteToken('p1:o:_|_', 'p1:o:_|_|_')).toBe(false);
  });

  it('matches nothing with a token that does not read, not even itself', () => {
    const token = routeTokenOf(trackLine(river()), [1000], 'on_route');
    const unreadable = [
      '',
      'garbage',
      'p2:o:_',
      'p1:x:_',
      'p1:o:',
      'p1:o:4910000,1210000',
      'p1:o:4910000,1210000,x',
      'p1:o:north,east,w',
    ];
    for (const bad of unreadable) {
      expect(sameRouteToken(token, bad)).toBe(false);
      expect(sameRouteToken(bad, token)).toBe(false);
      expect(sameRouteToken(bad, bad)).toBe(false);
    }
  });
});

describe('materialOf', () => {
  it('writes what each member is and the tags that bear on passing, as JSON', () => {
    expect(materialOf([weirWith({ name: 'Wehr Pielenhofen', height: '1.2' })])).toBe(
      '[["way/7","weir","Point",[["canoe","portage"],["height","1.2"],["waterway","weir"]]]]',
    );
  });

  it('leaves out names, references, operators, websites, survey dates and where the geometry lies', () => {
    const plain = [feature('way/7'), feature('node/3', { kind: 'lock_gate', tags: { lock: 'yes' } })];
    const dressed = [
      feature('node/3', {
        kind: 'lock_gate',
        name: 'Schleuse Regensburg',
        tags: { lock: 'yes', lock_name: 'Schleuse Regensburg', ref: '3', operator: 'WSA Donau MDK' },
      }),
      feature('way/7', {
        name: 'Wehr Pielenhofen',
        tag_hash: 'another hash',
        geometry: { type: 'Point', coordinates: [12.1002, 49.1001] },
        tags: {
          waterway: 'weir',
          canoe: 'portage',
          name: 'Wehr Pielenhofen',
          website: 'https://example.org/wehr',
          check_date: '2026-09-01',
          'check_date:canoe': '2026-07-01',
          'survey:date': '2026-08-01',
        },
      }),
    ];
    expect(materialOf(dressed)).toBe(materialOf(plain));
    // The members are read in ref order without reordering the list handed in.
    expect(plain.map((member) => member.ref)).toEqual(['way/7', 'node/3']);
  });

  it('changes with what bears on passing: a paddling rule, a height, a note, the kind, the shape or a member', () => {
    const crest: PaddleFeature['geometry'] = {
      type: 'LineString',
      coordinates: [
        [12.1, 49.1],
        [12.1001, 49.1],
      ],
    };
    const before = materialOf([feature('way/7')]);
    const changed: PaddleFeature[][] = [
      [weirWith({ canoe: 'no' })],
      [weirWith({ height: '1.5' })],
      [weirWith({ description: 'Bootsgasse links' })],
      [weirWith({ fee: 'yes' })],
      [feature('way/7', { kind: 'dam' })],
      [feature('way/7', { geometry: crest })],
      [feature('way/7'), feature('node/3')],
      [feature('way/8')],
    ];
    for (const members of changed) expect(materialOf(members)).not.toBe(before);
  });
});

describe('sourceTokenOf and sameSourceToken', () => {
  const hash = '0123456789abcdef';
  const here = sourceTokenOf(hash, at(0));

  it('writes the hash and the position in 1e-5 degrees, as the contract reads it', () => {
    expect(here).toBe('s1:0123456789abcdef:4910000,1210000');
    expect(sourceTokenOf(hash, [49.123456, 12.000004])).toBe('s1:0123456789abcdef:4912346,1200000');
    expect(sourceTokenOf(hash, [-33.9, -70.65])).toBe('s1:0123456789abcdef:-3390000,-7065000');
    expect(sourceTokenSchema.safeParse(sourceTokenOf(hash, [-33.9, -70.65])).success).toBe(true);
  });

  it('reads the same hash within the tolerance as the same data, and farther off or under another hash as other data', () => {
    expect(sameSourceToken(here, here)).toBe(true);
    expect(sameSourceToken(here, sourceTokenOf(hash, at(0, BASIS_TOLERANCE_M - 1)))).toBe(true);
    expect(sameSourceToken(here, sourceTokenOf(hash, at(BASIS_TOLERANCE_M - 1, 0)))).toBe(true);
    expect(sameSourceToken(here, sourceTokenOf(hash, at(0, BASIS_TOLERANCE_M + 1)))).toBe(false);
    expect(sameSourceToken(here, sourceTokenOf(hash, at(BASIS_TOLERANCE_M + 1, 0)))).toBe(false);
    expect(sameSourceToken(here, sourceTokenOf('fedcba9876543210', at(0)))).toBe(false);
  });

  it('matches gone only with gone, and a token that does not read with nothing', () => {
    expect(sameSourceToken('gone', 'gone')).toBe(true);
    expect(sameSourceToken('gone', here)).toBe(false);
    expect(sameSourceToken(here, 'gone')).toBe(false);
    const unreadable = [
      '',
      'garbage',
      's1:0123456789ABCDEF:4910000,1210000',
      's1:0123456789abcde:4910000,1210000',
      's1:0123456789abcdef:49.1,12.1',
      's2:0123456789abcdef:4910000,1210000',
    ];
    for (const bad of unreadable) {
      expect(sameSourceToken(bad, here)).toBe(false);
      expect(sameSourceToken(here, bad)).toBe(false);
      expect(sameSourceToken(bad, bad)).toBe(false);
    }
  });
});
