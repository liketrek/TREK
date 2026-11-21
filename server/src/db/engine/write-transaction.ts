import type { DatabaseEngine } from './engine';
import type { EntityManager } from '@mikro-orm/core';

/**
 * The one way TREK opens a transaction that writes: `em.transactional()` with
 * its default `NESTED` propagation (a call inside an open transaction becomes
 * a savepoint), whose first statement takes the engine's write lock
 * (`DatabaseEngine.serializeWrites`).
 *
 * On SQLite the lock is free, since one connection already writes one
 * transaction at a time. On Postgres a pool runs transactions side by side,
 * and without the lock two of them would both read the same `MAX(...) + 1`,
 * the same count under a cap or the same "not there yet" before an insert.
 * With it, a check read inside the transaction still holds at its write.
 *
 * `UnitOfWork.transactional` is this for the Nest container; code that runs
 * outside it (the demo seed and reset) calls it directly. ESLint
 * (`trek/transactions-through-unit-of-work`) refuses any other transaction
 * under src/ outside the engine and the boot-time schema files.
 */
export function writeTransaction<T>(
  em: EntityManager,
  engine: Pick<DatabaseEngine, 'serializeWrites'>,
  fn: (em: EntityManager) => Promise<T>,
): Promise<T> {
  return em.transactional(async (tx) => {
    await engine.serializeWrites(tx);
    return fn(tx);
  });
}
