import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup (real in-memory SQLite) ─────────────────────────────────────────

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    canAccessTrip: () => null,
  };
    return mock;
});


vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
// Mock websocket so notifyPlanUsers doesn't throw
vi.mock('../../../src/websocket', () => ({ broadcastToUser: vi.fn() }));
// shareCalendar fires a notification after inserting — keep that out of unit scope

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';

import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { notificationsStub } from '../../helpers/notifications';
import { createTestUnitOfWork } from '../../helpers/test-uow';
import {
  createTestVacayPlansRepo, createTestVacayPlanMembersRepo, createTestVacayYearsRepo, createTestVacayUserYearsRepo,
  createTestVacayUserColorsRepo, createTestVacayEntriesRepo, createTestVacayCompanyHolidaysRepo,
  createTestVacaySharesRepo, createTestVacayUserSettingsRepo,
} from '../../helpers/vacay-repos';
import { createTestVacayHolidayCalendarsRepo, createTestSchoolHolidayRegionsRepo } from '../../helpers/school-holidays-repos';

// VACAY-SVC-001 through VACAY-SVC-066 moved 1:1 from the legacy
// tests/unit/services/vacayService.test.ts (the named-function imports became
// method calls on a directly constructed VacayService; the legacy
// updateUserYearSettings is the class's updateYearSettings).
// VACAY-SVC-067 (vacay.bridge delegation) died with the bridge — its only
// consumer, the legacy tripService, folded into the DI-native TripsService.
let svc: VacayService;

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  svc = new VacayService(
    await createTestVacayPlansRepo(testDb), await createTestVacayPlanMembersRepo(testDb),
    await createTestVacayYearsRepo(testDb), await createTestVacayUserYearsRepo(testDb),
    await createTestVacayUserColorsRepo(testDb), await createTestVacayEntriesRepo(testDb),
    await createTestVacayCompanyHolidaysRepo(testDb), await createTestVacayHolidayCalendarsRepo(testDb),
    await createTestVacaySharesRepo(testDb), await createTestVacayUserSettingsRepo(testDb),
    await createTestSchoolHolidayRegionsRepo(testDb),
    new RealtimeService(), notificationsStub(), await createTestUnitOfWork(testDb),
  );
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
async function setupUserWithPlan() {
  const { user } = createUser(testDb);
  const plan = await svc.getOwnPlan(user.id);
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
  it('VACAY-SVC-001: creates a new plan on first call for a fresh user', async () => {
    const { user } = createUser(testDb);
    const plan = await svc.getOwnPlan(user.id);

    expect(plan).toBeDefined();
    expect(plan.owner_id).toBe(user.id);
    expect(plan.id).toBeGreaterThan(0);
  });

  it('VACAY-SVC-002: returns the same plan on a second call (idempotent)', async () => {
    const { user } = createUser(testDb);
    const first = await svc.getOwnPlan(user.id);
    const second = await svc.getOwnPlan(user.id);

    expect(second.id).toBe(first.id);
  });

  it('VACAY-SVC-003: seeds the current year row in vacay_years after plan creation', async () => {
    const { user } = createUser(testDb);
    const plan = await svc.getOwnPlan(user.id);
    const yr = new Date().getFullYear();

    const row = testDb
      .prepare('SELECT * FROM vacay_years WHERE plan_id = ? AND year = ?')
      .get(plan.id, yr);

    expect(row).toBeDefined();
  });

  it('VACAY-SVC-004: seeds the current year user_year row with default 30 vacation_days', async () => {
    const { user } = createUser(testDb);
    const plan = await svc.getOwnPlan(user.id);
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
  it('VACAY-SVC-005: returns own plan when user has no accepted membership in another plan', async () => {
    const { user, plan } = await setupUserWithPlan();
    const active = await svc.getActivePlan(user.id);

    expect(active.id).toBe(plan.id);
    expect(active.owner_id).toBe(user.id);
  });

  it('VACAY-SVC-006: returns the shared plan when user has an accepted membership in another plan', async () => {
    const { user: owner, plan: ownerPlan } = await setupUserWithPlan();
    const { user: member } = createUser(testDb);
    // Make sure member also has their own plan materialised first
    await svc.getOwnPlan(member.id);

    insertMember(ownerPlan.id, member.id, 'accepted');

    const active = await svc.getActivePlan(member.id);
    expect(active.id).toBe(ownerPlan.id);
  });

  it('VACAY-SVC-007: pending membership does NOT override own plan as active', async () => {
    const { user: owner, plan: ownerPlan } = await setupUserWithPlan();
    const { user: member } = createUser(testDb);
    await svc.getOwnPlan(member.id);

    insertMember(ownerPlan.id, member.id, 'pending');

    const active = await svc.getActivePlan(member.id);
    // Should still point to member's own plan
    expect(active.owner_id).toBe(member.id);
  });
});

// ── getPlanUsers ──────────────────────────────────────────────────────────────

describe('getPlanUsers', () => {
  it('VACAY-SVC-008: returns [owner] for a solo plan', async () => {
    const { user, plan } = await setupUserWithPlan();
    const users = await svc.getPlanUsers(plan.id);

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(user.id);
  });

  it('VACAY-SVC-009: returns [owner, member] after an accepted membership is inserted', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');

    const users = await svc.getPlanUsers(plan.id);

    expect(users).toHaveLength(2);
    expect(users.map(u => u.id)).toContain(owner.id);
    expect(users.map(u => u.id)).toContain(member.id);
  });

  it('VACAY-SVC-010: pending membership members are NOT included in plan users', async () => {
    const { plan } = await setupUserWithPlan();
    const { user: pendingUser } = createUser(testDb);
    insertMember(plan.id, pendingUser.id, 'pending');

    const users = await svc.getPlanUsers(plan.id);
    expect(users.map(u => u.id)).not.toContain(pendingUser.id);
  });

  it('VACAY-SVC-011: returns empty array for a non-existent plan id', async () => {
    const users = await svc.getPlanUsers(99999);
    expect(users).toEqual([]);
  });
});

// ── migrateHolidayCalendars ───────────────────────────────────────────────────

