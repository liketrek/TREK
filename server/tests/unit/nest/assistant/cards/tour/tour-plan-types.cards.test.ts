/**
 * ASTCARD-TOUR-080 to ASTCARD-TOUR-088
 *
 * The cards of every tour type besides a hike and a city walk: a proposed
 * bike tour or run (propose_tour) with its profile, time and pace, a held
 * create_tour drawn as its proposal was, a held create_paddle_tour or
 * create_ski_tour drawn as its plan was, the words of each create, the way
 * back from each and what the tours tell the model. Every card goes through
 * the registry's guarded call, so it also fits the shared card union.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { systemPrompt } from '../../../../../../src/nest/assistant/assistant.prompt';
import { loadFor } from '../../../../../../src/nest/assistant/cards/card-context';
import type { PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import {
  answerCardOf,
  ASSISTANT_ARG_POLICY,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
} from '../../../../../../src/nest/assistant/cards/registry';
import { landSportOf } from '../../../../../../src/nest/assistant/cards/tour/tour-route.cards';
import { legArgsOf } from '../../../../../../src/nest/assistant/cards/tour/tour-sport-change.cards';
import { describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { assistantChangePreviewSchema, trekCardSchema, type TourRouteCard, type TrekCard } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

const card = buildTripCard(
  1,
  7,
  { trip: { title: 'Bavaria' }, days: [{ id: 31, day_number: 1, date: '2026-06-11', assignments: [] }] },
  { places: [] },
  null,
);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en-GB', today: '2026-06-01', airport: () => null };

const POINTS = [
  { lat: 47.9, lng: 11.1, name: 'Station' },
  { lat: 47.91, lng: 11.1, name: 'Lake' },
];

/** What propose_tour answers for a gravel ride of 1.1 km. */
function proposal(extra: Record<string, unknown> = {}) {
  return {
    name: 'Lake loop',
    variant_label: null,
    route: { planned: true },
    unreachable: null,
    distance_m: 1112,
    ascent_m: 10,
    descent_m: 0,
    duration_minutes: 5,
    duration_basis: 'router',
    heights_known: true,
    min_ele_m: 600,
    max_ele_m: 610,
    line_geometry: [
      [47.9, 11.1, 600],
      [47.91, 11.1, 610],
    ],
    sac: null,
    high_point: null,
    waypoints: [
      { ...POINTS[0], poi_category: null, at_m: 0, snapped_m: 1, minutes: 0, arrival: null, stage_end: false },
      { ...POINTS[1], poi_category: null, at_m: 1112, snapped_m: 1, minutes: 5, arrival: null, stage_end: false },
    ],
    along: null,
    activity: 'bike',
    bike_profile: 'gravel',
    run_profile: null,
    run_pace_seconds_per_km: null,
    max_hiking_difficulty: null,
    hiking_preferences: null,
    round_trip: false,
    day_id: null,
    date: null,
    start_time: null,
    schedule: null,
    warnings: [],
    ...extra,
  };
}

const input = (tool: string, value: unknown, args: Record<string, unknown> = {}) =>
  [tool, { toolCallId: 'tc-1', args, value, card, today: '2026-06-01' }] as const;

function route(shown: TrekCard | null | undefined): TourRouteCard {
  if (shown?.kind !== 'tourRoute') throw new Error('no route card');
  expect(trekCardSchema.safeParse(shown).success).toBe(true);
  return shown;
}

/** What plan_paddle_route answers for one leg on the river. */
const PADDLE_PLAN = {
  legs: [
    {
      status: 'ok',
      distance_m: 1112,
      snapped_m: { from: 1, to: 1 },
      points: 2,
      segments: [{ kind: 'water', name: 'Isar', source: null, osm_ref: null, from_m: 0, to_m: 1112 }],
      line_geometry: [
        [48.1, 11.6],
        [48.11, 11.6],
      ],
    },
  ],
  graph_rev: 'r1',
};

