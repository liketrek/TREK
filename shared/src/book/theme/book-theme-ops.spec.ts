import { applyBookOps } from '../book-ops';
import { blankBook } from '../book-pages';
import {
  bookShapeElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
} from '../book.schema';
import { bookThemeColor, bookThemeOf } from './book-theme';
import { themeLinkFields, withThemeLinks } from './book-theme-links';
import { requestedBookTheme, setBookTheme } from './book-theme-ops';

import { describe, expect, it } from 'vitest';

// BKTHOP-001 to BKTHOP-010

const frame = { x: 230, y: 20, w: 100, h: 20 };
const text = (over: Record<string, unknown> = {}) =>
  bookTextElementSchema.parse({ id: 't-1', kind: 'text', frame, text: 'Hello', ...over }) as BookElement;

function book(elements: BookElement[] = [text({ color: '#1a1a1a' })]): BookDocument {
  const doc = blankBook({ title: 'Iceland', newId: (p) => `${p}-x` });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements };
  return { ...doc, spreads };
}

function ok<R extends { ok: boolean }>(result: R): Extract<R, { ok: true }> {
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result as Extract<R, { ok: true }>;
}

const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;

describe('set_book_theme', () => {
  it('BKTHOP-001: applies a built-in theme to the whole book, adopting what is not linked, and names the pages', () => {
    const done = ok(setBookTheme(book(), { theme: 'alpine' }));
    const alpine = bookThemeOf('alpine');
    expect(done.doc.theme).toEqual(alpine);
    expect(inner(done.doc).elements[0]).toMatchObject({ token: 'ink', color: alpine.palette.ink });
    expect(inner(done.doc).background).toBe(alpine.palette.paper);
    expect(done.spreadIds).toEqual(['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back']);
  });

  it('BKTHOP-002: applies to the pages named only, and refuses a page the book does not have', () => {
    const done = ok(setBookTheme(book(), { theme: 'nordic', spreadIds: ['sp-in'] }));
    expect(done.spreadIds).toEqual(['sp-in']);
    expect(setBookTheme(book(), { theme: 'nordic', spreadIds: ['sp-gone'] })).toMatchObject({
      ok: false,
      error: { code: 'spread_not_found' },
    });
  });

  it('BKTHOP-003: changes what is named on top of the theme, and of the book own theme when none is named', () => {
    const first = ok(setBookTheme(book(), { theme: 'riviera', palette: { accent: '#aa0000' }, decoration: 'rich' }));
    expect([first.doc.theme?.palette.accent, first.doc.theme?.decoration, first.doc.theme?.id]).toEqual([
      '#aa0000',
      'rich',
      'riviera',
    ]);
    const second = ok(
      setBookTheme(first.doc, { fonts: { body: { font: 'garamond' }, script: null }, motifs: ['sea'] }),
    );
    expect(second.doc.theme).toMatchObject({
      palette: { accent: '#aa0000' },
      fonts: { body: { font: 'garamond' }, script: null },
      motifs: ['sea'],
    });
  });

  it('BKTHOP-004: refuses what it cannot do: no theme to start from, an unknown face, a missing slot, a bad shape', () => {
    expect(setBookTheme(book(), { palette: { ink: '#000000' } })).toMatchObject({ error: { code: 'invalid_op' } });
    expect(setBookTheme(book(), { theme: 'nordic', fonts: { heading: { font: 'comic' } } })).toMatchObject({
      error: { code: 'invalid_op' },
    });
    expect(setBookTheme(book(), { theme: 'nordic', fonts: { heading: null } })).toMatchObject({ ok: false });
    expect(requestedBookTheme(book(), { theme: 'nordic', fonts: { display: null as never } })).toBe(
      'the display face cannot be left out',
    );
    expect(setBookTheme(book(), { theme: 'nordic', adopt: 'yes' })).toMatchObject({ error: { code: 'invalid_op' } });
  });

  it('BKTHOP-005: hands the very same book back when the theme it applies changes nothing', () => {
    const once = ok(setBookTheme(book(), { theme: 'tropical' })).doc;
    const again = ok(setBookTheme(once, { theme: 'tropical' }));
    expect(again.doc).toBe(once);
    expect(again.spreadIds).toEqual([]);
  });

  it('BKTHOP-006: without adopt, recolours only what was linked', () => {
    const doc = book([text({ color: '#1a1a1a' }), text({ id: 't-2', token: 'accent' })]);
    const done = ok(setBookTheme(doc, { theme: 'cutout', adopt: false }));
    const [plain, linked] = inner(done.doc).elements;
    expect(plain).toMatchObject({ color: '#1a1a1a' });
    expect(linked).toMatchObject({ color: bookThemeOf('cutout').palette.accent });
  });
});

