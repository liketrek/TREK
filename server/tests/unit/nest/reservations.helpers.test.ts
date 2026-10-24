/**
 * The pure halves of ReservationsService's endpoint and day position handling
 * (reservations.helpers.ts): how a trip's rows are grouped by booking for the
 * list, and which endpoint rows a save inserts. The service suites reach them
 * through the database; these pin the shapes on their own.
 */
import type { ReservationEndpointRow } from '../../../src/db/repositories/ReservationEndpoints.repository';
import {
  endpointRows,
  groupDayPositions,
  groupEndpointsByReservation,
} from '../../../src/nest/reservations/reservations.helpers';
import type { EndpointInput } from '../../../src/nest/reservations/reservations.service';

import { describe, expect, it } from 'vitest';

const endpointRow = (id: number, reservationId: number, sequence: number): ReservationEndpointRow => ({
  id,
  reservation_id: reservationId,
  role: sequence === 0 ? 'from' : 'to',
  sequence,
  name: `Stop ${id}`,
  code: null,
  lat: 48.1,
  lng: 11.5,
  timezone: null,
  local_time: null,
  local_date: null,
  created_at: null,
});

const input = (name: string, over: Partial<EndpointInput> = {}): EndpointInput => ({
  role: 'stop',
  name,
  code: null,
  lat: 48.1,
  lng: 11.5,
  timezone: null,
  local_time: null,
  local_date: null,
  ...over,
});

describe('groupEndpointsByReservation', () => {
  it('RESV-HELP-001: groups the endpoint rows by booking and keeps the order they were read in', () => {
    const rows = [endpointRow(1, 10, 0), endpointRow(2, 20, 0), endpointRow(3, 10, 1)];

    const grouped = groupEndpointsByReservation(rows);

    expect([...grouped.keys()]).toEqual([10, 20]);
    expect(grouped.get(10)?.map((e) => e.id)).toEqual([1, 3]);
    expect(grouped.get(20)).toEqual([rows[1]]);
  });

  it('RESV-HELP-002: answers an empty map for a trip without endpoints', () => {
    expect(groupEndpointsByReservation([]).size).toBe(0);
  });
});

describe('groupDayPositions', () => {
  it('RESV-HELP-003: maps each booking to its position on every day it has one', () => {
    const grouped = groupDayPositions([
      { reservation_id: 10, day_id: 1, position: 2 },
      { reservation_id: 20, day_id: 1, position: 0 },
      { reservation_id: 10, day_id: 2, position: 3.5 },
    ]);

    expect(grouped.get(10)).toEqual({ 1: 2, 2: 3.5 });
    expect(grouped.get(20)).toEqual({ 1: 0 });
    expect(grouped.has(30)).toBe(false);
  });
});

describe('endpointRows', () => {
  it('RESV-HELP-004: builds the insert row of an endpoint, with null for each optional field it leaves out', () => {
    const endpoint = { role: 'from', name: 'Berlin Hbf', code: 'BER', lat: 52.5, lng: 13.4 } as EndpointInput;

    expect(endpointRows(7, [endpoint])).toEqual([
      {
        reservation_id: 7,
        role: 'from',
        sequence: 0,
        name: 'Berlin Hbf',
        code: 'BER',
        lat: 52.5,
        lng: 13.4,
        timezone: null,
        local_time: null,
        local_date: null,
      },
    ]);
  });

  it('RESV-HELP-005: skips an endpoint without coordinates and numbers the rest after the skip', () => {
    // An imported station the geocoder could not place arrives with null coordinates.
    const rows = endpointRows(7, [
      input('Unplaced', { lat: null }),
      input('No longitude', { lng: null }),
      input('Munich Hbf'),
      input('Vienna Hbf', { sequence: 9 }),
    ]);

    expect(rows.map((r) => [r.name, r.sequence])).toEqual([
      ['Munich Hbf', 0],
      ['Vienna Hbf', 9],
    ]);
  });
});
