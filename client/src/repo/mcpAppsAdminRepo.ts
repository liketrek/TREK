import { adminFeatureToggleResponseSchema, type AdminFeatureToggleResponse } from '@trek/shared';
import { mcpAppsAdminApi } from '../api/tourBaseMaps';
import { requireOnline } from './onlineOnly';

/**
 * The admin's switch for MCP's interactive views (MCP Apps).
 *
 * **Deliberately online-only, and no Dexie table**, like every admin switch: it
 * changes what the server offers the MCP hosts connected to it, which a write
 * queued on this device could not do until it was back online anyway. Answers
 * are parsed against the shared schema rather than cast.
 */
export const mcpAppsAdminRepo = {
  async get(): Promise<AdminFeatureToggleResponse> {
    requireOnline();
    return adminFeatureToggleResponseSchema.parse(await mcpAppsAdminApi.get());
  },
  async update(enabled: boolean): Promise<AdminFeatureToggleResponse> {
    requireOnline();
    return adminFeatureToggleResponseSchema.parse(await mcpAppsAdminApi.update(enabled));
  },
};
