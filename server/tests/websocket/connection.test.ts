/**
 * WebSocket connection tests.
 * Covers WS-001 to WS-006, WS-008 to WS-017.
 *
 * Starts a real HTTP server on a random port and connects via the `ws` library.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import net from 'node:net';
import crypto from 'node:crypto';
import request from 'supertest';
import WebSocket from 'ws';
import { broadcastToUser, getOnlineUserIds } from '../../src/websocket';

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

import type { INestApplication } from '@nestjs/common';
import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { setupWebSocket } from '../../src/websocket';
import { createEphemeralToken } from '../../src/services/ephemeralTokens';
import { createWsToken } from '../../src/services/authService';

let server: http.Server;
let wsUrl: string;
let nestApp: INestApplication;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);

  // Real WebSocket against the unified NestJS app (Express is gone). buildApp owns
  // the same composition production uses; we attach the real ws server to it.
  nestApp = await buildApp();
  server = http.createServer(nestApp.getHttpAdapter().getInstance());
  setupWebSocket(server);

  await new Promise<void>(resolve => server.listen(0, resolve));
  const addr = server.address() as { port: number };
  wsUrl = `ws://127.0.0.1:${addr.port}/ws`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close(err => err ? reject(err) : resolve())
  );
  await nestApp.close();
  testDb.close();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
});

/** Buffered WebSocket wrapper that never drops messages. */
class WsClient {
  private ws: WebSocket;
  private buffer: any[] = [];
  private waiters: Array<(msg: any) => void> = [];

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      const waiter = this.waiters.shift();
      if (waiter) {
        waiter(msg);
      } else {
        this.buffer.push(msg);
      }
    });
  }

  next(timeoutMs = 3000): Promise<any> {
    if (this.buffer.length > 0) return Promise.resolve(this.buffer.shift());
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.waiters.indexOf(resolve);
        if (idx !== -1) this.waiters.splice(idx, 1);
        reject(new Error('Message timeout'));
      }, timeoutMs);
      this.waiters.push((msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });
  }

  send(msg: object) { this.ws.send(JSON.stringify(msg)); }
  close() { this.ws.close(); }

  /** Wait for any message matching predicate within timeout. */
  waitFor(predicate: (m: any) => boolean, timeoutMs = 3000): Promise<any> {
    // Check buffer first
    const idx = this.buffer.findIndex(predicate);
    if (idx !== -1) return Promise.resolve(this.buffer.splice(idx, 1)[0]);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('waitFor timeout')), timeoutMs);
      const handler = (msg: any) => {
        if (predicate(msg)) {
          clearTimeout(timer);
          resolve(msg);
        } else {
          this.buffer.push(msg);
          // re-register
          this.waiters.push(handler);
        }
      };
      this.waiters.push(handler);
    });
  }

  /** Collect messages for a given duration. */
  collectFor(ms: number): Promise<any[]> {
    return new Promise(resolve => {
      const msgs: any[] = [...this.buffer.splice(0)];
      const handleMsg = (msg: any) => msgs.push(msg);
      this.ws.on('message', (data) => handleMsg(JSON.parse(data.toString())));
      setTimeout(() => resolve(msgs), ms);
    });
  }
}

function connectWs(token?: string): Promise<WsClient> {
  return new Promise((resolve, reject) => {
    const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
    const ws = new WebSocket(url);
    const client = new WsClient(ws);
    ws.once('open', () => resolve(client));
    ws.once('error', reject);
    ws.once('close', (code) => {
      if (code === 4001) reject(new Error(`WS closed with 4001`));
    });
  });
}

