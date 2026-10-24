import { Categories } from '../../db/entities/Categories.entity';
import type { CategoriesRepository } from '../../db/repositories/Categories.repository';
import { toRowId } from '../common/row-id';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { Category } from '@trek/shared';

/**
 * Categories domain service — owns the category business rules (moved off
 * `DatabaseService`/raw SQL onto `CategoriesRepository`, Plan 3a Task 3): the
 * `#6366f1`/`📍` defaults and the COALESCE-via-`assign` update semantics stay
 * here, exactly as they did over raw SQL, while the SQL itself lives in the
 * repository. All consumers are in-container — the plugin RPC surface
 * injects this class into CategoriesRpc.
 */
@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Categories) private readonly categories: CategoriesRepository) {}

  // `CategoryRow`'s `color`/`icon`/`created_at` are nullable (the DB columns
  // carry no NOT NULL constraint); the `@trek/shared` `Category` contract
  // narrows them to non-nullable/optional. The legacy code trusted the same
  // gap unchecked (`this.db.all<Category>(...)`'s generic parameter is not a
  // runtime check either) — these casts keep that same trust boundary at the
  // service layer instead of inside a raw-SQL call.
  async list(): Promise<Category[]> {
    return (await this.categories.list()) as unknown as Category[];
  }

  async getById(id: string | number): Promise<Category | undefined> {
    // Convert, VALIDATE, and answer the legacy not-found before any
    // repository call (program rule 15): the legacy raw-SQL statement bound
    // `id` straight into `WHERE id = ?` and let SQLite's affinity rules miss
    // on a non-numeric string, returning `undefined`; a typed repository
    // filter has no such leniency — a bare `Number()` renders `NaN` as an
    // unquoted column reference and 500s (Plan 3b Task 2 review, F1's class
    // of bug, same fix applied here per the fix round's item 1b).
    const rowId = toRowId(id);
    if (rowId === null) return undefined;
    const category = await this.categories.findById(rowId);
    return (category as unknown as Category | null) ?? undefined;
  }

  async create(userId: number, name: string, color?: string, icon?: string): Promise<Category> {
    const category = await this.categories.createCategory({
      name,
      color: color || '#6366f1',
      icon: icon || '📍',
      user_id: userId,
    });
    return category as unknown as Category;
  }

  async update(id: string | number, name?: string, color?: string, icon?: string): Promise<Category> {
    // `|| null` fed a `COALESCE(?, col)` bind parameter in the legacy
    // statement, so any falsy value (undefined or an empty string) meant
    // "keep the existing column" — reproduced here by omitting the key from
    // `changes` entirely, which is what `CategoriesRepository.patch`'s
    // `assign` needs to leave that column untouched.
    const changes: { name?: string; color?: string; icon?: string } = {};
    if (name) changes.name = name;
    if (color) changes.color = color;
    if (icon) changes.icon = icon;
    // Every caller pre-checks with `getById` (a 404 for both a missing row
    // and a non-numeric id) first, so this path only runs for an id already
    // known valid — but a non-numeric id here still must not reach the
    // repository as `NaN` (F1's class of bug): the legacy `UPDATE ... WHERE
    // id = ?` bound the raw string, matched nothing via SQLite's affinity
    // rules, and the re-select likewise returned `undefined`. `toRowId`
    // reproduces that exact no-op for the race-condition path the pre-check
    // doesn't cover, and `patch` returns `null` for a non-existent numeric
    // id (Task 3 review, Minor 2) — both fold into the same `?? undefined`
    // parity the legacy re-select had.
    const rowId = toRowId(id);
    if (rowId === null) return undefined as unknown as Category;
    return ((await this.categories.patch(rowId, changes)) ?? undefined) as unknown as Category;
  }

  async remove(id: string | number): Promise<void> {
    // Same guard: a non-numeric id must no-op (matching the legacy `DELETE
    // ... WHERE id = ?` binding a string that never matched any row) rather
    // than reach the repository as `NaN`.
    const rowId = toRowId(id);
    if (rowId === null) return;
    await this.categories.remove(rowId);
  }
}
