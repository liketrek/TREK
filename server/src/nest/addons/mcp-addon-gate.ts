import { ADDON_IDS } from '../../addons';
import { AddonsService } from './addons.service';

import type { RequestHandler } from 'express';

/**
 * Gate: 404 (empty body) when the MCP addon is disabled (M2 — prevents feature
 * fingerprinting). A factory over the injected AddonsService rather than a
 * middleware class: consumers build it inside their module's configure() and
 * hand the bare RequestHandler to consumer.apply() ahead of the SDK routers.
 */
export function createMcpAddonGate(addons: AddonsService): RequestHandler {
  return (_req, res, next) => {
    if (!addons.isAddonEnabled(ADDON_IDS.MCP)) {
      res.status(404).end();
      return;
    }
    next();
  };
}
