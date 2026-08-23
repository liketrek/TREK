import { Injectable } from '@nestjs/common';
import type { BookRecord, BookSummary } from '@trek/shared';
import { normalizeBookDocument } from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { JourneyDomainService } from './journey-domain.service';

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
    private readonly db: DatabaseService,
    private readonly journey: JourneyDomainService,
  ) {}

  /** Null when the journey does not exist or the user cannot reach it. */
  private canAccess(journeyId: number, userId: number): boolean {
    return !!this.journey.canAccessJourney(journeyId, userId);
  }

  /**
   * Writing the book is an edit like any other in this domain, so it takes the
   * same owner-or-editor check the entry and photo writes take. canAccess also
   * covers role 'viewer', who may read the book but must not overwrite it.
   */
  private canWrite(journeyId: number, userId: number): boolean {
    return this.journey.canEdit(journeyId, userId);
  }

  /**
   * Whether this user may open the journey's book at all.
   *
   * Public so the controller can tell "no book yet" from "no journey" without
   * running a query built for something else.
   */
  canOpen(journeyId: number, userId: number): boolean {
    return this.canAccess(journeyId, userId);
  }

  private toRecord(row: BookRow): BookRecord {
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

  listBooks(journeyId: number, userId: number): BookSummary[] | null {
    if (!this.canAccess(journeyId, userId)) return null;
    const rows = this.db
      .prepare(`
        SELECT id, journey_id, title, version, updated_at, updated_by
          FROM journey_books
         WHERE journey_id = ?
         ORDER BY updated_at DESC, id DESC
      `)
      .all(journeyId) as Omit<BookRow, 'document'>[];
    return rows.map(r => ({
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
  getBook(journeyId: number, userId: number): BookRecord | null {
    if (!this.canAccess(journeyId, userId)) return null;
    const row = this.db
      .prepare(`
        SELECT id, journey_id, title, document, version, updated_at, updated_by
          FROM journey_books
         WHERE journey_id = ?
         ORDER BY id ASC
         LIMIT 1
      `)
      .get(journeyId) as BookRow | undefined;
    return row ? this.toRecord(row) : null;
  }

  /**
   * Create or update, against a version.
   *
   * Returns the saved record, or `{ conflict }` when the base version has
   * moved. Throwing would be the obvious shape and the wrong one: a conflict is
   * an ordinary outcome of two people working, not an exception.
   */
  saveBook(
    journeyId: number,
    userId: number,
    input: { title: string; document: unknown; baseVersion?: number },
  ): { record: BookRecord } | { conflict: BookRecord } | null {
    if (!this.canWrite(journeyId, userId)) return null;

    const document = JSON.stringify(normalizeBookDocument(input.document));
    const existing = this.db
      .prepare('SELECT id, version FROM journey_books WHERE journey_id = ? ORDER BY id ASC LIMIT 1')
      .get(journeyId) as { id: number; version: number } | undefined;

    if (!existing) {
      const result = this.db
        .prepare(`
          INSERT INTO journey_books (journey_id, title, document, version, created_by, updated_by, updated_at)
          VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)
        `)
        .run(journeyId, input.title, document, userId, userId);
      return { record: this.byId(Number(result.lastInsertRowid))! };
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
    const result = this.db
      .prepare(`
        UPDATE journey_books
           SET title = ?, document = ?, version = version + 1,
               updated_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND version = ?
      `)
      .run(input.title, document, userId, existing.id, base);

    if (result.changes === 0) {
      return { conflict: this.byId(existing.id)! };
    }
    return { record: this.byId(existing.id)! };
  }

  deleteBook(journeyId: number, userId: number): boolean | null {
    if (!this.canWrite(journeyId, userId)) return null;
    const result = this.db
      .prepare('DELETE FROM journey_books WHERE journey_id = ?')
      .run(journeyId);
    return result.changes > 0;
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
  broadcastSaved(journeyId: number, userId: number, record: BookRecord, socketId?: string) {
    this.journey.broadcastJourneyEvent(
      journeyId,
      'journey:book:saved',
      { version: record.version, savedBy: userId },
      socketId,
    );
  }

  private byId(id: number): BookRecord | null {
    const row = this.db
      .prepare(`
        SELECT id, journey_id, title, document, version, updated_at, updated_by
          FROM journey_books WHERE id = ?
      `)
      .get(id) as BookRow | undefined;
    return row ? this.toRecord(row) : null;
  }
}

interface BookRow {
  id: number;
  journey_id: number;
  title: string;
  document: string;
  version: number;
  updated_at: string | null;
  updated_by: number | null;
}

/** JSON that will not parse is an empty document, never an exception. */
function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
