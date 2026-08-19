import type { BookElement, JourneyStats } from '@trek/shared'

/**
 * Keeping a travel element in step with the journey it came from.
 *
 * A travel element carries its own values — see the note in `book.schema.ts` —
 * which is what lets the print renderer work without a network. The cost is
 * that a journey edited afterwards leaves the page holding yesterday's numbers,
 * and these two functions are how the editor offers to fix that without ever
 * doing it behind the user's back.
 *
 * Pure, and separate from the inspector that calls them, so the rules can be
 * tested against literal objects rather than through a rendered panel.
 */

/** The metrics a stats element can show, resolved from live figures. */
export function liveMetrics(stats: JourneyStats): Record<string, number> {
  return {
    distance: stats.distance,
    days: stats.days,
    steps: stats.steps,
    photos: stats.photos,
    countries: stats.countries.length,
    places: stats.places,
    furthest: stats.furthest,
  }
}

/**
 * Whether an element's stored values still match the journey.
 *
 * Compared, not tracked with a timestamp. A timestamp would say "the journey
 * was edited", which is true every time anyone fixes a typo in a caption, and
 * would mark a summary page stale over a change that did not move a single
 * number on it.
 *
 * Only the figures the element actually shows are compared, for the same
 * reason: a page showing distance and days does not go stale because a
 * photograph was added.
 */
export function isStale(el: BookElement, stats: JourneyStats | null): boolean {
  if (!stats) return false

  if (el.kind === 'stats') {
    const live = liveMetrics(stats)
    return el.metrics.some(m => (el.values[m] ?? 0) !== live[m])
  }
  if (el.kind === 'countries') {
    return el.codes.join(',') !== stats.countries.map(c => c.code).join(',')
  }
  if (el.kind === 'map') {
    // The route is compared by shape rather than element-by-element: a
    // four-hundred-point deep-equal on every render would cost more than it
    // could ever catch, and a changed route almost always changes its length or
    // one of its ends.
    if (el.points.length !== stats.points.length) return true
    if (!el.points.length) return false
    const a = el.points[0]
    const b = stats.points[0]
    const y = el.points[el.points.length - 1]
    const z = stats.points[stats.points.length - 1]
    return a.lat !== b.lat || a.lng !== b.lng || y.lat !== z.lat || y.lng !== z.lng
  }
  return false
}

/**
 * The patch that takes an element's values from the journey as it stands now.
 *
 * Returns null for an element that carries no journey figures, so a caller can
 * offer refresh for the whole selection and let the ones that have nothing to
 * refresh say so.
 */
export function refreshPatch(el: BookElement, stats: JourneyStats): Partial<BookElement> | null {
  if (el.kind === 'stats') {
    return { stale: false, values: liveMetrics(stats) } as Partial<BookElement>
  }

  if (el.kind === 'countries') {
    const codes = stats.countries.map(c => c.code)
    return {
      stale: false,
      codes,
      // A country the element already had keeps the name it was given, which is
      // the one in the book's language; a new country falls back to the API's
      // English until someone re-places the element.
      names: codes.map((code, i) => {
        const had = el.codes.indexOf(code)
        return had >= 0 ? (el.names[had] ?? code) : (stats.countries[i]?.name ?? code)
      }),
    } as Partial<BookElement>
  }

  if (el.kind === 'map') {
    return {
      stale: false,
      countries: stats.countries.map(c => c.code),
      points: stats.points.map(p => ({ lat: p.lat, lng: p.lng, label: p.label })),
    } as Partial<BookElement>
  }

  return null
}
