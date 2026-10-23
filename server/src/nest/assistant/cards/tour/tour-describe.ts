import type { Described, PreviewContext, ToolArgs } from '../card-types';
import { recordOf } from '../card-values';
import { clip, dayLabel, id, Rows, text } from '../preview-format';
import { TOURS_MAX_HIKING_DIFFICULTY } from '@trek/shared';

/**
 * The change cards of the tours an assistant creates and changes: a hike, a
 * city walk, a change to a saved hike, tours taken in from a GPX file. The
 * route reads as the names of its points in order, a hike's limit as its SAC
 * grade (T1 to T6), a planned time in hours and minutes.
 */

/** A point's name: its own, else the name of the trip's place it stands for. */
function pointName(ctx: PreviewContext, point: unknown): string {
  const record = recordOf(point);
  const linked = id(record, 'linked_place_id');
  return text(record.name) || (linked === null ? '' : (ctx.card.places.get(linked)?.name ?? ''));
}

/** "Car park → Hut → Summit": the named points in order, a round trip back to its start. */
function routeOf(ctx: PreviewContext, points: unknown, roundTrip: unknown): string {
  if (!Array.isArray(points)) return '';
  const names = points.map((point: unknown) => pointName(ctx, point));
  if (roundTrip === true && names.length > 0) names.push(names[0]);
  return clip(names.filter((name) => name !== '').join(' → '));
}

/** The trip's places a tour's points stand for. */
function linkedPlaceIds(ctx: PreviewContext, points: unknown): number[] {
  if (!Array.isArray(points)) return [];
  const ids = points.map((point: unknown) => id(recordOf(point), 'linked_place_id'));
  return [...new Set(ids.filter((placeId): placeId is number => placeId !== null && ctx.card.places.has(placeId)))];
}

/** A hike's limit as its SAC grade, T1 to T6. */
function grade(value: unknown): string {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 6 ? `T${value}` : '';
}

/** Minutes as hours and minutes, "5:30 h". */
function hours(value: unknown): string {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return '';
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')} h`;
}

/** The day a hike is put on, with the start of its visit when one is given; nothing for a day the trip lacks. */
function onDay(ctx: PreviewContext, dayId: number | null, start: unknown): string {
  if (dayId === null || !ctx.card.days.some((day) => day.id === dayId)) return '';
  const at = typeof start === 'string' && /^\d{2}:\d{2}$/.test(start) ? `, ${start}` : '';
  return `${dayLabel(ctx, dayId)}${at}`;
}

/** The first name a GPX text gives, a track's or the file's own. */
function gpxName(gpx: unknown): string {
  if (typeof gpx !== 'string') return '';
  const open = gpx.indexOf('<name>');
  const close = open < 0 ? -1 : gpx.indexOf('</name>', open);
  return close < 0 ? '' : text(gpx.slice(open + '<name>'.length, close));
}

export const TOUR_DESCRIBERS = {
  create_hike: (ctx, args) => {
    const day = onDay(ctx, id(args, 'day_id'), args.start_time);
    const rows = new Rows()
      .add('route', routeOf(ctx, args.waypoints, args.round_trip))
      .add('day', day)
      .add('difficulty', grade(args.max_hiking_difficulty ?? TOURS_MAX_HIKING_DIFFICULTY))
      .add('time', hours(args.planned_duration_minutes))
      .add('description', text(args.description));
    return { subject: text(args.name), rows, dayId: day ? id(args, 'day_id') : null, placeIds: [] };
  },
  create_city_walk: (ctx, args) => {
    const rows = new Rows().add('route', routeOf(ctx, args.stations, false)).add('description', text(args.description));
    return { subject: text(args.name), rows, dayId: null, placeIds: linkedPlaceIds(ctx, args.stations) };
  },
  update_tour: (ctx, args) => {
    const placeId = id(args, 'placeId');
    const current = placeId === null ? undefined : ctx.card.places.get(placeId);
    const rows = new Rows();
    if (args.name !== undefined) rows.change('name', current?.name ?? null, text(args.name));
    if (args.description !== undefined)
      rows.change('description', current?.description ?? null, text(args.description));
    rows
      .add('route', routeOf(ctx, args.waypoints, false))
      .add('difficulty', grade(args.max_hiking_difficulty))
      .add('time', hours(args.planned_duration_minutes));
    return {
      subject: current?.name ?? text(args.name),
      rows,
      dayId: null,
      placeIds: placeId === null ? [] : [placeId],
    };
  },
  // A tour of another trip copied in; its own name stays unless the copy is given one.
  take_over_tour: (_ctx, args) => ({ subject: text(args.name), rows: new Rows(), dayId: null, placeIds: [] }),
  import_tour_gpx: (_ctx, args) => {
    const rows = new Rows().add('type', text(args.tour_type));
    return { subject: text(args.file_name) || gpxName(args.gpx) || 'GPX', rows, dayId: null, placeIds: [] };
  },
} satisfies Readonly<Record<string, (ctx: PreviewContext, args: ToolArgs) => Described>>;
