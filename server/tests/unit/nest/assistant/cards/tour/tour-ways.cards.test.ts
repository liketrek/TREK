/**
 * ASTCARD-TOUR-WAYS-001 to ASTCARD-TOUR-WAYS-008
 *
 * The cards of the planner's other searches through the assistant: a round
 * hike and another way for one leg, drawn as propose_hike's proposals are,
 * the leg's way beside the hike as it runs now; a wanderer trail previewed
 * as a way to take in, and its import with a change card and a way back.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import type { CardReader, PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import {
  answerCardOf,
  ASSISTANT_ARG_POLICY,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
} from '../../../../../../src/nest/assistant/cards/registry';
import {
  IMPORT_WANDERER_TRAIL,
  legWayCard,
  roundHikeCard,
  wandererPreviewCard,
  wandererTrailCard,
} from '../../../../../../src/nest/assistant/cards/tour/tour-ways.cards';
import { trekCardSchema } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const card = buildTripCard(1, 7, { trip: { title: 'Bavaria' }, days: [] }, { places: [] }, null);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en-GB', today: '2026-06-01', airport: () => null };

const LINE: Array<[number, number, number]> = [
  [47.6, 11.3, 800],
  [47.61, 11.31, 950],
  [47.62, 11.3, 1100],
  [47.6, 11.3, 800],
];

/** A proposal as propose_hike answers it, its way planned, with what the search adds. */
function proposal(extra: Record<string, unknown> = {}) {
  return {
    found: true,
    name: 'Round over the Kesselberg',
    variant_label: null,
    route: { planned: true },
    distance_m: 10_400,
    ascent_m: 300,
    descent_m: 300,
    duration_minutes: 190,
    duration_basis: 'din33466',
    max_hiking_difficulty: 2,
    line_geometry: LINE,
    waypoints: [
      { lat: 47.6, lng: 11.3, name: 'Car park', at_m: 0, minutes: 0 },
      { lat: 47.61, lng: 11.31, name: null, at_m: 3000, minutes: 60 },
      { lat: 47.6, lng: 11.3, name: 'Car park', at_m: 10_400, minutes: 190 },
    ],
    ...extra,
  };
}

const answer = (value: unknown, args: Record<string, unknown> = {}) => ({
  toolCallId: 't1',
  args,
  value,
  card,
  today: '2026-06-01',
});

describe('a round and another way of a leg', () => {
  it('ASTCARD-TOUR-WAYS-001: a round found is a hike proposal’s card; one not found draws nothing', () => {
    const drawn = roundHikeCard(answer(proposal({ round: { key: 'a' } })));
    expect(drawn).toMatchObject({ kind: 'tourRoute', source: 'proposal', activity: 'hike', distanceM: 10_400 });
    expect(trekCardSchema.safeParse(drawn).success).toBe(true);
    expect(roundHikeCard(answer({ found: false, way: 'b', ways_found: 1, why: 'none_found' }))).toBeNull();
  });

  it('ASTCARD-TOUR-WAYS-002: a leg’s way draws the hike as it runs now beneath it, and names a saved hike', () => {
    const value = proposal({
      leg_way: { key: 'b', leg: 1, ways_found: 2, tour_id: 61 },
      current: { distance_m: 9_800, ascent_m: 280, duration_minutes: 175 },
      current_geometry: LINE.slice(0, 3),
    });
    const drawn = legWayCard(answer(value));
    expect(drawn?.previous).toMatchObject({ distanceM: 9_800, ascentM: 280, minutes: 175 });
    expect(drawn?.previous?.line).toHaveLength(3);
    expect(drawn?.placeId).toBe(61);
    expect(trekCardSchema.safeParse(drawn).success).toBe(true);
    const unsaved = legWayCard(answer(proposal({ leg_way: { tour_id: null }, current: {} })));
    expect(unsaved).toMatchObject({ placeId: null, previous: null });
    expect(legWayCard(answer({ found: false }))).toBeNull();
  });

  it('ASTCARD-TOUR-WAYS-003: the planning tools are always asked for their line, and the prompt names them', () => {
    for (const tool of ['propose_round_hike', 'propose_hike_leg_way', 'preview_wanderer_trail']) {
      expect(ASSISTANT_ARG_POLICY[tool]?.forced, tool).toEqual({ include_geometry: true });
    }
    expect(answerCardOf('propose_round_hike', answer(proposal()))?.kind).toBe('tourRoute');
    const prompt = CARD_PROMPT_LINES.join(' ');
    expect(prompt).toContain('propose_round_hike');
    expect(prompt).toContain('import_wanderer_trail');
  });
});

