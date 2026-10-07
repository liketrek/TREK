import { OauthTokens } from '../../../../src/db/entities/OauthTokens.entity';
import type { OauthTokensRepository } from '../../../../src/db/repositories/OauthTokens.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tokens: OauthTokensRepository;
let uow: UnitOfWork;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tokens = t.repo(OauthTokens);
  uow = new UnitOfWork(t.em);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  testDb.exec('DELETE FROM oauth_tokens');
  testDb.exec('DELETE FROM oauth_consents');
  testDb.exec('DELETE FROM oauth_clients');
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function seedClient(userId: number, clientId: string, name = 'Client'): void {
  testDb
    .prepare(
      `INSERT INTO oauth_clients (id, user_id, name, client_id, client_secret_hash, redirect_uris, allowed_scopes) VALUES (?, ?, ?, ?, ?, '[]', '[]')`,
    )
    .run(`row-${clientId}`, userId, name, clientId, 'hash');
}

function seedToken(
  overrides: Partial<{
    id: number;
    clientId: string;
    userId: number;
    accessHash: string;
    refreshHash: string;
    scopes: string;
    audience: string | null;
    accessExpiresAt: string;
    refreshExpiresAt: string;
    revokedAt: string | null;
    parentId: number | null;
  }> = {},
): number {
  const info = testDb
    .prepare(
      `INSERT INTO oauth_tokens (client_id, user_id, access_token_hash, refresh_token_hash, scopes, audience, access_token_expires_at, refresh_token_expires_at, revoked_at, parent_token_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      overrides.clientId,
      overrides.userId,
      overrides.accessHash ?? `acc-${Math.random().toString(36).slice(2)}`,
      overrides.refreshHash ?? `ref-${Math.random().toString(36).slice(2)}`,
      overrides.scopes ?? '["trips:read"]',
      overrides.audience ?? null,
      overrides.accessExpiresAt ?? new Date(Date.now() + 3600_000).toISOString(),
      overrides.refreshExpiresAt ?? new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
      overrides.revokedAt ?? null,
      overrides.parentId ?? null,
    );
  const id = Number(info.lastInsertRowid);
  if (overrides.id !== undefined) {
    testDb.prepare('UPDATE oauth_tokens SET id = ? WHERE id = ?').run(overrides.id, id);
    return overrides.id;
  }
  return id;
}

describe('OauthTokensRepository', () => {
  describe('insertToken (OA13/OA14)', () => {
    it('OAUTHTOKREPO-001: writes exactly the given columns', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-1');
      const accessExpiry = new Date(Date.now() + 3600_000).toISOString();
      const refreshExpiry = new Date(Date.now() + 30 * 24 * 3600_000).toISOString();
      await tokens.insertToken({
        client_id: 'proto-1',
        user_id: user.id,
        access_token_hash: 'acchash',
        refresh_token_hash: 'refhash',
        scopes: '["trips:read"]',
        audience: 'https://mcp.example.com',
        access_token_expires_at: accessExpiry,
        refresh_token_expires_at: refreshExpiry,
        parent_token_id: null,
      });
      const row = testDb.prepare('SELECT * FROM oauth_tokens WHERE access_token_hash = ?').get('acchash') as Record<
        string,
        unknown
      >;
      expect(row).toMatchObject({
        client_id: 'proto-1',
        user_id: user.id,
        access_token_hash: 'acchash',
        refresh_token_hash: 'refhash',
        scopes: '["trips:read"]',
        audience: 'https://mcp.example.com',
        revoked_at: null,
        parent_token_id: null,
      });
    });

    it('OAUTHTOKREPO-002: parent_token_id is written when given (rotation)', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-2');
      const parentId = seedToken({ clientId: 'proto-2', userId: user.id });
      await tokens.insertToken({
        client_id: 'proto-2',
        user_id: user.id,
        access_token_hash: 'a2',
        refresh_token_hash: 'r2',
        scopes: '[]',
        audience: null,
        access_token_expires_at: new Date().toISOString(),
        refresh_token_expires_at: new Date().toISOString(),
        parent_token_id: parentId,
      });
      const row = testDb.prepare('SELECT parent_token_id FROM oauth_tokens WHERE access_token_hash = ?').get('a2') as {
        parent_token_id: number;
      };
      expect(row.parent_token_id).toBe(parentId);
    });
  });

  describe('revokeAllForClient (OA8) — the two spellings of "now"', () => {
    it("OAUTHTOKREPO-003: revokeAllForClient (legacy datetime('now')) and revokeById (legacy CURRENT_TIMESTAMP) store byte-identical text", async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-3');
      const idA = seedToken({ clientId: 'proto-3', userId: user.id });
      const idB = seedToken({ clientId: 'proto-3', userId: user.id });

      await tokens.revokeAllForClient('proto-3'); // legacy: datetime('now')
      await tokens.revokeById(idB); // legacy: CURRENT_TIMESTAMP

      const rowA = testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idA) as {
        revoked_at: string;
      };
      const rowB = testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idB) as {
        revoked_at: string;
      };
      expect(rowA.revoked_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(rowB.revoked_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('OAUTHTOKREPO-004: revokeAllForClient only touches un-revoked rows of that client', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-4');
      seedClient(user.id, 'proto-4b');
      const idOther = seedToken({ clientId: 'proto-4b', userId: user.id });
      const idAlready = seedToken({ clientId: 'proto-4', userId: user.id, revokedAt: '2020-01-01 00:00:00' });
      const idLive = seedToken({ clientId: 'proto-4', userId: user.id });

      await tokens.revokeAllForClient('proto-4');

      expect(
        (
          testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idOther) as {
            revoked_at: string | null;
          }
        ).revoked_at,
      ).toBeNull();
      expect(
        (testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idAlready) as { revoked_at: string })
          .revoked_at,
      ).toBe('2020-01-01 00:00:00');
      expect(
        (
          testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idLive) as {
            revoked_at: string | null;
          }
        ).revoked_at,
      ).not.toBeNull();
    });
  });

  describe('findByAccessTokenHashWithUser (OA16)', () => {
    it("OAUTHTOKREPO-005: joins the token owner's username/email/role", async () => {
      const { user } = createUser(testDb, { username: 'bearer-user', email: 'bearer@example.test' });
      seedClient(user.id, 'proto-5');
      seedToken({
        clientId: 'proto-5',
        userId: user.id,
        accessHash: 'bearer-hash',
        scopes: '["trips:read"]',
        audience: 'aud',
      });

      const row = await tokens.findByAccessTokenHashWithUser('bearer-hash');
      expect(row).toMatchObject({
        scopes: '["trips:read"]',
        audience: 'aud',
        revoked_at: null,
        user_id: user.id,
        client_id: 'proto-5',
        username: 'bearer-user',
        email: 'bearer@example.test',
        role: 'user',
      });
    });

    it('OAUTHTOKREPO-006: null for an unknown hash', async () => {
      expect(await tokens.findByAccessTokenHashWithUser('nope')).toBeNull();
    });
  });

  describe('findParent (OA17)', () => {
    it('OAUTHTOKREPO-007: returns id + parent_token_id', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-7');
      const rootId = seedToken({ clientId: 'proto-7', userId: user.id });
      const childId = seedToken({ clientId: 'proto-7', userId: user.id, parentId: rootId });
      expect(await tokens.findParent(childId)).toEqual({ id: childId, parent_token_id: rootId });
      expect(await tokens.findParent(rootId)).toEqual({ id: rootId, parent_token_id: null });
    });

    it('OAUTHTOKREPO-007b: an unknown id is null', async () => {
      expect(await tokens.findParent(999999)).toBeNull();
    });
  });

  describe('collectChainIds (OA18) — recursive CTE, proven against the legacy raw statement', () => {
    it('OAUTHTOKREPO-008: a 4-level chain is fully collected, a sibling branch is excluded — matches the legacy WITH RECURSIVE statement exactly', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-8');
      const id1 = seedToken({ clientId: 'proto-8', userId: user.id });
      const id2 = seedToken({ clientId: 'proto-8', userId: user.id, parentId: id1 });
      const id3 = seedToken({ clientId: 'proto-8', userId: user.id, parentId: id2 });
      const id4 = seedToken({ clientId: 'proto-8', userId: user.id, parentId: id3 });
      // A sibling branch off a DIFFERENT root — must not be collected.
      const sibRoot = seedToken({ clientId: 'proto-8', userId: user.id });
      const sibChild = seedToken({ clientId: 'proto-8', userId: user.id, parentId: sibRoot });

      const legacyRows = testDb
        .prepare(
          `
        WITH RECURSIVE chain(id) AS (
          SELECT id FROM oauth_tokens WHERE id = ?
          UNION ALL
          SELECT t.id FROM oauth_tokens t JOIN chain c ON t.parent_token_id = c.id
        )
        SELECT id FROM chain
      `,
        )
        .all(id1) as Array<{ id: number }>;
      const legacyIds = legacyRows.map((r) => r.id).sort((a, b) => a - b);

      const ids = (await tokens.collectChainIds(id1)).sort((a, b) => a - b);

      expect(ids).toEqual(legacyIds);
      expect(ids).toEqual([id1, id2, id3, id4].sort((a, b) => a - b));
      expect(ids).not.toContain(sibRoot);
      expect(ids).not.toContain(sibChild);
    });

    it('OAUTHTOKREPO-009: a token with no children collects only itself', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-9');
      const id = seedToken({ clientId: 'proto-9', userId: user.id });
      expect(await tokens.collectChainIds(id)).toEqual([id]);
    });
  });

  describe('revokeByIds (OA19) — the $in revoke', () => {
    it('OAUTHTOKREPO-010: revokes exactly the given ids, only if still live', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-10');
      const idLive1 = seedToken({ clientId: 'proto-10', userId: user.id });
      const idLive2 = seedToken({ clientId: 'proto-10', userId: user.id });
      const idAlready = seedToken({ clientId: 'proto-10', userId: user.id, revokedAt: '2020-01-01 00:00:00' });
      const idUntouched = seedToken({ clientId: 'proto-10', userId: user.id });

      await tokens.revokeByIds([idLive1, idLive2, idAlready]);

      expect(
        (
          testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idLive1) as {
            revoked_at: string | null;
          }
        ).revoked_at,
      ).not.toBeNull();
      expect(
        (
          testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idLive2) as {
            revoked_at: string | null;
          }
        ).revoked_at,
      ).not.toBeNull();
      expect(
        (testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idAlready) as { revoked_at: string })
          .revoked_at,
      ).toBe('2020-01-01 00:00:00'); // untouched, not re-stamped
      expect(
        (
          testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idUntouched) as {
            revoked_at: string | null;
          }
        ).revoked_at,
      ).toBeNull();
    });

    it('OAUTHTOKREPO-011: an empty array is a no-op (matches the legacy `if (ids.length > 0)` guard)', async () => {
      await expect(tokens.revokeByIds([])).resolves.toBeUndefined();
    });
  });

  describe('collectChainIds + revokeByIds inside a transaction — proves it joins the OPEN transaction', () => {
    it('OAUTHTOKREPO-012: revoking a chain inside a uow.transactional that then ROLLS BACK revokes nothing', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-12');
      const rootId = seedToken({ clientId: 'proto-12', userId: user.id });
      const childId = seedToken({ clientId: 'proto-12', userId: user.id, parentId: rootId });

      let caught: unknown;
      try {
        await withRequestContext(t.orm, async () => {
          await uow.transactional(async () => {
            const ids = await tokens.collectChainIds(rootId);
            expect(ids.sort((a, b) => a - b)).toEqual([rootId, childId].sort((a, b) => a - b));
            await tokens.revokeByIds(ids);
            throw new Error('force rollback');
          });
        });
      } catch (e) {
        caught = e;
      }
      expect((caught as Error).message).toBe('force rollback');

      const rows = testDb
        .prepare('SELECT id, revoked_at FROM oauth_tokens WHERE id IN (?, ?)')
        .all(rootId, childId) as Array<{ id: number; revoked_at: string | null }>;
      expect(rows.every((r) => r.revoked_at === null)).toBe(true);
    });

    it('OAUTHTOKREPO-013: the same sequence, committed, actually revokes the chain', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-13');
      const rootId = seedToken({ clientId: 'proto-13', userId: user.id });
      const childId = seedToken({ clientId: 'proto-13', userId: user.id, parentId: rootId });

      await withRequestContext(t.orm, async () => {
        await uow.transactional(async () => {
          const ids = await tokens.collectChainIds(rootId);
          await tokens.revokeByIds(ids);
        });
      });

      const rows = testDb
        .prepare('SELECT id, revoked_at FROM oauth_tokens WHERE id IN (?, ?)')
        .all(rootId, childId) as Array<{ id: number; revoked_at: string | null }>;
      expect(rows.every((r) => r.revoked_at !== null)).toBe(true);
    });
  });

  describe('findSuccessorAlive (OA20)', () => {
    it('OAUTHTOKREPO-014: a revoked parent with a live child returns the child', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-14');
      const parentId = seedToken({ clientId: 'proto-14', userId: user.id, revokedAt: '2020-01-01 00:00:00' });
      const childId = seedToken({ clientId: 'proto-14', userId: user.id, parentId });
      expect(await tokens.findSuccessorAlive(parentId)).toEqual({ id: childId });
    });

    it('OAUTHTOKREPO-015: no live child returns null', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-15');
      const parentId = seedToken({ clientId: 'proto-15', userId: user.id, revokedAt: '2020-01-01 00:00:00' });
      seedToken({ clientId: 'proto-15', userId: user.id, parentId, revokedAt: '2020-01-01 00:00:01' });
      expect(await tokens.findSuccessorAlive(parentId)).toBeNull();
    });
  });

  describe('findByRefreshTokenHash (OA22)', () => {
    it('OAUTHTOKREPO-016: returns every column the legacy statement selects, FK scalars read from the raw column value', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-16');
      const parentId = seedToken({ clientId: 'proto-16', userId: user.id });
      const id = seedToken({
        clientId: 'proto-16',
        userId: user.id,
        refreshHash: 'refresh-16',
        parentId,
        audience: 'aud-16',
      });

      const row = await tokens.findByRefreshTokenHash('refresh-16');
      expect(row).toEqual({
        id,
        client_id: 'proto-16',
        user_id: user.id,
        scopes: '["trips:read"]',
        audience: 'aud-16',
        refresh_token_expires_at: expect.any(String),
        revoked_at: null,
        parent_token_id: parentId,
      });
    });

    it('OAUTHTOKREPO-017: null for an unknown hash', async () => {
      expect(await tokens.findByRefreshTokenHash('nope')).toBeNull();
    });
  });

  describe('revokeById (OA23/OA28/OA33)', () => {
    it('OAUTHTOKREPO-018: revokes the given id only', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-18');
      const idA = seedToken({ clientId: 'proto-18', userId: user.id });
      const idB = seedToken({ clientId: 'proto-18', userId: user.id });
      await tokens.revokeById(idA);
      expect(
        (testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idA) as { revoked_at: string | null })
          .revoked_at,
      ).not.toBeNull();
      expect(
        (testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idB) as { revoked_at: string | null })
          .revoked_at,
      ).toBeNull();
    });
  });

  describe('findByAccessOrRefreshHashAndClient / revokeByAccessOrRefreshHashAndClient (OA24/OA25)', () => {
    it('OAUTHTOKREPO-019: finds by access hash OR refresh hash, scoped to the client', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-19');
      seedToken({ clientId: 'proto-19', userId: user.id, accessHash: 'acc-19', refreshHash: 'ref-19' });
      expect(await tokens.findByAccessOrRefreshHashAndClient('acc-19', 'proto-19')).toEqual({ user_id: user.id });
      expect(await tokens.findByAccessOrRefreshHashAndClient('ref-19', 'proto-19')).toEqual({ user_id: user.id });
    });

    it('OAUTHTOKREPO-020: does not match a token belonging to a different client', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-20a');
      seedClient(user.id, 'proto-20b');
      seedToken({ clientId: 'proto-20a', userId: user.id, accessHash: 'acc-20' });
      expect(await tokens.findByAccessOrRefreshHashAndClient('acc-20', 'proto-20b')).toBeNull();
    });

    it('OAUTHTOKREPO-021: revokeByAccessOrRefreshHashAndClient revokes by either hash, scoped to the client', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-21');
      const id = seedToken({ clientId: 'proto-21', userId: user.id, accessHash: 'acc-21', refreshHash: 'ref-21' });
      await tokens.revokeByAccessOrRefreshHashAndClient('acc-21', 'proto-21');
      expect(
        (testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(id) as { revoked_at: string | null })
          .revoked_at,
      ).not.toBeNull();
    });
  });

  describe('listActiveByUser (OA26) — QueryBuilder join on the real oauth_clients.client_id column', () => {
    it("OAUTHTOKREPO-022: lists only this user's non-revoked, non-expired-refresh sessions, newest first, with the client name joined in", async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      seedClient(user.id, 'proto-22a', 'Client A');
      seedClient(user.id, 'proto-22b', 'Client B');
      seedToken({ clientId: 'proto-22a', userId: user.id, scopes: '["trips:read"]' });
      testDb.exec("UPDATE oauth_tokens SET created_at = '2020-01-01 00:00:00' WHERE client_id = 'proto-22a'");
      seedToken({ clientId: 'proto-22b', userId: user.id });
      testDb.exec("UPDATE oauth_tokens SET created_at = '2021-01-01 00:00:00' WHERE client_id = 'proto-22b'");
      // revoked — excluded
      seedToken({ clientId: 'proto-22a', userId: user.id, revokedAt: '2020-01-01 00:00:00' });
      // expired refresh — excluded
      seedToken({ clientId: 'proto-22a', userId: user.id, refreshExpiresAt: '2000-01-01 00:00:00' });
      // another user's session — excluded
      seedClient(other.id, 'proto-22c');
      seedToken({ clientId: 'proto-22c', userId: other.id });

      const rows = await tokens.listActiveByUser(user.id);
      expect(rows.map((r) => r.client_name)).toEqual(['Client B', 'Client A']);
      expect(rows[0].scopes).toBeDefined();
    });

    it('OAUTHTOKREPO-022c: created_at NULL comes back null, not undefined (coverage: rule 16)', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-22null');
      const id = seedToken({ clientId: 'proto-22null', userId: user.id });
      testDb.prepare('UPDATE oauth_tokens SET created_at = NULL WHERE id = ?').run(id);
      const rows = await tokens.listActiveByUser(user.id);
      expect(rows[0].created_at).toBeNull();
    });
  });

  describe('findOwnedById (OA27)', () => {
    it('OAUTHTOKREPO-023: matches id+user', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-23');
      const id = seedToken({ clientId: 'proto-23', userId: user.id });
      expect(await tokens.findOwnedById(id, user.id)).toEqual({ id, client_id: 'proto-23' });
    });

    it("OAUTHTOKREPO-024: 404-shape null for another user's session", async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      seedClient(other.id, 'proto-24');
      const id = seedToken({ clientId: 'proto-24', userId: other.id });
      expect(await tokens.findOwnedById(id, user.id)).toBeNull();
    });
  });

  describe('listAllActiveWithClientAndUser (OA31) — the admin panel', () => {
    it('OAUTHTOKREPO-025: lists every active session across all users, with client name and username joined in', async () => {
      const { user: a } = createUser(testDb, { username: 'admin-panel-a' });
      const { user: b } = createUser(testDb, { username: 'admin-panel-b' });
      seedClient(a.id, 'proto-25a', 'Client A');
      seedClient(b.id, 'proto-25b', 'Client B');
      seedToken({ clientId: 'proto-25a', userId: a.id });
      seedToken({ clientId: 'proto-25b', userId: b.id, revokedAt: '2020-01-01 00:00:00' }); // excluded

      const rows = await tokens.listAllActiveWithClientAndUser();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ client_name: 'Client A', username: 'admin-panel-a', user_id: a.id });
    });

    it('OAUTHTOKREPO-025b: created_at NULL comes back null, not undefined (coverage: rule 16)', async () => {
      const { user } = createUser(testDb, { username: 'admin-panel-null' });
      seedClient(user.id, 'proto-25null', 'Client Null');
      const id = seedToken({ clientId: 'proto-25null', userId: user.id });
      testDb.prepare('UPDATE oauth_tokens SET created_at = NULL WHERE id = ?').run(id);
      const rows = await tokens.listAllActiveWithClientAndUser();
      expect(rows.find((r) => r.id === id)?.created_at).toBeNull();
    });
  });

  describe('findById (OA32)', () => {
    it('OAUTHTOKREPO-026: unscoped by owner — for the admin 404 check', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-26');
      const id = seedToken({ clientId: 'proto-26', userId: user.id });
      expect(await tokens.findById(id)).toEqual({ id, user_id: user.id, client_id: 'proto-26' });
    });

    it('OAUTHTOKREPO-027: null for an unknown id', async () => {
      expect(await tokens.findById(999999)).toBeNull();
    });
  });

  describe('revokeAllForUser (AU18/AU46 — built now for Task 5)', () => {
    it('OAUTHTOKREPO-028: revokes every live session for the user, across every client, leaves other users untouched', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      seedClient(user.id, 'proto-28a');
      seedClient(user.id, 'proto-28b');
      seedClient(other.id, 'proto-28c');
      const idA = seedToken({ clientId: 'proto-28a', userId: user.id });
      const idB = seedToken({ clientId: 'proto-28b', userId: user.id });
      const idAlready = seedToken({ clientId: 'proto-28a', userId: user.id, revokedAt: '2020-01-01 00:00:00' });
      const idOther = seedToken({ clientId: 'proto-28c', userId: other.id });

      await tokens.revokeAllForUser(user.id);

      expect(
        (testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idA) as { revoked_at: string | null })
          .revoked_at,
      ).not.toBeNull();
      expect(
        (testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idB) as { revoked_at: string | null })
          .revoked_at,
      ).not.toBeNull();
      expect(
        (testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idAlready) as { revoked_at: string })
          .revoked_at,
      ).toBe('2020-01-01 00:00:00');
      expect(
        (
          testDb.prepare('SELECT revoked_at FROM oauth_tokens WHERE id = ?').get(idOther) as {
            revoked_at: string | null;
          }
        ).revoked_at,
      ).toBeNull();
    });
  });

  describe('client relation join (Plan 3b interlude A — RULE11_referencedColumns)', () => {
    it('OAUTHTOKREPO-030: a QueryBuilder join on the client relation resolves the right client, even though oauth_clients.id !== client_id', async () => {
      const { user } = createUser(testDb);
      // seedClient's own `id` ("row-<clientId>") is already never equal to
      // `client_id` — this test additionally asserts the two literally
      // differ, so a future fixture change can't silently make the
      // distinction disappear and hide a regression.
      seedClient(user.id, 'proto-30', 'Client Thirty');
      const clientRow = testDb
        .prepare('SELECT id, client_id FROM oauth_clients WHERE client_id = ?')
        .get('proto-30') as { id: string; client_id: string };
      expect(clientRow.id).not.toBe(clientRow.client_id);
      const id = seedToken({ clientId: 'proto-30', userId: user.id });

      const em = t.orm.em.fork();
      const qb = em
        .getRepository(OauthTokens)
        .qb('ot')
        .innerJoin('ot.client', 'oc')
        .select(['ot.id', 'oc.name as client_name'])
        .where({ 'ot.id': id });
      expect(qb.getFormattedQuery()).toContain(
        'inner join `oauth_clients` as `oc` on `ot`.`client_id` = `oc`.`client_id`',
      );
      const row = await qb.execute<{ id: number; client_name: string }>('get', false);
      expect(row).toEqual({ id, client_name: 'Client Thirty' });
    });

    it('OAUTHTOKREPO-031: a DECOY client whose row id equals the real client_id — regression-proofs the join against silently falling back to oauth_clients.id (task-4-review.md, "For Task 5 / interlude A")', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-31-real', 'Real Client');
      const realClientRow = testDb
        .prepare('SELECT id, client_id FROM oauth_clients WHERE client_id = ?')
        .get('proto-31-real') as { id: string; client_id: string };
      // The decoy's own PRIMARY KEY (`id`) is deliberately set to the REAL
      // client's `client_id` — a wrong join (`oc.id = ot.client_id`, the pre-
      // Rule-11 defect) would match THIS row instead of the real one, and
      // return the decoy's name, not silently return nothing. A regression
      // to the wrong column is caught by a WRONG answer, not just an absent
      // one — the strongest form of this proof.
      testDb
        .prepare(
          `INSERT INTO oauth_clients (id, user_id, name, client_id, client_secret_hash, redirect_uris, allowed_scopes) VALUES (?, ?, ?, ?, ?, '[]', '[]')`,
        )
        .run(realClientRow.client_id, user.id, 'Decoy Client', 'proto-31-decoy', 'hash');

      const id = seedToken({ clientId: 'proto-31-real', userId: user.id });

      const em = t.orm.em.fork();
      const qb = em
        .getRepository(OauthTokens)
        .qb('ot')
        .innerJoin('ot.client', 'oc')
        .select(['ot.id', 'oc.name as client_name'])
        .where({ 'ot.id': id });
      const row = await qb.execute<{ id: number; client_name: string }>('get', false);
      expect(row).toEqual({ id, client_name: 'Real Client' });

      // Same proof through the actual repository methods (OA26/OA31), not
      // just a hand-rolled QueryBuilder query.
      const active = await tokens.listActiveByUser(user.id);
      expect(active.map((r) => r.client_name)).toEqual(['Real Client']);
      const allActive = await tokens.listAllActiveWithClientAndUser();
      expect(allActive.map((r) => r.client_name)).toEqual(['Real Client']);
    });
  });

  describe('identity-map write-back regression (program RULING, D-shape)', () => {
    it('OAUTHTOKREPO-029: findByRefreshTokenHash (projection A) then findParent (projection B) then revokeById inside uow.transactional — the write survives', async () => {
      const { user } = createUser(testDb);
      seedClient(user.id, 'proto-29');
      const id = seedToken({
        clientId: 'proto-29',
        userId: user.id,
        refreshHash: 'refresh-29',
        scopes: '["kept-scope"]',
      });

      await withRequestContext(t.orm, async () => {
        // Projection A — a wide fields set (id, client, user, scopes, audience, refresh_token_expires_at, revoked_at, parentToken).
        await tokens.findByRefreshTokenHash('refresh-29');
        // Projection B — a narrow, DIFFERENT field set on the same row.
        await tokens.findParent(id);
        // The intended write, inside the request's own transaction.
        await uow.transactional(async () => {
          await tokens.revokeById(id);
        });
      });

      const row = testDb.prepare('SELECT revoked_at, scopes FROM oauth_tokens WHERE id = ?').get(id) as {
        revoked_at: string | null;
        scopes: string;
      };
      expect(row.revoked_at).not.toBeNull(); // the nativeUpdate must stick
      expect(row.scopes).toBe('["kept-scope"]'); // untouched by either read
    });
  });
});
