/**
 * Colour arithmetic for a printed page: reading `#rrggbb`, the WCAG contrast
 * between two colours, hue, saturation and lightness, the perceived distance
 * between two colours (CIE76 delta E in Lab), and the few colours a set of
 * photographs shares.
 *
 * Pure and small on purpose. The book engine checks every text against what
 * it is set on with these, and the design engine takes a book's accent from
 * its photos with them; neither needs more than this.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX = /^#([0-9a-f]{6})$/i;

/** `#rrggbb` as channels 0..255, or null for anything else. */
export function parseHex(hex: string): Rgb | null {
  const m = HEX.exec(hex.trim());
  const digits = m?.[1];
  if (!digits) return null;
  const n = Number.parseInt(digits, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const byte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

/** Channels back to `#rrggbb`, lower case. */
export function toHex(c: Rgb): string {
  const n = (byte(c.r) << 16) | (byte(c.g) << 8) | byte(c.b);
  return `#${n.toString(16).padStart(6, '0')}`;
}

const linear = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(c: Rgb): number {
  return 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
}

/** The luminance of a grey of this 0..255 level, for a photo whose mean brightness is all that is known. */
export function greyLuminance(level: number): number {
  return luminance({ r: level, g: level, b: level });
}

/** WCAG contrast ratio between two luminances, 1 to 21. */
export function contrastOfLuminance(a: number, b: number): number {
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG contrast ratio between two `#rrggbb` colours; 1 when either does not parse. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  return contrastOfLuminance(luminance(ca), luminance(cb));
}

/** The contrast a text needs: 4.5:1, or 3:1 from 18 pt (large type) up. */
export function requiredContrast(sizePt: number): number {
  return sizePt >= 18 ? 3 : 4.5;
}

export interface Hsl {
  /** Degrees, 0..360. */
  h: number;
  /** 0..1. */
  s: number;
  /** 0..1. */
  l: number;
}

export function toHsl(c: Rgb): Hsl {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

/** CIE Lab, D65, for the perceived distance between two colours. */
function toLab(c: Rgb): [number, number, number] {
  const r = linear(c.r);
  const g = linear(c.g);
  const b = linear(c.b);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIE76 delta E between two `#rrggbb` colours: about 2 is just noticeable, 12 plainly another colour. */
export function deltaE(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 0;
  const [l1, a1, b1] = toLab(ca);
  const [l2, a2, b2] = toLab(cb);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** One colour of a photo's palette and the share of the picture it covers. */
export interface PaletteSwatch {
  hex: string;
  share: number;
}

/**
 * Read a stored palette: `#rrggbb` or `#rrggbb:share` strings, at most five.
 * A missing share counts as an equal part.
 */
export function readPalette(list: readonly string[] | null | undefined): PaletteSwatch[] {
  const out: PaletteSwatch[] = [];
  for (const item of (list ?? []).slice(0, 5)) {
    const [hex = '', share] = item.split(':');
    if (!parseHex(hex)) continue;
    const n = share === undefined ? Number.NaN : Number(share);
    out.push({ hex: hex.toLowerCase(), share: Number.isFinite(n) && n > 0 ? n : 1 });
  }
  return out;
}

/**
 * The colours several palettes share, most common first: swatches within
 * `radius` delta E of a cluster join it (weighted by share), in a fixed order,
 * so the same photos always give the same answer.
 */
export function clusterPalettes(palettes: readonly PaletteSwatch[][], radius = 14): PaletteSwatch[] {
  const clusters: { rgb: Rgb; weight: number }[] = [];
  for (const swatch of palettes.flat()) {
    const rgb = parseHex(swatch.hex);
    if (!rgb) continue;
    const near = clusters.find((c) => deltaE(toHex(c.rgb), swatch.hex) <= radius);
    if (!near) {
      clusters.push({ rgb, weight: swatch.share });
      continue;
    }
    const w = near.weight + swatch.share;
    const mix = (a: number, b: number) => (a * near.weight + b * swatch.share) / w;
    near.rgb = { r: mix(near.rgb.r, rgb.r), g: mix(near.rgb.g, rgb.g), b: mix(near.rgb.b, rgb.b) };
    near.weight = w;
  }
  const total = clusters.reduce((sum, c) => sum + c.weight, 0) || 1;
  return clusters
    .map((c) => ({ hex: toHex(c.rgb), share: c.weight / total }))
    .sort((a, b) => b.share - a.share || a.hex.localeCompare(b.hex));
}

/**
 * The accent a set of photos suggests: the most common shared colour that is
 * a colour at all (saturation over 0.25) and neither near black nor near
 * white (lightness between 0.25 and 0.65). Null when the photos are grey.
 */
export function accentFromPalettes(palettes: readonly PaletteSwatch[][]): string | null {
  for (const swatch of clusterPalettes(palettes)) {
    const rgb = parseHex(swatch.hex);
    if (!rgb) continue;
    const { s, l } = toHsl(rgb);
    if (s > 0.25 && l > 0.25 && l < 0.65) return swatch.hex;
  }
  return null;
}

/** Of two candidate inks, the one that reads better on `ground`. */
export function readableInk(ground: string, dark = '#1a1a1a', light = '#ffffff'): string {
  return contrastRatio(dark, ground) >= contrastRatio(light, ground) ? dark : light;
}
