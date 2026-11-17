import type { PluginSqlClient } from './plugin-data-store';
import { PluginSqlRefused, type PluginStatement } from './plugin-sql-guard';
import { PRIVILEGED_ROLE_DESCRIPTION, PRIVILEGED_ROLE_SQL } from './server-checks';

/**
 * The checks the Postgres plugin store (`plugin-data-store.ts`) asks the
 * database itself, behind the token guard (`plugin-sql-guard.ts`): whether
 * TREK's role may run plugin SQL at all, which schema the objects a statement
 * changes really live in, and how much the plugin's schema holds.
 */

/**
 * Why plugin databases are refused while TREK connects as a privileged role:
 * every statement a plugin sends runs as that role, and such a role may
 * change the system catalogs or reach the database host, which no check on
 * the SQL can rule out.
 */
export const PRIVILEGED_ROLE_PLUGIN_REFUSAL =
  `Plugin databases (db:own) are refused on Postgres while TREK_DB_URL connects as ${PRIVILEGED_ROLE_DESCRIPTION}: ` +
  "a plugin's SQL runs as TREK's role. Connect TREK as a role that owns its database and is not a superuser " +
  '(see the wiki page "Database: Postgres").';

/** Asks whether TREK's role is privileged before a plugin call runs on a connection. */
export interface PluginRoleGate {
  /** Throws {@link PRIVILEGED_ROLE_PLUGIN_REFUSAL} when the role `client` is connected as is privileged. */
  refuseIfPrivileged(client: PluginSqlClient): Promise<void>;
}

/**
 * The role check of {@link PRIVILEGED_ROLE_SQL}, read once per pool
 * connection and kept for as long as that connection lives. A new connection,
 * after a restart, a reconnect or the pool replacing one, reads it again, so a
 * role that gained or lost a privilege is seen without a restart once the pool
 * has turned over; the check costs one query per connection, not per call.
 */
export class PrivilegedRoleGate implements PluginRoleGate {
  private readonly answers = new WeakMap<PluginSqlClient, Promise<boolean>>();

  async refuseIfPrivileged(client: PluginSqlClient): Promise<void> {
    if (await this.privileged(client)) throw new Error(PRIVILEGED_ROLE_PLUGIN_REFUSAL);
  }

  /** Whether the role `client` is connected as is privileged; a failed read is not kept. */
  privileged(client: PluginSqlClient): Promise<boolean> {
    let answer = this.answers.get(client);
    if (answer === undefined) {
      answer = client
        .query(`select (${PRIVILEGED_ROLE_SQL}) as privileged`)
        .then((result) => (result.rows as Array<{ privileged?: boolean }>)[0]?.privileged === true);
      void answer.catch(() => this.answers.delete(client));
      this.answers.set(client, answer);
    }
    return answer;
  }
}

/**
 * Refuses `statement` unless every object it changes ({@link PluginStatement.targets})
 * that exists lies in `schema`. Run inside the call's transaction right
 * before the statement, so it sees what the statements before it made,
 * renamed or dropped. Postgres resolves each name itself with `to_regclass`
 * or `to_regtype` on the plugin's `search_path`, where `pg_catalog` is
 * searched first: an unqualified `int4`, `text` or `box` is the catalog's
 * type and refused here, whatever the role may do. A name that resolves to
 * nothing is left to the statement.
 */
export async function refuseForeignTargets(
  client: PluginSqlClient,
  statement: PluginStatement,
  schema: string,
): Promise<void> {
  if (statement.targets.length === 0) return;
  const result = await client.query({
    text:
      'select t.name, n.nspname from unnest($1::text[], $2::text[]) as t(name, kind) ' +
      'join pg_namespace n on n.oid = case t.kind ' +
      "when 'type' then (select typnamespace from pg_type where oid = to_regtype(t.name)) " +
      'else (select relnamespace from pg_class where oid = to_regclass(t.name)) end ' +
      'where n.nspname <> $3',
    values: [
      statement.targets.map((t) => t.name.map(quoteName).join('.')),
      statement.targets.map((t) => t.kind),
      schema,
    ],
  });
  const [foreign] = result.rows as Array<{ name: string; nspname: string }>;
  if (foreign !== undefined) {
    throw new PluginSqlRefused(
      `${foreign.name} is an object of the schema "${foreign.nspname}"; a plugin changes its own objects only`,
    );
  }
}

/** `part` as a quoted identifier, as `to_regclass` and `to_regtype` read it. */
function quoteName(part: string): string {
  return `"${part.replaceAll('"', '""')}"`;
}

/**
 * The most catalog objects one plugin schema may hold: its relations (tables,
 * indexes, sequences, views, materialized views), types (each table brings its
 * row type and that type's array), constraints and enum labels. An empty
 * table, a view or an enum label takes no disk space the quota sees but adds
 * rows to the system catalogs, so their number is held on its own.
 */
export const PLUGIN_SCHEMA_MAX_OBJECTS = 5_000;

/** What a plugin schema holds, as the quota measures it. */
export interface SchemaUsage {
  /** Bytes on disk of every relation of the schema and of each one's TOAST table. */
  bytes: number;
  /** Catalog objects, as {@link PLUGIN_SCHEMA_MAX_OBJECTS} counts them. */
  objects: number;
}

/**
 * The disk space and the catalog objects of `schema`. Every relation is
 * counted once, whatever its kind (tables, partitions, indexes, sequences,
 * materialized views; a view has no storage), each with all its forks, and
 * a table's TOAST table, which lives in `pg_toast`, through its
 * `reltoastrelid` with the TOAST table's own index.
 */
export async function schemaUsage(client: PluginSqlClient, schema: string): Promise<SchemaUsage> {
  const result = await client.query({
    text:
      'select coalesce((select sum(' +
      "pg_relation_size(c.oid, 'main') + pg_relation_size(c.oid, 'fsm') + pg_relation_size(c.oid, 'vm') + " +
      "pg_relation_size(c.oid, 'init') + " +
      'case when c.reltoastrelid <> 0 then pg_total_relation_size(c.reltoastrelid) else 0 end) ' +
      'from pg_class c where c.relnamespace = n.oid), 0) as bytes, ' +
      '(select count(*) from pg_class c where c.relnamespace = n.oid) + ' +
      '(select count(*) from pg_type t where t.typnamespace = n.oid) + ' +
      '(select count(*) from pg_constraint k where k.connamespace = n.oid) + ' +
      '(select count(*) from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typnamespace = n.oid) as objects ' +
      'from pg_namespace n where n.nspname = $1',
    values: [schema],
  });
  const [row] = result.rows as Array<{ bytes?: number | string; objects?: number | string }>;
  return { bytes: Number(row?.bytes ?? 0), objects: Number(row?.objects ?? 0) };
}

/**
 * Refuses a plugin's bound value that holds U+0000 (NUL): Postgres text
 * cannot store the character, and TREK will not change what a plugin asked
 * to store or compare (`'a\0b'` and `'ab'` are different keys on SQLite).
 * A string, or a string anywhere in an array, is checked; a Buffer goes to
 * `bytea`, which holds any byte.
 */
export function refuseNulValues(values: readonly unknown[]): void {
  if (values.some(holdsNul)) {
    throw new Error(
      'a plugin argument holds the character U+0000 (NUL), which Postgres text cannot store; ' +
        'TREK refuses it instead of changing the value. Remove it, or bind binary data as a Buffer (bytea)',
    );
  }
}

function holdsNul(value: unknown): boolean {
  if (typeof value === 'string') return value.includes('\u0000');
  return Array.isArray(value) && value.some(holdsNul);
}
