/**
 * SchedulerLeasesRepository: the lease a cron tick takes so that two
 * processes on one database never run the same tick. LEASE-001 through
 * LEASE-006.
 */
import { SchedulerLeases } from '../../../../src/db/entities/SchedulerLeases.entity';
import type { SchedulerLeasesRepository } from '../../../../src/db/repositories/SchedulerLeases.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { deleteRows } from '../../../helpers/factories/rows';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let leases: SchedulerLeasesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  leases = t.repo(SchedulerLeases);
});
beforeEach(async () => {
  await deleteRows(t, SchedulerLeases);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('SchedulerLeasesRepository.acquire', () => {
  it('LEASE-001: the first process to ask takes a lease nobody holds', async () => {
    expect(await leases.acquire('docsync', 'a', 1_000, 61_000)).toBe(true);
    expect(await leases.holder('docsync')).toEqual({ owner: 'a', expires_at: 61_000 });
  });

  it('LEASE-002: a second process is refused while the lease runs, and the holder is untouched', async () => {
    await leases.acquire('docsync', 'a', 1_000, 61_000);
    expect(await leases.acquire('docsync', 'b', 2_000, 62_000)).toBe(false);
    expect(await leases.holder('docsync')).toEqual({ owner: 'a', expires_at: 61_000 });
  });

  it('LEASE-003: the holder renews its own lease before it runs out', async () => {
    await leases.acquire('docsync', 'a', 1_000, 61_000);
    expect(await leases.acquire('docsync', 'a', 2_000, 62_000)).toBe(true);
    expect(await leases.holder('docsync')).toEqual({ owner: 'a', expires_at: 62_000 });
  });

  it('LEASE-004: an expired lease goes to whoever asks next', async () => {
    await leases.acquire('docsync', 'a', 1_000, 61_000);
    expect(await leases.acquire('docsync', 'b', 61_000, 121_000)).toBe(true);
    expect(await leases.holder('docsync')).toEqual({ owner: 'b', expires_at: 121_000 });
  });

  it('LEASE-005: leases are per job', async () => {
    await leases.acquire('docsync', 'a', 1_000, 61_000);
    expect(await leases.acquire('auto-backup', 'b', 1_000, 61_000)).toBe(true);
  });
});

describe('SchedulerLeasesRepository.extend', () => {
  it('LEASE-006: only the holder moves the expiry', async () => {
    await leases.acquire('docsync', 'a', 1_000, 61_000);
    expect(await leases.extend('docsync', 'b', 99_000)).toBe(false);
    expect(await leases.extend('docsync', 'a', 91_000)).toBe(true);
    expect(await leases.holder('docsync')).toEqual({ owner: 'a', expires_at: 91_000 });
    expect(await leases.holder('never-ran')).toBeNull();
  });
});
