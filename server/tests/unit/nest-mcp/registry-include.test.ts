/**
 * The `include` attach option: a session narrowed to the entries the host
 * names. It can only take entries away (the access policy still decides the
 * rest), and dynamic tools go through it too.
 */
import { createTestRegistry, McpController, Prompt, Tool, type McpContext } from '../../../src/nest-mcp';
import { createAttachHarness, type AttachHarness, type TestCtx } from './harness';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

@McpController()
class IncludeFixtureMcp {
  @Tool({ name: 'kept_tool', inputSchema: {} })
  async kept(_args: Record<string, never>, ctx: TestCtx) {
    return { content: [{ type: 'text', text: `kept for ${ctx.userId}` }] };
  }

  @Tool({ name: 'dropped_tool', inputSchema: {} })
  async dropped() {
    return { content: [{ type: 'text', text: 'dropped' }] };
  }

  @Tool({ name: 'gated_tool', inputSchema: {}, access: (ctx: McpContext) => (ctx as TestCtx).allow === true })
  async gated() {
    return { content: [{ type: 'text', text: 'gated' }] };
  }

  @Prompt({ name: 'kept_prompt', argsSchema: { topic: z.string() } })
  async prompt({ topic }: { topic: string }) {
    return { messages: [{ role: 'user', content: { type: 'text', text: topic } }] };
  }
}

const registry = createTestRegistry([new IncludeFixtureMcp()]);
let harness: AttachHarness | null = null;

afterEach(async () => {
  await harness?.cleanup();
  harness = null;
});

describe('McpRegistry.attach include', () => {
  it('MCPINC-001: attaches only the entries the host names', async () => {
    harness = await createAttachHarness(
      registry,
      { userId: 1, allow: true },
      {
        include: (kind, name) => kind === 'tool' && name === 'kept_tool',
      },
    );
    const tools = await harness.client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(['kept_tool']);
    await expect(harness.client.listPrompts()).rejects.toThrow();
  });

  it('MCPINC-002: never grants what the access check refuses', async () => {
    harness = await createAttachHarness(registry, { userId: 1, allow: false }, { include: () => true });
    expect((await harness.client.listTools()).tools.map((tool) => tool.name)).toEqual(['kept_tool', 'dropped_tool']);
  });

  it('MCPINC-003: is asked before the entry gate, with the kind and the name', async () => {
    const include = vi.fn(() => false);
    harness = await createAttachHarness(registry, { userId: 1 }, { include });
    expect(include).toHaveBeenCalledWith('tool', 'kept_tool');
    expect(include).toHaveBeenCalledWith('prompt', 'kept_prompt');
  });

  it('MCPINC-004: narrows the dynamic tools too', async () => {
    const dynamicTools = () => [
      { options: { name: 'dyn_kept', inputSchema: {}, access: () => true }, handler: () => ({ content: [] }) },
      { options: { name: 'dyn_dropped', inputSchema: {}, access: () => true }, handler: () => ({ content: [] }) },
    ];
    harness = await createAttachHarness(
      registry,
      { userId: 1 },
      {
        dynamicTools,
        include: (_kind, name) => name === 'dyn_kept',
      },
    );
    expect((await harness.client.listTools()).tools.map((tool) => tool.name)).toEqual(['dyn_kept']);
  });

  it('MCPINC-005: without it every entry is considered as before', async () => {
    harness = await createAttachHarness(registry, { userId: 1, allow: true });
    expect((await harness.client.listTools()).tools.map((tool) => tool.name)).toEqual([
      'kept_tool',
      'dropped_tool',
      'gated_tool',
    ]);
  });
});
