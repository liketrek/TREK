/**
 * Text for the documents the exports write (the list as GPX, a trip or a list
 * as KML): the builder escapes markup, these keep out what it lets through.
 */

/**
 * Text XML 1.0 can hold. The builder escapes markup but passes through the
 * control characters the spec forbids outright, and one of those in a place
 * name is enough for a strict reader to refuse the whole file.
 */
export function xmlText(value: string): string {
  return value.replace(/[\p{Cc}\p{Cs}￾￿]/gu, (ch) => (ch === '\t' || ch === '\n' || ch === '\r' ? ch : ''));
}

/** A value as element text, or nothing, since an empty element is noise to every reader. */
export function textOf(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  return xmlText(String(value)).trim() || undefined;
}
