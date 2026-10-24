import {
  bookDocumentSchema,
  bookIconElementSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  bookStatsElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
} from '../book.schema';
import { bookThemeColor, bookThemeOf } from './book-theme';
import { adoptSpread, adoptionMap } from './book-theme-adopt';
import { applyBookTheme, changedSpreadIds, themedElement, themedSpread } from './book-theme-apply';

import { describe, expect, it } from 'vitest';

// BKTHAP-001 to BKTHAP-012

const frame = { x: 10, y: 10, w: 80, h: 20 };
const text = (over: Record<string, unknown> = {}) =>
  bookTextElementSchema.parse({ id: 't1', kind: 'text', frame, text: 'Hello', ...over });
const shape = (over: Record<string, unknown> = {}) =>
  bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame, ...over });
const icon = (over: Record<string, unknown> = {}) =>
  bookIconElementSchema.parse({ id: 'i1', kind: 'icon', frame, name: 'Compass', ...over });
const stats = (over: Record<string, unknown> = {}) =>
  bookStatsElementSchema.parse({ id: 'st1', kind: 'stats', frame, ...over });
const photo = () => bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame, photoId: 3 });
const spread = (elements: BookElement[], over: Record<string, unknown> = {}): BookSpread =>
  bookSpreadSchema.parse({ id: 'sp1', elements, ...over });
const book = (spreads: BookSpread[]): BookDocument => bookDocumentSchema.parse({ spreads });

const tropical = bookThemeOf('tropical');
const nordic = bookThemeOf('nordic');

describe('one element under a theme', () => {
  it('BKTHAP-001: takes the linked colour and face, and nothing else', () => {
    const el = text({ token: 'accent', fontRole: 'body', size: 12, color: '#000000' });
    const done = themedElement(el, tropical);
    expect(done.color).toBe(tropical.palette.accent);
    expect(done.font).toBe(tropical.fonts.body.font);
    expect([done.size, done.text, done.frame]).toEqual([12, 'Hello', frame]);
  });

  it('BKTHAP-002: leaves an unlinked, locked or photo element as the very same object', () => {
    const plain = text();
    expect(themedElement(plain, tropical)).toBe(plain);
    const locked = text({ token: 'ink', locked: true });
    expect(themedElement(locked, tropical)).toBe(locked);
    const pic = photo();
    expect(themedElement(pic, tropical)).toBe(pic);
  });

  it('BKTHAP-003: sets a shape fill and stroke, an icon and a travel element ink and accent', () => {
    const s = themedElement(shape({ token: 'accent2', strokeToken: 'ink', stroke: '#000000', strokeWidth: 1 }), nordic);
    expect([s.fill, s.stroke]).toEqual([nordic.palette.accent2, nordic.palette.ink]);
    // A shape with no fill keeps having none: the link waits for a fill to follow.
    expect(themedElement(shape({ token: 'accent', fill: null }), nordic).fill).toBeNull();
    expect(themedElement(icon({ token: 'accent3' }), nordic).color).toBe(nordic.palette.accent3);
    const figures = themedElement(stats({ token: 'muted', accentToken: 'accent', fontRole: 'heading' }), nordic);
    expect([figures.color, figures.accent, figures.font]).toEqual([
      bookThemeColor(nordic, 'muted'),
      nordic.palette.accent,
      nordic.fonts.heading.font,
    ]);
  });

  it('BKTHAP-004: sets a script in the theme face, and in the heading face upright when the theme has none', () => {
    const words = text({ fontRole: 'script' });
    const scripted = themedElement(words, tropical);
    expect(scripted.font).toBe(tropical.fonts.script?.font);
    const minimal = bookThemeOf('minimal-serif');
    const none = themedElement(text({ fontRole: 'script', italic: true }), minimal);
    expect([none.font, none.italic]).toEqual([minimal.fonts.heading.font, false]);
  });
});

describe('a page and a book under a theme', () => {
  it('BKTHAP-005: recolours a linked background, the paper of a white theme being no background', () => {
    const page = spread([], { background: '#123456', backgroundToken: 'paper' });
    expect(themedSpread(page, tropical).background).toBe(tropical.palette.paper);
    expect(themedSpread(page, bookThemeOf('grid-badge')).background).toBeNull();
    expect(themedSpread(spread([], { backgroundToken: 'accent' }), nordic).background).toBe(nordic.palette.accent);
    const still = spread([text()]);
    expect(themedSpread(still, nordic)).toBe(still);
  });

  it('BKTHAP-006: keeps the theme on the book, recolours only the pages named, parked elements too', () => {
    const a = spread([text({ token: 'ink' })], { id: 'a' });
    const b = spread([text({ token: 'ink' })], { id: 'b', parked: [text({ id: 't2', token: 'accent' })] });
    const doc = book([a, b]);
    const done = applyBookTheme(doc, nordic, { spreadIds: ['b'] });
    expect(done.theme).toEqual(nordic);
    expect(done.spreads[0]).toBe(doc.spreads[0]);
    expect(done.spreads[1]?.parked[0]).toMatchObject({ color: nordic.palette.accent });
    expect(changedSpreadIds(doc, done)).toEqual(['b']);
  });
});

