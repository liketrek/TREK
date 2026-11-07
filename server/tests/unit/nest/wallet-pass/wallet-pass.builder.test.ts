import {
  buildWalletPassRequest,
  clean,
  displayTime,
  kindOf,
  serialFor,
  withOffset,
  type WalletPassSource,
  type WalletWords,
} from '../../../../src/nest/wallet-pass/wallet-pass.builder';

import { describe, expect, it } from 'vitest';

const WORDS: WalletWords = {
  locale: 'en-GB',
  departure: 'Departure',
  arrival: 'Arrival',
  pickup: 'Pickup',
  dropOff: 'Drop-off',
  checkIn: 'Check-in',
  checkOut: 'Check-out',
  time: 'Time',
  seat: 'Seat',
  platform: 'Platform',
  flightNumber: 'Flight No.',
  trainNumber: 'Train No.',
  airline: 'Airline',
  confirmation: 'Booking Code',
  location: 'Location / Address',
};

function source(
  over: Partial<WalletPassSource['reservation']> = {},
  rest: Partial<WalletPassSource> = {},
): WalletPassSource {
  return {
    reservation: {
      id: 7,
      trip_id: 42,
      title: 'Hotel Granvia Kyoto',
      type: 'hotel',
      reservation_time: '2027-04-02T15:00',
      reservation_end_time: '2027-04-06T11:00',
      confirmation_number: 'HG-48213',
      location: 'Karasuma-dori, Kyoto',
      created_at: '2026-11-01 10:00:00',
      metadata: { check_in_time: '15:00', check_out_time: '11:00' },
      ...over,
    },
    endpoints: [],
    tripTitle: 'Japan 2027',
    place: { lat: 34.985, lng: 135.758, name: 'Hotel Granvia Kyoto' },
    ...rest,
  };
}

