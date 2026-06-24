// Budget API: create an expense over HTTP, then check the settlement endpoint.
import request from 'supertest';
import { createTestApp, type TestApp } from '../helpers/app';
import { authCookie } from '../helpers/auth';
import { resetDb, createUser, createTrip, addTripMember, type TestUser, type TestTrip } from '../helpers/factories';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);
jest.mock('../../src/websocket', () => ({ broadcast: jest.fn(), broadcastToUser: jest.fn() }));
// Mock getRates so settlement runs offline in the trip's own currency.
jest.mock('../../src/services/exchangeRateService', () => ({ getRates: jest.fn().mockResolvedValue(null) }));

let ctx: TestApp;
let alice: TestUser;
let bob: TestUser;
let trip: TestTrip;

beforeAll(async () => {
  ctx = await createTestApp();
});

afterAll(async () => {
  await ctx.app.close();
});

beforeEach(() => {
  resetDb();
  alice = createUser({ username: 'alice' });
  bob = createUser({ username: 'bob' });
  trip = createTrip(alice.id, { currency: 'EUR' });
  addTripMember(trip.id, bob.id);
});

const budgetUrl = (suffix = '') => `/api/trips/${trip.id}/budget${suffix}`;

describe('Budget API', () => {
  it('creates an expense (201) and lists it', async () => {
    const res = await request(ctx.http)
      .post(budgetUrl())
      .set('Cookie', authCookie(alice.id))
      .send({ name: 'Dinner', category: 'food', total_price: 100 });

    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({ name: 'Dinner', total_price: 100 });
    const list = await request(ctx.http).get(budgetUrl()).set('Cookie', authCookie(alice.id));
    expect(list.body.items.map((i: { name: string }) => i.name)).toContain('Dinner');
  });

  it('rejects an expense without a name (400)', async () => {
    const res = await request(ctx.http).post(budgetUrl()).set('Cookie', authCookie(alice.id)).send({ total_price: 10 });

    expect(res.status).toBe(400);
  });

  it('settles a paid-by-one, split-by-two expense so the other owes half', async () => {
    await request(ctx.http)
      .post(budgetUrl())
      .set('Cookie', authCookie(alice.id))
      .send({ name: 'Dinner', total_price: 100, member_ids: [alice.id, bob.id], payers: [{ user_id: alice.id, amount: 100 }] });

    const res = await request(ctx.http).get(budgetUrl('/settlement?base=EUR')).set('Cookie', authCookie(alice.id));

    expect(res.status).toBe(200);
    const balance = (uid: number) => res.body.balances.find((b: { user_id: number }) => b.user_id === uid)?.balance;
    expect(balance(alice.id)).toBe(50);
    expect(balance(bob.id)).toBe(-50);
    expect(res.body.flows).toHaveLength(1);
    expect(res.body.flows[0]).toMatchObject({ from: { user_id: bob.id }, to: { user_id: alice.id }, amount: 50 });
  });

  it('denies budget access to a non-member (404)', async () => {
    const stranger = createUser();

    const res = await request(ctx.http).get(budgetUrl('/settlement')).set('Cookie', authCookie(stranger.id));

    expect(res.status).toBe(404);
  });
});
