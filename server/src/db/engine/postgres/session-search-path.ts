import { CompiledQuery, type DatabaseConnection } from 'kysely';

/**
 * Puts `pg_temp` last on the `search_path` of every connection of TREK's pool.
 *
 * Postgres searches the session's temporary schema before everything on the
 * `search_path` unless the path names `pg_temp` itself, and a temporary table
 * lives as long as its connection. On a pool, whatever one caller left there
 * would stand in for TREK's tables (`users`, `sessions`, ...) for every later
 * caller of that connection. Named last, the temporary schema is searched
 * after every schema TREK uses, so its tables are never found first. The rest
 * of the path stays as the role or the database configured it: TREK may run
 * in a schema other than `public`, and finds it through that path.
 *
 * Plugin transactions set their own path the same way
 * (`plugin-data-store.ts`); `plugin-sql-guard.ts` explains the layers.
 */

/** `path` (as `SHOW search_path` prints it) with every `pg_temp` entry taken out and one put last. */
export function searchPathWithTempLast(path: string): string {
  const entries: string[] = [];
  let current = '';
  let quoted = false;
  for (const ch of path) {
    if (ch === '"') quoted = !quoted;
    if (ch === ',' && !quoted) {
      entries.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  entries.push(current.trim());
  const kept = entries.filter((entry) => entry !== '' && entry.toLowerCase() !== 'pg_temp' && entry !== '"pg_temp"');
  return [...kept, 'pg_temp'].join(', ');
}

/** The connection hook (`onCreateConnection`) that sets {@link searchPathWithTempLast} for the session. */
export async function putTempSchemaLast(connection: DatabaseConnection): Promise<void> {
  const shown = await connection.executeQuery<{ search_path: string }>(CompiledQuery.raw('show search_path'));
  const path = searchPathWithTempLast(shown.rows[0]?.search_path ?? '');
  await connection.executeQuery(CompiledQuery.raw("select set_config('search_path', $1, false)", [path]));
}
