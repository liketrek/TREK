import { Reservations } from '../../../src/db/entities/Reservations.entity';
import {
  AirtrailClient,
  type AirtrailAirport,
  type AirtrailFlightRaw,
} from '../../../src/nest/integrations/airtrail.client';
import { AirtrailService } from '../../../src/nest/integrations/airtrail.service';
import { makeBudgetItem } from '../../helpers/factories/budget';
import { updateRows } from '../../helpers/factories/rows';
import type { CaseGroup } from './types';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { vi } from 'vitest';

/**
 * The notice a booking write sends the other travellers of the trip
 * (`notifyBookingChange`), which reaches their bell a beat after the write
 * answered. MCP sends it since REST and the tools share the booking use cases.
 */
const BOOKING_NOTICE = { event: 'notification:new', user: 'others' } as const;

/** A hotel booking's stay, written by the booking and announced to every socket before the booking's own events. */
const STAY_STOP_ADDED = [
  { event: 'assignment:created', all: true },
  { event: 'place:updated', all: true },
  { event: 'assignment:reordered', all: true },
] as const;

/** The stop of a stay that goes, and the order of its day. */
const STAY_STOP_REMOVED = [
  { event: 'assignment:deleted', all: true },
  { event: 'assignment:reordered', all: true },
] as const;

/** A walk and one subway ride in Osaka, the morning of the scene's first day (09:00 to 09:30 local). */
const TRANSIT_FROM = { name: 'Namba', lat: 34.667, lng: 135.501 };
const TRANSIT_TO = { name: 'Umeda', lat: 34.702, lng: 135.496 };
const TRANSIT_ITINERARY = {
  startTime: '2027-05-03T00:00:00Z',
  endTime: '2027-05-03T00:30:00Z',
  duration: 1800,
  transfers: 0,
  walkSeconds: 300,
  legs: [
    {
      mode: 'WALK',
      from: { ...TRANSIT_FROM, name: 'START', time: '2027-05-03T00:00:00Z', scheduledTime: null, track: null },
      to: {
        name: 'Namba Station',
        lat: 34.666,
        lng: 135.5,
        time: '2027-05-03T00:05:00Z',
        scheduledTime: null,
        track: null,
      },
      duration: 300,
      distance: 300,
      headsign: null,
      line: null,
      lineColor: null,
      lineTextColor: null,
      agency: null,
      intermediateStops: 0,
      geometry: null,
      geometryPrecision: 6,
    },
    {
      mode: 'SUBWAY',
      from: {
        name: 'Namba Station',
        lat: 34.666,
        lng: 135.5,
        time: '2027-05-03T00:05:00Z',
        scheduledTime: null,
        track: '1',
      },
      to: { ...TRANSIT_TO, name: 'END', time: '2027-05-03T00:30:00Z', scheduledTime: null, track: '2' },
      duration: 1500,
      distance: 5000,
      headsign: 'Umeda',
      line: 'M',
      lineColor: '#E5171F',
      lineTextColor: '#FFFFFF',
      agency: 'Osaka Metro',
      intermediateStops: 3,
      geometry: 'encoded',
      geometryPrecision: 6,
    },
  ],
};

function airport(id: number, iata: string, name: string, lat: number, lon: number, tz: string): AirtrailAirport {
  return { id, icao: null, iata, name, lat, lon, tz, country: null };
}

/** The flight the stubbed AirTrail account holds, on the scene's first day. */
const AIRTRAIL_FLIGHT: AirtrailFlightRaw = {
  id: 501,
  from: airport(1, 'BRU', 'Brussels', 50.9014, 4.4844, 'Europe/Brussels'),
  to: airport(2, 'HEL', 'Helsinki-Vantaa', 60.3172, 24.9633, 'Europe/Helsinki'),
  date: '2027-05-03',
  datePrecision: 'day',
  departure: '2027-05-03T06:00:00.000+00:00',
  arrival: '2027-05-03T09:30:00.000+00:00',
  departureScheduled: null,
  arrivalScheduled: null,
  airline: { id: 1, icao: 'FIN', iata: 'AY', name: 'Finnair' },
  flightNumber: 'AY1502',
  aircraft: null,
  aircraftReg: null,
  note: null,
  seats: [],
};

/** A connected AirTrail account holding AIRTRAIL_FLIGHT, without the network. */
function stubAirtrail(app: INestApplication): () => void {
  const spies = [
    vi
      .spyOn(app.get(AirtrailService), 'getAirtrailCredentials')
      .mockResolvedValue({ baseUrl: 'https://airtrail.example.test', apiKey: 'key', allowInsecureTls: false }),
    vi.spyOn(app.get(AirtrailClient), 'listFlights').mockResolvedValue([AIRTRAIL_FLIGHT]),
  ];
  return () => spies.forEach((spy) => spy.mockRestore());
}

