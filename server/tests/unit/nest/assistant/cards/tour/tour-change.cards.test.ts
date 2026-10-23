/**
 * ASTCARD-TOUR-030 to ASTCARD-TOUR-043
 *
 * The tours inside the change cards: what a held create_hike, create_city_walk
 * and update_tour look up (through a fake reader, as the turn's memo hands
 * it) and the card each shows, the day a hike lands on, the words of the
 * writes, the way back from a tour taken over or imported, and what the
 * package sets for the model: the planning tools always asked for their line,
 * a saved tour's line in brief kept from the provider, its prompt lines.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { toolOutputForProvider } from '../../../../../../src/nest/assistant/assistant-output';
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import { systemPrompt } from '../../../../../../src/nest/assistant/assistant.prompt';
import { loadFor } from '../../../../../../src/nest/assistant/cards/card-context';
import type { PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import {
  appliedCardOf,
  ASSISTANT_ARG_POLICY,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  PROJECTIONS,
} from '../../../../../../src/nest/assistant/cards/registry';
import { planArgsOf, replans } from '../../../../../../src/nest/assistant/cards/tour/tour-change.cards';
import { describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { assistantChangePreviewSchema, trekCardSchema, type TourRouteCard } from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

const card = buildTripCard(
  1,
  7,
  {
    trip: { title: 'Bavaria' },
    days: [
      { id: 31, day_number: 1, date: '2026-06-11', assignments: [] },
      { id: 32, day_number: 2, date: '2026-06-12', title: 'Mountains', assignments: [] },
    ],
  },
  { places: [{ id: 61, name: 'Hut walk', lat: 47.6, lng: 11.3 }] },
  null,
);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en-GB', today: '2026-06-01', airport: () => null };

const POINTS = [
  { lat: 47.6, lng: 11.3, name: 'Car park' },
  { lat: 47.61, lng: 11.3, name: 'Summit', poi_category: 'peak' },
];
const CREATE = {
  name: 'Herzogstand',
  description: 'Up from the car park',
  waypoints: POINTS,
  max_hiking_difficulty: 3,
  planned_duration_minutes: 300,
  day_id: 32,
  start_time: '08:00',
};

/** What propose_hike answers for the two points: a routed way of 1.1 km. */
const PROPOSAL = {
  name: 'Herzogstand',
  variant_label: 'the short one',
  route: { planned: true },
  distance_m: 1112,
  ascent_m: 80,
  descent_m: 0,
  duration_minutes: 22,
  duration_basis: 'din33466',
  min_ele_m: 800,
  max_ele_m: 880,
  line_geometry: [
    [47.6, 11.3, 800],
    [47.61, 11.3, 880],
  ],
  sac: { segments: [], highest: 2, unknown_share: 0 },
  high_point: null,
  waypoints: [
    { ...POINTS[0], poi_category: null, at_m: 0, minutes: 0, arrival: '08:00' },
    { ...POINTS[1], at_m: 1112, minutes: 22, arrival: '08:22' },
  ],
  along: null,
  max_hiking_difficulty: 3,
  schedule: null,
  warnings: [],
};

/** What get_tour_plan answers for the saved hike 61: limit T3, steps avoided, a line in brief. */
const SAVED = {
  tour: {
    place_id: 61,
    name: 'Hut walk',
    tour_type: 'hike',
    distance: 2.5,
    elevation_gain: 300,
    duration: 75,
    max_hiking_difficulty: 3,
    hiking_preferences: { avoid_steps: true },
  },
  waypoints: [
    { lat: 47.6, lng: 11.3, role: 'start' },
    { lat: 47.62, lng: 11.31, role: 'end' },
  ],
  line: {
    point_count: 400,
    has_heights: true,
    preview: [
      [47.6, 11.3, 800],
      [47.61, 11.305, 950],
      [47.62, 11.31, 1100],
    ],
  },
};

/** A reader that answers each tool from `answers` and records what it was asked. */
function reader(answers: Record<string, unknown>) {
  return vi.fn(async (tool: string, _args?: Record<string, unknown>) => answers[tool] ?? null);
}

function route(preview: { card?: unknown }): TourRouteCard {
  const shown = preview.card as TourRouteCard | undefined;
  if (shown?.kind !== 'tourRoute') throw new Error('no route card');
  expect(trekCardSchema.safeParse(shown).success).toBe(true);
  return shown;
}

