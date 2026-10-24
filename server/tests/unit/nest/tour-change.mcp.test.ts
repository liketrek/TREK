/**
 * TourChangeMcp (MCP-T02): a change to a saved city walk prepared for the
 * traveller to review. It reads the saved walk, the visits of all its days
 * and the places the new stations name, plans the way on foot before and
 * after with the road trip's router (a stub here), and writes nothing. The
 * suite takes its subject from the container over a snapshot test db and
 * seeds through the ORM factories.
 */
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { TourStationVisits } from '../../../src/db/entities/TourStationVisits.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { catchDomainError, DomainError } from '../../../src/nest/common/domain-error';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { CityWalkFootWayService } from '../../../src/nest/tours/city-walk-foot-way.service';
import { TOUR_CHANGE_REFUSED, TourChangePreviewService } from '../../../src/nest/tours/tour-change-preview.service';
import { TourChangeMcp } from '../../../src/nest/tours/tour-change.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour, markStationVisit } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import type { TourChange } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const route = vi.fn();
let t: TestModule;
let mcp: TourChangeMcp;
const orm = () => t.get(MikroORM);

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
  // Every leg the router plans is 500 m and 400 s on foot.
  route
    .mockReset()
    .mockImplementation(
      async (_userId: number, _tripId: number, _dayId: number, points: Array<{ lat: number; lng: number }>) => ({
        leg: { line: points.map((point): [number, number] => [point.lat, point.lng]) },
        parts: points.slice(1).map(() => ({ distance: 500, duration: 400 })),
        snapped: points.map(() => ({ meters: 4 })),
        avoidMissed: [],
      }),
    );
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

/**
 * A city walk at revision 3 from the gate past the protected cathedral and
 * the market to the park (a must), on day 1 where the gate was visited and
 * the market skipped; a hike, a bakery of the trip and a place of another trip.
 */
async function fixture() {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const other = await makeTrip(orm(), user.id);
  const day1 = await makeDay(orm(), trip.id, { day_number: 1 });
  const walk = await makePlace(orm(), trip.id, { name: 'Old town' });
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
  const ridge = await makePlace(orm(), trip.id, { name: 'Ridge' });
  await makeTour(orm(), ridge.id);
  await addTourWaypoints(orm(), ridge.id, [
    { lat: 47, lng: 11, station_key: 'pt-start' },
    { lat: 47.1, lng: 11, station_key: 'pt-end' },
  ]);
  const bakery = await makePlace(orm(), trip.id, { name: 'Bakery', lat: 48.109, lng: 11.501 });
  const foreign = await makePlace(orm(), other.id, { name: 'Foreign' });
  return { user, outsider, trip, day1, walk, ridge, bakery, foreign };
}

/** Everything a preparation must leave as it is. */
const untouched = async (placeId: number) => [
  await countRows(orm(), Places, {}),
  await countRows(orm(), Tours, {}),
  await countRows(orm(), TourWaypoints, {}),
  await countRows(orm(), TourStationVisits, {}),
  await countRows(orm(), DayAssignments, {}),
  (await findRow(orm(), Tours, { place: placeId }))?.revision,
];

/** prepare_tour_change of one tour, as one traveller. */
const prepare = (tripId: number, placeId: number, changes: TourChange[], userId: number) =>
  mcp.prepareTourChange({ tripId, placeId, changes }, ctx(userId));

/** The refusal a preparation raised, which the registry answers with its text. */
async function refusal(promise: Promise<unknown>): Promise<DomainError> {
  const err = await catchDomainError(() => promise);
  if (!(err instanceof DomainError)) throw new Error('no refusal');
  return err;
}

