/**
 * ASTCARD-TOUR-080 to ASTCARD-TOUR-088
 *
 * P8 and P9 in the chat: a saved tour's words and times, the colour of its
 * line, a copy, a hike turned round or taken back to its start, and the
 * writes a ski or paddle tour has of its own. Each card names the tour; where
 * the answer keeps what was there before, the way back writes it again while
 * the tour is still at the revision the change raised it to.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import type { PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import { ASSISTANT_UNDO_MAP, ASSISTANT_WRITE_TOOLS } from '../../../../../../src/nest/assistant/cards/registry';
import { replans, reshapedPoints } from '../../../../../../src/nest/assistant/cards/tour/tour-change.cards';
import { describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { assistantChangePreviewSchema } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

const card = buildTripCard(
  1,
  7,
  { trip: { title: 'Alps' }, days: [] },
  { places: [{ id: 61, name: 'Ridge walk', lat: 47, lng: 11, description: 'Up and down' }] },
  null,
);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en-GB', today: '2026-06-01', airport: () => null };

/** A snapshot holding the plan of the tour at a revision. */
function atRevision(revision: number) {
  return {
    summary: { days: [] },
    places: { places: [] },
    reads: new Map([[readKey('get_tour_plan', { placeId: 61 }), { tour: { place_id: 61, revision } }]]),
  };
}

describe('the edits of a saved tour in the chat', () => {
  it('ASTCARD-TOUR-080: new words and times name the tour and each field, and go back to the values before', () => {
    const args = { placeId: 61, expected_revision: 3, name: 'High ridge', break_additional_minutes: 90, website: null };
    const preview = describeToolCall('update_tour_details', 'tc-1', args, ctx, null);
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(preview).toMatchObject({ subject: 'Ridge walk', verbKey: 'updateTour', placeIds: [61] });
    expect(preview.rows.map((row) => row.labelKey)).toEqual(['name', 'website', 'breaks']);
    expect(preview.rows.find((row) => row.labelKey === 'breaks')?.after).toBe('1:30 h');
    const result = {
      tour: { place_id: 61, revision: 4 },
      previous: { revision: 3, name: 'Ridge walk', website: 'https://a.example/', break_additional_minutes: null },
    };
    const undo = ASSISTANT_UNDO_MAP.update_tour_details;
    expect(undo.args(args, result, null)).toEqual({
      placeId: 61,
      expected_revision: 4,
      name: 'Ridge walk',
      website: 'https://a.example/',
      break_additional_minutes: null,
    });
    expect(undo.args(args, { tour: {}, previous: {} }, null)).toBeNull();
    const call = { args, preview: null };
    expect(unchangedSinceApplied('update_tour_details', result, atRevision(4), call)).toBe(true);
    expect(unchangedSinceApplied('update_tour_details', result, atRevision(5), call)).toBe(false);
  });

  it('ASTCARD-TOUR-081: a new colour goes back to the colour before while the place still has the new one', () => {
    const args = { placeId: 61, route_color: '#e11d48' };
    expect(describeToolCall('set_tour_route_color', 'tc-2', args, ctx, null)).toMatchObject({
      verbKey: 'setRouteColor',
      rows: [expect.objectContaining({ labelKey: 'color', after: '#e11d48' })],
    });
    const result = { place_id: 61, route_color: '#e11d48', previous_route_color: null };
    expect(ASSISTANT_UNDO_MAP.set_tour_route_color.args(args, result, null)).toEqual({
      placeId: 61,
      route_color: null,
    });
    const places = (color: string | null) => ({
      summary: { days: [] },
      places: { places: [{ id: 61, route_color: color }] },
      reads: new Map(),
    });
    expect(unchangedSinceApplied('set_tour_route_color', result, places('#e11d48'))).toBe(true);
    expect(unchangedSinceApplied('set_tour_route_color', result, places('#000000'))).toBe(false);
  });

  it('ASTCARD-TOUR-082: a copy names its new name and the tour it is made from, and goes back by deleting it', () => {
    const preview = describeToolCall('copy_tour', 'tc-3', { placeId: 61, name: 'Ridge (short)' }, ctx, null);
    expect(preview).toMatchObject({ subject: 'Ridge (short)', verbKey: 'copyTour', placeIds: [61] });
    expect(preview.rows).toEqual([expect.objectContaining({ labelKey: 'route', after: 'Ridge walk' })]);
    expect(ASSISTANT_UNDO_MAP.copy_tour.tool).toBe('delete_place');
    expect(ASSISTANT_UNDO_MAP.copy_tour.args({}, { tour: { place_id: 90 } }, null)).toEqual({ placeId: 90 });
  });

  it('ASTCARD-TOUR-083: a hike turned round or closed to a loop says so, and is planned anew through the turned points', () => {
    const reverse = describeToolCall(
      'update_tour',
      'tc-4',
      { placeId: 61, expected_revision: 1, reshape: 'reverse' },
      ctx,
      null,
    );
    expect(reverse.verbKey).toBe('reverseTour');
    const loop = describeToolCall(
      'update_tour',
      'tc-5',
      { placeId: 61, expected_revision: 1, reshape: 'close_loop' },
      ctx,
      null,
    );
    expect(loop.verbKey).toBe('closeLoop');
    const saved = { tour: { max_hiking_difficulty: 2 }, line: { point_count: 2 } };
    expect(replans({ reshape: 'reverse' }, saved)).toBe(true);
    expect(replans({ name: 'X' }, saved)).toBe(false);
    const points = [
      { lat: 47, lng: 11 },
      { lat: 47.1, lng: 11 },
    ];
    expect(reshapedPoints('reverse', points)).toEqual([...points].reverse());
    expect(reshapedPoints('close_loop', points)).toEqual([...points, { lat: 47, lng: 11 }]);
    expect(reshapedPoints(undefined, points)).toBeNull();
  });
});

