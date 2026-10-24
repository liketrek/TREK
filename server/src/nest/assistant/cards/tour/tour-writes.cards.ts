import type { Described, PreviewContext, ToolArgs, ToolCards, UndoCall, UndoSnapshot } from '../card-types';
import { argId, readKey, recordOf, type Row } from '../card-values';
import { Rows } from '../preview-format';

/**
 * The smaller writes on a saved tour, each with its card and, where the answer
 * says enough, its way back: a recorded track put on a tour or taken off it,
 * a tour left out of the activity sums or counted again (the packing list a
 * tour points at is the packing package's). A card names the tour by the trip's
 * place; the way back is the opposite tool, while what the change left is
 * still as it left it.
 */

/** A place of the trip by its id, '' where the trip card does not hold it. */
function placeName(ctx: PreviewContext, id: number | null): string {
  return id === null ? '' : (ctx.card.places.get(id)?.name ?? '');
}

function described(ctx: PreviewContext, placeId: number | null, rows: Rows, verbKey: Described['verbKey']): Described {
  return {
    subject: placeName(ctx, placeId),
    rows,
    dayId: null,
    placeIds: placeId === null || !ctx.card.places.has(placeId) ? [] : [placeId],
    verbKey,
  };
}

function rowsIn(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}

/** The read an undo checks against, by the call's own arguments. */
function readOf(snapshot: UndoSnapshot, tool: string, args: Row): Row {
  return recordOf(snapshot.reads.get(readKey(tool, args)));
}

// assign_tour_track, unassign_tour_track

/** The assignment a call made: the newest of the answer's activities with that track. */
function assignedActivity(args: ToolArgs, result: unknown): number | null {
  const track = argId(args, 'track_place_id');
  const ids = rowsIn(recordOf(result).activities)
    .filter((activity) => recordOf(activity.track).place_id === track)
    .map((activity) => activity.id)
    .filter((id): id is number => typeof id === 'number');
  return ids.length > 0 ? Math.max(...ids) : null;
}

const assignTrack: ToolCards = {
  write: { verbKey: 'assignTrack', entity: 'tour' },
  describe: (ctx, args) =>
    described(
      ctx,
      argId(args, 'placeId'),
      new Rows().add('track', placeName(ctx, argId(args, 'track_place_id'))),
      'assignTrack',
    ),
  undo: {
    tool: 'unassign_tour_track',
    args: (args, result) => {
      const activityId = assignedActivity(args, result);
      return activityId === null ? null : { placeId: args.placeId, activityId };
    },
    reads: (args) => [{ tool: 'get_tour_plan', args: { placeId: args.placeId } }],
    unchanged: (result, snapshot, call?: UndoCall) => {
      if (!call) return false;
      const activityId = assignedActivity(call.args, result);
      const plan = readOf(snapshot, 'get_tour_plan', { placeId: call.args.placeId });
      return activityId !== null && rowsIn(plan.activities).some((activity) => activity.id === activityId);
    },
  },
};

const unassignTrack: ToolCards = {
  write: { verbKey: 'unassignTrack', entity: 'tour' },
  describe: (ctx, args) => described(ctx, argId(args, 'placeId'), new Rows(), 'unassignTrack'),
};

// set_tour_activity_excluded

/** The entry of a tour in the activity sums as read, from the done ones and the upcoming. */
function statsEntry(stats: Row, placeId: unknown): Row | null {
  const all = [...rowsIn(stats.tours), ...rowsIn(stats.upcoming)];
  return all.find((entry) => entry.place_id === placeId) ?? null;
}

const setExcluded: ToolCards = {
  write: { verbKey: 'excludeTour', entity: 'tour' },
  describe: (ctx, args) =>
    described(ctx, argId(args, 'place_id'), new Rows(), args.excluded === false ? 'countTour' : 'excludeTour'),
  undo: {
    tool: 'set_tour_activity_excluded',
    args: (args) =>
      typeof args.excluded === 'boolean' && argId(args, 'place_id') !== null
        ? { place_id: args.place_id, excluded: !args.excluded }
        : null,
    reads: () => [{ tool: 'get_tour_activity_stats', args: {} }],
    unchanged: (_result, snapshot, call?: UndoCall) => {
      if (!call) return false;
      const entry = statsEntry(readOf(snapshot, 'get_tour_activity_stats', {}), call.args.place_id);
      return entry !== null && entry.excluded === call.args.excluded;
    },
  },
};

export const TOUR_WRITE_CARDS: Readonly<Record<string, ToolCards>> = {
  assign_tour_track: assignTrack,
  unassign_tour_track: unassignTrack,
  set_tour_activity_excluded: setExcluded,
};
