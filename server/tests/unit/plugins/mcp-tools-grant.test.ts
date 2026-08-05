/**
 * A plugin's MCP tools are only advertised if it BOTH declared them (reported by the
 * child at load) AND holds the `mcp:tools` grant the admin consented to. The child
 * reports its declarations knowing nothing about grants, so mcpToolsOf() host-side is
 * where that consent is actually enforced — without it the permission is dead code.
 *
 * Same shape as provider-hook-grant.test.ts: mcpToolsOf only reads status/mcpTools/
 * granted, so bare Supervised entries go into the private map rather than real children.
 */
import { describe, it, expect } from 'vitest';
import { PluginSupervisor } from '../../../src/nest/plugins/supervisor/plugin-supervisor';
import type { PluginMcpToolReport } from '../../../src/nest/plugins/mcp-tool-report';
import { createPluginRuntime } from '../../helpers/plugin-host';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { db } from '../../../src/db/database';

const TOOL: PluginMcpToolReport = { name: 'lookup', description: 'Look something up' };

function makeSupervisor(): PluginSupervisor {
  // createRpcHost is never called on this path (no spawn).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PluginSupervisor((() => ({})) as any, {}, {});
}
function put(s: PluginSupervisor, id: string, status: string, mcpTools: PluginMcpToolReport[], granted: string[]): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (s as any).running.set(id, { id, status, mcpTools, granted: new Set(granted) });
}

describe('mcpToolsOf enforces the mcp:tools grant', () => {
  it('returns tools only for an active plugin holding the grant', () => {
    const s = makeSupervisor();
    put(s, 'granted', 'active', [TOOL], ['mcp:tools']);
    put(s, 'ungranted', 'active', [TOOL], ['db:own']); // declared them, never consented to
    put(s, 'starting', 'starting', [TOOL], ['mcp:tools']); // granted, not up yet
    put(s, 'stopped', 'stopped', [TOOL], ['mcp:tools']); // granted, deliberately disabled

    expect(s.mcpToolsOf('granted')).toEqual([TOOL]);
    expect(s.mcpToolsOf('ungranted')).toEqual([]);
    expect(s.mcpToolsOf('starting')).toEqual([]);
    expect(s.mcpToolsOf('stopped')).toEqual([]);
    expect(s.mcpToolsOf('never-installed')).toEqual([]);
  });

  it('a hook grant does not bleed into the MCP tool surface', () => {
    const s = makeSupervisor();
    put(s, 'hooky', 'active', [TOOL], ['hook:place-detail-provider', 'ai:invoke']);
    expect(s.mcpToolsOf('hooky')).toEqual([]);
  });

  it('mcpToolProviders lists only plugins actually advertising something', () => {
    const s = makeSupervisor();
    put(s, 'tools', 'active', [TOOL], ['mcp:tools']);
    put(s, 'granted-but-empty', 'active', [], ['mcp:tools']); // grant without declarations
    put(s, 'ungranted', 'active', [TOOL], ['db:own']);
    put(s, 'down', 'error', [TOOL], ['mcp:tools']);
    expect(s.mcpToolProviders()).toEqual(['tools']);
  });
});

describe('runtime.invokeMcpTool defense-in-depth', () => {
  it('refuses a plugin that is not a granted provider, even when the id is passed directly', async () => {
    const rt = createPluginRuntime(new DatabaseService(db));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rt as any).supervisor.running.set('ok', { id: 'ok', status: 'active', mcpTools: [TOOL], granted: new Set(['mcp:tools']) });
    await expect(rt.invokeMcpTool('other', 'lookup', {}, 1)).rejects.toThrow(/does not expose the MCP tool/);
  });

  it('refuses a tool name the plugin never declared', async () => {
    const rt = createPluginRuntime(new DatabaseService(db));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rt as any).supervisor.running.set('ok', { id: 'ok', status: 'active', mcpTools: [TOOL], granted: new Set(['mcp:tools']) });
    await expect(rt.invokeMcpTool('ok', 'not_a_tool', {}, 1)).rejects.toThrow(/does not expose the MCP tool/);
  });
});
