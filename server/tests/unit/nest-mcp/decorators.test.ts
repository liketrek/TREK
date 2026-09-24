import { McpController, Prompt, Resource, ResourceTemplate, Tool } from '../../../src/nest-mcp';
import { getEntry, isMcpController, type ClassRef } from '../../../src/nest-mcp/metadata';

import { describe, expect, it } from 'vitest';
import { z, type ZodRawShape } from 'zod';

@McpController()
class Decorated {
  @Tool({
    name: 'do_thing',
    description: 'Does a thing.',
    inputSchema: { what: z.string() },
    annotations: { readOnlyHint: true },
    access: { group: 'places', mode: 'read' },
  })
  doThing() {}

  @Resource({ name: 'thing_doc', uri: 'trek://thing', mimeType: 'application/json' })
  readThing() {}

  @ResourceTemplate({ name: 'thing_by_id', uriTemplate: 'trek://thing/{id}' })
  readThingById() {}

  @Prompt({ name: 'thing_prompt', description: 'Prompt.', argsSchema: { topic: z.string() } })
  promptThing() {}

  undecorated() {}
}

class Plain {
  @Tool({ name: 'orphan_tool' })
  orphan() {}
}

@McpController()
class Child extends Decorated {
  @Tool({ name: 'child_tool' })
  childThing() {}
}

const ctor = (c: unknown): ClassRef => c as ClassRef;

describe('nest-mcp decorators', () => {
  it('@McpController marks the class', () => {
    expect(isMcpController(Decorated)).toBe(true);
    expect(isMcpController(Plain)).toBe(false);
    expect(isMcpController(42)).toBe(false);
  });

  it('@McpController applies @Injectable (Nest watermark present)', () => {
    expect(Reflect.getMetadata('__injectable__', Decorated)).toBe(true);
    expect(Reflect.getMetadata('__injectable__', Plain)).toBeUndefined();
  });

  it('records one entry per decorated method with kind, name and options', () => {
    const tool = getEntry(ctor(Decorated), 'doThing');
    expect(tool).toMatchObject({
      kind: 'tool',
      methodName: 'doThing',
      options: {
        name: 'do_thing',
        description: 'Does a thing.',
        annotations: { readOnlyHint: true },
        access: { group: 'places', mode: 'read' },
      },
    });

    expect(getEntry(ctor(Decorated), 'readThing')).toMatchObject({
      kind: 'resource',
      options: { name: 'thing_doc', uri: 'trek://thing', mimeType: 'application/json' },
    });
    expect(getEntry(ctor(Decorated), 'readThingById')).toMatchObject({
      kind: 'resourceTemplate',
      options: { name: 'thing_by_id', uriTemplate: 'trek://thing/{id}' },
    });
    expect(getEntry(ctor(Decorated), 'promptThing')).toMatchObject({
      kind: 'prompt',
      options: { name: 'thing_prompt' },
    });
  });

  it('passes the Zod raw shape through untouched', () => {
    const tool = getEntry(ctor(Decorated), 'doThing');
    expect(tool?.kind).toBe('tool');
    if (tool?.kind === 'tool') {
      // inputSchema is `ZodRawShape | McpZodSchema` since dynamic tools started
      // passing whole schemas; this decorator declared the raw-shape arm.
      expect((tool.options.inputSchema as ZodRawShape).what).toBeInstanceOf(z.ZodString);
    }
  });

  it('returns nothing for undecorated methods', () => {
    expect(getEntry(ctor(Decorated), 'undecorated')).toBeUndefined();
    expect(getEntry(ctor(Decorated), 'nope')).toBeUndefined();
  });

  it('entries decorated on a class without @McpController are still recorded per-method', () => {
    // The controller marker gates discovery/registration, not metadata capture.
    expect(getEntry(ctor(Plain), 'orphan')).toMatchObject({ kind: 'tool', options: { name: 'orphan_tool' } });
  });

  it('subclasses see inherited entries through the constructor prototype chain', () => {
    expect(getEntry(ctor(Child), 'doThing')).toMatchObject({ options: { name: 'do_thing' } });
    expect(getEntry(ctor(Child), 'childThing')).toMatchObject({ options: { name: 'child_tool' } });
    // parent does not see the child's entries
    expect(getEntry(ctor(Decorated), 'childThing')).toBeUndefined();
  });
});
