import type { McpRegistry } from '@trek/nest-mcp';

/**
 * Hands the Nest-discovered MCP registry to the non-Nest MCP handler.
 *
 * mcpHandler is mounted on the raw Express instance BEFORE app.init()
 * (load-bearing composition order in bootstrap.ts), so it cannot reach the
 * DI container itself — bootstrap.ts pushes the registry here right after
 * init. registerTools() degrades gracefully while unset (direct callers
 * like unit tests attach their own via createTestRegistry + setMcpRegistry).
 */
let registry: McpRegistry | null = null;

export function setMcpRegistry(value: McpRegistry): void {
  registry = value;
}

export function getMcpRegistry(): McpRegistry | null {
  return registry;
}
