/**
 * The book's change cards in TREK Studio, end to end: the whole app (buildApp,
 * every global guard, the Zod pipe, the response contracts, the real MCP
 * registry) with an instance connection of kind `custom` pointing at a fake
 * OpenAI-compatible server on loopback, scripted per case.
 *
 * Covered: a page edit that would leave empty frames goes back to the model
 * once, the same call made again is held with its page card (pages, the
 * operations, the findings, the page after as the trial made it), applied
 * with a receipt card, and taken back in one undo while nothing was saved
 * since; an operation the engine refuses never reaches the user; new pages
 * are not taken back once the book moved on, and neither is an edited page
 * once that page was saved since (the restore checks the page as the change
 * left it). A save to another page does not hold an edit's undo back, so of
 * two changes to one page applied together "undo all" takes back the newer,
 * then the older; changes apply in the order the decisions name them. A page
 * is previewed with the ops of an edit before it is proposed, nothing saved;
 * on this text-only model the preview is the page's description alone.
 */
import { buildApp } from '../../src/bootstrap';
import { withRequestContext } from '../../src/nest/database/request-context';
import { JourneyBookEditService } from '../../src/nest/journey/journey-book-edit.service';
import { makeJourney } from '../helpers/factories/journeys';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import type { BookPageOp, UiStreamChunk } from '@trek/shared';

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

beforeAll(async () => {
  fake = createServer((req, res) => {
    answer(req, res).catch(() => res.destroy());
  });
  await new Promise<void>((resolve) => fake.listen(0, '127.0.0.1', resolve));
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
  books = nestApp.get(JourneyBookEditService);
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
});

