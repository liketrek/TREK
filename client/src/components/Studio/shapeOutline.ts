import {
  BOOK_SHAPE_ASPECT,
  type BookPhotoElement,
  type BookShapeElement,
  type BookShapeId,
  bookShapeTakesEdge,
} from '@trek/shared';

import { seedOf } from './shapeDraw';
import { circle, roundRect } from './shapePrimitives';
import { SHAPE_PATHS, scalePath } from './shapes';
import { edgedPath } from './shapes-edges';

/**
 * The outline a shape or a photo's cut is drawn with, in millimetres, once
 * its edge is applied. SpreadView asks here rather than reading the table
 * directly, so the edge is one decision in one place.
 */

/** The edge depth used when an edge is chosen and no size: about a postage stamp's. */
export const DEFAULT_EDGE_SIZE = 3;

type Edged = Pick<BookShapeElement, 'edge' | 'edgeSize'>;

/** Whether the element's edge is cut along this outline (a heart, for one, keeps its drawn line). */
export function hasEdge(el: Edged, shape: BookShapeId | null): boolean {
  return !!el.edge && el.edge !== 'straight' && bookShapeTakesEdge(shape);
}

/** A box `w` by `h` in millimetres, as the outline the edge is cut along: a rect keeps its corner radius. */
function basePath(shape: BookShapeId | null, w: number, h: number, radius: number): string {
  if (shape === null || shape === 'rect') {
    const r = Math.min(radius, w / 2, h / 2);
    return r > 0 ? roundRect(r, 0, 0, w, h) : `M0 0L${w} 0L${w} ${h}L0 ${h}Z`;
  }
  if (shape === 'ellipse') return circle(w / 2, h / 2, w / 2, h / 2);
  return scalePath(SHAPE_PATHS[shape], w, h);
}

/** The outline of a shape `w` by `h` millimetres, its edge cut where it takes one. */
export function shapeOutline(
  el: Edged & Pick<BookShapeElement, 'id' | 'shape' | 'radius'>,
  w: number,
  h: number
): string {
  const edge = el.edge ?? 'straight';
  if (!hasEdge(el, el.shape)) return scalePath(SHAPE_PATHS[el.shape], w, h);
  return edgedPath(basePath(el.shape, w, h, el.radius), edge, el.edgeSize ?? DEFAULT_EDGE_SIZE, seedOf(el.id));
}

/**
 * The cut of a photo's picture box (`w` by `h` mm) as an objectBoundingBox
 * clip, 0..1 on both axes; null when the picture is the plain rectangle.
 *
 * The edge is cut in millimetres and only then divided down, so a stamp's
 * holes stay round on a wide photo, which they would not if the 0..1 path
 * were cut instead.
 */
export function photoClip(
  el: Pick<BookPhotoElement, 'id' | 'mask' | 'edge' | 'edgeSize' | 'radius'>,
  w: number,
  h: number
): string | null {
  const mask = el.mask && el.mask !== 'rect' ? el.mask : null;
  const edged = hasEdge(el, mask);
  if (w <= 0 || h <= 0) return null;
  let mm: string;
  if (edged) {
    mm = edgedPath(
      basePath(mask, w, h, el.radius),
      el.edge ?? 'straight',
      el.edgeSize ?? DEFAULT_EDGE_SIZE,
      seedOf(el.id)
    );
  } else if (mask) {
    mm = scalePath(SHAPE_PATHS[mask], w, h);
  } else {
    return null;
  }
  let axis = 0;
  return mm.replace(/-?\d*\.?\d+/g, (m) => {
    const v = Number(m) / (axis++ % 2 === 0 ? w : h);
    return String(Math.round(v * 100000) / 100000);
  });
}

/**
 * A shape as a tile draws it: at the proportions it was drawn at, so a thin
 * arrow is a thin arrow in the panel and not a square one. The first shelf
 * has no recorded proportions and fills its square, as it always has.
 */
export function shapeTile(shape: BookShapeId): { d: string; w: number; h: number } {
  const aspect = (BOOK_SHAPE_ASPECT as Readonly<Record<string, number>>)[shape];
  if (!aspect) return { d: SHAPE_PATHS[shape], w: 100, h: 100 };
  const w = aspect >= 1 ? 100 : 100 * aspect;
  const h = aspect >= 1 ? 100 / aspect : 100;
  return { d: scalePath(SHAPE_PATHS[shape], w, h), w, h };
}
