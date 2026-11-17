/**
 * Collab e2e for the notes as an MCP client reads them: list_collab_notes
 * called through a real MCP session on the whole app (buildApp, the real
 * registry with its addon and sub-feature gates, scopes and error mapper,
 * the real CollabService and a migrated temp SQLite), the way the
 * assistant's note cards read them. The shared links (#3076) ride the same
 * path: saved over MCP, read back over MCP and over the REST route.
 */
import { buildApp } from '../../src/bootstrap';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { withRequestContext } from '../../src/nest/database/request-context';
import { authCookie } from '../helpers/auth';
import { makeCollabNote } from '../helpers/factories/collab';
import { setAddonEnabled, setCollabFeature } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;

/** The tools `userId` is offered, and one call of `name` as that user with every scope: its JSON, or its error. */
async function session(userId: number, name: string, args: Record<string, unknown>) {
  const server = createLocalMcpServer('TREK collab e2e');
  const around = (_info: unknown, call: () => unknown): unknown => withRequestContext(orm, call);
  await withRequestContext(orm, () =>
    app
      .get(McpRegistryService)
      .attach(server, { userId, scopes: null, isStaticToken: false }, { include: (kind) => kind === 'tool', around }),
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'collab-e2e', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const offered = (await client.listTools()).tools.map((tool) => tool.name);
    if (!offered.includes(name)) return { offered, answer: null };
    const result = await client.callTool({ name, arguments: args });
    const content = Array.isArray(result.content) ? (result.content as Array<{ text?: string }>) : [];
    const text = content[0]?.text ?? '';
    return { offered, answer: result.isError === true ? { error: text } : (JSON.parse(text) as unknown) };
  } finally {
    await client.close();
    await server.close();
  }
}

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
  await setAddonEnabled(orm, 'collab', true);
}, 60_000);

afterAll(async () => {
  await app?.close();
});

describe('the shared notes over MCP', () => {
  it('COLLAB-MCP-E2E-001: lists the notes of the trip, pinned first, with their category, colour and link', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Rome' });
    await makeCollabNote(orm, trip.id, user.id, { title: 'Packing ideas', category: 'Ideas' });
    const pinned = await makeCollabNote(orm, trip.id, user.id, {
      title: 'Restaurants',
      category: 'Food',
      color: '#10b981',
      website: 'https://www.luigis.it/menu',
      pinned: 1,
    });
    const { answer } = await session(user.id, 'list_collab_notes', { tripId: trip.id });
    const notes = (answer as { notes: Array<Record<string, unknown>> }).notes;
    expect(notes.map((note) => note.title)).toEqual(['Restaurants', 'Packing ideas']);
    expect(notes[0]).toMatchObject({
      id: pinned.id,
      category: 'Food',
      color: '#10b981',
      website: 'https://www.luigis.it/menu',
      pinned: 1,
      username: user.username,
      attachments: [],
    });
  });

  it('COLLAB-MCP-E2E-002: refuses a trip the user is not part of', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    const trip = await makeTrip(orm, owner.id);
    await makeCollabNote(orm, trip.id, owner.id, { title: 'Private' });
    const { answer } = await session(stranger.id, 'list_collab_notes', { tripId: trip.id });
    expect(answer).toEqual({ error: expect.any(String) });
  });

  it('COLLAB-MCP-E2E-003: is gone while the notes are switched off, and back with them', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await setCollabFeature(orm, 'notes', false);
    try {
      const { offered } = await session(user.id, 'list_collab_notes', { tripId: trip.id });
      expect(offered).not.toContain('list_collab_notes');
      expect(offered).toContain('list_collab_polls');
    } finally {
      await setCollabFeature(orm, 'notes', true);
    }
    expect((await session(user.id, 'list_collab_notes', { tripId: trip.id })).answer).toEqual({ notes: [] });
  });
});

describe('the shared links over MCP', () => {
  it('COLLAB-MCP-E2E-004: saves a link the Links panel then lists, and reads it back', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Lisbon' });
    const created = await session(user.id, 'create_collab_link', {
      tripId: trip.id,
      title: 'Tram 28 timetable',
      url: 'https://example.com/tram-28',
    });
    const link = (created.answer as { link: Record<string, unknown> }).link;
    expect(link).toMatchObject({ title: 'Tram 28 timetable', url: 'https://example.com/tram-28', pinned: 0 });

    const { answer } = await session(user.id, 'list_collab_links', { tripId: trip.id });
    expect(answer).toEqual({ links: [expect.objectContaining({ id: link.id, username: user.username })] });
    const rest = await request(app.getHttpServer())
      .get(`/api/trips/${trip.id}/collab/links`)
      .set('Cookie', authCookie(user.id));
    expect(rest.status).toBe(200);
    expect(rest.body.links.map((row: { id: number }) => row.id)).toEqual([link.id]);
  });

  it('COLLAB-MCP-E2E-005: is gone while the links are switched off', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await setCollabFeature(orm, 'links', false);
    try {
      const { offered } = await session(user.id, 'list_collab_links', { tripId: trip.id });
      expect(offered).not.toContain('list_collab_links');
      expect(offered).not.toContain('create_collab_link');
      expect(offered).toContain('list_collab_notes');
    } finally {
      await setCollabFeature(orm, 'links', true);
    }
  });
});
