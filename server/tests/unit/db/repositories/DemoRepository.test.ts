import { DemoRepository, type NewDemoPlaceRow } from '../../../../src/db/repositories/DemoRepository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser, createAdmin } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
    const row = testDb
      .prepare('SELECT username, email, role, first_seen_version, login_count FROM users WHERE id = ?')
      .get(id) as {
      username: string;
      email: string;
      role: string;
      first_seen_version: string;
      login_count: number;
    };
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
    const row = testDb.prepare("SELECT value FROM app_settings WHERE key = 'allow_registration'").get() as {
      value: string;
    };
    expect(row.value).toBe('false');
    // Idempotent — a second call still lands 'false' (INSERT OR REPLACE dialect).
    await demo.setAllowRegistrationFalse();
    const row2 = testDb.prepare("SELECT value FROM app_settings WHERE key = 'allow_registration'").get() as {
      value: string;
    };
    expect(row2.value).toBe('false');
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
    const rows = testDb.prepare('SELECT trip_id, user_id, invited_by FROM trip_members WHERE trip_id = ?').all(tripId);
    expect(rows).toEqual([{ trip_id: tripId, user_id: member.id, invited_by: owner.id }]);
  });

  it('DEMOREPO-006: insertDay/insertPlace/insertDayAssignment/insertPackingItem/insertBudgetItem/insertReservation/insertDayNote — DMS7-14', async () => {
    const { user } = createAdmin(testDb);
    const tripId = await demo.insertTrip(user.id, 'Test Trip', 'd', '2026-04-15', '2026-04-16', 'JPY');
    const dayId = await demo.insertDay(tripId, 1, '2026-04-15');
    expect(testDb.prepare('SELECT trip_id, day_number, date FROM days WHERE id = ?').get(dayId)).toEqual({
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
    const placeRow = testDb.prepare('SELECT trip_id, name, category_id FROM places WHERE id = ?').get(placeId) as {
      trip_id: number;
      name: string;
      category_id: number;
    };
    expect(placeRow).toEqual({ trip_id: tripId, name: 'Hotel X', category_id: 1 });

    await demo.insertDayAssignment(dayId, placeId, 0);
    expect(
      testDb.prepare('SELECT day_id, place_id, order_index FROM day_assignments WHERE day_id = ?').get(dayId),
    ).toEqual({ day_id: dayId, place_id: placeId, order_index: 0 });

    await demo.insertPackingItem(tripId, 'Passport', 1, 'Documents', 0);
    const packing = testDb
      .prepare('SELECT trip_id, name, checked, category, sort_order FROM packing_items WHERE trip_id = ?')
      .get(tripId);
    expect(packing).toEqual({ trip_id: tripId, name: 'Passport', checked: 1, category: 'Documents', sort_order: 0 });

    await demo.insertBudgetItem(tripId, 'Food', 'Lunch', 1000, 2, null);
    const budget = testDb
      .prepare('SELECT trip_id, category, name, total_price, persons, note FROM budget_items WHERE trip_id = ?')
      .get(tripId);
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
    const reservation = testDb
      .prepare(
        'SELECT trip_id, day_id, title, reservation_time, confirmation_number, status, type, location FROM reservations WHERE trip_id = ?',
      )
      .get(tripId);
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
    const note = testDb
      .prepare('SELECT day_id, trip_id, text, time, icon, sort_order FROM day_notes WHERE day_id = ?')
      .get(dayId);
    expect(note).toEqual({
      day_id: dayId,
      trip_id: tripId,
      text: 'Note text',
      time: '13:00',
      icon: 'Info',
      sort_order: 0.5,
    });
  });

  it('DEMOREPO-CRED-001 (DMR1/DMR5 round trip): getAdminCredentials reads exactly what restoreAdminCredentials wrote', async () => {
    const { user } = createAdmin(testDb, { email: 'admin@nomad.app' });
    testDb
      .prepare(
        'UPDATE users SET maps_api_key = ?, openweather_api_key = ?, unsplash_api_key = ?, avatar = ? WHERE id = ?',
      )
      .run('maps-key', 'ow-key', 'un-key', 'avatar.png', user.id);

    const before = await demo.getAdminCredentials('admin@nomad.app');
    expect(before).toEqual({
      password_hash: expect.any(String),
      maps_api_key: 'maps-key',
      openweather_api_key: 'ow-key',
      unsplash_api_key: 'un-key',
      avatar: 'avatar.png',
    });

    // Simulate a baseline restore clobbering the row, then restore the preserved values.
    testDb
      .prepare(
        'UPDATE users SET password_hash = ?, maps_api_key = NULL, openweather_api_key = NULL, unsplash_api_key = NULL, avatar = NULL WHERE id = ?',
      )
      .run('stale-hash-from-baseline', user.id);

    await demo.restoreAdminCredentials('admin@nomad.app', before!);

    const after = testDb
      .prepare(
        'SELECT password_hash, maps_api_key, openweather_api_key, unsplash_api_key, avatar FROM users WHERE id = ?',
      )
      .get(user.id);
    expect(after).toEqual(before);
  });

  it('DEMOREPO-CRED-002 (DMR5): writes exactly the 5 named columns, no updated_at bump', async () => {
    const { user } = createAdmin(testDb, { email: 'admin@nomad.app' });
    const before = testDb.prepare('SELECT updated_at FROM users WHERE id = ?').get(user.id) as {
      updated_at: string | null;
    };
    await demo.restoreAdminCredentials('admin@nomad.app', {
      password_hash: 'h',
      maps_api_key: 'm',
      openweather_api_key: 'o',
      unsplash_api_key: 'u',
      avatar: 'a',
    });
    const after = testDb.prepare('SELECT updated_at FROM users WHERE id = ?').get(user.id) as {
      updated_at: string | null;
    };
    expect(after.updated_at).toBe(before.updated_at);
  });

  it('DEMOREPO-KEYS-001 (DMR2/DMR6 round trip): getInstanceApiKeys preserves a NULL value, restoreInstanceApiKeys writes it back as NULL', async () => {
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('maps_api_key', 'a-maps-key')").run();
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('unsplash_api_key', NULL)").run();

    const rows = await demo.getInstanceApiKeys();
    expect(rows.sort((a, b) => a.key.localeCompare(b.key))).toEqual([
      { key: 'maps_api_key', value: 'a-maps-key' },
      { key: 'unsplash_api_key', value: null },
    ]);

    // Clobber, then restore from what was read.
    testDb.prepare("UPDATE app_settings SET value = 'clobbered' WHERE key = 'maps_api_key'").run();
    await demo.restoreInstanceApiKeys(rows);

    const after = testDb
      .prepare("SELECT key, value FROM app_settings WHERE key IN ('maps_api_key', 'unsplash_api_key') ORDER BY key")
      .all();
    expect(after).toEqual([
      { key: 'maps_api_key', value: 'a-maps-key' },
      { key: 'unsplash_api_key', value: null },
    ]);
  });

  it('DEMOREPO-KEYS-002: restoreInstanceApiKeys upserts a row that did not previously exist', async () => {
    await demo.restoreInstanceApiKeys([{ key: 'maps_api_key', value: 'brand-new' }]);
    const row = testDb.prepare("SELECT value FROM app_settings WHERE key = 'maps_api_key'").get() as { value: string };
    expect(row.value).toBe('brand-new');
  });
});
