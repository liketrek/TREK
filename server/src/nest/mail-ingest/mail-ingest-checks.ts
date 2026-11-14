import { haversineKm } from '../common/geo';
import { NEAR_TRIP_KM } from './mail-ingest.constants';
import {
  bookingImportPreviewItemSchema,
  type BookingImportPreviewItem,
  type MailIngestCheck,
  type MailIngestCheckResult,
  type MailIngestField,
  type MailIngestReason,
  type MailIngestSource,
  type MailIngestSuggestedTrip,
} from '@trek/shared';

import { createHash } from 'node:crypto';

/**
 * The server's checks on one booking read from a mail (plan 5.3, G1 to G8),
 * and the choice of its trip. Pure: everything they weigh is handed in, so a
 * mail cannot steer them, and a test can name every case.
 */

/** A trip a booking may go to, as the checks see it. */
export interface TripOption {
  id: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  ownerId: number;
  /** The trip's currency, upper case. */
  currency: string;
  /** The trip's day ids by date. */
  days: ReadonlyMap<string, number>;
  places: ReadonlyArray<{ name: string; address: string | null; lat: number; lng: number }>;
}

/** A booking read from a mail, before the checks. */
export interface MailDraft {
  item: BookingImportPreviewItem;
  source: MailIngestSource;
  kind: 'new_booking' | 'change' | 'cancellation';
  /** The trip the AI picked, already mapped from its reference to an id of the list; null when it picked none. */
  aiTripId: number | null;
  uncertainFields: MailIngestField[];
  suggestedNewTrip: MailIngestSuggestedTrip | null;
  /** Read from page images alone: nothing can be checked against text. */
  imageOnly: boolean;
  /** The AI read a critical field differently from the machine-readable data (G4). */
  disagrees: boolean;
}

/** What the mail around the booking adds to the checks. */
export interface CheckContext {
  trips: readonly TripOption[];
  /** The trip whose address the mail came in on; null for the person's own address. */
  addressTripId: number | null;
  subject: string | null;
  /** Everything the mail and its attachments say, for the in-text check. */
  documentText: string;
  now: Date;
  knownAirport: (code: string) => boolean;
}

interface TripChoice {
  /** The trip the booking goes to; null when none is certain. */
  tripId: number | null;
  /** The trip to offer in the inbox. */
  suggestedTripId: number | null;
  reason: MailIngestReason | null;
}

