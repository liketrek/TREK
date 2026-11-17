/**
 * Trip tags e2e for an MCP client: the four trip tag tools and the `tags` the
 * place tools take, called through a real MCP session on the whole app
 * (buildApp, the real registry with its scopes and error mapper, the real
 * services and a migrated temp SQLite), the way an assistant tags a trip.
 */
import { buildApp } from '../../src/bootstrap';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { withRequestContext } from '../../src/nest/database/request-context';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { makePlace, makeTag, tagPlace } from '../helpers/factories/places';
import { addTripMember, makeDay, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let app: INestApplication;
let orm: MikroORM;

interface TagAnswer {
  id: number;
  name: string;
  color: string;
  trip_id?: number | null;
  user_id?: number;
}
interface Answer {
  tags?: TagAnswer[];
  tag?: TagAnswer;
  place?: { id: number; tags: TagAnswer[] };
  success?: boolean;
}

const NO_ACCESS = 'Trip not found or access denied.';

/** The tools `userId` is offered with `scopes`, and one call of `tool`: its JSON, or the text of its error. */
async function call(userId: number, tool: string, args: Record<string, unknown>, scopes: string[] | null = null) {
  const server = createLocalMcpServer('TREK trip tags e2e');
  const around = (_info: unknown, run: () => unknown): unknown => withRequestContext(orm, run);
  await withRequestContext(orm, () =>
    app
      .get(McpRegistryService)
      .attach(server, { userId, scopes, isStaticToken: false }, { include: (kind) => kind === 'tool', around }),
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'trip-tags-e2e', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const offered = (await client.listTools()).tools.map((entry) => entry.name);
    if (!offered.includes(tool)) return { offered, answer: null, error: null };
    const result = await client.callTool({ name: tool, arguments: args });
    const content = Array.isArray(result.content) ? (result.content as Array<{ text?: string }>) : [];
    const text = content[0]?.text ?? '';
    if (result.isError === true) return { offered, answer: null, error: text };
    return { offered, answer: JSON.parse(text) as Answer, error: null };
  } finally {
    await client.close();
    await server.close();
  }
}

const names = (answer: Answer | null) => (answer?.tags ?? []).map((tag) => tag.name);
const tagIds = (answer: Answer | null) => (answer?.place?.tags ?? []).map((tag) => tag.id).sort((a, b) => a - b);

/** A trip of `owner` with `member` on it; `stranger` is on neither and has a trip of their own. */
async function scene() {
  const { user: owner } = await makeUser(orm);
  const { user: member } = await makeUser(orm);
  const { user: stranger } = await makeUser(orm);
  const trip = await makeTrip(orm, owner.id, { title: 'Lisbon' });
  await addTripMember(orm, trip.id, member.id, owner.id);
  const elsewhere = await makeTrip(orm, stranger.id, { title: 'Porto' });
  return { owner, member, stranger, trip, elsewhere };
}

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
}, 60_000);

afterAll(async () => {
  await app?.close();
});

