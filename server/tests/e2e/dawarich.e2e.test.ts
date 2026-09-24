/**
 * Dawarich e2e — drives /api/integrations/dawarich through the REAL AddonGuard
 * and the REAL JwtAuthGuard, over the real DI-native services (DatabaseModule +
 * DawarichModule) against a temp SQLite db carrying the full schema.
 *
 * Two things are replaced and nothing else:
 *
 *  - `AddonsService.isAddonEnabled`, because the gate is what is under test and
 *    an admin toggle is not worth seeding for it;
 *  - `DawarichClient`, because a test must never open a socket to somebody's
 *    location archive. Every method is a spy that fails loudly if a route this
 *    file exercises turns out to reach upstream after all.
 *
 * Covered: the 404-before-401 ordering of the addon gate, the unauthenticated
 * 401, the shape of a connection nobody has configured, the two URL rejections
 * that need no DNS, the suggestions envelope's `connected: false`, and the
 * cross-user isolation — someone else's suggestion is invisible and untouchable
 * through your own session, and answers the same 404 a missing one does.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  closeDb: () => {},
  reinitialize: () => {},
  getPlaceWithTags: () => null,
  canAccessTrip: (tripId: number | string, userId: number) =>
    db
      .prepare(
        'SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)',
      )
      .get(userId, tripId, userId),
  isOwner: () => false,
}));

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));
vi.mock('../../src/websocket', () => ({ broadcastToUser: vi.fn(), broadcast: vi.fn() }));

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { createUser } from '../helpers/factories';
import { DawarichModule } from '../../src/nest/integrations/dawarich.module';
import { DawarichClient } from '../../src/nest/integrations/dawarich.client';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

/**
 * Every outbound call an instance would ever receive, stubbed to throw. A route
 * that unexpectedly reaches upstream fails this suite instead of quietly
 * hanging on a DNS lookup in CI.
 */
function makeClientStub() {
  const boom = (name: string) => vi.fn(() => {
    throw new Error(`DawarichClient.${name} must not be called from the e2e suite`);
  });
  return {
    probe: boom('probe'),
    listVisits: boom('listVisits'),
    listTracks: boom('listTracks'),
    listPoints: boom('listPoints'),
    listVisitedCities: boom('listVisitedCities'),
    findVisitsNear: boom('findVisitsNear'),
  };
}

