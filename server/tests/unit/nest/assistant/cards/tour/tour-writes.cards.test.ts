/**
 * ASTCARD-TOUR-060 to ASTCARD-TOUR-064
 *
 * The smaller writes on a saved tour in the chat: a recorded track put on a
 * tour or taken off it, a tour left out of the activity sums or counted
 * again, and the packing list a tour points at. Each card names the tour; the
 * way back is the opposite tool, while what the change left is still so.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import type { PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import { ASSISTANT_UNDO_MAP, ASSISTANT_WRITE_TOOLS } from '../../../../../../src/nest/assistant/cards/registry';
import { describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { assistantChangePreviewSchema } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

const card = buildTripCard(
  1,
  7,
  { trip: { title: 'Alps' }, days: [] },
  {
    places: [
      { id: 61, name: 'Ridge walk', lat: 47, lng: 11 },
      { id: 62, name: 'Ridge, recorded', lat: 47, lng: 11 },
    ],
  },
  null,
);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en-GB', today: '2026-06-01', airport: () => null };

/** A snapshot holding one read, by its tool and arguments. */
function holding(tool: string, args: Record<string, unknown>, value: unknown) {
  return { summary: { days: [] }, places: { places: [] }, reads: new Map([[readKey(tool, args), value]]) };
}

describe('the smaller tour writes in the chat', () => {
  it('ASTCARD-TOUR-060: assigning a track names the tour and the track, and goes back by taking that assignment off', () => {
    const args = { placeId: 61, track_place_id: 62, assignment_id: null };
    const preview = describeToolCall('assign_tour_track', 'tc-1', args, ctx, null);
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(preview).toMatchObject({ subject: 'Ridge walk', verbKey: 'assignTrack', placeIds: [61] });
    expect(preview.rows).toEqual([expect.objectContaining({ labelKey: 'track', after: 'Ridge, recorded' })]);
    const result = {
      activities: [
        { id: 3, track: { place_id: 62 } },
        { id: 9, track: { place_id: 62 } },
        { id: 12, track: { place_id: 70 } },
      ],
    };
    const undo = ASSISTANT_UNDO_MAP.assign_tour_track;
    expect(undo.tool).toBe('unassign_tour_track');
    expect(undo.args(args, result, null)).toEqual({ placeId: 61, activityId: 9 });
    expect(undo.args(args, { activities: [] }, null)).toBeNull();
    const call = { args, preview: null };
    const plan = (ids: number[]) =>
      holding('get_tour_plan', { placeId: 61 }, { activities: ids.map((id) => ({ id })) });
    expect(unchangedSinceApplied('assign_tour_track', result, plan([9]), call)).toBe(true);
    expect(unchangedSinceApplied('assign_tour_track', result, plan([3]), call)).toBe(false);
    expect(unchangedSinceApplied('assign_tour_track', result, plan([9]))).toBe(false);
  });

  it('ASTCARD-TOUR-061: taking a track off has a card and no way back', () => {
    const preview = describeToolCall('unassign_tour_track', 'tc-2', { placeId: 61, activityId: 9 }, ctx, null);
    expect(preview).toMatchObject({ subject: 'Ridge walk', verbKey: 'unassignTrack' });
    expect(ASSISTANT_UNDO_MAP.unassign_tour_track).toBeUndefined();
    expect(ASSISTANT_WRITE_TOOLS.unassign_tour_track).toMatchObject({ entity: 'tour' });
  });

  it('ASTCARD-TOUR-062: leaving a tour out of the sums, or counting it again, goes back by the other switch while it holds', () => {
    expect(
      describeToolCall('set_tour_activity_excluded', 'tc-3', { place_id: 61, excluded: true }, ctx, null),
    ).toMatchObject({
      subject: 'Ridge walk',
      verbKey: 'excludeTour',
    });
    const back = { place_id: 61, excluded: false };
    expect(describeToolCall('set_tour_activity_excluded', 'tc-4', back, ctx, null).verbKey).toBe('countTour');
    const undo = ASSISTANT_UNDO_MAP.set_tour_activity_excluded;
    expect(undo.args({ place_id: 61, excluded: true }, {}, null)).toEqual({ place_id: 61, excluded: false });
    expect(undo.args({ place_id: 61 }, {}, null)).toBeNull();
    const stats = (excluded: boolean) =>
      holding('get_tour_activity_stats', {}, { tours: [{ place_id: 61, excluded }], upcoming: [] });
    const call = { args: { place_id: 61, excluded: true }, preview: null };
    expect(unchangedSinceApplied('set_tour_activity_excluded', {}, stats(true), call)).toBe(true);
    expect(unchangedSinceApplied('set_tour_activity_excluded', {}, stats(false), call)).toBe(false);
  });

  it('ASTCARD-TOUR-063: a packing link where there was none goes back by letting go of it; one that replaced another has no way back', () => {
    const undo = ASSISTANT_UNDO_MAP.link_tour_packing;
    const args = { placeId: 61, category: 'Hiking gear' };
    const fresh = { packing_link: { category: 'Hiking gear', linked_at: 'x' }, previous_link: null };
    expect(undo.tool).toBe('unlink_tour_packing');
    expect(undo.args(args, fresh, null)).toEqual({ placeId: 61 });
    expect(undo.args(args, { ...fresh, previous_link: { category: null, linked_at: 'y' } }, null)).toBeNull();
    const packing = (link: unknown) => holding('get_tour_packing', { placeId: 61 }, { packing_link: link });
    const call = { args, preview: null };
    expect(unchangedSinceApplied('link_tour_packing', fresh, packing({ category: 'Hiking gear' }), call)).toBe(true);
    expect(unchangedSinceApplied('link_tour_packing', fresh, packing({ category: null }), call)).toBe(false);
    expect(unchangedSinceApplied('link_tour_packing', fresh, packing(null), call)).toBe(false);
  });

  it('ASTCARD-TOUR-064: letting go of a packing link names the tour and links back what it pointed at, while it points at nothing', () => {
    const preview = describeToolCall('unlink_tour_packing', 'tc-5', { placeId: 61 }, ctx, null);
    expect(preview).toMatchObject({ subject: 'Ridge walk', verbKey: 'unlinkPacking', placeIds: [61] });
    const undo = ASSISTANT_UNDO_MAP.unlink_tour_packing;
    const result = { packing_link: null, previous_link: { category: null, linked_at: 'x' } };
    expect(undo.args({ placeId: 61 }, result, null)).toEqual({ placeId: 61, category: null });
    expect(undo.args({ placeId: 61 }, { packing_link: null, previous_link: null }, null)).toBeNull();
    const packing = (link: unknown) => holding('get_tour_packing', { placeId: 61 }, { packing_link: link });
    const call = { args: { placeId: 61 }, preview: null };
    expect(unchangedSinceApplied('unlink_tour_packing', result, packing(null), call)).toBe(true);
    expect(unchangedSinceApplied('unlink_tour_packing', result, packing({ category: 'X' }), call)).toBe(false);
  });
});
