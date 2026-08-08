import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { AddonsService } from './addons.service';

/**
 * Non-Nest entry point for the addons domain — for code running OUTSIDE the
 * Nest container (the legacy MCP registrars/resources, systemNotices, the
 * pre-init platform.routes Express router, the module-level `when:` gate
 * closures in the DI-discovered *.mcp.ts files, and the legacy
 * oauthService/airtrailSync/thumbnailService modules). Exports the legacy
 * services/adminService names 1:1 so repointing a consumer is an
 * import-path-only diff. Inside the container, inject AddonsService instead.
 * Delete this file when the last legacy consumer migrates.
 *
 * Only the enablement READS are bridged — the paired writers
 * (updateBagTracking/updateCollabFeatures) have in-container consumers only.
 * The reads are uncached per-call queries on purpose: admin toggles must stay
 * immediately visible without invalidation wiring.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const addons = new AddonsService(new DatabaseService(db));

export function isAddonEnabled(addonId: string): boolean {
  return addons.isAddonEnabled(addonId);
}

export function getBagTracking(): { enabled: boolean } {
  return addons.getBagTracking();
}

export function getCollabFeatures(): { chat: boolean; notes: boolean; polls: boolean; whatsnext: boolean } {
  return addons.getCollabFeatures();
}
