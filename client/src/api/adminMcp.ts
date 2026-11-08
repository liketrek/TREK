import type { AdminMcpToolUsageResponse } from '@trek/shared';
import apiClient from './client';

/** The admin's MCP surface: which tools the connected clients call. */
export const adminMcpApi = {
  toolUsage: (days: number): Promise<AdminMcpToolUsageResponse> =>
    apiClient.get('/admin/mcp/tool-usage', { params: { days } }).then((r) => r.data),
};
