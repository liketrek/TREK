/**
 * Trip assistant e2e for the tours: the whole app (buildApp, every global
 * guard, the Zod pipe, the response contracts, the real MCP registry with
 * its addon gates) with an instance connection to a fake OpenAI-compatible
 * server on loopback, scripted per case. The hike planner itself is stubbed
 * on the container's HikePlanService (its routing has suites of its own,
 * tours-hike.e2e): the proposal it answers, and the hike it creates on a
 * real place of the trip.
 *
 * Covered: a proposed hike streams and stores its route card, its line for
 * drawing asked for by the server and kept from the model; "Plan this" holds
 * the hike as a change card from the stored proposal, refused for an unknown
 * proposal and while it waits; applying it runs create_hike without a model
 * turn and names the tour in the receipt and on its card. Taking a proposal
 * asks for the right to edit places, like the tour routes: 403 without it,
 * 404 outside the trip.
 */
import { buildApp } from '../../src/bootstrap';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { HikePlanService } from '../../src/nest/tours/hike-plan.service';
import { makePlace } from '../helpers/factories/places';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import type { AssistantMessagePart, HikeProposal, HikeProposeRequest, UiStreamChunk } from '@trek/shared';

import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ── The fake provider ─────────────────────────────────────────────────────────

interface ChatBody {
  messages: Array<{ role: string; content: string | null }>;
  tools?: Array<{ function: { name: string; parameters: { properties?: Record<string, unknown> } } }>;
}

type Step = () => { chunks: object[] };

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
  provider.requests.push(JSON.parse(await readBody(req)) as ChatBody);
  const reply = (provider.script.shift() ?? say('Nothing more.'))();
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
  await setAddonEnabled(orm, 'tours', true);
  const admin = (await makeUser(orm, { role: 'admin' })).user.id;
  const { port } = fake.address() as AddressInfo;
  const res = await request(nestApp.getHttpServer())
    .put('/api/admin/ai/connection')
    .set('Cookie', sessionCookie(admin))
    .send({ kind: 'custom', baseUrl: `http://127.0.0.1:${port}/v1`, model: 'fake-model' });
  expect(res.status).toBe(200);
});

