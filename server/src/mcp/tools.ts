import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { McpAttachOptions, McpRegistry } from '../nest-mcp';

/**
 * Attaches the MCP surface to a session's server.
 *
 * Every domain registers through an @McpController class the container
 * discovers, so there is nothing to wire here by hand any more. What is left
 * is the seam that supplies the default arguments and the null-registry
 * escape hatch. Production passes the container-discovered McpRegistryService
 * (injected into the transport service); the no-Nest harness hands in
 * createTestRegistry()'s build. A null registry (direct callers without either)
 * skips the attach.
 */
export function registerTools(registry: McpRegistry | null, server: McpServer, userId: number, scopes: string[] | null, isStaticToken = false, getDeprecationNotice: () => string | null = () => null, onInvoke?: McpAttachOptions['onInvoke']): void {
  if (registry) registry.attach(server, { userId, scopes, isStaticToken, getDeprecationNotice }, { onInvoke });
}
