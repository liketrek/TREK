/**
 * Unit tests for the OAuth 2.1 domain service.
 *
 * Moved 1:1 from tests/unit/services/oauthService.test.ts with the fold — the
 * cases and their names are unchanged; the free-function imports became
 * methods bound to a hand-constructed OauthService (the repo's DB-backed
 * service-test shape). The delegation cases of the old thin wrapper died with
 * it; mcpEnabled/mcpSafeUrl, the module metadata and the bridge seam are
 * pinned at the bottom.
 */
import { ADDON_IDS } from '../../../src/addons';
import { getMcpSafeUrl } from '../../../src/app-config';
import { db as testDb } from '../../../src/db/database';
import { AuditLog } from '../../../src/db/entities/AuditLog.entity';
import { OauthClients } from '../../../src/db/entities/OauthClients.entity';
import { OauthConsents } from '../../../src/db/entities/OauthConsents.entity';
import { OauthTokens } from '../../../src/db/entities/OauthTokens.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { AuditLogRepository } from '../../../src/db/repositories/AuditLog.repository';
import type { OauthClientsRepository } from '../../../src/db/repositories/OauthClients.repository';
import type { OauthConsentsRepository } from '../../../src/db/repositories/OauthConsents.repository';
import type { OauthTokensRepository } from '../../../src/db/repositories/OauthTokens.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import { dbNow } from '../../../src/db/types';
import { revokeUserSessionsForClient } from '../../../src/mcp/sessionManager';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import { AuditService } from '../../../src/nest/audit/audit.service';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import {
  MAX_PENDING_CODES,
  PendingCodeStore,
  processPendingCodes,
  sweepPendingCodes,
} from '../../../src/nest/oauth/oauth.pending-codes';
import { OauthService } from '../../../src/nest/oauth/oauth.service';
import { createUser } from '../../helpers/factories';
import { findRow, insertRow, updateRows } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import crypto from 'crypto';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
  };
  return mock;
});

vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  encrypt_api_key: (v: string) => v,
  decrypt_api_key: (v: string) => v,
  maybe_encrypt_api_key: (v: string) => v,
}));
vi.mock('../../../src/mcp/sessionManager', () => ({
  revokeUserSessions: vi.fn(),
  revokeUserSessionsForClient: vi.fn(),
  sessions: new Map(),
}));

vi.mock('../../../src/demo/demo-reset', () => ({ saveBaseline: vi.fn() }));

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn().mockReturnValue(true) }));

// PKCE helper — generates a valid code_verifier + code_challenge pair (RFC 7636)
function makePkce() {
  const verifier = crypto.randomBytes(32).toString('base64url'); // 43 chars
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url'); // 43 chars
  return { verifier, challenge };
}

// Stubbed rather than real: every case drives the MCP gate through this one
// flag, exactly as the addons.bridge mock did before the fold.
const addonsStub = { isAddonEnabled } as unknown as AddonsService;
let svc: OauthService;
let auditLogRepo: AuditLogRepository;
let usersRepo: UsersRepository;
let clientsRepo: OauthClientsRepository;
let tokensRepo: OauthTokensRepository;
let consentsRepo: OauthConsentsRepository;
let t: TestOrm;

// Legacy free-function names delegating to the service, so the moved cases below
// read exactly as they did before the fold. Arrow wrappers rather than `.bind`:
// with `strictBindCallApply: false` a bound alias is typed `any`, which would
// hide every missing `await` on the now-async methods from the type checker.
const createOAuthClient = (...args: Parameters<OauthService['createOAuthClient']>) => svc.createOAuthClient(...args);
const listOAuthClients = (...args: Parameters<OauthService['listOAuthClients']>) => svc.listOAuthClients(...args);
const deleteOAuthClient = (...args: Parameters<OauthService['deleteOAuthClient']>) => svc.deleteOAuthClient(...args);
const rotateOAuthClientSecret = (...args: Parameters<OauthService['rotateOAuthClientSecret']>) =>
  svc.rotateOAuthClientSecret(...args);
const createAuthCode = (...args: Parameters<OauthService['createAuthCode']>) => svc.createAuthCode(...args);
const consumeAuthCode = (...args: Parameters<OauthService['consumeAuthCode']>) => svc.consumeAuthCode(...args);
const issueTokens = (...args: Parameters<OauthService['issueTokens']>) => svc.issueTokens(...args);
const getUserByAccessToken = (...args: Parameters<OauthService['getUserByAccessToken']>) =>
  svc.getUserByAccessToken(...args);
const refreshTokens = (...args: Parameters<OauthService['refreshTokens']>) => svc.refreshTokens(...args);
const revokeToken = (...args: Parameters<OauthService['revokeToken']>) => svc.revokeToken(...args);
const listOAuthSessions = (...args: Parameters<OauthService['listOAuthSessions']>) => svc.listOAuthSessions(...args);
const revokeSession = (...args: Parameters<OauthService['revokeSession']>) => svc.revokeSession(...args);
const validateAuthorizeRequest = (...args: Parameters<OauthService['validateAuthorizeRequest']>) =>
  svc.validateAuthorizeRequest(...args);
const verifyPKCE = (...args: Parameters<OauthService['verifyPKCE']>) => svc.verifyPKCE(...args);
const authenticateClient = (...args: Parameters<OauthService['authenticateClient']>) => svc.authenticateClient(...args);
const saveConsent = (...args: Parameters<OauthService['saveConsent']>) => svc.saveConsent(...args);
const getConsent = (...args: Parameters<OauthService['getConsent']>) => svc.getConsent(...args);
const isConsentSufficient = (...args: Parameters<OauthService['isConsentSufficient']>) =>
  svc.isConsentSufficient(...args);

