// Harness smoke: boots the NestApp against an isolated in-memory DB and checks that routing and the JWT-cookie guard work.
// Template for the real integration tests (Supertest against the app).
import { createTestApp, type TestApp } from '../helpers/app';

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

describe('server integration', () => {
  it('health endpoint is public', async () => {
    const res = await request(ctx.http).get('/api/_nest/health');
    expect(res.status).toBe(200);
  });

  it('guarded endpoint rejects without a session', async () => {
    const res = await request(ctx.http).get('/api/_nest/me');
    expect(res.status).toBe(401);
  });
});
