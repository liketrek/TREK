/**
 * The per-test reset for suites on the real database module, on either engine.
 *
 * `resetTestDb(testDb)` (test-db.ts) needs the better-sqlite3 handle of the
 * SQLite snapshot mock, so a suite that resets with it can only run on
 * SQLite. `resetDatabase(orm)` takes the booted app's ORM instead and leaves
 * the same state on SQLite and on Postgres:
 *
 *   - every table emptied except KEEP_TABLES, the list read from the live
 *     schema at reset time, not kept by hand;
 *   - id sequences left where they are, so ids keep growing from one test to
 *     the next, as resetTestDb does on purpose (see its comment);
 *   - the defaults seedDefaults writes put back from the same data
 *     (categories, addons, photo providers), through the ORM;
 *   - on its first call for an ORM, the users sequence restarted as well,
 *     which is the snapshot mock's one normalisation (db-mock.ts,
 *     createSnapshotTestDb): the seeded first-run admin is gone and the first
 *     user a suite creates gets id 1.
 *
 * Usage in a suite that boots the app:
 *
 *   orm = nestApp.get(MikroORM);
 *   beforeEach(() => resetDatabase(orm));
 *
 * How a table is emptied differs by engine, and that is all that does; the
 * one branch is in clearUserTables below, on the dialect layer's platform
 * check, like every other engine question.
 */
import { isPostgres, isSqlite, unsupported } from '../../src/db/dialect/platform';
import { Addons } from '../../src/db/entities/Addons.entity';
import { Categories } from '../../src/db/entities/Categories.entity';
import { PhotoProviders } from '../../src/db/entities/PhotoProviders.entity';
import { inContext, type FactoryOrm } from './factories/context';
import { insertRowIgnoringConflict } from './factories/rows';
import { DEFAULT_ADDONS, DEFAULT_CATEGORIES, DEFAULT_PHOTO_PROVIDERS, KEEP_TABLES } from './test-db';
import type { EntityManager } from '@mikro-orm/core';

/** The ORMs whose users sequence has been restarted once already. */
const normalised = new WeakSet<FactoryOrm>();

/** Empties the user data and re-seeds the defaults; call it in beforeEach. */
export async function resetDatabase(orm: FactoryOrm): Promise<void> {
  const restartUsers = !normalised.has(orm);
  await inContext(orm, (em) => clearUserTables(em, restartUsers));
  normalised.add(orm);
  await seedDefaultRows(orm);
}

const quote = (table: string) => `"${table.replaceAll('"', '""')}"`;

/**
 * Empties every table but KEEP_TABLES, and with `restartUsers` sets the users
 * sequence back so the next user is id 1.
 *
 * SQLite: as resetTestDb does, one DELETE per table with foreign keys off, so
 * the order does not matter (the pragma cannot change inside a transaction,
 * so this runs outside one).
 *
 * Postgres: one TRUNCATE for the tables, without RESTART IDENTITY so the
 * sequences keep counting. A TRUNCATE refuses a table that a table outside
 * the statement references, and CASCADE would follow such a reference into
 * the kept tables (categories.user_id references users) and empty them too.
 * So the tables a kept table references are left out of the TRUNCATE and
 * emptied with a DELETE after it, when nothing else points at them any more;
 * their foreign keys apply as on any delete (a category made by a deleted
 * user loses its user_id, where SQLite, with foreign keys off, leaves the id
 * of a user that is gone). All of it in one transaction.
 */
async function clearUserTables(em: EntityManager, restartUsers: boolean): Promise<void> {
  const connection = em.getConnection();
  const platform = em.getPlatform();

  if (isSqlite(platform)) {
    const rows = await connection.execute<{ name: string }[]>(
      "select name from sqlite_master where type = 'table'",
      [],
      'all',
    );
    // sqlite_* are SQLite's own (sqlite_sequence, sqlite_stat1), never ours.
    const tables = rows.map((r) => r.name).filter((name) => !name.startsWith('sqlite_') && !KEEP_TABLES.has(name));
    await connection.execute('PRAGMA foreign_keys = OFF', [], 'run');
    try {
      for (const table of tables) await connection.execute(`DELETE FROM ${quote(table)}`, [], 'run');
      if (restartUsers) await connection.execute("DELETE FROM sqlite_sequence WHERE name = 'users'", [], 'run');
    } finally {
      await connection.execute('PRAGMA foreign_keys = ON', [], 'run');
    }
    return;
  }

  if (isPostgres(platform)) {
    const rows = await connection.execute<{ name: string }[]>(
      'select table_name as name from information_schema.tables ' +
        "where table_schema = current_schema() and table_type = 'BASE TABLE'",
      [],
      'all',
    );
    const tables = rows.map((r) => r.name).filter((name) => !KEEP_TABLES.has(name));
    const references = await connection.execute<{ from_table: string; to_table: string }[]>(
      'select f.relname as from_table, t.relname as to_table from pg_constraint c ' +
        'join pg_class f on f.oid = c.conrelid join pg_class t on t.oid = c.confrelid ' +
        "where c.contype = 'f' and f.relnamespace = current_schema()::regnamespace",
      [],
      'all',
    );
    const heldByKept = new Set(references.filter((r) => KEEP_TABLES.has(r.from_table)).map((r) => r.to_table));
    const truncated = tables.filter((name) => !heldByKept.has(name));
    const deleted = tables.filter((name) => heldByKept.has(name));
    await em.transactional(async (tx) => {
      const run = (sql: string) => tx.getConnection().execute(sql, [], 'run', tx.getTransactionContext());
      if (truncated.length > 0) await run(`TRUNCATE ${truncated.map(quote).join(', ')}`);
      for (const table of deleted) await run(`DELETE FROM ${quote(table)}`);
      if (restartUsers) await run("select setval(pg_get_serial_sequence('users', 'id'), 1, false)");
    });
    return;
  }

  unsupported(platform);
}

/**
 * seedDefaults (test-db.ts) through the ORM: a default category is added when
 * no category has its name (categories.name is not unique), an addon or photo
 * provider when its id is not there. Rows that are there stay as they are,
 * an addon a test switched off included.
 */
async function seedDefaultRows(orm: FactoryOrm): Promise<void> {
  await inContext(orm, async (em) => {
    for (const cat of DEFAULT_CATEGORIES) {
      if ((await em.count(Categories, { name: cat.name })) === 0) {
        await em.insert(Categories, { name: cat.name, color: cat.color, icon: cat.icon });
      }
    }
  });
  for (const a of DEFAULT_ADDONS) {
    await insertRowIgnoringConflict(orm, Addons, {
      id: a.id,
      name: a.name,
      description: a.description,
      type: a.type,
      icon: a.icon,
      enabled: a.enabled === 1,
      sort_order: a.sort_order,
    });
  }
  for (const p of DEFAULT_PHOTO_PROVIDERS) {
    await insertRowIgnoringConflict(orm, PhotoProviders, {
      id: p.id,
      name: p.name,
      description: p.id,
      icon: 'Image',
      enabled: p.enabled,
      sort_order: 0,
    });
  }
}
