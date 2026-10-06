import type { TrekRepository } from './trek-repository';
import type { FilterQuery, FilterValue, OrderDefinition } from '@mikro-orm/core';

/**
 * Shared lookup shapes for entities scoped to a user.
 *
 * Built for `TagsRepository` (Plan 3a Task 3): `listByUser`/`findByIdAndUser`
 * are the same two query shapes every strictly-owned entity needs
 * (`tags.user_id` is `NOT NULL`) — list-scoped-to-owner and find-one-by-id
 * with an ownership check. `CategoriesRepository` uses neither: its legacy
 * `list`/`getById` (`SELECT * FROM categories ORDER BY name ASC` / `SELECT *
 * FROM categories WHERE id = ?`) have no owner filter at all, despite
 * `categories.user_id` being nullable — changing that would be a behaviour
 * change, not a refactor, so it stays plain `find`/`findOne`.
 *
 * A third helper, `findOwnedOrGlobal` (id match OR a NULL owner column —
 * the shape `categories.getById` would need if it were ever scoped), was
 * built alongside these two and then deleted: Task 0 re-review flagged that
 * no categories or tags site actually filters "owner or global", so it had
 * only test coverage and no real caller (R6 — "dead code is worse than a
 * missing helper"). If a future entity needs that shape, recover it from
 * git history rather than reintroducing it speculatively.
 *
 * Typed `repo: TrekRepository<T>` (Task 7 review, A-L3/B-L4 — was the core
 * `EntityRepository<T>` until this task, the last two places in the
 * repository tree still restating `disableIdentityMap: true` per call
 * because the type couldn't see `TrekRepository`'s own validation and read
 * default): at runtime the argument was always a `TrekRepository` (every
 * concrete repository extends it), so the guard always fired — this closed
 * a typing gap, not a safety gap. The two per-call `disableIdentityMap:
 * true` literals below are gone now that the base class's `find`/`findOne`
 * overrides supply the same default.
 *
 * These helpers return live MikroORM entities, not rows — unlike every other
 * repository method in this codebase (D4: "repositories return rows, never a
 * live entity"). They are an internal building block for `TagsRepository`,
 * which stays the actual public API and must run the result through `toRow`
 * before it leaves the repository.
 *
 * Call-site convention (Task 0 re-review): type arguments are ALWAYS explicit —
 * inference from the repository argument alone resolves `T` to the
 * `{ id: unknown }` constraint and fails to compile (TS2345) — and the owner
 * field is the RELATION property (`'user'`), never the `persist(false)` twin
 * (`'user_id'`): both compile and emit the same SQL, but only the relation
 * name survives a column rename and reads as the entity's API. `ownerId` is the
 * raw FK number. Canonical calls:
 *
 *   listForOwner<Tags, 'user', 'name'>(tags, 'user', userId, 'name');
 *   findOwnedByUser<Tags, 'user'>(tags, id, 'user', userId);
 *
 * Both helpers get `disableIdentityMap: true` from `TrekRepository`'s own
 * `find`/`findOne` default now (Plan 3b Task 1 fix round, supersedes Plan
 * 3a's I1 "`refresh: true` on every PK-only `findOne`" — see
 * `Users.repository.ts`'s class-level docstring and
 * `.superpowers/sdd/2026-09-22-orm-phase3b/task-1-review.md` B1): both are
 * "rows out" reads whose entity is converted via `toRow` and discarded, never
 * assigned to nor flushed, so a throwaway forked context is exactly right.
 *
 * Typing (Task 0 review, I2): `T extends { id: unknown }` and `K extends
 * keyof T` tie `ownerField` to a real property of `T` and `ownerId` to
 * `FilterValue<T[K]>` — the same value shape MikroORM's own `FilterObject`
 * accepts for that property (`T[K]` directly is too strict for a relation
 * property: `Tags['user']` is `Ref<Users>`, but every call site here filters
 * it with the raw foreign-key id, which `FilterValue` allows and a bare
 * `T[K]` would not). `id`/`ownerId` are no longer `unknown` — a call for an
 * entity without an `id` column, or with an `ownerId` of the wrong shape, now
 * fails `tsc` instead of only failing at runtime; the `as FilterQuery<T>`/
 * `as OrderDefinition<T>` casts are the one place the shape is still
 * asserted rather than inferred, exactly at the computed-property-key
 * boundary TypeScript cannot check on its own.
 */

/**
 * List every row owned by `ownerId`, ordered by `orderField` ascending:
 * `SELECT * FROM <table> WHERE <ownerField> = ? ORDER BY <orderField> ASC`.
 */
export async function listForOwner<T extends { id: unknown }, K extends keyof T, OF extends keyof T>(
  repo: TrekRepository<T>,
  ownerField: K,
  ownerId: FilterValue<T[K]>,
  orderField: OF,
): Promise<T[]> {
  return repo.find({ [ownerField]: ownerId } as FilterQuery<T>, {
    orderBy: { [orderField]: 'asc' } as OrderDefinition<T>,
  });
}

/**
 * Find one row by id, strictly scoped to an owner:
 * `SELECT * FROM <table> WHERE id = ? AND <ownerField> = ?`.
 *
 * `disableIdentityMap: true` per the module-level docstring above — this is
 * always a "rows out" read here, never a caller's staging read for
 * `assign`+`flush`.
 */
export async function findOwnedByUser<T extends { id: unknown }, K extends keyof T>(
  repo: TrekRepository<T>,
  id: T['id'],
  ownerField: K,
  ownerId: FilterValue<T[K]>,
): Promise<T | null> {
  return repo.findOne({ id, [ownerField]: ownerId } as FilterQuery<T>);
}
