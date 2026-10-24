import type { ToolCards, UndoSnapshot } from '../card-types';
import { recordOf, type Row } from '../card-values';
import { byId, placeUnchanged, snapshotPlaces } from '../undo-snapshot';

/** The place id of a tour, or null. */
function placeIdOf(tour: Row): number | null {
  const id = tour.place_id;
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * A created tour, unchanged and on no other day: its place still has the
 * name and description it was created with, has not been written since it
 * was made, and nothing plans, books or pays for it. Every write of a tour's
 * route or name (a change over MCP, the planner's save, a rename) stamps its
 * place's `updated_at`, which the create left equal to `created_at`; the
 * revision is not in the snapshot. The visit a hike created on a day comes
 * with it (`assignment`); planned on another day since, the tour is kept.
 */
function tourUnchanged(tour: Row, assignment: unknown, snapshot: UndoSnapshot): boolean {
  const current = byId(snapshotPlaces(snapshot), tour.place_id);
  const untouched = typeof current?.created_at === 'string' && current.updated_at === current.created_at;
  const created = { id: tour.place_id, name: tour.name, description: tour.description ?? null };
  return untouched && placeUnchanged({ place: created, assignment: recordOf(assignment) }, snapshot);
}

/** A created tour taken back with its place, which takes its route, its points and its visit along. */
export const DELETE_CREATED_TOUR: NonNullable<ToolCards['undo']> = {
  tool: 'delete_place',
  args: (_args, result) => {
    const placeId = placeIdOf(recordOf(recordOf(result).tour));
    return placeId ? { placeId } : null;
  },
  unchanged: (result, snapshot) => {
    const answer = recordOf(result);
    return tourUnchanged(recordOf(answer.tour), answer.assignment, snapshot);
  },
};

/** The one tour a GPX file brought in, when it brought in exactly one: a file of several has no single way back. */
function onlyImported(result: unknown): Row | null {
  const tours = recordOf(result).tours;
  return Array.isArray(tours) && tours.length === 1 ? recordOf(tours[0]) : null;
}

/** A tour taken in from a GPX file of one track, taken back with its place while it is as it came in. */
export const DELETE_IMPORTED_TOUR: NonNullable<ToolCards['undo']> = {
  tool: 'delete_place',
  args: (_args, result) => {
    const tour = onlyImported(result);
    const placeId = tour ? placeIdOf(tour) : null;
    return placeId ? { placeId } : null;
  },
  unchanged: (result, snapshot) => {
    const tour = onlyImported(result);
    return tour !== null && tourUnchanged(tour, null, snapshot);
  },
};
