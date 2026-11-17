import { CompiledQuery } from 'kysely';

/**
 * Statements that must run alone: sent over Postgres's extended query
 * protocol, whose Parse message takes exactly one statement, so a second one
 * in the text is a syntax error instead of a statement that runs.
 *
 * `pg` picks the protocol by the values it is handed: with none it sends the
 * text over the simple protocol, which runs every statement in it. Kysely
 * hands it a query's parameters as they are, so {@link extendedQuery} adds a
 * marker as the last parameter, and the connection hook
 * {@link sendMarkedQueriesExtended} (installed on every client of TREK's pool
 * by `postgres-driver.ts`) takes the marker off again and asks `pg` for the
 * extended protocol. A query that reached a client without the hook still goes
 * over the extended protocol, with one parameter too many, and Postgres
 * refuses it: the marker fails closed.
 *
 * Plugin SQL (`plugin-data-store.ts`) runs through here. A read streamed
 * through a cursor needs none of this: a cursor always uses the extended
 * protocol.
 */

/** The last parameter of a query {@link extendedQuery} built. */
const EXTENDED_ONLY = Object.freeze({ trekExtendedProtocol: true });

/** `sql` with `args` as a query sent over the extended protocol, so it runs as one statement or not at all. */
export function extendedQuery(sql: string, args: readonly unknown[]): CompiledQuery {
  return CompiledQuery.raw(sql, [...args, EXTENDED_ONLY]);
}

/** The values `pg` was handed, without the marker, when {@link extendedQuery} built them; otherwise null. */
export function unmarkedValues(values: unknown): unknown[] | null {
  if (!Array.isArray(values) || values.length === 0 || values[values.length - 1] !== EXTENDED_ONLY) return null;
  return values.slice(0, -1);
}

/** The part of a `pg` client this hook replaces. */
interface QueryClient {
  query: (...args: unknown[]) => unknown;
}

/**
 * Makes `client` send a query {@link extendedQuery} built over the extended
 * protocol (`queryMode: 'extended'`, which `pg` honours even without values),
 * and every other query as before.
 */
export function sendMarkedQueriesExtended(client: QueryClient): void {
  const query = client.query.bind(client);
  client.query = (...args: unknown[]) => {
    const [text, values, ...rest] = args;
    const unmarked = unmarkedValues(values);
    if (typeof text !== 'string' || unmarked === null) return query(...args);
    return query({ text, values: unmarked, queryMode: 'extended' }, ...rest);
  };
}
