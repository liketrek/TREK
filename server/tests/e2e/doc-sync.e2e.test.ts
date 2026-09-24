/**
 * Document sync e2e: drives /api/trips/:tripId/docsync through the REAL
 * AddonGuard, JwtAuthGuard and TripAccessGuard, over the real DI services
 * against a temp SQLite carrying the full schema.
 *
 * Two things are replaced and nothing else:
 *
 *  - `AddonsService.isAddonEnabled`, because the gate is what is under test;
 *  - every provider adapter, because a test must never open a socket to
 *    somebody's document archive. Each one is a spy that fails loudly if a
 *    route this file exercises turns out to reach a provider after all.
 *
 * What is pinned here is the access model, which is the part of this feature
 * that would hurt most if it drifted: the addon gate answering 404 before 401,
 * a stranger being unable to see that a trip exists, and a plain member being
 * able to READ where their documents go while only the owner may change it.
 * That last split is unusual for TREK (most trip routes treat members alike),
 * so it is worth a test that fails if someone "tidies" it away.
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

/**
 * The SSRF guard resolves DNS, and `paperless.example.com` does not exist. In
 * CI that is a lookup failure, which the guard correctly reports as "not
 * allowed". The guard is not what this file is testing, and a suite that needs
 * a working resolver is a suite that fails on someone's train.
 */
vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/utils/ssrfGuard')>();
  return {
    ...actual,
    checkSsrf: vi.fn(async (url: string) => ({
      allowed: !url.includes('blocked.invalid'),
      isPrivate: false,
      error: url.includes('blocked.invalid') ? 'blocked in test' : undefined,
    })),
  };
});

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { createTrip, createUser } from '../helpers/factories';
import { DocSyncModule } from '../../src/nest/doc-sync/doc-sync.module';
import { DocSyncMcp } from '../../src/nest/doc-sync/doc-sync.mcp';
import type { McpContext } from '../../src/nest-mcp';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { DOCUMENT_PROVIDERS } from '../../src/nest/doc-sync/document-provider';
import { PaperlessDocumentProvider } from '../../src/nest/doc-sync/providers/paperless.provider';
import { PapraDocumentProvider } from '../../src/nest/doc-sync/providers/papra.provider';
import { SynologyDriveDocumentProvider } from '../../src/nest/doc-sync/providers/synology-drive.provider';
import { NextcloudDocumentProvider, OpencloudDocumentProvider } from '../../src/nest/doc-sync/providers/webdav.provider';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

/** A provider that answers plausibly but never opens a socket. */
function fakeProvider(id: string) {
  const caps = {
    push: 'none' as const,
    stableId: true,
    remoteTrash: true,
    replaceInPlace: true,
    contentHashInListing: true,
    maxUploadBytes: null,
    acceptedMimeTypes: null,
    canCreateScope: true,
  };
  return {
    id,
    capabilities: () => caps,
    probe: vi.fn(async () => ({ success: true as const, data: { account: `${id}-account`, capabilities: caps } })),
    listScopes: vi.fn(async () => ({
      success: true as const,
      data: [{ scopeKey: `tag:1`, label: 'Japan 2026', remoteRootId: '1', remoteRootPath: '/TREK/japan' }],
    })),
    createScope: vi.fn(async (_c: unknown, name: string) => ({
      success: true as const,
      data: { scopeKey: `tag:2`, label: name, remoteRootId: '2', remoteRootPath: `/TREK/${name}` },
    })),
    resolveScope: vi.fn(async () => ({
      success: true as const,
      data: { scopeKey: 'tag:1', label: 'Japan 2026', remoteRootId: '1', remoteRootPath: '/TREK/japan' },
    })),
    list: vi.fn(async () => ({ success: true as const, data: { documents: [], cursor: 'c1', cursorUnchanged: false, truncated: false } })),
    fetch: vi.fn(async () => ({ success: false as const, error: { code: 'not_found' as const } })),
    push: vi.fn(async () => ({ success: false as const, error: { code: 'not_found' as const } })),
    rename: vi.fn(async () => ({ success: true as const, data: { remoteVersion: 'v2' } })),
    trash: vi.fn(async () => ({ success: true as const, data: undefined })),
  };
}

