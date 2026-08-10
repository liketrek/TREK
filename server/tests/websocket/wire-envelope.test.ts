/**
 * WebSocket wire-envelope tests. Covers WS-030 to WS-036.
 *
 * These pin the *shape* of every frame that crosses the socket, not the behaviour
 * behind it — connection.test.ts already covers the behaviour.
 *
 * The reason they exist: the plan is to move this transport onto a Nest gateway
 * (@nestjs/websockets). Nest's stock WsAdapter dispatches on `message.event` and
 * answers `{ event, data }`, while TREK speaks a flat `{ type, tripId, ...payload }`
 * of its own. Swapping the adapter in without a custom serialiser would leave every
 * `join` silently unhandled: no `welcome.socketId` to echo back as X-Socket-Id, so
 * every client would receive its own writes back and drag-and-drop would jump.
 *
 * None of that shows up in the existing suite, because the 100+ tests that touch
 * realtime mock `src/websocket` and never look at the bytes. So: if a change makes
 * these fail, it is a breaking change for every deployed client.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import http from 'http';
import WebSocket from 'ws';

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
    getPlaceWithTags: () => null,
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
import { buildApp, getHttpServer } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb } from '../helpers/test-db';
import { createUser, createTrip } from '../helpers/factories';
import { broadcast, broadcastToUser } from '../../src/websocket';
import { createEphemeralToken } from '../../src/nest/auth/ephemeral-tokens';

let server: http.Server;
let wsUrl: string;
let nestApp: INestApplication;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  // buildApp binds /ws to the server it creates, before app.init().
  server = getHttpServer();
  await new Promise<void>(resolve => server.listen(0, resolve));
  const addr = server.address() as { port: number };
  wsUrl = `ws://127.0.0.1:${addr.port}/ws`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  await nestApp.close();
  testDb.close();
});

beforeEach(() => resetTestDb(testDb));

/** Minimal buffered client — same idea as connection.test.ts, kept local. */
class Frames {
  private buffer: any[] = [];
  private waiters: Array<(m: any) => void> = [];
  constructor(private ws: WebSocket) {
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      const waiter = this.waiters.shift();
      if (waiter) waiter(msg); else this.buffer.push(msg);
    });
  }
  next(timeoutMs = 3000): Promise<any> {
    if (this.buffer.length) return Promise.resolve(this.buffer.shift());
    return new Promise((resolve, reject) => {
      const waiter = (m: any) => { clearTimeout(timer); resolve(m); };
      // Drop the waiter on timeout, otherwise it stays queued and swallows the
      // next frame — which matters here because nextOrNull() times out by design.
      const timer = setTimeout(() => {
        const idx = this.waiters.indexOf(waiter);
        if (idx !== -1) this.waiters.splice(idx, 1);
        reject(new Error('Message timeout'));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }
  /** Resolves to null when nothing arrives — used to assert silence. */
  async nextOrNull(timeoutMs = 400): Promise<any | null> {
    try { return await this.next(timeoutMs); } catch { return null; }
  }
  send(msg: object) { this.ws.send(JSON.stringify(msg)); }
  close() { this.ws.close(); }
}

function connect(token: string): Promise<Frames> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
    const frames = new Frames(ws);
    ws.once('open', () => resolve(frames));
    ws.once('error', reject);
  });
}

async function connectAndJoin(userId: number, tripId: number) {
  const frames = await connect(createEphemeralToken(userId, 'ws')!);
  await frames.next();                       // welcome
  frames.send({ type: 'join', tripId });
  await frames.next();                       // joined
  return frames;
}

