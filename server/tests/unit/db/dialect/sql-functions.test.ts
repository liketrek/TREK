import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Platform } from '@mikro-orm/core';
import { expressionBuilder, type ExpressionBuilder } from 'kysely';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createUser } from '../../../helpers/factories';
import { Users } from '../../../../src/db/entities/Users.entity';
import {
  absDifference,
  caseWhenEquals,
  castInteger,
  castIntegerKysely,
  coalesce,
  coalesceOverride,
  coalesceOverrideWhileSame,
  coalesceParam,
  collateNoCase,
  columnIncrementedBy,
  columnRef,
  concat,
  concatKysely,
  countAll,
  countAllRef,
  currentTimestamp,
  currentTimestampKysely,
  dateAdd,
  dateOf,
  dayDistance,
  foundAgainState,
  lower,
  lowerParam,
  lowerTrim,
  lowerTrimParam,
  maxOf,
  minOf,
  nowDateOffset,
  nowMinusDays,
  nowMinusHours,
  nowPlusSeconds,
  nowPlusSecondsKysely,
  startsWithIsoDate,
  startsWithIsoDateKysely,
  substring,
  substringKysely,
  trim,
  unixEpochToIsoKysely,
} from '../../../../src/db/dialect/sql-functions';
import { createJourney, createJourneyEntry } from '../../../helpers/factories';

/** The `users` columns the Kysely-expression tests below read/write, narrowed the same way every other Kysely-typed repository method in this program declares its own `TDB`. */
interface UsersKyselyDB {
  users: {
    id: number;
    username: string;
    display_name: string | null;
    created_at: string | null;
  };
}

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => { t = await createTestOrm(testDb); });
beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

