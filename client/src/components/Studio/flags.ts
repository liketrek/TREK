/**
 * Flags, drawn rather than typed.
 *
 * ── Why not the emoji ─────────────────────────────────────────────────────
 *
 * A regional-indicator pair is the obvious answer and works on macOS, Linux and
 * Android. It does not work on Windows: Chrome there has no flag glyphs at all
 * and falls back to drawing the two letters, so "DE" is what a Windows user
 * sees. Since that is most users, and since a book element that renders as two
 * capitals is not a flag, the emoji is not an option.
 *
 * ── Why not a flag icon set ───────────────────────────────────────────────
 *
 * Every country as an SVG is a few megabytes — more than the whole of Studio —
 * to decorate a badge, and it would have to be lazily fetched at exactly the
 * moment the print renderer cannot fetch anything.
 *
 * ── What this does instead ────────────────────────────────────────────────
 *
 * Most flags of the countries people put in travel books are constructions:
 * equal stripes, a Nordic cross, a centred cross, a disc on a field. Those can
 * be drawn exactly from a handful of numbers and a list of colours, and are
 * listed here only where the construction is genuinely exact — a flag with a
 * coat of arms, an emblem or unequal stripes is deliberately absent rather than
 * approximated, because a wrong flag is worse than no flag.
 *
 * Anything not listed falls back to the country's silhouette, which
 * `countryShapes.ts` has for 198 countries and which is never wrong.
 */

export type FlagSpec =
  /** Equal horizontal bands, top to bottom. */
  | { t: 'h'; c: string[] }
  /** Equal vertical bands, left to right. */
  | { t: 'v'; c: string[] }
  /** Off-centre cross: field, cross, and an optional cross inside the cross. */
  | { t: 'nordic'; field: string; cross: string; inner?: string }
  /** Centred cross on a field. */
  | { t: 'cross'; field: string; cross: string }
  /** A disc on a plain field. */
  | { t: 'disc'; field: string; disc: string }

/**
 * The flags that can be drawn exactly.
 *
 * Ordered by region so a missing neighbour is easy to spot. Colours are the
 * official specifications where the country publishes one.
 */
export const FLAG_SPECS: Record<string, FlagSpec> = {
  // ── Nordic crosses ──────────────────────────────────────────────────────
  IS: { t: 'nordic', field: '#02529c', cross: '#ffffff', inner: '#dc1e35' },
  NO: { t: 'nordic', field: '#ba0c2f', cross: '#ffffff', inner: '#00205b' },
  SE: { t: 'nordic', field: '#005293', cross: '#fecb00' },
  DK: { t: 'nordic', field: '#c8102e', cross: '#ffffff' },
  FI: { t: 'nordic', field: '#ffffff', cross: '#002f6c' },

  // ── Horizontal bands ────────────────────────────────────────────────────
  DE: { t: 'h', c: ['#000000', '#dd0000', '#ffce00'] },
  NL: { t: 'h', c: ['#ae1c28', '#ffffff', '#21468b'] },
  RU: { t: 'h', c: ['#ffffff', '#0039a6', '#d52b1e'] },
  AT: { t: 'h', c: ['#ed2939', '#ffffff', '#ed2939'] },
  HU: { t: 'h', c: ['#cd2a3e', '#ffffff', '#436f4d'] },
  BG: { t: 'h', c: ['#ffffff', '#00966e', '#d62612'] },
  LT: { t: 'h', c: ['#fdb913', '#006a44', '#c1272d'] },
  EE: { t: 'h', c: ['#0072ce', '#000000', '#ffffff'] },
  LU: { t: 'h', c: ['#ed2939', '#ffffff', '#00a1de'] },
  AM: { t: 'h', c: ['#d90012', '#0033a0', '#f2a800'] },
  SL: { t: 'h', c: ['#1eb53a', '#ffffff', '#0072c6'] },
  YE: { t: 'h', c: ['#ce1126', '#ffffff', '#000000'] },
  PL: { t: 'h', c: ['#ffffff', '#dc143c'] },
  ID: { t: 'h', c: ['#ff0000', '#ffffff'] },
  MC: { t: 'h', c: ['#ce1126', '#ffffff'] },
  UA: { t: 'h', c: ['#005bbb', '#ffd500'] },

  // ── Vertical bands ──────────────────────────────────────────────────────
  FR: { t: 'v', c: ['#002395', '#ffffff', '#ed2939'] },
  IT: { t: 'v', c: ['#008c45', '#f4f5f0', '#cd212a'] },
  BE: { t: 'v', c: ['#000000', '#fae042', '#ed2939'] },
  IE: { t: 'v', c: ['#169b62', '#ffffff', '#ff883e'] },
  RO: { t: 'v', c: ['#002b7f', '#fcd116', '#ce1126'] },
  ML: { t: 'v', c: ['#14b53a', '#fcd116', '#ce1126'] },
  GN: { t: 'v', c: ['#ce1126', '#fcd116', '#009460'] },
  CI: { t: 'v', c: ['#ff8200', '#ffffff', '#009e60'] },
  TD: { t: 'v', c: ['#002664', '#fecb00', '#c60c30'] },
  NG: { t: 'v', c: ['#008751', '#ffffff', '#008751'] },
  PE: { t: 'v', c: ['#d91023', '#ffffff', '#d91023'] },

  // ── Crosses and discs ───────────────────────────────────────────────────
  CH: { t: 'cross', field: '#da291c', cross: '#ffffff' },
  JP: { t: 'disc', field: '#ffffff', disc: '#bc002d' },
  BD: { t: 'disc', field: '#006a4e', disc: '#f42a41' },
}

