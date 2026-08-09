/**
 * The metadata store under the plugin RPC decorators. It is a WeakMap/WeakSet keyed
 * by constructor rather than reflect-metadata, so these tests run without a Nest app
 * and without any polyfill import order to get right.
 */
import { describe, it, expect } from 'vitest';
import {
  addEntry,
  getEntry,
  isPluginController,
  markController,
  type ClassRef,
} from '../../../../src/nest/plugins/host/rpc-kit/metadata';
import type { PluginRpcEntry } from '../../../../src/nest/plugins/host/rpc-kit/types';

const methodEntry = (methodName: string, method: 'tags.list' | 'tags.create' = 'tags.list'): PluginRpcEntry => ({
  kind: 'method',
  methodName,
  method,
  permission: method === 'tags.list' ? 'db:read:tags' : 'db:write:tags',
});

describe('rpc-kit metadata store', () => {
  it('RPCKIT-META-001 an unmarked class is not a plugin controller', () => {
    class Plain {}
    expect(isPluginController(Plain)).toBe(false);
  });

  it('RPCKIT-META-002 markController makes the class recognisable', () => {
    class Marked {}
    markController(Marked as unknown as ClassRef);
    expect(isPluginController(Marked)).toBe(true);
  });

  it('RPCKIT-META-003 a non-function is never a controller', () => {
    expect(isPluginController({})).toBe(false);
    expect(isPluginController(undefined)).toBe(false);
    expect(isPluginController('Marked')).toBe(false);
  });

  it('RPCKIT-META-004 an entry is retrievable by its method name', () => {
    class Holder {}
    const entry = methodEntry('list');
    addEntry(Holder as unknown as ClassRef, entry);
    expect(getEntry(Holder as unknown as ClassRef, 'list')).toBe(entry);
  });

  it('RPCKIT-META-005 an unknown method name resolves to undefined', () => {
    class Holder {}
    addEntry(Holder as unknown as ClassRef, methodEntry('list'));
    expect(getEntry(Holder as unknown as ClassRef, 'missing')).toBeUndefined();
  });

  it('RPCKIT-META-006 a second entry for the same name replaces the first', () => {
    class Holder {}
    addEntry(Holder as unknown as ClassRef, methodEntry('list'));
    const second = methodEntry('list', 'tags.create');
    addEntry(Holder as unknown as ClassRef, second);
    expect(getEntry(Holder as unknown as ClassRef, 'list')).toBe(second);
  });

  it('RPCKIT-META-007 entries are found on a subclass through the prototype chain', () => {
    class Base {}
    class Child extends Base {}
    const entry = methodEntry('list');
    addEntry(Base as unknown as ClassRef, entry);
    expect(getEntry(Child as unknown as ClassRef, 'list')).toBe(entry);
  });

  it('RPCKIT-META-008 a subclass entry wins over the inherited one', () => {
    class Base {}
    class Child extends Base {}
    addEntry(Base as unknown as ClassRef, methodEntry('list'));
    const own = methodEntry('list', 'tags.create');
    addEntry(Child as unknown as ClassRef, own);
    expect(getEntry(Child as unknown as ClassRef, 'list')).toBe(own);
  });

  it('RPCKIT-META-009 walking the chain stops cleanly at the root', () => {
    class Lonely {}
    expect(getEntry(Lonely as unknown as ClassRef, 'anything')).toBeUndefined();
  });

  it('RPCKIT-META-010 two classes keep separate entry maps', () => {
    class A {}
    class B {}
    const a = methodEntry('list');
    const b = methodEntry('list', 'tags.create');
    addEntry(A as unknown as ClassRef, a);
    addEntry(B as unknown as ClassRef, b);
    expect(getEntry(A as unknown as ClassRef, 'list')).toBe(a);
    expect(getEntry(B as unknown as ClassRef, 'list')).toBe(b);
  });
});
