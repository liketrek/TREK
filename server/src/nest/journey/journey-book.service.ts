import { JourneyBooks } from '../../db/entities/JourneyBooks.entity';
import type { JourneyBookRow, JourneyBooksRepository } from '../../db/repositories/JourneyBooks.repository';
import { UnitOfWork } from '../database/unit-of-work';
import { JourneyDomainService } from './journey-domain.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { BookRecord, BookSummary } from '@trek/shared';
import { normalizeBookDocument } from '@trek/shared';

/**
 * Storing TREK Studio books.
 *
 * ── Access ───────────────────────────────────────────────────────────────
 *
 * A book belongs to its journey, so it inherits the journey's access exactly:
 * every contributor can open it, and the ones who may edit the journey may edit
 * it. There is no separate book permission and there should not be: a second
 * access model over the same object is how two rules end up disagreeing about
 * who may do what.
 *
 * ── Concurrency ──────────────────────────────────────────────────────────
 *
 * Optimistic, on a version column. Every save states the version it was made
 * against; the update only lands if that is still the current one, and the
 * whole thing is one statement so two saves arriving together cannot both
 * decide they are first. The loser is told, and told *with* the current record,
 * so it can show the other version rather than only announcing one exists.
 *
 * The alternative — last write wins — is not a simpler version of this. It is
 * the same thing with the failure moved somewhere nobody sees it.
 */
@Injectable()
export class JourneyBookService {
  constructor(
    private readonly journey: JourneyDomainService,
    @InjectRepository(JourneyBooks) private readonly booksRepo: JourneyBooksRepository,
    // M1 (task-5-review.md) — `saveBook`'s first-save read-then-insert
    // needs the connection mutex to serialize two concurrent first saves.
    private readonly uow: UnitOfWork,
  ) {}

  /** Null when the journey does not exist or the user cannot reach it. */
  private async canAccess(journeyId: number, userId: number): Promise<boolean> {
    return !!(await this.journey.canAccessJourney(journeyId, userId));
  }

  /**
   * Writing the book is an edit like any other in this domain, so it takes the
   * same owner-or-editor check the entry and photo writes take. canAccess also
   * covers role 'viewer', who may read the book but must not overwrite it.
   */
  private async canWrite(journeyId: number, userId: number): Promise<boolean> {
    return this.journey.canEdit(journeyId, userId);
  }

  /**
   * Whether this user may open the journey's book at all.
   *
   * Public so the controller can tell "no book yet" from "no journey" without
   * running a query built for something else.
   */
  async canOpen(journeyId: number, userId: number): Promise<boolean> {
    return this.canAccess(journeyId, userId);
  }

  private toRecord(row: JourneyBookRow): BookRecord {
    return {
      id: row.id,
      journeyId: row.journey_id,
      title: row.title,
      version: row.version,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      // Never thrown at the caller: a document that cannot be parsed still has
      // to open, or a single drifted field would lock someone out of their own
      // book. normalizeBookDocument drops what it cannot read.
      document: normalizeBookDocument(safeParse(row.document)),
    };
  }

  async listBooks(journeyId: number, userId: number): Promise<BookSummary[] | null> {
    if (!(await this.canAccess(journeyId, userId))) return null;
    // JB1.
    const rows = await this.booksRepo.listForJourney(journeyId);
    return rows.map((r) => ({
      id: r.id,
      journeyId: r.journey_id,
      title: r.title,
      version: r.version,
      updatedAt: r.updated_at,
      updatedBy: r.updated_by,
    }));
  }

  /**
   * The journey's book.
   *
   * One per journey for now — the table allows more, because a second book of
   * the same trip is an obvious thing to want and adding a column later is
   * harder than not needing to.
   */
  async getBook(journeyId: number, userId: number): Promise<BookRecord | null> {
    if (!(await this.canAccess(journeyId, userId))) return null;
    // JB2.
    const row = await this.booksRepo.findFirstForJourney(journeyId);
    return row ? this.toRecord(row) : null;
  }

  /**
   * Create or update, against a version.
   *
   * Returns the saved record, or `{ conflict }` when the base version has
   * moved. Throwing would be the obvious shape and the wrong one: a conflict is
   * an ordinary outcome of two people working, not an exception.
   */
  async saveBook(
    journeyId: number,
    userId: number,
    input: { title: string; document: unknown; baseVersion?: number },
  ): Promise<{ record: BookRecord } | { conflict: BookRecord } | null> {
    if (!(await this.canWrite(journeyId, userId))) return null;

    const document = JSON.stringify(normalizeBookDocument(input.document));

    // M1 (rule 11/24) — JB3's existing-link read and JB4's insert are
    // separate awaits, so two concurrent first saves of the same journey's
    // book could both read "no book yet" and both insert, leaving one
    // editor's save silently orphaned behind `getBook`'s `ORDER BY id LIMIT
    // 1` (there is no unique index on `journey_id`). Wrapped whole: every
    // statement below is DB-only, and the mutex serializes a second
    // caller's read behind the first's commit, so it finds the row the
    // first just created and takes the JB5 CAS-update path instead, the
    // same outcome the synchronous legacy code always had.
    return this.uow.transactional(async () => {
      // JB3.
      const existing = await this.booksRepo.findFirstForJourney(journeyId);

      if (!existing) {
        // JB4.
        const id = await this.booksRepo.insertBook(journeyId, input.title, document, userId);
        return { record: (await this.byId(id))! };
      }

      /*
       * The version goes in the WHERE clause rather than being checked first.
       * Read-then-write leaves a window between the two in which another save can
       * land, and SQLite gives no guarantee across two statements — one UPDATE
       * that matches on the version cannot lose that race with itself.
       *
       * A save with no base version is a first write from a client that has not
       * loaded one; it is allowed to take the current version, since refusing it
       * would break "open Studio and start editing" for the second person to
       * arrive.
       */
      const base = input.baseVersion ?? existing.version;
      // JB5 (R2) — one conditional UPDATE, returning the affected-row count.
      const changes = await this.booksRepo.casUpdate(existing.id, base, {
        title: input.title,
        document,
        updatedBy: userId,
      });

      if (changes === 0) {
        return { conflict: (await this.byId(existing.id))! };
      }
      return { record: (await this.byId(existing.id))! };
    });
  }

  async deleteBook(journeyId: number, userId: number): Promise<boolean | null> {
    if (!(await this.canWrite(journeyId, userId))) return null;
    // JB6.
    const changes = await this.booksRepo.deleteByJourneyId(journeyId);
    return changes > 0;
  }

  /**
   * Tell the other editors the book moved on.
   *
   * The version travels, not the document. Everyone with it open needs to know
   * theirs is behind — one integer — and can ask for the rest if they want it.
   * Broadcasting a few hundred kilobytes of JSON on every autosave would make
   * the notification the size of the thing being edited.
   *
   * The saver is excluded by socket id, the same way every other TREK mutation
   * does it, so the client that just saved does not process its own change.
   */
  async broadcastSaved(journeyId: number, userId: number, record: BookRecord, socketId?: string) {
    await this.journey.broadcastJourneyEvent(
      journeyId,
      'journey:book:saved',
      { version: record.version, savedBy: userId },
      socketId,
    );
  }

  /** JB7. */
  private async byId(id: number): Promise<BookRecord | null> {
    const row = await this.booksRepo.findById(id);
    return row ? this.toRecord(row) : null;
  }
}

/** JSON that will not parse is an empty document, never an exception. */
function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
