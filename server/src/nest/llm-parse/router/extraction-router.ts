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
import { parseLenientJson } from '../lenient-json';
import { failureOutcome, foundOutcome } from '../llm-outcome';
import {
  FLAT_SCHEMA_BY_TYPE,
  FLAT_TYPES,
  FLIGHTS_ARRAY_SCHEMA,
  UNION_SINGLE_SCHEMA,
  type FlatType,
  type FlatLike,
} from './flat-schemas';
import { extractEnforced } from './ollama-format.client';
import { normalizeLocalDateTime, parseMeridiemClock, type LlmParseOutcome } from '@trek/shared';

export interface RouterContext {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

const TRANSPORT_TYPES: FlatType[] = ['flight', 'train', 'bus', 'ferry'];

/** Per-type guidance for the single-reservation prompt. `price`/`currency` are the total
 *  paid and its currency on every type; `address` is the venue street address for stays/venues. */
const TYPE_HINT: Record<FlatType, string> = {
  flight:
    'flight. vehicle_number = flight number, from_code/to_code = IATA codes, times = full ISO, price/currency = total fare.',
  train:
    'train. from_name/to_name = stations, vehicle_number = train number, times = full ISO, price/currency = total fare.',
  bus: 'bus. from_name/to_name = stops, times = full ISO, price/currency = total fare.',
  ferry: 'ferry/cruise. from_name/to_name = terminals/ports, times = full ISO, price/currency = total fare.',
  car: 'rental car. operator = the rental company, from_name = pick-up location, to_name = return location (may differ), departure_time = pick-up, arrival_time = return, times = full ISO (24-hour), price/currency = total rental cost.',
  hotel:
    'hotel stay. name = hotel name, address = the hotel street address, checkin_time/checkout_time = full ISO date-time, price/currency = total paid.',
  restaurant:
    'restaurant booking. name = the restaurant, address = its street address, start_time = the reservation date-time as full ISO (24-hour), price/currency = total if shown.',
  event:
    'event/attraction. name = the event/ticket, address = the venue, start_time/end_time = full ISO, price/currency = ticket price.',
};

/**
 * The union prompt for a photo. Text has keywords that pick a type-specific
 * schema and hint before the call; a photo has none, so the model gets every
 * type's field meanings at once. Without them qwen3.5:4b read a train ticket
 * as bare clock times with no stations, and its price as a JSON object inside
 * the string.
 */
const PHOTO_UNION_HINT = [
  'Pick the correct "type", then fill its fields:',
  '- flight: vehicle_number = flight number, from_code/to_code = IATA codes.',
  '- train, bus, ferry: from_name/to_name = stations, stops or ports, vehicle_number = train or line number.',
  '- car: operator = rental company, from_name = pick-up location, to_name = return location.',
  '- hotel: name, address, checkin_time/checkout_time.',
  '- restaurant, event: name, address = the venue, start_time (and end_time).',
  "Every time is full ISO 'YYYY-MM-DDTHH:MM:00' (a transport uses departure_time/arrival_time).",
  'price = the total paid as a plain number like 49.00, currency = its ISO 4217 code.',
].join('\n');

/**
 * Keyword → reservation type, so an obvious document skips the union schema.
 *
 * A word that names a type is not proof the document IS that type: a hotel
 * confirmation names the train station and the airport bus, a ferry ticket lists
 * its cabin as "accommodation". When the first matching pattern decided, transport
 * sat first in the table (#2076), so a hotel that named a bus came back a bus or
 * ferry booking, extracted with a schema that has no hotel name, address or dates,
 * and the import dropped it. So readType only decides alone when the document names
 * one type. When it names several, the model picks between exactly those.
 *
 * Lodging asks for a word that names lodging, never "check-in"/"check-out" (printed
 * on nearly every ticket there is), and the rental pattern never "pick-up"/"drop-off"
 * (printed on ferry, bus and airport-transfer vouchers). A rental names its rental.
 */
const TYPE_KEYWORDS: [FlatType, RegExp][] = [
  ['train', /\b(deutsche\s*bahn|bahn|train|railway|ice|zug|gleis|sncf|trenitalia|renfe)\b/i],
  ['bus', /\b(flixbus|bus|coach|omnibus)\b/i],
  ['ferry', /\b(f(?:ä|ae)hre|ferry|cruise|kreuzfahrt|einschiffung)\b/i],
  ['car', /\b(sixt|europcar|hertz|avis|enterprise|mietwagen|rental\s*car|autovermietung|anmietung)\b/i],
  [
    'hotel',
    /\b(hotels?|motel|(?:ü|ue)bernachtung|unterkunft|ferienwohnung|zimmer|room\s*night|lodging|accommodation|apartment|guest\s*house|airbnb|b&b|hostel|pension)\b/i,
  ],
  ['restaurant', /\b(restaurant|tisch|table\s*for|men(?:ü|u)|gedeck)\b/i],
];

/**
 * "Ticket" is printed on every train, bus and ferry ticket, so the event words
 * decide only for a document that names no other type at all.
 */
const EVENT_KEYWORDS = /\b(ticket|concert|konzert|veranstaltung|eintritt|admission)\b/i;

/** The transport half of the table, for the flight gate in readType. */
const TRANSPORT_FLAT_TYPES = new Set<FlatType>(['train', 'bus', 'ferry', 'car']);

/**
 * What the keywords say about a document: the one type it names, or the types it
 * names, in table order, for the model to choose between. Both empty means it names
 * none, and the model picks from every type.
 */
interface TypeReading {
  type: FlatType | null;
  candidates: FlatType[];
}

/** Read the reservation type off the document's own words; see TYPE_KEYWORDS. */
function readType(text: string): TypeReading {
  const named = TYPE_KEYWORDS.filter(([, re]) => re.test(text)).map(([type]) => type);
  // The flight path forces type 'flight' on everything it returns, so it must not
  // claim a document that names another kind of transport: a German rail ticket
  // carries numbers like "IC 2023" or "RE 4711", which the two-letters-plus-digits
  // test cannot tell from an airline code (#2076).
  if (detectFlightNumbers(text).length > 0 && !named.some((type) => TRANSPORT_FLAT_TYPES.has(type))) {
    return { type: 'flight', candidates: [] };
  }
  if (named.length > 1) return { type: null, candidates: named };
  if (named.length === 1) return { type: named[0], candidates: [] };
  return { type: EVENT_KEYWORDS.test(text) ? 'event' : null, candidates: [] };
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
  // word ("Confirmation\nThank you…" → "Thank") after a bare label. The lookahead asserts
  // exactly that (the run's first digit is only ever preceded by letters), and the
  // separator says "spaces, then optionally a colon and more spaces" — both spellings
  // avoid quantifiers that overlap and make document text backtrack.
  // "Confirmation" carries its own spacing INSIDE the optional suffix: spelled
  // `Confirmation\s*(?:number|code)?`, a dropped suffix left that \s* sitting directly
  // against the separator's \s*, and two adjacent runs can split a stretch of spaces
  // in n ways — quadratic on "Confirmation" followed by a long indent.
  const m = text.match(
    /(?:PNR|Buchungs(?:code|nummer|referenz)|Booking\s*(?:reference|code|number)|Confirmation(?:\s*(?:number|code))?|Reservierungsnummer|Reservation\s*(?:No\.?|Number|Nr\.?)|Best(?:ä|ae)tigungs[-\s]?(?:nummer|code)|(?:Expedia[-\s]*)?Reiseplan|Reference)\s*(?::\s*)?((?=[A-Z]*\d)[A-Z0-9]{5,})/i,
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
  // The symbol keeps the space that trails IT inside its own optional group: spelled
  // `[€$£¥]?\s*`, a missing symbol left that \s* directly against the separator's \s*,
  // and two adjacent runs split a stretch of spaces in n ways — quadratic on a label
  // followed by a long indent and no amount.
  const labeled = text.match(
    /(?:Gesamtpreis|Gesamtbetrag|Gesamtsumme|Total(?:\s*(?:price|amount))?|Amount|Summe|Betrag)\s*(?::\s*)?((?:[€$£¥]\s*)?\d[\d.,]*)\s*(EUR|USD|GBP|CHF|JPY|€|\$|£|¥)?/i,
  );
  if (labeled) return { price: strip(labeled[1]), currency: normCurrency(labeled[2] ?? labeled[1]) };
  // Fallback: a standalone amount carrying a currency symbol on its own line (e.g. a voucher's
  // "¥9,400") — the price sits far from any label the pattern above can anchor to. The
  // indent is horizontal whitespace only: under /m the anchor already sits at every line
  // start, so a \s* run that could also eat the newlines just re-scans the document.
  // U+2028/U+2029 are line terminators too — /m starts a line after each one — so they
  // have to leave the class for the same reason \r\n do. `[^\S\r\n]` still contained
  // them (they are \s), which made a run of them both a line start and indent the class
  // could eat: 16k of U+2028 took 348ms, and the run grows quadratically.
  const symbol = text.match(/^[^\S\r\n\u2028\u2029]*([€$£¥]\s?\d[\d.,]*)\b/m);
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
  const dep = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(normalizeLocalDateTime(String(flat.departure_time ?? '')));
  // The arrival reaches us either as a bare clock ("13:00", "01:11 pm") or as a
  // full date-time, so try the bare form first and fall back to the normalized
  // string. Reading it with a plain /(\d{2}:\d{2})/ used to throw a trailing
  // "PM" away, and the comparison below is lexicographic: "01:11" sorts before
  // a 09:51 departure, so a short hop was rolled onto the next day (#2094).
  const rawArr = String(flat.arrival_time ?? '').trim();
  const arrTime = parseMeridiemClock(rawArr) ?? /(\d{2}:\d{2})/.exec(normalizeLocalDateTime(rawArr))?.[1];
  if (!dep || !arrTime) return flat;
  const [, depDate, depTime] = dep;
  const d = new Date(`${depDate}T00:00:00Z`);
  if (arrTime < depTime) d.setUTCDate(d.getUTCDate() + 1);
  flat.arrival_time = `${d.toISOString().slice(0, 10)}T${arrTime}:00`;
  return flat;
}

const DATE_FIELDS = [
  'departure_time',
  'arrival_time',
  'checkin_time',
  'checkout_time',
  'start_time',
  'end_time',
] as const;

/**
 * Coerce a date value to ISO 8601. Models occasionally ignore the format instruction and
 * emit a natural-language date ("Aug 23 2025 13:30"), which the downstream `splitIso` then
 * slices into garbage ("Aug 23 202"). Keep already-ISO values untouched; otherwise parse and
 * reformat.
 *
 * These fields are naive local wall-clock strings everywhere else in TREK, so the components
 * are read back locally. Reading with Date.parse and printing with getUTC* used to shift every
 * such value by the container's UTC offset, which docker-compose sets from TZ and documents
 * with Europe/Berlin. That is why a rental car came back off by the offset rather than by
 * twelve hours: only `car` and `restaurant` lack the full-ISO instruction in TYPE_HINT, so
 * only they reach this parse at all (#2094).
 */
function toIso(value: unknown): unknown {
  if (typeof value !== 'string' || !value.trim()) return value;
  // An ISO date with a printed meridiem behind it ("2026-06-11T02:30 PM") is not
  // already ISO, it only looks like it. Resolve the clock, keep everything else.
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return normalizeLocalDateTime(value);
  const t = Date.parse(value);
  if (Number.isNaN(t)) return value;
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

/** Normalize every date-ish field on a flat reservation to ISO before mapping. */
function normalizeDates(flat: FlatLike): FlatLike {
  for (const f of DATE_FIELDS)
    if (f in flat) (flat as Record<string, unknown>)[f] = toIso((flat as Record<string, unknown>)[f]);
  return flat;
}

/** One enforced call extracting every flight leg as a flat array. */
async function extractFlights(text: string, ctx: RouterContext): Promise<FlatLike[]> {
  const system =
    'Extract EVERY flight segment in the document (each flight number is one segment; a round trip has the ' +
    'outbound AND the return legs). vehicle_number = the flight number, from_code/to_code = 3-letter IATA codes, ' +
    "departure_time/arrival_time = full ISO 'YYYY-MM-DDTHH:MM:00' using the date of the section heading each flight is listed under.";
  const out = await extractEnforced({
    baseUrl: ctx.baseUrl,
    model: ctx.model,
    apiKey: ctx.apiKey,
    system,
    user: `Document:\n${text}`,
    schema: FLIGHTS_ARRAY_SCHEMA,
    numPredict: 900,
  });
  const legs = Array.isArray((out as { flights?: unknown })?.flights)
    ? (out as { flights: Record<string, unknown>[] }).flights
    : [];
  return legs.map((leg) => fixArrivalDate(normalizeDates({ ...leg, type: 'flight' as FlatType })));
}

/** The union schema with its type narrowed to the given candidates. */
function unionSchemaFor(candidates: FlatType[]): Record<string, unknown> {
  const properties = UNION_SINGLE_SCHEMA.properties as Record<string, unknown>;
  return { ...UNION_SINGLE_SCHEMA, properties: { ...properties, type: { type: 'string', enum: candidates } } };
}

/** The union hint for a document that names several types: only those, each with its field meanings. */
function candidateHint(candidates: FlatType[]): string {
  return [
    `Pick the correct "type", one of: ${candidates.join(', ')}. Then fill its fields:`,
    ...candidates.map((type) => `- ${type}: ${TYPE_HINT[type]}`),
  ].join('\n');
}

/** One enforced call for a single reservation — a type-specific schema when the keywords
 *  name one type, a union narrowed to the named types when they name several, else a
 *  union over every type that the model fills with the type it picks. */
async function extractSingle(
  text: string,
  ctx: RouterContext,
  reading: TypeReading,
  images?: Buffer[],
): Promise<FlatLike> {
  const known = reading.type;
  const call = (schema: Record<string, unknown>, hint: string) =>
    extractEnforced({
      baseUrl: ctx.baseUrl,
      model: ctx.model,
      apiKey: ctx.apiKey,
      system: `Extract the single reservation from the document into the flat fields. ${hint} Omit any field that is truly absent.`,
      user: images?.length ? 'The document is the attached photo.' : `Document:\n${text}`,
      schema,
      // A photo costs far more prompt tokens than the text of the same page.
      ...(images?.length ? { images: images.map((image) => image.toString('base64')), numCtx: 16384 } : {}),
    });

  if (known) {
    const out = (await call(FLAT_SCHEMA_BY_TYPE[known], `It is a ${TYPE_HINT[known]}`)) ?? {};
    return fixArrivalDate(normalizeDates({ ...out, type: known }));
  }
  if (reading.candidates.length > 0) {
    const out = (await call(unionSchemaFor(reading.candidates), candidateHint(reading.candidates))) ?? {};
    const raw = typeof out.type === 'string' ? out.type.toLowerCase().trim() : '';
    // A server without grammar enforcement can still answer outside the list. The
    // document named the candidates, so the first of them is the best reading left.
    const type = reading.candidates.find((candidate) => candidate === raw) ?? reading.candidates[0];
    return fixArrivalDate(normalizeDates({ ...out, type }));
  }
  const out = (await call(UNION_SINGLE_SCHEMA, images?.length ? PHOTO_UNION_HINT : 'Pick the correct "type".')) ?? {};
  // "I could not tell" used to be written down as "hotel", and a hotel is a
  // booking, so a ferry voucher imported from the Transport tab opened the
  // booking form with no transport type to pick and stayed 'other' (#2076).
  // An unvalidated cast also let any string through, and the item then vanished
  // silently in nuExtractToKiReservations, which drops an unmapped type.
  const raw = typeof out.type === 'string' ? out.type.toLowerCase().trim() : '';
  const picked = (FLAT_TYPES as string[]).includes(raw) ? (raw as FlatType) : null;
  // Still extract with the hotel shape so the item survives the mapping, but say
  // out loud that the type was guessed. Only here: a valid pick by the model is
  // a real answer, and flagging it would push AI-parsed hotels into the
  // transport form whenever the document never says the word "hotel".
  const flat: FlatLike = picked ? { ...out, type: picked } : { ...out, type: 'hotel' as FlatType, type_guessed: true };
  return fixArrivalDate(normalizeDates(flat));
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

/** What the router read, and how the reading ended (a failed model call is `[]` with its outcome). */
interface RoutedExtraction {
  kiItems: KiReservation[];
  warnings: string[];
  outcome: LlmParseOutcome;
}

/**
 * Run the router on extracted document text and return schema.org KiReservation nodes.
 * Returns `[]` (never throws for content reasons) so the caller degrades gracefully.
 */
export async function routeExtraction(text: string, ctx: RouterContext): Promise<RoutedExtraction> {
  const warnings: string[] = [];

  // Schicht 1 — exactly one model call.
  let flats: FlatLike[];
  try {
    const reading = readType(text);
    flats = reading.type === 'flight' ? await extractFlights(text, ctx) : [await extractSingle(text, ctx, reading)];
  } catch (err) {
    return {
      kiItems: [],
      warnings: [`AI parsing failed: ${err instanceof Error ? err.message : String(err)}`],
      outcome: failureOutcome(err),
    };
  }

  // Schicht 2 — deterministic booking-wide fields the per-call schema doesn't carry.
  fillBookingWideFields(flats, text);

  const kiItems = nuExtractToKiReservations(
    flats as unknown as Record<string, unknown>[],
  ) as unknown as KiReservation[];
  return { kiItems, warnings, outcome: foundOutcome(kiItems) };
}

/**
 * The router for a photographed document: one enforced call with the photo
 * attached, or the pages of a scanned PDF, one image each. There is no text to
 * spot a flight number or a vendor in, so the model picks the type, and the
 * booking-wide fields come from its answer alone.
 */
export async function routeImageExtraction(images: Buffer[], ctx: RouterContext): Promise<RoutedExtraction> {
  let flat: FlatLike;
  try {
    flat = unwrapPrice(await extractSingle('', ctx, { type: null, candidates: [] }, images));
  } catch (err) {
    return {
      kiItems: [],
      warnings: [`AI parsing failed: ${err instanceof Error ? err.message : String(err)}`],
      outcome: failureOutcome(err),
    };
  }
  const kiItems = nuExtractToKiReservations([flat] as unknown as Record<
    string,
    unknown
  >[]) as unknown as KiReservation[];
  return { kiItems, warnings: [], outcome: foundOutcome(kiItems) };
}

/**
 * The price as the amount alone. With no document text to take the total from,
 * the model's `price` is all there is, and qwen3.5:4b writes it as an object
 * inside the string (`{"amount": 49.00, "currency": "EUR"}`), which the amount
 * parser then reads as 4900.
 */
function unwrapPrice(flat: FlatLike): FlatLike {
  if (typeof flat.price !== 'string' || !flat.price.trim().startsWith('{')) return flat;
  const inner = parseLenientJson(flat.price);
  if (!inner || typeof inner !== 'object' || Array.isArray(inner)) return flat;
  const { amount, currency } = inner as { amount?: unknown; currency?: unknown };
  const out: FlatLike = { ...flat };
  if (typeof amount === 'number' || typeof amount === 'string') out.price = String(amount);
  else delete out.price;
  if (!out.currency && typeof currency === 'string') out.currency = currency;
  return out;
}