describe('the links when an element is edited', () => {
  const nordic = bookThemeOf('nordic');

  it('BKTHOP-007: a colour or face set by hand unlinks it; a link set takes the theme value', () => {
    const el = text({ token: 'accent', fontRole: 'heading' });
    const recoloured = withThemeLinks({ ...el, color: '#123456' } as BookElement, { color: '#123456' }, nordic);
    expect('token' in recoloured).toBe(false);
    expect(recoloured).toMatchObject({ fontRole: 'heading' });
    const refaced = withThemeLinks({ ...el, font: 'serif' } as BookElement, { font: 'serif' }, nordic);
    expect('fontRole' in refaced).toBe(false);
    const linked = withThemeLinks({ ...text(), token: 'accent2' } as BookElement, { token: 'accent2' }, nordic);
    expect(linked).toMatchObject({ color: nordic.palette.accent2 });
    // Without a theme the link is kept for the theme to come, the colour as it is.
    const waiting = withThemeLinks({ ...text(), token: 'accent2' } as BookElement, { token: 'accent2' }, undefined);
    expect(waiting).toMatchObject({ token: 'accent2', color: '#1a1a1a' });
    const unlinked = withThemeLinks({ ...el, token: null } as unknown as BookElement, { token: null }, nordic);
    expect('token' in unlinked).toBe(false);
  });

  it('BKTHOP-008: names the link fields of each kind', () => {
    expect(themeLinkFields('text')).toEqual(['token', 'fontRole']);
    expect(themeLinkFields('shape')).toEqual(['token', 'strokeToken']);
    expect(themeLinkFields('map')).toEqual(['token', 'accentToken', 'fontRole']);
    expect(themeLinkFields('photo')).toEqual([]);
  });

  it('BKTHOP-009: the style and add operations link, unlink and recolour like the inspector', () => {
    const doc = ok(setBookTheme(book(), { theme: 'nordic' })).doc;
    const styled = ok(
      applyBookOps(doc, {
        spreadId: 'sp-in',
        ops: [
          { op: 'style', elementId: 't-1', set: { kind: 'text', token: 'accent3' } },
          { op: 'add', element: { kind: 'shape', shape: 'rect', token: 'accent' } },
        ],
      }),
    );
    const [words, block] = inner(styled.doc).elements;
    expect(words).toMatchObject({ token: 'accent3', color: nordic.palette.accent3 });
    expect(block).toMatchObject({ token: 'accent', fill: nordic.palette.accent });
    const handPicked = ok(
      applyBookOps(styled.doc, {
        spreadId: 'sp-in',
        ops: [{ op: 'style', elementId: 't-1', set: { kind: 'text', color: '#00ff00' } }],
      }),
    );
    expect('token' in (inner(handPicked.doc).elements[0] as object)).toBe(false);
    const cleared = ok(
      applyBookOps(styled.doc, {
        spreadId: 'sp-in',
        ops: [{ op: 'style', elementId: 't-1', set: { kind: 'text', token: null } }],
      }),
    );
    expect(inner(cleared.doc).elements[0]).toMatchObject({ color: nordic.palette.accent3 });
    expect('token' in (inner(cleared.doc).elements[0] as object)).toBe(false);
    expect(bookShapeElementSchema.safeParse(block).success).toBe(true);
  });

  it('BKTHOP-010: a background set by hand stops following the paper', () => {
    const doc = ok(setBookTheme(book(), { theme: 'nordic' })).doc;
    expect(inner(doc).backgroundToken).toBe('paper');
    const set = ok(applyBookOps(doc, { spreadId: 'sp-in', ops: [{ op: 'background', color: '#ff0000' }] }));
    expect(inner(set.doc)).toMatchObject({ background: '#ff0000' });
    expect('backgroundToken' in inner(set.doc)).toBe(false);
    expect(bookThemeColor(nordic, 'paper')).toBe(nordic.palette.paper);
  });
});
