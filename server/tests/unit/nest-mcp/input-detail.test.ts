/**
 * A tool that moves a large field into its help topic (`detail`): tools/list
 * shows a permissive stand-in and the pointer, every call is still parsed
 * against the full shape before the handler runs, and the registry hands the
 * full reference to get_help_page. Plus the boot checks on `detail` and on
 * titles (`requireToolTitles`).
 */
import {
  createTestRegistry,
  McpController,
  McpRegistry,
  renderToolHelp,
  Tool,
  toolHelpSlug,
} from '../../../src/nest-mcp';
import { looseField } from '../../../src/nest-mcp/input-detail';
import { createAttachHarness, type AttachHarness } from './harness';

import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

const opSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('move'), x: z.number().int(), y: z.number().int() }),
  z.object({ op: z.literal('remove'), elementId: z.string().min(1) }),
]);

@McpController()
class DetailedMcp {
  received: unknown[] = [];

  @Tool({
    name: 'edit_thing',
    title: 'Edit a thing',
    description: 'Change one thing with operations.',
    inputSchema: {
      thingId: z.number().int(),
      ops: z.array(opSchema).min(1).max(3).describe('The operations, in order.'),
    },
    detail: { fields: ['ops'], text: 'Operations run in order, all or nothing.' },
    annotations: { readOnlyHint: false },
  })
  async editThing(args: unknown) {
    this.received.push(args);
    return { content: [{ type: 'text', text: 'ok' }] };
  }

  @Tool({ name: 'plain', title: 'Plain tool', inputSchema: { n: z.number() } })
  async plain() {
    return { content: [{ type: 'text', text: 'plain' }] };
  }
}

let harness: AttachHarness | undefined;
afterEach(async () => {
  await harness?.cleanup();
  harness = undefined;
});

describe('tool detail', () => {
  it('DETAIL-001: tools/list shows the stand-in with the discriminator kept, and the pointer in the description', async () => {
    const instance = new DetailedMcp();
    harness = await createAttachHarness(createTestRegistry([instance]), {});
    const tool = (await harness.client.listTools()).tools.find((t) => t.name === 'edit_thing');
    if (!tool) throw new Error('edit_thing is not listed');
    expect(tool.description).toBe(
      `Change one thing with operations. Full reference: get_help_page slug "${toolHelpSlug('edit_thing')}".`,
    );
    const ops = (tool.inputSchema.properties as Record<string, { items: { properties: unknown }; description: string }>)
      .ops;
    expect(ops.items.properties).toEqual({ op: { type: 'string', enum: ['move', 'remove'] } });
    expect(ops.description).toContain('The operations, in order.');
    expect(JSON.stringify(ops)).not.toContain('elementId');
  });

  it('DETAIL-002: a call that fits the full shape reaches the handler as before', async () => {
    const instance = new DetailedMcp();
    harness = await createAttachHarness(createTestRegistry([instance]), {});
    const result = await harness.client.callTool({
      name: 'edit_thing',
      arguments: { thingId: 4, ops: [{ op: 'move', x: 1, y: 2 }] },
    });
    expect(result.isError).toBeFalsy();
    expect(instance.received).toEqual([{ thingId: 4, ops: [{ op: 'move', x: 1, y: 2 }] }]);
  });

  it('DETAIL-003: a call the stand-in lets through but the full shape refuses is answered with the issues', async () => {
    const instance = new DetailedMcp();
    harness = await createAttachHarness(createTestRegistry([instance]), {});
    const result = (await harness.client.callTool({
      name: 'edit_thing',
      arguments: { thingId: 4, ops: [{ op: 'remove' }] },
    })) as { isError?: boolean; content: Array<{ text: string }> };
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/^Invalid arguments for edit_thing: ops\.0\.elementId: /);
    expect(result.content[0].text).toContain('get_help_page slug "tool/edit_thing"');
    expect(instance.received).toEqual([]);
  });

  it('DETAIL-004: the registry hands out the full reference, rendered with the whole schema and the text', () => {
    const registry = createTestRegistry([new DetailedMcp()]);
    expect(registry.toolHelpTopics().map((t) => t.name)).toEqual(['edit_thing']);
    expect(registry.toolHelpTopic('plain')).toBeUndefined();
    const topic = registry.toolHelpTopic('edit_thing');
    if (!topic) throw new Error('edit_thing has no reference');
    const markdown = renderToolHelp(topic);
    expect(markdown).toContain('# Edit a thing');
    expect(markdown).toContain('Operations run in order, all or nothing.');
    expect(markdown).toContain('"elementId"');
  });

  it('DETAIL-005: the stand-in keeps optionals, nullables and records open', () => {
    const schema = z.object({
      a: z.object({ b: z.string() }).nullable().optional(),
      r: z.record(z.string(), z.number()),
    });
    const loose = z.toJSONSchema(looseField(schema.shape.a, 't')) as { description: string };
    expect(loose.description).toContain('get_help_page slug "tool/t"');
    expect(looseField(schema.shape.a, 't').safeParse(undefined).success).toBe(true);
    expect(looseField(schema.shape.a, 't').safeParse(null).success).toBe(true);
    expect(looseField(schema.shape.r, 't').safeParse({ x: 'anything' }).success).toBe(true);
    expect(looseField(z.union([z.string(), z.number()]), 't').safeParse({}).success).toBe(true);
  });

  it('DETAIL-006: a detail naming a field the input does not have fails the boot check', () => {
    @McpController()
    class Broken {
      @Tool({ name: 'broken', title: 'Broken', inputSchema: { a: z.string() }, detail: { fields: ['b'] } })
      broken() {}
    }
    expect(() => createTestRegistry([new Broken()])).toThrow(/detail\.fields names no input field b/);
  });
});

describe('requireToolTitles', () => {
  it('TITLE-001: a tool without a title, or with a name past 64 characters, fails validation', () => {
    @McpController()
    class Untitled {
      @Tool({ name: 'no_title' })
      a() {}

      @Tool({ name: 'x'.repeat(65), title: 'Long' })
      b() {}

      @Tool({ name: 'fine', title: 'Fine' })
      c() {}
    }
    const registry = new McpRegistry({ requireToolTitles: true });
    registry.register(new Untitled());
    expect(() => registry.validate()).toThrow(
      /tools without a title or with a name past 64 characters: no_title .*x{65}/,
    );
    expect(() => createTestRegistry([new Untitled()])).not.toThrow();
  });
});
