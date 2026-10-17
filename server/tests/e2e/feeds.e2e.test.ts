/**
 * Calendar-feed e2e — exercises the subscribable ICS feeds end-to-end against a
 * real migrated-and-seeded temp SQLite db (`createSnapshotTestDb()`, Plan 3d
 * Task 5 — this used to hand-roll a 4-table schema (`users`/`trips`/
 * `trip_members`/`app_settings`) and mock `canAccessTrip`/`isOwner` off
 * `../../src/db/database`; `TripAccessGuard` and `FeedsService` both resolve
 * through real repositories (`TripsRepository`/`UsersRepository`) over the
 * request-scoped `EntityManager` `createTestMikroOrmModule` wires in now, so a
 * hand-rolled schema/mock pair would silently diverge from the real one — the
 * same reasoning `trips.e2e.test.ts`'s identical header comment gives):
 *   - JWT-guarded token endpoints (/api/trips/:id/feed/token, /api/feed/user/token):
 *     lazy generate, idempotency, rotate-invalidates-old, disable-clears-token,
 *     host fallback when APP_URL is unset, 404 on no access, 401 no cookie
 *   - public unguarded feeds (/api/feed/trip/:token.ics, /api/feed/user/:token.ics):
 *     valid token → 200 text/calendar with the injected REFRESH-INTERVAL / X-PUBLISHED-TTL
 *     hints, unknown token → 404, all-trips feed excludes archived + >90-day-old trips
 *
 * buildTripCalendar is mocked so the test owns the calendar parts and can assert
 * which trips the all-trips feed pulled in without seeding the full
 * trip/day/reservation schema.
 */
import { db } from '../../src/db/database';
import { Trips } from '../../src/db/entities/Trips.entity';
import { AppConfigModule } from '../../src/nest/app-config/app-config.module';
import { CalendarService } from '../../src/nest/calendar/calendar.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { FeedsModule } from '../../src/nest/feeds/feeds.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { createUser, createTrip, addTripMember } from '../helpers/factories';
import { findRow, updateRows } from '../helpers/factories/rows';
import { resetTestDb } from '../helpers/test-db';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

// Own the calendar parts so we control the events and can assert which trips were pulled.
const SAMPLE_EVENT =
  'BEGIN:VEVENT\r\nUID:trek-trip-x@trek\r\nDTSTAMP:20260101T000000Z\r\n' +
  'DTSTART;VALUE=DATE:20260101\r\nDTEND;VALUE=DATE:20260102\r\nSUMMARY:Sample\r\nEND:VEVENT\r\n';
const sampleCalendar = () => ({
  calName: 'Sample',
  filename: 'sample.ics',
  timezones: new Map<string, string>(),
  events: [SAMPLE_EVENT],
});
// FeedsService injects CalendarService — the mock is a spy on the container
// singleton (created in beforeAll, after build()).
const buildTripCalendar = vi.fn();

let orm: TestOrm;

const BASE = 'https://trek.example.test';

