/**
 * Plugin tools end to end, through a real MCP client and server: what a connected
 * assistant actually sees in tools/list and gets back from tools/call.
 *
 * The plugin runtime is faked at the handoff seam (the same one PluginRuntimeService
 * fills in onModuleInit), so this exercises the whole bridge — scope gate, namespacing,
 * schema conversion, invocation, error mapping — without spawning a child process.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createMcpHarness } from '../../helpers/mcp-harness';
import { setPluginToolsRuntime, type PluginToolsRuntime } from '../../../src/mcp/plugin-tools-handoff';
import type { PluginMcpToolReport } from '../../../src/nest/plugins/mcp-tool-report';

const LOOKUP: PluginMcpToolReport = {
  name: 'lookup',
  title: 'Lookup',
  description: 'Look something up',
  inputSchema: { type: 'object', properties: { q: { type: 'string', description: 'The query' } }, required: ['q'] },
  annotations: { readOnlyHint: true },
};

/** A runtime exposing `tools` on one plugin; invoke is a spy you can steer. */
function fakeRuntime(
  tools: PluginMcpToolReport[],
  invoke: PluginToolsRuntime['invokeMcpTool'] = async () => 'ok',
  pluginId = 'trip-doctor',
): PluginToolsRuntime {
  return {
    mcpToolProviders: () => (tools.length ? [pluginId] : []),
    mcpToolsOf: (id) => (id === pluginId ? tools : []),
    invokeMcpTool: invoke,
  };
}

afterEach(() => setPluginToolsRuntime(null));

async function listTools(scopes: string[] | null) {
  const h = await createMcpHarness({ userId: 1, scopes, withResources: false });
  const { tools } = await h.client.listTools();
  await h.cleanup();
  return tools;
}

describe('plugin tools in tools/list', () => {
  it('advertises a plugin tool namespaced, with its title, description and schema', async () => {
    setPluginToolsRuntime(fakeRuntime([LOOKUP]));
    const tool = (await listTools(null)).find((t) => t.name === 'plugin_trip-doctor_lookup');

    expect(tool).toBeDefined();
    expect(tool!.title).toBe('Lookup');
    expect(tool!.description).toBe('Look something up');
    expect(tool!.annotations).toMatchObject({ readOnlyHint: true });
    // The schema has to survive the JSON→Zod→JSON round trip, descriptions included:
    // it and the description are all the model reads before deciding to call.
    expect(tool!.inputSchema).toMatchObject({
      type: 'object',
      properties: { q: { type: 'string', description: 'The query' } },
      required: ['q'],
    });
  });

  it('advertises a no-argument tool with an empty schema', async () => {
    setPluginToolsRuntime(fakeRuntime([{ name: 'ping', description: 'Ping' }]));
    const tool = (await listTools(null)).find((t) => t.name === 'plugin_trip-doctor_ping');
    expect(tool).toBeDefined();
    expect(tool!.inputSchema).toMatchObject({ type: 'object' });
    expect(tool!.inputSchema.properties ?? {}).toEqual({});
  });

  it('never shadows a built-in tool — a colliding name is skipped, the session survives', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Two plugins, same tool name: the namespacing makes them distinct, so force a
    // real collision by having the runtime report the same plugin id twice.
    const dupe: PluginToolsRuntime = {
      mcpToolProviders: () => ['dup', 'dup'],
      mcpToolsOf: () => [LOOKUP],
      invokeMcpTool: async () => 'ok',
    };
    setPluginToolsRuntime(dupe);
    const tools = await listTools(null);
    expect(tools.filter((t) => t.name === 'plugin_dup_lookup')).toHaveLength(1);
    // and the built-ins are all still there
    expect(tools.length).toBeGreaterThan(10);
    warn.mockRestore();
  });

  it('shows nothing when no plugin runtime was ever handed over', async () => {
    const tools = await listTools(null);
    expect(tools.some((t) => t.name.startsWith('plugin_'))).toBe(false);
  });
});

