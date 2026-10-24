import { McpRegistryService, type McpRegistry } from '../../src/nest-mcp';
import type { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { bootTestApp } from './test-app';

/**
 * The MCP registry the MCP harness attaches, taken from the booted
 * application container (tests/helpers/test-app.ts): the same
 * McpRegistryService production builds, with every @McpController the
 * container discovers and the policy AppModule hands McpModule.forRoot (the
 * access policy, the demo tool gate, the error mapper).
 *
 * It used to be a hand-wired copy of that graph, one positional constructor
 * call per service, which every new dependency broke. Booting the container
 * once per file costs about what building the copy did per harness.
 *
 * Pass the suite's FakeRealtimeService to assert on broadcasts.
 */
export async function createMcpTestRegistry(realtime?: RealtimeService): Promise<McpRegistry> {
  return (await bootTestApp(realtime)).get(McpRegistryService);
}
