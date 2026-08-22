import { errorResult } from '../../nest-mcp';

// Generic MCP result helpers and annotation presets live in src/nest-mcp
// (single source for the decorator-based domains). Re-exported so the
// @McpController files keep importing from here. Everything below is PURE —
// the impure guards (hasTripPermission/isAdminUser/safeBroadcast) moved onto
// the injectable McpToolGuardsService (src/nest/mcp-shared/).
export {
  demoDenied,
  errorResult,
  ok,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
} from '../../nest-mcp';

export const MAX_MCP_TRIP_DAYS = 90;

export function noAccess() {
  return errorResult('Trip not found or access denied.');
}

export function permissionDenied() {
  return errorResult('You do not have permission to perform this action on this trip.');
}

/** Error response for admin-only tools, reproducing the REST `{ error: 'Admin access required' }` string. */
export function adminRequired() {
  return errorResult('Admin access required');
}
