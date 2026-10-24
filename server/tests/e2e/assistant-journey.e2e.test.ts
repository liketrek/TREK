/**
 * The assistant in TREK Studio, end to end: the whole app (buildApp, every
 * global guard, the Zod pipe, the response contracts, the real MCP registry)
 * with an instance connection of kind `custom` pointing at a fake
 * OpenAI-compatible server on loopback, scripted per case.
 *
 * Covered: the gates before anything runs (the AI addon, auth, the journey
 * addon, the journey itself), a journey without trips holding a conversation
 * of its own that a trip's routes never reach, the Studio's instructions and
 * book card reaching the model with the book's tools and nothing of a trip, a
 * book change held, applied with the user's rights and broadcast to every tab,
 * a viewer offered no write at all, and the threads going with their journey.
 * Also: the entries read drawing its card although the journey id is hidden, a
 * trip tool refused rather than held, a change held for an editor failing once
 * they are a viewer, and a new book, which has no undo.
 */
import { buildApp } from '../../src/bootstrap';
import { AssistantThreads } from '../../src/db/entities/AssistantThreads.entity';
import { JourneyBooks } from '../../src/db/entities/JourneyBooks.entity';
import { JourneyContributors } from '../../src/db/entities/JourneyContributors.entity';
import { Journeys } from '../../src/db/entities/Journeys.entity';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../helpers/factories/journeys';
import { countRows, deleteRows, findRow, updateRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import type { UiStreamChunk } from '@trek/shared';

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

const callTool =
  (id: string, name: string, args: Record<string, unknown>): Step =>
  () => ({
    chunks: [
      {
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [{ index: 0, id, type: 'function', function: { name, arguments: JSON.stringify(args) } }],
            },
          },
        ],
      },
      { choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] },
    ],
  });

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
let broadcasts: RealtimeSpies;

