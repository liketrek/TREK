import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { BudgetItems } from '../../../../src/db/entities/BudgetItems.entity';
import { DayAssignments } from '../../../../src/db/entities/DayAssignments.entity';
import { DayNotes } from '../../../../src/db/entities/DayNotes.entity';
import { Days } from '../../../../src/db/entities/Days.entity';
import { PackingItems } from '../../../../src/db/entities/PackingItems.entity';
import { Places } from '../../../../src/db/entities/Places.entity';
import { Reservations } from '../../../../src/db/entities/Reservations.entity';
import { TripMembers } from '../../../../src/db/entities/TripMembers.entity';
import { Trips } from '../../../../src/db/entities/Trips.entity';
import { Users } from '../../../../src/db/entities/Users.entity';
import { DemoRepository, type NewDemoPlaceRow } from '../../../../src/db/repositories/DemoRepository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, createAdmin } from '../../../helpers/factories';
import { findRow, findRows, insertRows, updateRows } from '../../../helpers/factories/rows';
import { readAppSetting } from '../../../helpers/factories/settings';
import { readUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/** The given columns of a row, the shape a narrow SELECT returned. */
function pick<T extends object, K extends keyof T>(row: T | null, keys: K[]): Pick<T, K> | null {
  if (!row) return null;
  const out = {} as Pick<T, K>;
  for (const key of keys) out[key] = row[key];
  return out;
}

const testDb = createSnapshotTestDb();
let t: TestOrm;
let demo: DemoRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  demo = new DemoRepository(t.em);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('DemoRepository', () => {
  it('DEMOREPO-001: findUserByEmail — DMS1, case-sensitive, no guest filter', async () => {
    const { user } = createUser(testDb, { email: 'admin@trek.app' });
    await expect(demo.findUserByEmail('admin@trek.app')).resolves.toEqual({ id: user.id });
    await expect(demo.findUserByEmail('nope@trek.app')).resolves.toBeNull();
  });

  it('DEMOREPO-002: createUser — DMS2, leaves first_seen_version/login_count/oidc/avatar to the entity default', async () => {
    const id = await demo.createUser({ username: 'demo', email: 'demo@trek.app', password_hash: 'x', role: 'user' });
    const row = pick(await readUser(t, id), ['username', 'email', 'role', 'first_seen_version', 'login_count']);
    expect(row).toEqual({
      username: 'demo',
      email: 'demo@trek.app',
      role: 'user',
      first_seen_version: '0.0.0',
      login_count: 0,
    });
  });

  it('DEMOREPO-003: setAllowRegistrationFalse — DMS3', async () => {
    await demo.setAllowRegistrationFalse();
    expect(await readAppSetting(t, 'allow_registration')).toBe('false');
    // Idempotent — a second call still lands 'false' (INSERT OR REPLACE dialect).
    await demo.setAllowRegistrationFalse();
    expect(await readAppSetting(t, 'allow_registration')).toBe('false');
  });

  it('DEMOREPO-004: countTripsByUser / listTripIdsByUser — DMS4/DMS5', async () => {
    const { user } = createAdmin(testDb);
    expect(await demo.countTripsByUser(user.id)).toBe(0);
    const t1 = await demo.insertTrip(user.id, 'A', 'desc', '2026-01-01', '2026-01-02', 'EUR');
    const t2 = await demo.insertTrip(user.id, 'B', 'desc', '2026-02-01', '2026-02-02', 'EUR');
    expect(await demo.countTripsByUser(user.id)).toBe(2);
    expect((await demo.listTripIdsByUser(user.id)).sort()).toEqual([t1, t2].sort());
  });

  it('DEMOREPO-005: addTripMember — DMS6, INSERT OR IGNORE (a repeat call does not throw)', async () => {
    const { user: owner } = createAdmin(testDb);
    const { user: member } = createUser(testDb);
    const tripId = await demo.insertTrip(owner.id, 'A', 'desc', '2026-01-01', '2026-01-02', 'EUR');
    await demo.addTripMember(tripId, member.id, owner.id);
    await demo.addTripMember(tripId, member.id, owner.id); // no UNIQUE-constraint throw
    const rows = (await findRows(t, TripMembers, { trip: tripId })).map((r) =>
      pick(r, ['trip_id', 'user_id', 'invited_by']),
    );
    expect(rows).toEqual([{ trip_id: tripId, user_id: member.id, invited_by: owner.id }]);
  });

  it('DEMOREPO-006: insertDay/insertPlace/insertDayAssignment/insertPackingItem/insertBudgetItem/insertReservation/insertDayNote — DMS7-14', async () => {
    const { user } = createAdmin(testDb);
    const tripId = await demo.insertTrip(user.id, 'Test Trip', 'd', '2026-04-15', '2026-04-16', 'JPY');
    const dayId = await demo.insertDay(tripId, 1, '2026-04-15');
    expect(pick(await findRow(t, Days, { id: dayId }), ['trip_id', 'day_number', 'date'])).toEqual({
      trip_id: tripId,
      day_number: 1,
      date: '2026-04-15',
    });

    const place: NewDemoPlaceRow = [
      tripId,
      'Hotel X',
      35.1,
      139.1,
      'Addr',
      1,
      '15:00',
      60,
      'notes',
      null,
      'gpid',
      null,
      null,
    ];
    const placeId = await demo.insertPlace(place);
    const placeRow = pick(await findRow(t, Places, { id: placeId }), ['trip_id', 'name', 'category_id']);
    expect(placeRow).toEqual({ trip_id: tripId, name: 'Hotel X', category_id: 1 });

    await demo.insertDayAssignment(dayId, placeId, 0);
    expect(pick(await findRow(t, DayAssignments, { day: dayId }), ['day_id', 'place_id', 'order_index'])).toEqual({
      day_id: dayId,
      place_id: placeId,
      order_index: 0,
    });

    await demo.insertPackingItem(tripId, 'Passport', 1, 'Documents', 0);
    const packing = pick(await findRow(t, PackingItems, { trip: tripId }), [
      'trip_id',
      'name',
      'checked',
      'category',
      'sort_order',
    ]);
    expect(packing).toEqual({ trip_id: tripId, name: 'Passport', checked: 1, category: 'Documents', sort_order: 0 });

    await demo.insertBudgetItem(tripId, 'Food', 'Lunch', 1000, 2, null);
    const budget = pick(await findRow(t, BudgetItems, { trip: tripId }), [
      'trip_id',
      'category',
      'name',
      'total_price',
      'persons',
      'note',
    ]);
    expect(budget).toEqual({
      trip_id: tripId,
      category: 'Food',
      name: 'Lunch',
      total_price: 1000,
      persons: 2,
      note: null,
    });

    await demo.insertReservation(
      tripId,
      dayId,
      'Check-in',
      '2026-04-15T15:00',
      'CONF-1',
      'confirmed',
      'hotel',
      'Tokyo',
    );
    const reservation = pick(await findRow(t, Reservations, { trip: tripId }), [
      'trip_id',
      'day_id',
      'title',
      'reservation_time',
      'confirmation_number',
      'status',
      'type',
      'location',
    ]);
    expect(reservation).toEqual({
      trip_id: tripId,
      day_id: dayId,
      title: 'Check-in',
      reservation_time: '2026-04-15T15:00',
      confirmation_number: 'CONF-1',
      status: 'confirmed',
      type: 'hotel',
      location: 'Tokyo',
    });

    await demo.insertDayNote(dayId, tripId, 'Note text', '13:00', 'Info', 0.5);
    const note = pick(await findRow(t, DayNotes, { day: dayId }), [
      'day_id',
      'trip_id',
      'text',
      'time',
      'icon',
      'sort_order',
    ]);
    expect(note).toEqual({
      day_id: dayId,
      trip_id: tripId,
      text: 'Note text',
      time: '13:00',
      icon: 'Info',
      sort_order: 0.5,
    });
  });

  it('DEMOREPO-007: the inserts read the new id back with RETURNING, and a packing item gets its updated_at stamp', async () => {
    const { user } = createAdmin(testDb);
    const tripId = await demo.insertTrip(user.id, 'Ids', 'd', '2026-05-01', '2026-05-02', 'EUR');
    expect(typeof tripId).toBe('number');
    const [latest] = await findRows(t, Trips, {}, { id: 'desc' });
    expect(tripId).toBe(latest.id);

    const dayId = await demo.insertDay(tripId, 1, '2026-05-01');
    const secondDayId = await demo.insertDay(tripId, 2, '2026-05-02');
    expect(secondDayId).toBeGreaterThan(dayId);

    await demo.insertPackingItem(tripId, 'Charger', 0, 'Tech', 1);
    const packing = await findRow(t, PackingItems, { trip: tripId });
    expect(packing?.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('DEMOREPO-CRED-001 (DMR1/DMR5 round trip): getAdminCredentials reads exactly what restoreAdminCredentials wrote', async () => {
    const { user } = createAdmin(testDb, { email: 'admin@nomad.app' });
    await updateRows(
      t,
      Users,
      { id: user.id },
      {
        maps_api_key: 'maps-key',
        openweather_api_key: 'ow-key',
        unsplash_api_key: 'un-key',
        avatar: 'avatar.png',
      },
    );

    const before = await demo.getAdminCredentials('admin@nomad.app');
    expect(before).toEqual({
      password_hash: expect.any(String),
      maps_api_key: 'maps-key',
      openweather_api_key: 'ow-key',
      unsplash_api_key: 'un-key',
      avatar: 'avatar.png',
    });

    // Simulate a baseline restore clobbering the row, then restore the preserved values.
    await updateRows(
      t,
      Users,
      { id: user.id },
      {
        password_hash: 'stale-hash-from-baseline',
        maps_api_key: null,
        openweather_api_key: null,
        unsplash_api_key: null,
        avatar: null,
      },
    );

    await demo.restoreAdminCredentials('admin@nomad.app', before!);

    const after = pick(await readUser(t, user.id), [
      'password_hash',
      'maps_api_key',
      'openweather_api_key',
      'unsplash_api_key',
      'avatar',
    ]);
    expect(after).toEqual(before);
  });

  it('DEMOREPO-CRED-002 (DMR5): writes exactly the 5 named columns, no updated_at bump', async () => {
    const { user } = createAdmin(testDb, { email: 'admin@nomad.app' });
    const before = await readUser(t, user.id);
    await demo.restoreAdminCredentials('admin@nomad.app', {
      password_hash: 'h',
      maps_api_key: 'm',
      openweather_api_key: 'o',
      unsplash_api_key: 'u',
      avatar: 'a',
    });
    const after = await readUser(t, user.id);
    expect(after.updated_at).toBe(before.updated_at);
  });

  it('DEMOREPO-KEYS-001 (DMR2/DMR6 round trip): getInstanceApiKeys preserves a NULL value, restoreInstanceApiKeys writes it back as NULL', async () => {
    await insertRows(t, AppSettings, [
      { key: 'maps_api_key', value: 'a-maps-key' },
      { key: 'unsplash_api_key', value: null },
    ]);

    const rows = await demo.getInstanceApiKeys();
    expect(rows.sort((a, b) => a.key.localeCompare(b.key))).toEqual([
      { key: 'maps_api_key', value: 'a-maps-key' },
      { key: 'unsplash_api_key', value: null },
    ]);

    // Clobber, then restore from what was read.
    await updateRows(t, AppSettings, { key: 'maps_api_key' }, { value: 'clobbered' });
    await demo.restoreInstanceApiKeys(rows);

    const after = (
      await findRows(t, AppSettings, { key: { $in: ['maps_api_key', 'unsplash_api_key'] } }, { key: 'asc' })
    ).map((r) => pick(r, ['key', 'value']));
    expect(after).toEqual([
      { key: 'maps_api_key', value: 'a-maps-key' },
      { key: 'unsplash_api_key', value: null },
    ]);
  });

  it('DEMOREPO-KEYS-002: restoreInstanceApiKeys upserts a row that did not previously exist', async () => {
    await demo.restoreInstanceApiKeys([{ key: 'maps_api_key', value: 'brand-new' }]);
    expect(await readAppSetting(t, 'maps_api_key')).toBe('brand-new');
  });
});
