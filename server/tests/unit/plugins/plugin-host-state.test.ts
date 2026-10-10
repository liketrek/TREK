/**
 * HS1 (`plugin-host-state.ts#budgetFor`'s seed read) — Plan 3j Task 3. Converted
 * from a raw `better-sqlite3` connection to `PluginCapabilityAuditRepository`;
 * this covers the seed's grouping (ai.complete + ai.extract vs notify.send),
 * the UTC-day floor, and the `code = 'ok'` filter (a denied call never counts
 * against the budget).
 */
import { PluginCapabilityAudit } from '../../../src/db/entities/PluginCapabilityAudit.entity';
import type { PluginCapabilityAuditRepository } from '../../../src/db/repositories/PluginCapabilityAudit.repository';
import { appendAudit } from '../../../src/nest/plugins/host/plugin-audit';
import { budgetFor, pluginBudgetUsage } from '../../../src/nest/plugins/host/plugin-host-state';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { updateRows } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let audit: PluginCapabilityAuditRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  audit = t.repo(PluginCapabilityAudit);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

// `budgetFor`'s `budgets` Map is deliberately module-level (see plugin-host-state.ts's
// class docstring) — it is NOT reset by `resetTestDb`/`t.clear()`, so each test below
// uses its own plugin id to avoid one test's seed being served (cached) to the next.
describe('budgetFor / pluginBudgetUsage seed read', () => {
  it("HS-001: seeds ai (ai.complete + ai.extract) and notify counts separately from today's already-audited rows", async () => {
    await appendAudit(audit, { pluginId: 'hs1', actingUserId: 1, method: 'ai.complete', resource: null, code: 'ok' });
    await appendAudit(audit, { pluginId: 'hs1', actingUserId: 1, method: 'ai.extract', resource: null, code: 'ok' });
    await appendAudit(audit, { pluginId: 'hs1', actingUserId: 1, method: 'notify.send', resource: null, code: 'ok' });
    // A denied call must not count against the budget.
    await appendAudit(audit, {
      pluginId: 'hs1',
      actingUserId: 1,
      method: 'ai.complete',
      resource: null,
      code: 'RESOURCE_FORBIDDEN',
    });
    // A different plugin's calls must not bleed into this one's budget.
    await appendAudit(audit, {
      pluginId: 'hs1-other',
      actingUserId: 1,
      method: 'ai.complete',
      resource: null,
      code: 'ok',
    });

    const usage = await pluginBudgetUsage('hs1', audit);
    expect(usage.ai).toBe(2);
    expect(usage.notify).toBe(1);
  });

  it('HS-002: seeded only once per plugin per process lifetime — a later append is NOT re-counted on a second read', async () => {
    await appendAudit(audit, { pluginId: 'hs2', actingUserId: 1, method: 'ai.complete', resource: null, code: 'ok' });
    const first = await budgetFor('hs2', audit);
    expect(first.used(Date.now()).ai).toBe(1);
    // A direct .take() call (what a real dispatch does) advances the in-memory
    // counter; the seed read itself is not re-run.
    await appendAudit(audit, { pluginId: 'hs2', actingUserId: 1, method: 'ai.complete', resource: null, code: 'ok' });
    const second = await budgetFor('hs2', audit);
    expect(second).toBe(first); // same cached DailyBudget instance — no re-seed
    expect(second.used(Date.now()).ai).toBe(1); // still 1: the second append was never taken through the budget
  });

  it("HS-003: ignores yesterday's rows — only today's UTC window seeds the count", async () => {
    await appendAudit(audit, { pluginId: 'hs3', actingUserId: 1, method: 'ai.complete', resource: null, code: 'ok' });
    // Backdate the row to yesterday, bypassing the repository (simulating a
    // real prior day's audit history already on disk).
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await updateRows(t, PluginCapabilityAudit, { plugin_id: 'hs3' }, { ts: yesterday });

    const usage = await pluginBudgetUsage('hs3', audit);
    expect(usage.ai).toBe(0);
  });
});
