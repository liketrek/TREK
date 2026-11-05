import { mapReservations } from '../../../../src/nest/booking-import/kitinerary-mapper';
import type { KiReservation } from '../../../../src/nest/booking-import/kitinerary.types';

import { describe, it, expect } from 'vitest';

const airport = (iata: string, lat: number, lng: number) => ({
  iataCode: iata,
  name: iata,
  geo: { latitude: lat, longitude: lng },
});

const flight = (
  pnr: string,
  dep: any,
  arr: any,
  depTime: string,
  arrTime: string | undefined,
  flightNumber: string,
) => ({
  '@type': 'FlightReservation',
  reservationNumber: pnr,
  reservationFor: {
    departureAirport: dep,
    arrivalAirport: arr,
    departureTime: depTime,
    ...(arrTime === undefined ? {} : { arrivalTime: arrTime }),
    airline: { name: 'Lufthansa', iataCode: 'LH' },
    flightNumber,
  },
});

const FRA = airport('FRA', 50.04, 8.57);
const BER = airport('BER', 52.36, 13.5);
const HND = airport('HND', 35.55, 139.78);
const ICN = airport('ICN', 37.46, 126.44);
const SFO = airport('SFO', 37.62, -122.38);
const JFK = airport('JFK', 40.64, -73.78);
const BOS = airport('BOS', 42.36, -71.01);
const HAM = airport('HAM', 53.63, 9.99);
const ZRH = airport('ZRH', 47.46, 8.55);

/** The synthetic legs as the mapper's input type. */
const legs = (...nodes: ReturnType<typeof flight>[]) => nodes as unknown as KiReservation[];
const meta = (item: { metadata?: unknown }) => (item.metadata ?? {}) as { flight_number?: string; legs?: unknown[] };