describe('WS wire envelope', () => {
  it('WS-030 — the welcome frame carries socketId at the top level', async () => {
    const { user } = createUser(testDb);
    const frames = await connect(createEphemeralToken(user.id, 'ws')!);
    try {
      const msg = await frames.next();
      expect(Object.keys(msg).sort()).toEqual(['socketId', 'type']);
      expect(msg.type).toBe('welcome');
      expect(typeof msg.socketId).toBe('number');
      // X-Socket-Id is read straight off this field (client/src/api/websocket.ts).
      // Nesting it under `data` would silently disable echo suppression.
      expect(msg).not.toHaveProperty('data');
      expect(msg).not.toHaveProperty('event');
    } finally {
      frames.close();
    }
  });

  it('WS-031 — join and leave are answered flat, keyed by type', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const frames = await connect(createEphemeralToken(user.id, 'ws')!);
    try {
      await frames.next();
      frames.send({ type: 'join', tripId: trip.id });
      const joined = await frames.next();
      expect(Object.keys(joined).sort()).toEqual(['tripId', 'type']);
      expect(joined).toEqual({ type: 'joined', tripId: trip.id });

      frames.send({ type: 'leave', tripId: trip.id });
      const left = await frames.next();
      expect(left).toEqual({ type: 'left', tripId: trip.id });
    } finally {
      frames.close();
    }
  });

  it('WS-032 — the server dispatches on `type`, not on `event`', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const frames = await connect(createEphemeralToken(user.id, 'ws')!);
    try {
      await frames.next();
      // This is the exact shape Nest's stock WsAdapter would send. It must not
      // join the room — if it ever does, the two protocols have been mixed.
      frames.send({ event: 'join', data: { tripId: trip.id } });
      expect(await frames.nextOrNull()).toBeNull();

      // And the real shape still works afterwards.
      frames.send({ type: 'join', tripId: trip.id });
      expect((await frames.next()).type).toBe('joined');
    } finally {
      frames.close();
    }
  });

  it('WS-033 — a trip broadcast spreads its payload flat next to type and tripId', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const frames = await connectAndJoin(user.id, trip.id);
    try {
      broadcast(trip.id, 'place_created', { place: { id: 7 }, source: 'test' });
      const msg = await frames.next();
      expect(msg).toEqual({ type: 'place_created', tripId: trip.id, place: { id: 7 }, source: 'test' });
      // Not { event, data } — the payload keys sit at the top level.
      expect(msg).not.toHaveProperty('data');
      expect(msg).not.toHaveProperty('event');
      expect(msg).not.toHaveProperty('payload');
    } finally {
      frames.close();
    }
  });

  it('WS-034 — a payload key cannot be shadowed by the envelope', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const frames = await connectAndJoin(user.id, trip.id);
    try {
      // The spread runs last, so payload wins over the envelope's tripId. Pinning
      // this because it decides what a re-implementation has to reproduce.
      broadcast(trip.id, 'day_updated', { tripId: 999, day: { id: 1 } });
      const msg = await frames.next();
      expect(msg.tripId).toBe(999);
      expect(msg.type).toBe('day_updated');
    } finally {
      frames.close();
    }
  });

  it('WS-035 — a user broadcast is the payload verbatim, with no tripId added', async () => {
    const { user } = createUser(testDb);
    const frames = await connect(createEphemeralToken(user.id, 'ws')!);
    try {
      await frames.next();
      broadcastToUser(user.id, { type: 'trip_invitation', invite: { id: 3 } });
      const msg = await frames.next();
      expect(msg).toEqual({ type: 'trip_invitation', invite: { id: 3 } });
      expect(msg).not.toHaveProperty('tripId');
    } finally {
      frames.close();
    }
  });

  it('WS-036 — the sender is excluded by socket id, not by connection identity', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = await connect(createEphemeralToken(user.id, 'ws')!);
    const b = await connect(createEphemeralToken(user.id, 'ws')!);
    try {
      const aWelcome = await a.next();
      await b.next();
      a.send({ type: 'join', tripId: trip.id });
      await a.next();
      b.send({ type: 'join', tripId: trip.id });
      await b.next();

      // Same user, two sockets: the one named by X-Socket-Id stays silent, the
      // other still gets the event. That is what stops a client echoing its own
      // writes while a second tab keeps updating.
      broadcast(trip.id, 'place_created', { place: { id: 1 } }, aWelcome.socketId);
      expect(await a.nextOrNull()).toBeNull();
      expect((await b.next()).type).toBe('place_created');
    } finally {
      a.close();
      b.close();
    }
  });
});
