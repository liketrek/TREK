/**
 * WS-REVOKE-001 to WS-REVOKE-006: a socket is let into a trip room or a book
 * once, so a write that ends somebody's access asks the sockets already in
 * again. Real server, real `ws` clients, the routes a user calls.
 */
import { buildApp, getHttpServer } from '../../src/bootstrap';
import { createEphemeralToken } from '../../src/nest/auth-core/ephemeral-tokens';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { authCookie } from '../helpers/auth';
import type { FactoryOrm } from '../helpers/factories/context';
import { addJourneyContributor, makeJourney } from '../helpers/factories/journeys';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import http from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

let server: http.Server;
let wsUrl: string;
let nestApp: INestApplication;
const orm = (): FactoryOrm => nestApp.get(MikroORM);

beforeAll(async () => {
  nestApp = await buildApp();
  server = getHttpServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  wsUrl = `ws://127.0.0.1:${(server.address() as { port: number }).port}/ws`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  await nestApp.close();
});

beforeEach(async () => {
  await resetDatabase(orm());
  await resetRateLimits(nestApp);
});

interface Frame {
  type: string;
  [key: string]: unknown;
}

/** A socket of one user that keeps every frame it receives. */
class Client {
  readonly frames: Frame[] = [];
  closeCode: number | null = null;
  private readonly arrived = new Set<() => void>();

  constructor(private readonly ws: WebSocket) {
    ws.on('message', (data) => {
      this.frames.push(JSON.parse(data.toString()) as Frame);
      for (const notify of this.arrived) notify();
    });
    ws.on('close', (code) => {
      this.closeCode = code;
    });
  }

  send(message: object): void {
    this.ws.send(JSON.stringify(message));
  }

  waitFor(match: (frame: Frame) => boolean, timeoutMs = 3000): Promise<Frame> {
    return new Promise((resolve, reject) => {
      const look = () => {
        const found = this.frames.find(match);
        if (!found) return;
        this.arrived.delete(look);
        clearTimeout(timer);
        resolve(found);
      };
      const timer = setTimeout(() => {
        this.arrived.delete(look);
        reject(new Error(`no matching frame, got ${this.frames.map((f) => f.type).join(', ')}`));
      }, timeoutMs);
      this.arrived.add(look);
      look();
    });
  }

  close(): void {
    this.ws.close();
  }
}

async function connect(userId: number): Promise<Client> {
  const token = createEphemeralToken(userId, 'ws');
  if (!token) throw new Error('no ws token');
  const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
  const client = new Client(ws);
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
  await client.waitFor((f) => f.type === 'welcome');
  return client;
}