/** A suggestion row with only the NOT NULL columns filled in. */
function seedSuggestion(userId: number, sourceVisitId: string, name: string): number {
  const info = db
    .prepare(
      `INSERT INTO dawarich_visit_suggestions
         (user_id, source_visit_id, name, lat, lng, started_at, ended_at, duration_minutes, local_date, source_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(userId, sourceVisitId, name, 48.8584, 2.2945, '2026-05-01T10:00:00+02:00', '2026-05-01T12:30:00+02:00', 150, '2026-05-01', 'hash-' + sourceVisitId);
  return Number(info.lastInsertRowid);
}

describe('Dawarich e2e (real addon gate + real auth guard + real services + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let ownerId: number;
  let strangerId: number;
  let strangerSuggestionId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, DawarichModule] })
      .overrideProvider(AddonsService)
      .useValue({ isAddonEnabled })
      .overrideProvider(DawarichClient)
      .useValue(makeClientStub())
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // by metatype, exactly as they do under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    createTables(db as never);
    runMigrations(db as never);
    ownerId = createUser(db as never, { username: 'dawarich-owner', email: 'dawarich-owner@test.example' }).user.id;
    strangerId = createUser(db as never, { username: 'dawarich-stranger', email: 'dawarich-stranger@test.example' }).user.id;
    strangerSuggestionId = seedSuggestion(strangerId, 'visit-stranger-1', 'Eiffel Tower');
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    isAddonEnabled.mockReturnValue(true);
    db.prepare('DELETE FROM dawarich_connections').run();
    db.prepare('DELETE FROM dawarich_visit_suggestions WHERE user_id = ?').run(ownerId);
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Auth + addon gate ────────────────────────────────────────────────────

  it('DAWARICH-E2E-001: 401 without a session cookie', async () => {
    const res = await request(server).get('/api/integrations/dawarich/settings');
    expect(res.status).toBe(401);
  });

  it('DAWARICH-E2E-002: a session on a disabled addon gets 404 with the Dawarich label, not a 403 that confirms the route', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server)
      .get('/api/integrations/dawarich/settings')
      .set('Cookie', sessionCookie(ownerId));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Dawarich addon is not enabled' });
  });

  it('DAWARICH-E2E-003: the addon gate beats the auth guard — no cookie and no addon is still 404, so an anonymous probe learns nothing', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).get('/api/integrations/dawarich/suggestions');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Dawarich addon is not enabled' });
  });

  it('DAWARICH-E2E-004: a disabled addon 404s the write routes too, and nothing is persisted', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server)
      .put('/api/integrations/dawarich/settings')
      .set('Cookie', sessionCookie(ownerId))
      .send({ url: 'https://dawarich.example', apiKey: 'secret' });
    expect(res.status).toBe(404);
    expect(db.prepare('SELECT COUNT(*) AS n FROM dawarich_connections').get()).toEqual({ n: 0 });
  });

  it('DAWARICH-E2E-005: the addon flag is re-read per request — switching it back on reopens the route without a restart', async () => {
    isAddonEnabled.mockReturnValue(false);
    expect((await request(server).get('/api/integrations/dawarich/settings').set('Cookie', sessionCookie(ownerId))).status).toBe(404);
    isAddonEnabled.mockReturnValue(true);
    expect((await request(server).get('/api/integrations/dawarich/settings').set('Cookie', sessionCookie(ownerId))).status).toBe(200);
  });

  // ── Connection ───────────────────────────────────────────────────────────

  it('DAWARICH-E2E-010: GET settings for a user who has never connected answers the empty connection, with the poll defaulted on', async () => {
    const res = await request(server).get('/api/integrations/dawarich/settings').set('Cookie', sessionCookie(ownerId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      url: '',
      // Never the key, and not even a placeholder when there is nothing stored.
      apiKeyMasked: '',
      allowInsecureTls: false,
      // No row yet is a user who has not opened the card; the default there is
      // "poll once it is connected", not "off".
      syncEnabled: true,
      connected: false,
      lastSyncAt: null,
      lastSyncState: 'never',
      lastSyncError: null,
      capabilities: null,
    });
  });

  it('DAWARICH-E2E-011: PUT settings with an unparseable URL is a 400 and writes nothing', async () => {
    const res = await request(server)
      .put('/api/integrations/dawarich/settings')
      .set('Cookie', sessionCookie(ownerId))
      .send({ url: 'not a url', apiKey: 'secret' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid URL' });
    // Crucially: the key is not stored on a rejected address either.
    expect(db.prepare('SELECT COUNT(*) AS n FROM dawarich_connections').get()).toEqual({ n: 0 });
  });

  it('DAWARICH-E2E-012: PUT settings with a non-HTTP scheme is a 400 — file:// and friends never reach the fetch layer', async () => {
    const res = await request(server)
      .put('/api/integrations/dawarich/settings')
      .set('Cookie', sessionCookie(ownerId))
      .send({ url: 'file:///etc/passwd' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Only HTTP and HTTPS URLs are allowed' });
    expect(db.prepare('SELECT COUNT(*) AS n FROM dawarich_connections').get()).toEqual({ n: 0 });
  });

  it('DAWARICH-E2E-013: PUT settings rejects a body the shared contract does not accept, before any of this runs', async () => {
    const res = await request(server)
      .put('/api/integrations/dawarich/settings')
      .set('Cookie', sessionCookie(ownerId))
      .send({ apiKey: 'secret' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^url: /);
  });

  it('DAWARICH-E2E-014: clearing the address saves the row, keeps the connection unconnected and persists the poll toggle', async () => {
    const put = await request(server)
      .put('/api/integrations/dawarich/settings')
      .set('Cookie', sessionCookie(ownerId))
      .send({ url: '', syncEnabled: false });
    expect(put.status).toBe(200);
    expect(put.body).toEqual({ success: true });

    const row = db.prepare('SELECT url, api_key, sync_enabled FROM dawarich_connections WHERE user_id = ?').get(ownerId);
    expect(row).toEqual({ url: null, api_key: null, sync_enabled: 0 });

    const res = await request(server).get('/api/integrations/dawarich/settings').set('Cookie', sessionCookie(ownerId));
    expect(res.body.connected).toBe(false);
    expect(res.body.syncEnabled).toBe(false);
    expect(res.body.apiKeyMasked).toBe('');
  });

  it('DAWARICH-E2E-015: DELETE settings answers 200 even when there was nothing to disconnect', async () => {
    const res = await request(server).delete('/api/integrations/dawarich/settings').set('Cookie', sessionCookie(ownerId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('DAWARICH-E2E-016: POST test with a blank key against a host other than the stored one answers not_connected and never dials out', async () => {
    // The stored key is the one thing this route must not carry to an address
    // the form just typed. The client stub throws on every call, so a probe
    // that did go out would surface as `unreachable` here rather than as the
    // refusal the form is meant to render.
    db.prepare('INSERT INTO dawarich_connections (user_id, url, api_key) VALUES (?, ?, ?)').run(
      ownerId,
      'https://dawarich.old.example',
      'plain-legacy-key',
    );

    const res = await request(server)
      .post('/api/integrations/dawarich/test')
      .set('Cookie', sessionCookie(ownerId))
      .send({ url: 'https://dawarich.elsewhere.example' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ connected: false, error: 'not_connected' });
    expect(res.body.errorDetail).toContain('https://dawarich.old.example');
    // And the stored connection is untouched by a test, as it always was.
    expect(db.prepare('SELECT url, api_key FROM dawarich_connections WHERE user_id = ?').get(ownerId)).toEqual({
      url: 'https://dawarich.old.example',
      api_key: 'plain-legacy-key',
    });
  });

  // ── Suggestions ──────────────────────────────────────────────────────────

  it('DAWARICH-E2E-020: GET suggestions without a connection answers the envelope with connected:false — an empty list alone would read as "no stays"', async () => {
    const res = await request(server).get('/api/integrations/dawarich/suggestions').set('Cookie', sessionCookie(ownerId));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      suggestions: [],
      connected: false,
      lastSyncAt: null,
      lastSyncState: 'never',
      lastSyncError: null,
    });
  });

  it('DAWARICH-E2E-021: an unknown state filter is a 400 rather than a silently unfiltered list', async () => {
    const res = await request(server)
      .get('/api/integrations/dawarich/suggestions?state=pending')
      .set('Cookie', sessionCookie(ownerId));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'state must be one of: new, accepted, dismissed' });
  });

  it('DAWARICH-E2E-022: a tripId that only starts with digits is a 400', async () => {
    const res = await request(server)
      .get('/api/integrations/dawarich/suggestions?tripId=12abc')
      .set('Cookie', sessionCookie(ownerId));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid tripId' });
  });

  // ── Cross-user isolation ─────────────────────────────────────────────────

  it("DAWARICH-E2E-030: another user's suggestion never appears in your own list", async () => {
    const mine = seedSuggestion(ownerId, 'visit-mine-1', 'Gare du Nord');

    const res = await request(server).get('/api/integrations/dawarich/suggestions').set('Cookie', sessionCookie(ownerId));
    expect(res.status).toBe(200);
    const ids = res.body.suggestions.map((s: { id: number }) => s.id);
    expect(ids).toEqual([mine]);
    expect(ids).not.toContain(strangerSuggestionId);
    // And the row really is there for the other user, so this is isolation and
    // not an empty table.
    expect(db.prepare('SELECT user_id FROM dawarich_visit_suggestions WHERE id = ?').get(strangerSuggestionId))
      .toEqual({ user_id: strangerId });
  });

  it("DAWARICH-E2E-031: PUT state on another user's suggestion is a 404 — the same answer a missing id gets, so nothing is enumerable", async () => {
    const res = await request(server)
      .put(`/api/integrations/dawarich/suggestions/${strangerSuggestionId}/state`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ state: 'dismissed' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Suggestion not found' });
    expect(db.prepare('SELECT state FROM dawarich_visit_suggestions WHERE id = ?').get(strangerSuggestionId))
      .toEqual({ state: 'new' });

    const missing = await request(server)
      .put('/api/integrations/dawarich/suggestions/999999/state')
      .set('Cookie', sessionCookie(ownerId))
      .send({ state: 'dismissed' });
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual(res.body);
  });

  it("DAWARICH-E2E-032: POST accept on another user's suggestion is a 404 with the domain's own code", async () => {
    const res = await request(server)
      .post(`/api/integrations/dawarich/suggestions/${strangerSuggestionId}/accept`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ target: 'place', tripId: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Suggestion not found', code: 'not_found' });
    expect(db.prepare('SELECT state, target FROM dawarich_visit_suggestions WHERE id = ?').get(strangerSuggestionId))
      .toEqual({ state: 'new', target: null });
  });

  it('DAWARICH-E2E-033: your own suggestion is reachable through the same route, which is what makes the two 404s above meaningful', async () => {
    const mine = seedSuggestion(ownerId, 'visit-mine-2', 'Musée d’Orsay');

    const res = await request(server)
      .put(`/api/integrations/dawarich/suggestions/${mine}/state`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ state: 'dismissed' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(mine);
    expect(res.body.state).toBe('dismissed');
    expect(db.prepare('SELECT state FROM dawarich_visit_suggestions WHERE id = ?').get(mine)).toEqual({ state: 'dismissed' });
  });
});
