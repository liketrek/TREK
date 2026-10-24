/**
 * The Studio page images, end to end: the whole app (buildApp, every global
 * guard, the Zod pipe, the response contracts) with a turn's wait primed on
 * the container's own AssistantRenderRegistry, and the page uploaded the way
 * the Studio tab uploads it (multipart, the image in `image`, the page and the
 * photos it shows as text fields).
 *
 * Covered: the gates in the handler (the AI addon, the managed install, the
 * journey addon, the journey itself), the image checks (none, not an image,
 * over the edge or byte cap), a photo of another member refused, and the
 * hand-over: only to the waiting turn of the same user and thread, for the
 * page and version asked for, once.
 */
import { buildApp } from '../../src/bootstrap';
import { JourneyPhotos } from '../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { AssistantRenderRegistry, type PageImage } from '../../src/nest/assistant/assistant-render.registry';
import { addJourneyContributor, makeJourney } from '../helpers/factories/journeys';
import { insertRow } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeUser } from '../helpers/factories/users';
import { resetRateLimits } from '../helpers/test-db';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let nestApp: INestApplication;
let orm: MikroORM;
let registry: AssistantRenderRegistry;

beforeAll(async () => {
  nestApp = await buildApp();
  orm = nestApp.get(MikroORM);
  registry = nestApp.get(AssistantRenderRegistry);
  await setAddonEnabled(orm, 'ai_assistant', true);
  await setAddonEnabled(orm, 'journey', true);
});

beforeEach(async () => {
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
});

/** The first bytes of a baseline JPEG of w x h: all the route reads. */
function jpeg(w: number, h: number, size = 64): Buffer {
  const out = Buffer.alloc(size);
  Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08]).copy(out, 0);
  out.writeUInt16BE(h, 7);
  out.writeUInt16BE(w, 9);
  return out;
}

async function photoOf(journeyId: number, ownerId: number): Promise<number> {
  const photoId = await insertRow(orm, TrekPhotos, { provider: 'local', owner: ownerId, file_path: 'journey/p.jpg' });
  await insertRow(orm, JourneyPhotos, { journey: journeyId, photo: photoId, sort_order: 0, created_at: Date.now() });
  return photoId;
}

async function studio() {
  const { user } = await makeUser(orm);
  const { user: friend } = await makeUser(orm);
  const journey = await makeJourney(orm, user.id, { title: 'Portugal by train' });
  await addJourneyContributor(orm, journey.id, friend.id, 'editor');
  const own = await photoOf(journey.id, user.id);
  const friends = await photoOf(journey.id, friend.id);
  return { userId: user.id, friendId: friend.id, journeyId: journey.id, own, friends };
}

interface Upload {
  userId: number;
  journeyId: number | string;
  threadId?: number;
  requestId: string;
  image?: Buffer;
  fields?: Record<string, string>;
}

function upload(u: Upload) {
  const path = `/api/journeys/${u.journeyId}/assistant/threads/${u.threadId ?? 4}/renders/${u.requestId}`;
  let req = request(nestApp.getHttpServer()).post(path).set('Cookie', sessionCookie(u.userId));
  for (const [key, value] of Object.entries(u.fields ?? { bookVersion: '3', spreadId: 'sp-2' })) {
    req = req.field(key, value);
  }
  if (u.image === undefined) return req;
  return req.attach('image', u.image, { filename: 'page.jpg', contentType: 'image/jpeg' });
}

/** A turn of the user waiting for page sp-2 at version 3 of their journey, in thread 4. */
function waitFor(userId: number, journeyId: number) {
  const requestId = randomUUID();
  const stop = new AbortController();
  const image = registry.wait(
    { userId, journeyId, threadId: 4, requestId, spreadId: 'sp-2', bookVersion: 3 },
    stop.signal,
    15_000,
  );
  return { requestId, image, stop };
}

