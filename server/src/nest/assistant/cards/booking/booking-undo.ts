import type { PreviewContext, ToolArgs, ToolCards, UndoSnapshot } from '../card-types';
import { argId, clipped, finite, idIn, isLat, isLng, recordOf, type Row } from '../card-values';
import { byId, rowsOf, same, snapshotAssignments, snapshotPlaces, STABLE_FIELDS } from '../undo-snapshot';
import { accommodationIdOf } from './booking-row';
import { stayRowOf } from './booking-trip';
import { categoryIdForKind, type AssistantChangeEffect } from '@trek/shared';

/**
 * The way back from a created booking or stay, and what a held stay does to
 * the day plan. A stay puts its place on its check-in day, so the pending
 * stay shows as a ghost pin and in the day's preview like any new stop; undo
 * removes the booking (a hotel takes its stay along) or the stay (a stay
 * takes its stop along), or the place a stay was created with.
 */

type Undo = NonNullable<ToolCards['undo']>;

/** What still says a booking is the one the change created. */
const BOOKING_FIELDS = [
  'title',
  'type',
  'status',
  'reservation_time',
  'reservation_end_time',
  'day_id',
  'end_day_id',
  'location',
] as const;
/** What still says a stay is the one the change created. */
const STAY_FIELDS = ['place_id', 'start_day_id', 'end_day_id', 'check_in', 'check_in_end', 'check_out'] as const;

function summaryRows(snapshot: UndoSnapshot, key: string): Row[] {
  return rowsOf(recordOf(snapshot.summary)[key]);
}

/** A created booking, still as it was created. */
function bookingUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const created = recordOf(recordOf(result).reservation);
  return same(created, byId(summaryRows(snapshot, 'reservations'), created.id), BOOKING_FIELDS);
}

/** A created stay, still as it was created. */
function stayUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const created = recordOf(recordOf(result).accommodation);
  return same(created, byId(summaryRows(snapshot, 'accommodations'), created.id), STAY_FIELDS);
}

/**
 * A place created with its stay, untouched and used by nothing but that stay:
 * not planned on another day, in no other booking, stay or expense. The stay
 * itself and the booking that links it do not count; they go with the place.
 */
function placeOfStayUnchanged(result: unknown, snapshot: UndoSnapshot): boolean {
  const answer = recordOf(result);
  const created = recordOf(answer.place);
  if (!same(created, byId(snapshotPlaces(snapshot), created.id), STABLE_FIELDS.place)) return false;
  const stayId = recordOf(answer.accommodation).id;
  const ownStop = recordOf(answer.assignment).id;
  const plannedElsewhere = snapshotAssignments(snapshot).some((a) => a.place_id === created.id && a.id !== ownStop);
  const otherBooking = summaryRows(snapshot, 'reservations').some(
    (r) => r.place_id === created.id && accommodationIdOf(r) !== stayId,
  );
  const otherStay = summaryRows(snapshot, 'accommodations').some((a) => a.place_id === created.id && a.id !== stayId);
  const paid = rowsOf(recordOf(recordOf(snapshot.summary).budget).items).some((item) => item.place_id === created.id);
  return !plannedElsewhere && !otherBooking && !otherStay && !paid && stayUnchanged(result, snapshot);
}

function byResultId(key: string, arg: string) {
  return (_args: ToolArgs, result: unknown): ToolArgs | null => {
    const id = idIn(result, key);
    return id ? { [arg]: id } : null;
  };
}

export const BOOKING_UNDO: Readonly<Record<string, Undo>> = {
  create_reservation: {
    tool: 'delete_reservation',
    args: byResultId('reservation', 'reservationId'),
    unchanged: bookingUnchanged,
  },
  create_transport: {
    tool: 'delete_transport',
    args: byResultId('reservation', 'reservationId'),
    unchanged: bookingUnchanged,
  },
  create_accommodation: {
    tool: 'delete_accommodation',
    args: byResultId('accommodation', 'accommodationId'),
    unchanged: stayUnchanged,
  },
  create_place_accommodation: {
    tool: 'delete_place',
    args: byResultId('place', 'placeId'),
    unchanged: placeOfStayUnchanged,
  },
};

/** A change to the day plan, with nothing of what the kind does not name. */
function effect(
  kind: AssistantChangeEffect['kind'],
  dayId: number | null,
  fields: Partial<Omit<AssistantChangeEffect, 'kind' | 'dayId'>>,
): AssistantChangeEffect | null {
  if (dayId === null) return null;
  return { kind, dayId, fromDayId: null, placeId: null, assignmentId: null, place: null, ...fields };
}

type EffectBuilder = (ctx: PreviewContext, args: ToolArgs) => AssistantChangeEffect | null;

export const BOOKING_EFFECTS: Readonly<Record<string, EffectBuilder>> = {
  create_accommodation: (_ctx, args) =>
    effect('add', argId(args, 'start_day_id'), { placeId: argId(args, 'place_id') }),
  create_place_accommodation: (ctx, args) => {
    const lat = finite(args.lat);
    const lng = finite(args.lng);
    const name = clipped(args.name, 200);
    const start = argId(args, 'start_day_id');
    // Without a position there is no pin to show, so no stop is previewed.
    if (!isLat(lat) || !isLng(lng) || name === null) return null;
    const categories = [...ctx.categories].map(([id, label]) => ({ id, name: label }));
    return effect('add', start, { place: { name, lat, lng, categoryId: categoryIdForKind('lodging', categories) } });
  },
  create_reservation: (_ctx, args) => {
    const placeId = argId(args, 'place_id');
    const hotel = args.type === 'hotel' && placeId !== null && argId(args, 'end_day_id') !== null;
    return hotel ? effect('add', argId(args, 'start_day_id'), { placeId }) : null;
  },
  update_accommodation: (ctx, args) => {
    const current = recordOf(stayRowOf(ctx.card, argId(args, 'accommodationId')));
    const from = argId(current, 'start_day_id');
    const to = argId(args, 'start_day_id');
    if (to === null || to === from) return null;
    return effect('move', to, { fromDayId: from, placeId: argId(args, 'place_id') ?? argId(current, 'place_id') });
  },
};
