/**
 * PAD-06 and PAD-09 contracts: the checklist write (what each op type may
 * carry, the note trimmed and held to 500, each obstacle once, 1 to 100 ops),
 * keys, references and the basis tokens (the longest paddle-check-basis can
 * write among them), the checklist and bench shapes, and the paddle_check and
 * obstacle_check fields of the tours list and the tour detail, which drop a
 * value this build cannot read rather than refuse it. Their cases parse each
 * value with its own schema too, since the catch would hide a contract bug.
 */
import { routeTokenOf, sourceTokenOf, type PaddleCheckLine } from './paddle-check-basis';
import {
  OBSTACLE_DECISIONS,
  PADDLE_CHECK_MAX_ENTRIES,
  ROUTE_TOKEN_MAX,
  obstacleBasisSchema,
  obstacleDecisionRecordSchema,
  obstacleDecisionSchema,
  obstacleEntryStatusSchema,
  obstacleKeySchema,
  obstacleReviewOpSchema,
  obstacleSnapshotSchema,
  osmRefSchema,
  paddleAccessSchema,
  paddleCheckDataSchema,
  paddleCheckSchema,
  routeTokenSchema,
  sourceTokenSchema,
  tourObstacleCheckSchema,
  tourObstacleEntrySchema,
  tourObstacleReviewsRequestSchema,
  tourOwnEntrySchema,
  type ObstacleDecisionRecord,
  type ObstacleReviewOp,
  type ObstacleSnapshot,
  type PaddleCheck,
  type TourObstacleCheck,
  type TourObstacleEntry,
  type TourOwnEntry,
} from './paddle-check.schema';
import {
  tourCreateResponseSchema,
  tourDetailResponseSchema,
  tourListItemSchema,
  tourListResponseSchema,
} from './tours.schema';

import { describe, expect, it } from 'vitest';

type Issue = { path: ReadonlyArray<PropertyKey>; message: string };
type Parsed = { success: true } | { success: false; error: { issues: readonly Issue[] } };
/** Any schema here, as far as these cases use one. */
type Schema = { safeParse(value: unknown): Parsed };

/** Whether a schema reads a value. */
const reads = (schema: Schema, value: unknown): boolean => schema.safeParse(value).success;

/** The issues a schema raises for a value, each as its path and its message; none when it reads. */
function issuesOf(schema: Schema, value: unknown): Array<[string, string]> {
  const result = schema.safeParse(value);
  if (result.success) return [];
  return result.error.issues.map((issue): [string, string] => [issue.path.join('.'), issue.message]);
}

/** References to `count` different nodes. */
const refsOf = (count: number) => Array.from({ length: count }, (_, i) => `node/${i + 1}`);

/** A sample of a route basis 25·k m east of 12.1°E on 49.1°N: carried within 25 m of the lock, paddled beyond. */
const sample = (k: number) => `4910000,${1210000 + 34 * k},${Math.abs(k) <= 1 ? 'p' : 'w'}`;
/** One passage of a route basis: nine samples around it. */
const VISIT = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(sample).join('|');
/** A route basis as the server writes one: on the route, then its one passage. */
const ROUTE = `p1:o:${VISIT}`;
/** A source basis: the hash of the material data, then the position in hundred-thousandths of a degree. */
const SOURCE = 's1:3f9a0c1d2b4e5f60:4910000,1210000';
const BASIS = { route: ROUTE, source: SOURCE };

/** What an object says about paddling when it says nothing. */
const NO_RULE = { value: null, source: null, condition: null, forbidden: false, private: false };

const DECISION: ObstacleDecisionRecord = {
  decision: 'portage',
  note: 'Carry on the left bank',
  decided_at: '2026-10-01T09:30:00.000Z',
  decided_by: 3,
};

