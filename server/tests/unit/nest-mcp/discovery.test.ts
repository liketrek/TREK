import { McpController, McpModule, McpRegistryService, Tool, type McpAccessPolicy } from '../../../src/nest-mcp';
import { createAttachHarness, type AttachHarness, type TestCtx } from './harness';
import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import 'reflect-metadata';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

@Injectable()
class CounterService {
  private n = 0;
  next(): number {
    return ++this.n;
  }
}

@McpController()
class CounterMcp {
  constructor(private readonly counter: CounterService) {}

  @Tool({ name: 'count', inputSchema: { by: z.number().optional() }, access: { group: 'trips', mode: 'read' } })
  async count(_args: { by?: number }, ctx: TestCtx) {
    return { content: [{ type: 'text', text: JSON.stringify({ value: this.counter.next(), userId: ctx.userId }) }] };
  }
}

@Injectable()
class PlainProvider {
  ignoredMethod() {}
}

@Module({ providers: [CounterService, CounterMcp], exports: [] })
class CounterModule {}

const policy: McpAccessPolicy = (_access, ctx) => (ctx as TestCtx).canRead === true;

describe('McpRegistryService discovery', () => {
  let harness: AttachHarness | undefined;
  afterEach(async () => {
    await harness?.cleanup();
    harness = undefined;
  });

  it('discovers only @McpController providers, across feature modules', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [McpModule.forRoot({ accessPolicy: policy }), CounterModule],
      providers: [PlainProvider],
    }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(McpRegistryService);
    expect(registry.list()).toEqual([
      expect.objectContaining({ kind: 'tool', name: 'count', className: 'CounterMcp', methodName: 'count' }),
    ]);
    await moduleRef.close();
  });

  it('registers boot-discovered entries with working constructor injection', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [McpModule.forRoot({ accessPolicy: policy }), CounterModule],
    }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(McpRegistryService);
    harness = await createAttachHarness(registry, { userId: 5, canRead: true });
    const result = await harness.client.callTool({ name: 'count', arguments: {} });
    const text = (result.content as { type: string; text: string }[]).find((c) => c.type === 'text');
    expect(JSON.parse(text?.text ?? '')).toEqual({ value: 1, userId: 5 });
    await moduleRef.close();
  });

  it('fails app boot (onModuleInit) on duplicate tool names', async () => {
    @McpController()
    class CountClone {
      @Tool({ name: 'count' })
      async countAgain() {
        return { content: [{ type: 'text', text: 'clone' }] };
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [McpModule.forRoot({ accessPolicy: policy }), CounterModule],
      providers: [CountClone],
    }).compile();
    await expect(moduleRef.init()).rejects.toThrow(/duplicate MCP registrations: tool "count"/);
  });

  it('boots without an accessPolicy and still attaches predicate/ungated entries', async () => {
    @McpController()
    class OpenMcp {
      @Tool({ name: 'open' })
      async open() {
        return { content: [{ type: 'text', text: 'ok' }] };
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [McpModule.forRoot()],
      providers: [OpenMcp],
    }).compile();
    await moduleRef.init();

    const registry = moduleRef.get(McpRegistryService);
    harness = await createAttachHarness(registry, {});
    expect((await harness.client.listTools()).tools.map((t) => t.name)).toEqual(['open']);
    await moduleRef.close();
  });
});
