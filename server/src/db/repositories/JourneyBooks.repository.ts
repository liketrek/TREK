import { columnIncrementedBy, currentTimestamp } from '../dialect/sql-functions';
import type { JourneyBooks } from '../entities/JourneyBooks.entity';
import { TrekRepository } from './_shared/trek-repository';

/** JB1's list-view row — `listBooks`, no `document`. */
export interface JourneyBookSummaryRow {
  id: number;
  journey_id: number;
  title: string;
  version: number;
  updated_at: string | null;
  updated_by: number | null;
}

/** JB2/JB3/JB7's full-row shape (adds `document`). */
export interface JourneyBookRow extends JourneyBookSummaryRow {
  document: string;
}

/**
 * `journey_books` — TREK Studio books (Plan 3g Task 3, R2). JB5's save is
 * the one place in this whole plan where "convert the statement" and
 * "preserve the exact control-flow contract" are the same instruction: it
 * stays ONE conditional `nativeUpdate` returning the affected-row count,
 * never a MikroORM `@OptimisticLock`/version-decorated entity path — the
 * service branches on `changes === 0` and re-reads for the `{conflict}`
 * response, exactly as today.
 */
export class JourneyBooksRepository extends TrekRepository<JourneyBooks> {
  /** JB1 — `listBooks`: `SELECT id, journey_id, title, version, updated_at, updated_by FROM journey_books WHERE journey_id=? ORDER BY updated_at DESC, id DESC`. */
  async listForJourney(journeyId: number): Promise<JourneyBookSummaryRow[]> {
    return await this.qb('jb')
      .select(['jb.id', 'jb.journey', 'jb.title', 'jb.version', 'jb.updated_at', 'jb.updatedByRef'])
      .where({ journey: journeyId })
      .orderBy({ updated_at: 'desc', id: 'desc' })
      .execute<JourneyBookSummaryRow[]>('all', false);
  }

  /**
   * JB2/JB3 — `getBook`'s full read and `saveBook`'s pre-check share the
   * identical `WHERE journey_id=? ORDER BY id ASC LIMIT 1`, differing only
   * in column list (JB3 reads just `id`/`version`); this returns JB2's wider
   * shape and `saveBook` reads the two fields it needs off it, rather than
   * hand-duplicating a second near-identical statement (see
   * task-3-report.md).
   */
  async findFirstForJourney(journeyId: number): Promise<JourneyBookRow | undefined> {
    return await this.qb('jb')
      .select(['jb.id', 'jb.journey', 'jb.title', 'jb.document', 'jb.version', 'jb.updated_at', 'jb.updatedByRef'])
      .where({ journey: journeyId })
      .orderBy({ id: 'asc' })
      .limit(1)
      .execute<JourneyBookRow | undefined>('get', false);
  }

  /** JB7 — `byId` (called from JB4's insert result and JB5's success/conflict paths): `SELECT id, journey_id, title, document, version, updated_at, updated_by FROM journey_books WHERE id=?`. */
  async findById(id: number): Promise<JourneyBookRow | undefined> {
    return await this.qb('jb')
      .select(['jb.id', 'jb.journey', 'jb.title', 'jb.document', 'jb.version', 'jb.updated_at', 'jb.updatedByRef'])
      .where({ id })
      .execute<JourneyBookRow | undefined>('get', false);
  }

  /** JB4 — `saveBook`'s first write (no existing row): `INSERT INTO journey_books (journey_id, title, document, version, created_by, updated_by, updated_at) VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)`. */
  async insertBook(journeyId: number, title: string, document: string, userId: number): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return await this.insert({
      journey: journeyId,
      title,
      document,
      version: 1,
      createdByRef: userId,
      updatedByRef: userId,
      updated_at: currentTimestamp(platform),
    });
  }

  /**
   * JB5 (R2) — the optimistic-concurrency save: `UPDATE journey_books SET
   * title=?, document=?, version=version+1, updated_by=?,
   * updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=?`, ONE conditional
   * statement (the version check stays IN the WHERE clause, never a
   * read-then-compare), returning the affected-row count. `changes === 0`
   * means a conflict — the service re-reads via {@link findById} for the
   * `{conflict}` response, it does not throw.
   */
  async casUpdate(
    id: number,
    baseVersion: number,
    data: { title: string; document: string; updatedBy: number },
  ): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    return await this.nativeUpdate(
      { id, version: baseVersion },
      {
        title: data.title,
        document: data.document,
        version: columnIncrementedBy(platform, 'version', 1),
        updatedByRef: data.updatedBy,
        updated_at: currentTimestamp(platform),
      },
    );
  }

  /** JB6 — `deleteBook`: `DELETE FROM journey_books WHERE journey_id=?`, returning the affected-row count so the service can report whether anything was removed. */
  async deleteByJourneyId(journeyId: number): Promise<number> {
    return await this.nativeDelete({ journey: journeyId });
  }
}
