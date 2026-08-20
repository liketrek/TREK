import * as LucideIcons from 'lucide-react'
import { resolvePluginIcon } from '../shared/PluginIcon'
import type { LucideIcon } from 'lucide-react'

/**
 * Every drawing in lucide, as a list a picker can show.
 *
 * ── Why the whole set, and why it costs nothing ──────────────────────────
 *
 * The obvious worry with a fourteen-hundred-icon library is the bundle, and it
 * is worth being precise about why it does not apply. TREK already pulls lucide
 * in whole: `SystemNoticeModal` and `PluginIcon` both index the namespace with a
 * computed key, which no bundler can tree-shake, and both sit in the eager entry
 * graph. The library ships either way, so enumerating it here adds names, not
 * kilobytes — and it avoids the alternative, which would be fourteen hundred
 * lazily-imported chunks that the export path could not wait for. Studio prints
 * by serialising the live DOM in one synchronous pass; an icon that had not
 * finished loading would print as a hole in the book.
 *
 * ── The alias problem ────────────────────────────────────────────────────
 *
 * lucide exports every icon three times — `Plane`, `PlaneIcon`, `LucidePlane` —
 * so the namespace holds about forty-five hundred names for about fourteen
 * hundred drawings. A picker built from the raw keys shows every glyph three
 * times, and the search box then looks broken. Both alias shapes are dropped.
 */

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/

function buildNames(): string[] {
  const all = LucideIcons as unknown as Record<string, unknown>
  const names = Object.keys(all).filter(k => PASCAL_CASE.test(k))
  const present = new Set(names)

  return names
    .filter(name => {
      // `LucidePlane` is always an alias of `Plane`.
      if (name.startsWith('Lucide') && present.has(name.slice(6))) return false
      // `PlaneIcon` likewise — but only when the bare name really exists, so a
      // drawing genuinely called something-Icon is not thrown away with them.
      if (name.endsWith('Icon') && present.has(name.slice(0, -4))) return false
      return true
    })
    .sort((a, b) => a.localeCompare(b))
}

/** Built once: the namespace cannot change while the tab is open. */
export const ICON_NAMES: string[] = buildNames()

/**
 * What the tab opens on.
 *
 * Alphabetical order puts `AArrowDown`, `AArrowUp` and `ALargeSmall` in the
 * first row, which is a poor answer to "what can I put on this page" in a book
 * about a journey. These are the drawings a travel page actually reaches for,
 * in the order somebody would look for them; the whole library is underneath.
 *
 * Filtered against the real export list, so a lucide version that renames one
 * of them quietly drops it instead of drawing a fallback in the shelf.
 */
const FEATURED = [
  'Plane', 'Train', 'TrainFront', 'Car', 'Bus', 'Ship', 'Bike', 'Footprints', 'Sailboat',
  'MapPin', 'Map', 'Compass', 'Navigation', 'Route', 'Globe', 'Milestone', 'Signpost',
  'Mountain', 'MountainSnow', 'Waves', 'TreePine', 'Palmtree', 'Flower2', 'Leaf', 'Bird', 'Fish',
  'Sun', 'Sunrise', 'Sunset', 'Moon', 'Cloud', 'CloudRain', 'CloudLightning', 'Snowflake',
  'Umbrella', 'Thermometer', 'Wind',
  'Tent', 'Backpack', 'Luggage', 'BedDouble', 'Hotel', 'Key', 'Anchor',
  'Coffee', 'UtensilsCrossed', 'Wine', 'Beer', 'IceCream', 'Croissant',
  'Camera', 'Image', 'Film', 'Music', 'BookOpen', 'PenLine', 'Quote', 'Sticker',
  'Heart', 'Star', 'Sparkles', 'Flag', 'Ticket', 'Gift', 'PartyPopper',
  'Clock', 'CalendarDays', 'CreditCard', 'Wallet', 'ShoppingBag',
  'Landmark', 'Church', 'Castle', 'Building2', 'Home', 'Binoculars', 'Telescope',
]

/** The starter shelf, minus anything this version of lucide does not have. */
export const FEATURED_ICONS: string[] = FEATURED.filter(name => ICON_NAMES.includes(name))

/**
 * The words to match a search against.
 *
 * "mountainsnow" for MountainSnow as well as its parts, so both "mountain" and
 * "snow" find it — searching an icon set is searching for a thing, and the
 * thing's name is rarely the first word someone types.
 */
function searchable(name: string): string {
  return `${name} ${name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}`.toLowerCase()
}

const SEARCH_INDEX: Record<string, string> = Object.fromEntries(
  ICON_NAMES.map(name => [name, searchable(name)]),
)

export function searchIcons(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return ICON_NAMES
  // Every word has to appear, so "snow mountain" finds MountainSnow too.
  const words = q.split(/\s+/)
  return ICON_NAMES.filter(name => {
    const haystack = SEARCH_INDEX[name]
    return words.every(w => haystack.includes(w))
  })
}

/** Spaced out for a tooltip: `MountainSnow` reads as "Mountain Snow". */
export function iconLabel(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

/**
 * The component for a stored name.
 *
 * The same resolver the plugin system uses, so a book that outlives an icon
 * behaves the way the rest of TREK does with a name it no longer knows: it
 * draws the fallback rather than leaving a hole where a drawing was.
 */
export function iconComponent(name: string): LucideIcon {
  return resolvePluginIcon(name)
}
