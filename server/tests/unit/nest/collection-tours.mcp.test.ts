/**
 * CollectionToursMcp (LIB-03): the tours a collection keeps, over the same
 * service and the same checks as REST. The suite takes its subject from the
 * container over a snapshot test db; the addon gate is the registry's.
 */
import { CollectionTours } from '../../../src/db/entities/CollectionTours.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { CollectionToursMcp } from '../../../src/nest/tours/collection-tours.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addCollectionMember, makeCollection } from '../../helpers/factories/collections';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow } from '../../helpers/factories/rows';
import { setAddonEnabled } from '../../helpers/factories/settings';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { NotFoundException } from '@nestjs/common';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let mcp: CollectionToursMcp;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  mcp = t.get(CollectionToursMcp);
  orm = await createTestOrm(db);
});
beforeEach(async () => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
  await setAddonEnabled(orm, 'collections', true);
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

async function fixture() {
  const { user } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const { user: outsider } = await makeUser(orm);
  const alps = await makeTrip(orm, user.id, { title: 'Alps' });
  const next = await makeTrip(orm, user.id, { title: 'Next' });
  const ridge = await makePlace(orm, alps.id, {
    name: 'Ridge',
    route_geometry: JSON.stringify([
      [47, 11, 600],
      [47.01, 11.01, 650],
    ]),
  });
  await makeTour(orm, ridge.id, { distance: 3.5 });
  await addTourWaypoints(orm, ridge.id, [
    { lat: 47, lng: 11 },
    { lat: 47.01, lng: 11.01 },
  ]);
  const list = await makeCollection(orm, user.id, { name: 'Hikes' });
  await addCollectionMember(orm, list.id, viewer.id, { role: 'viewer' });
  return { user, viewer, outsider, alps, next, ridge, list };
}

describe('CollectionToursMcp', () => {
  it('LIB3-MCP-001: keeps a tour, lists it and reads it with the trips it could go into', async () => {
    const f = await fixture();
    const saved = read(
      await mcp.saveTourToCollection(
        { collection_id: f.list.id, source_trip_id: f.alps.id, source_place_id: f.ridge.id },
        ctx(f.user.id),
      ),
    );
    expect(saved.tour).toMatchObject({
      name: 'Ridge',
      distance: 3.5,
      source: { tripTitle: 'Alps', tourName: 'Ridge' },
    });
    const listed = read(await mcp.listCollectionTours({ collection_id: f.list.id }, ctx(f.viewer.id)));
    expect(listed.tours.map((tour: { id: number }) => tour.id)).toEqual([saved.tour.id]);
    const detail = read(
      await mcp.getCollectionTour({ collection_id: f.list.id, collection_tour_id: saved.tour.id }, ctx(f.user.id)),
    );
    expect(detail.points).toEqual([
      { role: 'start', name: null, shaping: false },
      { role: 'end', name: null, shaping: false },
    ]);
    expect(detail.trips.map((trip: { title: string }) => trip.title).sort()).toEqual(['Alps', 'Next']);
  });

  it('LIB3-MCP-002: an admin may add to every trip; the role is read for the check', async () => {
    const f = await fixture();
    const admin = vi.spyOn(t.get(McpToolGuardsService), 'isAdminUser').mockResolvedValue(true);
    const saved = read(
      await mcp.saveTourToCollection(
        { collection_id: f.list.id, source_trip_id: f.alps.id, source_place_id: f.ridge.id },
        ctx(f.user.id),
      ),
    );
    const detail = read(
      await mcp.getCollectionTour({ collection_id: f.list.id, collection_tour_id: saved.tour.id }, ctx(f.user.id)),
    );
    expect(admin).toHaveBeenCalledWith(f.user.id);
    expect(detail.trips.every((trip: { can_add: boolean }) => trip.can_add)).toBe(true);
  });

  it('LIB3-MCP-003: takes a kept tour into a trip with or without its points', async () => {
    const f = await fixture();
    const { tour } = read(
      await mcp.saveTourToCollection(
        { collection_id: f.list.id, source_trip_id: f.alps.id, source_place_id: f.ridge.id },
        ctx(f.user.id),
      ),
    );
    const base = { tripId: f.next.id, collection_id: f.list.id, collection_tour_id: tour.id };
    const withPoints = read(await mcp.takeOverCollectionTour({ ...base, include_waypoints: true }, ctx(f.user.id)));
    expect(withPoints.waypoints).toHaveLength(2);
    expect(withPoints.provenance.takenOverFrom).toEqual({ tripTitle: 'Alps', tourName: 'Ridge' });
    const lineOnly = read(
      await mcp.takeOverCollectionTour({ ...base, include_waypoints: false, name: 'Bare' }, ctx(f.user.id)),
    );
    expect(lineOnly.tour.name).toBe('Bare');
    expect(lineOnly.tour.has_waypoints).toBe(false);
    expect(await findRow(orm, Places, { id: lineOnly.tour.place_id })).toMatchObject({ trip_id: f.next.id });
  });

  it('LIB3-MCP-004: refuses a trip out of reach, a trip without place_edit and a list out of sight', async () => {
    const f = await fixture();
    const { tour } = read(
      await mcp.saveTourToCollection(
        { collection_id: f.list.id, source_trip_id: f.alps.id, source_place_id: f.ridge.id },
        ctx(f.user.id),
      ),
    );
    const body = { collection_id: f.list.id, collection_tour_id: tour.id, include_waypoints: true };
    expect(read(await mcp.takeOverCollectionTour({ ...body, tripId: f.next.id }, ctx(f.outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
    const denied = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValue(false);
    const refused = await mcp.takeOverCollectionTour({ ...body, tripId: f.next.id }, ctx(f.user.id));
    expect(refused.isError).toBe(true);
    expect(denied).toHaveBeenCalledWith('place_edit', f.next.id, f.user.id);
    denied.mockRestore();
    const own = await makeTrip(orm, f.outsider.id);
    // A service refusal reaches the session through the registry's error mapper.
    await expect(mcp.takeOverCollectionTour({ ...body, tripId: own.id }, ctx(f.outsider.id))).rejects.toThrow(
      'Collection not found',
    );
    expect(await countRows(orm, Places, { trip: f.next.id })).toBe(0);
  });

  it('LIB3-MCP-005: a tour the copy model cannot make is not found', async () => {
    const f = await fixture();
    const { tour } = read(
      await mcp.saveTourToCollection(
        { collection_id: f.list.id, source_trip_id: f.alps.id, source_place_id: f.ridge.id },
        ctx(f.user.id),
      ),
    );
    vi.spyOn(t.get(ToursService), 'createFromKeptTour').mockRejectedValueOnce(new NotFoundException('Tour not found'));
    expect(
      read(
        await mcp.takeOverCollectionTour(
          { tripId: f.next.id, collection_id: f.list.id, collection_tour_id: tour.id, include_waypoints: true },
          ctx(f.user.id),
        ),
      ),
    ).toEqual({ error: 'Tour not found.' });
    vi.spyOn(t.get(ToursService), 'createFromKeptTour').mockRejectedValueOnce(new Error('boom'));
    await expect(
      mcp.takeOverCollectionTour(
        { tripId: f.next.id, collection_id: f.list.id, collection_tour_id: tour.id, include_waypoints: true },
        ctx(f.user.id),
      ),
    ).rejects.toThrow('boom');
  });

  it('LIB3-MCP-006: the owner removes a kept tour, a viewer may not', async () => {
    const f = await fixture();
    const { tour } = read(
      await mcp.saveTourToCollection(
        { collection_id: f.list.id, source_trip_id: f.alps.id, source_place_id: f.ridge.id },
        ctx(f.user.id),
      ),
    );
    await expect(
      mcp.deleteCollectionTour({ collection_id: f.list.id, collection_tour_id: tour.id }, ctx(f.viewer.id)),
    ).rejects.toThrow('Only an admin can remove tours from this list');
    expect(
      read(await mcp.deleteCollectionTour({ collection_id: f.list.id, collection_tour_id: tour.id }, ctx(f.user.id))),
    ).toEqual({ success: true });
    expect(await countRows(orm, CollectionTours)).toBe(0);
  });

  it('LIB3-MCP-007: the tools are there only while both addons are on, and only for the scopes they need', async () => {
    const options = (name: string) => {
      const entry = getEntry(CollectionToursMcp as unknown as ClassRef, name);
      if (entry?.kind !== 'tool') throw new Error(`${name} is no tool`);
      return entry.options;
    };
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled').mockResolvedValue(true);
    const gate = options('listCollectionTours').when;
    expect(await gate?.(ctx(1), mcp)).toBe(true);
    enabled.mockImplementation(async (id: string) => id !== 'collections');
    expect(await gate?.(ctx(1), mcp)).toBe(false);
    enabled.mockImplementation(async (id: string) => id !== 'tours');
    expect(await gate?.(ctx(1), mcp)).toBe(false);

    const allowed = (name: string, scopes: string[]) => {
      const access = options(name).access;
      return typeof access === 'function' ? access({ userId: 1, scopes } as McpContext) : access;
    };
    expect(allowed('getCollectionTour', ['collections:read', 'trips:read'])).toBe(true);
    expect(allowed('getCollectionTour', ['collections:read'])).toBe(false);
    expect(allowed('saveTourToCollection', ['collections:write', 'trips:read'])).toBe(true);
    expect(allowed('saveTourToCollection', ['collections:read', 'trips:read'])).toBe(false);
    expect(allowed('takeOverCollectionTour', ['trips:write', 'collections:read'])).toBe(true);
    expect(allowed('takeOverCollectionTour', ['trips:write'])).toBe(false);
    expect(allowed('deleteCollectionTour', [])).toEqual({ group: 'collections', mode: 'write' });
  });
});
