import { Injectable } from '@nestjs/common';
import type { GoogleQuotaStatus } from '@trek/shared';
import { DatabaseService } from '../database/database.service';

/** The app_settings row holding the admin's ceiling. Absent or 0 means no ceiling. */
export const GOOGLE_DAILY_LIMIT_SETTING = 'google_daily_limit';

/** Counted days kept for the admin's view, a little over a year. */
const RETENTION_DAYS = 400;

/**
 * A daily ceiling on calls to Google's APIs (#1582).
 *
 * Google bills the install that owns the key, and the free allowance runs out
 * without a warning. The admin sets how many calls a day TREK may make; every
 * call through the Places and Routes clients counts, and once the day's count
 * reaches the ceiling the key reads as absent until the day turns over. That
 * is the same state as an install without a key, so search, details and photos
 * fall back to OpenStreetMap on their own instead of failing.
 *
 * Days are UTC days (SQLite's `date('now')`), like the routing counters next
 * door. A call already in flight when the ceiling is reached still lands, so
 * the count can end a call or two above it.
 */
@Injectable()
export class GoogleQuotaService {
  /** The UTC day the "ceiling reached" line was last logged, so it is logged once. */
  private warnedDay: string | null = null;

  constructor(private readonly db: DatabaseService) {}

  dailyLimit(): number | null {
    const raw = this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', GOOGLE_DAILY_LIMIT_SETTING)?.value;
    const limit = Number.parseInt(raw ?? '', 10);
    return Number.isFinite(limit) && limit > 0 ? limit : null;
  }

  usedToday(): number {
    return this.db.get<{ calls: number }>("SELECT calls FROM google_api_usage WHERE day = date('now')")?.calls ?? 0;
  }

  /** True once today's calls have reached the admin's ceiling. */
  exhausted(): boolean {
    const limit = this.dailyLimit();
    if (limit === null) return false;
    const reached = this.usedToday() >= limit;
    if (reached) {
      const today = this.db.get<{ day: string }>("SELECT date('now') AS day")?.day ?? null;
      if (today !== this.warnedDay) {
        this.warnedDay = today;
        console.warn(`[Google API] Daily limit of ${limit} calls reached; Google stays off until the next UTC day.`);
      }
    }
    return reached;
  }

  /** Counts one call against today. */
  record(): void {
    this.db.run(
      `INSERT INTO google_api_usage (day, calls) VALUES (date('now'), 1)
       ON CONFLICT(day) DO UPDATE SET calls = calls + 1`,
    );
  }

  status(): GoogleQuotaStatus {
    this.db.run("DELETE FROM google_api_usage WHERE day < date('now', ?)", `-${RETENTION_DAYS} days`);
    const limit = this.dailyLimit();
    const used = this.usedToday();
    return { daily_limit: limit, used_today: used, exhausted: limit !== null && used >= limit };
  }

  setDailyLimit(limit: number | null): GoogleQuotaStatus {
    if (limit === null || limit <= 0) {
      this.db.run('DELETE FROM app_settings WHERE key = ?', GOOGLE_DAILY_LIMIT_SETTING);
    } else {
      this.db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', GOOGLE_DAILY_LIMIT_SETTING, String(Math.floor(limit)));
    }
    this.warnedDay = null;
    return this.status();
  }
}
