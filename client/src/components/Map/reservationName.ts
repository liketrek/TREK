/**
 * "Wien Hbf (Vienna)" → "Wien Hbf" — the endpoint name as a map label wants it,
 * without the parenthetical a booking confirmation likes to append. Both map
 * renderers go through here so an endpoint never reads one way on the Leaflet
 * map and another on the GL one.
 *
 * Written as a scan rather than the /\s*\([^)]*\)/g it replaces. That pattern's
 * leading \s* overlaps the engine's own restart-at-every-position scan, so a
 * name that is a long run of spaces with no "(" after it backtracks
 * quadratically (1.0s at 32k), and so does a run of "(" with no ")". An
 * endpoint name is free text any trip member types and every other member's
 * browser renders, so that is reachable across users.
 *
 * Matches the regex exactly: the whitespace directly before a "(" that has a
 * ")" after it goes too, and an unclosed "(" is left alone.
 */
export function cleanEndpointName(name: string): string {
  let out = ''
  let cursor = 0
  for (;;) {
    const open = name.indexOf('(', cursor)
    if (open === -1) break
    const close = name.indexOf(')', open + 1)
    if (close === -1) break
    let start = open
    while (start > cursor && /\s/.test(name[start - 1])) start--
    out += name.slice(cursor, start)
    cursor = close + 1
  }
  return (out + name.slice(cursor)).trim()
}