const PREVIEW = {
  trail: {
    id: 'trail-1',
    name: 'Herzogstand',
    location: 'Kochel',
    difficulty: 'moderate',
    externalUrl: 'https://w.example/t/1',
  },
  distanceKm: 9.1,
  elevationGainM: 812,
  elevationLossM: 790,
  hasElevation: true,
  points: 900,
  line_geometry: [
    [47.6, 11.3],
    [47.62, 11.33],
    [47.65, 11.36],
  ],
  contentHash: 'h'.repeat(32),
  state: 'new',
  snapshot: null,
  changes: [],
};

describe('a wanderer trail', () => {
  it('ASTCARD-TOUR-WAYS-004: a trail previewed is a hike to take in: its line, length, climb and grade', () => {
    const drawn = wandererPreviewCard(answer(PREVIEW));
    expect(drawn).toMatchObject({
      source: 'proposal',
      activity: 'hike',
      placeId: null,
      name: 'Herzogstand',
      distanceM: 9100,
      ascentM: 812,
      descentM: 790,
      limit: 2,
      routed: true,
    });
    expect(drawn?.stops.map((stop) => stop.role)).toEqual(['start', 'end']);
    expect(drawn?.stops[0]?.name).toBe('Kochel');
    expect(trekCardSchema.safeParse(drawn).success).toBe(true);
  });

  it('ASTCARD-TOUR-WAYS-005: one already in the trip as it is reads as that saved tour; a loop has one stop', () => {
    const kept = wandererPreviewCard(answer({ ...PREVIEW, state: 'unchanged', snapshot: { placeId: 61 } }));
    expect(kept).toMatchObject({ source: 'saved', placeId: 61 });
    const loop = wandererTrailCard(
      {
        ...PREVIEW,
        trail: { name: 'Loop', difficulty: 'unknown' },
        line_geometry: [
          [47.6, 11.3],
          [47.62, 11.33],
          [47.6, 11.3],
        ],
      },
      'pending',
    );
    expect(loop).toMatchObject({ source: 'pending', placeId: null, limit: null });
    expect(loop?.stops).toHaveLength(1);
    expect(wandererPreviewCard(answer({ ...PREVIEW, line_geometry: [] }))).toBeNull();
  });

  it('ASTCARD-TOUR-WAYS-006: a held import reads the trail again and shows it waiting, named and graded', async () => {
    const read = vi.fn(async () => PREVIEW) as unknown as CardReader;
    const loaded = await IMPORT_WANDERER_TRAIL.load?.({ trailId: 'trail-1', contentHash: 'x' }, read);
    expect(read).toHaveBeenCalledWith('preview_wanderer_trail', { trailId: 'trail-1', include_geometry: true });
    const described = IMPORT_WANDERER_TRAIL.describe?.(ctx, { trailId: 'trail-1' }, loaded ?? null);
    expect(described?.subject).toBe('Herzogstand');
    expect(described?.rows.rows.map((row) => [row.labelKey, row.after])).toEqual([
      ['location', 'Kochel'],
      ['difficulty', 'T2'],
      ['link', 'https://w.example/t/1'],
    ]);
    expect(IMPORT_WANDERER_TRAIL.change?.(ctx, {}, loaded ?? null)).toMatchObject({ source: 'pending' });
    expect(IMPORT_WANDERER_TRAIL.change?.(ctx, {}, null)).toBeNull();
  });

  it('ASTCARD-TOUR-WAYS-007: an import without a trail looks nothing up and is named by the trail asked for', async () => {
    const read = vi.fn() as unknown as CardReader;
    expect(await IMPORT_WANDERER_TRAIL.load?.({}, read)).toBeNull();
    expect(read).not.toHaveBeenCalled();
    expect(IMPORT_WANDERER_TRAIL.describe?.(ctx, { trailId: 'trail-9' }, null).subject).toBe('trail-9');
  });

  it('ASTCARD-TOUR-WAYS-008: an import is a tour added, taken back by deleting the tour it made', () => {
    expect(ASSISTANT_WRITE_TOOLS.import_wanderer_trail).toEqual({ verbKey: 'importTour', entity: 'tour' });
    expect(ASSISTANT_UNDO_MAP.import_wanderer_trail?.args({}, { tour: { place_id: 72 } }, null)).toEqual({
      placeId: 72,
    });
  });
});
