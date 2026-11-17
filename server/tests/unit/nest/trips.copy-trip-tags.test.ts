/**
 * TripsService.copy and the tags a trip owns: the copy gets tags of its own
 * under the person who copied it, its places carry those, and a personal tag
 * stays the one row it was. The source keeps everything it had.
 *
 * Real in-memory SQLite over the container: the service comes out of
 * TripsModule, and the rows are seeded and read through the ORM factories.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { Tags } from '../../../src/db/entities/Tags.entity';
import { TripsModule } from '../../../src/nest/trips/trips.module';
import { TripsService } from '../../../src/nest/trips/trips.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace, makeTag, tagPlace } from '../../helpers/factories/places';
import { findRow, findRows } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let svc: TripsService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [TripsModule] });
  svc = t.get(TripsService);
});

afterAll(async () => {
  await t.close();
  db.close();
});

const ids = (rows: { id: number }[]): number[] => rows.map((row) => row.id).sort((a, b) => a - b);

describe('copy: the tags a trip owns', () => {
  it('TRIP-SVC-097: the copy owns tags of its own, on its own places, and a personal tag stays one row', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: copier } = await makeUser(orm());
    const trip = await makeTrip(orm(), owner.id, { title: 'Lisbon' });
    const tower = await makePlace(orm(), trip.id, { name: 'Belem Tower' });
    const monument = await makeTag(orm(), owner.id, { trip: trip.id, name: 'Monument', color: '#ff0000' });
    const zone = await makeTag(orm(), owner.id, { trip: trip.id, name: 'Zone' });
    const personal = await makeTag(orm(), owner.id, { name: 'hidden gem' });
    await tagPlace(orm(), tower.id, [monument.id, personal.id]);

    const newTripId = await svc.copy(trip.id, copier.id, 'Lisbon again');

    // Every tag of the trip comes along, the one no place carries included.
    const copies = await findRows(orm(), Tags, { trip: newTripId }, { name: 'asc' });
    expect(copies.map((tag) => ({ name: tag.name, color: tag.color, user_id: tag.user_id }))).toEqual([
      { name: 'Monument', color: '#ff0000', user_id: copier.id },
      { name: 'Zone', color: '#10b981', user_id: copier.id },
    ]);
    expect(ids(copies)).not.toContain(monument.id);

    const copiedTower = await findRow(orm(), Places, { trip: newTripId, name: 'Belem Tower' });
    expect(copiedTower).not.toBeNull();
    const onCopy = await findRows(orm(), Tags, { place_tags_inverse: copiedTower?.id ?? 0 });
    const copiedMonument = copies.filter((tag) => tag.name === 'Monument');
    expect(ids(onCopy)).toEqual(ids([...copiedMonument, personal]));

    // The source keeps its own tags, on its own place.
    expect(ids(await findRows(orm(), Tags, { trip: trip.id }))).toEqual(ids([monument, zone]));
    expect(ids(await findRows(orm(), Tags, { place_tags_inverse: tower.id }))).toEqual(ids([monument, personal]));
  });
});
