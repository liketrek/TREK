/**
 * MCP test harness.
 *
 * Creates an McpServer + MCP Client connected via InMemoryTransport for unit testing
 * tools and resources without HTTP overhead.
 *
 * Usage:
 *   const harness = await createMcpHarness({ userId, registerTools: true });
 *   const result = await harness.client.callTool({ name: 'create_trip', arguments: { title: 'Test' } });
 *   await harness.cleanup();
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import { registerResources } from '../../src/mcp/resources';
import { registerTools } from '../../src/mcp/tools';
import { setMcpRegistry } from '../../src/mcp/registry-handoff';
import { createMcpTestRegistry } from './mcp-test-controllers';

export interface McpHarness {
  client: Client;
  server: McpServer;
  cleanup: () => Promise<void>;
}

export interface McpHarnessOptions {
  userId: number;
  /** Register read-only resources (default: true) */
  withResources?: boolean;
  /** Register read-write tools (default: true) */
  withTools?: boolean;
  /** OAuth scopes to restrict tools; null = full access (default: null) */
  scopes?: string[] | null;
  /** Whether the session is authenticated via a static API token (default: false) */
  isStaticToken?: boolean;
  /** Fire-once deprecation-notice closure (default: registerTools' () => null) */
  getDeprecationNotice?: () => string | null;
}

export async function createMcpHarness(options: McpHarnessOptions): Promise<McpHarness> {
  const { userId, withResources = true, withTools = true, scopes = null, isStaticToken = false, getDeprecationNotice } = options;

  const server = new McpServer({ name: 'trek-test', version: '1.0.0' });

  if (withResources) registerResources(server, userId);
  if (withTools) {
    // In production bootstrap.ts hands the Nest-discovered registry to
    // registerTools after app.init(); the harness has no Nest app, so it
    // builds the same registry by hand (see mcp-test-controllers.ts).
    // registerTools' own ctx construction stays exercised.
    setMcpRegistry(createMcpTestRegistry());
    registerTools(server, userId, scopes ?? null, isStaticToken, getDeprecationNotice);
  }

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({ name: 'test-client', version: '1.0.0' });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const cleanup = async () => {
    try { await client.close(); } catch { /* ignore */ }
    try { await server.close(); } catch { /* ignore */ }
  };

  return { client, server, cleanup };
}

/** Parse JSON from a callTool result (first text content item). */
export function parseToolResult(result: Awaited<ReturnType<Client['callTool']>>): unknown {
  const text = result.content.find((c: { type: string }) => c.type === 'text') as { type: 'text'; text: string } | undefined;
  if (!text) throw new Error('No text content in tool result');
  return JSON.parse(text.text);
}

/** Parse JSON from a readResource result (first content item). */
export function parseResourceResult(result: Awaited<ReturnType<Client['readResource']>>): unknown {
  const item = result.contents[0] as { text?: string } | undefined;
  if (!item?.text) throw new Error('No text content in resource result');
  return JSON.parse(item.text);
}
