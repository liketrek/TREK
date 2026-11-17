/**
 * The extended-protocol marker of plugin SQL
 * (src/db/engine/postgres/extended-query.ts), against a stand-in `pg` client
 * that records what it is handed. That Postgres then runs one statement and
 * no more is PGPLUG-010 in the Postgres lane.
 */
import {
  extendedQuery,
  sendMarkedQueriesExtended,
  unmarkedValues,
} from '../../../../../src/db/engine/postgres/extended-query';

import { describe, expect, it } from 'vitest';

/** A `pg` client that records the arguments of every `query` call. */
function recordingClient() {
  const calls: unknown[][] = [];
  const client = {
    query: (...args: unknown[]): unknown => {
      calls.push(args);
      return Promise.resolve({ rows: [] });
    },
  };
  return { client, calls };
}

describe('extended query', () => {
  it('EXTQ-001: a marked query reaches pg as one extended-protocol query with its own values, even with none', async () => {
    const { client, calls } = recordingClient();
    sendMarkedQueriesExtended(client);
    const none = extendedQuery('insert into t values (1)', []);
    const some = extendedQuery('insert into t values ($1, $2)', ['a', 2]);
    await client.query(none.sql, none.parameters);
    await client.query(some.sql, some.parameters);
    expect(calls).toEqual([
      [{ text: 'insert into t values (1)', values: [], queryMode: 'extended' }],
      [{ text: 'insert into t values ($1, $2)', values: ['a', 2], queryMode: 'extended' }],
    ]);
  });

  it('EXTQ-002: any other query, a cursor included, reaches pg unchanged', async () => {
    const { client, calls } = recordingClient();
    sendMarkedQueriesExtended(client);
    const cursor = { submit: () => undefined };
    await client.query('select 1; select 2', []);
    await client.query('select $1', [1]);
    await client.query(cursor);
    expect(calls).toEqual([['select 1; select 2', []], ['select $1', [1]], [cursor]]);
  });

  it('EXTQ-003: without the hook the marker stays a parameter, so pg still binds and Postgres refuses the count', () => {
    const query = extendedQuery('select 1', []);
    expect(query.parameters).toHaveLength(1);
    expect(unmarkedValues(query.parameters)).toEqual([]);
    expect(unmarkedValues([])).toBeNull();
    expect(unmarkedValues(['a'])).toBeNull();
    expect(unmarkedValues(undefined)).toBeNull();
  });
});