describe('the writes of a ski or paddle tour in the chat', () => {
  it('ASTCARD-TOUR-084: a ski classification names the discipline and goes back to the one before', () => {
    const args = { placeId: 61, ski_discipline: 'cross_country', ski_technique: 'classic' };
    expect(describeToolCall('classify_ski_track', 'tc-6', args, ctx, null)).toMatchObject({
      verbKey: 'classifySki',
      rows: [expect.objectContaining({ labelKey: 'type', after: 'cross_country (classic)' })],
    });
    const result = { tour: { revision: 2 }, previous: { ski_discipline: 'alpine', ski_technique: null } };
    expect(ASSISTANT_UNDO_MAP.classify_ski_track.args(args, result, null)).toEqual({
      placeId: 61,
      ski_discipline: 'alpine',
      ski_technique: null,
      expected_revision: 2,
    });
    expect(unchangedSinceApplied('classify_ski_track', result, atRevision(2), { args, preview: null })).toBe(true);
  });

  it('ASTCARD-TOUR-085: a paddle plan goes back to the plan before', () => {
    const args = {
      placeId: 61,
      paddle_speed_kmh: 5,
      portage_speed_kmh: null,
      track_marks: { portages: [], locks: [] },
    };
    expect(describeToolCall('set_paddle_plan', 'tc-7', args, ctx, null)).toMatchObject({ verbKey: 'setPaddlePlan' });
    const previous = { paddle_speed_kmh: null, portage_speed_kmh: 2, track_marks: { portages: [], locks: [] } };
    expect(ASSISTANT_UNDO_MAP.set_paddle_plan.args(args, { tour: { revision: 7 }, previous }, null)).toEqual({
      placeId: 61,
      ...previous,
      expected_revision: 7,
    });
  });

  it('ASTCARD-TOUR-086: decisions about obstacles and a track restored have a card and no way back', () => {
    for (const [tool, verbKey] of [
      ['decide_paddle_obstacles', 'decideObstacles'],
      ['restore_recorded_track', 'restoreTrack'],
    ] as const) {
      expect(describeToolCall(tool, 'tc-8', { placeId: 61 }, ctx, null)).toMatchObject({
        subject: 'Ridge walk',
        verbKey,
      });
      expect(ASSISTANT_UNDO_MAP[tool]).toBeUndefined();
      expect(ASSISTANT_WRITE_TOOLS[tool]).toMatchObject({ entity: 'tour' });
    }
  });
});