describe('Studio page images e2e', () => {
  it('ASTRNE2E-001: the addons, the managed install and the journey are checked before the image', async () => {
    const s = await studio();
    const { user: stranger } = await makeUser(orm);
    const turn = waitFor(s.userId, s.journeyId);
    const page = { requestId: turn.requestId, image: jpeg(1280, 640) };
    await setAddonEnabled(orm, 'ai_assistant', false);
    try {
      expect((await upload({ ...page, userId: s.userId, journeyId: s.journeyId })).status).toBe(404);
    } finally {
      await setAddonEnabled(orm, 'ai_assistant', true);
    }
    vi.stubEnv('TREK_MANAGED', 'true');
    try {
      const managed = await upload({ ...page, userId: s.userId, journeyId: s.journeyId });
      expect(managed.status).toBe(403);
      expect(managed.body).toMatchObject({ code: 'MANAGED_FORBIDDEN' });
    } finally {
      vi.unstubAllEnvs();
    }
    await setAddonEnabled(orm, 'journey', false);
    try {
      const off = await upload({ ...page, userId: s.userId, journeyId: s.journeyId });
      expect([off.status, off.body]).toEqual([404, { error: 'Journey addon is not enabled' }]);
    } finally {
      await setAddonEnabled(orm, 'journey', true);
    }
    const outsider = await upload({ ...page, userId: stranger.id, journeyId: s.journeyId });
    expect([outsider.status, outsider.body]).toEqual([404, { error: 'Journey not found' }]);
    expect((await upload({ ...page, userId: s.userId, journeyId: 'abc' })).status).toBe(404);
    const path = `/api/journeys/${s.journeyId}/assistant/threads/4/renders/x`;
    expect((await request(nestApp.getHttpServer()).post(path)).status).toBe(401);
    turn.stop.abort();
    await expect(turn.image).resolves.toBeNull();
  });

  it('ASTRNE2E-002: an upload that is no image, too large or without its fields is refused', async () => {
    const s = await studio();
    const turn = waitFor(s.userId, s.journeyId);
    const base = { requestId: turn.requestId, userId: s.userId, journeyId: s.journeyId };
    expect((await upload({ ...base })).status).toBe(400);
    const text = await upload({ ...base, image: Buffer.from('not an image at all') });
    expect([text.status, text.body]).toEqual([415, { error: 'The upload is not a JPEG, PNG or WebP image' }]);
    expect((await upload({ ...base, image: jpeg(4000, 1000) })).status).toBe(413);
    expect((await upload({ ...base, image: jpeg(2048, 2048) })).status).toBe(413);
    expect((await upload({ ...base, image: jpeg(1280, 640, 1024 * 1024 + 1) })).status).toBe(413);
    const noPage = await upload({ ...base, image: jpeg(1280, 640), fields: { bookVersion: '3' } });
    expect(noPage.status).toBe(400);
    const extra = { bookVersion: '3', spreadId: 'sp-2', data: 'x' };
    expect((await upload({ ...base, image: jpeg(1280, 640), fields: extra })).status).toBe(400);
    turn.stop.abort();
    await expect(turn.image).resolves.toBeNull();
  });

  it('ASTRNE2E-003: an image that shows a photo of another member is refused; the turn goes on waiting', async () => {
    const s = await studio();
    const turn = waitFor(s.userId, s.journeyId);
    const base = { requestId: turn.requestId, userId: s.userId, journeyId: s.journeyId, image: jpeg(1280, 640) };
    const fields = { bookVersion: '3', spreadId: 'sp-2', drawnPhotoIds: `${s.own},${s.friends}` };
    const foreign = await upload({ ...base, fields });
    expect([foreign.status, foreign.body]).toEqual([
      403,
      { error: 'The image shows a photo another member contributed' },
    ]);
    const mine = await upload({ ...base, fields: { ...fields, drawnPhotoIds: String(s.own) } });
    expect([mine.status, mine.body]).toEqual([200, { accepted: true }]);
    const image = (await turn.image) as PageImage;
    expect(image).toMatchObject({ mimeType: 'image/jpeg', width: 1280, height: 640 });
    expect(image.data.equals(jpeg(1280, 640))).toBe(true);
  });

  it('ASTRNE2E-004: only the waiting turn of this user and thread takes the page it asked for, once', async () => {
    const s = await studio();
    const turn = waitFor(s.userId, s.journeyId);
    const base = { requestId: turn.requestId, journeyId: s.journeyId, image: jpeg(1280, 640) };
    // The friend may open the journey, but the turn is not theirs.
    expect((await upload({ ...base, userId: s.friendId })).status).toBe(404);
    expect((await upload({ ...base, userId: s.userId, threadId: 5 })).status).toBe(404);
    // A thread id that is none asks for no page, before the file is looked at.
    const noThread = await upload({ ...base, userId: s.userId, threadId: 0 });
    expect([noThread.status, noThread.body]).toEqual([404, { error: 'No page was asked for' }]);
    expect((await upload({ ...base, userId: s.userId, requestId: randomUUID() })).status).toBe(404);
    const stale = await upload({ ...base, userId: s.userId, fields: { bookVersion: '2', spreadId: 'sp-2' } });
    expect(stale.status).toBe(409);
    expect((await upload({ ...base, userId: s.userId })).status).toBe(200);
    await expect(turn.image).resolves.toMatchObject({ width: 1280, height: 640 });
    const again = await upload({ ...base, userId: s.userId });
    expect([again.status, again.body]).toEqual([404, { error: 'No page was asked for' }]);
  });
});
