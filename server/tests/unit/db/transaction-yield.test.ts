/**
 * Program rule 24 (`docs/superpowers/plans/2026-09-21-orm-migration-program.md`),
 * added by Plan 3c Task 9's whole-plan review (reviewer A, ruling 5): "transactional
 * bodies await DB work only." The server holds ONE better-sqlite3 connection, shared
 * by MikroORM's Kysely-backed driver (`orm-driver.ts`'s `BoundSqliteDriver`) and by
 * any code holding the raw `better-sqlite3` handle directly (Plan 4 Task 4 deleted
 * `DatabaseService`, the class that used to wrap `db.prepare` statements this way — the
 * hazard below is unchanged, since `MaintenanceRepository`/`DemoRepository`'s own
 * `connection.execute()` calls and the still-exported `db` Proxy in
 * `db/database.ts` are the same kind of direct, non-Kysely-queued access). This
 * file pins the two concrete behaviours that measurement (fork A2, real
 * `UnitOfWork` + `withRequestContext` + the bound driver, no mocks) found when a
 * `uow.transactional` body is left open across a real `await` (which no converted
 * service does today — a static scan of all 131 `.transactional(` call sites found
 * none awaiting non-DB I/O; this file's own transactional bodies hold one open
 * ONLY to observe the window, which is exactly the shape a future violation of
 * rule 24 would take):
 *
 *   A. Another request's ORM/Kysely statement QUEUES behind the open transaction —
 *      Kysely's own `ConnectionMutex` for SQLite serialises every statement onto
 *      the one connection, so there is no interleaving: the queued statement's
 *      result only becomes observable after the holder's transaction settles.
 *   B. A raw `better-sqlite3` statement (`db.prepare` then `.get`/`.run`, the same
 *      shape `DatabaseService` used to wrap) issued while that same transaction is
 *      open does NOT queue — it shares the connection directly, with no mutex of
 *      its own, so it runs INSIDE the open transaction: a "dirty read" of the
 *      transaction's uncommitted write, which then reverts to its pre-transaction
 *      value the moment the holder rolls back (the hazard rule 24 exists to keep
 *      out of production code, by keeping every transactional body DB-only).
 *
 * Both requests run through `withRequestContext` (MikroORM's `RequestContext`,
 * AsyncLocalStorage-based), the same per-request fork every real HTTP/MCP/WS/cron
 * entrypoint uses — not two calls sharing one ambient EntityManager, which would
 * make MikroORM treat the second as a SAVEPOINT of the first (`UnitOfWork`'s own
 * docstring: NESTED propagation) rather than the independent, connection-mutex-
 * queued transaction two unrelated concurrent requests actually are.
 */
