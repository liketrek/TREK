import { DESIGN_TEXT_HEADROOM, MIN_PRINT_DPI, photoDpi, spreadFindings, textHeightNeeded } from './book-findings';
import { applyBookTemplate, findBookTemplate, type BookTemplate } from './book-layouts';
import type { BookPhotoInfo } from './book-ops-core';
import { BOOK_OP_LIMITS, bookPageDescriptionSchema, bookOverviewSchema, type BookFinding } from './book-ops.schema';
import { blankBook } from './book-pages';
import {
  BOOK_FONTS_IDS,
  bookBadgeElementSchema,
  bookCountriesElementSchema,
  bookIconElementSchema,
  bookListElementSchema,
  bookMapElementSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookStatsElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookPhotoElement,
  type BookSpread,
  type BookTextElement,
} from './book.schema';
import { describeSpread, listBookLayouts, summarizeBook, summarizeSpread } from './describe-spread';

import { describe, expect, it } from 'vitest';

/**
 * The page in words and its findings, on small fixture pages that each carry
 * one fault. The page is the default square book: 210 mm pages, a 420 mm
 * spread folded at 210, 3 mm bleed, 5 mm safe margin.
 */

type Frame = { x: number; y: number; w: number; h: number };

const photo = (id: string, photoId: number | null, frame: Frame, over: Partial<BookPhotoElement> = {}) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId, ...over }) as BookPhotoElement;
const text = (id: string, words: string, frame: Frame = { x: 230, y: 120, w: 160, h: 40 }, over = {}) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame, text: words, size: 10, ...over }) as BookElement;

const gallery: BookPhotoInfo[] = [
  { photoId: 1, width: 4000, height: 3000, caption: 'Harbour' },
  { photoId: 2, width: 800, height: 600 },
  { photoId: 3 },
  { photoId: 4, width: 3000, height: 3000, hidden: true },
];

/** A clean picture and a short text on the right-hand page. */
const clean = (): BookElement[] => [photo('p-ok', 1, { x: 230, y: 20, w: 80, h: 60 }), text('t-ok', 'Harbour')];

function book(elements: BookElement[], over: Partial<BookSpread> = {}): BookDocument {
  const doc = blankBook({ title: 'Iceland', newId: (p) => `${p}-x` });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements, ...over };
  return { ...doc, spreads };
}

const findings = (elements: BookElement[], photos: BookPhotoInfo[] | undefined = gallery, over = {}) => {
  const doc = book(elements, over);
  return spreadFindings(doc.spreads[2] as BookSpread, doc.page, photos);
};
const codes = (list: BookFinding[]) => list.map((f) => `${f.severity}:${f.code}`);