describe('Document sync e2e (real guards + real services + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let ownerId: number;
  let memberId: number;
  let strangerId: number;
  let tripId: number;

  async function build() {
    const providers = [
      [PaperlessDocumentProvider, 'paperless'],
      [PapraDocumentProvider, 'papra'],
      [NextcloudDocumentProvider, 'nextcloud'],
      [OpencloudDocumentProvider, 'opencloud'],
      [SynologyDriveDocumentProvider, 'synologydrive'],
    ] as const;
    let builder = Test.createTestingModule({ imports: [DatabaseModule, DocSyncModule] })
      .overrideProvider(AddonsService)
      .useValue({ isAddonEnabled });
    const fakes = providers.map(([, id]) => fakeProvider(id));
    providers.forEach(([token], i) => {
      builder = builder.overrideProvider(token).useValue(fakes[i]);
    });
    builder = builder.overrideProvider(DOCUMENT_PROVIDERS).useValue(fakes);
    const moduleRef = await builder.compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    createTables(db as never);
    runMigrations(db as never);
    ownerId = createUser(db as never, { username: 'owner', email: 'owner@test.local' }).user.id;
    memberId = createUser(db as never, { username: 'member', email: 'member@test.local' }).user.id;
    strangerId = createUser(db as never, { username: 'stranger', email: 'stranger@test.local' }).user.id;

    tripId = createTrip(db as never, ownerId, { title: 'Japan', start_date: '2026-10-01', end_date: '2026-10-07' }).id;
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(tripId, memberId);
    // Providers are off by default, exactly as a fresh install ships them.
    db.prepare("UPDATE document_providers SET enabled = 1 WHERE id IN ('paperless', 'nextcloud')").run();

    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
    db.close();
  });

  beforeEach(() => {
    isAddonEnabled.mockReturnValue(true);
  });

  it('answers 404 rather than 401 when the addon is off, to everyone alike', async () => {
    isAddonEnabled.mockReturnValue(false);
    await request(server).get(`/api/trips/${tripId}/docsync/status`).expect(404);
    await request(server)
      .get(`/api/trips/${tripId}/docsync/status`)
      .set('Cookie', sessionCookie(ownerId))
      .expect(404);
  });

  it('refuses an unauthenticated caller', async () => {
    await request(server).get(`/api/trips/${tripId}/docsync/status`).expect(401);
  });

  it('hides the trip from a stranger behind a 404', async () => {
    await request(server)
      .get(`/api/trips/${tripId}/docsync/status`)
      .set('Cookie', sessionCookie(strangerId))
      .expect(404);
  });

  it('lists only the providers an admin switched on', async () => {
    const res = await request(server)
      .get(`/api/trips/${tripId}/docsync/providers`)
      .set('Cookie', sessionCookie(ownerId))
      .expect(200);
    expect(res.body.map((p: { id: string }) => p.id).sort()).toEqual(['nextcloud', 'paperless']);
    // Every listed provider carries its form fields, so the client renders the
    // connection form from data rather than from a hard-coded list.
    expect(res.body[0].fields.length).toBeGreaterThan(0);
  });

  it('lets a plain member read the status but not change the binding', async () => {
    await request(server)
      .get(`/api/trips/${tripId}/docsync/status`)
      .set('Cookie', sessionCookie(memberId))
      .expect(200);

    await request(server)
      .put(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(memberId))
      .send({ providerId: 'paperless', baseUrl: 'https://paperless.example.com', credentials: { api_token: 'x' } })
      .expect(403);
  });

  it('refuses a provider the admin has not switched on', async () => {
    await request(server)
      .put(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ providerId: 'papra', baseUrl: 'https://papra.example.com', credentials: { api_key: 'x', organization_id: 'org_1' } })
      .expect(400);
  });

  it('rejects an unknown provider id at the contract, not in the handler', async () => {
    await request(server)
      .put(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ providerId: 'dropbox', baseUrl: 'https://example.com', credentials: {} })
      .expect(400);
  });

  it('stores a connection and never gives the secret back', async () => {
    const res = await request(server)
      .put(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId))
      .send({
        providerId: 'paperless',
        baseUrl: 'https://paperless.example.com/',
        credentials: { api_token: 'super-secret-token' },
      })
      .expect(200);

    expect(res.body.baseUrl).toBe('https://paperless.example.com');
    expect(res.body.secrets.api_token).toBe('••••••••');
    expect(JSON.stringify(res.body)).not.toContain('super-secret-token');

    // And it is encrypted at rest, not merely hidden on the way out.
    const row = db.prepare('SELECT secrets FROM document_connections WHERE trip_id = ?').get(tripId) as { secrets: string };
    expect(row.secrets).toMatch(/^enc:v1:/);
    expect(row.secrets).not.toContain('super-secret-token');
  });

  it('keeps the stored secret when the form comes back with a blank field', async () => {
    await request(server)
      .put(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ providerId: 'paperless', baseUrl: 'https://paperless.example.com', credentials: { api_token: '' } })
      .expect(200);
    const row = db.prepare('SELECT secrets FROM document_connections WHERE trip_id = ?').get(tripId) as { secrets: string };
    expect(row.secrets).toMatch(/^enc:v1:/);
  });

  it('does not let a blank form carry the stored secret to another address', async () => {
    // The stored token only ever goes to the server it was stored against;
    // anywhere else, the credential has to be typed in for that address.
    await request(server)
      .put(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ providerId: 'paperless', baseUrl: 'https://paperless.example.net', credentials: { api_token: '' } })
      .expect(400);
    const row = db.prepare('SELECT base_url FROM document_connections WHERE trip_id = ?').get(tripId) as { base_url: string };
    expect(row.base_url).toBe('https://paperless.example.com');
  });

  it('creates a folder or tag through the connection the path names', async () => {
    const conns = await request(server)
      .get(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId))
      .expect(200);
    const res = await request(server)
      .post(`/api/trips/${tripId}/docsync/connections/${conns.body[0].id}/scopes`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ name: 'Norway' })
      .expect(201);
    expect(res.body).toMatchObject({ scopeKey: 'tag:2', label: 'Norway' });
  });

  it('still takes a scope request from a client that sends the connection in the body too', async () => {
    // The body field was dropped in favour of the path. A client from before
    // that change has it stripped by the contract instead of being refused.
    const conns = await request(server)
      .get(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId));
    await request(server)
      .post(`/api/trips/${tripId}/docsync/connections/${conns.body[0].id}/scopes`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ connectionId: conns.body[0].id, name: 'Norway' })
      .expect(201);
  });

  it('creates no scope through a connection that belongs to another trip', async () => {
    const otherTripId = createTrip(db as never, ownerId, { title: 'Elsewhere' }).id;
    const conns = await request(server)
      .get(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId));
    await request(server)
      .post(`/api/trips/${otherTripId}/docsync/connections/${conns.body[0].id}/scopes`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ name: 'Norway' })
      .expect(404);
  });

  it('does not let a plain member create a folder or tag', async () => {
    const conns = await request(server)
      .get(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId));
    await request(server)
      .post(`/api/trips/${tripId}/docsync/connections/${conns.body[0].id}/scopes`)
      .set('Cookie', sessionCookie(memberId))
      .send({ name: 'Norway' })
      .expect(403);
  });

  it('binds the trip to a scope and reports it to every member', async () => {
    const conns = await request(server)
      .get(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId))
      .expect(200);
    const connectionId = conns.body[0].id;

    await request(server)
      .post(`/api/trips/${tripId}/docsync/links`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ connectionId, scopeKey: 'tag:1', remoteLabel: 'Japan 2026', direction: 'both', deletePolicy: 'unlink', conflictPolicy: 'manual', syncEnabled: true })
      .expect(200);

    const asMember = await request(server)
      .get(`/api/trips/${tripId}/docsync/links`)
      .set('Cookie', sessionCookie(memberId))
      .expect(200);
    expect(asMember.body).toHaveLength(1);
    expect(asMember.body[0].remoteLabel).toBe('Japan 2026');
    // The shared secret behind the webhook URL is never handed out, not even to
    // the owner: it exists so a provider can prove itself, not to be read.
    expect(asMember.body[0].webhookSecret).toBe('••••••••');
  });

  it('changes only the setting a patch names, through the real contract', async () => {
    // The unit tests call the handler directly and never see the pipe. Through
    // it, a schema that fills in defaults turns one switch into a full reset.
    const links = await request(server)
      .get(`/api/trips/${tripId}/docsync/links`)
      .set('Cookie', sessionCookie(ownerId));
    const linkId = links.body[0].id;
    await request(server)
      .patch(`/api/trips/${tripId}/docsync/links/${linkId}`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ direction: 'pull', deletePolicy: 'trash' })
      .expect(200);

    const paused = await request(server)
      .patch(`/api/trips/${tripId}/docsync/links/${linkId}`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ syncEnabled: false })
      .expect(200);

    expect(paused.body).toMatchObject({
      syncEnabled: false,
      direction: 'pull',
      deletePolicy: 'trash',
      conflictPolicy: 'manual',
      remoteLabel: 'Japan 2026',
    });
  });

  it('still names the store of a binding after the admin switches its provider off', async () => {
    // The providers list drops a provider that is off, so the binding itself is
    // the only thing left that can tell a member where the documents went.
    db.prepare("UPDATE document_providers SET enabled = 0 WHERE id = 'paperless'").run();
    try {
      const providers = await request(server)
        .get(`/api/trips/${tripId}/docsync/providers`)
        .set('Cookie', sessionCookie(memberId))
        .expect(200);
      expect(providers.body.map((p: { id: string }) => p.id)).not.toContain('paperless');

      const links = await request(server)
        .get(`/api/trips/${tripId}/docsync/links`)
        .set('Cookie', sessionCookie(memberId))
        .expect(200);
      expect(links.body[0]).toMatchObject({ providerId: 'paperless', providerName: 'Paperless-ngx' });

      // The assistant reads the same bindings through its own tool.
      const ctx = { userId: memberId, scopes: null, isStaticToken: false } as McpContext;
      const result = app.get(DocSyncMcp).getTripDocumentSync({ tripId }, ctx);
      const status = JSON.parse(result.content[0].text) as { links: Array<Record<string, unknown>> };
      expect(status.links[0]).toMatchObject({ providerId: 'paperless', providerName: 'Paperless-ngx' });
    } finally {
      db.prepare("UPDATE document_providers SET enabled = 1 WHERE id = 'paperless'").run();
    }
  });

  it('refuses a binding whose connection belongs to another trip', async () => {
    const otherTripId = createTrip(db as never, ownerId, { title: 'Other' }).id;
    const conns = await request(server)
      .get(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId));
    await request(server)
      .post(`/api/trips/${otherTripId}/docsync/links`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ connectionId: conns.body[0].id, scopeKey: 'tag:1' })
      .expect(400);
  });

  it('answers 200 with a verdict in the body when a probe fails, not an error status', async () => {
    // The settings form needs a field to render, not an exception: the same
    // contract the photo providers pin as CRITICAL in their own e2e suite.
    const res = await request(server)
      .post(`/api/trips/${tripId}/docsync/connections/test`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ providerId: 'paperless', baseUrl: 'https://blocked.invalid', credentials: {} })
      .expect(200);
    expect(res.body.connected).toBe(false);
    expect(typeof res.body.error).toBe('string');
  });

  it('unbinds without deleting anything', async () => {
    const links = await request(server)
      .get(`/api/trips/${tripId}/docsync/links`)
      .set('Cookie', sessionCookie(ownerId));
    const linkId = links.body[0].id;
    const res = await request(server)
      .delete(`/api/trips/${tripId}/docsync/links/${linkId}`)
      .set('Cookie', sessionCookie(ownerId))
      .expect(200);
    expect(res.body.documentsKept).toBe(true);
    expect(db.prepare('SELECT COUNT(*) AS n FROM trip_document_links WHERE id = ?').get(linkId)).toEqual({ n: 0 });
  });

  it('disconnects the store through the real contract, bindings included', async () => {
    const conns = await request(server)
      .get(`/api/trips/${tripId}/docsync/connections`)
      .set('Cookie', sessionCookie(ownerId));
    const connectionId = conns.body[0].id;
    await request(server)
      .post(`/api/trips/${tripId}/docsync/links`)
      .set('Cookie', sessionCookie(ownerId))
      .send({ connectionId, scopeKey: 'tag:2', remoteLabel: 'Norway', direction: 'both', deletePolicy: 'unlink', conflictPolicy: 'manual', syncEnabled: true })
      .expect(200);

    await request(server)
      .delete(`/api/trips/${tripId}/docsync/connections/${connectionId}`)
      .set('Cookie', sessionCookie(memberId))
      .expect(403);
    const res = await request(server)
      .delete(`/api/trips/${tripId}/docsync/connections/${connectionId}`)
      .set('Cookie', sessionCookie(ownerId))
      .expect(200);

    expect(res.body).toEqual({ success: true });
    expect(db.prepare('SELECT COUNT(*) AS n FROM document_connections WHERE trip_id = ?').get(tripId)).toEqual({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM trip_document_links WHERE trip_id = ?').get(tripId)).toEqual({ n: 0 });
  });

  it('accepts an unknown webhook token without revealing that it is unknown', async () => {
    // A 404 here would let anyone enumerate which bindings exist.
    await request(server).post('/api/docsync/webhook/definitely-not-a-token').expect(200);
  });
});