/** A lock group on the route, keyed by its smallest member, the paddler's portage round it planned and decided. */
const ENTRY: TourObstacleEntry = {
  key: 'lock:node/4410221',
  refs: ['way/29256405', 'node/4410221'],
  kind: 'lock',
  name: 'Schleuse Regensburg',
  at: [49.1, 12.1],
  bounds: [
    [49.0997, 12.0993],
    [49.1004, 12.1008],
  ],
  relation: 'on_route',
  along_m: 1250,
  distance_m: 0,
  passages: 1,
  access: NO_RULE,
  advice: null,
  portage: 'planned',
  local_check: '2024-05-12',
  data_as_of: '2026-09-30',
  status: 'decided',
  changed: [],
  basis: BASIS,
  decision: DECISION,
};

/** A weir decided earlier that the data no longer holds: no relation, no basis, its decision kept. */
const EARLIER: TourObstacleEntry = {
  ...ENTRY,
  key: 'way/31337',
  refs: ['way/31337'],
  kind: 'weir',
  name: null,
  relation: null,
  along_m: null,
  distance_m: null,
  passages: 0,
  portage: 'none',
  local_check: null,
  status: 'gone',
  basis: null,
  decision: { ...DECISION, decision: 'pass', note: null, decided_by: null },
};

/** The paddler's own portage round that lock. */
const OWN: TourOwnEntry = {
  kind: 'portage',
  index: 2,
  from_m: 1180,
  to_m: 1320,
  at: [49.1001, 12.0999],
  bounds: [
    [49.0998, 12.0991],
    [49.1003, 12.1009],
  ],
  covers: ['lock:node/4410221'],
  bypassed: false,
  advice: null,
  conflict: null,
};

/** The bench of that checklist: the lock decided, the weir gone from the data, the one portage. */
const BENCH: PaddleCheck = {
  data: 'covered',
  data_as_of: '2026-09-30',
  read_at: '2026-10-02T04:00:00.000Z',
  entries: 1,
  open: 0,
  review: 1,
  decided: 1,
  bans: 0,
  own: 1,
  revision: '9b1c6e0d4a7f2358',
};

const CHECK: TourObstacleCheck = {
  revision: '9b1c6e0d4a7f2358',
  evaluated_at: '2026-10-16T08:00:00.000Z',
  entries: [ENTRY, EARLIER],
  own: [OWN],
};

/** What a decision about the lock keeps of it. */
const SNAPSHOT: ObstacleSnapshot = {
  v: 1,
  kind: 'lock',
  name: 'Schleuse Regensburg',
  refs: ENTRY.refs,
  at: ENTRY.at,
  bounds: ENTRY.bounds,
  relation: 'on_route',
  along_m: 1250,
  region_id: 'oberpfalz',
  data_as_of: '2026-09-30',
};

/** A paddle tour as the tours list carries it, without a bench. */
const PADDLE_TOUR = {
  place_id: 7,
  tour_type: 'kayak',
  distance: 12.4,
  elevation_gain: null,
  elevation_loss: null,
  duration: null,
  difficulty: null,
  wanderer_ref: null,
  match_confidence: null,
  max_hiking_difficulty: null,
  boat_type: 'kayak',
  water_context: 'river',
  name: 'Regen from Roding',
  planned: true,
  caution: false,
  has_waypoints: true,
  origin: 'trek',
};
const HIKE = { ...PADDLE_TOUR, tour_type: 'hike', max_hiking_difficulty: 2, boat_type: null, water_context: null };

/** The detail of that paddle tour, its bench included, without a checklist. */
const DETAIL = {
  tour: { ...PADDLE_TOUR, paddle_check: BENCH },
  waypoints: [
    { lat: 49.1, lng: 12.08, role: 'start', sequence: 0 },
    { lat: 49.1, lng: 12.25, role: 'end', sequence: 1 },
  ],
};

/** An op on a weir with nothing set but its type; each case adds what it carries. */
function op(type: ObstacleReviewOp['op'], extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { key: 'way/29256405', op: type, decision: null, note: null, basis: null, ...extra };
}

const NEEDS_BASIS = 'a decision needs its choice and its basis';
const ONLY_DECIDE = 'only a decision carries a choice and a basis';
const NO_NOTE = 'removing or keeping a decision carries no note';