describe('a proposed bike tour or run', () => {
  it('ASTCARD-TOUR-080: a ride names its profile and its riding time, no hiking limit or grade', () => {
    const shown = route(answerCardOf(...input('propose_tour', proposal())));
    expect(shown).toMatchObject({
      source: 'proposal',
      activity: 'bike',
      routingProfile: 'gravel',
      minutes: 5,
      minutesBasis: 'router',
      limit: null,
      grades: null,
      routed: true,
    });
  });

  it('ASTCARD-TOUR-081: a run names its profile and pace, its time at that pace; one without a pace has none', () => {
    const run = { activity: 'run', bike_profile: null, run_profile: 'trail', run_pace_seconds_per_km: 330 };
    const shown = route(answerCardOf(...input('propose_tour', proposal({ ...run, duration_basis: 'pace' }))));
    expect(shown).toMatchObject({
      activity: 'run',
      routingProfile: 'trail',
      paceSecondsPerKm: 330,
      minutesBasis: 'pace',
    });
    const unpaced = { ...run, run_pace_seconds_per_km: null, duration_minutes: null, duration_basis: null };
    expect(route(answerCardOf(...input('propose_tour', proposal(unpaced))))).toMatchObject({
      paceSecondsPerKm: null,
      minutes: null,
    });
  });

  it('ASTCARD-TOUR-082: a way that was not planned is drawn straight as the ride it is; a hike names no profile', () => {
    const value = proposal({ route: { planned: false, why: 'no_way', position: null } });
    expect(route(answerCardOf(...input('propose_tour', value)))).toMatchObject({
      activity: 'bike',
      routingProfile: 'gravel',
      routed: false,
      problem: { why: 'no_way' },
    });
    expect(landSportOf({}, {})).toBeNull();
    expect(landSportOf({ activity: 'run' }, { run_profile: 'nonsense' })).toEqual({
      activity: 'run',
      routingProfile: 'running',
      paceSecondsPerKm: null,
    });
  });

  it('ASTCARD-TOUR-083: a saved bike tour or run names its profile on its card', () => {
    const saved = {
      tour: {
        place_id: 9,
        name: 'Lake',
        tour_type: 'run',
        distance: 1.1,
        duration: 7,
        run_profile: 'trail',
        run_pace_seconds_per_km: 360,
      },
      waypoints: POINTS,
      line: { preview: proposal().line_geometry },
    };
    expect(route(answerCardOf(...input('get_tour_plan', saved)))).toMatchObject({
      activity: 'run',
      routingProfile: 'trail',
      paceSecondsPerKm: 360,
    });
  });
});

describe('a held new bike tour or run', () => {
  const CREATE = { name: 'Lake loop', activity: 'bike', bike_profile: 'gravel', waypoints: POINTS, day_id: 31 };

  it('ASTCARD-TOUR-084: reads its proposal again and shows its way, on its day, taken back by deleting it', async () => {
    const read = vi.fn(async (tool: string) => (tool === 'propose_tour' ? proposal() : null));
    const loaded = await loadFor('create_tour', CREATE, read);
    expect(read).toHaveBeenCalledWith('propose_tour', {
      along: false,
      name: 'Lake loop',
      activity: 'bike',
      bike_profile: 'gravel',
      waypoints: POINTS,
      day_id: 31,
    });
    const preview = describeToolCall('create_tour', 'tc-2', CREATE, ctx, loaded);
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(preview).toMatchObject({ verbKey: 'addTour', subject: 'Lake loop', dayId: 31, undoable: true });
    expect(preview.effect).toMatchObject({ kind: 'add', dayId: 31 });
    expect(route(preview.card)).toMatchObject({ source: 'pending', activity: 'bike', routingProfile: 'gravel' });
    // Without its plan the points are drawn straight, still as the ride it is.
    const straight = route(describeToolCall('create_tour', 'tc-3', CREATE, ctx, null).card);
    expect(straight).toMatchObject({ activity: 'bike', routingProfile: 'gravel', routed: false, limit: null });
    expect(ASSISTANT_WRITE_TOOLS.create_tour).toEqual({ verbKey: 'addTour', entity: 'tour' });
    expect(ASSISTANT_UNDO_MAP.create_tour?.args({}, { tour: { place_id: 9 } }, null)).toEqual({ placeId: 9 });
  });
});

