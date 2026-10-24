import { strokeFindings } from './book-findings-lines';
import {
  LINE_MIN_EXTENT,
  bookLineCapSize,
  bookLineFrame,
  bookLineLength,
  bookLinePad,
  bookLinePoints,
  bookLineWithPoints,
} from './book-line';
import { normalizeBookDocument } from './book-normalize';
import { applyBookOps } from './book-ops';
import { bookLineStyled, bookNewLine } from './book-ops-line';
import { BOOK_FINDING_CODES, type BookPageOpInput } from './book-ops.schema';
import { blankBook } from './book-pages';
import {
  BOOK_EDGE_SHAPES,
  BOOK_SHAPES_MORE,
  BOOK_SHAPE_ASPECT,
  bookShapeSize,
  bookShapeTakesEdge,
} from './book-shapes-more';
import {
  BOOK_SHAPES,
  bookElementSchema,
  bookLineElementSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  type BookDocument,
  type BookElement,
  type BookLineElement,
  type BookSpread,
} from './book.schema';
import { bookEdgeWords, bookLineWords } from './describe-lines';
import { describeSpread } from './describe-spread';

import { describe, expect, it } from 'vitest';

/**
 * The second shelf of shapes, cut edges and the drawn line: what the document
 * keeps, the geometry the editor and the engine share, the `add` and `style`
 * operations the assistant reaches them by, what a page description says of
 * them and the two print checks.
 */

let seq = 0;
const newId = (p: string) => `${p}-n${++seq}`;
const frame = { x: 230, y: 40, w: 80, h: 60 };

const line = (over: Partial<BookLineElement> = {}) =>
  bookLineElementSchema.parse({ id: 'l1', kind: 'line', frame: { x: 220, y: 100, w: 100, h: 4 }, ...over });

function book(elements: BookElement[]): BookDocument {
  const doc = blankBook({ title: 'Iceland', newId: (p) => `${p}-x` });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements };
  return { ...doc, spreads };
}

const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;
const run = (doc: BookDocument, ops: BookPageOpInput[]) => applyBookOps(doc, { spreadId: 'sp-in', ops }, { newId });

function ok(result: ReturnType<typeof applyBookOps>): BookDocument {
  if (!result.ok) throw new Error(`refused: ${result.error.code} ${result.error.message}`);
  expect(bookSpreadSchema.safeParse(inner(result.doc)).success).toBe(true);
  return result.doc;
}
const last = (doc: BookDocument) => inner(doc).elements[inner(doc).elements.length - 1] as BookElement;
const near = (a: readonly number[], b: readonly number[]) => a.every((v, i) => Math.abs(v - (b[i] ?? NaN)) < 0.05);

describe('the document', () => {
  it('BKLINE-001: appends the second shelf behind the first, every id once, and keeps the aspect of each', () => {
    const first = BOOK_SHAPES.indexOf(BOOK_SHAPES_MORE[0]);
    expect(first).toBeGreaterThan(BOOK_SHAPES.indexOf('banner-flag'));
    expect(new Set(BOOK_SHAPES).size).toBe(BOOK_SHAPES.length);
    expect(Object.keys(BOOK_SHAPE_ASPECT).sort()).toEqual([...BOOK_SHAPES_MORE].sort());
    for (const s of BOOK_EDGE_SHAPES) expect(BOOK_SHAPES).toContain(s);
  });

  it('BKLINE-002: reads an edge on a shape and a photo as optional, so a book from before parses back as it was', () => {
    const old = bookShapeElementSchema.parse({ id: 's', kind: 'shape', frame });
    expect('edge' in old).toBe(false);
    const cut = bookShapeElementSchema.parse({ id: 's', kind: 'shape', frame, edge: 'perforated', edgeSize: 2.346 });
    expect(cut).toMatchObject({ edge: 'perforated', edgeSize: 2.35 });
    expect(bookShapeElementSchema.safeParse({ id: 's', kind: 'shape', frame, edgeSize: 0.1 }).success).toBe(false);
    const photo = bookPhotoElementSchema.parse({ id: 'p', kind: 'photo', frame, mask: 'arch-tall', edge: 'deckle' });
    expect(photo).toMatchObject({ mask: 'arch-tall', edge: 'deckle' });
  });

  it('BKLINE-003: fills a line from defaults, bounds its points, and keeps it through the salvage pass', () => {
    const el = line();
    expect(el).toMatchObject({ curve: 'straight', strokeWidth: 0.5, dash: 'solid', startCap: 'none', wobble: 0 });
    expect(el.points).toEqual([
      { x: 0, y: 0.5 },
      { x: 1, y: 0.5 },
    ]);
    expect(bookLineElementSchema.safeParse({ ...el, points: [{ x: 0, y: 0 }] }).success).toBe(false);
    expect(bookLineElementSchema.safeParse({ ...el, points: [{ x: 1.2, y: 0 }, el.points[1]] }).success).toBe(false);
    expect(bookElementSchema.parse(el)).toEqual(el);
    const doc = normalizeBookDocument(book([el, { id: 'bad', kind: 'line', frame, points: 'no' } as never]));
    expect(inner(doc).elements.map((e) => e.id)).toEqual(['l1']);
  });
});

