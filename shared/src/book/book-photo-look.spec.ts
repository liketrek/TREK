import { photoDpi, spreadFindings } from './book-findings';
import { bookBusyUnder, bookPhotoCrop, bookVisiblePart } from './book-findings-design';
import { photoLookChecks } from './book-findings-photo';
import { normalizeBookDocument } from './book-normalize';
import { applyBookOps } from './book-ops';
import { bookPageOpSchema } from './book-ops.schema';
import { blankBook } from './book-pages';
import {
  PHOTO_LOOK_STARTS,
  photoAdjustOf,
  photoLookIsRaster,
  photoLookOf,
  photoLookWords,
  photoZoomBox,
  photoZoomOf,
} from './book-photo-look';
import { BOOK_PHOTO_LOOK_KEYS, PHOTO_ZOOM } from './book-photo-look.schema';
import {
  bookPageSetupSchema,
  bookPhotoElementSchema,
  type BookDocument,
  type BookPhotoElement,
  type BookSpread,
} from './book.schema';
import { describeSpread } from './describe-spread';

import { describe, expect, it } from 'vitest';

/**
 * The photo look: border, hard shadow, zoom, mirror, adjustments, duotone and
 * cutout. How the document reads them (and what it does with one it cannot
 * read), how the findings and the words for a model take them into account,
 * and how the page edit sets and clears them.
 */

const frame = { x: 230, y: 20, w: 80, h: 60 };
const photo = (over: Record<string, unknown> = {}): BookPhotoElement =>
  bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame, photoId: 1, ...over });
const page = bookPageSetupSchema.parse({});
const info = { photoId: 1, width: 4000, height: 3000 };

function book(elements: BookPhotoElement[]): BookDocument {
  const doc = blankBook({ title: 'Iceland', newId: (p) => `${p}-x` });
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: i === 2 ? 'sp-in' : `sp-${i}` }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements };
  return { ...doc, spreads };
}
const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;
const style = (doc: BookDocument, set: Record<string, unknown>) =>
  applyBookOps(
    doc,
    { spreadId: 'sp-in', ops: [{ op: 'style', elementId: 'p1', set: { kind: 'photo', ...set } }] },
    {
      newId: (p) => `${p}-n`,
      photos: [info],
    },
  );

describe('the photo look in the document', () => {
  it('BKLOOK-001: a photo from before the look reads with every part off', () => {
    const plain = photo();
    for (const key of BOOK_PHOTO_LOOK_KEYS) expect(plain[key]).toBeUndefined();
    expect(photoLookOf(plain)).toEqual({
      border: null,
      shadow: null,
      zoom: 1,
      flipX: false,
      adjust: null,
      duotone: null,
      cutout: null,
    });
    expect(photoLookIsRaster(plain)).toBe(false);
    expect(photoLookWords(plain)).toEqual([]);
  });

  it('BKLOOK-002: keeps every part it can read, and turns off a part it cannot rather than losing the photo', () => {
    const look = {
      border: { width: 4, color: '#ffffff' },
      shadow: { dx: 2, dy: -1.5, color: '#1a1a1a', alpha: 0.4 },
      zoom: 1.8,
      flipX: true,
      adjust: { brightness: 0.2, warmth: -0.3 },
      duotone: { dark: '#1e3a8a', light: '#f5e6c8' },
      cutout: { width: 3, color: '#ffeedd' },
    };
    expect(photo(look)).toMatchObject(look);
    const odd = photo({
      border: { width: 900, color: '#fff' },
      zoom: 9,
      flipX: 'yes',
      adjust: { brightness: 4 },
      cutout: 'thick',
      duotone: null,
    });
    expect(odd.border).toBeUndefined();
    expect(odd.zoom).toBeUndefined();
    expect(odd.flipX).toBeUndefined();
    expect(odd.adjust).toBeUndefined();
    expect(odd.cutout).toBeUndefined();
    expect(odd.duotone).toBeNull();
    expect(odd.photoId).toBe(1);
  });

  it('BKLOOK-003: a stored book with a look survives normalising whole', () => {
    const doc = book([photo({ border: { width: 5, color: '#ffffff' }, zoom: 2 })]);
    const read = normalizeBookDocument(JSON.parse(JSON.stringify(doc)));
    expect(inner(read).elements[0]).toMatchObject({ border: { width: 5, color: '#ffffff' }, zoom: 2 });
  });
});