describe('wallet pass builder', () => {
  it('WALLET-B-001: maps every booking type to a pass kind', () => {
    expect(kindOf('flight')).toBe('flight');
    expect(kindOf('cruise')).toBe('boat');
    expect(kindOf('ferry')).toBe('boat');
    expect(kindOf('transit')).toBe('bus');
    expect(kindOf('taxi')).toBe('car');
    expect(kindOf('hotel')).toBe('hotel');
    expect(kindOf('tour')).toBe('tour');
    expect(kindOf('transport_other')).toBe('other');
    expect(kindOf(null)).toBe('other');
  });

  it('WALLET-B-002: cleans texts of links and shortens them', () => {
    expect(clean('Pay at https://evil.example/now please', 60)).toBe('Pay at please');
    expect(clean('see www.example.com', 60)).toBe('see');
    expect(clean('  a   b  ', 10)).toBe('a b');
    expect(clean('x'.repeat(30), 10)).toBe(`${'x'.repeat(9)}…`);
    expect(clean('https://only.link', 10)).toBeUndefined();
    expect(clean(null, 10)).toBeUndefined();
  });

  it('WALLET-B-003: gives a wall-clock time the offset its zone has then', () => {
    expect(withOffset('2027-04-02', '15:00', 'Asia/Tokyo')).toBe('2027-04-02T15:00:00+09:00');
    expect(withOffset('2027-07-01', '08:30', 'Europe/Berlin')).toBe('2027-07-01T08:30:00+02:00');
    expect(withOffset('2027-01-15', '08:30', 'Europe/Berlin')).toBe('2027-01-15T08:30:00+01:00');
    expect(withOffset('2027-01-15', '08:30', 'America/St_Johns')).toBe('2027-01-15T08:30:00-03:30');
    expect(withOffset('2027-01-15', null, null)).toBe('2027-01-15T00:00:00+00:00');
    expect(withOffset('2027-01-15', '10:00', 'Not/AZone')).toBe('2027-01-15T10:00:00+00:00');
  });

  it('WALLET-B-004: shows a time as the wall clock says it, in the user language', () => {
    expect(displayTime('en-GB', '2027-04-02', '15:00')).toMatch(/Fri.*2 Apr.*15:00/);
    expect(displayTime('de-DE', '2027-04-02', null)).toMatch(/Fr.*2\. Apr/);
    expect(displayTime('no-such-LOCALE-x', '2027-04-02', null)).toMatch(/Apr/);
  });

  it('WALLET-B-005: a hotel becomes a pass with check-in, check-out, place and QR code', () => {
    const request = buildWalletPassRequest(source(), WORDS);
    expect(request).toMatchObject({
      kind: 'hotel',
      title: 'Hotel Granvia Kyoto',
      trip: 'Japan 2027',
      start: '2027-04-02T15:00:00+09:00',
      end: '2027-04-06T11:00:00+09:00',
      location: { latitude: 34.985, longitude: 135.758, name: 'Hotel Granvia Kyoto' },
      confirmation: { label: 'Booking Code', value: 'HG-48213' },
      locale: 'en-GB',
    });
    expect(request?.details?.map((d) => d.label)).toEqual(['Check-in', 'Check-out']);
    expect(request?.back).toEqual([{ label: 'Location / Address', value: 'Karasuma-dori, Kyoto' }]);
    expect(request?.serial).toBe(serialFor(source().reservation));
    expect(request?.serial).toMatch(/^trek-7-[0-9a-f]{16}$/);
  });

  it('WALLET-B-006: a flight becomes a boarding pass from and to, in the departure zone', () => {
    const request = buildWalletPassRequest(
      source(
        {
          title: 'LH 716',
          type: 'flight',
          reservation_time: '2027-04-01T13:25',
          reservation_end_time: null,
          metadata: { airline: 'Lufthansa', flight_number: 'LH716', seat: '34K' },
        },
        {
          place: null,
          endpoints: [
            {
              role: 'from',
              name: 'Frankfurt',
              code: 'FRA',
              lat: 50.03,
              lng: 8.57,
              timezone: 'Europe/Berlin',
              local_date: '2027-04-01',
              local_time: '13:25',
            },
            {
              role: 'to',
              name: 'Tokyo Haneda',
              code: 'HND',
              lat: 35.55,
              lng: 139.78,
              timezone: 'Asia/Tokyo',
              local_date: '2027-04-02',
              local_time: '08:50',
            },
          ],
        },
      ),
      WORDS,
    );
    expect(request).toMatchObject({
      kind: 'flight',
      start: '2027-04-01T13:25:00+02:00',
      end: '2027-04-02T08:50:00+09:00',
      from: { code: 'FRA', name: 'Frankfurt' },
      to: { code: 'HND', name: 'Tokyo Haneda' },
      location: { latitude: 50.03, longitude: 8.57, name: 'Frankfurt' },
    });
    expect(request?.details?.map((d) => d.label)).toEqual(['Departure', 'Flight No.', 'Seat', 'Arrival']);
    expect(request?.details?.[1]?.value).toBe('Lufthansa LH716');
  });

  it('WALLET-B-007: a journey without both ends is a plain booking; a train shows its number and platform', () => {
    const half = buildWalletPassRequest(source({ type: 'train', metadata: {} }, { place: null, endpoints: [] }), WORDS);
    expect(half?.kind).toBe('other');
    expect(half?.from).toBeUndefined();

    const train = buildWalletPassRequest(
      source(
        { type: 'train', metadata: { train_number: 'ICE 597', platform: '7', seat: '61' } },
        {
          place: null,
          endpoints: [
            {
              role: 'from',
              name: 'Berlin Hbf',
              code: null,
              lat: 52.52,
              lng: 13.37,
              timezone: null,
              local_date: null,
              local_time: null,
            },
            {
              role: 'to',
              name: 'München Hbf',
              code: null,
              lat: 48.14,
              lng: 11.56,
              timezone: null,
              local_date: null,
              local_time: null,
            },
          ],
        },
      ),
      WORDS,
    );
    expect(train?.kind).toBe('train');
    // No zone on the endpoint: looked up from its coordinates.
    expect(train?.start).toBe('2027-04-02T15:00:00+02:00');
    // At most four lines under the title; the arrival is the one that gives way.
    expect(train?.details?.map((d) => d.label)).toEqual(['Departure', 'Train No.', 'Seat', 'Platform']);
    expect(train?.from).toEqual({ name: 'Berlin Hbf' });
  });

  it('WALLET-B-008: a car shows pickup and drop-off, a restaurant its time', () => {
    const car = buildWalletPassRequest(source({ type: 'car', title: 'Sixt' }), WORDS);
    expect(car?.details?.map((d) => d.label)).toEqual(['Pickup', 'Drop-off']);
    const dinner = buildWalletPassRequest(
      source({ type: 'restaurant', title: 'Gion Karyo', reservation_end_time: null }),
      WORDS,
    );
    expect(dinner?.kind).toBe('restaurant');
    expect(dinner?.details).toEqual([{ label: 'Time', value: expect.stringMatching(/15:00/) }]);
    expect(dinner?.end).toBeUndefined();
  });

  it('WALLET-B-009: a confirmation that is no code goes on the back; no date means no pass', () => {
    const odd = buildWalletPassRequest(source({ confirmation_number: 'Ref: 12#34 (see mail)' }), WORDS);
    expect(odd?.confirmation).toBeUndefined();
    expect(odd?.back).toContainEqual({ label: 'Booking Code', value: 'Ref: 12#34 (see mail)' });
    expect(buildWalletPassRequest(source({ reservation_time: null }), WORDS)).toBeNull();
    expect(buildWalletPassRequest(source({ reservation_time: 'soon' }), WORDS)).toBeNull();
  });

  it('WALLET-B-010: a booking without place or trip still makes a pass, its title cleaned', () => {
    const request = buildWalletPassRequest(
      source(
        { title: 'Museum https://tickets.example', type: 'event', location: null, confirmation_number: null },
        { place: null, tripTitle: null },
      ),
      WORDS,
    );
    expect(request).toMatchObject({ kind: 'event', title: 'Museum' });
    expect(request?.trip).toBeUndefined();
    expect(request?.location).toBeUndefined();
    expect(request?.back).toBeUndefined();
    expect(request?.start).toBe('2027-04-02T15:00:00+00:00');
  });
});
