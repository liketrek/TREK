import { applyBookOps } from './book-ops';
import type { BookOpsContext } from './book-ops-core';
import type { BookPageOpInput } from './book-ops.schema';
import { blankBook } from './book-pages';
import { bookAddLockupOpSchema } from './book-text-ops.schema';
import {
  bookSpreadSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
  type BookTextElement,
} from './book.schema';
import { describeSpread } from './describe-spread';

import { describe, expect, it } from 'vitest';

/**
 * The assistant's side of the text effects and the lockups: `style` and `add`
 * set every effect the inspector sets, `add_lockup` places what the shelf
 * places, a fitted text is solved after the operations, and the page in words
 * says what each text carries.
 */

let seq = 0;
const newId = (p: string) => `${p}-n${++seq}`;

const text = (id: string, over: Record<string, unknown> = {}) =>
  bookTextElementSchema.parse({
    id,
    kind: 'text',
    frame: { x: 230, y: 40, w: 120, h: 30 },
    text: 'Lisbon',
    size: 24,
    ...over,
  }) as BookElement;

function book(elements: BookElement[]): BookDocument {
  const doc = blankBook({ title: 'Lisbon', newId: (p) => `${p}-x` });
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: i === 2 ? 'sp-in' : `sp-${i}` }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements };
  return { ...doc, spreads };
}

const gallery = [{ photoId: 1, width: 4000, height: 3000 }];
const ctx: BookOpsContext = { photos: gallery };
const run = (doc: BookDocument, ops: BookPageOpInput[]) =>
  applyBookOps(doc, { spreadId: 'sp-in', ops }, { newId, ...ctx });
const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;

function ok(result: ReturnType<typeof applyBookOps>): BookDocument {
  if (!result.ok) throw new Error(`refused: ${result.error.code} ${result.error.message}`);
  expect(bookSpreadSchema.safeParse(inner(result.doc)).success).toBe(true);
  return result.doc;
}
const refusal = (result: ReturnType<typeof applyBookOps>) => (result.ok ? null : result.error.code);
const only = (doc: BookDocument, id = 't1') => inner(doc).elements.find((e) => e.id === id) as BookTextElement;

