/**
 * UserLookupService answers a user's name and address for domains that need
 * nothing else of auth (VacayMcp's invite and share tools).
 */
import { UserLookupModule } from '../../../../src/nest/auth-core/user-lookup.module';
import { UserLookupService } from '../../../../src/nest/auth-core/user-lookup.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeUser } from '../../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [UserLookupModule] });
});

afterAll(async () => {
  await t.close();
  db.close();
});

describe('UserLookupService', () => {
  it('USERLOOKUP-001: answers the username and email of an account', async () => {
    const { user } = await makeUser(t.get(MikroORM), { username: 'lookup-me', email: 'lookup@example.com' });
    expect(await t.get(UserLookupService).usernameAndEmail(user.id)).toEqual({
      username: 'lookup-me',
      email: 'lookup@example.com',
    });
  });

  it('USERLOOKUP-002: answers undefined for an unknown id', async () => {
    expect(await t.get(UserLookupService).usernameAndEmail(987654)).toBeUndefined();
  });
});
