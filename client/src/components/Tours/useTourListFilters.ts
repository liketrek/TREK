import type { TourListItem, TourOrigin, TourTypeKey } from '@trek/shared';
import { useCallback, useMemo, useState } from 'react';
import { filterTours, tourSource, type TourFilter } from './tourPresentation';

export type TourFacet = 'origin' | 'grade' | 'type';

export interface TourFacetOption<V> {
  value: V;
  /** How many tours of the list carry it, under the other filters as they are set. */
  count: number;
}

interface TourFacetSelection {
  origin: TourOrigin | null;
  grade: number | null;
  type: TourTypeKey | null;
}

const NO_SELECTION: TourFacetSelection = { origin: null, grade: null, type: null };

const ORIGIN_ORDER: TourOrigin[] = ['trek', 'gpx', 'wanderer'];

function facetValue(tour: TourListItem, facet: TourFacet): string | number | null {
  if (facet === 'origin') return tourSource(tour);
  if (facet === 'grade') return tour.max_hiking_difficulty;
  return tour.tour_type;
}

function matches(tour: TourListItem, selection: TourFacetSelection, except?: TourFacet): boolean {
  return (['origin', 'grade', 'type'] as const).every(
    (facet) => facet === except || selection[facet] === null || facetValue(tour, facet) === selection[facet]
  );
}

/** The values a facet takes in the list, each with its count; a value no tour carries is not offered. */
function optionsOf<V extends string | number>(
  tours: readonly TourListItem[],
  facet: TourFacet,
  order: (a: V, b: V) => number
): TourFacetOption<V>[] {
  const counts = new Map<V, number>();
  for (const tour of tours) {
    const value = facetValue(tour, facet) as V | null;
    if (value !== null) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => order(a, b)).map(([value, count]) => ({ value, count }));
}

/**
 * PR1-13: the filters of a tour list, the same on the desktop rail and the
 * phone list. Next to the day status (all, not yet on a day, on a day) it
 * offers the source, the stored routing limit and the tour type, but only a
 * dimension the list really varies in (two values or more), so a small list
 * keeps its single filter. Filtering only narrows what the list shows; tours
 * and their days are not touched.
 */
export function useTourListFilters(tours: readonly TourListItem[]) {
  const [status, setStatus] = useState<TourFilter>('all');
  const [selection, setSelection] = useState<TourFacetSelection>(NO_SELECTION);

  const byStatus = useMemo(() => filterTours([...tours], status), [tours, status]);

  const facets = useMemo(() => {
    // Each dimension counts under the others as set, so its numbers say what choosing it would show.
    const base = (facet: TourFacet) => byStatus.filter((tour) => matches(tour, selection, facet));
    const origin = optionsOf<TourOrigin>(
      base('origin'),
      'origin',
      (a, b) => ORIGIN_ORDER.indexOf(a) - ORIGIN_ORDER.indexOf(b)
    );
    const grade = optionsOf<number>(base('grade'), 'grade', (a, b) => a - b);
    const type = optionsOf<TourTypeKey>(base('type'), 'type', (a, b) => a.localeCompare(b));
    // A dimension the whole list does not vary in is no choice at all.
    const varies = (facet: TourFacet) =>
      new Set(tours.map((tour) => facetValue(tour, facet)).filter((v) => v !== null)).size >= 2;
    return {
      origin: varies('origin') ? origin : [],
      grade: varies('grade') ? grade : [],
      type: varies('type') ? type : [],
    };
  }, [byStatus, selection, tours]);

  const filtered = useMemo(() => byStatus.filter((tour) => matches(tour, selection)), [byStatus, selection]);

  const select = useCallback(<F extends TourFacet>(facet: F, value: TourFacetSelection[F]) => {
    setSelection((current) => ({ ...current, [facet]: current[facet] === value ? null : value }));
  }, []);
  const reset = useCallback(() => {
    setStatus('all');
    setSelection(NO_SELECTION);
  }, []);

  const activeFacets = (['origin', 'grade', 'type'] as const).filter((facet) => selection[facet] !== null).length;

  return {
    status,
    setStatus,
    selection,
    select,
    facets,
    /** The list has more to choose by than the day status. */
    hasFacets: facets.origin.length > 0 || facets.grade.length > 0 || facets.type.length > 0,
    filtered,
    statusCounts: {
      all: tours.length,
      unplanned: tours.filter((tour) => !tour.planned).length,
      planned: tours.filter((tour) => tour.planned).length,
    },
    /** How many filters beyond the status narrow the list. */
    activeFacets,
    /** Something is set and nothing is left: the list says so and offers to clear it. */
    emptyByFilter: tours.length > 0 && filtered.length === 0 && (status !== 'all' || activeFacets > 0),
    reset,
  };
}

export type TourListFilters = ReturnType<typeof useTourListFilters>;
