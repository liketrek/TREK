/**
 * BODYID, JRNID and QUERYID: a row id or a count in a request body or query
 * that toRowId refuses is a 400, or the value left out, on every engine, and
 * reaches no row.
 *
 * ROUTEID-002 (route-row-ids.e2e.test.ts) holds every typed request field to
 * that rule at the schema. These suites cover what the schema cannot see: the
 * open accommodation update body, whose refs the service reads itself, the
 * journey fields that answer the handler's own error, and the collab reply,
 * whose multipart form spells "no reply" as ''. Bound as sent, '0x1' matched
 * nothing on SQLite, was refused with a 500 by Postgres 14 and 15 and read as
 * row 1 by 16 and later; '1e0' reached row 1 on SQLite. Each suite sends the
 * spellings of a real row's id, so a reach shows as a write.
 */
import { buildApp } from '../../src/bootstrap';
import { Addons } from '../../src/db/entities/Addons.entity';
import { CollabMessages } from '../../src/db/entities/CollabMessages.entity';
import { DayAccommodations } from '../../src/db/entities/DayAccommodations.entity';
import { JourneyContributors } from '../../src/db/entities/JourneyContributors.entity';
import { JourneyTrips } from '../../src/db/entities/JourneyTrips.entity';
import { RateLimitService } from '../../src/nest/common/rate-limit.service';
import { makeCollabMessage } from '../helpers/factories/collab';
import { makeJourney, makeJourneyEntry } from '../helpers/factories/journeys';
import { makeNotification } from '../helpers/factories/notifications';
import { makePlace } from '../helpers/factories/places';
import { countRows, updateRows } from '../helpers/factories/rows';
import { makeTrip, readTripDays } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { oneByOne } from '../helpers/one-by-one';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;

/** The spellings of `id` toRowId refuses, and two values no id is, as a JSON body carries them. */
function malformed(id: number): unknown[] {
  return [`0x${id.toString(16)}`, `${id}e0`, `${id}.0`, ` ${id}`, 'abc', '99999999999999999999', id + 0.5, 1e20];
}

/** Every malformed value of each field, as `[field, value]` pairs. */
function malformedFields<F extends string>(ids: Record<F, number>): Array<[F, unknown]> {
  return (Object.keys(ids) as F[]).flatMap((field) =>
    malformed(ids[field]).map((value): [F, unknown] => [field, value]),
  );
}

interface Answer {
  sent: string;
  status: number;
  body: unknown;
}

/** The status and body of each request `send` makes, one at a time, labelled with what was sent. */
function answers<T>(items: readonly T[], send: (item: T) => PromiseLike<request.Response>): Promise<Answer[]> {
  return oneByOne(items, async (item) => {
    const res = await send(item);
    return { sent: JSON.stringify(item), status: res.status, body: res.body as unknown };
  });
}

/** The answers that are not the 400 carrying `error`. */
function not400(got: Answer[], error: string): Answer[] {
  return got.filter((a) => a.status !== 400 || JSON.stringify(a.body) !== JSON.stringify({ error }));
}

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
  await updateRows(orm, Addons, {}, { enabled: true });
}, 60_000);

afterAll(async () => {
  await app?.close();
});

beforeEach(async () => {
  await app.get(RateLimitService).reset();
});

async function tripWorld() {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { start_date: '2026-03-01', end_date: '2026-03-03' });
  const [day1, day2] = await readTripDays(orm, trip.id);
  const place = await makePlace(orm, trip.id);
  const other = await makePlace(orm, trip.id);
  return { cookie: sessionCookie(user.id), user, trip, day1, day2, place, other };
}

describe('BODYID: accommodation refs', () => {
  it('BODYID-001: POST answers 400 for a malformed place or day id and books nothing', async () => {
    const { cookie, trip, day1, place } = await tripWorld();
    const valid = { place_id: place.id, start_day_id: day1.id, end_day_id: day1.id };
    const got = await answers(malformedFields(valid), ([field, value]) =>
      request(app.getHttpServer())
        .post(`/api/trips/${trip.id}/accommodations`)
        .set('Cookie', cookie)
        .send({ ...valid, [field]: value }),
    );
    expect(got.filter((a) => a.status !== 400)).toEqual([]);
    expect(await countRows(orm, DayAccommodations, { trip: trip.id })).toBe(0);

    const ok = await request(app.getHttpServer())
      .post(`/api/trips/${trip.id}/accommodations`)
      .set('Cookie', cookie)
      .send({ ...valid, place_id: String(place.id) });
    expect(ok.status).toBe(201);
  });

  it('BODYID-002: PUT, whose body is open, answers 400 for a malformed ref and leaves the stay as it was', async () => {
    const { cookie, trip, day1, day2, place, other } = await tripWorld();
    const created = await request(app.getHttpServer())
      .post(`/api/trips/${trip.id}/accommodations`)
      .set('Cookie', cookie)
      .send({ place_id: place.id, start_day_id: day1.id, end_day_id: day1.id });
    const stayId = (created.body as { accommodation: { id: number } }).accommodation.id;

    const pairs = malformedFields({ place_id: other.id, start_day_id: day2.id, end_day_id: day2.id });
    const got = await answers(pairs, ([field, value]) =>
      request(app.getHttpServer())
        .put(`/api/trips/${trip.id}/accommodations/${stayId}`)
        .set('Cookie', cookie)
        .send({ [field]: value }),
    );
    expect(got.map((a) => [a.sent, a.status, a.body])).toEqual(
      pairs.map((pair) => [JSON.stringify(pair), 400, { error: `${pair[0]}: Invalid id` }]),
    );
    expect(
      await countRows(orm, DayAccommodations, { id: stayId, place: place.id, startDay: day1.id, endDay: day1.id }),
    ).toBe(1);

    const ok = await request(app.getHttpServer())
      .put(`/api/trips/${trip.id}/accommodations/${stayId}`)
      .set('Cookie', cookie)
      .send({ place_id: String(other.id) });
    expect(ok.status).toBe(200);
    expect(await countRows(orm, DayAccommodations, { id: stayId, place: other.id })).toBe(1);
  });
});