describe('migrateHolidayCalendars', () => {
  it('VACAY-SVC-012: does nothing when holidays_enabled is falsy', async () => {
    const { plan } = await setupUserWithPlan();
    const planRow = { ...plan, holidays_enabled: 0, holidays_region: 'DE' };

    await svc.migrateHolidayCalendars(plan.id, planRow);

    const rows = testDb
      .prepare('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ?')
      .all(plan.id);
    expect(rows).toHaveLength(0);
  });

  it('VACAY-SVC-013: inserts a calendar row when holidays_enabled=1 and holidays_region is set', async () => {
    const { plan } = await setupUserWithPlan();
    const planRow = { ...plan, holidays_enabled: 1, holidays_region: 'DE' };

    await svc.migrateHolidayCalendars(plan.id, planRow);

    const rows = testDb
      .prepare('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ?')
      .all(plan.id) as { region: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].region).toBe('DE');
  });

  it('VACAY-SVC-014: does nothing if a calendar row already exists (no duplicate)', async () => {
    const { plan } = await setupUserWithPlan();
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
    const { plan } = await setupUserWithPlan();

    await svc.updatePlan(plan.id, { block_weekends: true }, undefined);

    const updated = testDb
      .prepare('SELECT block_weekends FROM vacay_plans WHERE id = ?')
      .get(plan.id) as { block_weekends: number };
    expect(updated.block_weekends).toBe(1);
  });

  it('VACAY-SVC-016: updates holidays_enabled flag', async () => {
    const { plan } = await setupUserWithPlan();

    await svc.updatePlan(plan.id, { holidays_enabled: true }, undefined);

    const updated = testDb
      .prepare('SELECT holidays_enabled FROM vacay_plans WHERE id = ?')
      .get(plan.id) as { holidays_enabled: number };
    expect(updated.holidays_enabled).toBe(1);
  });

  it('VACAY-SVC-017: returns the updated plan object with boolean-coerced flags', async () => {
    const { plan } = await setupUserWithPlan();

    const result = await svc.updatePlan(plan.id, { block_weekends: false }, undefined);

    expect(result.plan.block_weekends).toBe(false);
    expect(typeof result.plan.holidays_enabled).toBe('boolean');
  });

  it('VACAY-SVC-018: resets carried_over to 0 for all user_years when carry_over_enabled is set to false', async () => {
    const { user, plan } = await setupUserWithPlan();
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
  it('validates manual region references for creates and updates', async () => {
    const { plan } = await setupUserWithPlan();
    testDb.prepare("INSERT INTO school_holiday_countries (code, name) VALUES ('US', 'USA')").run();
    const inserted = testDb.prepare("INSERT INTO school_holiday_regions (country, name) VALUES ('US', 'Seattle')").run();
    const code = `US-MANUAL-${inserted.lastInsertRowid}`;
    const calendar = await svc.addHolidayCalendar(plan.id, code, null, undefined, 0, undefined, 'school_holiday');
    expect(calendar.region).toBe(code);
    expect((await svc.updateHolidayCalendar(calendar.id, plan.id, { label: 'School' }, undefined))?.region).toBe(code);
    await expect(svc.updateHolidayCalendar(calendar.id, plan.id, { type: 'public_holiday' }, undefined)).rejects.toThrow('Unknown manual');
    for (const region of ['US-MANUAL-0', 'US-MANUAL-999999', `CA-MANUAL-${inserted.lastInsertRowid}`]) {
      await expect(svc.addHolidayCalendar(plan.id, region, null, undefined, 0, undefined, 'school_holiday')).rejects.toThrow('Unknown manual');
    }
  });
  it('VACAY-SVC-019: inserts a new calendar row and returns the calendar object', async () => {
    const { plan } = await setupUserWithPlan();

    const cal = await svc.addHolidayCalendar(plan.id, 'GB', 'UK Holidays', '#ff0000', 0, undefined);

    expect(cal).toBeDefined();
    expect(cal.id).toBeGreaterThan(0);
    expect(cal.region).toBe('GB');
    expect(cal.label).toBe('UK Holidays');
    expect(cal.color).toBe('#ff0000');
  });

  it('VACAY-SVC-020: uses default color #fecaca when no color is provided', async () => {
    const { plan } = await setupUserWithPlan();

    const cal = await svc.addHolidayCalendar(plan.id, 'US', null, undefined, 0, undefined);

    expect(cal.color).toBe('#fecaca');
  });
});

// ── updateHolidayCalendar ─────────────────────────────────────────────────────

describe('updateHolidayCalendar', () => {
  it('VACAY-SVC-021: changes label and color on an existing calendar', async () => {
    const { plan } = await setupUserWithPlan();
    const cal = await svc.addHolidayCalendar(plan.id, 'DE', 'Germany', '#aabbcc', 0, undefined);

    const updated = await svc.updateHolidayCalendar(cal.id, plan.id, { label: 'Deutschland', color: '#112233' }, undefined);

    expect(updated).not.toBeNull();
    expect(updated!.label).toBe('Deutschland');
    expect(updated!.color).toBe('#112233');
  });

  it('VACAY-SVC-022: returns null when the calendar id does not exist in the plan', async () => {
    const { plan } = await setupUserWithPlan();

    const result = await svc.updateHolidayCalendar(99999, plan.id, { label: 'Nope' }, undefined);

    expect(result).toBeNull();
  });
});

// ── deleteHolidayCalendar ─────────────────────────────────────────────────────

describe('deleteHolidayCalendar', () => {
  it('VACAY-SVC-023: removes the calendar row and returns true on success', async () => {
    const { plan } = await setupUserWithPlan();
    const cal = await svc.addHolidayCalendar(plan.id, 'FR', null, undefined, 0, undefined);

    const result = await svc.deleteHolidayCalendar(cal.id, plan.id, undefined);

    expect(result).toBe(true);
    const row = testDb.prepare('SELECT id FROM vacay_holiday_calendars WHERE id = ?').get(cal.id);
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-024: returns false when the calendar does not exist', async () => {
    const { plan } = await setupUserWithPlan();

    const result = await svc.deleteHolidayCalendar(99999, plan.id, undefined);

    expect(result).toBe(false);
  });
});

// ── setUserColor ──────────────────────────────────────────────────────────────

describe('setUserColor', () => {
  it('VACAY-SVC-025: inserts a color for a user in a plan', async () => {
    const { user, plan } = await setupUserWithPlan();

    await svc.setUserColor(user.id, plan.id, '#123456', undefined);

    const row = testDb
      .prepare('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?')
      .get(user.id, plan.id) as { color: string } | undefined;
    expect(row?.color).toBe('#123456');
  });

  it('VACAY-SVC-026: updates the color when called a second time (upsert)', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.setUserColor(user.id, plan.id, '#aaaaaa', undefined);

    await svc.setUserColor(user.id, plan.id, '#bbbbbb', undefined);

    const row = testDb
      .prepare('SELECT color FROM vacay_user_colors WHERE user_id = ? AND plan_id = ?')
      .get(user.id, plan.id) as { color: string };
    expect(row.color).toBe('#bbbbbb');
  });
});

// ── listYears / addYear / deleteYear ──────────────────────────────────────────

describe('listYears', () => {
  it('VACAY-SVC-027: returns the seeded current year for a freshly created plan', async () => {
    const { plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    const years = await svc.listYears(plan.id);

    expect(years).toContain(yr);
  });
});

describe('addYear', () => {
  it('VACAY-SVC-028: inserts a new year and creates a user_year record', async () => {
    const { user, plan } = await setupUserWithPlan();
    const newYear = new Date().getFullYear() + 2;

    await svc.addYear(plan.id, newYear, undefined);

    const years = await svc.listYears(plan.id);
    expect(years).toContain(newYear);

    const userYear = testDb
      .prepare('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?')
      .get(user.id, plan.id, newYear) as { vacation_days: number } | undefined;
    expect(userYear).toBeDefined();
    expect(userYear!.vacation_days).toBe(30);
  });

  it('VACAY-SVC-029: carries over remaining days to the new year when carry_over_enabled is true', async () => {
    const { user, plan } = await setupUserWithPlan();
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

    await svc.addYear(plan.id, nextYear, undefined);

    const userYear = testDb
      .prepare('SELECT carried_over FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?')
      .get(user.id, plan.id, nextYear) as { carried_over: number } | undefined;
    // 10 vacation days - 3 used = 7 carried over
    expect(userYear?.carried_over).toBe(7);
  });
});

describe('deleteYear', () => {
  it('VACAY-SVC-030: removes the year row and its associated entries', async () => {
    const { user, plan } = await setupUserWithPlan();
    const targetYear = new Date().getFullYear() + 3;

    await svc.addYear(plan.id, targetYear, undefined);
    // Insert an entry for that year
    testDb
      .prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)')
      .run(plan.id, user.id, `${targetYear}-07-15`, '');

    await svc.deleteYear(plan.id, targetYear, undefined);

    const yearRow = testDb
      .prepare('SELECT * FROM vacay_years WHERE plan_id = ? AND year = ?')
      .get(plan.id, targetYear);
    expect(yearRow).toBeUndefined();

    const entries = testDb
      .prepare("SELECT * FROM vacay_entries WHERE plan_id = ? AND date LIKE ?")
      .all(plan.id, `${targetYear}-%`);
    expect(entries).toHaveLength(0);
  });

  it('VACAY-SVC-030a (VC102 parity): touches only each author\'s OWN leave-year window, not one shared window across a fused plan', async () => {
    // Two members of the SAME plan on genuinely different leave-year shapes
    // (#737): userA stays on the default calendar year, userB is fiscal
    // (Apr 1 start). deleteYear(planId, 2026) must delete userA's entry that
    // falls in A's calendar-2026 window and userB's entry that falls in B's
    // fiscal-2026 window, while leaving each author's OWN neighbouring-period
    // entry untouched — a shortcut that computed ONE shared window (off
    // either the plan or either single author) and reused it across both
    // authors would either strand entries or delete another member's rows on
    // their differently-shaped year.
    const { user: userA, plan } = await setupUserWithPlan();
    const { user: userB } = createUser(testDb);
    await svc.getOwnPlan(userB.id);
    insertMember(plan.id, userB.id, 'accepted');
    await svc.updateYearSettings(userB.id, { year_type: 'fiscal', year_start_month: 4, year_start_day: 1 });
    await svc.addYear(plan.id, 2026, undefined);

    const insertEntry = (userId: number, date: string) =>
      testDb.prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(plan.id, userId, date, '');
    insertEntry(userA.id, '2026-02-10'); // inside A's CALENDAR 2026 window [2026-01-01, 2027-01-01) — must be deleted
    insertEntry(userA.id, '2025-11-01'); // inside A's CALENDAR 2025 window — must survive
    insertEntry(userB.id, '2026-02-10'); // inside B's FISCAL 2025 window [2025-04-01, 2026-04-01) — must survive
    insertEntry(userB.id, '2026-05-10'); // inside B's FISCAL 2026 window [2026-04-01, 2027-04-01) — must be deleted

    await svc.deleteYear(plan.id, 2026, undefined);

    const remaining = testDb.prepare('SELECT user_id, date FROM vacay_entries WHERE plan_id = ? ORDER BY user_id, date').all(plan.id);
    expect(remaining).toEqual([
      { user_id: userA.id, date: '2025-11-01' },
      { user_id: userB.id, date: '2026-02-10' },
    ]);
  });
});

// ── shiftOwnerEntriesForTripWindow (VC4 restructured date-diff shape) ─────────

