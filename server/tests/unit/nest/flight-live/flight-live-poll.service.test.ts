/**
 * FlightLivePollService: the minute tick behind live flight status. The poll
 * comes out of FlightLiveModule over the migrated snapshot; the feed and the
 * notifications are stubs, broadcasts land on the FakeRealtimeService.
 */
import { AppSettings } from '../../../../src/db/entities/AppSettings.entity';
import { FlightLiveStates } from '../../../../src/db/entities/FlightLiveStates.entity';
import { FlightLivePollService } from '../../../../src/nest/flight-live/flight-live-poll.service';
import type { FeedAircraft } from '../../../../src/nest/flight-live/flight-live.derive';
import { FlightLiveFeedService, type FeedLookup } from '../../../../src/nest/flight-live/flight-live.feeds';
import { FlightLiveJob } from '../../../../src/nest/flight-live/flight-live.job';
import { FlightLiveModule } from '../../../../src/nest/flight-live/flight-live.module';
import { FlightLiveService } from '../../../../src/nest/flight-live/flight-live.service';
import { NotificationsService } from '../../../../src/nest/notifications/notifications.service';
import { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import {
  addReservationTraveler,
  makeReservation,
  makeReservationEndpoint,
} from '../../../helpers/factories/reservations';
import { findRow, findRows, insertRow } from '../../../helpers/factories/rows';
import { makeDay, makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import { flightLiveLegSchema } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let poll: FlightLivePollService;
let orm: MikroORM;

const feed = {
  lookup: vi.fn<(callsign: string, clock?: () => number) => Promise<FeedLookup>>(),
  attribution: vi.fn(() => 'Live positions: adsb.lol (ODbL)'),
  sources: vi.fn(() => ['adsb.lol']),
  canAsk: vi.fn(() => true),
  waitMs: vi.fn(() => 0),
};
const notifications = { send: vi.fn(async () => ({ attempted: 1, delivered: 1 })) };

const MIN = 60_000;
/** LH 100 leaves Frankfurt at 12:00 local (10:00 UTC) on 1 July 2026 and lands in Berlin at 13:10. */
const DEP = Date.parse('2026-07-01T10:00:00Z');
const ARR = Date.parse('2026-07-01T11:10:00Z');

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [FlightLiveModule],
    overrides: [
      { provide: FlightLiveFeedService, useValue: feed },
      { provide: NotificationsService, useValue: notifications },
    ],
  });
  poll = t.get(FlightLivePollService);
  poll.sleep = async () => undefined;
  orm = t.get(MikroORM);
});
beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
  t.realtime.broadcastMock.mockClear();
});
afterAll(async () => {
  await t.close();
  db.close();
});

async function seedFlight(title = 'Berlin') {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title });
  const flight = await makeReservation(orm, trip.id, {
    title: 'FRA to BER',
    type: 'flight',
    metadata: JSON.stringify({ flight_number: 'LH 100' }),
  });
  const end = { lat: 52.3667, lng: 13.5033, timezone: 'Europe/Berlin', local_date: '2026-07-01' };
  await makeReservationEndpoint(orm, flight.id, {
    role: 'from',
    sequence: 0,
    name: 'Frankfurt (FRA)',
    code: 'FRA',
    lat: 50.0333,
    lng: 8.5706,
    timezone: 'Europe/Berlin',
    local_date: '2026-07-01',
    local_time: '12:00',
  });
  await makeReservationEndpoint(orm, flight.id, {
    role: 'to',
    sequence: 1,
    name: 'Berlin (BER)',
    code: 'BER',
    local_time: '13:10',
    ...end,
  });
  return { user, trip, flight };
}

function aircraft(overrides: Partial<FeedAircraft> = {}): FeedAircraft {
  return {
    hex: '3c6444',
    flight: 'DLH100',
    registration: 'D-AINA',
    type: 'A20N',
    alt_baro: 4000,
    alt_geom: null,
    gs: 220,
    track: 60,
    baro_rate: 2000,
    geom_rate: null,
    lat: 50.1,
    lon: 8.7,
    seen: 0,
    seen_pos: 0,
    ...overrides,
  };
}

const seen = (...list: FeedAircraft[]): FeedLookup => ({ ok: true, source: 'adsb.lol', now: 0, aircraft: list });
const at = (ms: number) => () => ms;
const events = () => notifications.send.mock.calls.map((call) => (call as unknown as [{ event: string }])[0].event);

