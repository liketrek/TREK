import type { Categories } from '../entities/Categories.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `categories` row as the API emits it. */
export interface CategoryRow {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  user_id: number | null;
  created_at: string | null;
}

const _categoryRowKeys: AssertRowKeys<CategoryRow, Categories> = true;

export class CategoriesRepository extends TrekRepository<Categories> {
  /** `SELECT * FROM categories ORDER BY name ASC` */
  async list(): Promise<CategoryRow[]> {
    const categories = await this.find({}, { orderBy: { name: 'asc' } });
    return categories.map((category) => toRow(category) as CategoryRow);
  }

  /**
   * `share.service.ts:396` SH15 (`getSharedTripData`) — `SELECT * FROM
   * categories`, no `ORDER BY` (unlike `list()` above, which adds `ORDER BY
   * name ASC` for the authenticated `/api/categories` list — the legacy
   * public-share statement never sorted). Unscoped by trip on purpose: "a
   * shared global pool", the same statement the authed list reads from.
   */
  async listAllUnordered(): Promise<CategoryRow[]> {
    const categories = await this.find({});
    return categories.map((category) => toRow(category) as CategoryRow);
  }

  /**
   * PL33 (`PlacesService.importKmlPlaces`) — `SELECT id, name FROM
   * categories`, the id/name-only projection the KML importer folds into
   * `buildCategoryNameLookup` to resolve a folder name to a category id. No
   * `ORDER BY` in the legacy statement — none added here.
   */
  async listIdName(): Promise<{ id: number; name: string }[]> {
    return this.qb('c').select(['c.id', 'c.name']).execute<{ id: number; name: string }[]>('all', false);
  }

  /**
   * `SELECT * FROM categories WHERE id = ?` — no owner filter. `user_id`
   * being nullable makes a row *look* ownable, but this legacy statement
   * never scoped by it: any id answers regardless of who created the row.
   * Plain PK `findOne`, not `findOwnedOrGlobal` — that helper had no caller
   * across categories or tags (neither site actually filters "owner or
   * global") and was deleted rather than kept as dead code (Task 0
   * re-review, R6; see `_shared/owned-lookup.ts`'s docstring).
   *
   * `disableIdentityMap: true` by the base class's default (`_shared/
   * trek-repository.ts`, Plan 3b interlude B — supersedes the per-call
   * option this repository used to pass itself, which superseded Plan 3a's
   * I1 "`refresh: true` on every PK-only `findOne`"; see
   * `.superpowers/sdd/2026-09-22-orm-phase3b/task-1-review.md` B1): this is
   * a "rows out" read, converted via `toRow` and discarded — the entity is
   * loaded in a throwaway forked context and never lands in the request's
   * identity map, so a raw write to this row earlier in the same request is
   * always seen, and there is nothing here for a later `flush()` to find
   * dirty.
   */
  async findById(id: number): Promise<CategoryRow | null> {
    const category = await this.findOne({ id });
    return category ? (toRow(category) as CategoryRow) : null;
  }

  /**
   * The column set of the legacy INSERT:
   * `INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)`.
   * The `#6366f1`/`📍` defaulting stays in `CategoriesService` (D4's defaults
   * rule) — this writes exactly what it is given.
   *
   * `this.insert` (Plan 3b interlude B, finishing F2's sweep — Task 1
   * fix round's re-review flagged this method as a leftover whole-request-
   * UnitOfWork `flush()`), never `create()` + `persist().flush()`:
   * `flush()` commits the *whole* unit of work of the request's
   * `EntityManager`, not just this row. `insert` fires a single native
   * INSERT with no side effects on the context/identity map, followed by a
   * read-back (`findById`, `disableIdentityMap: true` by the base class's
   * default): the returned row carries the generated `id` and the
   * `defaultRaw` `created_at` the same way a legacy INSERT-then-reselect
   * pair did.
   */
  async createCategory(input: { name: string; color: string; icon: string; user_id: number }): Promise<CategoryRow> {
    const id = await this.insert({
      name: input.name,
      color: input.color,
      icon: input.icon,
      user: input.user_id,
    });
    const inserted = await this.findById(id);
    if (!inserted) {
      throw new Error('createCategory: read-back after insert found no row');
    }
    return inserted;
  }

  /**
   * `UPDATE categories SET name = COALESCE(?, name), color = COALESCE(?,
   * color), icon = COALESCE(?, icon) WHERE id = ?`, re-selected.
   * `nativeUpdate` only writes the keys present on `changes` — the
   * entity-API equivalent of `COALESCE` against a bind parameter — so the
   * caller must omit a field entirely (not pass it as `undefined`) to leave
   * it untouched, which is how `CategoriesService` reproduces the legacy
   * `|| null` coalesce-away-empty-string behaviour. Returns `null` when no
   * row matches `id`, mirroring the legacy re-select's `undefined`.
   *
   * **Converted from `findOne({ refresh: true })` + `assign` + `flush()`
   * to `nativeUpdate` + a typed partial (Plan 3b interlude B, per
   * `task-1-rereview.md`'s ruling on this method: "convert them, don't
   * complete the sweep on the read").** `nativeUpdate` writes the given
   * columns directly, with no ORM change-set diff against an in-memory
   * snapshot — that removes the whole class of staleness the old
   * `refresh: true` lookup existed to guard against (Task 3 review,
   * Important 1: an untouched column reading stale, a patch silently
   * dropped because it happened to match a stale in-memory value, and a
   * patch after `remove()` fabricating a row), not just the one B1 shape
   * the rest of the program's `disableIdentityMap: true` ruling closes. When
   * `changes` is non-empty, `nativeUpdate`'s own affected-row count IS the
   * existence check (0 ⇒ `null`, no separate read); when `changes` is empty
   * (nothing to write), a plain existence read (`disableIdentityMap: true`
   * by the base class's default, like every other read in this repository
   * now) stands in for it. Either way the return value is a fresh
   * `findById` — a genuine rows-out read, not the entity `assign` just
   * mutated in place.
   */
  async patch(id: number, changes: { name?: string; color?: string; icon?: string }): Promise<CategoryRow | null> {
    if (Object.keys(changes).length > 0) {
      const affected = await this.nativeUpdate({ id }, changes);
      if (affected === 0) return null;
    } else {
      const existing = await this.findOne({ id }, { fields: ['id'] });
      if (!existing) return null;
    }
    return this.findById(id);
  }

  /** `DELETE FROM categories WHERE id = ?`. Returns the affected row count. */
  async remove(id: number): Promise<number> {
    return this.nativeDelete({ id });
  }
}
