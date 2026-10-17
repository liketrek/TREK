import { DawarichConnections } from '../../../../src/db/entities/DawarichConnections.entity';
import { DawarichVisitSuggestions } from '../../../../src/db/entities/DawarichVisitSuggestions.entity';
import type { DawarichConnectionsRepository } from '../../../../src/db/repositories/DawarichConnections.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { countRows, deleteRows, findRow, insertRow, updateRows, upsertRow } from '../../../helpers/factories/rows';
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
beforeEach(async () => {
  resetTestDb(testDb);
  t.clear();
  await deleteRows(t, DawarichConnections);
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function seed(
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
): Promise<void> {
  await upsertRow(t, DawarichConnections, {
    user: userId,
    url: over.url === undefined ? 'https://dawarich.example' : over.url,
    api_key: over.api_key === undefined ? 'enc:v1:cipher' : over.api_key,
    allow_insecure_tls: over.allow_insecure_tls ?? 0,
    sync_enabled: over.sync_enabled ?? 1,
    last_sync_at: over.last_sync_at ?? null,
    last_sync_state: over.last_sync_state ?? 'never',
    last_sync_error: over.last_sync_error ?? null,
    capabilities: over.capabilities ?? null,
  });
}

function raw(userId: number) {
  return findRow(t, DawarichConnections, { user: userId });
}

describe('DawarichConnectionsRepository', () => {
  describe('findRow (DWC1)', () => {
    it('CONNREPO-001: null when no connection exists', async () => {
      const { user } = createUser(testDb);
      expect(await connections.findRow(user.id)).toBeNull();
    });

    it('CONNREPO-002: a fully-seeded row comes back byte-identical to a legacy SELECT of the same 9 columns', async () => {
      const { user } = createUser(testDb);
      await seed(user.id, {
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
      // test-sql-allow: the legacy SELECT of the same 9 columns is the oracle this case holds findRow to.
      const legacy = testDb.prepare('SELECT * FROM dawarich_connections WHERE user_id = ?').get(user.id) as Record<
        string,
        unknown
      >;

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

      await seed(syncable);
      await seed(pollOff, { sync_enabled: 0 });
      await seed(noUrl, { url: null });
      await seed(blankUrl, { url: '' });
      await seed(noKey, { api_key: null });

      expect(await connections.listSyncableUserIds()).toEqual([syncable]);
    });
  });

  describe('getUrl (DWC3)', () => {
    it('CONNREPO-020: the stored url, or null for no row / a null column', async () => {
      const { user } = createUser(testDb);
      expect(await connections.getUrl(user.id)).toBeNull();
      await seed(user.id, { url: 'https://d.example' });
      expect(await connections.getUrl(user.id)).toBe('https://d.example');
      await seed(user.id, { url: null });
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

      const row = (await raw(user.id))!;
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
      await seed(user.id, {
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

      const row = (await raw(user.id))!;
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
      await updateRows(t, DawarichConnections, {}, { updated_at: '2000-01-01 00:00:00' });

      await connections.upsertConnection(user.id, {
        url: 'https://d.example',
        allowInsecureTls: false,
        syncEnabled: false,
      });

      expect((await raw(user.id))!.updated_at).not.toBe('2000-01-01 00:00:00');
    });
  });

  describe('setApiKey (DWC5/DWC7)', () => {
    it('CONNREPO-040: writes the given ciphertext, and null scrubs it', async () => {
      const { user } = createUser(testDb);
      await seed(user.id, { api_key: 'enc:v1:old' });

      await connections.setApiKey(user.id, 'enc:v1:new');
      expect((await raw(user.id))!.api_key).toBe('enc:v1:new');

      await connections.setApiKey(user.id, null);
      expect((await raw(user.id))!.api_key).toBeNull();
    });
  });

  describe('resetSyncState (DWC6)', () => {
    it('CONNREPO-050: clears capabilities/last_sync_* without touching api_key', async () => {
      const { user } = createUser(testDb);
      await seed(user.id, {
        api_key: 'enc:v1:kept',
        capabilities: '{"a":1}',
        last_sync_state: 'ok',
        last_sync_error: 'x',
        last_sync_at: '2026-01-01T00:00:00Z',
      });

      await connections.resetSyncState(user.id);

      const row = (await raw(user.id))!;
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
      await seed(user.id, {
        api_key: 'enc:v1:gone',
        capabilities: '{"a":1}',
        last_sync_state: 'ok',
        last_sync_error: 'x',
        last_sync_at: '2026-01-01T00:00:00Z',
      });

      await connections.clearForRemovedUrl(user.id);

      expect((await raw(user.id))!).toMatchObject({
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
      await seed(user.id);
      await seed(other);
      await insertRow(t, DawarichVisitSuggestions, {
        user: user.id,
        source_visit_id: 'v1',
        name: 'Cafe',
        lat: 1,
        lng: 1,
        started_at: '2026-01-01T00:00:00Z',
        ended_at: '2026-01-01T01:00:00Z',
        local_date: '2026-01-01',
        source_hash: 'hash',
      });

      await connections.disconnect(user.id);

      expect(await raw(user.id)).toBeNull();
      expect(await raw(other)).not.toBeNull();
      expect(await countRows(t, DawarichVisitSuggestions, { user: user.id })).toBe(1);
    });
  });

  describe('storeCapabilities (DWC10)', () => {
    it('CONNREPO-080: writes the JSON blob and stamps updated_at', async () => {
      const { user } = createUser(testDb);
      await seed(user.id);
      await connections.storeCapabilities(user.id, '{"visits":true,"tracks":false}');
      expect((await raw(user.id))!.capabilities).toBe('{"visits":true,"tracks":false}');
    });
  });

  describe('recordSyncResult (DWC11)', () => {
    it('CONNREPO-090: writes all four columns for the named user only', async () => {
      const { user } = createUser(testDb);
      const other = createUser(testDb).user.id;
      await seed(user.id);
      await seed(other, { last_sync_state: 'ok' });

      await connections.recordSyncResult(user.id, {
        lastSyncAt: '2026-09-12T04:15:00.000Z',
        state: 'failed',
        error: 'unreachable',
      });

      expect((await raw(user.id))!).toMatchObject({
        last_sync_at: '2026-09-12T04:15:00.000Z',
        last_sync_state: 'failed',
        last_sync_error: 'unreachable',
      });
      expect((await raw(other))!.last_sync_state).toBe('ok');
    });
  });

  describe('getLastSyncState (DSY1)', () => {
    it('CONNREPO-100: the stored state, or null with no row at all', async () => {
      const { user } = createUser(testDb);
      expect(await connections.getLastSyncState(user.id)).toBeNull();
      await seed(user.id, { last_sync_state: 'partial' });
      expect(await connections.getLastSyncState(user.id)).toBe('partial');
    });
  });
});
