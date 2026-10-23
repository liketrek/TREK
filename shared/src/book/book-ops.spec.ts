import { applyBookOps } from './book-ops';
import type { BookOpsContext } from './book-ops-core';
import type { BookPageOpInput } from './book-ops.schema';
import { blankBook } from './book-pages';
import {
  MAX_SPREAD_ELEMENTS,
  bookLayoutSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookPhotoElement,
  type BookSpread,
  type BookTextElement,
} from './book.schema';

import { describe, expect, it } from 'vitest';

/**
 * The page edit engine: every operation, the lock, the gallery and the caps,
 * and that a refused call changes nothing.
 */

let seq = 0;
const newId = (p: string) => `${p}-n${++seq}`;

const photo = (id: string, photoId: number | null, frame = { x: 230, y: 20, w: 80, h: 60 }, over = {}) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId, ...over }) as BookPhotoElement;
const text = (id: string, words: string, size = 10, over = {}) =>
  bookTextElementSchema.parse({
    id,
    kind: 'text',
    frame: { x: 230, y: 120, w: 160, h: 40 },
    text: words,
    size,
    ...over,
  }) as BookTextElement;
const shape = (id: string, over = {}) =>
  bookShapeElementSchema.parse({ id, kind: 'shape', frame: { x: 0, y: 0, w: 420, h: 10 }, ...over }) as BookElement;

