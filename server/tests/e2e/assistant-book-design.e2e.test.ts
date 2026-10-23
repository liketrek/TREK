/**
 * The whole-book design through the Studio's chat, end to end: the whole app
 * (buildApp, every global guard, the Zod pipe, the response contracts, the
 * real MCP registry, the real agent, cards and undo) with an instance
 * connection of kind `custom` pointing at a fake OpenAI-compatible server on
 * loopback, scripted per case. The model designs the book with design_book
 * and proposes the draft it read there with apply_book_design, as a model
 * following the Studio's instructions does.
 *
 * Covered: the draft drawn as a card beside design_book's answer and the
 * apply held with the same plan on its bookDesign card, nothing written; the
 * approval writing it in one change that the book route reads back page by
 * page as the draft route served it, a revision kept, the receipt naming it;
 * the normal undo putting the book back exactly as it was, once, and
 * answering stale (409) once the Studio saved the book since. Rights: an
 * outsider meets the journey's 404 on every route of its assistant and on the
 * draft, a member cannot decide on someone else's conversation, a viewer is
 * offered no write of the book and gets none held, and an apply held for an
 * editor who became a viewer fails without writing.
 *
 * The design tools themselves over MCP and REST (selection, broadcast to
 * every member, the addon gate) are JBDSNE2E's.
 */
import { buildApp } from '../../src/bootstrap';
import { JourneyBookRevisions } from '../../src/db/entities/JourneyBookRevisions.entity';
import { JourneyContributors } from '../../src/db/entities/JourneyContributors.entity';
import { withRequestContext } from '../../src/nest/database/request-context';
import { JourneyBookEditService } from '../../src/nest/journey/journey-book-edit.service';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../helpers/factories/journeys';
import { countRows, findRow, updateRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import {
  bookDesignApplyResultSchema,
  bookDesignDraftResponseSchema,
  type BookDesignCard,
  type BookDocument,
  type BookRecord,
  type UiStreamChunk,
} from '@trek/shared';

import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// ── The fake provider ─────────────────────────────────────────────────────────

interface ChatBody {
  model: string;
  messages: Array<{ role: string; content: string | null; tool_call_id?: string }>;
  tools?: Array<{ function: { name: string; parameters: { properties?: Record<string, unknown> } } }>;
}

type Step = (body: ChatBody) => { chunks: object[] };

const provider = { requests: [] as ChatBody[], script: [] as Step[] };

const say =
  (text: string): Step =>
  () => ({
    chunks: [
      { choices: [{ index: 0, delta: { content: text } }] },
      { choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] },
      { choices: [], usage: { prompt_tokens: 12, completion_tokens: 4 } },
    ],
  });

const callTools =
  (...calls: Array<{ id: string; name: string; args: Record<string, unknown> }>): Step =>
  () => ({
    chunks: [
      {
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: calls.map((call, index) => ({
                index,
                id: call.id,
                type: 'function',
                function: { name: call.name, arguments: JSON.stringify(call.args) },
              })),
            },
          },
        ],
      },
      { choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] },
    ],
  });

const callTool = (id: string, name: string, args: Record<string, unknown>): Step => callTools({ id, name, args });

/** The model proposes the draft its design_book call answered, by the design_id it read in that answer. */
const applyDraft =
  (designCallId: string, id: string): Step =>
  (body) => {
    const answer = body.messages.find((message) => message.tool_call_id === designCallId)?.content ?? '';
    const designId = /"design_id":"([\w-]+)"/.exec(answer)?.[1] ?? 'd-unseen';
    return callTool(id, 'apply_book_design', { designId })(body);
  };

async function readBody(req: IncomingMessage): Promise<string> {
  let text = '';
  for await (const chunk of req) text += String(chunk);
  return text;
}

async function answer(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'GET' && req.url?.startsWith('/api/tags')) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ models: [{ name: 'fake-model', size: 1 }] }));
    return;
  }
  if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
    res.writeHead(404).end();
    return;
  }
  const body = JSON.parse(await readBody(req)) as ChatBody;
  provider.requests.push(body);
  const reply = (provider.script.shift() ?? say('Nothing more.'))(body);
  if (res.destroyed) return;
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  for (const chunk of reply.chunks) res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  res.end('data: [DONE]\n\n');
}

// ── The app ──────────────────────────────────────────────────────────────────

let nestApp: INestApplication;
let orm: MikroORM;
let fake: HttpServer;
let books: JourneyBookEditService;
let broadcasts: RealtimeSpies;

