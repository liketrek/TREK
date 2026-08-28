import { Injectable } from '@nestjs/common';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { discardBody, readCappedJson } from '../../utils/cappedFetch';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VacayPlan {
  id: number;
  owner_id: number;
  block_weekends: number;
  holidays_enabled: number;
  holidays_region: string | null;
  school_holidays_enabled: number;
  company_holidays_enabled: number;
  carry_over_enabled: number;
  weekend_days: string | null;
  week_start: number | null;
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
 * Vacay domain service — owns the vacay SQL (moved 1:1 from the legacy
 * services/vacayService.ts: identical statements, the `||` falsy-coercion
 * defaults next to `??` ones, the post-write re-selects and the dynamic
 * SET-list updates). Broadcasts go straight to `broadcastToUser` inside the
 * same try/catch swallows the legacy lazy require sat in; notifications stay
 * fire-and-forget dynamic imports.
 *
 * Post-migration fixes on top of the relocated legacy behavior: the
 * multi-statement writes (acceptInvite, dissolvePlan, deleteYear, updatePlan's
 * carry-over recompute) run in db.transaction(); every outbound fetch carries
 * an AbortSignal timeout and the nager.at responses are ok-checked;
 * applyHolidayCalendars honors the cache TTL; addYear no longer swallows real
 * errors; the holiday cache is instance state instead of a module-level map.
 * All consumers are in-container since the trip fold (TripsService injects
 * this class); vacay.bridge.ts was deleted with its last outside-container
 * consumer.
 */
@Injectable()
export class VacayService {
  constructor(
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
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
  private usedDays(userId: number, planId: number, year: number): number {
    // Comp/Flex days (#1074) are free — kind='comp' contributes 0 to the entitlement,
    // vacation days contribute their fraction. Entries predating the column are
    // 'vacation' by default. The window (#737) is the user's leave-year period; for
    // 'calendar' it is Jan 1 – Dec 31, byte-identical to the old date-prefix match.
    const { start, end } = this.resolveYearWindow(userId, year);
    const row = this.db.get<{ used: number }>(
      "SELECT COALESCE(SUM(CASE WHEN kind = 'comp' THEN 0 ELSE fraction END), 0) AS used FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date >= ? AND date < ?",
      userId, planId, start, end
    )!;
    return row.used;
  }

  /** Comp/Flex days (#1074) used in a user's leave-year period — SUM of fractions for kind='comp'. */
  private compUsedDays(userId: number, planId: number, year: number): number {
    const { start, end } = this.resolveYearWindow(userId, year);
    const row = this.db.get<{ used: number }>(
      "SELECT COALESCE(SUM(fraction), 0) AS used FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date >= ? AND date < ? AND kind = 'comp'",
      userId, planId, start, end
    )!;
    return row.used;
  }

  // -------------------------------------------------------------------------
  // Configurable vacation year (#737)
  // -------------------------------------------------------------------------

  getUserYearSettings(userId: number): VacayUserSettings | undefined {
    return this.db.get<VacayUserSettings>('SELECT * FROM vacay_user_settings WHERE user_id = ?', userId);
  }

  /** A user's leave-year settings with the calendar defaults filled in (#737). */
  getYearSettings(userId: number): VacayUserSettings {
    return this.getUserYearSettings(userId) ?? { user_id: userId, year_type: 'calendar', year_start_month: 1, year_start_day: 1, hire_date: null };
  }

  /**
   * Resolve a user's leave-year window for a period (#737). The `year` integer names
   * the period; 'calendar' returns Jan 1 – Dec 31 (the unchanged default, byte-identical
   * to the old `date LIKE 'YYYY-%'`), 'fiscal' starts on the configured month/day, and
   * 'anniversary' on the hire date's month/day. Window is [start, end) — start inclusive,
   * end exclusive. Because periods are consecutive, `year-1` is always the window that
   * ends where `year`'s begins, so the carry-over chains stay valid unchanged.
   */
  resolveYearWindow(userId: number, year: number): { start: string; end: string } {
    const s = this.getUserYearSettings(userId);
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
  private viewerWindow(year: number | string, viewerId?: number): { start: string; end: string } {
    const y = typeof year === 'number' ? year : Number.parseInt(year, 10);
    // A non-numeric year matched nothing under the old date prefix; an empty range
    // matches nothing either, so a bad parameter still yields an empty result.
    if (!Number.isFinite(y)) return { start: '', end: '' };
    if (viewerId == null) return { start: `${y}-01-01`, end: `${y + 1}-01-01` };
    return this.resolveYearWindow(viewerId, y);
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
  private viewerGridWindow(year: number | string, viewerId?: number): { start: string; end: string } {
    const w = this.viewerWindow(year, viewerId);
    if (!w.start) return w;
    return { start: `${w.start.slice(0, 7)}-01`, end: `${w.end.slice(0, 7)}-01` };
  }

  /**
   * The period identifier whose window contains `date` for this user (#737). With a
   * window that starts later in the year, today still belongs to the period named
   * after the previous calendar year — 'calendar' users always get today's year.
   */
  currentPeriodYear(userId: number, date = new Date()): number {
    const y = date.getFullYear();
    const iso = `${y}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    return iso < this.resolveYearWindow(userId, y).start ? y - 1 : y;
  }

  /** Upsert a user's leave-year settings (#737). */
  updateYearSettings(
    userId: number,
    data: { year_type?: unknown; year_start_month?: unknown; year_start_day?: unknown; hire_date?: unknown },
  ): VacayUserSettings {
    const type = normalizeYearType(data.year_type);
    const month = Math.min(12, Math.max(1, Number.parseInt(String(data.year_start_month ?? 1), 10) || 1));
    const day = Math.min(31, Math.max(1, Number.parseInt(String(data.year_start_day ?? 1), 10) || 1));
    const hire = typeof data.hire_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.hire_date) ? data.hire_date : null;
    this.db.run(`
    INSERT INTO vacay_user_settings (user_id, year_type, year_start_month, year_start_day, hire_date)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET year_type = excluded.year_type, year_start_month = excluded.year_start_month,
      year_start_day = excluded.year_start_day, hire_date = excluded.hire_date
  `, userId, type, month, day, hire);
    return this.getUserYearSettings(userId)!;
  }

  // -------------------------------------------------------------------------
  // Plan management
  // -------------------------------------------------------------------------

  getOwnPlan(userId: number): VacayPlan {
    let plan = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE owner_id = ?', userId);
    if (!plan) {
      this.db.run('INSERT INTO vacay_plans (owner_id) VALUES (?)', userId);
      plan = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE owner_id = ?', userId)!;
      // Seed the period today falls into — with a shifted leave year (#737) that is
      // not necessarily the current calendar year.
      const yr = this.currentPeriodYear(userId);
      this.db.run('INSERT OR IGNORE INTO vacay_years (plan_id, year) VALUES (?, ?)', plan.id, yr);
      this.db.run('INSERT OR IGNORE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, 30, 0)', userId, plan.id, yr);
      this.db.run('INSERT OR IGNORE INTO vacay_user_colors (user_id, plan_id, color) VALUES (?, ?, ?)', userId, plan.id, '#6366f1');
    }
    return plan;
  }

  getActivePlan(userId: number): VacayPlan {
    const membership = this.db.get<{ plan_id: number }>(`
    SELECT plan_id FROM vacay_plan_members WHERE user_id = ? AND status = 'accepted'
  `, userId);
    if (membership) {
      return this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', membership.plan_id)!;
    }
    return this.getOwnPlan(userId);
  }

  getActivePlanId(userId: number): number {
    return this.getActivePlan(userId).id;
  }

  shiftOwnerEntriesForTripWindow(
    ownerId: number,
    oldStart: string,
    oldEnd: string,
    newStart: string
  ): void {
    const row = this.db.get<{ days: number }>(
      'SELECT CAST(julianday(?) - julianday(?) AS INTEGER) AS days',
      newStart, oldStart
    );
    const offset = row?.days ?? 0;
    if (offset === 0) return;

    const plan = this.getOwnPlan(ownerId);

    this.db.run(
      `UPDATE OR IGNORE vacay_entries
        SET date = date(date, ? || ' days')
      WHERE plan_id = ?
        AND user_id = ?
        AND date BETWEEN ? AND ?`,
      `${offset >= 0 ? '+' : ''}${offset}`, plan.id, ownerId, oldStart, oldEnd
    );
  }

  getPlanUsers(planId: number): VacayUser[] {
    const plan = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', planId);
    if (!plan) return [];
    const owner = this.db.get<VacayUser>('SELECT id, username, email FROM users WHERE id = ?', plan.owner_id)!;
    const members = this.db.all<VacayUser>(`
    SELECT u.id, u.username, u.email FROM vacay_plan_members m
    JOIN users u ON m.user_id = u.id
    WHERE m.plan_id = ? AND m.status = 'accepted'
  `, planId);
    return [owner, ...members];
  }

  // -------------------------------------------------------------------------
  // WebSocket notifications
  // -------------------------------------------------------------------------

  notifyPlanUsers(
    planId: number,
    excludeSid: string | undefined,
    event: 'vacay:update' | 'vacay:settings' | 'vacay:accepted' | 'vacay:declined' = 'vacay:update',
  ): void {
    try {
      const plan = this.db.get<{ owner_id: number }>('SELECT owner_id FROM vacay_plans WHERE id = ?', planId);
      if (!plan) return;
      const userIds = [plan.owner_id];
      const members = this.db.all<{ user_id: number }>("SELECT user_id FROM vacay_plan_members WHERE plan_id = ? AND status = 'accepted'", planId);
      members.forEach(m => userIds.push(m.user_id));
      userIds.forEach(id => this.realtime.broadcastToUser(id, { type: event }, excludeSid));
      // Pending-invite events carry nothing a read-only viewer could see; every
      // other event may change entries, colors or company holidays. (The event
      // union proves invite/cancelled never reach this method — their senders
      // call broadcastToUser directly — so only declined needs excluding here.)
      if (event !== 'vacay:declined') {
        this.notifyShareViewers(userIds, excludeSid);
      }
    } catch { /* websocket not available */ }
  }

  notifyShareViewers(ownerIds: number[], excludeSid?: string): void {
    if (ownerIds.length === 0) return;
    try {
      const rows = this.db.all<{ user_id: number }>(
        `SELECT DISTINCT user_id FROM vacay_shares WHERE owner_id IN (${ownerIds.map(() => '?').join(',')})`,
        ...ownerIds
      );
      rows.forEach(r => this.realtime.broadcastToUser(r.user_id, { type: 'vacay:shared-update' }, excludeSid));
    } catch { /* websocket not available */ }
  }

  // -------------------------------------------------------------------------
  // Holiday calendar helpers
  // -------------------------------------------------------------------------

  async applyHolidayCalendars(planId: number): Promise<void> {
    const plan = this.db.get<{ holidays_enabled: number }>('SELECT holidays_enabled FROM vacay_plans WHERE id = ?', planId);
    if (!plan?.holidays_enabled) return;
    const calendars = this.db.all<VacayHolidayCalendar>("SELECT * FROM vacay_holiday_calendars WHERE plan_id = ? AND type = 'public_holiday' ORDER BY sort_order, id", planId);
    if (calendars.length === 0) return;
    const years = this.db.all<{ year: number }>('SELECT year FROM vacay_years WHERE plan_id = ?', planId);
    // A shifted leave year (#737) runs into the next calendar year, so collect the
    // calendar years the members' windows actually touch — not just the period ids.
    // With everyone on 'calendar' this is the same set as before.
    const members = this.getPlanUsers(planId);
    const calendarYears = new Set<number>();
    for (const { year } of years) {
      calendarYears.add(year);
      for (const m of members) calendarYears.add(windowEndYear(this.resolveYearWindow(m.id, year).end));
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
              this.db.run('DELETE FROM vacay_entries WHERE plan_id = ? AND date = ?', planId, h.date);
              this.db.run('DELETE FROM vacay_company_holidays WHERE plan_id = ? AND date = ?', planId, h.date);
            }
          }
        } catch { /* API error, skip */ }
      }
    }
  }

  async migrateHolidayCalendars(planId: number, plan: VacayPlan): Promise<void> {
    const existing = this.db.get('SELECT id FROM vacay_holiday_calendars WHERE plan_id = ?', planId);
    if (existing) return;
    if (plan.holidays_enabled && plan.holidays_region) {
      this.db.run(
        'INSERT INTO vacay_holiday_calendars (plan_id, region, label, color, sort_order) VALUES (?, ?, NULL, ?, 0)',
        planId, plan.holidays_region, '#fecaca'
      );
    }
  }

  // -------------------------------------------------------------------------
  // Plan settings
  // -------------------------------------------------------------------------

  async updatePlan(planId: number, body: UpdatePlanBody, socketId: string | undefined) {
    const { block_weekends, holidays_enabled, holidays_region, school_holidays_enabled, company_holidays_enabled, carry_over_enabled, weekend_days, week_start } = body;

    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    if (block_weekends !== undefined) { updates.push('block_weekends = ?'); params.push(block_weekends ? 1 : 0); }
    if (holidays_enabled !== undefined) { updates.push('holidays_enabled = ?'); params.push(holidays_enabled ? 1 : 0); }
    if (holidays_region !== undefined) { updates.push('holidays_region = ?'); params.push(holidays_region); }
    if (school_holidays_enabled !== undefined) { updates.push('school_holidays_enabled = ?'); params.push(school_holidays_enabled ? 1 : 0); }
    if (company_holidays_enabled !== undefined) { updates.push('company_holidays_enabled = ?'); params.push(company_holidays_enabled ? 1 : 0); }
    if (carry_over_enabled !== undefined) { updates.push('carry_over_enabled = ?'); params.push(carry_over_enabled ? 1 : 0); }
    if (weekend_days !== undefined) { updates.push('weekend_days = ?'); params.push(String(weekend_days)); }
    if (week_start !== undefined) { updates.push('week_start = ?'); params.push(week_start === 0 ? 0 : 1); }

    if (updates.length > 0) {
      params.push(planId);
      this.db.run(`UPDATE vacay_plans SET ${updates.join(', ')} WHERE id = ?`, ...params);
    }

    if (company_holidays_enabled === true) {
      const companyDates = this.db.all<{ date: string }>('SELECT date FROM vacay_company_holidays WHERE plan_id = ?', planId);
      for (const { date } of companyDates) {
        this.db.run('DELETE FROM vacay_entries WHERE plan_id = ? AND date = ?', planId, date);
      }
    }

    const updatedPlan = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', planId)!;
    await this.migrateHolidayCalendars(planId, updatedPlan);
    await this.applyHolidayCalendars(planId);

    if (carry_over_enabled === false) {
      this.db.run('UPDATE vacay_user_years SET carried_over = 0 WHERE plan_id = ?', planId);
    }

    if (carry_over_enabled === true) {
      // The chained per-year/per-user recompute is atomic — a failure mid-chain
      // would otherwise leave later years carrying stale balances.
      this.db.transaction(() => {
        const years = this.db.all<{ year: number }>('SELECT year FROM vacay_years WHERE plan_id = ? ORDER BY year', planId);
        const users = this.getPlanUsers(planId);
        for (let i = 0; i < years.length - 1; i++) {
          const yr = years[i].year;
          const nextYr = years[i + 1].year;
          for (const u of users) {
            const used = this.usedDays(u.id, planId, yr);
            const config = this.db.get<VacayUserYear>('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?', u.id, planId, yr);
            const total = (config ? config.vacation_days : 30) + (config ? config.carried_over : 0);
            const carry = Math.max(0, total - used);
            this.db.run(`
          INSERT INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, 30, ?)
          ON CONFLICT(user_id, plan_id, year) DO UPDATE SET carried_over = ?
        `, u.id, planId, nextYr, carry, carry);
          }
        }
      });
    }

    this.notifyPlanUsers(planId, socketId, 'vacay:settings');

    const updated = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', planId)!;
    const updatedCalendars = this.db.all<VacayHolidayCalendar>('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ? ORDER BY sort_order, id', planId);
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

  addHolidayCalendar(planId: number, region: string, label: string | null, color: string | undefined, sortOrder: number | undefined, socketId: string | undefined, type: 'public_holiday' | 'school_holiday' = 'public_holiday') {
    const result = this.db.run(
      'INSERT INTO vacay_holiday_calendars (plan_id, type, region, label, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      planId, type, region, label || null, color || (type === 'school_holiday' ? '#a5f3fc' : '#fecaca'), sortOrder ?? 0
    );
    const cal = this.db.get<VacayHolidayCalendar>('SELECT * FROM vacay_holiday_calendars WHERE id = ?', result.lastInsertRowid)!;
    this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return cal;
  }

  updateHolidayCalendar(
    calId: number,
    planId: number,
    body: { region?: string; label?: string | null; color?: string; sort_order?: number; type?: 'public_holiday' | 'school_holiday' },
    socketId: string | undefined,
  ): VacayHolidayCalendar | null {
    const cal = this.db.get<VacayHolidayCalendar>('SELECT * FROM vacay_holiday_calendars WHERE id = ? AND plan_id = ?', calId, planId);
    if (!cal) return null;
    const { region, label, color, sort_order, type } = body;
    const updates: string[] = [];
    const params: (string | number | null)[] = [];
    if (region !== undefined) { updates.push('region = ?'); params.push(region); }
    if (type !== undefined) { updates.push('type = ?'); params.push(type); }
    if (label !== undefined) { updates.push('label = ?'); params.push(label); }
    if (color !== undefined) { updates.push('color = ?'); params.push(color); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
    if (updates.length > 0) {
      params.push(calId);
      this.db.run(`UPDATE vacay_holiday_calendars SET ${updates.join(', ')} WHERE id = ?`, ...params);
    }
    const updated = this.db.get<VacayHolidayCalendar>('SELECT * FROM vacay_holiday_calendars WHERE id = ?', calId)!;
    this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return updated;
  }

  deleteHolidayCalendar(calId: number, planId: number, socketId: string | undefined): boolean {
    const cal = this.db.get('SELECT * FROM vacay_holiday_calendars WHERE id = ? AND plan_id = ?', calId, planId);
    if (!cal) return false;
    this.db.run('DELETE FROM vacay_holiday_calendars WHERE id = ?', calId);
    this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return true;
  }

  // -------------------------------------------------------------------------
  // User colors
  // -------------------------------------------------------------------------

  setUserColor(userId: number, planId: number, color: string | undefined, socketId: string | undefined): void {
    this.db.run(`
    INSERT INTO vacay_user_colors (user_id, plan_id, color) VALUES (?, ?, ?)
    ON CONFLICT(user_id, plan_id) DO UPDATE SET color = excluded.color
  `, userId, planId, color || '#6366f1');
    this.notifyPlanUsers(planId, socketId, 'vacay:update');
  }

  // -------------------------------------------------------------------------
  // Invitations
  // -------------------------------------------------------------------------

  sendInvite(planId: number, inviterId: number, inviterUsername: string, inviterEmail: string, targetUserId: number): { error?: string; status?: number } {
    if (targetUserId === inviterId) return { error: 'Cannot invite yourself', status: 400 };

    // The picker no longer offers guests, but the id arrives from the client, so the
    // write path has to refuse them too rather than trust the list it handed out.
    const targetUser = this.db.get('SELECT id, username FROM users WHERE id = ? AND COALESCE(is_guest, 0) = 0', targetUserId);
    if (!targetUser) return { error: 'User not found', status: 404 };

    const existing = this.db.get<{ id: number; status: string }>('SELECT id, status FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?', planId, targetUserId);
    if (existing) {
      if (existing.status === 'accepted') return { error: 'Already fused', status: 400 };
      if (existing.status === 'pending') return { error: 'Invite already pending', status: 400 };
    }

    const targetFusion = this.db.get("SELECT id FROM vacay_plan_members WHERE user_id = ? AND status = 'accepted'", targetUserId);
    if (targetFusion) return { error: 'User is already fused with another plan', status: 400 };

    this.db.run('INSERT INTO vacay_plan_members (plan_id, user_id, status) VALUES (?, ?, ?)', planId, targetUserId, 'pending');

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

  acceptInvite(userId: number, planId: number, socketId: string | undefined): { error?: string; status?: number } {
    // The accept flow is a multi-statement write (status flip + entry/year/color
    // migration + seeding) — atomic, so a failure can't leave the member half-fused.
    const result = this.db.transaction((): { error?: string; status?: number } => {
      const invite = this.db.get<VacayPlanMember>("SELECT * FROM vacay_plan_members WHERE plan_id = ? AND user_id = ? AND status = 'pending'", planId, userId);
      if (!invite) return { error: 'No pending invite', status: 404 };

      this.db.run("UPDATE vacay_plan_members SET status = 'accepted' WHERE id = ?", invite.id);

      // Migrate data from user's own plan
      const ownPlan = this.db.get<{ id: number }>('SELECT id FROM vacay_plans WHERE owner_id = ?', userId);
      if (ownPlan && ownPlan.id !== planId) {
        this.db.run('UPDATE vacay_entries SET plan_id = ? WHERE plan_id = ? AND user_id = ?', planId, ownPlan.id, userId);
        const ownYears = this.db.all<VacayUserYear>('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ?', userId, ownPlan.id);
        for (const y of ownYears) {
          this.db.run('INSERT OR IGNORE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, ?, ?)', userId, planId, y.year, y.vacation_days, y.carried_over);
        }
        const colorRow = this.db.get<{ color: string }>('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?', userId, ownPlan.id);
        if (colorRow) {
          this.db.run('INSERT OR IGNORE INTO vacay_user_colors (user_id, plan_id, color) VALUES (?, ?, ?)', userId, planId, colorRow.color);
        }
      }

      // Auto-assign unique color
      const existingColors = this.db.all<{ color: string }>('SELECT color FROM vacay_user_colors WHERE plan_id = ? AND user_id != ?', planId, userId).map(r => r.color);
      const myColor = this.db.get<{ color: string }>('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?', userId, planId);
      const effectiveColor = myColor?.color || '#6366f1';
      if (existingColors.includes(effectiveColor)) {
        const available = COLORS.find(c => !existingColors.includes(c));
        if (available) {
          this.db.run(`INSERT INTO vacay_user_colors (user_id, plan_id, color) VALUES (?, ?, ?)
        ON CONFLICT(user_id, plan_id) DO UPDATE SET color = excluded.color`, userId, planId, available);
        }
      } else if (!myColor) {
        this.db.run('INSERT OR IGNORE INTO vacay_user_colors (user_id, plan_id, color) VALUES (?, ?, ?)', userId, planId, effectiveColor);
      }

      // Ensure user has rows for all plan years
      const targetYears = this.db.all<{ year: number }>('SELECT year FROM vacay_years WHERE plan_id = ?', planId);
      for (const y of targetYears) {
        this.db.run('INSERT OR IGNORE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, 30, 0)', userId, planId, y.year);
      }
      return {};
    });

    // Only announce a fusion that actually happened — the transaction returns the
    // refusal for an invite that was already gone.
    if (!result.error) this.notifyPlanUsers(planId, socketId, 'vacay:accepted');
    return result;
  }

  declineInvite(userId: number, planId: number, socketId: string | undefined): void {
    this.db.run("DELETE FROM vacay_plan_members WHERE plan_id = ? AND user_id = ? AND status = 'pending'", planId, userId);
    this.notifyPlanUsers(planId, socketId, 'vacay:declined');
  }

  cancelInvite(planId: number, targetUserId: number): void {
    this.db.run("DELETE FROM vacay_plan_members WHERE plan_id = ? AND user_id = ? AND status = 'pending'", planId, targetUserId);

    try {
      this.realtime.broadcastToUser(targetUserId, { type: 'vacay:cancelled' });
    } catch { /* */ }
  }

  // -------------------------------------------------------------------------
  // Plan dissolution
  // -------------------------------------------------------------------------

  dissolvePlan(userId: number, socketId: string | undefined): void {
    // Dissolution moves every member's entries back to their own plan and copies
    // the company holidays — atomic, so a failure can't strand entries between plans.
    const allUserIds = this.db.transaction(() => {
      const plan = this.getActivePlan(userId);
      const isOwnerFlag = plan.owner_id === userId;

      const userIds = this.getPlanUsers(plan.id).map(u => u.id);
      const companyHolidays = this.db.all<{ date: string; note: string }>('SELECT date, note FROM vacay_company_holidays WHERE plan_id = ?', plan.id);

      if (isOwnerFlag) {
        const members = this.db.all<{ user_id: number }>("SELECT user_id FROM vacay_plan_members WHERE plan_id = ? AND status = 'accepted'", plan.id);
        for (const m of members) {
          const memberPlan = this.getOwnPlan(m.user_id);
          this.db.run('UPDATE vacay_entries SET plan_id = ? WHERE plan_id = ? AND user_id = ?', memberPlan.id, plan.id, m.user_id);
          for (const ch of companyHolidays) {
            this.db.run('INSERT OR IGNORE INTO vacay_company_holidays (plan_id, date, note) VALUES (?, ?, ?)', memberPlan.id, ch.date, ch.note);
          }
        }
        this.db.run('DELETE FROM vacay_plan_members WHERE plan_id = ?', plan.id);
      } else {
        const ownPlan = this.getOwnPlan(userId);
        this.db.run('UPDATE vacay_entries SET plan_id = ? WHERE plan_id = ? AND user_id = ?', ownPlan.id, plan.id, userId);
        for (const ch of companyHolidays) {
          this.db.run('INSERT OR IGNORE INTO vacay_company_holidays (plan_id, date, note) VALUES (?, ?, ?)', ownPlan.id, ch.date, ch.note);
        }
        this.db.run('DELETE FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?', plan.id, userId);
      }
      return userIds;
    });

    try {
      allUserIds.filter(id => id !== userId).forEach(id => this.realtime.broadcastToUser(id, { type: 'vacay:dissolved' }));
    } catch { /* */ }
    // Everyone's entries just moved back to their own plans — refresh read-only viewers.
    this.notifyShareViewers(allUserIds, socketId);
  }

  // -------------------------------------------------------------------------
  // Available users
  // -------------------------------------------------------------------------

  getAvailableUsers(userId: number, planId: number) {
    return this.db.all(`
    SELECT u.id, u.username, u.email FROM users u
    WHERE u.id != ?
    AND COALESCE(u.is_guest, 0) = 0
    AND u.id NOT IN (SELECT user_id FROM vacay_plan_members WHERE plan_id = ?)
    AND u.id NOT IN (SELECT user_id FROM vacay_plan_members WHERE status = 'accepted')
    AND u.id NOT IN (SELECT owner_id FROM vacay_plans WHERE id IN (
      SELECT plan_id FROM vacay_plan_members WHERE status = 'accepted'
    ))
    ORDER BY u.username
  `, userId, planId);
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
  private peekActivePlan(userId: number): VacayPlan | undefined {
    const membership = this.db.get<{ plan_id: number }>(`
    SELECT plan_id FROM vacay_plan_members WHERE user_id = ? AND status = 'accepted'
  `, userId);
    if (membership) {
      return this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', membership.plan_id);
    }
    return this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE owner_id = ?', userId);
  }

  /** Colors already taken in the viewer's own calendar (their plan's members). */
  private viewerColors(viewerId: number): Set<string> {
    const plan = this.peekActivePlan(viewerId);
    if (!plan) return new Set(['#6366f1']);
    const rows = this.db.all<{ color: string }>('SELECT color FROM vacay_user_colors WHERE plan_id = ?', plan.id);
    return new Set(rows.length > 0 ? rows.map(r => r.color) : ['#6366f1']);
  }

  /**
   * Display color for a shared calendar. Starts from the owner's own color, but
   * remaps to the first free preset when it collides with the viewer's plan
   * members or an earlier share — otherwise two people on the default indigo
   * would be indistinguishable in the overlay.
   */
  private shareDisplayColor(ownerId: number, usedColors: Set<string>): string {
    const plan = this.peekActivePlan(ownerId);
    const row = plan
      ? this.db.get<{ color: string }>('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?', ownerId, plan.id)
      : undefined;
    let color = row?.color || '#6366f1';
    if (usedColors.has(color)) {
      // Preset pool exhausted? Derive a stable per-owner hue instead of colliding.
      color = COLORS.find(c => !usedColors.has(c)) || `hsl(${Math.round((ownerId * 137.508) % 360)} 65% 60%)`;
    }
    usedColors.add(color);
    return color;
  }

  /** Users the viewer already sees in full via their active plan (owner + members). */
  private viewerCoMemberIds(viewerId: number): Set<number> {
    const plan = this.peekActivePlan(viewerId);
    return new Set(plan ? this.getPlanUsers(plan.id).map(u => u.id) : []);
  }

  listShares(userId: number) {
    // Usernames only, like the share picker — emails stay out of the share surface.
    const outgoing = this.db.all<{ id: number; user_id: number; username: string }>(`
    SELECT s.id, s.user_id, u.username
    FROM vacay_shares s JOIN users u ON s.user_id = u.id
    WHERE s.owner_id = ? ORDER BY s.id
  `, userId);
    const incomingRows = this.db.all<{ id: number; owner_id: number; hidden: number; username: string }>(`
    SELECT s.id, s.owner_id, s.hidden, u.username
    FROM vacay_shares s JOIN users u ON s.owner_id = u.id
    WHERE s.user_id = ? ORDER BY s.id
  `, userId);
    // Shares from someone the viewer is meanwhile fused with lie dormant — the
    // plan already shows that calendar in full. They resume after dissolution.
    const coMembers = this.viewerCoMemberIds(userId);
    const usedColors = this.viewerColors(userId);
    const incoming = incomingRows.filter(s => !coMembers.has(s.owner_id)).map(s => ({
      id: s.id,
      owner_id: s.owner_id,
      username: s.username,
      color: this.shareDisplayColor(s.owner_id, usedColors),
      hidden: !!s.hidden,
    }));
    return { outgoing, incoming };
  }

  shareCalendar(ownerId: number, ownerEmail: string, targetUserId: number, socketId?: string): { error?: string; status?: number } {
    if (targetUserId === ownerId) return { error: 'Cannot share with yourself', status: 400 };

    const targetUser = this.db.get('SELECT id FROM users WHERE id = ? AND COALESCE(is_guest, 0) = 0', targetUserId);
    if (!targetUser) return { error: 'User not found', status: 404 };

    const existing = this.db.get('SELECT id FROM vacay_shares WHERE owner_id = ? AND user_id = ?', ownerId, targetUserId);
    if (existing) return { error: 'Already shared', status: 400 };

    // Plan members already see the whole calendar — sharing with them is moot.
    if (this.getPlanUsers(this.getActivePlanId(ownerId)).find(u => u.id === targetUserId)) {
      return { error: 'User is already in your calendar', status: 400 };
    }

    this.db.run('INSERT INTO vacay_shares (owner_id, user_id) VALUES (?, ?)', ownerId, targetUserId);

    try {
      this.realtime.broadcastToUser(targetUserId, { type: 'vacay:share', from: { id: ownerId } });
      // The owner's other devices refresh their outgoing list too.
      this.realtime.broadcastToUser(ownerId, { type: 'vacay:share', from: { id: ownerId } }, socketId);
    } catch { /* websocket not available */ }

    this.notifications.send({ event: 'vacay_share', actorId: ownerId, scope: 'user', targetId: targetUserId, params: { actor: ownerEmail } }).catch(() => {});

    return {};
  }

  removeShare(shareId: number, userId: number, socketId?: string): boolean {
    const share = this.db.get<VacayShare>('SELECT * FROM vacay_shares WHERE id = ?', shareId);
    // The owner revokes, the viewer removes — both may delete, nobody else.
    if (!share || (share.owner_id !== userId && share.user_id !== userId)) return false;
    this.db.run('DELETE FROM vacay_shares WHERE id = ?', shareId);
    try {
      this.realtime.broadcastToUser(share.owner_id, { type: 'vacay:share-removed' }, socketId);
      this.realtime.broadcastToUser(share.user_id, { type: 'vacay:share-removed' }, socketId);
    } catch { /* websocket not available */ }
    return true;
  }

  setShareHidden(shareId: number, userId: number, hidden: boolean, socketId?: string): boolean {
    const share = this.db.get<VacayShare>('SELECT * FROM vacay_shares WHERE id = ?', shareId);
    if (!share || share.user_id !== userId) return false;
    this.db.run('UPDATE vacay_shares SET hidden = ? WHERE id = ?', hidden ? 1 : 0, shareId);
    try {
      // Keep the viewer's other devices in sync; nobody else is affected.
      this.realtime.broadcastToUser(userId, { type: 'vacay:shared-update' }, socketId);
    } catch { /* websocket not available */ }
    return true;
  }

  getShareAvailableUsers(userId: number) {
    const planId = this.getActivePlanId(userId);
    // Username only — unlike the fusion picker this lists users from other plans
    // too, so exposing their emails here would widen the instance directory.
    return this.db.all(`
    SELECT u.id, u.username FROM users u
    WHERE u.id != ?
    AND COALESCE(u.is_guest, 0) = 0
    AND u.id NOT IN (SELECT user_id FROM vacay_shares WHERE owner_id = ?)
    AND u.id NOT IN (
      SELECT owner_id FROM vacay_plans WHERE id = ?
      UNION
      SELECT user_id FROM vacay_plan_members WHERE plan_id = ? AND status = 'accepted'
    )
    ORDER BY u.username
  `, userId, userId, planId, planId);
  }

  getSharedCalendars(viewerId: number, year: string) {
    // Shared calendars are drawn into the viewer's grid, so they load over the
    // viewer's range (#737) even when the owner's leave year is shaped differently.
    const { start, end } = this.viewerGridWindow(year, viewerId);
    const shares = this.db.all<{ id: number; owner_id: number; hidden: number; username: string }>(`
    SELECT s.id, s.owner_id, s.hidden, u.username
    FROM vacay_shares s JOIN users u ON s.owner_id = u.id
    WHERE s.user_id = ? ORDER BY s.id
  `, viewerId);

    // Same dormancy rule as listShares: fused co-members are already fully visible.
    const coMembers = this.viewerCoMemberIds(viewerId);
    const usedColors = this.viewerColors(viewerId);
    return shares.filter(s => !coMembers.has(s.owner_id)).map(s => {
      const color = this.shareDisplayColor(s.owner_id, usedColors);
      const plan = this.peekActivePlan(s.owner_id);
      if (!plan) {
        return { share_id: s.id, owner_id: s.owner_id, owner_name: s.username, color, hidden: !!s.hidden, entries: [], companyHolidays: [] };
      }
      const entries = this.db.all(
        'SELECT date, fraction, kind FROM vacay_entries WHERE plan_id = ? AND user_id = ? AND date >= ? AND date < ? ORDER BY date',
        plan.id, s.owner_id, start, end
      );
      // Company holidays are plan-wide context for "when is this person off";
      // only exposed while the owner has the feature enabled, and dates only —
      // the note text may be authored by plan members who aren't part of the share.
      const companyHolidays = plan.company_holidays_enabled
        ? this.db.all('SELECT date FROM vacay_company_holidays WHERE plan_id = ? AND date >= ? AND date < ? ORDER BY date', plan.id, start, end)
        : [];
      return { share_id: s.id, owner_id: s.owner_id, owner_name: s.username, color, hidden: !!s.hidden, entries, companyHolidays };
    });
  }

  // -------------------------------------------------------------------------
  // Years
  // -------------------------------------------------------------------------

  listYears(planId: number): number[] {
    const rows = this.db.all<{ year: number }>('SELECT year FROM vacay_years WHERE plan_id = ? ORDER BY year', planId);
    return rows.map(y => y.year);
  }

  addYear(planId: number, year: number, socketId: string | undefined): number[] {
    // A duplicate year is a no-op (the legacy blanket try/catch was written for
    // exactly this constraint hit); real errors now propagate instead of being
    // swallowed. The insert + per-user seeding runs atomically.
    const exists = this.db.get('SELECT id FROM vacay_years WHERE plan_id = ? AND year = ?', planId, year);
    if (!exists) {
      this.db.transaction(() => {
        this.db.run('INSERT INTO vacay_years (plan_id, year) VALUES (?, ?)', planId, year);
        const plan = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', planId);
        const carryOverEnabled = plan ? !!plan.carry_over_enabled : true;
        const users = this.getPlanUsers(planId);
        for (const u of users) {
          let carriedOver = 0;
          if (carryOverEnabled) {
            const prevConfig = this.db.get<VacayUserYear>('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?', u.id, planId, year - 1);
            if (prevConfig) {
              const used = this.usedDays(u.id, planId, year - 1);
              const total = prevConfig.vacation_days + prevConfig.carried_over;
              carriedOver = Math.max(0, total - used);
            }
          }
          this.db.run('INSERT OR IGNORE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, 30, ?)', u.id, planId, year, carriedOver);
        }
      });
    }
    this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return this.listYears(planId);
  }

  deleteYear(planId: number, year: number, socketId: string | undefined): number[] {
    // Year removal deletes across four tables and recomputes the next year's
    // carry-over — atomic, so a failure can't leave entries without their year.
    this.db.transaction(() => {
      this.db.run('DELETE FROM vacay_years WHERE plan_id = ? AND year = ?', planId, year);
      // Members can be on differently shaped leave years (#737), so entries go per
      // author over that author's period rather than by one shared year prefix.
      // Authors are read off the entries themselves so orphans are cleared too.
      const authors = this.db.all<{ user_id: number }>('SELECT DISTINCT user_id FROM vacay_entries WHERE plan_id = ?', planId);
      for (const { user_id } of authors) {
        const { start, end } = this.resolveYearWindow(user_id, year);
        this.db.run('DELETE FROM vacay_entries WHERE plan_id = ? AND user_id = ? AND date >= ? AND date < ?', planId, user_id, start, end);
      }
      // Company holidays belong to the plan, not to a member, and every member sees
      // them over their own window. In a fused plan with mixed year types the safe
      // range is therefore the intersection of all member windows — anything outside
      // it still sits inside a period somebody else has not deleted.
      const owner = this.db.get<{ owner_id: number }>('SELECT owner_id FROM vacay_plans WHERE id = ?', planId);
      const members = this.getPlanUsers(planId);
      const windows = (members.length > 0 ? members.map(m => m.id) : [owner?.owner_id ?? -1]).map(id => this.resolveYearWindow(id, year));
      const holidayStart = windows.reduce((a, w) => (w.start > a ? w.start : a), windows[0].start);
      const holidayEnd = windows.reduce((a, w) => (w.end < a ? w.end : a), windows[0].end);
      if (holidayStart < holidayEnd) {
        this.db.run('DELETE FROM vacay_company_holidays WHERE plan_id = ? AND date >= ? AND date < ?', planId, holidayStart, holidayEnd);
      }
      this.db.run('DELETE FROM vacay_user_years WHERE plan_id = ? AND year = ?', planId, year);

      // Recalculate carry-over for year+1 if it exists, since its previous year has changed
      const nextYearExists = this.db.get('SELECT id FROM vacay_years WHERE plan_id = ? AND year = ?', planId, year + 1);
      if (nextYearExists) {
        const plan = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', planId);
        const carryOverEnabled = plan ? !!plan.carry_over_enabled : true;
        const users = this.getPlanUsers(planId);
        const prevYear = this.db.get<{ year: number }>('SELECT year FROM vacay_years WHERE plan_id = ? AND year < ? ORDER BY year DESC LIMIT 1', planId, year + 1);

        for (const u of users) {
          let carry = 0;
          if (carryOverEnabled && prevYear) {
            const prevConfig = this.db.get<VacayUserYear>('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?', u.id, planId, prevYear.year);
            if (prevConfig) {
              const used = this.usedDays(u.id, planId, prevYear.year);
              const total = prevConfig.vacation_days + prevConfig.carried_over;
              carry = Math.max(0, total - used);
            }
          }
          this.db.run('UPDATE vacay_user_years SET carried_over = ? WHERE user_id = ? AND plan_id = ? AND year = ?', carry, u.id, planId, year + 1);
        }
      }
    });

    this.notifyPlanUsers(planId, socketId, 'vacay:settings');
    return this.listYears(planId);
  }

  // -------------------------------------------------------------------------
  // Entries
  // -------------------------------------------------------------------------

  /**
   * Entries and company holidays for the grid. The range is the viewer's leave-year
   * window (#737) — a shifted year spans two calendar years, so the old year prefix
   * would drop the second half. For 'calendar' the range is Jan 1 – Dec 31 again.
   */
  getEntries(planId: number, year: string, viewerId?: number) {
    const { start, end } = this.viewerGridWindow(year, viewerId);
    const entries = this.db.all(`
    SELECT e.*, u.username as person_name, COALESCE(c.color, '#6366f1') as person_color
    FROM vacay_entries e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN vacay_user_colors c ON c.user_id = e.user_id AND c.plan_id = e.plan_id
    WHERE e.plan_id = ? AND e.date >= ? AND e.date < ?
  `, planId, start, end);
    const companyHolidays = this.db.all('SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date >= ? AND date < ?', planId, start, end);
    return { entries, companyHolidays };
  }

  toggleEntry(userId: number, planId: number, date: string, fraction?: unknown, kind?: unknown, socketId?: string): { action?: string; fraction?: number; kind?: string; error?: string } {
    const frac = normalizeFraction(fraction);
    const knd = normalizeKind(kind);
    const plan = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', planId);
    const weekendBlocked = plan ? isBlockedWeekend(plan, date) : false;
    const existing = this.db.get<{ id: number; fraction: number; kind: string | null }>('SELECT id, fraction, kind FROM vacay_entries WHERE user_id = ? AND date = ? AND plan_id = ?', userId, date, planId);
    if (existing) {
      // Clicking the exact same day again (same type AND same fraction) clears it;
      // clicking a different type or fraction converts it in place (#552/#1074).
      if (existing.fraction === frac && (existing.kind || 'vacation') === knd) {
        this.db.run('DELETE FROM vacay_entries WHERE id = ?', existing.id);
        this.notifyPlanUsers(planId, socketId);
        return { action: 'removed' };
      }
      // Removing a stray entry on a blocked day stays possible; keeping one
      // there (converted in place) does not.
      if (weekendBlocked) return { error: 'weekend_blocked' };
      this.db.run('UPDATE vacay_entries SET fraction = ?, kind = ? WHERE id = ?', frac, knd, existing.id);
      this.notifyPlanUsers(planId, socketId);
      return { action: 'updated', fraction: frac, kind: knd };
    }
    if (weekendBlocked) return { error: 'weekend_blocked' };
    this.db.run('INSERT INTO vacay_entries (plan_id, user_id, date, note, fraction, kind) VALUES (?, ?, ?, ?, ?, ?)', planId, userId, date, '', frac, knd);
    this.notifyPlanUsers(planId, socketId);
    return { action: 'added', fraction: frac, kind: knd };
  }

  toggleCompanyHoliday(planId: number, date: string, note: string | undefined, socketId: string | undefined): { action: string } {
    const existing = this.db.get<{ id: number }>('SELECT id FROM vacay_company_holidays WHERE plan_id = ? AND date = ?', planId, date);
    if (existing) {
      this.db.run('DELETE FROM vacay_company_holidays WHERE id = ?', existing.id);
      this.notifyPlanUsers(planId, socketId);
      return { action: 'removed' };
    } else {
      this.db.run('INSERT INTO vacay_company_holidays (plan_id, date, note) VALUES (?, ?, ?)', planId, date, note || '');
      this.db.run('DELETE FROM vacay_entries WHERE plan_id = ? AND date = ?', planId, date);
      this.notifyPlanUsers(planId, socketId);
      return { action: 'added' };
    }
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  getStats(planId: number, year: number) {
    const plan = this.db.get<VacayPlan>('SELECT * FROM vacay_plans WHERE id = ?', planId);
    const carryOverEnabled = plan ? !!plan.carry_over_enabled : true;
    const users = this.getPlanUsers(planId);

    return users.map(u => {
      const used = this.usedDays(u.id, planId, year);
      const compUsed = this.compUsedDays(u.id, planId, year);
      const config = this.db.get<VacayUserYear>('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?', u.id, planId, year);
      const vacationDays = config ? config.vacation_days : 30;
      const carriedOver = carryOverEnabled ? (config ? config.carried_over : 0) : 0;
      const total = vacationDays + carriedOver;
      const remaining = total - used;
      const colorRow = this.db.get<{ color: string }>('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?', u.id, planId);
      // The period this row was computed over (#737) — the UI labels the window and
      // the carry-over source with it instead of assuming Jan–Dec / year − 1.
      const window = this.resolveYearWindow(u.id, year);

      const nextYearExists = this.db.get('SELECT id FROM vacay_years WHERE plan_id = ? AND year = ?', planId, year + 1);
      if (nextYearExists && carryOverEnabled) {
        const carry = Math.max(0, remaining);
        this.db.run(`
        INSERT INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, 30, ?)
        ON CONFLICT(user_id, plan_id, year) DO UPDATE SET carried_over = ?
      `, u.id, planId, year + 1, carry, carry);
      }

      return {
        user_id: u.id, person_name: u.username, person_color: colorRow?.color || '#6366f1',
        year, vacation_days: vacationDays, carried_over: carriedOver,
        total_available: total, used, remaining, comp_used: compUsed,
        window_start: window.start, window_end: window.end,
      };
    });
  }

  updateStats(userId: number, planId: number, year: number, vacationDays: number, socketId: string | undefined): void {
    this.db.run(`
    INSERT INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(user_id, plan_id, year) DO UPDATE SET vacation_days = excluded.vacation_days
  `, userId, planId, year, vacationDays);
    this.notifyPlanUsers(planId, socketId);
  }

  // -------------------------------------------------------------------------
  // GET /plan composite
  // -------------------------------------------------------------------------

  getPlanData(userId: number) {
    const plan = this.getActivePlan(userId);
    const activePlanId = plan.id;

    const users = this.getPlanUsers(activePlanId).map(u => {
      const colorRow = this.db.get<{ color: string }>('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?', u.id, activePlanId);
      return { ...u, color: colorRow?.color || '#6366f1' };
    });

    const pendingInvites = this.db.all(`
    SELECT m.id, m.user_id, u.username, u.email, m.created_at
    FROM vacay_plan_members m JOIN users u ON m.user_id = u.id
    WHERE m.plan_id = ? AND m.status = 'pending'
  `, activePlanId);

    const incomingInvites = this.db.all(`
    SELECT m.id, m.plan_id, u.username, u.email, m.created_at
    FROM vacay_plan_members m
    JOIN vacay_plans p ON m.plan_id = p.id
    JOIN users u ON p.owner_id = u.id
    WHERE m.user_id = ? AND m.status = 'pending'
  `, userId);

    const holidayCalendars = this.db.all<VacayHolidayCalendar>('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ? ORDER BY sort_order, id', activePlanId);

    return {
      plan: {
        ...plan,
        block_weekends: !!plan.block_weekends,
        holidays_enabled: !!plan.holidays_enabled,
        school_holidays_enabled: !!plan.school_holidays_enabled,
        company_holidays_enabled: !!plan.company_holidays_enabled,
        carry_over_enabled: !!plan.carry_over_enabled,
        holiday_calendars: holidayCalendars,
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
