/**
 * ASTCARD-TOUR-080 to ASTCARD-TOUR-087
 *
 * P6 in the chat: a found place taken into a saved tour as a stop
 * (insert_tour_stop), by the model or with "+ Tour" on a found place, and a
 * stop taken out (remove_tour_stop). The card names the tour, the stop and
 * the two points it goes between; each change goes back by the other while
 * the tour is still at the revision the change left it at.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { stopArgs } from '../../../../../../src/nest/assistant/assistant-found-places.service';
import {
  ADD_FOUND_PLACE_TOOL,
  foundPlaceArgs,
  writeToolOf,
} from '../../../../../../src/nest/assistant/assistant-tools.constants';
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import { loadFor } from '../../../../../../src/nest/assistant/cards/card-context';
import type { PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import { ASSISTANT_UNDO_MAP, ASSISTANT_WRITE_TOOLS } from '../../../../../../src/nest/assistant/cards/registry';
import { defaultAfterKeyOf } from '../../../../../../src/nest/assistant/cards/tour/tour-stop.cards';
import { describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { DomainError } from '../../../../../../src/nest/common/domain-error';
import { assistantChangePreviewSchema, type AssistantFoundPlace } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

const card = buildTripCard(
  1,
  7,
  { trip: { title: 'Alps' }, days: [] },
  { places: [{ id: 64, name: 'Herzogstand', lat: 47.5, lng: 11.1 }] },
  null,
);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en-GB', today: '2026-06-01', airport: () => null };

/** get_tour_plan of the hike: three points and its line in brief. */
const PLAN = {
  tour: { place_id: 64, name: 'Herzogstand', tour_type: 'hike', revision: 3 },
  waypoints: [
    { key: 'start1', lat: 47.5, lng: 11.1, role: 'start', name: 'Car park' },
    { key: 'alm111', lat: 47.505, lng: 11.1, role: 'via', name: 'Alm' },
    { key: 'summit', lat: 47.51, lng: 11.1, role: 'end', name: 'Summit' },
  ],
  line: {
    point_count: 3,
    has_heights: true,
    preview: [
      [47.5, 11.1, 800],
      [47.505, 11.1, 900],
      [47.51, 11.1, 1000],
    ],
  },
};
const STOP = { lat: 47.507, lng: 11.1, name: 'Spring' };

function holding(value: unknown) {
  return {
    summary: { days: [] },
    places: { places: [] },
    reads: new Map([[readKey('get_tour_plan', { placeId: 64 }), value]]),
  };
}

describe('a stop taken into a tour in the chat', () => {
  it('ASTCARD-TOUR-080: reads the tour, and its card names the tour, the stop and the two points it goes between', async () => {
    const read = vi.fn(async () => PLAN);
    const args = { placeId: 64, expected_revision: 3, stop: STOP };
    const loaded = await loadFor('insert_tour_stop', args, read);
    expect(read).toHaveBeenCalledWith('get_tour_plan', { placeId: 64 });
    const preview = describeToolCall('insert_tour_stop', 'tc-1', args, ctx, loaded);
    expect(assistantChangePreviewSchema.safeParse(preview).success).toBe(true);
    expect(preview).toMatchObject({ subject: 'Herzogstand', verbKey: 'addTourStop', placeIds: [64], undoable: true });
    expect(preview.rows).toEqual([
      { op: 'add', labelKey: 'name', before: null, after: 'Spring' },
      { op: 'add', labelKey: 'position', before: null, after: 'Alm → Summit' },
    ]);
    expect(ASSISTANT_WRITE_TOOLS.insert_tour_stop).toMatchObject({ verbKey: 'addTourStop', entity: 'tour' });
  });

  it('ASTCARD-TOUR-081: a point named keeps its place in the card; a new end has nothing after it', () => {
    const named = describeToolCall(
      'insert_tour_stop',
      'tc-1',
      { placeId: 64, stop: STOP, after_key: 'start1' },
      ctx,
      PLAN,
    );
    expect(named.rows[1]?.after).toBe('Car park → Alm');
    const end = describeToolCall(
      'insert_tour_stop',
      'tc-1',
      { placeId: 64, stop: STOP, after_key: 'summit' },
      ctx,
      PLAN,
    );
    expect(end.rows[1]?.after).toBe('Summit →');
    // Without the tour read, the card still names the tour from the trip.
    expect(describeToolCall('insert_tour_stop', 'tc-1', { placeId: 64, stop: STOP }, ctx, null).subject).toBe(
      'Herzogstand',
    );
  });

  it('ASTCARD-TOUR-082: goes back by taking the stop out, while the tour is at the revision it left', () => {
    const undo = ASSISTANT_UNDO_MAP.insert_tour_stop;
    const result = { tour: { place_id: 64, revision: 4 }, stop: { key: 'spring', name: 'Spring' } };
    expect(undo.tool).toBe('remove_tour_stop');
    expect(undo.args({}, result, null)).toEqual({ placeId: 64, key: 'spring', expected_revision: 4 });
    expect(undo.args({}, { ...result, stop: { key: null } }, null)).toBeNull();
    const call = { args: { placeId: 64 }, preview: null };
    const at = (revision: number) => holding({ tour: { revision } });
    expect(unchangedSinceApplied('insert_tour_stop', result, at(4), call)).toBe(true);
    expect(unchangedSinceApplied('insert_tour_stop', result, at(5), call)).toBe(false);
    expect(unchangedSinceApplied('insert_tour_stop', result, at(4))).toBe(false);
  });
});

