/**
 * The process-level plugin MCP tool source — MCPSINK-001 to MCPSINK-005.
 *
 * The unset case is the one that matters and the one none of the sibling sinks
 * covers: every app built without the plugins runtime, and every test that
 * never registers a source, goes through it on each session.
 */
import { getPluginMcpToolSource, setPluginMcpToolSource } from '../../../src/plugin-mcp-tools';
import { registerTools } from '../../../src/mcp/tools';
import type { McpContext, McpDynamicTool } from '../../../src/nest-mcp';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { afterEach, describe, expect, it, vi } from 'vitest';

const echo: McpDynamicTool = {
  options: {
    name: 'plugin_demo_echo',
    description: 'Echoes.',
    access: { group: 'plugins', mode: 'use' } as never,
  },
  handler: () => ({ content: [{ type: 'text', text: 'dynamic' }] }),
};

/** Records what attach() was handed, without needing a real registry. */
function spyRegistry() {
  const attach = vi.fn();
  return { attach, registry: { attach } as unknown as Parameters<typeof registerTools>[0] };
}

afterEach(() => {
  setPluginMcpToolSource(null);
});

describe('setPluginMcpToolSource', () => {
  it('MCPSINK-001: is unset by default', () => {
    expect(getPluginMcpToolSource()).toBeNull();
  });

  it('MCPSINK-002: round-trips a source and clears back to null', () => {
    const source = () => [echo];
    setPluginMcpToolSource(source);
    expect(getPluginMcpToolSource()).toBe(source);

    setPluginMcpToolSource(null);
    expect(getPluginMcpToolSource()).toBeNull();
  });
});

describe('registerTools wiring', () => {
  it('MCPSINK-003: passes no dynamic source when none is registered', () => {
    const { attach, registry } = spyRegistry();

    registerTools(registry, new McpServer({ name: 't', version: '1' }), 1, null);

    expect(attach.mock.calls[0][2]).toEqual({ onInvoke: undefined, dynamicTools: undefined });
  });

  it('MCPSINK-004: passes the registered source through to attach', () => {
    const source = (_ctx: McpContext) => [echo];
    setPluginMcpToolSource(source);
    const { attach, registry } = spyRegistry();

    registerTools(registry, new McpServer({ name: 't', version: '1' }), 1, null);

    expect(attach.mock.calls[0][2].dynamicTools).toBe(source);
  });

  it('MCPSINK-005: an explicit argument wins over the process-level source', () => {
    setPluginMcpToolSource(() => [echo]);
    const explicit = () => [];
    const { attach, registry } = spyRegistry();

    registerTools(registry, new McpServer({ name: 't', version: '1' }), 1, null, false, undefined, undefined, explicit);

    expect(attach.mock.calls[0][2].dynamicTools).toBe(explicit);
  });
});
