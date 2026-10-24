/**
 * JourneyTracksMcp (JRNTRK-MCP-001..005): the GPX tracks a journey's map draws,
 * over MCP, on the same service and journey access as GET
 * /api/journeys/:id/tracks. Each track answers with its size for the model and
 * a thinned line under display_geometry for an MCP client that draws it, the
 * lines of all tracks held to about 1000 points together; TREK's assistant
 * keeps the lines away from the provider.
 */
import { ADDON_IDS } from '../../../src/addons';
import { Places } from '../../../src/db/entities/Places.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { AddonsModule } from '../../../src/nest/addons/addons.module';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { toolOutputForProvider } from '../../../src/nest/assistant/assistant-output';
import { JourneyDomainModule } from '../../../src/nest/journey/journey-domain.module';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { JourneyTracksMcp } from '../../../src/nest/journey/journey-tracks.mcp';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../../helpers/factories/journeys';
import { makePlace } from '../../helpers/factories/places';
import { updateRows } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;
let mcp: JourneyTracksMcp;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [JourneyDomainModule, AddonsModule], providers: [JourneyTracksMcp] });
  mcp = t.get(JourneyTracksMcp);
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

/** A place of the trip carrying a route geometry, drawn in one colour. */
async function placeWithGeometry(tripId: number, name: string, points: [number, number][]) {
  const place = await makePlace(orm, tripId, { name });
  await updateRows(orm, Places, { id: place.id }, { route_geometry: JSON.stringify(points), route_color: '#d9480f' });
  return place.id;
}

/** A journey written about one trip, one of whose places carries the given track. */
async function journeyWithTrack(name: string, points: [number, number][]) {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Dolomites' });
  const journey = await makeJourney(orm, user.id);
  await makeJourneyEntry(orm, journey.id, user.id, { sourceTrip: trip.id });
  const placeId = await placeWithGeometry(trip.id, name, points);
  return { user, trip, journey, placeId };
}

describe('get_journey_tracks', () => {
  it('JRNTRK-MCP-001: answers each track by its trip, name, kind, size and length, with a line to draw', async () => {
    // Two hundredths of a degree along the equator: 2.22 km.
    const f = await journeyWithTrack('Ridge', [
      [0.000001234, 0],
      [0, 0.01],
      [0, 0.02],
    ]);
    // A single point is a pin, no track.
    await placeWithGeometry(f.trip.id, 'Summit', [[46.5, 11.8]]);

    const answer = read(await mcp.getJourneyTracks({ journeyId: f.journey.id }, ctx(f.user.id)));

    expect(answer).toEqual({
      tracks: [
        {
          place_id: f.placeId,
          trip_id: f.trip.id,
          name: 'Ridge',
          kind: 'trip_gpx',
          color: '#d9480f',
          point_count: 3,
          distance_km: 2.2,
          display_geometry: [
            [0, 0],
            [0, 0.01],
            [0, 0.02],
          ],
        },
      ],
    });
  });

  it('JRNTRK-MCP-002: a long track keeps its length and its ends, with at most 200 points to draw, none of which reach the provider', async () => {
    const points = Array.from({ length: 1000 }, (_, i): [number, number] => [46 + i / 10_000, 11 + i / 10_000]);
    const f = await journeyWithTrack('Traverse', points);

    const answer = read(await mcp.getJourneyTracks({ journeyId: f.journey.id }, ctx(f.user.id)));

    const [track] = answer.tracks;
    expect(track.point_count).toBe(1000);
    expect(track.display_geometry).toHaveLength(200);
    expect(track.display_geometry[0]).toEqual([46, 11]);
    expect(track.display_geometry[199]).toEqual([46.0999, 11.0999]);
    expect(track.distance_km).toBeGreaterThan(13);
    // The line is for an MCP client that draws it; TREK's assistant hands the model the summary alone.
    expect(toolOutputForProvider('get_journey_tracks', answer)).toEqual({
      tracks: [
        {
          place_id: track.place_id,
          trip_id: f.trip.id,
          name: 'Traverse',
          kind: 'trip_gpx',
          color: '#d9480f',
          point_count: 1000,
          distance_km: track.distance_km,
        },
      ],
    });
  });

  it.each([
    [8, 1000, 125],
    [3, 1000, 200],
    [700, 10, 2],
  ])(
    'JRNTRK-MCP-005: %i tracks of %i points share the lines: %i points each, both ends kept, about 1000 in all',
    async (count, length, each) => {
      const tracks = Array.from({ length: count }, (_, n) => ({
        place_id: n + 1,
        trip_id: 1,
        name: `Track ${n + 1}`,
        color: null,
        points: Array.from({ length }, (_, i): [number, number] => [46 + i / 1000, 11 + n / 1000]),
      }));
      vi.spyOn(t.get(JourneyDomainService), 'journeyTracks').mockResolvedValue(tracks);

      const answer = read(await mcp.getJourneyTracks({ journeyId: 1 }, ctx(1)));

      type Line = [number, number][];
      const lines: Line[] = answer.tracks.map((track: { display_geometry: Line }) => track.display_geometry);
      const rounded = ([lat, lng]: [number, number]) => [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5];
      expect(lines.map((line) => line.length)).toEqual(tracks.map(() => each));
      expect(lines.map((line) => [line[0], line[line.length - 1]])).toEqual(
        tracks.map((track) => [rounded(track.points[0]), rounded(track.points[length - 1])]),
      );
      expect(lines.flat().length).toBeLessThanOrEqual(Math.max(1000, count * 2));
      expect(answer.tracks.map((track: { point_count: number }) => track.point_count)).toEqual(
        tracks.map(() => length),
      );
    },
  );

  it('JRNTRK-MCP-003: a contributor reads them, a stranger gets the journey refusal', async () => {
    const f = await journeyWithTrack('Ridge', [
      [46, 11],
      [46.01, 11.01],
    ]);
    const { user: viewer } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    await addJourneyContributor(orm, f.journey.id, viewer.id, 'viewer');

    expect(read(await mcp.getJourneyTracks({ journeyId: f.journey.id }, ctx(viewer.id))).tracks).toHaveLength(1);
    expect(read(await mcp.getJourneyTracks({ journeyId: f.journey.id }, ctx(stranger.id)))).toEqual({
      error: 'Journey not found or access denied.',
    });
  });

  it('JRNTRK-MCP-004: is a read of the journey under the Journey addon', async () => {
    const entry = getEntry(JourneyTracksMcp as unknown as ClassRef, 'getJourneyTracks');
    if (entry?.kind !== 'tool') throw new Error('getJourneyTracks is no tool');
    expect(entry.options.name).toBe('get_journey_tracks');
    expect(entry.options.access).toEqual({ group: 'journey', mode: 'read' });
    expect(entry.options.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    const enabled = vi.spyOn(t.get(AddonsService), 'isAddonEnabled').mockResolvedValue(false);
    expect(await entry.options.when?.(ctx(1), mcp)).toBe(false);
    expect(enabled).toHaveBeenCalledWith(ADDON_IDS.JOURNEY);
    enabled.mockResolvedValue(true);
    expect(await entry.options.when?.(ctx(1), mcp)).toBe(true);
  });
});
