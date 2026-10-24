/**
 * Idempotency key TTL cleanup (H6).
 *
 * The TREK client replays queued mutations with their X-Idempotency-Key on
 * reconnect, so the server must keep keys long enough to cover a realistic
 * offline window — otherwise a key GC'd before the device returns lets the
 * replay create a duplicate. The TTL was raised from 24h to 30d (overridable).
 */
import { IdempotencyKeys } from '../../src/db/entities/IdempotencyKeys.entity';
import type { IdempotencyKeysRepository } from '../../src/db/repositories/IdempotencyKeys.repository';
import { purgeExpiredIdempotencyKeys } from '../../src/nest/common/idempotency-cleanup';
import { IdempotencyCleanupJob } from '../../src/nest/common/idempotency-cleanup.job';
import type { CronRegistrarService } from '../../src/nest/scheduling/cron-registrar.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { countRows, deleteRows, findRows, insertRow } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { createTestOrm, type TestOrm } from '../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

const DAY = 24 * 60 * 60;
const NOW = 2_000_000_000_000; // fixed ms so the test is deterministic
const NOW_SEC = Math.floor(NOW / 1000);

const testDb = createSnapshotTestDb();
let t: TestOrm;
let idempotencyKeys: IdempotencyKeysRepository;
/** The user every fixture key belongs to (the table's user_id is a foreign key). */
let userId: number;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  idempotencyKeys = t.repo(IdempotencyKeys);
  userId = (await makeUser(t)).user.id;
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function insertKey(key: string, ageSeconds: number, nowSec = NOW_SEC): Promise<void> {
  await insertRow(t, IdempotencyKeys, {
    key,
    user: userId,
    method: 'POST',
    path: '/x',
    status_code: 200,
    response_body: '{}',
    created_at: nowSec - ageSeconds,
  });
}

/** The keys left in the table. */
async function remainingKeys(): Promise<string[]> {
  return (await findRows(t, IdempotencyKeys)).map((r) => r.key);
}

beforeEach(async () => {
  await deleteRows(t, IdempotencyKeys);
  t.clear();
});

afterEach(async () => {
  await deleteRows(t, IdempotencyKeys);
  delete process.env.IDEMPOTENCY_TTL_SECONDS;
});

describe('purgeExpiredIdempotencyKeys', () => {
  it('removes keys older than the 30-day default, keeps recent ones', async () => {
    await insertKey('old', 31 * DAY);
    await insertKey('fresh', 5 * DAY);

    const removed = await purgeExpiredIdempotencyKeys(NOW, undefined, idempotencyKeys);

    expect(removed).toBe(1);
    expect(await remainingKeys()).toEqual(['fresh']);
  });

  it('keeps a 25-day-old key that the old 24h TTL would have dropped', async () => {
    await insertKey('offline-trip', 25 * DAY);
    expect(await purgeExpiredIdempotencyKeys(NOW, undefined, idempotencyKeys)).toBe(0);
    expect(await countRows(t, IdempotencyKeys)).toBe(1);
  });

  it('respects the IDEMPOTENCY_TTL_SECONDS override', async () => {
    process.env.IDEMPOTENCY_TTL_SECONDS = String(DAY);
    await insertKey('twoDays', 2 * DAY);
    expect(await purgeExpiredIdempotencyKeys(NOW, undefined, idempotencyKeys)).toBe(1);
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
    const job = new IdempotencyCleanupJob(idempotencyKeys, registrar as unknown as CronRegistrarService);
    return { job, registrar };
  }

  it('registers the nightly 3 AM cron, and stays out of the registry under the test gate', async () => {
    const on = makeJob();
    on.job.onApplicationBootstrap();
    expect(on.registrar.register).toHaveBeenCalledWith('idempotency-cleanup', '0 3 * * *', expect.any(Function));

    // The registered callback IS the tick — drive it once over an empty table
    // (nothing to purge → no log, no throw).
    const onTick = on.registrar.register.mock.calls[0][2];
    await expect(onTick()).resolves.toBeUndefined();

    const off = makeJob(false);
    off.job.onApplicationBootstrap();
    expect(off.registrar.register).not.toHaveBeenCalled();
  });

  it('the tick purges through the injected IdempotencyKeysRepository', async () => {
    // The tick uses the live clock, so these fixtures age against Date.now()
    // (the pure-function cases above pin their own fixed NOW instead).
    const liveNowSec = Math.floor(Date.now() / 1000);
    await insertKey('old', 31 * DAY, liveNowSec);
    await insertKey('fresh', 5 * DAY, liveNowSec);

    const { job } = makeJob();
    await job.tick();
    expect(await remainingKeys()).toEqual(['fresh']);
  });

  it('a failing purge is contained to the Idempotency cleanup log line', async () => {
    const broken = {
      deleteExpired: () => {
        throw new Error('db gone');
      },
    } as unknown as IdempotencyKeysRepository;
    const job = new IdempotencyCleanupJob(broken, { isEnabled: () => true } as unknown as CronRegistrarService);
    await expect(job.tick()).resolves.toBeUndefined();

    // Non-Error throws are stringified rather than crashing the catch itself.
    const brokenString = {
      deleteExpired: () => {
        throw 'db string';
      },
    } as unknown as IdempotencyKeysRepository;
    const job2 = new IdempotencyCleanupJob(brokenString, { isEnabled: () => true } as unknown as CronRegistrarService);
    await expect(job2.tick()).resolves.toBeUndefined();
  });
});
