import { haversineMetres } from '../geo/haversine';
import type {
  PaddleAccess,
  PaddleCoverageRegion,
  PaddleFeature,
  PaddleGeometry,
} from '../paddle/paddle-obstacles.schema';
import { MAX_PASSAGES, NEAR_M } from '../paddle/paddle-route-relation';
import {
  isChecklistRelevant,
  obstacleCandidatesOf,
  obstacleEntriesOf,
  obstacleSnapshotOf,
  obstacleStatusOf,
  ownEntriesOf,
  paddleCheckSummaryOf,
  paddleObstacleKeyOf,
  portageWayRestriction,
  type ObstacleCandidate,
  type StoredObstacleReview,
} from './paddle-check';
import {
  materialOf,
  routeTokenOf,
  sameRouteToken,
  sameSourceToken,
  sourceTokenOf,
  type PaddleCheckLine,
} from './paddle-check-basis';
import {
  OBSTACLE_REFS_MAX,
  obstacleBasisSchema,
  obstacleSnapshotSchema,
  paddleCheckSchema,
  tourObstacleEntrySchema,
  tourOwnEntrySchema,
  type ObstacleDecision,
  type PaddleCheck,
  type TourObstacleEntry,
  type TourOwnEntry,
} from './paddle-check.schema';
import type { PaddleBoatType } from './tours.schema';

import { describe, expect, it } from 'vitest';

/*
 * PAD-06 and PAD-09: the obstacle checklist of a paddle tour and its check
 * bench. Which objects of the data a tour has to decide about and the basis a
 * decision is bound to, the paddler's own portages and locks, every row of the
 * status table, the earlier decisions no current object carries, and the
 * counts on the bench.
 *
 * Places are metres north and east of 49.1°N 12.1°E in the flat view the route
 * relations measure in (111 195 m a degree). Metres along a line are haversine
 * metres (R = 6371 km), under a millimetre per kilometre shorter, so places
 * along a line are compared to half a metre rather than to the digit.
 */
const M_PER_DEG_LAT = 111_195;
const M_PER_DEG_LNG = 111_195 * Math.cos((49.1 * Math.PI) / 180);
const at = (north: number, east: number): [number, number] => [
  49.1 + north / M_PER_DEG_LAT,
  12.1 + east / M_PER_DEG_LNG,
];
const lngLat = (north: number, east: number): [number, number] => {
  const [lat, lng] = at(north, east);
  return [lng, lat];
};

type Tags = Record<string, string>;
type Portages = PaddleCheckLine['portages'];
type Boat = PaddleBoatType | null;

function pointAt(north: number, east: number): PaddleGeometry {
  return { type: 'Point', coordinates: lngLat(north, east) };
}

/** A line through [north, east] vertices. */
function wayThrough(...vertices: Array<[number, number]>): PaddleGeometry {
  return { type: 'LineString', coordinates: vertices.map(([north, east]) => lngLat(north, east)) };
}

/** A rectangle by its south, west, north and east sides, its outline closed where it starts. */
function area(s: number, w: number, n: number, e: number): PaddleGeometry {
  return { type: 'Polygon', coordinates: [[lngLat(s, w), lngLat(s, e), lngLat(n, e), lngLat(n, w), lngLat(s, w)]] };
}

function feature(
  ref: string,
  kind: PaddleFeature['kind'],
  geometry: PaddleGeometry,
  extra: Partial<PaddleFeature> = {},
): PaddleFeature {
  return {
    ref,
    kind,
    group_key: null,
    name: null,
    geometry,
    tags: {},
    tag_hash: ref,
    region_id: 'oberpfalz',
    ...extra,
  };
}

/** A line through the points, measured by haversine as a check line is, with no portages or locks yet. */
function lineOf(points: Array<[number, number]>): PaddleCheckLine {
  const alongM: number[] = [];
  let totalM = 0;
  points.forEach(([lat, lng], i) => {
    const prev = points[i - 1];
    if (prev) totalM += haversineMetres(prev[0], prev[1], lat, lng);
    alongM.push(totalM);
  });
  return { points, alongM, totalM, portages: [], locks: [] };
}

/** Metres between two [lat, lng] points; Infinity when the first is missing. */
function gapM(a: readonly [number, number] | undefined, b: readonly [number, number]): number {
  return a ? haversineMetres(a[0], a[1], b[0], b[1]) : Number.POSITIVE_INFINITY;
}

/** The [lat, lng] a source token holds. */
function positionOf(token: string): [number, number] {
  const match = /:(-?\d+),(-?\d+)$/.exec(token);
  return [Number(match?.[1]) / 1e5, Number(match?.[2]) / 1e5];
}

/** The one item of a list; the test fails when there is not exactly one. */
function single<T>(items: readonly T[]): T {
  const [item, ...rest] = items;
  if (item === undefined || rest.length > 0) throw new Error(`expected exactly one item, got ${items.length}`);
  return item;
}

/** FNV-1a over 64 bits as 16 hex digits: a deterministic stand-in for the server's hash. */
function fnv1a(text: string): string {
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i++) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

const HASH_A = '0123456789abcdef';
const HASH_B = 'fedcba9876543210';
const DATA_AS_OF = '2026-09-01T00:00:00Z';
const REGIONS: PaddleCoverageRegion[] = [
  { id: 'oberpfalz', name: 'Oberpfalz', source_timestamp: DATA_AS_OF, imported_at: '2026-09-03T08:00:00Z' },
];
const NO_RULE: PaddleAccess = { value: null, source: null, condition: null, forbidden: false, private: false };
const BAN: PaddleAccess = { ...NO_RULE, value: 'no', source: 'canoe', forbidden: true };
const PRIVATE_WATER: PaddleAccess = { ...NO_RULE, value: 'private', source: 'boat', private: true };

