/**
 * McpAttachOptions.dynamicTools — DYNTOOL-001 to DYNTOOL-012.
 *
 * The per-session seam that lets a host contribute tools it did not decorate.
 * Two properties carry the weight here and both are security properties, not
 * conveniences: a contributed tool can never take a registered entry's name,
 * and nothing a contributor does can make attach() throw. Hosts call attach()
 * outside their request try block, so an escape is a 500 on every initialize.
 */
import { McpController, Tool, createTestRegistry, type McpAccessPolicy, type McpDynamicTool, type McpContext } from '../../../src/nest-mcp';
import { createAttachHarness, type TestCtx } from './harness';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

@McpController()
class Builtins {
  @Tool({
    name: 'read_thing',
    description: 'A registered read tool.',
    inputSchema: { id: z.number() },
    access: { group: 'thing', mode: 'read' } as never,
  })
  readThing(): { content: Array<{ type: 'text'; text: string }> } {
    return { content: [{ type: 'text', text: 'builtin read' }] };
  }

  @Tool({
    name: 'write_thing',
    description: 'A registered write tool.',
    inputSchema: { id: z.number() },
    access: { group: 'thing', mode: 'write' } as never,
  })
  writeThing(): { content: Array<{ type: 'text'; text: string }> } {
    return { content: [{ type: 'text', text: 'builtin write' }] };
  }
}

/** No access marker, so it registers on a registry with no policy configured. */
@McpController()
class Ungated {
  @Tool({ name: 'ungated_thing', description: 'Needs no policy.' })
  ungatedThing(): { content: Array<{ type: 'text'; text: string }> } {
    return { content: [{ type: 'text', text: 'ungated' }] };
  }
}

/** Grants read to everyone, write only to a ctx that asked for it. */
const policy: McpAccessPolicy = ({ mode }, ctx) =>
  mode === 'read' ? true : (ctx as TestCtx).canWrite === true;

function makeRegistry() {
  return createTestRegistry([new Builtins()], { accessPolicy: policy });
}

function dynamicTool(over: Partial<McpDynamicTool> = {}): McpDynamicTool {
  return {
    options: {
      name: 'plugin_demo_echo',
      description: 'Echoes.',
      inputSchema: { value: z.string() },
      access: { group: 'thing', mode: 'read' } as never,
      ...(over.options ?? {}),
    },
    handler: () => ({ content: [{ type: 'text', text: 'dynamic' }] }),
    ...(over.handler ? { handler: over.handler } : {}),
    ...(over.owner ? { owner: over.owner } : {}),
  } as McpDynamicTool;
}

const listNames = async (client: { listTools: () => Promise<{ tools: Array<{ name: string }> }> }) =>
  (await client.listTools()).tools.map((t) => t.name);

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
});

describe('dynamic tools: the happy path', () => {
  it('DYNTOOL-001: registers a contributed tool and calls it', async () => {
    const h = await createAttachHarness(makeRegistry(), { canWrite: true }, {
      dynamicTools: () => [dynamicTool()],
    });

    expect(await listNames(h.client)).toContain('plugin_demo_echo');
    const res = await h.client.callTool({ name: 'plugin_demo_echo', arguments: { value: 'x' } });
    expect((res.content as Array<{ text: string }>)[0].text).toBe('dynamic');

    await h.cleanup();
  });

  it('DYNTOOL-002: binds owner as `this` on the handler', async () => {
    const owner = { marker: 'the-owner' };
    const h = await createAttachHarness(makeRegistry(), {}, {
      dynamicTools: () => [
        dynamicTool({
          owner,
          handler: function (this: typeof owner) {
            return { content: [{ type: 'text', text: this.marker }] };
          },
        }),
      ],
    });

    const res = await h.client.callTool({ name: 'plugin_demo_echo', arguments: { value: 'x' } });
    expect((res.content as Array<{ text: string }>)[0].text).toBe('the-owner');

    await h.cleanup();
  });

  it('DYNTOOL-003: hands the owner to when(ctx, self)', async () => {
    const owner = { enabled: false };
    const seen: object[] = [];
    const h = await createAttachHarness(makeRegistry(), {}, {
      dynamicTools: () => [
        dynamicTool({
          owner,
          options: {
            name: 'plugin_demo_gated',
            description: 'Gated.',
            access: { group: 'thing', mode: 'read' },
            when: (_ctx, self) => {
              seen.push(self);
              return (self as typeof owner).enabled;
            },
          } as unknown as McpDynamicTool['options'],
        }),
      ],
    });

    expect(seen).toEqual([owner]);
    expect(await listNames(h.client)).not.toContain('plugin_demo_gated');

    await h.cleanup();
  });

  it('DYNTOOL-004: fires onInvoke, so the host audit trail sees the call', async () => {
    const onInvoke = vi.fn();
    const h = await createAttachHarness(makeRegistry(), {}, {
      onInvoke,
      dynamicTools: () => [dynamicTool()],
    });

    await h.client.callTool({ name: 'plugin_demo_echo', arguments: { value: 'x' } });

    expect(onInvoke).toHaveBeenCalledWith({ kind: 'tool', name: 'plugin_demo_echo' });

    await h.cleanup();
  });

  it('DYNTOOL-005: registers contributed tools after every registered entry', async () => {
    const h = await createAttachHarness(makeRegistry(), { canWrite: true }, {
      dynamicTools: () => [dynamicTool()],
    });

    const names = await listNames(h.client);
    expect(names.indexOf('plugin_demo_echo')).toBeGreaterThan(names.indexOf('write_thing'));

    await h.cleanup();
  });
});

