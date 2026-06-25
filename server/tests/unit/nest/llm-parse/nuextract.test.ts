import { describe, it, expect } from 'vitest';
import {
  isNuExtractModel,
  buildNuExtractUserText,
  nuExtractToKiReservations,
  NUEXTRACT_TEMPLATE,
} from '../../../../src/nest/llm-parse/clients/nuextract';

describe('isNuExtractModel', () => {
  it('matches NuExtract ids case-insensitively', () => {
    expect(isNuExtractModel('hf.co/numind/NuExtract-2.0-2B-GGUF:latest')).toBe(true);
    expect(isNuExtractModel('hf.co/numind/NuExtract3-GGUF:Q4_K_M')).toBe(true);
    expect(isNuExtractModel('nuextract')).toBe(true);
  });
  it('does not match generic instruct models', () => {
    expect(isNuExtractModel('qwen2.5:7b')).toBe(false);
    expect(isNuExtractModel('gpt-4o')).toBe(false);
    expect(isNuExtractModel(undefined)).toBe(false);
  });
});

describe('buildNuExtractUserText', () => {
  it('inlines the template under a "# Template:" header followed by the document', () => {
    const text = buildNuExtractUserText('Hotel confirmation 123');
    expect(text.startsWith('# Template:\n')).toBe(true);
    expect(text).toContain('"verbatim-string"');
    expect(text).toContain(JSON.stringify(NUEXTRACT_TEMPLATE, null, 4));
    expect(text.endsWith('Hotel confirmation 123')).toBe(true);
  });
});

describe('nuExtractToKiReservations', () => {
  it('maps a flat flight into a schema.org FlightReservation with from/to airports', () => {
    const out = nuExtractToKiReservations({
      reservations: [
        {
          type: 'flight',
          name: 'LH 198',
          booking_reference: '7XK2QP',
          operator: 'Lufthansa',
          vehicle_number: 'LH198',
          from_name: 'Berlin Brandenburg (BER)',
          from_code: 'BER',
          to_name: 'Frankfurt am Main (FRA)',
          to_code: 'FRA',
          departure_time: '2026-07-12T08:35:00',
          arrival_time: '2026-07-12T09:50:00',
          pickup_location: null,
          seat: '14A',
          travel_class: 'Economy',
          platform: null,
          price: 149,
          currency: 'EUR',
        },
      ],
    });
    expect(out).toEqual([
      {
        '@type': 'FlightReservation',
        reservationNumber: '7XK2QP',
        seat: '14A',
        class: 'Economy',
        price: 149,
        priceCurrency: 'EUR',
        reservationFor: {
          flightNumber: 'LH198',
          airline: { name: 'Lufthansa' },
          departureAirport: { iataCode: 'BER', name: 'Berlin Brandenburg (BER)' },
          arrivalAirport: { iataCode: 'FRA', name: 'Frankfurt am Main (FRA)' },
          departureTime: '2026-07-12T08:35:00',
          arrivalTime: '2026-07-12T09:50:00',
        },
      },
    ]);
  });

  it('maps a hotel with check-in/out at the reservation root', () => {
    const [node] = nuExtractToKiReservations({
      reservations: [
        {
          type: 'hotel',
          name: 'B&B Hotel Berlin-Airport',
          booking_reference: '73365505188894',
          address: 'Bertolt-Brecht-Allee 12, 12529 Schoenefeld',
          checkin_time: '2026-05-01T15:00:00',
          checkout_time: '2026-05-02T12:00:00',
          from_name: null,
          price: 89,
          currency: 'EUR',
        },
      ],
    });
    expect(node).toEqual({
      '@type': 'LodgingReservation',
      reservationNumber: '73365505188894',
      price: 89,
      priceCurrency: 'EUR',
      reservationFor: { name: 'B&B Hotel Berlin-Airport', address: 'Bertolt-Brecht-Allee 12, 12529 Schoenefeld' },
      checkinTime: '2026-05-01T15:00:00',
      checkoutTime: '2026-05-02T12:00:00',
    });
  });

  it('maps a rental car — pickup/return ride the from/to fields, money is parsed', () => {
    const [node] = nuExtractToKiReservations([
      {
        type: 'car',
        name: 'VW Golf',
        operator: 'SICILY BY CAR',
        booking_reference: 'CAR1',
        from_name: 'Catania Airport',
        to_name: 'Palermo Airport',
        departure_time: '2026-12-24T10:00:00',
        arrival_time: '2026-12-29T10:00:00',
        address: 'Via Roma 1',
        price: '€215,50',
        currency: '€',
      },
    ]);
    expect(node).toEqual({
      '@type': 'RentalCarReservation',
      reservationNumber: 'CAR1',
      price: 215.5,
      priceCurrency: 'EUR',
      reservationFor: { name: 'VW Golf', rentalCompany: { name: 'SICILY BY CAR' } },
      pickupTime: '2026-12-24T10:00:00',
      dropoffTime: '2026-12-29T10:00:00',
      pickupLocation: { name: 'Catania Airport', address: 'Via Roma 1' },
      dropoffLocation: { name: 'Palermo Airport' },
    });
  });

  it('parses localized money strings and currency symbols', () => {
    const [de] = nuExtractToKiReservations({ type: 'hotel', name: 'X', price: '1.580,22 €' });
    expect(de.price).toBe(1580.22);
    expect(de.priceCurrency).toBe('EUR');
    const [en] = nuExtractToKiReservations({ type: 'hotel', name: 'Y', price: '$1,580.22' });
    expect(en.price).toBe(1580.22);
    expect(en.priceCurrency).toBe('USD');
    const [plain] = nuExtractToKiReservations({ type: 'hotel', name: 'Z', price: 'EUR 89,00' });
    expect(plain.price).toBe(89);
    expect(plain.priceCurrency).toBe('EUR');
  });

  it('falls back to the address instead of dropping a nameless lodging', () => {
    const [node] = nuExtractToKiReservations({
      type: 'hotel',
      booking_reference: 'HMHJ9RTEEK',
      address: "Via Aldo Moro, 47 n. 15, Quarto d'Altino",
    });
    expect(node['@type']).toBe('LodgingReservation');
    expect((node.reservationFor as Record<string, unknown>).name).toBe('Via Aldo Moro');
  });

  it('accepts a bare object and drops unknown types', () => {
    expect(nuExtractToKiReservations({ type: 'flight', from_name: 'A', to_name: 'B' })).toEqual([
      {
        '@type': 'FlightReservation',
        reservationFor: {
          departureAirport: { name: 'A' },
          arrivalAirport: { name: 'B' },
        },
      },
    ]);
    expect(nuExtractToKiReservations({ reservations: [{ type: 'spaceship' }] })).toEqual([]);
    expect(nuExtractToKiReservations(null)).toEqual([]);
  });
});
