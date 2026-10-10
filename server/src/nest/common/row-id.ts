/**
 * The one place an external, string-shaped route/tool id is turned into a
 * numeric primary key before it reaches a typed repository filter.
 *
 * The legacy raw-SQL layer bound a route param straight into `WHERE id = ?`
 * and let SQLite's column-affinity rules do the work. Those rules are more
 * permissive than they look: SQLite applies NUMERIC affinity to a TEXT
 * operand compared against an INTEGER column using the same conversion CAST
 * uses, which accepts leading/trailing whitespace, a leading sign, a decimal
 * point and an exponent — so `WHERE id = ?` genuinely matches integer row 1
 * for `' 1'`, `'1 '`, `'1.0'` and `'+1'`, and matches row 1000 for `'1e3'`
 * (verified empirically against `better-sqlite3`, not assumed — this
 * docstring previously claimed the opposite, that `'1e3'` "can never equal
 * an INTEGER column"; that claim was false). A typed MikroORM filter has no
 * such affinity: `Number('abc')` is `NaN`, and the ORM renders that as the
 * bare, unquoted token `NaN` in the generated SQL, which SQLite parses as a
 * column reference and throws `InvalidFieldNameException: no such column:
 * NaN` — a 500 where the legacy route 404'd (Plan 3b Task 2 review, F1).
 *
 * `toRowId` is the guard every converted service calls instead of a bare
 * `Number(id)`. It does NOT reproduce every string SQLite's affinity
 * conversion would have matched — that would mean accepting `' 1'`, `'1.0'`,
 * `'1e3'`, `'+1'`, and there is no realistic route/tool input that spells an
 * id that way: every id in this codebase originates as
 * `String(<integer column value>)` on our own client (a URL path segment or
 * an MCP tool argument), which is always a canonical decimal string, digits
 * only, no sign, no leading zero beyond what the id itself is, no decimal
 * point, no exponent, no surrounding whitespace. `toRowId` accepts exactly
 * that canonical shape (`/^\d+$/`, so `'007'` — an id that happens to have
 * leading zeros, which SQLite's own affinity conversion also resolves to 7 —
 * still matches) and returns `null` for every non-canonical spelling,
 * INCLUDING the ones SQLite's affinity would have matched. This is a
 * DELIBERATE, ACCEPTED narrowing (program rule 15,
 * `docs/superpowers/plans/2026-09-21-orm-migration-program.md`): a
 * non-canonical id can only ever reach this guard from something other than
 * our own client (a hand-crafted request), and failing closed to the
 * route's legacy not-found result for it is the documented parity
 * deviation, not a bug — never widen the regex to `/^(0|[1-9]\d*)$/` or any
 * other shape that would reject `'007'`, and never widen it to accept the
 * divergent shapes above either.
 *
 * **The "accepted narrowing" is a different SIZE depending on what the
 * legacy seam bound (task-3-rereview.md R1).** Not every legacy raw-SQL
 * call site bound the route string straight into `WHERE id = ?` and leaned
 * on SQLite's affinity as described above (an "affinity seam" —
 * `registration-invites.service.ts::deleteInvite` is one, and so are the
 * categories/tags/token routes Task 2 converted): some called `Number(id)`
 * FIRST, in application code, before the query ever ran (a "`Number()`
 * seam" — `passkey.service.ts::renamePasskey`/`deletePasskey`,
 * `AdminService.resetUserPasskeys`). On an affinity seam, `toRowId` removes
 * only the genuine false-accepts described above (whitespace, decimal
 * point, exponent, leading `+`). On a `Number()` seam it removes a WIDER
 * set: `Number('0x10')`, `Number('1e1')`, `Number('16.0')` and `Number('
 * 16')` all coerce to a real integer in JavaScript (unlike SQLite's
 * affinity, which never converts a hex literal), so on that kind of seam
 * `toRowId` additionally refuses every hex and exponent form that used to
 * hit a REAL row, not just malformed ones. Both are the same deliberate,
 * accepted deviation — `toRowId` is right for both — but a regression test
 * that asserts "`'0x10'` gets the legacy 404" is only true on an affinity
 * seam; on a `Number()` seam the legacy statement acted on the row `toRowId`
 * now refuses, so the honest claim is "the deliberate `toRowId` narrowing",
 * not "parity with the legacy". Check which kind of seam a route's legacy
 * handler was (`git show <base>:<file>` on the actual statement, not the
 * route) before writing that test.
 *
 * **A THIRD shape narrows nothing at all: a PRE-COERCED `Number()` seam**
 * (Task 7 review, M2/A-M2). The two `Number()`-seam routes above still hand
 * `toRowId` the RAW STRING — the legacy code's own `Number(id)` conversion
 * moved to a repository-facing call site, so `toRowId` sees what the legacy
 * `Number()` used to see and narrows exactly as described. But on some
 * routes the legacy's `Number(id)` conversion itself survives UPSTREAM of
 * `toRowId`, and `toRowId` receives an already-coerced `number`, not the
 * original string — `oauth-api.controller.ts::revokeSession`'s `DELETE
 * /api/oauth/sessions/:id` is that shape on both the legacy and the
 * converted tree: `Number(id)` runs first, `toRowId(Number(id))` only
 * checks `Number.isSafeInteger`, and the legacy statement never matched a
 * non-safe-integer either — so `'0x10'`, `'1e1'`, `'16.0'` and `' 16'` all
 * reach the SAME row on both trees (verified live, Task 7 review security
 * report). There is no narrowing to name here, and no regression test
 * should claim one for this shape — record it as "the pre-coerced
 * `Number()` seam: full parity" and move on, the same way `passkey.service
 * .ts::adminResetPasskeys` (`:502-507`) already documents its own copy of
 * this exact shape.
 */
export function toRowId(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : null;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

/**
 * The TEXT shape the legacy raw-SQL layer actually stored for an
 * `accommodation_id` value bound as a plain JS number (Plan 3d Task 3/7
 * finding, verified empirically against the live `better-sqlite3` driver,
 * not assumed): `better-sqlite3` binds every plain JS `number` as SQLite
 * REAL regardless of integer-ness (confirmed via `typeof(?)`), and SQLite's
 * own "numeric value inserted into a TEXT column becomes text" rule then
 * renders a REAL's decimal form — `14` → `'14.0'`, never the plain integer
 * text `'14'`. `String(id)` (what a SQL-literal-inlined `em.insert()`,
 * rule 22, would produce for a bound `number`) renders `'14'` instead — a
 * DIFFERENT stored shape from the legacy's — and a reader that still
 * compares against the REAL-bound form (`restampLinkedReservation`/DY23
 * binds the id as a number through Kysely, which is REAL again) silently
 * misses every row written that way.
 *
 * Use this wherever a `number` id is written into the `accommodation_id`
 * TEXT column so the stored bytes match what the legacy statement would
 * have stored for the same input — never `String(id)` for that column.
 * `ReservationsRepository`'s reads of this column that must match BOTH the
 * legacy shape and a `String(id)` shape go through `castIntegerKysely`
 * instead (see that file's docstring); this helper is for WRITES only.
 */
export function legacyBoundIntegerText(id: number): string {
  return `${id}.0`;
}
