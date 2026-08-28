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
// shareCalendar fires a notification after inserting — keep that out of unit scope

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';

import { DatabaseService } from '../../../src/nest/database/database.service';
import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { notificationsStub } from '../../helpers/notifications';

// VACAY-SVC-001 through VACAY-SVC-066 moved 1:1 from the legacy
// tests/unit/services/vacayService.test.ts (the named-function imports became
// method calls on a directly constructed VacayService; the legacy
// updateUserYearSettings is the class's updateYearSettings).
// VACAY-SVC-067 (vacay.bridge delegation) died with the bridge — its only
// consumer, the legacy tripService, folded into the DI-native TripsService.
const svc = new VacayService(new DatabaseService(testDb), new RealtimeService(), notificationsStub());

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
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
  const plan = svc.getOwnPlan(user.id);
  return { user, plan };
}

/**
 * Lift the (default-on) weekend blocking for tests whose dates are derived
 * from the current year and can land on any weekday.
 */
function allowWeekends(planId: number) {
  testDb.prepare('UPDATE vacay_plans SET block_weekends = 0 WHERE id = ?').run(planId);
}

// ── getOwnPlan ────────────────────────────────────────────────────────────────

describe('getOwnPlan', () => {
  it('VACAY-SVC-001: creates a new plan on first call for a fresh user', () => {
    const { user } = createUser(testDb);
    const plan = svc.getOwnPlan(user.id);

    expect(plan).toBeDefined();
    expect(plan.owner_id).toBe(user.id);
    expect(plan.id).toBeGreaterThan(0);
  });

  it('VACAY-SVC-002: returns the same plan on a second call (idempotent)', () => {
    const { user } = createUser(testDb);
    const first = svc.getOwnPlan(user.id);
    const second = svc.getOwnPlan(user.id);

    expect(second.id).toBe(first.id);
  });

  it('VACAY-SVC-003: seeds the current year row in vacay_years after plan creation', () => {
    const { user } = createUser(testDb);
    const plan = svc.getOwnPlan(user.id);
    const yr = new Date().getFullYear();

    const row = testDb
      .prepare('SELECT * FROM vacay_years WHERE plan_id = ? AND year = ?')
      .get(plan.id, yr);

    expect(row).toBeDefined();
  });

  it('VACAY-SVC-004: seeds the current year user_year row with default 30 vacation_days', () => {
    const { user } = createUser(testDb);
    const plan = svc.getOwnPlan(user.id);
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
    const active = svc.getActivePlan(user.id);

    expect(active.id).toBe(plan.id);
    expect(active.owner_id).toBe(user.id);
  });

  it('VACAY-SVC-006: returns the shared plan when user has an accepted membership in another plan', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    // Make sure member also has their own plan materialised first
    svc.getOwnPlan(member.id);

    insertMember(ownerPlan.id, member.id, 'accepted');

    const active = svc.getActivePlan(member.id);
    expect(active.id).toBe(ownerPlan.id);
  });

  it('VACAY-SVC-007: pending membership does NOT override own plan as active', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    svc.getOwnPlan(member.id);

    insertMember(ownerPlan.id, member.id, 'pending');

    const active = svc.getActivePlan(member.id);
    // Should still point to member's own plan
    expect(active.owner_id).toBe(member.id);
  });
});

// ── getPlanUsers ──────────────────────────────────────────────────────────────

describe('getPlanUsers', () => {
  it('VACAY-SVC-008: returns [owner] for a solo plan', () => {
    const { user, plan } = setupUserWithPlan();
    const users = svc.getPlanUsers(plan.id);

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(user.id);
  });

  it('VACAY-SVC-009: returns [owner, member] after an accepted membership is inserted', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');

    const users = svc.getPlanUsers(plan.id);

    expect(users).toHaveLength(2);
    expect(users.map(u => u.id)).toContain(owner.id);
    expect(users.map(u => u.id)).toContain(member.id);
  });

  it('VACAY-SVC-010: pending membership members are NOT included in plan users', () => {
    const { plan } = setupUserWithPlan();
    const { user: pendingUser } = createUser(testDb);
    insertMember(plan.id, pendingUser.id, 'pending');

    const users = svc.getPlanUsers(plan.id);
    expect(users.map(u => u.id)).not.toContain(pendingUser.id);
  });

  it('VACAY-SVC-011: returns empty array for a non-existent plan id', () => {
    const users = svc.getPlanUsers(99999);
    expect(users).toEqual([]);
  });
});

// ── migrateHolidayCalendars ───────────────────────────────────────────────────

describe('migrateHolidayCalendars', () => {
  it('VACAY-SVC-012: does nothing when holidays_enabled is falsy', async () => {
    const { plan } = setupUserWithPlan();
    const planRow = { ...plan, holidays_enabled: 0, holidays_region: 'DE' };

    await svc.migrateHolidayCalendars(plan.id, planRow);

    const rows = testDb
      .prepare('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ?')
      .all(plan.id);
    expect(rows).toHaveLength(0);
  });

  it('VACAY-SVC-013: inserts a calendar row when holidays_enabled=1 and holidays_region is set', async () => {
    const { plan } = setupUserWithPlan();
    const planRow = { ...plan, holidays_enabled: 1, holidays_region: 'DE' };

    await svc.migrateHolidayCalendars(plan.id, planRow);

    const rows = testDb
      .prepare('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ?')
      .all(plan.id) as { region: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].region).toBe('DE');
  });

  it('VACAY-SVC-014: does nothing if a calendar row already exists (no duplicate)', async () => {
    const { plan } = setupUserWithPlan();
    const planRow = { ...plan, holidays_enabled: 1, holidays_region: 'FR' };

    await svc.migrateHolidayCalendars(plan.id, planRow);
    // Call a second time — should NOT insert another row
    await svc.migrateHolidayCalendars(plan.id, planRow);

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

    await svc.updatePlan(plan.id, { block_weekends: true }, undefined);

    const updated = testDb
      .prepare('SELECT block_weekends FROM vacay_plans WHERE id = ?')
      .get(plan.id) as { block_weekends: number };
    expect(updated.block_weekends).toBe(1);
  });

  it('VACAY-SVC-016: updates holidays_enabled flag', async () => {
    const { plan } = setupUserWithPlan();

    await svc.updatePlan(plan.id, { holidays_enabled: true }, undefined);

    const updated = testDb
      .prepare('SELECT holidays_enabled FROM vacay_plans WHERE id = ?')
      .get(plan.id) as { holidays_enabled: number };
    expect(updated.holidays_enabled).toBe(1);
  });

  it('VACAY-SVC-017: returns the updated plan object with boolean-coerced flags', async () => {
    const { plan } = setupUserWithPlan();

    const result = await svc.updatePlan(plan.id, { block_weekends: false }, undefined);

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

    await svc.updatePlan(plan.id, { carry_over_enabled: false }, undefined);

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

    const cal = svc.addHolidayCalendar(plan.id, 'GB', 'UK Holidays', '#ff0000', 0, undefined);

    expect(cal).toBeDefined();
    expect(cal.id).toBeGreaterThan(0);
    expect(cal.region).toBe('GB');
    expect(cal.label).toBe('UK Holidays');
    expect(cal.color).toBe('#ff0000');
  });

  it('VACAY-SVC-020: uses default color #fecaca when no color is provided', () => {
    const { plan } = setupUserWithPlan();

    const cal = svc.addHolidayCalendar(plan.id, 'US', null, undefined, 0, undefined);

    expect(cal.color).toBe('#fecaca');
  });
});

