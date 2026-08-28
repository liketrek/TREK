import { describe, it, expect, vi, beforeEach } from 'vitest';

// The router's single model call and the schema.org mapper are mocked: we drive the
// enforced-extract output directly and inspect the flat reservations handed to the mapper,
// so these tests cover the router's orchestration and deterministic post-processing without
// a live Ollama or the real mapper.
const { extractEnforced, mapToKi } = vi.hoisted(() => ({ extractEnforced: vi.fn(), mapToKi: vi.fn() }));
vi.mock('../../../../src/nest/llm-parse/router/ollama-format.client', () => ({ extractEnforced }));
vi.mock('../../../../src/nest/llm-parse/clients/nuextract', () => ({ nuExtractToKiReservations: mapToKi }));

import {
  extractBookingRef,
  extractTotalPrice,
  normCurrency,
  detectFlightNumbers,
  fixArrivalDate,
  routeExtraction,
} from '../../../../src/nest/llm-parse/router/extraction-router';

const CTX = { baseUrl: 'http://ollama:11434/v1', model: 'qwen3:8b' };

beforeEach(() => {
  vi.clearAllMocks();
  mapToKi.mockReturnValue([{ '@type': 'Mock' }]);
});

describe('extractBookingRef', () => {
  it('reads an Airbnb "Bestätigungs-Code"', () => {
    expect(extractBookingRef('Bestätigungs-Code\nHMHJ9RTEEK')).toBe('HMHJ9RTEEK');
  });
  it('prefers the customer "Reservation No." over a later "Supplier Reference"', () => {
    expect(extractBookingRef('Reservation No.: G72820729\nSUPPLIER DETAILS\nSupplier Reference: IT587200464')).toBe('G72820729');
  });
  it('reads an Expedia "Reiseplan" number', () => {
    expect(extractBookingRef('Expedia-Reiseplan: 73222406755286')).toBe('73222406755286');
  });
  it('reads a classic "Buchungsnummer" / "PNR"', () => {
    expect(extractBookingRef('Buchungsnummer: ABC123')).toBe('ABC123');
    expect(extractBookingRef('PNR XY7Q9Z')).toBe('XY7Q9Z');
  });
  it('does not capture a prose word after a bare "Confirmation"/"reference"', () => {
    expect(extractBookingRef('Booking Confirmation\n\nThank you for choosing us')).toBeUndefined();
    expect(extractBookingRef('For future reference please retain this email')).toBeUndefined();
  });
});

describe('extractTotalPrice', () => {
  it('reads a labeled German total', () => {
    expect(extractTotalPrice('Gesamtpreis 61,23 €')).toEqual({ price: '61,23', currency: 'EUR' });
  });
  it('reads an Airbnb "Bezahlter Betrag"', () => {
    expect(extractTotalPrice('Bezahlter Betrag\n651,86 €')).toEqual({ price: '651,86', currency: 'EUR' });
  });
  it('falls back to a standalone ¥ voucher price (JPY) with no nearby label', () => {
    expect(extractTotalPrice('Price (consumption tax included)\n金額(消費税込)\n¥9,400\nAdult')).toEqual({ price: '9,400', currency: 'JPY' });
  });
  it('returns null when there is neither a labeled nor a symbol amount', () => {
    expect(extractTotalPrice('Just some terms and conditions, no price here.')).toBeNull();
  });
});

describe('normCurrency', () => {
  it('maps symbols and codes to ISO 4217', () => {
    expect(normCurrency('€')).toBe('EUR');
    expect(normCurrency('¥')).toBe('JPY');
    expect(normCurrency('$')).toBe('USD');
    expect(normCurrency('£')).toBe('GBP');
    expect(normCurrency('CHF')).toBe('CHF');
  });
  it('returns undefined for an unrecognised token', () => {
    expect(normCurrency('')).toBeUndefined();
    expect(normCurrency('hello world')).toBeUndefined();
  });
});

describe('detectFlightNumbers', () => {
  it('finds flight numbers order-preserving and deduped', () => {
    expect(detectFlightNumbers('Flug LH 400, dann LH400 und BA1234')).toEqual(['LH400', 'BA1234']);
  });
  it('returns [] when there is no flight-number pattern', () => {
    expect(detectFlightNumbers('A hotel booking with no flight codes')).toEqual([]);
  });
});

describe('fixArrivalDate', () => {
  it('keeps the same day when arrival is later than departure', () => {
    const out = fixArrivalDate({ type: 'flight', departure_time: '2025-08-23T10:00', arrival_time: '13:00' });
    expect(out.arrival_time).toBe('2025-08-23T13:00:00');
  });
  it('rolls to the next day for an overnight leg', () => {
    const out = fixArrivalDate({ type: 'flight', departure_time: '2025-08-30T18:00', arrival_time: '07:00' });
    expect(out.arrival_time).toBe('2025-08-31T07:00:00');
  });
  it('leaves a non-transport reservation untouched', () => {
    const hotel = { type: 'hotel' as const, arrival_time: '07:00' };
    expect(fixArrivalDate(hotel).arrival_time).toBe('07:00');
  });
  it('leaves it untouched when departure or arrival is missing', () => {
    expect(fixArrivalDate({ type: 'flight' }).arrival_time).toBeUndefined();
  });
});

