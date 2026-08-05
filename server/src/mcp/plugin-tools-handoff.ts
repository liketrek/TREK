import type { PluginMcpToolReport } from '../nest/plugins/mcp-tool-report';

/**
 * Hands the plugin runtime to the non-Nest MCP handler, so a session can advertise
 * the tools active plugins expose.
 *
 * Same seam as registry-handoff.ts, for the same reason: mcpHandler is mounted on the
 * raw Express instance BEFORE app.init() and cannot reach the DI container. The
 * difference is who pushes — PluginRuntimeService wires itself here in onModuleInit
 * (like setPluginEventSink / setPluginChannelSource), so bootstrap.ts stays out of it
 * and a context WITHOUT the plugin module (a slim test app, or an instance with the
 * plugins kill switch off) simply leaves this unset.
 *
 * Deliberately narrow: the MCP layer gets exactly the three calls it needs, not the
 * whole service, so this stays a one-way dependency on plugin internals.
 */
export interface PluginToolsRuntime {
  /** Ids of active plugins advertising at least one tool (grant-checked). */
  mcpToolProviders(): string[];
  /** One plugin's advertised tools — already normalized and capped. */
  mcpToolsOf(id: string): PluginMcpToolReport[];
  /** Run a tool as `actingUserId`. Rejects if the plugin is no longer a granted provider. */
  invokeMcpTool(id: string, tool: string, input: unknown, actingUserId: number): Promise<unknown>;
}

let runtime: PluginToolsRuntime | null = null;

export function setPluginToolsRuntime(value: PluginToolsRuntime | null): void {
  runtime = value;
}

export function getPluginToolsRuntime(): PluginToolsRuntime | null {
  return runtime;
}