// ── updateHolidayCalendar ─────────────────────────────────────────────────────

describe('updateHolidayCalendar', () => {
  it('VACAY-SVC-021: changes label and color on an existing calendar', () => {
    const { plan } = setupUserWithPlan();
    const cal = svc.addHolidayCalendar(plan.id, 'DE', 'Germany', '#aabbcc', 0, undefined);

    const updated = svc.updateHolidayCalendar(cal.id, plan.id, { label: 'Deutschland', color: '#112233' }, undefined);

    expect(updated).not.toBeNull();
    expect(updated!.label).toBe('Deutschland');
    expect(updated!.color).toBe('#112233');
  });

  it('VACAY-SVC-022: returns null when the calendar id does not exist in the plan', () => {
    const { plan } = setupUserWithPlan();

    const result = svc.updateHolidayCalendar(99999, plan.id, { label: 'Nope' }, undefined);

    expect(result).toBeNull();
  });
});

// ── deleteHolidayCalendar ─────────────────────────────────────────────────────

describe('deleteHolidayCalendar', () => {
  it('VACAY-SVC-023: removes the calendar row and returns true on success', () => {
    const { plan } = setupUserWithPlan();
    const cal = svc.addHolidayCalendar(plan.id, 'FR', null, undefined, 0, undefined);

    const result = svc.deleteHolidayCalendar(cal.id, plan.id, undefined);

    expect(result).toBe(true);
    const row = testDb.prepare('SELECT id FROM vacay_holiday_calendars WHERE id = ?').get(cal.id);
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-024: returns false when the calendar does not exist', () => {
    const { plan } = setupUserWithPlan();

    const result = svc.deleteHolidayCalendar(99999, plan.id, undefined);

    expect(result).toBe(false);
  });
});

// ── setUserColor ──────────────────────────────────────────────────────────────

describe('setUserColor', () => {
  it('VACAY-SVC-025: inserts a color for a user in a plan', () => {
    const { user, plan } = setupUserWithPlan();

    svc.setUserColor(user.id, plan.id, '#123456', undefined);

    const row = testDb
      .prepare('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?')
      .get(user.id, plan.id) as { color: string } | undefined;
    expect(row?.color).toBe('#123456');
  });

  it('VACAY-SVC-026: updates the color when called a second time (upsert)', () => {
    const { user, plan } = setupUserWithPlan();
    svc.setUserColor(user.id, plan.id, '#aaaaaa', undefined);

    svc.setUserColor(user.id, plan.id, '#bbbbbb', undefined);

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

    const years = svc.listYears(plan.id);

    expect(years).toContain(yr);
  });
});

describe('addYear', () => {
  it('VACAY-SVC-028: inserts a new year and creates a user_year record', () => {
    const { user, plan } = setupUserWithPlan();
    const newYear = new Date().getFullYear() + 2;

    svc.addYear(plan.id, newYear, undefined);

    const years = svc.listYears(plan.id);
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

    svc.addYear(plan.id, nextYear, undefined);

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

    svc.addYear(plan.id, targetYear, undefined);
    // Insert an entry for that year
    testDb
      .prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)')
      .run(plan.id, user.id, `${targetYear}-07-15`, '');

    svc.deleteYear(plan.id, targetYear, undefined);

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

    const result = svc.getEntries(plan.id, yr);

    expect(result.entries).toEqual([]);
    expect(result.companyHolidays).toEqual([]);
  });
});