/** Long enough for a broadcast that would arrive to have arrived. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

const realtime = () => nestApp.get(RealtimeService);

describe('a removed trip member', () => {
  it('WS-REVOKE-001 hears the removal and nothing of the trip after it', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: member } = await makeUser(orm());
    const trip = await makeTrip(orm(), owner.id);
    await addTripMember(orm(), trip.id, member.id, owner.id);

    const socket = await connect(member.id);
    socket.send({ type: 'join', tripId: trip.id });
    await socket.waitFor((f) => f.type === 'joined');

    const removed = await request(server)
      .delete(`/api/trips/${trip.id}/members/${member.id}`)
      .set('Cookie', authCookie(owner.id));
    expect(removed.status).toBe(200);
    // The event that tells the client to leave still reaches it.
    await socket.waitFor((f) => f.type === 'member:removed' && f.userId === member.id);

    realtime().broadcast(trip.id, 'place:created', { place: { id: 1, name: 'AFTER-REMOVAL' } });
    await settle();
    expect(socket.frames.some((f) => f.type === 'place:created')).toBe(false);
    socket.close();
  });

  it('WS-REVOKE-002 the owner and the members who stay keep hearing the trip', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: stays } = await makeUser(orm());
    const { user: leaves } = await makeUser(orm());
    const trip = await makeTrip(orm(), owner.id);
    await addTripMember(orm(), trip.id, stays.id, owner.id);
    await addTripMember(orm(), trip.id, leaves.id, owner.id);

    const sockets = await Promise.all([connect(owner.id), connect(stays.id)]);
    for (const s of sockets) s.send({ type: 'join', tripId: trip.id });
    await Promise.all(sockets.map((s) => s.waitFor((f) => f.type === 'joined')));

    // The member leaves on their own; the others are not asked to go.
    const left = await request(server)
      .delete(`/api/trips/${trip.id}/members/${leaves.id}`)
      .set('Cookie', authCookie(leaves.id));
    expect(left.status).toBe(200);
    await Promise.all(sockets.map((s) => s.waitFor((f) => f.type === 'member:removed')));

    realtime().broadcast(trip.id, 'place:created', { place: { id: 2, name: 'STILL-SHARED' } });
    await Promise.all(sockets.map((s) => s.waitFor((f) => f.type === 'place:created')));
    for (const s of sockets) s.close();
  });

  it('WS-REVOKE-003 a deleted trip empties its room', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: member } = await makeUser(orm());
    const trip = await makeTrip(orm(), owner.id);
    await addTripMember(orm(), trip.id, member.id, owner.id);

    const socket = await connect(member.id);
    socket.send({ type: 'join', tripId: trip.id });
    await socket.waitFor((f) => f.type === 'joined');

    const deleted = await request(server).delete(`/api/trips/${trip.id}`).set('Cookie', authCookie(owner.id));
    expect(deleted.status).toBe(200);
    await socket.waitFor((f) => f.type === 'trip:deleted');

    realtime().broadcast(trip.id, 'place:created', { place: { id: 3, name: 'GONE' } });
    await settle();
    expect(socket.frames.some((f) => f.type === 'place:created')).toBe(false);
    socket.close();
  });
});

describe('a removed journey contributor', () => {
  it('WS-REVOKE-004 leaves the book: no pointers either way, and the others see them go', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: editor } = await makeUser(orm());
    const journey = await makeJourney(orm(), owner.id);
    await addJourneyContributor(orm(), journey.id, editor.id, 'editor');

    const ownerSocket = await connect(owner.id);
    const editorSocket = await connect(editor.id);
    ownerSocket.send({ type: 'book:join', journeyId: journey.id });
    await ownerSocket.waitFor((f) => f.type === 'book:joined');
    editorSocket.send({ type: 'book:join', journeyId: journey.id });
    await editorSocket.waitFor((f) => f.type === 'book:joined');
    await ownerSocket.waitFor((f) => f.type === 'journey:book:peers' && (f.peers as unknown[]).length === 2);

    const removed = await request(server)
      .delete(`/api/journeys/${journey.id}/contributors/${editor.id}`)
      .set('Cookie', authCookie(owner.id));
    expect(removed.status).toBe(200);
    await ownerSocket.waitFor(
      (f) =>
        f.type === 'journey:book:peers' &&
        (f.peers as Array<{ userId: number }>).every((peer) => peer.userId !== editor.id),
    );

    editorSocket.frames.length = 0;
    ownerSocket.frames.length = 0;
    ownerSocket.send({ type: 'book:cursor', journeyId: journey.id, spreadIndex: 0, x: 10, y: 10 });
    editorSocket.send({ type: 'book:cursor', journeyId: journey.id, spreadIndex: 0, x: 20, y: 20 });
    await settle();
    expect(editorSocket.frames.some((f) => f.type === 'journey:book:cursor')).toBe(false);
    expect(ownerSocket.frames.some((f) => f.type === 'journey:book:cursor')).toBe(false);
    ownerSocket.close();
    editorSocket.close();
  });

  it('WS-REVOKE-005 a contributor who stays keeps exchanging pointers with the owner', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: stays } = await makeUser(orm());
    const { user: removed } = await makeUser(orm());
    const journey = await makeJourney(orm(), owner.id);
    await addJourneyContributor(orm(), journey.id, stays.id, 'editor');
    await addJourneyContributor(orm(), journey.id, removed.id, 'viewer');

    const ownerSocket = await connect(owner.id);
    const staysSocket = await connect(stays.id);
    for (const s of [ownerSocket, staysSocket]) s.send({ type: 'book:join', journeyId: journey.id });
    await Promise.all([ownerSocket, staysSocket].map((s) => s.waitFor((f) => f.type === 'book:joined')));

    const res = await request(server)
      .delete(`/api/journeys/${journey.id}/contributors/${removed.id}`)
      .set('Cookie', authCookie(owner.id));
    expect(res.status).toBe(200);

    ownerSocket.send({ type: 'book:cursor', journeyId: journey.id, spreadIndex: 1, x: 5, y: 5 });
    const cursor = await staysSocket.waitFor((f) => f.type === 'journey:book:cursor');
    expect(cursor.userId).toBe(owner.id);
    ownerSocket.close();
    staysSocket.close();
  });
});

describe('a deleted account', () => {
  it('WS-REVOKE-006 has its sockets closed and out of every room', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: member } = await makeUser(orm());
    const trip = await makeTrip(orm(), owner.id);
    await addTripMember(orm(), trip.id, member.id, owner.id);
    const { user: admin } = await makeUser(orm(), { role: 'admin' });

    const socket = await connect(member.id);
    socket.send({ type: 'join', tripId: trip.id });
    await socket.waitFor((f) => f.type === 'joined');

    const deleted = await request(server).delete(`/api/admin/users/${member.id}`).set('Cookie', authCookie(admin.id));
    expect(deleted.status).toBe(200);

    realtime().broadcast(trip.id, 'place:created', { place: { id: 4, name: 'AFTER-DELETE' } });
    await settle();
    expect(socket.frames.some((f) => f.type === 'place:created')).toBe(false);
    expect(socket.closeCode).toBe(4001);
  });
});