export interface FlagBand {
  x: number
  y: number
  w: number
  h: number
  fill: string
}

/** A flag is drawn on a 30 × 20 box — the 3:2 most countries use. */
export const FLAG_W = 30
export const FLAG_H = 20

/**
 * The rectangles a flag is made of, in draw order.
 *
 * Rectangles rather than paths because every construction here is rectangular,
 * and a rectangle survives being scaled to a badge without a path parser. The
 * disc is the one exception and comes back separately.
 */
export function flagBands(spec: FlagSpec): FlagBand[] {
  if (spec.t === 'h') {
    const h = FLAG_H / spec.c.length
    return spec.c.map((fill, i) => ({ x: 0, y: i * h, w: FLAG_W, h, fill }))
  }
  if (spec.t === 'v') {
    const w = FLAG_W / spec.c.length
    return spec.c.map((fill, i) => ({ x: i * w, y: 0, w, h: FLAG_H, fill }))
  }
  if (spec.t === 'cross') {
    // A fifth of the height, centred both ways.
    const bar = FLAG_H / 5
    return [
      { x: 0, y: 0, w: FLAG_W, h: FLAG_H, fill: spec.field },
      { x: (FLAG_W - bar) / 2, y: FLAG_H * 0.15, w: bar, h: FLAG_H * 0.7, fill: spec.cross },
      { x: FLAG_W / 2 - FLAG_H * 0.35, y: (FLAG_H - bar) / 2, w: FLAG_H * 0.7, h: bar, fill: spec.cross },
    ]
  }
  if (spec.t === 'nordic') {
    // The upright sits left of centre — that offset is what makes it Nordic
    // rather than a plain cross.
    const bar = FLAG_H / 5
    const upright = FLAG_W * 0.34
    const out: FlagBand[] = [
      { x: 0, y: 0, w: FLAG_W, h: FLAG_H, fill: spec.field },
      { x: upright - bar / 2, y: 0, w: bar, h: FLAG_H, fill: spec.cross },
      { x: 0, y: (FLAG_H - bar) / 2, w: FLAG_W, h: bar, fill: spec.cross },
    ]
    if (spec.inner) {
      const thin = bar / 2
      out.push(
        { x: upright - thin / 2, y: 0, w: thin, h: FLAG_H, fill: spec.inner },
        { x: 0, y: (FLAG_H - thin) / 2, w: FLAG_W, h: thin, fill: spec.inner },
      )
    }
    return out
  }
  return [{ x: 0, y: 0, w: FLAG_W, h: FLAG_H, fill: spec.field }]
}

/** The disc on a disc flag, or null for every other construction. */
export function flagDisc(spec: FlagSpec): { cx: number; cy: number; r: number; fill: string } | null {
  if (spec.t !== 'disc') return null
  return { cx: FLAG_W / 2, cy: FLAG_H / 2, r: FLAG_H * 0.3, fill: spec.disc }
}

export function flagSpec(code: string | null | undefined): FlagSpec | null {
  if (!code) return null
  return FLAG_SPECS[code.toUpperCase()] ?? null
}