describe('toggleEntry', () => {
  it('VACAY-SVC-032: adds an entry on first call (action: added)', () => {
    const { user, plan } = setupUserWithPlan();

    const result = svc.toggleEntry(user.id, plan.id, '2025-08-01', undefined);

    expect(result.action).toBe('added');
    const row = testDb
      .prepare('SELECT * FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-01');
    expect(row).toBeDefined();
  });

  it('VACAY-SVC-033: removes the entry on second call (action: removed)', () => {
    const { user, plan } = setupUserWithPlan();

    svc.toggleEntry(user.id, plan.id, '2025-08-04', undefined);
    const result = svc.toggleEntry(user.id, plan.id, '2025-08-04', undefined);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT * FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-04');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-033a: logs a half day when fraction is 0.5 (#552)', () => {
    const { user, plan } = setupUserWithPlan();

    const result = svc.toggleEntry(user.id, plan.id, '2025-08-05', 0.5);

    expect(result).toMatchObject({ action: 'added', fraction: 0.5 });
    const row = testDb
      .prepare('SELECT fraction FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-05') as { fraction: number };
    expect(row.fraction).toBe(0.5);
  });

  it('VACAY-SVC-033b: converts a full day into a half day in place (action: updated)', () => {
    const { user, plan } = setupUserWithPlan();

    svc.toggleEntry(user.id, plan.id, '2025-08-06', 1);
    const result = svc.toggleEntry(user.id, plan.id, '2025-08-06', 0.5);

    expect(result).toMatchObject({ action: 'updated', fraction: 0.5 });
    const row = testDb
      .prepare('SELECT fraction FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-06') as { fraction: number };
    expect(row.fraction).toBe(0.5);
  });

  it('VACAY-SVC-033c: toggling the same half day again clears it (action: removed)', () => {
    const { user, plan } = setupUserWithPlan();

    svc.toggleEntry(user.id, plan.id, '2025-08-07', 0.5);
    const result = svc.toggleEntry(user.id, plan.id, '2025-08-07', 0.5);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT id FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-07');
    expect(row).toBeUndefined();
  });

  // Weekend blocking (I-02): plans default to block_weekends = 1 / weekend_days '0,6'.
  it('VACAY-SVC-033d: rejects a blocked weekend day with error weekend_blocked (I-02)', () => {
    const { user, plan } = setupUserWithPlan();

    const result = svc.toggleEntry(user.id, plan.id, '2025-07-19', undefined); // Saturday

    expect(result).toEqual({ error: 'weekend_blocked' });
    const row = testDb
      .prepare('SELECT id FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-07-19');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-033e: accepts a non-weekend day on a blocking plan', () => {
    const { user, plan } = setupUserWithPlan();

    const result = svc.toggleEntry(user.id, plan.id, '2025-07-16', undefined); // Wednesday

    expect(result).toMatchObject({ action: 'added' });
  });

  it('VACAY-SVC-033f: accepts a weekend day when block_weekends is off', () => {
    const { user, plan } = setupUserWithPlan();
    testDb.prepare('UPDATE vacay_plans SET block_weekends = 0 WHERE id = ?').run(plan.id);

    const result = svc.toggleEntry(user.id, plan.id, '2025-07-19', undefined); // Saturday

    expect(result).toMatchObject({ action: 'added' });
  });

  it('VACAY-SVC-033g: honours custom weekend_days (5,6 blocks Friday, frees Sunday)', () => {
    const { user, plan } = setupUserWithPlan();
    testDb.prepare("UPDATE vacay_plans SET weekend_days = '5,6' WHERE id = ?").run(plan.id);

    expect(svc.toggleEntry(user.id, plan.id, '2025-07-18', undefined)).toEqual({ error: 'weekend_blocked' }); // Friday
    expect(svc.toggleEntry(user.id, plan.id, '2025-07-20', undefined)).toMatchObject({ action: 'added' }); // Sunday
  });

  it('VACAY-SVC-033h: a NULL weekend_days column falls back to Sat/Sun', () => {
    const { user, plan } = setupUserWithPlan();
    testDb.prepare('UPDATE vacay_plans SET weekend_days = NULL WHERE id = ?').run(plan.id);

    expect(svc.toggleEntry(user.id, plan.id, '2025-07-19', undefined)).toEqual({ error: 'weekend_blocked' }); // Saturday
  });

  it('VACAY-SVC-033i: still removes an existing entry on a blocked day (stray-data cleanup)', () => {
    const { user, plan } = setupUserWithPlan();
    testDb
      .prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note, fraction, kind) VALUES (?, ?, ?, ?, ?, ?)')
      .run(plan.id, user.id, '2025-07-19', '', 1, 'vacation');

    const result = svc.toggleEntry(user.id, plan.id, '2025-07-19', 1, 'vacation');

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT id FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-07-19');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-033j: refuses to convert an existing entry in place on a blocked day', () => {
    const { user, plan } = setupUserWithPlan();
    testDb
      .prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note, fraction, kind) VALUES (?, ?, ?, ?, ?, ?)')
      .run(plan.id, user.id, '2025-07-19', '', 0.5, 'vacation');

    const result = svc.toggleEntry(user.id, plan.id, '2025-07-19', 1, 'vacation');

    expect(result).toEqual({ error: 'weekend_blocked' });
    const row = testDb
      .prepare('SELECT fraction FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-07-19') as { fraction: number };
    expect(row.fraction).toBe(0.5);
  });
});

// ── toggleCompanyHoliday ──────────────────────────────────────────────────────

describe('toggleCompanyHoliday', () => {
  it('VACAY-SVC-034: adds a company holiday on first call (action: added)', () => {
    const { plan } = setupUserWithPlan();

    const result = svc.toggleCompanyHoliday(plan.id, '2025-12-25', 'Christmas', undefined);

    expect(result.action).toBe('added');
    const row = testDb
      .prepare('SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date = ?')
      .get(plan.id, '2025-12-25');
    expect(row).toBeDefined();
  });

  it('VACAY-SVC-035: removes the company holiday on second call (action: removed)', () => {
    const { plan } = setupUserWithPlan();

    svc.toggleCompanyHoliday(plan.id, '2025-12-26', 'Boxing Day', undefined);
    const result = svc.toggleCompanyHoliday(plan.id, '2025-12-26', undefined, undefined);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date = ?')
      .get(plan.id, '2025-12-26');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-036: adding a company holiday removes any existing vacay_entry on that date', () => {
    const { user, plan } = setupUserWithPlan();

    // First add a personal entry on that date
    svc.toggleEntry(user.id, plan.id, '2025-05-01', undefined);

    // Now declare it a company holiday — the personal entry should be wiped
    svc.toggleCompanyHoliday(plan.id, '2025-05-01', 'Labour Day', undefined);

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
    svc.getOwnPlan(invitee.id); // ensure own plan exists for data migration path
    insertMember(ownerPlan.id, invitee.id, 'pending');

    const result = svc.acceptInvite(invitee.id, ownerPlan.id, undefined);

    expect(result.error).toBeUndefined();
    const row = testDb
      .prepare('SELECT status FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?')
      .get(ownerPlan.id, invitee.id) as { status: string } | undefined;
    expect(row?.status).toBe('accepted');
  });

  it('VACAY-SVC-038: returns 404 error when there is no pending invite', () => {
    const { user } = createUser(testDb);

    const result = svc.acceptInvite(user.id, 99999, undefined);

    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('VACAY-SVC-039: accepted member becomes visible via getActivePlan', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: invitee } = createUser(testDb);
    svc.getOwnPlan(invitee.id);
    insertMember(ownerPlan.id, invitee.id, 'pending');

    svc.acceptInvite(invitee.id, ownerPlan.id, undefined);

    const active = svc.getActivePlan(invitee.id);
    expect(active.id).toBe(ownerPlan.id);
  });
});

