import { readEnv, type AppEnv } from '../app-config';
import { REFUSAL, type MigrationSafetyNet } from './legacy-baseline';
import type { Connection } from '@mikro-orm/core';

import fs from 'node:fs';
import path from 'node:path';

/**
 * A copy of the database taken right before a boot migrates it.
 *
 * Migrations only go forward, and a database a newer TREK migrated is refused
 * by the older one (`refuseNewerDatabase`). Without a copy from before the
 * upgrade, going back to the previous image means restoring a backup, and
 * automatic backups are off by default. So the boot takes one itself: a
 * `VACUUM INTO` snapshot next to the database file, named after the schema it
 * holds, e.g. `pre-migrate-legacy-244-20261008T091500Z.db` for a v4.3.3
 * install or `pre-migrate-20200101042300-….db` for one the migrator already
 * owns. The newest `TREK_DB_PRE_MIGRATE_SNAPSHOT_KEEP` stay.
 *
 * Only when something is pending and the database holds anything: a restart
 * with nothing to apply, a fresh install and an in-memory database take none.
 * A snapshot that cannot be written refuses the boot before anything is
 * migrated; `TREK_DB_PRE_MIGRATE_SNAPSHOT=false` is the way past that.
 */

const PREFIX = 'pre-migrate-';
const SNAPSHOT_FILE = /^pre-migrate-.+\.db$/;

/** `20261008T091500Z`: sortable, and free of the colons Windows refuses in a file name. */
function stamp(now: Date): string {
  return now
    .toISOString()
    .replace(/\.\d+Z$/, 'Z')
    .replace(/[-:]/g, '');
}

/** The file behind the connection, or null for `:memory:` and temp databases. */
async function databaseFile(connection: Connection): Promise<string | null> {
  const rows: Array<{ name: string; file: string }> = await connection.execute('PRAGMA database_list');
  const main = rows.find((row) => row.name === 'main');
  return main?.file ? main.file : null;
}

/** A fresh install: nothing but the migrator's own bookkeeping table yet. */
async function holdsAnything(connection: Connection): Promise<boolean> {
  const rows: unknown[] = await connection.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'mikro_orm_migrations' LIMIT 1`,
  );
  return rows.length > 0;
}

/** The snapshots in `dir`, newest first. */
export function listSnapshots(dir: string): string[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(dir).filter((entry) => SNAPSHOT_FILE.test(entry));
  } catch {
    return [];
  }
  return entries
    .map((entry) => ({ file: path.join(dir, entry), mtime: fs.statSync(path.join(dir, entry)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime || b.file.localeCompare(a.file))
    .map((entry) => entry.file);
}

/** Deletes all but the newest `keep`. A failure only warns: the new snapshot is already safe. */
export function pruneSnapshots(dir: string, keep: number): void {
  for (const file of listSnapshots(dir).slice(keep)) {
    try {
      fs.rmSync(file, { force: true });
    } catch (err) {
      console.warn(
        `[DB] Could not delete the old pre-migration copy ${file}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

/**
 * Writes the copy under a temporary name and renames it into place, so a crash
 * halfway never leaves a truncated file that looks like a good snapshot.
 */
async function writeSnapshot(connection: Connection, file: string, from: string, now: Date): Promise<string> {
  const dir = path.dirname(file);
  const target = path.join(dir, `${PREFIX}${from}-${stamp(now)}.db`);
  const partial = `${target}.partial`;
  try {
    fs.rmSync(partial, { force: true });
    await connection.execute(`VACUUM INTO '${partial.replaceAll("'", "''")}'`);
    fs.renameSync(partial, target);
  } catch (err) {
    try {
      fs.rmSync(partial, { force: true });
    } catch {
      // The refusal below is what matters; a stray .partial is ignored by listSnapshots.
    }
    throw new Error(
      `${REFUSAL} could not write a copy of the database to ${target} before migrating it ` +
        `(${err instanceof Error ? err.message : String(err)}). Nothing was migrated. Free some space in ${dir} ` +
        'or fix its permissions, or set TREK_DB_PRE_MIGRATE_SNAPSHOT=false to migrate without a copy.',
      { cause: err },
    );
  }
  return target;
}

/** The boot's safety net: snapshot before migrating, and point at the right copy when refusing. */
export function preMigrateSnapshot(
  connection: Connection,
  env: () => AppEnv = readEnv,
  now: () => Date = () => new Date(),
): MigrationSafetyNet {
  return {
    async beforeMigrate(from) {
      const { db, app } = env();
      // Unset means on, except under NODE_ENV=test, where a suite asks for it explicitly.
      if (db.preMigrateSnapshot === undefined && app.isTest) return;
      const file = await databaseFile(connection);
      if (!file) return;
      if (from === null && !(await holdsAnything(connection))) return;
      if (db.preMigrateSnapshot === false) {
        console.warn(`[DB] TREK_DB_PRE_MIGRATE_SNAPSHOT is off: migrating ${file} without a copy to go back to`);
        return;
      }
      const target = await writeSnapshot(connection, file, from ?? 'unversioned', now());
      console.log(`[DB] Copy of the database before migrating: ${target}`);
      pruneSnapshots(path.dirname(file), db.preMigrateSnapshotKeep);
    },

    async restoreHint(thisRelease) {
      const file = await databaseFile(connection);
      if (!file) return null;
      const snapshots = listSnapshots(path.dirname(file));
      const match = snapshots.find((snapshot) => path.basename(snapshot).startsWith(`${PREFIX}${thisRelease}-`));
      if (match) {
        return (
          `The copy taken right before the newer TREK migrated it is ${match}: stop TREK, delete ${file}-wal and ` +
          `${file}-shm, and copy it over ${file}.`
        );
      }
      if (snapshots.length > 0) {
        return `Copies taken before earlier migrations are in ${path.dirname(file)} (${PREFIX}*.db), none of them from this release.`;
      }
      return null;
    },
  };
}
