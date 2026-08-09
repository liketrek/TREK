import type { PluginRpcEntry } from './types';

/**
 * Metadata store. A package-private WeakMap/WeakSet keyed by class constructor
 * instead of reflect-metadata: it has zero runtime prerequisites (no polyfill
 * import order to get right), works in bare vitest workers and in
 * `createTestPluginRegistry` without a Nest app, and is trivially
 * extraction-clean. Same reasoning as nest-mcp's metadata store.
 */

/** A class constructor, without using the banned bare `Function` type. */
export type ClassRef = abstract new (...args: never[]) => unknown;

const controllers = new WeakSet<ClassRef>();
const entries = new WeakMap<ClassRef, Map<string, PluginRpcEntry>>();

export function markController(ctor: ClassRef): void {
  controllers.add(ctor);
}

export function isPluginController(ctor: unknown): ctor is ClassRef {
  return typeof ctor === 'function' && controllers.has(ctor as ClassRef);
}

export function addEntry(ctor: ClassRef, entry: PluginRpcEntry): void {
  let map = entries.get(ctor);
  if (!map) {
    map = new Map();
    entries.set(ctor, map);
  }
  map.set(entry.methodName, entry);
}

/**
 * Look up the entry recorded for `methodName`, walking the constructor prototype
 * chain so inherited decorated methods are found on subclasses.
 */
export function getEntry(ctor: ClassRef, methodName: string): PluginRpcEntry | undefined {
  let current: ClassRef | null = ctor;
  while (current) {
    const found = entries.get(current)?.get(methodName);
    if (found) return found;
    const parent: unknown = Object.getPrototypeOf(current);
    current = typeof parent === 'function' ? (parent as ClassRef) : null;
  }
  return undefined;
}
