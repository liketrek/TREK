/**
 * Unit tests for MCP vacay tools (vacay addon-gated, VacayMcp — DI-discovered
 * via the hand-built test registry in tests/helpers/mcp-test-controllers.ts):
 * get_vacay_plan, get_vacay_year_settings, update_vacay_plan, set_vacay_color,
 * list_vacay_years, add_vacay_year, delete_vacay_year,
 * get_vacay_entries, toggle_vacay_entry, toggle_company_holiday,
 * get_vacay_stats, update_vacay_stats,
 * add_holiday_calendar, update_holiday_calendar, delete_holiday_calendar,
 * list_holiday_countries, list_holidays,
 * list_school_holiday_regions, list_school_holidays,
 * get_shareable_vacay_users.
 * Resources: trek://vacay/plan, trek://vacay/entries/{year},
 * trek://vacay/holidays/{year} — these ride the registry too (attached inside
 * registerTools), so `withTools` must stay on even for resource reads.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

// share_vacay_calendar fires a user notification after inserting; stub it out

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { setAddonEnabled } from '../../helpers/test-db';
import { ADDON_IDS } from '../../../src/addons';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { VacayService } from '../../../src/nest/vacay/vacay.service';

// The plan-settings tests below need the real SQL write, so keep the
// implementation the blanket stub replaces and delegate to it for one call.
const realUpdatePlan = VacayService.prototype.updatePlan;

// Stub the async methods that make external calls (VacayService is DI-native;
// the registry constructs a real instance, so spy on the prototype — the
// successor of the legacy path-level partial mock of services/vacayService).
const updatePlanSpy = vi.spyOn(VacayService.prototype, 'updatePlan').mockResolvedValue({
  plan: { id: 1, block_weekends: true, holidays_enabled: false, company_holidays_enabled: false, carry_over_enabled: false, holiday_calendars: [] },
} as never);
vi.spyOn(VacayService.prototype, 'getCountries').mockResolvedValue({ data: [{ code: 'US', name: 'United States' }] });
vi.spyOn(VacayService.prototype, 'getHolidays').mockResolvedValue({ data: [{ date: '2025-01-01', name: 'New Year' }] });
const schoolRegionsSpy = vi.spyOn(VacayService.prototype, 'getSchoolHolidayRegions').mockResolvedValue({
  data: { groups: [{ code: 'DE-BY-1', name: 'Bayern' }], subdivisions: [{ code: 'DE-BY', name: 'Bayern' }] },
});
const schoolHolidaysSpy = vi.spyOn(VacayService.prototype, 'getSchoolHolidays').mockResolvedValue({
  data: [{ name: 'Sommerferien', startDate: '2025-07-28', endDate: '2025-09-08' }],
});

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  // The `when:` gate reads the injected AddonsService, so the toggle is the row
  // the admin panel writes — and this addon ships disabled by default.
  setAddonEnabled(testDb, ADDON_IDS.VACAY, true);
  broadcastMock.mockClear();
  updatePlanSpy.mockClear();
  schoolRegionsSpy.mockClear();
  schoolHolidaysSpy.mockClear();
  delete process.env.DEMO_MODE;
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

async function withResourceHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: true });
  try { await fn(h); } finally { await h.cleanup(); }
}

function errorText(result: Awaited<ReturnType<McpHarness['client']['callTool']>>): string {
  const text = (result.content as { type: string; text?: string }[]).find((c) => c.type === 'text');
  return text?.text ?? '';
}

/** Fuse two users into one plan through the invite tools, as a member would. */
async function fusePlan(ownerId: number, memberId: number): Promise<number> {
  await withHarness(ownerId, async (h) => {
    await h.client.callTool({ name: 'send_vacay_invite', arguments: { targetUserId: memberId } });
  });
  const planId = (testDb.prepare('SELECT plan_id FROM vacay_plan_members WHERE user_id = ?').get(memberId) as { plan_id: number }).plan_id;
  await withHarness(memberId, async (h) => {
    await h.client.callTool({ name: 'accept_vacay_invite', arguments: { planId } });
  });
  return planId;
}

