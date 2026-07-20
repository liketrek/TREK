import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup (real in-memory SQLite) ─────────────────────────────────────────

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
    canAccessTrip: () => null,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
// Mock websocket so notifyPlanUsers doesn't throw
vi.mock('../../../src/websocket', () => ({ broadcastToUser: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';

import {
  getOwnPlan,
  getActivePlan,
  getPlanUsers,
  migrateHolidayCalendars,
  updatePlan,
  addHolidayCalendar,
  updateHolidayCalendar,
  deleteHolidayCalendar,
  setUserColor,
  acceptInvite,
  declineInvite,
  cancelInvite,
  getAvailableUsers,
  listYears,
  addYear,
  deleteYear,
  getEntries,
  toggleEntry,
  toggleCompanyHoliday,
  getStats,
  applyHolidayCalendars,
} from '../../../src/services/vacayService';

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  // Stub fetch with empty holiday list by default so updatePlan / applyHolidayCalendars
  // never makes real network calls.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  }));
});

afterAll(() => {
  vi.unstubAllGlobals();
  testDb.close();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Insert a vacay_plan_members row directly (no service factory for it). */
function insertMember(planId: number, userId: number, status: 'pending' | 'accepted'): void {
  testDb.prepare(
    "INSERT INTO vacay_plan_members (plan_id, user_id, status) VALUES (?, ?, ?)"
  ).run(planId, userId, status);
}

/** Fast helper: create a user and immediately materialise their own plan. */
function setupUserWithPlan() {
  const { user } = createUser(testDb);
  const plan = getOwnPlan(user.id);
  return { user, plan };
}

// ── getOwnPlan ────────────────────────────────────────────────────────────────

describe('getOwnPlan', () => {
  it('VACAY-SVC-001: creates a new plan on first call for a fresh user', () => {
    const { user } = createUser(testDb);
    const plan = getOwnPlan(user.id);

    expect(plan).toBeDefined();
    expect(plan.owner_id).toBe(user.id);
    expect(plan.id).toBeGreaterThan(0);
  });

  it('VACAY-SVC-002: returns the same plan on a second call (idempotent)', () => {
    const { user } = createUser(testDb);
    const first = getOwnPlan(user.id);
    const second = getOwnPlan(user.id);

    expect(second.id).toBe(first.id);
  });

  it('VACAY-SVC-003: seeds the current year row in vacay_years after plan creation', () => {
    const { user } = createUser(testDb);
    const plan = getOwnPlan(user.id);
    const yr = new Date().getFullYear();

    const row = testDb
      .prepare('SELECT * FROM vacay_years WHERE plan_id = ? AND year = ?')
      .get(plan.id, yr);

    expect(row).toBeDefined();
  });

  it('VACAY-SVC-004: seeds the current year user_year row with default 30 vacation_days', () => {
    const { user } = createUser(testDb);
    const plan = getOwnPlan(user.id);
    const yr = new Date().getFullYear();

    const row = testDb
      .prepare('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?')
      .get(user.id, plan.id, yr) as { vacation_days: number } | undefined;

    expect(row).toBeDefined();
    expect(row!.vacation_days).toBe(30);
  });
});

// ── getActivePlan ─────────────────────────────────────────────────────────────

describe('getActivePlan', () => {
  it('VACAY-SVC-005: returns own plan when user has no accepted membership in another plan', () => {
    const { user, plan } = setupUserWithPlan();
    const active = getActivePlan(user.id);

    expect(active.id).toBe(plan.id);
    expect(active.owner_id).toBe(user.id);
  });

  it('VACAY-SVC-006: returns the shared plan when user has an accepted membership in another plan', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    // Make sure member also has their own plan materialised first
    getOwnPlan(member.id);

    insertMember(ownerPlan.id, member.id, 'accepted');

    const active = getActivePlan(member.id);
    expect(active.id).toBe(ownerPlan.id);
  });

  it('VACAY-SVC-007: pending membership does NOT override own plan as active', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    getOwnPlan(member.id);

    insertMember(ownerPlan.id, member.id, 'pending');

    const active = getActivePlan(member.id);
    // Should still point to member's own plan
    expect(active.owner_id).toBe(member.id);
  });
});

// ── getPlanUsers ──────────────────────────────────────────────────────────────

describe('getPlanUsers', () => {
  it('VACAY-SVC-008: returns [owner] for a solo plan', () => {
    const { user, plan } = setupUserWithPlan();
    const users = getPlanUsers(plan.id);

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(user.id);
  });

  it('VACAY-SVC-009: returns [owner, member] after an accepted membership is inserted', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');

    const users = getPlanUsers(plan.id);

    expect(users).toHaveLength(2);
    expect(users.map(u => u.id)).toContain(owner.id);
    expect(users.map(u => u.id)).toContain(member.id);
  });

  it('VACAY-SVC-010: pending membership members are NOT included in plan users', () => {
    const { plan } = setupUserWithPlan();
    const { user: pendingUser } = createUser(testDb);
    insertMember(plan.id, pendingUser.id, 'pending');

    const users = getPlanUsers(plan.id);
    expect(users.map(u => u.id)).not.toContain(pendingUser.id);
  });

  it('VACAY-SVC-011: returns empty array for a non-existent plan id', () => {
    const users = getPlanUsers(99999);
    expect(users).toEqual([]);
  });
});

