import { IMPORT_BOOKING_TOOL } from '../../assistant-tools.constants';
import type { Described, PreviewContext, ToolArgs } from '../card-types';
import { argId, recordOf, type Row } from '../card-values';
import {
  clip,
  dayLabel,
  formatDate,
  formatDateTime,
  memberNames,
  money,
  placeName,
  Rows,
  text,
} from '../preview-format';
import { rowsOf } from '../undo-snapshot';
import { bookingRowOf, stayRowOf } from './booking-trip';
import type { AssistantChangeRow } from '@trek/shared';

/**
 * The words of every booking change: the rows a receipt, a share text or a
 * thread stored before the cards still reads. The card draws the rest. The
 * curated writes leave the booking reference out, as the card does; a new
 * booking (`create_reservation`) and a booking read from a file keep the rows
 * they always had, the reference among them.
 */

type Describer = (ctx: PreviewContext, args: ToolArgs) => Described;

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** A date and time as the card writes it; a bare clock as it came. */
function when(ctx: PreviewContext, value: unknown): string {
  if (typeof value !== 'string') return '';
  return DATE_TIME.test(value) ? formatDateTime(ctx, value) : text(value);
}

/** A time read from a file: a date and time, or a bare date, in the user's words; anything else as it came. */
function fileWhen(ctx: PreviewContext, value: unknown): string {
  if (typeof value !== 'string') return '';
  return DATE_TIME.test(value) ? formatDateTime(ctx, value) : text(formatDate(ctx, value));
}

/** The trip day a booking from a file falls on, by the date it starts. */
function dayOn(ctx: PreviewContext, value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const date = value.slice(0, 10);
  return ctx.card.days.find((day) => day.date === date)?.id ?? null;
}

/** "Frankfurt (FRA) → New York (JFK)" from endpoints, empty without both ends. */
function routeText(endpoints: unknown): string {
  const stops = rowsOf(endpoints);
  const end = (role: string) => {
    const found = stops.find((ep) => ep.role === role);
    const name = text(found?.name);
    const code = text(found?.code);
    if (!name) return code;
    return code && code !== name ? `${name} (${code})` : name;
  };
  const from = end('from');
  const to = end('to');
  return from && to ? clip(`${from} → ${to}`) : '';
}

/** A stay's nights in words: the place, check-in day to check-out day. */
function stayText(ctx: PreviewContext, placeId: number | null, start: number | null, end: number | null): string {
  if (start === null || end === null) return '';
  const place = placeName(ctx, placeId);
  const range = `${dayLabel(ctx, start)} → ${dayLabel(ctx, end)}`;
  return place ? `${place}, ${range}` : range;
}

function price(ctx: PreviewContext, amount: unknown, currency: unknown): string {
  if (typeof amount !== 'number' || amount <= 0) return '';
  return money(ctx, amount, typeof currency === 'string' ? currency : ctx.card.currency);
}

/** A status change, under the plain field name the generic card uses. */
function statusRow(rows: Rows, before: unknown, after: unknown): void {
  if (after === undefined) return;
  const row: AssistantChangeRow = {
    op: 'change',
    labelKey: 'field',
    field: 'status',
    before: text(before) || null,
    after: text(after),
  };
  rows.rows.push(row);
}

/** The changes an update makes to a booking, each against what the trip holds now. */
function bookingChangeRows(ctx: PreviewContext, current: Row, args: ToolArgs): Rows {
  const rows = new Rows();
  if (args.title !== undefined) rows.change('name', text(current.title), text(args.title));
  if (args.type !== undefined) rows.change('type', text(current.type), text(args.type));
  statusRow(rows, current.status, args.status);
  if (args.start_day_id !== undefined) {
    rows.change('day', dayLabel(ctx, argId(current, 'day_id')), dayLabel(ctx, argId(args, 'start_day_id')));
  }
  if (args.reservation_time !== undefined) {
    rows.change('time', when(ctx, current.reservation_time), when(ctx, args.reservation_time));
  }
  if (args.reservation_end_time !== undefined) {
    rows.change('endTime', when(ctx, current.reservation_end_time), when(ctx, args.reservation_end_time));
  }
  if (args.endpoints !== undefined) rows.change('route', routeText(current.endpoints), routeText(args.endpoints));
  if (args.location !== undefined) rows.change('location', text(current.location), text(args.location));
  if (args.notes !== undefined) rows.change('notes', text(current.notes), text(args.notes));
  return rows;
}

/**
 * A booking read from an attached file (a BookingImportPreviewItem): what it
 * is, where it goes, when, and the reference the provider gave it.
 */
function describeImport(ctx: PreviewContext, args: ToolArgs): Described {
  const stay = recordOf(args._accommodation);
  const venue = recordOf(args._venue);
  const meta = recordOf(args.metadata);
  const amount = typeof meta.price === 'number' ? meta.price : Number(meta.price);
  const dayId = dayOn(ctx, args.reservation_time ?? stay.check_in);
  const rows = new Rows()
    .add('type', text(args.type))
    .add('route', routeText(args.endpoints))
    .add('day', dayLabel(ctx, dayId))
    .add('time', fileWhen(ctx, args.reservation_time))
    .add('endTime', fileWhen(ctx, args.reservation_end_time))
    .add('checkIn', fileWhen(ctx, stay.check_in))
    .add('checkOut', fileWhen(ctx, stay.check_out))
    .add('location', text(args.location ?? venue.name))
    .add('address', text(venue.address))
    .add('confirmation', text(args.confirmation_number ?? stay.confirmation))
    .add('price', price(ctx, Number.isFinite(amount) ? amount : null, meta.priceCurrency));
  return { subject: text(args.title), rows, dayId, placeIds: [] };
}