// ---------------------------------------------------------------------------
// get_vacay_plan
// ---------------------------------------------------------------------------

describe('Tool: get_vacay_plan', () => {
  it('returns plan data object', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_vacay_plan', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.plan).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// update_vacay_plan
// ---------------------------------------------------------------------------

describe('Tool: update_vacay_plan', () => {
  it('calls updatePlan and returns the hydrated plan', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_vacay_plan',
        arguments: { block_weekends: true, holidays_enabled: false },
      });
      const data = parseToolResult(result) as any;
      // Now returns the fully-hydrated plan (matching get_vacay_plan), not { success }.
      expect(data.plan).toBeDefined();
      expect(data.plan.block_weekends).toBe(true);
      expect(data.plan.holidays_enabled).toBe(false);
      expect(Array.isArray(data.plan.holiday_calendars)).toBe(true);
    });
  });

  it('persists school holidays, the weekend weekdays and the week start', async () => {
    const { user } = createUser(testDb);
    updatePlanSpy.mockImplementationOnce(realUpdatePlan);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_vacay_plan',
        arguments: { school_holidays_enabled: true, weekend_days: '5,6', week_start: 0 },
      });
      const data = parseToolResult(result) as any;
      expect(data.plan.school_holidays_enabled).toBe(true);

      const row = testDb.prepare('SELECT school_holidays_enabled, weekend_days, week_start FROM vacay_plans WHERE owner_id = ?').get(user.id) as any;
      expect(row.school_holidays_enabled).toBe(1);
      expect(row.weekend_days).toBe('5,6');
      expect(row.week_start).toBe(0);
    });
  });

  it('leaves the untouched settings alone', async () => {
    const { user } = createUser(testDb);
    updatePlanSpy.mockImplementationOnce(realUpdatePlan);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_vacay_plan', arguments: { weekend_days: '1,2' } });
      const row = testDb.prepare('SELECT weekend_days, week_start, school_holidays_enabled FROM vacay_plans WHERE owner_id = ?').get(user.id) as any;
      expect(row.weekend_days).toBe('1,2');
      // Column defaults, not values this call wrote.
      expect(row.week_start).toBe(1);
      expect(row.school_holidays_enabled).toBe(0);
    });
  });

  it('refuses a non-numeric week_start', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_vacay_plan', arguments: { week_start: 'monday' } });
      expect(result.isError).toBe(true);
      expect(updatePlanSpy).not.toHaveBeenCalled();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_vacay_plan', arguments: { block_weekends: true } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// get_vacay_year_settings
// ---------------------------------------------------------------------------

describe('Tool: get_vacay_year_settings', () => {
  it('falls back to the calendar year when nothing is stored', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_vacay_year_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings.year_type).toBe('calendar');
      expect(data.settings.year_start_month).toBe(1);
      expect(data.settings.year_start_day).toBe(1);
    });
  });

  it('returns a stored fiscal window', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO vacay_user_settings (user_id, year_type, year_start_month, year_start_day, hire_date) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'fiscal', 4, 6, null);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_vacay_year_settings', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.settings.year_type).toBe('fiscal');
      expect(data.settings.year_start_month).toBe(4);
      expect(data.settings.year_start_day).toBe(6);
    });
  });
});

// ---------------------------------------------------------------------------
// set_vacay_color
// ---------------------------------------------------------------------------

