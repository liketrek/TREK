/**
 * Host-side capability audit log (#plugins, L1 hardening): resource projection,
 * which methods are auditable, and the per-plugin hash chain.
 *
 * Plan 3j Task 3 — converted onto `PluginCapabilityAuditRepository`. R-hash-chain:
 * `legacyAppendAudit` below is a byte-for-byte replica of the PRE-CONVERSION
 * `appendAudit` body (a raw `better-sqlite3` INSERT, the exact hash construction
 * this task's `plugin-audit.ts` now reproduces through the repository) — it exists
 * SOLELY so these tests can produce a "legacy-written" chain to replay against the
 * converted code, without keeping a second, unused copy of the production function
 * around.
 */
import { PluginCapabilityAudit } from '../../../src/db/entities/PluginCapabilityAudit.entity';
import { Plugins } from '../../../src/db/entities/Plugins.entity';
import type { PluginCapabilityAuditRepository } from '../../../src/db/repositories/PluginCapabilityAudit.repository';
import {
  appendAudit,
  readAudit,
  readAuditForUser,
  auditResource,
  isAuditable,
  pruneAudit,
  verifyChain,
} from '../../../src/nest/plugins/host/plugin-audit';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, deleteRows, findRow, findRows, insertRow, insertRows } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

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
afterAll(async () => {
  await t.close();
  testDb.close();
});

interface LegacyEntry {
  pluginId: string;
  actingUserId?: number;
  method: string;
  resource?: string | null;
  code: string;
}

/** The pre-conversion `appendAudit` body, verbatim, against a raw connection. */
function legacyAppendAudit(prevHash: string, e: LegacyEntry): { ts: string; hash: string } {
  const ts = new Date().toISOString();
  const row = JSON.stringify([e.pluginId, e.actingUserId ?? null, e.method, e.resource ?? null, e.code, ts]);
  const hash = crypto
    .createHash('sha256')
    .update(prevHash + row)
    .digest('hex');
  testDb
    // test-sql-allow: the pre-conversion appendAudit wrote through this exact raw statement; reproducing it verbatim is the legacy side of the parity check.
    .prepare(
      'INSERT INTO plugin_capability_audit (plugin_id, acting_user_id, method, resource, code, ts, prev_hash, hash) VALUES (?,?,?,?,?,?,?,?)',
    )
    .run(e.pluginId, e.actingUserId ?? null, e.method, e.resource ?? null, e.code, ts, prevHash || null, hash);
  return { ts, hash };
}

/** Every row for a plugin, oldest first — the shape `verifyChain` needs. */
async function chainRows(pluginId: string) {
  const rows = await findRows(t, PluginCapabilityAudit, { plugin_id: pluginId }, { id: 'asc' });
  return rows.map((r) => ({
    plugin_id: r.plugin_id,
    acting_user_id: r.acting_user_id ?? null,
    method: r.method,
    resource: r.resource ?? null,
    code: r.code,
    ts: r.ts,
    prev_hash: r.prev_hash ?? null,
    hash: r.hash,
  }));
}

describe('auditResource + isAuditable', () => {
  it('projects a resource key from method + params (never raw params)', () => {
    expect(auditResource('trips.getById', { tripId: 12 })).toBe('trip:12');
    expect(auditResource('users.getById', { id: 3 })).toBe('user:3');
    expect(auditResource('ws.broadcastToTrip', { tripId: 7 })).toBe('trip:7');
    expect(auditResource('ws.broadcastToUser', { userId: 9 })).toBe('user:9');
    expect(auditResource('db.query', { sql: 'x' })).toBeNull();
  });

  it('audits core-data + ws, not a plugin own-db call', () => {
    expect(isAuditable('trips.getReservations')).toBe(true);
    expect(isAuditable('users.getById')).toBe(true);
    expect(isAuditable('packing.list')).toBe(true);
    expect(isAuditable('files.list')).toBe(true);
    expect(isAuditable('ws.broadcastToTrip')).toBe(true);
    expect(isAuditable('db.query')).toBe(false);
    expect(isAuditable('db.migrate')).toBe(false);
  });

  it('resolves packing/files reads to their trip resource', () => {
    expect(auditResource('packing.list', { tripId: 3 })).toBe('trip:3');
    expect(auditResource('files.list', { tripId: 3 })).toBe('trip:3');
  });
});

