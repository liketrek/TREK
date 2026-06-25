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

/** Parse a German/EU date + time ("24.12.2026, 10:00" / "24.12.2026 10:00 Uhr") to ISO. */
function deDateTime(text: string): string | null {
  const m = text.match(/(\d{2})\.(\d{2})\.(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  return `${y}-${mo}-${d}` + (h ? `T${h.padStart(2, '0')}:${mi}:00` : '');
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

const TEMPLATES: VendorTemplate[] = [sixt];

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