describe('FlightLivePollService.poll', () => {
  it('FLPOLL-001: switched off, it asks nothing', async () => {
    await seedFlight();
    await insertRow(orm, AppSettings, { key: 'flight_live_enabled', value: 'false' });
    expect(await poll.poll(at(DEP))).toEqual({ asked: 0, changed: 0, skipped: 'disabled' });
    expect(feed.lookup).not.toHaveBeenCalled();
  });

  it('FLPOLL-002: outside its window a flight is not asked about', async () => {
    await seedFlight();
    expect(await poll.poll(at(DEP - 4 * 60 * MIN))).toEqual({ asked: 0, changed: 0, skipped: null });
    expect(feed.lookup).not.toHaveBeenCalled();
  });

  it('FLPOLL-003: wheels-up is stored, sent to the trip and told to the whole trip without travellers', async () => {
    const { trip, flight } = await seedFlight();
    feed.lookup.mockResolvedValueOnce(seen(aircraft()));
    const now = DEP + 5 * MIN;
    expect(await poll.poll(at(now))).toEqual({ asked: 1, changed: 1, skipped: null });
    expect(feed.lookup).toHaveBeenCalledWith('DLH100', expect.any(Function));

    const row = await findRow(orm, FlightLiveStates, { callsign: 'DLH100', service_date: '2026-07-01' });
    expect(row).toMatchObject({
      phase: 'airborne',
      departed_at: '2026-07-01 10:05:00',
      departed_notified: 1,
      delay_notified: 0,
      source: 'adsb.lol',
      next_poll_at: '2026-07-01 10:08:00',
    });

    expect(t.realtime.broadcastMock).toHaveBeenCalledTimes(1);
    const [tripId, event, payload] = t.realtime.broadcastMock.mock.calls[0];
    expect([tripId, event]).toEqual([trip.id, 'flight:live']);
    const legs = (payload as { flights: unknown[] }).flights;
    expect(legs).toHaveLength(1);
    expect(flightLiveLegSchema.parse(legs[0])).toMatchObject({ reservation_id: flight.id, phase: 'airborne' });

    expect(notifications.send).toHaveBeenCalledTimes(1);
    expect(notifications.send).toHaveBeenCalledWith({
      event: 'flight_departed',
      actorId: null,
      scope: 'trip',
      targetId: trip.id,
      params: { flight: 'LH 100', from: 'FRA', to: 'BER', trip: 'Berlin', tripId: String(trip.id), delay: '5' },
    });
  });

  it('FLPOLL-004: a late departure is told once, to the travellers of each booking, next to wheels-up', async () => {
    const { user, flight } = await seedFlight();
    const second = await seedFlight('Berlin too');
    await addReservationTraveler(orm, flight.id, user.id);
    feed.lookup.mockResolvedValueOnce(seen(aircraft()));
    await poll.poll(at(DEP + 25 * MIN));

    expect(events().sort()).toEqual(['flight_delayed', 'flight_delayed', 'flight_departed', 'flight_departed']);
    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'flight_delayed', scope: 'user', targetId: user.id }),
    );
    expect(notifications.send).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'flight_delayed', scope: 'trip', targetId: second.trip.id }),
    );
    expect(t.realtime.broadcastMock).toHaveBeenCalledTimes(2);

    notifications.send.mockClear();
    feed.lookup.mockResolvedValueOnce(seen(aircraft({ alt_baro: 30000, lat: 51.2, lon: 11, gs: 450 })));
    expect(await poll.poll(at(DEP + 30 * MIN))).toMatchObject({ asked: 1 });
    expect(notifications.send).not.toHaveBeenCalled();
  });

  it('FLPOLL-005: landed is told once and the flight is asked about no more', async () => {
    const { trip } = await seedFlight();
    feed.lookup.mockResolvedValueOnce(seen(aircraft()));
    await poll.poll(at(DEP + 2 * MIN));
    feed.lookup.mockResolvedValueOnce(seen(aircraft({ alt_baro: 'ground', lat: 52.37, lon: 13.5, gs: 15 })));
    await poll.poll(at(ARR));
    expect(events()).toEqual(['flight_departed', 'flight_landed']);
    expect(await findRow(orm, FlightLiveStates, { callsign: 'DLH100' })).toMatchObject({
      phase: 'landed',
      landed_at: '2026-07-01 11:10:00',
      landed_notified: 1,
      next_poll_at: null,
    });
    feed.lookup.mockClear();
    expect(await poll.poll(at(ARR + 10 * MIN))).toMatchObject({ asked: 0 });
    expect(feed.lookup).not.toHaveBeenCalled();
    expect(t.realtime.broadcastMock.mock.calls.every((call) => call[0] === trip.id)).toBe(true);
  });

  it('FLPOLL-006: first seen on the ground at the destination is a landing without a departure notice', async () => {
    await seedFlight();
    feed.lookup.mockResolvedValueOnce(seen(aircraft({ alt_baro: 'ground', lat: 52.37, lon: 13.5 })));
    await poll.poll(at(ARR));
    expect(events()).toEqual(['flight_landed']);
    expect(await findRow(orm, FlightLiveStates, { callsign: 'DLH100' })).toMatchObject({
      phase: 'landed',
      departed_notified: 1,
      landed_notified: 1,
      delay_notified: 0,
    });
  });

  it('FLPOLL-007: a failed ask counts and backs off, nothing is broadcast', async () => {
    await seedFlight();
    feed.lookup.mockResolvedValue({ ok: false, reason: 'unavailable' });
    await poll.poll(at(DEP - 30 * MIN));
    await poll.poll(at(DEP - 28 * MIN));
    await poll.poll(at(DEP - 26 * MIN));
    expect(await findRow(orm, FlightLiveStates, { callsign: 'DLH100' })).toMatchObject({
      phase: 'scheduled',
      fail_count: 3,
      next_poll_at: '2026-07-01 09:49:00',
    });
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
    feed.lookup.mockReset();
  });

  it('FLPOLL-008: an empty budget ends the tick before anything is stored', async () => {
    await seedFlight();
    feed.lookup.mockResolvedValueOnce({ ok: false, reason: 'budget' });
    expect(await poll.poll(at(DEP))).toEqual({ asked: 0, changed: 0, skipped: null });
    expect(await findRows(orm, FlightLiveStates)).toEqual([]);
    feed.canAsk.mockReturnValueOnce(false);
    expect(await poll.poll(at(DEP))).toEqual({ asked: 0, changed: 0, skipped: null });
    expect(feed.lookup).toHaveBeenCalledTimes(1);
  });

  it('FLPOLL-009: a flight not due waits, unless a client asked for it; the feed spacing is waited out', async () => {
    const { trip } = await seedFlight();
    feed.lookup.mockResolvedValue(seen(aircraft({ alt_baro: 'ground', lat: 50.035, lon: 8.56, gs: 5 })));
    await poll.poll(at(DEP - 60 * MIN));
    expect(feed.lookup).toHaveBeenCalledTimes(1);
    await poll.poll(at(DEP - 58 * MIN));
    expect(feed.lookup).toHaveBeenCalledTimes(1);

    // Asked for seven minutes before its next poll: the cadence holds.
    const live = t.get(FlightLiveService);
    await live.tripFlights(trip.id, DEP - 57 * MIN);
    await poll.poll(at(DEP - 57 * MIN));
    expect(feed.lookup).toHaveBeenCalledTimes(1);

    // Asked within two minutes of it: brought forward.
    await live.tripFlights(trip.id, DEP - 51.5 * MIN);
    const sleep = vi.fn(async () => undefined);
    poll.sleep = sleep;
    feed.waitMs.mockReturnValueOnce(400);
    await poll.poll(at(DEP - 51.5 * MIN));
    expect(feed.lookup).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(400);
    poll.sleep = async () => undefined;
    feed.lookup.mockReset();
  });

  it('FLPOLL-010: a tick while one runs returns at once, and old states go once a day', async () => {
    const old = { callsign: 'BAW1', service_date: '2026-01-01', origin: 'LHR', destination: 'JFK' };
    await insertRow(orm, FlightLiveStates, old);
    // An earlier case already purged today; the guard is per day, so forget it.
    (poll as unknown as { lastPurgeDay: string | null }).lastPurgeDay = null;
    let release: () => void = () => undefined;
    feed.lookup.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: false, reason: 'budget' });
        }),
    );
    await seedFlight();
    const first = poll.poll(at(DEP + 10 * MIN));
    await vi.waitFor(() => expect(feed.lookup).toHaveBeenCalled());
    expect(await poll.poll(at(DEP + 10 * MIN))).toEqual({ asked: 0, changed: 0, skipped: 'running' });
    release();
    await first;
    expect(await findRows(orm, FlightLiveStates, { callsign: 'BAW1' })).toEqual([]);
  });
});