describe('shiftOwnerEntriesForTripWindow', () => {
  it('VACAY-SVC-030b (VC4 parity): shifts an entry by the exact calendar-day offset between the old and new trip start, across several date-pair shapes incl. a leap-year boundary', async () => {
    // R9's verified restructured shape (task-0-report.md): plain JS
    // Math.round((Date.parse(newStart) - Date.parse(oldStart)) / 86400000)
    // in place of the legacy CAST(julianday(?) - julianday(?) AS INTEGER) —
    // verified there against the SQL on 5 date pairs incl. a leap-year
    // boundary and a negative offset, all matched exactly. This proves the
    // SAME arithmetic end-to-end through the converted service method.
    const { user, plan } = await setupUserWithPlan();
    const cases: [oldStart: string, oldEnd: string, newStart: string, entryDate: string, expectedShifted: string][] = [
      ['2026-03-01', '2026-03-10', '2026-03-06', '2026-03-05', '2026-03-10'], // +5 days
      ['2024-02-25', '2024-03-05', '2024-02-28', '2024-03-01', '2024-03-04'], // leap-year boundary, +3 days
      ['2026-06-10', '2026-06-20', '2026-06-03', '2026-06-15', '2026-06-08'], // -7 days
    ];
    for (const [oldStart, oldEnd, newStart, entryDate, expectedShifted] of cases) {
      testDb.prepare('DELETE FROM vacay_entries WHERE plan_id = ?').run(plan.id);
      testDb.prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(plan.id, user.id, entryDate, '');

      await svc.shiftOwnerEntriesForTripWindow(user.id, oldStart, oldEnd, newStart);

      const row = testDb.prepare('SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ?').get(plan.id, user.id) as { date: string };
      expect(row.date).toBe(expectedShifted);
    }
  });

  it('VACAY-SVC-030c: a zero offset is a no-op (no write at all)', async () => {
    const { user, plan } = await setupUserWithPlan();
    testDb.prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(plan.id, user.id, '2026-05-05', '');

    await svc.shiftOwnerEntriesForTripWindow(user.id, '2026-05-01', '2026-05-10', '2026-05-01');

    const row = testDb.prepare('SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ?').get(plan.id, user.id) as { date: string };
    expect(row.date).toBe('2026-05-05');
  });

  it('VACAY-SVC-030d (M2 parity): an unparseable start (garbage) resolves as a no-op, same as legacy\'s NULL-julianday offset of 0, instead of writing a NaN date', async () => {
    const { user, plan } = await setupUserWithPlan();
    testDb.prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(plan.id, user.id, '2026-05-05', '');

    await expect(svc.shiftOwnerEntriesForTripWindow(user.id, '2026-05-01', '2026-05-10', 'soon')).resolves.toBeUndefined();

    const row = testDb.prepare('SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ?').get(plan.id, user.id) as { date: string };
    expect(row.date).toBe('2026-05-05');
  });

  it('VACAY-SVC-030e (M2 parity): a datetime start with no zone suffix is parsed as UTC and truncated, matching base\'s CAST(julianday(...) AS INTEGER) rather than a local-time round', async () => {
    // base: CAST(julianday('2025-06-12T23:30') - julianday('2025-06-10') AS INTEGER) = 2
    // (2 days 23.5 hours, truncated toward zero) — a local-time Date.parse +
    // Math.round of the same pair computed 3 instead (task-7-review.md M2).
    const { user, plan } = await setupUserWithPlan();
    testDb.prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(plan.id, user.id, '2025-06-15', '');

    await svc.shiftOwnerEntriesForTripWindow(user.id, '2025-06-10', '2025-06-20', '2025-06-12T23:30');

    const row = testDb.prepare('SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ?').get(plan.id, user.id) as { date: string };
    expect(row.date).toBe('2025-06-17');
  });

  it('VACAY-SVC-030f (M1 parity): consecutive-day entries inserted in descending-id order shift to the rowid-ordered (legacy) outcome, not the date-index-ordered one', async () => {
    // Legacy's single `UPDATE OR IGNORE` walks rows in rowid order.
    // VacayEntriesRepository.shiftForOwnerWindow's `find` had no `orderBy`, so
    // SQLite returned candidates in (user, plan, date) index order instead —
    // a different per-row collision check skips different rows
    // (task-7-review.md M1). Inserting the latest date first makes the id
    // order run opposite the date order, so the two orderings disagree.
    const { user, plan } = await setupUserWithPlan();
    const insertEntry = (date: string) =>
      testDb.prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(plan.id, user.id, date, '');
    const readDates = () =>
      (testDb.prepare('SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ? ORDER BY date').all(plan.id, user.id) as { date: string }[]).map(
        (r) => r.date,
      );

    insertEntry('2026-07-12');
    insertEntry('2026-07-11');
    insertEntry('2026-07-10');

    await svc.shiftOwnerEntriesForTripWindow(user.id, '2026-07-01', '2026-07-20', '2026-07-02'); // offset +1
    expect(readDates()).toEqual(['2026-07-11', '2026-07-12', '2026-07-13']);

    testDb.prepare('DELETE FROM vacay_entries WHERE plan_id = ?').run(plan.id);
    insertEntry('2026-07-12');
    insertEntry('2026-07-11');
    insertEntry('2026-07-10');

    await svc.shiftOwnerEntriesForTripWindow(user.id, '2026-07-02', '2026-07-21', '2026-07-01'); // offset -1
    expect(readDates()).toEqual(['2026-07-09', '2026-07-11', '2026-07-12']);
  });
});

// ── getEntries / toggleEntry ──────────────────────────────────────────────────

