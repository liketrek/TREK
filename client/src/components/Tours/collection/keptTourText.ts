import type { CollectionTourItem } from '@trek/shared';

/** Where a kept tour came from and who kept it, as one tooltip. */
export function sourceText(tour: CollectionTourItem, t: (key: string, params?: Record<string, unknown>) => string) {
  const source = t('tours.collection.source', { tour: tour.source.tourName, trip: tour.source.tripTitle });
  return tour.saved_by ? `${source}. ${t('tours.collection.keptBy', { name: tour.saved_by })}` : source;
}
