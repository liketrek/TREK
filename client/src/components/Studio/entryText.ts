/**
 * The words a journal entry lends to a page.
 *
 * Three things print an entry's date or its point: the chips in the Entries
 * tab, the template filler, and the auto layout. They used to do it with five
 * private helpers between them — two long-date formatters that were copies of
 * each other, and three coordinate formatters, one of which printed degrees and
 * minutes where the other two printed seconds. A journey-wide mark and an entry
 * mark on the same spread read as a bug when they disagree by a notation.
 *
 * There is a second, harder reason for one implementation. A bound element is
 * re-read when the book is opened (see resolveBindings.ts), and re-reading is
 * only invisible while the resolver produces exactly the string the chip
 * produced. One character of drift and every open rewrites the element, which
 * the autosave then writes back — a book that saves itself every time someone
 * looks at it. Sharing the function is what holds that invariant.
 */

export type CoordFormat = 'dms' | 'decimal'

/** One axis, as degrees, minutes and seconds. */
function dms(v: number, pos: string, neg: string): string {
  const hemisphere = v >= 0 ? pos : neg
  const abs = Math.abs(v)
  const deg = Math.floor(abs)
  const min = Math.floor((abs - deg) * 60)
  const sec = Math.round((((abs - deg) * 60) - min) * 60)
  return `${deg}° ${min}' ${sec}" ${hemisphere}`
}

/**
 * A point, set for print.
 *
 * Neither form carries a minus sign: a printed page says 33° 51' S, not
 * -33.8688, and the hemisphere letter is both shorter and unambiguous. Decimal
 * keeps four places — about eleven metres, which is the width of the building
 * you were standing next to and finer than a book needs.
 */
export function formatBookCoords(lat: number, lng: number, format: CoordFormat = 'dms'): string {
  if (format === 'decimal') {
    const dec = (v: number, pos: string, neg: string) =>
      `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`
    return `${dec(lat, 'N', 'S')}  ${dec(lng, 'E', 'W')}`
  }
  return `${dms(lat, 'N', 'S')}   ${dms(lng, 'E', 'W')}`
}

/**
 * The entry's day, spelled out.
 *
 * Parsed at local midnight rather than as UTC, because the date on a journal
 * entry is the day the writer had, not an instant — reading it as UTC moves it
 * a day backwards for anyone west of Greenwich. Note this is deliberately not
 * `utils/formatters.ts:formatDate`, which is the short weekday form the sidebar
 * badges use and hides the year inside the current one; a page in a book that
 * outlives the year has to say which year it was.
 */
export function formatBookDate(iso: string | null, locale: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}
