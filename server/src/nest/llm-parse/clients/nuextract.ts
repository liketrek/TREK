/**
 * NuExtract adapter for the OpenAI-compatible client.
 *
 * NuExtract (NuMind) is not an instruct model — it is fine-tuned to fill a JSON
 * *template* whose leaf values are type tokens ("verbatim-string", "date-time",
 * …). Fed a generic chat instruction it just echoes the schema back, which is
 * why a plain prompt produces garbage. Run through Ollama/llama.cpp the template
 * has to be embedded INLINE in the user message under a `# Template:` header
 * (llama.cpp ignores vLLM's chat_template_kwargs), with temperature 0.
 *
 * Rather than ask NuExtract for the nested schema.org shape (its template format
 * can't express per-@type conditional fields), we give it ONE flat union template
 * — its sweet spot — and map the flat result back into the `KiReservation` shape
 * the kitinerary mapper consumes, so the whole downstream pipeline is unchanged.
 */

/** Detect a NuExtract model id (e.g. `hf.co/numind/NuExtract-2.0-2B-GGUF`, `nuextract`). */
export function isNuExtractModel(model: string | undefined): boolean {
  return !!model && /nuextract/i.test(model);
}

/**
 * Flat union template covering every reservation type. NuExtract fills the
 * relevant fields and returns the rest as null, so one template serves all docs.
 *
 * Deliberately flat (a single reservation, not an array). A small NuExtract (the
 * 2B) returns an empty result when handed a nested `{ reservations: [ … ] }`
 * array-of-objects template, but extracts reliably from a single flat object —
 * so this path yields one reservation per document. Multi-segment itineraries
 * (round trips) are left to the generic instruct path (qwen/cloud), which the
 * system prompt already drives to emit every leg.
 */
export const NUEXTRACT_TEMPLATE = {
  type: ['flight', 'train', 'bus', 'ferry', 'car', 'hotel', 'restaurant', 'event'],
  name: 'verbatim-string',
  booking_reference: 'verbatim-string',
  operator: 'verbatim-string',
  vehicle_number: 'verbatim-string',
  // Departure/arrival double as a rental car's pick-up/return (place + time) — a
  // separate pickup_location field only tempted the model to grab a nearby form
  // label ("Location Terminal") instead of the actual depot.
  from_name: 'verbatim-string',
  from_code: 'verbatim-string',
  to_name: 'verbatim-string',
  to_code: 'verbatim-string',
  departure_time: 'date-time',
  arrival_time: 'date-time',
  address: 'verbatim-string',
  checkin_time: 'date-time',
  checkout_time: 'date-time',
  start_time: 'date-time',
  end_time: 'date-time',
  telephone: 'verbatim-string',
  website: 'verbatim-string',
  seat: 'verbatim-string',
  travel_class: 'verbatim-string',
  platform: 'verbatim-string',
  // Verbatim so we parse the localized number ourselves — asking the model for a
  // JSON number turns "1.580,22 €" (German thousands/decimal) into 1.49772.
  price: 'verbatim-string',
  currency: 'verbatim-string',
};

/**
 * Build the NuExtract user-turn text: the template (pretty-printed with the
 * indent the model cards use) followed by the document, under a `# Template:`
 * header. This is the exact inline format the GGUF model cards document.
 */
export function buildNuExtractUserText(documentText: string): string {
  return `# Template:\n${JSON.stringify(NUEXTRACT_TEMPLATE, null, 4)}\n${documentText}`;
}

/** NuExtract `type` token → schema.org reservation `@type`. */
const TYPE_MAP: Record<string, string> = {
  flight: 'FlightReservation',
  train: 'TrainReservation',
  bus: 'BusReservation',
  ferry: 'BoatReservation',
  boat: 'BoatReservation',
  cruise: 'BoatReservation',
  car: 'RentalCarReservation',
  hotel: 'LodgingReservation',
  lodging: 'LodgingReservation',
  restaurant: 'FoodEstablishmentReservation',
  event: 'EventReservation',
};

