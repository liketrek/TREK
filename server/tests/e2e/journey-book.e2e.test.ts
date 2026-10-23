/**
 * Studio book e2e: the book tools called through a real MCP session on the
 * whole app (buildApp, the real registry with its addon gate, scopes and error
 * mapper, the real services and a migrated temp SQLite), checked against the
 * REST route the Studio saves through. The broadcasts are spied on the
 * container's RealtimeService.
 *
 * What it pins: an MCP write is what GET /api/journeys/:id/book reads next; a
 * viewer's write is refused with the tool's own words, and an operation the
 * engine refuses with the operation it names; a REST save and an MCP write
 * send the same event to the same users, REST leaving out the tab that saved
 * and MCP none; the tools are gone while the Journey addon is off; and a book
 * a newer Studio wrote is refused with 409 and its code over both, even when
 * its document holds what this build cannot parse.
 */
import { ADDON_IDS } from '../../src/addons';
import { buildApp } from '../../src/bootstrap';
import { JourneyBooks } from '../../src/db/entities/JourneyBooks.entity';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { withRequestContext } from '../../src/nest/database/request-context';
import { authCookie } from '../helpers/auth';
import { addJourneyContributor, makeJourney } from '../helpers/factories/journeys';
import { findRow, updateRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';
import { bookWriteResultSchema } from '@trek/shared';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const BOOK_TOOLS = [
  'get_book',
  'describe_book_page',
  'list_book_layouts',
  'create_book',
  'add_book_pages',
  'move_book_page',
  'delete_book_pages',
  'edit_book_page',
  'set_book_cover',
  'restore_book_page',
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
  const server = createLocalMcpServer('TREK book e2e');
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
  const client = new Client({ name: 'book-e2e', version: '1.0.0' });
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

/** The user sends as [user, event type, left-out socket], in user order, emptied after each read. */
function sent() {
  const calls = broadcasts.broadcastToUser.mock.calls
    .map(([to, msg, sid]) => [to, String(msg.type), sid] as const)
    .sort((a, b) => a[0] - b[0]);
  broadcasts.broadcastToUser.mockClear();
  return calls;
}

/** A journey with its owner, an editor and a viewer, and a blank book the owner laid down over MCP. */
async function journeyWithBook() {
  const { user: owner } = await makeUser(orm);
  const { user: editor } = await makeUser(orm);
  const { user: viewer } = await makeUser(orm);
  const journey = await makeJourney(orm, owner.id);
  await addJourneyContributor(orm, journey.id, editor.id, 'editor');
  await addJourneyContributor(orm, journey.id, viewer.id, 'viewer');
  const created = bookWriteResultSchema.parse(await callTool(owner.id, 'create_book', { journeyId: journey.id }));
  const inner = created.pages.find((p) => p.role === 'inner')?.id ?? 'no inner page';
  sent();
  return { owner, editor, viewer, journey, inner, everyone: [owner.id, editor.id, viewer.id].sort((a, b) => a - b) };
}

describe('Studio book over MCP and REST', () => {
  it('JBE2E-001: an MCP write is what GET reads next, and a viewer is refused in the words a tool answers', async () => {
    const { editor, viewer, journey, inner } = await journeyWithBook();

    const edited = bookWriteResultSchema.parse(
      await callTool(editor.id, 'edit_book_page', {
        journeyId: journey.id,
        spreadId: inner,
        ops: [{ op: 'background', color: '#123456' }],
      }),
    );
    const res = await request(app.getHttpServer())
      .get(`/api/journeys/${journey.id}/book`)
      .set('Cookie', authCookie(viewer.id));

    expect(res.status).toBe(200);
    expect(res.body.book.version).toBe(edited.version);
    expect(res.body.book.document.spreads[2].background).toBe('#123456');
    expect(
      await callTool(viewer.id, 'edit_book_page', {
        journeyId: journey.id,
        spreadId: inner,
        ops: [{ op: 'background', color: null }],
      }),
    ).toEqual({ error: "You can read this journey's book but not change it: only its owner and editors can." });
  });

  it('JBE2E-002: a REST save and an MCP write send the same event to the same users, REST leaving out its tab', async () => {
    const { owner, journey, inner, everyone } = await journeyWithBook();
    const before = await request(app.getHttpServer())
      .get(`/api/journeys/${journey.id}/book`)
      .set('Cookie', authCookie(owner.id));

    const saved = await request(app.getHttpServer())
      .put(`/api/journeys/${journey.id}/book`)
      .set('Cookie', authCookie(owner.id))
      .set('X-Socket-Id', 'sock-rest')
      .send({ title: before.body.book.title, document: before.body.book.document, baseVersion: 1 });
    expect(saved.status).toBe(200);
    expect(sent()).toEqual(everyone.map((id) => [id, 'journey:book:saved', 'sock-rest']));

    const paper = [{ op: 'background', color: '#fafafa' }];
    await callTool(owner.id, 'edit_book_page', { journeyId: journey.id, spreadId: inner, ops: paper });
    expect(sent()).toEqual(everyone.map((id) => [id, 'journey:book:saved', undefined]));
  });

  it('JBE2E-004: an operation the engine refuses reaches the client as the tool error naming it, and nothing is written', async () => {
    const { owner, journey, inner } = await journeyWithBook();

    const refused = await callTool(owner.id, 'edit_book_page', {
      journeyId: journey.id,
      spreadId: inner,
      ops: [
        { op: 'background', color: '#101010' },
        { op: 'place_photo', photoId: 987654, target: 'new' },
      ],
    });

    expect(refused).toEqual({ error: "ops[1]: photo 987654 is not in this journey's gallery" });
    expect(sent()).toEqual([]);
    const res = await request(app.getHttpServer())
      .get(`/api/journeys/${journey.id}/book`)
      .set('Cookie', authCookie(owner.id));
    expect([res.body.book.version, res.body.book.document.spreads[2].background]).toEqual([1, null]);
  });

  it('JBE2E-003: the book tools are gone while the Journey addon is off', async () => {
    const { user } = await makeUser(orm);
    await setAddonEnabled(orm, ADDON_IDS.JOURNEY, false);
    const names = await session(
      user.id,
      () => true,
      async (client) => (await client.listTools()).tools.map((tool) => tool.name),
    );
    expect(names.filter((name) => BOOK_TOOLS.includes(name))).toEqual([]);
    expect(names.length).toBeGreaterThan(0);
  });

  it('JBE2E-005: a book a newer Studio saved refuses a REST save with 409 and its code, and an MCP write in its words', async () => {
    const { owner, journey, inner } = await journeyWithBook();
    const before = await request(app.getHttpServer())
      .get(`/api/journeys/${journey.id}/book`)
      .set('Cookie', authCookie(owner.id));
    const row = await findRow(orm, JourneyBooks, { journey: journey.id });
    const newer = JSON.stringify({ ...JSON.parse(String(row?.document)), schemaRev: 2 });
    await updateRows(orm, JourneyBooks, { journey: journey.id }, { document: newer });

    const saved = await request(app.getHttpServer())
      .put(`/api/journeys/${journey.id}/book`)
      .set('Cookie', authCookie(owner.id))
      .send({ title: before.body.book.title, document: before.body.book.document, baseVersion: 1 });
    expect(saved.status).toBe(409);
    expect(saved.body).toEqual({
      error: 'Book was saved by a newer version of TREK Studio',
      code: 'book_schema_newer',
      schemaRev: 2,
    });

    const tool = await callTool(owner.id, 'edit_book_page', {
      journeyId: journey.id,
      spreadId: inner,
      ops: [{ op: 'background', color: '#202020' }],
    });
    expect(tool).toEqual({
      error:
        'This book was saved by a newer version of TREK than this server runs. Changing it here would drop what that version added, so it stays as it is.',
    });
    expect(sent()).toEqual([]);
    const after = await findRow(orm, JourneyBooks, { journey: journey.id });
    expect([after?.version, after?.document]).toEqual([1, newer]);
  });

  it('JBE2E-006: a save of a book a newer Studio wrote, with a kind this one cannot read, is a 409 with its code, not a 400', async () => {
    const { owner, journey } = await journeyWithBook();
    const before = await request(app.getHttpServer())
      .get(`/api/journeys/${journey.id}/book`)
      .set('Cookie', authCookie(owner.id));
    const document = before.body.book.document as { spreads: Array<{ elements: unknown[] }> };
    const frame = { x: 10, y: 10, w: 40, h: 40 };
    document.spreads[0]?.elements.push({ id: 'from-later', kind: 'sticker', frame, stickerId: 'lemon' });

    const saved = await request(app.getHttpServer())
      .put(`/api/journeys/${journey.id}/book`)
      .set('Cookie', authCookie(owner.id))
      .send({ title: before.body.book.title, document: { ...document, schemaRev: 2 }, baseVersion: 1 });
    expect(saved.status).toBe(409);
    expect(saved.body).toEqual({
      error: 'Book was saved by a newer version of TREK Studio',
      code: 'book_schema_newer',
      schemaRev: 2,
    });
    expect(sent()).toEqual([]);
    const after = await findRow(orm, JourneyBooks, { journey: journey.id });
    expect(after?.version).toBe(1);
  });
});
