import { FileText, Hotel, ParkingSquare, Ticket, Users, Utensils, type LucideIcon } from 'lucide-react';

import type { Accommodation, Day, Place, Reservation } from '../../types';
import { parseReservationMetadata } from '../../utils/flightLegs';
import { resolveDayId } from '../../utils/formatters';
import type { BookingReviewDraft } from './parsedItemToDraft';

/**
 * The booking form both shells edit, the desktop ReservationModal and the phone's
 * booking sheet: how a booking fills it, the date rules, the place and hotel picks
 * and the request body, including the stay a hotel booking creates.
 */

export const RESERVATION_TYPE_OPTIONS: { value: string; labelKey: string; Icon: LucideIcon }[] = [
  { value: 'hotel', labelKey: 'reservations.type.hotel', Icon: Hotel },
  { value: 'restaurant', labelKey: 'reservations.type.restaurant', Icon: Utensils },
  { value: 'event', labelKey: 'reservations.type.event', Icon: Ticket },
  { value: 'tour', labelKey: 'reservations.type.tour', Icon: Users },
  { value: 'parking', labelKey: 'reservations.type.parking', Icon: ParkingSquare },
  { value: 'other', labelKey: 'reservations.type.other', Icon: FileText },
];

/** The fields of the form both shells share; the desktop keeps a few more of its own. */
export interface ReservationFields {
  title: string;
  type: string;
  status: string;
  /** The start as the form holds it: a date, or a date and a time joined by T. */
  reservation_time: string;
  /** The end time alone; its date lives in end_date. */
  reservation_end_time: string;
  end_date: string;
  location: string;
  confirmation_number: string;
  notes: string;
  url: string;
  place_id: string | number;
  accommodation_id: string | number;
  meta_check_in_time: string;
  meta_check_out_time: string;
  hotel_place_id: string | number;
  hotel_start_day: string | number;
  hotel_end_day: string | number;
  hotel_address: string;
}

/** The desktop's check-in window, which the phone does not edit. */
export interface CheckInEndField {
  meta_check_in_end_time?: string;
}

/**
 * A stored end splits into the date and the time the form edits apart: a date and
 * time, a date alone, or a bare time.
 */
export function splitEndTime(rawEnd: string): { endDate: string; endTime: string } {
  if (rawEnd.includes('T')) return { endDate: rawEnd.split('T')[0], endTime: rawEnd.split('T')[1]?.slice(0, 5) || '' };
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawEnd)) return { endDate: rawEnd, endTime: '' };
  return { endDate: '', endTime: rawEnd };
}

/**
 * The fields of a saved booking. Its stay, when it has one, gives the hotel's place,
 * days and address. `withCheckInEnd` adds the desktop's check-in window.
 */
export function reservationFieldsFrom(
  res: Reservation,
  accommodations: Accommodation[],
  places: Pick<Place, 'id' | 'address'>[],
  withCheckInEnd: true
): ReservationFields & Required<CheckInEndField>;
export function reservationFieldsFrom(
  res: Reservation,
  accommodations: Accommodation[],
  places: Pick<Place, 'id' | 'address'>[],
  withCheckInEnd: false
): ReservationFields;
export function reservationFieldsFrom(
  res: Reservation,
  accommodations: Accommodation[],
  places: Pick<Place, 'id' | 'address'>[],
  withCheckInEnd: boolean
): ReservationFields & CheckInEndField {
  const meta = parseReservationMetadata(res);
  const { endDate, endTime } = splitEndTime(res.reservation_end_time || '');
  const acc = accommodations.find((a) => a.id == res.accommodation_id);
  return {
    title: res.title || '',
    type: res.type || 'other',
    status: res.status || 'pending',
    reservation_time: res.reservation_time ? res.reservation_time.slice(0, 16) : '',
    reservation_end_time: endTime,
    end_date: endDate,
    location: res.location || '',
    confirmation_number: res.confirmation_number || '',
    notes: res.notes || '',
    url: res.url || '',
    place_id: res.place_id || '',
    accommodation_id: res.accommodation_id || '',
    meta_check_in_time: meta.check_in_time || '',
    ...(withCheckInEnd ? { meta_check_in_end_time: meta.check_in_end_time || '' } : {}),
    meta_check_out_time: meta.check_out_time || '',
    hotel_place_id: acc?.place_id || '',
    hotel_start_day: acc?.start_day_id || '',
    hotel_end_day: acc?.end_day_id || '',
    // The linked place carries the address; reservations saved without a
    // place (or before the accommodation existed) keep it in location.
    hotel_address: places.find((p) => p.id == acc?.place_id)?.address || res.location || '',
  };
}

type PrefillFields = Omit<ReservationFields, 'place_id' | 'accommodation_id' | 'hotel_place_id'>;

/**
 * The fields of a parsed import item under review. It is not linked to a place yet;
 * the stay's days are resolved from the parsed check-in and check-out dates.
 */