// ── migrateHolidayCalendars ───────────────────────────────────────────────────

describe('migrateHolidayCalendars', () => {
  it('VACAY-SVC-012: does nothing when holidays_enabled is falsy', async () => {
    const { plan } = setupUserWithPlan();
    const planRow = { ...plan, holidays_enabled: 0, holidays_region: 'DE' };

    await migrateHolidayCalendars(plan.id, planRow);

    const rows = testDb
      .prepare('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ?')
      .all(plan.id);
    expect(rows).toHaveLength(0);
  });

  it('VACAY-SVC-013: inserts a calendar row when holidays_enabled=1 and holidays_region is set', async () => {
    const { plan } = setupUserWithPlan();
    const planRow = { ...plan, holidays_enabled: 1, holidays_region: 'DE' };

    await migrateHolidayCalendars(plan.id, planRow);

    const rows = testDb
      .prepare('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ?')
      .all(plan.id) as { region: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].region).toBe('DE');
  });

  it('VACAY-SVC-014: does nothing if a calendar row already exists (no duplicate)', async () => {
    const { plan } = setupUserWithPlan();
    const planRow = { ...plan, holidays_enabled: 1, holidays_region: 'FR' };

    await migrateHolidayCalendars(plan.id, planRow);
    // Call a second time — should NOT insert another row
    await migrateHolidayCalendars(plan.id, planRow);

    const rows = testDb
      .prepare('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ?')
      .all(plan.id);
    expect(rows).toHaveLength(1);
  });
});

// ── updatePlan ────────────────────────────────────────────────────────────────

describe('updatePlan', () => {
  it('VACAY-SVC-015: updates block_weekends flag', async () => {
    const { plan } = setupUserWithPlan();

    await updatePlan(plan.id, { block_weekends: true }, undefined);

    const updated = testDb
      .prepare('SELECT block_weekends FROM vacay_plans WHERE id = ?')
      .get(plan.id) as { block_weekends: number };
    expect(updated.block_weekends).toBe(1);
  });

  it('VACAY-SVC-016: updates holidays_enabled flag', async () => {
    const { plan } = setupUserWithPlan();

    await updatePlan(plan.id, { holidays_enabled: true }, undefined);

    const updated = testDb
      .prepare('SELECT holidays_enabled FROM vacay_plans WHERE id = ?')
      .get(plan.id) as { holidays_enabled: number };
    expect(updated.holidays_enabled).toBe(1);
  });

  it('VACAY-SVC-017: returns the updated plan object with boolean-coerced flags', async () => {
    const { plan } = setupUserWithPlan();

    const result = await updatePlan(plan.id, { block_weekends: false }, undefined);

    expect(result.plan.block_weekends).toBe(false);
    expect(typeof result.plan.holidays_enabled).toBe('boolean');
  });

  it('VACAY-SVC-018: resets carried_over to 0 for all user_years when carry_over_enabled is set to false', async () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    // Manually set a non-zero carried_over value
    testDb
      .prepare('UPDATE vacay_user_years SET carried_over = 5 WHERE user_id = ? AND plan_id = ? AND year = ?')
      .run(user.id, plan.id, yr);

    await updatePlan(plan.id, { carry_over_enabled: false }, undefined);

    const row = testDb
      .prepare('SELECT carried_over FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?')
      .get(user.id, plan.id, yr) as { carried_over: number };
    expect(row.carried_over).toBe(0);
  });
});

