import { Days } from '../../../../src/db/entities/Days.entity';
import type { DaysRepository } from '../../../../src/db/repositories/Days.repository';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTrip, createUser } from '../../../helpers/factories';
import { countRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let uow: UnitOfWork;
let days: DaysRepository;

/**
 * `t.em` is the ORM's context-resolving global EntityManager and `t.repo()`
 * builds on it, which is what makes this suite meaningful: the repository resolves the
 * transactional fork out of MikroORM's TransactionContext, exactly as a
 * Nest-injected repository does. A manually forked EntityManager would not
 * (`fork()` defaults to `useContext: false`) — it would write outside the open
 * transaction, on a second connection the transaction is holding, and deadlock
 * on Kysely's connection mutex. See the docstring on `createTestOrm`.
 */
beforeAll(async () => {
  t = await createTestOrm(testDb);
  uow = new UnitOfWork(t.em);
  days = t.repo(Days);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const countDays = (tripId: number): Promise<number> => countRows(t, Days, { trip: tripId });

describe('UnitOfWork.transactional', () => {
  it('UOW-001: a throw rolls every statement back', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await expect(
      uow.transactional(async () => {
        await days.createDay({ trip_id: trip.id, day_number: 1, date: null, notes: null });
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await countDays(trip.id)).toBe(0);
  });

  it('UOW-002: an inner transaction is a savepoint — its failure leaves the outer writes intact', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await uow.transactional(async () => {
      await days.createDay({ trip_id: trip.id, day_number: 1, date: null, notes: null });
      await uow
        .transactional(async () => {
          await days.createDay({ trip_id: trip.id, day_number: 2, date: null, notes: null });
          throw new Error('inner');
        })
        .catch(() => undefined);
    });
    expect(await countDays(trip.id)).toBe(1);
  });

  it('UOW-003: concurrent transactions serialise on the one connection instead of throwing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const order: string[] = [];
    const tx = (label: string, dayNumber: number) =>
      uow.transactional(async () => {
        order.push(`${label}:in`);
        await days.createDay({ trip_id: trip.id, day_number: dayNumber, date: null, notes: null });
        await new Promise((r) => setTimeout(r, 20));
        order.push(`${label}:out`);
      });
    await Promise.all([tx('a', 1), tx('b', 2)]);
    expect(await countDays(trip.id)).toBe(2);
    // The second never enters before the first leaves.
    expect(order.indexOf('b:in')).toBeGreaterThan(order.indexOf('a:out'));
  });

  it('UOW-004: a read outside the transaction waits for it and then sees the commit', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tx = uow.transactional(async () => {
      await days.createDay({ trip_id: trip.id, day_number: 1, date: null, notes: null });
      await new Promise((r) => setTimeout(r, 20));
    });
    // A separate fork = a separate acquirer of the connection. It waits on the
    // ConnectionMutex instead of deadlocking because nothing inside the
    // transaction waits on it: the writer's own timer resolves regardless.
    const reader = t.orm.em.fork().getRepository(Days);
    const seen = await reader.listByTrip(trip.id);
    await tx;
    expect(seen).toHaveLength(1);
  });
});
