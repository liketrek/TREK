import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { readSchemaSnapshot } from '../../../src/db/schema-snapshot';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

/**
 * The app builds its schema from the MikroORM migrations in `src/db/migrations/`.
 * 182 test files still build theirs from `schema.ts` + `migrations.ts`, because
 * converting them was deliberately left out of the ORM switch.
 *
 * That is two sources for one schema, which the root CLAUDE.md allows only
 * behind "a parity test that cannot silently skip". This is that test: if either
 * side gains a column, an index, a constraint or a table the other does not
 * have, it fails and names the difference.
 *
 * Scope is the schema, not the rows. `tests/helpers/test-db.ts::seedDefaults` is
 * already a deliberate fork of production seeding (8 addons against 14, its own
 * names, no admin user), so asserting on seeded data would fail for reasons that
 * have nothing to do with schema drift.
 */

interface ColumnRow {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}
interface IndexRow {
  name: string;
  unique: number;
  partial: number;
}
interface ForeignKeyRow {
  table: string;
  from: string;
  to: string | null;
  on_update: string;
  on_delete: string;
}

/** Everything about a database's shape that a drift would show up in. */
function describeSchema(db: Database.Database): Record<string, string[]> {
  const tables = (
    db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
      .all() as { name: string }[]
  ).map((r) => r.name);

  const out: Record<string, string[]> = {};
  for (const table of tables) {
    const columns = (db.prepare(`PRAGMA table_info('${table}')`).all() as ColumnRow[])
      .map((c) => `column ${c.name} ${c.type.toUpperCase()} notnull=${c.notnull} default=${c.dflt_value} pk=${c.pk}`)
      .sort();

    const indexes = (db.prepare(`PRAGMA index_list('${table}')`).all() as IndexRow[])
      .map((index) => {
        const on = (db.prepare(`PRAGMA index_info('${index.name}')`).all() as { name: string }[]).map((c) => c.name);
        // An inline UNIQUE(...) becomes an auto-named index, so compare those by
        // their columns rather than by a name SQLite invented.
        return index.name.startsWith('sqlite_autoindex')
          ? `unique constraint (${on.join(', ')})`
          : `index ${index.name} unique=${index.unique} partial=${index.partial} (${on.join(', ')})`;
      })
      .sort();

    const foreignKeys = (db.prepare(`PRAGMA foreign_key_list('${table}')`).all() as ForeignKeyRow[])
      .map((fk) => `foreign key ${fk.from} -> ${fk.table}(${fk.to}) on delete ${fk.on_delete}`)
      .sort();

    out[table] = [...columns, ...indexes, ...foreignKeys];
  }

  for (const kind of ['trigger', 'view'] as const) {
    const rows = db.prepare(`SELECT name, sql FROM sqlite_master WHERE type = ? ORDER BY name`).all(kind) as {
      name: string;
      sql: string | null;
    }[];
    out[`(${kind}s)`] = rows.map((r) => `${r.name}: ${r.sql?.replace(/\s+/g, ' ').trim()}`);
  }

  return out;
}

describe('schema parity between the legacy builders and the MikroORM migrations', () => {
  it('SCHEMA-001: db/schema.ts + db/migrations.ts produce the same shape as src/db/migrations/', () => {
    const snapshot = readSchemaSnapshot();
    // The snapshot is built by tests/global-setup.ts, which runs for every
    // `vitest run`. Failing loudly rather than skipping is the point: a silent
    // skip here is exactly the hole this test exists to close.
    expect(
      snapshot,
      'no schema snapshot — tests/global-setup.ts did not run, so migration parity was never checked',
    ).not.toBeNull();

    const migrated = new Database(snapshot!);

    const legacy = new Database(':memory:');
    legacy.exec('PRAGMA foreign_keys = ON');
    createTables(legacy);
    runMigrations(legacy);

    try {
      const fromMigrations = describeSchema(migrated);
      const fromLegacy = describeSchema(legacy);

      // The migrator's own bookkeeping only exists on the MikroORM side, and the
      // legacy chain has no equivalent to compare it against.
      delete fromMigrations.mikro_orm_migrations;

      expect(Object.keys(fromMigrations).sort()).toEqual(Object.keys(fromLegacy).sort());
      for (const table of Object.keys(fromLegacy)) {
        expect(fromMigrations[table], `table "${table}" differs`).toEqual(fromLegacy[table]);
      }
    } finally {
      migrated.close();
      legacy.close();
    }
  });
});
