/**
 * VacayUserSettingsRepository.findForUser — Plan 4 Task 8b-2 item 3 (3f L6
 * carry): "user year settings and settings" (VC3, `getUserYearSettings`)
 * had no repository-level `toEqual(<legacy raw>)` parity test.
 */
import { VacayUserSettings } from '../../../../src/db/entities/VacayUserSettings.entity';
import type { VacayUserSettingsRepository } from '../../../../src/db/repositories/VacayUserSettings.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VacayUserSettingsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VacayUserSettings);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('VacayUserSettingsRepository.findForUser (VC3, getUserYearSettings)', () => {
  it('VACAYUSETREPO-001: matches SELECT * FROM vacay_user_settings WHERE user_id = ? run raw, hire_date both NULL and SET', async () => {
    const { user } = createUser(testDb);
    testDb
      .prepare(
        'INSERT INTO vacay_user_settings (user_id, year_type, year_start_month, year_start_day, hire_date) VALUES (?, ?, ?, ?, ?)',
      )
      .run(user.id, 'fiscal', 4, 1, '2020-06-15');

    const legacy = testDb.prepare('SELECT * FROM vacay_user_settings WHERE user_id = ?').get(user.id);
    expect(await repo.findForUser(user.id)).toEqual(legacy);
  });

  it('VACAYUSETREPO-002: hire_date NULL matches the legacy row too', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO vacay_user_settings (user_id) VALUES (?)').run(user.id);

    const legacy = testDb.prepare('SELECT * FROM vacay_user_settings WHERE user_id = ?').get(user.id);
    expect(await repo.findForUser(user.id)).toEqual(legacy);
  });

  it('VACAYUSETREPO-003: null when the user has no settings row (schema defaults apply at the service layer)', async () => {
    const { user } = createUser(testDb);
    expect(await repo.findForUser(user.id)).toBeNull();
  });
});