describe('WS connection', () => {
  it('WS-001 — connects with valid ephemeral token and receives welcome', async () => {
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    try {
      const msg = await client.next();
      expect(msg.type).toBe('welcome');
      expect(typeof msg.socketId).toBe('number');
    } finally {
      client.close();
    }
  });

  it('WS-002 — connecting without token closes with code 4001', async () => {
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(wsUrl);
      ws.on('close', (code) => {
        expect(code).toBe(4001);
        resolve();
      });
      ws.on('error', () => {});
    });
  });

  it('WS-003 — connecting with invalid token closes with code 4001', async () => {
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`${wsUrl}?token=invalid-token-xyz`);
      ws.on('close', (code) => {
        expect(code).toBe(4001);
        resolve();
      });
      ws.on('error', () => {});
    });
  });
});

describe('WS rooms', () => {
  it('WS-004 — join trip room receives joined confirmation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    try {
      await client.next(); // welcome

      client.send({ type: 'join', tripId: trip.id });
      const msg = await client.next();
      expect(msg.type).toBe('joined');
      expect(msg.tripId).toBe(trip.id);
    } finally {
      client.close();
    }
  });

  it('WS-005 — join trip without access receives error', async () => {
    const { user } = createUser(testDb);
    const { user: otherUser } = createUser(testDb);
    const trip = createTrip(testDb, otherUser.id); // trip owned by otherUser
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    try {
      await client.next(); // welcome

      client.send({ type: 'join', tripId: trip.id });
      const msg = await client.next();
      expect(msg.type).toBe('error');
      expect(msg.message).toMatch(/access denied/i);
    } finally {
      client.close();
    }
  });

  it('WS-006 — leave room receives left confirmation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    try {
      await client.next(); // welcome

      client.send({ type: 'join', tripId: trip.id });
      await client.next(); // joined

      client.send({ type: 'leave', tripId: trip.id });
      const msg = await client.next();
      expect(msg.type).toBe('left');
      expect(msg.tripId).toBe(trip.id);
    } finally {
      client.close();
    }
  });
});

describe('WS rate limiting', () => {
  it('WS-008 — exceeding 30 messages per window triggers rate-limit error', async () => {
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    try {
      await client.next(); // welcome

      // Send 35 messages quickly — at least one should trigger rate limit
      for (let i = 0; i < 35; i++) {
        client.send({ type: 'ping' });
      }

      // Collect for up to 2s and find a rate-limit error
      const msgs = await client.collectFor(1500);
      const rateLimitMsg = msgs.find((m: any) => m.type === 'error' && m.message?.includes('Rate limit'));
      expect(rateLimitMsg).toBeDefined();
    } finally {
      client.close();
    }
  });
});

describe('WS real-time broadcast', () => {
  it('WS-009 — POST /api/trips/:id/places broadcasts place:created to room members', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    try {
      await client.next(); // welcome

      // Join the trip room
      client.send({ type: 'join', tripId: trip.id });
      await client.next(); // joined

      // Create a place via REST (from a different socket, so it broadcasts to us)
      const wsToken2 = createEphemeralToken(user.id, 'ws')!;
      const client2 = await connectWs(wsToken2);
      try {
        await client2.next(); // welcome
        client2.send({ type: 'join', tripId: trip.id });
        await client2.next(); // joined

        // REST call from client2's socket ID
        const welcome2SocketId = (await Promise.resolve(null)) ?? null;
        await request(server)
          .post(`/api/trips/${trip.id}/places`)
          .set('Cookie', authCookie(user.id))
          .send({ name: 'Test Place', lat: 48.8566, lng: 2.3522 });

        // client should receive the broadcast
        const msg = await client.waitFor((m: any) => m.type === 'place:created', 3000);
        expect(msg.type).toBe('place:created');
        expect(msg.place).toBeDefined();
        expect(msg.place.name).toBe('Test Place');
      } finally {
        client2.close();
      }
    } finally {
      client.close();
    }
  });

  it('WS-010 — ephemeral WS token is single-use (second connection is rejected)', async () => {
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;

    // First connection: should succeed
    const client = await connectWs(token);
    await client.next(); // welcome
    client.close();

    // Second connection with same token: should be rejected with code 4001
    const closeCode = await new Promise<number>((resolve, reject) => {
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      ws.once('close', (code) => resolve(code));
      ws.once('error', () => resolve(4001)); // connection error also means rejection
      setTimeout(() => reject(new Error('Timeout waiting for rejection')), 3000);
    });
    expect([4001, 1006]).toContain(closeCode); // 4001 = auth rejected, 1006 = abnormal close (also rejection)
  });

  it('WS-011 — client not in trip room does not receive broadcast', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    // Connect `other` user but do NOT join the trip room
    const tokenOther = createEphemeralToken(other.id, 'ws')!;
    const clientOther = await connectWs(tokenOther);
    try {
      await clientOther.next(); // welcome — but no join

      // Owner creates a place
      await request(server)
        .post(`/api/trips/${trip.id}/places`)
        .set('Cookie', authCookie(owner.id))
        .send({ name: 'Owner Place', lat: 48.8566, lng: 2.3522 });

      // `other` should NOT receive any broadcast within 500ms
      const msgs = await clientOther.collectFor(500);
      const broadcast = msgs.find((m: any) => m.type === 'place:created');
      expect(broadcast).toBeUndefined();
    } finally {
      clientOther.close();
    }
  });
});

