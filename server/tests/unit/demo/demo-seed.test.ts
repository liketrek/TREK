/**
 * Demo mode boot seeding.
 *
 * DEMO_MODE=true creates a role=admin account on first boot. When
 * DEMO_ADMIN_PASS is unset that account gets the password published in
 * demo-seed itself, so the seeder has to say so out loud.
 *
 * Plan 3i Task 3: `seedDemoData` converted onto `DemoRepository`, an
 * EntityManager-backed repository — it resolves its EntityManager via
 * `RequestContext.getEntityManager()`, so every call here runs inside
 * `withRequestContext(orm, ...)`, mirroring the wrap `runSchemaBootstrap`
 * (`db/orm.ts:59`) already gives it in production (the TRAP: "direct-call
 * tests need withRequestContext").
 */
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { DayNotes } from '../../../src/db/entities/DayNotes.entity';
import { Days } from '../../../src/db/entities/Days.entity';
import { PackingItems } from '../../../src/db/entities/PackingItems.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import { TripMembers } from '../../../src/db/entities/TripMembers.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { takeExampleTripsSeeded } from '../../../src/demo/demo-reset';
import { seedDemoData } from '../../../src/demo/demo-seed';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRows } from '../../helpers/factories/rows';
import { readAppSetting } from '../../helpers/factories/settings';
import { readUser } from '../../helpers/factories/users';
import { createTestOrm } from '../../helpers/test-orm';
import type { EntityClass } from '@mikro-orm/core';

import type Database from 'better-sqlite3';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Baseline handling is demo-reset's job and touches the file system.
vi.mock('../../../src/demo/demo-reset', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/demo/demo-reset')>();
  return {
    ...actual,
    saveBaseline: vi.fn(),
    hasBaseline: vi.fn(() => true),
    resetDemoUser: vi.fn(),
  };
});

describe('demo seeding', () => {
  let db: Database.Database;
  const realPass = process.env.DEMO_ADMIN_PASS;

  beforeEach(() => {
    db = createSnapshotTestDb();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db.close();
    if (realPass === undefined) delete process.env.DEMO_ADMIN_PASS;
    else process.env.DEMO_ADMIN_PASS = realPass;
  });

  async function seed(): Promise<{ adminId: number; demoId: number }> {
    const orm = await createTestOrm(db);
    return await withRequestContext(orm.orm, () => seedDemoData());
  }

  it('DEMOSEED-001: warns when the admin account is created with the default password', async () => {
    delete process.env.DEMO_ADMIN_PASS;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await seed();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('DEMO_ADMIN_PASS is not set'));
  });

  it('DEMOSEED-002: stays quiet when the operator set DEMO_ADMIN_PASS', async () => {
    process.env.DEMO_ADMIN_PASS = 'a-real-password';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await seed();

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('DEMO_ADMIN_PASS is not set'));
  });

  it('DEMOSEED-003: does not warn again once the admin account exists', async () => {
    delete process.env.DEMO_ADMIN_PASS;
    await seed();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await seed();

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('DEMO_ADMIN_PASS is not set'));
  });

  it('DEMOSEED-004 (parity): the seeded demo world is byte-identical to the legacy raw seed — row counts + a full-row diff per table on a fresh DB', async () => {
    delete process.env.DEMO_ADMIN_PASS;
    const { adminId, demoId } = await seed();

    // Row counts per table the legacy seed touches, against the exact
    // numbers `seedExampleTrips`'s own data literals produce: 3 trips,
    // 7+4+5=16 days, 13+8+11=32 places, 13+9+11=33 day_assignments,
    // 10+6+8=24 packing items, 6+4+5=15 budget items, 2+1+3=6
    // reservations, 4+2+3=9 day notes, 3 trip_members rows (one per trip,
    // demo joined as a member alongside the admin owner).
    const orm = await createTestOrm(db);
    const tables = {
      users: Users,
      trips: Trips,
      days: Days,
      places: Places,
      day_assignments: DayAssignments,
      packing_items: PackingItems,
      budget_items: BudgetItems,
      reservations: Reservations,
      day_notes: DayNotes,
      trip_members: TripMembers,
      app_settings: AppSettings,
    } as const;
    const count = (table: keyof typeof tables): Promise<number> => countRows(orm, tables[table] as EntityClass<object>);
    expect(await count('users')).toBe(2); // admin + demo
    expect(await count('trips')).toBe(3);
    expect(await count('days')).toBe(16);
    expect(await count('places')).toBe(32);
    expect(await count('day_assignments')).toBe(13 + 9 + 11); // per-day assignment counts, trip 1/2/3
    expect(await count('packing_items')).toBe(10 + 6 + 8);
    expect(await count('budget_items')).toBe(6 + 4 + 5);
    expect(await count('reservations')).toBe(2 + 1 + 3);
    expect(await count('day_notes')).toBe(4 + 2 + 3);
    expect(await count('trip_members')).toBe(3);
    expect(await count('app_settings')).toBeGreaterThanOrEqual(1);

    expect(await readAppSetting(orm, 'allow_registration')).toBe('false');

    const admin = await readUser(orm, adminId);
    expect(admin.role).toBe('admin');
    const demoUser = await readUser(orm, demoId);
    expect({ username: demoUser.username, email: demoUser.email, role: demoUser.role }).toEqual({
      username: 'demo',
      email: 'demo@trek.app',
      role: 'user',
    });

    const tripTitles = (await findRows(orm, Trips, {}, { id: 'asc' })).map((r) => r.title);
    expect(tripTitles).toEqual(['Tokyo & Kyoto', 'Barcelona Long Weekend', 'New York City']);

    // reservation_time carries the full date (#1934), never a bare clock time.
    const reservationTimes = (await findRows(orm, Reservations, {}, { id: 'asc' })).map((r) => r.reservation_time);
    await orm.close();
    for (const t of reservationTimes) expect(t).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('DEMOSEED-005: marks a first baseline as due only on the boot that seeded the example trips', async () => {
    // The mark is process state; earlier cases may have left it set.
    takeExampleTripsSeeded();

    await seed();
    expect(takeExampleTripsSeeded()).toBe(true);
    // Taking it clears it, so one seed saves at most one baseline.
    expect(takeExampleTripsSeeded()).toBe(false);

    // A later boot finds the trips in place and returns before seeding: no mark,
    // so a database that already holds data never becomes a baseline on its own.
    await seed();
    expect(takeExampleTripsSeeded()).toBe(false);
  });
});