describe('a held paddle or ski tour', () => {
  const PADDLE = {
    name: 'Isar',
    waypoints: [
      { lat: 48.1, lng: 11.6 },
      { lat: 48.11, lng: 11.6 },
    ],
    water_context: 'river',
    boat_type: 'canoe',
  };

  it('ASTCARD-TOUR-085: a paddle tour reads its plan again with its legs and boat and shows it waiting', async () => {
    const read = vi.fn(async (tool: string) => (tool === 'plan_paddle_route' ? PADDLE_PLAN : null));
    const loaded = await loadFor('create_paddle_tour', PADDLE, read);
    expect(read).toHaveBeenCalledWith('plan_paddle_route', { legs: legArgsOf(PADDLE), boat: 'canoe' });
    const preview = describeToolCall('create_paddle_tour', 'tc-4', PADDLE, ctx, loaded);
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(preview).toMatchObject({ verbKey: 'addTour', subject: 'Isar', undoable: true });
    expect(route(preview.card)).toMatchObject({ source: 'pending', activity: 'kayak', name: 'Isar', routed: true });
    expect(ASSISTANT_UNDO_MAP.create_paddle_tour?.tool).toBe('delete_place');
  });

  it('ASTCARD-TOUR-086: a plan with a failed leg or none at all is drawn straight, planned when the tour is added', async () => {
    const failed = { legs: [{ status: 'failed', code: 'not_on_water', at: null }], graph_rev: null };
    const drawn = route(describeToolCall('create_paddle_tour', 'tc-5', PADDLE, ctx, { plan: failed }).card);
    expect(drawn).toMatchObject({ activity: 'kayak', routed: false, problem: { why: 'not_planned' } });
    const SKI = { ...PADDLE, discipline: 'alpine', water_context: undefined, boat_type: undefined };
    const read = vi.fn(async () => null);
    const loaded = await loadFor('create_ski_tour', SKI, read);
    expect(read).toHaveBeenCalledWith('plan_ski_route', { legs: legArgsOf(SKI), discipline: 'alpine' });
    expect(route(describeToolCall('create_ski_tour', 'tc-6', SKI, ctx, loaded).card)).toMatchObject({
      activity: 'ski',
      routed: false,
    });
    // Too few points draw nothing, and there are no legs to plan.
    expect(await loadFor('create_ski_tour', { name: 'X' }, read)).toBeNull();
  });

  it('ASTCARD-TOUR-087: legs run from each point to the next', () => {
    expect(
      legArgsOf({
        waypoints: [
          { lat: 1, lng: 2 },
          { lat: 3, lng: 4 },
          { lat: 5, lng: 6 },
        ],
      }),
    ).toEqual([
      { from: { lat: 1, lng: 2 }, to: { lat: 3, lng: 4 } },
      { from: { lat: 3, lng: 4 }, to: { lat: 5, lng: 6 } },
    ]);
  });
});

describe('what the tours tell the model about every type', () => {
  it('ASTCARD-TOUR-088: propose_tour draws its line and the prompt names a tool and profile for every type', () => {
    expect(ASSISTANT_ARG_POLICY.propose_tour?.forced).toEqual({ include_geometry: true });
    const every = CARD_PROMPT_LINES.find((line) => line.startsWith('Every tour type'));
    for (const tool of ['propose_tour', 'create_tour', 'create_paddle_tour', 'create_ski_tour', 'plan_ski_route']) {
      expect(every).toContain(tool);
    }
    // The profiles share the planning line: a package may add two prompt lines at most.
    for (const word of ['Profiles:', 'road', 'gravel', 'mtb', 'trail', 'run_pace_seconds_per_km'])
      expect(every).toContain(word);
    for (const line of CARD_PROMPT_LINES) expect(systemPrompt('English')).toContain(line);
  });
});
