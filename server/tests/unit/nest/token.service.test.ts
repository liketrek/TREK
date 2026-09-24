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

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/nest/auth/ephemeral-tokens', () => ({ createEphemeralToken: vi.fn() }));
vi.mock('../../../src/mcp/sessionManager', () => ({ revokeUserSessions: vi.fn() }));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { TokenService } from '../../../src/nest/tokens/token.service';
import { TokensModule } from '../../../src/nest/tokens/tokens.module';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { createEphemeralToken } from '../../../src/nest/auth/ephemeral-tokens';
import { revokeUserSessions } from '../../../src/mcp/sessionManager';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';

const svc = new TokenService(new DatabaseService(testDb), new EphemeralTokenService());

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
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
  it('AUTH-DB-041: createMcpToken returns 400 when name is missing', () => {
    const { user } = createUser(testDb);
    const result = svc.createMcpToken(user.id, undefined);
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-042: createMcpToken returns 400 when name exceeds 100 chars', () => {
    const { user } = createUser(testDb);
    const result = svc.createMcpToken(user.id, 'a'.repeat(101));
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-043: createMcpToken creates token and returns raw_token', () => {
    const { user } = createUser(testDb);
    const result = svc.createMcpToken(user.id, 'My Token');
    expect(result.token).toBeDefined();
    expect((result.token as any).raw_token).toMatch(/^trek_/);
  });

  it('AUTH-DB-044: createMcpToken returns 400 when user has 10 tokens already', () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < 10; i++) {
      testDb.prepare(
        'INSERT INTO mcp_tokens (user_id, name, token_hash, token_prefix) VALUES (?, ?, ?, ?)'
      ).run(user.id, `Token ${i}`, `hash${i}`, `trek_prefix${i}`);
    }
    const result = svc.createMcpToken(user.id, 'One More');
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-045: deleteMcpToken returns 404 for non-existent token', () => {
    const { user } = createUser(testDb);
    const result = svc.deleteMcpToken(user.id, '99999');
    expect(result.status).toBe(404);
  });

  it('AUTH-DB-046: deleteMcpToken deletes the token and returns success', () => {
    const { user } = createUser(testDb);
    const created = svc.createMcpToken(user.id, 'Deletable Token');
    const tokenId = String((created.token as any).id);

    const result = svc.deleteMcpToken(user.id, tokenId);
    expect(result).toEqual({ success: true });

    const row = testDb.prepare('SELECT id FROM mcp_tokens WHERE id = ?').get(tokenId);
    expect(row).toBeUndefined();
  });

  it('AUTH-DB-092: deleteMcpToken succeeds even when the session sweep throws (best-effort)', () => {
    const { user } = createUser(testDb);
    const created = svc.createMcpToken(user.id, 'sweep-down');
    const tokenId = String((created.token as { id: number }).id);
    vi.mocked(revokeUserSessions).mockImplementationOnce(() => { throw new Error('sweep down'); });

    expect(svc.deleteMcpToken(user.id, tokenId)).toEqual({ success: true });
    expect(testDb.prepare('SELECT id FROM mcp_tokens WHERE id = ?').get(tokenId)).toBeUndefined();
  });

  it('TOKEN-001: listMcpTokens is scoped to the caller and never exposes the hash', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    svc.createMcpToken(user.id, 'mine');
    svc.createMcpToken(other.id, 'theirs');

    const mine = svc.listMcpTokens(user.id) as Record<string, unknown>[];
    expect(mine).toHaveLength(1);
    expect(mine[0].name).toBe('mine');
    expect(mine[0]).not.toHaveProperty('token_hash');
  });

  it('TOKEN-002: deleteMcpToken refuses a token that belongs to someone else', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const created = svc.createMcpToken(other.id, 'not-yours');
    const tokenId = String((created.token as { id: number }).id);

    expect(svc.deleteMcpToken(user.id, tokenId)).toEqual({ error: 'Token not found', status: 404 });
    expect(testDb.prepare('SELECT id FROM mcp_tokens WHERE id = ?').get(tokenId)).toBeDefined();
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
  it('TOKEN-010: an API key does not verify as an MCP token', () => {
    const { user } = createUser(testDb);
    const created = svc.createApiToken(user.id, 'dawarich');
    const raw = (created.token as { raw_token: string }).raw_token;

    expect(svc.verifyApiToken(raw)?.id).toBe(user.id);
    expect(svc.verifyMcpToken(raw)).toBeNull();
  });

  it('TOKEN-011: an MCP token does not verify as an API key', () => {
    const { user } = createUser(testDb);
    const created = svc.createMcpToken(user.id, 'claude');
    const raw = (created.token as { raw_token: string }).raw_token;

    expect(svc.verifyMcpToken(raw)?.id).toBe(user.id);
    expect(svc.verifyApiToken(raw)).toBeNull();
  });

  it('TOKEN-012: each list shows only its own kind', () => {
    const { user } = createUser(testDb);
    svc.createMcpToken(user.id, 'claude');
    svc.createApiToken(user.id, 'dawarich');

    const mcp = svc.listMcpTokens(user.id) as Record<string, unknown>[];
    const api = svc.listApiTokens(user.id) as Record<string, unknown>[];
    expect(mcp.map((t) => t.name)).toEqual(['claude']);
    expect(api.map((t) => t.name)).toEqual(['dawarich']);
  });

  it('TOKEN-013: deleting across kinds 404s, identically to an unknown id', () => {
    const { user } = createUser(testDb);
    const mcpId = String((svc.createMcpToken(user.id, 'claude').token as { id: number }).id);
    const apiId = String((svc.createApiToken(user.id, 'dawarich').token as { id: number }).id);

    expect(svc.deleteApiToken(user.id, mcpId)).toEqual({ error: 'Token not found', status: 404 });
    expect(svc.deleteMcpToken(user.id, apiId)).toEqual({ error: 'Token not found', status: 404 });
    // Neither row was touched: a wrong-kind delete must not be a way to revoke
    // someone's assistant access from the API-key screen.
    expect(testDb.prepare('SELECT id FROM mcp_tokens WHERE id = ?').get(mcpId)).toBeDefined();
    expect(testDb.prepare('SELECT id FROM mcp_tokens WHERE id = ?').get(apiId)).toBeDefined();
  });

  it('TOKEN-014: the ten-token ceiling counts each kind on its own', () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < 10; i += 1) svc.createMcpToken(user.id, `mcp-${i}`);

    expect(svc.createMcpToken(user.id, 'one-too-many').status).toBe(400);
    // A full MCP shelf must not lock the user out of minting an API key.
    expect(svc.createApiToken(user.id, 'dawarich').status).toBeUndefined();
  });

  it('TOKEN-015: an API key is stored hashed, with only a prefix in the clear', () => {
    const { user } = createUser(testDb);
    const created = svc.createApiToken(user.id, 'dawarich');
    const raw = (created.token as { raw_token: string }).raw_token;

    const row = testDb
      .prepare('SELECT token_hash, token_prefix, kind FROM mcp_tokens WHERE user_id = ?')
      .get(user.id) as { token_hash: string; token_prefix: string; kind: string };
    expect(row.kind).toBe('api');
    expect(row.token_hash).not.toBe(raw);
    expect(raw.startsWith(row.token_prefix)).toBe(true);
  });

  it('TOKEN-016: verifying an API key records last_used_at, so a stale key is visible', () => {
    const { user } = createUser(testDb);
    const raw = (svc.createApiToken(user.id, 'dawarich').token as { raw_token: string }).raw_token;

    const before = svc.listApiTokens(user.id) as Record<string, unknown>[];
    expect(before[0].last_used_at).toBeNull();

    svc.verifyApiToken(raw);
    const after = svc.listApiTokens(user.id) as Record<string, unknown>[];
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
  it('ADMIN-SVC-068 — listAllMcpTokens returns empty array initially', () => {
    const result = svc.listAllMcpTokens() as any[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('ADMIN-SVC-069 — adminDeleteMcpToken returns 404 for non-existent token', () => {
    const result = svc.adminDeleteMcpToken('99999') as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('TOKEN-003: listAllMcpTokens spans users and carries the owner username', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    svc.createMcpToken(user.id, 'a');
    svc.createMcpToken(other.id, 'b');

    const all = svc.listAllMcpTokens() as Record<string, unknown>[];
    expect(all).toHaveLength(2);
    expect(all.every(t => typeof t.username === 'string')).toBe(true);
    expect(all.some(t => t.token_hash !== undefined)).toBe(false);
  });

  it('TOKEN-004: adminDeleteMcpToken removes any user token and revokes that user', () => {
    const { user } = createUser(testDb);
    const created = svc.createMcpToken(user.id, 'admin-killed');
    const tokenId = String((created.token as { id: number }).id);

    expect(svc.adminDeleteMcpToken(tokenId)).toEqual({});
    expect(testDb.prepare('SELECT id FROM mcp_tokens WHERE id = ?').get(tokenId)).toBeUndefined();
    expect(revokeUserSessions).toHaveBeenCalledWith(user.id);
  });

  it('TOKEN-005: adminDeleteMcpToken 404s on an unknown id without revoking anyone', () => {
    expect(svc.adminDeleteMcpToken('99999')).toEqual({ error: 'Token not found', status: 404 });
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

  it('AUTH-DB-087: createWsToken returns the ephemeral token when the store answers', () => {
    const { user } = createUser(testDb);
    vi.mocked(createEphemeralToken).mockReturnValueOnce('ws-tok');
    expect(svc.createWsToken(user.id)).toEqual({ token: 'ws-tok' });
  });

  it('TOKEN-006: createWsToken binds the caller password_version, so a pre-reset token is rejected on connect', () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET password_version = 7 WHERE id = ?').run(user.id);
    vi.mocked(createEphemeralToken).mockReturnValueOnce('ws-tok');

    svc.createWsToken(user.id);
    expect(createEphemeralToken).toHaveBeenCalledWith(user.id, 'ws', { pv: 7 });
  });

  it('TOKEN-007: createWsToken falls back to pv 0 for a user row without one', () => {
    vi.mocked(createEphemeralToken).mockReturnValueOnce('ws-tok');
    svc.createWsToken(99999);
    expect(createEphemeralToken).toHaveBeenCalledWith(99999, 'ws', { pv: 0 });
  });

  it('TOKEN-008: createWsToken reports 503 when the store refuses', () => {
    const { user } = createUser(testDb);
    vi.mocked(createEphemeralToken).mockReturnValueOnce(null as unknown as string);
    expect(svc.createWsToken(user.id)).toEqual({ error: 'Service unavailable', status: 503 });
  });
});

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

describe('verifyMcpToken', () => {
  it('AUTH-BR-002: verifyMcpToken resolves a freshly created token to its user', () => {
    const { user } = createUser(testDb);
    const created = svc.createMcpToken(user.id, 'bridge-case');
    const raw = (created.token as { raw_token: string }).raw_token;

    const resolved = svc.verifyMcpToken(raw);
    expect(resolved?.id).toBe(user.id);
    expect(svc.verifyMcpToken('trek_no_such_token')).toBeNull();
  });

  it('TOKEN-009: a successful verify stamps last_used_at, a failed one changes nothing', () => {
    const { user } = createUser(testDb);
    const created = svc.createMcpToken(user.id, 'stamped');
    const raw = (created.token as { raw_token: string }).raw_token;
    const id = (created.token as { id: number }).id;
    expect((testDb.prepare('SELECT last_used_at FROM mcp_tokens WHERE id = ?').get(id) as { last_used_at: string | null }).last_used_at).toBeNull();

    svc.verifyMcpToken(raw);
    expect((testDb.prepare('SELECT last_used_at FROM mcp_tokens WHERE id = ?').get(id) as { last_used_at: string | null }).last_used_at).not.toBeNull();

    svc.verifyMcpToken('trek_wrong');
    expect(testDb.prepare('SELECT COUNT(*) c FROM mcp_tokens').get()).toEqual({ c: 1 });
  });

  it('TOKEN-010: verifyMcpToken returns identity columns only, never the password hash', () => {
    const { user } = createUser(testDb);
    const created = svc.createMcpToken(user.id, 'lean');
    const raw = (created.token as { raw_token: string }).raw_token;

    const resolved = svc.verifyMcpToken(raw) as unknown as Record<string, unknown>;
    expect(Object.keys(resolved).sort()).toEqual(['email', 'id', 'role', 'username']);
  });
});

describe('TokensModule', () => {
  it('TOKEN-011: registers TokenService, without which every consumer fails to resolve', () => {
    expectRegisteredProvider(TokensModule, TokenService);
  });
});
