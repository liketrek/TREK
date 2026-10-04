import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createUser, createAdmin, type TestUser } from '../../../helpers/factories';
import { Users } from '../../../../src/db/entities/Users.entity';
import type { UsersRepository } from '../../../../src/db/repositories/Users.repository';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let users: UsersRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  users = t.repo(Users);
});
beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

/**
 * Runs `fn` while counting queries MikroORM actually issues over the shared
 * connection — see `AppSettings.repository.test.ts` for why a value-only
 * assertion can't catch a regression in the `disableIdentityMap: true`
 * ruling (Plan 3b Task 1 fix round, `task-1-review.md` B1).
 */
async function withQueryCount<T>(fn: () => Promise<T>): Promise<{ value: T; queries: number }> {
  const connection = t.orm.em.getConnection();
  const spy = vi.spyOn(connection, 'execute');
  try {
    const value = await fn();
    return { value, queries: spy.mock.calls.length };
  } finally {
    spy.mockRestore();
  }
}

describe('UsersRepository', () => {
  it('USERSREPO-001: getEmail reads the stored email, matching SELECT email FROM users WHERE id = ?', async () => {
    const { user } = createUser(testDb, { email: 'someone@example.com' });
    expect(await users.getEmail(user.id)).toBe('someone@example.com');
    const raw = testDb.prepare('SELECT email FROM users WHERE id = ?').get(user.id) as { email: string };
    expect(await users.getEmail(user.id)).toBe(raw.email);
  });

  it('USERSREPO-002: getEmail returns null for a user id that does not exist', async () => {
    expect(await users.getEmail(999999)).toBeNull();
  });

  it('USERSREPO-003: getApiKeyColumn reads maps_api_key, matching SELECT maps_api_key FROM users WHERE id = ?', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('encrypted-maps-key', user.id);
    expect(await users.getApiKeyColumn(user.id, 'maps_api_key')).toBe('encrypted-maps-key');
  });

  it('USERSREPO-004: getApiKeyColumn reads unsplash_api_key, not the other two columns', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ?, unsplash_api_key = ?, amap_api_key = ? WHERE id = ?')
      .run('maps-value', 'unsplash-value', 'amap-value', user.id);
    expect(await users.getApiKeyColumn(user.id, 'unsplash_api_key')).toBe('unsplash-value');
  });

  it('USERSREPO-005: getApiKeyColumn reads amap_api_key', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET amap_api_key = ? WHERE id = ?').run('amap-value', user.id);
    expect(await users.getApiKeyColumn(user.id, 'amap_api_key')).toBe('amap-value');
  });

  it('USERSREPO-006: getApiKeyColumn returns null for an unset column and for a missing user', async () => {
    const { user } = createUser(testDb);
    expect(await users.getApiKeyColumn(user.id, 'maps_api_key')).toBeNull();
    expect(await users.getApiKeyColumn(999999, 'maps_api_key')).toBeNull();
  });

  // Plan 3b Task 1 fix round (task-1-review.md B1): getEmail/getApiKeyColumn
  // are primary-key findOne calls, which MikroORM would answer from the
  // identity map on a repeat call absent `disableIdentityMap: true` —
  // invisible to a raw UPDATE on the same user id inside the same request.
  // Pins the fix at one query each; the property is preserved (B1's fix
  // dropped `refresh: true`, not this guarantee).
  describe('getEmail/getApiKeyColumn see a raw UPDATE on the same user in the same request (disableIdentityMap regression)', () => {
    it('USERSREPO-007: a raw UPDATE users SET email then getEmail reads the new email, in one query', async () => {
      const { user } = createUser(testDb, { email: 'old@example.com' });
      expect(await users.getEmail(user.id)).toBe('old@example.com'); // populate the identity map
      testDb.prepare('UPDATE users SET email = ? WHERE id = ?').run('new@example.com', user.id);
      const { value, queries } = await withQueryCount(() => users.getEmail(user.id));
      expect(value).toBe('new@example.com');
      expect(queries).toBe(1);
    });

    it('USERSREPO-008: a raw UPDATE users SET maps_api_key then getApiKeyColumn reads the new value, in one query', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('old-key', user.id);
      expect(await users.getApiKeyColumn(user.id, 'maps_api_key')).toBe('old-key'); // populate the identity map
      testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('new-key', user.id);
      const { value, queries } = await withQueryCount(() => users.getApiKeyColumn(user.id, 'maps_api_key'));
      expect(value).toBe('new-key');
      expect(queries).toBe(1);
    });
  });

  // ---------------------------------------------------------------------
  // Plan 3b Task 1 — every users-table method the auth/oidc/oauth/tokens
  // cluster needs (see Users.repository.ts for the legacy-statement mapping
  // per method). One `it` (or a focused group) per method, on real rows.
  // ---------------------------------------------------------------------

  it('USERSREPO-009: findByIdWithPasswordVersion (JV1) reads id/username/email/role/password_version', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET password_version = 3 WHERE id = ?').run(user.id);
    const row = await users.findByIdWithPasswordVersion(user.id);
    expect(row).toEqual({ id: user.id, username: user.username, email: user.email, role: 'user', password_version: 3 });
    expect(await users.findByIdWithPasswordVersion(999999)).toBeNull();
  });

  it('USERSREPO-009b: findForWsHandshake (Plan 4 Task 1, realtime.gateway.ts) reads id/username/email/role/mfa_enabled/password_version', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET password_version = 3, mfa_enabled = 1 WHERE id = ?').run(user.id);
    const row = await users.findForWsHandshake(user.id);
    expect(row).toEqual({ id: user.id, username: user.username, email: user.email, role: 'user', mfa_enabled: 1, password_version: 3 });
    expect(await users.findForWsHandshake(999999)).toBeNull();
  });

  it('USERSREPO-009c: findForWsHandshake reports mfa_enabled as null, not 0, for a user who never had it set (Plan 4 Task 1)', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = NULL WHERE id = ?').run(user.id);
    expect((await users.findForWsHandshake(user.id))?.mfa_enabled).toBeNull();
  });

  it('USERSREPO-010: getPasswordVersion reads password_version, null for a missing user', async () => {
    const { user } = createUser(testDb);
    expect(await users.getPasswordVersion(user.id)).toBe(0);
    testDb.prepare('UPDATE users SET password_version = 7 WHERE id = ?').run(user.id);
    expect(await users.getPasswordVersion(user.id)).toBe(7);
    expect(await users.getPasswordVersion(999999)).toBeNull();
  });

  describe('countNonGuest (AU4/AU7/O10) — is_guest is INTEGER NOT NULL DEFAULT 0, never observed NULL', () => {
    it('USERSREPO-011: counts only non-guest users', async () => {
      createUser(testDb);
      createUser(testDb);
      const { user: guest } = createUser(testDb);
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
      expect(await users.countNonGuest()).toBe(2);
    });

    it('USERSREPO-012: a NULL is_guest row cannot exist — the column is NOT NULL DEFAULT 0 (verified against the baseline + guest-members migrations), so a direct INSERT that omits the column, or an explicit NULL, both resolve to 0, never leaving a row this filter would miscount', () => {
      testDb.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run('nog', 'nog@test.example.com', 'x', 'user');
      const stored = testDb.prepare("SELECT is_guest FROM users WHERE username = 'nog'").get() as { is_guest: number };
      expect(stored.is_guest).toBe(0); // the DEFAULT 0, not a nullable column silently coercing
      expect(() => testDb.prepare('UPDATE users SET is_guest = NULL WHERE username = ?').run('nog')).toThrow(/NOT NULL constraint failed/);
    });
  });

  it('USERSREPO-013: findAdminNeedingPasswordChange finds an admin flagged must_change_password, ignores a matching non-admin or an unflagged admin', async () => {
    expect(await users.findAdminNeedingPasswordChange()).toBeNull();
    const { user: plainAdmin } = createAdmin(testDb);
    expect(await users.findAdminNeedingPasswordChange()).toBeNull();
    const { user: flaggedUser } = createUser(testDb);
    testDb.prepare('UPDATE users SET must_change_password = 1 WHERE id = ?').run(flaggedUser.id);
    expect(await users.findAdminNeedingPasswordChange()).toBeNull(); // not an admin
    testDb.prepare('UPDATE users SET must_change_password = 1 WHERE id = ?').run(plainAdmin.id);
    expect(await users.findAdminNeedingPasswordChange()).toBe(plainAdmin.id);
  });

  describe('findIdByEmailOrUsernameCI (AU9)', () => {
    it('USERSREPO-014: matches by email OR username, case-insensitively, excluding guests', async () => {
      const { user } = createUser(testDb, { email: 'Someone@Example.com', username: 'SomeoneName' });
      expect(await users.findIdByEmailOrUsernameCI('someone@example.com', 'no-match')).toBe(user.id);
      expect(await users.findIdByEmailOrUsernameCI('no-match@example.com', 'someonename')).toBe(user.id);
      expect(await users.findIdByEmailOrUsernameCI('nope@example.com', 'nope')).toBeNull();
    });

    it('USERSREPO-015: excludes a guest even on an exact match', async () => {
      const { user } = createUser(testDb, { email: 'guest1@example.com', username: 'guest1' });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);
      expect(await users.findIdByEmailOrUsernameCI('guest1@example.com', 'guest1')).toBeNull();
    });

    // Program rule 18 / Plan 3b Task 7 review H1: SQLite's LOWER() is
    // ASCII-only; JS's toLowerCase() is full-Unicode. Mutation-proved by
    // reverting the repository's `lowerParam(platform, email)` bind back to
    // a plain `email.toLowerCase()` — this then fails, because the column
    // stays folded by SQLite's LOWER() ('josÉ@x.com') while the JS-lowered
    // bind is 'josé@x.com'.
    it('USERSREPO-014b: matches the exact stored non-ASCII spelling; a JS-lowered spelling does not match', async () => {
      const { user } = createUser(testDb, { email: 'JOSÉ@x.com', username: 'plainname' });
      expect(await users.findIdByEmailOrUsernameCI('JOSÉ@x.com', 'no-match')).toBe(user.id);
      expect(await users.findIdByEmailOrUsernameCI('JOSÉ@X.COM', 'no-match')).toBe(user.id);
      expect(await users.findIdByEmailOrUsernameCI('josé@x.com', 'no-match')).toBeNull();
    });
  });

  describe('insertUser (AU10/O14)', () => {
    it('USERSREPO-016: local registration shape (AU10) — no oidc/avatar columns', async () => {
      const row = await users.insertUser({
        username: 'localuser',
        email: 'local@example.com',
        password_hash: 'hashed',
        role: 'user',
        first_seen_version: '1.2.3',
      });
      expect(row.username).toBe('localuser');
      expect(row.email).toBe('local@example.com');
      expect(row.password_hash).toBe('hashed');
      expect(row.role).toBe('user');
      expect(row.first_seen_version).toBe('1.2.3');
      expect(row.login_count).toBe(0);
      expect(row.oidc_sub).toBeNull();
      expect(row.oidc_issuer).toBeNull();
      expect(row.avatar).toBeNull();
      expect(row.created_at).not.toBeNull();
      const raw = testDb.prepare('SELECT * FROM users WHERE id = ?').get(row.id);
      expect(raw).toMatchObject({ username: 'localuser', email: 'local@example.com', role: 'user', login_count: 0 });
    });

    it('USERSREPO-017: SSO registration shape (O14) — oidc_sub/oidc_issuer/avatar set', async () => {
      const row = await users.insertUser({
        username: 'ssouser',
        email: 'sso@example.com',
        password_hash: 'unusable-hash',
        role: 'admin',
        first_seen_version: '1.2.3',
        oidc_sub: 'sub-123',
        oidc_issuer: 'https://idp.example.com',
        avatar: 'https://idp.example.com/pic.png',
      });
      expect(row.oidc_sub).toBe('sub-123');
      expect(row.oidc_issuer).toBe('https://idp.example.com');
      expect(row.avatar).toBe('https://idp.example.com/pic.png');
      expect(row.role).toBe('admin');
      expect(row.login_count).toBe(0);
    });

    it('USERSREPO-057: insertUser (F2) never flushes an unrelated pending entity in the same EM', async () => {
      // Simulate an unrelated pending change elsewhere in the request's EM —
      // a managed entity persist()-ed but not yet flushed by its own code
      // path. Before F2's fix, `insertUser`'s `persist().flush()` committed
      // the WHOLE unit of work, so this row would land in the DB too.
      const pending = t.em.create(Users, {
        username: 'pending-unflushed',
        email: 'pending@example.com',
        password_hash: 'x',
        role: 'user',
        first_seen_version: '9.9.9',
        login_count: 0,
      });
      t.em.persist(pending);

      await users.insertUser({
        username: 'freshuser',
        email: 'fresh@example.com',
        password_hash: 'hashed',
        role: 'user',
        first_seen_version: '1.2.3',
      });

      const pendingRow = testDb.prepare('SELECT * FROM users WHERE username = ?').get('pending-unflushed');
      expect(pendingRow).toBeUndefined(); // insertUser must not have flushed it
      const freshRow = testDb.prepare('SELECT * FROM users WHERE username = ?').get('freshuser');
      expect(freshRow).toBeDefined(); // but the intended row is there

      t.em.clear(); // discard the still-pending unflushed entity before the next test
    });

    it('USERSREPO-057D: throws when the read-back after insert finds no row (coverage: the guard branch)', async () => {
      const spy = vi.spyOn(users, 'findById').mockResolvedValueOnce(null);
      await expect(users.insertUser({
        username: 'ghostuser',
        email: 'ghost@example.com',
        password_hash: 'hashed',
        role: 'user',
        first_seen_version: '1.2.3',
      })).rejects.toThrow('insertUser: read-back after insert found no row');
      spy.mockRestore();
    });
  });

  describe('findByEmailCI (AU12) — AuthService.loginUser', () => {
    it('USERSREPO-018: matches case-insensitively, excludes guests, returns the full row', async () => {
      const { user } = createUser(testDb, { email: 'Case.Test@Example.com' });
      const row = await users.findByEmailCI('case.test@example.com');
      expect(row?.id).toBe(user.id);
      expect(row?.username).toBe(user.username);
      expect(await users.findByEmailCI('nope@example.com')).toBeNull();
    });

    it('USERSREPO-019: a guest with a matching email is not returned', async () => {
      const { user } = createUser(testDb, { email: 'guest2@example.com' });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);
      expect(await users.findByEmailCI('guest2@example.com')).toBeNull();
    });

    // Program rule 18 / Plan 3b Task 7 review H1. Mutation-proved by
    // reverting the repository's `lowerParam(platform, email)` bind back to
    // `email.toLowerCase()` — then USERSREPO-018b's second assertion fails
    // (401 lockout reproduced at the repository level: the exact stored
    // spelling stops matching).
    it('USERSREPO-018b: matches the exact stored non-ASCII spelling; a JS-lowered spelling does not match', async () => {
      const { user } = createUser(testDb, { email: 'JOSÉ@x.com' });
      const exact = await users.findByEmailCI('JOSÉ@x.com');
      expect(exact?.id).toBe(user.id);
      const asciiRecase = await users.findByEmailCI('JOSÉ@X.COM');
      expect(asciiRecase?.id).toBe(user.id);
      expect(await users.findByEmailCI('josé@x.com')).toBeNull();
    });
  });

  describe('findByEmailLoweredBind (O4) — OidcService.findOrCreateUser, caller already JS-lowers', () => {
    it('USERSREPO-018c: matches an already-lowered bind against a mixed-case stored email, excludes guests', async () => {
      const { user } = createUser(testDb, { email: 'Case.Test@Example.com' });
      const row = await users.findByEmailLoweredBind('case.test@example.com');
      expect(row?.id).toBe(user.id);
      expect(await users.findByEmailLoweredBind('nope@example.com')).toBeNull();
    });

    it('USERSREPO-018d: a guest with a matching email is not returned', async () => {
      const { user } = createUser(testDb, { email: 'guest2b@example.com' });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);
      expect(await users.findByEmailLoweredBind('guest2b@example.com')).toBeNull();
    });

    // O4's own legacy shape: `LOWER(email) = ?` — SQLite only lowers the
    // COLUMN; the caller's already-lowered bind is compared as-is. A stored
    // non-ASCII email folds to 'josÉ@x.com' under SQLite's ASCII-only
    // LOWER(); a JS-lowered bind of the exact same spelling is
    // 'josé@x.com' — genuinely different strings, so THIS method correctly
    // does not match it. That is O4's real (pre-existing, unchanged)
    // behaviour, not a regression — findByEmailCI above is the method
    // OidcService's non-JS-lowered callers must use instead.
    it('USERSREPO-018e: a JS-lowered bind against a non-ASCII stored email does not match (this is O4 parity, not a bug)', async () => {
      createUser(testDb, { email: 'JOSÉ@x.com' });
      expect(await users.findByEmailLoweredBind('josé@x.com')).toBeNull();
    });
  });

  // Plan 3b Task 1 fix round item 7 — AuthService.demoLogin's exact statement
  // (`SELECT * FROM users WHERE email = ?`), missing from the inventory,
  // added now so Task 5 has it.
  describe('findByEmailExact (AuthService.demoLogin, inventory correction)', () => {
    it('USERSREPO-057B: matches only the exact case, unlike every other email lookup here', async () => {
      const { user } = createUser(testDb, { email: 'Demo.User@Example.com' });
      const row = await users.findByEmailExact('Demo.User@Example.com');
      expect(row?.id).toBe(user.id);
      expect(await users.findByEmailExact('demo.user@example.com')).toBeNull(); // different case — no match
      expect(await users.findByEmailExact('nope@example.com')).toBeNull();
    });

    it('USERSREPO-057C: a guest row IS returned — no guest filter, unlike findByEmailCI/findForPasswordReset', async () => {
      const { user } = createUser(testDb, { email: 'demoguest@example.com' });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);
      const row = await users.findByEmailExact('demoguest@example.com');
      expect(row?.id).toBe(user.id);
    });
  });

  describe('touchLastLogin (AU13/AU34/AU35/PK12/O16)', () => {
    it('USERSREPO-020: bumps login_count by exactly 1 and stamps last_login, in one statement', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET login_count = 5 WHERE id = ?').run(user.id);
      await users.touchLastLogin(user.id);
      const row = testDb.prepare('SELECT login_count, last_login FROM users WHERE id = ?').get(user.id) as { login_count: number; last_login: string };
      expect(row.login_count).toBe(6);
      expect(row.last_login).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('USERSREPO-021: two concurrent calls both land — +2, never +1 (no read-modify-write)', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET login_count = 10 WHERE id = ?').run(user.id);
      await Promise.all([users.touchLastLogin(user.id), users.touchLastLogin(user.id)]);
      const row = testDb.prepare('SELECT login_count FROM users WHERE id = ?').get(user.id) as { login_count: number };
      expect(row.login_count).toBe(12);
    });
  });

  it('USERSREPO-022: findMeRow (AU14) reads the /api/auth/me projection', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET avatar = ?, mfa_enabled = 1, must_change_password = 1 WHERE id = ?').run('pic.png', user.id);
    const row = await users.findMeRow(user.id);
    expect(row).toMatchObject({ id: user.id, username: user.username, email: user.email, role: 'user', avatar: 'pic.png', mfa_enabled: 1, must_change_password: 1 });
    expect(row?.created_at).not.toBeNull();
    expect(await users.findMeRow(999999)).toBeNull();
  });

  it('USERSREPO-022b: findMeRow — every nullable column comes back null, not undefined, when NULL in the row (coverage: rule 16)', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET avatar = NULL, oidc_issuer = NULL, created_at = NULL, mfa_enabled = NULL, must_change_password = NULL WHERE id = ?').run(user.id);
    const row = await users.findMeRow(user.id);
    expect(row?.avatar).toBeNull();
    expect(row?.oidc_issuer).toBeNull();
    expect(row?.created_at).toBeNull();
    expect(row?.mfa_enabled).toBeNull();
    expect(row?.must_change_password).toBeNull();
  });

  it('USERSREPO-023: getPasswordHashAndVersion (AU15) reads both columns together', async () => {
    const { user, password: _password } = createUser(testDb);
    testDb.prepare('UPDATE users SET password_version = 2 WHERE id = ?').run(user.id);
    const row = await users.getPasswordHashAndVersion(user.id);
    expect(row?.password_hash).toBe(user.password_hash);
    expect(row?.password_version).toBe(2);
  });

  it('USERSREPO-023b: getPasswordHashAndVersion returns null for a missing user', async () => {
    expect(await users.getPasswordHashAndVersion(999999)).toBeNull();
  });

  it('USERSREPO-024: setPassword (AU16/AU43) writes hash+version, clears must_change_password, stamps updated_at', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET must_change_password = 1 WHERE id = ?').run(user.id);
    await users.setPassword(user.id, 'new-hash', 5);
    const row = testDb.prepare('SELECT password_hash, password_version, must_change_password, updated_at FROM users WHERE id = ?').get(user.id) as {
      password_hash: string; password_version: number; must_change_password: number; updated_at: string;
    };
    expect(row.password_hash).toBe('new-hash');
    expect(row.password_version).toBe(5);
    expect(row.must_change_password).toBe(0);
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('USERSREPO-025: countAdmins (AU19/O7) counts only role=admin', async () => {
    createUser(testDb);
    createAdmin(testDb);
    createAdmin(testDb);
    expect(await users.countAdmins()).toBe(2);
  });

  it('USERSREPO-026: getRole (AU20/AU22) reads the role column', async () => {
    const { user } = createAdmin(testDb);
    expect(await users.getRole(user.id)).toBe('admin');
    expect(await users.getRole(999999)).toBeNull();
  });

  describe('getMfaEnabled (AU23/AU27/MP2) — distinguishes "no row" from "row present, mfa_enabled unset"', () => {
    it('USERSREPO-027: returns the row wrapper when the user exists', async () => {
      const { user } = createUser(testDb);
      expect(await users.getMfaEnabled(user.id)).toEqual({ mfa_enabled: 0 });
      testDb.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(user.id);
      expect(await users.getMfaEnabled(user.id)).toEqual({ mfa_enabled: 1 });
    });

    it('USERSREPO-028: returns null (not a row with a null field) when the user does not exist', async () => {
      expect(await users.getMfaEnabled(999999)).toBeNull();
    });

    it('USERSREPO-028b: mfa_enabled NULL on the row comes back null on the wrapper (coverage: rule 16)', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET mfa_enabled = NULL WHERE id = ?').run(user.id);
      expect(await users.getMfaEnabled(user.id)).toEqual({ mfa_enabled: null });
    });
  });

  it('USERSREPO-029: enableMfa (AU28) sets mfa_enabled=1, writes the already-encrypted secret and codes, stamps updated_at', async () => {
    const { user } = createUser(testDb);
    await users.enableMfa(user.id, 'encrypted-secret', '["hash1","hash2"]');
    const row = testDb.prepare('SELECT mfa_enabled, mfa_secret, mfa_backup_codes, updated_at FROM users WHERE id = ?').get(user.id) as {
      mfa_enabled: number; mfa_secret: string; mfa_backup_codes: string; updated_at: string;
    };
    expect(row.mfa_enabled).toBe(1);
    expect(row.mfa_secret).toBe('encrypted-secret');
    expect(row.mfa_backup_codes).toBe('["hash1","hash2"]');
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  describe('findById (AU30/AU32/PK4/PK10/O15) — full row, PK-only findOne', () => {
    it('USERSREPO-030: reads every scalar column', async () => {
      const { user } = createUser(testDb);
      const row = await users.findById(user.id);
      expect(row?.id).toBe(user.id);
      expect(row?.username).toBe(user.username);
      expect(row?.password_hash).toBe(user.password_hash);
      expect(await users.findById(999999)).toBeNull();
    });

    it('USERSREPO-031: sees a raw UPDATE on the same id in the same request (disableIdentityMap regression)', async () => {
      const { user } = createUser(testDb, { username: 'before' });
      await users.findById(user.id); // populate the identity map
      testDb.prepare('UPDATE users SET username = ? WHERE id = ?').run('after', user.id);
      const { value, queries } = await withQueryCount(() => users.findById(user.id));
      expect(value?.username).toBe('after');
      expect(queries).toBe(1);
    });
  });

  it('USERSREPO-032: disableMfa (AU31) clears mfa_enabled/secret/codes, stamps updated_at', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ?, mfa_backup_codes = ? WHERE id = ?').run('s', 'c', user.id);
    await users.disableMfa(user.id);
    const row = testDb.prepare('SELECT mfa_enabled, mfa_secret, mfa_backup_codes, updated_at FROM users WHERE id = ?').get(user.id) as {
      mfa_enabled: number; mfa_secret: string | null; mfa_backup_codes: string | null; updated_at: string;
    };
    expect(row.mfa_enabled).toBe(0);
    expect(row.mfa_secret).toBeNull();
    expect(row.mfa_backup_codes).toBeNull();
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  describe('setBackupCodesAndTouch (AU33) vs setBackupCodes (AU44) — one stamps updated_at, the other does not', () => {
    it('USERSREPO-033: setBackupCodesAndTouch writes codes and stamps updated_at', async () => {
      const { user } = createUser(testDb);
      testDb.prepare("UPDATE users SET updated_at = '2020-01-01 00:00:00' WHERE id = ?").run(user.id);
      await users.setBackupCodesAndTouch(user.id, '["a"]');
      const row = testDb.prepare('SELECT mfa_backup_codes, updated_at FROM users WHERE id = ?').get(user.id) as { mfa_backup_codes: string; updated_at: string };
      expect(row.mfa_backup_codes).toBe('["a"]');
      expect(row.updated_at).not.toBe('2020-01-01 00:00:00');
    });

    it('USERSREPO-034: setBackupCodes writes codes WITHOUT touching updated_at', async () => {
      const { user } = createUser(testDb);
      testDb.prepare("UPDATE users SET updated_at = '2020-01-01 00:00:00' WHERE id = ?").run(user.id);
      await users.setBackupCodes(user.id, '["b"]');
      const row = testDb.prepare('SELECT mfa_backup_codes, updated_at FROM users WHERE id = ?').get(user.id) as { mfa_backup_codes: string; updated_at: string };
      expect(row.mfa_backup_codes).toBe('["b"]');
      expect(row.updated_at).toBe('2020-01-01 00:00:00');
    });
  });

  describe('findForPasswordReset (AU36) — case-SENSITIVE email, unlike every other email lookup here', () => {
    it('USERSREPO-035: matches the exact case only', async () => {
      const { user } = createUser(testDb, { email: 'Exact@Example.com' });
      const row = await users.findForPasswordReset('Exact@Example.com');
      expect(row?.id).toBe(user.id);
      expect(await users.findForPasswordReset('exact@example.com')).toBeNull(); // no LOWER() in the legacy statement
    });

    it('USERSREPO-036: excludes a guest', async () => {
      const { user } = createUser(testDb, { email: 'guest3@example.com' });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);
      expect(await users.findForPasswordReset('guest3@example.com')).toBeNull();
    });

    it('USERSREPO-036b: oidc_sub NULL on the row comes back null, not undefined (coverage: rule 16)', async () => {
      const { user } = createUser(testDb, { email: 'reset-null@example.com' });
      testDb.prepare('UPDATE users SET oidc_sub = NULL WHERE id = ?').run(user.id);
      const row = await users.findForPasswordReset('reset-null@example.com');
      expect(row?.oidc_sub).toBeNull();
    });
  });

  it('USERSREPO-037: findResetTarget (AU40) reads the reset-branch projection', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ?, mfa_backup_codes = ?, password_version = 4 WHERE id = ?').run('s', 'c', user.id);
    const row = await users.findResetTarget(user.id);
    expect(row).toEqual({ id: user.id, email: user.email, mfa_enabled: 1, mfa_secret: 's', mfa_backup_codes: 'c', password_version: 4 });
  });

  it('USERSREPO-037b: findResetTarget — mfa_enabled/mfa_secret/mfa_backup_codes NULL come back null, not undefined (coverage: rule 16)', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = NULL, mfa_secret = NULL, mfa_backup_codes = NULL WHERE id = ?').run(user.id);
    const row = await users.findResetTarget(user.id);
    expect(row?.mfa_enabled).toBeNull();
    expect(row?.mfa_secret).toBeNull();
    expect(row?.mfa_backup_codes).toBeNull();
  });

  it('USERSREPO-037c: findResetTarget returns null for a missing user', async () => {
    expect(await users.findResetTarget(999999)).toBeNull();
  });

  it('USERSREPO-038: getPasswordHash (PK15) reads password_hash', async () => {
    const { user } = createUser(testDb);
    expect(await users.getPasswordHash(user.id)).toBe(user.password_hash);
    expect(await users.getPasswordHash(999999)).toBeNull();
  });

  it('USERSREPO-039: findIdAndEmail (PK17) reads id+email', async () => {
    const { user } = createUser(testDb);
    expect(await users.findIdAndEmail(user.id)).toEqual({ id: user.id, email: user.email });
  });

  describe('findByOidcIdentity (O3)', () => {
    it('USERSREPO-040: matches on the (sub, issuer) pair', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ? WHERE id = ?').run('sub-1', 'https://idp.example.com', user.id);
      const row = await users.findByOidcIdentity('sub-1', 'https://idp.example.com');
      expect(row?.id).toBe(user.id);
      expect(await users.findByOidcIdentity('sub-1', 'https://other-idp.example.com')).toBeNull();
    });
  });

  it('USERSREPO-041: linkOidcIdentity (O5/O6) writes sub+issuer WITHOUT touching updated_at', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE users SET updated_at = '2020-01-01 00:00:00' WHERE id = ?").run(user.id);
    await users.linkOidcIdentity(user.id, 'sub-2', 'https://idp2.example.com');
    const row = testDb.prepare('SELECT oidc_sub, oidc_issuer, updated_at FROM users WHERE id = ?').get(user.id) as {
      oidc_sub: string; oidc_issuer: string; updated_at: string;
    };
    expect(row.oidc_sub).toBe('sub-2');
    expect(row.oidc_issuer).toBe('https://idp2.example.com');
    expect(row.updated_at).toBe('2020-01-01 00:00:00');
  });

  it('USERSREPO-042: setRole (O8) writes role WITHOUT touching updated_at', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE users SET updated_at = '2020-01-01 00:00:00' WHERE id = ?").run(user.id);
    await users.setRole(user.id, 'admin');
    const row = testDb.prepare('SELECT role, updated_at FROM users WHERE id = ?').get(user.id) as { role: string; updated_at: string };
    expect(row.role).toBe('admin');
    expect(row.updated_at).toBe('2020-01-01 00:00:00');
  });

  it('USERSREPO-043: setAvatarRaw (O9) writes avatar WITHOUT touching updated_at, unlike setAvatar', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE users SET updated_at = '2020-01-01 00:00:00' WHERE id = ?").run(user.id);
    await users.setAvatarRaw(user.id, 'https://idp.example.com/pic.png');
    const row = testDb.prepare('SELECT avatar, updated_at FROM users WHERE id = ?').get(user.id) as { avatar: string; updated_at: string };
    expect(row.avatar).toBe('https://idp.example.com/pic.png');
    expect(row.updated_at).toBe('2020-01-01 00:00:00');
  });

  describe('findIdByUsernameCI (UP5) vs findIdByUsernameCIAny (O12) — different WHERE, two methods', () => {
    it('USERSREPO-044: findIdByUsernameCI excludes the given id and any guest', async () => {
      const { user: a } = createUser(testDb, { username: 'DupeName' });
      const { user: b } = createUser(testDb, { username: 'other' });
      expect(await users.findIdByUsernameCI('dupename', b.id)).toBe(a.id);
      expect(await users.findIdByUsernameCI('dupename', a.id)).toBeNull(); // excludes self
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(a.id);
      expect(await users.findIdByUsernameCI('dupename', b.id)).toBeNull(); // guest excluded
    });

    it('USERSREPO-045: findIdByUsernameCIAny has no exclude and no guest filter', async () => {
      const { user } = createUser(testDb, { username: 'AnyName' });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);
      expect(await users.findIdByUsernameCIAny('anyname')).toBe(user.id); // a guest still matches here
    });

    // Program rule 18 / Plan 3b Task 7 review H1. Mutation-proved by
    // reverting each method's `lowerParam(platform, username)` bind back to
    // `username.toLowerCase()` — the exact-spelling assertion then fails.
    it('USERSREPO-044b: findIdByUsernameCI matches the exact stored non-ASCII spelling; a JS-lowered spelling does not match', async () => {
      const { user: a } = createUser(testDb, { username: 'ÄNNA' });
      const { user: b } = createUser(testDb, { username: 'other2' });
      expect(await users.findIdByUsernameCI('ÄNNA', b.id)).toBe(a.id);
      expect(await users.findIdByUsernameCI('änna', b.id)).toBeNull();
    });

    it('USERSREPO-045b: findIdByUsernameCIAny matches the exact stored non-ASCII spelling; a JS-lowered spelling does not match', async () => {
      const { user } = createUser(testDb, { username: 'ÄNNA2' });
      expect(await users.findIdByUsernameCIAny('ÄNNA2')).toBe(user.id);
      expect(await users.findIdByUsernameCIAny('änna2')).toBeNull();
    });
  });

  it('USERSREPO-046: getApiKeyColumns (UP1) reads role + the four key columns', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ?, openweather_api_key = ?, unsplash_api_key = ?, amap_api_key = ? WHERE id = ?')
      .run('m', 'o', 'u', 'a', user.id);
    expect(await users.getApiKeyColumns(user.id)).toEqual({ role: 'admin', maps_api_key: 'm', openweather_api_key: 'o', unsplash_api_key: 'u', amap_api_key: 'a' });
  });

  it('USERSREPO-046b: getApiKeyColumns returns null for a missing user; NULL columns come back null (coverage: rule 16)', async () => {
    expect(await users.getApiKeyColumns(999999)).toBeNull();
    const { user } = createUser(testDb);
    // maps_api_key/openweather_api_key/unsplash_api_key/amap_api_key are NULL by default on a fresh user.
    expect(await users.getApiKeyColumns(user.id)).toEqual({ role: 'user', maps_api_key: null, openweather_api_key: null, unsplash_api_key: null, amap_api_key: null });
  });

  it('USERSREPO-047: updateMapsKey (UP2) writes maps_api_key + updated_at', async () => {
    const { user } = createUser(testDb);
    await users.updateMapsKey(user.id, 'encrypted');
    const row = testDb.prepare('SELECT maps_api_key, updated_at FROM users WHERE id = ?').get(user.id) as { maps_api_key: string; updated_at: string };
    expect(row.maps_api_key).toBe('encrypted');
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('USERSREPO-048: updateApiKeys (UP3) writes all four columns + updated_at in one statement', async () => {
    const { user } = createUser(testDb);
    await users.updateApiKeys(user.id, { maps_api_key: 'm2', openweather_api_key: 'o2', unsplash_api_key: 'u2', amap_api_key: null });
    const row = testDb.prepare('SELECT maps_api_key, openweather_api_key, unsplash_api_key, amap_api_key, updated_at FROM users WHERE id = ?').get(user.id) as Record<string, unknown>;
    expect(row).toMatchObject({ maps_api_key: 'm2', openweather_api_key: 'o2', unsplash_api_key: 'u2', amap_api_key: null });
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('USERSREPO-049: findProfileWithKeys (UP4/UP8) reads the profile-with-keys projection', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ?, mfa_enabled = 1 WHERE id = ?').run('m', user.id);
    const row = await users.findProfileWithKeys(user.id);
    expect(row).toMatchObject({ id: user.id, username: user.username, email: user.email, role: 'user', maps_api_key: 'm', mfa_enabled: 1 });
  });

  it('USERSREPO-049b: findProfileWithKeys returns null for a missing user; every nullable column comes back null (coverage: rule 16)', async () => {
    expect(await users.findProfileWithKeys(999999)).toBeNull();
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = NULL WHERE id = ?').run(user.id);
    const row = await users.findProfileWithKeys(user.id);
    expect(row).toMatchObject({
      maps_api_key: null, openweather_api_key: null, unsplash_api_key: null, amap_api_key: null, avatar: null, mfa_enabled: null,
    });
  });

  it('USERSREPO-050: findIdByEmailCI (UP6) matches case-insensitively, excludes self and guests', async () => {
    const { user: a } = createUser(testDb, { email: 'Dup@Example.com' });
    const { user: b } = createUser(testDb, { email: 'other@example.com' });
    expect(await users.findIdByEmailCI('dup@example.com', b.id)).toBe(a.id);
    expect(await users.findIdByEmailCI('dup@example.com', a.id)).toBeNull();
  });

  // Program rule 18 / Plan 3b Task 7 review H1 (UP6 profile-rename collision
  // case). Mutation-proved by reverting `lowerParam(platform, email)` back
  // to `email.toLowerCase()` — the exact-spelling assertion then fails.
  it('USERSREPO-050b: findIdByEmailCI matches the exact stored non-ASCII spelling; a JS-lowered spelling does not match', async () => {
    const { user: a } = createUser(testDb, { email: 'JOSÉ2@x.com' });
    const { user: b } = createUser(testDb, { email: 'other2@example.com' });
    expect(await users.findIdByEmailCI('JOSÉ2@x.com', b.id)).toBe(a.id);
    expect(await users.findIdByEmailCI('josé2@x.com', b.id)).toBeNull();
  });

  it('USERSREPO-051: patchProfile (UP7) writes only the given bounded columns + updated_at, in one statement', async () => {
    const { user } = createUser(testDb, { username: 'patchme', email: 'patchme@example.com' });
    await users.patchProfile(user.id, { username: 'patched', maps_api_key: 'newkey' });
    const row = testDb.prepare('SELECT username, email, maps_api_key, updated_at FROM users WHERE id = ?').get(user.id) as Record<string, unknown>;
    expect(row.username).toBe('patched');
    expect(row.email).toBe('patchme@example.com'); // untouched — not in `changes`
    expect(row.maps_api_key).toBe('newkey');
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  describe('getAvatar (UP9/UP12) / setAvatar (UP10/UP13)', () => {
    it('USERSREPO-052: getAvatar reads the avatar column', async () => {
      const { user } = createUser(testDb);
      expect(await users.getAvatar(user.id)).toBeNull();
      testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('pic.png', user.id);
      expect(await users.getAvatar(user.id)).toBe('pic.png');
    });

    it('USERSREPO-053: setAvatar writes avatar + updated_at (both a filename and NULL for delete)', async () => {
      const { user } = createUser(testDb);
      await users.setAvatar(user.id, 'new.png');
      let row = testDb.prepare('SELECT avatar, updated_at FROM users WHERE id = ?').get(user.id) as { avatar: string; updated_at: string };
      expect(row.avatar).toBe('new.png');
      expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}/);

      testDb.prepare("UPDATE users SET updated_at = '2020-01-01 00:00:00' WHERE id = ?").run(user.id);
      await users.setAvatar(user.id, null);
      row = testDb.prepare('SELECT avatar, updated_at FROM users WHERE id = ?').get(user.id) as { avatar: string | null; updated_at: string };
      expect(row.avatar).toBeNull();
      expect(row.updated_at).not.toBe('2020-01-01 00:00:00');
    });
  });

  it('USERSREPO-054: findProfileBasic (UP11) reads id/username/email/role/avatar', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('a.png', user.id);
    expect(await users.findProfileBasic(user.id)).toEqual({ id: user.id, username: user.username, email: user.email, role: 'user', avatar: 'a.png' });
  });

  it('USERSREPO-054b: findProfileBasic returns null for a missing user; NULL avatar comes back null (coverage: rule 16)', async () => {
    expect(await users.findProfileBasic(999999)).toBeNull();
    const { user } = createUser(testDb);
    expect((await users.findProfileBasic(user.id))?.avatar).toBeNull();
  });

  describe('listOthersNonGuest (UP14)', () => {
    it('USERSREPO-055: excludes the given id and every guest, ordered by username', async () => {
      const { user: me } = createUser(testDb, { username: 'me' });
      const { user: bravo } = createUser(testDb, { username: 'bravo' });
      const { user: alpha } = createUser(testDb, { username: 'alpha' });
      const { user: guest } = createUser(testDb, { username: 'zzz-guest' });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
      const rows = await users.listOthersNonGuest(me.id);
      expect(rows.map((r) => r.id)).toEqual([alpha.id, bravo.id]);
    });
  });

  it('USERSREPO-056: getRoleAndWeatherKey (UP15) reads role + openweather_api_key', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET openweather_api_key = ? WHERE id = ?').run('w', user.id);
    expect(await users.getRoleAndWeatherKey(user.id)).toEqual({ role: 'admin', openweather_api_key: 'w' });
  });

  it('USERSREPO-056b: getRoleAndWeatherKey returns null for a missing user; NULL key comes back null (coverage: rule 16)', async () => {
    expect(await users.getRoleAndWeatherKey(999999)).toBeNull();
    const { user } = createUser(testDb);
    expect(await users.getRoleAndWeatherKey(user.id)).toEqual({ role: 'user', openweather_api_key: null });
  });

  it('USERSREPO-058: deleteById (UC11) deletes the row', async () => {
    const { user } = createUser(testDb);
    await users.deleteById(user.id);
    expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(user.id)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 6 — TripMembersService's guest lifecycle (TM3/TM4/TM10/TM16/
// TM19/TM20). Appended after the existing `describe('UsersRepository', ...)`
// block per this task's file-ownership rule (additive methods only).
// ---------------------------------------------------------------------------

describe('UsersRepository — TripMembersService (Plan 3c Task 6)', () => {
  describe('findOwnerSummary (TM3)', () => {
    it('USERSREPO-059: prefers display_name over username, matching the legacy COALESCE', async () => {
      const { user } = createUser(testDb, { username: 'raw-handle' });
      testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Displayed Name', user.id);
      expect(await users.findOwnerSummary(user.id)).toEqual({
        id: user.id, username: 'Displayed Name', email: user.email, avatar: null,
      });
    });

    it('USERSREPO-060: falls back to username when display_name is NULL; a missing user id is null, not a throw', async () => {
      const { user } = createUser(testDb, { username: 'bare-handle' });
      expect(await users.findOwnerSummary(user.id)).toEqual({
        id: user.id, username: 'bare-handle', email: user.email, avatar: null,
      });
      expect(await users.findOwnerSummary(999999)).toBeNull();
    });

    it('USERSREPO-061: a NULL avatar comes back null, not undefined (rule 16)', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('me.png', user.id);
      expect((await users.findOwnerSummary(user.id))?.avatar).toBe('me.png');
    });

    // Task 9 fix wave (B-M3): relabelled. `findOwnerSummary` is a
    // `qb().execute('get', false)` projection, which never hydrates an
    // entity into the identity map by construction, and the base default
    // leaves the identity map disabled for every read anyway — there is no
    // live identity-map entry here to bypass. This proves a DB round-trip,
    // not an identity-map bypass. The FIRST, wider setup read still passes
    // `{ disableIdentityMap: false }` explicitly per the program rule.
    it('USERSREPO-062 (fresh after a raw UPDATE, not D-shape): a display_name written after an unrelated identity-map read is visible in the FIRST wider projection', async () => {
      const { user } = createUser(testDb, { username: 'fresh-owner' });
      await t.repo(Users).find({}, { disableIdentityMap: false }); // populate the identity map with an unrelated read
      testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Fresh Name', user.id);
      expect(await users.findOwnerSummary(user.id)).toEqual({
        id: user.id, username: 'Fresh Name', email: user.email, avatar: null,
      });
    });
  });

  describe('findInvitableByEmailOrUsername (TM4)', () => {
    // Task 9 fix wave (B-L7): the legacy statement TM4's docstring quotes,
    // run raw on the same fixture — `toEqual(legacy)` on the FULL key set,
    // so a renamed or dropped column would fail this, not just the
    // literal-object assertion below (rule 19; #1362 is security-relevant,
    // so this is one of the L7 reads the fix wave covers).
    const legacyInvitable = (identifier: string) =>
      testDb.prepare(
        'SELECT id, username, email, avatar FROM users WHERE (email = ? OR username = ?) AND COALESCE(is_guest, 0) = 0',
      ).get(identifier, identifier) ?? null;

    it('USERSREPO-063: matches on email OR username, case-SENSITIVE (unlike findByEmailCI/findIdByEmailCI above)', async () => {
      const { user: byEmail } = createUser(testDb, { email: 'invitee@example.test', username: 'invitee-handle' });
      expect(await users.findInvitableByEmailOrUsername('invitee@example.test')).toEqual({
        id: byEmail.id, username: 'invitee-handle', email: 'invitee@example.test', avatar: null,
      });
      expect(await users.findInvitableByEmailOrUsername('invitee@example.test')).toEqual(legacyInvitable('invitee@example.test'));
      expect(await users.findInvitableByEmailOrUsername('invitee-handle')).toEqual({
        id: byEmail.id, username: 'invitee-handle', email: 'invitee@example.test', avatar: null,
      });
      expect(await users.findInvitableByEmailOrUsername('invitee-handle')).toEqual(legacyInvitable('invitee-handle'));
      // Case-sensitive: an uppercased email must NOT match (program rule 18
      // only applies where the legacy statement itself folds case — TM4's does not).
      expect(await users.findInvitableByEmailOrUsername('INVITEE@EXAMPLE.TEST')).toBeNull();
      expect(legacyInvitable('INVITEE@EXAMPLE.TEST')).toBeNull();
    });

    it('USERSREPO-064: excludes guests — a trip-scoped guest can never be re-invited through the box', async () => {
      const { user: guest } = createUser(testDb, { email: 'guest-look@example.test', username: 'guest-handle' });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
      expect(await users.findInvitableByEmailOrUsername('guest-look@example.test')).toBeNull();
      expect(await users.findInvitableByEmailOrUsername('guest-handle')).toBeNull();
    });

    it('USERSREPO-065: no match returns null, not a throw', async () => {
      expect(await users.findInvitableByEmailOrUsername('nobody@example.test')).toBeNull();
    });

    // Task 9 fix wave (B-M3): relabelled — this comment previously claimed
    // rule 20's PK-only D-shape guarantee "applies for real", but
    // `findInvitableByEmailOrUsername` filters `findOne` on `{$or:
    // [{email},{username}], is_guest}`, not the primary key (rule 20 draws
    // that PK-only line precisely because a non-PK filter always re-runs
    // the WHERE clause against the live table, so it can never serve a
    // stale identity-map snapshot the way a PK lookup can). What this DOES
    // prove, honestly: a row that flips `is_guest` after an unrelated wider
    // identity-map read is fresh here — the guest-exclusion guard (#1362)
    // sees the current value, not a cached one.
    it('USERSREPO-072 (fresh after a raw UPDATE, not D-shape): an is_guest flip written after an unrelated identity-map read is visible in the FIRST wider projection', async () => {
      const { user } = createUser(testDb, { email: 'flip@example.test', username: 'flip-handle' });
      await t.repo(Users).find({}, { disableIdentityMap: false }); // populate the identity map with an unrelated read
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);
      expect(await users.findInvitableByEmailOrUsername('flip@example.test')).toBeNull();
    });
  });

  describe('findIdEmailGuest (TM10)', () => {
    it('USERSREPO-066: reads id/email/is_guest; a missing user is null', async () => {
      const { user } = createUser(testDb, { email: 'target@example.test' });
      expect(await users.findIdEmailGuest(user.id)).toEqual({ id: user.id, email: 'target@example.test', is_guest: 0 });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);
      expect(await users.findIdEmailGuest(user.id)).toEqual({ id: user.id, email: 'target@example.test', is_guest: 1 });
      expect(await users.findIdEmailGuest(999999)).toBeNull();
    });

    // Task 9 fix wave (B-M3): `findIdEmailGuest` is the third PK-only
    // `findOne` this plan added (`{ id }` alone, nothing else) — a genuine
    // rule 20/21 D-shape case, the TM10 guest gate. USERSREPO-066 above
    // already catches the M7 identity-map-default mutation (it re-reads
    // after a raw UPDATE without an intervening wider read), but the review
    // asked for the explicit labelled case anyway.
    it('USERSREPO-073 (D-shape): an is_guest flip written after an unrelated identity-map read is visible in the next findIdEmailGuest call, in one query (disableIdentityMap regression)', async () => {
      const { user } = createUser(testDb, { email: 'guest-gate@example.test' });
      // rule 20: the FIRST, wider setup read passes `disableIdentityMap:
      // false` explicitly and carries the column the later write targets
      // (`is_guest`) — a PK-only `findOne` on `id` alone, the exact shape
      // `findIdEmailGuest` itself uses.
      await t.repo(Users).findOne({ id: user.id }, { disableIdentityMap: false });
      testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(user.id);

      const { value, queries } = await withQueryCount(() => users.findIdEmailGuest(user.id));
      expect(value).toEqual({ id: user.id, email: 'guest-gate@example.test', is_guest: 1 });
      expect(queries).toBe(1);
    });
  });

  describe('insertGuest (TM16, security-sensitive)', () => {
    it('USERSREPO-067: writes the fixed literal columns and the given display_name; returns the generated id', async () => {
      const id = await users.insertGuest({ username: 'guest-abc', email: 'guest-abc@guests.invalid', display_name: 'Ida' });
      const row = testDb.prepare('SELECT username, email, password_hash, role, is_guest, display_name FROM users WHERE id = ?').get(id);
      expect(row).toEqual({
        username: 'guest-abc', email: 'guest-abc@guests.invalid', password_hash: '', role: 'user', is_guest: 1, display_name: 'Ida',
      });
    });
  });

  describe('renameGuest / deleteGuest (TM19/TM20, security-sensitive, belt-and-braces is_guest = 1)', () => {
    it('USERSREPO-068: renameGuest updates display_name + updated_at only for an is_guest = 1 row', async () => {
      const id = await users.insertGuest({ username: 'guest-rn', email: 'guest-rn@guests.invalid', display_name: 'Old' });
      await users.renameGuest(id, 'New Name');
      const row = testDb.prepare('SELECT display_name, updated_at FROM users WHERE id = ?').get(id) as { display_name: string; updated_at: string | null };
      expect(row.display_name).toBe('New Name');
      expect(row.updated_at).not.toBeNull();
    });

    it('USERSREPO-069: renameGuest is a no-op on a real (non-guest) user id — the belt-and-braces predicate, pinned', async () => {
      const { user } = createUser(testDb, { username: 'real-user' });
      testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Untouched', user.id);
      await users.renameGuest(user.id, 'Attempted Rename');
      expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(user.id) as { display_name: string }).display_name).toBe('Untouched');
    });

    it('USERSREPO-070: deleteGuest removes only an is_guest = 1 row', async () => {
      const id = await users.insertGuest({ username: 'guest-del', email: 'guest-del@guests.invalid', display_name: 'Gone' });
      await users.deleteGuest(id);
      expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(id)).toBeUndefined();
    });

    it('USERSREPO-071: deleteGuest is a no-op on a real (non-guest) user id — the belt-and-braces predicate, pinned', async () => {
      const { user } = createUser(testDb, { username: 'real-user-2' });
      await users.deleteGuest(user.id);
      expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(user.id)).toBeDefined();
    });
  });
});

