import {
  createTestRegistry,
  McpController,
  McpModule,
  McpRegistryService,
  Tool,
  type McpDynamicTool,
} from '../../../src/nest-mcp';
import { createAttachHarness, type AttachHarness } from './harness';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import 'reflect-metadata';

import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

class Refusal extends Error {}

const mapRefusal = (err: unknown) =>
  err instanceof Refusal ? { content: [{ type: 'text', text: `mapped: ${err.message}` }], isError: true } : undefined;

@McpController()
class ThrowingMcp {
  @Tool({ name: 'refuse', inputSchema: { why: z.string() } })
  async refuse({ why }: { why: string }) {
    throw new Refusal(why);
  }

  @Tool({ name: 'refuse_sync', inputSchema: {} })
  refuseSync() {
    throw new Refusal('sync');
  }

  @Tool({ name: 'crash', inputSchema: {} })
  async crash() {
    throw new Error('boom');
  }

  @Tool({ name: 'fine', inputSchema: {} })
  async fine() {
    return { content: [{ type: 'text', text: 'ok' }] };
  }
}

@Module({ providers: [ThrowingMcp] })
class ThrowingModule {}

const textOf = (result: unknown): string => (result as { content: { text: string }[] }).content[0].text;

describe('tool error mapper', () => {
  let harness: AttachHarness | undefined;
  afterEach(async () => {
    await harness?.cleanup();
    harness = undefined;
  });

  it('answers with the mapped result for an error the mapper recognises', async () => {
    harness = await createAttachHarness(createTestRegistry([new ThrowingMcp()], { errorMapper: mapRefusal }), {});
    expect(await harness.client.callTool({ name: 'refuse', arguments: { why: 'nope' } })).toEqual({
      content: [{ type: 'text', text: 'mapped: nope' }],
      isError: true,
    });
    expect(textOf(await harness.client.callTool({ name: 'refuse_sync', arguments: {} }))).toBe('mapped: sync');
  });

  it('lets an error the mapper does not recognise propagate as before', async () => {
    harness = await createAttachHarness(createTestRegistry([new ThrowingMcp()], { errorMapper: mapRefusal }), {});
    const result = await harness.client.callTool({ name: 'crash', arguments: {} });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain('boom');
  });

  it('passes a successful result through untouched', async () => {
    harness = await createAttachHarness(createTestRegistry([new ThrowingMcp()], { errorMapper: mapRefusal }), {});
    expect(textOf(await harness.client.callTool({ name: 'fine', arguments: {} }))).toBe('ok');
  });

  it('maps nothing without a configured mapper', async () => {
    harness = await createAttachHarness(createTestRegistry([new ThrowingMcp()]), {});
    const result = await harness.client.callTool({ name: 'refuse', arguments: { why: 'raw' } });
    expect(result.isError).toBe(true);
    expect(textOf(result)).not.toContain('mapped');
  });

  it('leaves dynamic tools to their own source', async () => {
    const dynamic: McpDynamicTool = {
      options: { name: 'dyn', inputSchema: {}, access: () => true },
      handler: () => {
        throw new Refusal('dynamic');
      },
    };
    harness = await createAttachHarness(
      createTestRegistry([], { errorMapper: mapRefusal }),
      {},
      { dynamicTools: () => [dynamic] },
    );
    expect(textOf(await harness.client.callTool({ name: 'dyn', arguments: {} }))).not.toContain('mapped');
  });

  it('is handed through McpModule.forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrowingModule, McpModule.forRoot({ errorMapper: mapRefusal })],
    }).compile();
    await moduleRef.init();
    harness = await createAttachHarness(moduleRef.get(McpRegistryService), {});
    expect(textOf(await harness.client.callTool({ name: 'refuse', arguments: { why: 'di' } }))).toBe('mapped: di');
    await moduleRef.close();
  });
});
