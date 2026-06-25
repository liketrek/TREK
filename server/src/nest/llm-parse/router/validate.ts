/**
 * Schicht 2 — semantic validation of an extracted flat reservation.
 *
 * Constrained decoding guarantees the JSON is structurally valid, but NOT that the
 * values make sense. This layer catches the failure modes that actually hurt users —
 * a date with no day, a check-out before check-in, a bogus IATA code, a missing
 * booking reference — and returns a human-readable problem list. The router feeds that
 * list back to the model for ONE targeted repair pass; whatever still fails is left for
 * the human (the review-before-save modal, Schicht 3) rather than silently dropped.
 */

import { findByIata } from '../../../services/airportService';
import type { FlatType } from './flat-schemas';

/** A value that contains a full calendar date (YYYY-MM-DD), not just a time. */
function hasFullDate(v: unknown): boolean {
  return typeof v === 'string' && /\d{4}-\d{2}-\d{2}/.test(v);
}

/** The YYYY-MM-DD portion, or null. */
function datePart(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = v.match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

function looksLikeIata(v: unknown): boolean {
  return typeof v === 'string' && /^[A-Za-z]{3}$/.test(v.trim());
}

export interface FlatLike {
  type: FlatType;
  booking_reference?: string;
  vehicle_number?: string;
  from_code?: string;
  to_code?: string;
  from_name?: string;
  to_name?: string;
  departure_time?: string;
  arrival_time?: string;
  checkin_time?: string;
  checkout_time?: string;
  [k: string]: unknown;
}

const TRANSPORT: FlatType[] = ['flight', 'train', 'bus', 'ferry'];

/**
 * Return a list of human-readable problems with a flat reservation, suitable for a
 * repair prompt. An empty list means it passed. `requireReference` adds a check for a
 * missing booking code (bookings almost always carry one — a miss usually means the
 * model skipped it, not that it's absent).
 */
export function validateFlat(flat: FlatLike, requireReference = true): string[] {
  const problems: string[] = [];
  const t = flat.type;

  if (requireReference && !str(flat.booking_reference)) {
    problems.push('the booking/confirmation reference is missing — copy it from the document');
  }

  if (TRANSPORT.includes(t)) {
    if (!str(flat.from_code) && !str(flat.from_name)) problems.push('missing departure location');
    if (!str(flat.to_code) && !str(flat.to_name)) problems.push('missing arrival location');
    if (!hasFullDate(flat.departure_time)) {
      problems.push("departure_time must be a full date-time (YYYY-MM-DDTHH:MM:00) using THIS segment's date");
    }
    if (t === 'flight') {
      if (!str(flat.vehicle_number)) problems.push('missing flight number');
      for (const [label, code] of [['departure', flat.from_code], ['arrival', flat.to_code]] as const) {
        if (str(code) && !looksLikeIata(code)) problems.push(`${label} airport code "${String(code)}" is not a 3-letter IATA code`);
        else if (looksLikeIata(code) && !findByIata(String(code).toUpperCase())) {
          problems.push(`${label} airport code "${String(code).toUpperCase()}" is not a known IATA code — re-check it`);
        }
      }
    }
    if (hasFullDate(flat.departure_time) && hasFullDate(flat.arrival_time)) {
      if (new Date(flat.arrival_time as string) < new Date(flat.departure_time as string)) {
        problems.push('arrival_time is before departure_time — re-read the times');
      }
    }
  }

  if (t === 'hotel') {
    if (!hasFullDate(flat.checkin_time)) problems.push('checkin_time must be a full date');
    if (!hasFullDate(flat.checkout_time)) problems.push('checkout_time must be a full date');
    const ci = datePart(flat.checkin_time);
    const co = datePart(flat.checkout_time);
    if (ci && co && co < ci) problems.push('check-out date is before check-in — re-read both dates');
  }

  if (t === 'car') {
    if (!hasFullDate(flat.departure_time)) problems.push('the pickup date-time (departure_time) must be a full date');
    if (!hasFullDate(flat.arrival_time)) problems.push('the return date-time (arrival_time) must be a full date');
  }

  return problems;
}

function str(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}
