/**
 * Formatting for a provider's weekday opening-hours lines.
 *
 * These arrive as display text — "Monday: 11:30 AM – 11:00 PM" from Google in
 * whatever language was requested, "Monday: 09:00-18:00" from the OSM tag
 * parser. They cannot be computed from (that is what `placeOpenState` and the
 * structured periods are for), only rendered. Lifted out of PlaceInspector so
 * the add-place detail column shows hours the same way the inspector does
 * rather than growing a second, subtly different implementation.
 */

/** Rewrites a line between 12h and 24h clocks, leaving it alone when it already fits. */
export function convertHoursLine(line: string, timeFormat: string): string {
  if (!line) return ''
  const hasAmPm = /\d{1,2}:\d{2}\s*(AM|PM)/i.test(line)

  if (timeFormat === '12h' && !hasAmPm) {
    // 24h → 12h: "10:00" → "10:00 AM", "21:00" → "9:00 PM", "Uhr" entfernen.
    // split/trimEnd rather than /\s*Uhr/g: that pattern walks the rest of the line
    // from every space it passes, so a line with no "Uhr" in it costs a pass per
    // space. Cutting on the word and trimming the piece in front of it is the
    // same edit, once.
    const parts = line.split('Uhr')
    const withoutUhr = parts.map((part, i) => (i < parts.length - 1 ? part.trimEnd() : part)).join('')
    return withoutUhr.replace(/(\d{1,2}):(\d{2})/g, (match, h, m) => {
      const hour = Number.parseInt(h)
      if (Number.isNaN(hour)) return match
      const period = hour >= 12 ? 'PM' : 'AM'
      const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${h12}:${m} ${period}`
    })
  }
  if (timeFormat !== '12h' && hasAmPm) {
    // 12h → 24h: "10:00 AM" → "10:00", "9:00 PM" → "21:00"
    return line.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (_, h, m, p) => {
      let hour = Number.parseInt(h)
      if (p.toUpperCase() === 'PM' && hour !== 12) hour += 12
      if (p.toUpperCase() === 'AM' && hour === 12) hour = 0
      return `${String(hour).padStart(2, '0')}:${m}`
    })
  }
  return line
}

/**
 * Splits "Monday: 09:00-18:00" into its day and its times.
 *
 * On the FIRST separator only, because the times contain colons of their own.
 * The fullwidth colon is in there because that is what Google returns for
 * Chinese and Japanese, and splitting on the ASCII one alone left those lines
 * unsplit and the whole string in the day column.
 *
 * A line with no separator at all comes back with an empty day, which callers
 * render across the full width rather than squeezing into a two-column row.
 */
export function splitHoursLine(line: string): [day: string, times: string] {
  const at = line.search(/[:：]/)
  if (at < 0) return ['', line.trim()]
  return [line.slice(0, at).trim(), line.slice(at + 1).trim()]
}

/**
 * Whether a line says nothing about that day.
 *
 * `parseOpeningHours` writes "Monday: ?" for a day the OSM tag did not cover.
 * Showing a bare question mark reads like a bug, so callers render a dash.
 */
export function isUnknownHoursLine(times: string): boolean {
  return times.trim() === '?'
}
