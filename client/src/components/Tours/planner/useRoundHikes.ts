import {
  hikingCosting,
  type HikingPreferences,
  type PlannableTourType,
  type TourMaxHikingDifficulty,
} from '@trek/shared';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { randomId } from '../../../utils/randomId';
import type { CostingOptions } from '../../Map/valhallaRoute';
import { findRoundHikes, type RoundSearchReport } from './roundHikeRouting';
import {
  canStartRound,
  ROUND_DEFAULT_M,
  roundPlanOf,
  roundRequestOf,
  searchAreaOf,
  type RoundCandidate,
  type RoundKey,
  type RoundRequest,
} from './roundHikes';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';
import { useAppliedWayHint } from './useAppliedWayHint';

/** Why the card shows no rounds although some were found: the tour changed under them. */
type RoundNotice = 'stale';

/** One search asked: its token, so an answer for an older one is never shown. */
interface Search {
  token: number;
  request: RoundRequest;
}

/** What the open card shows: from where, how far, where the search stands and the choice. */
export interface RoundHikeView {
  startId: string;
  /** The length asked for last, in metres; the next search starts from it. */
  targetM: number;
  /** The search under way or done; null while the start and the length are being set. */
  request: RoundRequest | null;
  phase: 'setup' | RoundSearchReport['phase'];
  candidates: RoundCandidate[];
  /** The questions put to the router so far. */
  asked: number;
  selected: RoundKey | null;
  /** True while the replacement of the planned points waits for a yes. */
  confirming: boolean;
  notice: RoundNotice | null;
}

export interface RoundHikesOptions {
  waypoints: TourPlannerWaypoint[];
  tourType: PlannableTourType;
  maxHikingDifficulty: TourMaxHikingDifficulty;
  hikingPreferences: HikingPreferences | null;
  /** Puts the points of a chosen round in place of the tour's, as one step of the history. */
  replaceWaypoints: (points: TourPlannerWaypoint[]) => void;
  undo: () => void;
  /** Whether the route may change now: the permission held and no save under way. */
  mayEdit: () => boolean;
}

/** Whether the tour made a search another one: its start moved or went, or the hike's rules changed. */
function outgrown(
  request: RoundRequest,
  points: readonly TourPlannerWaypoint[],
  tourType: PlannableTourType,
  costing: CostingOptions
): boolean {
  return roundRequestOf(points, request.startId, tourType, costing, request.targetM)?.key !== request.key;
}

const NO_ROUNDS: RoundCandidate[] = [];

/** What the card shows, from the hook's state; null while it is closed. */
function viewOf(state: {
  startId: string | null;
  targetM: number;
  search: Search | null;
  found: RoundSearchReport | null;
  selected: RoundKey | null;
  confirming: boolean;
  notice: RoundNotice | null;
}): RoundHikeView | null {
  const { startId, search, found, selected } = state;
  if (startId === null) return null;
  const candidates = found?.candidates ?? NO_ROUNDS;
  return {
    startId,
    targetM: state.targetM,
    request: search?.request ?? null,
    phase: search ? (found?.phase ?? 'searching') : 'setup',
    candidates,
    asked: found?.asked ?? 0,
    selected: candidates.some((round) => round.key === selected) ? selected : null,
    confirming: state.confirming,
    notice: state.notice,
  };
}

/** Where the rounds of a search can lie, for the map to frame while they are looked for and shown. */
function frameOf(search: Search | null): { key: string; points: [number, number][] } | null {
  if (!search) return null;
  return { key: `round:${search.token}`, points: searchAreaOf(search.request.start, search.request.targetM) };
}

/** The plan the tour holds besides its start: a round taken would put something in its place. */
const plansMoreThan = (points: readonly TourPlannerWaypoint[], startId: string) =>
  points.some((point) => point.id !== startId);

/**
 * RTE-03: round hikes of about a wished length out of one of the tour's stops,
 * found by the router and taken on purpose. The card opens on a start; a
 * search asks under the hike's own limit and preferences. Once the tour makes
 * it another search (the start moved, the limit changed), the rounds go and
 * the card says why, so a round found for one start never lands on another.
 * Showing, choosing and closing change nothing; taking a round puts it in
 * place of the planned points as one step of the history, after a yes when
 * there were points to replace.
 */
