import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { DiscoveryMetadataService } from './discovery-metadata.service';

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
 */
export const MCP_METADATA_MIDDLEWARE = Symbol('MCP_METADATA_MIDDLEWARE');

export function createMcpMetadataMiddleware(meta: DiscoveryMetadataService, addons: AddonsService): RequestHandler {
  return (req, res, next) => {
    if (req.path.startsWith('/.well-known/') && !addons.isAddonEnabled(ADDON_IDS.MCP)) {
      res.status(404).end();
      return;
    }
    meta.getMetaRouter()(req, res, next);
  };
}

export const mcpMetadataMiddlewareProvider = {
  provide: MCP_METADATA_MIDDLEWARE,
  useFactory: createMcpMetadataMiddleware,
  inject: [DiscoveryMetadataService, AddonsService],
};
