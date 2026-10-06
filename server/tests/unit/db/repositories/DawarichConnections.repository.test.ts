import { DawarichConnections } from '../../../../src/db/entities/DawarichConnections.entity';
import type { DawarichConnectionsRepository } from '../../../../src/db/repositories/DawarichConnections.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let connections: DawarichConnectionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  connections = t.repo(DawarichConnections);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  testDb.exec('DELETE FROM dawarich_connections');
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function seed(
  userId: number,
  over: Partial<{
    url: string | null;
    api_key: string | null;
    allow_insecure_tls: number;
    sync_enabled: number;
    last_sync_at: string | null;
    last_sync_state: string;
    last_sync_error: string | null;
    capabilities: string | null;
  }> = {},
): void {
  testDb
    .prepare(
      `INSERT OR REPLACE INTO dawarich_connections
         (user_id, url, api_key, allow_insecure_tls, sync_enabled, last_sync_at, last_sync_state, last_sync_error, capabilities)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      over.url === undefined ? 'https://dawarich.example' : over.url,
      over.api_key === undefined ? 'enc:v1:cipher' : over.api_key,
      over.allow_insecure_tls ?? 0,
      over.sync_enabled ?? 1,
      over.last_sync_at ?? null,
      over.last_sync_state ?? 'never',
      over.last_sync_error ?? null,
      over.capabilities ?? null,
    );
}

function raw(userId: number): Record<string, unknown> | undefined {
  return testDb.prepare('SELECT * FROM dawarich_connections WHERE user_id = ?').get(userId) as
    Record<string, unknown> | undefined;
}

describe('DawarichConnectionsRepository', () => {
  describe('findRow (DWC1)', () => {
    it('CONNREPO-001: null when no connection exists', async () => {
      const { user } = createUser(testDb);
      expect(await connections.findRow(user.id)).toBeNull();
    });

    it('CONNREPO-002: a fully-seeded row comes back byte-identical to a legacy SELECT of the same 9 columns', async () => {
      const { user } = createUser(testDb);
      seed(user.id, {
        url: 'https://dawarich.example/api',
        api_key: 'enc:v1:abcdef',
        allow_insecure_tls: 1,
        sync_enabled: 0,
        last_sync_at: '2026-09-12T04:15:00.000Z',
        last_sync_state: 'partial',
        last_sync_error: 'rate_limited',
        capabilities: '{"visits":true}',
      });

      const row = await connections.findRow(user.id);
      const legacy = raw(user.id)!;

      expect(row).toEqual({
        user_id: legacy.user_id,
        url: legacy.url,
        api_key: legacy.api_key,
        allow_insecure_tls: legacy.allow_insecure_tls,
        sync_enabled: legacy.sync_enabled,
        last_sync_at: legacy.last_sync_at,
        last_sync_state: legacy.last_sync_state,
        last_sync_error: legacy.last_sync_error,
        capabilities: legacy.capabilities,
      });
    });
  });

  describe('listSyncableUserIds (DWC2)', () => {
    it('CONNREPO-010: only rows with sync on, a non-blank url and a key', async () => {
      const syncable = createUser(testDb).user.id;
      const pollOff = createUser(testDb).user.id;
      const noUrl = createUser(testDb).user.id;
      const blankUrl = createUser(testDb).user.id;
      const noKey = createUser(testDb).user.id;

      seed(syncable);
      seed(pollOff, { sync_enabled: 0 });
      seed(noUrl, { url: null });
      seed(blankUrl, { url: '' });
      seed(noKey, { api_key: null });

      expect(await connections.listSyncableUserIds()).toEqual([syncable]);
    });
  });

  describe('getUrl (DWC3)', () => {
    it('CONNREPO-020: the stored url, or null for no row / a null column', async () => {
      const { user } = createUser(testDb);
      expect(await connections.getUrl(user.id)).toBeNull();
      seed(user.id, { url: 'https://d.example' });
      expect(await connections.getUrl(user.id)).toBe('https://d.example');
      seed(user.id, { url: null });
      expect(await connections.getUrl(user.id)).toBeNull();
    });
  });

  describe('upsertConnection (DWC4)', () => {
    it('CONNREPO-030: inserts a new row with the other columns at their schema defaults', async () => {
      const { user } = createUser(testDb);
      await connections.upsertConnection(user.id, {
        url: 'https://d.example',
        allowInsecureTls: true,
        syncEnabled: false,
      });

      const row = raw(user.id)!;
      expect(row).toMatchObject({
        url: 'https://d.example',
        allow_insecure_tls: 1,
        sync_enabled: 0,
        api_key: null,
        capabilities: null,
        last_sync_state: 'never',
      });
      expect(row.updated_at).toBeTruthy();
    });

    it('CONNREPO-031: on conflict merges ONLY url/allow_insecure_tls/sync_enabled/updated_at — api_key and capabilities survive untouched', async () => {
      const { user } = createUser(testDb);
      seed(user.id, {
        url: 'https://old.example',
        api_key: 'enc:v1:stored',
        capabilities: '{"visits":true}',
        last_sync_state: 'ok',
      });

      await connections.upsertConnection(user.id, {
        url: 'https://new.example',
        allowInsecureTls: true,
        syncEnabled: true,
      });

      const row = raw(user.id)!;
      expect(row.url).toBe('https://new.example');
      expect(row.allow_insecure_tls).toBe(1);
      expect(row.api_key).toBe('enc:v1:stored');
      expect(row.capabilities).toBe('{"visits":true}');
      expect(row.last_sync_state).toBe('ok');
    });

    it('CONNREPO-032: updated_at is bumped unconditionally, insert or merge alike', async () => {
      const { user } = createUser(testDb);
      await connections.upsertConnection(user.id, {
        url: 'https://d.example',
        allowInsecureTls: false,
        syncEnabled: true,
      });
      testDb.exec(`UPDATE dawarich_connections SET updated_at = '2000-01-01 00:00:00'`);

      await connections.upsertConnection(user.id, {
        url: 'https://d.example',
        allowInsecureTls: false,
        syncEnabled: false,
      });

      expect(raw(user.id)!.updated_at).not.toBe('2000-01-01 00:00:00');
    });
  });

  describe('setApiKey (DWC5/DWC7)', () => {
    it('CONNREPO-040: writes the given ciphertext, and null scrubs it', async () => {
      const { user } = createUser(testDb);
      seed(user.id, { api_key: 'enc:v1:old' });

      await connections.setApiKey(user.id, 'enc:v1:new');
      expect(raw(user.id)!.api_key).toBe('enc:v1:new');

      await connections.setApiKey(user.id, null);
      expect(raw(user.id)!.api_key).toBeNull();
    });
  });

  describe('resetSyncState (DWC6)', () => {
    it('CONNREPO-050: clears capabilities/last_sync_* without touching api_key', async () => {
      const { user } = createUser(testDb);
      seed(user.id, {
        api_key: 'enc:v1:kept',
        capabilities: '{"a":1}',
        last_sync_state: 'ok',
        last_sync_error: 'x',
        last_sync_at: '2026-01-01T00:00:00Z',
      });

      await connections.resetSyncState(user.id);

      const row = raw(user.id)!;
      expect(row).toMatchObject({
        api_key: 'enc:v1:kept',
        capabilities: null,
        last_sync_state: 'never',
        last_sync_error: null,
        last_sync_at: null,
      });
    });
  });

  describe('clearForRemovedUrl (DWC8)', () => {
    it('CONNREPO-060: clears api_key together with capabilities/last_sync_* in one statement', async () => {
      const { user } = createUser(testDb);
      seed(user.id, {
        api_key: 'enc:v1:gone',
        capabilities: '{"a":1}',
        last_sync_state: 'ok',
        last_sync_error: 'x',
        last_sync_at: '2026-01-01T00:00:00Z',
      });

      await connections.clearForRemovedUrl(user.id);

      expect(raw(user.id)!).toMatchObject({
        api_key: null,
        capabilities: null,
        last_sync_state: 'never',
        last_sync_error: null,
        last_sync_at: null,
      });
    });
  });

  describe('disconnect (DWC9)', () => {
    it("CONNREPO-070: removes only the named user's row, and does not cascade to suggestions (no FK relation exists for it to cascade through)", async () => {
      const { user } = createUser(testDb);
      const other = createUser(testDb).user.id;
      seed(user.id);
      seed(other);
      testDb
        .prepare(
          `INSERT INTO dawarich_visit_suggestions
             (user_id, source_visit_id, name, lat, lng, started_at, ended_at, local_date, source_hash)
           VALUES (?, 'v1', 'Cafe', 1, 1, '2026-01-01T00:00:00Z', '2026-01-01T01:00:00Z', '2026-01-01', 'hash')`,
        )
        .run(user.id);

      await connections.disconnect(user.id);

      expect(raw(user.id)).toBeUndefined();
      expect(raw(other)).toBeDefined();
      expect(
        testDb.prepare('SELECT COUNT(*) AS n FROM dawarich_visit_suggestions WHERE user_id = ?').get(user.id),
      ).toEqual({ n: 1 });
    });
  });

  describe('storeCapabilities (DWC10)', () => {
    it('CONNREPO-080: writes the JSON blob and stamps updated_at', async () => {
      const { user } = createUser(testDb);
      seed(user.id);
      await connections.storeCapabilities(user.id, '{"visits":true,"tracks":false}');
      expect(raw(user.id)!.capabilities).toBe('{"visits":true,"tracks":false}');
    });
  });

  describe('recordSyncResult (DWC11)', () => {
    it('CONNREPO-090: writes all four columns for the named user only', async () => {
      const { user } = createUser(testDb);
      const other = createUser(testDb).user.id;
      seed(user.id);
      seed(other, { last_sync_state: 'ok' });

      await connections.recordSyncResult(user.id, {
        lastSyncAt: '2026-09-12T04:15:00.000Z',
        state: 'failed',
        error: 'unreachable',
      });

      expect(raw(user.id)!).toMatchObject({
        last_sync_at: '2026-09-12T04:15:00.000Z',
        last_sync_state: 'failed',
        last_sync_error: 'unreachable',
      });
      expect(raw(other)!.last_sync_state).toBe('ok');
    });
  });

  describe('getLastSyncState (DSY1)', () => {
    it('CONNREPO-100: the stored state, or null with no row at all', async () => {
      const { user } = createUser(testDb);
      expect(await connections.getLastSyncState(user.id)).toBeNull();
      seed(user.id, { last_sync_state: 'partial' });
      expect(await connections.getLastSyncState(user.id)).toBe('partial');
    });
  });
});
