import { createRequire } from 'module';
import semver from 'semver';
import { db } from '../db/database.js';
import { SYSTEM_NOTICES } from './registry.js';
import { evaluate } from './conditions.js';
import type { SystemNotice, SystemNoticeDTO } from './types.js';

function getCurrentAppVersion(): string {
  const fromEnv = semver.valid(process.env.APP_VERSION ?? '');
  if (fromEnv) return fromEnv;
  try {
    const pkg = require('../../package.json') as { version?: string };
    return semver.valid(pkg.version ?? '') ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function isNoticeVersionActive(n: SystemNotice, currentAppVersion: string): boolean {
  const appVersion = semver.coerce(currentAppVersion)?.version ?? '0.0.0';
  if (n.minVersion !== undefined) {
    const min = semver.valid(n.minVersion);
    if (!min) { console.warn(`[systemNotices] "${n.id}" invalid minVersion "${n.minVersion}" — skipping`); return false; }
    if (semver.lt(appVersion, min)) return false;
  }
  if (n.maxVersion !== undefined) {
    const max = semver.valid(n.maxVersion);
    if (!max) { console.warn(`[systemNotices] "${n.id}" invalid maxVersion "${n.maxVersion}" — skipping`); return false; }
    if (semver.gte(appVersion, max)) return false;
  }
  return true;
}

function severityWeight(s: string): number {
  return s === 'critical' ? 2 : s === 'warn' ? 1 : 0;
}

export function getActiveNoticesFor(userId: number): SystemNoticeDTO[] {
  const user = db.prepare(
    'SELECT login_count, first_seen_version, role FROM users WHERE id = ?'
  ).get(userId) as { login_count: number; first_seen_version: string; role: string } | undefined;

  if (!user) return [];

  const { count: tripCount } = db.prepare(
    'SELECT COUNT(*) AS count FROM trips WHERE user_id = ?'
  ).get(userId) as { count: number };

  // Dismissals mapped to the app version they were dismissed at (used by per-version notices).
  const dismissals = new Map<string, string | null>(
    (db.prepare('SELECT notice_id, dismissed_app_version FROM user_notice_dismissals WHERE user_id = ?')
      .all(userId) as Array<{ notice_id: string; dismissed_app_version: string | null }>)
      .map(r => [r.notice_id, r.dismissed_app_version])
  );

  const now = new Date();
  const currentAppVersion = getCurrentAppVersion();
  const ctx = { user: { ...user, noTrips: tripCount }, currentAppVersion, now };
  const appVer = semver.coerce(currentAppVersion)?.version ?? '0.0.0';

  const isStillDismissed = (n: SystemNotice): boolean => {
    if (!dismissals.has(n.id)) return false;
    if (n.recurring === 'per-version') {
      // Re-show once the running app version moves past the version it was last dismissed at,
      // so a per-version notice surfaces again on each install/upgrade.
      const dismissedVer = semver.coerce(dismissals.get(n.id) ?? '0.0.0')?.version ?? '0.0.0';
      return semver.gte(dismissedVer, appVer);
    }
    return true; // default: permanent one-time dismissal
  };

  return SYSTEM_NOTICES
    .filter(n => {
      if (isStillDismissed(n)) return false;
      if (!isNoticeVersionActive(n, currentAppVersion)) return false;
      return evaluate(n, ctx);
    })
    .sort((a, b) => {
      const pw = (b.priority ?? 0) - (a.priority ?? 0);
      if (pw !== 0) return pw;
      const sw = severityWeight(b.severity) - severityWeight(a.severity);
      if (sw !== 0) return sw;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .map(({ conditions: _c, publishedAt: _p, minVersion: _mn, maxVersion: _mx, priority: _pr, recurring: _rc, ...dto }) => dto);
}

export function dismissNotice(userId: number, noticeId: string): boolean {
  const exists = SYSTEM_NOTICES.some(n => n.id === noticeId);
  if (!exists) return false;
  // Record the app version at dismissal so per-version notices can re-appear on the next
  // upgrade. Upsert (not INSERT OR IGNORE) so re-dismissing after a bump refreshes the version.
  db.prepare(`
    INSERT INTO user_notice_dismissals (user_id, notice_id, dismissed_at, dismissed_app_version)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, notice_id) DO UPDATE SET
      dismissed_at = excluded.dismissed_at,
      dismissed_app_version = excluded.dismissed_app_version
  `).run(userId, noticeId, Date.now(), getCurrentAppVersion());
  return true;
}
