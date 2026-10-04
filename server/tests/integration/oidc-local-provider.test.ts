/**
 * The whole OIDC login against a real provider on this machine (#2506).
 *
 * oidc.test.ts stubs the four provider calls to test the flow around them. This
 * file stubs nothing but the resolver: the provider is a small HTTP server on
 * loopback that answers discovery, authorize, token, JWKS (with a real RS256
 * signature) and userinfo, so every request the login makes goes through the
 * SSRF guard to a socket.
 *
 * Its name resolves the way a LAN DNS server answers for a self-hosted IdP: an
 * fe80:: record next to the reachable address. Since 4.3.0 that one record
 * refused the name, and every login ended in `{"error":"OIDC login failed"}`.
 * Loopback stands in for the LAN address, being the one address a test can
 * reach; the admin lane OIDC rides on treats the two alike.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import http from 'node:http';
import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

const { answers } = vi.hoisted(() => ({ answers: new Map<string, { address: string; family: number }[]>() }));

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER: '30d',
  SESSION_DURATION_REMEMBER_MS: 2592000000,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
// The provider's names are answered here; every other name goes to the real resolver.
vi.mock('dns/promises', async (importOriginal) => {
  const real = await importOriginal<typeof import('dns/promises')>();
  const lookup = ((hostname: string, options?: { all?: boolean }) => {
    const answer = answers.get(hostname);
    if (!answer) return real.lookup(hostname, options as never);
    return Promise.resolve(options?.all ? answer : answer[0]);
  }) as typeof real.lookup;
  return { ...real, default: { ...real, lookup }, lookup };
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser } from '../helpers/factories';

const CLIENT_ID = 'trek-local';
const CLIENT_SECRET = 'local-secret';
const EMAIL = 'lan-admin@home.test';

/** Read one cookie's value out of a response's Set-Cookie header, as a browser would. */
function readCookie(res: request.Response, name: string): string | undefined {
  const raw = res.headers['set-cookie'];
  const all: string[] = Array.isArray(raw) ? raw : raw ? [raw as unknown as string] : [];
  const value = all.filter((c) => c.startsWith(`${name}=`)).pop()?.split(';')[0].slice(name.length + 1);
  return value ? decodeURIComponent(value) : undefined;
}

// ── The provider ────────────────────────────────────────────────────────────

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };
const codes = new Set<string>();
/** Every request the provider saw: method, path and the address the client dialled. */
const seen: { method: string; path: string; local: string }[] = [];
let provider: http.Server;
let port = 0;

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
function signIdToken(issuer: string): string {
  const now = Math.floor(Date.now() / 1000);
  const signingInput = `${b64({ alg: 'RS256', kid: 'k1', typ: 'JWT' })}.${b64({
    iss: issuer, sub: 'lan-sub-1', aud: CLIENT_ID, iat: now, exp: now + 300, email: EMAIL, email_verified: true,
  })}`;
  return `${signingInput}.${crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey).toString('base64url')}`;
}

function answerJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  // The Host header carries the name TREK asked for, so one server plays every issuer.
  const issuer = `http://${req.headers.host}`;
  const url = new URL(req.url ?? '/', issuer);
  seen.push({ method: req.method ?? '', path: url.pathname, local: req.socket.localAddress ?? '' });
  if (url.pathname === '/.well-known/openid-configuration') {
    return answerJson(res, 200, {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/jwks`,
    });
  }
  if (url.pathname === '/authorize') {
    const code = crypto.randomBytes(12).toString('hex');
    codes.add(code);
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
      if (!codes.delete(code) || form.get('client_secret') !== CLIENT_SECRET || !form.get('code_verifier')) {
        return answerJson(res, 400, { error: 'invalid_grant' });
      }
      answerJson(res, 200, { access_token: 'lan-access', token_type: 'Bearer', id_token: signIdToken(issuer) });
    });
    return;
  }
  if (url.pathname === '/userinfo') {
    if (req.headers.authorization !== 'Bearer lan-access') return answerJson(res, 401, { error: 'invalid_token' });
    return answerJson(res, 200, { sub: 'lan-sub-1', email: EMAIL, email_verified: true, name: 'LAN Admin' });
  }
  if (url.pathname === '/jwks') return answerJson(res, 200, { keys: [jwk] });
  answerJson(res, 404, { error: 'not_found' });
}

// ── The app ─────────────────────────────────────────────────────────────────

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  provider = http.createServer(handle);
  await new Promise<void>((resolve) => provider.listen(0, '127.0.0.1', resolve));
  port = (provider.address() as AddressInfo).port;
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
  seen.length = 0;
  answers.clear();
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
  testDb.close();
});

/** Point TREK at the provider under `host`, answering the name with `answer`. */
function useIssuer(host: string, answer: { address: string; family: number }[]): string {
  answers.set(host, answer);
  const issuer = `http://${host}:${port}`;
  process.env.OIDC_ISSUER = issuer;
  return issuer;
}

describe('OIDC login against a provider whose name has an fe80:: record (#2506)', () => {
  it('OIDC-LAN-001: signs in end to end, and every provider request lands on the vetted address', async () => {
    const { user } = createUser(testDb, { email: EMAIL });
    // Link-local first, the order Windows and some LAN resolvers hand it out in.
    const issuer = useIssuer('idp.home.test', [
      { address: 'fe80::1', family: 6 },
      { address: 'fe80::f9f1:353:73:14a0', family: 6 },
      { address: '127.0.0.1', family: 4 },
    ]);

    const login = await request(app).get('/api/auth/oidc/login');
    expect(login.status).toBe(302);
    const authorize = new URL(login.headers.location!);
    expect(authorize.origin).toBe(issuer);
    const state = readCookie(login, 'trek_oidc_state')!;
    expect(authorize.searchParams.get('state')).toBe(state);

    // The browser's leg: the provider sends it back to /callback with a code.
    const back = await fetch(`http://127.0.0.1:${port}${authorize.pathname}${authorize.search}`, { redirect: 'manual' });
    const callbackUrl = new URL(back.headers.get('location')!);
    const cb = await request(app)
      .get(`${callbackUrl.pathname}${callbackUrl.search}`)
      .set('Cookie', `trek_oidc_state=${state}`);
    expect(cb.status).toBe(302);
    const landing = new URL(cb.headers.location!, 'http://localhost');
    expect(landing.searchParams.get('oidc_error')).toBeNull();
    const oidcCode = landing.searchParams.get('oidc_code')!;
    expect(oidcCode).toBeTruthy();

    const exchange = await request(app)
      .get(`/api/auth/oidc/exchange?code=${oidcCode}`)
      .set('Cookie', `trek_oidc_exchange=${readCookie(cb, 'trek_oidc_exchange')}`);
    expect(exchange.status).toBe(200);
    const session = readCookie(exchange, 'trek_session');
    expect(session).toBeTruthy();

    const me = await request(app).get('/api/auth/me').set('Cookie', `trek_session=${session}`);
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ id: user.id, email: EMAIL });

    // Discovery, token, JWKS and userinfo all went out, each over loopback.
    const server = seen.filter((r) => r.path !== '/authorize');
    expect(server.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /.well-known/openid-configuration',
      'POST /token',
      'GET /jwks',
      'GET /userinfo',
    ]);
    expect(new Set(server.map((r) => r.local))).toEqual(new Set(['127.0.0.1']));
  });

  it('OIDC-LAN-002: a name with nothing but link-local and metadata records is still refused', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    useIssuer('metadata.home.test', [
      { address: 'fe80::1', family: 6 },
      { address: '169.254.169.254', family: 4 },
      { address: 'fd00:ec2::254', family: 6 },
    ]);

    const login = await request(app).get('/api/auth/oidc/login');

    expect(login.status).toBe(500);
    expect(login.body).toEqual({ error: 'OIDC login failed' });
    expect(errors).toHaveBeenCalledWith(
      '[OIDC] Login error:',
      'Requests to link-local / cloud-metadata addresses are not allowed',
    );
    expect(seen).toEqual([]);
  });
});
