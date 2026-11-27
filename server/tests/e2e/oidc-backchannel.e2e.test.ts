/**
 * OpenID Connect Back-Channel Logout end to end: a user signs in through a real
 * provider on loopback (discovery, authorize, token with a signed id_token,
 * JWKS and userinfo, the way tests/integration/oidc-local-provider.test.ts runs
 * it), and that provider then posts signed logout tokens, form-encoded, to
 * POST /api/auth/oidc/backchannel-logout of the booted app.
 *
 * Proves the sid of the id_token is kept on the session the login made and on
 * an app session handed off from it, that a token naming that sid ends those
 * sessions only, that a token naming only the
 * subject ends every session of the account, that an unknown subject answers
 * 200, and that a bad or missing token answers the 400 of section 2.8, every
 * answer with Cache-Control: no-store.
 */
import { buildApp } from '../../src/bootstrap';
import { BACKCHANNEL_LOGOUT_EVENT } from '../../src/nest/oidc/oidc-backchannel.service';
import { makeUser } from '../helpers/factories/users';
import { resetDatabase } from '../helpers/reset-database';
import { sessionRowsOf } from '../helpers/sessions';
import { resetRateLimits } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const CLIENT_ID = 'trek-backchannel';
const CLIENT_SECRET = 'backchannel-secret';
const EMAIL = 'sso-user@home.test';
const SUBJECT = 'bcl-sub-1';
const ROUTE = '/api/auth/oidc/backchannel-logout';

/** Read one cookie's value out of a response's Set-Cookie header, as a browser would. */
function readCookie(res: request.Response, name: string): string | undefined {
  const raw = res.headers['set-cookie'];
  const all: string[] = Array.isArray(raw) ? raw : raw ? [raw as unknown as string] : [];
  const value = all
    .filter((c) => c.startsWith(`${name}=`))
    .pop()
    ?.split(';')[0]
    ?.slice(name.length + 1);
  return value ? decodeURIComponent(value) : undefined;
}

// ── The provider ────────────────────────────────────────────────────────────

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const stranger = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
/** Each authorization code, with the provider session (sid) its id_token will carry. */
const codes = new Map<string, string | null>();
/** The sid the next sign-in gets; null for a provider that sends none. */
let nextSid: string | null = null;
let provider: http.Server;
let issuer = '';

function signIdToken(sid: string | null): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: issuer,
      sub: SUBJECT,
      aud: CLIENT_ID,
      iat: now,
      exp: now + 300,
      email: EMAIL,
      email_verified: true,
      ...(sid ? { sid } : {}),
    },
    privateKey,
    { algorithm: 'RS256', keyid: 'k1' },
  );
}

function answerJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? '/', issuer);
  if (url.pathname === '/.well-known/openid-configuration') {
    return answerJson(res, 200, {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/jwks`,
      backchannel_logout_supported: true,
      backchannel_logout_session_supported: true,
    });
  }
  if (url.pathname === '/authorize') {
    const code = crypto.randomBytes(12).toString('hex');
    codes.set(code, nextSid);
    const back = new URL(url.searchParams.get('redirect_uri') ?? '');
    back.searchParams.set('code', code);
    back.searchParams.set('state', url.searchParams.get('state') ?? '');
    res.writeHead(302, { location: back.toString() });
    return res.end();
  }
  if (url.pathname === '/token' && req.method === 'POST') {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      const form = new URLSearchParams(raw);
      const code = form.get('code') ?? '';
      if (!codes.has(code) || form.get('client_secret') !== CLIENT_SECRET) {
        return answerJson(res, 400, { error: 'invalid_grant' });
      }
      const sid = codes.get(code) ?? null;
      codes.delete(code);
      answerJson(res, 200, { access_token: 'bcl-access', token_type: 'Bearer', id_token: signIdToken(sid) });
    });
    return;
  }
  if (url.pathname === '/userinfo') {
    return answerJson(res, 200, { sub: SUBJECT, email: EMAIL, email_verified: true, name: 'SSO User' });
  }
  if (url.pathname === '/jwks') return answerJson(res, 200, { keys: [jwk] });
  answerJson(res, 404, { error: 'not_found' });
}

/** A logout token the provider signs; `claims` overrides the defaults, `undefined` drops one. */
function logoutToken(claims: Record<string, unknown>, key: crypto.KeyObject = privateKey): string {
  const payload: Record<string, unknown> = {
    iss: issuer,
    aud: CLIENT_ID,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
    events: { [BACKCHANNEL_LOGOUT_EVENT]: {} },
    ...claims,
  };
  for (const [name, value] of Object.entries(payload)) if (value === undefined) delete payload[name];
  return jwt.sign(payload, key, { algorithm: 'RS256', header: { alg: 'RS256', kid: 'k1', typ: 'logout+jwt' } });
}

// ── The app ─────────────────────────────────────────────────────────────────

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;

beforeAll(async () => {
  provider = http.createServer(handle);
  await new Promise<void>((resolve) => provider.listen(0, '127.0.0.1', resolve));
  issuer = `http://127.0.0.1:${(provider.address() as AddressInfo).port}`;
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  await resetDatabase(orm);
  await resetRateLimits(nestApp);
  codes.clear();
  nextSid = null;
  process.env.OIDC_ISSUER = issuer;
  process.env.OIDC_CLIENT_ID = CLIENT_ID;
  process.env.OIDC_CLIENT_SECRET = CLIENT_SECRET;
  process.env.APP_URL = 'http://localhost:3001';
});

afterEach(() => {
  delete process.env.OIDC_ISSUER;
  delete process.env.OIDC_CLIENT_ID;
  delete process.env.OIDC_CLIENT_SECRET;
  delete process.env.APP_URL;
  vi.restoreAllMocks();
});

afterAll(async () => {
  await nestApp.close();
  await new Promise((resolve) => provider.close(resolve));
});

/** One SSO sign-in through the provider, its id_token carrying `sid`; answers the trek_session cookie. */
async function signIn(sid: string | null): Promise<string> {
  nextSid = sid;
  const login = await request(app).get('/api/auth/oidc/login');
  expect(login.status).toBe(302);
  const location = login.headers.location;
  expect(location).toBeTruthy();
  const authorize = new URL(String(location));
  const state = readCookie(login, 'trek_oidc_state') ?? '';
  const back = await fetch(`${issuer}${authorize.pathname}${authorize.search}`, { redirect: 'manual' });
  const callbackUrl = new URL(back.headers.get('location') ?? '');
  const cb = await request(app)
    .get(`${callbackUrl.pathname}${callbackUrl.search}`)
    .set('Cookie', `trek_oidc_state=${state}`);
  const landing = new URL(String(cb.headers.location), 'http://localhost');
  expect(landing.searchParams.get('oidc_error')).toBeNull();
  const exchange = await request(app)
    .get(`/api/auth/oidc/exchange?code=${landing.searchParams.get('oidc_code')}`)
    .set('Cookie', `trek_oidc_exchange=${readCookie(cb, 'trek_oidc_exchange')}`);
  expect(exchange.status).toBe(200);
  return `trek_session=${readCookie(exchange, 'trek_session') ?? ''}`;
}

/** The native app hand-off from a signed-in browser session; answers the app's trek_session cookie. */
async function handOffToApp(browserCookie: string): Promise<string> {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('hex');
  const minted = await request(app).post('/api/auth/native/handoff').set('Cookie', browserCookie).send({ challenge });
  expect(minted.status).toBe(200);
  const redeemed = await request(app)
    .post('/api/auth/native/exchange')
    .send({ code: String(minted.body.code), verifier });
  expect(redeemed.status).toBe(200);
  return `trek_session=${readCookie(redeemed, 'trek_session') ?? ''}`;
}

const me = (cookie: string) => request(app).get('/api/auth/me').set('Cookie', cookie);
const post = (form: Record<string, string>) => request(app).post(ROUTE).type('form').send(form);

describe('POST /api/auth/oidc/backchannel-logout', () => {
  it('BCL-E2E-001: a token with sub and sid ends only the session that sign-in made', async () => {
    const { user } = await makeUser(orm, { email: EMAIL });
    const first = await signIn('op-session-1');
    const second = await signIn('op-session-2');
    const rows = await sessionRowsOf(orm, user.id);
    expect(rows).toHaveLength(2);

    const res = await post({ logout_token: logoutToken({ sub: SUBJECT, sid: 'op-session-1' }) });

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({});
    expect((await me(first)).status).toBe(401);
    expect((await me(second)).status).toBe(200);
  });

  it('BCL-E2E-002: a token with only sid ends that session too', async () => {
    await makeUser(orm, { email: EMAIL });
    const first = await signIn('op-session-1');
    const second = await signIn('op-session-2');

    const res = await post({ logout_token: logoutToken({ sid: 'op-session-2' }) });

    expect(res.status).toBe(200);
    expect((await me(first)).status).toBe(200);
    expect((await me(second)).status).toBe(401);
  });

  it('BCL-E2E-003: a token with only sub ends every session of the account, with or without a sid', async () => {
    const { user } = await makeUser(orm, { email: EMAIL });
    const withSid = await signIn('op-session-1');
    const withoutSid = await signIn(null);

    const res = await post({ logout_token: logoutToken({ sub: SUBJECT }) });

    expect(res.status).toBe(200);
    expect((await me(withSid)).status).toBe(401);
    expect((await me(withoutSid)).status).toBe(401);
    expect((await sessionRowsOf(orm, user.id)).every((row) => row.revoked_at !== null)).toBe(true);
  });

  it('BCL-E2E-009: a token with sub and sid ends the app session handed off from that sign-in too', async () => {
    const { user } = await makeUser(orm, { email: EMAIL });
    const browser = await signIn('op-session-1');
    const other = await signIn('op-session-2');
    const appSession = await handOffToApp(browser);
    expect((await me(appSession)).status).toBe(200);
    expect(await sessionRowsOf(orm, user.id)).toHaveLength(3);

    const res = await post({ logout_token: logoutToken({ sub: SUBJECT, sid: 'op-session-1' }) });

    expect(res.status).toBe(200);
    expect((await me(browser)).status).toBe(401);
    expect((await me(appSession)).status).toBe(401);
    expect((await me(other)).status).toBe(200);
  });

  it('BCL-E2E-004: an unknown subject answers 200 and ends nothing', async () => {
    await makeUser(orm, { email: EMAIL });
    const session = await signIn('op-session-1');

    const res = await post({ logout_token: logoutToken({ sub: 'someone-else', sid: 'op-session-1' }) });

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({});
    expect((await me(session)).status).toBe(200);
  });

  it('BCL-E2E-005: a token signed by another key answers 400 invalid_request and ends nothing', async () => {
    await makeUser(orm, { email: EMAIL });
    const session = await signIn('op-session-1');

    const res = await post({ logout_token: logoutToken({ sub: SUBJECT }, stranger.privateKey) });

    expect(res.status).toBe(400);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({
      error: 'invalid_request',
      error_description: 'The logout token is missing or invalid.',
    });
    expect((await me(session)).status).toBe(200);
  });

  it('BCL-E2E-006: a replayed token answers 400 the second time', async () => {
    await makeUser(orm, { email: EMAIL });
    await signIn('op-session-1');
    const token = logoutToken({ sub: SUBJECT });

    expect((await post({ logout_token: token })).status).toBe(200);
    const again = await post({ logout_token: token });
    expect(again.status).toBe(400);
    expect(again.body).toEqual(expect.objectContaining({ error: 'invalid_request' }));
  });

  it('BCL-E2E-007: a body without logout_token, or a JSON one, answers 400 with no-store', async () => {
    const missing = await post({ token: 'x' });
    expect(missing.status).toBe(400);
    expect(missing.headers['cache-control']).toBe('no-store');
    expect(missing.body).toEqual({
      error: 'invalid_request',
      error_description: 'The logout_token parameter is missing or malformed.',
    });
    expect((await request(app).post(ROUTE).send({})).status).toBe(400);
  });

  it('BCL-E2E-008: without OIDC configured the route still answers, with 400', async () => {
    delete process.env.OIDC_ISSUER;
    delete process.env.OIDC_CLIENT_ID;
    delete process.env.OIDC_CLIENT_SECRET;

    const res = await post({ logout_token: logoutToken({ sub: SUBJECT }) });

    expect(res.status).toBe(400);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({ error: 'invalid_request', error_description: 'OpenID Connect is not configured.' });
  });
});