export function reservationFieldsFromPrefill(
  pf: BookingReviewDraft,
  days: Day[],
  withCheckInEnd: true
): PrefillFields & Required<CheckInEndField>;
export function reservationFieldsFromPrefill(pf: BookingReviewDraft, days: Day[], withCheckInEnd: false): PrefillFields;
export function reservationFieldsFromPrefill(
  pf: BookingReviewDraft,
  days: Day[],
  withCheckInEnd: boolean
): PrefillFields & CheckInEndField {
  const meta = (pf.metadata && typeof pf.metadata === 'object' ? pf.metadata : {}) as Record<string, string>;
  const { endDate, endTime } = splitEndTime(typeof pf.reservation_end_time === 'string' ? pf.reservation_end_time : '');
  return {
    title: pf.title || '',
    type: pf.type || 'other',
    status: pf.status || 'pending',
    reservation_time: typeof pf.reservation_time === 'string' ? pf.reservation_time.slice(0, 16) : '',
    reservation_end_time: endTime,
    end_date: endDate,
    location: pf.location || '',
    confirmation_number: pf.confirmation_number || '',
    notes: pf.notes || '',
    url: (pf as { url?: string }).url || '',
    meta_check_in_time: meta.check_in_time || '',
    ...(withCheckInEnd ? { meta_check_in_end_time: meta.check_in_end_time || '' } : {}),
    meta_check_out_time: meta.check_out_time || '',
    hotel_start_day: resolveDayId(days, pf._accommodation?.check_in),
    hotel_end_day: resolveDayId(days, pf._accommodation?.check_out),
    hotel_address: pf._venue?.address || '',
  };
}

type DateFields = Pick<ReservationFields, 'type' | 'reservation_time' | 'reservation_end_time' | 'end_date'>;

/**
 * Whether the end comes before the start, which refuses the save. Without a time on
 * either side the booking is all-day, so an end on the start day is fine and only
 * the dates are compared (#2107). Hotels hide the date fields, so they never block.
 */
export function isEndBeforeStart(form: DateFields): boolean {
  if (form.type === 'hotel' || !form.end_date || !form.reservation_time) return false;
  const startDate = form.reservation_time.split('T')[0];
  const startTime = form.reservation_time.split('T')[1] || '';
  const endTime = form.reservation_end_time || '';
  if (!startTime || !endTime) return form.end_date < startDate;
  return `${form.end_date}T${endTime}` <= `${startDate}T${startTime}`;
}

/** The start's date and time as the two pickers show them. */
export function startParts(reservationTime: string): { date: string; time: string } {
  const [date, time] = (reservationTime || '').split('T');
  return { date: date || '', time: time || '' };
}

/** The start with a new date; the time stays, and clearing the date clears the start. */
export function withStartDate(reservationTime: string, date: string | null | undefined): string {
  const { time } = startParts(reservationTime);
  return date ? (time ? `${date}T${time}` : date) : '';
}

/** The start with a new time, on its own date or `fallbackDate` when it has none. */
export function withStartTime(reservationTime: string, time: string, fallbackDate: string): string {
  const date = startParts(reservationTime).date || fallbackDate;
  return time ? `${date}T${time}` : date;
}

/** The trip's first and last dated day, which bound the date pickers (#1662). */
export function tripDateBounds(days: Pick<Day, 'date'>[]): { min: string | undefined; max: string | undefined } {
  const dates = days
    .map((d) => d.date)
    .filter((d): d is string => !!d)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return { min: dates[0], max: dates[dates.length - 1] };
}

/** A booking linked to a stop takes that stop's day while it has no date of its own. */
export function withLinkedStopDay<F extends Pick<ReservationFields, 'reservation_time'>>(prev: F, dayDate: string): F {
  return prev.reservation_time ? prev : { ...prev, reservation_time: dayDate };
}

/** A trip place picked for the booking (#1353) lends it a title and an address it does not have yet. */
export function withLinkedPlace<F extends Pick<ReservationFields, 'place_id' | 'title' | 'location'>>(
  prev: F,
  value: string | number,
  places: Pick<Place, 'id' | 'name' | 'address'>[]
): F {
  const p = places.find((pl) => pl.id === value);
  const next = { ...prev, place_id: value };
  if (value && p) {
    if (!prev.title) next.title = p.name;
    if (!prev.location && p.address) next.location = p.address;
  }
  return next;
}

/**
 * A hotel picked for the stay lends the booking a missing title and shows its address;
 * a typed address stays when the hotel has none.
 */
export function withHotelPlace<F extends Pick<ReservationFields, 'hotel_place_id' | 'title' | 'hotel_address'>>(
  prev: F,
  value: string | number,
  places: Pick<Place, 'id' | 'name' | 'address'>[]
): F {
  const p = places.find((pl) => pl.id === value);
  const next = { ...prev, hotel_place_id: value };
  if (value && p) {
    if (!prev.title) next.title = p.name;
    next.hotel_address = p.address || prev.hotel_address;
  }
  return next;
}

