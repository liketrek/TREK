/**
 * A person's switches for the mail import: no row until something changes,
 * and a write names only the switches it changes.
 */
import { MailIngestPrefs } from '../../../../src/db/entities/MailIngestPrefs.entity';
import type { MailIngestPrefsRepository } from '../../../../src/db/repositories/MailIngestPrefs.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let prefs: MailIngestPrefsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  prefs = t.repo(MailIngestPrefs);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('MailIngestPrefsRepository', () => {
  it('has no row until a switch changes, then the defaults for the others', async () => {
    const { user } = await makeUser(t);
    expect(await prefs.findForUser(user.id)).toBeNull();

    await prefs.upsertForUser(user.id, { auto_add: 0 });
    expect(await prefs.findForUser(user.id)).toMatchObject({ enabled: 1, ai_enabled: 1, auto_add: 0 });

    await prefs.upsertForUser(user.id, { ai_enabled: 0 });
    expect(await prefs.findForUser(user.id)).toMatchObject({ enabled: 1, ai_enabled: 0, auto_add: 0 });
  });

  it('writes nothing for an empty change', async () => {
    const { user } = await makeUser(t);
    await prefs.upsertForUser(user.id, {});
    expect(await prefs.findForUser(user.id)).toBeNull();
  });
});