export function useRoundHikes(options: RoundHikesOptions) {
  const { waypoints, tourType, maxHikingDifficulty, hikingPreferences } = options;
  const costing = useMemo(
    () => hikingCosting(maxHikingDifficulty, hikingPreferences),
    [hikingPreferences, maxHikingDifficulty]
  );
  const [startId, setStartId] = useState<string | null>(null);
  const [targetM, setTargetM] = useState(ROUND_DEFAULT_M);
  const [search, setSearch] = useState<Search | null>(null);
  const [answer, setAnswer] = useState<(RoundSearchReport & { token: number }) | null>(null);
  const [selected, setSelected] = useState<RoundKey | null>(null);
  const [hovered, setHovered] = useState<RoundKey | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<RoundNotice | null>(null);
  const tokenRef = useRef(0);
  // The latest of what a round is written into, read when the yes comes.
  const latest = useRef(options);
  useLayoutEffect(() => {
    latest.current = options;
  });
  const { note: noteApplied, view: appliedHint } = useAppliedWayHint(waypoints, options.undo);

  const forgetSearch = useCallback(() => {
    setSearch(null);
    setSelected(null);
    setHovered(null);
    setConfirming(false);
  }, []);

  // Adjusted while rendering: a start that is gone closes the card, a search the tour outgrew goes.
  if (startId !== null && !canStartRound(waypoints, startId, tourType)) {
    setStartId(null);
    forgetSearch();
  } else if (search && outgrown(search.request, waypoints, tourType, costing)) {
    forgetSearch();
    setNotice('stale');
  }

  useEffect(() => {
    if (!search) return;
    const controller = new AbortController();
    void findRoundHikes(search.request, controller.signal, (found) => setAnswer({ ...found, token: search.token }));
    return () => controller.abort();
  }, [search]);

  const canStart = useCallback((id: string) => canStartRound(waypoints, id, tourType), [tourType, waypoints]);

  const open = useCallback(
    (id: string) => {
      if (!canStartRound(waypoints, id, tourType)) return;
      forgetSearch();
      setNotice(null);
      setStartId(id);
    },
    [forgetSearch, tourType, waypoints]
  );

  const close = useCallback(() => {
    forgetSearch();
    setNotice(null);
    setStartId(null);
  }, [forgetSearch]);

  /** Back to the start and the length, the rounds found let go. */
  const back = useCallback(() => {
    forgetSearch();
    setNotice(null);
  }, [forgetSearch]);

  const find = useCallback(
    (wishM: number) => {
      const request = startId ? roundRequestOf(waypoints, startId, tourType, costing, wishM) : null;
      if (!request) return;
      tokenRef.current += 1;
      setTargetM(wishM);
      setSelected(null);
      setHovered(null);
      setConfirming(false);
      setNotice(null);
      setSearch({ token: tokenRef.current, request });
    },
    [costing, startId, tourType, waypoints]
  );

  const found = search && answer?.token === search.token ? answer : null;

  const view = useMemo(
    () => viewOf({ startId, targetM, search, found, selected, confirming, notice }),
    [confirming, found, notice, search, selected, startId, targetM]
  );
  const candidates = view?.candidates ?? NO_ROUNDS;

  /**
   * Writes the chosen round in place of the plan. A start the tour moved or
   * removed meanwhile took the rounds with it already (see above), so the
   * round is always laid onto the start it was found from.
   */
  const write = useCallback(() => {
    const chosen = view?.candidates.find((round) => round.key === view.selected);
    const now = latest.current;
    const start = view?.request ? now.waypoints.find((point) => point.id === view.request?.startId) : undefined;
    setConfirming(false);
    if (!chosen || !start) return;
    noteApplied(now.waypoints);
    now.replaceWaypoints(roundPlanOf(start, chosen.via, randomId));
    close();
  }, [close, noteApplied, view]);

  const apply = useCallback(() => {
    if (!view || view.phase !== 'done' || !view.selected || !latest.current.mayEdit()) return;
    // A tour with more than its start asks first: its points give way to the round.
    if (plansMoreThan(latest.current.waypoints, view.startId)) setConfirming(true);
    else write();
  }, [view, write]);

  const confirm = useCallback(() => {
    if (latest.current.mayEdit()) write();
    else setConfirming(false);
  }, [write]);

  const cancelConfirm = useCallback(() => setConfirming(false), []);

  // The map frames where the rounds can lie while they are looked for and shown.
  const frame = useMemo(() => frameOf(search), [search]);
  const focus = hovered && candidates.some((round) => round.key === hovered) ? hovered : (view?.selected ?? null);

  return {
    view,
    focus,
    frame,
    canStart,
    open,
    find,
    back,
    select: setSelected,
    hover: setHovered,
    apply,
    confirm,
    cancelConfirm,
    close,
    appliedHint,
  };
}
