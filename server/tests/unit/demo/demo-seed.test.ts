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
import { seedDemoData } from '../../../src/demo/demo-seed';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestOrm } from '../../helpers/test-orm';

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
    const count = (table: string): number =>
      (db.prepare(`SELECT COUNT(*) as n FROM ${table}`).get() as { n: number }).n;
    expect(count('users')).toBe(2); // admin + demo
    expect(count('trips')).toBe(3);
    expect(count('days')).toBe(16);
    expect(count('places')).toBe(32);
    expect(count('day_assignments')).toBe(13 + 9 + 11); // per-day assignment counts, trip 1/2/3
    expect(count('packing_items')).toBe(10 + 6 + 8);
    expect(count('budget_items')).toBe(6 + 4 + 5);
    expect(count('reservations')).toBe(2 + 1 + 3);
    expect(count('day_notes')).toBe(4 + 2 + 3);
    expect(count('trip_members')).toBe(3);
    expect(count('app_settings')).toBeGreaterThanOrEqual(1);

    const allowRegistration = db.prepare("SELECT value FROM app_settings WHERE key = 'allow_registration'").get() as
      { value: string } | undefined;
    expect(allowRegistration?.value).toBe('false');

    const admin = db.prepare('SELECT username, email, role FROM users WHERE id = ?').get(adminId) as {
      username: string;
      email: string;
      role: string;
    };
    expect(admin.role).toBe('admin');
    const demoUser = db.prepare('SELECT username, email, role FROM users WHERE id = ?').get(demoId) as {
      username: string;
      email: string;
      role: string;
    };
    expect(demoUser).toEqual({ username: 'demo', email: 'demo@trek.app', role: 'user' });

    const tripTitles = (db.prepare('SELECT title FROM trips ORDER BY id').all() as { title: string }[]).map(
      (r) => r.title,
    );
    expect(tripTitles).toEqual(['Tokyo & Kyoto', 'Barcelona Long Weekend', 'New York City']);

    // reservation_time carries the full date (#1934), never a bare clock time.
    const reservationTimes = (
      db.prepare('SELECT reservation_time FROM reservations ORDER BY id').all() as { reservation_time: string }[]
    ).map((r) => r.reservation_time);
    for (const t of reservationTimes) expect(t).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
