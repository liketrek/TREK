// Auth login via the real NestApp (Supertest).
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

describe('POST /api/auth/login', () => {
  it('issues a session cookie for valid credentials and unlocks /api/auth/me', async () => {
    // given
    const { user, password } = createUser(db, { email: 'fabian.login@test.example.com' });

    // when
    const login = await request(ctx.http).post('/api/auth/login').send({ email: user.email, password });

    // then
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe(user.email);
    const cookie = login.headers['set-cookie'];
    expect(String(cookie)).toContain('trek_session');

    const me = await request(ctx.http).get('/api/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(user.id);
  });

  it('rejects an invalid password with 401', async () => {
    // given
    const { user } = createUser(db, { email: 'fabian.wrong@test.example.com', password: 'Correct1!pw' });

    // when
    const login = await request(ctx.http)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPassword1!' });

    // then
    expect(login.status).toBe(401);
    expect(login.body.error).toMatch(/invalid/i);
  });
});
