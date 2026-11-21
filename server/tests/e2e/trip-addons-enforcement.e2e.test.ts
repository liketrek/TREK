/**
 * Per-trip addons, enforced: what a trip's own choice does to the surfaces of
 * its addons, end to end on the whole app (buildApp, the real guards, the
 * response contract check, the MCP registry with the host's tool gate).
 *
 * Every surface is held both ways: the instance has the addon off and the
 * trip switched it on (allowed), and the instance has it on and the trip
 * switched it off (refused with `<Label> addon is not enabled`, data kept).
 * A trip without a choice follows the instance, so the instance switch now
 * closes the lists, costs, collab and files routes too.
 */
import { buildApp } from '../../src/bootstrap';
import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { withRequestContext } from '../../src/nest/database/request-context';
import { makeBudgetItem } from '../helpers/factories/budget';
import { makeCollabNote } from '../helpers/factories/collab';
import { makeTripFile } from '../helpers/factories/files';
import { makePackingItem } from '../helpers/factories/packing';
import { countRows } from '../helpers/factories/rows';
import { setAddonEnabled, setTripAddon } from '../helpers/factories/settings';
import { makeTodoItem } from '../helpers/factories/todos';
import { addTripMember, makeShareToken, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { oneByOne } from '../helpers/one-by-one';
import { resetDatabase } from '../helpers/reset-database';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
}, 60_000);
beforeEach(async () => {
  await resetDatabase(orm);
});
afterAll(async () => {
  await app?.close();
});

const TRIP_ADDONS = ['packing', 'budget', 'documents', 'collab', 'roadtrip', 'tours'];

/**
 * Every trip addon on for the instance, an owner with two trips, a member on
 * the first, and a stranger; each trip holds a row of every addon.
 */
async function world() {
  await Promise.all(TRIP_ADDONS.map((addonId) => setAddonEnabled(orm, addonId, true)));
  const { user: owner } = await makeUser(orm);
  const { user: member } = await makeUser(orm);
  const { user: stranger } = await makeUser(orm);
  const chosen = await makeTrip(orm, owner.id, { title: 'Chosen' });
  const plain = await makeTrip(orm, owner.id, { title: 'Plain' });
  await addTripMember(orm, chosen.id, member.id, owner.id);
  await Promise.all(
    [chosen.id, plain.id].map(async (tripId) => {
      await makePackingItem(orm, tripId, { name: 'Tent' });
      await makeTodoItem(orm, tripId, { name: 'Book ferry' });
      await makeBudgetItem(orm, tripId, { name: 'Hotel' });
      await makeCollabNote(orm, tripId, owner.id, { title: 'Ideas' });
      await makeTripFile(orm, tripId, { original_name: 'ticket.pdf' });
    }),
  );
  return { owner, member, stranger, chosen, plain };
}

const get = (userId: number | null, path: string) => {
  const req = request(app.getHttpServer()).get(path);
  return userId === null ? req : req.set('Cookie', sessionCookie(userId));
};

/** One read route per trip addon whose REST surface had no addon check before. */
const ROUTES: ReadonlyArray<[string, string, (tripId: number) => string]> = [
  ['packing', 'Packing', (id) => `/api/trips/${id}/packing`],
  ['packing', 'Packing', (id) => `/api/trips/${id}/todo`],
  ['budget', 'Costs', (id) => `/api/trips/${id}/budget`],
  ['collab', 'Collab', (id) => `/api/trips/${id}/collab/notes`],
  ['documents', 'Documents', (id) => `/api/trips/${id}/files`],
  ['roadtrip', 'Road trip', (id) => `/api/trips/${id}/roadtrip/vias`],
  ['tours', 'Tours', (id) => `/api/trips/${id}/tours`],
];

