/**
 * Import pipeline against the real test DB — only the AirTrail client and the
 * per-user credentials are mocked. Covers the joined multi-leg import (#1535):
 * one reservation per connection chain, detached from live sync, with every
 * member id recorded for dedupe; plus the fallbacks when a requested join
 * doesn't actually chain.
 */
import { db } from '../../../../src/db/database';
import { Days } from '../../../../src/db/entities/Days.entity';
import { ReservationEndpoints } from '../../../../src/db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../../../src/db/entities/Reservations.entity';
import { BudgetService } from '../../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../../src/nest/budget/exchange-rates.service';
import { AirtrailImportService } from '../../../../src/nest/integrations/airtrail-import.service';
import type { AirtrailAirport, AirtrailFlightRaw } from '../../../../src/nest/integrations/airtrail.client';
import type { AirtrailClient } from '../../../../src/nest/integrations/airtrail.client';
import type { AirtrailService } from '../../../../src/nest/integrations/airtrail.service';
import { PermissionsService } from '../../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../../src/nest/realtime/realtime.service';
import { ReservationsReadService } from '../../../../src/nest/reservations/reservations-read.service';
import { ReservationsService } from '../../../../src/nest/reservations/reservations.service';
import { accommodationsOver } from '../../../helpers/accommodations-service';
import { budgetRepoArgs } from '../../../helpers/budget-repos';
import { createUser, createTrip } from '../../../helpers/factories';
import { findRow, findRows } from '../../../helpers/factories/rows';
import { createTestBudgetItemsRepo } from '../../../helpers/files-repos';
import { notificationsStub } from '../../../helpers/notifications';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestReservationsRepo,
  createTestReservationEndpointsRepo,
  createTestReservationTravelersRepo,
  createTestReservationDayPositionsRepo,
  createTestDayAccommodationsRepo,
  createTestDaysRepo,
  createTestPlacesRepo,
  createTestDayAssignmentsRepo,
  createTestTripMembersRepo,
  createTestUsersRepo,
  createTestTripsRepo,
  sharedTestOrm,
} from '../../../helpers/test-uow';

import { describe, it, expect, vi, beforeEach } from 'vitest';

// The client and the per-user credentials are the only stubs; the reservation
// writes go through the real service against the real test DB, as before. They
// were module mocks until the fold made them injected collaborators.
const listFlights = vi.fn();
const broadcast = vi.fn();

async function makeImportService(): Promise<AirtrailImportService> {
  const permissions = new PermissionsService(await createTestAppSettingsRepo(db), await createTestUnitOfWork(db));
  const realtime = { broadcast } as unknown as RealtimeService;
  return new AirtrailImportService(
    await createTestReservationsRepo(db),
    await createTestReservationEndpointsRepo(db),
    await createTestDaysRepo(db),
    realtime,
    new ReservationsService(
      permissions,
      new BudgetService(
        permissions,
        new ExchangeRatesService(),
        realtime,
        await createTestUnitOfWork(db),
        ...(await budgetRepoArgs(db)),
      ),
      realtime,
      notificationsStub(),
      new ReservationsReadService(
        await createTestReservationsRepo(db),
        await createTestReservationEndpointsRepo(db),
        await createTestReservationTravelersRepo(db),
      ),
      await accommodationsOver(db),
      await createTestUnitOfWork(db),
      await createTestReservationsRepo(db),
      await createTestReservationEndpointsRepo(db),
      await createTestReservationTravelersRepo(db),
      await createTestReservationDayPositionsRepo(db),
      await createTestDayAccommodationsRepo(db),
      await createTestDaysRepo(db),
      await createTestPlacesRepo(db),
      await createTestDayAssignmentsRepo(db),
      await createTestTripMembersRepo(db),
      await createTestUsersRepo(db),
      await createTestTripsRepo(db),
      await createTestBudgetItemsRepo(db),
    ),
    { listFlights } as unknown as AirtrailClient,
    {
      getAirtrailCredentials: () => ({ baseUrl: 'https://at.example', apiKey: 'k', allowInsecureTls: false }),
    } as unknown as AirtrailService,
    await createTestUnitOfWork(db),
  );
}

const importAirtrailFlights = async (...args: Parameters<AirtrailImportService['importAirtrailFlights']>) =>
  (await makeImportService()).importAirtrailFlights(...args);

const BRU: AirtrailAirport = {
  id: 1,
  icao: 'EBBR',
  iata: 'BRU',
  name: 'Brussels',
  lat: 50.9014,
  lon: 4.4844,
  tz: 'Europe/Brussels',
  country: 'BE',
};
const HEL: AirtrailAirport = {
  id: 2,
  icao: 'EFHK',
  iata: 'HEL',
  name: 'Helsinki-Vantaa',
  lat: 60.3172,
  lon: 24.9633,
  tz: 'Europe/Helsinki',
  country: 'FI',
};
const JFK: AirtrailAirport = {
  id: 3,
  icao: 'KJFK',
  iata: 'JFK',
  name: 'John F. Kennedy Intl.',
  lat: 40.6413,
  lon: -73.7781,
  tz: 'America/New_York',
  country: 'US',
};
const LHR: AirtrailAirport = {
  id: 4,
  icao: 'EGLL',
  iata: 'LHR',
  name: 'London Heathrow',
  lat: 51.4706,
  lon: -0.4619,
  tz: 'Europe/London',
  country: 'GB',
};

