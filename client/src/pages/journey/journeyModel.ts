/** The year a journey card names: the years its trips cover, not the year it was written (#2685). */
export function journeyYearLabel(journey: {
  trip_date_min?: string | null;
  trip_date_max?: string | null;
  created_at?: string | number | null;
}): string {
  // The dates are calendar dates, so the year is read from the text, not through a Date in some zone.
  const from = journey.trip_date_min?.slice(0, 4);
  const to = journey.trip_date_max?.slice(0, 4);
  if (from && to && to !== from) return `${from}/${to}`;
  if (from || to) return (from || to) as string;
  return journey.created_at ? String(new Date(journey.created_at).getFullYear()) : '';
}
