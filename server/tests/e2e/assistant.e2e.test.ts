/**
 * Trip assistant e2e: the whole app (buildApp, every global guard, the Zod
 * pipe, the response contracts, the real MCP registry) with an instance
 * connection of kind `custom` pointing at a fake OpenAI-compatible server on
 * loopback. Nothing is mocked: the fake server is the provider, scripted per
 * case, and it records what the assistant sent it.
 *
 * Covered: the gates before the stream, a text turn, a read tool, a change
 * held, applied (with its broadcast) and continued, a discarded one, the
 * all-or-nothing decisions, undo and its guard, one turn per user and stop,
 * a provider failure, threads and their deletion with the trip, the daily
 * limit on decisions, an approved change the turn never got to run, a
 * booking file attached in the chat (the extractor, an external binary, is
 * stubbed on the booking import), the cards a search and a weather lookup
 * make (the place search and the forecast are stubbed on their services), a
 * found place suggested for a day without the model (only with the right to
 * edit places), mentions, an answer shared in the trip chat, and a vacation
 * day held with its calendar card, applied and taken back.
 */
import { buildApp } from '../../src/bootstrap';
import { AssistantMessages } from '../../src/db/entities/AssistantMessages.entity';
import { AssistantThreads } from '../../src/db/entities/AssistantThreads.entity';
import { AssistantToolCalls } from '../../src/db/entities/AssistantToolCalls.entity';
import { CollabMessages } from '../../src/db/entities/CollabMessages.entity';
import { CollabPolls } from '../../src/db/entities/CollabPolls.entity';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TURNS_PER_MINUTE } from '../../src/nest/assistant/assistant-tools.constants';
import { AssistantToolsService } from '../../src/nest/assistant/assistant-tools.service';
import { AssistantCardContext } from '../../src/nest/assistant/cards/card-context';
import { BookingImportService } from '../../src/nest/booking-import/booking-import.service';
import { MapsService } from '../../src/nest/maps/maps.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { WeatherService } from '../../src/nest/weather/weather.service';
import { tourRouteCard } from '../helpers/assistant-tour-cards';
import { makeBudgetItem } from '../helpers/factories/budget';
import { makeCollabMessage } from '../helpers/factories/collab';
import { makePlace } from '../helpers/factories/places';
import { countRows, deleteRows, findRow, updateRows } from '../helpers/factories/rows';
import { setAddonEnabled, setCollabFeature } from '../helpers/factories/settings';
import { addTripMember, makeTrip, readTripDays } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import { storedTrekCardSchema, type AssistantMessagePart, type TrekCard, type UiStreamChunk } from '@trek/shared';

import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ── The fake provider ─────────────────────────────────────────────────────────

interface ChatBody {
  model: string;
  messages: Array<{ role: string; content: string | null; tool_call_id?: string; tool_calls?: unknown[] }>;
  tools?: Array<{ function: { name: string; parameters: { properties?: Record<string, unknown> } } }>;
}

type Reply = { chunks: object[] } | { status: number };
type Step = (body: ChatBody) => Reply | Promise<Reply>;

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
  const reply = await (provider.script.shift() ?? say('Nothing more.'))(body);
  if (res.destroyed) return;
  if ('status' in reply) {
    res.writeHead(reply.status, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: { type: 'server_error' } }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  for (const chunk of reply.chunks) res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  res.end('data: [DONE]\n\n');
}

// ── The app ──────────────────────────────────────────────────────────────────

let nestApp: INestApplication;
let orm: MikroORM;
let fake: HttpServer;
let broadcasts: RealtimeSpies;
let adminId: number;

async function connectInstance(): Promise<void> {
  const { port } = fake.address() as AddressInfo;
  const res = await request(nestApp.getHttpServer())
    .put('/api/admin/ai/connection')
    .set('Cookie', sessionCookie(adminId))
    .send({ kind: 'custom', baseUrl: `http://127.0.0.1:${port}/v1`, model: 'fake-model' });
  expect(res.status).toBe(200);
}

beforeAll(async () => {
  fake = createServer((req, res) => {
    answer(req, res).catch(() => res.destroy());
  });
  await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
  broadcasts = spyOnRealtime(nestApp);
  await setAddonEnabled(orm, 'ai_assistant', true);
  adminId = (await makeUser(orm, { role: 'admin' })).user.id;
  await connectInstance();
});

beforeEach(async () => {
  await resetRateLimits(nestApp);
  provider.requests = [];
  provider.script = [];
  broadcasts.broadcast.mockClear();
});

afterAll(async () => {
  await nestApp.close();
  await new Promise<void>((resolve) => fake.close(() => resolve()));
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const CTX = { locale: 'en', timeZone: 'Europe/Berlin' };

/** The request with its whole answer read as text, a stream included. */
function asText(req: request.Test): request.Test {
  return req.buffer(true).parse((res, done) => {
    let text = '';
    res.setEncoding('utf8');
    res.on('data', (chunk: string) => (text += chunk));
    res.on('end', () => done(null, text));
  });
}

interface Answer {
  status: number;
  chunks: UiStreamChunk[];
  json: Record<string, unknown> | null;
}

async function post(path: string, userId: number, body: object): Promise<Answer> {
  const res = await asText(request(nestApp.getHttpServer()).post(path).set('Cookie', sessionCookie(userId)).send(body));
  return parseAnswer(res.status, String(res.headers['content-type']), res.body as string);
}

function parseAnswer(status: number, contentType: string, text: string): Answer {
  if (!contentType.includes('text/event-stream')) {
    return { status, chunks: [], json: text ? (JSON.parse(text) as Record<string, unknown>) : null };
  }
  const events = text
    .split('\n\n')
    .filter((event) => event.startsWith('data: '))
    .map((event) => event.slice('data: '.length));
  expect(events.at(-1)).toBe('[DONE]');
  return {
    status,
    chunks: events.slice(0, -1).map((event) => JSON.parse(event) as UiStreamChunk),
    json: null,
  };
}

/** A file attached in the chat, as the client uploads it (multipart, the context as text fields). */
async function upload(path: string, userId: number, fileName: string): Promise<Answer> {
  const req = request(nestApp.getHttpServer())
    .post(path)
    .set('Cookie', sessionCookie(userId))
    .field('locale', CTX.locale)
    .field('timeZone', CTX.timeZone)
    .attach('file', Buffer.from('%PDF-1.4\n'), { filename: fileName, contentType: 'application/pdf' });
  const res = await asText(req);
  return parseAnswer(res.status, String(res.headers['content-type']), res.body as string);
}

function get(path: string, userId: number) {
  return request(nestApp.getHttpServer()).get(path).set('Cookie', sessionCookie(userId));
}

async function travelerWithTrip() {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Kyoto', start_date: '2026-06-11', end_date: '2026-06-12' });
  await makePlace(orm, trip.id, { name: 'Kinkaku-ji', category: null });
  const base = `/api/trips/${trip.id}/assistant`;
  return { userId: user.id, tripId: trip.id, base };
}

const ofType = <T extends UiStreamChunk['type']>(chunks: UiStreamChunk[], type: T) =>
  chunks.filter((chunk): chunk is Extract<UiStreamChunk, { type: T }> => chunk.type === type);

/** A chat turn that proposes one new place, and the id the change is held under. */
async function proposePlace(t: { userId: number; base: string }, name: string) {
  provider.script = [callTools({ id: `call_${name}`, name: 'create_place', args: { name } })];
  const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: `Add ${name}` });
  const [held] = ofType(turn.chunks, 'tool-approval-request');
  const [thread] = ofType(turn.chunks, 'data-trek-thread');
  return { turn, toolCallId: held.toolCallId, threadId: thread.data.threadId };
}

