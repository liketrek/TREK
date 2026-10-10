import {
  isKnownPlatform,
  isPostgres,
  isSqlite,
  PG_ISO_DATE_PREFIX,
  PG_TIMESTAMP_FORMAT,
  PG_UTC_NOW,
  pgTimestampText,
  unsupported,
} from './platform';
import type { Platform } from '@mikro-orm/core';

import {
  sql,
  type Expression,
  type ExpressionBuilder,
  type ExpressionWrapper,
  type RawBuilder,
  type ReferenceExpression,
  type SqlBool,
  type StringReference,
} from 'kysely';

/**
 * The Kysely-expression half of the dialect layer: the twins of the MikroORM
 * `raw()` helpers in `sql-functions.ts`, for statements built with
 * `this.kysely<...>()`. Same contract as that file: every helper takes the
 * live MikroORM `Platform`, dispatches on it at runtime and fails closed on a
 * platform it does not know. Values are bound or validated, never spliced in.
 */

// ---------------------------------------------------------------------------
// Plan 3d Task 0 review (H1/L1) — the helpers in `sql-functions.ts` return a
// MikroORM `RawQueryFragment`. Handed into a Kysely statement, a `RawQueryFragment`
// stringifies through its own `[Symbol.toPrimitive]('string')` coercion into
// the literal text `?` (its parameter-placeholder marker, meant for the
// MikroORM QueryBuilder's OWN parameter interpolation, not Kysely's) — Kysely
// binds it as an actual `?` value parameter and the statement fails at
// execution (verified directly, not assumed: `db.selectFrom(...).where(...,
// startsWithIsoDate(platform, 'col'))` throws `SqliteError: near "?": syntax
// error` the first time it runs). Task 2 absorbed this finding (its report,
// H1/L1) — these are genuinely separate functions, not a wrapper over the
// ones above, because a Kysely `Expression` and a MikroORM `RawQueryFragment`
// are different types with no conversion between them. Each takes the
// caller's own `ExpressionBuilder<DB, TB>` (the same "no consumer-facing
// generic DB" shape `_shared/reservation-visibility.ts`'s `publicStayExists`
// documents is the only one that survives `tsc` for a shared Kysely helper —
// unlike that one, these ARE fully generic over `<DB, TB>`, because they only
// ever call `eb.fn`/`eb.cast`/`eb(...)`, none of which hit the QueryBuilder
// method-chaining inference limit that forced `publicStayExists` to fix its
// shape). Platform-dispatched and fail-closed like every helper in
// `sql-functions.ts`; each has an SQLF-0xx test pinning its compiled
// `{sql, parameters}` AND a raw-statement equivalence on seeded rows
// (`tests/unit/db/dialect/sql-functions.test.ts`), and its Postgres branch is
// pinned in `sql-functions.postgres.test.ts` and run by the CI Postgres probe.
// ---------------------------------------------------------------------------

/**
 * The Kysely-expression twin of {@link startsWithIsoDate}: `<ref> GLOB
 * '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*'`, spelled through SQLite's
 * function form (`glob(X, Y)` is exactly `Y GLOB X` — the inventory's own
 * §19 finding, since Kysely's `ComparisonOperator` union has no `GLOB`
 * entry). Returns a boolean `Expression<SqlBool>`, usable in a `.where()`
 * or inside a `CASE WHEN` condition. Same digit-class pattern as the
 * MikroORM version — NOT the wider `'????-??-??*'` shorthand (a `?` in
 * SQLite GLOB matches any character, letters included). On Postgres it is
 * the anchored regular expression `CAST(<ref> AS text) ~ '^[0-9]{4}-…'`.
 */
export function startsWithIsoDateKysely<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  ref: ReferenceExpression<DB, TB>,
): ExpressionWrapper<DB, TB, SqlBool> {
  if (isSqlite(platform)) {
    return eb.fn<SqlBool>('glob', [eb.val('[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*'), ref]);
  }
  if (isPostgres(platform)) return eb(eb.cast<string>(ref, 'text'), '~', eb.val(PG_ISO_DATE_PREFIX));
  return unsupported(platform);
}

/**
 * The Kysely-expression twin of {@link substring}: `substr(<ref>,
 * <start>[, <length>])`, 1-based on both ends. `start`/`length` are
 * validated integers, the same guard `substring()` above applies, and bound
 * as genuine parameters here (`eb.val`) rather than spelled into the SQL
 * text — Kysely's `fn()` takes `ReferenceExpression`s, not a raw text
 * fragment, so there is no equivalent "spell a constant into the SQL"
 * shape to match; a bound integer literal renders identically. Postgres has
 * the same `substr` with the same 1-based arguments.
 */
