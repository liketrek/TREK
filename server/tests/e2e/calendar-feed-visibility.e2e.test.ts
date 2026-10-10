/**
 * Calendar-feed visibility e2e — proves the staged-booking gate holds on the
 * one path that needs no session at all: the public /api/feed/trip/:token.ics.
 *
 * tests/e2e/feeds.e2e.test.ts cannot cover this. It mocks buildTripCalendar and
 * never creates a reservations table, so it owns the calendar parts and the SQL
 * filter is invisible to it. This file runs the REAL CalendarService against a
 * real migrated SQLite instead, and asserts on the bytes a calendar client
 * would receive.
 */
import { db } from '../../src/db/database';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { FeedsModule } from '../../src/nest/feeds/feeds.module';
import { makeReservation } from '../helpers/factories/reservations';
import { makeTrip, readTripDays } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { Test } from '@nestjs/testing';

import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

describe('Calendar feed visibility e2e (real CalendarService over temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let feedToken: string;
  let orm: TestOrm;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), FeedsModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // Seeded through MikroORM (tests/helpers/factories), not raw SQL.
    orm = await createTestOrm(db);
    const { user } = await makeUser(orm, { username: 'e2e-user', email: 'e2e@example.test' });
    feedToken = 'feed-token-visibility';
    const trip = await makeTrip(orm, user.id, {
      title: 'Kyoto',
      start_date: '2026-09-01',
      end_date: '2026-09-05',
      feed_token: feedToken,
    });
    const [firstDay] = await readTripDays(orm, trip.id);
    await makeReservation(orm, trip.id, {
      day: firstDay.id,
      title: 'Parked Flight',
      type: 'flight',
      status: 'confirmed',
      reservation_time: '2026-09-01T08:00',
      confirmation_number: 'SECRET1',
      ingest_state: 'staged',
    });
    await makeReservation(orm, trip.id, {
      day: firstDay.id,
      title: 'Booked Flight',
      type: 'flight',
      status: 'confirmed',
      reservation_time: '2026-09-01T12:00',
      confirmation_number: 'OPEN1',
    });

    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('the public feed serves the live booking and neither the staged one nor its confirmation number', async () => {
    const res = await request(server).get(`/api/feed/trip/${feedToken}.ics`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.text).toContain('SUMMARY:Booked Flight');
    expect(res.text).not.toContain('Parked Flight');
    // The number rides in the DESCRIPTION, so search the whole document.
    expect(res.text).not.toContain('SECRET1');
    expect(res.text).toContain('OPEN1');
  });
});
