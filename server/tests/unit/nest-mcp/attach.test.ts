import {
  createTestRegistry,
  McpController,
  McpRegistry,
  Prompt,
  Resource,
  ResourceTemplate,
  Tool,
  type McpAccessPolicy,
  type McpContext,
  type PromptArgsShape,
} from '../../../src/nest-mcp';
import { createAttachHarness, type AttachHarness, type TestCtx } from './harness';

import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

class Greeter {
  greet(name: string): string {
    return `hello ${name}`;
  }
}

@McpController()
class FixtureMcp {
  constructor(private readonly greeter: Greeter) {}

  @Tool({
    name: 'read_tool',
    description: 'Reads.',
    inputSchema: { name: z.string() },
    annotations: { readOnlyHint: true },
    access: { group: 'trips', mode: 'read' },
  })
  async readTool({ name }: { name: string }, ctx: TestCtx) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ greeting: this.greeter.greet(name), userId: ctx.userId }) }],
    };
  }

  @Tool({ name: 'write_tool', inputSchema: {}, access: { group: 'trips', mode: 'write' } })
  async writeTool(_args: Record<string, never>, ctx: TestCtx) {
    return { content: [{ type: 'text', text: `wrote as ${ctx.userId}` }] };
  }

  // A whole schema, the way a plugin's manifest-built tool arrives: its author
  // decided how open it is, and the registry must not tighten it.
  @Tool({ name: 'loose_tool', inputSchema: z.looseObject({ name: z.string() }) })
  async looseTool(args: Record<string, unknown>, ctx: TestCtx) {
    return { content: [{ type: 'text', text: JSON.stringify({ args, userId: ctx.userId }) }] };
  }

  @Tool({ name: 'predicate_tool', access: (ctx: McpContext) => (ctx as TestCtx).allow === true })
  async predicateTool(args: Record<string, never>, ctx: TestCtx) {
    return { content: [{ type: 'text', text: JSON.stringify({ args, userId: ctx.userId }) }] };
  }

  @Tool({ name: 'open_tool' })
  async openTool(args: Record<string, never>, ctx: TestCtx) {
    return { content: [{ type: 'text', text: JSON.stringify({ args, userId: ctx.userId }) }] };
  }

  @Resource({
    name: 'fixture_doc',
    uri: 'test://doc',
    mimeType: 'text/plain',
    access: { group: 'trips', mode: 'read' },
  })
  async readDoc(uri: URL, ctx: TestCtx) {
    return { contents: [{ uri: uri.href, text: `doc for ${ctx.userId}` }] };
  }

  @ResourceTemplate({ name: 'fixture_item', uriTemplate: 'test://item/{id}' })
  async readItem(uri: URL, variables: { id: string }, ctx: TestCtx) {
    return { contents: [{ uri: uri.href, text: `item ${variables.id} for ${ctx.userId}` }] };
  }

  @Prompt({ name: 'fixture_prompt', description: 'Prompts.', argsSchema: { topic: z.string() } })
  async fixturePrompt({ topic }: { topic: string }, ctx: TestCtx) {
    return { messages: [{ role: 'user', content: { type: 'text', text: `${topic} for ${ctx.userId}` } }] };
  }

  // Arguments reach the server as strings; a numeric one is parsed on the way in.
  @Prompt({ name: 'fixture_count', argsSchema: { count: z.string().regex(/^\d+$/).transform(Number) } })
  async fixtureCount({ count }: { count: number }, ctx: TestCtx) {
    return { messages: [{ role: 'user', content: { type: 'text', text: `${typeof count} ${count + 1} for ${ctx.userId}` } }] };
  }

  @Prompt({ name: 'fixture_bare', argsSchema: {} })
  async fixtureBare(args: Record<string, never>, ctx: TestCtx) {
    return { messages: [{ role: 'user', content: { type: 'text', text: `${Object.keys(args).length} args for ${ctx.userId}` } }] };
  }
}

@McpController()
class DeclarativeOnly {
  @Tool({ name: 'gated_tool', access: { group: 'trips', mode: 'read' } })
  async gated() {
    return { content: [{ type: 'text', text: 'gated' }] };
  }
}

@McpController()
class WhenMcp {
  @Tool({
    name: 'when_scoped_tool',
    access: { group: 'trips', mode: 'read' },
    when: (ctx: McpContext) => (ctx as TestCtx).allow === true,
  })
  async whenScoped() {
    return { content: [{ type: 'text', text: 'ok' }] };
  }

