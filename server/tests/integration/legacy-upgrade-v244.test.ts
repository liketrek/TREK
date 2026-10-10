/**
 * An install of the v4.3.3 release (the last one shipped with the positional
 * runner, schema_version 244) boots on this release: the most common upgrade
 * there is. Its rows span the main tables, so beyond the shared assertions in
 * tests/helpers/legacy-upgrade-suite.ts this checks that the data comes through
 * and that the boot copied the database before it migrated it.
 */
import { db as legacyDb } from '../../src/db/database';
import { openLegacyFixture } from '../helpers/legacy-fixture';
import { describeLegacyUpgrade } from '../helpers/legacy-upgrade-suite';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { buildDbMock } = await import('../helpers/db-mock');
  const { openLegacyFixture } = await import('../helpers/legacy-fixture');
  return buildDbMock(openLegacyFixture('legacy-v244'));
});
vi.mock('../../src/websocket', () => ({
  broadcast: vi.fn(),
  broadcastToUser: vi.fn(),
  getOnlineUserIds: vi.fn(() => []),
}));

// Off by default under NODE_ENV=test; this suite is the one that asks for it.
const previousSwitch = process.env.TREK_DB_PRE_MIGRATE_SNAPSHOT;
beforeAll(() => {
  process.env.TREK_DB_PRE_MIGRATE_SNAPSHOT = 'true';
});
afterAll(() => {
  if (previousSwitch === undefined) delete process.env.TREK_DB_PRE_MIGRATE_SNAPSHOT;
  else process.env.TREK_DB_PRE_MIGRATE_SNAPSHOT = previousSwitch;
});

/** The user data the fixture carries, table by table. */
const DATA_TABLES = [
  'users',
  'settings',
  'trips',
  'trip_members',
  'days',
  'places',
  'day_accommodations',
  'day_assignments',
  'day_notes',
  'reservations',
  'reservation_endpoints',
  'budget_items',
  'budget_item_members',
  'packing_bags',
  'packing_items',
  'todo_items',
  'collab_notes',
  'trip_files',
  'tags',
  'place_tags',
  'journeys',
  'journey_trips',
  'journey_contributors',
  'journey_entries',
  'notifications',
];

function rows(db: Database.Database, table: string, columns: string[]): unknown[] {
  const list = columns.map((column) => `"${column}"`).join(', ');
  return db.prepare(`SELECT ${list} FROM "${table}" ORDER BY rowid`).all();
}

describeLegacyUpgrade(
  { fixture: 'legacy-v244', version: 244, reseated: 0, nightOrderIndex: 3, id: 'LEGACYUP-244' },
  legacyDb,
  ({ logged }) => {
    it('LEGACYUP-244-101: every row of the main tables comes through with the values it had', () => {
      const pristine = openLegacyFixture('legacy-v244');
      try {
        for (const table of DATA_TABLES) {
          const columns = (
            pristine.prepare('SELECT name FROM pragma_table_info(?)').all(table) as Array<{ name: string }>
          ).map((column) => column.name);
          const before = rows(pristine, table, columns);
          expect(before.length, `${table} carries rows in the fixture`).toBeGreaterThan(0);
          expect(rows(legacyDb, table, columns), table).toEqual(before);
        }
      } finally {
        pristine.close();
      }
    });

    it('LEGACYUP-244-102: the boot copied the v4.3.3 database before migrating it, and the copy is the old schema', () => {
      const line = logged.find((entry) => entry.startsWith('[DB] Copy of the database before migrating: '));
      expect(line).toBeDefined();
      const snapshot = line!.slice('[DB] Copy of the database before migrating: '.length);
      expect(path.dirname(snapshot)).toBe(path.dirname(legacyDb.name));
      expect(path.basename(snapshot)).toMatch(/^pre-migrate-legacy-244-\d{8}T\d{6}Z\.db$/);
      expect(fs.existsSync(snapshot)).toBe(true);

      const copy = new Database(snapshot, { readonly: true });
      try {
        expect(copy.prepare('SELECT version FROM schema_version').all()).toEqual([{ version: 244 }]);
        expect(copy.prepare('SELECT COUNT(*) AS c FROM mikro_orm_migrations').get()).toEqual({ c: 0 });
        expect(copy.prepare('SELECT COUNT(*) AS c FROM users').get()).toEqual({ c: 3 });
        const tripColumns = (
          copy.prepare('SELECT name FROM pragma_table_info(?)').all('trips') as Array<{ name: string }>
        ).map((column) => column.name);
        expect(tripColumns).not.toContain('reminder_sent_for');
      } finally {
        copy.close();
      }
    });

    it('LEGACYUP-244-103: a reminder whose day already passed is marked sent, so the upgrade does not repeat it', () => {
      // Trip 1 (2027-05-10, three days ahead) is upcoming until its reminder day passes.
      const today = new Date().toISOString().slice(0, 10);
      expect(legacyDb.prepare('SELECT id, reminder_sent_for FROM trips ORDER BY id').all()).toEqual([
        { id: 1, reminder_sent_for: '2027-05-07' < today ? '2027-05-10' : null },
        { id: 2, reminder_sent_for: '2026-03-01' },
      ]);
    });
  },
);