describe('Calendar-feed e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let prevAppUrl: string | undefined;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        AppConfigModule,
        RealtimeModule,
        FeedsModule,
      ],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    prevAppUrl = process.env.APP_URL;
    process.env.APP_URL = BASE;
    orm = await createTestOrm(db);
    app = await build();
    vi.spyOn(app.get(CalendarService), 'buildTripCalendar').mockImplementation(buildTripCalendar as never);
    server = app.getHttpServer();
  });

  beforeEach(() => {
    resetTestDb(db);
    buildTripCalendar.mockReset();
    buildTripCalendar.mockImplementation(() => sampleCalendar());
  });

  afterAll(async () => {
    if (prevAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = prevAppUrl;
    await app.close();
    await orm.close();
  });

  // ── Trip token endpoints ───────────────────────────────────────────────────

  it('401 without a session cookie', async () => {
    const { user: owner } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    expect((await request(server).get(`/api/trips/${trip.id}/feed/token`)).status).toBe(401);
  });

  it('GET token returns {feed_url:null} before one is generated', async () => {
    const { user: owner } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const res = await request(server).get(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ feed_url: null });
  });

  it('POST generates a token lazily and is idempotent', async () => {
    const { user: owner } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const first = await request(server).post(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    expect(first.status).toBe(201);
    expect(first.body.feed_url).toMatch(new RegExp(`^${BASE}/api/feed/trip/[0-9a-f-]+\\.ics$`));

    const second = await request(server)
      .post(`/api/trips/${trip.id}/feed/token`)
      .set('Cookie', sessionCookie(owner.id));
    expect(second.body.feed_url).toBe(first.body.feed_url); // same token, not a new one
  });

  it('PUT rotates: a new token works and the old one 404s', async () => {
    const { user: owner } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const gen = await request(server).post(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    const oldToken = gen.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    const rot = await request(server).put(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    const newToken = rot.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];
    expect(newToken).not.toBe(oldToken);

    expect((await request(server).get(`/api/feed/trip/${oldToken}.ics`)).status).toBe(404);
    expect((await request(server).get(`/api/feed/trip/${newToken}.ics`)).status).toBe(200);
  });

  it('DELETE disables: the token is cleared, the URL 404s, and GET reports null', async () => {
    const { user: owner } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const gen = await request(server).post(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    const token = gen.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];
    expect((await request(server).get(`/api/feed/trip/${token}.ics`)).status).toBe(200);

    const del = await request(server).delete(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ feed_url: null });

    expect((await request(server).get(`/api/feed/trip/${token}.ics`)).status).toBe(404);
    const after = await request(server).get(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    expect(after.body).toEqual({ feed_url: null });
  });

  it('feed URL falls back to the request host when APP_URL is unset', async () => {
    const { user: owner } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    delete process.env.APP_URL;
    try {
      const gen = await request(server).post(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
      expect(gen.body.feed_url).toMatch(/^https?:\/\/[^/]+\/api\/feed\/trip\/[0-9a-f-]+\.ics$/);
    } finally {
      process.env.APP_URL = BASE;
    }
  });

  it('404 when generating for a trip the user cannot access', async () => {
    const { user: owner } = createUser(db);
    const { user: outsider } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const res = await request(server)
      .post(`/api/trips/${trip.id}/feed/token`)
      .set('Cookie', sessionCookie(outsider.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  // ── share_manage on the token routes ───────────────────────────────────────
  // The token is the only credential /api/feed/trip/:token.ics asks for, so a
  // plain member must not be able to read, mint, rotate or clear it. Under the
  // default policy share_manage sits with the trip owner.

  it('403 on all four verbs for a member without share_manage', async () => {
    const { user: owner } = createUser(db);
    const { user: member } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    addTripMember(db, trip.id, member.id);
    const memberCookie = sessionCookie(member.id);

    for (const res of [
      await request(server).get(`/api/trips/${trip.id}/feed/token`).set('Cookie', memberCookie),
      await request(server).post(`/api/trips/${trip.id}/feed/token`).set('Cookie', memberCookie),
      await request(server).put(`/api/trips/${trip.id}/feed/token`).set('Cookie', memberCookie),
      await request(server).delete(`/api/trips/${trip.id}/feed/token`).set('Cookie', memberCookie),
    ]) {
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'No permission' });
    }
    // Refused, not silently applied: the column is untouched.
    expect((await findRow(orm, Trips, { id: trip.id }))!.feed_token).toBeNull();
  });

  it('a non-member still gets 404 rather than 403, so the 403 is no existence oracle', async () => {
    const { user: owner } = createUser(db);
    const { user: stranger } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const strangerCookie = sessionCookie(stranger.id);
    for (const res of [
      await request(server).get(`/api/trips/${trip.id}/feed/token`).set('Cookie', strangerCookie),
      await request(server).put(`/api/trips/${trip.id}/feed/token`).set('Cookie', strangerCookie),
      await request(server).delete(`/api/trips/${trip.id}/feed/token`).set('Cookie', strangerCookie),
    ]) {
      expect(res.status).toBe(404);
    }
  });

  it('a token issued before the tightening keeps working anonymously', async () => {
    const { user: owner } = createUser(db);
    const { user: member } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const gen = await request(server).post(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    const token = gen.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];
    addTripMember(db, trip.id, member.id);

    // The member may no longer manage it, but existing subscriptions must not break.
    expect(
      (await request(server).delete(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(member.id))).status,
    ).toBe(403);
    expect((await request(server).get(`/api/feed/trip/${token}.ics`)).status).toBe(200);
  });

  // ── Public trip feed ───────────────────────────────────────────────────────

  it('public trip feed: 200 text/calendar with injected refresh hints', async () => {
    const { user: owner } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const gen = await request(server).post(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    const token = gen.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    const res = await request(server).get(`/api/feed/trip/${token}.ics`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.text).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT1H');
    expect(res.text).toContain('X-PUBLISHED-TTL:PT1H');
    expect(res.text).toContain('BEGIN:VEVENT');
    expect(buildTripCalendar).toHaveBeenCalledWith(trip.id);
  });

  // The @Public feed quoted cal.filename straight into Content-Disposition, so
  // a non-ASCII calendar name was an unauthenticated 500 (#2165).
  it('public trip feed: a non-ASCII filename folds to an ASCII header with filename*', async () => {
    const { user: owner } = createUser(db);
    const trip = createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });
    const gen = await request(server).post(`/api/trips/${trip.id}/feed/token`).set('Cookie', sessionCookie(owner.id));
    const token = gen.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    // ASCII parity first: the default sample calendar keeps the exact legacy header.
    const plain = await request(server).get(`/api/feed/trip/${token}.ics`);
    expect(plain.headers['content-disposition']).toBe('inline; filename="sample.ics"');

    buildTripCalendar.mockImplementation(() => ({ ...sampleCalendar(), filename: '沖縄カレンダー.ics' }));
    const res = await request(server).get(`/api/feed/trip/${token}.ics`);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toBe(
      'inline; filename="download.ics"; filename*=UTF-8\'\'%E6%B2%96%E7%B8%84%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC.ics',
    );
  });

  it('public trip feed: 404 for an unknown token', async () => {
    const res = await request(server).get('/api/feed/trip/00000000-0000-0000-0000-000000000000.ics');
    expect(res.status).toBe(404);
  });

  // ── User (all-trips) feed ──────────────────────────────────────────────────

  it('user feed token: 401 without a cookie, generates with one', async () => {
    const { user: owner } = createUser(db);
    expect((await request(server).get('/api/feed/user/token')).status).toBe(401);
    const gen = await request(server).post('/api/feed/user/token').set('Cookie', sessionCookie(owner.id));
    expect(gen.status).toBe(201);
    expect(gen.body.feed_url).toMatch(new RegExp(`^${BASE}/api/feed/user/[0-9a-f-]+\\.ics$`));
  });

  it('all-trips feed excludes archived and >90-day-old trips', async () => {
    const { user: owner } = createUser(db);
    const active = createTrip(db, owner.id, { title: 'Active', start_date: '2026-01-01', end_date: '2099-01-01' });
    const archived = createTrip(db, owner.id, { title: 'Archived', start_date: '2026-01-01', end_date: '2099-01-01' });
    await updateRows(orm, Trips, { id: archived.id }, { is_archived: 1 });
    createTrip(db, owner.id, { title: 'Old', start_date: '2000-01-01', end_date: '2000-01-10' });

    const gen = await request(server).post('/api/feed/user/token').set('Cookie', sessionCookie(owner.id));
    const token = gen.body.feed_url.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    const res = await request(server).get(`/api/feed/user/${token}.ics`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.text).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT1H');
    expect(res.text).toContain(`X-WR-CALNAME:${owner.username}`);

    const calledIds = buildTripCalendar.mock.calls.map((c) => c[0]).sort((a, b) => a - b);
    expect(calledIds).toEqual([active.id]); // only the active, recent trip — not the archived or old one
  });

  it('all-trips feed includes trips shared with the user as a member, not just owned trips', async () => {
    const { user: owner } = createUser(db);
    const { user: sharer } = createUser(db);
    const owned = createTrip(db, owner.id, { title: 'Owned', start_date: '2026-01-01', end_date: '2099-01-01' });
    const shared = createTrip(db, sharer.id, { title: 'Shared', start_date: '2026-01-01', end_date: '2099-01-01' });
    addTripMember(db, shared.id, owner.id);

    const gen = await request(server).post('/api/feed/user/token').set('Cookie', sessionCookie(owner.id));
    const token = gen.body.feed_url.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    const res = await request(server).get(`/api/feed/user/${token}.ics`);
    expect(res.status).toBe(200);

    const calledIds = buildTripCalendar.mock.calls.map((c) => c[0]).sort((a, b) => a - b);
    expect(calledIds).toEqual([owned.id, shared.id].sort((a, b) => a - b));
  });

  it('public user feed: 404 for an unknown token', async () => {
    const res = await request(server).get('/api/feed/user/00000000-0000-0000-0000-000000000000.ics');
    expect(res.status).toBe(404);
  });

  it('all-trips feed carries VTIMEZONE blocks so TZID references resolve (#1453)', async () => {
    const { user: owner } = createUser(db);
    createTrip(db, owner.id, { start_date: '2026-01-01', end_date: '2099-01-01' });

    // A per-trip calendar whose event references a zone via TZID and defines it.
    const PARIS_VTIMEZONE =
      'BEGIN:VTIMEZONE\r\nTZID:Europe/Paris\r\nBEGIN:STANDARD\r\nDTSTART:19700101T000000\r\n' +
      'TZOFFSETFROM:+0100\r\nTZOFFSETTO:+0100\r\nTZNAME:Europe/Paris\r\nEND:STANDARD\r\nEND:VTIMEZONE\r\n';
    buildTripCalendar.mockImplementation(() => ({
      calName: 'Zoned',
      filename: 'zoned.ics',
      timezones: new Map([['Europe/Paris', PARIS_VTIMEZONE]]),
      events: [
        'BEGIN:VEVENT\r\nUID:trek-res-1@trek\r\nDTSTAMP:20260101T000000Z\r\n' +
          'DTSTART;TZID=Europe/Paris:20260602T090000\r\nSUMMARY:Flight\r\nEND:VEVENT\r\n',
      ],
    }));

    const gen = await request(server).post('/api/feed/user/token').set('Cookie', sessionCookie(owner.id));
    const token = gen.body.feed_url.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    const res = await request(server).get(`/api/feed/user/${token}.ics`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Paris');
    expect(res.text).toContain('DTSTART;TZID=Europe/Paris:20260602T090000');
    // VTIMEZONE must precede the VEVENT that references it.
    expect(res.text.indexOf('BEGIN:VTIMEZONE')).toBeLessThan(res.text.indexOf('BEGIN:VEVENT'));
  });
});
