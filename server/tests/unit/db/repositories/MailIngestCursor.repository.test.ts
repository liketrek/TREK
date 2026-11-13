/**
 * The readers' cursor: one holder of a lease at a time, a lease that ran out
 * is taken over, and a run's position and error are kept for the admin.
 */
import { MailIngestCursor } from '../../../../src/db/entities/MailIngestCursor.entity';
import type { MailIngestCursorRepository } from '../../../../src/db/repositories/MailIngestCursor.repository';
import { dbNow } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let cursor: MailIngestCursorRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  cursor = t.repo(MailIngestCursor);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const T0 = dbNow(new Date('2026-11-01T10:00:00Z'));
const T1 = dbNow(new Date('2026-11-01T10:05:00Z'));
const T2 = dbNow(new Date('2026-11-01T10:10:00Z'));

describe('MailIngestCursorRepository', () => {
  it('gives the lease to one owner until it runs out or is given back', async () => {
    expect(await cursor.acquireLease('pipeline', '', 'a', T1, T0)).toBe(true);
    expect(await cursor.acquireLease('pipeline', '', 'b', T1, T0)).toBe(false);
    // The holder renews its own lease.
    expect(await cursor.acquireLease('pipeline', '', 'a', T2, T0)).toBe(true);
    // Run out: another takes it.
    expect(await cursor.acquireLease('pipeline', '', 'b', T2, dbNow(new Date('2026-11-01T10:11:00Z')))).toBe(true);

    await cursor.releaseLease('pipeline', '', 'a');
    expect(await cursor.find('pipeline', '')).toMatchObject({ lease_owner: 'b' });
    await cursor.releaseLease('pipeline', '', 'b');
    expect(await cursor.find('pipeline', '')).toMatchObject({ lease_owner: null, lease_until: null });
  });

  it('keeps the position of a good run and the error of a bad one', async () => {
    await cursor.acquireLease('imap', 'INBOX', 'a', T1, T0);
    await cursor.recordOk('imap', 'INBOX', T0, { uidValidity: 7, lastUid: 42 });
    await cursor.recordError('imap', 'INBOX', 'x'.repeat(600));
    let row = await cursor.find('imap', 'INBOX');
    expect(row).toMatchObject({ uid_validity: 7, last_uid: 42, last_ok_at: T0 });
    expect(row?.last_error).toHaveLength(500);

    await cursor.recordOk('imap', 'INBOX', T1);
    row = await cursor.find('imap', 'INBOX');
    expect(row).toMatchObject({ uid_validity: 7, last_uid: 42, last_ok_at: T1, last_error: null });

    await cursor.forgetOk('imap', 'INBOX');
    expect(await cursor.find('imap', 'INBOX')).toMatchObject({ uid_validity: 7, last_ok_at: null });
    expect(await cursor.find('cloud', '')).toBeNull();
  });
});