describe('the closed lists', () => {
  it('names the four decisions, the eight entry states and the five data states', () => {
    expect(OBSTACLE_DECISIONS).toEqual(['pass', 'portage', 'reroute', 'not_affected']);
    expect(obstacleDecisionSchema.options).toEqual([...OBSTACLE_DECISIONS]);
    expect(reads(obstacleDecisionSchema, 'skip')).toBe(false);
    expect(obstacleEntryStatusSchema.options).toEqual([
      'open',
      'decided',
      'todo',
      'review',
      'gone',
      'kept',
      'off_route',
      'unknown',
    ]);
    expect(paddleCheckDataSchema.options).toEqual(['covered', 'partial', 'none', 'limited', 'unavailable']);
  });
});

describe('obstacle keys and references', () => {
  it('a key names one object, or a lock by its smallest member; a reference names an object only', () => {
    for (const key of ['node/1', 'way/29256405', 'lock:way/29256405', `node/${'9'.repeat(15)}`]) {
      expect(reads(obstacleKeySchema, key)).toBe(true);
    }
    for (const key of [
      '',
      'relation/5',
      'lock:relation/5',
      'lock:lock:node/1',
      'lock:',
      'node/',
      `node/${'9'.repeat(16)}`,
      'Node/1',
      'node/-1',
      'node/1 ',
    ]) {
      expect(reads(obstacleKeySchema, key)).toBe(false);
    }
    expect(reads(osmRefSchema, 'way/29256405')).toBe(true);
    for (const ref of ['lock:way/29256405', 'relation/5', 'way/', 'way/1/2']) {
      expect(reads(osmRefSchema, ref)).toBe(false);
    }
  });
});

describe('the basis tokens', () => {
  it('a route basis is its version, its relation, then nine samples per passage, passages apart by semicolons', () => {
    const nearStart = `p1:n:_|_|_|_|${[0, 1, 2, 3, 4].map(sample).join('|')}`;
    for (const token of [ROUTE, nearStart, `${ROUTE};${VISIT}`, 'p1:o:-3386000,-15120000,w']) {
      expect(reads(routeTokenSchema, token)).toBe(true);
    }
  });

  it('refuses a route basis of another version, relation or alphabet, an empty one and one past the limit', () => {
    const atMax = `p1:o:${'_'.repeat(ROUTE_TOKEN_MAX - 5)}`;
    expect(atMax).toHaveLength(ROUTE_TOKEN_MAX);
    expect(reads(routeTokenSchema, atMax)).toBe(true);
    for (const token of [
      `${atMax}_`,
      '',
      'p1:o:',
      'p2:o:_',
      'p1:x:_',
      'P1:o:_',
      ' p1:o:_',
      'p1:o:_\n',
      'p1:o:4910000,1210000,c',
      'p1:o:49.1,12.1,w',
      'p1:o:4910000 1210000,w',
    ]) {
      expect(reads(routeTokenSchema, token)).toBe(false);
    }
  });

  it('a source basis is a hash of 16 hex digits and the position in hundred-thousandths of a degree, or gone', () => {
    for (const token of [
      SOURCE,
      'gone',
      's1:0123456789abcdef:-3386000,-15120000',
      's1:0123456789abcdef:-9000000,-18000000',
    ]) {
      expect(reads(sourceTokenSchema, token)).toBe(true);
    }
    for (const token of [
      '',
      'Gone',
      'gone ',
      's1:0123456789ABCDEF:4910000,1210000',
      's1:0123456789abcde:4910000,1210000',
      's1:0123456789abcdef0:4910000,1210000',
      's1:0123456789abcdef',
      's1:0123456789abcdef:4910000',
      's2:0123456789abcdef:4910000,1210000',
      's1:0123456789abcdef:49.1,12.1',
      's1:0123456789abcdef:+4910000,1210000',
      's1:0123456789abcdef:12345678,1210000',
      's1:0123456789abcdef:4910000,123456789',
    ]) {
      expect(reads(sourceTokenSchema, token)).toBe(false);
    }
  });

  it('a basis carries both tokens, each in its place', () => {
    expect(obstacleBasisSchema.parse(BASIS)).toEqual(BASIS);
    expect(reads(obstacleBasisSchema, { route: ROUTE, source: 'gone' })).toBe(true);
    expect(reads(obstacleBasisSchema, { route: SOURCE, source: ROUTE })).toBe(false);
    expect(reads(obstacleBasisSchema, { route: ROUTE })).toBe(false);
  });

  it('reads the tokens paddle-check-basis writes, up to the longest route basis there can be', () => {
    // 850 m along 89.12345°S from 179.5°W: every sample has a sign and all the digits a position can have.
    const line: PaddleCheckLine = {
      points: [
        [-89.12345, -179.5],
        [-89.12345, -179],
      ],
      alongM: [0, 850],
      totalM: 850,
      portages: [{ fromM: 280, toM: 320, index: 1 }],
      locks: [],
    };
    const longest = routeTokenOf(line, [150, 300, 450, 600], 'on_route');
    // `p1:o:`, then four passages of nine samples such as `-8912345,-17947059,w`, 20 characters each.
    expect(longest).toHaveLength(5 + 4 * (9 * 20 + 8) + 3);
    expect(longest.length).toBeLessThanOrEqual(ROUTE_TOKEN_MAX);
    expect(reads(routeTokenSchema, longest)).toBe(true);
    // A passage at the start: the four samples before it lie beyond the line.
    const atStart = routeTokenOf(line, [0], 'near');
    expect(atStart).toMatch(/^p1:n:(_\|){4}-8912345,-17950000,w\|/);
    expect(reads(routeTokenSchema, atStart)).toBe(true);
    const positions: Array<[number, number]> = [
      [-89.12345, -179.12345],
      [90, 180],
      [-90, -180],
    ];
    for (const at of positions) {
      expect(reads(sourceTokenSchema, sourceTokenOf('0123456789abcdef', at))).toBe(true);
    }
  });
});

