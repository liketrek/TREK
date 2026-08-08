import { McpRegistry, type McpRegistryOptions } from './registry';

/**
 * Builds a registry from hand-constructed `@McpController()` instances —
 * no Nest app required. For test harnesses that assemble a bare `McpServer`
 * (e.g. over an in-memory transport).
 */
export function createTestRegistry(instances: readonly object[], options: McpRegistryOptions = {}): McpRegistry {
  const registry = new McpRegistry(options);
  for (const instance of instances) registry.register(instance);
  // Same fail-fast contract as McpRegistryService.onModuleInit.
  registry.validate();
  return registry;
}
