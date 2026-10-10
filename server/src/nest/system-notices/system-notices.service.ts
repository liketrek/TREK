import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { UserNoticeDismissals } from '../../db/entities/UserNoticeDismissals.entity';
import { Users } from '../../db/entities/Users.entity';
import { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { TripsRepository } from '../../db/repositories/Trips.repository';
import { UserNoticeDismissalsRepository } from '../../db/repositories/UserNoticeDismissals.repository';
import { UsersRepository } from '../../db/repositories/Users.repository';
import { evaluate } from '../../systemNotices/conditions';
import { SYSTEM_NOTICES } from '../../systemNotices/registry';
import { getCurrentAppVersion, isNoticeVersionActive, severityWeight } from '../../systemNotices/service';
import type { SystemNotice } from '../../systemNotices/types';
import { AddonsService } from '../addons/addons.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import type { SystemNoticeDto } from '@trek/shared';

import semver from 'semver';

/**
 * The setting key(s) any registered `case 'custom'` predicate reads today
 * (`registry.ts`'s `whitespace-collision-detected`, via
 * `ctx.settingFlag('whitespace_migration_collision')`) — resolved once per
 * `getActiveFor` call into a small map, the same shape `addonFlags` below
 * already uses for `addonEnabled` conditions (Plan 3f Task 0/R1's adopted
 * wiring). A future predicate reading another `app_settings` key adds its
 * own entry here; `registry.ts`/`conditions.ts` need no further change
 * either way.
 */
const CUSTOM_PREDICATE_SETTING_KEYS = ['whitespace_migration_collision'] as const;

/**
 * DI-native `systemNotices` — absorbs the plain `getActiveNoticesFor`/
 * `dismissNotice` functions that used to live in `../../systemNotices/service.ts`
 * (Plan 3f Task 6, per Task 0's R1 wiring plan). `isNoticeVersionActive`,
 * `getCurrentAppVersion` and `severityWeight` are pure (no DB) and stay as
 * plain exported functions in that file; `evaluate`/`registerPredicate`/
 * `ConditionContext` stay in `conditions.ts`, `SYSTEM_NOTICES`/
 * `RETIRED_NOTICE_IDS` in `registry.ts` — this class is the only place that
 * now reaches a database, through injected repositories instead of the raw
 * `db` handle.
 */
@Injectable()
export class SystemNoticesService {
  constructor(
    private readonly addons: AddonsService,
    private readonly env: RuntimeEnvService,
    @InjectRepository(Users) private readonly users: UsersRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(UserNoticeDismissals) private readonly dismissals: UserNoticeDismissalsRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
  ) {}

  /**
   * `supports` names the layouts the calling bundle can draw, `uiVersion` the version
   * that bundle was built as. A notice with a release block goes only to a bundle that
   * names `release` AND was built for the version the server is running: after an
   * update the service worker keeps serving the previous bundle until the new one is
   * installed, and that bundle would draw the release notice with its own, older
   * texts (or as bare keys) and let the reader dismiss it for good, because the
   * dismissal is recorded against the server's version. The version match is what
   * makes this hold for every update, not only the one that introduced the
   * parameter: a 4.3.0 shell asking a 4.3.1 server is told nothing, and gets the
   * notice after the reload from the bundle that can draw it. A bundle that sends
   * neither loses only the notice it could not read anyway. Nothing is spent by
   * holding it back: a notice is used up by a dismissal and by nothing else.
   */
  async getActiveFor(
    userId: number,
    supports: ReadonlySet<string> = new Set(),
    uiVersion?: string,
  ): Promise<SystemNoticeDto[]> {
    const notices = await this.getActiveNoticesFor(userId);
    return supports.has('release') && this.bundleMatchesServer(uiVersion) ? notices : notices.filter((n) => !n.release);
  }

  /** Whether the bundle asking was built for the version this server runs. */
  private bundleMatchesServer(uiVersion: string | undefined): boolean {
    const ui = uiVersion ? semver.coerce(uiVersion)?.version : undefined;
    const app = semver.coerce(getCurrentAppVersion())?.version;
    return !!ui && !!app && ui === app;
  }

  async dismiss(userId: number, noticeId: string): Promise<boolean> {
    const exists = SYSTEM_NOTICES.some((n) => n.id === noticeId);
    if (!exists) return false;
    // Record the app version at dismissal so per-version notices can re-appear on the
    // next upgrade. Upsert (not INSERT OR IGNORE) so re-dismissing after a bump
    // refreshes the version (SN5).
    await this.dismissals.upsertDismissal(userId, noticeId, Date.now(), getCurrentAppVersion());
    return true;
  }

  /**
   * The former `getActiveNoticesFor` (SN2/SN3/SN4 reads + the addon-flags
   * lookup, filter, sort and DTO-mapping) — absorbed verbatim except the
   * four DB reads now go through injected repositories instead of the raw
   * `db` handle, and `managed` is read straight off the injected
   * `RuntimeEnvService` instead of being threaded in as a parameter.
   */
  private async getActiveNoticesFor(userId: number): Promise<SystemNoticeDto[]> {
    const user = await this.users.findById(userId);
    if (!user) return [];

    const tripCount = await this.trips.countForUser(userId);

    // Dismissals mapped to the app version they were dismissed at (used by per-version notices).
    const dismissalRows = await this.dismissals.listForUser(userId);
    const dismissals = new Map<string, string | null>(dismissalRows.map((r) => [r.notice_id, r.dismissed_app_version]));

    const now = new Date();
    const currentAppVersion = getCurrentAppVersion();

    // `evaluate` runs inside a .filter(), which cannot await, so the addon flags
    // the registry is able to ask about are resolved up front and handed to it as
    // a lookup. The ids come from the notices themselves, so every question the
    // conditions can ask has an answer here.
    const addonFlags = new Map<string, boolean>();
    for (const condition of SYSTEM_NOTICES.flatMap((n) => n.conditions)) {
      if (condition.kind === 'addonEnabled' && !addonFlags.has(condition.addonId)) {
        addonFlags.set(condition.addonId, await this.addons.isAddonEnabled(condition.addonId));
      }
    }

    // Same shape as addonFlags above, for the one thing a `case 'custom'`
    // predicate can currently ask about (SN1).
    const settingFlags = new Map<string, boolean>();
    for (const key of CUSTOM_PREDICATE_SETTING_KEYS) {
      settingFlags.set(key, (await this.appSettings.getValue(key)) === 'true');
    }

    const ctx = {
      user: {
        login_count: user.login_count,
        first_seen_version: user.first_seen_version,
        role: user.role,
        noTrips: tripCount,
      },
      currentAppVersion,
      now,
      addonEnabled: (addonId: string) => addonFlags.get(addonId) ?? false,
      managed: this.env.isManaged(),
      settingFlag: (key: string) => settingFlags.get(key) ?? false,
    };
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

    return SYSTEM_NOTICES.filter((n) => {
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
      .map(
        ({
          conditions: _c,
          publishedAt: _p,
          minVersion: _mn,
          maxVersion: _mx,
          priority: _pr,
          recurring: _rc,
          ...dto
        }) => dto,
      ) as SystemNoticeDto[];
  }
}
