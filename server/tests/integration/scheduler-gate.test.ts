/**
 * SCHED-GATE — the no-timers-in-the-harness regression test. buildApp() is
 * shared with every integration/e2e suite, and job providers register their
 * crons from onApplicationBootstrap, which app.init() fires on every boot.
 * This proves the CronRegistrarService NODE_ENV=test gate holds: a full
 * harness boot registers zero cron jobs, intervals or timeouts, and closing
 * the app leaves nothing behind. If this ever goes red, some job bypassed the
 * registrar (or used a @Cron decorator) and every suite is now running real
 * timers.
 */
import { buildApp } from '../../src/bootstrap';
import { runMigrations } from '../../src/db/migrations';
import { createTables } from '../../src/db/schema';
import { CronRegistrarService } from '../../src/nest/scheduling/cron-registrar.service';
import type { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

describe('SCHED-GATE — the harness boots without scheduling anything', () => {
  let app: INestApplication;

  beforeAll(async () => {
    createTables(testDb);
    runMigrations(testDb);
    app = await buildApp();
  });

  afterAll(() => {
    testDb.close();
  });

  it('SCHED-GATE-001 — the registrar reports the test gate closed', () => {
    expect(app.get(CronRegistrarService).isEnabled()).toBe(false);
  });

  it('SCHED-GATE-002 — a full app boot registers zero cron jobs, intervals and timeouts', () => {
    const registry = app.get(SchedulerRegistry);
    expect(registry.getCronJobs().size).toBe(0);
    expect(registry.getIntervals()).toHaveLength(0);
    expect(registry.getTimeouts()).toHaveLength(0);
    expect(app.get(CronRegistrarService).jobCount).toBe(0);
  });

  it('SCHED-GATE-003 — app.close() leaves the registrar empty (shutdown parity)', async () => {
    const registrar = app.get(CronRegistrarService);
    await app.close();
    expect(registrar.jobCount).toBe(0);
  });
});
