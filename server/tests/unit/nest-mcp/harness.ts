import type { McpAttachOptions, McpContext, McpRegistry } from '../../../src/nest-mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';

/** Test context shape — stands in for whatever a host app augments McpContext with. */
export interface TestCtx {
  userId?: number;
  canRead?: boolean;
  canWrite?: boolean;
  allow?: boolean;
}

export const asCtx = (ctx: TestCtx): McpContext => ctx as McpContext;

export interface AttachHarness {
  client: Client;
  server: McpServer;
  cleanup: () => Promise<void>;
}

/** Bare McpServer + Client over an in-memory transport with the registry attached. */
export async function createAttachHarness(
  registry: McpRegistry,
  ctx: TestCtx,
  opts?: McpAttachOptions,
): Promise<AttachHarness> {
  const server = new McpServer({ name: 'nest-mcp-test', version: '1.0.0' });
  registry.attach(server, asCtx(ctx), opts);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const cleanup = async () => {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    try {
      await server.close();
    } catch {
      /* ignore */
    }
  };
  return { client, server, cleanup };
}
