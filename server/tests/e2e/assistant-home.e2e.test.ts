/**
 * The assistant outside any one trip, end to end: the whole app (buildApp,
 * every global guard, the Zod pipe, the response contracts, the real MCP
 * registry) with an instance connection of kind `custom` pointing at a fake
 * OpenAI-compatible server on loopback, scripted per case.
 *
 * Covered: the gates before anything runs (the AI addon, auth, the body), a
 * home conversation of its own that the trip routes never reach and that
 * reaches no trip's, the home instructions and the card of the user's own
 * trips reaching the model with the reads and no trip write, a trip read by
 * its id with the user's rights, the way into a trip's chat shown as a card
 * for the user's own trip only, and a change that belongs to no trip (the
 * atlas) held and applied like any other, its undo reached only by its user.
 */
import { buildApp } from '../../src/bootstrap';
import { AssistantThreads } from '../../src/db/entities/AssistantThreads.entity';
import { VisitedCountries } from '../../src/db/entities/VisitedCountries.entity';
import { countRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
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

beforeAll(async () => {
  fake = createServer((req, res) => {
    answer(req, res).catch(() => res.destroy());
  });
  await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
  await setAddonEnabled(orm, 'ai_assistant', true);
  await setAddonEnabled(orm, 'atlas', true);
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
});

afterAll(async () => {
  await nestApp.close();
  await new Promise<void>((resolve) => fake.close(() => resolve()));
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const CTX = { locale: 'en', timeZone: 'Europe/Berlin' };

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

const BASE = '/api/assistant';

/** A user with two trips of their own, one dated and one not. */
async function ownerWithTrips() {
  const { user } = await makeUser(orm);
  const next = await makeTrip(orm, user.id, { title: 'Kyoto', start_date: '2099-04-01', end_date: '2099-04-08' });
  const later = await makeTrip(orm, user.id, { title: 'Someday Patagonia' });
  return { userId: user.id, nextId: next.id, laterId: later.id };
}

const toolNames = (body: ChatBody) => (body.tools ?? []).map((tool) => tool.function.name);

const threadOf = (answer: Answer) => ofType(answer.chunks, 'data-trek-thread')[0].data.threadId;

// ── Cases ────────────────────────────────────────────────────────────────────

describe('Home assistant e2e', () => {
  it('ASTHE2E-001: the AI addon, auth and the body come before anything else', async () => {
    const h = await ownerWithTrips();
    await setAddonEnabled(orm, 'ai_assistant', false);
    try {
      expect((await get(`${BASE}/threads`, h.userId)).status).toBe(404);
    } finally {
      await setAddonEnabled(orm, 'ai_assistant', true);
    }
    expect((await request(nestApp.getHttpServer()).get(`${BASE}/threads`)).status).toBe(401);
    expect((await post(`${BASE}/chat`, null, { ...CTX, threadId: null, text: 'Hi' })).status).toBe(401);
    expect((await post(`${BASE}/chat`, h.userId, { ...CTX, threadId: null, text: '' })).status).toBe(400);
    expect((await get(`${BASE}/threads/abc`, h.userId)).status).toBe(404);
    expect(provider.requests).toHaveLength(0);
  });

  it('ASTHE2E-002: a home conversation reads the user trips and offers the reads, the home steps and no trip write', async () => {
    const h = await ownerWithTrips();
    const { user: other } = await makeUser(orm);
    await makeTrip(orm, other.id, { title: 'Not yours' });
    provider.script = [say('Kyoto comes next.')];
    const turn = await post(`${BASE}/chat`, h.userId, { ...CTX, threadId: null, text: 'What is next?' });
    expect(turn.status).toBe(200);
    const threadId = threadOf(turn);
    expect(await countRows(orm, AssistantThreads, { id: threadId, trip: null, journey: null })).toBe(1);

    const sent = JSON.stringify(provider.requests[0].messages);
    expect(sent).toContain('not about one trip');
    expect(sent).toContain('<home_card>');
    expect(sent).toContain(`${h.nextId} | Kyoto | next, 2099-04-01 to 2099-04-08`);
    expect(sent).toContain(`${h.laterId} | Someday Patagonia | no dates`);
    expect(sent).not.toContain('Not yours');
    expect(sent).not.toContain('<trip_card>');
    const names = toolNames(provider.requests[0]);
    expect(names).toEqual(expect.arrayContaining(['list_trips', 'get_trip_summary', 'open_trip_chat']));
    expect(names).toEqual(expect.arrayContaining(['use_addon_tools', 'suggest_follow_ups']));
    for (const name of ['create_place', 'update_trip', 'remember_for_trip', 'get_book', 'delete_trip']) {
      expect(names, name).not.toContain(name);
    }
    const summary = provider.requests[0].tools?.find((tool) => tool.function.name === 'get_trip_summary');
    expect(Object.keys(summary?.function.parameters.properties ?? {})).toContain('tripId');

    const list = await get(`${BASE}/threads`, h.userId);
    expect(list.body.threads).toEqual([expect.objectContaining({ id: threadId, title: 'What is next?' })]);
    expect((await get(`${BASE}/threads`, other.id)).body.threads).toEqual([]);
    expect((await get(`${BASE}/threads/${threadId}`, other.id)).status).toBe(404);
  });

  it('ASTHE2E-003: a trip is read by its id with the user rights, and another user trip is refused', async () => {
    const h = await ownerWithTrips();
    const { user: other } = await makeUser(orm);
    const foreign = await makeTrip(orm, other.id, { title: 'Theirs' });
    provider.script = [
      callTool('call_own', 'get_trip_summary', { tripId: h.nextId }),
      callTool('call_foreign', 'get_trip_summary', { tripId: foreign.id }),
      say('Done.'),
    ];
    const turn = await post(`${BASE}/chat`, h.userId, { ...CTX, threadId: null, text: 'Tell me about both' });
    expect(turn.status).toBe(200);
    const outputs = ofType(turn.chunks, 'tool-output-available');
    expect(outputs.map((chunk) => chunk.toolCallId)).toEqual(['call_own']);
    expect(JSON.stringify(outputs[0].output)).toContain('Kyoto');
    expect(ofType(turn.chunks, 'tool-output-error').map((chunk) => chunk.toolCallId)).toEqual(['call_foreign']);
    expect(ofType(turn.chunks, 'tool-approval-request')).toHaveLength(0);
  });

  it("ASTHE2E-004: the way into a trip's chat shows a card for the user's own trip only", async () => {
    const h = await ownerWithTrips();
    const { user: other } = await makeUser(orm);
    const foreign = await makeTrip(orm, other.id, { title: 'Theirs' });
    provider.script = [
      callTool('call_open', 'open_trip_chat', { tripId: h.nextId, question: 'What is still missing?' }),
      callTool('call_theirs', 'open_trip_chat', { tripId: foreign.id }),
      say('Go on in the trip.'),
    ];
    const turn = await post(`${BASE}/chat`, h.userId, { ...CTX, threadId: null, text: 'Plan Kyoto with me' });
    expect(turn.status).toBe(200);
    expect(ofType(turn.chunks, 'data-trek-card')).toEqual([
      {
        type: 'data-trek-card',
        data: {
          toolCallId: 'call_open',
          card: {
            kind: 'tripChat',
            trip: {
              id: h.nextId,
              title: 'Kyoto',
              startDate: '2099-04-01',
              endDate: '2099-04-08',
              phase: 'next',
              placeCount: 0,
            },
            question: 'What is still missing?',
          },
        },
      },
    ]);
    expect(ofType(turn.chunks, 'tool-output-error').map((chunk) => chunk.toolCallId)).toEqual(['call_theirs']);
    const shown = await get(`${BASE}/threads/${threadOf(turn)}`, h.userId);
    expect(JSON.stringify(shown.body.messages)).toContain('"kind":"tripChat"');
  });

  it('ASTHE2E-005: a change that belongs to no trip is held, applied with the user rights, its undo only theirs', async () => {
    const h = await ownerWithTrips();
    provider.script = [
      callTool('call_load', 'use_addon_tools', { groups: ['atlas'] }),
      callTool('call_mark', 'mark_country_visited', { country_code: 'JP' }),
    ];
    const turn = await post(`${BASE}/chat`, h.userId, { ...CTX, threadId: null, text: 'I was in Japan' });
    expect(turn.chunks.at(-1)).toEqual({ type: 'finish', finishReason: 'tool-calls' });
    const [held] = ofType(turn.chunks, 'tool-approval-request');
    expect(held).toBeDefined();
    expect(await countRows(orm, VisitedCountries, { user: h.userId, country_code: 'JP' })).toBe(0);

    provider.script = [say('Japan is in your atlas.')];
    const decided = await post(`${BASE}/threads/${threadOf(turn)}/decisions`, h.userId, {
      ...CTX,
      decisions: [{ toolCallId: held.toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    expect(ofType(decided.chunks, 'tool-output-available')).toHaveLength(1);
    expect(await countRows(orm, VisitedCountries, { user: h.userId, country_code: 'JP' })).toBe(1);

    const { user: other } = await makeUser(orm);
    const foreignUndo = await request(nestApp.getHttpServer())
      .post(`${BASE}/tool-calls/${held.toolCallId}/undo`)
      .set('Cookie', sessionCookie(other.id))
      .send({});
    expect(foreignUndo.status).toBe(404);
  });

  it('ASTHE2E-006: a home conversation and a trip conversation never reach each other', async () => {
    const h = await ownerWithTrips();
    const tripBase = `/api/trips/${h.nextId}/assistant`;
    provider.script = [say('home'), say('trip')];
    const atHome = await post(`${BASE}/chat`, h.userId, { ...CTX, threadId: null, text: 'Across my trips' });
    const inTrip = await post(`${tripBase}/chat`, h.userId, { ...CTX, threadId: null, text: 'About Kyoto' });
    const homeThread = threadOf(atHome);
    const tripThread = threadOf(inTrip);

    const ids = (res: { body: { threads: Array<{ id: number }> } }) => res.body.threads.map((t) => t.id);
    expect(ids(await get(`${BASE}/threads`, h.userId))).toEqual([homeThread]);
    expect(ids(await get(`${tripBase}/threads`, h.userId))).toEqual([tripThread]);
    expect((await get(`${BASE}/threads/${tripThread}`, h.userId)).status).toBe(404);
    expect((await get(`${tripBase}/threads/${homeThread}`, h.userId)).status).toBe(404);
    const continued = await post(`${BASE}/chat`, h.userId, { ...CTX, threadId: tripThread, text: 'Go on' });
    expect(continued).toMatchObject({ status: 404, json: { code: 'not_found' } });

    const removed = await request(nestApp.getHttpServer())
      .delete(`${BASE}/threads/${homeThread}`)
      .set('Cookie', sessionCookie(h.userId));
    expect(removed.status).toBe(200);
    expect(await countRows(orm, AssistantThreads, { id: homeThread })).toBe(0);
    expect(await countRows(orm, AssistantThreads, { id: tripThread })).toBe(1);
  });
});
