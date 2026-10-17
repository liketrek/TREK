import type { FerrataPaint } from './ferrataPaint';

/**
 * The small route icon a via ferrata carries at its midpoint once the map is
 * zoomed in: a ladder in the line colour on a disc of the casing colour, so it
 * reads as part of the line it sits on.
 *
 * One SVG for both renderers: Leaflet puts it in a divIcon, where it can take
 * `var(--token)` straight from the page; GL needs an image with the colours
 * resolved, which `loadFerrataIcon` makes from the resolved paint.
 */

/** The zoom from which the icons show; below it they would crowd a valley full of ferratas. */
export const FERRATA_ICON_MIN_ZOOM = 13;

/** The icon's size on screen, in CSS pixels. */
export const FERRATA_ICON_SIZE = 22;

/** The name the GL renderer registers the image under. */
export const FERRATA_ICON_IMAGE = 'trek-ferrata-icon';

/**
 * A colour as it may go into the markup: a resolved token (a hex, `rgb()` or
 * named value) or a `var(--token)`. Anything else, which a token never
 * resolves to, falls back to `currentColor` rather than reaching the SVG.
 */
function safeColour(value: string): string {
  return /^[#\w\s(),.%-]+$/.test(value) ? value : 'currentColor';
}

export function ferrataIconSvg(paint: Pick<FerrataPaint, 'line' | 'casing'>, size = FERRATA_ICON_SIZE): string {
  const line = safeColour(paint.line);
  const casing = safeColour(paint.casing);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 22 22" aria-hidden="true">`,
    `<circle cx="11" cy="11" r="9.75" fill="${casing}" stroke="${line}" stroke-width="1.5"/>`,
    `<path d="M8 6v10M14 6v10M8 8.5h6M8 11h6M8 13.5h6" fill="none" stroke="${line}" stroke-width="1.6" stroke-linecap="round"/>`,
    '</svg>',
  ].join('');
}

/** How sharp the GL image is drawn; the map scales it back to FERRATA_ICON_SIZE. */
export const FERRATA_ICON_PIXEL_RATIO = 2;

/**
 * The icon as an image for a GL map, in the colours the tokens resolve to now.
 * Rejects when the browser cannot decode it, and the lines then simply go
 * without their icons.
 */
export function loadFerrataIcon(paint: Pick<FerrataPaint, 'line' | 'casing'>): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image(FERRATA_ICON_SIZE * FERRATA_ICON_PIXEL_RATIO, FERRATA_ICON_SIZE * FERRATA_ICON_PIXEL_RATIO);
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The via ferrata icon could not be drawn'));
    const svg = ferrataIconSvg(paint, FERRATA_ICON_SIZE * FERRATA_ICON_PIXEL_RATIO);
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/** The room an icon keeps to the next one, in CSS pixels, so two discs never touch. */
export const FERRATA_ICON_GAP = FERRATA_ICON_SIZE + 4;

/**
 * Which icons fit on screen without touching one another, for a renderer that
 * does not place symbols itself (Leaflet; GL keeps `icon-allow-overlap` off for
 * the same effect). `points` are the icons' screen positions in pixels, in the
 * order they should win: an icon closer than FERRATA_ICON_GAP to one already
 * placed is left out.
 */
export function placeFerrataIcons(points: ReadonlyArray<{ id: string; x: number; y: number }>): Set<string> {
  const placed: Array<{ x: number; y: number }> = [];
  const ids = new Set<string>();
  for (const point of points) {
    if (placed.some((other) => Math.hypot(other.x - point.x, other.y - point.y) < FERRATA_ICON_GAP)) continue;
    placed.push(point);
    ids.add(point.id);
  }
  return ids;
}