describe('sql-functions (sqlite)', () => {
  it('SQLF-001: dateOf yields the calendar date of a stored timestamp', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE users SET created_at = '2026-09-21 13:05:09' WHERE id = ?").run(user.id);
    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([dateOf(t.em.getPlatform(), 'u.created_at').as('d')])
      .where({ id: user.id })
      .execute('get', false);
    expect(row).toEqual({ d: '2026-09-21' });
  });

  it('SQLF-002: dateAdd shifts by whole days', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE users SET created_at = '2026-09-21 13:05:09' WHERE id = ?").run(user.id);
    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([dateAdd(t.em.getPlatform(), 'u.created_at', 10).as('d')])
      .where({ id: user.id })
      .execute('get', false);
    expect(row).toEqual({ d: '2026-10-01' });
  });

  it('SQLF-003: currentTimestamp is the DB clock in the wire format', async () => {
    createUser(testDb);
    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([currentTimestamp(t.em.getPlatform()).as('now')])
      .limit(1)
      .execute('get', false);
    expect(String((row as { now: string }).now)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('SQLF-004: dateOf rejects anything that is not a plain column reference', () => {
    expect(() => dateOf(t.em.getPlatform(), 'u.created_at); DROP TABLE users; --')).toThrow(/not a column reference/);
    expect(() => dateOf(t.em.getPlatform(), 'u.created_at.extra')).toThrow(/not a column reference/);
    expect(() => dateOf(t.em.getPlatform(), '')).toThrow(/not a column reference/);
  });

  it('SQLF-005: dateAdd rejects a non-integer day count', () => {
    expect(() => dateAdd(t.em.getPlatform(), 'u.created_at', 1.5)).toThrow(/integer day count/);
    expect(() => dateAdd(t.em.getPlatform(), 'u.created_at', Number.NaN)).toThrow(/integer day count/);
  });

  it('SQLF-006: dateAdd shifts backwards for a negative day count', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE users SET created_at = '2026-09-21 13:05:09' WHERE id = ?").run(user.id);
    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([dateAdd(t.em.getPlatform(), 'u.created_at', -10).as('d')])
      .where({ id: user.id })
      .execute('get', false);
    expect(row).toEqual({ d: '2026-09-11' });
  });

  it('SQLF-007: an unknown platform fails closed instead of guessing a spelling', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => dateOf(foreign, 'u.created_at')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => dateAdd(foreign, 'u.created_at', 1)).toThrow(/no implementation for platform FakePlatform/);
    expect(() => currentTimestamp(foreign)).toThrow(/no implementation for platform FakePlatform/);
    expect(() => columnRef(foreign, 'u.max_uses')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => columnIncrementedBy(foreign, 'u.used_count', 1)).toThrow(/no implementation for platform FakePlatform/);
    expect(() => lower(foreign, 'u.email')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => lowerParam(foreign, 'x')).toThrow(/no implementation for platform FakePlatform/);
  });

  // Plan 3b Task 1: UsersRepository's CI (case-insensitive) lookups
  // (findByEmailCI, findIdByUsernameCI, ...) need `LOWER(col) = ?` as a
  // `find`/`findOne` filter KEY, not just inside a QueryBuilder `.where()` —
  // proving it works through `em.find`/`findOne` (the API the repository
  // actually calls) rather than only through `createQueryBuilder`.
  it('SQLF-012: lower is usable as a find() filter key, matching case-insensitively', async () => {
    const { user } = createUser(testDb, { email: 'Mixed.Case@Example.com' });
    const rows = await t.em.find(Users, { [lower(t.em.getPlatform(), 'email')]: 'mixed.case@example.com' });
    expect(rows.map((r) => r.id)).toEqual([user.id]);

    // A differently-cased query value that still lowercases to the same
    // string finds the same row; one that does not, finds nothing.
    const none = await t.em.find(Users, { [lower(t.em.getPlatform(), 'email')]: 'nobody@example.com' });
    expect(none).toEqual([]);
  });

  it('SQLF-013: lower composes with other filter keys in one findOne call', async () => {
    const { user } = createUser(testDb, { username: 'MixedCaseName' });
    const row = await t.em.findOne(Users, {
      [lower(t.em.getPlatform(), 'username')]: 'mixedcasename',
      id: { $ne: -1 },
    });
    expect(row?.id).toBe(user.id);
  });

  // Plan 3b Task 0: InviteTokensRepository.incrementUsedCount needs a
  // sibling-column comparison (`used_count < max_uses`) and a sibling-column
  // increment (`used_count = used_count + 1`) inside a QueryBuilder filter —
  // ESLint bans a repository from spelling `raw()` itself (src/db/repositories/**),
  // so both go through these two dialect helpers instead.
  it('SQLF-009: columnRef compares one column against another (not a bound value)', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET login_count = 5, password_version = 3 WHERE id = ?').run(user.id);
    const below = await t.em.createQueryBuilder(Users, 'u')
      .select('*')
      .where({ id: user.id, password_version: { $lt: columnRef(t.em.getPlatform(), 'login_count') } })
      .execute('get', false);
    expect((below as { id: number } | undefined)?.id).toBe(user.id);

    testDb.prepare('UPDATE users SET login_count = 1 WHERE id = ?').run(user.id);
    const notBelow = await t.em.createQueryBuilder(Users, 'u')
      .select('*')
      .where({ id: user.id, password_version: { $lt: columnRef(t.em.getPlatform(), 'login_count') } })
      .execute('get', false);
    expect(notBelow).toBeUndefined();
  });

  it('SQLF-010: columnIncrementedBy writes <col> + n / <col> - n, never a bound-parameter add', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET login_count = 10 WHERE id = ?').run(user.id);
    await t.em.createQueryBuilder(Users, 'u')
      .update({ login_count: columnIncrementedBy(t.em.getPlatform(), 'login_count', 3) })
      .where({ id: user.id })
      .execute('run');
    t.clear();
    expect((testDb.prepare('SELECT login_count FROM users WHERE id = ?').get(user.id) as { login_count: number }).login_count).toBe(13);

    await t.em.createQueryBuilder(Users, 'u')
      .update({ login_count: columnIncrementedBy(t.em.getPlatform(), 'login_count', -5) })
      .where({ id: user.id })
      .execute('run');
    t.clear();
    expect((testDb.prepare('SELECT login_count FROM users WHERE id = ?').get(user.id) as { login_count: number }).login_count).toBe(8);
  });

  it('SQLF-011: columnIncrementedBy rejects a non-integer amount', () => {
    expect(() => columnIncrementedBy(t.em.getPlatform(), 'u.login_count', 1.5)).toThrow(/integer amount/);
    expect(() => columnIncrementedBy(t.em.getPlatform(), 'u.login_count', Number.NaN)).toThrow(/integer amount/);
  });

  // Plan 3b Task 0: OA8 (oauth_tokens' client-secret-rotation revoke) is the
  // one call site in the whole codebase that spells "now" as `datetime('now')`
  // instead of `CURRENT_TIMESTAMP` — same effective SQLite value, but D10
  // wants exactly one dialect-function path. `currentTimestamp` already
  // renders the literal `CURRENT_TIMESTAMP` fragment (SQLF-003 pins its wire
  // format); this proves that fragment's stored text is byte-identical to
  // what the legacy `datetime('now')` spelling produces, so OA8 (Task 4) can
  // route through `currentTimestamp(platform)` with no behaviour change.
  it("SQLF-008: currentTimestamp's CURRENT_TIMESTAMP spelling is byte-identical, in the same statement, to the legacy datetime('now') spelling", async () => {
    // One atomic SELECT evaluates both expressions at the exact same instant —
    // no timing window between two separate writes, so this is not a
    // usually-true "close enough" comparison, it is a real strict equality.
    const row = testDb.prepare("SELECT CURRENT_TIMESTAMP as a, datetime('now') as b").get() as { a: string; b: string };
    expect(row.a).toBe(row.b);
    expect(row.a).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    // And a real write through the repository-facing dialect helper, read
    // back through the raw connection, stores that exact same shape — not
    // just the fragment text in isolation.
    const { user } = createUser(testDb);
    await t.em.createQueryBuilder(Users, 'u')
      .update({ created_at: currentTimestamp(t.em.getPlatform()) })
      .where({ id: user.id })
      .execute('run');
    t.clear();
    const stored = testDb.prepare('SELECT created_at FROM users WHERE id = ?').get(user.id) as { created_at: string };
    expect(stored.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  // Program rule 18 / Plan 3b Task 7 review H1: SQLite's LOWER() is
  // ASCII-only; JavaScript's toLowerCase() is full-Unicode. lowerParam()
  // binds the RAW value so SQLite folds both sides of the comparison with
  // the same engine, matching a legacy `LOWER(col) = LOWER(?)` statement.
  it('SQLF-014: SQLite LOWER() is ASCII-only, unlike JS toLowerCase() — verified directly', () => {
    const cases: Array<[string, string]> = [
      ['JOSÉ@x.com', 'josÉ@x.com'],
      ['ÄNNA@x.com', 'Änna@x.com'],
      ['ΣIGMA@x.com', 'Σigma@x.com'],
      ['İSTANBUL@x.com', 'İstanbul@x.com'],
      ['ASCII@x.com', 'ascii@x.com'],
    ];
    for (const [input, sqliteLowered] of cases) {
      const row = testDb.prepare('SELECT LOWER(?) as l').get(input) as { l: string };
      expect(row.l).toBe(sqliteLowered);
      // Every non-ASCII case proves the two engines disagree.
      if (input !== 'ASCII@x.com') {
        expect(row.l).not.toBe(input.toLowerCase());
      }
    }
  });

  it('SQLF-015: lowerParam pairs with lower() to fold BOTH sides in SQLite, matching a non-ASCII stored spelling that toLowerCase() would miss', async () => {
    const { user } = createUser(testDb, { email: 'JOSÉ@x.com' });
    const platform = t.em.getPlatform();

    // The exact stored spelling matches (SQLite's LOWER() is a no-op on both
    // sides for this input, so this is really an equality check — the real
    // proof is the next assertion).
    const exact = await t.em.findOne(Users, { [lower(platform, 'email')]: lowerParam(platform, 'JOSÉ@x.com') });
    expect(exact?.id).toBe(user.id);

    // A JS-lowered value-side bind (the bug: mixing engines) must NOT match
    // — this is the mutation-proof: reverting `lowerParam(platform, email)`
    // to a plain `email.toLowerCase()` bind makes this assertion fail
    // because SQLite's LOWER(column) still reads 'josÉ@x.com', which does
    // not equal the JS-lowered bind 'josé@x.com'.
    const jsLowered = await t.em.findOne(Users, { [lower(platform, 'email')]: 'josé@x.com' });
    expect(jsLowered).toBeNull();

    const none = await t.em.findOne(Users, { [lower(platform, 'email')]: lowerParam(platform, 'nobody@example.com') });
    expect(none).toBeNull();
  });

  // Plan 3c Task 0b (R6): no consumer yet — Tasks 1–8 wire these in as each
  // converts the statement that needs them. Pinned here so a later task
  // imports a tested helper instead of writing one inline.

  it("SQLF-016: nowMinusDays renders datetime('now', '-N days'), matching a JS-computed date within a few seconds' tolerance", async () => {
    const row = testDb.prepare(`SELECT ${nowMinusDays(t.em.getPlatform(), 5).sql} as d`).get() as { d: string };
    const got = new Date(`${row.d.replace(' ', 'T')}Z`).getTime();
    const expected = Date.now() - 5 * 24 * 60 * 60 * 1000;
    expect(Math.abs(got - expected)).toBeLessThan(10_000);
  });

  it('SQLF-016b: nowMinusDays(0) is "now", not one day back', async () => {
    const row = testDb.prepare(`SELECT ${nowMinusDays(t.em.getPlatform(), 0).sql} as d`).get() as { d: string };
    const got = new Date(`${row.d.replace(' ', 'T')}Z`).getTime();
    expect(Math.abs(got - Date.now())).toBeLessThan(10_000);
  });

  it('SQLF-017: nowMinusDays rejects a non-integer or negative day count', () => {
    expect(() => nowMinusDays(t.em.getPlatform(), 1.5)).toThrow(/non-negative integer day count/);
    expect(() => nowMinusDays(t.em.getPlatform(), -1)).toThrow(/non-negative integer day count/);
    expect(() => nowMinusDays(t.em.getPlatform(), Number.NaN)).toThrow(/non-negative integer day count/);
  });

  it('SQLF-018: trim strips leading/trailing whitespace', async () => {
    const { user } = createUser(testDb, { username: '  Padded Name  ' });
    const platform = t.em.getPlatform();
    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([trim(platform, 'u.username').as('n')])
      .where({ id: user.id })
      .execute('get', false);
    expect((row as { n: string }).n).toBe('Padded Name');
  });

  it('SQLF-019: coalesce(ref, fallbackRef) picks the first non-null column, else the second', async () => {
    const { user: withName } = createUser(testDb, { username: 'has-display-name' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Display Name', withName.id);
    const { user: withoutName } = createUser(testDb, { username: 'no-display-name' });
    const platform = t.em.getPlatform();

    const a = await t.em.createQueryBuilder(Users, 'u')
      .select([coalesce(platform, 'u.display_name', 'u.username').as('name')])
      .where({ id: withName.id })
      .execute('get', false);
    expect((a as { name: string }).name).toBe('Display Name');

    const b = await t.em.createQueryBuilder(Users, 'u')
      .select([coalesce(platform, 'u.display_name', 'u.username').as('name')])
      .where({ id: withoutName.id })
      .execute('get', false);
    expect((b as { name: string }).name).toBe('no-display-name');
  });

  it('SQLF-020: coalesceParam(ref, value) writes COALESCE(col, ?) with the fallback bound, not another column', async () => {
    const { user } = createUser(testDb);
    const platform = t.em.getPlatform();
    await t.em.createQueryBuilder(Users, 'u')
      .update({ display_name: coalesceParam(platform, 'display_name', 'Fallback Name') })
      .where({ id: user.id })
      .execute('run');
    t.clear();
    expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(user.id) as { display_name: string }).display_name).toBe('Fallback Name');

    await t.em.createQueryBuilder(Users, 'u')
      .update({ display_name: coalesceParam(platform, 'display_name', 'Never Used') })
      .where({ id: user.id })
      .execute('run');
    t.clear();
    expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(user.id) as { display_name: string }).display_name).toBe('Fallback Name');
  });

  // Plan 3h Task 5 (doc-sync, DS23/DS24) — `coalesceOverride`, the
  // mirror-image value-side shape `COALESCE(?, col)`: the caller's NEW
  // value wins unless it is null, unlike `coalesceParam`'s `COALESCE(col,
  // ?)` above (existing column wins unless IT is null). Confirmed
  // genuinely the opposite direction by a live round-trip, not assumed from
  // the two functions' similar names.
  it('SQLF-090: coalesceOverride(value, ref) writes COALESCE(?, col) — a non-null new value overwrites the existing column', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Old Name', user.id);
    const platform = t.em.getPlatform();
    await t.em.createQueryBuilder(Users, 'u')
      .update({ display_name: coalesceOverride(platform, 'New Name', 'display_name') })
      .where({ id: user.id })
      .execute('run');
    t.clear();
    expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(user.id) as { display_name: string }).display_name).toBe('New Name');
  });

  it('SQLF-091: coalesceOverride(null, ref) leaves the existing column untouched — a null new value never clobbers what is stored', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Keep Me', user.id);
    const platform = t.em.getPlatform();
    await t.em.createQueryBuilder(Users, 'u')
      .update({ display_name: coalesceOverride(platform, null, 'display_name') })
      .where({ id: user.id })
      .execute('run');
    t.clear();
    expect((testDb.prepare('SELECT display_name FROM users WHERE id = ?').get(user.id) as { display_name: string }).display_name).toBe('Keep Me');
  });

  it('SQLF-092: an unknown platform fails closed for coalesceOverride', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => coalesceOverride(foreign, 'x', 'u.a')).toThrow(/no implementation for platform FakePlatform/);
  });

  // `coalesceOverrideWhileSame` — IM4's `immich_allow_insecure_tls = CASE WHEN
  // immich_url IS ? THEN COALESCE(?, immich_allow_insecure_tls) ELSE
  // COALESCE(?, 0) END` (#2475), driven through the same `users` columns the
  // repository writes, in ONE UPDATE that also overwrites the key column —
  // proving the WHEN reads the stored URL, not the one being written.
  describe('coalesceOverrideWhileSame (IM4 self-signed switch)', () => {
    async function save(userId: number, url: string, value: number | null): Promise<{ immich_url: string; immich_allow_insecure_tls: number }> {
      const platform = t.em.getPlatform();
      await t.em.createQueryBuilder(Users, 'u')
        .update({
          immich_url: url,
          immich_allow_insecure_tls: coalesceOverrideWhileSame(platform, value, 'immich_allow_insecure_tls', 'immich_url', url),
        })
        .where({ id: userId })
        .execute('run');
      t.clear();
      return testDb.prepare('SELECT immich_url, immich_allow_insecure_tls FROM users WHERE id = ?').get(userId) as { immich_url: string; immich_allow_insecure_tls: number };
    }

    it('SQLF-093: a null value keeps the stored column while the key column still holds the value being written', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET immich_url = ?, immich_allow_insecure_tls = 1 WHERE id = ?').run('https://nas.local', user.id);
      expect(await save(user.id, 'https://nas.local', null)).toEqual({ immich_url: 'https://nas.local', immich_allow_insecure_tls: 1 });
      // Symmetric: a stored 0 is kept too, not merely "anything truthy survives".
      testDb.prepare('UPDATE users SET immich_allow_insecure_tls = 0 WHERE id = ?').run(user.id);
      expect(await save(user.id, 'https://nas.local', null)).toEqual({ immich_url: 'https://nas.local', immich_allow_insecure_tls: 0 });
    });

    it('SQLF-094: a non-null value overwrites the stored column in both directions, same key or not', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET immich_url = ?, immich_allow_insecure_tls = 1 WHERE id = ?').run('https://nas.local', user.id);
      expect((await save(user.id, 'https://nas.local', 0)).immich_allow_insecure_tls).toBe(0);
      expect((await save(user.id, 'https://nas.local', 1)).immich_allow_insecure_tls).toBe(1);
      expect((await save(user.id, 'https://other.example.com', 1)).immich_allow_insecure_tls).toBe(1);
      expect((await save(user.id, 'https://nas.local', 0)).immich_allow_insecure_tls).toBe(0);
    });

    it('SQLF-095: a null value falls back to 0, not to the stored column, once the key column changes — including from NULL (a first connection)', async () => {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET immich_url = ?, immich_allow_insecure_tls = 1 WHERE id = ?').run('https://nas.local', user.id);
      expect(await save(user.id, 'https://photos.example.com', null)).toEqual({ immich_url: 'https://photos.example.com', immich_allow_insecure_tls: 0 });
      // `IS` (not `=`) so a stored NULL url compares as "different", never as unknown.
      testDb.prepare('UPDATE users SET immich_url = NULL, immich_allow_insecure_tls = 1 WHERE id = ?').run(user.id);
      expect(await save(user.id, 'https://nas.local', null)).toEqual({ immich_url: 'https://nas.local', immich_allow_insecure_tls: 0 });
    });

    it('SQLF-096: matches the legacy CASE text row-for-row across every (stored url, new url, value) combination', async () => {
      const { user } = createUser(testDb);
      const legacy = testDb.prepare(
        `UPDATE users SET immich_url = ?, immich_allow_insecure_tls = CASE WHEN immich_url IS ? THEN COALESCE(?, immich_allow_insecure_tls) ELSE COALESCE(?, 0) END WHERE id = ?`,
      );
      for (const storedUrl of [null, 'https://nas.local']) {
        for (const storedFlag of [0, 1]) {
          for (const newUrl of ['https://nas.local', 'https://photos.example.com']) {
            for (const value of [null, 0, 1]) {
              testDb.prepare('UPDATE users SET immich_url = ?, immich_allow_insecure_tls = ? WHERE id = ?').run(storedUrl, storedFlag, user.id);
              legacy.run(newUrl, newUrl, value, value, user.id);
              const expected = testDb.prepare('SELECT immich_url, immich_allow_insecure_tls FROM users WHERE id = ?').get(user.id);
              testDb.prepare('UPDATE users SET immich_url = ?, immich_allow_insecure_tls = ? WHERE id = ?').run(storedUrl, storedFlag, user.id);
              expect(await save(user.id, newUrl, value)).toEqual(expected);
            }
          }
        }
      }
    });

    it('SQLF-097: an unknown platform fails closed for coalesceOverrideWhileSame', () => {
      class FakePlatform extends Platform {}
      const foreign = new FakePlatform();
      expect(() => coalesceOverrideWhileSame(foreign, null, 'u.a', 'u.b', 'x')).toThrow(/no implementation for platform FakePlatform/);
    });
  });

  it('SQLF-021: absDifference is usable as a filter key, matching ABS(col - ?) <= tolerance', async () => {
    const { user: near } = createUser(testDb);
    testDb.prepare('UPDATE users SET login_count = 12 WHERE id = ?').run(near.id);
    const { user: far } = createUser(testDb);
    testDb.prepare('UPDATE users SET login_count = 100 WHERE id = ?').run(far.id);
    const platform = t.em.getPlatform();

    const rows = await t.em.find(Users, { [absDifference(platform, 'login_count', 10)]: { $lte: 5 } });
    expect(rows.map((r) => r.id)).toEqual([near.id]);

    const none = await t.em.find(Users, { [absDifference(platform, 'login_count', 10)]: { $lte: 0 } });
    expect(none).toEqual([]);
  });

  it('SQLF-022: an unknown platform fails closed for every Plan 3c Task 0b helper', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => nowMinusDays(foreign, 1)).toThrow(/no implementation for platform FakePlatform/);
    expect(() => trim(foreign, 'u.name')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => coalesce(foreign, 'u.a', 'u.b')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => coalesceParam(foreign, 'u.a', 'x')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => absDifference(foreign, 'u.lat', 1)).toThrow(/no implementation for platform FakePlatform/);
  });

  // Plan 3c Task 1 (§17a: COUNT(*)/MIN/MAX aggregates — `PlaceShadowPicksRepository
  // .totals`/`countBySource`/`countByLiveRank`). ESLint bans `raw()` inside
  // src/db/repositories/**, so these three aliased-aggregate helpers exist
  // for repositories that need a COUNT/MIN/MAX in a SELECT projection.

  it('SQLF-023: countAll/minOf/maxOf render one aliased aggregate row, matching a hand-written statement', async () => {
    const { user: a } = createUser(testDb);
    testDb.prepare("UPDATE users SET created_at = '2026-01-01 00:00:00' WHERE id = ?").run(a.id);
    const { user: b } = createUser(testDb);
    testDb.prepare("UPDATE users SET created_at = '2026-06-15 00:00:00' WHERE id = ?").run(b.id);
    const platform = t.em.getPlatform();

    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([countAll(platform, 'total'), minOf(platform, 'u.created_at', 'oldest'), maxOf(platform, 'u.created_at', 'newest')])
      .where({ id: { $in: [a.id, b.id] } })
      .execute('get', false);
    expect(row).toEqual({ total: 2, oldest: '2026-01-01 00:00:00', newest: '2026-06-15 00:00:00' });

    const expected = testDb
      .prepare('SELECT COUNT(*) as total, MIN(created_at) as oldest, MAX(created_at) as newest FROM users WHERE id IN (?, ?)')
      .get(a.id, b.id);
    expect(row).toEqual(expected);
  });

  // No `.orderBy({ count: 'desc' })` here: MikroORM's QueryBuilder cannot
  // order by an ad-hoc raw-fragment alias (verified directly — it throws
  // "Trying to query by not existing property" at runtime, since `raw()`'s
  // alias carries no literal type for `ExtractRawAliases` to register). The
  // repository callers that need "ORDER BY <aliased count> DESC"
  // (`PlaceShadowPicksRepository.countBySource`) order by the `COUNT(*)`
  // EXPRESSION instead, via `countAllRef` below (SQLF-032) — NOT a JS
  // `Array.prototype.sort` of the fetched rows: that would be stable and
  // therefore leave ties in `GROUP BY`'s own (ascending-by-key) row order,
  // which is not the same order SQLite's own, non-stable `ORDER BY count
  // DESC` sorter produces on a tie (Task 1 fix review M1).
  it('SQLF-024: countAll composes with GROUP BY, matching a hand-written GROUP BY statement', async () => {
    createUser(testDb, { role: 'admin' });
    createUser(testDb, { role: 'admin' });
    createUser(testDb, { role: 'user' });
    const platform = t.em.getPlatform();

    const rows = await t.em.createQueryBuilder(Users, 'u')
      .select(['u.role', countAll(platform, 'count')])
      .groupBy('u.role')
      .execute('all', false);

    const expected = testDb.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all();
    expect([...(rows as { role: string; count: number }[])].sort((a, b) => a.role.localeCompare(b.role)))
      .toEqual([...(expected as { role: string; count: number }[])].sort((a, b) => a.role.localeCompare(b.role)));
  });

  it('SQLF-025: countAll/minOf/maxOf reject an alias that is not a plain identifier', () => {
    const platform = t.em.getPlatform();
    expect(() => countAll(platform, 'x; DROP TABLE users; --')).toThrow(/not an alias/);
    expect(() => minOf(platform, 'u.created_at', '1bad')).toThrow(/not an alias/);
    expect(() => maxOf(platform, 'u.created_at', '')).toThrow(/not an alias/);
  });

  it('SQLF-026: an unknown platform fails closed for countAll/minOf/maxOf', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => countAll(foreign, 'total')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => minOf(foreign, 'u.created_at', 'oldest')).toThrow(/no implementation for platform FakePlatform/);
    expect(() => maxOf(foreign, 'u.created_at', 'newest')).toThrow(/no implementation for platform FakePlatform/);
  });

  // Task 0b review M3 (blocks Task 4's PL26, places.service.ts:642
  // `lower(trim(name))`): `lower()`/`trim()` cannot compose to build
  // `LOWER(TRIM(name))` — `lowerTrim()` is the one fragment for that shape.
  it('SQLF-027: lowerTrim renders LOWER(TRIM(<col>)) as one fragment, matching a hand-written statement', async () => {
    const { user } = createUser(testDb, { username: '  Padded Name  ' });
    const platform = t.em.getPlatform();
    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([lowerTrim(platform, 'u.username').as('n')])
      .where({ id: user.id })
      .execute('get', false);
    expect((row as { n: string }).n).toBe('padded name');

    const expected = testDb.prepare('SELECT LOWER(TRIM(username)) as n FROM users WHERE id = ?').get(user.id) as { n: string };
    expect((row as { n: string }).n).toBe(expected.n);
  });

  it('SQLF-028: lowerTrim is usable as a find() filter key, and SQLite LOWER() stays ASCII-only through the TRIM', async () => {
    const { user } = createUser(testDb, { username: '  JOSÉ  ' });
    const platform = t.em.getPlatform();
    const rows = await t.em.find(Users, { [lowerTrim(platform, 'username')]: 'josé'.toLowerCase() });
    // toLowerCase() is full-Unicode ('é' stays 'é'), but SQLite's LOWER() is
    // ASCII-only and leaves 'É' untouched — so the JS-lowered bind does NOT
    // match the SQL-lowered, SQL-trimmed column (program rule 18: mixing
    // engines is the bug, not the fix).
    expect(rows).toEqual([]);
    const matching = await t.em.find(Users, { [lowerTrim(platform, 'username')]: 'josÉ' });
    expect(matching.map((r) => r.id)).toEqual([user.id]);
  });

  it('SQLF-029: an unknown platform fails closed for lowerTrim', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => lowerTrim(foreign, 'u.name')).toThrow(/no implementation for platform FakePlatform/);
  });

  // Plan 3c Task 6 — `TripMembersRepository.listWithUserAndInviter`'s `role`
  // column (TM2): `CASE WHEN u.id = ? THEN 'owner' ELSE 'member' END`.
  it("SQLF-030: caseWhenEquals renders CASE WHEN <col> = ? THEN ? ELSE ? END, matching a hand-written statement", async () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    const platform = t.em.getPlatform();

    const rows = await t.em.createQueryBuilder(Users, 'u')
      .select(['u.id', caseWhenEquals(platform, 'u.id', a.id, 'owner', 'member').as('role')])
      .where({ id: { $in: [a.id, b.id] } })
      .orderBy({ id: 'asc' })
      .execute('all', false);
    expect(rows).toEqual([{ id: a.id, role: 'owner' }, { id: b.id, role: 'member' }]);

    const expected = testDb
      .prepare('SELECT id, CASE WHEN id = ? THEN ? ELSE ? END as role FROM users WHERE id IN (?, ?) ORDER BY id ASC')
      .all(a.id, 'owner', 'member', a.id, b.id);
    expect(rows).toEqual(expected);
  });

  it('SQLF-031: an unknown platform fails closed for caseWhenEquals', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => caseWhenEquals(foreign, 'u.id', 1, 'owner', 'member')).toThrow(/no implementation for platform FakePlatform/);
  });

  // Task 1 fix review M1 (`PlaceShadowPicksRepository.countBySource`, PS5):
  // `countAll()`'s alias cannot be ordered by (`.orderBy({ count: 'desc' })`
  // throws "not existing property" — verified in SQLF-024's comment above);
  // `countAllRef` orders by the `COUNT(*)` EXPRESSION instead, which SQLite
  // accepts. The full tie-order proof (against the legacy `ORDER BY count
  // DESC` statement, on data with tied counts) lives in
  // `PlaceShadowPicksRepository.countBySource`'s own test (PSPICKREPO-006b) —
  // this pins the fragment's shape and composition with GROUP BY.
  it('SQLF-032: countAllRef renders COUNT(*) as an ORDER BY expression, matching a hand-written GROUP BY … ORDER BY statement', async () => {
    createUser(testDb, { role: 'admin' });
    createUser(testDb, { role: 'admin' });
    createUser(testDb, { role: 'user' });
    const platform = t.em.getPlatform();

    const rows = await t.em.createQueryBuilder(Users, 'u')
      .select(['u.role', countAll(platform, 'count')])
      .groupBy('u.role')
      .orderBy({ [countAllRef(platform)]: 'desc' })
      .execute('all', false);

    const expected = testDb.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY COUNT(*) DESC').all();
    expect(rows).toEqual(expected);
  });

  it('SQLF-033: an unknown platform fails closed for countAllRef', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => countAllRef(foreign)).toThrow(/no implementation for platform FakePlatform/);
  });

  // Plan 3d Task 0 (R6): no consumer yet — Tasks 2/4 wire these in as each
  // converts RS11/RS20/RV2/DY23. Pinned here so a later task imports a
  // tested helper instead of writing one inline.

  it('SQLF-034: startsWithIsoDate matches a value that begins with YYYY-MM-DD, and only that shape (dates, non-dates, "2026-1-1", empty, NULL)', async () => {
    const platform = t.em.getPlatform();
    const cases: Array<[string | null, boolean]> = [
      ['2026-09-21', true],
      ['2026-09-21T13:05:09Z', true],
      ['2026-09-21 13:05:09', true],
      ['not-a-date', false],
      ['2026-1-1', false], // not zero-padded — the legacy pattern is exactly 4-2-2 digit classes, not a wildcard shorthand
      ['abcd-ef-gh', false], // Task 0 review L1 — the wider '????-??-??*' shorthand WOULD match this (a `?` matches any char); the digit-class pattern must not
      ['yyyy-mm-dd', false], // Task 0 review L1 — same reason, letters where the pattern requires digits
      ['', false],
      [null, false],
    ];
    for (const [value, expected] of cases) {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(value, user.id);

      const row = await t.em.createQueryBuilder(Users, 'u')
        .select([startsWithIsoDate(platform, 'u.display_name').as('matched')])
        .where({ id: user.id })
        .execute('get', false);
      expect(Boolean((row as { matched: number | null }).matched)).toBe(expected);

      const raw = testDb
        .prepare(`SELECT (display_name GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*') as matched FROM users WHERE id = ?`)
        .get(user.id) as { matched: number | null };
      expect(Boolean(raw.matched)).toBe(expected);
    }
  });

  it('SQLF-035: an unknown platform fails closed for startsWithIsoDate', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => startsWithIsoDate(foreign, 'u.reservation_time')).toThrow(/no implementation for platform FakePlatform/);
  });

  it('SQLF-036: substring(ref, start) — the two-arg form — reads from a 1-based position to the end, matching substr(col, N)', async () => {
    const { user } = createUser(testDb, { username: 'iso-ts' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('2026-09-21T13:05:09Z', user.id);
    const platform = t.em.getPlatform();

    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([substring(platform, 'u.display_name', 12).as('n')])
      .where({ id: user.id })
      .execute('get', false);
    expect((row as { n: string }).n).toBe('13:05:09Z');

    const expected = testDb.prepare('SELECT substr(display_name, 12) as n FROM users WHERE id = ?').get(user.id) as { n: string };
    expect((row as { n: string }).n).toBe(expected.n);
  });

  it('SQLF-037: substring(ref, start, length) — the three-arg form — matches substr(col, N, L)', async () => {
    const { user } = createUser(testDb, { username: 'iso-ts-2' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('2026-09-21T13:05:09Z', user.id);
    const platform = t.em.getPlatform();

    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([substring(platform, 'u.display_name', 1, 10).as('n')])
      .where({ id: user.id })
      .execute('get', false);
    expect((row as { n: string }).n).toBe('2026-09-21');

    const expected = testDb.prepare('SELECT substr(display_name, 1, 10) as n FROM users WHERE id = ?').get(user.id) as { n: string };
    expect((row as { n: string }).n).toBe(expected.n);
  });

  it('SQLF-038: substring rejects a non-positive start or a negative length', () => {
    const platform = t.em.getPlatform();
    expect(() => substring(platform, 'u.x', 0)).toThrow(/1-based integer start/);
    expect(() => substring(platform, 'u.x', 1.5)).toThrow(/1-based integer start/);
    expect(() => substring(platform, 'u.x', 1, -1)).toThrow(/non-negative integer length/);
    expect(() => substring(platform, 'u.x', 1, 1.5)).toThrow(/non-negative integer length/);
  });

  it('SQLF-039: an unknown platform fails closed for substring', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => substring(foreign, 'u.x', 1)).toThrow(/no implementation for platform FakePlatform/);
  });

  it('SQLF-040: concat renders <col> || <bound-literal> || <col>, matching the legacy d.date || \'T\' || a.check_in shape', async () => {
    const { user } = createUser(testDb, { username: 'concat-me' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('13:05', user.id);
    const platform = t.em.getPlatform();

    const row = await t.em.createQueryBuilder(Users, 'u')
      .select([concat(platform, { column: 'u.username' }, { value: 'T' }, { column: 'u.display_name' }).as('n')])
      .where({ id: user.id })
      .execute('get', false);
    expect((row as { n: string }).n).toBe('concat-meT13:05');

    const expected = testDb.prepare("SELECT username || ? || display_name as n FROM users WHERE id = ?").get('T', user.id) as { n: string };
    expect((row as { n: string }).n).toBe(expected.n);
  });

  it('SQLF-041: concat rejects fewer than two parts', () => {
    const platform = t.em.getPlatform();
    expect(() => concat(platform, { column: 'u.a' })).toThrow(/at least two parts/);
    expect(() => concat(platform)).toThrow(/at least two parts/);
  });

  it('SQLF-042: an unknown platform fails closed for concat', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => concat(foreign, { column: 'u.a' }, { value: 'x' })).toThrow(/no implementation for platform FakePlatform/);
  });

  // §18.1: reservations.accommodation_id is TEXT holding integer ids with no
  // FK; some rows read back as "14.0". castInteger exists so a comparison
  // against a genuine INTEGER column matches both spellings the way the
  // legacy CAST(... AS INTEGER) statement does.
  it('SQLF-043: castInteger matches both "14" and "14.0" TEXT rows against a bound INTEGER value (the accommodation_id shape, §18.1)', async () => {
    const platform = t.em.getPlatform();
    const { user: exact } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('14', exact.id);
    const { user: dotZero } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('14.0', dotZero.id);
    const { user: other } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('15', other.id);

    const rows = await t.em.createQueryBuilder(Users, 'u')
      .select('u.id')
      .where({ id: { $in: [exact.id, dotZero.id, other.id] }, [castInteger(platform, 'u.display_name')]: 14 })
      .orderBy({ id: 'asc' })
      .execute('all', false);
    expect((rows as { id: number }[]).map((r) => r.id)).toEqual([exact.id, dotZero.id]);

    const expected = testDb
      .prepare('SELECT id FROM users WHERE id IN (?, ?, ?) AND CAST(display_name AS INTEGER) = ? ORDER BY id ASC')
      .all(exact.id, dotZero.id, other.id, 14);
    expect(rows).toEqual(expected);
  });

  it('SQLF-044: castInteger compares against another column via columnRef, matching CAST(col AS INTEGER) = other_col (the real RV2/RS20 shape)', async () => {
    const platform = t.em.getPlatform();
    const { user: exact } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(String(exact.id), exact.id);
    const { user: dotZero } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(`${dotZero.id}.0`, dotZero.id);
    const { user: mismatched } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(String(exact.id), mismatched.id);

    const rows = await t.em.createQueryBuilder(Users, 'u')
      .select('u.id')
      .where({ id: { $in: [exact.id, dotZero.id, mismatched.id] }, [castInteger(platform, 'u.display_name')]: columnRef(platform, 'u.id') })
      .orderBy({ id: 'asc' })
      .execute('all', false);
    expect((rows as { id: number }[]).map((r) => r.id)).toEqual([exact.id, dotZero.id]);

    const expected = testDb
      .prepare('SELECT id FROM users WHERE id IN (?, ?, ?) AND CAST(display_name AS INTEGER) = id ORDER BY id ASC')
      .all(exact.id, dotZero.id, mismatched.id);
    expect(rows).toEqual(expected);
  });

  it('SQLF-045: an unknown platform fails closed for castInteger', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => castInteger(foreign, 'u.accommodation_id')).toThrow(/no implementation for platform FakePlatform/);
  });

  it('SQLF-046: dayDistance orders by nearest calendar date, matching ORDER BY ABS(JULIANDAY(col) - JULIANDAY(?)) ASC', async () => {
    const platform = t.em.getPlatform();
    const { user: a } = createUser(testDb);
    testDb.prepare("UPDATE users SET created_at = '2026-01-01 00:00:00' WHERE id = ?").run(a.id);
    const { user: b } = createUser(testDb);
    testDb.prepare("UPDATE users SET created_at = '2026-06-15 00:00:00' WHERE id = ?").run(b.id);
    const { user: c } = createUser(testDb);
    testDb.prepare("UPDATE users SET created_at = '2026-06-20 00:00:00' WHERE id = ?").run(c.id);
    const target = '2026-06-18';

    const rows = await t.em.createQueryBuilder(Users, 'u')
      .select('u.id')
      .where({ id: { $in: [a.id, b.id, c.id] } })
      .orderBy({ [dayDistance(platform, 'u.created_at', target)]: 'asc' })
      .execute('all', false);
    expect((rows as { id: number }[]).map((r) => r.id)).toEqual([c.id, b.id, a.id]);

    const expected = testDb
      .prepare('SELECT id FROM users WHERE id IN (?, ?, ?) ORDER BY ABS(JULIANDAY(created_at) - JULIANDAY(?)) ASC')
      .all(a.id, b.id, c.id, target);
    expect(rows).toEqual(expected);
  });

  it('SQLF-047: an unknown platform fails closed for dayDistance', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => dayDistance(foreign, 'u.date', '2026-01-01')).toThrow(/no implementation for platform FakePlatform/);
  });

  // Plan 3d Task 0 review (H1/L1): the five helpers above return a MikroORM
  // RawQueryFragment, which stringifies to a literal `?` token and throws at
  // execution when handed into a Kysely statement — verified directly below
  // (the whole reason these Kysely-native twins exist). Task 2 absorbed this
  // finding; DY23 (`ReservationsRepository.restampLinkedReservation`) is the
  // first consumer.

  it('SQLF-048: a MikroORM RawQueryFragment cannot be coerced to a plain string outside the MikroORM QueryBuilder that produced it — the H1 finding, proven directly ([Symbol.toPrimitive]("string") returns an internal Symbol key the QueryBuilder recognises to re-substitute the real SQL text; nothing else, Kysely included, understands that key, which is why the Kysely-native twins below exist instead of reusing this fragment)', () => {
    const platform = t.em.getPlatform();
    const fragment = startsWithIsoDate(platform, 'username');
    expect(typeof fragment[Symbol.toPrimitive]('string')).toBe('symbol');
    expect(() => `${fragment}`).toThrow(TypeError);
  });

  it('SQLF-049: startsWithIsoDateKysely matches the same shapes as startsWithIsoDate (dates, non-dates, letters-in-place-of-digits, empty, NULL)', async () => {
    const platform = t.em.getPlatform();
    const cases: Array<[string | null, boolean]> = [
      ['2026-09-21', true],
      ['2026-09-21T13:05:09Z', true],
      ['not-a-date', false],
      ['2026-1-1', false],
      ['abcd-ef-gh', false],
      ['yyyy-mm-dd', false],
      ['', false],
      [null, false],
    ];
    for (const [value, expected] of cases) {
      const { user } = createUser(testDb);
      testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(value, user.id);

      const row = await t.em.getKysely<UsersKyselyDB>()
        .selectFrom('users')
        .select((eb) => [startsWithIsoDateKysely(platform, eb, 'display_name').as('matched')])
        .where('id', '=', user.id)
        .executeTakeFirstOrThrow();
      expect(Boolean(row.matched)).toBe(expected);

      const raw = testDb
        .prepare(`SELECT (display_name GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*') as matched FROM users WHERE id = ?`)
        .get(user.id) as { matched: number | null };
      expect(Boolean(raw.matched)).toBe(expected);
    }
  });

  it('SQLF-050: an unknown platform fails closed for startsWithIsoDateKysely', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    const eb = expressionBuilder<UsersKyselyDB, 'users'>();
    expect(() => startsWithIsoDateKysely(foreign, eb, 'username')).toThrow(/no implementation for platform FakePlatform/);
  });

  it('SQLF-051: substringKysely(ref, start) — the two-arg form — matches substr(col, N)', async () => {
    const { user } = createUser(testDb, { username: 'kysely-iso-ts' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('2026-09-21T13:05:09Z', user.id);
    const platform = t.em.getPlatform();

    const row = await t.em.getKysely<UsersKyselyDB>()
      .selectFrom('users')
      .select((eb) => [substringKysely(platform, eb, 'display_name', 12).as('n')])
      .where('id', '=', user.id)
      .executeTakeFirstOrThrow();
    expect(row.n).toBe('13:05:09Z');

    const expected = testDb.prepare('SELECT substr(display_name, 12) as n FROM users WHERE id = ?').get(user.id) as { n: string };
    expect(row.n).toBe(expected.n);
  });

  it('SQLF-052: substringKysely(ref, start, length) — the three-arg form — matches substr(col, N, L)', async () => {
    const { user } = createUser(testDb, { username: 'kysely-iso-ts-2' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('2026-09-21T13:05:09Z', user.id);
    const platform = t.em.getPlatform();

    const row = await t.em.getKysely<UsersKyselyDB>()
      .selectFrom('users')
      .select((eb) => [substringKysely(platform, eb, 'display_name', 1, 10).as('n')])
      .where('id', '=', user.id)
      .executeTakeFirstOrThrow();
    expect(row.n).toBe('2026-09-21');

    const expected = testDb.prepare('SELECT substr(display_name, 1, 10) as n FROM users WHERE id = ?').get(user.id) as { n: string };
    expect(row.n).toBe(expected.n);
  });

  it('SQLF-053: substringKysely rejects a non-positive start or a negative length', () => {
    const platform = t.em.getPlatform();
    const eb = expressionBuilder<UsersKyselyDB, 'users'>();
    expect(() => substringKysely(platform, eb, 'username', 0)).toThrow(/1-based integer start/);
    expect(() => substringKysely(platform, eb, 'username', 1.5)).toThrow(/1-based integer start/);
    expect(() => substringKysely(platform, eb, 'username', 1, -1)).toThrow(/non-negative integer length/);
    expect(() => substringKysely(platform, eb, 'username', 1, 1.5)).toThrow(/non-negative integer length/);
  });

  it('SQLF-054: concatKysely renders <col> || <bound-literal> || substringKysely(...), composing a nested Kysely expression (the shape concat() cannot do)', async () => {
    const { user } = createUser(testDb, { username: 'concat-me' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('2026-09-21T13:05', user.id);
    const platform = t.em.getPlatform();

    const row = await t.em.getKysely<UsersKyselyDB>()
      .selectFrom('users')
      .select((eb) => [
        concatKysely(platform, eb, { column: 'username' }, { value: '@' }, { expression: substringKysely(platform, eb, 'display_name', 12) }).as('n'),
      ])
      .where('id', '=', user.id)
      .executeTakeFirstOrThrow();
    expect(row.n).toBe('concat-me@13:05');

    const expected = testDb
      .prepare("SELECT username || ? || substr(display_name, 12) as n FROM users WHERE id = ?")
      .get('@', user.id) as { n: string };
    expect(row.n).toBe(expected.n);
  });

  it('SQLF-055: concatKysely rejects fewer than two parts', () => {
    const platform = t.em.getPlatform();
    const eb = expressionBuilder<UsersKyselyDB, 'users'>();
    expect(() => concatKysely(platform, eb, { column: 'username' })).toThrow(/at least two parts/);
    expect(() => concatKysely(platform, eb)).toThrow(/at least two parts/);
  });

  it('SQLF-056: an unknown platform fails closed for concatKysely and substringKysely', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    const eb = expressionBuilder<UsersKyselyDB, 'users'>();
    expect(() => concatKysely(foreign, eb, { column: 'username' }, { value: 'x' })).toThrow(/no implementation for platform FakePlatform/);
    expect(() => substringKysely(foreign, eb, 'username', 1)).toThrow(/no implementation for platform FakePlatform/);
  });

  it('SQLF-057: castIntegerKysely matches both "14" and "14.0" TEXT rows against a bound INTEGER value (the accommodation_id shape, §18.1)', async () => {
    const platform = t.em.getPlatform();
    const { user: exact } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('14', exact.id);
    const { user: dotZero } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('14.0', dotZero.id);
    const { user: other } = createUser(testDb);
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('15', other.id);

    const rows = await t.em.getKysely<UsersKyselyDB>()
      .selectFrom('users')
      .select('id')
      .where('id', 'in', [exact.id, dotZero.id, other.id])
      .where((eb) => eb(castIntegerKysely(platform, eb, 'display_name'), '=', 14))
      .orderBy('id', 'asc')
      .execute();
    expect(rows.map((r) => r.id)).toEqual([exact.id, dotZero.id]);

    const expected = testDb
      .prepare('SELECT id FROM users WHERE id IN (?, ?, ?) AND CAST(display_name AS INTEGER) = ? ORDER BY id ASC')
      .all(exact.id, dotZero.id, other.id, 14);
    expect(rows).toEqual(expected);
  });

  it('SQLF-058: an unknown platform fails closed for castIntegerKysely', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    const eb = expressionBuilder<UsersKyselyDB, 'users'>();
    expect(() => castIntegerKysely(foreign, eb, 'display_name')).toThrow(/no implementation for platform FakePlatform/);
  });

  it('SQLF-059: DY23\'s exact shape compiles to the expected SQL text (compiled {sql, parameters} capture)', () => {
    const platform = t.em.getPlatform();
    const compiled = t.em.getKysely<UsersKyselyDB>()
      .updateTable('users')
      .set((eb) => ({
        username: eb
          .case()
          .when('username', 'is', null)
          .then(eb.val('2026-09-21'))
          .else(concatKysely(platform, eb, { value: '2026-09-21' }, { expression: substringKysely(platform, eb, 'created_at', 11) }))
          .end(),
      }))
      .where('id', '=', 1)
      .compile();
    expect(compiled.sql).toBe(
      'update "users" set "username" = case when "username" is null then ? else ? || substr("created_at", ?) end where "id" = ?',
    );
    expect(compiled.parameters).toEqual(['2026-09-21', '2026-09-21', 11, 1]);
  });

  // Plan 3f Task 0 (R9) — no consumer yet: Task 2 (collateNoCase), Task 4
  // (nowMinusHours) and Task 1 (lowerTrimParam) wire these in as each
  // converts the statement that needs them. Pinned here so each task imports
  // a tested helper instead of writing one inline.

  it('SQLF-060: collateNoCase renders <col> COLLATE NOCASE, and as a filter key selects the same rows as the legacy value-side spelling (name = ? COLLATE NOCASE)', async () => {
    const { user: mixed } = createUser(testDb, { username: 'MixedCase' });
    const { user: other } = createUser(testDb, { username: 'SomethingElse' });
    const platform = t.em.getPlatform();

    const typed = await t.em.find(Users, { [collateNoCase(platform, 'username')]: 'mixedcase' });
    expect(typed.map((r) => r.id)).toEqual([mixed.id]);

    const legacy = testDb
      .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
      .all('mixedcase') as { id: number }[];
    expect(typed.map((r) => r.id)).toEqual(legacy.map((r) => r.id));

    const none = await t.em.find(Users, { [collateNoCase(platform, 'username')]: 'nobody-has-this-name' });
    expect(none).toEqual([]);
    expect(other.id).toBeDefined(); // seeded so the fixture has more than one row
  });

  it("SQLF-061: COLLATE NOCASE folds the same 26 ASCII letters LOWER() does, and does NOT diverge from LOWER() on SQLF-014's own non-ASCII fixtures — verified directly, not assumed", () => {
    const cases: Array<[string, string]> = [
      ['JOSÉ@x.com', 'josé@x.com'],
      ['ÄNNA@x.com', 'änna@x.com'],
      ['ΣIGMA@x.com', 'σigma@x.com'],
      ['İSTANBUL@x.com', 'i̇stanbul@x.com'],
      ['ASCII@x.com', 'ascii@x.com'],
    ];
    for (const [upper, lower_] of cases) {
      const collateMatch = testDb.prepare('SELECT (? = ? COLLATE NOCASE) as m').get(upper, lower_) as { m: number };
      const lowerMatch = testDb.prepare('SELECT (LOWER(?) = LOWER(?)) as m').get(upper, lower_) as { m: number };
      expect(collateMatch.m).toBe(lowerMatch.m);
    }
    // The ASCII case is the one pair both engines actually fold to equal;
    // every non-ASCII pair above is left unfolded by BOTH engines (neither
    // recognises the Unicode case mapping), which is exactly why they agree
    // rather than diverge — this is genuinely the "no divergence found"
    // branch R9 anticipates, not a skipped check.
    const asciiCollate = testDb.prepare('SELECT (? = ? COLLATE NOCASE) as m').get('ASCII@x.com', 'ascii@x.com') as { m: number };
    expect(asciiCollate.m).toBe(1);
    const nonAsciiCollate = testDb.prepare('SELECT (? = ? COLLATE NOCASE) as m').get('JOSÉ@x.com', 'josé@x.com') as { m: number };
    expect(nonAsciiCollate.m).toBe(0);
  });

  it('SQLF-062: an unknown platform fails closed for collateNoCase', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => collateNoCase(foreign, 'u.name')).toThrow(/no implementation for platform FakePlatform/);
  });

  it("SQLF-063: nowMinusHours renders datetime('now', '-N hours'), matching a JS-computed time within a few seconds' tolerance", async () => {
    const row = testDb.prepare(`SELECT ${nowMinusHours(t.em.getPlatform(), 20).sql} as d`).get() as { d: string };
    const got = new Date(`${row.d.replace(' ', 'T')}Z`).getTime();
    const expected = Date.now() - 20 * 60 * 60 * 1000;
    expect(Math.abs(got - expected)).toBeLessThan(10_000);
  });

  it('SQLF-063b: nowMinusHours(0) is "now", not one hour back', async () => {
    const row = testDb.prepare(`SELECT ${nowMinusHours(t.em.getPlatform(), 0).sql} as d`).get() as { d: string };
    const got = new Date(`${row.d.replace(' ', 'T')}Z`).getTime();
    expect(Math.abs(got - Date.now())).toBeLessThan(10_000);
  });

  it('SQLF-064: nowMinusHours rejects a non-integer or negative hour count', () => {
    expect(() => nowMinusHours(t.em.getPlatform(), 1.5)).toThrow(/non-negative integer hour count/);
    expect(() => nowMinusHours(t.em.getPlatform(), -1)).toThrow(/non-negative integer hour count/);
    expect(() => nowMinusHours(t.em.getPlatform(), Number.NaN)).toThrow(/non-negative integer hour count/);
  });

  it('SQLF-065: an unknown platform fails closed for nowMinusHours', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => nowMinusHours(foreign, 1)).toThrow(/no implementation for platform FakePlatform/);
  });

  it('SQLF-066: lowerTrimParam pairs with lowerTrim to fold BOTH sides in SQLite (the AT31 dedup shape), and a JS-lowered+trimmed bind does NOT match — the mutation-proof for mixing engines', async () => {
    const { user } = createUser(testDb, { username: '  JOSÉ  ' });
    const platform = t.em.getPlatform();

    const exact = await t.em.findOne(Users, { [lowerTrim(platform, 'username')]: lowerTrimParam(platform, '  josÉ  ') });
    expect(exact?.id).toBe(user.id);

    // A JS-lowered+trimmed value-side bind (mixing engines, program rule 18)
    // must NOT match: SQLite's LOWER() leaves 'É' untouched, so the stored,
    // SQL-folded spelling is 'josÉ', not the JS-folded 'josé'.
    const jsLowered = await t.em.findOne(Users, { [lowerTrim(platform, 'username')]: '  josé  '.trim().toLowerCase() });
    expect(jsLowered).toBeNull();

    const none = await t.em.findOne(Users, { [lowerTrim(platform, 'username')]: lowerTrimParam(platform, 'nobody') });
    expect(none).toBeNull();
  });

  it('SQLF-067: an unknown platform fails closed for lowerTrimParam', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => lowerTrimParam(foreign, 'x')).toThrow(/no implementation for platform FakePlatform/);
  });

  // Plan 3g Task 0 (R1) — unixEpochToIsoKysely, the third fallback tier of
  // `GALLERY_CHRONOLOGICAL_ORDER` (journey-gallery-order.ts). No consumer
  // yet: Task 1 (getJourneyFull) and Task 3 (getPublicJourney) each fold this
  // into their own rebuild of the constant. The full composed ORDER BY proof
  // (coalesce + nullif + correlated subquery + this helper, on a seeded
  // gallery) is the describe block below this one.

  it("SQLF-068: unixEpochToIsoKysely renders strftime('%Y-%m-%dT%H:%M:%SZ', <ref> / 1000, 'unixepoch'), matching a raw statement on the SAME fixed value, string-for-string", () => {
    createUser(testDb); // one row so the anchor SELECT FROM users has something to select
    const platform = t.em.getPlatform();
    const createdAt = 1_700_000_000_000; // fixed epoch-millis value — the exact shape gp.created_at stores

    const compiled = t.em.getKysely<UsersKyselyDB>()
      .selectFrom('users')
      .select((eb) => [unixEpochToIsoKysely(platform, eb, eb.val(createdAt)).as('iso')])
      .compile();
    expect(compiled.sql).toBe('select strftime(?, ? / ?, ?) as "iso" from "users"');
    expect(compiled.parameters).toEqual(['%Y-%m-%dT%H:%M:%SZ', createdAt, 1000, 'unixepoch']);

    const got = testDb.prepare(compiled.sql).get(...compiled.parameters) as { iso: string };
    const expected = testDb
      .prepare("SELECT strftime('%Y-%m-%dT%H:%M:%SZ', ? / 1000, 'unixepoch') as iso")
      .get(createdAt) as { iso: string };
    expect(got.iso).toBe(expected.iso);
    expect(got.iso).toBe('2023-11-14T22:13:20Z'); // human-checkable: date -u -d @1700000000
  });

  it('SQLF-069: an unknown platform fails closed for unixEpochToIsoKysely', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    const eb = expressionBuilder<UsersKyselyDB, 'users'>();
    expect(() => unixEpochToIsoKysely(foreign, eb, 'created_at')).toThrow(/no implementation for platform FakePlatform/);
  });

  // Plan 3h Task 0 — no consumer yet: Task 3 (DSY2), Task 4 (RU4), Task 5
  // (DS23/DS26/recordLinkFailure) wire these in as each converts its own
  // statement. Pinned here so each task imports a tested helper instead of
  // writing one inline.

  it("SQLF-071: nowDateOffset renders date('now', '-N days'), matching a JS-computed date within a few seconds' tolerance", async () => {
    const row = testDb.prepare(`SELECT ${nowDateOffset(t.em.getPlatform(), -400).sql} as d`).get() as { d: string };
    const got = new Date(`${row.d}T00:00:00Z`).getTime();
    const expected = Date.now() - 400 * 24 * 60 * 60 * 1000;
    // Compare calendar dates (UTC), not exact millis — date() truncates to a day.
    expect(Math.abs(got - expected)).toBeLessThan(2 * 24 * 60 * 60 * 1000);
    const expectedDate = new Date(expected).toISOString().slice(0, 10);
    expect(row.d).toBe(expectedDate);
  });

  it("SQLF-072: nowDateOffset renders date('now', '+N days') for a positive count, matching DSY2's '+1 day' legacy text (singular) byte-for-byte, not just the helper's own plural spelling", async () => {
    const helperRow = testDb.prepare(`SELECT ${nowDateOffset(t.em.getPlatform(), 1).sql} as d`).get() as { d: string };
    const legacyRow = testDb.prepare(`SELECT date('now', '+1 day') as d`).get() as { d: string };
    expect(helperRow.d).toBe(legacyRow.d);
    const expectedDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(helperRow.d).toBe(expectedDate);
  });

  it('SQLF-073: nowDateOffset(0) is today, not one day off in either direction', () => {
    const row = testDb.prepare(`SELECT ${nowDateOffset(t.em.getPlatform(), 0).sql} as d`).get() as { d: string };
    expect(row.d).toBe(new Date().toISOString().slice(0, 10));
  });

  it('SQLF-074: nowDateOffset rejects a non-integer day count', () => {
    expect(() => nowDateOffset(t.em.getPlatform(), 1.5)).toThrow(/integer day count/);
    expect(() => nowDateOffset(t.em.getPlatform(), Number.NaN)).toThrow(/integer day count/);
  });

  it('SQLF-075: an unknown platform fails closed for nowDateOffset', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => nowDateOffset(foreign, 1)).toThrow(/no implementation for platform FakePlatform/);
  });

  it("SQLF-076: nowPlusSeconds renders datetime('now', '+N seconds'), matching a JS-computed time within a few seconds' tolerance", async () => {
    const row = testDb.prepare(`SELECT ${nowPlusSeconds(t.em.getPlatform(), 30).sql} as d`).get() as { d: string };
    const got = new Date(`${row.d.replace(' ', 'T')}Z`).getTime();
    const expected = Date.now() + 30 * 1000;
    expect(Math.abs(got - expected)).toBeLessThan(10_000);
  });

  it('SQLF-077: nowPlusSeconds(0) is "now", not thirty seconds off', () => {
    const row = testDb.prepare(`SELECT ${nowPlusSeconds(t.em.getPlatform(), 0).sql} as d`).get() as { d: string };
    const got = new Date(`${row.d.replace(' ', 'T')}Z`).getTime();
    expect(Math.abs(got - Date.now())).toBeLessThan(10_000);
  });

  it('SQLF-078: nowPlusSeconds rejects a non-integer or negative second count', () => {
    expect(() => nowPlusSeconds(t.em.getPlatform(), 1.5)).toThrow(/non-negative integer second count/);
    expect(() => nowPlusSeconds(t.em.getPlatform(), -1)).toThrow(/non-negative integer second count/);
    expect(() => nowPlusSeconds(t.em.getPlatform(), Number.NaN)).toThrow(/non-negative integer second count/);
  });

  it('SQLF-079: an unknown platform fails closed for nowPlusSeconds', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    expect(() => nowPlusSeconds(foreign, 1)).toThrow(/no implementation for platform FakePlatform/);
  });

  it("SQLF-080: nowPlusSecondsKysely compiles to datetime(?, ?), matching nowPlusSeconds's own datetime('now', '+N seconds') text shape and runtime value (the DS23/DS26/recordLinkFailure shape, inside a Kysely ON CONFLICT DO UPDATE's CASE WHEN — R3)", async () => {
    createUser(testDb); // one row so the anchor SELECT FROM users has something to select
    const platform = t.em.getPlatform();

    const compiled = t.em.getKysely<UsersKyselyDB>()
      .selectFrom('users')
      .select((eb) => [nowPlusSecondsKysely(platform, eb, 45).as('d')])
      .compile();
    expect(compiled.sql).toBe('select datetime(?, ?) as "d" from "users"');
    expect(compiled.parameters).toEqual(['now', '+45 seconds']);

    const got = testDb.prepare(compiled.sql).get(...compiled.parameters) as { d: string };
    const raw = testDb.prepare(`SELECT ${nowPlusSeconds(platform, 45).sql} as d`).get() as { d: string };
    // Both texts render the same shape; a wide tolerance sidesteps a same-second
    // flake between the two separate statement executions (SQLF-016/063's own
    // convention for every other 'now'-based helper in this file).
    const gotMs = new Date(`${got.d.replace(' ', 'T')}Z`).getTime();
    const rawMs = new Date(`${raw.d.replace(' ', 'T')}Z`).getTime();
    expect(Math.abs(gotMs - rawMs)).toBeLessThan(10_000);
    expect(Math.abs(gotMs - (Date.now() + 45 * 1000))).toBeLessThan(10_000);
  });

  it('SQLF-081: nowPlusSecondsKysely rejects a non-integer or negative second count', () => {
    const eb = expressionBuilder<UsersKyselyDB, 'users'>();
    const platform = t.em.getPlatform();
    expect(() => nowPlusSecondsKysely(platform, eb, 1.5)).toThrow(/non-negative integer second count/);
    expect(() => nowPlusSecondsKysely(platform, eb, -1)).toThrow(/non-negative integer second count/);
  });

  it('SQLF-082: an unknown platform fails closed for nowPlusSecondsKysely', () => {
    class FakePlatform extends Platform {}
    const foreign = new FakePlatform();
    const eb = expressionBuilder<UsersKyselyDB, 'users'>();
    expect(() => nowPlusSecondsKysely(foreign, eb, 1)).toThrow(/no implementation for platform FakePlatform/);
  });

  // Plan 3h Task 5 (doc-sync) — `foundAgainState`, the typed rebuild of
  // `doc-sync.service.ts`'s module-level `FOUND_AGAIN` SQL-text constant
  // (DS2/DS3/DS5/DS12's shared SET clause). A scratch temp table stands in
  // for `document_sync_items` here — the CASE only ever reads the two
  // columns it names, so a two-column probe table exercises its logic
  // exactly, without a trip/connection/link FK chain this file has no other
  // reason to build.
  describe('foundAgainState (doc-sync FOUND_AGAIN)', () => {
    beforeEach(() => {
      testDb.exec('DROP TABLE IF EXISTS found_again_probe');
      testDb.exec('CREATE TEMP TABLE found_again_probe (id INTEGER PRIMARY KEY, state TEXT NOT NULL, file_id INTEGER)');
    });

    function apply(state: string, fileId: number | null): string {
      const platform = t.em.getPlatform();
      testDb.prepare('DELETE FROM found_again_probe WHERE id = 1').run();
      testDb.prepare('INSERT INTO found_again_probe (id, state, file_id) VALUES (1, ?, ?)').run(state, fileId);
      testDb.prepare(`UPDATE found_again_probe SET state = ${foundAgainState(platform, 'state', 'file_id').sql} WHERE id = 1`).run();
      return (testDb.prepare('SELECT state FROM found_again_probe WHERE id = 1').get() as { state: string }).state;
    }

    it("SQLF-083: recovers a row on record as missing once its file is paired again, matching the legacy FOUND_AGAIN text (state='remote_missing' AND file_id IS NOT NULL -> 'synced')", () => {
      expect(apply('remote_missing', 42)).toBe('synced');
    });

    it('SQLF-084: leaves a row on record as missing alone while it has no paired file (a rename/move under a path-as-id provider, not yet re-matched)', () => {
      expect(apply('remote_missing', null)).toBe('remote_missing');
    });

    it('SQLF-085: leaves every other state untouched — error is never silently cleared by FOUND_AGAIN', () => {
      for (const state of ['error', 'conflict', 'synced', 'pending', 'local_deleted']) {
        expect(apply(state, 7)).toBe(state);
      }
    });

    it('SQLF-086: an unknown platform fails closed for foundAgainState', () => {
      class FakePlatform extends Platform {}
      const foreign = new FakePlatform();
      expect(() => foundAgainState(foreign, 'state', 'file_id')).toThrow(/no implementation for platform FakePlatform/);
    });
  });

  // Plan 3h Task 5 (doc-sync, R3) — `currentTimestampKysely`, DS24's
  // `last_seen_at = CURRENT_TIMESTAMP` inside the partial-index `ON
  // CONFLICT ... DO UPDATE`.
  describe('currentTimestampKysely', () => {
    it('SQLF-087: compiles to the bare CURRENT_TIMESTAMP keyword with no parameters, matching currentTimestamp\'s own raw text and a real row\'s clock value', async () => {
      const platform = t.em.getPlatform();
      const compiled = t.em
        .getKysely<UsersKyselyDB>()
        .selectFrom('users')
        .select(() => [currentTimestampKysely(platform).as('d')])
        .compile();
      expect(compiled.sql).toBe('select CURRENT_TIMESTAMP as "d" from "users"');
      expect(compiled.parameters).toEqual([]);

      createUser(testDb);
      const got = testDb.prepare(compiled.sql).get(...compiled.parameters) as { d: string };
      const raw = testDb.prepare(`SELECT ${currentTimestamp(platform).sql} as d`).get() as { d: string };
      expect(Math.abs(new Date(`${got.d.replace(' ', 'T')}Z`).getTime() - new Date(`${raw.d.replace(' ', 'T')}Z`).getTime())).toBeLessThan(10_000);
    });

    it('SQLF-088: current_timestamp() called as a function is rejected by SQLite — proving the bare-keyword shape is load-bearing, not a style choice', () => {
      expect(() => testDb.prepare('SELECT current_timestamp() as d').get()).toThrow(/syntax error/);
    });

    it('SQLF-089: an unknown platform fails closed for currentTimestampKysely', () => {
      class FakePlatform extends Platform {}
      const foreign = new FakePlatform();
      expect(() => currentTimestampKysely(foreign)).toThrow(/no implementation for platform FakePlatform/);
    });
  });
});

