import type { BookDocument, PaletteSwatch } from '@trek/shared';

/**
 * The colours of the book's photographs, for "palette from photos".
 *
 * Read in the browser from the thumbnails the Studio already shows: each one
 * is drawn 24 pixels across onto a canvas that never reaches the page, its
 * pixels are put into coarse buckets, and the fullest buckets are the photo's
 * swatches. The shared engine clusters them across photos and picks the
 * accents (bookPaletteFromPhotos), so the choice itself is the same one the
 * assistant's design makes from a photo palette.
 */

/** The side of the sample drawn from each photo. */
const SAMPLE = 24;
/** How many photos are read at most: enough for a book's character, few enough to be instant. */
const MAX_THEME_PHOTOS = 12;
/** How many swatches one photo gives. */
const PER_PHOTO = 6;

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

/**
 * The swatches of an RGBA buffer: the pixels grouped by their top four bits a
 * channel, each group's mean colour and its share of the opaque pixels.
 */
export function swatchesFromPixels(data: ArrayLike<number>): PaletteSwatch[] {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>();
  let total = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if ((data[i + 3] ?? 0) < 128) continue;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n += 1;
    buckets.set(key, bucket);
    total += 1;
  }
  if (!total) return [];
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, PER_PHOTO)
    .map((c) => ({ hex: toHex(c.r / c.n, c.g / c.n, c.b / c.n), share: c.n / total }));
}

/** The photo ids a book shows, placed first, each once, at most MAX_THEME_PHOTOS. */
export function bookPhotoIds(doc: BookDocument | null): number[] {
  const ids = (doc?.spreads ?? []).flatMap((s) =>
    s.elements.flatMap((e) => (e.kind === 'photo' && e.photoId != null ? [e.photoId] : []))
  );
  return [...new Set(ids)].slice(0, MAX_THEME_PHOTOS);
}

/** One photo's swatches, or none when it cannot be read (gone, refused, still loading when aborted). */
export async function readPhotoSwatches(src: string, signal?: AbortSignal): Promise<PaletteSwatch[]> {
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    await img.decode();
    if (signal?.aborted) return [];
    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE;
    canvas.height = SAMPLE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
    return swatchesFromPixels(ctx.getImageData(0, 0, SAMPLE, SAMPLE).data);
  } catch {
    // A photo that will not load or will not be read gives no colours; the others still do.
    return [];
  }
}