  @Tool({ name: 'when_only_tool', when: (ctx: McpContext) => (ctx as TestCtx).allow === true })
  async whenOnly() {
    return { content: [{ type: 'text', text: 'ok' }] };
  }

  // Ungated: keeps the tools capability advertised even when every gated
  // entry is filtered (an SDK server with zero tools rejects tools/list).
  @Tool({ name: 'probe_tool' })
  async probe() {
    return { content: [{ type: 'text', text: 'ok' }] };
  }

  // The gate reads the DECLARING INSTANCE rather than a module-level value.
  // This is the shape a host needs to answer "is this addon on" from an
  // injected service: the options object is built when the class is defined,
  // so without `self` the closure has nothing but imports to reach for.
  @Tool({ name: 'self_gated_tool', when: (_ctx, self: WhenMcp) => self.featureOn })
  async selfGated() {
    return { content: [{ type: 'text', text: 'ok' }] };
  }

  featureOn = false;
}

const policy: McpAccessPolicy = ({ mode }, ctx) =>
  mode === 'write' ? (ctx as TestCtx).canWrite === true : (ctx as TestCtx).canRead === true;

const buildRegistry = () => createTestRegistry([new FixtureMcp(new Greeter())], { accessPolicy: policy });

const textOf = (result: unknown): string => {
  const content = (result as { content: { type: string; text: string }[] }).content;
  const item = content.find((c) => c.type === 'text');
  if (!item) throw new Error('no text content');
  return item.text;
};