describe('FlightLivePollService: closing and sectors', () => {
  it('FLPOLL-011: a flight still in the air when its window ends is closed as unknown and asked about no more', async () => {
    const { trip } = await seedFlight();
    feed.lookup.mockResolvedValueOnce(seen(aircraft({ alt_baro: 30000, lat: 51.2, lon: 11, gs: 450 })));
    await poll.poll(at(DEP + 20 * MIN));
    t.realtime.broadcastMock.mockClear();
    feed.lookup.mockClear();

    await poll.poll(at(ARR + 121 * MIN));
    expect(feed.lookup).not.toHaveBeenCalled();
    expect(await findRow(orm, FlightLiveStates, { callsign: 'DLH100' })).toMatchObject({
      phase: 'unknown',
      next_poll_at: null,
    });
    expect(t.realtime.broadcastMock).toHaveBeenCalledTimes(1);
    const [tripId, , payload] = t.realtime.broadcastMock.mock.calls[0];
    expect(tripId).toBe(trip.id);
    expect((payload as { flights: Array<{ phase: string }> }).flights[0].phase).toBe('unknown');

    t.realtime.broadcastMock.mockClear();
    await poll.poll(at(ARR + 125 * MIN));
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('FLPOLL-012: two sectors of one through flight keep a state each', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'There and back' });
    const day = await makeDay(orm, trip.id, { day_number: 1, date: '2026-07-01' });
    const legs = [
      { from: 'FRA', to: 'BER', flight_number: 'LH 100', dep_day_id: day.id, dep_time: '12:00' },
      { from: 'BER', to: 'FRA', flight_number: 'LH 100', dep_day_id: day.id, dep_time: '15:00' },
    ];
    const flight = await makeReservation(orm, trip.id, {
      title: 'Through flight',
      type: 'flight',
      metadata: JSON.stringify({ legs }),
    });
    const fra = { name: 'Frankfurt (FRA)', code: 'FRA', lat: 50.0333, lng: 8.5706, timezone: 'Europe/Berlin' };
    const ber = { name: 'Berlin (BER)', code: 'BER', lat: 52.3667, lng: 13.5033, timezone: 'Europe/Berlin' };
    await makeReservationEndpoint(orm, flight.id, { role: 'from', sequence: 0, ...fra, local_date: '2026-07-01' });
    await makeReservationEndpoint(orm, flight.id, { role: 'stop', sequence: 1, ...ber, local_date: '2026-07-01' });
    await makeReservationEndpoint(orm, flight.id, { role: 'to', sequence: 2, ...fra, local_date: '2026-07-01' });
    feed.lookup.mockResolvedValue(seen(aircraft()));
    expect(await poll.poll(at(DEP + 5 * MIN))).toMatchObject({ asked: 2 });
    const rows = await findRows(orm, FlightLiveStates, { callsign: 'DLH100' });
    // Seen climbing out of Frankfurt: wheels-up for the first sector, nothing claimed for the second.
    expect(rows.map((r) => [r.origin, r.destination, r.departed_at]).sort()).toEqual([
      ['BER', 'FRA', null],
      ['FRA', 'BER', '2026-07-01 10:05:00'],
    ]);
    feed.lookup.mockReset();
  });
});

describe('FlightLiveJob', () => {
  it('FLJOB-001: registers nothing under test and runs one poll per tick, a failure logged not thrown', async () => {
    const job = t.get(FlightLiveJob);
    const registrar = t.get(CronRegistrarService);
    const register = vi.spyOn(registrar, 'register');
    job.onApplicationBootstrap();
    expect(register).not.toHaveBeenCalled();

    const run = vi.spyOn(poll, 'poll').mockResolvedValueOnce({ asked: 2, changed: 1, skipped: null });
    await job.tick();
    run.mockRejectedValueOnce(new Error('boom'));
    await expect(job.tick()).resolves.toBeUndefined();
    expect(run).toHaveBeenCalledTimes(2);
    run.mockRestore();
  });

  it('FLJOB-002: registers the minute tick where crons run', () => {
    const job = t.get(FlightLiveJob);
    const registrar = t.get(CronRegistrarService);
    vi.spyOn(registrar, 'isEnabled').mockReturnValueOnce(true);
    const register = vi.spyOn(registrar, 'register').mockReturnValueOnce(true);
    job.onApplicationBootstrap();
    expect(register).toHaveBeenCalledWith('flight-live', '* * * * *', expect.any(Function));
    register.mockRestore();
  });
});
