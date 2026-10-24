import type { BookDocument, BookElement, BookPaint, BookSpread } from '@trek/shared';
import { bookPageSetupSchema, bookPhotoElementSchema, bookShapeElementSchema } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import { BookSheetsView } from '../../../src/components/Studio/BookSheetsView';
import {
  ellipsePath,
  linearLine,
  roundedRectPath,
  shapeOutline,
  strokeDash,
} from '../../../src/components/Studio/paint/paintGeometry';
import { PaintedPath, SpreadPaint } from '../../../src/components/Studio/paint/paintRender';
import { SpreadView } from '../../../src/components/Studio/SpreadView';
import { render } from '../../helpers/render';

/** The value, or a failed test saying it was missing. */
function need<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('expected a value');
  return value;
}

/**
 * Paint as the page draws it, and so as it prints.
 *
 * The one assertion this file exists for is the defs ids: page mode draws a
 * double spread twice, once per half, and an id that is the element's own
 * would then exist twice in the document. `url(#id)` resolves to the first,
 * so the second half would borrow the first half's gradient and lose its
 * pattern clip. Every id must be unique, and every reference must land on an
 * id inside its own copy of the page.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
const frame = { x: 20, y: 30, w: 80, h: 50 };

const linear: BookPaint = {
  type: 'linear',
  angle: 90,
  stops: [
    { at: 0, color: '#ff0000' },
    { at: 1, color: '#0000ff', alpha: 0.4 },
  ],
};
const radial: BookPaint = {
  type: 'radial',
  cx: 0.5,
  cy: 0.5,
  r: 1,
  stops: [
    { at: 0, color: '#ffffff' },
    { at: 1, color: '#000000' },
  ],
};
const dots: BookPaint = { type: 'pattern', pattern: 'dots', fg: '#112233', bg: '#ffeedd', scale: 1, angle: 30 };

const shape = (id: string, over: Record<string, unknown> = {}): BookElement =>
  bookShapeElementSchema.parse({ id, kind: 'shape', frame, ...over }) as BookElement;

const painted = (): BookSpread => ({
  id: 'sp1',
  role: 'inner',
  background: '#c0c0c0',
  backgroundPaint: radial,
  elements: [
    shape('g1', { paint: linear }),
    shape('h1', { shape: 'heart', paint: dots, stroke: '#000000', strokeWidth: 1 }),
    shape('r1', { shape: 'rect', radius: 4, paint: dots }),
    shape('old', { fill: '#336699', gradient: 'down', shape: 'star-5' }),
    bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame, photoId: 3, mask: 'heart' }) as BookElement,
  ],
  parked: [],
  entryId: null,
});

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((e) => e.id);

/** Every `url(#...)` a copy of the page points at, in attributes and in inline styles alike. */
const refs = (root: Element) => {
  const out: string[] = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    for (const attr of [...el.attributes]) {
      for (const m of attr.value.matchAll(/url\(#([^)]+)\)/g)) out.push(m[1]);
    }
  }
  return out;
};

describe('a spread drawn twice', () => {
  it('gives every defs id of each copy its own value', () => {
    const { container } = render(
      <>
        <div className="copy">
          <SpreadView spread={painted()} page={page} />
        </div>
        <div className="copy">
          <SpreadView spread={painted()} page={page} />
        </div>
      </>
    );
    const all = ids(container);
    // A gradient, a radial background, two pattern clips, an old fade and a photo mask, per copy.
    expect(all.length).toBeGreaterThanOrEqual(12);
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(id).toMatch(/^[\w-]+$/);

    for (const copy of container.querySelectorAll('.copy')) {
      const own = new Set(ids(copy));
      const pointed = refs(copy);
      expect(pointed.length).toBeGreaterThan(0);
      for (const ref of pointed) expect(own.has(ref)).toBe(true);
    }
  });

  it('stays unique when page mode prints the two halves of a spread', () => {
    const doc = { version: 1, title: 'T', page, spreads: [painted()] } as BookDocument;
    const { container } = render(<BookSheetsView doc={doc} mode="pages" marks={false} />);
    expect(container.querySelectorAll('.bx-sheet')).toHaveLength(2);
    const all = ids(container);
    expect(new Set(all).size).toBe(all.length);
    for (const sheet of container.querySelectorAll('.bx-sheet')) {
      const own = new Set(ids(sheet));
      for (const ref of refs(sheet)) expect(own.has(ref)).toBe(true);
    }
  });
});

describe('the page background', () => {
  it('paints the sheet out into the bleed and leaves the paper under it', () => {
    const { container } = render(<SpreadView spread={painted()} page={page} />);
    const sheet = container.firstElementChild as HTMLElement;
    expect(sheet.style.background).toContain('rgb(255, 255, 255)');
    const svg = sheet.firstElementChild as SVGSVGElement;
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('width')).toBe('426mm');
    expect(svg.getAttribute('height')).toBe('216mm');
    expect(svg.style.top).toBe('-3mm');
    expect(svg.querySelector('radialGradient')?.getAttribute('r')).toBe(
      String(Math.round(Math.hypot(426, 216) * 50) / 100)
    );
  });

  it('draws a page without paint exactly as before: its colour and nothing else', () => {
    const plain: BookSpread = { ...painted(), backgroundPaint: undefined, background: '#123456', elements: [] };
    const { container } = render(<SpreadView spread={plain} page={page} />);
    const sheet = container.firstElementChild as HTMLElement;
    expect(sheet.style.background).toContain('rgb(18, 52, 86)');
    expect(sheet.querySelector('svg')).toBeNull();
  });

  it('keeps the bleed window on paper too, when the page has a paint', () => {
    const doc = { version: 1, title: 'T', page, spreads: [{ ...painted(), role: 'cover' as const }] } as BookDocument;
    const { container } = render(<BookSheetsView doc={doc} mode="spreads" marks={false} />);
    const bleedWindow = need(container.querySelector('.bx-sheet')).firstElementChild as HTMLElement;
    expect(bleedWindow.style.background).toContain('rgb(255, 255, 255)');
  });
});

describe('a painted shape', () => {
  it('draws a gradient in user space along the angle, its see-through stop as stop-opacity', () => {
    const { container } = render(
      <SpreadView spread={{ ...painted(), elements: [shape('g1', { paint: linear })] }} page={page} />
    );
    const grad = need(container.querySelector('linearGradient'));
    expect(grad.getAttribute('gradientUnits')).toBe('userSpaceOnUse');
    expect([grad.getAttribute('x1'), grad.getAttribute('x2')]).toEqual(['0', '80']);
    const stops = [...grad.querySelectorAll('stop')];
    expect(stops.map((s) => s.getAttribute('stop-opacity'))).toEqual([null, '0.4']);
    const path = container.querySelector(`path[fill="url(#${grad.id})"]`);
    expect(path).not.toBeNull();
  });

  it('draws a pattern clipped to the outline, over its ground, under its stroke', () => {
    const { container } = render(
      <SpreadView
        spread={{
          ...painted(),
          backgroundPaint: undefined,
          elements: [shape('h1', { shape: 'heart', paint: dots, stroke: '#000000', strokeWidth: 1 })],
        }}
        page={page}
      />
    );
    const clip = need(container.querySelector('clipPath'));
    expect(clip.getAttribute('clipPathUnits')).toBe('userSpaceOnUse');
    const group = need(container.querySelector(`g[clip-path="url(#${clip.id})"]`));
    expect(need(group.querySelector('g')).getAttribute('transform')).toMatch(/^rotate\(30 /);
    const paths = [...container.querySelectorAll('svg path')];
    const ground = paths.find((p) => p.getAttribute('fill') === '#ffeedd');
    const outline = paths[paths.length - 1];
    expect(ground).toBeDefined();
    expect([outline.getAttribute('fill'), outline.getAttribute('stroke')]).toEqual(['none', '#000000']);
  });

  it('draws a painted rectangle as an outline with its corners rounded inside the stroke', () => {
    expect(shapeOutline({ shape: 'rect', radius: 4 }, 20, 10, 1)).toBe(roundedRectPath(20, 10, 3));
    expect(shapeOutline({ shape: 'ellipse', radius: 0 }, 20, 10, 0)).toBe(ellipsePath(20, 10));
    expect(shapeOutline({ shape: 'triangle', radius: 0 }, 20, 10, 0)).toBe('M10 0L20 10L0 10Z');
  });

  it('leaves a shape from before paint to the old renderer', () => {
    const { container } = render(
      <SpreadView
        spread={{ ...painted(), backgroundPaint: undefined, elements: [shape('o', { fill: '#336699' })] }}
        page={page}
      />
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('the geometry helpers', () => {
  const box = { x: 0, y: 0, w: 100, h: 50 };

  it('runs a linear gradient the way CSS does: 0 towards the top, 90 towards the right', () => {
    expect(linearLine(0, box)).toEqual({ x1: 50, y1: 50, x2: 50, y2: 0 });
    expect(linearLine(90, box)).toEqual({ x1: 0, y1: 25, x2: 100, y2: 25 });
    expect(linearLine(180, box)).toEqual({ x1: 50, y1: 0, x2: 50, y2: 50 });
    const diag = linearLine(45, { x: 0, y: 0, w: 10, h: 10 });
    expect(diag).toEqual({ x1: 0, y1: 10, x2: 10, y2: 0 });
  });

  it('rounds a rectangle only as far as its sides allow, and draws an ellipse in two arcs', () => {
    expect(roundedRectPath(10, 6, 0)).toBe('M0 0H10V6H0Z');
    expect(roundedRectPath(10, 6, 50)).toContain('A3 3 0 0 1');
    expect(ellipsePath(10, 6)).toBe('M0 3A5 3 0 1 0 10 3A5 3 0 1 0 0 3Z');
  });

  it('dashes in proportion to the stroke', () => {
    expect(strokeDash('solid', 1)).toBeUndefined();
    expect(strokeDash('dashed', 2)).toBe('6 4');
    expect(strokeDash('dotted', 2)).toBe('0.02 4');
  });

  it('draws a see-through solid with fill-opacity and no paint as an outline alone', () => {
    const { container } = render(
      <svg>
        <PaintedPath d="M0 0H1V1Z" paint={{ type: 'solid', color: '#ff0000', alpha: 0.5 }} box={box} idPrefix="a" />
        <PaintedPath d="M0 0H1V1Z" paint={null} box={box} idPrefix="b" stroke="#000000" />
      </svg>
    );
    const [solid, none] = [...container.querySelectorAll('path')];
    expect([solid.getAttribute('fill'), solid.getAttribute('fill-opacity')]).toEqual(['#ff0000', '0.5']);
    expect([none.getAttribute('fill'), none.getAttribute('stroke')]).toEqual(['none', '#000000']);
    expect(container.querySelector('defs')).toBeNull();
  });

  it('places the page paint from minus the bleed, left to right whatever the language', () => {
    const { container } = render(<SpreadPaint paint={radial} width={210} height={210} bleed={5} idPrefix="x" />);
    const svg = need(container.querySelector('svg'));
    expect([svg.style.direction, svg.style.insetInlineStart, svg.style.top]).toEqual(['ltr', '-5mm', '-5mm']);
  });
});