// ── addHolidayCalendar ────────────────────────────────────────────────────────

describe('addHolidayCalendar', () => {
  it('VACAY-SVC-019: inserts a new calendar row and returns the calendar object', () => {
    const { plan } = setupUserWithPlan();

    const cal = addHolidayCalendar(plan.id, 'GB', 'UK Holidays', '#ff0000', 0, undefined);

    expect(cal).toBeDefined();
    expect(cal.id).toBeGreaterThan(0);
    expect(cal.region).toBe('GB');
    expect(cal.label).toBe('UK Holidays');
    expect(cal.color).toBe('#ff0000');
  });

  it('VACAY-SVC-020: uses default color #fecaca when no color is provided', () => {
    const { plan } = setupUserWithPlan();

    const cal = addHolidayCalendar(plan.id, 'US', null, undefined, 0, undefined);

    expect(cal.color).toBe('#fecaca');
  });
});

// ── updateHolidayCalendar ─────────────────────────────────────────────────────

describe('updateHolidayCalendar', () => {
  it('VACAY-SVC-021: changes label and color on an existing calendar', () => {
    const { plan } = setupUserWithPlan();
    const cal = addHolidayCalendar(plan.id, 'DE', 'Germany', '#aabbcc', 0, undefined);

    const updated = updateHolidayCalendar(cal.id, plan.id, { label: 'Deutschland', color: '#112233' }, undefined);

    expect(updated).not.toBeNull();
    expect(updated!.label).toBe('Deutschland');
    expect(updated!.color).toBe('#112233');
  });

  it('VACAY-SVC-022: returns null when the calendar id does not exist in the plan', () => {
    const { plan } = setupUserWithPlan();

    const result = updateHolidayCalendar(99999, plan.id, { label: 'Nope' }, undefined);

    expect(result).toBeNull();
  });
});

// ── deleteHolidayCalendar ─────────────────────────────────────────────────────

describe('deleteHolidayCalendar', () => {
  it('VACAY-SVC-023: removes the calendar row and returns true on success', () => {
    const { plan } = setupUserWithPlan();
    const cal = addHolidayCalendar(plan.id, 'FR', null, undefined, 0, undefined);

    const result = deleteHolidayCalendar(cal.id, plan.id, undefined);

    expect(result).toBe(true);
    const row = testDb.prepare('SELECT id FROM vacay_holiday_calendars WHERE id = ?').get(cal.id);
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-024: returns false when the calendar does not exist', () => {
    const { plan } = setupUserWithPlan();

    const result = deleteHolidayCalendar(99999, plan.id, undefined);

    expect(result).toBe(false);
  });
});

// ── setUserColor ──────────────────────────────────────────────────────────────

describe('setUserColor', () => {
  it('VACAY-SVC-025: inserts a color for a user in a plan', () => {
    const { user, plan } = setupUserWithPlan();

    setUserColor(user.id, plan.id, '#123456', undefined);

    const row = testDb
      .prepare('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?')
      .get(user.id, plan.id) as { color: string } | undefined;
    expect(row?.color).toBe('#123456');
  });

  it('VACAY-SVC-026: updates the color when called a second time (upsert)', () => {
    const { user, plan } = setupUserWithPlan();
    setUserColor(user.id, plan.id, '#aaaaaa', undefined);

    setUserColor(user.id, plan.id, '#bbbbbb', undefined);

    const row = testDb
      .prepare('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?')
      .get(user.id, plan.id) as { color: string };
    expect(row.color).toBe('#bbbbbb');
  });
});

// ── listYears / addYear / deleteYear ──────────────────────────────────────────

