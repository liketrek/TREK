import type { BookTravelContext, JourneyStats } from '@trek/shared';

/**
 * What the book engine's travel factories read, as the Studio knows it: the
 * journey's figures, its recorded way and the words in the reader's
 * language. The Travel panel builds its tiles with it, and the Templates
 * panel lays a template's map with it, so both draw the same journey.
 *
 * The day word is the engine's template: `t` leaves the `{day}` in it
 * untouched, and `bookDayText` puts the number there.
 */
export function studioTravelContext(
  stats: JourneyStats,
  path: [number, number][][],
  locale: string,
  t: (k: string) => string
): BookTravelContext {
  return {
    locale,
    stats,
    path,
    entries: [],
    labels: {
      day: t('journey.studio.day'),
      stations: t('journey.studio.stations'),
      summary: t('journey.studio.summary'),
      countries: t('journey.studio.countries'),
      distance: t('journey.studio.metric.distance'),
      pros: t('journey.editor.pros'),
      cons: t('journey.editor.cons'),
    },
  };
}