/**
 * Plan 3g Task 0 (R1) — the full Kysely rebuild of
 * `journey-gallery-order.ts`'s `GALLERY_CHRONOLOGICAL_ORDER`, as a worked
 * example: `COALESCE(NULLIF(tp.taken_at, ''), <correlated MIN+concat
 * subquery over journey_entry_photos/journey_entries>, <unixEpochToIsoKysely
 * of gp.created_at>) ASC, gp.sort_order ASC, gp.id ASC`. NOT exported from
 * `sql-functions.ts` (only `unixEpochToIsoKysely`, this file's one named
 * deliverable, lives there) — Task 1/Task 3 each own the actual repository
 * method this becomes (`JourneyPhotosRepository`/callers, not yet built);
 * this function is the verbatim builder chain Task 0's report hands them,
 * proven row-order-identical to the legacy SQL text against a seeded
 * gallery here so neither task re-derives it from scratch.
 */
interface GalleryOrderTestDB {
  journey_photos: {
    id: number;
    journey_id: number;
    photo_id: number;
    sort_order: number | null;
    created_at: number;
  };
  trek_photos: {
    id: number;
    taken_at: string | null;
  };
  journey_entry_photos: {
    entry_id: number;
    journey_photo_id: number;
  };
  journey_entries: {
    id: number;
    entry_date: string;
    entry_time: string | null;
  };
}

