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
import type { CollabMessagesRepository } from '../../../../src/db/repositories/CollabMessages.repository';
import { createTestCollabMessagesRepo } from '../../../helpers/collab-repos';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let collabMessagesRepo: CollabMessagesRepository;

beforeAll(async () => {
  collabMessagesRepo = await createTestCollabMessagesRepo(testDb);
});
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

function insertMessage(
  tripId: number,
  userId: number,
  overrides: Partial<{ text: string; reply_to: number | null; deleted: number; created_at: string }> = {},
): number {
  const result = testDb
    .prepare(
      'INSERT INTO collab_messages (trip_id, user_id, text, reply_to, deleted, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(
      tripId,
      userId,
      overrides.text ?? 'hi',
      overrides.reply_to ?? null,
      overrides.deleted ?? 0,
      overrides.created_at ?? '2026-09-01T00:00:00.000Z',
    );
  return Number(result.lastInsertRowid);
}

function legacyPublicForShare(tripId: number): unknown {
  return testDb
    .prepare(
      'SELECT m.*, u.username, u.avatar FROM collab_messages m JOIN users u ON m.user_id = u.id WHERE m.trip_id = ? AND m.deleted = 0 ORDER BY m.created_at ASC',
    )
    .all(tripId);
}

describe('CollabMessagesRepository — share.service.ts SH16 read', () => {
  it('listPublicForShare — matches the legacy statement, deleted excluded, every nullable column both null and set', async () => {
    const { user: author } = createUser(testDb, { username: 'alice' });
    testDb.prepare('UPDATE users SET avatar = ? WHERE id = ?').run('alice.png', author.id);
    const { user: replier } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, author.id);
    const other = createTrip(testDb, author.id);

    const rootId = insertMessage(trip.id, author.id, {
      text: 'root',
      reply_to: null,
      created_at: '2026-09-01T10:00:00.000Z',
    });
    const replyId = insertMessage(trip.id, replier.id, {
      text: 'reply',
      reply_to: rootId,
      created_at: '2026-09-01T11:00:00.000Z',
    });
    insertMessage(trip.id, author.id, { text: 'gone', deleted: 1, created_at: '2026-09-01T12:00:00.000Z' });
    insertMessage(other.id, author.id, { text: 'foreign' });

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
