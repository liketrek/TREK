import { ASSISTANT_CHANGE_VERB_KEYS, assistantAppliedSchema, assistantChangePreviewSchema } from '../assistant.schema';
import { BOOK_PAGE_CARD_LIMITS, bookPageCardSchema, type BookCardPage } from './book-page.card';
import { storedTrekCardSchema, trekCardSchema } from './index';

import { describe, expect, it } from 'vitest';

// BOOKCARD-001 to BOOKCARD-007

function page(over: Partial<BookCardPage> = {}): BookCardPage {
  return { spreadId: 'sp-lisbon', index: 2, role: 'inner', number: 1, photos: 3, ...over };
}

function card(over: Record<string, unknown> = {}) {
  return {
    kind: 'bookPage',
    journeyId: 4,
    change: 'changed',
    baseVersion: 7,
    pages: [page()],
    count: 0,
    movedTo: null,
    ops: [
      { op: 'layout', template: 'two-up' },
      { op: 'background', color: '#f4efe6' },
    ],
    cover: null,
    layout: { kind: 'template', id: 'two-up', name: null },
    photosAdded: 2,
    findings: [{ code: 'overlap', severity: 'severe' }],
    moreFindings: 0,
    ...over,
  };
}

describe('the book page card', () => {
  it('BOOKCARD-001: reads a full card through the union, as itself, its operations parsed by the book engine', () => {
    const parsed = trekCardSchema.parse(card());
    expect(parsed.kind).toBe('bookPage');
    const own = bookPageCardSchema.parse(parsed);
    expect(own.ops).toHaveLength(2);
    expect(own.ops[0]).toMatchObject({ op: 'layout', template: 'two-up' });
  });

  it('BOOKCARD-002: a cover change carries its arguments, a new book no page and no version', () => {
    const cover = { template: 'cover-full', photoId: 81, title: 'Portugal', subtitle: null };
    expect(bookPageCardSchema.safeParse(card({ ops: [], cover, layout: null })).success).toBe(true);
    const fresh = card({ change: 'new', baseVersion: null, pages: [], count: 5, ops: [], layout: null, findings: [] });
    expect(bookPageCardSchema.safeParse(fresh).success).toBe(true);
  });

  it('BOOKCARD-003: an operation the engine refuses, an unknown template or a page past the cap reads as no card', () => {
    expect(storedTrekCardSchema.parse(card({ ops: [{ op: 'explode' }] }))).toBeNull();
    const cover = { template: 'nope', photoId: null, title: null, subtitle: null };
    expect(storedTrekCardSchema.parse(card({ cover }))).toBeNull();
    const eleven = Array.from({ length: 11 }, (_, i) => page({ spreadId: `sp-${i}`, index: i }));
    expect(storedTrekCardSchema.parse(card({ pages: eleven }))).toBeNull();
    expect(storedTrekCardSchema.parse(card({ pages: [page({ spreadId: 'not a page id' })] }))).toBeNull();
  });

  it('BOOKCARD-004: holds at most six findings, each a known code and severity', () => {
    const findings = Array.from({ length: BOOK_PAGE_CARD_LIMITS.findings + 1 }, () => ({
      code: 'empty_frame',
      severity: 'warn',
    }));
    expect(bookPageCardSchema.safeParse(card({ findings })).success).toBe(false);
    expect(bookPageCardSchema.safeParse(card({ findings: [{ code: 'ugly', severity: 'warn' }] })).success).toBe(false);
    expect(bookPageCardSchema.safeParse(card({ findings: findings.slice(1), moreFindings: 3 })).success).toBe(true);
  });

  it('BOOKCARD-005: rides on a change preview', () => {
    const preview = assistantChangePreviewSchema.parse({
      toolCallId: 'call_1',
      verbKey: 'editBookPage',
      subject: 'Lisbon',
      rows: [],
      dayId: null,
      placeIds: [],
      undoable: true,
      card: card(),
    });
    expect(preview.verbKey).toBe('editBookPage');
    expect(preview.card?.kind).toBe('bookPage');
  });

  it('BOOKCARD-006: names its verbs and its entity in the shared enums', () => {
    expect(ASSISTANT_CHANGE_VERB_KEYS).toEqual(
      expect.arrayContaining([
        'createBook',
        'addBookPages',
        'editBookPage',
        'moveBookPage',
        'removeBookPages',
        'setBookCover',
      ]),
    );
    const applied = assistantAppliedSchema.parse({
      toolCallId: 'call_1',
      entity: 'book_page',
      ids: [],
      dayId: null,
      undoUntil: null,
    });
    expect(applied.entity).toBe('book_page');
  });

  it('BOOKCARD-007: carries the page after as the server made it; without one it reads, an unreadable one drops itself', () => {
    const after = { id: 'sp-lisbon', role: 'inner', background: '#ffffff', elements: [], parked: [], entryId: null };
    expect(bookPageCardSchema.parse(card({ after })).after).toEqual(after);
    // A card from before the page rode on it, as the thread keeps it, reads as it was.
    expect(bookPageCardSchema.parse(card()).after).toBeUndefined();
    expect(storedTrekCardSchema.parse(card())).toMatchObject({ kind: 'bookPage', journeyId: 4 });
    // A page a later build cannot read drops itself, never the card: the Studio then runs the operations.
    const unread = { ...after, background: 'white' };
    const kept = bookPageCardSchema.parse(card({ after: unread }));
    expect(kept.after).toBeUndefined();
    expect(kept.ops).toHaveLength(2);
    expect(storedTrekCardSchema.parse(card({ after: unread }))).toMatchObject({ kind: 'bookPage', journeyId: 4 });
  });
});
