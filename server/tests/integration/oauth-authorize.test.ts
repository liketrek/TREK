/**
 * HTTP-level tests for GET /oauth/authorize — the MCP SDK authorizationHandler
 * wrapping TREK's OAuthServerProvider. Written as byte-level parity oracles for
 * the MCP/OAuth mount migration: they must pass identically while the handler
 * is mounted pre-init AND after it moves behind the Nest container.
 *
 * This was the one platform surface with no HTTP coverage at all —
 * trekOAuthProvider.authorize and trekClientsStore.getClient run for the first
 * time under test here.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';
import crypto from 'crypto';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

vi.mock('../../src/app-config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/app-config')>();
    return { ...actual, getMcpSafeUrl: () => 'https://trek.example.com' };
});

vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));
vi.mock('../../src/mcp/sessionManager', () => ({ revokeUserSessions: vi.fn(), revokeUserSessionsForClient: vi.fn(), sessions: new Map() }));

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser } from '../helpers/factories';
import { OauthService } from '../../src/nest/oauth/oauth.service';
import { UnitOfWork } from '../../src/nest/database/unit-of-work';
import { createTestAddonsService } from '../helpers/test-addons';
import { AuditService } from '../../src/nest/audit/audit.service';
import { createTestOrm, type TestOrm } from '../helpers/test-orm';
import { upsertRow } from '../helpers/factories/rows';
import { Addons } from '../../src/db/entities/Addons.entity';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { OauthClients } from '../../src/db/entities/OauthClients.entity';
import { OauthTokens } from '../../src/db/entities/OauthTokens.entity';
import { OauthConsents } from '../../src/db/entities/OauthConsents.entity';

// The consent controller writes pending codes through the container instance;
// the SDK-mounted authorize path reads them back. The map is module-scoped in
// oauth.pending-codes.ts, so a hand-built service instance shares it — the
// same single-instance property the full auth-code loop below proves end-to-end.
let containerSideOauth: OauthService;

let nestApp: INestApplication;
let app: Application;
let t: TestOrm;

function makePkce() {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
}

async function setMcpEnabled(enabled: boolean) {
    await upsertRow(t, Addons, {
        id: 'mcp', name: 'MCP', description: 'AI assistant integration', type: 'integration', icon: 'Terminal', enabled, sort_order: 12,
    });
}

/** DCR-register a public client and return its client_id. */
async function registerClient(redirectUri = 'https://client.example.com/cb', scope = 'trips:read'): Promise<string> {
    const res = await request(app)
        .post('/oauth/register')
        .set('Content-Type', 'application/json')
        .send({ redirect_uris: [redirectUri], token_endpoint_auth_method: 'none', scope });
    expect(res.status).toBe(201);
    return res.body.client_id as string;
}

beforeAll(async () => {
    nestApp = await buildApp();
    app = nestApp.getHttpAdapter().getInstance();
    t = await createTestOrm(testDb);
    containerSideOauth = new OauthService(t.repo(OauthClients), t.repo(OauthTokens), t.repo(OauthConsents), await createTestAddonsService(testDb), new AuditService(t.repo(AuditLog), t.repo(Users)), new UnitOfWork(t.em));
});

beforeEach(async () => {
    resetTestDb(testDb);
    await resetRateLimits(nestApp);
    await setMcpEnabled(true);
});

afterAll(async () => {
    await nestApp.close();
    await t.close();
    testDb.close();
});

