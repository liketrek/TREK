import type { DatabaseEngine } from '../../db/engine';
import { writeTransaction } from '../../db/engine/write-transaction';
import { DATABASE_ENGINE } from './database-engine.module';
import { EntityManager } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';

/**
 * The one way a service opens a transaction.
 *
 * Wraps `em.transactional()` with its default `NESTED` propagation: a call made
 * while a transaction is open becomes a savepoint, which is what better-sqlite3's
 * nested `transaction()` did and what the services were written against.
 *
 * Repositories injected by Nest (and the test helper's `t.repo`) resolve the
 * transactional fork through MikroORM's TransactionContext, so nothing has to
 * be passed down. A manually forked EntityManager does not: `fork()` defaults
 * to `useContext: false`, so its `getContext()` returns itself, and a repository
 * built on it would write outside the transaction, on a second connection the
 * transaction is holding.
 *
 * Never awaits network I/O inside: the SQLite connection is one Kysely client
 * with a mutex, and an open transaction holds it for every other request.
 *
 * The services read `MAX(...) + 1` inside these transactions on the strength
 * of SQLite's single writer. On Postgres a pool of connections would let two
 * of them read the same MAX, so every transaction first takes the engine's
 * write lock (`DatabaseEngine.serializeWrites`, through `writeTransaction`),
 * which keeps that guarantee. No other transaction is opened under src/
 * (ESLint, `trek/transactions-through-unit-of-work`), so a check read
 * inside one of these is never raced by a write outside the lock.
 */
@Injectable()
export class UnitOfWork {
  constructor(
    private readonly em: EntityManager,
    @Inject(DATABASE_ENGINE) private readonly engine: DatabaseEngine,
  ) {}

  transactional<T>(fn: () => Promise<T>): Promise<T> {
    return writeTransaction(this.em, this.engine, () => fn());
  }
}
