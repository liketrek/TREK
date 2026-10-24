import {
  BOOK_PHOTO_LOOK_KEYS,
  PHOTO_ZOOM,
  type BookPhotoAdjust,
  type BookPhotoDuotone,
  type BookPhotoEdge,
  type BookPhotoShadow,
} from './book-photo-look.schema';
import type { BookFrame, BookPhotoElement } from './book.schema';

/**
 * Reading the photo look (book-photo-look.schema.ts) the way the renderer,
 * the findings and the words for a model all read it: off where a field is
 * missing or null, an adjustment that changes nothing counted as none, the
 * zoom clamped to what the format allows.
 */

/** The four adjustments, in the order the inspector lists them. */
export const PHOTO_ADJUSTMENTS = ['brightness', 'contrast', 'saturation', 'warmth'] as const;
export type PhotoAdjustment = (typeof PHOTO_ADJUSTMENTS)[number];

/** The look of one photo, every part resolved. */
export interface PhotoLook {
  border: BookPhotoEdge | null;
  shadow: BookPhotoShadow | null;
  zoom: number;
  flipX: boolean;
  /** Null when every adjustment is 0. */
  adjust: Required<BookPhotoAdjust> | null;
  duotone: BookPhotoDuotone | null;
  cutout: BookPhotoEdge | null;
}

type LookSource = Pick<BookPhotoElement, (typeof BOOK_PHOTO_LOOK_KEYS)[number]>;

/** The adjustments with every one named, or null when none of them moves the picture. */
export function photoAdjustOf(adjust: BookPhotoAdjust | null | undefined): Required<BookPhotoAdjust> | null {
  if (!adjust) return null;
  const full = {
    brightness: adjust.brightness ?? 0,
    contrast: adjust.contrast ?? 0,
    saturation: adjust.saturation ?? 0,
    warmth: adjust.warmth ?? 0,
  };
  return PHOTO_ADJUSTMENTS.some((k) => full[k] !== 0) ? full : null;
}

/** The zoom a photo is drawn at: 1 when unset, inside the format's range otherwise. */
export function photoZoomOf(el: Pick<BookPhotoElement, 'zoom'>): number {
  const z = el.zoom;
  if (typeof z !== 'number' || !Number.isFinite(z)) return PHOTO_ZOOM.min;
  return Math.min(PHOTO_ZOOM.max, Math.max(PHOTO_ZOOM.min, z));
}

export function photoLookOf(el: LookSource): PhotoLook {
  return {
    border: el.border ?? null,
    shadow: el.shadow ?? null,
    zoom: photoZoomOf(el),
    flipX: el.flipX === true,
    adjust: photoAdjustOf(el.adjust),
    duotone: el.duotone ?? null,
    cutout: el.cutout ?? null,
  };
}

/** Whether the look draws the picture through a filter, which prints it as a raster. */
export function photoLookIsRaster(el: LookSource): boolean {
  const look = photoLookOf(el);
  return look.adjust !== null || look.duotone !== null;
}

/**
 * The box the picture is fitted into, in the frame's own coordinates: the
 * frame itself at zoom 1, and at zoom z a box z times its size placed so the
 * focal point sits where it sat. That is what keeps a focal point meaning the
 * same part of the picture at every zoom.
 */
export function photoZoomBox(frame: BookFrame, zoom: number, focalX: number, focalY: number): BookFrame {
  if (zoom <= 1) return frame;
  return {
    x: frame.x - (zoom - 1) * frame.w * focalX,
    y: frame.y - (zoom - 1) * frame.h * focalY,
    w: frame.w * zoom,
    h: frame.h * zoom,
  };
}

const n = (v: number) => `${Math.round(v * 10) / 10}`;
const signed = (v: number) => `${v > 0 ? '+' : ''}${Math.round(v * 100) / 100}`;

/** The look in words, for a model reading a page; empty when the photo wears none of it. */
export function photoLookWords(el: LookSource): string[] {
  const look = photoLookOf(el);
  const parts: string[] = [];
  if (look.border) parts.push(`border ${n(look.border.width)} mm ${look.border.color}`);
  if (look.shadow) {
    const s = look.shadow;
    parts.push(`hard shadow ${n(s.dx)}/${n(s.dy)} mm ${s.color} at ${Math.round(s.alpha * 100)}%`);
  }
  if (look.zoom > 1) parts.push(`zoom x${Math.round(look.zoom * 100) / 100}`);
  if (look.flipX) parts.push('mirrored');
  if (look.adjust) {
    const a = look.adjust;
    const moved = PHOTO_ADJUSTMENTS.filter((k) => a[k] !== 0).map((k) => `${k} ${signed(a[k])}`);
    parts.push(`adjusted ${moved.join(' ')} (raster in print)`);
  }
  if (look.duotone) parts.push(`duotone ${look.duotone.dark} to ${look.duotone.light} (raster in print)`);
  if (look.cutout) parts.push(`cutout ${n(look.cutout.width)} mm ${look.cutout.color}`);
  return parts;
}

/**
 * Where a part of the look starts when someone turns it on: a white print
 * border, a soft-black shadow down and to the right, a white die-cut edge,
 * and a navy to sand duotone. Print ink, not app chrome, which is why they
 * live here rather than in the theme.
 */
export const PHOTO_LOOK_STARTS = {
  border: { width: 4, color: '#ffffff' },
  shadow: { dx: 2, dy: 2, color: '#1a1a1a', alpha: 0.35 },
  cutout: { width: 3, color: '#ffffff' },
  duotone: { dark: '#1e3a8a', light: '#f5e6c8' },
} as const satisfies {
  border: BookPhotoEdge;
  shadow: BookPhotoShadow;
  cutout: BookPhotoEdge;
  duotone: BookPhotoDuotone;
};

/** The duotones the inspector offers in one press, dark ink first: navy on sand, ink on paper, plum, forest, wine. */
export const PHOTO_DUOTONES = [
  { dark: '#1e3a8a', light: '#f5e6c8' },
  { dark: '#141414', light: '#f4efe6' },
  { dark: '#4c1d95', light: '#fbcfb8' },
  { dark: '#0f3d2e', light: '#e6efd6' },
  { dark: '#9f1239', light: '#fde68a' },
] as const satisfies readonly BookPhotoDuotone[];