describe('a held new hike', () => {
  it('ASTCARD-TOUR-030: reads the proposal of the same points and shows its way, named as the change names it', async () => {
    const read = reader({ propose_hike: PROPOSAL });
    const loaded = await loadFor('create_hike', CREATE, read);
    expect(read).toHaveBeenCalledWith('propose_hike', {
      along: false,
      name: 'Herzogstand',
      waypoints: POINTS,
      max_hiking_difficulty: 3,
      day_id: 32,
      start_time: '08:00',
    });
    const preview = describeToolCall('create_hike', 'tc-1', CREATE, ctx, loaded);
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(preview).toMatchObject({ verbKey: 'addTour', subject: 'Herzogstand', dayId: 32, undoable: true });
    const day = 'Fri 12 Jun, Mountains, 08:00';
    expect(preview.rows).toContainEqual({ op: 'add', labelKey: 'day', before: null, after: day });
    expect(preview.effect).toEqual({
      kind: 'add',
      dayId: 32,
      fromDayId: null,
      placeId: null,
      assignmentId: null,
      place: { name: 'Herzogstand', lat: 47.6, lng: 11.3, categoryId: null },
    });
    expect(route(preview)).toMatchObject({
      source: 'pending',
      name: 'Herzogstand',
      label: null,
      routed: true,
      distanceM: 1112,
    });
  });

  it('ASTCARD-TOUR-031: without a plan the points are drawn straight, planned once the hike is added', async () => {
    const failed = await loadFor('create_hike', { ...CREATE, round_trip: true }, reader({}));
    const straight = route(describeToolCall('create_hike', 'tc-2', { ...CREATE, round_trip: true }, ctx, failed));
    expect(straight).toMatchObject({ routed: false, problem: { why: 'not_planned' }, limit: 3 });
    // A round trip is drawn back to its start.
    expect(straight.stops.map((stop) => stop.role)).toEqual(['start', 'via', 'end']);
    // The planner's own refusal is shown as it is; a router that did not answer saves the points, planned later.
    const refused = { plan: { route: { planned: false, why: 'no_way', position: null } }, saved: null };
    expect(route(describeToolCall('create_hike', 'tc-3', CREATE, ctx, refused)).problem?.why).toBe('no_way');
    const down = { plan: { route: { planned: false, why: 'router_unavailable', position: null } }, saved: null };
    expect(route(describeToolCall('create_hike', 'tc-4', CREATE, ctx, down)).problem?.why).toBe('not_planned');
    // Too few points draw nothing; the words still stand.
    expect(describeToolCall('create_hike', 'tc-5', { name: 'Odd' }, ctx, null)).not.toHaveProperty('card');
  });

  it('ASTCARD-TOUR-032: the plan it reads leaves out what the change card does not show', () => {
    expect(planArgsOf({ ...CREATE, round_trip: true, hiking_preferences: null })).toEqual({
      along: false,
      name: 'Herzogstand',
      waypoints: POINTS,
      max_hiking_difficulty: 3,
      hiking_preferences: null,
      round_trip: true,
      day_id: 32,
      start_time: '08:00',
    });
  });

  it('ASTCARD-TOUR-033: lands on its day at its first point; without a day of this trip it touches no day', () => {
    const { day_id: _day, ...free } = CREATE;
    expect(describeToolCall('create_hike', 'tc-6', free, ctx, null).effect).toBeNull();
    expect(describeToolCall('create_hike', 'tc-7', { ...CREATE, day_id: 99 }, ctx, null)).toMatchObject({
      effect: null,
      dayId: null,
    });
    const nameless = describeToolCall('create_hike', 'tc-8', { ...CREATE, name: ' ' }, ctx, null);
    expect(nameless.effect).toMatchObject({ kind: 'add', dayId: 32, place: null });
  });
});

describe('an applied new tour', () => {
  it('ASTCARD-TOUR-042: keeps the card the change showed, now naming the tour it created', async () => {
    const loaded = await loadFor('create_hike', CREATE, reader({ propose_hike: PROPOSAL }));
    const preview = describeToolCall('create_hike', 'tc-14', CREATE, ctx, loaded);
    const created = { tour: { place_id: 64, name: 'Herzogstand' }, assignment: { id: 305, day_id: 32 } };
    const applied = appliedCardOf('create_hike', { args: CREATE, result: created, preview });
    expect(applied).toEqual({ ...route(preview), placeId: 64 });
    expect(appliedCardOf('create_city_walk', { args: {}, result: created, preview: null })).toBeNull();
    expect(appliedCardOf('create_hike', { args: CREATE, result: 'Tour not found.', preview })).toBeNull();
  });

  it('ASTCARD-TOUR-043: an applied change of a saved hike keeps its new way beside the receipt', async () => {
    const moved = { placeId: 61, expected_revision: 2, waypoints: POINTS };
    const loaded = await loadFor('update_tour', moved, reader({ get_tour_plan: SAVED, propose_hike: PROPOSAL }));
    const preview = describeToolCall('update_tour', 'tc-15', moved, ctx, loaded);
    const saved = { ...SAVED, tour: { ...SAVED.tour, revision: 3 }, replanned: true, route: { planned: true } };
    const applied = appliedCardOf('update_tour', { args: moved, result: saved, preview });
    expect(applied).toEqual({ ...route(preview), placeId: 61 });
    expect(applied).toMatchObject({ routed: true, previous: { distanceM: 2500 } });
    expect(appliedCardOf('update_tour', { args: moved, result: 'Tour not found.', preview })).toBeNull();
  });
});