/** A river reach due east, 2 km long. */
const straight = lineOf([at(0, 0), at(0, 2000)]);
/** Out 2 km east, 20 m across and back west: whatever lies across the water is passed twice. */
const outAndBack = lineOf([at(0, 0), at(0, 2000), at(20, 2000), at(20, 0)]);
/** The paddler's carry from 900 to 1100 m. */
const carry = { fromM: 900, toM: 1100, index: 1 };
/** The basis of a weir at 1000 m on the straight reach. */
const ROUTE = routeTokenOf(straight, [1000], 'on_route');
const SOURCE = sourceTokenOf(HASH_A, at(0, 1000));

/**
 * A lock the straight reach runs through: the upper gate across the water at
 * 975 m, the chamber from 980 to 1010 m and the lower gate at 1015 m.
 */
function lockAt(upper: Tags = {}, chamber: Tags = {}, lower: Tags = {}): PaddleFeature[] {
  const part = (tags: Tags) => ({ group_key: 'lock:way/100', tags });
  return [
    feature('way/300', 'lock_gate', wayThrough([-10, 975], [10, 975]), part(upper)),
    feature('way/100', 'lock', area(-10, 980, 10, 1010), { ...part(chamber), name: 'Schleuse Kelheim' }),
    feature('way/301', 'lock_gate', wayThrough([-10, 1015], [10, 1015]), part(lower)),
  ];
}

function candidatesOf(line: PaddleCheckLine, features: readonly PaddleFeature[], boat: Boat = null) {
  return obstacleCandidatesOf({ line, features, regions: REGIONS, boat, hash: fnv1a });
}

/** A candidate as obstacleCandidatesOf makes one: by default a weir on the straight reach at 1000 m. */
function candidateOf(key: string, overrides: Partial<ObstacleCandidate> = {}): ObstacleCandidate {
  return {
    key,
    refs: [key.replace(/^lock:/, '')],
    kind: 'weir',
    name: null,
    at: at(0, 1000),
    bounds: [at(0, 1000), at(0, 1000)],
    relation: 'on_route',
    along_m: 1000,
    distance_m: 0,
    passages: 1,
    access: NO_RULE,
    advice: null,
    portage: 'none',
    local_check: null,
    data_as_of: DATA_AS_OF,
    route: ROUTE,
    source: SOURCE,
    region_id: 'oberpfalz',
    passage_m: [1000],
    ...overrides,
  };
}

/** A stored decision about a candidate, bound to its basis as it stands. */
function reviewOf(candidate: ObstacleCandidate, overrides: Partial<StoredObstacleReview> = {}): StoredObstacleReview {
  return {
    obstacle_key: candidate.key,
    decision: 'pass',
    note: null,
    route_fingerprint: candidate.route,
    source_fingerprint: candidate.source,
    snapshot: obstacleSnapshotOf(candidate),
    decided_at: '2026-07-01T10:00:00.000Z',
    decided_by: 7,
    ...overrides,
  };
}

/** A decision taken on a day about an object at a place, which no current candidate carries. */
function earlierReview(key: string, place: [number, number], day: string, source = SOURCE): StoredObstacleReview {
  const decidedAt = `${day}T08:00:00.000Z`;
  return reviewOf(candidateOf(key, { at: place, bounds: [place, place] }), {
    decided_at: decidedAt,
    source_fingerprint: source,
  });
}

/** A checklist entry as obstacleEntriesOf makes one, open unless told otherwise. */
function entryOf(key: string, overrides: Partial<TourObstacleEntry> = {}): TourObstacleEntry {
  const { route, source, region_id: _region, passage_m: _passages, ...entry } = candidateOf(key);
  return { ...entry, status: 'open', changed: [], basis: { route, source }, decision: null, ...overrides };
}

/** One of the paddler's own entries: by default a portage from 900 to 1100 m. */
function ownOf(overrides: Partial<TourOwnEntry> = {}): TourOwnEntry {
  return {
    kind: 'portage',
    index: 1,
    from_m: 900,
    to_m: 1100,
    at: at(0, 1000),
    bounds: [at(0, 900), at(0, 1100)],
    covers: [],
    bypassed: false,
    advice: null,
    conflict: null,
    ...overrides,
  };
}

describe('paddleObstacleKeyOf', () => {
  it('names the parts of a lock by their group and anything else by its own reference', () => {
    expect(paddleObstacleKeyOf({ ref: 'way/300', group_key: 'lock:way/100' })).toBe('lock:way/100');
    expect(paddleObstacleKeyOf({ ref: 'node/7', group_key: null })).toBe('node/7');
  });
});