// ── Plan 3d Task 5 (FeedsService) — additive: FD5-FD8/FD10, the all-trips ICS
// feed token's `users` half. Each `toEqual` pins full parity against the
// legacy statement run raw on the same row, per the task's own ruling.
describe('UsersRepository — feed tokens (Plan 3d Task 5, FD5-FD8/FD10)', () => {
  it('USERSREPO-072: getFeedToken reads the stored token, matching SELECT feed_token FROM users WHERE id = ?', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run('tok-abc', user.id);
    const legacy = testDb.prepare('SELECT feed_token FROM users WHERE id = ?').get(user.id) as { feed_token: string | null };
    expect(await users.getFeedToken(user.id)).toBe(legacy.feed_token);
    expect(await users.getFeedToken(user.id)).toBe('tok-abc');
  });

  it('USERSREPO-073: getFeedToken returns null both when the column is NULL and when the user does not exist', async () => {
    const { user } = createUser(testDb); // feed_token NULL by default
    expect(await users.getFeedToken(user.id)).toBeNull();
    expect(await users.getFeedToken(999999)).toBeNull();
  });

  it('USERSREPO-074: setFeedToken (FD6/FD7) writes a fresh token verbatim', async () => {
    const { user } = createUser(testDb);
    await users.setFeedToken(user.id, 'tok-fresh');
    expect((testDb.prepare('SELECT feed_token FROM users WHERE id = ?').get(user.id) as { feed_token: string }).feed_token).toBe('tok-fresh');
  });

  it('USERSREPO-075: setFeedToken (FD8) clears the column to NULL when the token is null', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run('tok-old', user.id);
    await users.setFeedToken(user.id, null);
    expect((testDb.prepare('SELECT feed_token FROM users WHERE id = ?').get(user.id) as { feed_token: string | null }).feed_token).toBeNull();
  });

  it('USERSREPO-076: findIdAndUsernameByFeedToken (FD10) — the anonymous credential lookup, exact projection', async () => {
    const { user } = createUser(testDb, { username: 'feed-holder' });
    testDb.prepare('UPDATE users SET feed_token = ? WHERE id = ?').run('tok-holder', user.id);
    const legacy = testDb.prepare('SELECT id, username FROM users WHERE feed_token = ?').get('tok-holder');
    expect(await users.findIdAndUsernameByFeedToken('tok-holder')).toEqual(legacy);
    expect(await users.findIdAndUsernameByFeedToken('tok-holder')).toEqual({ id: user.id, username: 'feed-holder' });
  });

  it('USERSREPO-077: findIdAndUsernameByFeedToken returns undefined for an unknown token — a NULL column never matches (the partial UNIQUE index semantics)', async () => {
    createUser(testDb); // feed_token NULL
    expect(await users.findIdAndUsernameByFeedToken('does-not-exist')).toBeUndefined();
    // Belt-and-braces: an empty-string lookup must not accidentally coerce to
    // an `IS NULL` match against the many NULL-token rows in the DB.
    expect(await users.findIdAndUsernameByFeedToken('')).toBeUndefined();
  });

  it('M1: getImmichAutoUpload / getSynologyUsername / findUsernameEmail return their column, and the missing-user branch, honestly', async () => {
    const { user } = createUser(testDb, { username: 'imm-user', email: 'imm@example.com' });
    testDb.prepare('UPDATE users SET immich_auto_upload = 1, synology_username = ? WHERE id = ?').run('syno-login', user.id);

    expect(await users.getImmichAutoUpload(user.id)).toBe(1);
    expect(await users.getImmichAutoUpload(999999)).toBeNull();

    expect(await users.getSynologyUsername(user.id)).toBe('syno-login');
    expect(await users.getSynologyUsername(999999)).toBeNull();

    expect(await users.findUsernameEmail(user.id)).toEqual({ username: 'imm-user', email: 'imm@example.com' });
    expect(await users.findUsernameEmail(999999)).toBeUndefined();
  });

  it('M1b: getImmichCredentials / getImmichConnectionPrefs carry immich_allow_insecure_tls (#2475), and the missing-user branch', async () => {
    const { user } = createUser(testDb);
    testDb
      .prepare('UPDATE users SET immich_url = ?, immich_api_key = ?, immich_auto_upload = 1, immich_allow_insecure_tls = 1 WHERE id = ?')
      .run('https://immich.test', 'key-1', user.id);

    expect(await users.getImmichCredentials(user.id)).toEqual({
      immich_url: 'https://immich.test',
      immich_api_key: 'key-1',
      immich_allow_insecure_tls: 1,
    });
    expect(await users.getImmichCredentials(999999)).toBeNull();

    expect(await users.getImmichConnectionPrefs(user.id)).toEqual({ immich_auto_upload: 1, immich_allow_insecure_tls: 1 });
    expect(await users.getImmichConnectionPrefs(999999)).toBeNull();
  });
});

