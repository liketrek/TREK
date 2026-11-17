/**
 * The visited countries in the order the dashboard shows them (#2648): most
 * recently visited first, by the last day of the latest started trip that
 * reached each one, so the few flags the tile has room for are the ones of the
 * last journeys rather than the start of the alphabet. A country only marked by
 * hand carries no date and follows, in the order it was marked.
 */
export class CountryVisits {
  private readonly lastVisit = new Map<string, string>();

  /** Keeps the latest trip day a country was reached on. */
  note(code: string | null | undefined, tripLastDate: string | null): void {
    if (!code) return;
    const key = code.toUpperCase();
    const when = tripLastDate ?? '';
    const known = this.lastVisit.get(key);
    if (known === undefined || when > known) this.lastVisit.set(key, when);
  }

  /** The reached countries, latest first, then the hand-marked ones not among them. */
  ordered(manual: Iterable<string>): string[] {
    // Array.prototype.sort is stable, so countries of the same trip keep the order they were found in.
    const dated = [...this.lastVisit].sort(([, a], [, b]) => (a < b ? 1 : a > b ? -1 : 0)).map(([code]) => code);
    return [...new Set([...dated, ...manual])];
  }
}

/**
 * One row per coordinate, the one of the latest trip through it: the country
 * lookup is a point-in-polygon scan and runs once per coordinate.
 */
export function latestPerCoordinate<T extends { lat: number; lng: number; trip_last_date: string | null }>(
  rows: T[],
): T[] {
  const byCoord = new Map<string, T>();
  for (const row of rows) {
    const key = `${row.lat},${row.lng}`;
    const known = byCoord.get(key);
    if (!known || (row.trip_last_date ?? '') > (known.trip_last_date ?? '')) byCoord.set(key, row);
  }
  return [...byCoord.values()];
}