describe('obstacleReviewOpSchema', () => {
  const opIssues = (value: unknown) => issuesOf(obstacleReviewOpSchema, value);

  it('a decision carries its choice and the basis the user saw, and a note if it likes', () => {
    const decide = op('decide', { decision: 'portage', basis: BASIS, note: '  Carry on the left bank ' });
    expect(obstacleReviewOpSchema.parse(decide)).toEqual({ ...decide, note: 'Carry on the left bank' });
    expect(opIssues(op('decide', { decision: 'not_affected', basis: BASIS }))).toEqual([]);
  });

  it('refuses a decision without its choice or without its basis', () => {
    expect(opIssues(op('decide', { basis: BASIS }))).toEqual([['decision', NEEDS_BASIS]]);
    expect(opIssues(op('decide', { decision: 'pass' }))).toEqual([['decision', NEEDS_BASIS]]);
    expect(opIssues(op('decide'))).toEqual([['decision', NEEDS_BASIS]]);
  });

  it('a note op changes only the note, to a text or to none, and carries no choice or basis', () => {
    expect(opIssues(op('note', { note: 'Ask the lock keeper first' }))).toEqual([]);
    expect(opIssues(op('note'))).toEqual([]);
    expect(opIssues(op('note', { note: 'Low water', decision: 'pass' }))).toEqual([['decision', ONLY_DECIDE]]);
    expect(opIssues(op('note', { note: 'Low water', basis: BASIS }))).toEqual([['decision', ONLY_DECIDE]]);
  });

  it('clearing or keeping a decision carries nothing but the key', () => {
    for (const type of ['clear', 'keep'] as const) {
      expect(opIssues(op(type))).toEqual([]);
      expect(opIssues(op(type, { note: 'Not needed' }))).toEqual([['note', NO_NOTE]]);
      expect(opIssues(op(type, { decision: 'pass', basis: BASIS }))).toEqual([['decision', ONLY_DECIDE]]);
      expect(opIssues(op(type, { decision: 'pass', basis: BASIS, note: 'x' }))).toEqual([
        ['decision', ONLY_DECIDE],
        ['note', NO_NOTE],
      ]);
    }
  });

  it('trims the note and holds what is left to 500 characters', () => {
    const padded = obstacleReviewOpSchema.parse(op('note', { note: `  ${'a'.repeat(500)}\n` }));
    expect(padded.note).toBe('a'.repeat(500));
    expect(opIssues(op('note', { note: 'a'.repeat(501) }))).toEqual([['note', expect.any(String)]]);
  });

  it('refuses an unknown op, a key that names no object, an unknown choice, a broken basis and a missing field', () => {
    for (const value of [
      op('clear', { op: 'delete' }),
      op('clear', { key: 'relation/5' }),
      op('decide', { decision: 'skip', basis: BASIS }),
      op('decide', { decision: 'pass', basis: { route: ROUTE, source: 's1:nothex:1,1' } }),
      op('decide', { decision: 'pass', basis: { route: ROUTE } }),
      { key: 'way/29256405', op: 'clear' },
    ]) {
      expect(reads(obstacleReviewOpSchema, value)).toBe(false);
    }
  });
});

