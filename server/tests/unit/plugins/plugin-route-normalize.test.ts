/**
 * SV4 (R-survivors) — `declaredProfiles`, Plan 3j Task 3's conversion of the one
 * literal `SELECT capabilities FROM plugins WHERE id = ?` backing all three
 * external callers (`roadtrip-router.service.ts`'s RRT1/RRT2,
 * `plugin-routes.controller.ts`), now via `PluginsRepository#findCapabilities`
 * (PR52/PR53 — the same method `plugin-runtime.service.ts`'s
 * `capabilityList`/`mcpToolCapabilities` use for the same column).
 */
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import type { PluginsRepository } from '../../../src/db/repositories/Plugins.repository';
import { declaredProfiles } from '../../../src/nest/plugins/contributions/plugin-route-normalize';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { insertRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let plugins: PluginsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  plugins = t.repo(Plugins);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function seedPlugin(id: string, capabilities: unknown): Promise<void> {
  await insertRow(t, Plugins, { id, name: id, capabilities: JSON.stringify(capabilities) });
}

describe('declaredProfiles', () => {
  it('RN-001: returns the declared routeProfiles ids, filtered to the safe id pattern', async () => {
    await seedPlugin('roadtrip-plugin', {
      routeProfiles: [{ id: 'eco' }, { id: 'fast-ev' }, { id: 'BAD ID' }, { id: '' }],
    });
    expect(await declaredProfiles(plugins, 'roadtrip-plugin')).toEqual(['eco', 'fast-ev']);
  });

  it('RN-002: no routeProfiles capability → empty list', async () => {
    await seedPlugin('no-routes', { widget: { slot: 'sidebar' } });
    expect(await declaredProfiles(plugins, 'no-routes')).toEqual([]);
  });

  it('RN-003: a missing plugin row → empty list, never throws', async () => {
    expect(await declaredProfiles(plugins, 'does-not-exist')).toEqual([]);
  });

  it('RN-004: malformed capabilities JSON → empty list, never throws', async () => {
    await insertRow(t, Plugins, { id: 'bad-json', name: 'bad-json', capabilities: 'not json' });
    expect(await declaredProfiles(plugins, 'bad-json')).toEqual([]);
  });
});
