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
import { registerTools } from '../../src/mcp/tools';
import type { McpAttachOptions } from '../../src/nest-mcp';
import { createMcpTestRegistry } from './mcp-test-controllers';

export interface McpHarness {
  client: Client;
  server: McpServer;
  cleanup: () => Promise<void>;
}

export interface McpHarnessOptions {
  userId: number;
  /**
   * Inert since the journey resources moved onto the nest-mcp registry
   * (src/mcp/resources.ts is gone): every resource now rides `withTools`,
   * like tools-vacay.test.ts has always documented. Accepted so the ~26
   * suites passing it keep compiling; remove opportunistically.
   */
  withResources?: boolean;
  /** Register read-write tools (default: true) */
  withTools?: boolean;
  /** OAuth scopes to restrict tools; null = full access (default: null) */
  scopes?: string[] | null;
  /** Whether the session is authenticated via a static API token (default: false) */
  isStaticToken?: boolean;
  /** Fire-once deprecation-notice closure (default: registerTools' () => null) */
  getDeprecationNotice?: () => string | null;
  /**
   * Host-contributed tools for this session. Passed explicitly so a suite never
   * has to install the process-level plugin source to exercise the path; left
   * undefined, registerTools resolves it to that source, which is unset in
   * every suite that does not register one.
   */
  dynamicTools?: McpAttachOptions['dynamicTools'];
}

export async function createMcpHarness(options: McpHarnessOptions): Promise<McpHarness> {
  const { userId, withTools = true, scopes = null, isStaticToken = false, getDeprecationNotice, dynamicTools } = options;

  const server = new McpServer({ name: 'trek-test', version: '1.0.0' });

  if (withTools) {
    // In production the transport service passes its injected
    // McpRegistryService to registerTools; the harness has no Nest app, so it
    // builds the same registry by hand (see mcp-test-controllers.ts).
    // registerTools' own ctx construction stays exercised.
    registerTools(createMcpTestRegistry(), server, userId, scopes ?? null, isStaticToken, getDeprecationNotice, undefined, dynamicTools);
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

/**
 * callTool is declared as a union of the current result shape and the legacy
 * `toolResult` compatibility shape. Reading `content` off the union yields
 * unknown, because the compatibility branch only has an index signature.
 */
type ToolCallResult = Awaited<ReturnType<Client['callTool']>>;
type ToolCallContentResult = Extract<ToolCallResult, { content: unknown[] }>;
type ToolTextContent = Extract<ToolCallContentResult['content'][number], { type: 'text' }>;

/** Parse JSON from a callTool result (first text content item). */
export function parseToolResult(result: ToolCallResult): unknown {
  // Our own McpServer always answers with the content shape, never the
  // compatibility one, so pick that branch of the union.
  const { content } = result as ToolCallContentResult;
  const text = content.find((c): c is ToolTextContent => c.type === 'text');
  if (!text) throw new Error('No text content in tool result');
  return JSON.parse(text.text);
}

/** Parse JSON from a readResource result (first content item). */
export function parseResourceResult(result: Awaited<ReturnType<Client['readResource']>>): unknown {
  const item = result.contents[0] as { text?: string } | undefined;
  if (!item?.text) throw new Error('No text content in resource result');
  return JSON.parse(item.text);
}