describe('TourChangeMcp (MCP-T02)', () => {
  it('TCHG-MCP-001: a spontaneous stop and a swap are prepared against the saved walk with their effects, and nothing is written', async () => {
    const f = await fixture();
    const before = await untouched(f.walk.id);
    const changes: TourChange[] = [
      {
        op: 'add',
        station: { lat: 48.109, lng: 11.501, name: 'Bakery', stay_minutes: 15, linked_place_id: f.bakery.id },
        after_key: 'stop-market',
      },
      { op: 'replace', key: 'stop-park', station: { lat: 48.113, lng: 11.502, name: 'Beer garden' } },
    ];
    const proposal = read(await prepare(f.trip.id, f.walk.id, changes, f.user.id));

    expect(proposal).toMatchObject({
      prepared_only: true,
      can_save: true,
      base: { place_id: f.walk.id, name: 'Old town', tour_type: 'walk', revision: 3 },
      changes,
    });
    expect(proposal.stations_after.map((s: { name: string; change: string }) => [s.name, s.change])).toEqual([
      ['Gate', 'kept'],
      ['Cathedral', 'kept'],
      ['Market', 'kept'],
      ['Bakery', 'added'],
      ['Beer garden', 'replaced'],
    ]);
    const asked = (points: Array<[number, number]>) => points.map(([lat, lng]) => ({ lat, lng }));
    const saved: Array<[number, number]> = [
      [48.1, 11.5],
      [48.104, 11.5],
      [48.108, 11.5],
      [48.112, 11.5],
    ];
    expect(route).toHaveBeenCalledWith(f.user.id, f.trip.id, 0, asked(saved), 'walking', [], { footOnly: true });
    expect(route).toHaveBeenCalledWith(
      f.user.id,
      f.trip.id,
      0,
      asked([...saved.slice(0, 3), [48.109, 11.501], [48.113, 11.502]]),
      'walking',
      [],
      { footOnly: true },
    );
    expect(proposal.effects.walking).toEqual({
      planned_by: 'router_on_foot',
      before: { planned: true, metres: 1500, minutes: 20 },
      after: { planned: true, metres: 2000, minutes: 27 },
      change: { metres: 500, minutes: 7 },
      stored: { distance_km: 1.6, walking_minutes: 22 },
    });
    expect(proposal.effects.stays).toMatchObject({ change_minutes_known: 15, complete: false });
    expect(proposal.warnings).toEqual([{ change: 2, key: 'stop-park', name: 'Park', why: 'must_station' }]);
    // The Bakery is linked to a place of the trip already, so only the beer garden is offered to keep for later.
    expect(proposal.for_later.map((stop: { name: string }) => stop.name)).toEqual(['Beer garden']);
    expect(proposal.stations_after[3]).toMatchObject({ name: 'Bakery', linked_place_id: f.bakery.id });
    expect(proposal.waypoints_after.map((p: { key?: string }) => p.key ?? null)).toEqual([
      'stop-gate',
      'stop-cathedral',
      'stop-market',
      null,
      null,
    ]);
    expect(await untouched(f.walk.id)).toEqual(before);
  });

  it('TCHG-MCP-002: what was done, a protected station and a place of another trip are refused with every reason, and nothing is written', async () => {
    const f = await fixture();
    const before = await untouched(f.walk.id);
    const changes: TourChange[] = [
      { op: 'remove', key: 'stop-cathedral' },
      { op: 'move', key: 'stop-gate', after_key: 'stop-park' },
      { op: 'add', station: { lat: 48.1, lng: 11.5, linked_place_id: f.foreign.id }, after_key: 'stop-gate' },
    ];
    const err = await refusal(prepare(f.trip.id, f.walk.id, changes, f.user.id));
    expect([err.getStatus(), err.code]).toEqual([422, TOUR_CHANGE_REFUSED]);
    expect(err.publicMessage.split('\n')).toEqual([
      'Nothing was prepared and nothing changed.',
      expect.stringMatching(/^Change 1 \(remove stop-cathedral\): this station is protected/),
      expect.stringMatching(new RegExp(`^Change 2 \\(move stop-gate\\): .*day ids ${f.day1.id} visited\\.$`)),
      expect.stringMatching(/^Change 3 \(add station\): the new station names a place that is not a place of/),
      expect.stringMatching(/^Change 3 \(add stop-gate\): this would put a station before one/),
    ]);
    expect((err.details?.refused as Array<{ reason: string }>).map((r) => r.reason)).toEqual([
      'protected',
      'done',
      'place_not_linkable',
      'before_done',
    ]);
    expect(route).not.toHaveBeenCalled();
    expect(await untouched(f.walk.id)).toEqual(before);
  });

  it('TCHG-MCP-003: a hike is refused as a type without changes, an outsider learns nothing and a place that is no tour is not found', async () => {
    const f = await fixture();
    const changes: TourChange[] = [{ op: 'remove', key: 'pt-start' }];
    const hike = await refusal(prepare(f.trip.id, f.ridge.id, changes, f.user.id));
    expect(hike.publicMessage).toContain('The proposal: only a city walk takes prepared changes so far');
    expect(read(await prepare(f.trip.id, f.walk.id, changes, f.outsider.id))).toEqual({
      error: 'Trip not found or access denied.',
    });
    expect(read(await prepare(f.trip.id, f.bakery.id, changes, f.user.id))).toEqual({ error: 'Tour not found.' });
    const failure = new Error('database gone');
    const servicePrepare = vi.spyOn(t.get(TourChangePreviewService), 'prepare').mockRejectedValueOnce(failure);
    try {
      await expect(prepare(f.trip.id, f.walk.id, changes, f.user.id)).rejects.toBe(failure);
    } finally {
      servicePrepare.mockRestore();
    }
  });

  it('TCHG-MCP-004: without a way from the router the walking effects stay unknown with why, and can_save follows place_edit', async () => {
    const f = await fixture();
    route.mockReset().mockRejectedValue(new Error('Routing provider returned 503'));
    const guard = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValueOnce(false);
    try {
      const changes: TourChange[] = [{ op: 'remove', key: 'stop-park' }];
      const proposal = read(await prepare(f.trip.id, f.walk.id, changes, f.user.id));
      expect(guard).toHaveBeenCalledWith('place_edit', f.trip.id, f.user.id);
      expect(proposal.can_save).toBe(false);
      expect(proposal.effects.walking).toMatchObject({
        before: { planned: false, why: 'router_unavailable' },
        after: { planned: false, why: 'router_unavailable' },
        change: null,
      });
      expect(proposal.removed).toEqual([{ key: 'stop-park', name: 'Park', was_position: 4, by_change: 1 }]);
      expect(proposal.data_gaps.map((gap: { about: string; why: string }) => [gap.about, gap.why])).toEqual([
        ['walking', 'router_unavailable'],
        ['walking', 'router_unavailable'],
        ['arrival_times', 'no_start_time'],
      ]);
    } finally {
      guard.mockRestore();
    }
  });

  it('TCHG-MCP-005: the way on foot needs two points, and a router failure of any kind reads as router_unavailable', async () => {
    const footWays = t.get(CityWalkFootWayService);
    expect(await footWays.plan(1, 2, [{ lat: 48, lng: 11 }])).toEqual({
      kind: 'unrouted',
      why: 'nothing_to_route',
      position: null,
    });
    expect(route).not.toHaveBeenCalled();
    route.mockRejectedValueOnce('socket hang up');
    const points = [
      { lat: 48, lng: 11 },
      { lat: 48.01, lng: 11 },
    ];
    expect(await footWays.plan(1, 2, points)).toEqual({ kind: 'unrouted', why: 'router_unavailable', position: null });
  });

  it('TCHG-MCP-006: prepare_tour_change reads only, on the Tours addon, and says how a proposal is bound and saved', async () => {
    const entry = getEntry(TourChangeMcp as unknown as ClassRef, 'prepareTourChange');
    if (!entry || entry.kind !== 'tool') throw new Error('prepareTourChange is no MCP tool');
    const { options } = entry;
    expect([options.name, options.annotations?.readOnlyHint, options.access]).toEqual([
      'prepare_tour_change',
      true,
      { group: 'trips', mode: 'read' },
    ]);
    const terms = ['revision', 'spontaneous stop', 'protected', 'visited or skipped', 'data_gaps', 'create_place'];
    for (const term of terms) expect(options.description).toContain(term);
    const isAddonEnabled = vi.fn(async (id: string) => id === 'tours');
    expect(await options.when?.(ctx(1), { addons: { isAddonEnabled } })).toBe(true);
    expect(isAddonEnabled).toHaveBeenCalledWith('tours');
  });
});