export interface BookingVerdict {
  checks: Partial<Record<MailIngestCheck, MailIngestCheckResult>>;
  /** The first reason the booking cannot be added on its own; null when every check passed. */
  reason: MailIngestReason | null;
  uncertain: MailIngestField[];
  choice: TripChoice;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Types that run from one place to another and need both to be added. */
const ROUTED_TYPES = new Set(['flight', 'train', 'bus', 'ferry', 'cruise']);
/** Types that are only added on their own with a booking reference: a mail without one is too vague. */
const REFERENCE_TYPES = new Set(['flight', 'train', 'bus', 'ferry', 'cruise', 'car', 'hotel']);
const MAX_HOURS: Readonly<Record<string, number>> = { flight: 20, train: 48, bus: 48 };
const MAX_STAY_NIGHTS = 60;
const MAX_PRICE = 100_000;
const REFERENCE_RE = /^[A-Z0-9-]{3,40}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;
/**
 * Words that mark a cancellation in the subject. Only the subject: every
 * hotel confirmation speaks of its free cancellation in the body.
 */
const CANCEL_RE =
  /\b(cancel+ed|cancel+ation|storniert|stornierung|annul[ée]e?|annulation|cancelad[ao]|annullat[ao]|geannuleerd|anulowan[ay]|отмен)/i;

/** The date part of an ISO date or date-time, null for anything else. */
export function dateOf(value: string | null | undefined): string | null {
  const date = value?.slice(0, 10) ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

/** When the booking starts: its time, or a stay's check-in. */
export function bookingStart(item: BookingImportPreviewItem): string | null {
  return item.reservation_time || item._accommodation?.check_in || null;
}

/** When the booking ends: its end time, or a stay's check-out. */
function bookingEnd(item: BookingImportPreviewItem): string | null {
  return item.reservation_end_time || item._accommodation?.check_out || null;
}

/** A booking reference as an operator prints it, without the spacing and case a mail adds. */
export function normalizeReference(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, '').toUpperCase();
}

/** No type, no start, or a transport without a named start and end. */
export function missingCritical(item: BookingImportPreviewItem): boolean {
  if (!item.type || !dateOf(bookingStart(item))) return true;
  if (!ROUTED_TYPES.has(item.type)) return false;
  return (item.endpoints ?? []).filter((endpoint) => endpoint.name.trim() !== '').length < 2;
}

/** A transport, stay or rental without a booking reference. */
export function missingReference(item: BookingImportPreviewItem): boolean {
  return REFERENCE_TYPES.has(item.type) && normalizeReference(item.confirmation_number) === '';
}

/** G5: a value that cannot be right. */
export function implausible(
  item: BookingImportPreviewItem,
  now: Date,
  knownAirport: (code: string) => boolean,
): boolean {
  const start = Date.parse(bookingStart(item) ?? '');
  if (!Number.isFinite(start)) return true;
  if (start < now.getTime() - 366 * DAY_MS || start > now.getTime() + 3 * 366 * DAY_MS) return true;
  const end = Date.parse(bookingEnd(item) ?? '');
  if (Number.isFinite(end) && (end < start || tooLong(item.type, end - start))) return true;
  if (item.type === 'flight' && (item.endpoints ?? []).some((e) => e.code && !knownAirport(e.code))) return true;
  const reference = normalizeReference(item.confirmation_number);
  if (reference && !REFERENCE_RE.test(reference)) return true;
  return !plausibleMoney(item.metadata);
}

function tooLong(type: string, ms: number): boolean {
  if (type === 'hotel') return ms > MAX_STAY_NIGHTS * DAY_MS;
  const hours = MAX_HOURS[type];
  return hours !== undefined && ms > hours * 60 * 60 * 1000;
}

function plausibleMoney(metadata: Record<string, unknown> | undefined): boolean {
  const currency = metadata?.priceCurrency;
  if (currency != null && !(typeof currency === 'string' && CURRENCY_RE.test(currency.toUpperCase()))) return false;
  const price = metadata?.price;
  if (price == null || price === '') return true;
  const amount = Number(price);
  // A price written with separators is left to the money parser, which marks rather than refuses it.
  return !Number.isFinite(amount) || (amount > 0 && amount < MAX_PRICE);
}

/** G8: the booking, or the mail it came in, is a cancellation. */
export function isCancellation(
  item: BookingImportPreviewItem,
  kind: MailDraft['kind'],
  subject: string | null,
): boolean {
  if (kind === 'cancellation') return true;
  const status = item.metadata?.reservationStatus;
  if (typeof status === 'string' && /cancel/i.test(status)) return true;
  return CANCEL_RE.test(subject ?? '');
}

/** Letters and digits only, upper case: how a reference or a flight number is looked for in the text. */
function compact(text: string): string {
  return text.toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * G6: what an AI reading names has to be in the mail. A reference or a
 * service number that is not refuses the booking; a free text that is not
 * (its title, its place) only marks the field for a second look.
 */
export function checkInText(
  item: BookingImportPreviewItem,
  documentText: string,
): { ok: boolean; uncertain: MailIngestField[] } {
  const text = compact(documentText);
  const reference = compact(item.confirmation_number ?? '');
  const number = compact(String(item.metadata?.flight_number ?? item.metadata?.train_number ?? ''));
  const ok = (!reference || text.includes(reference)) && (!number || text.includes(number));
  const uncertain: MailIngestField[] = [];
  if (!freeTextIn(item.title, documentText)) uncertain.push('title');
  if (item.location && !freeTextIn(item.location, documentText)) uncertain.push('location');
  return { ok, uncertain };
}

/** Whether most words of a free text appear in the document, case and accents aside. */
function freeTextIn(value: string, documentText: string): boolean {
  const fold = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const haystack = fold(documentText);
  const words = fold(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 3);
  if (words.length === 0) return true;
  return words.filter((word) => haystack.includes(word)).length * 2 >= words.length;
}

/**
 * G3: every date of the booking lies within the trip (a day of slack on each
 * side) and the days it needs exist: a stay its check-in and check-out day,
 * anything else the day it starts on.
 */
export function fitsTrip(item: BookingImportPreviewItem, trip: TripOption): boolean {
  if (!trip.start_date || !trip.end_date) return false;
  const from = shiftDate(trip.start_date, -1);
  const to = shiftDate(trip.end_date, 1);
  const start = dateOf(bookingStart(item));
  const end = dateOf(bookingEnd(item));
  const dates = [start, end].filter((date): date is string => date !== null);
  if (dates.length === 0 || dates.some((date) => date < from || date > to)) return false;
  const needed = item.type === 'hotel' ? dates : [start];
  return needed.every((date) => date !== null && trip.days.has(date));
}

function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whether the booking's destination lies near one of the trip's places, by coordinates the server holds. */
export function nearTrip(item: BookingImportPreviewItem, trip: TripOption): boolean {
  const points = [...(item.endpoints ?? []).slice(-1), ...(item._venue ? [item._venue] : [])].filter(
    (point): point is typeof point & { lat: number; lng: number } => point.lat != null && point.lng != null,
  );
  return points.some((point) =>
    trip.places.some((place) => haversineKm(point.lat, point.lng, place.lat, place.lng) <= NEAR_TRIP_KM),
  );
}

/**
 * G2 and G7: the trip the booking goes to. The server decides; the AI's pick
 * is one input. A trip address names its trip. Otherwise the booking goes
 * where exactly one trip fits its dates, or, of several that do, to the AI's
 * pick when the server confirms the booking lies near it.
 */
export function chooseTrip(item: BookingImportPreviewItem, aiTripId: number | null, context: CheckContext): TripChoice {
  const { trips, addressTripId } = context;
  if (addressTripId !== null) {
    const trip = trips.find((candidate) => candidate.id === addressTripId);
    if (!trip) return { tripId: null, suggestedTripId: null, reason: 'no_edit_permission' };
    if (trip.start_date && trip.end_date && !fitsTrip(item, trip)) {
      return { tripId: null, suggestedTripId: trip.id, reason: 'outside_trip_dates' };
    }
    return { tripId: trip.id, suggestedTripId: trip.id, reason: null };
  }
  const passing = trips.filter((trip) => fitsTrip(item, trip));
  const picked = passing.find((trip) => trip.id === aiTripId);
  if (passing.length === 1) return { tripId: passing[0].id, suggestedTripId: passing[0].id, reason: null };
  if (passing.length > 1) {
    if (picked && nearTrip(item, picked)) return { tripId: picked.id, suggestedTripId: picked.id, reason: null };
    return { tripId: null, suggestedTripId: (picked ?? passing[0]).id, reason: 'trip_ambiguous' };
  }
  const suggested = trips.some((trip) => trip.id === aiTripId) ? aiTripId : null;
  const undatedOnly = trips.length > 0 && trips.every((trip) => !trip.start_date || !trip.end_date);
  return { tripId: null, suggestedTripId: suggested, reason: undatedOnly ? 'trip_without_dates' : 'no_trip_in_range' };
}

/**
 * Every check on one booking, and the first reason it cannot be added on its
 * own. The trip is chosen even for a booking that fails, so the inbox can
 * suggest it.
 */
export function judgeBooking(draft: MailDraft, context: CheckContext): BookingVerdict {
  const { item } = draft;
  const choice = chooseTrip(item, draft.aiTripId, context);
  const fromAi = draft.source === 'ai';
  const inText = fromAi ? checkInText(item, context.documentText) : { ok: true, uncertain: [] };
  const checks: BookingVerdict['checks'] = {
    schema: bookingImportPreviewItemSchema.safeParse(item).success ? 'pass' : 'fail',
    trip: choice.reason === 'no_edit_permission' ? 'fail' : 'pass',
    dates: choice.tripId !== null || choice.reason === 'trip_ambiguous' ? 'pass' : 'fail',
    agreement: draft.disagrees ? 'fail' : fromAi ? 'pass' : 'skipped',
    plausible: implausible(item, context.now, context.knownAirport) ? 'fail' : 'pass',
    in_text: !fromAi ? 'skipped' : inText.ok && !draft.imageOnly ? 'pass' : 'fail',
    assignment: choice.tripId !== null ? 'pass' : 'fail',
    cancellation: isCancellation(item, draft.kind, context.subject) ? 'fail' : 'pass',
  };
  const uncertain = [...new Set([...draft.uncertainFields, ...inText.uncertain])];
  return { checks, reason: firstReason(draft, checks, choice), uncertain, choice };
}

function firstReason(draft: MailDraft, checks: BookingVerdict['checks'], choice: TripChoice): MailIngestReason | null {
  if (draft.kind === 'change') return 'change_or_cancellation';
  if (checks.cancellation === 'fail') return draft.kind === 'cancellation' ? 'change_or_cancellation' : 'cancelled';
  if (checks.schema === 'fail' || missingCritical(draft.item)) return 'missing_critical_field';
  if (checks.plausible === 'fail') return 'implausible';
  if (checks.agreement === 'fail') return 'source_mismatch';
  if (checks.in_text === 'fail') return draft.imageOnly ? 'image_only' : 'not_in_text';
  if (missingReference(draft.item)) return 'missing_confirmation';
  return choice.reason;
}

/**
 * What the booking says, as one hash: two mails about the same booking with
 * the same content give the same hash, and a different time or place a
 * different one.
 */
export function contentHash(item: BookingImportPreviewItem): string {
  const fingerprint = {
    type: item.type,
    title: item.title,
    start: item.reservation_time ?? null,
    end: item.reservation_end_time ?? null,
    reference: normalizeReference(item.confirmation_number),
    location: item.location ?? null,
    stay: item._accommodation ? [item._accommodation.check_in ?? null, item._accommodation.check_out ?? null] : null,
    endpoints: (item.endpoints ?? []).map((endpoint) => [endpoint.code ?? null, endpoint.name]),
  };
  return createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
}
