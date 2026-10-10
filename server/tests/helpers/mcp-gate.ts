/**
 * Calls one decorated MCP tool method the way a session reaches it: behind the
 * demo gate the registry puts in front of every registered tool. For suites
 * that build a controller with stubs and call its methods directly, so they
 * keep their stubs instead of attaching a whole registry (which would also run
 * the `when` gates those stubs cannot answer).
 */
import { getEntry, type ClassRef } from '../../src/nest-mcp/metadata';
import { trekDemoToolGate } from '../../src/mcp/nest-mcp-policy';
import type { McpContext } from '../../src/nest-mcp';

export async function callGatedTool(
  instance: object,
  methodName: string,
  args: unknown,
  ctx: McpContext,
  isDemoUser: (userId: number) => Promise<boolean>,
): Promise<unknown> {
  const entry = getEntry((instance as { constructor: ClassRef }).constructor, methodName);
  if (entry?.kind !== 'tool') throw new Error(`${methodName} is not a decorated tool`);
  const refusal = await trekDemoToolGate(isDemoUser)(entry.options, ctx);
  if (refusal !== undefined) return refusal;
  const method = (instance as Record<string, (a: unknown, c: McpContext) => unknown>)[methodName];
  return method.call(instance, args, ctx);
}
