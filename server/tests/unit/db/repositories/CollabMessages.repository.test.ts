/**
 * Plan 4 Task 8b-4a (3h L4) — full-key `toEqual(<legacy raw>)` parity for
 * `CollabMessagesRepository.listPublicForShare` (`share.service.ts:400`
 * SH16), flagged by the 3h ledger as having no repository-level parity
 * test. The legacy statement (`CollabMessages.repository.ts`'s own
 * docstring): `SELECT m.*, u.username, u.avatar FROM collab_messages m JOIN
 * users u ON m.user_id = u.id WHERE m.trip_id = ? AND m.deleted = 0 ORDER BY
 * m.created_at` — a public share viewer never resolves a reply thread
 * through this read (no `reply_text`/`reply_username`, unlike
 * `joinedQuery`), and a deleted message (`deleted = 1`) must never surface.
 */
import { Users } from '../../../../src/db/entities/Users.entity';
import type { CollabMessagesRepository } from '../../../../src/db/repositories/CollabMessages.repository';
import { createTestCollabMessagesRepo } from '../../../helpers/collab-repos';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTrip, createUser } from '../../../helpers/factories';
import { makeCollabMessage } from '../../../helpers/factories/collab';
import { updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let collabMessagesRepo: CollabMessagesRepository;
let t: TestOrm;

beforeAll(async () => {
  collabMessagesRepo = await createTestCollabMessagesRepo(testDb);
  t = await createTestOrm(testDb);
});
beforeEach(() => resetTestDb(testDb));
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function insertMessage(
  tripId: number,
  userId: number,
  overrides: Partial<{ text: string; reply_to: number | null; deleted: number; created_at: string }> = {},
): Promise<number> {
  const message = await makeCollabMessage(t, tripId, userId, {
    text: overrides.text ?? 'hi',
    replyToRef: overrides.reply_to ?? null,
    deleted: overrides.deleted ?? 0,
    created_at: overrides.created_at ?? '2026-09-01T00:00:00.000Z',
  });
  return message.id;
}

function legacyPublicForShare(tripId: number): unknown {
  // test-sql-allow: the legacy statement is the oracle the repository read is held to.
  return testDb
    .prepare(
      'SELECT m.*, u.username, u.avatar FROM collab_messages m JOIN users u ON m.user_id = u.id WHERE m.trip_id = ? AND m.deleted = 0 ORDER BY m.created_at ASC',
    )
    .all(tripId);
}

describe('CollabMessagesRepository — share.service.ts SH16 read', () => {
  it('listPublicForShare — matches the legacy statement, deleted excluded, every nullable column both null and set', async () => {
    const { user: author } = createUser(testDb, { username: 'alice' });
    await updateRows(t, Users, { id: author.id }, { avatar: 'alice.png' });
    const { user: replier } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, author.id);
    const other = createTrip(testDb, author.id);

    const rootId = await insertMessage(trip.id, author.id, {
      text: 'root',
      reply_to: null,
      created_at: '2026-09-01T10:00:00.000Z',
    });
    const replyId = await insertMessage(trip.id, replier.id, {
      text: 'reply',
      reply_to: rootId,
      created_at: '2026-09-01T11:00:00.000Z',
    });
    await insertMessage(trip.id, author.id, { text: 'gone', deleted: 1, created_at: '2026-09-01T12:00:00.000Z' });
    await insertMessage(other.id, author.id, { text: 'foreign' });

    const legacy = legacyPublicForShare(trip.id);
    const typed = await collabMessagesRepo.listPublicForShare(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((m) => m.id)).toEqual([rootId, replyId]);
    expect(typed.map((m) => m.avatar)).toEqual(['alice.png', null]);
  });

  it('listPublicForShare — [] for a trip with no messages', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await collabMessagesRepo.listPublicForShare(trip.id)).toEqual([]);
  });
});
