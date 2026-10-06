import { OauthClients } from '../../../../src/db/entities/OauthClients.entity';
import type { OauthClientsRepository } from '../../../../src/db/repositories/OauthClients.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let clients: OauthClientsRepository;
let uow: UnitOfWork;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  clients = t.repo(OauthClients);
  uow = new UnitOfWork(t.em);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  testDb.exec('DELETE FROM oauth_clients');
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function seedClient(
  overrides: Partial<{
    id: string;
    userId: number | null;
    name: string;
    clientId: string;
    secretHash: string;
    redirectUris: string;
    allowedScopes: string;
    isPublic: number;
    createdVia: string;
    allowsClientCredentials: number;
  }> = {},
): { id: string; userId: number | null; clientId: string } {
  const id = overrides.id ?? `row-${Math.random().toString(36).slice(2)}`;
  const clientId = overrides.clientId ?? `proto-${Math.random().toString(36).slice(2)}`;
  testDb
    .prepare(
      `INSERT INTO oauth_clients (id, user_id, name, client_id, client_secret_hash, redirect_uris, allowed_scopes, is_public, created_via, allows_client_credentials)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      overrides.userId ?? null,
      overrides.name ?? 'Test Client',
      clientId,
      overrides.secretHash ?? 'hash-value',
      overrides.redirectUris ?? '["https://example.com/cb"]',
      overrides.allowedScopes ?? '["trips:read"]',
      overrides.isPublic ?? 0,
      overrides.createdVia ?? 'settings_ui',
      overrides.allowsClientCredentials ?? 0,
    );
  return { id, userId: overrides.userId ?? null, clientId };
}

describe('OauthClientsRepository', () => {
  describe('listByUser (OA1)', () => {
    it("OAUTHCLIENTREPO-001: returns the caller's clients only, newest first, without the secret hash", async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      seedClient({ userId: user.id, name: 'first', createdVia: 'settings_ui' });
      testDb.exec("UPDATE oauth_clients SET created_at = '2020-01-01 00:00:00' WHERE name = 'first'");
      seedClient({ userId: user.id, name: 'second' });
      testDb.exec("UPDATE oauth_clients SET created_at = '2021-01-01 00:00:00' WHERE name = 'second'");
      seedClient({ userId: other.id, name: 'not-mine' });

      const rows = await clients.listByUser(user.id);
      expect(rows.map((r) => r.name)).toEqual(['second', 'first']);
      expect(rows[0]).not.toHaveProperty('client_secret_hash');
      expect(rows[0].user_id).toBe(user.id);
    });

    it('OAUTHCLIENTREPO-002: empty for a user with no clients', async () => {
      const { user } = createUser(testDb);
      expect(await clients.listByUser(user.id)).toEqual([]);
    });

    it('OAUTHCLIENTREPO-002b: created_at NULL comes back null, not undefined (coverage: rule 16)', async () => {
      const { user } = createUser(testDb);
      const { id } = seedClient({ userId: user.id, name: 'null-created' });
      testDb.prepare('UPDATE oauth_clients SET created_at = NULL WHERE id = ?').run(id);
      const rows = await clients.listByUser(user.id);
      expect(rows[0].created_at).toBeNull();
    });
  });

  describe('countByUser / countAnonymous (OA2/OA3)', () => {
    it("OAUTHCLIENTREPO-003: countByUser only counts the given user's rows", async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      seedClient({ userId: user.id });
      seedClient({ userId: user.id });
      seedClient({ userId: other.id });
      expect(await clients.countByUser(user.id)).toBe(2);
      expect(await clients.countByUser(other.id)).toBe(1);
    });

    it('OAUTHCLIENTREPO-004: countAnonymous counts only NULL-user rows', async () => {
      const { user } = createUser(testDb);
      seedClient({ userId: user.id });
      seedClient({ userId: null });
      seedClient({ userId: null });
      expect(await clients.countAnonymous()).toBe(2);
    });
  });

  describe('insertClient / findPublicById (OA4/OA5)', () => {
    it('OAUTHCLIENTREPO-005: writes exactly the given columns and the re-select matches', async () => {
      const { user } = createUser(testDb);
      const row = await clients.insertClient({
        id: 'client-row-1',
        user_id: user.id,
        name: 'My Client',
        client_id: 'proto-abc',
        client_secret_hash: 'secrethash',
        redirect_uris: '["https://a.example.com/cb"]',
        allowed_scopes: '["trips:read","trips:write"]',
        is_public: 0,
        created_via: 'settings_ui',
        allows_client_credentials: 0,
      });
      expect(row).toMatchObject({
        id: 'client-row-1',
        user_id: user.id,
        name: 'My Client',
        client_id: 'proto-abc',
        redirect_uris: '["https://a.example.com/cb"]',
        allowed_scopes: '["trips:read","trips:write"]',
        is_public: 0,
        created_via: 'settings_ui',
        allows_client_credentials: 0,
      });
      const raw = testDb.prepare('SELECT * FROM oauth_clients WHERE id = ?').get('client-row-1') as Record<
        string,
        unknown
      >;
      expect(raw.client_secret_hash).toBe('secrethash');
    });

    it('OAUTHCLIENTREPO-005b: findPublicById is null for an unknown id', async () => {
      expect(await clients.findPublicById('nope')).toBeNull();
    });

    it('OAUTHCLIENTREPO-005c: findPublicById — created_at NULL comes back null, not undefined (coverage: rule 16)', async () => {
      const { id } = seedClient({ name: 'null-created-public' });
      testDb.prepare('UPDATE oauth_clients SET created_at = NULL WHERE id = ?').run(id);
      const row = await clients.findPublicById(id);
      expect(row?.created_at).toBeNull();
    });

    it('OAUTHCLIENTREPO-006: insertClient writes a NULL user_id for anonymous DCR clients', async () => {
      const row = await clients.insertClient({
        id: 'client-row-2',
        user_id: null,
        name: 'DCR Client',
        client_id: 'proto-dcr',
        client_secret_hash: 'x',
        redirect_uris: '[]',
        allowed_scopes: '[]',
        is_public: 1,
        created_via: 'dcr',
        allows_client_credentials: 0,
      });
      expect(row.user_id).toBeNull();
    });

    it('OAUTHCLIENTREPO-006b: throws when the read-back after insert finds no row (coverage: the guard branch)', async () => {
      const spy = vi.spyOn(clients, 'findPublicById').mockResolvedValueOnce(null);
      await expect(
        clients.insertClient({
          id: 'client-row-ghost',
          user_id: null,
          name: 'Ghost Client',
          client_id: 'proto-ghost',
          client_secret_hash: 'x',
          redirect_uris: '[]',
          allowed_scopes: '[]',
          is_public: 1,
          created_via: 'dcr',
          allows_client_credentials: 0,
        }),
      ).rejects.toThrow('OauthClientsRepository.insertClient: row client-row-ghost not found immediately after insert');
      spy.mockRestore();
    });
  });

  describe('findOwned (OA6/OA9)', () => {
    it('OAUTHCLIENTREPO-007: matches id+user, returns the superset projection', async () => {
      const { user } = createUser(testDb);
      const { id, clientId } = seedClient({ userId: user.id, isPublic: 1 });
      const row = await clients.findOwned(id, user.id);
      expect(row).toEqual({ id, client_id: clientId, is_public: 1 });
    });

    it("OAUTHCLIENTREPO-008: 404-shape null for another user's client (never 403)", async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      const { id } = seedClient({ userId: other.id });
      expect(await clients.findOwned(id, user.id)).toBeNull();
    });
  });

  describe('updateSecretHash (OA7)', () => {
    it('OAUTHCLIENTREPO-009: writes the new hash, nothing else', async () => {
      const { id } = seedClient({ secretHash: 'old' });
      await clients.updateSecretHash(id, 'new-hash');
      const row = testDb.prepare('SELECT client_secret_hash FROM oauth_clients WHERE id = ?').get(id) as {
        client_secret_hash: string;
      };
      expect(row.client_secret_hash).toBe('new-hash');
    });
  });

  describe('remove (OA10)', () => {
    it('OAUTHCLIENTREPO-010: deletes the row', async () => {
      const { id } = seedClient();
      await clients.remove(id);
      expect(testDb.prepare('SELECT id FROM oauth_clients WHERE id = ?').get(id)).toBeUndefined();
    });
  });

  describe('findSdkProjection (OA15)', () => {
    it('OAUTHCLIENTREPO-011: never carries client_secret_hash', async () => {
      const { clientId } = seedClient({ secretHash: 'super-secret', name: 'SDK Client' });
      const row = await clients.findSdkProjection(clientId);
      expect(row).toEqual({
        client_id: clientId,
        name: 'SDK Client',
        redirect_uris: '["https://example.com/cb"]',
        allowed_scopes: '["trips:read"]',
        is_public: 0,
        created_via: 'settings_ui',
      });
      expect(row).not.toHaveProperty('client_secret_hash');
    });

    it('OAUTHCLIENTREPO-012: null for unknown client_id', async () => {
      expect(await clients.findSdkProjection('nonexistent')).toBeNull();
    });
  });

  describe('findAuthRow (OA21)', () => {
    it('OAUTHCLIENTREPO-013: exactly the three auth columns, a distinct projection from OA15', async () => {
      const { clientId } = seedClient({ secretHash: 'auth-secret', isPublic: 0 });
      const row = await clients.findAuthRow(clientId);
      expect(row).toEqual({ client_id: clientId, client_secret_hash: 'auth-secret', is_public: 0 });
    });

    it('OAUTHCLIENTREPO-013b: null for unknown client_id', async () => {
      expect(await clients.findAuthRow('nope')).toBeNull();
    });
  });

  describe('findByClientIdFull (OA29/OA30)', () => {
    it('OAUTHCLIENTREPO-014: the full row, including the secret hash', async () => {
      const { user } = createUser(testDb);
      const { clientId } = seedClient({ userId: user.id, secretHash: 'full-row-secret' });
      const row = await clients.findByClientIdFull(clientId);
      expect(row?.client_secret_hash).toBe('full-row-secret');
      expect(row?.user_id).toBe(user.id);
    });

    it('OAUTHCLIENTREPO-015: null for unknown client_id', async () => {
      expect(await clients.findByClientIdFull('nope')).toBeNull();
    });
  });

  describe('identity-map write-back regression (program RULING, D-shape)', () => {
    // task-4-review.md F1: the D-shape needs the `nativeUpdate`'s target
    // column in the FIRST, WIDER projection and absent from the SECOND,
    // narrower one — a stale write-back only reverts a column the second
    // read's snapshot doesn't already carry fresh. The original ordering
    // here (`listByUser`, narrow, then `findAuthRow`, wide) had it backwards:
    // `findAuthRow`'s own re-snapshot of `client_secret_hash` left that
    // column clean, so the mutation this test exists to catch (reverting
    // `disableIdentityMap: true` back to `refresh: true`) passed anyway.
    // `findAuthRow` (wide, carries `client_secret_hash`) now goes FIRST and
    // `findOwned` (narrow, no `client_secret_hash`) second — mutation-proven
    // load-bearing in the task report.
    it('OAUTHCLIENTREPO-016: findAuthRow then findOwned then updateSecretHash inside uow.transactional — the write survives', async () => {
      const { user } = createUser(testDb);
      const { id, clientId } = seedClient({ userId: user.id, secretHash: 'original', name: 'kept-name' });

      await withRequestContext(t.orm, async () => {
        // Projection A — wide, carries client_secret_hash.
        await clients.findAuthRow(clientId);
        // Projection B — narrow, a different (smaller) field set on the same row.
        await clients.findOwned(id, user.id);
        // The intended write, inside the request's own transaction.
        await uow.transactional(async () => {
          await clients.updateSecretHash(id, 'rotated');
        });
      });

      const row = testDb.prepare('SELECT client_secret_hash, name FROM oauth_clients WHERE id = ?').get(id) as {
        client_secret_hash: string;
        name: string;
      };
      expect(row.client_secret_hash).toBe('rotated'); // the nativeUpdate must stick
      expect(row.name).toBe('kept-name'); // untouched by either read
    });
  });
});