beforeAll(async () => {
  t = await createTestOrm(testDb);
  auditLogRepo = t.repo(AuditLog);
  usersRepo = t.repo(Users);
  clientsRepo = t.repo(OauthClients);
  tokensRepo = t.repo(OauthTokens);
  consentsRepo = t.repo(OauthConsents);
  svc = new OauthService(
    clientsRepo,
    tokensRepo,
    consentsRepo,
    addonsStub,
    new AuditService(auditLogRepo, usersRepo),
    new UnitOfWork(t.em),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
  // Clear oauth tables manually since they're not in the standard reset list
  testDb.exec('DELETE FROM oauth_tokens');
  testDb.exec('DELETE FROM oauth_consents');
  testDb.exec('DELETE FROM oauth_clients');
  isAddonEnabled.mockReturnValue(true);
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function makeClient(
  userId: number,
  overrides: Partial<{ name: string; redirectUris: string[]; scopes: string[] }> = {},
) {
  return await createOAuthClient(
    userId,
    overrides.name ?? 'Test Client',
    overrides.redirectUris ?? ['https://example.com/callback'],
    overrides.scopes ?? ['trips:read'],
  );
}

// ---------------------------------------------------------------------------
// createOAuthClient
// ---------------------------------------------------------------------------

describe('createOAuthClient', () => {
  it('creates a client successfully and returns client_secret only on creation', async () => {
    const { user } = createUser(testDb);
    const result = await makeClient(user.id);
    expect(result.error).toBeUndefined();
    expect(result.client).toBeDefined();
    expect(typeof result.client!.client_secret).toBe('string');
    expect((result.client!.client_secret as string).startsWith('trekcs_')).toBe(true);
  });

  it('client_id is a UUID', async () => {
    const { user } = createUser(testDb);
    const result = await makeClient(user.id);
    expect(result.client!.client_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns 400 error if name is empty', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, '', ['https://example.com/cb'], ['trips:read']);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Name');
  });

  it('returns 400 error if name exceeds 100 characters', async () => {
    const { user } = createUser(testDb);
    const longName = 'A'.repeat(101);
    const result = await createOAuthClient(user.id, longName, ['https://example.com/cb'], ['trips:read']);
    expect(result.status).toBe(400);
    expect(result.error).toContain('100');
  });

  it('returns 400 error if no redirect URIs provided', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, 'Test', [], ['trips:read']);
    expect(result.status).toBe(400);
    expect(result.error).toContain('redirect URI');
  });

  it('returns 400 error if more than 10 redirect URIs provided', async () => {
    const { user } = createUser(testDb);
    const uris = Array.from({ length: 11 }, (_, i) => `https://example${i}.com/cb`);
    const result = await createOAuthClient(user.id, 'Test', uris, ['trips:read']);
    expect(result.status).toBe(400);
    expect(result.error).toContain('10');
  });

  it('returns 400 error for invalid URI format', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, 'Test', ['not-a-url'], ['trips:read']);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Invalid redirect URI');
  });

  it('returns 400 error for non-https URI (not localhost)', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, 'Test', ['http://example.com/cb'], ['trips:read']);
    expect(result.status).toBe(400);
    expect(result.error).toContain('HTTPS');
  });

  it('allows http://localhost redirect URI', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, 'Test', ['http://localhost:3000/callback'], ['trips:read']);
    expect(result.error).toBeUndefined();
    expect(result.client).toBeDefined();
  });

  it('allows http://127.0.0.1 redirect URI', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, 'Test', ['http://127.0.0.1:5000/callback'], ['trips:read']);
    expect(result.error).toBeUndefined();
    expect(result.client).toBeDefined();
  });

  it('allows the http://[::1] loopback redirect URI (#2227)', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, 'Test', ['http://[::1]:8080/callback'], ['trips:read']);
    expect(result.error).toBeUndefined();
    expect(result.client).toBeDefined();
  });

  it('allows a private-use custom scheme (#2227)', async () => {
    const { user } = createUser(testDb);
    const uri = 'workbuddy://workbuddy/mcp/connector%3A/oauth/callback';
    const result = await createOAuthClient(user.id, 'Test', [uri], ['trips:read']);
    expect(result.error).toBeUndefined();
    // The stored value must round-trip untouched: the whole authorize/token
    // chain compares it byte for byte.
    expect(result.client!.redirect_uris).toEqual([uri]);
  });

  it('rejects dangerous schemes that a localhost host used to smuggle through (#2227)', async () => {
    const { user } = createUser(testDb);
    for (const uri of ['javascript://localhost/%0aalert(1)', 'blob://localhost/x', 'about://localhost/x']) {
      const result = await createOAuthClient(user.id, 'Test', [uri], ['trips:read']);
      expect(result.status).toBe(400);
      expect(result.error).toContain('Dangerous');
    }
  });

  it('rejects non-navigable schemes on a localhost host (#2227)', async () => {
    const { user } = createUser(testDb);
    for (const uri of ['ftp://localhost/x', 'wss://localhost/x']) {
      const result = await createOAuthClient(user.id, 'Test', [uri], ['trips:read']);
      expect(result.status).toBe(400);
      expect(result.error).toContain('HTTPS');
    }
  });

  it('returns 400 error if no scopes provided', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, 'Test', ['https://example.com/cb'], []);
    expect(result.status).toBe(400);
    expect(result.error).toContain('scope');
  });

  it('returns 400 error for invalid scopes', async () => {
    const { user } = createUser(testDb);
    const result = await createOAuthClient(user.id, 'Test', ['https://example.com/cb'], ['invalid:scope']);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Invalid scopes');
  });

  it('enforces max 10 clients per user', async () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < 10; i++) {
      const r = await makeClient(user.id, { name: `Client ${i}` });
      expect(r.error).toBeUndefined();
    }
    const eleventh = await makeClient(user.id, { name: 'Eleventh' });
    expect(eleventh.status).toBe(400);
    expect(eleventh.error).toContain('10');
  });
});

// ---------------------------------------------------------------------------
// listOAuthClients
// ---------------------------------------------------------------------------

describe('listOAuthClients', () => {
  it('returns empty array for user with no clients', async () => {
    const { user } = createUser(testDb);
    expect(await listOAuthClients(user.id)).toEqual([]);
  });

  it('returns created clients with redirect_uris and allowed_scopes as arrays', async () => {
    const { user } = createUser(testDb);
    await makeClient(user.id, {
      name: 'Client A',
      redirectUris: ['https://a.com/cb'],
      scopes: ['trips:read', 'budget:read'],
    });
    const clients = await listOAuthClients(user.id);
    expect(clients).toHaveLength(1);
    expect(clients[0].name).toBe('Client A');
    expect(Array.isArray(clients[0].redirect_uris)).toBe(true);
    expect(Array.isArray(clients[0].allowed_scopes)).toBe(true);
    expect(clients[0].allowed_scopes).toContain('trips:read');
  });
});

