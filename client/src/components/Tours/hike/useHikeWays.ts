import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import type { RouteWayEdge, RouteWays } from '../bike/routeWays';
import { useRouteWays, type RouteWaysState } from '../bike/useRouteWays';
import { HIKE_FACETS, type HikeFacet } from './hikeFacetSpecs';
import { facetClassifier, facetOverlay, facetRows, isUnknownClass, knownShareOf, type FacetRow } from './hikeFacets';
import { straysFrom } from './routeMatch';
import { highestStep } from './sacGrades';

type HikeWaysStatus = 'off' | 'loading' | 'offline' | 'failed' | 'ready';

export interface HikeWays {
  /** Whether the card has a line to describe at all. */
  available: boolean;
  /** Whether the card is switched on: only then is anything asked for and drawn on the map. */
  shown: boolean;
  toggle: () => void;
  facet: HikeFacet;
  chooseFacet: (facet: HikeFacet) => void;
  status: HikeWaysStatus;
  /** The facet's classes along the line, the known first. */
  rows: FacetRow[];
  /** Of the whole line, 0 to 1, the share whose class is known. */
  knownShare: number;
  /** The known class covering the most of the line, or null. */
  mostly: FacetRow | null;
  /** On the SAC facet, the highest step known along the line, or null. */
  highest: number | null;
  /** The class drawn alone on the map, or null while every class is. */
  focus: string | null;
  focusOn: (key: string) => void;
  retry: () => void;
  /** The router's description of the ways under the line, once read; null before. */
  routeWays: RouteWays | null;
}

const NO_STRAYS: ReadonlySet<RouteWayEdge> = new Set();

function statusOf(state: RouteWaysState, nothingAnswered: boolean): HikeWaysStatus {
  if (state.status === 'idle') return 'off';
  if (state.status !== 'ready') return state.status;
  const grades = state.grades?.status ?? 'failed';
  if (grades === 'ready') return nothingAnswered ? 'failed' : 'ready';
  return grades;
}

function mostlyOf(rows: readonly FacetRow[]): FacetRow | null {
  return rows.reduce<FacetRow | null>(
    (best, row) => (!isUnknownClass(row.key) && (!best || row.lengthM > best.lengthM) ? row : best),
    null
  );
}

/**
 * MAP-03 and MAP-04: what OpenStreetMap records for the ways along a hike,
 * switched on by the traveller. One read serves every facet: the ways under
 * the line are asked of the router once, matched on foot, and their values of
 * OpenStreetMap once, and each stretch is placed against the tour's own line
 * once; the facet picked (SAC grade, surface, kind of way) only decides how
 * the stretches are sorted and drawn along the line on the planner map,
 * every class at once or the one picked alone. Nothing here changes the
 * tour, its places or its days; switched off, the map is as it was. A run
 * (RUN-02) is read the same way, its line matched as a run on foot.
 */
export function useHikeWays(input: {
  tripId: number | string;
  /** The tour's own line, or null while there is none. */
  route: [number, number][] | null;
  /** False while the line is being planned anew: the card stays, and waits for the new one. */
  current?: boolean;
  /** How the line is matched to the ways: on foot for a hike, as a run for a run. */
  matching?: 'foot' | 'run';
}): HikeWays {
  const { tripId, route, current = true, matching = 'foot' } = input;
  const available = !!route && route.length >= 2;
  const [shown, setShown] = useState(false);
  const [facet, setFacet] = useState<HikeFacet>('sac');
  const [picked, setPicked] = useState<string | null>(null);
  const on = available && shown;
  const line = current ? route : null;
  const state = useRouteWays({ tripId, active: on, route: line, matching, withGrades: true });
  const { ways, grades } = state;
  const spec = HIKE_FACETS[facet];
  const strays = useMemo(() => (ways && line ? straysFrom(ways, line) : NO_STRAYS), [ways, line]);
  const classOf = useMemo(() => (grades ? facetClassifier(spec, grades, strays) : null), [spec, grades, strays]);
  const rows = useMemo(
    () => (ways && grades?.status === 'ready' && classOf ? facetRows(spec, ways, grades, classOf) : []),
    [spec, ways, grades, classOf]
  );
  // Not a single way could be asked about: said once with a way to ask again, not as a row covering the whole hike.
  const nothingAnswered = rows.length > 0 && rows.every((row) => row.key === 'unasked');
  const status = !on ? 'off' : current ? statusOf(state, nothingAnswered) : 'loading';
  const focus = rows.some((row) => row.key === picked) ? picked : null;

  useEffect(() => {
    if (status !== 'ready' || !ways || !classOf) return;
    const overlay = facetOverlay(spec, ways, rows, classOf, focus);
    const highlight = useTourRouteHighlightStore.getState();
    highlight.show({ id: focus ? `${facet}-${focus}` : facet, ...overlay, paint: 'unknown' });
    return () => highlight.clear();
  }, [status, spec, facet, ways, rows, classOf, focus]);

  const toggle = useCallback(() => {
    setShown((value) => !value);
    setPicked(null);
  }, []);
  const chooseFacet = useCallback((next: HikeFacet) => {
    setFacet(next);
    setPicked(null);
  }, []);
  const focusOn = useCallback((key: string) => setPicked((now) => (now === key ? null : key)), []);

  const shownRows = status === 'ready' ? rows : [];
  return {
    available,
    shown: on,
    toggle,
    facet,
    chooseFacet,
    status,
    rows: shownRows,
    knownShare: knownShareOf(shownRows),
    mostly: mostlyOf(shownRows),
    highest: facet === 'sac' ? highestStep(shownRows) : null,
    focus,
    focusOn,
    retry: state.retry,
    routeWays: status === 'ready' ? ways : null,
  };
}