describe('a stop taken out in the chat', () => {
  it('ASTCARD-TOUR-083: names the tour and the stop, and goes back by putting it after the point it followed', () => {
    const preview = describeToolCall('remove_tour_stop', 'tc-2', { placeId: 64, key: 'alm111' }, ctx, PLAN);
    expect(preview).toMatchObject({ subject: 'Herzogstand', verbKey: 'removeTourStop', undoable: true });
    expect(preview.rows).toEqual([{ op: 'add', labelKey: 'name', before: null, after: 'Alm' }]);
    const undo = ASSISTANT_UNDO_MAP.remove_tour_stop;
    const result = {
      tour: { place_id: 64, revision: 5 },
      removed: { key: 'alm111', lat: 47.505, lng: 11.1, name: 'Alm', poi_category: 'shelter', after_key: 'start1' },
    };
    expect(undo.tool).toBe('insert_tour_stop');
    expect(undo.args({}, result, null)).toEqual({
      placeId: 64,
      expected_revision: 5,
      stop: { lat: 47.505, lng: 11.1, name: 'Alm', poi_category: 'shelter' },
      after_key: 'start1',
    });
    expect(undo.args({}, { tour: result.tour, removed: { key: 'x' } }, null)).toBeNull();
  });
});

describe('"+ Tour" on a found place', () => {
  const place: AssistantFoundPlace = {
    ref: 'tc-9:0',
    name: 'Spring',
    address: null,
    lat: 47.507,
    lng: 11.1,
    kind: null,
    rating: null,
    openNow: null,
    googlePlaceId: null,
    osmId: null,
    photoKey: null,
    inTripPlaceId: null,
  };

  it('ASTCARD-TOUR-084: holds insert_tour_stop after the last point before the place, against the revision read', () => {
    const args = stopArgs(place, 64, PLAN);
    expect(args).toEqual({
      via: 'insert_tour_stop',
      placeId: 64,
      expected_revision: 3,
      stop: { lat: 47.507, lng: 11.1, name: 'Spring' },
      after_key: 'alm111',
      tourName: 'Herzogstand',
    });
    expect(writeToolOf(ADD_FOUND_PLACE_TOOL, args)).toBe('insert_tour_stop');
    expect(foundPlaceArgs(args)).toEqual({
      placeId: 64,
      expected_revision: 3,
      stop: { lat: 47.507, lng: 11.1, name: 'Spring' },
      after_key: 'alm111',
    });
  });

  it('ASTCARD-TOUR-085: refuses a tour of another trip, one not read and a type that takes no stop', () => {
    expect(() => stopArgs(place, 65, PLAN)).toThrow(DomainError);
    expect(() => stopArgs(place, 64, null)).toThrow(/Tour not found/);
    expect(() => stopArgs(place, 64, { ...PLAN, tour: { ...PLAN.tour, tour_type: 'bike' } })).toThrow(
      /hike or a city walk/,
    );
  });

  it('ASTCARD-TOUR-086: the card of a held "+ Tour" reads as the stop it adds', () => {
    const args = stopArgs(place, 64, PLAN);
    const preview = describeToolCall(ADD_FOUND_PLACE_TOOL, 'tc-3', args, ctx, PLAN);
    expect(preview).toMatchObject({ verbKey: 'addTourStop', subject: 'Herzogstand' });
    expect(preview.rows[1]?.after).toBe('Alm → Summit');
  });

  it('ASTCARD-TOUR-087: the point a place goes after skips a point the tour gave no key yet', () => {
    const unkeyed = { ...PLAN, waypoints: PLAN.waypoints.map((point) => ({ ...point, key: undefined })) };
    expect(defaultAfterKeyOf(PLAN, STOP)).toBe('alm111');
    expect(defaultAfterKeyOf(unkeyed, STOP)).toBeNull();
  });
});