/** Recursively drop null/undefined/blank leaves and the empty objects/arrays they leave behind. */
function clean(value: unknown): unknown {
  if (Array.isArray(value)) {
    const arr = value.map(clean).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const c = clean(v);
      if (c !== undefined) out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

/**
 * Parse a localized money string into a plain number. Handles German
 * ("1.580,22 €" → 1580.22) and English ("1,580.22"/"$89.00" → 89) grouping by
 * treating the right-most separator as the decimal point. Returns null when there
 * is no parseable amount.
 */
function parseAmount(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  let s = raw.replace(/[^\d.,]/g, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let decimal: ',' | '.' | null = null;
  if (lastComma > -1 && lastDot > -1) {
    decimal = lastComma > lastDot ? ',' : '.';
  } else if (lastComma > -1) {
    // A single comma with ≤2 trailing digits is a decimal point; otherwise grouping.
    const parts = s.split(',');
    decimal = parts.length === 2 && parts[1].length <= 2 ? ',' : null;
  } else if (lastDot > -1) {
    const parts = s.split('.');
    decimal = parts.length === 2 && parts[1].length <= 2 ? '.' : null;
  }
  if (decimal) {
    const grouping = decimal === ',' ? '.' : ',';
    s = s.split(grouping).join('').replace(decimal, '.');
  } else {
    s = s.replace(/[.,]/g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Resolve an ISO 4217 currency from a symbol or code found in either field. */
function parseCurrency(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const s = c.toUpperCase();
    if (s.includes('€') || /\bEUR\b/.test(s)) return 'EUR';
    if (s.includes('£') || /\bGBP\b/.test(s)) return 'GBP';
    if (s.includes('$') || /\bUSD\b/.test(s)) return 'USD';
    if (s.includes('¥') || /\bJPY\b/.test(s)) return 'JPY';
    const iso = s.match(/\b([A-Z]{3})\b/);
    if (iso) return iso[1];
  }
  return undefined;
}

/** A venue's display name, falling back to the address (or a generic label) so a
 *  lodging/restaurant/event is never silently dropped when the model misses the name. */
function nameOrFallback(x: Record<string, unknown>, fallback: string): string {
  const name = typeof x.name === 'string' ? x.name.trim() : '';
  if (name) return name;
  const address = typeof x.address === 'string' ? x.address.trim() : '';
  if (address) return address.split(',')[0].trim();
  return fallback;
}

/** Map one flat NuExtract reservation into a schema.org `KiReservation` node (or undefined). */
function buildNode(x: Record<string, unknown>): Record<string, unknown> | undefined {
  const atType = TYPE_MAP[String(x.type ?? '').toLowerCase().trim()];
  if (!atType) return undefined;

  const node: Record<string, unknown> = {
    '@type': atType,
    reservationNumber: x.booking_reference,
    seat: x.seat,
    class: x.travel_class,
    platform: x.platform,
    price: parseAmount(x.price) ?? undefined,
    priceCurrency: parseCurrency(x.currency, x.price),
  };

  switch (atType) {
    case 'FlightReservation':
      node.reservationFor = {
        flightNumber: x.vehicle_number,
        airline: x.operator ? { name: x.operator } : undefined,
        departureAirport: { iataCode: x.from_code, name: x.from_name },
        arrivalAirport: { iataCode: x.to_code, name: x.to_name },
        departureTime: x.departure_time,
        arrivalTime: x.arrival_time,
      };
      break;
    case 'TrainReservation':
      node.reservationFor = {
        trainNumber: x.vehicle_number,
        departureStation: { name: x.from_name },
        arrivalStation: { name: x.to_name },
        departureTime: x.departure_time,
        arrivalTime: x.arrival_time,
      };
      break;
    case 'BusReservation':
      node.reservationFor = {
        busNumber: x.vehicle_number,
        departureBusStop: { name: x.from_name },
        arrivalBusStop: { name: x.to_name },
        departureTime: x.departure_time,
        arrivalTime: x.arrival_time,
      };
      break;
    case 'BoatReservation':
      node.reservationFor = {
        name: x.name ?? x.operator,
        departureBoatTerminal: { name: x.from_name },
        arrivalBoatTerminal: { name: x.to_name },
        departureTime: x.departure_time,
        arrivalTime: x.arrival_time,
      };
      break;
    case 'LodgingReservation':
      node.reservationFor = { name: nameOrFallback(x, 'Accommodation'), address: x.address, telephone: x.telephone, url: x.website };
      node.checkinTime = x.checkin_time;
      node.checkoutTime = x.checkout_time;
      break;
    case 'FoodEstablishmentReservation':
      node.reservationFor = { name: nameOrFallback(x, 'Restaurant'), address: x.address, telephone: x.telephone, url: x.website };
      node.startTime = x.start_time;
      node.endTime = x.end_time;
      break;
    case 'RentalCarReservation':
      // Pick-up / return ride the transport from/to fields (see template comment).
      node.reservationFor = { name: x.name, rentalCompany: x.operator ? { name: x.operator } : undefined };
      node.pickupTime = x.departure_time;
      node.dropoffTime = x.arrival_time;
      node.pickupLocation = { name: x.from_name, address: x.address };
      node.dropoffLocation = { name: x.to_name };
      break;
    case 'EventReservation':
      node.reservationFor = {
        name: nameOrFallback(x, 'Event'),
        startDate: x.start_time,
        endDate: x.end_time,
        location: { address: x.address, telephone: x.telephone, url: x.website },
      };
      node.startTime = x.start_time;
      node.endTime = x.end_time;
      break;
  }

  return clean(node) as Record<string, unknown> | undefined;
}

/**
 * Convert a parsed NuExtract response into schema.org `KiReservation` nodes.
 * Accepts the `{ reservations: [...] }` wrapper the template asks for, a bare
 * array, or a single object. Unrecognized/empty entries are dropped.
 */
export function nuExtractToKiReservations(parsed: unknown): Record<string, unknown>[] {
  const wrapped = (parsed as { reservations?: unknown })?.reservations;
  const list = Array.isArray(wrapped)
    ? wrapped
    : Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
        ? [parsed]
        : [];

  const out: Record<string, unknown>[] = [];
  for (const entry of list) {
    if (entry && typeof entry === 'object') {
      const node = buildNode(entry as Record<string, unknown>);
      if (node) out.push(node);
    }
  }
  return out;
}
