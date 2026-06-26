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
    expect(flats[0].departure_time).toMatch(/^2025-08-23T\d{2}:\d{2}:00$/); // natural-language → ISO
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
});
