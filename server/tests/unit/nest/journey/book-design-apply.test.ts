/**
 * `applyDesignDraft` (JBAPPLY-*): a whole-book design laid over the book as
 * it is now. A chosen page replaces the stored one only while that page is
 * exactly what the design found; a new page goes after the nearest plan page
 * that is there, inside the covers; a dropped page goes only when chosen and
 * untouched; a page whose photos left the gallery stays out; the draft's
 * format and title come along unless someone set others since, and a page
 * size moved since takes nothing. A journey that had no book gets the chosen
 * pages as a new book (a cover photo gone since leaves an empty frame, a map
 * stop's picture gone since leaves a dot), one that lost its book since, or
 * got one since, gets nothing. A plan row the draft holds no page for writes
 * nothing, and a book at the page limit takes no new page.
 */
import { applyDesignDraft, type DraftToApply } from '../../../../src/nest/journey/book-design-apply';
import {
  blankBook,
  bookMapElementSchema,
  bookPageSetupForPreset,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  MAX_SPREADS,
  type BookDesignPlanRow,
  type BookDocument,
  type BookSpread,
} from '@trek/shared';

import { describe, expect, it } from 'vitest';

/** A page of a role with the given id, photos in frames when named. */
function page(id: string, role: BookSpread['role'], photos: number[] = []): BookSpread {
  const elements = photos.map((photoId, i) =>
    bookPhotoElementSchema.parse({ id: `p-${id}-${i}`, kind: 'photo', frame: { x: 0, y: 0, w: 20, h: 20 }, photoId }),
  );
  return { id, role, background: null, elements, parked: [], entryId: null };
}

/** The same page on another background. */
function tinted(spread: BookSpread, background: string): BookSpread {
  return { ...spread, background };
}

/** A book of the given pages, in a 21 cm square. */
function book(spreads: BookSpread[], title = 'Lisbon'): BookDocument {
  return { ...blankBook({ title }), spreads };
}

/** Pages by id and role, `id:role` each, with no photos. */
function pages(...list: string[]): BookSpread[] {
  return list.map((entry) => {
    const [id = '', role = 'inner'] = entry.split(':');
    return page(id, role as BookSpread['role']);
  });
}

function row(spreadId: string, action: BookDesignPlanRow['action']): BookDesignPlanRow {
  return {
    spreadId,
    index: 0,
    action,
    beat: 'opener',
    chapter: null,
    entryId: null,
    photoIds: [],
    findings: { severe: 0, warn: 0 },
  };
}

function stored(): BookDocument {
  return book(pages('c:cover', 'f:first', 'a', 'b', 'l:last', 'k:back'));
}