function galleryChronologicalOrderExpr(
  platform: Platform,
  // Fixed to exactly the shape `.selectFrom('journey_photos as gp')
  // .innerJoin('trek_photos as tp', ...)` itself produces against a
  // `Kysely<GalleryOrderTestDB>` (`GalleryOrderTestDB` plus the derived
  // `gp`/`tp` alias members, read off the SAME interface's own
  // `journey_photos`/`trek_photos` entries) — the `publicStayExists`
  // precedent (`_shared/reservation-visibility.ts`): a table's alias is a
  // property of the QUERY, never of the `DB` interface itself, so a
  // correlated-subquery helper with a fixed alias contract is typed this
  // way rather than generic over an arbitrary caller `DB`/`TB`.
  eb: ExpressionBuilder<GalleryOrderTestDB & { gp: GalleryOrderTestDB['journey_photos']; tp: GalleryOrderTestDB['trek_photos'] }, 'gp' | 'tp'>,
) {
  return eb.fn.coalesce(
    eb.fn<string | null>('nullif', [eb.ref('tp.taken_at'), eb.val('')]),
    eb
      .selectFrom('journey_entry_photos as jep')
      .innerJoin('journey_entries as je', 'je.id', 'jep.entry_id')
      .select((eb2) =>
        eb2.fn
          .min<string | null>(
            concatKysely(
              platform,
              eb2,
              { column: 'je.entry_date' },
              { value: 'T' },
              { expression: eb2.fn.coalesce(eb2.fn<string | null>('nullif', [eb2.ref('je.entry_time'), eb2.val('')]), eb2.val('00:00')) },
            ),
          )
          .as('min_dt'),
      )
      .whereRef('jep.journey_photo_id', '=', 'gp.id'),
    unixEpochToIsoKysely(platform, eb, 'gp.created_at'),
  );
}

