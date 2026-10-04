import { buildLegacyStepMap, migrateToHead } from '../../../src/db/legacy-baseline';
import { Migration20200101040500_a_place_that_moves_takes_its_atlas as PlaceRegionsTrigger } from '../../../src/db/migrations/Migration20200101040500_a_place_that_moves_takes_its_atlas';
import { Migration20200101040700_the_2527_trigger_once_more_for_an as PlaceRegionsTriggerAgain } from '../../../src/db/migrations/Migration20200101040700_the_2527_trigger_once_more_for_an';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import {
  createMigrationOrm,
  migrateTo,
  migratorOf,
  rawExec,
  rawQuery,
  runMigrationDirect,
} from '../../helpers/migration-step';
import type { MikroORM } from '@mikro-orm/sqlite';

import type Database from 'better-sqlite3';
import fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// place_regions is Atlas's cache of the country and region a place resolved to.
// It is derived from the place's lat, lng and address, so a change to any of them
// has to take the row with it, whichever code path wrote the change (#2527).

// The trigger ships at legacy step 244, the same slot as on main (4.3.3). Web Push
// moved up to 245 to make room, and 246 creates the trigger again for an instance
// that ran Web Push at 244 before. Each step is its own MikroORM migration, mapped
// by its `Legacy migration step N` docstring; an install the legacy runner left at
// one of these steps is baselined by db/legacy-baseline.ts and runs the rest.
const PLACE_REGIONS_TRIGGER_VERSION = 244;
const WEB_PUSH_VERSION = 245;
const PLACE_REGIONS_TRIGGER_AGAIN_VERSION = 246;

