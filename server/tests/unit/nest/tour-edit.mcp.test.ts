/**
 * TourEditMcp (P8): a saved tour's words and planned times, the colour of its
 * line and a copy of it, over MCP with the services and checks of their REST
 * routes (trip access, then 'place_edit'). The suite takes its subject from
 * the container over a snapshot test db.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { TourEditMcp } from '../../../src/nest/tours/tour-edit.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let mcp: TourEditMcp;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  mcp = t.get(TourEditMcp);
});
beforeEach(() => {
  resetTestDb(db);
  t.realtime.broadcastMock.mockReset();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

const LINE = JSON.stringify([
  [47, 11, 600],
  [47.01, 11, 700],
]);

async function fixture(duration = 120) {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const hike = await makePlace(orm(), trip.id, { name: 'Ridge', route_geometry: LINE, website: 'https://old.example' });
  await makeTour(orm(), hike.id, { duration });
  await addTourWaypoints(orm(), hike.id, [
    { lat: 47, lng: 11, station_key: 'stop-start1', name: 'Car park' },
    { lat: 47.01, lng: 11, station_key: 'stop-summit', name: 'Summit' },
  ]);
  const plain = await makePlace(orm(), trip.id, { name: 'Bakery' });
  return { user, outsider, trip, hike, plain };
}

const events = () => t.realtime.broadcastMock.mock.calls.map(([, event]) => event);

describe('update_tour_details', () => {
  it('TEDIT-MCP-001: changes the website and the breaks against the revision, answering the values before', async () => {
    const { user, trip, hike } = await fixture();
    const result = read(
      await mcp.updateTourDetails(
        {
          tripId: trip.id,
          placeId: hike.id,
          expected_revision: 1,
          website: 'https://new.example/ridge',
          break_additional_minutes: 30,
        },
        ctx(user.id),
      ),
    );
    expect(result.tour).toMatchObject({
      place_id: hike.id,
      revision: 2,
      name: 'Ridge',
      website: 'https://new.example/ridge',
      break_additional_minutes: 30,
    });
    expect(result.previous).toMatchObject({
      revision: 1,
      website: 'https://old.example',
      break_additional_minutes: null,
    });
    expect(await findRow(orm(), Tours, { place: hike.id })).toMatchObject({
      break_additional_minutes: 30,
      revision: 2,
    });
    expect(events()).toEqual(expect.arrayContaining(['tours:changed', 'place:updated']));
  });

  it('TEDIT-MCP-002: clears a description with null and keeps the route and its points', async () => {
    const { user, trip, hike } = await fixture();
    await mcp.updateTourDetails(
      { tripId: trip.id, placeId: hike.id, expected_revision: 1, description: null, name: 'High ridge' },
      ctx(user.id),
    );
    const place = await findRow(orm(), Places, { id: hike.id });
    expect(place).toMatchObject({ name: 'High ridge', description: null, route_geometry: LINE });
  });

  it('TEDIT-MCP-003: refuses a tour changed since, breaks past the day and a change of nothing', async () => {
    const { user, trip, hike } = await fixture(1400);
    await expect(
      mcp.updateTourDetails({ tripId: trip.id, placeId: hike.id, expected_revision: 5, name: 'X' }, ctx(user.id)),
    ).rejects.toThrow('This tour was changed in the meantime');
    await expect(
      mcp.updateTourDetails(
        { tripId: trip.id, placeId: hike.id, expected_revision: 1, break_additional_minutes: 60 },
        ctx(user.id),
      ),
    ).rejects.toThrow('walking time plus breaks must be 1440 minutes or less');
    // With a planned total the breaks are the travellers' own.
    const planned = read(
      await mcp.updateTourDetails(
        {
          tripId: trip.id,
          placeId: hike.id,
          expected_revision: 1,
          break_additional_minutes: 60,
          planned_duration_minutes: 1440,
        },
        ctx(user.id),
      ),
    );
    expect(planned.tour.break_additional_minutes).toBe(60);
    expect(
      read(await mcp.updateTourDetails({ tripId: trip.id, placeId: hike.id, expected_revision: 2 }, ctx(user.id))),
    ).toEqual({ error: 'give at least one field to change' });
  });

  it('TEDIT-MCP-004: a place that is no tour is not found', async () => {
    const { user, trip, plain } = await fixture();
    expect(
      read(
        await mcp.updateTourDetails(
          { tripId: trip.id, placeId: plain.id, expected_revision: 1, name: 'X' },
          ctx(user.id),
        ),
      ),
    ).toEqual({ error: 'Tour not found.' });
  });
});

describe('set_tour_route_color', () => {
  it('TEDIT-MCP-005: draws the line in another colour and back, without raising the revision', async () => {
    const { user, trip, hike } = await fixture();
    const set = read(
      await mcp.setTourRouteColor({ tripId: trip.id, placeId: hike.id, route_color: '#e11d48' }, ctx(user.id)),
    );
    expect(set).toEqual({ place_id: hike.id, route_color: '#e11d48', previous_route_color: null });
    const back = read(
      await mcp.setTourRouteColor({ tripId: trip.id, placeId: hike.id, route_color: null }, ctx(user.id)),
    );
    expect(back.previous_route_color).toBe('#e11d48');
    expect((await findRow(orm(), Places, { id: hike.id }))?.route_color).toBeNull();
    expect((await findRow(orm(), Tours, { place: hike.id }))?.revision).toBe(1);
    expect(events()).toEqual(['place:updated', 'place:updated']);
  });

  it('TEDIT-MCP-006: a place that is no tour is not found and keeps its colour', async () => {
    const { user, trip, plain } = await fixture();
    expect(
      read(await mcp.setTourRouteColor({ tripId: trip.id, placeId: plain.id, route_color: '#000000' }, ctx(user.id))),
    ).toEqual({ error: 'Tour not found.' });
    expect((await findRow(orm(), Places, { id: plain.id }))?.route_color).toBeNull();
  });
});

describe('copy_tour', () => {
  it('TEDIT-MCP-007: saves the tour again as a new one of the trip under its own name', async () => {
    const { user, trip, hike } = await fixture();
    const before = await countRows(orm(), Tours);
    const copy = read(await mcp.copyTour({ tripId: trip.id, placeId: hike.id, name: 'Ridge (short)' }, ctx(user.id)));
    expect(copy.tour).toMatchObject({ name: 'Ridge (short)', tour_type: 'hike', derived_from_place_id: hike.id });
    expect(copy.tour.place_id).not.toBe(hike.id);
    expect(copy.waypoints).toHaveLength(2);
    expect(await countRows(orm(), Tours)).toBe(before + 1);
  });
});

describe('the checks of the REST routes', () => {
  it('TEDIT-MCP-008: refuses a trip the user cannot open, and without place_edit writes nothing', async () => {
    const { user, outsider, trip, hike } = await fixture();
    const name = { tripId: trip.id, placeId: hike.id, name: 'X' };
    expect(read(await mcp.copyTour(name, ctx(outsider.id)))).toEqual({ error: 'Trip not found or access denied.' });
    const denied = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValue(false);
    const results = [
      await mcp.updateTourDetails({ ...name, expected_revision: 1 }, ctx(user.id)),
      await mcp.setTourRouteColor({ tripId: trip.id, placeId: hike.id, route_color: '#ffffff' }, ctx(user.id)),
      await mcp.copyTour(name, ctx(user.id)),
    ];
    expect(results.every((result) => result.isError === true)).toBe(true);
    expect(denied).toHaveBeenCalledWith('place_edit', trip.id, user.id);
    expect(await findRow(orm(), Places, { id: hike.id })).toMatchObject({ name: 'Ridge', route_color: null });
    expect(await countRows(orm(), Tours)).toBe(1);
    denied.mockRestore();
  });
});
