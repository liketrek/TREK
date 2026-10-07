import { AppSettings } from '../../db/entities/AppSettings.entity';
import { RouteUsageDaily } from '../../db/entities/RouteUsageDaily.entity';
import { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { RouteUsageDailyRepository } from '../../db/repositories/RouteUsageDaily.repository';
import { UnitOfWork } from '../database/unit-of-work';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type {
  RouteUsageDayRow,
  RouteUsageProfile,
  RouteUsageReportRequest,
  RouteUsageSummaryResult,
  RouteUsageSurface,
} from '@trek/shared';
import { todayUtc } from '@trek/shared';

/** Days a counted day survives. Aggregates are tiny, so this is a year and a bit. */
export const RETENTION_DAYS = 400;

/** Days returned in the summary's own series, newest first. */
export const SERIES_DAYS = 90;

/**
 * Route usage counters.
 *
 * All routing happens in the browser, so the server never sees a route request and
 * cannot count one. The client keeps a small tally and posts it in batches; this
 * adds those batches onto the day's row.
 *
 * On by default, unlike the shadow log next door. That log stores what people typed,
 * so silence is the safe default; this stores four integers about a day with nothing
 * in them that could belong to anybody, and it is worthless unless it is already
 * running by the time the question comes up. An operator who wants none of it sets
 * `route_usage_enabled` to `false`.
 */
@Injectable()
export class RouteUsageService {
  constructor(
    @InjectRepository(RouteUsageDaily) private readonly routeUsageRepo: RouteUsageDailyRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async enabled(): Promise<boolean> {
    const value = await this.appSettings.getValue('route_usage_enabled');
    // Absent means on: the counters have to be collecting before anyone thinks to
    // look for them, and there is nothing here to protect.
    return value !== 'false';
  }

  /**
   * Adds a batch onto today's rows. Returns whether anything was written, so a
   * switched-off instance answers 200 rather than an error the client would log on
   * every flush.
   *
   * RU2/R4: `RouteUsageDailyRepository.record`'s Kysely `onConflict(...)
   * .doUpdateSet(...)` upsert is ADDITIVE (`requests = requests +
   * excluded.requests`, …), not a blind overwrite — see that method's own
   * docstring. `today` is resolved ONCE per batch (`todayUtc()`, the 3f
   * bare-`date('now')` precedent), not re-derived per entry.
   */
  async record(report: RouteUsageReportRequest): Promise<boolean> {
    if (!(await this.enabled())) return false;
    const today = todayUtc();
    // One transaction for the batch: a flush is a handful of rows, and a partial
    // one would leave a day counted twice on the client's next retry.
    await this.uow.transactional(async () => {
      for (const entry of report.entries) {
        await this.routeUsageRepo.record({
          day: today,
          profile: entry.profile,
          surface: entry.surface,
          self_hosted: entry.selfHosted ? 1 : 0,
          requests: entry.requests,
          waypoints: entry.waypoints,
          km: Math.round(entry.km),
          failed: entry.failed,
        });
      }
    });
    return true;
  }

  async rows(): Promise<RouteUsageDayRow[]> {
    const rows = await this.routeUsageRepo.rows();
    return rows.map((r) => ({
      day: r.day,
      profile: r.profile as RouteUsageProfile,
      surface: r.surface as RouteUsageSurface,
      selfHosted: r.self_hosted === 1,
      requests: r.requests,
      waypoints: r.waypoints,
      km: r.km,
      failed: r.failed,
    }));
  }

  async summary(): Promise<RouteUsageSummaryResult> {
    const rows = await this.rows();
    const enabled = await this.enabled();
    const empty: RouteUsageSummaryResult = {
      enabled,
      retentionDays: RETENTION_DAYS,
      daysCovered: 0,
      firstDay: null,
      lastDay: null,
      totalRequests: 0,
      totalFailed: 0,
      requestsPerDay: 0,
      busiestDay: null,
      busiestDayRequests: 0,
      waypointsPerRequest: 0,
      kmPerRequest: 0,
      byProfile: [],
      bySurface: [],
      selfHostedShare: 0,
      days: [],
    };
    if (!rows.length) return empty;

    const perDay = new Map<string, number>();
    const perProfile = new Map<RouteUsageProfile, number>();
    const perSurface = new Map<RouteUsageSurface, number>();
    let requests = 0;
    let failed = 0;
    let waypoints = 0;
    let km = 0;
    let selfHosted = 0;

    for (const row of rows) {
      requests += row.requests;
      failed += row.failed;
      waypoints += row.waypoints;
      km += row.km;
      if (row.selfHosted) selfHosted += row.requests;
      perDay.set(row.day, (perDay.get(row.day) ?? 0) + row.requests);
      perProfile.set(row.profile, (perProfile.get(row.profile) ?? 0) + row.requests);
      perSurface.set(row.surface, (perSurface.get(row.surface) ?? 0) + row.requests);
    }

    // Days come back newest first, so the last one is the earliest counted day.
    const days = [...perDay.entries()].map(([day, count]) => ({ day, requests: count }));
    const busiest = days.reduce((a, b) => (b.requests > a.requests ? b : a), days[0]);
    const ratio = (part: number) => (requests > 0 ? Math.round((part / requests) * 1000) / 1000 : 0);
    const per = (total: number) => (requests > 0 ? Math.round((total / requests) * 100) / 100 : 0);

    return {
      enabled,
      retentionDays: RETENTION_DAYS,
      daysCovered: perDay.size,
      firstDay: rows[rows.length - 1].day,
      lastDay: rows[0].day,
      totalRequests: requests,
      totalFailed: failed,
      requestsPerDay: perDay.size > 0 ? Math.round((requests / perDay.size) * 10) / 10 : 0,
      busiestDay: busiest.day,
      busiestDayRequests: busiest.requests,
      waypointsPerRequest: per(waypoints),
      kmPerRequest: per(km),
      byProfile: [...perProfile.entries()].map(([profile, count]) => ({ profile, requests: count })),
      bySurface: [...perSurface.entries()].map(([surface, count]) => ({ surface, requests: count })),
      selfHostedShare: ratio(selfHosted),
      days: days.slice(0, SERIES_DAYS),
    };
  }

  /** Removes days past the retention window. Returns how many rows went. */
  async purgeExpired(): Promise<number> {
    return this.routeUsageRepo.purgeExpired(RETENTION_DAYS);
  }

  /** Wipes every counter. The admin's own "start over". */
  async clear(): Promise<number> {
    return this.routeUsageRepo.clear();
  }
}