describe('trip-scoped REST', () => {
  it.each(ROUTES)(
    'TRIPADDON-ENF-001: %s at %s: a trip that switched it off answers 404 while the instance has it on',
    async (addonId, label, path) => {
      const { owner, member, chosen, plain } = await world();
      await setAddonEnabled(orm, addonId, true);
      await setTripAddon(orm, chosen.id, addonId, false);
      const [own, asMember, other] = await oneByOne(
        [
          () => get(owner.id, path(chosen.id)),
          () => get(member.id, path(chosen.id)),
          () => get(owner.id, path(plain.id)),
        ],
        (send) => send(),
      );
      expect(own.status).toBe(404);
      expect(own.body).toEqual({ error: `${label} addon is not enabled` });
      expect(asMember.status).toBe(404);
      expect(other.status).toBe(200);
    },
  );

  it.each(ROUTES)(
    'TRIPADDON-ENF-002: %s at %s: a trip that switched it on answers while the instance has it off, the others 404',
    async (addonId, label, path) => {
      const { owner, member, chosen, plain } = await world();
      await setAddonEnabled(orm, addonId, false);
      await setTripAddon(orm, chosen.id, addonId, true);
      const [own, asMember, other] = await oneByOne(
        [
          () => get(owner.id, path(chosen.id)),
          () => get(member.id, path(chosen.id)),
          () => get(owner.id, path(plain.id)),
        ],
        (send) => send(),
      );
      expect(own.status).toBe(200);
      expect(asMember.status).toBe(200);
      expect(other.status).toBe(404);
      expect(other.body).toEqual({ error: `${label} addon is not enabled` });
    },
  );

  it('TRIPADDON-ENF-003: a stranger hears "Trip not found" and nobody signed in a 401, whatever the trip chose', async () => {
    const { stranger, chosen } = await world();
    await setTripAddon(orm, chosen.id, 'budget', false);
    const [unseen, anonymous] = await oneByOne(
      [() => get(stranger.id, `/api/trips/${chosen.id}/budget`), () => get(null, `/api/trips/${chosen.id}/budget`)],
      (send) => send(),
    );
    expect(unseen.status).toBe(404);
    expect(unseen.body).toEqual({ error: 'Trip not found' });
    expect(anonymous.status).toBe(401);
  });

  it('TRIPADDON-ENF-004: the multipart upload refuses in its handler, so the caller reads the 404 body', async () => {
    const { owner, chosen } = await world();
    await setTripAddon(orm, chosen.id, 'documents', false);
    const res = await request(app.getHttpServer())
      .post(`/api/trips/${chosen.id}/files`)
      .set('Cookie', sessionCookie(owner.id))
      .attach('file', Buffer.from('%PDF-1.4 test'), 'ticket.pdf');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Documents addon is not enabled' });
  });

  it('TRIPADDON-ENF-005: switching back on brings every row back where it was', async () => {
    const { owner, chosen } = await world();
    await setTripAddon(orm, chosen.id, 'packing', false);
    expect((await get(owner.id, `/api/trips/${chosen.id}/packing`)).status).toBe(404);
    await setTripAddon(orm, chosen.id, 'packing', true);
    const res = await get(owner.id, `/api/trips/${chosen.id}/packing`);
    expect(res.status).toBe(200);
    expect((res.body.items as Array<{ name: string }>).map((item) => item.name)).toEqual(['Tent']);
  });
});

describe('routes about no one trip', () => {
  it('TRIPADDON-ENF-010: the tour library opens for a user one of whose trips switched Tours on', async () => {
    const { owner, member, stranger, chosen } = await world();
    await setAddonEnabled(orm, 'tours', false);
    expect((await get(owner.id, '/api/tours/library')).status).toBe(404);
    await setTripAddon(orm, chosen.id, 'tours', true);
    const [own, asMember, other] = await oneByOne(
      [
        () => get(owner.id, '/api/tours/library'),
        () => get(member.id, '/api/tours/library'),
        () => get(stranger.id, '/api/tours/library'),
      ],
      (send) => send(),
    );
    expect(own.status).toBe(200);
    expect(asMember.status).toBe(200);
    expect(other.status).toBe(404);
    expect(other.body).toEqual({ error: 'Tours addon is not enabled' });
  });

  it('TRIPADDON-ENF-011: a trip that switched Tours off closes the library for nobody while the instance has it on', async () => {
    const { owner, chosen } = await world();
    await setTripAddon(orm, chosen.id, 'tours', false);
    expect((await get(owner.id, '/api/tours/library')).status).toBe(200);
  });
});

describe('what leaves the trip in bulk', () => {
  it('TRIPADDON-ENF-020: the offline bundle sends empty lists for the addons the trip has off', async () => {
    const { owner, chosen } = await world();
    await setTripAddon(orm, chosen.id, 'packing', false);
    await setTripAddon(orm, chosen.id, 'documents', false);
    const res = await get(owner.id, `/api/trips/${chosen.id}/bundle`);
    expect(res.status).toBe(200);
    expect(res.body.packingItems).toEqual([]);
    expect(res.body.todoItems).toEqual([]);
    expect(res.body.files).toEqual([]);
    expect((res.body.budgetItems as Array<{ name: string }>).map((item) => item.name)).toEqual(['Hotel']);
  });

  it('TRIPADDON-ENF-021: the offline bundle carries an addon a trip switched on while the instance has it off', async () => {
    const { owner, chosen, plain } = await world();
    await setAddonEnabled(orm, 'budget', false);
    await setTripAddon(orm, chosen.id, 'budget', true);
    const [on, off] = await oneByOne(
      [() => get(owner.id, `/api/trips/${chosen.id}/bundle`), () => get(owner.id, `/api/trips/${plain.id}/bundle`)],
      (send) => send(),
    );
    expect((on.body.budgetItems as unknown[]).length).toBe(1);
    expect(off.body.budgetItems).toEqual([]);
  });

  it('TRIPADDON-ENF-022: a share link leaves out what the trip has off, whatever the link allows', async () => {
    const { owner, chosen } = await world();
    const share = await makeShareToken(orm, chosen.id, owner.id, {
      token: 'trip-addon-share',
      share_packing: 1,
      share_budget: 1,
      share_collab: 1,
    });
    await setTripAddon(orm, chosen.id, 'budget', false);
    const res = await get(null, `/api/shared/${share.token}`);
    expect(res.status).toBe(200);
    expect(res.body.permissions).toMatchObject({ share_packing: true, share_budget: false, share_collab: true });
    expect((res.body.packing as unknown[]).length).toBe(1);
  });
});

