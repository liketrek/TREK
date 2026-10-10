// FE-PLANNER-TRANSPORTEP-001 to -021: the transport booking form both the desktop
// TransportModal and the phone's transport sheet save through.
import { describe, expect, it } from 'vitest';

import { buildDay, buildReservation } from '../../../tests/helpers/factories';
import type { Reservation, ReservationEndpoint } from '../../types';
import type { Airport } from './AirportSelect';
import type { BookingReviewDraft } from './parsedItemToDraft';
import {
  EMPTY_TRANSPORT_FIELDS,
  TRANSPORT_TYPE_OPTIONS,
  airportFromEndpoint,
  blankTransportRoute,
  buildTransportPayload,
  emptyStationWaypoint,
  emptyWaypoint,
  endpointFromAirport,
  endpointFromLocation,
  locationFromEndpoint,
  readTransportMeta,
  seedTransportRoute,
  transportDayOptions,
  transportFieldsFrom,
  transportTypeOf,
  type RouteSeedOptions,
  type TransportDraft,
  type TransportPayloadOptions,
} from './transportEndpoints';

const d1 = buildDay({ id: 1, date: '2026-05-01', day_number: 1 });
const d2 = buildDay({ id: 2, date: '2026-05-02', day_number: 2 });
const d3 = buildDay({ id: 3, date: '2026-05-03', day_number: 3, title: 'Coast' });
const days = [d1, d2, d3];

function ep(
  role: 'from' | 'to' | 'stop',
  sequence: number,
  extra: Partial<ReservationEndpoint> = {}
): ReservationEndpoint {
  return {
    role,
    sequence,
    name: `${role}-${sequence}`,
    code: null,
    lat: 10 + sequence,
    lng: 20 + sequence,
    timezone: null,
    local_time: null,
    local_date: null,
    ...extra,
  };
}

const airport = (iata: string, city = 'City'): Airport => ({
  iata,
  icao: null,
  name: `${iata} Airport`,
  city,
  country: 'X',
  lat: 1,
  lng: 2,
  tz: 'Europe/Berlin',
});

const DESKTOP: RouteSeedOptions = { isEdit: true, stopDaysFromEndpoints: false };
const PHONE: RouteSeedOptions = { isEdit: true, stopDaysFromEndpoints: true };

function draft(overrides: Partial<TransportDraft> = {}): TransportDraft {
  return {
    form: { ...EMPTY_TRANSPORT_FIELDS, title: 'Trip' },
    waypoints: [emptyWaypoint(), emptyWaypoint()],
    trainWaypoints: [emptyStationWaypoint(), emptyStationWaypoint()],
    fromPick: {},
    toPick: {},
    carStops: [],
    ...overrides,
  };
}

const DESKTOP_SAVE: TransportPayloadOptions = {
  reservation: null,
  prefill: null,
  budgetEnabled: false,
  anchorOnStations: false,
  url: '',
};
const PHONE_SAVE: TransportPayloadOptions = {
  reservation: null,
  prefill: null,
  budgetEnabled: false,
  anchorOnStations: true,
};

