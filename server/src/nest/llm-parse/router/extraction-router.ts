/**
 * The extraction router (Schicht 0–2) — tuned for ONE model call per document.
 *
 *   0. deterministic vendor templates first (no LLM, instant);
 *   1. exactly one grammar-ENFORCED call (Ollama native `format`):
 *        - flights  → a flat ARRAY of legs in a single call (a capable model fills every
 *          leg at once — far faster than one call per leg);
 *        - otherwise → one flat single-reservation call, on the FAST model when the type is
 *          obvious from keywords (the common case), else the strong model with a union schema;
 *   2. booking-wide fields (PNR, total price) and the overnight-arrival day are filled
 *      DETERMINISTICALLY from the text — the model isn't asked to repeat or reason about them.
 *
 * No per-leg fan-out and no repair round-trips: that 4–8× call count was the latency that made
 * a multi-leg flight take minutes on a CPU host. The flat results map into the kitinerary
 * pipeline via the existing `nuExtractToKiReservations` mapper, so nothing downstream changes.
 */

import type { KiReservation } from '../../booking-import/kitinerary.types';
import { nuExtractToKiReservations } from '../clients/nuextract';
import { FLAT_SCHEMA_BY_TYPE, FLIGHTS_ARRAY_SCHEMA, UNION_SINGLE_SCHEMA, type FlatType } from './flat-schemas';
import { extractEnforced } from './ollama-format.client';
import { matchVendorTemplate } from './vendor-templates';
import type { FlatLike } from './validate';

export interface RouterContext {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

const TRANSPORT_TYPES: FlatType[] = ['flight', 'train', 'bus', 'ferry'];

/** Per-type guidance for the single-reservation prompt. */
const TYPE_HINT: Record<FlatType, string> = {
  flight: 'flight. vehicle_number = flight number, from_code/to_code = IATA codes, times = full ISO.',
  train: 'train. from_name/to_name = stations, vehicle_number = train number, times = full ISO.',
  bus: 'bus. from_name/to_name = stops, times = full ISO.',
  ferry: 'ferry/cruise. from_name/to_name = terminals/ports, times = full ISO.',
  car: 'rental car. from_name = pick-up location, to_name = return location (may differ), departure_time = pick-up, arrival_time = return.',
  hotel: 'hotel stay. name = hotel name, checkin_time/checkout_time = full ISO date-time.',
  restaurant: 'restaurant booking. name = the restaurant, start_time = the reservation date-time.',
  event: 'event/attraction. name = the event, start_time/end_time = full ISO.',
};

/** Keyword → reservation type, so an obvious document skips the costlier union/strong path. */
const TYPE_KEYWORDS: [FlatType, RegExp][] = [
  ['car', /\b(sixt|europcar|hertz|avis|enterprise|mietwagen|rental\s*car|autovermietung|anmietung|r(?:ü|ue)ckgabe|pick-?up|drop-?off)\b/i],
  ['hotel', /\b(hotel|check-?in|check-?out|(?:ü|ue)bernachtung|zimmer|room\s*night|lodging|airbnb|b&b|hostel|pension)\b/i],
  ['train', /\b(deutsche\s*bahn|bahn|train|railway|\bice\b|\bzug\b|gleis|sncf|trenitalia|renfe)\b/i],
  ['bus', /\b(flixbus|\bbus\b|coach|omnibus)\b/i],
  ['ferry', /\b(f(?:ä|ae)hre|ferry|cruise|kreuzfahrt)\b/i],
  ['restaurant', /\b(restaurant|\btisch\b|table\s*for|men(?:ü|u)|gedeck)\b/i],
  ['event', /\b(ticket|concert|konzert|veranstaltung|eintritt|admission)\b/i],
];

function detectType(text: string): FlatType | null {
  for (const [type, re] of TYPE_KEYWORDS) if (re.test(text)) return type;
  return null;
}

/** Detect flight numbers (order-preserving, deduped) — also the "is this a flight doc" test. */
export function detectFlightNumbers(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\b([A-Z]{2})\s?(\d{2,4})\b/g)) {
    const fn = `${m[1]}${m[2]}`;
    if (!out.includes(fn)) out.push(fn);
  }
  return out;
}

/** The booking/confirmation code, pulled once for the whole document. */
export function extractBookingRef(text: string): string | undefined {
  const m = text.match(
    /(?:PNR|Buchungs(?:code|nummer|referenz)|Booking\s*(?:reference|code|number)|Confirmation(?:\s*number)?|Reservierungsnummer|Best(?:ä|ae)tigungsnummer|Reference)\s*:?\s*([A-Z0-9]{5,})/i,
  );
  return m?.[1];
}

/** Currency symbol/code → ISO 4217. */
function normCurrency(s: string): string | undefined {
  const u = s.toUpperCase();
  if (u.includes('€') || u === 'EUR') return 'EUR';
  if (u.includes('$') || u === 'USD') return 'USD';
  if (u.includes('£') || u === 'GBP') return 'GBP';
  if (/^[A-Z]{3}$/.test(u)) return u;
  return undefined;
}

/** The booking total, pulled deterministically (raw amount string + ISO currency). */
export function extractTotalPrice(text: string): { price: string; currency?: string } | null {
  const m = text.match(
    /(?:Gesamtpreis|Gesamtbetrag|Gesamtsumme|Total(?:\s*(?:price|amount))?|Amount|Summe|Betrag)\s*:?\s*([€$£]?\s*\d[\d.,]*)\s*(EUR|USD|GBP|CHF|€|\$|£)?/i,
  );
  if (!m) return null;
  return { price: m[1].replace(/[€$£\s]/g, ''), currency: normCurrency(m[2] ?? m[1]) };
}

