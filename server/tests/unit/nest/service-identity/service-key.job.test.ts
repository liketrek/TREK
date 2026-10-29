/**
 * ServiceKeyJob: one daily renewal check through the registrar, at a minute
 * and hour of its own, and nothing at all where the registrar schedules
 * nothing (NODE_ENV=test).
 */
import { CronRegistrarService } from '../../../../src/nest/scheduling/cron-registrar.service';
import { ServiceKeyJob } from '../../../../src/nest/service-identity/service-key.job';
import { ServiceKeyService } from '../../../../src/nest/service-identity/service-key.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../../helpers/test-module';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const registrar = { isEnabled: vi.fn(() => true), register: vi.fn() };
const keys = { renewIfDue: vi.fn(async () => undefined) };

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

describe('ServiceKeyJob', () => {
  it('SIJOB-001: registers a daily check at a minute and hour of its own, which renews when due', async () => {
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
    expect(keys.renewIfDue).toHaveBeenCalledTimes(1);
  });

  it('SIJOB-002: schedules nothing where the registrar is off', () => {
    registrar.isEnabled.mockReturnValueOnce(false);
    t.get(ServiceKeyJob).onApplicationBootstrap();
    expect(registrar.register).not.toHaveBeenCalled();
  });
});
