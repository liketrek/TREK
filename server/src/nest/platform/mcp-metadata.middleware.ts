import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { withRequestContext } from '../database/request-context';
import { DiscoveryMetadataService } from './discovery-metadata.service';
import { MikroORM } from '@mikro-orm/core';

import type { RequestHandler } from 'express';

/**
 * The SDK discovery router plus its addon gate: 404 (empty body) on every
 * /.well-known/* path while the MCP addon is off (M2 — prevents feature
 * fingerprinting), otherwise delegate to the lazily built metadata router.
 *
 * NOT registered through MiddlewareConsumer: the SDK router matches absolute
 * /.well-known/* paths against req.url, and a Nest wildcard forRoutes() mount
 * is an Express pattern mount that strips the matched prefix from req.url
 * before the middleware runs. bootstrap.ts applies this pre-init as a pathless
 * app.use — the only mount shape that leaves req.url untouched — resolving it
 * from the container by token (the httpConfig.KEY precedent). A factory
 * provider rather than a NestMiddleware class because nothing consumer-mounts
 * it: the deliverable is the bare Express RequestHandler itself.
 *
 * D6 boot rule (Plan 3a Task 4): a pathless pre-init `app.use` runs on the raw
 * Express instance, before `@mikro-orm/nestjs`'s per-request EntityManager
 * fork middleware — unlike `createMcpAddonGate`'s OTHER mount in
 * `oauth.module.ts`, which goes through a normal `MiddlewareConsumer.forRoutes()`
 * and so is already inside that fork. Once `AddonsService.isAddonEnabled`
 * became repository-backed, a request here threw MikroORM's
 * `cannotUseGlobalContext` (proven: every `/.well-known/*` integration test
 * failed with a 500 until this wrap). `withRequestContext` is this file's own
 * choke point — every request through this middleware, gated or not, gets a
 * context the same way the boot-time `getAdminUserDefaults()` read in
 * `bootstrap.ts` already does.
 */
export const MCP_METADATA_MIDDLEWARE = Symbol('MCP_METADATA_MIDDLEWARE');

export function createMcpMetadataMiddleware(
  meta: DiscoveryMetadataService,
  addons: AddonsService,
  orm: MikroORM,
): RequestHandler {
  // Express cannot await a middleware, so the now-async addon check runs in a
  // helper and its rejection is handed to next() — the same error path a
  // synchronous throw took before (recipe R1.5).
  return (req, res, next) => {
    if (!req.path.startsWith('/.well-known/')) {
      meta.getMetaRouter()(req, res, next);
      return;
    }
    // Only the addon read needs an ORM request context: this middleware sits
    // before Nest's per-request EntityManager fork (a pathless pre-init
    // app.use), and wrapping the router delegation too would fork an unused
    // EntityManager for every request the server answers.
    // Promise.resolve: the helper returns whatever the callback returns, and a
    // test double may answer the addon read synchronously.
    void Promise.resolve(withRequestContext(orm, () => addons.isAddonEnabled(ADDON_IDS.MCP)))
      .then((enabled) => {
        if (!enabled) {
          res.status(404).end();
          return;
        }
        meta.getMetaRouter()(req, res, next);
      })
      .catch(next);
  };
}

export const mcpMetadataMiddlewareProvider = {
  provide: MCP_METADATA_MIDDLEWARE,
  useFactory: createMcpMetadataMiddleware,
  inject: [DiscoveryMetadataService, AddonsService, MikroORM],
};