describe('Tool: set_vacay_color', () => {
  it('updates color and returns success', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'set_vacay_color', arguments: { color: '#ff0000' } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(data.color).toBe('#ff0000'); // echoes the persisted color
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'set_vacay_color', arguments: { color: '#ff0000' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_vacay_years
// ---------------------------------------------------------------------------

describe('Tool: list_vacay_years', () => {
  it('returns years array', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_vacay_years', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.years)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// add_vacay_year
// ---------------------------------------------------------------------------

describe('Tool: add_vacay_year', () => {
  it('adds year to list', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'add_vacay_year', arguments: { year: 2025 } });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.years)).toBe(true);
      expect(data.years).toContain(2025);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'add_vacay_year', arguments: { year: 2025 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_vacay_year
// ---------------------------------------------------------------------------

describe('Tool: delete_vacay_year', () => {
  it('removes year from list', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      // Add year first
      await h.client.callTool({ name: 'add_vacay_year', arguments: { year: 2025 } });
      const result = await h.client.callTool({ name: 'delete_vacay_year', arguments: { year: 2025 } });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.years)).toBe(true);
      expect(data.years).not.toContain(2025);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_vacay_year', arguments: { year: 2025 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// get_vacay_entries
// ---------------------------------------------------------------------------

describe('Tool: get_vacay_entries', () => {
  it('returns entries array (empty initially)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_vacay_entries', arguments: { year: 2025 } });
      const data = parseToolResult(result) as any;
      expect(data.entries).toBeDefined();
      expect(Array.isArray(data.entries.entries)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// toggle_vacay_entry
// ---------------------------------------------------------------------------

describe('Tool: toggle_vacay_entry', () => {
  it('toggles entry and returns action', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-16' } });
      const data = parseToolResult(result) as any;
      expect(data.action).toBeDefined();
    });
  });

  it('logs a half day', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-16', fraction: 0.5 } });
      const data = parseToolResult(result) as any;
      expect(data.action).toBe('added');

      const row = testDb.prepare('SELECT fraction, kind FROM vacay_entries WHERE user_id = ? AND date = ?').get(user.id, '2025-06-16') as any;
      expect(row.fraction).toBe(0.5);
      expect(row.kind).toBe('vacation');
    });
  });

  it('logs a comp day', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-17', kind: 'comp' } });
      const row = testDb.prepare('SELECT fraction, kind FROM vacay_entries WHERE user_id = ? AND date = ?').get(user.id, '2025-06-17') as any;
      expect(row.kind).toBe('comp');
      expect(row.fraction).toBe(1);
    });
  });

  it('converts the day in place on a different fraction and clears it on a repeat', async () => {
    const { user } = createUser(testDb);
    const row = () => testDb.prepare('SELECT fraction, kind FROM vacay_entries WHERE user_id = ? AND date = ?').get(user.id, '2025-06-18') as any;
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-18', fraction: 0.5, kind: 'comp' } });
      expect(row().fraction).toBe(0.5);

      const converted = await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-18', fraction: 1, kind: 'comp' } });
      expect((parseToolResult(converted) as any).action).toBe('updated');
      expect(row().fraction).toBe(1);
      expect(row().kind).toBe('comp');

      const cleared = await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-18', fraction: 1, kind: 'comp' } });
      expect((parseToolResult(cleared) as any).action).toBe('removed');
      expect(row()).toBeUndefined();
    });
  });

  it('logs the day for another member of the plan', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    await fusePlan(owner.id, member.id);

    await withHarness(owner.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_vacay_entry',
        arguments: { date: '2025-06-19', fraction: 0.5, targetUserId: member.id },
      });
      expect((parseToolResult(result) as any).action).toBe('added');

      const row = testDb.prepare('SELECT user_id, fraction FROM vacay_entries WHERE date = ?').get('2025-06-19') as any;
      expect(row.user_id).toBe(member.id);
      expect(row.fraction).toBe(0.5);
    });
  });

  it('refuses a target user outside the plan, the way POST /entries/toggle does', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_vacay_entry',
        arguments: { date: '2025-06-20', targetUserId: stranger.id },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('User not in plan');
      expect(testDb.prepare('SELECT id FROM vacay_entries WHERE user_id = ?').get(stranger.id)).toBeUndefined();
    });
  });

  it('refuses a fraction the contract does not allow', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-21', fraction: 0.25 } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM vacay_entries WHERE date = ?').get('2025-06-21')).toBeUndefined();
    });
  });

  it('refuses a leave kind the contract does not allow', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-22', kind: 'sabbatical' } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM vacay_entries WHERE date = ?').get('2025-06-22')).toBeUndefined();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-16' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// toggle_company_holiday
