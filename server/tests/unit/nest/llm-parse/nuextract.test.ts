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

describe('nuExtractToKiReservations — remaining reservation types', () => {
  const one = (x: Record<string, unknown>) => nuExtractToKiReservations(x)[0];

  it('maps a train into a TrainReservation with stations', () => {
    const node = one({ type: 'train', vehicle_number: 'ICE 597', from_name: 'Berlin Hbf', to_name: 'München Hbf', departure_time: '2025-05-01T08:00:00' });
    expect(node['@type']).toBe('TrainReservation');
    expect(node.reservationFor).toMatchObject({ trainNumber: 'ICE 597', departureStation: { name: 'Berlin Hbf' }, arrivalStation: { name: 'München Hbf' } });
  });

  it('maps a bus into a BusReservation with stops', () => {
    const node = one({ type: 'bus', vehicle_number: 'FB42', from_name: 'Köln', to_name: 'Paris' });
    expect(node['@type']).toBe('BusReservation');
    expect(node.reservationFor).toMatchObject({ busNumber: 'FB42', departureBusStop: { name: 'Köln' }, arrivalBusStop: { name: 'Paris' } });
  });

  it('maps a ferry into a BoatReservation, using the operator when no name is given', () => {
    const node = one({ type: 'ferry', operator: 'Stena Line', from_name: 'Kiel', to_name: 'Göteborg' });
    expect(node['@type']).toBe('BoatReservation');
    expect((node.reservationFor as Record<string, unknown>).name).toBe('Stena Line');
  });

  it('maps a restaurant into a FoodEstablishmentReservation', () => {
    const node = one({ type: 'restaurant', name: 'Osteria', address: 'Via Roma 1', start_time: '2025-05-01T19:30:00' });
    expect(node['@type']).toBe('FoodEstablishmentReservation');
    expect(node.startTime).toBe('2025-05-01T19:30:00');
    expect((node.reservationFor as Record<string, unknown>).name).toBe('Osteria');
  });

  it('maps an event into an EventReservation with a location', () => {
    const node = one({ type: 'event', name: 'Concert', address: 'Arena', start_time: '2025-05-01T20:00:00', end_time: '2025-05-01T23:00:00' });
    expect(node['@type']).toBe('EventReservation');
    expect(node.startTime).toBe('2025-05-01T20:00:00');
    expect(node.reservationFor).toMatchObject({ name: 'Concert', location: { address: 'Arena' } });
  });

  it('uses the generic name fallback for a nameless restaurant/event with no address', () => {
    expect((one({ type: 'restaurant', start_time: '2025-05-01T19:30:00' }).reservationFor as Record<string, unknown>).name).toBe('Restaurant');
    expect((one({ type: 'event', start_time: '2025-05-01T20:00:00' }).reservationFor as Record<string, unknown>).name).toBe('Event');
  });

  it('resolves GBP, JPY and a bare ISO code, and leaves an unrecognised currency undefined', () => {
    expect(one({ type: 'hotel', name: 'A', price: '£120.00' }).priceCurrency).toBe('GBP');
    expect(one({ type: 'event', name: 'B', price: '¥9,400' }).priceCurrency).toBe('JPY');
    expect(one({ type: 'hotel', name: 'C', currency: 'CHF', price: '200' }).priceCurrency).toBe('CHF');
    expect(one({ type: 'hotel', name: 'D', price: '200' }).priceCurrency).toBeUndefined();
  });

  it('parses a plain number price, grouping without a decimal, and drops an unparseable amount', () => {
    expect(one({ type: 'hotel', name: 'A', price: 89 }).price).toBe(89);
    expect(one({ type: 'hotel', name: 'B', price: '1.580' }).price).toBe(1580); // dot is grouping, not a decimal
    expect(one({ type: 'hotel', name: 'C', price: 'free of charge' }).price).toBeUndefined();
  });

  it('accepts a bare array of reservations', () => {
    const out = nuExtractToKiReservations([{ type: 'hotel', name: 'A' }, { type: 'train', from_name: 'X', to_name: 'Y' }]);
    expect(out.map((n) => n['@type'])).toEqual(['LodgingReservation', 'TrainReservation']);
  });
});
