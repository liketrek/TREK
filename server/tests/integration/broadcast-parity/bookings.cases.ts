import { MailIngestAddresses } from '../../../src/db/entities/MailIngestAddresses.entity';
import { MailIngestCandidates } from '../../../src/db/entities/MailIngestCandidates.entity';
import { MailIngestMessages } from '../../../src/db/entities/MailIngestMessages.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import { dbNow } from '../../../src/db/types';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import {
  AirtrailClient,
  type AirtrailAirport,
  type AirtrailFlightRaw,
} from '../../../src/nest/integrations/airtrail.client';
import { AirtrailService } from '../../../src/nest/integrations/airtrail.service';
import { MailIngestApplyService } from '../../../src/nest/mail-ingest/mail-ingest-apply.service';
import { MailIngestTripsService } from '../../../src/nest/mail-ingest/mail-ingest-trips.service';
import { UNDO_WINDOW_DAYS } from '../../../src/nest/mail-ingest/mail-ingest.constants';
import { sealMail } from '../../../src/nest/mail-ingest/mail-seal';
import { makeBudgetItem } from '../../helpers/factories/budget';
import { inContext } from '../../helpers/factories/context';
import { updateRows } from '../../helpers/factories/rows';
import { setAppSetting } from '../../helpers/factories/settings';
import { makeTrip } from '../../helpers/factories/trips';
import type { CaseGroup, Scene } from './types';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import type { BookingImportPreviewItem } from '@trek/shared';

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
// -- The booking mail import --------------------------------------------------

const DAY_MS = 86_400_000;
const orm = (app: INestApplication) => app.get(MikroORM);
/** A date `days` from today: the import's checks take a booking only within a few years of now. */
const dayFromToday = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
const MAIL_DAY = dayFromToday(30);

/** A table booking, as a mail to the scene's owner would have been read. */
const mailBooking = (s: Scene): BookingImportPreviewItem => ({
  type: 'restaurant',
  title: `Dinner ${s.n}`,
  reservation_time: `${MAIL_DAY}T19:00`,
  confirmation_number: `MAIL-${s.n}`,
  source: { fileName: 'mail', index: 0 },
});

/** The scene's inbox entry and, for a move, the trip it goes to, by the scene's number. */
const mailEntryOf = new Map<number, number>();
const moveTargetOf = new Map<number, number>();
const sceneRow = (ids: Map<number, number>, s: Scene) => {
  const id = ids.get(s.n);
  if (id === undefined) throw new Error(`scene ${s.n} has no row from its setup`);
  return id;
};
const mailEntry = (s: Scene) => sceneRow(mailEntryOf, s);
const moveTarget = (s: Scene) => sceneRow(moveTargetOf, s);
const mailPath = (s: Scene, action: string) => `/api/mail-ingest/candidates/${mailEntry(s)}/${action}`;

/** A mail the scene's owner forwarded, as the intake stores it: sealed, and named by its own address. */
function forwardedMail(s: Scene): Buffer {
  return Buffer.from(
    [
      'From: Owner <owner@example.com>',
      'To: trips@example.com',
      'Subject: Your table',
      `Message-ID: <parity-${s.n}@example.com>`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      `Table for two, reference MAIL-${s.n}.`,
    ].join('\r\n'),
  );
}

/**
 * The import switched on, the owner's forwarded mail stored, and one entry
 * for its booking: waiting in the inbox, or already added to the scene's
 * trip. The add goes through the import's own write, which sends nothing;
 * announcing it is the business of the action that adds.
 */
