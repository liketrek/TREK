import { spreadFindings } from './book-findings';
import { applyBookOps } from './book-ops';
import type { BookOpsContext } from './book-ops-core';
import type { BookPageOpInput } from './book-ops.schema';
import { blankBook } from './book-pages';
import {
  bookStickerElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
} from './book.schema';
import { describeSpread } from './describe-spread';
import { bookStickerLookup } from './stickers/sticker-catalogue';

import { describe, expect, it } from 'vitest';

// BOOKSTK-001 to BOOKSTK-007

/**
 * The sticker kind in the edit engine: placed from the library the context
 * hands in, at the panel's size, in its own colours or chosen ones cut to its
 * slots; restyled, flipped, described, and refused when the library is absent
 * or does not hold the id. The page is the default square book, 210 mm pages.
 */

let seq = 0;
const newId = (p: string) => `${p}-n${++seq}`;

function book(elements: BookElement[] = []): BookDocument {
  const doc = blankBook({ title: 'Sicily', newId: (p) => `${p}-x` });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements };
  return { ...doc, spreads };
}

const withStickers: BookOpsContext = { stickers: bookStickerLookup };
const run = (doc: BookDocument, ops: BookPageOpInput[], ctx: BookOpsContext = withStickers) =>
  applyBookOps(doc, { spreadId: 'sp-in', ops }, { newId, ...ctx });
const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;

function placed(result: ReturnType<typeof applyBookOps>): BookElement {
  if (!result.ok) throw new Error(`refused: ${result.error.code} ${result.error.message}`);
  return inner(result.doc).elements.at(-1) as BookElement;
}

/** The findings of the inner page that name a sticker. */
const findingsOf = (doc: BookDocument) =>
  spreadFindings(inner(doc), doc.page).filter((f) => f.elementIds.some((id) => id.startsWith('k')));

const sticker = (id: string, stickerId = 'lemon', over: Record<string, unknown> = {}) =>
  bookStickerElementSchema.parse({ id, kind: 'sticker', frame: { x: 240, y: 30, w: 60, h: 48 }, stickerId, ...over });

describe('adding a sticker', () => {
  it('BOOKSTK-001: places it at the panel size, in its proportions, centred on the right-hand page', () => {
    const lemon = placed(run(book(), [{ op: 'add', element: { kind: 'sticker', stickerId: 'lemon' } }]));
    expect(lemon).toMatchObject({ kind: 'sticker', stickerId: 'lemon', colors: [], flipX: false, rotation: 0 });
    // The lemon is drawn 100 by 80: its longer side three tenths of the 210 mm page.
    expect(lemon.frame).toEqual({ x: 283.5, y: 79.8, w: 63, h: 50.4 });
    const tilted = placed(
      run(book(), [
        {
          op: 'add',
          element: { kind: 'sticker', stickerId: 'eiffelTower', flipX: true, opacity: 0.8 },
          frame: { x: 20, y: 20, w: 40, h: 60 },
          rotation: -6,
        },
      ]),
    );
    expect(tilted).toMatchObject({ frame: { x: 20, y: 20, w: 40, h: 60 }, rotation: -6, flipX: true, opacity: 0.8 });
  });

  it('BOOKSTK-002: keeps the colours asked for, cut to the slots the drawing has', () => {
    // The lemon has two slots, the lemon and its leaves.
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff'];
    const lemon = placed(run(book(), [{ op: 'add', element: { kind: 'sticker', stickerId: 'lemon', colors } }]));
    expect(lemon).toMatchObject({ colors: ['#ff0000', '#00ff00'] });
  });

  it('BOOKSTK-003: refuses an id the library does not hold, and any sticker where no library was handed in', () => {
    const unknown = run(book(), [{ op: 'add', element: { kind: 'sticker', stickerId: 'unicornCastle' } }]);
    expect(unknown.ok ? null : unknown.error).toMatchObject({ code: 'sticker_unknown', opIndex: 0 });
    expect(unknown.ok ? '' : unknown.error.message).toMatch(/list_book_assets/);
    const bare = run(book(), [{ op: 'add', element: { kind: 'sticker', stickerId: 'lemon' } }], {});
    expect(bare.ok ? null : bare.error.code).toBe('sticker_unknown');
    const badId = run(book(), [{ op: 'add', element: { kind: 'sticker', stickerId: 'Not An Id' } }]);
    expect(badId.ok ? null : badId.error.code).toBe('invalid_op');
  });
});

describe('restyling a sticker', () => {
  it('BOOKSTK-004: recolours, flips and fades it, and puts its own colours back with an empty list', () => {
    const doc = book([sticker('k1')]);
    const styled = run(doc, [
      { op: 'style', elementId: 'k1', set: { kind: 'sticker', colors: ['#123456'], flipX: true, opacity: 0.5 } },
    ]);
    expect(placed(styled)).toMatchObject({ colors: ['#123456'], flipX: true, opacity: 0.5 });
    const back = run(book([sticker('k1', 'lemon', { colors: ['#123456'] })]), [
      { op: 'style', elementId: 'k1', set: { kind: 'sticker', colors: [] } },
    ]);
    expect(placed(back)).toMatchObject({ colors: [] });
    const wrong = run(doc, [{ op: 'style', elementId: 'k1', set: { kind: 'icon', color: '#000000' } }]);
    expect(wrong.ok ? null : wrong.error.code).toBe('wrong_kind');
  });

  it('BOOKSTK-005: duplicates and arranges like every other element', () => {
    const doc = book([sticker('k1'), sticker('k2', 'sun')]);
    const result = run(doc, [
      { op: 'duplicate', elementIds: ['k1'] },
      { op: 'arrange', elementIds: ['k1'], to: 'front' },
    ]);
    if (!result.ok) throw new Error(result.error.message);
    const kinds = inner(result.doc).elements.map((e) => (e.kind === 'sticker' ? e.stickerId : e.kind));
    expect(kinds).toEqual(['sun', 'lemon', 'lemon']);
  });
});

describe('a sticker in words', () => {
  it('BOOKSTK-006: describe_book_page names the sticker, its colours and a flip', () => {
    const doc = book([sticker('k1', 'hibiscus', { colors: ['#ff8800'], flipX: true, rotation: 8 })]);
    const text = describeSpread(doc, 'sp-in')?.text ?? '';
    expect(text).toMatch(/sticker k1 at 240, 30, 60 x 48: sticker hibiscus, colours #ff8800, flipped; turned 8 deg/);
    expect(describeSpread(book([sticker('k2')]), 'sp-in')?.text).toMatch(/: sticker lemon$/m);
  });

  it('BOOKSTK-007: a sticker over words is a warning on the page, one under them is not', () => {
    const words = bookTextElementSchema.parse({
      id: 't1',
      kind: 'text',
      frame: { x: 240, y: 30, w: 60, h: 20 },
      text: 'Palermo',
      size: 20,
    });
    expect(findingsOf(book([words, sticker('k1')]))).toEqual([
      expect.objectContaining({ code: 'overlap', severity: 'warn', elementIds: ['k1', 't1'] }),
    ]);
    expect(findingsOf(book([sticker('k1'), words]))).toEqual([]);
    // Faded nearly away, it hides nothing.
    expect(findingsOf(book([words, sticker('k1', 'lemon', { opacity: 0.2 })]))).toEqual([]);
  });
});