describe('routeExtraction', () => {
  it('extracts every flight leg in one call and normalizes/rolls arrival dates', async () => {
    extractEnforced.mockResolvedValue({
      flights: [
        { vehicle_number: 'LH400', from_code: 'FRA', to_code: 'JFK', departure_time: 'Aug 23 2025 10:00', arrival_time: '13:00' },
        { vehicle_number: 'LH401', from_code: 'JFK', to_code: 'FRA', departure_time: '2025-08-30T18:00', arrival_time: '07:00' },
      ],
    });
    const res = await routeExtraction('Flug LH 400 hin und zurück', CTX);
    expect(extractEnforced).toHaveBeenCalledTimes(1);
    expect(res.warnings).toEqual([]);
    expect(res.kiItems).toEqual([{ '@type': 'Mock' }]);
    const flats = mapToKi.mock.calls[0][0];
    expect(flats).toHaveLength(2);
    // Exact now, not a pattern: toIso reads and prints local components, so a naive
    // string is the same wall clock on every machine. It used to parse locally and
    // print in UTC, which shifted the value by the container's offset (#2094).
    expect(flats[0].departure_time).toBe('2025-08-23T10:00:00');
    expect(flats[1].arrival_time).toBe('2025-08-31T07:00:00'); // overnight roll (TZ-safe: derived from the ISO departure date)
  });

  it('extracts a single reservation with the type-specific schema when keywords give the type away', async () => {
    extractEnforced.mockResolvedValue({ name: 'B&B Hotel', address: 'Str 1', checkin_time: '2025-05-01', checkout_time: '2025-05-02' });
    const res = await routeExtraction('Hotel booking — check-in 1 May', CTX);
    expect(res.warnings).toEqual([]);
    const flats = mapToKi.mock.calls[0][0];
    expect(flats).toHaveLength(1);
    expect(flats[0].type).toBe('hotel');
  });

  it('falls back to the union schema and the model-picked type for an unclear document', async () => {
    extractEnforced.mockResolvedValue({ type: 'event', name: 'Concert' });
    const res = await routeExtraction('A document with no obvious type keywords', CTX);
    const flats = mapToKi.mock.calls[0][0];
    expect(flats[0].type).toBe('event');
    expect(res.warnings).toEqual([]);
  });

  it('defaults the union type to hotel when the model omits it', async () => {
    extractEnforced.mockResolvedValue({});
    await routeExtraction('No keywords and no type field present', CTX);
    expect(mapToKi.mock.calls[0][0][0].type).toBe('hotel');
  });

  it('fills the booking reference and total price deterministically from the text', async () => {
    extractEnforced.mockResolvedValue({ name: 'B&B Hotel', checkin_time: '2025-05-01', checkout_time: '2025-05-02' });
    await routeExtraction('Hotel check-in\nBuchungsnummer: ABC123\nGesamtpreis 99,00 €', CTX);
    const flat = mapToKi.mock.calls[0][0][0];
    expect(flat.booking_reference).toBe('ABC123');
    expect(flat.price).toBe('99,00');
    expect(flat.currency).toBe('EUR');
  });

  it("lets the document's currency override the model but keeps a price the model already found", async () => {
    extractEnforced.mockResolvedValue({ name: 'B&B Hotel', checkin_time: '2025-05-01', checkout_time: '2025-05-02', price: '50', currency: 'USD' });
    await routeExtraction('Hotel check-in\nGesamtpreis 99,00 €', CTX);
    const flat = mapToKi.mock.calls[0][0][0];
    expect(flat.currency).toBe('EUR'); // document symbol wins over the model guess
    expect(flat.price).toBe('50'); // a non-empty model price is kept
  });

  it('returns a warning (and no items) when the model call throws', async () => {
    extractEnforced.mockRejectedValue(new Error('connection refused'));
    const res = await routeExtraction('Hotel check-in', CTX);
    expect(res.kiItems).toEqual([]);
    expect(res.warnings[0]).toContain('AI parsing failed');
    expect(res.warnings[0]).toContain('connection refused');
  });

  // #2076 — the lodging keywords used to be tested second and included
  // "check-in"/"check-out", which is printed on nearly every ticket there is, so a
  // ferry or train document came back a hotel and the user was handed a booking
  // form with no transport type on it.
  it('reads a ferry ticket that mentions check-in as a ferry, not a hotel', async () => {
    extractEnforced.mockResolvedValue({ name: 'Puttgarden - Roedby' });
    await routeExtraction('Faehre Puttgarden nach Roedby. Check-in bis 30 Minuten vor Abfahrt.', CTX);
    expect(mapToKi.mock.calls[0][0][0].type).toBe('ferry');
  });

  it('reads a train ticket that mentions check-in as a train', async () => {
    extractEnforced.mockResolvedValue({ name: 'Hamburg - Berlin' });
    await routeExtraction('Deutsche Bahn. Gleis 7. Online check-in moeglich.', CTX);
    expect(mapToKi.mock.calls[0][0][0].type).toBe('train');
  });

  // A rental voucher says who rented it. "Pick-up"/"drop-off" alone is printed on
  // ferry, bus and airport-transfer documents too.
  it('does not read a bus voucher with a pick-up time as a rental car', async () => {
    extractEnforced.mockResolvedValue({ name: 'Shuttle' });
    await routeExtraction('Flixbus Ticket. Pick-up 08:30 am Terminal 2.', CTX);
    expect(mapToKi.mock.calls[0][0][0].type).toBe('bus');
  });

  // A pre-cruise hotel night names a cruise terminal; it is still a hotel.
  it('keeps a hotel booking that merely names a terminal a hotel', async () => {
    extractEnforced.mockResolvedValue({ name: 'Harbour Hotel' });
    await routeExtraction('Hotel Harbour, 1 Uebernachtung vor der Abfahrt am Terminal.', CTX);
    expect(mapToKi.mock.calls[0][0][0].type).toBe('hotel');
  });

  // German rail numbers match the two-letters-plus-digits airline test exactly, and
  // the flight path forces type 'flight' on everything it returns.
  it('does not send a German rail ticket down the flight path', async () => {
    extractEnforced.mockResolvedValue({ name: 'Hamburg - Berlin' });
    await routeExtraction('Deutsche Bahn IC 2023, Hamburg Hbf nach Berlin Hbf, Gleis 7.', CTX);
    const flats = mapToKi.mock.calls[0][0];
    expect(flats).toHaveLength(1);
    expect(flats[0].type).toBe('train');
  });

  it('still sends a real flight itinerary down the flight path', async () => {
    extractEnforced.mockResolvedValue({ flights: [{ vehicle_number: 'LH400', from_code: 'FRA', to_code: 'JFK' }] });
    await routeExtraction('Lufthansa LH 400 FRA-JFK, Gate A12.', CTX);
    expect(mapToKi.mock.calls[0][0][0].type).toBe('flight');
  });

});

