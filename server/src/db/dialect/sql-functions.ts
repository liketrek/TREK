import {
  isKnownPlatform,
  isPostgres,
  isSqlite,
  PG_ISO_DATE_PREFIX,
  PG_UTC_NOW,
  pgDateText,
  pgTimestampText,
  unsupported,
} from './platform';
import { raw, type Platform, type RawQueryFragment } from '@mikro-orm/core';

/**
 * The only place a repository may spell a database function.
 *
 * Every helper takes the MikroORM `Platform` the caller's EntityManager is
 * running on (`em.getPlatform()`) plus an already-qualified column reference
 * (`'t.created_at'`), and dispatches on that platform at runtime. TREK ships
 * one binary and the database is chosen by configuration, so the dialect is a
 * runtime property of the live connection, not a build-time swap. Every
 * helper has a SQLite branch (the engine TREK runs on) and a Postgres branch
 * (the second engine; `scripts/pg-probe.ts` runs each one against a real
 * Postgres in CI), and a spelling both engines read the same way serves both
 * through `isKnownPlatform`. An unknown platform fails closed rather than
 * guessing a spelling. The Kysely-expression twins live in
 * `kysely-functions.ts`, the platform checks in `platform.ts`.
 *
 * Values are never interpolated — the day count in `dateAdd` is checked to be
 * an integer before it is spelled.
 */

function column(ref: string): string {
  if (!/^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i.test(ref)) {
    throw new Error(`sql-functions: not a column reference: ${ref}`);
  }
  return ref;
}

/** The calendar date (`YYYY-MM-DD`) of a timestamp column. */
export function dateOf(platform: Platform, ref: string): RawQueryFragment {
  if (isSqlite(platform)) return raw(`date(${column(ref)})`);
  if (isPostgres(platform)) return raw(pgDateText(`CAST(${column(ref)} AS timestamp)`));
  return unsupported(platform);
}

/** The timestamp column shifted by whole days, as a calendar date. */
export function dateAdd(platform: Platform, ref: string, days: number): RawQueryFragment {
  if (!Number.isInteger(days)) throw new Error(`sql-functions: dateAdd needs an integer day count, got ${days}`);
  if (isSqlite(platform)) {
    const sign = days < 0 ? '-' : '+';
    return raw(`date(${column(ref)}, '${sign}${Math.abs(days)} days')`);
  }
  if (isPostgres(platform)) return raw(pgDateText(`CAST(${column(ref)} AS timestamp) + INTERVAL '${days} days'`));
  return unsupported(platform);
}

/** The database clock, in the same text the column defaults produce (UTC `YYYY-MM-DD HH:MM:SS`). */
export function currentTimestamp(platform: Platform): RawQueryFragment {
  if (isSqlite(platform)) return raw('CURRENT_TIMESTAMP');
  if (isPostgres(platform)) return raw(pgTimestampText(PG_UTC_NOW));
  return unsupported(platform);
}

/**
 * A bare reference to another column of the same row, for a filter or update
 * value that must compare against or combine with a sibling column instead
 * of a bound parameter (e.g. `used_count < max_uses` — `InviteTokensRepository
 * .incrementUsedCount`'s capacity guard). Portable across dialects on its own,
 * but still routed through this file (not spelled with `raw()` in a
 * repository) so every escape hatch stays in one place ESLint's
 * `no-restricted-syntax` rule for `src/db/repositories/**` can enforce.
 */
export function columnRef(platform: Platform, ref: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw(column(ref));
  return unsupported(platform);
}

/** A column shifted by a signed integer amount: `<col> + n` / `<col> - n`. */
export function columnIncrementedBy(platform: Platform, ref: string, amount: number): RawQueryFragment {
  if (!Number.isInteger(amount)) {
    throw new Error(`sql-functions: columnIncrementedBy needs an integer amount, got ${amount}`);
  }
  if (isKnownPlatform(platform)) {
    const sign = amount < 0 ? '-' : '+';
    return raw(`${column(ref)} ${sign} ${Math.abs(amount)}`);
  }
  return unsupported(platform);
}

/**
 * A case-insensitive column reference, for use as a filter's object key:
 * `{ [lower(platform, 'email')]: <value-side> }` produces
 * `WHERE LOWER(email) = <value-side>`.
 *
 * **SQLite's `LOWER()` is ASCII-only; JavaScript's `String.prototype
 * .toLowerCase()` is full-Unicode.** They do NOT agree on every input this
 * codebase stores — a locally-registered e-mail can carry any non-whitespace
 * character (`EMAIL_REGEX`), including non-ASCII letters (program rule 18;
 * Plan 3b Task 7 review, H1: `JOSÉ@x.com` proved a live login lockout). Two
 * value-side shapes are legitimate, and they are NOT interchangeable:
 *
 * - `LOWER(col) = LOWER(?)` — pair with `lowerParam()` below, binding the
 *   RAW value. Both sides are folded by the SAME engine (SQLite's), so they
 *   agree on every input. This is the shape for every legacy
 *   `LOWER(col) = LOWER(?)` statement (AU9, AU12, UP5, UP6, O12).
 * - `LOWER(col) = ?` — pair with a value the CALLER has already lowered in
 *   JS (`value.toLowerCase()`) as a plain string, matching a legacy
 *   `LOWER(col) = ?` statement exactly (only O4 today —
 *   `OidcService.findOrCreateUser` JS-lowers the email once upfront and the
 *   legacy statement it replaced never re-lowered it in SQL). Do not use
 *   this shape for a value the caller has not already lowered.
 *
 * Typed `RawQueryFragment & symbol` (not the bare `RawQueryFragment` the
 * other helpers in this file return): TypeScript only accepts a
 * `string | number | symbol` as a computed property name, and a raw
 * fragment is only usable as an object key because `raw()`'s default
 * generic already brands it with a `[Symbol.toPrimitive]`. The other
 * helpers here are only ever used as VALUES, where that brand isn't needed.
 *
 * Postgres spells it the same, but its `LOWER()` folds every letter, not
 * only ASCII. Pair it with `lowerParam()` there too and both sides still
 * fold through one engine, so a lookup agrees with itself on either engine.
 */