describe('isChecklistRelevant', () => {
  const listed = (kind: PaddleFeature['kind'], tags: Tags) =>
    isChecklistRelevant(feature('node/1', kind, pointAt(0, 0), { tags }));

  it('lists every obstacle whatever its tags, and never a place or way that helps', () => {
    const obstacles = ['weir', 'dam', 'lock', 'lock_gate', 'waterfall', 'rapids', 'hazard'] as const;
    expect(obstacles.filter((kind) => !listed(kind, { canoe: 'yes' }))).toEqual([]);
    const helpers = ['put_in', 'egress', 'slipway', 'portage'] as const;
    expect(helpers.filter((kind) => listed(kind, { canoe: 'no' }))).toEqual([]);
  });

  // An access object asks for a decision unless it lets anyone paddle; an unknown value is no permission.
  const rules: Array<[string, boolean, Tags]> = [
    ['canoe=yes', false, { canoe: 'yes' }],
    ['boat=designated', false, { boat: 'designated' }],
    ['canoe=permissive', false, { canoe: 'permissive' }],
    ['canoe=official', false, { canoe: 'official' }],
    ['canoe=yes over boat=no', false, { canoe: 'yes', boat: 'no' }],
    ['no paddling rule at all', false, {}],
    ['canoe=no', true, { canoe: 'no' }],
    ['access=no', true, { access: 'no' }],
    ['boat=private', true, { boat: 'private' }],
    ['canoe=yes and a seasonal ban', true, { canoe: 'yes', 'canoe:conditional': 'no @ (Nov 01-Mar 31)' }],
    ['only a seasonal ban', true, { 'boat:conditional': 'no @ (Nov 01-Mar 31)' }],
    ['canoe=portage', true, { canoe: 'portage' }],
    ['canoe=permit', true, { canoe: 'permit' }],
  ];

  it.each(rules)('an access object with %s is listed: %s', (_label, expected, tags) => {
    expect(listed('access', tags)).toBe(expected);
  });
});

describe('portageWayRestriction', () => {
  it('reads portage:access before access and finds nothing against an open or untagged way', () => {
    expect(portageWayRestriction({ 'portage:access': 'no' })).toBe('forbidden');
    expect(portageWayRestriction({ access: 'no' })).toBe('forbidden');
    expect(portageWayRestriction({ access: 'private' })).toBe('private');
    expect(portageWayRestriction({ 'portage:access': 'private', access: 'yes' })).toBe('private');
    expect(portageWayRestriction({ 'portage:access': 'yes', access: 'no' })).toBeNull();
    expect(portageWayRestriction({ access: 'permissive' })).toBeNull();
    expect(portageWayRestriction({})).toBeNull();
  });
});

