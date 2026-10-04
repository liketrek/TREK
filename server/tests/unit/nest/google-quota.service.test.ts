import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db } from '../../../src/db/database';
import { GoogleQuotaService, GOOGLE_DAILY_LIMIT_SETTING } from '../../../src/nest/google-quota/google-quota.service';
import { GoogleApiUsage } from '../../../src/db/entities/GoogleApiUsage.entity';
import type { GoogleApiUsageRepository } from '../../../src/db/repositories/GoogleApiUsage.repository';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import { createTestAppSettingsRepo, sharedTestOrm } from '../../helpers/test-uow';

/** GQUOTA-001..007 — the daily ceiling on Google API calls (#1582). */

describe('GoogleQuotaService', () => {
  let appSettings: AppSettingsRepository;
  let usage: GoogleApiUsageRepository;
  let quota: GoogleQuotaService;

  beforeAll(async () => {
    appSettings = await createTestAppSettingsRepo(db);
    usage = (await sharedTestOrm(db)).repo(GoogleApiUsage);
  });

  beforeEach(() => {
    db.exec('DELETE FROM google_api_usage');
    db.prepare('DELETE FROM app_settings WHERE key = ?').run(GOOGLE_DAILY_LIMIT_SETTING);
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
    db.prepare("INSERT INTO google_api_usage (day, calls) VALUES (date('now', '-1 day'), 50)").run();
    expect(await quota.usedToday()).toBe(0);
    expect(await quota.exhausted()).toBe(false);
  });

  it('GQUOTA-004: 0 and null remove the ceiling', async () => {
    await quota.setDailyLimit(10);
    expect(db.prepare('SELECT value FROM app_settings WHERE key = ?').get(GOOGLE_DAILY_LIMIT_SETTING)).toEqual({ value: '10' });
    expect((await quota.setDailyLimit(0)).daily_limit).toBeNull();
    await quota.setDailyLimit(10);
    expect((await quota.setDailyLimit(null)).daily_limit).toBeNull();
    expect(db.prepare('SELECT value FROM app_settings WHERE key = ?').get(GOOGLE_DAILY_LIMIT_SETTING)).toBeUndefined();
  });

  it('GQUOTA-005: a stored value that is not a positive number means no ceiling', async () => {
    db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run(GOOGLE_DAILY_LIMIT_SETTING, 'lots');
    expect(await quota.dailyLimit()).toBeNull();
  });

  it('GQUOTA-006: the status prunes days past the retention window', async () => {
    db.prepare("INSERT INTO google_api_usage (day, calls) VALUES (date('now', '-500 days'), 9), (date('now', '-10 days'), 4)").run();
    await quota.status();
    expect(db.prepare('SELECT COUNT(*) AS n FROM google_api_usage').get()).toEqual({ n: 1 });
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