function rawFlight(over: Partial<AirtrailFlightRaw> = {}): AirtrailFlightRaw {
  return {
    id: 101,
    from: BRU,
    to: HEL,
    date: '2026-08-01',
    datePrecision: 'day',
    departure: '2026-08-01T06:00:00.000+00:00',
    arrival: '2026-08-01T09:30:00.000+00:00',
    departureScheduled: null,
    arrivalScheduled: null,
    airline: { id: 1, icao: 'FIN', iata: 'AY', name: 'Finnair' },
    flightNumber: 'AY1502',
    aircraft: null,
    aircraftReg: null,
    flightReason: 'leisure',
    note: null,
    seats: [{ userId: 'u1', guestName: null, seat: 'window', seatNumber: '12A', seatClass: 'economy' }],
    ...over,
  };
}

const legBruHel = () => rawFlight();
const legHelJfk = () =>
  rawFlight({
    id: 102,
    from: HEL,
    to: JFK,
    departure: '2026-08-01T11:00:00.000+00:00',
    arrival: '2026-08-01T19:00:00.000+00:00',
    flightNumber: 'AY15',
  });
/** No connection to the BRU→HEL leg — departs LHR. */
const legLhrJfk = () =>
  rawFlight({
    id: 103,
    from: LHR,
    to: JFK,
    departure: '2026-08-02T10:00:00.000+00:00',
    arrival: '2026-08-02T18:00:00.000+00:00',
    flightNumber: 'BA117',
  });

async function tripReservations(tripId: number) {
  return findRows(await sharedTestOrm(db), Reservations, { trip: tripId }, { id: 'asc' });
}

async function endpointsOf(reservationId: number) {
  return findRows(await sharedTestOrm(db), ReservationEndpoints, { reservation: reservationId }, { sequence: 'asc' });
}

/** The id of the trip's day on `date`. */
async function dayIdOn(tripId: number, date: string): Promise<number> {
  const day = await findRow(await sharedTestOrm(db), Days, { trip: tripId, date });
  if (!day) throw new Error(`no day on ${date} for trip ${tripId}`);
  return day.id;
}

let tripId: number;
let userId: number;

beforeEach(() => {
  vi.clearAllMocks();
  const { user } = createUser(db);
  userId = user.id;
  tripId = createTrip(db, userId, { start_date: '2026-08-01', end_date: '2026-08-05' }).id;
});

