/**
 * PluginMcpToolsService — MCPTOOLS-001 to MCPTOOLS-018.
 *
 * The advertise path: what a session is shown, and what happens when a plugin
 * misbehaves on the way back. The text and schema rules themselves are pinned
 * in mcp-tool-schema.test.ts; this file covers the intersection, the gates, the
 * caps and the result envelope.
 */
import { PluginMcpToolsService, toMcpTextResult } from '../../../src/nest/plugins/contributions/plugin-mcp-tools.service';
import type { McpContext } from '../../../src/nest-mcp';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ctx = { userId: 5, scopes: null, isStaticToken: false } as McpContext;

const weatherTool = {
  name: 'forecast',
  title: 'Forecast',
  description: 'Gets the weather.',
  inputSchema: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
};

interface Wiring {
  providers?: string[];
  declared?: Record<string, unknown[]>;
  implemented?: Record<string, string[]>;
  grants?: Record<string, string[]>;
  callTool?: ReturnType<typeof vi.fn>;
  demo?: boolean;
}

function makeService(w: Wiring = {}) {
  const callTool = w.callTool ?? vi.fn(async () => ({ ok: true }));
  const hooks = {
    providersOf: vi.fn((hook: string) => (hook === 'mcpToolProvider' ? (w.providers ?? ['weather']) : [])),
    callMcpTool: callTool,
  };
  const runtime = {
    mcpToolCapabilities: vi.fn((id: string) => (w.declared ?? { weather: [weatherTool] })[id] ?? []),
    mcpToolsOf: vi.fn((id: string) => (w.implemented ?? { weather: ['forecast'] })[id] ?? []),
    grantsOf: vi.fn((id: string) => new Set((w.grants ?? {})[id] ?? [])),
  };
  const env = {} as never;
  const dbs = {} as never;
  const svc = new PluginMcpToolsService(hooks as never, runtime as never, env, dbs);
  return { svc, hooks, runtime, callTool };
}

let pluginsOn = true;
let demoUser = false;

vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled: () => pluginsOn }));
vi.mock('../../../src/nest/common/demo-write', () => ({ isDemoUserId: () => demoUser }));

beforeEach(() => {
  pluginsOn = true;
  demoUser = false;
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('the advertised surface', () => {
  it('MCPTOOLS-001: advertises a declared and implemented tool under the prefixed name', () => {
    const { svc } = makeService();
    const tools = svc.mcpTools(ctx);

    expect(tools).toHaveLength(1);
    expect(tools[0].options.name).toBe('plugin_weather_forecast');
    expect(tools[0].options.description).toBe('Gets the weather.');
    expect(tools[0].options.access).toEqual({ group: 'plugins', mode: 'use' });
  });

  it('MCPTOOLS-002: drops a tool the manifest declares but the build does not implement', () => {
    const { svc } = makeService({ implemented: { weather: [] } });
    expect(svc.mcpTools(ctx)).toEqual([]);
  });

  it('MCPTOOLS-003: drops a tool the build reports but the manifest never declared', () => {
    // The manifest is signed and re-consented; the loaded report is neither.
    const { svc } = makeService({ declared: { weather: [] }, implemented: { weather: ['sneaky'] } });
    expect(svc.mcpTools(ctx)).toEqual([]);
  });

  it('MCPTOOLS-004: a plugin without the grant never reaches the surface', () => {
    // providersOf already filters on active AND reported AND granted.
    const { svc, hooks } = makeService({ providers: [] });
    expect(svc.mcpTools(ctx)).toEqual([]);
    expect(hooks.providersOf).toHaveBeenCalledWith('mcpToolProvider');
  });

  it('MCPTOOLS-005: the kill switch empties the surface', () => {
    pluginsOn = false;
    const { svc, hooks } = makeService();
    expect(svc.mcpTools(ctx)).toEqual([]);
    expect(hooks.providersOf).not.toHaveBeenCalled();
  });

  it('MCPTOOLS-006: one failing plugin costs only its own tools', () => {
    const { svc } = makeService({
      providers: ['broken', 'weather'],
      declared: {
        get weather() { return [weatherTool]; },
        get broken(): never { throw new Error('bad row'); },
      } as never,
      implemented: { weather: ['forecast'], broken: ['x'] },
    });

    const tools = svc.mcpTools(ctx);
    expect(tools.map((t) => t.options.name)).toEqual(['plugin_weather_forecast']);
  });

  it('MCPTOOLS-007: caps the tools one plugin may contribute', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ ...weatherTool, name: `t${i}` }));
    const { svc } = makeService({
      declared: { weather: many },
      implemented: { weather: many.map((t) => t.name) },
    });
    expect(svc.mcpTools(ctx)).toHaveLength(8);
  });

  it('MCPTOOLS-008: caps the whole surface and says so rather than truncating silently', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const eight = Array.from({ length: 8 }, (_, i) => ({ ...weatherTool, name: `t${i}` }));
    const providers = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const declared: Record<string, unknown[]> = {};
    const implemented: Record<string, string[]> = {};
    for (const p of providers) {
      declared[p] = eight;
      implemented[p] = eight.map((t) => t.name);
    }

    const { svc } = makeService({ providers, declared, implemented });
    expect(svc.mcpTools(ctx)).toHaveLength(32);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('dropped'));
  });

  it('MCPTOOLS-009: clamps annotations against the grants the plugin actually holds', () => {
    const claiming = [{ ...weatherTool, annotations: { readOnlyHint: true } }];
    const { svc } = makeService({
      declared: { weather: claiming },
      grants: { weather: ['db:write:trips'] },
    });
    expect(svc.mcpTools(ctx)[0].options.annotations).toMatchObject({ readOnlyHint: false });
  });

  it('MCPTOOLS-010: never advertises _meta or an outputSchema', () => {
    const { svc } = makeService({ declared: { weather: [{ ...weatherTool, _meta: { x: 1 } }] } });
    const options = svc.mcpTools(ctx)[0].options;
    expect(options._meta).toBeUndefined();
    expect(options.outputSchema).toBeUndefined();
  });
});

