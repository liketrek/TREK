/**
 * TourChangeMcp.saveTourChange (MCP-T03): a prepared change to a saved city
 * walk the traveller confirmed, saved whole or not at all through the tour's
 * own write. The save names the proposal and the revision it was prepared on;
 * a tour that moved on is a conflict, a change the rules no longer allow is
 * refused inside the write, and a failure leaves the tour as it was. Every
 * save records its step with the tour as it was before. The suite takes its
 * subject from the container over a snapshot test db, plans the way on foot
 * with a stub of the road trip's router and seeds through the ORM factories.
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
import { TOUR_CHANGE_REFUSED } from '../../../src/nest/tours/tour-change-preview.service';
import { proposalIdOf } from '../../../src/nest/tours/tour-change-proposal';
import { TOUR_CHANGE_NOT_PREPARED } from '../../../src/nest/tours/tour-change-save.service';
import { TourChangeMcp } from '../../../src/nest/tours/tour-change.mcp';
import { ToursMcp } from '../../../src/nest/tours/tours.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour, markStationVisit } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { stationKeySchema, TOUR_REVISION_CONFLICT, type TourChange, type TourChangeSaveRequest } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z, type ZodRawShape } from 'zod';

const db = createSnapshotTestDb();
const route = vi.fn();
let t: TestModule;
let mcp: TourChangeMcp;
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
  mcp = t.get(TourChangeMcp);
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

/** The refusal a save raised, which the registry answers with its text. */
async function refusal(promise: Promise<unknown>): Promise<DomainError> {
  const err = await catchDomainError(() => promise);
  if (!(err instanceof DomainError)) throw new Error('no refusal');
  return err;
}

/**
 * A city walk at revision 3 from the gate past the protected cathedral and
 * the market to the park (a must), on day 1 where the gate was visited and
 * the market skipped; a bakery of the trip.
 */
