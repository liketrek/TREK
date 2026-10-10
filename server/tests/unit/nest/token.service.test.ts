/**
 * token.service.test.ts
 *
 * DB-centric unit tests for TokenService against a real in-memory SQLite
 * database. The cases moved here with the methods, out of auth.service.test.ts;
 * the AUTH-DB-* / AUTH-BR-* case IDs are preserved so the history stays
 * greppable. Constructed directly (no TestingModule, repo convention).
 */

// ---------------------------------------------------------------------------
// vi.hoisted: build the real in-memory DB and the module mock before any import
// ---------------------------------------------------------------------------

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
    return mock;
});


vi.mock('../../../src/nest/auth-core/ephemeral-tokens', () => ({ createEphemeralToken: vi.fn() }));
vi.mock('../../../src/mcp/sessionManager', () => ({ revokeUserSessions: vi.fn() }));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { asLegacyResult } from '../../helpers/domain-error';
import { db as testDb } from '../../../src/db/database';
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { TokenService } from '../../../src/nest/tokens/token.service';
import { TokensModule } from '../../../src/nest/tokens/tokens.module';
import { createEphemeralToken } from '../../../src/nest/auth-core/ephemeral-tokens';
import { revokeUserSessions } from '../../../src/mcp/sessionManager';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { EphemeralTokenService } from '../../../src/nest/auth-core/ephemeral-token.service';
import { createTestMcpTokensRepo, createTestUsersRepo } from '../../helpers/test-uow';
import { sharedTestOrm } from '../../helpers/test-uow';
import { countRows, findRow, insertRow, updateRows } from '../../helpers/factories/rows';
import { McpTokens } from '../../../src/db/entities/McpTokens.entity';
import { Users } from '../../../src/db/entities/Users.entity';
/** The token row, or null once it is gone. */
async function tokenRow(id: number | string) {
  return findRow(await sharedTestOrm(testDb), McpTokens, { id: Number(id) });
}

// Schema first, then the ORM-backed repositories `TokenService` now takes
// (Plan 3b Task 2) — `sharedTestOrm` (behind `createTestMcpTokensRepo`/
// `createTestUsersRepo`) shares this suite's own better-sqlite3 handle, so
// the tables must already exist before it initialises.
let svc: TokenService;

beforeAll(async () => {
  svc = new TokenService(await createTestMcpTokensRepo(testDb), await createTestUsersRepo(testDb), new EphemeralTokenService());
});

beforeEach(() => {
  resetTestDb(testDb);
  vi.clearAllMocks();
});

afterAll(() => {
  testDb.close();
});

// ---------------------------------------------------------------------------
// MCP tokens — the user-facing half
// ---------------------------------------------------------------------------

