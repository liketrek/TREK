/**
 * ASTCARD-TOUR-050 to ASTCARD-TOUR-052
 *
 * A station of a city walk checked off on its day (set_city_walk_visit): the
 * card names the station and its walk with the verb of the mark, and the way
 * back sets the status the station had before, while it still has the one the
 * change gave it.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import { loadFor } from '../../../../../../src/nest/assistant/cards/card-context';
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
  { trip: { title: 'Lisbon' }, days: [{ id: 31, day_number: 1, date: '2026-11-11', assignments: [] }] },
  { places: [{ id: 61, name: 'Old town walk', lat: 38.71, lng: -9.14 }] },
  null,
);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en-GB', today: '2026-11-01', airport: () => null };

const PROGRESS = {
  place_id: 61,
  day_id: 31,
  assignment_id: 90,
  stations: [
    { key: 'stop-se', name: 'Sé Cathedral', status: 'visited' },
    { key: 'stop-castle', name: 'Castle', status: 'planned' },
  ],
};
const ARGS = { placeId: 61, dayId: 31, stationKey: 'stop-castle', status: 'skipped' };
const RESULT = {
  station_key: 'stop-castle',
  name: 'Castle',
  previous_status: 'planned',
  status: 'skipped',
  walk: { assignment_id: 90 },
};

describe('set_city_walk_visit in the chat', () => {
  it('ASTCARD-TOUR-050: the card names the station, its walk and day, with the verb of the mark', async () => {
    const read = vi.fn(async () => PROGRESS);
    const loaded = await loadFor('set_city_walk_visit', ARGS, read);
    expect(read).toHaveBeenCalledWith('get_city_walk_progress', { placeId: 61, dayId: 31 });
    const preview = describeToolCall('set_city_walk_visit', 'tc-1', ARGS, ctx, loaded);
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(preview).toMatchObject({ subject: 'Castle', verbKey: 'markSkipped', dayId: 31, placeIds: [61] });
    expect(preview.rows.map((row) => row.labelKey)).toEqual(['route', 'day']);
    expect(ASSISTANT_WRITE_TOOLS.set_city_walk_visit).toMatchObject({ entity: 'tour' });
    // Without the walk read, the card still names the walk and says what the mark does.
    const blind = describeToolCall('set_city_walk_visit', 'tc-2', { ...ARGS, status: 'visited' }, ctx, null);
    expect(blind).toMatchObject({ subject: 'Old town walk', verbKey: 'markVisited' });
    expect(await loadFor('set_city_walk_visit', { stationKey: 'x' }, read)).toBeNull();
  });

  it('ASTCARD-TOUR-051: a mark the station already has offers no way back', () => {
    const same = describeToolCall(
      'set_city_walk_visit',
      'tc-3',
      { ...ARGS, stationKey: 'stop-se', status: 'visited' },
      ctx,
      PROGRESS,
    );
    expect(same.undoable).toBe(false);
  });

  it('ASTCARD-TOUR-052: the way back sets the status before, while the station still has the one the change gave it', () => {
    const undo = ASSISTANT_UNDO_MAP.set_city_walk_visit;
    expect(undo.tool).toBe('set_city_walk_visit');
    expect(undo.args(ARGS, RESULT, null)).toEqual({
      placeId: 61,
      dayId: 31,
      stationKey: 'stop-castle',
      status: 'planned',
      assignmentId: 90,
    });
    expect(undo.args(ARGS, { status: 'skipped' }, null)).toBeNull();
    const at = (status: string) => ({
      summary: { days: [] },
      places: { places: [] },
      reads: new Map([
        [
          readKey('get_city_walk_progress', { placeId: 61, dayId: 31 }),
          { ...PROGRESS, stations: [{ key: 'stop-castle', status }] },
        ],
      ]),
    });
    const call = { args: ARGS, preview: null };
    expect(unchangedSinceApplied('set_city_walk_visit', RESULT, at('skipped'), call)).toBe(true);
    expect(unchangedSinceApplied('set_city_walk_visit', RESULT, at('visited'), call)).toBe(false);
    expect(unchangedSinceApplied('set_city_walk_visit', RESULT, at('skipped'))).toBe(false);
  });
});
