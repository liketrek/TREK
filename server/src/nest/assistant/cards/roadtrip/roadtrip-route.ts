import type { CardReader, PreviewContext, ToolArgs } from '../card-types';
import { argId, clipped, finite, isLat, isLng, recordOf, type Row } from '../card-values';
import {
  DAY_ROUTE_CARD_STOPS_MAX,
  DAY_ROUTE_CARD_VIAS_MAX,
  type DayRouteCard,
  type DayRouteCardVia,
} from '@trek/shared';

/**
 * The card of every change that bends a day's drive: the day's stops joined
 * by straight lines, and the via points the change adds, moves, takes out or
 * pins to another stop. What a held change does to a via the day has already
 * comes from `list_route_vias`, read once per turn while the change is
 * described; without it a move or a removal shows what it can.
 */

/** A via of the day as it is stored now. */
interface ViaNow {
  id: number;
  lat: number;
  lng: number;
  after: number;
}

/** What describing a via change reads first: the day's vias as they are. */
export interface DayVias {
  vias: ViaNow[];
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.map(recordOf) : [];
}

function round5(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

function afterOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 500 ? value : null;
}

function pointOf(row: Row): { lat: number; lng: number } | null {
  const lat = finite(row.lat);
  const lng = finite(row.lng);
  return isLat(lat) && isLng(lng) ? { lat: round5(lat), lng: round5(lng) } : null;
}

/** The day's vias as list_route_vias answers them; null when the read failed or names no day. */
export async function loadDayVias(args: ToolArgs, read: CardReader): Promise<DayVias | null> {
  const dayId = argId(args, 'dayId');
  if (dayId === null) return null;
  const answer = recordOf(await read('list_route_vias', { dayId }));
  if (!Array.isArray(answer.vias)) return null;
  return {
    vias: rows(answer.vias).flatMap((via) => {
      const id = argId(via, 'id');
      const point = pointOf(via);
      const after = afterOf(via.after_order_index);
      return id !== null && point && after !== null ? [{ id, ...point, after }] : [];
    }),
  };
}

/** The day a change is about, with its stops in order as the trip card lists them. */
function dayOf(ctx: PreviewContext, dayId: number | null) {
  const day = dayId === null ? undefined : ctx.card.days.find((d) => d.id === dayId);
  const stops: DayRouteCard['stops'] = [];
  for (const placeId of day?.placeIds ?? []) {
    const place = ctx.card.places.get(placeId);
    const name = clipped(place?.name, 80);
    const lat = finite(place?.lat);
    const lng = finite(place?.lng);
    if (!name || !isLat(lat) || !isLng(lng) || stops.length >= DAY_ROUTE_CARD_STOPS_MAX) continue;
    stops.push({ placeId, name, lat: round5(lat), lng: round5(lng), added: false });
  }
  return { day, stops };
}

/** The name of the stop at `index` of the day, the one a via `after` it follows. */
function stopName(ctx: PreviewContext, dayId: number | null, index: number | null): string | null {
  if (dayId === null || index === null) return null;
  const placeId = ctx.card.days.find((d) => d.id === dayId)?.placeIds[index];
  return placeId === undefined ? null : clipped(ctx.card.places.get(placeId)?.name, 80);
}

/** The card for one day with these vias, or null when it would draw nothing. */
function routeCard(
  ctx: PreviewContext,
  dayId: number | null,
  vias: DayRouteCardVia[],
  extra: Partial<Pick<DayRouteCard, 'afterName' | 'track' | 'stops'>> = {},
): DayRouteCard | null {
  const { day, stops } = dayOf(ctx, dayId);
  const drawn = [...stops, ...(extra.stops ?? [])].slice(0, DAY_ROUTE_CARD_STOPS_MAX);
  if (drawn.length === 0 && vias.length === 0) return null;
  return {
    kind: 'dayRoute',
    dayId: day ? day.id : dayId,
    dayNumber: day ? Math.min(999, Math.max(1, day.number)) : null,
    stops: drawn,
    vias: vias.slice(0, DAY_ROUTE_CARD_VIAS_MAX),
    afterName: extra.afterName ?? null,
    track: extra.track ?? null,
    unresolved: [],
  };
}

function viaFrom(row: Row, state: DayRouteCardVia['state']): DayRouteCardVia | null {
  const point = pointOf(row);
  const after = afterOf(row.after_order_index);
  return point && after !== null ? { ...point, after, state, from: null } : null;
}

