/**
 * MCP integration tests.
 * Covers MCP-001 to MCP-013.
 *
 * The MCP endpoint uses JWT auth and server-sent events / streaming HTTP.
 * Tests cover authentication, session management, rate limiting, and API token auth.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: (placeId: number) => {
      const place: any = db.prepare(`SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser } from '../helpers/factories';
import { generateToken } from '../helpers/auth';
import { createMcpToken } from '../helpers/factories';
import { closeMcpSessions } from '../../src/mcp/index';
import { sessions } from '../../src/mcp/sessionManager';
import { getMcpSafeUrl } from '../../src/app-config';
import { OauthService } from '../../src/nest/oauth/oauth.service';
import { DatabaseService } from '../../src/nest/database/database.service';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { AuditService } from '../../src/nest/audit/audit.service';

const oauthDbs = new DatabaseService(testDb);
const oauthSvc = new OauthService(oauthDbs, new AddonsService(oauthDbs), new AuditService(oauthDbs));

/** Mint a trekoa_ access token for the user via a fresh OAuth client. */
function mintOauthToken(userId: number, audience: string | null): { accessToken: string; clientId: string } {
  const created = oauthSvc.createOAuthClient(userId, 'MCP Test Client', ['https://client.example.com/cb'], ['trips:read']);
  const clientId = (created.client as { client_id: string }).client_id;
  const tokens = oauthSvc.issueTokens(clientId, userId, ['trips:read'], null, audience);
  return { accessToken: tokens.access_token, clientId };
}

const MCP_AUDIENCE = `${getMcpSafeUrl().replace(/\/+$/, '')}/mcp`;
const EXPECTED_CHALLENGE =
  `Bearer realm="TREK MCP", resource_metadata="${getMcpSafeUrl().replace(/\/+$/, '')}/.well-known/oauth-protected-resource/mcp", error="invalid_token"`;

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
});

afterAll(async () => {
  closeMcpSessions();
  await nestApp.close();
  testDb.close();
});

describe('MCP authentication', () => {
  // MCP handler checks if the 'mcp' addon is enabled first (403 if not),
  // then checks auth (401). In test DB the addon may be disabled.

  it('MCP-001 — POST /mcp without auth returns 403 (addon disabled before auth check)', async () => {
    const res = await request(app)
      .post('/mcp')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1 });
    // MCP handler checks addon enabled before verifying auth; addon is disabled in test DB
    expect(res.status).toBe(403);
  });

  it('MCP-001 — GET /mcp without auth returns 403 (addon disabled)', async () => {
    const res = await request(app).get('/mcp');
    expect(res.status).toBe(403);
  });

  it('MCP-001 — DELETE /mcp without auth returns 403 (addon disabled)', async () => {
    const res = await request(app)
      .delete('/mcp')
      .set('Mcp-Session-Id', 'fake-session-id');
    expect(res.status).toBe(403);
  });
});

describe('MCP session init', () => {
  it('MCP-002 — POST /mcp with valid JWT passes auth check (may fail if addon disabled)', async () => {
    const { user } = createUser(testDb);
    const token = generateToken(user.id);

    // Enable MCP addon in test DB
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1, params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
    // Valid JWT + enabled addon → auth passes; SDK returns 200 with session headers
    expect(res.status).toBe(200);
  });

  it('MCP-003 — DELETE /mcp with unknown session returns 404', async () => {
    const { user } = createUser(testDb);
    const token = generateToken(user.id);

    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const res = await request(app)
      .delete('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('Mcp-Session-Id', 'nonexistent-session-id');
    expect(res.status).toBe(404);
  });

  it('MCP-004 — POST /mcp with invalid JWT returns 401 (when addon enabled)', async () => {
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer invalid.jwt.token')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1 });
    expect(res.status).toBe(401);
  });
});

describe('MCP API token auth', () => {
  it('MCP-002 — POST /mcp with valid trek_ API token authenticates successfully', async () => {
    const { user } = createUser(testDb);
    const { rawToken } = createMcpToken(testDb, user.id);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${rawToken}`)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1, params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
    expect(res.status).toBe(200);
  });

  it('MCP-002 — last_used_at is updated on token use', async () => {
    const { user } = createUser(testDb);
    const { rawToken, id: tokenId } = createMcpToken(testDb, user.id);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const before = (testDb.prepare('SELECT last_used_at FROM mcp_tokens WHERE id = ?').get(tokenId) as { last_used_at: string | null }).last_used_at;

    await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${rawToken}`)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1, params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });

    const after = (testDb.prepare('SELECT last_used_at FROM mcp_tokens WHERE id = ?').get(tokenId) as { last_used_at: string | null }).last_used_at;
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
  });

  it('MCP — POST /mcp with unknown trek_ token returns 401', async () => {
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', 'Bearer trek_totally_fake_token_not_in_db')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1 });
    expect(res.status).toBe(401);
  });

  it('MCP — POST /mcp with no Authorization header returns 401', async () => {
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const res = await request(app)
      .post('/mcp')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1 });
    expect(res.status).toBe(401);
  });
});

