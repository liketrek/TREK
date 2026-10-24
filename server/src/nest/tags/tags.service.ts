import { Tags } from '../../db/entities/Tags.entity';
import type { TagsRepository } from '../../db/repositories/Tags.repository';
import { toRowId } from '../common/row-id';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { Tag } from '@trek/shared';

/**
 * Tags domain service — owns the tag business rules (moved off
 * `DatabaseService`/raw SQL onto `TagsRepository`, Plan 3a Task 3): the
 * `#10b981` default and the COALESCE-via-`assign` update semantics stay
 * here, exactly as they did over raw SQL, while the SQL itself lives in the
 * repository. All consumers are in-container — the plugin RPC surface
 * injects this class into TagsRpc.
 */
@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tags) private readonly tags: TagsRepository) {}

  // `TagRow`'s `color`/`created_at` are nullable (the DB columns carry no NOT
  // NULL constraint); the `@trek/shared` `Tag` contract narrows them to
  // non-nullable/optional. The legacy code trusted the same gap unchecked
  // (`this.db.all<Tag>(...)`'s generic parameter is not a runtime check
  // either) — these casts keep that same trust boundary at the service layer
  // instead of inside a raw-SQL call.
  async list(userId: number): Promise<Tag[]> {
    return (await this.tags.listByUser(userId)) as unknown as Tag[];
  }

  async getByIdAndUser(id: string | number, userId: number): Promise<Tag | undefined> {
    // Convert, VALIDATE, and answer the legacy not-found before any
    // repository call (program rule 15): the legacy raw-SQL statement bound
    // `id` straight into `WHERE id = ? AND user_id = ?` and let SQLite's
    // affinity rules miss on a non-numeric string, returning `undefined`; a
    // typed repository filter has no such leniency — a bare `Number()`
    // renders `NaN` as an unquoted column reference and 500s (Plan 3b Task 2
    // review, F1's class of bug, same fix applied here per the fix round's
    // item 1b).
    const rowId = toRowId(id);
    if (rowId === null) return undefined;
    const tag = await this.tags.findByIdAndUser(rowId, userId);
    return (tag as unknown as Tag | null) ?? undefined;
  }

  async create(userId: number, name: string, color?: string): Promise<Tag> {
    const tag = await this.tags.createTag({
      user_id: userId,
      name,
      color: color || '#10b981',
    });
    return tag as unknown as Tag;
  }

  async update(id: string | number, name?: string, color?: string): Promise<Tag> {
    // `|| null` fed a `COALESCE(?, col)` bind parameter in the legacy
    // statement, so any falsy value (undefined or an empty string) meant
    // "keep the existing column" — reproduced here by omitting the key from
    // `changes` entirely, which is what `TagsRepository.patch`'s `assign`
    // needs to leave that column untouched.
    const changes: { name?: string; color?: string } = {};
    if (name) changes.name = name;
    if (color) changes.color = color;
    // Every caller pre-checks with `getByIdAndUser` (a 404 for both a
    // missing/foreign row and a non-numeric id) first, so this path only
    // runs for an id already known valid — but a non-numeric id here still
    // must not reach the repository as `NaN` (F1's class of bug): the
    // legacy `UPDATE ... WHERE id = ?` bound the raw string, matched
    // nothing via SQLite's affinity rules, and the re-select likewise
    // returned `undefined`. `toRowId` reproduces that exact no-op for the
    // race-condition path the pre-check doesn't cover, and `patch` returns
    // `null` for a non-existent numeric id (Task 3 review, Minor 2) — both
    // fold into the same `?? undefined` parity the legacy re-select had.
    const rowId = toRowId(id);
    if (rowId === null) return undefined as unknown as Tag;
    return ((await this.tags.patch(rowId, changes)) ?? undefined) as unknown as Tag;
  }

  async remove(id: string | number): Promise<void> {
    // Same guard: a non-numeric id must no-op (matching the legacy `DELETE
    // ... WHERE id = ?` binding a string that never matched any row) rather
    // than reach the repository as `NaN`.
    const rowId = toRowId(id);
    if (rowId === null) return;
    await this.tags.remove(rowId);
  }
}
