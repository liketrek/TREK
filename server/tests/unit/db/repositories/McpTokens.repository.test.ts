import { McpTokens } from '../../../../src/db/entities/McpTokens.entity';
import type { McpTokensRepository } from '../../../../src/db/repositories/McpTokens.repository';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createMcpToken, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { createHash } from 'crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tokens: McpTokensRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tokens = t.repo(McpTokens);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawToken(id: number): unknown {
  return testDb.prepare('SELECT * FROM mcp_tokens WHERE id = ?').get(id);
}

describe('McpTokensRepository', () => {
  describe('listByUserAndKind', () => {
    it('MCPTOKREPO-001: scoped to user + kind, ordered by created_at DESC, exact column set', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      const older = createMcpToken(testDb, user.id, { name: 'older', kind: 'mcp' });
      testDb.prepare("UPDATE mcp_tokens SET created_at = '2020-01-01 00:00:00' WHERE id = ?").run(older.id);
      const newer = createMcpToken(testDb, user.id, { name: 'newer', kind: 'mcp' });
      testDb.prepare("UPDATE mcp_tokens SET created_at = '2020-01-02 00:00:00' WHERE id = ?").run(newer.id);
      createMcpToken(testDb, user.id, { name: 'an api key', kind: 'api' });
      createMcpToken(testDb, other.id, { name: 'not mine', kind: 'mcp' });

      const rows = await tokens.listByUserAndKind(user.id, 'mcp');
      expect(rows.map((r) => r.name)).toEqual(['newer', 'older']);
      expect(Object.keys(rows[0]).sort()).toEqual(
        ['api_scopes', 'created_at', 'id', 'last_used_at', 'name', 'scope_mode', 'token_prefix'].sort(),
      );
    });

    it('MCPTOKREPO-002: no tokens for the kind returns an empty array', async () => {
      const { user } = createUser(testDb);
      expect(await tokens.listByUserAndKind(user.id, 'api')).toEqual([]);
    });

    it('MCPTOKREPO-002b: created_at NULL comes back null, not undefined (coverage: rule 16)', async () => {
      const { user } = createUser(testDb);
      const token = createMcpToken(testDb, user.id, { name: 'null-created', kind: 'mcp' });
      testDb.prepare('UPDATE mcp_tokens SET created_at = NULL WHERE id = ?').run(token.id);
      const [row] = await tokens.listByUserAndKind(user.id, 'mcp');
      expect(row.created_at).toBeNull();
    });
  });

  describe('countByUserAndKind', () => {
    it('MCPTOKREPO-003: counts only the matching user + kind', async () => {
      const { user } = createUser(testDb);
      createMcpToken(testDb, user.id, { kind: 'mcp' });
      createMcpToken(testDb, user.id, { kind: 'mcp' });
      createMcpToken(testDb, user.id, { kind: 'api' });
      expect(await tokens.countByUserAndKind(user.id, 'mcp')).toBe(2);
      expect(await tokens.countByUserAndKind(user.id, 'api')).toBe(1);
    });
  });

  describe('insertToken', () => {
    it('MCPTOKREPO-004: inserts the row a legacy re-select would return, and returns only the generated id (Plan 3b Task 2 review, F4)', async () => {
      const { user } = createUser(testDb);
      const inserted = await tokens.insertToken({
        user_id: user.id,
        name: 'My Token',
        token_hash: 'hash-value',
        token_prefix: 'trek_abc123',
        kind: 'mcp',
        scope_mode: 'all',
        api_scopes: null,
      });
      // Only `{ id }` comes back — no full-row re-select is folded into
      // insertToken itself, so it cannot leak `token_hash` (or anything
      // else) to a caller that only asked to mint a row. `findBasic` (TK4)
      // stays the one place a caller reads the row back.
      expect(Object.keys(inserted)).toEqual(['id']);
      const row = rawToken(inserted.id) as Record<string, unknown>;
      expect(row.user_id).toBe(user.id);
      expect(row.name).toBe('My Token');
      expect(row.token_hash).toBe('hash-value');
      expect(row.kind).toBe('mcp');
      expect(row.scope_mode).toBe('all');
      expect(row.api_scopes).toBeNull();
      expect(row.last_used_at).toBeNull();
      expect(typeof row.created_at).toBe('string');
    });

    it('MCPTOKREPO-005: api_scopes is written when narrowed', async () => {
      const { user } = createUser(testDb);
      const inserted = await tokens.insertToken({
        user_id: user.id,
        name: 'Narrowed',
        token_hash: 'hash-2',
        token_prefix: 'trek_def456',
        kind: 'api',
        scope_mode: 'limited',
        api_scopes: '["stats","trips"]',
      });
      const row = rawToken(inserted.id) as { scope_mode: string; api_scopes: string };
      expect(row.scope_mode).toBe('limited');
      expect(row.api_scopes).toBe('["stats","trips"]');
    });

    it('MCPTOKREPO-024: the mint path (insertToken + findBasic) issues exactly two statements and never selects token_hash (Plan 3b Task 2 review, F4)', async () => {
      const { user } = createUser(testDb);
      const statements: string[] = [];
      const original = testDb.prepare.bind(testDb);
      const spy = vi.spyOn(testDb, 'prepare').mockImplementation((sql: string) => {
        statements.push(sql);
        return original(sql);
      });

      let insertedId: number;
      try {
        const inserted = await tokens.insertToken({
          user_id: user.id,
          name: 'Statement Count',
          token_hash: 'hash-count',
          token_prefix: 'trek_countpr',
          kind: 'mcp',
          scope_mode: 'all',
          api_scopes: null,
        });
        insertedId = inserted.id;
        await tokens.findBasic(insertedId);
      } finally {
        spy.mockRestore();
      }

      expect(statements).toHaveLength(2);
      expect(statements[0].toLowerCase()).toContain('insert into');
      expect(statements[1].toLowerCase()).toContain('select');
      // The INSERT necessarily names `token_hash` as a column to write; the
      // point is that no SELECT on the mint path reads it back into memory —
      // the discarded middle re-select an earlier version issued did.
      const selects = statements.filter((sql) => sql.trim().toLowerCase().startsWith('select'));
      for (const sql of selects) expect(sql.toLowerCase()).not.toContain('token_hash');
    });
  });

  describe('findBasic', () => {
    it('MCPTOKREPO-006: returns the TK4/TK9 union column set by id', async () => {
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { name: 'lookup-me' });
      const row = await tokens.findBasic(created.id);
      expect(row).toEqual({
        id: created.id,
        user_id: user.id,
        name: 'lookup-me',
        token_prefix: expect.any(String),
        created_at: expect.any(String),
        last_used_at: null,
      });
    });

    it('MCPTOKREPO-007: an unknown id is null', async () => {
      expect(await tokens.findBasic(999999)).toBeNull();
    });

    it('MCPTOKREPO-007c: created_at NULL comes back null, not undefined (coverage: rule 16)', async () => {
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { name: 'null-created-basic' });
      testDb.prepare('UPDATE mcp_tokens SET created_at = NULL WHERE id = ?').run(created.id);
      const row = await tokens.findBasic(created.id);
      expect(row?.created_at).toBeNull();
    });

    it('MCPTOKREPO-007b: identity-map regression — sees a raw UPDATE on the same id in the same request', async () => {
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { name: 'before' });
      await tokens.findBasic(created.id); // populate identity map
      testDb.prepare("UPDATE mcp_tokens SET name = 'after' WHERE id = ?").run(created.id);
      const row = await tokens.findBasic(created.id);
      expect(row?.name).toBe('after');
    });
  });

  describe('findOwnedByKind', () => {
    it('MCPTOKREPO-008: matches on id + user + kind', async () => {
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { kind: 'mcp' });
      expect(await tokens.findOwnedByKind(created.id, user.id, 'mcp')).toEqual({ id: created.id });
    });

    it('MCPTOKREPO-009: a different owner is null (ownership scoping)', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { kind: 'mcp' });
      expect(await tokens.findOwnedByKind(created.id, other.id, 'mcp')).toBeNull();
    });

    it('MCPTOKREPO-010: the wrong kind is null (kind scoping)', async () => {
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { kind: 'mcp' });
      expect(await tokens.findOwnedByKind(created.id, user.id, 'api')).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('MCPTOKREPO-011: deletes the row', async () => {
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id);
      await tokens.deleteById(created.id);
      expect(rawToken(created.id)).toBeUndefined();
    });
  });

  describe('listAllWithUsername', () => {
    it('MCPTOKREPO-012: spans users, carries the owner username, ordered by created_at DESC', async () => {
      const { user: ada } = createUser(testDb, { username: 'ada' });
      const { user: bob } = createUser(testDb, { username: 'bob' });
      const first = createMcpToken(testDb, ada.id, { name: 'first' });
      testDb.prepare("UPDATE mcp_tokens SET created_at = '2020-01-01 00:00:00' WHERE id = ?").run(first.id);
      const second = createMcpToken(testDb, bob.id, { name: 'second' });
      testDb.prepare("UPDATE mcp_tokens SET created_at = '2020-06-01 00:00:00' WHERE id = ?").run(second.id);

      const rows = await tokens.listAllWithUsername();
      expect(rows.map((r) => r.name)).toEqual(['second', 'first']);
      expect(rows.find((r) => r.name === 'first')).toEqual({
        id: first.id,
        name: 'first',
        token_prefix: expect.any(String),
        created_at: '2020-01-01 00:00:00',
        last_used_at: null,
        user_id: ada.id,
        username: 'ada',
      });
      expect(rows.find((r) => r.name === 'second')?.username).toBe('bob');
    });

    it('MCPTOKREPO-012b: no token_hash leaks through the projection', async () => {
      const { user } = createUser(testDb);
      createMcpToken(testDb, user.id);
      const rows = await tokens.listAllWithUsername();
      expect(rows.every((r) => !('token_hash' in r))).toBe(true);
    });

    it('MCPTOKREPO-012c: created_at NULL comes back null, not undefined (coverage: rule 16)', async () => {
      const { user } = createUser(testDb, { username: 'null-created-user' });
      const created = createMcpToken(testDb, user.id, { name: 'null-created-list' });
      testDb.prepare('UPDATE mcp_tokens SET created_at = NULL WHERE id = ?').run(created.id);
      const rows = await tokens.listAllWithUsername();
      expect(rows.find((r) => r.id === created.id)?.created_at).toBeNull();
    });
  });

  describe('findGrantByHash', () => {
    it('MCPTOKREPO-013: an API-kind token resolves the user + grant columns', async () => {
      const { user } = createUser(testDb, { username: 'grant-user' });
      createMcpToken(testDb, user.id, {
        kind: 'api',
        rawToken: 'trek_grant_raw',
        scope_mode: 'limited',
        api_scopes: '["stats"]',
      });
      const hash = createHash('sha256').update('trek_grant_raw').digest('hex');
      const row = await tokens.findGrantByHash(hash);
      expect(row).toEqual({
        id: user.id,
        username: 'grant-user',
        email: user.email,
        role: user.role,
        scope_mode: 'limited',
        api_scopes: '["stats"]',
      });
    });

    it('MCPTOKREPO-014: the same hash under kind=mcp does not resolve — kind is in the WHERE', async () => {
      const { user } = createUser(testDb);
      createMcpToken(testDb, user.id, { kind: 'mcp', rawToken: 'trek_mcp_raw' });
      const hash = createHash('sha256').update('trek_mcp_raw').digest('hex');
      expect(await tokens.findGrantByHash(hash)).toBeNull();
    });

    it('MCPTOKREPO-015: an unknown hash is null', async () => {
      expect(await tokens.findGrantByHash('does-not-exist')).toBeNull();
    });
  });

  describe('findUserByHashAndKind', () => {
    it('MCPTOKREPO-016: a matching hash + kind resolves the user identity columns', async () => {
      const { user } = createUser(testDb, { username: 'verify-user' });
      createMcpToken(testDb, user.id, { kind: 'mcp', rawToken: 'trek_verify_raw' });
      const hash = createHash('sha256').update('trek_verify_raw').digest('hex');
      const row = await tokens.findUserByHashAndKind(hash, 'mcp');
      expect(row).toEqual({ id: user.id, username: 'verify-user', email: user.email, role: user.role });
    });

    it('MCPTOKREPO-017: a real token of the wrong kind is indistinguishable from a missing one', async () => {
      const { user } = createUser(testDb);
      createMcpToken(testDb, user.id, { kind: 'api', rawToken: 'trek_wrong_kind' });
      const hash = createHash('sha256').update('trek_wrong_kind').digest('hex');
      expect(await tokens.findUserByHashAndKind(hash, 'mcp')).toBeNull();
      expect(await tokens.findUserByHashAndKind('completely-unknown-hash', 'mcp')).toBeNull();
    });

    it('MCPTOKREPO-018: an unknown hash is null', async () => {
      expect(await tokens.findUserByHashAndKind('nope', 'api')).toBeNull();
    });

    it('MCPTOKREPO-025: kind is genuinely inside the generated WHERE clause, not a post-filter on the result (Plan 3b Task 2 review, F6)', async () => {
      const { user } = createUser(testDb);
      createMcpToken(testDb, user.id, { kind: 'mcp', rawToken: 'trek_sql_shape' });
      const hash = createHash('sha256').update('trek_sql_shape').digest('hex');

      const statements: string[] = [];
      const original = testDb.prepare.bind(testDb);
      const spy = vi.spyOn(testDb, 'prepare').mockImplementation((sql: string) => {
        statements.push(sql);
        return original(sql);
      });
      try {
        await tokens.findUserByHashAndKind(hash, 'mcp');
      } finally {
        spy.mockRestore();
      }

      expect(statements).toHaveLength(1);
      const select = statements[0].toLowerCase();
      const whereIndex = select.indexOf('where');
      expect(whereIndex).toBeGreaterThan(-1);
      // `kind` must appear on the SQL side of the WHERE keyword — a
      // post-filter shape (select every column, compare `kind` in JS) would
      // still pass every behavioural test in this describe block (M1 in the
      // review's mutation table: 56/56 green with kind moved to a JS
      // check), so the SQL text itself is the only thing that can catch it.
      expect(select.slice(whereIndex)).toContain('kind');
    });
  });

  describe('touchLastUsedByHash', () => {
    it('MCPTOKREPO-019: stamps last_used_at only on the matching row, no other column changes', async () => {
      const { user } = createUser(testDb);
      const target = createMcpToken(testDb, user.id, { rawToken: 'trek_touch_me' });
      const other = createMcpToken(testDb, user.id, { rawToken: 'trek_leave_me' });
      const before = rawToken(target.id) as { name: string; token_hash: string };

      await tokens.touchLastUsedByHash(target.tokenHash);

      const after = rawToken(target.id) as Record<string, unknown>;
      expect(after.last_used_at).not.toBeNull();
      expect(after.name).toBe(before.name);
      expect(after.token_hash).toBe(before.token_hash);
      expect((rawToken(other.id) as { last_used_at: string | null }).last_used_at).toBeNull();
    });

    it('MCPTOKREPO-019b: an unknown hash touches nothing (no error, no row)', async () => {
      await expect(tokens.touchLastUsedByHash('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('deleteAllForUser', () => {
    it('MCPTOKREPO-020: deletes every mcp_tokens row for the user, both kinds, leaves other users alone', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      createMcpToken(testDb, user.id, { kind: 'mcp' });
      createMcpToken(testDb, user.id, { kind: 'api' });
      const untouched = createMcpToken(testDb, other.id, { kind: 'mcp' });

      await tokens.deleteAllForUser(user.id);

      expect(testDb.prepare('SELECT COUNT(*) c FROM mcp_tokens WHERE user_id = ?').get(user.id)).toEqual({ c: 0 });
      expect(rawToken(untouched.id)).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------
  // Controller ruling on Task 1's review (BLOCKER): a `findOne`/`find` with
  // `fields` + `refresh: true` used to re-snapshot only the selected fields
  // into the SHARED identity map; loading the same row again elsewhere in
  // the request with a different projection merged the two, and a later
  // `nativeUpdate` (which bypasses the identity map) left that merged entity
  // stale — the closing `flush()` of a `uow.transactional` block could then
  // write the stale unselected values back over the `nativeUpdate`. Every
  // entity-hydrating read in this repository now takes
  // `disableIdentityMap: true` instead (never merged anywhere a flush could
  // find it), and `insertToken` writes through `em.insert` rather than
  // `create()` + `persist()` + `flush()`. This is the regression proof.
  // ---------------------------------------------------------------------
  describe('identity-map isolation (disableIdentityMap regression)', () => {
    /**
     * `disableIdentityMap: true` means the returned entity is never merged
     * into `EntityManager.getUnitOfWork()`'s tracked set at all — checked
     * directly via `getById`, which is the same lookup MikroORM's own
     * `flush()` consults to decide what to write.
     *
     * CORRECTION (Plan 3b Task 2 review, F2): an earlier version of this
     * docstring claimed the stale write-back this ruling guards against
     * could not be reproduced as an observable black-box failure on this
     * repository's own call shapes, and settled for this structural
     * `getById` assertion alone. That claim was wrong — it IS reproducible.
     * `MCPTOKREPO-023` below is the request-shaped reproduction: read
     * projection A (`listByUserAndKind`, which selects `scope_mode`), read
     * projection B (`findBasic`, which does not), then a `nativeUpdate` on
     * `scope_mode` inside `uow.transactional`. On the fixed code (every read
     * `disableIdentityMap: true`) the `nativeUpdate` survives the block's
     * closing flush. Reverting `listByUserAndKind` to a bare `find` (no
     * `disableIdentityMap`) and `findBasic` to `refresh: true` instead
     * reproduces the exact hazard the ruling describes: both reads merge
     * into the same managed entity, the `nativeUpdate` bypasses it, and the
     * closing `flush()` writes the merged entity's stale `scope_mode: 'all'`
     * back over the intended `'limited'` — `update mcp_tokens set
     * scope_mode='all', api_scopes=null where id=?` observed immediately
     * after `update mcp_tokens set scope_mode='limited' where id=?` in the
     * query log, reverting the very write the test just made. `getById`
     * (this test, `MCPTOKREPO-021`) stays as the structural companion: it is
     * the assertion that fails first and pinpoints which method regressed,
     * while `MCPTOKREPO-023` pins the actual end-to-end behaviour the
     * ruling exists to protect.
     */
    it('MCPTOKREPO-021: every entity-hydrating read leaves nothing behind in the shared identity map', async () => {
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { name: 'stays-original' });

      await tokens.findBasic(created.id);
      expect(t.em.getUnitOfWork().getById(McpTokens, created.id)).toBeUndefined();

      await tokens.findOwnedByKind(created.id, user.id, 'mcp');
      expect(t.em.getUnitOfWork().getById(McpTokens, created.id)).toBeUndefined();

      const [listed] = await tokens.listByUserAndKind(user.id, 'mcp');
      expect(t.em.getUnitOfWork().getById(McpTokens, listed.id)).toBeUndefined();
    });

    it('MCPTOKREPO-021b: a nativeUpdate made after an isolated read is never discarded by an unrelated flush', async () => {
      // Belt-and-suspenders behavioural pin alongside MCPTOKREPO-021's
      // structural proof above: even though hand mutation-testing could not
      // turn the un-isolated shape into an observable failure here (see that
      // test's docstring), the fixed code's actual end-to-end behaviour —
      // read, nativeUpdate, flush, still correct — is still worth pinning.
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { name: 'stays-original' });
      const uow = new UnitOfWork(t.em);

      await uow.transactional(async () => {
        const basic = await tokens.findBasic(created.id);
        expect(basic?.last_used_at).toBeNull();
        await tokens.findOwnedByKind(created.id, user.id, 'mcp');
        await tokens.touchLastUsedByHash(created.tokenHash);
      });

      const row = rawToken(created.id) as { last_used_at: string | null; name: string };
      expect(row.last_used_at).not.toBeNull();
      expect(row.name).toBe('stays-original');
    });

    it('MCPTOKREPO-022: insertToken never flushes an unrelated dirty entity sitting in the shared identity map', async () => {
      // A create()+persist()+flush() shape would flush the WHOLE unit of
      // work of the shared context-resolving EntityManager, not just the
      // row being inserted — including any other managed entity's unflushed
      // in-memory change (D4/AuditLogRepository's own precedent for this
      // exact hazard). `em.insert()` fires one native INSERT with no such
      // side effect. Proof: load a DIFFERENT row through the plain (merging)
      // EntityManager API, mutate it in memory only, call `insertToken`, and
      // confirm the mutation was never written — nothing here ever called
      // `flush()` on that dirty entity's context.
      const { user } = createUser(testDb);
      const untouched = createMcpToken(testDb, user.id, { name: 'do-not-flush-me' });
      const dirty = await t.em.findOneOrFail(McpTokens, { id: untouched.id });
      dirty.name = 'mutated-in-memory-only';

      await tokens.insertToken({
        user_id: user.id,
        name: 'the actual insert',
        token_hash: 'insert-no-side-effect-hash',
        token_prefix: 'trek_txprefi',
        kind: 'mcp',
        scope_mode: 'all',
        api_scopes: null,
      });

      expect((rawToken(untouched.id) as { name: string }).name).toBe('do-not-flush-me');
      expect(
        testDb.prepare('SELECT id FROM mcp_tokens WHERE token_hash = ?').get('insert-no-side-effect-hash'),
      ).toBeDefined();
    });

    /**
     * The request-shaped reproduction (Plan 3b Task 2 review, F2, shape D):
     * projection A (`listByUserAndKind`, which selects `scope_mode`),
     * projection B (`findBasic`, which does not), then a `nativeUpdate` on
     * `scope_mode` — the column only projection A touched — inside
     * `uow.transactional`. On the fixed code (every read
     * `disableIdentityMap: true`) neither read is ever merged into the
     * shared identity map, so the transaction's closing `flush()` has
     * nothing stale to write and the `nativeUpdate` survives untouched.
     *
     * Mutation-proven by hand (not committed as a variant, per the brief —
     * see the fix report for the transcript): reverting
     * `listByUserAndKind`'s `find` to drop `disableIdentityMap` and
     * `findBasic`'s `findOne` from `disableIdentityMap: true` to
     * `refresh: true` makes this test fail — the row comes back
     * `scope_mode: 'all'`, and the captured query log shows `update
     * mcp_tokens set scope_mode='all', api_scopes=null where id=?` executed
     * immediately AFTER `update mcp_tokens set scope_mode='limited' where
     * id=?`, i.e. the transaction's closing flush silently reverting the
     * intended write.
     */
    it('MCPTOKREPO-023: projection A then projection B then a nativeUpdate on an A-only column, inside uow.transactional — the nativeUpdate survives the closing flush', async () => {
      const { user } = createUser(testDb);
      const created = createMcpToken(testDb, user.id, { name: 'stays-original', scope_mode: 'all' });
      const uow = new UnitOfWork(t.em);

      await uow.transactional(async () => {
        // Projection A: selects `scope_mode` among its columns.
        await tokens.listByUserAndKind(user.id, 'mcp');
        // Projection B: a disjoint column set that does NOT select `scope_mode`.
        await tokens.findBasic(created.id);
        // A native write on the column only projection A touched.
        await t.em.nativeUpdate(McpTokens, { id: created.id }, { scope_mode: 'limited' });
      });

      const row = rawToken(created.id) as { scope_mode: string; name: string };
      expect(row.scope_mode).toBe('limited');
      expect(row.name).toBe('stays-original');
    });
  });
});
