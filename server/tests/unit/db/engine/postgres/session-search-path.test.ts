/**
 * `pg_temp` last on the search_path of TREK's pool connections
 * (src/db/engine/postgres/session-search-path.ts), without a database. That a
 * temporary table then never stands in for TREK's own is PGPLUG-011 in the
 * Postgres lane.
 */
import { putTempSchemaLast, searchPathWithTempLast } from '../../../../../src/db/engine/postgres/session-search-path';

import type { CompiledQuery, DatabaseConnection, QueryResult } from 'kysely';
import { describe, expect, it } from 'vitest';

describe('session search_path', () => {
  it.each([
    ['"$user", public', '"$user", public, pg_temp'],
    ['trek', 'trek, pg_temp'],
    ['pg_temp, public', 'public, pg_temp'],
    ['PG_TEMP,public', 'public, pg_temp'],
    ['"pg_temp", "$user", public', '"$user", public, pg_temp'],
    ['"a, b", "c""d", public', '"a, b", "c""d", public, pg_temp'],
    ['', 'pg_temp'],
  ])('SPATH-001: %j keeps its schemas in order and gets pg_temp last: %j', (path, expected) => {
    expect(searchPathWithTempLast(path)).toBe(expected);
  });

  it('SPATH-002: the connection hook reads the path and sets it for the session, the value bound', async () => {
    const sent: Array<{ sql: string; parameters: readonly unknown[] }> = [];
    const connection = {
      executeQuery: async (query: CompiledQuery): Promise<QueryResult<unknown>> => {
        sent.push({ sql: query.sql, parameters: query.parameters });
        return { rows: query.sql === 'show search_path' ? [{ search_path: 'trek, public' }] : [] };
      },
    } as unknown as DatabaseConnection;
    await putTempSchemaLast(connection);
    expect(sent).toEqual([
      { sql: 'show search_path', parameters: [] },
      { sql: "select set_config('search_path', $1, false)", parameters: ['trek, public, pg_temp'] },
    ]);
  });
});
