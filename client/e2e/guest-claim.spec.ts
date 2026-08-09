import { expect, request as playwrightRequest, test, type APIRequestContext } from '@playwright/test';
import Database from 'better-sqlite3';
import path from 'node:path';

const baseURL = 'http://localhost:5173';
const dbFile = path.join(process.cwd(), 'e2e', '.tmp', 'e2e.db');
const password = 'GuestClaim123!';

async function api<T>(
  context: APIRequestContext,
  method: 'get' | 'post' | 'put',
  url: string,
  data?: unknown
): Promise<T> {
  const response = await context[method](url, data === undefined ? undefined : { data });
  if (!response.ok()) {
    throw new Error(`${method.toUpperCase()} ${url} → ${response.status()}\n${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function login(email: string): Promise<APIRequestContext> {
  const publicContext = await playwrightRequest.newContext({ baseURL });
  await api(publicContext, 'post', '/api/auth/login', { email, password });
  return publicContext;
}

async function register(username: string, email: string, inviteToken?: string): Promise<APIRequestContext> {
  const publicContext = await playwrightRequest.newContext({ baseURL });
  await api(publicContext, 'post', '/api/auth/register', {
    username,
    email,
    password,
    ...(inviteToken ? { invite_token: inviteToken } : {}),
  });
  return publicContext;
}

async function createTripAndGuest(admin: APIRequestContext, stamp: string) {
  const created = await api<{ trip: { id: number } }>(admin, 'post', '/api/trips', {
    title: `Guest claim ${stamp}`,
    currency: 'EUR',
  });
  const guest = await api<{ member: { id: number; username: string } }>(
    admin,
    'post',
    `/api/trips/${created.trip.id}/guests`,
    { name: `Guest ${stamp}` }
  );
  return { tripId: created.trip.id, guestId: guest.member.id };
}

async function claimAndVerify(context: APIRequestContext, tripId: number, guestId: number) {
  const firstPrompt = await api<{
    prompted: boolean;
    candidates: Array<{ guest_user_id: number }>;
  }>(context, 'post', `/api/trips/${tripId}/guest-claims/prompt`);
  expect(firstPrompt.prompted).toBe(true);
  expect(firstPrompt.candidates.map((candidate) => candidate.guest_user_id)).toContain(guestId);

  const secondPrompt = await api<{ prompted: boolean; candidates: unknown[] }>(
    context,
    'post',
    `/api/trips/${tripId}/guest-claims/prompt`
  );
  expect(secondPrompt).toEqual({ prompted: false, candidates: [] });

  const claimed = await api<{ success: boolean; claimed_guest_user_id: number }>(
    context,
    'post',
    `/api/trips/${tripId}/guests/${guestId}/claim`
  );
  expect(claimed).toMatchObject({ success: true, claimed_guest_user_id: guestId });

  const remaining = await api<{ candidates: unknown[] }>(
    context,
    'get',
    `/api/trips/${tripId}/guest-claims/candidates`
  );
  expect(remaining.candidates).toEqual([]);

  const db = new Database(dbFile, { readonly: true });
  try {
    expect(db.prepare('SELECT id FROM users WHERE id = ?').get(guestId)).toBeUndefined();
    expect(
      db
        .prepare("SELECT id FROM audit_log WHERE action = 'trip.guest_claim' AND resource = ? ORDER BY id DESC")
        .get(String(tripId))
    ).toBeTruthy();
  } finally {
    db.close();
  }
}

test('an existing account accepts a trip invite and claims its Guest', async ({ request: admin }) => {
  const stamp = `${Date.now()}-existing`;
  const email = `${stamp}@example.test`;
  await api(admin, 'post', '/api/admin/users', { username: stamp, email, password, role: 'user' });
  const { tripId, guestId } = await createTripAndGuest(admin, stamp);
  const invite = await api<{ token: string }>(admin, 'post', `/api/trips/${tripId}/invite-link`, {});

  const member = await login(email);
  try {
    await api(member, 'post', `/api/trip-invites/${invite.token}/accept`);
    await claimAndVerify(member, tripId, guestId);
  } finally {
    await member.dispose();
  }
});

test('a newly registered account joins by trip invite and claims its Guest', async ({ request: admin }) => {
  await api(admin, 'put', '/api/auth/app-settings', { password_registration: true });
  const stamp = `${Date.now()}-open`;
  const { tripId, guestId } = await createTripAndGuest(admin, stamp);
  const invite = await api<{ token: string }>(admin, 'post', `/api/trips/${tripId}/invite-link`, {});
  const member = await register(stamp, `${stamp}@example.test`);
  try {
    await api(member, 'post', `/api/trip-invites/${invite.token}/accept`);
    await claimAndVerify(member, tripId, guestId);
  } finally {
    await member.dispose();
  }
});

test('a trip-bound admin invite auto-joins registration while public registration is closed', async ({
  request: admin,
}) => {
  const stamp = `${Date.now()}-bound`;
  const { tripId, guestId } = await createTripAndGuest(admin, stamp);
  const invite = await api<{ invite: { token: string } }>(admin, 'post', '/api/admin/invites', {
    max_uses: 1,
    trip_id: tripId,
  });
  await api(admin, 'put', '/api/auth/app-settings', { password_registration: false });

  let member: APIRequestContext | undefined;
  try {
    member = await register(stamp, `${stamp}@example.test`, invite.invite.token);
    await claimAndVerify(member, tripId, guestId);
  } finally {
    await member?.dispose();
    await api(admin, 'put', '/api/auth/app-settings', { password_registration: true });
  }
});