const dayIndex = (days: { id: number }[], id: string | number) => days.findIndex((d) => d.id === id);

/** A new first night; a stay that would end before it is pulled along to it. */
export function withHotelStart<F extends Pick<ReservationFields, 'hotel_start_day' | 'hotel_end_day'>>(
  prev: F,
  value: string | number,
  days: { id: number }[]
): F {
  return {
    ...prev,
    hotel_start_day: value,
    hotel_end_day: dayIndex(days, value) > dayIndex(days, prev.hotel_end_day) ? value : prev.hotel_end_day,
  };
}

/** A new last day; a stay that would start after it is pulled back to it. */
export function withHotelEnd<F extends Pick<ReservationFields, 'hotel_start_day' | 'hotel_end_day'>>(
  prev: F,
  value: string | number,
  days: { id: number }[]
): F {
  return {
    ...prev,
    hotel_start_day: dayIndex(days, value) < dayIndex(days, prev.hotel_start_day) ? value : prev.hotel_start_day,
    hotel_end_day: value,
  };
}

export interface ReservationSaveOptions {
  /** The stop the booking hangs on; the desktop keeps it in its form, the phone beside it. */
  assignmentId: string | number;
  /** Whether a saved booking is edited, which leaves its endpoints alone. */
  isEdit: boolean;
  /** The desktop also saves the end of the check-in window. */
  withCheckInEnd: boolean;
}

export type ReservationSaveData = Record<string, unknown> & { title: string };

/** The request body the form saves as, with the stay a hotel booking with days creates or updates. */
export function reservationSaveData(
  form: ReservationFields & CheckInEndField,
  opts: ReservationSaveOptions
): ReservationSaveData {
  const isHotel = form.type === 'hotel';
  const metadata: Record<string, string> = {};
  if (isHotel) {
    if (form.meta_check_in_time) metadata.check_in_time = form.meta_check_in_time;
    if (opts.withCheckInEnd && form.meta_check_in_end_time) metadata.check_in_end_time = form.meta_check_in_end_time;
    if (form.meta_check_out_time) metadata.check_out_time = form.meta_check_out_time;
  }
  let combinedEndTime = form.reservation_end_time;
  if (form.end_date) {
    combinedEndTime = form.reservation_end_time ? `${form.end_date}T${form.reservation_end_time}` : form.end_date;
  } else if (form.reservation_end_time && form.reservation_time) {
    combinedEndTime = `${form.reservation_time.split('T')[0]}T${form.reservation_end_time}`;
  }
  const saveData: ReservationSaveData = {
    title: form.title,
    type: form.type,
    status: form.status,
    reservation_time: isHotel ? null : form.reservation_time || null,
    reservation_end_time: isHotel ? null : combinedEndTime || null,
    // Hotels show the address field instead of location; persist it on the
    // reservation itself so it survives even without days/place (#1496).
    location: isHotel ? form.hotel_address : form.location,
    confirmation_number: form.confirmation_number,
    notes: form.notes,
    url: form.url,
    assignment_id: isHotel && !form.accommodation_id ? null : opts.assignmentId || null,
    accommodation_id: isHotel ? form.accommodation_id || null : null,
    // Hotels link a place through the accommodation record; every other type links
    // the picked trip place/activity directly on the reservation (#1353).
    place_id: isHotel ? null : form.place_id || null,
    // An empty object, not null: null clears the column outright, and that took the
    // mirrored booking price with it on every edit of a type that fills no metadata
    // of its own (#2233). An object still clears what the form dropped, and lets the
    // server carry the price across.
    metadata,
    // Omitted on an edit: the server replaces the endpoint set whenever the key is
    // present, and this form never edits endpoints, so sending an empty list would
    // drop a transit booking's stations (#2216).
    ...(opts.isEdit ? {} : { endpoints: [] }),
    needs_review: false,
  };
  if (isHotel && (form.hotel_start_day || form.hotel_end_day)) {
    saveData.create_accommodation = {
      place_id: form.hotel_place_id || null,
      // No existing place picked but we have an address/name (e.g. a reviewed
      // import): the save handler geocodes it and creates the place.
      venue:
        !form.hotel_place_id && (form.hotel_address || form.title)
          ? { name: form.title, address: form.hotel_address || null }
          : null,
      // The typed address, so the save handler can write it through to a linked
      // place; an edited address used to be silently dropped (#1496).
      address: form.hotel_address || null,
      // Tolerate a single resolved end of the range (a one-night stay or a date that
      // only matched one trip day) so the accommodation is still created.
      start_day_id: form.hotel_start_day || form.hotel_end_day,
      end_day_id: form.hotel_end_day || form.hotel_start_day,
      check_in: form.meta_check_in_time || null,
      ...(opts.withCheckInEnd ? { check_in_end: form.meta_check_in_end_time || null } : {}),
      check_out: form.meta_check_out_time || null,
      confirmation: form.confirmation_number || null,
    };
  }
  return saveData;
}