describe('obstacleCandidatesOf', () => {
  it('lists only what the paddler has to decide about, in route order', () => {
    const features = [
      feature('node/5', 'weir', pointAt(100, 1500)),
      feature('node/6', 'weir', pointAt(400, 1200)), // beyond NEAR_M
      feature('node/7', 'put_in', pointAt(0, 300)), // a place that helps
      feature('way/60', 'access', wayThrough([0, 0], [0, 2000]), { tags: { canoe: 'yes' } }), // open water
      ...lockAt(),
    ];
    expect(candidatesOf(straight, features).map((candidate) => candidate.key)).toEqual(['lock:way/100', 'node/5']);
    expect(candidatesOf(straight, [])).toEqual([]);
  });

  it('takes the parts of a lock together: kind lock, the part nearest the route first, bounds round them all', () => {
    const lock = single(candidatesOf(straight, lockAt()));
    expect(lock).toMatchObject({
      key: 'lock:way/100',
      refs: ['way/300', 'way/100', 'way/301'],
      kind: 'lock',
      name: 'Schleuse Kelheim',
      bounds: [at(-10, 975), at(10, 1015)],
      relation: 'on_route',
      along_m: 975,
      distance_m: 0,
      passages: 1,
      access: NO_RULE,
      advice: null,
      portage: 'none',
      local_check: null,
      data_as_of: DATA_AS_OF,
      region_id: 'oberpfalz',
    });
    // The upper gate at 975 m, the chamber from 980 m and the lower gate at 1015 m are one passage.
    expect(lock.passage_m).toEqual([expect.closeTo(975, 0)]);
    expect(gapM(lock.at, at(0, 975))).toBeLessThan(0.5);
  });

  it('binds the entry to the route around its passage and to the material data of all its parts', () => {
    const features = lockAt();
    const lock = single(candidatesOf(straight, features));
    expect(lock.route.startsWith('p1:o:')).toBe(true);
    expect(sameRouteToken(lock.route, routeTokenOf(straight, [975], 'on_route'))).toBe(true);
    expect(lock.source.split(':')[1]).toBe(fnv1a(materialOf(features)));
    // The mean of each part's own place, the middle of its extent: the gates at 975 and 1015 m, the chamber at 995 m.
    expect(gapM(positionOf(lock.source), at(0, 995))).toBeLessThan(1);
  });

  it('keeps the source through a new name or check on site, and changes it with a paddling rule on any part', () => {
    const { source } = single(candidatesOf(straight, lockAt()));
    const renamed = lockAt({}, { name: 'Schleuse Kelheim', operator: 'WSV', check_date: '2026-09-30' });
    expect(single(candidatesOf(straight, renamed)).source).toBe(source);
    const banned = lockAt({}, {}, { canoe: 'no' });
    expect(sameSourceToken(single(candidatesOf(straight, banned)).source, source)).toBe(false);
  });

  it('takes the first 16 hex digits of a longer hash', () => {
    const long = obstacleCandidatesOf({
      line: straight,
      features: lockAt(),
      regions: REGIONS,
      boat: null,
      hash: (text) => fnv1a(text).repeat(4),
    });
    expect(single(long).source).toBe(single(candidatesOf(straight, lockAt())).source);
  });

  it('is on the route when any part is, and finds passages only within the reach of that relation', () => {
    const part = { group_key: 'lock:node/1' };
    const features = [
      feature('node/1', 'lock_gate', pointAt(10, 500), part),
      feature('node/2', 'lock', pointAt(80, 800), part),
    ];
    // Within NEAR_M the chamber 80 m off would make a passage of its own at 800 m; within ON_ROUTE_M it does not.
    expect(single(candidatesOf(straight, features))).toMatchObject({
      key: 'lock:node/1',
      refs: ['node/1', 'node/2'],
      kind: 'lock',
      relation: 'on_route',
      distance_m: 10,
      along_m: 500,
      passages: 1,
    });
  });

  it('is near when the route only comes within NEAR_M, its data date unknown outside the regions read', () => {
    const weir = feature('node/5', 'weir', pointAt(100, 1500), { name: 'Wehr Pielenhofen', region_id: 'elsewhere' });
    const entry = single(candidatesOf(straight, [weir]));
    expect(entry).toMatchObject({
      key: 'node/5',
      refs: ['node/5'],
      kind: 'weir',
      name: 'Wehr Pielenhofen',
      relation: 'near',
      distance_m: 100,
      along_m: 1500,
      passages: 1,
      data_as_of: null,
      region_id: 'elsewhere',
    });
    expect(entry.route.startsWith('p1:n:')).toBe(true);
  });

  it('keeps the closest passages of all the parts together, in route order', () => {
    const part = { group_key: 'lock:node/11' };
    const gates = [
      feature('node/11', 'lock_gate', pointAt(5, 200), part),
      feature('node/12', 'lock_gate', pointAt(4, 500), part),
      feature('node/13', 'lock_gate', pointAt(1, 800), part),
      feature('node/14', 'lock_gate', pointAt(2, 1100), part),
      feature('node/15', 'lock_gate', pointAt(3, 1400), part),
    ];
    const lock = single(candidatesOf(straight, gates));
    // Five passages 300 m apart; the one 5 m off at 200 m is the farthest and goes.
    expect(lock.passages).toBe(MAX_PASSAGES);
    expect(lock.passage_m).toEqual([500, 800, 1100, 1400].map((m) => expect.closeTo(m, 0)));
    expect(lock).toMatchObject({
      refs: ['node/13', 'node/11', 'node/12', 'node/14', 'node/15'],
      kind: 'lock_gate',
      name: null,
      along_m: 500,
      distance_m: 1,
    });
    expect(gapM(lock.at, at(0, 500))).toBeLessThan(0.5);
  });

  it('takes the strictest paddling rule among the parts: a ban, private water, a condition, then any value', () => {
    const accessOf = (upper: Tags, chamber: Tags, lower: Tags) =>
      single(candidatesOf(straight, lockAt(upper, chamber, lower))).access;
    const season = { 'canoe:conditional': 'no @ (Nov 01-Mar 31)' };
    expect(accessOf({}, { canoe: 'yes' }, {})).toEqual({ ...NO_RULE, value: 'yes', source: 'canoe' });
    expect(accessOf({ canoe: 'yes' }, season, {})).toEqual({ ...NO_RULE, condition: 'no @ (Nov 01-Mar 31)' });
    expect(accessOf(season, { boat: 'private' }, { canoe: 'yes' })).toEqual(PRIVATE_WATER);
    expect(accessOf({ boat: 'private' }, {}, { access: 'no' })).toEqual({ ...BAN, source: 'access' });
  });

  it('records the latest check on site any part notes, as written, and nothing that is no check date', () => {
    const features = lockAt(
      { 'check_date:canoe': '2025-07-01' },
      { check_date: '2024-05-12', 'survey:date': '2025-09' },
      { check_date: '2026-08-01T10:00:00Z', start_date: '2027-01-01' },
    );
    expect(single(candidatesOf(straight, features)).local_check).toBe('2025-09');
  });

  it('advises a SUP to carry round a lock or lock gate the plan does not carry round, and no other boat', () => {
    const adviceOf = (features: PaddleFeature[], boat: Boat, portages: Portages = []) =>
      single(candidatesOf({ ...straight, portages }, features, boat)).advice;
    const gate = feature('node/8', 'lock_gate', pointAt(5, 1000));
    const weir = feature('node/9', 'weir', pointAt(5, 1000));
    expect(adviceOf(lockAt(), 'sup')).toBe('sup_lock_portage');
    expect(adviceOf([gate], 'sup')).toBe('sup_lock_portage');
    expect(adviceOf(lockAt(), 'sup', [carry])).toBeNull();
    expect(adviceOf([weir], 'sup')).toBeNull();
    expect(adviceOf(lockAt(), 'kayak')).toBeNull();
    expect(adviceOf(lockAt(), 'canoe')).toBeNull();
    expect(adviceOf(lockAt(), null)).toBeNull();
  });

  describe('on an out-and-back tour', () => {
    const weir = feature('way/40', 'weir', wayThrough([-30, 1000], [50, 1000]));
    /** The carry round the weir on the way back, which crosses it at 3020 m. */
    const back = { fromM: 2920, toM: 3120, index: 3 };
    const on = (portages: Portages, features = [weir], boat: Boat = null) =>
      single(candidatesOf({ ...outAndBack, portages }, features, boat));

    it('passes an obstacle twice, once each way, and binds the route around both passages', () => {
      const entry = on([]);
      expect(entry).toMatchObject({ relation: 'on_route', distance_m: 0, along_m: 1000, passages: 2 });
      expect(entry.passage_m).toEqual([expect.closeTo(1000, 0), expect.closeTo(3020, 0)]);
      expect(entry.route.split(';')).toHaveLength(2);
      expect(() => obstacleBasisSchema.parse({ route: entry.route, source: entry.source })).not.toThrow();
    });

    it('counts the portage planned only when the plan carries round every passage', () => {
      expect(on([]).portage).toBe('none');
      expect(on([carry]).portage).toBe('partial');
      expect(on([back]).portage).toBe('partial');
      expect(on([carry, back]).portage).toBe('planned');
    });

    it('lets a carry prove a passage within its 5 m slack and not beyond', () => {
      // The way out crosses the weir at 1000 m: a carry ending 4 m short of it proves it, one 6 m short does not.
      expect(on([{ fromM: 900, toM: 996, index: 1 }, back]).portage).toBe('planned');
      expect(on([{ fromM: 900, toM: 994, index: 1 }, back]).portage).toBe('partial');
      expect(on([{ fromM: 1004, toM: 1100, index: 1 }, back]).portage).toBe('planned');
      expect(on([{ fromM: 1006, toM: 1100, index: 1 }, back]).portage).toBe('partial');
    });

    it('changes the route token where a carry is drawn and leaves the source as it was', () => {
      const open = on([]);
      const planned = on([carry, back]);
      expect(sameRouteToken(open.route, planned.route)).toBe(false);
      expect(planned.source).toBe(open.source);
    });

    it('keeps the SUP advice at a lock gate the plan carries round only one way', () => {
      const gate = feature('way/41', 'lock_gate', wayThrough([-30, 1000], [50, 1000]));
      expect(on([carry], [gate], 'sup')).toMatchObject({ portage: 'partial', advice: 'sup_lock_portage' });
      expect(on([carry, back], [gate], 'sup')).toMatchObject({ portage: 'planned', advice: null });
    });
  });
});