beforeAll(async () => {
  fake = createServer((req, res) => {
    answer(req, res).catch(() => res.destroy());
  });
  await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
  books = nestApp.get(JourneyBookEditService);
  broadcasts = spyOnRealtime(nestApp);
  await setAddonEnabled(orm, 'ai_assistant', true);
  await setAddonEnabled(orm, 'journey', true);
  const adminId = (await makeUser(orm, { role: 'admin' })).user.id;
  const { port } = fake.address() as AddressInfo;
  const res = await request(nestApp.getHttpServer())
    .put('/api/admin/ai/connection')
    .set('Cookie', sessionCookie(adminId))
    .send({ kind: 'custom', baseUrl: `http://127.0.0.1:${port}/v1`, model: 'fake-model' });
  expect(res.status).toBe(200);
});

beforeEach(async () => {
  await resetRateLimits(nestApp);
  provider.requests = [];
  provider.script = [];
  broadcasts.broadcastToUser.mockClear();
});

afterAll(async () => {
  await nestApp.close();
  await new Promise<void>((resolve) => fake.close(() => resolve()));
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const CTX = { locale: 'en', timeZone: 'Europe/Lisbon' };

interface Answer {
  status: number;
  chunks: UiStreamChunk[];
  json: Record<string, unknown> | null;
}

async function post(path: string, userId: number, body: object): Promise<Answer> {
  const res = await request(nestApp.getHttpServer())
    .post(path)
    .set('Cookie', sessionCookie(userId))
    .send(body)
    .buffer(true)
    .parse((stream, done) => {
      let text = '';
      stream.setEncoding('utf8');
      stream.on('data', (chunk: string) => (text += chunk));
      stream.on('end', () => done(null, text));
    });
  const text = res.body as string;
  if (!String(res.headers['content-type']).includes('text/event-stream')) {
    return { status: res.status, chunks: [], json: text ? (JSON.parse(text) as Record<string, unknown>) : null };
  }
  const events = text
    .split('\n\n')
    .filter((event) => event.startsWith('data: '))
    .map((event) => event.slice('data: '.length));
  return {
    status: res.status,
    chunks: events.filter((event) => event !== '[DONE]').map((event) => JSON.parse(event) as UiStreamChunk),
    json: null,
  };
}

function get(path: string, userId: number) {
  return request(nestApp.getHttpServer()).get(path).set('Cookie', sessionCookie(userId));
}

function undo(base: string, userId: number, toolCallId: string) {
  return request(nestApp.getHttpServer())
    .post(`${base}/tool-calls/${toolCallId}/undo`)
    .set('Cookie', sessionCookie(userId))
    .send({});
}

const ofType = <T extends UiStreamChunk['type']>(chunks: UiStreamChunk[], type: T) =>
  chunks.filter((chunk): chunk is Extract<UiStreamChunk, { type: T }> => chunk.type === type);

const toolNames = (body: ChatBody | undefined) => (body?.tools ?? []).map((tool) => tool.function.name);

/** The book's writes a viewer is never offered: the design's apply and its undo, and the book-level changes. */
const BOOK_WRITES = [
  'apply_book_design',
  'restore_book_revision',
  'set_book_setup',
  'duplicate_book_page',
  'save_book_layout',
  'remove_book_layout',
  'restore_book_layout',
  'edit_book_page',
];

/** What an apply answered that the test reads back. */
const APPLIED = bookDesignApplyResultSchema.pick({ version: true, revision_id: true, applied: true });

/**
 * A journey with two written entries, its owner, and a blank book in it as
 * created (version 1). The broadcasts are counted from there on.
 */
async function journeyWithBook() {
  const { user } = await makeUser(orm);
  const journey = await makeJourney(orm, user.id, { title: 'Lisbon' });
  await makeJourneyEntry(orm, journey.id, user.id, { title: 'Alfama', story: 'Trams.', entry_date: '2026-05-02' });
  await makeJourneyEntry(orm, journey.id, user.id, { title: 'Belem', story: 'Pasteis.', entry_date: '2026-05-03' });
  // A service called from the test, not through a route, needs the request context a route gets.
  const created = await withRequestContext(orm, () => books.createBook(journey.id, user.id, {}));
  broadcasts.broadcastToUser.mockClear();
  return { ownerId: user.id, journeyId: journey.id, created, base: `/api/journeys/${journey.id}/assistant` };
}

/** The book as the Studio reads it. */
async function bookOf(journeyId: number, userId: number): Promise<BookRecord> {
  const res = await get(`/api/journeys/${journeyId}/book`, userId);
  expect(res.status).toBe(200);
  return res.body.book as BookRecord;
}

/** The whole-book design card a stream drew for one call; null when it drew none. */
function designCardOf(chunks: UiStreamChunk[], toolCallId: string): BookDesignCard | null {
  const card = ofType(chunks, 'data-trek-card').find((part) => part.data.toolCallId === toolCallId)?.data.card;
  return card?.kind === 'bookDesign' ? card : null;
}

/** The card the held change shows; null when it has none of the whole-book design. */
function proposedCardOf(chunks: UiStreamChunk[]): BookDesignCard | null {
  const card = ofType(chunks, 'data-trek-change')[0]?.data.card;
  return card?.kind === 'bookDesign' ? card : null;
}

/**
 * A turn of `userId` in which the model designs the whole book in the classic
 * style and proposes the draft: design_book runs, apply_book_design is held.
 */
async function designTurn(base: string, userId: number) {
  provider.script = [
    callTool('call_design', 'design_book', { directives: { style: 'classic' } }),
    applyDraft('call_design', 'call_apply'),
  ];
  const turn = await post(`${base}/chat`, userId, { ...CTX, threadId: null, text: 'Design the whole book' });
  expect(turn.status).toBe(200);
  const [held] = ofType(turn.chunks, 'tool-approval-request');
  expect(held).toBeDefined();
  const threadId = ofType(turn.chunks, 'data-trek-thread')[0]?.data.threadId ?? 0;
  return { chunks: turn.chunks, heldId: held?.toolCallId ?? '', threadId };
}

/** Approves the held changes and answers what the model says next. */
function approve(base: string, userId: number, threadId: number, toolCallId: string) {
  provider.script = [say('The book is designed.')];
  return post(`${base}/threads/${threadId}/decisions`, userId, {
    ...CTX,
    decisions: [{ toolCallId, approved: true }],
  });
}

/** How often `userId`'s tabs were told the book was saved. */
const savedTo = (userId: number) =>
  broadcasts.broadcastToUser.mock.calls.filter(
    ([to, msg]) => to === userId && String(msg.type) === 'journey:book:saved',
  ).length;

/** The elements of the named pages, by id, as a document holds them; null for a page it lacks. */
const elementsOf = (doc: BookDocument, spreadIds: readonly string[]) =>
  spreadIds.map((id) => doc.spreads.find((spread) => spread.id === id)?.elements.map((el) => el.id) ?? null);

const revisionsOf = (journeyId: number) => countRows(orm, JourneyBookRevisions, { journey: journeyId });

// ── Cases ────────────────────────────────────────────────────────────────────

describe('the whole-book design through the Studio chat', () => {
  it('ASTDSNE2E-001: the draft is held with its card, applied with a revision, read back and undone once', async () => {
    const j = await journeyWithBook();
    const before = await bookOf(j.journeyId, j.ownerId);
    const turn = await designTurn(j.base, j.ownerId);

    // The design's tools are offered; the apply takes the draft alone, never a version; the restore is the undo's.
    const offered = provider.requests[0]?.tools ?? [];
    const names = toolNames(provider.requests[0]);
    const designTools = ['design_book', 'get_book_design', 'revise_book_design', 'apply_book_design'];
    expect(names).toEqual(expect.arrayContaining(designTools));
    expect(names).not.toContain('restore_book_revision');
    const apply = offered.find((tool) => tool.function.name === 'apply_book_design');
    expect(Object.keys(apply?.function.parameters.properties ?? {})).toEqual(['designId']);

    // The draft beside design_book's answer, and the same draft on the held apply; nothing written yet.
    const drafted = designCardOf(turn.chunks, 'call_design');
    expect(drafted).toMatchObject({ change: 'none', journeyId: j.journeyId, baseVersion: 1, style: 'classic' });
    const designId = drafted?.designId ?? '';
    expect(drafted?.spreads.length).toBeGreaterThan(0);
    const [change] = ofType(turn.chunks, 'data-trek-change');
    expect(change?.data).toMatchObject({ verbKey: 'designBook', undoable: true });
    const proposed = proposedCardOf(turn.chunks);
    expect(proposed).toMatchObject({ change: 'proposed', journeyId: j.journeyId, designId, baseVersion: 1 });
    expect(proposed?.spreads).toEqual(drafted?.spreads);
    expect(turn.chunks.at(-1)).toEqual({ type: 'finish', finishReason: 'tool-calls' });
    expect((await bookOf(j.journeyId, j.ownerId)).version).toBe(1);
    expect(await revisionsOf(j.journeyId)).toBe(0);

    // The card draws its pages from the draft route.
    const route = await get(`/api/journeys/${j.journeyId}/book-designs/${designId}`, j.ownerId);
    expect(route.status).toBe(200);
    const draft = bookDesignDraftResponseSchema.parse(route.body);
    expect(draft.selection.length).toBeGreaterThan(0);

    const decided = await approve(j.base, j.ownerId, turn.threadId, turn.heldId);
    expect(decided.status).toBe(200);
    const [ran] = ofType(decided.chunks, 'tool-output-available');
    expect(ran?.toolCallId).toBe(turn.heldId);
    const applied = APPLIED.parse(ran?.output);
    expect(applied.version).toBe(2);
    expect(applied.applied).toEqual(draft.selection);
    expect(designCardOf(decided.chunks, turn.heldId)).toMatchObject({
      change: 'applied',
      designId,
      baseVersion: 2,
      revisionId: applied.revision_id,
    });
    const toModel = (provider.requests.at(-1)?.messages ?? []).filter((message) => message.role === 'tool');
    expect(toModel.some((message) => message.content?.includes(`"revision_id":${applied.revision_id}`))).toBe(true);
    expect(savedTo(j.ownerId)).toBe(1);

    // The book reads back the designed pages, and the book as it was is kept as the revision.
    const designed = await bookOf(j.journeyId, j.ownerId);
    expect(designed.version).toBe(2);
    expect(elementsOf(designed.document, applied.applied)).toEqual(elementsOf(draft.document, applied.applied));
    expect(await revisionsOf(j.journeyId)).toBe(1);
    expect(await findRow(orm, JourneyBookRevisions, { id: applied.revision_id ?? 0 })).toMatchObject({ version: 1 });

    // The normal undo puts the book back as it was, in one write, and only once.
    broadcasts.broadcastToUser.mockClear();
    const undone = await undo(j.base, j.ownerId, turn.heldId);
    expect([undone.status, undone.body]).toEqual([200, { undone: true }]);
    const restored = await bookOf(j.journeyId, j.ownerId);
    expect(restored.version).toBe(3);
    expect(restored.document).toEqual(before.document);
    expect(restored.document.spreads.map((spread) => spread.id)).toEqual(j.created.spread_ids);
    expect(savedTo(j.ownerId)).toBe(1);
    const again = await undo(j.base, j.ownerId, turn.heldId);
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ code: 'stale' });
    expect((await bookOf(j.journeyId, j.ownerId)).version).toBe(3);
  });

  it('ASTDSNE2E-002: the undo answers stale once the Studio saved the book since, and the save stays', async () => {
    const j = await journeyWithBook();
    const turn = await designTurn(j.base, j.ownerId);
    expect((await approve(j.base, j.ownerId, turn.threadId, turn.heldId)).status).toBe(200);
    const designed = await bookOf(j.journeyId, j.ownerId);
    expect(designed.version).toBe(2);

    // The Studio saves the designed book under a new title, against the version it read.
    const saved = await request(nestApp.getHttpServer())
      .put(`/api/journeys/${j.journeyId}/book`)
      .set('Cookie', sessionCookie(j.ownerId))
      .send({ title: 'Lisbon, revised', document: designed.document, baseVersion: designed.version });
    expect(saved.status).toBe(200);

    const stale = await undo(j.base, j.ownerId, turn.heldId);
    expect(stale.status).toBe(409);
    expect(stale.body).toMatchObject({ code: 'stale' });
    const after = await bookOf(j.journeyId, j.ownerId);
    expect([after.version, after.title]).toEqual([3, 'Lisbon, revised']);
    expect(after.document).toEqual(designed.document);
    expect(await revisionsOf(j.journeyId)).toBe(1);
  });

  it('ASTDSNE2E-003: an outsider gets 404 on every assistant route, a member cannot decide for the owner', async () => {
    const j = await journeyWithBook();
    const { user: stranger } = await makeUser(orm);
    const { user: editor } = await makeUser(orm);
    await addJourneyContributor(orm, j.journeyId, editor.id, 'editor');
    const turn = await designTurn(j.base, j.ownerId);
    const designId = designCardOf(turn.chunks, 'call_design')?.designId ?? 'd-none';
    const decisions = { ...CTX, decisions: [{ toolCallId: turn.heldId, approved: true }] };

    const asStranger = [
      await get(`${j.base}/threads`, stranger.id),
      await get(`${j.base}/threads/${turn.threadId}`, stranger.id),
      await request(nestApp.getHttpServer())
        .post(`${j.base}/threads/${turn.threadId}/decisions`)
        .set('Cookie', sessionCookie(stranger.id))
        .send(decisions),
      await undo(j.base, stranger.id, turn.heldId),
    ];
    for (const res of asStranger) expect([res.status, res.body]).toEqual([404, { error: 'Journey not found' }]);
    expect((await get(`/api/journeys/${j.journeyId}/book-designs/${designId}`, stranger.id)).status).toBe(404);

    // A member of the journey reaches the assistant, but not the owner's conversation or its change.
    const foreign = await post(`${j.base}/threads/${turn.threadId}/decisions`, editor.id, decisions);
    expect(foreign).toMatchObject({ status: 404, json: { code: 'not_found' } });
    expect((await undo(j.base, editor.id, turn.heldId)).status).toBe(404);
    expect((await bookOf(j.journeyId, j.ownerId)).version).toBe(1);
    expect(provider.requests).toHaveLength(2);

    // None of it took the change from its owner: the approval still applies it.
    const decided = await approve(j.base, j.ownerId, turn.threadId, turn.heldId);
    expect(ofType(decided.chunks, 'tool-output-available').map((part) => part.toolCallId)).toEqual([turn.heldId]);
    expect((await bookOf(j.journeyId, j.ownerId)).version).toBe(2);
  });

  it('ASTDSNE2E-004: a viewer is offered no book write, and a design or apply asked anyway is not held', async () => {
    const j = await journeyWithBook();
    const { user: viewer } = await makeUser(orm);
    await addJourneyContributor(orm, j.journeyId, viewer.id, 'viewer');
    provider.script = [
      callTools(
        { id: 'call_design', name: 'design_book', args: {} },
        { id: 'call_apply', name: 'apply_book_design', args: { designId: 'd-forged' } },
      ),
      say('I can only read this book.'),
    ];
    const turn = await post(`${j.base}/chat`, viewer.id, { ...CTX, threadId: null, text: 'Design the whole book' });
    expect(turn.status).toBe(200);

    const names = toolNames(provider.requests[0]);
    expect(names).toContain('get_book');
    for (const name of BOOK_WRITES) expect(names, name).not.toContain(name);
    // The design's reads go only to someone who may change the book, like its writes.
    for (const name of ['design_book', 'get_book_design', 'revise_book_design'])
      expect(names, name).not.toContain(name);
    const refused = ofType(turn.chunks, 'tool-output-error');
    expect(refused.map((part) => part.toolCallId)).toEqual(['call_design', 'call_apply']);
    expect(refused[0]?.errorText).toBe('Unknown tool: design_book');
    expect(refused[1]?.errorText).toBe('Unknown tool: apply_book_design');
    expect(ofType(turn.chunks, 'tool-approval-request')).toEqual([]);
    expect(ofType(turn.chunks, 'data-trek-change')).toEqual([]);
    expect(designCardOf(turn.chunks, 'call_design')).toBeNull();
    expect((await bookOf(j.journeyId, j.ownerId)).version).toBe(1);
  });

  it('ASTDSNE2E-005: an apply held for an editor fails once they are a viewer, and writes nothing', async () => {
    const j = await journeyWithBook();
    const { user: editor } = await makeUser(orm);
    await addJourneyContributor(orm, j.journeyId, editor.id, 'editor');
    const turn = await designTurn(j.base, editor.id);
    expect(proposedCardOf(turn.chunks)).toMatchObject({ change: 'proposed', journeyId: j.journeyId });
    await updateRows(orm, JourneyContributors, { journey: j.journeyId, user: editor.id }, { role: 'viewer' });

    provider.script = [say('That did not go through.')];
    const decided = await post(`${j.base}/threads/${turn.threadId}/decisions`, editor.id, {
      ...CTX,
      decisions: [{ toolCallId: turn.heldId, approved: true }],
    });
    expect(decided.status).toBe(200);
    expect(ofType(decided.chunks, 'tool-output-error')).toEqual([
      { type: 'tool-output-error', toolCallId: turn.heldId, errorText: expect.stringContaining('Unknown tool') },
    ]);
    expect(ofType(decided.chunks, 'tool-output-available')).toEqual([]);
    expect(designCardOf(decided.chunks, turn.heldId)).toBeNull();
    expect((await bookOf(j.journeyId, j.ownerId)).version).toBe(1);
    expect(await revisionsOf(j.journeyId)).toBe(0);
    expect(savedTo(j.ownerId)).toBe(0);

    // A change that never ran has nothing to take back.
    const stale = await undo(j.base, editor.id, turn.heldId);
    expect(stale.status).toBe(409);
    expect(stale.body).toMatchObject({ code: 'stale' });
  });
});