/** Sets a booking's type, as an edit of the booking form does. */
function retype(app: INestApplication, id: number, type: string): Promise<number> {
  return updateRows(app.get(MikroORM), Reservations, { id }, { type });
}

/** Bookings: reservations, transports, transit, stays and the AirTrail import. */
export const bookings: CaseGroup = {
  name: 'bookings',
  prefix: 'BCP-BOOK',
  cases: [
    {
      tool: 'create_accommodation',
      needs: ['place'],
      args: (s) => ({
        tripId: s.trip.id,
        place_id: s.place.id,
        start_day_id: s.days[0].id,
        end_day_id: s.days[1].id,
      }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/accommodations`,
        body: (s) => ({ place_id: s.place.id, start_day_id: s.days[0].id, end_day_id: s.days[1].id }),
      },
      // The stay, the ping for its partner hotel booking, then the check-in stop
      // the day plan gains (with the stop's time stamped on the hotel place),
      // which the booking tab has not drawn yet either.
      expect: ['accommodation:created', 'reservation:created', ...STAY_STOP_ADDED],
    },
    {
      tool: 'update_accommodation',
      needs: ['stay'],
      args: (s) => ({ tripId: s.trip.id, accommodationId: s.stay.id, notes: 'Late arrival' }),
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/accommodations/${s.stay.id}`,
        body: () => ({ notes: 'Late arrival' }),
      },
      expect: ['accommodation:updated'],
    },
    {
      tool: 'delete_accommodation',
      needs: ['stay'],
      args: (s) => ({ tripId: s.trip.id, accommodationId: s.stay.id }),
      rest: { method: 'delete', path: (s) => `/api/trips/${s.trip.id}/accommodations/${s.stay.id}` },
      // The stop goes first, then the partner booking, then the stay (MCP names
      // it `id` too and lists the bookings it took along).
      expect: [...STAY_STOP_REMOVED, 'reservation:deleted', 'accommodation:deleted'],
    },
    {
      tool: 'import_airtrail_flights',
      args: (s) => ({ tripId: s.trip.id, flightIds: [String(AIRTRAIL_FLIGHT.id)] }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/reservations/import/airtrail`,
        body: () => ({ flightIds: [String(AIRTRAIL_FLIGHT.id)] }),
      },
      stub: stubAirtrail,
      expect: ['reservation:created'],
    },
    {
      // A hotel with its stay and a price: the stop, then the stay ping, the cost and the booking.
      tool: 'create_reservation',
      needs: ['place', 'member'],
      args: (s) => ({
        tripId: s.trip.id,
        title: `Hotel ${s.n}`,
        type: 'hotel',
        place_id: s.place.id,
        start_day_id: s.days[0].id,
        end_day_id: s.days[1].id,
        price: 240,
      }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/reservations`,
        body: (s) => ({
          title: `Hotel ${s.n}`,
          type: 'hotel',
          place_id: s.place.id,
          create_accommodation: { place_id: s.place.id, start_day_id: s.days[0].id, end_day_id: s.days[1].id },
          create_budget_entry: { total_price: 240, category: 'hotel' },
        }),
      },
      settle: true,
      expect: [...STAY_STOP_ADDED, 'accommodation:created', 'budget:created', 'reservation:created', BOOKING_NOTICE],
    },
    {
      tool: 'update_reservation',
      needs: ['stay', 'member'],
      args: (s) => ({ tripId: s.trip.id, reservationId: s.stay.reservationId, status: 'confirmed' }),
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/reservations/${s.stay.reservationId}`,
        body: () => ({ status: 'confirmed' }),
      },
      settle: true,
      expect: ['reservation:updated', BOOKING_NOTICE],
    },
    {
      // A hotel booking takes its stay (and the stay's stop) and its linked cost along.
      tool: 'delete_reservation',
      needs: ['stay', 'member'],
      setup: async (s, app) => {
        await makeBudgetItem(app.get(MikroORM), s.trip.id, { name: `Hotel ${s.n}`, reservation: s.stay.reservationId });
      },
      args: (s) => ({ tripId: s.trip.id, reservationId: s.stay.reservationId }),
      rest: { method: 'delete', path: (s) => `/api/trips/${s.trip.id}/reservations/${s.stay.reservationId}` },
      settle: true,
      expect: [...STAY_STOP_REMOVED, 'accommodation:deleted', 'budget:deleted', 'reservation:deleted', BOOKING_NOTICE],
    },
    {
      tool: 'set_reservation_travelers',
      needs: ['transport', 'member'],
      args: (s) => ({ tripId: s.trip.id, reservationId: s.transport.id, user_ids: [s.member.id] }),
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/reservations/${s.transport.id}/travelers`,
        body: (s) => ({ user_ids: [s.member.id] }),
      },
      expect: ['reservation:travelers-updated'],
    },
    {
      // MCP sends REST's `day_id` and keeps the `dayId` its tool always sent.
      tool: 'reorder_reservations',
      needs: ['transport'],
      args: (s) => ({
        tripId: s.trip.id,
        positions: [{ id: s.transport.id, day_plan_position: 2 }],
        dayId: s.days[0].id,
      }),
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/reservations/positions`,
        body: (s) => ({ positions: [{ id: s.transport.id, day_plan_position: 2 }], day_id: s.days[0].id }),
      },
      expect: ['reservation:positions'],
    },
    {
      // A hotel booking without a stay yet gets one, as the booking form's PUT
      // gives it: the stop, then the new stay, then the booking.
      tool: 'link_hotel_accommodation',
      needs: ['transport', 'place', 'member'],
      setup: async (s, app) => {
        await retype(app, s.transport.id, 'hotel');
      },
      args: (s) => ({
        tripId: s.trip.id,
        reservationId: s.transport.id,
        place_id: s.place.id,
        start_day_id: s.days[0].id,
        end_day_id: s.days[1].id,
      }),
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/reservations/${s.transport.id}`,
        body: (s) => ({
          type: 'hotel',
          place_id: s.place.id,
          create_accommodation: { place_id: s.place.id, start_day_id: s.days[0].id, end_day_id: s.days[1].id },
        }),
      },
      settle: true,
      expect: [...STAY_STOP_ADDED, 'accommodation:created', 'reservation:updated', BOOKING_NOTICE],
    },
    {
      tool: 'create_transport',
      needs: ['member'],
      args: (s) => ({ tripId: s.trip.id, type: 'train', title: `ICE ${s.n}`, start_day_id: s.days[0].id, price: 89 }),
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/reservations`,
        body: (s) => ({
          title: `ICE ${s.n}`,
          type: 'train',
          day_id: s.days[0].id,
          create_budget_entry: { total_price: 89, category: 'train' },
        }),
      },
      settle: true,
      expect: ['budget:created', 'reservation:created', BOOKING_NOTICE],
    },
    {
      tool: 'update_transport',
      needs: ['transport', 'member'],
      args: (s) => ({ tripId: s.trip.id, reservationId: s.transport.id, status: 'confirmed' }),
      rest: {
        method: 'put',
        path: (s) => `/api/trips/${s.trip.id}/reservations/${s.transport.id}`,
        body: () => ({ status: 'confirmed' }),
      },
      settle: true,
      expect: ['reservation:updated', BOOKING_NOTICE],
    },
    {
      // A hotel booking a REST edit retyped as a train still carries its stay:
      // deleting it takes the stay along, and the sidebar hears of it on MCP too.
      tool: 'delete_transport',
      needs: ['stay', 'member'],
      setup: async (s, app) => {
        await retype(app, s.stay.reservationId, 'train');
      },
      args: (s) => ({ tripId: s.trip.id, reservationId: s.stay.reservationId }),
      rest: { method: 'delete', path: (s) => `/api/trips/${s.trip.id}/reservations/${s.stay.reservationId}` },
      settle: true,
      expect: [...STAY_STOP_REMOVED, 'accommodation:deleted', 'reservation:deleted', BOOKING_NOTICE],
    },
    {
      tool: 'create_transit_journey',
      needs: ['member'],
      args: (s) => ({
        tripId: s.trip.id,
        dayId: s.days[0].id,
        from: TRANSIT_FROM,
        to: TRANSIT_TO,
        itinerary: TRANSIT_ITINERARY,
      }),
      // The transit panel saves the itinerary it picked through the booking route.
      rest: {
        method: 'post',
        path: (s) => `/api/trips/${s.trip.id}/reservations`,
        body: (s) => ({
          title: 'Namba → Umeda',
          type: 'transit',
          status: 'confirmed',
          day_id: s.days[0].id,
          end_day_id: s.days[0].id,
          reservation_time: '2027-05-03T09:00',
          reservation_end_time: '2027-05-03T09:30',
        }),
      },
      settle: true,
      expect: ['reservation:created', BOOKING_NOTICE],
    },
  ],
  exempt: [],
};