describe('style sets the effects of a text', () => {
  it('BKTOP-001: sets each effect, and null takes one off again', () => {
    const doc = ok(
      run(book([text('t1')]), [
        {
          op: 'style',
          elementId: 't1',
          set: {
            kind: 'text',
            transform: 'upper',
            vAlign: 'bottom',
            outline: { color: '#ffffff', width: 0.4 },
            shadow: { dx: 1, dy: 1.5, color: '#111111' },
            highlight: { color: '#111111', padX: 2 },
            curve: { type: 'arc', bend: 30 },
          },
        },
      ]),
    );
    expect(only(doc)).toMatchObject({
      transform: 'upper',
      vAlign: 'bottom',
      outline: { color: '#ffffff', width: 0.4 },
      shadow: { dx: 1, dy: 1.5, color: '#111111', alpha: 1 },
      highlight: { color: '#111111', padX: 2, padY: 0.3 },
      curve: { type: 'arc', bend: 30, start: 0 },
    });
    const off = ok(run(doc, [{ op: 'style', elementId: 't1', set: { kind: 'text', outline: null, curve: null } }]));
    expect(only(off).outline).toBeNull();
    expect(only(off).curve).toBeNull();
    expect(only(off).shadow).toMatchObject({ dx: 1 });
  });

  it('BKTOP-002: fills the letters only with a photo of the gallery', () => {
    const fill = { type: 'photo' as const, photoId: 1, zoom: 1.5 };
    const doc = ok(run(book([text('t1')]), [{ op: 'style', elementId: 't1', set: { kind: 'text', fillPaint: fill } }]));
    expect(only(doc).fillPaint).toMatchObject({ type: 'photo', photoId: 1, zoom: 1.5, focalX: 0.5 });
    const stranger = { type: 'photo' as const, photoId: 99 };
    expect(
      refusal(run(book([text('t1')]), [{ op: 'style', elementId: 't1', set: { kind: 'text', fillPaint: stranger } }])),
    ).toBe('photo_not_in_gallery');
    expect(refusal(run(book([]), [{ op: 'add', element: { kind: 'text', text: 'Porto', fillPaint: stranger } }]))).toBe(
      'photo_not_in_gallery',
    );
  });

  it('BKTOP-013: styles a text whose fill photo left the gallery since, and checks only a fill it sets', () => {
    const gone = text('t1', { fillPaint: { type: 'photo', photoId: 42 } });
    const resized = ok(run(book([gone]), [{ op: 'style', elementId: 't1', set: { kind: 'text', size: 40 } }]));
    expect(only(resized)).toMatchObject({ size: 40, fillPaint: { type: 'photo', photoId: 42 } });
    const tinted = ok(run(book([gone]), [{ op: 'style', elementId: 't1', set: { kind: 'text', color: '#c0392b' } }]));
    expect(only(tinted).color).toBe('#c0392b');
    const cleared = ok(run(book([gone]), [{ op: 'style', elementId: 't1', set: { kind: 'text', fillPaint: null } }]));
    expect(only(cleared).fillPaint).toBeNull();
    const again = { type: 'photo' as const, photoId: 42 };
    expect(
      refusal(run(book([gone]), [{ op: 'style', elementId: 't1', set: { kind: 'text', fillPaint: again } }])),
    ).toBe('photo_not_in_gallery');
  });

  it('BKTOP-003: refuses an effect value the document cannot hold', () => {
    const bad = run(book([text('t1')]), [
      { op: 'style', elementId: 't1', set: { kind: 'text', outline: { color: '#ffffff', width: 9 } } },
    ]);
    expect(refusal(bad)).toBe('invalid_op');
  });

  it('BKTOP-004: adds a text with its effects in one operation', () => {
    const doc = ok(
      run(book([]), [
        {
          op: 'add',
          element: {
            kind: 'text',
            preset: 'heading',
            text: 'Sintra',
            transform: 'smallcaps',
            shadow: { dx: 1, dy: 1, color: '#c2410c' },
          },
        },
      ]),
    );
    const el = inner(doc).elements.at(-1) as BookTextElement;
    expect(el).toMatchObject({ text: 'Sintra', size: 30, transform: 'smallcaps', shadow: { color: '#c2410c' } });
  });
});

describe('a text set to fit its frame', () => {
  const long = 'Two weeks along the Portuguese coast';

  it('BKTOP-005: is solved after the operations, keeping the size asked for as its ceiling', () => {
    const doc = ok(
      run(book([text('t1', { text: long, size: 60 })]), [
        { op: 'style', elementId: 't1', set: { kind: 'text', fit: 'shrink' } },
      ]),
    );
    expect(only(doc).size).toBeLessThan(60);
    expect(only(doc).fitMax).toBe(60);
    expect(describeSpread(doc, 'sp-in')?.findings.some((f) => f.code === 'text_overflow')).toBe(false);
  });

  it('BKTOP-006: takes a new size as the new ceiling', () => {
    const fitted = ok(
      run(book([text('t1', { text: long, size: 60 })]), [
        { op: 'style', elementId: 't1', set: { kind: 'text', fit: 'shrink' } },
      ]),
    );
    const doc = ok(run(fitted, [{ op: 'style', elementId: 't1', set: { kind: 'text', size: 12 } }]));
    expect(only(doc)).toMatchObject({ size: 12, fitMax: 12 });
  });
});

