import { bookLineFrame, bookLinePad, bookLineWithPoints, bookLinePoints } from './book-line';
import type { BookFrame, BookLineElement, BookPageSetup } from './book.schema';

/**
 * What `add` and `style` do to a line, for the element operations
 * (book-ops-elements.ts): the Studio's own new line, and a restyle that
 * refits the frame when the points move or the ends grow a head.
 */

type Pt = readonly [number, number];

const LOOK_KEYS = [
  'opacity',
  'stroke',
  'strokeWidth',
  'dash',
  'curve',
  'squiggle',
  'startCap',
  'endCap',
  'wobble',
  'ornament',
] as const;

/** What a line op may carry: its look, and points on the spread in millimetres. */
interface BookLineSpec {
  points?: readonly { x: number; y: number }[];
  [key: string]: unknown;
}

const tuples = (points: readonly { x: number; y: number }[]): Pt[] => points.map((p) => [p.x, p.y]);

/** The look fields of a spec set on a line, untouched where the spec leaves them out. */
function withLook(el: BookLineElement, spec: BookLineSpec): BookLineElement {
  const next: Record<string, unknown> = { ...el };
  for (const key of LOOK_KEYS) {
    const value = spec[key];
    if (value === undefined) continue;
    next[key] = key === 'strokeWidth' && typeof value === 'number' ? Math.round(value * 100) / 100 : value;
  }
  return next as unknown as BookLineElement;
}

/**
 * A line restyled. New points, a wider stroke or a new head each refit the
 * frame, so the ends stay where they are drawn and the heads stay inside it.
 */
export function bookLineStyled(el: BookLineElement, spec: BookLineSpec): BookLineElement {
  const styled = withLook(el, spec);
  const reaches = spec.strokeWidth !== undefined || spec.startCap !== undefined || spec.endCap !== undefined;
  const points = spec.points ? tuples(spec.points) : reaches ? bookLinePoints(el) : null;
  return points ? bookLineWithPoints(styled, points) : styled;
}

/**
 * A new line, as the Studio's Lines shelf places it: a rule across the middle
 * of the given frame, or half a page wide across the right-hand page of a
 * spread (the left-hand one is the fold's other side), unless points are named.
 */
export function bookNewLine(
  spec: BookLineSpec,
  opts: { id: string; frame: BookFrame | null; inner: boolean; page: BookPageSetup },
): BookLineElement {
  const { page } = opts;
  const origin = opts.inner ? page.pageWidth : 0;
  const box = opts.frame ?? {
    x: origin + page.pageWidth * 0.25,
    y: page.pageHeight / 2,
    w: page.pageWidth * 0.5,
    h: 0,
  };
  const mid = box.y + box.h / 2;
  const points: readonly Pt[] = spec.points
    ? tuples(spec.points)
    : [
        [box.x, mid],
        [box.x + box.w, mid],
      ];
  const base: BookLineElement = {
    id: opts.id,
    kind: 'line',
    rotation: 0,
    opacity: 1,
    locked: false,
    frame: { x: 0, y: 0, w: 1, h: 1 },
    points: [
      { x: 0, y: 0.5 },
      { x: 1, y: 0.5 },
    ],
    curve: 'straight',
    stroke: '#141414',
    strokeWidth: 0.5,
    dash: 'solid',
    squiggle: 'none',
    startCap: 'none',
    endCap: 'none',
    wobble: 0,
    ornament: 'none',
  };
  const look = withLook(base, spec);
  const fit = bookLineFrame(points, { pad: bookLinePad(look.strokeWidth, [look.startCap, look.endCap]) });
  return { ...look, frame: fit.frame, points: fit.points };
}
