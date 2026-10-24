/**
 * TourDraftsService: the Tours planner's unsaved draft on the account, one per
 * user and trip. The service comes out of ToursModule over a snapshot test db;
 * rows are seeded through the ORM factories.
 */
import { TourDrafts } from '../../../src/db/entities/TourDrafts.entity';
import { TourDraftsService } from '../../../src/nest/tours/tour-drafts.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let drafts: TourDraftsService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  drafts = t.get(TourDraftsService);
});
beforeEach(() => {
  resetTestDb(db);
  t.realtime.broadcastMock.mockClear();
});
afterAll(async () => {
  await t.close();
  db.close();
});

async function fixture() {
  const { user } = await makeUser(orm());
  const { user: other } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  return { user, other, trip };
}

describe('TourDraftsService', () => {
  it('TDRAFT-SVC-001: reads null before a draft is kept, then the kept draft; the latest write wins', async () => {
    const { user, trip } = await fixture();
    expect(await drafts.read(trip.id, user.id)).toEqual({ draft: null });

    const first = await drafts.keep(trip.id, user.id, { payload: '{"version":11,"name":"First"}' });
    expect(first).toEqual({ draft: { payload: '{"version":11,"name":"First"}', updated_at: expect.any(String) } });
    const second = await drafts.keep(trip.id, user.id, { payload: '{"version":11,"name":"Second"}' });
    expect(await drafts.read(trip.id, user.id)).toEqual(second);
    expect(second.draft?.payload).toBe('{"version":11,"name":"Second"}');
    expect(await countRows(orm(), TourDrafts)).toBe(1);
  });

  it("TDRAFT-SVC-002: one traveller never reads another one's draft, and nothing is broadcast", async () => {
    const { user, other, trip } = await fixture();
    await drafts.keep(trip.id, user.id, { payload: '{"name":"Mine"}' });
    expect(await drafts.read(trip.id, other.id)).toEqual({ draft: null });
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('TDRAFT-SVC-003: forgetting answers success, with a draft and without one, and leaves the others', async () => {
    const { user, other, trip } = await fixture();
    await drafts.keep(trip.id, user.id, { payload: '{"name":"Mine"}' });
    await drafts.keep(trip.id, other.id, { payload: '{"name":"Theirs"}' });

    expect(await drafts.forget(trip.id, user.id)).toEqual({ success: true });
    expect(await drafts.forget(trip.id, user.id)).toEqual({ success: true });
    expect(await drafts.read(trip.id, user.id)).toEqual({ draft: null });
    expect((await drafts.read(trip.id, other.id)).draft?.payload).toBe('{"name":"Theirs"}');
  });
});