describe('GALLERY_CHRONOLOGICAL_ORDER Kysely rebuild (Plan 3g Task 0, R1 worked example)', () => {
  it('SQLF-070: row order matches the legacy GALLERY_CHRONOLOGICAL_ORDER text exactly on a seeded gallery covering all three fallback tiers, ties, NULL/empty taken_at, and entries with/without linked photos', async () => {
    const platform = t.em.getPlatform();
    const { user } = createUser(testDb, { username: 'gallery-owner' });
    const journey = createJourney(testDb, user.id);
    const entryEarly = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-01-05' });
    testDb.prepare('UPDATE journey_entries SET entry_time = ? WHERE id = ?').run('14:30', entryEarly.id);
    const entryNoTime = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-01-05' });
    // entry_time left NULL — the entry-linked tier's own COALESCE(NULIF(entry_time,''),'00:00') fallback

    const trekPhoto = (takenAt: string | null) => {
      const r = testDb.prepare('INSERT INTO trek_photos (provider, asset_id, owner_id, taken_at) VALUES (?, ?, ?, ?)')
        .run('immich', `asset-${Math.random()}`, user.id, takenAt);
      return r.lastInsertRowid as number;
    };
    const galleryPhoto = (photoId: number, createdAt: number, sortOrder: number) => {
      const r = testDb
        .prepare('INSERT INTO journey_photos (journey_id, photo_id, sort_order, created_at) VALUES (?, ?, ?, ?)')
        .run(journey.id, photoId, sortOrder, createdAt);
      return r.lastInsertRowid as number;
    };
    const linkEntry = (entryId: number, journeyPhotoId: number) => {
      testDb
        .prepare('INSERT INTO journey_entry_photos (entry_id, journey_photo_id, created_at) VALUES (?, ?, ?)')
        .run(entryId, journeyPhotoId, Date.now());
    };

    // Tier 1: has a capture time — wins outright regardless of everything else.
    const pCapture = galleryPhoto(trekPhoto('2026-02-01T09:00:00Z'), 1_700_000_000_000, 0);
    // Tier 1 skipped via empty-string NULLIF, not SQL NULL — proves both forms fall through.
    const pEmptyTaken = galleryPhoto(trekPhoto(''), 1_600_000_000_000, 0);
    linkEntry(entryEarly.id, pEmptyTaken); // tier 2: '2026-01-05T14:30'
    // Tier 2 via SQL NULL taken_at, linked to the no-entry-time entry.
    const pNullTaken = galleryPhoto(trekPhoto(null), 1_600_000_000_000, 0);
    linkEntry(entryNoTime.id, pNullTaken); // tier 2: '2026-01-05T00:00'
    // Tier 2, linked to TWO entries — proves the correlated subquery's MIN, not just any match.
    const pMultiEntry = galleryPhoto(trekPhoto(null), 1_600_000_000_000, 0);
    linkEntry(entryEarly.id, pMultiEntry); // '2026-01-05T14:30'
    const entryLater = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-06-01' });
    linkEntry(entryLater.id, pMultiEntry); // '2026-06-01T00:00' — MIN must still pick the earlier one
    // Tier 3: no taken_at, no entry link at all — falls all the way to created_at.
    const pFallbackA = galleryPhoto(trekPhoto(null), 1_650_000_000_000, 5);
    // Tier 3 tie: identical created_at to pFallbackA, broken by sort_order (lower first).
    const pFallbackTieLow = galleryPhoto(trekPhoto(null), 1_650_000_000_000, 1);
    const pFallbackTieHigh = galleryPhoto(trekPhoto(null), 1_650_000_000_000, 1);
    // (pFallbackTieLow/pFallbackTieHigh share BOTH created_at and sort_order —
    // the final id ASC tiebreak must separate them, insertion order = id order.)

    const rows = await t.em
      .getKysely<GalleryOrderTestDB>()
      .selectFrom('journey_photos as gp')
      .innerJoin('trek_photos as tp', 'tp.id', 'gp.photo_id')
      .select('gp.id')
      .where('gp.journey_id', '=', journey.id)
      .orderBy((eb) => galleryChronologicalOrderExpr(platform, eb), 'asc')
      .orderBy('gp.sort_order', 'asc')
      .orderBy('gp.id', 'asc')
      .execute();

    const legacy = testDb
      .prepare(`
        SELECT gp.id
        FROM journey_photos gp JOIN trek_photos tp ON tp.id = gp.photo_id
        WHERE gp.journey_id = ?
        ORDER BY COALESCE(
                   NULLIF(tp.taken_at, ''),
                   (SELECT MIN(je.entry_date || 'T' || COALESCE(NULLIF(je.entry_time, ''), '00:00'))
                      FROM journey_entry_photos jep
                      JOIN journey_entries je ON je.id = jep.entry_id
                     WHERE jep.journey_photo_id = gp.id),
                   strftime('%Y-%m-%dT%H:%M:%SZ', gp.created_at / 1000, 'unixepoch')
                 ) ASC,
                 gp.sort_order ASC,
                 gp.id ASC
      `)
      .all(journey.id) as { id: number }[];

    expect(rows.map((r) => r.id)).toEqual(legacy.map((r) => r.id));
    // Pinned expected order, so a future change to the fixture that happens to
    // keep both queries agreeing (but wrong) still gets caught:
    expect(rows.map((r) => r.id)).toEqual([
      pFallbackTieLow, // tier 3, strftime('2022-04-15T05:20:00Z'), sort_order=1, lower id first
      pFallbackTieHigh, // tier 3, same created_at+sort_order, id tiebreak
      pFallbackA, // tier 3, same created_at, sort_order=5 — sorts after the tier-3 pair above
      pNullTaken, // tier 2, '2026-01-05T00:00' — earliest tier-2 text (entry_time NULL -> '00:00')
      pEmptyTaken, // tier 2, '2026-01-05T14:30'
      pMultiEntry, // tier 2, MIN of two links = '2026-01-05T14:30' (ties pEmptyTaken, id breaks it)
      pCapture, // tier 1, '2026-02-01T09:00:00Z' — a real taken_at always wins tier 1
    ]);
  });
});