export function lower(platform: Platform, ref: string): RawQueryFragment & symbol {
  if (isKnownPlatform(platform)) return raw(`LOWER(${column(ref)})`);
  return unsupported(platform);
}

/**
 * The value-side twin of `lower()`: `LOWER(?)` bound with the RAW,
 * untransformed value, for the right-hand side of a `lower(platform, col)`
 * filter key. Together they render `LOWER(<column>) = LOWER(?)`,
 * byte-for-byte a legacy `LOWER(col) = LOWER(?)` statement, because SQLite
 * folds BOTH sides with the same (ASCII-only) engine — proven directly
 * against `better-sqlite3`: `SELECT LOWER(?)` on `'JOSÉ@x.com'` yields
 * `'josÉ@x.com'` (only the ASCII letters fold; the `É` is untouched), the
 * same transform SQLite would apply to a stored column. Do NOT pre-lower
 * the value in JS before calling this (program rule 18) — that reintroduces
 * the mixed-engine bug this helper exists to close.
 */
export function lowerParam(platform: Platform, value: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw('LOWER(?)', [value]);
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3c Task 0b (R6) — no consumer yet: Tasks 1–8 wire these in as each
// converts the statement that needs them (`place-shadow.service.ts:192`,
// `places.service.ts:642,651-652`, the ~16 `COALESCE` sites across
// `days`/`assignments`/`trip-members`/`places`). Added here, with their own
// SQLF-0xx tests pinning the SQLite text against a raw statement, so a later
// task imports a tested helper instead of writing one inline.
// ---------------------------------------------------------------------------

/**
 * `datetime('now', '-N days')` — the SQLite clock shifted backwards by whole
 * days, as TEXT (not a stored column's value — `dateAdd` above is the wrong
 * shape for this: it shifts a *column*, not "now"). `days` is validated to be
 * a non-negative integer and spelled directly into the fragment rather than
 * bound: the legacy statement (`place-shadow.service.ts:192`) binds the
 * WHOLE modifier string (`'-30 days'`) as one parameter, and MikroORM's raw
 * fragments do not accept a placeholder inside the modifier argument of a
 * SQLite date/time function — `datetime('now', ?)` with `'-30 days'` bound
 * does work in raw SQLite, but composing that shape through a `raw()`
 * fragment used as a QueryBuilder value needs the modifier already in the
 * SQL text, the same way `dateAdd` above spells its own day count.
 */
export function nowMinusDays(platform: Platform, days: number): RawQueryFragment {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error(`sql-functions: nowMinusDays needs a non-negative integer day count, got ${days}`);
  }
  if (isSqlite(platform)) return raw(`datetime('now', '-${days} days')`);
  if (isPostgres(platform)) return raw(pgTimestampText(`${PG_UTC_NOW} - INTERVAL '${days} days'`));
  return unsupported(platform);
}

/**
 * `TRIM(<col>)`, standalone. **Does NOT compose with `lower()`** to build
 * `LOWER(TRIM(name))` (Task 0b review M3): `lower()`'s `ref` argument goes
 * through `column()`, whose regex rejects anything but a bare
 * `alias.column` reference — `TRIM(name)` fails it — and even if it didn't,
 * `coalesce()`'s own docstring in this file documents that a
 * `RawQueryFragment` cannot be nested inside another one (`raw()`'s
 * `[Symbol.toPrimitive]` only implements the `'string'` coercion hint, which
 * is the object-key position, not template-literal interpolation). Use
 * `lowerTrim()` below for the composed shape.
 */
export function trim(platform: Platform, ref: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw(`TRIM(${column(ref)})`);
  return unsupported(platform);
}

/**
 * `LOWER(TRIM(<col>))` as one fragment — the shape `places.service.ts:642`
 * (`lower(trim(name))`, PL26) actually needs; `lower()`/`trim()` above
 * cannot be composed to build it (see `trim()`'s docstring, Task 0b review
 * M3). Typed `RawQueryFragment & symbol`, the same brand `lower()` carries,
 * for use as a filter KEY: `{ [lowerTrim(platform, 'name')]: lowerParam(...) }`.
 * SQLite's `LOWER()` is ASCII-only (program rule 18) — unchanged by the
 * `TRIM()`.
 */
export function lowerTrim(platform: Platform, ref: string): RawQueryFragment & symbol {
  if (isKnownPlatform(platform)) return raw(`LOWER(TRIM(${column(ref)}))`);
  return unsupported(platform);
}

/**
 * `COALESCE(<col>, <fallbackCol>)` — both sides column references, for the
 * `COALESCE(a, b)` SELECT-projection shape (`days.service.ts:93-94`,
 * `assignments.service.ts:103-104`, `trip-members.service.ts:116-143`, …).
 *
 * Not composed by nesting a `RawQueryFragment` inside this one: MikroORM's
 * `RawQueryFragment[Symbol.toPrimitive]` only returns a usable value for the
 * `'string'` coercion hint (object-key position) — a template-literal
 * `${fragment}` embed uses the `'default'` hint and throws
 * (`node_modules/@mikro-orm/core/utils/RawQueryFragment.js`, verified
 * directly, not assumed). So `coalesce`'s second argument is a second
 * `column()`-validated identifier, spelled into the same fragment as the
 * first — two columns, one statement, matching `lower`/`lowerParam`'s
 * two-function split for the same reason (a filter KEY vs a bound VALUE
 * are different shapes).
 */