// ---------------------------------------------------------------------------

describe('Tool: toggle_company_holiday', () => {
  it('toggles company holiday and returns action', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_company_holiday',
        arguments: { date: '2025-12-25', note: 'Christmas' },
      });
      const data = parseToolResult(result) as any;
      expect(data.action).toBeDefined();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_company_holiday', arguments: { date: '2025-12-25' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// get_vacay_stats
// ---------------------------------------------------------------------------

describe('Tool: get_vacay_stats', () => {
  it('returns stats object', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_vacay_stats', arguments: { year: 2025 } });
      const data = parseToolResult(result) as any;
      expect(data.stats).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// update_vacay_stats
// ---------------------------------------------------------------------------

describe('Tool: update_vacay_stats', () => {
  it('updates vacation days allowance and returns success', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_vacay_stats', arguments: { year: 2025, vacationDays: 25 } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_vacay_stats', arguments: { year: 2025, vacationDays: 20 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// add_holiday_calendar
// ---------------------------------------------------------------------------

describe('Tool: add_holiday_calendar', () => {
  it('inserts calendar row and returns calendar', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_holiday_calendar',
        arguments: { region: 'US', label: 'US Holidays', color: '#ff0000' },
      });
      const data = parseToolResult(result) as any;
      expect(data.calendar).toBeDefined();
      expect(data.calendar.region).toBe('US');
    });
  });

  it('stores a school-holiday calendar with the colour that goes with the type', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'add_holiday_calendar',
        arguments: { region: 'DE-BY', type: 'school_holiday' },
      });
      const data = parseToolResult(result) as any;
      const row = testDb.prepare('SELECT type, region, color FROM vacay_holiday_calendars WHERE id = ?').get(data.calendar.id) as any;
      expect(row.type).toBe('school_holiday');
      expect(row.region).toBe('DE-BY');
      expect(row.color).toBe('#a5f3fc');
    });
  });

  it('still writes a public-holiday calendar when the type is omitted', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'add_holiday_calendar', arguments: { region: 'GB' } });
      const data = parseToolResult(result) as any;
      const row = testDb.prepare('SELECT type, color FROM vacay_holiday_calendars WHERE id = ?').get(data.calendar.id) as any;
      expect(row.type).toBe('public_holiday');
      expect(row.color).toBe('#fecaca');
    });
  });

  it('refuses a calendar type outside the contract', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'add_holiday_calendar', arguments: { region: 'DE', type: 'bank_holiday' } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM vacay_holiday_calendars WHERE region = ?').get('DE')).toBeUndefined();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'add_holiday_calendar', arguments: { region: 'US' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_holiday_calendar
// ---------------------------------------------------------------------------

describe('Tool: update_holiday_calendar', () => {
  it('updates label and color', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      // First add a calendar
      const addResult = await h.client.callTool({
        name: 'add_holiday_calendar',
        arguments: { region: 'DE', label: 'Germany' },
      });
      const added = parseToolResult(addResult) as any;
      const calId = added.calendar.id;

      const result = await h.client.callTool({
        name: 'update_holiday_calendar',
        arguments: { calendarId: calId, label: 'German Holidays', color: '#00ff00' },
      });
      const data = parseToolResult(result) as any;
      expect(data.calendar).toBeDefined();
      expect(data.calendar.label).toBe('German Holidays');
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_holiday_calendar', arguments: { calendarId: 1, label: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_holiday_calendar
// ---------------------------------------------------------------------------

describe('Tool: delete_holiday_calendar', () => {
  it('removes calendar and returns success', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const addResult = await h.client.callTool({
        name: 'add_holiday_calendar',
        arguments: { region: 'FR' },
      });
      const added = parseToolResult(addResult) as any;
      const calId = added.calendar.id;

      const result = await h.client.callTool({ name: 'delete_holiday_calendar', arguments: { calendarId: calId } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_holiday_calendar', arguments: { calendarId: 1 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_holiday_countries
// ---------------------------------------------------------------------------

describe('Tool: list_holiday_countries', () => {
  it('returns countries from mocked service', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_holiday_countries', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.countries).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// list_holidays
// ---------------------------------------------------------------------------

describe('Tool: list_holidays', () => {
  it('returns holidays from mocked service', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_holidays', arguments: { country: 'US', year: 2025 } });
      const data = parseToolResult(result) as any;
      expect(data.holidays).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// list_school_holiday_regions
// ---------------------------------------------------------------------------

describe('Tool: list_school_holiday_regions', () => {
  it('returns the group and subdivision codes, asking in the country language like the route does', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_school_holiday_regions', arguments: { country: 'de' } });
      const data = parseToolResult(result) as any;
      expect(data.regions.subdivisions[0].code).toBe('DE-BY');
      expect(schoolRegionsSpy).toHaveBeenCalledWith('de', 'DE');
    });
  });

  it('asks in English for every other country', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'list_school_holiday_regions', arguments: { country: 'NL' } });
      expect(schoolRegionsSpy).toHaveBeenCalledWith('NL', 'EN');
    });
  });

  it('surfaces the upstream failure', async () => {
    const { user } = createUser(testDb);
    schoolRegionsSpy.mockResolvedValueOnce({ error: 'Failed to fetch school holiday regions' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_school_holiday_regions', arguments: { country: 'DE' } });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('Failed to fetch school holiday regions');
    });
  });
});

// ---------------------------------------------------------------------------
// list_school_holidays
// ---------------------------------------------------------------------------

describe('Tool: list_school_holidays', () => {
  it('forwards the subdivision and group filters', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_school_holidays',
        arguments: { country: 'DE', year: 2025, subdivision: 'DE-BY', group: 'DE-BY-1' },
      });
      const data = parseToolResult(result) as any;
      expect(data.holidays[0].name).toBe('Sommerferien');
      expect(schoolHolidaysSpy).toHaveBeenCalledWith('2025', 'DE', 'DE-BY', 'DE', 'DE-BY-1');
    });
  });

  it('leaves both filters unset when they are omitted', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'list_school_holidays', arguments: { country: 'AT', year: 2026 } });
      expect(schoolHolidaysSpy).toHaveBeenCalledWith('2026', 'AT', undefined, 'EN', undefined);
    });
  });

  it('surfaces the upstream failure', async () => {
    const { user } = createUser(testDb);
    schoolHolidaysSpy.mockResolvedValueOnce({ error: 'Failed to fetch school holidays' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_school_holidays', arguments: { country: 'DE', year: 2025 } });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('Failed to fetch school holidays');
    });
  });

  it('refuses a non-numeric year', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_school_holidays', arguments: { country: 'DE', year: '2025' } });
      expect(result.isError).toBe(true);
      expect(schoolHolidaysSpy).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// list_vacay_shares
// ---------------------------------------------------------------------------

describe('Tool: list_vacay_shares', () => {
  it('returns outgoing and incoming shares', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'share_vacay_calendar', arguments: { targetUserId: other.id } });
      const result = await h.client.callTool({ name: 'list_vacay_shares', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.outgoing)).toBe(true);
      expect(Array.isArray(data.incoming)).toBe(true);
      expect(data.outgoing).toHaveLength(1);
      expect(data.outgoing[0].user_id).toBe(other.id);
    });
  });
});

