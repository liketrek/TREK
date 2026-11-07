/**
 * Every write of a place, a booking endpoint or a saved collection place stores
 * its longitude on the real world (#2976): a point from a repeated world copy
 * (-220.3, 274.9) is kept as the same point in [-180, 180], whichever transport
 * wrote it, since REST, MCP, plugin RPC and the importers all end here. A value
 * already in range and a missing one are written as they came.
 */
import { CollectionPlaces } from '../../../../src/db/entities/CollectionPlaces.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import { ReservationEndpoints } from '../../../../src/db/entities/ReservationEndpoints.entity';
import type { CollectionPlacesRepository } from '../../../../src/db/repositories/CollectionPlaces.repository';
import type { PlacesRepository } from '../../../../src/db/repositories/Places.repository';
import type { ReservationEndpointsRepository } from '../../../../src/db/repositories/ReservationEndpoints.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPlace, createReservation, createTrip, createUser } from '../../../helpers/factories';
import { makeCollection } from '../../../helpers/factories/collections';
import { findRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let places: PlacesRepository;
let endpoints: ReservationEndpointsRepository;
let collectionPlaces: CollectionPlacesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  places = t.repo(Places);
  endpoints = t.repo(ReservationEndpoints);
  collectionPlaces = t.repo(CollectionPlaces);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const placeWrite = {
  description: null,
  address: null,
  category_id: null,
  price: null,
  currency: null,
  place_time: null,
  end_time: null,
  notes: null,
  image_url: null,
  google_place_id: null,
  google_ftid: null,
  osm_id: null,
  amap_poi_id: null,
  website: null,
  phone: null,
  route_color: null,
  stop_type: null,
  fill_percent: null,
  email: null,
  opening_hours: null,
};

async function storedLng(id: number): Promise<number | null | undefined> {
  return (await findRow(t.orm, Places, { id }))?.lng;
}

describe('longitude on write', () => {
  it('LNGWRITE-001: insertPlace and updatePlace keep a point from a world copy on the real world', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const id = await places.insertPlace({
      ...placeWrite,
      trip_id: trip.id,
      name: 'Copy',
      lat: 35.68,
      lng: -220.3,
      duration_minutes: 60,
      transport_mode: 'walking',
      route_geometry: null,
    });
    expect(await storedLng(id)).toBeCloseTo(139.7, 9);

    await places.updatePlace(id, {
      ...placeWrite,
      name: 'Copy',
      lat: 10.14,
      lng: 274.921875,
      duration_minutes: 60,
      transport_mode: null,
    });
    expect(await storedLng(id)).toBeCloseTo(-85.078125, 9);

    await places.updatePlace(id, {
      ...placeWrite,
      name: 'Copy',
      lat: null,
      lng: null,
      duration_minutes: 60,
      transport_mode: null,
    });
    expect(await storedLng(id)).toBeNull();
  });

  it('LNGWRITE-002: a place on the real world, the edges included, is written as it came', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const west = await places.insertTourPlace({
      trip_id: trip.id,
      name: 'West',
      lat: 0,
      lng: -118.4,
      route_geometry: null,
    });
    const edge = await places.insertTourPlace({
      trip_id: trip.id,
      name: 'Edge',
      lat: 0,
      lng: 180,
      route_geometry: null,
    });
    const otherEdge = await places.insertTourPlace({
      trip_id: trip.id,
      name: 'Other edge',
      lat: 0,
      lng: -180,
      route_geometry: null,
    });
    expect([await storedLng(west), await storedLng(edge), await storedLng(otherEdge)]).toEqual([-118.4, 180, -180]);
  });

  it('LNGWRITE-003: tour places and their route rewrites wrap too', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tourId = await places.insertTourPlace({
      trip_id: trip.id,
      name: 'Ridge',
      lat: 47,
      lng: 371,
      route_geometry: null,
    });
    expect(await storedLng(tourId)).toBeCloseTo(11, 9);

    const place = createPlace(testDb, trip.id, { name: 'Old', lat: 1, lng: 1 });
    expect(
      await places.updateTourRoute(place.id, trip.id, { name: 'New', lat: 1, lng: -349, route_geometry: null }),
    ).toBe(true);
    expect(await storedLng(place.id)).toBeCloseTo(11, 9);
  });

  it('LNGWRITE-004: a booking endpoint from a world copy is stored on the real world', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    const id = await endpoints.insertEndpoint({
      reservation_id: reservation.id,
      role: 'to',
      sequence: 1,
      name: 'AKL',
      code: 'AKL',
      lat: -37.01,
      lng: -185.215,
      timezone: null,
      local_time: null,
      local_date: null,
    });
    expect((await findRow(t.orm, ReservationEndpoints, { id }))?.lng).toBeCloseTo(174.785, 9);
  });

  it('LNGWRITE-005: a saved collection place wraps on save and on update, and an update without lng leaves it alone', async () => {
    const { user } = createUser(testDb);
    const collection = await makeCollection(t, user.id, { name: 'Saved' });
    const id = await collectionPlaces.insertSavedPlace({
      ...placeWrite,
      collection_id: collection.id,
      owner_id: user.id,
      saved_by: user.id,
      name: 'Paris',
      lat: 48.85,
      lng: 362.35,
      status: 'saved',
      source_trip_id: null,
      source_place_id: null,
      links: null,
    });
    const lngOf = async () => (await findRow(t.orm, CollectionPlaces, { id }))?.lng;
    expect(await lngOf()).toBeCloseTo(2.35, 9);

    await collectionPlaces.updateFields(id, { name: 'Paris again' });
    expect(await lngOf()).toBeCloseTo(2.35, 9);

    await collectionPlaces.updateFields(id, { lng: -357.65 });
    expect(await lngOf()).toBeCloseTo(2.35, 9);
  });
});
