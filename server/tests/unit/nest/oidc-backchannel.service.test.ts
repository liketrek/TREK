/**
 * OidcBackchannelService: the checks of OpenID Connect Back-Channel Logout 1.0
 * section 2.6 on a logout token, one refusal reason per case, and the sessions
 * a valid token ends, over the container and a migrated in-memory SQLite.
 *
 * The provider is real cryptography on a key pair made here: its discovery
 * document and JWKS are answered by the SSRF guard's admin-configured fetch,
 * which each case reaches through the real OidcService (discovery, JWKS,
 * signature, audience, issuer). Only the OIDC configuration is replaced.
 */
import { AuditLog } from '../../../src/db/entities/AuditLog.entity';
import { UserSessions } from '../../../src/db/entities/UserSessions.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { AppConfigModule } from '../../../src/nest/app-config/app-config.module';
import { DomainError } from '../../../src/nest/common/domain-error';
import {
  BACKCHANNEL_LOGOUT_EVENT,
  LOGOUT_TOKEN_CLOCK_SKEW_SEC,
  LOGOUT_TOKEN_MAX_AGE_SEC,
  OidcBackchannelService,
} from '../../../src/nest/oidc/oidc-backchannel.service';
import { OidcModule } from '../../../src/nest/oidc/oidc.module';
import { OidcService, type OidcConfig } from '../../../src/nest/oidc/oidc.service';
import { OIDC_SID_MAX_LENGTH, SessionsService } from '../../../src/nest/sessions/sessions.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { generateKeyPairSync, randomUUID, type KeyObject } from 'crypto';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetchAdminConfigured } = vi.hoisted(() => ({ safeFetchAdminConfigured: vi.fn() }));
vi.mock('../../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/utils/ssrfGuard')>()),
  safeFetchAdminConfigured,
}));
vi.mock('../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/audit/audit-log.logger')>()),
  logWarn: vi.fn(),
  logInfo: vi.fn(),
}));

const ISSUER = 'https://idp.example.test';
const CLIENT_ID = 'trek-client';
const JWKS_URI = `${ISSUER}/jwks`;
const CONFIG: OidcConfig = {
  issuer: ISSUER,
  clientId: CLIENT_ID,
  clientSecret: 'secret',
  displayName: 'SSO',
  discoveryUrl: null,
};

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256', use: 'sig' };

/** The provider's documents: discovery at the issuer, the JWKS beside it. */
function answer(url: string): Response {
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  if (url.endsWith('/.well-known/openid-configuration') || url === CUSTOM_DISCOVERY) {
    return json({
      issuer: url === CUSTOM_DISCOVERY ? CUSTOM_ISSUER : ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      userinfo_endpoint: `${ISSUER}/userinfo`,
      jwks_uri: JWKS_URI,
    });
  }
  if (url === JWKS_URI) return json({ keys: [jwk] });
  return new Response('not found', { status: 404 });
}
const CUSTOM_DISCOVERY = 'https://idp.example.test/realms/trek/.well-known/openid-configuration';
const CUSTOM_ISSUER = 'https://idp.example.test/realms/trek';

const nowSec = () => Math.floor(Date.now() / 1000);

/**
 * A logout token. `claims` overrides the valid defaults; an override of
 * `undefined` leaves the claim out.
 */
function logoutToken(
  claims: Record<string, unknown> = {},
  opts: { key?: KeyObject; header?: Record<string, unknown> } = {},
): string {
  const payload: Record<string, unknown> = {
    iss: ISSUER,
    aud: CLIENT_ID,
    iat: nowSec(),
    jti: randomUUID(),
    events: { [BACKCHANNEL_LOGOUT_EVENT]: {} },
    sub: 'sub-1',
    ...claims,
  };
  for (const [key, value] of Object.entries(payload)) if (value === undefined) delete payload[key];
  return jwt.sign(payload, opts.key ?? privateKey, {
    algorithm: 'RS256',
    // jsonwebtoken keeps a given iat and adds one when there is none; only a
    // token meant to lack it is signed without.
    noTimestamp: payload.iat === undefined,
    header: { alg: 'RS256', kid: 'k1', typ: 'logout+jwt', ...opts.header } as jwt.JwtHeader,
  });
}

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

const db = createSnapshotTestDb();
let t: TestModule;
const orm = () => t.get(MikroORM);
const service = () => t.get(OidcBackchannelService);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [AppConfigModule, OidcModule] });
});

afterAll(async () => {
  await t.close();
  db.close();
});

beforeEach(() => {
  resetTestDb(db);
  vi.clearAllMocks();
  safeFetchAdminConfigured.mockImplementation(async (url: string) => answer(url));
  vi.spyOn(t.get(OidcService), 'getOidcConfig').mockResolvedValue(CONFIG);
});