describe('the plugins:use scope gate', () => {
  it('hides plugin tools from a scoped token that lacks plugins:use', async () => {
    setPluginToolsRuntime(fakeRuntime([LOOKUP]));
    const tools = await listTools(['trips:read']);
    expect(tools.some((t) => t.name.startsWith('plugin_'))).toBe(false);
  });

  it('shows them once the token carries plugins:use', async () => {
    setPluginToolsRuntime(fakeRuntime([LOOKUP]));
    const tools = await listTools(['trips:read', 'plugins:use']);
    expect(tools.some((t) => t.name === 'plugin_trip-doctor_lookup')).toBe(true);
  });

  it('shows them to a full-access (unscoped) token', async () => {
    setPluginToolsRuntime(fakeRuntime([LOOKUP]));
    expect((await listTools(null)).some((t) => t.name === 'plugin_trip-doctor_lookup')).toBe(true);
  });
});

describe('calling a plugin tool', () => {
  it('forwards the arguments and the acting user, and returns the plugin result', async () => {
    const invoke = vi.fn(async () => ({ found: 3 }));
    setPluginToolsRuntime(fakeRuntime([LOOKUP], invoke));
    const h = await createMcpHarness({ userId: 42, scopes: null, withResources: false });

    const res = await h.client.callTool({ name: 'plugin_trip-doctor_lookup', arguments: { q: 'hotels' } });

    expect(invoke).toHaveBeenCalledWith('trip-doctor', 'lookup', { q: 'hotels' }, 42);
    expect(res.isError).toBeFalsy();
    expect(JSON.parse((res.content as { text: string }[])[0].text)).toEqual({ found: 3 });
    await h.cleanup();
  });

  it('passes a string result through verbatim instead of re-quoting it', async () => {
    setPluginToolsRuntime(fakeRuntime([LOOKUP], async () => 'All good.'));
    const h = await createMcpHarness({ userId: 1, scopes: null, withResources: false });
    const res = await h.client.callTool({ name: 'plugin_trip-doctor_lookup', arguments: { q: 'x' } });
    expect((res.content as { text: string }[])[0].text).toBe('All good.');
    await h.cleanup();
  });

  it('turns a plugin throw into a tool error the model can read', async () => {
    setPluginToolsRuntime(fakeRuntime([LOOKUP], async () => { throw new Error('upstream API is down'); }));
    const h = await createMcpHarness({ userId: 1, scopes: null, withResources: false });

    const res = await h.client.callTool({ name: 'plugin_trip-doctor_lookup', arguments: { q: 'x' } });

    expect(res.isError).toBe(true);
    expect((res.content as { text: string }[])[0].text).toContain('upstream API is down');
    await h.cleanup();
  });

  it('reports a plugin deactivated since the session listed its tools as a clean error', async () => {
    // What invokeMcpTool's defense-in-depth check rejects with once the plugin is gone.
    setPluginToolsRuntime(fakeRuntime([LOOKUP], async () => {
      throw new Error('plugin trip-doctor does not expose the MCP tool lookup');
    }));
    const h = await createMcpHarness({ userId: 1, scopes: null, withResources: false });
    const res = await h.client.callTool({ name: 'plugin_trip-doctor_lookup', arguments: { q: 'x' } });
    expect(res.isError).toBe(true);
    await h.cleanup();
  });

  it('truncates an enormous result rather than flooding the model context', async () => {
    setPluginToolsRuntime(fakeRuntime([LOOKUP], async () => 'x'.repeat(200_000)));
    const h = await createMcpHarness({ userId: 1, scopes: null, withResources: false });
    const text = (await h.client.callTool({ name: 'plugin_trip-doctor_lookup', arguments: { q: 'x' } })
      .then((r) => (r.content as { text: string }[])[0].text));
    expect(text.length).toBeLessThan(200_000);
    expect(text).toContain('truncated by TREK');
    await h.cleanup();
  });
});