describe('importAirtrailFlights connection joining (#1535)', () => {
  it('imports a connection chain as ONE multi-leg reservation, detached from live sync', async () => {
    listFlights.mockResolvedValue([legBruHel(), legHelJfk()]);

    // Deliberately unordered — the server orders the chain by departure itself.
    const result = await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['102', '101']]);
    expect([...result.imported].sort()).toEqual(['101', '102']);
    expect(result.skipped).toEqual([]);

    const rows = await tripReservations(tripId);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.type).toBe('flight');
    expect(r.external_source).toBe('airtrail');
    expect(r.external_id).toBe('101');
    expect(r.sync_enabled).toBe(0); // AirTrail has no multi-leg entity to round-trip to

    const meta = JSON.parse(String(r.metadata));
    expect(meta.airtrail_ids).toEqual(['101', '102']);
    expect(meta.legs).toHaveLength(2);
    expect((await endpointsOf(r.id)).map((e) => [e.role, e.code])).toEqual([
      ['from', 'BRU'],
      ['stop', 'HEL'],
      ['to', 'JFK'],
    ]);

    // Each leg is filed on its own trip day so the day planner renders the
    // legs where they belong (both flights are on Aug 1 here).
    const day1 = await dayIdOn(tripId, '2026-08-01');
    expect(meta.legs[0]).toMatchObject({ dep_day_id: day1, arr_day_id: day1 });
    expect(meta.legs[1]).toMatchObject({ dep_day_id: day1, arr_day_id: day1 });
  });

  it('resolves overnight-connection legs to their own days', async () => {
    const overnightLeg2 = {
      ...legHelJfk(),
      date: '2026-08-02',
      departure: '2026-08-02T07:00:00.000+00:00',
      arrival: '2026-08-02T15:00:00.000+00:00',
    };
    listFlights.mockResolvedValue([legBruHel(), overnightLeg2]);

    await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);
    const [r] = await tripReservations(tripId);
    const legs = JSON.parse(String(r.metadata)).legs;
    expect(legs[0].dep_day_id).toBe(await dayIdOn(tripId, '2026-08-01'));
    expect(legs[1].dep_day_id).toBe(await dayIdOn(tripId, '2026-08-02'));
    expect(legs[1].arr_day_id).toBe(await dayIdOn(tripId, '2026-08-02'));
  });

  it('refuses to join an out-and-back return as a connection', async () => {
    const returnFlight = {
      ...legBruHel(),
      id: 104,
      from: HEL,
      to: BRU,
      departure: '2026-08-01T18:00:00.000+00:00',
      arrival: '2026-08-01T21:30:00.000+00:00',
      flightNumber: 'AY1503',
    };
    listFlights.mockResolvedValue([legBruHel(), returnFlight]);

    const result = await importAirtrailFlights(tripId, userId, ['101', '104'], undefined, [['101', '104']]);
    expect([...result.imported].sort()).toEqual(['101', '104']);
    expect(await tripReservations(tripId)).toHaveLength(2); // two singles, no bogus BRU→HEL→BRU booking
  });

  it('skips every member of a joined booking on a later import attempt', async () => {
    listFlights.mockResolvedValue([legBruHel(), legHelJfk()]);
    await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);

    // Only leg 2 carries no external_id of its own — it must still be recognized
    // via metadata.airtrail_ids.
    const again = await importAirtrailFlights(tripId, userId, ['102'], undefined);
    expect(again.imported).toEqual([]);
    expect(again.skipped).toEqual([{ flightId: '102', reason: 'already-imported' }]);
    expect(await tripReservations(tripId)).toHaveLength(1);
  });

  it('recognizes a joined leg imported by another member via its per-leg signature', async () => {
    listFlights.mockResolvedValue([legBruHel(), legHelJfk()]);
    await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);

    // The same physical HEL→JFK flight from another member's AirTrail carries a
    // different id there — the flight-number@date signature must catch it.
    const { user: other } = createUser(db);
    listFlights.mockResolvedValue([{ ...legHelJfk(), id: 999 }]);
    const result = await importAirtrailFlights(tripId, other.id, ['999'], undefined);
    expect(result.imported).toEqual([]);
    expect(result.skipped).toEqual([{ flightId: '999', reason: 'already-in-trip', detail: expect.any(String) }]);
    expect(await tripReservations(tripId)).toHaveLength(1);
  });

  it('falls back to individual imports when the requested join does not chain', async () => {
    listFlights.mockResolvedValue([legBruHel(), legLhrJfk()]);

    const result = await importAirtrailFlights(tripId, userId, ['101', '103'], undefined, [['101', '103']]);
    expect([...result.imported].sort()).toEqual(['101', '103']);

    const rows = await tripReservations(tripId);
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.sync_enabled).toBe(1); // plain imports keep live sync
      expect(await endpointsOf(r.id)).toHaveLength(2);
    }
  });

  it('falls back to individual imports when the layover exceeds 24 h', async () => {
    const lateLeg2 = {
      ...legHelJfk(),
      departure: '2026-08-03T11:00:00.000+00:00',
      arrival: '2026-08-03T19:00:00.000+00:00',
      date: '2026-08-03',
    };
    listFlights.mockResolvedValue([legBruHel(), lateLeg2]);

    const result = await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);
    expect([...result.imported].sort()).toEqual(['101', '102']);
    expect(await tripReservations(tripId)).toHaveLength(2);
  });

  it('imports singles exactly as before when no join is requested', async () => {
    listFlights.mockResolvedValue([legBruHel()]);

    const result = await importAirtrailFlights(tripId, userId, ['101'], undefined);
    expect(result.imported).toEqual(['101']);

    const [r] = await tripReservations(tripId);
    expect(r.external_id).toBe('101');
    expect(r.sync_enabled).toBe(1);
    expect(r.external_hash).toBeTruthy();
    expect(JSON.parse(String(r.metadata)).airtrail_ids).toBeUndefined();
  });
});

describe('importAirtrailFlights writes a booking with its link', () => {
  it('rolls the booking back when the single-flight link fails, so a flight reported skipped is not in the trip', async () => {
    listFlights.mockResolvedValue([legBruHel()]);
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const repo = await createTestReservationsRepo(db);
    const spy = vi.spyOn(repo, 'linkAirtrailSingleFlight').mockRejectedValueOnce(new Error('boom'));
    try {
      const result = await importAirtrailFlights(tripId, userId, ['101'], undefined);
      expect(result.imported).toEqual([]);
      expect(result.skipped).toEqual([{ flightId: '101', reason: 'invalid', detail: 'boom' }]);
    } finally {
      spy.mockRestore();
      quiet.mockRestore();
    }
    expect(await tripReservations(tripId)).toEqual([]);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('rolls a joined connection back when its link fails', async () => {
    listFlights.mockResolvedValue([legBruHel(), legHelJfk()]);
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const repo = await createTestReservationsRepo(db);
    const spy = vi.spyOn(repo, 'linkAirtrailMultiLeg').mockRejectedValueOnce(new Error('boom'));
    try {
      const result = await importAirtrailFlights(tripId, userId, ['101', '102'], undefined, [['101', '102']]);
      expect(result.imported).toEqual([]);
      expect(result.skipped.map((s) => [s.flightId, s.reason])).toEqual([
        ['101', 'invalid'],
        ['102', 'invalid'],
      ]);
    } finally {
      spy.mockRestore();
      quiet.mockRestore();
    }
    expect(await tripReservations(tripId)).toEqual([]);
    expect(broadcast).not.toHaveBeenCalled();
  });
});
