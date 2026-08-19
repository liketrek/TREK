/**
 * Book formats, in millimetres, because that is the language a print shop
 * speaks.
 *
 * These are photo-book sizes, not paper sizes. A4 is a stationery standard and
 * only some vendors print books in it; what CEWE, Saal and Polarsteps actually
 * bind is mostly square — Polarsteps' own book is 21 × 21, which is why that is
 * the default here. A5 landscape is the small, cheap format, 30 × 30 the big
 * coffee-table one.
 *
 * Trim is the finished page; bleed is what the guillotine takes; safe is the
 * margin nothing important may cross. A spread is two pages side by side, so its
 * drawing width is twice the page width.
 */
export interface PagePreset {
  id: PagePresetId
  /** One page, millimetres. */
  pageWidthMm: number
  pageHeightMm: number
  /** What gets drawn — a spread is two pages wide. */
  widthMm: number
  heightMm: number
  bleedMm: number
  safeMm: number
  labelKey: string
}

export type PagePresetId =
  | 'square-210'
  | 'square-300'
  | 'a4-landscape'
  | 'a4-portrait'
  | 'a5-landscape'
  /**
   * Any width and height at all.
   *
   * The five presets are what CEWE, Saal and Polarsteps actually bind, which
   * covers almost everyone — but "almost" is doing real work there. A local
   * printer with a 24 x 18 press, a book meant to sit in a particular shelf,
   * a format a vendor lists that nobody else does: the picker either has a way
   * to say that or those books cannot be made here at all.
   */
  | 'custom'

function preset(id: PagePresetId, w: number, h: number, labelKey: string): PagePreset {
  return {
    id,
    pageWidthMm: w,
    pageHeightMm: h,
    widthMm: w * 2,
    heightMm: h,
    bleedMm: 3,
    safeMm: 5,
    labelKey,
  }
}

export const PAGE_PRESETS: Record<PagePresetId, PagePreset> = {
  'square-210': preset('square-210', 210, 210, 'journey.studio.formatSquare21'),
  'square-300': preset('square-300', 300, 300, 'journey.studio.formatSquare30'),
  'a4-landscape': preset('a4-landscape', 297, 210, 'journey.studio.formatA4Landscape'),
  'a4-portrait': preset('a4-portrait', 210, 297, 'journey.studio.formatA4Portrait'),
  'a5-landscape': preset('a5-landscape', 210, 148, 'journey.studio.formatA5Landscape'),
  // The dimensions here are only the starting point the fields open on; the
  // document keeps whatever the user types.
  custom: preset('custom', 210, 210, 'journey.studio.formatCustom'),
}

/**
 * What a page may measure, in millimetres.
 *
 * The floor is a passport-sized book; the ceiling is what a large-format press
 * takes, and also what keeps a spread inside the schema two-decimal
 * millimetre field without the editor scaling to a smear.
 */
export const PAGE_MIN_MM = 60
export const PAGE_MAX_MM = 500

export function clampPageSize(value: number): number {
  if (!Number.isFinite(value)) return PAGE_MIN_MM
  return Math.min(PAGE_MAX_MM, Math.max(PAGE_MIN_MM, Math.round(value * 10) / 10))
}

/** Square first: it is what a photo book usually is. Custom last, as a way out. */
export const PAGE_PRESET_ORDER: PagePresetId[] = [
  'square-210',
  'square-300',
  'a4-landscape',
  'a4-portrait',
  'a5-landscape',
  'custom',
]