describe('transport types and endpoints', () => {
  it('FE-PLANNER-TRANSPORTEP-001: the picker offers every type but transit, and an unknown type falls back', () => {
    expect(TRANSPORT_TYPE_OPTIONS.map((o) => o.value)).not.toContain('transit');
    expect(TRANSPORT_TYPE_OPTIONS).toHaveLength(10);
    expect(transportTypeOf('ferry', 'flight')).toBe('ferry');
    expect(transportTypeOf('hotel', 'flight')).toBe('flight');
    expect(transportTypeOf('hotel', 'transport_other')).toBe('transport_other');
  });

  it('FE-PLANNER-TRANSPORTEP-002: an airport and a place become endpoints and back', () => {
    const a = endpointFromAirport(airport('MUC', 'Munich'), 'from', 0, '2026-05-01', '09:00');
    expect(a).toEqual({
      role: 'from',
      sequence: 0,
      name: 'Munich (MUC)',
      code: 'MUC',
      lat: 1,
      lng: 2,
      timezone: 'Europe/Berlin',
      local_date: '2026-05-01',
      local_time: '09:00',
    });
    expect(endpointFromAirport(airport('XXX', ''), 'to', 1, null, null).name).toBe('XXX Airport');
    expect(endpointFromLocation({ name: 'Station', lat: 3, lng: 4 }, 'stop', 2, null, '10:00')).toEqual({
      role: 'stop',
      sequence: 2,
      name: 'Station',
      code: null,
      lat: 3,
      lng: 4,
      timezone: null,
      local_date: null,
      local_time: '10:00',
    });
    expect(airportFromEndpoint(ep('from', 0, { code: 'MUC', name: 'Munich (MUC)', timezone: null }))).toEqual({
      iata: 'MUC',
      icao: null,
      name: 'Munich (MUC)',
      city: 'Munich',
      country: '',
      lat: 10,
      lng: 20,
      tz: '',
    });
    expect(airportFromEndpoint(ep('from', 0))).toBeNull();
    expect(airportFromEndpoint(undefined)).toBeNull();
    expect(locationFromEndpoint(ep('to', 1))).toEqual({ name: 'to-1', lat: 11, lng: 21, address: null });
    expect(locationFromEndpoint(undefined)).toBeNull();
  });

  it('FE-PLANNER-TRANSPORTEP-003: metadata is read from a string or an object, and broken JSON throws', () => {
    expect(readTransportMeta({ metadata: '{"airline":"LH"}' } as Reservation)).toEqual({ airline: 'LH' });
    expect(readTransportMeta({ metadata: '' } as Reservation)).toEqual({});
    expect(readTransportMeta({ metadata: null } as Reservation)).toEqual({});
    expect(readTransportMeta({ metadata: { seat: '1A' } } as unknown as Reservation)).toEqual({ seat: '1A' });
    expect(() => readTransportMeta({ metadata: '{' } as Reservation)).toThrow();
  });

  it('FE-PLANNER-TRANSPORTEP-004: the fields keep a saved day and resolve an import from its dates', () => {
    const saved = buildReservation({
      type: 'bus',
      status: 'confirmed',
      day_id: 2,
      end_day_id: 3,
      reservation_time: '2026-05-01T08:15',
      reservation_end_time: '2026-05-01T10:00',
      confirmation_number: 'ABC',
      notes: 'n',
    });
    expect(transportFieldsFrom(saved, days, 'bus')).toEqual({
      title: saved.title,
      type: 'bus',
      status: 'confirmed',
      start_day_id: 2,
      end_day_id: 3,
      departure_time: '08:15',
      arrival_time: '10:00',
      confirmation_number: 'ABC',
      notes: 'n',
    });
    const imported = buildReservation({
      title: '',
      status: 'pending',
      reservation_time: '2026-05-03T07:00',
      reservation_end_time: null,
    });
    const fields = transportFieldsFrom(imported, days, 'car');
    expect(fields).toMatchObject({ title: '', status: 'pending', start_day_id: 3, end_day_id: '', arrival_time: '' });
  });
});

