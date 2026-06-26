/**
 * Schicht 0 — deterministic vendor templates.
 *
 * KItinerary already handles documents with machine-readable data (boarding-pass
 * barcodes, UIC rail codes, embedded schema.org JSON-LD) upstream of the LLM. This
 * layer extends the deterministic net to a handful of high-volume vendors whose plain
 * PDFs carry NO barcode but a stable text layout (Booking.com, Expedia, Airbnb, the big
 * airlines, Sixt/Europcar…). A matched template returns a fully-formed result with ZERO
 * model inference — instant, free, and 100% repeatable — so the common case never loads
 * the CPU. The LLM router only runs for the long tail.
 *
 * Templates emit the same flat field shape the router uses, so they feed the identical
 * `nuExtractToKiReservations` mapper. Each template must be CONSERVATIVE: fire only on an
 * unambiguous marker and only emit fields it can read with certainty — a wrong
 * deterministic answer is worse than deferring to the model. This file is the seam where
 * new vendor extractors are added; it ships with one worked example.
 */

import type { FlatType } from './flat-schemas';

export interface FlatReservation {
  type: FlatType;
  booking_reference?: string;
  operator?: string;
  name?: string;
  from_name?: string;
  to_name?: string;
  departure_time?: string;
  arrival_time?: string;
  address?: string;
  checkin_time?: string;
  checkout_time?: string;
  price?: string;
  currency?: string;
  [k: string]: unknown;
}

interface VendorTemplate {
  name: string;
  /** Cheap check: is this that vendor's document at all? */
  match(text: string): boolean;
  /** Pull the reservation(s); return [] if the layout didn't parse as expected. */
  extract(text: string): FlatReservation[];
}

/** Parse a German/EU numeric date + time ("24.12.2026, 10:00" / "24.12.2026 10:00 Uhr") to ISO. */
function deDateTime(text: string): string | null {
  const m = text.match(/(\d{2})\.(\d{2})\.(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  return `${y}-${mo}-${d}` + (h ? `T${h.padStart(2, '0')}:${mi}:00` : '');
}

/** German month name/abbreviation → month number (matched on the first three letters). */
const DE_MONTHS: Record<string, number> = {
  jan: 1, feb: 2, 'mär': 3, mrz: 3, apr: 4, mai: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dez: 12,
};
/** English month name/abbreviation → month number (matched on the first three letters). */
const EN_MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Parse a German long-form date ("3. Mai 2026", "27. Aug. 2025") to an ISO date — no time. */
function deLongDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)\.?\s+(\d{4})/);
  if (!m) return null;
  const mo = DE_MONTHS[m[2].slice(0, 3).toLowerCase()];
  if (!mo) return null;
  return `${m[3]}-${String(mo).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/**
 * Parse an English date + optional time to ISO. Tolerates a comma after the day
 * ("Aug 5, 2025") and a 12-hour clock ("Aug 23 2025 01:30 PM" → 13:30) as well as the
 * plain 24-hour form ("Aug 23 2025 13:30", "Aug 30 2025").
 */
function enDateTime(text: string): string | null {
  const m = text.match(/([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})\s*([AaPp][Mm])?)?/);
  if (!m) return null;
  const mo = EN_MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (!mo) return null;
  const date = `${m[3]}-${String(mo).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  if (!m[4]) return date;
  let h = parseInt(m[4], 10);
  const meridiem = m[6]?.toLowerCase();
  if (meridiem === 'pm' && h !== 12) h += 12;
  else if (meridiem === 'am' && h === 12) h = 0;
  return `${date}T${String(h).padStart(2, '0')}:${m[5]}:00`;
}

/** Symbol/code → ISO 4217 (defaults to EUR for the EU-centric broker vouchers). */
function moneyCurrency(token: string | undefined): string {
  if (!token) return 'EUR';
  const u = token.toUpperCase();
  if (u.includes('€')) return 'EUR';
  if (u.includes('$')) return 'USD';
  if (u.includes('£')) return 'GBP';
  return /^[A-Z]{3}$/.test(u) ? u : 'EUR';
}

/**
 * Example: Sixt rental confirmation. Sixt print-PDFs carry no barcode but a stable
 * "Reservierungsnummer" + Anmietung/Rückgabe block. Conservative: only fires on the Sixt
 * marker, only emits fields it can read unambiguously, and bails to the LLM otherwise.
 */
const sixt: VendorTemplate = {
  name: 'sixt-rental',
  match: (t) => /\bSIXT\b/i.test(t) && /Reservierungsnummer/i.test(t),
  extract: (t) => {
    const ref = t.match(/Reservierungsnummer:?\s*([A-Z0-9]{6,})/i)?.[1];
    const pickup = t.match(/Anmietung:?\s*(.+)/i)?.[1]?.trim();
    const dropoff = t.match(/R(?:ü|ue)ckgabe:?\s*(.+)/i)?.[1]?.trim();
    const pickupTime = pickup ? deDateTime(t.slice(t.indexOf(pickup))) : null;
    const dropoffTime = dropoff ? deDateTime(t.slice(t.indexOf(dropoff))) : null;
    // Need at least a reference and both endpoints with dates to trust the template.
    if (!ref || !pickup || !dropoff || !pickupTime || !dropoffTime) return [];
    const place = (s: string) => s.replace(/\s*[-–]\s*\d{2}\.\d{2}\.\d{4}.*$/, '').trim();
    const priceM = t.match(/Gesamtpreis:?\s*([\d.,]+)\s*(EUR|€)/i);
    return [
      {
        type: 'car',
        operator: 'SIXT',
        booking_reference: ref,
        from_name: place(pickup),
        to_name: place(dropoff),
        departure_time: pickupTime,
        arrival_time: dropoffTime,
        ...(priceM ? { price: priceM[1], currency: 'EUR' } : {}),
      },
    ];
  },
};