describe('declineInvite', () => {
  it('VACAY-SVC-040: removes the pending invite row', () => {
    const { user: owner, plan: ownerPlan } = setupUserWithPlan();
    const { user: invitee } = createUser(testDb);
    insertMember(ownerPlan.id, invitee.id, 'pending');

    svc.declineInvite(invitee.id, ownerPlan.id, undefined);

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

    svc.cancelInvite(ownerPlan.id, target.id);

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
    svc.getOwnPlan(unrelated.id);

    const available = svc.getAvailableUsers(owner.id, plan.id) as { id: number }[];

    expect(available.map(u => u.id)).toContain(unrelated.id);
    // Owner themselves should NOT appear (excluded by u.id != ?)
    expect(available.map(u => u.id)).not.toContain(owner.id);
  });

  it('VACAY-SVC-043: excludes users who already have an accepted membership in any plan', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: alreadyFused } = createUser(testDb);
    const { plan: otherPlan } = setupUserWithPlan();
    insertMember(otherPlan.id, alreadyFused.id, 'accepted');

    const available = svc.getAvailableUsers(owner.id, plan.id) as { id: number }[];

    expect(available.map(u => u.id)).not.toContain(alreadyFused.id);
  });

  // #2112 — guests are trip-scoped accounts, and every other directory in the app
  // already leaves them out. Vacay's two pickers did not, so a guest stayed
  // selectable here even after being removed from the trip it was created for.
  it('VACAY-SVC-073: guest accounts are not offered in the plan invite picker', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: guest } = createUser(testDb);
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);

    const available = svc.getAvailableUsers(owner.id, plan.id) as { id: number }[];

    expect(available.map(u => u.id)).not.toContain(guest.id);
  });

  it('VACAY-SVC-074: guest accounts are not offered in the shared-calendar picker', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: guest } = createUser(testDb);
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);

    const available = svc.getShareAvailableUsers(owner.id) as { id: number }[];

    expect(available.map(u => u.id)).not.toContain(guest.id);
  });

  it('VACAY-SVC-075: a guest id sent straight to the write paths is refused', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: guest } = createUser(testDb);
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);

    // The picker is only a list. The id comes back from the client, and the MCP
    // tools reach the same two methods, so refusing has to happen here.
    const invited = svc.sendInvite(plan.id, owner.id, 'owner', 'owner@example.test', guest.id);
    expect(invited.error).toBe('User not found');
    const shared = svc.shareCalendar(owner.id, 'owner@example.test', guest.id);
    expect(shared.error).toBe('User not found');
  });
});

// ── getStats ──────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('VACAY-SVC-044: returns per-user stats with correct fields', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    const stats = svc.getStats(plan.id, yr);

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

    allowWeekends(plan.id);
    svc.toggleEntry(user.id, plan.id, `${yr}-09-10`, undefined);
    svc.toggleEntry(user.id, plan.id, `${yr}-09-11`, undefined);

    const stats = svc.getStats(plan.id, yr);

    expect(stats[0].used).toBe(2);
    expect(stats[0].remaining).toBe(28);
  });

  it('VACAY-SVC-045a: half days count as 0.5 toward the used total (#552)', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    svc.toggleEntry(user.id, plan.id, `${yr}-09-12`, 1);    // full day
    svc.toggleEntry(user.id, plan.id, `${yr}-09-13`, 0.5);  // half day

    const stats = svc.getStats(plan.id, yr);

    expect(stats[0].used).toBe(1.5);
    expect(stats[0].remaining).toBe(28.5);
  });

  it('VACAY-SVC-045b: comp/flex days cost nothing (#1074)', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    svc.toggleEntry(user.id, plan.id, `${yr}-09-14`, 1, 'vacation');
    svc.toggleEntry(user.id, plan.id, `${yr}-09-15`, 1, 'comp');

    const stats = svc.getStats(plan.id, yr);

    expect(stats[0].used).toBe(1);
    expect(stats[0].remaining).toBe(29);
  });

  it('VACAY-SVC-045c: a half comp day also costs nothing (#1074)', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    svc.toggleEntry(user.id, plan.id, `${yr}-09-16`, 0.5, 'comp');

    const stats = svc.getStats(plan.id, yr);

    expect(stats[0].used).toBe(0);
    expect(stats[0].remaining).toBe(30);
  });

  it('VACAY-SVC-045d: comp_used reports comp days separately, summing fractions (#1074)', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    svc.toggleEntry(user.id, plan.id, `${yr}-09-17`, 1, 'comp');
    svc.toggleEntry(user.id, plan.id, `${yr}-09-18`, 0.5, 'comp');
    svc.toggleEntry(user.id, plan.id, `${yr}-09-19`, 1, 'vacation');

    const stats = svc.getStats(plan.id, yr);

    expect(stats[0].comp_used).toBe(1.5);
    expect(stats[0].used).toBe(1);
  });

  it('VACAY-SVC-045e: converting a vacation day to comp refunds it to the entitlement (#1074)', () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    svc.toggleEntry(user.id, plan.id, `${yr}-09-20`, 1, 'vacation');
    expect(svc.getStats(plan.id, yr)[0].used).toBe(1);

    const result = svc.toggleEntry(user.id, plan.id, `${yr}-09-20`, 1, 'comp');

    expect(result).toMatchObject({ action: 'updated', kind: 'comp' });
    expect(svc.getStats(plan.id, yr)[0].used).toBe(0);
  });

  it('VACAY-SVC-045g: a rejected weekend toggle leaves used/remaining untouched (I-02)', () => {
    const { user, plan } = setupUserWithPlan();
    svc.toggleEntry(user.id, plan.id, '2025-07-16', 1, 'vacation'); // Wednesday
    const before = svc.getStats(plan.id, 2025)[0];
    expect(before.used).toBe(1);

    const result = svc.toggleEntry(user.id, plan.id, '2025-07-19', 1, 'vacation'); // Saturday

    expect(result).toEqual({ error: 'weekend_blocked' });
    const after = svc.getStats(plan.id, 2025)[0];
    expect(after.used).toBe(before.used);
    expect(after.remaining).toBe(before.remaining);
  });

  it('VACAY-SVC-045f: getStats reports the window it counted over (#737)', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7, year_start_day: 1 });

    const stats = svc.getStats(plan.id, 2026);

    expect(stats[0]).toMatchObject({ window_start: '2026-07-01', window_end: '2027-07-01' });
  });
});

// ── Configurable vacation year (#737) ─────────────────────────────────────────

describe('resolveYearWindow', () => {
  it('VACAY-SVC-045g: defaults to the plain calendar year when nothing is configured', () => {
    const { user } = setupUserWithPlan();

    expect(svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' });
  });

  it('VACAY-SVC-045h: an explicit calendar setting resolves identically', () => {
    const { user } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'calendar' });

    expect(svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' });
  });

  it('VACAY-SVC-045i: a fiscal year starts on the configured month and day', () => {
    const { user } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 4, year_start_day: 6 });

    expect(svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-04-06', end: '2027-04-06' });
  });

  it('VACAY-SVC-045j: an anniversary year follows the hire date month and day', () => {
    const { user } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'anniversary', hire_date: '2019-09-16' });

    expect(svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-09-16', end: '2027-09-16' });
  });

  it('VACAY-SVC-045k: an anniversary year without a hire date falls back to January 1', () => {
    const { user } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'anniversary' });

    expect(svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' });
  });

  it('VACAY-SVC-045k1: an anniversary year ignores a month left behind by a previous fiscal setting', () => {
    const { user } = setupUserWithPlan();
    // What the settings UI sends when you pick Fiscal/April and then click
    // "Hire date" before typing one — it carries the whole settings object.
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 4, year_start_day: 1 });
    svc.updateYearSettings(user.id, { year_type: 'anniversary', year_start_month: 4, year_start_day: 1, hire_date: null });

    expect(svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' });
  });

  it('VACAY-SVC-045k2: a Feb 29 hire date resolves to Feb 28, a boundary every year has', () => {
    const { user } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'anniversary', hire_date: '2024-02-29' });

    expect(svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-02-28', end: '2027-02-28' });
  });

  it('VACAY-SVC-045k3: a fiscal day the month cannot have is clamped down to one it can', () => {
    const { user } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 2, year_start_day: 31 });

    expect(svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-02-28', end: '2027-02-28' });
  });

  it('VACAY-SVC-045l: consecutive periods meet exactly, so the carry-over chain stays intact', () => {
    const { user } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    expect(svc.resolveYearWindow(user.id, 2025).end).toBe(svc.resolveYearWindow(user.id, 2026).start);
  });
});

