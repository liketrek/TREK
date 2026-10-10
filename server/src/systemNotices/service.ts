import { readEnv } from '../app-config';
import type { SystemNotice } from './types.js';

import semver from 'semver';

export function getCurrentAppVersion(): string {
  const fromEnv = semver.valid(readEnv().app.appVersion ?? '');
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
    if (!min) {
      console.warn(`[systemNotices] "${n.id}" invalid minVersion "${n.minVersion}" — skipping`);
      return false;
    }
    if (semver.lt(appVersion, min)) return false;
  }
  if (n.maxVersion !== undefined) {
    const max = semver.valid(n.maxVersion);
    if (!max) {
      console.warn(`[systemNotices] "${n.id}" invalid maxVersion "${n.maxVersion}" — skipping`);
      return false;
    }
    if (semver.gte(appVersion, max)) return false;
  }
  return true;
}

/**
 * Sort weight: critical > warn > info. Pure, no DB — kept here per Plan 3f
 * Task 0's R1 wiring plan ("isNoticeVersionActive, getCurrentAppVersion,
 * severityWeight are pure — stay as plain exported functions"), now exported
 * for `SystemNoticesService.getActiveFor` (`nest/system-notices/`), which
 * absorbed the DB-touching `getActiveNoticesFor`/`dismissNotice` that used to
 * live in this file.
 */
export function severityWeight(s: string): number {
  return s === 'critical' ? 2 : s === 'warn' ? 1 : 0;
}