describe('seedTransportRoute', () => {
  const flight = buildReservation({
    type: 'flight',
    day_id: 1,
    end_day_id: 3,
    endpoints: [
      ep('from', 0, { code: 'MUC', name: 'Munich (MUC)', local_time: '08:00' }),
      ep('stop', 1, { code: 'FRA', name: 'Frankfurt (FRA)', local_time: '12:00', local_date: '2026-05-02' }),
      ep('to', 2, { code: 'JFK', name: 'New York (JFK)', local_time: '15:00' }),
    ],
  });
  const meta = { airline: 'LH', flight_number: 'LH1', seat: '3C' };

  it('FE-PLANNER-TRANSPORTEP-005: a flight seeds its airports; only the phone reads a stopover day from its endpoint', () => {
    const desktop = seedTransportRoute(flight, meta, 'flight', days, DESKTOP);
    expect(desktop.fromPick).toEqual({});
    expect(desktop.toPick).toEqual({});
    expect(desktop.carStops).toEqual([]);
    expect(desktop.trainWaypoints).toEqual([emptyStationWaypoint(), emptyStationWaypoint()]);
    const [first, stop, last] = desktop.waypoints!;
    expect(first).toMatchObject({ depDayId: 1, depTime: '08:00', arrTime: '', airline: 'LH', seat: '3C' });
    expect(first.airport?.iata).toBe('MUC');
    expect(stop).toMatchObject({ arrDayId: '', depDayId: '', arrTime: '12:00', depTime: '12:00', airline: '' });
    expect(last).toMatchObject({ arrDayId: 3, arrTime: '15:00', depTime: '' });

    const phone = seedTransportRoute(flight, meta, 'flight', days, PHONE);
    expect(phone.fromPick).toEqual({});
    expect(phone.toPick).toEqual({});
    expect(phone.waypoints![1]).toMatchObject({ arrDayId: 2, depDayId: 2 });
  });

  it('FE-PLANNER-TRANSPORTEP-006: saved legs win over the endpoints, the booking code stays off the legs', () => {
    const withLegs = {
      ...meta,
      legs: [
        {
          dep_day_id: 1,
          dep_time: '07:00',
          arr_day_id: 1,
          arr_time: '09:30',
          airline: 'OS',
          confirmation_number: 'L1',
        },
        { arr_day_id: 2, arr_time: '11:00', dep_day_id: 2, dep_time: '13:00', flight_number: 'UA9' },
      ],
    };
    const [first, stop, last] = seedTransportRoute(
      { ...flight, confirmation_number: 'BOOK' },
      withLegs,
      'flight',
      days,
      DESKTOP
    ).waypoints!;
    expect(first).toMatchObject({ depTime: '07:00', airline: 'OS', confirmation_number: 'L1', flight_number: 'LH1' });
    expect(stop).toMatchObject({ arrDayId: 1, arrTime: '09:30', depDayId: 2, depTime: '13:00', flight_number: 'UA9' });
    expect(last).toMatchObject({ arrDayId: 2, arrTime: '11:00', confirmation_number: '' });
  });

  it('FE-PLANNER-TRANSPORTEP-007: an import resolves each airport day from its own date, an edit does not', () => {
    const imported = {
      ...flight,
      day_id: null,
      end_day_id: null,
      endpoints: [
        ep('from', 0, { code: 'MUC', local_date: '2026-05-01' }),
        ep('to', 1, { code: 'JFK', local_date: '2026-05-03' }),
      ],
    };
    const review = seedTransportRoute(imported, {}, 'flight', days, { ...DESKTOP, isEdit: false }).waypoints!;
    expect(review.map((w) => [w.depDayId, w.arrDayId])).toEqual([
      [1, 1],
      [3, 3],
    ]);
    const edit = seedTransportRoute(imported, {}, 'flight', days, DESKTOP).waypoints!;
    expect(edit.map((w) => [w.depDayId, w.arrDayId])).toEqual([
      ['', ''],
      ['', ''],
    ]);
  });

  it('FE-PLANNER-TRANSPORTEP-008: a legacy flight without both endpoints seeds two rows from the flat fields', () => {
    const legacy = buildReservation({
      type: 'flight',
      day_id: 1,
      end_day_id: null,
      reservation_time: '2026-05-01T06:30',
      reservation_end_time: '2026-05-01T09:45',
      endpoints: [ep('from', 0, { code: 'MUC' })],
    });
    const [dep, arr] = seedTransportRoute(legacy, meta, 'flight', days, DESKTOP).waypoints!;
    expect(dep).toMatchObject({ depDayId: 1, depTime: '06:30', airline: 'LH', flight_number: 'LH1', seat: '3C' });
    expect(dep.airport?.iata).toBe('MUC');
    expect(arr).toMatchObject({ arrDayId: 1, arrTime: '09:45', airport: null });
  });

  it('FE-PLANNER-TRANSPORTEP-009: a train seeds its stations and clears the plain endpoints on both shells', () => {
    const train = buildReservation({
      type: 'train',
      day_id: 2,
      end_day_id: 2,
      endpoints: [ep('from', 0, { local_time: '09:00' }), ep('to', 1, { local_time: '11:00' })],
    });
    const route = seedTransportRoute(
      train,
      { train_number: 'ICE 1', platform: '4', seat: '22' },
      'train',
      days,
      DESKTOP
    );
    expect(route.fromPick).toEqual({});
    expect(route.toPick).toEqual({});
    expect(route.trainWaypoints![0]).toMatchObject({ depDayId: 2, train_number: 'ICE 1', platform: '4', seat: '22' });
    expect(route.trainWaypoints![0].location?.name).toBe('from-0');
    expect(route.trainWaypoints![1]).toMatchObject({ arrDayId: 2, arrTime: '11:00' });

    const legacy = { ...train, endpoints: [] };
    const [dep, arr] = seedTransportRoute(legacy, { train_number: 'RE' }, 'train', days, DESKTOP).trainWaypoints!;
    expect(dep).toMatchObject({ location: null, depDayId: 2, train_number: 'RE' });
    expect(arr).toMatchObject({ location: null, arrDayId: 2 });
  });

  it('FE-PLANNER-TRANSPORTEP-010: a car reads its stops in order; another type keeps none; the rest is reset', () => {
    const car = buildReservation({
      type: 'car',
      endpoints: [ep('from', 0), ep('stop', 2, { local_time: '14:00' }), ep('stop', 1), ep('to', 3)],
    });
    const desktop = seedTransportRoute(car, {}, 'car', days, DESKTOP);
    expect(desktop.fromPick?.location?.name).toBe('from-0');
    expect(desktop.toPick?.location?.name).toBe('to-3');
    expect(desktop.carStops).toEqual([
      { location: { name: 'stop-1', lat: 11, lng: 21, address: null }, time: '' },
      { location: { name: 'stop-2', lat: 12, lng: 22, address: null }, time: '14:00' },
    ]);
    expect(desktop.waypoints).toEqual([emptyWaypoint(), emptyWaypoint()]);
    expect(desktop.trainWaypoints).toEqual([emptyStationWaypoint(), emptyStationWaypoint()]);

    const phone = seedTransportRoute(car, {}, 'car', days, PHONE);
    expect(phone.waypoints).toEqual([emptyWaypoint(), emptyWaypoint()]);
    expect(phone.trainWaypoints).toEqual([emptyStationWaypoint(), emptyStationWaypoint()]);

    const bus = seedTransportRoute({ ...car, type: 'bus', endpoints: [] }, {}, 'bus', days, DESKTOP);
    expect(bus).toEqual({
      fromPick: { location: undefined },
      toPick: { location: undefined },
      waypoints: [emptyWaypoint(), emptyWaypoint()],
      trainWaypoints: [emptyStationWaypoint(), emptyStationWaypoint()],
      carStops: [],
    });
  });

  it('FE-PLANNER-TRANSPORTEP-011: a new booking starts every row on the given day', () => {
    expect(blankTransportRoute(2)).toEqual({
      fromPick: {},
      toPick: {},
      waypoints: [emptyWaypoint(2), emptyWaypoint(2)],
      trainWaypoints: [emptyStationWaypoint(2), emptyStationWaypoint(2)],
      carStops: [],
    });
  });

  it('FE-PLANNER-TRANSPORTEP-012: the day options lead with a dash and badge each day with its date or number', () => {
    const t = (key: string, params?: Record<string, string | number>) => `${key}:${params?.n}`;
    const options = transportDayOptions(
      [d1, d3, buildDay({ id: 9, date: null, title: 'Spare', day_number: 4 })],
      t,
      'en-US'
    );
    expect(options[0]).toEqual({ value: '', label: '—' });
    expect(options[1]).toMatchObject({ value: 1, label: 'dayplan.dayN:1' });
    expect(options[1]).toHaveProperty('badge', expect.stringContaining('May'));
    expect(options[2]).toMatchObject({ value: 3, label: 'Coast' });
    expect(options[3]).toEqual({ value: 9, label: 'Spare', badge: 'dayplan.dayN:4' });
  });
});

