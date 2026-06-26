/**
 * The extraction router — tuned for ONE model call per document.
 *
 *   1. exactly one grammar-ENFORCED call (Ollama native `format`):
 *        - flights  → a flat ARRAY of legs in a single call (a capable model fills every
 *          leg at once — far faster than one call per leg);
 *        - otherwise → one flat single-reservation call, with a type-specific schema when the
 *          type is obvious from keywords (the common case), else a union schema the model picks;
 *   2. booking-wide fields (PNR, total price, currency) and the overnight-arrival day are filled
 *      DETERMINISTICALLY from the text — the model isn't asked to reason about them, and the
 *      document's own currency symbol corrects the model where it misreads it.
 *
 * A capable instruct model (e.g. Qwen3-8B with thinking disabled) reads name/address/dates/
 * legs reliably across formats, so there's no per-vendor template layer to drift or distort —
 * the model handles the long tail and Schicht 2 backstops the money/reference fields. No per-leg
 * fan-out and no repair round-trips: that 4–8× call count was the latency that made a multi-leg
 * flight take minutes on a CPU host. The flat results map into the kitinerary pipeline via the
 * existing `nuExtractToKiReservations` mapper, so nothing downstream changes.
 */

import type { KiReservation } from '../../booking-import/kitinerary.types';
import { nuExtractToKiReservations } from '../clients/nuextract';
import { FLAT_SCHEMA_BY_TYPE, FLIGHTS_ARRAY_SCHEMA, UNION_SINGLE_SCHEMA, type FlatType, type FlatLike } from './flat-schemas';
import { extractEnforced } from './ollama-format.client';

