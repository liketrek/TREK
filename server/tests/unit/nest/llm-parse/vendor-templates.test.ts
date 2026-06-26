import { describe, it, expect } from 'vitest';
import { matchVendorTemplate } from '../../../../src/nest/llm-parse/router/vendor-templates';
import { extractBookingRef, extractTotalPrice } from '../../../../src/nest/llm-parse/router/extraction-router';

// The snippets below mirror the pdf-parse text layer of real confirmation PDFs
// (Expedia hotel receipt, Airbnb booking, a broker rental-car voucher).

const EXPEDIA_HOTEL = `Beleg
Expedia-Reiseplan: 73222406755286
Buchungsdatum: 27. Aug. 2025
Buchungsdetails
Mercure Tokyo Haneda Airport
1 Chome-2-11 Haneda, Ota City, Tokyo, 144-0043 Japan
Anreise: 3. Mai 2026
Abreise: 22. Mai 2026
1 Zimmer x 19 Nächte
Zahlungsdetails
Steuern und Gebühren 1.195,07 €
Gesamtpreis 3.516,13 €
Bezahlt`;

const AIRBNB = `Zwei-Zimmer-Wohnung zwischen Venedig und
Treviso!
Check-in
15:00
Sa., 23. Aug.
Check-out
10:00
Sa., 30. Aug.
Bestätigungs-Code
HMHJ9RTEEK
Adresse
Via Aldo Moro, 47 n. 15, Quarto d'Altino, Venetien 30020, Italien
Bezahlter Betrag
651,86 €`;

const BROKER_RENTAL = `Reservation No.: G72820729
MAIN DRIVER'S NAME: Felix Pakulat
SUPPLIER DETAILS
SICILY BY CAR (V2) Supplier Reference: IT587200464
PICK-UP DETAILS
Venice Marco Polo Airport
Aug 23 2025 13:30
DROP-OFF DETAILS
Venice Marco Polo Airport
Aug 30 2025 12:30
Payment Details
Amount Payable to
Supplier:
(Payable at Pick-up)
EUR 300.21`;

describe('expedia-hotel vendor template', () => {
  it('extracts hotel name, address, stay dates, price and Reiseplan number', () => {
    const out = matchVendorTemplate(EXPEDIA_HOTEL);
    expect(out).toEqual([
      {
        type: 'hotel',
        name: 'Mercure Tokyo Haneda Airport',
        booking_reference: '73222406755286',
        address: '1 Chome-2-11 Haneda, Ota City, Tokyo, 144-0043 Japan',
        checkin_time: '2026-05-03',
        checkout_time: '2026-05-22',
        price: '3.516,13',
        currency: 'EUR',
      },
    ]);
  });

  it('parses German abbreviated months (e.g. "4. Feb. 2026")', () => {
    const bnb = EXPEDIA_HOTEL.replace('Anreise: 3. Mai 2026', 'Anreise: 4. Feb. 2026').replace(
      'Abreise: 22. Mai 2026',
      'Abreise: 6. Feb. 2026',
    );
    const out = matchVendorTemplate(bnb);
    expect(out?.[0]).toMatchObject({ checkin_time: '2026-02-04', checkout_time: '2026-02-06' });
  });
});

describe('broker-rental-voucher vendor template', () => {
  it('extracts pickup/return depots, English date-times, price and the customer reservation no.', () => {
    const out = matchVendorTemplate(BROKER_RENTAL);
    expect(out).toEqual([
      {
        type: 'car',
        operator: 'SICILY BY CAR', // the "(V2)" supplier-version tag is stripped
        booking_reference: 'G72820729', // the customer ref, not the supplier reference
        from_name: 'Venice Marco Polo Airport',
        to_name: 'Venice Marco Polo Airport',
        departure_time: '2025-08-23T13:30:00',
        arrival_time: '2025-08-30T12:30:00',
        price: '300.21',
        currency: 'EUR',
      },
    ]);
  });
});

describe('non-matching documents', () => {
  it('returns null when no template applies', () => {
    expect(matchVendorTemplate(AIRBNB)).toBeNull();
    expect(matchVendorTemplate('just some unrelated text')).toBeNull();
  });
});

describe('broker template — date & price variants', () => {
  const VARIANT = `Reservation No.: AB123456
SUPPLIER DETAILS
GREEN MOTION Supplier Reference: XYZ
PICK-UP DETAILS
London Heathrow
Aug 5, 2025 09:00 AM
DROP-OFF DETAILS
London Heathrow
Aug 12, 2025 05:30 PM
Payment Details
Total to pay
150.00 GBP`;

  it('handles a comma date, a 12-hour clock and a trailing non-EUR currency', () => {
    const out = matchVendorTemplate(VARIANT);
    expect(out?.[0]).toMatchObject({
      booking_reference: 'AB123456',
      departure_time: '2025-08-05T09:00:00', // 09:00 AM
      arrival_time: '2025-08-12T17:30:00', // 05:30 PM → 17:30
      price: '150.00',
      currency: 'GBP', // derived, not hard-coded EUR
    });
  });
});

describe('extractBookingRef', () => {
  it('reads an Airbnb "Bestätigungs-Code"', () => {
    expect(extractBookingRef(AIRBNB)).toBe('HMHJ9RTEEK');
  });
  it('prefers the customer "Reservation No." over a later "Supplier Reference"', () => {
    expect(extractBookingRef(BROKER_RENTAL)).toBe('G72820729');
  });
  it('still reads a classic "Buchungsnummer" / "PNR"', () => {
    expect(extractBookingRef('Buchungsnummer: ABC123')).toBe('ABC123');
    expect(extractBookingRef('PNR XY7Q9Z')).toBe('XY7Q9Z');
  });
  it('does not capture a prose word after a bare "Confirmation"/"reference"', () => {
    expect(extractBookingRef('Booking Confirmation\n\nThank you for choosing us')).toBeUndefined();
    expect(extractBookingRef('For future reference please retain this email')).toBeUndefined();
  });
});

describe('extractTotalPrice', () => {
  it('reads an Airbnb "Bezahlter Betrag"', () => {
    expect(extractTotalPrice(AIRBNB)).toEqual({ price: '651,86', currency: 'EUR' });
  });
});
