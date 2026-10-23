import { normalizeBookDocument } from './book-normalize';
import {
  BOOK_SCHEMA_REV,
  bookSchemaRev,
  isBookNewerThanReader,
  readBookDocument,
  stampBookSchemaRev,
} from './book-schema-rev';
import { bookSaveRequestSchema } from './book-store.schema';
import { bookDocumentSchema } from './book.schema';

import { describe, expect, it } from 'vitest';

// BKREV-001 to BKREV-007

/**
 * The reader guard: a document says which revision of the format wrote it, a
 * reader older than that opens it without saving it, and a book saved today
 * stores exactly what it stored before the field existed.
 */

const frame = { x: 12, y: 18, w: 60, h: 40 };

const doc = (over: Record<string, unknown> = {}) => ({
  version: 1,
  title: 'Lisbon',
  page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
  spreads: [
    {
      id: 's1',
      role: 'inner',
      background: null,
      entryId: null,
      elements: [{ id: 't1', kind: 'text', frame, text: 'Alfama' }],
      parked: [],
    },
  ],
  ...over,
});

describe('the revision a document was written by', () => {
  it('BKREV-001: reads 1 for every document from before the field, and for anything that is not a whole number', () => {
    expect(BOOK_SCHEMA_REV).toBe(1);
    expect(bookSchemaRev(doc())).toBe(1);
    expect(bookSchemaRev(null)).toBe(1);
    expect(bookSchemaRev('{"schemaRev":4}')).toBe(1);
    for (const odd of [0, -2, 2.5, '3', Number.NaN, null]) expect(bookSchemaRev(doc({ schemaRev: odd }))).toBe(1);
    expect(bookSchemaRev(doc({ schemaRev: 3 }))).toBe(3);
  });

  it('BKREV-002: keeps the revision through the contract, and lets a broken one fall back without losing the book', () => {
    expect(bookDocumentSchema.parse(doc({ schemaRev: 2 })).schemaRev).toBe(2);
    const odd = bookDocumentSchema.safeParse(doc({ schemaRev: 'two' }));
    expect(odd.success).toBe(true);
    expect(odd.success && odd.data.schemaRev).toBeUndefined();
    expect(odd.success && odd.data.spreads[0]?.elements).toHaveLength(1);
  });

  it('BKREV-003: leaves a book saved today as it was, with no revision written into it', () => {
    const today = normalizeBookDocument(doc());
    expect('schemaRev' in today).toBe(false);
    expect(stampBookSchemaRev(today)).toBe(today);
    expect(JSON.stringify(stampBookSchemaRev(today))).toBe(JSON.stringify(today));
  });
});

describe('a reader older than the document', () => {
  it('BKREV-004: knows the document is newer than it, read from the raw value even when the rest will not parse', () => {
    expect(isBookNewerThanReader(doc({ schemaRev: 2 }))).toBe(true);
    expect(isBookNewerThanReader(doc({ schemaRev: 1 }))).toBe(false);
    expect(isBookNewerThanReader(doc())).toBe(false);
    // A reader of a later revision reads the same document as its own.
    expect(isBookNewerThanReader(doc({ schemaRev: 2 }), 2)).toBe(false);
    const unreadable = doc({ schemaRev: 5, page: 'not a page' });
    expect(isBookNewerThanReader(unreadable)).toBe(true);
  });

  it('BKREV-005: reads a newer book as far as it can and says so, so nothing it dropped is saved', () => {
    const sticker = { id: 'x1', kind: 'sticker', frame, stickerId: 'lemon' };
    const raw = doc({ schemaRev: 2 });
    const spread = (raw.spreads as { elements: unknown[] }[])[0];
    if (spread) spread.elements.push(sticker);
    const read = readBookDocument(raw);
    expect(read.newer).toBe(true);
    expect(read.document.schemaRev).toBe(2);
    expect(read.document.spreads[0]?.elements.map((e) => e.id)).toEqual(['t1']);
    expect(readBookDocument(doc()).newer).toBe(false);
  });

  it('BKREV-006: a writer stamps its own revision once that is above 1, and never lowers one', () => {
    const today = normalizeBookDocument(doc());
    expect(stampBookSchemaRev(today, 2).schemaRev).toBe(2);
    const later = normalizeBookDocument(doc({ schemaRev: 3 }));
    expect(stampBookSchemaRev(later, 2)).toBe(later);
    expect(stampBookSchemaRev(later, 2).schemaRev).toBe(3);
  });
});

describe('a save request carrying a newer book', () => {
  it('BKREV-007: reaches the server as its revision alone, so the save is refused there rather than at the pipe', () => {
    const sticker = { id: 'x1', kind: 'sticker', frame, stickerId: 'lemon' };
    const raw = doc({ schemaRev: 2 });
    const spread = (raw.spreads as { elements: unknown[] }[])[0];
    if (spread) spread.elements.push(sticker);
    expect(bookSaveRequestSchema.parse({ title: 'T', document: raw }).document).toEqual({ schemaRev: 2 });
    // A book of today still reads whole, revision or none.
    const today = bookSaveRequestSchema.parse({ title: 'T', document: doc() }).document;
    expect(today).toEqual(bookDocumentSchema.parse(doc()));
    expect(bookSaveRequestSchema.parse({ document: doc({ schemaRev: 1 }) }).document).toMatchObject({ schemaRev: 1 });
    expect(bookSaveRequestSchema.safeParse({ document: { schemaRev: 1, spreads: 'no' } }).success).toBe(false);
  });
});
