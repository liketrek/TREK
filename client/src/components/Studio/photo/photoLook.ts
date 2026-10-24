import type { BookPhotoDuotone, BookPhotoEdge, BookPhotoShadow, PhotoLook } from '@trek/shared';

/**
 * The photo look (book-photo-look.schema.ts in shared) turned into what the
 * page draws: CSS for the picture, the colour matrices of its SVG filter, and
 * the box shadows a rectangular frame wears.
 *
 * Pure, and apart from PhotoView, because these are the numbers the look
 * prints with and a rendered component is an awkward place to prove them.
 *
 * What prints as vector and what does not is decided here: a border, a hard
 * shadow and a cutout are boxes and paths of one colour, while adjustments,
 * warmth and a duotone are filters on the picture, which the printer receives
 * as a raster the way it already received the filter presets.
 */

/** #rrggbb with an alpha, for a shadow drawn at its own strength. */
export function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const round3 = (v: number) => Math.round(v * 1000) / 1000;

/**
 * Brightness, contrast and saturation as CSS filter functions, after the
 * preset filter. Half a step either way for the first two, which keeps the
 * ends of the slider usable; saturation runs from grey to twice the colour.
 */
export function adjustFilter(adjust: PhotoLook['adjust']): string[] {
  if (!adjust) return [];
  const out: string[] = [];
  if (adjust.brightness) out.push(`brightness(${round3(1 + adjust.brightness * 0.5)})`);
  if (adjust.contrast) out.push(`contrast(${round3(1 + adjust.contrast * 0.5)})`);
  if (adjust.saturation) out.push(`saturate(${round3(1 + adjust.saturation)})`);
  return out;
}

/** The filter on the picture: the preset, the adjustments, then the SVG filter when there is one. */
export function pictureFilter(
  preset: string | undefined,
  look: PhotoLook,
  svgFilterId: string | null
): string | undefined {
  const parts = [preset, ...adjustFilter(look.adjust), svgFilterId ? `url(#${svgFilterId})` : undefined].filter(
    (p): p is string => !!p
  );
  return parts.length ? parts.join(' ') : undefined;
}

/**
 * Warmth as a colour matrix: red up and blue down for warm, the reverse for
 * cool, green a little with red so a warm picture does not turn pink.
 */
export function warmthMatrix(warmth: number): string | null {
  if (!warmth) return null;
  const r = round3(1 + warmth * 0.12);
  const g = round3(1 + warmth * 0.03);
  const b = round3(1 - warmth * 0.12);
  return `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0`;
}

const channels = (hex: string) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255) as [number, number, number];
};

/** Rec. 709 luminance weights, the brightness the duotone maps from. */
const LUMA = [0.2126, 0.7152, 0.0722] as const;

/** A duotone as a colour matrix: the picture's luminance mapped from `dark` (black) to `light` (white). */
export function duotoneMatrix(duotone: BookPhotoDuotone): string {
  const dark = channels(duotone.dark);
  const light = channels(duotone.light);
  const rows = dark.map((d, i) => {
    const span = (light[i] ?? 0) - d;
    return `${LUMA.map((w) => round3(w * span)).join(' ')} 0 ${round3(d)}`;
  });
  return `${rows.join(' ')} 0 0 0 1 0`;
}

/** The colour matrices the picture's SVG filter applies, in order; empty when it needs none. */
export function svgFilterMatrices(look: PhotoLook): string[] {
  const warm = warmthMatrix(look.adjust?.warmth ?? 0);
  return [warm, look.duotone ? duotoneMatrix(look.duotone) : null].filter((m): m is string => m !== null);
}

/**
 * The die-cut edge and the hard shadow of a rectangular frame, as box
 * shadows: no blur, so each is one flat shape, drawn behind the frame and
 * following its corner radius. The shadow is grown by the cutout too, so it
 * falls from the whole sticker rather than from the picture inside it.
 */
export function silhouetteShadows(shadow: BookPhotoShadow | null, cutout: BookPhotoEdge | null): string[] {
  const out: string[] = [];
  const grow = cutout?.width ?? 0;
  if (cutout) out.push(`0 0 0 ${cutout.width}mm ${cutout.color}`);
  if (shadow) out.push(`${shadow.dx}mm ${shadow.dy}mm 0 ${grow}mm ${rgba(shadow.color, shadow.alpha)}`);
  return out;
}

/**
 * Where the picture sits inside a zoomed frame, as the image's own size and a
 * shift in its own percentages: z times the frame, moved so the focal point
 * stays where the frame put it at zoom 1.
 */
export function zoomPlacement(
  zoom: number,
  focalX: number,
  focalY: number
): { size: string; transform: string } | null {
  if (zoom <= 1) return null;
  const shift = (f: number) => round3((-(zoom - 1) * f * 100) / zoom);
  return { size: `${round3(zoom * 100)}%`, transform: `translate(${shift(focalX)}%, ${shift(focalY)}%)` };
}