describe('updateUserYearSettings', () => {
  it('VACAY-SVC-045m: upserts, so a second call replaces the first', () => {
    const { user } = setupUserWithPlan();

    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7, year_start_day: 1 });
    const saved = svc.updateYearSettings(user.id, { year_type: 'calendar' });

    expect(saved.year_type).toBe('calendar');
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM vacay_user_settings WHERE user_id = ?').get(user.id)).toEqual({ n: 1 });
  });

  it('VACAY-SVC-045n: clamps an out-of-range month and day instead of storing them', () => {
    const { user } = setupUserWithPlan();

    const saved = svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 99, year_start_day: 0 });

    expect(saved.year_start_month).toBe(12);
    expect(saved.year_start_day).toBe(1);
  });

  it('VACAY-SVC-045o: drops a malformed hire date rather than persisting it', () => {
    const { user } = setupUserWithPlan();

    const saved = svc.updateYearSettings(user.id, { year_type: 'anniversary', hire_date: 'not-a-date' });

    expect(saved.hire_date).toBeNull();
  });

  it('VACAY-SVC-045p: an unknown year type falls back to calendar', () => {
    const { user } = setupUserWithPlan();

    expect(svc.updateYearSettings(user.id, { year_type: 'quarterly' }).year_type).toBe('calendar');
  });
});

describe('getYearSettings', () => {
  it('VACAY-SVC-045q: fills in the calendar defaults for a user who never configured anything', () => {
    const { user } = setupUserWithPlan();

    expect(svc.getUserYearSettings(user.id)).toBeUndefined();
    expect(svc.getYearSettings(user.id)).toEqual({
      user_id: user.id, year_type: 'calendar', year_start_month: 1, year_start_day: 1, hire_date: null,
    });
  });
});

describe('currentPeriodYear', () => {
  it('VACAY-SVC-045r: a calendar user is always in the period named after today’s year', () => {
    const { user } = setupUserWithPlan();

    expect(svc.currentPeriodYear(user.id, new Date('2026-03-15T12:00:00'))).toBe(2026);
  });

  it('VACAY-SVC-045s: before a fiscal year starts, today still belongs to the previous period', () => {
    const { user } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    expect(svc.currentPeriodYear(user.id, new Date('2026-03-15T12:00:00'))).toBe(2025);
    expect(svc.currentPeriodYear(user.id, new Date('2026-08-15T12:00:00'))).toBe(2026);
  });
});

describe('usage over a shifted window (#737)', () => {
  it('VACAY-SVC-045t: a day in the next calendar year still counts toward the fiscal period', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    svc.toggleEntry(user.id, plan.id, '2026-08-10', 1, 'vacation');  // inside, first half
    svc.toggleEntry(user.id, plan.id, '2027-02-10', 1, 'vacation');  // inside, second half

    expect(svc.getStats(plan.id, 2026)[0].used).toBe(2);
  });

  it('VACAY-SVC-045u: days outside the window belong to the neighbouring periods, not this one', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    svc.toggleEntry(user.id, plan.id, '2026-06-30', 1, 'vacation');  // last day of the previous period
    svc.toggleEntry(user.id, plan.id, '2027-07-01', 1, 'vacation');  // first day of the next period

    expect(svc.getStats(plan.id, 2026)[0].used).toBe(0);
    expect(svc.getStats(plan.id, 2025)[0].used).toBe(1);
    expect(svc.getStats(plan.id, 2027)[0].used).toBe(1);
  });

  // Periods well past the year seeded with the plan, so addYear really inserts.
  it('VACAY-SVC-045v: carry-over is computed over the previous period, not the previous calendar year', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });
    testDb.prepare('UPDATE vacay_plans SET carry_over_enabled = 1 WHERE id = ?').run(plan.id);
    testDb.prepare(`
      INSERT OR REPLACE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over)
      VALUES (?, ?, 2030, 10, 0)
    `).run(user.id, plan.id);

    // Two days inside the 2030 period (Jul 2030 – Jun 2031), one of them in 2031.
    svc.toggleEntry(user.id, plan.id, '2030-09-02', 1, 'vacation');
    svc.toggleEntry(user.id, plan.id, '2031-02-03', 1, 'vacation');

    svc.addYear(plan.id, 2031, undefined);

    const row = testDb
      .prepare('SELECT carried_over FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = 2031')
      .get(user.id, plan.id) as { carried_over: number };
    expect(row.carried_over).toBe(8);
  });

  it('VACAY-SVC-045w: comp days are excluded from the carry-over of a shifted period too', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });
    testDb.prepare('UPDATE vacay_plans SET carry_over_enabled = 1 WHERE id = ?').run(plan.id);
    testDb.prepare(`
      INSERT OR REPLACE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over)
      VALUES (?, ?, 2030, 10, 0)
    `).run(user.id, plan.id);

    svc.toggleEntry(user.id, plan.id, '2031-02-03', 1, 'comp');

    svc.addYear(plan.id, 2031, undefined);

    const row = testDb
      .prepare('SELECT carried_over FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = 2031')
      .get(user.id, plan.id) as { carried_over: number };
    expect(row.carried_over).toBe(10);
  });

  it('VACAY-SVC-045x: deleteYear clears the entries of the period, spanning both calendar years', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });
    svc.addYear(plan.id, 2026, undefined);

    svc.toggleEntry(user.id, plan.id, '2026-08-10', 1, 'vacation');  // inside
    svc.toggleEntry(user.id, plan.id, '2027-02-10', 1, 'vacation');  // inside, next calendar year
    svc.toggleEntry(user.id, plan.id, '2026-06-30', 1, 'vacation');  // previous period, must survive

    svc.deleteYear(plan.id, 2026, undefined);

    const left = testDb
      .prepare('SELECT date FROM vacay_entries WHERE plan_id = ? ORDER BY date')
      .all(plan.id) as { date: string }[];
    expect(left.map(r => r.date)).toEqual(['2026-06-30']);
  });
});