describe('printed 12-hour clocks and unreadable types (#2094, #2076)', () => {
  it('fixArrivalDate resolves both meridiems before deciding the day rolled over', () => {
    // '01:11 pm' used to be read as '01:11', which sorts before the 09:51
    // departure, so a three-hour hop was rolled onto the next day.
    const out = fixArrivalDate({ type: 'flight', departure_time: '2026-06-11T09:51 am', arrival_time: '2026-06-11T01:11 pm' });
    expect(out.arrival_time).toBe('2026-06-11T13:11:00');
  });

  it('fixArrivalDate still rolls a genuine overnight', () => {
    const out = fixArrivalDate({ type: 'flight', departure_time: '2026-06-11T10:00 pm', arrival_time: '2026-06-12T06:00 am' });
    expect(out.arrival_time).toBe('2026-06-12T06:00:00');
  });

  it('resolves a meridiem that sits behind an ISO date', async () => {
    extractEnforced.mockResolvedValue({ name: 'B&B Hotel', address: 'Str 1', checkin_time: '2026-05-01T03:00 pm', checkout_time: '2026-05-02T11:00 am' });
    await routeExtraction('Hotel booking — check-in 1 May', CTX);
    const flats = mapToKi.mock.calls[0][0];
    expect(flats[0].checkin_time).toBe('2026-05-01T15:00:00');
    expect(flats[0].checkout_time).toBe('2026-05-02T11:00:00');
  });

  it('marks a type it could not read instead of writing it down as a hotel', async () => {
    extractEnforced.mockResolvedValue({ type: 'shuttle voucher', name: 'Airport Transfer' });
    await routeExtraction('A document with no obvious type keywords', CTX);
    const flats = mapToKi.mock.calls[0][0];
    // Still the hotel shape, so the item survives mapping, but the guess is
    // declared so the importer can offer the form the user was importing into.
    expect(flats[0].type).toBe('hotel');
    expect(flats[0].type_guessed).toBe(true);
  });

  it('does not mark a type the model picked legitimately', async () => {
    extractEnforced.mockResolvedValue({ type: 'event', name: 'Concert' });
    await routeExtraction('A document with no obvious type keywords', CTX);
    const flats = mapToKi.mock.calls[0][0];
    expect(flats[0].type).toBe('event');
    expect(flats[0].type_guessed).toBeUndefined();
  });
});