describe('getEntries', () => {
  it('VACAY-SVC-031: returns empty entries and companyHolidays for a new plan+year', async () => {
    const { plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear().toString();

    const result = await svc.getEntries(plan.id, yr);

    expect(result.entries).toEqual([]);
    expect(result.companyHolidays).toEqual([]);
  });

  it('VACAY-SVC-031a (VC111 parity): full-key toEqual against the legacy statement run raw on the same seeded rows', async () => {
    // A fused plan across all three leave-year-window shapes (#737), every
    // fraction/kind combination, and a member left on the default color to
    // exercise the COALESCE(c.color, '#6366f1') fallback branch too — rule
    // 19's "fully seeded" bar for this read model.
    const { user: owner, plan } = await setupUserWithPlan();
    allowWeekends(plan.id);
    const { user: userB } = createUser(testDb);
    const { user: userC } = createUser(testDb);
    await svc.getOwnPlan(userB.id);
    await svc.getOwnPlan(userC.id);
    insertMember(plan.id, userB.id, 'accepted');
    insertMember(plan.id, userC.id, 'accepted');
    await svc.updateYearSettings(userB.id, { year_type: 'fiscal', year_start_month: 4, year_start_day: 1 });
    await svc.updateYearSettings(userC.id, { year_type: 'anniversary', hire_date: '2020-06-15' });
    await svc.setUserColor(owner.id, plan.id, '#111111', undefined);
    await svc.setUserColor(userB.id, plan.id, '#222222', undefined);
    // userC keeps whatever color getOwnPlan seeded by default — not
    // re-set here, so its row exercises the LEFT JOIN's COALESCE fallback
    // the same way a row with no vacay_user_colors match would.

    await svc.toggleEntry(owner.id, plan.id, '2026-02-10', 1, 'vacation');
    await svc.toggleEntry(userB.id, plan.id, '2026-05-05', 0.5, 'vacation');
    await svc.toggleEntry(userC.id, plan.id, '2026-08-20', 1, 'comp');

    const result = await svc.getEntries(plan.id, '2026', owner.id);

    const legacy = testDb.prepare(`
      SELECT e.*, u.username as person_name, COALESCE(c.color, '#6366f1') as person_color
      FROM vacay_entries e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN vacay_user_colors c ON c.user_id = e.user_id AND c.plan_id = e.plan_id
      WHERE e.plan_id = ? AND e.date >= ? AND e.date < ?
    `).all(plan.id, '2026-01-01', '2027-01-01') as { id: number }[];

    expect(legacy).toHaveLength(3);
    const byId = <T extends { id: number }>(rows: T[]) => [...rows].sort((a, b) => a.id - b.id);
    expect(byId(result.entries as { id: number }[])).toEqual(byId(legacy));
  });
});

describe('toggleEntry', () => {
  it('VACAY-SVC-032: adds an entry on first call (action: added)', async () => {
    const { user, plan } = await setupUserWithPlan();

    const result = await svc.toggleEntry(user.id, plan.id, '2025-08-01', undefined);

    expect(result.action).toBe('added');
    const row = testDb
      .prepare('SELECT * FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-01');
    expect(row).toBeDefined();
  });

  it('VACAY-SVC-033: removes the entry on second call (action: removed)', async () => {
    const { user, plan } = await setupUserWithPlan();

    await svc.toggleEntry(user.id, plan.id, '2025-08-04', undefined);
    const result = await svc.toggleEntry(user.id, plan.id, '2025-08-04', undefined);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT * FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-04');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-033a: logs a half day when fraction is 0.5 (#552)', async () => {
    const { user, plan } = await setupUserWithPlan();

    const result = await svc.toggleEntry(user.id, plan.id, '2025-08-05', 0.5);

    expect(result).toMatchObject({ action: 'added', fraction: 0.5 });
    const row = testDb
      .prepare('SELECT fraction FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-05') as { fraction: number };
    expect(row.fraction).toBe(0.5);
  });

  it('VACAY-SVC-033b: converts a full day into a half day in place (action: updated)', async () => {
    const { user, plan } = await setupUserWithPlan();

    await svc.toggleEntry(user.id, plan.id, '2025-08-06', 1);
    const result = await svc.toggleEntry(user.id, plan.id, '2025-08-06', 0.5);

    expect(result).toMatchObject({ action: 'updated', fraction: 0.5 });
    const row = testDb
      .prepare('SELECT fraction FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-06') as { fraction: number };
    expect(row.fraction).toBe(0.5);
  });

  it('VACAY-SVC-033c: toggling the same half day again clears it (action: removed)', async () => {
    const { user, plan } = await setupUserWithPlan();

    await svc.toggleEntry(user.id, plan.id, '2025-08-07', 0.5);
    const result = await svc.toggleEntry(user.id, plan.id, '2025-08-07', 0.5);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT id FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-08-07');
    expect(row).toBeUndefined();
  });

  // Weekend blocking (I-02): plans default to block_weekends = 1 / weekend_days '0,6'.
  it('VACAY-SVC-033d: rejects a blocked weekend day with error weekend_blocked (I-02)', async () => {
    const { user, plan } = await setupUserWithPlan();

    const result = await svc.toggleEntry(user.id, plan.id, '2025-07-19', undefined); // Saturday

    expect(result).toEqual({ error: 'weekend_blocked' });
    const row = testDb
      .prepare('SELECT id FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-07-19');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-033e: accepts a non-weekend day on a blocking plan', async () => {
    const { user, plan } = await setupUserWithPlan();

    const result = await svc.toggleEntry(user.id, plan.id, '2025-07-16', undefined); // Wednesday

    expect(result).toMatchObject({ action: 'added' });
  });

  it('VACAY-SVC-033f: accepts a weekend day when block_weekends is off', async () => {
    const { user, plan } = await setupUserWithPlan();
    testDb.prepare('UPDATE vacay_plans SET block_weekends = 0 WHERE id = ?').run(plan.id);

    const result = await svc.toggleEntry(user.id, plan.id, '2025-07-19', undefined); // Saturday

    expect(result).toMatchObject({ action: 'added' });
  });

  it('VACAY-SVC-033g: honours custom weekend_days (5,6 blocks Friday, frees Sunday)', async () => {
    const { user, plan } = await setupUserWithPlan();
    testDb.prepare("UPDATE vacay_plans SET weekend_days = '5,6' WHERE id = ?").run(plan.id);

    expect(await svc.toggleEntry(user.id, plan.id, '2025-07-18', undefined)).toEqual({ error: 'weekend_blocked' }); // Friday
    expect(await svc.toggleEntry(user.id, plan.id, '2025-07-20', undefined)).toMatchObject({ action: 'added' }); // Sunday
  });

  it('VACAY-SVC-033h: a NULL weekend_days column falls back to Sat/Sun', async () => {
    const { user, plan } = await setupUserWithPlan();
    testDb.prepare('UPDATE vacay_plans SET weekend_days = NULL WHERE id = ?').run(plan.id);

    expect(await svc.toggleEntry(user.id, plan.id, '2025-07-19', undefined)).toEqual({ error: 'weekend_blocked' }); // Saturday
  });

  it('VACAY-SVC-033i: still removes an existing entry on a blocked day (stray-data cleanup)', async () => {
    const { user, plan } = await setupUserWithPlan();
    testDb
      .prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note, fraction, kind) VALUES (?, ?, ?, ?, ?, ?)')
      .run(plan.id, user.id, '2025-07-19', '', 1, 'vacation');

    const result = await svc.toggleEntry(user.id, plan.id, '2025-07-19', 1, 'vacation');

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT id FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-07-19');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-033j: refuses to convert an existing entry in place on a blocked day', async () => {
    const { user, plan } = await setupUserWithPlan();
    testDb
      .prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note, fraction, kind) VALUES (?, ?, ?, ?, ?, ?)')
      .run(plan.id, user.id, '2025-07-19', '', 0.5, 'vacation');

    const result = await svc.toggleEntry(user.id, plan.id, '2025-07-19', 1, 'vacation');

    expect(result).toEqual({ error: 'weekend_blocked' });
    const row = testDb
      .prepare('SELECT fraction FROM vacay_entries WHERE user_id = ? AND plan_id = ? AND date = ?')
      .get(user.id, plan.id, '2025-07-19') as { fraction: number };
    expect(row.fraction).toBe(0.5);
  });
});

// ── toggleCompanyHoliday ──────────────────────────────────────────────────────

describe('toggleCompanyHoliday', () => {
  it('VACAY-SVC-034: adds a company holiday on first call (action: added)', async () => {
    const { plan } = await setupUserWithPlan();

    const result = await svc.toggleCompanyHoliday(plan.id, '2025-12-25', 'Christmas', undefined);

    expect(result.action).toBe('added');
    const row = testDb
      .prepare('SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date = ?')
      .get(plan.id, '2025-12-25');
    expect(row).toBeDefined();
  });

  it('VACAY-SVC-035: removes the company holiday on second call (action: removed)', async () => {
    const { plan } = await setupUserWithPlan();

    await svc.toggleCompanyHoliday(plan.id, '2025-12-26', 'Boxing Day', undefined);
    const result = await svc.toggleCompanyHoliday(plan.id, '2025-12-26', undefined, undefined);

    expect(result.action).toBe('removed');
    const row = testDb
      .prepare('SELECT * FROM vacay_company_holidays WHERE plan_id = ? AND date = ?')
      .get(plan.id, '2025-12-26');
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-036: adding a company holiday removes any existing vacay_entry on that date', async () => {
    const { user, plan } = await setupUserWithPlan();

    // First add a personal entry on that date
    await svc.toggleEntry(user.id, plan.id, '2025-05-01', undefined);

    // Now declare it a company holiday — the personal entry should be wiped
    await svc.toggleCompanyHoliday(plan.id, '2025-05-01', 'Labour Day', undefined);

    const personalEntry = testDb
      .prepare('SELECT * FROM vacay_entries WHERE plan_id = ? AND date = ?')
      .get(plan.id, '2025-05-01');
    expect(personalEntry).toBeUndefined();
  });
});

describe('half company holidays (#2439)', () => {
  const entryOf = (planId: number, date: string) =>
    testDb.prepare('SELECT fraction FROM vacay_entries WHERE plan_id = ? AND date = ?').get(planId, date) as { fraction: number } | undefined;
  const holidayOf = (planId: number, date: string) =>
    testDb.prepare('SELECT fraction FROM vacay_company_holidays WHERE plan_id = ? AND date = ?').get(planId, date) as { fraction: number } | undefined;

  it('VACAY-SVC-036b: a half company holiday halves a whole vacation day instead of wiping it', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.toggleEntry(user.id, plan.id, '2025-12-24', 1);
    expect(await svc.toggleCompanyHoliday(plan.id, '2025-12-24', 'Christmas Eve', undefined, 0.5)).toEqual({ action: 'added', fraction: 0.5 });
    expect(entryOf(plan.id, '2025-12-24')?.fraction).toBe(0.5);
    expect(holidayOf(plan.id, '2025-12-24')?.fraction).toBe(0.5);
  });

  it('VACAY-SVC-036c: the other size converts the holiday, the same size clears it', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.toggleCompanyHoliday(plan.id, '2025-12-31', undefined, undefined, 0.5);
    await svc.toggleEntry(user.id, plan.id, '2025-12-31', 0.5);
    expect(await svc.toggleCompanyHoliday(plan.id, '2025-12-31', undefined, undefined, 1)).toEqual({ action: 'updated', fraction: 1 });
    expect(entryOf(plan.id, '2025-12-31')).toBeUndefined();
    expect(await svc.toggleCompanyHoliday(plan.id, '2025-12-31', undefined, undefined, 1)).toEqual({ action: 'removed' });
    expect(holidayOf(plan.id, '2025-12-31')).toBeUndefined();
  });

  it('VACAY-SVC-036d: leave on a half company holiday is half a day, whatever was asked', async () => {
    const { user, plan } = await setupUserWithPlan();
    testDb.prepare('UPDATE vacay_plans SET company_holidays_enabled = 1 WHERE id = ?').run(plan.id);
    await svc.toggleCompanyHoliday(plan.id, '2025-12-24', undefined, undefined, 0.5);
    expect(await svc.toggleEntry(user.id, plan.id, '2025-12-24', 1)).toMatchObject({ action: 'added', fraction: 0.5 });
  });
});

// ── acceptInvite / declineInvite / cancelInvite ───────────────────────────────