describe('getEntries over a window (#737)', () => {
  it('VACAY-SVC-045y: returns both calendar halves of a shifted period for the viewer', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    svc.toggleEntry(user.id, plan.id, '2026-08-10', 1, 'vacation');
    svc.toggleEntry(user.id, plan.id, '2027-02-10', 1, 'vacation');
    svc.toggleEntry(user.id, plan.id, '2026-06-30', 1, 'vacation');  // previous period

    const result = svc.getEntries(plan.id, '2026', user.id);

    expect((result.entries as { date: string }[]).map(e => e.date).sort()).toEqual(['2026-08-10', '2027-02-10']);
  });

  it('VACAY-SVC-045z: without a viewer it stays on the plain calendar year (MCP reads)', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    svc.toggleEntry(user.id, plan.id, '2026-08-10', 1, 'vacation');
    svc.toggleEntry(user.id, plan.id, '2027-02-10', 1, 'vacation');

    const result = svc.getEntries(plan.id, '2026');

    expect((result.entries as { date: string }[]).map(e => e.date)).toEqual(['2026-08-10']);
  });

  it('VACAY-SVC-045aa: a start day past the 1st still loads the whole first month, since the grid renders it', () => {
    const { user, plan } = setupUserWithPlan();
    svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 4, year_start_day: 6 });

    svc.toggleEntry(user.id, plan.id, '2026-04-02', 1, 'vacation');  // rendered, but counted in the previous period

    expect((svc.getEntries(plan.id, '2026', user.id).entries as unknown[])).toHaveLength(1);
    expect(svc.getStats(plan.id, 2026)[0].used).toBe(0);
    expect(svc.getStats(plan.id, 2025)[0].used).toBe(1);
  });
});

// ── applyHolidayCalendars ─────────────────────────────────────────────────────

describe('applyHolidayCalendars', () => {
  it('VACAY-SVC-046: does nothing when holidays_enabled is 0 (fetch is never called)', async () => {
    const { plan } = setupUserWithPlan();
    // holidays_enabled defaults to 0

    await svc.applyHolidayCalendars(plan.id);

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('VACAY-SVC-047: deletes matching vacay_entries for a global holiday date returned by the API', async () => {
    const { user, plan } = setupUserWithPlan();
    const yr = new Date().getFullYear();

    // Enable holidays and add a calendar
    testDb.prepare('UPDATE vacay_plans SET holidays_enabled = 1 WHERE id = ?').run(plan.id);
    svc.addHolidayCalendar(plan.id, 'DE', null, undefined, 0, undefined);

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

    await svc.applyHolidayCalendars(plan.id);

    const remaining = testDb
      .prepare('SELECT * FROM vacay_entries WHERE plan_id = ? AND date = ?')
      .all(plan.id, holidayDate);
    expect(remaining).toHaveLength(0);
  });
});

// ── Read-only calendar shares (#444/#667) ─────────────────────────────────────

describe('shareCalendar', () => {
  it('VACAY-SVC-048: inserts a share row and returns no error', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: target } = createUser(testDb);

    const result = svc.shareCalendar(owner.id, owner.email, target.id);

    expect(result.error).toBeUndefined();
    const row = testDb
      .prepare('SELECT * FROM vacay_shares WHERE owner_id = ? AND user_id = ?')
      .get(owner.id, target.id);
    expect(row).toBeDefined();
  });

  it('VACAY-SVC-049: returns 400 when sharing with yourself', () => {
    const { user: owner } = setupUserWithPlan();

    const result = svc.shareCalendar(owner.id, owner.email, owner.id);

    expect(result).toEqual({ error: 'Cannot share with yourself', status: 400 });
  });

  it('VACAY-SVC-050: returns 404 when the target user does not exist', () => {
    const { user: owner } = setupUserWithPlan();

    const result = svc.shareCalendar(owner.id, owner.email, 99999);

    expect(result).toEqual({ error: 'User not found', status: 404 });
  });

  it('VACAY-SVC-051: returns 400 when the share already exists', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: target } = createUser(testDb);
    svc.shareCalendar(owner.id, owner.email, target.id);

    const result = svc.shareCalendar(owner.id, owner.email, target.id);

    expect(result).toEqual({ error: 'Already shared', status: 400 });
  });

  it('VACAY-SVC-052: returns 400 when the target is already a member of the owner plan', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');

    const result = svc.shareCalendar(owner.id, owner.email, member.id);

    expect(result).toEqual({ error: 'User is already in your calendar', status: 400 });
  });
});

describe('listShares', () => {
  it('VACAY-SVC-053: outgoing rows carry the target user info', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: target } = createUser(testDb);
    svc.shareCalendar(owner.id, owner.email, target.id);

    const result = svc.listShares(owner.id);

    expect(result.outgoing).toHaveLength(1);
    expect(result.outgoing[0]).toMatchObject({
      user_id: target.id,
      username: target.username,
    });
    expect(result.outgoing[0]).not.toHaveProperty('email');
    expect(result.incoming).toEqual([]);
  });

  it('VACAY-SVC-054: incoming rows carry the owner info, their color and a boolean hidden flag', () => {
    const { user: owner, plan } = setupUserWithPlan();
    svc.setUserColor(owner.id, plan.id, '#ef4444', undefined);
    const { user: viewer } = setupUserWithPlan();
    svc.shareCalendar(owner.id, owner.email, viewer.id);

    const result = svc.listShares(viewer.id);

    expect(result.outgoing).toEqual([]);
    expect(result.incoming).toHaveLength(1);
    expect(result.incoming[0]).toMatchObject({
      owner_id: owner.id,
      username: owner.username,
      color: '#ef4444',
      hidden: false,
    });
    expect(result.incoming[0]).not.toHaveProperty('email');
  });

  it('VACAY-SVC-055: remaps colors when two sharing owners sit on the default indigo', () => {
    const { user: viewer } = setupUserWithPlan(); // viewer's own color is #6366f1
    const { user: owner1 } = setupUserWithPlan(); // default #6366f1
    const { user: owner2 } = setupUserWithPlan(); // default #6366f1
    svc.shareCalendar(owner1.id, owner1.email, viewer.id);
    svc.shareCalendar(owner2.id, owner2.email, viewer.id);

    const { incoming } = svc.listShares(viewer.id);

    expect(incoming).toHaveLength(2);
    // Both collide with the viewer's own indigo, so each gets a distinct free preset
    expect(incoming[0].color).not.toBe('#6366f1');
    expect(incoming[1].color).not.toBe('#6366f1');
    expect(incoming[0].color).not.toBe(incoming[1].color);
  });
});

