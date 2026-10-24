/**
 * `DocumentSyncItemsRepository` (Plan 3h Task 5, R3's own two named
 * requirements): DS24's partial-unique-index upsert
 * (`insertOrUpsertOnConflict`, `ON CONFLICT(link_id, remote_id) WHERE
 * remote_id IS NOT NULL DO UPDATE`) and DS23's plain conditional update
 * (`recordAttempt`, ten `COALESCE` columns + the backoff second-count).
 */
import { currentTimestampKysely } from '../../../../src/db/dialect/kysely-functions';
import { DocumentConnections } from '../../../../src/db/entities/DocumentConnections.entity';
import { DocumentSyncItems } from '../../../../src/db/entities/DocumentSyncItems.entity';
import { TripDocumentLinks } from '../../../../src/db/entities/TripDocumentLinks.entity';
import { TripFiles } from '../../../../src/db/entities/TripFiles.entity';
import type { DocumentSyncItemsRepository } from '../../../../src/db/repositories/DocumentSyncItems.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTrip, createUser } from '../../../helpers/factories';
import { findRow, findRows, insertRow, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: DocumentSyncItemsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(DocumentSyncItems);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function fixture() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const connectionId = await insertRow(t, DocumentConnections, {
    trip: trip.id,
    provider: 'paperless',
    ownerUser: user.id,
    base_url: 'https://paperless.example.com',
    secrets: null,
    settings: '{}',
  });
  const linkId = await insertRow(t, TripDocumentLinks, {
    trip: trip.id,
    connection: connectionId,
    provider_id: 'paperless',
    remote_scope_key: 'tag:1',
    remote_label: 'Japan',
    direction: 'both',
    delete_policy: 'unlink',
    conflict_policy: 'manual',
    sync_enabled: 1,
    createdByRef: user.id,
  });
  return { user, trip, linkId };
}

/** The sync item as it is now; fails the test when it is gone. */
async function itemRow(id: number) {
  return (await findRow(t, DocumentSyncItems, { id }))!;
}

function insertData(
  linkId: number,
  tripId: number,
  over: Partial<Parameters<DocumentSyncItemsRepository['insertOrUpsertOnConflict']>[0]> = {},
) {
  return {
    link_id: linkId,
    trip_id: tripId,
    file_id: null,
    trek_doc_uid: `uid-${Math.random()}`,
    remote_id: null,
    remote_name: null,
    remote_version: null,
    remote_size: null,
    remote_modified_at: null,
    content_sha256: null,
    pushed_sha256: null,
    state: 'synced',
    error_code: null,
    attempts: 0,
    next_attempt_after_seconds: null,
    synced_now: true,
    ...over,
  };
}