export function coalesce(platform: Platform, ref: string, fallbackRef: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw(`COALESCE(${column(ref)}, ${column(fallbackRef)})`);
  return unsupported(platform);
}

/**
 * `COALESCE(<col>, ?)` — the value-side twin of `coalesce()` above, for the
 * `COALESCE(col, ?)` UPDATE-SET shape (`places.service.ts:344,351,363,…`).
 * `value` is bound as a genuine parameter, never interpolated.
 *
 * Typed `RawQueryFragment & symbol` (widened from a bare `RawQueryFragment`
 * in Plan 3d Task 0, R3 — `_shared/reservation-visibility.ts`'s
 * `publicReservationCondition` needs `COALESCE(alias.ingest_state, 'live')`
 * as a `.where({...})` filter KEY, `{ [coalesceParam(...)]: { $ne: 'staged'
 * } }`, the same brand `lower()`/`lowerTrim()`/`castInteger()` carry for
 * that use): every existing UPDATE-SET caller (`Places.repository.ts`'s six
 * `coalesceParam(...)` assignments into a loosely-typed `data` object) keeps
 * typechecking unchanged — `RawQueryFragment & symbol` is assignable
 * anywhere a plain `RawQueryFragment` is expected, a strict widening with no
 * behaviour change (the function body is untouched).
 */
export function coalesceParam(
  platform: Platform,
  ref: string,
  value: string | number | null,
): RawQueryFragment & symbol {
  if (isKnownPlatform(platform)) return raw(`COALESCE(${column(ref)}, ?)`, [value]);
  return unsupported(platform);
}

/**
 * `COALESCE(?, <col>)` — the MIRROR-IMAGE value-side shape of
 * {@link coalesceParam} above: the bound value goes FIRST, the column is
 * the fallback. NOT interchangeable with `coalesceParam` — that one keeps
 * the EXISTING column unless it is NULL (`places.service.ts`'s own legacy
 * shape); this one prefers the NEW value unless IT is null, keeping the
 * existing column only then. `doc-sync.service.ts`'s DS23/DS24
 * (`upsertItem`'s `file_id=COALESCE(?,file_id)`,
 * `remote_id=COALESCE(?,remote_id)`, … eight columns, both the plain
 * `nativeUpdate` and the Kysely `ON CONFLICT` forms) is the shape this
 * exists for — confirmed genuinely the opposite direction from
 * `coalesceParam`'s own doc'd precedent by reading the legacy SQL text
 * literally, not assumed from the function name alone (a same-named
 * "coalesce" helper reused in the wrong direction silently drops every
 * incoming update — verified directly against a live row: a `recordAttempt`
 * call passing a genuinely new `remote_version`/`content_sha256` left both
 * columns exactly as they were before, since `coalesceParam`'s `COALESCE(col,
 * ?)` always preferred the non-null existing value).
 */
export function coalesceOverride(
  platform: Platform,
  value: string | number | null,
  ref: string,
): RawQueryFragment & symbol {
  if (isKnownPlatform(platform)) return raw(`COALESCE(?, ${column(ref)})`, [value]);
  return unsupported(platform);
}

/**
 * `ABS(<col> - ?)`, for use as a filter KEY (the `'string'`-hint coercion
 * `lower()` above relies on) so it composes with `$lte`/`$gte`:
 * `{ [absDifference(platform, 'lat', targetLat)]: { $lte: tolerance } }`
 * renders `WHERE ABS(lat - ?) <= ?`, matching `places.service.ts:651-652`'s
 * `abs(lat - ?) <= ?` (and the sibling `lng` comparison at `:652`) exactly.
 * Typed `RawQueryFragment & symbol`, same reason `lower()` is: only a
 * `string | number | symbol` is a valid computed property name, and the
 * brand only lives on that typing for values meant to be used as a key.
 */
export function absDifference(platform: Platform, ref: string, value: number): RawQueryFragment & symbol {
  if (isKnownPlatform(platform)) return raw(`ABS(${column(ref)} - ?)`, [value]);
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3c Task 1 — aggregate SELECT projections (`PlaceShadowPicksRepository
// .totals`/`countBySource`/`countByLiveRank`, `place-shadow.service.ts:144,
// 149, 157`). `alias` is a hand-written literal at every call site today
// (never user input), validated the same way `column()` validates a column
// reference, so a future caller cannot smuggle SQL through it either.
// ---------------------------------------------------------------------------

function alias(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`sql-functions: not an alias: ${name}`);
  }
  return name;
}

/** `COUNT(*) as <alias>`, for a single-row totals read or a `GROUP BY` count column. */
export function countAll(platform: Platform, aliasName: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw(`COUNT(*) as ${alias(aliasName)}`);
  return unsupported(platform);
}

/** `MIN(<col>) as <alias>`. */
export function minOf(platform: Platform, ref: string, aliasName: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw(`MIN(${column(ref)}) as ${alias(aliasName)}`);
  return unsupported(platform);
}

