import type { HolidaysMap, VacayEntry } from '../../../types'

// Users created before picking a color have color=null; same fallback the
// desktop persons panel uses.
export const FALLBACK_PERSON_COLOR = '#6366f1'

export interface DayVisual {
  background: string
  numColor: string
  boxShadow?: string
  // At least one person logged this day as a half day (#552) — the cell shows a ½ badge.
  half?: boolean
}

export interface DayVisualContext {
  todayStr: string
  entryMap: Record<string, VacayEntry[]>
  companyHolidaySet: Set<string>
  companyHolidaysEnabled: boolean
  holidays: HolidaysMap
  weekendDays: number[]
  // Shared read-only calendars per date (#444/#667) — drawn as inset rings on
  // top of whatever the cell shows, never as fills.
  sharedMap?: Record<string, { color: string }[]>
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h = Math.round(h * 60)
  if (h < 0) h += 360
  return { h, s, l }
}

/**
 * Light pastel tint of a person color for logged-day cells (the design's
 * pink/teal pastels, derived from the real member colors).
 */
export function personTint(color: string): string {
  const hsl = hexToHsl(color)
  if (!hsl) return color
  const s = Math.round(Math.min(hsl.s * 72, 80))
  return `hsl(${hsl.h} ${s}% 85%)`
}

/**
 * Dark readable ink for a day number on top of a pastel holiday-calendar
 * color (the design's #C0392B on #FBE0E0, generalized to any calendar color).
 */
export function holidayInk(color: string): string {
  const hsl = hexToHsl(color)
  if (!hsl) return 'var(--m-ink)'
  const s = Math.round(Math.min(Math.max(hsl.s * 80, 45), 75))
  return `hsl(${hsl.h} ${s}% 42%)`
}

/** Hard split background when several persons logged the same day. */
export function splitBackground(colors: string[]): string {
  const n = colors.length
  const stops = colors
    .map((c, i) => `${c} ${Math.round((i * 100) / n)}% ${Math.round(((i + 1) * 100) / n)}%`)
    .join(',')
  return `linear-gradient(105deg,${stops})`
}

/**
 * Day-cell color matrix, priority top-down: today ring > company holiday >
 * logged persons (pastel, split for several) > public holiday > weekend >
 * plain. Logged and company cells keep hard dark inks — the pastels are
 * theme-independent surfaces.
 */
function baseDayVisual(dateStr: string, dayOfWeek: number, ctx: DayVisualContext): DayVisual {
  if (dateStr === ctx.todayStr) {
    return { background: 'transparent', numColor: 'var(--m-ink)', boxShadow: 'inset 0 0 0 1.5px var(--m-ink)' }
  }
  if (ctx.companyHolidaysEnabled && ctx.companyHolidaySet.has(dateStr)) {
    return { background: '#F5D9A6', numColor: '#8A5A00' }
  }
  const entries = ctx.entryMap[dateStr]
  if (entries && entries.length > 0) {
    const tints = entries.map(e => personTint(e.person_color || FALLBACK_PERSON_COLOR))
    // The fill still shows WHO is off; half days (#552) keep it and add a corner
    // dot, so a half day never looks like a two-person split. Only set `half` when
    // true so full days keep their exact { background, numColor } shape.
    const visual: DayVisual = { background: tints.length === 1 ? tints[0] : splitBackground(tints), numColor: '#101013' }
    if (entries.some(e => (e.fraction ?? 1) === 0.5)) visual.half = true
    return visual
  }
  const holiday = ctx.holidays[dateStr]
  if (holiday) {
    return { background: holiday.color, numColor: holidayInk(holiday.color) }
  }
  if (ctx.weekendDays.includes(dayOfWeek)) {
    return { background: 'var(--m-ic)', numColor: 'var(--m-faint)' }
  }
  return { background: 'transparent', numColor: 'var(--m-muted)' }
}

export function dayVisual(dateStr: string, dayOfWeek: number, ctx: DayVisualContext): DayVisual {
  const visual = baseDayVisual(dateStr, dayOfWeek, ctx)
  // Shared calendars (#444/#667) draw inset rings over the base cell — capped at
  // two so tiny mini-grid cells stay readable. Nested inside the today ring.
  const rings = [...new Set((ctx.sharedMap?.[dateStr] || []).map(m => m.color))].slice(0, 2)
  if (rings.length > 0) {
    const shadows = visual.boxShadow ? [visual.boxShadow] : []
    const base = visual.boxShadow ? 1.5 : 0
    rings.forEach((c, i) => shadows.push(`inset 0 0 0 ${base + (i + 1) * 1.5}px ${c}`))
    visual.boxShadow = shadows.join(', ')
  }
  return visual
}

/** Empty leading cells before the 1st, honoring the configured week start. */
export function monthLead(year: number, month: number, weekStart: number): number {
  return (new Date(year, month, 1).getDay() - weekStart + 7) % 7
}

export function localDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
