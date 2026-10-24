import { bookPageSetupForPreset } from '../book-pages';
import {
  bookBadgeElementSchema,
  bookMapElementSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  bookStickerElementSchema,
  bookTextElementSchema,
  type BookElement,
  type BookSpread,
} from '../book.schema';
import { bookThemeOf } from '../theme/book-theme';
import { layDecoratedTemplate } from './template-apply';
import { findDecoratedTemplate } from './template-catalogue';
import { bookTemplateFromSpread } from './template-extract';
import { bookDecoratedTemplateSchema, type BookDecoratedTemplate } from './template-format';

import { describe, expect, it } from 'vitest';

// TPLEXT-001 to TPLEXT-005

/**
 * A page drawn in the Studio read back as a decorated template: the inverse
 * of laying one, with the roles read off the layer names, the bindings and the
 * photo order, the content taken out and the theme's colours kept as tints.
 */

const square = bookPageSetupForPreset('square-210');
const landscape = bookPageSetupForPreset('a4-landscape');
const meta = { id: 'drawn-one', archetype: 'postcard' as const, tags: ['drawn'], descr: 'A page drawn in the Studio.' };

let seq = 0;
const newId = (p: string) => `${p}-${++seq}`;
const frame = { x: 20, y: 30, w: 60, h: 40 };

const spreadOf = (role: BookSpread['role'], elements: BookElement[], over: Partial<BookSpread> = {}) =>
  bookSpreadSchema.parse({ id: 'sp', role, elements, ...over });

/** A catalogue template laid on a page as a person would have drawn it: each role named on its layer. */
function drawn(tpl: BookDecoratedTemplate): BookSpread {
  const laid = layDecoratedTemplate(tpl, square, null, newId);
  const elements = laid.map(({ el, role }) => (role ? { ...el, name: role } : el));
  return spreadOf(tpl.kind === 'inner' ? 'inner' : 'cover', elements, {
    background: tpl.background,
    ...(tpl.backgroundToken ? { backgroundToken: tpl.backgroundToken } : {}),
  });
}

