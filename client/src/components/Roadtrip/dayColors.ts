/**
 * A colour per day, for a road trip drawn end to end.
 *
 * The map draws one blue line for a whole trip, which is right while the days are read as
 * separate cards. Once the days are joined into one continuous drive there is nothing in
 * the line to say where one ends, so the colour has to do it.
 *
 * Fixed hex rather than theme tokens, and deliberately so: these sit on map tiles, not on
 * the app's own surfaces, and a token that follows the user's accent would put the route
 * in the same colour as the terrain on some schemes. The same exception the rest of the
 * map's paint takes.
 */

/**
 * Eight, then it repeats.
 *
 * Picked for separation at a 5px stroke over a pale basemap rather than for a gradient: a
 * ramp reads as "later" and days are not a quantity. Blue stays first because it is the
 * colour the route has always been, so a one-day trip looks unchanged.
 *
 * The second value is the casing under the core — the same hue darkened, which is what
 * keeps the line readable over water and forest. A single fixed casing would have gone
 * muddy under the warm colours.
 */
const DAY_COLORS: readonly [string, string][] = [
  ['#0a84ff', '#0a5cc2'], // theme-lint-disable — map paint, see file comment
  ['#ff9f0a', '#c2740a'], // theme-lint-disable
  ['#30d158', '#1f9c40'], // theme-lint-disable
  ['#bf5af2', '#8e3fb8'], // theme-lint-disable
  ['#ff375f', '#c22546'], // theme-lint-disable
  ['#64d2ff', '#3d9dc2'], // theme-lint-disable
  ['#ffd60a', '#c2a30a'], // theme-lint-disable
  ['#ac8e68', '#7d654a'], // theme-lint-disable
]

/** The core and casing a given day of the trip is drawn in. Day numbers start at 1. */
export function dayColor(dayNumber: number): { line: string; casing: string } {
  // A day number that is missing or nonsensical still has to draw something, and the
  // first colour is the one the route had before any of this existed.
  const at = Number.isFinite(dayNumber) && dayNumber > 0 ? (dayNumber - 1) % DAY_COLORS.length : 0
  const [line, casing] = DAY_COLORS[at]
  return { line, casing }
}
