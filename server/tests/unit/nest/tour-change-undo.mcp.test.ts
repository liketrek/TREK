/**
 * TourChangeUndoMcp (MCP-T04): a step saved with save_tour_change listed,
 * previewed without writing, and taken back once the traveller confirmed it,
 * which restores the tour exactly as the step kept it. Only the tour's latest
 * change is taken back: anything saved on top of it since is a conflict on
 * the tour's one revision, and a station done since that would go, or a
 * place of the trip gone, refuses it; every refusal and failure leaves the
 * tour as it is. The suite takes its subject from the container over a
 * snapshot test db, saves the steps through the real save with a stub of the
 * road trip's router and seeds through the ORM factories.
 */
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { TourChangeSteps } from '../../../src/db/entities/TourChangeSteps.entity';
import { TourStationVisits } from '../../../src/db/entities/TourStationVisits.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import { TourChangeStepsRepository } from '../../../src/db/repositories/TourChangeSteps.repository';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { catchDomainError, DomainError } from '../../../src/nest/common/domain-error';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { TourChangeUndoMcp } from '../../../src/nest/tours/tour-change-undo.mcp';
import {
  TOUR_CHANGE_STEP_NOT_FOUND,
  TOUR_CHANGE_STEP_UNDONE,
  TOUR_CHANGE_STEP_WITHOUT_EARLIER_STATE,
  TOUR_CHANGE_STEPS_LISTED,
  TOUR_CHANGE_UNDO_REFUSED,
} from '../../../src/nest/tours/tour-change-undo.service';
import { TourChangeMcp } from '../../../src/nest/tours/tour-change.mcp';
import { ToursMcp } from '../../../src/nest/tours/tours.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, deleteRows, findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour, markStationVisit } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { TOUR_REVISION_CONFLICT, type TourChange, type TourChangeUndoRequest } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z, type ZodRawShape } from 'zod';

const db = createSnapshotTestDb();
const route = vi.fn();
let t: TestModule;
let mcp: TourChangeUndoMcp;
const orm = () => t.get(MikroORM);

