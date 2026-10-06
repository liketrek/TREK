import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { manualSchoolRegionId } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { UnitOfWork } from '../database/unit-of-work';
import { NotificationsService } from '../notifications/notifications.service';
import { discardBody, readCappedJson } from '../../utils/cappedFetch';
import { VacayPlans } from '../../db/entities/VacayPlans.entity';
import type { VacayPlansRepository } from '../../db/repositories/VacayPlans.repository';
import { VacayPlanMembers } from '../../db/entities/VacayPlanMembers.entity';
import type { VacayPlanMembersRepository } from '../../db/repositories/VacayPlanMembers.repository';
import { VacayYears } from '../../db/entities/VacayYears.entity';
import type { VacayYearsRepository } from '../../db/repositories/VacayYears.repository';
import { VacayUserYears } from '../../db/entities/VacayUserYears.entity';
import type { VacayUserYearsRepository } from '../../db/repositories/VacayUserYears.repository';
import { VacayUserColors } from '../../db/entities/VacayUserColors.entity';
import type { VacayUserColorsRepository } from '../../db/repositories/VacayUserColors.repository';
import { VacayEntries } from '../../db/entities/VacayEntries.entity';
import type { VacayEntriesRepository } from '../../db/repositories/VacayEntries.repository';
import { VacayCompanyHolidays } from '../../db/entities/VacayCompanyHolidays.entity';
import type { VacayCompanyHolidaysRepository } from '../../db/repositories/VacayCompanyHolidays.repository';
import { VacayHolidayCalendars } from '../../db/entities/VacayHolidayCalendars.entity';
import type { VacayHolidayCalendarsRepository } from '../../db/repositories/VacayHolidayCalendars.repository';
import { VacayShares } from '../../db/entities/VacayShares.entity';
import type { VacaySharesRepository } from '../../db/repositories/VacayShares.repository';
import { VacayUserSettings as VacayUserSettingsEntity } from '../../db/entities/VacayUserSettings.entity';
import type { VacayUserSettingsRepository } from '../../db/repositories/VacayUserSettings.repository';
import { SchoolHolidayRegions } from '../../db/entities/SchoolHolidayRegions.entity';
import type { SchoolHolidayRegionsRepository } from '../../db/repositories/SchoolHolidayRegions.repository';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VacayPlan {
  id: number;
  owner_id: number;
  block_weekends: number | null;
  holidays_enabled: number | null;
  holidays_region: string | null;
  school_holidays_enabled: number | null;
  company_holidays_enabled: number | null;
  carry_over_enabled: number | null;
  weekend_days: string | null;
  week_start: number;
}

export interface VacayUserYear {
  user_id: number;
  plan_id: number;
  year: number;
  vacation_days: number;
  carried_over: number;
}

export interface VacayUser {
  id: number;
  username: string;
  email: string;
}

export interface VacayPlanMember {
  id: number;
  plan_id: number;
  user_id: number;
  status: string;
  created_at?: string;
}

export interface Holiday {
  date: string;
  localName?: string;
  name?: string;
  global?: boolean;
  counties?: string[] | null;
}

export interface SchoolHoliday {
  startDate?: string;
  endDate?: string;
  name?: Array<{ language?: string; text?: string }> | string;
}

export interface VacayHolidayCalendar {
  id: number;
  plan_id: number;
  type: 'public_holiday' | 'school_holiday';
  region: string;
  label: string | null;
  color: string;
  sort_order: number;
}

export interface VacayUserSettings {
  user_id: number;
  year_type: 'calendar' | 'fiscal' | 'anniversary';
  year_start_month: number;
  year_start_day: number;
  hire_date: string | null;
}

export interface UpdatePlanBody {
  block_weekends?: boolean;
  holidays_enabled?: boolean;
  // null clears the legacy single-region field (the MCP tool and the shared
  // request schema both pass null through; SQLite stores NULL).
  holidays_region?: string | null;
  school_holidays_enabled?: boolean;
  company_holidays_enabled?: boolean;
  carry_over_enabled?: boolean;
  weekend_days?: string;
  week_start?: number;
}

export interface VacayShare {
  id: number;
  owner_id: number;
  user_id: number;
  hidden: number;
  created_at?: string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;
// A country's holidays for one year are a few kilobytes; two megabytes means the
// provider is misbehaving and we would rather report the usual error than buffer it.
const MAX_HOLIDAY_BYTES = 2 * 1024 * 1024;
// Both providers key on a 4-digit year and an ISO 3166-1 alpha-2 code. Anything
// else has no business reaching the URL path.
const YEAR_RE = /^\d{4}$/;
const COUNTRY_RE = /^[A-Za-z]{2}$/;

// ---------------------------------------------------------------------------
// Color palette for auto-assign
// ---------------------------------------------------------------------------

const COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6', '#ef4444',
  '#3b82f6', '#22c55e', '#06b6d4', '#f43f5e', '#a855f7',
  '#10b981', '#0ea5e9', '#64748b', '#be185d', '#0d9488',
];

// ---------------------------------------------------------------------------
// Pure helpers (no DB access)
// ---------------------------------------------------------------------------

/** Coerce an arbitrary input to a supported entry fraction: half (0.5) or full (1). */
function normalizeFraction(value: unknown): number {
  return Number(value) === 0.5 ? 0.5 : 1;
}

/** Coerce an arbitrary input to a supported leave type: comp/flex or vacation (#1074). */
function normalizeKind(value: unknown): 'vacation' | 'comp' {
  return value === 'comp' ? 'comp' : 'vacation';
}

/**
 * Same semantics as the client's isWeekend guard (holidays.ts): UTC weekday,
 * weekend_days falls back to Sat/Sun when the column is NULL or empty.
 */
function isBlockedWeekend(plan: Pick<VacayPlan, 'block_weekends' | 'weekend_days'>, date: string): boolean {
  if (!plan.block_weekends) return false;
  const days = plan.weekend_days ? String(plan.weekend_days).split(',').map(Number) : [0, 6];
  return days.includes(new Date(date + 'T00:00:00Z').getUTCDay());
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Days a month has in every year — February caps at 28 so no boundary lands on a date a common year lacks. */
function daysAlwaysInMonth(month: number): number {
  if (month === 2) return 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Coerce an arbitrary input to a supported leave-year type (#737). */
function normalizeYearType(value: unknown): 'calendar' | 'fiscal' | 'anniversary' {
  return value === 'fiscal' || value === 'anniversary' ? value : 'calendar';
}

/**
 * The calendar year a window's last day falls in. `end` is exclusive, so a window
 * ending on Jan 1 (the calendar default) stops inside the previous year.
 */
function windowEndYear(end: string): number {
  const y = Number.parseInt(end.slice(0, 4), 10);
  return end.endsWith('-01-01') ? y - 1 : y;
}

/**
 * Parse a date or datetime string the way SQLite's `julianday()` does — the
 * numeric components taken at face value as UTC, never the host's local
 * timezone. `Date.parse` only does this for a bare `YYYY-MM-DD`; a datetime
 * string with no zone suffix (`2025-06-12T23:30`) is local time per the ES
 * spec, which drifted from `julianday`'s always-UTC reading by whatever the
 * server's offset is (M2, task-7-review.md). Unparseable input returns `NaN`.
 */
function parseAsUtcMillis(value: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value);
  if (!m) return Number.NaN;
  const [, y, mo, d, h, mi, s] = m;
  return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h ?? 0), Number(mi ?? 0), Number(s ?? 0));
}

