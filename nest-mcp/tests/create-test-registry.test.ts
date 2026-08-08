import { createTestRegistry, McpController, McpRegistry, Tool, type McpAccessPolicy } from '../src';
import type { TestCtx } from './harness';

import { describe, expect, it } from 'vitest';

@McpController()
class One {
  @Tool({ name: 'one_tool' })
  one() {}
}

@McpController()
class Two {
  @Tool({ name: 'two_tool', access: { group: 't', mode: 'write' } })
  two() {}
}

describe('createTestRegistry', () => {
  it('builds a registry from hand-constructed instances without a Nest app', () => {
    const registry = createTestRegistry([new One(), new Two()], { accessPolicy: () => true });
    expect(registry).toBeInstanceOf(McpRegistry);
    expect(registry.list().map((e) => e.name)).toEqual(['one_tool', 'two_tool']);
  });

  it('validates on construction (declarative access needs a policy)', () => {
    expect(() => createTestRegistry([new One(), new Two()])).toThrow(/no accessPolicy was configured/);
  });

  it('surfaces a validateAccess rejection on construction', () => {
    expect(() =>
      createTestRegistry([new Two()], {
        accessPolicy: () => true,
        validateAccess: ({ group, mode }) => `unknown group '${group}' (mode '${mode}')`,
      }),
    ).toThrow(/invalid access declarations: tool "two_tool" \(Two\.two\): unknown group 't' \(mode 'write'\)/);
  });

  it('forwards the accessPolicy option', () => {
    const calls: string[] = [];
    const policy: McpAccessPolicy = (access, ctx) => {
      calls.push(`${access.group}:${access.mode}:${(ctx as TestCtx).userId}`);
      return false;
    };
    const registry = createTestRegistry([new Two()], { accessPolicy: policy });
    // A denied entry is filtered before any server interaction, so a stub suffices.
    registry.attach({} as Parameters<McpRegistry['attach']>[0], { userId: 1 } as Parameters<McpRegistry['attach']>[1]);
    expect(calls).toEqual(['t:write:1']);
  });
});
