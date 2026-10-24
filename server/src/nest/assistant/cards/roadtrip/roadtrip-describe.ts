import type { Described, PreviewContext, ToolArgs } from '../card-types';
import { argId, recordOf } from '../card-values';
import { clip, dayLabel, placeName, Rows, text } from '../preview-format';
import { itineraryOf } from './roadtrip-reads';
import type { DayVias } from './roadtrip-route';
import { dayEndOf, settingChanges, type SavedSettings } from './roadtrip-rules';

/**
 * The words of the road trip's change cards: the day a via change bends
 * (and the stop its via follows), how many vias a chain lays or pins again,
 * the settings a change sets, where a day ends, the stops a Google Maps
 * route brings and the connection a transit journey adds. The cards draw
 * the rest; these rows are what the share text and the facts line read.
 */

type Args = ToolArgs;

/** The first letter of a text is one of a script written right to left. */
const STARTS_RIGHT_TO_LEFT = /^[^\p{L}]*[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}]/u;

/**
 * `from` to `to` as one text, the arrow pointing the way the names read: a
 * line takes its direction from its first letter, so an Arabic or Hebrew
 * name first reads right to left and its arrow points left.
 */
export function routeText(names: readonly string[]): string {
  const arrow = STARTS_RIGHT_TO_LEFT.test(names[0] ?? '') ? ' ← ' : ' → ';
  return names.join(arrow);
}

function count(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

/** "47.12345, 11.12345". */
function coordinates(lat: unknown, lng: unknown): string {
  return typeof lat === 'number' && typeof lng === 'number' ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '';
}

/** The stop of the day at `index`, the one a via after it follows. */
function stopAt(ctx: PreviewContext, dayId: number | null, index: unknown): string {
  if (dayId === null || typeof index !== 'number') return '';
  return placeName(ctx, ctx.card.days.find((day) => day.id === dayId)?.placeIds[index] ?? null);
}

function dayRows(ctx: PreviewContext, dayId: number | null): Rows {
  return new Rows().add('day', dayLabel(ctx, dayId));
}

function viaChange(ctx: PreviewContext, args: Args, rows: Rows, subject: string): Described {
  const dayId = argId(args, 'dayId');
  return { subject: subject || dayLabel(ctx, dayId), rows, dayId, placeIds: [] };
}

export function describeAddVia(ctx: PreviewContext, args: Args): Described {
  const dayId = argId(args, 'dayId');
  const after = stopAt(ctx, dayId, args.after_order_index);
  const rows = dayRows(ctx, dayId).add('position', after).add('coordinates', coordinates(args.lat, args.lng));
  return viaChange(ctx, args, rows, after);
}

export function describeAddVias(ctx: PreviewContext, args: Args): Described {
  const dayId = argId(args, 'dayId');
  const trackId = argId(recordOf(args.track), 'place_id');
  const rows = dayRows(ctx, dayId)
    .add('quantity', String(count(args.vias)))
    .add('route', trackId === null ? '' : placeName(ctx, trackId));
  return viaChange(ctx, args, rows, '');
}

export function describeMoveVia(ctx: PreviewContext, args: Args, loaded: DayVias | null): Described {
  const dayId = argId(args, 'dayId');
  const now = loaded?.vias.find((via) => via.id === argId(args, 'viaId'));
  const rows = dayRows(ctx, dayId).change(
    'coordinates',
    now ? coordinates(now.lat, now.lng) : null,
    coordinates(args.lat, args.lng),
  );
  if (typeof args.after_order_index === 'number' && args.after_order_index !== now?.after) {
    rows.change('position', now ? stopAt(ctx, dayId, now.after) : null, stopAt(ctx, dayId, args.after_order_index));
  }
  return viaChange(ctx, args, rows, '');
}

export function describeRemoveVia(ctx: PreviewContext, args: Args, loaded: DayVias | null): Described {
  const dayId = argId(args, 'dayId');
  const now = loaded?.vias.find((via) => via.id === argId(args, 'viaId'));
  const rows = dayRows(ctx, dayId);
  if (now) rows.add('position', stopAt(ctx, dayId, now.after)).add('coordinates', coordinates(now.lat, now.lng));
  return viaChange(ctx, args, rows, '');
}

export function describeRepinVias(ctx: PreviewContext, args: Args): Described {
  const dayId = argId(args, 'dayId');
  const rows = dayRows(ctx, dayId).add('quantity', String(count(args.vias) + count(args.remove)));
  return viaChange(ctx, args, rows, '');
}

/** A setting's value in a row: a switch as a tick or a cross, a cleared value as a cross. */
function settingText(value: string | number | boolean | null): string {
  if (value === null || value === '') return text(false);
  return text(value);
}

export function describeSettings(ctx: PreviewContext, args: Args, loaded: SavedSettings | null): Described {
  const rows = new Rows();
  for (const change of settingChanges(args, loaded)) {
    rows.rows.push({
      op: 'change',
      labelKey: 'field',
      field: change.key,
      before: loaded ? settingText(change.before) : null,
      after: settingText(change.after),
    });
  }
  return { subject: clip(ctx.card.title), rows, dayId: null, placeIds: [], tool: 'update_roadtrip_settings' };
}

export function describeDayEnd(ctx: PreviewContext, args: Args): Described {
  const dayEnd = dayEndOf(ctx, args);
  const dayId = dayEnd?.dayId ?? null;
  // Where the day ends is the card's to say, in its own words; the row names the day.
  const rows = new Rows().add('day', dayId === null ? (dayEnd ? `#${dayEnd.dayNumber}` : '') : dayLabel(ctx, dayId));
  return { subject: dayEnd?.from ?? dayLabel(ctx, dayId), rows, dayId, placeIds: [] };
}

export function describeImportRoute(ctx: PreviewContext, args: Args): Described {
  const dayId = argId(args, 'dayId');
  const names = Array.isArray(args.stops)
    ? args.stops.map((stop: unknown) => text(recordOf(stop).name)).filter((name) => name !== '')
    : [];
  const rows = dayRows(ctx, dayId)
    .add('quantity', String(names.length))
    .add('route', clip(routeText(names)));
  const ends = names.length > 0 ? routeText([names[0] ?? '', names[names.length - 1] ?? '']) : '';
  return { subject: ends, rows, dayId, placeIds: [] };
}

export function describeTransit(ctx: PreviewContext, args: Args): Described {
  const dayId = argId(args, 'dayId');
  const from = text(recordOf(args.from).name);
  const to = text(recordOf(args.to).name);
  const itinerary = itineraryOf(args.itinerary);
  const rows = dayRows(ctx, dayId)
    .add('time', itinerary?.start ?? '')
    .add('endTime', itinerary?.end ?? '')
    .add('route', from && to ? routeText([from, to]) : '');
  return { subject: from && to ? routeText([from, to]) : from || to, rows, dayId, placeIds: [] };
}
