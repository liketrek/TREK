const KEY = 'trek_dash_collections_shown';

/**
 * How many lists the dashboard's collections widget showed last time. While the
 * lists load, the widget stands in with that many placeholder badges, so it
 * opens at the height it will have and the widgets under it stay put (#3009).
 * Null when nothing is remembered yet, or storage is unavailable.
 */
export function readShownCollections(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) && n >= 0 && n <= 6 ? n : null;
  } catch {
    return null;
  }
}

export function rememberShownCollections(count: number): void {
  try {
    localStorage.setItem(KEY, String(Math.max(0, Math.min(6, count))));
  } catch {
    /* storage blocked: the widget just opens at its empty height next time */
  }
}