// Plan 3i Task 4 fix wave (should-land 5): admin's AD1-AD17 read methods
// (listForAdmin, findAdminSummary, findIdEmailMfaEnabled, and the four
// exact/excluding uniqueness lookups) shipped in Task 1 (862799062) with no
// repository-level parity test of their own — only the live HTTP surface was
// checked. One seeded world (an admin, a plain user and a guest, so the
// `is_guest` exclusion has something to exclude), one full-key `toEqual`
// test per read method against the exact legacy projection named in each
// method's own docstring.
describe('UsersRepository — admin (AD1-AD17) read methods, full-key parity', () => {
  let admin: TestUser;
  let plain: TestUser;
  let guest: TestUser;

  beforeEach(() => {
    admin = createAdmin(testDb, { username: 'ad-admin', email: 'ad-admin@example.com' }).user;
    plain = createUser(testDb, { username: 'ad-plain', email: 'ad-plain@example.com' }).user;
    const { user: guestRow } = createUser(testDb, { username: 'ad-guest', email: 'ad-guest@example.com' });
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guestRow.id);
    guest = { ...guestRow, } as TestUser;
  });

  it('USERSREPO-078 (AD1): listForAdmin matches SELECT id, username, email, role, avatar, created_at, updated_at, last_login FROM users WHERE COALESCE(is_guest, 0) = 0 ORDER BY created_at DESC, and excludes the guest row', async () => {
    const legacy = testDb
      .prepare('SELECT id, username, email, role, avatar, created_at, updated_at, last_login FROM users WHERE COALESCE(is_guest, 0) = 0 ORDER BY created_at DESC')
      .all();
    const rows = await users.listForAdmin();
    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id)).not.toContain(guest.id);
    expect(rows.map((r) => r.id)).toEqual(expect.arrayContaining([admin.id, plain.id]));
  });

  it('USERSREPO-079 (AD2/AD3): findIdByUsernameExact/findIdByEmailExact are case-sensitive and exclude guests', async () => {
    expect(await users.findIdByUsernameExact('ad-admin')).toBe(admin.id);
    expect(await users.findIdByUsernameExact('AD-ADMIN')).toBeNull(); // case-sensitive, unlike findIdByUsernameCIAny
    expect(await users.findIdByUsernameExact('ad-guest')).toBeNull(); // guest excluded
    expect(await users.findIdByEmailExact('ad-plain@example.com')).toBe(plain.id);
    expect(await users.findIdByEmailExact('AD-PLAIN@EXAMPLE.COM')).toBeNull();
    expect(await users.findIdByEmailExact('ad-guest@example.com')).toBeNull();
  });

  it('USERSREPO-080 (AD4/AD5): insertAdminCreatedUser stores exactly the four named columns, every other column left to the entity default, then findAdminSummary re-selects it', async () => {
    const id = await users.insertAdminCreatedUser({ username: 'ad-new', email: 'ad-new@example.com', password_hash: 'hash-x', role: 'user' });
    const legacyRow = testDb.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    expect(legacyRow.username).toBe('ad-new');
    expect(legacyRow.email).toBe('ad-new@example.com');
    expect(legacyRow.password_hash).toBe('hash-x');
    expect(legacyRow.role).toBe('user');
    // Every column the legacy INSERT omitted falls back to the schema DEFAULT
    // — the AUDIT for the 3i review's own "INSERT entity defaults" pass.
    expect(legacyRow.mfa_enabled).toBe(0);
    expect(legacyRow.first_seen_version).toBe('0.0.0');
    expect(legacyRow.login_count).toBe(0);
    expect(legacyRow.is_guest).toBe(0);

    const legacySummary = testDb.prepare('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?').get(id);
    expect(await users.findAdminSummary(id)).toEqual(legacySummary);
  });

  it('USERSREPO-081 (AD14): findAdminSummary matches the byte-identical re-select text on an EXISTING (updated) row too', async () => {
    testDb.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run('ad-plain-renamed', 'admin', plain.id);
    const legacy = testDb.prepare('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?').get(plain.id);
    expect(await users.findAdminSummary(plain.id)).toEqual(legacy);
    expect(await users.findAdminSummary(999999)).toBeNull();
  });

  it('USERSREPO-082 (AD7/AD8): findIdByUsernameExactExcluding/findIdByEmailExactExcluding exclude the caller\'s own row, case-sensitive, guests excluded', async () => {
    // Renaming plain to admin's own username, excluding plain's own id, must
    // still find admin's row — that's the whole point of the check.
    expect(await users.findIdByUsernameExactExcluding('ad-admin', plain.id)).toBe(admin.id);
    expect(await users.findIdByUsernameExactExcluding('ad-plain', plain.id)).toBeNull(); // excludes self
    expect(await users.findIdByUsernameExactExcluding('ad-guest', plain.id)).toBeNull(); // guest excluded
    expect(await users.findIdByEmailExactExcluding('ad-admin@example.com', plain.id)).toBe(admin.id);
    expect(await users.findIdByEmailExactExcluding('ad-plain@example.com', plain.id)).toBeNull();
  });

  it('USERSREPO-083 (AD11): applyAdminEdit only touches the keys supplied (coalesceParam semantics) and always stamps updated_at', async () => {
    const before = testDb.prepare('SELECT email, updated_at FROM users WHERE id = ?').get(plain.id) as { email: string; updated_at: string };
    // CURRENT_TIMESTAMP has 1-second resolution — wait past a tick so a
    // genuine "always stamped" pass is distinguishable from a no-op.
    await new Promise((r) => setTimeout(r, 1100));
    await users.applyAdminEdit(plain.id, { username: 'ad-plain-2' });
    const after = testDb.prepare('SELECT username, email, updated_at FROM users WHERE id = ?').get(plain.id) as { username: string; email: string; updated_at: string };
    expect(after.username).toBe('ad-plain-2');
    // email was NOT in the patch, so it is unchanged — the coalesceParam
    // "new value wins when supplied, existing column wins when omitted" shape.
    expect(after.email).toBe(before.email);
    // updated_at is stamped unconditionally, even though only username changed.
    expect(after.updated_at).not.toBe(before.updated_at);
  });

  it('USERSREPO-084 (AD16): findIdEmailMfaEnabled matches SELECT id, email, mfa_enabled FROM users WHERE id = ?', async () => {
    testDb.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(admin.id);
    const legacy = testDb.prepare('SELECT id, email, mfa_enabled FROM users WHERE id = ?').get(admin.id);
    expect(await users.findIdEmailMfaEnabled(admin.id)).toEqual(legacy);
    expect(await users.findIdEmailMfaEnabled(999999)).toBeNull();
  });
});