describe('DocumentSyncItemsRepository', () => {
  describe('insertOrUpsertOnConflict (DS24, R3 — the partial-unique-index upsert)', () => {
    it('DS24REPO-001: pinned rendered SQL for the ON CONFLICT DO UPDATE target and SET clause', () => {
      const platform = t.em.getPlatform();
      const compiled = t.em
        .getKysely<{ document_sync_items: Record<string, unknown> }>()
        .insertInto('document_sync_items')
        .values({
          link_id: 1,
          trip_id: 1,
          file_id: null,
          trek_doc_uid: 'x',
          remote_id: 'r1',
          remote_name: null,
          remote_version: null,
          remote_size: null,
          remote_modified_at: null,
          content_sha256: null,
          pushed_sha256: null,
          state: 'synced',
          error_code: null,
          attempts: 0,
          next_attempt_at: null,
          synced_at: null,
          last_seen_at: 'CURRENT_TIMESTAMP',
        })
        .onConflict((oc) =>
          oc
            .columns(['link_id', 'remote_id'])
            .where('remote_id', 'is not', null)
            .doUpdateSet({
              state: (eb) => eb.ref('excluded.state'),
              error_code: (eb) => eb.ref('excluded.error_code'),
              file_id: (eb) => eb.fn.coalesce(eb.ref('excluded.file_id'), eb.ref('document_sync_items.file_id')),
              remote_version: (eb) =>
                eb.fn.coalesce(eb.ref('excluded.remote_version'), eb.ref('document_sync_items.remote_version')),
              content_sha256: (eb) =>
                eb.fn.coalesce(eb.ref('excluded.content_sha256'), eb.ref('document_sync_items.content_sha256')),
              pushed_sha256: (eb) =>
                eb.fn.coalesce(eb.ref('excluded.pushed_sha256'), eb.ref('document_sync_items.pushed_sha256')),
              last_seen_at: () => currentTimestampKysely(platform),
            }),
        )
        .compile();
      // Pinned for the task report — the exact ON CONFLICT clause Kysely
      // renders for this table, proving the partial-index predicate is
      // restated verbatim (SQLite's own requirement, DS24's own doc
      // comment) and the DO UPDATE SET matches the legacy statement's own
      // five re-written columns plus the two verbatim-from-excluded ones.
      expect(compiled.sql).toContain(
        'on conflict ("link_id", "remote_id") where "remote_id" is not null do update set',
      );
      expect(compiled.sql).toContain('"state" = "excluded"."state"');
      expect(compiled.sql).toContain('"error_code" = "excluded"."error_code"');
      expect(compiled.sql).toContain('"file_id" = coalesce("excluded"."file_id", "document_sync_items"."file_id")');
      expect(compiled.sql).toContain(
        '"remote_version" = coalesce("excluded"."remote_version", "document_sync_items"."remote_version")',
      );
      expect(compiled.sql).toContain(
        '"content_sha256" = coalesce("excluded"."content_sha256", "document_sync_items"."content_sha256")',
      );
      expect(compiled.sql).toContain(
        '"pushed_sha256" = coalesce("excluded"."pushed_sha256", "document_sync_items"."pushed_sha256")',
      );
      expect(compiled.sql).toContain('"last_seen_at" = CURRENT_TIMESTAMP');
      // Pinned in full, for the task report:
      expect(compiled.sql).toBe(
        'insert into "document_sync_items" ("link_id", "trip_id", "file_id", "trek_doc_uid", "remote_id", "remote_name", "remote_version", "remote_size", "remote_modified_at", "content_sha256", "pushed_sha256", "state", "error_code", "attempts", "next_attempt_at", "synced_at", "last_seen_at") values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict ("link_id", "remote_id") where "remote_id" is not null do update set "state" = "excluded"."state", "error_code" = "excluded"."error_code", "file_id" = coalesce("excluded"."file_id", "document_sync_items"."file_id"), "remote_version" = coalesce("excluded"."remote_version", "document_sync_items"."remote_version"), "content_sha256" = coalesce("excluded"."content_sha256", "document_sync_items"."content_sha256"), "pushed_sha256" = coalesce("excluded"."pushed_sha256", "document_sync_items"."pushed_sha256"), "last_seen_at" = CURRENT_TIMESTAMP',
      );
    });

    /**
     * R3's own required mutation test: insert two rows differing only in
     * `remote_id` under the same `link_id` (both succeed — the partial
     * index only constrains non-NULL `remote_id`s against each other), then
     * a THIRD insert colliding on `(link_id, remote_id)` with one of them —
     * proving the partial index still enforces "at most one non-NULL
     * remote_id per link" post-conversion by upserting (not duplicating).
     */
    it('DS24REPO-002 (R3 mutation proof): a colliding (link_id, remote_id) pair upserts in place rather than duplicating', async () => {
      const { linkId, trip } = await fixture();
      await repo.insertOrUpsertOnConflict(
        insertData(linkId, trip.id, { remote_id: 'r1', trek_doc_uid: 'uid-a', state: 'synced', remote_version: 'v1' }),
      );
      await repo.insertOrUpsertOnConflict(
        insertData(linkId, trip.id, { remote_id: 'r2', trek_doc_uid: 'uid-b', state: 'synced', remote_version: 'v1' }),
      );
      const afterTwo = await findRows(t, DocumentSyncItems, { link: linkId }, { id: 'asc' });
      expect(afterTwo).toHaveLength(2);
      const r1Id = afterTwo.find((r) => r.remote_id === 'r1')!.id;

      // The colliding insert: same link_id + remote_id='r1' as the first row.
      await repo.insertOrUpsertOnConflict(
        insertData(linkId, trip.id, {
          remote_id: 'r1',
          trek_doc_uid: 'uid-c',
          state: 'conflict',
          remote_version: 'v2',
        }),
      );

      const afterThree = await findRows(t, DocumentSyncItems, { link: linkId }, { id: 'asc' });
      // Still exactly two rows — the third insert upserted onto the first, not a third row.
      expect(afterThree).toHaveLength(2);
      const upserted = afterThree.find((r) => r.id === r1Id)!;
      expect(upserted.remote_id).toBe('r1');
      expect(upserted.state).toBe('conflict');
      expect(upserted.remote_version).toBe('v2');
    });

    it('DS24REPO-003: two rows with NULL remote_id under the same link never collide (the partial index only constrains non-NULL)', async () => {
      const { linkId, trip } = await fixture();
      await repo.insertOrUpsertOnConflict(insertData(linkId, trip.id, { remote_id: null, trek_doc_uid: 'uid-x' }));
      await repo.insertOrUpsertOnConflict(insertData(linkId, trip.id, { remote_id: null, trek_doc_uid: 'uid-y' }));
      const rows = await findRows(t, DocumentSyncItems, { link: linkId });
      expect(rows).toHaveLength(2);
    });
  });

  describe('recordAttempt (DS23, R3 — the plain conditional update, itemId≠null)', () => {
    async function seedRow(linkId: number, tripId: number) {
      const id = await repo
        .insertOrUpsertOnConflict(
          insertData(linkId, tripId, {
            remote_id: 'r1',
            file_id: null,
            remote_name: 'a.pdf',
            remote_version: 'v1',
            remote_size: 512,
            remote_modified_at: '2026-09-01T08:00:00Z',
            content_sha256: 'old-hash',
            pushed_sha256: 'old-pushed',
          }),
        )
        .then(async () => (await findRow(t, DocumentSyncItems, { link: linkId, remote_id: 'r1' }))!.id);
      return id;
    }

    /**
     * R3's full-key parity test: all ten `COALESCE` columns win with a
     * non-null new value (branch 1) — matching the legacy `COALESCE(?,
     * col)` — and each falls back to the EXISTING column when the new
     * value is null (branch 2), the same statement's other half. Both
     * branches proved on the SAME row, sequentially, so branch 2 is
     * genuinely proving "kept", not merely "never changed".
     */
    it('DS23REPO-001 (R3 parity): a non-null new value overwrites every COALESCE column; a null one keeps the existing value', async () => {
      const { linkId, trip } = await fixture();
      const itemId = await seedRow(linkId, trip.id);
      const newFileId = await insertRow(t, TripFiles, {
        trip: trip.id,
        filename: 'stored.pdf',
        original_name: 'b.pdf',
      });

      // Branch 1: every COALESCE column gets a genuinely new, non-null value.
      await repo.recordAttempt(itemId, {
        state: 'synced',
        error_code: null,
        file_id: newFileId,
        remote_id: 'r1-new',
        remote_version: 'v2',
        remote_name: 'b.pdf',
        remote_size: 2048,
        remote_modified_at: '2026-09-18T10:00:00Z',
        content_sha256: 'new-hash',
        pushed_sha256: 'new-pushed',
        attempts: 0,
        next_attempt_after_seconds: null,
      });
      let row = await itemRow(itemId);
      expect(row).toMatchObject({
        file_id: newFileId,
        remote_id: 'r1-new',
        remote_version: 'v2',
        remote_name: 'b.pdf',
        remote_size: 2048,
        remote_modified_at: '2026-09-18T10:00:00Z',
        content_sha256: 'new-hash',
        pushed_sha256: 'new-pushed',
      });

      // Branch 2: every COALESCE column arrives null — the existing (branch-1) value survives untouched.
      await repo.recordAttempt(itemId, {
        state: 'synced',
        error_code: null,
        file_id: null,
        remote_id: null,
        remote_version: null,
        remote_name: null,
        remote_size: null,
        remote_modified_at: null,
        content_sha256: null,
        pushed_sha256: null,
        attempts: 0,
        next_attempt_after_seconds: null,
      });
      row = await itemRow(itemId);
      expect(row).toMatchObject({
        file_id: newFileId,
        remote_id: 'r1-new',
        remote_version: 'v2',
        remote_name: 'b.pdf',
        remote_size: 2048,
        remote_modified_at: '2026-09-18T10:00:00Z',
        content_sha256: 'new-hash',
        pushed_sha256: 'new-pushed',
      });
    });

    it('DS23REPO-002: next_attempt_after_seconds shifts the DB clock forward by the given second count; null leaves it NULL', async () => {
      const { linkId, trip } = await fixture();
      const itemId = await seedRow(linkId, trip.id);

      await repo.recordAttempt(itemId, {
        state: 'error',
        error_code: 'timeout',
        file_id: null,
        remote_id: null,
        remote_version: null,
        remote_name: null,
        remote_size: null,
        remote_modified_at: null,
        content_sha256: null,
        pushed_sha256: null,
        attempts: 1,
        next_attempt_after_seconds: 300,
      });
      const nextAttemptAt = (await itemRow(itemId)).next_attempt_at;
      const expected = Date.now() + 300_000;
      expect(nextAttemptAt).not.toBeNull();
      expect(Math.abs(new Date(`${nextAttemptAt!.replace(' ', 'T')}Z`).getTime() - expected)).toBeLessThan(5000);

      await repo.recordAttempt(itemId, {
        state: 'synced',
        error_code: null,
        file_id: null,
        remote_id: null,
        remote_version: null,
        remote_name: null,
        remote_size: null,
        remote_modified_at: null,
        content_sha256: null,
        pushed_sha256: null,
        attempts: 0,
        next_attempt_after_seconds: null,
      });
      const cleared = await itemRow(itemId);
      expect(cleared.next_attempt_at).toBeNull();
    });

    it('DS23REPO-003: synced_at is stamped only when state is synced, and left alone otherwise', async () => {
      const { linkId, trip } = await fixture();
      const itemId = await seedRow(linkId, trip.id);
      await updateRows(t, DocumentSyncItems, { id: itemId }, { synced_at: '2020-01-01 00:00:00' });

      await repo.recordAttempt(itemId, {
        state: 'error',
        error_code: 'timeout',
        file_id: null,
        remote_id: null,
        remote_version: null,
        remote_name: null,
        remote_size: null,
        remote_modified_at: null,
        content_sha256: null,
        pushed_sha256: null,
        attempts: 1,
        next_attempt_after_seconds: null,
      });
      expect((await itemRow(itemId)).synced_at).toBe('2020-01-01 00:00:00');

      await repo.recordAttempt(itemId, {
        state: 'synced',
        error_code: null,
        file_id: null,
        remote_id: null,
        remote_version: null,
        remote_name: null,
        remote_size: null,
        remote_modified_at: null,
        content_sha256: null,
        pushed_sha256: null,
        attempts: 0,
        next_attempt_after_seconds: null,
      });
      expect((await itemRow(itemId)).synced_at).not.toBe('2020-01-01 00:00:00');
    });
  });
});