describe('reading the look', () => {
  it('BKLOOK-004: an adjustment that moves nothing is none, and a partial one names every part', () => {
    expect(photoAdjustOf(undefined)).toBeNull();
    expect(photoAdjustOf({ brightness: 0, contrast: 0 })).toBeNull();
    expect(photoAdjustOf({ contrast: 0.5 })).toEqual({ brightness: 0, contrast: 0.5, saturation: 0, warmth: 0 });
    expect(photoLookIsRaster(photo({ adjust: { saturation: -1 } }))).toBe(true);
    expect(photoLookIsRaster(photo({ duotone: PHOTO_LOOK_STARTS.duotone }))).toBe(true);
    expect(photoLookIsRaster(photo({ border: PHOTO_LOOK_STARTS.border, cutout: PHOTO_LOOK_STARTS.cutout }))).toBe(
      false,
    );
  });

  it('BKLOOK-005: the zoom stays inside its range, and the zoom box keeps the focal point where it was', () => {
    expect(photoZoomOf({ zoom: undefined })).toBe(PHOTO_ZOOM.min);
    expect(photoZoomOf({ zoom: Number.NaN })).toBe(PHOTO_ZOOM.min);
    expect(photoZoomOf({ zoom: 2.5 })).toBe(2.5);
    expect(photoZoomOf({ zoom: 12 })).toBe(PHOTO_ZOOM.max);
    expect(photoZoomBox(frame, 1, 0.3, 0.7)).toBe(frame);
    const box = photoZoomBox(frame, 2, 0.25, 0.75);
    expect(box).toEqual({ x: 210, y: -25, w: 160, h: 120 });
    // The focal point, as a fraction of the zoomed box, lands on the same place of the frame.
    expect(box.x + box.w * 0.25).toBe(frame.x + frame.w * 0.25);
    expect(box.y + box.h * 0.75).toBe(frame.y + frame.h * 0.75);
  });

  it('BKLOOK-006: says every part a photo wears, with the filters marked as raster in print', () => {
    const words = photoLookWords(
      photo({
        border: { width: 4, color: '#ffffff' },
        shadow: { dx: 2, dy: 2.04, color: '#1a1a1a', alpha: 0.35 },
        zoom: 1.5,
        flipX: true,
        adjust: { brightness: 0.2, contrast: -0.1 },
        duotone: { dark: '#000000', light: '#ffffff' },
        cutout: { width: 3, color: '#ffffff' },
      }),
    );
    expect(words).toEqual([
      'border 4 mm #ffffff',
      'hard shadow 2/2 mm #1a1a1a at 35%',
      'zoom x1.5',
      'mirrored',
      'adjusted brightness +0.2 contrast -0.1 (raster in print)',
      'duotone #000000 to #ffffff (raster in print)',
      'cutout 3 mm #ffffff',
    ]);
  });
});