export function substringKysely<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  ref: ReferenceExpression<DB, TB>,
  start: number,
  length?: number,
): ExpressionWrapper<DB, TB, string> {
  if (!Number.isInteger(start) || start < 1) {
    throw new Error(`sql-functions: substringKysely needs a 1-based integer start, got ${start}`);
  }
  if (length !== undefined && (!Number.isInteger(length) || length < 0)) {
    throw new Error(`sql-functions: substringKysely needs a non-negative integer length, got ${length}`);
  }
  if (isKnownPlatform(platform)) {
    const args: ReferenceExpression<DB, TB>[] =
      length === undefined ? [ref, eb.val(start)] : [ref, eb.val(start), eb.val(length)];
    return eb.fn<string>('substr', args);
  }
  return unsupported(platform);
}

/** A part of a `concatKysely()` expression — a column reference, a bound value, or a nested Kysely `Expression<string>` (composes freely, unlike `concat()`'s MikroORM `RawQueryFragment` form). */
export type KyselyConcatPart<DB, TB extends keyof DB> =
  { column: StringReference<DB, TB> } | { value: string } | { expression: Expression<string> };

/**
 * The Kysely-expression twin of {@link concat}: `<part> || <part> || …`,
 * SQLite's/Postgres's string concatenation operator, built through the
 * expression builder's own binary-operator call (`eb(lhs, '||', rhs)`) so
 * it composes with {@link substringKysely}/{@link castIntegerKysely} —
 * exactly the composition `concat()`'s MikroORM form cannot do (its
 * docstring explains why). On Postgres a bound value part is cast to `text`:
 * `pg` sends parameters untyped, and `$1 || $2` alone gives the planner no
 * type to resolve the operator with.
 */
export function concatKysely<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  ...parts: readonly KyselyConcatPart<DB, TB>[]
): ExpressionWrapper<DB, TB, string> {
  if (parts.length < 2) {
    throw new Error(`sql-functions: concatKysely needs at least two parts, got ${parts.length}`);
  }
  if (!isKnownPlatform(platform)) return unsupported(platform);
  const value = (text: string): Expression<string> =>
    isPostgres(platform) ? eb.cast<string>(eb.val(text), 'text') : eb.val(text);
  const operand = (part: KyselyConcatPart<DB, TB>): Expression<string> =>
    'column' in part ? eb.ref(part.column).$castTo<string>() : 'value' in part ? value(part.value) : part.expression;
  let acc: Expression<string> = operand(parts[0]!);
  for (const part of parts.slice(1)) {
    acc = eb(acc, '||', operand(part));
  }
  // The loop above always runs at least once (the `parts.length < 2` guard
  // above throws otherwise), so `acc` is always the result of the `eb(...)`
  // binary-operator call — a real `ExpressionWrapper`, not the bare
  // `Expression` interface `operand()`'s own return type declares.
  return acc as ExpressionWrapper<DB, TB, string>;
}

/**
 * The Kysely-expression twin of {@link castInteger}: `CAST(<ref> AS
 * INTEGER)`, for `reservations.accommodation_id` (TEXT) compared against an
 * INTEGER column inside a Kysely statement (RS20/RV2's join shape — a
 * correlated `EXISTS`/scalar-subquery context the MikroORM QueryBuilder
 * cannot express, per the inventory's own T6 ruling). Postgres refuses to
 * cast the text `'14.0'` to an integer, so its branch goes through `numeric`
 * and truncates, as SQLite's cast does: `CAST(trunc(CAST(<ref> AS numeric))
 * AS integer)`.
 */
