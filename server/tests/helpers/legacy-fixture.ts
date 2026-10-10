/**
 * Databases the retired positional runner (`db/migrations.ts`) produced, for
 * the suites that boot the app on one to prove the legacy baseline
 * (`src/db/legacy-baseline.ts`) upgrades it without replaying history.
 *
 * The fixtures are `sqlite3 .dump` output committed under
 * `tests/fixtures/legacy/`; each file's header names the commit whose runner
 * built it. `legacy-v244` (the v4.3.3 release) is rebuilt by
 * `scripts/build-legacy-fixture-v244.mjs`. Loaded into a temp FILE database, not `:memory:`, because an
 * upgraded install is a file on disk.
 *
 * Imported from inside `vi.mock('…/db/database')` factories, so like
 * `db-mock.ts` it must stay a leaf: node builtins and `better-sqlite3` only.
 */
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type LegacyFixture = 'legacy-v066' | 'legacy-v082' | 'legacy-v205' | 'legacy-v242' | 'legacy-v244';

const FIXTURES = path.join(__dirname, '../fixtures/legacy');

const openedDirs: string[] = [];

/** A file database holding the named fixture, opened with the app's own pragmas. */
export function openLegacyFixture(name: LegacyFixture): Database.Database {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-legacy-'));
  openedDirs.push(dir);
  const db = new Database(path.join(dir, `${name}.db`));
  db.exec(fs.readFileSync(path.join(FIXTURES, `${name}.sql`), 'utf8'));
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/** Removes every temp directory `openLegacyFixture` created in this worker. */
export function removeLegacyFixtureFiles(): void {
  for (const dir of openedDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
}

interface ColumnRow {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

/**
 * Every table's columns and every named index, as comparable text. Column
 * ORDER is left out on purpose: a column a numbered step added with `ALTER
 * TABLE … ADD COLUMN` sits last on an upgraded install and in place on a fresh
 * one, which no query can tell apart.
 */
export function schemaShape(db: Database.Database): string[] {
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name <> 'mikro_orm_migrations' ORDER BY name`,
    )
    .all() as Array<{ name: string }>;
  const shape: string[] = [];
  for (const { name } of tables) {
    const columns = db
      .prepare(`SELECT name, type, "notnull", dflt_value, pk FROM pragma_table_info(?)`)
      .all(name) as ColumnRow[];
    for (const c of columns) {
      shape.push(
        `${name}.${c.name} ${c.type.toUpperCase()} notnull=${c.notnull} default=${c.dflt_value ?? ''} pk=${c.pk}`,
      );
    }
  }
  const indexes = db
    .prepare(`SELECT tbl_name, name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    .all() as Array<{ tbl_name: string; name: string }>;
  for (const index of indexes) shape.push(`index ${index.tbl_name}.${index.name}`);
  return shape.sort((a, b) => a.localeCompare(b));
}
