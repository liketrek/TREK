import type { McpAccessPolicy } from '@trek/nest-mcp';
import { canRead, canWrite } from './scopes';

/**
 * TREK's context shape for @trek/nest-mcp handlers, predicates and the
 * access policy — mirrors what registerTools() receives per session.
 */
declare module '@trek/nest-mcp' {
  interface McpContext {
    userId: number;
    scopes: string[] | null;
    isStaticToken: boolean;
  }
}

/**
 * Resolves declarative `access: { group, mode }` markers with the exact
 * scopes.ts semantics the legacy registrars used at registration time:
 * null scopes ⇒ full access; read ⇒ `group:read` OR `group:write`;
 * write ⇒ `group:write`. Single source for production (AppModule) and the
 * MCP test harness.
 */
export const trekMcpAccessPolicy: McpAccessPolicy = ({ group, mode }, ctx) =>
  mode === 'write' ? canWrite(ctx.scopes, group) : canRead(ctx.scopes, group);