/** One MCP tool call as `userId` through a real session: its JSON, or its error text. */
async function callTool(userId: number, name: string, args: Record<string, unknown>) {
  const server = createLocalMcpServer('TREK trip addon enforcement e2e');
  const around = (_info: unknown, call: () => unknown): unknown => withRequestContext(orm, call);
  await withRequestContext(orm, () =>
    app
      .get(McpRegistryService)
      .attach(server, { userId, scopes: null, isStaticToken: false }, { include: (kind) => kind === 'tool', around }),
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'trip-addon-enforcement-e2e', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const listed = (await client.listTools()).tools.map((tool) => tool.name);
    if (!listed.includes(name)) return { listed: false, answer: null, error: null };
    const result = await client.callTool({ name, arguments: args });
    const content = Array.isArray(result.content) ? (result.content as Array<{ text?: string }>) : [];
    const text = content[0]?.text ?? '';
    return result.isError === true
      ? { listed: true, answer: null, error: text }
      : { listed: true, answer: JSON.parse(text) as Record<string, unknown>, error: null };
  } finally {
    await client.close();
    await server.close();
  }
}

describe('MCP', () => {
  it('TRIPADDON-ENF-030: a trip that switched Lists off refuses the tool for that trip and keeps it for the others', async () => {
    const { owner, chosen, plain } = await world();
    await setTripAddon(orm, chosen.id, 'packing', false);
    const refused = await callTool(owner.id, 'list_packing_items', { tripId: chosen.id });
    expect(refused.error).toBe('Packing addon is not enabled');
    const other = await callTool(owner.id, 'list_packing_items', { tripId: plain.id });
    expect(other.error).toBeNull();
    expect(other.answer).not.toBeNull();
  });

  it('TRIPADDON-ENF-031: with the instance off a tool is offered to whoever has a trip that switched it on, for that trip', async () => {
    const { owner, stranger, chosen, plain } = await world();
    await setAddonEnabled(orm, 'packing', false);
    expect((await callTool(owner.id, 'list_packing_items', { tripId: chosen.id })).listed).toBe(false);
    await setTripAddon(orm, chosen.id, 'packing', true);
    const allowed = await callTool(owner.id, 'list_packing_items', { tripId: chosen.id });
    expect(allowed.error).toBeNull();
    const elsewhere = await callTool(owner.id, 'list_packing_items', { tripId: plain.id });
    expect(elsewhere.error).toBe('Packing addon is not enabled');
    expect((await callTool(stranger.id, 'list_packing_items', { tripId: chosen.id })).listed).toBe(false);
  });

  it('TRIPADDON-ENF-032: a trip the caller cannot see gets the tool\'s own "not found", never the addon answer', async () => {
    const { stranger, chosen } = await world();
    await setTripAddon(orm, chosen.id, 'budget', false);
    await setTripAddon(orm, (await makeTrip(orm, stranger.id)).id, 'budget', true);
    const res = await callTool(stranger.id, 'list_settlements', { tripId: chosen.id });
    expect(res.listed).toBe(true);
    expect(res.error).not.toBe('Costs addon is not enabled');
  });

  it('TRIPADDON-ENF-033: the trip summary leaves out the sections of the addons the trip has off', async () => {
    const { owner, chosen } = await world();
    await setTripAddon(orm, chosen.id, 'packing', false);
    await setTripAddon(orm, chosen.id, 'budget', false);
    const res = await callTool(owner.id, 'get_trip_summary', { tripId: chosen.id });
    expect(res.error).toBeNull();
    expect(res.answer).not.toHaveProperty('packing');
    expect(res.answer).not.toHaveProperty('budget');
  });
});

describe('what a booking writes into Costs', () => {
  it('TRIPADDON-ENF-040: a booking with a price on a trip with Costs off is written without its cost, REST and MCP alike', async () => {
    const { owner, chosen } = await world();
    await setTripAddon(orm, chosen.id, 'budget', false);
    const rest = await request(app.getHttpServer())
      .post(`/api/trips/${chosen.id}/reservations`)
      .set('Cookie', sessionCookie(owner.id))
      .send({ title: 'Hut night', type: 'other', create_budget_entry: { total_price: 80 } });
    expect(rest.status).toBe(201);
    const tool = await callTool(owner.id, 'create_reservation', {
      tripId: chosen.id,
      title: 'Museum',
      type: 'event',
      price: 20,
    });
    expect(tool.error).toBeNull();
    expect(await countRows(orm, Reservations, { trip: chosen.id })).toBe(2);
    // Only the cost world() made before; the trip keeps it while Costs is off.
    expect(await countRows(orm, BudgetItems, { trip: chosen.id })).toBe(1);
  });
});
