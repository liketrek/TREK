/**
 * "Sam → Ada", "Kyoto → Osaka": two names with an arrow from the first to the
 * second, as one string (a row's label, an aria-label).
 *
 * In an Arabic UI the plain form reads backwards. A Latin name and an Arabic one
 * reorder around the arrow, and the arrow itself never turns, so "Sam Carter →
 * أنت" shows the arrow pointing back at Sam. There each name goes into its own
 * isolate (U+2068 … U+2069), so the pair lines up in reading order whatever
 * script the names are in, and the arrow points left, from the first name to
 * the second. A left-to-right UI gets the plain string.
 */
const FSI = '\u2068';
const PDI = '\u2069';

export function isRtlDocument(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
}

export function flowText(parts: readonly string[], rtl: boolean = isRtlDocument()): string {
  if (!rtl) return parts.join(' → ');
  return parts.map((part) => `${FSI}${part}${PDI}`).join(' ← ');
}
