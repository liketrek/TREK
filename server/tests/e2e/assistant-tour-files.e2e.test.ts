/**
 * Trip assistant e2e for P6 and P7, the whole app (buildApp, every global
 * guard, the Zod pipe, the response contracts, the real MCP registry with
 * its addon gates) with an instance connection to a fake OpenAI-compatible
 * server on loopback, scripted per case.
 *
 * Covered: a GPX file attached in the chat is read into its tracks without a
 * model turn, each held as a change card that takes it in as a hike, the GPX
 * text kept off the thread; applying one imports exactly that track through
 * import_tour_gpx and undoing it deletes the tour again; a file without a
 * track ends with no_tracks_found. A stop the model takes into a saved hike
 * with insert_tour_stop is held with its card, saved through update_tour's
 * write when applied (the planner stubbed on the container, as in
 * assistant-tours.e2e), its receipt offering the way back.
 */
import { buildApp } from '../../src/bootstrap';
import { Places } from '../../src/db/entities/Places.entity';
import { HikePlanService } from '../../src/nest/tours/hike-plan.service';
import { makePlace } from '../helpers/factories/places';
import { countRows, findRow } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTourWaypoints, makeTour } from '../helpers/factories/tours';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import type { AssistantMessagePart, UiStreamChunk } from '@trek/shared';

import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ASTE2E-TOURFILE-001 to ASTE2E-TOURFILE-004

// ── The fake provider ─────────────────────────────────────────────────────────

type Step = () => { chunks: object[] };

const provider = { requests: [] as object[], script: [] as Step[] };

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
  provider.requests.push(JSON.parse(await readBody(req)) as object);
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

function parseAnswer(status: number, type: string, text: string): Answer {
  if (!type.includes('text/event-stream')) {
    return { status, chunks: [], json: text ? (JSON.parse(text) as Record<string, unknown>) : null };
  }
  const events = text
    .split('\n\n')
    .filter((event) => event.startsWith('data: '))
    .map((event) => event.slice('data: '.length));
  expect(events.at(-1)).toBe('[DONE]');
  return { status, chunks: events.slice(0, -1).map((event) => JSON.parse(event) as UiStreamChunk), json: null };
}

function asText(req: request.Test) {
  return req.buffer(true).parse((stream, done) => {
    let text = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk: string) => (text += chunk));
    stream.on('end', () => done(null, text));
  });
}

async function post(path: string, userId: number, body: object): Promise<Answer> {
  const res = await asText(request(nestApp.getHttpServer()).post(path).set('Cookie', sessionCookie(userId)).send(body));
  return parseAnswer(res.status, String(res.headers['content-type']), res.body as string);
}

async function upload(path: string, userId: number, fileName: string, text: string): Promise<Answer> {
  const req = request(nestApp.getHttpServer())
    .post(path)
    .set('Cookie', sessionCookie(userId))
    .field('locale', CTX.locale)
    .field('timeZone', CTX.timeZone)
    .attach('file', Buffer.from(text, 'utf8'), { filename: fileName, contentType: 'application/gpx+xml' });
  const res = await asText(req);
  return parseAnswer(res.status, String(res.headers['content-type']), res.body as string);
}

const ofType = <T extends UiStreamChunk['type']>(chunks: UiStreamChunk[], type: T) =>
  chunks.filter((chunk): chunk is Extract<UiStreamChunk, { type: T }> => chunk.type === type);

async function traveller() {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'Bavaria' });
  return { userId: user.id, tripId: trip.id, base: `/api/trips/${trip.id}/assistant` };
}

const WEEKEND = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Saturday</name><trkseg>
    <trkpt lat="47.5" lon="11.1"><ele>800</ele></trkpt>
    <trkpt lat="47.51" lon="11.1"><ele>1000</ele></trkpt>
  </trkseg></trk>
  <trk><name>Sunday</name><trkseg>
    <trkpt lat="47.6" lon="11.2"><ele>700</ele></trkpt>
    <trkpt lat="47.61" lon="11.2"><ele>900</ele></trkpt>
  </trkseg></trk>