describe('McpRegistry.attach', () => {
  let harness: AttachHarness | undefined;
  afterEach(async () => {
    await harness?.cleanup();
    harness = undefined;
  });

  it('registers everything for a ctx passing all access checks', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 7, canRead: true, canWrite: true, allow: true });
    const tools = (await harness.client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(['loose_tool', 'open_tool', 'predicate_tool', 'read_tool', 'write_tool']);
    const resources = (await harness.client.listResources()).resources.map((r) => r.name);
    expect(resources).toEqual(['fixture_doc']);
    const templates = (await harness.client.listResourceTemplates()).resourceTemplates.map((t) => t.name);
    expect(templates).toEqual(['fixture_item']);
    const prompts = (await harness.client.listPrompts()).prompts.map((p) => p.name).sort();
    expect(prompts).toEqual(['fixture_bare', 'fixture_count', 'fixture_prompt']);
  });

  it('filters declarative access through the policy per mode', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 7, canRead: true, canWrite: false, allow: false });
    const tools = (await harness.client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(['loose_tool', 'open_tool', 'read_tool']);
  });

  it('filters everything gated when the ctx grants nothing, keeping ungated entries', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 7 });
    const tools = (await harness.client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(['loose_tool', 'open_tool']);
    expect((await harness.client.listResources()).resources).toEqual([]);
    const templates = (await harness.client.listResourceTemplates()).resourceTemplates.map((t) => t.name);
    expect(templates).toEqual(['fixture_item']);
  });

  it('exposes tool metadata (description, annotations, input schema) to the client', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 7, canRead: true, canWrite: true, allow: true });
    const read = (await harness.client.listTools()).tools.find((t) => t.name === 'read_tool');
    expect(read?.description).toBe('Reads.');
    expect(read?.annotations).toMatchObject({ readOnlyHint: true });
    expect(read?.inputSchema).toMatchObject({ type: 'object', properties: { name: { type: 'string' } } });
  });

  it('binds (args, ctx) and preserves `this` on tool handlers', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 42, canRead: true, canWrite: true, allow: true });
    const result = await harness.client.callTool({ name: 'read_tool', arguments: { name: 'trek' } });
    expect(JSON.parse(textOf(result))).toEqual({ greeting: 'hello trek', userId: 42 });
  });

  it('refuses an argument the tool never declared instead of stripping it', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 42, canRead: true, canWrite: true, allow: true });
    // A shape is registered strict: the SDK would otherwise drop `nmae` and run
    // the handler as if the caller had sent nothing wrong.
    const refused = await harness.client.callTool({ name: 'read_tool', arguments: { name: 'trek', nmae: 'typo' } });
    expect(refused.isError).toBe(true);
    expect(textOf(refused)).toMatch(/Unrecognized key.*nmae/);
    // An empty shape is strict too: nothing declared means nothing accepted.
    const stray = await harness.client.callTool({ name: 'write_tool', arguments: { anything: 1 } });
    expect(stray.isError).toBe(true);
    expect(textOf(stray)).toMatch(/Unrecognized key.*anything/);
    expect(textOf(await harness.client.callTool({ name: 'write_tool', arguments: {} }))).toBe('wrote as 42');
    // tools/list says so up front, so a client that reads the schema never sends it.
    const tools = (await harness.client.listTools()).tools;
    expect(tools.find((t) => t.name === 'read_tool')?.inputSchema).toMatchObject({ additionalProperties: false });
    expect(tools.find((t) => t.name === 'write_tool')?.inputSchema).toMatchObject({ additionalProperties: false });
  });

  it('hands a whole schema to the SDK as written, however open its author left it', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 42 });
    const result = await harness.client.callTool({ name: 'loose_tool', arguments: { name: 'trek', extra: 'kept' } });
    expect(JSON.parse(textOf(result))).toEqual({ args: { name: 'trek', extra: 'kept' }, userId: 42 });
    const loose = (await harness.client.listTools()).tools.find((t) => t.name === 'loose_tool');
    expect(loose?.inputSchema).not.toHaveProperty('additionalProperties', false);
  });

  it('normalizes args to {} for tools declared without an inputSchema', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 42 });
    const result = await harness.client.callTool({ name: 'open_tool', arguments: {} });
    expect(JSON.parse(textOf(result))).toEqual({ args: {}, userId: 42 });
  });

  it('serves fixed resources with (uri, ctx)', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 9, canRead: true });
    const result = await harness.client.readResource({ uri: 'test://doc' });
    expect(result.contents[0]).toMatchObject({ uri: 'test://doc', text: 'doc for 9' });
  });

  it('serves resource templates with (uri, variables, ctx)', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 9 });
    const result = await harness.client.readResource({ uri: 'test://item/42' });
    expect(result.contents[0]).toMatchObject({ uri: 'test://item/42', text: 'item 42 for 9' });
  });

  it('serves prompts with (args, ctx)', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 3 });
    const result = await harness.client.getPrompt({ name: 'fixture_prompt', arguments: { topic: 'packing' } });
    expect(result.messages[0]?.content).toMatchObject({ type: 'text', text: 'packing for 3' });
  });

  it('hands prompt handlers the transformed argument, not the wire string (#2207)', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 3 });
    const result = await harness.client.getPrompt({ name: 'fixture_count', arguments: { count: '41' } });
    expect(result.messages[0]?.content).toMatchObject({ type: 'text', text: 'number 42 for 3' });
    await expect(harness.client.getPrompt({ name: 'fixture_count', arguments: { count: 'many' } }))
      .rejects.toThrow(/Invalid arguments for prompt fixture_count/);
  });

  it('serves a prompt with an empty argsSchema to a request that omits arguments', async () => {
    harness = await createAttachHarness(buildRegistry(), { userId: 3 });
    const result = await harness.client.getPrompt({ name: 'fixture_bare' });
    expect(result.messages[0]?.content).toMatchObject({ type: 'text', text: '0 args for 3' });
    const listed = (await harness.client.listPrompts()).prompts.find((p) => p.name === 'fixture_bare');
    expect(listed?.arguments).toBeUndefined();
  });

  it('only admits string-input schemas as prompt arguments', () => {
    // Compile-time contract: a z.number() argument can never be satisfied over
    // the wire, so PromptArgsShape refuses it while string, optional string and
    // string-to-number transforms all pass.
    type Admits<S> = S extends PromptArgsShape ? true : false;
    const numberRefused: Admits<{ tripId: z.ZodNumber }> = false;
    const stringAdmitted: Admits<{ topic: z.ZodString }> = true;
    const optionalAdmitted: Admits<{ topic: z.ZodOptional<z.ZodString> }> = true;
    const transformAdmitted: Admits<{ count: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>> }> = true;
    expect([numberRefused, stringAdmitted, optionalAdmitted, transformAdmitted]).toEqual([false, true, true, true]);
  });

  it('ANDs `when` in front of declarative access (both must pass)', async () => {
    const registry = createTestRegistry([new WhenMcp()], { accessPolicy: policy });
    harness = await createAttachHarness(registry, { userId: 7, canRead: true, allow: true });
    const tools = (await harness.client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(['probe_tool', 'when_only_tool', 'when_scoped_tool']);
  });

  it('hands `when` the instance that declared the entry, resolved at attach', async () => {
    const controller = new WhenMcp();
    const registry = createTestRegistry([controller], { accessPolicy: policy });

    harness = await createAttachHarness(registry, { userId: 7 });
    expect((await harness.client.listTools()).tools.map((t) => t.name)).not.toContain('self_gated_tool');
    await harness.cleanup();

    // Flipped AFTER registration: a gate that had captured a value when the
    // class was defined could not see this, which is exactly why hosts reached
    // for a module-level singleton instead of an injected one.
    controller.featureOn = true;
    harness = await createAttachHarness(registry, { userId: 7 });
    expect((await harness.client.listTools()).tools.map((t) => t.name)).toContain('self_gated_tool');
  });

  it('skips entries whose `when` gate fails, even when access would pass', async () => {
    const registry = createTestRegistry([new WhenMcp()], { accessPolicy: policy });
    harness = await createAttachHarness(registry, { userId: 7, canRead: true, allow: false });
    expect((await harness.client.listTools()).tools.map((t) => t.name)).toEqual(['probe_tool']);
  });

  it('skips when-gated entries whose access fails, keeping when-only ones', async () => {
    const registry = createTestRegistry([new WhenMcp()], { accessPolicy: policy });
    harness = await createAttachHarness(registry, { userId: 7, canRead: false, allow: true });
    const tools = (await harness.client.listTools()).tools.map((t) => t.name).sort();
    expect(tools).toEqual(['probe_tool', 'when_only_tool']);
  });

  it('createTestRegistry fails fast on declarative access without an accessPolicy', () => {
    expect(() => createTestRegistry([new DeclarativeOnly()])).toThrow(
      /declare declarative access but no accessPolicy was configured/,
    );
  });

  it('attach itself still guards declarative access without a policy (defense in depth)', () => {
    // Bypass createTestRegistry's validate() by assembling the registry by hand.
    const registry = new McpRegistry();
    registry.register(new DeclarativeOnly());
    expect(() =>
      registry.attach(
        // attach never gets far enough to need a live server here
        {} as Parameters<typeof registry.attach>[0],
        { userId: 1 } as McpContext,
      ),
    ).toThrow(/declares declarative access but no accessPolicy was configured/);
  });
});