/** What the stubbed place search finds: a Google place, an OpenStreetMap one, and one without a position. */
const FOUND = [
  {
    google_place_id: 'ChIJginkaku',
    name: 'Ginkaku-ji',
    address: '2 Ginkakujicho',
    lat: 35.027,
    lng: 135.7982,
    rating: 4.6,
    website: 'https://example.com/ginkaku',
    phone: '+81 75 771 5725',
    types: ['tourist_attraction', 'place_of_worship'],
    source: 'google',
  },
  {
    google_place_id: null,
    osm_id: 'node:42',
    name: 'Tea house of mail@example.com',
    lat: 35.01,
    lng: 135.76,
    category: 'cafe',
    source: 'openstreetmap',
  },
  { name: 'Nowhere' },
];

/** A turn that searches places and looks up the weather; the search and the forecast are stubbed. */
async function searchTurn(t: { userId: number; base: string }) {
  const search = vi
    .spyOn(nestApp.get(MapsService), 'searchPlaces')
    .mockResolvedValue({ places: FOUND, source: 'google' });
  const forecast = vi.spyOn(nestApp.get(WeatherService), 'get').mockResolvedValue({
    temp: 21,
    temp_max: 24,
    temp_min: 15,
    main: 'Clear',
    description: 'clear sky',
    type: 'forecast',
    precipitation_probability_max: 40,
  });
  provider.script = [
    callTools(
      { id: 'call_find', name: 'search_place', args: { query: 'temples', locationBias: { lat: 35.03, lng: 135.73 } } },
      { id: 'call_sky', name: 'get_weather', args: { lat: 35.03, lng: 135.73, date: '2026-06-11' } },
    ),
    say('Two temples are worth it.'),
  ];
  try {
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'Temples nearby?' });
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    return { turn, threadId, messageId: ofType(turn.chunks, 'start')[0].messageId };
  } finally {
    search.mockRestore();
    forecast.mockRestore();
  }
}

function addFound(path: string, userId: number, body: object) {
  return request(nestApp.getHttpServer())
    .post(path)
    .set('Cookie', sessionCookie(userId))
    .send({ ...CTX, ...body });
}

// ── Cases ────────────────────────────────────────────────────────────────────

