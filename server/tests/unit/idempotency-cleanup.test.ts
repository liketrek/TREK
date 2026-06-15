/**
 * Idempotency key TTL cleanup (H6).
 *
 * The TREK client replays queued mutations with their X-Idempotency-Key on
 * reconnect, so the server must keep keys long enough to cover a realistic
 * offline window — otherwise a key GC'd before the device returns lets the
 * replay create a duplicate. The TTL was raised from 24h to 30d (overridable).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../src/db/database';
import { purgeExpiredIdempotencyKeys } from '../../src/scheduler';

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
