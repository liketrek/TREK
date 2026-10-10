import type { IdempotencyKeys } from '../entities/IdempotencyKeys.entity';
import { TrekRepository } from './_shared/trek-repository';

/** The cached response `idempotency.interceptor.ts#lookup`/`#replay` need. */
export interface IdempotencyResponseRow {
  status_code: number;
  response_body: string;
}

/**
 * `idempotency_keys` (Plan 4 Task 1). The composite primary key
 * (`key`, `user`, `method`, `path` — `IdempotencyKeys.entity.ts`'s own
 * `PrimaryKeyProp`) is exactly the scope the interceptor's replay lookup and
 * its `INSERT OR IGNORE` write both key on.
 */
export class IdempotencyKeysRepository extends TrekRepository<IdempotencyKeys> {
  /**
   * `idempotency.interceptor.ts#lookup` — `SELECT status_code,
   * response_body FROM idempotency_keys WHERE key = ? AND user_id = ? AND
   * method = ? AND path = ?`.
   */
  async findResponse(
    key: string,
    userId: number,
    method: string,
    path: string,
  ): Promise<IdempotencyResponseRow | null> {
    const row = await this.findOne({ key, user: userId, method, path }, { fields: ['status_code', 'response_body'] });
    return row ? { status_code: row.status_code, response_body: row.response_body } : null;
  }

  /**
   * `idempotency.interceptor.ts#run`'s `res.json` capture — `INSERT OR
   * IGNORE INTO idempotency_keys (key, user_id, method, path, status_code,
   * response_body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`. `created_at`
   * is bound explicitly by the caller (the interceptor's own
   * `Math.floor(Date.now() / 1000)`), never left to the column's own
   * `defaultRaw` — the legacy statement always named the column, so this
   * method always writes it too. `em.upsert` with `onConflictAction:
   * 'ignore'` on the table's own composite primary key (rule 4's `INSERT OR
   * IGNORE` → `em.upsert` mapping, `TripMembersRepository
   * .addIgnoringConflict`'s precedent): two overlapping in-flight requests
   * racing to store the SAME key must leave whichever one won untouched,
   * never overwritten by the loser.
   */
  async insertIfAbsent(input: {
    key: string;
    user_id: number;
    method: string;
    path: string;
    status_code: number;
    response_body: string;
    created_at: number;
  }): Promise<void> {
    await this.upsert(
      {
        key: input.key,
        user: input.user_id,
        method: input.method,
        path: input.path,
        status_code: input.status_code,
        response_body: input.response_body,
        created_at: input.created_at,
      },
      { onConflictFields: ['key', 'user', 'method', 'path'], onConflictAction: 'ignore' },
    );
  }

  /**
   * `idempotency-cleanup.ts#purgeExpiredIdempotencyKeys` — `DELETE FROM
   * idempotency_keys WHERE created_at < ?`. Returns the row count, matching
   * the legacy `result.changes`.
   */
  async deleteExpired(cutoff: number): Promise<number> {
    return this.nativeDelete({ created_at: { $lt: cutoff } });
  }
}