describe('kitinerary mapper — multi-leg flight grouping', () => {
  it('groups two connecting same-PNR legs into one multi-leg booking', () => {
    const { items } = mapReservations(
      [
        flight('ABC123', FRA, BER, '2026-06-11T10:00:00', '2026-06-11T12:00:00', 'LH 100'),
        flight('ABC123', BER, HND, '2026-06-11T14:30:00', '2026-06-11T23:30:00', 'LH 200'),
      ] as any,
      'test.json',
    );

    expect(items).toHaveLength(1);
    const booking = items[0];
    expect(booking.type).toBe('flight');
    expect(booking.endpoints).toHaveLength(3);
    expect(booking.endpoints!.map((e) => e.role)).toEqual(['from', 'stop', 'to']);
    expect(booking.endpoints!.map((e) => e.sequence)).toEqual([0, 1, 2]);
    // The stop carries the onward departure, as the planner form and the MCP tools write it.
    expect((booking.endpoints ?? []).map((e) => e.local_time)).toEqual(['10:00', '14:30', '23:30']);
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
    const { items } = mapReservations(
      [
        flight('RT999', FRA, HND, '2026-06-11T10:00:00', '2026-06-11T20:00:00', 'LH 700'),
        flight('RT999', HND, FRA, '2026-06-20T10:00:00', '2026-06-20T18:00:00', 'LH 701'),
      ] as any,
      'test.json',
    );

    expect(items).toHaveLength(2);
    expect((items[0].metadata as any).legs).toBeUndefined();
    expect((items[1].metadata as any).legs).toBeUndefined();
  });

  it('keeps a return listed first apart when the arrival time is missing (#2653)', () => {
    // The second leg departs three days BEFORE the first: no connection, however
    // well the airports line up.
    const { items } = mapReservations(
      legs(
        flight('DEMO77', SFO, JFK, '2031-02-08T10:00:00', undefined, 'EX101'),
        flight('DEMO77', JFK, SFO, '2031-02-05T08:00:00', undefined, 'EX100'),
      ),
      'synthetic.txt',
    );

    expect(items).toHaveLength(2);
    expect(items.map((i) => meta(i).flight_number)).toEqual(['EX101', 'EX100']);
    expect(items.every((i) => meta(i).legs === undefined)).toBe(true);
  });

  it('does not take a missing arrival as a layover of three weeks', () => {
    const { items } = mapReservations(
      legs(
        flight('GAP1', SFO, JFK, '2031-02-05T08:00:00', undefined, 'EX1'),
        flight('GAP1', JFK, BOS, '2031-02-26T08:00:00', '2031-02-26T09:30:00', 'EX2'),
      ),
      'test.json',
    );

    expect(items).toHaveLength(2);
  });

  it('still joins a connection the AI import gave no arrival times', () => {
    // The prompt tells the model to leave an arrival out rather than guess it.
    const { items } = mapReservations(
      legs(
        flight('AI1', FRA, BER, '2026-06-11T08:00:00', undefined, 'LH 40'),
        flight('AI1', BER, HND, '2026-06-11T11:00:00', undefined, 'LH 41'),
      ),
      'test.json',
    );

    expect(items).toHaveLength(1);
    expect(meta(items[0]).legs).toHaveLength(2);
  });

  it('treats an arrival time it cannot read like a missing one', () => {
    const { items } = mapReservations(
      legs(
        flight('TBD1', FRA, BER, '2026-06-11T08:00:00', 'TBD', 'LH 20'),
        flight('TBD1', BER, HND, '2026-06-11T11:00:00', '2026-06-12T06:00:00', 'LH 21'),
        flight('TBD2', FRA, BER, '2026-06-11T08:00:00', 'TBD', 'LH 22'),
        flight('TBD2', BER, HND, '2026-06-14T11:00:00', '2026-06-15T06:00:00', 'LH 23'),
      ),
      'test.json',
    );

    expect(items.map((i) => meta(i).legs?.length ?? 1)).toEqual([2, 1, 1]);
  });

  it('keeps an out-and-back on the same day as two flights', () => {
    const { items } = mapReservations(
      legs(
        flight('DAY1', FRA, BER, '2026-06-11T08:00:00', '2026-06-11T09:00:00', 'LH 10'),
        flight('DAY1', BER, FRA, '2026-06-11T18:00:00', '2026-06-11T19:00:00', 'LH 11'),
      ),
      'test.json',
    );

    expect(items).toHaveLength(2);
  });

  it('ends a chain at a leg that lands where the chain has already been', () => {
    // Out via FRA and back via FRA on one day, one booking reference.
    const { items } = mapReservations(
      legs(
        flight('TWO', HAM, FRA, '2026-06-11T07:00:00', '2026-06-11T08:00:00', 'LH 50'),
        flight('TWO', FRA, ZRH, '2026-06-11T09:00:00', '2026-06-11T10:00:00', 'LH 51'),
        flight('TWO', ZRH, FRA, '2026-06-11T17:00:00', '2026-06-11T18:00:00', 'LH 52'),
        flight('TWO', FRA, HAM, '2026-06-11T19:00:00', '2026-06-11T20:00:00', 'LH 53'),
      ),
      'test.json',
    );

    expect(items.map((i) => meta(i).legs?.length)).toEqual([2, 2]);
  });

  it('still joins a chain of three short connections into one booking', () => {
    const { items } = mapReservations(
      legs(
        flight('CH3', FRA, BER, '2026-06-11T08:00:00', '2026-06-11T09:00:00', 'LH 30'),
        flight('CH3', BER, HND, '2026-06-11T11:00:00', '2026-06-12T06:00:00', 'LH 31'),
        flight('CH3', HND, ICN, '2026-06-12T09:00:00', '2026-06-12T11:30:00', 'LH 32'),
      ),
      'test.json',
    );

    expect(items).toHaveLength(1);
    expect(meta(items[0]).legs).toHaveLength(3);
    expect((items[0].endpoints ?? []).map((e) => e.role)).toEqual(['from', 'stop', 'stop', 'to']);
  });

  it('prices a connection once when every leg repeats the booking total', () => {
    const priced = (node: ReturnType<typeof flight>) => ({ ...node, totalPrice: 412.5, priceCurrency: 'EUR' });
    const { items } = mapReservations(
      legs(
        priced(flight('PX1', FRA, BER, '2026-06-11T08:00:00', '2026-06-11T09:00:00', 'LH 60')),
        priced(flight('PX1', BER, HND, '2026-06-11T11:00:00', '2026-06-12T06:00:00', 'LH 61')),
      ),
      'test.json',
    );

    expect(items).toHaveLength(1);
    expect(items[0].metadata).toMatchObject({ price: 412.5, priceCurrency: 'EUR' });
  });

  it('adds the fares of a connection that are priced per leg', () => {
    const priced = (node: ReturnType<typeof flight>, totalPrice: number) => ({
      ...node,
      totalPrice,
      priceCurrency: 'EUR',
    });
    const { items } = mapReservations(
      legs(
        priced(flight('PX2', FRA, BER, '2026-06-11T08:00:00', '2026-06-11T09:00:00', 'LH 62'), 89.9),
        priced(flight('PX2', BER, HND, '2026-06-11T11:00:00', '2026-06-12T06:00:00', 'LH 63'), 612.35),
      ),
      'test.json',
    );

    expect(items).toHaveLength(1);
    expect(items[0].metadata).toMatchObject({ price: 702.25, priceCurrency: 'EUR' });
  });

  it('leaves a single flight unchanged (two endpoints, no legs array)', () => {
    const { items } = mapReservations(
      [flight('S1', FRA, BER, '2026-06-11T10:00:00', '2026-06-11T12:00:00', 'LH 1')] as any,
      'test.json',
    );

    expect(items).toHaveLength(1);
    expect(items[0].endpoints).toHaveLength(2);
    expect((items[0].metadata as any).legs).toBeUndefined();
  });
});

