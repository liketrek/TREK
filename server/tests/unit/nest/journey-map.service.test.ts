/**
 * JourneyMapService (JRN-04): what the journey map shows beside its entries
 * and photos. The suite takes the service from the journey domain module over
 * a snapshot test db, so the access check, the share link and the kept rows
 * are the real ones.
 *
 * What it pins: the plan comes through the linked trips, written about or
 * not, one pin per place with every day and the entry written about it; a
 * position that is not one is left out, never moved; one source failing
 * leaves the others; a stranger reads nothing; the share link cuts every
 * source on the server by its flags, keeps drafts out and shows nothing while
 * the map is not shared.
 */
import { JourneyTrips } from '../../../src/db/entities/JourneyTrips.entity';
import { Journeys } from '../../../src/db/entities/Journeys.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { DomainError } from '../../../src/nest/common/domain-error';
import { JourneyDomainModule } from '../../../src/nest/journey/journey-domain.module';
import { JourneyEntryStaysService } from '../../../src/nest/journey/journey-entry-stays.service';
import { JourneyMapService } from '../../../src/nest/journey/journey-map.service';
import { JourneyRecordedDaysService } from '../../../src/nest/journey/journey-recorded-days.service';
import { JourneyShareService } from '../../../src/nest/journey/journey-share.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import {
  addJourneyContributor,
  linkTripToJourney,
  makeJourney,
  makeJourneyEntry,
} from '../../helpers/factories/journeys';
import { makeCategory, makePlace } from '../../helpers/factories/places';
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
let map: JourneyMapService;
let share: JourneyShareService;
let stays: JourneyEntryStaysService;
let recorded: JourneyRecordedDaysService;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [JourneyDomainModule] });
  map = t.get(JourneyMapService);
  share = t.get(JourneyShareService);
  stays = t.get(JourneyEntryStaysService);
  recorded = t.get(JourneyRecordedDaysService);
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

const ROUTE = JSON.stringify([
  [45.43, 12.33],
  [45.44, 12.34],
]);

/** A journey with one linked trip of two days, nobody having written about it yet. */
async function venice() {
  const { user } = await makeUser(orm, { username: 'marta' });
  const journey = await makeJourney(orm, user.id, { show_trip_tracks: 1 });
  const trip = await makeTrip(orm, user.id, { title: 'Venice', start_date: '2026-05-14', end_date: '2026-05-15' });
  await linkTripToJourney(orm, journey.id, trip.id);
  const [first, second] = await readTripDays(orm, trip.id);
  const category = await makeCategory(orm, { color: '#e11d48', icon: 'landmark' });
  const square = await makePlace(orm, trip.id, {
    name: 'Piazza San Marco',
    lat: 45.434,
    lng: 12.3388,
    category: category.id,
  });
  const bridge = await makePlace(orm, trip.id, { name: 'Rialto', lat: 45.438, lng: 12.336, place_time: '16:00' });
  if (!first || !second) throw new Error('the trip has no two days');
  await makeDayAssignment(orm, first.id, square.id, { assignment_time: '10:00' });
  await makeDayAssignment(orm, second.id, square.id);
  await makeDayAssignment(orm, second.id, bridge.id);
  return { user, journey, trip, square, bridge, days: [first, second] };
}

const keep = (journeyId: number, userId: number, date: string) =>
  recorded.keep(
    journeyId,
    userId,
    {
      date,
      sourceKind: 'tracks',
      utcOffsetMinutes: 120,
      window: { from: `${date}T00:00:00+02:00`, to: `${date}T23:59:59+02:00` },
      segments: [
        {
          points: [
            [45.434, 12.3388],
            [45.4364, 12.3218],
          ],
          mode: 'walking',
          startedAt: `${date}T09:00:00+02:00`,
          endedAt: `${date}T09:40:00+02:00`,
          distanceMeters: 1500,
        },
      ],
      truncated: false,
      fetchedAt: `${date}T23:59:59+02:00`,
      contentHash: 'a'.repeat(64),
    },
    false,
  );

const stayAt = (sourceVisitId: string, lat: number | null, lng: number | null) => ({
  sourceVisitId,
  name: `Stay ${sourceVisitId}`,
  lat,
  lng,
  startedAt: '2026-05-14T09:00:00+02:00',
  endedAt: '2026-05-14T10:00:00+02:00',
  durationMinutes: 60,
});

