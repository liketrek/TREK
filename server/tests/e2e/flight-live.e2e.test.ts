/**
 * Live flight status e2e: GET /api/trips/:tripId/flights/live through the
 * real JwtAuthGuard and TripAccessGuard over a migrated snapshot db. The
 * read never asks a feed, so fetch is a spy that must stay unused; the
 * response contract is checked on every 200 (NODE_ENV=test).
 */
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { AppConfigModule } from '../../src/nest/app-config/app-config.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { FlightLiveModule } from '../../src/nest/flight-live/flight-live.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makeReservation, makeReservationEndpoint } from '../helpers/factories/reservations';
import { deleteRows, insertRow } from '../helpers/factories/rows';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Test } from '@nestjs/testing';
import { tripFlightLiveResponseSchema } from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();

describe('Flight live e2e (real guards + snapshot SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let ownerId: number;
  let strangerId: number;
  let tripId: number;
  let flightId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        AppConfigModule,
        RealtimeModule,
        FlightLiveModule,
      ],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    app = await build();
    server = app.getHttpServer();
    const orm = app.get(MikroORM);
    const { user: owner } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    ownerId = owner.id;
    strangerId = stranger.id;
    tripId = (await makeTrip(orm, owner.id, { title: 'Japan' })).id;
    const flight = await makeReservation(orm, tripId, {
      title: 'FRA to HND',
      type: 'flight',
      metadata: JSON.stringify({ flight_number: 'LH 716', airline: 'Lufthansa' }),
    });
    flightId = flight.id;
    await makeReservationEndpoint(orm, flight.id, {
      role: 'from',
      sequence: 0,
      name: 'Frankfurt (FRA)',
      code: 'FRA',
      lat: 50.0333,
      lng: 8.5706,
      timezone: 'Europe/Berlin',
      local_date: '2030-07-01',
      local_time: '13:40',
    });
    await makeReservationEndpoint(orm, flight.id, {
      role: 'to',
      sequence: 1,
      name: 'Tokyo Haneda (HND)',
      code: 'HND',
      lat: 35.5523,
      lng: 139.7798,
      timezone: 'Asia/Tokyo',
      local_date: '2030-07-02',
      local_time: '08:15',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await app.close();
    db.close();
  });

  const url = (id: number = tripId) => `/api/trips/${id}/flights/live`;

  it('FLE2E-001: 401 without a session cookie', async () => {
    const res = await request(server).get(url());
    expect(res.status).toBe(401);
  });

  it('FLE2E-002: 404 "Trip not found" for a trip the caller cannot reach', async () => {
    const res = await request(server).get(url()).set('Cookie', sessionCookie(strangerId));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('FLE2E-003: 200 with every flight leg and its schedule in UTC, without asking a feed', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const res = await request(server).get(url()).set('Cookie', sessionCookie(ownerId));
    expect(res.status).toBe(200);
    expect(tripFlightLiveResponseSchema.parse(res.body)).toEqual(res.body);
    expect(res.body).toMatchObject({ enabled: true, attribution: 'Live positions: adsb.lol (ODbL)' });
    expect(res.body.flights).toEqual([
      expect.objectContaining({
        reservation_id: flightId,
        leg_index: 0,
        callsign: 'DLH716',
        flight_number: 'LH 716',
        service_date: '2030-07-01',
        origin: { code: 'FRA', name: 'Frankfurt', lat: 50.0333, lng: 8.5706, timezone: 'Europe/Berlin' },
        destination: { code: 'HND', name: 'Tokyo Haneda', lat: 35.5523, lng: 139.7798, timezone: 'Asia/Tokyo' },
        phase: 'scheduled',
        scheduled_departure: '2030-07-01T11:40:00.000Z',
        scheduled_arrival: '2030-07-01T23:15:00.000Z',
        position: null,
        source: null,
      }),
    ]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('FLE2E-004: switched off by the admin it answers enabled false and no flights', async () => {
    const orm = app.get(MikroORM);
    await insertRow(orm, AppSettings, { key: 'flight_live_enabled', value: 'false' });
    try {
      const res = await request(server).get(url()).set('Cookie', sessionCookie(ownerId));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ enabled: false, attribution: null, flights: [] });
    } finally {
      await deleteRows(orm, AppSettings, { key: 'flight_live_enabled' });
    }
  });
});