// ---------------------------------------------------------------------------
// deleteOAuthClient
// ---------------------------------------------------------------------------

describe('deleteOAuthClient', () => {
  it('deletes own client successfully', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientRowId = created.client!.id as string;
    const result = await deleteOAuthClient(user.id, clientRowId);
    expect(result.success).toBe(true);
    expect(await listOAuthClients(user.id)).toHaveLength(0);
  });

  it('returns 404 for non-existent client', async () => {
    const { user } = createUser(testDb);
    const result = await deleteOAuthClient(user.id, 'non-existent-id');
    expect(result.status).toBe(404);
  });

  it("returns 404 for another user's client", async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const created = await makeClient(owner.id);
    const result = await deleteOAuthClient(other.id, created.client!.id as string);
    expect(result.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// rotateOAuthClientSecret
// ---------------------------------------------------------------------------

describe('rotateOAuthClientSecret', () => {
  it('rotates secret and returns new client_secret starting with trekcs_', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const oldSecret = created.client!.client_secret as string;
    const result = await rotateOAuthClientSecret(user.id, created.client!.id as string);
    expect(result.error).toBeUndefined();
    expect(result.client_secret).toBeDefined();
    expect((result.client_secret as string).startsWith('trekcs_')).toBe(true);
    expect(result.client_secret).not.toBe(oldSecret);
  });

  it('returns 404 for non-existent client', async () => {
    const { user } = createUser(testDb);
    const result = await rotateOAuthClientSecret(user.id, 'non-existent-id');
    expect(result.status).toBe(404);
  });

  it('revokes old tokens after rotation', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const { access_token } = await issueTokens(clientId, user.id, ['trips:read']);
    expect(await getUserByAccessToken(access_token)).not.toBeNull();

    await rotateOAuthClientSecret(user.id, created.client!.id as string);

    expect(await getUserByAccessToken(access_token)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createAuthCode + consumeAuthCode
// ---------------------------------------------------------------------------

describe('createAuthCode + consumeAuthCode', () => {
  it('create code and consume it once returns the pending entry', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const code = await createAuthCode({
      clientId,
      userId: user.id,
      redirectUri: 'https://example.com/callback',
      scopes: ['trips:read'],
      resource: null,
      codeChallenge: 'abc123',
      codeChallengeMethod: 'S256',
    });

    const entry = await consumeAuthCode(code);
    expect(entry).not.toBeNull();
    expect(entry!.userId).toBe(user.id);
    expect(entry!.clientId).toBe(clientId);
  });

  it('returns null for non-existent code', async () => {
    expect(await consumeAuthCode('does-not-exist')).toBeNull();
  });

  it('consuming same code twice returns null (one-time use)', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const code = await createAuthCode({
      clientId,
      userId: user.id,
      redirectUri: 'https://example.com/callback',
      scopes: ['trips:read'],
      resource: null,
      codeChallenge: 'abc123',
      codeChallengeMethod: 'S256',
    });

    await consumeAuthCode(code);
    expect(await consumeAuthCode(code)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// issueTokens + getUserByAccessToken
// ---------------------------------------------------------------------------

describe('issueTokens + getUserByAccessToken', () => {
  it('issues tokens with correct prefixes', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const tokens = await issueTokens(clientId, user.id, ['trips:read']);
    expect(tokens.access_token.startsWith('trekoa_')).toBe(true);
    expect(tokens.refresh_token.startsWith('trekrf_')).toBe(true);
    expect(tokens.token_type).toBe('Bearer');
    expect(typeof tokens.expires_in).toBe('number');
  });

  it('getUserByAccessToken returns user and scopes for a valid token', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const { access_token } = await issueTokens(clientId, user.id, ['trips:read', 'budget:write']);
    const info = await getUserByAccessToken(access_token);
    expect(info).not.toBeNull();
    expect(info!.user.email).toBe(user.email);
    expect(info!.scopes).toContain('trips:read');
    expect(info!.scopes).toContain('budget:write');
  });

  it('getUserByAccessToken returns null for unknown token', async () => {
    expect(await getUserByAccessToken('trekoa_unknown')).toBeNull();
  });

  it('getUserByAccessToken returns null for revoked token', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const { access_token } = await issueTokens(clientId, user.id, ['trips:read']);
    await revokeToken(access_token, clientId);
    expect(await getUserByAccessToken(access_token)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// refreshTokens
// ---------------------------------------------------------------------------

describe('refreshTokens', () => {
  it('exchanges a refresh token for a new token pair', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    const { refresh_token } = await issueTokens(clientId, user.id, ['trips:read']);
    const result = await refreshTokens(refresh_token, clientId, rawSecret);
    expect(result.error).toBeUndefined();
    expect(result.tokens).toBeDefined();
    expect(result.tokens!.access_token.startsWith('trekoa_')).toBe(true);
  });

  it('revoking the old pair and issuing the new one are one write: a failing issue keeps the old pair', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    const { access_token, refresh_token } = await issueTokens(clientId, user.id, ['trips:read']);
    const spy = vi.spyOn(tokensRepo, 'insertToken').mockRejectedValueOnce(new Error('disk full'));
    await expect(refreshTokens(refresh_token, clientId, rawSecret)).rejects.toThrow('disk full');
    spy.mockRestore();

    // Before, the old pair was already revoked here and the client logged out.
    expect(await getUserByAccessToken(access_token)).not.toBeNull();
  });

  it('old tokens are revoked after refresh (rotation)', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    const { access_token, refresh_token } = await issueTokens(clientId, user.id, ['trips:read']);
    await refreshTokens(refresh_token, clientId, rawSecret);
    expect(await getUserByAccessToken(access_token)).toBeNull();
  });

  it('does not revoke the active MCP session on a normal (non-replayed) refresh (#1475)', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    const { refresh_token } = await issueTokens(clientId, user.id, ['trips:read']);
    const callsBefore = vi.mocked(revokeUserSessionsForClient).mock.calls.length;
    const result = await refreshTokens(refresh_token, clientId, rawSecret);
    expect(result.error).toBeUndefined();
    expect(vi.mocked(revokeUserSessionsForClient).mock.calls.length).toBe(callsBefore);
  });

  it('returns invalid_grant for unknown refresh token', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    const result = await refreshTokens('trekrf_unknown', clientId, rawSecret);
    expect(result.error).toBe('invalid_grant');
    expect(result.status).toBe(400);
  });

  it('returns invalid_grant for revoked token', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    const { access_token, refresh_token } = await issueTokens(clientId, user.id, ['trips:read']);
    await revokeToken(access_token, clientId);
    const result = await refreshTokens(refresh_token, clientId, rawSecret);
    expect(result.error).toBe('invalid_grant');
  });

  it('returns invalid_client for wrong client_secret', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const { refresh_token } = await issueTokens(clientId, user.id, ['trips:read']);
    const result = await refreshTokens(refresh_token, clientId, 'wrong-secret');
    expect(result.error).toBe('invalid_client');
    expect(result.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// revokeToken
// ---------------------------------------------------------------------------

describe('revokeToken', () => {
  it('after revoking access token, getUserByAccessToken returns null', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const { access_token } = await issueTokens(clientId, user.id, ['trips:read']);
    expect(await getUserByAccessToken(access_token)).not.toBeNull();

    await revokeToken(access_token, clientId);
    expect(await getUserByAccessToken(access_token)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// listOAuthSessions + revokeSession
// ---------------------------------------------------------------------------

describe('listOAuthSessions + revokeSession', () => {
  it('lists active sessions', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    await issueTokens(clientId, user.id, ['trips:read']);
    const sessions = await listOAuthSessions(user.id);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].client_id).toBe(clientId);
  });

  it('stores both expiries in the canonical text and lists them in the ISO spelling the API has always answered', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client?.client_id as string;

    await issueTokens(clientId, user.id, ['trips:read']);
    const row = await findRow(t, OauthTokens, { user: user.id });
    if (!row) throw new Error('token row not stored');
    expect(row.access_token_expires_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(row.refresh_token_expires_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    const [session] = await listOAuthSessions(user.id);
    expect(session.access_token_expires_at).toBe(`${row.access_token_expires_at.replace(' ', 'T')}.000Z`);
    expect(session.refresh_token_expires_at).toBe(`${row.refresh_token_expires_at.replace(' ', 'T')}.000Z`);
    const [adminRow] = (await svc.listAllOAuthSessions()) as Array<Record<string, unknown>>;
    expect(adminRow.access_token_expires_at).toBe(session.access_token_expires_at);
  });

  it('a legacy ISO expiry still lists as stored', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client?.client_id as string;
    await issueTokens(clientId, user.id, ['trips:read']);
    await updateRows(
      t,
      OauthTokens,
      { user: user.id },
      { access_token_expires_at: '2999-01-02T03:04:05.678Z', refresh_token_expires_at: '2999-01-02T03:04:05.678Z' },
    );

    const [session] = await listOAuthSessions(user.id);
    expect(session.access_token_expires_at).toBe('2999-01-02T03:04:05.678Z');
  });

  it('revoked session is not listed', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const { access_token } = await issueTokens(clientId, user.id, ['trips:read']);
    await revokeToken(access_token, clientId);
    const sessions = await listOAuthSessions(user.id);
    expect(sessions).toHaveLength(0);
  });

  it('revokeSession returns 404 for unknown session', async () => {
    const { user } = createUser(testDb);
    const result = await revokeSession(user.id, 99999);
    expect(result.status).toBe(404);
  });

  it('revokeSession by session id removes session from list', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    await issueTokens(clientId, user.id, ['trips:read']);
    const sessions = await listOAuthSessions(user.id);
    const sessionId = sessions[0].id as number;

    const result = await revokeSession(user.id, sessionId);
    expect(result.success).toBe(true);
    expect(await listOAuthSessions(user.id)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateAuthorizeRequest
// ---------------------------------------------------------------------------

describe('validateAuthorizeRequest', () => {
  // Use a proper 43-char S256 code_challenge to pass H1 format validation
  const { challenge: VALID_CHALLENGE } = makePkce();

  function makeParams(
    overrides: Partial<{
      response_type: string;
      client_id: string;
      redirect_uri: string;
      scope: string;
      code_challenge: string;
      code_challenge_method: string;
    }> = {},
  ) {
    return {
      response_type: 'code',
      client_id: '',
      redirect_uri: 'https://example.com/callback',
      scope: 'trips:read',
      code_challenge: VALID_CHALLENGE,
      code_challenge_method: 'S256',
      ...overrides,
    };
  }

  it('returns mcp_disabled when isAddonEnabled returns false', async () => {
    vi.mocked(isAddonEnabled).mockReturnValue(false);
    const result = await validateAuthorizeRequest(makeParams({ client_id: 'x' }), null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('mcp_disabled');
  });

  it('requires response_type=code', async () => {
    const { user } = createUser(testDb);
    const result = await validateAuthorizeRequest(makeParams({ response_type: 'token', client_id: 'x' }), user.id);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('unsupported_response_type');
  });

  it('requires PKCE with S256', async () => {
    const { user } = createUser(testDb);
    const result = await validateAuthorizeRequest(
      makeParams({ client_id: 'x', code_challenge_method: 'plain' }),
      user.id,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_request');
  });

  it('requires valid client_id', async () => {
    const { user } = createUser(testDb);
    const result = await validateAuthorizeRequest(makeParams({ client_id: 'nonexistent' }), user.id);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_client');
  });

  it('validates redirect_uri against registered URIs', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id, { redirectUris: ['https://example.com/callback'] });
    const clientId = created.client!.client_id as string;

    const result = await validateAuthorizeRequest(
      makeParams({ client_id: clientId, redirect_uri: 'https://evil.com/callback' }),
      user.id,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_redirect_uri');
  });

  it('accepts a loopback redirect on the port the OS handed the client (#2227)', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id, { redirectUris: ['http://[::1]:8080/oauth/callback'] });
    const clientId = created.client!.client_id as string;

    const result = await validateAuthorizeRequest(
      makeParams({ client_id: clientId, redirect_uri: 'http://[::1]:54321/oauth/callback' }),
      user.id,
    );
    expect(result.valid).toBe(true);
  });

  it('relaxes only the port of a loopback redirect, never the path (#2227)', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id, { redirectUris: ['http://127.0.0.1:8080/oauth/callback'] });
    const clientId = created.client!.client_id as string;

    const result = await validateAuthorizeRequest(
      makeParams({ client_id: clientId, redirect_uri: 'http://127.0.0.1:54321/stolen' }),
      user.id,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_redirect_uri');
  });

  it('validates scope against client allowed_scopes', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id, { scopes: ['trips:read'] });
    const clientId = created.client!.client_id as string;

    const result = await validateAuthorizeRequest(makeParams({ client_id: clientId, scope: 'budget:write' }), user.id);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_scope');
  });

  it('returns loginRequired when userId is null', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const result = await validateAuthorizeRequest(makeParams({ client_id: clientId }), null);
    expect(result.valid).toBe(true);
    expect(result.loginRequired).toBe(true);
  });

  it('returns consentRequired=true when consent not yet saved', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const result = await validateAuthorizeRequest(makeParams({ client_id: clientId }), user.id);
    expect(result.valid).toBe(true);
    expect(result.consentRequired).toBe(true);
  });

  it('returns consentRequired=false when consent already saved and sufficient', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    await saveConsent(clientId, user.id, ['trips:read']);
    const result = await validateAuthorizeRequest(makeParams({ client_id: clientId }), user.id);
    expect(result.valid).toBe(true);
    expect(result.consentRequired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verifyPKCE
// ---------------------------------------------------------------------------

describe('verifyPKCE', () => {
  it('returns true for valid code_verifier / code_challenge pair (SHA256 base64url)', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    expect(verifyPKCE(verifier, challenge)).toBe(true);
  });

  it('returns false for wrong verifier', async () => {
    const verifier = 'correct-verifier';
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    expect(verifyPKCE('wrong-verifier', challenge)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// authenticateClient
// ---------------------------------------------------------------------------

describe('authenticateClient', () => {
  it('returns client row for correct credentials', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    const client = await authenticateClient(clientId, rawSecret);
    expect(client).not.toBeNull();
    expect(client!.client_id).toBe(clientId);
  });

  it('returns null for wrong secret', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    expect(await authenticateClient(clientId, 'wrong-secret')).toBeNull();
  });

  it('returns null for unknown client_id', async () => {
    expect(await authenticateClient('unknown-client-id', 'any-secret')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// saveConsent + getConsent + isConsentSufficient
// ---------------------------------------------------------------------------

describe('saveConsent + getConsent + isConsentSufficient', () => {
  it('saves and retrieves consent', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    await saveConsent(clientId, user.id, ['trips:read', 'budget:write']);
    const consent = await getConsent(clientId, user.id);
    expect(consent).not.toBeNull();
    expect(consent).toContain('trips:read');
    expect(consent).toContain('budget:write');
  });

  it('isConsentSufficient returns true when all requested scopes are in existing', async () => {
    expect(isConsentSufficient(['trips:read', 'budget:write'], ['trips:read'])).toBe(true);
    expect(isConsentSufficient(['trips:read', 'budget:write'], ['trips:read', 'budget:write'])).toBe(true);
  });

  it('isConsentSufficient returns false when some scopes are missing', async () => {
    expect(isConsentSufficient(['trips:read'], ['trips:read', 'budget:write'])).toBe(false);
    expect(isConsentSufficient([], ['trips:read'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// M5 — saveConsent unions instead of replacing
// ---------------------------------------------------------------------------

describe('saveConsent — scope union (M5)', () => {
  it('unioning scopes: approving B after A leaves both in consent', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id, { scopes: ['trips:read', 'budget:write'] });
    const clientId = created.client!.client_id as string;

    await saveConsent(clientId, user.id, ['trips:read']);
    await saveConsent(clientId, user.id, ['budget:write']);

    const consent = await getConsent(clientId, user.id);
    expect(consent).toContain('trips:read');
    expect(consent).toContain('budget:write');
  });

  it('re-approving a superset scope still preserves previously-consented scopes', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id, { scopes: ['trips:read', 'trips:write'] });
    const clientId = created.client!.client_id as string;

    await saveConsent(clientId, user.id, ['trips:read', 'trips:write']);
    // approve only trips:read on a later request
    await saveConsent(clientId, user.id, ['trips:read']);

    const consent = await getConsent(clientId, user.id);
    // trips:write should NOT be removed (union semantics)
    expect(consent).toContain('trips:read');
    expect(consent).toContain('trips:write');
  });

  it('consent is sufficient after sequential approvals — no re-prompt needed', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id, { scopes: ['trips:read', 'budget:write'] });
    const clientId = created.client!.client_id as string;

    await saveConsent(clientId, user.id, ['trips:read']);
    await saveConsent(clientId, user.id, ['budget:write']);

    // Should not require consent again for either scope
    expect(isConsentSufficient((await getConsent(clientId, user.id))!, ['trips:read'])).toBe(true);
    expect(isConsentSufficient((await getConsent(clientId, user.id))!, ['budget:write'])).toBe(true);
    expect(isConsentSufficient((await getConsent(clientId, user.id))!, ['trips:read', 'budget:write'])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// C2 — getUserByAccessToken returns clientId
// ---------------------------------------------------------------------------

describe('getUserByAccessToken — includes clientId (C2)', () => {
  it('returns clientId matching the issuing OAuth client', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const { access_token } = await issueTokens(clientId, user.id, ['trips:read']);
    const info = await getUserByAccessToken(access_token);
    expect(info).not.toBeNull();
    expect(info!.clientId).toBe(clientId);
  });
});

// ---------------------------------------------------------------------------
// C3 — Refresh token replay detection and chain revocation
// ---------------------------------------------------------------------------

/**
 * Push a token's rotation out of the concurrency grace window (#1007), so the
 * replay cases below still describe theft — a token used minutes later — rather
 * than two clients racing.
 */
async function agePastGrace(rawRefreshToken: string) {
  const hash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const old = new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  await updateRows(t, OauthTokens, { refresh_token_hash: hash }, { revoked_at: old });
}

describe('refreshTokens — replay detection (C3)', () => {
  it('replaying a revoked refresh token returns invalid_grant', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    // Issue tokens, then rotate once (old token becomes revoked)
    const { refresh_token: firstRefresh } = await issueTokens(clientId, user.id, ['trips:read']);
    const rotateResult = await refreshTokens(firstRefresh, clientId, rawSecret);
    expect(rotateResult.error).toBeUndefined();
    const { refresh_token: secondRefresh } = rotateResult.tokens!;

    // Replay the FIRST (now revoked) refresh token, long enough after the
    // rotation that it cannot be a concurrent refresh.
    await agePastGrace(firstRefresh);
    const callsBefore = vi.mocked(revokeUserSessionsForClient).mock.calls.length;
    const replayResult = await refreshTokens(firstRefresh, clientId, rawSecret);
    expect(replayResult.error).toBe('invalid_grant');
    expect(replayResult.status).toBe(400);
    // Replay IS a security event — sessions must still be torn down here.
    expect(vi.mocked(revokeUserSessionsForClient).mock.calls.length).toBe(callsBefore + 1);
    expect(vi.mocked(revokeUserSessionsForClient)).toHaveBeenLastCalledWith(user.id, clientId);
  });

  it('replaying a revoked token also revokes the entire rotation chain', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    // Issue → rotate once
    const { refresh_token: first } = await issueTokens(clientId, user.id, ['trips:read']);
    const r1 = await refreshTokens(first, clientId, rawSecret);
    const { access_token: access2, refresh_token: second } = r1.tokens!;

    // Replay first (revoked) refresh token → chain revoke
    await agePastGrace(first);
    await refreshTokens(first, clientId, rawSecret);

    // The rotated access token should also be dead now
    expect(await getUserByAccessToken(access2)).toBeNull();

    // The second refresh token should also be revoked
    const r2 = await refreshTokens(second, clientId, rawSecret);
    expect(r2.error).toBe('invalid_grant');
  });

  it('new rotation chain after replay is independent', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const rawSecret = created.client!.client_secret as string;

    const { refresh_token: first } = await issueTokens(clientId, user.id, ['trips:read']);
    // Rotate once
    const r1 = await refreshTokens(first, clientId, rawSecret);
    const { refresh_token: second } = r1.tokens!;
    // Rotate again on the second token
    const r2 = await refreshTokens(second, clientId, rawSecret);
    expect(r2.error).toBeUndefined();
    const { refresh_token: third } = r2.tokens!;

    // Replay the first revoked token → revokes chain containing first+second+third
    await agePastGrace(first);
    await refreshTokens(first, clientId, rawSecret);

    // third should now be revoked too (it's in the same chain)
    const r3 = await refreshTokens(third, clientId, rawSecret);
    expect(r3.error).toBe('invalid_grant');
  });
});

// ---------------------------------------------------------------------------
// #1007 — Concurrent rotation is not a replay
// ---------------------------------------------------------------------------

describe('refreshTokens — concurrent rotation grace (#1007)', () => {
  const setup = async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    return {
      user,
      clientId: created.client!.client_id as string,
      rawSecret: created.client!.client_secret as string,
    };
  };

  it('OAUTH-GRACE-001: two clients refreshing the same token both get tokens', async () => {
    const { user, clientId, rawSecret } = await setup();
    const { refresh_token: shared } = await issueTokens(clientId, user.id, ['trips:read']);

    const first = await refreshTokens(shared, clientId, rawSecret);
    const callsBefore = vi.mocked(revokeUserSessionsForClient).mock.calls.length;
    const second = await refreshTokens(shared, clientId, rawSecret);

    expect(first.error).toBeUndefined();
    expect(second.error).toBeUndefined();
    expect(second.tokens!.refresh_token).not.toBe(first.tokens!.refresh_token);
    // The whole point: no chain revocation, no torn-down MCP sessions, no login window.
    expect(vi.mocked(revokeUserSessionsForClient).mock.calls.length).toBe(callsBefore);
    expect(await getUserByAccessToken(first.tokens!.access_token)).not.toBeNull();
    expect(await getUserByAccessToken(second.tokens!.access_token)).not.toBeNull();
  });

  it('OAUTH-GRACE-002: both successors keep working afterwards', async () => {
    const { user, clientId, rawSecret } = await setup();
    const { refresh_token: shared } = await issueTokens(clientId, user.id, ['trips:read']);
    const a = (await refreshTokens(shared, clientId, rawSecret)).tokens!;
    const b = (await refreshTokens(shared, clientId, rawSecret)).tokens!;

    expect((await refreshTokens(a.refresh_token, clientId, rawSecret)).error).toBeUndefined();
    expect((await refreshTokens(b.refresh_token, clientId, rawSecret)).error).toBeUndefined();
  });

  it('OAUTH-GRACE-003: the same token replayed after the window is still theft', async () => {
    const { user, clientId, rawSecret } = await setup();
    const { refresh_token: shared } = await issueTokens(clientId, user.id, ['trips:read']);
    const rotated = (await refreshTokens(shared, clientId, rawSecret)).tokens!;

    await agePastGrace(shared);
    const replay = await refreshTokens(shared, clientId, rawSecret);

    expect(replay.error).toBe('invalid_grant');
    expect((await refreshTokens(rotated.refresh_token, clientId, rawSecret)).error).toBe('invalid_grant');
  });

  it('OAUTH-GRACE-004: a token revoked by logout is not re-opened by the window', async () => {
    const { user, clientId, rawSecret } = await setup();
    const { refresh_token: shared } = await issueTokens(clientId, user.id, ['trips:read']);

    // Explicit revocation leaves no successor, so there is nothing to be
    // concurrent with — the grace must not resurrect it.
    await revokeToken(shared, clientId, user.id);
    const result = await refreshTokens(shared, clientId, rawSecret);

    expect(result.error).toBe('invalid_grant');
  });

  it('OAUTH-GRACE-005: a chain killed by a real replay stays dead inside the window', async () => {
    const { user, clientId, rawSecret } = await setup();
    const { refresh_token: first } = await issueTokens(clientId, user.id, ['trips:read']);
    const second = (await refreshTokens(first, clientId, rawSecret)).tokens!;

    // Real theft: the first token turns up again once the window has passed.
    await agePastGrace(first);
    expect((await refreshTokens(first, clientId, rawSecret)).error).toBe('invalid_grant');

    // The successor was revoked with the chain, so presenting it now must not
    // find a live child and slip through as "concurrent".
    expect((await refreshTokens(second.refresh_token, clientId, rawSecret)).error).toBe('invalid_grant');
  });
});

// ---------------------------------------------------------------------------
// H1 — PKCE code_challenge / code_verifier format validation
// ---------------------------------------------------------------------------

describe('verifyPKCE — format validation (H1)', () => {
  it('returns false for a code_verifier that is too short (< 43 chars)', async () => {
    const { challenge } = makePkce();
    expect(verifyPKCE('short', challenge)).toBe(false);
  });

  it('returns false for a code_verifier that is too long (> 128 chars)', async () => {
    const { challenge } = makePkce();
    const longVerifier = 'a'.repeat(129);
    expect(verifyPKCE(longVerifier, challenge)).toBe(false);
  });

  it('returns false for a code_verifier with invalid characters', async () => {
    const { challenge } = makePkce();
    const badVerifier = 'A'.repeat(42) + ' '; // space is not allowed
    expect(verifyPKCE(badVerifier, challenge)).toBe(false);
  });

  it('returns true for a valid 43-char verifier matching its challenge', async () => {
    const { verifier, challenge } = makePkce();
    expect(verifyPKCE(verifier, challenge)).toBe(true);
  });
});

describe('validateAuthorizeRequest — PKCE format (H1)', () => {
  it('returns invalid_request when code_challenge is shorter than 43 chars', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    const result = await validateAuthorizeRequest(
      {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://example.com/callback',
        scope: 'trips:read',
        code_challenge: 'tooshort',
        code_challenge_method: 'S256',
      },
      user.id,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_request');
  });

  it('returns invalid_request when code_challenge contains invalid characters', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;

    // 43 chars but includes '=' which is not base64url
    const badChallenge = '='.repeat(43);
    const result = await validateAuthorizeRequest(
      {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://example.com/callback',
        scope: 'trips:read',
        code_challenge: badChallenge,
        code_challenge_method: 'S256',
      },
      user.id,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_request');
  });
});

// ---------------------------------------------------------------------------
// H3 — validateAuthorizeRequest: loginRequired response strips client info
// ---------------------------------------------------------------------------

describe('validateAuthorizeRequest — unauthenticated strips client info (H3)', () => {
  it('loginRequired response does not include client.name or allowed_scopes', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client!.client_id as string;
    const { challenge } = makePkce();

    const result = await validateAuthorizeRequest(
      {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://example.com/callback',
        scope: 'trips:read',
        code_challenge: challenge,
        code_challenge_method: 'S256',
      },
      null /* unauthenticated */,
    );

    expect(result.valid).toBe(true);
    expect(result.loginRequired).toBe(true);
    // Must NOT expose client metadata to unauthenticated callers
    expect(result.client).toBeUndefined();
    expect(result.scopes).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Wrapper surface that survived the fold, plus the branches the legacy suite
// never reached (they were free functions nobody could drive in isolation).
// ---------------------------------------------------------------------------

describe('addon gate and MCP endpoint', () => {
  it('mcpEnabled checks the MCP addon flag', async () => {
    isAddonEnabled.mockReturnValue(true);
    expect(await svc.mcpEnabled()).toBe(true);
    expect(isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.MCP);
    isAddonEnabled.mockReturnValue(false);
    expect(await svc.mcpEnabled()).toBe(false);
  });

  it('mcpSafeUrl forwards to the app-config helper', async () => {
    expect(svc.mcpSafeUrl()).toBe(getMcpSafeUrl());
  });
});

describe('pending-code store', () => {
  const codeParams = {
    clientId: 'c',
    userId: 42,
    redirectUri: 'https://example.com/callback',
    scopes: ['trips:read'],
    resource: null,
    codeChallenge: 'x',
    codeChallengeMethod: 'S256' as const,
  };

  it('refuses a new code at capacity and the sweep frees it again', async () => {
    for (let i = 0; i < MAX_PENDING_CODES; i++) await createAuthCode(codeParams);

    expect(await createAuthCode(codeParams)).toBeNull();

    // Everything in the store is past its 2-minute TTL by then.
    await sweepPendingCodes(Date.now() + 3 * 60 * 1000);

    const afterSweep = await createAuthCode(codeParams);
    expect(afterSweep).not.toBeNull();
    await sweepPendingCodes(Date.now() + 3 * 60 * 1000);
  });

  it('a code past its TTL is consumed as invalid', async () => {
    const code = (await createAuthCode(codeParams))!;
    const realNow = Date.now;
    Date.now = () => realNow() + 3 * 60 * 1000;
    try {
      expect(await consumeAuthCode(code)).toBeNull();
    } finally {
      Date.now = realNow;
    }
  });
});

describe('branches the legacy suite could not reach', () => {
  it('rejects an expired access token', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = (created.client as { client_id: string }).client_id;
    const tokens = await issueTokens(clientId, user.id, ['trips:read']);
    await updateRows(t, OauthTokens, {}, { access_token_expires_at: '2000-01-01T00:00:00.000Z' });

    expect(await getUserByAccessToken(tokens.access_token)).toBeNull();
  });

  it('rejects an access token whose canonical expiry passed earlier today (UTC, not local time)', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = (created.client as { client_id: string }).client_id;
    const tokens = await issueTokens(clientId, user.id, ['trips:read']);
    await updateRows(t, OauthTokens, {}, { access_token_expires_at: dbNow(new Date(Date.now() - 60_000)) });

    expect(await getUserByAccessToken(tokens.access_token)).toBeNull();
  });

  it('refreshTokens rejects a refresh token whose canonical expiry passed', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const client = created.client as { client_id: string; client_secret: string };
    const tokens = await issueTokens(client.client_id, user.id, ['trips:read']);
    await updateRows(t, OauthTokens, {}, { refresh_token_expires_at: dbNow(new Date(Date.now() - 60_000)) });

    expect(await refreshTokens(tokens.refresh_token, client.client_id, client.client_secret)).toEqual({
      error: 'invalid_grant',
      status: 400,
    });
  });

  it('refreshTokens rejects an unknown client before touching the token', async () => {
    expect(await refreshTokens('trekrf_whatever', 'no-such-client', 'secret')).toEqual({
      error: 'invalid_client',
      status: 401,
    });
  });

  it('refreshTokens skips the secret check for a public client', async () => {
    const { user } = createUser(testDb);
    const created = await createOAuthClient(user.id, 'Public', ['https://example.com/callback'], ['trips:read'], null, {
      isPublic: true,
    });
    const clientId = (created.client as { client_id: string }).client_id;
    const tokens = await issueTokens(clientId, user.id, ['trips:read']);

    const result = await refreshTokens(tokens.refresh_token, clientId, undefined);

    expect(result.error).toBeUndefined();
    expect(result.tokens?.access_token).toMatch(/^trekoa_/);
  });

  it('authenticateClient identifies a public client by id alone and rejects a missing secret otherwise', async () => {
    const { user } = createUser(testDb);
    const pub = await createOAuthClient(user.id, 'Public', ['https://example.com/callback'], ['trips:read'], null, {
      isPublic: true,
    });
    const pubId = (pub.client as { client_id: string }).client_id;
    const conf = await makeClient(user.id, { name: 'Confidential' });
    const confId = (conf.client as { client_id: string }).client_id;

    expect((await authenticateClient(pubId, undefined))?.client_id).toBe(pubId);
    expect(await authenticateClient(confId, undefined)).toBeNull();
  });

  it('validateAuthorizeRequest rejects a resource that is not the MCP endpoint', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = (created.client as { client_id: string }).client_id;
    const { challenge } = makePkce();

    const result = await validateAuthorizeRequest(
      {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://example.com/callback',
        scope: 'trips:read',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: 'https://evil.example.org/mcp',
      },
      user.id,
    );

    expect(result).toEqual({
      valid: false,
      error: 'invalid_target',
      error_description: 'Requested resource must be the TREK MCP endpoint',
    });
  });

  it('validateAuthorizeRequest accepts the MCP endpoint passed explicitly, trailing slash and all', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = (created.client as { client_id: string }).client_id;
    const { challenge } = makePkce();
    const mcpResource = getMcpSafeUrl().replace(/\/+$/, '') + '/mcp';

    const result = await validateAuthorizeRequest(
      {
        response_type: 'code',
        client_id: clientId,
        redirect_uri: 'https://example.com/callback',
        scope: 'trips:read',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: mcpResource + '/',
      },
      user.id,
    );

    expect(result.valid).toBe(true);
    expect(result.resource).toBe(mcpResource);
  });
});

describe('module-scoped OAuth state', () => {
  it('shares the pending-code map across service instances', async () => {
    // The load-bearing invariant: the consent controller writes the code through
    // the DI singleton, the SDK exchange path reads it back. The map is module-
    // scoped, so even a second hand-built instance must see it — two maps would
    // kill the authorization-code flow silently.
    const code = (await createAuthCode({
      clientId: 'c',
      userId: 42,
      redirectUri: 'https://example.com/callback',
      scopes: ['trips:read'],
      resource: null,
      codeChallenge: 'x',
      codeChallengeMethod: 'S256',
    }))!;

    const secondInstance = new OauthService(
      clientsRepo,
      tokensRepo,
      consentsRepo,
      addonsStub,
      new AuditService(auditLogRepo, usersRepo),
      new UnitOfWork(t.em),
    );
    expect((await secondInstance.consumeAuthCode(code))?.userId).toBe(42);
  });
});

describe('OauthModule', () => {
  it('wires the public + api controllers and the providers', async () => {
    const { OauthModule } = await import('../../../src/nest/oauth/oauth.module');
    const { OauthPublicController } = await import('../../../src/nest/oauth/oauth-public.controller');
    const { OauthApiController } = await import('../../../src/nest/oauth/oauth-api.controller');
    const { OauthService: Svc } = await import('../../../src/nest/oauth/oauth.service');

    const { TrekClientsStore, TrekOAuthProvider } = await import('../../../src/nest/oauth/oauth-sdk.provider');
    const { OauthTokenRetentionJob } = await import('../../../src/nest/oauth/oauth-token-retention.job');

    const controllers = Reflect.getMetadata('controllers', OauthModule);
    const providers = Reflect.getMetadata('providers', OauthModule);
    expect(controllers).toEqual([OauthPublicController, OauthApiController]);
    // RateLimitService is deliberately absent: it comes from the global
    // RateLimitModule so all consumers share one set of counters.
    expect(providers).toEqual([
      Svc,
      TrekClientsStore,
      TrekOAuthProvider,
      OauthTokenRetentionJob,
      { provide: PendingCodeStore, useValue: processPendingCodes },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Admin view of live sessions — moved here from admin.service.test.ts with the
// method. Named apart from the user-facing listOAuthSessions because the two
// are different queries: this one spans users and carries the owner username.
// ---------------------------------------------------------------------------

describe('admin OAuth sessions', () => {
  it('ADMIN-SVC-074 — listAllOAuthSessions survives a row with malformed scopes JSON', async () => {
    const { user } = createUser(testDb);
    await insertRow(t, OauthClients, { client_id: 'c1', client_secret_hash: 'hash', name: 'Client' });
    await insertRow(t, OauthTokens, {
      client: 'c1',
      user: user.id,
      access_token_hash: 'ahash',
      refresh_token_hash: 'rhash',
      scopes: 'not-json{',
      access_token_expires_at: dbNow(new Date(Date.now() + 3600_000)),
      refresh_token_expires_at: dbNow(new Date(Date.now() + 86_400_000)),
    });

    const sessions = (await svc.listAllOAuthSessions()) as any[];
    expect(sessions).toHaveLength(1);
    expect(sessions[0].scopes).toBeNull();
  });

  it('a row with malformed scopes no longer fails the user list, the token check or the refresh: it grants nothing', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const client = created.client as { client_id: string; client_secret: string };
    const tokens = await issueTokens(client.client_id, user.id, ['trips:read']);
    await updateRows(t, OauthTokens, { user: user.id }, { scopes: 'not-json{' });

    const [session] = await listOAuthSessions(user.id);
    expect(session.scopes).toEqual([]);
    expect((await getUserByAccessToken(tokens.access_token))?.scopes).toEqual([]);
  });

  it('a malformed consent row counts as consent to nothing, and a new grant replaces it', async () => {
    const { user } = createUser(testDb);
    const created = await makeClient(user.id);
    const clientId = created.client?.client_id as string;
    await saveConsent(clientId, user.id, ['trips:read']);
    await updateRows(t, OauthConsents, { user: user.id }, { scopes: '{broken' });

    expect(await getConsent(clientId, user.id)).toEqual([]);
    await saveConsent(clientId, user.id, ['trips:write']);
    expect(await getConsent(clientId, user.id)).toEqual(['trips:write']);
  });
});
