import type { JourneyBookRevisions } from '../entities/JourneyBookRevisions.entity';
import type { DB } from '../kysely/db';
import { dbNow } from '../types';
import { TrekRepository } from './_shared/trek-repository';

type RevisionsDB = Pick<DB, 'journey_book_revisions'>;

/** A book as a whole-book change found it, kept so the change can be taken back. */
interface JourneyBookRevisionRow {
  id: number;
  journey_id: number;
  version: number;
  document: string;
  created_at: string;
}

/**
 * `journey_book_revisions`: the book documents an `apply_book_design`
 * replaced, written in the transaction of that apply and read back by
 * `restore_book_revision`. A journey keeps its newest few; the rest go when
 * the next one is kept.
 */
export class JourneyBookRevisionsRepository extends TrekRepository<JourneyBookRevisions> {
  private db() {
    return this.kysely<RevisionsDB>();
  }

  /** Keeps the book as it stood at `version`; answers the revision's id. */
  async insertRevision(journeyId: number, version: number, document: string): Promise<number> {
    const row = await this.db()
      .insertInto('journey_book_revisions')
      .values({ journey_id: journeyId, version, document, created_at: dbNow() })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }

  /** Drops the journey's revisions past its newest `keep`; answers how many went. */
  async pruneRevisions(journeyId: number, keep: number): Promise<number> {
    const newest = this.db()
      .selectFrom('journey_book_revisions')
      .select('id')
      .where('journey_id', '=', journeyId)
      .orderBy('id', 'desc')
      .limit(keep);
    const result = await this.db()
      .deleteFrom('journey_book_revisions')
      .where('journey_id', '=', journeyId)
      .where('id', 'not in', newest)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /** One revision of this journey's book; undefined for another journey's or one that is gone. */
  async findForJourney(id: number, journeyId: number): Promise<JourneyBookRevisionRow | undefined> {
    return await this.db()
      .selectFrom('journey_book_revisions')
      .select(['id', 'journey_id', 'version', 'document', 'created_at'])
      .where('id', '=', id)
      .where('journey_id', '=', journeyId)
      .executeTakeFirst();
  }
}
