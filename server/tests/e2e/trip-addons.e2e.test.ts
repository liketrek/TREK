/**
 * Per-trip addons end to end: GET and PUT /api/trips/:tripId/addons and the
 * MCP tools get_trip_addons and set_trip_addon on the whole app (buildApp, the
 * real guards, the response contract check, the registry with its scopes and
 * error mapper), seeded through the ORM factories.
 *
 * Who may do what: every member reads the list, only the owner changes it. A
 * member and an admin who does not own the trip get a 403, somebody who
 * cannot see the trip a 404, and nothing is written for either.
 */
import { buildApp } from '../../src/bootstrap';
import { TripAddonOverrides } from '../../src/db/entities/TripAddonOverrides.entity';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { TRIP_ADDON_NOT_FOUND, TRIP_ADDON_OWNER_ONLY } from '../../src/nest/addons/trip-addons.service';
import { withRequestContext } from '../../src/nest/database/request-context';
import { countRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { oneByOne } from '../helpers/one-by-one';
import { resetDatabase } from '../helpers/reset-database';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';
import type { TripAddon } from '@trek/shared';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;
let spies: RealtimeSpies;

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
  spies = spyOnRealtime(app);
}, 60_000);
beforeEach(async () => {
  await resetDatabase(orm);
  spies.broadcast.mockClear();
});
afterAll(async () => {
  await app?.close();
});

/** An owner with a trip, a member on it, an admin on it, an admin off it and a stranger. */
async function world() {
  const { user: owner } = await makeUser(orm);
  const { user: member } = await makeUser(orm);
  const { user: adminMember } = await makeAdmin(orm);
  const { user: admin } = await makeAdmin(orm);
  const { user: stranger } = await makeUser(orm);
  const trip = await makeTrip(orm, owner.id, { title: 'Porto' });
  await addTripMember(orm, trip.id, member.id, owner.id);
  await addTripMember(orm, trip.id, adminMember.id, owner.id);
  return { owner, member, adminMember, admin, stranger, trip };
}

const get = (userId: number, tripId: number | string) =>
  request(app.getHttpServer()).get(`/api/trips/${tripId}/addons`).set('Cookie', sessionCookie(userId));

const put = (userId: number, tripId: number, addonId: string, body: unknown, socketId?: string) => {
  const req = request(app.getHttpServer())
    .put(`/api/trips/${tripId}/addons/${addonId}`)
    .set('Cookie', sessionCookie(userId));
  if (socketId) req.set('X-Socket-Id', socketId);
  return req.send(body as object);
};

const entry = (addons: TripAddon[], id: string) => addons.find((a) => a.id === id);

/** One MCP tool call as `userId` through a real session: its JSON or its error text. */
async function callTool(userId: number, name: string, args: Record<string, unknown>) {
  const server = createLocalMcpServer('TREK trip addons e2e');
  const around = (_info: unknown, call: () => unknown): unknown => withRequestContext(orm, call);
  await withRequestContext(orm, () =>
    app
      .get(McpRegistryService)
      .attach(server, { userId, scopes: null, isStaticToken: false }, { include: (kind) => kind === 'tool', around }),
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'trip-addons-e2e', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const result = await client.callTool({ name, arguments: args });
    const content = Array.isArray(result.content) ? (result.content as Array<{ text?: string }>) : [];
    const text = content[0]?.text ?? '';
    if (result.isError === true) return { answer: null, error: text };
    return { answer: JSON.parse(text) as { tripId: number; addons: TripAddon[] }, error: null };
  } finally {
    await client.close();
    await server.close();
  }
}

describe('GET /api/trips/:tripId/addons', () => {
  it('TRIPADDON-E2E-001: every member reads the trip addons with their instance state', async () => {
    const { owner, member, trip } = await world();
    for (const res of await oneByOne([owner.id, member.id], (userId) => get(userId, trip.id))) {
      expect(res.status).toBe(200);
      expect(res.body.tripId).toBe(trip.id);
      const ids = (res.body.addons as TripAddon[]).map((a) => a.id);
      expect(ids).toEqual(expect.arrayContaining(['packing', 'budget', 'documents', 'collab', 'roadtrip', 'tours']));
      expect(ids).not.toContain('memories');
      for (const addon of res.body.addons as TripAddon[]) {
        expect(addon.overridden).toBe(false);
        expect(addon.enabled).toBe(addon.instanceEnabled);
      }
    }
  });

  it('TRIPADDON-E2E-002: somebody who cannot see the trip, an admin included, gets a 404; nobody signed in a 401', async () => {
    const { admin, stranger, trip } = await world();
    for (const res of await oneByOne([admin.id, stranger.id], (userId) => get(userId, trip.id))) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    }
    expect((await request(app.getHttpServer()).get(`/api/trips/${trip.id}/addons`)).status).toBe(401);
  });
});