beforeEach(async () => {
  await resetRateLimits(nestApp);
  provider.requests = [];
  provider.script = [];
  vi.restoreAllMocks();
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
  expect(events.at(-1)).toBe('[DONE]');
  const chunks = events.slice(0, -1).map((event) => JSON.parse(event) as UiStreamChunk);
  return { status: res.status, chunks, json: null };
}

const ofType = <T extends UiStreamChunk['type']>(chunks: UiStreamChunk[], type: T) =>
  chunks.filter((chunk): chunk is Extract<UiStreamChunk, { type: T }> => chunk.type === type);

const WAYPOINTS = [
  { lat: 47.6, lng: 11.3, name: 'Car park' },
  { lat: 47.61, lng: 11.3, name: 'Summit', poi_category: 'peak' as const },
];

const LINE: HikeProposal['line_geometry'] = [
  [47.6, 11.3, 800],
  [47.61, 11.3, 880],
];
const PROFILE: HikeProposal['profile_geometry'] = [
  [0, 800],
  [1112, 880],
];

/** What the planner answers for the hike: a routed way of 1.1 km, its line only when asked for. */
function proposalFor(asked: HikeProposeRequest): HikeProposal {
  return {
    name: asked.name,
    variant_label: null,
    route: { planned: true },
    unreachable: null,
    distance_m: 1112,
    ascent_m: 80,
    descent_m: 0,
    duration_minutes: 22,
    duration_basis: 'din33466',
    heights_known: true,
    min_ele_m: 800,
    max_ele_m: 880,
    ...(asked.include_geometry ? { line_geometry: LINE, profile_geometry: PROFILE } : {}),
    sac: { segments: [{ from_m: 0, to_m: 1112, sac: 2 }], highest: 2, unknown_share: 0 },
    high_point: { lat: 47.61, lng: 11.3, ele_m: 880, at_m: 1112 },
    waypoints: [
      { ...WAYPOINTS[0], poi_category: null, at_m: 0, snapped_m: 2, minutes: 0, arrival: null, stage_end: false },
      { ...WAYPOINTS[1], at_m: 1112, snapped_m: 3, minutes: 22, arrival: null, stage_end: false },
    ],
    along: null,
    max_hiking_difficulty: 2,
    hiking_preferences: null,
    round_trip: false,
    day_id: null,
    date: null,
    start_time: null,
    schedule: null,
    warnings: [],
  };
}

/** A traveller with a trip, the tour place create_hike will answer with, and the planner stubbed. */
async function travellerWithPlanner() {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Bavaria' });
  const place = await makePlace(orm, trip.id, { name: 'Herzogstand', category: null });
  const hikes = nestApp.get(HikePlanService);
  const propose = vi.spyOn(hikes, 'propose').mockImplementation(async (_u, _t, req) => proposalFor(req));
  const create = vi.spyOn(hikes, 'create').mockResolvedValue({
    tour: { place_id: place.id, name: 'Herzogstand' },
    waypoints: [],
    route: { planned: true },
    assignment: null,
  } as unknown as Awaited<ReturnType<HikePlanService['create']>>);
  const base = `/api/trips/${trip.id}/assistant`;
  return { userId: user.id, tripId: trip.id, placeId: place.id, base, propose, create };
}

/** A turn that loads the tours and proposes the hike. */
async function proposeTurn(t: { userId: number; base: string }) {
  provider.script = [
    callTool('call_tours', 'use_addon_tools', { groups: ['tours'] }),
    callTool('call_hike', 'propose_hike', { name: 'Herzogstand', waypoints: WAYPOINTS }),
    say('A short hike up the Herzogstand.'),
  ];
  const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'A hike up the Herzogstand?' });
  return { turn, threadId: ofType(turn.chunks, 'data-trek-thread')[0].data.threadId };
}

// ── Cases ────────────────────────────────────────────────────────────────────