async function mailEntryFor(s: Scene, app: INestApplication, added: boolean): Promise<void> {
  const db = orm(app);
  await setAppSetting(db, 'mail_ingest_enabled', 'true');
  const now = new Date();
  const raw = forwardedMail(s);
  const item = mailBooking(s);
  const id = await inContext(db, async (em) => {
    const addressId = await em.getRepository(MailIngestAddresses).insertAddress({
      userId: s.owner.id,
      tripId: null,
      tokenHash: `parity-${s.n}`,
      tokenEnc: 'sealed',
      createdAt: dbNow(now),
    });
    const messageId = await em.getRepository(MailIngestMessages).insertIfNew({
      transport: 'upload',
      messageIdHdr: `<parity-${s.n}@example.com>`,
      dedupeHash: `parity-${s.n}`,
      addressId,
      userId: s.owner.id,
      tripId: null,
      size: raw.length,
      rawEnc: sealMail(raw),
      receivedAt: dbNow(now),
    });
    if (messageId === null) throw new Error(`the mail of scene ${s.n} was stored already`);
    const entry = {
      messageId,
      userId: s.owner.id,
      position: 0,
      itemJson: JSON.stringify(item),
      source: 'kitinerary',
      checksJson: null,
      uncertainFields: null,
      matchJson: null,
      suggestedTripId: s.trip.id,
      dedupeKey: null,
      contentHash: null,
      createdAt: dbNow(now),
    };
    if (!added) {
      return em
        .getRepository(MailIngestCandidates)
        .insertCandidate({ ...entry, resolution: 'pending', reason: 'ask_first' });
    }
    const trips = app.get(MailIngestTripsService);
    const person = await trips.person(s.owner.id);
    const trip = person ? await trips.editableTrip(person, s.trip.id) : null;
    if (!trip) throw new Error(`the owner of scene ${s.n} cannot add bookings to its trip`);
    const apply = app.get(MailIngestApplyService);
    const prepared = await apply.prepare(item, trip, s.owner.id, []);
    const written = await app.get(UnitOfWork).transactional(() => apply.writeInTx(prepared));
    return em.getRepository(MailIngestCandidates).insertCandidate({
      ...entry,
      resolution: 'applied',
      reason: null,
      resolvedTripId: s.trip.id,
      createdIdsJson: JSON.stringify(written.created),
      resolvedAt: dbNow(now),
      undoUntil: dbNow(new Date(now.getTime() + UNDO_WINDOW_DAYS * DAY_MS)),
    });
  });
  mailEntryOf.set(s.n, id);
}

const waitingMail = (s: Scene, app: INestApplication) => mailEntryFor(s, app, false);
const addedMail = (s: Scene, app: INestApplication) => mailEntryFor(s, app, true);

/**
 * The person's inbox count, sent to every one of their sockets (the asking
 * tab included, on REST too): each action on an entry changes what waits.
 */
const INBOX_CHANGED = { event: 'mailInbox:changed', user: 'actor', all: true } as const;

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

    // -- The booking mail import ----------------------------------------------
    // A booking from a mail is announced once its write committed, to every
    // socket of the trip, the asking tab included: the same announcement the
    // import makes when it adds a booking with no tab asking at all.
    {
      // The booking, the mail as its document, and the inbox that shrank.
      tool: 'add_mail_booking',
      setup: waitingMail,
      args: (s) => ({ candidateId: mailEntry(s) }),
      rest: { method: 'post', path: (s) => mailPath(s, 'apply'), body: () => ({}) },
      expect: [{ event: 'reservation:created', all: true }, { event: 'file:created', all: true }, INBOX_CHANGED],
    },
    {
      // Out of the scene's trip into the owner's other trip in the booking's dates, its mail with it.
      tool: 'move_mail_booking',
      setup: async (s, app) => {
        await addedMail(s, app);
        const target = await makeTrip(orm(app), s.owner.id, {
          title: `Elsewhere ${s.n}`,
          start_date: dayFromToday(28),
          end_date: dayFromToday(32),
        });
        moveTargetOf.set(s.n, target.id);
      },
      args: (s) => ({ candidateId: mailEntry(s), trip_id: moveTarget(s) }),
      rest: { method: 'post', path: (s) => mailPath(s, 'move'), body: (s) => ({ trip_id: moveTarget(s) }) },
      expect: [
        { event: 'reservation:deleted', all: true },
        { event: 'reservation:created', all: true, room: moveTarget },
        { event: 'file:created', all: true, room: moveTarget },
        INBOX_CHANGED,
      ],
    },
    {
      tool: 'file_mail_booking',
      setup: waitingMail,
      args: (s) => ({ candidateId: mailEntry(s), trip_id: s.trip.id }),
      rest: { method: 'post', path: (s) => mailPath(s, 'file'), body: (s) => ({ trip_id: s.trip.id }) },
      expect: [{ event: 'file:created', all: true }, INBOX_CHANGED],
    },
    {
      tool: 'discard_mail_booking',
      setup: waitingMail,
      args: (s) => ({ candidateId: mailEntry(s) }),
      rest: { method: 'post', path: (s) => mailPath(s, 'discard') },
      expect: [INBOX_CHANGED],
    },
    {
      tool: 'undo_mail_booking',
      setup: addedMail,
      args: (s) => ({ candidateId: mailEntry(s) }),
      rest: { method: 'post', path: (s) => mailPath(s, 'undo'), body: () => ({}) },
      expect: [{ event: 'reservation:deleted', all: true }, INBOX_CHANGED],
    },
    {
      // The person's other tabs read their settings card again.
      tool: 'update_mail_import_settings',
      setup: async (_s, app) => {
        await setAppSetting(orm(app), 'mail_ingest_enabled', 'true');
      },
      args: () => ({ auto_add: false }),
      rest: { method: 'patch', path: () => '/api/mail-ingest/settings', body: () => ({ auto_add: false }) },
      expect: [{ event: 'mailInbox:settings', user: 'actor', all: true }],
    },
  ],
  exempt: [],
};