describe('a drawn page as a template', () => {
  it('TPLEXT-001: gives back the fractions, the roles and the lengths a template was laid from', () => {
    for (const id of ['grid-badge-circle', 'stamp-collage-row', 'arch-gallery', 'postcard-back']) {
      const tpl = findDecoratedTemplate(id) as BookDecoratedTemplate;
      const back = bookTemplateFromSpread(drawn(tpl), square, { ...meta, id });
      expect(
        back.elements.map((e) => e.role),
        id,
      ).toEqual(tpl.elements.map((e) => e.role));
      back.elements.forEach((el, i) => {
        const src = tpl.elements[i] as BookDecoratedTemplate['elements'][number];
        // A bleeding edge comes back as the bleed of this page: the same edge, laid again.
        if (src.frame.x > 0 && src.frame.y > 0) {
          for (const key of ['x', 'y', 'w', 'h'] as const) {
            expect(el.frame[key], `${id} ${src.id} ${key}`).toBeCloseTo(src.frame[key], 3);
          }
        }
        if (el.kind === 'text' && src.kind === 'text') expect(el.size, `${id} ${src.id}`).toBeCloseTo(src.size, 3);
      });
      expect(bookDecoratedTemplateSchema.safeParse(back).success, id).toBe(true);
    }
  });

  it('TPLEXT-002: reads the roles off the journal bindings, a date mark, a map and the photo order', () => {
    const els: BookElement[] = [
      bookPhotoElementSchema.parse({ id: 'a', kind: 'photo', frame, photoId: 5 }),
      bookTextElementSchema.parse({
        id: 'b',
        kind: 'text',
        frame,
        text: 'Sintra',
        binding: { source: 'entry.title', entryId: 2 },
      }),
      bookPhotoElementSchema.parse({ id: 'c', kind: 'photo', frame, photoId: 6, name: 'photo:1' }),
      bookBadgeElementSchema.parse({ id: 'd', kind: 'badge', frame, variant: 'date', text: '4', sub: 'MAY' }),
      bookMapElementSchema.parse({ id: 'e', kind: 'map', frame, countries: ['PT'] }),
      bookTextElementSchema.parse({ id: 'f', kind: 'text', frame, text: 'No 7' }),
    ];
    const tpl = bookTemplateFromSpread(spreadOf('inner', els), square, meta);
    expect(tpl.kind).toBe('inner');
    expect(tpl.elements.map((e) => e.role)).toEqual(['photo:2', 'title', 'photo:1', 'date', 'map', undefined]);
  });

  it('TPLEXT-003: takes the pictures, the words of every role and the journey out, and keeps the words of the design', () => {
    const els: BookElement[] = [
      bookPhotoElementSchema.parse({ id: 'a', kind: 'photo', frame, photoId: 5 }),
      bookTextElementSchema.parse({
        id: 'b',
        kind: 'text',
        frame,
        text: 'Lisbon',
        name: 'title',
        fillPaint: { type: 'photo', photoId: 5 },
      }),
      bookTextElementSchema.parse({ id: 'c', kind: 'text', frame, text: '“' }),
      bookMapElementSchema.parse({ id: 'd', kind: 'map', frame, countries: ['PT'], tileUrl: 'https://tiles' }),
      bookShapeElementSchema.parse({ id: 'e', kind: 'shape', frame, hidden: true }),
    ];
    const tpl = bookTemplateFromSpread(spreadOf('cover', els), square, meta);
    const [picture, title, quote, map] = tpl.elements;
    expect(tpl.elements).toHaveLength(4);
    expect(picture).toMatchObject({ kind: 'photo', photoId: null, role: 'photo:1' });
    expect(title).toMatchObject({ kind: 'text', text: '', binding: null, fillPaint: null, fillPhoto: 'photo:1' });
    expect(quote).toMatchObject({ kind: 'text', text: '“' });
    expect(map).toMatchObject({ kind: 'map', countries: [], tileUrl: '', role: 'map' });
    expect(tpl.kind).toBe('single');
    expect(tpl.labelKey).toBe('studio.templates.name.drawnOne');
  });

  it('TPLEXT-004: keeps the colours the document links nowhere as tints of the theme they are drawn in', () => {
    const theme = bookThemeOf('riviera');
    const { accent, accent2, paper, ink } = theme.palette;
    const els: BookElement[] = [
      bookPhotoElementSchema.parse({ id: 'a', kind: 'photo', frame, border: { width: 3, color: accent } }),
      bookStickerElementSchema.parse({
        id: 'b',
        kind: 'sticker',
        frame,
        stickerId: 'lemon',
        colors: [accent2, '#123456'],
      }),
      bookShapeElementSchema.parse({
        id: 'c',
        kind: 'shape',
        frame,
        paint: { type: 'pattern', pattern: 'checker', fg: accent, bg: paper, scale: 1, angle: 0 },
      }),
    ];
    const spread = spreadOf('cover', els, {
      backgroundPaint: {
        type: 'linear',
        angle: 0,
        stops: [
          { at: 0, color: ink },
          { at: 1, color: '#abcdef' },
        ],
      },
    });
    const tpl = bookTemplateFromSpread(spread, square, { ...meta, theme });
    expect(tpl.elements.map((e) => e.tint)).toEqual([
      { border: 'accent' },
      { colors: ['accent2', null] },
      { fg: 'accent', bg: 'paper' },
    ]);
    expect(tpl.backgroundTint).toEqual({ stops: ['ink', null] });
    expect(bookTemplateFromSpread(spread, square, meta).elements.every((e) => e.tint === undefined)).toBe(true);
  });

  it('TPLEXT-005: measures a round shape and a turned element from the shorter side of a landscape page', () => {
    const els: BookElement[] = [
      bookShapeElementSchema.parse({
        id: 'a',
        kind: 'shape',
        shape: 'ellipse',
        frame: { x: 100, y: 50, w: 42, h: 42 },
      }),
      bookPhotoElementSchema.parse({ id: 'b', kind: 'photo', frame: { x: 10, y: 10, w: 29.7, h: 21 }, rotation: 5 }),
      bookShapeElementSchema.parse({ id: 'c', kind: 'shape', frame: { x: 29.7, y: 21, w: 59.4, h: 42 } }),
    ];
    const tpl = bookTemplateFromSpread(spreadOf('cover', els), landscape, meta);
    const [round, turned, box] = tpl.elements;
    expect(round).toMatchObject({ keep: true, frame: { w: 0.2, h: 0.2 } });
    expect(turned?.keep).toBeUndefined();
    expect(turned?.frame.w).toBeCloseTo(29.7 / 210, 4);
    expect(box?.frame).toEqual({ x: 0.1, y: 0.1, w: 0.2, h: 0.2 });
  });
});