describe('BODYID: collab reply', () => {
  it('BODYID-003: a malformed reply_to is a 400 that posts nothing; "" and null are no reply', async () => {
    const { cookie, user, trip } = await tripWorld();
    const target = await makeCollabMessage(orm, trip.id, user.id);
    const post = (reply_to: unknown) =>
      request(app.getHttpServer())
        .post(`/api/trips/${trip.id}/collab/messages`)
        .set('Cookie', cookie)
        .send({ text: 'hi', reply_to });

    expect((await answers(malformed(target.id), post)).filter((a) => a.status !== 400)).toEqual([]);
    expect(await countRows(orm, CollabMessages, { trip: trip.id })).toBe(1);

    const none = await answers(['', null], post);
    expect(none.map((a) => [a.status, (a.body as { message?: { reply_to: unknown } }).message?.reply_to])).toEqual([
      [201, null],
      [201, null],
    ]);
    const reply = await post(String(target.id));
    expect(reply.status).toBe(201);
    expect(await countRows(orm, CollabMessages, { trip: trip.id, reply_to: target.id })).toBe(1);
  });
});

describe('JRNID: journey ids the handler reads itself', () => {
  async function journeyWorld() {
    const world = await tripWorld();
    const journey = await makeJourney(orm, world.user.id);
    return { ...world, journey };
  }

  it('JRNID-001: POST /journeys links no trip for a malformed trip_ids entry', async () => {
    const { cookie, trip } = await journeyWorld();
    const res = await request(app.getHttpServer())
      .post('/api/journeys')
      .set('Cookie', cookie)
      .send({ title: 'J', trip_ids: malformed(trip.id) });
    expect(res.status).toBe(201);
    expect(await countRows(orm, JourneyTrips, { journey: (res.body as { id: number }).id })).toBe(0);
  });

  it("JRNID-002: POST /journeys/:id/trips answers 400 'trip_id required' for a malformed trip_id", async () => {
    const { cookie, trip, journey } = await journeyWorld();
    const got = await answers(malformed(trip.id), (value) =>
      request(app.getHttpServer())
        .post(`/api/journeys/${journey.id}/trips`)
        .set('Cookie', cookie)
        .send({ trip_id: value }),
    );
    expect(not400(got, 'trip_id required')).toEqual([]);
    expect(await countRows(orm, JourneyTrips, { journey: journey.id })).toBe(0);
  });

  it('JRNID-003: PUT /journeys/:id/entries/reorder answers 400 for a malformed entry id', async () => {
    const { cookie, user, journey } = await journeyWorld();
    const entry = await makeJourneyEntry(orm, journey.id, user.id);
    const got = await answers(malformed(entry.id), (value) =>
      request(app.getHttpServer())
        .put(`/api/journeys/${journey.id}/entries/reorder`)
        .set('Cookie', cookie)
        .send({ orderedIds: [value] }),
    );
    expect(not400(got, 'orderedIds must be an array of numbers')).toEqual([]);
  });

  it("JRNID-004: POST /journeys/:id/contributors answers 400 'user_id required' for a malformed user_id", async () => {
    const { cookie, journey } = await journeyWorld();
    const { user: friend } = await makeUser(orm);
    const got = await answers(malformed(friend.id), (value) =>
      request(app.getHttpServer())
        .post(`/api/journeys/${journey.id}/contributors`)
        .set('Cookie', cookie)
        .send({ user_id: value }),
    );
    expect(not400(got, 'user_id required')).toEqual([]);
    expect(await countRows(orm, JourneyContributors, { journey: journey.id, user: friend.id })).toBe(0);
  });

  it("JRNID-005: POST /journeys/entries/:entryId/link-photo answers 400 'journey_photo_id required' for a malformed id", async () => {
    const { cookie, user, journey } = await journeyWorld();
    const entry = await makeJourneyEntry(orm, journey.id, user.id);
    const got = await answers(malformedFields({ journey_photo_id: 1, photo_id: 1 }), ([field, value]) =>
      request(app.getHttpServer())
        .post(`/api/journeys/entries/${entry.id}/link-photo`)
        .set('Cookie', cookie)
        .send({ [field]: value }),
    );
    expect(not400(got, 'journey_photo_id required')).toEqual([]);
  });
});

describe('QUERYID: whole numbers in a query', () => {
  it('QUERYID-001: a malformed in-app limit or offset reads as left out, never as a number', async () => {
    const { user } = await makeUser(orm);
    const cookie = sessionCookie(user.id);
    await oneByOne([1, 2, 3], () => makeNotification(orm, user.id));
    // parseInt read '1e0' as 1 and '-1' as -1, which Postgres refuses in LIMIT and OFFSET.
    const queries = ['limit=-1', 'limit=1e0', 'limit=0x1', 'offset=-1', 'offset=1e0', 'offset=0x1'];
    const got = await answers(queries, (query) =>
      request(app.getHttpServer()).get(`/api/notifications/in-app?${query}`).set('Cookie', cookie),
    );
    expect(got.map((a) => [a.sent, a.status, (a.body as { notifications?: unknown[] }).notifications?.length])).toEqual(
      queries.map((query) => [JSON.stringify(query), 200, 3]),
    );
  });
});