describe('buildTransportPayload', () => {
  it('FE-PLANNER-TRANSPORTEP-013: a plain booking saves its own days, times and endpoints', () => {
    const payload = buildTransportPayload(
      draft({
        form: {
          ...EMPTY_TRANSPORT_FIELDS,
          title: 'Bus',
          type: 'bus',
          status: 'confirmed',
          start_day_id: 1,
          end_day_id: '',
          departure_time: '09:00',
          arrival_time: '12:00',
          confirmation_number: '',
          notes: '',
        },
        fromPick: { location: { name: 'A', lat: 1, lng: 2 } },
        toPick: { location: { name: 'B', lat: 3, lng: 4 } },
      }),
      days,
      DESKTOP_SAVE
    );
    expect(payload).toEqual({
      title: 'Bus',
      type: 'bus',
      status: 'confirmed',
      day_id: 1,
      end_day_id: null,
      reservation_time: '2026-05-01T09:00',
      reservation_end_time: '2026-05-01T12:00',
      location: null,
      confirmation_number: null,
      notes: null,
      url: null,
      metadata: {},
      endpoints: [
        endpointFromLocation({ name: 'A', lat: 1, lng: 2 }, 'from', 0, '2026-05-01', '09:00'),
        endpointFromLocation({ name: 'B', lat: 3, lng: 4 }, 'to', 1, '2026-05-01', '12:00'),
      ],
      needs_review: false,
    });
  });

  it('FE-PLANNER-TRANSPORTEP-014: the phone sends no url and an empty metadata as an empty object; a url is sent when given', () => {
    const phone = buildTransportPayload(draft(), days, PHONE_SAVE);
    expect(phone).not.toHaveProperty('url');
    expect(phone.metadata).toEqual({});
    expect(buildTransportPayload(draft(), days, { ...DESKTOP_SAVE, url: 'https://x.test' }).url).toBe('https://x.test');
  });

  it('FE-PLANNER-TRANSPORTEP-015: a flight with a stopover writes its legs and keeps the planner positions', () => {
    const reservation = buildReservation({
      type: 'flight',
      metadata: JSON.stringify({ legs: [{ day_positions: { 1: 0.5 } }, {}] }),
    });
    const waypoints = [
      {
        ...emptyWaypoint(1),
        airport: airport('MUC'),
        depTime: '08:00',
        airline: 'LH',
        flight_number: 'LH1',
        seat: '1A',
      },
      { ...emptyWaypoint(), airport: null },
      {
        ...emptyWaypoint(2),
        airport: airport('FRA'),
        arrTime: '09:00',
        depTime: '10:00',
        confirmation_number: 'SEG',
      },
      { ...emptyWaypoint(3), airport: airport('JFK'), arrTime: '14:00' },
    ];
    const payload = buildTransportPayload(
      draft({ form: { ...EMPTY_TRANSPORT_FIELDS, title: 'Fly', type: 'flight' }, waypoints }),
      days,
      { ...DESKTOP_SAVE, reservation }
    );
    expect(payload).toMatchObject({
      day_id: 1,
      end_day_id: 3,
      reservation_time: '2026-05-01T08:00',
      reservation_end_time: '2026-05-03T14:00',
    });
    expect(payload.metadata).toEqual({
      airline: 'LH',
      flight_number: 'LH1',
      departure_airport: 'MUC',
      departure_timezone: 'Europe/Berlin',
      arrival_airport: 'JFK',
      arrival_timezone: 'Europe/Berlin',
      legs: [
        {
          from: 'MUC',
          to: 'FRA',
          airline: 'LH',
          flight_number: 'LH1',
          seat: '1A',
          dep_day_id: 1,
          dep_time: '08:00',
          arr_day_id: 2,
          arr_time: '09:00',
          day_positions: { 1: 0.5 },
        },
        {
          from: 'FRA',
          to: 'JFK',
          confirmation_number: 'SEG',
          dep_day_id: 2,
          dep_time: '10:00',
          arr_day_id: 3,
          arr_time: '14:00',
        },
      ],
      seat: '1A',
    });
    expect(
      (payload.endpoints as { role: string; local_date: string | null }[]).map((e) => [e.role, e.local_date])
    ).toEqual([
      ['from', '2026-05-01'],
      ['stop', '2026-05-02'],
      ['to', '2026-05-03'],
    ]);
  });

  it('FE-PLANNER-TRANSPORTEP-016: a two-airport flight keeps the flat metadata with no legs', () => {
    const payload = buildTransportPayload(
      draft({
        form: { ...EMPTY_TRANSPORT_FIELDS, title: 'Fly', type: 'flight' },
        waypoints: [
          { ...emptyWaypoint(1), airport: airport('MUC') },
          { ...emptyWaypoint(1), airport: airport('BER') },
        ],
      }),
      days,
      DESKTOP_SAVE
    );
    expect(payload.metadata).not.toHaveProperty('legs');
    expect(payload.reservation_time).toBeNull();
  });

  it('FE-PLANNER-TRANSPORTEP-017: the desktop anchors a train on its raw rows, the phone on the picked stations', () => {
    const station = (name: string) => ({ name, lat: 1, lng: 1 });
    const trainWaypoints = [
      { ...emptyStationWaypoint(1), depTime: '07:00', train_number: 'RAW' },
      { ...emptyStationWaypoint(2), location: station('A'), depTime: '09:00', train_number: 'ICE' },
      { ...emptyStationWaypoint(3), location: station('B'), arrTime: '12:00' },
    ];
    const form = { ...EMPTY_TRANSPORT_FIELDS, title: 'Rail', type: 'train' as const };
    const desktop = buildTransportPayload(draft({ form, trainWaypoints }), days, DESKTOP_SAVE);
    expect(desktop).toMatchObject({ day_id: 1, end_day_id: 3, reservation_time: '2026-05-01T07:00' });
    expect(desktop.metadata).toEqual({ train_number: 'RAW' });
    const phone = buildTransportPayload(draft({ form, trainWaypoints }), days, PHONE_SAVE);
    expect(phone).toMatchObject({ day_id: 2, end_day_id: 3, reservation_time: '2026-05-02T09:00' });
    expect(phone.metadata).toEqual({ train_number: 'ICE' });
    // A train without a single picked station still keeps its day and time.
    const bare = [{ ...emptyStationWaypoint(1), depTime: '06:00' }, emptyStationWaypoint(1)];
    expect(buildTransportPayload(draft({ form, trainWaypoints: bare }), days, PHONE_SAVE)).toMatchObject({
      day_id: 1,
      reservation_time: '2026-05-01T06:00',
      endpoints: [],
    });
  });

  it('FE-PLANNER-TRANSPORTEP-018: a train with three stations writes legs and dates the last stop from the first', () => {
    const station = (name: string) => ({ name, lat: 1, lng: 1 });
    const trainWaypoints = [
      { ...emptyStationWaypoint(1), location: station('A'), depTime: '07:00', platform: '3' },
      { ...emptyStationWaypoint(''), location: station('B'), depTime: '08:00' },
      { ...emptyStationWaypoint(''), location: station('C'), arrTime: '09:00' },
    ];
    const payload = buildTransportPayload(
      draft({ form: { ...EMPTY_TRANSPORT_FIELDS, title: 'Rail', type: 'train' }, trainWaypoints }),
      days,
      DESKTOP_SAVE
    );
    expect((payload.metadata as { legs: unknown[] }).legs).toHaveLength(2);
    expect((payload.endpoints as { local_date: string | null }[]).map((e) => e.local_date)).toEqual([
      '2026-05-01',
      null,
      '2026-05-01',
    ]);
    expect(payload.reservation_end_time).toBe('2026-05-01T09:00');
  });

  it('FE-PLANNER-TRANSPORTEP-019: a car writes its picked stops between pick-up and return', () => {
    const payload = buildTransportPayload(
      draft({
        form: { ...EMPTY_TRANSPORT_FIELDS, title: 'Car', type: 'car', start_day_id: 2 },
        fromPick: { location: { name: 'Pick', lat: 1, lng: 1 } },
        toPick: { location: { name: 'Drop', lat: 2, lng: 2 } },
        carStops: [
          { location: { name: 'S1', lat: 5, lng: 5 }, time: '11:00' },
          { location: null, time: '12:00' },
          { location: { name: 'S2', lat: 6, lng: 6 }, time: '' },
        ],
      }),
      days,
      DESKTOP_SAVE
    );
    expect((payload.endpoints as ReservationEndpoint[]).map((e) => [e.role, e.sequence, e.name, e.local_time])).toEqual(
      [
        ['from', 0, 'Pick', null],
        ['stop', 1, 'S1', '11:00'],
        ['stop', 2, 'S2', null],
        ['to', 3, 'Drop', null],
      ]
    );
  });

  it('FE-PLANNER-TRANSPORTEP-020: a transit itinerary and AirTrail ids survive a re-save while from and to stay put', () => {
    const reservation = buildReservation({
      type: 'bus',
      metadata: { transit: { legs: [1] }, airtrail_ids: [7] } as unknown as string,
      endpoints: [ep('from', 0), ep('stop', 1, { name: 'Change' }), ep('to', 2)],
    });
    const same = draft({
      form: { ...EMPTY_TRANSPORT_FIELDS, title: 'Bus', type: 'bus' },
      fromPick: { location: { name: 'from-0', lat: 10, lng: 20 } },
      toPick: { location: { name: 'to-2', lat: 12, lng: 22 } },
    });
    const kept = buildTransportPayload(same, days, { ...DESKTOP_SAVE, reservation });
    expect(kept.metadata).toEqual({ transit: { legs: [1] }, airtrail_ids: [7] });
    expect((kept.endpoints as ReservationEndpoint[]).map((e) => e.name)).toEqual(['from-0', 'Change', 'to-2']);

    const moved = buildTransportPayload({ ...same, toPick: { location: { name: 'Else', lat: 0, lng: 0 } } }, days, {
      ...DESKTOP_SAVE,
      reservation,
    });
    expect(moved.metadata).toEqual({ airtrail_ids: [7] });
    expect((moved.endpoints as ReservationEndpoint[]).map((e) => e.name)).toEqual(['from-0', 'Else']);
  });

  it('FE-PLANNER-TRANSPORTEP-021: a reviewed import with a price creates its cost, only on create and with the budget on', () => {
    const prefill = { title: 'Fly', metadata: { price: 120, priceCurrency: 'eur' } } as BookingReviewDraft;
    const opts = { ...DESKTOP_SAVE, prefill, budgetEnabled: true };
    expect(buildTransportPayload(draft(), days, opts).create_budget_entry).toEqual(
      expect.objectContaining({ total_price: 120, currency: 'EUR' })
    );
    expect(buildTransportPayload(draft(), days, { ...opts, budgetEnabled: false })).not.toHaveProperty(
      'create_budget_entry'
    );
    expect(buildTransportPayload(draft(), days, { ...opts, reservation: buildReservation() })).not.toHaveProperty(
      'create_budget_entry'
    );
  });
});
