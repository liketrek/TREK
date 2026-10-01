import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { GoogleQuotaService, GOOGLE_DAILY_LIMIT_SETTING } from '../../../src/nest/google-quota/google-quota.service';

/** GQUOTA-001..007 — the daily ceiling on Google API calls (#1582). */

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE google_api_usage (day TEXT PRIMARY KEY, calls INTEGER NOT NULL DEFAULT 0);
  `);
  return db;
}

function serviceOver(db: Database.Database): GoogleQuotaService {
  const bridge = {
    get: <T>(sql: string, ...p: unknown[]) => db.prepare(sql).get(...p) as T | undefined,
    run: (sql: string, ...p: unknown[]) => db.prepare(sql).run(...p),
  };
  return new GoogleQuotaService(bridge as never);
}

describe('GoogleQuotaService', () => {
  let db: Database.Database;
  let quota: GoogleQuotaService;

  beforeEach(() => {
    db = makeDb();
    quota = serviceOver(db);
  });

  it('GQUOTA-001: without a ceiling nothing is ever exhausted, and calls are still counted', () => {
    for (let i = 0; i < 3; i++) quota.record();
    expect(quota.dailyLimit()).toBeNull();
    expect(quota.exhausted()).toBe(false);
    expect(quota.status()).toEqual({ daily_limit: null, used_today: 3, exhausted: false });
  });

  it('GQUOTA-002: the key reads as spent once today reaches the ceiling', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    quota.setDailyLimit(2);
    quota.record();
    expect(quota.exhausted()).toBe(false);
    quota.record();
    expect(quota.exhausted()).toBe(true);
    expect(quota.exhausted()).toBe(true);
    // Logged once a day, not on every request that finds the door shut.
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('GQUOTA-003: yesterday does not count against today', () => {
    quota.setDailyLimit(1);
    db.prepare("INSERT INTO google_api_usage (day, calls) VALUES (date('now', '-1 day'), 50)").run();
    expect(quota.usedToday()).toBe(0);
    expect(quota.exhausted()).toBe(false);
  });

  it('GQUOTA-004: 0 and null remove the ceiling', () => {
    quota.setDailyLimit(10);
    expect(db.prepare('SELECT value FROM app_settings WHERE key = ?').get(GOOGLE_DAILY_LIMIT_SETTING)).toEqual({ value: '10' });
    expect(quota.setDailyLimit(0).daily_limit).toBeNull();
    quota.setDailyLimit(10);
    expect(quota.setDailyLimit(null).daily_limit).toBeNull();
    expect(db.prepare('SELECT value FROM app_settings WHERE key = ?').get(GOOGLE_DAILY_LIMIT_SETTING)).toBeUndefined();
  });

  it('GQUOTA-005: a stored value that is not a positive number means no ceiling', () => {
    db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run(GOOGLE_DAILY_LIMIT_SETTING, 'lots');
    expect(quota.dailyLimit()).toBeNull();
  });

  it('GQUOTA-006: the status prunes days past the retention window', () => {
    db.prepare("INSERT INTO google_api_usage (day, calls) VALUES (date('now', '-500 days'), 9), (date('now', '-10 days'), 4)").run();
    quota.status();
    expect(db.prepare('SELECT COUNT(*) AS n FROM google_api_usage').get()).toEqual({ n: 1 });
  });

  it('GQUOTA-007: raising the ceiling reopens the day at once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    quota.setDailyLimit(1);
    quota.record();
    expect(quota.exhausted()).toBe(true);
    expect(quota.setDailyLimit(5)).toEqual({ daily_limit: 5, used_today: 1, exhausted: false });
    warn.mockRestore();
  });
});
