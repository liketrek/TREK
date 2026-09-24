import { readEnv } from '../app-config';
import { sessions } from './sessionManager';
import { invalidateMcpSessions, revokeUserSessions, revokeUserSessionsForClient } from './sessionManager';

export { invalidateMcpSessions, revokeUserSessions, revokeUserSessionsForClient };

/**
 * Process-wide MCP state: the tuning knobs, the per-user rate-limit window,
 * the session sweep, and the shutdown/invalidation entry points. The HTTP
 * transport itself lives behind the container (src/nest/mcp-transport/);
 * everything here is module-scoped ON PURPOSE — one sweep interval, one
 * rate-limit map and one session map per process, no matter how many
 * buildApp() instances the test workers create.
 */

// Configurable session TTL + SSE keep-alive cadence (#1414).
// Frozen at import on purpose (legacy timing) — MCP tuning knobs are boot-stable.
const mcpEnv = readEnv().mcp;
export const SESSION_TTL_MS = mcpEnv.sessionTtlMs;
export const MAX_SESSIONS_PER_USER = mcpEnv.maxSessionsPerUser;
export const KEEPALIVE_MS = mcpEnv.sseKeepaliveMs;

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = mcpEnv.rateLimitMax; // requests per minute per user

interface RateLimitEntry {
  count: number;
  windowStart: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

export function isRateLimited(userId: number, clientId: string | null): boolean {
  const key = `${userId}:${clientId ?? 'native'}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

const sessionSweepInterval = setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  let cleaned = 0;
  for (const [sid, session] of sessions) {
    if (session.lastActivity < cutoff) {
      try { session.server.close(); } catch { /* ignore */ }
      try { session.transport.close(); } catch { /* ignore */ }
      sessions.delete(sid);
      cleaned++;
    }
  }
  const rateCutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [key, entry] of rateLimitMap) {
    if (entry.windowStart < rateCutoff) rateLimitMap.delete(key);
  }
  if (cleaned > 0 || sessions.size > 0) {
    console.log(`[MCP] Session sweep: cleaned ${cleaned}, active ${sessions.size}`);
  }
}, 60 * 1000); // sweep every 1 minute

// Prevent the interval from keeping the process alive if nothing else is running
sessionSweepInterval.unref();

/** Close all active MCP sessions (call during graceful shutdown). */
export function closeMcpSessions(): void {
  clearInterval(sessionSweepInterval);
  for (const [, session] of sessions) {
    try { session.server.close(); } catch { /* ignore */ }
    try { session.transport.close(); } catch { /* ignore */ }
  }
  sessions.clear();
  rateLimitMap.clear();
}
