// Trips API (Supertest against the booted NestApp).
import request from 'supertest';
import { createTestApp, type TestApp } from '../helpers/app';
import { authCookie } from '../helpers/auth';
import { resetDb, createUser, type TestUser } from '../helpers/factories';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);
jest.mock('../../src/websocket', () => ({ broadcast: jest.fn(), broadcastToUser: jest.fn() }));

let ctx: TestApp;
let user: TestUser;

beforeAll(async () => {
  ctx = await createTestApp();
});

afterAll(async () => {
  await ctx.app.close();
});

beforeEach(() => {
  resetDb();
  user = createUser();
});

describe('POST /api/trips', () => {
  it('creates a trip (201) and generates one day per date in the range', async () => {
    const res = await request(ctx.http)
      .post('/api/trips')
      .set('Cookie', authCookie(user.id))
      .send({ title: 'Rome', start_date: '2026-09-01', end_date: '2026-09-03' });

    expect(res.status).toBe(201);
    expect(res.body.trip).toMatchObject({ title: 'Rome', is_owner: 1 });
    expect(res.body.trip.day_count).toBe(3);
  });

  it('infers a 7-day window when only a start date is given', async () => {
    const res = await request(ctx.http)
      .post('/api/trips')
      .set('Cookie', authCookie(user.id))
      .send({ title: 'Open-ended', start_date: '2026-09-01' });

    expect(res.status).toBe(201);
    expect(res.body.trip.day_count).toBe(7);
  });

  it('rejects a trip without a title (400)', async () => {
    const res = await request(ctx.http).post('/api/trips').set('Cookie', authCookie(user.id)).send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('requires authentication (401)', async () => {
    const res = await request(ctx.http).post('/api/trips').send({ title: 'Nope' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/trips', () => {
  it('round-trips a created trip through the list and the by-id endpoint', async () => {
    const created = await request(ctx.http).post('/api/trips').set('Cookie', authCookie(user.id)).send({ title: 'Lisbon' });
    const tripId = created.body.trip.id;

    const list = await request(ctx.http).get('/api/trips').set('Cookie', authCookie(user.id));
    const byId = await request(ctx.http).get(`/api/trips/${tripId}`).set('Cookie', authCookie(user.id));

    expect(list.status).toBe(200);
    expect(list.body.trips.map((t: { title: string }) => t.title)).toContain('Lisbon');
    expect(byId.status).toBe(200);
    expect(byId.body.trip.id).toBe(tripId);
  });

  it('does not leak trips owned by another user', async () => {
    await request(ctx.http).post('/api/trips').set('Cookie', authCookie(user.id)).send({ title: 'Private' });
    const stranger = createUser();

    const list = await request(ctx.http).get('/api/trips').set('Cookie', authCookie(stranger.id));

    expect(list.status).toBe(200);
    expect(list.body.trips).toHaveLength(0);
  });
});