describe('the findings with a look', () => {
  it('BKLOOK-007: a zoomed picture prints at the resolution its zoom leaves it', () => {
    const plain = photoDpi(photo(), info);
    const zoomed = photoDpi(photo({ zoom: 2 }), info);
    expect(plain).toBe(1270);
    expect(zoomed).toBe(635);
    const big = photo({ frame: { x: 0, y: 0, w: 400, h: 300 }, zoom: 2 });
    expect(spreadFindings({ ...inner(book([big])) }, page, [info]).map((f) => f.code)).toContain('low_dpi');
  });

  it('BKLOOK-008: the crop and the visible part follow the zoom, and a mirrored picture reads its busy grid mirrored', () => {
    const zoomed = photo({ zoom: 2, focalX: 0, focalY: 0 });
    expect(bookPhotoCrop(zoomed, info)).toEqual({ x: 230, y: 20, w: 160, h: 120 });
    expect(bookVisiblePart(zoomed, info)).toEqual({ x: 0, y: 0, w: 0.5, h: 0.5 });
    // Busy in the left quarter of the picture, calm everywhere else.
    const busy = 'ff000000'.repeat(8);
    const left = { x: 230, y: 20, w: 15, h: 60 };
    const square = { photoId: 1, width: 3000, height: 3000, busy };
    const sq = { frame: { x: 230, y: 20, w: 60, h: 60 } };
    expect(bookBusyUnder(photo(sq), square, left)).toBe(15);
    expect(bookBusyUnder(photo({ ...sq, flipX: true }), square, left)).toBe(0);
  });

  it('BKLOOK-009: a filtered picture over a quarter of a page is worth a word, a small one and an unfiltered one are not', () => {
    const large = photo({ frame: { x: 230, y: 20, w: 150, h: 150 }, adjust: { contrast: 0.3 } });
    const both = photo({
      id: 'p2',
      frame: { x: 0, y: 0, w: 210, h: 210 },
      adjust: { warmth: 1 },
      duotone: PHOTO_LOOK_STARTS.duotone,
    });
    const small = photo({ id: 'p3', adjust: { contrast: 0.3 } });
    const plain = photo({ id: 'p4', frame: { x: 0, y: 0, w: 210, h: 210 } });
    const empty = photo({ id: 'p5', photoId: null, frame: { x: 0, y: 0, w: 210, h: 210 }, adjust: { contrast: 1 } });
    const spread = inner(book([large, both, small, plain, empty]));
    const found = photoLookChecks(spread, page);
    expect(found.map((f) => f.elementIds[0])).toEqual(['p1', 'p2']);
    expect(found[0]).toMatchObject({ code: 'raster_effect', severity: 'info' });
    expect(found[1]?.message).toContain('adjustments and a duotone');
    expect(found.every((f) => f.message.length <= 300)).toBe(true);
    expect(photoLookChecks(spread, { ...page, pageWidth: 0 })).toEqual([]);
    expect(spreadFindings(inner(book([large])), page).map((f) => f.code)).toContain('raster_effect');
  });

  it('BKLOOK-010: describe-spread lists the look beside the crop', () => {
    const doc = book([photo({ border: { width: 4, color: '#ffffff' }, flipX: true })]);
    const text = describeSpread(doc, 'sp-in', [info])?.text ?? '';
    expect(text).toContain('border 4 mm #ffffff');
    expect(text).toContain('mirrored');
  });
});

describe('setting the look from the page edit', () => {
  it('BKLOOK-011: style sets every part, and null turns a part off by leaving it out', () => {
    const set = {
      border: { width: 6, color: '#ffffff' },
      shadow: { dx: 3, dy: 3, color: '#000000', alpha: 0.5 },
      zoom: 1.4,
      flipX: true,
      adjust: { brightness: 0.1 },
      duotone: { dark: '#112233', light: '#ddeeff' },
      cutout: { width: 2, color: '#ffffff' },
    };
    const result = style(book([photo()]), set);
    if (!result.ok) throw new Error(result.error.message);
    expect(inner(result.doc).elements[0]).toMatchObject(set);

    const off = style(result.doc, { border: null, shadow: null, adjust: null, duotone: null, cutout: null });
    if (!off.ok) throw new Error(off.error.message);
    const el = inner(off.doc).elements[0] as BookPhotoElement;
    for (const key of ['border', 'shadow', 'adjust', 'duotone', 'cutout']) expect(key in el).toBe(false);
    expect(el).toMatchObject({ zoom: 1.4, flipX: true });
  });

  it('BKLOOK-012: the page edit refuses a look outside the format', () => {
    const op = (set: Record<string, unknown>) =>
      bookPageOpSchema.safeParse({ op: 'style', elementId: 'p1', set: { kind: 'photo', ...set } }).success;
    expect(op({ zoom: 2 })).toBe(true);
    expect(op({ zoom: 5 })).toBe(false);
    expect(op({ border: { width: 40, color: '#ffffff' } })).toBe(false);
    expect(op({ shadow: { dx: 2, dy: 2, color: '#000000', alpha: 2 } })).toBe(false);
    expect(op({ adjust: { brightness: 0.5, glow: 1 } })).toBe(false);
    expect(op({ duotone: { dark: 'navy', light: '#ffffff' } })).toBe(false);
    // The look is styled onto a frame that exists, so a new one takes none of it.
    const add = { op: 'add', element: { kind: 'photo', zoom: 2 } };
    expect(bookPageOpSchema.safeParse(add).success).toBe(false);
  });
});