describe('place_regions follows the place it was resolved from (#2527)', () => {
  describe('the live trigger', () => {
    let db: Database.Database;
    let placeId: number;
    let otherPlaceId: number;

    const cached = (id: number) =>
      db.prepare('SELECT country_code, region_code FROM place_regions WHERE place_id = ?').get(id) as
        { country_code: string; region_code: string } | undefined;

    beforeEach(() => {
      db = createSnapshotTestDb();
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
      db.prepare("UPDATE places SET place_time = '09:00', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
        otherPlaceId,
      );

      expect(cached(placeId)).toEqual({ country_code: 'FR', region_code: 'FR-IDF' });
      expect(cached(otherPlaceId)).toEqual({ country_code: 'FR', region_code: 'FR-IDF' });
    });
  });

  it('ships at its own legacy step and replays without a second trigger', async () => {
    // The live trigger behaves as above; the replay runs on a migration-only
    // database, where each step can be applied on its own.
    const orm = await createMigrationOrm();
    try {
      const triggers = () =>
        rawQuery(
          orm,
          "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'places' AND name = 'trg_place_regions_follow_place'",
        );
      await migratorOf(orm).up();
      expect(await triggers()).toHaveLength(1);

      await rawExec(orm, 'DROP TRIGGER trg_place_regions_follow_place');
      expect(await triggers()).toHaveLength(0);

      await runMigrationDirect(orm, PlaceRegionsTrigger);
      await runMigrationDirect(orm, PlaceRegionsTrigger);
      await runMigrationDirect(orm, PlaceRegionsTriggerAgain);
      expect(await triggers()).toHaveLength(1);

      await rawExec(orm, "INSERT INTO users (username, email, password_hash) VALUES ('t', 't@example.test', 'x')");
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) SELECT 1, id, 'Trip' FROM users");
      await rawExec(orm, "INSERT INTO places (id, trip_id, name, lat, lng) VALUES (1, 1, 'Hotel', 48.8566, 2.3522)");
      await rawExec(
        orm,
        "INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES (1, 'FR', 'FR-IDF', 'Ile-de-France')",
      );
      await rawExec(orm, 'UPDATE places SET lat = ? WHERE id = 1', [52.5163]);
      expect(await rawQuery(orm, 'SELECT 1 FROM place_regions WHERE place_id = 1')).toEqual([]);
    } finally {
      await orm.close(true);
    }
  }, 30000);

  it('keeps the slot it has on main, with Web Push after it and the trigger once more after that', async () => {
    const orm = await createMigrationOrm();
    try {
      const pending = await migratorOf(orm).getPending();
      const map = buildLegacyStepMap(pending);
      const sourceOf = (step: number): string => {
        const migration = pending.find((m) => m.name === map.steps.get(step));
        return fs.readFileSync(migration!.path!, 'utf8');
      };

      expect(map.steps.get(PLACE_REGIONS_TRIGGER_VERSION)).toBe(
        'Migration20200101040500_a_place_that_moves_takes_its_atlas',
      );
      expect(sourceOf(PLACE_REGIONS_TRIGGER_VERSION)).toContain('await createPlaceRegionsFollowPlaceTrigger(this)');
      expect(sourceOf(WEB_PUSH_VERSION)).toContain('CREATE TABLE IF NOT EXISTS push_subscriptions');
      expect(sourceOf(WEB_PUSH_VERSION)).not.toMatch(
        /trg_place_regions_follow_place|createPlaceRegionsFollowPlaceTrigger/,
      );
      expect(sourceOf(PLACE_REGIONS_TRIGGER_AGAIN_VERSION)).toContain(
        'await createPlaceRegionsFollowPlaceTrigger(this)',
      );
      // Nothing after it creates the trigger a third time.
      for (let step = PLACE_REGIONS_TRIGGER_AGAIN_VERSION + 1; step <= map.finalStep; step++) {
        expect(sourceOf(step), `legacy step ${step}`).not.toMatch(
          /trg_place_regions_follow_place|createPlaceRegionsFollowPlaceTrigger/,
        );
      }
    } finally {
      await orm.close(true);
    }
  }, 30000);

  describe('an install the legacy runner left at step 244', () => {
    let orm: MikroORM;

    const triggers = () =>
      rawQuery(
        orm,
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'places' AND name = 'trg_place_regions_follow_place'",
      );
    const pushTable = () =>
      rawQuery(
        orm,
        "SELECT name FROM sqlite_master WHERE tbl_name = 'push_subscriptions' AND type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' ORDER BY name",
      );
    const recorded = async () =>
      (await rawQuery<{ name: string }>(orm, 'SELECT name FROM mikro_orm_migrations')).map((r) => r.name);

    /**
     * What the positional runner left behind at step 244: the schema of every
     * step up to it, a `schema_version` row and no MikroORM bookkeeping. The
     * schema comes from the chain itself, then the bookkeeping is swapped for
     * the legacy row, so the next boot sees exactly what an upgrade sees.
     */
    async function legacyInstallAt244(): Promise<void> {
      await migrateTo(orm, 'Migration20200101040500_a_place_that_moves_takes_its_atlas');
      await rawExec(orm, 'DELETE FROM mikro_orm_migrations');
      await rawExec(orm, 'DROP TABLE IF EXISTS schema_version');
      await rawExec(orm, 'CREATE TABLE schema_version (version INTEGER NOT NULL)');
      await rawExec(orm, 'INSERT INTO schema_version (version) VALUES (?)', [PLACE_REGIONS_TRIGGER_VERSION]);
    }

    const boot = () => migrateToHead(orm.em.getConnection(), migratorOf(orm));

    beforeEach(async () => {
      orm = await createMigrationOrm();
    });

    afterEach(async () => {
      await orm.close(true);
    });

    it('gives a 4.3.3 install, already at 244 with the trigger, the Web Push table', async () => {
      await legacyInstallAt244();
      expect(await pushTable()).toEqual([]);

      await boot();

      expect(await pushTable()).toEqual([{ name: 'idx_push_subscriptions_user' }, { name: 'push_subscriptions' }]);
      expect(await triggers()).toHaveLength(1);
      expect(await recorded()).toContain('Migration20200101040700_the_2527_trigger_once_more_for_an');
    }, 30000);

    it('gives an instance that ran Web Push at 244 the trigger and keeps its subscriptions', async () => {
      await legacyInstallAt244();
      await rawExec(orm, 'DROP TRIGGER trg_place_regions_follow_place');
      // Web Push at 244, as that instance ran it.
      await rawExec(
        orm,
        `CREATE TABLE push_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          vapid_public_key TEXT NOT NULL,
          user_agent TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_success_at TEXT,
          failure_count INTEGER NOT NULL DEFAULT 0
        )`,
      );
      await rawExec(orm, 'CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id)');
      await rawExec(
        orm,
        "INSERT INTO users (username, email, password_hash) VALUES ('traveller', 'traveller@example.test', 'x')",
      );
      await rawExec(
        orm,
        "INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, vapid_public_key) SELECT id, 'https://push.example.test/1', 'p', 'a', 'v' FROM users",
      );
      await rawExec(orm, "INSERT INTO trips (id, user_id, title) SELECT 1, id, 'Trip' FROM users");
      await rawExec(
        orm,
        "INSERT INTO places (id, trip_id, name, lat, lng, address) VALUES (1, 1, 'Hotel', 48.8566, 2.3522, 'Rue de Rivoli, Paris, France'), (2, 1, 'Museum', 48.8606, 2.3376, 'Rue de Rivoli, Paris, France')",
      );
      await rawExec(
        orm,
        "INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES (1, 'FR', 'FR-IDF', 'Ile-de-France'), (2, 'FR', 'FR-IDF', 'Ile-de-France')",
      );

      await boot();

      expect(await triggers()).toHaveLength(1);
      expect(await rawQuery(orm, 'SELECT endpoint FROM push_subscriptions')).toEqual([
        { endpoint: 'https://push.example.test/1' },
      ]);
      expect(await recorded()).toContain('Migration20200101040700_the_2527_trigger_once_more_for_an');
      await rawExec(orm, 'UPDATE places SET lat = ?, lng = ? WHERE id = 1', [52.5163, 13.3777]);
      expect(await rawQuery(orm, 'SELECT country_code, region_code FROM place_regions WHERE place_id = 1')).toEqual([]);
      expect(await rawQuery(orm, 'SELECT country_code, region_code FROM place_regions WHERE place_id = 2')).toEqual([
        { country_code: 'FR', region_code: 'FR-IDF' },
      ]);
    }, 30000);
  });
});
