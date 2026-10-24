import type { BookPaint, BookShapeElement } from '@trek/shared';
import { useMemo, type CSSProperties } from 'react';
import { shapeOutline as edgedOutline, hasEdge } from '../shapeOutline';
import { HOLED_SHAPES } from '../shapes';
import { shapeOutline, strokeDash } from './paintGeometry';
import { PaintedPath } from './paintRender';

/**
 * A shape that carries a paint, drawn wholly in SVG.
 *
 * The shapes from before paint stay as SpreadView draws them, the rectangle
 * and the ellipse as CSS boxes, so no book that exists changes by a pixel.
 * A painted shape is one path whatever its kind: a gradient and a pattern
 * need an outline to lie over and to be cut to, and a rectangle with a radius
 * is as much an outline as a heart is.
 *
 * As in SpreadView, the path is drawn into the frame inset by half the
 * stroke, so the whole stroke sits inside the frame the editor snapped.
 */

export function PaintedShapeView({
  el,
  paint,
  frameStyle,
}: {
  el: BookShapeElement;
  paint: BookPaint;
  frameStyle: CSSProperties;
}) {
  const sw = el.stroke ? el.strokeWidth : 0;
  const w = Math.max(0.01, el.frame.w - sw);
  const h = Math.max(0.01, el.frame.h - sw);
  // A cut edge (shapeOutline.ts) replaces the drawn outline, paint or none.
  const d = useMemo(
    () => (hasEdge(el, el.shape) ? edgedOutline(el, w, h) : shapeOutline(el, w, h, sw / 2)),
    [el, w, h, sw]
  );
  const box = useMemo(() => ({ x: 0, y: 0, w, h }), [w, h]);

  return (
    <div style={frameStyle}>
      <svg
        width={`${el.frame.w}mm`}
        height={`${el.frame.h}mm`}
        viewBox={`0 0 ${el.frame.w} ${el.frame.h}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <g transform={sw ? `translate(${sw / 2} ${sw / 2})` : undefined}>
          <PaintedPath
            d={d}
            paint={paint}
            box={box}
            idPrefix={el.id}
            fillRule={HOLED_SHAPES.has(el.shape) ? 'evenodd' : undefined}
            stroke={el.stroke ?? undefined}
            strokeWidth={sw || undefined}
            strokeDasharray={strokeDash(el.strokeStyle, sw)}
            strokeLinecap={el.strokeStyle === 'dotted' ? 'round' : undefined}
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