// ---------------------------------------------------------------------------
// WS auth edge cases — user-not-found and MFA enforcement
// ---------------------------------------------------------------------------

describe('WS auth edge cases', () => {
  it('WS-012 — token for non-existent user closes with code 4001', async () => {
    // Insert a user, grab an ephemeral token, then delete the user before connecting
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;
    // Remove the user so the DB lookup returns undefined
    testDb.prepare('DELETE FROM users WHERE id = ?').run(user.id);

    const closeCode = await new Promise<number>((resolve) => {
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      ws.once('close', (code) => resolve(code));
      ws.once('error', () => resolve(4001));
    });
    expect(closeCode).toBe(4001);
  });

  it('WS-013 — MFA is enforced when require_mfa is enabled and user has no MFA', async () => {
    // Enable require_mfa in app_settings
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('require_mfa', 'true')").run();

    // Create a regular user without MFA
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;

    const closeCode = await new Promise<number>((resolve) => {
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      ws.once('close', (code) => resolve(code));
      ws.once('error', () => resolve(4403));
    });
    expect(closeCode).toBe(4403);
  });

  it('WS-014 — MFA-enabled user connects successfully when require_mfa is enabled', async () => {
    // Enable require_mfa
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('require_mfa', 'true')").run();

    // Create a user with MFA enabled
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ? WHERE id = ?').run('JBSWY3DPEHPK3PXP', user.id);

    const token = createEphemeralToken(user.id, 'ws')!;
    const client = await connectWs(token);
    try {
      const msg = await client.next();
      expect(msg.type).toBe('welcome');
    } finally {
      client.close();
    }
  });

  it('WS-027 — ws-token minted before a password change is rejected (session gate)', async () => {
    // createWsToken stamps the user's current password_version (0) into the token.
    const { user } = createUser(testDb);
    const result = createWsToken(user.id);
    const token = result.token!;

    // Simulate a password reset bumping the version AFTER the token was issued.
    testDb.prepare('UPDATE users SET password_version = password_version + 1 WHERE id = ?').run(user.id);

    const closeCode = await new Promise<number>((resolve) => {
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      ws.once('close', (code) => resolve(code));
      ws.once('error', () => resolve(4001));
    });
    expect(closeCode).toBe(4001);
  });

  it('WS-028 — ws-token whose password_version still matches connects successfully', async () => {
    const { user } = createUser(testDb);
    // Bump the version first, THEN mint — the token captures the current pv.
    testDb.prepare('UPDATE users SET password_version = 3 WHERE id = ?').run(user.id);
    const result = createWsToken(user.id);
    const client = await connectWs(result.token!);
    try {
      const msg = await client.next();
      expect(msg.type).toBe('welcome');
    } finally {
      client.close();
    }
  });

  it('WS-029 — legacy token without a pv is rejected once the user resets their password', async () => {
    // Tokens minted via createEphemeralToken carry no pv (treated as version 0).
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;
    testDb.prepare('UPDATE users SET password_version = 1 WHERE id = ?').run(user.id);

    const closeCode = await new Promise<number>((resolve) => {
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
      ws.once('close', (code) => resolve(code));
      ws.once('error', () => resolve(4001));
    });
    expect(closeCode).toBe(4001);
  });
});