/** An account linked to the provider under `sub`. */
async function linkedUser(sub: string, issuer = ISSUER) {
  const { user } = await makeUser(orm());
  await updateRows(orm(), Users, { id: user.id }, { oidc_sub: sub, oidc_issuer: issuer });
  return user;
}

/** A tracked session for the user, with the provider's `sid` when given; answers its id. */
async function session(userId: number, oidcSid?: string): Promise<string> {
  const token = await t.get(SessionsService).issue({ id: userId, pv: 0 }, undefined, oidcSid ? { oidcSid } : {});
  return (jwt.decode(token) as { jti: string }).jti;
}

async function revokedAt(id: string): Promise<string | null | undefined> {
  return (await findRow(orm(), UserSessions, { id }))?.revoked_at;
}

/** The reason validateLogoutToken gives for a token. */
async function reasonFor(token: string, config: OidcConfig = CONFIG): Promise<string> {
  const check = await service().validateLogoutToken(token, config);
  return 'reason' in check ? check.reason : 'valid';
}

describe('OidcBackchannelService.validateLogoutToken: section 2.6, one refusal per check', () => {
  it('BCL-SVC-001: a well-formed token passes and answers its claims', async () => {
    const token = logoutToken({ sid: 'op-1', jti: 'j-1' });
    const check = await service().validateLogoutToken(token, CONFIG);
    expect(check).toEqual({
      valid: true,
      claims: expect.objectContaining({ iss: ISSUER, jti: 'j-1', sub: 'sub-1', sid: 'op-1' }),
    });
  });

  it('BCL-SVC-002: a signature by another key is refused', async () => {
    expect(await reasonFor(logoutToken({}, { key: other.privateKey }))).toMatch(/invalid signature/);
  });

  it('BCL-SVC-003: alg none is refused before any key is looked at', async () => {
    const unsigned = `${b64({ alg: 'none', typ: 'logout+jwt' })}.${b64({
      iss: ISSUER,
      aud: CLIENT_ID,
      iat: nowSec(),
      jti: 'x',
      sub: 'sub-1',
      events: { [BACKCHANNEL_LOGOUT_EVENT]: {} },
    })}.`;
    expect(await reasonFor(unsigned)).toBe('unsupported_alg');
  });

  it('BCL-SVC-004: an HMAC token (a forgery with the client secret) is refused', async () => {
    const hmac = jwt.sign({ iss: ISSUER, aud: CLIENT_ID, sub: 'sub-1' }, 'secret', { algorithm: 'HS256' });
    expect(await reasonFor(hmac)).toBe('unsupported_alg');
  });

  it('BCL-SVC-005: a wrong issuer is refused', async () => {
    expect(await reasonFor(logoutToken({ iss: 'https://evil.example.test' }))).toMatch(/issuer invalid/);
  });

  it('BCL-SVC-006: a wrong audience is refused', async () => {
    expect(await reasonFor(logoutToken({ aud: 'another-client' }))).toMatch(/audience invalid/);
  });

  it('BCL-SVC-007: an audience list holding the client id passes', async () => {
    expect(await reasonFor(logoutToken({ aud: ['another-client', CLIENT_ID] }))).toBe('valid');
  });

  it('BCL-SVC-008: a missing events claim is refused', async () => {
    expect(await reasonFor(logoutToken({ events: undefined }))).toBe('missing_logout_event');
  });

  it('BCL-SVC-009: events without the back-channel logout member, or with a non-object member, are refused', async () => {
    expect(await reasonFor(logoutToken({ events: { 'http://example.test/other': {} } }))).toBe('missing_logout_event');
    expect(await reasonFor(logoutToken({ events: { [BACKCHANNEL_LOGOUT_EVENT]: 'yes' } }))).toBe(
      'missing_logout_event',
    );
    expect(await reasonFor(logoutToken({ events: [BACKCHANNEL_LOGOUT_EVENT] }))).toBe('missing_logout_event');
  });

  it('BCL-SVC-010: a nonce is refused (an id_token, not a logout token)', async () => {
    expect(await reasonFor(logoutToken({ nonce: 'n-1' }))).toBe('nonce_present');
  });

  it('BCL-SVC-011: neither sub nor sid is refused, and so is an empty or non-string one', async () => {
    expect(await reasonFor(logoutToken({ sub: undefined }))).toBe('no_sub_or_sid');
    expect(await reasonFor(logoutToken({ sub: '' }))).toBe('bad_sub');
    expect(await reasonFor(logoutToken({ sub: undefined, sid: 42 }))).toBe('bad_sid');
  });

  it('BCL-SVC-012: a sid alone passes', async () => {
    expect(await reasonFor(logoutToken({ sub: undefined, sid: 'op-1' }))).toBe('valid');
  });

  it('BCL-SVC-013: an iat older than the window is refused, one inside it passes', async () => {
    const window = LOGOUT_TOKEN_MAX_AGE_SEC + LOGOUT_TOKEN_CLOCK_SKEW_SEC;
    expect(await reasonFor(logoutToken({ iat: nowSec() - window - 5 }))).toBe('stale_iat');
    expect(await reasonFor(logoutToken({ iat: nowSec() - LOGOUT_TOKEN_MAX_AGE_SEC + 5 }))).toBe('valid');
  });

  it('BCL-SVC-014: an iat past the clock skew in the future is refused', async () => {
    expect(await reasonFor(logoutToken({ iat: nowSec() + LOGOUT_TOKEN_CLOCK_SKEW_SEC + 30 }))).toBe('iat_in_future');
  });

  it('BCL-SVC-015: a missing iat is refused', async () => {
    expect(await reasonFor(logoutToken({ iat: undefined }))).toBe('missing_iat');
  });

  it('BCL-SVC-016: an expired exp is refused; a token without exp passes', async () => {
    expect(await reasonFor(logoutToken({ exp: nowSec() - LOGOUT_TOKEN_CLOCK_SKEW_SEC - 5 }))).toMatch(/jwt expired/);
    expect(await reasonFor(logoutToken({ exp: undefined }))).toBe('valid');
  });

  it('BCL-SVC-017: a missing jti is refused', async () => {
    expect(await reasonFor(logoutToken({ jti: undefined }))).toBe('missing_jti');
  });

  it('BCL-SVC-018: typ logout+jwt, JWT or none pass; another explicit type is refused', async () => {
    expect(await reasonFor(logoutToken({}, { header: { typ: 'JWT' } }))).toBe('valid');
    expect(await reasonFor(logoutToken({}, { header: { typ: 'application/logout+jwt' } }))).toBe('valid');
    expect(await reasonFor(logoutToken({}, { header: { typ: undefined } }))).toBe('valid');
    expect(await reasonFor(logoutToken({}, { header: { typ: 'at+jwt' } }))).toBe('wrong_typ');
  });

  it('BCL-SVC-019: a malformed token is refused', async () => {
    expect(await reasonFor('not-a-jwt')).toBe('malformed_token');
    expect(await reasonFor('a.b.c.d.e')).toBe('malformed_token');
  });

  it('BCL-SVC-020: a provider whose discovery cannot be fetched refuses the token instead of failing', async () => {
    safeFetchAdminConfigured.mockImplementation(async () => new Response('down', { status: 503 }));
    const config = { ...CONFIG, issuer: 'https://down.example.test' };
    expect(await reasonFor(logoutToken({ iss: config.issuer }), config)).toMatch(/^discovery_failed/);
  });

  it('BCL-SVC-021: with a custom discovery URL the issuer of the discovery document is the one accepted', async () => {
    const config = { ...CONFIG, discoveryUrl: CUSTOM_DISCOVERY };
    expect(await reasonFor(logoutToken({ iss: CUSTOM_ISSUER }), config)).toBe('valid');
    expect(await reasonFor(logoutToken({ iss: ISSUER }), config)).toMatch(/issuer invalid/);
  });
});

