/**
 * FE-AI-BOOKPAGE-010 to FE-AI-BOOKPAGE-017
 *
 * The pure side of the book's page card: a page named as the Studio names
 * it, a layout and a finding by their words, the findings worth a look, the
 * spreads the card draws from the book on screen for each state of a change
 * (each page of a delete alone, the page after as the server made it when
 * the card carries it and the book is still at the trial's version), and
 * where an applied change opens the Studio.
 */
import { BOOK_FINDING_CODES, blankBook, blankSpread, type BookCardPage, type BookPageCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import {
  distinctFindings,
  findingLabel,
  findingsToCheck,
  layoutLabel,
  pageLabel,
  pageViewOf,
  subjectOf,
} from './bookCardModel';
import { studioTarget } from './bookLook';

/** Echoes the key and its parameters, so each test reads which words were asked for. */
const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key} ${JSON.stringify(params)}` : key;

function book() {
  let seq = 0;
  return blankBook({ title: 'Lisbon', newId: (prefix) => `${prefix}-${++seq}` });
}

const INNER: BookCardPage = { spreadId: 'sp-3', index: 2, role: 'inner', number: 1, photos: 0 };

function card(over: Partial<BookPageCard> = {}): BookPageCard {
  return {
    kind: 'bookPage',
    journeyId: 3,
    change: 'changed',
    baseVersion: 4,
    pages: [INNER],
    count: 0,
    movedTo: null,
    ops: [{ op: 'layout', template: 'two-up' }],
    cover: null,
    layout: null,
    photosAdded: 0,
    findings: [],
    moreFindings: 0,
    ...over,
  };
}

describe('bookCardModel', () => {
  it('FE-AI-BOOKPAGE-010: a page is the cover, a single page or a numbered double page; a new book is named as one', () => {
    expect(pageLabel(INNER, t)).toBe('assistant.card.book.spread {"page":1}');
    expect(pageLabel({ ...INNER, number: null }, t)).toBe('assistant.card.book.spreadAny');
    expect(pageLabel({ ...INNER, role: 'cover', number: null }, t)).toBe('assistant.card.book.cover');
    expect(pageLabel({ ...INNER, role: 'back', number: null }, t)).toBe('assistant.card.book.back');
    expect(subjectOf(card({ pages: [] }), t)).toBe('assistant.card.book.newBook');
    expect(subjectOf(card({ pages: [INNER, { ...INNER, role: 'last', number: null }] }), t)).toBe(
      'assistant.card.book.spread {"page":1}, assistant.card.book.last'
    );
  });

  it('FE-AI-BOOKPAGE-011: a layout is named by its template, its grid, its own name or as laid out again', () => {
    expect(layoutLabel({ kind: 'template', id: 'two-up', name: null }, t)).toBe('journey.studio.tpl.twoUp');
    expect(layoutLabel({ kind: 'template', id: 'cover-full', name: null }, t)).toBe('journey.studio.tpl.coverFull');
    expect(layoutLabel({ kind: 'template', id: 'postcard-houses', name: null }, t)).toBe(
      'studio.templates.name.postcardHouses'
    );
    expect(layoutLabel({ kind: 'grid', id: 'two-across', name: null }, t)).toBe('assistant.card.book.grid {"count":2}');
    expect(layoutLabel({ kind: 'saved', id: 'lay-1', name: 'Mine' }, t)).toBe('Mine');
    expect(layoutLabel({ kind: 'saved', id: 'lay-1', name: null }, t)).toBe('lay-1');
    expect(layoutLabel({ kind: 'auto', id: 'auto', name: null }, t)).toBe('assistant.card.book.layoutAuto');
    expect(layoutLabel({ kind: 'template', id: 'from-a-later-build', name: null }, t)).toBeNull();
    expect(layoutLabel(null, t)).toBeNull();
  });

  it('FE-AI-BOOKPAGE-012: faults and warnings are counted with those past the card, each finding named once', () => {
    const findings: BookPageCard['findings'] = [
      { code: 'overlap', severity: 'severe' },
      { code: 'overlap', severity: 'severe' },
      { code: 'low_dpi', severity: 'warn' },
      { code: 'parked', severity: 'info' },
    ];
    expect(findingsToCheck(card({ findings, moreFindings: 2 }))).toEqual({ count: 5, severe: true });
    expect(findingsToCheck(card({ findings: [{ code: 'parked', severity: 'info' }] }))).toEqual({
      count: 0,
      severe: false,
    });
    const named = distinctFindings(card({ findings }));
    expect(named.map((finding) => finding.code)).toEqual(['overlap', 'low_dpi', 'parked']);
    expect(findingLabel({ code: 'low_dpi', severity: 'warn' }, t)).toBe('assistant.card.book.finding.low_dpi');
  });

  it('FE-AI-BOOKPAGE-017: every finding the checks answer with has its words, the art checks among them', () => {
    for (const code of BOOK_FINDING_CODES) {
      expect(findingLabel({ code, severity: 'info' }, t)).toBe(`assistant.card.book.finding.${code}`);
    }
    for (const code of ['flat_cover', 'weak_hierarchy', 'off_theme', 'energy_mismatch'] as const) {
      expect(BOOK_FINDING_CODES).toContain(code);
    }
  });

  it('FE-AI-BOOKPAGE-013: a waiting edit or cover draws before and after; a move alone, a delete each page alone; new pages, other books and failures none', () => {
    const doc = book();
    const [edit] = pageViewOf(card(), doc, 'pending');
    expect(edit?.index).toBe(2);
    expect(edit?.before?.elements).toEqual([]);
    expect(edit?.after?.elements.filter((element) => element.kind === 'photo')).toHaveLength(2);
    const cover = card({
      pages: [{ ...INNER, spreadId: 'sp-1', index: 0, role: 'cover', number: null }],
      ops: [],
      cover: { template: 'cover-full', photoId: null, title: 'Portugal', subtitle: null },
    });
    expect(pageViewOf(cover, doc, 'applying')[0]?.after?.id).toBe('sp-1');
    expect(pageViewOf(card({ change: 'moved', ops: [], movedTo: 1 }), doc, 'pending')).toMatchObject([{ after: null }]);
    expect(pageViewOf(card({ change: 'new' }), doc, 'pending')).toEqual([]);
    expect(pageViewOf(card({ pages: [] }), doc, 'pending')).toEqual([]);
    expect(pageViewOf(card({ pages: [{ ...INNER, spreadId: 'sp-elsewhere' }] }), doc, 'pending')).toEqual([]);
    expect(pageViewOf(card(), null, 'pending')).toEqual([]);
    for (const state of ['failed', 'discarded', 'expired'] as const) expect(pageViewOf(card(), doc, state)).toEqual([]);
    // An operation the book on screen refuses draws the page as it is, nothing after it.
    const refused = card({ ops: [{ op: 'remove', elementIds: ['p-nowhere'], park: true }] });
    expect(pageViewOf(refused, doc, 'pending')).toMatchObject([{ after: null }]);

    // A delete draws every page it takes, each alone, in the order it names them; one the book does not hold, none.
    const two = {
      ...doc,
      spreads: [...doc.spreads.slice(0, 3), blankSpread('inner', () => 'sp-9'), ...doc.spreads.slice(3)],
    };
    const pages = [INNER, { ...INNER, spreadId: 'sp-elsewhere' }, { ...INNER, spreadId: 'sp-9', index: 3, number: 2 }];
    const gone = card({ change: 'willDelete', ops: [], pages });
    expect(pageViewOf(gone, two, 'applying')).toMatchObject([
      { index: 2, before: { id: 'sp-3' }, after: null },
      { index: 3, before: { id: 'sp-9' }, after: null },
    ]);
  });

  it('FE-AI-BOOKPAGE-014: once applied the page is drawn as it is now, and it opens the Studio on that page', () => {
    const doc = book();
    expect(pageViewOf(card({ change: 'new' }), doc, 'applied')).toMatchObject([
      { before: null, after: { id: 'sp-3' } },
    ]);
    // The pages a delete took are gone from the book: nothing is drawn.
    const gone = card({ change: 'willDelete', ops: [], pages: [{ ...INNER, spreadId: 'sp-taken' }] });
    expect(pageViewOf(gone, doc, 'applied')).toEqual([]);
    expect(studioTarget(3, 'sp-3')).toEqual({ kind: 'page', path: '/journey/3/studio?page=sp-3' });
    expect(studioTarget(3, null)).toEqual({ kind: 'page', path: '/journey/3/studio' });
  });

  it('FE-AI-BOOKPAGE-015: at the version of the trial a waiting edit or cover draws the page after the server made, never a run of its own; a card without it runs its operations', () => {
    const doc = book();
    const made = { ...blankSpread('inner', () => 'sp-3'), background: '#e6eef4' };
    // A caption the Studio's book cannot word is refused when run here; the server's page draws it all the same.
    const caption = card({ ops: [{ op: 'caption', photoElementId: 'p-81' }], after: made });
    expect(pageViewOf(caption, doc, 'pending', 4)).toMatchObject([{ index: 2, before: { id: 'sp-3' } }]);
    expect(pageViewOf(caption, doc, 'pending', 4)[0]?.after).toBe(made);
    // Operations the book on screen would take are not run either: the page is the server's, frames and all.
    expect(pageViewOf(card({ after: made }), doc, 'pending', 4)[0]?.after).toBe(made);
    expect(pageViewOf(card({ after: made, ops: [] }), doc, 'pending', 4)[0]?.after).toBe(made);
    const coverPage = { ...blankSpread('cover', () => 'sp-1'), background: '#f4efe6' };
    const cover = card({
      pages: [{ ...INNER, spreadId: 'sp-1', index: 0, role: 'cover', number: null }],
      ops: [],
      cover: { template: 'cover-full', photoId: null, title: 'Portugal', subtitle: null },
      after: coverPage,
    });
    expect(pageViewOf(cover, doc, 'pending', 4)[0]?.after).toBe(coverPage);

    // Without the page (a card from before it, or a page too heavy to carry), or with another page, the operations run.
    const photos = (view: ReturnType<typeof pageViewOf>) =>
      view[0]?.after?.elements.filter((element) => element.kind === 'photo').length;
    expect(photos(pageViewOf(card(), doc, 'pending', 4))).toBe(2);
    expect(photos(pageViewOf(card({ after: { ...made, id: 'sp-4' } }), doc, 'pending', 4))).toBe(2);
    // Once applied, the page is the book's as it is now.
    expect(pageViewOf(card({ after: made }), doc, 'applied', 4)[0]?.after).toBe(doc.spreads[2]);
  });

  it('FE-AI-BOOKPAGE-016: once the book moved on from the trial, or its version is not known, the change is run on the book as it is', () => {
    const doc = book();
    const made = { ...blankSpread('inner', () => 'sp-3'), background: '#e6eef4' };
    const photos = (view: ReturnType<typeof pageViewOf>) =>
      view[0]?.after?.elements.filter((element) => element.kind === 'photo').length;
    // Another change applied or a save since: the change will run on this book, so its operations are run on it.
    expect(photos(pageViewOf(card({ after: made }), doc, 'pending', 5))).toBe(2);
    // A caption this book cannot word then draws no page after, never the trial's page of an older book.
    const caption = card({ ops: [{ op: 'caption', photoElementId: 'p-81' }], after: made });
    expect(pageViewOf(caption, doc, 'pending', 5)).toMatchObject([{ before: { id: 'sp-3' }, after: null }]);
    // Nor does a card whose operations gave way to the page.
    expect(pageViewOf(card({ after: made, ops: [] }), doc, 'pending', 5)).toMatchObject([{ after: null }]);
    // A cover is set again on the cover as it is.
    const cover = card({
      pages: [{ ...INNER, spreadId: 'sp-1', index: 0, role: 'cover', number: null }],
      ops: [],
      cover: { template: 'cover-full', photoId: null, title: 'Portugal', subtitle: null },
      after: { ...blankSpread('cover', () => 'sp-1'), background: '#f4efe6' },
    });
    const [covered] = pageViewOf(cover, doc, 'pending', 5);
    expect(covered?.after?.id).toBe('sp-1');
    expect(covered?.after).not.toBe(cover.after);
    // Where the Studio does not say its version, or the card names none, the operations run too.
    expect(photos(pageViewOf(card({ after: made }), doc, 'pending'))).toBe(2);
    expect(photos(pageViewOf(card({ after: made, baseVersion: null }), doc, 'pending', null))).toBe(2);
  });
});
