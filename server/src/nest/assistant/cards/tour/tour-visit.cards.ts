import type { Described, PreviewContext, ToolArgs, ToolCards, UndoCall, UndoSnapshot } from '../card-types';
import { argId, readKey, recordOf, type Row } from '../card-values';
import { dayLabel, Rows, text } from '../preview-format';
import type { AssistantChangeVerbKey } from '@trek/shared';

/**
 * A station of a city walk checked off on its day (set_city_walk_visit): the
 * card names the station and the walk, the verb says what the mark does, and
 * the way back is the same tool with the status the station had before,
 * while the station still has the status the change gave it.
 */

const PROGRESS_TOOL = 'get_city_walk_progress';

const VERB_OF: Readonly<Record<string, AssistantChangeVerbKey>> = {
  visited: 'markVisited',
  skipped: 'markSkipped',
  planned: 'markPlanned',
};

/** What the card and its undo read: the walk on that day, as get_city_walk_progress answers it. */
function progressArgs(args: ToolArgs): Row {
  const read: Row = { placeId: args.placeId, dayId: args.dayId };
  if (args.assignmentId !== undefined) read.assignmentId = args.assignmentId;
  return read;
}

/** The station a call names, from the walk as read. */
function stationIn(progress: unknown, key: unknown): Row | null {
  const stations = recordOf(progress).stations;
  if (!Array.isArray(stations) || typeof key !== 'string') return null;
  return (stations.map(recordOf).find((station) => station.key === key) ?? null) as Row | null;
}

export async function loadVisit(args: ToolArgs, read: (tool: string, args?: ToolArgs) => Promise<unknown>) {
  if (argId(args, 'placeId') === null || argId(args, 'dayId') === null) return null;
  return await read(PROGRESS_TOOL, progressArgs(args));
}

export function describeVisit(ctx: PreviewContext, args: ToolArgs, loaded: unknown): Described {
  const placeId = argId(args, 'placeId');
  const dayId = argId(args, 'dayId');
  const walk = placeId === null ? '' : (ctx.card.places.get(placeId)?.name ?? '');
  const station = stationIn(loaded, args.stationKey);
  const name = text(station?.name);
  const status = typeof args.status === 'string' ? args.status : '';
  return {
    subject: name || walk,
    rows: new Rows().add('route', name ? walk : '').add('day', dayLabel(ctx, dayId)),
    dayId,
    placeIds: placeId === null ? [] : [placeId],
    verbKey: VERB_OF[status],
    // Marking a station with the status it has already changes nothing to take back.
    undoable: station === null || station.status !== status,
  };
}

/** The walk as the undo read it before it checks. */
function readProgress(snapshot: UndoSnapshot, call: UndoCall | undefined): unknown {
  return call ? snapshot.reads.get(readKey(PROGRESS_TOOL, progressArgs(call.args))) : undefined;
}

export const SET_VISIT_UNDO: NonNullable<ToolCards['undo']> = {
  tool: 'set_city_walk_visit',
  args: (args, result) => {
    const answer = recordOf(result);
    const before = answer.previous_status;
    if (typeof before !== 'string' || typeof answer.station_key !== 'string') return null;
    const assignmentId = recordOf(answer.walk).assignment_id;
    return {
      placeId: args.placeId,
      dayId: args.dayId,
      stationKey: answer.station_key,
      status: before,
      ...(typeof assignmentId === 'number' ? { assignmentId } : {}),
    };
  },
  reads: (args) => [{ tool: PROGRESS_TOOL, args: progressArgs(args) }],
  unchanged: (result, snapshot, call) => {
    const answer = recordOf(result);
    const station = stationIn(readProgress(snapshot, call), answer.station_key);
    return station !== null && station.status === answer.status;
  },
};
