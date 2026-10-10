/**
 * Plan 3e Task 2 (budget), R11 — the presence-sentinel helper pattern.
 *
 * The legacy multi-column `UPDATE` statements this plan repeats five times
 * (budget's 8-column item update / 6-column settlement update, packing's
 * 8-column item update, todo's 7-column item update, collab's 6-column note
 * update) all follow the same idiom: `col = CASE WHEN ? THEN ? ELSE col
 * END`, bound with a presence flag and a value — "the caller didn't mention
 * this field, leave the column alone" vs. "the caller set it, including to
 * NULL, write that".
 *
 * Re-expressed for Kysely's `updateTable(...).set(data)`, no SQL-level CASE
 * WHEN is needed: Kysely only emits a `SET` clause for a key that is
 * PRESENT in `data` — an absent key is untouched, which IS the "ELSE col"
 * branch, and a present key (even `null`) is written, which IS the "THEN ?"
 * branch. `presenceSet` builds that object: pass each column a `[present,
 * value]` pair (`value` already resolved to its final bound shape by the
 * caller — e.g. `data.currency || null` — exactly like `ReservationsRepository
 * .updateReservation`'s docstring: "the SERVICE resolves the field to its
 * FINAL value first, this writes exactly what it is handed"), and only the
 * present ones survive into the returned partial object.
 *
 * Land here first (Task 2); Tasks 3 (packing), 4 (todo) and 5 (collab) copy
 * this shape rather than re-deriving their own CASE WHEN translation.
 */
export function presenceSet<T extends Record<string, unknown>>(fields: {
  [K in keyof T]?: readonly [present: boolean, value: T[K]];
}): Partial<T> {
  const out: Partial<T> = {};
  for (const key of Object.keys(fields) as (keyof T)[]) {
    const entry = fields[key];
    if (entry && entry[0]) out[key] = entry[1];
  }
  return out;
}