describe('acceptInvite', () => {
  it('VACAY-SVC-037: changes membership status to accepted', async () => {
    const { user: owner, plan: ownerPlan } = await setupUserWithPlan();
    const { user: invitee } = createUser(testDb);
    await svc.getOwnPlan(invitee.id); // ensure own plan exists for data migration path
    insertMember(ownerPlan.id, invitee.id, 'pending');

    const result = await svc.acceptInvite(invitee.id, ownerPlan.id, undefined);

    expect(result.error).toBeUndefined();
    const row = testDb
      .prepare('SELECT status FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?')
      .get(ownerPlan.id, invitee.id) as { status: string } | undefined;
    expect(row?.status).toBe('accepted');
  });

  it('VACAY-SVC-038: returns 404 error when there is no pending invite', async () => {
    const { user } = createUser(testDb);

    const result = await svc.acceptInvite(user.id, 99999, undefined);

    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('VACAY-SVC-039: accepted member becomes visible via getActivePlan', async () => {
    const { user: owner, plan: ownerPlan } = await setupUserWithPlan();
    const { user: invitee } = createUser(testDb);
    await svc.getOwnPlan(invitee.id);
    insertMember(ownerPlan.id, invitee.id, 'pending');

    await svc.acceptInvite(invitee.id, ownerPlan.id, undefined);

    const active = await svc.getActivePlan(invitee.id);
    expect(active.id).toBe(ownerPlan.id);
  });
});

describe('declineInvite', () => {
  it('VACAY-SVC-040: removes the pending invite row', async () => {
    const { user: owner, plan: ownerPlan } = await setupUserWithPlan();
    const { user: invitee } = createUser(testDb);
    insertMember(ownerPlan.id, invitee.id, 'pending');

    await svc.declineInvite(invitee.id, ownerPlan.id, undefined);

    const row = testDb
      .prepare('SELECT * FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?')
      .get(ownerPlan.id, invitee.id);
    expect(row).toBeUndefined();
  });
});

describe('cancelInvite', () => {
  it('VACAY-SVC-041: removes the pending invite when owner cancels it', async () => {
    const { user: owner, plan: ownerPlan } = await setupUserWithPlan();
    const { user: target } = createUser(testDb);
    insertMember(ownerPlan.id, target.id, 'pending');

    await svc.cancelInvite(ownerPlan.id, target.id);

    const row = testDb
      .prepare('SELECT * FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?')
      .get(ownerPlan.id, target.id);
    expect(row).toBeUndefined();
  });
});

// ── getAvailableUsers ─────────────────────────────────────────────────────────

describe('getAvailableUsers', () => {
  it('VACAY-SVC-042: returns users not already in the plan and not fused elsewhere', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: unrelated } = createUser(testDb);
    await svc.getOwnPlan(unrelated.id);

    const available = await svc.getAvailableUsers(owner.id, plan.id) as { id: number }[];

    expect(available.map(u => u.id)).toContain(unrelated.id);
    // Owner themselves should NOT appear (excluded by u.id != ?)
    expect(available.map(u => u.id)).not.toContain(owner.id);
  });

  it('VACAY-SVC-043: excludes users who already have an accepted membership in any plan', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: alreadyFused } = createUser(testDb);
    const { plan: otherPlan } = await setupUserWithPlan();
    insertMember(otherPlan.id, alreadyFused.id, 'accepted');

    const available = await svc.getAvailableUsers(owner.id, plan.id) as { id: number }[];

    expect(available.map(u => u.id)).not.toContain(alreadyFused.id);
  });

  // #2112 — guests are trip-scoped accounts, and every other directory in the app
  // already leaves them out. Vacay's two pickers did not, so a guest stayed
  // selectable here even after being removed from the trip it was created for.
  it('VACAY-SVC-073: guest accounts are not offered in the plan invite picker', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: guest } = createUser(testDb);
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);

    const available = await svc.getAvailableUsers(owner.id, plan.id) as { id: number }[];

    expect(available.map(u => u.id)).not.toContain(guest.id);
  });

  it('VACAY-SVC-074: guest accounts are not offered in the shared-calendar picker', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: guest } = createUser(testDb);
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);

    const available = await svc.getShareAvailableUsers(owner.id) as { id: number }[];

    expect(available.map(u => u.id)).not.toContain(guest.id);
  });

  it('VACAY-SVC-075: a guest id sent straight to the write paths is refused', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: guest } = createUser(testDb);
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);

    // The picker is only a list. The id comes back from the client, and the MCP
    // tools reach the same two methods, so refusing has to happen here.
    const invited = await svc.sendInvite(plan.id, owner.id, 'owner', 'owner@example.test', guest.id);
    expect(invited.error).toBe('User not found');
    const shared = await svc.shareCalendar(owner.id, 'owner@example.test', guest.id);
    expect(shared.error).toBe('User not found');
  });
});

// ── getStats ──────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('VACAY-SVC-044: returns per-user stats with correct fields', async () => {
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    const stats = await svc.getStats(plan.id, yr);

    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({
      user_id: user.id,
      year: yr,
      vacation_days: 30,
      used: 0,
      remaining: 30,
    });
  });

  it('VACAY-SVC-044a (L1 parity): a legacy NULL vacation_days/carried_over row passes through on the wire, not defaulted to 30/0', async () => {
    // task-7-review.md L1: `?? 30`/`?? 0` on these nullable columns would show
    // a fabricated default instead of the row's actual NULL — legacy bound
    // them AS-IS. `total_available`/`remaining` still need a number, so the
    // arithmetic null-coalesces separately, reproducing legacy's `null + n =
    // n` coercion without lying about the row on the wire.
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();
    testDb.prepare('UPDATE vacay_user_years SET vacation_days = NULL, carried_over = NULL WHERE user_id = ? AND plan_id = ? AND year = ?').run(user.id, plan.id, yr);

    const stats = await svc.getStats(plan.id, yr);

    expect(stats[0].vacation_days).toBeNull();
    expect(stats[0].carried_over).toBeNull();
    expect(stats[0].total_available).toBe(0);
    expect(stats[0].remaining).toBe(0);
  });

  it('VACAY-SVC-045: used reflects the actual number of entries for that user and year', async () => {
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-10`, undefined);
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-11`, undefined);

    const stats = await svc.getStats(plan.id, yr);

    expect(stats[0].used).toBe(2);
    expect(stats[0].remaining).toBe(28);
  });

  it('VACAY-SVC-045a: half days count as 0.5 toward the used total (#552)', async () => {
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-12`, 1);    // full day
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-13`, 0.5);  // half day

    const stats = await svc.getStats(plan.id, yr);

    expect(stats[0].used).toBe(1.5);
    expect(stats[0].remaining).toBe(28.5);
  });

  it('VACAY-SVC-045b: comp/flex days cost nothing (#1074)', async () => {
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-14`, 1, 'vacation');
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-15`, 1, 'comp');

    const stats = await svc.getStats(plan.id, yr);

    expect(stats[0].used).toBe(1);
    expect(stats[0].remaining).toBe(29);
  });

  it('VACAY-SVC-045c: a half comp day also costs nothing (#1074)', async () => {
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-16`, 0.5, 'comp');

    const stats = await svc.getStats(plan.id, yr);

    expect(stats[0].used).toBe(0);
    expect(stats[0].remaining).toBe(30);
  });

  it('VACAY-SVC-045d: comp_used reports comp days separately, summing fractions (#1074)', async () => {
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-17`, 1, 'comp');
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-18`, 0.5, 'comp');
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-19`, 1, 'vacation');

    const stats = await svc.getStats(plan.id, yr);

    expect(stats[0].comp_used).toBe(1.5);
    expect(stats[0].used).toBe(1);
  });

  it('VACAY-SVC-045e: converting a vacation day to comp refunds it to the entitlement (#1074)', async () => {
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    allowWeekends(plan.id);
    await svc.toggleEntry(user.id, plan.id, `${yr}-09-20`, 1, 'vacation');
    expect((await svc.getStats(plan.id, yr))[0].used).toBe(1);

    const result = await svc.toggleEntry(user.id, plan.id, `${yr}-09-20`, 1, 'comp');

    expect(result).toMatchObject({ action: 'updated', kind: 'comp' });
    expect((await svc.getStats(plan.id, yr))[0].used).toBe(0);
  });

  it('VACAY-SVC-045g: a rejected weekend toggle leaves used/remaining untouched (I-02)', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.toggleEntry(user.id, plan.id, '2025-07-16', 1, 'vacation'); // Wednesday
    const before = (await svc.getStats(plan.id, 2025))[0];
    expect(before.used).toBe(1);

    const result = await svc.toggleEntry(user.id, plan.id, '2025-07-19', 1, 'vacation'); // Saturday

    expect(result).toEqual({ error: 'weekend_blocked' });
    const after = (await svc.getStats(plan.id, 2025))[0];
    expect(after.used).toBe(before.used);
    expect(after.remaining).toBe(before.remaining);
  });

  it('VACAY-SVC-045f: getStats reports the window it counted over (#737)', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7, year_start_day: 1 });

    const stats = await svc.getStats(plan.id, 2026);

    expect(stats[0]).toMatchObject({ window_start: '2026-07-01', window_end: '2027-07-01' });
  });
});

// ── Configurable vacation year (#737) ─────────────────────────────────────────

