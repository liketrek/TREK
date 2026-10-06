/**
 * `toCamelCase` — the R-facade utility from Plan 3j's Task 6 (design spec D8, program
 * `docs/superpowers/plans/2026-09-25-orm-phase3j-plugins.md`). It is DORMANT: built,
 * tested and exported, but wired into ZERO of the 23 `*.rpc.ts` plugin-host handlers.
 * `plugin-sdk/src/index.ts`'s published row types (`User`, `Place`, `Day`, `Reservation`,
 * `PackingItem`, `TripFile`, `BudgetItem`, …) are snake_case today, and neither the SDK
 * nor its tests carry any camelCase precedent — so applying this additively to a
 * handler's return value would grow the plugin contract's visible surface with fields no
 * published type, plugin author or test fixture expects, for no proven benefit. Whether
 * TREK should start publishing camelCase copies going forward is a real product decision
 * (see the plan's "For the user" note), not one an ORM-migration task makes unilaterally.
 * This function exists so that decision, if it is ever made, is a one-line change at
 * `HostSurfaceRpc#getUser`'s single return statement rather than new plumbing to design
 * and land. It is a pure function — no class, no DI, no constructor — matching the
 * `num`/`str`/`asPayload` shape in the sibling `rpc-params.ts` every one of the 23
 * `*.rpc.ts` files already imports the same way, specifically so it never ripples through
 * `tests/helpers/plugin-host.ts`/`rpc-host-deps.ts`'s hand-construction of all 23 classes.
 *
 * Scope, operate ONLY on a DB-row-shaped object the HOST itself assembled (e.g.
 * `SELECT id, username, display_name, avatar FROM users …`). NEVER apply it to an opaque
 * JSON-text value a PLUGIN wrote and the host merely parsed (`MetaRpc#get`/`#list`'s
 * values, a plugin's own `config`) — a generic key transform would silently rewrite keys
 * inside that stored blob, which is exactly why a generic deep-key transform was rejected
 * project-wide (design spec D1/D8).
 */

/**
 * Returns a shallow, additive camelCase COPY of `value`'s keys: every key containing `_`
 * gets a camelCase sibling holding the same value (`display_name` -> `displayName`,
 * `content_base64` -> `contentBase64`); the original snake_case key is never removed or
 * replaced. A key with no underscore is left exactly as it is — no identity-transform
 * copy is ever added for it. The conversion is ONE level deep only: a nested object, a
 * `Date`, a `Buffer` or any other VALUE under a key is passed through completely
 * unchanged (never recursed into, never spread) — only the row's own TOP-LEVEL key names
 * are touched. This is the scope choice inventory §13 flagged as an open ambiguity in the
 * design spec's "shallow" wording; a future caller wiring this in should expect a
 * `user_profile: { first_name: 'A' }` row to gain `userProfile` pointing at the SAME
 * nested object, with `first_name` inside it untouched — never a recursively-mapped
 * `userProfile: { firstName: 'A' }`.
 *
 * An array is mapped element-wise, each element run back through `toCamelCase`. `null`,
 * `undefined`, a `Date`, a `Buffer` and any other non-plain-object value passed as the
 * top-level argument pass through completely unchanged, defensively — a caller mistake
 * here (this is never called with anything but a row object in the codebase today, since
 * it is unwired) must not throw into an RPC dispatch.
 */
export function toCamelCase<T extends Record<string, unknown>>(value: readonly T[]): (T & Record<string, unknown>)[];
export function toCamelCase<T extends Record<string, unknown>>(value: T): T & Record<string, unknown>;
export function toCamelCase<V>(value: V): V;
export function toCamelCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => toCamelCase(item));

  if (value === null || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) {
    return value;
  }

  const row = value as Record<string, unknown>;
  const camelCopies: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    if (!key.includes('_')) continue;
    const camelKey = snakeKeyToCamel(key);
    if (camelKey !== key) camelCopies[camelKey] = row[key];
  }
  return { ...row, ...camelCopies };
}

/**
 * `display_name` -> `displayName`; `content_base64` -> `contentBase64`. A digit right
 * after an underscore follows the same rule and needs no special case — uppercasing a
 * digit is a no-op, so `place_2_id` -> `place2Id`.
 */
function snakeKeyToCamel(key: string): string {
  return key.replace(/_([a-zA-Z0-9])/g, (_match, char: string) => char.toUpperCase());
}
