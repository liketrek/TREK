/**
 * The road trip in the assistant chat, end to end: the whole app (buildApp,
 * the real MCP registry with its road trip addon gate, the real services on a
 * migrated temp SQLite) and an instance connection pointing at a fake
 * OpenAI-compatible server on loopback, scripted per case. A held change to
 * the driving settings streams its rules card, read against what is saved;
 * the thread it is stored in still reads back, the card with it; once
 * approved the setting is saved and the receipt names the road trip.
 */
import { buildApp } from '../../src/bootstrap';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import type { AssistantMessagePart, RoadtripRulesCard, UiStreamChunk } from '@trek/shared';

import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

type Step = () => { chunks: object[] };

const provider = { requests: [] as string[], script: [] as Step[] };

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
  provider.requests.push(text);
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
  await setAddonEnabled(orm, 'roadtrip', true);
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

describe('assistant: road trip', () => {
  it('ASTE2E-RT-001: a held settings change shows its rules card, reads back from the thread, then saves', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Alps' });
    const base = `/api/trips/${trip.id}/assistant`;
    const settings = { roadtrip_hotel_bookends: true };
    provider.script = [callTool('call_rules', 'update_roadtrip_settings', { settings })];
    const turn = await post(`${base}/chat`, user.id, { ...CTX, threadId: null, text: 'Start each day at the hotel' });
    expect(turn.status).toBe(200);
    expect(provider.requests).toHaveLength(1);
    const toolCallId = ofType(turn.chunks, 'tool-approval-request')[0]?.toolCallId ?? '';
    const [change] = ofType(turn.chunks, 'data-trek-change');
    expect(change?.data).toMatchObject({ toolCallId, tool: 'update_roadtrip_settings' });
    const pending = change?.data.card as RoadtripRulesCard;
    expect(pending).toEqual({
      kind: 'roadtripRules',
      settings: [{ key: 'roadtrip_hotel_bookends', before: null, after: true }],
      dayEnd: null,
    });

    const threadId = ofType(turn.chunks, 'data-trek-thread')[0]?.data.threadId;
    const shown = await request(app.getHttpServer())
      .get(`${base}/threads/${threadId}`)
      .set('Cookie', sessionCookie(user.id));
    expect(shown.status).toBe(200);
    const parts = shown.body.messages.flatMap((message: { parts: AssistantMessagePart[] }) => message.parts);
    const stored = parts.find((part: AssistantMessagePart) => part.type === 'data-trek-change');
    expect(stored?.data.card).toEqual(pending);

    provider.script = [say('Done, each day now starts at your stay.')];
    const decided = await post(`${base}/threads/${threadId}/decisions`, user.id, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    const [applied] = ofType(decided.chunks, 'data-trek-applied');
    expect(applied?.data).toMatchObject({ toolCallId, entity: 'roadtrip' });
    const saved = await request(app.getHttpServer())
      .get(`/api/trips/${trip.id}/roadtrip/preferences`)
      .set('Cookie', sessionCookie(user.id));
    expect(saved.status).toBe(200);
    expect(saved.body.preferences).toMatchObject(settings);
  });
});
