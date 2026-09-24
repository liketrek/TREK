import type { Assignment, Day, TranslationFn } from '../../types'

/** Day and month only, the shape the booking dialog has always shown here. */
function dayBadge(dateStr: string, locale?: string): string {
  return new Date(dateStr + 'T00:00:00Z')
    .toLocaleDateString(locale || undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export interface AssignmentOption {
  value: number | string
  label: string
  searchLabel?: string
  groupLabel?: string
  dayDate?: string | null
  disabled?: boolean
  isHeader?: boolean
}

/**
 * The day plan as a flat option list: a disabled header per day, then its stops
 * in plan order. Shared by the desktop booking dialog and the phone sheet so a
 * booking can be linked to the same stop from either (#2216).
 */
export function buildAssignmentOptions(
  days: Day[] | undefined,
  assignments: Record<string, Assignment[]> | undefined,
  t: TranslationFn,
  locale?: string,
): AssignmentOption[] {
  const options: AssignmentOption[] = []
  for (const day of (days || [])) {
    const da = (assignments?.[String(day.id)] || []).slice().sort((a, b) => a.order_index - b.order_index)
    if (da.length === 0) continue
    const dayLabel = day.title || t('dayplan.dayN', { n: day.day_number })
    const dateStr = day.date ? ` · ${dayBadge(day.date, locale)}` : ''
    const groupLabel = `${dayLabel}${dateStr}`
    options.push({ value: `_header_${day.id}`, label: groupLabel, disabled: true, isHeader: true })
    for (let i = 0; i < da.length; i++) {
      const place = da[i].place
      if (!place) continue
      const timeStr = place.place_time ? ` · ${place.place_time}${place.end_time ? ' – ' + place.end_time : ''}` : ''
      options.push({
        value: da[i].id,
        label: `  ${i + 1}. ${place.name}${timeStr}`,
        searchLabel: place.name,
        groupLabel,
        dayDate: day.date || null,
      })
    }
  }
  return options
}
