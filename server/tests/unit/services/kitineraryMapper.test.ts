import { describe, it, expect } from 'vitest';
import { mapReservations } from '../../../src/nest/booking-import/kitinerary-mapper';

const airport = (iata: string, lat: number, lng: number) => ({
  iataCode: iata,
  name: iata,
  geo: { latitude: lat, longitude: lng },
});

const flight = (pnr: string, dep: any, arr: any, depTime: string, arrTime: string, flightNumber: string) => ({
  '@type': 'FlightReservation',
  reservationNumber: pnr,
  reservationFor: {
    departureAirport: dep,
    arrivalAirport: arr,
    departureTime: depTime,
    arrivalTime: arrTime,
    airline: { name: 'Lufthansa', iataCode: 'LH' },
    flightNumber,
  },
});

const FRA = airport('FRA', 50.04, 8.57);
const BER = airport('BER', 52.36, 13.50);
const HND = airport('HND', 35.55, 139.78);

describe('kitinerary mapper — multi-leg flight grouping', () => {
  it('groups two connecting same-PNR legs into one multi-leg booking', () => {
    const { items } = mapReservations([
      flight('ABC123', FRA, BER, '2026-06-11T10:00:00', '2026-06-11T12:00:00', 'LH 100'),
      flight('ABC123', BER, HND, '2026-06-11T14:30:00', '2026-06-11T23:30:00', 'LH 200'),
    ] as any, 'test.json');

    expect(items).toHaveLength(1);
    const booking = items[0];
    expect(booking.type).toBe('flight');
    expect(booking.endpoints).toHaveLength(3);
    expect(booking.endpoints!.map(e => e.role)).toEqual(['from', 'stop', 'to']);
    expect(booking.endpoints!.map(e => e.sequence)).toEqual([0, 1, 2]);
    const meta = booking.metadata as any;
    expect(meta.legs).toHaveLength(2);
    expect(meta.legs[0]).toMatchObject({ from: 'FRA', to: 'BER', flight_number: 'LH 100' });
    expect(meta.legs[1]).toMatchObject({ from: 'BER', to: 'HND', flight_number: 'LH 200' });
    expect(meta.departure_airport).toBe('FRA');
    expect(meta.arrival_airport).toBe('HND');
    expect(booking.reservation_time).toContain('10:00');
    expect(booking.reservation_end_time).toContain('23:30');
  });

  it('keeps a round trip (same PNR, multi-day gap) as two separate bookings', () => {
    const { items } = mapReservations([
      flight('RT999', FRA, HND, '2026-06-11T10:00:00', '2026-06-11T20:00:00', 'LH 700'),
      flight('RT999', HND, FRA, '2026-06-20T10:00:00', '2026-06-20T18:00:00', 'LH 701'),
    ] as any, 'test.json');

    expect(items).toHaveLength(2);
    expect((items[0].metadata as any).legs).toBeUndefined();
    expect((items[1].metadata as any).legs).toBeUndefined();
  });

  it('leaves a single flight unchanged (two endpoints, no legs array)', () => {
    const { items } = mapReservations([
      flight('S1', FRA, BER, '2026-06-11T10:00:00', '2026-06-11T12:00:00', 'LH 1'),
    ] as any, 'test.json');

    expect(items).toHaveLength(1);
    expect(items[0].endpoints).toHaveLength(2);
    expect((items[0].metadata as any).legs).toBeUndefined();
  });
});
