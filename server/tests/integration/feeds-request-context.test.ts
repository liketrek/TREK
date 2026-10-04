/**
 * Anonymous ICS feed request-context ratchet (Plan 3d Task 0, deliverable
 * 4a — inventory §12/§18.17).
 *
 * `GET /api/feed/trip/:token.ics` and `GET /api/feed/user/:token.ics`
 * (`feeds.controller.ts`'s `FeedsPublicController`, class-level `@Public`)
 * are ordinary Nest routes reached by an anonymous caller with no session —
 * `@Public()` exempts only the auth guard, and the per-request EntityManager
 * fork `buildApp()` mounts as a pathless middleware (bootstrap.ts's
 * `mikroOrmRequestContext`) runs ahead of every route including these two,
 * the same argument `nest-mcp/registry.ts`'s own
 * middleware wiring makes for `/mcp`. No existing test pinned this before
 * this file (inventory §12): the e2e feeds harness builds its own module
 * graph, not `buildApp()`'s real production wiring, and `FeedsService`'s own
 * `buildTripIcs`/`buildUserIcs` swallow EVERY calendar exception into a
 * plain `return null` with no log line at all (`feeds.service.ts:130,
 * :176` — bare `catch {}`), so a future regression that makes a converted
 * (Task 4/5) repository read throw `cannotUseGlobalContext` would come back
 * as the exact SAME 404 `{"error":"Feed not found"}` a genuinely wrong
 * token produces — indistinguishable by response shape alone (§18.17: "the
 * boot probe must diff bodies and the log, not statuses alone").
 *
 * SEAM-FEED-001 is the ratchet that actually distinguishes the two: it
 * drives the REAL route for a VALID token with a stub standing in for the
 * eventual repository-backed `CalendarService.buildTripCalendar` (the same
 * technique `orm-request-context-seams.test.ts`'s SEAM-002 uses for the
 * pre-init uploads route) and asserts BOTH that the HTTP response succeeds
 * AND that a genuine repository read, performed from exactly the point in
 * the request lifecycle the real implementation will occupy, resolves
 * against the SAME `MikroORM` instance `app.get(MikroORM)` does — a
 * `cannotUseGlobalContext` throw there fails this test outright (it is not
 * swallowed the way `FeedsService`'s own catch swallows a normal
 * `CalendarService` throw, because the read happens with `await`, inside
 * the stub, before the stub returns). SEAM-FEED-002 pins today's genuine
 * "wrong token" 404 body, unmutated. SEAM-FEED-003 is the mutation proof:
 * it forces the exact `cannotUseGlobalContext`-shaped throw §18.17
 * describes and shows the route degrades to the SAME 404 body a wrong
 * token produces — proving, by direct observation, that the 404 ALONE
 * cannot tell the two apart, which is exactly why SEAM-FEED-001's positive
 * "the read must actually happen and succeed" assertion — not a status-code
 * check — is the ratchet that would actually go red the day a real
 * conversion regresses this.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn(), getOnlineUserIds: vi.fn(() => []) }));

import { randomUUID } from 'node:crypto';
import { MikroORM } from '@mikro-orm/core';
import request from 'supertest';
import type { Application } from 'express';
import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { CalendarService } from '../../src/nest/calendar/calendar.service';
import { Trips } from '../../src/db/entities/Trips.entity';
import { createTrip, createUser } from '../helpers/factories';

describe('Anonymous ICS feed routes run inside a request context', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it('SEAM-FEED-001: GET /api/feed/trip/:token.ics for a VALID token performs a real repository read, inside the request, against the SAME MikroORM app.get(MikroORM) does', async () => {
    const orm = app.get(MikroORM);
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Context-Proof Trip' });
    const token = randomUUID();
    testDb.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run(token, trip.id);

    let repoRead: unknown;
    let caught: unknown;
    const calendar = app.get(CalendarService);
    const spy = vi.spyOn(calendar, 'buildTripCalendar').mockImplementation(async (tripId: string | number) => {
      try {
        repoRead = await orm.em.getRepository(Trips).findOne({ id: Number(tripId) });
      } catch (e) {
        caught = e;
      }
      return { calName: 'Stub Calendar', filename: 'stub.ics', timezones: new Map(), events: [] };
    });
    try {
      const httpApp = app.getHttpAdapter().getInstance() as Application;
      const res = await request(httpApp).get(`/api/feed/trip/${token}.ics`);

      expect(caught).toBeUndefined();
      expect(repoRead).toBeTruthy();
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/calendar/);
      expect(res.text).toContain('BEGIN:VCALENDAR');
      expect(res.text).toContain('Stub Calendar');
    } finally {
      spy.mockRestore();
    }
  });

  it('SEAM-FEED-002: GET /api/feed/trip/:token.ics for a WRONG token is the legacy 404 body, unmutated code', async () => {
    const httpApp = app.getHttpAdapter().getInstance() as Application;
    const res = await request(httpApp).get(`/api/feed/trip/${randomUUID()}.ics`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Feed not found' });
  });

  /**
   * The mutation §18.17 warns about, applied for real: `CalendarService
   * .buildTripCalendar` throws the exact shape a missing request context
   * throws (`ValidationError.cannotUseGlobalContext()`'s message —
   * `@mikro-orm/core/errors.js`). `FeedsService.buildTripIcs`'s bare
   * `catch {}` (`feeds.service.ts:130`) swallows it into `return null`,
   * same as a wrong token — proving the 404 body ALONE cannot distinguish
   * the two, which is why SEAM-FEED-001's positive read-succeeded assertion
   * (not a status/body check) is the test that actually catches a real
   * regression of this shape.
   */
  it('SEAM-FEED-003 (mutation proof): a forced cannotUseGlobalContext throw inside the calendar builder degrades a VALID token to the SAME 404 body as a wrong one — the 404 alone cannot tell them apart', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Mutation-Proof Trip' });
    const token = randomUUID();
    testDb.prepare('UPDATE trips SET feed_token = ? WHERE id = ?').run(token, trip.id);

    const calendar = app.get(CalendarService);
    const spy = vi.spyOn(calendar, 'buildTripCalendar').mockImplementation(async () => {
      throw new Error(
        "ValidationError: Using global context, please provide the EM instance via ContextProvider.forkEntityManager() or wrap your queries via em.transactional(cb) or MikroORM.RequestContext.create(em, cb) (cannotUseGlobalContext)",
      );
    });
    try {
      const httpApp = app.getHttpAdapter().getInstance() as Application;
      const res = await request(httpApp).get(`/api/feed/trip/${token}.ics`);
      // Same shape as SEAM-FEED-002's genuinely-wrong-token 404 — this IS the
      // hole §18.17 documents. SEAM-FEED-001 is what a real regression here
      // actually fails.
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Feed not found' });
    } finally {
      spy.mockRestore();
    }
  });

  it('SEAM-FEED-004: GET /api/feed/user/:token.ics for a WRONG token is the legacy 404 body', async () => {
    const httpApp = app.getHttpAdapter().getInstance() as Application;
    const res = await request(httpApp).get(`/api/feed/user/${randomUUID()}.ics`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Feed not found' });
  });

  /**
   * M2 (Plan 3d Task 0 review, folded into Task 7's fix wave): SEAM-FEED-001..
   * 004 only ever drove `/api/feed/trip/…`; the user feed had no valid-token
   * case at all. `FeedsService.buildUserIcs` catches EVERY per-trip failure
   * into `// skip failed trips` (`feeds.service.ts:151`) and still answers
   * 200 with an EMPTY calendar — so a `cannotUseGlobalContext` regression on
   * this route is invisible to a status/body check the same way SEAM-FEED-003
   * showed for the trip feed, but WORSE: the trip feed at least degrades to a
   * 404, while this route stays 200 either way. The assertion that actually
   * catches it is SEAM-FEED-001's own shape — a genuine repository read
   * happened, against the real request-scoped `MikroORM`, AND the sentinel
   * event the stub returns is actually IN the body — never a status check
   * alone, which cannot tell "the read happened" from "every trip's read was
   * silently swallowed".
   */
  it('SEAM-FEED-005: GET /api/feed/user/:token.ics for a VALID token performs a real repository read and the resulting event reaches the body, inside the request, against the SAME MikroORM app.get(MikroORM) does', async () => {
    const orm = app.get(MikroORM);
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'User-Feed Context-Proof Trip' });
    const token = randomUUID();
    testDb.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run(token, user.id);

    let repoRead: unknown;
    let caught: unknown;
    const calendar = app.get(CalendarService);
    const spy = vi.spyOn(calendar, 'buildTripCalendar').mockImplementation(async (tripId: string | number) => {
      try {
        repoRead = await orm.em.getRepository(Trips).findOne({ id: Number(tripId) });
      } catch (e) {
        caught = e;
      }
      return { calName: 'Stub Calendar', filename: 'stub.ics', timezones: new Map(), events: ['BEGIN:VEVENT\r\nSUMMARY:Sentinel Event\r\nEND:VEVENT\r\n'] };
    });
    try {
      const httpApp = app.getHttpAdapter().getInstance() as Application;
      const res = await request(httpApp).get(`/api/feed/user/${token}.ics`);

      expect(caught).toBeUndefined();
      expect(repoRead).toBeTruthy();
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/calendar/);
      // NOT a status-only check: this is what distinguishes a genuine read
      // from the route's own per-trip swallow, which would return the SAME
      // 200 with an EMPTY calendar (no VEVENT at all) if the read failed
      // with a request-context error.
      expect(res.text).toContain('BEGIN:VEVENT');
      expect(res.text).toContain('Sentinel Event');
    } finally {
      spy.mockRestore();
    }
  });
});
