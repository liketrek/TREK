/**
 * The collections in the assistant chat, end to end: the whole app (buildApp,
 * the real MCP registry with its collections addon gate, the real services
 * on a migrated temp SQLite) and an instance connection pointing at a fake
 * OpenAI-compatible server on loopback, scripted per case. A lookup of saved
 * places by id streams its card beside the answer and leaves out what the
 * user cannot see; a held save streams its change card, and once approved the
 * card of the saved place under the same tool call, with a receipt naming the
 * saved place, which an undo takes back.
 */
import { buildApp } from '../../src/bootstrap';
import { CollectionPlaces } from '../../src/db/entities/CollectionPlaces.entity';
import { addCollectionMember, makeCollection, makeCollectionPlace } from '../helpers/factories/collections';
import { countRows, findRow } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import type { CollectionPlacesCard, UiStreamChunk } from '@trek/shared';

import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

interface ChatBody {
  messages: Array<{ role: string; content: string | null; tool_call_id?: string }>;
}

type Step = () => { chunks: object[] };

const provider = { requests: [] as ChatBody[], script: [] as Step[] };

const say =
  (text: string): Step =>
  () => ({
    chunks: [
      { choices: [{ index: 0, delta: { content: text } }] },
      { choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] },
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
  let text = '';
  for await (const chunk of req) text += String(chunk);
  provider.requests.push(JSON.parse(text) as ChatBody);
  const reply = (provider.script.shift() ?? say('Nothing more.'))();
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  for (const chunk of reply.chunks) res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  res.end('data: [DONE]\n\n');
}

let app: INestApplication;
let orm: MikroORM;
let fake: HttpServer;

const CTX = { locale: 'en', timeZone: 'Europe/Berlin' };

beforeAll(async () => {
  fake = createServer((req, res) => {
    answer(req, res).catch(() => res.destroy());
  });
  await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
  app = await buildApp();
  orm = app.get(MikroORM);
  await setAddonEnabled(orm, 'ai_assistant', true);
  await setAddonEnabled(orm, 'collections', true);
  const admin = (await makeUser(orm, { role: 'admin' })).user.id;
  const { port } = fake.address() as AddressInfo;
  const res = await request(app.getHttpServer())
    .put('/api/admin/ai/connection')
    .set('Cookie', sessionCookie(admin))
    .send({ kind: 'custom', baseUrl: `http://127.0.0.1:${port}/v1`, model: 'fake-model' });
  expect(res.status).toBe(200);
});

beforeEach(async () => {
  await resetRateLimits(app);
  provider.requests = [];
  provider.script = [];
});

afterAll(async () => {
  await app.close();
  await new Promise<void>((resolve) => fake.close(() => resolve()));
});

/** A request with its whole stream read, as the chunks it sent. */
async function post(path: string, userId: number, body: object): Promise<{ status: number; chunks: UiStreamChunk[] }> {
  const res = await request(app.getHttpServer())
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
  const events = String(res.body)
    .split('\n\n')
    .filter((event) => event.startsWith('data: ') && event !== 'data: [DONE]')
    .map((event) => JSON.parse(event.slice('data: '.length)) as UiStreamChunk);
  return { status: res.status, chunks: events };
}

const ofType = <T extends UiStreamChunk['type']>(chunks: UiStreamChunk[], type: T) =>
  chunks.filter((chunk): chunk is Extract<UiStreamChunk, { type: T }> => chunk.type === type);

/** A traveller with a trip and a list of saved places, a list shared with them, and one of a stranger. */
async function travellerWithLists() {
  const { user } = await makeUser(orm);
  const { user: friend } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Paris' });
  const list = await makeCollection(orm, user.id, { name: 'Paris food', color: '#e11d48' });
  const septime = await makeCollectionPlace(orm, list.id, user.id, { name: 'Septime', status: 'want' });
  const shared = await makeCollection(orm, friend.id, { name: 'Bistros' });
  await addCollectionMember(orm, shared.id, user.id, { role: 'viewer' });
  const comptoir = await makeCollectionPlace(orm, shared.id, friend.id, { name: 'Le Comptoir' });
  const stranger = await makeCollection(orm, friend.id, { name: 'Private' });
  const secret = await makeCollectionPlace(orm, stranger.id, friend.id, { name: 'Secret spot' });
  return { userId: user.id, base: `/api/trips/${trip.id}/assistant`, list, septime, comptoir, secret };
}

describe('assistant: collections', () => {
  it('ASTE2E-COL-001: saved places read by id stream as a card and reach the model, without what the user cannot see', async () => {
    const t = await travellerWithLists();
    provider.script = [
      callTool('call_items', 'get_collection_items', { placeIds: [t.septime.id, t.comptoir.id, t.secret.id] }),
      say('Septime is on your list.'),
    ];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'What did I save?' });
    expect(turn.status).toBe(200);
    const [shown] = ofType(turn.chunks, 'data-trek-card');
    expect(shown?.data.toolCallId).toBe('call_items');
    const card = shown?.data.card as CollectionPlacesCard;
    expect(card.kind).toBe('collectionPlaces');
    expect(card.list).toBeNull();
    expect(card.places.map((place) => place.name).sort()).toEqual(['Le Comptoir', 'Septime']);
    const told = provider.requests.at(-1)?.messages.find((message) => message.tool_call_id === 'call_items');
    expect(told?.content).toContain('Septime');
    expect(told?.content).not.toContain('Secret spot');
  });

  it('ASTE2E-COL-002: a held save shows its list, is saved once approved, shows the saved place and is undone', async () => {
    const t = await travellerWithLists();
    const args = { collection_id: t.list.id, name: 'Musée Rodin', lat: 48.855, lng: 2.3158, status: 'want' };
    provider.script = [callTool('call_save', 'save_place_to_collection', args)];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'Save the Rodin museum' });
    const toolCallId = ofType(turn.chunks, 'tool-approval-request')[0]?.toolCallId ?? '';
    const [change] = ofType(turn.chunks, 'data-trek-change');
    expect(change?.data).toMatchObject({ toolCallId, subject: 'Musée Rodin', tool: 'save_place_to_collection' });
    const pending = change?.data.card as CollectionPlacesCard;
    expect(pending.list).toMatchObject({ id: t.list.id, name: 'Paris food', placeCount: 1 });
    expect(pending.places[0]).toMatchObject({ id: null, name: 'Musée Rodin', status: 'want' });
    expect(await countRows(orm, CollectionPlaces, { name: 'Musée Rodin' })).toBe(0);

    const threadId = ofType(turn.chunks, 'data-trek-thread')[0]?.data.threadId;
    provider.script = [say('Saved it.')];
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    const saved = await findRow(orm, CollectionPlaces, { name: 'Musée Rodin' });
    expect(saved).not.toBeNull();
    const [applied] = ofType(decided.chunks, 'data-trek-applied');
    expect(applied?.data).toMatchObject({ toolCallId, entity: 'collection_place', ids: [saved?.id] });
    expect(applied?.data.undoUntil).toEqual(expect.any(String));
    const [receipt] = ofType(decided.chunks, 'data-trek-card');
    expect(receipt?.data.toolCallId).toBe(toolCallId);
    const savedCard = receipt?.data.card as CollectionPlacesCard;
    expect(savedCard.places[0]).toMatchObject({ id: saved?.id, name: 'Musée Rodin' });

    const undone = await request(app.getHttpServer())
      .post(`${t.base}/tool-calls/${toolCallId}/undo`)
      .set('Cookie', sessionCookie(t.userId))
      .send({});
    expect(undone.status).toBe(200);
    expect(undone.body).toEqual({ undone: true });
    expect(await countRows(orm, CollectionPlaces, { name: 'Musée Rodin' })).toBe(0);
  });
});