// IM4/IM5 (`ImmichService.saveImmichSettings`, #2475): the self-signed switch
// is decided INSIDE the UPDATE by `coalesceOverrideWhileSame`, the way the
// legacy CASE did it. These pin the stored values for every branch against
// the legacy statement's own text, and that the write stays one statement —
// a read-then-write would be an interleaving window the legacy SQL never had.
describe('UsersRepository — Immich settings write (IM4/IM5)', () => {
  const read = (id: number) =>
    testDb.prepare('SELECT immich_url, immich_api_key, immich_allow_insecure_tls FROM users WHERE id = ?').get(id) as {
      immich_url: string | null; immich_api_key: string | null; immich_allow_insecure_tls: number;
    };

  it('USERSREPO-085 (IM4): setImmichSettings keeps the stored switch on a null value while the URL stays the same, and starts a new URL off', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET immich_url = ?, immich_api_key = ?, immich_allow_insecure_tls = 1 WHERE id = ?').run('https://nas.local', 'enc-old', user.id);

    // An older client that does not know the switch cannot clear it by saving.
    await users.setImmichSettings(user.id, 'https://nas.local', 'enc-new', null);
    expect(read(user.id)).toEqual({ immich_url: 'https://nas.local', immich_api_key: 'enc-new', immich_allow_insecure_tls: 1 });

    // Sent explicitly, the value wins over the stored one.
    await users.setImmichSettings(user.id, 'https://nas.local', 'enc-new', 0);
    expect(read(user.id).immich_allow_insecure_tls).toBe(0);
    await users.setImmichSettings(user.id, 'https://nas.local', 'enc-new', 1);
    expect(read(user.id).immich_allow_insecure_tls).toBe(1);

    // The switch trusts one server: another URL without it starts off ...
    await users.setImmichSettings(user.id, 'https://photos.example.com', 'enc-2', null);
    expect(read(user.id)).toEqual({ immich_url: 'https://photos.example.com', immich_api_key: 'enc-2', immich_allow_insecure_tls: 0 });
    // ... and with it, holds for that server.
    await users.setImmichSettings(user.id, 'https://other.example.com', 'enc-3', 1);
    expect(read(user.id)).toEqual({ immich_url: 'https://other.example.com', immich_api_key: 'enc-3', immich_allow_insecure_tls: 1 });

    // A first connection (no stored URL) without the switch starts off too.
    testDb.prepare('UPDATE users SET immich_url = NULL, immich_allow_insecure_tls = 1 WHERE id = ?').run(user.id);
    await users.setImmichSettings(user.id, 'https://nas.local', 'enc-4', null);
    expect(read(user.id)).toEqual({ immich_url: 'https://nas.local', immich_api_key: 'enc-4', immich_allow_insecure_tls: 0 });
  });

  it('USERSREPO-086 (IM4): setImmichSettings matches the legacy CASE statement across every (stored url, stored switch, new url, value) combination, in ONE statement', async () => {
    const { user } = createUser(testDb);
    const seed = testDb.prepare('UPDATE users SET immich_url = ?, immich_api_key = NULL, immich_allow_insecure_tls = ? WHERE id = ?');
    const legacy = testDb.prepare(
      `UPDATE users SET immich_url = ?, immich_api_key = ?,
         immich_allow_insecure_tls = CASE WHEN immich_url IS ? THEN COALESCE(?, immich_allow_insecure_tls) ELSE COALESCE(?, 0) END
       WHERE id = ?`,
    );
    for (const storedUrl of [null, 'https://nas.local']) {
      for (const storedFlag of [0, 1]) {
        for (const newUrl of ['https://nas.local', 'https://photos.example.com']) {
          for (const value of [null, 0, 1]) {
            seed.run(storedUrl, storedFlag, user.id);
            legacy.run(newUrl, 'enc-key', newUrl, value, value, user.id);
            const expected = read(user.id);

            seed.run(storedUrl, storedFlag, user.id);
            const { queries } = await withQueryCount(() => users.setImmichSettings(user.id, newUrl, 'enc-key', value));
            expect(queries).toBe(1);
            expect(read(user.id)).toEqual(expected);
          }
        }
      }
    }
  });

  it('USERSREPO-087 (IM5): clearImmichSettings nulls the URL, stores the key it is handed and always turns the switch off', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET immich_url = ?, immich_api_key = ?, immich_allow_insecure_tls = 1 WHERE id = ?').run('https://nas.local', 'enc-old', user.id);
    await users.clearImmichSettings(user.id, null);
    expect(read(user.id)).toEqual({ immich_url: null, immich_api_key: null, immich_allow_insecure_tls: 0 });
  });
});
