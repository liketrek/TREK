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
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { db as testDb } from '../../src/db/database';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronRegistrarService } from '../../src/nest/scheduling/cron-registrar.service';
import { buildApp } from '../../src/bootstrap';

describe('SCHED-GATE — the harness boots without scheduling anything', () => {
  let app: INestApplication;

  beforeAll(async () => {
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