export interface RouterContext {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

const TRANSPORT_TYPES: FlatType[] = ['flight', 'train', 'bus', 'ferry'];

/** Per-type guidance for the single-reservation prompt. `price`/`currency` are the total
 *  paid and its currency on every type; `address` is the venue street address for stays/venues. */
const TYPE_HINT: Record<FlatType, string> = {
  flight: 'flight. vehicle_number = flight number, from_code/to_code = IATA codes, times = full ISO, price/currency = total fare.',
  train: 'train. from_name/to_name = stations, vehicle_number = train number, times = full ISO, price/currency = total fare.',
  bus: 'bus. from_name/to_name = stops, times = full ISO, price/currency = total fare.',
  ferry: 'ferry/cruise. from_name/to_name = terminals/ports, times = full ISO, price/currency = total fare.',
  car: 'rental car. operator = the rental company, from_name = pick-up location, to_name = return location (may differ), departure_time = pick-up, arrival_time = return, price/currency = total rental cost.',
  hotel: 'hotel stay. name = hotel name, address = the hotel street address, checkin_time/checkout_time = full ISO date-time, price/currency = total paid.',
  restaurant: 'restaurant booking. name = the restaurant, address = its street address, start_time = the reservation date-time, price/currency = total if shown.',
  event: 'event/attraction. name = the event/ticket, address = the venue, start_time/end_time = full ISO, price/currency = ticket price.',
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

/**
 * The booking/confirmation code, pulled once for the whole document. Covers the German
 * "Bestätigungs-Code" (Airbnb) and "Reservation No." (rental brokers) on top of the PNR /
 * Buchungsnummer / Confirmation forms. The match is left-most in the text, so a customer
 * "Reservation No." that precedes a vendor "Supplier Reference" wins.
 */
export function extractBookingRef(text: string): string | undefined {
  // The captured code must contain a digit: real PNRs/booking codes effectively always
  // do, while the case-insensitive [A-Z0-9] class would otherwise grab a following prose
  // word ("Confirmation\nThank you…" → "Thank") after a bare label.
  const m = text.match(
    /(?:PNR|Buchungs(?:code|nummer|referenz)|Booking\s*(?:reference|code|number)|Confirmation\s*(?:number|code)?|Reservierungsnummer|Reservation\s*(?:No\.?|Number|Nr\.?)|Best(?:ä|ae)tigungs[-\s]?(?:nummer|code)|(?:Expedia[-\s]*)?Reiseplan|Reference)\s*:?\s*((?=[A-Z0-9]*\d)[A-Z0-9]{5,})/i,
  );
  return m?.[1];
}

/** Currency symbol/code → ISO 4217, or undefined when none is recognised. */
export function normCurrency(token: string): string | undefined {
  const u = token.toUpperCase();
  if (u.includes('€')) return 'EUR';
  if (u.includes('$')) return 'USD';
  if (u.includes('£')) return 'GBP';
  if (u.includes('¥')) return 'JPY';
  return /^[A-Z]{3}$/.test(u) ? u : undefined;
}

/** The booking total, pulled deterministically (raw amount string + ISO currency). */
export function extractTotalPrice(text: string): { price: string; currency?: string } | null {
  const strip = (s: string) => s.replace(/[€$£¥\s]/g, '');
  // A labeled total: "Gesamtpreis: 1.234,56 €", "Total Amount 99 USD", "Bezahlter Betrag 651,86 €".
  const labeled = text.match(
    /(?:Gesamtpreis|Gesamtbetrag|Gesamtsumme|Total(?:\s*(?:price|amount))?|Amount|Summe|Betrag)\s*:?\s*([€$£¥]?\s*\d[\d.,]*)\s*(EUR|USD|GBP|CHF|JPY|€|\$|£|¥)?/i,
  );
  if (labeled) return { price: strip(labeled[1]), currency: normCurrency(labeled[2] ?? labeled[1]) };
  // Fallback: a standalone amount carrying a currency symbol on its own line (e.g. a voucher's
  // "¥9,400") — the price sits far from any label the pattern above can anchor to.
  const symbol = text.match(/^\s*([€$£¥]\s?\d[\d.,]*)\b/m);
  if (symbol) return { price: strip(symbol[1]), currency: normCurrency(symbol[1]) };
  return null;
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
 * Schicht 2 — fill the booking-wide fields the per-reservation model call doesn't reliably
 * carry: the confirmation/PNR and the booking total + its currency. The confirmation and a
 * missing price are filled from the document; the currency is taken from the document's own
 * symbol/code (authoritative — small models misread it), correcting the model where needed.
 */
function fillBookingWideFields(flats: Record<string, unknown>[], text: string): void {
  const ref = extractBookingRef(text);
  const total = extractTotalPrice(text);
  // A small model sometimes emits an empty string for a price it didn't find, which is
  // not `null` — treat blank/whitespace as "no price" so the deterministic total still wins.
  const priceMissing = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '');
  flats.forEach((f, i) => {
    if (!f.booking_reference && ref) f.booking_reference = ref;
    // The total belongs to the booking, so handle it once (the first item).
    if (i === 0 && total) {
      if (priceMissing(f.price)) f.price = total.price;
      // The document's own currency symbol/code is authoritative; let it override the
      // model's guess (small models misread "¥" as "$").
      if (total.currency) f.currency = total.currency;
    }
  });
}

/**
 * Run the router on extracted document text and return schema.org KiReservation nodes.
 * Returns `[]` (never throws for content reasons) so the caller degrades gracefully.
 */
export async function routeExtraction(text: string, ctx: RouterContext): Promise<{ kiItems: KiReservation[]; warnings: string[] }> {
  const warnings: string[] = [];

  // Schicht 1 — exactly one model call.
  let flats: FlatLike[];
  try {
    flats = detectFlightNumbers(text).length > 0 ? await extractFlights(text, ctx) : [await extractSingle(text, ctx)];
  } catch (err) {
    return { kiItems: [], warnings: [`AI parsing failed — ${err instanceof Error ? err.message : String(err)}`] };
  }

  // Schicht 2 — deterministic booking-wide fields the per-call schema doesn't carry.
  fillBookingWideFields(flats, text);

  const kiItems = nuExtractToKiReservations(flats as unknown as Record<string, unknown>[]) as unknown as KiReservation[];
  return { kiItems, warnings };
}
