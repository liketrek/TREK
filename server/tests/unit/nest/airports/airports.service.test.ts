/**
 * AirportsService boot backfill (task-6-rereview.md M1 — the exact C1 shape
 * task-6-review-parity.md found elsewhere: `onApplicationBootstrap` used to
 * `await this.backfillFlightEndpoints()` directly, outside any request
 * context. Raw SQL only today (harmless now), but the wrap belongs at the
 * entrypoint — the same reasoning `place-photo-cache.job.ts`/
 * `trek-photo-cache.job.ts` already carry for their own raw-SQL sweeps — so
 * it stays safe if this dependency graph goes repository-backed later, and so
 * every one-off boot sweep in the tree goes through the one choke point).
 */
import type { ReservationEndpointsRepository } from '../../../../src/db/repositories/ReservationEndpoints.repository';
import type { ReservationsRepository } from '../../../../src/db/repositories/Reservations.repository';
import { AirportsService } from '../../../../src/nest/airports/airports.service';
import type { RuntimeEnvService } from '../../../../src/nest/app-config/runtime-env.service';
import { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createTestReservationsRepo, createTestReservationEndpointsRepo } from '../../../helpers/test-uow';
import { SchedulerRegistry } from '@nestjs/schedule';

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

const logMock = vi.hoisted(() => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));
vi.mock('../../../../src/nest/audit/audit-log.logger', () => logMock);

const testDb = createSnapshotTestDb();
let t: TestOrm;
let reservationsRepo: ReservationsRepository;
let endpointsRepo: ReservationEndpointsRepository;

beforeAll(async () => {
  // Global context disallowed — the production setting — so this genuinely
  // proves the boot backfill runs (or doesn't) inside a request context,
  // rather than happening to work because the test default allows it.
  t = await createTestOrm(testDb, { allowGlobalContext: false });
  reservationsRepo = await createTestReservationsRepo(testDb);
  endpointsRepo = await createTestReservationEndpointsRepo(testDb);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});
beforeEach(() => vi.clearAllMocks());

describe('AirportsService boot backfill', () => {
  it('AIRPORTS-SVC-001: onApplicationBootstrap delegates the boot-time backfill through CronRegistrarService.runOnBoot, not a direct await', async () => {
    const registered: Array<[string, () => void | Promise<void>]> = [];
    const registrar = {
      isEnabled: vi.fn(() => true),
      register: vi.fn(() => true),
      unregister: vi.fn(),
      runOnBoot: vi.fn(async (name: string, fn: () => void | Promise<void>) => {
        registered.push([name, fn]);
        await fn();
      }),
    };
    const svc = new AirportsService(reservationsRepo, endpointsRepo, registrar as unknown as CronRegistrarService);
    const backfillSpy = vi.spyOn(svc, 'backfillFlightEndpoints').mockResolvedValue(undefined);
    await svc.onApplicationBootstrap();
    expect(registrar.runOnBoot).toHaveBeenCalledWith('airports-flight-endpoints-boot', expect.any(Function));
    expect(backfillSpy).toHaveBeenCalledTimes(1);
  });

  it('AIRPORTS-SVC-002: with MikroORM wired into the registrar, the boot-time backfill actually runs — no cannotUseGlobalContext, nothing swallowed', async () => {
    const registrar = new CronRegistrarService(
      new SchedulerRegistry(),
      { isTest: () => false } as RuntimeEnvService,
      t.orm,
    );
    const svc = new AirportsService(reservationsRepo, endpointsRepo, registrar);
    const backfillSpy = vi.spyOn(svc, 'backfillFlightEndpoints');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await svc.onApplicationBootstrap();
      expect(backfillSpy).toHaveBeenCalledTimes(1);
      expect(errSpy).not.toHaveBeenCalled();
      expect(logMock.logError).not.toHaveBeenCalled();
    } finally {
      errSpy.mockRestore();
    }
  });

  it('AIRPORTS-SVC-003: without MikroORM, the boot-time backfill never runs at all — logged with runOnBoot\'s own distinct message, never swallowed into "[DB] Flight endpoint backfill failed"', async () => {
    const registrar = new CronRegistrarService(new SchedulerRegistry(), { isTest: () => false } as RuntimeEnvService); // no orm
    const svc = new AirportsService(reservationsRepo, endpointsRepo, registrar);
    const backfillSpy = vi.spyOn(svc, 'backfillFlightEndpoints');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await svc.onApplicationBootstrap();
      expect(backfillSpy).not.toHaveBeenCalled();
      expect(logMock.logError).toHaveBeenCalledWith(
        expect.stringMatching(/runOnBoot: no MikroORM available.*airports-flight-endpoints-boot/),
      );
      expect(errSpy).not.toHaveBeenCalled();
    } finally {
      errSpy.mockRestore();
    }
  });

  it('AIRPORTS-SVC-004 (task-6-rereview2.md M3): a rejecting runOnBoot (the context machinery itself, not the backfill body) resolves onApplicationBootstrap instead of aborting app.init()', async () => {
    const registrar = {
      isEnabled: vi.fn(() => true),
      register: vi.fn(() => true),
      unregister: vi.fn(),
      runOnBoot: vi.fn(async () => {
        throw new Error('RequestContext.create blew up');
      }),
    };
    const svc = new AirportsService(reservationsRepo, endpointsRepo, registrar as unknown as CronRegistrarService);
    const backfillSpy = vi.spyOn(svc, 'backfillFlightEndpoints');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(svc.onApplicationBootstrap()).resolves.toBeUndefined();
      expect(backfillSpy).not.toHaveBeenCalled();
      expect(errSpy).toHaveBeenCalledWith('[DB] Flight endpoint backfill failed:', expect.any(Error));
    } finally {
      errSpy.mockRestore();
    }
  });
});