describe('listYears', () => {
  it('VACAY-SVC-027: returns the seeded current year for a freshly created plan', () => {
    const { plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    const years = listYears(plan.id);

    expect(years).toContain(yr);
  });
});

describe('addYear', () => {
  it('VACAY-SVC-028: inserts a new year and creates a user_year record', () => {
    const { user, plan } = setupUserWithPlan();
    const newYear = new Date().getFullYear() + 2;

    addYear(plan.id, newYear, undefined);

    const years = listYears(plan.id);
    expect(years).toContain(newYear);

    const userYear = testDb
      .prepare('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?')
      .get(user.id, plan.id, newYear) as { vacation_days: number } | undefined;
    expect(userYear).toBeDefined();
    expect(userYear!.vacation_days).toBe(30);
  });

  it('VACAY-SVC-029: carries over remaining days to the new year when carry_over_enabled is true', () => {
    const { user, plan } = setupUserWithPlan();
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // Enable carry-over and seed some entries for the current year
    testDb.prepare('UPDATE vacay_plans SET carry_over_enabled = 1 WHERE id = ?').run(plan.id);
    // Ensure current year row exists with 10 vacation days
    testDb.prepare(`
      INSERT OR REPLACE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over)
      VALUES (?, ?, ?, 10, 0)
    `).run(user.id, plan.id, currentYear);
    // Add 3 entries (used days) in the current year
    for (let day = 1; day <= 3; day++) {
      const dateStr = `${currentYear}-06-0${day}`;
      testDb.prepare('INSERT OR IGNORE INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(plan.id, user.id, dateStr, '');
    }

    addYear(plan.id, nextYear, undefined);

    const userYear = testDb
      .prepare('SELECT carried_over FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?')
      .get(user.id, plan.id, nextYear) as { carried_over: number } | undefined;
    // 10 vacation days - 3 used = 7 carried over
    expect(userYear?.carried_over).toBe(7);
  });
});

describe('deleteYear', () => {
  it('VACAY-SVC-030: removes the year row and its associated entries', () => {
    const { user, plan } = setupUserWithPlan();
    const targetYear = new Date().getFullYear() + 3;

    addYear(plan.id, targetYear, undefined);
    // Insert an entry for that year
    testDb
      .prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)')
      .run(plan.id, user.id, `${targetYear}-07-15`, '');

    deleteYear(plan.id, targetYear, undefined);

    const yearRow = testDb
      .prepare('SELECT * FROM vacay_years WHERE plan_id = ? AND year = ?')
      .get(plan.id, targetYear);
    expect(yearRow).toBeUndefined();

    const entries = testDb
      .prepare("SELECT * FROM vacay_entries WHERE plan_id = ? AND date LIKE ?")
      .all(plan.id, `${targetYear}-%`);
    expect(entries).toHaveLength(0);
  });
});

// ── getEntries / toggleEntry ──────────────────────────────────────────────────

describe('getEntries', () => {
  it('VACAY-SVC-031: returns empty entries and companyHolidays for a new plan+year', () => {
    const { plan } = setupUserWithPlan();
    const yr = new Date().getFullYear().toString();

    const result = getEntries(plan.id, yr);

    expect(result.entries).toEqual([]);
    expect(result.companyHolidays).toEqual([]);
  });
});

describe('toggleEntry', () => {
  it('VACAY-SVC-032: adds an entry on first call (action: added)', () => {
    const { user, plan } = setupUserWithPlan();

    const result = toggleEntry(user.id, plan.id, '2025-08-01', undefined);

    expect(result.action).toBe('added');
    const row = testDb
      .prepare('SELECT * FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-01');
    expect(row).toBeDefined();
  });

  it('VACAY-SVC-033: removes the entry on second call (action: removed)', () => {
    const { user, plan } = setupUserWithPlan();

    toggleEntry(user.id, plan.id, '2025-08-02', undefined);
    const result = toggleEntry(user.id, plan.id, '2025-08-02', undefined);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT * FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-02');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-033a: logs a half day when fraction is 0.5 (#552)', () => {
    const { user, plan } = setupUserWithPlan();

    const result = toggleEntry(user.id, plan.id, '2025-08-05', 0.5);

    expect(result).toMatchObject({ action: 'added', fraction: 0.5 });
    const row = testDb
      .prepare('SELECT fraction FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-05') as { fraction: number };
    expect(row.fraction).toBe(0.5);
  });

  it('VACAY-SVC-033b: converts a full day into a half day in place (action: updated)', () => {
    const { user, plan } = setupUserWithPlan();

    toggleEntry(user.id, plan.id, '2025-08-06', 1);
    const result = toggleEntry(user.id, plan.id, '2025-08-06', 0.5);

    expect(result).toMatchObject({ action: 'updated', fraction: 0.5 });
    const row = testDb
      .prepare('SELECT fraction FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-06') as { fraction: number };
    expect(row.fraction).toBe(0.5);
  });

  it('VACAY-SVC-033c: toggling the same half day again clears it (action: removed)', () => {
    const { user, plan } = setupUserWithPlan();

    toggleEntry(user.id, plan.id, '2025-08-07', 0.5);
    const result = toggleEntry(user.id, plan.id, '2025-08-07', 0.5);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT id FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-07');
    expect(row).toBeUndefined();
  });
});

// ── toggleCompanyHoliday ──────────────────────────────────────────────────────

describe('toggleCompanyHoliday', () => {
  it('VACAY-SVC-034: adds a company holiday on first call (action: added)', () => {
    const { plan } = setupUserWithPlan();

    const result = toggleCompanyHoliday(plan.id, '2025-12-25', 'Christmas', undefined);

    expect(result.action).toBe('added');
    const row = testDb
      .prepare('SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date = ?')
      .get(plan.id, '2025-12-25');
    expect(row).toBeDefined();
  });

  it('VACAY-SVC-035: removes the company holiday on second call (action: removed)', () => {
    const { plan } = setupUserWithPlan();

    toggleCompanyHoliday(plan.id, '2025-12-26', 'Boxing Day', undefined);
    const result = toggleCompanyHoliday(plan.id, '2025-12-26', undefined, undefined);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date = ?')
      .get(plan.id, '2025-12-26');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-036: adding a company holiday removes any existing vacay_entry on that date', () => {
    const { user, plan } = setupUserWithPlan();

    // First add a personal entry on that date
    toggleEntry(user.id, plan.id, '2025-05-01', undefined);

    // Now declare it a company holiday — the personal entry should be wiped
    toggleCompanyHoliday(plan.id, '2025-05-01', 'Labour Day', undefined);

    const personalEntry = testDb
      .prepare('SELECT * FROM vacay_entries WHERE plan_id = ? AND date = ?')
      .get(plan.id, '2025-05-01');
    expect(personalEntry).toBeUndefined();
  });
});

// ── acceptInvite / declineInvite / cancelInvite ───────────────────────────────

describe('acceptInvite', () => {
  it('VACAY-SVC-037: changes membership status to accepted', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: invitee } = createUser(testDb);
    getOwnPlan(invitee.id); // ensure own plan exists for data migration path
    insertMember(ownerPlan.id, invitee.id, 'pending');

    const result = acceptInvite(invitee.id, ownerPlan.id, undefined);

    expect(result.error).toBeUndefined();
    const row = testDb
      .prepare('SELECT status FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?')
      .get(ownerPlan.id, invitee.id) as { status: string } | undefined;
    expect(row?.status).toBe('accepted');
  });

  it('VACAY-SVC-038: returns 404 error when there is no pending invite', () => {
    const { user } = createUser(testDb);

    const result = acceptInvite(user.id, 99999, undefined);

    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('VACAY-SVC-039: accepted member becomes visible via getActivePlan', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: invitee } = createUser(testDb);
    getOwnPlan(invitee.id);
    insertMember(ownerPlan.id, invitee.id, 'pending');

    acceptInvite(invitee.id, ownerPlan.id, undefined);

    const active = getActivePlan(invitee.id);
    expect(active.id).toBe(ownerPlan.id);
  });
});

