import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

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
 */
@Injectable()
export class UnitOfWork {
  constructor(private readonly em: EntityManager) {}

  transactional<T>(fn: () => Promise<T>): Promise<T> {
    return this.em.transactional(() => fn());
  }
}
