import type { TourActivity, TourListItem } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { tourRepo } from '../../../repo/tourRepo';
import { useTourGpxImport } from '../useTourGpxImport';
import { executionOf, importFieldsFor, trackCandidates, type TourExecution } from './tourActivityModel';
import type { AssignTarget } from './useTourActivities';

interface TrackAssignmentOptions {
  tripId: number;
  tour: TourListItem;
  executions: readonly TourExecution[];
  /** The recordings the tour has now, to preset a change and to name what a choice replaces. */
  activities: readonly TourActivity[];
  target: AssignTarget;
  canEdit: boolean;
  onToursChanged?: (placeIds: number[]) => Promise<void> | void;
}

/** The execution the dialog starts on: the one asked for, else the first day without a recording, else none. */
function startingExecution(
  executions: readonly TourExecution[],
  activities: readonly TourActivity[],
  target: AssignTarget
): number | null {
  if (target.assignmentId !== undefined) return target.assignmentId;
  const recorded = new Set(activities.map((activity) => activity.assignment_id));
  return (executions.find((execution) => !recorded.has(execution.assignmentId)) ?? executions[0])?.assignmentId ?? null;
}

/**
 * ACT-01, the dialog that assigns a recording: which execution it was, which
 * recording of the trip, or a new one through the GPX import (its preview
 * preset to the tour's type), and what the choice measures before anything is
 * written. Nothing is stored until the user confirms; a recording imported
 * here is chosen for them, never assigned.
 */
export function useTrackAssignment({
  tripId,
  tour,
  executions,
  activities,
  target,
  canEdit,
  onToursChanged,
}: TrackAssignmentOptions) {
  const [assignmentId, setAssignmentId] = useState<number | null>(() =>
    startingExecution(executions, activities, target)
  );
  const onExecution = activities.filter((activity) => activity.assignment_id === assignmentId);
  const [selected, setSelected] = useState<number | null>(() => {
    const changed = onExecution.find((activity) => activity.id === target.activityId) ?? onExecution[0];
    return changed?.track.place_id ?? null;
  });
  const [tours, setTours] = useState<TourListItem[] | null>(null);
  const [reads, setReads] = useState(0);

  useEffect(() => {
    let cancelled = false;
    tourRepo.list(tripId).then(
      ({ tours: listed }) => {
        if (!cancelled) setTours(listed);
      },
      () => {
        if (!cancelled) setTours([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [tripId, reads]);

  const onImported = useCallback((imported: TourListItem[]) => {
    const first = imported[0];
    if (first) setSelected(first.place_id);
    setReads((count) => count + 1);
  }, []);
  const gpxImport = useTourGpxImport({
    tripId,
    canEdit,
    onToursChanged: (placeIds) => onToursChanged?.(placeIds ?? []),
    onImported,
  });

  const candidates = useMemo(() => (tours ? trackCandidates(tours, tour.place_id) : null), [tour.place_id, tours]);
  const choice = candidates?.find((candidate) => candidate.tour.place_id === selected) ?? null;
  // Every recording the execution has now, other than the one chosen, gives way to it: a day has
  // one, "no day" can have several once the days they were on are gone, and the server clears them all.
  const replaces = onExecution
    .filter((activity) => activity.track.place_id !== selected)
    .map((activity) => activity.track.name);

  return {
    executions,
    assignmentId,
    execution: executionOf(executions, assignmentId),
    chooseExecution: setAssignmentId,
    /** Null while the trip's tours load. */
    candidates,
    selected,
    choose: setSelected,
    choice,
    /** The names of the tracks linking replaces; empty when it replaces none. */
    replaces,
    gpxImport,
    importFields: importFieldsFor(tour),
    /** A free recording is chosen, so the assignment can be confirmed. */
    ready: choice !== null && choice.takenBy === null,
  };
}

export type TrackAssignment = ReturnType<typeof useTrackAssignment>;