describe('the geometry of a line', () => {
  it('BKLINE-004: fits a frame round its points, padded for its stroke, never thinner than a click', () => {
    const level = bookLineFrame(
      [
        [10, 50],
        [90, 50],
      ],
      { pad: 1 },
    );
    expect(level.frame).toEqual({ x: 9, y: 49, w: 82, h: LINE_MIN_EXTENT });
    expect(level.points).toEqual([
      { x: 0.0122, y: 0.5 },
      { x: 0.9878, y: 0.5 },
    ]);
    expect(bookLinePad(0.5)).toBe(0.75);
    expect(bookLinePad(0.5, ['none', 'arrow'])).toBeGreaterThan(bookLinePad(0.5));
    expect(bookLineCapSize(1)).toBe(4.8);
    expect(
      bookLineLength([
        [0, 0],
        [3, 4],
        [3, 10],
      ]),
    ).toBe(11);
  });

  it('BKLINE-005: puts every point back where it was given, whatever the turn', () => {
    const points: [number, number][] = [
      [230, 40],
      [300, 90],
      [260, 150],
    ];
    for (const rotation of [0, 17, -90, 135]) {
      const placed = bookLineWithPoints(line({ rotation }), points);
      expect(placed.rotation).toBe(rotation);
      bookLinePoints(placed).forEach((p, i) => expect(near(p, points[i] as number[])).toBe(true));
    }
  });
});

describe('the line operations', () => {
  it('BKLINE-006: adds a line half a page wide on the right-hand page, or through the points named', () => {
    const plain = last(ok(run(book([]), [{ op: 'add', element: { kind: 'line' } }])));
    expect(plain).toMatchObject({ kind: 'line', id: expect.stringMatching(/^l-/) });
    const ends = bookLinePoints(plain as BookLineElement);
    expect(near(ends[0] as number[], [262.5, 105])).toBe(true);
    expect(near(ends[1] as number[], [367.5, 105])).toBe(true);

    const element = {
      kind: 'line' as const,
      points: [
        { x: 230, y: 60 },
        { x: 330, y: 140 },
      ],
      endCap: 'arrow' as const,
      dash: 'dotted' as const,
      strokeWidth: 0.8,
    };
    const arrow = last(ok(run(book([]), [{ op: 'add', element }]))) as BookLineElement;
    expect(arrow).toMatchObject({ endCap: 'arrow', dash: 'dotted', strokeWidth: 0.8 });
    expect(near(bookLinePoints(arrow)[1] as number[], [330, 140])).toBe(true);
    const inFrame = last(ok(run(book([]), [{ op: 'add', element: { kind: 'line' }, frame }]))) as BookLineElement;
    expect(near(bookLinePoints(inFrame)[0] as number[], [230, 70])).toBe(true);
  });

  it('BKLINE-007: restyles a line, refits it when its ends move or grow a head, and refuses another kind', () => {
    const el = line();
    const moved = ok(
      run(book([el]), [
        {
          op: 'style',
          elementId: 'l1',
          set: {
            kind: 'line',
            points: [
              { x: 230, y: 30 },
              { x: 260, y: 80 },
              { x: 300, y: 30 },
            ],
            curve: 'smooth',
          },
        },
      ]),
    );
    const out = inner(moved).elements[0] as BookLineElement;
    expect(out.points).toHaveLength(3);
    expect(out.curve).toBe('smooth');
    expect(near(bookLinePoints(out)[1] as number[], [260, 80])).toBe(true);

    const headed = bookLineStyled(el, { endCap: 'arrow', strokeWidth: 2 });
    expect(headed.frame.h).toBeGreaterThan(el.frame.h);
    bookLinePoints(headed).forEach((p, i) => expect(near(p, bookLinePoints(el)[i] as number[])).toBe(true));
    expect(bookLineStyled(el, { stroke: '#ff0000' }).frame).toEqual(el.frame);

    const wrong = run(book([el]), [{ op: 'style', elementId: 'l1', set: { kind: 'shape', fill: '#000000' } }]);
    expect(wrong.ok ? null : wrong.error.code).toBe('wrong_kind');
    const moveFrame = ok(run(book([el]), [{ op: 'frame', elementId: 'l1', x: 10 }]));
    expect((inner(moveFrame).elements[0] as BookLineElement).points).toEqual(el.points);
  });

  it('BKLINE-008: makes a new line from the Studio shelf on a single page as on a spread', () => {
    const page = book([]).page;
    const single = bookNewLine({ dash: 'dashed' }, { id: 'l-s', frame: null, inner: false, page });
    expect(near(bookLinePoints(single)[0] as number[], [52.5, 105])).toBe(true);
    expect(single.dash).toBe('dashed');
  });
});

