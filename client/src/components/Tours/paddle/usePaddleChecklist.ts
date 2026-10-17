import {
  haversineMetres,
  paddleCheckSummaryOf,
  type ObstacleDecision,
  type ObstacleReviewOp,
  type PaddleCheck,
  type TourListItem,
  type TourObstacleCheck,
  type TourObstacleEntry,
  type TourOwnEntry,
  type TripMember,
} from '@trek/shared';
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { useNetworkMode } from '../../../hooks/useNetworkMode';
import { useTranslation } from '../../../i18n';
import { applyObstacleOps } from '../../../repo/obstacleCheckLocal';
import { tourRepo } from '../../../repo/tourRepo';
import { useAuthStore } from '../../../store/authStore';
import {
  focusPaddleArea,
  focusPaddleObstacle,
  selectPaddleObstacle,
  usePaddleObstacleStore,
} from '../../../store/paddleObstacleStore';
import { useToast } from '../../shared/Toast';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { focusPointsOf, nextPendingEntry } from './paddleCheckModel';
import type { TrackPaddlePlan } from './useTrackPaddlePlan';

export type PaddleChecklistStatus = 'off' | 'new' | 'loading' | 'ready' | 'offline-empty' | 'error';

interface PaddleChecklistOptions {
  tripId: number;
  planner: TourPlannerController;
  tours: readonly TourListItem[];
  tripMembers: readonly TripMember[];
  canEdit: boolean;
  /** The tours workspace is open on a desktop with the Tours addon on. */
  active: boolean;
  trackPaddlePlan?: Pick<TrackPaddlePlan, 'dirty' | 'startPick' | 'pick'>;
  /** The tour as it stands after a save, for the lists and the map to take it in. */
  onSaved: (tour: TourListItem) => void;
}

interface Loaded {
  placeId: number;
  key: string;
  check: TourObstacleCheck | null;
  stale: boolean;
  failed: boolean;
}

/** The paddle tour the planner has open, saved or shown as recorded, or null. */
function openPaddleTour(mode: TourPlannerController['mode'], tours: readonly TourListItem[]): TourListItem | null {
  if (mode.type !== 'edit-saved' && mode.type !== 'view-gpx') return null;
  const tour = tours.find((item) => item.place_id === mode.placeId) ?? (mode.type === 'view-gpx' ? mode.tour : null);
  return tour?.tour_type === 'kayak' ? tour : null;
}

/** Reads the checklist for the bench the list shows, again whenever its revision or the connection changes. */
/** The read key of a tour's checklist: a new bench revision or a change of the connection reads it again. */
const readKey = (placeId: number | null, revision: string | null, offline: boolean) =>
  `${placeId}:${revision}:${offline}`;

/**
 * Reads the checklist for the bench the list shows, again whenever its
 * revision or the connection changes. A read that finds the server further
 * than the list (a queued write replayed meanwhile) hands the newer tour on,
 * so the list and its bench catch up.
 */
function useChecklistRead(
  tripId: number,
  tour: TourListItem | null,
  active: boolean,
  onNewer: (tour: TourListItem) => void
) {
  const { offline } = useNetworkMode();
  const placeId = tour?.place_id ?? null;
  const revision = tour?.paddle_check?.revision ?? null;
  const key = readKey(placeId, revision, offline);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // Handing the newer tour on is no reason to read again.
  const takeNewer = useEffectEvent(onNewer);
  useEffect(() => {
    if (!active || placeId === null) return;
    const controller = new AbortController();
    tourRepo
      .obstacleCheck(tripId, placeId, revision, controller.signal)
      .then(({ check, stale, tour: answered }) => {
        if (controller.signal.aborted) return;
        const newer = answered?.paddle_check?.revision;
        if (answered && newer && newer !== revision) {
          setLoaded({
            placeId,
            key: readKey(placeId, newer, offline),
            check,
            stale: check?.revision !== newer,
            failed: false,
          });
          takeNewer(answered);
          return;
        }
        setLoaded({ placeId, key, check, stale, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ placeId, key, check: null, stale: false, failed: true });
      });
    return () => controller.abort();
  }, [active, key, offline, placeId, revision, tripId]);
  const current = loaded?.key === key ? loaded : null;
  // While the same tour reads again, what it read before stays in view, locked, so a panel open on it stays open.
  const previous = !current && loaded?.placeId === placeId && loaded.check ? loaded : null;
  return { current, previous, offline, key, setLoaded };
}

/** Where a portage for an obstacle starts on a planned tour: the control point whose leg passes it. */
function waypointBefore(points: TourPlannerController['waypoints'], alongM: number): string | null {
  let distance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    distance += haversineMetres(a.lat, a.lng, b.lat, b.lng);
    if (distance >= alongM) return a.id;
  }
  return points[points.length - 2]?.id ?? null;
}

