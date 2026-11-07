/**
 * ServiceKeyJob: one check a few minutes after startup and one daily check
 * through the registrar, at a minute and hour of its own, and nothing at all
 * where the registrar schedules nothing (NODE_ENV=test).
 */
import { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import {
  FIRST_CHECK_MAX_MS,
  FIRST_CHECK_MIN_MS,
  ServiceKeyJob,
} from '../../../../src/nest/service-identity/service-key.job';
import { ServiceKeyService } from '../../../../src/nest/service-identity/service-key.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const registrar = { isEnabled: vi.fn(() => true), register: vi.fn() };
const keys = { settle: vi.fn(async (): Promise<void> => undefined) };

const testDb = createSnapshotTestDb();
let t: TestModule;

beforeAll(async () => {
  t = await createTestModule({
    db: testDb,
    imports: [],
    providers: [
      ServiceKeyJob,
      { provide: CronRegistrarService, useValue: registrar },
      { provide: ServiceKeyService, useValue: keys },
    ],
  });
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

beforeEach(() => vi.clearAllMocks());

afterEach(() => {
  t.get(ServiceKeyJob).onApplicationShutdown();
  vi.useRealTimers();
});

describe('ServiceKeyJob', () => {
  it('SIJOB-001: registers a daily check at a minute and hour of its own, which registers or renews', async () => {
    t.get(ServiceKeyJob).onApplicationBootstrap();
    expect(registrar.register).toHaveBeenCalledTimes(1);
    const [name, expression, tick] = registrar.register.mock.calls[0] as [string, string, () => Promise<void>];
    expect(name).toBe('service-key-renewal');
    const [minute, hour, ...rest] = expression.split(' ');
    expect(Number(minute)).toBeGreaterThanOrEqual(0);
    expect(Number(minute)).toBeLessThan(60);
    expect(Number(hour)).toBeLessThan(24);
    expect(rest).toEqual(['*', '*', '*']);
    await tick();
    expect(keys.settle).toHaveBeenCalledTimes(1);
  });

  it('SIJOB-002: schedules nothing where the registrar is off, not even the first check', () => {
    vi.useFakeTimers();
    registrar.isEnabled.mockReturnValueOnce(false);
    t.get(ServiceKeyJob).onApplicationBootstrap();
    vi.advanceTimersByTime(FIRST_CHECK_MAX_MS);
    expect(registrar.register).not.toHaveBeenCalled();
    expect(keys.settle).not.toHaveBeenCalled();
  });

  it('SIJOB-003: checks the key once within minutes of startup, so nobody has to search first', () => {
    vi.useFakeTimers();
    t.get(ServiceKeyJob).onApplicationBootstrap();
    vi.advanceTimersByTime(FIRST_CHECK_MIN_MS - 1);
    expect(keys.settle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(FIRST_CHECK_MAX_MS - FIRST_CHECK_MIN_MS + 1);
    expect(keys.settle).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(FIRST_CHECK_MAX_MS);
    expect(keys.settle).toHaveBeenCalledTimes(1);
  });

  it('SIJOB-004: a failed first check is left to the key service, and shutdown cancels a pending one', async () => {
    vi.useFakeTimers();
    keys.settle.mockRejectedValueOnce(new Error('fetch failed'));
    t.get(ServiceKeyJob).onApplicationBootstrap();
    vi.advanceTimersByTime(FIRST_CHECK_MAX_MS);
    await Promise.resolve();
    expect(keys.settle).toHaveBeenCalledTimes(1);

    t.get(ServiceKeyJob).onApplicationBootstrap();
    t.get(ServiceKeyJob).onApplicationShutdown();
    vi.advanceTimersByTime(FIRST_CHECK_MAX_MS);
    expect(keys.settle).toHaveBeenCalledTimes(1);
  });
});