describe('Trip assistant e2e', () => {
  it('ASTE2E-001: the addon gate, auth and the trip come before anything else', async () => {
    const t = await travelerWithTrip();
    const { user: stranger } = await makeUser(orm);
    await setAddonEnabled(orm, 'ai_assistant', false);
    expect((await request(nestApp.getHttpServer()).get(`${t.base}/threads`)).status).toBe(404);
    await setAddonEnabled(orm, 'ai_assistant', true);
    expect((await request(nestApp.getHttpServer()).get(`${t.base}/threads`)).status).toBe(401);
    expect((await get(`${t.base}/threads`, stranger.id)).status).toBe(404);
    const refused = await post(`${t.base}/chat`, stranger.id, { ...CTX, threadId: null, text: 'hi' });
    expect(refused.status).toBe(404);
    expect((await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: '' })).status).toBe(400);
    expect(provider.requests).toHaveLength(0);
  });

  it('ASTE2E-002: without a connection a turn is refused as JSON with its code', async () => {
    const t = await travelerWithTrip();
    expect(
      (await request(nestApp.getHttpServer()).delete('/api/admin/ai/connection').set('Cookie', sessionCookie(adminId)))
        .status,
    ).toBe(200);
    try {
      const refused = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'hi' });
      expect(refused).toMatchObject({ status: 409, json: { code: 'not_connected' } });
    } finally {
      await connectInstance();
    }
  });

  it('ASTE2E-003: a text turn opens a thread, streams the answer and keeps it', async () => {
    const t = await travelerWithTrip();
    provider.script = [say('Kyoto in June is lovely.')];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'How is Kyoto in June?' });
    expect(turn.status).toBe(200);
    expect(turn.chunks.map((chunk) => chunk.type)).toEqual([
      'start',
      'data-trek-thread',
      'start-step',
      'text-start',
      'text-delta',
      'text-end',
      'finish-step',
      'data-trek-quota',
      'finish',
    ]);
    const [thread] = ofType(turn.chunks, 'data-trek-thread');
    expect(thread.data.title).toBe('How is Kyoto in June?');
    expect(ofType(turn.chunks, 'data-trek-quota')[0].data).toMatchObject({ limit: 50 });
    expect(provider.requests[0].messages[0].content).toContain('<trip_card>');
    expect(provider.requests[0].messages[0].content).toContain('Kinkaku-ji');

    const list = await get(`${t.base}/threads`, t.userId);
    expect(list.status).toBe(200);
    expect(list.body.threads).toEqual([
      expect.objectContaining({ id: thread.data.threadId, title: 'How is Kyoto in June?' }),
    ]);
    const shown = await get(`${t.base}/threads/${thread.data.threadId}`, t.userId);
    expect(shown.status).toBe(200);
    expect(shown.body.messages.map((m: { role: string; status: string }) => [m.role, m.status])).toEqual([
      ['user', 'complete'],
      ['assistant', 'complete'],
    ]);
    expect(shown.body.messages[1].id).toBe(ofType(turn.chunks, 'start')[0].messageId);
    expect(shown.body.messages[1].parts).toEqual([{ type: 'text', text: 'Kyoto in June is lovely.' }]);
  });

  it('ASTE2E-004: a read runs at once on the trip, and the model never sees the trip id or a denied tool', async () => {
    const t = await travelerWithTrip();
    provider.script = [callTools({ id: 'call_r', name: 'list_places', args: {} }), say('You have Kinkaku-ji.')];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'What is planned?' });
    const [output] = ofType(turn.chunks, 'tool-output-available');
    expect(JSON.stringify(output.output)).toContain('Kinkaku-ji');
    const tools = provider.requests[0].tools ?? [];
    const names = tools.map((tool) => tool.function.name);
    expect(names).toContain('list_places');
    for (const denied of ['delete_trip', 'import_places_from_url', 'create_share_link']) {
      expect(names).not.toContain(denied);
    }
    for (const tool of tools) expect(Object.keys(tool.function.parameters.properties ?? {})).not.toContain('tripId');
    const toolAnswer = provider.requests[1].messages.find((message) => message.role === 'tool');
    expect(toolAnswer).toMatchObject({ tool_call_id: 'call_r' });
    expect(toolAnswer?.content).toContain('Kinkaku-ji');
  });

  it('ASTE2E-005: a change is held, applied with its stored arguments, broadcast, and the turn goes on', async () => {
    const t = await travelerWithTrip();
    const { turn, toolCallId, threadId } = await proposePlace(t, 'Ryoan-ji');
    expect(turn.chunks.at(-1)).toEqual({ type: 'finish', finishReason: 'tool-calls' });
    expect(ofType(turn.chunks, 'data-trek-change')[0].data).toMatchObject({
      toolCallId,
      verbKey: 'addPlace',
      subject: 'Ryoan-ji',
    });
    expect(await findRow(orm, Places, { trip: t.tripId, name: 'Ryoan-ji' })).toBeNull();

    const waiting = await get(`${t.base}/threads/${threadId}`, t.userId);
    expect(waiting.body.messages[1].status).toBe('awaiting_approval');

    provider.script = [say('Added Ryoan-ji.')];
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    expect(ofType(decided.chunks, 'start')[0].messageId).toBe(ofType(turn.chunks, 'start')[0].messageId);
    const [applied] = ofType(decided.chunks, 'data-trek-applied');
    expect(applied.data).toMatchObject({ toolCallId, entity: 'place', dayId: null });
    expect(applied.data.undoUntil).toEqual(expect.any(String));
    const place = await findRow(orm, Places, { trip: t.tripId, name: 'Ryoan-ji' });
    expect(place).not.toBeNull();
    expect(applied.data.ids).toEqual([place?.id]);
    expect(broadcasts.broadcast).toHaveBeenCalledWith(t.tripId, 'place:created', expect.anything());
    expect(decided.chunks.at(-1)).toEqual({ type: 'finish', finishReason: 'stop' });
    const toolAnswer = provider.requests.at(-1)?.messages.find((message) => message.role === 'tool');
    expect(toolAnswer).toMatchObject({ tool_call_id: 'call_Ryoan-ji' });

    const after = await get(`${t.base}/threads/${threadId}`, t.userId);
    expect(after.body.messages).toHaveLength(2);
    expect(after.body.messages[1].status).toBe('complete');

    const again = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    expect(again.status).toBe(409);
    expect(await countRows(orm, Places, { trip: t.tripId, name: 'Ryoan-ji' })).toBe(1);
  });

  it('ASTE2E-006: a discarded change does not run, and the model is told', async () => {
    const t = await travelerWithTrip();
    const { toolCallId, threadId } = await proposePlace(t, 'Nijo Castle');
    provider.script = [say('Fine, left it out.')];
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: false }],
    });
    expect(ofType(decided.chunks, 'tool-output-denied')).toEqual([{ type: 'tool-output-denied', toolCallId }]);
    expect(await findRow(orm, Places, { trip: t.tripId, name: 'Nijo Castle' })).toBeNull();
    expect(provider.requests.at(-1)?.messages.find((message) => message.role === 'tool')?.content).toContain(
      'discarded',
    );
  });

  it('ASTE2E-007: decisions name every waiting change, in a thread of the user', async () => {
    const t = await travelerWithTrip();
    const { threadId } = await proposePlace(t, 'Ginkaku-ji');
    const partial = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId: 'not-a-waiting-change', approved: true }],
    });
    expect(partial).toMatchObject({ status: 422, json: { code: 'generic' } });
    const missing = await post(`${t.base}/threads/999999/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId: 'x', approved: true }],
    });
    expect(missing).toMatchObject({ status: 404, json: { code: 'not_found' } });

    provider.script = [say('Moving on.')];
    const next = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId, text: 'Never mind' });
    expect(next.status).toBe(200);
    const shown = await get(`${t.base}/threads/${threadId}`, t.userId);
    const cancelled = shown.body.messages[1].parts.find((part: { type: string }) => part.type === 'tool-call');
    expect(cancelled.approval).toMatchObject({ resolution: 'cancelled' });
    expect(provider.requests.at(-1)?.messages.find((message) => message.role === 'tool')?.content).toContain(
      'moved on',
    );
  });

  it('ASTE2E-008: an applied change is undone once, and not after it was changed', async () => {
    const t = await travelerWithTrip();
    const first = await proposePlace(t, 'Tenryu-ji');
    await post(`${t.base}/threads/${first.threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId: first.toolCallId, approved: true }],
    });
    const undone = await request(nestApp.getHttpServer())
      .post(`${t.base}/tool-calls/${first.toolCallId}/undo`)
      .set('Cookie', sessionCookie(t.userId))
      .send({});
    expect(undone.status).toBe(200);
    expect(undone.body).toEqual({ undone: true });
    expect(await findRow(orm, Places, { trip: t.tripId, name: 'Tenryu-ji' })).toBeNull();
    const twice = await request(nestApp.getHttpServer())
      .post(`${t.base}/tool-calls/${first.toolCallId}/undo`)
      .set('Cookie', sessionCookie(t.userId))
      .send({});
    expect(twice.status).toBe(409);
    const shown = await get(`${t.base}/threads/${first.threadId}`, t.userId);
    const receipt = shown.body.messages[1].parts.find((part: { type: string }) => part.type === 'data-trek-applied');
    expect(receipt.data.undoUntil).toBeNull();

    const second = await proposePlace(t, 'Daitoku-ji');
    await post(`${t.base}/threads/${second.threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId: second.toolCallId, approved: true }],
    });
    await updateRows(
      orm,
      Places,
      { trip: t.tripId, name: 'Daitoku-ji' },
      { notes: 'Edited by hand', updated_at: '2099-01-01 00:00:00' },
    );
    const stale = await request(nestApp.getHttpServer())
      .post(`${t.base}/tool-calls/${second.toolCallId}/undo`)
      .set('Cookie', sessionCookie(t.userId))
      .send({});
    expect(stale.status).toBe(409);
    expect(await findRow(orm, Places, { trip: t.tripId, name: 'Daitoku-ji' })).not.toBeNull();

    const { user: stranger } = await makeUser(orm);
    const foreign = await request(nestApp.getHttpServer())
      .post(`${t.base}/tool-calls/${second.toolCallId}/undo`)
      .set('Cookie', sessionCookie(stranger.id))
      .send({});
    expect(foreign.status).toBe(404);
  });

  it('ASTE2E-009: one turn per user at a time; stop ends the running one', async () => {
    const t = await travelerWithTrip();
    let arrived!: () => void;
    const reached = new Promise<void>((resolve) => (arrived = resolve));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    provider.script = [
      async (body) => {
        arrived();
        await gate;
        return say('too late')(body);
      },
    ];
    const running = post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'Slow one' });
    await reached;
    const busy = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'Second window' });
    expect(busy).toMatchObject({ status: 409, json: { code: 'busy' } });
    const stopped = await request(nestApp.getHttpServer())
      .post(`${t.base}/stop`)
      .set('Cookie', sessionCookie(t.userId))
      .send({});
    expect(stopped.status).toBe(200);
    const first = await running;
    expect(first.chunks.at(-1)).toEqual({ type: 'abort' });
    release();
  });

  it('ASTE2E-010: a provider failure ends the stream with its code', async () => {
    const t = await travelerWithTrip();
    provider.script = [() => ({ status: 503 })];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'hi' });
    expect(turn.status).toBe(200);
    // The day's count goes out before the end, so it is read apart from it.
    const ending = turn.chunks.filter((chunk) => chunk.type !== 'data-trek-quota');
    expect(ending.slice(-2)).toEqual([
      { type: 'error', errorText: 'provider_unavailable' },
      { type: 'finish', finishReason: 'error' },
    ]);
  });

  it('ASTE2E-011: turns are rate limited per user', async () => {
    const t = await travelerWithTrip();
    // One after another, as a user would; a burst of requests at once only tests the test server.
    const undoOnce = () =>
      request(nestApp.getHttpServer())
        .post(`${t.base}/tool-calls/missing/undo`)
        .set('Cookie', sessionCookie(t.userId))
        .send({});
    const responses = await Array.from({ length: TURNS_PER_MINUTE + 1 }).reduce<
      Promise<Array<{ status: number; body: unknown }>>
    >(async (done, _unused) => [...(await done), await undoOnce()], Promise.resolve([]));
    const statuses = responses.map((res) => res.status);
    expect(statuses.filter((status) => status === 404)).toHaveLength(TURNS_PER_MINUTE);
    const limited = responses.filter((res) => res.status === 429);
    expect(limited).toHaveLength(1);
    // TREK's own limit, told apart from a provider's `rate_limited`.
    expect((limited[0]?.body as { code?: unknown }).code).toBe('too_many_requests');
  });

  it('ASTE2E-012: a thread is deleted by its owner, and all go with the trip', async () => {
    const t = await travelerWithTrip();
    provider.script = [say('one'), say('two')];
    const a = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'First' });
    await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'Second' });
    const threadId = ofType(a.chunks, 'data-trek-thread')[0].data.threadId;
    const removed = await request(nestApp.getHttpServer())
      .delete(`${t.base}/threads/${threadId}`)
      .set('Cookie', sessionCookie(t.userId));
    expect(removed.status).toBe(200);
    expect((await get(`${t.base}/threads/${threadId}`, t.userId)).status).toBe(404);
    expect(await countRows(orm, AssistantThreads, { trip: t.tripId })).toBe(1);
    await deleteRows(orm, Trips, { id: t.tripId });
    expect(await countRows(orm, AssistantThreads, { trip: t.tripId })).toBe(0);
  });

  it('ASTE2E-013: a decision on the instance connection is held to the daily limit', async () => {
    const t = await travelerWithTrip();
    const { toolCallId, threadId } = await proposePlace(t, 'Sanjusangen-do');
    const settings = await get('/api/admin/ai/settings', adminId);
    const save = (body: object) =>
      request(nestApp.getHttpServer()).put('/api/admin/ai/settings').set('Cookie', sessionCookie(adminId)).send(body);
    expect((await save({ ...settings.body, dailyTurns: 1 })).status).toBe(200);
    try {
      const refused = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
        ...CTX,
        decisions: [{ toolCallId, approved: true }],
      });
      expect(refused).toMatchObject({ status: 429, json: { code: 'daily_limit' } });
      expect(await findRow(orm, AssistantToolCalls, { id: toolCallId })).toMatchObject({
        state: 'approval_requested',
      });
      expect(await findRow(orm, Places, { trip: t.tripId, name: 'Sanjusangen-do' })).toBeNull();
    } finally {
      expect((await save(settings.body)).status).toBe(200);
    }
  });

  it('ASTE2E-014: an approved change the turn never ran reads as failed, not as applied', async () => {
    const t = await travelerWithTrip();
    const { toolCallId, threadId } = await proposePlace(t, 'Kiyomizu-dera');
    const open = vi
      .spyOn(nestApp.get(AssistantToolsService), 'open')
      .mockRejectedValueOnce(new Error('tool session down'));
    try {
      const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
        ...CTX,
        decisions: [{ toolCallId, approved: true }],
      });
      expect(decided.chunks.slice(-2)).toEqual([
        { type: 'error', errorText: 'generic' },
        { type: 'finish', finishReason: 'error' },
      ]);
    } finally {
      open.mockRestore();
    }
    expect(await findRow(orm, Places, { trip: t.tripId, name: 'Kiyomizu-dera' })).toBeNull();
    expect(await findRow(orm, AssistantToolCalls, { id: toolCallId })).toMatchObject({ state: 'failed' });
    const shown = await get(`${t.base}/threads/${threadId}`, t.userId);
    const change = shown.body.messages[1].parts.find((part: { type: string }) => part.type === 'tool-call');
    expect(change).toMatchObject({ isError: true, approval: { approved: true } });
    expect(shown.body.messages[1].status).toBe('complete');
    const again = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    expect(again.status).toBe(409);
  });

  it('ASTE2E-015: an attached file is refused as JSON before the stream when nothing reads it', async () => {
    const t = await travelerWithTrip();
    const bookingImport = nestApp.get(BookingImportService);
    const extractor = vi.spyOn(bookingImport, 'isAvailable').mockReturnValue(false);
    const ai = vi.spyOn(bookingImport, 'aiAvailable').mockResolvedValue(false);
    try {
      const refused = await upload(`${t.base}/attachments`, t.userId, 'ticket.pdf');
      expect(refused).toMatchObject({ status: 503, json: { code: 'import_unavailable' } });
      const wrongType = await upload(`${t.base}/attachments`, t.userId, 'ticket.exe');
      expect(wrongType).toMatchObject({ status: 400, json: { code: 'generic' } });
    } finally {
      extractor.mockRestore();
      ai.mockRestore();
    }
    expect(await countRows(orm, AssistantThreads, { trip: t.tripId })).toBe(0);
  });

  it('ASTE2E-016: the bookings of an attached file are held as cards, applied, and the model is told', async () => {
    const t = await travelerWithTrip();
    const bookingImport = nestApp.get(BookingImportService);
    const extractor = vi.spyOn(bookingImport, 'isAvailable').mockReturnValue(true);
    const ai = vi.spyOn(bookingImport, 'aiAvailable').mockResolvedValue(false);
    const preview = vi.spyOn(bookingImport, 'preview').mockResolvedValue({
      items: [
        {
          type: 'event',
          title: 'Gion Corner show',
          reservation_time: '2026-06-11T19:00',
          confirmation_number: 'GC-42',
          source: { fileName: 'ticket.pdf', index: 0 },
        },
      ],
      warnings: [],
    });
    let threadId: number;
    let toolCallId: string;
    try {
      const turn = await upload(`${t.base}/attachments`, t.userId, 'ticket.pdf');
      expect(turn.status).toBe(200);
      expect(turn.chunks.map((chunk) => chunk.type)).toEqual([
        'start',
        'data-trek-thread',
        'start-step',
        'tool-input-start',
        'tool-input-available',
        'tool-output-available',
        'tool-input-start',
        'tool-input-available',
        'tool-approval-request',
        'data-trek-change',
        'finish-step',
        'finish',
      ]);
      expect(ofType(turn.chunks, 'tool-input-start')[0].toolName).toBe('read_booking_file');
      expect(ofType(turn.chunks, 'data-trek-change')[0].data).toMatchObject({
        verbKey: 'importBooking',
        subject: 'Gion Corner show',
        undoable: false,
      });
      const file = expect.objectContaining({ originalname: 'ticket.pdf' });
      expect(preview).toHaveBeenCalledWith([file], 'no-ai', t.userId);
      threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
      toolCallId = ofType(turn.chunks, 'tool-approval-request')[0].toolCallId;
    } finally {
      extractor.mockRestore();
      ai.mockRestore();
      preview.mockRestore();
    }
    expect(provider.requests).toHaveLength(0);
    const shown = await get(`${t.base}/threads/${threadId}`, t.userId);
    expect(shown.body.messages[0].parts).toEqual([
      { type: 'attachment', name: 'ticket.pdf', mime: 'application/pdf', size: 9 },
    ]);
    expect(shown.body.messages[1].status).toBe('awaiting_approval');

    provider.script = [say('The show is on your trip.')];
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    const [applied] = ofType(decided.chunks, 'data-trek-applied');
    expect(applied.data).toMatchObject({ toolCallId, entity: 'reservation', undoUntil: null });
    const booked = await findRow(orm, Reservations, { trip: t.tripId, title: 'Gion Corner show' });
    expect(booked).not.toBeNull();
    expect(applied.data.ids).toEqual([booked?.id]);
    const sent = provider.requests[0].messages.map((message) => String(message.content ?? '')).join('\n');
    expect(sent).toContain('The user attached the file "ticket.pdf"');
    expect(sent).toContain('"Gion Corner show" was added to the trip');
    expect(provider.requests[0].tools?.map((tool) => tool.function.name)).not.toContain('import_booking');
  });
  it('ASTE2E-017: a search and a weather lookup stream where they look and come back as cards, kept with the answer', async () => {
    const t = await travelerWithTrip();
    const [day] = await readTripDays(orm, t.tripId);
    const { turn, threadId } = await searchTurn(t);
    expect(turn.chunks.map((chunk) => chunk.type)).toEqual([
      'start',
      'data-trek-thread',
      'start-step',
      'data-trek-activity',
      'tool-input-start',
      'tool-input-available',
      'tool-output-available',
      'data-trek-places',
      'data-trek-activity',
      'tool-input-start',
      'tool-input-available',
      'tool-output-available',
      'data-trek-weather',
      'finish-step',
      'start-step',
      'text-start',
      'text-delta',
      'text-end',
      'finish-step',
      'data-trek-quota',
      'finish',
    ]);
    const [looking] = ofType(turn.chunks, 'data-trek-activity');
    expect(looking).toEqual({
      type: 'data-trek-activity',
      transient: true,
      data: {
        toolCallId: 'call_find',
        label: 'temples',
        area: { type: 'point', lat: 35.03, lng: 135.73, radiusM: 50_000 },
      },
    });
    const [found] = ofType(turn.chunks, 'data-trek-places');
    expect(found.data.more).toBe(0);
    expect(found.data.places).toEqual([
      expect.objectContaining({
        ref: 'call_find:0',
        name: 'Ginkaku-ji',
        kind: 'sight',
        rating: 4.6,
        openNow: null,
        googlePlaceId: 'ChIJginkaku',
        photoKey: 'ChIJginkaku',
        inTripPlaceId: null,
      }),
      expect.objectContaining({
        ref: 'call_find:1',
        name: 'Tea house of [hidden]',
        kind: 'drinks',
        osmId: 'node:42',
        photoKey: 'coords:35.010000,135.760000',
      }),
    ]);
    expect(JSON.stringify(found.data)).not.toMatch(/example\.com|\+81|https?:/);
    expect(ofType(turn.chunks, 'data-trek-weather')[0].data.days).toEqual([
      { dayId: day.id, date: '2026-06-11', main: 'Clear', tempMax: 24, tempMin: 15, rainPct: 40, kind: 'forecast' },
    ]);
    const shown = await get(`${t.base}/threads/${threadId}`, t.userId);
    const kept = (shown.body.messages[1].parts as AssistantMessagePart[]).map((part) => part.type);
    expect(kept).toContain('data-trek-places');
    expect(kept).toContain('data-trek-weather');
    expect(kept).not.toContain('data-trek-activity');
  });

  it('ASTE2E-018: a found place is suggested for a day without the model, applied without a turn, and undone', async () => {
    const t = await travelerWithTrip();
    const [day] = await readTripDays(orm, t.tripId);
    const { threadId, messageId } = await searchTurn(t);
    const asked = provider.requests.length;
    const path = `${t.base}/threads/${threadId}/found-places`;
    const res = await addFound(path, t.userId, { ref: 'call_find:0', dayId: day.id });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatchObject({ id: messageId, status: 'awaiting_approval' });
    const parts = res.body.message.parts as AssistantMessagePart[];
    const card = parts.find((part) => part.type === 'data-trek-change');
    expect(card?.type === 'data-trek-change' && card.data).toMatchObject({
      verbKey: 'addPlaceToDay',
      subject: 'Ginkaku-ji',
      dayId: day.id,
      effect: { kind: 'add', dayId: day.id, place: { name: 'Ginkaku-ji', lat: 35.027, lng: 135.7982 } },
    });
    const toolCallId = card?.type === 'data-trek-change' ? card.data.toolCallId : '';

    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    expect(decided.chunks.map((chunk) => chunk.type)).toEqual([
      'start',
      'tool-output-available',
      'data-trek-applied',
      'finish',
    ]);
    expect(ofType(decided.chunks, 'start')[0].messageId).toBe(messageId);
    expect(decided.chunks.at(-1)).toEqual({ type: 'finish', finishReason: 'stop' });
    expect(provider.requests).toHaveLength(asked);
    const place = await findRow(orm, Places, { trip: t.tripId, name: 'Ginkaku-ji' });
    expect(place).toMatchObject({ google_place_id: 'ChIJginkaku' });
    expect(await countRows(orm, DayAssignments, { day: day.id, place: place?.id })).toBe(1);
    expect(broadcasts.broadcast).toHaveBeenCalledWith(t.tripId, 'assignment:created', expect.anything());

    const undone = await request(nestApp.getHttpServer())
      .post(`${t.base}/tool-calls/${toolCallId}/undo`)
      .set('Cookie', sessionCookie(t.userId))
      .send({});
    expect(undone.status).toBe(200);
    expect(await findRow(orm, Places, { trip: t.tripId, name: 'Ginkaku-ji' })).toBeNull();

    provider.script = [say('Noted.')];
    await post(`${t.base}/chat`, t.userId, { ...CTX, threadId, text: 'Thanks' });
    const sent = provider.requests
      .at(-1)
      ?.messages.map((message) => String(message.content ?? ''))
      .join('\n');
    expect(sent).toContain(`"Ginkaku-ji" was added to day ${day.id}.`);
  });

  it('ASTE2E-019: a found place must be in the thread, for a day of the trip, with nothing else waiting', async () => {
    const t = await travelerWithTrip();
    const [day] = await readTripDays(orm, t.tripId);
    const other = await makeTrip(orm, t.userId, { start_date: '2026-07-01', end_date: '2026-07-01' });
    const [foreignDay] = await readTripDays(orm, other.id);
    const { threadId } = await searchTurn(t);
    const path = `${t.base}/threads/${threadId}/found-places`;
    const missing = await addFound(`${t.base}/threads/999999/found-places`, t.userId, {
      ref: 'call_find:0',
      dayId: day.id,
    });
    expect(missing.status).toBe(404);
    const unknown = await addFound(path, t.userId, { ref: 'call_find:7', dayId: day.id });
    expect(unknown).toMatchObject({ status: 400, body: { code: 'generic' } });
    const foreign = await addFound(path, t.userId, { ref: 'call_find:0', dayId: foreignDay.id });
    expect(foreign).toMatchObject({ status: 400, body: { code: 'generic' } });
    expect((await addFound(path, t.userId, { ref: 'call_find:0' })).status).toBe(400);
    expect((await addFound(path, t.userId, { ref: 'call_find:0', dayId: day.id })).status).toBe(200);
    const twice = await addFound(path, t.userId, { ref: 'call_find:1', dayId: day.id });
    expect(twice).toMatchObject({ status: 409, body: { code: 'decide_first' } });
    expect(await countRows(orm, AssistantToolCalls, { thread: threadId })).toBe(1);
    expect(provider.requests).toHaveLength(2);
  });

  it('ASTE2E-024: "+ Day" asks for the right to edit places: 403 and nothing held without it, 404 outside the trip', async () => {
    const t = await travelerWithTrip();
    const { user: member } = await makeUser(orm);
    await addTripMember(orm, t.tripId, member.id);
    const [day] = await readTripDays(orm, t.tripId);
    const { threadId } = await searchTurn({ userId: member.id, base: t.base });
    const path = `${t.base}/threads/${threadId}/found-places`;

    const permissions = vi.spyOn(nestApp.get(PermissionsService), 'checkPermission');
    permissions.mockImplementation((action: string) => Promise.resolve(action !== 'place_edit'));
    try {
      const refused = await addFound(path, member.id, { ref: 'call_find:0', dayId: day.id });
      expect([refused.status, refused.body]).toEqual([403, { error: 'No permission' }]);
      expect(permissions).toHaveBeenCalledWith('place_edit', expect.any(String), t.userId, member.id, true);
    } finally {
      permissions.mockRestore();
    }
    expect(await countRows(orm, AssistantToolCalls, { thread: threadId })).toBe(0);

    const { user: stranger } = await makeUser(orm);
    const outside = await addFound(path, stranger.id, { ref: 'call_find:0', dayId: day.id });
    expect([outside.status, outside.body]).toEqual([404, { error: 'Trip not found' }]);

    // With the right, the same member holds the same place for the day.
    expect((await addFound(path, member.id, { ref: 'call_find:0', dayId: day.id })).status).toBe(200);
  });

  it('ASTE2E-020: mentions reach the model as the trip names them, and the message keeps the checked ones', async () => {
    const t = await travelerWithTrip();
    const [day] = await readTripDays(orm, t.tripId);
    const place = await findRow(orm, Places, { trip: t.tripId, name: 'Kinkaku-ji' });
    const other = await makeTrip(orm, t.userId);
    const elsewhere = await makePlace(orm, other.id, { name: 'Elsewhere' });
    provider.script = [say('Sure.')];
    const turn = await post(`${t.base}/chat`, t.userId, {
      ...CTX,
      threadId: null,
      text: 'Is @Kinkaku-ji open then?',
      mentions: [
        { kind: 'place', id: place?.id },
        { kind: 'day', id: day.id },
        { kind: 'place', id: elsewhere.id },
      ],
    });
    expect(turn.status).toBe(200);
    const context = String(provider.requests[0].messages[0].content);
    expect(context).toContain('The user names these in the message');
    expect(context).toContain(`- place ${place?.id}: Kinkaku-ji`);
    expect(context).toContain(`- day ${day.id} (2026-06-11)`);
    expect(context).not.toContain('Elsewhere');
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    const shown = await get(`${t.base}/threads/${threadId}`, t.userId);
    expect(shown.body.messages[0].parts).toEqual([
      { type: 'text', text: 'Is @Kinkaku-ji open then?' },
      {
        type: 'data-trek-mentions',
        data: {
          items: [
            { kind: 'place', id: place?.id, label: 'Kinkaku-ji' },
            { kind: 'day', id: day.id, label: expect.stringContaining('11') },
          ],
        },
      },
    ]);
  });

  it('ASTE2E-021: an answer is shared in the trip chat as from the assistant, with the chat on and the right to write', async () => {
    const t = await travelerWithTrip();
    await setAddonEnabled(orm, 'collab', true);
    provider.script = [say('Kyoto in June is lovely.')];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'How is June?' });
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    const messageId = ofType(turn.chunks, 'start')[0].messageId;
    const share = (id: string) =>
      request(nestApp.getHttpServer())
        .post(`${t.base}/threads/${threadId}/messages/${id}/share`)
        .set('Cookie', sessionCookie(t.userId))
        .set('X-Socket-Id', 'sock-1')
        .send({ text: '  Kyoto in June is lovely.  ' });

    const shared = await share(messageId);
    expect(shared.status).toBe(201);
    expect(shared.body.message).toMatchObject({
      text: 'Kyoto in June is lovely.',
      origin: 'assistant',
      user_id: t.userId,
    });
    // The asking tab is not left out: it never put the message into its own chat.
    expect(broadcasts.broadcast).toHaveBeenCalledWith(
      String(t.tripId),
      'collab:message:created',
      { message: expect.objectContaining({ origin: 'assistant' }) },
      undefined,
    );
    const listed = await get(`/api/trips/${t.tripId}/collab/messages`, t.userId);
    expect(listed.body.messages).toEqual([
      expect.objectContaining({ id: shared.body.message.id, origin: 'assistant' }),
    ]);

    const question = `msg-${Number(messageId.slice('msg-'.length)) - 1}`;
    expect((await share(question)).status).toBe(404);
    expect((await share('not-a-message')).status).toBe(404);
    const permission = vi.spyOn(nestApp.get(PermissionsService), 'checkPermission').mockResolvedValueOnce(false);
    try {
      expect((await share(messageId)).status).toBe(403);
    } finally {
      permission.mockRestore();
    }
    await setCollabFeature(orm, 'chat', false);
    try {
      expect(await share(messageId)).toMatchObject({ status: 403, body: { error: 'Collab chat is off' } });
    } finally {
      await setCollabFeature(orm, 'chat', true);
    }
    expect(await countRows(orm, CollabMessages, { trip: t.tripId })).toBe(1);
  });

  it('ASTE2E-022: an applied change keeps its card on the proposing message; a card or part this build does not know reads as nothing', async () => {
    const t = await travelerWithTrip();
    const { turn, toolCallId, threadId } = await proposePlace(t, 'Sanjusangen-do');
    const proposing = Number(ofType(turn.chunks, 'start')[0].messageId.slice('msg-'.length));
    const built: TrekCard = tourRouteCard();
    const applied = vi.spyOn(nestApp.get(AssistantCardContext), 'appliedCard').mockReturnValue(built);
    provider.script = [say('Added it.')];
    try {
      const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
        ...CTX,
        decisions: [{ toolCallId, approved: true }],
      });
      expect(applied).toHaveBeenCalledWith(
        'create_place',
        expect.objectContaining({ args: { name: 'Sanjusangen-do' } }),
      );
      const types = decided.chunks.map((chunk) => chunk.type);
      expect(types.indexOf('data-trek-card')).toBeGreaterThan(types.indexOf('data-trek-applied'));
      expect(ofType(decided.chunks, 'data-trek-card')[0].data.toolCallId).toBe(toolCallId);
    } finally {
      applied.mockRestore();
    }

    const stored = await findRow(orm, AssistantMessages, { id: proposing });
    const parts = JSON.parse(stored?.parts ?? '[]') as Array<{ type: string; data?: { toolCallId?: string } }>;
    expect(parts.filter((part) => part.type === 'data-trek-card').map((part) => part.data?.toolCallId)).toEqual([
      toolCallId,
    ]);
    const cardOf = (messages: Array<{ parts: AssistantMessagePart[] }>, id: string) =>
      messages
        .flatMap((message) => message.parts)
        .find((part) => part.type === 'data-trek-card' && part.data.toolCallId === id);
    const shown = await get(`${t.base}/threads/${threadId}`, t.userId);
    expect(shown.status).toBe(200);
    expect(cardOf(shown.body.messages, toolCallId)).toEqual({
      type: 'data-trek-card',
      data: { toolCallId, card: storedTrekCardSchema.parse(built) },
    });

    // A later build's part and kind, as a rolled back server finds them in the row.
    const later = [
      ...parts,
      { type: 'data-trek-book-page', data: { page: 3 } },
      { type: 'data-trek-card', data: { toolCallId: 'call_later', card: { kind: 'bookPage', page: 3 } } },
    ];
    await updateRows(orm, AssistantMessages, { id: proposing }, { parts: JSON.stringify(later) });
    const tolerant = await get(`${t.base}/threads/${threadId}`, t.userId);
    expect(tolerant.status).toBe(200);
    const kept = (tolerant.body.messages as Array<{ parts: AssistantMessagePart[] }>).flatMap((m) => m.parts);
    expect(kept.map((part) => part.type)).not.toContain('data-trek-book-page');
    expect(kept.map((part) => part.type)).toContain('data-trek-change');
    expect(cardOf(tolerant.body.messages, 'call_later')).toEqual({
      type: 'data-trek-card',
      data: { toolCallId: 'call_later', card: null },
    });
  });

  it('ASTE2E-023: a vacation day is held on its month with the days left, applied, told to the own tabs and taken back', async () => {
    await setAddonEnabled(orm, 'vacay', true);
    const t = await travelerWithTrip();
    provider.script = [callTools({ id: 'call_day', name: 'toggle_vacay_entry', args: { date: '2026-06-12' } })];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'Take Friday off' });
    const [held] = ofType(turn.chunks, 'tool-approval-request');
    const [change] = ofType(turn.chunks, 'data-trek-change');
    expect(change.data).toMatchObject({ toolCallId: held.toolCallId, verbKey: 'addVacationDay', domain: 'vacay' });
    const card = change.data.card;
    if (card?.kind !== 'vacay') throw new Error('the held day has no vacation card');
    expect(card.months).toEqual([{ year: 2026, month: 6 }]);
    expect(card.proposal).toMatchObject({ date: '2026-06-12', personId: t.userId, outcome: 'add', periodYear: 2026 });
    expect(card.balances.map((balance) => balance.personId)).toEqual([t.userId]);
    expect(card.tripDates).toEqual(['2026-06-11', '2026-06-12']);

    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    provider.script = [say('Friday is off.')];
    broadcasts.broadcastToUser.mockClear();
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId: held.toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    expect(ofType(decided.chunks, 'data-trek-applied')[0].data).toMatchObject({
      toolCallId: held.toolCallId,
      entity: 'vacay',
      ids: [],
      undoUntil: expect.any(String),
    });
    // The applied card follows the tool's answer, which took the day as the held card foresaw.
    const [receipt] = ofType(decided.chunks, 'data-trek-card');
    expect(receipt.data).toMatchObject({
      toolCallId: held.toolCallId,
      card: { kind: 'vacay', proposal: { date: '2026-06-12', outcome: 'add', deltas: [{ days: 1 }] } },
    });
    expect(broadcasts.broadcastToUser).toHaveBeenCalledWith(t.userId, { type: 'vacay:update' }, undefined);
    const shown = await get(`${t.base}/threads/${threadId}`, t.userId);
    expect(shown.status).toBe(200);

    // The day made half a day in the planner since: the undo would not put back what was there.
    const toggle = (body: object) =>
      request(nestApp.getHttpServer())
        .post('/api/addons/vacay/entries/toggle')
        .set('Cookie', sessionCookie(t.userId))
        .send({ date: '2026-06-12', ...body });
    const undo = () =>
      request(nestApp.getHttpServer())
        .post(`${t.base}/tool-calls/${held.toolCallId}/undo`)
        .set('Cookie', sessionCookie(t.userId))
        .send({});
    expect((await toggle({ fraction: 0.5 })).body).toMatchObject({ action: 'updated', fraction: 0.5 });
    const stale = await undo();
    expect([stale.status, stale.body.code]).toEqual([409, 'stale']);
    // A whole day again, as the change left it: the undo clears it, once.
    expect((await toggle({ fraction: 1 })).body).toMatchObject({ action: 'updated', fraction: 1 });
    expect((await undo()).status).toBe(200);
    const left = await get('/api/addons/vacay/entries/2026', t.userId);
    const days = (left.body.entries as Array<{ date: string; user_id: number }>).filter((e) => e.date === '2026-06-12');
    expect(days).toEqual([]);
    expect((await undo()).body).toMatchObject({ code: 'stale' });
  });

  it('ASTE2E-ATLAS-001: a country mark is held with its flag and counter, applied with the exact count, and told to the own tabs', async () => {
    await setAddonEnabled(orm, 'atlas', true);
    const t = await travelerWithTrip();
    provider.script = [callTools({ id: 'call_jp', name: 'mark_country_visited', args: { country_code: 'jp' } })];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'I have been to Japan' });
    const [held] = ofType(turn.chunks, 'tool-approval-request');
    const [change] = ofType(turn.chunks, 'data-trek-change');
    expect(change.data).toMatchObject({
      toolCallId: held.toolCallId,
      verbKey: 'genericCreate',
      subject: 'Japan',
      tool: 'mark_country_visited',
      domain: 'atlas',
    });
    const card = change.data.card;
    if (card?.kind !== 'atlasCountry' || !card.change?.countries) throw new Error('the held mark has no atlas card');
    const before = card.change.countries.before;
    expect(card).toMatchObject({ code: 'JP', status: null, change: { op: 'mark', after: 'visited' } });
    expect(card.change.countries.after).toBe(before + 1);

    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    provider.script = [say('Japan is on your map.')];
    broadcasts.broadcastToUser.mockClear();
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId: held.toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    expect(ofType(decided.chunks, 'data-trek-applied')[0].data).toMatchObject({
      toolCallId: held.toolCallId,
      entity: 'atlas',
      ids: [],
    });
    const [receipt] = ofType(decided.chunks, 'data-trek-card');
    expect(receipt.data).toMatchObject({
      toolCallId: held.toolCallId,
      card: { kind: 'atlasCountry', change: { after: 'visited', countries: { before, after: before + 1 } } },
    });
    expect(broadcasts.broadcastToUser).toHaveBeenCalledWith(t.userId, { type: 'atlas:changed' }, undefined);
    const shown = await get(`${t.base}/threads/${threadId}`, t.userId);
    expect(shown.status).toBe(200);
  });

  it('ASTE2E-COLLAB-001: a poll is held as the card the Collab tab draws, started on approval, with its applied card', async () => {
    const t = await travelerWithTrip();
    const question = 'Where do we eat on Friday?';
    const args = { question, options: ['Trattoria', 'Night market'] };
    provider.script = [callTools({ id: 'call_poll', name: 'create_collab_poll', args })];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'Ask the group' });
    const toolCallId = ofType(turn.chunks, 'tool-approval-request')[0]?.toolCallId ?? '';
    const [change] = ofType(turn.chunks, 'data-trek-change');
    expect(change.data).toMatchObject({
      toolCallId,
      verbKey: 'genericCreate',
      tool: 'create_collab_poll',
      domain: 'collab',
      subject: question,
      undoable: true,
    });
    const held = { kind: 'collabPolls', polls: [{ pollId: null, change: 'create', question }] };
    expect(change.data.card).toMatchObject(held);
    expect(await countRows(orm, CollabPolls, { trip: t.tripId })).toBe(0);

    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    provider.script = [say('The poll is up.')];
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    const poll = await findRow(orm, CollabPolls, { trip: t.tripId });
    expect(poll?.question).toBe(question);
    const [applied] = ofType(decided.chunks, 'data-trek-applied');
    expect(applied.data).toMatchObject({ entity: 'collab_poll', ids: [poll?.id] });
    expect(ofType(decided.chunks, 'data-trek-card')[0].data).toMatchObject({
      toolCallId,
      card: { kind: 'collabPolls', polls: [{ pollId: poll?.id, change: 'create', question }] },
    });
    expect(broadcasts.broadcast).toHaveBeenCalledWith(t.tripId, 'collab:poll:created', expect.anything());
  });

  it('ASTE2E-COLLAB-002: a chat read shows the last messages as a card beside the answer, kept with it', async () => {
    const t = await travelerWithTrip();
    await makeCollabMessage(orm, t.tripId, t.userId, { text: 'Shall we take the early train?' });
    provider.script = [
      callTools({ id: 'call_chat', name: 'list_collab_messages', args: {} }),
      say('Anna asked about the train.'),
    ];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'What is new in the chat?' });
    const [shownCard] = ofType(turn.chunks, 'data-trek-card');
    expect(shownCard.data).toMatchObject({
      toolCallId: 'call_chat',
      card: { kind: 'collabChat', earlier: 0, messages: [{ text: 'Shall we take the early train?', change: 'none' }] },
    });
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    const kept = await get(`${t.base}/threads/${threadId}`, t.userId);
    const parts = (kept.body.messages as Array<{ parts: AssistantMessagePart[] }>).flatMap((message) => message.parts);
    expect(parts.filter((part) => part.type === 'data-trek-card')).toHaveLength(1);
  });

  it('ASTE2E-BUD-001: an expense list shows its expenses as a card beside the answer, kept with it', async () => {
    const t = await travelerWithTrip();
    await makeBudgetItem(orm, t.tripId, { name: 'Ramen', category: 'food', total_price: 24 });
    provider.script = [
      callTools({ id: 'call_costs', name: 'list_budget_items', args: {} }),
      say('One expense so far.'),
    ];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'What did we spend?' });
    const [shownCard] = ofType(turn.chunks, 'data-trek-card');
    expect(shownCard.data).toMatchObject({
      toolCallId: 'call_costs',
      card: {
        kind: 'expenses',
        offset: 0,
        more: 0,
        rows: [{ name: 'Ramen', category: 'food', amount: { amount: 24 }, change: 'none' }],
      },
    });
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0].data.threadId;
    const kept = await get(`${t.base}/threads/${threadId}`, t.userId);
    const parts = (kept.body.messages as Array<{ parts: AssistantMessagePart[] }>).flatMap((message) => message.parts);
    const keptCards = parts.filter((part) => part.type === 'data-trek-card');
    expect(keptCards).toHaveLength(1);
    expect(keptCards[0]).toMatchObject({ data: { toolCallId: 'call_costs', card: { kind: 'expenses' } } });
  });
});