</gpx>`;

// ── Cases ────────────────────────────────────────────────────────────────────

describe('a route file attached in the chat (P7)', () => {
  it('ASTE2E-TOURFILE-001: is read into its tracks without a model turn, each held as a hike, the GPX kept off the thread', async () => {
    const t = await traveller();
    const read = await upload(`${t.base}/attachments`, t.userId, 'weekend.gpx', WEEKEND);
    expect(read.status).toBe(200);
    expect(provider.requests).toHaveLength(0);
    const inputs = ofType(read.chunks, 'tool-input-available');
    expect(inputs.map((chunk) => chunk.toolName)).toEqual(['read_tour_file', 'import_tour_file', 'import_tour_file']);
    expect(JSON.stringify(read.chunks)).not.toContain('<trkpt');
    const changes = ofType(read.chunks, 'data-trek-change').map((chunk) => chunk.data);
    expect(changes.map((change) => [change.verbKey, change.subject, change.undoable])).toEqual([
      ['importTour', 'Saturday', true],
      ['importTour', 'Sunday', true],
    ]);
    const threadId = ofType(read.chunks, 'data-trek-thread')[0]?.data.threadId;
    const shown = await request(nestApp.getHttpServer())
      .get(`${t.base}/threads/${threadId}`)
      .set('Cookie', sessionCookie(t.userId));
    expect(JSON.stringify(shown.body)).not.toContain('<trkpt');
    const parts = (shown.body.messages as Array<{ parts: AssistantMessagePart[] }>).flatMap((m) => m.parts);
    expect(parts).toContainEqual(
      expect.objectContaining({
        type: 'tool-call',
        toolName: 'import_tour_file',
        args: { via: 'import_tour_gpx', file_name: 'weekend.gpx', tour_type: 'hike', track_name: 'Saturday' },
      }),
    );
  });

  it('ASTE2E-TOURFILE-002: applying one track imports exactly that track as a hike, and its undo deletes it again', async () => {
    const t = await traveller();
    const read = await upload(`${t.base}/attachments`, t.userId, 'weekend.gpx', WEEKEND);
    const threadId = ofType(read.chunks, 'data-trek-thread')[0]?.data.threadId;
    const [saturday, sunday] = ofType(read.chunks, 'data-trek-change').map((chunk) => chunk.data.toolCallId);
    provider.script = [say('Saturday is in the trip now.')];
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [
        { toolCallId: saturday, approved: true },
        { toolCallId: sunday, approved: false },
      ],
    });
    expect(decided.status).toBe(200);
    const [applied] = ofType(decided.chunks, 'data-trek-applied');
    expect(applied?.data).toMatchObject({ toolCallId: saturday, entity: 'tour' });
    const placeId = applied?.data.ids[0] ?? 0;
    expect((await findRow(orm, Places, { id: placeId }))?.name).toBe('Saturday');
    expect(await countRows(orm, Places, { trip: t.tripId })).toBe(1);

    const undone = await request(nestApp.getHttpServer())
      .post(`${t.base}/tool-calls/${saturday}/undo`)
      .set('Cookie', sessionCookie(t.userId))
      .send({});
    expect(undone.status).toBe(200);
    expect(await findRow(orm, Places, { id: placeId })).toBeNull();
  });

  it('ASTE2E-TOURFILE-003: a route file without a track ends with no_tracks_found and holds nothing', async () => {
    const t = await traveller();
    const pins = '<gpx version="1.1"><wpt lat="47" lon="11"><name>Pin</name></wpt></gpx>';
    const read = await upload(`${t.base}/attachments`, t.userId, 'pins.gpx', pins);
    expect(ofType(read.chunks, 'error')[0]).toMatchObject({ errorText: 'no_tracks_found' });
    expect(ofType(read.chunks, 'data-trek-change')).toHaveLength(0);
  });
});

describe('a stop the model takes into a saved hike (P6)', () => {
  it('ASTE2E-TOURFILE-004: is held with its card, saved when applied, and its receipt offers the way back', async () => {
    const t = await traveller();
    const place = await makePlace(orm, t.tripId, { name: 'Herzogstand', category: null });
    await makeTour(orm, place.id, { revision: 3 });
    await addTourWaypoints(orm, place.id, [
      { lat: 47.5, lng: 11.1, station_key: 'start1', name: 'Car park' },
      { lat: 47.505, lng: 11.1, station_key: 'alm111', name: 'Alm' },
      { lat: 47.51, lng: 11.1, station_key: 'summit', name: 'Summit' },
    ]);
    const hikes = nestApp.get(HikePlanService);
    const saved = (revision: number, keys: string[]) =>
      ({
        tour: { place_id: place.id, name: 'Herzogstand', tour_type: 'hike', revision, has_waypoints: true },
        waypoints: keys.map((key, index) => ({
          key,
          lat: key === 'spring' ? 47.507 : [47.5, 47.505, 47.51][Math.min(index, 2)],
          lng: 11.1,
          role: 'via',
          sequence: index,
        })),
        route: { planned: true },
        replanned: true,
      }) as unknown as Awaited<ReturnType<HikePlanService['update']>>;
    const update = vi.spyOn(hikes, 'update').mockResolvedValue(saved(4, ['start1', 'alm111', 'spring', 'summit']));

    provider.script = [
      callTool('call_tours', 'use_addon_tools', { groups: ['tours'] }),
      callTool('call_stop', 'insert_tour_stop', {
        placeId: place.id,
        expected_revision: 3,
        stop: { lat: 47.507, lng: 11.1, name: 'Spring' },
      }),
      say('Shall I add the spring?'),
    ];
    const turn = await post(`${t.base}/chat`, t.userId, { ...CTX, threadId: null, text: 'Add the spring to the hike' });
    const threadId = ofType(turn.chunks, 'data-trek-thread')[0]?.data.threadId;
    const [change] = ofType(turn.chunks, 'data-trek-change');
    expect(change?.data).toMatchObject({ verbKey: 'addTourStop', subject: 'Herzogstand', undoable: true });
    expect(update).not.toHaveBeenCalled();

    provider.script = [say('Added.')];
    const decided = await post(`${t.base}/threads/${threadId}/decisions`, t.userId, {
      ...CTX,
      decisions: [{ toolCallId: change?.data.toolCallId, approved: true }],
    });
    expect(update.mock.calls[0]?.[2]).toMatchObject({ placeId: place.id, expected_revision: 3 });
    expect(update.mock.calls[0]?.[2].waypoints?.map((point) => point.name)).toEqual([
      'Car park',
      'Alm',
      'Spring',
      'Summit',
    ]);
    const [applied] = ofType(decided.chunks, 'data-trek-applied');
    expect(applied?.data).toMatchObject({ entity: 'tour', ids: [place.id] });
    expect(applied?.data.undoUntil).toEqual(expect.any(String));
  });
});
