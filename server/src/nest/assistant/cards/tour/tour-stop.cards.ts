import type { CardReader, Described, PreviewContext, ToolArgs, ToolCards, UndoCall, UndoSnapshot } from '../card-types';
import { argId, readKey, recordOf, type Row } from '../card-values';
import { Rows, text } from '../preview-format';
import { rowsIn } from './tour-card-values';
import { alongRouteM, defaultAfterId, type InsertionPoint } from '@trek/shared';

/**
 * P6: a place taken into a saved hike or city walk as one stop
 * (insert_tour_stop), and a stop taken out again (remove_tour_stop). Each is
 * the other's way back: an insert is undone by taking out the stop it added,
 * a removal by putting the stop back after the point it followed, both while
 * the tour is still at the revision the change left it at. The card names the
 * tour, the stop and where it goes, between which two points, read from the
 * tour as saved now.
 */

/** The saved tour a held change is about, read once for its card. */
async function loadStopTour(args: ToolArgs, read: CardReader): Promise<unknown> {
  const placeId = argId(args, 'placeId');
  return placeId === null ? null : read('get_tour_plan', { placeId });
}

/** The points of the tour as read, as the planner's insertion rule takes them. */
function pointsOf(plan: Row): Array<InsertionPoint & { name: string }> {
  return rowsIn(plan.waypoints).flatMap((point, index) => {
    if (typeof point.lat !== 'number' || typeof point.lng !== 'number') return [];
    return [
      {
        id: typeof point.key === 'string' ? point.key : `#${index}`,
        lat: point.lat,
        lng: point.lng,
        role: typeof point.role === 'string' ? point.role : 'via',
        fixedLeg: point.fixed_leg ? (point.fixed_leg as InsertionPoint['fixedLeg']) : null,
        ...(point.shaping === true ? { shaping: true } : {}),
        name: text(point.name) || String(index + 1),
      },
    ];
  });
}

/** The saved line in brief, for where along it a stop lies. */
function previewOf(plan: Row): Array<[number, number]> | null {
  const preview = recordOf(plan.line).preview;
  if (!Array.isArray(preview)) return null;
  const line = preview.flatMap((point): Array<[number, number]> => {
    const [lat, lng] = Array.isArray(point) ? point : [];
    return typeof lat === 'number' && typeof lng === 'number' ? [[lat, lng]] : [];
  });
  return line.length > 1 ? line : null;
}

/**
 * The key of the point a stop at `spot` goes after where none is named: the
 * last point before it along the saved line, as insert_tour_stop picks it.
 */
export function defaultAfterKeyOf(plan: Row, spot: { lat: number; lng: number }): string | null {
  const points = pointsOf(plan);
  const line = previewOf(plan);
  const id = defaultAfterId(points, line, alongRouteM(points, line, spot));
  return id !== null && !id.startsWith('#') ? id : null;
}

/** "Parking → Hut": the two points a stop goes between, or the one it follows as the new end. */
function betweenOf(plan: Row, args: ToolArgs): string {
  const points = pointsOf(plan);
  const stop = recordOf(args.stop);
  let afterId = typeof args.after_key === 'string' ? args.after_key : null;
  if (afterId === null && typeof stop.lat === 'number' && typeof stop.lng === 'number') {
    afterId = defaultAfterKeyOf(plan, { lat: stop.lat, lng: stop.lng });
  }
  const index = points.findIndex((point) => point.id === afterId);
  const after = points[index];
  if (!after) return '';
  const next = points.slice(index + 1).find((point) => point.shaping !== true);
  return next ? `${after.name} → ${next.name}` : `${after.name} →`;
}

function tourName(ctx: PreviewContext, args: ToolArgs, plan: Row): string {
  const placeId = argId(args, 'placeId');
  return text(recordOf(plan.tour).name) || (placeId === null ? '' : (ctx.card.places.get(placeId)?.name ?? ''));
}

function described(ctx: PreviewContext, args: ToolArgs, plan: Row, rows: Rows, verbKey: Described['verbKey']) {
  const placeId = argId(args, 'placeId');
  return {
    subject: tourName(ctx, args, plan),
    rows,
    dayId: null,
    placeIds: placeId !== null && ctx.card.places.has(placeId) ? [placeId] : [],
    verbKey,
  };
}

/** Whether the tour is still at the revision the change left it at, read before the way back. */
function atRevision(result: unknown, snapshot: UndoSnapshot, call?: UndoCall): boolean {
  if (!call) return false;
  const plan = recordOf(snapshot.reads.get(readKey('get_tour_plan', { placeId: call.args.placeId })));
  const revision = recordOf(recordOf(result).tour).revision;
  return typeof revision === 'number' && recordOf(plan.tour).revision === revision;
}

const readsPlan = (args: ToolArgs) => [{ tool: 'get_tour_plan', args: { placeId: args.placeId } }];

const insertStop: ToolCards<unknown> = {
  write: { verbKey: 'addTourStop', entity: 'tour' },
  load: loadStopTour,
  describe: (ctx, args, loaded) => {
    const plan = recordOf(loaded);
    const rows = new Rows().add('name', text(recordOf(args.stop).name)).add('position', betweenOf(plan, args));
    return described(ctx, args, plan, rows, 'addTourStop');
  },
  undo: {
    tool: 'remove_tour_stop',
    args: (_args, result) => {
      const answer = recordOf(result);
      const tour = recordOf(answer.tour);
      const key = recordOf(answer.stop).key;
      if (typeof key !== 'string' || typeof tour.revision !== 'number' || typeof tour.place_id !== 'number') {
        return null;
      }
      return { placeId: tour.place_id, key, expected_revision: tour.revision };
    },
    reads: readsPlan,
    unchanged: atRevision,
  },
};

const removeStop: ToolCards<unknown> = {
  write: { verbKey: 'removeTourStop', entity: 'tour' },
  load: loadStopTour,
  describe: (ctx, args, loaded) => {
    const plan = recordOf(loaded);
    const stop = rowsIn(plan.waypoints).find((point) => point.key === args.key);
    return described(ctx, args, plan, new Rows().add('name', text(stop?.name)), 'removeTourStop');
  },
  undo: {
    tool: 'insert_tour_stop',
    args: (_args, result) => {
      const answer = recordOf(result);
      const tour = recordOf(answer.tour);
      const removed = recordOf(answer.removed);
      if (typeof tour.revision !== 'number' || typeof tour.place_id !== 'number') return null;
      if (typeof removed.lat !== 'number' || typeof removed.lng !== 'number') return null;
      const stop: Row = { lat: removed.lat, lng: removed.lng };
      if (typeof removed.name === 'string') stop.name = removed.name;
      if (typeof removed.poi_category === 'string') stop.poi_category = removed.poi_category;
      const after = typeof removed.after_key === 'string' ? { after_key: removed.after_key } : {};
      return { placeId: tour.place_id, expected_revision: tour.revision, stop, ...after };
    },
    reads: readsPlan,
    unchanged: atRevision,
  },
};

export const TOUR_STOP_CARDS: Readonly<Record<string, ToolCards>> = {
  insert_tour_stop: insertStop,
  remove_tour_stop: removeStop,
};
