import type { TourPackingLink } from '@trek/shared';

/** The name of what the tour points at: a category by its own name, otherwise the whole list. */
export function linkName(link: TourPackingLink, t: (key: string) => string): string {
  return link.category ?? t('tours.packing.whole');
}