describe('a proposed hike in the chat', () => {
  it('ASTE2E-TOUR-001: streams and stores its route card; the line is asked for by the server and kept from the model', async () => {
    const t = await travellerWithPlanner();
    const { turn, threadId } = await proposeTurn(t);

    expect(t.propose).toHaveBeenCalledWith(
      t.userId,
      t.tripId,
      expect.objectContaining({ name: 'Herzogstand', include_geometry: true }),
    );
    const [card] = ofType(turn.chunks, 'data-trek-card');
    expect(card?.data).toMatchObject({
      toolCallId: 'call_hike',
      card: { kind: 'tourRoute', source: 'proposal', name: 'Herzogstand', routed: true, distanceM: 1112 },
    });
    // The model never sees the flag nor the line: neither in the tool it is offered nor in the answer it reads.
    const last = provider.requests.at(-1);
    const offered = last?.tools?.find((tool) => tool.function.name === 'propose_hike');
    expect(offered).toBeDefined();
    expect(Object.keys(offered?.function.parameters.properties ?? {})).not.toContain('include_geometry');
    expect(JSON.stringify(last?.messages)).not.toContain('line_geometry');

    const shown = await request(nestApp.getHttpServer())
      .get(`${t.base}/threads/${threadId}`)
      .set('Cookie', sessionCookie(t.userId));
    expect(shown.status).toBe(200);
    const parts = (shown.body.messages as Array<{ parts: AssistantMessagePart[] }>).flatMap((m) => m.parts);
    expect(parts).toContainEqual(
      expect.objectContaining({
        type: 'data-trek-card',
        data: expect.objectContaining({ toolCallId: 'call_hike' }),
      }),
    );
  });

  it('ASTE2E-TOUR-002: "Plan this" holds the hike from the stored proposal; applying it creates the tour without a model turn', async () => {
    const t = await travellerWithPlanner();
    const { threadId } = await proposeTurn(t);
    const path = `${t.base}/threads/${threadId}/proposals`;

    const unknown = await post(path, t.userId, { ...CTX, toolCallId: 'call_nope' });
    expect(unknown).toMatchObject({ status: 404, json: { code: 'not_found' } });
    const taken = await post(path, t.userId, { ...CTX, toolCallId: 'call_hike' });
    expect(taken.status).toBe(200);
    const parts = (taken.json?.message as { parts: AssistantMessagePart[] }).parts;
    const change = parts.find((part) => part.type === 'data-trek-change');
    expect(change?.type === 'data-trek-change' && change.data).toMatchObject({
      verbKey: 'addTour',
      subject: 'Herzogstand',
      card: { kind: 'tourRoute', source: 'pending', routed: true },
    });
    expect(parts).toContainEqual(expect.objectContaining({ type: 'tool-call', toolName: 'take_proposal' }));
    const twice = await post(path, t.userId, { ...CTX, toolCallId: 'call_hike' });
    expect(twice).toMatchObject({ status: 409, json: { code: 'decide_first' } });

    const toolCallId = change?.type === 'data-trek-change' ? change.data.toolCallId : '';
    const asked = provider.requests.length;
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId, approved: true }],
    });
    expect(decided.status).toBe(200);
    expect(provider.requests).toHaveLength(asked);
    expect(t.create).toHaveBeenCalledWith(
      t.userId,
      t.tripId,
      expect.objectContaining({ name: 'Herzogstand', waypoints: WAYPOINTS }),
    );
    expect(t.create.mock.calls[0]?.[2]).not.toHaveProperty('via');
    const [applied] = ofType(decided.chunks, 'data-trek-applied');
    expect(applied?.data).toMatchObject({ toolCallId, entity: 'tour', ids: [t.placeId] });
    // The card the change showed stays beside the receipt, now naming the tour it created.
    const [receipt] = ofType(decided.chunks, 'data-trek-card');
    expect(receipt?.data).toMatchObject({ toolCallId, card: { kind: 'tourRoute', placeId: t.placeId } });
  });

  it('ASTE2E-TOUR-003: "Plan this" asks for the right to edit places: 403 and nothing held without it, 404 outside the trip', async () => {
    const t = await travellerWithPlanner();
    const { user: member } = await makeUser(orm);
    await addTripMember(orm, t.tripId, member.id);
    const { threadId } = await proposeTurn({ userId: member.id, base: t.base });
    const path = `${t.base}/threads/${threadId}/proposals`;

    const permissions = vi.spyOn(nestApp.get(PermissionsService), 'checkPermission');
    permissions.mockImplementation((action: string) => Promise.resolve(action !== 'place_edit'));
    try {
      const refused = await post(path, member.id, { ...CTX, toolCallId: 'call_hike' });
      expect([refused.status, refused.json]).toEqual([403, { error: 'No permission' }]);
      expect(permissions).toHaveBeenCalledWith('place_edit', expect.any(String), t.userId, member.id, true);
    } finally {
      permissions.mockRestore();
    }
    const shown = await request(nestApp.getHttpServer())
      .get(`${t.base}/threads/${threadId}`)
      .set('Cookie', sessionCookie(member.id));
    const parts = (shown.body.messages as Array<{ parts: AssistantMessagePart[] }>).flatMap((m) => m.parts);
    expect(parts.some((part) => part.type === 'tool-call' && part.toolName === 'take_proposal')).toBe(false);

    const { user: stranger } = await makeUser(orm);
    const outside = await post(path, stranger.id, { ...CTX, toolCallId: 'call_hike' });
    expect([outside.status, outside.json]).toEqual([404, { error: 'Trip not found' }]);

    // With the right, the same member takes the same proposal.
    expect((await post(path, member.id, { ...CTX, toolCallId: 'call_hike' })).status).toBe(200);
  });
});
