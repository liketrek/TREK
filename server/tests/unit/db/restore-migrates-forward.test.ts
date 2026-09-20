import { runSchemaBootstrap } from '../../../src/db/orm';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { MikroORM } from '@mikro-orm/sqlite';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * Restoring a backup taken on an older release has to bring its schema forward.
 *
 * That used to fall out of `reinitialize()` re-running `createTables` →
 * `runMigrations` → `runSeeds` against the swapped file. Those calls are gone,
 * so the guarantee now rests on the schema bootstrap being re-runnable against a
 * database that is behind — which is what this covers.
 *
 * `backup.impl.test.ts` mocks `reinitialize` away, so nothing else asserts it.
 *
 * Uses the stock driver against a temp file rather than the shared one, because
 * the point is to drive a database that is NOT the process singleton.
 */

const MIGRATIONS = path.join(__dirname, '../../../src/db/migrations');
const SEEDERS = path.join(__dirname, '../../../src/db/seeders');

let tmpDir: string | null = null;

function ormFor(dbName: string): Promise<MikroORM> {
  return MikroORM.init({
    entities: [],
    discovery: { warnWhenNoEntities: false },
    extensions: [Migrator, SeedManager],
    migrations: { path: MIGRATIONS, pathTs: MIGRATIONS, snapshot: false, silent: true },
    seeder: { path: SEEDERS, pathTs: SEEDERS, defaultSeeder: 'DatabaseSeeder' },
    dbName,
    // Same as MikroORM's own default, but declared here so the `import()` sits
    // in a module vitest transforms. MikroORM's copy lives in node_modules and
    // is loaded raw, where Node's resolver rejects the extensionless imports
    // these CommonJS-target migrations use.
    dynamicImportProvider: (id: string) => import(id),
  });
}

afterEach(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  tmpDir = null;
});

describe('a restored database is migrated forward', () => {
  it('RESTORE-001: a database stopped part-way through the history reaches head, and seeding survives the replay', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-restore-'));
    const dbFile = path.join(tmpDir, 'old-backup.db');

    // Stand in for a backup taken on an older release: apply only the first
    // slice of the history and stop.
    const stale = await ormFor(dbFile);
    const staleMigrator = stale.config.getExtension('@mikro-orm/migrator') as Migrator;
    const all = await staleMigrator.getPending();
    await staleMigrator.up({ to: all[99].name });
    await stale.close(true);

    const probe = new Database(dbFile);
    const tableCount = (sql: string) => (probe.prepare(sql).get() as { c: number }).c;
    const applied = tableCount('SELECT COUNT(*) AS c FROM mikro_orm_migrations');
    // `document_providers` arrives at step 236, well past where this stopped.
    const lateTableBefore = tableCount(
      `SELECT COUNT(*) AS c FROM sqlite_master WHERE type = 'table' AND name = 'document_providers'`,
    );
    probe.close();

    expect(applied).toBe(100);
    expect(lateTableBefore).toBe(0);

    // What reinitialize() does after the file has been swapped in.
    const restored = await ormFor(dbFile);
    await runSchemaBootstrap(restored);
    // Twice: a restore can follow a boot that already bootstrapped, and every
    // seeder is written to tolerate that.
    await runSchemaBootstrap(restored);
    await restored.close(true);

    const after = new Database(dbFile);
    const count = (sql: string) => (after.prepare(sql).get() as { c: number }).c;
    try {
      expect(count('SELECT COUNT(*) AS c FROM mikro_orm_migrations')).toBe(all.length);
      expect(
        count(`SELECT COUNT(*) AS c FROM sqlite_master WHERE type = 'table' AND name = 'document_providers'`),
      ).toBe(1);
      // Seeded exactly once despite the bootstrap running twice.
      expect(count('SELECT COUNT(*) AS c FROM categories')).toBe(10);
      expect(count('SELECT COUNT(*) AS c FROM schema_version')).toBe(1);
    } finally {
      after.close();
    }
  }, 60_000);
});