describe('add_lockup', () => {
  it('BKTOP-007: places a lockup on the right-hand page, its words by role and every text fitted', () => {
    const doc = ok(
      run(book([]), [
        { op: 'add_lockup', lockup: 'poster-stack', words: { title: 'Lisbon', subtitle: 'Summer', year: '2026' } },
      ]),
    );
    const els = inner(doc).elements;
    expect(els.map((e) => (e.kind === 'text' ? e.text : e.kind))).toEqual(['Lisbon', 'Summer', '2026']);
    for (const e of els) expect(e.frame.x).toBeGreaterThan(210);
    expect(els.every((e) => e.kind === 'text' && e.fit === 'shrink')).toBe(true);
    // One group, so the set moves as one.
    expect(els[0]?.group).toBeTruthy();
    expect(new Set(els.map((e) => e.group)).size).toBe(1);
  });

  it('BKTOP-008: sets the lockup into a box, in the colours given, a photo word filled from the gallery', () => {
    const doc = ok(
      run(book([]), [
        {
          op: 'add_lockup',
          lockup: 'photo-word',
          words: { title: 'Porto', kicker: 'Travel journal' },
          box: { x: 10, y: 10, w: 150, h: 75 },
          ink: '#202020',
          accent: '#0f766e',
          photoId: 1,
        },
      ]),
    );
    const [kicker, title] = inner(doc).elements as BookTextElement[];
    expect(kicker?.color).toBe('#202020');
    expect(title?.fillPaint).toMatchObject({ type: 'photo', photoId: 1 });
    expect(title?.frame.x).toBeGreaterThanOrEqual(10);
    expect((title?.frame.x ?? 0) + (title?.frame.w ?? 0)).toBeLessThanOrEqual(160.01);
  });

  it('BKTOP-009: refuses a lockup without words, a photo outside the gallery and a page too full for it', () => {
    expect(refusal(run(book([]), [{ op: 'add_lockup', lockup: 'postmark', words: {} }]))).toBe('text_required');
    expect(
      refusal(run(book([]), [{ op: 'add_lockup', lockup: 'photo-word', words: { title: 'Porto' }, photoId: 42 }])),
    ).toBe('photo_not_in_gallery');
    const full = Array.from({ length: 89 }, (_, i) => text(`f${i}`));
    expect(
      refusal(
        run(book(full), [{ op: 'add_lockup', lockup: 'poster-stack', words: { title: 'Lisbon', year: '2026' } }]),
      ),
    ).toBe('too_many_elements');
  });

  it('BKTOP-010: takes only the lockups and the roles it knows', () => {
    expect(bookAddLockupOpSchema.safeParse({ op: 'add_lockup', lockup: 'banner', words: { title: 'A' } }).success).toBe(
      false,
    );
    expect(bookAddLockupOpSchema.safeParse({ op: 'add_lockup', lockup: 'stamp', words: { motto: 'A' } }).success).toBe(
      false,
    );
    expect(
      bookAddLockupOpSchema.safeParse({ op: 'add_lockup', lockup: 'stamp', words: { place: 'Faro' } }).success,
    ).toBe(true);
  });
});

describe('the page in words', () => {
  it('BKTOP-011: says what effects each text carries, in the terms style sets them by', () => {
    const doc = book([
      text('t1', {
        transform: 'upper',
        vAlign: 'middle',
        outline: { color: '#ffffff', width: 0.4 },
        shadow: { dx: 1, dy: 1, color: '#111111' },
        highlight: { color: '#c2410c' },
        fit: 'shrink',
        fitMax: 30,
      }),
      text('t2', { curve: { type: 'circle', start: 90 }, fillPaint: { type: 'solid', color: '#111111', alpha: 0 } }),
      text('t3', { curve: { type: 'arc', bend: 20 }, fillPaint: { type: 'photo', photoId: 1 } }),
      text('t4'),
    ]);
    const words = describeSpread(doc, 'sp-in')?.text ?? '';
    expect(words).toContain(
      'capitals, set at the middle of its frame, outline #ffffff 0.4 mm, hard shadow #111111 offset 1/1 mm, on a band of #c2410c, shrunk to fit (chosen 30 pt)',
    );
    expect(words).toContain('hollow letters (outline only), round a circle, centred at 90 deg');
    expect(words).toContain('letters filled with photo 1 (focal 0.50/0.50, zoom 1), on an arc, bend 20');
    expect(words).toContain('sans (heading) 24 pt, left, #1a1a1a: "Lisbon"');
  });

  it('BKTOP-012: says a translucent fill by its alpha', () => {
    const doc = book([text('t1', { fillPaint: { type: 'solid', color: '#111111', alpha: 0.5 } })]);
    expect(describeSpread(doc, 'sp-in')?.text).toContain('fill #111111 at alpha 0.5');
  });
});