describe('GET /oauth/authorize — SDK authorizationHandler over trekOAuthProvider', () => {
    it('AUTHZ-001 — happy path 302-redirects to the SPA consent page with the exact forwarded params', async () => {
        const clientId = await registerClient();
        const { challenge } = makePkce();

        const res = await request(app).get('/oauth/authorize').query({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: 'https://client.example.com/cb',
            scope: 'trips:read',
            state: 'st4te',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            resource: 'https://trek.example.com/mcp',
        });

        expect(res.status).toBe(302);
        const expected = new URLSearchParams({
            client_id: clientId,
            redirect_uri: 'https://client.example.com/cb',
            scope: 'trips:read',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            state: 'st4te',
            resource: 'https://trek.example.com/mcp',
        });
        expect(res.headers.location).toBe(`https://trek.example.com/oauth/consent?${expected.toString()}`);
    });

    it('AUTHZ-002 — omitted resource defaults to the MCP endpoint and still reaches consent', async () => {
        const clientId = await registerClient();
        const { challenge } = makePkce();

        const res = await request(app).get('/oauth/authorize').query({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: 'https://client.example.com/cb',
            scope: 'trips:read',
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });

        expect(res.status).toBe(302);
        const loc = new URL(res.headers.location);
        expect(`${loc.origin}${loc.pathname}`).toBe('https://trek.example.com/oauth/consent');
        expect(loc.searchParams.get('client_id')).toBe(clientId);
        // No resource param was sent, so none is forwarded.
        expect(loc.searchParams.get('resource')).toBeNull();
        expect(loc.searchParams.get('state')).toBeNull();
    });

    it('AUTHZ-002B: a private-use scheme registers and authorizes with the byte-identical URI (#2227)', async () => {
        const redirectUri = 'workbuddy://workbuddy/mcp/connector%3A/oauth/callback';
        const clientId = await registerClient(redirectUri);
        const { challenge } = makePkce();

        const res = await request(app).get('/oauth/authorize').query({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: 'trips:read',
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });

        expect(res.status).toBe(302);
        const loc = new URL(res.headers.location);
        expect(`${loc.origin}${loc.pathname}`).toBe('https://trek.example.com/oauth/consent');
        // Forwarded unchanged: the %3A must survive to the token exchange.
        expect(loc.searchParams.get('redirect_uri')).toBe(redirectUri);
    });

    it('AUTHZ-003 — wrong resource 302-redirects back to the client with invalid_target', async () => {
        const clientId = await registerClient();
        const { challenge } = makePkce();

        const res = await request(app).get('/oauth/authorize').query({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: 'https://client.example.com/cb',
            scope: 'trips:read',
            state: 'xyz',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            resource: 'https://evil.example.com/other',
        });

        expect(res.status).toBe(302);
        const loc = new URL(res.headers.location);
        expect(`${loc.origin}${loc.pathname}`).toBe('https://client.example.com/cb');
        expect(loc.searchParams.get('error')).toBe('invalid_target');
        expect(loc.searchParams.get('error_description')).toBe('Requested resource must be the TREK MCP endpoint');
        expect(loc.searchParams.get('state')).toBe('xyz');
    });

    it('AUTHZ-004 — unknown client_id is a 400 invalid_client, no redirect', async () => {
        const { challenge } = makePkce();
        const res = await request(app).get('/oauth/authorize').query({
            response_type: 'code',
            client_id: 'does-not-exist',
            redirect_uri: 'https://client.example.com/cb',
            scope: 'trips:read',
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('invalid_client');
    });

    it('AUTHZ-005 — unregistered redirect_uri is a 400 invalid_request, no redirect', async () => {
        const clientId = await registerClient();
        const { challenge } = makePkce();
        const res = await request(app).get('/oauth/authorize').query({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: 'https://attacker.example.com/cb',
            scope: 'trips:read',
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('invalid_request');
    });

    it('AUTHZ-006 — missing code_challenge redirects back to the client with invalid_request', async () => {
        const clientId = await registerClient();
        const res = await request(app).get('/oauth/authorize').query({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: 'https://client.example.com/cb',
            scope: 'trips:read',
        });
        expect(res.status).toBe(302);
        const loc = new URL(res.headers.location);
        expect(`${loc.origin}${loc.pathname}`).toBe('https://client.example.com/cb');
        expect(loc.searchParams.get('error')).toBe('invalid_request');
    });

    it('AUTHZ-007 — MCP addon off: authorize and register both 404 with empty bodies', async () => {
        await setMcpEnabled(false);
        const authz = await request(app).get('/oauth/authorize').query({ client_id: 'x' });
        expect(authz.status).toBe(404);
        expect(authz.text).toBe('');

        const reg = await request(app)
            .post('/oauth/register')
            .set('Content-Type', 'application/json')
            .send({ redirect_uris: ['https://client.example.com/cb'], token_endpoint_auth_method: 'none' });
        expect(reg.status).toBe(404);
        expect(reg.text).toBe('');
    });

    it('AUTHZ-008 — full loop: register → authorize → consent-written code → token exchange', async () => {
        const { user } = createUser(testDb);
        const clientId = await registerClient();
        const { verifier, challenge } = makePkce();

        // 1. authorize forwards to consent
        const authz = await request(app).get('/oauth/authorize').query({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: 'https://client.example.com/cb',
            scope: 'trips:read',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            resource: 'https://trek.example.com/mcp',
        });
        expect(authz.status).toBe(302);

        // 2. the consent controller writes the code through the container
        //    singleton; the module-scoped pending-code map is what lets the
        //    SDK-side exchange see it.
        const code = await containerSideOauth.createAuthCode({
            clientId,
            userId: user.id,
            redirectUri: 'https://client.example.com/cb',
            scopes: ['trips:read'],
            resource: 'https://trek.example.com/mcp',
            codeChallenge: challenge,
            codeChallengeMethod: 'S256',
        });
        expect(code).toBeTruthy();

        // 3. token exchange through the public token endpoint
        const token = await request(app).post('/oauth/token').send({
            grant_type: 'authorization_code',
            client_id: clientId,
            code,
            redirect_uri: 'https://client.example.com/cb',
            code_verifier: verifier,
            resource: 'https://trek.example.com/mcp',
        });
        expect(token.status).toBe(200);
        expect(token.body.access_token).toMatch(/^trekoa_/);
        expect(token.body.token_type).toBe('Bearer');
        expect(token.body.scope).toBe('trips:read');
    });
});