/**
 * Vacay domain service — owns the vacay SQL, now through the ten vacay
 * repositories (+ `SchoolHolidayRegionsRepository`'s cross-domain read,
 * Task 2's) instead of `DatabaseService` (Plan 3f Task 5). Broadcasts go
 * straight to `RealtimeService` inside the same try/catch swallows the
 * legacy lazy require sat in; notifications stay fire-and-forget dynamic
 * imports.
 *
 * Post-migration fixes on top of the relocated legacy behavior: the
 * multi-statement writes (acceptInvite, dissolvePlan, deleteYear, updatePlan's
 * carry-over recompute) run in uow.transactional(); every outbound fetch carries
 * an AbortSignal timeout and the nager.at responses are ok-checked;
 * applyHolidayCalendars honors the cache TTL; addYear no longer swallows real
 * errors; the holiday cache is instance state instead of a module-level map.
 * All consumers are in-container since the trip fold (TripsService injects
 * this class); vacay.bridge.ts was deleted with its last outside-container
 * consumer.
 *
 * R6 (this task): `removeShare`/`setShareHidden` no longer read an UNSCOPED
 * `vacay_shares` row and check ownership in JS — `VacaySharesRepository
 * .findScopedForRemoval`/`.findScopedForHide` scope the SAME two checks IN
 * the SQL statement itself (two distinct methods, not one with a mode flag —
 * see that repository's docstrings). Behaviorally identical to the legacy
 * shape on every input (the JS check ran before any mutation either way),
 * flagged as a genuine SQL-shape tightening per the plan's "For the user"
 * note. `getStats` (VC126) now wraps its per-request carry-over write in
 * `uow.transactional`, matching every OTHER multi-row write loop in this
 * file (plan3f-inputs.md correction #7's "wrap it, flag it" default) —
 * flagged here rather than left silently un-transacted either way.
 */
@Injectable()
export class VacayService {
  constructor(
    @InjectRepository(VacayPlans) private readonly plans: VacayPlansRepository,
    @InjectRepository(VacayPlanMembers) private readonly members: VacayPlanMembersRepository,
    @InjectRepository(VacayYears) private readonly years: VacayYearsRepository,
    @InjectRepository(VacayUserYears) private readonly userYears: VacayUserYearsRepository,
    @InjectRepository(VacayUserColors) private readonly userColors: VacayUserColorsRepository,
    @InjectRepository(VacayEntries) private readonly entries: VacayEntriesRepository,
    @InjectRepository(VacayCompanyHolidays) private readonly companyHolidays: VacayCompanyHolidaysRepository,
    @InjectRepository(VacayHolidayCalendars) private readonly holidayCalendars: VacayHolidayCalendarsRepository,
    @InjectRepository(VacayShares) private readonly shares: VacaySharesRepository,
    @InjectRepository(VacayUserSettingsEntity) private readonly userSettings: VacayUserSettingsRepository,
    @InjectRepository(SchoolHolidayRegions) private readonly schoolHolidayRegions: SchoolHolidayRegionsRepository,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly uow: UnitOfWork,
  ) {}

  private readonly holidayCache = new Map<string, { data: unknown; time: number }>();

  // -------------------------------------------------------------------------
  // Entitlement helpers
  // -------------------------------------------------------------------------

  /**
   * Vacation days a user has used in a year — the SUM of entry fractions, so a
   * half day (#552) counts as 0.5 and a full day as 1. Entries predating the
   * feature have fraction = 1, so this matches the old COUNT(*) for them.
   */
  private async usedDays(userId: number, planId: number, year: number): Promise<number> {
    // Comp/Flex days (#1074) are free — kind='comp' contributes 0 to the entitlement,
    // vacation days contribute their fraction. Entries predating the column are
    // 'vacation' by default. The window (#737) is the user's leave-year period; for
    // 'calendar' it is Jan 1 – Dec 31, byte-identical to the old date-prefix match.
    const { start, end } = await this.resolveYearWindow(userId, year);
    return this.entries.sumFraction(userId, planId, start, end);
  }

  /** Comp/Flex days (#1074) used in a user's leave-year period — SUM of fractions for kind='comp'. */
  private async compUsedDays(userId: number, planId: number, year: number): Promise<number> {
    const { start, end } = await this.resolveYearWindow(userId, year);
    return this.entries.sumCompFraction(userId, planId, start, end);
  }

  // -------------------------------------------------------------------------
  // Configurable vacation year (#737)
  // -------------------------------------------------------------------------

  async getUserYearSettings(userId: number): Promise<VacayUserSettings | undefined> {
    const row = await this.userSettings.findForUser(userId);
    return row ? { user_id: row.user_id, year_type: row.year_type as VacayUserSettings['year_type'], year_start_month: row.year_start_month, year_start_day: row.year_start_day, hire_date: row.hire_date } : undefined;
  }

  /** A user's leave-year settings with the calendar defaults filled in (#737). */
  async getYearSettings(userId: number): Promise<VacayUserSettings> {
    return (await this.getUserYearSettings(userId)) ?? { user_id: userId, year_type: 'calendar', year_start_month: 1, year_start_day: 1, hire_date: null };
  }

  /**
   * Resolve a user's leave-year window for a period (#737). The `year` integer names
   * the period; 'calendar' returns Jan 1 – Dec 31 (the unchanged default, byte-identical
   * to the old `date LIKE 'YYYY-%'`), 'fiscal' starts on the configured month/day, and
   * 'anniversary' on the hire date's month/day. Window is [start, end) — start inclusive,
   * end exclusive. Because periods are consecutive, `year-1` is always the window that
   * ends where `year`'s begins, so the carry-over chains stay valid unchanged.
   */
  async resolveYearWindow(userId: number, year: number): Promise<{ start: string; end: string }> {
    const s = await this.getUserYearSettings(userId);
    // 'anniversary' before a hire date is entered has nothing to anchor to, so it
    // reads as the calendar default rather than borrowing a month left behind by a
    // previous 'fiscal' setting — the client mirror resolves it the same way.
    if (!s || s.year_type === 'calendar' || (s.year_type === 'anniversary' && !s.hire_date)) {
      return { start: `${year}-01-01`, end: `${year + 1}-01-01` };
    }
    let month = s.year_start_month || 1;
    let day = s.year_start_day || 1;
    if (s.year_type === 'anniversary') {
      const parts = s.hire_date!.split('-');
      month = Number.parseInt(parts[1], 10) || 1;
      day = Number.parseInt(parts[2], 10) || 1;
    }
    month = Math.min(12, Math.max(1, month));
    // A Feb 29 hire date (or a stored Feb 30) would name a boundary that most years
    // simply do not have, and a string comparison against it silently shifts the
    // whole window. Clamp to a day every year really has.
    day = Math.min(day, daysAlwaysInMonth(month));
    return { start: `${year}-${pad2(month)}-${pad2(day)}`, end: `${year + 1}-${pad2(month)}-${pad2(day)}` };
  }

  /**
   * The [start, end) range a year identifier covers when read on someone's behalf
   * (#737). Without a viewer — MCP resources, which are plan-scoped — it stays the
   * plain calendar year, which is exactly what a 'calendar' user resolves to.
   */
  private async viewerWindow(year: number | string, viewerId?: number): Promise<{ start: string; end: string }> {
    const y = typeof year === 'number' ? year : Number.parseInt(year, 10);
    // A non-numeric year matched nothing under the old date prefix; an empty range
    // matches nothing either, so a bad parameter still yields an empty result.
    if (!Number.isFinite(y)) return { start: '', end: '' };
    if (viewerId == null) return { start: `${y}-01-01`, end: `${y + 1}-01-01` };
    return await this.resolveYearWindow(viewerId, y);
  }

  /**
   * The range the calendar grid renders for a period: the twelve whole months the
   * window starts in. For every window that begins on the 1st — all of 'calendar',
   * and a fiscal year set to a month start — this is exactly the counting window.
   *
   * Known limitation for a start day past the 1st (UK's Apr 6, an Oct 16 hire date):
   * the rendered range is month-aligned at both ends, so it is shifted rather than
   * widened. The first few days of the start month are drawn but belong to the
   * previous period, and the equally few days at the far end count here but fall
   * outside the twelve cards. Entitlement arithmetic stays day-exact either way;
   * only the grid's edges are approximate. Rendering a 13th month card would fix it
   * and was deliberately not taken.
   */
  private async viewerGridWindow(year: number | string, viewerId?: number): Promise<{ start: string; end: string }> {
    const w = await this.viewerWindow(year, viewerId);
    if (!w.start) return w;
    return { start: `${w.start.slice(0, 7)}-01`, end: `${w.end.slice(0, 7)}-01` };
  }

