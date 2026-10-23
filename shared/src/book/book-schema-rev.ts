import { normalizeBookDocument } from './book-normalize';
import type { BookDocument } from './book.schema';

/**
 * Which revision of the book format a document was written by, and what a
 * reader does with one that is newer than it knows.
 *
 * ── Why a revision beside `version` ──────────────────────────────────────
 *
 * `version` is the format itself and stays 1: every document ever saved
 * reads under it, and nothing here asks for a migration. What grows is the
 * vocabulary inside it, a new element kind, a new font, a new field the
 * renderer draws, and an older reader cannot tell any of those from noise.
 * `normalizeBookDocument` drops an element it cannot read and the contract
 * strips a field it does not know, both on purpose, so a damaged book still
 * opens. Saving what is left is the part that must not happen: an old tab, an
 * offline copy or a replayed request would write the loss down for everyone.
 *
 * So the document says which revision wrote it. A reader that meets a newer
 * one opens it read-only and asks for a reload, and the server refuses a save
 * from a writer older than the book it would replace.
 *
 * ── When to bump ─────────────────────────────────────────────────────────
 *
 * `BOOK_SCHEMA_REV` goes up by one in the change that adds an element kind,
 * an enum value or a drawn field to book.schema.ts, never for a change an
 * older reader survives whole. A writer stamps its own revision on what it
 * saves only once that is above 1, so a book saved today stores exactly what
 * it stored before this existed.
 */
export const BOOK_SCHEMA_REV = 1;

/** The `code` a refused save carries in its body when the stored book is newer than the writer. */
export const BOOK_SCHEMA_NEWER_CODE = 'book_schema_newer';

/**
 * The revision a document says it was written by, read from the raw value
 * rather than the parsed one: a document so new that it fails to parse whole
 * still says how new it is. Anything that is not a whole number from 1 up,
 * and every document from before the field, reads as 1.
 */
export function bookSchemaRev(raw: unknown): number {
  if (!raw || typeof raw !== 'object') return 1;
  const rev = (raw as { schemaRev?: unknown }).schemaRev;
  return typeof rev === 'number' && Number.isInteger(rev) && rev >= 1 ? rev : 1;
}

/** Whether a document was written by a newer revision than `readerRev` (this build's by default). */
export function isBookNewerThanReader(raw: unknown, readerRev: number = BOOK_SCHEMA_REV): boolean {
  return bookSchemaRev(raw) > readerRev;
}

/**
 * The document as a writer of `writerRev` saves it: stamped with that
 * revision, unless it already says as much or more. A document at revision 1
 * is handed back as it is, so nothing changes on disk until the first bump.
 */
export function stampBookSchemaRev<T extends BookDocument>(doc: T, writerRev: number = BOOK_SCHEMA_REV): T {
  return bookSchemaRev(doc) >= writerRev ? doc : { ...doc, schemaRev: writerRev };
}

/** A stored document as a reader holds it: normalised, and whether it was written by a newer revision. */
export interface BookRead {
  document: BookDocument;
  /** True when the document is newer than the reader: show it, never save it. */
  newer: boolean;
}

/**
 * Read a stored document the way normalizeBookDocument does, and say whether
 * it is newer than this reader. The normalised copy of a newer book has lost
 * what this build cannot read, which is why `newer` has to travel with it.
 */
export function readBookDocument(raw: unknown, readerRev: number = BOOK_SCHEMA_REV): BookRead {
  return { document: normalizeBookDocument(raw), newer: isBookNewerThanReader(raw, readerRev) };
}
