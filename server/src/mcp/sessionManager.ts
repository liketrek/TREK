import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp';

export interface McpSession {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  userId: number;
  /** null = static trek_ token or JWT (full access); string[] = OAuth 2.1 scopes */
  scopes: string[] | null;
  /** OAuth 2.1 client_id that owns this session; null for static-token / JWT sessions */
  clientId: string | null;
  /** true when authenticated via static trek_ token — triggers deprecation prompt */
  isStaticToken: boolean;
  lastActivity: number;
}

export const sessions = new Map<string, McpSession>();

/** Close both halves of a session and drop it from the map. Close errors are non-fatal:
 *  a transport whose socket is already gone must not block eviction of the map entry. */
function closeSession(sid: string, session: McpSession): void {
  try { session.server.close(); } catch { /* ignore */ }
  try { session.transport.close(); } catch { /* ignore */ }
  sessions.delete(sid);
}

/** Terminate all active MCP sessions for a specific user (e.g. on token revocation). */
export function revokeUserSessions(userId: number): void {
  for (const [sid, session] of sessions) {
    if (session.userId === userId) closeSession(sid, session);
  }
}

/** Terminate MCP sessions for a specific (user, OAuth client) pair.
 *  Used when an OAuth token or session is revoked so only the affected client's
 *  sessions are closed, not sessions from other clients for the same user. */
export function revokeUserSessionsForClient(userId: number, clientId: string): void {
  for (const [sid, session] of sessions) {
    if (session.userId === userId && session.clientId === clientId) closeSession(sid, session);
  }
}

/**
 * Close the least-recently-active session for a user so a new one can take its slot,
 * and return its id (null when the user has no sessions).
 *
 * This is what keeps the per-user cap from becoming a dead end. A client that cannot
 * persist its Mcp-Session-Id — a proxy stripping the header, a non-conformant client —
 * re-initializes on every call, and a hard cap would leave the user permanently unable
 * to open a session until the process restarted. Evicting the coldest session instead
 * means the worst case is a bounded ring of sessions, not a wedged integration.
 */
export function evictOldestSessionForUser(userId: number): string | null {
  let oldestSid: string | null = null;
  let oldestSession: McpSession | null = null;
  for (const [sid, session] of sessions) {
    if (session.userId !== userId) continue;
    if (!oldestSession || session.lastActivity < oldestSession.lastActivity) {
      oldestSid = sid;
      oldestSession = session;
    }
  }
  if (!oldestSid || !oldestSession) return null;
  closeSession(oldestSid, oldestSession);
  return oldestSid;
}
