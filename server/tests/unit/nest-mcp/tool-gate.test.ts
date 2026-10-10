import {
  createTestRegistry,
  McpController,
  McpModule,
  McpRegistryService,
  Resource,
  Tool,
  type McpDynamicTool,
  type McpToolGate,
} from '../../../src/nest-mcp';
import { asCtx, createAttachHarness, type AttachHarness, type TestCtx } from './harness';
import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const REFUSAL = { content: [{ type: 'text', text: 'refused' }], isError: true };

@McpController()
class GatedMcp {
  calls = 0;

  @Tool({ name: 'write_it', inputSchema: { n: z.number() }, annotations: { readOnlyHint: false } })
  async writeIt({ n }: { n: number }, ctx: TestCtx) {
    this.calls++;
    return { content: [{ type: 'text', text: JSON.stringify({ n, userId: ctx.userId }) }] };
  }

  @Tool({ name: 'no_schema', annotations: { readOnlyHint: true } })
  async noSchema(args: Record<string, never>) {
    return { content: [{ type: 'text', text: JSON.stringify(args) }] };
  }

  @Resource({ name: 'res', uri: 'gate://res' })
  async res(uri: URL) {
    return { contents: [{ uri: uri.href, text: 'resource' }] };
  }
}

const textOf = (result: unknown): string => (result as { content: { text: string }[] }).content[0].text;

describe('tool gate', () => {
  let harness: AttachHarness | undefined;
  afterEach(async () => {
    await harness?.cleanup();
    harness = undefined;
  });

  it('answers with the gate result and never runs the handler', async () => {
    const mcp = new GatedMcp();
    const gate = vi.fn<McpToolGate>(() => REFUSAL);
    harness = await createAttachHarness(createTestRegistry([mcp], { toolGate: gate }), { userId: 3 });
    const result = await harness.client.callTool({ name: 'write_it', arguments: { n: 1 } });
    expect(result).toEqual(REFUSAL);
    expect(mcp.calls).toBe(0);
    expect(gate).toHaveBeenCalledWith(expect.objectContaining({ name: 'write_it', annotations: { readOnlyHint: false } }), asCtx({ userId: 3 }));
  });

  it('runs the handler with its arguments when the gate returns undefined', async () => {
    const mcp = new GatedMcp();
    harness = await createAttachHarness(createTestRegistry([mcp], { toolGate: async () => undefined }), { userId: 4 });
    const result = await harness.client.callTool({ name: 'write_it', arguments: { n: 2 } });
    expect(JSON.parse(textOf(result))).toEqual({ n: 2, userId: 4 });
    expect(mcp.calls).toBe(1);
  });

  it('gates a tool without an input schema too', async () => {
    harness = await createAttachHarness(createTestRegistry([new GatedMcp()], { toolGate: () => REFUSAL }), {});
    expect(await harness.client.callTool({ name: 'no_schema', arguments: {} })).toEqual(REFUSAL);
  });

  it('leaves resources alone', async () => {
    const gate = vi.fn<McpToolGate>(() => REFUSAL);
    harness = await createAttachHarness(createTestRegistry([new GatedMcp()], { toolGate: gate }), {});
    const read = await harness.client.readResource({ uri: 'gate://res' });
    expect(read.contents[0]).toMatchObject({ text: 'resource' });
    expect(gate).not.toHaveBeenCalled();
  });

  it('leaves dynamic tools to their own source', async () => {
    const gate = vi.fn<McpToolGate>(() => REFUSAL);
    const dynamic: McpDynamicTool = {
      options: { name: 'dyn', inputSchema: {}, access: () => true },
      handler: () => ({ content: [{ type: 'text', text: 'dynamic ran' }] }),
    };
    harness = await createAttachHarness(createTestRegistry([], { toolGate: gate }), {}, { dynamicTools: () => [dynamic] });
    expect(textOf(await harness.client.callTool({ name: 'dyn', arguments: {} }))).toBe('dynamic ran');
    expect(gate).not.toHaveBeenCalled();
  });

  it('runs after onInvoke and inside around, so the audit and the trace still see a refused call', async () => {
    const order: string[] = [];
    const registry = createTestRegistry([new GatedMcp()], {
      toolGate: () => {
        order.push('gate');
        return REFUSAL;
      },
    });
    harness = await createAttachHarness(registry, {}, {
      onInvoke: () => order.push('onInvoke'),
      around: async (_info, call) => {
        order.push('around:in');
        const out = await call();
        order.push('around:out');
        return out;
      },
    });
    await harness.client.callTool({ name: 'write_it', arguments: { n: 1 } });
    expect(order).toEqual(['onInvoke', 'around:in', 'gate', 'around:out']);
  });

  it('is skipped entirely without a configured gate', async () => {
    const mcp = new GatedMcp();
    harness = await createAttachHarness(createTestRegistry([mcp]), { userId: 1 });
    await harness.client.callTool({ name: 'write_it', arguments: { n: 5 } });
    expect(mcp.calls).toBe(1);
  });
});

@Injectable()
class Verdicts {
  refuse = true;
}

@Module({ providers: [Verdicts, GatedMcp], exports: [Verdicts] })
class GatedModule {}

describe('McpModule.forRoot toolGate', () => {
  let harness: AttachHarness | undefined;
  afterEach(async () => {
    await harness?.cleanup();
    harness = undefined;
  });

  it('builds the gate from the container with its injected providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        GatedModule,
        McpModule.forRoot({
          toolGate: {
            imports: [GatedModule],
            inject: [Verdicts],
            useFactory: (verdicts: Verdicts) => () => (verdicts.refuse ? REFUSAL : undefined),
          },
        }),
      ],
    }).compile();
    await moduleRef.init();
    harness = await createAttachHarness(moduleRef.get(McpRegistryService), { userId: 1 });
    expect(await harness.client.callTool({ name: 'write_it', arguments: { n: 1 } })).toEqual(REFUSAL);
    moduleRef.get(Verdicts).refuse = false;
    expect(JSON.parse(textOf(await harness.client.callTool({ name: 'write_it', arguments: { n: 1 } })))).toEqual({ n: 1, userId: 1 });
    await moduleRef.close();
  });

  it('boots without a gate and runs every handler', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [GatedModule, McpModule.forRoot()] }).compile();
    await moduleRef.init();
    harness = await createAttachHarness(moduleRef.get(McpRegistryService), { userId: 2 });
    expect(JSON.parse(textOf(await harness.client.callTool({ name: 'write_it', arguments: { n: 3 } })))).toEqual({ n: 3, userId: 2 });
    await moduleRef.close();
  });
});
