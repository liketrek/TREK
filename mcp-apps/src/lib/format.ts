/**
 * A trip's dates for a card, in the host's locale: "12 – 19 May 2027", or the
 * one date, or null when the trip has none. Dates are plain calendar days
 * (YYYY-MM-DD) and are formatted in UTC so no time zone moves them.
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: string
): string | null {
  const from = parseDay(start);
  const to = parseDay(end);
  const format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  if (from && to) return format.formatRange(from, to);
  const one = from ?? to;
  return one ? format.format(one) : null;
}

function parseDay(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
