/**
 * The assistant's whole-book design e2e (JBDSNE2E-*): the design tools called
 * through a real MCP session on the whole app (buildApp, the real registry
 * with its addon gate and error mapper, the real services, a migrated temp
 * SQLite), the draft read and narrowed over the proposal card's REST routes,
 * the result read back through GET /api/journeys/:id/book. Broadcasts are
 * spied on the container's RealtimeService.
 *
 * What it pins: design_book makes a draft and writes nothing; the draft route
 * serves its maker the designed book and plan (410 for anyone else, 403 for a
 * viewer's selection); the selection narrows what the apply writes; the apply
 * is one write GET reads next, sent once to every member; the revision puts
 * the book back; and the design tools are gone while the Journey addon is off.
 */
import { ADDON_IDS } from '../../src/addons';
import { buildApp } from '../../src/bootstrap';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { withRequestContext } from '../../src/nest/database/request-context';
import { authCookie } from '../helpers/auth';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../helpers/factories/journeys';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';
import {
  bookDesignAnswerSchema,
  bookDesignApplyResultSchema,
  bookDesignDraftResponseSchema,
  bookWriteResultSchema,
} from '@trek/shared';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const DESIGN_TOOLS = [
  'design_book',
  'get_book_design',
  'revise_book_design',
  'apply_book_design',
  'restore_book_revision',
];

let app: INestApplication;
let orm: MikroORM;
let broadcasts: RealtimeSpies;

beforeAll(async () => {
  app = await buildApp();
  await app.init();
  orm = app.get(MikroORM);
  broadcasts = spyOnRealtime(app);
}, 60_000);

beforeEach(async () => {
  await setAddonEnabled(orm, ADDON_IDS.JOURNEY, true);
  broadcasts.broadcastToUser.mockClear();
});

afterAll(async () => {
  await app?.close();
});

/** An MCP session of its own as `userId`, with every scope, holding only the tools `include` lets through. */
async function session<T>(userId: number, include: (tool: string) => boolean, use: (client: Client) => Promise<T>) {
  const server = createLocalMcpServer('TREK book design e2e');
  const around = (_info: unknown, call: () => unknown): unknown => withRequestContext(orm, call);
  await withRequestContext(orm, () =>
    app
      .get(McpRegistryService)
      .attach(
        server,
        { userId, scopes: null, isStaticToken: false },
        { include: (kind, tool) => kind === 'tool' && include(tool), around },
      ),
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'book-design-e2e', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    return await use(client);
  } finally {
    await client.close();
    await server.close();
  }
}

/** One tool call: the JSON it answered, or its error text. */
async function callTool(userId: number, name: string, args: Record<string, unknown>) {
  const only = (tool: string) => tool === name;
  return session(userId, only, async (client) => {
    const result = await client.callTool({ name, arguments: args });
    const content = Array.isArray(result.content) ? (result.content as Array<{ text?: string }>) : [];
    const text = content[0]?.text ?? '';
    return result.isError === true ? { error: text } : (JSON.parse(text) as unknown);
  });
}

/** Who was told what, in user order, emptied after each read. */
function sent() {
  const calls = broadcasts.broadcastToUser.mock.calls
    .map(([to, msg]) => [to, String(msg.type)] as const)
    .sort((a, b) => a[0] - b[0]);
  broadcasts.broadcastToUser.mockClear();
  return calls;
}

/** A journey with two written entries, its owner, an editor and a viewer, and a blank book. */
async function journeyWithBook() {
  const { user: owner } = await makeUser(orm);
  const { user: editor } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id, { title: 'Lisbon' });
  await addJourneyContributor(orm, journey.id, editor.id, 'editor');
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  await makeJourneyEntry(orm, journey.id, owner.id, { title: 'Alfama', story: 'Trams.', entry_date: '2026-05-02' });
  await makeJourneyEntry(orm, journey.id, owner.id, { title: 'Belem', story: 'Pasteis.', entry_date: '2026-05-03' });
  const created = bookWriteResultSchema.parse(await callTool(owner.id, 'create_book', { journeyId: journey.id }));
  sent();
  return { owner, editor, viewer, journey, created, everyone: [owner.id, editor.id, viewer.id].sort((a, b) => a - b) };
}