describe('MCP token service', () => {
  it('AUTH-DB-041: createMcpToken returns 400 when name is missing', async () => {
    const { user } = createUser(testDb);
    const result = await asLegacyResult(svc.createMcpToken(user.id, undefined));
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-042: createMcpToken returns 400 when name exceeds 100 chars', async () => {
    const { user } = createUser(testDb);
    const result = await asLegacyResult(svc.createMcpToken(user.id, 'a'.repeat(101)));
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-043: createMcpToken creates token and returns raw_token', async () => {
    const { user } = createUser(testDb);
    const result = await asLegacyResult(svc.createMcpToken(user.id, 'My Token'));
    expect(result.token).toBeDefined();
    expect((result.token as any).raw_token).toMatch(/^trek_/);
  });

  it('AUTH-DB-044: createMcpToken returns 400 when user has 10 tokens already', async () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < 10; i++) {
      await insertRow(await sharedTestOrm(testDb), McpTokens, { user: user.id, name: `Token ${i}`, token_hash: `hash${i}`, token_prefix: `trek_prefix${i}` });
    }
    const result = await asLegacyResult(svc.createMcpToken(user.id, 'One More'));
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-045: deleteMcpToken returns 404 for non-existent token', async () => {
    const { user } = createUser(testDb);
    const result = await asLegacyResult(svc.deleteMcpToken(user.id, '99999'));
    expect(result.status).toBe(404);
  });

  it('AUTH-DB-046: deleteMcpToken deletes the token and returns success', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createMcpToken(user.id, 'Deletable Token'));
    const tokenId = String((created.token as any).id);

    const result = await asLegacyResult(svc.deleteMcpToken(user.id, tokenId));
    expect(result).toEqual({ success: true });

    const row = await tokenRow(tokenId);
    expect(row).toBeNull();
  });

  it('AUTH-DB-092: deleteMcpToken succeeds even when the session sweep throws (best-effort)', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createMcpToken(user.id, 'sweep-down'));
    const tokenId = String((created.token as { id: number }).id);
    vi.mocked(revokeUserSessions).mockImplementationOnce(() => { throw new Error('sweep down'); });

    expect(await asLegacyResult(svc.deleteMcpToken(user.id, tokenId))).toEqual({ success: true });
    expect(await tokenRow(tokenId)).toBeNull();
  });

  it('TOKEN-001: listMcpTokens is scoped to the caller and never exposes the hash', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await asLegacyResult(svc.createMcpToken(user.id, 'mine'));
    await asLegacyResult(svc.createMcpToken(other.id, 'theirs'));

    const mine = await svc.listMcpTokens(user.id) as Record<string, unknown>[];
    expect(mine).toHaveLength(1);
    expect(mine[0].name).toBe('mine');
    expect(mine[0]).not.toHaveProperty('token_hash');
  });

  it('TOKEN-002: deleteMcpToken refuses a token that belongs to someone else', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const created = await asLegacyResult(svc.createMcpToken(other.id, 'not-yours'));
    const tokenId = String((created.token as { id: number }).id);

    expect(await asLegacyResult(svc.deleteMcpToken(user.id, tokenId))).toEqual({ error: 'Token not found', status: 404 });
    expect(await tokenRow(tokenId)).not.toBeNull();
  });

  it('TOKEN-017: deleteMcpToken 404s (not 500) on a non-numeric id — Plan 3b Task 2 review, F1', async () => {
    const { user } = createUser(testDb);
    expect(await asLegacyResult(svc.deleteMcpToken(user.id, 'abc'))).toEqual({ error: 'Token not found', status: 404 });
  });

  it('TOKEN-018: deleteMcpToken 404s on a hex-shaped id — Number("0x10") is 16, a safe integer a bare Number() conversion would accept, but SQLite affinity never would (Plan 3b Task 2 review, F1)', async () => {
    const { user } = createUser(testDb);
    expect(await asLegacyResult(svc.deleteMcpToken(user.id, '0x10'))).toEqual({ error: 'Token not found', status: 404 });
  });
});

// ---------------------------------------------------------------------------
// API keys — the same table, a different door
//
// An MCP token drives every assistant tool; an API key reads trips over HTTP.
// The kind is in the WHERE clause of every lookup, so these tests are the ones
// that would catch a credential quietly opening the wrong surface.
// ---------------------------------------------------------------------------

