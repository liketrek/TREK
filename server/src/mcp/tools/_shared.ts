import { getAppUrl } from '../../app-config';
import { errorResult, okStructured, withResultMeta } from '../../nest-mcp';
import { MCP_APP_URL_META_KEY } from '@trek/shared';

// Generic MCP result helpers and annotation presets live in src/nest-mcp
// (single source for the decorator-based domains). Re-exported so the
// @McpController files keep importing from here. Everything below is PURE —
// the impure guards (hasTripPermission/isAdminUser/safeBroadcast) moved onto
// the injectable McpToolGuardsService (src/nest/mcp-shared/).
export {
  errorResult,
  ok,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
} from '../../nest-mcp';

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

/**
 * A view tool's structured result with this install's address under
 * `trek/appUrl`, so its view can link back into TREK. Every view tool that
 * links back writes the key through here.
 */
export function okWithAppLink<T extends Record<string, unknown>>(data: T) {
  return withResultMeta(okStructured(data), { [MCP_APP_URL_META_KEY]: getAppUrl() });
}