/**
 * Derive a transport leg's arrival DATE deterministically: same day as departure, rolled to
 * the next day only when the arrival clock time is earlier than departure (an overnight leg).
 * The model reads clock times reliably but mishandles the day rollover.
 */
export function fixArrivalDate(flat: FlatLike): FlatLike {
  if (!TRANSPORT_TYPES.includes(flat.type)) return flat;
  const dep = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(String(flat.departure_time ?? ''));
  const arr = /(\d{2}:\d{2})/.exec(String(flat.arrival_time ?? ''));
  if (!dep || !arr) return flat;
  const [, depDate, depTime] = dep;
  const arrTime = arr[1];
  const d = new Date(`${depDate}T00:00:00Z`);
  if (arrTime < depTime) d.setUTCDate(d.getUTCDate() + 1);
  flat.arrival_time = `${d.toISOString().slice(0, 10)}T${arrTime}:00`;
  return flat;
}

const DATE_FIELDS = ['departure_time', 'arrival_time', 'checkin_time', 'checkout_time', 'start_time', 'end_time'] as const;

/**
 * Coerce a date value to ISO 8601. Models occasionally ignore the format instruction and
 * emit a natural-language date ("Aug 23 2025 13:30"), which the downstream `splitIso` then
 * slices into garbage ("Aug 23 202"). Keep already-ISO values untouched; otherwise parse and
 * reformat. (The server runs in UTC, so the components line up.)
 */
function toIso(value: unknown): unknown {
  if (typeof value !== 'string' || !value.trim()) return value;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return value;
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`;
}

/** Normalize every date-ish field on a flat reservation to ISO before mapping. */
function normalizeDates(flat: FlatLike): FlatLike {
  for (const f of DATE_FIELDS) if (f in flat) (flat as Record<string, unknown>)[f] = toIso((flat as Record<string, unknown>)[f]);
  return flat;
}

/** One enforced call extracting every flight leg as a flat array. */
async function extractFlights(text: string, ctx: RouterContext): Promise<FlatLike[]> {
  const system =
    'Extract EVERY flight segment in the document (each flight number is one segment; a round trip has the ' +
    'outbound AND the return legs). vehicle_number = the flight number, from_code/to_code = 3-letter IATA codes, ' +
    "departure_time/arrival_time = full ISO 'YYYY-MM-DDTHH:MM:00' using the date of the section heading each flight is listed under.";
  const out = await extractEnforced({ baseUrl: ctx.baseUrl, model: ctx.model, apiKey: ctx.apiKey, system, user: `Document:\n${text}`, schema: FLIGHTS_ARRAY_SCHEMA, numPredict: 900 });
  const legs = Array.isArray((out as { flights?: unknown })?.flights) ? (out as { flights: Record<string, unknown>[] }).flights : [];
  return legs.map((leg) => fixArrivalDate(normalizeDates({ ...leg, type: 'flight' as FlatType })));
}

/** One enforced call for a single reservation — a type-specific schema when the type is
 *  obvious from keywords, else a union schema the model fills with the type it picks. */
async function extractSingle(text: string, ctx: RouterContext): Promise<FlatLike> {
  const known = detectType(text);
  const call = (schema: Record<string, unknown>, hint: string) =>
    extractEnforced({
      baseUrl: ctx.baseUrl, model: ctx.model, apiKey: ctx.apiKey,
      system: `Extract the single reservation from the document into the flat fields. ${hint} Omit any field that is truly absent.`,
      user: `Document:\n${text}`,
      schema,
    });

  if (known) {
    const out = (await call(FLAT_SCHEMA_BY_TYPE[known], `It is a ${TYPE_HINT[known]}`)) ?? {};
    return fixArrivalDate(normalizeDates({ ...out, type: known }));
  }
  const out = (await call(UNION_SINGLE_SCHEMA, 'Pick the correct "type".')) ?? {};
  const type = (typeof out.type === 'string' ? out.type : 'hotel') as FlatType;
  return fixArrivalDate(normalizeDates({ ...out, type }));
}

/**
 * Run the router on extracted document text and return schema.org KiReservation nodes.
 * Returns `[]` (never throws for content reasons) so the caller degrades gracefully.
 */
export async function routeExtraction(text: string, ctx: RouterContext): Promise<{ kiItems: KiReservation[]; warnings: string[] }> {
  const warnings: string[] = [];

  // Schicht 0 — deterministic vendor templates (no LLM).
  const vendor = matchVendorTemplate(text);
  if (vendor && vendor.length > 0) {
    return { kiItems: nuExtractToKiReservations(vendor) as unknown as KiReservation[], warnings };
  }

  // Schicht 1 — exactly one model call.
  let flats: FlatLike[];
  try {
    flats = detectFlightNumbers(text).length > 0 ? await extractFlights(text, ctx) : [await extractSingle(text, ctx)];
  } catch (err) {
    return { kiItems: [], warnings: [`AI parsing failed — ${err instanceof Error ? err.message : String(err)}`] };
  }

  // Schicht 2 — deterministic booking-wide fields the per-call schema doesn't carry.
  const ref = extractBookingRef(text);
  const total = extractTotalPrice(text);
  flats.forEach((f, i) => {
    if (!f.booking_reference && ref) f.booking_reference = ref;
    // The total belongs to the booking, so attach it once (the first item).
    if (i === 0 && total && f.price == null) {
      f.price = total.price;
      if (f.currency == null) f.currency = total.currency;
    }
  });

  const kiItems = nuExtractToKiReservations(flats as unknown as Record<string, unknown>[]) as unknown as KiReservation[];
  return { kiItems, warnings };
}