describe('API key service', () => {
  it('TOKEN-010: an API key does not verify as an MCP token', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createApiToken(user.id, 'dawarich'));
    const raw = (created.token as { raw_token: string }).raw_token;

    expect((await svc.verifyApiToken(raw))?.id).toBe(user.id);
    expect(await svc.verifyMcpToken(raw)).toBeNull();
  });

  it('TOKEN-011: an MCP token does not verify as an API key', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createMcpToken(user.id, 'claude'));
    const raw = (created.token as { raw_token: string }).raw_token;

    expect((await svc.verifyMcpToken(raw))?.id).toBe(user.id);
    expect(await svc.verifyApiToken(raw)).toBeNull();
  });

  it('TOKEN-012: each list shows only its own kind', async () => {
    const { user } = createUser(testDb);
    await asLegacyResult(svc.createMcpToken(user.id, 'claude'));
    await asLegacyResult(svc.createApiToken(user.id, 'dawarich'));

    const mcp = await svc.listMcpTokens(user.id) as Record<string, unknown>[];
    const api = await svc.listApiTokens(user.id) as Record<string, unknown>[];
    expect(mcp.map((t) => t.name)).toEqual(['claude']);
    expect(api.map((t) => t.name)).toEqual(['dawarich']);
  });

  it('TOKEN-013: deleting across kinds 404s, identically to an unknown id', async () => {
    const { user } = createUser(testDb);
    const mcpId = String((await asLegacyResult(svc.createMcpToken(user.id, 'claude'))).token!.id as number);
    const apiId = String((await asLegacyResult(svc.createApiToken(user.id, 'dawarich'))).token!.id as number);

    expect(await asLegacyResult(svc.deleteApiToken(user.id, mcpId))).toEqual({ error: 'Token not found', status: 404 });
    expect(await asLegacyResult(svc.deleteMcpToken(user.id, apiId))).toEqual({ error: 'Token not found', status: 404 });
    // Neither row was touched: a wrong-kind delete must not be a way to revoke
    // someone's assistant access from the API-key screen.
    expect(await tokenRow(mcpId)).not.toBeNull();
    expect(await tokenRow(apiId)).not.toBeNull();
  });

  it('TOKEN-014: the ten-token ceiling counts each kind on its own', async () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < 10; i += 1) await asLegacyResult(svc.createMcpToken(user.id, `mcp-${i}`));

    expect((await asLegacyResult(svc.createMcpToken(user.id, 'one-too-many'))).status).toBe(400);
    // A full MCP shelf must not lock the user out of minting an API key.
    expect((await asLegacyResult(svc.createApiToken(user.id, 'dawarich'))).status).toBeUndefined();
  });

  it('TOKEN-015: an API key is stored hashed, with only a prefix in the clear', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createApiToken(user.id, 'dawarich'));
    const raw = (created.token as { raw_token: string }).raw_token;

    const row = (await findRow(await sharedTestOrm(testDb), McpTokens, { user: user.id }))!;
    expect(row.kind).toBe('api');
    expect(row.token_hash).not.toBe(raw);
    expect(raw.startsWith(row.token_prefix)).toBe(true);
  });

  it('TOKEN-016: verifying an API key records last_used_at, so a stale key is visible', async () => {
    const { user } = createUser(testDb);
    const raw = (await asLegacyResult(svc.createApiToken(user.id, 'dawarich'))).token!.raw_token as string;

    const before = await svc.listApiTokens(user.id) as Record<string, unknown>[];
    expect(before[0].last_used_at).toBeNull();

    await svc.verifyApiToken(raw);
    const after = await svc.listApiTokens(user.id) as Record<string, unknown>[];
    expect(after[0].last_used_at).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// MCP tokens — the admin half
//
// Same table, no user scope. These came from AdminService, which only owned
// them because the admin route lived there.
// ---------------------------------------------------------------------------

describe('MCP token service (admin view)', () => {
  it('ADMIN-SVC-068 — listAllMcpTokens returns empty array initially', async () => {
    const result = await svc.listAllMcpTokens() as any[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('ADMIN-SVC-069 — adminDeleteMcpToken returns 404 for non-existent token', async () => {
    const result = await asLegacyResult(svc.adminDeleteMcpToken('99999')) as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('TOKEN-003: listAllMcpTokens spans users and carries the owner username', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await asLegacyResult(svc.createMcpToken(user.id, 'a'));
    await asLegacyResult(svc.createMcpToken(other.id, 'b'));

    // `listAllMcpTokens` returns the repository's own typed
    // `McpTokenWithUsernameRow[]` now (Plan 3b Task 2) — no cast needed
    // (Task 2 review, F7: the earlier `as unknown as Record<string,
    // unknown>[]` was a double cast kept only to compile against the old
    // `unknown` return type).
    const all = await svc.listAllMcpTokens();
    expect(all).toHaveLength(2);
    expect(all.every(t => typeof t.username === 'string')).toBe(true);
    expect(all.every(t => !('token_hash' in t))).toBe(true);
  });

  it('TOKEN-004: adminDeleteMcpToken removes any user token and revokes that user', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createMcpToken(user.id, 'admin-killed'));
    const tokenId = String((created.token as { id: number }).id);

    expect(await asLegacyResult(svc.adminDeleteMcpToken(tokenId))).toEqual({});
    expect(await tokenRow(tokenId)).toBeNull();
    expect(revokeUserSessions).toHaveBeenCalledWith(user.id);
  });

  it('TOKEN-005: adminDeleteMcpToken 404s on an unknown id without revoking anyone', async () => {
    expect(await asLegacyResult(svc.adminDeleteMcpToken('99999'))).toEqual({ error: 'Token not found', status: 404 });
    expect(revokeUserSessions).not.toHaveBeenCalled();
  });

  it('TOKEN-019: adminDeleteMcpToken 404s (not 500) on a non-numeric id, without revoking anyone — Plan 3b Task 2 review, F1', async () => {
    expect(await asLegacyResult(svc.adminDeleteMcpToken('abc'))).toEqual({ error: 'Token not found', status: 404 });
    expect(revokeUserSessions).not.toHaveBeenCalled();
  });

  it('TOKEN-020: adminDeleteMcpToken 404s on a hex-shaped id (Plan 3b Task 2 review, F1)', async () => {
    expect(await asLegacyResult(svc.adminDeleteMcpToken('0x10'))).toEqual({ error: 'Token not found', status: 404 });
    expect(revokeUserSessions).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Ephemeral tokens
// ---------------------------------------------------------------------------

describe('ephemeral tokens', () => {
  it('AUTH-DB-086: createResourceToken rejects a non-download purpose and 503s when the store is down', () => {
    const { user } = createUser(testDb);
    expect(svc.createResourceToken(user.id, 'exfiltrate')).toEqual({ error: 'Invalid purpose', status: 400 });
    expect(svc.createResourceToken(user.id, 'download')).toEqual({ error: 'Service unavailable', status: 503 });
    vi.mocked(createEphemeralToken).mockReturnValueOnce('tok-1');
    expect(svc.createResourceToken(user.id, 'download')).toEqual({ token: 'tok-1' });
  });

  it('AUTH-DB-087: createWsToken returns the ephemeral token when the store answers', async () => {
    const { user } = createUser(testDb);
    vi.mocked(createEphemeralToken).mockReturnValueOnce('ws-tok');
    expect(await asLegacyResult(svc.createWsToken(user.id))).toEqual({ token: 'ws-tok' });
  });

  it('TOKEN-006: createWsToken binds the caller password_version, so a pre-reset token is rejected on connect', async () => {
    const { user } = createUser(testDb);
    await updateRows(await sharedTestOrm(testDb), Users, { id: user.id }, { password_version: 7 });
    vi.mocked(createEphemeralToken).mockReturnValueOnce('ws-tok');

    await asLegacyResult(svc.createWsToken(user.id));
    expect(createEphemeralToken).toHaveBeenCalledWith(user.id, 'ws', { pv: 7 });
  });

  it('TOKEN-007: createWsToken falls back to pv 0 for a user row without one', async () => {
    vi.mocked(createEphemeralToken).mockReturnValueOnce('ws-tok');
    await asLegacyResult(svc.createWsToken(99999));
    expect(createEphemeralToken).toHaveBeenCalledWith(99999, 'ws', { pv: 0 });
  });

  it('TOKEN-008: createWsToken reports 503 when the store refuses', async () => {
    const { user } = createUser(testDb);
    vi.mocked(createEphemeralToken).mockReturnValueOnce(null as unknown as string);
    expect(await asLegacyResult(svc.createWsToken(user.id))).toEqual({ error: 'Service unavailable', status: 503 });
  });
});

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

describe('verifyMcpToken', () => {
  it('AUTH-BR-002: verifyMcpToken resolves a freshly created token to its user', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createMcpToken(user.id, 'bridge-case'));
    const raw = (created.token as { raw_token: string }).raw_token;

    const resolved = await svc.verifyMcpToken(raw);
    expect(resolved?.id).toBe(user.id);
    expect(await svc.verifyMcpToken('trek_no_such_token')).toBeNull();
  });

  it('TOKEN-009: a successful verify stamps last_used_at, a failed one changes nothing', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createMcpToken(user.id, 'stamped'));
    const raw = (created.token as { raw_token: string }).raw_token;
    const id = (created.token as { id: number }).id;
    expect((await tokenRow(id))!.last_used_at).toBeNull();

    await svc.verifyMcpToken(raw);
    expect((await tokenRow(id))!.last_used_at).not.toBeNull();

    await svc.verifyMcpToken('trek_wrong');
    expect(await countRows(await sharedTestOrm(testDb), McpTokens)).toBe(1);
  });

  it('TOKEN-010: verifyMcpToken returns identity columns only, never the password hash', async () => {
    const { user } = createUser(testDb);
    const created = await asLegacyResult(svc.createMcpToken(user.id, 'lean'));
    const raw = (created.token as { raw_token: string }).raw_token;

    const resolved = await svc.verifyMcpToken(raw) as unknown as Record<string, unknown>;
    expect(Object.keys(resolved).sort()).toEqual(['email', 'id', 'role', 'username']);
  });
});

describe('TokensModule', () => {
  it('TOKEN-011: registers TokenService, without which every consumer fails to resolve', () => {
    expectRegisteredProvider(TokensModule, TokenService);
  });
});