describe('invoking a tool', () => {
  const invoke = async (svc: PluginMcpToolsService, args: unknown = { city: 'Lisbon' }) => {
    const tool = svc.mcpTools(ctx)[0];
    return (await tool.handler(args, ctx)) as { content: Array<{ text: string }>; isError?: boolean };
  };

  it('MCPTOOLS-011: passes the plugin-local name and binds the requesting user', async () => {
    const { svc, callTool } = makeService();
    await invoke(svc);
    expect(callTool).toHaveBeenCalledWith('weather', { name: 'forecast', args: { city: 'Lisbon' } }, 5);
  });

  it('MCPTOOLS-012: wraps a bare object into a result with a content key', async () => {
    // The registry passes a handler's value straight through and skips output
    // validation without an outputSchema, so an unwrapped object would reach
    // the client with no content key and every conforming one would error.
    const { svc } = makeService({ callTool: vi.fn(async () => ({ ok: true, data: [1, 2] })) });
    const res = await invoke(svc);
    expect(Array.isArray(res.content)).toBe(true);
    expect(JSON.parse(res.content[0].text)).toEqual({ ok: true, data: [1, 2] });
  });

  it('MCPTOOLS-013: maps a throwing plugin to a tool error, not a protocol fault', async () => {
    const { svc } = makeService({ callTool: vi.fn(async () => { throw new Error('upstream 503'); }) });
    const res = await invoke(svc);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('upstream 503');
  });

  it('MCPTOOLS-014: refuses in demo mode without ever reaching the plugin', async () => {
    demoUser = true;
    const { svc, callTool } = makeService();
    const res = await invoke(svc);
    expect(res.isError).toBe(true);
    expect(callTool).not.toHaveBeenCalled();
  });

  it('MCPTOOLS-015: refuses once the kill switch goes off mid-session', async () => {
    const { svc, callTool } = makeService();
    const tool = svc.mcpTools(ctx)[0];
    pluginsOn = false;
    const res = (await tool.handler({}, ctx)) as { isError?: boolean };
    expect(res.isError).toBe(true);
    expect(callTool).not.toHaveBeenCalled();
  });
});

describe('toMcpTextResult', () => {
  it('MCPTOOLS-016: preserves a well-formed result, isError included', () => {
    const given = { content: [{ type: 'text', text: 'hi' }], isError: true };
    expect(toMcpTextResult(given)).toEqual(given);
  });

  it('MCPTOOLS-017: wraps a bare string', () => {
    expect(toMcpTextResult('hello')).toEqual({ content: [{ type: 'text', text: 'hello' }] });
  });

  it('MCPTOOLS-018: survives a value that cannot be serialised', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const res = toMcpTextResult(cyclic) as { isError?: boolean };
    expect(res.isError).toBe(true);
  });

  it('MCPTOOLS-019: caps a flood so a plugin cannot fill the assistant context', () => {
    const huge = 'x'.repeat(200_000);
    const res = toMcpTextResult(huge);
    expect(res.content[0].text.length).toBeLessThanOrEqual(64 * 1024);
  });

  it('MCPTOOLS-020: the budget covers the WHOLE result, not each block', () => {
    // Per-block slicing is not a limit: 100 blocks of the maximum size is 100
    // times the maximum. This shape produced 6.5M characters before the fix.
    const many = { content: Array.from({ length: 100 }, () => ({ type: 'text', text: 'x'.repeat(200_000) })) };
    const res = toMcpTextResult(many);
    const total = res.content.reduce((n, c) => n + c.text.length, 0);
    expect(total).toBeLessThan(70 * 1024);
  });

  it('MCPTOOLS-021: caps the number of content blocks and says it truncated', () => {
    const many = { content: Array.from({ length: 500 }, (_, i) => ({ type: 'text', text: `b${i}` })) };
    const res = toMcpTextResult(many);
    expect(res.content.length).toBeLessThanOrEqual(33);
    expect(res.content[res.content.length - 1].text).toContain('truncated');
  });

  it('MCPTOOLS-022: bounds a huge object without serialising it whole first', () => {
    const fat = { rows: Array.from({ length: 20_000 }, (_, i) => ({ i, blob: 'y'.repeat(500) })) };
    const res = toMcpTextResult(fat);
    const total = res.content.reduce((n, c) => n + c.text.length, 0);
    expect(total).toBeLessThan(70 * 1024);
  });
});