function updateBooking(tool: string): Describer {
  return (ctx, args) => {
    const current = recordOf(bookingRowOf(ctx.card, argId(args, 'reservationId')));
    return {
      subject: text(current.title) || text(args.title),
      rows: bookingChangeRows(ctx, current, args),
      dayId: argId(current, 'day_id'),
      placeIds: [],
      tool,
    };
  };
}

export const BOOKING_DESCRIBERS: Readonly<Record<string, Describer>> = {
  create_reservation: (ctx, args) => {
    const placeId = argId(args, 'place_id');
    const startDay = argId(args, 'start_day_id');
    const rows = new Rows()
      .add('type', text(args.type))
      .add('day', dayLabel(ctx, argId(args, 'day_id')))
      .add('time', when(ctx, args.reservation_time))
      .add('endTime', when(ctx, args.reservation_end_time))
      .add('stay', placeId ? stayText(ctx, placeId, startDay, argId(args, 'end_day_id')) : '')
      .add('checkIn', text(args.check_in))
      .add('checkOut', text(args.check_out))
      .add('location', text(args.location))
      .add('link', text(args.url))
      .add('confirmation', text(args.confirmation_number))
      .add('price', typeof args.price === 'number' ? money(ctx, args.price, ctx.card.currency) : '')
      .add('notes', text(args.notes));
    const dayId = argId(args, 'day_id') ?? startDay;
    return { subject: text(args.title), rows, dayId, placeIds: placeId ? [placeId] : [] };
  },
  [IMPORT_BOOKING_TOOL]: describeImport,
  create_transport: (ctx, args) => {
    const dayId = argId(args, 'start_day_id');
    const rows = new Rows()
      .add('type', text(args.type))
      .add('route', routeText(args.endpoints))
      .add('day', dayLabel(ctx, dayId))
      .add('time', when(ctx, args.reservation_time))
      .add('endTime', when(ctx, args.reservation_end_time))
      .add('price', price(ctx, args.price, null))
      .add('notes', text(args.notes));
    return { subject: text(args.title), rows, dayId, placeIds: [], tool: 'create_transport' };
  },
  update_reservation: updateBooking('update_reservation'),
  update_transport: updateBooking('update_transport'),
  set_reservation_travelers: (ctx, args) => {
    const current = recordOf(bookingRowOf(ctx.card, argId(args, 'reservationId')));
    const before = rowsOf(current.travelers).map((traveler) => traveler.user_id);
    const rows = new Rows().change('members', memberNames(ctx, before), memberNames(ctx, args.user_ids));
    return {
      subject: text(current.title),
      rows,
      dayId: argId(current, 'day_id'),
      placeIds: [],
      tool: 'set_reservation_travelers',
    };
  },
  link_hotel_accommodation: (ctx, args) => {
    const current = recordOf(bookingRowOf(ctx.card, argId(args, 'reservationId')));
    const placeId = argId(args, 'place_id');
    const start = argId(args, 'start_day_id');
    const rows = new Rows()
      .add('stay', stayText(ctx, placeId, start, argId(args, 'end_day_id')))
      .add('checkIn', text(args.check_in))
      .add('checkOut', text(args.check_out));
    return {
      subject: text(current.title),
      rows,
      dayId: start,
      placeIds: placeId ? [placeId] : [],
      tool: 'link_hotel_accommodation',
    };
  },
  create_accommodation: (ctx, args) => {
    const placeId = argId(args, 'place_id');
    const start = argId(args, 'start_day_id');
    const rows = new Rows()
      .add('stay', stayText(ctx, null, start, argId(args, 'end_day_id')))
      .add('checkIn', text(args.check_in))
      .add('checkOut', text(args.check_out))
      .add('notes', text(args.notes));
    return {
      subject: placeName(ctx, placeId),
      rows,
      dayId: start,
      placeIds: placeId ? [placeId] : [],
      tool: 'create_accommodation',
    };
  },
  create_place_accommodation: (ctx, args) => {
    const start = argId(args, 'start_day_id');
    const rows = new Rows()
      .add('address', text(args.address))
      .add('stay', stayText(ctx, null, start, argId(args, 'end_day_id')))
      .add('checkIn', text(args.check_in))
      .add('checkOut', text(args.check_out))
      .add('price', price(ctx, args.price, args.currency))
      .add('notes', text(args.accommodation_notes));
    return { subject: text(args.name), rows, dayId: start, placeIds: [] };
  },
  update_accommodation: (ctx, args) => {
    const current = recordOf(stayRowOf(ctx.card, argId(args, 'accommodationId')));
    const placeId = argId(args, 'place_id') ?? argId(current, 'place_id');
    const rows = new Rows();
    if (args.place_id !== undefined) {
      rows.change('stay', placeName(ctx, argId(current, 'place_id')), placeName(ctx, argId(args, 'place_id')));
    }
    if (args.start_day_id !== undefined || args.end_day_id !== undefined) {
      const before = stayText(ctx, null, argId(current, 'start_day_id'), argId(current, 'end_day_id'));
      const start = argId(args, 'start_day_id') ?? argId(current, 'start_day_id');
      rows.change('day', before, stayText(ctx, null, start, argId(args, 'end_day_id') ?? argId(current, 'end_day_id')));
    }
    if (args.check_in !== undefined) rows.change('checkIn', text(current.check_in), text(args.check_in));
    if (args.check_out !== undefined) rows.change('checkOut', text(current.check_out), text(args.check_out));
    if (args.notes !== undefined) rows.change('notes', text(current.notes), text(args.notes));
    return {
      subject: text(current.place_name) || placeName(ctx, placeId),
      rows,
      dayId: argId(args, 'start_day_id') ?? argId(current, 'start_day_id'),
      placeIds: placeId ? [placeId] : [],
    };
  },
};
