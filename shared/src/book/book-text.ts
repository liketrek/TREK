/**
 * The words a journal entry lends to a page.
 *
 * Several things print an entry's date or its point: the chips in the Studio's
 * Entries tab, the template filler, the auto layout, the binding resolver and
 * the server's design tool. They used to do it with private helpers that had
 * drifted apart, one printing degrees and minutes where the others printed
 * seconds, and a journey-wide mark and an entry mark on the same spread read as
 * a bug when they disagree by a notation. Moved here from the Studio
 * (client/src/components/Studio/entryText.ts) so the editor and the server set
 * the same characters.
 *
 * There is a second, harder reason for one implementation. A bound element is
 * re-read when the book is opened, and re-reading is only invisible while the
 * resolver produces exactly the string the chip produced. One character of
 * drift and every open rewrites the element, which the autosave then writes
 * back: a book that saves itself every time someone looks at it.
 */

export type BookCoordFormat = 'dms' | 'decimal';

/** One axis, as degrees, minutes and seconds. */
function dms(v: number, pos: string, neg: string): string {
  const hemisphere = v >= 0 ? pos : neg;
  const abs = Math.abs(v);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = Math.round(((abs - deg) * 60 - min) * 60);
  return `${deg}° ${min}' ${sec}" ${hemisphere}`;
}

/**
 * A point, set for print.
 *
 * Neither form carries a minus sign: a printed page says 33° 51' S, not
 * -33.8688, and the hemisphere letter is both shorter and unambiguous. Decimal
 * keeps four places, about eleven metres, which is finer than a book needs.
 */
export function formatBookCoords(lat: number, lng: number, format: BookCoordFormat = 'dms'): string {
  if (format === 'decimal') {
    const dec = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
    return `${dec(lat, 'N', 'S')}  ${dec(lng, 'E', 'W')}`;
  }
  return `${dms(lat, 'N', 'S')}   ${dms(lng, 'E', 'W')}`;
}

/**
 * The entry's day, spelled out.
 *
 * Parsed at local midnight rather than as UTC, because the date on a journal
 * entry is the day the writer had, not an instant: reading it as UTC moves it
 * a day backwards for anyone west of Greenwich. A page in a book that outlives
 * the year has to say which year it was, so the year is always printed.
 */
export function formatBookDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * The entry's day as a date mark shows it: the day of the month as a numeral
 * and the month spelled out in capitals beneath it; null for anything that is
 * not a date. The auto layout, the travel marks and the decorated templates
 * all set a mark with this.
 */
export function bookDateMarkValue(
  iso: string | null | undefined,
  locale: string,
): { text: string; sub: string } | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  let month: string;
  try {
    month = d.toLocaleDateString(locale, { month: 'long' });
  } catch {
    month = d.toLocaleDateString('en', { month: 'long' });
  }
  return { text: String(d.getDate()), sub: month.toUpperCase() };
}

/**
 * What a point is, as one string: the raw value a coordinates binding keeps,
 * so re-reading it compares the fact behind the words and not the words.
 */
export function bookCoordValue(lat: number, lng: number): string {
  return `${lat},${lng}`;
}
