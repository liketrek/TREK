import type { NoticeCondition, SystemNotice } from './types.js';

import semver from 'semver';

interface ConditionContext {
  user: { login_count: number; first_seen_version: string; role: string; noTrips: number };
  currentAppVersion: string;
  now: Date;
  /**
   * Addon-enablement check, threaded in by the caller (the Nest service passes
   * its injected AddonsService) so this plain module carries no bridge import.
   */
  addonEnabled: (addonId: string) => boolean;
  /** True when somebody other than this install's admin owns its configuration. */
  managed: boolean;
  /**
   * A custom predicate's pre-resolved answer to a question that would
   * otherwise need a DB read — same shape as `addonEnabled`/`managed`: the
   * caller (`SystemNoticesService.getActiveFor`, Plan 3f Task 6/R1) resolves
   * every key a registered `case 'custom'` predicate needs BEFORE calling
   * `evaluate()`, since `evaluateOne` below calls a predicate synchronously
   * inside `SYSTEM_NOTICES.filter(...)`, which cannot `await` a repository
   * read. `registry.ts`'s `whitespace-collision-detected` predicate is the
   * only current reader (`ctx.settingFlag('whitespace_migration_collision')`);
   * this module stays free of any DB import either way.
   */
  settingFlag: (key: string) => boolean;
}

// Custom predicate registry — extensible without modifying this file
const customPredicates = new Map<string, (ctx: ConditionContext) => boolean>();
export function registerPredicate(id: string, fn: (ctx: ConditionContext) => boolean): void {
  customPredicates.set(id, fn);
}

function evaluateOne(condition: NoticeCondition, ctx: ConditionContext): boolean {
  switch (condition.kind) {
    case 'always':
      return true;
    case 'firstLogin':
      // login_count is incremented during login, so on the FIRST post-login fetch it's 1.
      return ctx.user.login_count <= 1;
    case 'noTrips':
      return ctx.user.noTrips === 0;

    case 'existingUserBeforeVersion': {
      // Show to users who existed BEFORE this version was released.
      // Backfilled users have first_seen_version='0.0.0', so all pass semver.lt.
      const userVersion = semver.valid(ctx.user.first_seen_version) ?? '0.0.0';
      const noticeVersion = semver.valid(condition.version);
      if (!noticeVersion) return false;
      // Strip prerelease/build metadata so '3.0.0-pre.42' is treated as '3.0.0'.
      const appVersion = semver.coerce(ctx.currentAppVersion)?.version ?? '0.0.0';
      return semver.lt(userVersion, noticeVersion) && semver.gte(appVersion, noticeVersion);
    }

    case 'dateWindow': {
      const start = new Date(condition.startsAt);
      const end = condition.endsAt ? new Date(condition.endsAt) : null;
      return ctx.now >= start && (end === null || ctx.now <= end);
    }

    case 'role':
      return condition.roles.includes(ctx.user.role as 'admin' | 'user');

    case 'addonEnabled':
      return ctx.addonEnabled(condition.addonId);

    case 'managed':
      return ctx.managed === condition.is;

    case 'custom': {
      const fn = customPredicates.get(condition.id);
      if (!fn) {
        console.warn(`[systemNotices] unknown custom predicate: "${condition.id}"`);
        return false;
      }
      return fn(ctx);
    }

    default:
      return false;
  }
}

/** Returns true only if ALL conditions pass (AND logic). */
export function evaluate(notice: SystemNotice, ctx: ConditionContext): boolean {
  return notice.conditions.every((c) => evaluateOne(c, ctx));
}

export type { ConditionContext };
