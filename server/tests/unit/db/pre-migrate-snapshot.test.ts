/**
 * The copy of the database a boot takes before it migrates
 * (`src/db/pre-migrate-snapshot.ts`), driven through `migrateToHead` against a
 * temp FILE database, because an in-memory one has nothing to copy.
 *
 * The end-to-end case (a v4.3.3 install booting through `buildApp()`) is
 * `tests/integration/legacy-upgrade-v244.test.ts`.
 */
import { readEnv, type AppEnv } from '../../../src/app-config';
import { knownMigrationNames } from '../../../src/db/known-migrations';
import { migrateToHead, migrationLabel } from '../../../src/db/legacy-baseline';
import { listSnapshots, preMigrateSnapshot, pruneSnapshots } from '../../../src/db/pre-migrate-snapshot';
import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/sqlite';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const MIGRATIONS = path.join(__dirname, '../../../src/db/migrations');
const MIDPOINT = 'Migration20200101040200_trek_photo_cache_meta_cache_key_not_null';
const NOW = new Date('2026-10-08T09:15:00.123Z');
const STAMP = '20261008T091500Z';

let dir: string;
let dbFile: string;
let orm: MikroORM;

function ormFor(dbName: string): Promise<MikroORM> {
  return MikroORM.init({
    entities: [],
    discovery: { warnWhenNoEntities: false },
    extensions: [Migrator],
    migrations: { path: MIGRATIONS, pathTs: MIGRATIONS, snapshot: false, silent: true },
    dbName,
  });
}

const migrator = () => orm.config.getExtension('@mikro-orm/migrator') as Migrator;

/** The live env with the snapshot switches set as given. */
function envWith(db: Partial<AppEnv['db']>, isTest = false): () => AppEnv {
  return () => {
    const env = readEnv();
    return { ...env, app: { ...env.app, isTest }, db: { ...env.db, ...db } };
  };
}

function migrate(env: () => AppEnv): Promise<void> {
  const connection = orm.em.getConnection();
  return migrateToHead(
    connection,
    migrator(),
    undefined,
    undefined,
    preMigrateSnapshot(connection, env, () => NOW),
  );
}

async function recorded(): Promise<string[]> {
  const rows: Array<{ name: string }> = await orm.em
    .getConnection()
    .execute('SELECT name FROM mikro_orm_migrations ORDER BY id');
  return rows.map((row) => row.name);
}

