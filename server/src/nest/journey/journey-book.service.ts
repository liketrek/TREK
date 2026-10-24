import { JourneyBookRevisions } from '../../db/entities/JourneyBookRevisions.entity';
import { JourneyBooks } from '../../db/entities/JourneyBooks.entity';
import type { JourneyBookRevisionsRepository } from '../../db/repositories/JourneyBookRevisions.repository';
import type { JourneyBookRow, JourneyBooksRepository } from '../../db/repositories/JourneyBooks.repository';
import { DomainError } from '../common/domain-error';
import { UnitOfWork } from '../database/unit-of-work';
import { JourneyDomainService } from './journey-domain.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { BookDocument, BookRecord, BookSummary } from '@trek/shared';
import {
  BOOK_DESIGN_LIMITS,
  BOOK_SCHEMA_NEWER_CODE,
  BOOK_SCHEMA_REV,
  bookSchemaRev,
  normalizeBookDocument,
  stampBookSchemaRev,
} from '@trek/shared';

/**
 * What an edit of the book hands back to `editBook`: the record's title and
 * the whole new document, plus whatever the caller wants returned beside the
 * saved record. `unchanged` says the edit left the stored book as it is (a
 * page moved to where it already was): nothing is written or announced then.
 */
interface BookEdit<T> {
  title: string;
  document: BookDocument;
  result: T;
  unchanged?: boolean;
}

/** Where a write came from: REST names the requesting tab, an MCP or assistant write none. */
interface BookWriteOrigin {
  socketId?: string;
}

/**
 * How `editBook` writes: only while the book is at `expectedVersion`, and with
 * `keepRevision` keeping the book as it stood in `journey_book_revisions`
 * inside the same transaction (a whole-book design's undo).
 */
interface BookEditOptions extends BookWriteOrigin {
  expectedVersion?: number;
  keepRevision?: boolean;
}

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
 *
 * ── Format revisions ─────────────────────────────────────────────────────
 *
 * A book says which revision of the format wrote it (book-schema-rev.ts in
 * @trek/shared). A save from a writer older than the stored book is refused,
 * because that writer has already dropped whatever it could not read; so is
 * one newer than this server, which would drop the same on the way in. The
 * book tools write only books this server reads whole, and stamp what they
 * write with its revision.
 */