describe('MCP session management', () => {
  async function createSession(userId: number): Promise<string> {
    const token = generateToken(userId);
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1, params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
    expect(res.status).toBe(200);
    const sessionId = res.headers['mcp-session-id'];
    expect(sessionId).toBeTruthy();
    return sessionId as string;
  }

  it('MCP-003 — at the session cap, the coldest session is evicted rather than the request refused', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const sessionsForUser = () => [...sessions.values()].filter((s) => s.userId === user.id).length;

    // Fill the default cap of 20.
    const firstSessionId = await createSession(user.id);
    for (let i = 1; i < 20; i++) await createSession(user.id);
    expect(sessionsForUser()).toBe(20);

    // The 21st initialize must still succeed. A hard 429 here is what wedged real users: a
    // client that can't persist its Mcp-Session-Id re-initializes on every tool call, and
    // would be locked out of the server permanently once it hit the cap.
    const newSessionId = await createSession(user.id);

    expect(sessionsForUser()).toBe(20); // capped, not growing
    expect(sessions.has(newSessionId)).toBe(true);
    expect(sessions.has(firstSessionId)).toBe(false); // the least-recently-active one made room
  });

  it('MCP-006 — initializes that race past the cap check are trimmed when they register', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const sessionsForUser = () => [...sessions.values()].filter((s) => s.userId === user.id).length;

    // What the race leaves behind: concurrent initializes all read the same
    // pre-registration count, all pass the cap check, and all register — so the
    // map ends up over the cap. Driving that through supertest depends on how
    // the requests interleave, so the state itself is set up instead: four past
    // the cap, none of them the newcomer's doing. Each entry is only ever
    // counted and evicted, so a stub with closable halves is enough.
    // Inside the TTL, or countSessionsForUser skips them and there is nothing
    // over the cap to trim.
    const stale = Date.now() - 10_000;
    for (let i = 0; i < 24; i++) {
      sessions.set(`overshoot-${i}`, {
        server: { close() {} },
        transport: { close() {} },
        userId: user.id,
        scopes: null,
        clientId: null,
        isStaticToken: false,
        lastActivity: stale + i,
        lastClientIp: null,
      } as unknown as NonNullable<ReturnType<typeof sessions.get>>);
    }
    expect(sessionsForUser()).toBe(24);

    // The pre-check gives back one; without the trim at registration the other
    // four stay in the map — each holding a full McpServer — until the TTL sweep.
    const newSessionId = await createSession(user.id);

    expect(sessionsForUser()).toBe(20);
    expect(sessions.has(newSessionId)).toBe(true);
  });

  it('MCP — session resumption with valid mcp-session-id', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();
    const sessionId = await createSession(user.id);
    const token = generateToken(user.id);

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('mcp-session-id', sessionId)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 2, params: {} });
    expect(res.status).toBe(200);
  });

  it('MCP — session belongs to different user returns 403', async () => {
    const { user: user1 } = createUser(testDb);
    const { user: user2 } = createUser(testDb);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();

    const sessionId = await createSession(user1.id);
    const token2 = generateToken(user2.id);

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token2}`)
      .set('mcp-session-id', sessionId)
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 2 });
    expect(res.status).toBe(403);
  });

  it('MCP — a session-less non-initialize POST is rejected without registering a session', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();
    const token = generateToken(user.id);

    const before = sessions.size;
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 1, params: {} });

    // The SDK rejects it ("Server not initialized"); the McpServer built to serve it must not
    // linger — it is in no session, so nothing would ever sweep or close it.
    expect(res.status).toBe(400);
    expect(sessions.size).toBe(before);
  });

  it('MCP — initialize response exposes Mcp-Session-Id to browser-context clients', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();
    const token = generateToken(user.id);

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('Origin', 'https://claude.ai')
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'initialize', id: 1, params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });

    expect(res.status).toBe(200);
    expect(res.headers['mcp-session-id']).toBeTruthy();
    // Without this header the Fetch spec hides Mcp-Session-Id from the client, so it can never
    // echo it back and every tool call mints a fresh session until the cap kills the connection.
    expect(String(res.headers['access-control-expose-headers'] ?? '').toLowerCase())
      .toContain('mcp-session-id');
  });

  it('MCP — GET without mcp-session-id returns 400', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();
    const token = generateToken(user.id);

    const res = await request(app)
      .get('/mcp')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

describe('MCP transport parity pins (Nest-hosted /mcp)', () => {
  const initBody = { jsonrpc: '2.0', method: 'initialize', id: 1, params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } };

  async function createSession(token: string): Promise<string> {
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json, text/event-stream')
      .send(initBody);
    expect(res.status).toBe(200);
    return res.headers['mcp-session-id'] as string;
  }

  beforeEach(() => {
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();
  });

  it('MCP-P01 — addon off answers 403 with the exact legacy body', async () => {
    testDb.prepare("UPDATE addons SET enabled = 0 WHERE id = 'mcp'").run();
    const res = await request(app).post('/mcp').send(initBody);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'MCP is not enabled' });
  });

  it('MCP-P02 — missing/invalid auth carries the exact WWW-Authenticate challenge', async () => {
    const res = await request(app).post('/mcp').send(initBody);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Access token required' });
    expect(res.headers['www-authenticate']).toBe(EXPECTED_CHALLENGE);
  });

  it('MCP-P03 — a non-Bearer scheme and a schemeless token are both rejected', async () => {
    for (const header of ['Basic dXNlcjpwdw==', 'just-a-token']) {
      const res = await request(app).post('/mcp').set('Authorization', header).send(initBody);
      expect(res.status, header).toBe(401);
    }
  });

  it('MCP-P04 — a trekoa_ token with the wrong audience is rejected with a challenge', async () => {
    const { user } = createUser(testDb);
    const { accessToken } = mintOauthToken(user.id, 'https://other.example.com/api');
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(initBody);
    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe(EXPECTED_CHALLENGE);
  });

  it('MCP-P05 — a trekoa_ token with the MCP audience authenticates', async () => {
    const { user } = createUser(testDb);
    const { accessToken } = mintOauthToken(user.id, MCP_AUDIENCE);
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json, text/event-stream')
      .send(initBody);
    expect(res.status).toBe(200);
    expect(res.headers['mcp-session-id']).toBeTruthy();
  });

  it('MCP-P06 — resuming an unknown session answers the exact 404 body', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${generateToken(user.id)}`)
      .set('mcp-session-id', 'no-such-session')
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 2 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Session not found' });
  });

  it("MCP-P07 — another user's session answers 403 with the challenge and exact body", async () => {
    const { user: owner } = createUser(testDb);
    const { user: intruder } = createUser(testDb);
    const sessionId = await createSession(generateToken(owner.id));

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${generateToken(intruder.id)}`)
      .set('mcp-session-id', sessionId)
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 2 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Session belongs to a different user' });
    expect(res.headers['www-authenticate']).toBe(EXPECTED_CHALLENGE);
  });

  it('MCP-P08 — a session created via JWT rejects resumption by an OAuth client', async () => {
    const { user } = createUser(testDb);
    const sessionId = await createSession(generateToken(user.id));
    const { accessToken } = mintOauthToken(user.id, MCP_AUDIENCE);

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('mcp-session-id', sessionId)
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 2 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Session was created with a different OAuth client' });
    expect(res.headers['www-authenticate']).toBe(EXPECTED_CHALLENGE);
  });

  it('MCP-P08b — a narrower token cannot resume a session that was created with wider scopes', async () => {
    const { user } = createUser(testDb);
    const created = oauthSvc.createOAuthClient(user.id, 'Scope Test Client', ['https://client.example.com/cb'], ['trips:read', 'trips:write']);
    const clientId = (created.client as { client_id: string }).client_id;
    const wide = oauthSvc.issueTokens(clientId, user.id, ['trips:read', 'trips:write'], null, MCP_AUDIENCE);
    const narrow = oauthSvc.issueTokens(clientId, user.id, ['trips:read'], null, MCP_AUDIENCE);
    const sessionId = await createSession(wide.access_token);

    // The tool surface was registered from the wide set; resuming with the
    // narrow one would ride it.
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${narrow.access_token}`)
      .set('mcp-session-id', sessionId)
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 2 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Session was created with different scopes' });
    expect(res.headers['www-authenticate']).toContain('error="insufficient_scope"');
  });

  it('MCP-P08c — the same scopes in a different order still resume', async () => {
    const { user } = createUser(testDb);
    const created = oauthSvc.createOAuthClient(user.id, 'Scope Order Client', ['https://client.example.com/cb'], ['trips:read', 'trips:write']);
    const clientId = (created.client as { client_id: string }).client_id;
    const first = oauthSvc.issueTokens(clientId, user.id, ['trips:read', 'trips:write'], null, MCP_AUDIENCE);
    const reordered = oauthSvc.issueTokens(clientId, user.id, ['trips:write', 'trips:read'], null, MCP_AUDIENCE);
    const sessionId = await createSession(first.access_token);

    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${reordered.access_token}`)
      .set('mcp-session-id', sessionId)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 2 });
    expect(res.status).toBe(200);
  });

  it('MCP-P09 — a static-token session carries the deprecation notice on the first tool call only', async () => {
    const { user } = createUser(testDb);
    const { rawToken } = createMcpToken(testDb, user.id);
    const sessionId = await createSession(rawToken);

    const callBody = { jsonrpc: '2.0', method: 'tools/call', id: 3, params: { name: 'list_trips', arguments: {} } };
    const first = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${rawToken}`)
      .set('mcp-session-id', sessionId)
      .set('Accept', 'application/json, text/event-stream')
      .send(callBody);
    expect(first.status).toBe(200);
    expect(first.text).toContain('Deprecated authentication');

    const second = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${rawToken}`)
      .set('mcp-session-id', sessionId)
      .set('Accept', 'application/json, text/event-stream')
      .send({ ...callBody, id: 4 });
    expect(second.status).toBe(200);
    expect(second.text).not.toContain('Deprecated authentication');
  });

  it('MCP-P13 — an authorized tools/call writes exactly one mcp.tool_call audit row', async () => {
    const { user } = createUser(testDb);
    const { accessToken, clientId } = mintOauthToken(user.id, MCP_AUDIENCE);
    const sessionId = await createSession(accessToken);
    testDb.prepare("DELETE FROM audit_log WHERE action = 'mcp.tool_call'").run();

    const call = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('mcp-session-id', sessionId)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'tools/call', id: 3, params: { name: 'list_trips', arguments: {} } });
    expect(call.status).toBe(200);

    const rows = testDb.prepare(
      "SELECT user_id, action, resource, details FROM audit_log WHERE action = 'mcp.tool_call'",
    ).all() as Array<{ user_id: number; action: string; resource: string; details: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe(user.id);
    expect(rows[0].resource).toBe('list_trips');
    expect(JSON.parse(rows[0].details)).toEqual({ clientId });
  });

  it('MCP-P14 — tools/list and resource reads write no mcp.tool_call rows', async () => {
    const { user } = createUser(testDb);
    const token = generateToken(user.id);
    const sessionId = await createSession(token);
    testDb.prepare("DELETE FROM audit_log WHERE action = 'mcp.tool_call'").run();

    const list = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('mcp-session-id', sessionId)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'tools/list', id: 2, params: {} });
    expect(list.status).toBe(200);

    const read = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${token}`)
      .set('mcp-session-id', sessionId)
      .set('Accept', 'application/json, text/event-stream')
      .send({ jsonrpc: '2.0', method: 'resources/list', id: 3, params: {} });
    expect(read.status).toBe(200);

    const rows = testDb.prepare("SELECT id FROM audit_log WHERE action = 'mcp.tool_call'").all();
    expect(rows).toHaveLength(0);
  });

  it('MCP-P10 — /mcp bodies stay raw: an initialize payload over the global 100kb cap succeeds', async () => {
    const { user } = createUser(testDb);
    const big = {
      ...initBody,
      params: { ...initBody.params, clientInfo: { name: 'x'.repeat(150 * 1024), version: '1' } },
    };
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${generateToken(user.id)}`)
      .set('Accept', 'application/json, text/event-stream')
      .send(big);
    expect(res.status).toBe(200);
    expect(res.headers['mcp-session-id']).toBeTruthy();
  });

  it('MCP-P11 — the global 100kb JSON cap still guards every other route', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ username: 'x'.repeat(150 * 1024), password: 'y' }));
    expect(res.status).toBe(413);
  });

  it('MCP-P12 — malformed JSON on /mcp gets the SDK JSON-RPC parse error, not body-parser 400', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/mcp')
      .set('Authorization', `Bearer ${generateToken(user.id)}`)
      .set('Accept', 'application/json, text/event-stream')
      .set('Content-Type', 'application/json')
      .send('{ this is not json');
    expect(res.status).toBe(400);
    expect(res.body.jsonrpc).toBe('2.0');
    expect(res.body.error.code).toBe(-32700);
  });
});

describe('MCP rate limiting', () => {
  it('MCP-005 — requests below limit succeed', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE addons SET enabled = 1 WHERE id = 'mcp'").run();
    const token = generateToken(user.id);

    // Set a very low rate limit via env for this test
    const originalLimit = process.env.MCP_RATE_LIMIT;
    process.env.MCP_RATE_LIMIT = '3';

    try {
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/mcp')
          .set('Authorization', `Bearer ${token}`)
          .set('Accept', 'application/json, text/event-stream')
          .send({ jsonrpc: '2.0', method: 'initialize', id: i + 1, params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } });
        // Each should pass (no rate limit hit yet since limit is read at module init,
        // but we can verify that the responses are not 429)
        expect(res.status).not.toBe(429);
      }
    } finally {
      if (originalLimit === undefined) delete process.env.MCP_RATE_LIMIT;
      else process.env.MCP_RATE_LIMIT = originalLimit;
    }
  });
});