describe('OidcBackchannelService.logout', () => {
  /** What the route answers for a refused token, and the reason recorded in the error code. */
  async function refusal(token: string): Promise<{ status: number; body: unknown; code: string }> {
    const err = await service()
      .logout(token, '203.0.113.5')
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(err).toBeInstanceOf(DomainError);
    const domain = err as DomainError;
    return { status: domain.getStatus(), body: domain.toBody(), code: domain.code };
  }

  it('BCL-SVC-030: a token with sub and sid ends only the sessions carrying that sid for that account', async () => {
    const user = await linkedUser('sub-1');
    const stranger = await linkedUser('sub-2');
    const ended = await session(user.id, 'op-1');
    const sibling = await session(user.id, 'op-2');
    const password = await session(user.id);
    const theirs = await session(stranger.id, 'op-1');

    await service().logout(logoutToken({ sub: 'sub-1', sid: 'op-1' }), '203.0.113.5');

    expect(await revokedAt(ended)).not.toBeNull();
    expect(await revokedAt(sibling)).toBeNull();
    expect(await revokedAt(password)).toBeNull();
    expect(await revokedAt(theirs)).toBeNull();
    const audit = await findRows(orm(), AuditLog, { action: 'oidc.backchannel_logout' });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toEqual(expect.objectContaining({ user_id: user.id, ip: '203.0.113.5' }));
    expect(JSON.parse(String(audit[0]?.details))).toEqual({ scope: 'session', revoked: 1 });
  });

  it('BCL-SVC-031: a token with only sub ends every session of the account', async () => {
    const user = await linkedUser('sub-1');
    const stranger = await linkedUser('sub-2');
    const a = await session(user.id, 'op-1');
    const b = await session(user.id);
    const theirs = await session(stranger.id);

    await service().logout(logoutToken({ sub: 'sub-1' }), null);

    expect(await revokedAt(a)).not.toBeNull();
    expect(await revokedAt(b)).not.toBeNull();
    expect(await revokedAt(theirs)).toBeNull();
  });

  it('BCL-SVC-032: a token with only sid ends that provider session wherever it is, never one of another issuer', async () => {
    const user = await linkedUser('sub-1');
    const moved = await linkedUser('sub-9', 'https://old-idp.example.test');
    const ended = await session(user.id, 'op-1');
    const kept = await session(user.id, 'op-2');
    const elsewhere = await session(moved.id, 'op-1');

    await service().logout(logoutToken({ sub: undefined, sid: 'op-1' }), null);

    expect(await revokedAt(ended)).not.toBeNull();
    expect(await revokedAt(kept)).toBeNull();
    expect(await revokedAt(elsewhere)).toBeNull();
  });

  it('BCL-SVC-033: a subject without an account here succeeds and ends nothing', async () => {
    const user = await linkedUser('sub-1');
    const live = await session(user.id, 'op-1');

    await expect(service().logout(logoutToken({ sub: 'nobody', sid: 'op-1' }), null)).resolves.toBeUndefined();

    expect(await revokedAt(live)).toBeNull();
    expect(await findRows(orm(), AuditLog, { action: 'oidc.backchannel_logout' })).toHaveLength(0);
  });

  it('BCL-SVC-034: a sid no session carries succeeds and ends nothing', async () => {
    const user = await linkedUser('sub-1');
    const live = await session(user.id, 'op-1');
    await expect(service().logout(logoutToken({ sub: undefined, sid: 'unknown' }), null)).resolves.toBeUndefined();
    expect(await revokedAt(live)).toBeNull();
  });

  it('BCL-SVC-035: the same jti is refused the second time, as a replay', async () => {
    await linkedUser('sub-1');
    const token = logoutToken({ jti: 'once' });
    await service().logout(token, null);
    expect(await refusal(token)).toEqual({
      status: 400,
      body: { error: 'invalid_request', error_description: 'The logout token is missing or invalid.' },
      code: 'replayed_jti',
    });
  });

  it('BCL-SVC-036: a refused token never uses up the jti of a real one', async () => {
    await linkedUser('sub-1');
    expect((await refusal(logoutToken({ jti: 'shared', nonce: 'n' }))).code).toBe('nonce_present');
    await expect(service().logout(logoutToken({ jti: 'shared' }), null)).resolves.toBeUndefined();
  });

  it('BCL-SVC-040: a logout that fails while ending the sessions frees the jti, so the retry is acted on', async () => {
    const user = await linkedUser('sub-1');
    const live = await session(user.id);
    const token = logoutToken({ jti: 'retried' });
    const revokeAll = vi
      .spyOn(t.get(SessionsService), 'revokeAll')
      .mockRejectedValueOnce(new Error('database is locked'));
    try {
      await expect(service().logout(token, null)).rejects.toThrow('database is locked');
      expect(await revokedAt(live)).toBeNull();

      await expect(service().logout(token, null)).resolves.toBeUndefined();
      expect(await revokedAt(live)).not.toBeNull();
      expect((await refusal(token)).code).toBe('replayed_jti');
    } finally {
      revokeAll.mockRestore();
    }
  });

  it('BCL-SVC-037: every refusal is the 400 invalid_request of section 2.8, the reason only in the code', async () => {
    const result = await refusal(logoutToken({}, { key: other.privateKey }));
    expect(result.status).toBe(400);
    expect(result.body).toEqual({
      error: 'invalid_request',
      error_description: 'The logout token is missing or invalid.',
    });
    expect(result.code).toMatch(/invalid signature/);
  });

  it('BCL-SVC-038: without an OIDC configuration the token is refused with 400', async () => {
    vi.spyOn(t.get(OidcService), 'getOidcConfig').mockResolvedValue(null);
    expect(await refusal(logoutToken())).toEqual({
      status: 400,
      body: { error: 'invalid_request', error_description: 'OpenID Connect is not configured.' },
      code: 'not_configured',
    });
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('BCL-SVC-039: the login stores the sid on the session, and drops one past the length cap', async () => {
    const user = await linkedUser('sub-1');
    const kept = await session(user.id, 'op-1');
    const dropped = await session(user.id, 'x'.repeat(OIDC_SID_MAX_LENGTH + 1));
    expect((await findRow(orm(), UserSessions, { id: kept }))?.oidc_sid).toBe('op-1');
    expect((await findRow(orm(), UserSessions, { id: dropped }))?.oidc_sid).toBeNull();
  });
});
