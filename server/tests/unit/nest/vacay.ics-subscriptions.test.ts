import * as vacayIcs from '../../../src/nest/vacay/vacay-ics';
import { VacayModule } from '../../../src/nest/vacay/vacay.module';
import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { asLegacyResult } from '../../helpers/domain-error';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const url = 'https://example.com/holidays.ics';
const events = [{ start: '2026-12-25', end: '2026-12-26', title: 'Holiday' }];
let t: TestModule;
let svc: VacayService;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [VacayModule] });
  svc = t.get(VacayService);
});

afterEach(() => vi.restoreAllMocks());

afterAll(async () => {
  await t.close();
  db.close();
});

async function setupUserWithPlan() {
  const { user } = await makeUser(t.get(MikroORM));
  return { user, plan: await svc.getOwnPlan(user.id) };
}

describe('ICS subscription creation', () => {
  it('rejects a repeated URL in the same plan without changing its subscription', async () => {
    const { user, plan } = await setupUserWithPlan();
    vi.spyOn(vacayIcs, 'fetchIcs').mockResolvedValue(events);
    const added = await svc.addIcsCalendar(plan.id, user.id, url, 'Original', '#a5f3fc');

    expect(await asLegacyResult(svc.addIcsCalendar(plan.id, user.id, url, 'Duplicate', '#fecaca'))).toEqual({
      error: 'Calendar URL is already subscribed',
      status: 400,
    });
    expect(await svc.listIcsCalendars(plan.id, user.id)).toEqual([
      expect.objectContaining({ id: added.id, url, label: 'Original', color: '#a5f3fc' }),
    ]);
  });

  it('allows different plans to subscribe to the same URL', async () => {
    const first = await setupUserWithPlan();
    const second = await setupUserWithPlan();
    vi.spyOn(vacayIcs, 'fetchIcs').mockResolvedValue(events);

    const a = await svc.addIcsCalendar(first.plan.id, first.user.id, url, 'First', '#a5f3fc');
    const b = await svc.addIcsCalendar(second.plan.id, second.user.id, url, 'Second', '#a5f3fc');

    expect(a.id).not.toBe(b.id);
    expect(await svc.listIcsCalendars(second.plan.id, second.user.id)).toEqual([
      expect.objectContaining({ id: b.id, url }),
    ]);
  });

  it('creates no subscription or settings notification for an empty calendar', async () => {
    const { user, plan } = await setupUserWithPlan();
    vi.spyOn(vacayIcs, 'fetchIcs').mockResolvedValue([]);
    t.realtime.broadcastToUserMock.mockClear();

    expect(await asLegacyResult(svc.addIcsCalendar(plan.id, user.id, url, 'Empty', '#a5f3fc'))).toEqual({
      error: 'Calendar contains no supported all-day events',
      status: 400,
    });
    expect(await svc.listIcsCalendars(plan.id, user.id)).toEqual([]);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });

  it('creates no subscription or settings notification when the initial fetch fails', async () => {
    const { user, plan } = await setupUserWithPlan();
    vi.spyOn(vacayIcs, 'fetchIcs').mockRejectedValue(new Error('Calendar unavailable'));
    t.realtime.broadcastToUserMock.mockClear();

    expect(await asLegacyResult(svc.addIcsCalendar(plan.id, user.id, url, 'Unavailable', '#a5f3fc'))).toEqual({
      error: 'Calendar unavailable',
      status: 400,
    });
    expect(await svc.listIcsCalendars(plan.id, user.id)).toEqual([]);
    expect(t.realtime.broadcastToUserMock).not.toHaveBeenCalled();
  });
});
