import {
  McpController, Tool, Resource, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import {
  vacayAddHolidayCalendarRequestSchema,
  vacayToggleEntryRequestSchema,
  vacayUpdatePlanRequestSchema,
} from '@trek/shared';
import type { VacayUpdatePlanRequest } from '@trek/shared';
import { AuthService } from '../auth/auth.service';
import { ADDON_IDS } from '../../addons';
import { VacayService } from './vacay.service';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';

/** Legacy registrar gate: the whole vacay surface rides the vacay addon. */
const vacayAddonOn = addonGate(ADDON_IDS.VACAY);

/** The controller derives the openholidaysapi response language the same way. */
function schoolHolidayLanguage(country: string): string {
  return country.toUpperCase() === 'DE' ? 'DE' : 'EN';
}

/** One node of the provider's region tree; children nest arbitrarily deep. */
interface RegionNode { code?: string; shortName?: string; children?: RegionNode[] | null }

function flattenRegionCodes(items: RegionNode[] | undefined): string[] {
  const out: string[] = [];
  for (const item of items ?? []) {
    const code = item.code ?? item.shortName;
    if (code) out.push(code);
    out.push(...flattenRegionCodes(item.children ?? undefined));
  }
  return out;
}

/**
 * The region strings add_holiday_calendar has to be given, which are not always
 * the provider's own codes. A group is stored as `<COUNTRY>|group:<CODE>`, and
 * the reader (parseCalendarRegion in the client's vacay store) treats a bare
 * code as a subdivision, so handing back the raw group code produces a calendar
 * that queries nothing. Belgium and the Netherlands are the countries that use
 * groups; deriving it from which list came back populated keeps the country
 * table in the one place it already lives, on the client.
 */
function calendarRegionCodes(country: string, data: unknown): { region: string; kind: 'group' | 'subdivision' }[] {
  const payload = (data ?? {}) as { groups?: RegionNode[]; subdivisions?: RegionNode[] };
  const upper = country.toUpperCase();
  return [
    ...flattenRegionCodes(payload.groups).map(code => ({ region: `${upper}|group:${code}`, kind: 'group' as const })),
    ...flattenRegionCodes(payload.subdivisions).map(code => ({ region: code, kind: 'subdivision' as const })),
  ];
}

/**
 * Vacay MCP surface — ported 1:1 from the legacy registrars: the 26 tools from
 * src/mcp/tools/vacay.ts and the trek://vacay/{plan,entries,holidays} resources
 * from src/mcp/resources.ts (identical names, descriptions, schemas,
 * annotations and error/payload shapes; broadcasts happen inside VacayService,
 * driven by the socketId argument every tool passes as undefined). The
 * registration-time gates map to `when` (the whole-registrar vacay-addon check)
 * plus the declarative vacay read/write access markers (the legacy `if (R)` /
 * `if (W)` checks, resolved by trekMcpAccessPolicy). Vacay is plan-scoped, not
 * trip-scoped, so there is no trip-permission layer; the only per-call guard is
 * the demo-user check on every write (including decline_vacay_invite, which the
 * legacy registrar missed). The nager.at- and openholidaysapi-backed lookups
 * carry the open-world readonly annotation.
 *
 * Tools past the original 26 close REST surface the legacy registrar never had:
 * the leave-year window, the school-holiday lookups behind a school_holiday
 * calendar, and the share picker (a different query from the fusion picker).
 */
@McpController()
export class VacayMcp {
  constructor(
    private readonly vacay: VacayService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'get_vacay_plan',
    description: "Get the current user's active vacation plan (own or joined).",
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async getVacayPlan(_args: Record<string, never>, ctx: McpContext) {
    const plan = this.vacay.getPlanData(ctx.userId);
    return ok({ plan });
  }

  @Tool({
    name: 'get_vacay_year_settings',
    description: "Get the caller's leave-year window: 'calendar' runs January to December, 'fiscal' starts on a configured month and day, 'anniversary' on the hire date's month and day. Read this before interpreting a year in get_vacay_stats or get_vacay_entries, which count over that window rather than the calendar year.",
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async getVacayYearSettings(_args: Record<string, never>, ctx: McpContext) {
    return ok({ settings: this.vacay.getYearSettings(ctx.userId) });
  }

  @Tool({
    name: 'update_vacay_plan',
    description: 'Update vacation plan settings (weekend blocking and which weekdays count as weekend, public and school holidays, company holidays, carry-over).',
    inputSchema: {
      ...vacayUpdatePlanRequestSchema.shape,
      weekend_days: vacayUpdatePlanRequestSchema.shape.weekend_days.describe("Comma-separated weekday numbers that count as weekend, 0 is Sunday (e.g. '0,6')"),
      week_start: vacayUpdatePlanRequestSchema.shape.week_start.describe('First column of the calendar grid: 0 for Sunday, anything else for Monday'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async updateVacayPlan(
    {
      block_weekends, holidays_enabled, holidays_region, school_holidays_enabled,
      company_holidays_enabled, carry_over_enabled, weekend_days, week_start,
    }: VacayUpdatePlanRequest,
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    // updatePlan already returns the fully-hydrated { plan }; surface it so the
    // AI consumer sees the updated plan, matching get_vacay_plan.
    const result = await this.vacay.updatePlan(planId, {
      block_weekends, holidays_enabled, holidays_region, school_holidays_enabled,
      company_holidays_enabled, carry_over_enabled, weekend_days, week_start,
    }, undefined);
    return ok(result);
  }

  @Tool({
    name: 'set_vacay_color',
    description: "Set the current user's color in the vacation plan calendar.",
    inputSchema: {
      color: z.string().describe('Hex color e.g. #6366f1'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async setVacayColor({ color }: { color: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    this.vacay.setUserColor(ctx.userId, planId, color, undefined);
    // Echo the persisted color (mirrors the service default) so the AI consumer sees what was set.
    return ok({ success: true, color: color || '#6366f1' });
  }

  @Tool({
    name: 'get_available_vacay_users',
    description: 'List users who can be invited to the current vacation plan.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async getAvailableVacayUsers(_args: Record<string, never>, ctx: McpContext) {
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const users = this.vacay.getAvailableUsers(ctx.userId, planId);
    return ok({ users });
  }

  @Tool({
    name: 'send_vacay_invite',
    description: 'Invite a user to join the vacation plan by their user ID.',
    inputSchema: {
      targetUserId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async sendVacayInvite({ targetUserId }: { targetUserId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const me = this.auth.getCurrentUser(ctx.userId);
    if (!me) return errorResult('User not found.');
    const result = this.vacay.sendInvite(planId, ctx.userId, me.username, me.email, targetUserId);
    if (result.error) return errorResult(result.error);
    return ok({ success: true });
  }

  @Tool({
    name: 'accept_vacay_invite',
    description: "Accept a pending invitation to join another user's vacation plan.",
    inputSchema: {
      planId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async acceptVacayInvite({ planId }: { planId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const result = this.vacay.acceptInvite(ctx.userId, planId, undefined);
    if (result.error) return errorResult(result.error);
    return ok({ success: true });
  }

  @Tool({
    name: 'decline_vacay_invite',
    description: 'Decline a pending vacation plan invitation.',
    inputSchema: {
      planId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async declineVacayInvite({ planId }: { planId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    this.vacay.declineInvite(ctx.userId, planId, undefined);
    return ok({ success: true });
  }

  @Tool({
    name: 'cancel_vacay_invite',
    description: 'Cancel an outgoing invitation (owner cancels invite they sent).',
    inputSchema: {
      targetUserId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async cancelVacayInvite({ targetUserId }: { targetUserId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    this.vacay.cancelInvite(planId, targetUserId);
    return ok({ success: true });
  }

  @Tool({
    name: 'dissolve_vacay_plan',
    description: 'Dissolve the shared plan — all members are removed and everyone returns to their own individual plan.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async dissolveVacayPlan(_args: Record<string, never>, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    this.vacay.dissolvePlan(ctx.userId, undefined);
    return ok({ success: true });
  }

  @Tool({
    name: 'list_vacay_years',
    description: 'List calendar years tracked in the current vacation plan.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async listVacayYears(_args: Record<string, never>, ctx: McpContext) {
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const years = this.vacay.listYears(planId);
    return ok({ years });
  }

  @Tool({
    name: 'add_vacay_year',
    description: 'Add a calendar year to the vacation plan.',
    inputSchema: {
      year: z.number().int().min(2000).max(2100),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async addVacayYear({ year }: { year: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const years = this.vacay.addYear(planId, year, undefined);
    return ok({ years });
  }

  @Tool({
    name: 'delete_vacay_year',
    description: 'Remove a calendar year from the vacation plan.',
    inputSchema: {
      year: z.number().int(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async deleteVacayYear({ year }: { year: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const years = this.vacay.deleteYear(planId, year, undefined);
    return ok({ years });
  }

  @Tool({
    name: 'get_vacay_entries',
    description: 'Get all vacation day entries for a plan and year.',
    inputSchema: {
      year: z.number().int(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async getVacayEntries({ year }: { year: number }, ctx: McpContext) {
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const entries = this.vacay.getEntries(planId, String(year), ctx.userId);
    return ok({ entries });
  }

  @Tool({
    name: 'toggle_vacay_entry',
    description: 'Toggle a day in the vacation calendar. Repeating a date with the same fraction and kind clears it, a different fraction or kind converts the day in place. Defaults to a full vacation day for the calling user.',
    inputSchema: {
      date: z.string().describe('ISO date YYYY-MM-DD'),
      fraction: vacayToggleEntryRequestSchema.shape.fraction.describe('0.5 for a half day, 1 (the default) for a full day'),
      kind: vacayToggleEntryRequestSchema.shape.kind.describe("'comp' for a flex/comp day, which does not draw on the entitlement; 'vacation' is the default"),
      targetUserId: z.number().int().positive().optional().describe('Log the day for another member of the shared plan instead of the caller'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async toggleVacayEntry(
    { date, fraction, kind, targetUserId }: { date: string; fraction?: 0.5 | 1; kind?: 'vacation' | 'comp'; targetUserId?: number },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    let userId = ctx.userId;
    if (targetUserId !== undefined && targetUserId !== ctx.userId) {
      // Same gate as POST /entries/toggle: booking for someone else reaches only
      // the members of the caller's own plan, and nobody outside it.
      if (!this.vacay.getPlanUsers(planId).find((u) => u.id === targetUserId)) {
        return errorResult('User not in plan');
      }
      userId = targetUserId;
    }
    const result = this.vacay.toggleEntry(userId, planId, date, fraction, kind, undefined);
    if (result.error) return errorResult(result.error);
    return ok(result);
  }

  @Tool({
    name: 'toggle_company_holiday',
    description: 'Toggle a date as a company holiday for the whole plan.',
    inputSchema: {
      date: z.string(),
      note: z.string().optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async toggleCompanyHoliday({ date, note }: { date: string; note?: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const result = this.vacay.toggleCompanyHoliday(planId, date, note, undefined);
    return ok(result);
  }

  @Tool({
    name: 'get_vacay_stats',
    description: 'Get vacation statistics for a specific year (days used, remaining, carried over).',
    inputSchema: {
      year: z.number().int(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async getVacayStats({ year }: { year: number }, ctx: McpContext) {
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const stats = this.vacay.getStats(planId, year);
    return ok({ stats });
  }

  @Tool({
    name: 'update_vacay_stats',
    description: 'Update the vacation day allowance for a specific user and year.',
    inputSchema: {
      year: z.number().int(),
      vacationDays: z.number().int().min(0),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async updateVacayStats({ year, vacationDays }: { year: number; vacationDays: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    this.vacay.updateStats(ctx.userId, planId, year, vacationDays, undefined);
    return ok({ success: true });
  }

  @Tool({
    name: 'add_holiday_calendar',
    description: "Add a holiday calendar (by region code) to the vacation plan. Public holidays take a country or country-region code from list_holiday_countries; a school-holiday calendar needs type 'school_holiday' plus a subdivision code from list_school_holiday_regions, and only shows up once update_vacay_plan has school_holidays_enabled set.",
    inputSchema: {
      region: z.string().describe("Country/region code e.g. US, GB, DE, or a subdivision like DE-BY. For a school-holiday calendar take calendar_regions[].region from list_school_holiday_regions verbatim, including the COUNTRY|group:CODE form that Belgium and the Netherlands use."),
      type: vacayAddHolidayCalendarRequestSchema.shape.type.describe("'school_holiday', or 'public_holiday' (the default)"),
      label: z.string().nullable().optional(),
      color: z.string().optional(),
      sortOrder: z.number().int().optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async addHolidayCalendar(
    { region, type, label, color, sortOrder }: { region: string; type?: 'public_holiday' | 'school_holiday'; label?: string | null; color?: string; sortOrder?: number },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    // An omitted type stays undefined so the service default (and the default
    // colour that goes with it) applies, exactly as on the REST route.
    const calendar = this.vacay.addHolidayCalendar(planId, region, label ?? null, color, sortOrder, undefined, type);
    return ok({ calendar });
  }

  @Tool({
    name: 'update_holiday_calendar',
    description: 'Update label or color for a holiday calendar.',
    inputSchema: {
      calendarId: z.number().int().positive(),
      label: z.string().nullable().optional(),
      color: z.string().optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async updateHolidayCalendar(
    { calendarId, label, color }: { calendarId: number; label?: string | null; color?: string },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const cal = this.vacay.updateHolidayCalendar(calendarId, planId, { label, color }, undefined);
    if (!cal) return errorResult('Holiday calendar not found.');
    return ok({ calendar: cal });
  }

  @Tool({
    name: 'delete_holiday_calendar',
    description: 'Remove a holiday calendar from the vacation plan.',
    inputSchema: {
      calendarId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async deleteHolidayCalendar({ calendarId }: { calendarId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const planId = this.vacay.getActivePlanId(ctx.userId);
    this.vacay.deleteHolidayCalendar(calendarId, planId, undefined);
    return ok({ success: true });
  }

  @Tool({
    name: 'list_holiday_countries',
    description: 'List countries available for public holiday calendars.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async listHolidayCountries(_args: Record<string, never>, _ctx: McpContext) {
    const result = await this.vacay.getCountries();
    if (result.error) return errorResult(result.error);
    return ok({ countries: result.data });
  }

  @Tool({
    name: 'list_holidays',
    description: 'List public holidays for a country and year.',
    inputSchema: {
      country: z.string().describe('ISO 3166-1 alpha-2 code'),
      year: z.number().int(),
    },
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async listHolidays({ country, year }: { country: string; year: number }, _ctx: McpContext) {
    const result = await this.vacay.getHolidays(String(year), country);
    if (result.error) return errorResult(result.error);
    return ok({ holidays: result.data });
  }

  @Tool({
    name: 'list_school_holiday_regions',
    description: "List a country's school-holiday regions. Use calendar_regions[].region verbatim as add_holiday_calendar's region: a group is stored as COUNTRY|group:CODE and a bare group code would be read back as a subdivision, leaving the calendar empty. The raw provider payload is alongside it under regions, and its plain codes are what list_school_holidays filters by. Public holiday calendars use list_holiday_countries instead.",
    inputSchema: {
      country: z.string().describe('ISO 3166-1 alpha-2 code'),
    },
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async listSchoolHolidayRegions({ country }: { country: string }, _ctx: McpContext) {
    const result = await this.vacay.getSchoolHolidayRegions(country, schoolHolidayLanguage(country));
    if (result.error) return errorResult(result.error);
    return ok({ regions: result.data, calendar_regions: calendarRegionCodes(country, result.data) });
  }

  @Tool({
    name: 'list_school_holidays',
    description: 'List school holidays for a country and year, narrowed to a subdivision or group code from list_school_holiday_regions. School holidays are term breaks, so prefer list_holidays for the public holidays a day off is normally counted against.',
    inputSchema: {
      country: z.string().describe('ISO 3166-1 alpha-2 code'),
      year: z.number().int(),
      subdivision: z.string().optional().describe('Subdivision code from list_school_holiday_regions, e.g. DE-BY'),
      group: z.string().optional().describe('Group code from list_school_holiday_regions'),
    },
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async listSchoolHolidays(
    { country, year, subdivision, group }: { country: string; year: number; subdivision?: string; group?: string },
    _ctx: McpContext,
  ) {
    const result = await this.vacay.getSchoolHolidays(String(year), country, subdivision, schoolHolidayLanguage(country), group);
    if (result.error) return errorResult(result.error);
    return ok({ holidays: result.data });
  }

  @Tool({
    name: 'list_vacay_shares',
    description: 'List read-only calendar shares: who the current user shares their vacation calendar with, and which calendars are shared with them.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async listVacayShares(_args: Record<string, never>, ctx: McpContext) {
    return ok(this.vacay.listShares(ctx.userId));
  }

  @Tool({
    name: 'get_shareable_vacay_users',
    description: "List the users the caller can share their calendar with, for share_vacay_calendar's targetUserId. This is a wider set than get_available_vacay_users, which lists candidates for merging plans and therefore leaves out everyone who already sits in a plan of their own.",
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async getShareableVacayUsers(_args: Record<string, never>, ctx: McpContext) {
    return ok({ users: this.vacay.getShareAvailableUsers(ctx.userId) });
  }

  @Tool({
    name: 'share_vacay_calendar',
    description: "Share the current user's vacation calendar with another user (view only, no merge).",
    inputSchema: {
      targetUserId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async shareVacayCalendar({ targetUserId }: { targetUserId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    const me = this.auth.getCurrentUser(ctx.userId);
    if (!me) return errorResult('User not found.');
    const result = this.vacay.shareCalendar(ctx.userId, me.email, targetUserId);
    if (result.error) return errorResult(result.error);
    return ok({ success: true });
  }

  @Tool({
    name: 'unshare_vacay_calendar',
    description: 'Remove a read-only calendar share the current user is part of (revoke as owner, or remove a calendar shared with them).',
    inputSchema: {
      shareId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'write' },
  })
  async unshareVacayCalendar({ shareId }: { shareId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.vacay.removeShare(shareId, ctx.userId, undefined)) {
      return errorResult('Share not found.');
    }
    return ok({ success: true });
  }

  @Tool({
    name: 'get_shared_vacay_calendars',
    description: 'Get the read-only vacation calendars shared with the current user for a year (entries and company holidays per sharer).',
    inputSchema: {
      year: z.number().int(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async getSharedVacayCalendars({ year }: { year: number }, ctx: McpContext) {
    return ok({ calendars: this.vacay.getSharedCalendars(ctx.userId, String(year)) });
  }

  // -------------------------------------------------------------------------
  // Resources (from src/mcp/resources.ts — payloads reproduce jsonContent verbatim)
  // -------------------------------------------------------------------------

  @Resource({
    name: 'vacay-plan',
    uri: 'trek://vacay/plan',
    description: "Full snapshot of the user's active vacation plan (members, years, settings)",
    mimeType: 'application/json',
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async vacayPlanResource(uri: URL, ctx: McpContext) {
    const plan = this.vacay.getPlanData(ctx.userId);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(plan, null, 2),
      }],
    };
  }

  @ResourceTemplate({
    name: 'vacay-entries',
    uriTemplate: 'trek://vacay/entries/{year}',
    description: 'All vacation entries for the active plan and a specific year',
    mimeType: 'application/json',
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async vacayEntriesResource(uri: URL, { year }: { year: string | string[] }, ctx: McpContext) {
    const planId = this.vacay.getActivePlanId(ctx.userId);
    const entries = this.vacay.getEntries(planId, Array.isArray(year) ? year[0] : year, ctx.userId);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(entries, null, 2),
      }],
    };
  }

  @ResourceTemplate({
    name: 'vacay-holidays',
    uriTemplate: 'trek://vacay/holidays/{year}',
    description: "Cached public holidays for the plan's configured region and year",
    mimeType: 'application/json',
    when: vacayAddonOn,
    access: { group: 'vacay', mode: 'read' },
  })
  async vacayHolidaysResource(uri: URL, { year }: { year: string | string[] }, ctx: McpContext) {
    const plan = this.vacay.getActivePlan(ctx.userId);
    const json = (data: unknown) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      }],
    });
    if (!plan.holidays_enabled || !plan.holidays_region) return json([]);
    const yearStr = Array.isArray(year) ? year[0] : year;
    const result = await this.vacay.getHolidays(yearStr, plan.holidays_region);
    return json(result.data ?? []);
  }
}