/**
 * A new paddle draft, or a saved tour the list shows as another type that the
 * planner turned into a paddle tour: no server check exists for either. A
 * tour the list does not hold yet (still loading) is neither.
 */
function unsavedPaddleDraft(planner: TourPlannerController, tours: readonly TourListItem[]): boolean {
  if (!planner.isPaddle) return false;
  const { mode } = planner;
  if (mode.type === 'new-draft') return true;
  return (
    mode.type === 'edit-saved' && tours.some((item) => item.place_id === mode.placeId && item.tour_type !== 'kayak')
  );
}

/** Where the checklist of the open tour stands. */
function checklistStatus(input: {
  active: boolean;
  newPaddleDraft: boolean;
  tour: TourListItem | null;
  current: Loaded | null;
  offline: boolean;
}): PaddleChecklistStatus {
  if (!input.active) return 'off';
  if (input.newPaddleDraft) return 'new';
  if (!input.tour) return 'off';
  if (!input.current) return 'loading';
  if (input.current.check) return 'ready';
  return input.offline ? 'offline-empty' : 'error';
}

/** The bench of the tour, recounted from a change shown before the server answered it. */
function benchOf(tour: TourListItem | null, optimistic: TourObstacleCheck | null): PaddleCheck | null {
  const bench = tour?.paddle_check ?? null;
  if (!bench || !optimistic) return bench;
  return { ...paddleCheckSummaryOf(optimistic.entries, optimistic.own, bench), revision: bench.revision };
}

/**
 * Moving between the entries: a click in the rail focuses the map on the
 * object, or opens it in a dialog when the map does not hold it; an own
 * portage selects its control point; planning a portage starts where the
 * route can take one.
 */
function useChecklistNavigation(
  planner: TourPlannerController,
  check: TourObstacleCheck | null,
  trackPaddlePlan: PaddleChecklistOptions['trackPaddlePlan']
) {
  const { mode, waypoints, setSelectedWaypointId } = planner;
  const selectedRef = usePaddleObstacleStore((state) => state.selectedRef);
  const [dialogKey, setDialogKey] = useState<string | null>(null);
  const entryForRef = useCallback(
    (ref: string) => check?.entries.find((entry) => entry.refs.includes(ref)) ?? null,
    [check]
  );
  const select = useCallback((entry: TourObstacleEntry) => {
    const ref = entry.refs[0];
    if (ref && focusPaddleObstacle(ref)) {
      setDialogKey(null);
      return;
    }
    selectPaddleObstacle(null);
    focusPaddleArea(focusPointsOf(entry));
    setDialogKey(entry.key);
  }, []);
  const selectOwn = useCallback(
    (own: TourOwnEntry) => {
      focusPaddleArea(focusPointsOf(own));
      const waypoint = own.index === null ? undefined : waypoints[own.index];
      if (mode.type === 'edit-saved' && waypoint) setSelectedWaypointId(waypoint.id);
    },
    [mode.type, setSelectedWaypointId, waypoints]
  );
  // A track takes the portage on its own pick; a planned tour selects the control point to carry from.
  const planPortage = useCallback(
    (entry: TourObstacleEntry) => {
      selectPaddleObstacle(null);
      setDialogKey(null);
      focusPaddleArea(focusPointsOf(entry));
      if (mode.type === 'view-gpx') {
        if (trackPaddlePlan?.pick !== 'portage') trackPaddlePlan?.startPick('portage');
        return;
      }
      const waypoint = waypointBefore(waypoints, entry.along_m ?? 0);
      if (waypoint) setSelectedWaypointId(waypoint);
    },
    [mode.type, setSelectedWaypointId, trackPaddlePlan, waypoints]
  );
  const nextOf = useCallback((entry: TourObstacleEntry) => (check ? nextPendingEntry(check, entry) : null), [check]);
  const selectedEntry = selectedRef ? entryForRef(selectedRef) : null;
  return {
    selectedKey: selectedEntry?.key ?? dialogKey,
    dialogKey,
    entryForRef,
    select,
    selectOwn,
    closeDialog: () => setDialogKey(null),
    nextOf,
    next: (entry: TourObstacleEntry) => {
      const following = nextOf(entry);
      if (following) select(following);
    },
    planPortage,
  };
}

/**
 * PAD-06 and PAD-09 in the tours workspace: the checklist of the open paddle
 * tour, read through the offline core for the bench the list shows, with the
 * paddlers' decisions saved optimistically and rolled back on a failure.
 * Deciding waits while the route has unsaved changes, since a decision binds
 * to the route the server judged.
 */