/** Every leg the router plans is 500 m and 400 s on foot, along the points asked. */
async function routedOnFoot(
  _userId: number,
  _tripId: number,
  _dayId: number,
  points: Array<{ lat: number; lng: number }>,
) {
  return {
    leg: { line: points.map((point): [number, number] => [point.lat, point.lng]) },
    parts: points.slice(1).map(() => ({ distance: 500, duration: 400 })),
    snapped: points.map(() => ({ meters: 4 })),
    avoidMissed: [],
  };
}

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [{ provide: RoadtripRouterService, useValue: { route } }],
  });
  mcp = t.get(TourChangeUndoMcp);
});
beforeEach(() => {
  resetTestDb(db);
  route.mockReset().mockImplementation(routedOnFoot);
  t.realtime.broadcastMock.mockReset();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

/** The JSON a tool answered, or the error text it refused with. */
function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

/** The refusal a tool raised, which the registry answers with its text. */
async function refusal(promise: Promise<unknown>): Promise<DomainError> {
  const err = await catchDomainError(() => promise);
  if (!(err instanceof DomainError)) throw new Error('no refusal');
  return err;
}

const OLD_TOWN_LINE = '[[48.1,11.5],[48.112,11.5]]';

/**
 * A city walk at revision 3 from the gate past the protected cathedral and
 * the market to the park (a must), on day 1 where the gate was visited and
 * the market skipped; a bakery of the trip. `line` false saves it with its
 * stations only, its measures unknown.
 */
async function fixture({ line = true } = {}) {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const day1 = await makeDay(orm(), trip.id, { day_number: 1 });
  const walk = await makePlace(orm(), trip.id, { name: 'Old town', route_geometry: line ? OLD_TOWN_LINE : null });
  const measures = line ? { distance: 1.6, duration: 22 } : { distance: null, duration: null };
  await makeTour(orm(), walk.id, { tourTypeRef: 'walk', revision: 3, ...measures });
  await addTourWaypoints(orm(), walk.id, [
    { lat: 48.1, lng: 11.5, station_key: 'stop-gate', name: 'Gate', stay_minutes: 0 },
    { lat: 48.104, lng: 11.5, station_key: 'stop-cathedral', name: 'Cathedral', stay_minutes: 30, protected: 1 },
    { lat: 48.108, lng: 11.5, station_key: 'stop-market', name: 'Market', stay_minutes: 20 },
    { lat: 48.112, lng: 11.5, station_key: 'stop-park', name: 'Park', importance: 'must' },
  ]);
  const onDay1 = await makeDayAssignment(orm(), day1.id, walk.id);
  await markStationVisit(orm(), onDay1.id, 'stop-gate', 'visited');
  await markStationVisit(orm(), onDay1.id, 'stop-market', 'skipped');
  const bakery = await makePlace(orm(), trip.id, { name: 'Bakery', lat: 48.109, lng: 11.501 });
  return { user, outsider, trip, walk, onDay1, bakery };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;

/** A stop at the bakery after the market and a beer garden in the place of the park. */
const stopAndSwap = (bakeryId: number): TourChange[] => [
  {
    op: 'add',
    station: { lat: 48.109, lng: 11.501, name: 'Bakery', stay_minutes: 15, linked_place_id: bakeryId },
    after_key: 'stop-market',
  },
  { op: 'replace', key: 'stop-park', station: { lat: 48.113, lng: 11.502, name: 'Beer garden' } },
];

/** The changes prepared and saved as the traveller confirmed them; answers what the save answered. */
async function saved(f: Fixture, changes: TourChange[]) {
  const changeMcp = t.get(TourChangeMcp);
  const tour = { tripId: f.trip.id, placeId: f.walk.id };
  const proposal = read(await changeMcp.prepareTourChange({ ...tour, changes }, ctx(f.user.id)));
  const request = {
    changes,
    expected_revision: proposal.base.revision,
    proposal_id: proposal.proposal_id,
    confirmed: true as const,
  };
  const answer = read(await changeMcp.saveTourChange({ ...tour, ...request }, ctx(f.user.id)));
  t.realtime.broadcastMock.mockReset();
  return answer;
}

const listed = async (f: Fixture, userId = f.user.id) =>
  read(await mcp.listTourChangeSteps({ tripId: f.trip.id, placeId: f.walk.id }, ctx(userId)));
const prepared = (f: Fixture, stepId: number, userId = f.user.id) =>
  mcp.prepareTourUndo({ tripId: f.trip.id, placeId: f.walk.id, stepId }, ctx(userId));
const undone = (f: Fixture, request: TourChangeUndoRequest, userId = f.user.id) =>
  mcp.undoTourChange({ tripId: f.trip.id, placeId: f.walk.id, ...request }, ctx(userId));
const confirmed = (step_id: number, expected_revision: number): TourChangeUndoRequest => ({
  step_id,
  expected_revision,
  confirmed: true,
});

/** What a refused or failed undo must leave as it is. */
const untouched = async (placeId: number) => [
  await countRows(orm(), Places, {}),
  await countRows(orm(), TourStationVisits, {}),
  await countRows(orm(), DayAssignments, {}),
  (await findRows(orm(), TourChangeSteps, {}, { id: 'asc' })).map((step) => step.undone_revision),
  (await findRow(orm(), Tours, { place: placeId }))?.revision,
  (await findRow(orm(), Places, { id: placeId }))?.route_geometry,
  (await findRows(orm(), TourWaypoints, { place: placeId }, { sequence: 'asc' })).map((point) => point.station_key),
];

describe('TourChangeUndoMcp (MCP-T04)', () => {
  it('TCHG-UNDO-001: the latest step is listed, previewed and taken back, restoring the tour exactly and read back the same', async () => {
    const f = await fixture();
    const save = await saved(f, stopAndSwap(f.bakery.id));
    const [bakeryKey, beerKey] = [save.stations[3].key, save.stations[4].key];

    const list = await listed(f);
    expect(list).toMatchObject({
      tour: { place_id: f.walk.id, name: 'Old town', tour_type: 'walk', revision: 4 },
      listed_at_most: TOUR_CHANGE_STEPS_LISTED,
    });
    expect(list.steps).toEqual([
      {
        id: save.step.id,
        saved_at: expect.any(String),
        base_revision: 3,
        revision: 4,
        changes: stopAndSwap(f.bakery.id),
        standing: 'latest',
        undone: null,
      },
    ]);

    route.mockClear();
    const preview = read(await prepared(f, save.step.id));
    expect(preview).toMatchObject({
      prepared_only: true,
      step: { id: save.step.id, base_revision: 3, revision: 4, changes: stopAndSwap(f.bakery.id) },
      now: { walking_minutes: 27, route_pending: false },
      restored: { distance_km: 1.6, walking_minutes: 22, route_pending: false },
      undo: { step_id: save.step.id, expected_revision: 4 },
      can_undo: true,
    });
    expect(preview.now.stations.map((s: { name: string; done: boolean }) => [s.name, s.done])).toEqual([
      ['Gate', true],
      ['Cathedral', false],
      ['Market', true],
      ['Bakery', false],
      ['Beer garden', false],
    ]);
    expect(preview.restored.stations).toEqual([
      { position: 1, key: 'stop-gate', name: 'Gate', change: 'kept', now_position: 1 },
      { position: 2, key: 'stop-cathedral', name: 'Cathedral', change: 'kept', now_position: 2 },
      { position: 3, key: 'stop-market', name: 'Market', change: 'kept', now_position: 3 },
      { position: 4, key: 'stop-park', name: 'Park', change: 'back', now_position: null },
    ]);
    expect(preview.removed).toEqual([
      { key: bakeryKey, name: 'Bakery', position: 4 },
      { key: beerKey, name: 'Beer garden', position: 5 },
    ]);
    // The preview wrote nothing and planned no way: the tour is restored as stored.
    expect((await findRow(orm(), Tours, { place: f.walk.id }))?.revision).toBe(4);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();

    const answer = read(await undone(f, confirmed(preview.undo.step_id, preview.undo.expected_revision)));

    expect(answer).toEqual({
      undone: true,
      step: { id: save.step.id, revision: 4, undone_revision: 5 },
      tour: {
        place_id: f.walk.id,
        name: 'Old town',
        tour_type: 'walk',
        revision: 5,
        distance_km: 1.6,
        walking_minutes: 22,
        route_pending: false,
      },
      stations: [
        { position: 1, key: 'stop-gate', name: 'Gate' },
        { position: 2, key: 'stop-cathedral', name: 'Cathedral' },
        { position: 3, key: 'stop-market', name: 'Market' },
        { position: 4, key: 'stop-park', name: 'Park' },
      ],
    });
    expect(route).not.toHaveBeenCalled();

    // Restored: the line, the start, the points with their keys and what they carried, the measures, the visits.
    const place = await findRow(orm(), Places, { id: f.walk.id });
    expect([place?.route_geometry, place?.lat, place?.lng]).toEqual([OLD_TOWN_LINE, 48.1, 11.5]);
    const points = await findRows(orm(), TourWaypoints, { place: f.walk.id }, { sequence: 'asc' });
    expect(points.map((point) => [point.station_key, point.role, point.protected, point.importance])).toEqual([
      ['stop-gate', 'start', 0, null],
      ['stop-cathedral', 'via', 1, null],
      ['stop-market', 'via', 0, null],
      ['stop-park', 'end', 0, 'must'],
    ]);
    const tour = await findRow(orm(), Tours, { place: f.walk.id });
    expect([tour?.revision, tour?.distance, tour?.duration]).toEqual([5, 1.6, 22]);
    expect(await countRows(orm(), TourStationVisits, {})).toBe(2);
    const step = await findRow(orm(), TourChangeSteps, { id: save.step.id });
    expect([step?.undone_revision, step?.undone_by]).toEqual([5, f.user.id]);
    expect(step?.undone_at).toEqual(expect.any(String));

    // Every client of the trip is told, after the commit.
    const events = t.realtime.broadcastMock.mock.calls.map(([tripId, event]) => [tripId, event]);
    expect(events).toEqual([
      [String(f.trip.id), 'tours:changed'],
      [String(f.trip.id), 'place:updated'],
    ]);

    // The tour read again says what taking back answered, and the step says it was taken back.
    const plan = read(await t.get(ToursMcp).getTourPlan({ tripId: f.trip.id, placeId: f.walk.id }, ctx(f.user.id)));
    expect(plan.tour).toMatchObject({ revision: 5, distance: 1.6, duration: 22 });
    expect(plan.waypoints.map((point: { key: string }) => point.key)).toEqual(
      answer.stations.map((s: { key: string }) => s.key),
    );
    expect((await listed(f)).steps[0]).toMatchObject({
      standing: 'undone',
      undone: { revision: 5, at: expect.any(String) },
    });
  });

  it('TCHG-UNDO-002: a step something was saved on top of is a conflict, while the latest one still goes back alone', async () => {
    const f = await fixture();
    const first = await saved(f, stopAndSwap(f.bakery.id));
    const second = await saved(f, [{ op: 'remove', key: first.stations[3].key }]);

    expect((await listed(f)).steps.map((s: { id: number; standing: string }) => [s.id, s.standing])).toEqual([
      [second.step.id, 'latest'],
      [first.step.id, 'later_change'],
    ]);
    const before = await untouched(f.walk.id);
    const asPrepared = await refusal(prepared(f, first.step.id));
    const asUndone = await refusal(undone(f, confirmed(first.step.id, 5)));
    for (const err of [asPrepared, asUndone]) {
      expect([err.getStatus(), err.code, err.details?.revision]).toEqual([409, TOUR_REVISION_CONFLICT, 5]);
      expect(err.publicMessage).toContain('(revision 4 then, 5 now). Nothing changed: only the latest change');
    }
    expect(await untouched(f.walk.id)).toEqual(before);

    // The latest step goes back to the walk the first one left; the first stays where it is.
    const answer = read(await undone(f, confirmed(second.step.id, 5)));
    expect(answer.stations.map((s: { name: string }) => s.name)).toEqual([
      'Gate',
      'Cathedral',
      'Market',
      'Bakery',
      'Beer garden',
    ]);
    expect((await listed(f)).steps.map((s: { standing: string }) => s.standing)).toEqual(['undone', 'later_change']);
  });

  it('TCHG-UNDO-003: a step is taken back once, and a preview read at another revision is a conflict', async () => {
    const f = await fixture();
    const save = await saved(f, stopAndSwap(f.bakery.id));

    const stale = await refusal(undone(f, confirmed(save.step.id, 3)));
    expect([stale.getStatus(), stale.code, stale.details?.revision]).toEqual([409, TOUR_REVISION_CONFLICT, 4]);
    expect(stale.publicMessage).toBe(
      'The tour is at revision 4 now, not 3 as the preview was read. Nothing changed: prepare taking the step back again with prepare_tour_undo.',
    );

    read(await undone(f, confirmed(save.step.id, 4)));
    const before = await untouched(f.walk.id);
    const again = await refusal(undone(f, confirmed(save.step.id, 5)));
    expect([again.getStatus(), again.code]).toEqual([409, TOUR_CHANGE_STEP_UNDONE]);
    expect(again.publicMessage).toBe(
      'This step was taken back already, which raised the tour to revision 5. Nothing changed.',
    );
    expect(await untouched(f.walk.id)).toEqual(before);
  });

  it('TCHG-UNDO-004: a station visited since that taking back would remove refuses it with every reason', async () => {
    const f = await fixture();
    const save = await saved(f, stopAndSwap(f.bakery.id));
    const bakeryKey = save.stations[3].key;
    await markStationVisit(orm(), f.onDay1.id, bakeryKey, 'visited');
    const before = await untouched(f.walk.id);

    const asPrepared = await refusal(prepared(f, save.step.id));
    const asUndone = await refusal(undone(f, confirmed(save.step.id, 4)));
    for (const err of [asPrepared, asUndone]) {
      expect([err.getStatus(), err.code]).toEqual([409, TOUR_CHANGE_UNDO_REFUSED]);
      expect(err.details?.refused).toEqual([
        {
          why: 'station_done',
          key: bakeryKey,
          name: 'Bakery',
          days: [{ day_id: expect.any(Number), status: 'visited' }],
        },
      ]);
      expect(err.publicMessage).toMatch(
        /^Taking this step back would lose what was done since\. Nothing changed\.\nStation /,
      );
    }
    expect(await untouched(f.walk.id)).toEqual(before);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TCHG-UNDO-005: a station whose place of the trip is gone refuses bringing it back', async () => {
    const f = await fixture();
    const first = await saved(f, stopAndSwap(f.bakery.id));
    const second = await saved(f, [{ op: 'remove', key: first.stations[3].key }]);
    await deleteRows(orm(), Places, { id: f.bakery.id });

    const err = await refusal(prepared(f, second.step.id));
    expect([err.getStatus(), err.code]).toEqual([409, TOUR_CHANGE_UNDO_REFUSED]);
    expect(err.details?.refused).toEqual([
      { why: 'place_gone', key: first.stations[3].key, name: 'Bakery', linked_place_id: f.bakery.id },
    ]);
  });

  it('TCHG-UNDO-006: a step without a readable earlier tour, or one this tour does not have, is refused', async () => {
    const f = await fixture();
    const save = await saved(f, stopAndSwap(f.bakery.id));
    const other = await makePlace(orm(), f.trip.id, { name: 'Harbour' });
    await makeTour(orm(), other.id, { tourTypeRef: 'walk', revision: 1 });

    const missing = await refusal(prepared(f, save.step.id + 100));
    expect([missing.getStatus(), missing.code]).toEqual([404, TOUR_CHANGE_STEP_NOT_FOUND]);
    const elsewhere = await refusal(
      mcp.prepareTourUndo({ tripId: f.trip.id, placeId: other.id, stepId: save.step.id }, ctx(f.user.id)),
    );
    expect(elsewhere.code).toBe(TOUR_CHANGE_STEP_NOT_FOUND);

    await updateRows(orm(), TourChangeSteps, { id: save.step.id }, { before_state: '{"waypoints":"broken"' });
    expect((await listed(f)).steps[0].standing).toBe('no_earlier_state');
    const before = await untouched(f.walk.id);
    const broken = await refusal(undone(f, confirmed(save.step.id, 4)));
    expect([broken.getStatus(), broken.code]).toEqual([409, TOUR_CHANGE_STEP_WITHOUT_EARLIER_STATE]);
    expect(await untouched(f.walk.id)).toEqual(before);
  });

  it('TCHG-UNDO-007: a failure inside the write, or a step taken back meanwhile, rolls the whole restore back', async () => {
    const f = await fixture();
    const save = await saved(f, stopAndSwap(f.bakery.id));
    const before = await untouched(f.walk.id);

    const failure = new Error('disk full');
    const mark = vi.spyOn(TourChangeStepsRepository.prototype, 'markUndone').mockRejectedValueOnce(failure);
    try {
      await expect(undone(f, confirmed(save.step.id, 4))).rejects.toBe(failure);
      mark.mockResolvedValueOnce(false);
      const meanwhile = await refusal(undone(f, confirmed(save.step.id, 4)));
      expect([meanwhile.code, meanwhile.publicMessage]).toEqual([
        TOUR_CHANGE_STEP_UNDONE,
        'This step was taken back meanwhile. Nothing changed.',
      ]);
    } finally {
      mark.mockRestore();
    }
    expect(await untouched(f.walk.id)).toEqual(before);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TCHG-UNDO-008: a walk that waited for its way before the step waits for it again', async () => {
    const f = await fixture({ line: false });
    const save = await saved(f, [{ op: 'remove', key: 'stop-park' }]);
    expect(save.tour.route_pending).toBe(false);

    const preview = read(await prepared(f, save.step.id));
    expect(preview.restored).toMatchObject({ distance_km: null, walking_minutes: null, route_pending: true });

    const answer = read(await undone(f, confirmed(save.step.id, 4)));
    expect(answer.tour).toMatchObject({ revision: 5, distance_km: null, walking_minutes: null, route_pending: true });
    const place = await findRow(orm(), Places, { id: f.walk.id });
    expect([place?.route_geometry, place?.lat, place?.lng]).toEqual([null, 48.1, 11.5]);
    expect(answer.stations.map((s: { key: string }) => s.key)).toEqual([
      'stop-gate',
      'stop-cathedral',
      'stop-market',
      'stop-park',
    ]);
  });

  it('TCHG-UNDO-009: only a traveller of the trip reads the steps, and only one with place editing takes one back', async () => {
    const f = await fixture();
    const save = await saved(f, stopAndSwap(f.bakery.id));
    const before = await untouched(f.walk.id);
    const noAccess = { error: 'Trip not found or access denied.' };

    expect(await listed(f, f.outsider.id)).toEqual(noAccess);
    expect(read(await prepared(f, save.step.id, f.outsider.id))).toEqual(noAccess);
    expect(read(await undone(f, confirmed(save.step.id, 4), f.outsider.id))).toEqual(noAccess);

    const guard = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValue(false);
    try {
      expect(read(await prepared(f, save.step.id)).can_undo).toBe(false);
      expect(read(await undone(f, confirmed(save.step.id, 4)))).toEqual({
        error: 'You do not have permission to perform this action on this trip.',
      });
      expect(guard).toHaveBeenCalledWith('place_edit', f.trip.id, f.user.id);
    } finally {
      guard.mockRestore();
    }

    const noTour = { error: 'Tour not found.' };
    const bakery = { tripId: f.trip.id, placeId: f.bakery.id };
    expect(read(await mcp.listTourChangeSteps(bakery, ctx(f.user.id)))).toEqual(noTour);
    expect(read(await mcp.prepareTourUndo({ ...bakery, stepId: save.step.id }, ctx(f.user.id)))).toEqual(noTour);
    const undoBakery = await mcp.undoTourChange({ ...bakery, ...confirmed(save.step.id, 4) }, ctx(f.user.id));
    expect(read(undoBakery)).toEqual(noTour);
    expect(await untouched(f.walk.id)).toEqual(before);
  });

  it('TCHG-UNDO-010: the listing and the preview read, taking back writes, all on the Tours addon and never without the yes', async () => {
    const tools = [
      ['listTourChangeSteps', 'list_tour_change_steps', true, 'read', ['tripId', 'placeId']],
      ['prepareTourUndo', 'prepare_tour_undo', true, 'read', ['tripId', 'placeId', 'stepId']],
      [
        'undoTourChange',
        'undo_tour_change',
        false,
        'write',
        ['tripId', 'placeId', 'step_id', 'expected_revision', 'confirmed'],
      ],
    ] as const;
    const gates = tools.map(([method, name, readOnly, mode, fields]) => {
      const entry = getEntry(TourChangeUndoMcp as unknown as ClassRef, method);
      if (!entry || entry.kind !== 'tool') throw new Error(`${method} is no MCP tool`);
      const { options } = entry;
      expect([options.name, options.annotations?.readOnlyHint, options.access]).toEqual([
        name,
        readOnly,
        { group: 'trips', mode },
      ]);
      expect(Object.keys(options.inputSchema as object)).toEqual([...fields]);
      expect(options.description).toContain('planner');
      const isAddonEnabled = vi.fn(async (id: string) => id === 'tours');
      return { isAddonEnabled, open: options.when?.(ctx(1), { addons: { isAddonEnabled } }) };
    });
    expect(await Promise.all(gates.map((gate) => gate.open))).toEqual([true, true, true]);
    for (const { isAddonEnabled } of gates) expect(isAddonEnabled).toHaveBeenCalledWith('tours');
    const entry = getEntry(TourChangeUndoMcp as unknown as ClassRef, 'undoTourChange');
    if (!entry || entry.kind !== 'tool') throw new Error('undoTourChange is no MCP tool');
    // The fields are zod schemas from @trek/shared, read here by what they answer.
    const confirmed = z.object(entry.options.inputSchema as ZodRawShape).pick({ confirmed: true });
    const yes = [true, false, undefined].map((value) => confirmed.safeParse({ confirmed: value }).success);
    expect(yes).toEqual([true, false, false]);
    for (const term of ['prepare_tour_undo', 'expected_revision', 'conflict', 'get_tour_plan']) {
      expect(entry.options.description).toContain(term);
    }
  });
});