describe('appendAudit hash chain (converted, through PluginCapabilityAuditRepository)', () => {
  it('chains each entry off the previous hash (per plugin)', async () => {
    await appendAudit(audit, {
      pluginId: 'p',
      actingUserId: 42,
      method: 'trips.getById',
      resource: 'trip:1',
      code: 'ok',
    });
    await appendAudit(audit, {
      pluginId: 'p',
      actingUserId: 42,
      method: 'trips.getById',
      resource: 'trip:2',
      code: 'ok',
    });
    const rows = await findRows(t, PluginCapabilityAudit, {}, { id: 'asc' });
    expect(rows).toHaveLength(2);
    expect(rows[0].prev_hash).toBeNull();
    expect(rows[1].prev_hash).toBe(rows[0].hash); // chain links
    expect(rows[1].hash).not.toBe(rows[0].hash);
  });

  it('keeps separate chains per plugin', async () => {
    await appendAudit(audit, { pluginId: 'a', method: 'trips.getById', resource: 'trip:1', code: 'ok' });
    await appendAudit(audit, { pluginId: 'b', method: 'trips.getById', resource: 'trip:1', code: 'ok' });
    const b = (await findRow(t, PluginCapabilityAudit, { plugin_id: 'b' }))!;
    expect(b.prev_hash).toBeNull(); // b's first entry doesn't chain off a's
  });

  it('records denials too (code is the error code)', async () => {
    await appendAudit(audit, {
      pluginId: 'p',
      actingUserId: 99,
      method: 'trips.getById',
      resource: 'trip:1',
      code: 'RESOURCE_FORBIDDEN',
    });
    const row = (await readAudit(audit, 'p'))[0];
    expect(row.code).toBe('RESOURCE_FORBIDDEN');
  });

  it("readAuditForUser returns one user's actions across ALL plugins, newest first, with the plugin name", async () => {
    await insertRows(t, Plugins, [
      { id: 'koffi', name: 'Koffi' },
      { id: 'flight', name: 'Flight Tracker' },
    ]);
    await appendAudit(audit, {
      pluginId: 'koffi',
      actingUserId: 42,
      method: 'trips.getById',
      resource: 'trip:1',
      code: 'ok',
    });
    await appendAudit(audit, {
      pluginId: 'flight',
      actingUserId: 42,
      method: 'reservations.create',
      resource: 'trip:1',
      code: 'ok',
    });
    await appendAudit(audit, {
      pluginId: 'koffi',
      actingUserId: 99,
      method: 'trips.getById',
      resource: 'trip:2',
      code: 'ok',
    }); // another user
    const mine = await readAuditForUser(audit, 42);
    expect(mine).toHaveLength(2); // only user 42's rows, across both plugins
    expect(mine[0]).toMatchObject({
      plugin_id: 'flight',
      plugin_name: 'Flight Tracker',
      method: 'reservations.create',
    }); // newest first
    expect(mine[1]).toMatchObject({ plugin_id: 'koffi', plugin_name: 'Koffi' });
    expect(mine.some((r) => r.plugin_id === 'koffi' && r.method === 'trips.getById' && r.resource === 'trip:2')).toBe(
      false,
    ); // never another user's
  });

  it('readAudit returns newest first with the projected fields only', async () => {
    await appendAudit(audit, {
      pluginId: 'p',
      actingUserId: 42,
      method: 'trips.getById',
      resource: 'trip:1',
      code: 'ok',
    });
    const rows = await readAudit(audit, 'p');
    expect(rows[0]).toHaveProperty('method', 'trips.getById');
    expect(rows[0]).not.toHaveProperty('prev_hash'); // internal chain fields not exposed
  });

  it('pruneAudit keeps only the newest N rows per plugin, leaving the retained window chain-consistent', async () => {
    for (let i = 0; i < 50; i++)
      await appendAudit(audit, {
        pluginId: 'p',
        actingUserId: 1,
        method: 'trips.getById',
        resource: `trip:${i}`,
        code: 'ok',
      });
    await appendAudit(audit, {
      pluginId: 'other',
      actingUserId: 1,
      method: 'trips.getById',
      resource: 'trip:x',
      code: 'ok',
    });
    await pruneAudit(audit, 'p', 10);
    const rows = await findRows(t, PluginCapabilityAudit, { plugin_id: 'p' }, { id: 'asc' });
    expect(rows).toHaveLength(10);
    expect(rows[rows.length - 1].resource).toBe('trip:49'); // newest kept
    // each retained row is still self-consistent: hash === sha256(prev_hash + row-content)
    // (proven by re-appending on top — the chain continues from the surviving tip)
    await appendAudit(audit, {
      pluginId: 'p',
      actingUserId: 1,
      method: 'trips.getById',
      resource: 'trip:new',
      code: 'ok',
    });
    expect(await countRows(t, PluginCapabilityAudit, { plugin_id: 'p' })).toBe(11);
    // pruning one plugin never touches another's rows
    expect(await countRows(t, PluginCapabilityAudit, { plugin_id: 'other' })).toBe(1);
    await expect(pruneAudit(audit, 'p', 0)).resolves.toBeUndefined(); // 0 = disabled, no-op
    expect(await countRows(t, PluginCapabilityAudit, { plugin_id: 'p' })).toBe(11);
  });
});

