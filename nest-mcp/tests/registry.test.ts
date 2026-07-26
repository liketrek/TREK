import { McpController, McpRegistry, Resource, Tool } from '../src';

import { describe, expect, it } from 'vitest';

@McpController()
class Alpha {
  @Tool({ name: 'alpha_one' })
  one() {}

  @Tool({ name: 'alpha_two', access: { group: 'a', mode: 'write' } })
  two() {}

  helper() {}
}

@McpController()
class Beta extends Alpha {
  @Tool({ name: 'beta_one' })
  betaOne() {}
}

class NotAController {
  @Tool({ name: 'nope' })
  nope() {}
}

describe('McpRegistry.register / list', () => {
  it('records every decorated method and lists it with class/method names', () => {
    const registry = new McpRegistry();
    registry.register(new Alpha());
    expect(registry.list()).toEqual([
      expect.objectContaining({ kind: 'tool', name: 'alpha_one', className: 'Alpha', methodName: 'one' }),
      expect.objectContaining({
        kind: 'tool',
        name: 'alpha_two',
        className: 'Alpha',
        methodName: 'two',
        access: { group: 'a', mode: 'write' },
      }),
    ]);
  });

  it('includes inherited decorated methods', () => {
    const registry = new McpRegistry();
    registry.register(new Beta());
    const names = registry.list().map((e) => e.name);
    expect(names).toContain('beta_one');
    expect(names).toContain('alpha_one');
    expect(names).toContain('alpha_two');
  });

  it('respects an explicit methodNames narrowing and dedupes repeats', () => {
    const registry = new McpRegistry();
    registry.register(new Alpha(), ['one', 'one', 'helper']);
    expect(registry.list().map((e) => e.name)).toEqual(['alpha_one']);
  });

  it('throws for instances whose class is not @McpController-decorated', () => {
    const registry = new McpRegistry();
    expect(() => registry.register(new NotAController())).toThrow(/not decorated with @McpController/);
  });
});

@McpController()
class AlphaClone {
  @Tool({ name: 'alpha_one' })
  cloned() {}
}

@McpController()
class DuplicateResources {
  @Resource({ name: 'doc_a', uri: 'test://same' })
  a() {}

  @Resource({ name: 'doc_b', uri: 'test://same' })
  b() {}
}

describe('McpRegistry.validate', () => {
  it('passes for a well-formed registry', () => {
    const registry = new McpRegistry({ accessPolicy: () => true });
    registry.register(new Alpha());
    expect(() => registry.validate()).not.toThrow();
  });

  it('reports duplicate tool names across classes with their origins', () => {
    const registry = new McpRegistry({ accessPolicy: () => true });
    registry.register(new Alpha());
    registry.register(new AlphaClone());
    expect(() => registry.validate()).toThrow(
      /duplicate MCP registrations: tool "alpha_one" \(Alpha\.one and AlphaClone\.cloned\)/,
    );
  });

  it('reports duplicate fixed-resource URIs (names may differ)', () => {
    const registry = new McpRegistry();
    registry.register(new DuplicateResources());
    expect(() => registry.validate()).toThrow(/duplicate MCP registrations: resource uri "test:\/\/same"/);
  });

  it('reports declarative access without a configured accessPolicy', () => {
    const registry = new McpRegistry();
    registry.register(new Alpha());
    expect(() => registry.validate()).toThrow(
      /declare declarative access but no accessPolicy was configured.*tool "alpha_two" \(Alpha\.two\)/,
    );
  });
});