describe('applyDesignDraft', () => {
  it('JBAPPLY-001: chosen pages replace the untouched stored ones in place, new ones follow the plan page before them', () => {
    const base = stored();
    const designed = book(
      [page('c', 'cover', [1]), ...pages('f:first'), page('a', 'inner', [2]), page('n', 'inner', [3]), ...pages('b')],
      'Lisbon in May',
    );
    const draft: DraftToApply = {
      base,
      doc: { ...designed, page: bookPageSetupForPreset('a4-landscape') },
      plan: [row('c', 'replace'), row('f', 'keep'), row('a', 'replace'), row('n', 'insert'), row('b', 'replace')],
      selection: ['c', 'a', 'n', 'b'],
    };

    const out = applyDesignDraft(base, draft, new Set([1, 2, 3]));

    expect(out.doc.spreads.map((s) => s.id)).toEqual(['c', 'f', 'a', 'n', 'b', 'l', 'k']);
    expect(out.doc.spreads[0]?.elements.map((e) => e.kind)).toEqual(['photo']);
    expect(out.applied).toEqual(['c', 'a', 'n', 'b']);
    expect(out.skipped).toEqual([]);
    expect([out.doc.title, out.doc.page.preset]).toEqual(['Lisbon in May', 'a4-landscape']);
  });

  it('JBAPPLY-002: a page changed since the design, a page taken out and a page with a photo gone stay, each named', () => {
    const base = stored();
    const now = book(base.spreads.map((s) => (s.id === 'a' ? tinted(s, '#101010') : s)));
    const draft: DraftToApply = {
      base,
      doc: book([...pages('c:cover'), page('a', 'inner', [2]), page('b', 'inner', [9]), ...pages('n')]),
      plan: [row('a', 'replace'), row('b', 'replace'), row('n', 'insert'), row('c', 'replace')],
      selection: ['a', 'b', 'c'],
    };

    const out = applyDesignDraft(now, draft, new Set([2]));

    expect(out.skipped).toEqual([
      { spreadId: 'a', reason: 'changed_since' },
      { spreadId: 'b', reason: 'photo_gone' },
      { spreadId: 'n', reason: 'excluded' },
    ]);
    expect(out.applied).toEqual(['c']);
    expect(out.doc.spreads.find((s) => s.id === 'a')?.background).toBe('#101010');
    expect(out.doc.spreads.map((s) => s.id)).toEqual(['c', 'f', 'a', 'b', 'l', 'k']);
  });

  it('JBAPPLY-003: a dropped page goes only when chosen and untouched; a new page with nothing before it follows the first', () => {
    const base = stored();
    const draft: DraftToApply = {
      base,
      doc: book(pages('c:cover', 'f:first', 'n', 'l:last', 'k:back')),
      plan: [row('n', 'insert'), row('a', 'drop'), row('b', 'drop'), row('gone', 'drop')],
      selection: ['n', 'a', 'gone'],
    };

    const out = applyDesignDraft(base, draft, new Set());

    expect(out.doc.spreads.map((s) => s.id)).toEqual(['c', 'f', 'n', 'b', 'l', 'k']);
    expect(out.applied).toEqual(['n', 'a']);
    expect(out.skipped).toEqual([{ spreadId: 'b', reason: 'excluded' }]);

    const touched = book(base.spreads.map((s) => (s.id === 'a' ? tinted(s, '#202020') : s)));
    const kept = applyDesignDraft(touched, { ...draft, selection: ['a'] }, new Set());
    expect(kept.skipped).toContainEqual({ spreadId: 'a', reason: 'changed_since' });
    expect(kept.doc.spreads.map((s) => s.id)).toContain('a');
  });

  it('JBAPPLY-004: a framing page the book lacks goes to its place, and a page the book holds is not inserted twice', () => {
    const base = book(pages('f:first', 'a'));
    const draft: DraftToApply = {
      base,
      doc: book(pages('c:cover', 'f:first', 'a', 'l:last', 'k:back')),
      plan: [row('c', 'insert'), row('l', 'insert'), row('k', 'insert'), row('a', 'insert')],
      selection: ['c', 'l', 'k', 'a'],
    };

    const out = applyDesignDraft(base, draft, new Set());

    expect(out.doc.spreads.map((s) => s.id)).toEqual(['c', 'f', 'a', 'l', 'k']);
    expect(out.skipped).toEqual([{ spreadId: 'a', reason: 'changed_since' }]);
  });

  it('JBAPPLY-005: a journey without a book gets the framing pages and the chosen inner pages as a new book', () => {
    const doc = book([
      ...pages('c:cover', 'f:first'),
      page('a', 'inner', [1]),
      ...pages('b'),
      page('x', 'inner', [7]),
      ...pages('l:last', 'k:back'),
    ]);
    const draft: DraftToApply = {
      base: null,
      doc,
      plan: doc.spreads.map((s) => row(s.id, 'insert')),
      selection: ['a', 'x'],
    };

    const out = applyDesignDraft(null, draft, new Set([1]));

    expect(out.doc.spreads.map((s) => s.id)).toEqual(['c', 'f', 'a', 'l', 'k']);
    expect(out.applied).toEqual(['c', 'f', 'a', 'l', 'k']);
    expect(out.skipped).toEqual([
      { spreadId: 'b', reason: 'excluded' },
      { spreadId: 'x', reason: 'photo_gone' },
    ]);
  });

  it('JBAPPLY-006: a book deleted since the design takes nothing: every page it would change is changed since', () => {
    const base = stored();
    const draft: DraftToApply = { base, doc: base, plan: [row('a', 'replace'), row('f', 'keep')], selection: ['a'] };
    const out = applyDesignDraft(null, draft, new Set());
    expect(out.applied).toEqual([]);
    expect(out.skipped).toEqual([{ spreadId: 'a', reason: 'changed_since' }]);
  });

  it('JBAPPLY-008: a format or title set since the design stays; a page size moved since takes nothing', () => {
    const base = stored();
    const designed = book([page('a', 'inner', [2])], 'Lisbon in May');
    const draft: DraftToApply = { base, doc: designed, plan: [row('a', 'replace')], selection: ['a'] };
    const numbered = { ...base.page, pageNumbers: { ...base.page.pageNumbers, show: !base.page.pageNumbers.show } };
    const renamed: BookDocument = { ...base, title: 'Porto', page: numbered };

    const kept = applyDesignDraft(renamed, draft, new Set([2]));

    expect(kept.applied).toEqual(['a']);
    expect([kept.doc.title, kept.doc.page]).toEqual(['Porto', numbered]);

    const resized: BookDocument = { ...base, page: bookPageSetupForPreset('a4-landscape') };
    const none = applyDesignDraft(resized, draft, new Set([2]));

    expect(none.applied).toEqual([]);
    expect(none.skipped).toEqual([{ spreadId: 'a', reason: 'changed_since' }]);
    expect(none.doc).toBe(resized);
  });

  it('JBAPPLY-010: a design for a journey without a book takes nothing once a book was made since', () => {
    const doc = book(pages('c2:cover', 'f2:first', 'n', 'l2:last', 'k2:back'));
    const plan = doc.spreads.map((s) => row(s.id, 'insert'));
    const draft: DraftToApply = { base: null, doc, plan, selection: ['n'] };
    const made = stored();

    const out = applyDesignDraft(made, draft, new Set());

    expect(out.applied).toEqual([]);
    expect(out.doc).toBe(made);
    expect(out.skipped).toHaveLength(5);
    expect(out.skipped.every((s) => s.reason === 'changed_since')).toBe(true);
  });

  it('JBAPPLY-009: a new book keeps its cover when the cover photo left the gallery, its frame emptied', () => {
    const doc = book([page('c', 'cover', [5]), ...pages('f:first', 'l:last', 'k:back')]);
    const plan = doc.spreads.map((s) => row(s.id, 'insert'));
    const draft: DraftToApply = { base: null, doc, plan, selection: [] };

    const out = applyDesignDraft(null, draft, new Set());

    expect(out.applied).toEqual(['c', 'f', 'l', 'k']);
    const cover = out.doc.spreads[0]?.elements[0];
    expect(cover?.kind === 'photo' ? cover.photoId : 'not a photo').toBeNull();
  });

  it('JBAPPLY-007: two pages equal but for the order of their keys read as the same page', () => {
    const base = stored();
    const turned = (s: BookSpread): BookSpread => ({
      entryId: s.entryId,
      parked: s.parked,
      elements: s.elements,
      background: s.background,
      role: s.role,
      id: s.id,
    });
    const reordered = book(base.spreads.map((s) => (s.id === 'a' ? turned(s) : s)));
    const draft: DraftToApply = {
      base,
      doc: book([page('a', 'inner', [4])]),
      plan: [row('a', 'replace')],
      selection: ['a'],
    };
    expect(applyDesignDraft(reordered, draft, new Set([4])).applied).toEqual(['a']);
  });

  it('JBAPPLY-011: a new book empties only the gone pictures on its cover, a map stop among them', () => {
    const point = (photoId: number | null) => ({ lat: 38.7, lng: -9.1, label: '', photoId });
    const map = bookMapElementSchema.parse({
      id: 'm-c',
      kind: 'map',
      frame: { x: 0, y: 0, w: 40, h: 40 },
      points: [point(5), point(6), point(null)],
    });
    const empty = bookPhotoElementSchema.parse({ id: 'p-c-e', kind: 'photo', frame: { x: 0, y: 0, w: 20, h: 20 } });
    const shape = bookShapeElementSchema.parse({ id: 's-c', kind: 'shape', frame: { x: 0, y: 0, w: 10, h: 10 } });
    const framed = page('c', 'cover', [6]);
    const cover = { ...framed, elements: [...framed.elements, empty, map, shape] };
    const doc = book([cover, ...pages('f:first', 'l:last', 'k:back')]);
    const plan = doc.spreads.map((s) => row(s.id, 'insert'));
    const draft: DraftToApply = { base: null, doc, plan, selection: [] };

    const out = applyDesignDraft(null, draft, new Set([6]));

    const [frame, blank, stops, rest] = out.doc.spreads[0]?.elements ?? [];
    expect(frame).toMatchObject({ kind: 'photo', photoId: 6 });
    expect(blank).toMatchObject({ kind: 'photo', photoId: null });
    expect(stops?.kind === 'map' ? stops.points.map((p) => p.photoId) : 'not a map').toEqual([null, 6, null]);
    expect(rest).toEqual(shape);
    expect(out.applied).toEqual(['c', 'f', 'l', 'k']);
  });

  it('JBAPPLY-012: a new page with only a dropped page and a page the book lacks before it follows the cover', () => {
    const base = book(pages('c:cover', 'a', 'k:back'));
    const draft: DraftToApply = {
      base,
      doc: book(pages('c:cover', 'm', 'n', 'k:back')),
      plan: [row('x', 'drop'), row('m', 'insert'), row('n', 'insert')],
      selection: ['n'],
    };

    const out = applyDesignDraft(base, draft, new Set());

    expect(out.doc.spreads.map((s) => s.id)).toEqual(['c', 'n', 'a', 'k']);
    expect(out.applied).toEqual(['n']);
    expect(out.skipped).toEqual([
      { spreadId: 'x', reason: 'excluded' },
      { spreadId: 'm', reason: 'excluded' },
    ]);
  });

  it('JBAPPLY-013: a plan row whose page the draft does not hold changes nothing and is not named', () => {
    const base = stored();
    const draft: DraftToApply = {
      base,
      doc: book(pages('c:cover')),
      plan: [row('a', 'replace'), row('n', 'insert')],
      selection: ['a', 'n'],
    };

    const out = applyDesignDraft(base, draft, new Set());

    expect([out.applied, out.skipped]).toEqual([[], []]);
    expect(out.doc.spreads).toEqual(base.spreads);
  });

  it('JBAPPLY-014: a book at the page limit takes no new page, the page named as changed since', () => {
    const inner = Array.from({ length: MAX_SPREADS - 1 }, (_, i) => page(`i${i}`, 'inner'));
    const full = book([page('c', 'cover'), ...inner]);
    const draft: DraftToApply = { base: full, doc: book(pages('n')), plan: [row('n', 'insert')], selection: ['n'] };

    const out = applyDesignDraft(full, draft, new Set());

    expect(out.skipped).toEqual([{ spreadId: 'n', reason: 'changed_since' }]);
    expect(out.doc.spreads).toHaveLength(MAX_SPREADS);
  });
});