/**
 * Expedia receipt ("Beleg"). Expedia's German confirmation PDFs carry no barcode but a
 * stable "Buchungsdetails" block — hotel name, address, Anreise/Abreise — and an
 * "Expedia-Reiseplan" number + "Gesamtpreis". The text layer reads these cleanly even
 * when the local model misses the address/price, so pull the hotel deterministically.
 * (A combined hotel+flight receipt only yields the hotel here — the airline lines carry
 * no IATA flight number, which the model can't reliably turn into legs either.)
 */
const expedia: VendorTemplate = {
  name: 'expedia-hotel',
  match: (t) => /Expedia-Reiseplan/i.test(t) && /Buchungsdetails/i.test(t) && /Anreise/i.test(t),
  extract: (t) => {
    const ref = t.match(/Expedia-Reiseplan:?\s*(\d{6,})/i)?.[1];
    const block = t.match(/Buchungsdetails\s*\n([\s\S]*?)\nAnreise:/i)?.[1];
    const checkin = deLongDate(t.match(/Anreise:?\s*([^\n]+)/i)?.[1] ?? '');
    const checkout = deLongDate(t.match(/Abreise:?\s*([^\n]+)/i)?.[1] ?? '');
    if (!block || !checkin || !checkout) return [];
    const lines = block.split('\n').map((s) => s.trim()).filter(Boolean);
    const name = lines[0];
    if (!name) return [];
    const address = lines.slice(1).join(', ') || undefined;
    const priceM = t.match(/Gesamtpreis\s*([\d.,]+)\s*€/i);
    return [
      {
        type: 'hotel',
        name,
        ...(ref ? { booking_reference: ref } : {}),
        ...(address ? { address } : {}),
        checkin_time: checkin,
        checkout_time: checkout,
        ...(priceM ? { price: priceM[1], currency: 'EUR' } : {}),
      },
    ];
  },
};

/**
 * Broker rental-car voucher (vipcars and the like). These print a stable
 * "PICK-UP DETAILS / DROP-OFF DETAILS" pair — each followed by the depot name and an
 * English "Mon DD YYYY HH:MM" line — plus a "Reservation No." and a "Payment Details"
 * total. The model regularly fails the two-column English date, so read it here.
 */
const brokerRental: VendorTemplate = {
  name: 'broker-rental-voucher',
  match: (t) => /PICK-?UP DETAILS/i.test(t) && /DROP-?OFF DETAILS/i.test(t) && /Reservation\s*No/i.test(t),
  extract: (t) => {
    const ref = t.match(/Reservation\s*No\.?:?\s*([A-Z0-9]{5,})/i)?.[1];
    const block = (label: RegExp) =>
      t.match(new RegExp(label.source + String.raw`\s*\n([^\n]+)\n([A-Za-z]{3,}\.?\s+\d{1,2},?\s+\d{4}[^\n]*)`, 'i'));
    const pu = block(/PICK-?UP DETAILS/);
    const dof = block(/DROP-?OFF DETAILS/);
    const puTime = pu ? enDateTime(pu[2]) : null;
    const doTime = dof ? enDateTime(dof[2]) : null;
    if (!ref || !pu || !dof || !puTime || !doTime) return [];
    const company = t
      .match(/SUPPLIER DETAILS\s*\n([^\n]+?)(?:\s+Supplier Reference|\n|$)/i)?.[1]
      ?.trim()
      .replace(/\s*\(V\d+\)\s*$/i, ''); // drop the broker's "(V2)" supplier-version tag
    // Read the first amount in the "Payment Details" block; accept the currency on either
    // side of the number and derive it (don't assume EUR), so non-EUR vouchers still get a price.
    const priceM = t.match(
      /Payment Details[\s\S]{0,120}?(?:(EUR|USD|GBP|CHF|€|\$|£)\s*([\d.,]+)|([\d.,]+)\s*(EUR|USD|GBP|CHF|€|\$|£))/i,
    );
    const price = priceM ? priceM[2] ?? priceM[3] : undefined;
    return [
      {
        type: 'car',
        ...(company ? { operator: company } : {}),
        booking_reference: ref,
        from_name: pu[1].trim(),
        to_name: dof[1].trim(),
        departure_time: puTime,
        arrival_time: doTime,
        ...(price ? { price, currency: moneyCurrency(priceM![1] ?? priceM![4]) } : {}),
      },
    ];
  },
};

const TEMPLATES: VendorTemplate[] = [sixt, expedia, brokerRental];

/**
 * Try each vendor template; return the first match's result, or null when no template
 * applies (the router then falls through to the LLM). A template that matches its vendor
 * but can't parse the layout returns [] and is skipped.
 */
export function matchVendorTemplate(text: string): FlatReservation[] | null {
  for (const t of TEMPLATES) {
    if (!t.match(text)) continue;
    const result = t.extract(text);
    if (result.length > 0) return result;
  }
  return null;
}
