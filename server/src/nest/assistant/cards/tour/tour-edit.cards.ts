import type { Described, PreviewContext, ToolArgs, ToolCards, UndoCall, UndoSnapshot } from '../card-types';
import { argId, readKey, recordOf, type Row } from '../card-values';
import { Rows, text, UNCHECKED } from '../preview-format';
import { byId, snapshotPlaces } from '../undo-snapshot';
import type { AssistantChangeVerbKey } from '@trek/shared';

/**
 * P8 and P9 in the chat: the edits of a saved tour besides its route (its
 * words and times, the colour of its line, a copy), and the writes a ski or
 * paddle tour has of its own. A card names the tour by the trip's place.
 * Where the answer keeps what was there before, the way back writes that
 * again, while the tour is still at the revision the change raised it to
 * (the colour, which raises none, while the place still has it).
 */

/** A place of the trip by its id, '' where the trip card does not hold it. */
function placeName(ctx: PreviewContext, id: number | null): string {
  return id === null ? '' : (ctx.card.places.get(id)?.name ?? '');
}

function described(ctx: PreviewContext, args: ToolArgs, rows: Rows, verbKey: AssistantChangeVerbKey): Described {
  const placeId = argId(args, 'placeId');
  return {
    subject: placeName(ctx, placeId),
    rows,
    dayId: null,
    placeIds: placeId === null || !ctx.card.places.has(placeId) ? [] : [placeId],
    verbKey,
  };
}

/** Minutes as hours and minutes, "1:30 h"; '' for none. */
function hours(value: unknown): string {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return '';
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')} h`;
}

/** The plan of the tour read for an undo, by the call's own arguments. */
function planRead(snapshot: UndoSnapshot, call: UndoCall | undefined): Row {
  return recordOf(snapshot.reads.get(readKey('get_tour_plan', { placeId: call?.args.placeId })));
}

/** The tour is still at the revision the change raised it to: nothing was saved on top of it since. */
function stillAtRevision(result: unknown, snapshot: UndoSnapshot, call?: UndoCall): boolean {
  if (!call) return false;
  const revision = recordOf(recordOf(result).tour).revision;
  return typeof revision === 'number' && recordOf(planRead(snapshot, call).tour).revision === revision;
}

const READ_PLAN = (args: ToolArgs) => [{ tool: 'get_tour_plan', args: { placeId: args.placeId } }];

/** The revision the change raised the tour to, the one its way back names. */
function raisedRevision(result: unknown): number | null {
  const revision = recordOf(recordOf(result).tour).revision;
  return typeof revision === 'number' && Number.isInteger(revision) && revision > 0 ? revision : null;
}

// update_tour_details

const DETAIL_FIELDS = [
  'name',
  'description',
  'website',
  'break_additional_minutes',
  'planned_duration_minutes',
] as const;

const updateTourDetails: ToolCards = {
  write: { verbKey: 'updateTour', entity: 'tour' },
  describe: (ctx, args) => {
    const current = ctx.card.places.get(argId(args, 'placeId') ?? 0);
    const rows = new Rows();
    if (args.name !== undefined) rows.change('name', current?.name ?? null, text(args.name));
    if (args.description !== undefined)
      rows.change('description', current?.description ?? null, text(args.description));
    // A field cleared reads as cleared, not as left out.
    const cleared = (value: string) => value || UNCHECKED;
    if (args.website !== undefined) rows.add('website', cleared(text(args.website)));
    if (args.break_additional_minutes !== undefined) rows.add('breaks', cleared(hours(args.break_additional_minutes)));
    if (args.planned_duration_minutes !== undefined) rows.add('time', cleared(hours(args.planned_duration_minutes)));
    return described(ctx, args, rows, 'updateTour');
  },
  undo: {
    tool: 'update_tour_details',
    args: (args, result) => {
      const revision = raisedRevision(result);
      const previous = recordOf(recordOf(result).previous);
      const changed = DETAIL_FIELDS.filter((field) => args[field] !== undefined && field in previous);
      if (revision === null || changed.length === 0) return null;
      return {
        placeId: args.placeId,
        expected_revision: revision,
        ...Object.fromEntries(changed.map((field) => [field, previous[field]])),
      };
    },
    reads: READ_PLAN,
    unchanged: stillAtRevision,
  },
};

// set_tour_route_color

const setRouteColor: ToolCards = {
  write: { verbKey: 'setRouteColor', entity: 'tour' },
  describe: (ctx, args) => described(ctx, args, new Rows().add('color', text(args.route_color)), 'setRouteColor'),
  undo: {
    tool: 'set_tour_route_color',
    args: (args, result) => {
      const answer = recordOf(result);
      const previous = answer.previous_route_color;
      return previous === undefined ? null : { placeId: args.placeId, route_color: previous };
    },
    unchanged: (result, snapshot) => {
      const answer = recordOf(result);
      const place = byId(snapshotPlaces(snapshot), answer.place_id);
      return place !== undefined && (place.route_color ?? null) === (answer.route_color ?? null);
    },
  },
};

// classify_ski_track

const classifySki: ToolCards = {
  write: { verbKey: 'classifySki', entity: 'tour' },
  describe: (ctx, args) => {
    const technique = text(args.ski_technique);
    const type = technique ? `${text(args.ski_discipline)} (${technique})` : text(args.ski_discipline);
    return described(ctx, args, new Rows().add('type', type), 'classifySki');
  },
  undo: {
    tool: 'classify_ski_track',
    args: (args, result) => {
      const revision = raisedRevision(result);
      const previous = recordOf(recordOf(result).previous);
      if (revision === null || typeof previous.ski_discipline !== 'string') return null;
      return {
        placeId: args.placeId,
        ski_discipline: previous.ski_discipline,
        ski_technique: previous.ski_technique ?? null,
        expected_revision: revision,
      };
    },
    reads: READ_PLAN,
    unchanged: stillAtRevision,
  },
};

// set_paddle_plan

const setPaddlePlan: ToolCards = {
  write: { verbKey: 'setPaddlePlan', entity: 'tour' },
  // The portages and locks are drawn on the track's own plan card; the change names the tour.
  describe: (ctx, args) => described(ctx, args, new Rows(), 'setPaddlePlan'),
  undo: {
    tool: 'set_paddle_plan',
    args: (args, result) => {
      const revision = raisedRevision(result);
      const previous = recordOf(recordOf(result).previous);
      if (revision === null || !previous.track_marks) return null;
      return {
        placeId: args.placeId,
        paddle_speed_kmh: previous.paddle_speed_kmh ?? null,
        portage_speed_kmh: previous.portage_speed_kmh ?? null,
        track_marks: previous.track_marks,
        expected_revision: revision,
      };
    },
    reads: READ_PLAN,
    unchanged: stillAtRevision,
  },
};

/** A write on one tour that the card names and nothing takes back on its own. */
function plainWrite(verbKey: AssistantChangeVerbKey): ToolCards {
  return { write: { verbKey, entity: 'tour' }, describe: (ctx, args) => described(ctx, args, new Rows(), verbKey) };
}

export const TOUR_EDIT_CARDS: Readonly<Record<string, ToolCards>> = {
  update_tour_details: updateTourDetails,
  set_tour_route_color: setRouteColor,
  classify_ski_track: classifySki,
  set_paddle_plan: setPaddlePlan,
  // The decisions are bound to the data the travellers saw; taking them back is a decision of its own.
  decide_paddle_obstacles: plainWrite('decideObstacles'),
  // The planning it drops is gone; copy_tour first keeps it.
  restore_recorded_track: plainWrite('restoreTrack'),
};
