/**
 * Demo mode boot seeding.
 *
 * DEMO_MODE=true creates a role=admin account on first boot. When
 * DEMO_ADMIN_PASS is unset that account gets the password published in
 * demo-seed itself, so the seeder has to say so out loud.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createTestDb } from '../../helpers/test-db';

// Baseline handling is demo-reset's job and touches the file system.
vi.mock('../../../src/demo/demo-reset', () => ({
  saveBaseline: vi.fn(),
  hasBaseline: vi.fn(() => true),
  resetDemoUser: vi.fn(),
}));

import { seedDemoData } from '../../../src/demo/demo-seed';

describe('demo seeding', () => {
  let db: Database.Database;
  const realPass = process.env.DEMO_ADMIN_PASS;

  beforeEach(() => {
    db = createTestDb();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    db.close();
    if (realPass === undefined) delete process.env.DEMO_ADMIN_PASS;
    else process.env.DEMO_ADMIN_PASS = realPass;
  });

  it('DEMOSEED-001: warns when the admin account is created with the default password', () => {
    delete process.env.DEMO_ADMIN_PASS;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    seedDemoData(db);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('DEMO_ADMIN_PASS is not set'));
  });

  it('DEMOSEED-002: stays quiet when the operator set DEMO_ADMIN_PASS', () => {
    process.env.DEMO_ADMIN_PASS = 'a-real-password';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    seedDemoData(db);

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('DEMO_ADMIN_PASS is not set'));
  });

  it('DEMOSEED-003: does not warn again once the admin account exists', () => {
    delete process.env.DEMO_ADMIN_PASS;
    seedDemoData(db);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    seedDemoData(db);

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('DEMO_ADMIN_PASS is not set'));
  });
});
