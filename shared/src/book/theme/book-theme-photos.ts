import { clusterPalettes, contrastRatio, deltaE, parseHex, toHsl, type PaletteSwatch } from '../book-colour';
import { mixHex } from './book-theme';
import type { BookPalette } from './book-theme.schema';

/**
 * A palette from the book's own photographs: the paper and the ink stay as
 * the theme has them, and the three accents become the colours the pictures
 * share most, as long as each is a colour at all and plainly another one
 * than the accents before it. The first accent is the one words and marks
 * take, so it is darkened towards the ink until it reads at 3:1 on the paper.
 */

/** Accents closer than this (CIE76) count as one. */
const DISTINCT = 18;

function isColour(hex: string): boolean {
  const c = parseHex(hex);
  if (!c) return false;
  const { s, l } = toHsl(c);
  return s > 0.22 && l > 0.18 && l < 0.82;
}

/** A colour moved towards the ink in steps until it reads at `ratio` on the paper. */
function readableAccent(hex: string, palette: BookPalette, ratio = 3): string {
  let out = hex;
  for (let step = 1; step <= 8 && contrastRatio(out, palette.paper) < ratio; step++) {
    out = mixHex(hex, palette.ink, step / 10);
  }
  return out;
}

/**
 * The palette with accents from the photos' palettes, or null when the photos
 * are too grey to give even one.
 */
export function bookPaletteFromPhotos(palette: BookPalette, photos: readonly PaletteSwatch[][]): BookPalette | null {
  const picked: string[] = [];
  for (const swatch of clusterPalettes(photos)) {
    if (picked.length === 3) break;
    if (!isColour(swatch.hex) || picked.some((p) => deltaE(p, swatch.hex) < DISTINCT)) continue;
    picked.push(swatch.hex);
  }
  const [first, second, third] = picked;
  if (!first) return null;
  return {
    ...palette,
    accent: readableAccent(first, palette),
    accent2: second ?? mixHex(first, palette.paper, 0.45),
    accent3: third ?? mixHex(palette.ink, first, 0.5),
  };
}
