/**
 * JourneyMapMcp (JRN-04): the journey map's layers over MCP, on the same
 * service and journey access as REST. Places and stays come with their
 * positions; a route answers with its name and size, never its geometry.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsModule } from '../../../src/nest/addons/addons.module';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { JourneyDomainModule } from '../../../src/nest/journey/journey-domain.module';
import { JourneyMapMcp } from '../../../src/nest/journey/journey-map.mcp';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { linkTripToJourney, makeJourney } from '../../helpers/factories/journeys';
import { makePlace } from '../../helpers/factories/places';
import { updateRows } from '../../helpers/factories/rows';
import { makeTrip, readTripDays } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let mcp: JourneyMapMcp;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [JourneyDomainModule, AddonsModule], providers: [JourneyMapMcp] });
  mcp = t.get(JourneyMapMcp);
  orm = await createTestOrm(db);
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  vi.restoreAllMocks();
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

describe('JourneyMapMcp', () => {
  it('JRNMAP-MCP-001: answers the plan with its positions and a route by its size, without geometry', async () => {
    const { user } = await makeUser(orm);
    const journey = await makeJourney(orm, user.id, { show_trip_tracks: 1 });
    const trip = await makeTrip(orm, user.id, { start_date: '2026-05-14', end_date: '2026-05-14' });
    await linkTripToJourney(orm, journey.id, trip.id);
    const [day] = await readTripDays(orm, trip.id);
    if (!day) throw new Error('the trip has no day');
    const square = await makePlace(orm, trip.id, { name: 'San Marco', lat: 45.434, lng: 12.3388 });
    await makeDayAssignment(orm, day.id, square.id);
    await updateRows(
      orm,
      Places,
      { id: square.id },
      {
        route_geometry: JSON.stringify([
          [45.43, 12.33],
          [45.44, 12.34],
          [45.45, 12.35],
        ]),
      },
    );

    const answer = read(await mcp.getJourneyMapLayers({ journeyId: journey.id }, ctx(user.id)));

    expect(answer.places.items).toEqual([
      expect.objectContaining({ name: 'San Marco', lat: 45.434, lng: 12.3388, days: ['2026-05-14'], entry_id: null }),
    ]);
    expect(answer.routes).toEqual({
      status: 'ok',
      items: [{ place_id: square.id, trip_id: trip.id, name: 'San Marco', points: 3 }],
    });
    expect(answer.stays).toEqual({ status: 'ok', items: [] });
  });

  it('JRNMAP-MCP-002: a stranger is refused like REST, and the tool reads under the Journey addon', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);

    await expect(mcp.getJourneyMapLayers({ journeyId: journey.id }, ctx(stranger.id))).rejects.toThrow(
      'Journey not found',
    );

    const entry = getEntry(JourneyMapMcp as unknown as ClassRef, 'getJourneyMapLayers');
    if (entry?.kind !== 'tool') throw new Error('getJourneyMapLayers is no tool');
    expect(entry.options.access).toEqual({ group: 'journey', mode: 'read' });
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled').mockResolvedValue(false);
    expect(await entry.options.when?.(ctx(owner.id), mcp)).toBe(false);
    enabled.mockResolvedValue(true);
    expect(await entry.options.when?.(ctx(owner.id), mcp)).toBe(true);
  });
});
