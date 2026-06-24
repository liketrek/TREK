// Places API + access control: non-member → 404, member without permission → 403.
import request from 'supertest';
import { createTestApp, type TestApp } from '../helpers/app';
import { authCookie } from '../helpers/auth';
import { savePermissions, invalidatePermissionsCache } from '../../src/services/permissions';
import { resetDb, createUser, createTrip, addTripMember, type TestUser, type TestTrip } from '../helpers/factories';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);
jest.mock('../../src/websocket', () => ({ broadcast: jest.fn(), broadcastToUser: jest.fn() }));

let ctx: TestApp;
let owner: TestUser;
let member: TestUser;
let trip: TestTrip;

beforeAll(async () => {
  ctx = await createTestApp();
});

afterAll(async () => {
  await ctx.app.close();
});

beforeEach(() => {
  resetDb();
  invalidatePermissionsCache(); // app_settings was wiped; drop cached perm levels
  owner = createUser({ username: 'owner' });
  member = createUser({ username: 'member' });
  trip = createTrip(owner.id);
  addTripMember(trip.id, member.id);
});

const placesUrl = (suffix = '') => `/api/trips/${trip.id}/places${suffix}`;

describe('Places API', () => {
  it('lets the owner add a place (201) and lists it', async () => {
    const res = await request(ctx.http)
      .post(placesUrl())
      .set('Cookie', authCookie(owner.id))
      .send({ name: 'Colosseum', lat: 41.8902, lng: 12.4922 });

    expect(res.status).toBe(201);
    expect(res.body.place).toMatchObject({ name: 'Colosseum' });
    const list = await request(ctx.http).get(placesUrl()).set('Cookie', authCookie(owner.id));
    expect(list.status).toBe(200);
    expect(list.body.places.map((p: { name: string }) => p.name)).toContain('Colosseum');
  });

  it('rejects a place without a name (400)', async () => {
    const res = await request(ctx.http).post(placesUrl()).set('Cookie', authCookie(owner.id)).send({ lat: 1, lng: 2 });

    expect(res.status).toBe(400);
  });

  it('returns 404 for a user who is neither owner nor member', async () => {
    const stranger = createUser();

    const res = await request(ctx.http).post(placesUrl()).set('Cookie', authCookie(stranger.id)).send({ name: 'Sneaky' });

    expect(res.status).toBe(404);
  });

  it('returns 403 when a member lacks the place_edit permission', async () => {
    savePermissions({ place_edit: 'trip_owner' }); // raise from the trip_member default

    const res = await request(ctx.http).post(placesUrl()).set('Cookie', authCookie(member.id)).send({ name: 'Forbidden' });

    expect(res.status).toBe(403);
  });
});