export function castIntegerKysely<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  ref: ReferenceExpression<DB, TB>,
): ExpressionWrapper<DB, TB, number> {
  if (isSqlite(platform)) return eb.cast<number>(ref, 'integer');
  if (isPostgres(platform)) return eb.cast<number>(eb.fn('trunc', [eb.cast(ref, 'numeric')]), 'integer');
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3g Task 0 (R1) — no consumer yet: Task 1 (`getJourneyFull`'s gallery
// read) and Task 3 (`getPublicJourney`'s gallery read) each fold this into
// their own rebuild of the legacy `GALLERY_CHRONOLOGICAL_ORDER` (tests/helpers/)
// text (a `COALESCE(NULLIF(tp.taken_at, ''), <correlated MIN+concat subquery>,
// <this>)` ORDER BY, worked out in full in Task 0's report for both to paste
// in verbatim, neither re-deriving it). Added here, Kysely-only (no MikroORM
// `raw()` sibling): the shape it exists for is genuinely Kysely-only (a
// correlated scalar subquery cannot be expressed through the MikroORM
// QueryBuilder — the same "T6 ruling" `castIntegerKysely`'s own docstring
// cites for RS20/RV2), and nothing else in this plan's inventory needs a
// MikroORM-form epoch-to-ISO conversion (§6: "no other strftime/julianday
// sites found elsewhere in this cluster"). A raw twin can be added later,
// same as every other helper here, the moment a real consumer needs one.
// ---------------------------------------------------------------------------

/**
 * `strftime('%Y-%m-%dT%H:%M:%SZ', <ref> / 1000, 'unixepoch')` — the last of
 * `GALLERY_CHRONOLOGICAL_ORDER`'s three fallback tiers (R1): when a gallery
 * photo has neither a capture time (`tp.taken_at`) nor a linked entry to
 * borrow a date from, the moment it was added is what is left to order by.
 * `<ref>` is an epoch-MILLISECONDS column (`journey_photos.created_at`, like
 * every other `*_at` epoch column in this codebase) — SQLite's `unixepoch`
 * modifier expects whole SECONDS, so the division is load-bearing, not
 * decorative, and matches the legacy text's own `gp.created_at / 1000`
 * exactly. SQLite's `/` on two integers truncates instead of rounding; that
 * sub-second loss is the legacy statement's own behaviour, preserved here
 * rather than "fixed" into a float divide that would render a different ISO
 * string for any timestamp not an exact multiple of 1000ms.
 *
 * On Postgres: `to_char(timezone('UTC', to_timestamp(<ref> / 1000)),
 * 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`. An integer column divided by an integer
 * truncates there too, so both engines drop the same sub-second part.
 *
 * Named for what it computes, not the SQL function it spells — matching
 * every other `*Kysely` twin in this file (`castIntegerKysely`, not
 * `castKysely`; `startsWithIsoDateKysely`, not `globKysely`).
 */
export function unixEpochToIsoKysely<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  ref: ReferenceExpression<DB, TB>,
): ExpressionWrapper<DB, TB, string> {
  if (!isKnownPlatform(platform)) return unsupported(platform);
  const seconds = eb(ref, '/', eb.val(1000));
  if (isSqlite(platform)) {
    return eb.fn<string>('strftime', [eb.val('%Y-%m-%dT%H:%M:%SZ'), seconds, eb.val('unixepoch')]);
  }
  const utc = eb.fn('timezone', [eb.cast(eb.val('UTC'), 'text'), eb.fn('to_timestamp', [seconds])]);
  return eb.fn<string>('to_char', [utc, eb.cast(eb.val('YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'text')]);
}

/**
 * The Kysely-expression twin of {@link nowPlusSeconds}: DS23/DS24's
 * `ON CONFLICT ... DO UPDATE` / `INSERT ... VALUES` (R3) is a hand-typed
 * Kysely statement — MikroORM's `em.upsert` cannot express a
 * partial-unique-index conflict target (R3's own ruling) — so the
 * `next_attempt_at` computation inside its `CASE WHEN` needs a Kysely
 * `Expression`, not a MikroORM `RawQueryFragment` (SQLF-048: a
 * `RawQueryFragment` throws when handed into a Kysely statement). Same
 * validation, same always-non-negative-integer trust boundary as the
 * MikroORM form in `sql-functions.ts`. On Postgres the validated count is
 * inlined as a literal into `make_interval(secs => n)` and the sum rendered
 * as SQLite's timestamp text.
 */
export function nowPlusSecondsKysely<DB, TB extends keyof DB>(
  platform: Platform,
  eb: ExpressionBuilder<DB, TB>,
  seconds: number,
): ExpressionWrapper<DB, TB, string> {
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new Error(`sql-functions: nowPlusSecondsKysely needs a non-negative integer second count, got ${seconds}`);
  }
  if (isSqlite(platform)) {
    return eb.fn<string>('datetime', [eb.val('now'), eb.val(`+${seconds} seconds`)]);
  }
  if (isPostgres(platform)) {
    const later = sql`${sql.raw(PG_UTC_NOW)} + make_interval(secs => ${sql.lit(seconds)})`;
    return eb.fn<string>('to_char', [later, eb.cast(eb.val(PG_TIMESTAMP_FORMAT), 'text')]);
  }
  return unsupported(platform);
}

/**
 * The Kysely-expression twin of {@link currentTimestamp}: the bare
 * `CURRENT_TIMESTAMP` keyword, for a value position inside a hand-typed
 * Kysely statement (DS24's `ON CONFLICT ... DO UPDATE SET last_seen_at =
 * CURRENT_TIMESTAMP` — R3's partial-index upsert). Verified directly against
 * `better-sqlite3` that SQLite accepts the bare keyword (`SELECT
 * CURRENT_TIMESTAMP`) but rejects it called as a function
 * (`SELECT CURRENT_TIMESTAMP()` → `near "(": syntax error`), so
 * `eb.fn('current_timestamp', [])` — every other helper in this file's
 * usual Kysely shape — is not an option here; the whole point of a keyword
 * literal is that it takes no parentheses. This is this file's one
 * Kysely-side use of the `sql` template tag — confined here, the sanctioned
 * escape hatch this file already is for every raw-SQL spelling in the
 * codebase (the MikroORM helpers in `sql-functions.ts` use `raw()` for the
 * identical reason), never inline in a repository (the TRAP list's "Kysely
 * `sql` banned under repositories" is about repository FILES, not this one).
 * On Postgres it renders the UTC clock as SQLite's timestamp text.
 */
export function currentTimestampKysely(platform: Platform): RawBuilder<string> {
  if (isSqlite(platform)) return sql<string>`CURRENT_TIMESTAMP`;
  if (isPostgres(platform)) return sql.raw<string>(pgTimestampText(PG_UTC_NOW));
  return unsupported(platform);
}
