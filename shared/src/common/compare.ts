/**
 * Two texts by their UTF-16 code units: the order a bare `sort()` gives, and
 * the same on every machine. A hash or a key built over the order must not
 * depend on the locale the code runs in, as `localeCompare` does.
 */
export function compareCodeUnits(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