describe('tourObstacleReviewsRequestSchema', () => {
  const requestIssues = (value: unknown) => issuesOf(tourObstacleReviewsRequestSchema, value);
  /** One clear op on each of `count` different obstacles. */
  const ops = (count: number) => refsOf(count).map((key) => op('clear', { key }));

  it('takes 1 to 100 ops', () => {
    expect(requestIssues({ ops: ops(1) })).toEqual([]);
    expect(requestIssues({ ops: ops(100) })).toEqual([]);
    for (const value of [{ ops: [] }, { ops: ops(101) }, {}]) {
      expect(reads(tourObstacleReviewsRequestSchema, value)).toBe(false);
    }
  });

  it('takes each obstacle at most once, a lock group and one of its members being two', () => {
    const twice = [op('decide', { decision: 'pass', basis: BASIS }), op('note', { note: 'Low water' })];
    expect(requestIssues({ ops: twice })).toEqual([['ops', 'each obstacle at most once']]);
    expect(requestIssues({ ops: [op('clear', { key: 'lock:way/29256405' }), op('clear')] })).toEqual([]);
  });

  it('names an op that breaks its own rule by its place in the list', () => {
    const list = [op('clear', { key: 'way/1' }), op('decide', { key: 'way/2' })];
    expect(requestIssues({ ops: list })).toEqual([['ops.1.decision', NEEDS_BASIS]]);
  });
});

