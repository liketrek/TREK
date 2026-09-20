import type { Migration } from '@mikro-orm/migrations';

/**
 * Helpers shared by the migrations that replay the pre-MikroORM history.
 *
 * They live outside `db/migrations/` on purpose: the migrator globs that
 * directory with `!(*.d).{js,ts,cjs}` and would try to load a helper module as
 * a migration class.
 */

/** A single `pragma_table_info` row — only the column name is ever read. */
interface ColumnRow {
  name: string;
}

/**
 * Adds a column only when the table does not already have it.
 *
 * The legacy bootstrap ran `schema.ts::createTables()` before the numbered
 * migrations, and that file was a *moving* snapshot of the schema rather than a
 * frozen v0 — so a database created late already had columns that early steps
 * add here. The old runner absorbed the clash by catching "duplicate column
 * name"; this checks first instead, so a genuine failure still propagates.
 *
 * `definition` is the full column spec, e.g. `status TEXT DEFAULT 'pending'`.
 */
export async function addColumnIfMissing(
  migration: Migration,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const existing = (await migration.execute('select name from pragma_table_info(?) where name = ?', [
    table,
    column,
  ])) as ColumnRow[];
  if (existing.length > 0) return;
  await migration.execute(`alter table \`${table}\` add column ${definition}`);
}

/** True when `table` exists in the current database. */
export async function tableExists(migration: Migration, table: string): Promise<boolean> {
  const rows = await migration.execute(`select name from sqlite_master where type = 'table' and name = ?`, [table]);
  return rows.length > 0;
}

/** The `CREATE TABLE` DDL SQLite stored for `table`, or null when it does not exist. */
export async function tableSql(migration: Migration, table: string): Promise<string | null> {
  const rows = (await migration.execute(`select sql from sqlite_master where name = ?`, [table])) as {
    sql: string | null;
  }[];
  return rows[0]?.sql ?? null;
}

/**
 * Runs a statement whose failure the legacy step logged and swallowed.
 *
 * Kept as its own helper so "this step is allowed to fail" stays visible in the
 * generated migrations instead of hiding behind a bare try/catch.
 */
export async function execBestEffort(migration: Migration, sql: string, params?: unknown[]): Promise<void> {
  try {
    await migration.execute(sql, params);
  } catch (err: unknown) {
    console.warn('[migrations] non-fatal step failed:', err instanceof Error ? err.message : err);
  }
}

/** The column names of `table`, or an empty set when the table does not exist. */
export async function columnNames(migration: Migration, table: string): Promise<Set<string>> {
  const rows = (await migration.execute('select name from pragma_table_info(?)', [table])) as ColumnRow[];
  return new Set(rows.map((r) => r.name));
}

/**
 * Runs a statement that the legacy step allowed to fail *only* because the table
 * it touches may not exist yet on that database. Any other error still throws.
 */
export async function execUnlessTableMissing(migration: Migration, sql: string, params?: unknown[]): Promise<void> {
  try {
    await migration.execute(sql, params);
  } catch (err: unknown) {
    if (!(err instanceof Error) || !err.message.includes('no such table')) throw err;
  }
}

/**
 * Runs a group of statements the legacy step wrapped in a single swallowing
 * try/catch. A failure part-way through leaves the earlier statements applied,
 * which is exactly what the original did.
 */
export async function bestEffort(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (err: unknown) {
    console.warn('[migrations] non-fatal step failed:', err instanceof Error ? err.message : err);
  }
}

/** A booked stay whose check-in day has no matching stop on the plan. */
interface UnplacedStay {
  id: number;
  place_id: number;
  start_day_id: number;
}

/**
 * Gives every booked stay the day stop it would get today, and returns how many
 * were placed.
 *
 * Road-trip mode builds its drive out of `day_assignments` alone, so a hotel
 * booked in Days mode was invisible there. Two legacy steps run this same sweep:
 * once at the release, and once more afterwards for the bookings written in the
 * seconds while the old container was still answering. The `NOT EXISTS` decides
 * both times, so repeating it is safe — a stay that already has its stop is
 * passed over, and a place the traveller planned by hand keeps its row unclaimed.
 */
export async function attachStayStopsToCheckInDay(migration: Migration): Promise<number> {
  const stays = (await migration.execute(`
    SELECT a.id, a.place_id, a.start_day_id
    FROM day_accommodations a
    WHERE a.place_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM day_assignments da
        WHERE da.day_id = a.start_day_id AND da.place_id = a.place_id
      )
    ORDER BY a.id
  `)) as UnplacedStay[];

  for (const stay of stays) {
    // Arriving somewhere is what the day was for, so the stop goes last — the
    // same position a stay booked today lands in.
    await migration.execute(
      `INSERT INTO day_assignments (day_id, place_id, order_index, accommodation_id)
       VALUES (?, ?, COALESCE((SELECT MAX(order_index) + 1 FROM day_assignments WHERE day_id = ?), 0), ?)`,
      [stay.start_day_id, stay.place_id, stay.start_day_id, stay.id],
    );
    await migration.execute(
      `UPDATE places SET stop_type = 'hotel' WHERE id = ? AND (stop_type IS NULL OR stop_type = '')`,
      [stay.place_id],
    );
  }

  return stays.length;
}
