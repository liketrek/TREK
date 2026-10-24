/**
 * Packing e2e for the list as an MCP client reads it: list_packing_items
 * called through a real MCP session on the whole app (buildApp, the real
 * registry with its addon gate, scopes and error mapper, the real
 * PackingService and a migrated temp SQLite), the way the assistant's
 * packing cards read it.
 */
import { buildApp } from '../../src/bootstrap';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { withRequestContext } from '../../src/nest/database/request-context';
import { addPackingBagMembers, makePackingBag, makePackingItem } from '../helpers/factories/packing';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;

type Answer = {
  items: Array<Record<string, unknown>>;
  bags: Array<Record<string, unknown>>;
  category_assignees: Record<string, unknown>;
};

/** The tools `userId` is offered with `scopes`, and one call of list_packing_items: its JSON, or its error. */
async function listItems(userId: number, args: Record<string, unknown>, scopes: string[] | null = null) {
  const server = createLocalMcpServer('TREK packing e2e');
  const around = (_info: unknown, call: () => unknown): unknown => withRequestContext(orm, call);
  await withRequestContext(orm, () =>
    app
      .get(McpRegistryService)
      .attach(server, { userId, scopes, isStaticToken: false }, { include: (kind) => kind === 'tool', around }),
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'packing-e2e', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const offered = (await client.listTools()).tools.map((tool) => tool.name);
    if (!offered.includes('list_packing_items')) return { offered, answer: null, error: null };
    const result = await client.callTool({ name: 'list_packing_items', arguments: args });
    const content = Array.isArray(result.content) ? (result.content as Array<{ text?: string }>) : [];
    const text = content[0]?.text ?? '';
    if (result.isError === true) return { offered, answer: null, error: text };
    return { offered, answer: JSON.parse(text) as Answer, error: null };
  } finally {
    await client.close();
    await server.close();
  }
}

const names = (answer: Answer | null) => (answer?.items ?? []).map((item) => item.name);

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
  await setAddonEnabled(orm, 'packing', true);
}, 60_000);

afterAll(async () => {
  await app?.close();
});

describe('the packing list over MCP', () => {
  it('PACKMCP-E2E-001: lists the items the user may see with the bags and who looks after each category', async () => {
    const { user } = await makeUser(orm);
    const { user: member } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Lisbon' });
    await addTripMember(orm, trip.id, member.id, user.id);
    const bag = await makePackingBag(orm, trip.id, { name: 'Carry-on', color: '#6366f1' });
    await addPackingBagMembers(orm, bag.id, [user.id]);
    await makePackingItem(orm, trip.id, { name: 'Rain jacket', category: 'Clothes', bag: bag.id, sort_order: 1 });
    await makePackingItem(orm, trip.id, { name: 'Sunscreen', category: 'Toiletries', checked: 1, sort_order: 2 });
    await makePackingItem(orm, trip.id, {
      name: 'Diary',
      category: 'Clothes',
      is_private: 1,
      owner: member.id,
      sort_order: 3,
    });
    const { answer } = await listItems(user.id, { tripId: trip.id });
    // Another member's personal item stays with them (#858).
    expect(names(answer)).toEqual(['Rain jacket', 'Sunscreen']);
    expect(answer?.items[0]).toMatchObject({ category: 'Clothes', bag_id: bag.id, quantity: 1 });
    expect(answer?.bags).toEqual([expect.objectContaining({ id: bag.id, name: 'Carry-on', color: '#6366f1' })]);
    expect(answer?.category_assignees).toEqual({});
    const own = await listItems(member.id, { tripId: trip.id });
    expect(names(own.answer)).toContain('Diary');
  });

  it('PACKMCP-E2E-002: narrows to one category, one bag, the items in no bag, or what is open or packed', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const bag = await makePackingBag(orm, trip.id, { name: 'Daypack' });
    await makePackingItem(orm, trip.id, { name: 'Boots', category: 'Hiking', bag: bag.id, sort_order: 1 });
    await makePackingItem(orm, trip.id, { name: 'Map', category: 'Hiking', checked: 1, sort_order: 2 });
    await makePackingItem(orm, trip.id, { name: 'Charger', category: 'Tech', sort_order: 3 });
    expect(names((await listItems(user.id, { tripId: trip.id, category: 'Hiking' })).answer)).toEqual(['Boots', 'Map']);
    expect(names((await listItems(user.id, { tripId: trip.id, bag_id: bag.id })).answer)).toEqual(['Boots']);
    expect(names((await listItems(user.id, { tripId: trip.id, bag_id: null })).answer)).toEqual(['Map', 'Charger']);
    expect(names((await listItems(user.id, { tripId: trip.id, status: 'open' })).answer)).toEqual(['Boots', 'Charger']);
    expect(names((await listItems(user.id, { tripId: trip.id, status: 'packed' })).answer)).toEqual(['Map']);
    // The grouping only says how the list is shown: it filters nothing.
    expect(names((await listItems(user.id, { tripId: trip.id, group_by: 'bag' })).answer)).toHaveLength(3);
  });

  it('PACKMCP-E2E-003: refuses a trip the user is not part of', async () => {
    const { user } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await makePackingItem(orm, trip.id, { name: 'Passport' });
    const { answer, error } = await listItems(stranger.id, { tripId: trip.id });
    expect(answer).toBeNull();
    expect(error).toBeTruthy();
  });

  it('PACKMCP-E2E-004: needs the packing read scope, and is gone while the Lists addon is off', async () => {
    const { user } = await makeUser(orm);
    expect((await listItems(user.id, { tripId: 1 }, ['trips:read'])).offered).not.toContain('list_packing_items');
    expect((await listItems(user.id, { tripId: 1 }, ['packing:read'])).offered).toContain('list_packing_items');
    await setAddonEnabled(orm, 'packing', false);
    try {
      expect((await listItems(user.id, { tripId: 1 })).offered).not.toContain('list_packing_items');
    } finally {
      await setAddonEnabled(orm, 'packing', true);
    }
  });
});
