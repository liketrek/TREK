import {
  TOUR_POI_CATEGORIES_BY_TYPE,
  TOUR_POI_CORRIDORS_M,
  TOUR_POI_MAX_CATEGORIES,
  TOUR_POI_MAX_LINE_POINTS,
  WALK_THEME_KEYS,
  WALK_THEMES,
  type PlannableTourType,
  type TourPoi,
  type TourPoiCategory,
  type TourPoiSearchResponse,
  type WalkTheme,
} from '@trek/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { OnlineOnlyError } from '../../../repo/onlineOnly';
import { tourPoiSearchRepo } from '../../../repo/tourPoiSearchRepo';
import { useTourPoiStore } from '../../../store/tourPoiStore';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { useRetryCountdown } from './useRetryCountdown';

/** What is ticked when a type is searched for the first time: the three most asked. */
const STARTING_CATEGORIES = (type: PlannableTourType) => TOUR_POI_CATEGORIES_BY_TYPE[type].slice(0, 3);
const DEFAULT_CORRIDOR_M = 500;

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error' | 'offline';

/** At most `most` points of a line, its ends kept. */
function thinned(line: Array<[number, number]>, most: number): Array<[number, number]> {
  if (line.length <= most) return line;
  const step = (line.length - 1) / (most - 1);
  return Array.from({ length: most }, (_, index) => line[Math.min(line.length - 1, Math.round(index * step))]).filter(
    (point): point is [number, number] => !!point
  );
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item) => b.includes(item));
}

/** What a search was asked with, so a later change of the route or the choices shows it is out of date. */
function keyOf(route: Array<[number, number]> | null, type: string, categories: readonly string[], corridor: number) {
  const ends = route && route.length > 1 ? [route[0], route[route.length - 1], route.length] : [];
  return JSON.stringify([ends, type, [...categories].sort((a, b) => a.localeCompare(b)), corridor]);
}

export type TourPoiPlanner = Pick<TourPlannerController, 'tripId' | 'tourType' | 'route' | 'mode'>;

/**
 * PLN-02: places along the tour open in the planner, searched only when asked.
 * The categories offered are the tour type's; the corridor is how far from the
 * line a place may lie. The answer is shown until the next search: once the
 * route or the choices change, it says it was found for the route as it was.
 * Nothing about the tour changes here; taking a place in is usePoiInsertion's.
 * PLN-05: a search that failed or could not ask for some kinds can be sent
 * again at once, or once the wait the server named has run down.
 */
export function useTourPoiSearch(planner: TourPoiPlanner) {
  const { locale } = useTranslation();
  const type = planner.tourType;
  const [chosen, setChosen] = useState<Partial<Record<PlannableTourType, TourPoiCategory[]>>>({});
  const categories = chosen[type] ?? STARTING_CATEGORIES(type);
  const [corridorM, setCorridorM] = useState(DEFAULT_CORRIDOR_M);
  const [answer, setAnswer] = useState<{
    key: string;
    status: Exclude<SearchStatus, 'idle' | 'loading'>;
    data?: TourPoiSearchResponse;
  } | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const publish = useTourPoiStore((state) => state.publish);
  const clear = useTourPoiStore((state) => state.clear);
  const retry = useRetryCountdown();
  const startRetry = retry.start;

  const route = planner.route;
  const currentKey = keyOf(route, type, categories, corridorM);
  const canSearch = !!route && route.length > 1 && categories.length > 0 && loadingKey === null;

  // CW-05: a city walk's theme is a set of its categories; the one the categories match exactly is the theme on.
  const theme = type === 'walk' ? (WALK_THEME_KEYS.find((key) => sameSet(WALK_THEMES[key], categories)) ?? null) : null;
  const chooseTheme = useCallback(
    (key: WalkTheme) => setChosen((current) => ({ ...current, walk: [...WALK_THEMES[key]] })),
    []
  );

  const toggleCategory = useCallback(
    (category: TourPoiCategory) =>
      setChosen((current) => {
        const now = current[type] ?? STARTING_CATEGORIES(type);
        const next = now.includes(category)
          ? now.filter((item) => item !== category)
          : now.length < TOUR_POI_MAX_CATEGORIES
            ? [...now, category]
            : now;
        return { ...current, [type]: next };
      }),
    [type]
  );

  const search = useCallback(
    async (corridor: number = corridorM) => {
      if (!route || route.length < 2 || !categories.length) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const key = keyOf(route, type, categories, corridor);
      setLoadingKey(key);
      try {
        const data = await tourPoiSearchRepo.search(
          planner.tripId,
          {
            tour_type: type,
            categories: [...categories],
            corridor_m: corridor,
            line: thinned(route, TOUR_POI_MAX_LINE_POINTS),
            lang: locale,
          },
          controller.signal
        );
        setAnswer({ key, status: 'ready', data });
        startRetry(data.retry_after_s);
        publish(data.pois, theme);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setAnswer({ key, status: err instanceof OnlineOnlyError ? 'offline' : 'error' });
        startRetry();
        clear();
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setLoadingKey(null);
        }
      }
    },
    [categories, clear, corridorM, locale, planner.tripId, publish, route, startRetry, theme, type]
  );

  // Nothing found: the next wider corridor, chosen and searched in one step.
  const widerCorridorM = TOUR_POI_CORRIDORS_M.find((metres) => metres > corridorM) ?? null;
  const widen = useCallback(() => {
    if (widerCorridorM === null) return;
    setCorridorM(widerCorridorM);
    void search(widerCorridorM);
  }, [search, widerCorridorM]);

  // Leaving the planner, or a tour closed, takes the places off the map.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      clear();
    },
    [clear]
  );

  const status: SearchStatus = loadingKey !== null ? 'loading' : (answer?.status ?? 'idle');
  return {
    offered: TOUR_POI_CATEGORIES_BY_TYPE[type],
    categories,
    /** All the kinds that may be ticked at once are ticked; one more needs one to be dropped. */
    categoryLimitReached: categories.length >= TOUR_POI_MAX_CATEGORIES,
    categoryLimit: TOUR_POI_MAX_CATEGORIES,
    toggleCategory,
    /** CW-05: a city walk's themes; none for any other type. */
    themes: type === 'walk' ? WALK_THEME_KEYS : [],
    theme,
    chooseTheme,
    corridorM,
    setCorridorM,
    canSearch,
    search,
    /** The next wider corridor offered, or null at the widest. */
    widerCorridorM,
    widen,
    /** Seconds until asking again makes sense for the kinds that could not be searched; 0 when now. */
    retryInS: retry.secondsLeft,
    status,
    answer: answer?.data ?? null,
    /** The answer was found for the route or the choices as they were before. */
    outdated: !!answer && answer.key !== currentKey,
  };
}

export type TourPoiSearch = ReturnType<typeof useTourPoiSearch>;

/** The place chosen in the list or on the map, while it is one of the answer's. */
export function useSelectedPoi(): TourPoi | null {
  return useTourPoiStore((state) => state.pois.find((poi) => poi.id === state.selectedId) ?? null);
}