/** A blank book whose inner spread holds `elements`. */
function book(elements: BookElement[], over: Partial<BookSpread> = {}): BookDocument {
  const doc = blankBook({ title: 'Iceland' });
  const spreads = doc.spreads.map((s, i) => ({
    ...s,
    id: ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'][i] as string,
  }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements, ...over };
  return { ...doc, spreads };
}

const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;
const el = (doc: BookDocument, id: string, spread = 2) => doc.spreads[spread]?.elements.find((e) => e.id === id);
const run = (doc: BookDocument, ops: BookPageOpInput[], ctx: BookOpsContext = {}, spreadId = 'sp-in') =>
  applyBookOps(doc, { spreadId, ops }, { newId, ...ctx });

function ok(result: ReturnType<typeof applyBookOps>): BookDocument {
  if (!result.ok) throw new Error(`refused: ${result.error.code} ${result.error.message}`);
  return result.doc;
}

const gallery = [
  { photoId: 1, caption: 'Harbour', width: 4000, height: 3000 },
  { photoId: 2, caption: null, width: 3000, height: 4000 },
  { photoId: 3, caption: 'Glacier' },
  { photoId: 4 },
];

describe('layout', () => {
  it('BOOKOPS-001: pours the page into a built-in layout and parks what it has no room for', () => {
    const doc = book([photo('a', 1), photo('b', 2), text('h', 'Title', 22)]);
    const r = run(doc, [{ op: 'layout', template: 'full-text' }]);
    const out = inner(ok(r));
    expect(out.elements.filter((e) => e.kind === 'photo').map((e) => (e as BookPhotoElement).photoId)).toEqual([1]);
    expect(out.parked.map((e) => (e.kind === 'photo' ? e.photoId : e.kind))).toEqual([2]);
    expect(r.ok && r.created.length).toBe(out.elements.length);
  });

  it('BOOKOPS-002: refuses a cover layout on a double spread and a spread layout on the cover', () => {
    const doc = book([]);
    const a = run(doc, [{ op: 'layout', template: 'cover-band' }]);
    expect(!a.ok && a.error).toMatchObject({ code: 'layout_role', opIndex: 0 });
    const b = run(doc, [{ op: 'layout', template: 'grid-4' }], {}, 'sp-cover');
    expect(!b.ok && b.error.code).toBe('layout_role');
    expect(ok(run(doc, [{ op: 'layout', template: 'cover-band' }], {}, 'sp-cover')).spreads[0]?.elements).toHaveLength(
      1,
    );
  });

  it('BOOKOPS-003: leaves a locked element where it is, in its place in the paint order', () => {
    const panel = shape('panel', { locked: true });
    const doc = book([panel, photo('a', 1), text('h', 'Title', 22)]);
    const out = inner(ok(run(doc, [{ op: 'layout', template: 'grid-4' }])));
    expect(out.elements[0]).toBe(panel);
    expect(out.elements.filter((e) => e.kind === 'photo')).toHaveLength(4);
  });

  it('BOOKOPS-004: lays the photos out on a grid and leaves words and shapes where they are', () => {
    const doc = book([shape('bg'), photo('a', 1), text('t', 'Words'), photo('b', 2), photo('c', 3)], {
      parked: [photo('p', 4), text('pt', 'Parked')],
    });
    const out = inner(ok(run(doc, [{ op: 'layout', grid: 'two-across' }])));
    expect(out.elements.map((e) => e.kind)).toEqual(['shape', 'photo', 'photo', 'text']);
    expect(out.elements.filter((e) => e.kind === 'photo').map((e) => (e as BookPhotoElement).photoId)).toEqual([1, 2]);
    expect(out.parked.map((e) => (e.kind === 'photo' ? e.photoId : e.id))).toEqual([3, 4, 'pt']);
    expect(el(ok(run(doc, [{ op: 'layout', grid: 'grid-4' }])), 't')).toBe(doc.spreads[2]?.elements[2]);
  });

  it('BOOKOPS-005: puts a grid at the back of a page that had no photo', () => {
    const out = inner(ok(run(book([text('t', 'Words')]), [{ op: 'layout', grid: 'single' }])));
    expect(out.elements.map((e) => e.kind)).toEqual(['photo', 'text']);
  });

  it("BOOKOPS-006: uses one of the book's own layouts, by id or by name, for the kind of page it was drawn on", () => {
    const layout = bookLayoutSchema.parse({
      id: 'ly-1',
      name: 'Hero',
      role: 'inner',
      pageWidth: 210,
      pageHeight: 210,
      elements: [photo('lp', null)],
    });
    const doc = { ...book([photo('a', 1)]), layouts: [layout] };
    expect(el(ok(run(doc, [{ op: 'layout', saved: 'ly-1' }])), 'a')).toBeUndefined();
    expect(inner(ok(run(doc, [{ op: 'layout', saved: 'Hero' }]))).elements[0]).toMatchObject({ photoId: 1 });
    const missing = run(doc, [{ op: 'layout', saved: 'nope' }]);
    expect(!missing.ok && missing.error.code).toBe('layout_not_found');
    const cover = run(doc, [{ op: 'layout', saved: 'ly-1' }], {}, 'sp-cover');
    expect(!cover.ok && cover.error.code).toBe('layout_role');
  });

  it('BOOKOPS-007: asks for exactly one of template, grid or saved', () => {
    const none = run(book([]), [{ op: 'layout' }]);
    expect(!none.ok && none.error).toMatchObject({ code: 'invalid_op', opIndex: 0 });
    const two = run(book([]), [
      { op: 'background', color: null },
      { op: 'layout', template: 'grid-4', grid: 'single' },
    ]);
    expect(!two.ok && two.error).toMatchObject({ code: 'invalid_op', opIndex: 1 });
  });

  it('BOOKOPS-008: refuses a layout that with the locked elements would exceed the page cap', () => {
    const locked = Array.from({ length: MAX_SPREAD_ELEMENTS - 2 }, (_, i) => shape(`s${i}`, { locked: true }));
    const r = run(book(locked), [{ op: 'layout', template: 'grid-4' }]);
    expect(!r.ok && r.error.code).toBe('too_many_elements');
  });
});

describe('place_photo', () => {
  it('BOOKOPS-009: fills a frame by id; a new picture starts at the centre, the same one keeps its focal point', () => {
    const doc = book([photo('a', 1, undefined, { focalX: 0.2, focalY: 0.9, fit: 'contain' })]);
    expect(el(ok(run(doc, [{ op: 'place_photo', photoId: 2, target: { elementId: 'a' } }])), 'a')).toMatchObject({
      photoId: 2,
      focalX: 0.5,
      focalY: 0.5,
      fit: 'contain',
    });
    expect(el(ok(run(doc, [{ op: 'place_photo', photoId: 1, target: { elementId: 'a' } }])), 'a')).toMatchObject({
      focalX: 0.2,
    });
    const given = [{ op: 'place_photo', photoId: 2, target: { elementId: 'a' }, fit: 'cover', focalX: 0.1 }] as const;
    expect(el(ok(run(doc, [...given])), 'a')).toMatchObject({ fit: 'cover', focalX: 0.1 });
  });

  it("BOOKOPS-010: fills a frame by its place among the page's frames", () => {
    const doc = book([photo('a', null), text('t', 'x'), photo('b', null)]);
    expect(el(ok(run(doc, [{ op: 'place_photo', photoId: 3, target: { slot: 1 } }])), 'b')).toMatchObject({
      photoId: 3,
    });
    const r = run(doc, [{ op: 'place_photo', photoId: 3, target: { slot: 2 } }]);
    expect(!r.ok && r.error.code).toBe('slot_not_found');
  });

  it("BOOKOPS-011: places a new frame in the photo's proportions on the right-hand page, and takes it out of parked", () => {
    const doc = book([], { parked: [photo('pk', 2)] });
    const r = run(doc, [{ op: 'place_photo', photoId: 2, target: 'new' }], { photos: gallery });
    const out = inner(ok(r));
    const added = out.elements[0] as BookPhotoElement;
    expect(added).toMatchObject({ id: r.ok ? r.created[0] : '', photoId: 2, frame: { y: 52.5, w: 78.75, h: 105 } });
    expect(added.frame.x).toBeGreaterThan(210);
    expect(out.parked).toEqual([]);
    const cover = ok(run(doc, [{ op: 'place_photo', photoId: 1, target: 'new' }], { photos: gallery }, 'sp-cover'));
    expect(cover.spreads[0]?.elements[0]?.frame).toEqual({ x: 52.5, y: 65.63, w: 105, h: 78.75 });
  });

  it('BOOKOPS-012: takes only gallery photos when it knows the gallery', () => {
    const doc = book([photo('a', null)]);
    const r = run(doc, [{ op: 'place_photo', photoId: 99, target: { elementId: 'a' } }], { photos: gallery });
    expect(!r.ok && r.error.code).toBe('photo_not_in_gallery');
    expect(ok(run(doc, [{ op: 'place_photo', photoId: 99, target: { elementId: 'a' } }]))).toBeTruthy();
  });

  it('BOOKOPS-013: refuses a locked frame, a text, an unknown id and a parked one, saying which', () => {
    const doc = book([photo('a', 1, undefined, { locked: true }), text('t', 'x')], { parked: [photo('pk', 2)] });
    const codes = ['a', 't', 'zz', 'pk'].map((id) => {
      const r = run(doc, [{ op: 'place_photo', photoId: 3, target: { elementId: id } }]);
      return r.ok ? null : [r.error.code, r.error.elementId];
    });
    expect(codes).toEqual([
      ['locked', 'a'],
      ['wrong_kind', 't'],
      ['element_not_found', 'zz'],
      ['element_not_found', 'pk'],
    ]);
    const parked = run(doc, [{ op: 'place_photo', photoId: 3, target: { elementId: 'pk' } }]);
    expect(!parked.ok && parked.error.message).toMatch(/parked/);
  });

  it('BOOKOPS-014: refuses a new frame on a full page', () => {
    const full = Array.from({ length: MAX_SPREAD_ELEMENTS }, (_, i) => shape(`s${i}`));
    const r = run(book(full), [{ op: 'place_photo', photoId: 1, target: 'new' }]);
    expect(!r.ok && r.error.code).toBe('too_many_elements');
  });
});

describe('photo_look and swap_photos', () => {
  it('BOOKOPS-015: sets only the look it names', () => {
    const doc = book([photo('a', 1, undefined, { filter: 'bw', frameStyle: 'white' })]);
    const out = el(
      ok(run(doc, [{ op: 'photo_look', elementId: 'a', mask: 'heart', radius: 2.345, focalY: 0.3 }])),
      'a',
    );
    expect(out).toMatchObject({
      mask: 'heart',
      radius: 2.35,
      focalY: 0.3,
      filter: 'bw',
      frameStyle: 'white',
      focalX: 0.5,
    });
    const all = el(
      ok(
        run(doc, [
          { op: 'photo_look', elementId: 'a', fit: 'contain', focalX: 0.1, frameStyle: 'none', filter: 'warm' },
        ]),
      ),
      'a',
    );
    expect(all).toMatchObject({ fit: 'contain', focalX: 0.1, frameStyle: 'none', filter: 'warm' });
    expect(run(doc, [{ op: 'photo_look', elementId: 'a' }]).ok).toBe(false);
  });

  it('BOOKOPS-016: swaps the pictures, keeps the frames, and moves a caption with its picture', () => {
    const a = photo('a', 1, { x: 20, y: 20, w: 80, h: 60 }, { focalX: 0.2, frameStyle: 'polaroid' });
    const b = photo('b', 2, { x: 230, y: 100, w: 80, h: 40 }, { focalX: 0.8 });
    const cap = text('c', 'Harbour', 7.5, {
      frame: { x: 20, y: 82, w: 80, h: 5 },
      binding: { source: 'photo.caption', photoId: 1 },
    });
    const out = ok(run(book([a, b, cap]), [{ op: 'swap_photos', a: 'a', b: 'b' }]));
    expect(el(out, 'a')).toMatchObject({ photoId: 2, focalX: 0.8, frameStyle: 'polaroid', frame: a.frame });
    expect(el(out, 'b')).toMatchObject({ photoId: 1, focalX: 0.2 });
    expect(el(out, 'c')?.frame).toEqual({ x: 230, y: 142, w: 80, h: 5 });
  });

  it('BOOKOPS-017: refuses swapping a frame with itself, a locked frame or a locked caption', () => {
    const doc = book([
      photo('a', 1),
      photo('b', 2, undefined, { locked: true }),
      photo('c', 3),
      text('cap', 'x', 7.5, { locked: true, binding: { source: 'photo.caption', photoId: 3 } }),
    ]);
    expect(run(doc, [{ op: 'swap_photos', a: 'a', b: 'a' }]).ok).toBe(false);
    const locked = run(doc, [{ op: 'swap_photos', a: 'a', b: 'b' }]);
    expect(!locked.ok && locked.error.code).toBe('locked');
    const caption = run(doc, [{ op: 'swap_photos', a: 'a', b: 'c' }]);
    expect(!caption.ok && caption.error.elementId).toBe('cap');
  });
});

describe('text', () => {
  const journey = {
    title: 'Iceland',
    subtitle: 'Summer',
    entries: [{ id: 7, title: 'Reykjavik', story: ' A day. ', location: 'Harbour' }],
  };

  it('BOOKOPS-018: sets the words and the type of a text by id', () => {
    const doc = book([text('t', 'Old', 10)]);
    const out = el(
      ok(
        run(doc, [
          {
            op: 'text',
            elementId: 't',
            text: 'New',
            size: 14,
            font: 'serif',
            align: 'center',
            weight: 600,
            color: '#ff0000',
          },
        ]),
      ),
      't',
    );
    expect(out).toMatchObject({
      text: 'New',
      size: 14,
      font: 'serif',
      align: 'center',
      weight: 600,
      color: '#ff0000',
      overridden: false,
    });
  });

  it('BOOKOPS-019: keeps a bound text bound unless words are given that differ from its source', () => {
    const bound = text('t', 'Iceland', 22, { binding: { source: 'journey.title' } });
    const doc = book([bound]);
    expect(el(ok(run(doc, [{ op: 'text', elementId: 't', size: 30 }])), 't')).toMatchObject({
      overridden: false,
      size: 30,
    });
    expect(el(ok(run(doc, [{ op: 'text', elementId: 't', text: 'Iceland' }], { journey })), 't')).toMatchObject({
      overridden: false,
    });
    expect(el(ok(run(doc, [{ op: 'text', elementId: 't', text: 'Island' }], { journey })), 't')).toMatchObject({
      overridden: true,
      binding: { source: 'journey.title' },
    });
    expect(el(ok(run(doc, [{ op: 'text', elementId: 't', text: 'Iceland' }])), 't')).toMatchObject({
      overridden: true,
    });
  });

  it('BOOKOPS-020: binds a text to the journey, reading the words it can, and unbinds one', () => {
    const doc = book([text('t', 'Old', 10, { overridden: true })]);
    const story = el(
      ok(run(doc, [{ op: 'text', elementId: 't', binding: { source: 'entry.story', entryId: 7 } }], { journey })),
      't',
    );
    expect(story).toMatchObject({ text: 'A day.', overridden: false, binding: { source: 'entry.story', entryId: 7 } });
    const kept = el(
      ok(run(doc, [{ op: 'text', elementId: 't', binding: { source: 'entry.story', entryId: 7 } }])),
      't',
    );
    expect(kept).toMatchObject({ text: 'Old', overridden: false });
    const unbound = el(
      ok(
        run(book([text('b', 'x', 10, { binding: { source: 'journey.title' } })]), [
          { op: 'text', elementId: 'b', binding: null },
        ]),
      ),
      'b',
    );
    expect(unbound).toMatchObject({ binding: null, overridden: false, text: 'x' });
    const blank = run(book([text('e', '')]), [
      { op: 'text', elementId: 'e', binding: { source: 'entry.date', entryId: 7 } },
    ]);
    expect(!blank.ok && blank.error.code).toBe('text_required');
  });

  it('BOOKOPS-021: reads every source it can from the journey and the gallery', () => {
    const ctx = { journey, photos: gallery };
    const words = (binding: object) =>
      (
        el(
          ok(run(book([text('t', 'x')]), [{ op: 'text', elementId: 't', binding } as BookPageOpInput], ctx)),
          't',
        ) as BookTextElement
      ).text;
    expect(words({ source: 'journey.subtitle' })).toBe('Summer');
    expect(words({ source: 'entry.title', entryId: 7 })).toBe('Reykjavik');
    expect(words({ source: 'entry.location', entryId: 7 })).toBe('Harbour');
    expect(words({ source: 'photo.caption', photoId: 1 })).toBe('Harbour');
    const dms = run(book([text('t', 'x')]), [
      { op: 'text', elementId: 't', binding: { source: 'entry.location', entryId: 7, format: 'dms' } },
    ]);
    expect(!dms.ok && dms.error.code).toBe('text_required');
    const stranger = run(book([text('t', 'x')]), [
      { op: 'text', elementId: 't', binding: { source: 'entry.title', entryId: 8 } },
    ]);
    expect(stranger.ok).toBe(true);
    const checked = run(
      book([text('t', 'x')]),
      [{ op: 'text', elementId: 't', binding: { source: 'entry.title', entryId: 8 } }],
      ctx,
    );
    expect(!checked.ok && checked.error.code).toBe('entry_not_found');
  });

  it('BOOKOPS-039: refuses a date or coordinates bound without words, and keeps the words given', () => {
    const doc = book([text('t', 'Old')]);
    for (const binding of [
      { source: 'entry.date', entryId: 7 },
      { source: 'entry.location', entryId: 7, format: 'decimal' },
    ] as const) {
      const r = run(doc, [{ op: 'text', elementId: 't', binding }], { journey });
      expect(!r.ok && r.error).toMatchObject({ code: 'text_required', opIndex: 0, elementId: 't' });
    }
    const dated = run(doc, [
      { op: 'text', elementId: 't', text: '12 June', binding: { source: 'entry.date', entryId: 7 } },
    ]);
    expect(el(ok(dated), 't')).toMatchObject({ text: '12 June', binding: { source: 'entry.date', entryId: 7 } });
  });

  it('BOOKOPS-040: asks a binding for the id its source needs, and checks it against the journey', () => {
    const doc = book([text('t', 'x')]);
    const noEntry = run(doc, [{ op: 'text', elementId: 't', binding: { source: 'entry.story' } }]);
    expect(!noEntry.ok && noEntry.error.code).toBe('invalid_op');
    const noPhoto = run(doc, [{ op: 'text', elementId: 't', binding: { source: 'photo.caption' } }]);
    expect(!noPhoto.ok && noPhoto.error.code).toBe('invalid_op');
    const stray = run(doc, [{ op: 'text', elementId: 't', binding: { source: 'photo.caption', photoId: 99 } }], {
      photos: gallery,
    });
    expect(!stray.ok && stray.error.code).toBe('photo_not_in_gallery');
    const known = run(doc, [{ op: 'text', elementId: 't', binding: { source: 'photo.caption', photoId: 1 } }], {
      photos: gallery,
    });
    expect(el(ok(known), 't')).toMatchObject({ text: 'Harbour', overridden: false });
  });

  it("BOOKOPS-041: never takes a photo's caption for the page's text of a role", () => {
    const caption = text('cap', 'A very long caption under the harbour photo', 7.5, {
      binding: { source: 'photo.caption', photoId: 1 },
    });
    const doc = book([photo('a', 1), caption, text('h', 'Title', 22)]);
    const out = ok(run(doc, [{ op: 'text', role: 'body', text: 'The story' }]));
    expect(el(out, 'cap')).toBe(caption);
    expect(inner(out).elements.filter((e) => e.kind === 'text')).toHaveLength(3);
  });

  it("BOOKOPS-022: finds the page's heading by its part, and creates one in the quiet slot when there is none", () => {
    const doc = book([text('h', 'Title', 22), text('b', 'A long story here', 10)]);
    expect(el(ok(run(doc, [{ op: 'text', role: 'heading', text: 'Lisbon' }])), 'h')).toMatchObject({ text: 'Lisbon' });
    const made = ok(run(book([]), [{ op: 'text', role: 'heading', text: 'Lisbon' }]));
    expect(inner(made).elements[0]).toMatchObject({
      kind: 'text',
      text: 'Lisbon',
      size: 22,
      weight: 700,
      frame: { x: 226, y: 50 },
    });
    const meta = ok(run(book([]), [{ op: 'text', role: 'meta', binding: { source: 'journey.title' } }], { journey }));
    expect(inner(meta).elements[0]).toMatchObject({
      text: 'Iceland',
      size: 7.5,
      binding: { source: 'journey.title' },
      overridden: false,
    });
    const story = ok(run(book([]), [{ op: 'text', role: 'body', text: 'Story' }], {}, 'sp-first'));
    expect(story.spreads[1]?.elements[0]?.frame).toMatchObject({ x: 16, w: 178 });
    const none = run(book([]), [{ op: 'text', role: 'body' }]);
    expect(!none.ok && none.error.code).toBe('text_required');
  });

  it('BOOKOPS-023: refuses a locked text and a text op that names nothing', () => {
    const r = run(book([text('t', 'x', 10, { locked: true })]), [{ op: 'text', elementId: 't', text: 'y' }]);
    expect(!r.ok && r.error.code).toBe('locked');
    expect(run(book([]), [{ op: 'text', text: 'y' }]).ok).toBe(false);
    const shapeAsText = run(book([shape('s')]), [{ op: 'text', elementId: 's', text: 'y' }]);
    expect(!shapeAsText.ok && shapeAsText.error.code).toBe('wrong_kind');
  });
});

describe('caption', () => {
  it("BOOKOPS-024: sets a caption under the photo, bound to the photo's caption in the journey", () => {
    const doc = book([photo('a', 1)], { entryId: 5 });
    const out = inner(ok(run(doc, [{ op: 'caption', photoElementId: 'a' }], { photos: gallery })));
    expect(out.elements[1]).toMatchObject({
      kind: 'text',
      text: 'Harbour',
      size: 7.5,
      overridden: false,
      binding: { source: 'photo.caption', photoId: 1, entryId: 5 },
      frame: { x: 230, y: 82, w: 80, h: 5 },
    });
  });

  it('BOOKOPS-025: takes words of its own, which stop the sync, and updates a caption already there', () => {
    const doc = book([photo('a', 1), text('c', 'Old', 7.5, { binding: { source: 'photo.caption', photoId: 1 } })]);
    expect(
      el(ok(run(doc, [{ op: 'caption', photoElementId: 'a', text: 'At dawn' }], { photos: gallery })), 'c'),
    ).toMatchObject({
      text: 'At dawn',
      overridden: true,
    });
    expect(el(ok(run(doc, [{ op: 'caption', photoElementId: 'a' }], { photos: gallery })), 'c')).toMatchObject({
      text: 'Harbour',
      overridden: false,
    });
    expect(inner(ok(run(doc, [{ op: 'caption', photoElementId: 'a' }], { photos: gallery }))).elements).toHaveLength(2);
  });

  it('BOOKOPS-026: sets the caption on a full-bleed picture in white, inside its lower edge', () => {
    const doc = book([photo('a', 3, { x: -3, y: -3, w: 213, h: 216 })]);
    const out = inner(ok(run(doc, [{ op: 'caption', photoElementId: 'a' }], { photos: gallery })));
    expect(out.elements[1]).toMatchObject({ text: 'Glacier', color: '#ffffff', opacity: 0.9, frame: { x: 6, y: 199 } });
  });

  it('BOOKOPS-027: keeps a caption under a photo across the fold on its left-hand page', () => {
    const doc = book([photo('a', 1, { x: 150, y: 20, w: 120, h: 60 })]);
    const cap = inner(ok(run(doc, [{ op: 'caption', photoElementId: 'a' }], { photos: gallery }))).elements[1];
    expect(cap?.frame.x).toBe(150);
    expect((cap?.frame.x ?? 0) + (cap?.frame.w ?? 0)).toBeLessThanOrEqual(210);
  });

  it('BOOKOPS-028: refuses an empty frame, a photo with no caption and no words, and a locked caption', () => {
    const empty = run(book([photo('a', null)]), [{ op: 'caption', photoElementId: 'a' }]);
    expect(!empty.ok && empty.error.code).toBe('empty_frame');
    const none = run(book([photo('a', 2)]), [{ op: 'caption', photoElementId: 'a' }], { photos: gallery });
    expect(!none.ok && none.error.code).toBe('caption_missing');
    const locked = book([
      photo('a', 1),
      text('c', 'x', 7.5, { locked: true, binding: { source: 'photo.caption', photoId: 1 } }),
    ]);
    const r = run(locked, [{ op: 'caption', photoElementId: 'a', text: 'y' }]);
    expect(!r.ok && r.error.code).toBe('locked');
  });
});

describe('frame, remove and background', () => {
  it('BOOKOPS-029: moves, resizes and turns an element, to the hundredth of a millimetre', () => {
    const doc = book([text('t', 'x')]);
    expect(el(ok(run(doc, [{ op: 'frame', elementId: 't', x: 12.345, h: 9, rotation: -5 }])), 't')).toMatchObject({
      frame: { x: 12.35, y: 120, w: 160, h: 9 },
      rotation: -5,
    });
    expect(run(doc, [{ op: 'frame', elementId: 't', w: 0 }]).ok).toBe(false);
    const sliver = run(doc, [{ op: 'frame', elementId: 't', w: 0.004 }]);
    expect(!sliver.ok && sliver.error.code).toBe('invalid_op');
    expect(run(doc, [{ op: 'frame', elementId: 't' }]).ok).toBe(false);
    const locked = run(book([text('t', 'x', 10, { locked: true })]), [{ op: 'frame', elementId: 't', x: 1 }]);
    expect(!locked.ok && locked.error.code).toBe('locked');
  });

  it('BOOKOPS-030: parks what it takes off the page, dropping empty frames and blank texts', () => {
    const doc = book([photo('a', 1), photo('e', null), text('t', 'Words'), text('blank', ' '), shape('s')]);
    const out = inner(ok(run(doc, [{ op: 'remove', elementIds: ['a', 'e', 't', 'blank'] }])));
    expect(out.elements.map((e) => e.id)).toEqual(['s']);
    expect(out.parked.map((e) => e.id)).toEqual(['a', 't']);
  });

  it('BOOKOPS-031: deletes with park false, from the page and from the parked list', () => {
    const doc = book([photo('a', 1)], { parked: [photo('pk', 2)] });
    const out = inner(ok(run(doc, [{ op: 'remove', elementIds: ['a', 'pk'], park: false }])));
    expect([out.elements, out.parked]).toEqual([[], []]);
    expect(inner(ok(run(doc, [{ op: 'remove', elementIds: ['pk'] }]))).parked).toHaveLength(1);
  });

  it('BOOKOPS-032: refuses a locked element, an unknown one and a full parked list', () => {
    const locked = run(book([shape('s', { locked: true })]), [{ op: 'remove', elementIds: ['s'] }]);
    expect(!locked.ok && locked.error.code).toBe('locked');
    const unknown = run(book([]), [{ op: 'remove', elementIds: ['x'] }]);
    expect(!unknown.ok && unknown.error.code).toBe('element_not_found');
    const parked = Array.from({ length: MAX_SPREAD_ELEMENTS }, (_, i) => shape(`k${i}`));
    const full = run(book([shape('s')], { parked }), [{ op: 'remove', elementIds: ['s'] }]);
    expect(!full.ok && full.error.code).toBe('parked_full');
  });

  it('BOOKOPS-033: sets and clears the page colour', () => {
    const coloured = ok(run(book([]), [{ op: 'background', color: '#112233' }]));
    expect(inner(coloured).background).toBe('#112233');
    expect(inner(ok(run(coloured, [{ op: 'background', color: null }]))).background).toBeNull();
    expect(run(book([]), [{ op: 'background', color: 'red' }]).ok).toBe(false);
  });
});

describe('a call as a whole', () => {
  it('BOOKOPS-034: applies all or nothing, and names the operation that refused', () => {
    const doc = book([photo('a', 1)]);
    const r = run(doc, [
      { op: 'background', color: '#000000' },
      { op: 'frame', elementId: 'missing', x: 1 },
    ]);
    expect(!r.ok && r.error).toMatchObject({ code: 'element_not_found', opIndex: 1, elementId: 'missing' });
    expect(inner(doc).background).toBeNull();
  });

  it('BOOKOPS-035: changes only the page it was given', () => {
    const doc = book([photo('a', 1)]);
    const out = ok(run(doc, [{ op: 'background', color: '#000000' }]));
    out.spreads.forEach((s, i) => {
      if (i !== 2) expect(s).toBe(doc.spreads[i]);
    });
  });

  it('BOOKOPS-036: refuses an unknown page, an empty call and more than twenty operations', () => {
    const missing = run(book([]), [{ op: 'background', color: null }], {}, 'sp-nope');
    expect(!missing.ok && missing.error.code).toBe('spread_not_found');
    expect(run(book([]), []).ok).toBe(false);
    const many = Array.from({ length: 21 }, () => ({ op: 'background', color: null }) as const);
    const r = run(book([]), many);
    expect(!r.ok && r.error.code).toBe('invalid_op');
  });

  it('BOOKOPS-037: edits the contents of the protected pages like any other page', () => {
    const doc = book([]);
    const out = ok(run(doc, [{ op: 'text', role: 'heading', text: 'Iceland' }], {}, 'sp-cover'));
    expect(out.spreads[0]?.elements[0]).toMatchObject({ text: 'Iceland', frame: { x: 16 } });
  });

  it('BOOKOPS-038: mints ids itself when the context brings none', () => {
    const r = applyBookOps(book([]), { spreadId: 'sp-in', ops: [{ op: 'place_photo', photoId: 1, target: 'new' }] });
    expect(r.ok && r.created[0]).toMatch(/^p-[a-z0-9]{7}$/);
  });

  it('BOOKOPS-042: names what a layout drops and what a delete takes, and nothing for an edit that keeps all', () => {
    const doc = book([photo('a', 1), text('h', 'Title', 22), shape('s')], { parked: [shape('ps')] });
    const laid = run(doc, [{ op: 'layout', template: 'full-text' }]);
    expect(laid.ok && laid.dropped).toEqual(['s', 'ps']);
    const gone = run(doc, [{ op: 'remove', elementIds: ['a'], park: false }]);
    expect(gone.ok && gone.dropped).toEqual(['a']);
    const parked = run(doc, [{ op: 'remove', elementIds: ['a'] }]);
    expect(parked.ok && parked.dropped).toEqual([]);
  });

  it('BOOKOPS-043: refuses rather than answers a page the document schema would not take', () => {
    const broken = { ...text('t', 'x'), color: 'red' } as BookElement;
    const r = run(book([broken]), [{ op: 'background', color: '#000000' }]);
    expect(!r.ok && r.error).toMatchObject({ code: 'invalid_op', opIndex: null });
    expect(!r.ok && r.error.message).toMatch(/would not be valid/);
  });

  it('BOOKOPS-044: answers a page the document schema takes after every built-in layout', () => {
    const doc = book([photo('a', 1), photo('b', 2), text('h', 'Title', 22), text('b1', 'A long story here', 10)]);
    for (const template of ['full-text', 'grid-4', 'band-quote', 'quiet-text'] as const) {
      const out = inner(ok(run(doc, [{ op: 'layout', template }])));
      expect(bookSpreadSchema.safeParse(out).success).toBe(true);
    }
  });
});
