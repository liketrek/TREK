import { PluginRpcRegistry } from './registry';
import type { PluginRpcRegistryOptions } from './types';

/**
 * Builds a registry from hand-constructed `@PluginController()` instances, with no
 * Nest app required. This is why the metadata store is a WeakMap rather than
 * reflect-metadata: a bare vitest worker can assemble the same registry the
 * container would.
 */
export function createTestPluginRegistry(
  instances: readonly object[],
  options: PluginRpcRegistryOptions = {},
): PluginRpcRegistry {
  const registry = new PluginRpcRegistry(options);
  for (const instance of instances) registry.register(instance);
  // Same fail-fast contract as PluginRpcRegistryService.onModuleInit.
  registry.validate();
  return registry;
}
