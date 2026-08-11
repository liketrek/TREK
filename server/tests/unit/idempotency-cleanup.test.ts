/**
 * Idempotency key TTL cleanup (H6).
 *
 * The TREK client replays queued mutations with their X-Idempotency-Key on
 * reconnect, so the server must keep keys long enough to cover a realistic
 * offline window — otherwise a key GC'd before the device returns lets the
 * replay create a duplicate. The TTL was raised from 24h to 30d (overridable).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '../../src/db/database';
import { purgeExpiredIdempotencyKeys } from '../../src/nest/common/idempotency-cleanup';
import { IdempotencyCleanupJob } from '../../src/nest/common/idempotency-cleanup.job';
import { DatabaseService } from '../../src/nest/database/database.service';
import type { CronRegistrarService } from '../../src/nest/scheduling/cron-registrar.service';

const DAY = 24 * 60 * 60;
const NOW = 2_000_000_000_000; // fixed ms so the test is deterministic
const NOW_SEC = Math.floor(NOW / 1000);

function insertKey(key: string, ageSeconds: number): void {
  db.prepare(
    `INSERT INTO idempotency_keys (key, user_id, method, path, status_code, response_body, created_at)
     VALUES (?, 1, 'POST', '/x', 200, '{}', ?)`,
  ).run(key, NOW_SEC - ageSeconds);
}

beforeEach(() => {
  db.pragma('foreign_keys = OFF'); // fixtures reference a user we don't seed here
  db.prepare('DELETE FROM idempotency_keys').run();
});

afterEach(() => {
  db.prepare('DELETE FROM idempotency_keys').run();
  db.pragma('foreign_keys = ON');
  delete process.env.IDEMPOTENCY_TTL_SECONDS;
});

describe('purgeExpiredIdempotencyKeys', () => {
  it('removes keys older than the 30-day default, keeps recent ones', () => {
    insertKey('old', 31 * DAY);
    insertKey('fresh', 5 * DAY);

    const removed = purgeExpiredIdempotencyKeys(NOW, undefined, db);

    expect(removed).toBe(1);
    const keys = db.prepare('SELECT key FROM idempotency_keys').all().map((r: { key: string }) => r.key);
    expect(keys).toEqual(['fresh']);
  });

  it('keeps a 25-day-old key that the old 24h TTL would have dropped', () => {
    insertKey('offline-trip', 25 * DAY);
    expect(purgeExpiredIdempotencyKeys(NOW, undefined, db)).toBe(0);
    expect(db.prepare('SELECT COUNT(*) c FROM idempotency_keys').get()).toMatchObject({ c: 1 });
  });

  it('respects the IDEMPOTENCY_TTL_SECONDS override', () => {
    process.env.IDEMPOTENCY_TTL_SECONDS = String(DAY);
    insertKey('twoDays', 2 * DAY);
    expect(purgeExpiredIdempotencyKeys(NOW, undefined, db)).toBe(1);
  });
});

describe('IdempotencyCleanupJob', () => {
  function makeJob(enabled = true) {
    const registrar = {
      isEnabled: vi.fn(() => enabled),
      // Spelled out rather than vi.fn(() => enabled), because the test below
      // reads the third argument back off mock.calls: a no-parameter stub types
      // every recorded call as [], and indexing it fails typecheck:tests.
      register: vi.fn((_name: string, _expression: string, _onTick: () => void | Promise<void>) => enabled),
      unregister: vi.fn(),
    };
    const job = new IdempotencyCleanupJob(new DatabaseService(db), registrar as unknown as CronRegistrarService);
    return { job, registrar };
  }

  it('registers the nightly 3 AM cron, and stays out of the registry under the test gate', () => {
    const on = makeJob();
    on.job.onApplicationBootstrap();
    expect(on.registrar.register).toHaveBeenCalledWith('idempotency-cleanup', '0 3 * * *', expect.any(Function));

    // The registered callback IS the tick — drive it once over an empty table
    // (nothing to purge → no log, no throw).
    const onTick = on.registrar.register.mock.calls[0][2];
    expect(() => onTick()).not.toThrow();

    const off = makeJob(false);
    off.job.onApplicationBootstrap();
    expect(off.registrar.register).not.toHaveBeenCalled();
  });

  it('the tick purges through the injected DatabaseService', () => {
    // The tick uses the live clock, so these fixtures age against Date.now()
    // (the pure-function cases above pin their own fixed NOW instead).
    const liveNowSec = Math.floor(Date.now() / 1000);
    const liveInsert = (key: string, ageSeconds: number) =>
      db.prepare(
        `INSERT INTO idempotency_keys (key, user_id, method, path, status_code, response_body, created_at)
         VALUES (?, 1, 'POST', '/x', 200, '{}', ?)`,
      ).run(key, liveNowSec - ageSeconds);
    liveInsert('old', 31 * DAY);
    liveInsert('fresh', 5 * DAY);

    const { job } = makeJob();
    job.tick();
    const keys = db.prepare('SELECT key FROM idempotency_keys').all().map((r: { key: string }) => r.key);
    expect(keys).toEqual(['fresh']);
  });

  it('a failing purge is contained to the Idempotency cleanup log line', () => {
    const broken = { prepare: () => { throw new Error('db gone'); } } as unknown as DatabaseService;
    const job = new IdempotencyCleanupJob(broken, { isEnabled: () => true } as unknown as CronRegistrarService);
    expect(() => job.tick()).not.toThrow();

    // Non-Error throws are stringified rather than crashing the catch itself.
    const brokenString = { prepare: () => { throw 'db string'; } } as unknown as DatabaseService;
    const job2 = new IdempotencyCleanupJob(brokenString, { isEnabled: () => true } as unknown as CronRegistrarService);
    expect(() => job2.tick()).not.toThrow();
  });
});
