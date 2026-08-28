import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import type { McpAttachOptions, McpRegistry } from '../nest-mcp';
import { getPluginMcpToolSource } from '../plugin-mcp-tools';

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
 *
 * `dynamicTools` defaults to the process-level plugin source rather than being
 * passed down from the transport, so mcp-transport/ never learns that plugins
 * exist and an app built without the plugins runtime resolves it to undefined.
 * Tests pass it explicitly instead of reaching for the global.
 */
export function registerTools(registry: McpRegistry | null, server: McpServer, userId: number, scopes: string[] | null, isStaticToken = false, getDeprecationNotice: () => string | null = () => null, onInvoke?: McpAttachOptions['onInvoke'], dynamicTools: McpAttachOptions['dynamicTools'] = getPluginMcpToolSource() ?? undefined): void {
  if (registry) registry.attach(server, { userId, scopes, isStaticToken, getDeprecationNotice }, { onInvoke, dynamicTools });
}