describe('a held new city walk', () => {
  it('ASTCARD-TOUR-034: shows its stations straight with their stays; the way on foot is planned on save', async () => {
    const args = {
      name: 'Old town',
      stations: [
        { lat: 48.137, lng: 11.575, name: 'Marienplatz', stay_minutes: 0 },
        { lat: 48.14, lng: 11.58, name: 'Museum', stay_minutes: 60 },
      ],
    };
    expect(await loadFor('create_city_walk', args, reader({}))).toBeNull();
    const shown = route(describeToolCall('create_city_walk', 'tc-9', args, ctx, null));
    expect(shown).toMatchObject({ activity: 'walk', name: 'Old town', routed: false, problem: { why: 'not_planned' } });
    expect(shown.stops.map((stop) => [stop.kind, stop.name, stop.stayMinutes])).toEqual([
      ['station', 'Marienplatz', 0],
      ['station', 'Museum', 60],
    ]);
  });
});

describe('a held change of a saved hike', () => {
  const MOVED = { placeId: 61, expected_revision: 2, waypoints: POINTS };

  it('ASTCARD-TOUR-035: plans the new way under the saved limit and preferences and shows the old way beside it', async () => {
    const read = reader({ get_tour_plan: SAVED, propose_hike: PROPOSAL });
    const loaded = await loadFor('update_tour', MOVED, read);
    expect(read).toHaveBeenNthCalledWith(1, 'get_tour_plan', { placeId: 61 });
    expect(read).toHaveBeenNthCalledWith(2, 'propose_hike', {
      name: 'Hut walk',
      waypoints: POINTS,
      max_hiking_difficulty: 3,
      hiking_preferences: { avoid_steps: true },
      along: false,
    });
    const shown = route(describeToolCall('update_tour', 'tc-10', MOVED, ctx, loaded));
    expect(shown).toMatchObject({ source: 'pending', placeId: 61, name: 'Hut walk', routed: true, distanceM: 1112 });
    expect(shown.previous).toEqual({
      line: [
        [47.6, 11.3],
        [47.61, 11.305],
        [47.62, 11.31],
      ],
      distanceM: 2500,
      ascentM: 300,
      minutes: 75,
    });
  });

  it('ASTCARD-TOUR-036: a new limit alone replans through the saved points; a new name alone draws nothing', async () => {
    const read = reader({ get_tour_plan: SAVED, propose_hike: PROPOSAL });
    await loadFor('update_tour', { placeId: 61, expected_revision: 2, max_hiking_difficulty: 4 }, read);
    expect(read).toHaveBeenLastCalledWith('propose_hike', {
      name: 'Hut walk',
      waypoints: [
        { lat: 47.6, lng: 11.3 },
        { lat: 47.62, lng: 11.31 },
      ],
      max_hiking_difficulty: 4,
      hiking_preferences: { avoid_steps: true },
      along: false,
    });
    const renamed = { placeId: 61, expected_revision: 2, name: 'Ridge' };
    const named = reader({ get_tour_plan: SAVED });
    const loaded = await loadFor('update_tour', renamed, named);
    expect(named).toHaveBeenCalledTimes(1);
    expect(describeToolCall('update_tour', 'tc-11', renamed, ctx, loaded)).not.toHaveProperty('card');
    expect(await loadFor('update_tour', { name: 'No id' }, named)).toBeNull();
  });

  it('ASTCARD-TOUR-037: replans as update_tour decides, and draws a way it could not plan straight', () => {
    expect(replans({ max_hiking_difficulty: 3 }, SAVED)).toBe(false);
    expect(replans({ hiking_preferences: { avoid_steps: true, avoid_climbs: false } }, SAVED)).toBe(false);
    expect(replans({ hiking_preferences: null }, SAVED)).toBe(true);
    expect(replans({}, { ...SAVED, line: null })).toBe(true);
    expect(replans({ waypoints: POINTS }, SAVED)).toBe(true);
    const unplanned = { plan: null, saved: SAVED };
    const moved = { placeId: 61, waypoints: POINTS };
    const shown = route(describeToolCall('update_tour', 'tc-12', moved, ctx, unplanned));
    expect(shown).toMatchObject({ routed: false, problem: { why: 'not_planned' }, placeId: 61 });
    expect(shown.previous?.distanceM).toBe(2500);
  });
});

