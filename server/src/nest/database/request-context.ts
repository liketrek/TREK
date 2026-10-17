import { RequestContext, type EntityManager } from '@mikro-orm/core';

/**
 * A request-scoped EntityManager for work that no HTTP request wraps.
 *
 * Every HTTP request runs inside the fork that the pathless
 * `mikroOrmRequestContext` middleware in `bootstrap.ts` opens with this helper
 * (the `@mikro-orm/nestjs` one is off, UPLOADS-P16); everything else — an MCP
 * tool call, a plugin RPC dispatch, a WebSocket message, a cron job, the
 * boot-time seeders, a backup restore — has no such wrapper, and with
 * `allowGlobalContext` left at its safe default the ORM refuses to run a query
 * there. This is the one helper those entrypoints call. It is deliberately a
 * function and not a decorator so a call site can pass the ORM it was given
 * rather than reach for a global.
 */
/** Accepts anything carrying the ORM's global EntityManager (MikroORM itself, or a narrower handle); `app.get(MikroORM)`'s readonly-entities generic would otherwise not assign to `MikroORM`. */
export function withRequestContext<T>(orm: { em: EntityManager }, fn: () => T): T {
  return RequestContext.create(orm.em, fn);
}