const book = (journeyId: number, userId: number) =>
  request(app.getHttpServer()).get(`/api/journeys/${journeyId}/book`).set('Cookie', authCookie(userId));

describe('the whole-book design over MCP and REST', () => {
  it('JBDSNE2E-001: design, narrow, apply, read back and take back', async () => {
    const { editor, viewer, journey, created, everyone } = await journeyWithBook();

    const draft = bookDesignAnswerSchema.parse(await callTool(editor.id, 'design_book', { journeyId: journey.id }));
    expect(sent()).toEqual([]);
    expect((await book(journey.id, editor.id)).body.book.version).toBe(created.version);

    const route = `/api/journeys/${journey.id}/book-designs/${draft.design_id}`;
    const viewed = await request(app.getHttpServer()).get(route).set('Cookie', authCookie(editor.id));
    expect(viewed.status).toBe(200);
    const served = bookDesignDraftResponseSchema.parse(viewed.body);
    expect([served.designId, served.baseVersion]).toEqual([draft.design_id, created.version]);
    expect(served.selection).toEqual(draft.selected);
    const other = await request(app.getHttpServer()).get(route).set('Cookie', authCookie(viewer.id));
    expect(other.status).toBe(410);

    const keep = draft.selected.slice(0, 2);
    const narrowed = await request(app.getHttpServer())
      .put(`${route}/selection`)
      .set('Cookie', authCookie(editor.id))
      .send({ spreadIds: keep });
    expect([narrowed.status, narrowed.body]).toEqual([200, { selection: keep }]);
    const refused = await request(app.getHttpServer())
      .put(`${route}/selection`)
      .set('Cookie', authCookie(viewer.id))
      .send({ spreadIds: keep });
    expect(refused.status).toBe(403);
    const unknown = await request(app.getHttpServer())
      .put(`${route}/selection`)
      .set('Cookie', authCookie(editor.id))
      .send({ spreadIds: ['sp nowhere'] });
    expect(unknown.status).toBe(400);

    const applied = bookDesignApplyResultSchema.parse(
      await callTool(editor.id, 'apply_book_design', { journeyId: journey.id, designId: draft.design_id }),
    );
    expect(applied.applied).toEqual(keep);
    expect(sent()).toEqual(everyone.map((id) => [id, 'journey:book:saved']));
    const after = await book(journey.id, viewer.id);
    expect(after.body.book.version).toBe(applied.version);
    const ids = (after.body.book.document.spreads as Array<{ id: string }>).map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(keep));

    const back = { journeyId: journey.id, revisionId: applied.revision_id, expectedVersion: applied.version };
    const restored = bookWriteResultSchema.parse(await callTool(editor.id, 'restore_book_revision', back));
    expect(restored.version).toBe(applied.version + 1);
    const again = await book(journey.id, editor.id);
    expect((again.body.book.document.spreads as Array<{ id: string }>).map((s) => s.id)).toEqual(created.spread_ids);
  });

  it('JBDSNE2E-002: a viewer is refused the design in the words a tool answers; a gone draft says to design again', async () => {
    const { owner, viewer, journey } = await journeyWithBook();
    expect(await callTool(viewer.id, 'design_book', { journeyId: journey.id })).toEqual({
      error: "You can read this journey's book but not change it: only its owner and editors can.",
    });
    const gone = await callTool(owner.id, 'apply_book_design', { journeyId: journey.id, designId: 'd-none' });
    expect(gone).toEqual({ error: expect.stringContaining('run design_book again') });
  });

  it('JBDSNE2E-003: the design tools are gone while the Journey addon is off', async () => {
    const { user } = await makeUser(orm);
    await setAddonEnabled(orm, ADDON_IDS.JOURNEY, false);
    const names = await session(
      user.id,
      () => true,
      async (client) => (await client.listTools()).tools.map((tool) => tool.name),
    );
    expect(names.filter((name) => DESIGN_TOOLS.includes(name))).toEqual([]);
    expect(names.length).toBeGreaterThan(0);
  });
});