describe('removeShare', () => {
  it('VACAY-SVC-056: the owner can revoke their share', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = svc.listShares(owner.id).outgoing[0].id as number;

    expect(svc.removeShare(shareId, owner.id)).toBe(true);
    const row = testDb.prepare('SELECT id FROM vacay_shares WHERE id = ?').get(shareId);
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-057: the recipient can remove a share they received', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = svc.listShares(viewer.id).incoming[0].id;

    expect(svc.removeShare(shareId, viewer.id)).toBe(true);
  });

  it('VACAY-SVC-058: a third user cannot remove the share, unknown ids return false', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = svc.listShares(owner.id).outgoing[0].id as number;

    expect(svc.removeShare(shareId, stranger.id)).toBe(false);
    const row = testDb.prepare('SELECT id FROM vacay_shares WHERE id = ?').get(shareId);
    expect(row).toBeDefined();

    expect(svc.removeShare(99999, owner.id)).toBe(false);
  });
});

describe('setShareHidden', () => {
  it('VACAY-SVC-059: the recipient can hide and unhide the shared calendar', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = svc.listShares(viewer.id).incoming[0].id;

    expect(svc.setShareHidden(shareId, viewer.id, true)).toBe(true);
    let row = testDb.prepare('SELECT hidden FROM vacay_shares WHERE id = ?').get(shareId) as { hidden: number };
    expect(row.hidden).toBe(1);
    expect(svc.listShares(viewer.id).incoming[0].hidden).toBe(true);

    expect(svc.setShareHidden(shareId, viewer.id, false)).toBe(true);
    row = testDb.prepare('SELECT hidden FROM vacay_shares WHERE id = ?').get(shareId) as { hidden: number };
    expect(row.hidden).toBe(0);
  });

  it('VACAY-SVC-060: the owner cannot toggle the recipient hidden flag', () => {
    const { user: owner } = setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = svc.listShares(owner.id).outgoing[0].id as number;

    expect(svc.setShareHidden(shareId, owner.id, true)).toBe(false);
    const row = testDb.prepare('SELECT hidden FROM vacay_shares WHERE id = ?').get(shareId) as { hidden: number };
    expect(row.hidden).toBe(0);
  });
});

describe('getShareAvailableUsers', () => {
  it('VACAY-SVC-061: excludes self, already-shared users and plan members', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');
    const { user: shared } = createUser(testDb);
    svc.shareCalendar(owner.id, owner.email, shared.id);
    const { user: unrelated } = createUser(testDb);

    const ids = (svc.getShareAvailableUsers(owner.id) as { id: number }[]).map(u => u.id);

    expect(ids).toContain(unrelated.id);
    expect(ids).not.toContain(owner.id);
    expect(ids).not.toContain(member.id);
    expect(ids).not.toContain(shared.id);
  });
});

describe('getSharedCalendars', () => {
  it('VACAY-SVC-062: returns only the owner entries of the shared plan, including fractions', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');
    const { user: viewer } = setupUserWithPlan();
    svc.toggleEntry(owner.id, plan.id, '2025-06-10', 1);
    svc.toggleEntry(owner.id, plan.id, '2025-06-11', 0.5);
    svc.toggleEntry(member.id, plan.id, '2025-06-12', 1);
    svc.shareCalendar(owner.id, owner.email, viewer.id);

    const calendars = svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars).toHaveLength(1);
    expect(calendars[0].owner_id).toBe(owner.id);
    expect(calendars[0].owner_name).toBe(owner.username);
    expect(calendars[0].hidden).toBe(false);
    expect(calendars[0].entries).toEqual([
      { date: '2025-06-10', fraction: 1, kind: 'vacation' },
      { date: '2025-06-11', fraction: 0.5, kind: 'vacation' },
    ]);
  });

  it('VACAY-SVC-063: company holidays stay hidden while the owner plan has them disabled', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    testDb.prepare('UPDATE vacay_plans SET company_holidays_enabled = 0 WHERE id = ?').run(plan.id);
    svc.toggleCompanyHoliday(plan.id, '2025-12-24', 'Christmas Eve', undefined);
    svc.shareCalendar(owner.id, owner.email, viewer.id);

    const calendars = svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars[0].companyHolidays).toEqual([]);
  });

  it('VACAY-SVC-064: company holidays appear once the owner plan enables them', () => {
    const { user: owner, plan } = setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    testDb.prepare('UPDATE vacay_plans SET company_holidays_enabled = 1 WHERE id = ?').run(plan.id);
    svc.toggleCompanyHoliday(plan.id, '2025-12-24', 'Christmas Eve', undefined);
    svc.shareCalendar(owner.id, owner.email, viewer.id);

    const calendars = svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars[0].companyHolidays).toEqual([{ date: '2025-12-24' }]);
  });

  it('VACAY-SVC-065: an owner without any plan yields empty arrays (no lazy creation)', () => {
    const { user: owner } = createUser(testDb); // never touched vacay — no plan row
    const { user: viewer } = createUser(testDb);
    testDb.prepare('INSERT INTO vacay_shares (owner_id, user_id) VALUES (?, ?)').run(owner.id, viewer.id);

    const calendars = svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars).toHaveLength(1);
    expect(calendars[0].entries).toEqual([]);
    expect(calendars[0].companyHolidays).toEqual([]);
    const plan = testDb.prepare('SELECT id FROM vacay_plans WHERE owner_id = ?').get(owner.id);
    expect(plan).toBeUndefined();
  });

  it('VACAY-SVC-066: follows an owner fused into another plan', () => {
    const { user: host, plan: hostPlan } = setupUserWithPlan();
    const { user: owner } = createUser(testDb);
    svc.getOwnPlan(owner.id);
    insertMember(hostPlan.id, owner.id, 'accepted');
    const { user: viewer } = createUser(testDb);
    svc.toggleEntry(owner.id, hostPlan.id, '2025-03-03', 1);
    svc.shareCalendar(owner.id, owner.email, viewer.id);

    const calendars = svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars).toHaveLength(1);
    expect(calendars[0].entries).toEqual([{ date: '2025-03-03', fraction: 1, kind: 'vacation' }]);
  });
});