describe('the checklist shapes', () => {
  it('access reads what the tags say about paddling there, canoe read first', () => {
    const ban = { value: 'no', source: 'canoe', condition: null, forbidden: true, private: false };
    expect(paddleAccessSchema.parse(ban)).toEqual(ban);
    expect(paddleAccessSchema.parse(NO_RULE)).toEqual(NO_RULE);
    for (const broken of [{ source: 'motorboat' }, { forbidden: 'yes' }, { condition: 3 }]) {
      expect(reads(paddleAccessSchema, { ...ban, ...broken })).toBe(false);
    }
    expect(reads(paddleAccessSchema, { value: 'no', source: 'canoe', condition: null, forbidden: true })).toBe(false);
  });

  it('a decision record keeps the choice, the note, when and by whom', () => {
    expect(obstacleDecisionRecordSchema.parse(DECISION)).toEqual(DECISION);
    expect(reads(obstacleDecisionRecordSchema, { ...DECISION, note: null, decided_by: null })).toBe(true);
    for (const broken of [{ decision: 'skip' }, { decided_by: 1.5 }, { decided_at: null }]) {
      expect(reads(obstacleDecisionRecordSchema, { ...DECISION, ...broken })).toBe(false);
    }
  });

  it('an entry on the route, a near one and an earlier decision the route no longer meets all read', () => {
    expect(tourObstacleEntrySchema.parse(ENTRY)).toEqual(ENTRY);
    expect(tourObstacleEntrySchema.parse(EARLIER)).toEqual(EARLIER);
    const near = { ...ENTRY, relation: 'near', distance_m: 140, status: 'open', basis: BASIS, decision: null };
    expect(reads(tourObstacleEntrySchema, near)).toBe(true);
  });

  it('holds an entry to 1 to 30 references, 0 to 4 passages, two changes at most and its closed lists', () => {
    const widest = { ...ENTRY, refs: refsOf(30), passages: 4, changed: ['route', 'source'] };
    expect(reads(tourObstacleEntrySchema, widest)).toBe(true);
    expect(reads(tourObstacleEntrySchema, { ...ENTRY, passages: 0 })).toBe(true);
    for (const broken of [
      { key: 'relation/5' },
      { refs: [] },
      { refs: refsOf(31) },
      { refs: ['lock:node/4410221'] },
      { passages: 5 },
      { passages: -1 },
      { passages: 1.5 },
      { changed: ['route', 'source', 'route'] },
      { changed: ['name'] },
      { relation: 'far' },
      { status: 'cleared' },
      { kind: 'bridge' },
      { portage: 'maybe' },
      { advice: 'portage' },
      { at: [49.1] },
      { at: [49.1, Number.POSITIVE_INFINITY] },
      { bounds: [[49.1, 12.1]] },
      { access: { ...NO_RULE, source: 'motorboat' } },
    ]) {
      expect(reads(tourObstacleEntrySchema, { ...ENTRY, ...broken })).toBe(false);
    }
  });

  it('an own portage and an own lock read, each covering 30 obstacles at most', () => {
    const lock: TourOwnEntry = {
      ...OWN,
      kind: 'lock',
      index: null,
      from_m: 2400,
      to_m: 2400,
      covers: [],
      advice: 'sup_lock_portage',
    };
    expect(tourOwnEntrySchema.parse(OWN)).toEqual(OWN);
    expect(tourOwnEntrySchema.parse(lock)).toEqual(lock);
    expect(reads(tourOwnEntrySchema, { ...OWN, covers: refsOf(30), conflict: 'private' })).toBe(true);
    for (const broken of [
      { covers: refsOf(31) },
      { covers: ['relation/5'] },
      { conflict: 'closed' },
      { kind: 'weir' },
      { index: 1.5 },
      { bypassed: null },
      { advice: 'portage' },
    ]) {
      expect(reads(tourOwnEntrySchema, { ...OWN, ...broken })).toBe(false);
    }
  });

  it('the bench counts in whole numbers from 0 and carries a revision of 1 to 64 characters', () => {
    expect(paddleCheckSchema.parse(BENCH)).toEqual(BENCH);
    const unread = { ...BENCH, data: 'unavailable', data_as_of: null, read_at: null, revision: 'r'.repeat(64) };
    expect(reads(paddleCheckSchema, unread)).toBe(true);
    for (const field of ['entries', 'open', 'review', 'decided', 'bans', 'own'] as const) {
      expect(reads(paddleCheckSchema, { ...BENCH, [field]: 0 })).toBe(true);
      expect(reads(paddleCheckSchema, { ...BENCH, [field]: -1 })).toBe(false);
      expect(reads(paddleCheckSchema, { ...BENCH, [field]: 1.5 })).toBe(false);
    }
    for (const broken of [{ revision: '' }, { revision: 'r'.repeat(65) }, { data: 'stale' }, { read_at: 0 }]) {
      expect(reads(paddleCheckSchema, { ...BENCH, ...broken })).toBe(false);
    }
  });

  it('a checklist carries at most PADDLE_CHECK_MAX_ENTRIES entries and 100 own ones', () => {
    expect(tourObstacleCheckSchema.parse(CHECK)).toEqual(CHECK);
    expect(reads(tourObstacleCheckSchema, { ...CHECK, entries: [], own: [] })).toBe(true);
    const entries = refsOf(PADDLE_CHECK_MAX_ENTRIES).map((ref) => ({ ...ENTRY, key: ref, refs: [ref] }));
    const own = Array.from({ length: 100 }, () => OWN);
    expect(reads(tourObstacleCheckSchema, { ...CHECK, entries, own })).toBe(true);
    expect(reads(tourObstacleCheckSchema, { ...CHECK, entries: [...entries, ENTRY] })).toBe(false);
    expect(reads(tourObstacleCheckSchema, { ...CHECK, own: [...own, OWN] })).toBe(false);
    expect(reads(tourObstacleCheckSchema, { ...CHECK, revision: '' })).toBe(false);
    expect(reads(tourObstacleCheckSchema, { ...CHECK, entries: [{ ...ENTRY, status: 'cleared' }] })).toBe(false);
  });

  it('a snapshot keeps what a decision was about, taken while the obstacle met the route', () => {
    expect(obstacleSnapshotSchema.parse(SNAPSHOT)).toEqual(SNAPSHOT);
    expect(reads(obstacleSnapshotSchema, { ...SNAPSHOT, name: null, region_id: null, data_as_of: null })).toBe(true);
    for (const broken of [{ v: 2 }, { relation: null }, { along_m: null }, { refs: [] }, { kind: 'bridge' }]) {
      expect(reads(obstacleSnapshotSchema, { ...SNAPSHOT, ...broken })).toBe(false);
    }
  });
});

