import { FORK_RECONCILIATION, FORK_TIMING_MIGRATION } from '../../../src/db/fork-migrations';
import { BootstrapMigrator, migrateToHead, planLegacyBaseline } from '../../../src/db/legacy-baseline';
import { reseatBookedNights } from '../../../src/db/reseat-booked-nights';
import { openLegacyFixture, removeLegacyFixtureFiles } from '../../helpers/legacy-fixture';
import { MikroORM } from '@mikro-orm/sqlite';

import type Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const migrations = path.join(__dirname, '../../../src/db/migrations');
const directories: string[] = [];
function source(db: Database.Database, query: string) {
  // test-sql-allow: verifies historical schema values before current entities are valid.
  return db.prepare(query);
}
async function open(name?: 'fork-v244' | 'fork-v244-itinerary') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-timing-upgrade-'));
  directories.push(dir);
  let file = path.join(dir, 'fresh.db');
  if (name) {
    const db = openLegacyFixture(name);
    file = db.name;
    db.close();
  }
  const orm = await MikroORM.init({
    entities: [],
    discovery: { warnWhenNoEntities: false },
    migrations: { path: migrations, pathTs: migrations, snapshot: false, silent: true },
    dbName: file,
  });
  const connection = orm.em.getConnection();
  const db = await connection.getNativeClient();
  const migrator = new BootstrapMigrator(orm.em);
  const boot = () => migrateToHead(connection, migrator);
  return { orm, db, boot, migrator };
}
afterEach(() => {
  removeLegacyFixtureFiles();
  for (const dir of directories.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});
const queries = [
  'SELECT id, timing_json FROM days ORDER BY id',
  'SELECT id, stay_minutes, times_explicit, assignment_time, assignment_end_time FROM day_assignments ORDER BY id',
  'SELECT id,reservation_time,reservation_end_time FROM reservations ORDER BY id',
  'SELECT * FROM fork_schema_migrations ORDER BY id',
];
function values(db: Database.Database) {
  return queries.map((query) => source(db, query).all());
}
describe('current release itinerary upgrade', () => {
  it('preserves populated five-ID release data and reruns unchanged', async () => {
    const { orm, db, boot } = await open('fork-v244-itinerary');
    try {
      const before = values(db);
      await boot();
      expect(values(db)).toEqual(before);
      expect(db.pragma('foreign_key_check')).toEqual([]);
      expect(source(db, 'SELECT name FROM mikro_orm_migrations').pluck().all()).toContain(FORK_TIMING_MIGRATION);
      await boot();
      expect(values(db)).toEqual(before);
    } finally {
      await orm.close(true);
    }
  });
  it('widens the existing visit stay limit without losing assignments or foreign keys', async () => {
    const { orm, db, boot } = await open('fork-v244-itinerary');
    try {
      const setStay = source(db, 'UPDATE day_assignments SET stay_minutes = ? WHERE id = 1');
      const stay = source(db, 'SELECT stay_minutes FROM day_assignments WHERE id = 1').pluck();
      expect(() => setStay.run(10_080)).toThrow(/CHECK constraint failed/i);
      await boot();
      for (const minutes of [null, 0, 1440, 10_080]) {
        setStay.run(minutes);
        expect(stay.get()).toBe(minutes);
      }
      expect(() => setStay.run(10_081)).toThrow(/CHECK constraint failed/i);
      await boot();
      expect(stay.get()).toBe(10_080);
      expect(db.pragma('foreign_key_check')).toEqual([]);
    } finally {
      await orm.close(true);
    }
  });

  it('baselines the frozen night reseat step and preserves explicitly cleared visits and drawn roads', async () => {
    const { orm, db, boot, migrator } = await open('fork-v244-itinerary');
    try {
      source(db, 'UPDATE places SET lat=48, lng=2 WHERE id=1').run();
      source(db, "INSERT INTO places (id,trip_id,name,lat,lng) VALUES (2,1,'Hotel',49,3)").run();
      source(
        db,
        "INSERT INTO day_accommodations (id,trip_id,place_id,start_day_id,end_day_id,check_in) VALUES (1,1,2,1,2,'15:00')",
      ).run();
      source(db, 'UPDATE day_assignments SET order_index=1 WHERE id=1').run();
      source(
        db,
        'INSERT INTO day_assignments (id,day_id,place_id,order_index,accommodation_id) VALUES (3,1,2,0,1)',
      ).run();
      source(
        db,
        'INSERT INTO roadtrip_vias (id,day_id,after_order_index,sequence,lat,lng) VALUES (1,1,0,0,48.5,2.5)',
      ).run();
      const projections = () => [
        source(db, 'SELECT id,order_index FROM day_assignments ORDER BY id').all(),
        source(db, 'SELECT * FROM roadtrip_vias ORDER BY id').all(),
        ...values(db),
      ];
      const before = projections();
      // The frozen rule would inherit 09:00 from the place, moving the hotel
      // behind the explicitly untimed visit. Prove this fixture exposes that risk.
      db.exec('BEGIN');
      try {
        expect(reseatBookedNights(db)).toBe(1);
        expect(projections()).not.toEqual(before);
      } finally {
        db.exec('ROLLBACK');
      }
      const baseline = await planLegacyBaseline(orm.em.getConnection(), migrator);
      expect(baseline).toContain('Migration20200101040300_a_booked_night_finally_took_the_seat_a_new');
      await boot();
      expect(source(db, 'SELECT name FROM mikro_orm_migrations').pluck().all()).toContain(
        'Migration20200101040300_a_booked_night_finally_took_the_seat_a_new',
      );
      expect(projections()).toEqual(before);
      await boot();
      expect(projections()).toEqual(before);
      expect(db.pragma('foreign_key_check')).toEqual([]);
    } finally {
      await orm.close(true);
    }
  });
  it('opts existing pre-feature days out and enables newly created days once', async () => {
    const { orm, db, boot } = await open('fork-v244');
    try {
      source(db, 'INSERT INTO days (trip_id,day_number) VALUES (1,1)').run();
      await boot();
      expect(
        JSON.parse(source(db, 'SELECT timing_json FROM days WHERE day_number=1').pluck().get() as string).enabled,
      ).toBe(false);
      source(db, 'INSERT INTO days (trip_id,day_number) VALUES (1,2)').run();
      expect(
        JSON.parse(source(db, 'SELECT timing_json FROM days WHERE day_number=2').pluck().get() as string).enabled,
      ).toBe(true);
      await boot();
      expect(
        JSON.parse(source(db, 'SELECT timing_json FROM days WHERE day_number=2').pluck().get() as string).enabled,
      ).toBe(true);
    } finally {
      await orm.close(true);
    }
  });
  it('advances the previous four-ID ORM generation without rejecting its ledger', async () => {
    const { orm, db, boot, migrator } = await open();
    try {
      await migrator.up({ to: FORK_RECONCILIATION });
      const before = source(db, 'SELECT * FROM fork_schema_migrations ORDER BY id').all();
      expect(before).toHaveLength(4);
      await boot();
      expect(source(db, 'SELECT * FROM fork_schema_migrations ORDER BY id').all()).toEqual(
        expect.arrayContaining(before),
      );
      expect(source(db, 'SELECT id FROM fork_schema_migrations').all()).toHaveLength(5);
      await boot();
    } finally {
      await orm.close(true);
    }
  });
  it('installs timing on a fresh database', async () => {
    const { orm, db, boot } = await open();
    try {
      await boot();
      expect(source(db, 'SELECT id FROM fork_schema_migrations').pluck().all()).toContain('fork/itinerary-timing-v1');
      expect(source(db, "SELECT name FROM pragma_table_info('days')").pluck().all()).toContain('timing_json');
    } finally {
      await orm.close(true);
    }
  });
  it('rejects a fifth ledger row without its schema before any writes', async () => {
    const { orm, db, boot } = await open('fork-v244');
    try {
      source(db, 'INSERT INTO fork_schema_migrations (id) VALUES (?)').run('fork/itinerary-timing-v1');
      const before = db.serialize();
      await expect(boot()).rejects.toThrow('Unrecognized or incomplete fork migration');
      expect(db.serialize()).toEqual(before);
    } finally {
      await orm.close(true);
    }
  });
});