async function fixture() {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const day1 = await makeDay(orm(), trip.id, { day_number: 1 });
  const walk = await makePlace(orm(), trip.id, { name: 'Old town', route_geometry: '[[48.1,11.5],[48.112,11.5]]' });
  await makeTour(orm(), walk.id, { tourTypeRef: 'walk', revision: 3, distance: 1.6, duration: 22 });
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

/** A stop at the bakery after the market and a beer garden in the place of the park. */
const stopAndSwap = (bakeryId: number): TourChange[] => [
  {
    op: 'add',
    station: { lat: 48.109, lng: 11.501, name: 'Bakery', stay_minutes: 15, linked_place_id: bakeryId },
    after_key: 'stop-market',
  },
  { op: 'replace', key: 'stop-park', station: { lat: 48.113, lng: 11.502, name: 'Beer garden' } },
];

/** What a refused or failed save must leave as it is. */
const untouched = async (placeId: number) => [
  await countRows(orm(), Places, {}),
  await countRows(orm(), TourWaypoints, {}),
  await countRows(orm(), TourStationVisits, {}),
  await countRows(orm(), DayAssignments, {}),
  await countRows(orm(), TourChangeSteps, {}),
  (await findRow(orm(), Tours, { place: placeId }))?.revision,
  (await findRow(orm(), Places, { id: placeId }))?.route_geometry,
  (await findRows(orm(), TourWaypoints, { place: placeId }, { sequence: 'asc' })).map((point) => point.station_key),
];

/** Prepares the changes as the traveller is shown them, and the save of exactly that proposal. */
async function prepared(tripId: number, placeId: number, changes: TourChange[], userId: number) {
  const proposal = read(await mcp.prepareTourChange({ tripId, placeId, changes }, ctx(userId)));
  const request: TourChangeSaveRequest = {
    changes,
    expected_revision: proposal.base.revision,
    proposal_id: proposal.proposal_id,
    confirmed: true,
  };
  return { proposal, request };
}

const saveAs = (tripId: number, placeId: number, request: TourChangeSaveRequest, userId: number) =>
  mcp.saveTourChange({ tripId, placeId, ...request }, ctx(userId));

describe('TourChangeMcp.saveTourChange (MCP-T03)', () => {
  it('TCHG-SAVE-001: the confirmed proposal is saved whole, its step recorded with the tour as it was, and read back the same', async () => {
    const f = await fixture();
    const changes = stopAndSwap(f.bakery.id);
    const { proposal, request } = await prepared(f.trip.id, f.walk.id, changes, f.user.id);
    expect(proposal.proposal_id).toMatch(/^[0-9a-f]{32}$/);
    route.mockClear();

    const saved = read(await saveAs(f.trip.id, f.walk.id, request, f.user.id));

    expect(saved).toMatchObject({
      saved: true,
      step: { id: expect.any(Number), base_revision: 3, revision: 4 },
      tour: { place_id: f.walk.id, name: 'Old town', tour_type: 'walk', revision: 4, walking_minutes: 27 },
      foot_way: { planned: true },
    });
    expect(saved.tour.distance_km).toBeGreaterThan(0);
    expect(saved.tour.route_pending).toBe(false);
    expect(saved.stations.map((s: { name: string }) => s.name)).toEqual([
      'Gate',
      'Cathedral',
      'Market',
      'Bakery',
      'Beer garden',
    ]);
    expect(saved.stations.slice(0, 3).map((s: { key: string }) => s.key)).toEqual([
      'stop-gate',
      'stop-cathedral',
      'stop-market',
    ]);
    expect(saved.stations.every((s: { key: string }) => stationKeySchema.safeParse(s.key).success)).toBe(true);
    // The way on foot is planned once more through exactly the points saved.
    const after: Array<[number, number]> = [
      [48.1, 11.5],
      [48.104, 11.5],
      [48.108, 11.5],
      [48.109, 11.501],
      [48.113, 11.502],
    ];
    expect(route).toHaveBeenCalledExactlyOnceWith(
      f.user.id,
      f.trip.id,
      0,
      after.map(([lat, lng]) => ({ lat, lng })),
      'walking',
      [],
      { footOnly: true },
    );

    // Saved: the line, the points with the kept keys and the link, the measures, the visits as they were.
    expect((await findRow(orm(), Places, { id: f.walk.id }))?.route_geometry).toBe(JSON.stringify(after));
    const points = await findRows(orm(), TourWaypoints, { place: f.walk.id }, { sequence: 'asc' });
    expect(points.map((point) => [point.name, point.role])).toEqual([
      ['Gate', 'start'],
      ['Cathedral', 'via'],
      ['Market', 'via'],
      ['Bakery', 'via'],
      ['Beer garden', 'end'],
    ]);
    const tour = await findRow(orm(), Tours, { place: f.walk.id });
    expect([tour?.revision, tour?.duration]).toEqual([4, 27]);
    expect(await countRows(orm(), TourStationVisits, {})).toBe(2);

    // The step: the proposal, both revisions, the changes and the tour before them; nothing else.
    const step = await findRow(orm(), TourChangeSteps, { id: saved.step.id });
    expect(step).toMatchObject({
      proposal_id: request.proposal_id,
      base_revision: 3,
      revision: 4,
      saved_by: f.user.id,
    });
    expect(JSON.parse(step?.changes ?? '')).toEqual(changes);
    const before = JSON.parse(step?.before_state ?? '');
    expect(before).toMatchObject({
      route_geometry: [
        [48.1, 11.5],
        [48.112, 11.5],
      ],
      distance: 1.6,
      duration: 22,
      elevation_gain: null,
      elevation_loss: null,
    });
    expect(before.waypoints.map((point: { key: string }) => point.key)).toEqual([
      'stop-gate',
      'stop-cathedral',
      'stop-market',
      'stop-park',
    ]);

    // Every client of the trip is told; no day lost a visit.
    const events = t.realtime.broadcastMock.mock.calls.map(([tripId, event]) => [tripId, event]);
    expect(events).toEqual([
      [String(f.trip.id), 'tours:changed'],
      [String(f.trip.id), 'place:updated'],
    ]);

    // The tour read again says what the save answered.
    const plan = read(await t.get(ToursMcp).getTourPlan({ tripId: f.trip.id, placeId: f.walk.id }, ctx(f.user.id)));
    expect(plan.tour.revision).toBe(4);
    expect(plan.waypoints.map((point: { key: string }) => point.key)).toEqual(
      saved.stations.map((s: { key: string }) => s.key),
    );
    expect(plan.waypoints[3]).toMatchObject({ name: 'Bakery', stay_minutes: 15, linked_place_id: f.bakery.id });
  });

  it('TCHG-SAVE-002: a tour changed since the proposal was prepared is a conflict, and nothing is written', async () => {
    const f = await fixture();
    const { request } = await prepared(f.trip.id, f.walk.id, stopAndSwap(f.bakery.id), f.user.id);
    await updateRows(orm(), Tours, { place: f.walk.id }, { revision: 4 });
    const before = await untouched(f.walk.id);
    route.mockClear();

    const err = await refusal(saveAs(f.trip.id, f.walk.id, request, f.user.id));

    expect([err.getStatus(), err.code, err.details?.revision]).toEqual([409, TOUR_REVISION_CONFLICT, 4]);
    expect(err.publicMessage).toContain('(revision 3 then, 4 now). Nothing was saved');
    expect(route).not.toHaveBeenCalled();
    expect(await untouched(f.walk.id)).toEqual(before);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TCHG-SAVE-003: anything but the proposal as prepared is refused before the tour is read', async () => {
    const f = await fixture();
    const { request } = await prepared(f.trip.id, f.walk.id, stopAndSwap(f.bakery.id), f.user.id);
    const before = await untouched(f.walk.id);
    route.mockClear();
    const altered: TourChangeSaveRequest[] = [
      { ...request, changes: [{ op: 'remove', key: 'stop-park' }] },
      { ...request, expected_revision: 2 },
      { ...request, proposal_id: 'f'.repeat(32) },
    ];
    const refusals = await Promise.all(altered.map((body) => refusal(saveAs(f.trip.id, f.walk.id, body, f.user.id))));
    for (const err of refusals) {
      expect([err.getStatus(), err.code]).toEqual([422, TOUR_CHANGE_NOT_PREPARED]);
      expect(err.publicMessage).toMatch(/^These changes are not the proposal that was prepared\. Nothing was saved/);
    }
    // The same proposal saved for another tour of the trip is another proposal.
    const err = await refusal(saveAs(f.trip.id, f.bakery.id, request, f.user.id));
    expect(err.code).toBe(TOUR_CHANGE_NOT_PREPARED);
    expect(route).not.toHaveBeenCalled();
    expect(await untouched(f.walk.id)).toEqual(before);
  });

  it('TCHG-SAVE-004: a station done meanwhile refuses the save, also when it happens while the way is planned', async () => {
    const f = await fixture();
    const changes: TourChange[] = [{ op: 'remove', key: 'stop-park' }];
    const { request } = await prepared(f.trip.id, f.walk.id, changes, f.user.id);

    // Ticked off while the router plans the way: the write lays the changes again and refuses.
    route.mockImplementationOnce(async (...args: Parameters<typeof routedOnFoot>) => {
      await markStationVisit(orm(), f.onDay1.id, 'stop-park', 'visited');
      return await routedOnFoot(...args);
    });
    const during = await refusal(saveAs(f.trip.id, f.walk.id, request, f.user.id));
    expect([during.getStatus(), during.code]).toEqual([422, TOUR_CHANGE_REFUSED]);
    expect(during.publicMessage).toMatch(/^Nothing was saved and nothing changed\.\nChange 1 \(remove stop-park\)/);
    expect((await findRow(orm(), Tours, { place: f.walk.id }))?.revision).toBe(3);
    expect(await countRows(orm(), TourWaypoints, { place: f.walk.id })).toBe(4);
    expect(await countRows(orm(), TourChangeSteps, {})).toBe(0);

    // Once done, the save is refused before the way is planned at all.
    route.mockClear();
    const after = await refusal(saveAs(f.trip.id, f.walk.id, request, f.user.id));
    expect(after.code).toBe(TOUR_CHANGE_REFUSED);
    expect(after.publicMessage).toMatch(/^Nothing was saved and nothing changed\./);
    expect(route).not.toHaveBeenCalled();
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TCHG-SAVE-005: a failure inside the write rolls the whole save back', async () => {
    const f = await fixture();
    const { request } = await prepared(f.trip.id, f.walk.id, stopAndSwap(f.bakery.id), f.user.id);
    const before = await untouched(f.walk.id);
    const failure = new Error('disk full');
    const record = vi.spyOn(TourChangeStepsRepository.prototype, 'record').mockRejectedValueOnce(failure);
    try {
      await expect(saveAs(f.trip.id, f.walk.id, request, f.user.id)).rejects.toBe(failure);
    } finally {
      record.mockRestore();
    }
    expect(await untouched(f.walk.id)).toEqual(before);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TCHG-SAVE-006: without a way from the router the walk keeps its stations only and waits for the planner', async () => {
    const f = await fixture();
    const { request } = await prepared(f.trip.id, f.walk.id, [{ op: 'remove', key: 'stop-park' }], f.user.id);
    route.mockReset().mockRejectedValue(new Error('Routing provider returned 503'));

    const saved = read(await saveAs(f.trip.id, f.walk.id, request, f.user.id));

    expect(saved.foot_way).toEqual({ planned: false, why: 'router_unavailable', position: null });
    expect(saved.tour).toMatchObject({ revision: 4, distance_km: null, walking_minutes: null, route_pending: true });
    const place = await findRow(orm(), Places, { id: f.walk.id });
    expect([place?.route_geometry, place?.lat, place?.lng]).toEqual([null, 48.1, 11.5]);
    expect(saved.stations.map((s: { key: string }) => s.key)).toEqual(['stop-gate', 'stop-cathedral', 'stop-market']);
  });

  it('TCHG-SAVE-007: only a traveller of the trip with place editing saves, and only a tour', async () => {
    const f = await fixture();
    const changes: TourChange[] = [{ op: 'remove', key: 'stop-park' }];
    const { request } = await prepared(f.trip.id, f.walk.id, changes, f.user.id);
    const before = await untouched(f.walk.id);

    expect(read(await saveAs(f.trip.id, f.walk.id, request, f.outsider.id))).toEqual({
      error: 'Trip not found or access denied.',
    });
    const guard = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValueOnce(false);
    try {
      expect(read(await saveAs(f.trip.id, f.walk.id, request, f.user.id))).toEqual({
        error: 'You do not have permission to perform this action on this trip.',
      });
      expect(guard).toHaveBeenCalledWith('place_edit', f.trip.id, f.user.id);
    } finally {
      guard.mockRestore();
    }
    const proposalId = proposalIdOf({ tripId: f.trip.id, placeId: f.bakery.id, revision: 3, changes });
    const noTour = { ...request, proposal_id: proposalId };
    expect(read(await saveAs(f.trip.id, f.bakery.id, noTour, f.user.id))).toEqual({ error: 'Tour not found.' });
    expect(await untouched(f.walk.id)).toEqual(before);
  });

  it('TCHG-SAVE-008: the write of a tour needs a point to start at when it comes without a line', async () => {
    const err = await refusal(
      t.get(ToursService).routeWrite({
        name: 'Old town',
        tour_type: 'walk',
        max_hiking_difficulty: null,
        route_geometry: null,
        waypoints: [],
      }),
    );
    expect([err.getStatus(), err.publicMessage]).toEqual([400, 'A tour needs at least two points']);
  });

  it('TCHG-SAVE-009: save_tour_change writes, on the Tours addon, and takes nothing without the yes', async () => {
    const entry = getEntry(TourChangeMcp as unknown as ClassRef, 'saveTourChange');
    if (!entry || entry.kind !== 'tool') throw new Error('saveTourChange is no MCP tool');
    const { options } = entry;
    expect([options.name, options.annotations?.readOnlyHint, options.access]).toEqual([
      'save_tour_change',
      false,
      { group: 'trips', mode: 'write' },
    ]);
    const terms = [
      'confirmed',
      'expected_revision',
      'proposal_id',
      'conflict',
      'already_saved',
      'get_tour_plan',
      'create_city_walk',
    ];
    for (const term of terms) expect(options.description).toContain(term);
    // The fields are zod schemas from @trek/shared, read here by what they answer.
    const fields = ['tripId', 'placeId', 'changes', 'expected_revision', 'proposal_id', 'confirmed'];
    expect(Object.keys(options.inputSchema as ZodRawShape)).toEqual(fields);
    const confirmed = z.object(options.inputSchema as ZodRawShape).pick({ confirmed: true });
    const yes = [true, false, undefined].map((value) => confirmed.safeParse({ confirmed: value }).success);
    expect(yes).toEqual([true, false, false]);
    const isAddonEnabled = vi.fn(async (id: string) => id === 'tours');
    expect(await options.when?.(ctx(1), { addons: { isAddonEnabled } })).toBe(true);
    expect(isAddonEnabled).toHaveBeenCalledWith('tours');
  });

  it('TCHG-SAVE-010: a save sent again once saved writes nothing and answers the step it was saved as', async () => {
    const f = await fixture();
    const { request } = await prepared(f.trip.id, f.walk.id, stopAndSwap(f.bakery.id), f.user.id);
    const first = read(await saveAs(f.trip.id, f.walk.id, request, f.user.id));
    const before = await untouched(f.walk.id);
    route.mockClear();
    t.realtime.broadcastMock.mockClear();

    const again = read(await saveAs(f.trip.id, f.walk.id, request, f.user.id));

    expect(again).toEqual({
      saved: true,
      already_saved: true,
      step: { id: first.step.id, base_revision: 3, revision: 4 },
      undone_revision: null,
      message: expect.stringContaining(
        `This very proposal was already saved as step ${first.step.id}, raising the tour to revision 4`,
      ),
    });
    expect(again.message).toContain('Do not prepare or save it again');
    // Not the conflict of a tour that moved on, which would send the assistant to prepare it anew.
    expect(again.message).not.toContain('prepare the change anew');
    expect(route).not.toHaveBeenCalled();
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
    expect(await untouched(f.walk.id)).toEqual(before);

    // Taken back since, it still is the step it was saved as, and says so.
    await updateRows(orm(), TourChangeSteps, { id: first.step.id }, { undone_revision: 5 });
    const undone = read(await saveAs(f.trip.id, f.walk.id, request, f.user.id));
    expect([undone.already_saved, undone.undone_revision]).toEqual([true, 5]);
    expect(undone.message).toContain('It was taken back since, at revision 5');
    expect(await countRows(orm(), TourChangeSteps, {})).toBe(1);
  });

  it('TCHG-SAVE-011: of two saves of one proposal at once, the one that writes second writes nothing', async () => {
    const f = await fixture();
    const { request } = await prepared(f.trip.id, f.walk.id, stopAndSwap(f.bakery.id), f.user.id);
    const firstSave: { answer?: { saved: boolean; step: { id: number } } } = {};
    // The same save sent again lands while this one plans its way, and commits first.
    route.mockImplementationOnce(async (...args: Parameters<typeof routedOnFoot>) => {
      firstSave.answer = read(await saveAs(f.trip.id, f.walk.id, request, f.user.id));
      return await routedOnFoot(...args);
    });

    const second = read(await saveAs(f.trip.id, f.walk.id, request, f.user.id));

    expect(firstSave.answer).toMatchObject({ saved: true, step: { base_revision: 3, revision: 4 } });
    expect(second).toMatchObject({ already_saved: true, step: { id: firstSave.answer?.step.id, revision: 4 } });
    expect(await countRows(orm(), TourChangeSteps, {})).toBe(1);
    expect((await findRow(orm(), Tours, { place: f.walk.id }))?.revision).toBe(4);
    const points = await findRows(orm(), TourWaypoints, { place: f.walk.id }, { sequence: 'asc' });
    expect(points.map((point) => point.name)).toEqual(['Gate', 'Cathedral', 'Market', 'Bakery', 'Beer garden']);
  });
});