describe('PUT /api/trips/:tripId/addons/:addonId', () => {
  it('TRIPADDON-E2E-010: the owner switches costs off for the trip; every other tab gets the list', async () => {
    const { owner, member, trip } = await world();
    const res = await put(owner.id, trip.id, 'budget', { enabled: false }, 'sock-owner');
    expect(res.status).toBe(200);
    expect(entry(res.body.addons, 'budget')).toMatchObject({ enabled: false, instanceEnabled: true, overridden: true });
    expect(spies.broadcast).toHaveBeenCalledWith(
      String(trip.id),
      'tripAddons:changed',
      { addons: res.body.addons },
      'sock-owner',
    );
    const seen = await get(member.id, trip.id);
    expect(entry(seen.body.addons, 'budget')).toMatchObject({ enabled: false, overridden: true });
  });

  it('TRIPADDON-E2E-011: a trip may switch an addon on that the instance has off', async () => {
    const { owner, trip } = await world();
    await setAddonEnabled(orm, 'roadtrip', false);
    const res = await put(owner.id, trip.id, 'roadtrip', { enabled: true });
    expect(res.status).toBe(200);
    expect(entry(res.body.addons, 'roadtrip')).toMatchObject({
      enabled: true,
      instanceEnabled: false,
      overridden: true,
    });
  });

  it('TRIPADDON-E2E-012: null goes back to the instance setting and drops the row', async () => {
    const { owner, trip } = await world();
    await put(owner.id, trip.id, 'budget', { enabled: false });
    const res = await put(owner.id, trip.id, 'budget', { enabled: null });
    expect(res.status).toBe(200);
    expect(entry(res.body.addons, 'budget')).toMatchObject({ enabled: true, overridden: false });
    expect(await countRows(orm, TripAddonOverrides, { trip: trip.id })).toBe(0);
  });

  it('TRIPADDON-E2E-013: a member and an admin on the trip are refused with 403; nothing is written or sent', async () => {
    const { member, adminMember, trip } = await world();
    const refused = await oneByOne([member.id, adminMember.id], (userId) =>
      put(userId, trip.id, 'budget', { enabled: false }),
    );
    for (const res of refused) {
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: TRIP_ADDON_OWNER_ONLY });
    }
    expect(await countRows(orm, TripAddonOverrides, { trip: trip.id })).toBe(0);
    expect(spies.broadcast).not.toHaveBeenCalled();
  });

  it('TRIPADDON-E2E-014: an admin off the trip and a stranger get a 404', async () => {
    const { admin, stranger, trip } = await world();
    const unseen = await oneByOne([admin.id, stranger.id], (userId) =>
      put(userId, trip.id, 'budget', { enabled: false }),
    );
    for (const res of unseen) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    }
    expect(await countRows(orm, TripAddonOverrides, { trip: trip.id })).toBe(0);
  });

  it('TRIPADDON-E2E-015: an id that names no trip addon is a 404, a body that is no choice a 400', async () => {
    const { owner, trip } = await world();
    const unknown = await oneByOne(['vacay', 'memories', 'no_such_addon'], (addonId) =>
      put(owner.id, trip.id, addonId, { enabled: true }),
    );
    for (const res of unknown) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: TRIP_ADDON_NOT_FOUND });
    }
    const malformed = await oneByOne([{}, { enabled: 'yes' }, { enabled: true, extra: 1 }], (body) =>
      put(owner.id, trip.id, 'budget', body),
    );
    expect(malformed.map((res) => res.status)).toEqual([400, 400, 400]);
    expect(await countRows(orm, TripAddonOverrides, { trip: trip.id })).toBe(0);
  });

  it('TRIPADDON-E2E-016: a copied trip keeps the switches of its source', async () => {
    const { owner, trip } = await world();
    await put(owner.id, trip.id, 'budget', { enabled: false });
    const copy = await request(app.getHttpServer())
      .post(`/api/trips/${trip.id}/copy`)
      .set('Cookie', sessionCookie(owner.id))
      .send({ title: 'Porto again' });
    expect(copy.status).toBe(201);
    const res = await get(owner.id, copy.body.trip.id as number);
    expect(entry(res.body.addons, 'budget')).toMatchObject({ enabled: false, overridden: true });
  });
});

describe('MCP get_trip_addons and set_trip_addon', () => {
  it('TRIPADDON-E2E-020: a member reads the list; somebody who cannot see the trip is told so', async () => {
    const { member, stranger, trip } = await world();
    const read = await callTool(member.id, 'get_trip_addons', { tripId: trip.id });
    expect(read.answer?.tripId).toBe(trip.id);
    expect(entry(read.answer?.addons ?? [], 'budget')).toMatchObject({ overridden: false });
    expect((await callTool(stranger.id, 'get_trip_addons', { tripId: trip.id })).error).toBe(
      'Trip not found or access denied.',
    );
  });

  it('TRIPADDON-E2E-021: only the owner switches, with the REST refusal for anybody else', async () => {
    const { owner, member, adminMember, stranger, trip } = await world();
    const refused = await oneByOne([member.id, adminMember.id], (userId) =>
      callTool(userId, 'set_trip_addon', { tripId: trip.id, addonId: 'budget', enabled: false }),
    );
    expect(refused.map((res) => res.error)).toEqual([TRIP_ADDON_OWNER_ONLY, TRIP_ADDON_OWNER_ONLY]);
    const unseen = await callTool(stranger.id, 'set_trip_addon', {
      tripId: trip.id,
      addonId: 'budget',
      enabled: false,
    });
    expect(unseen.error).toBe('Trip not found or access denied.');
    expect(await countRows(orm, TripAddonOverrides, { trip: trip.id })).toBe(0);

    const done = await callTool(owner.id, 'set_trip_addon', { tripId: trip.id, addonId: 'budget', enabled: false });
    expect(entry(done.answer?.addons ?? [], 'budget')).toMatchObject({ enabled: false, overridden: true });
    const unknown = await callTool(owner.id, 'set_trip_addon', { tripId: trip.id, addonId: 'vacay', enabled: true });
    expect(unknown.error).toBe(TRIP_ADDON_NOT_FOUND);
    const reset = await callTool(owner.id, 'set_trip_addon', { tripId: trip.id, addonId: 'budget', enabled: null });
    expect(entry(reset.answer?.addons ?? [], 'budget')).toMatchObject({ overridden: false });
  });
});