describe('the caps of one entry', () => {
  it('names a lock of more parts than an entry holds by its nearest part and the first others, as the schemas allow', () => {
    // 40 gates along the chamber, all of one lock; the first one sits on the route.
    const parts = Array.from({ length: 40 }, (_, i) =>
      feature(`way/${500 + i}`, 'lock_gate', wayThrough([-10, 960 + i], [10, 960 + i]), { group_key: 'lock:way/500' }),
    );
    const [lock] = candidatesOf(straight, parts);
    expect(lock?.refs).toHaveLength(OBSTACLE_REFS_MAX);
    expect(new Set(lock?.refs).size).toBe(OBSTACLE_REFS_MAX);
    if (!lock) throw new Error('no lock');
    expect(obstacleSnapshotSchema.safeParse(obstacleSnapshotOf(lock)).success).toBe(true);
  });

  it('lists at most as many obstacles under one portage as an own entry holds', () => {
    const line: PaddleCheckLine = { ...straight, portages: [{ fromM: 100, toM: 1900, index: 1 }] };
    const candidates = Array.from({ length: 35 }, (_, i) =>
      candidateOf(`node/${i + 1}`, { passage_m: [200 + i * 40] }),
    );
    const [portage] = ownEntriesOf({ line, candidates, features: [], boat: 'kayak' });
    expect(portage?.covers).toHaveLength(OBSTACLE_REFS_MAX);
    expect(tourOwnEntrySchema.safeParse(portage).success).toBe(true);
  });
});

describe('ownEntriesOf', () => {
  const planned: PaddleCheckLine = {
    ...straight,
    portages: [carry],
    locks: [
      { atM: 1500, index: 3, bypassed: false },
      { atM: 400, index: 0, bypassed: true },
    ],
  };

  it('lists each portage with the obstacles it carries round, and each lock, in route order', () => {
    const candidates = [
      candidateOf('way/1', { passage_m: [1000] }),
      candidateOf('way/2', { passage_m: [1105] }), // 5 m past the end of the carry, within its slack
      candidateOf('way/3', { passage_m: [1106] }),
      candidateOf('lock:way/4', { passage_m: [300, 895] }), // one of its passages 5 m before the carry starts
    ];
    const own = ownEntriesOf({ line: planned, candidates, features: [], boat: 'kayak' });
    expect(own.map((entry) => [entry.kind, entry.from_m, entry.to_m])).toEqual([
      ['lock', 400, 400],
      ['portage', 900, 1100],
      ['lock', 1500, 1500],
    ]);
    const [bypassed, portage, lock] = own;
    expect(portage).toMatchObject({
      kind: 'portage',
      index: 1,
      covers: ['way/1', 'way/2', 'lock:way/4'],
      bypassed: false,
      advice: null,
      conflict: null,
    });
    expect(gapM(portage?.at, at(0, 1000))).toBeLessThan(0.5);
    expect(gapM(portage?.bounds[0], at(0, 900))).toBeLessThan(0.5);
    expect(gapM(portage?.bounds[1], at(0, 1100))).toBeLessThan(0.5);
    expect(lock).toMatchObject({ kind: 'lock', index: 3, covers: [], bypassed: false, advice: null, conflict: null });
    expect(gapM(lock?.at, at(0, 1500))).toBeLessThan(0.5);
    expect(lock?.bounds).toEqual([lock?.at, lock?.at]);
    expect(bypassed).toMatchObject({ kind: 'lock', index: 0, bypassed: true });
    for (const entry of own) expect(() => tourOwnEntrySchema.parse(entry)).not.toThrow();
  });

  it('advises a SUP at its own lock unless the plan goes round it', () => {
    const sup = ownEntriesOf({ line: planned, candidates: [], features: [], boat: 'sup' });
    expect(sup.map((entry) => [entry.kind, entry.advice])).toEqual([
      ['lock', null],
      ['portage', null],
      ['lock', 'sup_lock_portage'],
    ]);
    const kayak = ownEntriesOf({ line: planned, candidates: [], features: [], boat: 'kayak' });
    expect(kayak.map((entry) => entry.advice)).toEqual([null, null, null]);
  });

  it('marks a portage whose carrying way the data records as forbidden or private, the stricter winning', () => {
    const line: PaddleCheckLine = {
      ...straight,
      portages: [
        { fromM: 200, toM: 300, index: 0 },
        { fromM: 900, toM: 1100, index: 1 },
        { fromM: 1400, toM: 1600, index: 4 },
      ],
    };
    const features = [
      // Along the first carry: an open way, a closed one 60 m off, and the river itself closed to boats.
      feature('way/703', 'portage', wayThrough([8, 210], [8, 290])),
      feature('way/704', 'portage', wayThrough([60, 210], [60, 290]), { tags: { access: 'no' } }),
      feature('way/705', 'access', wayThrough([0, 150], [0, 350]), { tags: { canoe: 'private' } }),
      // Along the second: a private path.
      feature('way/700', 'portage', wayThrough([8, 910], [8, 1090]), { tags: { access: 'private' } }),
      // Along the third: a private path, and on the other bank a way where carrying is forbidden.
      feature('way/701', 'portage', wayThrough([8, 1450], [8, 1550]), { tags: { access: 'private' } }),
      feature('way/702', 'portage', wayThrough([-8, 1450], [-8, 1550]), { tags: { 'portage:access': 'no' } }),
    ];
    const own = ownEntriesOf({ line, candidates: [], features, boat: null });
    expect(own.map((entry) => entry.conflict)).toEqual([null, 'private', 'forbidden']);
  });

  it('follows the line round a turn for the bounds and the middle of a portage', () => {
    const line: PaddleCheckLine = { ...outAndBack, portages: [{ fromM: 1900, toM: 2120, index: 2 }] };
    const portage = single(ownEntriesOf({ line, candidates: [], features: [], boat: null }));
    expect(portage).toMatchObject({ kind: 'portage', index: 2, from_m: 1900, to_m: 2120 });
    expect(portage.bounds[1]).toEqual(at(20, 2000));
    expect(gapM(portage.bounds[0], at(0, 1900))).toBeLessThan(0.5);
    expect(gapM(portage.at, at(10, 2000))).toBeLessThan(0.5);
  });
});

