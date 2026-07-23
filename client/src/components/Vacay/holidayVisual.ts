// Shared visual treatment for school-holiday days, used by the desktop month card
// (VacayMonthCard) and the mobile month grid (vacayDayModel/MVacayMonth) so both
// surfaces render the layer identically.

/**
 * Bottom accent band for a school-holiday day: a single rounded bar in the
 * calendar colour, split into equal segments when several school calendars
 * cover the same day (capped at three).
 */
export function schoolHolidayBand(colors: string[]): string {
  if (colors.length === 0) return 'transparent'
  if (colors.length === 1) return colors[0]
  const seg = colors.slice(0, 3)
  const stops = seg
    .map((c, i) => `${c} ${Math.round((i * 100) / seg.length)}% ${Math.round(((i + 1) * 100) / seg.length)}%`)
    .join(', ')
  return `linear-gradient(90deg, ${stops})`
}

/**
 * Soft background wash for a plain day that falls inside a school break — light
 * enough to read as a gentle range highlight without competing with the stronger
 * public-holiday / person fills.
 */
export function schoolHolidayWash(color: string): string {
  return `color-mix(in srgb, ${color} 15%, transparent)`
}
