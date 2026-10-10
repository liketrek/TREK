import { knownMigrationNames, unknownMigrations } from './known-migrations';
import type { Connection, MigrationInfo } from '@mikro-orm/core';
import type { Migrator } from '@mikro-orm/migrations';

import fs from 'node:fs';

/**
 * Upgrading an install the retired hand-written runner migrated.
 *
 * Before MikroORM owned the schema, `db/migrations.ts` applied a positional
 * array of steps and recorded how far it got as the single `schema_version`
 * row. Such a database has no `mikro_orm_migrations` rows, so on its first boot
 * here the migrator would see every migration as pending and replay the whole
 * history over a schema that already has it. Eight of those migrations are not
 * replay-safe and refuse the boot; the ones that are replay-safe are worse —
 * step 26 overwrites every user-set `day_assignments.assignment_time`. So the
 * replay must never happen.
 *
 * Instead, a legacy database is baselined once: every migration whose legacy
 * step the database already applied is recorded as executed, and the ordinary
 * migrator run then applies only the rest. The baseline itself (`createTables()`)
 * is deliberately NOT recorded: the legacy runner ran the running release's
 * `createTables()` on every boot before its pending steps, and about thirty
 * tables exist only there (no numbered step creates them), so an install older
 * than those tables gets them the same way — the baseline's `IF NOT EXISTS`
 * DDL runs first, then steps N+1 onwards.
 *
 * The rows are recorded inside the same transaction as the migrator run, so a
 * first boot that fails leaves nothing behind and the next boot baselines again.
 * Anything this cannot map exactly refuses the boot rather than guessing — a
 * refused boot leaves the file untouched, a wrong guess does not.
 */

/**
 * Each migration ported from the positional runner says which step it was in
 * its own docstring. That text is the single source of the mapping — there is
 * no second, hand-kept list to drift from it.
 */
const STEP_MARKER = /Legacy migration step (\d+)\b/g;

export const REFUSAL = '[DB] Refusing to boot:';

/**
 * What the boot does around a migration run (`pre-migrate-snapshot.ts` in
 * production, nothing in the unit tests and on a restore).
 */
export interface MigrationSafetyNet {
  /**
   * Runs after the plan is known and before anything is written, only when
   * something is pending. `from` labels the schema the database holds: the
   * last recorded migration's timestamp, `legacy-<schema_version>`, or null
   * when nothing is recorded at all. Throwing refuses the boot.
   */
  beforeMigrate(from: string | null): Promise<void>;
  /** A sentence pointing at a copy this release can run, for the newer-database refusal. */
  restoreHint(thisRelease: string): Promise<string | null>;
}

export const NO_SAFETY_NET: MigrationSafetyNet = {
  beforeMigrate: async () => {},
  restoreHint: async () => null,
};

/** The part of a migration name that orders it: what a schema state is labelled by. */
export function migrationLabel(name: string): string {
  return /^Migration(\d+)_/.exec(name)?.[1] ?? name;
}

function latest(names: Iterable<string>): string | null {
  let last: string | null = null;
  for (const name of names) if (last === null || name > last) last = name;
  return last;
}

export interface LegacyStepMap {
  /** The migrations standing for `createTables()`: everything that sorts ahead of step 1. */
  baseline: string[];
  /** Legacy step number → the migration that carries it. */
  steps: Map<number, string>;
  /** The last step the positional runner ever had. */
  finalStep: number;
}

type ReadSource = (path: string) => string;

const readFromDisk: ReadSource = (path) => fs.readFileSync(path, 'utf8');

function stepsNamedIn(migration: MigrationInfo, readSource: ReadSource): number[] {
  if (!migration.path) {
    throw new Error(`${REFUSAL} migration ${migration.name} has no source file to read its legacy step from`);
  }
  const found = new Set<number>();
  for (const match of readSource(migration.path).matchAll(STEP_MARKER)) found.add(Number(match[1]));
  return [...found];
}

/**
 * Derives the legacy step → migration map from the migrations the migrator
 * discovered, in its own application order.
 *
 * Throws unless the mapping is exact: one step per migration at most, no step
 * claimed twice, steps 1..N all present, and applied in step order — the order
 * the positional runner used, which is the only order that reproduces what an
 * install at step N already has.
 */
export function buildLegacyStepMap(
  migrations: readonly MigrationInfo[],
  readSource: ReadSource = readFromDisk,
): LegacyStepMap {
  const steps = new Map<number, string>();
  let previousStep = 0;
  let firstNumbered = -1;
  migrations.forEach((migration, index) => {
    const named = stepsNamedIn(migration, readSource);
    if (named.length === 0) return;
    if (named.length > 1) {
      throw new Error(`${REFUSAL} ${migration.name} names more than one legacy step (${named.join(', ')})`);
    }
    const [step] = named as [number];
    const owner = steps.get(step);
    if (owner) throw new Error(`${REFUSAL} legacy step ${step} is claimed by both ${owner} and ${migration.name}`);
    if (step < previousStep) {
      throw new Error(`${REFUSAL} ${migration.name} (legacy step ${step}) sorts after legacy step ${previousStep}`);
    }
    if (firstNumbered < 0) firstNumbered = index;
    previousStep = step;
    steps.set(step, migration.name);
  });

  const finalStep = steps.size;
  if (finalStep === 0) throw new Error(`${REFUSAL} no migration names a legacy step`);
  for (let step = 1; step <= finalStep; step++) {
    if (!steps.has(step)) throw new Error(`${REFUSAL} no migration carries legacy step ${step}`);
  }
  const baseline = migrations.slice(0, firstNumbered).map((migration) => migration.name);
  if (baseline.length === 0) throw new Error(`${REFUSAL} no baseline migration sorts ahead of legacy step 1`);
  return { baseline, steps, finalStep };
}