describe('declineInvite', () => {
  it('VACAY-SVC-040: removes the pending invite row', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: invitee } = createUser(testDb);
    insertMember(ownerPlan.id, invitee.id, 'pending');

    declineInvite(invitee.id, ownerPlan.id, undefined);

    const row = testDb
      .prepare('SELECT * FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?')
      .get(ownerPlan.id, invitee.id);
    expect(row).toBeUndefined();
  });
});

describe('cancelInvite', () => {
  it('VACAY-SVC-041: removes the pending invite when owner cancels it', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: target } = createUser(testDb);
    insertMember(ownerPlan.id, target.id, 'pending');

    cancelInvite(ownerPlan.id, target.id);

    const row = testDb
      .prepare('SELECT * FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?')
      .get(ownerPlan.id, target.id);
    expect(row).toBeUndefined();
  });
});

// ── getAvailableUsers ─────────────────────────────────────────────────────────

describe('getAvailableUsers', () => {
  it('VACAY-SVC-042: returns users not already in the plan and not fused elsewhere', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: unrelated } = createUser(testDb);
    getOwnPlan(unrelated.id);

    const available = getAvailableUsers(owner.id, plan.id) as { id: number }[];

    expect(available.map(u => u.id)).toContain(unrelated.id);
    // Owner themselves should NOT appear (excluded by u.id != ?)
    expect(available.map(u => u.id)).not.toContain(owner.id);
  });

  it('VACAY-SVC-043: excludes users who already have an accepted membership in any plan', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: alreadyFused } = createUser(testDb);
    const { plan: otherPlan } = setupUserWithPlan();
    insertMember(otherPlan.id, alreadyFused.id, 'accepted');

    const available = getAvailableUsers(owner.id, plan.id) as { id: number }[];

    expect(available.map(u => u.id)).not.toContain(alreadyFused.id);
  });
});

