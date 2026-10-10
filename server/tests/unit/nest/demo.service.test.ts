/**
 * `DemoService.isDemoUserId` — Plan 3i Task 3's conversion of
 * `common/demo-write.ts#isDemoUserId(env, db, userId)` onto an injected
 * class resolving `env`/the repository via its own constructor.
 */
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { DemoService } from '../../../src/nest/common/demo.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let demo: DemoService;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  demo = new DemoService(new RuntimeEnvService(), t.em);
});

afterEach(() => {
  delete process.env.DEMO_MODE;
  resetTestDb(testDb);
  t.clear();
});

describe('DemoService.isDemoUserId', () => {
  it('DEMOSVC-001: false outright when the instance is not in demo mode, even for the demo account', async () => {
    const { user } = createUser(testDb, { email: 'demo@trek.app' });
    await expect(demo.isDemoUserId(user.id)).resolves.toBe(false);
  });

  it('DEMOSVC-002: true for the demo account while the instance runs in demo mode', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@trek.app' });
    await expect(demo.isDemoUserId(user.id)).resolves.toBe(true);
  });

  it('DEMOSVC-003: false for an ordinary account even in demo mode — SELECT email FROM users WHERE id = ?, not a blanket refusal', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'alice@example.com' });
    await expect(demo.isDemoUserId(user.id)).resolves.toBe(false);
  });

  it('DEMOSVC-004: also true for the historical demo@nomad.app identifier', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await expect(demo.isDemoUserId(user.id)).resolves.toBe(true);
  });

  it('DEMOSVC-005: a non-existent user id resolves false rather than throwing', async () => {
    process.env.DEMO_MODE = 'true';
    await expect(demo.isDemoUserId(999999)).resolves.toBe(false);
  });
});
