import { clusterPalettes, parseHex, toHex, toHsl, type PaletteSwatch } from '@trek/shared';

/**
 * The colours of a photograph, read in the browser while editing.
 *
 * The server keeps no palette for a photo the client can read, and the page
 * being edited is the one whose photos matter, so the swatches are read from
 * the pictures themselves: a thumbnail drawn small onto a canvas, its pixels
 * sorted into a few clusters by k-means. Small on purpose, 48 pixels across is
 * plenty to say a picture is mostly sea and sand, and it costs nothing next to
 * the thumbnail the page has already loaded.
 *
 * The canvas is only read here, never drawn into the book: what prints stays
 * the vector page.
 */

/** How many clusters one photo is read into. */
const PHOTO_CLUSTERS = 5;
/** The side of the thumbnail the pixels are read from. */
const SAMPLE = 48;

type Rgb = { r: number; g: number; b: number };

const dist2 = (a: Rgb, b: Rgb) => (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

/** The opaque pixels of an RGBA buffer, every `stride`-th one. */
export function samplePixels(data: ArrayLike<number>, stride = 1): Rgb[] {
  const out: Rgb[] = [];
  for (let i = 0; i + 3 < data.length; i += 4 * stride) {
    if ((data[i + 3] ?? 0) < 128) continue;
    out.push({ r: data[i] ?? 0, g: data[i + 1] ?? 0, b: data[i + 2] ?? 0 });
  }
  return out;
}

/**
 * k-means over pixels, seeded by farthest points from the mean so the same
 * picture always gives the same answer: no random start, no flicker as the
 * inspector re-renders. Clusters come back largest first.
 */
export function kmeansPalette(pixels: readonly Rgb[], k = PHOTO_CLUSTERS, rounds = 8): PaletteSwatch[] {
  if (!pixels.length || k < 1) return [];
  const mean = pixels.reduce((m, p) => ({ r: m.r + p.r, g: m.g + p.g, b: m.b + p.b }), { r: 0, g: 0, b: 0 });
  const first = { r: mean.r / pixels.length, g: mean.g / pixels.length, b: mean.b / pixels.length };
  const centres: Rgb[] = [first];
  while (centres.length < k) {
    let best: Rgb | null = null;
    let bestD = 0;
    for (const p of pixels) {
      const d = Math.min(...centres.map((c) => dist2(c, p)));
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) break;
    centres.push({ ...best });
  }

  let sizes: number[] = centres.map(() => 0);
  for (let round = 0; round < rounds; round++) {
    const sums = centres.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (const p of pixels) {
      let at = 0;
      let near = Infinity;
      centres.forEach((c, i) => {
        const d = dist2(c, p);
        if (d < near) {
          near = d;
          at = i;
        }
      });
      const s = sums[at];
      if (!s) continue;
      s.r += p.r;
      s.g += p.g;
      s.b += p.b;
      s.n++;
    }
    sums.forEach((s, i) => {
      if (s.n) centres[i] = { r: s.r / s.n, g: s.g / s.n, b: s.b / s.n };
    });
    sizes = sums.map((s) => s.n);
  }

  return centres
    .map((c, i) => ({ hex: toHex(c), share: (sizes[i] ?? 0) / pixels.length }))
    .filter((s) => s.share > 0)
    .sort((a, b) => b.share - a.share || a.hex.localeCompare(b.hex));
}

/**
 * The swatches several photos offer together: the clusters they share, most
 * common first, with near-greys and near-duplicates thinned so the row is a
 * choice of colours rather than five shades of the same overcast sky.
 */
export function photoSwatches(palettes: readonly PaletteSwatch[][], limit = 6): string[] {
  const out: string[] = [];
  let greys = 0;
  for (const swatch of clusterPalettes(palettes, 10)) {
    const rgb = parseHex(swatch.hex);
    if (!rgb) continue;
    const grey = toHsl(rgb).s < 0.12;
    // One grey is a useful neutral; a second is the same colour again.
    if (grey && greys >= 1) continue;
    if (grey) greys++;
    out.push(swatch.hex);
    if (out.length >= limit) break;
  }
  return out;
}

/** Read one picture's palette. Resolves empty when the picture cannot be read, never rejects. */
export function readPhotoPalette(src: string, signal?: AbortSignal): Promise<PaletteSwatch[]> {
  return new Promise((resolve) => {
    if (signal?.aborted || typeof document === 'undefined') {
      resolve([]);
      return;
    }
    const img = new Image();
    img.decoding = 'async';
    const done = (out: PaletteSwatch[]) => {
      signal?.removeEventListener('abort', abort);
      resolve(out);
    };
    const abort = () => {
      img.src = '';
      done([]);
    };
    signal?.addEventListener('abort', abort, { once: true });
    img.onerror = () => done([]);
    img.onload = () => done(paletteOfImage(img));
    img.src = src;
  });
}

function paletteOfImage(img: HTMLImageElement): PaletteSwatch[] {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  try {
    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
    return kmeansPalette(samplePixels(ctx.getImageData(0, 0, SAMPLE, SAMPLE).data, 2));
  } catch {
    // A picture from another origin taints the canvas; it simply offers no swatches.
    return [];
  }
}