describe('adopting what is not linked', () => {
  const page = (elements: BookElement[], over: Record<string, unknown> = {}) => spread(elements, over);

  it('BKTHAP-007: links the paper, dark words to the ink and small grey ones to the muted ink', () => {
    const dark = text({ id: 'a', color: '#1a1a1a', size: 20 });
    const grey = text({ id: 'b', color: '#6b6b6b', size: 7 });
    const sp = page([dark, grey]);
    const done = adoptSpread(sp, adoptionMap(book([sp]), null), null);
    expect(done.backgroundToken).toBe('paper');
    expect(done.elements.map((e) => (e.kind === 'text' ? [e.token, e.fontRole] : null))).toEqual([
      ['ink', 'heading'],
      ['muted', 'body'],
    ]);
  });

  it('BKTHAP-008: leaves white words over a photo, a scrim and a locked element alone', () => {
    const white = text({ id: 'w', color: '#ffffff', size: 30 });
    const scrim = shape({ id: 'sc', fill: '#111111', gradient: 'up' });
    const locked = text({ id: 'l', color: '#1a1a1a', locked: true });
    const sp = page([photo(), scrim, white, locked]);
    const done = adoptSpread(sp, adoptionMap(book([sp]), null), null);
    const byId = new Map(done.elements.map((e) => [e.id, e]));
    // The page's own objects come back, the parse having copied the ones handed in.
    const own = new Map(sp.elements.map((e) => [e.id, e]));
    expect(byId.get('sc')).toBe(own.get('sc'));
    expect(byId.get('l')).toBe(own.get('l'));
    expect((byId.get('w') as BookElement & { token?: string }).token).toBeUndefined();
    expect('token' in (byId.get('w') as object)).toBe(false);
  });

  it('BKTHAP-009: takes white words on a dark page as the ink, the page as the paper', () => {
    const sp = page([text({ color: '#ffffff' })], { background: '#111111' });
    const done = adoptSpread(sp, adoptionMap(book([sp]), null), null);
    expect(done.backgroundToken).toBe('paper');
    expect(done.elements[0]).toMatchObject({ token: 'ink' });
  });

  it('BKTHAP-010: ranks the book coloured inks into the three accents, a fourth going to the nearest', () => {
    const els = [
      shape({ id: 'a', fill: '#c2410c' }),
      shape({ id: 'b', fill: '#c2410c' }),
      shape({ id: 'c', fill: '#1e3a8a' }),
      icon({ id: 'd', color: '#0f766e' }),
      text({ id: 'e', color: '#1d3d90', size: 30 }),
    ];
    const sp = page(els);
    const map = adoptionMap(book([sp]), null);
    expect(map.get('#c2410c')).toBe('accent');
    expect(new Set([map.get('#1e3a8a'), map.get('#0f766e'), map.get('#1d3d90')])).toEqual(
      new Set(['accent2', 'accent3']),
    );
    expect(map.get('#1d3d90')).toBe(map.get('#1e3a8a'));
  });

  it('BKTHAP-011: keeps the roles of a previous theme, its colours and its faces', () => {
    const prev = bookThemeOf('postcard');
    const els = [
      text({ id: 'a', color: prev.palette.accent2, font: prev.fonts.display.font, size: 40 }),
      shape({ id: 'b', fill: prev.palette.accent3 }),
    ];
    const sp = page(els, { background: prev.palette.paper, role: 'cover' });
    const done = adoptSpread(sp, adoptionMap(book([sp]), prev), prev);
    expect(done.backgroundToken).toBe('paper');
    expect(done.elements[0]).toMatchObject({ token: 'accent2', fontRole: 'display' });
    expect(done.elements[1]).toMatchObject({ token: 'accent3' });
  });

  it('BKTHAP-012: adopts on apply, so a book made by hand takes the theme, and a cover title its display face', () => {
    const title = text({ id: 'title', color: '#1a1a1a', size: 48 });
    const sp = page([title], { role: 'cover' });
    const done = applyBookTheme(book([sp]), tropical, { adopt: true });
    const cover = done.spreads[0] as BookSpread;
    expect(cover.background).toBe(tropical.palette.paper);
    expect(cover.elements[0]).toMatchObject({
      token: 'ink',
      fontRole: 'display',
      color: tropical.palette.ink,
      font: tropical.fonts.display.font,
    });
    // Without adopt, nothing was linked, and only the theme is kept.
    const doc = book([sp]);
    const plain = applyBookTheme(doc, tropical);
    expect(plain.spreads[0]).toBe(doc.spreads[0]);
    expect(plain.theme).toEqual(tropical);
  });
});
