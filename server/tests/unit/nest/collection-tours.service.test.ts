/**
 * CollectionToursService (LIB-03): whole tours kept in a collection and taken
 * into a trip again, over the container and a snapshot test db. A kept tour is
 * an independent snapshot made through the tours' one copy model; the
 * collection's roles decide who reads, keeps and removes one, and nothing is
 * kept in step afterwards.
 */
import { CollectionTours } from '../../../src/db/entities/CollectionTours.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { CollectionToursRepository } from '../../../src/db/repositories/CollectionTours.repository';
import { DomainError } from '../../../src/nest/common/domain-error';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { CollectionToursService } from '../../../src/nest/tours/collection-tours.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addCollectionMember, makeCollection } from '../../helpers/factories/collections';
import { makePlace } from '../../helpers/factories/places';
import { countRows, deleteRows, findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { getRepositoryToken } from '@mikro-orm/nestjs';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let service: CollectionToursService;

const LINE = [
  [47, 11, 600],
  [47.01, 11.01, 650],
  [47.02, 11.02, 630],
];

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  service = t.get(CollectionToursService);
  orm = await createTestOrm(db);
});
beforeEach(async () => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  t.realtime.broadcastToUserMock.mockClear();
  await setAddonEnabled(orm, 'collections', true);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

/** Status and text of a refusal. */
async function refusal(work: Promise<unknown>): Promise<{ status: number; error: string }> {
  try {
    await work;
  } catch (err) {
    if (err instanceof DomainError) return { status: err.getStatus(), error: err.publicMessage };
    const http = err as { getStatus?: () => number; message: string };
    return { status: http.getStatus?.() ?? 500, error: http.message };
  }
  throw new Error('expected a refusal');
}

/**
 * The owner's trips Alps (with a hike of three points, one standing for a
 * place of the trip) and Next, someone else's trip Away the owner is a member
 * of, a collection with an editor and a viewer, and an outsider.
 */
async function fixture() {
  const { user: owner } = await makeUser(orm, { username: 'owner' });
  const { user: editor } = await makeUser(orm, { username: 'editor' });
  const { user: viewer } = await makeUser(orm, { username: 'viewer' });
  const { user: outsider } = await makeUser(orm, { username: 'outsider' });
  const alps = await makeTrip(orm, owner.id, { title: 'Alps' });
  const next = await makeTrip(orm, owner.id, { title: 'Next' });
  const away = await makeTrip(orm, outsider.id, { title: 'Away' });
  await addTripMember(orm, away.id, owner.id);
  const hut = await makePlace(orm, alps.id, { name: 'Hut', lat: 47.01, lng: 11.01 });
  const ridge = await makePlace(orm, alps.id, {
    name: 'Ridge',
    lat: 47,
    lng: 11,
    description: 'Up high',
    route_geometry: JSON.stringify(LINE),
  });
  await makeTour(orm, ridge.id, { distance: 4.2, elevation_gain: 300, max_hiking_difficulty: 3, duration: 90 });
  await addTourWaypoints(orm, ridge.id, [
    { lat: 47, lng: 11 },
    { lat: 47.01, lng: 11.01, name: 'Hut', linkedPlace: hut.id, shaping: 0 },
    { lat: 47.015, lng: 11.015, shaping: 1 },
    { lat: 47.02, lng: 11.02 },
  ]);
  const list = await makeCollection(orm, owner.id, { name: 'Hikes' });
  await addCollectionMember(orm, list.id, editor.id, { role: 'editor' });
  await addCollectionMember(orm, list.id, viewer.id, { role: 'viewer' });
  return { owner, editor, viewer, outsider, alps, next, away, hut, ridge, list };
}

async function keep(f: Awaited<ReturnType<typeof fixture>>, name?: string) {
  const { tour } = await service.save(f.owner.id, f.list.id, {
    source_trip_id: f.alps.id,
    source_place_id: f.ridge.id,
    ...(name ? { name } : {}),
  });
  return tour;
}

describe('CollectionToursService', () => {
  it('LIB3-SVC-001: keeps a whole independent snapshot, its points in order, their links to the trip left behind', async () => {
    const f = await fixture();
    const tour = await keep(f);
    expect(tour).toMatchObject({
      collection_id: f.list.id,
      name: 'Ridge',
      tour_type: 'hike',
      distance: 4.2,
      elevation_gain: 300,
      elevation_loss: null,
      max_hiking_difficulty: 3,
      origin: 'trek',
      has_line: true,
      waypoint_count: 4,
      source: { tripTitle: 'Alps', tourName: 'Ridge' },
      saved_by: 'owner',
    });
    const stored = await findRow(orm, CollectionTours, { id: tour.id });
    expect(stored?.route_geometry).toBe(JSON.stringify(LINE));
    const points = JSON.parse(stored?.waypoints ?? '[]') as Array<Record<string, unknown>>;
    expect(points.map((point) => [point.role, point.sequence])).toEqual([
      ['start', 0],
      ['via', 1],
      ['via', 2],
      ['end', 3],
    ]);
    expect(points.every((point) => point.linked_place_id == null)).toBe(true);
    // Every member of the collection hears of it, the one who kept it included.
    expect(t.realtime.broadcastToUserMock.mock.calls.map(([userId]) => userId).sort()).toEqual(
      [f.owner.id, f.editor.id, f.viewer.id].sort(),
    );

    // Later changes to the tour it came from do not reach it.
    await updateRows(orm, Places, { id: f.ridge.id }, { name: 'Renamed', route_geometry: '[[1,1],[2,2]]' });
    await deleteRows(orm, TourWaypoints, { place: f.ridge.id });
    const [listed] = (await service.list(f.viewer.id, f.list.id)).tours;
    expect(listed).toMatchObject({ name: 'Ridge', waypoint_count: 4, has_line: true });
    // And the trip it came from is as it was, beyond what the test changed itself.
    expect(await countRows(orm, Places, { trip: f.alps.id })).toBe(2);
  });

  it('LIB3-SVC-002: keeps it under another name, an editor may keep one too', async () => {
    const f = await fixture();
    // An editor of the list keeps only a tour of a trip they can open themselves.
    await addTripMember(orm, f.alps.id, f.editor.id);
    const { tour } = await service.save(f.editor.id, f.list.id, {
      source_trip_id: f.alps.id,
      source_place_id: f.ridge.id,
      name: 'Ridge, spring',
    });
    expect(tour).toMatchObject({ name: 'Ridge, spring', source: { tripTitle: 'Alps', tourName: 'Ridge' } });
  });

  it('LIB3-SVC-003: refuses a viewer, a stranger, a trip out of reach and a place of another trip, writing nothing', async () => {
    const f = await fixture();
    const body = { source_trip_id: f.alps.id, source_place_id: f.ridge.id };
    expect(await refusal(service.save(f.viewer.id, f.list.id, body))).toEqual({
      status: 403,
      error: 'You have read-only access to this list',
    });
    expect(await refusal(service.save(f.outsider.id, f.list.id, body))).toEqual({
      status: 404,
      error: 'Collection not found',
    });
    const own = await makeCollection(orm, f.outsider.id);
    expect(await refusal(service.save(f.outsider.id, own.id, body))).toEqual({ status: 404, error: 'Tour not found' });
    expect(
      await refusal(service.save(f.owner.id, f.list.id, { source_trip_id: f.next.id, source_place_id: f.ridge.id })),
    ).toEqual({ status: 404, error: 'Tour not found' });
    expect(
      await refusal(service.save(f.owner.id, f.list.id, { source_trip_id: f.alps.id, source_place_id: f.hut.id })),
    ).toEqual({ status: 404, error: 'Tour not found' });
    expect(await countRows(orm, CollectionTours)).toBe(0);
  });

  it('LIB3-SVC-004: lists for every member, the newest first, and refuses whoever cannot see the list', async () => {
    const f = await fixture();
    const first = await keep(f, 'First');
    const second = await keep(f, 'Second');
    await updateRows(orm, CollectionTours, { id: first.id }, { created_at: '2020-01-01 00:00:00' });
    expect((await service.list(f.viewer.id, f.list.id)).tours.map((tour) => tour.id)).toEqual([second.id, first.id]);
    expect(await refusal(service.list(f.outsider.id, f.list.id))).toEqual({
      status: 404,
      error: 'Collection not found',
    });
  });

  it('LIB3-SVC-005: the detail has the line, the points in order and every trip, each saying whether a tour may go there', async () => {
    const f = await fixture();
    const tour = await keep(f);
    vi.spyOn(t.get(PermissionsService), 'checkPermission').mockImplementation(
      async (_action: string, _role: string, tripOwner: number | null, userId: number) => tripOwner === userId,
    );
    const detail = await service.detail({ id: f.owner.id, role: 'user' }, f.list.id, tour.id);
    expect(detail.line).toEqual(LINE.map(([lat, lng]) => [lat, lng]));
    expect(detail.points).toEqual([
      { role: 'start', name: null, shaping: false },
      { role: 'via', name: 'Hut', shaping: false },
      { role: 'via', name: null, shaping: true },
      { role: 'end', name: null, shaping: false },
    ]);
    expect(detail.trips.map((trip) => [trip.title, trip.can_add]).sort()).toEqual([
      ['Alps', true],
      ['Away', false],
      ['Next', true],
    ]);
    expect(await refusal(service.detail({ id: f.owner.id, role: 'user' }, f.list.id, 999999))).toEqual({
      status: 404,
      error: 'Tour not found',
    });
  });

  it('LIB3-SVC-006: takes a kept tour into a trip with its points, as a tour of its own with no days', async () => {
    const f = await fixture();
    const kept = await keep(f);
    const result = await service.takeOver(String(f.next.id), f.editor.id, {
      collection_id: f.list.id,
      collection_tour_id: kept.id,
      include_waypoints: true,
    });
    const copy = result.tour.place_id;
    expect(copy).not.toBe(f.ridge.id);
    expect(result.tour).toMatchObject({ name: 'Ridge', tour_type: 'hike', distance: 4.2, revision: 1, planned: false });
    expect(result.provenance?.takenOverFrom).toEqual({ tripTitle: 'Alps', tourName: 'Ridge' });
    expect(result.waypoints.map((point) => [point.role, point.sequence, point.shaping === true])).toEqual([
      ['start', 0, false],
      ['via', 1, false],
      ['via', 2, true],
      ['end', 3, false],
    ]);
    expect(result.waypoints.every((point) => point.linked_place_id == null)).toBe(true);
    expect(await findRow(orm, Places, { id: copy })).toMatchObject({
      trip_id: f.next.id,
      route_geometry: JSON.stringify(LINE),
    });
    expect(await countRows(orm, DayAssignments, { place: copy })).toBe(0);
    // Only the tour itself is new in the trip, no places for its points.
    expect(await countRows(orm, Places, { trip: f.next.id })).toBe(1);
    // The kept tour and the tour it was saved from are as they were.
    expect((await service.list(f.owner.id, f.list.id)).tours).toHaveLength(1);
    expect(await countRows(orm, TourWaypoints, { place: f.ridge.id })).toBe(4);
  });

  it('LIB3-SVC-007: without its points the new tour keeps the kept line as it is and has no points at all', async () => {
    const f = await fixture();
    const kept = await keep(f);
    const result = await service.takeOver(String(f.next.id), f.owner.id, {
      collection_id: f.list.id,
      collection_tour_id: kept.id,
      include_waypoints: false,
      name: 'Line only',
    });
    const copy = result.tour.place_id;
    expect(result.tour.name).toBe('Line only');
    expect(await countRows(orm, TourWaypoints, { place: copy })).toBe(0);
    expect((await findRow(orm, Places, { id: copy }))?.route_geometry).toBe(JSON.stringify(LINE));
    expect(await countRows(orm, Places, { trip: f.next.id })).toBe(1);
    expect((await findRows(orm, Tours, { place: copy }))[0]).toMatchObject({ distance: 4.2, elevation_gain: 300 });
  });

  it('LIB3-SVC-008: a kept walk without a line cannot leave its points behind, and nothing is written', async () => {
    const f = await fixture();
    const walk = await makePlace(orm, f.alps.id, { name: 'Old town', lat: 48.1, lng: 11.5 });
    await makeTour(orm, walk.id, { tourTypeRef: 'walk' });
    await addTourWaypoints(orm, walk.id, [
      { lat: 48.1, lng: 11.5, station_key: 'stop-gate-1', name: 'Gate', stay_minutes: 20 },
      { lat: 48.11, lng: 11.51, station_key: 'stop-dome-1', name: 'Dome' },
    ]);
    const { tour: kept } = await service.save(f.owner.id, f.list.id, {
      source_trip_id: f.alps.id,
      source_place_id: walk.id,
    });
    expect(kept).toMatchObject({
      has_line: false,
      station_count: 2,
      station_stay_minutes: 20,
      station_stays_unknown: 1,
    });
    const before = await countRows(orm, Places);
    expect(
      await refusal(
        service.takeOver(String(f.next.id), f.owner.id, {
          collection_id: f.list.id,
          collection_tour_id: kept.id,
          include_waypoints: false,
        }),
      ),
    ).toEqual({ status: 409, error: 'This tour has no line yet, so its points have to come along' });
    expect(await countRows(orm, Places)).toBe(before);
    // With its points it comes over as a walk still waiting for its way.
    const result = await service.takeOver(String(f.next.id), f.owner.id, {
      collection_id: f.list.id,
      collection_tour_id: kept.id,
      include_waypoints: true,
    });
    expect(result.tour).toMatchObject({ tour_type: 'walk', route_pending: true });
    expect(result.waypoints.map((point) => point.name)).toEqual(['Gate', 'Dome']);
  });

  it('LIB3-SVC-009: refuses a list out of sight, a tour of another list, and a tour removed while it is made', async () => {
    const f = await fixture();
    const kept = await keep(f);
    const other = await makeCollection(orm, f.owner.id, { name: 'Other' });
    const body = { collection_id: f.list.id, collection_tour_id: kept.id, include_waypoints: true };
    expect(await refusal(service.takeOver(String(f.away.id), f.outsider.id, body))).toEqual({
      status: 404,
      error: 'Collection not found',
    });
    expect(
      await refusal(service.takeOver(String(f.next.id), f.owner.id, { ...body, collection_id: other.id })),
    ).toEqual({ status: 404, error: 'Tour not found' });

    // Gone between the check and the write: the write leaves no half-made tour behind.
    const repo = t.moduleRef.get<CollectionToursRepository>(getRepositoryToken(CollectionTours), { strict: false });
    const find = repo.findInCollection.bind(repo);
    vi.spyOn(repo, 'findInCollection').mockImplementationOnce(find).mockResolvedValueOnce(undefined);
    const before = await countRows(orm, Places);
    expect(await refusal(service.takeOver(String(f.next.id), f.owner.id, body))).toEqual({
      status: 404,
      error: 'Tour not found',
    });
    expect(await countRows(orm, Places)).toBe(before);
  });

  it('LIB3-SVC-010: a tour type switched off since cannot be taken into a trip', async () => {
    const f = await fixture();
    const kept = await keep(f);
    await updateRows(orm, CollectionTours, { id: kept.id }, { tourTypeRef: 'food' });
    const before = await countRows(orm, Places);
    const refused = await refusal(
      service.takeOver(String(f.next.id), f.owner.id, {
        collection_id: f.list.id,
        collection_tour_id: kept.id,
        include_waypoints: true,
      }),
    );
    expect(refused.status).toBe(400);
    expect(await countRows(orm, Places)).toBe(before);
  });

  it('LIB3-SVC-011: only the owner or an admin of the list removes a kept tour; tours made from it stay', async () => {
    const f = await fixture();
    const kept = await keep(f);
    const made = await service.takeOver(String(f.next.id), f.owner.id, {
      collection_id: f.list.id,
      collection_tour_id: kept.id,
      include_waypoints: true,
    });
    expect(await refusal(service.remove(f.editor.id, f.list.id, kept.id))).toEqual({
      status: 403,
      error: 'Only an admin can remove tours from this list',
    });
    t.realtime.broadcastToUserMock.mockClear();
    await service.remove(f.owner.id, f.list.id, kept.id);
    expect(t.realtime.broadcastToUserMock).toHaveBeenCalled();
    expect(await countRows(orm, CollectionTours)).toBe(0);
    expect(await findRow(orm, Places, { id: made.tour.place_id })).not.toBeNull();
    expect(await refusal(service.remove(f.owner.id, f.list.id, kept.id))).toEqual({
      status: 404,
      error: 'Tour not found',
    });
  });

  it('LIB3-SVC-012: with the Collections addon off there is nothing to read, keep or take', async () => {
    const f = await fixture();
    const kept = await keep(f);
    await setAddonEnabled(orm, 'collections', false);
    const off = { status: 404, error: 'Collections addon is not enabled' };
    expect(await refusal(service.list(f.owner.id, f.list.id))).toEqual(off);
    expect(
      await refusal(service.save(f.owner.id, f.list.id, { source_trip_id: f.alps.id, source_place_id: f.ridge.id })),
    ).toEqual(off);
    expect(await refusal(service.remove(f.owner.id, f.list.id, kept.id))).toEqual(off);
    expect(
      await refusal(
        service.takeOver(String(f.next.id), f.owner.id, {
          collection_id: f.list.id,
          collection_tour_id: kept.id,
          include_waypoints: true,
        }),
      ),
    ).toEqual(off);
  });
});
