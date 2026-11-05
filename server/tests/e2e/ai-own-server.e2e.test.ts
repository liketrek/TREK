/**
 * An "Own server" that is OpenAI-compatible but not Ollama, end to end: the
 * whole app against a fake server on loopback that only answers under
 * `/openai/v1`, the way Groq does, and 404s every Ollama path.
 *
 * Covered: connecting it as the instance connection (#2808), the refusal that
 * says the server answered without a model list, a refused key, and a booking
 * read through it by AI parsing, which used to call Ollama's `/api/chat` and
 * fail with the server's 404 (#2806).
 */
import { buildApp } from '../../src/bootstrap';
import { withRequestContext } from '../../src/nest/database/request-context';
import { LlmParseService } from '../../src/nest/llm-parse/llm-parse.service';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// ── The fake server ──────────────────────────────────────────────────────────

/** How the fake answers: as Groq does, with 200 and a page for every path, or refusing every key. */
const server = { mode: 'groq' as 'groq' | 'html' | 'refuse', seen: [] as string[], chats: [] as unknown[] };

async function readBody(req: IncomingMessage): Promise<string> {
  let text = '';
  for await (const chunk of req) text += String(chunk);
  return text;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function answer(req: IncomingMessage, res: ServerResponse): Promise<void> {
  server.seen.push(`${req.method} ${req.url}`);
  const body = await readBody(req);
  if (server.mode === 'refuse') return json(res, 401, { error: { message: 'Invalid API Key' } });
  if (server.mode === 'html') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<html><body>Sign in</body></html>');
    return;
  }
  if (req.method === 'GET' && req.url === '/openai/v1/models') {
    return json(res, 200, { object: 'list', data: [{ id: 'openai/gpt-oss-120b', object: 'model' }] });
  }
  if (req.method === 'POST' && req.url === '/openai/v1/chat/completions') {
    server.chats.push(JSON.parse(body));
    const hotel = {
      name: 'Hotel Sakura',
      address: '1-2-3 Asakusa, Tokyo',
      checkin_time: '2026-11-02T15:00:00',
      checkout_time: '2026-11-05T11:00:00',
    };
    const result = { result: [hotel] };
    return json(res, 200, { choices: [{ message: { content: JSON.stringify(result) }, finish_reason: 'stop' }] });
  }
  json(res, 404, {
    error: {
      message: `Unknown request URL: ${req.method} ${req.url}.`,
      type: 'invalid_request_error',
      code: 'unknown_url',
    },
  });
}

// ── The app ──────────────────────────────────────────────────────────────────

let nestApp: INestApplication;
let orm: MikroORM;
let fake: HttpServer;
let adminId: number;

function connect(apiKey = 'gsk_test'): request.Test {
  const { port } = fake.address() as AddressInfo;
  return request(nestApp.getHttpServer())
    .put('/api/admin/ai/connection')
    .set('Cookie', sessionCookie(adminId))
    .send({ kind: 'custom', baseUrl: `http://127.0.0.1:${port}/openai/v1`, apiKey, model: 'openai/gpt-oss-120b' });
}

beforeAll(async () => {
  fake = createServer((req, res) => {
    answer(req, res).catch(() => res.destroy());
  });
  await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
  await setAddonEnabled(orm, 'ai_assistant', true);
  adminId = (await makeUser(orm, { role: 'admin' })).user.id;
});

beforeEach(async () => {
  await resetRateLimits(nestApp);
  server.mode = 'groq';
  server.seen = [];
  server.chats = [];
});

afterAll(async () => {
  await nestApp.close();
  await new Promise<void>((resolve) => fake.close(() => resolve()));
});

// ── Cases ────────────────────────────────────────────────────────────────────

describe('An OpenAI-compatible own server', () => {
  it('AIOWN-E2E-001: connects, its models read from the list at the address as entered (#2808)', async () => {
    const res = await connect();
    expect(res.status).toBe(200);
    expect(server.seen.slice(0, 2)).toEqual(['GET /openai/api/tags', 'GET /openai/v1/models']);
  });

  it('AIOWN-E2E-002: a server that answers without a model list is told apart from one that is down', async () => {
    server.mode = 'html';
    // Its own key, so the list the first case read is not taken from the catalog's cache.
    const res = await connect('gsk_html');
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ code: 'provider_unavailable', reason: 'no_model_list' });
  });

  it('AIOWN-E2E-003: a refused key reads as a refused key, not as a server that is down', async () => {
    server.mode = 'refuse';
    const res = await connect('wrong');
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ code: 'invalid_key' });
  });

  it('AIOWN-E2E-004: AI parsing reads a booking through /chat/completions when /api/chat is missing (#2806)', async () => {
    expect((await connect()).status).toBe(200);
    await setAddonEnabled(orm, 'llm_parsing', true);
    server.seen = [];
    // Outside a request, so it needs its own ORM context, as a job would.
    const booking = {
      buffer: Buffer.from('Booking confirmation\nHotel Sakura, Tokyo\nCheck-in 2 Nov 2026, check-out 5 Nov 2026'),
      originalName: 'booking.txt',
    };
    const out = await withRequestContext(orm, () => nestApp.get(LlmParseService).parse(booking, adminId));
    expect(out.warnings.filter((w) => /failed/i.test(w))).toEqual([]);
    expect(out.kiItems).toHaveLength(1);
    expect(server.seen).toContain('POST /openai/api/chat');
    expect(server.seen).toContain('POST /openai/v1/chat/completions');
    const sent = server.chats[0] as { model: string; messages: { role: string }[] };
    expect(sent.model).toBe('openai/gpt-oss-120b');
  });
});
