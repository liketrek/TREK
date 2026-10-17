import { db } from '../../../src/db/database';
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { GoogleApiUsage } from '../../../src/db/entities/GoogleApiUsage.entity';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { GoogleApiUsageRepository } from '../../../src/db/repositories/GoogleApiUsage.repository';
import { GoogleQuotaService, GOOGLE_DAILY_LIMIT_SETTING } from '../../../src/nest/google-quota/google-quota.service';
import { countRows, deleteRows, findRow, insertRow, insertRows } from '../../helpers/factories/rows';
import { readAppSetting } from '../../helpers/factories/settings';
import { createTestAppSettingsRepo, sharedTestOrm } from '../../helpers/test-uow';

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

/** The UTC calendar day `days` before today, the text SQLite's date('now', '-N days') gives. */
const utcDaysAgo = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

/** GQUOTA-001..007 — the daily ceiling on Google API calls (#1582). */

describe('GoogleQuotaService', () => {
  let appSettings: AppSettingsRepository;
  let usage: GoogleApiUsageRepository;
  let quota: GoogleQuotaService;

  beforeAll(async () => {
    appSettings = await createTestAppSettingsRepo(db);
    usage = (await sharedTestOrm(db)).repo(GoogleApiUsage);
  });

  beforeEach(async () => {
    await deleteRows(await sharedTestOrm(db), GoogleApiUsage);
    await deleteRows(await sharedTestOrm(db), AppSettings, { key: GOOGLE_DAILY_LIMIT_SETTING });
    // A fresh service per case, so the once-a-day warning state starts clean.
    quota = new GoogleQuotaService(appSettings, usage);
  });

  afterAll(() => {
    db.close();
  });

  it('GQUOTA-001: without a ceiling nothing is ever exhausted, and calls are still counted', async () => {
    for (let i = 0; i < 3; i++) await quota.record();
    expect(await quota.dailyLimit()).toBeNull();
    expect(await quota.exhausted()).toBe(false);
    expect(await quota.status()).toEqual({ daily_limit: null, used_today: 3, exhausted: false });
  });

  it('GQUOTA-002: the key reads as spent once today reaches the ceiling', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await quota.setDailyLimit(2);
    await quota.record();
    expect(await quota.exhausted()).toBe(false);
    await quota.record();
    expect(await quota.exhausted()).toBe(true);
    expect(await quota.exhausted()).toBe(true);
    // Logged once a day, not on every request that finds the door shut.
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('GQUOTA-003: yesterday does not count against today', async () => {
    await quota.setDailyLimit(1);
    await insertRow(await sharedTestOrm(db), GoogleApiUsage, { day: utcDaysAgo(1), calls: 50 });
    expect(await quota.usedToday()).toBe(0);
    expect(await quota.exhausted()).toBe(false);
  });

  it('GQUOTA-004: 0 and null remove the ceiling', async () => {
    await quota.setDailyLimit(10);
    expect(await readAppSetting(await sharedTestOrm(db), GOOGLE_DAILY_LIMIT_SETTING)).toBe('10');
    expect((await quota.setDailyLimit(0)).daily_limit).toBeNull();
    await quota.setDailyLimit(10);
    expect((await quota.setDailyLimit(null)).daily_limit).toBeNull();
    expect(await findRow(await sharedTestOrm(db), AppSettings, { key: GOOGLE_DAILY_LIMIT_SETTING })).toBeNull();
  });

  it('GQUOTA-005: a stored value that is not a positive number means no ceiling', async () => {
    await insertRow(await sharedTestOrm(db), AppSettings, { key: GOOGLE_DAILY_LIMIT_SETTING, value: 'lots' });
    expect(await quota.dailyLimit()).toBeNull();
  });

  it('GQUOTA-006: the status prunes days past the retention window', async () => {
    await insertRows(await sharedTestOrm(db), GoogleApiUsage, [
      { day: utcDaysAgo(500), calls: 9 },
      { day: utcDaysAgo(10), calls: 4 },
    ]);
    await quota.status();
    expect(await countRows(await sharedTestOrm(db), GoogleApiUsage)).toBe(1);
  });

  it('GQUOTA-007: raising the ceiling reopens the day at once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await quota.setDailyLimit(1);
    await quota.record();
    expect(await quota.exhausted()).toBe(true);
    expect(await quota.setDailyLimit(5)).toEqual({ daily_limit: 5, used_today: 1, exhausted: false });
    warn.mockRestore();
  });
});
