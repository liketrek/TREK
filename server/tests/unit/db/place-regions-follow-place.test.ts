import { runMigrations } from '../../../src/db/migrations';
import { createTestDb } from '../../helpers/test-db';

import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// place_regions is Atlas's cache of the country and region a place resolved to.
// It is derived from the place's lat, lng and address, so a change to any of them
// has to take the row with it, whichever code path wrote the change (#2527).

// The trigger ships at schema version 244, the same slot as on main (4.3.3). Web Push
// moved up to 245 to make room, and 246 creates the trigger again for an instance
// that ran Web Push at 244 before. Later migrations are appended after these, so the
// cases rewind to just before them; every step from 244 on is idempotent.
const PLACE_REGIONS_TRIGGER_VERSION = 244;
const WEB_PUSH_VERSION = 245;
const PLACE_REGIONS_TRIGGER_AGAIN_VERSION = 246;

describe('place_regions follows the place it was resolved from (#2527)', () => {
  let db: Database.Database;
  let placeId: number;
  let otherPlaceId: number;

  const cached = (id: number) =>
    db.prepare('SELECT country_code, region_code FROM place_regions WHERE place_id = ?').get(id) as
      | { country_code: string; region_code: string }
      | undefined;

  beforeEach(() => {
    db = createTestDb();
    db.exec("INSERT INTO users (username, email, password_hash) VALUES ('traveller', 'traveller@example.test', 'x')");
    const userId = (db.prepare('SELECT id FROM users').get() as { id: number }).id;
    const tripId = db.prepare("INSERT INTO trips (user_id, title) VALUES (?, 'Trip')").run(userId)
      .lastInsertRowid as number;
    const insertPlace = db.prepare('INSERT INTO places (trip_id, name, lat, lng, address) VALUES (?, ?, ?, ?, ?)');
    placeId = insertPlace.run(tripId, 'Hotel', 48.8566, 2.3522, 'Rue de Rivoli, Paris, France')
      .lastInsertRowid as number;
    otherPlaceId = insertPlace.run(tripId, 'Museum', 48.8606, 2.3376, 'Rue de Rivoli, Paris, France')
      .lastInsertRowid as number;
    const insertRegion = db.prepare(
      "INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, 'FR', 'FR-IDF', 'Ile-de-France')",
    );
    insertRegion.run(placeId);
    insertRegion.run(otherPlaceId);
  });

  afterEach(() => db?.close());

  it('drops the cached region when the coordinates move', () => {
    db.prepare('UPDATE places SET lat = ?, lng = ? WHERE id = ?').run(52.5163, 13.3777, placeId);

    expect(cached(placeId)).toBeUndefined();
    expect(cached(otherPlaceId)).toEqual({ country_code: 'FR', region_code: 'FR-IDF' });
  });

  it('drops it when only the latitude or only the longitude changes', () => {
    db.prepare('UPDATE places SET lat = ? WHERE id = ?').run(48.9, placeId);
    db.prepare('UPDATE places SET lng = ? WHERE id = ?').run(2.4, otherPlaceId);

    expect(cached(placeId)).toBeUndefined();
    expect(cached(otherPlaceId)).toBeUndefined();
  });

  it('drops it when the address changes, including one filled in where there was none', () => {
    db.prepare('UPDATE places SET address = ? WHERE id = ?').run('Pariser Platz, Berlin, Germany', placeId);
    db.prepare('UPDATE places SET address = NULL WHERE id = ?').run(otherPlaceId);
    db.prepare(
      "INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, 'FR', 'FR-IDF', 'Ile-de-France')",
    ).run(otherPlaceId);
    // The import backfill only ever fills an empty address.
    db.prepare('UPDATE places SET address = COALESCE(address, ?) WHERE id = ?').run('Paris, France', otherPlaceId);

    expect(cached(placeId)).toBeUndefined();
    expect(cached(otherPlaceId)).toBeUndefined();
  });

  it('drops it when the location is cleared', () => {
    db.prepare('UPDATE places SET lat = NULL, lng = NULL WHERE id = ?').run(placeId);

    expect(cached(placeId)).toBeUndefined();
  });

  it('keeps it when an edit writes the same location back', () => {
    // The place editor and update_place write every column, location included.
    db.prepare(
      "UPDATE places SET name = 'Hotel du Louvre', notes = 'late check-in', lat = ?, lng = ?, address = ? WHERE id = ?",
    ).run(48.8566, 2.3522, 'Rue de Rivoli, Paris, France', placeId);
    db.prepare("UPDATE places SET place_time = '09:00', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(otherPlaceId);

    expect(cached(placeId)).toEqual({ country_code: 'FR', region_code: 'FR-IDF' });
    expect(cached(otherPlaceId)).toEqual({ country_code: 'FR', region_code: 'FR-IDF' });
  });

  const triggers = () =>
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'places' AND name = 'trg_place_regions_follow_place'",
      )
      .all();
  const pushTable = () =>
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE tbl_name = 'push_subscriptions' AND type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all();
  const version = () => (db.prepare('SELECT version FROM schema_version').get() as { version: number }).version;

  it('ships at its own schema version and replays without a second trigger', () => {
    expect(triggers()).toHaveLength(1);

    db.exec('DROP TRIGGER trg_place_regions_follow_place');
    db.prepare('UPDATE schema_version SET version = ?').run(PLACE_REGIONS_TRIGGER_AGAIN_VERSION);
    runMigrations(db);
    expect(triggers()).toHaveLength(0);

    db.prepare('UPDATE schema_version SET version = ?').run(PLACE_REGIONS_TRIGGER_VERSION - 1);
    runMigrations(db);
    runMigrations(db);
    expect(triggers()).toHaveLength(1);

    db.prepare('UPDATE places SET lat = ? WHERE id = ?').run(52.5163, placeId);
    expect(cached(placeId)).toBeUndefined();
  });

  it('keeps the slot it has on main, with Web Push after it and the trigger once more after that', () => {
    const sqlByVersion = new Map<number, string>();
    let running = 0;
    const log = vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      const match = /Running migration (\d+)\//.exec(String(message));
      if (match) running = Number(match[1]);
    });
    const realExec = db.exec.bind(db);
    const exec = vi.spyOn(db, 'exec').mockImplementation((sql: string) => {
      if (running) sqlByVersion.set(running, (sqlByVersion.get(running) ?? '') + sql);
      return realExec(sql);
    });
    try {
      db.prepare('UPDATE schema_version SET version = ?').run(PLACE_REGIONS_TRIGGER_VERSION - 1);
      runMigrations(db);
    } finally {
      exec.mockRestore();
      log.mockRestore();
    }

    expect(sqlByVersion.get(PLACE_REGIONS_TRIGGER_VERSION)).toContain(
      'CREATE TRIGGER IF NOT EXISTS trg_place_regions_follow_place',
    );
    expect(sqlByVersion.get(WEB_PUSH_VERSION)).toContain('CREATE TABLE IF NOT EXISTS push_subscriptions');
    expect(sqlByVersion.get(WEB_PUSH_VERSION)).not.toContain('trg_place_regions_follow_place');
    expect(sqlByVersion.get(PLACE_REGIONS_TRIGGER_AGAIN_VERSION)).toContain(
      'CREATE TRIGGER IF NOT EXISTS trg_place_regions_follow_place',
    );
    expect(triggers()).toHaveLength(1);
  });

  it('gives a 4.3.3 install, already at 244 with the trigger, the Web Push table', () => {
    db.exec('DROP TABLE push_subscriptions');
    db.prepare('UPDATE schema_version SET version = ?').run(PLACE_REGIONS_TRIGGER_VERSION);
    expect(pushTable()).toEqual([]);

    runMigrations(db);

    expect(pushTable()).toEqual([{ name: 'idx_push_subscriptions_user' }, { name: 'push_subscriptions' }]);
    expect(triggers()).toHaveLength(1);
    expect(version()).toBeGreaterThanOrEqual(PLACE_REGIONS_TRIGGER_AGAIN_VERSION);
  });

  it('gives an instance that ran Web Push at 244 the trigger and keeps its subscriptions', () => {
    db.exec('DROP TRIGGER trg_place_regions_follow_place');
    db.prepare('UPDATE schema_version SET version = ?').run(PLACE_REGIONS_TRIGGER_VERSION);
    db.prepare(
      "INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, vapid_public_key) SELECT id, 'https://push.example.test/1', 'p', 'a', 'v' FROM users",
    ).run();

    runMigrations(db);

    expect(triggers()).toHaveLength(1);
    expect(db.prepare('SELECT endpoint FROM push_subscriptions').all()).toEqual([
      { endpoint: 'https://push.example.test/1' },
    ]);
    expect(version()).toBeGreaterThanOrEqual(PLACE_REGIONS_TRIGGER_AGAIN_VERSION);
    db.prepare('UPDATE places SET lat = ?, lng = ? WHERE id = ?').run(52.5163, 13.3777, placeId);
    expect(cached(placeId)).toBeUndefined();
    expect(cached(otherPlaceId)).toEqual({ country_code: 'FR', region_code: 'FR-IDF' });
  });
});