afterAll(async () => {
  await nestApp.close();
  await new Promise<void>((resolve) => fake.close(() => resolve()));
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const CTX = { locale: 'en', timeZone: 'Europe/Lisbon' };

async function stream(path: string, userId: number, body: object): Promise<UiStreamChunk[]> {
  const res = await request(nestApp.getHttpServer())
    .post(path)
    .set('Cookie', sessionCookie(userId))
    .send(body)
    .buffer(true)
    .parse((s, done) => {
      let text = '';
      s.setEncoding('utf8');
      s.on('data', (chunk: string) => (text += chunk));
      s.on('end', () => done(null, text));
    });
  expect(res.status).toBe(200);
  return (res.body as string)
    .split('\n\n')
    .filter((event) => event.startsWith('data: ') && event !== 'data: [DONE]')
    .map((event) => JSON.parse(event.slice('data: '.length)) as UiStreamChunk);
}

const ofType = <T extends UiStreamChunk['type']>(chunks: UiStreamChunk[], type: T) =>
  chunks.filter((chunk): chunk is Extract<UiStreamChunk, { type: T }> => chunk.type === type);

/** A call on the book service as the Studio's own save makes it: in a request's ORM context, as HTTP runs one. */
const inContext = <T>(work: () => Promise<T>): Promise<T> => withRequestContext(orm, work);

/** The book as `get_book` reads it for the journey's owner. */
const bookOf = (j: { journeyId: number; userId: number }) => inContext(() => books.overview(j.journeyId, j.userId));

/** A user with a journey of their own and a blank book in it: its double page is `inner`. */
async function ownerWithBook() {
  const { user } = await makeUser(orm);
  const journey = await makeJourney(orm, user.id, { title: 'Portugal by train' });
  const created = await inContext(() => books.createBook(journey.id, user.id, {}));
  const inner = created.pages.find((page) => page.role === 'inner')?.id ?? 'no inner page';
  return { userId: user.id, journeyId: journey.id, inner, base: `/api/journeys/${journey.id}/assistant` };
}

/** Approves held changes, in this order, and answers what the model says next. */
function approve(base: string, userId: number, threadId: number, ...toolCallIds: string[]) {
  provider.script = [say('Done.')];
  return stream(`${base}/threads/${threadId}/decisions`, userId, {
    ...CTX,
    decisions: toolCallIds.map((toolCallId) => ({ toolCallId, approved: true })),
  });
}

/** One page's paper changed by the model: no fault, so the gate holds it at once. */
const paper = (id: string, spreadId: string, color: string) => ({
  id,
  name: 'edit_book_page',
  args: { spreadId, ops: [{ op: 'background', color }] },
});

function undo(base: string, userId: number, toolCallId: string) {
  return request(nestApp.getHttpServer())
    .post(`${base}/tool-calls/${toolCallId}/undo`)
    .set('Cookie', sessionCookie(userId))
    .send({});
}

const TWO_UP = [{ op: 'layout', template: 'two-up' }];

// ── Cases ────────────────────────────────────────────────────────────────────

describe('Studio book cards e2e', () => {
  it('ASTBKE2E-001: a page left with empty frames goes back once, is held with its card, applied and taken back', async () => {
    const j = await ownerWithBook();
    const edit = { spreadId: j.inner, ops: TWO_UP };
    provider.script = [callTool('call_1', 'edit_book_page', edit), callTool('call_2', 'edit_book_page', edit)];
    const turn = await stream(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Two photos here' });

    const [bounced] = ofType(turn, 'tool-output-error');
    expect(bounced).toMatchObject({ toolCallId: 'call_1', errorText: expect.stringContaining('Not proposed yet') });
    expect(bounced?.errorText).toContain('empty_frame');
    const toModel = provider.requests[1]?.messages.find((message) => message.tool_call_id === 'call_1');
    expect(toModel?.content).toContain('Not proposed yet');

    const [held] = ofType(turn, 'tool-approval-request');
    const [change] = ofType(turn, 'data-trek-change');
    expect(change?.data).toMatchObject({ verbKey: 'editBookPage', undoable: true });
    expect(change?.data.card).toMatchObject({
      kind: 'bookPage',
      journeyId: j.journeyId,
      change: 'changed',
      baseVersion: 1,
      pages: [{ spreadId: j.inner, role: 'inner', number: 1 }],
      ops: [{ op: 'layout', template: 'two-up' }],
      layout: { kind: 'template', id: 'two-up', name: null },
    });
    expect(change?.data.card?.kind === 'bookPage' && change.data.card.findings).toContainEqual({
      code: 'empty_frame',
      severity: 'severe',
    });
    // The page after rides on the card as the server's trial made it: the layout's two frames, both empty.
    const trialPage = change?.data.card?.kind === 'bookPage' ? change.data.card.after : undefined;
    expect(trialPage?.id).toBe(j.inner);
    expect(trialPage?.elements.filter((element) => element.kind === 'photo')).toHaveLength(2);
    const threadId = ofType(turn, 'data-trek-thread')[0]?.data.threadId ?? 0;

    const decided = await approve(j.base, j.userId, threadId, held?.toolCallId ?? '');
    const [receipt] = ofType(decided, 'data-trek-card');
    expect(receipt?.data).toMatchObject({
      toolCallId: held?.toolCallId,
      card: { kind: 'bookPage', baseVersion: 2, pages: [{ spreadId: j.inner }] },
    });
    // Once applied the Studio draws the page as it is: the receipt carries no page of the trial.
    expect(receipt?.data.card).not.toHaveProperty('after');
    // The pages the answer kept for the undo never reach the model or the chat.
    expect(JSON.stringify(ofType(decided, 'tool-output-available'))).not.toContain('previous_spreads');
    expect(JSON.stringify(ofType(decided, 'tool-output-available'))).not.toContain('page_digests');
    expect((await bookOf(j)).spreads[2]?.emptyFrames).toBe(2);

    const undone = await undo(j.base, j.userId, held?.toolCallId ?? '');
    expect(undone.status).toBe(200);
    const after = await bookOf(j);
    expect([after.version, after.spreads[2]?.elements]).toEqual([3, 0]);
    expect((await undo(j.base, j.userId, held?.toolCallId ?? '')).body).toMatchObject({ code: 'stale' });
  });

  it('ASTBKE2E-002: an operation the engine refuses goes back to the model at once and is never held', async () => {
    const j = await ownerWithBook();
    const outside = { spreadId: j.inner, ops: [{ op: 'place_photo', photoId: 999_999, target: 'new' }] };
    provider.script = [callTool('call_out', 'edit_book_page', outside), say('That photo is not in the journey.')];
    const turn = await stream(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Use my best photo' });
    expect(ofType(turn, 'tool-output-error')).toEqual([
      { type: 'tool-output-error', toolCallId: 'call_out', errorText: expect.stringMatching(/^ops\[0\]: /) },
    ]);
    expect(ofType(turn, 'tool-approval-request')).toHaveLength(0);
    expect((await bookOf(j)).version).toBe(1);
  });

  it('ASTBKE2E-003: new pages are deleted again by undo, but not once the book was saved since', async () => {
    const j = await ownerWithBook();
    const add = { afterSpreadId: j.inner, count: 2 };
    provider.script = [callTool('call_add', 'add_book_pages', add)];
    const first = await stream(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Two more pages' });
    const [held] = ofType(first, 'tool-approval-request');
    expect(ofType(first, 'data-trek-change')[0]?.data.card).toMatchObject({ change: 'new', count: 2 });
    const threadId = ofType(first, 'data-trek-thread')[0]?.data.threadId ?? 0;
    await approve(j.base, j.userId, threadId, held?.toolCallId ?? '');
    expect((await bookOf(j)).spreads).toHaveLength(7);

    // Someone saves the book after the change: the undo would delete pages that are no longer just as added.
    const warmer: BookPageOp[] = [{ op: 'background', color: '#f4efe6' }];
    await inContext(() => books.editPage(j.journeyId, j.userId, { spreadId: j.inner, ops: warmer }));
    const stale = await undo(j.base, j.userId, held?.toolCallId ?? '');
    expect(stale.status).toBe(409);
    expect(stale.body).toMatchObject({ code: 'stale' });
    expect((await bookOf(j)).spreads).toHaveLength(7);
  });

  it('ASTBKE2E-004: an edited page is not put back once the book was saved since; the page keeps that save', async () => {
    const j = await ownerWithBook();
    provider.script = [callTools(paper('call_bg', j.inner, '#f4efe6'))];
    const first = await stream(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Warmer paper' });
    const [held] = ofType(first, 'tool-approval-request');
    const threadId = ofType(first, 'data-trek-thread')[0]?.data.threadId ?? 0;
    await approve(j.base, j.userId, threadId, held?.toolCallId ?? '');
    expect((await bookOf(j)).version).toBe(2);

    // The Studio saves a heading on the same page after the change.
    const heading: BookPageOp[] = [{ op: 'text', role: 'heading', text: 'Alfama' }];
    await inContext(() => books.editPage(j.journeyId, j.userId, { spreadId: j.inner, ops: heading }));
    const stale = await undo(j.base, j.userId, held?.toolCallId ?? '');
    expect(stale.status).toBe(409);
    expect(stale.body).toMatchObject({ code: 'stale' });
    const after = await bookOf(j);
    expect([after.version, after.spreads[2]?.elements]).toEqual([3, 1]);
  });

  it('ASTBKE2E-005: of two changes to one page applied together, "undo all" takes back the newer, then the older', async () => {
    const j = await ownerWithBook();
    provider.script = [callTools(paper('call_a', j.inner, '#f4efe6'), paper('call_b', j.inner, '#e6eef4'))];
    const first = await stream(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Try two papers' });
    const held = ofType(first, 'tool-approval-request').map((part) => part.toolCallId);
    expect(held).toHaveLength(2);
    const threadId = ofType(first, 'data-trek-thread')[0]?.data.threadId ?? 0;
    await approve(j.base, j.userId, threadId, ...held);
    // Applied in the order the decisions name them, which is the order they were proposed in: the second paper stays.
    const applied = await bookOf(j);
    expect([applied.version, applied.spreads[2]?.background]).toEqual([3, '#e6eef4']);

    // Newest first, as "undo all" runs: each restore checks only its own page, as its change left it.
    expect((await undo(j.base, j.userId, held[1] ?? '')).status).toBe(200);
    expect((await bookOf(j)).spreads[2]?.background).toBe('#f4efe6');
    expect((await undo(j.base, j.userId, held[0] ?? '')).status).toBe(200);
    const after = await bookOf(j);
    expect([after.version, after.spreads[2]?.background]).toEqual([5, null]);
  });

  it('ASTBKE2E-006: a preview shows a proposed page in words, saves nothing, asks a text model no image', async () => {
    const j = await ownerWithBook();
    const edit = { spreadId: j.inner, ops: [{ op: 'background', color: '#f4efe6' }] };
    provider.script = [callTools({ id: 'call_look', name: 'preview_book_page', args: edit }), say('It reads well.')];
    const body = { ...CTX, threadId: null, text: 'Warmer paper?', renders: true };
    const turn = await stream(`${j.base}/chat`, j.userId, body);

    const offered = provider.requests[0]?.tools?.find((tool) => tool.function.name === 'preview_book_page');
    // With the edit's ops the preview also takes a design draft's id (ASTPVW-005).
    expect(Object.keys(offered?.function.parameters.properties ?? {})).toEqual(['spreadId', 'ops', 'designId']);
    expect(ofType(turn, 'tool-output-available').map((part) => part.toolCallId)).toEqual(['call_look']);
    expect(ofType(turn, 'data-trek-render-request')).toEqual([]);
    const [view] = ofType(turn, 'data-trek-page-view');
    expect(view?.data).toMatchObject({ spreadId: j.inner, bookVersion: 1, width: null, height: null, bytes: null });
    const answer = provider.requests[1]?.messages.find((message) => message.tool_call_id === 'call_look');
    expect(answer?.content).toContain('"proposed":true');
    expect(answer?.content).toContain('Findings');
    expect((await bookOf(j)).version).toBe(1);
  });

  it('ASTBKE2E-007: an edited page is put back though another page was saved since, and that save stays', async () => {
    const j = await ownerWithBook();
    provider.script = [callTools(paper('call_bg', j.inner, '#f4efe6'))];
    const first = await stream(`${j.base}/chat`, j.userId, { ...CTX, threadId: null, text: 'Warmer paper' });
    const [held] = ofType(first, 'tool-approval-request');
    const threadId = ofType(first, 'data-trek-thread')[0]?.data.threadId ?? 0;
    await approve(j.base, j.userId, threadId, held?.toolCallId ?? '');

    // The Studio saves the first page after the change: the book's version moves on, the edited page does not.
    const firstPage = (await bookOf(j)).spreads.find((spread) => spread.role === 'first')?.id ?? 'no first page';
    const dark: BookPageOp[] = [{ op: 'background', color: '#101010' }];
    await inContext(() => books.editPage(j.journeyId, j.userId, { spreadId: firstPage, ops: dark }));
    expect((await undo(j.base, j.userId, held?.toolCallId ?? '')).status).toBe(200);
    const after = await bookOf(j);
    expect(after.version).toBe(4);
    expect(after.spreads.map((spread) => [spread.id, spread.background])).toEqual(
      expect.arrayContaining([
        [j.inner, null],
        [firstPage, '#101010'],
      ]),
    );
  });
});