describe('tourListItemSchema: paddle_check (PAD-09)', () => {
  it('a hike carries no bench and reads exactly as before', () => {
    expect(tourListItemSchema.parse(HIKE)).toStrictEqual(HIKE);
  });

  it('a paddle tour carries its bench, null while it has no line, or none in a list cached before it', () => {
    const withBench = { ...PADDLE_TOUR, paddle_check: BENCH };
    expect(paddleCheckSchema.parse(BENCH)).toEqual(BENCH);
    expect(tourListItemSchema.parse(withBench)).toStrictEqual(withBench);
    expect(tourListItemSchema.parse({ ...PADDLE_TOUR, paddle_check: null }).paddle_check).toBeNull();
    expect(tourListItemSchema.parse(PADDLE_TOUR)).not.toHaveProperty('paddle_check');
  });

  it('drops a bench this build cannot read and keeps the tour', () => {
    for (const unreadable of [
      { ...BENCH, data: 'stale' },
      { ...BENCH, open: -1 },
      { ...BENCH, revision: '' },
      { ...BENCH, bans: undefined },
      'covered',
      42,
    ]) {
      expect(reads(paddleCheckSchema, unreadable)).toBe(false);
      const parsed = tourListItemSchema.parse({ ...PADDLE_TOUR, paddle_check: unreadable });
      expect(parsed.paddle_check).toBeUndefined();
      expect(parsed).toEqual(PADDLE_TOUR);
    }
    const stale = { ...PADDLE_TOUR, paddle_check: { ...BENCH, data: 'stale' } };
    expect(tourListResponseSchema.parse({ tours: [HIKE, stale] }).tours).toEqual([HIKE, PADDLE_TOUR]);
  });

  it('still refuses a tour whose own fields do not read', () => {
    expect(reads(tourListItemSchema, { ...PADDLE_TOUR, planned: 'yes', paddle_check: BENCH })).toBe(false);
  });
});

describe('tourCreateResponseSchema: obstacle_check (PAD-06)', () => {
  it('is the detail response too', () => {
    expect(tourDetailResponseSchema).toBe(tourCreateResponseSchema);
  });

  it('keeps a checklist that reads, and a detail without one reads as before', () => {
    const withCheck = { ...DETAIL, obstacle_check: CHECK };
    expect(tourObstacleCheckSchema.parse(CHECK)).toEqual(CHECK);
    expect(tourCreateResponseSchema.parse(withCheck)).toStrictEqual(withCheck);
    expect(tourCreateResponseSchema.parse(DETAIL)).toStrictEqual(DETAIL);
  });

  it('drops a checklist this build cannot read and keeps the detail', () => {
    for (const unreadable of [
      { ...CHECK, entries: [{ ...ENTRY, status: 'cleared' }] },
      { ...CHECK, own: [{ ...OWN, kind: 'ferry' }] },
      { ...CHECK, revision: '' },
      null,
      'v2',
    ]) {
      expect(reads(tourObstacleCheckSchema, unreadable)).toBe(false);
      const parsed = tourCreateResponseSchema.parse({ ...DETAIL, obstacle_check: unreadable });
      expect(parsed.obstacle_check).toBeUndefined();
      expect(parsed).toEqual(DETAIL);
    }
  });

  it('still refuses a detail whose own fields do not read', () => {
    expect(reads(tourCreateResponseSchema, { ...DETAIL, waypoints: null, obstacle_check: CHECK })).toBe(false);
  });
});