/** `MAX(<col>) as <alias>`. */
export function maxOf(platform: Platform, ref: string, aliasName: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw(`MAX(${column(ref)}) as ${alias(aliasName)}`);
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3c Task 6 — `TripMembersRepository.listWithUserAndInviter`
// (`trip-members.service.ts:117`, TM2): the `role` column, a `CASE WHEN`
// comparing the joined user's id against the trip's owner id.
// ---------------------------------------------------------------------------

/**
 * `CASE WHEN <col> = ? THEN ? ELSE ? END`, for use as a `.select()` value
 * (chain `.as(aliasName)` at the call site, the same way `coalesce()`'s
 * callers do — this file does not bake the alias into the SQL text itself
 * for this one, unlike `countAll`/`minOf`/`maxOf`, because `.as()` already
 * covers it and a `value`-bearing fragment cannot reuse `alias()`'s bare
 * identifier validation the same way an aggregate's literal alias does).
 * `value`/`whenTrue`/`whenFalse` are all passed through `raw()`'s own
 * parameter escaping, never spliced into the SQL text by this function —
 * even though today's only caller (TM2's owner/member role label) passes
 * fixed literal strings, parity is by VALUE, not by whether the string
 * happens to be a source-code literal at the call site. (Task 6 review's
 * I1: downstream, MikroORM still formats the FINAL query with every
 * parameter inlined as an escaped literal in the SQL text it hands
 * better-sqlite3 — not as a separate bound-params array — so a non-finite
 * `value` renders as the bare token `NaN`/`Infinity` and fails at PREPARE
 * time regardless of this function's own escaping; callers must guard a
 * non-finite `value` before calling.)
 */
export function caseWhenEquals(
  platform: Platform,
  ref: string,
  value: number,
  whenTrue: string,
  whenFalse: string,
): RawQueryFragment {
  if (isKnownPlatform(platform))
    return raw(`CASE WHEN ${column(ref)} = ? THEN ? ELSE ? END`, [value, whenTrue, whenFalse]);
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3c Task 1 fix round (review M1) — `PlaceShadowPicksRepository
// .countBySource` (PS5): `.orderBy()` on `countAll()`'s aliased column throws
// ("Trying to query by not existing property" — `raw()`'s alias carries no
// literal type for `ExtractRawAliases` to register), and sorting the fetched
// rows in JS is NOT equivalent to the legacy `ORDER BY count DESC`: SQLite's
// own sorter is not stable, so on a tie it orders descending by GROUP BY key,
// while `Array.prototype.sort` (stable) leaves ties in the rows' incoming
// (ascending) order — verified directly (five sources, two tied pairs).
// ---------------------------------------------------------------------------

/**
 * `COUNT(*)` as an ORDER BY EXPRESSION (not an alias — `.orderBy()` cannot
 * order by `countAll()`'s aliased column; ordering by the expression itself
 * works and reproduces the legacy `ORDER BY count DESC` tie order exactly).
 * Typed `RawQueryFragment & symbol`, the same brand `lower()`/`lowerTrim()`
 * carry, so it is usable as an `.orderBy()` object key:
 * `.orderBy({ [countAllRef(platform)]: 'desc' })`.
 */
export function countAllRef(platform: Platform): RawQueryFragment & symbol {
  if (isKnownPlatform(platform)) return raw('COUNT(*)');
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3d Task 0 (R6) — no consumer yet: Tasks 2/4 wire these in as each
// converts the statement that needs them (`reservations.service.ts` RS11 and
// RS20 `listUpcoming`, `reservation-visibility.ts` RV2, DY23 in
// `days.service.ts`). Added here, with their own SQLF-0xx tests pinning the
// SQLite text against a raw statement on seeded rows, so Tasks 1-6 import a
// tested helper instead of writing one inline.
// ---------------------------------------------------------------------------

/**
 * `<col> GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*'` — "does this
 * column's TEXT value start with an ISO calendar date (`YYYY-MM-DD`)?", the
 * legacy `DATED` constant (`reservations.service.ts:120`:
 * `` `r.reservation_time GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*'` ``,
 * used at `:453-454` inside RS20's two `CASE WHEN` arms). Spelled with
 * SQLite's `[0-9]` character-class glob syntax, NOT the plan's shorthand
 * `'????-??-??*'` — verified directly against the legacy source, not
 * assumed: a `?` in SQLite GLOB matches any single character (letters
 * included), so `????-??-??*` is a strictly WIDER, non-equivalent pattern
 * (it would also match `abcd-ef-gh...`); only the digit-class form matches
 * the legacy's actual behaviour byte-for-byte.
 *
 * A full boolean expression, not a bare value — pair with a `CASE WHEN`
 * builder or a QB/Kysely raw condition, never nest inside another raw
 * fragment (see `coalesce()`'s docstring on why nesting doesn't work).
 * Kysely has no `GLOB` comparison operator (`operator-node.d.ts`'s
 * `ComparisonOperator` union omits it — verified against the installed
 * 0.29.6 typings, per the inventory's §19 MikroORM/Kysely capability table),
 * so this helper is the only portable spelling for this shape.
 * Postgres reads it as the anchored regular expression
 * `CAST(<col> AS text) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'`.
 */
export function startsWithIsoDate(platform: Platform, ref: string): RawQueryFragment {
  if (isSqlite(platform)) {
    return raw(`${column(ref)} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*'`);
  }
  if (isPostgres(platform)) return raw(`CAST(${column(ref)} AS text) ~ '${PG_ISO_DATE_PREFIX}'`);
  return unsupported(platform);
}

/**
 * `substr(<col>, <start>[, <length>])`, 1-based on both ends — the legacy
 * shape at `reservations.service.ts:453` (`substr(r.reservation_time, 1,
 * 10)`, three-arg), `:454` (`substr(r.reservation_time, 12)`, two-arg — "from
 * position 12 to the end of the string") and `days.service.ts` DY23
 * (`SUBSTR(reservation_time, 11)`, same two-arg shape, spelled uppercase in
 * that statement — SQL function names are case-insensitive, so this helper's
 * lowercase spelling is behaviourally identical). `length` is optional,
 * matching SQLite's own two-arg `substr(X, Y)` form (everything from `Y` to
 * the end) — passing it renders the three-arg form instead. `start` and
 * `length` are validated integers and spelled directly (not bound): they are
 * always source-code constants at every known call site (`1`, `10`, `11`,
 * `12`), never user input, the same trust boundary `dateAdd`'s day count and
 * `columnIncrementedBy`'s amount already rely on in this file.
 */
export function substring(platform: Platform, ref: string, start: number, length?: number): RawQueryFragment {
  if (!Number.isInteger(start) || start < 1) {
    throw new Error(`sql-functions: substring needs a 1-based integer start, got ${start}`);
  }
  if (length !== undefined && (!Number.isInteger(length) || length < 0)) {
    throw new Error(`sql-functions: substring needs a non-negative integer length, got ${length}`);
  }
  if (isKnownPlatform(platform)) {
    if (length === undefined) return raw(`substr(${column(ref)}, ${start})`);
    return raw(`substr(${column(ref)}, ${start}, ${length})`);
  }
  return unsupported(platform);
}

/**
 * A part of a `concat()` expression: either a column reference (rendered
 * through `column()`, the same identifier validation every other helper in
 * this file applies) or a plain value bound as a genuine parameter (`?`) —
 * never interpolated, even for what today's only legacy caller spells as a
 * literal (`'T'` in `d.date || 'T' || a.check_in`,
 * `reservations.service.ts:475, :493`): a bound constant and an interpolated
 * one produce byte-identical SQLite behaviour for a plain string, and
 * binding is the shape every other value-side helper in this file already
 * prefers (`coalesceParam`, `lowerParam`, `absDifference`).
 */
export type ConcatPart = { column: string } | { value: string };

/**
 * `<part> || <part> || …` — SQLite (and Postgres) string concatenation, the
 * legacy shape at `reservations.service.ts:475, :493`
 * (`d.date || 'T' || a.check_in`, RS20's two check-in/check-out arms) and
 * `days.service.ts` DY23 (`:date || SUBSTR(reservation_time, 11)`, inside an
 * `UPDATE … SET`). Needs at least two parts — a one-part "concatenation" is
 * a caller bug, not a legitimate call. Each part is a `ConcatPart` (see its
 * own docstring) rather than a bare string, so a column reference and a
 * bound literal can never be confused with each other the way an untyped
 * `...parts: string[]` would invite (a plain string could mean either).
 *
 * Deliberately does NOT accept a nested `RawQueryFragment` as a part (e.g.
 * the output of `substring()` above) — the same limitation `coalesce()`'s
 * docstring documents: `RawQueryFragment`'s `[Symbol.toPrimitive]` only
 * implements the `'string'` coercion hint (the object-key position), not the
 * `'default'` hint a template-literal embed or an array-join would need, so
 * composing `concat(platform, substring(...), ...)` throws at the `raw()`
 * boundary rather than rendering silently wrong SQL. A caller that needs
 * `SUBSTR(...)` as one side of a `||` builds that one statement directly
 * (Kysely's `'||'` binary operator, per the inventory's §17a/§19), the same
 * way RS20's own CASE/CTE shape is built outside this file's helpers.
 */
export function concat(platform: Platform, ...parts: readonly ConcatPart[]): RawQueryFragment {
  if (parts.length < 2) {
    throw new Error(`sql-functions: concat needs at least two parts, got ${parts.length}`);
  }
  if (isKnownPlatform(platform)) {
    const bindings: string[] = [];
    const sql = parts
      .map((part) => {
        if ('column' in part) return column(part.column);
        bindings.push(part.value);
        return '?';
      })
      .join(' || ');
    return raw(sql, bindings);
  }
  return unsupported(platform);
}

/**
 * `CAST(<col> AS INTEGER)` — the legacy shape at `reservations.service.ts:471,
 * :489` (inside RS20's correlated `stay_first_reservation_id`/title
 * subqueries: `CAST(res.accommodation_id AS INTEGER) = a.id`) and
 * `reservation-visibility.ts:106-107` (RV2's `publicStaySql`:
 * `CAST(vr.accommodation_id AS INTEGER) = ${alias}.id`). Exists specifically
 * for `reservations.accommodation_id`, a TEXT column holding integer ids
 * with no FK (§18.1 of the inventory — some rows read back as `"14.0"`):
 * casting it to INTEGER before comparing against a genuine INTEGER column
 * (`day_accommodations.id`) applies numeric affinity to BOTH sides, matching
 * `"14"` and `"14.0"` alike, the same way the legacy statement does. Postgres
 * refuses `CAST('14.0' AS integer)`, so its branch casts through `numeric`
 * and truncates: `CAST(trunc(CAST(<col> AS numeric)) AS integer)`.
 *
 * Typed `RawQueryFragment & symbol`, the same brand `lower()`/`lowerTrim()`
 * carry: both known legacy call sites compare the cast against ANOTHER
 * COLUMN, not a bound value (`= a.id`, `= ${alias}.id`) — the shape is
 * `{ [castInteger(platform, 'vr.accommodation_id')]: columnRef(platform,
 * 'a.id') }`, pairing this helper's filter-KEY brand with `columnRef()`'s
 * existing VALUE-side column reference. The brand also lets it appear in a
 * `.select()` projection via `.as(alias)` (the `lowerTrim`/SQLF-027 dual-use
 * precedent) for a caller that only needs the cast INTEGER value itself.
 */
export function castInteger(platform: Platform, ref: string): RawQueryFragment & symbol {
  if (isSqlite(platform)) return raw(`CAST(${column(ref)} AS INTEGER)`);
  if (isPostgres(platform)) return raw(`CAST(trunc(CAST(${column(ref)} AS numeric)) AS integer)`);
  return unsupported(platform);
}

/**
 * `ABS(JULIANDAY(<col>) - JULIANDAY(?))` — the legacy shape at
 * `reservations.service.ts:307` (RS11, `resolveDayIdFromTime`'s
 * nearest-day fallback: `ORDER BY ABS(JULIANDAY(date) - JULIANDAY(?)) ASC,
 * date ASC LIMIT 1`), which clamps an imported booking's date to the
 * closest day row in the trip when no exact match exists. `isoDate` is
 * bound as a genuine parameter (never interpolated), matching the legacy
 * statement's own bind. Distinct from `absDifference()` above:
 * `absDifference` is `ABS(<col> - ?)` on plain NUMERIC values (for a
 * lat/lng tolerance filter); this helper compares two `JULIANDAY(...)`
 * calendar values. Typed `RawQueryFragment & symbol`, the same brand
 * `countAllRef()` carries, so it is usable as an `.orderBy()` object key —
 * `.orderBy({ [dayDistance(platform, 'date', isoDate)]: 'asc' })` —
 * matching the legacy's own `ORDER BY ABS(JULIANDAY(...) - JULIANDAY(?)) ASC`
 * shape exactly (an aliased column cannot be ordered by, the same
 * `ExtractRawAliases` limitation `countAllRef`'s own docstring / SQLF-024's
 * comment documents; ordering by the EXPRESSION itself is what works).
 * Postgres measures the same distance in days from the epoch difference of
 * the two values cast to `timestamp`.
 */
export function dayDistance(platform: Platform, ref: string, isoDate: string): RawQueryFragment & symbol {
  if (isSqlite(platform)) return raw(`ABS(JULIANDAY(${column(ref)}) - JULIANDAY(?))`, [isoDate]);
  if (isPostgres(platform)) {
    return raw(`ABS(EXTRACT(EPOCH FROM (CAST(${column(ref)} AS timestamp) - CAST(? AS timestamp))) / 86400)`, [
      isoDate,
    ]);
  }
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3f Task 0 (R9) — no consumer yet: Task 2 (`collateNoCase`, SH9's
// `school-holidays.service.ts#checkName` duplicate-name guard) and Task 4
// (`nowMinusHours`, RJ4's `reminder-jobs.service.ts#todoTick`
// `datetime('now', '-20 hours')`) wire these in when each converts the
// statement that needs them. `lowerTrimParam` (AT31's value side, atlas's
// bucket-list dedup) is Task 1's. Added here, with their own SQLF-0xx tests
// pinning the SQLite text against a raw statement on seeded rows, so each
// task imports a tested helper instead of writing one inline.
// ---------------------------------------------------------------------------

/**
 * A case-insensitive column reference via SQLite's `NOCASE` collating
 * sequence, for use as a filter's object key — the same `{ [collateNoCase(
 * platform, 'name')]: value }` shape `lower()` documents, rendering `WHERE
 * name COLLATE NOCASE = <value-side>`. The legacy statement this replaces
 * (`school-holidays.service.ts:50`, SH9) spells the COLLATE on the VALUE
 * side instead (`name = ? COLLATE NOCASE`) — textually different, but SQLite
 * resolves a binary comparison's collating sequence from the FIRST operand
 * that carries an explicit `COLLATE`, scanning left to right, so `col
 * COLLATE NOCASE = ?` and `col = ? COLLATE NOCASE` select the same collation
 * (NOCASE) for the whole comparison either way — verified directly
 * (SQLF-060: both forms select the identical row set on a mixed-case
 * fixture), not assumed from the operator's documented precedence alone.
 *
 * **Not the same helper as `lower()`, and not reusable in its place.**
 * SQLite's built-in `NOCASE` collation is documented to fold ONLY the 26
 * ASCII letters, exactly like `LOWER()`'s own ASCII-only fold (program rule
 * 18) — verified directly against `better-sqlite3` (SQLF-061): on every
 * non-ASCII fixture this file's own `LOWER()` test (SQLF-014) already
 * carries, `x = y COLLATE NOCASE` and `LOWER(x) = LOWER(y)` agree, letter for
 * letter — neither engine folds a non-ASCII case pair. So `collateNoCase`
 * does NOT diverge from `lower()` on any input constructed here; it is a
 * NEW helper anyway (per R9's own instruction) because the two are
 * textually different SQL constructs matching two textually different
 * legacy statements (`COLLATE NOCASE` vs `LOWER(...)`), and because a
 * `COLLATE`-based comparison lets SQLite use an index on the un-wrapped
 * column in a way `LOWER(col) = ?` cannot — a real, if not row-visible,
 * difference between the two shapes.
 *
 * Postgres has no built-in `NOCASE`. Its branch names a collation `nocase`
 * that a Postgres schema creates as a nondeterministic ICU collation
 * (`CREATE COLLATION nocase (provider = icu, locale = 'und-u-ks-level2',
 * deterministic = false)`, which `scripts/pg-probe.ts` does). That one folds
 * case for every letter, not only ASCII, and supports `=` but not `LIKE`.
 */
export function collateNoCase(platform: Platform, ref: string): RawQueryFragment & symbol {
  if (isSqlite(platform)) return raw(`${column(ref)} COLLATE NOCASE`);
  if (isPostgres(platform)) return raw(`${column(ref)} COLLATE "nocase"`);
  return unsupported(platform);
}

/**
 * `datetime('now', '-N hours')` — the hour-granularity sibling of
 * `nowMinusDays()` above, for `reminder-jobs.service.ts#todoTick`'s
 * `datetime('now', '-20 hours')` (RJ4) — 20 hours is not expressible as
 * `nowMinusDays` with a fractional day. Same validation shape as
 * `nowMinusDays` (a non-negative integer, spelled directly into the
 * fragment rather than bound — MikroORM's raw fragments do not accept a
 * placeholder inside a SQLite date/time function's modifier argument, the
 * same reasoning `nowMinusDays`'s own docstring gives).
 */
export function nowMinusHours(platform: Platform, hours: number): RawQueryFragment {
  if (!Number.isInteger(hours) || hours < 0) {
    throw new Error(`sql-functions: nowMinusHours needs a non-negative integer hour count, got ${hours}`);
  }
  if (isSqlite(platform)) return raw(`datetime('now', '-${hours} hours')`);
  if (isPostgres(platform)) return raw(pgTimestampText(`${PG_UTC_NOW} - INTERVAL '${hours} hours'`));
  return unsupported(platform);
}

/**
 * The value-side twin of `lowerTrim()`: `LOWER(TRIM(?))` bound with the RAW,
 * untransformed value — confirmed genuinely missing by reading this file's
 * full export list before adding it (R9), not assumed from the inventory's
 * own flag. Pairs with `lowerTrim()` as a filter KEY for the composed
 * `LOWER(TRIM(<column>)) = LOWER(TRIM(?))` shape
 * `atlas.service.ts:876-877`'s AT31 needs (`lower(trim(name)) =
 * lower(trim(?))`), the same "bind the raw value, let SQL apply the SAME
 * transform to both sides" reasoning `lowerParam()`'s own docstring gives —
 * do NOT pre-trim/pre-lower the value in JS before calling this (program
 * rule 18: mixing engines is the bug this pairing exists to avoid).
 */
export function lowerTrimParam(platform: Platform, value: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw('LOWER(TRIM(?))', [value]);
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3h Task 0 — no consumer yet: Task 3 (`dawarich-sync.service.ts`'s
// `listTripsToSync`, DSY2 — `date('now','-400 days')` / `date('now','+1
// day')`) and Task 4 (`route-usage.service.ts`'s `purgeExpired`, RU4 —
// `date('now', ?)` bound with the modifier `-${RETENTION_DAYS} days`, and
// RETENTION_DAYS (`route-usage.service.ts:13`) is a compile-time module
// constant (`400`), not a runtime value — so RU4's "bound parameter" and
// DSY2's "literal" are the SAME shape at the call site once the modifier is
// known, confirmed directly against both files' actual source rather than
// assumed from the legacy SQL's own binding style) wire `nowDateOffset` in
// when each converts its own statement.
//
// Plan 3f's own four `date('now')` sites (atlas.service.ts AT39/AT42/AT44/
// AT45 — 3g's inventory's own open question, inherited from 3f and never
// resolved until now) do NOT go through a dialect helper at all: `todayUtc()`
// (a `@trek/shared` JS function) resolves the calendar date once in the
// CALLING SERVICE (`atlas.service.ts:912`, `const trip = await
// this.trips.lastStartedTrip(userId, todayUtc())`) and the repository binds
// it as a plain parameter (`Trips.repository.ts#lastStartedTrip`:
// `.where((eb) => eb(eb.fn.coalesce('t.start_date', 't.end_date'), '<=',
// today))`) — confirmed by reading the actual converted code at HEAD, not
// the plan document's description of it. That pattern covers a BARE
// `date('now')` (no offset) cleanly, and needs no new helper here. It does
// not extend to an OFFSET the way DSY2/RU4 need without every call site
// re-deriving day arithmetic in JS by hand, so this file instead grows the
// sibling `nowMinusDays`/`nowMinusHours` already establish for exactly this
// family (Plan 3c Task 0b/Plan 3f Task 0 R9): a signed day-count offset from
// "now", spelled into the fragment after integer validation, the same
// reasoning those two helpers give (MikroORM's raw fragments do not accept a
// placeholder inside a SQLite date/time function's modifier argument).
// `PlaceShadowPicksRepository.expireStale` (Plan 3c Task 1) is this shape's
// own closest working precedent — a retention-window purge built on
// `nowMinusDays` exactly the way `RouteUsageDailyRepository`'s own purge
// (RU4) will be built on `nowDateOffset` below.
// ---------------------------------------------------------------------------

/**
 * `date('now', '<sign>N days')` — the SQLite clock's CALENDAR DATE (`date()`,
 * not `datetime()` — `nowMinusDays` above is the wrong shape for this: it
 * targets `datetime()`, and only ever subtracts), shifted by a signed whole
 * day count. Unlike `nowMinusDays`, `days` may be POSITIVE (forward),
 * NEGATIVE (backward) or zero — `dawarich-sync.service.ts`'s
 * `listTripsToSync` (DSY2) needs both directions in the SAME statement
 * (`date('now','-400 days')` for the trailing edge, `date('now','+1 day')`
 * for the leading one). `days` is spelled directly into the fragment (not
 * bound), the same reasoning `nowMinusDays`'s own docstring gives.
 *
 * Verified directly (not assumed) that SQLite's modifier keyword tolerates
 * the singular/plural mismatch between the two legacy texts (`'+1 day'`
 * singular, `'-400 days'` plural): `date('now','+1 day')` and
 * `date('now','+1 days')` render the identical result against a live
 * `better-sqlite3` connection, so this helper's always-plural spelling is
 * behaviourally identical to both legacy statements, not just the plural one.
 */
export function nowDateOffset(platform: Platform, days: number): RawQueryFragment {
  if (!Number.isInteger(days)) {
    throw new Error(`sql-functions: nowDateOffset needs an integer day count, got ${days}`);
  }
  if (isSqlite(platform)) {
    const sign = days < 0 ? '-' : '+';
    return raw(`date('now', '${sign}${Math.abs(days)} days')`);
  }
  if (isPostgres(platform)) return raw(pgDateText(`${PG_UTC_NOW} + INTERVAL '${days} days'`));
  return unsupported(platform);
}

/**
 * `datetime('now', '+N seconds')` — the seconds-granularity, ADDING sibling
 * of `nowMinusDays`/`nowMinusHours` above: the shape `doc-sync.service.ts`'s
 * `upsertItem` (DS23, inside an `ON CONFLICT DO UPDATE`'s `CASE WHEN`; DS26,
 * inside the sibling `INSERT ... VALUES`) and `recordLinkFailure` (a third,
 * structurally identical call site found re-reading the file at HEAD —
 * `next_attempt_at = datetime('now', '+' || ? || ' seconds')`,
 * `doc-sync.service.ts:967`, not individually numbered in the plan's own
 * inventory) all need: a caller-computed backoff window (`backoffSeconds(
 * ...)`, a genuine RUNTIME value, never a source-code constant the way
 * `nowMinusDays`'s callers' day counts are) added to the database clock.
 * `seconds` is validated non-negative-integer and spelled directly into the
 * fragment — the same reasoning (and the same MikroORM raw-fragment
 * placeholder limitation) `nowMinusDays`'s own docstring gives; every known
 * call site's `seconds` argument is already a JS-computed `number`, never
 * user input, the same trust boundary this file relies on elsewhere
 * (`dateAdd`'s day count, `substring`'s start/length).
 */
export function nowPlusSeconds(platform: Platform, seconds: number): RawQueryFragment {
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new Error(`sql-functions: nowPlusSeconds needs a non-negative integer second count, got ${seconds}`);
  }
  if (isSqlite(platform)) return raw(`datetime('now', '+${seconds} seconds')`);
  if (isPostgres(platform)) return raw(pgTimestampText(`${PG_UTC_NOW} + INTERVAL '${seconds} seconds'`));
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Plan 3h Task 5 (doc-sync) — `FOUND_AGAIN` (`doc-sync.service.ts:53-54`), the
// module-level SQL-text CASE constant reused by four legacy UPDATEs (DS2
// `relocate`, DS3 `rename_remote`, DS5 `rename_local`, DS12 `touch`). Unlike
// every other CASE in this file's DS2-DS12 neighbourhood — whose WHEN
// condition binds a value already known in JS at the call site (a boolean
// flag, a state string), so the whole CASE collapses to a plain JS ternary
// deciding which field to include in a `nativeUpdate` call — this one
// compares the ROW'S OWN CURRENT `state`/`file_id` columns, which are not
// knowable until the UPDATE executes. That is genuinely SQL-level, and the
// four call sites share one method (`DocumentSyncItemsRepository`'s private
// `foundAgain` builder) rather than four independent re-derivations, per the
// task's own instruction to keep `FOUND_AGAIN` "a reusable typed CASE
// expression ... consumed by all four".
// ---------------------------------------------------------------------------

/**
 * `CASE WHEN <stateRef> = 'remote_missing' AND <fileIdRef> IS NOT NULL THEN
 * 'synced' ELSE <stateRef> END` — doc-sync's `FOUND_AGAIN` clause, for the
 * `state` column of an UPDATE `document_sync_items` SET list. Only a copy
 * that is BOTH on record as missing AND still paired to a file recovers this
 * way; every other state (`error`, `conflict`, a row with no file at all)
 * passes through unchanged. `remote_missing_at` is cleared unconditionally
 * by the SAME UPDATE's own `remote_missing_at = NULL` (a plain value, not
 * part of this fragment — the caller sets it alongside).
 */
export function foundAgainState(platform: Platform, stateRef: string, fileIdRef: string): RawQueryFragment {
  if (isKnownPlatform(platform)) {
    return raw(
      `CASE WHEN ${column(stateRef)} = 'remote_missing' AND ${column(fileIdRef)} IS NOT NULL THEN 'synced' ELSE ${column(stateRef)} END`,
    );
  }
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// `UsersRepository.setImmichSettings` (IM4, #2475): the self-signed switch is
// trusted for ONE server, so whether a null incoming value may keep the stored
// choice depends on whether the URL written in the same SET list is the URL
// already stored. Like `foundAgainState` above, the WHEN condition reads the
// ROW'S OWN CURRENT column, which is not knowable in JS before the UPDATE runs
// — a read-then-write would be two statements where the legacy SQL had one.
// ---------------------------------------------------------------------------

/**
 * `CASE WHEN <keyRef> IS ? THEN COALESCE(?, <ref>) ELSE COALESCE(?, 0) END` —
 * {@link coalesceOverride}'s "new value wins unless it is null" shape, but the
 * stored column is only a valid fallback WHILE the key column still holds
 * `keyValue` (the value the same UPDATE writes to it). Once the key changes,
 * a null `value` falls back to the column's default `0` instead of a choice
 * made for a different key. SET expressions see the row as it was before the
 * UPDATE, so `<keyRef> IS ?` compares the STORED key with the new one even
 * though the same statement overwrites it. `value` is bound twice on purpose:
 * the fragment has two value slots and `raw()` binds positionally. SQLite's
 * null-safe `IS` is `IS NOT DISTINCT FROM` on Postgres.
 */
export function coalesceOverrideWhileSame(
  platform: Platform,
  value: number | null,
  ref: string,
  keyRef: string,
  keyValue: string,
): RawQueryFragment {
  if (isSqlite(platform)) {
    return raw(`CASE WHEN ${column(keyRef)} IS ? THEN COALESCE(?, ${column(ref)}) ELSE COALESCE(?, 0) END`, [
      keyValue,
      value,
      value,
    ]);
  }
  if (isPostgres(platform)) {
    const sql = `CASE WHEN ${column(keyRef)} IS NOT DISTINCT FROM ? THEN COALESCE(?, ${column(ref)}) ELSE COALESCE(?, 0) END`;
    return raw(sql, [keyValue, value, value]);
  }
  return unsupported(platform);
}

// ---------------------------------------------------------------------------
// Tours (#2586): `DayAssignmentsRepository`'s assignment projection carries a
// place's route geometry only when the place is a Tour, so the day list never
// hauls an ordinary track's geometry along with every stop.
// ---------------------------------------------------------------------------

/**
 * `CASE WHEN <testRef> IS NOT NULL THEN <thenRef> END`, for use as a
 * `.select()` value (chain `.as(aliasName)` at the call site). The missing
 * ELSE is deliberate: a null test column yields SQL NULL.
 */
export function caseWhenNotNull(platform: Platform, testRef: string, thenRef: string): RawQueryFragment {
  if (isKnownPlatform(platform)) return raw(`CASE WHEN ${column(testRef)} IS NOT NULL THEN ${column(thenRef)} END`);
  return unsupported(platform);
}