const station = (name: string, lat?: number, lng?: number) => ({
  name,
  ...(lat === undefined ? {} : { geo: { latitude: lat, longitude: lng } }),
});

const KLU = station('Klagenfurt West', 46.63, 14.28);
const VIL = station('Villach Hbf', 46.62, 13.85);
const HD = station('Heidelberg Hbf', 49.4, 8.67);
const LU = station('Ludwigshafen (Rhein) Mitte', 49.48, 8.43);
const RHG = station('Rheingönheim', 49.44, 8.42);

const train = (
  ref: string,
  dep: ReturnType<typeof station>,
  arr: ReturnType<typeof station>,
  depTime: string,
  arrTime: string,
  trainNumber: string,
  extra: Record<string, unknown> = { totalPrice: 71.67, priceCurrency: 'EUR' },
) => ({
  '@type': 'TrainReservation',
  reservationNumber: ref,
  ...extra,
  reservationFor: {
    trainNumber,
    departureStation: dep,
    arrivalStation: arr,
    departureTime: depTime,
    arrivalTime: arrTime,
  },
});

/** The ticket from the report: four segments under one reference, the fare repeated on each. */
const ticket = (fares?: Record<string, unknown>[]) =>
  [
    train('297199016704', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1', fares?.[0]),
    train('297199016704', VIL, HD, '2026-07-04T06:40:00', '2026-07-04T12:50:00', 'ICE 116', fares?.[1]),
    train('297199016704', HD, LU, '2026-07-04T13:05:00', '2026-07-04T13:30:00', 'S1', fares?.[2]),
    train('297199016704', LU, RHG, '2026-07-04T13:41:00', '2026-07-04T13:55:00', 'STR 7', fares?.[3]),
  ] as unknown as KiReservation[];

describe('kitinerary mapper: a rail ticket with changes (#2895)', () => {
  it('maps the connecting segments of one ticket to one train booking priced once', () => {
    const { items, warnings } = mapReservations(ticket(), 'db-ticket.pdf');

    expect(warnings).toEqual([]);
    expect(items).toHaveLength(1);
    const [booking] = items;
    expect(booking).toMatchObject({
      type: 'train',
      title: 'Train Klagenfurt West → Rheingönheim',
      confirmation_number: '297199016704',
      reservation_time: '2026-07-04T06:12:00',
      reservation_end_time: '2026-07-04T13:55:00',
      needs_review: false,
      source: { fileName: 'db-ticket.pdf', index: 0 },
    });
    expect((booking.endpoints ?? []).map((e) => [e.role, e.sequence, e.name, e.local_time])).toEqual([
      ['from', 0, 'Klagenfurt West', '06:12'],
      ['stop', 1, 'Villach Hbf', '06:40'],
      ['stop', 2, 'Heidelberg Hbf', '13:05'],
      ['stop', 3, 'Ludwigshafen (Rhein) Mitte', '13:41'],
      ['to', 4, 'Rheingönheim', '13:55'],
    ]);
    const metadata = booking.metadata as { legs: Record<string, unknown>[]; price: unknown; train_number: string };
    expect(metadata.price).toBe(71.67);
    expect(metadata.train_number).toBe('S1');
    expect(metadata.legs).toHaveLength(4);
    expect(metadata.legs[1]).toEqual({
      from: 'Villach Hbf',
      to: 'Heidelberg Hbf',
      train_number: 'ICE 116',
      dep_time: '06:40',
      arr_time: '12:50',
    });
  });

  it('adds fares that differ per segment in whole cents', () => {
    const fare = (totalPrice: number) => ({ totalPrice, priceCurrency: 'EUR' });
    const { items } = mapReservations(ticket([fare(0.1), fare(0.2), fare(50), fare(21.37)]), 'db-ticket.pdf');

    expect(items).toHaveLength(1);
    expect((items[0].metadata as { price: unknown }).price).toBe(71.67);
  });

  it('keeps the first price when the segments are priced in different currencies', () => {
    const { items } = mapReservations(
      ticket([{ totalPrice: 20, priceCurrency: 'EUR' }, { totalPrice: 30, priceCurrency: 'CHF' }, {}, {}]),
      'mixed.pdf',
    );

    expect(items[0].metadata).toMatchObject({ price: 20, priceCurrency: 'EUR' });
  });

  it('joins a change of station spelling at the same place by its position', () => {
    const villachArrival = station('Villach Hauptbahnhof', 46.6205, 13.8505);
    const { items } = mapReservations(
      [
        train('R1', KLU, villachArrival, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
        train('R1', VIL, HD, '2026-07-04T06:40:00', '2026-07-04T12:50:00', 'ICE 116'),
      ] as unknown as KiReservation[],
      'spelling.pdf',
    );

    expect(items).toHaveLength(1);
  });

  it('keeps segments under different references, days apart, or out and back as separate bookings', () => {
    const separate = (nodes: ReturnType<typeof train>[]) =>
      mapReservations(nodes as unknown as KiReservation[], 'x.pdf').items.length;

    expect(
      separate([
        train('A1', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
        train('B2', VIL, HD, '2026-07-04T06:40:00', '2026-07-04T12:50:00', 'ICE 116'),
      ]),
    ).toBe(2);
    expect(
      separate([
        train('A1', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
        train('A1', VIL, HD, '2026-07-08T06:40:00', '2026-07-08T12:50:00', 'ICE 116'),
      ]),
    ).toBe(2);
    expect(
      separate([
        train('A1', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
        train('A1', VIL, KLU, '2026-07-04T18:00:00', '2026-07-04T18:20:00', 'S1'),
      ]),
    ).toBe(2);
    expect(
      separate([
        train('A1', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
        train('A1', HD, LU, '2026-07-04T13:05:00', '2026-07-04T13:30:00', 'S1'),
      ]),
    ).toBe(2);
  });

  it('books the total of an outward and a return trip under one order number once', () => {
    const { items } = mapReservations(
      [
        train('ORDER1', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
        train('ORDER1', VIL, HD, '2026-07-04T06:40:00', '2026-07-04T12:50:00', 'ICE 116'),
        train('ORDER1', HD, VIL, '2026-07-11T07:10:00', '2026-07-11T13:20:00', 'ICE 117'),
        train('ORDER1', VIL, KLU, '2026-07-11T13:35:00', '2026-07-11T13:53:00', 'S1'),
      ] as unknown as KiReservation[],
      'return.pdf',
    );

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.metadata?.price ?? null)).toEqual([71.67, null]);
    expect(items[1].metadata).not.toHaveProperty('priceCurrency');
  });

  it('books the total once where a change of station names it two ways and gives no position', () => {
    const { items } = mapReservations(
      [
        train('297199016704', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
        train('297199016704', VIL, HD, '2026-07-04T06:40:00', '2026-07-04T12:50:00', 'ICE 116'),
        train(
          '297199016704',
          HD,
          station('Ludwigshafen(Rhein) Mitte'),
          '2026-07-04T13:05:00',
          '2026-07-04T13:30:00',
          'S1',
        ),
        train('297199016704', station('LU Mitte'), RHG, '2026-07-04T13:41:00', '2026-07-04T13:55:00', 'STR 7'),
      ] as unknown as KiReservation[],
      'db-ticket.pdf',
    );

    expect(items.map((item) => (item.metadata?.legs as unknown[] | undefined)?.length ?? 1)).toEqual([3, 1]);
    expect(items.map((item) => item.metadata?.price ?? null)).toEqual([71.67, null]);
  });

  it('leaves equal fares on separate bookings to the AI import, whose own net reads the document', () => {
    const { items } = mapReservations(
      [
        train('ORDER1', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
        train('ORDER1', VIL, KLU, '2026-07-11T13:35:00', '2026-07-11T13:53:00', 'S1'),
      ] as unknown as KiReservation[],
      'return.pdf',
      'ai',
    );

    expect(items.map((item) => item.metadata?.price)).toEqual([71.67, 71.67]);
  });

  it('keeps the price on the first to depart when the document lists the return first', () => {
    const { items } = mapReservations(
      [
        train('ORDER2', VIL, KLU, '2026-07-11T13:35:00', '2026-07-11T13:53:00', 'S1'),
        train('ORDER2', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1'),
      ] as unknown as KiReservation[],
      'return.pdf',
    );

    expect(items.map((item) => item.metadata?.price ?? null)).toEqual([null, 71.67]);
  });

  it('leaves fares that differ between the bookings of one order alone', () => {
    const fare = (totalPrice: number) => ({ totalPrice, priceCurrency: 'EUR' });
    const { items } = mapReservations(
      [
        train('ORDER3', KLU, VIL, '2026-07-04T06:12:00', '2026-07-04T06:30:00', 'S1', fare(9.8)),
        train('ORDER3', VIL, KLU, '2026-07-11T13:35:00', '2026-07-11T13:53:00', 'S1', fare(12.4)),
      ] as unknown as KiReservation[],
      'return.pdf',
    );

    expect(items.map((item) => item.metadata?.price)).toEqual([9.8, 12.4]);
  });

  it('leaves a single train as it was, with two endpoints and no legs', () => {
    const { items } = mapReservations(ticket().slice(1, 2), 'one.pdf');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: 'ICE 116 (Villach Hbf → Heidelberg Hbf)' });
    expect(items[0].endpoints).toHaveLength(2);
    expect(items[0].metadata).toEqual({ train_number: 'ICE 116', price: 71.67, priceCurrency: 'EUR' });
  });

  it('keeps the segments of a bus or boat ticket apart but books the repeated total once', () => {
    const asType = (type: string, nodes: KiReservation[]) =>
      nodes.map((node) => {
        const trip = node.reservationFor as Record<string, unknown>;
        const reservationFor =
          type === 'BusReservation'
            ? {
                ...trip,
                departureBusStop: trip.departureStation,
                arrivalBusStop: trip.arrivalStation,
                busNumber: 'FlixBus',
              }
            : { ...trip, departureBoatTerminal: trip.departureStation, arrivalBoatTerminal: trip.arrivalStation };
        return { ...node, '@type': type, reservationFor };
      });

    for (const type of ['BusReservation', 'BoatReservation']) {
      const { items } = mapReservations(asType(type, ticket().slice(0, 2)), 'coach.pdf');
      expect(items).toHaveLength(2);
      expect(items.map((item) => item.metadata?.price ?? null)).toEqual([71.67, null]);
      expect(items.map((item) => item.source.index)).toEqual([0, 1]);
    }

    const fares = ticket([{ totalPrice: 10 }, { totalPrice: 25 }]).slice(0, 2);
    const { items } = mapReservations(asType('BusReservation', fares), 'coach.pdf');
    expect(items.map((item) => item.metadata?.price)).toEqual([10, 25]);
  });

  it('does not read a type named after an object property as transport', () => {
    const { items, warnings } = mapReservations(
      [{ '@type': 'constructor', reservationFor: {} }] as unknown as KiReservation[],
      'odd.json',
    );

    expect(items).toEqual([]);
    expect(warnings).toEqual(['Unknown type "constructor" in odd.json[0] — skipped']);
  });
});

describe('kitinerary mapper — printed 12-hour clocks (#2094)', () => {
  it('reads a PM arrival as the afternoon instead of slicing the meridiem off', () => {
    // Before the fix the endpoint carried '01:11', because splitIso sliced
    // characters 11..16 out of '2026-06-11T01:11 PM'. The hour survived and the
    // arrival landed twelve hours early.
    const { items } = mapReservations(
      [flight('PM1', FRA, BER, '2026-06-11T09:51 am', '2026-06-11T01:11 pm', 'LH 300')] as any,
      'meridiem.json',
    );

    expect(items).toHaveLength(1);
    const [dep, arr] = items[0].endpoints!;
    expect(dep.local_time).toBe('09:51');
    expect(arr.local_time).toBe('13:11');
    expect(items[0].reservation_time).toBe('2026-06-11T09:51:00');
    expect(items[0].reservation_end_time).toBe('2026-06-11T13:11:00');
  });

  it('leaves a 24-hour document byte for byte where it was', () => {
    const { items } = mapReservations(
      [flight('H24', FRA, BER, '2026-06-11T10:00:00', '2026-06-11T12:00:00', 'LH 400')] as any,
      'plain.json',
    );

    expect(items[0].reservation_time).toBe('2026-06-11T10:00:00');
    expect(items[0].endpoints![1].local_time).toBe('12:00');
  });

  it('keeps two legs apart that a NaN comparison used to merge', () => {
    // sameConnection does `new Date(value).getTime()`, which is NaN for a
    // printed meridiem, and both of its comparisons are false against NaN, so
    // the guard fell through and merged unrelated legs into one booking.
    const { items } = mapReservations(
      [
        flight('SAME', FRA, BER, '2026-06-11T09:00 am', '2026-06-11T10:00 am', 'LH 500'),
        flight('SAME', HND, FRA, '2026-06-18T09:00 am', '2026-06-18T05:00 pm', 'LH 600'),
      ] as any,
      'two-legs.json',
    );

    expect(items).toHaveLength(2);
  });
});

/**
 * A recognised @type whose mapper cannot build an item used to leave nothing
 * behind: no item, no warning, no log. With a single node in the file the
 * service's own "no reservations found" never fired either, so a hotel voucher
 * the model had read correctly but namelessly came back as an empty preview,
 * indistinguishable from a document holding no booking at all (#2375).
 */
describe('kitinerary mapper — a recognised type that cannot be mapped (#2375)', () => {
  it('warns instead of dropping a lodging whose reservationFor carries no name', () => {
    const { items, warnings } = mapReservations(
      [{ '@type': 'LodgingReservation', reservationNumber: 'HMTRSX', reservationFor: {} }] as any,
      'airbnb.pdf',
    );

    expect(items).toHaveLength(0);
    expect(warnings).toEqual(['Incomplete LodgingReservation in airbnb.pdf[0] (no name in reservationFor) — skipped']);
  });

  it('warns for a flight that carries no reservationFor at all', () => {
    const { items, warnings } = mapReservations(
      [{ '@type': 'FlightReservation', reservationNumber: 'ABC123' }] as any,
      'ticket.eml',
    );

    expect(items).toHaveLength(0);
    expect(warnings).toEqual(['Incomplete FlightReservation in ticket.eml[0] (no reservationFor) — skipped']);
  });

  it('names the type it could not map, TouristAttractionVisit included', () => {
    const { warnings } = mapReservations(
      [{ '@type': 'TouristAttractionVisit', reservationFor: {} }] as any,
      'museum.pdf',
    );

    expect(warnings[0]).toBe(
      'Incomplete TouristAttractionVisit in museum.pdf[0] (no name in reservationFor) — skipped',
    );
  });

  it('keeps the bookings it could map and warns only about the weak one', () => {
    const { items, warnings } = mapReservations(
      [
        flight('MIX1', FRA, BER, '2026-06-11T10:00:00', '2026-06-11T12:00:00', 'LH 800'),
        { '@type': 'LodgingReservation', reservationFor: {} },
      ] as any,
      'trip.eml',
    );

    expect(items).toHaveLength(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('trip.eml[1]');
  });

  it('still warns exactly once for an unknown type', () => {
    const { items, warnings } = mapReservations(
      [{ '@type': 'RocketLaunchReservation', reservationFor: { name: 'Starbase' } }] as any,
      'mars.eml',
    );

    expect(items).toHaveLength(0);
    expect(warnings).toEqual(['Unknown type "RocketLaunchReservation" in mars.eml[0] — skipped']);
  });
});

/**
 * The node a schema-bound provider writes once `reservationFor` has declared
 * fields: the venue inside it, times and price at the root, as the prompt asks.
 * Synthetic data in the shape of a Booking.com print (#2477).
 */
describe('kitinerary mapper: a prompt-shaped AI lodging (#2477)', () => {
  it('maps a LodgingReservation with reservationFor.name to one hotel with its stay and price', () => {
    const { items, warnings } = mapReservations(
      [
        {
          '@type': 'LodgingReservation',
          checkinTime: '2026-09-06T13:00:00',
          checkoutTime: '2026-09-07T11:00:00',
          price: 89.35,
          priceCurrency: 'EUR',
          reservationFor: {
            name: 'Harbour View Inn',
            address: 'Example Road 1, 1000 Sample Town',
            telephone: '+00 000 000 000',
          },
        },
      ] as Parameters<typeof mapReservations>[0],
      'Bestätigung_1.pdf',
    );

    expect(warnings).toEqual([]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'hotel',
      title: 'Harbour View Inn',
      location: 'Example Road 1, 1000 Sample Town',
      _venue: { name: 'Harbour View Inn', phone: '+00 000 000 000' },
      _accommodation: { check_in: '2026-09-06T13:00', check_out: '2026-09-07T11:00' },
      metadata: { check_in_time: '13:00', check_out_time: '11:00', price: 89.35, priceCurrency: 'EUR' },
      source: { fileName: 'Bestätigung_1.pdf', index: 0 },
    });
  });
});
