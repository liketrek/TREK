import { WebauthnCredentials } from '../../../../src/db/entities/WebauthnCredentials.entity';
import type { WebauthnCredentialsRepository } from '../../../../src/db/repositories/WebauthnCredentials.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let creds: WebauthnCredentialsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  creds = t.repo(WebauthnCredentials);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

let _credSeq = 0;
function insertCredential(
  userId: number,
  overrides: Record<string, unknown> = {},
): { id: number } & Record<string, unknown> {
  _credSeq++;
  const row = {
    credential_id: `cred-${_credSeq}`,
    public_key: Buffer.from([1, 2, 3, _credSeq]),
    counter: 0,
    transports: null,
    device_type: 'singleDevice',
    backed_up: 0,
    name: `Passkey ${_credSeq}`,
    aaguid: null,
    ...overrides,
  };
  const result = testDb
    .prepare(
      `INSERT INTO webauthn_credentials
       (user_id, credential_id, public_key, counter, transports, device_type, backed_up, name, aaguid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      row.credential_id,
      row.public_key,
      row.counter,
      row.transports,
      row.device_type,
      row.backed_up,
      row.name,
      row.aaguid,
    );
  return { id: Number(result.lastInsertRowid), ...row };
}

function rawCredential(id: number): Record<string, unknown> | undefined {
  return testDb.prepare('SELECT * FROM webauthn_credentials WHERE id = ?').get(id) as
    Record<string, unknown> | undefined;
}

function rawCredentialByCredentialId(credentialId: string): Record<string, unknown> | undefined {
  return testDb.prepare('SELECT * FROM webauthn_credentials WHERE credential_id = ?').get(credentialId) as
    Record<string, unknown> | undefined;
}

describe('WebauthnCredentialsRepository', () => {
  describe('hasAny', () => {
    it('WEBAUTHN-CRED-REPO-001: true iff the user owns at least one credential', async () => {
      const { user } = createUser(testDb);
      expect(await creds.hasAny(user.id)).toBe(false);
      insertCredential(user.id);
      expect(await creds.hasAny(user.id)).toBe(true);
    });
  });

  describe('listExcludeCredentials', () => {
    it('WEBAUTHN-CRED-REPO-002: projects credential_id + transports for one user only', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      insertCredential(user.id, { credential_id: 'mine-1', transports: JSON.stringify(['usb']) });
      insertCredential(user.id, { credential_id: 'mine-2', transports: null });
      insertCredential(other.id, { credential_id: 'theirs' });

      const rows = await creds.listExcludeCredentials(user.id);
      expect(rows).toHaveLength(2);
      expect(rows).toEqual(
        expect.arrayContaining([
          { credential_id: 'mine-1', transports: JSON.stringify(['usb']) },
          { credential_id: 'mine-2', transports: null },
        ]),
      );
    });
  });

  describe('existsByCredentialId', () => {
    it('WEBAUTHN-CRED-REPO-003: true for a known credential_id, false otherwise', async () => {
      const { user } = createUser(testDb);
      insertCredential(user.id, { credential_id: 'known-cred' });
      expect(await creds.existsByCredentialId('known-cred')).toBe(true);
      expect(await creds.existsByCredentialId('unknown-cred')).toBe(false);
    });
  });

  describe('insertCredential', () => {
    it('WEBAUTHN-CRED-REPO-004: writes every column, last_used_at always NULL, public_key round-trips byte for byte', async () => {
      const { user } = createUser(testDb);
      const publicKey = Buffer.from([9, 8, 7, 6, 5]);

      await creds.insertCredential({
        user_id: user.id,
        credential_id: 'new-cred',
        public_key: publicKey,
        counter: 3,
        transports: JSON.stringify(['internal']),
        device_type: 'singleDevice',
        backed_up: 1,
        name: 'My Key',
        aaguid: 'aaguid-1',
      });

      const row = rawCredentialByCredentialId('new-cred')!;
      expect(row).toMatchObject({
        user_id: user.id,
        credential_id: 'new-cred',
        counter: 3,
        transports: JSON.stringify(['internal']),
        device_type: 'singleDevice',
        backed_up: 1,
        name: 'My Key',
        aaguid: 'aaguid-1',
        last_used_at: null,
      });
      expect(Buffer.isBuffer(row.public_key)).toBe(true);
      expect(Buffer.from(row.public_key as Buffer).equals(publicKey)).toBe(true);
    });

    it('WEBAUTHN-CRED-REPO-005: nullable fields (transports/device_type/name/aaguid) persist as NULL', async () => {
      const { user } = createUser(testDb);
      await creds.insertCredential({
        user_id: user.id,
        credential_id: 'sparse-cred',
        public_key: Buffer.from([1]),
        counter: 0,
        transports: null,
        device_type: null,
        backed_up: 0,
        name: null,
        aaguid: null,
      });
      const row = rawCredentialByCredentialId('sparse-cred')!;
      expect(row).toMatchObject({ transports: null, device_type: null, name: null, aaguid: null });
    });
  });

  describe('findCreatedCredential (PK8) vs findByCredentialId (PK9)', () => {
    it('WEBAUTHN-CRED-REPO-006: findCreatedCredential projects only the panel columns', async () => {
      const { user } = createUser(testDb);
      const cred = insertCredential(user.id, { name: 'Post-Reg' });

      const row = await creds.findCreatedCredential(cred.credential_id as string);
      expect(row).toEqual({
        id: cred.id,
        name: 'Post-Reg',
        device_type: 'singleDevice',
        backed_up: 0,
        created_at: expect.any(String),
        last_used_at: null,
      });
      expect(row).not.toHaveProperty('public_key');
    });

    it('WEBAUTHN-CRED-REPO-006b: name/created_at NULL come back null, not undefined (coverage: rule 16)', async () => {
      const { user } = createUser(testDb);
      const cred = insertCredential(user.id, { name: null });
      testDb.prepare('UPDATE webauthn_credentials SET created_at = NULL WHERE id = ?').run(cred.id);
      const row = await creds.findCreatedCredential(cred.credential_id as string);
      expect(row?.name).toBeNull();
      expect(row?.created_at).toBeNull();
    });

    it('WEBAUTHN-CRED-REPO-007: findCreatedCredential is null for an unknown credential_id', async () => {
      expect(await creds.findCreatedCredential('no-such-cred')).toBeNull();
    });

    it('WEBAUTHN-CRED-REPO-008: findByCredentialId returns the full row, public_key a real Buffer', async () => {
      const { user } = createUser(testDb);
      const pk = Buffer.from([1, 2, 3]);
      const cred = insertCredential(user.id, { public_key: pk });

      const row = await creds.findByCredentialId(cred.credential_id as string);
      expect(row).not.toBeNull();
      expect(row!.id).toBe(cred.id);
      expect(row!.user_id).toBe(user.id);
      expect(Buffer.isBuffer(row!.public_key)).toBe(true);
      expect(Buffer.from(row!.public_key).equals(pk)).toBe(true);
    });

    it('WEBAUTHN-CRED-REPO-009: findByCredentialId is null for an unknown credential_id', async () => {
      expect(await creds.findByCredentialId('no-such-cred')).toBeNull();
    });
  });

  describe('updateCounterAndLastUsed', () => {
    it('WEBAUTHN-CRED-REPO-010: bumps counter and stamps last_used_at', async () => {
      const { user } = createUser(testDb);
      const cred = insertCredential(user.id, { counter: 5 });

      await creds.updateCounterAndLastUsed(cred.id, 6);

      const row = rawCredential(cred.id)!;
      expect(row.counter).toBe(6);
      expect(row.last_used_at).not.toBeNull();
    });
  });

  describe('listForPanel', () => {
    it("WEBAUTHN-CRED-REPO-011: newest-first, scoped to one user, matches PK8's column set", async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      testDb
        .prepare(
          `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, backed_up, name, created_at)
         VALUES (?, 'old', x'01', 0, 0, 'Old', '2026-01-01 00:00:00'), (?, 'new', x'02', 0, 1, 'New', '2026-02-01 00:00:00')`,
        )
        .run(user.id, user.id);
      insertCredential(other.id);

      const rows = await creds.listForPanel(user.id);
      expect(rows.map((r) => r.name)).toEqual(['New', 'Old']);
      expect(rows[0]).toEqual({
        id: expect.any(Number),
        name: 'New',
        device_type: null,
        backed_up: 1,
        created_at: '2026-02-01 00:00:00',
        last_used_at: null,
      });
    });
  });

  describe('renameOwned', () => {
    it('WEBAUTHN-CRED-REPO-012: renames when id + user_id both match, returns the affected count', async () => {
      const { user } = createUser(testDb);
      const cred = insertCredential(user.id);

      expect(await creds.renameOwned(cred.id, user.id, 'Renamed')).toBe(1);
      expect(rawCredential(cred.id)!.name).toBe('Renamed');
    });

    it('WEBAUTHN-CRED-REPO-013: a foreign owner or unknown id affects 0 rows (404, never 403)', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      const cred = insertCredential(user.id, { name: 'Original' });

      expect(await creds.renameOwned(cred.id, other.id, 'Stolen')).toBe(0);
      expect(await creds.renameOwned(999_999, user.id, 'Ghost')).toBe(0);
      expect(rawCredential(cred.id)!.name).toBe('Original');
    });
  });

  describe('deleteOwned', () => {
    it('WEBAUTHN-CRED-REPO-014: deletes when id + user_id both match, returns the affected count', async () => {
      const { user } = createUser(testDb);
      const cred = insertCredential(user.id);
      expect(await creds.deleteOwned(cred.id, user.id)).toBe(1);
      expect(rawCredential(cred.id)).toBeUndefined();
    });

    it('WEBAUTHN-CRED-REPO-015: a foreign owner affects 0 rows and the row survives', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      const cred = insertCredential(user.id);
      expect(await creds.deleteOwned(cred.id, other.id)).toBe(0);
      expect(rawCredential(cred.id)).toBeDefined();
    });
  });

  describe('identity-map isolation (coordinator ruling — stale-write-back bug class)', () => {
    // Task 7 review, M1: the D-shape needs the nativeUpdate's target column
    // (`counter`) in the FIRST, WIDER projection and absent from the
    // SECOND, narrower one — a stale write-back only reverts a column the
    // second read's snapshot doesn't already carry fresh. The original
    // ordering here (narrow existsByCredentialId first, wide
    // findByCredentialId second) had it backwards: findByCredentialId's own
    // re-snapshot of `counter` left that column clean, so the mutation this
    // test exists to catch (reverting `disableIdentityMap: true` back to
    // `refresh: true` in the base class's three read overrides) passed
    // anyway. `findByCredentialId` (wide, carries `counter`) now goes FIRST
    // and `existsByCredentialId` (narrow, `fields: ['id']`, no `counter`)
    // second — mutation-proven load-bearing in the fix report. Also now
    // wrapped in `withRequestContext` (the reads previously ran at
    // describe-body top level, outside any request context).
    it('WEBAUTHN-CRED-REPO-017: a nativeUpdate inside uow.transactional is not discarded by a stale entity read earlier under a different projection', async () => {
      const { user } = createUser(testDb);
      const cred = insertCredential(user.id, { counter: 1 });
      const uow = new UnitOfWork(t.em);

      await withRequestContext(t.orm, async () => {
        // Projection A — wide, full row, carries `counter` (PK9's shape: findByCredentialId).
        const before = await creds.findByCredentialId(cred.credential_id as string);
        expect(before!.counter).toBe(1);
        // Projection B — narrow existence probe, no `counter` (PK6's shape: existsByCredentialId).
        await creds.existsByCredentialId(cred.credential_id as string);

        // The write these two reads sit alongside in the same request — PK11's
        // shape: a nativeUpdate on a row this request already read twice under
        // different projections, inside uow.transactional (whose closing flush
        // is exactly where the coordinator's ruling says a stale identity-mapped
        // entity would silently overwrite this write).
        await uow.transactional(async () => {
          await creds.updateCounterAndLastUsed(cred.id, 99);
        });
      });

      // Read again through a THIRD projection after the transaction commits
      // (PK8's shape) — if either prior read had joined the identity map,
      // this would also risk seeing a stale merged value.
      const after = await creds.findByCredentialId(cred.credential_id as string);
      expect(after!.counter).toBe(99);
      expect(rawCredential(cred.id)!.counter).toBe(99); // the raw row itself — no ambiguity from any repository-side caching
    });
  });

  describe('deleteAllForUser', () => {
    it('WEBAUTHN-CRED-REPO-016: clears every credential for one user, returns the deleted count, other users untouched', async () => {
      const { user } = createUser(testDb);
      const { user: other } = createUser(testDb);
      insertCredential(user.id);
      insertCredential(user.id);
      const kept = insertCredential(other.id);

      expect(await creds.deleteAllForUser(user.id)).toBe(2);
      expect(await creds.deleteAllForUser(user.id)).toBe(0); // already empty
      expect(testDb.prepare('SELECT id FROM webauthn_credentials').all() as Array<{ id: number }>).toEqual([
        { id: kept.id },
      ]);
    });
  });
});