describe('resolveYearWindow', () => {
  it('VACAY-SVC-045g: defaults to the plain calendar year when nothing is configured', async () => {
    const { user } = await setupUserWithPlan();

    expect(await svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' });
  });

  it('VACAY-SVC-045h: an explicit calendar setting resolves identically', async () => {
    const { user } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'calendar' });

    expect(await svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' });
  });

  it('VACAY-SVC-045i: a fiscal year starts on the configured month and day', async () => {
    const { user } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 4, year_start_day: 6 });

    expect(await svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-04-06', end: '2027-04-06' });
  });

  it('VACAY-SVC-045j: an anniversary year follows the hire date month and day', async () => {
    const { user } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'anniversary', hire_date: '2019-09-16' });

    expect(await svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-09-16', end: '2027-09-16' });
  });

  it('VACAY-SVC-045k: an anniversary year without a hire date falls back to January 1', async () => {
    const { user } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'anniversary' });

    expect(await svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' });
  });

  it('VACAY-SVC-045k1: an anniversary year ignores a month left behind by a previous fiscal setting', async () => {
    const { user } = await setupUserWithPlan();
    // What the settings UI sends when you pick Fiscal/April and then click
    // "Hire date" before typing one — it carries the whole settings object.
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 4, year_start_day: 1 });
    await svc.updateYearSettings(user.id, { year_type: 'anniversary', year_start_month: 4, year_start_day: 1, hire_date: null });

    expect(await svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' });
  });

  it('VACAY-SVC-045k2: a Feb 29 hire date resolves to Feb 28, a boundary every year has', async () => {
    const { user } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'anniversary', hire_date: '2024-02-29' });

    expect(await svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-02-28', end: '2027-02-28' });
  });

  it('VACAY-SVC-045k3: a fiscal day the month cannot have is clamped down to one it can', async () => {
    const { user } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 2, year_start_day: 31 });

    expect(await svc.resolveYearWindow(user.id, 2026)).toEqual({ start: '2026-02-28', end: '2027-02-28' });
  });

  it('VACAY-SVC-045l: consecutive periods meet exactly, so the carry-over chain stays intact', async () => {
    const { user } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    expect((await svc.resolveYearWindow(user.id, 2025)).end).toBe((await svc.resolveYearWindow(user.id, 2026)).start);
  });
});

describe('updateUserYearSettings', () => {
  it('VACAY-SVC-045m: upserts, so a second call replaces the first', async () => {
    const { user } = await setupUserWithPlan();

    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7, year_start_day: 1 });
    const saved = await svc.updateYearSettings(user.id, { year_type: 'calendar' });

    expect(saved.year_type).toBe('calendar');
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM vacay_user_settings WHERE user_id = ?').get(user.id)).toEqual({ n: 1 });
  });

  it('VACAY-SVC-045n: clamps an out-of-range month and day instead of storing them', async () => {
    const { user } = await setupUserWithPlan();

    const saved = await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 99, year_start_day: 0 });

    expect(saved.year_start_month).toBe(12);
    expect(saved.year_start_day).toBe(1);
  });

  it('VACAY-SVC-045o: drops a malformed hire date rather than persisting it', async () => {
    const { user } = await setupUserWithPlan();

    const saved = await svc.updateYearSettings(user.id, { year_type: 'anniversary', hire_date: 'not-a-date' });

    expect(saved.hire_date).toBeNull();
  });

  it('VACAY-SVC-045p: an unknown year type falls back to calendar', async () => {
    const { user } = await setupUserWithPlan();

    expect((await svc.updateYearSettings(user.id, { year_type: 'quarterly' })).year_type).toBe('calendar');
  });
});

describe('getYearSettings', () => {
  it('VACAY-SVC-045q: fills in the calendar defaults for a user who never configured anything', async () => {
    const { user } = await setupUserWithPlan();

    expect(await svc.getUserYearSettings(user.id)).toBeUndefined();
    expect(await svc.getYearSettings(user.id)).toEqual({
      user_id: user.id, year_type: 'calendar', year_start_month: 1, year_start_day: 1, hire_date: null,
    });
  });
});

describe('currentPeriodYear', () => {
  it('VACAY-SVC-045r: a calendar user is always in the period named after today’s year', async () => {
    const { user } = await setupUserWithPlan();

    expect(await svc.currentPeriodYear(user.id, new Date('2026-03-15T12:00:00'))).toBe(2026);
  });

  it('VACAY-SVC-045s: before a fiscal year starts, today still belongs to the previous period', async () => {
    const { user } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    expect(await svc.currentPeriodYear(user.id, new Date('2026-03-15T12:00:00'))).toBe(2025);
    expect(await svc.currentPeriodYear(user.id, new Date('2026-08-15T12:00:00'))).toBe(2026);
  });
});

describe('usage over a shifted window (#737)', () => {
  it('VACAY-SVC-045t: a day in the next calendar year still counts toward the fiscal period', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    await svc.toggleEntry(user.id, plan.id, '2026-08-10', 1, 'vacation');  // inside, first half
    await svc.toggleEntry(user.id, plan.id, '2027-02-10', 1, 'vacation');  // inside, second half

    expect((await svc.getStats(plan.id, 2026))[0].used).toBe(2);
  });

  it('VACAY-SVC-045u: days outside the window belong to the neighbouring periods, not this one', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    await svc.toggleEntry(user.id, plan.id, '2026-06-30', 1, 'vacation');  // last day of the previous period
    await svc.toggleEntry(user.id, plan.id, '2027-07-01', 1, 'vacation');  // first day of the next period

    expect((await svc.getStats(plan.id, 2026))[0].used).toBe(0);
    expect((await svc.getStats(plan.id, 2025))[0].used).toBe(1);
    expect((await svc.getStats(plan.id, 2027))[0].used).toBe(1);
  });

  // Periods well past the year seeded with the plan, so addYear really inserts.
  it('VACAY-SVC-045v: carry-over is computed over the previous period, not the previous calendar year', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });
    testDb.prepare('UPDATE vacay_plans SET carry_over_enabled = 1 WHERE id = ?').run(plan.id);
    testDb.prepare(`
      INSERT OR REPLACE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over)
      VALUES (?, ?, 2030, 10, 0)
    `).run(user.id, plan.id);

    // Two days inside the 2030 period (Jul 2030 – Jun 2031), one of them in 2031.
    await svc.toggleEntry(user.id, plan.id, '2030-09-02', 1, 'vacation');
    await svc.toggleEntry(user.id, plan.id, '2031-02-03', 1, 'vacation');

    await svc.addYear(plan.id, 2031, undefined);

    const row = testDb
      .prepare('SELECT carried_over FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = 2031')
      .get(user.id, plan.id) as { carried_over: number };
    expect(row.carried_over).toBe(8);
  });

  it('VACAY-SVC-045w: comp days are excluded from the carry-over of a shifted period too', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });
    testDb.prepare('UPDATE vacay_plans SET carry_over_enabled = 1 WHERE id = ?').run(plan.id);
    testDb.prepare(`
      INSERT OR REPLACE INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over)
      VALUES (?, ?, 2030, 10, 0)
    `).run(user.id, plan.id);

    await svc.toggleEntry(user.id, plan.id, '2031-02-03', 1, 'comp');

    await svc.addYear(plan.id, 2031, undefined);

    const row = testDb
      .prepare('SELECT carried_over FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = 2031')
      .get(user.id, plan.id) as { carried_over: number };
    expect(row.carried_over).toBe(10);
  });

  it('VACAY-SVC-045x: deleteYear clears the entries of the period, spanning both calendar years', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });
    await svc.addYear(plan.id, 2026, undefined);

    await svc.toggleEntry(user.id, plan.id, '2026-08-10', 1, 'vacation');  // inside
    await svc.toggleEntry(user.id, plan.id, '2027-02-10', 1, 'vacation');  // inside, next calendar year
    await svc.toggleEntry(user.id, plan.id, '2026-06-30', 1, 'vacation');  // previous period, must survive

    await svc.deleteYear(plan.id, 2026, undefined);

    const left = testDb
      .prepare('SELECT date FROM vacay_entries WHERE plan_id = ? ORDER BY date')
      .all(plan.id) as { date: string }[];
    expect(left.map(r => r.date)).toEqual(['2026-06-30']);
  });
});

describe('getEntries over a window (#737)', () => {
  it('VACAY-SVC-045y: returns both calendar halves of a shifted period for the viewer', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    await svc.toggleEntry(user.id, plan.id, '2026-08-10', 1, 'vacation');
    await svc.toggleEntry(user.id, plan.id, '2027-02-10', 1, 'vacation');
    await svc.toggleEntry(user.id, plan.id, '2026-06-30', 1, 'vacation');  // previous period

    const result = await svc.getEntries(plan.id, '2026', user.id);

    expect((result.entries as { date: string }[]).map(e => e.date).sort()).toEqual(['2026-08-10', '2027-02-10']);
  });

  it('VACAY-SVC-045z: without a viewer it stays on the plain calendar year (MCP reads)', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 7 });

    await svc.toggleEntry(user.id, plan.id, '2026-08-10', 1, 'vacation');
    await svc.toggleEntry(user.id, plan.id, '2027-02-10', 1, 'vacation');

    const result = await svc.getEntries(plan.id, '2026');

    expect((result.entries as { date: string }[]).map(e => e.date)).toEqual(['2026-08-10']);
  });

  it('VACAY-SVC-045aa: a start day past the 1st still loads the whole first month, since the grid renders it', async () => {
    const { user, plan } = await setupUserWithPlan();
    await svc.updateYearSettings(user.id, { year_type: 'fiscal', year_start_month: 4, year_start_day: 6 });

    await svc.toggleEntry(user.id, plan.id, '2026-04-02', 1, 'vacation');  // rendered, but counted in the previous period

    expect(((await svc.getEntries(plan.id, '2026', user.id)).entries as unknown[])).toHaveLength(1);
    expect((await svc.getStats(plan.id, 2026))[0].used).toBe(0);
    expect((await svc.getStats(plan.id, 2025))[0].used).toBe(1);
  });
});

