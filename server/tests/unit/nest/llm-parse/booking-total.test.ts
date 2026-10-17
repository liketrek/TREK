import { collapseRepeatedBookingTotal } from '../../../../src/nest/llm-parse/booking-total';

import { describe, expect, it } from 'vitest';

const leg = (
  flightNumber: string,
  departureTime: string,
  price?: unknown,
  { currency = 'USD', ref = 'DEMO77', type = 'FlightReservation' } = {},
): Record<string, unknown> => ({
  '@type': type,
  reservationNumber: ref,
  ...(price === undefined ? {} : { price, priceCurrency: currency }),
  reservationFor: { flightNumber, departureTime },
});

const prices = (nodes: Record<string, unknown>[]) => nodes.map((n) => n.price ?? null);
const TOTAL = 'Payment summary\nTotal paid: USD 200.00';

describe('collapseRepeatedBookingTotal (#2651)', () => {
  it('keeps a total the flights repeat on the first to depart, whatever order the model gave', () => {
    const nodes = [leg('EX101', '2031-02-08T07:00', 200), leg('EX100', '2031-02-05T12:00', 200)];
    const out = collapseRepeatedBookingTotal(nodes, TOTAL);
    expect(prices(out)).toEqual([null, 200]);
    expect(out[0]).not.toHaveProperty('priceCurrency');
    expect(out[1]).toHaveProperty('priceCurrency', 'USD');
  });

  it('leaves fares the document states per leg alone, even when they are equal', () => {
    const text = 'Fare EX100 USD 200.00\nFare EX101 USD 200.00\nTotal paid: USD 400.00';
    const nodes = [leg('EX100', '2031-02-05T12:00', 200), leg('EX101', '2031-02-08T07:00', 200)];
    expect(prices(collapseRepeatedBookingTotal(nodes, text))).toEqual([200, 200]);
  });

  it('leaves a fare printed on every leg alone, even on a line labelled Amount', () => {
    const text = 'Flight LH1 Amount 89.00 EUR\nFlight LH2 Amount 89.00 EUR\nTotal 178.00 EUR';
    const nodes = [
      leg('LH1', '2031-02-05T12:00', 89, { currency: 'EUR' }),
      leg('LH2', '2031-02-08T07:00', 89, { currency: 'EUR' }),
    ];
    expect(collapseRepeatedBookingTotal(nodes, text)).toBe(nodes);
  });

  it('leaves different amounts, references, currencies and mixed booking types alone', () => {
    const cases = [
      [leg('EX100', '2031-02-05T12:00', 120), leg('EX101', '2031-02-08T07:00', 80)],
      [leg('EX100', '2031-02-05T12:00', 200, { ref: 'A1' }), leg('EX101', '2031-02-08T07:00', 200, { ref: 'B2' })],
      [leg('EX100', '2031-02-05T12:00', 200), leg('EX101', '2031-02-08T07:00', 200, { currency: 'EUR' })],
      [leg('EX100', '2031-02-05T12:00', 200), leg('Stay', '2031-02-05T15:00', 200, { type: 'LodgingReservation' })],
      [leg('EX100', '2031-02-05T12:00', 200, { ref: '' }), leg('EX101', '2031-02-08T07:00', 200, { ref: '' })],
    ];
    for (const nodes of cases) expect(collapseRepeatedBookingTotal(nodes, TOTAL)).toBe(nodes);
  });

  it('does nothing without document text to check, or when the text names no such total', () => {
    const nodes = [leg('EX100', '2031-02-05T12:00', 200), leg('EX101', '2031-02-08T07:00', 200)];
    expect(collapseRepeatedBookingTotal(nodes, undefined)).toBe(nodes);
    expect(collapseRepeatedBookingTotal(nodes, 'Fare conditions apply.')).toBe(nodes);
  });

  it('compares in cents and reads a printed amount as one number', () => {
    const nodes = [leg('EX100', '2031-02-05T12:00', '200.00'), leg('EX101', '2031-02-08T07:00', 200)];
    // The date on the same line must not run into the amount.
    expect(prices(collapseRepeatedBookingTotal(nodes, '2031-02-05 Total paid USD 200.00'))).toEqual(['200.00', null]);
    const euro = [
      leg('LH1', '2031-02-05T12:00', 1234.5, { currency: 'EUR' }),
      leg('LH2', '2031-02-08T07:00', 1234.5, { currency: 'EUR' }),
    ];
    expect(prices(collapseRepeatedBookingTotal(euro, 'Gesamtbetrag: 1.234,50 EUR'))).toEqual([1234.5, null]);
  });

  it('leaves an unpriced leg as it is and does not change the nodes it was given', () => {
    const nodes = [
      leg('EX100', '2031-02-05T12:00', 200),
      leg('EX101', '2031-02-08T07:00', 200),
      leg('EX102', '2031-02-09T07:00'),
    ];
    const snapshot = JSON.parse(JSON.stringify(nodes));
    const out = collapseRepeatedBookingTotal(nodes, TOTAL);
    expect(prices(out)).toEqual([200, null, null]);
    expect(out[2]).toBe(nodes[2]);
    expect(nodes).toEqual(snapshot);
  });

  it('needs two priced flights to call it a repeat', () => {
    const nodes = [leg('EX100', '2031-02-05T12:00', 200), leg('EX101', '2031-02-08T07:00')];
    expect(collapseRepeatedBookingTotal(nodes, TOTAL)).toBe(nodes);
    expect(collapseRepeatedBookingTotal([nodes[0]], TOTAL)).toEqual([nodes[0]]);
  });
});