// ---------------------------------------------------------------------------
// get_shareable_vacay_users
// ---------------------------------------------------------------------------

describe('Tool: get_shareable_vacay_users', () => {
  it('offers users the fusion picker leaves out because they already sit in a plan', async () => {
    const { user } = createUser(testDb);
    const { user: fusedOwner } = createUser(testDb);
    const { user: fusedMember } = createUser(testDb);
    await fusePlan(fusedOwner.id, fusedMember.id);

    await withHarness(user.id, async (h) => {
      const shareable = parseToolResult(await h.client.callTool({ name: 'get_shareable_vacay_users', arguments: {} })) as any;
      const fusable = parseToolResult(await h.client.callTool({ name: 'get_available_vacay_users', arguments: {} })) as any;

      const shareableIds = shareable.users.map((u: any) => u.id);
      expect(shareableIds).toContain(fusedOwner.id);
      expect(shareableIds).toContain(fusedMember.id);
      expect(fusable.users.map((u: any) => u.id)).not.toContain(fusedOwner.id);

      // The share picker reaches across plans, so it deliberately answers with
      // usernames only rather than widening the instance directory.
      expect(shareable.users[0].email).toBeUndefined();
    });
  });

  it('drops a user the caller already shares with, and never the caller', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const before = parseToolResult(await h.client.callTool({ name: 'get_shareable_vacay_users', arguments: {} })) as any;
      expect(before.users.map((u: any) => u.id)).toEqual([other.id]);

      await h.client.callTool({ name: 'share_vacay_calendar', arguments: { targetUserId: other.id } });

      const after = parseToolResult(await h.client.callTool({ name: 'get_shareable_vacay_users', arguments: {} })) as any;
      expect(after.users).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// share_vacay_calendar
// ---------------------------------------------------------------------------

describe('Tool: share_vacay_calendar', () => {
  it('creates a share and returns success', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'share_vacay_calendar', arguments: { targetUserId: other.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      const row = testDb.prepare('SELECT id FROM vacay_shares WHERE owner_id = ? AND user_id = ?').get(user.id, other.id);
      expect(row).toBeDefined();
    });
  });

  it('errors when sharing with yourself', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'share_vacay_calendar', arguments: { targetUserId: user.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const { user: other } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'share_vacay_calendar', arguments: { targetUserId: other.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// unshare_vacay_calendar
// ---------------------------------------------------------------------------

describe('Tool: unshare_vacay_calendar', () => {
  it('removes an existing share and returns success', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'share_vacay_calendar', arguments: { targetUserId: other.id } });
      const shareId = (testDb.prepare('SELECT id FROM vacay_shares WHERE owner_id = ?').get(user.id) as any).id;

      const result = await h.client.callTool({ name: 'unshare_vacay_calendar', arguments: { shareId } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM vacay_shares WHERE id = ?').get(shareId)).toBeUndefined();
    });
  });

  it('errors when the share does not exist', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unshare_vacay_calendar', arguments: { shareId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unshare_vacay_calendar', arguments: { shareId: 1 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// get_shared_vacay_calendars
// ---------------------------------------------------------------------------

describe('Tool: get_shared_vacay_calendars', () => {
  it('returns the sharer entries for the viewer', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    await withHarness(owner.id, async (h) => {
      await h.client.callTool({ name: 'toggle_vacay_entry', arguments: { date: '2025-06-16' } });
      await h.client.callTool({ name: 'share_vacay_calendar', arguments: { targetUserId: viewer.id } });
    });
    await withHarness(viewer.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_shared_vacay_calendars', arguments: { year: 2025 } });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.calendars)).toBe(true);
      expect(data.calendars).toHaveLength(1);
      expect(data.calendars[0].owner_id).toBe(owner.id);
      expect(data.calendars[0].entries.map((e: any) => e.date)).toContain('2025-06-16');
    });
  });
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

describe('Resource: trek://vacay/plan', () => {
  it('returns plan data', async () => {
    const { user } = createUser(testDb);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://vacay/plan' });
      const data = parseResourceResult(result) as any;
      expect(data).toBeDefined();
    });
  });
});

describe('Resource: trek://vacay/entries/{year}', () => {
  it('returns entries for a year', async () => {
    const { user } = createUser(testDb);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://vacay/entries/2025' });
      const data = parseResourceResult(result) as any;
      expect(data).toBeDefined();
      expect(Array.isArray(data.entries)).toBe(true);
    });
  });
});

describe('Resource: trek://vacay/holidays/{year}', () => {
  it('returns [] while public holidays are disabled or no region is set', async () => {
    const { user } = createUser(testDb);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://vacay/holidays/2025' });
      const data = parseResourceResult(result) as unknown[];
      expect(data).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// decline_vacay_invite (demo guard added by the vacay quirk-fix commit — the
// legacy registrar was the only vacay write without it)
// ---------------------------------------------------------------------------

describe('Tool: decline_vacay_invite', () => {
  it('declines a pending invite', async () => {
    const { user: owner } = createUser(testDb);
    const { user: invitee } = createUser(testDb);
    await withHarness(owner.id, async (h) => {
      await h.client.callTool({ name: 'send_vacay_invite', arguments: { targetUserId: invitee.id } });
    });
    await withHarness(invitee.id, async (h) => {
      const result = await h.client.callTool({ name: 'decline_vacay_invite', arguments: { planId: testDb.prepare('SELECT plan_id FROM vacay_plan_members WHERE user_id = ?').get(invitee.id)!.plan_id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'decline_vacay_invite', arguments: { planId: 1 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// The region code add_holiday_calendar actually needs
//
// A group is stored as COUNTRY|group:CODE and the client's parseCalendarRegion
// reads a bare code as a subdivision, so handing a model the provider's raw
// group code produces a calendar that queries nothing. Belgium and the
// Netherlands are the two countries this hits.
// ---------------------------------------------------------------------------

describe('Tool: list_school_holiday_regions (the codes a calendar can be built from)', () => {
  async function regionsFor(userId: number, country: string): Promise<any> {
    let data: any;
    await withHarness(userId, async (h) => {
      const result = await h.client.callTool({
        name: 'list_school_holiday_regions',
        arguments: { country },
      });
      data = parseToolResult(result);
    });
    return data;
  }

  it('prefixes a group code with the country, the way the calendar reader expects', async () => {
    const { user } = createUser(testDb);
    schoolRegionsSpy.mockResolvedValueOnce({ data: { groups: [{ code: 'NO', name: 'Noord' }], subdivisions: [] } });
    const data = await regionsFor(user.id, 'NL');
    expect(data.calendar_regions).toEqual([{ region: 'NL|group:NO', kind: 'group' }]);
  });

  it('leaves a subdivision code alone', async () => {
    const { user } = createUser(testDb);
    schoolRegionsSpy.mockResolvedValueOnce({ data: { groups: [], subdivisions: [{ code: 'DE-BY', name: 'Bayern' }] } });
    const data = await regionsFor(user.id, 'DE');
    expect(data.calendar_regions).toEqual([{ region: 'DE-BY', kind: 'subdivision' }]);
  });

  it('walks nested children, which the provider uses for sub-regions', async () => {
    const { user } = createUser(testDb);
    schoolRegionsSpy.mockResolvedValueOnce({
      data: { groups: [], subdivisions: [{ code: 'CH-BE', children: [{ code: 'CH-BE-1' }, { code: 'CH-BE-2', children: null }] }] },
    });
    const data = await regionsFor(user.id, 'CH');
    expect(data.calendar_regions.map((r: any) => r.region)).toEqual(['CH-BE', 'CH-BE-1', 'CH-BE-2']);
  });

  it('still returns the raw provider payload alongside it', async () => {
    const { user } = createUser(testDb);
    schoolRegionsSpy.mockResolvedValueOnce({ data: { groups: [], subdivisions: [{ code: 'AT-9' }] } });
    const data = await regionsFor(user.id, 'AT');
    expect(data.regions.subdivisions).toEqual([{ code: 'AT-9' }]);
  });
});