describe('obstacleStatusOf', () => {
  type Current = Parameters<typeof obstacleStatusOf>[0]['current'];
  const carried = routeTokenOf({ ...straight, portages: [carry] }, [1000], 'on_route');
  const nearOnly = routeTokenOf(straight, [1000], 'near');
  const nudged = sourceTokenOf(HASH_A, at(10, 1000));
  const moved = sourceTokenOf(HASH_A, at(40, 1000));
  const other = sourceTokenOf(HASH_B, at(0, 1000));
  const decided = { status: 'decided', changed: [] };
  const todo = { status: 'todo', changed: [] };
  const review = (...changed: Array<'route' | 'source'>) => ({ status: 'review', changed });
  /** A decision about the weir at 1000 m, `now` and `stored` replacing parts of the current and the stored basis. */
  const statusOf = (decision: ObstacleDecision, now: Partial<Current> = {}, stored: Partial<Current> = {}) =>
    obstacleStatusOf({
      current: { route: now.route ?? ROUTE, source: now.source ?? SOURCE, portage: now.portage ?? 'none' },
      review: { decision, route: stored.route ?? ROUTE, source: stored.source ?? SOURCE },
    });

  it('is open while nothing is decided', () => {
    const current = { route: ROUTE, source: SOURCE, portage: 'planned' } as const;
    expect(obstacleStatusOf({ current, review: null })).toEqual({ status: 'open', changed: [] });
  });

  it('decides a pass or not affected on an unchanged basis; a reroute stays to do while the route passes', () => {
    expect(statusOf('pass')).toEqual(decided);
    expect(statusOf('not_affected')).toEqual(decided);
    expect(statusOf('reroute')).toEqual(todo);
  });

  it('holds a decision while the obstacle moves within the tolerance', () => {
    expect(statusOf('pass', { source: nudged })).toEqual(decided);
  });

  it('decides a portage only while the plan carries round every passage', () => {
    expect(statusOf('portage', { portage: 'planned' })).toEqual(decided);
    expect(statusOf('portage', { portage: 'partial' })).toEqual(todo);
    expect(statusOf('portage', { portage: 'none' })).toEqual(todo);
  });

  it('holds a portage over the route its own carry changed, and keeps it to do without the carry', () => {
    expect(statusOf('portage', { route: carried, portage: 'planned' })).toEqual(decided);
    expect(statusOf('portage', { route: nearOnly, portage: 'none' })).toEqual(todo);
  });

  it('asks for any other decision to be checked again once the route changed', () => {
    expect(statusOf('pass', { route: carried })).toEqual(review('route'));
    expect(statusOf('reroute', { route: carried })).toEqual(review('route'));
    expect(statusOf('not_affected', { route: nearOnly })).toEqual(review('route'));
  });

  it('asks for every decision to be checked again once the data changed or the obstacle moved', () => {
    expect(statusOf('pass', { source: other })).toEqual(review('source'));
    expect(statusOf('not_affected', { source: moved })).toEqual(review('source'));
    expect(statusOf('portage', { route: carried, source: other, portage: 'planned' })).toEqual(review('source'));
    expect(statusOf('pass', { route: carried, source: other })).toEqual(review('source', 'route'));
  });

  it('never matches a stored basis kept as gone or one that does not read', () => {
    expect(statusOf('pass', {}, { source: 'gone' })).toEqual(review('source'));
    expect(statusOf('pass', {}, { route: 'p1:o:garbage' })).toEqual(review('route'));
  });
});