// ── Quirk fixes (transactions, fetch hygiene, cache TTL, addYear errors) ──────

describe('quirk fixes', () => {
  /** A DatabaseService whose run() throws when the SQL matches, for atomicity checks. */
  function failingService(match: string) {
    const failingDb = new DatabaseService(testDb);
    const realRun = failingDb.run.bind(failingDb);
    vi.spyOn(failingDb, 'run').mockImplementation((sql: string, ...params: unknown[]) => {
      if (sql.includes(match)) throw new Error('boom');
      return realRun(sql, ...params);
    });
    return new VacayService(failingDb, new RealtimeService(), notificationsStub());
  }

  it('VACAY-SVC-068: acceptInvite is atomic — a failure mid-flow rolls the status flip back', () => {
    const { plan } = setupUserWithPlan();
    const { user: member } = createUser(testDb);
    svc.getOwnPlan(member.id);
    insertMember(plan.id, member.id, 'pending');

    const broken = failingService('INSERT OR IGNORE INTO vacay_user_years');
    expect(() => broken.acceptInvite(member.id, plan.id, undefined)).toThrow('boom');

    const row = testDb.prepare('SELECT status FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?').get(plan.id, member.id) as { status: string };
    expect(row.status).toBe('pending');
  });

  it('VACAY-SVC-069: deleteYear is atomic — a failure mid-flow keeps the year and its entries', () => {
    const { user, plan } = setupUserWithPlan();
    const year = new Date().getFullYear();
    allowWeekends(plan.id);
    svc.toggleEntry(user.id, plan.id, `${year}-03-03`, 1);

    const broken = failingService('DELETE FROM vacay_user_years');
    expect(() => broken.deleteYear(plan.id, year, undefined)).toThrow('boom');

    expect(testDb.prepare('SELECT id FROM vacay_years WHERE plan_id = ? AND year = ?').get(plan.id, year)).toBeDefined();
    expect(testDb.prepare('SELECT id FROM vacay_entries WHERE plan_id = ?').get(plan.id)).toBeDefined();
  });

  it('VACAY-SVC-070: getCountries surfaces an upstream non-2xx as the fetch error and caches nothing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = new VacayService(new DatabaseService(testDb), new RealtimeService(), notificationsStub());

    expect(await fresh.getCountries()).toEqual({ error: 'Failed to fetch countries' });
    // Nothing cached: a retry hits the network again.
    expect(await fresh.getCountries()).toEqual({ error: 'Failed to fetch countries' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('VACAY-SVC-070a: getHolidays refuses a year or country that is not a plain code', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fresh = new VacayService(new DatabaseService(testDb), new RealtimeService(), notificationsStub());

    for (const [year, country] of [['../../..', 'DE'], ['2026', 'DE/../../x'], ['20xx', 'DE'], ['2026', 'DEU']]) {
      expect(await fresh.getHolidays(year, country)).toEqual({ error: 'Failed to fetch holidays' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('VACAY-SVC-070b: getSchoolHolidayRegions refuses a country that is not an alpha-2 code', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fresh = new VacayService(new DatabaseService(testDb), new RealtimeService(), notificationsStub());

    expect(await fresh.getSchoolHolidayRegions('DE&countryIsoCode=FR')).toEqual({
      error: 'Failed to fetch school holiday regions',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('VACAY-SVC-070c: a provider body over the size cap reads as the usual fetch error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (h: string) => (h === 'content-length' ? String(50 * 1024 * 1024) : null) },
      json: async () => [{ date: '2026-01-01' }],
    });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = new VacayService(new DatabaseService(testDb), new RealtimeService(), notificationsStub());

    expect(await fresh.getCountries()).toEqual({ error: 'Failed to fetch countries' });
    expect(await fresh.getHolidays('2026', 'DE')).toEqual({ error: 'Failed to fetch holidays' });
  });

  it('VACAY-SVC-070d: a chunked provider body past the cap reads as the usual fetch error', async () => {
    // nager.at answers chunked, so there is no content-length for the declared
    // check to look at — only the streaming read stops this being buffered whole.
    const payload = `[${'{"date":"2026-01-01"},'.repeat(200_000)}{"date":"2026-12-24"}]`;
    const fetchMock = vi.fn().mockImplementation(async () => {
      let sent = false;
      return {
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => ({
            read: async () => (sent ? { done: true } : ((sent = true), { done: false, value: new TextEncoder().encode(payload) })),
            cancel: async () => undefined,
          }),
          cancel: async () => undefined,
        },
        json: async () => JSON.parse(payload),
      };
    });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = new VacayService(new DatabaseService(testDb), new RealtimeService(), notificationsStub());

    expect(await fresh.getHolidays('2026', 'DE')).toEqual({ error: 'Failed to fetch holidays' });
    expect(await fresh.getCountries()).toEqual({ error: 'Failed to fetch countries' });
  });

  it('VACAY-SVC-071: applyHolidayCalendars honors the cache TTL', async () => {
    const { plan } = setupUserWithPlan();
    testDb.prepare('UPDATE vacay_plans SET holidays_enabled = 1 WHERE id = ?').run(plan.id);
    testDb.prepare("INSERT INTO vacay_holiday_calendars (plan_id, region) VALUES (?, 'DE')").run(plan.id);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = new VacayService(new DatabaseService(testDb), new RealtimeService(), notificationsStub());

    await fresh.applyHolidayCalendars(plan.id);
    const afterFirst = fetchMock.mock.calls.length;
    await fresh.applyHolidayCalendars(plan.id);
    // Within the TTL the cached year list is reused — no new requests.
    expect(fetchMock.mock.calls.length).toBe(afterFirst);

    vi.useFakeTimers();
    try {
      vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000 + 1);
      await fresh.applyHolidayCalendars(plan.id);
      expect(fetchMock.mock.calls.length).toBeGreaterThan(afterFirst);
    } finally {
      vi.useRealTimers();
    }
  });

  it('VACAY-SVC-072: addYear still no-ops on a duplicate year but propagates real errors', () => {
    const { plan } = setupUserWithPlan();
    const year = new Date().getFullYear();
    // Duplicate: the seeded current year — silently returns the list, like before.
    expect(svc.addYear(plan.id, year, undefined)).toContain(year);

    const broken = failingService('INSERT OR IGNORE INTO vacay_user_years');
    expect(() => broken.addYear(plan.id, year + 1, undefined)).toThrow('boom');
    // And atomically: the failed year was not half-added.
    expect(testDb.prepare('SELECT id FROM vacay_years WHERE plan_id = ? AND year = ?').get(plan.id, year + 1)).toBeUndefined();
  });
});
