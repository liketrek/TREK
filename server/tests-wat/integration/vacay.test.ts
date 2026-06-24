// Vacay entries + stats via the real NestApp (Supertest).
import { authCookie } from '../../tests/helpers/auth';
import { createUser } from '../../tests/helpers/factories';
import { createTestApp, type TestApp } from '../helpers/app';
import { db } from '../helpers/db-singleton';

import request from 'supertest';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);
jest.mock('../../src/websocket', () => ({ broadcast: jest.fn(), broadcastToUser: jest.fn() }));

let ctx: TestApp;

beforeAll(async () => {
  ctx = await createTestApp();
});

afterAll(async () => {
  await ctx.app.close();
});

describe('vacay entries + stats API', () => {
  it('toggling a vacation day is reflected in the stats endpoint', async () => {
    // given -> an authenticated user and the current year
    const { user } = createUser(db);
    const cookie = authCookie(user.id);
    const year = new Date().getFullYear();

    // when
    const toggle = await request(ctx.http)
      .post('/api/addons/vacay/entries/toggle')
      .set('Cookie', cookie)
      .send({ date: `${year}-07-01` });

    // then
    expect(toggle.status).toBe(200);
    expect(toggle.body.action).toBe('added');

    const stats = await request(ctx.http).get(`/api/addons/vacay/stats/${year}`).set('Cookie', cookie);
    expect(stats.status).toBe(200);
    const row = stats.body.stats.find((s: { user_id: number }) => s.user_id === user.id);
    expect(row.used).toBe(1);
  });
});
