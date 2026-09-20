import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * A migrated-but-empty database, serialised once per test run.
 *
 * Migrations are async and `database.ts::initDb()` is not — it runs at module
 * load, long before anything can await. Most suites do not care (they mock the
 * module or build their own database), but a handful use the singleton directly
 * and need a schema to be there the moment they import it.
 *
 * So the vitest global setup migrates one database for the whole run and writes
 * it here; every worker opens a copy. `better-sqlite3` deserialises a 1.5 MiB
 * snapshot in well under a millisecond, against ~800ms to replay 242 migrations,
 * so this is also what keeps the suite fast.
 *
 * Production never reads this — there `buildApp()` provides the await point.
 */

/** Keyed by the migration set, so a snapshot from another branch is never reused. */
function snapshotKey(): string {
  const dir = path.join(__dirname, 'migrations');
  // A missing directory (e.g. a partial dist) degrades to a constant key; the
  // global setup rewrites the file either way.
  const names = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
  return crypto.createHash('sha256').update(names.join('\n')).digest('hex').slice(0, 16);
}

/** Outside the repo on purpose: nothing here belongs in a working tree or an image. */
export function schemaSnapshotPath(): string {
  return path.join(os.tmpdir(), `trek-schema-${snapshotKey()}.db`);
}

export function writeSchemaSnapshot(snapshot: Buffer): void {
  fs.writeFileSync(schemaSnapshotPath(), snapshot);
}

/** The snapshot bytes, or null when no run has produced one. */
export function readSchemaSnapshot(): Buffer | null {
  try {
    return fs.readFileSync(schemaSnapshotPath());
  } catch {
    return null;
  }
}