describe('the words and the way back of the other tour writes', () => {
  it('ASTCARD-TOUR-038: a tour taken over is a new tour, named as the copy is named, and taken back with its place', () => {
    const copy = { source_trip_id: 4, source_place_id: 9, name: 'Copy' };
    const preview = describeToolCall('take_over_tour', 'tc-13', copy, ctx);
    expect(preview).toMatchObject({ verbKey: 'addTour', subject: 'Copy', undoable: true });
    expect(ASSISTANT_WRITE_TOOLS.take_over_tour).toEqual({ verbKey: 'addTour', entity: 'tour' });
    expect(ASSISTANT_UNDO_MAP.take_over_tour.args({}, { tour: { place_id: 70 } }, null)).toEqual({ placeId: 70 });
  });

  it('ASTCARD-TOUR-039: tours from a file are taken back only when the file brought in one', () => {
    const one = { tours: [{ place_id: 71, name: 'Ridge', description: null }], caution: false, skipped: 0 };
    const two = { tours: [{ place_id: 71 }, { place_id: 72 }], caution: false, skipped: 0 };
    expect(ASSISTANT_UNDO_MAP.import_tour_gpx.args({}, one, null)).toEqual({ placeId: 71 });
    expect(ASSISTANT_UNDO_MAP.import_tour_gpx.args({}, two, null)).toBeNull();
    const made = '2026-10-21 10:00:00';
    const place = { id: 71, name: 'Ridge', description: null, created_at: made, updated_at: made };
    const snapshot = { places: { places: [place] }, summary: { days: [] } };
    expect(unchangedSinceApplied('import_tour_gpx', one, snapshot)).toBe(true);
    expect(unchangedSinceApplied('import_tour_gpx', two, snapshot)).toBe(false);
    const renamed = { places: { places: [{ ...place, name: 'Other' }] }, summary: { days: [] } };
    expect(unchangedSinceApplied('import_tour_gpx', one, renamed)).toBe(false);
  });

  it('ASTCARD-TOUR-040: a hike created on a day is taken back with its own visit, not once planned elsewhere', () => {
    const made = '2026-10-21 10:00:00';
    const hike = { id: 64, name: 'Herzogstand', description: null, created_at: made, updated_at: made };
    const created = { tour: { place_id: 64, name: 'Herzogstand' }, assignment: { id: 305, day_id: 32 } };
    const onItsDay = {
      places: { places: [hike] },
      summary: { days: [{ id: 32, assignments: [{ id: 305, place_id: 64 }] }] },
    };
    expect(unchangedSinceApplied('create_hike', created, onItsDay)).toBe(true);
    const twice = {
      places: { places: [hike] },
      summary: {
        days: [
          {
            id: 31,
            assignments: [
              { id: 306, place_id: 64 },
              { id: 305, place_id: 64 },
            ],
          },
        ],
      },
    };
    expect(unchangedSinceApplied('create_hike', created, twice)).toBe(false);
    // A new way saved since (any route write stamps updated_at) keeps the tour, name and day unchanged or not.
    const rerouted = { ...onItsDay, places: { places: [{ ...hike, updated_at: '2026-10-21 10:05:00' }] } };
    expect(unchangedSinceApplied('create_hike', created, rerouted)).toBe(false);
  });
});

describe('what the tours set for the model', () => {
  it('ASTCARD-TOUR-041: the planning tools draw their line, a saved line stays with the card, the prompt says so', () => {
    for (const tool of ['propose_hike', 'propose_city_walk', 'plan_paddle_route', 'plan_ski_route']) {
      expect(ASSISTANT_ARG_POLICY[tool]?.forced, tool).toEqual({ include_geometry: true });
    }
    const brief = PROJECTIONS.get_tour_plan?.(SAVED) as { line: Record<string, unknown> };
    expect(brief.line).toEqual({ point_count: 400, has_heights: true });
    expect(PROJECTIONS.get_tour_plan?.({ tour: {}, line: null })).toEqual({ tour: {}, line: null });
    expect(JSON.stringify(toolOutputForProvider('get_tour_plan', SAVED))).not.toContain('preview');
    const hikes = CARD_PROMPT_LINES.filter((line) => line.includes('propose_hike'));
    expect(hikes.some((line) => line.includes('variant_label'))).toBe(true);
    for (const line of CARD_PROMPT_LINES) expect(systemPrompt('English')).toContain(line);
  });
});