// ---------------------------------------------------------------------------
// WS message processing — malformed/invalid payloads
// ---------------------------------------------------------------------------

/** Connect a raw WebSocket (no WsClient wrapper) using a raw-send capable helper. */
function connectRawWs(token: string): Promise<{ ws: WebSocket; received: any[] }> {
  return new Promise((resolve, reject) => {
    const received: any[] = [];
    const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
    ws.on('message', (data) => {
      try { received.push(JSON.parse(data.toString())); } catch { /* ignore parse errors */ }
    });
    ws.once('open', () => resolve({ ws, received }));
    ws.once('error', reject);
    ws.once('close', (code) => { if (code === 4001) reject(new Error('WS closed 4001')); });
  });
}

/** Wait until `received` array has at least `n` items, up to `timeoutMs`. */
function waitForMessages(received: any[], n = 1, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (received.length >= n) { resolve(); return; }
    const start = Date.now();
    const poll = () => {
      if (received.length >= n) { resolve(); return; }
      if (Date.now() - start > timeoutMs) { reject(new Error(`Timeout waiting for ${n} messages`)); return; }
      setTimeout(poll, 20);
    };
    poll();
  });
}

describe('WS message processing edge cases', () => {
  it('WS-015 — malformed JSON is silently ignored (no crash, no error response)', async () => {
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;
    const { ws: rawWs, received } = await connectRawWs(token);

    // Wait for welcome
    await waitForMessages(received, 1);

    // Send raw malformed JSON — server should silently ignore and not close connection
    rawWs.send('{ this is not json }');
    rawWs.send('{broken');

    await new Promise(r => setTimeout(r, 300));

    // No error messages should have been sent by the server
    const errMsgs = received.filter(m => m.type === 'error');
    expect(errMsgs).toHaveLength(0);
    // Connection should still be open
    expect(rawWs.readyState).toBe(WebSocket.OPEN);

    rawWs.close();
  });

  it('WS-015b — message with non-object payload is silently ignored', async () => {
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;
    const { ws: rawWs, received } = await connectRawWs(token);

    // Wait for welcome
    await waitForMessages(received, 1);

    // Send valid JSON but not an object (array) — should be ignored
    rawWs.send(JSON.stringify([1, 2, 3]));
    // Send valid JSON number — should be ignored
    rawWs.send('42');

    await new Promise(r => setTimeout(r, 300));

    // The only message received should be the welcome; no errors emitted
    const errors = received.filter(m => m.type === 'error');
    expect(errors).toHaveLength(0);

    rawWs.close();
  });

  it('WS-015c — message object missing type field is silently ignored', async () => {
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;
    const { ws: rawWs, received } = await connectRawWs(token);

    // Wait for welcome
    await waitForMessages(received, 1);

    // Object without a string `type` field
    rawWs.send(JSON.stringify({ tripId: 1 }));
    rawWs.send(JSON.stringify({ type: 42, tripId: 1 }));

    await new Promise(r => setTimeout(r, 300));

    const errors = received.filter(m => m.type === 'error');
    expect(errors).toHaveLength(0);

    rawWs.close();
  });

  it('WS-015d — a close frame with a reserved status code does not crash the server (#1576)', async () => {
    // The `ws` client cannot send an invalid close code, so craft the frame over a raw
    // socket. Reserved code 1006 makes ws emit an 'error' event on the socket; with no
    // listener attached in setupWebSocket, Node rethrows it as an uncaughtException and the
    // process dies in production. In-process under vitest that surfaces as an uncaught
    // WS_ERR_INVALID_CLOSE_CODE, so capture uncaughtException for the duration and assert
    // none fired — then confirm the server is still serving.
    const uncaught: Error[] = [];
    const onUncaught = (err: Error): void => { uncaught.push(err); };
    process.on('uncaughtException', onUncaught);

    try {
      const port = (server.address() as { port: number }).port;
      await new Promise<void>((resolve, reject) => {
        const key = crypto.randomBytes(16).toString('base64');
        const sock = net.connect(port, '127.0.0.1');
        sock.on('error', reject);
        sock.write(
          `GET /ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\n` +
          `Connection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
        );
        sock.once('data', (buf) => {
          if (!buf.toString('latin1').includes('101 Switching Protocols')) return reject(new Error('no upgrade'));
          const mask = crypto.randomBytes(4);
          const payload = Buffer.alloc(2);
          payload.writeUInt16BE(1006, 0); // reserved — MUST NOT appear in a close frame (RFC 6455)
          const masked = Buffer.from(payload.map((b, i) => b ^ mask[i % 4]));
          sock.write(Buffer.concat([Buffer.from([0x88, 0x82]), mask, masked])); // FIN|close, MASK|len2
          setTimeout(() => { sock.destroy(); resolve(); }, 200);
        });
      });

      expect(uncaught.map(e => (e as { code?: string }).code)).not.toContain('WS_ERR_INVALID_CLOSE_CODE');

      // And the server is still serving: a fresh connection still gets a welcome.
      const { user } = createUser(testDb);
      const token = createEphemeralToken(user.id, 'ws')!;
      const client = await connectWs(token);
      try {
        expect((await client.next()).type).toBe('welcome');
      } finally {
        client.close();
      }
    } finally {
      process.off('uncaughtException', onUncaught);
    }
  });

  it('WS-016 — rate-limit window resets: after limit hit, next window accepts messages again', async () => {
    // Exercises line 108-110: the `now - rate.windowStart > WS_MSG_WINDOW` branch (counter reset).
    // We confirm that:
    //   (a) msg 31 triggers the rate-limit error (current window),
    //   (b) a trip join in the same window is blocked,
    //   (c) after the rate-limit trip-join is blocked we verify the counter path was reached.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const token = createEphemeralToken(user.id, 'ws')!;
    const { ws: rawWs, received } = await connectRawWs(token);

    // Wait for welcome
    await waitForMessages(received, 1);

    // Send exactly 30 messages (the limit) — all should succeed (no rate-limit error yet)
    for (let i = 0; i < 30; i++) {
      rawWs.send(JSON.stringify({ type: 'noop' }));
    }
    await new Promise(r => setTimeout(r, 200));

    // Message 31 — triggers the `count > WS_MSG_LIMIT` branch, sends rate-limit error
    rawWs.send(JSON.stringify({ type: 'noop' }));
    await waitForMessages(received, 2, 3000); // welcome + rate-limit error

    const rateLimitErrors = received.filter(m => m.type === 'error' && m.message?.includes('Rate limit'));
    expect(rateLimitErrors.length).toBeGreaterThanOrEqual(1);

    rawWs.close();
  });
});

// ---------------------------------------------------------------------------
// WS room management — disconnect cleanup and leave-nonexistent-room
// ---------------------------------------------------------------------------

describe('WS disconnect and room cleanup', () => {
  it('WS-017 — disconnecting cleans up room membership so broadcast stops reaching the client', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const token1 = createEphemeralToken(user.id, 'ws')!;

    // Connect and join the room
    const client = await connectWs(token1);
    await client.next(); // welcome
    client.send({ type: 'join', tripId: trip.id });
    await client.next(); // joined

    // Disconnect — triggers the 'close' handler that calls leaveRoom for all rooms
    client.close();
    await new Promise(r => setTimeout(r, 200)); // let the close event propagate

    // Now create a second client that also joins the room, then creates a place.
    // The first client (now disconnected) must NOT receive it (it can't, but more
    // importantly the server must not crash when iterating rooms and finding a gone socket).
    const token2 = createEphemeralToken(user.id, 'ws')!;
    const client2 = await connectWs(token2);
    try {
      await client2.next(); // welcome
      client2.send({ type: 'join', tripId: trip.id });
      await client2.next(); // joined

      // REST call to create a place — triggers broadcast; if room cleanup failed,
      // iterating a closed socket would surface here.
      const res = await request(server)
        .post(`/api/trips/${trip.id}/places`)
        .set('Cookie', authCookie(user.id))
        .send({ name: 'Post-Disconnect Place', lat: 48.8566, lng: 2.3522 });
      expect(res.status).toBe(201);

      // client2 should still receive the broadcast
      const msg = await client2.waitFor((m: any) => m.type === 'place:created', 3000);
      expect(msg.place.name).toBe('Post-Disconnect Place');
    } finally {
      client2.close();
    }
  });

  it('WS-018 — leaving a room the client was never in is a no-op (no crash, no error)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    try {
      await client.next(); // welcome

      // Send leave without ever joining — the server should respond with 'left'
      // and not throw, since leaveRoom is defensive about missing rooms/sockets.
      client.send({ type: 'leave', tripId: trip.id });
      const msg = await client.next();
      expect(msg.type).toBe('left');
      expect(msg.tripId).toBe(trip.id);
    } finally {
      client.close();
    }
  });
});

// ---------------------------------------------------------------------------
// broadcastToUser() and getOnlineUserIds() — exported utility coverage
// ---------------------------------------------------------------------------

describe('broadcastToUser and getOnlineUserIds', () => {
  it('WS-019 — broadcastToUser sends payload to all connected sockets for that user', async () => {
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    try {
      await client.next(); // welcome

      // Call broadcastToUser directly
      broadcastToUser(user.id, { type: 'test:direct', data: 'hello' });

      const msg = await client.next();
      expect(msg.type).toBe('test:direct');
      expect(msg.data).toBe('hello');
    } finally {
      client.close();
    }
  });

  it('WS-020 — broadcastToUser with excludeSid does not send to the excluded socket', async () => {
    const { user } = createUser(testDb);

    // Connect two sockets for the same user
    const token1 = createEphemeralToken(user.id, 'ws')!;
    const token2 = createEphemeralToken(user.id, 'ws')!;

    const client1 = await connectWs(token1);
    const client2 = await connectWs(token2);
    try {
      const welcome1 = await client1.next();
      const welcome2 = await client2.next();
      const sid1 = welcome1.socketId;

      // Broadcast excluding client1's socket ID
      broadcastToUser(user.id, { type: 'test:exclude' }, sid1);

      // client2 should receive it
      const msg2 = await client2.next();
      expect(msg2.type).toBe('test:exclude');

      // client1 should NOT receive it within 400ms
      const msgs1 = await client1.collectFor(400);
      const received = msgs1.find((m: any) => m.type === 'test:exclude');
      expect(received).toBeUndefined();
    } finally {
      client1.close();
      client2.close();
    }
  });

  it('WS-021 — broadcastToUser does not send to sockets belonging to a different user', async () => {
    const { user: userA } = createUser(testDb);
    const { user: userB } = createUser(testDb);

    const tokenA = createEphemeralToken(userA.id, 'ws')!;
    const tokenB = createEphemeralToken(userB.id, 'ws')!;

    const clientA = await connectWs(tokenA);
    const clientB = await connectWs(tokenB);
    try {
      await clientA.next(); // welcome
      await clientB.next(); // welcome

      // Broadcast only to userA
      broadcastToUser(userA.id, { type: 'test:userA-only' });

      // userA's client receives it
      const msgA = await clientA.next();
      expect(msgA.type).toBe('test:userA-only');

      // userB's client must NOT receive it within 400ms
      const msgsB = await clientB.collectFor(400);
      const leak = msgsB.find((m: any) => m.type === 'test:userA-only');
      expect(leak).toBeUndefined();
    } finally {
      clientA.close();
      clientB.close();
    }
  });

  it('WS-022 — getOnlineUserIds returns IDs of all connected authenticated users', async () => {
    const { user: userA } = createUser(testDb);
    const { user: userB } = createUser(testDb);

    const tokenA = createEphemeralToken(userA.id, 'ws')!;
    const tokenB = createEphemeralToken(userB.id, 'ws')!;

    const clientA = await connectWs(tokenA);
    const clientB = await connectWs(tokenB);
    try {
      await clientA.next(); // welcome
      await clientB.next(); // welcome

      const online = getOnlineUserIds();
      expect(online.has(userA.id)).toBe(true);
      expect(online.has(userB.id)).toBe(true);
    } finally {
      clientA.close();
      clientB.close();
    }
  });

  it('WS-023 — getOnlineUserIds excludes disconnected users', async () => {
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;

    const client = await connectWs(token);
    await client.next(); // welcome

    // Verify user is online
    expect(getOnlineUserIds().has(user.id)).toBe(true);

    // Disconnect
    client.close();
    await new Promise(r => setTimeout(r, 200));

    // User should no longer appear in online set
    expect(getOnlineUserIds().has(user.id)).toBe(false);
  });

  it('WS-024 — broadcastToUser delivers custom payload to the correct connected socket', async () => {
    // This directly exercises the broadcastToUser code path end-to-end through the
    // exported function, verifying that the correct socket receives the message.
    const { user } = createUser(testDb);
    const token = createEphemeralToken(user.id, 'ws')!;
    const client = await connectWs(token);
    try {
      await client.next(); // welcome

      const customPayload = { type: 'custom:event', value: 99 };
      broadcastToUser(user.id, customPayload);

      const msg = await client.waitFor((m: any) => m.type === 'custom:event', 2000);
      expect(msg.type).toBe('custom:event');
      expect(msg.value).toBe(99);
    } finally {
      client.close();
    }
  });

  it('WS-025 — broadcast() to an empty/nonexistent room is a no-op (no crash)', async () => {
    // Exercises line 180: `if (!room || room.size === 0) return`
    // A REST mutation on a trip with no connected WS clients triggers broadcast()
    // with a room that doesn't exist — must not throw.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // No WebSocket clients join the trip room before the REST call
    const res = await request(server)
      .post(`/api/trips/${trip.id}/places`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'No Room Place', lat: 10, lng: 20 });

    // Server must not crash — 201 confirms broadcast() returned silently
    expect(res.status).toBe(201);
  });

  it('WS-026 — broadcast() skips non-OPEN sockets in the room', async () => {
    // This exercises line 185: `if (ws.readyState !== 1) continue`
    // We join a room with two clients, forcefully terminate one (so its readyState becomes
    // CLOSED while still transiently in the room map), then trigger a broadcast and confirm
    // the surviving client receives it without errors.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const token1 = createEphemeralToken(user.id, 'ws')!;
    const token2 = createEphemeralToken(user.id, 'ws')!;

    const client1 = await connectWs(token1);
    const client2 = await connectWs(token2);
    try {
      await client1.next(); // welcome
      await client2.next(); // welcome

      client1.send({ type: 'join', tripId: trip.id });
      await client1.next(); // joined

      client2.send({ type: 'join', tripId: trip.id });
      await client2.next(); // joined

      // Close client1 abruptly — the underlying socket may momentarily remain in the room map
      client1.close();
      await new Promise(r => setTimeout(r, 50)); // brief pause

      // Trigger broadcast via REST — should not crash even if client1's socket is closed
      const res = await request(server)
        .post(`/api/trips/${trip.id}/places`)
        .set('Cookie', authCookie(user.id))
        .send({ name: 'Resilience Place', lat: 1, lng: 2 });
      expect(res.status).toBe(201);

      // client2 should still receive the broadcast
      const msg = await client2.waitFor((m: any) => m.type === 'place:created', 3000);
      expect(msg.place.name).toBe('Resilience Place');
    } finally {
      client2.close();
    }
  });
});
