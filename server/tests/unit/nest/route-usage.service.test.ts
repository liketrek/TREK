import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { RouteUsageService, RETENTION_DAYS } from '../../../src/nest/route-usage/route-usage.service';
import type { RouteUsageEntry } from '@trek/shared';

/**
 * SRV-ROUTEUSAGE-001..010 — the counters behind "could TREK host a router".
 *
 * Aggregates, not a log: the same day and kind adds onto one row, and the summary
 * turns those rows into the two figures the decision needs, requests on an average
 * day and requests on the busiest one.
 */

function makeDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE route_usage_daily (
      day TEXT NOT NULL, profile TEXT NOT NULL, surface TEXT NOT NULL,
      self_hosted INTEGER NOT NULL, requests INTEGER NOT NULL DEFAULT 0,
      waypoints INTEGER NOT NULL DEFAULT 0, km REAL NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, profile, surface, self_hosted)
    );
  `);
  return db;
}

/** The slice of DatabaseService this domain uses. */
function serviceOver(db: Database.Database): RouteUsageService {
  const bridge = {
    get: <T>(sql: string, ...p: unknown[]) => db.prepare(sql).get(...p) as T | undefined,
    all: <T>(sql: string, ...p: unknown[]) => db.prepare(sql).all(...p) as T[],
    run: (sql: string, ...p: unknown[]) => db.prepare(sql).run(...p),
    transaction: <T>(fn: () => T) => db.transaction(fn)(),
  };
  return new RouteUsageService(bridge as never);
}

const entry = (over: Partial<RouteUsageEntry> = {}): RouteUsageEntry => ({
  profile: 'driving', surface: 'legs', selfHosted: false,
  requests: 1, waypoints: 3, km: 100, failed: 0, ...over,
});

describe('RouteUsageService', () => {
  let db: Database.Database;
  let svc: RouteUsageService;

  beforeEach(() => {
    db = makeDb();
    svc = serviceOver(db);
  });

  it('SRV-ROUTEUSAGE-001: counting is on unless an operator turned it off', () => {
    expect(svc.enabled()).toBe(true);
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('route_usage_enabled', 'false')").run();
    expect(svc.enabled()).toBe(false);
  });

  it('SRV-ROUTEUSAGE-002: a switched-off instance records nothing and says so', () => {
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('route_usage_enabled', 'false')").run();
    expect(svc.record({ entries: [entry()] })).toBe(false);
    expect(db.prepare('SELECT COUNT(*) c FROM route_usage_daily').get()).toEqual({ c: 0 });
  });

  it('SRV-ROUTEUSAGE-003: a batch adds onto one row per day, profile, kind and engine', () => {
    svc.record({ entries: [entry({ requests: 5, waypoints: 12, km: 300, failed: 1 })] });
    svc.record({ entries: [entry({ requests: 3, waypoints: 6, km: 150, failed: 0 })] });

    const rows = svc.rows();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ requests: 8, waypoints: 18, km: 450, failed: 1 });
  });

  it('SRV-ROUTEUSAGE-004: a different kind or engine is its own row', () => {
    svc.record({ entries: [
      entry({ surface: 'legs' }),
      entry({ surface: 'alternatives' }),
      entry({ surface: 'legs', selfHosted: true }),
      entry({ surface: 'legs', profile: 'walking' }),
    ] });
    expect(svc.rows()).toHaveLength(4);
  });

  it('SRV-ROUTEUSAGE-005: an empty corpus answers with zeroes rather than nothing', () => {
    const s = svc.summary();
    expect(s.totalRequests).toBe(0);
    expect(s.daysCovered).toBe(0);
    expect(s.busiestDay).toBeNull();
    expect(s.enabled).toBe(true);
    expect(s.retentionDays).toBe(RETENTION_DAYS);
  });

  it('SRV-ROUTEUSAGE-006: the summary carries the per-day average and the busiest day', () => {
    // Two days by hand: the service always writes "today", so the spread is set here.
    db.prepare(`INSERT INTO route_usage_daily VALUES ('2026-09-01','driving','legs',0,10,30,900,0)`).run();
    db.prepare(`INSERT INTO route_usage_daily VALUES ('2026-09-02','driving','legs',0,30,60,1800,2)`).run();

    const s = svc.summary();
    expect(s.totalRequests).toBe(40);
    expect(s.totalFailed).toBe(2);
    expect(s.daysCovered).toBe(2);
    expect(s.requestsPerDay).toBe(20);
    expect(s.busiestDay).toBe('2026-09-02');
    expect(s.busiestDayRequests).toBe(30);
    expect(s.firstDay).toBe('2026-09-01');
    expect(s.lastDay).toBe('2026-09-02');
  });

  it('SRV-ROUTEUSAGE-007: mean waypoints and kilometres are per request, not per row', () => {
    db.prepare(`INSERT INTO route_usage_daily VALUES ('2026-09-01','driving','legs',0,4,20,400,0)`).run();
    const s = svc.summary();
    expect(s.waypointsPerRequest).toBe(5);
    expect(s.kmPerRequest).toBe(100);
  });

  it('SRV-ROUTEUSAGE-008: the self-hosted share is the part already off the public hosts', () => {
    db.prepare(`INSERT INTO route_usage_daily VALUES ('2026-09-01','driving','legs',0,30,0,0,0)`).run();
    db.prepare(`INSERT INTO route_usage_daily VALUES ('2026-09-01','driving','legs',1,10,0,0,0)`).run();
    expect(svc.summary().selfHostedShare).toBe(0.25);
  });

  it('SRV-ROUTEUSAGE-009: retention drops days past the window and keeps the rest', () => {
    db.prepare(`INSERT INTO route_usage_daily VALUES (date('now','-1 day'),'driving','legs',0,1,0,0,0)`).run();
    db.prepare(`INSERT INTO route_usage_daily VALUES (date('now','-${RETENTION_DAYS + 5} days'),'driving','legs',0,1,0,0,0)`).run();

    expect(svc.purgeExpired()).toBe(1);
    expect(svc.rows()).toHaveLength(1);
  });

  it('SRV-ROUTEUSAGE-010: clearing wipes every counter', () => {
    svc.record({ entries: [entry(), entry({ surface: 'route' })] });
    expect(svc.clear()).toBe(2);
    expect(svc.rows()).toHaveLength(0);
  });
});