describe('dynamic tools: name reservation', () => {
  it('DYNTOOL-006: cannot take the name of a registered entry', async () => {
    const h = await createAttachHarness(makeRegistry(), { canWrite: true }, {
      dynamicTools: () => [dynamicTool({ options: { name: 'read_thing' } as McpDynamicTool['options'] })],
    });

    const names = await listNames(h.client);
    expect(names.filter((n) => n === 'read_thing')).toHaveLength(1);
    const res = await h.client.callTool({ name: 'read_thing', arguments: { id: 1 } });
    expect((res.content as Array<{ text: string }>)[0].text).toBe('builtin read');

    await h.cleanup();
  });

  it('DYNTOOL-007: reserves against every registered name, not the ones this session got', async () => {
    // canWrite is false, so write_thing is NOT attached for this session. The
    // name is still reserved: otherwise a contributor could occupy a built-in
    // for exactly the callers who hold no scope for it.
    const h = await createAttachHarness(makeRegistry(), { canWrite: false }, {
      dynamicTools: () => [dynamicTool({ options: { name: 'write_thing' } as McpDynamicTool['options'] })],
    });

    expect(await listNames(h.client)).not.toContain('write_thing');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('reserved by a registered entry'));

    await h.cleanup();
  });

  it('DYNTOOL-008: first wins on a duplicate within one source, and a denied entry still holds its name', async () => {
    const h = await createAttachHarness(makeRegistry(), {}, {
      dynamicTools: () => [
        // Denied by `when`, but it has claimed the name.
        dynamicTool({
          options: {
            name: 'plugin_demo_echo',
            description: 'First, denied.',
            access: { group: 'thing', mode: 'read' },
            when: () => false,
          } as unknown as McpDynamicTool['options'],
        }),
        dynamicTool({ options: { name: 'plugin_demo_echo', description: 'Second.' } as McpDynamicTool['options'] }),
      ],
    });

    expect(await listNames(h.client)).not.toContain('plugin_demo_echo');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('duplicate name in this source'));

    await h.cleanup();
  });
});

describe('dynamic tools: containment', () => {
  it('DYNTOOL-009: a throwing source costs the dynamic tools, not the session', async () => {
    const h = await createAttachHarness(makeRegistry(), { canWrite: true }, {
      dynamicTools: () => {
        throw new Error('the runtime is down');
      },
    });

    expect(await listNames(h.client)).toEqual(['read_thing', 'write_thing']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('the runtime is down'));

    await h.cleanup();
  });

  it('DYNTOOL-010: one bad entry is skipped and the rest still register', async () => {
    const h = await createAttachHarness(makeRegistry(), {}, {
      dynamicTools: () => [
        { options: { name: 'plugin_demo_broken', description: 'No handler.', access: { group: 'thing', mode: 'read' } }, handler: undefined } as unknown as McpDynamicTool,
        dynamicTool(),
      ],
    });

    const names = await listNames(h.client);
    expect(names).not.toContain('plugin_demo_broken');
    expect(names).toContain('plugin_demo_echo');

    await h.cleanup();
  });

  it('DYNTOOL-011: an entry with no access marker is skipped, never registered ungated', async () => {
    const h = await createAttachHarness(makeRegistry(), {}, {
      dynamicTools: () => [
        { options: { name: 'plugin_demo_ungated', description: 'No access.' }, handler: () => ({ content: [] }) } as unknown as McpDynamicTool,
      ],
    });

    expect(await listNames(h.client)).not.toContain('plugin_demo_ungated');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('access is required'));

    await h.cleanup();
  });

  it('DYNTOOL-012: declarative access with no configured policy is skipped, not thrown', async () => {
    // The second live throw site. A registered entry only avoids it because
    // validate() pre-checks it at boot; a per-session source has no boot.
    // The registry holds one marker-free entry so the server still advertises
    // a tools capability, which is what makes the skip observable.
    const noPolicy = createTestRegistry([new Ungated()]);
    const h = await createAttachHarness(noPolicy, {}, { dynamicTools: () => [dynamicTool()] });

    expect(await listNames(h.client)).toEqual(['ungated_thing']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessPolicy was configured'));

    await h.cleanup();
  });
});

describe('dynamic tools: absent', () => {
  it('DYNTOOL-013: attach without a source behaves exactly as before', async () => {
    const h = await createAttachHarness(makeRegistry(), { canWrite: true });

    expect(await listNames(h.client)).toEqual(['read_thing', 'write_thing']);
    expect(warn).not.toHaveBeenCalled();

    await h.cleanup();
  });
});

/** Kept honest: the ctx handed to the source is the session's own. */
describe('dynamic tools: context', () => {
  it('DYNTOOL-014: the source is consulted once, with this session ctx', async () => {
    const source = vi.fn((_ctx: McpContext) => [dynamicTool()]);
    const h = await createAttachHarness(makeRegistry(), { userId: 42, canWrite: true }, { dynamicTools: source });

    expect(source).toHaveBeenCalledTimes(1);
    expect(source.mock.calls[0][0]).toMatchObject({ userId: 42 });

    await h.cleanup();
  });
});
