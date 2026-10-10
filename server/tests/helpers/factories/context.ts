import { withRequestContext } from '../../../src/nest/database/request-context';
import type { EntityManager } from '@mikro-orm/core';

/**
 * Anything carrying the ORM's global EntityManager: `app.get(MikroORM)` in a
 * `buildApp()` suite, the `TestOrm` from `createTestOrm(db)` in a unit or
 * partial-module suite, or a `MikroORM` a test built itself.
 */
export interface FactoryOrm {
  em: EntityManager;
}

/**
 * Runs one factory step in a request context of its own, the way production
 * runs an MCP call or a cron tick (`withRequestContext`).
 *
 * The app's ORM keeps `allowGlobalContext: false`, so a write outside a
 * context would be refused; and a fresh fork per step means no identity map
 * survives into the next step, where `resetTestDb()` may already have deleted
 * the rows it remembers. Inside the context `orm.em` resolves to that fork.
 */
export function inContext<T>(orm: FactoryOrm, fn: (em: EntityManager) => Promise<T>): Promise<T> {
  return withRequestContext(orm, () => fn(orm.em));
}

const sequences = new Map<string, number>();

/**
 * The next number for a named default (`user3@test.example.com`). Per worker
 * process, never reset: like the legacy factories, names stay unique across
 * the tests of one file even when `resetTestDb()` runs between them.
 */
export function nextSeq(name: string): number {
  const n = (sequences.get(name) ?? 0) + 1;
  sequences.set(name, n);
  return n;
}