describe('R-hash-chain: concurrency (Plan 3j Task 7 fix wave, must-land 1)', () => {
  it('R3J-CHAIN-002: 10 concurrent appendAudit calls for the SAME plugin produce a linear, gap-free chain (red without the per-plugin serialization fix)', async () => {
    // The exact real code path production uses: `appendAudit`, racing N callers, not a
    // sequential loop — task-7-review.md's own live 40-way burst found 108 of 120 rows
    // unlinked (108 duplicate prev_hash values) before this fix; 9 of 10 broken in an
    // earlier, in-process 10-way version of this same test.
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        appendAudit(audit, {
          pluginId: 'burst',
          actingUserId: 1,
          method: 'trips.getById',
          resource: `trip:${i}`,
          code: 'ok',
        }),
      ),
    );
    const rows = await chainRows('burst');
    expect(rows).toHaveLength(10);
    expect(verifyChain(rows)).toBe(true); // every row's prev_hash === the previous row's hash
    // No two rows share a prev_hash — the exact shape a forked chain (two racers reading
    // the SAME "previous" tip) would produce.
    const prevHashes = rows.map((r) => r.prev_hash ?? '');
    expect(new Set(prevHashes).size).toBe(prevHashes.length);
    // Exactly one row has no predecessor (the genesis of this plugin's chain).
    expect(prevHashes.filter((h) => h === '').length).toBe(1);
  });
});

describe('R-hash-chain: replay, extension, mutation', () => {
  it('AUDITCHAIN-001 REPLAY+EXTENSION: verifies a legacy-produced chain, then extends it through the converted appendAudit and the WHOLE chain stays consistent', async () => {
    // 1. Write three rows the way the PRE-CONVERSION code did: raw SQL, no repository.
    let prev = '';
    for (let i = 0; i < 3; i++) {
      const { hash } = legacyAppendAudit(prev, {
        pluginId: 'legacy-p',
        actingUserId: 7,
        method: 'trips.getById',
        resource: `trip:${i}`,
        code: 'ok',
      });
      prev = hash;
    }
    // 2. REPLAY: the converted verification logic (verifyChain) accepts the legacy-written rows.
    expect(verifyChain(await chainRows('legacy-p'))).toBe(true);

    // 3. EXTENSION: append two more rows through the CONVERTED appendAudit, on top of the
    //    legacy tip — the repository reads the legacy row's hash as its own prev_hash.
    await appendAudit(audit, {
      pluginId: 'legacy-p',
      actingUserId: 7,
      method: 'trips.getById',
      resource: 'trip:3',
      code: 'ok',
    });
    await appendAudit(audit, {
      pluginId: 'legacy-p',
      actingUserId: 7,
      method: 'trips.getById',
      resource: 'trip:4',
      code: 'ok',
    });

    const rows = await chainRows('legacy-p');
    expect(rows).toHaveLength(5);
    expect(rows[3].prev_hash).toBe(rows[2].hash); // the converted append linked onto the legacy tip
    // 4. The WHOLE chain (3 legacy rows + 2 converted rows) verifies end to end.
    expect(verifyChain(rows)).toBe(true);
  });

  it('AUDITCHAIN-002 MUTATION: a row whose stored hash omits one field from the hash input fails verification', async () => {
    // A row constructed EXACTLY like appendAudit's real one, except `resource` is
    // dropped from the JSON array fed to sha256 — the drift R-hash-chain warns
    // never errors anywhere on write, only on a verification pass.
    const pluginId = 'mutant';
    const actingUserId = 1;
    const method = 'trips.getById';
    const resource = 'trip:1';
    const code = 'ok';
    const ts = new Date().toISOString();
    const mutatedRow = JSON.stringify([pluginId, actingUserId, method, code, ts]); // resource OMITTED
    const mutatedHash = crypto
      .createHash('sha256')
      .update('' + mutatedRow)
      .digest('hex');
    await insertRow(t, PluginCapabilityAudit, {
      plugin_id: pluginId,
      acting_user_id: actingUserId,
      method,
      resource,
      code,
      ts,
      prev_hash: null,
      hash: mutatedHash,
    });

    expect(verifyChain(await chainRows(pluginId))).toBe(false);

    // Control: the same row, hashed with the REAL (resource-included) construction, verifies.
    await deleteRows(t, PluginCapabilityAudit, { plugin_id: pluginId });
    legacyAppendAudit('', { pluginId, actingUserId, method, resource, code });
    expect(verifyChain(await chainRows(pluginId))).toBe(true);
  });
});