describe('JourneyMapService.mapLayers', () => {
  it('JRNMAP-001: a linked trip nobody wrote about shows its plan, one pin per place with every day it stands on', async () => {
    const { user, journey, trip, square, bridge } = await venice();

    const layers = await map.mapLayers(journey.id, user.id);

    expect(layers.places).toEqual({
      status: 'ok',
      items: [
        {
          place_id: square.id,
          trip_id: trip.id,
          trip_title: 'Venice',
          name: 'Piazza San Marco',
          lat: 45.434,
          lng: 12.3388,
          days: ['2026-05-14', '2026-05-15'],
          time: '10:00',
          category_color: '#e11d48',
          category_icon: 'landmark',
          entry_id: null,
        },
        expect.objectContaining({ place_id: bridge.id, days: ['2026-05-15'], time: '16:00', entry_id: null }),
      ],
    });
    expect(layers.stays).toEqual({ status: 'ok', items: [] });
  });

  it('JRNMAP-002: a place points at the earliest entry written about it; the mirrored skeleton is no entry', async () => {
    const { user, journey, square } = await venice();
    await makeJourneyEntry(orm, journey.id, user.id, {
      type: 'skeleton',
      sourcePlace: square.id,
      entry_date: '2026-05-13',
    });
    await makeJourneyEntry(orm, journey.id, user.id, { sourcePlace: square.id, entry_date: '2026-05-15' });
    const earlier = await makeJourneyEntry(orm, journey.id, user.id, {
      sourcePlace: square.id,
      entry_date: '2026-05-14',
    });

    const layers = await map.mapLayers(journey.id, user.id);

    expect(layers.places.status === 'ok' && layers.places.items.find((p) => p.place_id === square.id)?.entry_id).toBe(
      earlier.id,
    );
  });

  it('JRNMAP-003: a place without coordinates or with ones off the globe is left out, never put somewhere', async () => {
    const { user, journey, trip, days } = await venice();
    const nowhere = await makePlace(orm, trip.id, { name: 'Nowhere', lat: null, lng: null });
    const offGlobe = await makePlace(orm, trip.id, { name: 'Off', lat: 120, lng: 12 });
    await makeDayAssignment(orm, days[0].id, nowhere.id);
    await makeDayAssignment(orm, days[0].id, offGlobe.id);

    const layers = await map.mapLayers(journey.id, user.id);

    const names = layers.places.status === 'ok' ? layers.places.items.map((p) => p.name) : [];
    expect(names).toEqual(['Piazza San Marco', 'Rialto']);
  });

  it('JRNMAP-004: the routes come through the linked trips while the track switch is on, broken geometry left out', async () => {
    const { user, journey, trip, square, bridge } = await venice();
    await updateRows(orm, Places, { id: square.id }, { route_geometry: ROUTE, route_color: '#123456' });
    await updateRows(orm, Places, { id: bridge.id }, { route_geometry: 'not json' });

    const on = await map.mapLayers(journey.id, user.id);
    expect(on.routes).toEqual({
      status: 'ok',
      items: [
        {
          place_id: square.id,
          trip_id: trip.id,
          name: 'Piazza San Marco',
          color: '#123456',
          points: [
            [45.43, 12.33],
            [45.44, 12.34],
          ],
          kind: 'trip_gpx',
        },
      ],
    });

    await updateRows(orm, Journeys, { id: journey.id }, { show_trip_tracks: 0 });
    expect((await map.mapLayers(journey.id, user.id)).routes).toEqual({ status: 'ok', items: [] });
  });

  it('JRNMAP-005: the located stays of an entry each come with their own place; one without a place stays off', async () => {
    const { user, journey } = await venice();
    const report = await makeJourneyEntry(orm, journey.id, user.id, { entry_date: '2026-05-14', title: 'Day report' });
    await stays.record(journey.id, report.id, user.id, [
      stayAt('1', 45.434, 12.3388),
      stayAt('2', null, null),
      stayAt('3', 45.438, 12.336),
    ]);

    const layers = await map.mapLayers(journey.id, user.id);

    expect(layers.stays.status === 'ok' && layers.stays.items.map((s) => [s.entry_id, s.name, s.lat])).toEqual([
      [report.id, 'Stay 1', 45.434],
      [report.id, 'Stay 3', 45.438],
    ]);
  });

  it('JRNMAP-006: one source failing answers unavailable and the others still draw', async () => {
    const { user, journey } = await venice();
    const trips = orm.repo(JourneyTrips);
    vi.spyOn(Object.getPrototypeOf(trips), 'listMapPlacesForJourney').mockRejectedValueOnce(new Error('disk'));

    const layers = await map.mapLayers(journey.id, user.id);

    expect(layers.places).toEqual({ status: 'unavailable' });
    expect(layers.routes.status).toBe('ok');
    expect(layers.stays.status).toBe('ok');
  });

  it('JRNMAP-007: a contributor reads the layers, a stranger gets the journey 404', async () => {
    const { journey } = await venice();
    const { user: viewer } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');

    expect((await map.mapLayers(journey.id, viewer.id)).places.status).toBe('ok');
    await expect(map.mapLayers(journey.id, stranger.id)).rejects.toBeInstanceOf(DomainError);
  });
});

