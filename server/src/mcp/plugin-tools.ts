import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { errorResult } from '@trek/nest-mcp';
import { pluginsEnabled } from '../nest/plugins/kill-switch';
import { publicMcpToolName } from '../nest/plugins/mcp-tool-report';
import { canUsePluginTools } from './scopes';
import { jsonSchemaToZodShape } from './json-schema-to-zod';
import { getPluginToolsRuntime, type PluginToolsRuntime } from './plugin-tools-handoff';

/**
 * Advertises the tools installed plugins expose, alongside TREK's built-in ones.
 *
 * Three gates have to be open for a tool to appear here: the plugin system is on, the
 * plugin holds `mcp:tools` and is active (the supervisor enforces that — see
 * mcpToolsOf), and the session's token carries `plugins:use`. The scope is deliberately
 * one gate for all plugin tools: what any individual tool can actually reach is decided
 * by that plugin's own granted permissions, acting as the user behind the token, so
 * per-plugin OAuth scopes would imply a second, finer-grained consent model that does
 * not exist.
 *
 * Everything here is fail-open on the session and fail-closed on the tool: a plugin
 * that cannot be registered is skipped, never allowed to break session creation for
 * the ~200 built-in tools.
 */

/** A tool result is read into a model's context — bound it. */
const MAX_RESULT_CHARS = 100_000;

export function registerPluginTools(server: McpServer, userId: number, scopes: string[] | null): void {
  if (!pluginsEnabled()) return;
  if (!canUsePluginTools(scopes)) return;
  // Unset in any context without the plugin module (unit tests, a slim app) — no tools.
  const runtime = getPluginToolsRuntime();
  if (!runtime) return;

  for (const pluginId of runtime.mcpToolProviders()) {
    for (const tool of runtime.mcpToolsOf(pluginId)) {
      const publicName = publicMcpToolName(pluginId, tool.name);
      const config = { title: tool.title, description: tool.description, annotations: tool.annotations };
      const inputSchema = jsonSchemaToZodShape(tool.inputSchema);
      try {
        // Split on the schema so the SDK's callback type resolves: with a shape the
        // handler is (args, extra), without one it is (extra) alone.
        if (inputSchema) {
          server.registerTool(publicName, { ...config, inputSchema }, (args) =>
            callPluginTool(runtime, pluginId, tool.name, publicName, args, userId));
        } else {
          server.registerTool(publicName, config, () =>
            callPluginTool(runtime, pluginId, tool.name, publicName, undefined, userId));
        }
      } catch (err) {
        // Almost always a name already taken by a built-in tool. Skipping keeps the
        // built-in authoritative and leaves every other tool in this session intact.
        console.warn(`[MCP] skipped plugin tool ${publicName}:`, (err as Error)?.message ?? err);
      }
    }
  }
}

/** Run one tool in its plugin's child process and shape the reply for the model. */
async function callPluginTool(
  runtime: PluginToolsRuntime,
  pluginId: string,
  toolName: string,
  publicName: string,
  input: unknown,
  userId: number,
) {
  try {
    return renderResult(await runtime.invokeMcpTool(pluginId, toolName, input, userId));
  } catch (err) {
    // Everything lands here: a throw from the plugin, the 30 s timeout, a crashed
    // child, or the plugin having been deactivated since this session listed its
    // tools. The message is the plugin's own words to its caller — safe to surface,
    // and the only way the model learns to try something else.
    const message = (err as Error)?.message ?? String(err);
    return errorResult(`Plugin tool "${publicName}" failed: ${message}`);
  }
}

function renderResult(value: unknown) {
  let text: string;
  if (typeof value === 'string') {
    text = value; // a string is the plugin's finished answer — don't re-quote it
  } else if (value === undefined || value === null) {
    text = '';
  } else {
    try {
      text = JSON.stringify(value, null, 2) ?? '';
    } catch {
      return errorResult('The plugin returned a value that could not be serialized.');
    }
  }
  if (text.length > MAX_RESULT_CHARS) {
    text = `${text.slice(0, MAX_RESULT_CHARS)}\n… [truncated by TREK at ${MAX_RESULT_CHARS} characters]`;
  }
  return { content: [{ type: 'text' as const, text }] };
}
