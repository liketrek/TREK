import { adminMcpToolUsageResponseSchema, type AdminMcpToolUsageResponse } from '@trek/shared';
import { adminMcpApi } from '../api/adminMcp';
import { requireOnline } from './onlineOnly';

/**
 * The MCP tool-usage table of the admin panel.
 *
 * **Deliberately online-only, and no Dexie table.** It is a count the server
 * takes from its audit log at the moment it is asked, for the admin alone;
 * a copy kept on the device would only ever show an older count. The answer
 * is parsed against the shared schema rather than cast.
 */
export const mcpToolUsageRepo = {
  async list(days: number): Promise<AdminMcpToolUsageResponse> {
    requireOnline();
    return adminMcpToolUsageResponseSchema.parse(await adminMcpApi.toolUsage(days));
  },
};