/** add_route_via: one via after the stop it names. */
export function addViaCard(ctx: PreviewContext, args: ToolArgs): DayRouteCard | null {
  const via = viaFrom(args, 'added');
  if (!via) return null;
  const dayId = argId(args, 'dayId');
  return routeCard(ctx, dayId, [via], { afterName: stopName(ctx, dayId, via.after) });
}

/** add_route_vias: a chain of vias; the vias on the legs it clears first go, the track it follows is named. */
export function addViasCard(ctx: PreviewContext, args: ToolArgs, loaded: DayVias | null): DayRouteCard | null {
  const dayId = argId(args, 'dayId');
  const added = rows(args.vias).flatMap((row) => {
    const via = viaFrom(row, 'added');
    return via ? [via] : [];
  });
  const cleared = new Set(Array.isArray(args.replace_legs) ? args.replace_legs : []);
  const removed = (loaded?.vias ?? [])
    .filter((via) => cleared.has(via.after))
    .map((via): DayRouteCardVia => ({ lat: via.lat, lng: via.lng, after: via.after, state: 'removed', from: null }));
  const afters = new Set(added.map((via) => via.after));
  const [onlyAfter] = afters.size === 1 ? [...afters] : [null];
  const trackId = argId(recordOf(args.track), 'place_id');
  return routeCard(ctx, dayId, [...added, ...removed], {
    afterName: stopName(ctx, dayId, onlyAfter),
    track: trackId === null ? null : clipped(ctx.card.places.get(trackId)?.name, 80),
  });
}

/** update_route_via: the via at its new spot, from where it stands now. */
export function moveViaCard(ctx: PreviewContext, args: ToolArgs, loaded: DayVias | null): DayRouteCard | null {
  const point = pointOf(args);
  if (!point) return null;
  const dayId = argId(args, 'dayId');
  const now = loaded?.vias.find((via) => via.id === argId(args, 'viaId'));
  const after = afterOf(args.after_order_index) ?? now?.after ?? 0;
  const via: DayRouteCardVia = { ...point, after, state: 'moved', from: now ? [now.lat, now.lng] : null };
  return routeCard(ctx, dayId, [via], { afterName: stopName(ctx, dayId, after) });
}

/** remove_route_via: the via that goes; none to draw when the day has no such via. */
export function removeViaCard(ctx: PreviewContext, args: ToolArgs, loaded: DayVias | null): DayRouteCard | null {
  const now = loaded?.vias.find((via) => via.id === argId(args, 'viaId'));
  if (!now) return null;
  const via: DayRouteCardVia = { lat: now.lat, lng: now.lng, after: now.after, state: 'removed', from: null };
  return routeCard(ctx, argId(args, 'dayId'), [via]);
}

/** reanchor_route_vias: each via pinned to the stop it now follows, and the vias whose leg is gone. */
export function repinViasCard(ctx: PreviewContext, args: ToolArgs, loaded: DayVias | null): DayRouteCard | null {
  const byId = new Map((loaded?.vias ?? []).map((via) => [via.id, via]));
  const repinned = rows(args.vias).flatMap((row): DayRouteCardVia[] => {
    const now = byId.get(argId(row, 'id') ?? 0);
    const after = afterOf(row.after_order_index);
    return now && after !== null ? [{ lat: now.lat, lng: now.lng, after, state: 'repinned', from: null }] : [];
  });
  const removed = (Array.isArray(args.remove) ? args.remove : []).flatMap((id: unknown): DayRouteCardVia[] => {
    const now = typeof id === 'number' ? byId.get(id) : undefined;
    return now ? [{ lat: now.lat, lng: now.lng, after: now.after, state: 'removed', from: null }] : [];
  });
  if (repinned.length + removed.length === 0) return null;
  return routeCard(ctx, argId(args, 'dayId'), [...repinned, ...removed]);
}

/** import_google_maps_route: the day's stops with the route's stops appended. */
export function importRouteCard(ctx: PreviewContext, args: ToolArgs): DayRouteCard | null {
  const added = rows(args.stops).flatMap((stop): DayRouteCard['stops'] => {
    const point = pointOf(stop);
    const name = typeof stop.name === 'string' ? stop.name.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
    return point && name ? [{ placeId: null, name, ...point, added: true }] : [];
  });
  if (added.length === 0) return null;
  return routeCard(ctx, argId(args, 'dayId'), [], { stops: added });
}