describe('obstacleSnapshotOf', () => {
  it('keeps what a decision needs to say what it was about', () => {
    const lock = single(candidatesOf(straight, lockAt()));
    const snapshot = obstacleSnapshotOf(lock);
    expect(snapshot).toEqual({
      v: 1,
      kind: 'lock',
      name: 'Schleuse Kelheim',
      refs: ['way/300', 'way/100', 'way/301'],
      at: lock.at,
      bounds: [at(-10, 975), at(10, 1015)],
      relation: 'on_route',
      along_m: 975,
      region_id: 'oberpfalz',
      data_as_of: DATA_AS_OF,
    });
    expect(obstacleSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it('reads a candidate without a relation or a place along the route as near, at 0 m', () => {
    const snapshot = obstacleSnapshotOf(candidateOf('way/1', { relation: null, along_m: null }));
    expect(snapshot).toMatchObject({ relation: 'near', along_m: 0 });
  });
});

describe('obstacleEntriesOf', () => {
  const upstream = candidateOf('way/1', {
    at: at(0, 500),
    along_m: 500,
    passage_m: [500],
    route: routeTokenOf(straight, [500], 'on_route'),
    source: sourceTokenOf(HASH_A, at(0, 500)),
  });
  const weir = candidateOf('way/3');
  const sideArm = candidateOf('node/2', {
    at: at(0, 1500),
    relation: 'near',
    along_m: 1500,
    distance_m: 80,
    passage_m: [1500],
    route: routeTokenOf(straight, [1500], 'near'),
    source: sourceTokenOf(HASH_B, at(80, 1500)),
  });
  /** Decisions no current candidate carries, the oldest first. */
  const earlier = [
    earlierReview('way/10', at(0, 800), '2026-05-01'), // still in the data, the route no longer meets it
    earlierReview('way/11', at(NEAR_M + 10, 1000), '2026-06-01'), // gone from the data, far from the route
    earlierReview('way/12', at(NEAR_M - 10, 1200), '2026-08-01'), // gone from the data, near the route
    earlierReview('way/13', at(0, 1800), '2026-09-01', 'gone'), // kept on purpose once it was gone
  ];

  it('lists the current candidates first with status and basis, then the earlier decisions newest first', () => {
    const reviews = [
      ...earlier,
      reviewOf(upstream, { note: 'links am Ufer vorbei' }),
      reviewOf(weir, { route_fingerprint: routeTokenOf(straight, [1300], 'on_route') }),
    ];
    const entries = obstacleEntriesOf({
      candidates: [upstream, weir, sideArm],
      reviews,
      dataKeys: new Set(['way/1', 'way/3', 'node/2', 'way/10']),
      complete: true,
      line: straight,
    });
    expect(entries.map((entry) => [entry.key, entry.status])).toEqual([
      ['way/1', 'decided'],
      ['way/3', 'review'],
      ['node/2', 'open'],
      ['way/13', 'kept'],
      ['way/12', 'gone'],
      ['way/11', 'off_route'],
      ['way/10', 'off_route'],
    ]);
    const [decided, moved, open] = entries;
    expect(decided).toMatchObject({
      changed: [],
      basis: { route: upstream.route, source: upstream.source },
      decision: {
        decision: 'pass',
        note: 'links am Ufer vorbei',
        decided_at: '2026-07-01T10:00:00.000Z',
        decided_by: 7,
      },
    });
    // An entry carries the basis it stands on now, not the one it was decided against.
    expect(moved).toMatchObject({ changed: ['route'], basis: { route: weir.route, source: weir.source } });
    expect(open).toMatchObject({
      changed: [],
      basis: { route: sideArm.route, source: sideArm.source },
      decision: null,
    });
    for (const key of ['route', 'source', 'region_id', 'passage_m']) expect(decided).not.toHaveProperty(key);
    for (const entry of entries) expect(() => tourObstacleEntrySchema.parse(entry)).not.toThrow();
  });

  it('builds an earlier entry from its snapshot alone: no relation, basis, rule or advice of its own', () => {
    const lock = candidateOf('lock:way/12', {
      refs: ['way/12', 'way/14'],
      kind: 'lock',
      name: 'Alte Schleuse',
      at: at(20, 1200),
      bounds: [at(10, 1190), at(30, 1210)],
      access: BAN,
      advice: 'sup_lock_portage',
      local_check: '2025-06',
    });
    const review = reviewOf(lock, { decision: 'portage', note: 'links umtragen', decided_by: null });
    const input = { candidates: [], reviews: [review], dataKeys: new Set<string>(), complete: true, line: straight };
    expect(single(obstacleEntriesOf(input))).toEqual({
      key: 'lock:way/12',
      refs: ['way/12', 'way/14'],
      kind: 'lock',
      name: 'Alte Schleuse',
      at: at(20, 1200),
      bounds: [at(10, 1190), at(30, 1210)],
      relation: null,
      along_m: null,
      distance_m: null,
      passages: 0,
      access: NO_RULE,
      advice: null,
      portage: 'none',
      local_check: null,
      data_as_of: DATA_AS_OF,
      status: 'gone',
      changed: [],
      basis: null,
      decision: {
        decision: 'portage',
        note: 'links umtragen',
        decided_at: '2026-07-01T10:00:00.000Z',
        decided_by: null,
      },
    });
  });

  it('tells neither gone nor kept while the data is incomplete, but still knows what the route left', () => {
    const entries = obstacleEntriesOf({
      candidates: [],
      reviews: earlier,
      dataKeys: new Set(['way/10']),
      complete: false,
      line: straight,
    });
    expect(entries.map((entry) => [entry.key, entry.status])).toEqual([
      ['way/13', 'unknown'],
      ['way/12', 'unknown'],
      ['way/11', 'off_route'],
      ['way/10', 'off_route'],
    ]);
  });

  it('keeps a portage decision to do until the plan carries round the weir; a pass decided before asks again', () => {
    const crossing = feature('way/40', 'weir', wayThrough([-30, 1000], [30, 1000]));
    const before = single(candidatesOf(straight, [crossing]));
    const after = single(candidatesOf({ ...straight, portages: [carry] }, [crossing]));
    const statusOn = (candidate: ObstacleCandidate, decision: ObstacleDecision) => {
      const [entry] = obstacleEntriesOf({
        candidates: [candidate],
        reviews: [reviewOf(before, { decision })],
        dataKeys: new Set([candidate.key]),
        complete: true,
        line: straight,
      });
      return [entry?.status, entry?.changed];
    };
    expect(statusOn(before, 'portage')).toEqual(['todo', []]);
    expect(statusOn(after, 'portage')).toEqual(['decided', []]);
    expect(statusOn(after, 'pass')).toEqual(['review', ['route']]);
  });
});

describe('paddleCheckSummaryOf', () => {
  const bench: Pick<PaddleCheck, 'data' | 'data_as_of' | 'read_at'> = {
    data: 'covered',
    data_as_of: DATA_AS_OF,
    read_at: '2026-09-03T08:00:00Z',
  };
  const earlier: Partial<TourObstacleEntry> = {
    relation: null,
    along_m: null,
    distance_m: null,
    passages: 0,
    basis: null,
  };

  it('counts open with to do, review with gone, the decided, and every ban on the route whatever was decided', () => {
    const entries = [
      entryOf('way/1', { status: 'decided', access: BAN }),
      entryOf('way/2', { status: 'open', access: PRIVATE_WATER }),
      entryOf('way/3', { status: 'todo', relation: 'near', access: BAN }),
      entryOf('way/4', { status: 'review' }),
      entryOf('way/5', { ...earlier, status: 'gone' }),
      entryOf('way/6', { ...earlier, status: 'kept' }),
      entryOf('way/7', { ...earlier, status: 'off_route', access: BAN }),
      entryOf('way/8', { ...earlier, status: 'unknown' }),
    ];
    const own = [
      ownOf({ conflict: 'private' }),
      ownOf({ kind: 'lock', index: 2 }),
      ownOf({ index: 4, conflict: 'forbidden' }),
    ];
    const summary = paddleCheckSummaryOf(entries, own, bench);
    // Bans: the two on the route, decided or not, and the two conflicting carrying ways; a near ban and an
    // earlier decision off the route do not count, and kept, off_route and unknown count nowhere.
    expect(summary).toEqual({ ...bench, entries: 4, open: 2, review: 2, decided: 1, bans: 4, own: 3 });
    expect(paddleCheckSchema.parse({ ...summary, revision: 'r1' })).toEqual({ ...summary, revision: 'r1' });
  });

  it('counts nothing on an empty checklist and passes the state of the data through', () => {
    const none = { data: 'none', data_as_of: null, read_at: null } as const;
    expect(paddleCheckSummaryOf([], [], none)).toEqual({
      ...none,
      entries: 0,
      open: 0,
      review: 0,
      decided: 0,
      bans: 0,
      own: 0,
    });
  });

  it('keeps a ban in the data on the bench after the paddler decided to pass it', () => {
    const closed = feature('way/50', 'access', wayThrough([5, 1200], [8, 1800]), { tags: { canoe: 'no' } });
    const candidate = single(candidatesOf(straight, [closed], 'kayak'));
    expect(candidate).toMatchObject({ relation: 'on_route', distance_m: 5, along_m: 1200, access: BAN });
    const entries = obstacleEntriesOf({
      candidates: [candidate],
      reviews: [reviewOf(candidate, { decision: 'pass' })],
      dataKeys: new Set(['way/50']),
      complete: true,
      line: straight,
    });
    const own = ownEntriesOf({ line: straight, candidates: [candidate], features: [closed], boat: 'kayak' });
    expect(paddleCheckSummaryOf(entries, own, bench)).toMatchObject({ decided: 1, open: 0, review: 0, bans: 1 });
  });
});

describe('where an object stands', () => {
  it('keeps the place of a line through a node added on it or the way turned round', () => {
    const weir = feature('way/70', 'weir', wayThrough([-20, 1000], [20, 1000]));
    const noded = feature('way/70', 'weir', wayThrough([-20, 1000], [5, 1000], [20, 1000]));
    const turned = feature('way/70', 'weir', wayThrough([20, 1000], [-20, 1000]));
    const [source] = candidatesOf(straight, [weir]).map((candidate) => positionOf(candidate.source));
    for (const other of [noded, turned]) {
      const [moved] = candidatesOf(straight, [other]).map((candidate) => positionOf(candidate.source));
      if (!source || !moved) throw new Error('no candidate');
      expect(gapM(moved, source)).toBeLessThan(1);
    }
  });

  it('keeps an earlier decision about an object beside the route as one still near it, by the object itself', () => {
    // The weir stood 140 m north of the route; the route point of its passage was on the line.
    const review = reviewOf(candidateOf('way/71', { at: at(0, 1000), bounds: [at(140, 1000), at(140, 1000)] }), {
      decided_at: '2026-09-02T08:00:00.000Z',
    });
    const entries = obstacleEntriesOf({
      candidates: [],
      reviews: [review],
      dataKeys: new Set(),
      complete: true,
      line: straight,
    });
    expect(entries.map((entry) => entry.status)).toEqual(['gone']);
    const far = reviewOf(candidateOf('way/72', { at: at(0, 1000), bounds: [at(400, 1000), at(420, 1010)] }), {
      decided_at: '2026-09-02T08:00:00.000Z',
    });
    expect(
      obstacleEntriesOf({ candidates: [], reviews: [far], dataKeys: new Set(), complete: true, line: straight }).map(
        (entry) => entry.status,
      ),
    ).toEqual(['off_route']);
  });
});