describe('edges and the second shelf through the operations', () => {
  it('BKLINE-009: cuts an edge on a shape and a photo by style, and sizes a new shape at its own proportions', () => {
    const shape = bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame });
    const photo = bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame });
    const doc = ok(
      run(book([shape, photo]), [
        { op: 'style', elementId: 's1', set: { kind: 'shape', edge: 'zigzag', edgeSize: 2.333 } },
        { op: 'style', elementId: 'p1', set: { kind: 'photo', edge: 'perforated', mask: 'stamp-rect' } },
      ]),
    );
    expect(inner(doc).elements[0]).toMatchObject({ edge: 'zigzag', edgeSize: 2.33 });
    expect(inner(doc).elements[1]).toMatchObject({ edge: 'perforated', mask: 'stamp-rect' });

    const ribbon = last(ok(run(book([]), [{ op: 'add', element: { kind: 'shape', shape: 'ribbon-ends' } }])));
    expect(ribbon.frame.w / ribbon.frame.h).toBeCloseTo(BOOK_SHAPE_ASPECT['ribbon-ends'], 1);
    expect(bookShapeSize('heart', 50)).toBeNull();
    const scroll = bookShapeSize('flourish-scroll', 50);
    expect(scroll?.w).toBe(100);
    expect(bookShapeTakesEdge(null)).toBe(true);
    expect(bookShapeTakesEdge('heart')).toBe(false);
  });
});

describe('what a page says of them', () => {
  it('BKLINE-010: describes a line by its points, length and look, and an edge by its kind and depth', () => {
    const el = line({ endCap: 'arrow', wobble: 0.5, ornament: 'star', squiggle: 'wave', dash: 'dashed' });
    const words = bookLineWords(el);
    expect(words).toMatch(/^line through \(220, 102\) \(320, 102\), 100 mm long/);
    expect(words).toContain('#141414 0.5 mm dashed');
    expect(words).toContain('ends none / arrow');
    expect(words).toContain('hand-drawn wobble 0.5');
    expect(words).toContain('star in the middle');
    expect(words).toContain('drawn as a wave');
    expect(bookEdgeWords({ edge: 'torn', edgeSize: 4 })).toBe('torn edge 4 mm');
    expect(bookEdgeWords({ edge: 'straight' })).toBeNull();
    expect(bookEdgeWords({})).toBeNull();

    const shape = bookShapeElementSchema.parse({ id: 's1', kind: 'shape', frame, edge: 'scallop' });
    const doc = book([el, shape]);
    const text = describeSpread(doc, 'sp-in')?.text ?? '';
    expect(text).toContain('line l1 at');
    expect(text).toContain('scallop edge 3 mm');
  });

  it('BKLINE-011: warns of a line or outline too thin to print, and of an edge set where none is cut', () => {
    expect(BOOK_FINDING_CODES).toEqual(expect.arrayContaining(['hairline', 'edge_unused']));
    const thin = line({ strokeWidth: 0.05 });
    const outline = bookShapeElementSchema.parse({
      id: 's1',
      kind: 'shape',
      frame,
      stroke: '#000000',
      strokeWidth: 0.06,
    });
    const heart = bookShapeElementSchema.parse({ id: 's2', kind: 'shape', frame, shape: 'heart', edge: 'zigzag' });
    const fine = bookShapeElementSchema.parse({ id: 's3', kind: 'shape', frame, edge: 'zigzag', strokeWidth: 0.05 });
    const photo = bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame, mask: 'star-5', edge: 'torn' });
    const spread = inner(book([thin, outline, heart, fine, photo]));
    const found = strokeFindings(spread).map((f) => `${f.code}:${f.elementIds.join()}`);
    expect(found).toEqual(['hairline:l1', 'hairline:s1', 'edge_unused:s2', 'edge_unused:p1']);
    const all = describeSpread(book([thin]), 'sp-in')?.findings.map((f) => f.code) ?? [];
    expect(all).toContain('hairline');
  });
});