beforeAll(async () => {
  fake = createServer((req, res) => {
    answer(req, res).catch(() => res.destroy());
  });
  await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
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

async function post(path: string, userId: number | null, body: object): Promise<Answer> {
  const base = request(nestApp.getHttpServer()).post(path);
  const req = (userId === null ? base : base.set('Cookie', sessionCookie(userId))).send(body);
  const res = await req.buffer(true).parse((stream, done) => {
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

const ofType = <T extends UiStreamChunk['type']>(chunks: UiStreamChunk[], type: T) =>
  chunks.filter((chunk): chunk is Extract<UiStreamChunk, { type: T }> => chunk.type === type);

/** A user with a journey of their own, without any trip, and one entry in it. */
async function ownerWithJourney() {
  const { user } = await makeUser(orm);
  const journey = await makeJourney(orm, user.id, { title: 'Portugal by train' });
  await makeJourneyEntry(orm, journey.id, user.id, { title: 'Alfama', location_name: 'Lisbon' });
  return { userId: user.id, journeyId: journey.id, base: `/api/journeys/${journey.id}/assistant` };
}

const toolNames = (body: ChatBody) => (body.tools ?? []).map((tool) => tool.function.name);

// ── Cases ────────────────────────────────────────────────────────────────────

describe('Studio assistant e2e', () => {
  it('ASTJE2E-001: the AI addon, auth, the journey addon and the journey come before anything else', async () => {
    const j = await ownerWithJourney();
    const { user: stranger } = await makeUser(orm);
    await setAddonEnabled(orm, 'ai_assistant', false);
    expect((await get(`${j.base}/threads`, j.userId)).status).toBe(404);
    await setAddonEnabled(orm, 'ai_assistant', true);
    expect((await request(nestApp.getHttpServer()).get(`${j.base}/threads`)).status).toBe(401);
    await setAddonEnabled(orm, 'journey', false);
    try {
      const off = await get(`${j.base}/threads`, j.userId);
      expect(off.status).toBe(404);
      expect(off.body).toEqual({ error: 'Journey addon is not enabled' });
    } finally {
      await setAddonEnabled(orm, 'journey', true);
    }
    const outsider = await get(`${j.base}/threads`, stranger.id);
    expect(outsider.status).toBe(404);
    expect(outsider.body).toEqual({ error: 'Journey not found' });
    expect((await get('/api/journeys/abc/assistant/threads', j.userId)).status).toBe(404);
    // The outsider is turned away before the body is read, like on a trip.
    expect((await post(`${j.base}/chat`, stranger.id, { ...CTX, threadId: null, text: '' })).status).toBe(404);
    expect((await post(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: '' })).status).toBe(400);
    expect(provider.requests).toHaveLength(0);
  });

  it('ASTJE2E-002: a journey without trips gets a conversation of its own, with the Studio instructions, the book card and the book tools', async () => {
    const j = await ownerWithJourney();
    provider.script = [say('Let us start with the cover.')];
    const turn = await post(`${j.base}/chat`, j.userId, {
      ...CTX,
      threadId: null,
      text: 'Make me a book',
      focus: { spreadId: 'sp-nothing', elementIds: ['p-1'] },
    });
    expect(turn.status).toBe(200);
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    expect(await countRows(orm, AssistantThreads, { id: threadId, journey: j.journeyId, trip: null })).toBe(1);

    const sent = JSON.stringify(provider.requests[0].messages);
    expect(sent).toContain('TREK Studio');
    expect(sent).toContain('<book_card>');
    expect(sent).toContain('Journey: Portugal by train');
    expect(sent).toContain('Alfama');
    expect(sent).toContain('Gallery: no photos yet.');
    expect(sent).not.toContain('<trip_card>');
    const names = toolNames(provider.requests[0]);
    expect(names).toEqual(expect.arrayContaining(['get_book', 'describe_book_page', 'create_book', 'edit_book_page']));
    const notHere = ['get_trip_summary', 'create_place', 'remember_for_trip', 'use_addon_tools', 'restore_book_page'];
    for (const name of notHere) expect(names, name).not.toContain(name);
    for (const tool of provider.requests[0].tools ?? []) {
      expect(Object.keys(tool.function.parameters.properties ?? {}), tool.function.name).not.toContain('journeyId');
    }

    const list = await get(`${j.base}/threads`, j.userId);
    expect(list.status).toBe(200);
    expect(list.body.threads).toEqual([expect.objectContaining({ id: threadId, title: 'Make me a book' })]);
    const shown = await get(`${j.base}/threads/${threadId}`, j.userId);
    expect(shown.status).toBe(200);
    expect(shown.body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant']);
  });

  it('ASTJE2E-003: a book change is held, applied with the user rights, broadcast to every tab, and the turn goes on', async () => {
    const j = await ownerWithJourney();
    provider.script = [callTool('call_book', 'create_book', { title: 'Portugal' })];
    const turn = await post(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Start a book' });
    expect(turn.chunks.at(-1)).toEqual({ type: 'finish', finishReason: 'tool-calls' });
    const [held] = ofType(turn.chunks, 'tool-approval-request');
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    expect(await findRow(orm, JourneyBooks, { journey: j.journeyId })).toBeNull();

    provider.script = [say('The book is there.')];
    const decided = await post(`${j.base}/threads/${threadId}/decisions`, j.userId, {
      ...CTX,
      decisions: [{ toolCallId: held.toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    expect(ofType(decided.chunks, 'tool-output-available')).toHaveLength(1);
    expect(await findRow(orm, JourneyBooks, { journey: j.journeyId })).not.toBeNull();
    expect(broadcasts.broadcastToUser).toHaveBeenCalledWith(
      j.userId,
      expect.objectContaining({ type: 'journey:book:saved', journeyId: j.journeyId }),
      undefined,
    );
    expect(provider.requests.at(-1)?.messages.some((message) => message.role === 'tool')).toBe(true);
  });

  it('ASTJE2E-004: a viewer may talk about the journey, and is offered the reads and not one write', async () => {
    const j = await ownerWithJourney();
    const { user: viewer } = await makeUser(orm);
    await addJourneyContributor(orm, j.journeyId, viewer.id, 'viewer');
    provider.script = [callTool('call_read', 'get_book', {}), say('There is no book yet.')];
    const turn = await post(`${j.base}/chat`, viewer.id, { ...CTX, threadId: null, text: 'What is in the book?' });
    expect(turn.status).toBe(200);
    expect(ofType(turn.chunks, 'tool-output-available')).toHaveLength(1);
    const names = toolNames(provider.requests[0]);
    expect(names).toEqual(expect.arrayContaining(['get_book', 'describe_book_page']));
    for (const name of ['create_book', 'add_book_pages', 'edit_book_page', 'delete_book_pages', 'set_book_cover']) {
      expect(names, name).not.toContain(name);
    }
    expect(JSON.stringify(provider.requests[0].messages)).toContain('Your role: viewer');
  });

  it('ASTJE2E-005: a journey conversation and a trip conversation never reach each other', async () => {
    const j = await ownerWithJourney();
    const trip = await makeTrip(orm, j.userId, { title: 'Kyoto' });
    provider.script = [say('journey'), say('trip')];
    const inJourney = await post(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'About the book' });
    const inTrip = await post(`/api/trips/${trip.id}/assistant/chat`, j.userId, {
      ...CTX,
      threadId: null,
      text: 'About Kyoto',
    });
    const journeyThread = ofType(inJourney.chunks, 'data-trek-thread')[0].data.threadId;
    const tripThread = ofType(inTrip.chunks, 'data-trek-thread')[0].data.threadId;
    expect(JSON.stringify(provider.requests[1].messages)).toContain('<trip_card>');

    const tripList = await get(`/api/trips/${trip.id}/assistant/threads`, j.userId);
    expect(tripList.body.threads.map((thread: { id: number }) => thread.id)).toEqual([tripThread]);
    const journeyList = await get(`${j.base}/threads`, j.userId);
    expect(journeyList.body.threads.map((thread: { id: number }) => thread.id)).toEqual([journeyThread]);
    expect((await get(`${j.base}/threads/${tripThread}`, j.userId)).status).toBe(404);
    expect((await get(`/api/trips/${trip.id}/assistant/threads/${journeyThread}`, j.userId)).status).toBe(404);
    const continued = await post(`${j.base}/chat`, j.userId, { ...CTX, threadId: tripThread, text: 'Go on' });
    expect(continued).toMatchObject({ status: 404, json: { code: 'not_found' } });
  });

  it('ASTJE2E-006: a thread is deleted by its owner only, and all go with the journey', async () => {
    const j = await ownerWithJourney();
    const { user: editor } = await makeUser(orm);
    await addJourneyContributor(orm, j.journeyId, editor.id, 'editor');
    provider.script = [say('one'), say('two')];
    const first = await post(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'First' });
    await post(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Second' });
    const threadId = ofType(first.chunks, 'data-trek-thread')[0].data.threadId;
    const remove = (userId: number) =>
      request(nestApp.getHttpServer()).delete(`${j.base}/threads/${threadId}`).set('Cookie', sessionCookie(userId));
    expect((await get(`${j.base}/threads/${threadId}`, editor.id)).status).toBe(404);
    expect((await remove(editor.id)).status).toBe(404);
    expect((await remove(j.userId)).status).toBe(200);
    expect((await get(`${j.base}/threads/${threadId}`, j.userId)).status).toBe(404);
    expect(await countRows(orm, AssistantThreads, { journey: j.journeyId })).toBe(1);
    await deleteRows(orm, Journeys, { id: j.journeyId });
    expect(await countRows(orm, AssistantThreads, { journey: j.journeyId })).toBe(0);
  });

  it('ASTJE2E-007: the entries read draws its card without the hidden journey id, and a trip tool is refused, not held', async () => {
    const j = await ownerWithJourney();
    provider.script = [
      callTool('call_entries', 'list_journey_entries', {}),
      callTool('call_note', 'remember_for_trip', { note: 'Travels by train' }),
      say('Here is the journal.'),
    ];
    const turn = await post(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'What did I write?' });
    expect(turn.status).toBe(200);
    const [card] = ofType(turn.chunks, 'data-trek-card');
    expect(card?.data).toMatchObject({
      toolCallId: 'call_entries',
      card: { kind: 'journeyEntries', journeyId: j.journeyId },
    });
    expect(ofType(turn.chunks, 'tool-output-error')).toEqual([
      { type: 'tool-output-error', toolCallId: 'call_note', errorText: 'Unknown tool: remember_for_trip' },
    ]);
    expect(ofType(turn.chunks, 'tool-approval-request')).toHaveLength(0);
  });

  it('ASTJE2E-008: a book change held for an editor fails once they are a viewer, and writes nothing', async () => {
    const j = await ownerWithJourney();
    const { user: editor } = await makeUser(orm);
    await addJourneyContributor(orm, j.journeyId, editor.id, 'editor');
    provider.script = [callTool('call_held', 'create_book', { title: 'Portugal' })];
    const turn = await post(`${j.base}/chat`, editor.id, { ...CTX, threadId: null, text: 'Start a book' });
    const [held] = ofType(turn.chunks, 'tool-approval-request');
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    await updateRows(orm, JourneyContributors, { journey: j.journeyId, user: editor.id }, { role: 'viewer' });

    provider.script = [say('That did not go through.')];
    const decided = await post(`${j.base}/threads/${threadId}/decisions`, editor.id, {
      ...CTX,
      decisions: [{ toolCallId: held.toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    expect(ofType(decided.chunks, 'tool-output-error')).toEqual([
      { type: 'tool-output-error', toolCallId: held.toolCallId, errorText: expect.stringContaining('Unknown tool') },
    ]);
    expect(ofType(decided.chunks, 'tool-output-available')).toHaveLength(0);
    expect(await findRow(orm, JourneyBooks, { journey: j.journeyId })).toBeNull();
  });

  it('ASTJE2E-009: a new book has no undo, and a trip conversation never reaches its change', async () => {
    const j = await ownerWithJourney();
    const trip = await makeTrip(orm, j.userId, { title: 'Kyoto' });
    provider.script = [callTool('call_undo', 'create_book', { title: 'Portugal' })];
    const turn = await post(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Start a book' });
    const [held] = ofType(turn.chunks, 'tool-approval-request');
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    provider.script = [say('The book is there.')];
    await post(`${j.base}/threads/${threadId}/decisions`, j.userId, {
      ...CTX,
      decisions: [{ toolCallId: held.toolCallId, approved: true }],
    });
    const undo = (base: string) =>
      request(nestApp.getHttpServer())
        .post(`${base}/tool-calls/${held.toolCallId}/undo`)
        .set('Cookie', sessionCookie(j.userId))
        .send({});
    const stale = await undo(j.base);
    expect(stale.status).toBe(409);
    expect(stale.body).toMatchObject({ code: 'stale' });
    expect((await undo(`/api/trips/${trip.id}/assistant`)).status).toBe(404);
    expect(await findRow(orm, JourneyBooks, { journey: j.journeyId })).not.toBeNull();
  });
});