@Injectable()
export class JourneyBookService {
  constructor(
    private readonly journey: JourneyDomainService,
    @InjectRepository(JourneyBooks) private readonly booksRepo: JourneyBooksRepository,
    // M1 (task-5-review.md) — `saveBook`'s first-save read-then-insert
    // needs the connection mutex to serialize two concurrent first saves.
    private readonly uow: UnitOfWork,
    // The books a whole-book design replaced, kept in the transaction that replaces them (editBook).
    @InjectRepository(JourneyBookRevisions) private readonly revisionsRepo: JourneyBookRevisionsRepository,
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
   *
   * A save that lands is announced once the transaction has committed, never
   * from inside it and never for a conflict: nothing was written then.
   */
  async saveBook(
    journeyId: number,
    userId: number,
    input: { title: string; document: unknown; baseVersion?: number },
    origin: BookWriteOrigin = {},
  ): Promise<{ record: BookRecord } | { conflict: BookRecord } | null> {
    if (!(await this.canWrite(journeyId, userId))) return null;
    const outcome = await this.storeSave(journeyId, userId, input);
    if ('record' in outcome) await this.broadcastSaved(journeyId, userId, outcome.record, origin.socketId);
    return outcome;
  }

  private async storeSave(
    journeyId: number,
    userId: number,
    input: { title: string; document: unknown; baseVersion?: number },
  ): Promise<{ record: BookRecord } | { conflict: BookRecord }> {
    refuseNewerThanServer(bookSchemaRev(input.document));
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

      // An older writer has already lost what it could not read; it does not get to save that loss.
      const stored = storedSchemaRev(existing.document);
      if (stored > bookSchemaRev(input.document)) throw newerBook(stored);

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

  /**
   * Change the book by a pure edit of what is stored now: the book tools' one
   * way to write (journey-book-edit.service.ts).
   *
   * The read, the edit and the conditional update run in one transaction, so
   * the connection mutex serializes them against a REST save: the edit always
   * sees the version it replaces, and no retry loop is needed. `edit` gets the
   * current record (null for a journey without a book, which the update then
   * creates), may read what else it checks against inside the same
   * transaction, and may throw a refusal; a throw rolls back before anything
   * is written, and nobody is told anything. `expectedVersion` is the undo's
   * guard: the book must still be at that version, else 409 and nothing moves.
   * An edit that answers `unchanged` for a stored book writes nothing, bumps
   * no version and sends nothing.
   *
   * The event goes out after the commit. A write that names no socket (MCP,
   * the assistant) reaches every tab of every member, the asking one too, so
   * the Studio a person has open shows what the assistant did.
   *
   * With `keepRevision` the stored book is kept as a revision before it is
   * replaced, in the same transaction, and the journey's oldest revisions past
   * the newest few go; `revisionId` names it (null without a stored book).
   */
  async editBook<T>(
    journeyId: number,
    userId: number,
    edit: (current: BookRecord | null) => BookEdit<T> | Promise<BookEdit<T>>,
    options: BookEditOptions = {},
  ): Promise<{ record: BookRecord; result: T; revisionId: number | null }> {
    await this.requireEditor(journeyId, userId);
    const done = await this.uow.transactional(async () => {
      const row = await this.booksRepo.findFirstForJourney(journeyId);
      const current = row ? this.toRecord(row) : null;
      if (options.expectedVersion !== undefined && current?.version !== options.expectedVersion) {
        throw bookMoved(current);
      }
      // `current` is the book as this server reads it, which for a newer book is the book minus what it dropped.
      if (row) refuseNewerThanServer(storedSchemaRev(row.document));
      const next = await edit(current);
      // What the edit hands back is checked too: a kept revision from a newer server, put back after a downgrade, would land stripped yet still stamped newer.
      refuseNewerThanServer(bookSchemaRev(next.document));
      if (current && next.unchanged) {
        return { record: current, result: next.result, wrote: false, revisionId: null };
      }
      const document = JSON.stringify(normalizeBookDocument(stampBookSchemaRev(next.document)));
      if (!row) {
        const id = await this.booksRepo.insertBook(journeyId, next.title, document, userId);
        return { record: await this.written(id), result: next.result, wrote: true, revisionId: null };
      }
      let revisionId: number | null = null;
      if (options.keepRevision) {
        revisionId = await this.revisionsRepo.insertRevision(journeyId, row.version, row.document);
        await this.revisionsRepo.pruneRevisions(journeyId, BOOK_DESIGN_LIMITS.revisions);
      }
      const changes = await this.booksRepo.casUpdate(row.id, row.version, {
        title: next.title,
        document,
        updatedBy: userId,
      });
      if (changes === 0) throw bookMoved(await this.byId(row.id));
      return { record: await this.written(row.id), result: next.result, wrote: true, revisionId };
    });
    if (done.wrote) await this.broadcastSaved(journeyId, userId, done.record, options.socketId);
    return { record: done.record, result: done.result, revisionId: done.revisionId };
  }

  /** 404 for someone who cannot see the journey (no existence oracle), 403 for a viewer. */
  private async requireEditor(journeyId: number, userId: number): Promise<void> {
    if (await this.canWrite(journeyId, userId)) return;
    if (await this.canAccess(journeyId, userId)) {
      throw new DomainError(403, 'Not allowed', {
        code: 'book_read_only',
        mcpMessage: "You can read this journey's book but not change it: only its owner and editors can.",
      });
    }
    throw new DomainError(404, 'Journey not found', { mcpMessage: 'Journey not found or access denied.' });
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
   * A REST save excludes the saving tab by socket id, the same way every other
   * TREK mutation does it, so the client that just saved does not process its
   * own change. An MCP or assistant write has no socket, so every tab hears it.
   */
  private async broadcastSaved(journeyId: number, userId: number, record: BookRecord, socketId?: string) {
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

  /** The row a write just made or changed, read back inside the same transaction, so it is there. */
  private async written(id: number): Promise<BookRecord> {
    const record = await this.byId(id);
    if (!record) throw new Error(`Book ${id} is gone inside the transaction that wrote it`);
    return record;
  }
}

/**
 * The book is not at the version a write was made against. The record rides
 * along for REST like the save route's conflict; a tool answers the sentence.
 */
function bookMoved(current: BookRecord | null): DomainError {
  return new DomainError(409, 'Book was changed by someone else', {
    code: 'book_conflict',
    details: { current },
    mcpMessage: 'The book was changed since that version. Read it again with get_book before changing it.',
  });
}

/**
 * The book was written by a newer revision of the format than the writer (or
 * this server) knows. 409 like a moved book, with the code the Studio reads to
 * open the book read-only and ask for a reload; no `current`, because there is
 * nothing here an older writer could safely take.
 */
function newerBook(schemaRev: number): DomainError {
  return new DomainError(409, 'Book was saved by a newer version of TREK Studio', {
    code: BOOK_SCHEMA_NEWER_CODE,
    details: { code: BOOK_SCHEMA_NEWER_CODE, schemaRev },
    mcpMessage:
      'This book was saved by a newer version of TREK than this server runs. Changing it here would drop what that version added, so it stays as it is.',
  });
}

/** Refuse a book written by a revision this server cannot read whole. */
function refuseNewerThanServer(schemaRev: number): void {
  if (schemaRev > BOOK_SCHEMA_REV) throw newerBook(schemaRev);
}

/** The revision a stored row's document says it was written by; broken JSON reads as 1, like its document. */
function storedSchemaRev(raw: string): number {
  return bookSchemaRev(safeParse(raw));
}

/** JSON that will not parse is an empty document, never an exception. */
function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
