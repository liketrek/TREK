import type { Assignment, Reservation } from '../../types';
import { splitReservationDateTime } from '../../utils/formatters';

/**
 * The clock arithmetic behind the plan hints: times of day as minutes since
 * midnight, and the stretch of the day a stop or a booking takes. A value
 * that is not a plain HH:MM reads as no time at all, so a rule that needs it
 * stays quiet rather than guessing.
 */

const MINUTES_PER_DAY = 24 * 60;

/** A stretch of one day in minutes since midnight; `end` is null when only the start is known. */
export interface DaySpan {
  start: number;
  end: number | null;
}

function minutesOf(match: RegExpExecArray | null): number | null {
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

/** "09:30" as 570; anything that is not HH:MM (or H:MM) is null. */
export function clockMinutes(value: string | null | undefined): number | null {
  return minutesOf(/^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? ''));
}

/** The time a day note starts with, if it starts with one: the note is free text. */
export function noteMinutes(value: string | null | undefined): number | null {
  return minutesOf(/^(\d{1,2}):(\d{2})(?!\d)/.exec(value?.trim() ?? ''));
}

/** 570 as "09:30". */
export function clockText(minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/**
 * The weekday of a calendar date, Monday first like stored opening hours.
 * Read in UTC, so the zone of the device cannot move the date a day.
 */
export function weekdayMondayFirst(iso: string | null | undefined): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : (date.getUTCDay() + 6) % 7;
}

/**
 * When a stop takes place: its own time on this day before the place's, an
 * end before a duration. An end at or before the start says nothing, and a
 * duration never runs past midnight.
 */
export function stopSpan(assignment: Assignment): DaySpan | null {
  const start = clockMinutes(assignment.assignment_time ?? assignment.place.place_time);
  if (start === null) return null;
  const end = clockMinutes(assignment.assignment_end_time ?? assignment.place.end_time);
  if (end !== null && end > start) return { start, end };
  const duration = assignment.place.duration_minutes ?? 0;
  return { start, end: duration > 0 ? Math.min(start + duration, MINUTES_PER_DAY) : null };
}

/**
 * When a booking takes place on its day. A time written for another date than
 * the day's says nothing about it, and a booking that ends on a later day runs
 * to midnight.
 */
export function bookingSpan(reservation: Reservation, dayDate: string | null | undefined): DaySpan | null {
  const begins = splitReservationDateTime(reservation.reservation_time);
  if (begins.date && dayDate && begins.date !== dayDate) return null;
  const start = clockMinutes(begins.time);
  if (start === null) return null;
  if (reservation.end_day_id != null && reservation.end_day_id !== reservation.day_id) {
    return { start, end: MINUTES_PER_DAY };
  }
  const end = clockMinutes(splitReservationDateTime(reservation.reservation_end_time).time);
  return { start, end: end !== null && end > start ? end : null };
}

/**
 * Whether two stretches share time. Two stretches overlap when each starts
 * before the other ends; a bare start overlaps only when it lies truly inside
 * a stretch, and two bare starts never do.
 */
export function spansOverlap(a: DaySpan, b: DaySpan): boolean {
  if (a.end !== null && b.end !== null) return a.start < b.end && b.start < a.end;
  if (a.end !== null) return a.start < b.start && b.start < a.end;
  if (b.end !== null) return b.start < a.start && a.start < b.end;
  return false;
}

/** Whether a stretch, or a bare start, falls into the open window from `from` to `to`. */
export function spanTouches(span: DaySpan, from: number, to: number): boolean {
  return span.start < to && (span.end ?? span.start) > from;
}

/** A span as it goes into a hint's id, so a hint about other times is a new hint. */
export function spanKey(span: DaySpan): string {
  return `${span.start}-${span.end ?? ''}`;
}
