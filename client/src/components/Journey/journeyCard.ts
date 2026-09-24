import { formatLocationName } from '../../utils/formatters'
import { DAY_COLORS } from './dayColors'
import type { JourneyEntry } from '../../store/journeyStore'

/**
 * What a timeline card needs to know about an entry, worked out once.
 *
 * The phone shell and the tablet/public timeline draw the same card in two
 * different token sets, so the markup lives in `JourneyEntryCover` and the
 * questions it asks live here. Anything a card has to decide — which photo,
 * what to call an entry with no title, which flag — is decided in this file so
 * the two surfaces cannot answer it differently.
 */

/** A photo as either shell hands it over: the journey's own carry `photo_id`, shared ones only `id`. */
export interface CardPhoto {
  photo_id?: number
  id?: number
}

export function cardPhotoId(photo: CardPhoto | undefined): number | undefined {
  return photo?.photo_id ?? photo?.id
}

/**
 * The country an entry happened in, as the two letters to stamp on its card.
 *
 * Letters rather than the flag emoji: the two regional-indicator code points
 * that make a flag are only drawn as one on Apple platforms and Android. Windows
 * has never shipped the glyphs, so a card there showed a bare "DE" where a flag
 * was clearly meant — which reads as something broken rather than as a country.
 * The code reads the same everywhere, and in a chip it looks deliberate.
 */
export function countryBadge(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return ''
  return code.toUpperCase()
}

/** Short date for the card corner: "12 Sep", in the reader's locale and order. */
export function cardDateLabel(entryDate: string, locale: string): string {
  return new Date(entryDate + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

/**
 * The name to put on a card.
 *
 * An untitled entry is common — quick capture used to have no title field at all
 * — so the fallback matters as much as the title. A suggestion says what it is,
 * because a card that says "Untitled" over a photo of somewhere you have not been
 * yet is a lie; anything else falls back to its place before it falls back to a
 * placeholder, since where you were is at least true.
 */
export function cardTitle(
  entry: Pick<JourneyEntry, 'title' | 'type' | 'location_name'>,
  t: (key: string) => string,
): string {
  if (entry.title?.trim()) return entry.title
  if (entry.type === 'skeleton') return t('journey.entry.suggestion')
  const place = formatLocationName(entry.location_name)
  if (place) return place
  return entry.type === 'checkin' ? t('journey.detail.journeyTab') : t('journey.editor.titlePlaceholder')
}

/** The place line under the title, left out when the title is already the place. */
export function cardPlace(
  entry: Pick<JourneyEntry, 'title' | 'location_name'>,
): string {
  const place = formatLocationName(entry.location_name)
  if (!place) return ''
  return entry.title?.trim() ? place : ''
}

/** One day of a journey, in the order it happened, with the colour everything else uses for it. */
export interface JourneyDay {
  date: string
  color: string
}

/**
 * The days a set of entries spans, and which colour each of them wears.
 *
 * The map markers, the card edges and the day bar all have to agree on "day
 * three is teal", and they used to work it out separately from the same list —
 * which held only as long as all three filtered that list identically.
 */
export function journeyDays(entries: { entry_date: string }[]): JourneyDay[] {
  const dates = [...new Set(entries.map(e => e.entry_date))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  return dates.map((date, i) => ({ date, color: DAY_COLORS[i % DAY_COLORS.length] }))
}

/** Look a date's colour up out of `journeyDays`, falling back to the first day's. */
export function dayColorOf(days: JourneyDay[], date: string): string {
  return days.find(d => d.date === date)?.color ?? DAY_COLORS[0]
}
