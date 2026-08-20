import { describe, it, expect } from 'vitest'
import { formatBookCoords, formatBookDate } from '../../../src/components/Studio/entryText'

/**
 * The strings a journal entry lends to a page (#1973).
 *
 * These are pinned rather than sampled, because three call sites have to agree
 * on them character for character: the chip that places a mark, the template
 * filler that fills one that was drawn, and the resolver that re-reads it when
 * the book is opened. If the chip and the resolver ever disagree by a space,
 * opening a book rewrites the element and the autosave writes it back, which
 * looks like a book that edits itself.
 *
 * The degrees form is also the one already printed by the auto layout and by
 * the Travel panel, so changing it here changes what is on pages people have
 * already made.
 */

describe('coordinates', () => {
  it('sets degrees, minutes and seconds with a hemisphere letter', () => {
    expect(formatBookCoords(52.5163, 13.3777)).toBe(`52° 30' 59" N   13° 22' 40" E`)
  })

  it('says south and west rather than using a minus sign', () => {
    // A printed page has no room for a sign somebody has to decode, and the
    // letter is unambiguous in a way -33.8688 is not.
    expect(formatBookCoords(-33.8688, -70.6693)).toBe(`33° 52' 8" S   70° 40' 9" W`)
  })

  it('sets the decimal form to four places, which is about eleven metres', () => {
    expect(formatBookCoords(52.5163, 13.3777, 'decimal')).toBe('52.5163° N  13.3777° E')
  })

  it('keeps the hemisphere letter in the decimal form too', () => {
    expect(formatBookCoords(-33.8688, -70.6693, 'decimal')).toBe('33.8688° S  70.6693° W')
  })

  it('defaults to degrees, which is what the rest of Studio prints', () => {
    expect(formatBookCoords(10, 20)).toBe(formatBookCoords(10, 20, 'dms'))
  })
})

describe('the entry date', () => {
  it('spells the month out, in the app language', () => {
    expect(formatBookDate('2026-06-12', 'de-DE')).toBe('12. Juni 2026')
    expect(formatBookDate('2026-06-12', 'en-GB')).toBe('12 June 2026')
  })

  /*
   * Local midnight, not UTC. The date on an entry is the day the writer had,
   * and reading it as an instant moves it backwards for everyone west of
   * Greenwich, which is a photo book dated the day before the photographs.
   */
  it('reads the day as a day rather than as a moment in time', () => {
    expect(formatBookDate('2026-01-01', 'en-GB')).toBe('1 January 2026')
  })

  it('gives nothing back for an entry with no date', () => {
    expect(formatBookDate(null, 'en-GB')).toBe('')
  })

  it('gives nothing back rather than printing Invalid Date', () => {
    expect(formatBookDate('not-a-date', 'en-GB')).toBe('')
  })
})