// ── getStats ──────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('VACAY-SVC-044: returns per-user stats with correct fields', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    const stats = getStats(plan.id, yr);

    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({
      user_id: user.id,
      year: yr,
      vacation_days: 30,
      used: 0,
      remaining: 30,
    });
  });

  it('VACAY-SVC-045: used reflects the actual number of entries for that user and year', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    toggleEntry(user.id, plan.id, `${yr}-09-10`, undefined);
    toggleEntry(user.id, plan.id, `${yr}-09-11`, undefined);

    const stats = getStats(plan.id, yr);

    expect(stats[0].used).toBe(2);
    expect(stats[0].remaining).toBe(28);
  });

  it('VACAY-SVC-045a: half days count as 0.5 toward the used total (#552)', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    toggleEntry(user.id, plan.id, `${yr}-09-12`, 1);    // full day
    toggleEntry(user.id, plan.id, `${yr}-09-13`, 0.5);  // half day

    const stats = getStats(plan.id, yr);

    expect(stats[0].used).toBe(1.5);
    expect(stats[0].remaining).toBe(28.5);
  });
});

// ── applyHolidayCalendars ─────────────────────────────────────────────────────

describe('applyHolidayCalendars', () => {
  it('VACAY-SVC-046: does nothing when holidays_enabled is 0 (fetch is never called)', async () => {
    const { plan } = setupUserWithPlan();
    // holidays_enabled defaults to 0

    await applyHolidayCalendars(plan.id);

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('VACAY-SVC-047: deletes matching vacay_entries for a global holiday date returned by the API', async () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    // Enable holidays and add a calendar
    testDb.prepare('UPDATE vacay_plans SET holidays_enabled = 1 WHERE id = ?').run(plan.id);
    addHolidayCalendar(plan.id, 'DE', null, undefined, 0, undefined);

    // Add a vacay entry on the holiday date
    const holidayDate = `${yr}-01-01`;
    testDb
      .prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)')
      .run(plan.id, user.id, holidayDate, '');

    // Override fetch to return one global holiday matching that entry
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: holidayDate, global: true }],
    }));

    await applyHolidayCalendars(plan.id);

    const remaining = testDb
      .prepare('SELECT * FROM vacay_entries WHERE plan_id = ? AND date = ?')
      .all(plan.id, holidayDate);
    expect(remaining).toHaveLength(0);
  });
});