describe('findings', () => {
  it('BOOKDESC-001: finds nothing on a clean page', () => {
    expect(findings(clean())).toEqual([]);
  });

  it('BOOKDESC-002: finds two photos on top of each other, naming both', () => {
    const list = findings([
      photo('p-a', 1, { x: 230, y: 20, w: 80, h: 60 }),
      photo('p-b', 1, { x: 260, y: 40, w: 80, h: 60 }),
    ]);
    expect(list.find((f) => f.code === 'overlap')).toMatchObject({ severity: 'severe', elementIds: ['p-a', 'p-b'] });
  });

  it('BOOKDESC-003: lets a text sit on a photo, which is a design, not a fault', () => {
    const list = findings([
      photo('p-a', 1, { x: 230, y: 20, w: 80, h: 60 }),
      text('t-a', 'On it', { x: 240, y: 30, w: 50, h: 10 }),
    ]);
    expect(codes(list)).not.toContain('severe:overlap');
  });

  it('BOOKDESC-004: finds words in the fold, says a photo across it, and a focal point there', () => {
    expect(codes(findings([text('t-f', 'Across', { x: 180, y: 120, w: 80, h: 20 })]))).toContain('severe:fold');
    const split = findings([photo('p-f', 1, { x: 170, y: 20, w: 80, h: 60 })]).find((f) => f.code === 'fold');
    expect(split).toMatchObject({ severity: 'warn', elementIds: ['p-f'] });
    expect(split?.message).toMatch(/focal point in it/);
    const aside = findings([photo('p-g', 1, { x: 170, y: 20, w: 80, h: 60 }, { focalX: 0.1 })]);
    expect(aside.find((f) => f.code === 'fold')?.message).toMatch(/meant to cross/);
    expect(codes(aside)).not.toContain('severe:fold');
    const wide = photo('p-w', 1, { x: -3, y: -3, w: 426, h: 216 }, { focalX: 0.5 });
    expect(codes(findings([wide]))).toContain('warn:fold');
  });

  it('BOOKDESC-005: finds words past the trim, words in the safe margin and a picture short of the bleed', () => {
    expect(codes(findings([text('t-x', 'Cut', { x: -10, y: 100, w: 60, h: 20 })]))).toContain('severe:trim');
    expect(codes(findings([text('t-s', 'Close', { x: 2, y: 100, w: 60, h: 20 })]))).toContain('warn:trim');
    const short = findings([photo('p-s', 1, { x: 229, y: -1, w: 80, h: 60 })]);
    expect(short.find((f) => f.code === 'trim')?.message).toMatch(/bleed/);
    const sliver = findings([photo('p-v', 1, { x: 230, y: 1, w: 80, h: 60 })]);
    expect(sliver.find((f) => f.code === 'trim')?.message).toMatch(/short of the page edge/);
  });

  it('BOOKDESC-006: finds an element off the page altogether', () => {
    expect(codes(findings([photo('p-o', 1, { x: 500, y: 20, w: 80, h: 60 })]))).toContain('warn:trim');
  });

  it('BOOKDESC-007: finds empty frames, in one finding', () => {
    const list = findings([
      photo('p-e1', null, { x: 230, y: 20, w: 40, h: 30 }),
      photo('p-e2', null, { x: 300, y: 20, w: 40, h: 30 }),
    ]);
    expect(list.filter((f) => f.code === 'empty_frame')).toEqual([
      expect.objectContaining({ severity: 'severe', elementIds: ['p-e1', 'p-e2'] }),
    ]);
  });

  it('BOOKDESC-008: finds a print under 200 dpi only when the original size is known', () => {
    const big = photo('p-l', 2, { x: 230, y: 20, w: 160, h: 120 });
    expect(photoDpi(big, gallery[1])).toBeLessThan(MIN_PRINT_DPI);
    expect(codes(findings([big]))).toContain('warn:low_dpi');
    const unknown = photo('p-u', 3, { x: 230, y: 20, w: 160, h: 120 });
    expect(photoDpi(unknown, gallery[2])).toBeNull();
    expect(codes(findings([unknown]))).not.toContain('warn:low_dpi');
  });

  it('BOOKDESC-009: finds a focal point outside an ellipse mask or hidden under another picture', () => {
    const masked = photo('p-m', 1, { x: 230, y: 20, w: 80, h: 60 }, { mask: 'ellipse', focalX: 0.95, focalY: 0.95 });
    expect(codes(findings([masked]))).toContain('warn:focal_cut');
    const under = photo('p-under', 1, { x: 230, y: 20, w: 160, h: 120 });
    const over = photo('p-over', 1, { x: 290, y: 60, w: 40, h: 40 });
    const list = findings([under, over]);
    expect(list.find((f) => f.code === 'focal_cut')?.message).toMatch(/p-over/);
  });

  it('BOOKDESC-010: finds a text that will likely not fit its frame', () => {
    const long = text('t-long', 'A long day on the ice. '.repeat(40), { x: 230, y: 120, w: 60, h: 12 });
    expect(findings([long]).find((f) => f.code === 'text_overflow')).toMatchObject({ severity: 'severe' });
  });

  it('BOOKDESC-011: notes what is parked and which photos are hidden from the page image', () => {
    const parked = [photo('p-park', 1, { x: 0, y: 0, w: 10, h: 10 }), text('t-park', 'Spare')];
    const list = findings([photo('p-h', 4, { x: 230, y: 20, w: 60, h: 60 })], gallery, { parked });
    expect(list.find((f) => f.code === 'parked')).toMatchObject({ severity: 'info', elementIds: ['p-park', 't-park'] });
    expect(codes(list)).toContain('info:hidden_photo');
  });

  it('BOOKDESC-012: notes a photo the gallery does not hold, only when the gallery is given', () => {
    const stray = [photo('p-st', 99, { x: 230, y: 20, w: 80, h: 60 })];
    expect(codes(findings(stray))).toContain('warn:not_in_gallery');
    const doc = book(stray);
    expect(codes(spreadFindings(doc.spreads[2] as BookSpread, doc.page))).not.toContain('warn:not_in_gallery');
  });

  it('BOOKDESC-020: measures a text with no leading of its own, as a layout sets a meta line, at the default', () => {
    const meta: Partial<BookTextElement> = {
      ...(text('t-m', 'June 2026', { x: 230, y: 20, w: 160, h: 5 }, { size: 7.5 }) as BookTextElement),
    };
    delete meta.leading;
    const fits = findings([meta as BookElement]);
    expect(codes(fits)).not.toContain('severe:text_overflow');
    expect(fits.map((f) => f.message).join(' ')).not.toMatch(/NaN/);
    const long = { ...meta, text: 'A long day on the ice. '.repeat(40) } as BookElement;
    expect(findings([long]).find((f) => f.code === 'text_overflow')?.message).toMatch(/needs about \d+(\.\d)? mm/);
  });

  it('BOOKDESC-021: takes the band-quote layout, type set across the spread, as meant rather than a fault', () => {
    const doc = book([
      photo('p-1', 1, { x: 230, y: 20, w: 80, h: 60 }),
      photo('p-2', 1, { x: 320, y: 20, w: 80, h: 60 }),
      text('t-h', 'Reykjavik', undefined, { size: 22 }),
      text('t-b', 'The wind never stopped.'),
    ]);
    const tpl = findBookTemplate('band-quote') as BookTemplate;
    const laid = applyBookTemplate(doc.spreads[2] as BookSpread, tpl, doc.page);
    const list = codes(spreadFindings(laid, doc.page, gallery));
    expect(list).toContain('warn:fold');
    expect(list).not.toContain('severe:fold');
  });

  it('BOOKDESC-022: notes a small picture set over a large one as an inset, not an overlap to fix', () => {
    const hero = photo('p-hero', 1, { x: 210, y: -3, w: 213, h: 130 });
    const inset = photo('p-in', 1, { x: 224, y: 104, w: 52, h: 40 });
    const list = findings([hero, inset]);
    expect(list.find((f) => f.code === 'overlap')).toMatchObject({ severity: 'info', elementIds: ['p-in', 'p-hero'] });
    expect(codes(list)).not.toContain('severe:overlap');
  });

  it('BOOKDESC-025: takes photos laid over each other at an angle, or in a frame, as layered on purpose', () => {
    const under = photo('p-a', 1, { x: 230, y: 20, w: 80, h: 60 });
    const over = { x: 260, y: 40, w: 80, h: 60 };
    for (const look of [{ rotation: 4 }, { rotation: -3 }, { rotation: 357 }, { frameStyle: 'polaroid' as const }]) {
      const list = findings([under, photo('p-b', 1, over, look)]);
      expect(
        list.find((f) => f.code === 'overlap'),
        JSON.stringify(look),
      ).toMatchObject({
        severity: 'info',
        elementIds: ['p-a', 'p-b'],
      });
    }
    // A frame on the lower picture does not make the upper one look laid down.
    const framedUnder = photo('p-a', 1, { x: 230, y: 20, w: 80, h: 60 }, { frameStyle: 'white' });
    expect(codes(findings([framedUnder, photo('p-b', 1, over)]))).toContain('severe:overlap');
    // Framed as the journal style frames every photo, but four fifths covered: an accident all the same.
    const stacked = photo('p-b', 1, { x: 238, y: 26, w: 80, h: 60 }, { frameStyle: 'white', rotation: 4 });
    expect(codes(findings([photo('p-a', 1, { x: 230, y: 20, w: 80, h: 60 }), stacked]))).toContain('severe:overlap');
  });

  it('BOOKDESC-026: keeps an accident severe: two straight photos of a size, under 3 degrees off, a full turn included', () => {
    const under = photo('p-a', 1, { x: 230, y: 20, w: 80, h: 60 }, { rotation: 1.5 });
    // 2 degrees is the scrapbook style's own tilt, so it does not make a pair layered on its own.
    for (const rotation of [0, -1, 2, -2.5, 359, 720]) {
      const list = findings([under, photo('p-b', 1, { x: 260, y: 40, w: 80, h: 60 }, { rotation })]);
      expect(codes(list), String(rotation)).toContain('severe:overlap');
    }
  });

  it('BOOKDESC-027: sets a small line over display type as context, over running text or a text of a size as a fault', () => {
    const title = text('t-big', 'Lisbon', { x: 230, y: 40, w: 160, h: 60 }, { size: 60 });
    const accent = text('t-over', 'travel', { x: 240, y: 70, w: 40, h: 12 });
    expect(findings([title, accent]).find((f) => f.code === 'overlap')).toMatchObject({
      severity: 'info',
      elementIds: ['t-over', 't-big'],
    });
    // The same small line on a story block prints words over words.
    const story = text('t-story', 'A long day on the ice, and the harbour after it. '.repeat(3).trim(), {
      x: 230,
      y: 40,
      w: 160,
      h: 60,
    });
    expect(findings([story, accent]).find((f) => f.code === 'overlap')).toMatchObject({ severity: 'severe' });
    const twin = text('t-twin', 'Porto', { x: 240, y: 60, w: 160, h: 60 });
    expect(codes(findings([title, twin]))).toContain('severe:overlap');
    const tilted = text('t-tilt', 'Porto', { x: 310, y: 90, w: 80, h: 30 }, { rotation: -6 });
    expect(codes(findings([title, tilted]))).toContain('info:overlap');
  });

  it('BOOKDESC-028: never compares a title over a photo, or a photo over a shape', () => {
    const shape = bookShapeElementSchema.parse({
      id: 's-block',
      kind: 'shape',
      frame: { x: 220, y: 10, w: 120, h: 90 },
    });
    const list = findings([
      shape as BookElement,
      photo('p-a', 1, { x: 230, y: 20, w: 80, h: 60 }),
      text('t-a', 'Over it', { x: 235, y: 30, w: 70, h: 20 }),
    ]);
    expect(list.filter((f) => f.code === 'overlap')).toEqual([]);
  });

  it('BOOKDESC-029: reports an accident on a busy layered page, however many insets come before it', () => {
    const hero = photo('p-hero', 1, { x: 230, y: 20, w: 180, h: 170 });
    const insets = Array.from({ length: 8 }, (_, i) =>
      photo(`p-in-${i}`, 1, { x: 235 + (i % 4) * 42, y: 30 + Math.floor(i / 4) * 40, w: 20, h: 15 }),
    );
    const pair = [photo('p-a', 1, { x: 20, y: 20, w: 80, h: 60 }), photo('p-b', 1, { x: 50, y: 40, w: 80, h: 60 })];
    const overlaps = findings([hero, ...insets, ...pair]).filter((f) => f.code === 'overlap');
    expect(overlaps).toHaveLength(6);
    expect(overlaps.find((f) => f.severity === 'severe')?.elementIds).toEqual(['p-a', 'p-b']);
  });

  it('BOOKDESC-013: puts severe first and stops at the cap', () => {
    // 45 texts past the trim, each too small for its words: 90 severe findings before the cap.
    const many = Array.from({ length: 45 }, (_, i) => text(`t-${i}`, 'Cut', { x: -10, y: 5 + i * 4, w: 40, h: 3 }));
    const list = findings([...many, photo('p-e', null, { x: 230, y: 20, w: 40, h: 30 })], gallery, {
      parked: [text('t-p', 'Spare')],
    });
    expect(list).toHaveLength(BOOK_OP_LIMITS.findings);
    expect(list.every((f) => f.severity === 'severe')).toBe(true);
    const order = list.map((f) => ({ severe: 0, warn: 1, info: 2 })[f.severity]);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

/** A story of 898 characters the Studio sets in ten lines across 178.5 mm, at 10 pt in sans. */
const LISBON = [
  'Wir stehen früh auf und laufen von der Sé hinauf in die Alfama, bevor die Busse kommen. Die Gassen',
  'sind noch nass vom Wischen, aus den Fenstern hängt Wäsche, und eine ältere Frau stellt Geranien auf',
  'die Treppe. Am Largo das Portas do Sol trinken wir den ersten Galão und schauen auf die Dächer, die',
  'bis zum Tejo hinunterfallen. Ein Straßenmusiker spielt Fado auf einer portugiesischen Gitarre,',
  'leise, als wolle er niemanden wecken. Danach verlaufen wir uns absichtlich. Jede Treppe führt zu',
  'einem kleinen Platz, jeder Platz zu einer neuen Aussicht. In einer Tasca essen wir gegrillte',
  'Sardinen mit Brot, und der Wirt erklärt uns mit Händen und Füßen, warum man sie nicht entgräten',
  'muss. Gegen Mittag wird es warm, die Azulejos glänzen in der Sonne, und wir setzen uns in den',
  'Schatten des Castelo de São Jorge. Von oben sieht die Stadt aus wie ein Modell, die Brücke des 25.',
  'April schimmert im Dunst.',
].join(' ');

/** A text as the design engine sets a story: sans at 10 pt, weight 400, a leading of 1.5, no tracking. */
const story = (words: string, w: number, h = 40) =>
  bookTextElementSchema.parse({
    id: 't-m',
    kind: 'text',
    frame: { x: 225.75, y: 64, w, h },
    text: words,
    font: 'sans',
    size: 10,
    weight: 400,
    leading: 1.5,
    tracking: 0,
  }) as BookTextElement;

/** One line of such a story, in millimetres. */
const LINE = ((10 * 25.4) / 72) * 1.5;

describe('the measure of a text', () => {
  it('BOOKMEAS-001: measures the story the Studio sets in ten lines at ten lines, and flags a frame two lines short', () => {
    expect(LISBON).toHaveLength(898);
    expect(textHeightNeeded(story(LISBON, 178.5), DESIGN_TEXT_HEADROOM)).toBeCloseTo(10 * LINE, 6);
    expect(textHeightNeeded(story(LISBON, 178.5))).toBeCloseTo(10 * LINE, 6);
    // The findings allow a tenth over a frame: the nine lines the engine gave the story before pass, eight do not.
    const overflow = (h: number) => findings([story(LISBON, 178.5, h)]).find((f) => f.code === 'text_overflow');
    expect(overflow(48.83)).toBeUndefined();
    expect(overflow(8 * LINE + 1.2)).toMatchObject({ severity: 'severe', elementIds: ['t-m'] });
  });

  it('BOOKMEAS-002: breaks lines at spaces, a word longer than a line inside it, and sets each paragraph on lines of its own', () => {
    // Ten letters a line at 18 mm.
    const lines = (words: string) => textHeightNeeded(story(words, 18)) / LINE;
    expect(lines('aaaaaa bbbbbb cccccc')).toBeCloseTo(3, 6);
    expect(lines('abcdefghijklmnopqrstuvwxy')).toBeCloseTo(3, 6);
    expect(lines('ab abcdefghijklmnopqrstuvwxy')).toBeCloseTo(4, 6);
    expect(lines('abcdefghij k')).toBeCloseTo(2, 6);
    expect(lines('ab cd')).toBeCloseTo(1, 6);
    expect(lines('')).toBeCloseTo(1, 6);
    expect(lines('ab\ncd')).toBeCloseTo(2, 6);
    expect(lines('ab\n\ncd   ')).toBeCloseTo(3, 6);
  });

  it('BOOKMEAS-003: never counts fewer lines with the design headroom than the best estimate, and a line more where one is tight', () => {
    const texts = [LISBON, 'A long day on the ice. '.repeat(12), 'Harbour', ''];
    const sized = [30, 60, 120, 178.5].flatMap((w) => [7, 10, 14].map((size) => ({ w, size })));
    const sets = BOOK_FONTS_IDS.flatMap((font) => sized.map((set) => ({ ...set, font })));
    for (const { font, w, size } of sets) {
      for (const words of texts) {
        for (const weight of [400, 700] as const) {
          const el = { ...story(words, w), font, size, weight };
          expect(textHeightNeeded(el, DESIGN_TEXT_HEADROOM)).toBeGreaterThanOrEqual(textHeightNeeded(el));
        }
      }
    }
    expect(textHeightNeeded(story(LISBON, 150))).toBeCloseTo(11 * LINE, 6);
    expect(textHeightNeeded(story(LISBON, 150), DESIGN_TEXT_HEADROOM)).toBeCloseTo(12 * LINE, 6);
  });

  it('BOOKMEAS-004: widens the letters by the design headroom and leaves the tracking as it is', () => {
    // With 0.1 em of tracking a letter takes 0.507 em times the headroom plus 0.1 em, 2.231 mm at 10 pt: forty fit
    // 89.5 mm but not 89 mm. Were the tracking widened too, 89.5 mm would hold 39.
    const tracked = (w: number) => ({ ...story('a'.repeat(40), w), tracking: 0.1 });
    expect(textHeightNeeded(tracked(89.5), DESIGN_TEXT_HEADROOM)).toBeCloseTo(LINE, 6);
    expect(textHeightNeeded(tracked(89), DESIGN_TEXT_HEADROOM)).toBeCloseTo(2 * LINE, 6);
    expect(textHeightNeeded(tracked(89))).toBeCloseTo(LINE, 6);
  });
});

describe('describeSpread', () => {
  it('BOOKDESC-014: says what the page is, every element back to front with its frame, and the findings', () => {
    const doc = book([...clean(), photo('p-e', null, { x: 330, y: 20, w: 40, h: 30 })], {
      background: '#fafafa',
      entryId: 7,
    });
    const d = describeSpread(doc, 'sp-in', gallery);
    expect(bookPageDescriptionSchema.safeParse(d).success).toBe(true);
    expect(d?.index).toBe(2);
    expect(d?.text).toMatch(/Page 3 of 5 \(sp-in\): a double spread, 420 x 210 mm/);
    expect(d?.text).toMatch(/fold at x 210/);
    expect(d?.text).toMatch(/Background #fafafa\. From entry 7\./);
    expect(d?.text).toMatch(
      /1\. photo p-ok at 230, 20, 80 x 60: photo 1, landscape 4000 x 3000 px in a landscape frame/,
    );
    expect(d?.text).toMatch(/2\. text t-ok .*"Harbour"/);
    expect(d?.text).toMatch(/3\. photo p-e .*empty frame/);
    expect(d?.text).toMatch(/- severe empty_frame/);
    expect(d?.elements.map((e) => e.id)).toEqual(['p-ok', 't-ok', 'p-e']);
  });

  it('BOOKDESC-015: says an empty page is empty and has no findings, and answers null for an unknown page', () => {
    const doc = book([]);
    expect(describeSpread(doc, 'sp-cover')?.text).toMatch(
      /the front cover, a single page, 210 x 210 mm[\s\S]*The page is empty\.[\s\S]*Findings: none\./,
    );
    expect(describeSpread(doc, 'sp-nope')).toBeNull();
  });

  it('BOOKDESC-016: tells a hidden photo apart, and how much of a picture a cover crop shows', () => {
    const doc = book([photo('p-h', 4, { x: 230, y: 20, w: 120, h: 60 })]);
    const t = describeSpread(doc, 'sp-in', gallery)?.text ?? '';
    expect(t).toMatch(/by another contributor, not shown/);
    expect(t).toMatch(/cover shows 50% of the picture/);
  });

  it('BOOKDESC-017: lists the parked elements and the bindings of texts', () => {
    const bound = text('t-b', 'Iceland', undefined, { binding: { source: 'journey.title' } });
    const doc = book([bound], { parked: [photo('p-park', 3, { x: 0, y: 0, w: 10, h: 10 })] });
    const d = describeSpread(doc, 'sp-in');
    expect(d?.text).toMatch(/bound to journey\.title/);
    expect(d?.text).toMatch(/Parked off the page \(1\): photo 3/);
    expect(d?.elements[0]).toMatchObject({ id: 't-b', binding: 'journey.title', text: 'Iceland' });
  });

  it('BOOKDESC-024: says how a styled photo, a shape, an icon and every travel element are set', () => {
    const f = (x: number, y: number) => ({ x, y, w: 40, h: 30 });
    const els: BookElement[] = [
      photo('p-s', 1, f(230, 10), { filter: 'bw', mask: 'ellipse', frameStyle: 'polaroid', radius: 2 }),
      bookShapeElementSchema.parse({
        id: 's-1',
        kind: 'shape',
        frame: f(280, 10),
        gradient: 'down',
        stroke: '#ff0000',
        strokeWidth: 0.5,
        strokeStyle: 'dashed',
        radius: 2,
        rotation: 5,
        opacity: 0.5,
        locked: true,
      }) as BookElement,
      bookIconElementSchema.parse({ id: 'ic-1', kind: 'icon', frame: f(330, 10), name: 'Compass' }) as BookElement,
      bookMapElementSchema.parse({
        id: 'm-1',
        kind: 'map',
        frame: f(230, 50),
        tripId: 3,
        path: [
          [
            [64.1, -21.9],
            [64.2, -21.8],
          ],
          [[65.6, -18.1]],
        ],
      }) as BookElement,
      bookMapElementSchema.parse({ id: 'm-2', kind: 'map', frame: f(280, 50) }) as BookElement,
      bookStatsElementSchema.parse({
        id: 'st-1',
        kind: 'stats',
        frame: f(330, 50),
        metrics: ['distance', 'days'],
        values: { distance: 1200 },
        stale: true,
      }) as BookElement,
      bookCountriesElementSchema.parse({
        id: 'c-1',
        kind: 'countries',
        frame: f(230, 90),
        codes: ['IS', 'NO'],
      }) as BookElement,
      bookBadgeElementSchema.parse({
        id: 'b-1',
        kind: 'badge',
        frame: f(280, 90),
        text: '13',
        sub: 'June',
      }) as BookElement,
      bookListElementSchema.parse({
        id: 'l-1',
        kind: 'list',
        frame: f(330, 90),
        items: [
          { text: 'Hot springs', tone: 'pro' },
          { text: 'Wind', tone: 'con' },
        ],
      }) as BookElement,
    ];
    const t = describeSpread(book(els), 'sp-in', gallery)?.text ?? '';
    expect(t).toMatch(/1\. photo p-s .*, filter bw, mask ellipse, frame style polaroid, radius 2/);
    expect(t).toMatch(
      /2\. shape s-1 at .*: rect, fill #111827, fading down, stroke #ff0000 0\.5 mm dashed, radius 2; turned 5 deg, opacity 0\.5, locked/,
    );
    expect(t).toMatch(/3\. icon ic-1 at .*: icon Compass, #111827, line 2/);
    expect(t).toMatch(
      /4\. map m-1 at .*: minimal vector map of trip 3, 0 stops, 0 countries, a recorded track of 2 segments; sans bold, ink #1a1a1a, accent #111111, type x1/,
    );
    expect(t).toMatch(/5\. map m-2 at .*: minimal vector map of the whole journey, 0 stops, 0 countries; sans bold/);
    expect(t).toMatch(
      /6\. stats st-1 at .*: figures \(grid\): distance 1200, days 0; .*; its figures are out of date with the journey/,
    );
    expect(t).toMatch(/7\. countries c-1 at .*: 2 countries \(IS, NO\), list; /);
    expect(t).toMatch(/8\. badge b-1 at .*: date mark "13" over "June", plain; /);
    expect(t).toMatch(/9\. list l-1 at .*: list of 2 \(1 pros, 1 others\), columns; /);
  });
});

describe('summaries', () => {
  it('BOOKDESC-018: sums a page up for get_book, and a book without its document', () => {
    const doc = book([...clean(), photo('p-e', null, { x: 330, y: 20, w: 40, h: 30 })]);
    expect(summarizeSpread(doc.spreads[2] as BookSpread, 2)).toEqual({
      index: 2,
      id: 'sp-in',
      role: 'inner',
      entryId: null,
      background: null,
      photoIds: [1],
      texts: ['Harbour'],
      elements: 3,
      emptyFrames: 1,
      parked: 0,
    });
    const overview = summarizeBook(doc, 4);
    expect(bookOverviewSchema.safeParse(overview).success).toBe(true);
    expect(overview).toMatchObject({ exists: true, version: 4, title: 'Iceland' });
    expect(summarizeBook(null, null)).toMatchObject({ exists: false, version: null, spreads: [] });
  });

  it('BOOKDESC-019: lists the layouts a page can use, by kind', () => {
    const doc = book([]);
    const shape = bookShapeElementSchema.parse({ id: 's', kind: 'shape', frame: { x: 0, y: 0, w: 10, h: 10 } });
    const withSaved: BookDocument = {
      ...doc,
      layouts: [
        {
          id: 'L1',
          name: 'Mine',
          role: 'single',
          pageWidth: 210,
          pageHeight: 210,
          background: null,
          elements: [shape],
        },
      ],
    };
    const all = listBookLayouts(withSaved, doc.page);
    expect(all.inner.length).toBeGreaterThan(0);
    expect(all.single.length).toBeGreaterThan(0);
    expect(all.grids.length).toBeGreaterThan(0);
    expect(all.saved).toEqual([{ id: 'L1', name: 'Mine', role: 'single', photoFrames: 0, texts: 0 }]);
    const inner = listBookLayouts(withSaved, doc.page, 'inner');
    expect(inner.single).toEqual([]);
    expect(inner.saved).toEqual([]);
  });

  it('BOOKDESC-023: says with the layouts what a grid and a template do to the page', () => {
    const { notes } = listBookLayouts(null, book([]).page);
    expect(notes.grids).toMatch(/re-pours every photo of the page, placed or parked/);
    expect(notes.templates).toMatch(/shapes, maps, badges, stats, lists and icons are dropped/);
  });
});
