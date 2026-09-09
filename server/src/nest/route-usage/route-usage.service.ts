import { Injectable } from '@nestjs/common';
import type {
  RouteUsageDayRow,
  RouteUsageProfile,
  RouteUsageReportRequest,
  RouteUsageSummaryResult,
  RouteUsageSurface,
} from '@trek/shared';
import { DatabaseService } from '../database/database.service';

/** Days a counted day survives. Aggregates are tiny, so this is a year and a bit. */
export const RETENTION_DAYS = 400;

/** Days returned in the summary's own series, newest first. */
export const SERIES_DAYS = 90;

interface DbRow {
  day: string;
  profile: string;
  surface: string;
  self_hosted: number;
  requests: number;
  waypoints: number;
  km: number;
  failed: number;
}

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
  constructor(private readonly db: DatabaseService) {}

  enabled(): boolean {
    const row = this.db.get<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'route_usage_enabled'",
    );
    // Absent means on: the counters have to be collecting before anyone thinks to
    // look for them, and there is nothing here to protect.
    return row?.value !== 'false';
  }

  /**
   * Adds a batch onto today's rows. Returns whether anything was written, so a
   * switched-off instance answers 200 rather than an error the client would log on
   * every flush.
   */
  record(report: RouteUsageReportRequest): boolean {
    if (!this.enabled()) return false;
    // One transaction for the batch: a flush is a handful of rows, and a partial
    // one would leave a day counted twice on the client's next retry.
    this.db.transaction(() => {
      for (const entry of report.entries) {
        this.db.run(
          `INSERT INTO route_usage_daily (day, profile, surface, self_hosted, requests, waypoints, km, failed)
           VALUES (date('now'), ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(day, profile, surface, self_hosted) DO UPDATE SET
             requests = requests + excluded.requests,
             waypoints = waypoints + excluded.waypoints,
             km = km + excluded.km,
             failed = failed + excluded.failed`,
          entry.profile,
          entry.surface,
          entry.selfHosted ? 1 : 0,
          entry.requests,
          entry.waypoints,
          Math.round(entry.km),
          entry.failed,
        );
      }
    });
    return true;
  }

  rows(): RouteUsageDayRow[] {
    const rows = this.db.all<DbRow>(
      'SELECT * FROM route_usage_daily ORDER BY day DESC, profile, surface',
    );
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

  summary(): RouteUsageSummaryResult {
    const rows = this.rows();
    const enabled = this.enabled();
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
  purgeExpired(): number {
    const result = this.db.run(
      `DELETE FROM route_usage_daily WHERE day < date('now', ?)`,
      `-${RETENTION_DAYS} days`,
    );
    return result.changes ?? 0;
  }

  /** Wipes every counter. The admin's own "start over". */
  clear(): number {
    const result = this.db.run('DELETE FROM route_usage_daily');
    return result.changes ?? 0;
  }
}
