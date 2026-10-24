const LETTERS: Record<string, string> = { day: 'DD', month: 'MM', year: 'YYYY' };

/**
 * How a typed date is written in `locale`, as letters (DD, MM, YYYY) between the
 * locale's own separators. It is the hint of the manual date field, which is
 * pre-filled and read back in this same order, so a Korean user sees
 * "YYYY. MM. DD." rather than a German "DD.MM.YYYY". Direction marks are dropped:
 * the hint shows the shape, the field itself carries the script.
 */
export function dateInputPattern(locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    .formatToParts(new Date(Date.UTC(2001, 5, 15)))
    .map((part) => LETTERS[part.type] ?? part.value.replace(/[؜‎‏]/g, ''))
    .join('');
}
