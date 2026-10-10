import { SqlitePlatform } from '@mikro-orm/sql';

/**
 * Program rule 22 (`docs/superpowers/plans/2026-09-21-orm-migration-program.md`),
 * surfaced by Plan 3c Task 4 review M1: MikroORM 7 never sends the driver a
 * parameterised statement. `AbstractSqlConnection.execute` calls
 * `platform.formatQuery(sql, params)` (`@mikro-orm/core`'s `Platform.formatQuery`)
 * and hands better-sqlite3 the fully INLINED SQL text — `formatQuery` walks the
 * `?` placeholders and splices in `this.quoteValue(param)` for each one, so
 * every bound value this ORM ever writes is a literal in the statement string,
 * not a bound parameter the driver escapes separately. `SqlitePlatform`'s own
 * `quoteValue` (`@mikro-orm/sql`'s `AbstractSqlPlatform.quoteValue`, for
 * anything that isn't a `Date`) delegates to `escape`, which wraps a string in
 * single quotes and doubles embedded `'` — the standard SQL literal shape.
 *
 * A `\u0000` inside that string survives the JS-level quoting untouched (it
 * is not `'`, so nothing escapes it), but the C string this literal eventually
 * becomes IS NUL-terminated: SQLite's own tokenizer reads the statement text
 * as a NUL-terminated buffer, so it stops scanning at the embedded `\0` —
 * inside the still-open `'…'` literal, which is exactly why the failure mode
 * is always "unterminated string", never anything an attacker could turn into
 * an injection (verified in the Task 4 review: every NUL statement in this
 * class fails closed with a syntax error, 500, never a different query).
 *
 * The legacy raw-SQL layer never had this problem: `better-sqlite3` binds `?`
 * parameters as real, separately-transmitted values (no inlining, no NUL
 * truncation), so a NUL byte in a user string round-tripped byte-for-byte —
 * `GET /api/trips/:id/places?search=%00` was 200 and a place named
 * `"nul\u0000name"` created (201) with its name intact. Once a route's
 * statement moves off `DatabaseService`'s raw bind onto anything this ORM
 * inlines (a QB read, `em.insert`, `nativeUpdate` — every one of them,
 * regardless of domain), that same input 500s instead, byte-for-byte across
 * every domain: this is corollary to rule 22, not specific to any one plan.
 *
 * The fix restores the round-trip AT THE PLATFORM, once, program-wide: a
 * string containing `\u0000` renders not as one `'…'` literal but as a
 * parenthesised `||` (SQL string concatenation) chain, splicing in SQLite's
 * builtin `char(0)` — which returns a one-character string holding the NUL
 * codepoint — everywhere the original string held one. `char()` is a core
 * SQLite function (no extension, no `PRAGMA`), and `||` binds tighter than
 * every arithmetic/comparison/logical operator that could otherwise appear
 * around a bound value, so `(...)`'s parens are redundant for a scalar
 * comparison — kept anyway so this expression composes safely as an
 * IN-list element or the operand of anything else `escape()`'s caller
 * splices it into (`AbstractSqlPlatform.escape` recurses through arrays
 * with `value.map(v => this.escape(v)).join(', ')`, so a NUL inside one
 * array element must stay a self-contained expression). Splitting on
 * `\u0000` and re-quoting each piece with the platform's own `escape` (via
 * `super.escape`) reuses the exact same `'`-doubling every non-NUL string
 * already goes through, so a NUL next to a quote or a backslash (neither
 * of which SQLite string literals treat specially) round-trips exactly as
 * it did before this override existed.
 *
 * Deliberately scoped to `typeof value === 'string'` for the NUL half above:
 * that IS the M1 fix, not a general re-implementation of `escape`/
 * `quoteValue`.
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
    if (typeof value === 'string' && value.includes('\u0000')) {
      const literals = value.split('\u0000').map((part) => super.escape(part));
      return `(${literals.join(' || char(0) || ')})`;
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      if (Number.isNaN(value)) return 'NULL';
      return value > 0 ? '9e999' : '-9e999';
    }
    return super.escape(value);
  }
}