/**
 * The step a positional-runner database stopped at, or null when this is not
 * one: a fresh database has no `schema_version`, and one the migrator has
 * already recorded anything in is past the hand-over.
 */
async function legacyVersion(connection: Connection, migrator: Migrator): Promise<number | null> {
  if ((await migrator.getExecuted()).length > 0) return null;
  const table: unknown[] = await connection.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'`,
  );
  if (table.length === 0) return null;

  const rows: Array<{ version: unknown }> = await connection.execute('SELECT version FROM schema_version');
  if (rows.length !== 1) {
    throw new Error(`${REFUSAL} schema_version holds ${rows.length} rows; the legacy runner always kept exactly one`);
  }
  const [{ version }] = rows as [{ version: unknown }];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new Error(`${REFUSAL} schema_version ${String(version)} is not a legacy step this release can map`);
  }
  return version;
}

/**
 * The pre-ORM Tours branch numbered its own steps after the upstream step it
 * was cut from: 216 to 218 on the older line, 243 to 246 on the later one.
 * Such a database's schema_version counts Tours steps, not the upstream steps
 * of the same numbers, so it is cut back to the last upstream step it really
 * has. The upstream steps then run, and the Tours migration adopts the tables
 * the branch already created.
 */
async function withoutToursSteps(connection: Connection, version: number): Promise<number> {
  const toursLine = version >= 216 && version <= 218 ? 215 : version >= 243 && version <= 246 ? 242 : null;
  if (toursLine === null) return version;
  const table: unknown[] = await connection.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tour_types'`,
  );
  if (table.length === 0) return version;
  console.log(
    `[DB] schema_version ${version} was written by the pre-ORM Tours branch; baselining to upstream step ${toursLine}`,
  );
  return toursLine;
}

/**
 * The migrations a positional-runner database already has — steps 1..N, never
 * the baseline (see the file header) — or `[]` for every database that is not
 * one. Writes nothing; {@link migrateToHead} records them.
 */
export async function planLegacyBaseline(
  connection: Connection,
  migrator: Migrator,
  readSource: ReadSource = readFromDisk,
): Promise<string[]> {
  const recorded = await legacyVersion(connection, migrator);
  if (recorded === null) return [];
  const version = await withoutToursSteps(connection, recorded);

  const map = buildLegacyStepMap(await migrator.getPending(), readSource);
  if (version > map.finalStep) {
    throw new Error(
      `${REFUSAL} schema_version ${version} is newer than the last legacy step this release knows (${map.finalStep})`,
    );
  }

  const executed: string[] = [];
  for (const [step, name] of map.steps) if (step <= version) executed.push(name);
  console.log(`[DB] Legacy install at schema_version ${version} — baselining ${executed.length} migration(s)`);
  return executed;
}

/**
 * Runs every pending migration. On a positional-runner database it first
 * records steps 1..N as executed, in the SAME transaction as the run, so the
 * two commit or roll back together.
 */
export async function migrateToHead(
  connection: Connection,
  migrator: Migrator,
  readSource: ReadSource = readFromDisk,
  known: Set<string> = knownMigrationNames(),
  safetyNet: MigrationSafetyNet = NO_SAFETY_NET,
): Promise<void> {
  const baselined = await planLegacyBaseline(connection, migrator, readSource);
  const executed = (await migrator.getExecuted()).map((row) => row.name);
  if (unknownMigrations(executed, known).length > 0) {
    const thisRelease = latest(known);
    refuseNewerDatabase(executed, known, thisRelease ? await safetyNet.restoreHint(migrationLabel(thisRelease)) : null);
  }
  const already = new Set(baselined);
  const pending = (await migrator.getPending()).filter((migration) => !already.has(migration.name));
  if (pending.length === 0 && baselined.length === 0) return;

  const lastRecorded = latest(executed);
  const legacy = lastRecorded === null ? await legacyVersion(connection, migrator) : null;
  await safetyNet.beforeMigrate(
    lastRecorded !== null ? migrationLabel(lastRecorded) : legacy !== null ? `legacy-${legacy}` : null,
  );
  console.log(`[DB] Applying ${pending.length} pending migration(s)`);
  if (baselined.length === 0) {
    await migrator.up();
    return;
  }

  const storage = migrator.getStorage();
  await storage.ensureTable();
  await connection.transactional(async (trx) => {
    for (const name of baselined) await storage.logMigration({ name }, trx);
    await migrator.up({ transaction: trx });
  });
}

/**
 * A database a newer TREK migrated carries migrations this build does not
 * ship. An image rolled back, or a newer backup restored, would otherwise run
 * older code against a schema it does not know and fail later, far from the
 * cause. Refused before anything is written.
 */
export function refuseNewerDatabase(executed: string[], known: Set<string>, restoreHint: string | null = null): void {
  const unknown = unknownMigrations(executed, known);
  if (unknown.length === 0) return;
  throw new Error(
    `${REFUSAL} the database was migrated by a newer TREK (${unknown.length} unknown migration(s), latest ${unknown[unknown.length - 1]}). ` +
      'Run that version again, or restore a backup taken with this one.' +
      (restoreHint ? ` ${restoreHint}` : ''),
  );
}
