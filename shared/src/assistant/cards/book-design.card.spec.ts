import { ASSISTANT_CHANGE_VERB_KEYS, assistantChangePreviewSchema } from '../assistant.schema';
import { BOOK_DESIGN_CARD_LIMITS, bookDesignCardSchema } from './book-design.card';
import { BOOK_DESIGN_VERB_KEYS } from './book-design.contract';
import { storedTrekCardSchema, trekCardSchema } from './index';

import { describe, expect, it } from 'vitest';

// BKDCARD-001 to BKDCARD-004

function card(over: Record<string, unknown> = {}) {
  return {
    kind: 'bookDesign',
    change: 'proposed',
    journeyId: 4,
    designId: 'd-1',
    baseVersion: 7,
    style: 'editorial',
    paper: '#faf8f4',
    ink: '#1a1a1a',
    accent: '#b45309',
    heading: 'playfair',
    body: 'garamond',
    spreads: [
      {
        spreadId: 'sp-1',
        index: 0,
        action: 'replace',
        beat: 'cover',
        chapter: null,
        entryId: null,
        photoCount: 1,
        severe: 0,
        warn: 0,
      },
      {
        spreadId: 'sp-9',
        index: 3,
        action: 'insert',
        beat: 'hero',
        chapter: 'Alfama',
        entryId: 12,
        photoCount: 1,
        severe: 0,
        warn: 1,
      },
    ],
    more: 0,
    leftOut: 3,
    revisionId: null,
    skipped: [],
    ...over,
  };
}

describe('the book design card', () => {
  it('BKDCARD-001: reads a design card through the union, as itself', () => {
    const parsed = trekCardSchema.parse(card());
    expect(parsed.kind).toBe('bookDesign');
    expect(bookDesignCardSchema.parse(parsed).spreads).toHaveLength(2);
    expect(storedTrekCardSchema.parse(card({ change: 'applied', revisionId: 5 }))).toMatchObject({ revisionId: 5 });
  });

  it('BKDCARD-002: a field past its bound, an unknown style or reason, reads as no card', () => {
    const page = card().spreads[1];
    const longChapter = [{ ...page, chapter: 'x'.repeat(BOOK_DESIGN_CARD_LIMITS.chapter + 1) }];
    expect(storedTrekCardSchema.parse(card({ spreads: longChapter }))).toBeNull();
    expect(storedTrekCardSchema.parse(card({ style: 'baroque' }))).toBeNull();
    expect(storedTrekCardSchema.parse(card({ skipped: [{ spreadId: 'sp-1', reason: 'tired' }] }))).toBeNull();
    const many = Array.from({ length: BOOK_DESIGN_CARD_LIMITS.spreads + 1 }, () => page);
    expect(storedTrekCardSchema.parse(card({ spreads: many }))).toBeNull();
  });

  it('BKDCARD-003: rides on a change preview with its own verb', () => {
    const preview = assistantChangePreviewSchema.parse({
      toolCallId: 'call_1',
      verbKey: 'designBook',
      subject: '',
      rows: [],
      dayId: null,
      placeIds: [],
      undoable: true,
      card: card(),
    });
    expect([preview.verbKey, preview.card?.kind]).toEqual(['designBook', 'bookDesign']);
  });

  it('BKDCARD-004: names the verbs of the book-level changes in the shared enum', () => {
    expect(ASSISTANT_CHANGE_VERB_KEYS).toEqual(expect.arrayContaining([...BOOK_DESIGN_VERB_KEYS]));
  });
});
