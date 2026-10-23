/**
 * FE-BOOKDSN-001 to FE-BOOKDSN-004
 *
 * The pure side of the whole-book design card: what it counts, the pairs it
 * draws while the design waits (the draft's page beside the book's), the
 * pages an applied design wrote, and a choice of pages kept in plan order.
 */
import {
  blankBook,
  type BookDesignCard,
  type BookDesignDraftResponse,
  type BookDocument,
  type BookSpread,
} from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { appliedPairs, designCounts, draftPairs, skippedCounts, styleLabel, toggledSelection } from './bookDesignModel';

/** sp-1 the cover, sp-2 the first page, sp-3 a double page, sp-4 the last page, sp-5 the back. */
function book(): BookDocument {
  let seq = 0;
  return blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++seq}` });
}

function inner(id: string): BookSpread {
  return { id, role: 'inner', background: null, elements: [], parked: [], entryId: null };
}

/** The book with a second double page (sp-7) after sp-3. */
function stored(): BookDocument {
  const doc = book();
  return { ...doc, spreads: [...doc.spreads.slice(0, 3), inner('sp-7'), ...doc.spreads.slice(3)] };
}

/** The designed book: sp-3 laid out again, a new double page sp-9 after it, sp-7 dropped. */
function designed(): BookDocument {
  const doc = book();
  const again = { ...inner('sp-3'), background: '#faf8f4' };
  return { ...doc, spreads: [...doc.spreads.slice(0, 2), again, inner('sp-9'), ...doc.spreads.slice(3)] };
}

type PlanRow = BookDesignDraftResponse['plan'][number];
type CardRow = BookDesignCard['spreads'][number];

/** The plan: the cover kept, sp-3 laid out again, sp-9 new, sp-7 dropped. */
const PLAN: [string, number, PlanRow['action'], PlanRow['beat'], number, number][] = [
  ['sp-1', 0, 'keep', 'cover', 0, 0],
  ['sp-3', 2, 'replace', 'hero', 1, 1],
  ['sp-9', 3, 'insert', 'duo', 0, 2],
  ['sp-7', 3, 'drop', 'quiet', 0, 0],
];

function planRow([spreadId, index, action, beat, severe, warn]: (typeof PLAN)[number]): PlanRow {
  const findings = { severe, warn };
  return { spreadId, index, action, beat, chapter: null, entryId: null, photoIds: [], findings };
}

function cardRow([spreadId, index, action, beat, severe, warn]: (typeof PLAN)[number]): CardRow {
  return { spreadId, index, action, beat, chapter: null, entryId: null, photoCount: 0, severe, warn };
}

function draft(): BookDesignDraftResponse {
  return {
    designId: 'd-1',
    baseVersion: 4,
    expiresAt: '2026-10-22T18:00:00.000Z',
    document: designed(),
    plan: PLAN.map(planRow),
    selection: ['sp-3', 'sp-9', 'sp-7'],
  };
}

function card(over: Partial<BookDesignCard> = {}): BookDesignCard {
  return {
    kind: 'bookDesign',
    change: 'proposed',
    journeyId: 3,
    designId: 'd-1',
    baseVersion: 4,
    style: 'editorial',
    paper: '#faf8f4',
    ink: '#1a1a1a',
    accent: '#c0392b',
    heading: 'playfair',
    body: 'garamond',
    spreads: PLAN.map(cardRow),
    more: 6,
    leftOut: 2,
    revisionId: null,
    skipped: [],
    ...over,
  };
}

describe('the whole-book design card model', () => {
  it('FE-BOOKDSN-001: counts the plan, the pages that change, the findings and the pages an apply left', () => {
    expect(designCounts(card())).toEqual({ pages: 10, changes: 3, findings: 4, severe: true });
    expect(designCounts(card({ spreads: [] }))).toEqual({ pages: 6, changes: 0, findings: 0, severe: false });
    const skipped = card({
      skipped: [
        { spreadId: 'sp-3', reason: 'changed_since' },
        { spreadId: 'sp-9', reason: 'photo_gone' },
        { spreadId: 'sp-7', reason: 'excluded' },
        { spreadId: 'sp-8', reason: 'changed_since' },
      ],
    });
    expect(skippedCounts(skipped)).toEqual({ excluded: 1, changed_since: 2, photo_gone: 1 });
    expect(styleLabel(card(), (key) => `t:${key}`)).toBe('t:assistant.card.bookDesign.style.editorial');
  });

  it('FE-BOOKDSN-002: a waiting design pairs each page it changes with the page it replaces', () => {
    const pairs = draftPairs(draft(), stored());
    expect(pairs.map((pair) => [pair.spreadId, pair.action])).toEqual([
      ['sp-3', 'replace'],
      ['sp-9', 'insert'],
      ['sp-7', 'drop'],
    ]);
    const [replaced, added, dropped] = pairs;
    // Laid out again: the book's page before, the draft's after, named by where it stands in the draft.
    expect(replaced?.before?.background).toBeNull();
    expect(replaced?.after?.background).toBe('#faf8f4');
    expect(replaced?.page).toMatchObject({ spreadId: 'sp-3', role: 'inner', number: 1 });
    expect(replaced).toMatchObject({ findings: 2, severe: true });
    // New: nothing before; the second double page of the draft.
    expect(added?.before).toBeNull();
    expect(added?.after?.id).toBe('sp-9');
    expect(added?.page).toMatchObject({ number: 2 });
    expect(added).toMatchObject({ findings: 2, severe: false });
    // Dropped: nothing after; named by where it stood in the book.
    expect(dropped?.after).toBeNull();
    expect(dropped?.before?.id).toBe('sp-7');
    expect(dropped?.page).toMatchObject({ spreadId: 'sp-7', number: 2 });
    // Without the book (it could not be read), the draft's pages stand alone.
    const alone = draftPairs(draft(), null);
    expect(alone.map((pair) => pair.before)).toEqual([null, null, null]);
    expect(alone[2]?.page).toBeNull();
  });

  it('FE-BOOKDSN-003: an applied design shows the pages it wrote as the book holds them, none it left', () => {
    const now = designed();
    const written = appliedPairs(card({ change: 'applied' }), now);
    expect(written.map((pair) => pair.spreadId)).toEqual(['sp-3', 'sp-9']);
    expect(written.every((pair) => pair.before === null)).toBe(true);
    expect(written[0]?.after?.background).toBe('#faf8f4');
    expect(written[1]?.page).toMatchObject({ role: 'inner', number: 2 });

    const left = card({ change: 'applied', skipped: [{ spreadId: 'sp-3', reason: 'changed_since' }] });
    expect(appliedPairs(left, now).map((pair) => pair.spreadId)).toEqual(['sp-9']);
    // A page the book no longer holds is not drawn, and without the book nothing is.
    expect(appliedPairs(card({ change: 'applied' }), book()).map((pair) => pair.spreadId)).toEqual(['sp-3']);
    expect(appliedPairs(card({ change: 'applied' }), null)).toEqual([]);
  });

  it('FE-BOOKDSN-004: a page put in or taken out keeps the plan order', () => {
    const order = ['sp-3', 'sp-9', 'sp-7'];
    expect(toggledSelection(['sp-3', 'sp-9', 'sp-7'], 'sp-9', order)).toEqual(['sp-3', 'sp-7']);
    expect(toggledSelection(['sp-7', 'sp-3'], 'sp-9', order)).toEqual(['sp-3', 'sp-9', 'sp-7']);
    expect(toggledSelection([], 'sp-1', order)).toEqual([]);
  });
});