describe('the tags of a trip over MCP', () => {
  it('TRIPTAG-MCP-001: a member adds a tag every member then lists, renames and deletes', async () => {
    const s = await scene();
    const tripId = s.trip.id;

    const created = await call(s.member.id, 'create_trip_tag', { tripId, name: ' Monument ', color: '#ff0000' });
    expect(created.error).toBeNull();
    expect(created.answer?.tag).toMatchObject({ name: 'Monument', color: '#ff0000', trip_id: tripId });
    const tagId = created.answer?.tag?.id ?? 0;

    // The same name again, in another case and by somebody else, is that tag.
    const again = await call(s.owner.id, 'create_trip_tag', { tripId, name: 'MONUMENT' });
    expect(again.answer?.tag).toMatchObject({ id: tagId, name: 'Monument', color: '#ff0000' });
    expect(names((await call(s.owner.id, 'list_trip_tags', { tripId })).answer)).toEqual(['Monument']);

    const renamed = await call(s.owner.id, 'update_trip_tag', { tripId, tagId, name: 'Landmark' });
    expect(renamed.answer?.tag).toMatchObject({ id: tagId, name: 'Landmark', color: '#ff0000' });
    expect(names((await call(s.member.id, 'list_trip_tags', { tripId })).answer)).toEqual(['Landmark']);

    const deleted = await call(s.member.id, 'delete_trip_tag', { tripId, tagId });
    expect(deleted.answer).toEqual({ success: true });
    expect(names((await call(s.owner.id, 'list_trip_tags', { tripId })).answer)).toEqual([]);
  });

  it('TRIPTAG-MCP-002: lists the trip’s tags only, never a personal one or another trip’s', async () => {
    const s = await scene();
    await makeTag(orm, s.owner.id, { trip: s.trip.id, name: 'Zone' });
    await makeTag(orm, s.owner.id, { name: 'personal' });
    await makeTag(orm, s.stranger.id, { trip: s.elsewhere.id, name: 'Elsewhere' });

    expect(names((await call(s.member.id, 'list_trip_tags', { tripId: s.trip.id })).answer)).toEqual(['Zone']);
    // And the personal list keeps to itself.
    expect(names((await call(s.owner.id, 'list_tags', {})).answer)).toEqual(['personal']);
  });

  it('TRIPTAG-MCP-003: refuses a trip the caller is not on, a tag that is not the trip’s and a taken name', async () => {
    const s = await scene();
    const tripId = s.trip.id;
    const zone = await makeTag(orm, s.owner.id, { trip: tripId, name: 'Zone' });
    const monument = await makeTag(orm, s.owner.id, { trip: tripId, name: 'Monument' });
    const personal = await makeTag(orm, s.owner.id, { name: 'personal' });

    expect((await call(s.stranger.id, 'list_trip_tags', { tripId })).error).toBe(NO_ACCESS);
    expect((await call(s.stranger.id, 'create_trip_tag', { tripId, name: 'Mine' })).error).toBe(NO_ACCESS);
    expect((await call(s.stranger.id, 'update_trip_tag', { tripId, tagId: zone.id, name: 'Mine' })).error).toBe(
      NO_ACCESS,
    );
    expect((await call(s.stranger.id, 'delete_trip_tag', { tripId, tagId: zone.id })).error).toBe(NO_ACCESS);

    expect((await call(s.owner.id, 'update_trip_tag', { tripId, tagId: personal.id, name: 'x' })).error).toBe(
      'Tag not found.',
    );
    expect((await call(s.owner.id, 'delete_trip_tag', { tripId, tagId: personal.id })).error).toBe('Tag not found.');
    expect((await call(s.owner.id, 'update_trip_tag', { tripId, tagId: monument.id, name: 'zone' })).error).toBe(
      'A tag with this name already exists',
    );
    expect(names((await call(s.owner.id, 'list_trip_tags', { tripId })).answer)).toEqual(['Monument', 'Zone']);
  });

  it('TRIPTAG-MCP-004: a write needs the right to edit the trip’s places', async () => {
    const s = await scene();
    const check = vi.spyOn(app.get(PermissionsService), 'checkPermission').mockResolvedValue(false);
    try {
      const refused = await call(s.member.id, 'create_trip_tag', { tripId: s.trip.id, name: 'Zone' });
      expect(refused.error).toBe('You do not have permission to perform this action on this trip.');
      expect(names((await call(s.member.id, 'list_trip_tags', { tripId: s.trip.id })).answer)).toEqual([]);
    } finally {
      check.mockRestore();
    }
  });

  it('TRIPTAG-MCP-005: reading takes the places read scope and writing the write scope', async () => {
    const { user } = await makeUser(orm);
    const offeredTo = async (scopes: string[]) => (await call(user.id, 'no_such_tool', {}, scopes)).offered;
    const writes = ['create_trip_tag', 'delete_trip_tag', 'update_trip_tag'];
    const writesOf = (offered: string[]) => offered.filter((tool) => writes.includes(tool)).sort();

    const reader = await offeredTo(['places:read']);
    expect(reader).toContain('list_trip_tags');
    expect(writesOf(reader)).toEqual([]);
    expect(writesOf(await offeredTo(['places:write']))).toEqual(writes);
    expect(await offeredTo(['trips:read'])).not.toContain('list_trip_tags');
  });
});

describe('tags on the MCP place tools', () => {
  it('TRIPTAG-MCP-010: a new place takes the trip’s tags and the personal tags of people on it, nothing else', async () => {
    const s = await scene();
    const tripId = s.trip.id;
    const monument = await makeTag(orm, s.owner.id, { trip: tripId, name: 'Monument' });
    const ownPersonal = await makeTag(orm, s.member.id, { name: 'mine' });
    const foreignTrip = await makeTag(orm, s.stranger.id, { trip: s.elsewhere.id, name: 'Elsewhere' });
    const foreignPersonal = await makeTag(orm, s.stranger.id, { name: 'theirs' });

    const created = await call(s.member.id, 'create_place', {
      tripId,
      name: 'Belem Tower',
      tags: [monument.id, ownPersonal.id, foreignTrip.id, foreignPersonal.id],
    });

    expect(created.error).toBeNull();
    expect(tagIds(created.answer)).toEqual([monument.id, ownPersonal.id].sort((a, b) => a - b));
  });

  it('TRIPTAG-MCP-011: create_and_assign_place tags the place it plans', async () => {
    const s = await scene();
    const day = await makeDay(orm, s.trip.id, { day_number: 1 });
    const zone = await makeTag(orm, s.owner.id, { trip: s.trip.id, name: 'Zone' });

    const created = await call(s.owner.id, 'create_and_assign_place', {
      tripId: s.trip.id,
      dayId: day.id,
      name: 'Alfama',
      tags: [zone.id],
    });

    expect(created.error).toBeNull();
    expect(tagIds(created.answer)).toEqual([zone.id]);
  });

  it('TRIPTAG-MCP-012: an update replaces the tags it names, keeps them when it names none and clears them on []', async () => {
    const s = await scene();
    const tripId = s.trip.id;
    const place = await makePlace(orm, tripId, { name: 'Belem Tower' });
    const monument = await makeTag(orm, s.owner.id, { trip: tripId, name: 'Monument' });
    const zone = await makeTag(orm, s.owner.id, { trip: tripId, name: 'Zone' });
    await tagPlace(orm, place.id, [monument.id]);
    const update = (args: Record<string, unknown>) =>
      call(s.member.id, 'update_place', { tripId, placeId: place.id, ...args });

    expect(tagIds((await update({ notes: 'By the river' })).answer)).toEqual([monument.id]);
    expect(tagIds((await update({ tags: [zone.id] })).answer)).toEqual([zone.id]);
    expect(tagIds((await update({ tags: [] })).answer)).toEqual([]);
    expect((await update({ tags: ['zone'] })).error).toBeTruthy();
  });
});