export function usePaddleChecklist(options: PaddleChecklistOptions) {
  const { tripId, planner, tours, canEdit, active, trackPaddlePlan } = options;
  const tour = useMemo(() => openPaddleTour(planner.mode, tours), [planner.mode, tours]);
  const read = useChecklistRead(tripId, tour, active, options.onSaved);
  const writes = useChecklistWrites(options, tour, read);
  const check = writes.optimistic ?? read.current?.check ?? read.previous?.check ?? null;
  const navigation = useChecklistNavigation(planner, check, trackPaddlePlan);
  const dirty = planner.hasUnsavedChanges || !!trackPaddlePlan?.dirty;
  const status = checklistStatus({
    active,
    newPaddleDraft: unsavedPaddleDraft(planner, tours),
    tour,
    current: read.current,
    offline: read.offline,
  });
  const saved = (tour?.place_id ?? -1) > 0;

  return {
    status,
    tour,
    check,
    summary: benchOf(tour, writes.optimistic),
    stale: !!read.current?.stale,
    dirty,
    canDecide: canEdit && status === 'ready' && !dirty && saved && writes.savingKey === null,
    /** Planning a portage edits the tour, so only someone who may edit it is offered it. */
    canPlanPortage: canEdit,
    savingKey: writes.savingKey,
    ...navigation,
    ...writes.actions,
    memberName: (id: number | null) => options.tripMembers.find((member) => member.id === id)?.username ?? null,
  };
}

export type PaddleChecklist = ReturnType<typeof usePaddleChecklist>;

interface PendingSave {
  key: string;
  check: TourObstacleCheck;
}

/** The saves on their way without this one, once it is answered; a later save of the same tour stays. */
function withoutSave(
  all: Readonly<Record<number, PendingSave>>,
  placeId: number,
  done: PendingSave
): Readonly<Record<number, PendingSave>> {
  if (all[placeId] !== done) return all;
  const { [placeId]: _done, ...rest } = all;
  return rest;
}

/** The decisions saved through the offline core: shown at once, the server's answer taken in, a failure undone. */
function useChecklistWrites(
  options: PaddleChecklistOptions,
  tour: TourListItem | null,
  read: ReturnType<typeof useChecklistRead>
) {
  const { tripId, onSaved } = options;
  const { t } = useTranslation();
  const toast = useToast();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  // The save on its way per tour, so one tour's answer never clears another's.
  const [pending, setPending] = useState<Readonly<Record<number, PendingSave>>>({});
  const base = read.current?.check ?? null;
  const placeId = tour?.place_id ?? null;
  const { setLoaded, offline } = read;

  const save = useCallback(
    async (key: string, op: ObstacleReviewOp) => {
      if (!base || placeId === null) return false;
      const entry: PendingSave = {
        key,
        check: applyObstacleOps(base, [op], { now: new Date().toISOString(), userId, revision: 'pending' }),
      };
      setPending((all) => ({ ...all, [placeId]: entry }));
      try {
        const result = await tourRepo.saveObstacleReviews(tripId, placeId, { ops: [op] }, userId);
        const revision = result.tour.paddle_check?.revision ?? null;
        const check = result.obstacle_check ?? base;
        const next: Loaded = {
          placeId,
          key: readKey(placeId, revision, offline),
          check,
          // A checklist still judged on an older route than the bench stays marked as such.
          stale: revision !== null && check.revision !== revision,
          failed: false,
        };
        // Another tour opened meanwhile keeps what it read; this one's answer reaches the list and the cache.
        setLoaded((current) => (current && !current.key.startsWith(`${placeId}:`) ? current : next));
        onSaved(result.tour);
        return true;
      } catch {
        toast.error(t('tours.paddle.marks.failed'));
        return false;
      } finally {
        setPending((all) => withoutSave(all, placeId, entry));
      }
    },
    [base, offline, onSaved, placeId, setLoaded, t, toast, tripId, userId]
  );

  const actions = useMemo(
    () => ({
      decide: (entry: TourObstacleEntry, decision: ObstacleDecision) =>
        save(entry.key, {
          key: entry.key,
          op: 'decide',
          decision,
          note: entry.decision?.note ?? null,
          basis: entry.basis,
        }),
      setNote: (entry: TourObstacleEntry, note: string | null) =>
        save(entry.key, { key: entry.key, op: 'note', decision: null, note: note?.trim() || null, basis: null }),
      clear: (entry: TourObstacleEntry) =>
        save(entry.key, { key: entry.key, op: 'clear', decision: null, note: null, basis: null }),
      keep: (entry: TourObstacleEntry) =>
        save(entry.key, { key: entry.key, op: 'keep', decision: null, note: null, basis: null }),
    }),
    [save]
  );
  // A save still running for a tour left meanwhile shows nothing on the one open now.
  const mine = placeId === null ? null : (pending[placeId] ?? null);
  return { optimistic: mine?.check ?? null, savingKey: mine?.key ?? null, actions };
}