// ── applyHolidayCalendars ─────────────────────────────────────────────────────

describe('applyHolidayCalendars', () => {
  it('VACAY-SVC-046: does nothing when holidays_enabled is 0 (fetch is never called)', async () => {
    const { plan } = await setupUserWithPlan();
    // holidays_enabled defaults to 0

    await svc.applyHolidayCalendars(plan.id);

    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('VACAY-SVC-047: deletes matching vacay_entries for a global holiday date returned by the API', async () => {
    const { user, plan } = await setupUserWithPlan();
    const yr = new Date().getFullYear();

    // Enable holidays and add a calendar
    testDb.prepare('UPDATE vacay_plans SET holidays_enabled = 1 WHERE id = ?').run(plan.id);
    await svc.addHolidayCalendar(plan.id, 'DE', null, undefined, 0, undefined);

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
  it('VACAY-SVC-048: inserts a share row and returns no error', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: target } = createUser(testDb);

    const result = await svc.shareCalendar(owner.id, owner.email, target.id);

    expect(result.error).toBeUndefined();
    const row = testDb
      .prepare('SELECT * FROM vacay_shares WHERE owner_id = ? AND user_id = ?')
      .get(owner.id, target.id);
    expect(row).toBeDefined();
  });

  it('VACAY-SVC-049: returns 400 when sharing with yourself', async () => {
    const { user: owner } = await setupUserWithPlan();

    const result = await svc.shareCalendar(owner.id, owner.email, owner.id);

    expect(result).toEqual({ error: 'Cannot share with yourself', status: 400 });
  });

  it('VACAY-SVC-050: returns 404 when the target user does not exist', async () => {
    const { user: owner } = await setupUserWithPlan();

    const result = await svc.shareCalendar(owner.id, owner.email, 99999);

    expect(result).toEqual({ error: 'User not found', status: 404 });
  });

  it('VACAY-SVC-051: returns 400 when the share already exists', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: target } = createUser(testDb);
    await svc.shareCalendar(owner.id, owner.email, target.id);

    const result = await svc.shareCalendar(owner.id, owner.email, target.id);

    expect(result).toEqual({ error: 'Already shared', status: 400 });
  });

  it('VACAY-SVC-052: returns 400 when the target is already a member of the owner plan', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');

    const result = await svc.shareCalendar(owner.id, owner.email, member.id);

    expect(result).toEqual({ error: 'User is already in your calendar', status: 400 });
  });
});

describe('listShares', () => {
  it('VACAY-SVC-053: outgoing rows carry the target user info', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: target } = createUser(testDb);
    await svc.shareCalendar(owner.id, owner.email, target.id);

    const result = await svc.listShares(owner.id);

    expect(result.outgoing).toHaveLength(1);
    expect(result.outgoing[0]).toMatchObject({
      user_id: target.id,
      username: target.username,
    });
    expect(result.outgoing[0]).not.toHaveProperty('email');
    expect(result.incoming).toEqual([]);
  });

  it('VACAY-SVC-054: incoming rows carry the owner info, their color and a boolean hidden flag', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    await svc.setUserColor(owner.id, plan.id, '#ef4444', undefined);
    const { user: viewer } = await setupUserWithPlan();
    await svc.shareCalendar(owner.id, owner.email, viewer.id);

    const result = await svc.listShares(viewer.id);

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

  it('VACAY-SVC-055: remaps colors when two sharing owners sit on the default indigo', async () => {
    const { user: viewer } = await setupUserWithPlan(); // viewer's own color is #6366f1
    const { user: owner1 } = await setupUserWithPlan(); // default #6366f1
    const { user: owner2 } = await setupUserWithPlan(); // default #6366f1
    await svc.shareCalendar(owner1.id, owner1.email, viewer.id);
    await svc.shareCalendar(owner2.id, owner2.email, viewer.id);

    const { incoming } = await svc.listShares(viewer.id);

    expect(incoming).toHaveLength(2);
    // Both collide with the viewer's own indigo, so each gets a distinct free preset
    expect(incoming[0].color).not.toBe('#6366f1');
    expect(incoming[1].color).not.toBe('#6366f1');
    expect(incoming[0].color).not.toBe(incoming[1].color);
  });
});

describe('removeShare', () => {
  it('VACAY-SVC-056: the owner can revoke their share', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = (await svc.listShares(owner.id)).outgoing[0].id as number;

    expect(await svc.removeShare(shareId, owner.id)).toBe(true);
    const row = testDb.prepare('SELECT id FROM vacay_shares WHERE id = ?').get(shareId);
    expect(row).toBeUndefined();
  });

  it('VACAY-SVC-057: the recipient can remove a share they received', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = (await svc.listShares(viewer.id)).incoming[0].id;

    expect(await svc.removeShare(shareId, viewer.id)).toBe(true);
  });

  it('VACAY-SVC-058: a third user cannot remove the share, unknown ids return false', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = (await svc.listShares(owner.id)).outgoing[0].id as number;

    expect(await svc.removeShare(shareId, stranger.id)).toBe(false);
    const row = testDb.prepare('SELECT id FROM vacay_shares WHERE id = ?').get(shareId);
    expect(row).toBeDefined();

    expect(await svc.removeShare(99999, owner.id)).toBe(false);
  });
});

describe('setShareHidden', () => {
  it('VACAY-SVC-059: the recipient can hide and unhide the shared calendar', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = (await svc.listShares(viewer.id)).incoming[0].id;

    expect(await svc.setShareHidden(shareId, viewer.id, true)).toBe(true);
    let row = testDb.prepare('SELECT hidden FROM vacay_shares WHERE id = ?').get(shareId) as { hidden: number };
    expect(row.hidden).toBe(1);
    expect((await svc.listShares(viewer.id)).incoming[0].hidden).toBe(true);

    expect(await svc.setShareHidden(shareId, viewer.id, false)).toBe(true);
    row = testDb.prepare('SELECT hidden FROM vacay_shares WHERE id = ?').get(shareId) as { hidden: number };
    expect(row.hidden).toBe(0);
  });

  it('VACAY-SVC-060: the owner cannot toggle the recipient hidden flag', async () => {
    const { user: owner } = await setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);
    const shareId = (await svc.listShares(owner.id)).outgoing[0].id as number;

    expect(await svc.setShareHidden(shareId, owner.id, true)).toBe(false);
    const row = testDb.prepare('SELECT hidden FROM vacay_shares WHERE id = ?').get(shareId) as { hidden: number };
    expect(row.hidden).toBe(0);
  });
});

describe('getShareAvailableUsers', () => {
  it('VACAY-SVC-061: excludes self, already-shared users and plan members', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');
    const { user: shared } = createUser(testDb);
    await svc.shareCalendar(owner.id, owner.email, shared.id);
    const { user: unrelated } = createUser(testDb);

    const ids = (await svc.getShareAvailableUsers(owner.id) as { id: number }[]).map(u => u.id);

    expect(ids).toContain(unrelated.id);
    expect(ids).not.toContain(owner.id);
    expect(ids).not.toContain(member.id);
    expect(ids).not.toContain(shared.id);
  });
});

