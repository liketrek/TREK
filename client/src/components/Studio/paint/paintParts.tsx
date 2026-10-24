import { sortedStops, stopAlpha, type BookPaint, type BookPaintStop } from '@trek/shared';
import type { ReactNode } from 'react';
import { linearLine, r2 } from './paintGeometry';
import { patternGeometry, type PatternBox } from './patterns';

/**
 * A paint as SVG parts over a box (paintRender.tsx explains why the ids come
 * from useId): kept apart from the components that draw them, so a shape and
 * the letters of a text share it without the component file exporting a helper.
 */

/** A gradient's stops as SVG elements, in order. */
function stopElements(stops: readonly BookPaintStop[]): ReactNode {
  // Two stops may share an offset (a hard edge), so the index keys them.
  return sortedStops(stops).map((s, i) => (
    <stop key={i} offset={r2(s.at)} stopColor={s.color} stopOpacity={stopAlpha(s) < 1 ? stopAlpha(s) : undefined} />
  ));
}

/** What a painted outline needs: the defs to put in the SVG, and how to fill the outline. */
export interface PaintParts {
  defs: ReactNode;
  fill: string;
  fillOpacity?: number;
  /** A pattern's geometry, to draw clipped to the outline over its fill. */
  pattern: { clipId: string; layers: { d: string; opacity: number }[]; transform?: string; ink: string } | null;
}

/**
 * What drawing a paint over a box takes: the gradient definition and the fill
 * to point at it, or a pattern's geometry to draw clipped to the outline over
 * its ground. A shape's outline and the letters of a text both draw from it.
 */
export function paintParts(paint: BookPaint, box: PatternBox, id: string): PaintParts {
  switch (paint.type) {
    case 'solid':
      return {
        defs: null,
        fill: paint.color,
        fillOpacity: stopAlpha(paint) < 1 ? stopAlpha(paint) : undefined,
        pattern: null,
      };
    case 'linear': {
      const line = linearLine(paint.angle, box);
      return {
        defs: (
          <linearGradient id={id} gradientUnits="userSpaceOnUse" {...line}>
            {stopElements(paint.stops)}
          </linearGradient>
        ),
        fill: `url(#${id})`,
        pattern: null,
      };
    }
    case 'radial':
      return {
        defs: (
          <radialGradient
            id={id}
            gradientUnits="userSpaceOnUse"
            cx={r2(box.x + paint.cx * box.w)}
            cy={r2(box.y + paint.cy * box.h)}
            r={r2((paint.r * Math.hypot(box.w, box.h)) / 2)}
          >
            {stopElements(paint.stops)}
          </radialGradient>
        ),
        fill: `url(#${id})`,
        pattern: null,
      };
    case 'pattern': {
      const geo = patternGeometry(paint, box);
      return {
        defs: null,
        fill: paint.bg ?? 'none',
        pattern: { clipId: `${id}-clip`, layers: geo.layers, transform: geo.transform, ink: paint.fg },
      };
    }
  }
}
