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
}

/** Square first: it is what a photo book usually is. */
export const PAGE_PRESET_ORDER: PagePresetId[] = [
  'square-210',
  'square-300',
  'a4-landscape',
  'a4-portrait',
  'a5-landscape',
]
