import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { todayUtc, type GoogleQuotaStatus } from '@trek/shared';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { GoogleApiUsage } from '../../db/entities/GoogleApiUsage.entity';
import { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { GoogleApiUsageRepository } from '../../db/repositories/GoogleApiUsage.repository';

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
 * Days are UTC days (`todayUtc()`, the same calendar date as SQLite's
 * `date('now')`), like the routing counters next door. A call already in
 * flight when the ceiling is reached still lands, so the count can end a call
 * or two above it.
 */
@Injectable()
export class GoogleQuotaService {
  /** The UTC day the "ceiling reached" line was last logged, so it is logged once. */
  private warnedDay: string | null = null;

  constructor(
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    @InjectRepository(GoogleApiUsage) private readonly usage: GoogleApiUsageRepository,
  ) {}

  async dailyLimit(): Promise<number | null> {
    const raw = await this.appSettings.getValue(GOOGLE_DAILY_LIMIT_SETTING);
    const limit = Number.parseInt(raw ?? '', 10);
    return Number.isFinite(limit) && limit > 0 ? limit : null;
  }

  async usedToday(): Promise<number> {
    return this.usage.callsOn(todayUtc()); // GQ1
  }

  /** True once today's calls have reached the admin's ceiling. */
  async exhausted(): Promise<boolean> {
    const limit = await this.dailyLimit();
    if (limit === null) return false;
    const reached = (await this.usedToday()) >= limit;
    if (reached) {
      const today = todayUtc();
      if (today !== this.warnedDay) {
        this.warnedDay = today;
        console.warn(`[Google API] Daily limit of ${limit} calls reached; Google stays off until the next UTC day.`);
      }
    }
    return reached;
  }

  /** Counts one call against today. */
  async record(): Promise<void> {
    await this.usage.recordCall(todayUtc()); // GQ2
  }

  async status(): Promise<GoogleQuotaStatus> {
    await this.usage.purgeExpired(RETENTION_DAYS); // GQ3
    const limit = await this.dailyLimit();
    const used = await this.usedToday();
    return { daily_limit: limit, used_today: used, exhausted: limit !== null && used >= limit };
  }

  async setDailyLimit(limit: number | null): Promise<GoogleQuotaStatus> {
    if (limit === null || limit <= 0) {
      await this.appSettings.deleteValue(GOOGLE_DAILY_LIMIT_SETTING);
    } else {
      await this.appSettings.upsertOrReplace(GOOGLE_DAILY_LIMIT_SETTING, String(Math.floor(limit)));
    }
    this.warnedDay = null;
    return this.status();
  }
}
