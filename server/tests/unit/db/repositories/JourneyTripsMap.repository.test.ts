/**
 * `JourneyTripsRepository`'s journey map reads (JRN-04): the located places
 * the linked trips plan on a day, one row per day, and the places of those
 * trips that carry a route, both through `journey_trips` so a trip nobody
 * has written about counts too.
 */
import { JourneyTrips } from '../../../../src/db/entities/JourneyTrips.entity';
import type { JourneyTripsRepository } from '../../../../src/db/repositories/JourneyTrips.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeDayAssignment } from '../../../helpers/factories/itinerary';
import { linkTripToJourney, makeJourney } from '../../../helpers/factories/journeys';
import { makeCategory, makePlace } from '../../../helpers/factories/places';
import { makeTrip, readTripDays } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: JourneyTripsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(JourneyTrips);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function linkedTrip() {
  const { user } = await makeUser(t);
  const journey = await makeJourney(t, user.id);
  const trip = await makeTrip(t, user.id, { title: 'Venice', start_date: '2026-05-14', end_date: '2026-05-15' });
  await linkTripToJourney(t, journey.id, trip.id);
  const [first, second] = await readTripDays(t, trip.id);
  if (!first || !second) throw new Error('the trip has no two days');
  return { user, journey, trip, first, second };
}

describe('JourneyTripsRepository map reads', () => {
  it('JTRIPMAP-001: one row per planned day of a located place, the assignment time before the place time', async () => {
    const { user, journey, trip, first, second } = await linkedTrip();
    const category = await makeCategory(t, { color: '#e11d48', icon: 'landmark' });
    const square = await makePlace(t, trip.id, { name: 'San Marco', lat: 45.434, lng: 12.3388, category: category.id });
    const bridge = await makePlace(t, trip.id, {
      name: 'Rialto',
      lat: 45.438,
      lng: 12.336,
      place_time: '16:00',
      category: null,
    });
    const nowhere = await makePlace(t, trip.id, { name: 'Nowhere', lat: null, lng: null });
    await makePlace(t, trip.id, { name: 'Wishlist', lat: 45.43, lng: 12.33 });
    await makeDayAssignment(t, first.id, square.id, { assignment_time: '10:00' });
    await makeDayAssignment(t, second.id, bridge.id);
    await makeDayAssignment(t, second.id, square.id);
    await makeDayAssignment(t, first.id, nowhere.id);
    const unlinked = await makeTrip(t, user.id, { start_date: '2026-05-14', end_date: '2026-05-14' });
    const [unlinkedDay] = await readTripDays(t, unlinked.id);
    if (!unlinkedDay) throw new Error('the trip has no day');
    await makeDayAssignment(t, unlinkedDay.id, (await makePlace(t, unlinked.id, { name: 'Elsewhere' })).id);

    const rows = await repo.listMapPlacesForJourney(journey.id);

    expect(rows).toEqual([
      {
        place_id: square.id,
        trip_id: trip.id,
        trip_title: 'Venice',
        name: 'San Marco',
        lat: 45.434,
        lng: 12.3388,
        day_date: '2026-05-14',
        time: '10:00',
        category_color: '#e11d48',
        category_icon: 'landmark',
      },
      expect.objectContaining({ place_id: bridge.id, day_date: '2026-05-15', time: '16:00', category_color: null }),
      expect.objectContaining({ place_id: square.id, day_date: '2026-05-15', time: null }),
    ]);
  });

  it('JTRIPMAP-002: the routes of the linked trips, with or without an entry, and nothing of other trips', async () => {
    const { user, journey, trip } = await linkedTrip();
    const route = JSON.stringify([
      [45.43, 12.33],
      [45.44, 12.34],
    ]);
    const ridge = await makePlace(t, trip.id, { name: 'Ridge', route_geometry: route, route_color: '#aa0000' });
    await makePlace(t, trip.id, { name: 'No route' });
    const other = await makeTrip(t, user.id);
    await makePlace(t, other.id, { name: 'Other', route_geometry: route });

    expect(await repo.listRouteSourcesForJourney(journey.id)).toEqual([
      { place_id: ridge.id, trip_id: trip.id, name: 'Ridge', route_color: '#aa0000', route_geometry: route },
    ]);
  });
});