describe('McpAttachOptions.onInvoke', () => {
  let harness: AttachHarness | undefined;
  afterEach(async () => {
    await harness?.cleanup();
    harness = undefined;
  });

  const fullCtx: TestCtx = { userId: 7, canRead: true, canWrite: true, allow: true };

  it('fires once per invocation with the entry kind and name — attach and listing stay silent', async () => {
    const seen: Array<{ kind: string; name: string }> = [];
    harness = await createAttachHarness(buildRegistry(), fullCtx, { onInvoke: (info) => seen.push(info) });
    // Neither attach() nor the initialize handshake is an invocation.
    expect(seen).toEqual([]);

    await harness.client.callTool({ name: 'open_tool', arguments: {} });
    expect(seen).toEqual([{ kind: 'tool', name: 'open_tool' }]);

    // The inputSchema'd tool goes through the other normalization branch.
    await harness.client.callTool({ name: 'read_tool', arguments: { name: 'x' } });
    expect(seen[1]).toEqual({ kind: 'tool', name: 'read_tool' });

    await harness.client.readResource({ uri: 'test://doc' });
    expect(seen[2]).toEqual({ kind: 'resource', name: 'fixture_doc' });

    await harness.client.readResource({ uri: 'test://item/5' });
    expect(seen[3]).toEqual({ kind: 'resourceTemplate', name: 'fixture_item' });

    await harness.client.getPrompt({ name: 'fixture_prompt', arguments: { topic: 't' } });
    expect(seen[4]).toEqual({ kind: 'prompt', name: 'fixture_prompt' });

    // Listing is not an invocation.
    await harness.client.listTools();
    expect(seen).toHaveLength(5);
  });

  it('runs before the handler, so a throwing hook fails the invocation it observes', async () => {
    harness = await createAttachHarness(buildRegistry(), fullCtx, {
      onInvoke: () => {
        throw new Error('audit exploded');
      },
    });
    const result = await harness.client.callTool({ name: 'open_tool', arguments: {} });
    expect((result as { isError?: boolean }).isError).toBe(true);
  });
});