describe('JourneyMapService.publicMapLayers', () => {
  async function shared(flags: Parameters<JourneyShareService['createOrUpdateJourneyShareLink']>[2]) {
    const scene = await venice();
    const link = await share.createOrUpdateJourneyShareLink(scene.journey.id, scene.user.id, flags);
    if (!link) throw new Error('the owner could not share');
    return { ...scene, token: link.token };
  }

  it('JRNMAP-008: an unknown token answers null', async () => {
    expect(await map.publicMapLayers('nope')).toBeNull();
  });

  it('JRNMAP-009: with the map not shared nothing is, whatever the other flags say', async () => {
    const { token } = await shared({ share_map: false, share_plan: true, share_recordings: true });
    expect(await map.publicMapLayers(token)).toEqual({
      places: { status: 'withheld' },
      routes: { status: 'withheld' },
      stays: { status: 'withheld' },
      recordings: { status: 'withheld' },
    });
  });

  it('JRNMAP-010: a new link shares neither the plan nor the recorded days, nor the stays taken from a recording', async () => {
    const { token, journey, user } = await shared({});
    const published = await makeJourneyEntry(orm, journey.id, user.id, { entry_date: '2026-05-14' });
    const draft = await makeJourneyEntry(orm, journey.id, user.id, { entry_date: '2026-05-14', is_draft: 1 });
    await stays.record(journey.id, published.id, user.id, [stayAt('1', 45.434, 12.3388)]);
    await stays.record(journey.id, draft.id, user.id, [stayAt('2', 45.438, 12.336)]);
    await keep(journey.id, user.id, '2026-05-14');

    const layers = await map.publicMapLayers(token);

    expect(layers?.places).toEqual({ status: 'withheld' });
    expect(layers?.routes).toEqual({ status: 'withheld' });
    expect(layers?.recordings).toEqual({ status: 'withheld' });
    expect(layers?.stays).toEqual({ status: 'withheld' });

    await share.createOrUpdateJourneyShareLink(journey.id, user.id, { share_recordings: true });
    const recorded = await map.publicMapLayers(token);
    expect(recorded?.stays.status === 'ok' && recorded.stays.items.map((s) => s.entry_id)).toEqual([published.id]);
  });

  it('JRNMAP-011: the plan shows with share_plan, tied only to published entries; routes also need the track switch', async () => {
    const { token, journey, user, square } = await shared({ share_plan: true });
    await makeJourneyEntry(orm, journey.id, user.id, { sourcePlace: square.id, entry_date: '2026-05-14', is_draft: 1 });
    await updateRows(orm, Places, { id: square.id }, { route_geometry: ROUTE });

    const layers = await map.publicMapLayers(token);

    expect(layers?.places.status === 'ok' && layers.places.items.map((p) => [p.name, p.entry_id])).toEqual([
      ['Piazza San Marco', null],
      ['Rialto', null],
    ]);
    expect(layers?.routes.status === 'ok' && layers.routes.items).toHaveLength(1);

    await updateRows(orm, Journeys, { id: journey.id }, { show_trip_tracks: 0 });
    expect((await map.publicMapLayers(token))?.routes).toEqual({ status: 'withheld' });
  });

  it('JRNMAP-012: a recorded day shows with share_recordings only beside a published entry of that day', async () => {
    const { token, journey, user } = await shared({ share_recordings: true });
    await makeJourneyEntry(orm, journey.id, user.id, { entry_date: '2026-05-14' });
    await makeJourneyEntry(orm, journey.id, user.id, { entry_date: '2026-05-15', is_draft: 1 });
    await keep(journey.id, user.id, '2026-05-14');
    await keep(journey.id, user.id, '2026-05-15');

    const layers = await map.publicMapLayers(token);

    expect(layers?.recordings).toEqual({
      status: 'ok',
      items: [
        {
          date: '2026-05-14',
          pieces: [
            [
              [45.434, 12.3388],
              [45.4364, 12.3218],
            ],
          ],
          distance_m: expect.any(Number),
        },
      ],
    });
  });
});
