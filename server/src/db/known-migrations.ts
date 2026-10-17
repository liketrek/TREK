import fs from 'node:fs';
import path from 'node:path';

const MIGRATION_FILE = /^(Migration\d+_\w+)\.(?:js|ts)$/;

/**
 * The migrations this build ships, by the name the migrator records in
 * `mikro_orm_migrations`. Read from the directory the migrator itself reads:
 * `src/db/migrations` under tsx and vitest, `dist/db/migrations` in a build.
 */
export function knownMigrationNames(dir = path.join(__dirname, 'migrations')): Set<string> {
  const names = new Set<string>();
  for (const entry of fs.readdirSync(dir)) {
    const match = MIGRATION_FILE.exec(entry);
    if (match) names.add(match[1]);
  }
  return names;
}

/**
 * Recorded migrations this build does not ship: the database was migrated by
 * a newer TREK. Running older code against it fails later and far from the
 * cause, so the callers refuse instead.
 */
export function unknownMigrations(executed: Iterable<string>, known: Set<string> = knownMigrationNames()): string[] {
  return [...executed].filter((name) => !known.has(name));
}
