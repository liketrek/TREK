import { nulFreeJson, stripNul } from './nul-free';
import type { TransformContext } from '@mikro-orm/core';
import { SqlitePlatform } from '@mikro-orm/sql';

/**
 * Program rule 22 (`docs/superpowers/plans/2026-09-21-orm-migration-program.md`),
 * surfaced by Plan 3c Task 4 review M1: MikroORM 7 never sends the driver a
 * parameterised statement. `AbstractSqlConnection.execute` calls
 * `platform.formatQuery(sql, params)` (`@mikro-orm/core`'s `Platform.formatQuery`)
 * and hands better-sqlite3 the fully INLINED SQL text: `formatQuery` walks the
 * `?` placeholders and splices in `this.quoteValue(param)` for each one, and
 * `quoteValue` delegates to `escape` for anything that isn't a `Date`.
 *
 * **NUL.** A `\u0000` inside a string survives the JS-level quoting, but SQLite
 * reads the statement text as a NUL-terminated buffer and stops at it, inside
 * the still-open `'…'` literal, so every such statement failed with
 * "unterminated string" (a 500, never a different query). This platform once
 * spliced SQLite's `char(0)` into the literal to keep the character; TREK now
 * stores no NUL on either engine (`nul-free.ts`: Postgres text cannot hold
 * one), so `escape` drops it from every string, and `convertJsonToDatabaseValue`
 * from every string of a JSON value, the way the Postgres platform does.
 *
 * **Rule 22 extension (Plan 3c Task 9, close-out review A H1):** non-finite
 * numbers hit the SAME inlining mechanism, and rule 21's `toRowId` guards do
 * NOT fence every caller off from it — `toRowId` is what a CONVERTED
 * service calls to validate an id BEFORE it reaches a repository, but two
 * call sites (`PlacesService.verifyTripAccess`, `RealtimeGateway.handleJoin`)
 * still did `Number(untrusted)` with no finite check and handed the result
 * straight to `TripsRepository.findAccessible`'s raw `andWhere('t.id = ?',
 * [trip_id])` bind. Traced against the installed `@mikro-orm/sql` 7.2.1
 * source: `AbstractSqlPlatform.quoteValue` (`sql/AbstractSqlPlatform.js:94`)
 * special-cases only a raw fragment and a plain object (JSON-stringified);
 * everything else — including every `number` — falls to `this.escape(value)`.
 * `SqlitePlatform.escape` (`sql/dialects/sqlite/SqlitePlatform.js:116-133`)
 * DOES special-case numbers, but not usefully: `typeof value === 'number' ||
 * typeof value === 'bigint'` returns `'' + value` — plain string
 * concatenation, which for a non-finite value gives `'NaN'`, `'Infinity'` or
 * `'-Infinity'`, an UNQUOTED bareword spliced straight into the SQL text
 * (finite numbers render as an ordinary numeric literal this way and are
 * fine; only the three non-finite values break). SQLite's parser reads that
 * bareword as a column reference (`no such column: NaN`/`Infinity`) and
 * throws, a 500 where the legacy raw bind never had the problem:
 * `better-sqlite3` accepts a JS `number` directly and binds it as SQLite's
 * own `REAL`/`NULL` value, never as text — verified empirically against the
 * installed driver (not assumed): `db.prepare('select typeof(?)').get(NaN)`
 * reports `'null'` (better-sqlite3 refuses `NaN` as a bindable REAL and
 * silently binds SQL `NULL` instead), while `db.prepare('select
 * typeof(?)').get(Infinity)` reports `'real'` and round-trips as the REAL
 * value `Infinity` — SQLite itself has no `Infinity` literal, but its
 * `REAL` parser saturates an out-of-range exponent to positive/negative
 * infinity (double-precision overflow), and `9e999`/`-9e999` verified to
 * produce that exact value (`select 9e999` → `Infinity`), so it is the
 * literal spelling that reproduces the driver's own bound value byte-for-
 * byte, not an approximation. Overriding `escape` (not `quoteValue`, which
 * only special-cases a raw fragment/plain object before delegating here
 * anyway) catches every number this platform ever renders, program-wide,
 * the same fail-safe shape as the NUL fix above — rule 21's `toRowId`
 * guards remain the PRIMARY defence (a validated id never reaches this
 * branch), and this is the platform's own backstop for the callers that do
 * not yet guard.
 */
export class NulSafeSqlitePlatform extends SqlitePlatform {
  override escape(value: unknown): string {
    if (typeof value === 'string') return super.escape(stripNul(value));
    if (typeof value === 'number' && !Number.isFinite(value)) {
      if (Number.isNaN(value)) return 'NULL';
      return value > 0 ? '9e999' : '-9e999';
    }
    return super.escape(value);
  }

  override convertJsonToDatabaseValue(value: unknown, context?: TransformContext): unknown {
    return super.convertJsonToDatabaseValue(nulFreeJson(value), context);
  }
}