const snapshotsIn = () =>
  fs
    .readdirSync(dir)
    .filter((entry) => entry.startsWith('pre-migrate-'))
    .sort();

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-premigrate-'));
  dbFile = path.join(dir, 'travel.db');
  orm = await ormFor(dbFile);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  await orm.close(true);
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('the pre-migration snapshot', () => {
  it('PREMIG-001: copies a database that is behind before migrating it, named after the schema it holds', async () => {
    await migrator().up({ to: MIDPOINT });
    await orm.em
      .getConnection()
      .execute(`INSERT INTO users (username, email, password_hash) VALUES ('kept', 'kept@example.test', 'x')`);
    const before = await recorded();

    await migrate(envWith({ preMigrateSnapshot: true }));

    const name = `pre-migrate-${migrationLabel(MIDPOINT)}-${STAMP}.db`;
    expect(snapshotsIn()).toEqual([name]);
    expect(await recorded()).toHaveLength(knownMigrationNames().size);
    const copy = new Database(path.join(dir, name), { readonly: true });
    try {
      // The copy holds the state from before the run: its rows and its migrations.
      expect(copy.prepare('SELECT email FROM users').all()).toEqual([{ email: 'kept@example.test' }]);
      expect(
        (copy.prepare('SELECT name FROM mikro_orm_migrations ORDER BY id').all() as Array<{ name: string }>).map(
          (r) => r.name,
        ),
      ).toEqual(before);
    } finally {
      copy.close();
    }
  });

  it('PREMIG-002: a legacy install is labelled by its schema_version', async () => {
    await orm.em.getConnection().execute('CREATE TABLE schema_version (version INTEGER NOT NULL)');
    await orm.em.getConnection().execute('INSERT INTO schema_version (version) VALUES (10)');
    await migrate(envWith({ preMigrateSnapshot: true }));
    expect(snapshotsIn()).toEqual([`pre-migrate-legacy-10-${STAMP}.db`]);
  });

  it('PREMIG-003: a fresh install, a restart with nothing pending and the test default take none', async () => {
    await migrate(envWith({ preMigrateSnapshot: true }));
    expect(snapshotsIn()).toEqual([]);

    await migrate(envWith({ preMigrateSnapshot: true }));
    expect(snapshotsIn()).toEqual([]);

    await orm.close(true);
    fs.rmSync(dbFile);
    orm = await ormFor(dbFile);
    await migrator().up({ to: MIDPOINT });
    await migrate(envWith({ preMigrateSnapshot: undefined }, true));
    expect(snapshotsIn()).toEqual([]);
    expect(await recorded()).toHaveLength(knownMigrationNames().size);
  });

  it('PREMIG-004: a copy that cannot be written refuses the boot and migrates nothing', async () => {
    await migrator().up({ to: MIDPOINT });
    const before = await recorded();
    // A directory where the copy has to land makes the final rename fail.
    fs.mkdirSync(path.join(dir, `pre-migrate-${migrationLabel(MIDPOINT)}-${STAMP}.db`));

    await expect(migrate(envWith({ preMigrateSnapshot: true }))).rejects.toThrow(
      /\[DB\] Refusing to boot: could not write a copy of the database to .* Nothing was migrated\..*TREK_DB_PRE_MIGRATE_SNAPSHOT=false/,
    );
    expect(await recorded()).toEqual(before);
    expect(fs.readdirSync(dir).filter((entry) => entry.endsWith('.partial'))).toEqual([]);
  });

  it('PREMIG-005: TREK_DB_PRE_MIGRATE_SNAPSHOT=false migrates without a copy, and says so', async () => {
    await migrator().up({ to: MIDPOINT });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await migrate(envWith({ preMigrateSnapshot: false }));
    expect(snapshotsIn()).toEqual([]);
    expect(await recorded()).toHaveLength(knownMigrationNames().size);
    expect(String(warn.mock.calls[0]?.[0])).toContain('TREK_DB_PRE_MIGRATE_SNAPSHOT is off');
  });

  it('PREMIG-006: keeps only the newest copies', async () => {
    for (const [i, name] of ['a', 'b', 'c', 'd'].entries()) {
      const file = path.join(dir, `pre-migrate-${name}.db`);
      fs.writeFileSync(file, '');
      fs.utimesSync(file, 1_000 + i, 1_000 + i);
    }
    fs.writeFileSync(path.join(dir, 'pre-restore-1.db'), '');
    fs.writeFileSync(path.join(dir, 'pre-migrate-e.db.partial'), '');

    pruneSnapshots(dir, 2);

    expect(listSnapshots(dir).map((file) => path.basename(file))).toEqual(['pre-migrate-d.db', 'pre-migrate-c.db']);
    // Nothing else in the data dir is touched.
    expect(fs.existsSync(path.join(dir, 'pre-restore-1.db'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'pre-migrate-e.db.partial'))).toBe(true);
  });

  it('PREMIG-007: the boot prunes to TREK_DB_PRE_MIGRATE_SNAPSHOT_KEEP after a new copy', async () => {
    for (const name of ['old-1', 'old-2']) {
      const file = path.join(dir, `pre-migrate-${name}.db`);
      fs.writeFileSync(file, '');
      fs.utimesSync(file, 1_000, 1_000);
    }
    await migrator().up({ to: MIDPOINT });
    await migrate(envWith({ preMigrateSnapshot: true, preMigrateSnapshotKeep: 1 }));
    expect(snapshotsIn()).toEqual([`pre-migrate-${migrationLabel(MIDPOINT)}-${STAMP}.db`]);
  });

  it('PREMIG-008: refusing a database a newer TREK migrated names the copy taken from this release', async () => {
    await migrate(envWith({ preMigrateSnapshot: true }));
    const head = migrationLabel([...knownMigrationNames()].sort().at(-1) ?? '');
    const match = path.join(dir, `pre-migrate-${head}-20261001T000000Z.db`);
    fs.writeFileSync(match, '');
    await orm.em
      .getConnection()
      .execute(
        "INSERT INTO mikro_orm_migrations (name, executed_at) VALUES ('Migration20990101000000_from_a_newer_release', CURRENT_TIMESTAMP)",
      );

    const refusal = migrate(envWith({ preMigrateSnapshot: true }));
    await expect(refusal).rejects.toThrow(/migrated by a newer TREK/);
    await expect(refusal).rejects.toThrow(`The copy taken right before the newer TREK migrated it is ${match}`);

    fs.rmSync(match);
    fs.writeFileSync(path.join(dir, 'pre-migrate-legacy-200-20250101T000000Z.db'), '');
    await expect(migrate(envWith({ preMigrateSnapshot: true }))).rejects.toThrow(/none of them from this release/);
  });
});