import { Trips } from '../../../src/db/entities/Trips.entity';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import { withRequestContext } from '../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser, createTrip } from '../../helpers/factories';
import { findRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const testDb = createSnapshotTestDb();
let t: TestOrm;
let trips: TripsRepository;
let uow: UnitOfWork;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  trips = t.repo(Trips);
  uow = new UnitOfWork(t.em);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('transaction yield (rule 24)', () => {
  it("A — another request's ORM statement queues behind an open transaction: no interleaving, and its result only becomes observable after the holder commits", async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { end_date: '2026-01-01' });

    const order: string[] = [];
    const HOLD_MS = 40;

    // Request 1: opens a transaction, holds it open across a real `await` (the
    // window this test needs to observe — never how production code shapes a
    // transactional body; see the file docstring), then writes and commits.
    const holder = withRequestContext(t.orm, async () => {
      return uow.transactional(async () => {
        order.push('holder:open');
        await sleep(HOLD_MS);
        await trips.setEndDate(trip.id, '2099-12-31');
        order.push('holder:commit');
      });
    });

    // Give the holder a tick to actually open its transaction before the
    // second "request" starts, so the queued statement is provably issued
    // while the first is open, not racing to start first itself.
    await sleep(5);

    // Request 2: an unrelated concurrent request's plain ORM read (no
    // transaction of its own) for the SAME row, through its own forked
    // context — the shape `TripAccessGuard`/`findAccessible` reads take.
    const queued = withRequestContext(t.orm, async () => {
      order.push('queued:issue');
      const row = await trips.getTitle(trip.id);
      order.push('queued:resolve');
      return row;
    });

    await Promise.all([holder, queued]);

    // The queued read was ISSUED while the holder was still open (between
    // "holder:open" and "holder:commit")…
    expect(order.indexOf('queued:issue')).toBeGreaterThan(order.indexOf('holder:open'));
    expect(order.indexOf('queued:issue')).toBeLessThan(order.indexOf('holder:commit'));
    // …but it only RESOLVED after the holder committed — the connection
    // mutex queued it rather than interleaving it inside the open transaction.
    expect(order.indexOf('queued:resolve')).toBeGreaterThan(order.indexOf('holder:commit'));
  });

  it('B — a raw DatabaseService read AND write, issued from a SECOND, unrelated request while a transaction is open, run INSIDE it (a dirty read of the uncommitted write; the raw write is gone once the holder rolls back) — L-3, Task 9 fix round 2', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Original Title', end_date: '2026-01-01' });

    let dirtyRead: string | null | undefined;
    const HOLD_MS = 40;

    // Request 1 (the holder): opens a transaction, writes, holds it open
    // across a real `await`, then forces a rollback.
    const holder = withRequestContext(t.orm, async () => {
      await expect(
        uow.transactional(async () => {
          await trips.setEndDate(trip.id, '2099-12-31');
          await sleep(HOLD_MS);
          // Force a rollback: the write above, and anything the second
          // request below lands inside this transaction, must not survive.
          throw new Error('forced rollback (rule 24 probe)');
        }),
      ).rejects.toThrow('forced rollback');
    });

    // Give the holder a tick to actually open its transaction and perform
    // its write before the second, UNRELATED request starts — the queued
    // statement/raw statement below must provably run while the first is
    // still open, not race to start first itself (same pattern as probe A).
    await sleep(5);

    // Request 2: a fully separate concurrent request, through its OWN
    // forked `withRequestContext` — not a call from inside the holder's own
    // body (L-3: that would only prove a request can dirty-read its own
    // uncommitted write, not the cross-request hazard rule 24 names). It
    // issues a raw `better-sqlite3` READ and WRITE directly against the
    // shared handle (the same shape `DatabaseService.get`/`.run` used to
    // wrap — `this.conn.prepare` then `.get`/`.run`, bypassing MikroORM/
    // Kysely entirely). Neither is behind Kysely's `ConnectionMutex` (probe
    // A), so both share the one better-sqlite3 connection directly and run
    // INSIDE the holder's still-open, uncommitted transaction.
    await withRequestContext(t.orm, async () => {
      // test-sql-allow: a raw read on the shared handle, outside Kysely's mutex, is the hazard this probe measures.
      const row = testDb.prepare('SELECT end_date FROM trips WHERE id = ?').get(trip.id) as
        { end_date: string | null } | undefined;
      dirtyRead = row?.end_date;
      // test-sql-allow: a raw write on the shared handle, outside Kysely's mutex, is the hazard this probe measures.
      testDb.prepare('UPDATE trips SET title = ? WHERE id = ?').run('DIRTY-WRITE-MARKER', trip.id);
    });

    await holder;

    // The second request's raw read saw the holder's uncommitted write — a
    // genuine cross-request dirty read, proving the raw path is NOT queued
    // behind the transaction the way an ORM/Kysely statement is (probe A).
    expect(dirtyRead).toBe('2099-12-31');
    // …and the second request's own raw UPDATE, though it returned with no
    // error and no queueing (an apparent "success"), was made INSIDE the
    // holder's transaction — it is silently erased the moment the holder
    // rolls back. This is exactly the hazard rule 24 keeps out of
    // production code: a raw statement issued mid-transaction by ANOTHER
    // request would otherwise report success on a write this rollback just
    // undid.
    const after = (await findRow(t, Trips, { id: trip.id }))!;
    expect(after.end_date).toBe('2026-01-01');
    expect(after.title).toBe('Original Title');
  });

  it('I — a second, unrelated transaction opened while the first is still open does not error (no nested-BEGIN exception); it queues and commits its own write once the first settles', async () => {
    const { user } = createUser(testDb);
    const tripA = createTrip(testDb, user.id, { end_date: '2026-01-01' });
    const tripB = createTrip(testDb, user.id, { end_date: '2026-01-01' });
    const HOLD_MS = 40;

    const first = withRequestContext(t.orm, () =>
      uow.transactional(async () => {
        await sleep(HOLD_MS);
        await trips.setEndDate(tripA.id, '2099-01-01');
      }),
    );
    // Give the first a moment to actually open before the second starts, so
    // the second's own BEGIN is provably attempted while one is already open.
    await sleep(5);
    const second = withRequestContext(t.orm, () =>
      uow.transactional(async () => {
        await trips.setEndDate(tripB.id, '2099-02-01');
      }),
    );

    await expect(Promise.all([first, second])).resolves.toBeDefined();

    const rowA = (await findRow(t, Trips, { id: tripA.id }))!;
    const rowB = (await findRow(t, Trips, { id: tripB.id }))!;
    expect(rowA.end_date).toBe('2099-01-01');
    expect(rowB.end_date).toBe('2099-02-01');
  });
});
