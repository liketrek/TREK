import { schoolHolidayWash } from '../../../components/Vacay/holidayVisual'
import type { HolidaysMap, VacayEntry } from '../../../types'

// Users created before picking a color have color=null; same fallback the
// desktop persons panel uses.
export const FALLBACK_PERSON_COLOR = '#6366f1'

export interface DayVisual {
  background: string
  numColor: string
  // Set on hatched (comp/flex) cells, where the screen shows through between the
  // stripes and the digit needs its own contrast (#1074).
  textShadow?: string
  boxShadow?: string
  // At least one person logged this day as a half day (#552) — the cell shows a ½ badge.
  half?: boolean
  // Per-person fill segments for this day (#1074): each carries the person's tint and
  // whether they logged a comp/flex day (hatched, kind='comp') vs. a vacation day
  // (solid). Set only when someone is off; the cell renders overlays for 2+ people.
  segments?: { color: string; comp: boolean }[]
  // Colours of the school-holiday calendars covering this day — drawn as a rounded
  // accent band under the number, on top of whatever fill the cell already has.
  school?: string[]
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
  const n = Number.parseInt(m[1], 16)
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

/** Diagonal hatch of a tint for comp/flex days (#1074), matching the desktop card. */
export function hatchTint(color: string): string {
  return `repeating-linear-gradient(45deg, ${color} 0 2.5px, transparent 2.5px 5px)`
}

/**
 * Day-cell color matrix, priority top-down: today ring > company holiday >
 * logged persons (pastel, split for several) > public holiday > weekend >
 * plain. Logged and company cells keep hard dark inks — the pastels are
 * theme-independent surfaces.
 */
function baseDayVisual(dateStr: string, dayOfWeek: number, ctx: DayVisualContext): DayVisual {
  const holidayMarkers = ctx.holidays[dateStr]
  const holidays = Array.isArray(holidayMarkers) ? holidayMarkers : holidayMarkers ? [holidayMarkers] : []
  const publicHoliday = holidays.find(holiday => (holiday.type ?? 'public_holiday') === 'public_holiday')
  const schoolColors = holidays.filter(holiday => holiday.type === 'school_holiday').map(holiday => holiday.color)
  // The school band sits on top of any fill (person / company / public), so tag it
  // onto whatever visual this day resolves to rather than picking a single winner.
  const withSchool = (v: DayVisual): DayVisual => (schoolColors.length > 0 ? { ...v, school: schoolColors } : v)

  // Today is deliberately NOT decided here: it is a ring around whatever the day
  // already is, applied in dayVisual. Resolving it as its own visual meant a
  // vacation day or company holiday logged for today was stored and counted but
  // drawn as an empty cell.
  if (ctx.companyHolidaysEnabled && ctx.companyHolidaySet.has(dateStr)) {
    return withSchool({ background: '#F5D9A6', numColor: '#8A5A00' })
  }
  const entries = ctx.entryMap[dateStr]
  if (entries && entries.length > 0) {
    // The fill still shows WHO is off; half days (#552) keep it and add a corner dot.
    // Comp/flex days (#1074) hatch their segment. 1 person fills the cell directly
    // (solid or hatched); several render segment overlays, so the background stays
    // transparent underneath them.
    const segments = entries.map(e => ({ color: personTint(e.person_color || FALLBACK_PERSON_COLOR), comp: e.kind === 'comp' }))
    const single = segments.length === 1
    const background = single ? (segments[0].comp ? hatchTint(segments[0].color) : segments[0].color) : 'transparent'
    // The pastel fills are theme-independent surfaces, so every logged day keeps
    // the same hard dark digit. An all-comp day is hatched, and the screen shows
    // through between its stripes — a light shadow carries the contrast there so
    // the digit survives dark mode without changing colour (#1074).
    const allComp = segments.every(s => s.comp)
    const visual: DayVisual = { background, numColor: '#101013', segments }
    if (allComp) visual.textShadow = '0 1px 2px rgba(255,255,255,0.9), 0 0 3px rgba(255,255,255,0.6)'
    if (entries.some(e => (e.fraction ?? 1) === 0.5)) visual.half = true
    return withSchool(visual)
  }
  if (publicHoliday) {
    return withSchool({ background: publicHoliday.color, numColor: holidayInk(publicHoliday.color) })
  }
  // Plain school-break day: soft wash + readable tinted ink, matching the desktop card.
  if (schoolColors.length > 0) {
    return { background: schoolHolidayWash(schoolColors[0]), numColor: holidayInk(schoolColors[0]), school: schoolColors }
  }
  if (ctx.weekendDays.includes(dayOfWeek)) {
    return { background: 'var(--m-ic)', numColor: 'var(--m-faint)' }
  }
  return { background: 'transparent', numColor: 'var(--m-muted)' }
}

export function dayVisual(dateStr: string, dayOfWeek: number, ctx: DayVisualContext): DayVisual {
  const visual = baseDayVisual(dateStr, dayOfWeek, ctx)
  // Today rings whatever the day resolved to, so a vacation day or company
  // holiday logged for today keeps its fill and is visible.
  if (dateStr === ctx.todayStr) {
    const ring = 'inset 0 0 0 1.5px var(--m-ink)'
    visual.boxShadow = visual.boxShadow ? `${ring}, ${visual.boxShadow}` : ring
    // The strong ink only where the cell has nothing of its own to say. On a
    // pastel fill the fill's own ink is the readable one, and in dark mode
    // --m-ink is light and would vanish on it.
    if (!visual.segments && (visual.background === 'transparent' || visual.background === 'var(--m-ic)')) {
      visual.numColor = 'var(--m-ink)'
    }
  }
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
