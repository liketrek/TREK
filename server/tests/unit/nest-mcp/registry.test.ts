import { McpController, McpRegistry, Resource, Tool, type McpAccessValidator } from '../../../src/nest-mcp';

import { describe, expect, it, vi } from 'vitest';

@McpController()
class Alpha {
  @Tool({ name: 'alpha_one' })
  one() {}

  @Tool({ name: 'alpha_two', access: { group: 'trips', mode: 'write' } })
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
        access: { group: 'trips', mode: 'write' },
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

@McpController()
class MixedAccess {
  @Tool({ name: 'open_tool' })
  open() {}

  @Tool({ name: 'predicate_tool', access: () => true })
  predicated() {}

  @Tool({ name: 'declared_read', access: { group: 'trips', mode: 'read' } })
  declaredRead() {}

  @Tool({ name: 'declared_write', access: { group: 'places', mode: 'write' } })
  declaredWrite() {}
}

describe('McpRegistry.validate — validateAccess hook', () => {
  it('invokes the hook once per declarative entry, never for predicate/omitted access', () => {
    const validateAccess = vi.fn<McpAccessValidator>(() => null);
    const registry = new McpRegistry({ accessPolicy: () => true, validateAccess });
    registry.register(new MixedAccess());
    expect(() => registry.validate()).not.toThrow();
    expect(validateAccess).toHaveBeenCalledTimes(2);
    expect(validateAccess).toHaveBeenCalledWith(
      { group: 'trips', mode: 'read' },
      expect.objectContaining({
        kind: 'tool',
        name: 'declared_read',
        className: 'MixedAccess',
        methodName: 'declaredRead',
      }),
    );
    expect(validateAccess).toHaveBeenCalledWith(
      { group: 'places', mode: 'write' },
      expect.objectContaining({
        kind: 'tool',
        name: 'declared_write',
        className: 'MixedAccess',
        methodName: 'declaredWrite',
      }),
    );
  });

  it('accepts null and undefined returns', () => {
    const returns: (string | null | undefined)[] = [null, undefined];
    const registry = new McpRegistry({ accessPolicy: () => true, validateAccess: () => returns.shift() });
    registry.register(new MixedAccess());
    expect(() => registry.validate()).not.toThrow();
  });

  it('aggregates every rejected entry into one error naming each origin', () => {
    const registry = new McpRegistry({
      accessPolicy: () => true,
      validateAccess: ({ group, mode }) => `no '${group}:${mode}' scope`,
    });
    registry.register(new MixedAccess());
    expect(() => registry.validate()).toThrow(
      /Invalid MCP registry: invalid access declarations: tool "declared_read" \(MixedAccess\.declaredRead\): no 'trips:read' scope, tool "declared_write" \(MixedAccess\.declaredWrite\): no 'places:write' scope/,
    );
  });

  it('composes with duplicate-name problems in the same aggregated error', () => {
    const registry = new McpRegistry({
      accessPolicy: () => true,
      validateAccess: ({ mode }) => (mode === 'write' ? 'bad group' : null),
    });
    registry.register(new Alpha());
    registry.register(new AlphaClone());
    expect(() => registry.validate()).toThrow(
      /duplicate MCP registrations: tool "alpha_one".*; invalid access declarations: tool "alpha_two" \(Alpha\.two\): bad group/,
    );
  });
});