describe('getSharedCalendars', () => {
  it('VACAY-SVC-062: returns only the owner entries of the shared plan, including fractions', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: member } = createUser(testDb);
    insertMember(plan.id, member.id, 'accepted');
    const { user: viewer } = await setupUserWithPlan();
    await svc.toggleEntry(owner.id, plan.id, '2025-06-10', 1);
    await svc.toggleEntry(owner.id, plan.id, '2025-06-11', 0.5);
    await svc.toggleEntry(member.id, plan.id, '2025-06-12', 1);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);

    const calendars = await svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars).toHaveLength(1);
    expect(calendars[0].owner_id).toBe(owner.id);
    expect(calendars[0].owner_name).toBe(owner.username);
    expect(calendars[0].hidden).toBe(false);
    expect(calendars[0].entries).toEqual([
      { date: '2025-06-10', fraction: 1, kind: 'vacation' },
      { date: '2025-06-11', fraction: 0.5, kind: 'vacation' },
    ]);
  });

  it('VACAY-SVC-063: company holidays stay hidden while the owner plan has them disabled', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    testDb.prepare('UPDATE vacay_plans SET company_holidays_enabled = 0 WHERE id = ?').run(plan.id);
    await svc.toggleCompanyHoliday(plan.id, '2025-12-24', 'Christmas Eve', undefined);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);

    const calendars = await svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars[0].companyHolidays).toEqual([]);
  });

  it('VACAY-SVC-064: company holidays appear once the owner plan enables them', async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: viewer } = createUser(testDb);
    testDb.prepare('UPDATE vacay_plans SET company_holidays_enabled = 1 WHERE id = ?').run(plan.id);
    await svc.toggleCompanyHoliday(plan.id, '2025-12-24', 'Christmas Eve', undefined);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);

    const calendars = await svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars[0].companyHolidays).toEqual([{ date: '2025-12-24', fraction: 1 }]);
  });

  it('VACAY-SVC-065: an owner without any plan yields empty arrays (no lazy creation)', async () => {
    const { user: owner } = createUser(testDb); // never touched vacay — no plan row
    const { user: viewer } = createUser(testDb);
    testDb.prepare('INSERT INTO vacay_shares (owner_id, user_id) VALUES (?, ?)').run(owner.id, viewer.id);

    const calendars = await svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars).toHaveLength(1);
    expect(calendars[0].entries).toEqual([]);
    expect(calendars[0].companyHolidays).toEqual([]);
    const plan = testDb.prepare('SELECT id FROM vacay_plans WHERE owner_id = ?').get(owner.id);
    expect(plan).toBeUndefined();
  });

  it('VACAY-SVC-066: follows an owner fused into another plan', async () => {
    const { user: host, plan: hostPlan } = await setupUserWithPlan();
    const { user: owner } = createUser(testDb);
    await svc.getOwnPlan(owner.id);
    insertMember(hostPlan.id, owner.id, 'accepted');
    const { user: viewer } = createUser(testDb);
    await svc.toggleEntry(owner.id, hostPlan.id, '2025-03-03', 1);
    await svc.shareCalendar(owner.id, owner.email, viewer.id);

    const calendars = await svc.getSharedCalendars(viewer.id, '2025');

    expect(calendars).toHaveLength(1);
    expect(calendars[0].entries).toEqual([{ date: '2025-03-03', fraction: 1, kind: 'vacation' }]);
  });
});

// ── Quirk fixes (transactions, fetch hygiene, cache TTL, addYear errors) ──────

describe('quirk fixes', () => {
  /** A fresh, fully-functioning VacayService over the same testDb — repository-backed now (Plan 3f Task 5), so a fresh instance no longer needs a `DatabaseService` wrapper, only its own repo set (the holiday-provider cache is instance state, so `applyHolidayCalendars`/`getCountries`/etc.'s TTL tests need a service the earlier tests in this file never touched). */
  async function freshVacayService(): Promise<VacayService> {
    return (await buildVacayServiceWithRepos()).service;
  }

  /**
   * Same repo set `freshVacayService` builds, but returns the repos
   * themselves too, so a caller can `vi.spyOn` one of them before
   * constructing — the repository-backed replacement for the legacy
   * `failingService`'s `DatabaseService.run` SQL-text-match spy (this file's
   * pre-conversion mechanism could match a raw SQL substring; a repository
   * has no raw SQL text left to match, so this spies on the REPOSITORY
   * METHOD that now issues the statement instead).
   */
  async function buildVacayServiceWithRepos() {
    const repos = {
      plans: await createTestVacayPlansRepo(testDb),
      members: await createTestVacayPlanMembersRepo(testDb),
      years: await createTestVacayYearsRepo(testDb),
      userYears: await createTestVacayUserYearsRepo(testDb),
      userColors: await createTestVacayUserColorsRepo(testDb),
      entries: await createTestVacayEntriesRepo(testDb),
      companyHolidays: await createTestVacayCompanyHolidaysRepo(testDb),
      holidayCalendars: await createTestVacayHolidayCalendarsRepo(testDb),
      shares: await createTestVacaySharesRepo(testDb),
      userSettings: await createTestVacayUserSettingsRepo(testDb),
      schoolHolidayRegions: await createTestSchoolHolidayRegionsRepo(testDb),
    };
    const service = new VacayService(
      repos.plans, repos.members, repos.years, repos.userYears, repos.userColors, repos.entries,
      repos.companyHolidays, repos.holidayCalendars, repos.shares, repos.userSettings, repos.schoolHolidayRegions,
      new RealtimeService(), notificationsStub(), await createTestUnitOfWork(testDb),
    );
    return { repos, service };
  }

  /**
   * A VacayService whose one named repository method throws once, for
   * atomicity checks — the `uow.transactional` rollback proof. `match` keeps
   * the three call sites below unchanged (they still name the legacy
   * statement they mean to fail); this maps it onto the repository method
   * that now issues it. `mockImplementationOnce` self-restores after the one
   * throw, so it never leaks into a later test even though `createTestVacay*
   * Repo` memoises one repository instance per entity per `testDb` handle
   * (the same instance `svc`, built once in `beforeAll`, also uses).
   */
  async function failingService(match: string) {
    const { repos, service } = await buildVacayServiceWithRepos();
    if (match === 'INSERT OR IGNORE INTO vacay_user_years') {
      vi.spyOn(repos.userYears, 'insertIgnore').mockImplementationOnce(() => { throw new Error('boom'); });
    } else if (match === 'DELETE FROM vacay_user_years') {
      vi.spyOn(repos.userYears, 'deleteForYear').mockImplementationOnce(() => { throw new Error('boom'); });
    } else {
      throw new Error(`failingService: no repository mapping for match "${match}"`);
    }
    return service;
  }

  it('VACAY-SVC-068: acceptInvite is atomic — a failure mid-flow rolls the status flip back', async () => {
    const { plan } = await setupUserWithPlan();
    const { user: member } = createUser(testDb);
    await svc.getOwnPlan(member.id);
    insertMember(plan.id, member.id, 'pending');

    const broken = await failingService('INSERT OR IGNORE INTO vacay_user_years');
    await expect(broken.acceptInvite(member.id, plan.id, undefined)).rejects.toThrow('boom');

    const row = testDb.prepare('SELECT status FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?').get(plan.id, member.id) as { status: string };
    expect(row.status).toBe('pending');
  });

  it('VACAY-SVC-069: deleteYear is atomic — a failure mid-flow keeps the year and its entries', async () => {
    const { user, plan } = await setupUserWithPlan();
    const year = new Date().getFullYear();
    allowWeekends(plan.id);
    await svc.toggleEntry(user.id, plan.id, `${year}-03-03`, 1);

    const broken = await failingService('DELETE FROM vacay_user_years');
    await expect(broken.deleteYear(plan.id, year, undefined)).rejects.toThrow('boom');

    expect(testDb.prepare('SELECT id FROM vacay_years WHERE plan_id = ? AND year = ?').get(plan.id, year)).toBeDefined();
    expect(testDb.prepare('SELECT id FROM vacay_entries WHERE plan_id = ?').get(plan.id)).toBeDefined();
  });

  it('VACAY-SVC-070: getCountries surfaces an upstream non-2xx as the fetch error and caches nothing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await freshVacayService();

    expect(await fresh.getCountries()).toEqual({ error: 'Failed to fetch countries' });
    // Nothing cached: a retry hits the network again.
    expect(await fresh.getCountries()).toEqual({ error: 'Failed to fetch countries' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('VACAY-SVC-070a: getHolidays refuses a year or country that is not a plain code', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await freshVacayService();

    for (const [year, country] of [['../../..', 'DE'], ['2026', 'DE/../../x'], ['20xx', 'DE'], ['2026', 'DEU']]) {
      expect(await fresh.getHolidays(year, country)).toEqual({ error: 'Failed to fetch holidays' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('VACAY-SVC-070b: getSchoolHolidayRegions refuses a country that is not an alpha-2 code', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await freshVacayService();

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
    const fresh = await freshVacayService();

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
    const fresh = await freshVacayService();

    expect(await fresh.getHolidays('2026', 'DE')).toEqual({ error: 'Failed to fetch holidays' });
    expect(await fresh.getCountries()).toEqual({ error: 'Failed to fetch countries' });
  });

  it('VACAY-SVC-071: applyHolidayCalendars honors the cache TTL', async () => {
    const { plan } = await setupUserWithPlan();
    testDb.prepare('UPDATE vacay_plans SET holidays_enabled = 1 WHERE id = ?').run(plan.id);
    testDb.prepare("INSERT INTO vacay_holiday_calendars (plan_id, region) VALUES (?, 'DE')").run(plan.id);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    const fresh = await freshVacayService();

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

  it('VACAY-SVC-072: addYear still no-ops on a duplicate year but propagates real errors', async () => {
    const { plan } = await setupUserWithPlan();
    const year = new Date().getFullYear();
    // Duplicate: the seeded current year — silently returns the list, like before.
    expect(await svc.addYear(plan.id, year, undefined)).toContain(year);

    const broken = await failingService('INSERT OR IGNORE INTO vacay_user_years');
    await expect(broken.addYear(plan.id, year + 1, undefined)).rejects.toThrow('boom');
    // And atomically: the failed year was not half-added.
    expect(testDb.prepare('SELECT id FROM vacay_years WHERE plan_id = ? AND year = ?').get(plan.id, year + 1)).toBeUndefined();
  });
});
