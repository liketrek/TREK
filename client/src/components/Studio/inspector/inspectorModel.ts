import type {
  BookElement,
  BookLineElement,
  BookMapElement,
  BookPhotoElement,
  BookShapeElement,
  BookStatsElement,
  BookTextElement,
} from '@trek/shared';
import { photoLookOf } from '@trek/shared';

/**
 * Which of the inspector's folded groups an element already uses.
 *
 * The groups people set once and rarely return to (the frame's numbers, the
 * effects, a photo's duotone) start folded, so the panel opens on what is
 * worth reading. A group the element already uses opens anyway: a turned
 * sticker shows its angle, a text in small caps shows its case, a photo with
 * a border shows its border. The panel remembers nothing between selections,
 * so the answer is always read off the element itself.
 */

/**
 * The position and size: open on an element that is turned or faded, and on
 * a sticker, which people set at an angle as a matter of course.
 */
export function positionInUse(el: BookElement): boolean {
  return el.kind === 'sticker' || el.rotation !== 0 || el.opacity < 1;
}

/** Case, the place of the lines in the frame and shrinking to fit: anything but upright lines at the top. */
export function textPlacementInUse(el: BookTextElement): boolean {
  return (el.transform ?? 'none') !== 'none' || (el.vAlign ?? 'top') !== 'top' || el.fit === 'shrink';
}

/** An outline, a hard shadow, a marker band, a curve or a fill other than the colour. */
export function textEffectsInUse(el: BookTextElement): boolean {
  return !!(el.outline || el.shadow || el.highlight || el.curve || el.fillPaint);
}

/** A shape's outline: drawn at a width, or set to dashes or dots. */
export function shapeOutlineInUse(el: BookShapeElement): boolean {
  return (!!el.stroke && el.strokeWidth > 0) || el.strokeStyle !== 'solid';
}

/** A cut edge (zigzag, scallop, torn and the rest) on a shape or a photo. */
export function edgeInUse(edge: string | undefined): boolean {
  return (edge ?? 'straight') !== 'straight';
}

/** A photo cut to a shape other than its own rectangle. */
export function maskInUse(el: BookPhotoElement): boolean {
  return !!el.mask && el.mask !== 'rect';
}

/** A photo's border, hard shadow or die-cut outline. */
export function photoEdgesInUse(el: BookPhotoElement): boolean {
  const look = photoLookOf(el);
  return !!(look.border || look.shadow || look.cutout);
}

/** Something in the middle of a drawn line: a sun, a heart, a dot. */
export function ornamentInUse(el: BookLineElement): boolean {
  return el.ornament !== 'none';
}

/** A map held at a zoom of its own rather than the one that fits its route. */
export function mapZoomInUse(el: BookMapElement): boolean {
  return el.zoom != null;
}

/**
 * A travel element set in another face, weight or size than it is placed in:
 * the sans at 700, at the drawn size (shared/src/book/book-travel.ts). The five
 * travel kinds share these three fields.
 */
export function travelTypeInUse(el: Pick<BookStatsElement, 'font' | 'weight' | 'textScale'>): boolean {
  return el.font !== 'sans' || el.weight !== 700 || el.textScale !== 1;
}

/**
 * The key the inspector mounts its groups under. A new selection mounts them
 * afresh, so every group opens or folds for the element now selected rather
 * than staying as it was left for the one before.
 */
export function selectionKey(ids: readonly string[]): string {
  return ids.join('|');
}