  /**
   * The period identifier whose window contains `date` for this user (#737). With a
   * window that starts later in the year, today still belongs to the period named
   * after the previous calendar year — 'calendar' users always get today's year.
   */
  async currentPeriodYear(userId: number, date = new Date()): Promise<number> {
    const y = date.getFullYear();
    const iso = `${y}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    return iso < (await this.resolveYearWindow(userId, y)).start ? y - 1 : y;
  }

  /** Upsert a user's leave-year settings (#737). */
  async updateYearSettings(
    userId: number,
    data: { year_type?: unknown; year_start_month?: unknown; year_start_day?: unknown; hire_date?: unknown },
  ): Promise<VacayUserSettings> {
    const type = normalizeYearType(data.year_type);
    const month = Math.min(12, Math.max(1, Number.parseInt(String(data.year_start_month ?? 1), 10) || 1));
    const day = Math.min(31, Math.max(1, Number.parseInt(String(data.year_start_day ?? 1), 10) || 1));
    const hire = typeof data.hire_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.hire_date) ? data.hire_date : null;
    await this.userSettings.upsertSettings(userId, type, month, day, hire);
    return (await this.getUserYearSettings(userId))!;
  }

  // -------------------------------------------------------------------------
  // Plan management
  // -------------------------------------------------------------------------

  async getOwnPlan(userId: number): Promise<VacayPlan> {
    let plan = await this.plans.findByOwner(userId);
    if (!plan) {
      await this.plans.insertForOwner(userId);
      plan = (await this.plans.findByOwner(userId))!;
      // Seed the period today falls into — with a shifted leave year (#737) that is
      // not necessarily the current calendar year.
      const yr = await this.currentPeriodYear(userId);
      await this.years.insertIgnore(plan.id, yr);
      await this.userYears.insertIgnore(userId, plan.id, yr, 30, 0);
      await this.userColors.insertIgnore(userId, plan.id, '#6366f1');
    }
    return plan;
  }

  async getActivePlan(userId: number): Promise<VacayPlan> {
    const membership = await this.members.findAcceptedPlanId(userId);
    if (membership) {
      return (await this.plans.findById(membership.plan_id))!;
    }
    return await this.getOwnPlan(userId);
  }

  async getActivePlanId(userId: number): Promise<number> {
    return (await this.getActivePlan(userId)).id;
  }

  async shiftOwnerEntriesForTripWindow(
    ownerId: number,
    oldStart: string,
    oldEnd: string,
    newStart: string
  ): Promise<void> {
    // VC4 (R9's verified restructured shape): `CAST(julianday(?) - julianday(?)
    // AS INTEGER)` on two BOUND VALUES is plain JS date-diff arithmetic —
    // verified against the SQL on 5 date pairs incl. a leap-year boundary and a
    // negative offset, all matched exactly (task-0-report.md). M2
    // (task-7-review.md): `trip.start_date` is an unconstrained `z.string()`,
    // so both bounds are parsed as UTC (never the host's local time) and
    // truncated — not rounded — to match `CAST(... AS INTEGER)`; a non-finite
    // offset (an unparseable start, legacy's NULL-julianday case) is a no-op,
    // same as legacy, instead of writing a NaN date and 500ing after the trip
    // row is already committed.
    const offset = Math.trunc((parseAsUtcMillis(newStart) - parseAsUtcMillis(oldStart)) / 86400000);
    if (!Number.isFinite(offset) || offset === 0) return;

    const plan = await this.getOwnPlan(ownerId);

    await this.entries.shiftForOwnerWindow(plan.id, ownerId, oldStart, oldEnd, offset);
  }

  async getPlanUsers(planId: number): Promise<VacayUser[]> {
    const plan = await this.plans.findById(planId);
    if (!plan) return [];
    const owner = (await this.plans.findVacayUser(plan.owner_id))!;
    const members = await this.members.listAcceptedWithUsers(planId);
    return [owner, ...members];
  }

  // -------------------------------------------------------------------------
  // WebSocket notifications
  // -------------------------------------------------------------------------

  async notifyPlanUsers(
    planId: number,
    excludeSid: string | undefined,
    event: 'vacay:update' | 'vacay:settings' | 'vacay:accepted' | 'vacay:declined' = 'vacay:update',
  ): Promise<void> {
    try {
      const plan = await this.plans.findOwnerId(planId);
      if (!plan) return;
      const userIds = [plan.owner_id];
      const members = await this.members.listAcceptedUserIds(planId);
      members.forEach(m => userIds.push(m.user_id));
      userIds.forEach(id => this.realtime.broadcastToUser(id, { type: event }, excludeSid));
      // Pending-invite events carry nothing a read-only viewer could see; every
      // other event may change entries, colors or company holidays. (The event
      // union proves invite/cancelled never reach this method — their senders
      // call broadcastToUser directly — so only declined needs excluding here.)
      if (event !== 'vacay:declined') {
        await this.notifyShareViewers(userIds, excludeSid);
      }
    } catch { /* websocket not available */ }
  }

  async notifyShareViewers(ownerIds: number[], excludeSid?: string): Promise<void> {
    if (ownerIds.length === 0) return;
    try {
      const viewerIds = await this.shares.listDistinctViewerIdsForOwners(ownerIds);
      viewerIds.forEach(id => this.realtime.broadcastToUser(id, { type: 'vacay:shared-update' }, excludeSid));
    } catch { /* websocket not available */ }
  }

  // -------------------------------------------------------------------------
  // Holiday calendar helpers
  // -------------------------------------------------------------------------

  async applyHolidayCalendars(planId: number): Promise<void> {
    const holidaysEnabled = await this.plans.getHolidaysEnabled(planId);
    if (!holidaysEnabled) return;
    const calendars = await this.holidayCalendars.listPublicForPlan(planId);
    if (calendars.length === 0) return;
    const years = await this.years.listForPlan(planId);
    // A shifted leave year (#737) runs into the next calendar year, so collect the
    // calendar years the members' windows actually touch — not just the period ids.
    // With everyone on 'calendar' this is the same set as before.
    const members = await this.getPlanUsers(planId);
    const calendarYears = new Set<number>();
    for (const year of years) {
      calendarYears.add(year);
      for (const m of members) calendarYears.add(windowEndYear((await this.resolveYearWindow(m.id, year)).end));
    }
    for (const cal of calendars) {
      const country = cal.region.split('-')[0];
      const region = cal.region.includes('-') ? cal.region : null;
      for (const year of calendarYears) {
        try {
          const cacheKey = `${year}-${country}`;
          const cached = this.holidayCache.get(cacheKey);
          let holidays = cached && Date.now() - cached.time < CACHE_TTL ? cached.data as Holiday[] : undefined;
          if (!holidays) {
            if (!COUNTRY_RE.test(country)) continue;
            const resp = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
            if (!resp.ok) { discardBody(resp); continue; }
            const parsed = await readCappedJson<Holiday[]>(resp, MAX_HOLIDAY_BYTES);
            if (parsed === undefined) continue;
            holidays = parsed;
            this.holidayCache.set(cacheKey, { data: holidays, time: Date.now() });
          }
          const hasRegions = holidays.some((h: Holiday) => h.counties && h.counties.length > 0);
          if (hasRegions && !region) continue;
          for (const h of holidays) {
            if (h.global || !h.counties || (region && h.counties.includes(region))) {
              await this.entries.deleteForPlanAndDate(planId, h.date);
              await this.companyHolidays.deleteForPlanAndDate(planId, h.date);
            }
          }
        } catch { /* API error, skip */ }
      }
    }
  }

  async migrateHolidayCalendars(planId: number, plan: VacayPlan): Promise<void> {
    const existing = await this.holidayCalendars.existsForPlan(planId);
    if (existing) return;
    if (plan.holidays_enabled && plan.holidays_region) {
      await this.holidayCalendars.insertCalendar(planId, 'public_holiday', plan.holidays_region, null, '#fecaca', 0);
    }
  }

  // -------------------------------------------------------------------------
  // Plan settings
  // -------------------------------------------------------------------------

  async updatePlan(planId: number, body: UpdatePlanBody, socketId: string | undefined) {
    const { block_weekends, holidays_enabled, holidays_region, school_holidays_enabled, company_holidays_enabled, carry_over_enabled, weekend_days, week_start } = body;

    const patch: { block_weekends?: number; holidays_enabled?: number; holidays_region?: string | null; school_holidays_enabled?: number; company_holidays_enabled?: number; carry_over_enabled?: number; weekend_days?: string; week_start?: number } = {};
    if (block_weekends !== undefined) patch.block_weekends = block_weekends ? 1 : 0;
    if (holidays_enabled !== undefined) patch.holidays_enabled = holidays_enabled ? 1 : 0;
    if (holidays_region !== undefined) patch.holidays_region = holidays_region;
    if (school_holidays_enabled !== undefined) patch.school_holidays_enabled = school_holidays_enabled ? 1 : 0;
    if (company_holidays_enabled !== undefined) patch.company_holidays_enabled = company_holidays_enabled ? 1 : 0;
    if (carry_over_enabled !== undefined) patch.carry_over_enabled = carry_over_enabled ? 1 : 0;
    if (weekend_days !== undefined) patch.weekend_days = String(weekend_days);
    if (week_start !== undefined) patch.week_start = week_start === 0 ? 0 : 1;

    await this.plans.update(planId, patch);

    if (company_holidays_enabled === true) {
      const companyDates = await this.companyHolidays.listForPlan(planId);
      for (const { date, fraction } of companyDates) await this.makeRoomForCompanyHoliday(planId, date, fraction);
    }

    const updatedPlan = (await this.plans.findById(planId))!;
    await this.migrateHolidayCalendars(planId, updatedPlan);
    await this.applyHolidayCalendars(planId);

    if (carry_over_enabled === false) {
      await this.userYears.resetCarriedOverForPlan(planId);
    }

    if (carry_over_enabled === true) {
      // The chained per-year/per-user recompute is atomic — a failure mid-chain
      // would otherwise leave later years carrying stale balances.
      await this.uow.transactional(async () => {
        const years = await this.years.listForPlan(planId);
        const users = await this.getPlanUsers(planId);
        for (let i = 0; i < years.length - 1; i++) {
          const yr = years[i];
          const nextYr = years[i + 1];
          for (const u of users) {
            const used = await this.usedDays(u.id, planId, yr);
            const config = await this.userYears.findForYear(u.id, planId, yr);
            // L1 (task-7-review.md): legacy bound `config.vacation_days`/
            // `config.carried_over` into this total AS-IS, letting a NULL
            // column pass through and coerce to 0 in the `+` (JS: `null + n
            // = n`) — never defaulting a NULL vacation_days to 30. `?? 0`
            // (not `?? 30`) reproduces that exact coercion under strict
            // nullable typing; only the OUTER `config ? … : 30` (no row at
            // all) is a genuine default.
            const total = (config ? config.vacation_days ?? 0 : 30) + (config ? config.carried_over ?? 0 : 0);
            const carry = Math.max(0, total - used);
            await this.userYears.upsertCarriedOver(u.id, planId, nextYr, carry);
          }
        }
      });
    }

    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');

    const updated = (await this.plans.findById(planId))!;
    const updatedCalendars = await this.holidayCalendars.listForPlan(planId);
    return {
      plan: {
        ...updated,
        block_weekends: !!updated.block_weekends,
        holidays_enabled: !!updated.holidays_enabled,
        school_holidays_enabled: !!updated.school_holidays_enabled,
        company_holidays_enabled: !!updated.company_holidays_enabled,
        carry_over_enabled: !!updated.carry_over_enabled,
        holiday_calendars: updatedCalendars,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Holiday calendars CRUD
  // -------------------------------------------------------------------------

  async addHolidayCalendar(planId: number, region: string, label: string | null, color: string | undefined, sortOrder: number | undefined, socketId: string | undefined, type: 'public_holiday' | 'school_holiday' = 'public_holiday') {
    await this.validateManualRegion(region, type);
    const id = await this.holidayCalendars.insertCalendar(
      planId, type, region, label || null, color || (type === 'school_holiday' ? '#a5f3fc' : '#fecaca'), sortOrder ?? 0,
    );
    const cal = (await this.holidayCalendars.findById(id))!;
    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return cal;
  }

  async updateHolidayCalendar(
    calId: number,
    planId: number,
    body: { region?: string; label?: string | null; color?: string; sort_order?: number; type?: 'public_holiday' | 'school_holiday' },
    socketId: string | undefined,
  ): Promise<VacayHolidayCalendar | null> {
    const cal = await this.holidayCalendars.findScopedForPlan(calId, planId);
    if (!cal) return null;
    await this.validateManualRegion(body.region ?? cal.region, body.type ?? cal.type);
    const { region, label, color, sort_order, type } = body;
    const patch: { region?: string; type?: 'public_holiday' | 'school_holiday'; label?: string | null; color?: string; sort_order?: number } = {};
    if (region !== undefined) patch.region = region;
    if (type !== undefined) patch.type = type;
    if (label !== undefined) patch.label = label;
    if (color !== undefined) patch.color = color;
    if (sort_order !== undefined) patch.sort_order = sort_order;
    await this.holidayCalendars.update(calId, patch);
    const updated = (await this.holidayCalendars.findById(calId))!;
    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return updated;
  }

  async deleteHolidayCalendar(calId: number, planId: number, socketId: string | undefined): Promise<boolean> {
    const cal = await this.holidayCalendars.findScopedForPlan(calId, planId);
    if (!cal) return false;
    await this.holidayCalendars.deleteById(calId);
    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return true;
  }

  /**
   * VC45 — `SELECT id FROM school_holiday_regions WHERE id = ? AND country =
   * ?` (guards `-MANUAL-` region codes against `manualSchoolRegionId`).
   *
   * Deviation from the brief, flagged: the brief names
   * `SchoolHolidayRegionsRepository.existsForCountry` (Task 2's) as this
   * read's consumer, but that method is `SH5`'s shape — `WHERE country = ?`
   * ONLY, no `id` in its predicate at all — built for `deleteCountry`'s "does
   * ANY region still exist for this country" guard, a genuinely different
   * question from VC45's "does THIS SPECIFIC id belong to this country".
   * Calling `existsForCountry` here would accept any garbage numeric id
   * (`US-MANUAL-999999`) as long as the country has AT LEAST ONE real
   * region, silently weakening the guard — caught by this task's own tests
   * (`addHolidayCalendar`/`updateHolidayCalendar`'s manual-region rejection
   * cases went green with a wrong answer). `findById` (Task 2's OTHER,
   * already-landed method, built for SH7) plus a JS-side `country` compare
   * reproduces the legacy `id = ? AND country = ?` predicate exactly, still
   * without editing `SchoolHolidayRegions.repository.ts`.
   */
  private async validateManualRegion(code: string, type: string) {
    if (!code.includes('-MANUAL-')) return;
    const id = manualSchoolRegionId(code);
    const region = id ? await this.schoolHolidayRegions.findById(id) : null;
    if (type !== 'school_holiday' || !id || !region || region.country !== code.slice(0, 2)) {
      throw new BadRequestException('Unknown manual school holiday region');
    }
  }

  // -------------------------------------------------------------------------
  // User colors
  // -------------------------------------------------------------------------

  async setUserColor(userId: number, planId: number, color: string | undefined, socketId: string | undefined): Promise<void> {
    await this.userColors.upsertColor(userId, planId, color || '#6366f1');
    await this.notifyPlanUsers(planId, socketId, 'vacay:update');
  }

  // -------------------------------------------------------------------------
  // Invitations
  // -------------------------------------------------------------------------

  async sendInvite(planId: number, inviterId: number, inviterUsername: string, inviterEmail: string, targetUserId: number): Promise<{ error?: string; status?: number }> {
    if (targetUserId === inviterId) return { error: 'Cannot invite yourself', status: 400 };

    // The picker no longer offers guests, but the id arrives from the client, so the
    // write path has to refuse them too rather than trust the list it handed out.
    const targetUser = await this.members.findInvitableUser(targetUserId);
    if (!targetUser) return { error: 'User not found', status: 404 };

    const existing = await this.members.findMembership(planId, targetUserId);
    if (existing) {
      if (existing.status === 'accepted') return { error: 'Already fused', status: 400 };
      if (existing.status === 'pending') return { error: 'Invite already pending', status: 400 };
    }

    const targetFusion = await this.members.findAcceptedForUser(targetUserId);
    if (targetFusion) return { error: 'User is already fused with another plan', status: 400 };

    await this.members.insertPending(planId, targetUserId);

    try {
      this.realtime.broadcastToUser(targetUserId, {
        type: 'vacay:invite',
        from: { id: inviterId, username: inviterUsername },
        planId,
      });
    } catch { /* websocket not available */ }

    // Notify invited user
    // Injected, not a lazy import of the old notifications bridge. The laziness bought
    // nothing the module graph does not already give — NotificationsModule
    // reaches nothing in this direction — and it hid the edge while handing the
    // send a second NotificationsService built outside the container.
    this.notifications.send({ event: 'vacay_invite', actorId: inviterId, scope: 'user', targetId: targetUserId, params: { actor: inviterEmail, planId: String(planId) } }).catch(() => {});

    return {};
  }

  async acceptInvite(userId: number, planId: number, socketId: string | undefined): Promise<{ error?: string; status?: number }> {
    // The accept flow is a multi-statement write (status flip + entry/year/color
    // migration + seeding) — atomic, so a failure can't leave the member half-fused.
    const result = await this.uow.transactional(async (): Promise<{ error?: string; status?: number }> => {
      const invite = await this.members.findPending(planId, userId);
      if (!invite) return { error: 'No pending invite', status: 404 };

      await this.members.accept(invite.id);

      // Migrate data from user's own plan
      const ownPlan = await this.plans.findIdByOwner(userId);
      if (ownPlan && ownPlan.id !== planId) {
        await this.entries.updatePlanIdForUser(planId, ownPlan.id, userId);
        const ownYears = await this.userYears.listForUserAndPlan(userId, ownPlan.id);
        for (const y of ownYears) {
          // L1 (task-7-review.md): legacy bound these AS-IS — a NULL
          // vacation_days/carried_over on the source row migrates as NULL,
          // never defaulted to 30/0.
          await this.userYears.insertIgnore(userId, planId, y.year, y.vacation_days, y.carried_over);
        }
        const colorRow = await this.userColors.findColor(userId, ownPlan.id);
        if (colorRow) {
          // L1: same — a NULL color migrates as NULL, not '#6366f1'.
          await this.userColors.insertIgnore(userId, planId, colorRow.color);
        }
      }

      // Auto-assign unique color
      const existingColors = (await this.userColors.listOtherColors(planId, userId)).map(r => r.color).filter((c): c is string => c !== null);
      const myColor = await this.userColors.findColor(userId, planId);
      const effectiveColor = myColor?.color || '#6366f1';
      if (existingColors.includes(effectiveColor)) {
        const available = COLORS.find(c => !existingColors.includes(c));
        if (available) {
          await this.userColors.upsertColor(userId, planId, available);
        }
      } else if (!myColor) {
        await this.userColors.insertIgnore(userId, planId, effectiveColor);
      }

      // Ensure user has rows for all plan years
      const targetYears = await this.years.listForPlan(planId);
      for (const y of targetYears) {
        await this.userYears.insertIgnore(userId, planId, y, 30, 0);
      }
      return {};
    });

    // Only announce a fusion that actually happened — the transaction returns the
    // refusal for an invite that was already gone.
    if (!result.error) await this.notifyPlanUsers(planId, socketId, 'vacay:accepted');
    return result;
  }

  async declineInvite(userId: number, planId: number, socketId: string | undefined): Promise<void> {
    await this.members.deletePending(planId, userId);
    await this.notifyPlanUsers(planId, socketId, 'vacay:declined');
  }

  async cancelInvite(planId: number, targetUserId: number): Promise<void> {
    await this.members.deletePending(planId, targetUserId);

    try {
      this.realtime.broadcastToUser(targetUserId, { type: 'vacay:cancelled' });
    } catch { /* */ }
  }

  // -------------------------------------------------------------------------
  // Plan dissolution
  // -------------------------------------------------------------------------

  async dissolvePlan(userId: number, socketId: string | undefined): Promise<void> {
    // Dissolution moves every member's entries back to their own plan and copies
    // the company holidays — atomic, so a failure can't strand entries between plans.
    const allUserIds = await this.uow.transactional(async () => {
      const plan = await this.getActivePlan(userId);
      const isOwnerFlag = plan.owner_id === userId;

      const userIds = (await this.getPlanUsers(plan.id)).map(u => u.id);
      const companyHolidayRows = await this.companyHolidays.listForPlan(plan.id);

      if (isOwnerFlag) {
        const members = await this.members.listAcceptedUserIds(plan.id);
        for (const m of members) {
          const memberPlan = await this.getOwnPlan(m.user_id);
          await this.entries.updatePlanIdForUser(memberPlan.id, plan.id, m.user_id);
          for (const ch of companyHolidayRows) {
            await this.companyHolidays.insertIgnore(memberPlan.id, ch.date, ch.note ?? '', ch.fraction);
          }
        }
        await this.members.deleteForPlan(plan.id);
      } else {
        const ownPlan = await this.getOwnPlan(userId);
        await this.entries.updatePlanIdForUser(ownPlan.id, plan.id, userId);
        for (const ch of companyHolidayRows) {
          await this.companyHolidays.insertIgnore(ownPlan.id, ch.date, ch.note ?? '', ch.fraction);
        }
        await this.members.deleteForPlanAndUser(plan.id, userId);
      }
      return userIds;
    });

    try {
      allUserIds.filter(id => id !== userId).forEach(id => this.realtime.broadcastToUser(id, { type: 'vacay:dissolved' }));
    } catch { /* */ }
    // Everyone's entries just moved back to their own plans — refresh read-only viewers.
    await this.notifyShareViewers(allUserIds, socketId);
  }

  // -------------------------------------------------------------------------
  // Available users
  // -------------------------------------------------------------------------

  async getAvailableUsers(userId: number, planId: number) {
    return this.members.listAvailableForFusion(userId, planId);
  }

  // -------------------------------------------------------------------------
  // Read-only calendar shares (#444/#667)
  // -------------------------------------------------------------------------
  //
  // A share lets another user VIEW someone's vacation days without fusing plans:
  // no edit rights, no data migration. The share follows the person (owner_id),
  // not a plan, so it keeps working across fusion and dissolution — viewers see
  // the owner's entries in whatever plan the owner is currently active in.

  /** Like getActivePlan, but never lazily creates a plan for the user. */
  private async peekActivePlan(userId: number): Promise<VacayPlan | undefined> {
    const membership = await this.members.findAcceptedPlanId(userId);
    if (membership) {
      return (await this.plans.findById(membership.plan_id)) ?? undefined;
    }
    return (await this.plans.findByOwner(userId)) ?? undefined;
  }

  /** Colors already taken in the viewer's own calendar (their plan's members). */
  private async viewerColors(viewerId: number): Promise<Set<string>> {
    const plan = await this.peekActivePlan(viewerId);
    if (!plan) return new Set(['#6366f1']);
    const rows = await this.userColors.listForPlan(plan.id);
    const colors = rows.map(r => r.color).filter((c): c is string => c !== null);
    return new Set(colors.length > 0 ? colors : ['#6366f1']);
  }

  /**
   * Display color for a shared calendar. Starts from the owner's own color, but
   * remaps to the first free preset when it collides with the viewer's plan
   * members or an earlier share — otherwise two people on the default indigo
   * would be indistinguishable in the overlay.
   */
  private async shareDisplayColor(ownerId: number, usedColors: Set<string>): Promise<string> {
    const plan = await this.peekActivePlan(ownerId);
    const row = plan ? await this.userColors.findColor(ownerId, plan.id) : undefined;
    let color = row?.color || '#6366f1';
    if (usedColors.has(color)) {
      // Preset pool exhausted? Derive a stable per-owner hue instead of colliding.
      color = COLORS.find(c => !usedColors.has(c)) || `hsl(${Math.round((ownerId * 137.508) % 360)} 65% 60%)`;
    }
    usedColors.add(color);
    return color;
  }

  /** Users the viewer already sees in full via their active plan (owner + members). */
  private async viewerCoMemberIds(viewerId: number): Promise<Set<number>> {
    const plan = await this.peekActivePlan(viewerId);
    return new Set(plan ? (await this.getPlanUsers(plan.id)).map(u => u.id) : []);
  }

  async listShares(userId: number) {
    // Usernames only, like the share picker — emails stay out of the share surface.
    const outgoing = await this.shares.listOutgoing(userId);
    const incomingRows = await this.shares.listIncoming(userId);
    // Shares from someone the viewer is meanwhile fused with lie dormant — the
    // plan already shows that calendar in full. They resume after dissolution.
    const coMembers = await this.viewerCoMemberIds(userId);
    const usedColors = await this.viewerColors(userId);
    // `map` cannot await, and `shareDisplayColor` mutates `usedColors` as it
    // hands colors out, so the projection runs as an explicit loop — same rows,
    // same order, same color-allocation sequence.
    const incoming: { id: number; owner_id: number; username: string; color: string; hidden: boolean }[] = [];
    for (const s of incomingRows.filter(s => !coMembers.has(s.owner_id))) {
      incoming.push({
        id: s.id,
        owner_id: s.owner_id,
        username: s.username,
        color: await this.shareDisplayColor(s.owner_id, usedColors),
        hidden: !!s.hidden,
      });
    }
    return { outgoing, incoming };
  }

  async shareCalendar(ownerId: number, ownerEmail: string, targetUserId: number, socketId?: string): Promise<{ error?: string; status?: number }> {
    if (targetUserId === ownerId) return { error: 'Cannot share with yourself', status: 400 };

    const targetOk = await this.shares.existsInvitableUser(targetUserId);
    if (!targetOk) return { error: 'User not found', status: 404 };

    const existing = await this.shares.findByOwnerAndUser(ownerId, targetUserId);
    if (existing) return { error: 'Already shared', status: 400 };

    // Plan members already see the whole calendar — sharing with them is moot.
    if ((await this.getPlanUsers(await this.getActivePlanId(ownerId))).find(u => u.id === targetUserId)) {
      return { error: 'User is already in your calendar', status: 400 };
    }

    await this.shares.insertShare(ownerId, targetUserId);

    try {
      this.realtime.broadcastToUser(targetUserId, { type: 'vacay:share', from: { id: ownerId } });
      // The owner's other devices refresh their outgoing list too.
      this.realtime.broadcastToUser(ownerId, { type: 'vacay:share', from: { id: ownerId } }, socketId);
    } catch { /* websocket not available */ }

    this.notifications.send({ event: 'vacay_share', actorId: ownerId, scope: 'user', targetId: targetUserId, params: { actor: ownerEmail } }).catch(() => {});

    return {};
  }

  /**
   * R6 — `findScopedForRemoval` now scopes the ownership-or-viewer check in
   * the SQL statement (`VacaySharesRepository`'s own docstring), instead of
   * an unscoped `SELECT * ... WHERE id = ?` plus a JS check. Behaviorally
   * identical to the legacy shape on every input.
   */
  async removeShare(shareId: number, userId: number, socketId?: string): Promise<boolean> {
    const share = await this.shares.findScopedForRemoval(shareId, userId);
    if (!share) return false;
    await this.shares.deleteById(shareId);
    try {
      this.realtime.broadcastToUser(share.owner_id, { type: 'vacay:share-removed' }, socketId);
      this.realtime.broadcastToUser(share.user_id, { type: 'vacay:share-removed' }, socketId);
    } catch { /* websocket not available */ }
    return true;
  }

  /**
   * R6 — `findScopedForHide` scopes the VIEWER-only check (narrower than
   * {@link removeShare}'s `findScopedForRemoval`, per that repository's
   * class docstring: the owner of an outgoing share may not hide it).
   */
  async setShareHidden(shareId: number, userId: number, hidden: boolean, socketId?: string): Promise<boolean> {
    const share = await this.shares.findScopedForHide(shareId, userId);
    if (!share) return false;
    await this.shares.setHidden(shareId, hidden);
    try {
      // Keep the viewer's other devices in sync; nobody else is affected.
      this.realtime.broadcastToUser(userId, { type: 'vacay:shared-update' }, socketId);
    } catch { /* websocket not available */ }
    return true;
  }

  async getShareAvailableUsers(userId: number) {
    const planId = await this.getActivePlanId(userId);
    // Username only — unlike the fusion picker this lists users from other plans
    // too, so exposing their emails here would widen the instance directory.
    return this.shares.listAvailableForShare(userId, planId);
  }

  async getSharedCalendars(viewerId: number, year: string) {
    // Shared calendars are drawn into the viewer's grid, so they load over the
    // viewer's range (#737) even when the owner's leave year is shaped differently.
    const { start, end } = await this.viewerGridWindow(year, viewerId);
    const shareRows = await this.shares.listIncoming(viewerId);

    // Same dormancy rule as listShares: fused co-members are already fully visible.
    const coMembers = await this.viewerCoMemberIds(viewerId);
    const usedColors = await this.viewerColors(viewerId);
    // `map` cannot await, and `shareDisplayColor` mutates `usedColors` as it
    // hands colors out, so the projection runs as an explicit loop — same rows,
    // same order, same color-allocation sequence.
    const calendars: {
      share_id: number; owner_id: number; owner_name: string; color: string; hidden: boolean;
      entries: { date: string; fraction: number; kind: string | null }[];
      companyHolidays: { date: string }[];
    }[] = [];
    for (const s of shareRows.filter(s => !coMembers.has(s.owner_id))) {
      const color = await this.shareDisplayColor(s.owner_id, usedColors);
      const plan = await this.peekActivePlan(s.owner_id);
      if (!plan) {
        calendars.push({ share_id: s.id, owner_id: s.owner_id, owner_name: s.username, color, hidden: !!s.hidden, entries: [], companyHolidays: [] });
        continue;
      }
      const entries = await this.entries.listForOwnerRange(plan.id, s.owner_id, start, end);
      // Company holidays are plan-wide context for "when is this person off";
      // only exposed while the owner has the feature enabled, and dates only —
      // the note text may be authored by plan members who aren't part of the share.
      const companyHolidayList = plan.company_holidays_enabled
        ? await this.companyHolidays.listDatesForRange(plan.id, start, end)
        : [];
      calendars.push({ share_id: s.id, owner_id: s.owner_id, owner_name: s.username, color, hidden: !!s.hidden, entries, companyHolidays: companyHolidayList });
    }
    return calendars;
  }

  // -------------------------------------------------------------------------
  // Years
  // -------------------------------------------------------------------------

  async listYears(planId: number): Promise<number[]> {
    return this.years.listForPlan(planId);
  }

  async addYear(planId: number, year: number, socketId: string | undefined): Promise<number[]> {
    // A duplicate year is a no-op (the legacy blanket try/catch was written for
    // exactly this constraint hit); real errors now propagate instead of being
    // swallowed. The insert + per-user seeding runs atomically.
    const exists = await this.years.exists(planId, year);
    if (!exists) {
      await this.uow.transactional(async () => {
        await this.years.insertYear(planId, year);
        const plan = await this.plans.findById(planId);
        const carryOverEnabled = plan ? !!plan.carry_over_enabled : true;
        const users = await this.getPlanUsers(planId);
        for (const u of users) {
          let carriedOver = 0;
          if (carryOverEnabled) {
            const prevConfig = await this.userYears.findForYear(u.id, planId, year - 1);
            if (prevConfig) {
              const used = await this.usedDays(u.id, planId, year - 1);
              // L1 (task-7-review.md): `?? 0`, not `?? 30` — reproduces
              // legacy's raw `prevConfig.vacation_days + prevConfig.carried_over`,
              // where a NULL vacation_days coerced to 0 in the `+`, never to 30.
              const total = (prevConfig.vacation_days ?? 0) + (prevConfig.carried_over ?? 0);
              carriedOver = Math.max(0, total - used);
            }
          }
          await this.userYears.insertIgnore(u.id, planId, year, 30, carriedOver);
        }
      });
    }
    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return await this.listYears(planId);
  }

  async deleteYear(planId: number, year: number, socketId: string | undefined): Promise<number[]> {
    // Year removal deletes across four tables and recomputes the next year's
    // carry-over — atomic, so a failure can't leave entries without their year.
    await this.uow.transactional(async () => {
      await this.years.deleteForPlanAndYear(planId, year);
      // Members can be on differently shaped leave years (#737), so entries go per
      // author over that author's period rather than by one shared year prefix.
      // Authors are read off the entries themselves so orphans are cleared too.
      const authors = await this.entries.listAuthorsForPlan(planId);
      for (const { user_id } of authors) {
        const { start, end } = await this.resolveYearWindow(user_id, year);
        await this.entries.deleteForRange(planId, user_id, start, end);
      }
      // Company holidays belong to the plan, not to a member, and every member sees
      // them over their own window. In a fused plan with mixed year types the safe
      // range is therefore the intersection of all member windows — anything outside
      // it still sits inside a period somebody else has not deleted.
      const owner = await this.plans.findOwnerId(planId);
      const members = await this.getPlanUsers(planId);
      // `map` cannot await the per-member window read, so it runs as an explicit
      // loop — same ids, same order.
      const windows: { start: string; end: string }[] = [];
      for (const id of members.length > 0 ? members.map(m => m.id) : [owner?.owner_id ?? -1]) {
        windows.push(await this.resolveYearWindow(id, year));
      }
      const holidayStart = windows.reduce((a, w) => (w.start > a ? w.start : a), windows[0].start);
      const holidayEnd = windows.reduce((a, w) => (w.end < a ? w.end : a), windows[0].end);
      if (holidayStart < holidayEnd) {
        await this.companyHolidays.deleteForRange(planId, holidayStart, holidayEnd);
      }
      await this.userYears.deleteForYear(planId, year);

      // Recalculate carry-over for year+1 if it exists, since its previous year has changed
      const nextYearExists = await this.years.exists(planId, year + 1);
      if (nextYearExists) {
        const plan = await this.plans.findById(planId);
        const carryOverEnabled = plan ? !!plan.carry_over_enabled : true;
        const users = await this.getPlanUsers(planId);
        const prevYear = await this.years.previousYear(planId, year + 1);

        for (const u of users) {
          let carry = 0;
          if (carryOverEnabled && prevYear !== null) {
            const prevConfig = await this.userYears.findForYear(u.id, planId, prevYear);
            if (prevConfig) {
              const used = await this.usedDays(u.id, planId, prevYear);
              // L1 (task-7-review.md): `?? 0`, not `?? 30` — reproduces
              // legacy's raw `prevConfig.vacation_days + prevConfig.carried_over`,
              // where a NULL vacation_days coerced to 0 in the `+`, never to 30.
              const total = (prevConfig.vacation_days ?? 0) + (prevConfig.carried_over ?? 0);
              carry = Math.max(0, total - used);
            }
          }
          await this.userYears.updateCarriedOver(u.id, planId, year + 1, carry);
        }
      }
    });

    await this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return await this.listYears(planId);
  }

  // -------------------------------------------------------------------------
  // Entries
  // -------------------------------------------------------------------------

  /**
   * Entries and company holidays for the grid. The range is the viewer's leave-year
   * window (#737) — a shifted year spans two calendar years, so the old year prefix
   * would drop the second half. For 'calendar' the range is Jan 1 – Dec 31 again.
   */
  async getEntries(planId: number, year: string, viewerId?: number) {
    const { start, end } = await this.viewerGridWindow(year, viewerId);
    const entries = await this.entries.listForRangeWithPerson(planId, start, end);
    const companyHolidayList = await this.companyHolidays.listForRange(planId, start, end);
    return { entries, companyHolidays: companyHolidayList };
  }

  async toggleEntry(userId: number, planId: number, date: string, fraction?: unknown, kind?: unknown, socketId?: string): Promise<{ action?: string; fraction?: number; kind?: string; error?: string }> {
    const plan = await this.plans.findById(planId);
    // Half the day is the company's already (#2439): what is left is half a day.
    const company = plan?.company_holidays_enabled
      ? await this.companyHolidays.findByPlanAndDate(planId, date) // VC132
      : null;
    const frac = company && company.fraction < 1 ? 0.5 : normalizeFraction(fraction);
    const knd = normalizeKind(kind);
    const weekendBlocked = plan ? isBlockedWeekend(plan, date) : false;
    const existing = await this.entries.findByUserDatePlan(userId, date, planId);
    if (existing) {
      // Clicking the exact same day again (same type AND same fraction) clears it;
      // clicking a different type or fraction converts it in place (#552/#1074).
      if (existing.fraction === frac && (existing.kind || 'vacation') === knd) {
        await this.entries.deleteById(existing.id);
        await this.notifyPlanUsers(planId, socketId);
        return { action: 'removed' };
      }
      // Removing a stray entry on a blocked day stays possible; keeping one
      // there (converted in place) does not.
      if (weekendBlocked) return { error: 'weekend_blocked' };
      await this.entries.updateFractionKind(existing.id, frac, knd);
      await this.notifyPlanUsers(planId, socketId);
      return { action: 'updated', fraction: frac, kind: knd };
    }
    if (weekendBlocked) return { error: 'weekend_blocked' };
    await this.entries.insertEntry(planId, userId, date, '', frac, knd);
    await this.notifyPlanUsers(planId, socketId);
    return { action: 'added', fraction: frac, kind: knd };
  }

  /**
   * A company holiday on or off, whole or half (#2439). The same click again clears
   * it; the other size converts it in place, the way a vacation entry toggles. A
   * whole company holiday leaves no room for leave that day; a half one leaves half.
   */
  async toggleCompanyHoliday(planId: number, date: string, note: string | undefined, socketId: string | undefined, fraction?: unknown): Promise<{ action: string; fraction?: number }> {
    const frac = normalizeFraction(fraction);
    const result = await this.uow.transactional(async () => {
      const existing = await this.companyHolidays.findByPlanAndDate(planId, date); // VC118
      if (existing && existing.fraction === frac) {
        await this.companyHolidays.deleteById(existing.id); // VC119
        return { action: 'removed' };
      }
      if (existing) {
        await this.companyHolidays.updateFraction(existing.id, frac); // VC133
      } else {
        await this.companyHolidays.insertHoliday(planId, date, note || '', frac); // VC120
      }
      await this.makeRoomForCompanyHoliday(planId, date, frac);
      return { action: existing ? 'updated' : 'added', fraction: frac };
    });
    await this.notifyPlanUsers(planId, socketId);
    return result;
  }

  /** What a company holiday leaves of the day's leave: nothing for a whole one, half for a half one. */
  private async makeRoomForCompanyHoliday(planId: number, date: string, fraction: number): Promise<void> {
    if (fraction >= 1) await this.entries.deleteForPlanAndDate(planId, date); // VC30/VC121
    else await this.entries.halveForPlanAndDate(planId, date); // VC134
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  async getStats(planId: number, year: number) {
    const plan = await this.plans.findById(planId);
    const carryOverEnabled = plan ? !!plan.carry_over_enabled : true;
    const users = await this.getPlanUsers(planId);

    // `map` cannot await, and the body also writes next year's carry-over, so
    // the projection runs as an explicit loop — same users, same order, same writes.
    // VC126 (plan3f-inputs.md correction #7): the per-request carry-over write
    // now runs inside uow.transactional, matching every OTHER multi-row write
    // loop in this file — flagged per the plan's "wrap it, flag it" default
    // rather than left silently un-transacted.
    const rows: {
      user_id: number; person_name: string; person_color: string;
      year: number; vacation_days: number | null; carried_over: number | null;
      total_available: number; used: number; remaining: number; comp_used: number;
      window_start: string; window_end: string;
    }[] = [];
    await this.uow.transactional(async () => {
      for (const u of users) {
        const used = await this.usedDays(u.id, planId, year);
        const compUsed = await this.compUsedDays(u.id, planId, year);
        const config = await this.userYears.findForYear(u.id, planId, year);
        // L1 (task-7-review.md): a NULL vacation_days/carried_over passes
        // through on the wire, never defaulted to 30/0 — only the "no row at
        // all" case (`config` itself null) is a genuine default. `total`
        // still needs a number, so it null-coalesces separately, the same
        // way legacy's `vacationDays + carriedOver` silently coerced a NULL
        // operand to 0 in the `+`.
        const vacationDays = config ? config.vacation_days : 30;
        const carriedOver = carryOverEnabled ? (config ? config.carried_over : 0) : 0;
        const total = (vacationDays ?? 0) + (carriedOver ?? 0);
        const remaining = total - used;
        const colorRow = await this.userColors.findColor(u.id, planId);
        // The period this row was computed over (#737) — the UI labels the window and
        // the carry-over source with it instead of assuming Jan–Dec / year − 1.
        const window = await this.resolveYearWindow(u.id, year);

        const nextYearExists = await this.years.exists(planId, year + 1);
        if (nextYearExists && carryOverEnabled) {
          const carry = Math.max(0, remaining);
          await this.userYears.upsertCarriedOver(u.id, planId, year + 1, carry);
        }

        rows.push({
          user_id: u.id, person_name: u.username, person_color: colorRow?.color || '#6366f1',
          year, vacation_days: vacationDays, carried_over: carriedOver,
          total_available: total, used, remaining, comp_used: compUsed,
          window_start: window.start, window_end: window.end,
        });
      }
    });
    return rows;
  }

  async updateStats(userId: number, planId: number, year: number, vacationDays: number, socketId: string | undefined): Promise<void> {
    await this.userYears.upsertVacationDays(userId, planId, year, vacationDays);
    await this.notifyPlanUsers(planId, socketId);
  }

  // -------------------------------------------------------------------------
  // GET /plan composite
  // -------------------------------------------------------------------------

  async getPlanData(userId: number) {
    const plan = await this.getActivePlan(userId);
    const activePlanId = plan.id;

    const planUsers = await this.getPlanUsers(activePlanId);
    const users: (VacayUser & { color: string })[] = [];
    for (const u of planUsers) {
      const colorRow = await this.userColors.findColor(u.id, activePlanId);
      users.push({ ...u, color: colorRow?.color || '#6366f1' });
    }

    const pendingInvites = await this.members.listPendingForPlan(activePlanId);
    const incomingInvites = await this.members.listPendingForUser(userId);
    const holidayCalendarList = await this.holidayCalendars.listForPlan(activePlanId);

    return {
      plan: {
        ...plan,
        block_weekends: !!plan.block_weekends,
        holidays_enabled: !!plan.holidays_enabled,
        school_holidays_enabled: !!plan.school_holidays_enabled,
        company_holidays_enabled: !!plan.company_holidays_enabled,
        carry_over_enabled: !!plan.carry_over_enabled,
        holiday_calendars: holidayCalendarList,
      },
      users,
      pendingInvites,
      incomingInvites,
      isOwner: plan.owner_id === userId,
      isFused: users.length > 1,
    };
  }

  // -------------------------------------------------------------------------
  // Holidays (nager.at proxy with cache)
  // -------------------------------------------------------------------------

  async getCountries(): Promise<{ data?: unknown; error?: string }> {
    const cacheKey = 'countries';
    const cached = this.holidayCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) return { data: cached.data };
    try {
      const resp = await fetch('https://date.nager.at/api/v3/AvailableCountries', { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!resp.ok) { discardBody(resp); return { error: 'Failed to fetch countries' }; }
      const data = await readCappedJson(resp, MAX_HOLIDAY_BYTES);
      if (data === undefined) return { error: 'Failed to fetch countries' };
      this.holidayCache.set(cacheKey, { data, time: Date.now() });
      return { data };
    } catch {
      return { error: 'Failed to fetch countries' };
    }
  }

  async getHolidays(year: string, country: string): Promise<{ data?: unknown; error?: string }> {
    // Both segments land in the URL path, so they are checked before the cache
    // lookup rather than after it.
    if (!YEAR_RE.test(year) || !COUNTRY_RE.test(country)) return { error: 'Failed to fetch holidays' };
    const cacheKey = `${year}-${country}`;
    const cached = this.holidayCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) return { data: cached.data };
    try {
      const resp = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!resp.ok) { discardBody(resp); return { error: 'Failed to fetch holidays' }; }
      const data = await readCappedJson(resp, MAX_HOLIDAY_BYTES);
      if (data === undefined) return { error: 'Failed to fetch holidays' };
      this.holidayCache.set(cacheKey, { data, time: Date.now() });
      return { data };
    } catch {
      return { error: 'Failed to fetch holidays' };
    }
  }

  async getSchoolHolidayRegions(country: string, language = 'EN'): Promise<{ data?: unknown; error?: string }> {
    if (!COUNTRY_RE.test(country)) return { error: 'Failed to fetch school holiday regions' };
    const normalizedLanguage = String(language || 'EN').slice(0, 2).toUpperCase();
    const cacheKey = `school-regions-${country}-${normalizedLanguage}`;
    const cached = this.holidayCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) return { data: cached.data };
    try {
      const [groupsResp, subdivisionsResp] = await Promise.all([
        fetch(`https://openholidaysapi.org/Groups?countryIsoCode=${country}&languageIsoCode=${normalizedLanguage}`, { headers: { accept: 'text/json' }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
        fetch(`https://openholidaysapi.org/Subdivisions?countryIsoCode=${country}&languageIsoCode=${normalizedLanguage}`, { headers: { accept: 'text/json' }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
      ]);
      if (!groupsResp.ok || !subdivisionsResp.ok) {
        discardBody(groupsResp);
        discardBody(subdivisionsResp);
        return { error: 'Failed to fetch school holiday regions' };
      }
      const groups = await readCappedJson(groupsResp, MAX_HOLIDAY_BYTES);
      const subdivisions = await readCappedJson(subdivisionsResp, MAX_HOLIDAY_BYTES);
      if (groups === undefined || subdivisions === undefined) return { error: 'Failed to fetch school holiday regions' };
      const data = { groups, subdivisions };
      this.holidayCache.set(cacheKey, { data, time: Date.now() });
      return { data };
    } catch {
      return { error: 'Failed to fetch school holiday regions' };
    }
  }

  async getSchoolHolidays(year: string, country: string, subdivision?: string | null, language = 'EN', group?: string | null): Promise<{ data?: unknown; error?: string }> {
    if (!YEAR_RE.test(year) || !COUNTRY_RE.test(country)) return { error: 'Failed to fetch school holidays' };
    const normalizedLanguage = String(language || 'EN').slice(0, 2).toUpperCase();
    const normalizedSubdivision = subdivision || '';
    const normalizedGroup = group || '';
    const cacheKey = `school-${year}-${country}-${normalizedSubdivision || 'all'}-${normalizedGroup || 'all'}-${normalizedLanguage}`;
    const cached = this.holidayCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) return { data: cached.data };
    try {
      const params = new URLSearchParams({
        countryIsoCode: country,
        languageIsoCode: normalizedLanguage,
        validFrom: `${year}-01-01`,
        validTo: `${year}-12-31`,
      });
      if (normalizedSubdivision) params.set('subdivisionCode', normalizedSubdivision);
      if (normalizedGroup) params.set('groupCode', normalizedGroup);
      const resp = await fetch(`https://openholidaysapi.org/SchoolHolidays?${params.toString()}`, {
        headers: { accept: 'text/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!resp.ok) { discardBody(resp); return { error: 'Failed to fetch school holidays' }; }
      const data = await readCappedJson(resp, MAX_HOLIDAY_BYTES);
      if (data === undefined) return { error: 'Failed to fetch school holidays' };
      this.holidayCache.set(cacheKey, { data, time: Date.now() });
      return { data };
    } catch {
      return { error: 'Failed to fetch school holidays' };
    }
  }
}
